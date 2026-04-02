"use client";

import { useState, useEffect } from "react";
import { ShipmentStatus } from "@prisma/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Download,
    Calendar,
    XCircle,
    Eye,
    Loader2,
    Search,
    Filter,
    TrendingUp,
    TrendingDown,
    Package,
    Truck,
    AlertTriangle,
    CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface Shipment {
    id: string;
    orderId: string;
    awbNumber: string | null;
    courierName: string | null;
    status: ShipmentStatus;
    pickupScheduledAt: Date | null;
    estimatedDeliveryAt: Date | null;
    shippingCost: number | null;
    profitImpact: number | null;
    order: {
        paymentMethod: string | null;
        total: number;
        customerName: string | null;
    };
    createdAt: Date;
}

const STATUS_CONFIG: Record<ShipmentStatus, { label: string; color: string }> = {
    PENDING: { label: "Pending", color: "bg-gray-200 text-gray-800" },
    READY_TO_SHIP: { label: "Ready to Ship", color: "bg-blue-200 text-blue-800" },
    LABEL_GENERATED: { label: "Label Generated", color: "bg-blue-200 text-blue-800" },
    PICKUP_SCHEDULED: { label: "Pickup Scheduled", color: "bg-purple-200 text-purple-800" },
    PICKED_UP: { label: "Picked Up", color: "bg-indigo-200 text-indigo-800" },
    IN_TRANSIT: { label: "In Transit", color: "bg-yellow-200 text-yellow-800" },
    OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "bg-orange-200 text-orange-800" },
    DELIVERY_ATTEMPTED: { label: "Delivery Attempted", color: "bg-red-200 text-red-800" },
    NDR_RAISED: { label: "NDR Raised", color: "bg-red-300 text-red-900" },
    DELIVERED: { label: "Delivered", color: "bg-green-200 text-green-800" },
    RTO_INITIATED: { label: "RTO Initiated", color: "bg-red-200 text-red-800" },
    RTO_IN_TRANSIT: { label: "RTO In Transit", color: "bg-red-200 text-red-800" },
    RTO_DELIVERED: { label: "RTO Delivered", color: "bg-red-300 text-red-900" },
    CANCELLED: { label: "Cancelled", color: "bg-red-200 text-red-800" },
    FAILED: { label: "Failed", color: "bg-red-200 text-red-800" },
    RETURN_INITIATED: { label: "Return Initiated", color: "bg-orange-200 text-orange-800" },
    RETURN_PICKED: { label: "Return Picked", color: "bg-purple-200 text-purple-800" },
    RETURN_DELIVERED: { label: "Return Delivered", color: "bg-blue-200 text-blue-800" },
    EXCEPTION: { label: "Exception", color: "bg-red-200 text-red-800" }
};

export default function ShipmentsTable({ initialShipments }: { initialShipments: Shipment[] }) {
    const [shipments, setShipments] = useState(initialShipments);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [courierFilter, setCourierFilter] = useState<string>("ALL");
    const [codFilter, setCodFilter] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredShipments = shipments.filter((s) => {
        if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
        if (courierFilter !== "ALL" && s.courierName !== courierFilter) return false;
        if (codFilter && s.order.paymentMethod !== "COD") return false;
        if (searchQuery && !s.awbNumber?.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !s.orderId.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const uniqueCouriers = [...new Set(shipments.map((s) => s.courierName).filter(Boolean))];

    const handleSelectAll = () => {
        if (selectedIds.length === filteredShipments.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredShipments.map((s) => s.id));
        }
    };

    const handleSelectOne = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter((sid) => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBulkDownloadLabels = async () => {
        if (selectedIds.length === 0) {
            toast.error("Please select shipments first");
            return;
        }
        setLoading(true);
        try {
            const response = await fetch("/api/admin/shipments/bulk-labels", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ shipmentIds: selectedIds }),
            });

            if (!response.ok) throw new Error("Failed to download labels");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `labels-${Date.now()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("Labels downloaded successfully");
        } catch (error) {
            toast.error("Failed to download labels");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date | null) => {
        if (!date) return "—";
        return new Date(date).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-lg border border-stone-200">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                        <Input
                            placeholder="Search by AWB or Order ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        {Object.keys(STATUS_CONFIG).map((status) => (
                            <SelectItem key={status} value={status}>
                                {STATUS_CONFIG[status as ShipmentStatus].label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={courierFilter} onValueChange={setCourierFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Couriers" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Couriers</SelectItem>
                        {uniqueCouriers.map((courier) => (
                            <SelectItem key={courier} value={courier!}>
                                {courier}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={codFilter} onCheckedChange={(checked) => setCodFilter(!!checked)} />
                    <span className="text-sm font-medium">COD Only</span>
                </label>
            </div>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
                <div className="flex gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-sm font-medium text-blue-900">
                        {selectedIds.length} selected
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkDownloadLabels}
                        disabled={loading}
                        className="ml-auto"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Download Labels
                    </Button>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-lg border border-stone-200">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <Checkbox
                                    checked={selectedIds.length === filteredShipments.length && filteredShipments.length > 0}
                                    onCheckedChange={handleSelectAll}
                                />
                            </TableHead>
                            <TableHead>Order ID</TableHead>
                            <TableHead>AWB Number</TableHead>
                            <TableHead>Courier</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Pickup Date</TableHead>
                            <TableHead>Est. Delivery</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead className="text-right">Cost</TableHead>
                            <TableHead className="text-right">Profit Impact</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredShipments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center py-8 text-stone-500">
                                    No shipments found. Try adjusting your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredShipments.map((shipment) => (
                                <TableRow key={shipment.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.includes(shipment.id)}
                                            onCheckedChange={() => handleSelectOne(shipment.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                        {shipment.orderId.slice(0, 8)}...
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                        {shipment.awbNumber || "—"}
                                    </TableCell>
                                    <TableCell>{shipment.courierName || "—"}</TableCell>
                                    <TableCell>
                                        <Badge className={STATUS_CONFIG[shipment.status].color}>
                                            {STATUS_CONFIG[shipment.status].label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">{formatDate(shipment.pickupScheduledAt)}</TableCell>
                                    <TableCell className="text-sm">{formatDate(shipment.estimatedDeliveryAt)}</TableCell>
                                    <TableCell>
                                        <Badge variant={shipment.order.paymentMethod === "COD" ? "default" : "outline"}>
                                            {shipment.order.paymentMethod || "—"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        ₹{shipment.shippingCost?.toFixed(2) || "0.00"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={shipment.profitImpact && shipment.profitImpact < 0 ? "text-red-600" : "text-green-600"}>
                                            {shipment.profitImpact !== null ? `₹${shipment.profitImpact.toFixed(2)}` : "—"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/admin/shipping/shipments/${shipment.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
