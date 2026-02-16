"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Package } from "lucide-react";
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
    { value: "WRONG_PRODUCT", label: "Wrong Product" },
    { value: "DAMAGED", label: "Damaged in Transit" },
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

    // Fetch order items when modal opens
    useEffect(() => {
        if (isOpen && orderId) {
            fetchOrderItems();
        }
    }, [isOpen, orderId]);

    const fetchOrderItems = async () => {
        setLoadingItems(true);
        try {
            const response = await fetch(`/api/user/orders/${orderId}`);
            const data = await response.json();

            if (response.ok && data.items) {
                setOrderItems(data.items);
                // Initialize selection state
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
            [itemId]: {
                ...prev[itemId],
                quantity: validQty
            }
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
            setError("Please select at least one item to return");
            return;
        }

        if (!reason) {
            setError("Please select a reason for return");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const response = await fetch(`/api/user/orders/${orderId}/return`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: selectedItemsList,
                    reason,
                    description
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit return request");
            }

            onClose();
            router.refresh();
            alert("Return request submitted successfully. We will review it shortly.");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedCount = Object.values(selectedItems).filter(item => item.selected).length;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Request Return</DialogTitle>
                    <DialogDescription>
                        Select the items you want to return and provide a reason.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Items Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Items to Return</label>
                        {loadingItems ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="space-y-3 border rounded-md p-3 max-h-[300px] overflow-y-auto">
                                {orderItems.map((item) => (
                                    <div key={item.id} className="flex items-start gap-3 p-3 border rounded-md hover:bg-accent/50 transition">
                                        <Checkbox
                                            checked={selectedItems[item.id]?.selected || false}
                                            onCheckedChange={() => toggleItemSelection(item.id)}
                                        />
                                        <div className="w-16 h-20 bg-secondary/10 rounded overflow-hidden flex-shrink-0">
                                            {item.product.images && item.product.images.length > 0 ? (
                                                <Image
                                                    src={item.product.images[0].url}
                                                    alt={item.product.name}
                                                    width={64}
                                                    height={80}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{item.product.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Ordered: {item.quantity} | Price: ₹{Number(item.price).toLocaleString('en-IN')}
                                            </p>
                                            {selectedItems[item.id]?.selected && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <label className="text-xs">Return Qty:</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={item.quantity}
                                                        value={selectedItems[item.id].quantity}
                                                        onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                                        className="w-16 px-2 py-1 border rounded text-sm"
                                                    />
                                                    <span className="text-xs text-muted-foreground">/ {item.quantity}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {selectedCount > 0 && (
                            <p className="text-xs text-muted-foreground">
                                {selectedCount} item(s) selected for return
                            </p>
                        )}
                    </div>

                    {/* Return Reason */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Reason for Return</label>
                        <Select onValueChange={setReason}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                            <SelectContent>
                                {RETURN_REASONS.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Additional Details */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Additional Details</label>
                        <Textarea
                            placeholder="Please tell us more about the issue..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600">{error}</p>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || selectedCount === 0 || !reason}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Return Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
