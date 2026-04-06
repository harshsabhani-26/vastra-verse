/**
 * Event Dispatcher System
 * 
 * Decouples business operations from side effects.
 * When an event fires, it enqueues background jobs automatically.
 * 
 * Events:
 * - ORDER_CREATED → email (order confirmation) + invoice
 * - PAYMENT_SUCCESS → email (payment receipt)
 * - PAYMENT_FAILED → email (payment failure notice)
 * - RETURN_APPROVED → email (return approval) + refund
 * - REFUND_PROCESSED → email (refund confirmation) + notification
 */

import { emailQueue, invoiceQueue, refundQueue, notificationQueue } from '@/lib/queue';
import { logInfo, logError } from '@/lib/logger';

// ============================================================
// Event Types
// ============================================================

export enum SystemEvent {
    ORDER_CREATED = 'order.created',
    PAYMENT_SUCCESS = 'payment.success',
    PAYMENT_FAILED = 'payment.failed',
    SHIPMENT_CREATED = 'shipment.created',
    SHIPMENT_DELIVERED = 'shipment.delivered',
    RETURN_APPROVED = 'return.approved',
    REFUND_PROCESSED = 'refund.processed',
}

// ============================================================
// Event Payloads
// ============================================================

interface OrderCreatedPayload {
    orderId: string;
    userId: string;
    customerEmail: string;
    customerName: string;
    orderTotal: number;
    orderNumber: string;
    items: Array<{ name: string; quantity: number; price: number }>;
}

interface PaymentSuccessPayload {
    orderId: string;
    paymentId: string;
    customerEmail: string;
    customerName: string;
    amount: number;
    method: string;
}

interface PaymentFailedPayload {
    orderId: string;
    customerEmail: string;
    customerName: string;
    amount: number;
    reason?: string;
}

interface ReturnApprovedPayload {
    orderId: string;
    returnRequestId: string;
    customerEmail: string;
    customerName: string;
    refundAmount: number;
    paymentId: string;
    gatewayPaymentId: string;
    items: Array<{ name: string; quantity: number }>;
}

interface RefundProcessedPayload {
    orderId: string;
    refundId: string;
    customerEmail: string;
    customerName: string;
    amount: number;
    customerPhone?: string;
}

// Union type for all event payloads
type EventPayloadMap = {
    [SystemEvent.ORDER_CREATED]: OrderCreatedPayload;
    [SystemEvent.PAYMENT_SUCCESS]: PaymentSuccessPayload;
    [SystemEvent.PAYMENT_FAILED]: PaymentFailedPayload;
    [SystemEvent.SHIPMENT_CREATED]: Record<string, any>;
    [SystemEvent.SHIPMENT_DELIVERED]: Record<string, any>;
    [SystemEvent.RETURN_APPROVED]: ReturnApprovedPayload;
    [SystemEvent.REFUND_PROCESSED]: RefundProcessedPayload;
};

// ============================================================
// Event Handlers
// ============================================================

async function handleOrderCreated(payload: OrderCreatedPayload) {
    const itemsList = payload.items
        .map(i => `${i.name} × ${i.quantity} — ₹${i.price.toLocaleString('en-IN')}`)
        .join('<br>');

    // Enqueue order confirmation email
    await emailQueue().add('order-confirmation', {
        to: payload.customerEmail,
        subject: `Order Confirmed — #${payload.orderNumber}`,
        html: `
            <h2>Thank you for your order, ${payload.customerName}!</h2>
            <p>Your order <strong>#${payload.orderNumber}</strong> has been placed successfully.</p>
            <h3>Order Summary</h3>
            <p>${itemsList}</p>
            <p><strong>Total: ₹${payload.orderTotal.toLocaleString('en-IN')}</strong></p>
            <p>We'll notify you when your order ships.</p>
            <p>— Vastraa Verse</p>
        `,
        type: 'order_confirmation',
        orderId: payload.orderId,
    });

    // Enqueue invoice generation
    await invoiceQueue().add('generate-invoice', {
        orderId: payload.orderId,
        userId: payload.userId,
    });
}

async function handlePaymentSuccess(payload: PaymentSuccessPayload) {
    await emailQueue().add('payment-receipt', {
        to: payload.customerEmail,
        subject: `Payment Received — ₹${payload.amount.toLocaleString('en-IN')}`,
        html: `
            <h2>Payment Successful!</h2>
            <p>Hi ${payload.customerName},</p>
            <p>We've received your payment of <strong>₹${payload.amount.toLocaleString('en-IN')}</strong> via ${payload.method}.</p>
            <p>Your order is now being processed.</p>
            <p>— Vastraa Verse</p>
        `,
        type: 'payment_receipt',
        orderId: payload.orderId,
    });
}

