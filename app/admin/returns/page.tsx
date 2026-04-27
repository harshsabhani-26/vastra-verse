"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle, XCircle, Package, RefreshCw, Eye, CheckCheck, Ban } from "lucide-react";

interface ReturnItem {
    id: string;
    quantity: number;
    refundAmount: string;
    orderItem: {
        product: {
            name: string;
        };
    };
}

interface ReturnRequest {
    id: string;
    orderId: string;
    status: string;
    inspectionStatus: string;
    refundAmount: string;
    reason: string;
    description: string;
    requestedAt: string;
    user: {
        name: string;
        email: string;
    };
    order: {
        total: string;
    };
    items: ReturnItem[];
}

export default function AdminReturnsPage() {
    const [returns, setReturns] = useState<ReturnRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);

    const fetchReturns = async () => {
        try {
            const res = await fetch("/api/admin/returns");
            const data = await res.json();
            setReturns(data);
        } catch (error) {
            console.error("Failed to fetch returns", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReturns();
    }, []);

    const handleAction = async (id: string, action: string) => {
        if (!confirm(`Are you sure you want to ${action.replace(/_/g, " ").toLowerCase()} this return?`)) return;

        setProcessingId(id);
        try {
            const res = await fetch(`/api/admin/returns/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Action failed");
            }

            await fetchReturns();
            alert(`Successfully ${action.replace(/_/g, " ").toLowerCase()}ed`);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            REQUESTED: "bg-yellow-100 text-yellow-800",
            APPROVED: "bg-blue-100 text-blue-800",
            REJECTED: "bg-red-100 text-red-800",
            ITEM_RECEIVED: "bg-purple-100 text-purple-800",
            REFUND_COMPLETED: "bg-green-100 text-green-800",
            CLOSED: "bg-gray-100 text-gray-800",
        };
        return colors[status] || "";
    };

    const getInspectionBadge = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: "bg-yellow-100 text-yellow-800",
            PASSED: "bg-green-100 text-green-800",
            FAILED: "bg-red-100 text-red-800",
            NOT_APPLICABLE: "bg-gray-100 text-gray-800",
        };
        return colors[status] || "";
    };

    if (isLoading) return <div className="p-8 text-center">Loading returns...</div>;

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Return Requests</h1>
                <Button onClick={fetchReturns} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>

            <div className="bg-white rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Refund Amount</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Inspection</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {returns.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    No return requests found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            returns.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-mono text-xs">{req.id.slice(-6)}</TableCell>
                                    <TableCell>{format(new Date(req.requestedAt), "MMM dd, yyyy")}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{req.user?.name || "Unknown"}</div>
                                        <div className="text-xs text-muted-foreground">{req.user?.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-semibold text-green-700">
                                            ₹{Number(req.refundAmount || 0).toLocaleString('en-IN')}
                                        </div>
                                        <button
                                            onClick={() => setSelectedReturn(req)}
                                            className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                                        >
                                            <Eye className="h-3 w-3" />
                                            {req.items?.length || 0} item(s)
                                        </button>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{req.reason.replace(/_/g, " ")}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getStatusBadge(req.status)}>
                                            {req.status.replace(/_/g, " ")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getInspectionBadge(req.inspectionStatus)}>
                                            {req.inspectionStatus}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {req.status === "REQUESTED" && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-green-600"
                                                        onClick={() => handleAction(req.id, "APPROVE")}
                                                        disabled={!!processingId}
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-red-600"
                                                        onClick={() => handleAction(req.id, "REJECT")}
                                                        disabled={!!processingId}
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}

                                            {req.status === "APPROVED" && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleAction(req.id, "MARK_RECEIVED")}
                                                    disabled={!!processingId}
                                                >
                                                    <Package className="mr-2 h-3 w-3" /> Mark Received
                                                </Button>
                                            )}

                                            {req.status === "ITEM_RECEIVED" && req.inspectionStatus === "PENDING" && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-green-600 text-green-700 hover:bg-green-50"
                                                        onClick={() => handleAction(req.id, "INSPECTION_PASS")}
                                                        disabled={!!processingId}
                                                    >
                                                        <CheckCheck className="mr-2 h-3 w-3" /> Pass
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-red-600 text-red-700 hover:bg-red-50"
                                                        onClick={() => handleAction(req.id, "INSPECTION_FAIL")}
                                                        disabled={!!processingId}
                                                    >
                                                        <Ban className="mr-2 h-3 w-3" /> Fail
                                                    </Button>
                                                </>
                                            )}

                                            {req.inspectionStatus === "PASSED" && req.status !== "REFUND_COMPLETED" && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleAction(req.id, "PROCESS_REFUND")}
                                                    disabled={!!processingId}
                                                >
                                                    {processingId === req.id ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                                                    Refund
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Returned Items Dialog */}
            <Dialog open={!!selectedReturn} onOpenChange={() => setSelectedReturn(null)}>
                <DialogContent className="sm:max-w-[500px]" aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle>Returned Items</DialogTitle>
                        <DialogDescription>
                            Items being returned in this request
                        </DialogDescription>
                    </DialogHeader>
                    {selectedReturn && (
                        <div className="space-y-3">
                            {selectedReturn.items?.map((item) => (
                                <div key={item.id} className="flex justify-between items-center p-3 border rounded-md">
                                    <div>
                                        <p className="font-medium">{item.orderItem.product.name}</p>
                                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-green-700">
                                            ₹{Number(item.refundAmount).toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <div className="border-t pt-3 flex justify-between font-bold">
                                <span>Total Refund:</span>
                                <span className="text-green-700">
                                    ₹{Number(selectedReturn.refundAmount).toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedReturn(null)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
