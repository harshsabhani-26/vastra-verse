"use client";

import { useState, useEffect } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, TrendingDown, TrendingUp, DollarSign, Tag } from "lucide-react";
import toast from "react-hot-toast";

interface ProductStats {
    id: string;
    name: string;
    category: string;
    image: string | null;
    quantitySold: number;
    revenue: number;
    orders: number;
    averagePrice: number;
}

interface CategoryStats {
    category: string;
    revenue: number;
    quantitySold: number;
    orders: number;
    [key: string]: any;
}

interface ProductReport {
    topProducts: {
        byRevenue: ProductStats[];
        byQuantity: ProductStats[];
    };
    bottomPerformers: ProductStats[];
    categoryPerformance: CategoryStats[];
    summary: {
        totalProductsSold: number;
        totalRevenue: number;
        totalQuantitySold: number;
    };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function ProductAnalytics() {
    const [data, setData] = useState<ProductReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);

        setStartDate(start.toISOString().split("T")[0]);
        setEndDate(end.toISOString().split("T")[0]);

        const startStr = start.toISOString().split("T")[0];
        const endStr = end.toISOString().split("T")[0];
        fetchData(startStr, endStr);
    }, []);

    async function fetchData(start: string, end: string) {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (start) params.append("startDate", start);
            if (end) params.append("endDate", end);

            const response = await fetch(`/api/admin/reports/products?${params}`);
            const result = await response.json();

            if (response.ok) {
                setData(result);
            } else {
                toast.error(result.error || "Failed to fetch product analytics");
            }
        } catch (error) {
            console.error("Error fetching product data:", error);
            toast.error("Failed to fetch product analytics");
        } finally {
            setLoading(false);
        }
    }

    const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN")}`;

    if (loading) return <div className="text-center py-12 text-stone-500">Loading product analytics...</div>;
    if (!data) return <div className="text-center py-12 text-stone-500">No data available</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-medium">Product Performance</h3>
                    <p className="text-sm text-stone-500">Best sellers and category insights</p>
                </div>
                <div className="flex gap-2 items-center">
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    <span className="text-stone-400">-</span>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    <Button onClick={() => fetchData(startDate, endDate)}>Apply</Button>
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-stone-600">Total Revenue</CardTitle>
                        <DollarSign className="w-4 h-4 text-stone-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#1C1917]">{formatCurrency(data.summary.totalRevenue)}</div>
                        <p className="text-xs text-stone-500 mt-1">From filtered products</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-stone-600">Units Sold</CardTitle>
                        <Package className="w-4 h-4 text-stone-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#1C1917]">{data.summary.totalQuantitySold}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-stone-600">Active Products</CardTitle>
                        <Tag className="w-4 h-4 text-stone-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#1C1917]">{data.summary.totalProductsSold}</div>
                        <p className="text-xs text-stone-500 mt-1">Products with at least 1 sale</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Performance Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sales by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.categoryPerformance}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="revenue"
                                        nameKey="category"
                                    >
                                        {data.categoryPerformance.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Top 5 Products Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top 5 Products (Revenue)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={data.topProducts.byRevenue.slice(0, 5)}
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(value: any) => formatCurrency(value)}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar dataKey="revenue" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* List Views */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Products List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                            Best Selling Products
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="revenue">
                            <TabsList className="mb-4">
                                <TabsTrigger value="revenue">By Revenue</TabsTrigger>
                                <TabsTrigger value="quantity">By Quantity</TabsTrigger>
                            </TabsList>
                            <TabsContent value="revenue" className="space-y-4">
                                {data.topProducts.byRevenue.slice(0, 5).map((product, i) => (
                                    <div key={product.id} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-stone-400 w-4">#{i + 1}</span>
                                            <div>
                                                <div className="font-medium text-sm text-stone-900 truncate max-w-[150px]" title={product.name}>{product.name}</div>
                                                <div className="text-xs text-stone-500">{product.category}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-sm">{formatCurrency(product.revenue)}</div>
                                            <div className="text-xs text-stone-500">{product.quantitySold} sold</div>
                                        </div>
                                    </div>
                                ))}
                            </TabsContent>
                            <TabsContent value="quantity" className="space-y-4">
                                {data.topProducts.byQuantity.slice(0, 5).map((product, i) => (
                                    <div key={product.id} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-stone-400 w-4">#{i + 1}</span>
                                            <div>
                                                <div className="font-medium text-sm text-stone-900 truncate max-w-[150px]" title={product.name}>{product.name}</div>
                                                <div className="text-xs text-stone-500">{product.category}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-sm">{product.quantitySold} sold</div>
                                            <div className="text-xs text-stone-500">{formatCurrency(product.revenue)}</div>
                                        </div>
                                    </div>
                                ))}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* Bottom Products List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingDown className="w-5 h-5 text-red-500" />
                            Lowest Performing Products
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.bottomPerformers.slice(0, 5).map((product, i) => (
                                <div key={product.id} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <div className="font-medium text-sm text-stone-900 truncate max-w-[150px]" title={product.name}>{product.name}</div>
                                            <div className="text-xs text-stone-500">{product.category}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-sm text-stone-600">{formatCurrency(product.revenue)}</div>
                                        <div className="text-xs text-stone-500">{product.quantitySold} sold</div>
                                    </div>
                                </div>
                            ))}
                            {data.bottomPerformers.length === 0 && <div className="text-center text-sm text-stone-500">No data available</div>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
