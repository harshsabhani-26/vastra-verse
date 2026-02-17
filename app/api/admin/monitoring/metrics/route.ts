/**
 * Admin Business Metrics API
 * 
 * Returns business metrics for dashboard charts:
 * - Orders per hour/day
 * - Revenue trends
 * - Payment success rates
 * - Refund rates
 * - Delivery success rates
 * 
 * Access: GET /api/admin/monitoring/metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBusinessMetrics, getPerformanceTrends, type MetricPeriod, type MetricName } from "@/lib/metrics";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const period = (req.nextUrl.searchParams.get('period') || 'DAILY') as MetricPeriod;
        const days = parseInt(req.nextUrl.searchParams.get('days') || '30');
        const type = req.nextUrl.searchParams.get('type'); // 'performance' for perf metrics

        if (type === 'performance') {
            const perfType = (req.nextUrl.searchParams.get('perfType') || 'API') as any;
            const hours = parseInt(req.nextUrl.searchParams.get('hours') || '24');
            const trends = await getPerformanceTrends(perfType, hours);
            return NextResponse.json({ trends });
        }

        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const namesParam = req.nextUrl.searchParams.get('names');
        const names = namesParam ? namesParam.split(',') as MetricName[] : undefined;

        const metrics = await getBusinessMetrics({ period, since, names });

        // Group metrics by name for easy chart consumption
        const grouped: Record<string, Array<{ timestamp: string; value: number }>> = {};
        for (const m of metrics) {
            if (!grouped[m.name]) grouped[m.name] = [];
            grouped[m.name].push({
                timestamp: m.timestamp.toISOString(),
                value: Number(m.value),
            });
        }

        return NextResponse.json({ metrics: grouped, period, days });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }
}
