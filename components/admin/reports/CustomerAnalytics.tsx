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
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Repeat, Star, Award } from "lucide-react";
import toast from "react-hot-toast";

interface CustomerSummary {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    repeatPurchaseRate: number;
    averageTimeBetweenOrders: number;
    averageCLV: number;
    vipCustomers: number;
    vipRevenue: number;
}

interface TopCustomer {
    userId: string;
    name: string;
    email: string;
    totalSpent: number;
    orderCount: number;
    lifetimeValue: number;
    isVIP: boolean;
    daysSinceFirstOrder: number;
}

interface RetentionData {
    month: string;
    activeCustomers: number;
    retainedCustomers: number;
    retentionRate: number;
}

interface CustomerReport {
    summary: CustomerSummary;
    topCustomers: TopCustomer[];
    retentionByMonth: RetentionData[];
    customerSegments: {
        high: number;
        medium: number;
        low: number;
    };
}

const COLORS = ['#8b5cf6', '#a78bfa', '#ddd6fe'];

export default function CustomerAnalytics() {
    const [data, setData] = useState<CustomerReport | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/reports/customers');
            const result = await response.json();

            if (response.ok) {
                setData(result);
            } else {
                toast.error(result.error || "Failed to fetch customer analytics");
            }
        } catch (error) {
            console.error("Error fetching customer data:", error);
            toast.error("Failed to fetch customer analytics");
        } finally {
            setLoading(false);
        }
    }

    const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN")}`;

    if (loading) return <div className="text-center py-12 text-stone-500">Loading customer insights...</div>;
    if (!data) return <div className="text-center py-12 text-stone-500">No data available</div>;

    const segmentData = [
        { name: 'VIP/High Value', value: data.customerSegments.high },
        { name: 'Loyal/Medium', value: data.customerSegments.medium },
        { name: 'Standard/Low', value: data.customerSegments.low },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-medium">Customer Insights</h3>
                    <p className="text-sm text-stone-500">Retention, Loyalty, and Lifetime Value</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-stone-600">Active Customers</CardTitle>
                        <Users className="w-4 h-4 text-stone-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#1C1917]">{data.summary.totalCustomers}</div>
                        <p className="text-xs text-stone-500 mt-1">{data.summary.newCustomers} new in period</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-stone-600">Repeat Rate</CardTitle>
                        <Repeat className="w-4 h-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#1C1917]">{data.summary.repeatPurchaseRate.toFixed(1)}%</div>
                        <p className="text-xs text-stone-500 mt-1">{data.summary.returningCustomers} returning customers</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-stone-600">Avg Lifetime Value</CardTitle>
                        <Award className="w-4 h-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#1C1917]">{formatCurrency(data.summary.averageCLV)}</div>
                        <p className="text-xs text-stone-500 mt-1">Per customer average</p>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-100">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-stone-600">VIP Revenue</CardTitle>
                        <Star className="w-4 h-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-900">{formatCurrency(data.summary.vipRevenue)}</div>
                        <p className="text-xs text-amber-700 mt-1">From {data.summary.vipCustomers} VIP members</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Retention Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Retention Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.retentionByMonth}>
                                    <defs>
                                        <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                                    <Tooltip
                                        formatter={(value: any) => [`${Number(value).toFixed(1)}%`, "Retention Rate"]}
                                        contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                                    />
                                    <Area type="monotone" dataKey="retentionRate" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRetention)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Customer Segments */}
                <Card>
                    <CardHeader>
                        <CardTitle>Customer Value Segments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={segmentData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {segmentData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                                <div className="text-2xl font-bold">{data.summary.totalCustomers}</div>
                                <div className="text-xs text-stone-500">Total</div>
                            </div>
                        </div>
                        <div className="flex justify-center gap-4 text-xs text-stone-500 mt-2">
                            {segmentData.map((item, i) => (
                                <div key={item.name} className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                                    {item.name}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Customers Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Spenders (Lifetime Value)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-sm font-medium text-stone-500">
                                    <th className="text-left py-3">Customer</th>
                                    <th className="text-left py-3">Orders</th>
                                    <th className="text-left py-3">Total Spent</th>
                                    <th className="text-left py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.topCustomers.map(customer => (
                                    <tr key={customer.userId} className="border-b last:border-0 hover:bg-stone-50">
                                        <td className="py-3">
                                            <div className="font-medium text-stone-900">{customer.name}</div>
                                            <div className="text-xs text-stone-500">{customer.email}</div>
                                        </td>
                                        <td className="py-3 text-stone-600">{customer.orderCount}</td>
                                        <td className="py-3 font-semibold text-stone-900">{formatCurrency(customer.totalSpent)}</td>
                                        <td className="py-3">
                                            {customer.isVIP && (
                                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                                                    VIP
                                                </Badge>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
