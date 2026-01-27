import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

/**
 * PUT /api/admin/payments/[id]/verify
 * Manually verify a payment
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: paymentId } = await params;
        const session = await auth();

        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Update payment status
        const payment = await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: "COMPLETED",
                verifiedAt: new Date(),
                verifiedBy: session.user.id,
            },
            include: {
                order: true,
            },
        });

        // Update order payment status
        await prisma.order.update({
            where: { id: payment.orderId },
            data: {
                paymentStatus: "PAID",
            },
        });

        // Create timeline event
        await prisma.orderTimeline.create({
            data: {
                orderId: payment.orderId,
                event: "Payment Verified",
                details: `Payment manually verified by admin`,
                createdBy: session.user.id,
            },
        });

        return NextResponse.json({
            success: true,
            payment,
        });
    } catch (error: any) {
        console.error("Error verifying payment:", error);
        return NextResponse.json(
            { error: error.message || "Failed to verify payment" },
            { status: 500 }
        );
    }
}
