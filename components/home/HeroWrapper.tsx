"use client";

import dynamic from "next/dynamic";

// Dynamically import Hero with client-side only rendering to prevent hydration issues
const Hero = dynamic(
    () => import("@/components/home/Hero").then((mod) => ({ default: mod.Hero })),
    {
        ssr: false,
        loading: () => (
            <div className="relative w-full h-screen overflow-hidden bg-luxury-black">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-950/40 via-purple-900/30 to-rose-900/35 animate-pulse" />
            </div>
        )
    }
);

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
