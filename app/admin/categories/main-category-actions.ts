"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createMainCategory(name: string) {
    try {
        // Auto-generate a href (slugified name) for a basic URL since we don't have a URL form input field
        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
        const href = `/shop?category=${slug}`;

        const cat = await prisma.mainCategory.create({
            data: {
                name,
                href,
            }
        });
        // Revalidate everywhere since header is global
        revalidatePath("/", "layout");
        return { success: true, data: cat };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function toggleMainCategoryActive(id: string, isActive: boolean) {
    try {
        const cat = await prisma.mainCategory.update({
            where: { id },
            data: { isActive },
        });
        revalidatePath("/", "layout");
        return { success: true, data: cat };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteMainCategory(id: string) {
    try {
        await prisma.mainCategory.delete({
            where: { id },
        });
        revalidatePath("/", "layout");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
