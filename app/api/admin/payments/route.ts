import { NextRequest, NextResponse } from "next/server";
import { checkUserRateLimit } from '@/lib/rate-limit';
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/auth-utils";
import { validateCursor, validateLimit } from "@/lib/api-utils";
import { withQueryLogging } from "@/lib/query-logger";

export async function GET(request: NextRequest) {
    try {
        // SECURITY: Rate limiting (30 req/min for admin)
        const rateLimitResult = await checkUserRateLimit(request, 'admin');
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult;
        }

        const adminCheck = await requireAdmin();
        if (!adminCheck.authorized) {
            return unauthorizedResponse(adminCheck.reason);
        }

        const { searchParams } = new URL(request.url);

        // Offset-based pagination
        const page = parseInt(searchParams.get("page") || "1");
        const limit = validateLimit(searchParams.get("limit"), 20, 100);
        const skip = (page - 1) * limit;

        // Filters
        const status = searchParams.get("status") || "all";
        const method = searchParams.get("method") || "all";
        const search = searchParams.get("search") || "";
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

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

        // Fetch total count for pagination
        const totalCount = await withQueryLogging(
            '/api/admin/payments',
            'count',
            () => prisma.payment.count({ where })
        );

        // Fetch payments with offset pagination
        const payments = await withQueryLogging(
            '/api/admin/payments',
            'findMany',
            () => prisma.payment.findMany({
                where,
                select: {
                    id: true,
                    orderId: true,
                    amount: true,
                    status: true,
                    method: true,
                    gatewayPaymentId: true,
                    gatewayOrderId: true,
                    failureReason: true,
                    createdAt: true,
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
                orderBy: [
                    { createdAt: "desc" },
                    { id: "desc" }
                ],
                skip,
                take: limit
            }),
            { page, limit, status, method, search }
        );

        // Calculate stats
        const allPayments = await withQueryLogging(
            '/api/admin/payments',
            'findMany-stats',
            () => prisma.payment.findMany({
                where,
                select: {
                    amount: true,
                    method: true,
                },
            })
        );

        const methodBreakdown: Record<string, { count: number; total: number }> = {};
        let codTotal = 0;
        let onlineTotal = 0;

        allPayments.forEach((payment) => {
            const amount = Number(payment.amount);
            const method = payment.method;

            if (!methodBreakdown[method]) {
                methodBreakdown[method] = { count: 0, total: 0 };
            }
            methodBreakdown[method].count += 1;
            methodBreakdown[method].total += amount;

            if (method === "COD") {
                codTotal += amount;
            } else {
                onlineTotal += amount;
            }
        });

        const totalRevenue = codTotal + onlineTotal;
        const codPercentage = totalRevenue > 0 ? ((codTotal / totalRevenue) * 100).toFixed(2) : "0.00";

        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json({
            payments,
            stats: {
                methodBreakdown,
                codTotal,
                onlineTotal,
                codPercentage,
            },
            pagination: {
                page,
                totalPages,
                totalCount,
                limit,
            },
        });
    } catch (error: any) {
        console.error('[ERROR] /api/admin/payments - Failed to fetch payments:', error);
        return NextResponse.json(
            {
                payments: [],
                stats: null,
                pagination: { page: 1, totalPages: 1, totalCount: 0, limit: 20 },
                error: error.message || "Failed to fetch payments"
            },
            { status: 500 }
        );
    }
}
