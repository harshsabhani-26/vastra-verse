"use client";

import { useState } from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";
import { FashionGallery } from "./FashionGallery";

interface ProductImage {
    id: string;
    url: string;
    alt?: string | null;
    type: string;
}

interface ProductImageGalleryProps {
    images: ProductImage[];
    productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomedImageIndex, setZoomedImageIndex] = useState(0);

    if (!images || images.length === 0) {
        return (
            <div className="aspect-[3/4] relative bg-secondary/5 rounded-none overflow-hidden flex items-center justify-center">
                <p className="text-text-muted font-light uppercase tracking-widest text-xs">No images available</p>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Fashion Gallery */}
            <FashionGallery images={images} productName={productName} />

            {/* Zoom Button Overlay */}
            <button
                onClick={() => {
                    setZoomedImageIndex(0);
                    setIsZoomed(true);
                }}
                className="absolute top-8 right-8 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all z-20 group text-primary"
                aria-label="View fullscreen gallery"
            >
                <ZoomIn className="w-5 h-5" />
                <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-primary text-white text-xs px-2 py-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap tracking-wide">
                    Fullscreen View
                </span>
            </button>

            {/* Zoom Modal */}
            {isZoomed && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
                    onClick={() => setIsZoomed(false)}
                >
                    <button
                        onClick={() => setIsZoomed(false)}
                        className="absolute top-4 right-4 text-white hover:text-stone-300 text-4xl font-light"
                        aria-label="Close zoom"
                    >
                        ×
                    </button>
                    <div className="relative w-full h-full max-w-6xl max-h-[90vh]">
                        <Image
                            src={images[zoomedImageIndex].url}
                            alt={images[zoomedImageIndex].alt || productName}
                            fill
                            className="object-contain"
                            sizes="100vw"
                        />
                    </div>

                    {/* Image Counter */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                        Click on gallery to navigate • {images.length} {images.length === 1 ? 'image' : 'images'}
                    </div>
                </div>
            )}
        </div>
    );
}
