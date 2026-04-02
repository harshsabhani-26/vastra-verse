"use client";

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
    if (!images || images.length === 0) {
        return (
            <div className="aspect-[3/4] relative bg-secondary/5 rounded-none overflow-hidden flex items-center justify-center">
                <p className="text-text-muted font-light uppercase tracking-widest text-xs">No images available</p>
            </div>
        );
    }

    return (
        <div className="relative">
            <FashionGallery images={images} productName={productName} />
        </div>
    );
}
