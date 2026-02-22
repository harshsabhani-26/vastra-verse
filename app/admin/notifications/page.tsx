'use client';

import { useNotifications } from '@/hooks/useNotifications';
import NotificationList from '@/components/notifications/NotificationList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Check, Filter, Loader2, Download } from 'lucide-react';
import { useState } from 'react';
import { NotificationType, NotificationPriority } from '@prisma/client';

export default function NotificationsPage() {
    const [filterUnread, setFilterUnread] = useState(false);
    const {
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refresh
    } = useNotifications({
        pollInterval: 30000,
        unreadOnly: filterUnread,
    });

    // Export notifications to CSV
    const exportToCSV = () => {
        if (notifications.length === 0) {
            alert('No notifications to export');
            return;
        }

        // Define CSV headers
        const headers = ['ID', 'Type', 'Priority', 'Title', 'Message', 'Read', 'Created At', 'Read At'];

        // Convert notifications to CSV rows
        const rows = notifications.map(notification => [
            notification.id,
            notification.type,
            notification.priority,
            notification.title,
            notification.message.replace(/"/g, '""'), // Escape quotes in message
            notification.read ? 'Yes' : 'No',
            new Date(notification.createdAt).toLocaleString(),
            notification.readAt ? new Date(notification.readAt).toLocaleString() : 'N/A'
        ]);

        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `notifications_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                    Error loading notifications: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917]">Notifications</h1>
                    <p className="text-sm text-stone-500 mt-1">
                        {unreadCount > 0
                            ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                            : 'All caught up!'
                        }
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={exportToCSV}>
                        <Download className="w-5 h-5 mr-2" />
                        Export CSV
                    </Button>

                    <Button variant="outline" onClick={refresh}>
                        Refresh
                    </Button>

                    {unreadCount > 0 && (
                        <Button onClick={markAllAsRead}>
                            <Check className="w-5 h-5 mr-2" />
                            Mark All as Read
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-stone-600">Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight text-stone-800">{notifications.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-stone-600">Unread</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight text-blue-600">{unreadCount}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-stone-600">Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight text-stone-800">
                            {notifications.filter(n => n.type.includes('ORDER')).length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-stone-600">Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight text-red-600">
                            {notifications.filter(n => n.priority === 'URGENT' || n.priority === 'HIGH').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <Button
                    variant={filterUnread ? 'default' : 'outline'}
                    onClick={() => setFilterUnread(!filterUnread)}
                >
                    <Filter className="w-5 h-5 mr-2" />
                    {filterUnread ? 'Show All' : 'Show Unread Only'}
                </Button>
            </div>

            {/* Notifications List */}
            <Card>
                <CardContent className="p-0">
                    {notifications.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">No notifications</p>
                            <p className="text-sm mt-1">
                                {filterUnread
                                    ? "You don't have any unread notifications"
                                    : "You're all caught up!"}
                            </p>
                        </div>
                    ) : (
                        <NotificationList
                            notifications={notifications}
                            onMarkAsRead={markAsRead}
                            onDelete={deleteNotification}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
