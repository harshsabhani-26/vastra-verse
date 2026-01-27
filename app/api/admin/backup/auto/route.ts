import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createBackup } from '@/lib/backup/backupService';

/**
 * POST /api/admin/backup/auto
 * Trigger automatic backup (for cron jobs)
 */
export async function POST(request: NextRequest) {
    try {
        // Check for API key or session
        const apiKey = request.headers.get('x-api-key');
        const session = await auth();

        // Verify authorization (either valid API key or admin session)
        const expectedApiKey = process.env.BACKUP_API_KEY;
        const isAuthorized =
            (expectedApiKey && apiKey === expectedApiKey) ||
            (session && session.user.role === 'ADMIN');

        if (!isAuthorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await createBackup('AUTOMATIC');

        if (result.success) {
            return NextResponse.json({
                success: true,
                backup: result,
            });
        } else {
            return NextResponse.json(
                { error: result.error || 'Backup failed' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Failed to create automatic backup:', error);
        return NextResponse.json(
            { error: 'Failed to create backup' },
            { status: 500 }
        );
    }
}
