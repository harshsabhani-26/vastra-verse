import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getImportHistory } from '@/lib/csv/csvService';
import { checkUserRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/admin/import/history
 * Get import history
 */
export async function GET(req: NextRequest) {
    try {
        // SECURITY: Rate limiting (30 req/min for admin)
        const rateLimitResult = await checkUserRateLimit(req, 'admin');
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult;
        }

        const session = await auth();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const imports = await getImportHistory();

        return NextResponse.json({ imports });
    } catch (error) {
        console.error('Failed to get import history:', error);
        return NextResponse.json(
            { error: 'Failed to get import history' },
            { status: 500 }
        );
    }
}
