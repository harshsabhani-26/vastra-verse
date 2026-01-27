"use server";

import prisma from "@/lib/prisma";

// Get overall coupon performance
export async function getCouponPerformance() {
    const [
        totalCoupons,
        activeCoupons,
        totalUsages,
        totalRevenue,
        totalDiscount,
    ] = await Promise.all([
        prisma.coupon.count(),
        prisma.coupon.count({ where: { isActive: true } }),
        prisma.couponUsage.count(),
        prisma.coupon.aggregate({
            _sum: { totalRevenue: true },
        }),
        prisma.coupon.aggregate({
            _sum: { totalDiscount: true },
        }),
    ]);

    return {
        totalCoupons,
        activeCoupons,
        totalUsages,
        totalRevenue: totalRevenue._sum.totalRevenue?.toString() || "0",
        totalDiscount: totalDiscount._sum.totalDiscount?.toString() || "0",
    };
}

// Get top performing coupons
export async function getTopCoupons(limit: number = 10) {
    const coupons = await prisma.coupon.findMany({
        orderBy: [
            { currentUses: "desc" },
            { totalRevenue: "desc" },
        ],
        take: limit,
        include: {
            _count: {
                select: { usages: true },
            },
        },
    });

    return coupons.map((coupon) => ({
        ...coupon,
        value: coupon.value.toString(),
        minOrderValue: coupon.minOrderValue?.toString(),
        totalRevenue: coupon.totalRevenue.toString(),
        totalDiscount: coupon.totalDiscount.toString(),
    }));
}

// Get coupon usage timeline
export async function getCouponUsageTimeline(
    couponId: string,
    days: number = 30
) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const usages = await prisma.couponUsage.findMany({
        where: {
            couponId,
            createdAt: {
                gte: startDate,
            },
        },
        orderBy: {
            createdAt: "asc",
        },
    });

    // Group by date
    const timeline: Record<string, { count: number; discount: number }> = {};

    usages.forEach((usage) => {
        const date = usage.createdAt.toISOString().split("T")[0];
        if (!timeline[date]) {
            timeline[date] = { count: 0, discount: 0 };
        }
        timeline[date].count++;
        timeline[date].discount += parseFloat(usage.discountAmount.toString());
    });

    // Convert to array
    return Object.entries(timeline).map(([date, data]) => ({
        date,
        count: data.count,
        discount: data.discount,
    }));
}

// Get usage by coupon type
export async function getCouponTypeBreakdown() {
    const types = await prisma.coupon.groupBy({
        by: ["type"],
        _count: {
            _all: true,
        },
        _sum: {
            currentUses: true,
            totalRevenue: true,
            totalDiscount: true,
        },
    });

    return types.map((type) => ({
        type: type.type,
        count: type._count._all,
        uses: type._sum.currentUses || 0,
        revenue: type._sum.totalRevenue?.toString() || "0",
        discount: type._sum.totalDiscount?.toString() || "0",
    }));
}

// Export coupon report
export async function exportCouponReport(filters?: {
    startDate?: Date;
    endDate?: Date;
    type?: string;
    isActive?: boolean;
}) {
    const where: any = {};

    if (filters?.type) {
        where.type = filters.type;
    }

    if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
    }

    if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
            where.createdAt.gte = filters.startDate;
        }
        if (filters.endDate) {
            where.createdAt.lte = filters.endDate;
        }
    }

    const coupons = await prisma.coupon.findMany({
        where,
        include: {
            _count: {
                select: { usages: true },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    // Convert to CSV format
    const headers = [
        "Code",
        "Type",
        "Value",
        "Start Date",
        "End Date",
        "Active",
        "Total Uses",
        "Max Uses",
        "Revenue",
        "Discount Given",
        "Min Order Value",
        "Created",
    ];

    const rows = coupons.map((coupon) => [
        coupon.code,
        coupon.type,
        coupon.value.toString(),
        coupon.startDate.toISOString().split("T")[0],
        coupon.endDate.toISOString().split("T")[0],
        coupon.isActive ? "Yes" : "No",
        coupon.currentUses.toString(),
        coupon.maxUses?.toString() || "Unlimited",
        coupon.totalRevenue.toString(),
        coupon.totalDiscount.toString(),
        coupon.minOrderValue?.toString() || "None",
        coupon.createdAt.toISOString().split("T")[0],
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

    return {
        filename: `coupons-${new Date().toISOString().split("T")[0]}.csv`,
        data: csv,
    };
}

// Get revenue impact comparison
export async function getRevenueImpact(couponId: string) {
    const coupon = await prisma.coupon.findUnique({
        where: { id: couponId },
        include: {
            usages: {
                include: {
                    order: {
                        select: {
                            total: true,
                        },
                    },
                },
            },
        },
    });

    if (!coupon) {
        return null;
    }

    const ordersWithCoupon = coupon.usages.length;
    const totalRevenue = coupon.usages.reduce((sum, usage) => {
        return sum + (usage.order ? parseFloat(usage.order.total.toString()) : 0);
    }, 0);
    const totalDiscount = parseFloat(coupon.totalDiscount.toString());
    const averageOrderValue = ordersWithCoupon > 0 ? totalRevenue / ordersWithCoupon : 0;

    return {
        ordersWithCoupon,
        totalRevenue: totalRevenue.toString(),
        totalDiscount: totalDiscount.toString(),
        averageOrderValue: averageOrderValue.toString(),
        discountRate: totalRevenue > 0 ? ((totalDiscount / totalRevenue) * 100).toFixed(2) : "0",
    };
}
