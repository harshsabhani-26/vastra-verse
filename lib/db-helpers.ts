/**
 * Optimized Database Query Helpers
 * 
 * Pre-built queries with proper `select`/`include` to prevent N+1 issues.
 * Use these instead of raw Prisma calls in complex views like admin dashboard.
 */

import prisma from '@/lib/prisma';

// ============================================================
// Admin Order Queries (prevents N+1 on user/items/payments)
// ============================================================

/**
 * Fetch paginated orders for admin listing.
 * Single query with all related data — no N+1.
 */
export async function getAdminOrders(options: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
} = {}) {
    const { page = 1, limit = 20, status, search } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (search) {
        where.OR = [
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
        ];
    }

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            select: {
                id: true,
                status: true,
                total: true,
                createdAt: true,
                paymentMethod: true,
                paymentStatus: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                items: {
                    select: {
                        id: true,
                        quantity: true,
                        price: true,
                        product: {
                            select: {
                                id: true,
                                name: true,
                                images: {
                                    where: { type: 'MAIN' },
                                    take: 1,
                                    select: { url: true },
                                },
                            },
                        },
                    },
                },
                payments: {
                    select: {
                        id: true,
                        status: true,
                        method: true,
                        amount: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma.order.count({ where }),
    ]);

    return {
        orders,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: page * limit < total,
        },
    };
}

/**
 * Fetch a single order with full details for admin view.
 * Includes user, items with products, payments, shipments, refunds.
 */
export async function getAdminOrderDetail(orderId: string) {
    return prisma.order.findUnique({
        where: { id: orderId },
        select: {
            id: true,
            status: true,
            total: true,
            subtotal: true,
            shippingCharges: true,
            discount: true,
            couponUsages: true,
            paymentMethod: true,
            paymentStatus: true,
            shippingAddress: true,
            customerName: true,
            customerPhone: true,
            createdAt: true,
            updatedAt: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            items: {
                select: {
                    id: true,
                    quantity: true,
                    price: true,
                    product: {
                        select: {
                            id: true,
                            name: true,
                            sku: true,
                            images: {
                                where: { type: 'MAIN' },
                                take: 1,
                                select: { url: true, alt: true },
                            },
                        },
                    },
                },
            },
            payments: {
                select: {
                    id: true,
                    status: true,
                    method: true,
                    amount: true,
                    gatewayPaymentId: true,
                    gatewayOrderId: true,
                },
            },
            shipments: {
                select: {
                    id: true,
                    status: true,
                    trackingUrl: true,
                    courierName: true,
                    awbNumber: true,
                    estimatedDeliveryAt: true,
                    shippedAt: true,
                    deliveredAt: true,
                },
            },
            refunds: {
                select: {
                    id: true,
                    status: true,
                    amount: true,
                    reason: true,
                    createdAt: true,
                },
            },
        },
    });
}

// ============================================================
// Admin Dashboard Stats (aggregated in parallel)
// ============================================================

/**
 * Fetch dashboard overview stats in a single parallel call.
 * Prevents sequential N+1 query chains.
 */
export async function getAdminDashboardStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
        totalOrders,
        recentOrders,
        pendingOrders,
        totalProducts,
        lowStockProducts,
        totalCustomers,
        newCustomers,
    ] = await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.order.count({ where: { status: { in: ['PENDING', 'CONFIRMED'] } } }),
        prisma.product.count(),
        prisma.product.count({ where: { stock: { lte: 10 } } }),
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    ]);

    return {
        orders: { total: totalOrders, recent: recentOrders, pending: pendingOrders },
        products: { total: totalProducts, lowStock: lowStockProducts },
        customers: { total: totalCustomers, newThisWeek: newCustomers },
    };
}

// ============================================================
// Product Detail with Relations
// ============================================================

/**
 * Fetch product detail with all related data for display.
 * Includes category, images — single query.
 */
export async function getProductDetail(productId: string) {
    return prisma.product.findUnique({
        where: { id: productId },
        select: {
            id: true,
            name: true,
            description: true,
            shortDescription: true,
            price: true,
            finalPrice: true,
            discount: true,
            discountType: true,
            stock: true,
            sku: true,
            fabricType: true,
            weaveType: true,
            careInstructions: true,
            colors: true,
            occasions: true,
            isNewArrival: true,
            isBestSeller: true,
            isFeatured: true,
            status: true,
            category: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
            images: {
                orderBy: { position: 'asc' },
                select: {
                    id: true,
                    url: true,
                    alt: true,
                    type: true,
                    position: true,
                },
            },
        },
    });
}
