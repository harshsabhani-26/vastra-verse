"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Package, RotateCcw, X, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface OrderItem {
    id: string;
    productId: string;
    quantity: number;
    price: string;
    product: {
        name: string;
        images?: Array<{ url: string }>;
    };
}

interface ReturnRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
}

const RETURN_REASONS = [
    { value: "DEFECTIVE", label: "Defective Product" },
    { value: "WRONG_PRODUCT", label: "Wrong Product Received" },
    { value: "DAMAGED", label: "Damaged in Transit" },
    { value: "SIZE_ISSUE", label: "Size / Fit Issue" },
    { value: "NOT_AS_DESCRIBED", label: "Not as Described" },
    { value: "OTHER", label: "Other" },
];

export default function ReturnRequestModal({ isOpen, onClose, orderId }: ReturnRequestModalProps) {
    const router = useRouter();
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Record<string, { selected: boolean; quantity: number }>>({});
    const [reason, setReason] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (isOpen && orderId) {
            fetchOrderItems();
            setReason("");
            setDescription("");
            setError("");
            setSuccess(false);
        }
    }, [isOpen, orderId]);

    const fetchOrderItems = async () => {
        setLoadingItems(true);
        try {
            const response = await fetch(`/api/user/orders/${orderId}`);
            const data = await response.json();

            if (response.ok && data.items) {
                setOrderItems(data.items);
                const initialSelection: Record<string, { selected: boolean; quantity: number }> = {};
                data.items.forEach((item: OrderItem) => {
                    initialSelection[item.id] = { selected: false, quantity: 1 };
                });
                setSelectedItems(initialSelection);
            }
        } catch (err) {
            console.error("Failed to fetch order items:", err);
        } finally {
            setLoadingItems(false);
        }
    };

    const toggleItemSelection = (itemId: string) => {
        setSelectedItems(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                selected: !prev[itemId].selected
            }
        }));
    };

    const updateItemQuantity = (itemId: string, quantity: number) => {
        const item = orderItems.find(i => i.id === itemId);
        if (!item) return;
        const maxQty = item.quantity;
        const validQty = Math.max(1, Math.min(quantity, maxQty));
        setSelectedItems(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], quantity: validQty }
        }));
    };

    const handleSubmit = async () => {
        const selectedItemsList = Object.entries(selectedItems)
            .filter(([_, data]) => data.selected)
            .map(([itemId, data]) => ({
                orderItemId: itemId,
                quantity: data.quantity
            }));

        if (selectedItemsList.length === 0) {
            setError("Please select at least one item to return.");
            return;
        }
        if (!reason) {
            setError("Please select a reason for the return.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const response = await fetch(`/api/user/orders/${orderId}/return`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: selectedItemsList, reason, description }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit return request");
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
                router.refresh();
            }, 2200);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedCount = Object.values(selectedItems).filter(item => item.selected).length;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="p-0 gap-0 sm:max-w-[580px] max-h-[92vh] overflow-hidden rounded-sm border border-primary/10 shadow-luxury-xl bg-white">
                <DialogTitle className="sr-only">Request Return</DialogTitle>

                {/* Header */}
                <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-primary/8 bg-[#FAF9F7]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200/60 flex items-center justify-center">
                            <RotateCcw className="w-4 h-4 text-amber-700" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="font-serif text-primary text-xl tracking-tight leading-tight">Request Return</h2>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted mt-0.5">Select items &amp; provide a reason</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:text-primary hover:bg-primary/5 transition-all"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Success State */}
                {success ? (
                    <div className="flex flex-col items-center justify-center py-16 px-8 text-center animate-fade-in-up">
                        <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200/60 flex items-center justify-center mb-5">
                            <CheckCircle2 className="w-8 h-8 text-green-600" strokeWidth={1.5} />
                        </div>
                        <h3 className="font-serif text-primary text-xl mb-2 tracking-tight">Return Requested</h3>
                        <p className="text-sm text-text-muted font-light leading-relaxed">
                            Your return request has been submitted.<br />Our team will review it shortly.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-y-auto max-h-[calc(92vh-140px)]">
                        <div className="px-8 py-6 space-y-7">

                            {/* Items Selection */}
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary mb-3">
                                    Select Items to Return
                                </p>

                                {loadingItems ? (
                                    <div className="flex items-center justify-center py-12 border border-primary/8 rounded-sm bg-surface/20">
                                        <Loader2 className="h-5 w-5 animate-spin text-primary/40" />
                                    </div>
                                ) : (
                                    <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-0.5">
                                        {orderItems.map((item) => {
                                            const isSelected = selectedItems[item.id]?.selected || false;
                                            return (
                                                <div
                                                    key={item.id}
                                                    role="checkbox"
                                                    aria-checked={isSelected}
                                                    tabIndex={0}
                                                    onClick={() => toggleItemSelection(item.id)}
                                                    onKeyDown={(e) => e.key === " " || e.key === "Enter" ? toggleItemSelection(item.id) : null}
                                                    className={`w-full flex items-start gap-4 p-4 border rounded-sm text-left cursor-pointer transition-all duration-200 group ${
                                                        isSelected
                                                            ? "border-primary/30 bg-[#FAF9F7] shadow-sm"
                                                            : "border-primary/8 hover:border-primary/20 hover:bg-[#FAFAFA]"
                                                    }`}
                                                >
                                                    {/* Custom Checkbox */}
                                                    <div className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded-sm border transition-all duration-200 flex items-center justify-center ${
                                                        isSelected ? "bg-primary border-primary" : "border-primary/25 bg-white group-hover:border-primary/40"
                                                    }`}>
                                                        {isSelected && (
                                                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                                                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        )}
                                                    </div>

                                                    {/* Product Image */}
                                                    <div className="w-14 h-18 bg-secondary/5 rounded-sm overflow-hidden shrink-0 border border-primary/5" style={{ height: 72 }}>
                                                        {item.product.images && item.product.images.length > 0 ? (
                                                            <Image
                                                                src={item.product.images[0].url}
                                                                alt={item.product.name}
                                                                width={56}
                                                                height={72}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-primary/20">
                                                                <Package size={18} />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Product Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-serif text-primary text-sm leading-tight mb-1 truncate">{item.product.name}</p>
                                                        <p className="text-[10px] uppercase tracking-wider text-text-muted">
                                                            Qty: {item.quantity} &nbsp;·&nbsp; ₹{Number(item.price).toLocaleString('en-IN')}
                                                        </p>

                                                        {/* Qty selector appears when selected */}
                                                        {isSelected && (
                                                            <div
                                                                className="flex items-center gap-2 mt-2.5"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <span className="text-[10px] uppercase tracking-wider text-text-muted">Return qty:</span>
                                                                <div className="flex items-center border border-primary/15 rounded-sm overflow-hidden bg-white">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateItemQuantity(item.id, (selectedItems[item.id]?.quantity || 1) - 1)}
                                                                        className="px-2 py-1 text-primary/60 hover:text-primary hover:bg-surface transition-colors text-sm font-medium"
                                                                    >−</button>
                                                                    <span className="px-2 py-1 text-sm font-medium text-primary border-x border-primary/10 min-w-[28px] text-center">
                                                                        {selectedItems[item.id]?.quantity || 1}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateItemQuantity(item.id, (selectedItems[item.id]?.quantity || 1) + 1)}
                                                                        disabled={(selectedItems[item.id]?.quantity || 1) >= item.quantity}
                                                                        className="px-2 py-1 text-primary/60 hover:text-primary hover:bg-surface transition-colors text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                                                                    >+</button>
                                                                </div>
                                                                <span className="text-[10px] text-text-muted">/ {item.quantity}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {selectedCount > 0 && (
                                    <p className="text-[10px] text-secondary font-bold uppercase tracking-wider mt-2.5">
                                        {selectedCount} item{selectedCount > 1 ? "s" : ""} selected
                                    </p>
                                )}
                            </div>

                            {/* Reason for Return */}
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary mb-3">
                                    Reason for Return
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {RETURN_REASONS.map((r) => (
                                        <button
                                            key={r.value}
                                            type="button"
                                            onClick={() => setReason(r.value)}
                                            className={`px-3 py-2.5 border rounded-sm text-[11px] uppercase tracking-wider font-medium text-left transition-all duration-150 ${
                                                reason === r.value
                                                    ? "border-primary bg-primary text-white shadow-sm"
                                                    : "border-primary/12 text-text-muted hover:border-primary/30 hover:text-primary hover:bg-surface/30"
                                            }`}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Additional Details */}
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary mb-3">
                                    Additional Details <span className="font-normal normal-case tracking-normal text-text-muted">(optional)</span>
                                </p>
                                <textarea
                                    placeholder="Tell us more about the issue..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-white border border-primary/10 rounded-sm text-sm text-primary placeholder:text-text-muted/60 resize-none focus:outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-all"
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200/60 rounded-sm animate-fade-in">
                                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 px-8 py-5 border-t border-primary/8 bg-white flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-6 py-2.5 border border-primary/20 text-primary text-[10px] uppercase tracking-[0.18em] font-bold hover:bg-surface transition-all rounded-sm disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting || selectedCount === 0 || !reason}
                                className="px-6 py-2.5 bg-primary text-white text-[10px] uppercase tracking-[0.18em] font-bold hover:opacity-90 transition-all rounded-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                Submit Return
                            </button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
