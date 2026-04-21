"use client";

/**
 * DynamicMidPageBanner
 *
 * Thin "use client" wrapper that holds the ssr:false dynamic import for MidPageBanner.
 * This is required because `ssr: false` is not allowed in Server Components (page.tsx).
 * The wrapper itself is a Client Component, so next/dynamic + ssr:false works correctly here.
 */

import dynamic from "next/dynamic";

const MidPageBanner = dynamic(
    () => import("@/components/home/MidPageBanner").then((m) => ({ default: m.MidPageBanner })),
    { ssr: false }
);

interface BannerItem {
    id: string;
    ctaLink: string;
    mediaType?: "IMAGE" | "VIDEO";
    imageUrl: string;
    videoUrl?: string | null;
    bannerType: "HERO" | "MID_PAGE" | "BOTTOM_PAGE";
    displayOrder: number;
}

export function DynamicMidPageBanner({ banners }: { banners?: BannerItem[] }) {
    return <MidPageBanner banners={banners} />;
}
