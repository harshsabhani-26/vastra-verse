"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

// Utility function to generate slug from name
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}

export async function createCategory(formData: FormData) {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name || !description) {
        throw new Error("Name and description are required");
    }

    try {
        await prisma.category.create({
            data: {
                name,
                description,
                slug: generateSlug(name)
            }
        });
    } catch (error) {
        console.error("Failed to create category:", error);
        throw new Error("Failed to create category");
    }

    revalidatePath("/admin/categories");
    redirect("/admin/categories");
}

export async function updateCategory(categoryId: string, formData: FormData) {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    try {
        await prisma.category.update({
            where: { id: categoryId },
            data: {
                name,
                description
            }
        });
    } catch (error) {
        console.error("Failed to update category:", error);
        throw new Error("Failed to update category");
    }

    revalidatePath("/admin/categories");
    redirect("/admin/categories");
}

export async function deleteCategory(categoryId: string) {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    try {
        // Check if category has products
        const productsCount = await prisma.product.count({
            where: { categoryId }
        });

        if (productsCount > 0) {
            throw new Error(`Cannot delete category with ${productsCount} products. Please reassign or delete the products first.`);
        }

        await prisma.category.delete({
            where: { id: categoryId }
        });

        revalidatePath("/admin/categories");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete category:", error);
        throw new Error(error.message || "Failed to delete category");
    }
}
