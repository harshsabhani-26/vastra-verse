import { NextRequest, NextResponse } from "next/server";
import { checkUserRateLimit } from '@/lib/rate-limit';
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

/**
 * PUT /api/admin/refunds/[id]/approve
 * Approve a refund request
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
        const { notes } = body;

        // Update refund status to approved
        const refund = await prisma.refund.update({
            where: { id: refundId },
            data: {
                status: "APPROVED",
                approvedBy: session.user.id,
                approvedAt: new Date(),
                approvalNotes: notes || null,
            },
            include: {
                order: true,
                payment: true,
            },
        });

        // Create timeline event
        await prisma.orderTimeline.create({
            data: {
                orderId: refund.orderId,
                event: "Refund Approved",
                details: `Refund of ₹${refund.amount} approved${notes ? `. Notes: ${notes}` : ""}`,
                createdBy: session.user.id,
            },
        });

        return NextResponse.json({
            success: true,
            refund,
        });
    } catch (error: any) {
        console.error("Error approving refund:", error);
        return NextResponse.json(
            { error: error.message || "Failed to approve refund" },
            { status: 500 }
        );
    }
}
