import prisma from '@/lib/prisma';
import { NotificationType, NotificationPriority, NotificationChannel, Role } from '@prisma/client';

export interface CreateNotificationParams {
    // Recipient (either userId OR role, not both)
    userId?: string;
    role?: Role;

    // Notification details
    type: NotificationType;
    title: string;
    message: string;
    priority?: NotificationPriority;

    // Related resource
    resourceType?: string;
    resourceId?: string;
    data?: any;

    // Delivery
    channels?: NotificationChannel[];

    // Action button
    actionUrl?: string;
    actionText?: string;

    // Expiry
    expiresAt?: Date;
}

class NotificationService {
    /**
     * Create a notification
     */
    async create(params: CreateNotificationParams) {
        const {
            userId,
            role,
            type,
            title,
            message,
            priority = 'NORMAL',
            resourceType,
            resourceId,
            data,
            channels = ['IN_APP'],
            actionUrl,
            actionText,
            expiresAt,
        } = params;

        // Validation: Either userId or role must be provided
        if (!userId && !role) {
            throw new Error('Either userId or role must be provided');
        }

        if (userId && role) {
            throw new Error('Cannot specify both userId and role');
        }

        // If role is specified, create notifications for all users with that role
        if (role) {
            const users = await prisma.user.findMany({
                where: { role },
                select: { id: true },
            });

            const notifications = await prisma.notification.createMany({
                data: users.map((user) => ({
                    userId: user.id,
                    role,
                    type,
                    title,
                    message,
                    priority,
                    resourceType,
                    resourceId,
                    data: data ? JSON.parse(JSON.stringify(data)) : undefined,
                    channels,
                    actionUrl,
                    actionText,
                    expiresAt,
                })),
            });

            return notifications;
        }

        // Single user notification
        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                priority,
                resourceType,
                resourceId,
                data: data ? JSON.parse(JSON.stringify(data)) : undefined,
                channels,
                actionUrl,
                actionText,
                expiresAt,
            },
        });

        return notification;
    }

    /**
     * Create and immediately send notification
     */
    async sendImmediate(params: CreateNotificationParams) {
        const notification = await this.create(params);

        // Deliver via specified channels
        if (params.channels?.includes('EMAIL')) {
            await this.deliverEmail(params);
        }

        // WhatsApp and Push can be added here
        // if (params.channels?.includes('WHATSAPP')) { await this.deliverWhatsApp(params); }
        // if (params.channels?.includes('PUSH')) { await this.deliverPush(params); }

        return notification;
    }

    /**
     * Deliver notification via email
     */
    private async deliverEmail(params: CreateNotificationParams) {
        try {
            // Dynamic import to avoid circular dependencies
            const { sendNotificationEmail } = await import('./channels/emailChannel');

            // Get recipient email
            let recipientEmails: string[] = [];

            if (params.userId) {
                const user = await prisma.user.findUnique({
                    where: { id: params.userId },
                    select: { email: true },
                });
                if (user?.email) {
                    recipientEmails.push(user.email);
                }
            }

            if (params.role) {
                const users = await prisma.user.findMany({
                    where: { role: params.role },
                    select: { email: true },
                });
                recipientEmails = users.map((u) => u.email);
            }

            // Send emails
            for (const email of recipientEmails) {
                await sendNotificationEmail(
                    email,
                    params.title,
                    params.message,
                    params.actionUrl,
                    params.actionText
                );
            }

            // Update notification status
            if (params.userId) {
                await prisma.notification.updateMany({
                    where: {
                        userId: params.userId,
                        type: params.type,
                        title: params.title,
                        emailSent: false,
                    },
                    data: {
                        emailSent: true,
                        emailSentAt: new Date(),
                    },
                });
            }
        } catch (error) {
            console.error('Email delivery error:', error);
            // Don't throw - email failure shouldn't break notification creation
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string, userId: string) {
        const notification = await prisma.notification.update({
            where: {
                id: notificationId,
                userId, // Ensure user owns this notification
            },
            data: {
                read: true,
                readAt: new Date(),
            },
        });

        return notification;
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string) {
        await prisma.notification.updateMany({
            where: {
                userId,
                read: false,
            },
            data: {
                read: true,
                readAt: new Date(),
            },
        });

        return { success: true };
    }

    /**
     * Delete a notification
     */
    async delete(notificationId: string, userId: string) {
        await prisma.notification.delete({
            where: {
                id: notificationId,
                userId, // Ensure user owns this notification
            },
        });

        return { success: true };
    }

    /**
     * Get user's notifications with filtering
     */
    async getUserNotifications(
        userId: string,
        filters?: {
            unread?: boolean;
            type?: NotificationType;
            priority?: NotificationPriority;
            limit?: number;
            offset?: number;
        }
    ) {
        const where: any = { userId };

        if (filters?.unread !== undefined) {
            where.read = !filters.unread;
        }

        if (filters?.type) {
            where.type = filters.type;
        }

        if (filters?.priority) {
            where.priority = filters.priority;
        }

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: [
                { priority: 'desc' as any }, // URGENT first
                { createdAt: 'desc' },
            ],
            take: filters?.limit || 50,
            skip: filters?.offset || 0,
        });

        return notifications;
    }

    /**
     * Get unread count for a user
     */
    async getUnreadCount(userId: string) {
        const count = await prisma.notification.count({
            where: {
                userId,
                read: false,
            },
        });

        return count;
    }

    /**
     * Delete old notifications (cleanup)
     */
    async cleanupOldNotifications() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        await prisma.notification.deleteMany({
            where: {
                OR: [
                    // Delete expired notifications
                    {
                        expiresAt: {
                            lte: new Date(),
                        },
                    },
                    // Delete read notifications older than 30 days
                    {
                        read: true,
                        createdAt: {
                            lte: thirtyDaysAgo,
                        },
                    },
                ],
            },
        });

        return { success: true };
    }

    /**
     * Check if user is in quiet hours
     */
    async isInQuietHours(userId: string): Promise<boolean> {
        const preferences = await prisma.notificationPreferences.findUnique({
            where: { userId },
        });

        if (!preferences || !preferences.quietHoursEnabled) {
            return false;
        }

        if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
            return false;
        }

        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const start = preferences.quietHoursStart;
        const end = preferences.quietHoursEnd;

        // Check if current time is within quiet hours
        if (start <= end) {
            // Same day range (e.g., 09:00 to 17:00)
            return currentTime >= start && currentTime <= end;
        } else {
            // Overnight range (e.g., 22:00 to 08:00)
            return currentTime >= start || currentTime <= end;
        }
    }

    /**
     * Get user's channel preferences for notification type
     */
    async getUserChannelPreferences(
        userId: string,
        type: NotificationType
    ): Promise<NotificationChannel[]> {
        const preferences = await prisma.notificationPreferences.findUnique({
            where: { userId },
        });

        if (!preferences) {
            // Default: IN_APP only
            return ['IN_APP'];
        }

        // Get preferences for this type
        const prefs = preferences.preferences as any;
        const typePreferences = prefs[type] as NotificationChannel[];

        if (typePreferences && Array.isArray(typePreferences)) {
            // Filter based on global toggles
            return typePreferences.filter((channel) => {
                if (channel === 'EMAIL' && !preferences.emailEnabled) return false;
                if (channel === 'WHATSAPP' && !preferences.whatsappEnabled) return false;
                if (channel === 'PUSH' && !preferences.pushEnabled) return false;
                return true;
            });
        }

        // Default: IN_APP only
        return ['IN_APP'];
    }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
