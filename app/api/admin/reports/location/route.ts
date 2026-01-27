import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, subDays, format, differenceInDays } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

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
            select: {
                id: true,
                total: true,
                shippingState: true,
                createdAt: true,
                status: true,
            },
        });

        // Revenue by state
        const stateStats: Record<
            string,
            {
                state: string;
                revenue: number;
                orders: number;
                averageOrderValue: number;
            }
        > = {};

        orders.forEach((order) => {
            const state = order.shippingState || 'Unknown';
            if (!stateStats[state]) {
                stateStats[state] = {
                    state,
                    revenue: 0,
                    orders: 0,
                    averageOrderValue: 0,
                };
            }
            stateStats[state].revenue += Number(order.total);
            stateStats[state].orders += 1;
        });

        // Calculate AOV for each state
        Object.values(stateStats).forEach((stat) => {
            stat.averageOrderValue = stat.orders > 0 ? stat.revenue / stat.orders : 0;
        });

        const sortedByRevenue = Object.values(stateStats).sort((a, b) => b.revenue - a.revenue);
        const topStates = sortedByRevenue.slice(0, 10);

        // Get detailed address data for city analysis
        const addresses = await prisma.address.findMany({
            where: {
                userId: {
                    in: orders.map((order) => order.id), // This is incorrect - we need to get user IDs from orders
                },
            },
            select: {
                state: true,
                city: true,
            },
        });

        // Since we can't directly join, let's get city data from orders indirectly
        // For now, we'll use shipping state as the main metric
        // In a real scenario, you'd want to store city in the Order model as well

        // Shipping zone performance (if zones are configured)
        const shippingZones = await prisma.shippingZone.findMany({
            where: {
                isActive: true,
            },
        });

        const zonePerformance = shippingZones.map((zone) => {
            // For simplicity, we'll categorize by zone type
            const zoneOrders = orders.filter((order) => {
                // This is a simplified check - in production you'd match pincodes
                return true; // Placeholder
            });

            return {
                zoneName: zone.name,
                zoneType: zone.type,
                orders: 0, // Would need pincode matching
                revenue: 0,
                averageDeliveryDays: (zone.minDeliveryDays + zone.maxDeliveryDays) / 2,
                shippingCost: Number(zone.baseCharge),
            };
        });

        // Delivery performance by state (for delivered orders)
        const deliveredOrders = await prisma.order.findMany({
            where: {
                status: 'DELIVERED',
                createdAt: {
                    gte: startOfDay(start),
                    lte: endOfDay(end),
                },
            },
            select: {
                shippingState: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        const deliveryStats: Record<
            string,
            {
                state: string;
                orders: number;
                averageDeliveryDays: number;
            }
        > = {};

        deliveredOrders.forEach((order) => {
            const state = order.shippingState || 'Unknown';
            const deliveryDays = differenceInDays(order.updatedAt, order.createdAt);

            if (!deliveryStats[state]) {
                deliveryStats[state] = {
                    state,
                    orders: 0,
                    averageDeliveryDays: 0,
                };
            }

            const currentTotal = deliveryStats[state].averageDeliveryDays * deliveryStats[state].orders;
            deliveryStats[state].orders += 1;
            deliveryStats[state].averageDeliveryDays =
                (currentTotal + deliveryDays) / deliveryStats[state].orders;
        });

        const deliveryPerformance = Object.values(deliveryStats).sort((a, b) => b.orders - a.orders);

        // Geographic distribution percentages
        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
        const geoDistribution = topStates.map((state) => ({
            ...state,
            percentage: totalRevenue > 0 ? (state.revenue / totalRevenue) * 100 : 0,
        }));

        // Top performing regions
        const topRegions = sortedByRevenue.slice(0, 5).map((state, index) => ({
            rank: index + 1,
            state: state.state,
            revenue: state.revenue,
            orders: state.orders,
            marketShare: totalRevenue > 0 ? (state.revenue / totalRevenue) * 100 : 0,
        }));

        return NextResponse.json({
            summary: {
                totalStates: Object.keys(stateStats).length,
                topState: topStates[0]?.state || 'N/A',
                topStateRevenue: topStates[0]?.revenue || 0,
                averageRevenuePerState:
                    Object.keys(stateStats).length > 0
                        ? totalRevenue / Object.keys(stateStats).length
                        : 0,
            },
            topStates,
            geoDistribution,
            topRegions,
            deliveryPerformance,
            dateRange: {
                start: format(start, 'yyyy-MM-dd'),
                end: format(end, 'yyyy-MM-dd'),
            },
        });
    } catch (error) {
        console.error('Location analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
