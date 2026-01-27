"use server";

import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function createOrder(formData: FormData) {
    const session = await auth();

    // Require authentication for checkout
    if (!session?.user?.id) {
        redirect("/login?callbackUrl=/cart");
    }

    // Extract form data
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const zip = formData.get("zip") as string;
    const paymentMethod = formData.get("payment") as string;

    // Extract cart data
    const cartItemsJson = formData.get("cartItems") as string;
    const total = Number(formData.get("total")) || 0;

    let items: any[] = [];
    try {
        items = cartItemsJson ? JSON.parse(cartItemsJson) : [];
    } catch (e) {
        console.error("Failed to parse cart items", e);
    }

    // Validate cart items
    if (items.length === 0) {
        throw new Error("Cart is empty");
    }

    // Create shipping address string
    const shippingAddress = `${address}, ${city}, ${zip}`;
    const customerName = `${firstName} ${lastName}`;

    // Create order with stock reduction in a transaction
    const orderId = await prisma.$transaction(async (tx: any) => {
        // Create the order
        const order = await tx.order.create({
            data: {
                userId: session.user.id,
                total: total,
                status: "PENDING",
                paymentStatus: "PENDING",
                paymentMethod: paymentMethod || "Credit / Debit Card",
                customerName: customerName,
                customerPhone: session.user.phone || "",
                shippingAddress: shippingAddress,
                items: {
                    create: items.map((item: any) => ({
                        productId: item.id,
                        quantity: item.quantity,
                        price: item.price
                    }))
                }
            }
        });

        // Create order timeline event
        await tx.orderTimeline.create({
            data: {
                orderId: order.id,
                event: "Order Placed",
                details: `Order placed by ${customerName}`,
                createdBy: session.user.id
            }
        });

        // Reduce stock for each item
        for (const item of items) {
            await tx.product.update({
                where: { id: item.id },
                data: {
                    stock: {
                        decrement: item.quantity
                    }
                }
            });
        }

        return order.id;
    });

    return { success: true, orderId };
}
