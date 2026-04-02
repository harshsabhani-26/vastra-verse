"use client";

import {
    CheckCircle2,
    Clock,
    AlertTriangle,
    RotateCcw,
    Phone,
    MapPin,
    Ban,
} from "lucide-react";

// ─── Config ─────────────────────────────────────────────────────────────────

const NDR_ACTION_CONFIG: Record<string, {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
}> = {
    RE_ATTEMPT: { label: "Re-attempt", icon: RotateCcw, color: "text-blue-700", bg: "bg-blue-50" },
    RTO: { label: "RTO", icon: RotateCcw, color: "text-orange-700", bg: "bg-orange-50" },
    ADDRESS_UPDATE: { label: "Address Updated", icon: MapPin, color: "text-violet-700", bg: "bg-violet-50" },
    CALL_CUSTOMER: { label: "Called Customer", icon: Phone, color: "text-emerald-700", bg: "bg-emerald-50" },
    CANCEL: { label: "Cancelled", icon: Ban, color: "text-red-700", bg: "bg-red-50" },
};

// ─── Component ───────────────────────────────────────────────────────────────

interface NdrStatusBadgeProps {
    actionTaken: string | null;
    resolvedAt: string | null;
}

export default function NdrStatusBadge({ actionTaken, resolvedAt }: NdrStatusBadgeProps) {
    // Resolved
    if (resolvedAt) {
        const config = actionTaken ? NDR_ACTION_CONFIG[actionTaken] : null;
        const Icon = config?.icon || CheckCircle2;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config?.bg || "bg-emerald-50"} ${config?.color || "text-emerald-700"}`}>
                <Icon className="w-3 h-3" />
                {config?.label || "Resolved"}
            </span>
        );
    }

    // Action taken but not yet resolved
    if (actionTaken) {
        const config = NDR_ACTION_CONFIG[actionTaken];
        if (config) {
            const Icon = config.icon;
            return (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                    <Icon className="w-3 h-3" />
                    {config.label}
                </span>
            );
        }
    }

    // Pending — no action taken
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
            <Clock className="w-3 h-3" />
            Pending
        </span>
    );
}
