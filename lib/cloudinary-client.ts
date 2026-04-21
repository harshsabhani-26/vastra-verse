/**
 * Browser-safe Cloudinary URL builder
 * Use this function to generate optimized image URLs with transformations
 * This can be safely used in client components
 *
 * @param publicId - The Cloudinary public_id of the image
 * @param options - Transformation options
 * @returns Optimized Cloudinary URL
 */
export function buildCloudinaryUrl(
    publicId: string,
    options: {
        width?: number;
        height?: number;
        crop?: 'fill' | 'fit' | 'scale' | 'limit' | 'pad';
        quality?: 'auto' | number;
        format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
    } = {}
): string {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (!cloudName) {
        console.error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not configured');
        return publicId; // Return original URL as fallback
    }

    // Build transformation string
    const transformations: string[] = [];

    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
    if (options.crop) transformations.push(`c_${options.crop}`);

    // Auto-optimize quality and format by default
    transformations.push(`q_${options.quality || 'auto'}`);
    transformations.push(`f_${options.format || 'auto'}`);

    const transformationStr = transformations.join(',');

    // If publicId is already a full URL (for backward compatibility with Supabase URLs)
    if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
        return publicId; // Return as-is for non-Cloudinary URLs
    }

    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformationStr}/${publicId}`;
}

/**
 * Get responsive Cloudinary URL for hero banners
 * Optimizes for full-viewport width images with f_auto, q_auto
 */
export function getHeroBannerUrl(publicIdOrUrl: string): string {
    // If already a full URL (Supabase or external), return as-is
    if (publicIdOrUrl.startsWith('http://') || publicIdOrUrl.startsWith('https://')) {
        // If it's a Cloudinary URL, ensure it has optimization transforms
        if (publicIdOrUrl.includes('res.cloudinary.com')) {
            // If already has transforms (f_auto or q_auto), return as-is
            if (publicIdOrUrl.includes('f_auto') || publicIdOrUrl.includes('q_auto')) {
                return publicIdOrUrl;
            }
            // Extract public_id from URL and rebuild with optimization
            const match = publicIdOrUrl.match(/\/upload\/(?:v\d+\/)?(.*?)(?:\.\w+)?$/);
            if (match?.[1]) {
                return buildCloudinaryUrl(match[1], {
                    width: 1920,
                    crop: 'limit',
                    quality: 'auto',
                    format: 'auto',
                });
            }
        }
        return publicIdOrUrl;
    }

    // For Cloudinary public_ids, build optimized URL
    return buildCloudinaryUrl(publicIdOrUrl, {
        width: 1920,
        crop: 'limit',
        quality: 'auto',
        format: 'auto',
    });
}

/**
 * Get responsive hero banner props with srcSet for multiple breakpoints
 * Returns src, srcSet, and sizes for use with <img> or Next.js Image
 */
export function getResponsiveHeroBannerProps(publicIdOrUrl: string): {
    src: string;
    srcSet: string;
    sizes: string;
} {
    const widths = [640, 1080, 1920];
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    // Extract public_id from URL if needed
    let publicId: string | null = null;
    if (publicIdOrUrl.startsWith('http://') || publicIdOrUrl.startsWith('https://')) {
        if (publicIdOrUrl.includes('res.cloudinary.com')) {
            const match = publicIdOrUrl.match(/\/upload\/(?:v\d+\/)?(.*?)(?:\.\w+)?$/);
            publicId = match?.[1] ?? null;
        }
    } else {
        publicId = publicIdOrUrl;
    }

    // If we can't extract a public_id or no cloud name, return plain URL
    if (!publicId || !cloudName) {
        return {
            src: publicIdOrUrl,
            srcSet: '',
            sizes: '100vw',
        };
    }

    // Build srcSet with f_auto,q_auto at each breakpoint
    const srcSetEntries = widths.map((w) => {
        const url = buildCloudinaryUrl(publicId!, {
            width: w,
            crop: 'limit',
            quality: 'auto',
            format: 'auto',
        });
        return `${url} ${w}w`;
    });

    return {
        src: buildCloudinaryUrl(publicId, {
            width: 1920,
            crop: 'limit',
            quality: 'auto',
            format: 'auto',
        }),
        srcSet: srcSetEntries.join(', '),
        sizes: '100vw',
    };
}

// ─── MediaAsset Variant Resolver ──────────────────────────────────────────────

export type VariantContext = 'hero' | 'product' | 'category' | 'banner';
export type DeviceHint = 'desktop' | 'mobile';

export interface MediaAssetVariants {
    desktopUrl?: string | null;
    mobileUrl?:  string | null;
    largeUrl?:   string | null;
    mediumUrl?:  string | null;
    thumbUrl?:   string | null;
    blurUrl?:    string | null;
}

/**
 * getVariantUrl
 *
 * Resolves the optimal pre-generated WebP variant URL from a MediaAsset.
 * Falls back to the raw URL for legacy/unmigrated images transparently.
 *
 * @param asset     - MediaAsset variant fields (or null for legacy images)
 * @param context   - The rendering context (hero, product, category, banner)
 * @param device    - Device hint (desktop or mobile) for layout-aware selection
 * @param fallback  - Legacy URL to use when no MediaAsset is available
 * @returns Best-fit URL string
 *
 * @example
 * // In a hero component:
 * const src = getVariantUrl(product.mediaAsset, 'hero', 'desktop', banner.imageUrl);
 */
export function getVariantUrl(
    asset: MediaAssetVariants | null | undefined,
    context: VariantContext,
    device: DeviceHint = 'desktop',
    fallback: string = ''
): string {
    if (!asset) return fallback;

    switch (context) {
        case 'hero':
            return (device === 'mobile' ? asset.mobileUrl : asset.desktopUrl) ?? fallback;

        case 'product':
            // Products: desktop → large, mobile → medium
            return (device === 'mobile' ? asset.mediumUrl : asset.largeUrl) ?? fallback;

        case 'category':
            return (device === 'mobile' ? asset.mobileUrl : asset.mediumUrl) ?? fallback;

        case 'banner':
            return (device === 'mobile' ? asset.mobileUrl : asset.desktopUrl) ?? fallback;

        default:
            return asset.largeUrl ?? asset.desktopUrl ?? asset.mediumUrl ?? fallback;
    }
}

/**
 * getThumbUrl
 * Convenience wrapper — always returns the thumbnail variant.
 */
export function getThumbUrl(
    asset: MediaAssetVariants | null | undefined,
    fallback: string = ''
): string {
    return asset?.thumbUrl ?? fallback;
}

/**
 * getBlurUrl
 * Returns the 20px blur placeholder for use as blurDataURL in Next.js Image.
 */
export function getBlurUrl(
    asset: MediaAssetVariants | null | undefined,
    fallback: string = ''
): string {
    return asset?.blurUrl ?? fallback;
}
