import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { exportOrdersToCSV } from '@/lib/csv/csvService';
import { checkUserRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/admin/export/orders
 * Export all orders as CSV
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

        const csv = await exportOrdersToCSV();

        const filename = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Failed to export orders:', error);
        return NextResponse.json(
            { error: 'Failed to export orders' },
            { status: 500 }
        );
    }
}
