import { notificationService } from '../notificationService';
import { Order, Refund } from '@prisma/client';

/**
 * Trigger notification when a return is requested
 */
export async function notifyReturnRequest(
    order: Order & {
        user?: {
            name: string | null;
            email: string;
        };
    }
) {
    await notificationService.sendImmediate({
        role: 'ADMIN',
        type: 'RETURN_REQUEST',
        title: 'New Return Request',
        message: `Return requested for Order #${order.id.slice(0, 8)} by ${order.user?.name || order.user?.email || 'Customer'}`,
        priority: 'HIGH',
        resourceType: 'Order',
        resourceId: order.id,
        actionUrl: `/admin/orders/${order.id}`,
        actionText: 'Review Request',
        data: {
            orderId: order.id,
            customerEmail: order.user?.email,
        },
    });
}

/**
 * Trigger notification when return is approved
 */
export async function notifyReturnApproved(order: Order) {
    if (!order.userId) return;

    await notificationService.sendImmediate({
        userId: order.userId,
        type: 'RETURN_REQUEST',
        title: 'Return Approved',
        message: `Your return request for Order #${order.id.slice(0, 8)} has been approved`,
        priority: 'NORMAL',
        resourceType: 'Order',
        resourceId: order.id,
        actionUrl: `/orders/${order.id}`,
        actionText: 'View Details',
        channels: ['IN_APP', 'EMAIL'],
    });
}

/**
 * Trigger notification when return is rejected
 */
export async function notifyReturnRejected(order: Order, reason?: string) {
    if (!order.userId) return;

    await notificationService.sendImmediate({
        userId: order.userId,
        type: 'RETURN_REQUEST',
        title: 'Return Request Rejected',
        message: `Your return request for Order #${order.id.slice(0, 8)} was not approved${reason ? `: ${reason}` : ''}`,
        priority: 'HIGH',
        resourceType: 'Order',
        resourceId: order.id,
        actionUrl: `/orders/${order.id}`,
        channels: ['IN_APP', 'EMAIL'],
    });
}
