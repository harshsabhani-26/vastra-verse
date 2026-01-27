import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { generateTOTPSecret, generateQRCodeURL, generateBackupCodes } from '@/lib/security/twoFactor';
import QRCode from 'qrcode';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if 2FA is already enabled
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { twoFactorEnabled: true },
        });

        if (user?.twoFactorEnabled) {
            return NextResponse.json(
                { error: '2FA is already enabled for this account' },
                { status: 400 }
            );
        }

        // Generate TOTP secret
        const secret = generateTOTPSecret();

        // Generate QR code URL
        const otpauthURL = generateQRCodeURL(
            secret,
            session.user.email || '',
            'M & H Admin'
        );

        // Generate QR code image (data URL)
        const qrCodeDataURL = await QRCode.toDataURL(otpauthURL);

        // Generate backup codes
        const backupCodes = generateBackupCodes();

        // Store the secret temporarily (will be confirmed after verification)
        // For now, we'll return it to the client
        // In production, you might want to store this in a temporary session storage

        return NextResponse.json({
            secret,
            qrCode: qrCodeDataURL,
            otpauthURL,
            backupCodes,
            message: 'Scan the QR code with your authenticator app and enter the code to verify',
        });
    } catch (error) {
        console.error('2FA setup error:', error);
        return NextResponse.json({ error: 'Failed to setup 2FA' }, { status: 500 });
    }
}
