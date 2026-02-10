import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { requireAdmin, unauthorizedResponse } from '@/lib/auth-utils';
import { safeInt } from '@/lib/api-utils';
import { logAdminFetch } from '@/lib/logger';

// GET /api/admin/customers - List customers with filtering
export async function GET(request: NextRequest) {
    try {
        // Admin authentication check
        const adminCheck = await requireAdmin();
        if (!adminCheck.authorized) {
            return unauthorizedResponse(adminCheck.reason);
        }

        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search') || '';
        const vipOnly = searchParams.get('vipOnly') === 'true';
        const blockedOnly = searchParams.get('blockedOnly') === 'true';
        const minOrders = safeInt(searchParams.get('minOrders'), 0);
        const minSpent = safeInt(searchParams.get('minSpent'), 0);

        // Build where clause
        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (vipOnly) {
            where.isVIP = true;
        }

        if (blockedOnly) {
            where.isBlocked = true;
        }

        // Fetch customers with order statistics
        const customers = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                phoneVerified: true,
                isVIP: true,
                isBlocked: true,
                blockedReason: true,
                blockedAt: true,
                createdAt: true,
                orders: {
                    select: {
                        id: true,
                        total: true,
                        createdAt: true,
                        status: true,
                    },
                },
                addresses: {
                    select: {
                        id: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Calculate statistics and filter by minOrders and minSpent
        const customersWithStats = customers
            .map((customer) => {
                const orderCount = customer.orders.length;
                const totalSpent = customer.orders.reduce(
                    (sum, order) => sum + Number(order.total),
                    0
                );
                const lastOrder = customer.orders[0]?.createdAt || null;

                return {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone,
                    phoneVerified: customer.phoneVerified,
                    isVIP: customer.isVIP,
                    isBlocked: customer.isBlocked,
                    blockedReason: customer.blockedReason,
                    blockedAt: customer.blockedAt,
                    createdAt: customer.createdAt,
                    orderCount,
                    totalSpent,
                    lastOrder,
                    addressCount: customer.addresses.length,
                };
            })
            .filter(
                (customer) =>
                    customer.orderCount >= minOrders && customer.totalSpent >= minSpent
            );

        return NextResponse.json(customersWithStats);
    } catch (error) {
        logAdminFetch('CUSTOMERS_GET', error);
        return NextResponse.json(
            { error: 'Failed to fetch customers' },
            { status: 500 }
        );
    }
}
