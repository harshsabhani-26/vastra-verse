import { NextRequest, NextResponse } from "next/server";
import { checkUserRateLimit } from '@/lib/rate-limit';
import prisma from "@/lib/prisma";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // SECURITY: Rate limiting (30 req/min for admin)
        const rateLimitResult = await checkUserRateLimit(request, 'admin');
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult;
        }

        const { id } = await params;
        const body = await request.json();
        const { reason, cancelledBy } = body;

        if (!reason) {
            return NextResponse.json(
                { error: "Cancellation reason is required" },
                { status: 400 }
            );
        }

        // Fetch order with items
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // Check if already cancelled
        if (order.status === 'CANCELLED') {
            return NextResponse.json(
                { error: "Order is already cancelled" },
                { status: 400 }
            );
        }

        // Start transaction to cancel order and restore stock
        const result = await prisma.$transaction(async (tx) => {
            // Restore stock for each item
            for (const item of order.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            increment: item.quantity
                        }
                    }
                });
            }

            // Update order
            const updatedOrder = await tx.order.update({
                where: { id },
                data: {
                    status: 'CANCELLED',
                    cancellationReason: reason,
                    cancelledAt: new Date()
                }
            });

            // Add timeline entry
            await tx.orderTimeline.create({
                data: {
                    orderId: id,
                    event: "Order Cancelled",
                    details: `Reason: ${reason}. Stock restored for all items.`,
                    createdBy: cancelledBy || "Admin"
                }
            });

            return updatedOrder;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error cancelling order:", error);
        return NextResponse.json(
            { error: "Failed to cancel order" },
            { status: 500 }
        );
    }
}
