"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
    images: string[];
}

export function ProductGallery({ images }: ProductGalleryProps) {
    const [selectedImage, setSelectedImage] = useState(0);

    // In mock mode we might only have one image, create duplicates for gallery demo
    const displayImages = images.length > 0 ? images : ["/placeholder.jpg"];
    const galleryImages = [...displayImages, ...displayImages, ...displayImages].slice(0, 4);

    return (
        <div className="flex flex-col-reverse lg:flex-row gap-4">
            {/* Thumbnails */}
            <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto no-scrollbar">
                {galleryImages.map((img, idx) => (
                    <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={cn(
                            "relative w-20 h-24 lg:w-24 lg:h-32 flex-shrink-0 border-2 transition-all",
                            selectedImage === idx ? "border-primary" : "border-transparent hover:border-stone-300"
                        )}
                    >
                        <Image
                            src={img}
                            alt={`View ${idx + 1}`}
                            fill
                            sizes="(max-width: 1024px) 80px, 96px"
                            className="object-cover"
                        />
                    </button>
                ))}
            </div>

            {/* Main Image */}
            <div className="relative flex-1 aspect-[3/4] bg-stone-100 overflow-hidden">
                <Image
                    src={galleryImages[selectedImage]}
                    alt="Product Main View"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-all duration-500"
                    priority
                />
            </div>
        </div>
    );
}
