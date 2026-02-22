/**
 * Custom Error Tracking Service
 * 
 * Database-backed error tracking with:
 * - Fingerprint-based error grouping
 * - Rich context attachment (userId, orderId, requestId)
 * - Error occurrence counting
 * - Automatic alerting on error spikes
 * - Resolution tracking
 * 
 * Replaces external services like Sentry — full control, zero cost.
 */

import prisma from '@/lib/prisma';
import { logError } from '@/lib/logger';
// NOTE: Using globalThis.crypto (Web Crypto API) instead of Node's `crypto` module
// so this file is compatible with Edge Runtime static analysis.

// ============================================================
// Types
// ============================================================

export type ErrorSource = 'API' | 'WORKER' | 'PAYMENT' | 'SHIPPING' | 'WEBHOOK' | 'AUTH' | 'DATABASE' | 'SYSTEM';
export type ErrorSeverityLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface ErrorContext {
    userId?: string;
    orderId?: string;
    requestId?: string;
    endpoint?: string;
    statusCode?: number;
    metadata?: Record<string, any>;
}

interface CaptureErrorOptions {
    source: ErrorSource;
    severity?: ErrorSeverityLevel;
    context?: ErrorContext;
}

// ============================================================
// Fingerprint Generation
// ============================================================

/**
 * Generate a fingerprint hash for error grouping.
 * Groups errors by message + source + endpoint.
 * Uses Web Crypto API (compatible with both Node.js ≥15 and Edge Runtime).
 */
