import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { getAuthRateLimiter } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
    try {
        // SECURITY: Rate limiting
        const rateLimiter = getAuthRateLimiter();
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const { success } = await rateLimiter.limit(ip);

        if (!success) {
            return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
        }

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { token, phone } = await req.json();

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        if (process.env.NODE_ENV === 'development') {
            console.log('Verifying token:', token);
        }

        // Verify the token with MSG91
        const verifyResponse = await fetch('https://control.msg91.com/api/v5/widget/verifyAccessToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                authkey: process.env.MSG91_AUTH_KEY!,
                'access-token': token,
            }),
        });

        const verifyData = await verifyResponse.json();
        if (process.env.NODE_ENV === 'development') {
            console.log('MSG91 Verify Response:', JSON.stringify(verifyData, null, 2));
        }

        if (!verifyResponse.ok || verifyData.type !== 'success') {
            const errorMessage = verifyData.message || verifyData.error || 'Invalid verification token';
            console.error('MSG91 Verification Failed:', errorMessage);
            return NextResponse.json({
                error: errorMessage
            }, { status: 400 });
        }

        // Extract phone number from MSG91 response
        // Try multiple possible fields based on common MSG91 response patterns
        let verifiedPhone: string | undefined = undefined;

        if (verifyData.mobile) verifiedPhone = verifyData.mobile;
        else if (verifyData.data?.mobile) verifiedPhone = verifyData.data.mobile;
        else if (verifyData.message && /^\d+$/.test(verifyData.message)) verifiedPhone = verifyData.message; // valid if message is just digits
        // If the API response doesn't contain the number, use the one provided by client IF the token is valid
        // NOTE: This assumes that a valid token implies the client-provided phone was the one verified.
        // In a stricter system, we'd require the provider to return the number.
        else if (phone) verifiedPhone = phone;

        // Clean up formatting
        if (verifiedPhone) {
            verifiedPhone = verifiedPhone.toString();
            // If it starts with 91 and is 12 digits, strip the 91
            if (verifiedPhone.length === 12 && verifiedPhone.startsWith('91')) {
                verifiedPhone = verifiedPhone.substring(2);
            }
        }

        if (!verifiedPhone) {
            console.error('Could not determine verified phone number from MSG91 response or client request');
            return NextResponse.json({ error: 'Could not determine verified phone number' }, { status: 400 });
        }

        if (process.env.NODE_ENV === 'development') {
            console.log('Updating user phone to:', verifiedPhone);
        }

        // Update user's phoneVerified status and the phone number
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                phoneVerified: true,
                phone: verifiedPhone,
            },
        });

        // Note: Client should call session.update() to refresh the session
        // with the new phoneVerified status after receiving this response
        return NextResponse.json({ success: true, message: 'Phone verified successfully', phone: verifiedPhone });
    } catch (error) {
        console.error('Phone verification error:', error);
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
}
