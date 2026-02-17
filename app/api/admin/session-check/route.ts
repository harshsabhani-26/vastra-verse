import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { detectNewIPAndNotify, check2FAEnforcement, checkAdminSessionTimeout } from '@/lib/admin-security';
import { getClientIp } from '@/lib/rate-limit';

/**
 * GET /api/admin/session-check
 * 
 * Comprehensive admin session validation endpoint.
 * Checks: authentication, session timeout, 2FA status, IP detection.
 * 
 * Frontend should call this periodically (every 5 min) to:
 * 1. Keep session alive
 * 2. Detect expired sessions
 * 3. Trigger new IP notifications
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'UNAUTHORIZED', valid: false },
                { status: 401 }
            );
        }

        // 1. Check session timeout
        const timeoutError = await checkAdminSessionTimeout(req);
        if (timeoutError) {
            return timeoutError;
        }

        // 2. Detect new IP
        const ip = getClientIp(req);
        const ipResult = await detectNewIPAndNotify(
            session.user.id,
            ip,
            session.user.email || ''
        );

        // 3. Check 2FA enforcement
        const twoFAStatus = await check2FAEnforcement(session.user.id);

        return NextResponse.json({
            valid: true,
            user: {
                id: session.user.id,
                email: session.user.email,
                role: session.user.role,
            },
            security: {
                newIPDetected: ipResult.isNewIP,
                currentIP: ip,
                twoFactorRequired: twoFAStatus.required,
                twoFactorEnabled: twoFAStatus.enabled,
                needsTwoFactorSetup: twoFAStatus.needsSetup,
            },
        });
    } catch (error) {
        console.error('[ADMIN_SESSION] Check error:', error);
        return NextResponse.json(
            { error: 'Session check failed', valid: false },
            { status: 500 }
        );
    }
}
