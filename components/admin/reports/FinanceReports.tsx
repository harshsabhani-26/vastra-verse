"use client";

import { useState, useEffect } from "react";
import {
    TrendingUp,
    DollarSign,
    RefreshCcw,
    AlertCircle,
    Download,
    Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

interface FinancialReport {
    summary: {
        totalRevenue: number;
        totalRefunded: number;
        netRevenue: number;
        totalOrders: number;
        totalRefunds: number;
        failedPaymentsCount: number;
    };
    gst: {
        totalCGST: number;
        totalSGST: number;
        totalIGST: number;
        totalGST: number;
    };
    paymentMethods: {
        breakdown: Array<{
            method: string;
            total: number;
            count: number;
            percentage: string;
        }>;
        codVsOnline: {
            cod: number;
            online: number;
            codPercentage: string;
        };
    };
    refunds: {
        total: number;
        count: number;
        byStatus: Array<{
            status: string;
            total: number;
            count: number;
        }>;
    };
    failedPayments: Array<{
        id: string;
        amount: number;
        reason: string;
        method: string;
        date: string;
        customerName: string;
    }>;
    dailyRevenue: Array<{
        date: Date;
        revenue: number;
        count: number;
    }>;
}

export default function FinanceReports() {
    const [report, setReport] = useState<FinancialReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        // Set default date range (last 30 days)
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);

        setStartDate(start.toISOString().split("T")[0]);
        setEndDate(end.toISOString().split("T")[0]);
        // We will fetch inside the effect once state is set? 
        // Actually react state updates are async, so better to calc strings and pass to fetch
        const startStr = start.toISOString().split("T")[0];
        const endStr = end.toISOString().split("T")[0];
        fetchReport(startStr, endStr);
    }, []);

    async function fetchReport(start = startDate, end = endDate) {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (start) params.append("startDate", start);
            if (end) params.append("endDate", end);

            const response = await fetch(`/api/admin/reports/finance?${params}`);
            const data = await response.json();

            if (response.ok) {
                setReport(data);
            } else {
                toast.error(data.error || "Failed to fetch report");
            }
        } catch (error) {
            console.error("Error fetching report:", error);
            toast.error("Failed to fetch report");
        } finally {
            setLoading(false);
        }
    }

    function exportToCSV() {
        if (!report) return;

        // Create CSV content
        let csv = "Financial Report\n\n";
        csv += `Period: ${startDate} to ${endDate}\n\n`;

        csv += "Summary\n";
        csv += `Total Revenue,${formatCurrency(report.summary.totalRevenue)}\n`;
        csv += `Total Refunded,${formatCurrency(report.summary.totalRefunded)}\n`;
        csv += `Net Revenue,${formatCurrency(report.summary.netRevenue)}\n`;
        csv += `Total Orders,${report.summary.totalOrders}\n`;
        csv += `Total Refunds,${report.summary.totalRefunds}\n\n`;

        csv += "GST Collection\n";
        csv += `Total CGST,${formatCurrency(report.gst.totalCGST)}\n`;
        csv += `Total SGST,${formatCurrency(report.gst.totalSGST)}\n`;
        csv += `Total IGST,${formatCurrency(report.gst.totalIGST)}\n`;
        csv += `Total GST,${formatCurrency(report.gst.totalGST)}\n\n`;

        csv += "Payment Methods\n";
        csv += "Method,Total,Count,Percentage\n";
        report.paymentMethods.breakdown.forEach(method => {
            csv += `${method.method},${formatCurrency(method.total)},${method.count},${method.percentage}%\n`;
        });

        // Download CSV
        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `financial-report-${startDate}-to-${endDate}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast.success("Report exported successfully");
    }

    const formatCurrency = (amount: number) => {
        return `₹${Number(amount).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    if (loading) {
        return <div className="text-center py-12 text-stone-500">Loading financial data...</div>;
    }

    if (!report) {
        return <div className="text-center py-12 text-stone-500">No financial data available</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Financial Overview</h3>
                    <p className="text-sm text-stone-500">Revenue, Refunds, and GST</p>
                </div>
                <Button onClick={exportToCSV} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                </Button>
            </div>

            {/* Date Range Filter */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex gap-4 items-center">
                            <div>
                                <label className="text-sm text-stone-600 block mb-1">Start Date</label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm text-stone-600 block mb-1">End Date</label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button onClick={() => fetchReport()} className="mb-0.5">
                            Apply Filter
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-stone-600">
                            Total Revenue
                        </CardTitle>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#1C1917]">
                            {formatCurrency(report.summary.totalRevenue)}
                        </div>
                        <p className="text-xs text-stone-500 mt-1">
                            From {report.summary.totalOrders} total orders
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-stone-600">
                            Total Refunded
                        </CardTitle>
                        <RefreshCcw className="w-4 h-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(report.summary.totalRefunded)}
                        </div>
                        <p className="text-xs text-stone-500 mt-1">
                            {report.summary.totalRefunds} refunds processed
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-stone-600">
                            Net Revenue
                        </CardTitle>
                        <DollarSign className="w-4 h-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(report.summary.netRevenue)}
                        </div>
                        <p className="text-xs text-stone-500 mt-1">
                            Revenue after refunds
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* GST Collection */}
            <Card>
                <CardHeader>
                    <CardTitle>GST Collection Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-stone-50 p-4 rounded-lg">
                            <div className="text-sm text-stone-600 mb-1">CGST</div>
                            <div className="text-lg font-semibold text-[#1C1917]">
                                {formatCurrency(report.gst.totalCGST)}
                            </div>
                        </div>
                        <div className="bg-stone-50 p-4 rounded-lg">
                            <div className="text-sm text-stone-600 mb-1">SGST</div>
                            <div className="text-lg font-semibold text-[#1C1917]">
                                {formatCurrency(report.gst.totalSGST)}
                            </div>
                        </div>
                        <div className="bg-stone-50 p-4 rounded-lg">
                            <div className="text-sm text-stone-600 mb-1">IGST</div>
                            <div className="text-lg font-semibold text-[#1C1917]">
                                {formatCurrency(report.gst.totalIGST)}
                            </div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="text-sm text-blue-700 mb-1">Total GST</div>
                            <div className="text-lg font-semibold text-blue-900">
                                {formatCurrency(report.gst.totalGST)}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Payment Methods Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Methods</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {report.paymentMethods.breakdown.map((method) => (
                                <div key={method.method} className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-stone-900">
                                            {method.method.replace("_", " ")}
                                        </div>
                                        <div className="text-sm text-stone-500">
                                            {method.count} transactions
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-stone-900">
                                            {formatCurrency(method.total)}
                                        </div>
                                        <div className="text-sm text-stone-500">
                                            {method.percentage}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>COD vs Online</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                                <div>
                                    <div className="font-medium text-amber-900">Cash on Delivery</div>
                                    <div className="text-sm text-amber-700">
                                        {report.paymentMethods.codVsOnline.codPercentage}%
                                    </div>
                                </div>
                                <div className="text-xl font-bold text-amber-900">
                                    {formatCurrency(report.paymentMethods.codVsOnline.cod)}
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                                <div>
                                    <div className="font-medium text-green-900">Online Payments</div>
                                    <div className="text-sm text-green-700">
                                        {(100 - parseFloat(report.paymentMethods.codVsOnline.codPercentage)).toFixed(2)}%
                                    </div>
                                </div>
                                <div className="text-xl font-bold text-green-900">
                                    {formatCurrency(report.paymentMethods.codVsOnline.online)}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Failed Payments */}
            {report.summary.failedPaymentsCount > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            Failed Payments ({report.summary.failedPaymentsCount})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-stone-200">
                                        <th className="text-left p-4 text-sm font-medium text-stone-600">Customer</th>
                                        <th className="text-left p-4 text-sm font-medium text-stone-600">Amount</th>
                                        <th className="text-left p-4 text-sm font-medium text-stone-600">Method</th>
                                        <th className="text-left p-4 text-sm font-medium text-stone-600">Reason</th>
                                        <th className="text-left p-4 text-sm font-medium text-stone-600">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.failedPayments.slice(0, 10).map((payment) => (
                                        <tr key={payment.id} className="border-b border-stone-100">
                                            <td className="p-4 text-sm text-stone-800">{payment.customerName}</td>
                                            <td className="p-4 text-sm font-medium text-stone-900">{formatCurrency(payment.amount)}</td>
                                            <td className="p-4 text-sm text-stone-600">{payment.method}</td>
                                            <td className="p-4 text-sm text-red-600">{payment.reason || "Unknown"}</td>
                                            <td className="p-4 text-sm text-stone-600">{new Date(payment.date).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
