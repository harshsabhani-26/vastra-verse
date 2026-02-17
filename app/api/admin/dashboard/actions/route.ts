import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { DashboardStats } from '@/lib/services/dashboard-stats';
import { checkUserRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/dashboard/actions
 * Returns action-required items needing admin attention
 */
export async function GET(req: NextRequest) {
    try {
        // SECURITY: Rate limiting (30 req/min for admin)
        const rateLimitResult = await checkUserRateLimit(req, 'admin');
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult;
        }

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
