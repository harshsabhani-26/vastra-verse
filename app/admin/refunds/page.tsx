"use client";

import { useState, useEffect } from "react";
import {
    CheckCircle,
    XCircle,
    Clock,
    RefreshCcw,
    Search,
    AlertTriangle,
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";

interface Refund {
    id: string;
    orderId: string;
    paymentId: string;
    amount: number;
    status: string;
    reason: string;
    requestedAt: string;
    approvedBy: string | null;
    approvedAt: string | null;
    processedBy: string | null;
    processedAt: string | null;
    rejectedBy: string | null;
    rejectedAt: string | null;
    rejectionReason: string | null;
    approvalNotes: string | null;
    processingNotes: string | null;
    order: {
        id: string;
        customerName: string;
        total: number;
    };
    payment: {
        id: string;
        amount: number;
        method: string;
    };
}

interface Stats {
    statusBreakdown: Record<string, { count: number; total: number }>;
    pendingCount: number;
    totalRefunded: number;
}

export default function RefundsPage() {
    const [refunds, setRefunds] = useState<Refund[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Dialog states
    const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
    const [actionType, setActionType] = useState<"approve" | "process" | "reject" | null>(null);
    const [notes, setNotes] = useState("");

    useEffect(() => {
        fetchRefunds();
    }, [statusFilter, page]);

    async function fetchRefunds() {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "20",
                status: statusFilter,
                ...(searchTerm && { search: searchTerm }),
            });

            const response = await fetch(`/api/admin/refunds?${params}`);
            const data = await response.json();

            if (response.ok) {
                setRefunds(data.refunds);
                setStats(data.stats);
                setTotalPages(data.pagination.totalPages);
            } else {
                toast.error(data.error || "Failed to fetch refunds");
            }
        } catch (error) {
            console.error("Error fetching refunds:", error);
            toast.error("Failed to fetch refunds");
        } finally {
            setLoading(false);
        }
    }

    async function handleRefundAction() {
        if (!selectedRefund || !actionType) return;

        try {
            let endpoint = "";
            let body: any = {};

            if (actionType === "approve") {
                endpoint = `/api/admin/refunds/${selectedRefund.id}/approve`;
                body = { notes };
            } else if (actionType === "process") {
                endpoint = `/api/admin/refunds/${selectedRefund.id}/process`;
                body = { notes };
            } else if (actionType === "reject") {
                endpoint = `/api/admin/refunds/${selectedRefund.id}/reject`;
                body = { reason: notes };
            }

            const response = await fetch(endpoint, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                toast.success(`Refund ${actionType}d successfully`);
                closeDialog();
                fetchRefunds();
            } else {
                const data = await response.json();
                toast.error(data.error || `Failed to ${actionType} refund`);
            }
        } catch (error) {
            console.error(`Error ${actionType}ing refund:`, error);
            toast.error(`Failed to ${actionType} refund`);
        }
    }

    function openDialog(refund: Refund, action: "approve" | "process" | "reject") {
        setSelectedRefund(refund);
        setActionType(action);
        setNotes("");
    }

    function closeDialog() {
        setSelectedRefund(null);
        setActionType(null);
        setNotes("");
    }

    function getStatusBadge(status: string) {
        const statusConfig: Record<
            string,
            { color: string; icon: any; label: string }
        > = {
            PENDING: {
                color: "bg-yellow-100 text-yellow-800",
                icon: Clock,
                label: "Pending",
            },
            APPROVED: {
                color: "bg-blue-100 text-blue-800",
                icon: CheckCircle,
                label: "Approved",
            },
            PROCESSING: {
                color: "bg-purple-100 text-purple-800",
                icon: RefreshCcw,
                label: "Processing",
            },
            PROCESSED: {
                color: "bg-green-100 text-green-800",
                icon: CheckCircle,
                label: "Processed",
            },
            REJECTED: {
                color: "bg-red-100 text-red-800",
                icon: XCircle,
                label: "Rejected",
            },
            FAILED: {
                color: "bg-red-100 text-red-800",
                icon: AlertTriangle,
                label: "Failed",
            },
        };

        const config = statusConfig[status] || statusConfig.PENDING;
        const Icon = config.icon;

        return (
            <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}
            >
                <Icon className="w-3 h-3" />
                {config.label}
            </span>
        );
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
                <h2 className="text-3xl font-serif text-[#1C1917]">Refund Management</h2>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-stone-600">
                                Pending Refunds
                            </CardTitle>
                            <Clock className="w-4 h-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#1C1917]">
                                {stats.pendingCount}
                            </div>
                            <p className="text-xs text-stone-500 mt-1">Awaiting approval</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-stone-600">
                                Total Refunded
                            </CardTitle>
                            <RefreshCcw className="w-4 h-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#1C1917]">
                                {formatCurrency(stats.totalRefunded)}
                            </div>
                            <p className="text-xs text-stone-500 mt-1">Processed refunds</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-stone-600">
                                Total Requests
                            </CardTitle>
                            <AlertTriangle className="w-4 h-4 text-stone-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#1C1917]">
                                {Object.values(stats.statusBreakdown).reduce(
                                    (sum, s) => sum + s.count,
                                    0
                                )}
                            </div>
                            <p className="text-xs text-stone-500 mt-1">All time</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4" />
                            <Input
                                placeholder="Search by order ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                                onKeyDown={(e) => e.key === "Enter" && fetchRefunds()}
                            />
                        </div>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="PROCESSING">Processing</SelectItem>
                                <SelectItem value="PROCESSED">Processed</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button onClick={fetchRefunds} variant="outline">
                            Apply Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Refunds Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Refund Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-stone-500">
                            Loading refunds...
                        </div>
                    ) : refunds.length === 0 ? (
                        <div className="text-center py-8 text-stone-500">
                            No refunds found
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-stone-200">
                                        <th className="text-left p-4 text-sm font-medium text-stone-600">
                                            Order ID
                                        </th>
                                        <th className="text-left p-4 text-sm font-medium text-stone-600">
                                            Customer
                                        </th>
                                        <th className="text-left p-4 text-sm font-medium text-stone-600">
                                            Amount
                                        </th>
                                        <th className="text-left p-4 text-sm font-medium text-stone-600">
                                            Reason
                                        </th>
                                        <th className="text-left p-4 text-sm font-medium text-stone-600">
                                            Status
                                        </th>
                                        <th className="text-left p-4 text-sm font-medium text-stone-600">
                                            Date
                                        </th>
                                        <th className="text-left p-4 text-sm font-medium text-stone-600">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {refunds.map((refund) => (
                                        <tr
                                            key={refund.id}
                                            className="border-b border-stone-100 hover:bg-stone-50"
                                        >
                                            <td className="p-4 text-sm font-mono text-stone-800">
                                                {refund.order.id.substring(0, 8)}...
                                            </td>
                                            <td className="p-4 text-sm text-stone-800">
                                                {refund.order.customerName || "N/A"}
                                            </td>
                                            <td className="p-4 text-sm font-medium text-stone-900">
                                                {formatCurrency(refund.amount)}
                                            </td>
                                            <td className="p-4 text-sm text-stone-600 max-w-xs truncate">
                                                {refund.reason}
                                            </td>
                                            <td className="p-4">{getStatusBadge(refund.status)}</td>
                                            <td className="p-4 text-sm text-stone-600">
                                                {new Date(refund.requestedAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    {refund.status === "PENDING" && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => openDialog(refund, "approve")}
                                                                className="text-green-600 hover:text-green-700"
                                                            >
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => openDialog(refund, "reject")}
                                                                className="text-red-600 hover:text-red-700"
                                                            >
                                                                Reject
                                                            </Button>
                                                        </>
                                                    )}
                                                    {refund.status === "APPROVED" && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => openDialog(refund, "process")}
                                                        >
                                                            Process
                                                        </Button>
                                                    )}
                                                </div>
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
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-stone-600">
                                Page {page} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Action Dialog */}
            <Dialog open={!!selectedRefund} onOpenChange={() => closeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === "approve" && "Approve Refund"}
                            {actionType === "process" && "Process Refund"}
                            {actionType === "reject" && "Reject Refund"}
                        </DialogTitle>
                        <DialogDescription>
                            {actionType === "approve" &&
                                "Approving this refund will allow it to be processed."}
                            {actionType === "process" &&
                                "Processing this refund will initiate the actual refund transaction."}
                            {actionType === "reject" &&
                                "Rejecting this refund will close the request."}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRefund && (
                        <div className="space-y-4">
                            <div className="bg-stone-50 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-600">Order ID:</span>
                                    <span className="font-mono">{selectedRefund.order.id}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-600">Refund Amount:</span>
                                    <span className="font-semibold">
                                        {formatCurrency(selectedRefund.amount)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-600">Reason:</span>
                                    <span className="text-right max-w-xs">
                                        {selectedRefund.reason}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    {actionType === "reject" ? "Rejection Reason" : "Notes"}{" "}
                                    {actionType === "reject" && "(Required)"}
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full border border-stone-300 rounded-md p-3 text-sm"
                                    rows={4}
                                    placeholder={
                                        actionType === "reject"
                                            ? "Enter reason for rejection..."
                                            : "Add any notes (optional)..."
                                    }
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRefundAction}
                            disabled={actionType === "reject" && !notes.trim()}
                        >
                            Confirm {actionType === "approve" && "Approval"}
                            {actionType === "process" && "Processing"}
                            {actionType === "reject" && "Rejection"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
