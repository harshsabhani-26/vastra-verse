import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { getAuthRateLimiter } from '@/lib/rate-limit';
import { logError, logRateLimitViolation, logSecurityEvent } from '@/lib/logger';

export async function POST(request: NextRequest) {
    try {
        // SECURITY: Rate limiting for OTP endpoint to prevent abuse
        const limiter = getAuthRateLimiter();
        const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "127.0.0.1";
        const { success, limit, reset, remaining } = await limiter.limit(ip);

        if (!success) {
            logRateLimitViolation("/api/auth/send-otp", ip, ip);
            return new NextResponse("Too Many Requests - Please try again later", {
                status: 429,
                headers: {
                    "X-RateLimit-Limit": limit.toString(),
                    "X-RateLimit-Remaining": remaining.toString(),
                    "X-RateLimit-Reset": reset.toString(),
                },
            });
        }

        const { email, type } = await request.json();

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
            ipAddress: ip,
        });

        // TODO: Send OTP via email
        // For now, log it to console (in development only)
        if (process.env.NODE_ENV === 'development') {
            console.log(`\n📧 OTP for ${email}: ${otp}\n`);
        }

        // In production, you would send this via email service
        // Example: await sendEmail({ to: email, subject: 'Your OTP', body: `Your OTP is: ${otp}` });

        return NextResponse.json(
            {
                success: true,
                message: 'OTP sent successfully',
                expiresAt,
                // Only include OTP in development for testing
                ...(process.env.NODE_ENV === 'development' && { otp }),
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
