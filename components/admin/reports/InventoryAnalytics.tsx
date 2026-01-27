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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, TrendingDown, DollarSign, Archive, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface InventorySummary {
    totalInventoryValue: number;
    totalInventoryValueAtRetail: number;
    potentialProfit: number;
    totalProducts: number;
    totalStock: number;
    lowStockCount: number;
    outOfStockCount: number;
    overstockCount: number;
    inventoryTurnoverRatio: number;
}

interface CategoryBreakdown {
    category: string;
    items: number;
    stock: number;
    value: number;
    valueAtRetail: number;
}

interface StockItem {
    id: string;
    name: string;
    category: string;
    currentStock?: number;
    lowStockThreshold?: number;
    image: string | null;
    reorderSuggestion?: number;
    lastSold?: string;
    soldLast30Days?: number;
    daysOfInventory?: number;
}

interface InventoryReport {
    summary: InventorySummary;
    categoryBreakdown: CategoryBreakdown[];
    lowStockAlerts: StockItem[];
    outOfStockItems: StockItem[];
    overstockItems: StockItem[];
}

export default function InventoryAnalytics() {
    const [data, setData] = useState<InventoryReport | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/reports/inventory');
            const result = await response.json();

            if (response.ok) {
                setData(result);
            } else {
                toast.error(result.error || "Failed to fetch inventory analytics");
            }
        } catch (error) {
            console.error("Error fetching inventory data:", error);
            toast.error("Failed to fetch inventory analytics");
        } finally {
            setLoading(false);
        }
    }

    const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN")}`;

    if (loading) return <div className="text-center py-12 text-stone-500">Loading inventory analytics...</div>;
    if (!data) return <div className="text-center py-12 text-stone-500">No data available</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-medium">Inventory Health</h3>
                    <p className="text-sm text-stone-500">Stock valuation and movement analysis</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-stone-600">Inventory Value (Cost)</CardTitle>
                        <DollarSign className="w-4 h-4 text-stone-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#1C1917]">{formatCurrency(data.summary.totalInventoryValue)}</div>
                        <p className="text-xs text-stone-500 mt-1">Retail Value: {formatCurrency(data.summary.totalInventoryValueAtRetail)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-stone-600">Total Items</CardTitle>
                        <Package className="w-4 h-4 text-stone-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#1C1917]">{data.summary.totalStock}</div>
                        <p className="text-xs text-stone-500 mt-1">{data.summary.totalProducts} unique products</p>
                    </CardContent>
                </Card>
                <Card className={data.summary.lowStockCount > 0 ? "border-amber-200 bg-amber-50" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-stone-600">Low Stock Alerts</CardTitle>
                        <AlertTriangle className={`w-4 h-4 ${data.summary.lowStockCount > 0 ? "text-amber-500" : "text-stone-400"}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${data.summary.lowStockCount > 0 ? "text-amber-700" : "text-[#1C1917]"}`}>
                            {data.summary.lowStockCount}
                        </div>
                        <p className="text-xs text-stone-500 mt-1">Items below threshold</p>
                    </CardContent>
                </Card>
                <Card className={data.summary.outOfStockCount > 0 ? "border-red-200 bg-red-50" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-stone-600">Out of Stock</CardTitle>
                        <AlertCircle className={`w-4 h-4 ${data.summary.outOfStockCount > 0 ? "text-red-500" : "text-stone-400"}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${data.summary.outOfStockCount > 0 ? "text-red-700" : "text-[#1C1917]"}`}>
                            {data.summary.outOfStockCount}
                        </div>
                        <p className="text-xs text-stone-500 mt-1">Require immediate attention</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Category Value Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Inventory Value by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.categoryBreakdown} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="category" width={100} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(value: any) => formatCurrency(value)}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} name="Cost Value" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Turnover Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>Stock Health</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-lg bg-stone-50 border border-stone-100">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingDown className="w-4 h-4 text-stone-500" />
                                <span className="font-medium text-sm">Turnover Ratio</span>
                            </div>
                            <div className="text-2xl font-bold">{data.summary.inventoryTurnoverRatio.toFixed(2)}</div>
                            <p className="text-xs text-stone-500">Items sold / Total stock</p>
                        </div>
                        <div className="p-4 rounded-lg bg-stone-50 border border-stone-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Archive className="w-4 h-4 text-stone-500" />
                                <span className="font-medium text-sm">Slow Moving</span>
                            </div>
                            <div className="text-2xl font-bold">{data.summary.overstockCount}</div>
                            <p className="text-xs text-stone-500">Items with &gt;50 stock &amp; low sales</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Alerts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-amber-700 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" /> Low Stock Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                            {data.lowStockAlerts.length === 0 ? (
                                <p className="text-stone-500 text-sm text-center py-4">No low stock items.</p>
                            ) : (
                                data.lowStockAlerts.map(item => (
                                    <div key={item.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                                        <div>
                                            <div className="font-medium text-sm">{item.name}</div>
                                            <div className="text-xs text-stone-500">Current: {item.currentStock} (Threshold: {item.lowStockThreshold})</div>
                                        </div>
                                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                                            Reorder ~{item.reorderSuggestion}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-red-700 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" /> Out of Stock
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                            {data.outOfStockItems.length === 0 ? (
                                <p className="text-stone-500 text-sm text-center py-4">No out of stock items.</p>
                            ) : (
                                data.outOfStockItems.map(item => (
                                    <div key={item.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                                        <div>
                                            <div className="font-medium text-sm">{item.name}</div>
                                            <div className="text-xs text-stone-500">Last Sold: {item.lastSold ? new Date(item.lastSold).toLocaleDateString() : 'Never'}</div>
                                        </div>
                                        <Badge variant="destructive">Restock</Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
