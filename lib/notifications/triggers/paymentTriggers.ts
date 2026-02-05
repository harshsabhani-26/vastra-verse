import { notificationService } from '../notificationService';
import { Payment, Refund } from '@prisma/client';

/**
 * Trigger notification when payment is received
 */
export async function notifyPaymentReceived(
    payment: Payment & {
        order?: {
            id: string;
            userId: string | null;
            user?: { name: string | null; email: string };
        }
    }
) {
    const amount = payment.amount.toString();

    // Notify admins
    await notificationService.sendImmediate({
        role: 'ADMIN',
        type: 'PAYMENT_RECEIVED',
        title: 'Payment Received',
        message: `₹${amount} received for Order #${payment.orderId.slice(0, 8)} via ${(payment as any).method || 'Unknown'}`,
        priority: 'NORMAL',
        resourceType: 'Payment',
        resourceId: payment.id,
        actionUrl: `/admin/payments/${payment.id}`,
        actionText: 'View Payment',
        data: {
            amount,
            provider: (payment as any).method || 'Unknown',
            orderId: payment.orderId,
        },
    });

    // Notify customer
    if (payment.order?.userId) {
        await notificationService.sendImmediate({
            userId: payment.order.userId,
            type: 'PAYMENT_RECEIVED',
            title: 'Payment Confirmed',
            message: `Your payment of ₹${amount} has been received`,
            priority: 'NORMAL',
            resourceType: 'Payment',
            resourceId: payment.id,
            actionUrl: `/orders/${payment.orderId}`,
            actionText: 'View Order',
            channels: ['IN_APP', 'EMAIL'],
        });
    }
}

/**
 * Trigger notification when payment fails
 */
export async function notifyPaymentFailed(
    payment: Payment & {
        order?: {
            userId: string | null;
        }
    },
    errorMessage?: string
) {
    const amount = payment.amount.toString();

    // Notify customer
    if (payment.order?.userId) {
        await notificationService.sendImmediate({
            userId: payment.order.userId,
            type: 'PAYMENT_FAILED',
            title: 'Payment Failed',
            message: `Payment of ₹${amount} failed. Please try again.`,
            priority: 'HIGH',
            resourceType: 'Payment',
            resourceId: payment.id,
            actionUrl: `/orders/${payment.orderId}`,
            actionText: 'Retry Payment',
            channels: ['IN_APP', 'EMAIL'],
        });
    }

    // Notify admins
    await notificationService.sendImmediate({
        role: 'ADMIN',
        type: 'PAYMENT_FAILED',
        title: 'Payment Failed',
        message: `Payment of ₹${amount} failed for Order #${payment.orderId.slice(0, 8)}${errorMessage ? `: ${errorMessage}` : ''}`,
        priority: 'HIGH',
        resourceType: 'Payment',
        resourceId: payment.id,
        actionUrl: `/admin/payments/${payment.id}`,
        actionText: 'View Details',
    });
}

/**
 * Trigger notification when refund is processed
 */
export async function notifyRefundProcessed(
    refund: Refund & {
        order?: {
            userId: string | null;
            id: string;
        };
    }
) {
    const amount = refund.amount.toString();

    // Notify customer
    if (refund.order?.userId) {
        await notificationService.sendImmediate({
            userId: refund.order.userId,
            type: 'REFUND_PROCESSED',
            title: 'Refund Processed',
            message: `Your refund of ₹${amount} has been processed and will be credited in 5-7 business days`,
            priority: 'NORMAL',
            resourceType: 'Refund',
            resourceId: refund.id,
            actionUrl: `/orders/${refund.orderId}`,
            actionText: 'View Order',
            channels: ['IN_APP', 'EMAIL'],
        });
    }

    // Notify admins
    await notificationService.sendImmediate({
        role: 'ADMIN',
        type: 'REFUND_PROCESSED',
        title: 'Refund Processed',
        message: `Refund of ₹${amount} processed for Order #${refund.orderId.slice(0, 8)}`,
        priority: 'NORMAL',
        resourceType: 'Refund',
        resourceId: refund.id,
        actionUrl: `/admin/refunds/${refund.id}`,
        actionText: 'View Refund',
    });
}
