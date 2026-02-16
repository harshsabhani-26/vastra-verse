'use client';

import { useState } from 'react';
import { Bell, Check, CheckCheck, Clock, ExternalLink, Trash2 } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

// ─── Priority Color Map ─────────────────────────────────────────────────────

const priorityColors: Record<string, string> = {
    URGENT: 'bg-red-500',
    HIGH: 'bg-amber-500',
    NORMAL: 'bg-blue-400',
    LOW: 'bg-stone-300',
};

const priorityBorder: Record<string, string> = {
    URGENT: 'border-l-red-500',
    HIGH: 'border-l-amber-400',
    NORMAL: 'border-l-blue-300',
    LOW: 'border-l-stone-200',
};

// ─── Tab Categories ─────────────────────────────────────────────────────────

const tabCategories = [
    { id: 'all', label: 'All' },
    { id: 'orders', label: 'Orders', types: ['NEW_ORDER', 'ORDER_STATUS_CHANGED', 'ORDER_CANCELLED', 'ORDER_CONFIRMED'] },
    { id: 'shipping', label: 'Shipping', types: ['SHIPMENT_CREATED', 'SHIPMENT_PICKUP_SCHEDULED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED', 'RTO_INITIATED', 'COURIER_EXCEPTION'] },
    { id: 'returns', label: 'Returns', types: ['RETURN_REQUEST', 'RETURN_APPROVED', 'RETURN_REJECTED'] },
    { id: 'payments', label: 'Payments', types: ['PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'REFUND_INITIATED', 'REFUND_COMPLETED', 'REFUND_PROCESSED'] },
    { id: 'system', label: 'System', types: ['SYSTEM_ALERT', 'LOW_STOCK_ALERT', 'OUT_OF_STOCK', 'WEBHOOK_FAILURE', 'GATEWAY_ERROR'] },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications({
        pollInterval: 15000, // Poll every 15 seconds for bell
    });
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('all');

    // Filter notifications by tab
    const filteredNotifications = activeTab === 'all'
        ? notifications.slice(0, 10)
        : notifications
            .filter(n => {
                const tab = tabCategories.find(t => t.id === activeTab);
                return tab?.types?.includes(n.type) ?? false;
            })
            .slice(0, 10);

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg hover:bg-stone-100">
                    <Bell className="w-[18px] h-[18px] text-stone-600" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-md shadow-red-600/30 animate-pulse">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-[420px] max-h-[600px] overflow-hidden p-0 bg-white z-50 shadow-2xl border border-stone-200 rounded-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3 bg-stone-50/50">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-stone-800">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                {unreadCount} new
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={() => markAllAsRead()}
                            className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                            <CheckCheck size={12} />
                            Mark all read
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex border-b px-2 gap-0.5 bg-stone-50/30 overflow-x-auto scrollbar-none">
                    {tabCategories.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-2.5 py-2 text-[11px] font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id
                                    ? 'text-blue-600 border-blue-600'
                                    : 'text-stone-400 border-transparent hover:text-stone-600'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Notifications List */}
                <div className="overflow-y-auto max-h-[400px]">
                    {filteredNotifications.length === 0 ? (
                        <div className="py-12 text-center text-stone-500">
                            <Bell className="w-10 h-10 mx-auto mb-2 text-stone-200" />
                            <p className="text-xs text-stone-400">No notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-stone-100">
                            {filteredNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`px-4 py-3 hover:bg-stone-50/80 transition-colors border-l-[3px] ${priorityBorder[notification.priority] || priorityBorder.NORMAL
                                        } ${!notification.read ? 'bg-blue-50/30' : ''}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                {!notification.read && (
                                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityColors[notification.priority] || priorityColors.NORMAL}`} />
                                                )}
                                                <p className={`text-[12px] leading-snug truncate ${!notification.read ? 'font-semibold text-stone-900' : 'font-medium text-stone-600'}`}>
                                                    {notification.title}
                                                </p>
                                            </div>
                                            <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-[10px] text-stone-400 flex items-center gap-0.5">
                                                    <Clock size={9} />
                                                    {formatTime(notification.createdAt)}
                                                </span>
                                                {notification.priority === 'URGENT' && (
                                                    <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1 py-0.5 rounded uppercase tracking-wider">
                                                        Urgent
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 shrink-0">
                                            {notification.actionUrl && (
                                                <Link
                                                    href={notification.actionUrl}
                                                    onClick={() => {
                                                        if (!notification.read) markAsRead(notification.id);
                                                        setOpen(false);
                                                    }}
                                                    className="p-1 rounded hover:bg-stone-100 text-stone-400 hover:text-blue-600 transition-colors"
                                                    title="Open"
                                                >
                                                    <ExternalLink size={12} />
                                                </Link>
                                            )}
                                            {!notification.read && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="p-1 rounded hover:bg-stone-100 text-stone-400 hover:text-emerald-600 transition-colors"
                                                    title="Mark as read"
                                                >
                                                    <Check size={12} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteNotification(notification.id)}
                                                className="p-1 rounded hover:bg-stone-100 text-stone-300 hover:text-red-500 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={11} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="border-t px-4 py-2.5 bg-stone-50/50">
                        <Link href="/admin/notifications" onClick={() => setOpen(false)}>
                            <button className="w-full text-center text-xs font-medium text-blue-600 hover:text-blue-700 py-1">
                                View All Notifications
                            </button>
                        </Link>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
