import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { getAuthRateLimiter } from '@/lib/rate-limit';

// Strictly typed response helper to ensure consistency
const jsonResponse = (data: any, status: number = 200) => {
    return NextResponse.json(data, { status });
};

export async function POST(req: NextRequest) {
    try {
        // 1. SECURITY: Rate limiting
        const rateLimiter = getAuthRateLimiter();
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const { success: allowed } = await rateLimiter.limit(ip);

        if (!allowed) {
            console.warn(`[OTP] Rate limit exceeded for IP: ${ip}`);
            return jsonResponse({
                success: false,
                verified: false,
                error: 'Too many requests. Please try again later.'
            }, 429);
        }

        // 2. SESSION VALIDATION
        const session = await auth();
        if (!session?.user?.id) {
            console.warn(`[OTP] Unauthorized access attempt from IP: ${ip}`);
            return jsonResponse({
                success: false,
                verified: false,
                error: 'Unauthorized. Please login.'
            }, 401);
        }

        // 3. INPUT VALIDATION
        let body;
        try {
            body = await req.json();
        } catch (e) {
            return jsonResponse({ success: false, verified: false, error: 'Invalid JSON body' }, 400);
        }

        const { token, phone } = body;

        if (!token) {
            return jsonResponse({ success: false, verified: false, error: 'OTP Token is required' }, 400);
        }

        // 4. IDEMPOTENCY CHECK
        // Check if user is ALREADY verified before calling external API
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { phoneVerified: true, phone: true }
        });

        // Normalize phone for comparison if possible
        // (Assuming frontend sends phone number to check against)
        if (currentUser?.phoneVerified) {
            console.log(`[OTP] User ${session.user.id} already verified.`);
            return jsonResponse({
                success: true,
                verified: true,
                message: "Phone already verified",
                alreadyVerified: true
            }, 200);
        }

        // 5. EXTERNAL VERIFICATION (MSG91)
        if (!process.env.MSG91_AUTH_KEY) {
            console.error('[OTP] CRITICAL: MSG91_AUTH_KEY missing in logic');
            return jsonResponse({
                success: false,
                verified: false,
                error: 'Server configuration error'
            }, 500);
        }

        console.log(`[OTP] Verifying token for user ${session.user.id}`);

        let msg91Data;
        try {
            const verifyResponse = await fetch('https://control.msg91.com/api/v5/widget/verifyAccessToken', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'authkey': process.env.MSG91_AUTH_KEY
                },
                body: JSON.stringify({
                    authkey: process.env.MSG91_AUTH_KEY,
                    'access-token': token,
                    'mobile': phone ? ('91' + phone) : undefined // Optional support for validating specific number
                }),
            });

            msg91Data = await verifyResponse.json();

            // Log raw response for debugging (sensitive data masked in prod logs ideal, but here simple log)
            console.log(`[OTP] MSG91 Response: ${JSON.stringify(msg91Data)}`);

            if (!verifyResponse.ok || msg91Data.type !== 'success') {
                const msg = msg91Data.message || msg91Data.error || 'Invalid OTP';
                console.warn(`[OTP] Verification failed: ${msg}`);
                return jsonResponse({
                    success: false,
                    verified: false,
                    error: msg
                }, 400);
            }
        } catch (fetchError) {
            console.error('[OTP] External API failure:', fetchError);
            return jsonResponse({
                success: false,
                verified: false,
                error: 'Verification service unreachable'
            }, 502);
        }

        // 6. PROCESS VERIFIED NUMBER
        // Extract phone from response OR fallback to valid input
        let verifiedPhone: string | undefined = undefined;

        if (msg91Data.mobile) verifiedPhone = msg91Data.mobile;
        else if (msg91Data.data?.mobile) verifiedPhone = msg91Data.data.mobile;
        else if (msg91Data.message && /^\d+$/.test(msg91Data.message)) verifiedPhone = msg91Data.message;
        else if (phone) verifiedPhone = phone; // Trust client IF token was valid (Fallback)

        if (!verifiedPhone) {
            console.error('[OTP] Could not resolve phone number from successful response');
            return jsonResponse({ success: false, verified: false, error: 'Could not determine verified number' }, 400);
        }

        // Sanitization
        verifiedPhone = verifiedPhone.toString().replace(/\D/g, '');
        // Strip 91 prefix if 12 digits
        if (verifiedPhone.length === 12 && verifiedPhone.startsWith('91')) verifiedPhone = verifiedPhone.substring(2);
        // Strip 0 prefix if 11 digits
        if (verifiedPhone.length === 11 && verifiedPhone.startsWith('0')) verifiedPhone = verifiedPhone.substring(1);

        if (verifiedPhone.length !== 10) {
            console.error(`[OTP] Invalid phone length: ${verifiedPhone}`);
            return jsonResponse({ success: false, verified: false, error: 'Invalid phone number format' }, 400);
        }

        // 7. ATOMIC DATABASE UPDATE
        console.log(`[OTP] Updating DB for user ${session.user.id} with phone ${verifiedPhone}`);

        await prisma.$transaction(async (tx) => {
            // Update user
            await tx.user.update({
                where: { id: session.user.id },
                data: {
                    phoneVerified: true,
                    phone: verifiedPhone,
                }
            });

            // Optional: Log activity
            await tx.activityLog.create({
                data: {
                    userId: session.user.id,
                    action: 'PHONE_VERIFIED',
                    description: `Phone verified: ${verifiedPhone}`,
                    ipAddress: ip
                }
            });
        });

        // 8. SUCCESS RESPONSE
        console.log(`[OTP] Success for user ${session.user.id}`);
        return jsonResponse({
            success: true,
            verified: true,
            message: "Phone verified successfully",
            phone: verifiedPhone
        }, 200);

    } catch (globalError) {
        // 9. GLOBAL SAFETY NET
        console.error('[OTP] UNCAUGHT EXCEPTION:', globalError);
        return jsonResponse({
            success: false,
            verified: false,
            error: 'Internal Server Error',
            details: (globalError as Error).message
        }, 500);
    }
}
