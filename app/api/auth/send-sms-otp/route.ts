import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { sendSMSOTP, validatePhoneNumber, normalizePhoneNumber } from '@/lib/msg91';

export async function POST(request: NextRequest) {
    try {
        const { phone, type } = await request.json();

        if (!phone || !type) {
            return NextResponse.json(
                { error: 'Phone number and type are required' },
                { status: 400 }
            );
        }

        // Validate phone number
        if (!validatePhoneNumber(phone)) {
            return NextResponse.json(
                { error: 'Invalid phone number. Please enter a valid 10-digit Indian mobile number.' },
                { status: 400 }
            );
        }

        // Validate type
        if (!['register', 'login', 'forgot-password'].includes(type)) {
            return NextResponse.json(
                { error: 'Invalid type' },
                { status: 400 }
            );
        }

        // Normalize phone number
        const normalizedPhone = normalizePhoneNumber(phone);

        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();

        // Set expiration to 5 minutes from now
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Delete any existing unverified OTPs for this phone and type
        await prisma.emailVerification.deleteMany({
            where: {
                phone: normalizedPhone,
                type,
                verified: false,
            },
        });

        // Create new OTP record
        await prisma.emailVerification.create({
            data: {
                phone: normalizedPhone,
                otp,
                type,
                expiresAt,
            },
        });

        // Send OTP via MSG91
        const result = await sendSMSOTP({
            phone: normalizedPhone,
            otp,
        });

        if (!result.success) {
            // Even if SMS fails, we've stored the OTP
            console.error('SMS sending failed:', result.message);
        }

        // Log OTP in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`\n📱 SMS OTP for ${normalizedPhone}: ${otp}\n`);
        }

        return NextResponse.json(
            {
                success: true,
                message: result.success ? 'OTP sent successfully' : 'OTP generated (SMS may be delayed)',
                expiresAt,
                // Only include OTP in development for testing
                ...(process.env.NODE_ENV === 'development' && { otp }),
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Send SMS OTP error:', error);
        return NextResponse.json(
            { error: 'Failed to send OTP' },
            { status: 500 }
        );
    }
}
