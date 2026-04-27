"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getRealTimeStock } from "@/actions/stock";

export async function getCart() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const cart = await prisma.cart.findUnique({
        where: { userId: session.user.id },
        include: {
            items: {
                include: {
                    product: {
                        include: {
                            images: true
                        }
                    }
                }
            }
        }
    });

    return cart ? JSON.parse(JSON.stringify(cart)) : null;
}



export async function addToCart(productId: string, quantity: number = 1) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated" };

    try {
        // Validate Stock
        await prisma.$transaction(async (tx) => {
            // Step 1: Attempt atomic stock decrement
            const updated = await tx.product.updateMany({
                where: {
                    id: productId,
                    stock: { gte: quantity },
                },
                data: {
                    stock: { decrement: quantity },
                },
            });

            // Step 2: If no rows updated -> out of stock
            if (updated.count === 0) {
                throw new Error("OUT_OF_STOCK");
            }

            // Step 3: Atomic find-or-create cart
            const cart = await tx.cart.upsert({
                where: { userId: session.user.id },
                create: { userId: session.user.id },
                update: {}
            });

            await tx.cartItem.upsert({
                where: {
                    cartId_productId: {
                        cartId: cart.id,
                        productId
                    }
                },
                create: {
                    cartId: cart.id,
                    productId,
                    quantity
                },
                update: {
                    quantity: { increment: quantity }
                }
            });
        });

        revalidatePath('/cart');
        return { success: true };
    } catch (error: any) {
        if (error.message === "OUT_OF_STOCK") {
            return { success: false, error: "Item is out of stock" };
        }

        console.error("=== ADD TO CART FAILED ===");
        console.error("ProductId:", productId, "| Quantity:", quantity);
        console.error("Error:", error?.message || error);
        return { success: false, error: "Failed to add item" };
    }
}

export async function updateCartItem(itemId: string, quantity: number) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated" };

    try {
        if (quantity <= 0) {
            await prisma.cartItem.delete({ where: { id: itemId } });
        } else {
            // Get product ID from item to check stock
            const item = await prisma.cartItem.findUnique({
                where: { id: itemId },
                select: { productId: true }
            });

            if (!item) return { success: false, error: "Item not found" };

            const stock = await getRealTimeStock(item.productId);
            if (quantity > stock) {
                return { success: false, error: `Only ${stock} units available` };
            }

            await prisma.cartItem.update({
                where: { id: itemId },
                data: { quantity }
            });
        }
        revalidatePath('/cart');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update item" };
    }
}

export async function removeFromCart(itemId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated" };

    try {
        await prisma.cartItem.delete({ where: { id: itemId } });
        revalidatePath('/cart');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to remove item" };
    }
}

export async function syncCart(localItems: { id: string, quantity: number }[]) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated" };

    try {
        let cart = await prisma.cart.findUnique({
            where: { userId: session.user.id }
        });

        if (!cart) {
            // Verify user exists in DB before creating cart (prevents FK error from stale sessions)
            const userExists = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { id: true }
            });
            if (!userExists) {
                return { success: false, error: "Session expired. Please logout and login again." };
            }

            cart = await prisma.cart.create({
                data: { userId: session.user.id }
            });
        }

        for (const item of localItems) {
            // Upsert items from local storage
            const existingItem = await prisma.cartItem.findUnique({
                where: {
                    cartId_productId: {
                        cartId: cart.id,
                        productId: item.id // assuming item.id is productId in local storage
                    }
                }
            });

            if (existingItem) {
                // Determine strategy: Keep DB, Keep Local, or Sum?
                // Usually Sum or Max. Let's start with Sum? Or just Ensure at least local qty?
                // Plan: If exists, we do nothing (assume DB is source of truth if already there), OR we add local quantity?
                // User requirement: "login throw other id user can see that cart item... user loggin user gets his data again"
                // Strategy: Merge. DB quantity += Local quantity.
                // But if they just bought it? 
                // Let's go with: Update to max(db, local) or just sum? 
                // Simplest: Add local to DB.
                await prisma.cartItem.update({
                    where: { id: existingItem.id },
                    data: { quantity: existingItem.quantity } // Don't double count for now, just ensure it exists?
                    // Actually, if I add as guest (qty 1) and login (qty 1 in DB), should be 2?
                    // Or 1?
                    // Let's assume user wants to KEEP what they just added.
                    // If conflict, usually we keep the 'latest' or sum.
                    // For now, I will NOT increment if it exists, to avoid accidental double purchase.
                });
            } else {
                await prisma.cartItem.create({
                    data: {
                        cartId: cart.id,
                        productId: item.id,
                        quantity: item.quantity
                    }
                });
            }
        }

        revalidatePath('/cart');
        return { success: true };
    } catch (error) {
        console.error("Sync cart error:", error);
        return { success: false, error: "Failed to sync cart" };
    }
}

export async function clearCart() {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    try {
        const cart = await prisma.cart.findUnique({
            where: { userId: session.user.id }
        });

        if (cart) {
            await prisma.cartItem.deleteMany({
                where: { cartId: cart.id }
            });
        }

        revalidatePath('/cart');
        return { success: true };
    } catch (error) {
        console.error("Clear cart error:", error);
        return { success: false, error: "Failed to clear cart" };
    }
}
