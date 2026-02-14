"use client";

import { useState, useEffect } from "react";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Eye, FileText, MessageCircle, Loader2, Download, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
    user: {
        id: string;
        name: string | null;
        email: string | null;
        phone: string | null;
    };
    items: OrderItem[];
}

interface OrdersListClientProps {
    initialOrders: Order[];
    loading?: boolean;
}

const ORDER_STATUS_FLOW: OrderStatus[] = [
    "PENDING",
    "CONFIRMED",
    "PACKED",
    "SHIPPED",
    "DELIVERED",
    "RETURNED",
    "CANCELLED",
];

const STATUS_COLORS: Record<OrderStatus, string> = {
    PENDING: "bg-yellow-200 text-yellow-900 border border-yellow-300",
    CONFIRMED: "bg-blue-200 text-blue-900 border border-blue-300",
    PACKED: "bg-purple-200 text-purple-900 border border-purple-300",
    SHIPPED: "bg-indigo-200 text-indigo-900 border border-indigo-300",
    DELIVERED: "bg-green-200 text-green-900 border border-green-300",
    RETURNED: "bg-orange-200 text-orange-900 border border-orange-300",
    CANCELLED: "bg-red-200 text-red-900 border border-red-300",
};

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
    PENDING: "bg-yellow-200 text-yellow-900 border border-yellow-400",
    PAID: "bg-green-200 text-green-900 border border-green-400",
    REFUNDED: "bg-gray-200 text-gray-900 border border-gray-400",
    FAILED: "bg-red-200 text-red-900 border border-red-400",
};

type InvoiceState = "idle" | "generating" | "downloading" | "done" | "error";

