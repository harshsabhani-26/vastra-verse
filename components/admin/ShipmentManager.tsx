"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Package,
    Truck,
    Calendar,
    Download,
    XCircle,
    ExternalLink,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";

interface Shipment {
    id: string;
    awbNumber?: string;
    courierName?: string;
    labelUrl?: string;
    trackingUrl?: string;
    status: string;
    pickupScheduledAt?: Date | string;
    shippedAt?: Date | string;
    deliveredAt?: Date | string;
    estimatedDeliveryAt?: Date | string;
}

interface ShipmentManagerProps {
    orderId: string;
    orderStatus: string;
    existingShipment?: Shipment | null;
    onShipmentCreated?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
    PENDING: { label: "Pending", icon: Clock, color: "bg-gray-100 text-gray-800" },
    READY_TO_SHIP: { label: "Ready to Ship", icon: Package, color: "bg-blue-100 text-blue-800" },
    PICKUP_SCHEDULED: { label: "Pickup Scheduled", icon: Calendar, color: "bg-purple-100 text-purple-800" },
    IN_TRANSIT: { label: "In Transit", icon: Truck, color: "bg-yellow-100 text-yellow-800" },
    OUT_FOR_DELIVERY: { label: "Out for Delivery", icon: Truck, color: "bg-orange-100 text-orange-800" },
    DELIVERED: { label: "Delivered", icon: CheckCircle2, color: "bg-green-100 text-green-800" },
    CANCELLED: { label: "Cancelled", icon: XCircle, color: "bg-red-100 text-red-800" },
    FAILED: { label: "Failed", icon: AlertCircle, color: "bg-red-100 text-red-800" },
    RETURN_INITIATED: { label: "Return Initiated", icon: AlertCircle, color: "bg-orange-100 text-orange-800" },
    RETURN_PICKED: { label: "Return Picked", icon: Truck, color: "bg-purple-100 text-purple-800" },
    RETURN_DELIVERED: { label: "Return Delivered", icon: CheckCircle2, color: "bg-blue-100 text-blue-800" }
};

