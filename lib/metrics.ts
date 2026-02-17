/**
 * Business Metrics & Performance Tracking Service
 * 
 * Tracks:
 * - Orders per hour/day
 * - Revenue per day
 * - Payment success/failure rates
 * - Refund rates
 * - Delivery success rates
 * - API route execution time
 * - Database query duration
 * - External API latency
 * - Webhook processing time
 * 
 * All recording is async (non-blocking).
 * Stored in database for historical analysis.
 */

import prisma from '@/lib/prisma';
import { logError } from '@/lib/logger';

// ============================================================
// Types
// ============================================================

export type MetricName =
    | 'ORDERS_COUNT'
    | 'REVENUE'
    | 'PAYMENT_SUCCESS'
    | 'PAYMENT_FAILURE'
    | 'REFUND_COUNT'
    | 'REFUND_AMOUNT'
    | 'DELIVERY_SUCCESS'
    | 'DELIVERY_FAILURE'
    | 'RETURN_COUNT'
    | 'CART_ABANDONMENT';

export type MetricPeriod = 'HOURLY' | 'DAILY';

export type PerfMetricType = 'API' | 'DATABASE' | 'EXTERNAL_API' | 'WEBHOOK';

// ============================================================
// Business Metric Recording (Non-blocking)
// ============================================================

/**
 * Record a business metric increment.
 * Uses upsert to add to existing period or create new entry.
 */
export function recordMetric(name: MetricName, value: number, period: MetricPeriod = 'HOURLY', metadata?: Record<string, any>): void {
    _recordMetricAsync(name, value, period, metadata).catch((err) => {
        logError('METRICS', err, { metric: name, value });
    });
}

async function _recordMetricAsync(name: MetricName, value: number, period: MetricPeriod, metadata?: Record<string, any>) {
    const timestamp = getPeriodStart(period);

    await prisma.businessMetric.upsert({
        where: {
            name_period_timestamp: { name, period, timestamp },
        },
        update: {
            value: { increment: value },
        },
        create: {
            name,
            value,
            period,
            timestamp,
            metadata: metadata || undefined,
        },
    });
}

/** Get the start of the current period */
function getPeriodStart(period: MetricPeriod): Date {
    const now = new Date();
    if (period === 'HOURLY') {
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
    }
    // DAILY
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

// ============================================================
// Convenience Recording Methods
// ============================================================

/** Record a new order */
export function recordOrderCreated(total: number) {
    recordMetric('ORDERS_COUNT', 1, 'HOURLY');
    recordMetric('ORDERS_COUNT', 1, 'DAILY');
    recordMetric('REVENUE', total, 'DAILY');
}

/** Record a successful payment */
export function recordPaymentSuccess(amount: number) {
    recordMetric('PAYMENT_SUCCESS', 1, 'HOURLY');
    recordMetric('PAYMENT_SUCCESS', 1, 'DAILY');
}

/** Record a failed payment */
export function recordPaymentFailure() {
    recordMetric('PAYMENT_FAILURE', 1, 'HOURLY');
    recordMetric('PAYMENT_FAILURE', 1, 'DAILY');
}

/** Record a refund */
export function recordRefund(amount: number) {
    recordMetric('REFUND_COUNT', 1, 'DAILY');
    recordMetric('REFUND_AMOUNT', amount, 'DAILY');
}

/** Record a successful delivery */
export function recordDeliverySuccess() {
    recordMetric('DELIVERY_SUCCESS', 1, 'DAILY');
}

/** Record a failed delivery */
export function recordDeliveryFailure() {
    recordMetric('DELIVERY_FAILURE', 1, 'DAILY');
}

/** Record a return request */
export function recordReturn() {
    recordMetric('RETURN_COUNT', 1, 'DAILY');
}

// ============================================================
// Performance Metric Recording (Non-blocking)
// ============================================================

/**
 * Record a performance measurement.
 * Non-blocking — fires and forgets.
 */
export function recordPerformance(
    type: PerfMetricType,
    name: string,
    durationMs: number,
    statusCode?: number,
    metadata?: Record<string, any>
): void {
    _recordPerformanceAsync(type, name, durationMs, statusCode, metadata).catch((err) => {
        logError('METRICS', err, { type, name, duration: durationMs });
    });
}

async function _recordPerformanceAsync(
    type: PerfMetricType,
    name: string,
    durationMs: number,
    statusCode?: number,
    metadata?: Record<string, any>
) {
    await prisma.performanceMetric.create({
        data: {
            type,
            name,
            duration: Math.round(durationMs),
            statusCode,
            metadata: metadata || undefined,
        },
    });
}

// ============================================================
// Performance Timing Helper
// ============================================================

/**
 * Create a performance timer. Usage:
 * 
 * const timer = createTimer('API', '/api/orders');
 * // ... do work ...
 * timer.end(200);
 */
export function createTimer(type: PerfMetricType, name: string) {
    const start = performance.now();
    return {
        end(statusCode?: number, metadata?: Record<string, any>) {
            const duration = performance.now() - start;
            recordPerformance(type, name, duration, statusCode, metadata);
            return duration;
        },
    };
}

// ============================================================
// Metric Queries (for Dashboard)
// ============================================================

/** Get business metrics for a time range */
export async function getBusinessMetrics(options: {
    period?: MetricPeriod;
    since?: Date;
    names?: MetricName[];
} = {}) {
    const { period = 'DAILY', since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), names } = options;

    const where: any = { period, timestamp: { gte: since } };
    if (names?.length) where.name = { in: names };

    return prisma.businessMetric.findMany({
        where,
        orderBy: { timestamp: 'asc' },
    });
}

