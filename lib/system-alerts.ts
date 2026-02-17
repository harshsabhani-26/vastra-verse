/**
 * System Alert Service
 * 
 * Central alert tracking using the SystemAlert database model.
 * Creates, queries, and resolves system-wide alerts.
 * 
 * Alert Types:
 * - PAYMENT_FAILURE: Payment gateway issues
 * - LOW_STOCK: Inventory below threshold
 * - ORDER_DROP: Sudden order creation drop
 * - WEBHOOK_FAILURE: Payment/shipping sync broken
 * - ERROR_SPIKE: High error rate
 * - EMAIL_FAILURE: Email delivery issues
 */

import prisma from '@/lib/prisma';
import { logError, logInfo } from '@/lib/logger';

// ============================================================
// Types
// ============================================================

export type SystemAlertType =
    | 'PAYMENT_FAILURE'
    | 'LOW_STOCK'
    | 'ORDER_DROP'
    | 'WEBHOOK_FAILURE'
    | 'ERROR_SPIKE'
    | 'EMAIL_FAILURE'
    | 'GATEWAY_DOWN'
    | 'API_ERROR'
    | 'DATABASE_ERROR';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

// ============================================================
// Create Alerts
// ============================================================

/**
 * Create a system alert. Non-blocking — fires and forgets.
 */
export function createAlert(
    type: SystemAlertType,
    severity: AlertSeverity,
    message: string,
    details?: Record<string, any>
): void {
    _createAlertAsync(type, severity, message, details).catch((err) => {
        logError('SYSTEM_ALERT', err, { type, severity, message });
    });
}

async function _createAlertAsync(
    type: SystemAlertType,
    severity: AlertSeverity,
    message: string,
    details?: Record<string, any>
): Promise<void> {
    // Deduplicate: don't create duplicate unresolved alerts of same type within 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existing = await prisma.systemAlert.findFirst({
        where: {
            type,
            isResolved: false,
            createdAt: { gte: oneHourAgo },
        },
    });

    if (existing) {
        // Update existing alert with latest details
        await prisma.systemAlert.update({
            where: { id: existing.id },
            data: { details: details || undefined },
        });
        return;
    }

    await prisma.systemAlert.create({
        data: {
            type,
            severity,
            message,
            details: details || undefined,
        },
    });

    logInfo('SYSTEM_ALERT', `Alert created: [${severity}] ${type} — ${message}`);
}

// ============================================================
// Query Alerts
// ============================================================

/**
 * Get active (unresolved) alerts, ordered by severity and recency.
 */
export async function getActiveAlerts(limit: number = 20) {
    return prisma.systemAlert.findMany({
        where: { isResolved: false },
        orderBy: [
            { createdAt: 'desc' },
        ],
        take: limit,
    });
}

/**
 * Get all alerts with pagination and filtering.
 */
export async function getAlerts(options: {
    resolved?: boolean;
    type?: string;
    severity?: string;
    limit?: number;
    offset?: number;
} = {}) {
    const { resolved, type, severity, limit = 50, offset = 0 } = options;

    const where: any = {};
    if (resolved !== undefined) where.isResolved = resolved;
    if (type) where.type = type;
    if (severity) where.severity = severity;

    const [alerts, total] = await Promise.all([
        prisma.systemAlert.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        }),
        prisma.systemAlert.count({ where }),
    ]);

    return { alerts, total };
}

/**
 * Get alert summary for dashboard.
 */
export async function getAlertSummary() {
    const [critical, warning, info, totalActive] = await Promise.all([
        prisma.systemAlert.count({ where: { isResolved: false, severity: 'CRITICAL' } }),
        prisma.systemAlert.count({ where: { isResolved: false, severity: 'WARNING' } }),
        prisma.systemAlert.count({ where: { isResolved: false, severity: 'INFO' } }),
        prisma.systemAlert.count({ where: { isResolved: false } }),
    ]);

    return { critical, warning, info, totalActive };
}

// ============================================================
// Resolve Alerts
// ============================================================

/**
 * Resolve a specific alert.
 */
