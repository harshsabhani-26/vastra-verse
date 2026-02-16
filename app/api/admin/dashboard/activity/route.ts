import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { DashboardStats } from '@/lib/services/dashboard-stats';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/dashboard/activity
 * Returns the real-time activity feed for the admin dashboard
 */
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session || session.user?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20', 10);

        const feed = await DashboardStats.getActivityFeed(Math.min(limit, 50));
        return NextResponse.json({ events: feed });
    } catch (error) {
        console.error('[Activity Feed] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch activity feed' },
            { status: 500 }
        );
    }
}
