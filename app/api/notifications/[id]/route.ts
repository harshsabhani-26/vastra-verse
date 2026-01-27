import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { notificationService } from '@/lib/notifications/notificationService';

// PUT /api/notifications/[id]/read - Mark notification as read
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const notification = await notificationService.markAsRead(
            id,
            session.user.id
        );

        return NextResponse.json(notification);
    } catch (error: any) {
        console.error('Error marking notification as read:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to mark notification as read' },
            { status: 500 }
        );
    }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await notificationService.delete(id, session.user.id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting notification:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete notification' },
            { status: 500 }
        );
    }
}
