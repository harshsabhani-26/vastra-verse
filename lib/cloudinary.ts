import { v2 as cloudinary } from 'cloudinary';

// Server-side Cloudinary configuration
// IMPORTANT: This file should ONLY be imported in server-side code (API routes, server actions)
// Never import this in client components or it will expose your API secrets

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

// Validate configuration on module load (server-side only)
if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    console.warn('⚠️  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set');
}
if (!process.env.CLOUDINARY_API_KEY) {
    console.warn('⚠️  CLOUDINARY_API_KEY is not set');
}
if (!process.env.CLOUDINARY_API_SECRET) {
    console.warn('⚠️  CLOUDINARY_API_SECRET is not set');
}

export default cloudinary;

// Types for upload response
export interface CloudinaryUploadResult {
    public_id: string;
    version: number;
    signature: string;
    width: number;
    height: number;
    format: string;
    resource_type: string;
    created_at: string;
    bytes: number;
    type: string;
    url: string;
    secure_url: string;
}

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
 * Optimizes for full-viewport width images
 */
export function getHeroBannerUrl(publicIdOrUrl: string): string {
    // If already a full URL (Supabase or external), return as-is
    if (publicIdOrUrl.startsWith('http://') || publicIdOrUrl.startsWith('https://')) {
        // If it's a Cloudinary URL, optimize it
        if (publicIdOrUrl.includes('res.cloudinary.com')) {
            // Extract public_id from existing Cloudinary URL if needed
            return publicIdOrUrl;
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
