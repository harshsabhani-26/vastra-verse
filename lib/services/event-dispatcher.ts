import { NotificationService } from './notification-service';
import prisma from '@/lib/prisma';

/**
 * Enterprise Event Dispatcher
 * 
 * Centralized event bus that triggers notifications and activity log entries
 * whenever business events occur. All methods are non-blocking (fire-and-forget)
 * to avoid slowing down the original operation.
 */
export const EventDispatcher = {
    // ─── Order Events ───────────────────────────────────────────────────────

    orderCreated: async (order: {
        id: string;
        total: number | any;
        user?: { name?: string | null; email?: string | null } | null;
    }) => {
        const customerName = order.user?.name || order.user?.email || 'Customer';
        await NotificationService.create({
            type: 'NEW_ORDER',
            priority: 'URGENT',
            title: '🛒 New Order Received',
            message: `${customerName} placed an order for ₹${Number(order.total).toLocaleString()}`,
            resourceType: 'Order',
            resourceId: order.id,
            actionUrl: `/admin/orders/${order.id}`,
            actionText: 'View Order',
            channels: ['IN_APP'],
            data: { orderId: order.id, total: Number(order.total), customer: customerName },
        });
    },

    orderConfirmed: async (orderId: string, confirmedBy?: string) => {
        await NotificationService.create({
            type: 'ORDER_CONFIRMED',
            priority: 'NORMAL',
            title: '✅ Order Confirmed',
            message: `Order #${orderId.slice(0, 8)} has been confirmed`,
            resourceType: 'Order',
            resourceId: orderId,
            actionUrl: `/admin/orders/${orderId}`,
            actionText: 'View Order',
        });
    },

    orderCancelled: async (orderId: string, reason?: string) => {
        await NotificationService.create({
            type: 'ORDER_CANCELLED',
            priority: 'HIGH',
            title: '❌ Order Cancelled',
            message: `Order #${orderId.slice(0, 8)} was cancelled${reason ? `: ${reason}` : ''}`,
            resourceType: 'Order',
            resourceId: orderId,
            actionUrl: `/admin/orders/${orderId}`,
            actionText: 'View Order',
        });
    },

    // ─── Payment Events ─────────────────────────────────────────────────────

    paymentReceived: async (payment: {
        id: string;
        orderId: string;
        amount: number | any;
        method?: string;
    }) => {
        await NotificationService.create({
            type: 'PAYMENT_RECEIVED',
            priority: 'NORMAL',
            title: '💰 Payment Received',
            message: `₹${Number(payment.amount).toLocaleString()} received for Order #${payment.orderId.slice(0, 8)} via ${payment.method || 'Online'}`,
            resourceType: 'Payment',
            resourceId: payment.id,
            actionUrl: `/admin/orders/${payment.orderId}`,
            actionText: 'View Order',
        });
    },

    paymentFailed: async (payment: {
        id: string;
        orderId: string;
        amount: number | any;
        reason?: string;
    }) => {
        await NotificationService.create({
            type: 'PAYMENT_FAILED',
            priority: 'URGENT',
            title: '⚠️ Payment Failed',
            message: `₹${Number(payment.amount).toLocaleString()} payment failed for Order #${payment.orderId.slice(0, 8)}${payment.reason ? ` - ${payment.reason}` : ''}`,
            resourceType: 'Payment',
            resourceId: payment.id,
            actionUrl: `/admin/orders/${payment.orderId}`,
            actionText: 'View Details',
        });
    },

    // ─── Shipment Events ────────────────────────────────────────────────────

    shipmentCreated: async (shipment: {
        id: string;
        orderId: string;
        awbNumber?: string | null;
        courierName?: string | null;
    }) => {
        await NotificationService.create({
            type: 'SHIPMENT_CREATED',
            priority: 'NORMAL',
            title: '📦 Shipment Created',
            message: `Shipment created for Order #${shipment.orderId.slice(0, 8)}${shipment.awbNumber ? ` | AWB: ${shipment.awbNumber}` : ''}${shipment.courierName ? ` via ${shipment.courierName}` : ''}`,
            resourceType: 'Shipment',
            resourceId: shipment.id,
            actionUrl: `/admin/orders/${shipment.orderId}`,
            actionText: 'View Shipment',
        });
    },

    shipmentDelivered: async (shipment: {
        id: string;
        orderId: string;
        awbNumber?: string | null;
    }) => {
        await NotificationService.create({
            type: 'DELIVERED',
            priority: 'LOW',
            title: '✅ Shipment Delivered',
            message: `Order #${shipment.orderId.slice(0, 8)} has been delivered successfully${shipment.awbNumber ? ` (AWB: ${shipment.awbNumber})` : ''}`,
            resourceType: 'Shipment',
            resourceId: shipment.id,
            actionUrl: `/admin/orders/${shipment.orderId}`,
            actionText: 'View Order',
        });
    },

    deliveryFailed: async (shipment: {
        id: string;
        orderId: string;
        awbNumber?: string | null;
        reason?: string | null;
    }) => {
        await NotificationService.create({
            type: 'DELIVERY_FAILED',
            priority: 'URGENT',
            title: '🚨 Delivery Failed',
            message: `Delivery failed for Order #${shipment.orderId.slice(0, 8)}${shipment.reason ? `: ${shipment.reason}` : ''}`,
            resourceType: 'Shipment',
            resourceId: shipment.id,
            actionUrl: `/admin/orders/${shipment.orderId}`,
            actionText: 'Take Action',
        });
    },

    rtoInitiated: async (shipment: {
        id: string;
        orderId: string;
        awbNumber?: string | null;
    }) => {
        await NotificationService.create({
            type: 'RTO_INITIATED',
            priority: 'HIGH',
            title: '🔄 RTO Initiated',
            message: `Return-to-origin initiated for Order #${shipment.orderId.slice(0, 8)}${shipment.awbNumber ? ` (AWB: ${shipment.awbNumber})` : ''}`,
            resourceType: 'Shipment',
            resourceId: shipment.id,
            actionUrl: `/admin/orders/${shipment.orderId}`,
            actionText: 'View Details',
        });
    },

    // ─── Return Events ──────────────────────────────────────────────────────

    returnRequested: async (returnRequest: {
        id: string;
        orderId: string;
        reason?: string;
        user?: { name?: string | null; email?: string | null } | null;
    }) => {
        const customerName = returnRequest.user?.name || returnRequest.user?.email || 'Customer';
        await NotificationService.create({
            type: 'RETURN_REQUEST',
            priority: 'URGENT',
            title: '↩️ Return Requested',
            message: `${customerName} requested a return for Order #${returnRequest.orderId.slice(0, 8)}${returnRequest.reason ? ` - ${returnRequest.reason}` : ''}`,
            resourceType: 'ReturnRequest',
            resourceId: returnRequest.id,
            actionUrl: `/admin/returns`,
            actionText: 'Review Return',
        });
    },

    returnApproved: async (returnRequest: { id: string; orderId: string }) => {
        await NotificationService.create({
            type: 'RETURN_APPROVED',
            priority: 'NORMAL',
            title: '✅ Return Approved',
            message: `Return for Order #${returnRequest.orderId.slice(0, 8)} has been approved`,
            resourceType: 'ReturnRequest',
            resourceId: returnRequest.id,
            actionUrl: `/admin/returns`,
            actionText: 'View Return',
        });
    },

    // ─── Refund Events ──────────────────────────────────────────────────────

    refundInitiated: async (refund: {
        id: string;
        orderId: string;
        amount: number | any;
    }) => {
        await NotificationService.create({
            type: 'REFUND_INITIATED',
            priority: 'HIGH',
            title: '💸 Refund Initiated',
            message: `₹${Number(refund.amount).toLocaleString()} refund initiated for Order #${refund.orderId.slice(0, 8)}`,
            resourceType: 'Refund',
            resourceId: refund.id,
            actionUrl: `/admin/payments`,
            actionText: 'View Refund',
        });
    },

    refundCompleted: async (refund: {
        id: string;
        orderId: string;
        amount: number | any;
    }) => {
        await NotificationService.create({
            type: 'REFUND_COMPLETED',
            priority: 'NORMAL',
            title: '✅ Refund Completed',
            message: `₹${Number(refund.amount).toLocaleString()} refund completed for Order #${refund.orderId.slice(0, 8)}`,
            resourceType: 'Refund',
            resourceId: refund.id,
            actionUrl: `/admin/payments`,
            actionText: 'View Details',
        });
    },

    // ─── Stock Events ───────────────────────────────────────────────────────

    lowStockAlert: async (product: {
        id: string;
        name: string;
        stock: number;
    }) => {
        await NotificationService.create({
            type: 'LOW_STOCK_ALERT',
            priority: 'HIGH',
            title: '📉 Low Stock Alert',
            message: `"${product.name}" has only ${product.stock} units left`,
            resourceType: 'Product',
            resourceId: product.id,
            actionUrl: `/admin/inventory`,
            actionText: 'Update Stock',
        });
    },

    // ─── System Events ──────────────────────────────────────────────────────

    systemAlert: async (alert: {
        type: string;
        severity: string;
        message: string;
        details?: Record<string, unknown>;
    }) => {
        // Create persistent system alert
        try {
            await prisma.systemAlert.create({
                data: {
                    type: alert.type,
                    severity: alert.severity,
                    message: alert.message,
                    details: alert.details as any,
                },
            });
        } catch (e) {
            console.error('[EventDispatcher] Failed to create system alert:', e);
        }

        // Also create notification
        await NotificationService.create({
            type: 'SYSTEM_ALERT',
            priority: alert.severity === 'CRITICAL' ? 'URGENT' : 'HIGH',
            title: `⚠️ System Alert: ${alert.type}`,
            message: alert.message,
            data: alert.details,
        });
    },
};
