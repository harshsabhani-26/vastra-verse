import { NextRequest, NextResponse } from "next/server";
import { checkUserRateLimit } from '@/lib/rate-limit';
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

/**
 * PUT /api/admin/refunds/[id]/reject
 * Reject a refund request
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // SECURITY: Rate limiting (30 req/min for admin)
        const rateLimitResult = await checkUserRateLimit(request, 'admin');
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult;
        }

        const { id: refundId } = await params;
        const session = await auth();

        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { reason } = body;

        if (!reason) {
            return NextResponse.json(
                { error: "Rejection reason is required" },
                { status: 400 }
            );
        }

        // Update refund status to rejected
        const refund = await prisma.refund.update({
            where: { id: refundId },
            data: {
                status: "REJECTED",
                rejectedBy: session.user.id,
                rejectedAt: new Date(),
                rejectionReason: reason,
            },
            include: {
                order: true,
            },
        });

        // Create timeline event
        await prisma.orderTimeline.create({
            data: {
                orderId: refund.orderId,
                event: "Refund Rejected",
                details: `Refund request rejected. Reason: ${reason}`,
                createdBy: session.user.id,
            },
        });

        return NextResponse.json({
            success: true,
            refund,
        });
    } catch (error: any) {
        console.error("Error rejecting refund:", error);
        return NextResponse.json(
            { error: error.message || "Failed to reject refund" },
            { status: 500 }
        );
    }
}