export default function ShipmentManager({
    orderId,
    orderStatus,
    existingShipment,
    onShipmentCreated
}: ShipmentManagerProps) {
    const [shipment, setShipment] = useState<Shipment | null | undefined>(existingShipment);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const canCreateShipment = !shipment && ["CONFIRMED", "PACKED"].includes(orderStatus);

    const [serviceability, setServiceability] = useState<any[]>([]);

    const handleCheckServiceability = async () => {
        setActionLoading("serviceability");
        try {
            // Fetch order details to get pincode/weight (mocking for now or needs to be passed in)
            // In a real scenario, these checks should be done with actual order data
            const response = await fetch(`/api/admin/orders/${orderId}`);
            const orderData = await response.json();

            if (!orderData || !orderData.shippingAddress) {
                toast.error("Order missing shipping address");
                return;
            }

            // Extract pincode (assuming address format has it, or use a placeholder if structured)
            const deliveryPostcode = orderData.shippingAddress.match(/\d{6}/)?.[0];

            if (!deliveryPostcode) {
                toast.error("Could not extract pincode from address");
                return;
            }

            const query = new URLSearchParams({
                pickupPostcode: "395006", // Default warehouse pincode - should be configurable
                deliveryPostcode,
                weight: "0.5", // Default weight - should be calculated
                cod: orderData.paymentMethod === "COD" ? "true" : "false"
            });

            const servResponse = await fetch(`/api/shipping/serviceability?${query}`);
            const servData = await servResponse.json();

            if (!servResponse.ok) {
                throw new Error(servData.error || "Failed to check serviceability");
            }

            setServiceability(servData.couriers);
            toast.success(`Found ${servData.couriers.length} available couriers`);

        } catch (error: any) {
            toast.error(error.message || "Failed to check serviceability");
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreateShipment = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/admin/shipments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create shipment");
            }

            setShipment(data.shipment);
            toast.success("Shipment created successfully!");
            onShipmentCreated?.();
        } catch (error: any) {
            toast.error(error.message || "Failed to create shipment");
        } finally {
            setLoading(false);
        }
    };

    const handleSchedulePickup = async () => {
        if (!shipment) return;

        setActionLoading("pickup");
        try {
            const response = await fetch(`/api/admin/shipments/${shipment.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "SCHEDULE_PICKUP" })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to schedule pickup");
            }

            toast.success(`Pickup scheduled for ${data.pickupDate}`);
            setShipment({ ...shipment, status: "PICKUP_SCHEDULED", pickupScheduledAt: data.pickupDate });
        } catch (error: any) {
            toast.error(error.message || "Failed to schedule pickup");
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancelShipment = async () => {
        if (!shipment) return;
        if (!confirm("Are you sure you want to cancel this shipment?")) return;

        const reason = prompt("Cancellation reason (optional):");

        setActionLoading("cancel");
        try {
            const response = await fetch(`/api/admin/shipments/${shipment.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "CANCEL", reason })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to cancel shipment");
            }

            toast.success("Shipment cancelled successfully");
            setShipment({ ...shipment, status: "CANCELLED" });
            onShipmentCreated?.();
        } catch (error: any) {
            toast.error(error.message || "Failed to cancel shipment");
        } finally {
            setActionLoading(null);
        }
    };

    const statusConfig = shipment ? STATUS_CONFIG[shipment.status] : null;
    const StatusIcon = statusConfig?.icon;

    return (
        <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-stone-900">Shipment Details</h3>
                {shipment && statusConfig && (
                    <Badge className={statusConfig.color}>
                        {StatusIcon && <StatusIcon className="w-4 h-4 mr-1" />}
                        {statusConfig.label}
                    </Badge>
                )}
            </div>

            {!shipment && (
                <div className="text-center py-8">
                    {canCreateShipment ? (
                        <>
                            <Package className="w-12 h-12 mx-auto text-stone-400 mb-3" />
                            <p className="text-sm text-stone-600 mb-4">
                                No shipment created for this order yet.
                            </p>
                            <Button onClick={handleCreateShipment} disabled={loading}>
                                {loading ? "Creating..." : "Create Shipment"}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={handleCheckServiceability}
                                disabled={!!actionLoading}
                                className="ml-2"
                            >
                                {actionLoading === "serviceability" ? "Checking..." : "Check Serviceability"}
                            </Button>

                            {serviceability.length > 0 && (
                                <div className="mt-4 text-left max-h-40 overflow-y-auto border p-2 rounded text-xs">
                                    <p className="font-semibold mb-1">Available Couriers:</p>
                                    {serviceability.slice(0, 3).map((c: any) => (
                                        <div key={c.courier_id} className="flex justify-between py-1 border-b last:border-0">
                                            <span>{c.courier_name}</span>
                                            <span>₹{c.rate}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <AlertCircle className="w-12 h-12 mx-auto text-stone-400 mb-3" />
                            <p className="text-sm text-stone-600">
                                Order must be confirmed or packed to create shipment.
                            </p>
                        </>
                    )}
                </div>
            )}

            {shipment && (
                <>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        {shipment.awbNumber && (
                            <div>
                                <span className="text-stone-500">AWB Number:</span>
                                <p className="font-mono font-semibold">{shipment.awbNumber}</p>
                            </div>
                        )}
                        {shipment.courierName && (
                            <div>
                                <span className="text-stone-500">Courier:</span>
                                <p className="font-semibold">{shipment.courierName}</p>
                            </div>
                        )}
                        {shipment.pickupScheduledAt && (
                            <div className="col-span-2">
                                <span className="text-stone-500">Pickup Scheduled:</span>
                                <p className="font-semibold">
                                    {new Date(shipment.pickupScheduledAt).toLocaleString()}
                                </p>
                            </div>
                        )}
                        {shipment.estimatedDeliveryAt && (
                            <div className="col-span-2">
                                <span className="text-stone-500">Estimated Delivery:</span>
                                <p className="font-semibold">
                                    {new Date(shipment.estimatedDeliveryAt).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-4 border-t border-stone-200">
                        {shipment.labelUrl && (
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="flex items-center gap-2"
                            >
                                <a href={shipment.labelUrl} target="_blank" rel="noopener noreferrer">
                                    <Download className="w-4 h-4" />
                                    Download Label
                                </a>
                            </Button>
                        )}

                        {shipment.trackingUrl && (
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="flex items-center gap-2"
                            >
                                <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-4 h-4" />
                                    Track Shipment
                                </a>
                            </Button>
                        )}

                        {shipment.status === "READY_TO_SHIP" && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSchedulePickup}
                                disabled={actionLoading === "pickup"}
                                className="flex items-center gap-2"
                            >
                                {actionLoading === "pickup" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                                Schedule Pickup
                            </Button>
                        )}

                        {!["DELIVERED", "CANCELLED", "RETURN_DELIVERED"].includes(shipment.status) && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleCancelShipment}
                                disabled={actionLoading === "cancel"}
                                className="flex items-center gap-2"
                            >
                                {actionLoading === "cancel" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                Cancel Shipment
                            </Button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
