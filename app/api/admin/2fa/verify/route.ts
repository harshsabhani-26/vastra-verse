import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { verify2FAToken } from '@/lib/admin-security';
import prisma from '@/lib/prisma';

/**
 * POST /api/admin/2fa/verify
 * 
 * Verifies a 2FA TOTP code during login or enrollment.
 * On first verification, enables 2FA for the user.
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

        const body = await req.json();
        const { token, isSetup } = body;

        if (!token || typeof token !== 'string' || token.length !== 6) {
            return NextResponse.json(
                { error: 'Invalid token format. Must be 6 digits.' },
                { status: 400 }
            );
        }

        // Verify the TOTP token
        const result = await verify2FAToken(session.user.id, token);

        if (!result.valid) {
            return NextResponse.json(
                { error: result.error || 'Invalid verification code' },
                { status: 401 }
            );
        }

        // If this is initial setup, enable 2FA
        if (isSetup) {
            await prisma.user.update({
                where: { id: session.user.id },
                data: { twoFactorEnabled: true },
            });

            // Log the action
            await prisma.activityLog.create({
                data: {
                    userId: session.user.id,
                    userEmail: session.user.email || undefined,
                    action: '2FA_ENABLED',
                    description: 'Two-factor authentication enabled for admin account',
                    resourceType: 'Security',
                    resourceId: session.user.id,
                    status: 'SUCCESS',
                },
            });

            return NextResponse.json({
                success: true,
                message: '2FA has been successfully enabled for your account.',
            });
        }

        return NextResponse.json({
            success: true,
            message: '2FA verification successful.',
        });
    } catch (error) {
        console.error('[2FA] Verification error:', error);
        return NextResponse.json(
            { error: 'Verification failed' },
            { status: 500 }
        );
    }
}
