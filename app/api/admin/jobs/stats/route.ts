import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getQueueStats } from '@/lib/queue';
import { getCircuitBreakerStates } from '@/lib/circuit-breaker';
import { checkUserRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/admin/jobs/stats
 * 
 * Returns real-time stats for all job queues and circuit breakers.
 * Admin-only endpoint.
 */
export async function GET(req: NextRequest) {
    try {
        // Rate limit
        const rateLimitResult = await checkUserRateLimit(req, 'default');
        if (rateLimitResult instanceof NextResponse) return rateLimitResult;

        // Auth check
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminEmail = process.env.ADMIN_EMAIL;
        if (session.user.email.toLowerCase() !== adminEmail?.toLowerCase()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch stats
        const [queueStats, circuitBreakers] = await Promise.all([
            getQueueStats(),
            Promise.resolve(getCircuitBreakerStates()),
        ]);

        return NextResponse.json({
            queues: queueStats,
            circuitBreakers,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[Admin Jobs Stats] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch job stats' },
            { status: 500 }
        );
    }
}
