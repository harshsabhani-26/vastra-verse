"use client";

import Image from "next/image";
import { useState } from "react";

interface HeroBannerProps {
    /** Supabase Storage URL or relative path */
    src: string;
    /** Alt text for accessibility */
    alt: string;
    /** Container height (default: 500px) */
    height?: number | string;
    /** Additional CSS classes for the container */
    className?: string;
    /** Quality 1-100 (default: 85 for hero quality) */
    quality?: number;
    /** Overlay gradient (default: true) */
    overlay?: boolean;
    /** Children rendered on top of the banner */
    children?: React.ReactNode;
}

/**
 * Optimized hero banner component.
 * 
 * Automatically handles:
 * - AVIF/WebP conversion via Next.js Image API
 * - Full-width responsive layout with fill
 * - Priority loading (NO lazy load)
 * - sizes="100vw" for full viewport
 * - Optional gradient overlay
 */
export default function HeroBanner({
    src,
    alt,
    height = 500,
    className = "",
    quality = 85,
    overlay = true,
    children,
}: HeroBannerProps) {
    const [error, setError] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const placeholderSrc = "/placeholder-banner.png";
    const imageSrc = error || !src ? placeholderSrc : src;

    return (
        <div
            className={`relative w-full overflow-hidden ${className}`}
            style={{ height: typeof height === 'number' ? `${height}px` : height }}
        >
            <Image
                src={imageSrc}
                alt={alt}
                fill
                sizes="100vw"
                quality={quality}
                priority={true}
                className={`object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'
                    }`}
                onLoad={() => setLoaded(true)}
                onError={() => setError(true)}
            />

            {/* Loading placeholder */}
            {!loaded && !error && (
                <div className="absolute inset-0 bg-gradient-to-r from-stone-200 to-stone-100 animate-pulse" />
            )}

            {/* Optional gradient overlay */}
            {overlay && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
            )}

            {/* Content overlay */}
            {children && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    {children}
                </div>
            )}
        </div>
    );
}
