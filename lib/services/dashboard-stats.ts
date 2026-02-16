import prisma from '@/lib/prisma';

/**
 * Dashboard Stats Service
 * 
 * Aggregates real-time metrics for the admin command center dashboard.
 * Designed for performance - uses parallel queries and minimal data fetching.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface KPIStats {
    todayOrders: number;
    pendingOrders: number;
    ordersToShip: number;
    returnsPending: number;
    refundsPending: number;
    shipmentsInTransit: number;
    failedDeliveries: number;
    lowStockProducts: number;
    // Revenue
    todayRevenue: number;
    monthlyRevenue: number;
    // Trends
    yesterdayOrders: number;
    yesterdayRevenue: number;
}

export interface ActionRequired {
    ordersAwaitingConfirmation: number;
    returnsAwaitingApproval: number;
    refundsAwaitingApproval: number;
    shipmentsReadyToShip: number;
    failedShipments: number;
    lowStockItems: number;
}

export interface ActivityEvent {
    id: string;
    type: string;
    title: string;
    description: string;
    resourceType?: string;
    resourceId?: string;
    actionUrl?: string;
    createdAt: Date;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    icon: string;
}

// ─── Dashboard Stats Service ────────────────────────────────────────────────

export const DashboardStats = {
    /**
     * Get all KPI metrics for dashboard cards
     */
    getKPIs: async (): Promise<KPIStats> => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const yesterdayStart = new Date();
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        yesterdayStart.setHours(0, 0, 0, 0);

        const yesterdayEnd = new Date();
        yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
        yesterdayEnd.setHours(23, 59, 59, 999);

        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const [
            todayOrders,
            todayRevenueAgg,
            yesterdayOrders,
            yesterdayRevenueAgg,
            monthlyRevenueAgg,
            pendingOrders,
            ordersToShip,
            returnsPending,
            refundsPending,
            shipmentsInTransit,
            failedDeliveries,
            lowStockProducts,
        ] = await Promise.all([
            // Today's orders
            prisma.order.count({
                where: { createdAt: { gte: todayStart } },
            }),
            // Today's revenue
            prisma.order.aggregate({
                where: { createdAt: { gte: todayStart } },
                _sum: { total: true },
            }),
            // Yesterday's orders (for trend)
            prisma.order.count({
                where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
            }),
            // Yesterday's revenue (for trend)
            prisma.order.aggregate({
                where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
                _sum: { total: true },
            }),
            // Monthly revenue
            prisma.order.aggregate({
                where: { createdAt: { gte: monthStart } },
                _sum: { total: true },
            }),
            // Pending orders
            prisma.order.count({
                where: { status: 'PENDING' },
            }),
            // Orders to ship (confirmed but no shipment)
            prisma.order.count({
                where: {
                    status: { in: ['CONFIRMED', 'PACKED'] },
                },
            }),
            // Returns awaiting approval
            prisma.returnRequest.count({
                where: { status: 'REQUESTED' },
            }),
            // Refunds pending
            prisma.refund.count({
                where: { status: { in: ['PENDING', 'APPROVED'] } },
            }),
            // Shipments in transit
            prisma.shipment.count({
                where: { status: 'IN_TRANSIT' },
            }),
            // Failed deliveries
            prisma.shipment.count({
                where: { status: 'FAILED' },
            }),
            // Low stock products (< 10 units)
            prisma.product.count({
                where: { stock: { lt: 10 }, status: 'PUBLISHED' },
            }),
        ]);

        return {
            todayOrders,
            todayRevenue: Number(todayRevenueAgg._sum.total || 0),
            yesterdayOrders,
            yesterdayRevenue: Number(yesterdayRevenueAgg._sum.total || 0),
            monthlyRevenue: Number(monthlyRevenueAgg._sum.total || 0),
            pendingOrders,
            ordersToShip,
            returnsPending,
            refundsPending,
            shipmentsInTransit,
            failedDeliveries,
            lowStockProducts,
        };
    },

    /**
     * Get action required items for admin
     */
    getActionRequired: async (): Promise<ActionRequired> => {
        const [
            ordersAwaitingConfirmation,
            returnsAwaitingApproval,
            refundsAwaitingApproval,
            shipmentsReadyToShip,
            failedShipments,
            lowStockItems,
        ] = await Promise.all([
            prisma.order.count({ where: { status: 'PENDING' } }),
            prisma.returnRequest.count({ where: { status: 'REQUESTED' } }),
            prisma.refund.count({ where: { status: 'PENDING' } }),
            prisma.shipment.count({ where: { status: 'READY_TO_SHIP' } }),
            prisma.shipment.count({ where: { status: 'FAILED' } }),
            prisma.product.count({ where: { stock: { lt: 5 }, status: 'PUBLISHED' } }),
        ]);

        return {
            ordersAwaitingConfirmation,
            returnsAwaitingApproval,
            refundsAwaitingApproval,
            shipmentsReadyToShip,
            failedShipments,
            lowStockItems,
        };
    },

    /**
     * Get recent activity feed from notifications and activity logs
     */
    getActivityFeed: async (limit: number = 20): Promise<ActivityEvent[]> => {
        // Pull from recent notifications to build the feed
        const notifications = await prisma.notification.findMany({
            where: { role: 'ADMIN' },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
                id: true,
                type: true,
                title: true,
                message: true,
                priority: true,
                resourceType: true,
                resourceId: true,
                actionUrl: true,
                createdAt: true,
            },
        });

        return notifications.map((n) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            description: n.message,
            resourceType: n.resourceType || undefined,
            resourceId: n.resourceId || undefined,
            actionUrl: n.actionUrl || undefined,
            createdAt: n.createdAt,
            priority: n.priority.toLowerCase() as 'low' | 'normal' | 'high' | 'urgent',
            icon: getEventIcon(n.type),
        }));
    },

    /**
     * Get system alerts
     */
    getSystemAlerts: async () => {
        return prisma.systemAlert.findMany({
            where: { isResolved: false },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
    },

    /**
     * Resolve a system alert
     */
    resolveSystemAlert: async (id: string, resolvedBy: string) => {
        return prisma.systemAlert.update({
            where: { id },
            data: { isResolved: true, resolvedAt: new Date(), resolvedBy },
        });
    },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getEventIcon(type: string): string {
    const icons: Record<string, string> = {
        NEW_ORDER: '🛒',
        ORDER_CONFIRMED: '✅',
        ORDER_CANCELLED: '❌',
        PAYMENT_RECEIVED: '💰',
        PAYMENT_FAILED: '⚠️',
        SHIPMENT_CREATED: '📦',
        SHIPMENT_PICKUP_SCHEDULED: '🚛',
        OUT_FOR_DELIVERY: '🚚',
        DELIVERED: '✅',
        DELIVERY_FAILED: '🚨',
        RTO_INITIATED: '🔄',
        RETURN_REQUEST: '↩️',
        RETURN_APPROVED: '✅',
        RETURN_REJECTED: '❌',
        REFUND_INITIATED: '💸',
        REFUND_COMPLETED: '✅',
        LOW_STOCK_ALERT: '📉',
        OUT_OF_STOCK: '🚫',
        SYSTEM_ALERT: '⚠️',
        NEW_USER_SIGNUP: '👤',
        COURIER_EXCEPTION: '⚡',
    };
    return icons[type] || '📌';
}
