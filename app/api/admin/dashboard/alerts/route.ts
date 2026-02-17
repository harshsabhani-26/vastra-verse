import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { DashboardStats } from '@/lib/services/dashboard-stats';
import { checkUserRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/dashboard/alerts
 * Returns active system alerts
 */
export async function GET(request: NextRequest) {
    try {
        // SECURITY: Rate limiting (30 req/min for admin)
        const rateLimitResult = await checkUserRateLimit(request, 'admin');
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult;
        }

        const session = await auth();
        if (!session || session.user?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const alerts = await DashboardStats.getSystemAlerts();
        return NextResponse.json({ alerts });
    } catch (error) {
        console.error('[System Alerts] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch alerts' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/dashboard/alerts
 * Resolve a system alert
 */
export async function POST(request: NextRequest) {
    try {
        // SECURITY: Rate limiting (30 req/min for admin)
        const rateLimitResult = await checkUserRateLimit(request, 'admin');
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult;
        }

        const session = await auth();
        if (!session || session.user?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { alertId } = await request.json();
        if (!alertId) {
            return NextResponse.json({ error: 'alertId is required' }, { status: 400 });
        }

        const resolved = await DashboardStats.resolveSystemAlert(
            alertId,
            session.user?.email || 'admin'
        );
        return NextResponse.json(resolved);
    } catch (error) {
        console.error('[Resolve Alert] Error:', error);
        return NextResponse.json(
            { error: 'Failed to resolve alert' },
            { status: 500 }
        );
    }
}
