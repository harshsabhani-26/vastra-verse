'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
    ArrowRight,
    RefreshCw,
    Clock,
    AlertCircle,
    ShoppingBag,
    Truck,
    RotateCcw,
    CreditCard,
    Package,
    Users,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Zap,
    Activity,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ActivityEvent {
    id: string;
    type: string;
    title: string;
    description: string;
    resourceType?: string;
    resourceId?: string;
    actionUrl?: string;
    createdAt: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    icon: string;
}

// ─── Icon Map ───────────────────────────────────────────────────────────────

const typeIcons: Record<string, { icon: React.ReactNode; color: string }> = {
    NEW_ORDER: { icon: <ShoppingBag size={14} />, color: 'text-blue-500 bg-blue-50' },
    ORDER_CONFIRMED: { icon: <CheckCircle2 size={14} />, color: 'text-emerald-500 bg-emerald-50' },
    ORDER_CANCELLED: { icon: <XCircle size={14} />, color: 'text-red-500 bg-red-50' },
    PAYMENT_RECEIVED: { icon: <CreditCard size={14} />, color: 'text-emerald-500 bg-emerald-50' },
    PAYMENT_FAILED: { icon: <AlertCircle size={14} />, color: 'text-red-500 bg-red-50' },
    SHIPMENT_CREATED: { icon: <Package size={14} />, color: 'text-violet-500 bg-violet-50' },
    DELIVERED: { icon: <CheckCircle2 size={14} />, color: 'text-emerald-500 bg-emerald-50' },
    DELIVERY_FAILED: { icon: <AlertTriangle size={14} />, color: 'text-red-500 bg-red-50' },
    RTO_INITIATED: { icon: <RotateCcw size={14} />, color: 'text-orange-500 bg-orange-50' },
    RETURN_REQUEST: { icon: <RotateCcw size={14} />, color: 'text-orange-500 bg-orange-50' },
    RETURN_APPROVED: { icon: <CheckCircle2 size={14} />, color: 'text-emerald-500 bg-emerald-50' },
    REFUND_INITIATED: { icon: <CreditCard size={14} />, color: 'text-rose-500 bg-rose-50' },
    REFUND_COMPLETED: { icon: <CheckCircle2 size={14} />, color: 'text-emerald-500 bg-emerald-50' },
    LOW_STOCK_ALERT: { icon: <AlertTriangle size={14} />, color: 'text-amber-500 bg-amber-50' },
    NEW_USER_SIGNUP: { icon: <Users size={14} />, color: 'text-sky-500 bg-sky-50' },
    SYSTEM_ALERT: { icon: <AlertCircle size={14} />, color: 'text-red-500 bg-red-50' },
    COURIER_EXCEPTION: { icon: <Zap size={14} />, color: 'text-amber-500 bg-amber-50' },
    OUT_FOR_DELIVERY: { icon: <Truck size={14} />, color: 'text-sky-500 bg-sky-50' },
};

const defaultIcon = { icon: <Activity size={14} />, color: 'text-stone-500 bg-stone-50' };

// ─── Priority Colors ────────────────────────────────────────────────────────

const priorityStyles: Record<string, string> = {
    urgent: 'border-l-red-500',
    high: 'border-l-amber-500',
    normal: 'border-l-blue-300',
    low: 'border-l-stone-200',
};

// ─── Dashboard Client Component ─────────────────────────────────────────────

export default function DashboardClient() {
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchActivity = useCallback(async (silent = false) => {
        try {
            if (!silent) setIsRefreshing(true);
            const res = await fetch('/api/admin/dashboard/activity?limit=15');
            if (res.ok) {
                const data = await res.json();
                setEvents(data.events || []);
                setLastRefresh(new Date());
            }
        } catch (err) {
            console.error('Failed to fetch activity:', err);
        } finally {
            setIsRefreshing(false);
            setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchActivity();
    }, [fetchActivity]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        intervalRef.current = setInterval(() => fetchActivity(true), 30000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchActivity]);

    return (
        <div className="bg-white rounded-xl border border-stone-200 p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                        <Activity size={14} className="text-emerald-500" />
                        Activity Feed
                    </h3>
                    <div className="flex items-center gap-1.5 ml-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] text-stone-400 font-medium">Live</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-400">
                        Updated {formatTimeAgo(lastRefresh.toISOString())}
                    </span>
                    <button
                        onClick={() => fetchActivity()}
                        disabled={isRefreshing}
                        className="p-1.5 rounded-md hover:bg-stone-100 transition-colors disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw size={13} className={`text-stone-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Activity Timeline */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="w-8 h-8 rounded-lg bg-stone-100" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-3 bg-stone-100 rounded w-3/4" />
                                <div className="h-2.5 bg-stone-50 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : events.length === 0 ? (
                <div className="py-12 text-center">
                    <Activity size={32} className="mx-auto text-stone-200 mb-3" />
                    <p className="text-sm text-stone-400">No recent activity</p>
                    <p className="text-xs text-stone-300 mt-1">Events will appear here as they happen</p>
                </div>
            ) : (
                <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                    {events.map((event) => {
                        const iconStyle = typeIcons[event.type] || defaultIcon;
                        return (
                            <div
                                key={event.id}
                                className={`flex items-start gap-3 p-2.5 rounded-lg hover:bg-stone-50/80 transition-colors border-l-2 ${priorityStyles[event.priority] || priorityStyles.normal}`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconStyle.color}`}>
                                    {iconStyle.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-medium text-stone-800 leading-snug">{event.title}</p>
                                    <p className="text-[11px] text-stone-500 mt-0.5 truncate">{event.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-stone-400 flex items-center gap-1">
                                            <Clock size={9} />
                                            {formatTimeAgo(event.createdAt)}
                                        </span>
                                        {event.priority === 'urgent' && (
                                            <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded uppercase">
                                                Urgent
                                            </span>
                                        )}
                                        {event.priority === 'high' && (
                                            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase">
                                                High
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {event.actionUrl && (
                                    <Link
                                        href={event.actionUrl}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                                    >
                                        View <ArrowRight size={10} />
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Footer */}
            {events.length > 0 && (
                <div className="mt-3 pt-3 border-t border-stone-100 text-center">
                    <Link
                        href="/admin/notifications"
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                    >
                        View All Activity <ArrowRight size={11} />
                    </Link>
                </div>
            )}
        </div>
    );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTimeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffSecs < 10) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
