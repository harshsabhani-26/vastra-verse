import { NextRequest, NextResponse } from 'next/server';
import { checkUserRateLimit } from '@/lib/rate-limit';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, subDays, subMonths, format, eachDayOfInterval, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns';

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
        const groupBy = searchParams.get('groupBy') || 'daily'; // daily, weekly, monthly

        // Default to last 30 days
        const start = startDate ? new Date(startDate) : subDays(new Date(), 30);
        const end = endDate ? new Date(endDate) : new Date();

        // Get all orders in the date range
        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: startOfDay(start),
                    lte: endOfDay(end),
                },
                status: {
                    not: 'CANCELLED',
                },
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        // Calculate total sales
        const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0);
        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

        // Get previous period for comparison
        const previousStart = startDate
            ? subDays(start, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
            : subDays(start, 30);
        const previousEnd = start;

        const previousOrders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: startOfDay(previousStart),
                    lte: endOfDay(previousEnd),
                },
                status: {
                    not: 'CANCELLED',
                },
            },
        });

        const previousTotalSales = previousOrders.reduce((sum, order) => sum + Number(order.total), 0);
        const previousTotalOrders = previousOrders.length;
        const previousAOV = previousTotalOrders > 0 ? previousTotalSales / previousTotalOrders : 0;

        // Calculate trends
        const salesTrend = previousTotalSales > 0 ? ((totalSales - previousTotalSales) / previousTotalSales) * 100 : 0;
        const ordersTrend = previousTotalOrders > 0 ? ((totalOrders - previousTotalOrders) / previousTotalOrders) * 100 : 0;
        const aovTrend = previousAOV > 0 ? ((averageOrderValue - previousAOV) / previousAOV) * 100 : 0;

        // Group sales by time period
        let timeSeries: Array<{ date: string; revenue: number; orders: number; aov: number }> = [];

        if (groupBy === 'monthly') {
            const months = eachMonthOfInterval({ start, end });
            timeSeries = months.map((month) => {
                const monthStart = startOfMonth(month);
                const monthEnd = endOfMonth(month);
                const monthOrders = orders.filter(
                    (order) => order.createdAt >= monthStart && order.createdAt <= monthEnd
                );
                const revenue = monthOrders.reduce((sum, order) => sum + Number(order.total), 0);
                const orderCount = monthOrders.length;
                return {
                    date: format(month, 'MMM yyyy'),
                    revenue,
                    orders: orderCount,
                    aov: orderCount > 0 ? revenue / orderCount : 0,
                };
            });
        } else {
            // Daily grouping
            const days = eachDayOfInterval({ start, end });
            timeSeries = days.map((day) => {
                const dayStart = startOfDay(day);
                const dayEnd = endOfDay(day);
                const dayOrders = orders.filter(
                    (order) => order.createdAt >= dayStart && order.createdAt <= dayEnd
                );
                const revenue = dayOrders.reduce((sum, order) => sum + Number(order.total), 0);
                const orderCount = dayOrders.length;
                return {
                    date: format(day, 'MMM dd'),
                    revenue,
                    orders: orderCount,
                    aov: orderCount > 0 ? revenue / orderCount : 0,
                };
            });
        }

        // Peak sales analysis (by hour)
        const salesByHour = Array(24).fill(0);
        const ordersByHour = Array(24).fill(0);
        orders.forEach((order) => {
            const hour = order.createdAt.getHours();
            salesByHour[hour] += Number(order.total);
            ordersByHour[hour] += 1;
        });

        const peakHours = salesByHour
            .map((sales, hour) => ({ hour, sales, orders: ordersByHour[hour] }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5);

        // Sales by day of week
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const salesByDay: Record<string, number> = {};
        const ordersByDay: Record<string, number> = {};
        dayNames.forEach((day) => {
            salesByDay[day] = 0;
            ordersByDay[day] = 0;
        });

        orders.forEach((order) => {
            const dayName = dayNames[order.createdAt.getDay()];
            salesByDay[dayName] += Number(order.total);
            ordersByDay[dayName] += 1;
        });

        const salesByDayArray = dayNames.map((day) => ({
            day,
            sales: salesByDay[day],
            orders: ordersByDay[day],
        }));

        // Sales velocity (orders per day)
        const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
        const salesVelocity = totalOrders / daysInPeriod;

        return NextResponse.json({
            summary: {
                totalSales,
                totalOrders,
                averageOrderValue,
                salesTrend,
                ordersTrend,
                aovTrend,
                salesVelocity,
            },
            timeSeries,
            peakHours,
            salesByDay: salesByDayArray,
            dateRange: {
                start: format(start, 'yyyy-MM-dd'),
                end: format(end, 'yyyy-MM-dd'),
            },
        });
    } catch (error) {
        console.error('Sales analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
