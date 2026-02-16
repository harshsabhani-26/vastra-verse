'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Clock, Package, CheckCircle2, Truck, Home, XCircle,
    RefreshCw, Eye, ChevronRight, ArrowRight
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface OrderCard {
    id: string;
    customerName: string | null;
    total: number;
    status: string;
    paymentMethod: string | null;
    paymentStatus: string;
    createdAt: string;
    updatedAt: string;
    trackingNumber: string | null;
    itemCount: number;
    user: { name: string | null; email: string | null } | null;
}

interface BoardColumn {
    status: string;
    orders: OrderCard[];
    total: number;
}

// ─── Column Config ──────────────────────────────────────────────────────────

const columnConfig: Record<string, {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
    headerBg: string;
}> = {
    PENDING: {
        label: 'Pending',
        icon: Clock,
        color: 'text-amber-700',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        headerBg: 'bg-amber-100/80',
    },
    CONFIRMED: {
        label: 'Confirmed',
        icon: CheckCircle2,
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        headerBg: 'bg-blue-100/80',
    },
    PACKED: {
        label: 'Packed',
        icon: Package,
        color: 'text-violet-700',
        bgColor: 'bg-violet-50',
        borderColor: 'border-violet-200',
        headerBg: 'bg-violet-100/80',
    },
    SHIPPED: {
        label: 'In Transit',
        icon: Truck,
        color: 'text-indigo-700',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200',
        headerBg: 'bg-indigo-100/80',
    },
    DELIVERED: {
        label: 'Delivered',
        icon: Home,
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        headerBg: 'bg-emerald-100/80',
    },
    CANCELLED: {
        label: 'Cancelled',
        icon: XCircle,
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        headerBg: 'bg-red-100/80',
    },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(date: string): string {
    const diffMs = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function OrderBoardPage() {
    const [board, setBoard] = useState<BoardColumn[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchBoard = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const res = await fetch('/api/admin/orders/board');
            if (res.ok) {
                const data = await res.json();
                setBoard(data.board);
                setLastUpdated(new Date());
            }
        } catch (err) {
            console.error('Failed to fetch board:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchBoard();
    }, [fetchBoard]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => fetchBoard(true), 30000);
        return () => clearInterval(interval);
    }, [fetchBoard]);

    const totalOrders = board.reduce((sum, col) => sum + col.total, 0);
    const actionNeeded = board
        .filter((c) => ['PENDING', 'CONFIRMED'].includes(c.status))
        .reduce((sum, c) => sum + c.total, 0);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-12 bg-stone-100 rounded-xl animate-pulse" />
                <div className="grid grid-cols-6 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-stone-100 rounded-xl h-96 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-stone-900">Order Pipeline</h1>
                    <p className="text-xs text-stone-500 mt-0.5">
                        {totalOrders} total orders &middot; {actionNeeded} need action
                        {lastUpdated && ` · Updated ${timeAgo(lastUpdated.toISOString())}`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/admin/orders" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                        List View <ChevronRight size={12} />
                    </Link>
                    <button
                        onClick={() => fetchBoard(true)}
                        disabled={refreshing}
                        className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Flow Arrow Bar */}
            <div className="flex items-center gap-1 px-2">
                {board.map((col, i) => {
                    const config = columnConfig[col.status];
                    if (!config) return null;
                    const Icon = config.icon;
                    return (
                        <div key={col.status} className="flex items-center flex-1">
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${config.headerBg} flex-1`}>
                                <Icon size={14} className={config.color} />
                                <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
                                <span className={`ml-auto text-[10px] font-bold ${config.color} bg-white/60 px-1.5 py-0.5 rounded-full`}>
                                    {col.total}
                                </span>
                            </div>
                            {i < board.length - 1 && (
                                <ArrowRight size={14} className="text-stone-300 shrink-0 mx-0.5" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-6 gap-3 min-h-[600px]">
                {board.map((col) => {
                    const config = columnConfig[col.status];
                    if (!config) return null;
                    return (
                        <div
                            key={col.status}
                            className={`rounded-xl border ${config.borderColor} ${config.bgColor} flex flex-col min-h-0`}
                        >
                            {/* Column Header */}
                            <div className={`px-3 py-2.5 ${config.headerBg} rounded-t-xl border-b ${config.borderColor}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <config.icon size={14} className={config.color} />
                                        <span className={`text-xs font-bold ${config.color}`}>{config.label}</span>
                                    </div>
                                    <span className={`text-[10px] font-bold ${config.color} bg-white/60 px-1.5 py-0.5 rounded-full`}>
                                        {col.total}
                                    </span>
                                </div>
                            </div>

                            {/* Cards */}
                            <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[calc(100vh-280px)]">
                                {col.orders.length === 0 ? (
                                    <div className="text-center py-8">
                                        <config.icon size={20} className="mx-auto text-stone-300 mb-1" />
                                        <p className="text-[10px] text-stone-400">No orders</p>
                                    </div>
                                ) : (
                                    col.orders.map((order) => (
                                        <Link
                                            key={order.id}
                                            href={`/admin/orders/${order.id}`}
                                            className="block bg-white rounded-lg border border-stone-200/80 p-2.5 hover:shadow-md hover:border-stone-300 transition-all group cursor-pointer"
                                        >
                                            {/* Order ID + Amount */}
                                            <div className="flex items-start justify-between">
                                                <span className="text-[10px] font-mono text-stone-400 truncate">
                                                    #{order.id.slice(-8)}
                                                </span>
                                                <span className="text-[11px] font-bold text-stone-800">
                                                    {formatCurrency(order.total)}
                                                </span>
                                            </div>

                                            {/* Customer */}
                                            <p className="text-[11px] font-medium text-stone-700 mt-1 truncate">
                                                {order.customerName || order.user?.name || 'Guest'}
                                            </p>

                                            {/* Meta Row */}
                                            <div className="flex items-center justify-between mt-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${order.paymentMethod === 'COD'
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : 'bg-emerald-100 text-emerald-700'
                                                        }`}>
                                                        {order.paymentMethod === 'COD' ? 'COD' : 'Prepaid'}
                                                    </span>
                                                    <span className="text-[9px] text-stone-400">
                                                        {order.itemCount} items
                                                    </span>
                                                </div>
                                                <Eye size={10} className="text-stone-300 group-hover:text-blue-500 transition-colors" />
                                            </div>

                                            {/* Time */}
                                            <div className="flex items-center gap-1 mt-1.5">
                                                <Clock size={9} className="text-stone-300" />
                                                <span className="text-[9px] text-stone-400">{timeAgo(order.createdAt)}</span>
                                            </div>

                                            {/* Tracking */}
                                            {order.trackingNumber && (
                                                <div className="mt-1.5 text-[9px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded truncate">
                                                    AWB: {order.trackingNumber}
                                                </div>
                                            )}
                                        </Link>
                                    ))
                                )}
                                {col.total > col.orders.length && (
                                    <div className="text-center py-2">
                                        <span className="text-[10px] text-stone-400">
                                            +{col.total - col.orders.length} more
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
