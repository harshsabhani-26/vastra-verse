import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { notificationService } from '@/lib/notifications/notificationService';

// PUT /api/notifications/read-all - Mark all notifications as read
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await notificationService.markAllAsRead(session.user.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return NextResponse.json(
            { error: 'Failed to mark all notifications as read' },
            { status: 500 }
        );
    }
}
