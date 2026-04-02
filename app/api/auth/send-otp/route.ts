import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { logError, logSecurityEvent } from '@/lib/logger';
import { sendOTPEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        // SECURITY: Comprehensive rate limiting (5 req/min)
        const rateLimitResult = await checkRateLimit(request, 'auth');
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult;
        }

        const { identifier } = rateLimitResult;
        const body = await request.json();
        const { email, type, hcaptchaToken } = body;

        // SECURITY: hCaptcha server-side verification (if token provided)
        if (hcaptchaToken) {
            const { verifyHCaptchaToken } = await import('@/lib/hcaptcha');
            const isHuman = await verifyHCaptchaToken(hcaptchaToken);
            if (!isHuman) {
                logSecurityEvent("HCAPTCHA_FAILED", { endpoint: "/api/auth/send-otp", ipAddress: identifier });
                return NextResponse.json(
                    { error: 'Captcha verification failed' },
                    { status: 400 }
                );
            }
        }

        if (!email || !type) {
            return NextResponse.json(
                { error: 'Email and type are required' },
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

        // Generate  6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();

        // Set expiration to 5 minutes from now
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Delete any existing unverified OTPs for this email and type
        await prisma.emailVerification.deleteMany({
            where: {
                email,
                type,
                verified: false,
            },
        });

        // Create new OTP record
        await prisma.emailVerification.create({
            data: {
                email,
                otp,
                type,
                expiresAt,
            },
        });

        // Log OTP generation for security audit
        logSecurityEvent("OTP_GENERATED", {
            email,
            type,
            ipAddress: identifier,
        });

        // Send OTP via email using our Nodemailer service
        const emailSent = await sendOTPEmail(email, otp, type as 'register' | 'login' | 'forgot-password');

        if (!emailSent) {
            return NextResponse.json(
                { error: 'Failed to send OTP email. Please try again later.' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: 'OTP sent successfully',
                expiresAt,
            },
            { status: 200 }
        );
    } catch (error) {
        logError("SEND_OTP", error);
        return NextResponse.json(
            { error: 'Failed to send OTP' },
            { status: 500 }
        );
    }
}
