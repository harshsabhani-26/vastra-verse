"use client";

import { useState, useEffect } from "react";
import {
    getCouponPerformance,
    getTopCoupons,
    getCouponTypeBreakdown,
    exportCouponReport,
} from "../analytics-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, TrendingUp, Ticket, Users, DollarSign } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CouponAnalyticsPage() {
    const [stats, setStats] = useState<any>(null);
    const [topCoupons, setTopCoupons] = useState<any[]>([]);
    const [typeBreakdown, setTypeBreakdown] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [statsData, topData, typeData] = await Promise.all([
                    getCouponPerformance(),
                    getTopCoupons(10),
                    getCouponTypeBreakdown(),
                ]);
                setStats(statsData);
                setTopCoupons(topData);
                setTypeBreakdown(typeData);
            } catch (error) {
                toast.error("Failed to load analytics data");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const report = await exportCouponReport();
            const blob = new Blob([report.data], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = report.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success("Report exported successfully!");
        } catch (error) {
            toast.error("Failed to export report");
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/admin/coupons">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h2 className="text-3xl font-serif text-[#1C1917]">
                        Coupon Analytics
                    </h2>
                </div>
                <div>Loading analytics...</div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/admin/coupons">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-3xl font-serif text-[#1C1917]">
                            Coupon Analytics
                        </h2>
                        <p className="text-stone-600 mt-1">
                            Performance insights and usage statistics
                        </p>
                    </div>
                </div>
                <Button onClick={handleExport} disabled={isExporting}>
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? "Exporting..." : "Export Report"}
                </Button>
            </div>

            {/* Overview Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCoupons}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.activeCoupons} active
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Uses</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsages}</div>
                        <p className="text-xs text-muted-foreground">
                            Across all coupons
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₹{parseFloat(stats.totalRevenue).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            With coupons
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₹{parseFloat(stats.totalDiscount).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Given to customers
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Top Performing Coupons */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Performing Coupons</CardTitle>
                    <CardDescription>
                        Best coupons by usage and revenue
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {topCoupons.map((coupon, index) => (
                            <div
                                key={coupon.id}
                                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="text-sm font-bold">{index + 1}</span>
                                    </div>
                                    <div>
                                        <p className="font-mono font-bold">{coupon.code}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {coupon.type === "PERCENTAGE"
                                                ? `${coupon.value}% Off`
                                                : coupon.type === "FLAT_AMOUNT"
                                                    ? `₹${coupon.value} Off`
                                                    : "Free Shipping"}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">{coupon.currentUses} uses</p>
                                    <p className="text-sm text-muted-foreground">
                                        ₹{parseFloat(coupon.totalRevenue).toLocaleString()} revenue
                                    </p>
                                </div>
                            </div>
                        ))}
                        {topCoupons.length === 0 && (
                            <p className="text-center text-muted-foreground py-8">
                                No coupon usage data available yet
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Type Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>Breakdown by Type</CardTitle>
                    <CardDescription>
                        Performance comparison across discount types
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {typeBreakdown.map((type) => (
                            <div
                                key={type.type}
                                className="border rounded-lg p-4"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold">
                                        {type.type === "PERCENTAGE"
                                            ? "Percentage Discounts"
                                            : type.type === "FLAT_AMOUNT"
                                                ? "Flat Amount Discounts"
                                                : "Free Shipping"}
                                    </h4>
                                    <span className="text-sm text-muted-foreground">
                                        {type.count} coupons
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Total Uses</p>
                                        <p className="font-semibold">{type.uses}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Revenue</p>
                                        <p className="font-semibold">
                                            ₹{parseFloat(type.revenue).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Discount Given</p>
                                        <p className="font-semibold">
                                            ₹{parseFloat(type.discount).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {typeBreakdown.length === 0 && (
                            <p className="text-center text-muted-foreground py-8">
                                No data available yet
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
