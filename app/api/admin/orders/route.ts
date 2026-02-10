import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

/**
 * ADMIN ORDERS API - Get all orders with pagination
 * 
 * CRITICAL FIX: Now filters by paymentStatus="PAID" by default
 * This ensures only successfully paid orders appear in the admin panel.
 * Failed or cancelled prepaid payments (which never create Order records now)
 * won't appear here at all.
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const cursor = searchParams.get('cursor');
        const status = searchParams.get('status');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const where: any = {
            // CRITICAL: Only show PAID orders by default
            // This prevents showing orphaned PENDING orders from old flow
            paymentStatus: "PAID"
        };

        // Allow filtering by order status (PENDING, CONFIRMED, SHIPPED, etc.)
        if (status && status !== "all") {
            where.status = status;
        }

        // Date range filtering
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }

        const pageSize = 50;

        const orders = await prisma.order.findMany({
            where,
            take: pageSize + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                createdAt: true,
                total: true,
                status: true,
                paymentStatus: true,
                paymentMethod: true,
                customerName: true,
                customerPhone: true,
                shippingAddress: true,
                items: {
                    select: {
                        quantity: true,
                        product: {
                            select: {
                                name: true,
                            }
                        }
                    }
                },
                user: {
                    select: {
                        name: true,
                        email: true,
                    }
                }
            }
        });

        const hasNextPage = orders.length > pageSize;
        const ordersToReturn = hasNextPage ? orders.slice(0, -1) : orders;
        const nextCursor = hasNextPage ? ordersToReturn[ordersToReturn.length - 1].id : null;

        return NextResponse.json({
            orders: ordersToReturn,
            nextCursor,
            hasNextPage
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
