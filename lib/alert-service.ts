/**
 * Automated Alert Service
 * 
 * Monitors system health and triggers alerts when thresholds are exceeded.
 * 
 * Alert Types:
 * - ERROR_RATE: Error count exceeds threshold in time window
 * - PAYMENT_FAILURE: Payment failure rate exceeds threshold
 * - QUEUE_FAILURE: Job queue failure count exceeds threshold
 * - LOW_INVENTORY: Product stock below threshold
 * 
 * Channels:
 * - Email (via existing email infrastructure)
 * - Slack (webhook)
 * - Custom webhook
 * 
 * Features:
 * - Cooldown period to prevent alert spam
 * - Alert history tracking
 * - Channel-specific delivery
 * - Auto-resolution detection
 */

import prisma from '@/lib/prisma';
import { logError, logInfo } from '@/lib/logger';
import { emailQueue } from '@/lib/queue';

// ============================================================
// Types
// ============================================================

export type AlertType = 'ERROR_RATE' | 'PAYMENT_FAILURE' | 'QUEUE_FAILURE' | 'LOW_INVENTORY' | 'HEALTH_DEGRADED';
type AlertSeverityType = 'INFO' | 'WARNING' | 'CRITICAL';

interface AlertChannelConfig {
    type: 'email' | 'slack' | 'webhook';
    target: string; // Email address, Slack webhook URL, or custom webhook URL
}

interface AlertCheckResult {
    shouldAlert: boolean;
    currentValue: number;
    message: string;
}

// ============================================================
// Alert Checking
// ============================================================

/**
 * Run all enabled alert checks.
 * Called periodically (e.g., every 5 minutes via cron or API).
 */
export async function checkAlerts(): Promise<{ checked: number; fired: number }> {
    let checked = 0;
    let fired = 0;

    try {
        const configs = await prisma.alertConfiguration.findMany({
            where: { enabled: true },
        });

        for (const config of configs) {
            checked++;
            try {
                const result = await evaluateAlert(config);

                if (result.shouldAlert && !isInCooldown(config)) {
                    await fireAlert(config, result);
                    fired++;
                }
            } catch (err) {
                logError('ALERT_SERVICE', err, { alertName: config.name });
            }
        }
    } catch (err) {
        logError('ALERT_SERVICE', err, { context: 'checkAlerts' });
    }

    return { checked, fired };
}

function isInCooldown(config: any): boolean {
    if (!config.lastFiredAt) return false;
    const cooldownMs = config.cooldown * 60 * 1000;
    return Date.now() - new Date(config.lastFiredAt).getTime() < cooldownMs;
}

/**
 * Evaluate a single alert configuration against current system state.
 */
async function evaluateAlert(config: any): Promise<AlertCheckResult> {
    switch (config.type as AlertType) {
        case 'ERROR_RATE':
            return evaluateErrorRate(config);
        case 'PAYMENT_FAILURE':
            return evaluatePaymentFailure(config);
        case 'QUEUE_FAILURE':
            return evaluateQueueFailure(config);
        case 'LOW_INVENTORY':
            return evaluateLowInventory(config);
        case 'HEALTH_DEGRADED':
            return evaluateHealthDegraded(config);
        default:
            return { shouldAlert: false, currentValue: 0, message: 'Unknown alert type' };
    }
}

// ── Error Rate Check ──

async function evaluateErrorRate(config: any): Promise<AlertCheckResult> {
    const since = new Date(Date.now() - config.window * 60 * 1000);
    const errorCount = await prisma.errorLog.count({
        where: { createdAt: { gte: since }, resolved: false },
    });

    const threshold = Number(config.threshold);
    return {
        shouldAlert: errorCount >= threshold,
        currentValue: errorCount,
        message: `Error rate alert: ${errorCount} errors in last ${config.window} minutes (threshold: ${threshold})`,
    };
}

// ── Payment Failure Check ──

async function evaluatePaymentFailure(config: any): Promise<AlertCheckResult> {
    const since = new Date(Date.now() - config.window * 60 * 1000);
    const [successCount, failureCount] = await Promise.all([
        prisma.businessMetric.findMany({
            where: { name: 'PAYMENT_SUCCESS', timestamp: { gte: since } },
            select: { value: true },
        }),
        prisma.businessMetric.findMany({
            where: { name: 'PAYMENT_FAILURE', timestamp: { gte: since } },
            select: { value: true },
        }),
    ]);

    const successes = successCount.reduce((a: number, b: { value: any }) => a + Number(b.value), 0);
    const failures = failureCount.reduce((a: number, b: { value: any }) => a + Number(b.value), 0);
    const total = successes + failures;
    const failureRate = total > 0 ? (failures / total) * 100 : 0;
    const threshold = Number(config.threshold);

    return {
        shouldAlert: failureRate >= threshold && total >= 3, // Need min 3 payments
        currentValue: Math.round(failureRate),
        message: `Payment failure rate: ${Math.round(failureRate)}% (${failures}/${total}) in last ${config.window} minutes (threshold: ${threshold}%)`,
    };
}

