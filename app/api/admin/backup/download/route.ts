import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getBackupPath } from '@/lib/backup/backupService';
import * as fs from 'fs/promises';

/**
 * GET /api/admin/backup/download?filename=backup-xxx.json.gz
 * Download a backup file
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const filename = searchParams.get('filename');

        if (!filename) {
            return NextResponse.json(
                { error: 'Filename is required' },
                { status: 400 }
            );
        }

        // Security: prevent directory traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return NextResponse.json(
                { error: 'Invalid filename' },
                { status: 400 }
            );
        }

        const filepath = getBackupPath(filename);

        // Check if file exists
        try {
            await fs.access(filepath);
        } catch {
            return NextResponse.json(
                { error: 'Backup file not found' },
                { status: 404 }
            );
        }

        // Read file
        const fileBuffer = await fs.readFile(filepath);

        // Return file as download
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': 'application/gzip',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Failed to download backup:', error);
        return NextResponse.json(
            { error: 'Failed to download backup' },
            { status: 500 }
        );
    }
}
