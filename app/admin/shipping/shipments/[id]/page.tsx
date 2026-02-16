import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Package,
    MapPin,
    Calendar,
    Truck,
    TrendingUp,
    TrendingDown,
    Download,
    ExternalLink,
    IndianRupee,
    Clock,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getShipmentDetails(id: string) {
    const shipment = await prisma.shipment.findUnique({
        where: { id },
        include: {
            order: {
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            },
        },
    });

    if (!shipment) return null;

    // Get courier performance if available
    const courierPerf = shipment.courierName
        ? await prisma.courierPerformance.findUnique({
            where: { courierName: shipment.courierName },
        })
        : null;

    return { shipment, courierPerf };
}

export default async function ShipmentDetailPage({ params }: { params: { id: string } }) {
    const data = await getShipmentDetails(params.id);

    if (!data) {
        notFound();
    }

    const { shipment, courierPerf } = data;

    // Timeline events
    const timeline = [
        { label: "Order Created", date: shipment.createdAt, completed: true },
        { label: "Pickup Scheduled", date: shipment.pickupScheduledAt, completed: !!shipment.pickupScheduledAt },
        { label: "Shipped", date: shipment.shippedAt, completed: !!shipment.shippedAt },
        { label: "Out for Delivery", date: shipment.order.updatedAt, completed: shipment.status === "OUT_FOR_DELIVERY" || shipment.status === "DELIVERED" },
        { label: "Delivered", date: shipment.deliveredAt, completed: !!shipment.deliveredAt },
    ];

    // Cost breakdown
    const subtotal = Number(shipment.order.subtotal || 0);
    const shippingCost = Number(shipment.shippingCost || 0);
    const rtoCost = Number(shipment.rtoCost || 0);
    const codFees = Number(shipment.codCollectionFee || 0);
    const profit = subtotal - shippingCost - rtoCost - codFees;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-serif text-[#1C1917]">Shipment Details</h2>
                    <p className="text-stone-600 mt-1">AWB: {shipment.awbNumber || "Not assigned"}</p>
                </div>
                <div className="flex gap-2">
                    {shipment.labelUrl && (
                        <Button variant="outline" asChild>
                            <a href={shipment.labelUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-2" />
                                Download Label
                            </a>
                        </Button>
                    )}
                    {shipment.trackingUrl && (
                        <Button variant="outline" asChild>
                            <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Track Online
                            </a>
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Timeline */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Shipment Timeline
                        </h3>
                        <div className="space-y-4">
                            {timeline.map((event, index) => (
                                <div key={index} className="flex items-start gap-4">
                                    <div className="flex flex-col items-center">
                                        <div
                                            className={`w-3 h-3 rounded-full ${event.completed ? "bg-green-500" : "bg-gray-300"
                                                }`}
                                        />
                                        {index < timeline.length - 1 && (
                                            <div className="w-0.5 h-12 bg-gray-200" />
                                        )}
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <p className="font-medium">{event.label}</p>
                                        <p className="text-sm text-stone-500">
                                            {event.date
                                                ? new Date(event.date).toLocaleString("en-IN")
                                                : "Pending"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Order Items */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Order Items
                        </h3>
                        <div className="space-y-2">
                            {shipment.order.items.map((item) => (
                                <div key={item.id} className="flex justify-between py-2 border-b">
                                    <div>
                                        <p className="font-medium">{item.product.name}</p>
                                        <p className="text-sm text-stone-500">
                                            Qty: {item.quantity} × ₹{Number(item.price).toFixed(2)}
                                        </p>
                                    </div>
                                    <p className="font-medium">₹{(Number(item.price) * item.quantity).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Cost Breakdown */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <IndianRupee className="h-5 w-5" />
                            Financial Breakdown
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Order Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-red-600">
                                <span>Shipping Cost</span>
                                <span>-₹{shippingCost.toFixed(2)}</span>
                            </div>
                            {rtoCost > 0 && (
                                <div className="flex justify-between text-red-600">
                                    <span>RTO Cost</span>
                                    <span>-₹{rtoCost.toFixed(2)}</span>
                                </div>
                            )}
                            {codFees > 0 && (
                                <div className="flex justify-between text-red-600">
                                    <span>COD Collection Fee</span>
                                    <span>-₹{codFees.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="border-t pt-2 flex justify-between font-bold text-lg">
                                <span>Net Profit Impact</span>
                                <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                                    ₹{profit.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Shipment Info */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Shipment Info</h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-stone-600">Status</p>
                                <Badge className="mt-1">{shipment.status}</Badge>
                            </div>
                            <div>
                                <p className="text-stone-600">Order ID</p>
                                <p className="font-mono">{shipment.orderId}</p>
                            </div>
                            <div>
                                <p className="text-stone-600">Courier</p>
                                <p className="font-medium">{shipment.courierName || "—"}</p>
                            </div>
                            <div>
                                <p className="text-stone-600">AWB Number</p>
                                <p className="font-mono">{shipment.awbNumber || "—"}</p>
                            </div>
                            <div>
                                <p className="text-stone-600">Payment Method</p>
                                <Badge variant={shipment.order.paymentMethod === "COD" ? "default" : "outline"}>
                                    {shipment.order.paymentMethod}
                                </Badge>
                            </div>
                        </div>
                    </Card>

                    {/* Courier Performance */}
                    {courierPerf && (
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Truck className="h-5 w-5" />
                                Courier Performance
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-stone-600">Overall Score</p>
                                    <p className="text-2xl font-bold">
                                        {Number(courierPerf.score).toFixed(1)}/100
                                    </p>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-stone-600">Success Rate</span>
                                    <span className="font-medium text-green-600">
                                        {Number(courierPerf.successRate).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-stone-600">RTO Rate</span>
                                    <span className="font-medium text-red-600">
                                        {Number(courierPerf.rtoRate).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-stone-600">Avg Delivery Time</span>
                                    <span className="font-medium">
                                        {Number(courierPerf.avgDeliveryTime).toFixed(1)} days
                                    </span>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Customer Info */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Delivery Details
                        </h3>
                        <div className="space-y-2 text-sm">
                            <p className="font-medium">{shipment.order.customerName}</p>
                            <p className="text-stone-600">{shipment.order.shippingAddress}</p>
                            <p className="text-stone-600">
                                {shipment.order.shippingState}
                            </p>
                            <p className="text-stone-600">{shipment.order.customerPhone}</p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
