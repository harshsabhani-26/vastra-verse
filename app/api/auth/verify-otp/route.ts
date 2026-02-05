import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const { email, phone, otp } = await request.json();

        // Must provide either email or phone
        if ((!email && !phone) || !otp) {
            return NextResponse.json(
                { error: 'Email or phone and OTP are required' },
                { status: 400 }
            );
        }

        // Find the OTP record
        const otpRecord = await prisma.emailVerification.findFirst({
            where: {
                ...(email ? { email } : { phone }),
                otp,
                verified: false,
            },
        });

        // Check if OTP exists
        if (!otpRecord) {
            return NextResponse.json(
                { success: false, valid: false, message: 'Invalid OTP' },
                { status: 400 }
            );
        }

        // Check if OTP has expired
        if (new Date() > otpRecord.expiresAt) {
            return NextResponse.json(
                { success: false, valid: false, message: 'OTP has expired' },
                { status: 400 }
            );
        }

        // Mark OTP as verified
        await prisma.emailVerification.update({
            where: { id: otpRecord.id },
            data: { verified: true },
        });

        return NextResponse.json(
            {
                success: true,
                valid: true,
                message: 'OTP verified successfully',
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Verify OTP error:', error);
        return NextResponse.json(
            { error: 'Failed to verify OTP' },
            { status: 500 }
        );
    }
}
