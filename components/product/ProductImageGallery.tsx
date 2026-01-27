"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

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
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);

    if (!images || images.length === 0) {
        return (
            <div className="aspect-[3/4] relative bg-stone-100 rounded-lg overflow-hidden flex items-center justify-center">
                <p className="text-stone-400">No images available</p>
            </div>
        );
    }

    const currentImage = images[selectedImageIndex];

    const handlePrevious = () => {
        setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-[3/4] bg-stone-100 rounded-lg overflow-hidden group">
                <Image
                    src={currentImage.url}
                    alt={currentImage.alt || productName}
                    fill
                    className="object-cover transition-transform duration-300"
                    priority
                />

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={handlePrevious}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="w-5 h-5 text-stone-800" />
                        </button>
                        <button
                            onClick={handleNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                            aria-label="Next image"
                        >
                            <ChevronRight className="w-5 h-5 text-stone-800" />
                        </button>
                    </>
                )}

                {/* Zoom Icon */}
                <button
                    onClick={() => setIsZoomed(true)}
                    className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Zoom image"
                >
                    <ZoomIn className="w-5 h-5 text-stone-800" />
                </button>

                {/* Image Counter */}
                {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                        {selectedImageIndex + 1} / {images.length}
                    </div>
                )}

                {/* Image Type Badge */}
                {currentImage.type !== "MAIN" && (
                    <div className="absolute top-4 left-4 bg-primary/90 text-white px-3 py-1 rounded-full text-xs font-medium">
                        {currentImage.type.replace(/_/g, " ")}
                    </div>
                )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                    {images.map((image, index) => (
                        <button
                            key={image.id}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`aspect-square relative rounded-lg overflow-hidden border-2 transition-all ${index === selectedImageIndex
                                    ? "border-primary ring-2 ring-primary/20"
                                    : "border-stone-200 hover:border-stone-300"
                                }`}
                        >
                            <Image
                                src={image.url}
                                alt={`${productName} - view ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 20vw, 10vw"
                            />
                            {/* Active indicator */}
                            {index === selectedImageIndex && (
                                <div className="absolute inset-0 bg-primary/10" />
                            )}
                        </button>
                    ))}
                </div>
            )}

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
                            src={currentImage.url}
                            alt={currentImage.alt || productName}
                            fill
                            className="object-contain"
                            sizes="100vw"
                        />
                    </div>
                    {/* Navigation in zoom mode */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrevious();
                                }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 p-3 rounded-full"
                            >
                                <ChevronLeft className="w-6 h-6 text-white" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNext();
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 p-3 rounded-full"
                            >
                                <ChevronRight className="w-6 h-6 text-white" />
                            </button>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                                {selectedImageIndex + 1} / {images.length}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
