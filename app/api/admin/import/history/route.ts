import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getImportHistory } from '@/lib/csv/csvService';

/**
 * GET /api/admin/import/history
 * Get import history
 */
export async function GET() {
    try {
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
