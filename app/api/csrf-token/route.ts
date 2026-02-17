import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateCSRFTokenForSession, setCSRFCookie } from '@/lib/csrf';

/**
 * GET /api/csrf-token
 * 
 * Returns a fresh CSRF token for the authenticated session.
 * The token is also stored in an HTTP-only cookie for validation.
 * 
 * Frontend should call this endpoint on page load and include
 * the returned token in the x-csrf-token header for all mutations.
 */
export async function GET(req: NextRequest) {
    try {
        // Require authentication
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Generate token and signed cookie
        const { token, signedCookie } = await generateCSRFTokenForSession();

        // Create response with token
        const response = NextResponse.json({
            csrfToken: token,
        });

        // Set HTTP-only cookie with signed token
        response.cookies.set('__csrf_token', signedCookie, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 3600, // 1 hour
        });

        return response;
    } catch (error) {
        console.error('[CSRF] Token generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate CSRF token' },
            { status: 500 }
        );
    }
}
