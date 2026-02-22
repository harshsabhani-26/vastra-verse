"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    CreditCard,
    Banknote,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCcw,
    Search,
    Filter,
    TrendingUp,
    DollarSign,
    Upload,
} from "lucide-react";
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
import toast from "react-hot-toast";

interface Payment {
    id: string;
    orderId: string;
    amount: number;
    status: string;
    method: string;
    gatewayPaymentId: string | null;
    failureReason: string | null;
    createdAt: string;
    order: {
        id: string;
        customerName: string;
        total: number;
    };
    refunds: Array<{
        id: string;
        amount: number;
        status: string;
    }>;
}

interface Stats {
    methodBreakdown: Record<string, { count: number; total: number }>;
    codTotal: number;
    onlineTotal: number;
    codPercentage: string;
}

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [methodFilter, setMethodFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchPayments();
    }, [statusFilter, methodFilter, page]);

    async function fetchPayments() {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "20",
                status: statusFilter,
                method: methodFilter,
                ...(searchTerm && { search: searchTerm }),
            });

            const response = await fetch(`/api/admin/payments?${params}`);
            const data = await response.json();

            if (response.ok) {
                setPayments(data?.payments ?? []);
                setStats(data?.stats ?? null);
                setTotalPages(data?.pagination?.totalPages ?? 1);
            } else {
                toast.error(data.error || "Failed to fetch payments");
            }
        } catch (error) {
            console.error("Error fetching payments:", error);
            toast.error("Failed to fetch payments");
        } finally {
            setLoading(false);
        }
    }

    async function verifyPayment(paymentId: string) {
        try {
            const response = await fetch(`/api/admin/payments/${paymentId}/verify`, {
                method: "PUT",
            });

            if (response.ok) {
                toast.success("Payment verified successfully");
                fetchPayments();
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to verify payment");
            }
        } catch (error) {
            console.error("Error verifying payment:", error);
            toast.error("Failed to verify payment");
        }
    }

    function getStatusBadge(status: string) {
        const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
            PENDING: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Pending" },
            PROCESSING: { color: "bg-blue-100 text-blue-800", icon: RefreshCcw, label: "Processing" },
            COMPLETED: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Completed" },
            FAILED: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Failed" },
            REFUNDED: { color: "bg-purple-100 text-purple-800", icon: RefreshCcw, label: "Refunded" },
            PARTIALLY_REFUNDED: { color: "bg-purple-100 text-purple-800", icon: RefreshCcw, label: "Partial Refund" },
        };

        const config = statusConfig[status] || statusConfig.PENDING;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3" />
                {config.label}
            </span>
        );
    }

    function getMethodIcon(method: string) {
        const icons: Record<string, any> = {
            COD: Banknote,
            CREDIT_CARD: CreditCard,
            DEBIT_CARD: CreditCard,
            UPI: DollarSign,
            NET_BANKING: DollarSign,
            WALLET: DollarSign,
        };

        const Icon = icons[method] || DollarSign;
        return <Icon className="w-4 h-4" />;
    }

    const formatCurrency = (amount: number) => {
        return `₹${Number(amount).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-stone-900 tracking-tight">Payment Transactions</h2>
                    <p className="text-stone-500 text-sm mt-0.5">Manage COD and Online payments</p>
                </div>
                <Link href="/admin/payments/settlement">
                    <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Upload className="w-4 h-4" />
                        Bulk Settlement
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-stone-600">
                                COD Payments
                            </CardTitle>
                            <Banknote className="w-4 h-4 text-stone-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#1C1917]">
                                {formatCurrency(stats.codTotal)}
                            </div>
                            <p className="text-xs text-stone-500 mt-1">
                                {stats.codPercentage}% of total
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-stone-600">
                                Online Payments
                            </CardTitle>
                            <CreditCard className="w-4 h-4 text-stone-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#1C1917]">
                                {formatCurrency(stats.onlineTotal)}
                            </div>
                            <p className="text-xs text-stone-500 mt-1">
                                {(100 - parseFloat(stats.codPercentage)).toFixed(2)}% of total
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-stone-600">
                                Total Revenue
                            </CardTitle>
                            <TrendingUp className="w-4 h-4 text-stone-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#1C1917]">
                                {formatCurrency(stats.codTotal + stats.onlineTotal)}
                            </div>
                            <p className="text-xs text-stone-500 mt-1">All payment methods</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4" />
                            <Input
                                placeholder="Search by order ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                                onKeyDown={(e) => e.key === "Enter" && fetchPayments()}
                            />
                        </div>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="PROCESSING">Processing</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="FAILED">Failed</SelectItem>
                                <SelectItem value="REFUNDED">Refunded</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={methodFilter} onValueChange={setMethodFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Methods</SelectItem>
                                <SelectItem value="COD">Cash on Delivery</SelectItem>
                                <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                                <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                                <SelectItem value="UPI">UPI</SelectItem>
                                <SelectItem value="NET_BANKING">Net Banking</SelectItem>
                                <SelectItem value="WALLET">Wallet</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button onClick={fetchPayments} variant="outline">
                            <Filter className="w-4 h-4 mr-2" />
                            Apply Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Payments Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-stone-500">Loading payments...</div>
                    ) : (payments?.length ?? 0) === 0 ? (
                        <div className="text-center py-8 text-stone-500">No payments found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-stone-200">
                                        <th className="text-left p-4 text-sm font-medium text-stone-600">Order ID</th>
                                        <th className="text-left p-4 text-sm font-medium text-stone-600">Customer</th>
                                        <th className="text-left p-4 text-sm font-medium text-stone-600">Amount</th>
                                        <th className="text-left p-4 text-sm font-medium text-stone-600">Method</th>
                                        <th className="text-left p-4 text-sm font-medium text-stone-600">Status</th>
                                        <th className="text-left p-4 text-sm font-medium text-stone-600">Date</th>
                                        <th className="text-left p-4 text-sm font-medium text-stone-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((payment) => (
                                        <tr key={payment.id} className="border-b border-stone-100 hover:bg-stone-50">
                                            <td className="p-4 text-sm font-mono text-stone-800">
                                                {payment.order.id.substring(0, 8)}...
                                            </td>
                                            <td className="p-4 text-sm text-stone-800">
                                                {payment.order.customerName || "N/A"}
                                            </td>
                                            <td className="p-4 text-sm font-medium text-stone-900">
                                                {formatCurrency(payment.amount)}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-sm text-stone-600">
                                                    {getMethodIcon(payment.method)}
                                                    {payment.method.replace("_", " ")}
                                                </div>
                                            </td>
                                            <td className="p-4">{getStatusBadge(payment.status)}</td>
                                            <td className="p-4 text-sm text-stone-600">
                                                {new Date(payment.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                {payment.status === "PENDING" && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => verifyPayment(payment.id)}
                                                    >
                                                        Verify
                                                    </Button>
                                                )}
                                                {payment.status === "FAILED" && payment.failureReason && (
                                                    <span className="text-xs text-red-600" title={payment.failureReason}>
                                                        Failed
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-stone-600">
                                Page {page} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
