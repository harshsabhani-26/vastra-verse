import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval } from 'date-fns';

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

        // Get all coupon usages in the date range
        const couponUsages = await prisma.couponUsage.findMany({
            where: {
                createdAt: {
                    gte: startOfDay(start),
                    lte: endOfDay(end),
                },
            },
            include: {
                coupon: true,
                order: {
                    select: {
                        total: true,
                        subtotal: true,
                        status: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        createdAt: true,
                        orders: {
                            select: {
                                id: true,
                            },
                        },
                    },
                },
            },
        });

        // Calculate totals
        const totalDiscountGiven = couponUsages.reduce(
            (sum, usage) => sum + Number(usage.discountAmount),
            0
        );

        const totalRevenueWithCoupons = couponUsages.reduce((sum, usage) => {
            if (usage.order && usage.order.status !== 'CANCELLED') {
                return sum + Number(usage.order.total);
            }
            return sum;
        }, 0);

        const totalOrdersWithCoupons = couponUsages.filter(
            usage => usage.order && usage.order.status !== 'CANCELLED'
        ).length;

        // Calculate ROI: (Revenue Generated - Discount Cost) / Discount Cost * 100
        const roi = totalDiscountGiven > 0
            ? ((totalRevenueWithCoupons - totalDiscountGiven) / totalDiscountGiven) * 100
            : 0;

        // Performance by coupon
        const couponPerformance: Record<
            string,
            {
                couponId: string;
                code: string;
                type: string;
                usageCount: number;
                totalDiscount: number;
                totalRevenue: number;
                roi: number;
                averageOrderValue: number;
            }
        > = {};

        couponUsages.forEach((usage) => {
            const key = usage.couponId;
            if (!couponPerformance[key]) {
                couponPerformance[key] = {
                    couponId: usage.coupon.id,
                    code: usage.coupon.code,
                    type: usage.coupon.type,
                    usageCount: 0,
                    totalDiscount: 0,
                    totalRevenue: 0,
                    roi: 0,
                    averageOrderValue: 0,
                };
            }

            couponPerformance[key].usageCount += 1;
            couponPerformance[key].totalDiscount += Number(usage.discountAmount);

            if (usage.order && usage.order.status !== 'CANCELLED') {
                couponPerformance[key].totalRevenue += Number(usage.order.total);
            }
        });

        // Calculate ROI and AOV for each coupon
        Object.values(couponPerformance).forEach((perf) => {
            perf.roi =
                perf.totalDiscount > 0
                    ? ((perf.totalRevenue - perf.totalDiscount) / perf.totalDiscount) * 100
                    : 0;
            perf.averageOrderValue = perf.usageCount > 0 ? perf.totalRevenue / perf.usageCount : 0;
        });

        const sortedCoupons = Object.values(couponPerformance).sort((a, b) => b.roi - a.roi);
        const mostEffective = sortedCoupons.slice(0, 10);
        const leastEffective = [...sortedCoupons].reverse().slice(0, 10);

        // Usage trends over time
        const days = eachDayOfInterval({ start, end });
        const usageTrends = days.map((day) => {
            const dayStart = startOfDay(day);
            const dayEnd = endOfDay(day);
            const dayUsages = couponUsages.filter(
                (usage) => usage.createdAt >= dayStart && usage.createdAt <= dayEnd
            );

            return {
                date: format(day, 'MMM dd'),
                usageCount: dayUsages.length,
                discount: dayUsages.reduce((sum, u) => sum + Number(u.discountAmount), 0),
                revenue: dayUsages.reduce((sum, u) =>
                    u.order && u.order.status !== 'CANCELLED' ? sum + Number(u.order.total) : sum, 0
                ),
            };
        });

        // First-time vs repeat customer usage
        let firstTimeUsage = 0;
        let repeatCustomerUsage = 0;

        couponUsages.forEach((usage) => {
            const isFirstTime = usage.user.orders.length <= 1;
            if (isFirstTime) {
                firstTimeUsage += 1;
            } else {
                repeatCustomerUsage += 1;
            }
        });

        // Auto-apply effectiveness
        const autoApplyCoupons = await prisma.coupon.findMany({
            where: {
                autoApply: true,
                isActive: true,
            },
        });

        const autoApplyStats = autoApplyCoupons.map((coupon) => {
            const usages = couponUsages.filter((u) => u.couponId === coupon.id);
            const revenue = usages.reduce((sum, u) =>
                u.order && u.order.status !== 'CANCELLED' ? sum + Number(u.order.total) : sum, 0
            );
            const discount = usages.reduce((sum, u) => sum + Number(u.discountAmount), 0);

            return {
                code: coupon.code,
                usageCount: usages.length,
                revenue,
                discount,
                priority: coupon.priority,
            };
        });

        const sortedAutoApply = autoApplyStats.sort((a, b) => b.revenue - a.revenue);

        // Coupon type breakdown
        const typeBreakdown: Record<string, { count: number; revenue: number; discount: number }> = {
            PERCENTAGE: { count: 0, revenue: 0, discount: 0 },
            FLAT_AMOUNT: { count: 0, revenue: 0, discount: 0 },
            FREE_SHIPPING: { count: 0, revenue: 0, discount: 0 },
        };

        couponUsages.forEach((usage) => {
            const type = usage.coupon.type;
            typeBreakdown[type].count += 1;
            typeBreakdown[type].discount += Number(usage.discountAmount);
            if (usage.order && usage.order.status !== 'CANCELLED') {
                typeBreakdown[type].revenue += Number(usage.order.total);
            }
        });

        return NextResponse.json({
            summary: {
                totalDiscountGiven,
                totalRevenueWithCoupons,
                totalOrdersWithCoupons,
                roi,
                averageDiscountPerOrder:
                    totalOrdersWithCoupons > 0 ? totalDiscountGiven / totalOrdersWithCoupons : 0,
                averageOrderValue:
                    totalOrdersWithCoupons > 0 ? totalRevenueWithCoupons / totalOrdersWithCoupons : 0,
            },
            mostEffective,
            leastEffective,
            usageTrends,
            customerTypeBreakdown: {
                firstTime: firstTimeUsage,
                repeat: repeatCustomerUsage,
            },
            autoApplyEffectiveness: sortedAutoApply,
            typeBreakdown,
            dateRange: {
                start: format(start, 'yyyy-MM-dd'),
                end: format(end, 'yyyy-MM-dd'),
            },
        });
    } catch (error) {
        console.error('Coupon analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
