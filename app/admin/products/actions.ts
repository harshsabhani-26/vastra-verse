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

export async function deleteProduct(productId: string) {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    try {
        await prisma.product.delete({
            where: { id: productId }
        });

        revalidatePath("/admin/products");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete product:", error);
        throw new Error("Failed to delete product");
    }
}

export async function updateProduct(productId: string, formData: FormData) {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = formData.get("price") as string;
    const stock = formData.get("stock") as string;
    const categoryName = formData.get("categoryId") as string;

    try {
        await prisma.product.update({
            where: { id: productId },
            data: {
                name,
                description,
                price: parseFloat(price),
                stock: parseInt(stock),
                category: {
                    connectOrCreate: {
                        where: { name: categoryName },
                        create: {
                            name: categoryName,
                            description: `Collection of ${categoryName}`,
                            slug: generateSlug(categoryName)
                        }
                    }
                }
            }
        });

        revalidatePath("/admin/products");
        redirect("/admin/products");
    } catch (error) {
        console.error("Failed to update product:", error);
        // Show the actual error message for debugging
        const errorMessage = error instanceof Error ? error.message : "Failed to update product";
        throw new Error(`Failed to update product: ${errorMessage}`);
    }
}
