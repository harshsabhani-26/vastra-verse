"use client";

import { motion } from "framer-motion";
import {
    Package,
    Truck,
    CheckCircle2,
    Clock,
    AlertCircle,
    RotateCcw,
    MapPin,
} from "lucide-react";

// ─── Config ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    ring: string;
}> = {
    PENDING: { label: "Pending", icon: Clock, color: "text-stone-600", bg: "bg-stone-100", ring: "ring-stone-200" },
    READY_TO_SHIP: { label: "Ready to Ship", icon: Package, color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-200" },
    LABEL_GENERATED: { label: "Label Generated", icon: Package, color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-200" },
    PICKUP_SCHEDULED: { label: "Pickup Scheduled", icon: Clock, color: "text-violet-600", bg: "bg-violet-50", ring: "ring-violet-200" },
    PICKED_UP: { label: "Picked Up", icon: Package, color: "text-indigo-600", bg: "bg-indigo-50", ring: "ring-indigo-200" },
    IN_TRANSIT: { label: "In Transit", icon: Truck, color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-200" },
    OUT_FOR_DELIVERY: { label: "Out for Delivery", icon: MapPin, color: "text-orange-600", bg: "bg-orange-50", ring: "ring-orange-200" },
    DELIVERED: { label: "Delivered", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-200" },
    DELIVERY_ATTEMPTED: { label: "Delivery Attempted", icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-200" },
    NDR_RAISED: { label: "NDR Raised", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", ring: "ring-red-200" },
    FAILED: { label: "Failed", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", ring: "ring-red-200" },
    CANCELLED: { label: "Cancelled", icon: AlertCircle, color: "text-stone-500", bg: "bg-stone-100", ring: "ring-stone-200" },
    RTO_INITIATED: { label: "RTO Initiated", icon: RotateCcw, color: "text-orange-600", bg: "bg-orange-50", ring: "ring-orange-200" },
    RTO_IN_TRANSIT: { label: "RTO In Transit", icon: RotateCcw, color: "text-orange-600", bg: "bg-orange-50", ring: "ring-orange-200" },
    RTO_DELIVERED: { label: "Returned", icon: RotateCcw, color: "text-orange-600", bg: "bg-orange-50", ring: "ring-orange-200" },
    EXCEPTION: { label: "Exception", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", ring: "ring-red-200" },
    RETURN_INITIATED: { label: "Return Initiated", icon: RotateCcw, color: "text-purple-600", bg: "bg-purple-50", ring: "ring-purple-200" },
    RETURN_PICKED: { label: "Return Picked", icon: RotateCcw, color: "text-purple-600", bg: "bg-purple-50", ring: "ring-purple-200" },
    RETURN_DELIVERED: { label: "Return Delivered", icon: RotateCcw, color: "text-purple-600", bg: "bg-purple-50", ring: "ring-purple-200" },
};

// ─── Component ───────────────────────────────────────────────────────────────

interface TrackingStatusBadgeProps {
    status: string;
    size?: "sm" | "md";
    animate?: boolean;
}

export default function TrackingStatusBadge({
    status,
    size = "sm",
    animate = false,
}: TrackingStatusBadgeProps) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    const Icon = config.icon;

    const sizeClasses = size === "sm"
        ? "px-2.5 py-1 text-xs gap-1.5"
        : "px-3.5 py-1.5 text-sm gap-2";

    const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";

    const badge = (
        <span
            className={`inline-flex items-center font-medium rounded-full ring-1 ${config.bg} ${config.color} ${config.ring} ${sizeClasses}`}
        >
            <Icon className={iconSize} />
            {config.label}
        </span>
    );

    if (!animate) return badge;

    return (
        <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="inline-flex"
        >
            {badge}
        </motion.span>
    );
}

/** Get the label string for a status without rendering a component. */
export function getStatusLabel(status: string): string {
    return STATUS_CONFIG[status]?.label || status;
}

/** Get the config object for a status. */
export function getStatusConfig(status: string) {
    return STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
}
