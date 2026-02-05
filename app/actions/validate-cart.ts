/**
 * Server Action: Validate Cart Before Checkout
 * 
 * Validates cart items against live database:
 * - Products still exist and are published
 * - Prices haven't changed
 * - Stock is available
 * 
 * Returns validation results and updated product data
 */

import prisma from "@/lib/prisma";

export interface CartValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    updatedItems?: Array<{
        id: string;
        name: string;
        price: number;
        stock: number;
        status: string;
    }>;
}

export async function validateCartBeforeCheckout(
    cartItems: Array<{ id: string; quantity: number; price: number }>
): Promise<CartValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const updatedItems: any[] = [];

    try {
        // Fetch all products in a single query
        const productIds = cartItems.map(item => item.id);
        const products = await prisma.product.findMany({
            where: {
                id: { in: productIds }
            },
            select: {
                id: true,
                name: true,
                price: true,
                stock: true,
                status: true,
            }
        });

        // Create a map for quick lookup
        const productMap = new Map(products.map(p => [p.id, p]));

        // Validate each cart item
        for (const cartItem of cartItems) {
            const product = productMap.get(cartItem.id);

            // Check if product exists
            if (!product) {
                errors.push(`Product ID ${cartItem.id} no longer exists`);
                continue;
            }

            // Check if product is published
            if (product.status !== 'PUBLISHED') {
                errors.push(`"${product.name}" is no longer available for purchase`);
                continue;
            }

            // Check stock availability
            if (product.stock < cartItem.quantity) {
                if (product.stock === 0) {
                    errors.push(`"${product.name}" is out of stock`);
                } else {
                    errors.push(
                        `Insufficient stock for "${product.name}". ` +
                        `Available: ${product.stock}, Requested: ${cartItem.quantity}`
                    );
                }
                continue;
            }

            // Check price changes
            const dbPrice = Number(product.price);
            if (cartItem.price !== dbPrice) {
                warnings.push(
                    `Price for "${product.name}" changed from ₹${cartItem.price} to ₹${dbPrice}`
                );
            }

            // Add to updated items
            updatedItems.push({
                id: product.id,
                name: product.name,
                price: dbPrice,
                stock: product.stock,
                status: product.status,
            });
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            updatedItems: errors.length === 0 ? updatedItems : undefined,
        };

    } catch (error) {
        console.error("Cart validation error:", error);
        return {
            valid: false,
            errors: ["Failed to validate cart. Please try again."],
            warnings: [],
        };
    }
}
