"use client";

import Image from "next/image";
import { useState } from "react";

interface ProductImageProps {
    /** Supabase Storage URL or relative path */
    src: string;
    /** Alt text for accessibility */
    alt: string;
    /** Width in pixels (default: 400) */
    width?: number;
    /** Height in pixels (default: 500) */
    height?: number;
    /** Override sizes for responsive behavior */
    sizes?: string;
    /** Additional CSS classes */
    className?: string;
    /** Whether to load immediately (default: false = lazy) */
    priority?: boolean;
    /** Quality 1-100 (default: 80) */
    quality?: number;
    /** Click handler */
    onClick?: () => void;
}

/**
 * Optimized product image component.
 * 
 * Automatically handles:
 * - AVIF/WebP conversion via Next.js Image API
 * - Responsive sizing for product grids
 * - Lazy loading (default)
 * - Fallback placeholder on error
 * - Fixed 4:5 aspect ratio
 */
export default function ProductImage({
    src,
    alt,
    width = 400,
    height = 500,
    sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
    className = "",
    priority = false,
    quality = 80,
    onClick,
}: ProductImageProps) {
    const [error, setError] = useState(false);
    const [loaded, setLoaded] = useState(false);

    // Fallback placeholder
    const placeholderSrc = "/placeholder-product.png";
    const imageSrc = error || !src ? placeholderSrc : src;

    return (
        <div
            className={`relative overflow-hidden bg-stone-100 ${onClick ? 'cursor-pointer' : ''} ${className}`}
            style={{ aspectRatio: '4/5' }}
            onClick={onClick}
        >
            <Image
                src={imageSrc}
                alt={alt}
                width={width}
                height={height}
                sizes={sizes}
                quality={quality}
                priority={priority}
                loading={priority ? undefined : "lazy"}
                className={`object-cover w-full h-full transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'
                    }`}
                onLoad={() => setLoaded(true)}
                onError={() => setError(true)}
            />

            {/* Loading skeleton */}
            {!loaded && !error && (
                <div className="absolute inset-0 bg-stone-100 animate-pulse" />
            )}
        </div>
    );
}
