"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MidPageBannerProps {
    banners?: Array<{
        id: string;
        ctaLink: string;
        mediaType?: "IMAGE" | "VIDEO";
        imageUrl: string;
        videoUrl?: string | null;
        bannerType: "HERO" | "MID_PAGE" | "BOTTOM_PAGE";
        displayOrder: number;
    }>;
}

export function MidPageBanner({ banners }: MidPageBannerProps) {
    // Don't render if no banners are provided
    if (!banners || banners.length === 0) {
        return null;
    }

    const slides = banners.map((b, idx) => ({
        id: idx + 1,
        mediaType: b.mediaType || "IMAGE",
        image: b.imageUrl,
        videoUrl: b.videoUrl || null,
        buttonLink: b.ctaLink,
    }));

    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Auto-play with pause on hover
    useEffect(() => {
        if (isPaused || slides.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [slides.length, isPaused]);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    return (
        <section
            className="relative w-full overflow-hidden bg-[#f4ece3] shadow-sm pb-[102.29%] sm:pb-[32.49%]"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <AnimatePresence initial={false} mode="wait">
                <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
                    {slides[currentSlide].mediaType === "VIDEO" && slides[currentSlide].videoUrl ? (
                        <video
                            className="absolute inset-0 w-full h-full object-cover object-center"
                            src={slides[currentSlide].videoUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                        />
                    ) : (
                        <Image
                            src={slides[currentSlide].image}
                            alt={`Banner ${currentSlide + 1}`}
                            fill
                            priority
                            className="object-cover object-center"
                            sizes="100vw"
                        />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Clickable Banner Background */}
            <Link href={slides[currentSlide].buttonLink} className="absolute inset-0 z-10">
                <span className="sr-only">View {slides[currentSlide].buttonLink}</span>
            </Link>

            {/* Navigation Arrows (Hidden Mobile, exactly like Hero) */}
            {slides.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="hidden sm:flex absolute left-[10px] top-1/2 -mt-[22px] w-[27px] h-[44px] items-center justify-center text-black z-20 group hover:-translate-x-2 transition-transform duration-300"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-8 h-8 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="hidden sm:flex absolute right-[10px] top-1/2 -mt-[22px] w-[27px] h-[44px] items-center justify-center text-black z-20 group hover:translate-x-2 transition-transform duration-300"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-8 h-8 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </button>
                </>
            )}

            {/* Navigation Dots (Exactly like Hero) */}
            {slides.length > 1 && (
                <div className="absolute -bottom-8 sm:bottom-[10px] left-0 w-full flex justify-center z-20">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`inline-block w-[8px] h-[8px] mx-[4px] rounded-[50%] transition-opacity duration-300 ${index === currentSlide
                                ? 'bg-black opacity-100'
                                : 'bg-black opacity-20 hover:opacity-100'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