async function generateFingerprint(message: string, source: string, endpoint?: string): Promise<string> {
    // Normalize the message: remove dynamic values like IDs, timestamps, numbers
    const normalized = message
        .replace(/[0-9a-f]{8,}/gi, '<ID>')   // UUIDs and hex strings
        .replace(/\d+/g, '<N>')               // Numbers
        .replace(/"[^"]*"/g, '"<STR>"')        // Quoted strings
        .trim();

    const raw = `${source}:${endpoint || 'unknown'}:${normalized}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(raw);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

/**
 * Truncate stack trace for storage (keep first 2000 chars)
 */
function truncateStack(stack?: string): string | undefined {
    if (!stack) return undefined;
    return stack.length > 2000 ? stack.substring(0, 2000) + '\n... truncated' : stack;
}

// ============================================================
// Error Capture (Non-blocking)
// ============================================================

/**
 * Capture an error and store it in the database.
 * Uses upsert to deduplicate by fingerprint.
 * Non-blocking: fires and forgets to avoid impacting request latency.
 */
export function captureError(error: unknown, options: CaptureErrorOptions): void {
    // Fire and forget — never block the caller
    _captureErrorAsync(error, options).catch((dbError) => {
        // If we can't write to DB, fall back to console
        logError('ERROR_TRACKER', dbError, { originalError: String(error) });
    });
}

async function _captureErrorAsync(error: unknown, options: CaptureErrorOptions): Promise<void> {
    const { source, severity = 'ERROR', context = {} } = options;

    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? truncateStack(error.stack) : undefined;
    const fingerprint = await generateFingerprint(message, source, context.endpoint);

    // Try to upsert: if fingerprint exists, increment count & update lastSeen
    // If not, create a new error log entry
    const existing = await prisma.errorLog.findFirst({
        where: { fingerprint, resolved: false },
    });

    if (existing) {
        await prisma.errorLog.update({
            where: { id: existing.id },
            data: {
                count: { increment: 1 },
                lastSeen: new Date(),
                // Update metadata with latest context
                metadata: context.metadata ? context.metadata : (existing.metadata as Record<string, any> | undefined),
            },
        });
    } else {
        await prisma.errorLog.create({
            data: {
                fingerprint,
                message: message.substring(0, 1000), // Cap message length
                stack,
                severity: severity as any,
                source,
                endpoint: context.endpoint,
                statusCode: context.statusCode,
                userId: context.userId,
                orderId: context.orderId,
                requestId: context.requestId,
                metadata: context.metadata || undefined,
            },
        });
    }
}

// ============================================================
// Convenience Capture Methods
// ============================================================

/** Capture an API route error */
export function captureApiError(error: unknown, context: ErrorContext & { endpoint: string }) {
    captureError(error, {
        source: 'API',
        severity: context.statusCode && context.statusCode >= 500 ? 'ERROR' : 'WARNING',
        context,
    });
}

/** Capture a background worker error */
export function captureWorkerError(error: unknown, workerName: string, context?: Omit<ErrorContext, 'endpoint'>) {
    captureError(error, {
        source: 'WORKER',
        severity: 'ERROR',
        context: { ...context, endpoint: workerName },
    });
}

/** Capture a payment processing error */
export function capturePaymentError(error: unknown, context: ErrorContext) {
    captureError(error, {
        source: 'PAYMENT',
        severity: 'CRITICAL',
        context,
    });
}

/** Capture a shipping integration error */
export function captureShippingError(error: unknown, context: ErrorContext) {
    captureError(error, {
        source: 'SHIPPING',
        severity: 'ERROR',
        context,
    });
}

/** Capture a webhook processing error */
export function captureWebhookError(error: unknown, provider: string, context?: Omit<ErrorContext, 'endpoint'>) {
    captureError(error, {
        source: 'WEBHOOK',
        severity: 'ERROR',
        context: { ...context, endpoint: provider },
    });
}

// ============================================================
// Error Queries (for Dashboard)
// ============================================================

/** Get recent errors with pagination */
export async function getRecentErrors(options: {
    limit?: number;
    offset?: number;
    source?: ErrorSource;
    severity?: ErrorSeverityLevel;
    resolved?: boolean;
} = {}) {
    const { limit = 20, offset = 0, source, severity, resolved } = options;

    const where: any = {};
    if (source) where.source = source;
    if (severity) where.severity = severity;
    if (resolved !== undefined) where.resolved = resolved;

    const [errors, total] = await Promise.all([
        prisma.errorLog.findMany({
            where,
            orderBy: { lastSeen: 'desc' },
            take: limit,
            skip: offset,
        }),
        prisma.errorLog.count({ where }),
    ]);

    return { errors, total };
}

/** Get error rate for a time window */
export async function getErrorRate(windowMinutes: number = 60): Promise<{
    total: number;
    bySeverity: Record<string, number>;
    bySource: Record<string, number>;
}> {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);

    const errors = await prisma.errorLog.findMany({
        where: { createdAt: { gte: since } },
        select: { severity: true, source: true, count: true },
    });

    const bySeverity: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    let total = 0;

    for (const err of errors) {
        total += err.count;
        bySeverity[err.severity] = (bySeverity[err.severity] || 0) + err.count;
        bySource[err.source] = (bySource[err.source] || 0) + err.count;
    }

    return { total, bySeverity, bySource };
}

/** Get error trends (hourly counts for last 24h) */
export async function getErrorTrends(): Promise<Array<{ hour: string; count: number }>> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const errors = await prisma.errorLog.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true, count: true },
    });

    // Group by hour
    const hourlyMap: Record<string, number> = {};
    for (let h = 0; h < 24; h++) {
        const d = new Date(Date.now() - (23 - h) * 60 * 60 * 1000);
        const key = d.toISOString().substring(0, 13);
        hourlyMap[key] = 0;
    }

    for (const err of errors) {
        const key = err.createdAt.toISOString().substring(0, 13);
        if (hourlyMap[key] !== undefined) {
            hourlyMap[key] += err.count;
        }
    }

    return Object.entries(hourlyMap).map(([hour, count]) => ({ hour, count }));
}

/** Resolve an error */
export async function resolveError(errorId: string, resolvedBy: string) {
    return prisma.errorLog.update({
        where: { id: errorId },
        data: { resolved: true, resolvedAt: new Date(), resolvedBy },
    });
}

/** Bulk resolve errors by fingerprint */
export async function resolveErrorsByFingerprint(fingerprint: string, resolvedBy: string) {
    return prisma.errorLog.updateMany({
        where: { fingerprint, resolved: false },
        data: { resolved: true, resolvedAt: new Date(), resolvedBy },
    });
}
