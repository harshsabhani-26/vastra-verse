"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Package,
    Truck,
    CheckCircle2,
    Clock,
    AlertCircle,
    Share2,
    Copy,
    Check,
    ExternalLink,
    Calendar,
    MapPin,
    RotateCcw,
} from "lucide-react";
import TrackingTimeline from "@/components/shipping/TrackingTimeline";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TrackingData {
    awb: string;
    courierName?: string;
    status: string;
    isReturn: boolean;
    pickupScheduledAt?: string;
    shippedAt?: string;
    deliveredAt?: string;
    estimatedDeliveryAt?: string;
    trackingUrl?: string;
    trackingData?: {
        current_status?: string;
        shipment_track_activities?: Array<{
            date: string;
            activity: string;
            location: string;
        }>;
    };
    liveTracking?: {
        current_status: string;
        destination: string;
        origin: string;
        edd?: string;
        shipment_track_activities?: Array<{
            date: string;
            activity: string;
            location: string;
        }>;
    };
}

interface TrackingPageClientProps {
    awb: string;
    initialData: TrackingData | null;
}

// ─── Status Config ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    PENDING: { label: "Order Placed", icon: Clock, color: "text-stone-600", bg: "bg-stone-100" },
    READY_TO_SHIP: { label: "Ready to Ship", icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    LABEL_GENERATED: { label: "Label Generated", icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    PICKUP_SCHEDULED: { label: "Pickup Scheduled", icon: Clock, color: "text-violet-600", bg: "bg-violet-50" },
    PICKED_UP: { label: "Picked Up", icon: Package, color: "text-indigo-600", bg: "bg-indigo-50" },
    IN_TRANSIT: { label: "In Transit", icon: Truck, color: "text-amber-600", bg: "bg-amber-50" },
    OUT_FOR_DELIVERY: { label: "Out for Delivery", icon: Truck, color: "text-orange-600", bg: "bg-orange-50" },
    DELIVERED: { label: "Delivered", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    DELIVERY_ATTEMPTED: { label: "Delivery Attempted", icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
    FAILED: { label: "Delivery Failed", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
    CANCELLED: { label: "Cancelled", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
    RTO_INITIATED: { label: "Return Initiated", icon: RotateCcw, color: "text-orange-600", bg: "bg-orange-50" },
    RTO_DELIVERED: { label: "Returned", icon: RotateCcw, color: "text-orange-600", bg: "bg-orange-50" },
    EXCEPTION: { label: "Exception", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
    RETURN_INITIATED: { label: "Return Initiated", icon: RotateCcw, color: "text-orange-600", bg: "bg-orange-50" },
    RETURN_PICKED: { label: "Return Picked Up", icon: RotateCcw, color: "text-orange-600", bg: "bg-orange-50" },
    RETURN_DELIVERED: { label: "Return Delivered", icon: RotateCcw, color: "text-orange-600", bg: "bg-orange-50" },
};

// ─── Animation Variants ─────────────────────────────────────────────────────

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
} as const;

const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function TrackingPageClient({ awb, initialData }: TrackingPageClientProps) {
    const [copied, setCopied] = useState(false);

    const tracking = initialData;
    const statusConfig = tracking ? STATUS_CONFIG[tracking.status] || STATUS_CONFIG.PENDING : null;
    const StatusIcon = statusConfig?.icon || Package;

    // Get activities from liveTracking or stored trackingData
    const activities =
        tracking?.liveTracking?.shipment_track_activities ||
        tracking?.trackingData?.shipment_track_activities ||
        [];

    // EDD from live tracking or stored data
    const edd = tracking?.liveTracking?.edd || tracking?.estimatedDeliveryAt;

    const handleShare = useCallback(async () => {
        const shareUrl = `${window.location.origin}/track/${awb}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Track Shipment ${awb}`,
                    text: `Track your Vastra Verse shipment: ${awb}`,
                    url: shareUrl,
                });
            } catch {
                // User cancelled
            }
        } else {
            // Clipboard fallback
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [awb]);

    // ─── Not Found State ────────────────────────────────────────────────────
    if (!tracking) {
        return (
            <div className="min-h-[70vh] bg-stone-50 flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center max-w-md"
                >
                    <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-stone-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-stone-900 mb-2">Shipment Not Found</h2>
                    <p className="text-stone-500 text-sm">
                        We couldn&apos;t find a shipment with AWB <span className="font-mono font-medium">{awb}</span>.
                        Please check the number and try again.
                    </p>
                </motion.div>
            </div>
        );
    }

    // ─── Main View ──────────────────────────────────────────────────────────
    return (
        <div className="min-h-[70vh] bg-gradient-to-b from-stone-50 to-white py-8 md:py-12 px-4">
            <motion.div
                className="max-w-2xl mx-auto"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div variants={fadeInUp} className="text-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-serif text-stone-900 mb-1">
                        Track Your Shipment
                    </h1>
                    <p className="text-sm text-stone-500">Real-time updates for your order</p>
                </motion.div>

                {/* Status Card */}
                <motion.div
                    variants={fadeInUp}
                    className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden mb-6"
                >
                    {/* Status Banner */}
                    <div className={`${statusConfig?.bg} px-6 py-5`}>
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 250, damping: 15, delay: 0.3 }}
                                    className={`w-12 h-12 rounded-xl ${statusConfig?.bg} border border-current/10 flex items-center justify-center`}
                                >
                                    <StatusIcon className={`w-6 h-6 ${statusConfig?.color}`} />
                                </motion.div>
                                <div>
                                    <p className="text-xs text-stone-500 mb-0.5">Current Status</p>
                                    <p className={`text-lg font-semibold ${statusConfig?.color}`}>
                                        {statusConfig?.label}
                                    </p>
                                </div>
                            </div>

                            {/* Share Button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleShare}
                                className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-stone-200 text-sm font-medium text-stone-600 hover:border-stone-300 hover:text-stone-900 transition-all shadow-sm"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4 text-emerald-600" />
                                        <span className="text-emerald-600">Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="w-4 h-4" />
                                        Share
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="px-6 py-5">
                        <div className="grid grid-cols-2 gap-4">
                            {/* AWB */}
                            <div>
                                <p className="text-xs text-stone-400 mb-1">AWB Number</p>
                                <p className="font-mono font-semibold text-stone-900 text-sm">
                                    {tracking.awb}
                                </p>
                            </div>

                            {/* Courier */}
                            {tracking.courierName && (
                                <div>
                                    <p className="text-xs text-stone-400 mb-1">Courier Partner</p>
                                    <p className="font-medium text-stone-900 text-sm">
                                        {tracking.courierName}
                                    </p>
                                </div>
                            )}

                            {/* EDD */}
                            {edd && tracking.status !== "DELIVERED" && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="col-span-2"
                                >
                                    <div className="bg-emerald-50 rounded-xl px-4 py-3 flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-emerald-600" />
                                        <div>
                                            <p className="text-xs text-emerald-600 font-medium">
                                                Expected Delivery
                                            </p>
                                            <p className="text-sm font-semibold text-emerald-900">
                                                {new Date(edd).toLocaleDateString("en-IN", {
                                                    weekday: "long",
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Delivered date */}
                            {tracking.status === "DELIVERED" && tracking.deliveredAt && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="col-span-2"
                                >
                                    <div className="bg-emerald-50 rounded-xl px-4 py-3 flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        <div>
                                            <p className="text-xs text-emerald-600 font-medium">
                                                Delivered On
                                            </p>
                                            <p className="text-sm font-semibold text-emerald-900">
                                                {new Date(tracking.deliveredAt).toLocaleDateString("en-IN", {
                                                    weekday: "long",
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Timeline */}
                <motion.div
                    variants={fadeInUp}
                    className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6"
                >
                    <h3 className="text-base font-semibold text-stone-900 mb-5 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-stone-500" />
                        Tracking Timeline
                    </h3>
                    <TrackingTimeline
                        activities={activities}
                        currentStatus={tracking.status}
                    />
                </motion.div>

                {/* External Tracking Link */}
                {tracking.trackingUrl && (
                    <motion.div variants={fadeInUp} className="mt-4 text-center">
                        <a
                            href={tracking.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            View on courier website
                        </a>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
