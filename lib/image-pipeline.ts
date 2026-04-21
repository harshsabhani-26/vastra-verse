/**
 * lib/image-pipeline.ts
 *
 * Core image optimization pipeline using sharp.
 * Converts any uploaded JPG/PNG/WebP to multiple WebP variants
 * entirely in memory — no disk writes, no temp files.
 *
 * Variant specs per asset type:
 *
 * HERO    → desktop (1920w), mobile (768w), blur (20w)
 * PRODUCT → large (800x1000), medium (400x500), thumb (150x188), blur (20w)
 * CATEGORY→ desktop (600x400), mobile (400x267), thumb (150x100)
 * BANNER  → desktop (1440w), mobile (768w), blur (20w)
 */

import sharp from "sharp";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AssetType = "HERO" | "PRODUCT" | "CATEGORY" | "BANNER";

export interface VariantResult {
    key: string;           // e.g. "desktop" | "mobile" | "large" | "thumb" | "blur"
    buffer: Buffer;
    width: number;
    height: number;
    bytes: number;
    format: "webp";
}

export interface PipelineResult {
    variants: VariantResult[];
    originalBytes: number;
    conversionMs: number;
    warnings: string[];
}

// ─── Validation ───────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/avif",
] as const;

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateImageUpload(
    mimeType: string,
    bytes: number
): { valid: true } | { valid: false; reason: string } {
    if (!ALLOWED_MIME_TYPES.includes(mimeType as (typeof ALLOWED_MIME_TYPES)[number])) {
        return {
            valid: false,
            reason: `Invalid file type "${mimeType}". Only JPG, PNG, WebP, and AVIF images are accepted.`,
        };
    }
    if (bytes > MAX_IMAGE_BYTES) {
        return {
            valid: false,
            reason: `File size ${(bytes / 1_048_576).toFixed(1)} MB exceeds the 10 MB limit.`,
        };
    }
    return { valid: true };
}

// ─── Variant Specs ────────────────────────────────────────────────────────────

interface VariantSpec {
    key: string;
    width?: number;
    height?: number;
    fit?: keyof sharp.FitEnum;
    quality: number;
}

const SPECS: Record<AssetType, VariantSpec[]> = {
    HERO: [
        { key: "desktop", width: 1920,                quality: 85, fit: "inside" },
        { key: "mobile",  width: 768,                 quality: 85, fit: "inside" },
        { key: "blur",    width: 20,                  quality: 20, fit: "inside" },
    ],
    PRODUCT: [
        { key: "large",   width: 800,  height: 1000,  quality: 85, fit: "cover"  },
        { key: "medium",  width: 400,  height: 500,   quality: 80, fit: "cover"  },
        { key: "thumb",   width: 150,  height: 188,   quality: 75, fit: "cover"  },
        { key: "blur",    width: 20,                  quality: 20, fit: "inside" },
    ],
    CATEGORY: [
        { key: "desktop", width: 600,  height: 400,   quality: 85, fit: "cover"  },
        { key: "mobile",  width: 400,  height: 267,   quality: 80, fit: "cover"  },
        { key: "thumb",   width: 150,  height: 100,   quality: 75, fit: "cover"  },
    ],
    BANNER: [
        { key: "desktop", width: 1440,                quality: 85, fit: "inside" },
        { key: "mobile",  width: 768,                 quality: 85, fit: "inside" },
        { key: "blur",    width: 20,                  quality: 20, fit: "inside" },
    ],
};

// ─── Low-resolution warning threshold ─────────────────────────────────────────

const MIN_DIMENSIONS: Record<AssetType, { w: number; h: number }> = {
    HERO:     { w: 1280, h: 400  },
    PRODUCT:  { w: 500,  h: 600  },
    CATEGORY: { w: 400,  h: 267  },
    BANNER:   { w: 900,  h: 300  },
};

// ─── Core Pipeline ────────────────────────────────────────────────────────────

/**
 * Processes a raw image Buffer through all variants for the given asset type.
 * Returns all variants as in-memory Buffers alongside performance metadata.
 * Never writes to disk.
 */
export async function processImage(
    inputBuffer: Buffer,
    assetType: AssetType
): Promise<PipelineResult> {
    const start = performance.now();
    const warnings: string[] = [];

    // Read metadata once to check source resolution
    const meta = await sharp(inputBuffer).metadata();
    const srcW = meta.width ?? 0;
    const srcH = meta.height ?? 0;
    const minDim = MIN_DIMENSIONS[assetType];

    if (srcW < minDim.w || srcH < minDim.h) {
        warnings.push(
            `Source image is low resolution (${srcW}×${srcH}). ` +
            `Recommended minimum for ${assetType}: ${minDim.w}×${minDim.h}.`
        );
    }

    const specs = SPECS[assetType];

    // Process all variants concurrently
    const variantResults = await Promise.all(
        specs.map(async (spec): Promise<VariantResult> => {
            let pipeline = sharp(inputBuffer);

            // Resize
            pipeline = pipeline.resize({
                width: spec.width,
                height: spec.height,
                fit: spec.fit ?? "inside",
                withoutEnlargement: true,
            });

            // Convert to WebP
            pipeline = pipeline.webp({ quality: spec.quality });

            const outputBuffer = await pipeline.toBuffer({ resolveWithObject: false });

            // Get output dimensions
            const outMeta = await sharp(outputBuffer).metadata();

            return {
                key: spec.key,
                buffer: outputBuffer,
                width: outMeta.width ?? 0,
                height: outMeta.height ?? 0,
                bytes: outputBuffer.length,
                format: "webp",
            };
        })
    );

    return {
        variants: variantResults,
        originalBytes: inputBuffer.length,
        conversionMs: Math.round(performance.now() - start),
        warnings,
    };
}

// ─── Naming Helper ────────────────────────────────────────────────────────────

/**
 * Builds the Cloudinary public_id for a specific variant.
 * Pattern: vastra/{folder}/{baseId}-{variantKey}
 * Example: vastra/products/abc123-thumb
 */
export function buildVariantPublicId(
    basePublicId: string,
    variantKey: string
): string {
    return `${basePublicId}-${variantKey}`;
}

/**
 * Returns the Cloudinary folder prefix for an asset type.
 */
export function getFolderForType(assetType: AssetType): string {
    const map: Record<AssetType, string> = {
        HERO:     "vastra/hero",
        PRODUCT:  "vastra/products",
        CATEGORY: "vastra/categories",
        BANNER:   "vastra/banners",
    };
    return map[assetType];
}
