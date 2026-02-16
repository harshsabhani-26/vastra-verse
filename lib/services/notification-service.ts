import prisma from '@/lib/prisma';
import { NotificationType, NotificationPriority, NotificationChannel, Role } from '@prisma/client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CreateNotificationInput {
    type: NotificationType;
    title: string;
    message: string;
    priority?: NotificationPriority;
    channels?: NotificationChannel[];
    role?: Role;
    userId?: string;
    resourceType?: string;
    resourceId?: string;
    actionUrl?: string;
    actionText?: string;
    data?: Record<string, unknown>;
    expiresAt?: Date;
}

// ─── Notification Service ───────────────────────────────────────────────────

export const NotificationService = {
    /**
     * Create a new notification
     */
    create: async (input: CreateNotificationInput) => {
        try {
            return await prisma.notification.create({
                data: {
                    type: input.type,
                    title: input.title,
                    message: input.message,
                    priority: input.priority || 'NORMAL',
                    channels: input.channels || ['IN_APP'],
                    role: input.role || 'ADMIN',
                    userId: input.userId,
                    resourceType: input.resourceType,
                    resourceId: input.resourceId,
                    actionUrl: input.actionUrl,
                    actionText: input.actionText,
                    data: input.data as any,
                    expiresAt: input.expiresAt,
                },
            });
        } catch (error) {
            console.error('[NotificationService] create failed:', error);
            // Non-blocking: don't throw, just log
            return null;
        }
    },

    /**
     * Create multiple notifications (batch)
     */
    createMany: async (inputs: CreateNotificationInput[]) => {
        try {
            return await prisma.notification.createMany({
                data: inputs.map((input) => ({
                    type: input.type,
                    title: input.title,
                    message: input.message,
                    priority: input.priority || 'NORMAL',
                    channels: input.channels || ['IN_APP'],
                    role: input.role || 'ADMIN',
                    userId: input.userId,
                    resourceType: input.resourceType,
                    resourceId: input.resourceId,
                    actionUrl: input.actionUrl,
                    actionText: input.actionText,
                    data: input.data as any,
                    expiresAt: input.expiresAt,
                })),
            });
        } catch (error) {
            console.error('[NotificationService] createMany failed:', error);
            return null;
        }
    },

    /**
     * Get notifications for admin with filters
     */
    getAdminNotifications: async (options: {
        limit?: number;
        offset?: number;
        unreadOnly?: boolean;
        type?: NotificationType;
        priority?: NotificationPriority;
    } = {}) => {
        const { limit = 50, offset = 0, unreadOnly = false, type, priority } = options;

        const where: any = { role: 'ADMIN' };
        if (unreadOnly) where.read = false;
        if (type) where.type = type;
        if (priority) where.priority = priority;

        const [notifications, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            prisma.notification.count({ where }),
            prisma.notification.count({
                where: { role: 'ADMIN', read: false },
            }),
        ]);

        return { notifications, total, unreadCount };
    },

    /**
     * Get unread count for admin
     */
    getUnreadCount: async () => {
        return prisma.notification.count({
            where: { role: 'ADMIN', read: false },
        });
    },

    /**
     * Mark a notification as read
     */
    markAsRead: async (id: string) => {
        return prisma.notification.update({
            where: { id },
            data: { read: true, readAt: new Date() },
        });
    },

    /**
     * Mark all admin notifications as read
     */
    markAllAsRead: async () => {
        return prisma.notification.updateMany({
            where: { role: 'ADMIN', read: false },
            data: { read: true, readAt: new Date() },
        });
    },

    /**
     * Delete a notification
     */
    delete: async (id: string) => {
        return prisma.notification.delete({ where: { id } });
    },

    /**
     * Cleanup old read notifications (30+ days)
     */
    cleanup: async (daysOld: number = 30) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysOld);

        return prisma.notification.deleteMany({
            where: {
                read: true,
                createdAt: { lt: cutoff },
            },
        });
    },
};
