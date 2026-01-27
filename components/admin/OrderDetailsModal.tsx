"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import Image from "next/image";
import { Package, User, MapPin, CreditCard, Truck, Calendar } from "lucide-react";

interface OrderItem {
    id: string;
    quantity: number;
    price: string;
    product: {
        id: string;
        name: string;
        price: string;
        images: { url: string }[];
    };
}

interface Order {
    id: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentMethod: string | null;
    total: string;
    customerName: string | null;
    customerPhone: string | null;
    shippingAddress: string | null;
    trackingNumber: string | null;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        name: string | null;
        email: string | null;
        phone: string | null;
    };
    items: OrderItem[];
}

interface OrderDetailsModalProps {
    order: Order;
    onClose: () => void;
}

export default function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-serif">Order Details</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Order Info */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-stone-50 rounded-lg">
                        <div>
                            <div className="text-xs text-stone-500 mb-1">Order ID</div>
                            <div className="font-mono text-sm">{order.id}</div>
                        </div>
                        <div>
                            <div className="text-xs text-stone-500 mb-1">Order Date</div>
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4" />
                                {formatDate(order.createdAt)}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-stone-500 mb-1">Order Status</div>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                {order.status}
                            </span>
                        </div>
                        <div>
                            <div className="text-xs text-stone-500 mb-1">Payment Status</div>
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                {order.paymentStatus}
                            </span>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="border border-stone-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <User className="h-5 w-5 text-stone-600" />
                            <h3 className="font-semibold text-lg">Customer Information</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="text-stone-500">Name:</span>{" "}
                                <span className="font-medium">
                                    {order.customerName || order.user?.name || "N/A"}
                                </span>
                            </div>
                            <div>
                                <span className="text-stone-500">Email:</span>{" "}
                                <span>{order.user?.email || "N/A"}</span>
                            </div>
                            <div>
                                <span className="text-stone-500">Phone:</span>{" "}
                                <span>{order.customerPhone || order.user?.phone || "N/A"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    {order.shippingAddress && (
                        <div className="border border-stone-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <MapPin className="h-5 w-5 text-stone-600" />
                                <h3 className="font-semibold text-lg">Shipping Address</h3>
                            </div>
                            <p className="text-sm text-stone-700">{order.shippingAddress}</p>
                        </div>
                    )}

                    {/* Payment Info */}
                    <div className="border border-stone-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <CreditCard className="h-5 w-5 text-stone-600" />
                            <h3 className="font-semibold text-lg">Payment Information</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="text-stone-500">Payment Method:</span>{" "}
                                <span className="font-medium">
                                    {order.paymentMethod || "Not specified"}
                                </span>
                            </div>
                            <div>
                                <span className="text-stone-500">Payment Status:</span>{" "}
                                <span className="font-medium">{order.paymentStatus}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tracking */}
                    {order.trackingNumber && (
                        <div className="border border-stone-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Truck className="h-5 w-5 text-stone-600" />
                                <h3 className="font-semibold text-lg">Tracking Information</h3>
                            </div>
                            <div className="text-sm">
                                <span className="text-stone-500">Tracking Number:</span>{" "}
                                <span className="font-mono font-medium">{order.trackingNumber}</span>
                            </div>
                        </div>
                    )}

                    {/* Order Items */}
                    <div className="border border-stone-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Package className="h-5 w-5 text-stone-600" />
                            <h3 className="font-semibold text-lg">Order Items</h3>
                        </div>
                        <div className="space-y-3">
                            {order.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex gap-4 p-3 bg-stone-50 rounded-lg"
                                >
                                    {item.product.images?.[0]?.url && (
                                        <div className="relative h-20 w-20 flex-shrink-0 bg-white rounded overflow-hidden">
                                            <Image
                                                src={item.product.images[0].url}
                                                alt={item.product.name}
                                                fill
                                                className="object-cover"
                                                sizes="80px"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="font-medium">{item.product.name}</div>
                                        <div className="text-sm text-stone-500 mt-1">
                                            Quantity: {item.quantity}
                                        </div>
                                        <div className="text-sm font-semibold mt-1">
                                            ₹{Number(item.price).toLocaleString()} each
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-lg">
                                            ₹{(Number(item.price) * item.quantity).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg">
                        <span className="text-lg font-semibold">Total Amount</span>
                        <span className="text-2xl font-bold text-primary">
                            ₹{Number(order.total).toLocaleString()}
                        </span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
