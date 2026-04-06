"use server";

import prisma from "@/lib/prisma";
import { revalidatePath, unstable_cache } from "next/cache";
import { auth } from "@/auth";
import { CACHE_TAGS, revalidateBanners } from "@/lib/cache/cache-tags";


export interface HeroBanner {
    id: string;
    ctaLink: string;
    mediaType: "IMAGE" | "VIDEO";
    imageUrl: string;
    videoUrl?: string | null;
    // Banner Type
    bannerType: "HERO" | "MID_PAGE" | "BOTTOM_PAGE";
    // Display Target
    displayFor: "WEB" | "MOBILE" | "BOTH";
    displayOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Get all banners (optionally filter by type) - for admin panel
export async function getBanners(bannerType?: "HERO" | "MID_PAGE" | "BOTTOM_PAGE") {
    try {
        const banners = await prisma.heroBanner.findMany({
            where: bannerType ? { bannerType } : undefined,
            orderBy: { displayOrder: 'asc' }
        });
        return banners;
    } catch (error) {
        console.error("Failed to fetch banners:", error);
        return [];
    }
}



// PERFORMANCE: Cache wrapper to deduplicate requests across renders
// Reduces DB calls from 2,710 → ~50 per deployment
// PERFORMANCE: Cached query for hero banners with 60s revalidation
// Reduces DB calls from hundreds per minute to ~1 per minute
export const getActiveBanners = unstable_cache(
    async () => {
        const banners = await prisma.heroBanner.findMany({
            where: {
                isActive: true,
                bannerType: "HERO"
            },
            orderBy: { displayOrder: 'asc' },
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
        return banners;
    },
    ['active-hero-banners'],
    {
        revalidate: 60, // Cache for 60 seconds
        tags: [CACHE_TAGS.BANNERS]
    }
);

// Get active MID_PAGE banners only
export async function getActiveMidPageBanners() {
    try {
        const banners = await prisma.heroBanner.findMany({
            where: {
                isActive: true,
                bannerType: "MID_PAGE"
            },
            orderBy: { displayOrder: 'asc' },
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
        return banners;
    } catch (error) {
        console.error("Failed to fetch active mid-page banners:", error);
        return [];
    }
}

// Get active BOTTOM_PAGE banners only
export async function getActiveBottomPageBanners() {
    try {
        const banners = await prisma.heroBanner.findMany({
            where: {
                isActive: true,
                bannerType: "BOTTOM_PAGE"
            },
            orderBy: { displayOrder: 'asc' },
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
        return banners;
    } catch (error) {
        console.error("Failed to fetch active bottom-page banners:", error);
        return [];
    }
}

// Get single banner
export async function getBanner(id: string) {
    try {
        const banner = await prisma.heroBanner.findUnique({
            where: { id }
        });
        return banner;
    } catch (error) {
        console.error("Failed to fetch banner:", error);
        return null;
    }
}

// Create banner - exclude id, createdAt, updatedAt (Prisma auto-manages timestamps)
export async function createBanner(data: Omit<HeroBanner, 'id' | 'createdAt' | 'updatedAt'>) {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const banner = await prisma.heroBanner.create({
            data
        });
        revalidatePath('/admin/banners');
        revalidatePath('/');
        await revalidateBanners();
        return { success: true, banner };
    } catch (error) {
        console.error("Failed to create banner:", error);
        return { success: false, error: "Failed to create banner" };
    }
}

// Update banner - exclude id, createdAt, updatedAt (Prisma auto-manages timestamps)
export async function updateBanner(id: string, data: Partial<Omit<HeroBanner, 'id' | 'createdAt' | 'updatedAt'>>) {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const banner = await prisma.heroBanner.update({
            where: { id },
            data
        });
        revalidatePath('/admin/banners');
        revalidatePath('/');
        await revalidateBanners();
        return { success: true, banner };
    } catch (error) {
        console.error("Failed to update banner:", error);
        return { success: false, error: "Failed to update banner" };
    }
}

// Delete banner
export async function deleteBanner(id: string) {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await prisma.heroBanner.delete({
            where: { id }
        });
        revalidatePath('/admin/banners');
        revalidatePath('/');
        await revalidateBanners();
        return { success: true };
    } catch (error) {
        console.error("Failed to delete banner:", error);
        return { success: false, error: "Failed to delete banner" };
    }
}

// Toggle banner active status
export async function toggleBannerStatus(id: string, isActive: boolean) {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await prisma.heroBanner.update({
            where: { id },
            data: { isActive }
        });
        revalidatePath('/admin/banners');
        revalidatePath('/');
        await revalidateBanners();
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle banner status:", error);
        return { success: false, error: "Failed to toggle status" };
    }
}

// Reorder banners
export async function reorderBanners(bannerIds: string[]) {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await Promise.all(
            bannerIds.map((id, index) =>
                prisma.heroBanner.update({
                    where: { id },
                    data: { displayOrder: index }
                })
            )
        );
        revalidatePath('/admin/banners');
        revalidatePath('/');
        await revalidateBanners();
        return { success: true };
    } catch (error) {
        console.error("Failed to reorder banners:", error);
        return { success: false, error: "Failed to reorder banners" };
    }
}
