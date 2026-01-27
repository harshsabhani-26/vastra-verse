import { notificationService } from '../notificationService';
import { Order } from '@prisma/client';

/**
 * Trigger notification when a new order is created
 */
export async function notifyNewOrder(order: Order & { user?: { name: string | null, email: string } }) {
    // Notify all admins
    await notificationService.sendImmediate({
        role: 'ADMIN',
        type: 'NEW_ORDER',
        title: 'New Order Received',
        message: `Order #${order.id.slice(0, 8)} for ₹${order.total} from ${order.user?.name || order.user?.email || 'Customer'}`,
        priority: 'HIGH',
        resourceType: 'Order',
        resourceId: order.id,
        actionUrl: `/admin/orders/${order.id}`,
        actionText: 'View Order',
        data: {
            orderId: order.id,
            total: order.total.toString(),
            status: order.status,
        },
    });

    // Notify customer
    if (order.userId) {
        await notificationService.sendImmediate({
            userId: order.userId,
            type: 'NEW_ORDER',
            title: 'Order Confirmed',
            message: `Your order #${order.id.slice(0, 8)} has been confirmed. Total: ₹${order.total}`,
            priority: 'NORMAL',
            resourceType: 'Order',
            resourceId: order.id,
            actionUrl: `/orders/${order.id}`,
            actionText: 'Track Order',
            channels: ['IN_APP', 'EMAIL'],
        });
    }
}

/**
 * Trigger notification when order status changes
 */
export async function notifyOrderStatusChange(
    order: Order,
    oldStatus: string,
    newStatus: string
) {
    if (!order.userId) return;

    const statusMessages: Record<string, string> = {
        PROCESSING: 'Your order is being processed',
        SHIPPED: 'Your order has been shipped',
        DELIVERED: 'Your order has been delivered',
        CANCELLED: 'Your order has been cancelled',
    };

    const message = statusMessages[newStatus] || `Order status updated to ${newStatus}`;

    await notificationService.sendImmediate({
        userId: order.userId,
        type: 'ORDER_STATUS_CHANGED',
        title: 'Order Status Update',
        message: `Order #${order.id.slice(0, 8)}: ${message}`,
        priority: newStatus === 'CANCELLED' ? 'HIGH' : 'NORMAL',
        resourceType: 'Order',
        resourceId: order.id,
        actionUrl: `/orders/${order.id}`,
        actionText: 'View Details',
        channels: ['IN_APP', 'EMAIL'],
        data: {
            oldStatus,
            newStatus,
        },
    });

    // Notify admins of cancellation
    if (newStatus === 'CANCELLED') {
        await notificationService.sendImmediate({
            role: 'ADMIN',
            type: 'ORDER_CANCELLED',
            title: 'Order Cancelled',
            message: `Order #${order.id.slice(0, 8)} was cancelled`,
            priority: 'NORMAL',
            resourceType: 'Order',
            resourceId: order.id,
            actionUrl: `/admin/orders/${order.id}`,
            actionText: 'View Order',
        });
    }
}

/**
 * Trigger notification when order is cancelled
 */
export async function notifyOrderCancelled(order: Order, reason?: string) {
    // Notify customer
    if (order.userId) {
        await notificationService.sendImmediate({
            userId: order.userId,
            type: 'ORDER_CANCELLED',
            title: 'Order Cancelled',
            message: `Your order #${order.id.slice(0, 8)} has been cancelled${reason ? `: ${reason}` : ''}`,
            priority: 'HIGH',
            resourceType: 'Order',
            resourceId: order.id,
            actionUrl: `/orders/${order.id}`,
            channels: ['IN_APP', 'EMAIL'],
        });
    }

    // Notify admins
    await notificationService.sendImmediate({
        role: 'ADMIN',
        type: 'ORDER_CANCELLED',
        title: 'Order Cancelled',
        message: `Order #${order.id.slice(0, 8)} cancelled${reason ? `: ${reason}` : ''}`,
        priority: 'NORMAL',
        resourceType: 'Order',
        resourceId: order.id,
        actionUrl: `/admin/orders/${order.id}`,
        actionText: 'View Order',
    });
}
