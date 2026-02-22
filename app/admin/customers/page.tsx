import prisma from '@/lib/prisma';
import CustomersListClient from '@/components/admin/CustomersListClient';

export default async function AdminCustomersPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const search = (params.search as string) || '';
    const vipOnly = params.vipOnly === 'true';
    const blockedOnly = params.blockedOnly === 'true';
    const minOrders = parseInt((params.minOrders as string) || '0');
    const minSpent = parseFloat((params.minSpent as string) || '0');
    const page = parseInt((params.page as string) || '1');
    const limit = 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { role: 'USER' };

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

    // Fetch customers with aggregated order statistics (not full orders)
    const [users, total] = await Promise.all([
        prisma.user.findMany({
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
                _count: {
                    select: {
                        orders: true,
                        addresses: true,
                    }
                },
                orders: {
                    select: {
                        total: true,
                        createdAt: true,
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1 // Only get last order for date
                }
            },
            orderBy: {
                createdAt: 'desc',
            },
            skip,
            take: limit,
        }),
        prisma.user.count({ where })
    ]);

    // Get total spent for each user (separate query for performance)
    const userIds = users.map(u => u.id);
    const orderAggregates = await prisma.order.groupBy({
        by: ['userId'],
        where: {
            userId: { in: userIds }
        },
        _sum: {
            total: true
        }
    });

    // Map order aggregates by userId
    const orderTotalsByUser = new Map(
        orderAggregates.map(agg => [agg.userId, Number(agg._sum.total || 0)])
    );

    // Calculate statistics and filter by minOrders and minSpent
    const customers = users
        .map((customer) => {
            const orderCount = customer._count.orders;
            const totalSpent = orderTotalsByUser.get(customer.id) || 0;
            const lastOrder = customer.orders[0]?.createdAt || null;

            return {
                id: customer.id,
                name: customer.name || 'Guest',
                email: customer.email,
                phone: customer.phone || 'N/A',
                phoneVerified: customer.phoneVerified,
                isVIP: customer.isVIP,
                isBlocked: customer.isBlocked,
                blockedReason: customer.blockedReason,
                blockedAt: customer.blockedAt,
                createdAt: customer.createdAt,
                orderCount,
                totalSpent,
                lastOrder: lastOrder ? lastOrder.toISOString() : null,
                addressCount: customer._count.addresses,
            };
        })
        .filter(
            (customer) =>
                customer.orderCount >= minOrders && customer.totalSpent >= minSpent
        );

    const pagination = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917]">Customers</h1>
            <CustomersListClient customers={customers} pagination={pagination} />
        </div>
    );
}
