import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache/cache-tags";

/**
 * Pure data access layer for banner queries
 *
 * RULES:
 * - NO "use server" directive
 * - NO admin imports
 * - Read-only operations only
 * - Uses React cache for request deduplication
 */

const BANNER_SELECT = {
    id: true,
    ctaLink: true,
    mediaType: true,
    imageUrl: true,
    videoUrl: true,
    bannerType: true,
    displayFor: true,
    displayOrder: true,
} as const;

// ─── Hero Banners (desktop/web) ───────────────────────────────────────────────
export const getActiveHeroBanners = unstable_cache(
    async () => {
        return prisma.heroBanner.findMany({
            where: {
                isActive: true,
                bannerType: "HERO",
            },
            orderBy: { displayOrder: "asc" },
            select: BANNER_SELECT,
        });
    },
    ["hero-banners"],
    { revalidate: 3600, tags: [CACHE_TAGS.BANNERS] }
);

// Web-only hero banners (displayFor = WEB or BOTH)
export const getActiveWebHeroBanners = unstable_cache(
    async () => {
        return prisma.heroBanner.findMany({
            where: {
                isActive: true,
                bannerType: "HERO",
                displayFor: { in: ["WEB", "BOTH"] },
            } as any,
            orderBy: { displayOrder: "asc" },
            select: BANNER_SELECT,
        });
    },
    ["web-hero-banners"],
    { revalidate: 3600, tags: [CACHE_TAGS.BANNERS] }
);

// Mobile-only hero banners (displayFor = MOBILE or BOTH)
export const getActiveMobileHeroBanners = unstable_cache(
    async () => {
        return prisma.heroBanner.findMany({
            where: {
                isActive: true,
                bannerType: "HERO",
                displayFor: { in: ["MOBILE", "BOTH"] },
            } as any,
            orderBy: { displayOrder: "asc" },
            select: BANNER_SELECT,
        });
    },
    ["mobile-hero-banners"],
    { revalidate: 3600, tags: [CACHE_TAGS.BANNERS] }
);

// ─── Mid-Page Banners ─────────────────────────────────────────────────────────
export const getActiveMidPageBanners = unstable_cache(
    async () => {
        return prisma.heroBanner.findMany({
            where: { isActive: true, bannerType: "MID_PAGE" },
            orderBy: { displayOrder: "asc" },
            select: BANNER_SELECT,
        });
    },
    ["mid-page-banners"],
    { revalidate: 3600, tags: [CACHE_TAGS.BANNERS] }
);

// ─── Bottom-Page Banners ──────────────────────────────────────────────────────
export const getActiveBottomPageBanners = unstable_cache(
    async () => {
        return prisma.heroBanner.findMany({
            where: { isActive: true, bannerType: "BOTTOM_PAGE" },
            orderBy: { displayOrder: "asc" },
            select: BANNER_SELECT,
        });
    },
    ["bottom-page-banners"],
    { revalidate: 3600, tags: [CACHE_TAGS.BANNERS] }
);
