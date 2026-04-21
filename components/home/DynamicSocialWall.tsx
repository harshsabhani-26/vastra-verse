"use client";

/**
 * DynamicSocialWall
 *
 * Thin "use client" wrapper that holds the ssr:false dynamic import for SocialWall.
 * Required because `ssr: false` is not allowed in Server Components (page.tsx).
 * SocialWall is 30 KB of TSX at the bottom of the page — keeping it out of the
 * critical bundle is the key TBT win.
 */

import dynamic from "next/dynamic";
import type { SocialImage, SocialVideo } from "@/app/admin/socials/actions";

const SocialWall = dynamic(
    () => import("@/components/home/SocialWall").then((m) => ({ default: m.SocialWall })),
    { ssr: false }
);

interface DynamicSocialWallProps {
    images: SocialImage[];
    videos: SocialVideo[];
}

export function DynamicSocialWall({ images, videos }: DynamicSocialWallProps) {
    return <SocialWall images={images} videos={videos} />;
}
