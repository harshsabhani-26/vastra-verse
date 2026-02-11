import prisma from "@/lib/prisma";
import { cache } from "react";

/**
 * Pure data access layer for banner queries
 * 
 * RULES:
 * - NO "use server" directive
 * - NO admin imports
 * - Read-only operations only
 * - Uses React cache for request deduplication
 */

export const getActiveHeroBanners = cache(async () => {
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
});

export const getActiveMidPageBanners = cache(async () => {
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
});

export const getActiveBottomPageBanners = cache(async () => {
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
});
