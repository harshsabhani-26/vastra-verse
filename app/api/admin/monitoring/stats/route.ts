/**
 * Admin Monitoring Stats API
 * 
 * Returns overview statistics for the monitoring dashboard:
 * - System health status
 * - Error rates
 * - Queue stats
 * - Recent failures
 * - Business metrics summary
 * 
 * Access: GET /api/admin/monitoring/stats
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSystemHealth } from "@/lib/healthcheck";
import { getErrorRate, getRecentErrors, getErrorTrends } from "@/lib/error-tracker";
import { getTodaysSummary, getPerformanceSummary } from "@/lib/metrics";
import { getAlertHistory } from "@/lib/alert-service";
import { getQueueStats } from "@/lib/queue";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Admin auth check
        const session = await auth();
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Run all queries in parallel
        const [
            health,
            errorRate,
            recentErrors,
            errorTrends,
            todaySummary,
            performanceSummary,
            recentAlerts,
            queueStats,
        ] = await Promise.allSettled([
            getSystemHealth(),
            getErrorRate(60), // Last hour
            getRecentErrors({ limit: 10, resolved: false }),
            getErrorTrends(),
            getTodaysSummary(),
            getPerformanceSummary(60),
            getAlertHistory(10),
            getQueueStats(),
        ]);

        return NextResponse.json({
            health: health.status === 'fulfilled' ? health.value : null,
            errors: {
                rate: errorRate.status === 'fulfilled' ? errorRate.value : null,
                recent: recentErrors.status === 'fulfilled' ? recentErrors.value : null,
                trends: errorTrends.status === 'fulfilled' ? errorTrends.value : null,
            },
            business: todaySummary.status === 'fulfilled' ? todaySummary.value : null,
            performance: performanceSummary.status === 'fulfilled' ? performanceSummary.value : null,
            alerts: recentAlerts.status === 'fulfilled' ? recentAlerts.value : null,
            queues: queueStats.status === 'fulfilled' ? queueStats.value : null,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch monitoring stats' },
            { status: 500 }
        );
    }
}