export async function resolveAlert(alertId: string, resolvedBy: string) {
    return prisma.systemAlert.update({
        where: { id: alertId },
        data: {
            isResolved: true,
            resolvedAt: new Date(),
            resolvedBy,
        },
    });
}

/**
 * Bulk resolve all alerts of a specific type.
 */
export async function resolveAlertsByType(type: string, resolvedBy: string) {
    return prisma.systemAlert.updateMany({
        where: { type, isResolved: false },
        data: {
            isResolved: true,
            resolvedAt: new Date(),
            resolvedBy,
        },
    });
}

// ============================================================
// Automated Alert Checks
// ============================================================

/**
 * Run automated business checks and create alerts as needed.
 * Call this periodically (e.g., every 5–10 minutes).
 */
export async function runBusinessAlertChecks() {
    const results: string[] = [];

    try {
        // 1. Check for low stock products
        const lowStockProducts = await prisma.product.findMany({
            where: { stock: { lte: 5 }, status: 'PUBLISHED' },
            select: { id: true, name: true, stock: true },
        });

        if (lowStockProducts.length > 0) {
            createAlert(
                'LOW_STOCK',
                lowStockProducts.some(p => p.stock === 0) ? 'CRITICAL' : 'WARNING',
                `${lowStockProducts.length} product(s) with low stock (≤ 5 units)`,
                {
                    products: lowStockProducts.map(p => ({
                        name: p.name,
                        stock: p.stock,
                    })),
                }
            );
            results.push(`Low stock: ${lowStockProducts.length} products`);
        }

        // 2. Check for payment failure spike (>3 failures in last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const paymentFailures = await prisma.payment.count({
            where: {
                status: 'FAILED',
                createdAt: { gte: oneHourAgo },
            },
        });

        if (paymentFailures >= 3) {
            createAlert(
                'PAYMENT_FAILURE',
                paymentFailures >= 10 ? 'CRITICAL' : 'WARNING',
                `${paymentFailures} payment failures in the last hour`,
                { count: paymentFailures, window: '1h' }
            );
            results.push(`Payment failures: ${paymentFailures}`);
        }

        // 3. Check for order creation drop (compare last hour vs previous hour)
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const [currentHourOrders, previousHourOrders] = await Promise.all([
            prisma.order.count({ where: { createdAt: { gte: oneHourAgo } } }),
            prisma.order.count({
                where: {
                    createdAt: { gte: twoHoursAgo, lt: oneHourAgo },
                },
            }),
        ]);

        // Only alert if previous hour had significant volume and current dropped >50%
        if (previousHourOrders >= 5 && currentHourOrders < previousHourOrders * 0.5) {
            createAlert(
                'ORDER_DROP',
                'WARNING',
                `Order volume dropped ${Math.round((1 - currentHourOrders / previousHourOrders) * 100)}% vs previous hour`,
                {
                    currentHour: currentHourOrders,
                    previousHour: previousHourOrders,
                }
            );
            results.push(`Order drop detected`);
        }

        // 4. Check for high error rate (>20 errors in last hour)
        const recentErrors = await prisma.errorLog.count({
            where: { createdAt: { gte: oneHourAgo } },
        });

        if (recentErrors >= 20) {
            createAlert(
                'ERROR_SPIKE',
                recentErrors >= 50 ? 'CRITICAL' : 'WARNING',
                `${recentErrors} errors logged in the last hour`,
                { count: recentErrors, window: '1h' }
            );
            results.push(`Error spike: ${recentErrors}`);
        }

        // 5. Check for webhook failures (>5 in last hour)
        const webhookFailures = await prisma.webhookAuditLog.count({
            where: {
                status: 'FAILED',
                processedAt: { gte: oneHourAgo },
            },
        });

        if (webhookFailures >= 5) {
            createAlert(
                'WEBHOOK_FAILURE',
                'CRITICAL',
                `${webhookFailures} webhook failures in the last hour — payment sync may be broken`,
                { count: webhookFailures, window: '1h' }
            );
            results.push(`Webhook failures: ${webhookFailures}`);
        }

    } catch (error) {
        logError('BUSINESS_ALERT_CHECK', error);
    }

    return results;
}
