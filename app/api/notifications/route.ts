import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { notificationService } from '@/lib/notifications/notificationService';
import { NotificationType, NotificationPriority } from '@prisma/client';

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);

        const unread = searchParams.get('unread') === 'true';
        const type = searchParams.get('type') as NotificationType | null;
        const priority = searchParams.get('priority') as NotificationPriority | null;
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const notifications = await notificationService.getUserNotifications(
            session.user.id,
            {
                unread: unread || undefined,
                type: type || undefined,
                priority: priority || undefined,
                limit,
                offset,
            }
        );

        const unreadCount = await notificationService.getUnreadCount(session.user.id);

        return NextResponse.json({
            notifications,
            unreadCount,
            limit,
            offset,
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: 500 }
        );
    }
}
