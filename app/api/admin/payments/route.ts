import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/auth-utils";

/**
 * GET /api/admin/payments
 * List all payments with filters
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
        const method = searchParams.get("method") || "all";
        const search = searchParams.get("search") || "";
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (status !== "all") {
            where.status = status;
        }

        if (method !== "all") {
            where.method = method;
        }

        if (search) {
            where.OR = [
                { orderId: { contains: search, mode: "insensitive" } },
                { gatewayPaymentId: { contains: search, mode: "insensitive" } },
                { gatewayOrderId: { contains: search, mode: "insensitive" } },
            ];
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        // Fetch payments
        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                include: {
                    order: {
                        select: {
                            id: true,
                            customerName: true,
                            total: true,
                            status: true,
                        },
                    },
                    refunds: {
                        select: {
                            id: true,
                            amount: true,
                            status: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.payment.count({ where }),
        ]);

        // Calculate statistics
        const stats = await prisma.payment.groupBy({
            by: ["method"],
            _sum: {
                amount: true,
            },
            _count: true,
        });

        const methodBreakdown = stats.reduce((acc, stat) => {
            acc[stat.method] = {
                count: stat._count,
                total: Number(stat._sum.amount) || 0,
            };
            return acc;
        }, {} as Record<string, { count: number; total: number }>);

        // Calculate COD vs Online split
        const codTotal = methodBreakdown.COD?.total || 0;
        const onlineTotal = Object.entries(methodBreakdown)
            .filter(([method]) => method !== "COD")
            .reduce((sum, [, data]) => sum + Number(data.total), 0);

        return NextResponse.json({
            payments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            stats: {
                methodBreakdown,
                codTotal,
                onlineTotal,
                codPercentage: codTotal && onlineTotal
                    ? ((codTotal / (codTotal + onlineTotal)) * 100).toFixed(2)
                    : 0,
            },
        });
    } catch (error: any) {
        console.error("Error fetching payments:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch payments" },
            { status: 500 }
        );
    }
}
