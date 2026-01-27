"use client";

import { useState, useEffect } from "react";
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
        title: string;
        subtitle: string;
        ctaText: string;
        ctaLink: string;
        imageUrl: string;
    }>;
}

export function Hero({ banners }: HeroProps) {
    // Use database banners or fall back to default
    const slides = banners && banners.length > 0
        ? banners.map((b, idx) => ({
            id: idx + 1,
            image: b.imageUrl,
            title: b.title,
            subtitle: b.subtitle,
            subtitle2: "",
            tagline: "",
            cta: b.ctaText,
            link: b.ctaLink
        }))
        : defaultSlides;

    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [slides.length]);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    return (
        <section className="relative w-full h-[90vh] overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7 }}
                    className="absolute inset-0"
                >
                    {/* Full Background Image */}
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
                    />
                    {/* Gradient Overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-900/60 via-purple-700/40 to-pink-600/60" />
                </motion.div>
            </AnimatePresence>

            {/* Decorative mandala pattern on right */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[600px] md:h-[600px] opacity-10 pointer-events-none">
                <svg viewBox="0 0 200 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="100" cy="100" r="80" fill="none" stroke="white" strokeWidth="0.5" />
                    <circle cx="100" cy="100" r="60" fill="none" stroke="white" strokeWidth="0.5" />
                    <circle cx="100" cy="100" r="40" fill="none" stroke="white" strokeWidth="0.5" />
                    <line x1="100" y1="100" x2="180" y2="100" stroke="white" strokeWidth="0.5" />
                    <line x1="100" y1="100" x2="169.28" y2="140" stroke="white" strokeWidth="0.5" />
                    <line x1="100" y1="100" x2="140" y2="169.28" stroke="white" strokeWidth="0.5" />
                    <line x1="100" y1="100" x2="100" y2="180" stroke="white" strokeWidth="0.5" />
                    <line x1="100" y1="100" x2="60" y2="169.28" stroke="white" strokeWidth="0.5" />
                    <line x1="100" y1="100" x2="30.72" y2="140" stroke="white" strokeWidth="0.5" />
                    <line x1="100" y1="100" x2="20" y2="100" stroke="white" strokeWidth="0.5" />
                    <line x1="100" y1="100" x2="30.72" y2="60" stroke="white" strokeWidth="0.5" />
                    <line x1="100" y1="100" x2="60" y2="30.72" stroke="white" strokeWidth="0.5" />
                    <line x1="100" y1="100" x2="100" y2="20" stroke="white" strokeWidth="0.5" />
                    <line x1="100" y1="100" x2="140" y2="30.72" stroke="white" strokeWidth="0.5" />
                    <line x1="100" y1="100" x2="169.28" y2="60" stroke="white" strokeWidth="0.5" />
                </svg>
            </div>

            {/* Content - Centered */}
            <div className="absolute inset-0 flex items-center justify-center z-10 px-4">
                <div className="text-white space-y-6 text-center max-w-4xl mx-auto">
                    <motion.h1
                        key={`h1-${currentSlide}`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="text-6xl md:text-7xl lg:text-8xl font-serif lowercase"
                    >
                        {slides[currentSlide].title}
                    </motion.h1>
                    <motion.div
                        key={`desc-${currentSlide}`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="space-y-2"
                    >
                        <p className="text-xl md:text-2xl font-serif italic">
                            {slides[currentSlide].subtitle}
                        </p>
                        {slides[currentSlide].subtitle2 && (
                            <p className="text-2xl md:text-3xl font-sans font-bold">
                                {slides[currentSlide].subtitle2}
                            </p>
                        )}
                        {slides[currentSlide].tagline && (
                            <p className="text-sm md:text-base font-sans font-light tracking-[0.2em] text-white/70 uppercase">
                                {slides[currentSlide].tagline}
                            </p>
                        )}
                    </motion.div>
                    <motion.div
                        key={`btn-${currentSlide}`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                    >
                        <Link href={slides[currentSlide].link}>
                            <Button variant="gold" size="lg" className="min-w-[200px] h-14 uppercase tracking-widest">
                                {slides[currentSlide].cta}
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Navigation Buttons */}
            {slides.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full border border-white/30 text-white hover:bg-white/20 transition-colors z-20"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full border border-white/30 text-white hover:bg-white/20 transition-colors z-20"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                    </button>
                </>
            )}
        </section>
    );
}
