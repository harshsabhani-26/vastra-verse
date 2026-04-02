"use client";

import { motion } from "framer-motion";
import {
    Package,
    Truck,
    CheckCircle2,
    Clock,
    MapPin,
    AlertCircle,
    RotateCcw,
    PackageCheck,
    CircleDot,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TrackingActivity {
    date: string;
    activity: string;
    location: string;
}

interface TrackingTimelineProps {
    activities: TrackingActivity[];
    currentStatus: string;
}

// ─── Status → Icon mapping ──────────────────────────────────────────────────

const STATUS_ICONS: Record<string, React.ElementType> = {
    PENDING: Clock,
    READY_TO_SHIP: Package,
    LABEL_GENERATED: Package,
    PICKUP_SCHEDULED: Clock,
    PICKED_UP: PackageCheck,
    IN_TRANSIT: Truck,
    OUT_FOR_DELIVERY: MapPin,
    DELIVERED: CheckCircle2,
    DELIVERY_ATTEMPTED: AlertCircle,
    FAILED: AlertCircle,
    CANCELLED: AlertCircle,
    RTO_INITIATED: RotateCcw,
    RTO_DELIVERED: RotateCcw,
    EXCEPTION: AlertCircle,
    RETURN_INITIATED: RotateCcw,
    RETURN_PICKED: RotateCcw,
    RETURN_DELIVERED: RotateCcw,
};

const STATUS_COLORS: Record<string, string> = {
    DELIVERED: "bg-emerald-500",
    IN_TRANSIT: "bg-blue-500",
    OUT_FOR_DELIVERY: "bg-amber-500",
    PICKUP_SCHEDULED: "bg-violet-500",
    PICKED_UP: "bg-indigo-500",
    READY_TO_SHIP: "bg-sky-500",
    PENDING: "bg-stone-400",
    FAILED: "bg-red-500",
    CANCELLED: "bg-red-500",
    RTO_INITIATED: "bg-orange-500",
    EXCEPTION: "bg-red-500",
    DELIVERY_ATTEMPTED: "bg-amber-600",
};

// ─── Animation Variants ─────────────────────────────────────────────────────

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.15,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, x: -24, scale: 0.95 },
    visible: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: {
            type: "spring" as const,
            stiffness: 200,
            damping: 20,
        },
    },
};

const dotVariants = {
    hidden: { scale: 0 },
    visible: {
        scale: 1,
        transition: {
            type: "spring" as const,
            stiffness: 300,
            damping: 15,
        },
    },
};

const lineVariants = {
    hidden: { scaleY: 0 },
    visible: {
        scaleY: 1,
        transition: {
            duration: 0.4,
            ease: "easeOut" as const,
        },
    },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function TrackingTimeline({ activities, currentStatus }: TrackingTimelineProps) {
    if (!activities || activities.length === 0) {
        return (
            <div className="text-center py-8 text-stone-500">
                <Clock className="w-8 h-8 mx-auto mb-3 text-stone-400" />
                <p>No tracking updates available yet</p>
            </div>
        );
    }

    const Icon = STATUS_ICONS[currentStatus] || CircleDot;
    const dotColor = STATUS_COLORS[currentStatus] || "bg-stone-400";

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative"
        >
            {activities.map((activity, index) => {
                const isFirst = index === 0;
                const isLast = index === activities.length - 1;
                const ActivityIcon = isFirst ? Icon : CircleDot;
                const activityDotColor = isFirst ? dotColor : "bg-stone-300";

                return (
                    <motion.div
                        key={index}
                        variants={itemVariants}
                        className="flex gap-4 relative"
                    >
                        {/* Dot + Connector Line */}
                        <div className="flex flex-col items-center relative">
                            <motion.div
                                variants={dotVariants}
                                className={`w-10 h-10 rounded-full flex items-center justify-center z-10 shadow-md ${isFirst
                                    ? `${activityDotColor} text-white shadow-lg`
                                    : "bg-white border-2 border-stone-200 text-stone-400"
                                    }`}
                            >
                                <ActivityIcon className="w-4 h-4" />
                            </motion.div>

                            {/* Connector line */}
                            {!isLast && (
                                <motion.div
                                    variants={lineVariants}
                                    className={`w-0.5 flex-1 origin-top ${isFirst
                                        ? "bg-gradient-to-b from-stone-300 to-stone-200"
                                        : "bg-stone-200"
                                        }`}
                                    style={{ minHeight: "3rem" }}
                                />
                            )}

                            {/* Pulse for latest */}
                            {isFirst && (
                                <motion.div
                                    className={`absolute top-0 w-10 h-10 rounded-full ${activityDotColor} opacity-30`}
                                    animate={{
                                        scale: [1, 1.6, 1],
                                        opacity: [0.3, 0, 0.3],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut" as const,
                                    }}
                                />
                            )}
                        </div>

                        {/* Activity Content */}
                        <motion.div
                            className={`flex-1 pb-6 ${isFirst ? "pt-0" : "pt-1"}`}
                            variants={itemVariants}
                        >
                            <div
                                className={`rounded-xl p-4 ${isFirst
                                    ? "bg-white border border-stone-200 shadow-sm"
                                    : "bg-stone-50/50"
                                    }`}
                            >
                                <p
                                    className={`font-medium leading-snug ${isFirst ? "text-stone-900" : "text-stone-600"
                                        }`}
                                >
                                    {activity.activity}
                                </p>

                                {activity.location && (
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                                        <span className="text-sm text-stone-500">
                                            {activity.location}
                                        </span>
                                    </div>
                                )}

                                <p className="text-xs text-stone-400 mt-2">
                                    {formatDate(activity.date)}
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                );
            })}
        </motion.div>
    );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
    try {
        const d = new Date(dateStr);
        return d.toLocaleString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return dateStr;
    }
}
