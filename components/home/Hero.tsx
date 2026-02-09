"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Default fallback slides
const defaultSlides = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1610189012906-47833cc180bb?auto=format&fit=crop&q=80&w=2070",
        title: "saree",
        subtitle: "discover the timeless elegance",
        subtitle2: "of handwoven heritage",
        tagline: "EVERY THREAD TELLS A STORY",
        cta: "SHOP SAREE",
        link: "/shop?sort=newest"
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1583391726247-12c8428574d7?auto=format&fit=crop&q=80&w=2070",
        title: "heritage",
        subtitle: "artistry in every thread",
        subtitle2: "handcrafted masterpieces",
        tagline: "TIMELESS TRADITION",
        cta: "EXPLORE COLLECTION",
        link: "/collections"
    }
];

interface HeroProps {
    banners?: Array<{
        id: string;
        title?: string | null;
        subtitle?: string | null;
        ctaText?: string | null;
        ctaLink: string;
        mediaType?: "IMAGE" | "VIDEO";
        imageUrl: string;
        videoUrl?: string | null;
    }>;
}

export function Hero({ banners }: HeroProps) {
    // Use database banners or fall back to default
    const slides = banners && banners.length > 0
        ? banners.map((b, idx) => ({
            id: idx + 1,
            mediaType: b.mediaType || "IMAGE",
            image: b.imageUrl,
            videoUrl: b.videoUrl || null,
            buttonLink: b.ctaLink,
            title: b.title,
        }))
        : defaultSlides.map(s => ({
            ...s,
            mediaType: "IMAGE" as const,
            videoUrl: null,
            buttonLink: s.link,
            title: s.title,
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
            className="relative w-full h-screen overflow-hidden bg-background"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Background */}
            <AnimatePresence initial={false} mode="wait">
                <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.0, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
                    {slides[currentSlide].mediaType === "VIDEO" && slides[currentSlide].videoUrl ? (
                        <>
                            <video
                                className="absolute inset-0 w-full h-full object-cover"
                                src={slides[currentSlide].videoUrl}
                                autoPlay
                                loop
                                muted
                                playsInline
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/50 via-primary/30 to-primary/20" />
                        </>
                    ) : (
                        <>
                            <div className="absolute inset-0">
                                <Image
                                    src={slides[currentSlide].image}
                                    alt={slides[currentSlide].title || "Hero Banner"}
                                    fill
                                    priority={currentSlide === 0}
                                    className="object-cover"
                                    sizes="100vw"
                                />
                            </div>
                            {/* Lighter, warmer overlay for Light Luxury feel */}
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/60 via-primary/20 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-80" />
                        </>
                    )}
                </motion.div>
            </AnimatePresence>


            {/* Clickable Banner Background */}
            <Link href={slides[currentSlide].buttonLink} className="absolute inset-0 z-10">
                <span className="sr-only">View {slides[currentSlide].buttonLink}</span>
            </Link>

            {/* Navigation - Only show when multiple slides */}
            {slides.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-6 lg:left-8 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/95 transition-all duration-300 z-20 group"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-8 h-8 lg:w-10 lg:h-10 stroke-[1.5]" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-6 lg:right-8 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/95 transition-all duration-300 z-20 group"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-8 h-8 lg:w-10 lg:h-10 stroke-[1.5]" />
                    </button>

                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`h-1.5 rounded-full transition-all duration-500 ${index === currentSlide
                                    ? 'w-8 bg-white/90'
                                    : 'w-1.5 bg-white/30 hover:bg-white/50'
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}
