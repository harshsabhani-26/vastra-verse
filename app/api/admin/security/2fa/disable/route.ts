import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { password } = await request.json();

        if (!password) {
            return NextResponse.json(
                { error: 'Password is required to disable 2FA' },
                { status: 400 }
            );
        }

        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                password: true,
                twoFactorEnabled: true,
            },
        });

        if (!user?.password) {
            return NextResponse.json(
                { error: 'Cannot disable 2FA for accounts without passwords' },
                { status: 400 }
            );
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid password' },
                { status: 400 }
            );
        }

        // Disable 2FA
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
            },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: session.user.id,
                userEmail: session.user.email,
                action: 'DISABLE_2FA',
                description: 'Disabled two-factor authentication',
                resourceType: 'User',
                resourceId: session.user.id,
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
                userAgent: request.headers.get('user-agent'),
                method: 'POST',
                path: '/api/admin/security/2fa/disable',
            },
        });

        return NextResponse.json({
            success: true,
            message: '2FA has been disabled',
        });
    } catch (error) {
        console.error('2FA disable error:', error);
        return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 });
    }
}
