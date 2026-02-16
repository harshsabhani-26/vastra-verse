import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { EventDispatcher } from "@/lib/services/event-dispatcher";

/**
 * PUT /api/admin/refunds/[id]/process
 * Process an approved refund (initiates actual refund)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: refundId } = await params;
        const session = await auth();

        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { notes, gatewayRefundId } = body;

        // Get refund details
        const refund = await prisma.refund.findUnique({
            where: { id: refundId },
            include: {
                payment: true,
                order: true,
            },
        });

        if (!refund) {
            return NextResponse.json(
                { error: "Refund not found" },
                { status: 404 }
            );
        }

        if (refund.status !== "APPROVED") {
            return NextResponse.json(
                { error: "Refund must be approved before processing" },
                { status: 400 }
            );
        }

        // Update refund status to processed
        const updatedRefund = await prisma.refund.update({
            where: { id: refundId },
            data: {
                status: "PROCESSED",
                processedBy: session.user.id,
                processedAt: new Date(),
                processingNotes: notes || null,
                gatewayRefundId: gatewayRefundId || null,
                gatewayStatus: "completed",
            },
        });

        // Update payment status
        await prisma.payment.update({
            where: { id: refund.paymentId },
            data: {
                status: "REFUNDED",
            },
        });

        // Update order refund status
        await prisma.order.update({
            where: { id: refund.orderId },
            data: {
                refundStatus: "FULL",
                paymentStatus: "REFUNDED",
            },
        });

        // Create timeline event
        await prisma.orderTimeline.create({
            data: {
                orderId: refund.orderId,
                event: "Refund Processed",
                details: `Refund of ₹${refund.amount} processed successfully${notes ? `. Notes: ${notes}` : ""}`,
                createdBy: session.user.id,
            },
        });

        // Fire event notification (non-blocking)
        EventDispatcher.refundCompleted({
            id: refundId,
            orderId: refund.orderId,
            amount: Number(refund.amount),
        }).catch(() => { });

        return NextResponse.json({
            success: true,
            refund: updatedRefund,
        });
    } catch (error: any) {
        console.error("Error processing refund:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process refund" },
            { status: 500 }
        );
    }
}
