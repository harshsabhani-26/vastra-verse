'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Clock, MessageSquare, CheckCircle2, PackageCheck, Search as SearchIcon,
    RefreshCw, ChevronRight, AlertTriangle, DollarSign, XCircle,
    ArrowRight, Eye
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ReturnCard {
    id: string;
    orderId: string;
    status: string;
    inspectionStatus: string | null;
    reason: string;
    requestedAt: string;
    approvedAt: string | null;
    receivedAt: string | null;
    refundAmount: number | null;
    customerName: string;
    customerEmail: string | null;
    orderTotal: number;
    adminNotes: string | null;
    productNames: string;
    itemCount: number;
}

interface PipelineStage {
    key: string;
    label: string;
    returns: ReturnCard[];
    count: number;
}

// ─── Stage Config ───────────────────────────────────────────────────────────

const stageConfig: Record<string, {
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
    headerBg: string;
    description: string;
}> = {
    REQUESTED: {
        icon: MessageSquare,
        color: 'text-amber-700',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        headerBg: 'bg-amber-100/80',
        description: 'Awaiting admin review',
    },
    APPROVED: {
        icon: CheckCircle2,
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        headerBg: 'bg-blue-100/80',
        description: 'Waiting for item return',
    },
    ITEM_RECEIVED: {
        icon: PackageCheck,
        color: 'text-violet-700',
        bgColor: 'bg-violet-50',
        borderColor: 'border-violet-200',
        headerBg: 'bg-violet-100/80',
        description: 'Item received at warehouse',
    },
    INSPECTION: {
        icon: SearchIcon,
        color: 'text-indigo-700',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200',
        headerBg: 'bg-indigo-100/80',
        description: 'Quality inspection in progress',
    },
    REFUND_PROCESSING: {
        icon: DollarSign,
        color: 'text-teal-700',
        bgColor: 'bg-teal-50',
        borderColor: 'border-teal-200',
        headerBg: 'bg-teal-100/80',
        description: 'Processing refund payment',
    },
    CLOSED: {
        icon: XCircle,
        color: 'text-stone-600',
        bgColor: 'bg-stone-50',
        borderColor: 'border-stone-200',
        headerBg: 'bg-stone-100/80',
        description: 'Refunded, rejected, or closed',
    },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(date: string): string {
    const diffMs = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    if (hrs < 24) return `${hrs}h`;
    if (days < 30) return `${days}d`;
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function urgencyColor(date: string): string {
    const hrs = (Date.now() - new Date(date).getTime()) / 3600000;
    if (hrs < 24) return 'bg-emerald-500';
    if (hrs < 72) return 'bg-amber-500';
    return 'bg-red-500';
}

function formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ReturnPipelinePage() {
    const [pipeline, setPipeline] = useState<PipelineStage[]>([]);
    const [stats, setStats] = useState<{ total: number; pendingAction: number }>({ total: 0, pendingAction: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPipeline = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const res = await fetch('/api/admin/returns/pipeline');
            if (res.ok) {
                const data = await res.json();
                setPipeline(data.pipeline);
                setStats(data.stats);
            }
        } catch (err) {
            console.error('Failed to fetch pipeline:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchPipeline();
    }, [fetchPipeline]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => fetchPipeline(true), 30000);
        return () => clearInterval(interval);
    }, [fetchPipeline]);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-12 bg-stone-100 rounded-xl animate-pulse" />
                <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-stone-100 rounded-xl h-96 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-7rem)] space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-stone-900">Return Pipeline</h1>
                    <p className="text-xs text-stone-500 mt-0.5">
                        {stats.total} total returns &middot; {stats.pendingAction} need action
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/admin/returns" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                        Table View <ChevronRight size={12} />
                    </Link>
                    <button
                        onClick={() => fetchPipeline(true)}
                        disabled={refreshing}
                        className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Stats Banner */}
            <div className="grid grid-cols-3 gap-4">
                {pipeline.map((stage) => {
                    const config = stageConfig[stage.key];
                    if (!config) return null;
                    const Icon = config.icon;
                    return (
                        <div key={stage.key} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.headerBg}`}>
                            <Icon size={14} className={config.color} />
                            <div className="flex-1 min-w-0">
                                <p className={`text-[10px] font-semibold ${config.color} truncate`}>{stage.label}</p>
                                <p className={`text-[9px] ${config.color} opacity-70 truncate`}>{config.description}</p>
                            </div>
                            <span className={`text-sm font-bold ${config.color}`}>{stage.count}</span>
                        </div>
                    );
                })}
            </div>

            {/* Pipeline Columns */}
            <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
                {pipeline.map((stage) => {
                    const config = stageConfig[stage.key];
                    if (!config) return null;
                    return (
                        <div
                            key={stage.key}
                            className={`rounded-xl border ${config.borderColor} ${config.bgColor} flex flex-col min-h-0`}
                        >
                            {/* Stage Header */}
                            <div className={`px-3 py-2 ${config.headerBg} rounded-t-xl border-b ${config.borderColor}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <config.icon size={13} className={config.color} />
                                        <span className={`text-xs font-bold ${config.color}`}>{stage.label}</span>
                                    </div>
                                    <span className={`text-[10px] font-bold ${config.color} bg-white/60 px-1.5 py-0.5 rounded-full`}>
                                        {stage.count}
                                    </span>
                                </div>
                            </div>

                            {/* Cards */}
                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                {stage.returns.length === 0 ? (
                                    <div className="text-center py-8">
                                        <config.icon size={18} className="mx-auto text-stone-300 mb-1" />
                                        <p className="text-[10px] text-stone-400">No returns</p>
                                    </div>
                                ) : (
                                    stage.returns.map((ret) => (
                                        <Link
                                            key={ret.id}
                                            href={`/admin/orders/${ret.orderId}`}
                                            className="block bg-white rounded-lg border border-stone-200/80 p-2.5 hover:shadow-md hover:border-stone-300 transition-all group"
                                        >
                                            {/* Time urgency indicator */}
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-1">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${urgencyColor(ret.requestedAt)}`} />
                                                    <span className="text-[9px] text-stone-400">{timeAgo(ret.requestedAt)}</span>
                                                </div>
                                                <Eye size={10} className="text-stone-300 group-hover:text-blue-500 transition-colors" />
                                            </div>

                                            {/* Customer */}
                                            <p className="text-[11px] font-semibold text-stone-700 truncate">
                                                {ret.customerName}
                                            </p>

                                            {/* Product Names */}
                                            <p className="text-[10px] text-stone-500 truncate mt-0.5">
                                                {ret.productNames || `${ret.itemCount} item(s)`}
                                            </p>

                                            {/* Reason */}
                                            <p className="text-[9px] text-stone-400 mt-1 line-clamp-2 italic">
                                                &ldquo;{ret.reason}&rdquo;
                                            </p>

                                            {/* Bottom meta */}
                                            <div className="flex items-center justify-between mt-1.5">
                                                <span className="text-[9px] font-mono text-stone-400">
                                                    #{ret.orderId.slice(-8)}
                                                </span>
                                                {ret.refundAmount && (
                                                    <span className="text-[10px] font-bold text-emerald-600">
                                                        {formatCurrency(ret.refundAmount)}
                                                    </span>
                                                )}
                                                {!ret.refundAmount && ret.orderTotal > 0 && (
                                                    <span className="text-[10px] text-stone-400">
                                                        {formatCurrency(ret.orderTotal)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Inspection Status Badge */}
                                            {ret.inspectionStatus && ret.inspectionStatus !== 'NOT_APPLICABLE' && (
                                                <div className={`mt-1.5 text-[9px] px-1.5 py-0.5 rounded text-center font-medium ${ret.inspectionStatus === 'PASSED'
                                                    ? 'bg-emerald-50 text-emerald-600'
                                                    : ret.inspectionStatus === 'FAILED'
                                                        ? 'bg-red-50 text-red-600'
                                                        : 'bg-indigo-50 text-indigo-600'
                                                    }`}>
                                                    Inspection: {ret.inspectionStatus}
                                                </div>
                                            )}
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
