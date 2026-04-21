import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import cloudinary, { type CloudinaryUploadResult } from "@/lib/cloudinary";
import prisma from "@/lib/prisma";
import {
    processImage,
    validateImageUpload,
    buildVariantPublicId,
    getFolderForType,
    type AssetType,
    type VariantResult,
} from "@/lib/image-pipeline";

// Prevent Next.js from caching upload responses
export const dynamic = "force-dynamic";

// ─── Allowed video types (pass-through — no sharp processing) ─────────────────
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];

// ─── Map the incoming folder param → AssetType ────────────────────────────────
const FOLDER_TO_ASSET_TYPE: Record<string, AssetType> = {
    hero:       "HERO",
    banners:    "HERO",   // legacy alias
    products:   "PRODUCT",
    categories: "CATEGORY",
    banner:     "BANNER",
};

// ─── Upload one WebP buffer to Cloudinary via streaming ───────────────────────
function uploadBufferToCloudinary(
    buffer: Buffer,
    publicId: string,
    resourceType: "image" | "video" = "image"
): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                public_id: publicId,
                resource_type: resourceType,
                // Do NOT pass quality/fetch_format — we deliver pre-optimized WebP
                overwrite: true,
                invalidate: true,
            },
            (error, result) => {
                if (error || !result) {
                    reject(error ?? new Error("Cloudinary returned no result"));
                } else {
                    resolve(result as CloudinaryUploadResult);
                }
            }
        );
        stream.end(buffer);
    });
}

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    const startTime = performance.now();

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

        // ── Video pass-through (no sharp processing) ──────────────────────────
        if (isVideo) {
            const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
            if (file.size > MAX_VIDEO_SIZE) {
                return NextResponse.json(
                    { error: "Video file size must be less than 50 MB" },
                    { status: 400 }
                );
            }

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const publicId = `vastra/videos/${uuidv4()}`;

            const result = await uploadBufferToCloudinary(buffer, publicId, "video");

            const duration = Math.round(performance.now() - startTime);
            console.log(`✅ Video upload completed in ${duration}ms | ${result.public_id} | ${result.bytes} bytes`);

            return NextResponse.json({
                url: result.secure_url,
                public_id: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format,
                bytes: result.bytes,
            });
        }

        // ── Image path — validate ─────────────────────────────────────────────
        const validation = validateImageUpload(file.type, file.size);
        if (!validation.valid) {
            return NextResponse.json({ error: validation.reason }, { status: 400 });
        }

        // Determine asset type from folder param
        const folder = (formData.get("folder") as string | null) ?? "";
        const assetType: AssetType = FOLDER_TO_ASSET_TYPE[folder] ?? "PRODUCT";

        // Read raw bytes into memory
        const rawBuffer = Buffer.from(await file.arrayBuffer());

        // ── Run image pipeline (all variants generated in-memory) ─────────────
        const pipelineResult = await processImage(rawBuffer, assetType);

        if (pipelineResult.warnings.length > 0) {
            pipelineResult.warnings.forEach((w) =>
                console.warn(`⚠️  Image pipeline warning: ${w}`)
            );
        }

        // ── Upload all WebP variants to Cloudinary concurrently ───────────────
        const basePublicId = `${getFolderForType(assetType)}/${uuidv4()}`;

        const uploadResults = await Promise.all(
            pipelineResult.variants.map((variant: VariantResult) =>
                uploadBufferToCloudinary(
                    variant.buffer,
                    buildVariantPublicId(basePublicId, variant.key)
                )
            )
        );

        // Build maps of variant key → metadata
        const variantUrls: Record<string, string> = {};
        const variantSizes: Record<string, number> = {};
        const variantDims: Record<string, string> = {};

        pipelineResult.variants.forEach((variant, i) => {
            variantUrls[variant.key] = uploadResults[i].secure_url;
            variantSizes[variant.key] = variant.bytes;
            variantDims[variant.key] = `${variant.width}x${variant.height}`;
        });

        const totalOptimizedBytes = Object.values(variantSizes).reduce((a, b) => a + b, 0);
        const savedBytes = pipelineResult.originalBytes - totalOptimizedBytes;

        // ── Persist MediaAsset record in Prisma ───────────────────────────────
        const mediaAsset = await prisma.mediaAsset.create({
            data: {
                publicId:     basePublicId,
                originalName: file.name,
                assetType,
                desktopUrl:   variantUrls["desktop"] ?? null,
                mobileUrl:    variantUrls["mobile"]  ?? null,
                largeUrl:     variantUrls["large"]   ?? null,
                mediumUrl:    variantUrls["medium"]  ?? null,
                thumbUrl:     variantUrls["thumb"]   ?? null,
                blurUrl:      variantUrls["blur"]    ?? null,
                variantSizes,
                variantDims,
                originalBytes:  pipelineResult.originalBytes,
                totalSaved:     savedBytes,
                conversionMs:   pipelineResult.conversionMs,
            },
        });

        const duration = Math.round(performance.now() - startTime);
        console.log(
            `✅ Image pipeline completed in ${duration}ms | ` +
            `${pipelineResult.variants.length} variants | ` +
            `saved ${(savedBytes / 1024).toFixed(0)} KB | ` +
            `conversion: ${pipelineResult.conversionMs}ms`
        );

        // ── Return full asset object to admin panel ────────────────────────────
        // Primary URL = largest useful variant for backward compatibility
        const primaryUrl =
            variantUrls["large"] ??
            variantUrls["desktop"] ??
            variantUrls["medium"] ??
            Object.values(variantUrls)[0];

        return NextResponse.json({
            // Backward-compatible fields (existing admin forms still work)
            url:       primaryUrl,
            public_id: basePublicId,

            // New MediaAsset data
            mediaAsset: {
                id:           mediaAsset.id,
                assetType,
                desktopUrl:   mediaAsset.desktopUrl,
                mobileUrl:    mediaAsset.mobileUrl,
                largeUrl:     mediaAsset.largeUrl,
                mediumUrl:    mediaAsset.mediumUrl,
                thumbUrl:     mediaAsset.thumbUrl,
                blurUrl:      mediaAsset.blurUrl,
                variantSizes,
                variantDims,
                originalBytes:  pipelineResult.originalBytes,
                totalSaved:     savedBytes,
                conversionMs:   pipelineResult.conversionMs,
            },

            // Summary for admin UI
            warnings: pipelineResult.warnings,
        });

    } catch (error) {
        const msg = error instanceof Error ? error.message : "Failed to process upload";
        console.error(`❌ Upload pipeline failed: ${msg}`);
        return NextResponse.json(
            { error: "Image processing failed. The file was not saved.", details: msg },
            { status: 500 }
        );
    }
}
