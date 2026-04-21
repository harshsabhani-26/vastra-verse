"use client";

/**
 * HeroSlider — Pure client component responsible ONLY for slideshow interactivity.
 * Loaded via next/dynamic in Hero.tsx to keep it out of the critical JS bundle.
 *
 * FIX 12: Replaces framer-motion AnimatePresence + motion.div with pure CSS transitions.
 * Savings: ~31 KB gzip removed from the critical rendering path.
 */

import { useEffect, useRef } from "react";

interface HeroSliderProps {
    totalSlides: number;
    currentSlide: number;
    setCurrentSlide: (index: number) => void;
    setIsPaused: (paused: boolean) => void;
    isPaused: boolean;
}

export function HeroSlider({ totalSlides, currentSlide, setCurrentSlide, setIsPaused, isPaused }: HeroSliderProps) {
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Auto-play
    useEffect(() => {
        if (isPaused || totalSlides <= 1) return;
        intervalRef.current = setInterval(() => {
            setCurrentSlide((currentSlide + 1) % totalSlides);
        }, 5000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [totalSlides, isPaused, currentSlide, setCurrentSlide]);

    if (totalSlides <= 1) return null;

    return (
        <>
            {/* Navigation Dots - Below the banner container */}
            <div className="hidden md:flex items-center justify-center gap-2 mt-5">
                {Array.from({ length: totalSlides }).map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`rounded-full transition-all duration-300 ${
                            index === currentSlide
                                ? "bg-[#333333] w-[9px] h-[9px]"
                                : "bg-transparent border border-[#7a7a7a] w-[8px] h-[8px] hover:bg-[#a0a0a0]"
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </>
    );
}
