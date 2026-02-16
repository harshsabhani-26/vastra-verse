import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/auth-utils";
import { EventDispatcher } from "@/lib/services/event-dispatcher";

/**
 * GET /api/admin/refunds
 * List all refund requests
 */
export async function GET(request: NextRequest) {
    try {
        const adminCheck = await requireAdmin();
        if (!adminCheck.authorized) {
            return unauthorizedResponse(adminCheck.reason);
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const status = searchParams.get("status") || "all";
        const search = searchParams.get("search") || "";

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (status !== "all") {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { orderId: { contains: search, mode: "insensitive" } },
                { gatewayRefundId: { contains: search, mode: "insensitive" } },
            ];
        }

        // Fetch refunds
        const [refunds, total] = await Promise.all([
            prisma.refund.findMany({
                where,
                include: {
                    order: {
                        select: {
                            id: true,
                            customerName: true,
                            total: true,
                        },
                    },
                    payment: {
                        select: {
                            id: true,
                            amount: true,
                            method: true,
                            gatewayPaymentId: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.refund.count({ where }),
        ]);

        // Calculate statistics
        const stats = await prisma.refund.groupBy({
            by: ["status"],
            _sum: {
                amount: true,
            },
            _count: true,
        });

        const statusBreakdown = stats.reduce((acc, stat) => {
            acc[stat.status] = {
                count: stat._count,
                total: Number(stat._sum.amount) || 0,
            };
            return acc;
        }, {} as Record<string, { count: number; total: number }>);

        return NextResponse.json({
            refunds,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            stats: {
                statusBreakdown,
                pendingCount: statusBreakdown.PENDING?.count || 0,
                totalRefunded: statusBreakdown.PROCESSED?.total || 0,
            },
        });
    } catch (error: any) {
        console.error("Error fetching refunds:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch refunds" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/refunds
 * Create a new refund request
 */
export async function POST(request: NextRequest) {
    try {
        const adminCheck = await requireAdmin();
        if (!adminCheck.authorized) {
            return unauthorizedResponse(adminCheck.reason);
        }
        const session = adminCheck.session!;

        const body = await request.json();
        const { paymentId, orderId, amount, reason } = body;

        if (!paymentId || !orderId || !amount || !reason) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Verify payment exists
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
        });

        if (!payment) {
            return NextResponse.json(
                { error: "Payment not found" },
                { status: 404 }
            );
        }

        // Check if refund amount is valid
        if (amount > Number(payment.amount)) {
            return NextResponse.json(
                { error: "Refund amount exceeds payment amount" },
                { status: 400 }
            );
        }

        // Create refund request
        const refund = await prisma.refund.create({
            data: {
                paymentId,
                orderId,
                amount,
                reason,
                status: "PENDING",
                requestedBy: session.user.id,
            },
            include: {
                order: true,
                payment: true,
            },
        });

        // Create timeline event
        await prisma.orderTimeline.create({
            data: {
                orderId,
                event: "Refund Requested",
                details: `Refund of ₹${amount} requested. Reason: ${reason}`,
                createdBy: session.user.id,
            },
        });

        // Fire event notification (non-blocking)
        EventDispatcher.refundInitiated({
            id: refund.id,
            orderId,
            amount: Number(amount),
        }).catch(() => { });

        return NextResponse.json({
            success: true,
            refund,
        });
    } catch (error: any) {
        console.error("Error creating refund:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create refund" },
            { status: 500 }
        );
    }
}
