"use client";

import Image from "next/image";

interface ProductImageZoomProps {
    smallImage: string;
    largeImage: string;
    alt: string;
    className?: string;
}

export function ProductImageZoom({
    smallImage,
    alt,
    className = ""
}: ProductImageZoomProps) {
    return (
        <div className={`relative aspect-[3/4] bg-stone-100 overflow-hidden ${className}`}>
            <Image
                src={smallImage}
                alt={alt}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
            />
        </div>
    );
}
