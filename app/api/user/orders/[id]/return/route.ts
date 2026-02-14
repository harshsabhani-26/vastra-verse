
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { canRequestReturn } from "@/lib/return-eligibility";
import { ReturnReason } from "@prisma/client";
import { calculateRefundAmount } from "@/lib/refund-calculator";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { reason, description, items } = body;

        if (!reason || !Object.values(ReturnReason).includes(reason)) {
            return NextResponse.json({ error: "Invalid return reason" }, { status: 400 });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "Please select at least one item to return" }, { status: 400 });
        }

        // 1. Fetch Order
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                returnRequests: true, // Needed for eligibility check
                items: true
            }
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // 2. Ownership Check
        if (order.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // 3. Eligibility Check
        const eligibility = canRequestReturn(order);
        if (!eligibility.isEligible) {
            return NextResponse.json({ error: eligibility.reason }, { status: 400 });
        }

        // 4. Calculate Refund Amount
        const refundCalculation = await calculateRefundAmount(order.id, items);

        // 5. Create Return Request with Items (Transaction)
        const returnRequest = await prisma.$transaction(async (tx) => {
            // Create return request
            const request = await tx.returnRequest.create({
                data: {
                    orderId: order.id,
                    userId: session.user.id,
                    reason: reason as ReturnReason,
                    description: description,
                    status: "REQUESTED",
                    refundAmount: refundCalculation.totalRefundAmount
                }
            });

            // Create return items
            await tx.returnItem.createMany({
                data: refundCalculation.returnItemInputs.map(item => ({
                    returnRequestId: request.id,
                    orderItemId: item.orderItemId,
                    quantity: item.quantity,
                    refundAmount: item.refundAmount
                }))
            });

            return request;
        });

        // Optional: Send notification to admin

        return NextResponse.json({
            success: true,
            returnRequest
        });

    } catch (error) {
        console.error("Return Request Error:", error);
        return NextResponse.json(
            { error: "Failed to submit return request" },
            { status: 500 }
        );
    }
}
