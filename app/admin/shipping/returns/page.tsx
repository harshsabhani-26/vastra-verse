import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
    Package,
    Clock,
    CheckCircle2,
    XCircle,
    TrendingUp,
    Eye,
    IndianRupee,
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

async function getReturnsData() {
    const [pendingReturns, completedReturns, failedReturns, returnShipments] = await Promise.all([
        prisma.returnRequest.count({
            where: { status: { in: ["REQUESTED", "APPROVED"] } },
        }),
        prisma.returnRequest.count({
            where: { status: "REFUND_COMPLETED" },
        }),
        prisma.returnRequest.count({
            where: { status: "REJECTED" },
        }),
        prisma.returnRequest.findMany({
            include: {
                order: {
                    select: {
                        id: true,
                        customerName: true,
                        total: true,
                    },
                },
                refunds: {
                    select: {
                        status: true,
                    }
                }
            },
            orderBy: { requestedAt: "desc" },
            take: 50,
        }),
    ]);

    return {
        pendingReturns,
        completedReturns,
        failedReturns,
        returnShipments: returnShipments.map((r) => ({
            id: r.id,
            orderId: r.orderId,
            customerName: r.order.customerName,
            reason: r.reason,
            status: r.status,
            refundStatus: r.refunds[0]?.status || "NONE",
            refundAmount: r.refundAmount,
            requestedAt: r.requestedAt,
            approvedAt: r.approvedAt,
            refundCompletedAt: r.refundCompletedAt,
        })),
    };
}

const STATUS_COLORS: Record<string, string> = {
    REQUESTED: "bg-yellow-200 text-yellow-900 border border-yellow-300",
    APPROVED: "bg-blue-200 text-blue-900 border border-blue-300",
    ITEM_RECEIVED: "bg-purple-200 text-purple-900 border border-purple-300",
    REFUND_PENDING: "bg-indigo-200 text-indigo-900 border border-indigo-300",
    REFUND_COMPLETED: "bg-green-200 text-green-900 border border-green-300",
    REJECTED: "bg-red-200 text-red-900 border border-red-300",
    CLOSED: "bg-gray-200 text-gray-900 border border-gray-300",
};

const REFUND_STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-blue-100 text-blue-800",
    PROCESSING: "bg-purple-100 text-purple-800",
    PROCESSED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    FAILED: "bg-red-100 text-red-800",
    NONE: "bg-gray-100 text-gray-800",
};

export default async function ReturnsPage() {
    const data = await getReturnsData();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917]">Returns Management</h2>
                <p className="text-stone-600 mt-1">
                    Manage reverse logistics, return pickups, and refund processing
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-yellow-50 rounded-lg">
                            <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <p className="text-sm text-stone-600">Pending Returns</p>
                    </div>
                    <p className="text-3xl font-bold">{data.pendingReturns}</p>
                    <p className="text-xs text-stone-500 mt-1">Awaiting action</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <p className="text-sm text-stone-600">Completed</p>
                    </div>
                    <p className="text-3xl font-bold">{data.completedReturns}</p>
                    <p className="text-xs text-stone-500 mt-1">Refund processed</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-50 rounded-lg">
                            <XCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <p className="text-sm text-stone-600">Rejected</p>
                    </div>
                    <p className="text-3xl font-bold">{data.failedReturns}</p>
                    <p className="text-xs text-stone-500 mt-1">Not eligible</p>
                </Card>
            </div>

            {/* Returns Table */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Return Requests</h3>
                {data.returnShipments.length === 0 ? (
                    <p className="text-center text-stone-500 py-8">No return requests found</p>
                ) : (
                    <div className="border border-stone-200 rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Return Status</TableHead>
                                    <TableHead>Refund Status</TableHead>
                                    <TableHead className="text-right">Refund Amount</TableHead>
                                    <TableHead>Requested</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.returnShipments.map((returnItem) => (
                                    <TableRow key={returnItem.id}>
                                        <TableCell className="font-mono text-xs">
                                            {returnItem.orderId.slice(0, 8)}...
                                        </TableCell>
                                        <TableCell>{returnItem.customerName || "—"}</TableCell>
                                        <TableCell className="max-w-xs truncate">
                                            {returnItem.reason}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={
                                                    STATUS_COLORS[returnItem.status] ||
                                                    "bg-gray-200 text-gray-900"
                                                }
                                            >
                                                {returnItem.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={
                                                    REFUND_STATUS_COLORS[returnItem.refundStatus] ||
                                                    "bg-gray-200 text-gray-900"
                                                }
                                            >
                                                {returnItem.refundStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {returnItem.refundAmount
                                                ? `₹${Number(returnItem.refundAmount).toFixed(2)}`
                                                : "—"}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {new Date(returnItem.requestedAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/returns/${returnItem.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Card>
        </div>
    );
}
