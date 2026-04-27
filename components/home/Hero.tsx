"use client";

/**
 * Hero Component
 *
 * FIX 3: Server-rendered static first slide + lazy-loaded interactive slider.
 *   The first slide's <Image> renders immediately at HTML parse time (no framer-motion
 *   blocking). The slideshow interactivity (dots, auto-play) loads via next/dynamic
 *   with ssr:false so it never blocks the initial render.
 *
 * FIX 12: framer-motion (AnimatePresence + motion.div, ~31 KB gzip) replaced with
 *   pure CSS transitions. Slides are absolutely positioned; transform/opacity
 *   transitions handle enter/exit without any JS animation library overhead.
 */

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";

import { getHeroBannerUrl } from "@/lib/cloudinary-client";

// Lazy-load slider interactivity — never in the critical bundle (FIX 3)
const HeroSlider = dynamic(
    () => import("@/components/home/HeroSlider").then((m) => ({ default: m.HeroSlider })),
    { ssr: false }
);

// ─── Default fallback slides ─────────────────────────────────────────────────
const defaultSlides = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1610189012906-47833cc180bb?auto=format&fit=crop&q=80&w=2070",
        title: "saree",
        link: "/shop?sort=newest",
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1583391726247-12c8428574d7?auto=format&fit=crop&q=80&w=2070",
        title: "heritage",
        link: "/collections",
    },
];

interface HeroProps {
    banners?: Array<{
        id: string;
        title?: string | null;
        ctaLink: string;
        mediaType?: "IMAGE" | "VIDEO";
        imageUrl: string;
        videoUrl?: string | null;
        mediaAssetId?: string | null;
        mediaAsset?: {
            id: string;
            desktopUrl: string | null;
            mobileUrl: string | null;
            blurUrl: string | null;
        } | null;
    }>;
    heroBg?: string | null;
}

export function Hero({ banners, heroBg }: HeroProps) {
    const slides =
        banners && banners.length > 0
            ? banners.map((b, idx) => ({
                  id: idx + 1,
                  mediaType: b.mediaType || "IMAGE",
                  image: getHeroBannerUrl(b.imageUrl),
                  desktopUrl: b.mediaAsset?.desktopUrl || getHeroBannerUrl(b.imageUrl),
                  mobileUrl: b.mediaAsset?.mobileUrl || getHeroBannerUrl(b.imageUrl),
                  videoUrl: b.videoUrl || null,
                  buttonLink: b.ctaLink,
                  title: b.title,
              }))
            : defaultSlides.map((s) => ({
                  ...s,
                  mediaType: "IMAGE" as const,
                  desktopUrl: s.image,
                  mobileUrl: s.image,
                  videoUrl: null,
                  buttonLink: s.link,
              }));

    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const goToSlide = useCallback((index: number) => {
        setCurrentSlide(index);
    }, []);

    return (
        <section
            className="relative w-full pt-0 md:pt-[10px] lg:pt-[15px] pb-0 md:pb-[25px] lg:pb-[35px] px-0 md:px-[80px] lg:px-[142px] xl:px-[202px] 2xl:px-[262px] bg-white overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* SVG Vector Background */}
            {heroBg && (
                <div
                    className="absolute inset-0 z-0 pointer-events-none"
                    style={{
                        backgroundImage: `url("${heroBg}")`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        opacity: 0.15,
                    }}
                />
            )}

            {/* Slide Container — aspect-ratio preserves CLS = 0 (FIX 3 / CLS guard) */}
            <div className="relative w-full max-w-[2000px] mx-auto aspect-[5/6] md:aspect-[2.15/1] lg:aspect-[2.65/1] xl:aspect-[3.05/1] overflow-hidden rounded-none md:rounded-md shadow-[0_8px_40px_rgba(0,0,0,0.12)] bg-black z-10">

                {/* 
                  FIX 12: CSS-only slide transitions — no framer-motion.
                  Slides are stacked absolutely; the active slide is fully visible
                  while all others are translated off-screen.
                  Transition: transform 0.35s ease-in-out (matches original 0.3s feel).
                */}
                {slides.map((slide, index) => {
                    const isActive = index === currentSlide;
                    return (
                        <div
                            key={slide.id}
                            className="absolute inset-0 w-full h-full"
                            style={{
                                transform: isActive ? "translateX(0)" : "translateX(100%)",
                                transition: "transform 0.35s ease-in-out",
                                zIndex: isActive ? 2 : 1,
                                // Slides that have already been shown slide out to the left
                                // For simplicity we use a single direction; for bidirectional
                                // slide direction, HeroSlider can pass direction state.
                            }}
                            aria-hidden={!isActive}
                        >
                            {slide.mediaType === "VIDEO" && slide.videoUrl ? (
                                <video
                                    className="absolute inset-0 w-full h-full object-cover"
                                    src={slide.videoUrl}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                />
                            ) : (
                                <picture className="w-full h-full">
                                    <source media="(max-width: 768px)" srcSet={slide.mobileUrl} />
                                    <source media="(min-width: 769px)" srcSet={slide.desktopUrl} />
                                    {/* FIX 1: Explicit picture tag with fetchpriority="high" and explicit dimensions wrapper via CSS class */}
                                    <img
                                        src={slide.desktopUrl}
                                        alt={slide.title || "Hero Banner"}
                                        className="w-full h-full object-cover"
                                        fetchPriority={index === 0 ? "high" : "auto"}
                                        loading={index === 0 ? "eager" : "lazy"}
                                        decoding="sync"
                                    />
                                </picture>
                            )}
                        </div>
                    );
                })}

                {/* Clickable Banner Link — full overlay */}
                <Link href={slides[currentSlide].buttonLink} className="absolute inset-0 z-10">
                    <span className="sr-only">View {slides[currentSlide].buttonLink}</span>
                </Link>
            </div>

            {/* 
              FIX 3: Slider interactivity lazy-loaded — never in the critical bundle.
              HeroSlider renders: nav dots + auto-play timer.
              It loads after the page is interactive — well after the hero image has painted.
            */}
            <HeroSlider
                totalSlides={slides.length}
                currentSlide={currentSlide}
                setCurrentSlide={goToSlide}
                setIsPaused={setIsPaused}
                isPaused={isPaused}
            />
        </section>
    );
}
