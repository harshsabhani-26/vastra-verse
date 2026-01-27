"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface HeroBanner {
    id: string;
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    imageUrl: string;
    displayOrder: number;
    isActive: boolean;
}

// Get all banners
export async function getBanners() {
    try {
        const banners = await prisma.heroBanner.findMany({
            orderBy: { displayOrder: 'asc' }
        });
        return banners;
    } catch (error) {
        console.error("Failed to fetch banners:", error);
        return [];
    }
}

// Get active banners only (for frontend)
export async function getActiveBanners() {
    try {
        const banners = await prisma.heroBanner.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' }
        });
        return banners;
    } catch (error) {
        console.error("Failed to fetch active banners:", error);
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

// Create banner
export async function createBanner(data: Omit<HeroBanner, 'id'>) {
    try {
        const banner = await prisma.heroBanner.create({
            data
        });
        revalidatePath('/admin/banners');
        revalidatePath('/');
        return { success: true, banner };
    } catch (error) {
        console.error("Failed to create banner:", error);
        return { success: false, error: "Failed to create banner" };
    }
}

// Update banner
export async function updateBanner(id: string, data: Partial<Omit<HeroBanner, 'id'>>) {
    try {
        const banner = await prisma.heroBanner.update({
            where: { id },
            data
        });
        revalidatePath('/admin/banners');
        revalidatePath('/');
        return { success: true, banner };
    } catch (error) {
        console.error("Failed to update banner:", error);
        return { success: false, error: "Failed to update banner" };
    }
}

// Delete banner
export async function deleteBanner(id: string) {
    try {
        await prisma.heroBanner.delete({
            where: { id }
        });
        revalidatePath('/admin/banners');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete banner:", error);
        return { success: false, error: "Failed to delete banner" };
    }
}

// Toggle banner active status
export async function toggleBannerStatus(id: string, isActive: boolean) {
    try {
        await prisma.heroBanner.update({
            where: { id },
            data: { isActive }
        });
        revalidatePath('/admin/banners');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle banner status:", error);
        return { success: false, error: "Failed to toggle status" };
    }
}

// Reorder banners
export async function reorderBanners(bannerIds: string[]) {
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
        return { success: true };
    } catch (error) {
        console.error("Failed to reorder banners:", error);
        return { success: false, error: "Failed to reorder banners" };
    }
}
