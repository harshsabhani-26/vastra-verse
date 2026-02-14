"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft, User, MapPin, CreditCard, Package, Clock,
    Truck, MessageCircle, Mail, Ban, RotateCcw, FileText, Pencil, Loader2, Download, CheckCircle
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import InvoiceEmailModal from "@/components/admin/InvoiceEmailModal";

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

interface OrderNote {
    id: string;
    content: string;
    createdBy: string;
    createdAt: string;
}

interface TimelineEvent {
    id: string;
    event: string;
    details: string | null;
    createdBy: string | null;
    createdAt: string;
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
    courierName: string | null;
    cancellationReason: string | null;
    cancelledAt: string | null;
    refundStatus: string;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        name: string | null;
        email: string | null;
        phone: string | null;
    };
    items: OrderItem[];
    notes: OrderNote[];
    timeline: TimelineEvent[];
}

const STATUS_COLORS: Record<OrderStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    PACKED: "bg-purple-100 text-purple-800",
    SHIPPED: "bg-indigo-100 text-indigo-800",
    DELIVERED: "bg-green-100 text-green-800",
    RETURNED: "bg-orange-100 text-orange-800",
    CANCELLED: "bg-red-100 text-red-800",
};

export default function OrderDetailsClient({ order }: { order: Order }) {
    const router = useRouter();
    const [courierName, setCourierName] = useState(order.courierName || "");
    const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "");
    const [newNote, setNewNote] = useState("");
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [cancellationReason, setCancellationReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    // Invoice state
    const [invoiceState, setInvoiceState] = useState<"idle" | "generating" | "downloading" | "done" | "error">("idle");
    const [emailModalOpen, setEmailModalOpen] = useState(false);

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

    const handleUpdateTracking = async () => {
        setIsProcessing(true);
        try {
            const response = await fetch(`/api/admin/orders/${order.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trackingNumber, courierName }),
            });

            if (response.ok) {
                router.refresh();
            } else {
                alert("Failed to update tracking information");
            }
        } catch (error) {
            alert("Failed to update tracking information");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;

        setIsProcessing(true);
        try {
            const response = await fetch(`/api/admin/orders/${order.id}/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newNote, createdBy: "Admin" }),
            });

            if (response.ok) {
                setNewNote("");
                router.refresh();
            } else {
                alert("Failed to add note");
            }
        } catch (error) {
            alert("Failed to add note");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!cancellationReason.trim()) {
            alert("Please provide a cancellation reason");
            return;
        }

        setIsProcessing(true);
        try {
            const response = await fetch(`/api/admin/orders/${order.id}/cancel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: cancellationReason, cancelledBy: "Admin" }),
            });

            if (response.ok) {
                setCancelDialogOpen(false);
                router.refresh();
            } else {
                const error = await response.json();
                alert(error.error || "Failed to cancel order");
            }
        } catch (error) {
            alert("Failed to cancel order");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleWhatsApp = () => {
        const phone = order.customerPhone || order.user.phone;
        if (!phone) {
            alert("No phone number available");
            return;
        }

        const cleanPhone = phone.replace(/[^0-9]/g, "");
        const message = `Hello ${order.customerName || order.user.name || "Customer"},

Your order ${order.id} status: ${order.status}
Total: ₹${Number(order.total).toLocaleString()}

${trackingNumber ? `Tracking: ${trackingNumber}` : ""}

Thank you for your order!

M & H Team`;

        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/orders">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Orders
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-serif text-[#1C1917]">Order Details</h1>
                        <p className="text-sm text-stone-500 mt-1">Order ID: {order.id}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[order.status]}`}>
                        {order.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Left Column (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Information */}
                    <div className="bg-white rounded-lg border border-stone-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <User className="h-5 w-5 text-stone-600" />
                            <h3 className="font-semibold text-lg">Customer Information</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-stone-500">Name:</span>{" "}
                                <span className="font-medium">{order.customerName || order.user?.name || "N/A"}</span>
                            </div>
                            <div>
                                <span className="text-stone-500">Email:</span>{" "}
                                <span>{order.user?.email || "N/A"}</span>
                            </div>
                            <div>
                                <span className="text-stone-500">Phone:</span>{" "}
                                <span>{order.customerPhone || order.user?.phone || "N/A"}</span>
                            </div>
                            <div>
                                <span className="text-stone-500">Order Date:</span>{" "}
                                <span>{formatDate(order.createdAt)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    {order.shippingAddress && (
                        <div className="bg-white rounded-lg border border-stone-200 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <MapPin className="h-5 w-5 text-stone-600" />
                                <h3 className="font-semibold text-lg">Shipping Address</h3>
                            </div>
                            <p className="text-sm text-stone-700">{order.shippingAddress}</p>
                        </div>
                    )}

                    {/* Order Items */}
                    <div className="bg-white rounded-lg border border-stone-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Package className="h-5 w-5 text-stone-600" />
                            <h3 className="font-semibold text-lg">Order Items</h3>
                        </div>
                        <div className="space-y-4">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex gap-4 p-3 bg-stone-50 rounded-lg">
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
                                        <div className="text-sm text-stone-500 mt-1">Quantity: {item.quantity}</div>
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

                        {/* Price Summary */}
                        <div className="mt-6 space-y-2 border-t pt-4">
                            <div className="flex justify-between text-lg font-semibold">
                                <span>Total Amount</span>
                                <span className="text-primary">₹{Number(order.total).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Information */}
                    <div className="bg-white rounded-lg border border-stone-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <CreditCard className="h-5 w-5 text-stone-600" />
                            <h3 className="font-semibold text-lg">Payment Information</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="text-stone-500">Payment Method:</span>{" "}
                                <span className="font-medium">{order.paymentMethod || "Not specified"}</span>
                            </div>
                            <div>
                                <span className="text-stone-500">Payment Status:</span>{" "}
                                <span className="font-medium">{order.paymentStatus}</span>
                            </div>
                            <div>
                                <span className="text-stone-500">Refund Status:</span>{" "}
                                <span className="font-medium">{order.refundStatus}</span>
                            </div>
                        </div>
                    </div>

                    {/* Courier & Tracking */}
                    <div className="bg-white rounded-lg border border-stone-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Truck className="h-5 w-5 text-stone-600" />
                            <h3 className="font-semibold text-lg">Courier & Tracking</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-stone-500 mb-1 block">Courier Name</label>
                                    <Input
                                        value={courierName}
                                        onChange={(e) => setCourierName(e.target.value)}
                                        placeholder="e.g., FedEx, BlueDart"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-stone-500 mb-1 block">Tracking Number</label>
                                    <Input
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value)}
                                        placeholder="Enter tracking number"
                                    />
                                </div>
                            </div>
                            <Button
                                onClick={handleUpdateTracking}
                                disabled={isProcessing}
                                className="w-full"
                            >
                                Update Tracking Information
                            </Button>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white rounded-lg border border-stone-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="h-5 w-5 text-stone-600" />
                            <h3 className="font-semibold text-lg">Order Timeline</h3>
                        </div>
                        <div className="space-y-4">
                            {order.timeline.length === 0 ? (
                                <p className="text-sm text-stone-500">No timeline events yet</p>
                            ) : (
                                order.timeline.map((event, index) => (
                                    <div key={event.id} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="h-3 w-3 rounded-full bg-primary" />
                                            {index < order.timeline.length - 1 && (
                                                <div className="h-full w-px bg-stone-300 my-1" />
                                            )}
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <div className="font-medium">{event.event}</div>
                                            {event.details && (
                                                <div className="text-sm text-stone-600 mt-1">{event.details}</div>
                                            )}
                                            <div className="text-xs text-stone-500 mt-1">
                                                {formatDate(event.createdAt)}
                                                {event.createdBy && ` • by ${event.createdBy}`}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Admin Notes */}
                    <div className="bg-white rounded-lg border border-stone-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="h-5 w-5 text-stone-600" />
                            <h3 className="font-semibold text-lg">Admin Notes</h3>
                        </div>
                        <div className="space-y-4">
                            {/* Add Note Form */}
                            <div>
                                <Textarea
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="Add a note..."
                                    rows={3}
                                />
                                <Button
                                    onClick={handleAddNote}
                                    disabled={!newNote.trim() || isProcessing}
                                    className="mt-2"
                                    size="sm"
                                >
                                    Add Note
                                </Button>
                            </div>

                            {/* Notes List */}
                            {order.notes.length === 0 ? (
                                <p className="text-sm text-stone-500">No notes yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {order.notes.map((note) => (
                                        <div key={note.id} className="p-3 bg-stone-50 rounded-lg">
                                            <div className="text-sm">{note.content}</div>
                                            <div className="text-xs text-stone-500 mt-2">
                                                {formatDate(note.createdAt)} • by {note.createdBy}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions Sidebar - Right Column (1/3) */}
                <div className="space-y-6">
                    {/* Invoice Actions */}
                    <div className="bg-white rounded-lg border border-stone-200 p-6">
                        <h3 className="font-semibold mb-4">Invoice</h3>
                        <div className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                disabled={invoiceState === "generating" || invoiceState === "downloading"}
                                onClick={async () => {
                                    setInvoiceState("generating");
                                    try {
                                        const response = await fetch(`/api/admin/orders/${order.id}/invoice?mode=download`, { method: "POST" });
                                        if (!response.ok) throw new Error("Failed to generate invoice");
                                        setInvoiceState("downloading");
                                        const blob = await response.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        const link = document.createElement("a");
                                        link.href = url;
                                        link.download = `invoice-${order.id}.pdf`;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        window.URL.revokeObjectURL(url);
                                        setInvoiceState("done");
                                        setEmailModalOpen(true);
                                        setTimeout(() => setInvoiceState("idle"), 3000);
                                    } catch (error: any) {
                                        setInvoiceState("error");
                                        alert(error.message || "Error generating invoice");
                                        setTimeout(() => setInvoiceState("idle"), 3000);
                                    }
                                }}
                            >
                                {invoiceState === "generating" ? (
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                                ) : invoiceState === "downloading" ? (
                                    <><Download className="h-4 w-4 mr-2 animate-bounce" /> Downloading...</>
                                ) : invoiceState === "done" ? (
                                    <><CheckCircle className="h-4 w-4 mr-2 text-green-600" /> Downloaded!</>
                                ) : (
                                    <><FileText className="h-4 w-4 mr-2" /> Download Invoice</>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Communication Actions */}
                    <div className="bg-white rounded-lg border border-stone-200 p-6">
                        <h3 className="font-semibold mb-4">Communication</h3>
                        <div className="space-y-2">
                            <Button
                                onClick={handleWhatsApp}
                                variant="outline"
                                className="w-full justify-start text-green-600 border-green-600 hover:bg-green-50"
                            >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Send WhatsApp
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => {
                                    setEmailModalOpen(true);
                                }}
                            >
                                <Mail className="h-4 w-4 mr-2" />
                                Email Invoice
                            </Button>
                        </div>
                    </div>

                    {/* Order Actions */}
                    {order.status !== "CANCELLED" && (
                        <div className="bg-white rounded-lg border border-stone-200 p-6">
                            <h3 className="font-semibold mb-4">Order Actions</h3>
                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-red-600 border-red-600 hover:bg-red-50"
                                    onClick={() => setCancelDialogOpen(true)}
                                >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Cancel Order
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Cancellation Info */}
                    {order.status === "CANCELLED" && order.cancellationReason && (
                        <div className="bg-red-50 rounded-lg border border-red-200 p-6">
                            <h3 className="font-semibold text-red-800 mb-2">Order Cancelled</h3>
                            <p className="text-sm text-red-700 mb-2">{order.cancellationReason}</p>
                            <p className="text-xs text-red-600">
                                Cancelled on: {order.cancelledAt ? formatDate(order.cancelledAt) : "N/A"}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Cancel Order Dialog */}
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent aria-describedby="cancel-order-description">
                    <DialogHeader>
                        <DialogTitle>Cancel Order</DialogTitle>
                        <p id="cancel-order-description" className="sr-only">
                            Cancel order {order.id} and restore stock
                        </p>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Cancellation Reason</label>
                            <Textarea
                                value={cancellationReason}
                                onChange={(e) => setCancellationReason(e.target.value)}
                                placeholder="Enter reason for cancellation..."
                                rows={4}
                            />
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                            ⚠️ Cancelling this order will automatically restore stock for all items.
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCancelOrder}
                            disabled={!cancellationReason.trim() || isProcessing}
                        >
                            {isProcessing ? "Cancelling..." : "Confirm Cancellation"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Invoice Email Modal */}
            <InvoiceEmailModal
                open={emailModalOpen}
                onClose={() => setEmailModalOpen(false)}
                orderId={order.id}
                customerEmail={order.user?.email || ""}
            />
        </div>
    );
}
