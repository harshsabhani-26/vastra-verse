"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SocialImage {
    id: string;
    imageFile: string;
    title: string | null;
    redirectUrl: string | null;
    displayOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface SocialVideo {
    id: string;
    videoUrl: string | null;
    videoFile: string | null;
    thumbnail: string;
    overlayText: string | null;
    redirectUrl: string | null;
    displayOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Social Images ─────────────────────────────────────────────────────────────

export async function getSocialImages(): Promise<SocialImage[]> {
    try {
        return await (prisma as any).socialImage.findMany({
            orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
        });
    } catch (error) {
        console.error("Failed to fetch social images:", error);
        return [];
    }
}

export async function getActiveSocialImages(): Promise<SocialImage[]> {
    try {
        return await (prisma as any).socialImage.findMany({
            where: { isActive: true },
            orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
            take: 4,
        });
    } catch (error) {
        console.error("Failed to fetch active social images:", error);
        return [];
    }
}

type SocialImageInput = {
    imageFile: string;
    title?: string | null;
    redirectUrl?: string | null;
    isActive?: boolean;
    displayOrder?: number;
};

export async function createSocialImage(data: SocialImageInput) {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
        return { success: false, error: "Unauthorized" };
    }
    try {
        const item = await (prisma as any).socialImage.create({ data });
        revalidatePath("/admin/socials");
        revalidatePath("/");
        return { success: true, item };
    } catch (error) {
        console.error("Failed to create social image:", error);
        return { success: false, error: "Failed to create social image" };
    }
}

export async function updateSocialImage(id: string, data: Partial<SocialImageInput>) {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
        return { success: false, error: "Unauthorized" };
    }
    try {
        const item = await (prisma as any).socialImage.update({ where: { id }, data });
        revalidatePath("/admin/socials");
        revalidatePath("/");
        return { success: true, item };
    } catch (error) {
        console.error("Failed to update social image:", error);
        return { success: false, error: "Failed to update social image" };
    }
}

export async function deleteSocialImage(id: string) {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
        return { success: false, error: "Unauthorized" };
    }
    try {
        await (prisma as any).socialImage.delete({ where: { id } });
        revalidatePath("/admin/socials");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete social image:", error);
        return { success: false, error: "Failed to delete social image" };
    }
}

export async function toggleSocialImageStatus(id: string, isActive: boolean) {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
        return { success: false, error: "Unauthorized" };
    }
    try {
        await (prisma as any).socialImage.update({ where: { id }, data: { isActive } });
        revalidatePath("/admin/socials");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to toggle status" };
    }
}

export async function reorderSocialImages(ids: string[]) {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
        return { success: false, error: "Unauthorized" };
    }
    try {
        await Promise.all(
            ids.map((id, index) =>
                (prisma as any).socialImage.update({ where: { id }, data: { displayOrder: index } })
            )
        );
        revalidatePath("/admin/socials");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Reorder failed" };
    }
}

// ─── Social Videos ─────────────────────────────────────────────────────────────

export async function getSocialVideos(): Promise<SocialVideo[]> {
    try {
        return await (prisma as any).socialVideo.findMany({
            orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
        });
    } catch (error) {
        console.error("Failed to fetch social videos:", error);
        return [];
    }
}

export async function getActiveSocialVideos(): Promise<SocialVideo[]> {
    try {
        return await (prisma as any).socialVideo.findMany({
            where: { isActive: true },
            orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
            take: 7,
        });
    } catch (error) {
        console.error("Failed to fetch active social videos:", error);
        return [];
    }
}

type SocialVideoInput = {
    videoUrl?: string | null;
    videoFile?: string | null;
    thumbnail: string;
    overlayText?: string | null;
    redirectUrl?: string | null;
    isActive?: boolean;
    displayOrder?: number;
};

export async function createSocialVideo(data: SocialVideoInput) {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
        return { success: false, error: "Unauthorized" };
    }
    try {
        const item = await (prisma as any).socialVideo.create({ data });
        revalidatePath("/admin/socials");
        revalidatePath("/");
        return { success: true, item };
    } catch (error) {
        console.error("Failed to create social video:", error);
        return { success: false, error: "Failed to create social video" };
    }
}

export async function updateSocialVideo(id: string, data: Partial<SocialVideoInput>) {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
        return { success: false, error: "Unauthorized" };
    }
    try {
        const item = await (prisma as any).socialVideo.update({ where: { id }, data });
        revalidatePath("/admin/socials");
        revalidatePath("/");
        return { success: true, item };
    } catch (error) {
        console.error("Failed to update social video:", error);
        return { success: false, error: "Failed to update social video" };
    }
}

export async function deleteSocialVideo(id: string) {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
        return { success: false, error: "Unauthorized" };
    }
    try {
        await (prisma as any).socialVideo.delete({ where: { id } });
        revalidatePath("/admin/socials");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete social video:", error);
        return { success: false, error: "Failed to delete social video" };
    }
}

export async function toggleSocialVideoStatus(id: string, isActive: boolean) {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
        return { success: false, error: "Unauthorized" };
    }
    try {
        await (prisma as any).socialVideo.update({ where: { id }, data: { isActive } });
        revalidatePath("/admin/socials");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to toggle status" };
    }
}

export async function reorderSocialVideos(ids: string[]) {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
        return { success: false, error: "Unauthorized" };
    }
    try {
        await Promise.all(
            ids.map((id, index) =>
                (prisma as any).socialVideo.update({ where: { id }, data: { displayOrder: index } })
            )
        );
        revalidatePath("/admin/socials");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Reorder failed" };
    }
}
