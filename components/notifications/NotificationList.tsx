'use client';

import { Notification } from '@/hooks/useNotifications';
import NotificationItem from './NotificationItem';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';

interface NotificationListProps {
    notifications: Notification[];
    onMarkAsRead: (id: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    compact?: boolean; // Compact mode for dropdown
}

export default function NotificationList({
    notifications,
    onMarkAsRead,
    onDelete,
    compact = false,
}: NotificationListProps) {
    if (compact) {
        // Simple list for dropdown
        return (
            <div>
                {notifications.map((notification) => (
                    <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={onMarkAsRead}
                        onDelete={onDelete}
                        compact
                    />
                ))}
            </div>
        );
    }

    // Grouped list for full page
    const groupedNotifications = groupNotificationsByDate(notifications);

    return (
        <div className="space-y-6">
            {Object.entries(groupedNotifications).map(([group, notifs]) => (
                <div key={group}>
                    <h3 className="text-sm font-semibold text-gray-600 mb-3 px-4">
                        {group}
                    </h3>
                    <div className="space-y-1">
                        {notifs.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={onMarkAsRead}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function groupNotificationsByDate(notifications: Notification[]) {
    const groups: Record<string, Notification[]> = {
        Today: [],
        Yesterday: [],
        'This Week': [],
        Older: [],
    };

    notifications.forEach((notification) => {
        const date = new Date(notification.createdAt);

        if (isToday(date)) {
            groups.Today.push(notification);
        } else if (isYesterday(date)) {
            groups.Yesterday.push(notification);
        } else if (isThisWeek(date, { weekStartsOn: 0 })) {
            groups['This Week'].push(notification);
        } else {
            groups.Older.push(notification);
        }
    });

    // Remove empty groups
    Object.keys(groups).forEach((key) => {
        if (groups[key].length === 0) {
            delete groups[key];
        }
    });

    return groups;
}
