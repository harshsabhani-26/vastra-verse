"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

    return cart;
}

export async function addToCart(productId: string, quantity: number = 1) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated" };

    try {
        let cart = await prisma.cart.findUnique({
            where: { userId: session.user.id }
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId: session.user.id }
            });
        }

        const existingItem = await prisma.cartItem.findUnique({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId
                }
            }
        });

        if (existingItem) {
            await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + quantity }
            });
        } else {
            await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    quantity
                }
            });
        }

        revalidatePath('/cart');
        return { success: true };
    } catch (error) {
        console.error("Add to cart error:", error);
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
