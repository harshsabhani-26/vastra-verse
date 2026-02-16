"use client";

import Image from "next/image";
import { useState } from "react";

interface CategoryImageProps {
    /** Supabase Storage URL or relative path */
    src: string;
    /** Alt text for accessibility */
    alt: string;
    /** Size in pixels (images are square, default: 300) */
    size?: number;
    /** Override sizes for responsive behavior */
    sizes?: string;
    /** Additional CSS classes */
    className?: string;
    /** Whether to load immediately (default: false = lazy) */
    priority?: boolean;
    /** Quality 1-100 (default: 75) */
    quality?: number;
    /** Click handler */
    onClick?: () => void;
}

/**
 * Optimized category image component.
 * 
 * Automatically handles:
 * - AVIF/WebP conversion via Next.js Image API
 * - Square 1:1 aspect ratio
 * - Responsive sizing for category grids
 * - Lazy loading (default)
 * - Fallback placeholder on error
 */
export default function CategoryImage({
    src,
    alt,
    size = 300,
    sizes = "(max-width: 768px) 50vw, 33vw",
    className = "",
    priority = false,
    quality = 75,
    onClick,
}: CategoryImageProps) {
    const [error, setError] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const placeholderSrc = "/placeholder-category.png";
    const imageSrc = error || !src ? placeholderSrc : src;

    return (
        <div
            className={`relative overflow-hidden bg-stone-100 rounded-lg ${onClick ? 'cursor-pointer' : ''} ${className}`}
            style={{ aspectRatio: '1/1' }}
            onClick={onClick}
        >
            <Image
                src={imageSrc}
                alt={alt}
                width={size}
                height={size}
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
                <div className="absolute inset-0 bg-stone-100 animate-pulse rounded-lg" />
            )}
        </div>
    );
}
