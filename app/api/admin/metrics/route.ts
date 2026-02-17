import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/metrics
 * 
 * Daily business metrics for admin dashboard:
 * - Today's revenue
 * - Today's order count
 * - Failed payments today
 * - Refunds today
 * - Low stock products count
 * - System health indicators
 */
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [
            todayOrders,
            todayRevenue,
            failedPayments,
            todayRefunds,
            lowStockProducts,
            activeAlerts,
            recentErrors,
        ] = await Promise.all([
            // Today's orders
            prisma.order.count({
                where: { createdAt: { gte: todayStart } },
            }),

            // Today's revenue
            prisma.order.aggregate({
                _sum: { total: true },
                where: { createdAt: { gte: todayStart } },
            }),

            // Failed payments today
            prisma.payment.count({
                where: {
                    status: 'FAILED',
                    createdAt: { gte: todayStart },
                },
            }),

            // Refunds today
            prisma.refund.aggregate({
                _count: true,
                _sum: { amount: true },
                where: { createdAt: { gte: todayStart } },
            }),

            // Low stock products (stock <= 5 and published)
            prisma.product.count({
                where: {
                    stock: { lte: 5 },
                    status: 'PUBLISHED',
                },
            }),

            // Active system alerts
            prisma.systemAlert.count({
                where: { isResolved: false },
            }),

            // Errors in last hour
            prisma.errorLog.count({
                where: {
                    createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
                },
            }),
        ]);

        return NextResponse.json({
            todayOrders,
            todayRevenue: Number(todayRevenue._sum.total || 0),
            failedPayments,
            refunds: {
                count: todayRefunds._count,
                amount: Number(todayRefunds._sum.amount || 0),
            },
            lowStockProducts,
            activeAlerts,
            recentErrors,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Failed to fetch metrics:', error);
        return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }
}
