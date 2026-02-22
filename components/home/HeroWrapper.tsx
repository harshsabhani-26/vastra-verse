"use client";

import { Hero } from "@/components/home/Hero";

interface HeroWrapperProps {
    banners?: Array<{
        id: string;
        ctaLink: string;
        mediaType?: "IMAGE" | "VIDEO";
        imageUrl: string;
        videoUrl?: string | null;
        bannerType: "HERO" | "MID_PAGE" | "BOTTOM_PAGE";
        displayOrder: number;
    }>;
    heroBg?: string | null;
}

export function HeroWrapper({ banners, heroBg }: HeroWrapperProps) {
    return <Hero banners={banners} heroBg={heroBg} />;
}
