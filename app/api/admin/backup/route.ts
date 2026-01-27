import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createBackup, listBackups } from '@/lib/backup/backupService';
import { requireAdmin, unauthorizedResponse } from '@/lib/auth-utils';

/**
 * GET /api/admin/backup
 * List all available backups
 */
export async function GET() {
    try {
        const adminCheck = await requireAdmin();
        if (!adminCheck.authorized) {
            return unauthorizedResponse(adminCheck.reason);
        }

        const backups = await listBackups();

        return NextResponse.json({ backups });
    } catch (error) {
        console.error('Failed to list backups:', error);
        return NextResponse.json(
            { error: 'Failed to list backups' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/backup
 * Create a manual backup
 */
export async function POST() {
    try {
        const adminCheck = await requireAdmin();
        if (!adminCheck.authorized) {
            return unauthorizedResponse(adminCheck.reason);
        }
        const session = adminCheck.session!;

        const result = await createBackup('MANUAL', session.user.id);

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
        console.error('Failed to create backup:', error);
        return NextResponse.json(
            { error: 'Failed to create backup' },
            { status: 500 }
        );
    }
}
