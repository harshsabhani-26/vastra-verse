"use client";

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

    return (
        <>
            <div className="hidden md:block">
                <Hero banners={desktopBanners} heroBg={heroBg} />
            </div>
            <div className="block md:hidden">
                <Hero banners={phoneBanners} heroBg={heroBg} />
            </div>
        </>
    );
}
