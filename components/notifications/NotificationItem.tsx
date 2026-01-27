'use client';

import { Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import {
    ShoppingCart,
    CreditCard,
    Package,
    AlertTriangle,
    UserPlus,
    Shield,
    Bell,
    X,
    Dot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: (id: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    compact?: boolean;
}

export default function NotificationItem({
    notification,
    onMarkAsRead,
    onDelete,
    compact = false,
}: NotificationItemProps) {
    const handleClick = async () => {
        if (!notification.read) {
            await onMarkAsRead(notification.id);
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        await onDelete(notification.id);
    };

    const icon = getNotificationIcon(notification.type);
    const iconColor = getPriorityColor(notification.priority);

    const content = (
        <div
            className={cn(
                'flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer',
                !notification.read && 'bg-blue-50',
                compact && 'px-3 py-2'
            )}
            onClick={handleClick}
        >
            {/* Icon */}
            <div className={cn('flex-shrink-0 mt-1', iconColor)}>
                {icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <h4 className={cn(
                        'font-medium text-sm',
                        !notification.read && 'text-gray-900',
                        notification.read && 'text-gray-700'
                    )}>
                        {notification.title}
                    </h4>

                    {!notification.read && (
                        <Dot className="w-6 h-6 text-blue-600 flex-shrink-0 -mt-1" />
                    )}
                </div>

                <p className={cn(
                    'text-sm mt-1 line-clamp-2',
                    notification.read ? 'text-gray-500' : 'text-gray-600'
                )}>
                    {notification.message}
                </p>

                <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>

                    {notification.actionUrl && notification.actionText && (
                        <span className="text-xs text-blue-600 font-medium">
                            {notification.actionText}
                        </span>
                    )}
                </div>
            </div>

            {/* Delete button */}
            {!compact && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 hover:bg-red-50 hover:text-red-600"
                    onClick={handleDelete}
                >
                    <X className="w-4 h-4" />
                </Button>
            )}
        </div>
    );

    // Wrap with link if action URL exists
    if (notification.actionUrl) {
        return (
            <Link href={notification.actionUrl} className="block border-b last:border-0">
                {content}
            </Link>
        );
    }

    return <div className="border-b last:border-0">{content}</div>;
}

function getNotificationIcon(type: string) {
    const iconClass = "w-5 h-5";

    switch (type) {
        case 'NEW_ORDER':
        case 'ORDER_STATUS_CHANGED':
        case 'ORDER_CANCELLED':
            return <ShoppingCart className={iconClass} />;

        case 'PAYMENT_RECEIVED':
        case 'PAYMENT_FAILED':
            return <CreditCard className={iconClass} />;

        case 'LOW_STOCK_ALERT':
        case 'OUT_OF_STOCK':
            return <Package className={iconClass} />;

        case 'RETURN_REQUEST':
        case 'REFUND_PROCESSED':
            return <Package className={iconClass} />;

        case 'NEW_USER_SIGNUP':
            return <UserPlus className={iconClass} />;

        case 'ADMIN_ACTION':
            return <Shield className={iconClass} />;

        case 'SYSTEM_ALERT':
            return <AlertTriangle className={iconClass} />;

        default:
            return <Bell className={iconClass} />;
    }
}

function getPriorityColor(priority: string) {
    switch (priority) {
        case 'URGENT':
            return 'text-red-600';
        case 'HIGH':
            return 'text-orange-600';
        case 'NORMAL':
            return 'text-blue-600';
        case 'LOW':
            return 'text-gray-500';
        default:
            return 'text-blue-600';
    }
}
