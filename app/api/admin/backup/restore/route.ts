import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { restoreBackup } from '@/lib/backup/backupService';

/**
 * POST /api/admin/backup/restore
 * Restore database from backup file
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { filename } = body;

        if (!filename) {
            return NextResponse.json(
                { error: 'Filename is required' },
                { status: 400 }
            );
        }

        const result = await restoreBackup(filename);

        if (result.success) {
            return NextResponse.json({
                success: true,
                restoredRecords: result.restoredRecords,
            });
        } else {
            return NextResponse.json(
                { error: result.error || 'Restore failed' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Failed to restore backup:', error);
        return NextResponse.json(
            { error: 'Failed to restore backup' },
            { status: 500 }
        );
    }
}
