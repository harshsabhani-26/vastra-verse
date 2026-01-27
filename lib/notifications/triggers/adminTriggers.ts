import { notificationService } from '../notificationService';
import { User } from '@prisma/client';

/**
 * Trigger notification when a new user signs up
 */
export async function notifyNewUserSignup(user: User) {
    await notificationService.sendImmediate({
        role: 'ADMIN',
        type: 'NEW_USER_SIGNUP',
        title: 'New User Signup',
        message: `${user.name || user.email} just signed up`,
        priority: 'LOW',
        resourceType: 'User',
        resourceId: user.id,
        actionUrl: `/admin/customers/${user.id}`,
        actionText: 'View Profile',
        data: {
            userId: user.id,
            email: user.email,
            name: user.name,
        },
    });
}

/**
 * Trigger notification for bulk admin action
 */
export async function notifyBulkAction(
    action: string,
    count: number,
    performedBy: string
) {
    await notificationService.sendImmediate({
        role: 'ADMIN',
        type: 'ADMIN_ACTION',
        title: 'Bulk Action Performed',
        message: `${performedBy} performed ${action} on ${count} items`,
        priority: 'NORMAL',
        data: {
            action,
            count,
            performedBy,
        },
    });
}

/**
 * Trigger notification for system errors (urgent)
 */
export async function notifySystemError(
    error: Error,
    context?: Record<string, any>
) {
    await notificationService.sendImmediate({
        role: 'ADMIN',
        type: 'SYSTEM_ALERT',
        title: 'System Error',
        message: `Critical error: ${error.message}`,
        priority: 'URGENT',
        data: {
            error: error.message,
            stack: error.stack,
            context,
        },
    });
}

/**
 * Trigger notification for system alerts
 */
export async function notifySystemAlert(
    title: string,
    message: string,
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL'
) {
    await notificationService.sendImmediate({
        role: 'ADMIN',
        type: 'SYSTEM_ALERT',
        title,
        message,
        priority,
    });
}
