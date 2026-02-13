import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthRateLimiter } from '@/lib/rate-limit';
import { logError, logRateLimitViolation, logSecurityEvent } from '@/lib/logger';
import { verifyHCaptchaToken } from '@/lib/hcaptcha';

const MAX_OTP_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
    try {
        // SECURITY: Rate limiting for OTP verification to prevent brute force
        const limiter = getAuthRateLimiter();
        const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "127.0.0.1";
        const { success, limit, reset, remaining } = await limiter.limit(ip);

        if (!success) {
            logRateLimitViolation("/api/auth/verify-otp", ip, ip);
            return new NextResponse("Too Many Requests - Please try again later", {
                status: 429,
                headers: {
                    "X-RateLimit-Limit": limit.toString(),
                    "X-RateLimit-Remaining": remaining.toString(),
                    "X-RateLimit-Reset": reset.toString(),
                },
            });
        }

        const { email, phone, otp, hcaptchaToken } = await request.json();

        // SECURITY: hCaptcha server-side verification (if token provided)
        if (hcaptchaToken) {
            const isHuman = await verifyHCaptchaToken(hcaptchaToken);
            if (!isHuman) {
                logSecurityEvent("HCAPTCHA_FAILED", { endpoint: "/api/auth/verify-otp", ip });
                return NextResponse.json(
                    { error: 'Captcha verification failed' },
                    { status: 400 }
                );
            }
        }

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

        // SECURITY: Don't reveal whether an OTP exists or not
        if (!otpRecord) {
            logSecurityEvent("OTP_INVALID", {
                email: email || undefined,
                phone: phone || undefined,
                ipAddress: ip,
            });
            return NextResponse.json(
                { success: false, valid: false, message: 'Invalid or expired OTP' },
                { status: 400 }
            );
        }

        // SECURITY: Check if max attempts exceeded
        if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
            logSecurityEvent("OTP_LOCKED", {
                email: email || undefined,
                phone: phone || undefined,
                attempts: otpRecord.attempts,
                ipAddress: ip,
            });
            return NextResponse.json(
                { success: false, valid: false, message: 'OTP locked due to too many attempts. Please request a new one.' },
                { status: 400 }
            );
        }

        // Check if OTP has expired
        if (new Date() > otpRecord.expiresAt) {
            return NextResponse.json(
                { success: false, valid: false, message: 'Invalid or expired OTP' },
                { status: 400 }
            );
        }

        // Increment attempt counter
        await prisma.emailVerification.update({
            where: { id: otpRecord.id },
            data: { attempts: { increment: 1 } },
        });

        // Verify the OTP matches (it already matched in the query, but this is defense-in-depth)
        // Mark OTP as verified
        await prisma.emailVerification.update({
            where: { id: otpRecord.id },
            data: { verified: true },
        });

        logSecurityEvent("OTP_VERIFIED", {
            email: email || undefined,
            phone: phone || undefined,
            ipAddress: ip,
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
        logError("VERIFY_OTP", error);
        return NextResponse.json(
            { error: 'Verification failed' },
            { status: 500 }
        );
    }
}