async function handlePaymentFailed(payload: PaymentFailedPayload) {
    await emailQueue().add('payment-failed', {
        to: payload.customerEmail,
        subject: 'Payment Failed — Action Required',
        html: `
            <h2>Payment Failed</h2>
            <p>Hi ${payload.customerName},</p>
            <p>Your payment of <strong>₹${payload.amount.toLocaleString('en-IN')}</strong> could not be processed.</p>
            ${payload.reason ? `<p>Reason: ${payload.reason}</p>` : ''}
            <p>You can retry your payment from the order page.</p>
            <p>— Vastraa Verse</p>
        `,
        type: 'security_alert',
        orderId: payload.orderId,
    });
}

async function handleReturnApproved(payload: ReturnApprovedPayload) {
    const itemsList = payload.items
        .map(i => `${i.name} × ${i.quantity}`)
        .join('<br>');

    // Send return approval email
    await emailQueue().add('return-approved', {
        to: payload.customerEmail,
        subject: 'Return Approved — Refund Initiated',
        html: `
            <h2>Return Approved</h2>
            <p>Hi ${payload.customerName},</p>
            <p>Your return request has been approved.</p>
            <h3>Items Being Returned</h3>
            <p>${itemsList}</p>
            <p>A refund of <strong>₹${payload.refundAmount.toLocaleString('en-IN')}</strong> will be processed shortly.</p>
            <p>— Vastraa Verse</p>
        `,
        type: 'return_approval',
        orderId: payload.orderId,
    });

    // Enqueue refund processing
    await refundQueue().add('process-refund', {
        refundId: payload.returnRequestId,
        paymentId: payload.paymentId,
        gatewayPaymentId: payload.gatewayPaymentId,
        amount: payload.refundAmount,
        orderId: payload.orderId,
        reason: 'Return approved',
    });
}

async function handleRefundProcessed(payload: RefundProcessedPayload) {
    // Send refund confirmation email
    await emailQueue().add('refund-confirmation', {
        to: payload.customerEmail,
        subject: `Refund Processed — ₹${payload.amount.toLocaleString('en-IN')}`,
        html: `
            <h2>Refund Processed!</h2>
            <p>Hi ${payload.customerName},</p>
            <p>Your refund of <strong>₹${payload.amount.toLocaleString('en-IN')}</strong> has been processed.</p>
            <p>It may take 5-7 business days to reflect in your account.</p>
            <p>— Vastraa Verse</p>
        `,
        type: 'refund_confirmation',
        orderId: payload.orderId,
    });

    // Send SMS notification if phone available
    if (payload.customerPhone) {
        await notificationQueue().add('refund-sms', {
            type: 'sms',
            phone: payload.customerPhone,
            message: `Your refund of ₹${payload.amount.toLocaleString('en-IN')} has been processed. It will reflect in 5-7 business days. — Vastraa Verse`,
        });
    }
}

// ============================================================
// Dispatcher
// ============================================================

/**
 * Dispatch an event — automatically enqueues all related background jobs
 * 
 * Usage:
 * ```typescript
 * await dispatchEvent(SystemEvent.ORDER_CREATED, {
 *   orderId: '123',
 *   userId: 'user123',
 *   customerEmail: 'user@example.com',
 *   ...
 * });
 * ```
 */
export async function dispatchEvent<E extends SystemEvent>(
    event: E,
    payload: EventPayloadMap[E]
): Promise<void> {
    const startTime = Date.now();

    logInfo('EVENT', `Dispatching: ${event}`, {
        event,
        orderId: (payload as any).orderId,
    });

    try {
        switch (event) {
            case SystemEvent.ORDER_CREATED:
                await handleOrderCreated(payload as OrderCreatedPayload);
                break;

            case SystemEvent.PAYMENT_SUCCESS:
                await handlePaymentSuccess(payload as PaymentSuccessPayload);
                break;

            case SystemEvent.PAYMENT_FAILED:
                await handlePaymentFailed(payload as PaymentFailedPayload);
                break;

            case SystemEvent.RETURN_APPROVED:
                await handleReturnApproved(payload as ReturnApprovedPayload);
                break;

            case SystemEvent.REFUND_PROCESSED:
                await handleRefundProcessed(payload as RefundProcessedPayload);
                break;

            case SystemEvent.SHIPMENT_CREATED:
            case SystemEvent.SHIPMENT_DELIVERED:
                // Shipment events — placeholder for future integration
                logInfo('EVENT', `Shipment event ${event} received — no handler yet`, payload as Record<string, any>);
                break;

            default:
                logError('EVENT', new Error(`Unknown event: ${event}`));
        }

        const duration = Date.now() - startTime;
        logInfo('EVENT', `Dispatched: ${event} in ${duration}ms`, {
            event,
            duration: `${duration}ms`,
        });
    } catch (error) {
        logError('EVENT', error, {
            event,
            orderId: (payload as any).orderId,
        });
        // Don't throw — event dispatch failures shouldn't break the main flow
    }
}
