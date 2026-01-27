"use client";

import { useState, useEffect } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TrendingUp, ShoppingBag, Users, Clock, Calendar } from "lucide-react";
import toast from "react-hot-toast";

interface SalesData {
    summary: {
        totalSales: number;
        totalOrders: number;
        averageOrderValue: number;
        salesTrend: number;
        ordersTrend: number;
        aovTrend: number;
        salesVelocity: number;
    };
    timeSeries: Array<{
        date: string;
        revenue: number;
        orders: number;
        aov: number;
    }>;
    peakHours: Array<{
        hour: number;
        sales: number;
        orders: number;
    }>;
    salesByDay: Array<{
        day: string;
        sales: number;
        orders: number;
    }>;
}

export default function SalesAnalytics() {
    const [data, setData] = useState<SalesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [groupBy, setGroupBy] = useState("daily"); // daily, monthly

    useEffect(() => {
        // Default to last 30 days
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);

        setStartDate(start.toISOString().split("T")[0]);
        setEndDate(end.toISOString().split("T")[0]);

        const startStr = start.toISOString().split("T")[0];
        const endStr = end.toISOString().split("T")[0];
        fetchSalesData(startStr, endStr, "daily");
    }, []);

    async function fetchSalesData(start: string, end: string, group: string) {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (start) params.append("startDate", start);
            if (end) params.append("endDate", end);
            if (group) params.append("groupBy", group);

            const response = await fetch(`/api/admin/reports/sales?${params}`);
            const result = await response.json();

            if (response.ok) {
                setData(result);
            } else {
                toast.error(result.error || "Failed to fetch sales data");
            }
        } catch (error) {
            console.error("Error fetching sales data:", error);
            toast.error("Failed to fetch sales data");
        } finally {
            setLoading(false);
        }
    }

    const formatCurrency = (value: number) => {
        return `₹${value.toLocaleString("en-IN")}`;
    };

    if (loading) {
        return <div className="text-center py-12 text-stone-500">Loading sales analytics...</div>;
    }

    if (!data) {
        return <div className="text-center py-12 text-stone-500">No sales data available</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-medium">Sales Performance</h3>
                    <p className="text-sm text-stone-500">Revenue trends and order analysis</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 items-center">
                    <Input
                        type="date"
                        className="w-auto"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <span className="text-stone-400">-</span>
                    <Input
                        type="date"
                        className="w-auto"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                    <Select value={groupBy} onValueChange={setGroupBy}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Group by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={() => fetchSalesData(startDate, endDate, groupBy)}>
                        Apply
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-stone-600">Total Sales</CardTitle>
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#1C1917]">{formatCurrency(data.summary.totalSales)}</div>
                        <p className={`text-xs mt-1 ${data.summary.salesTrend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {data.summary.salesTrend > 0 ? '+' : ''}{data.summary.salesTrend.toFixed(1)}% from previous period
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-stone-600">Total Orders</CardTitle>
                        <ShoppingBag className="w-4 h-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#1C1917]">{data.summary.totalOrders}</div>
                        <p className={`text-xs mt-1 ${data.summary.ordersTrend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {data.summary.ordersTrend > 0 ? '+' : ''}{data.summary.ordersTrend.toFixed(1)}% from previous period
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-stone-600">Avg Order Value</CardTitle>
                        <Users className="w-4 h-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#1C1917]">{formatCurrency(data.summary.averageOrderValue)}</div>
                        <p className={`text-xs mt-1 ${data.summary.aovTrend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {data.summary.aovTrend > 0 ? '+' : ''}{data.summary.aovTrend.toFixed(1)}% from previous period
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-stone-600">Sales Velocity</CardTitle>
                        <Clock className="w-4 h-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#1C1917]">{data.summary.salesVelocity.toFixed(1)}</div>
                        <p className="text-xs mt-1 text-stone-500">Orders per day average</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Revenue Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.timeSeries}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#059669" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#9CA3AF"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#9CA3AF"
                                        fontSize={12}
                                        tickFormatter={(value) => `₹${value / 1000}k`}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        formatter={(value: any) => [formatCurrency(value), "Revenue"]}
                                        contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#059669"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Sales by Day</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.salesByDay} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="day"
                                        type="category"
                                        width={80}
                                        stroke="#4B5563"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        formatter={(value: any) => [formatCurrency(value), "Sales"]}
                                        contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                                    />
                                    <Bar dataKey="sales" fill="#D97706" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Peak Hours & Orders Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Peak Shopping Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.peakHours}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="hour"
                                        stroke="#9CA3AF"
                                        fontSize={12}
                                        tickFormatter={(hour) => `${hour}:00`}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        cursor={{ fill: '#F3F4F6' }}
                                        formatter={(value: any) => [formatCurrency(value), "Sales"]}
                                        labelFormatter={(hour) => `${hour}:00 - ${Number(hour) + 1}:00`}
                                        contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                                    />
                                    <Bar dataKey="sales" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
