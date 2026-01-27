import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const { email, otp } = await request.json();

        if (!email || !otp) {
            return NextResponse.json(
                { error: 'Email and OTP are required' },
                { status: 400 }
            );
        }

        // Find the OTP record
        const verification = await prisma.emailVerification.findFirst({
            where: {
                email,
                otp,
                verified: false,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (!verification) {
            return NextResponse.json(
                { success: false, valid: false, message: 'Invalid OTP' },
                { status: 400 }
            );
        }

        // Check if OTP has expired
        if (new Date() > verification.expiresAt) {
            return NextResponse.json(
                { success: false, valid: false, message: 'OTP has expired' },
                { status: 400 }
            );
        }

        // Mark OTP as verified
        await prisma.emailVerification.update({
            where: { id: verification.id },
            data: { verified: true },
        });

        return NextResponse.json(
            {
                success: true,
                valid: true,
                message: 'OTP verified successfully',
                type: verification.type,
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
