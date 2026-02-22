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

export const getActiveHeroBanners = unstable_cache(
    async () => {
        return prisma.heroBanner.findMany({
            where: {
                isActive: true,
                bannerType: "HERO"
            },
            orderBy: {
                displayOrder: "asc"
            },
            select: {
                id: true,
                ctaLink: true,
                mediaType: true,
                imageUrl: true,
                videoUrl: true,
                bannerType: true,
                displayOrder: true,
            }
        });
    },
    ['hero-banners'],
    {
        revalidate: 3600,
        tags: [CACHE_TAGS.BANNERS]
    }
);

export const getActiveMidPageBanners = unstable_cache(
    async () => {
        return prisma.heroBanner.findMany({
            where: {
                isActive: true,
                bannerType: "MID_PAGE"
            },
            orderBy: {
                displayOrder: "asc"
            },
            select: {
                id: true,
                ctaLink: true,
                mediaType: true,
                imageUrl: true,
                videoUrl: true,
                bannerType: true,
                displayOrder: true,
            }
        });
    },
    ['mid-page-banners'],
    {
        revalidate: 3600,
        tags: [CACHE_TAGS.BANNERS]
    }
);

export const getActiveBottomPageBanners = unstable_cache(
    async () => {
        return prisma.heroBanner.findMany({
            where: {
                isActive: true,
                bannerType: "BOTTOM_PAGE"
            },
            orderBy: {
                displayOrder: "asc"
            },
            select: {
                id: true,
                ctaLink: true,
                mediaType: true,
                imageUrl: true,
                videoUrl: true,
                bannerType: true,
                displayOrder: true,
            }
        });
    },
    ['bottom-page-banners'],
    {
        revalidate: 3600,
        tags: [CACHE_TAGS.BANNERS]
    }
);
