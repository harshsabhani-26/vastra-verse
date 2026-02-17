import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { setup2FA } from '@/lib/admin-security';

/**
 * POST /api/admin/2fa/setup
 * 
 * Initiates 2FA enrollment for an admin user.
 * Returns QR code URL, secret, and backup codes.
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }

        const result = await setup2FA(session.user.id);
        if (!result) {
            return NextResponse.json(
                { error: 'Failed to set up 2FA' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            otpAuthUrl: result.otpAuthUrl,
            secret: result.secret,
            backupCodes: result.backupCodes,
            message: 'Scan the QR code with your authenticator app, then verify with a code to activate.',
        });
    } catch (error) {
        console.error('[2FA] Setup error:', error);
        return NextResponse.json(
            { error: 'Failed to set up 2FA' },
            { status: 500 }
        );
    }
}
