"use server";

import prisma from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";

export interface StoryWithProduct {
    id: string;
    title: string;
    videoUrl: string | null;
    videoFile: string | null;
    thumbnailImage: string;
    productId: string | null;
    price: number | null;
    isActive: boolean;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
    product?: {
        id: string;
        name: string;
        price: number;
        finalPrice: number | null;
        images: { url: string }[];
    } | null;
}

export async function getStories(): Promise<StoryWithProduct[]> {
    try {
        const stories = await (prisma as any).story.findMany({
            orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        finalPrice: true,
                        images: { select: { url: true }, take: 1 },
                    },
                },
            },
        });

        return stories.map((s: any) => ({
            ...s,
            price: s.price ? parseFloat(s.price.toString()) : null,
            product: s.product
                ? {
                    ...s.product,
                    price: parseFloat(s.product.price.toString()),
                    finalPrice: s.product.finalPrice
                        ? parseFloat(s.product.finalPrice.toString())
                        : null,
                }
                : null,
        }));
    } catch (error) {
        console.error("Failed to fetch stories:", error);
        return [];
    }
}

// Active stories for frontend — max 6, ordered by displayOrder then createdAt
export async function getActiveStories(): Promise<StoryWithProduct[]> {
    try {
        const stories = await (prisma as any).story.findMany({
            where: { isActive: true },
            orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
            take: 6,
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        finalPrice: true,
                        images: { select: { url: true }, take: 1 },
                    },
                },
            },
        });

        return stories.map((s: any) => ({
            ...s,
            price: s.price ? parseFloat(s.price.toString()) : null,
            product: s.product
                ? {
                    ...s.product,
                    price: parseFloat(s.product.price.toString()),
                    finalPrice: s.product.finalPrice
                        ? parseFloat(s.product.finalPrice.toString())
                        : null,
                }
                : null,
        }));
    } catch (error) {
        console.error("Failed to fetch active stories:", error);
        return [];
    }
}

type StoryInput = {
    title: string;
    videoUrl?: string | null;
    videoFile?: string | null;
    thumbnailImage: string;
    productId?: string | null;
    price?: number | null;
    isActive?: boolean;
    displayOrder?: number;
};

export async function createStory(data: StoryInput) {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const story = await (prisma as any).story.create({
            data: {
                title: data.title,
                videoUrl: data.videoUrl ?? null,
                videoFile: data.videoFile ?? null,
                thumbnailImage: data.thumbnailImage,
                productId: data.productId ?? null,
                price: data.price != null ? data.price : null,
                isActive: data.isActive ?? true,
                displayOrder: data.displayOrder ?? 0,
            },
        });
        revalidatePath("/admin/stories");
        revalidatePath("/");
        return {
            success: true,
            story: {
                ...story,
                price: story.price ? parseFloat(story.price.toString()) : null,
            }
        };
    } catch (error) {
        console.error("Failed to create story:", error);
        return { success: false, error: "Failed to create story" };
    }
}

export async function updateStory(id: string, data: Partial<StoryInput>) {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const story = await (prisma as any).story.update({
            where: { id },
            data: {
                ...(data.title !== undefined && { title: data.title }),
                ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
                ...(data.videoFile !== undefined && { videoFile: data.videoFile }),
                ...(data.thumbnailImage !== undefined && {
                    thumbnailImage: data.thumbnailImage,
                }),
                ...(data.productId !== undefined && { productId: data.productId }),
                ...(data.price !== undefined && { price: data.price }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
                ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
            },
        });
        revalidatePath("/admin/stories");
        revalidatePath("/");
        return {
            success: true,
            story: {
                ...story,
                price: story.price ? parseFloat(story.price.toString()) : null,
            }
        };
    } catch (error) {
        console.error("Failed to update story:", error);
        return { success: false, error: "Failed to update story" };
    }
}

export async function deleteStory(id: string) {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await (prisma as any).story.delete({ where: { id } });
        revalidatePath("/admin/stories");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete story:", error);
        return { success: false, error: "Failed to delete story" };
    }
}

export async function toggleStoryStatus(id: string, isActive: boolean) {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await (prisma as any).story.update({ where: { id }, data: { isActive } });
        revalidatePath("/admin/stories");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle story status:", error);
        return { success: false, error: "Failed to toggle status" };
    }
}

export async function reorderStories(storyIds: string[]) {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await Promise.all(
            storyIds.map((id, index) =>
                (prisma as any).story.update({
                    where: { id },
                    data: { displayOrder: index },
                })
            )
        );
        revalidatePath("/admin/stories");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to reorder stories:", error);
        return { success: false, error: "Failed to reorder stories" };
    }
}

export async function getProducts() {
    try {
        const products = await prisma.product.findMany({
            where: { status: "PUBLISHED" },
            select: {
                id: true,
                name: true,
                price: true,
                finalPrice: true,
                images: { select: { url: true }, take: 1 },
            },
            orderBy: { name: "asc" },
        });
        return products.map((p) => ({
            ...p,
            price: parseFloat(p.price.toString()),
            finalPrice: p.finalPrice ? parseFloat(p.finalPrice.toString()) : null,
        }));
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return [];
    }
}
