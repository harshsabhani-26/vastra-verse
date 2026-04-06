"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { getHeroBannerUrl } from "@/lib/cloudinary-client";

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
    heroBg?: string | null;
}

export function Hero({ banners, heroBg }: HeroProps) {
    // Use database banners or fall back to default
    const slides = banners && banners.length > 0
        ? banners.map((b, idx) => ({
            id: idx + 1,
            mediaType: b.mediaType || "IMAGE",
            image: getHeroBannerUrl(b.imageUrl), // Optimize Cloudinary URLs
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
    const [direction, setDirection] = useState(0);

    // Auto-play with pause on hover
    useEffect(() => {
        if (isPaused || slides.length <= 1) return;

        const timer = setInterval(() => {
            setDirection(1);
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [slides.length, isPaused]);

    const nextSlide = () => {
        setDirection(1);
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };
    const prevSlide = () => {
        setDirection(-1);
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    return (
        <section
            className="relative w-full pt-0 md:pt-[10px] lg:pt-[15px] pb-0 md:pb-[25px] lg:pb-[35px] px-0 md:px-[80px] lg:px-[142px] xl:px-[202px] 2xl:px-[262px] bg-white overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* SVG Vector Background with Medium Opacity */}
            {heroBg && (
                <div
                    className="absolute inset-0 z-0 pointer-events-none"
                    style={{
                        backgroundImage: `url("${heroBg}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        opacity: 0.15
                    }}
                ></div>
            )}

            <div className="relative w-full max-w-[2000px] mx-auto aspect-[5/6] md:aspect-[2.15/1] lg:aspect-[2.65/1] xl:aspect-[3.05/1] overflow-hidden rounded-none md:rounded-md shadow-[0_8px_40px_rgba(0,0,0,0.12)] bg-black z-10">
                {/* Background */}
                <AnimatePresence initial={false}>
                    <motion.div
                        key={currentSlide}
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="absolute inset-0 w-full h-full z-[1]"
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
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>


                {/* Clickable Banner Background */}
                <Link href={slides[currentSlide].buttonLink} className="absolute inset-0 z-10">
                    <span className="sr-only">View {slides[currentSlide].buttonLink}</span>
                </Link>


            </div>

            {/* Navigation Dots - Below the banner container */}
            {slides.length > 1 && (
                <div className="hidden md:flex items-center justify-center gap-2 mt-5">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`rounded-full transition-all duration-300 ${index === currentSlide
                                ? 'bg-[#333333] w-[9px] h-[9px]'
                                : 'bg-transparent border border-[#7a7a7a] w-[8px] h-[8px] hover:bg-[#a0a0a0]'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
