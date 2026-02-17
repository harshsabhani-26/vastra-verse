import { NextRequest, NextResponse } from 'next/server';
import { checkUserRateLimit } from '@/lib/rate-limit';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, subDays, subMonths, format, differenceInDays, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        // SECURITY: Rate limiting (30 req/min for admin)
        const rateLimitResult = await checkUserRateLimit(request, 'admin');
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult;
        }

        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Default to last 6 months for better retention analysis
        const start = startDate ? new Date(startDate) : subMonths(new Date(), 6);
        const end = endDate ? new Date(endDate) : new Date();

        // Get all users with their orders
        const users = await prisma.user.findMany({
            include: {
                orders: {
                    where: {
                        status: {
                            not: 'CANCELLED',
                        },
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                    select: {
                        id: true,
                        total: true,
                        createdAt: true,
                    },
                },
            },
        });

        // Calculate customer metrics
        const customersWithOrders = users.filter((user) => user.orders.length > 0);
        const newCustomers = customersWithOrders.filter((user) => {
            const firstOrder = user.orders[0];
            return firstOrder.createdAt >= start && firstOrder.createdAt <= end;
        });

        const returningCustomers = customersWithOrders.filter((user) => {
            const ordersInPeriod = user.orders.filter(
                (order) => order.createdAt >= start && order.createdAt <= end
            );
            return ordersInPeriod.length > 0 && user.orders[0].createdAt < start;
        });

        // Customer Lifetime Value (CLV)
        const clvData = customersWithOrders.map((user) => {
            const totalSpent = user.orders.reduce((sum, order) => sum + Number(order.total), 0);
            const orderCount = user.orders.length;
            const firstOrderDate = user.orders[0]?.createdAt;
            const lastOrderDate = user.orders[user.orders.length - 1]?.createdAt;
            const daysSinceFirstOrder = firstOrderDate
                ? differenceInDays(new Date(), firstOrderDate)
                : 0;
            const averageOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;

            return {
                userId: user.id,
                name: user.name,
                email: user.email,
                totalSpent,
                orderCount,
                averageOrderValue,
                firstOrderDate,
                lastOrderDate,
                daysSinceFirstOrder,
                lifetimeValue: totalSpent,
                isVIP: user.isVIP,
            };
        });

        const sortedByLTV = [...clvData].sort((a, b) => b.lifetimeValue - a.lifetimeValue);
        const topCustomers = sortedByLTV.slice(0, 20);

        // Repeat purchase rate
        const customersWithMultipleOrders = customersWithOrders.filter(
            (user) => user.orders.length > 1
        );
        const repeatPurchaseRate =
            customersWithOrders.length > 0
                ? (customersWithMultipleOrders.length / customersWithOrders.length) * 100
                : 0;

        // Average time between orders
        let totalDaysBetweenOrders = 0;
        let orderPairs = 0;

        customersWithOrders.forEach((user) => {
            for (let i = 1; i < user.orders.length; i++) {
                const daysBetween = differenceInDays(
                    user.orders[i].createdAt,
                    user.orders[i - 1].createdAt
                );
                totalDaysBetweenOrders += daysBetween;
                orderPairs++;
            }
        });

        const averageTimeBetweenOrders = orderPairs > 0 ? totalDaysBetweenOrders / orderPairs : 0;

        // Cohort analysis (by signup month)
        const months = eachMonthOfInterval({
            start: subMonths(new Date(), 12),
            end: new Date()
        });

        const cohortAnalysis = months.map((month) => {
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);

            const cohortUsers = users.filter(
                user => user.createdAt >= monthStart && user.createdAt <= monthEnd
            );

            const cohortSize = cohortUsers.length;

            const usersWithOrdersInPeriod = cohortUsers.filter((user) => {
                return user.orders.some(
                    order => order.createdAt >= start && order.createdAt <= end
                );
            });

            const retentionRate = cohortSize > 0
                ? (usersWithOrdersInPeriod.length / cohortSize) * 100
                : 0;

            const cohortRevenue = cohortUsers.reduce((sum, user) => {
                const revenue = user.orders
                    .filter(order => order.createdAt >= start && order.createdAt <= end)
                    .reduce((s, order) => s + Number(order.total), 0);
                return sum + revenue;
            }, 0);

            return {
                cohort: format(month, 'MMM yyyy'),
                cohortSize,
                activeCustomers: usersWithOrdersInPeriod.length,
                retentionRate,
                revenue: cohortRevenue,
            };
        });

        // Customer retention rate over time
        const retentionByMonth = months.map((month) => {
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);

            const activeInMonth = customersWithOrders.filter((user) =>
                user.orders.some(
                    (order) => order.createdAt >= monthStart && order.createdAt <= monthEnd
                )
            );

            const previousMonthStart = startOfMonth(subMonths(month, 1));
            const previousMonthEnd = endOfMonth(subMonths(month, 1));

            const activeInPreviousMonth = customersWithOrders.filter((user) =>
                user.orders.some(
                    (order) => order.createdAt >= previousMonthStart && order.createdAt <= previousMonthEnd
                )
            );

            const retained = activeInMonth.filter((user) =>
                activeInPreviousMonth.some((prevUser) => prevUser.id === user.id)
            );

            const retentionRate =
                activeInPreviousMonth.length > 0
                    ? (retained.length / activeInPreviousMonth.length) * 100
                    : 0;

            return {
                month: format(month, 'MMM yyyy'),
                activeCustomers: activeInMonth.length,
                retainedCustomers: retained.length,
                retentionRate,
            };
        });

        // VIP customer statistics
        const vipCustomers = customersWithOrders.filter((user) => user.isVIP);
        const vipRevenue = vipCustomers.reduce((sum, user) => {
            return (
                sum +
                user.orders.reduce((s, order) => s + Number(order.total), 0)
            );
        }, 0);

        // Customer value segments
        const avgCLV =
            clvData.length > 0
                ? clvData.reduce((sum, c) => sum + c.lifetimeValue, 0) / clvData.length
                : 0;

        const segments = {
            high: clvData.filter((c) => c.lifetimeValue > avgCLV * 2).length,
            medium: clvData.filter(
                (c) => c.lifetimeValue > avgCLV && c.lifetimeValue <= avgCLV * 2
            ).length,
            low: clvData.filter((c) => c.lifetimeValue <= avgCLV).length,
        };

        return NextResponse.json({
            summary: {
                totalCustomers: customersWithOrders.length,
                newCustomers: newCustomers.length,
                returningCustomers: returningCustomers.length,
                repeatPurchaseRate,
                averageTimeBetweenOrders,
                averageCLV: avgCLV,
                vipCustomers: vipCustomers.length,
                vipRevenue,
            },
            topCustomers,
            cohortAnalysis: cohortAnalysis.filter(c => c.cohortSize > 0),
            retentionByMonth,
            customerSegments: segments,
            dateRange: {
                start: format(start, 'yyyy-MM-dd'),
                end: format(end, 'yyyy-MM-dd'),
            },
        });
    } catch (error) {
        console.error('Customer retention analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
