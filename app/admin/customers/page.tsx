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

    // Fetch customers with order statistics
    const users = await prisma.user.findMany({
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
    const customers = users
        .map((customer) => {
            const orderCount = customer.orders.length;
            const totalSpent = customer.orders.reduce(
                (sum, order) => sum + Number(order.total),
                0
            );
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
                addressCount: customer.addresses.length,
            };
        })
        .filter(
            (customer) =>
                customer.orderCount >= minOrders && customer.totalSpent >= minSpent
        );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-serif text-[#1C1917]">Customers</h1>
            <CustomersListClient customers={customers} />
        </div>
    );
}
