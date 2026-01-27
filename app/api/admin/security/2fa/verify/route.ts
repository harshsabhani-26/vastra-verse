import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { verifyTOTP } from '@/lib/security/twoFactor';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { secret, token } = await request.json();

        if (!secret || !token) {
            return NextResponse.json(
                { error: 'Secret and token are required' },
                { status: 400 }
            );
        }

        // Verify the token
        const isValid = verifyTOTP(secret, token);

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid verification code' },
                { status: 400 }
            );
        }

        // Enable 2FA for the user
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                twoFactorEnabled: true,
                twoFactorSecret: secret, // In production, encrypt this!
            },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: session.user.id,
                userEmail: session.user.email,
                action: 'ENABLE_2FA',
                description: 'Enabled two-factor authentication',
                resourceType: 'User',
                resourceId: session.user.id,
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
                userAgent: request.headers.get('user-agent'),
                method: 'POST',
                path: '/api/admin/security/2fa/verify',
            },
        });

        return NextResponse.json({
            success: true,
            message: '2FA has been successfully enabled',
        });
    } catch (error) {
        console.error('2FA verification error:', error);
        return NextResponse.json({ error: 'Failed to verify 2FA' }, { status: 500 });
    }
}
