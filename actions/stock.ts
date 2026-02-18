"use server";

import prisma from "@/lib/prisma";

/**
 * Fetches the real-time stock for a product.
 * @param productId The ID of the product to check.
 * @returns The current stock quantity, or -1 if product not found.
 */
export async function getRealTimeStock(productId: string): Promise<number> {
    try {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { stock: true },
        });

        return product?.stock ?? -1;
    } catch (error) {
        console.error("Error fetching real-time stock:", error);
        return -1;
    }
}

/**
 * Validates if the requested quantity is available.
 * @param productId The ID of the product.
 * @param requestedQuantity The quantity the user wants to add.
 * @returns boolean indicating if the stock is sufficient.
 */
export async function validateStock(productId: string, requestedQuantity: number): Promise<boolean> {
    try {
        const stock = await getRealTimeStock(productId);
        return stock >= requestedQuantity;
    } catch (error) {
        return false;
    }
}
