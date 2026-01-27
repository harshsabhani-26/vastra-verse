'use client';

import { useState, useEffect, useCallback } from 'react';
import { NotificationType, NotificationPriority } from '@prisma/client';

export interface Notification {
    id: string;
    userId: string | null;
    role: string | null;
    type: NotificationType;
    title: string;
    message: string;
    priority: NotificationPriority;
    resourceType: string | null;
    resourceId: string | null;
    data: any;
    channels: string[];
    read: boolean;
    readAt: Date | null;
    emailSent: boolean;
    emailSentAt: Date | null;
    whatsappSent: boolean;
    whatsappSentAt: Date | null;
    pushSent: boolean;
    pushSentAt: Date | null;
    actionUrl: string | null;
    actionText: string | null;
    createdAt: Date;
    expiresAt: Date | null;
}

interface UseNotificationsOptions {
    pollInterval?: number; // Poll for new notifications (ms)
    unreadOnly?: boolean;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
    const { pollInterval = 30000, unreadOnly = false } = options;

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNotifications = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (unreadOnly) params.set('unread', 'true');
            params.set('limit', '50');

            const response = await fetch(`/api/notifications?${params}`);

            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }

            const data = await response.json();
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching notifications:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [unreadOnly]);

    // Initial fetch
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Poll for updates
    useEffect(() => {
        if (!pollInterval) return;

        const interval = setInterval(fetchNotifications, pollInterval);
        return () => clearInterval(interval);
    }, [pollInterval, fetchNotifications]);

    const markAsRead = useCallback(async (notificationId: string) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'PUT',
            });

            if (!response.ok) {
                throw new Error('Failed to mark as read');
            }

            // Update local state
            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === notificationId ? { ...n, read: true, readAt: new Date() } : n
                )
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err: any) {
            console.error('Error marking notification as read:', err);
            throw err;
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            const response = await fetch('/api/notifications/read-all', {
                method: 'PUT',
            });

            if (!response.ok) {
                throw new Error('Failed to mark all as read');
            }

            // Update local state
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, read: true, readAt: new Date() }))
            );
            setUnreadCount(0);
        } catch (err: any) {
            console.error('Error marking all notifications as read:', err);
            throw err;
        }
    }, []);

    const deleteNotification = useCallback(async (notificationId: string) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete notification');
            }

            // Update local state
            const notification = notifications.find((n) => n.id === notificationId);
            setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

            if (notification && !notification.read) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (err: any) {
            console.error('Error deleting notification:', err);
            throw err;
        }
    }, [notifications]);

    const refresh = useCallback(() => {
        setLoading(true);
        fetchNotifications();
    }, [fetchNotifications]);

    return {
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refresh,
    };
}
