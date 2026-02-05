"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";

interface ProductImage {
    id: string;
    url: string;
    alt?: string | null;
    type: string;
}

interface FashionGalleryProps {
    images: ProductImage[];
    productName: string;
}

export function FashionGallery({ images, productName }: FashionGalleryProps) {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const thumbnailContainerRef = useRef<HTMLDivElement>(null);

    if (!images || images.length === 0) {
        return (
            <div className="aspect-[3/4] relative bg-secondary/5 rounded-none overflow-hidden flex items-center justify-center">
                <p className="text-text-muted font-light tracking-wide text-xs">No images available</p>
            </div>
        );
    }

    const currentImage = images[selectedImageIndex];

    const handleImageChange = (newIndex: number) => {
        if (newIndex === selectedImageIndex || isTransitioning) return;
        setIsTransitioning(true);
        setSelectedImageIndex(newIndex);
        setTimeout(() => setIsTransitioning(false), 400);
    };

    const handlePrevious = () => {
        const newIndex = selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1;
        handleImageChange(newIndex);
    };

    const handleNext = () => {
        const newIndex = selectedImageIndex === images.length - 1 ? 0 : selectedImageIndex + 1;
        handleImageChange(newIndex);
    };

    const scrollThumbnails = (direction: 'up' | 'down') => {
        if (thumbnailContainerRef.current) {
            const scrollAmount = 150;
            thumbnailContainerRef.current.scrollBy({
                top: direction === 'down' ? scrollAmount : -scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Auto-scroll to keep selected thumbnail visible
    useEffect(() => {
        if (thumbnailContainerRef.current) {
            const container = thumbnailContainerRef.current;
            const selectedThumbnail = container.children[selectedImageIndex] as HTMLElement;
            if (selectedThumbnail) {
                const containerRect = container.getBoundingClientRect();
                const thumbnailRect = selectedThumbnail.getBoundingClientRect();

                if (thumbnailRect.top < containerRect.top || thumbnailRect.bottom > containerRect.bottom) {
                    selectedThumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }
        }
    }, [selectedImageIndex]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handlePrevious();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                handleNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImageIndex]);

    return (
        <div className="flex gap-4 lg:gap-6 bg-secondary/5 p-4 lg:p-6 rounded-none">
            {/* Vertical Thumbnail Strip */}
            <div className="flex flex-col items-center gap-3">
                {/* Up Arrow */}
                {images.length > 5 && (
                    <button
                        onClick={() => scrollThumbnails('up')}
                        className="w-10 h-10 flex items-center justify-center bg-white/80 hover:bg-white rounded-full shadow-sm transition-all hover:shadow-md"
                        aria-label="Scroll thumbnails up"
                    >
                        <ChevronUp className="w-4 h-4 text-primary" />
                    </button>
                )}

                {/* Thumbnail Container */}
                <div
                    ref={thumbnailContainerRef}
                    className="flex flex-col gap-2 overflow-y-auto scrollbar-hide max-h-[500px] lg:max-h-[600px]"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {images.map((image, index) => (
                        <button
                            key={image.id}
                            onClick={() => handleImageChange(index)}
                            className={`relative w-16 h-20 lg:w-20 lg:h-24 rounded-none overflow-hidden transition-all duration-300 flex-shrink-0 ${index === selectedImageIndex
                                ? 'ring-1 ring-primary opacity-100 scale-105'
                                : 'opacity-60 hover:opacity-100 hover:scale-105'
                                }`}
                        >
                            <Image
                                src={image.url}
                                alt={`${productName} - view ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="80px"
                            />
                            {index === selectedImageIndex && (
                                <div className="absolute inset-0 bg-white/10" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Down Arrow */}
                {images.length > 5 && (
                    <button
                        onClick={() => scrollThumbnails('down')}
                        className="w-10 h-10 flex items-center justify-center bg-white/80 hover:bg-white rounded-full shadow-sm transition-all hover:shadow-md"
                        aria-label="Scroll thumbnails down"
                    >
                        <ChevronDown className="w-4 h-4 text-primary" />
                    </button>
                )}
            </div>

            {/* Main Image Display */}
            <div className="flex-1 relative">
                <div className="relative min-h-[600px] lg:min-h-[700px] bg-white rounded-none overflow-hidden group flex items-center justify-center">
                    {/* Main Image */}
                    <div className={`relative w-full h-full min-h-[600px] lg:min-h-[700px] transition-opacity duration-400 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                        <Image
                            src={currentImage.url}
                            alt={currentImage.alt || productName}
                            fill
                            priority
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                        />
                    </div>

                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={handlePrevious}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                            </button>
                            <button
                                onClick={handleNext}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                                aria-label="Next image"
                            >
                                <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                            </button>
                        </>
                    )}

                    {/* Pagination Dots */}
                    {images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                            {images.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleImageChange(index)}
                                    className={`rounded-full transition-all duration-300 ${index === selectedImageIndex
                                        ? 'w-2 h-2 bg-white'
                                        : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/75'
                                        }`}
                                    aria-label={`View image ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
