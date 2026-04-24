import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { productId, quantity, userId, checkoutSessionId } = body;

        if (!productId || !userId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const qty = quantity || 1;

        // Idempotency Check using OrderTimeline (as implemented in checkout.ts)
        // For a more robust DB constraint, we'd add checkoutSessionId to Order,
        // but since we are testing the current schema, we'll use a transaction for safety.
        if (checkoutSessionId) {
            const existingTimeline = await prisma.orderTimeline.findFirst({
                where: {
                    details: { contains: checkoutSessionId },
                    event: "Order Placed",
                    order: { userId },
                },
                select: { orderId: true },
            });
            if (existingTimeline) {
                return NextResponse.json({ success: true, message: "Already processed", orderId: existingTimeline.orderId }, { status: 409 });
            }
        }

        const orderId = await prisma.$transaction(async (tx) => {
            // Check idempotency again inside the transaction for concurrency safety!
            if (checkoutSessionId) {
                const existing = await tx.orderTimeline.findFirst({
                    where: {
                        details: { contains: checkoutSessionId },
                        event: "Order Placed",
                        order: { userId },
                    },
                    select: { orderId: true },
                });
                if (existing) {
                    throw new Error("IDEMPOTENCY_CONFLICT");
                }
            }

            // ATOMIC stock validation + decrement
            const updatedProduct = await tx.product.updateMany({
                where: {
                    id: productId,
                    stock: { gte: qty },
                    status: "PUBLISHED",
                },
                data: {
                    stock: { decrement: qty },
                },
            });

            if (updatedProduct.count === 0) {
                throw new Error("OUT_OF_STOCK");
            }

            // Fetch product price to create order correctly
            const product = await tx.product.findUnique({ where: { id: productId } });
            if (!product) throw new Error("Product missing");

            const price = Number(product.price);
            const total = price * qty;

            // Create the order
            const order = await tx.order.create({
                data: {
                    userId,
                    total: new Decimal(total),
                    subtotal: new Decimal(total),
                    status: "CONFIRMED",
                    paymentStatus: "PENDING",
                    paymentMethod: "COD",
                    customerName: "Test User",
                    shippingAddress: "Test Address",
                    items: {
                        create: [
                            {
                                productId,
                                quantity: qty,
                                price: new Decimal(price),
                            }
                        ]
                    }
                },
            });

            // Create timeline event to store session for idempotency
            await tx.orderTimeline.create({
                data: {
                    orderId: order.id,
                    event: "Order Placed",
                    details: `COD order placed. Session: ${checkoutSessionId || "none"}`,
                    createdBy: userId,
                },
            });

            return order.id;
        });

        return NextResponse.json({ success: true, orderId }, { status: 200 });

    } catch (error: any) {
        if (error.message === "IDEMPOTENCY_CONFLICT") {
            return NextResponse.json({ error: "Duplicate order prevented" }, { status: 409 });
        }
        if (error.message === "OUT_OF_STOCK") {
            return NextResponse.json({ error: "Item is out of stock" }, { status: 400 });
        }
        
        console.error("Test COD error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
