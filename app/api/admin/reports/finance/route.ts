import { NextRequest, NextResponse } from "next/server";
import { checkUserRateLimit } from '@/lib/rate-limit';
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAdmin, unauthorizedResponse } from "@/lib/auth-utils";

/**
 * GET /api/admin/reports/finance
 * Get financial reports and analytics
 */
export async function GET(request: NextRequest) {
    try {
        // SECURITY: Rate limiting (30 req/min for admin)
        const rateLimitResult = await checkUserRateLimit(request, 'admin');
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult;
        }

        // Admin authentication check
        const adminCheck = await requireAdmin();
        if (!adminCheck.authorized) {
            return unauthorizedResponse(adminCheck.reason);
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const reportType = searchParams.get("type") || "summary";

        // Build date filter
        const dateFilter: any = {};
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) dateFilter.lte = new Date(endDate);

        const where = Object.keys(dateFilter).length > 0
            ? { createdAt: dateFilter }
            : {};

        // Revenue Statistics
        const revenueStats = await prisma.payment.aggregate({
            where: {
                ...where,
                status: "COMPLETED",
            },
            _sum: {
                amount: true,
                cgst: true,
                sgst: true,
                igst: true,
            },
            _count: true,
        });

        // Payment Method Breakdown
        const paymentMethodStats = await prisma.payment.groupBy({
            by: ["method"],
            where: {
                ...where,
                status: "COMPLETED",
            },
            _sum: {
                amount: true,
            },
            _count: true,
        });

        // Failed Payments
        const failedPayments = await prisma.payment.findMany({
            where: {
                ...where,
                status: "FAILED",
            },
            select: {
                id: true,
                amount: true,
                failureReason: true,
                failureCode: true,
                method: true,
                createdAt: true,
                order: {
                    select: {
                        id: true,
                        customerName: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        // Refund Statistics
        const refundStats = await prisma.refund.aggregate({
            where: {
                ...where,
                status: "PROCESSED",
            },
            _sum: {
                amount: true,
            },
            _count: true,
        });

        const refundByStatus = await prisma.refund.groupBy({
            by: ["status"],
            where,
            _sum: {
                amount: true,
            },
            _count: true,
        });

        // GST Collection
        const gstCollection = {
            totalCGST: Number(revenueStats._sum.cgst || 0),
            totalSGST: Number(revenueStats._sum.sgst || 0),
            totalIGST: Number(revenueStats._sum.igst || 0),
            totalGST:
                Number(revenueStats._sum.cgst || 0) +
                Number(revenueStats._sum.sgst || 0) +
                Number(revenueStats._sum.igst || 0),
        };

        // Daily Revenue (last 30 days if no date range specified)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const startDateVal = startDate ? new Date(startDate) : thirtyDaysAgo;

        // Construct the date condition safely
        const endDateCondition = endDate
            ? Prisma.sql`AND "createdAt" <= ${new Date(endDate)}`
            : Prisma.sql``;

        const dailyRevenue = await prisma.$queryRaw<Array<{ date: Date; revenue: number; count: number }>>` 
            SELECT 
                DATE("createdAt") as date,
                SUM(CAST("amount" AS DECIMAL)) as revenue,
                COUNT(*) as count
            FROM "Payment"
            WHERE "status" = 'COMPLETED'
                AND "createdAt" >= ${startDateVal}
                ${endDateCondition}
            GROUP BY DATE("createdAt")
            ORDER BY date DESC
            LIMIT 90
        `;

        // Calculate totals
        const totalRevenue = Number(revenueStats._sum.amount || 0);
        const totalRefunded = Number(refundStats._sum.amount || 0);
        const netRevenue = totalRevenue - totalRefunded;

        // COD vs Online split
        const codRevenue = paymentMethodStats.find(s => s.method === "COD")?._sum.amount || 0;
        const onlineRevenue = paymentMethodStats
            .filter(s => s.method !== "COD")
            .reduce((sum, s) => sum + Number(s._sum.amount || 0), 0);

        // Calculate payment success rate
        const totalPayments = await prisma.payment.count({ where });
        const completedPayments = revenueStats._count;
        const failedPaymentsCount = await prisma.payment.count({
            where: { ...where, status: 'FAILED' },
        });
        const successRate = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0;

        // Payment gateway comparison
        const gatewayStats = await prisma.payment.groupBy({
            by: ['gatewayProvider'],
            where: {
                ...where,
                status: 'COMPLETED',
            },
            _sum: { amount: true },
            _count: true,
        });

        // Calculate refund rate
        const refundRate = completedPayments > 0 ? (refundStats._count / completedPayments) * 100 : 0;

        // Net profit margin (simplified - revenue minus refunds and GST liability)
        const gstLiability = Number(gstCollection.totalGST);
        const grossProfit = netRevenue - gstLiability;
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        return NextResponse.json({
            summary: {
                totalRevenue,
                totalRefunded,
                netRevenue,
                totalOrders: revenueStats._count,
                totalRefunds: refundStats._count,
                failedPaymentsCount,
                paymentSuccessRate: successRate,
                refundRate,
                profitMargin,
            },
            gst: gstCollection,
            paymentMethods: {
                breakdown: paymentMethodStats.map(stat => ({
                    method: stat.method,
                    total: Number(stat._sum.amount || 0),
                    count: stat._count,
                    percentage: totalRevenue > 0
                        ? ((Number(stat._sum.amount || 0) / totalRevenue) * 100).toFixed(2)
                        : 0,
                })),
                codVsOnline: {
                    cod: Number(codRevenue),
                    online: Number(onlineRevenue),
                    codPercentage: (Number(codRevenue) + Number(onlineRevenue)) > 0
                        ? ((Number(codRevenue) / (Number(codRevenue) + Number(onlineRevenue))) * 100).toFixed(2)
                        : 0,
                },
            },
            paymentGateways: gatewayStats.map(stat => ({
                gateway: stat.gatewayProvider || 'Unknown',
                revenue: Number(stat._sum.amount || 0),
                transactions: stat._count,
                averageTransaction: stat._count > 0 ? Number(stat._sum.amount || 0) / stat._count : 0,
            })),
            refunds: {
                total: totalRefunded,
                count: refundStats._count,
                rate: refundRate,
                byStatus: refundByStatus.map(stat => ({
                    status: stat.status,
                    total: Number(stat._sum.amount || 0),
                    count: stat._count,
                })),
            },
            failedPayments: failedPayments.map(p => ({
                id: p.id,
                amount: Number(p.amount),
                reason: p.failureReason,
                code: p.failureCode,
                method: p.method,
                date: p.createdAt,
                orderid: p.order.id,
                customerName: p.order.customerName,
            })),
            dailyRevenue: dailyRevenue.map(d => ({
                date: d.date,
                revenue: Number(d.revenue),
                count: Number(d.count),
            })),
        });
    } catch (error: any) {
        console.error("Error generating financial report:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate financial report" },
            { status: 500 }
        );
    }
}
