/**
 * Inngest Client
 *
 * Serverless-native background job system for Next.js.
 * Railway-compatible — no worker infrastructure needed.
 *
 * Usage:
 *   import { inngest } from '@/lib/inngest';
 *   await inngest.send({ name: 'order/placed', data: { orderId: '...' } });
 */

import { Inngest } from 'inngest';
import { logInfo, logError } from '@/lib/logger';

// Singleton client — reused across all serverless invocations
export const inngest = new Inngest({
    id: 'vastraverse',
    name: 'VastraVerse',
});

// ─── Event Type Definitions ───────────────────────────────────────────────────
// Centralised event schema for type safety across all jobs

export type Events = {
    // ── Email ─────────────────────────────────────────────────────────────
    'email/send': {
        data: {
            to: string;
            subject: string;
            html: string;
            from?: string;
            replyTo?: string;
            orderId?: string;
            type?: 'order_confirmation' | 'payment_receipt' | 'shipment_notification' |
            'return_approval' | 'refund_confirmation' | 'security_alert' |
            'order_status_update' | 'payment_failed';
        };
    };

    // ── Invoicing ─────────────────────────────────────────────────────────
    'invoice/generate': {
        data: {
            orderId: string;
            userId: string;
        };
    };

    // ── Orders ────────────────────────────────────────────────────────────
    'order/placed': {
        data: {
            orderId: string;
            userId: string;
            orderNumber: string;
            customerEmail: string;
            customerName: string;
            totalAmount: number;
            paymentMethod: 'ONLINE' | 'COD';
            items: Array<{
                productId: string;
                variantId?: string;
                quantity: number;
                price: number;
                name: string;
            }>;
        };
    };
    'order/status-updated': {
        data: {
            orderId: string;
            userId: string;
            orderNumber: string;
            previousStatus: string;
            newStatus: string;
            customerEmail: string;
            customerName: string;
            customerPhone?: string;
        };
    };

    // ── Payments ──────────────────────────────────────────────────────────
    'payment/captured': {
        data: {
            orderId: string;
            userId: string;
            paymentId: string;
            gatewayPaymentId: string;
            amount: number;
            method: string;
            customerEmail: string;
        };
    };
    'payment/failed': {
        data: {
            orderId: string;
            userId: string;
            paymentId?: string;
            gatewayPaymentId?: string;
            amount: number;
            reason: string;
            customerEmail: string;
            items: Array<{
                productId: string;
                variantId?: string;
                quantity: number;
            }>;
        };
    };

    // ── Inventory ─────────────────────────────────────────────────────────
    'inventory/update': {
        data: {
            productId: string;
            variantId?: string;
            quantityChange: number; // negative = decrement, positive = increment
            reason: 'order_placed' | 'order_cancelled' | 'return_approved' | 'manual_adjustment' | 'restock';
            orderId?: string;
            userId?: string;
        };
    };

    // ── Notifications ─────────────────────────────────────────────────────
    'notification/send': {
        data: {
            type: 'sms' | 'push' | 'in_app';
            userId?: string;
            phone?: string;
            message: string;
            title?: string;
            template?: string;
            data?: Record<string, any>;
        };
    };

    // ── Analytics ─────────────────────────────────────────────────────────
    'analytics/record': {
        data: {
            event: string;
            properties: Record<string, any>;
            userId?: string;
            orderId?: string;
            timestamp?: string;
        };
    };
};

// ─── Logging Helpers ──────────────────────────────────────────────────────────

/**
 * Log the start of an Inngest function for structured observability.
 */
export function logJobStart(jobName: string, data: Record<string, any>) {
    logInfo('INNGEST', `Job started: ${jobName}`, {
        job: jobName,
        ...data,
        startedAt: new Date().toISOString(),
    });
}

/**
 * Log the completion of an Inngest function.
 */
export function logJobComplete(jobName: string, data: Record<string, any>, durationMs?: number) {
    logInfo('INNGEST', `Job completed: ${jobName}`, {
        job: jobName,
        ...data,
        durationMs,
        completedAt: new Date().toISOString(),
    });
}

/**
 * Log an Inngest function error.
 */
export function logJobError(jobName: string, error: unknown, data: Record<string, any>) {
    logError('INNGEST', error, {
        job: jobName,
        ...data,
        failedAt: new Date().toISOString(),
    });
}

