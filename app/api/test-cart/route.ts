import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { productId, quantity, userId } = body;

        if (!productId || !userId) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const qty = quantity || 1;

        // Use a Prisma Transaction to eliminate Race Conditions
        await prisma.$transaction(async (tx) => {
            // Step 1: Attempt atomic stock decrement (No check-then-act)
            const updated = await tx.product.updateMany({
                where: {
                    id: productId,
                    stock: { gte: qty },
                },
                data: {
                    stock: { decrement: qty },
                },
            });

            // Step 2: If no rows updated -> out of stock
            if (updated.count === 0) {
                throw new Error("OUT_OF_STOCK");
            }

            // Step 3: Atomic find-or-create cart (1 query instead of 2)
            const cart = await tx.cart.upsert({
                where: { userId },
                create: { userId },
                update: {}
            });

            // Step 4: ATOMIC UPSERT
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
                    quantity: qty
                },
                update: {
                    quantity: { increment: qty }
                }
            });
        });

        return NextResponse.json({ success: true, message: "Item added to cart successfully" }, { status: 200 });
    } catch (error: any) {
        console.error("[TEST CART ERROR]", error.message);
        
        if (error.message === "OUT_OF_STOCK") {
            return NextResponse.json({ success: false, error: "Item is out of stock" }, { status: 409 });
        }

        return NextResponse.json({ success: false, error: "Validation Error / Bad Request" }, { status: 400 });
    }
}
