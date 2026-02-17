import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getFailedJobs, retryFailedJob } from '@/lib/queue';
import { checkUserRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/admin/jobs/failed?queue=email&start=0&end=20
 * 
 * Lists failed jobs for a specific queue.
 * 
 * POST /api/admin/jobs/failed
 * { queue: "email", jobId: "123" }
 * 
 * Retries a specific failed job.
 */
export async function GET(req: NextRequest) {
    try {
        const rateLimitResult = await checkUserRateLimit(req, 'default');
        if (rateLimitResult instanceof NextResponse) return rateLimitResult;

        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminEmail = process.env.ADMIN_EMAIL;
        if (session.user.email.toLowerCase() !== adminEmail?.toLowerCase()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const queue = searchParams.get('queue') || 'email';
        const start = parseInt(searchParams.get('start') || '0');
        const end = parseInt(searchParams.get('end') || '20');

        const failedJobs = await getFailedJobs(queue, start, end);

        return NextResponse.json({
            queue,
            jobs: failedJobs,
            count: failedJobs.length,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[Admin Failed Jobs] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch failed jobs' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const rateLimitResult = await checkUserRateLimit(req, 'default');
        if (rateLimitResult instanceof NextResponse) return rateLimitResult;

        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminEmail = process.env.ADMIN_EMAIL;
        if (session.user.email.toLowerCase() !== adminEmail?.toLowerCase()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { queue, jobId } = await req.json();

        if (!queue || !jobId) {
            return NextResponse.json(
                { error: 'queue and jobId are required' },
                { status: 400 }
            );
        }

        const success = await retryFailedJob(queue, jobId);

        return NextResponse.json({
            success,
            message: success ? 'Job retried' : 'Job not found',
        });
    } catch (error) {
        console.error('[Admin Retry Job] Error:', error);
        return NextResponse.json(
            { error: 'Failed to retry job' },
            { status: 500 }
        );
    }
}
