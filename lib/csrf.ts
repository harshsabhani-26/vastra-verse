import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { auth } from '@/auth';

// ============================================================
// CSRF Protection Library
// ============================================================
// Generates per-session CSRF tokens stored in HTTP-only cookies
// Validates x-csrf-token header on all mutation requests
// ============================================================

const CSRF_COOKIE_NAME = '__csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32; // 256-bit token
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour in ms

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
    return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Create a signed CSRF token with timestamp for expiry validation
 */
function createSignedToken(): { token: string; signed: string } {
    const token = generateCSRFToken();
    const timestamp = Date.now().toString();
    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'csrf-fallback-secret';

    // HMAC sign: token + timestamp ensures integrity
    const signature = crypto
        .createHmac('sha256', secret)
        .update(`${token}:${timestamp}`)
        .digest('hex');

    const signed = `${token}:${timestamp}:${signature}`;
    return { token, signed };
}

/**
 * Verify a signed CSRF token
 * Returns the token if valid, null if invalid or expired
 */
function verifySignedToken(signed: string): string | null {
    try {
        const parts = signed.split(':');
        if (parts.length !== 3) return null;

        const [token, timestamp, signature] = parts;
        const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'csrf-fallback-secret';

        // Verify signature
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(`${token}:${timestamp}`)
            .digest('hex');

        if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
            return null; // Signature mismatch
        }

        // Check expiry
        const tokenTime = parseInt(timestamp, 10);
        if (Date.now() - tokenTime > CSRF_TOKEN_EXPIRY) {
            return null; // Token expired
        }

        return token;
    } catch {
        return null;
    }
}

/**
 * Set CSRF token cookie on a response
 */
export function setCSRFCookie(response: NextResponse): { response: NextResponse; token: string } {
    const { token, signed } = createSignedToken();

    response.cookies.set(CSRF_COOKIE_NAME, signed, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: CSRF_TOKEN_EXPIRY / 1000, // Convert to seconds
    });

    return { response, token };
}

/**
 * Validate CSRF token from request
 * Compares x-csrf-token header against the cookie value
 *
 * @returns null if valid, NextResponse (403) if invalid
 */
export function validateCSRFToken(req: NextRequest): NextResponse | null {
    // Only validate mutation methods
    const method = req.method.toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        return null; // Safe methods don't need CSRF protection
    }

    // Get token from header
    const headerToken = req.headers.get(CSRF_HEADER_NAME);
    if (!headerToken) {
        console.warn(`[CSRF] Missing ${CSRF_HEADER_NAME} header`, {
            path: req.nextUrl.pathname,
            method: req.method,
        });

        return NextResponse.json(
            {
                error: 'CSRF_TOKEN_MISSING',
                message: 'CSRF token is required for this request. Include x-csrf-token header.',
            },
            { status: 403 }
        );
    }

    // Get signed token from cookie
    const cookieValue = req.cookies.get(CSRF_COOKIE_NAME)?.value;
    if (!cookieValue) {
        console.warn('[CSRF] Missing CSRF cookie', {
            path: req.nextUrl.pathname,
        });

        return NextResponse.json(
            {
                error: 'CSRF_SESSION_EXPIRED',
                message: 'CSRF session expired. Please refresh the page and try again.',
            },
            { status: 403 }
        );
    }

    // Verify the signed cookie and extract the token
    const cookieToken = verifySignedToken(cookieValue);
    if (!cookieToken) {
        console.warn('[CSRF] Invalid or expired CSRF cookie', {
            path: req.nextUrl.pathname,
        });

        return NextResponse.json(
            {
                error: 'CSRF_TOKEN_EXPIRED',
                message: 'CSRF token has expired. Please refresh the page and try again.',
            },
            { status: 403 }
        );
    }

    // Compare tokens using timing-safe comparison
    try {
        const headerBuf = Buffer.from(headerToken);
        const cookieBuf = Buffer.from(cookieToken);

        if (headerBuf.length !== cookieBuf.length || !crypto.timingSafeEqual(headerBuf, cookieBuf)) {
            console.warn('[CSRF] Token mismatch', {
                path: req.nextUrl.pathname,
                method: req.method,
            });

            return NextResponse.json(
                {
                    error: 'CSRF_TOKEN_INVALID',
                    message: 'Invalid CSRF token. Please refresh the page and try again.',
                },
                { status: 403 }
            );
        }
    } catch {
        return NextResponse.json(
            {
                error: 'CSRF_TOKEN_INVALID',
                message: 'Invalid CSRF token format.',
            },
            { status: 403 }
        );
    }

    return null; // Valid
}

/**
 * CSRF protection middleware for API route handlers
 *
 * Usage:
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const csrfError = requireCSRF(req);
 *   if (csrfError) return csrfError;
 *   // ... rest of handler
 * }
 * ```
 */
export function requireCSRF(req: NextRequest): NextResponse | null {
    return validateCSRFToken(req);
}

/**
 * Generate CSRF token for API endpoint
 * Called by the frontend to get a token for subsequent requests
 */
export async function generateCSRFTokenForSession(): Promise<{
    token: string;
    signedCookie: string;
}> {
    const { token, signed } = createSignedToken();
    return { token, signedCookie: signed };
}

/**
 * Admin route protection wrapper
 * Combines authentication check + CSRF validation
 *
 * Usage:
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const error = await requireAdminWithCSRF(req);
 *   if (error) return error;
 *   // ... admin handler logic
 * }
 * ```
 */
export async function requireAdminWithCSRF(req: NextRequest): Promise<NextResponse | null> {
    // Check authentication first
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { error: 'UNAUTHORIZED', message: 'Authentication required' },
                { status: 401 }
            );
        }

        if (session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'FORBIDDEN', message: 'Admin access required' },
                { status: 403 }
            );
        }
    } catch {
        return NextResponse.json(
            { error: 'AUTH_ERROR', message: 'Authentication failed' },
            { status: 401 }
        );
    }

    // Then validate CSRF
    return validateCSRFToken(req);
}
