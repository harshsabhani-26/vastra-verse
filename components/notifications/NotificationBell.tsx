'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import NotificationList from './NotificationList';
import Link from 'next/link';

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications({
        pollInterval: 30000, // Poll every 30 seconds
    });
    const [open, setOpen] = useState(false);

    // Get recent notifications (last 5)
    const recentNotifications = notifications.slice(0, 5);

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-96 max-h-[600px] overflow-hidden p-0 bg-white z-50 shadow-xl border border-stone-200">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h3 className="font-semibold text-lg">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAllAsRead()}
                            className="text-xs text-blue-600 hover:text-blue-700"
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>

                {/* Notifications List */}
                <div className="overflow-y-auto max-h-[450px]">
                    {recentNotifications.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm">No notifications</p>
                        </div>
                    ) : (
                        <NotificationList
                            notifications={recentNotifications}
                            onMarkAsRead={markAsRead}
                            onDelete={deleteNotification}
                            compact
                        />
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="border-t px-4 py-3">
                        <Link href="/admin/notifications">
                            <Button variant="ghost" className="w-full" onClick={() => setOpen(false)}>
                                View All Notifications
                            </Button>
                        </Link>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