// ── Queue Failure Check ──

async function evaluateQueueFailure(config: any): Promise<AlertCheckResult> {
    // Check error logs for WORKER source
    const since = new Date(Date.now() - config.window * 60 * 1000);
    const failedJobs = await prisma.errorLog.count({
        where: {
            source: 'WORKER',
            createdAt: { gte: since },
            resolved: false,
        },
    });

    const threshold = Number(config.threshold);
    return {
        shouldAlert: failedJobs >= threshold,
        currentValue: failedJobs,
        message: `Queue failure alert: ${failedJobs} job failures in last ${config.window} minutes (threshold: ${threshold})`,
    };
}

// ── Low Inventory Check ──

async function evaluateLowInventory(config: any): Promise<AlertCheckResult> {
    const threshold = Number(config.threshold);
    const lowStockCount = await prisma.product.count({
        where: {
            status: 'ACTIVE',
            stock: { lte: threshold },
        },
    });

    return {
        shouldAlert: lowStockCount > 0,
        currentValue: lowStockCount,
        message: `Low inventory alert: ${lowStockCount} products with stock ≤ ${threshold}`,
    };
}

// ── Health Degraded Check ──

async function evaluateHealthDegraded(config: any): Promise<AlertCheckResult> {
    const since = new Date(Date.now() - config.window * 60 * 1000);
    const slowApis = await prisma.performanceMetric.count({
        where: {
            type: 'API',
            duration: { gte: Number(config.threshold) },
            timestamp: { gte: since },
        },
    });

    const threshold = 10; // More than 10 slow requests
    return {
        shouldAlert: slowApis >= threshold,
        currentValue: slowApis,
        message: `Performance degradation: ${slowApis} APIs slower than ${config.threshold}ms in last ${config.window} minutes`,
    };
}

// ============================================================
// Alert Firing
// ============================================================

async function fireAlert(config: any, result: AlertCheckResult): Promise<void> {
    const channels = (config.channels as AlertChannelConfig[]) || [];

    logInfo('ALERT_SERVICE', `Alert fired: ${config.name}`, {
        type: config.type,
        severity: config.severity,
        value: result.currentValue,
    });

    // Update last fired time
    await prisma.alertConfiguration.update({
        where: { id: config.id },
        data: { lastFiredAt: new Date() },
    });

    // Deliver to each channel
    for (const channel of channels) {
        try {
            await deliverAlert(channel, config, result);

            // Record in history
            await prisma.alertHistory.create({
                data: {
                    configurationId: config.id,
                    severity: config.severity,
                    message: result.message,
                    details: {
                        currentValue: result.currentValue,
                        threshold: Number(config.threshold),
                        window: config.window,
                    },
                    channel: channel.type,
                    delivered: true,
                },
            });
        } catch (err) {
            logError('ALERT_SERVICE', err, { channel: channel.type, alert: config.name });

            await prisma.alertHistory.create({
                data: {
                    configurationId: config.id,
                    severity: config.severity,
                    message: result.message,
                    channel: channel.type,
                    delivered: false,
                },
            });
        }
    }
}

// ============================================================
// Channel Delivery
// ============================================================

async function deliverAlert(channel: AlertChannelConfig, config: any, result: AlertCheckResult): Promise<void> {
    switch (channel.type) {
        case 'email':
            await deliverEmailAlert(channel.target, config, result);
            break;
        case 'slack':
            await deliverSlackAlert(channel.target, config, result);
            break;
        case 'webhook':
            await deliverWebhookAlert(channel.target, config, result);
            break;
    }
}

