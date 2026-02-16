/**
 * Image Validation Utilities
 * 
 * Production-grade validation for image uploads to Supabase Storage.
 * Ensures consistent quality and format across product, category, and banner images.
 */

// ─── Image Type Configurations ──────────────────────────────────────────────

export type ImageType = 'product' | 'category' | 'hero-banner';

export interface ImageConfig {
    /** Max file size in bytes */
    maxFileSize: number;
    /** Allowed MIME types */
    allowedFormats: string[];
    /** Recommended width in pixels */
    recommendedWidth: number;
    /** Recommended height in pixels */
    recommendedHeight: number;
    /** Minimum width in pixels */
    minWidth: number;
    /** Minimum height in pixels */
    minHeight: number;
    /** Supabase storage bucket name */
    bucket: string;
    /** Aspect ratio description */
    aspectRatio: string;
    /** Human-readable label */
    label: string;
}

export const IMAGE_CONFIGS: Record<ImageType, ImageConfig> = {
    product: {
        maxFileSize: 5 * 1024 * 1024,  // 5MB
        allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
        recommendedWidth: 800,
        recommendedHeight: 1000,
        minWidth: 400,
        minHeight: 400,
        bucket: 'product-images',
        aspectRatio: '4:5',
        label: 'Product Image',
    },
    category: {
        maxFileSize: 3 * 1024 * 1024,  // 3MB
        allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
        recommendedWidth: 600,
        recommendedHeight: 600,
        minWidth: 300,
        minHeight: 300,
        bucket: 'category-images',
        aspectRatio: '1:1',
        label: 'Category Image',
    },
    'hero-banner': {
        maxFileSize: 10 * 1024 * 1024,  // 10MB
        allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
        recommendedWidth: 1920,
        recommendedHeight: 600,
        minWidth: 1200,
        minHeight: 400,
        bucket: 'hero-banners',
        aspectRatio: '16:5',
        label: 'Hero Banner',
    },
};

// ─── Validation Results ─────────────────────────────────────────────────────

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

// ─── File Validation ────────────────────────────────────────────────────────

/**
 * Validate an image file against the configuration for a given image type.
 */
export function validateImageFile(file: File, imageType: ImageType): ValidationResult {
    const config = IMAGE_CONFIGS[imageType];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Format validation
    if (!config.allowedFormats.includes(file.type)) {
        errors.push(
            `Invalid format: ${file.type || 'unknown'}. Allowed: JPG, PNG, WebP`
        );
    }

    // File size validation
    if (file.size > config.maxFileSize) {
        const maxMB = (config.maxFileSize / (1024 * 1024)).toFixed(0);
        const fileMB = (file.size / (1024 * 1024)).toFixed(1);
        errors.push(
            `File too large: ${fileMB}MB. Maximum: ${maxMB}MB`
        );
    }

    // Warning for large files that are still within limits
    if (file.size > config.maxFileSize * 0.8) {
        const fileMB = (file.size / (1024 * 1024)).toFixed(1);
        warnings.push(`Large file (${fileMB}MB). Consider compressing for faster uploads.`);
    }

    return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate image dimensions by reading the file.
 * Returns a promise since it needs to load the image.
 */
export function validateImageDimensions(
    file: File,
    imageType: ImageType
): Promise<ValidationResult> {
    return new Promise((resolve) => {
        const config = IMAGE_CONFIGS[imageType];
        const errors: string[] = [];
        const warnings: string[] = [];

        const img = new window.Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            // Minimum dimensions check
            if (img.width < config.minWidth || img.height < config.minHeight) {
                errors.push(
                    `Image too small: ${img.width}×${img.height}px. Minimum: ${config.minWidth}×${config.minHeight}px`
                );
            }

            // Recommend optimal dimensions
            if (
                img.width < config.recommendedWidth ||
                img.height < config.recommendedHeight
            ) {
                warnings.push(
                    `Recommended: ${config.recommendedWidth}×${config.recommendedHeight}px for best quality`
                );
            }

            // Very large image warning
            if (img.width > config.recommendedWidth * 3 || img.height > config.recommendedHeight * 3) {
                warnings.push(
                    `Image is very large (${img.width}×${img.height}px). It will be resized automatically but upload may be slow.`
                );
            }

            resolve({ valid: errors.length === 0, errors, warnings });
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve({ valid: false, errors: ['Could not read image file'], warnings: [] });
        };

        img.src = objectUrl;
    });
}

/**
 * Full validation: file format/size + dimensions.
 */
export async function validateImage(
    file: File,
    imageType: ImageType
): Promise<ValidationResult> {
    // Step 1: File validation (sync)
    const fileResult = validateImageFile(file, imageType);
    if (!fileResult.valid) {
        return fileResult;
    }

    // Step 2: Dimension validation (async)
    const dimResult = await validateImageDimensions(file, imageType);

    return {
        valid: fileResult.valid && dimResult.valid,
        errors: [...fileResult.errors, ...dimResult.errors],
        warnings: [...fileResult.warnings, ...dimResult.warnings],
    };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Get recommended dimensions as a formatted string for UI hints.
 */
export function getRecommendedDimensions(imageType: ImageType): string {
    const config = IMAGE_CONFIGS[imageType];
    return `${config.recommendedWidth}×${config.recommendedHeight}px (${config.aspectRatio})`;
}

/**
 * Get max file size as a formatted string.
 */
export function getMaxFileSize(imageType: ImageType): string {
    const config = IMAGE_CONFIGS[imageType];
    return `${(config.maxFileSize / (1024 * 1024)).toFixed(0)}MB`;
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