export default function OrdersListClient({ initialOrders, loading = false }: OrdersListClientProps) {
    const router = useRouter();
    const [orders, setOrders] = useState(initialOrders);
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

    // Invoice state
    const [invoiceStates, setInvoiceStates] = useState<Record<string, InvoiceState>>({});
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [emailModalOrderId, setEmailModalOrderId] = useState<string>("");
    const [emailModalEmail, setEmailModalEmail] = useState<string>("");

    // Update orders when initialOrders changes
    useEffect(() => {
        setOrders(initialOrders);
    }, [initialOrders]);

    const setInvoiceState = (orderId: string, state: InvoiceState) => {
        setInvoiceStates(prev => ({ ...prev, [orderId]: state }));
    };

    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
        setUpdatingOrderId(orderId);

        try {
            const response = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                setOrders(orders.map((order) =>
                    order.id === orderId ? { ...order, status: newStatus } : order
                ));
                router.refresh();
            } else {
                const errorData = await response.json();
                alert(`Failed to update status: ${errorData.error || response.statusText}`);
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update order status");
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const handlePaymentStatusChange = async (orderId: string, newStatus: PaymentStatus) => {
        setUpdatingOrderId(orderId);

        try {
            const response = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentStatus: newStatus }),
            });

            if (response.ok) {
                setOrders(orders.map((order) =>
                    order.id === orderId ? { ...order, paymentStatus: newStatus } : order
                ));
                router.refresh();
                alert(`Payment status updated to ${newStatus}`);
            } else {
                const errorData = await response.json();
                alert(`Failed to update payment status: ${errorData.error || response.statusText}`);
            }
        } catch (error) {
            console.error("Error updating payment status:", error);
            alert("Failed to update payment status");
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const handleWhatsApp = (order: Order) => {
        const phone = order.customerPhone || order.user.phone;
        if (!phone) {
            alert("No phone number available for this customer");
            return;
        }

        // Remove special characters from phone number
        const cleanPhone = phone.replace(/[^0-9]/g, "");
        const message = `Hello ${order.customerName || order.user.name || "Customer"},

Thank you for your order (Order ID: ${order.id}).

Your order status: ${order.status}
Total Amount: ₹${Number(order.total).toLocaleString()}

We'll keep you updated on your order progress.

Best regards,
M & H Team`;

        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");
    };

    const handleInvoice = async (order: Order) => {
        // Prevent double-click
        if (invoiceStates[order.id] === "generating" || invoiceStates[order.id] === "downloading") {
            return;
        }

        setInvoiceState(order.id, "generating");

        try {
            // Step 1: Download PDF
            const response = await fetch(`/api/admin/orders/${order.id}/invoice?mode=download`, {
                method: "POST",
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Failed to generate invoice" }));
                throw new Error(errorData.error || "Failed to generate invoice");
            }

            setInvoiceState(order.id, "downloading");

            // Step 2: Auto-download the PDF
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `invoice-${order.id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setInvoiceState(order.id, "done");

            // Step 3: Show email modal after download
            const customerEmail = order.user?.email || "";
            setEmailModalOrderId(order.id);
            setEmailModalEmail(customerEmail);
            setEmailModalOpen(true);

            // Reset button state after 3 seconds
            setTimeout(() => {
                setInvoiceState(order.id, "idle");
            }, 3000);

        } catch (error: any) {
            console.error("Invoice Error:", error);
            setInvoiceState(order.id, "error");
            alert(error.message || "Error generating invoice");

            // Reset error state after 3 seconds
            setTimeout(() => {
                setInvoiceState(order.id, "idle");
            }, 3000);
        }
    };

    const getInvoiceButtonContent = (orderId: string) => {
        const state = invoiceStates[orderId] || "idle";
        switch (state) {
            case "generating":
                return (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="sr-only">Generating...</span>
                    </>
                );
            case "downloading":
                return (
                    <>
                        <Download className="h-4 w-4 animate-bounce" />
                        <span className="sr-only">Downloading...</span>
                    </>
                );
            case "done":
                return (
                    <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="sr-only">Done</span>
                    </>
                );
            case "error":
                return (
                    <>
                        <FileText className="h-4 w-4 text-red-500" />
                        <span className="sr-only">Error</span>
                    </>
                );
            default:
                return (
                    <>
                        <FileText className="h-4 w-4" />
                        <span className="sr-only">Generate Invoice</span>
                    </>
                );
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <>
            <div className="bg-white rounded-lg border border-stone-200">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Payment Status</TableHead>
                            <TableHead>Order Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-stone-500">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    <p className="mt-2">Loading orders...</p>
                                </TableCell>
                            </TableRow>
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-stone-500">
                                    No orders found. Try adjusting your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium text-[#1C1917] font-mono text-xs">
                                        {order.id.slice(0, 8)}...
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">
                                                {order.customerName || order.user?.name || "Guest"}
                                            </div>
                                            <div className="text-xs text-stone-500">
                                                {order.user?.email}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {formatDate(order.createdAt)}
                                    </TableCell>
                                    <TableCell>{order.items.length}</TableCell>
                                    <TableCell className="font-semibold">
                                        ₹{Number(order.total).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={order.paymentStatus}
                                            onValueChange={(value) =>
                                                handlePaymentStatusChange(order.id, value as PaymentStatus)
                                            }
                                            disabled={updatingOrderId === order.id}
                                        >
                                            <SelectTrigger
                                                className={`w-[120px] h-8 text-xs ${PAYMENT_STATUS_COLORS[order.paymentStatus]} border-0`}
                                            >
                                                {updatingOrderId === order.id ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <SelectValue />
                                                )}
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border border-stone-200 shadow-xl z-50">
                                                {Object.keys(PAYMENT_STATUS_COLORS).map((status) => (
                                                    <SelectItem
                                                        key={status}
                                                        value={status}
                                                        className="hover:bg-stone-50 cursor-pointer py-2 text-xs focus:bg-stone-100"
                                                    >
                                                        {status}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={order.status}
                                            onValueChange={(value) =>
                                                handleStatusChange(order.id, value as OrderStatus)
                                            }
                                            disabled={updatingOrderId === order.id}
                                        >
                                            <SelectTrigger
                                                className={`w-[130px] h-8 text-xs ${STATUS_COLORS[order.status]} border-0`}
                                            >
                                                {updatingOrderId === order.id ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <SelectValue />
                                                )}
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border border-stone-200 shadow-xl z-50">
                                                {ORDER_STATUS_FLOW.map((status) => (
                                                    <SelectItem
                                                        key={status}
                                                        value={status}
                                                        className="hover:bg-stone-50 cursor-pointer py-2 text-xs focus:bg-stone-100"
                                                    >
                                                        {status}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                title="View Details"
                                                asChild
                                            >
                                                <Link href={`/admin/orders/${order.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleInvoice(order)}
                                                title="Generate & Download Invoice"
                                                disabled={
                                                    invoiceStates[order.id] === "generating" ||
                                                    invoiceStates[order.id] === "downloading"
                                                }
                                            >
                                                {getInvoiceButtonContent(order.id)}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleWhatsApp(order)}
                                                title="Send WhatsApp"
                                                className="text-green-600"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="h-4 w-4"
                                                >
                                                    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                                                    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
                                                </svg>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Invoice Email Modal */}
            <InvoiceEmailModal
                open={emailModalOpen}
                onClose={() => setEmailModalOpen(false)}
                orderId={emailModalOrderId}
                customerEmail={emailModalEmail}
            />
        </>
    );
}
