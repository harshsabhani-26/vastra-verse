import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { deleteBackup } from '@/lib/backup/backupService';

/**
 * DELETE /api/admin/backup/delete
 * Delete a backup file
 */
export async function DELETE(request: NextRequest) {
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

        // Security: prevent directory traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return NextResponse.json(
                { error: 'Invalid filename' },
                { status: 400 }
            );
        }

        const success = await deleteBackup(filename);

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { error: 'Failed to delete backup' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Failed to delete backup:', error);
        return NextResponse.json(
            { error: 'Failed to delete backup' },
            { status: 500 }
        );
    }
}
