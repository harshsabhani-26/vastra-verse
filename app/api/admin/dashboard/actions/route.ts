import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { DashboardStats } from '@/lib/services/dashboard-stats';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/dashboard/actions
 * Returns action-required items needing admin attention
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session || session.user?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const actions = await DashboardStats.getActionRequired();
        return NextResponse.json(actions);
    } catch (error) {
        console.error('[Action Required] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch action items' },
            { status: 500 }
        );
    }
}
