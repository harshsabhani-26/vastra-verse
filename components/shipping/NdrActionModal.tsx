"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import {
    X,
    AlertTriangle,
    Phone,
    RotateCcw,
    MapPin,
    Truck,
    Ban,
    ChevronDown,
    Check,
    Loader2,
} from "lucide-react";
import type { NdrEventRow } from "@/lib/stores/shipping-store";

// ─── Types ───────────────────────────────────────────────────────────────────

interface NdrActionModalProps {
    event: NdrEventRow | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onResolve: (id: string, action: string, notes: string) => Promise<{ success: boolean; error?: string }>;
}

const NDR_ACTIONS = [
    { value: "RE_ATTEMPT", label: "Re-attempt Delivery", icon: Truck, color: "text-blue-600" },
    { value: "RTO", label: "Return to Origin (RTO)", icon: RotateCcw, color: "text-orange-600" },
    { value: "ADDRESS_UPDATE", label: "Update Address", icon: MapPin, color: "text-violet-600" },
    { value: "CALL_CUSTOMER", label: "Call Customer", icon: Phone, color: "text-emerald-600" },
    { value: "CANCEL", label: "Cancel Shipment", icon: Ban, color: "text-red-600" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function NdrActionModal({ event, open, onOpenChange, onResolve }: NdrActionModalProps) {
    const [selectedAction, setSelectedAction] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!event || !selectedAction) return;

        setSubmitting(true);
        setError(null);

        const result = await onResolve(event.id, selectedAction, notes);

        if (result.success) {
            setSelectedAction("");
            setNotes("");
            onOpenChange(false);
        } else {
            setError(result.error || "Failed to resolve NDR");
        }

        setSubmitting(false);
    };

    const handleClose = () => {
        if (!submitting) {
            setSelectedAction("");
            setNotes("");
            setError(null);
            onOpenChange(false);
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={handleClose}>
            <AnimatePresence>
                {open && (
                    <Dialog.Portal forceMount>
                        {/* Overlay */}
                        <Dialog.Overlay asChild>
                            <motion.div
                                className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-50"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            />
                        </Dialog.Overlay>

                        {/* Content */}
                        <Dialog.Content asChild>
                            <motion.div
                                className="fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2"
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            >
                                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200">
                                    {/* Header */}
                                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 px-6 py-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                                                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                                                </div>
                                                <div>
                                                    <Dialog.Title className="text-lg font-semibold text-stone-900">
                                                        Resolve NDR
                                                    </Dialog.Title>
                                                    <Dialog.Description className="text-sm text-stone-500">
                                                        Take action on this delivery failure
                                                    </Dialog.Description>
                                                </div>
                                            </div>
                                            <Dialog.Close asChild>
                                                <button
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-white/60 transition-colors"
                                                    disabled={submitting}
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </Dialog.Close>
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="p-6 space-y-5">
                                        {/* NDR Details */}
                                        {event && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <DetailItem label="AWB Number" value={event.awbNumber} mono />
                                                <DetailItem label="NDR Code" value={event.ndrCode} />
                                                <DetailItem
                                                    label="Customer"
                                                    value={event.shipment.order.customerName || "—"}
                                                />
                                                <DetailItem
                                                    label="Phone"
                                                    value={event.shipment.order.customerPhone || "—"}
                                                />
                                                <div className="col-span-2">
                                                    <DetailItem label="Reason" value={event.ndrReason} />
                                                </div>
                                                <DetailItem
                                                    label="Attempt Date"
                                                    value={new Date(event.attemptDate).toLocaleDateString("en-IN", {
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric",
                                                    })}
                                                />
                                                <DetailItem
                                                    label="Courier"
                                                    value={event.shipment.courierName || "—"}
                                                />
                                            </div>
                                        )}

                                        {/* Action Selector */}
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                                Action <span className="text-red-500">*</span>
                                            </label>
                                            <Select.Root value={selectedAction} onValueChange={setSelectedAction}>
                                                <Select.Trigger className="flex items-center justify-between w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 hover:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all">
                                                    <Select.Value placeholder="Choose an action..." />
                                                    <Select.Icon>
                                                        <ChevronDown className="w-4 h-4 text-stone-400" />
                                                    </Select.Icon>
                                                </Select.Trigger>

                                                <Select.Portal>
                                                    <Select.Content
                                                        className="bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden z-[60]"
                                                        position="popper"
                                                        sideOffset={4}
                                                    >
                                                        <Select.Viewport className="p-1.5">
                                                            {NDR_ACTIONS.map((action) => {
                                                                const ActionIcon = action.icon;
                                                                return (
                                                                    <Select.Item
                                                                        key={action.value}
                                                                        value={action.value}
                                                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer outline-none data-[highlighted]:bg-stone-50 transition-colors"
                                                                    >
                                                                        <ActionIcon className={`w-4 h-4 ${action.color}`} />
                                                                        <Select.ItemText>{action.label}</Select.ItemText>
                                                                        <Select.ItemIndicator className="ml-auto">
                                                                            <Check className="w-4 h-4 text-emerald-600" />
                                                                        </Select.ItemIndicator>
                                                                    </Select.Item>
                                                                );
                                                            })}
                                                        </Select.Viewport>
                                                    </Select.Content>
                                                </Select.Portal>
                                            </Select.Root>
                                        </div>

                                        {/* Admin Notes */}
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                                Admin Notes
                                            </label>
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Add any notes about this action..."
                                                rows={3}
                                                className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 resize-none focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all"
                                            />
                                        </div>

                                        {/* Error */}
                                        {error && (
                                            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2.5">
                                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                                {error}
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="border-t border-stone-100 px-6 py-4 flex items-center justify-end gap-3 bg-stone-50/50">
                                        <button
                                            onClick={handleClose}
                                            disabled={submitting}
                                            className="px-4 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={submitting || !selectedAction}
                                            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                        >
                                            {submitting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Resolving...
                                                </>
                                            ) : (
                                                "Resolve NDR"
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </Dialog.Content>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    );
}

// ─── Detail Item ─────────────────────────────────────────────────────────────

function DetailItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="bg-stone-50 rounded-lg px-3 py-2.5">
            <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">{label}</p>
            <p className={`text-sm font-medium text-stone-900 mt-0.5 ${mono ? "font-mono" : ""}`}>
                {value}
            </p>
        </div>
    );
}
