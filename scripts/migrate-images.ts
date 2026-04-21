/**
 * scripts/migrate-images.ts
 *
 * ONE-TIME migration script — converts all existing Cloudinary images to
 * optimized WebP variants and populates the MediaAsset table.
 *
 * SAFE TO RE-RUN: Skips records already linked to a MediaAsset (isMigrated check).
 *
 * Usage:
 *   npx ts-node --project tsconfig.json scripts/migrate-images.ts
 *   npx ts-node --project tsconfig.json scripts/migrate-images.ts --dry-run
 *
 * Flags:
 *   --dry-run     Log what would happen without writing anything to DB or Cloudinary
 *   --limit N     Process at most N images (useful for partial runs / testing)
 */

import { PrismaClient, type Prisma } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import https from "https";
import { v4 as uuidv4 } from "uuid";
import {
    processImage,
    buildVariantPublicId,
    getFolderForType,
    type AssetType,
    type VariantResult,
} from "../lib/image-pipeline";

// ─── Environment ──────────────────────────────────────────────────────────────
// Load .env manually (ts-node doesn't use Next.js env loading)
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env" });

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true,
});

const prisma = new PrismaClient({ log: ["warn", "error"] });

// ─── CLI Flags ────────────────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes("--dry-run");
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg !== -1 ? parseInt(process.argv[limitArg + 1] ?? "0", 10) : 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function downloadToBuffer(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            const chunks: Buffer[] = [];
            res.on("data", (chunk: Buffer) => chunks.push(chunk));
            res.on("end", () => resolve(Buffer.concat(chunks)));
            res.on("error", reject);
        }).on("error", reject);
    });
}

function uploadBufferToCloudinary(
    buffer: Buffer,
    publicId: string
): Promise<{ secure_url: string; bytes: number }> {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { public_id: publicId, resource_type: "image", overwrite: true },
            (err, result) => {
                if (err || !result) reject(err ?? new Error("No result"));
                else resolve({ secure_url: result.secure_url, bytes: result.bytes });
            }
        );
        stream.end(buffer);
    });
}

// ─── Migration ────────────────────────────────────────────────────────────────

interface MigrationStats {
    processed: number;
    skipped:   number;
    failed:    number;
    savedBytes: number;
}

async function migrateProductImages(stats: MigrationStats): Promise<void> {
    const images = await prisma.productImage.findMany({
        where: { mediaAssetId: null },   // Only unmigrated
        take: LIMIT > 0 ? LIMIT : undefined,
        orderBy: { createdAt: "asc" },
    });

    console.log(`\n📦 ProductImages to migrate: ${images.length}`);

    for (const img of images) {
        const label = `ProductImage[${img.id}] → ${img.url.slice(0, 60)}…`;
        try {
            if (DRY_RUN) {
                console.log(`  [DRY-RUN] Would migrate ${label}`);
                stats.skipped++;
                continue;
            }

            console.log(`  ↳ Downloading…`);
            const rawBuffer = await downloadToBuffer(img.url);

            console.log(`  ↳ Processing with sharp (PRODUCT)…`);
            const pipeline = await processImage(rawBuffer, "PRODUCT");

            const basePublicId = `${getFolderForType("PRODUCT")}/${uuidv4()}`;
            const variantUrls: Record<string, string> = {};
            const variantSizes: Record<string, number> = {};
            const variantDims: Record<string, string> = {};

            for (const variant of pipeline.variants) {
                const pubId = buildVariantPublicId(basePublicId, variant.key);
                const result = await uploadBufferToCloudinary(variant.buffer, pubId);
                variantUrls[variant.key] = result.secure_url;
                variantSizes[variant.key] = variant.bytes;
                variantDims[variant.key] = `${variant.width}x${variant.height}`;
            }

            const totalOptimized = Object.values(variantSizes).reduce((a, b) => a + b, 0);
            const saved = rawBuffer.length - totalOptimized;

            const mediaAsset = await prisma.mediaAsset.create({
                data: {
                    publicId:     basePublicId,
                    originalName: img.url.split("/").pop() ?? "unknown",
                    assetType:    "PRODUCT",
                    isMigrated:   true,
                    desktopUrl:   variantUrls["desktop"] ?? null,
                    mobileUrl:    variantUrls["mobile"]  ?? null,
                    largeUrl:     variantUrls["large"]   ?? null,
                    mediumUrl:    variantUrls["medium"]  ?? null,
                    thumbUrl:     variantUrls["thumb"]   ?? null,
                    blurUrl:      variantUrls["blur"]    ?? null,
                    variantSizes: variantSizes as Prisma.InputJsonValue,
                    variantDims:  variantDims  as Prisma.InputJsonValue,
                    originalBytes:  rawBuffer.length,
                    totalSaved:     saved,
                    conversionMs:   pipeline.conversionMs,
                },
            });

            await prisma.productImage.update({
                where: { id: img.id },
                data:  { mediaAssetId: mediaAsset.id },
            });

            stats.savedBytes += saved;
            stats.processed++;
            console.log(
                `  ✅ Done | saved ${(saved / 1024).toFixed(0)} KB | ` +
                `${pipeline.variants.length} variants | ${pipeline.conversionMs}ms`
            );

            if (pipeline.warnings.length > 0) {
                pipeline.warnings.forEach((w) => console.warn(`    ⚠️  ${w}`));
            }

        } catch (err) {
            console.error(`  ❌ Failed: ${label}`, err instanceof Error ? err.message : err);
            stats.failed++;
        }
    }
}

async function main() {
    console.log("═══════════════════════════════════════════════════════════");
    console.log("  VASTRAA VERSE — Image Migration to WebP Pipeline");
    console.log(`  Mode: ${DRY_RUN ? "DRY-RUN (no changes will be made)" : "LIVE"}`);
    if (LIMIT > 0) console.log(`  Limit: ${LIMIT} images`);
    console.log("═══════════════════════════════════════════════════════════\n");

    const stats: MigrationStats = {
        processed:  0,
        skipped:    0,
        failed:     0,
        savedBytes: 0,
    };

    await migrateProductImages(stats);

    // ── Summary ──────────────────────────────────────────────────────────────
    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("  MIGRATION COMPLETE");
    console.log(`  ✅ Processed : ${stats.processed}`);
    console.log(`  ⏭  Skipped   : ${stats.skipped}`);
    console.log(`  ❌ Failed    : ${stats.failed}`);
    console.log(`  💾 Total saved: ${(stats.savedBytes / 1_048_576).toFixed(2)} MB`);
    console.log("═══════════════════════════════════════════════════════════\n");
}

main()
    .catch((err) => {
        console.error("Fatal migration error:", err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