/** Get today's key business metrics summary */
export async function getTodaysSummary(): Promise<{
    orders: number;
    revenue: number;
    paymentSuccessRate: number;
    refunds: number;
    deliveries: number;
}> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const metrics = await prisma.businessMetric.findMany({
        where: {
            period: 'DAILY',
            timestamp: todayStart,
        },
    });

    const byName: Record<string, number> = {};
    for (const m of metrics) {
        byName[m.name] = Number(m.value);
    }

    const successCount = byName['PAYMENT_SUCCESS'] || 0;
    const failureCount = byName['PAYMENT_FAILURE'] || 0;
    const totalPayments = successCount + failureCount;

    return {
        orders: byName['ORDERS_COUNT'] || 0,
        revenue: byName['REVENUE'] || 0,
        paymentSuccessRate: totalPayments > 0 ? Math.round((successCount / totalPayments) * 100) : 100,
        refunds: byName['REFUND_COUNT'] || 0,
        deliveries: (byName['DELIVERY_SUCCESS'] || 0) + (byName['DELIVERY_FAILURE'] || 0),
    };
}

/** Get performance metrics summary */
export async function getPerformanceSummary(windowMinutes: number = 60): Promise<{
    api: { avg: number; p95: number; p99: number; count: number };
    database: { avg: number; p95: number; count: number };
    external: { avg: number; p95: number; count: number };
    webhook: { avg: number; p95: number; count: number };
}> {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);

    const metrics = await prisma.performanceMetric.findMany({
        where: { timestamp: { gte: since } },
        select: { type: true, duration: true },
        orderBy: { duration: 'asc' },
    });

    const byType: Record<string, number[]> = { API: [], DATABASE: [], EXTERNAL_API: [], WEBHOOK: [] };
    for (const m of metrics) {
        if (byType[m.type]) byType[m.type].push(m.duration);
    }

    function calcStats(durations: number[]) {
        if (durations.length === 0) return { avg: 0, p95: 0, p99: 0, count: 0 };
        const sorted = durations.sort((a, b) => a - b);
        const avg = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length);
        const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
        const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
        return { avg, p95, p99, count: sorted.length };
    }

    return {
        api: calcStats(byType['API']),
        database: calcStats(byType['DATABASE']),
        external: calcStats(byType['EXTERNAL_API']),
        webhook: calcStats(byType['WEBHOOK']),
    };
}

/** Get hourly performance trends */
export async function getPerformanceTrends(type: PerfMetricType = 'API', hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const metrics = await prisma.performanceMetric.findMany({
        where: { type, timestamp: { gte: since } },
        select: { duration: true, timestamp: true },
    });

    // Group by hour
    const hourlyMap: Record<string, { total: number; count: number }> = {};
    for (let h = 0; h < hours; h++) {
        const d = new Date(Date.now() - (hours - 1 - h) * 60 * 60 * 1000);
        const key = d.toISOString().substring(0, 13);
        hourlyMap[key] = { total: 0, count: 0 };
    }

    for (const m of metrics) {
        const key = m.timestamp.toISOString().substring(0, 13);
        if (hourlyMap[key]) {
            hourlyMap[key].total += m.duration;
            hourlyMap[key].count += 1;
        }
    }

    return Object.entries(hourlyMap).map(([hour, { total, count }]) => ({
        hour,
        avgDuration: count > 0 ? Math.round(total / count) : 0,
        count,
    }));
}
