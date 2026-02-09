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
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}

export function HeroWrapper({ banners }: HeroWrapperProps) {
    return <Hero banners={banners} />;
}
