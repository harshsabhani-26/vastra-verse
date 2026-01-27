"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Users, Ticket } from "lucide-react";

interface CouponStatsProps {
    stats: {
        totalCoupons: number;
        activeCoupons: number;
        totalUsages: number;
        totalRevenue: string;
        totalDiscount: string;
    };
}

export function CouponStats({ stats }: CouponStatsProps) {
    const statCards = [
        {
            title: "Total Coupons",
            value: stats.totalCoupons,
            icon: Ticket,
            description: `${stats.activeCoupons} active`,
        },
        {
            title: "Total Uses",
            value: stats.totalUsages,
            icon: Users,
            description: "Across all coupons",
        },
        {
            title: "Revenue Generated",
            value: `₹${parseFloat(stats.totalRevenue).toLocaleString()}`,
            icon: TrendingUp,
            description: "With coupons",
        },
        {
            title: "Total Discounts",
            value: `₹${parseFloat(stats.totalDiscount).toLocaleString()}`,
            icon: DollarSign,
            description: "Given to customers",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
                <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground">{stat.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
