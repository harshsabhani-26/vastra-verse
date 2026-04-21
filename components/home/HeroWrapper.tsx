"use client";

import { useEffect, useState } from "react";
import { Hero } from "@/components/home/Hero";

interface HeroBannerConfig {
    id: string;
    ctaLink: string;
    mediaType?: "IMAGE" | "VIDEO";
    imageUrl: string;
    videoUrl?: string | null;
    bannerType: "HERO" | "MID_PAGE" | "BOTTOM_PAGE";
    displayOrder: number;
}

interface HeroWrapperProps {
    banners?: Array<HeroBannerConfig>;
    webBanners?: Array<HeroBannerConfig>;
    mobileBanners?: Array<HeroBannerConfig>;
    heroBg?: string | null;
}

export function HeroWrapper({ banners, webBanners, mobileBanners, heroBg }: HeroWrapperProps) {
    const defaultBanners = banners || [];
    const desktopBanners = webBanners && webBanners.length > 0 ? webBanners : defaultBanners;
    const phoneBanners = mobileBanners && mobileBanners.length > 0 ? mobileBanners : defaultBanners;

    // FIX 1: Single Hero mount — detect viewport on client to pick the correct banner set.
    // Avoids double Hero renders (which caused double image fetches + double framer-motion hydration).
    // SSR renders the desktop banners by default (most common crawler viewport).
    const [activeBanners, setActiveBanners] = useState(desktopBanners);

    useEffect(() => {
        const update = () => {
            setActiveBanners(window.innerWidth < 768 ? phoneBanners : desktopBanners);
        };
        update(); // Run immediately on mount
        window.addEventListener("resize", update, { passive: true });
        return () => window.removeEventListener("resize", update);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return <Hero banners={activeBanners} heroBg={heroBg} />;
}