async function deliverEmailAlert(to: string, config: any, result: AlertCheckResult): Promise<void> {
    const severityEmoji = config.severity === 'CRITICAL' ? '🚨' : config.severity === 'WARNING' ? '⚠️' : 'ℹ️';

    await emailQueue().add('alert-email', {
        to,
        subject: `${severityEmoji} [${config.severity}] ${config.name} - Vastra Verse`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: ${config.severity === 'CRITICAL' ? '#dc2626' : config.severity === 'WARNING' ? '#f59e0b' : '#3b82f6'}; color: white; padding: 16px 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 18px;">${severityEmoji} ${config.name}</h2>
                    <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 14px;">${config.type} Alert</p>
                </div>
                <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0 0 12px 0; font-size: 15px; color: #374151;">${result.message}</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
                        <tr><td style="padding: 8px; color: #6b7280; font-size: 13px;">Current Value</td><td style="padding: 8px; font-weight: bold; color: #111827;">${result.currentValue}</td></tr>
                        <tr><td style="padding: 8px; color: #6b7280; font-size: 13px;">Threshold</td><td style="padding: 8px; font-weight: bold; color: #111827;">${config.threshold}</td></tr>
                        <tr><td style="padding: 8px; color: #6b7280; font-size: 13px;">Time Window</td><td style="padding: 8px; font-weight: bold; color: #111827;">${config.window} minutes</td></tr>
                        <tr><td style="padding: 8px; color: #6b7280; font-size: 13px;">Triggered At</td><td style="padding: 8px; font-weight: bold; color: #111827;">${new Date().toISOString()}</td></tr>
                    </table>
                </div>
            </div>
        `,
        type: 'security_alert',
    });
}

async function deliverSlackAlert(webhookUrl: string, config: any, result: AlertCheckResult): Promise<void> {
    const severityEmoji = config.severity === 'CRITICAL' ? '🚨' : config.severity === 'WARNING' ? '⚠️' : 'ℹ️';

    await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text: `${severityEmoji} *[${config.severity}] ${config.name}*\n${result.message}\nValue: ${result.currentValue} | Threshold: ${config.threshold}`,
        }),
        signal: AbortSignal.timeout(5000),
    });
}

async function deliverWebhookAlert(url: string, config: any, result: AlertCheckResult): Promise<void> {
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            alert: config.name,
            type: config.type,
            severity: config.severity,
            message: result.message,
            currentValue: result.currentValue,
            threshold: Number(config.threshold),
            timestamp: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(5000),
    });
}

// ============================================================
// Alert Management (for Dashboard)
// ============================================================

/** Get all alert configurations */
export async function getAlertConfigurations() {
    return prisma.alertConfiguration.findMany({
        include: {
            history: {
                orderBy: { firedAt: 'desc' },
                take: 5,
            },
        },
        orderBy: { name: 'asc' },
    });
}

/** Get recent alert history */
export async function getAlertHistory(limit: number = 50) {
    return prisma.alertHistory.findMany({
        include: { configuration: { select: { name: true, type: true } } },
        orderBy: { firedAt: 'desc' },
        take: limit,
    });
}

/** Create or update an alert configuration */
export async function upsertAlertConfig(data: {
    name: string;
    type: AlertType;
    metric: string;
    threshold: number;
    window?: number;
    severity?: AlertSeverityType;
    channels: AlertChannelConfig[];
    enabled?: boolean;
    cooldown?: number;
}) {
    return prisma.alertConfiguration.upsert({
        where: { name: data.name },
        update: {
            type: data.type,
            metric: data.metric,
            threshold: data.threshold,
            window: data.window || 60,
            severity: data.severity as any || 'WARNING',
            channels: data.channels as any,
            enabled: data.enabled ?? true,
            cooldown: data.cooldown || 15,
        },
        create: {
            name: data.name,
            type: data.type,
            metric: data.metric,
            threshold: data.threshold,
            window: data.window || 60,
            severity: data.severity as any || 'WARNING',
            channels: data.channels as any,
            enabled: data.enabled ?? true,
            cooldown: data.cooldown || 15,
        },
    });
}

/** Resolve an alert */
export async function resolveAlert(alertId: string, resolvedBy: string) {
    return prisma.alertHistory.update({
        where: { id: alertId },
        data: { resolved: true, resolvedAt: new Date(), resolvedBy },
    });
}

// ============================================================
// Seed Default Alert Configurations
// ============================================================

/**
 * Seed default alert configurations if none exist.
 * Called once during system initialization.
 */
export async function seedDefaultAlerts(): Promise<void> {
    const count = await prisma.alertConfiguration.count();
    if (count > 0) return;

    const alertEmail = process.env.ALERT_EMAIL_TO || process.env.ADMIN_EMAIL;
    if (!alertEmail) return;

    const defaultChannels: AlertChannelConfig[] = [{ type: 'email', target: alertEmail }];

    // Add Slack if configured
    if (process.env.ALERT_SLACK_WEBHOOK) {
        defaultChannels.push({ type: 'slack', target: process.env.ALERT_SLACK_WEBHOOK });
    }

    const defaults = [
        {
            name: 'High Error Rate',
            type: 'ERROR_RATE' as AlertType,
            metric: 'error_count',
            threshold: 50,
            window: 60,
            severity: 'CRITICAL' as AlertSeverityType,
            cooldown: 30,
        },
        {
            name: 'Payment Gateway Failures',
            type: 'PAYMENT_FAILURE' as AlertType,
            metric: 'payment_failure_rate',
            threshold: 20,
            window: 30,
            severity: 'CRITICAL' as AlertSeverityType,
            cooldown: 15,
        },
        {
            name: 'Job Queue Failures',
            type: 'QUEUE_FAILURE' as AlertType,
            metric: 'worker_errors',
            threshold: 10,
            window: 60,
            severity: 'WARNING' as AlertSeverityType,
            cooldown: 30,
        },
        {
            name: 'Low Inventory Warning',
            type: 'LOW_INVENTORY' as AlertType,
            metric: 'product_stock',
            threshold: 5,
            window: 1440, // 24 hours
            severity: 'WARNING' as AlertSeverityType,
            cooldown: 1440,
        },
    ];

    for (const def of defaults) {
        await upsertAlertConfig({
            ...def,
            channels: defaultChannels,
        });
    }

    logInfo('ALERT_SERVICE', 'Default alert configurations seeded', { count: defaults.length });
}
