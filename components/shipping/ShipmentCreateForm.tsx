"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import {
    X,
    Package,
    Truck,
    Loader2,
    AlertTriangle,
    Ruler,
    Weight,
    MapPin,
    CheckCircle2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ShipmentCreateFormProps {
    orderId: string;
    orderNumber?: string;
    customerName?: string;
    deliveryPincode?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: (shipmentId: string) => void;
}

interface Dimensions {
    length: string;
    breadth: string;
    height: string;
    weight: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ShipmentCreateForm({
    orderId,
    orderNumber,
    customerName,
    deliveryPincode,
    open,
    onOpenChange,
    onCreated,
}: ShipmentCreateFormProps) {
    const [step, setStep] = useState<"form" | "creating" | "success" | "error">("form");
    const [dimensions, setDimensions] = useState<Dimensions>({
        length: "30",
        breadth: "20",
        height: "10",
        weight: "0.5",
    });
    const [pickupLocation, setPickupLocation] = useState(
        process.env.NEXT_PUBLIC_SHIPROCKET_PICKUP_LOCATION || "Vastraa Verse- Office"
    );
    const [pickupPincode, setPickupPincode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [createdShipmentId, setCreatedShipmentId] = useState<string | null>(null);

    // Serviceability check state
    const [checkingServiceability, setCheckingServiceability] = useState(false);
    const [serviceabilityResult, setServiceabilityResult] = useState<{
        available: boolean;
        couriers?: Array<{ name: string; rate: number; etd: string }>;
    } | null>(null);

    const handleCheckServiceability = async () => {
        if (!pickupPincode || !deliveryPincode) return;
        setCheckingServiceability(true);
        setServiceabilityResult(null);
        setError(null);

        try {
            const res = await fetch("/api/admin/serviceability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pickupPincode,
                    deliveryPincode,
                    weight: parseFloat(dimensions.weight) || 0.5,
                    cod: false,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Serviceability check failed");

            setServiceabilityResult({
                available: data.available,
                couriers: data.couriers || [],
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Serviceability check failed";
            setError(message);
            setServiceabilityResult({ available: false });
        } finally {
            setCheckingServiceability(false);
        }
    };

    const handleCreate = async () => {
        setStep("creating");
        setError(null);

        try {
            const res = await fetch("/api/admin/shipments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId,
                    dimensions: {
                        length: parseFloat(dimensions.length) || 30,
                        breadth: parseFloat(dimensions.breadth) || 20,
                        height: parseFloat(dimensions.height) || 10,
                        weight: parseFloat(dimensions.weight) || 0.5,
                    },
                    pickupLocation,
                    pickupPincode,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create shipment");
            }

            const data = await res.json();
            setCreatedShipmentId(data.shipmentId || data.id);
            setStep("success");
            onCreated?.(data.shipmentId || data.id);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "An unexpected error occurred";
            setError(message);
            setStep("error");
        }
    };

    const handleClose = () => {
        if (step === "creating") return;
        setStep("form");
        setError(null);
        setCreatedShipmentId(null);
        onOpenChange(false);
    };

    const updateDimension = (key: keyof Dimensions, value: string) => {
        setDimensions((prev) => ({ ...prev, [key]: value }));
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
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 px-6 py-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                                    <Package className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <Dialog.Title className="text-lg font-semibold text-stone-900">
                                                        Create Shipment
                                                    </Dialog.Title>
                                                    <Dialog.Description className="text-sm text-stone-500">
                                                        Ship via Shiprocket
                                                    </Dialog.Description>
                                                </div>
                                            </div>
                                            <Dialog.Close asChild>
                                                <button
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-white/60 transition-colors"
                                                    disabled={step === "creating"}
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </Dialog.Close>
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="p-6">
                                        <AnimatePresence mode="wait">
                                            {/* ─── Form Step ──────────────────────────── */}
                                            {step === "form" && (
                                                <motion.div
                                                    key="form"
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 10 }}
                                                    className="space-y-5"
                                                >
                                                    {/* Order Info */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <InfoItem label="Order" value={orderNumber || orderId} mono />
                                                        <InfoItem label="Customer" value={customerName || "—"} />
                                                        {deliveryPincode && (
                                                            <InfoItem label="Delivery Pincode" value={deliveryPincode} mono />
                                                        )}
                                                    </div>

                                                    {/* Dimensions */}
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Ruler className="w-4 h-4 text-stone-500" />
                                                            <span className="text-sm font-medium text-stone-700">
                                                                Package Dimensions
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-4 gap-3">
                                                            <DimensionInput
                                                                label="L (cm)"
                                                                value={dimensions.length}
                                                                onChange={(v) => updateDimension("length", v)}
                                                            />
                                                            <DimensionInput
                                                                label="B (cm)"
                                                                value={dimensions.breadth}
                                                                onChange={(v) => updateDimension("breadth", v)}
                                                            />
                                                            <DimensionInput
                                                                label="H (cm)"
                                                                value={dimensions.height}
                                                                onChange={(v) => updateDimension("height", v)}
                                                            />
                                                            <DimensionInput
                                                                label="Wt (kg)"
                                                                value={dimensions.weight}
                                                                onChange={(v) => updateDimension("weight", v)}
                                                                step="0.1"
                                                                icon={<Weight className="w-3 h-3" />}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Pickup Location */}
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <MapPin className="w-4 h-4 text-stone-500" />
                                                            <label className="text-sm font-medium text-stone-700">
                                                                Pickup Location
                                                            </label>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={pickupLocation}
                                                            onChange={(e) => setPickupLocation(e.target.value)}
                                                            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all"
                                                            placeholder="As configured in Shiprocket"
                                                        />
                                                        <p className="text-xs text-stone-400 mt-1.5">
                                                            Must match pickup location name in Shiprocket dashboard
                                                        </p>
                                                    </div>

                                                    {/* Serviceability Check */}
                                                    {deliveryPincode && (
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Truck className="w-4 h-4 text-stone-500" />
                                                                <label className="text-sm font-medium text-stone-700">
                                                                    Check Serviceability
                                                                </label>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={pickupPincode}
                                                                    onChange={(e) => {
                                                                        setPickupPincode(e.target.value);
                                                                        setServiceabilityResult(null);
                                                                    }}
                                                                    className="flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all"
                                                                    placeholder="Pickup pincode"
                                                                    maxLength={6}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={handleCheckServiceability}
                                                                    disabled={!pickupPincode || pickupPincode.length < 6 || checkingServiceability}
                                                                    className="px-4 py-2.5 rounded-xl text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                                                                >
                                                                    {checkingServiceability ? (
                                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                    ) : (
                                                                        <MapPin className="w-3.5 h-3.5" />
                                                                    )}
                                                                    Check
                                                                </button>
                                                            </div>
                                                            <p className="text-xs text-stone-400 mt-1">
                                                                Delivery: {deliveryPincode}
                                                            </p>

                                                            {/* Serviceability Results */}
                                                            {serviceabilityResult && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: -5 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    className="mt-3"
                                                                >
                                                                    {serviceabilityResult.available ? (
                                                                        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                                                                            <div className="flex items-center gap-1.5 mb-2">
                                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                                                <span className="text-xs font-medium text-emerald-700">
                                                                                    {serviceabilityResult.couriers?.length || 0} courier(s) available
                                                                                </span>
                                                                            </div>
                                                                            {serviceabilityResult.couriers && serviceabilityResult.couriers.length > 0 && (
                                                                                <div className="space-y-1">
                                                                                    {serviceabilityResult.couriers.slice(0, 3).map((c, i) => (
                                                                                        <div key={i} className="flex justify-between text-xs text-emerald-800">
                                                                                            <span>{c.name}</span>
                                                                                            <span>₹{c.rate} · {c.etd}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                                                                                <span className="text-xs font-medium text-red-700">
                                                                                    Route not serviceable
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}

                                            {/* ─── Creating Step ───────────────────────── */}
                                            {step === "creating" && (
                                                <motion.div
                                                    key="creating"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="py-12 text-center"
                                                >
                                                    <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
                                                    <p className="text-stone-900 font-medium">Creating shipment...</p>
                                                    <p className="text-sm text-stone-500 mt-1">
                                                        Checking serviceability & generating AWB
                                                    </p>
                                                </motion.div>
                                            )}

                                            {/* ─── Success Step ────────────────────────── */}
                                            {step === "success" && (
                                                <motion.div
                                                    key="success"
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="py-10 text-center"
                                                >
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ type: "spring", stiffness: 250, damping: 15 }}
                                                    >
                                                        <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
                                                    </motion.div>
                                                    <p className="text-lg font-semibold text-stone-900">Shipment Created!</p>
                                                    <p className="text-sm text-stone-500 mt-1">
                                                        AWB has been assigned and label is being generated
                                                    </p>
                                                    {createdShipmentId && (
                                                        <p className="text-xs font-mono text-stone-400 mt-3">
                                                            ID: {createdShipmentId}
                                                        </p>
                                                    )}
                                                </motion.div>
                                            )}

                                            {/* ─── Error Step ──────────────────────────── */}
                                            {step === "error" && (
                                                <motion.div
                                                    key="error"
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="py-8 text-center"
                                                >
                                                    <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                                                        <AlertTriangle className="w-7 h-7 text-red-500" />
                                                    </div>
                                                    <p className="text-lg font-semibold text-stone-900">Shipment Failed</p>
                                                    <p className="text-sm text-red-600 mt-2 max-w-xs mx-auto">
                                                        {error}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Footer */}
                                    <div className="border-t border-stone-100 px-6 py-4 flex items-center justify-end gap-3 bg-stone-50/50">
                                        {step === "form" && (
                                            <>
                                                <button
                                                    onClick={handleClose}
                                                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleCreate}
                                                    className="px-5 py-2.5 rounded-xl text-sm font-medium bg-stone-900 text-white hover:bg-stone-800 transition-colors flex items-center gap-2"
                                                >
                                                    <Truck className="w-4 h-4" />
                                                    Create Shipment
                                                </button>
                                            </>
                                        )}

                                        {step === "success" && (
                                            <button
                                                onClick={handleClose}
                                                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-stone-900 text-white hover:bg-stone-800 transition-colors"
                                            >
                                                Done
                                            </button>
                                        )}

                                        {step === "error" && (
                                            <>
                                                <button
                                                    onClick={handleClose}
                                                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
                                                >
                                                    Close
                                                </button>
                                                <button
                                                    onClick={() => setStep("form")}
                                                    className="px-5 py-2.5 rounded-xl text-sm font-medium bg-stone-900 text-white hover:bg-stone-800 transition-colors"
                                                >
                                                    Try Again
                                                </button>
                                            </>
                                        )}
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

// ─── Sub-Components ──────────────────────────────────────────────────────────

function InfoItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="bg-stone-50 rounded-lg px-3 py-2.5">
            <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">{label}</p>
            <p className={`text-sm font-medium text-stone-900 mt-0.5 ${mono ? "font-mono" : ""}`}>
                {value}
            </p>
        </div>
    );
}

function DimensionInput({
    label,
    value,
    onChange,
    step = "1",
    icon,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    step?: string;
    icon?: React.ReactNode;
}) {
    return (
        <div>
            <label className="text-[11px] font-medium text-stone-400 uppercase tracking-wider block mb-1.5">
                {label}
            </label>
            <div className="relative">
                <input
                    type="number"
                    min="0"
                    step={step}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all"
                />
                {icon && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}
