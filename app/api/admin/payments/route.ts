import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/auth-utils";
import { validateCursor, validateLimit } from "@/lib/api-utils";
import { withQueryLogging } from "@/lib/query-logger";

/**
 * GET /api/admin/payments - Cursor-based paginated payments list
 * 
 * Query params:
 * - cursor: Payment ID to start from (optional)
 * - limit: Number of items per page (default: 20, max: 100)
 * - status: Filter by payment status
 * - method: Filter by payment method
 * - search: Search by order ID or gateway IDs
 * - startDate, endDate: Date range filter
 */
export async function GET(request: NextRequest) {
    try {
        const adminCheck = await requireAdmin();
        if (!adminCheck.authorized) {
            return unauthorizedResponse(adminCheck.reason);
        }

        const { searchParams } = new URL(request.url);

        // Cursor-based pagination
        const cursor = validateCursor(searchParams.get("cursor"));
        const limit = validateLimit(searchParams.get("limit"), 20, 100);

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

        // Fetch payments with cursor pagination
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
                ...(cursor ? {
                    cursor: { id: cursor },
                    skip: 1
                } : {}),
                take: limit + 1
            }),
            { cursor, limit, status, method, search }
        );

        // Check for next page
        const hasNextPage = payments.length > limit;
        const items = hasNextPage ? payments.slice(0, limit) : payments;
        const nextCursor = hasNextPage ? items[items.length - 1].id : null;

        return NextResponse.json({
            items,
            nextCursor,
            hasNextPage
        });
    } catch (error: any) {
        console.error('[ERROR] /api/admin/payments - Failed to fetch payments:', error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch payments" },
            { status: 500 }
        );
    }
}
