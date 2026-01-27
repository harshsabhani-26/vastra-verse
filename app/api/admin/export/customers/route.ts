import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { exportCustomersToCSV } from '@/lib/csv/csvService';

/**
 * GET /api/admin/export/customers
 * Export all customers as CSV
 */
export async function GET() {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const csv = await exportCustomersToCSV();

        const filename = `customers-export-${new Date().toISOString().split('T')[0]}.csv`;

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Failed to export customers:', error);
        return NextResponse.json(
            { error: 'Failed to export customers' },
            { status: 500 }
        );
    }
}
