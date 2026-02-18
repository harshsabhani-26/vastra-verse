import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { runBusinessAlertChecks } from '@/lib/system-alerts';
import { recordMetric } from '@/lib/metrics';

/**
 * Cron Job: Daily Metrics Snapshot + Automated Alert Checks
 *
 * Endpoint: GET /api/cron/metrics-snapshot
 * Schedule: Daily (recommended via Railway / Vercel cron)
 *
 * What it does:
 *   1. Captures a daily snapshot of key business metrics from live DB
 *   2. Stores them in BusinessMetric table for historical trending
 *   3. Runs automated business alert checks (low stock, payment spikes, etc.)
 *
 * Security: Protected by CRON_SECRET bearer token in production
 */
export async function GET(req: NextRequest) {
    try {
        // Verify cron secret in production
        const authHeader = req.headers.get('authorization');
        const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

        if (process.env.NODE_ENV === 'production' && authHeader !== expectedAuth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[Cron] Starting daily metrics snapshot...');

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // ─── 1. Capture live metrics snapshot ──────────────────────────────

        const [
            todayOrders,
            todayRevenue,
            failedPayments,
            todayRefunds,
            lowStockProducts,
        ] = await Promise.all([
            prisma.order.count({
                where: { createdAt: { gte: todayStart } },
            }),
            prisma.order.aggregate({
                _sum: { total: true },
                where: { createdAt: { gte: todayStart } },
            }),
            prisma.payment.count({
                where: {
                    status: 'FAILED',
                    createdAt: { gte: todayStart },
                },
            }),
            prisma.refund.aggregate({
                _count: true,
                _sum: { amount: true },
                where: { createdAt: { gte: todayStart } },
            }),
            prisma.product.count({
                where: { stock: { lte: 5 }, status: 'PUBLISHED' },
            }),
        ]);

        const revenue = Number(todayRevenue._sum.total || 0);
        const refundCount = todayRefunds._count || 0;
        const refundAmount = Number(todayRefunds._sum.amount || 0);

        // ─── 2. Store snapshot as DAILY metrics (upsert in case cron runs twice) ───

        recordMetric('ORDERS_COUNT', todayOrders, 'DAILY');
        recordMetric('REVENUE', revenue, 'DAILY');
        recordMetric('PAYMENT_FAILURE', failedPayments, 'DAILY');
        recordMetric('REFUND_COUNT', refundCount, 'DAILY');
        recordMetric('REFUND_AMOUNT', refundAmount, 'DAILY');

        console.log('[Cron] Snapshot captured:', {
            orders: todayOrders,
            revenue,
            failedPayments,
            refundCount,
            lowStockProducts,
        });

        // ─── 3. Run automated business alert checks ───────────────────────

        const alertResults = await runBusinessAlertChecks();

        console.log('[Cron] Alert checks completed:', alertResults);

        return NextResponse.json({
            success: true,
            snapshot: {
                todayOrders,
                revenue,
                failedPayments,
                refundCount,
                refundAmount,
                lowStockProducts,
            },
            alertChecks: alertResults,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('[Cron] Error in metrics snapshot:', error);
        return NextResponse.json(
            {
                error: 'Failed to run metrics snapshot',
                message: error.message,
            },
            { status: 500 }
        );
    }
}
