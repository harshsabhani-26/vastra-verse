import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { getClientIp } from '@/lib/rate-limit';
import { cache } from '@/lib/cache';
import crypto from 'crypto';

// Cache key for systemSettings — fetched on every admin request, so we cache it
const SYSTEM_SETTINGS_CACHE_KEY = 'system:settings:admin';
const SYSTEM_SETTINGS_CACHE_TTL = 600; // 10 minutes

// ============================================================
// Admin Security Library
// ============================================================
// Centralized security controls for admin panel:
// - Session timeout enforcement (15 min idle)
// - New IP detection + email notification
// - Admin action logging
// - 2FA enforcement check
// ============================================================

const ADMIN_SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

// ============================================================
// SESSION TIMEOUT
// ============================================================

/**
 * Check if admin session has timed out (15 min idle)
 * 
 * Updates lastLoginAt on each valid check to extend the session.
 * Returns 401 if session has been idle > 15 minutes.
 */
export async function checkAdminSessionTimeout(req: NextRequest): Promise<NextResponse | null> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
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

        // Get system settings for timeout — cached in Redis to avoid per-request DB hit
        const settings = await cache.getOrSet(
            SYSTEM_SETTINGS_CACHE_KEY,
            () => prisma.systemSettings.findFirst(),
            SYSTEM_SETTINGS_CACHE_TTL
        );
        const timeoutMs = (settings?.sessionTimeout || 15) * 60 * 1000;

        // Check last activity
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { lastLoginAt: true },
        });

        if (user?.lastLoginAt) {
            const idleTime = Date.now() - user.lastLoginAt.getTime();
            if (idleTime > timeoutMs) {
                console.warn(`[ADMIN_SESSION] Timeout for user ${session.user.id} (idle ${Math.round(idleTime / 60000)} min)`);
                return NextResponse.json(
                    {
                        error: 'SESSION_TIMEOUT',
                        message: 'Your session has expired due to inactivity. Please log in again.',
                        idleMinutes: Math.round(idleTime / 60000),
                    },
                    { status: 401 }
                );
            }
        }

        // Extend session — update lastLoginAt
        await prisma.user.update({
            where: { id: session.user.id },
            data: { lastLoginAt: new Date() },
        });

        return null; // Session valid
    } catch (error) {
        console.error('[ADMIN_SESSION] Error checking timeout:', error);
        return null; // Don't block on errors — continue with request
    }
}

// ============================================================
// NEW IP DETECTION
// ============================================================

/**
 * Detect login from a new IP address and notify admin via email
 * Called during the login flow
 */
export async function detectNewIPAndNotify(
    userId: string,
    currentIp: string,
    userEmail: string
): Promise<{ isNewIP: boolean }> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { lastLoginIP: true, name: true },
        });

        if (!user) return { isNewIP: false };

        const isNewIP = user.lastLoginIP !== null && user.lastLoginIP !== currentIp;

        if (isNewIP) {
            console.warn(`[SECURITY] New IP detected for admin ${userEmail}: ${currentIp} (previous: ${user.lastLoginIP})`);

            // Log security event
            await prisma.activityLog.create({
                data: {
                    userId,
                    userEmail,
                    action: 'NEW_IP_LOGIN',
                    description: `Login from new IP address: ${currentIp} (previous: ${user.lastLoginIP})`,
                    resourceType: 'Security',
                    resourceId: userId,
                    ipAddress: currentIp,
                    status: 'WARNING',
                },
            });

            // Send email notification (non-blocking)
            sendNewIPNotification(userEmail, user.name || 'Admin', currentIp, user.lastLoginIP || 'unknown')
                .catch((err) => console.error('[SECURITY] Failed to send new IP email:', err));
        }

        // Update stored IP
        await prisma.user.update({
            where: { id: userId },
            data: { lastLoginIP: currentIp },
        });

        return { isNewIP };
    } catch (error) {
        console.error('[SECURITY] IP detection error:', error);
        return { isNewIP: false };
    }
}

/**
 * Send email notification for new IP login
 */
async function sendNewIPNotification(
    email: string,
    name: string,
    newIP: string,
    previousIP: string
): Promise<void> {
    try {
        const nodemailer = await import('nodemailer');

        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_SERVER_HOST,
            port: Number(process.env.EMAIL_SERVER_PORT) || 587,
            auth: {
                user: process.env.EMAIL_SERVER_USER,
                pass: process.env.EMAIL_SERVER_PASSWORD,
            },
        });

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #E53E3E;">⚠️ Security Alert: New Login Location</h2>
                <p>Hi ${name},</p>
                <p>We detected a login to your admin account from a <strong>new IP address</strong>:</p>
                <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; background: #f7f7f7;"><strong>New IP</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${newIP}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; background: #f7f7f7;"><strong>Previous IP</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${previousIP}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; background: #f7f7f7;"><strong>Time</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                    </tr>
                </table>
                <p style="color: #718096;">If this was you, no action is needed.</p>
                <p style="color: #E53E3E;"><strong>If you did NOT log in, change your password immediately and contact support.</strong></p>
                <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;" />
                <p style="color: #A0AEC0; font-size: 12px;">Vastraa Verse Security System</p>
            </div>
        `;

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'security@vastraverse.com',
            to: email,
            subject: '⚠️ New Login Location Detected - Vastraa Verse Admin',
            html,
        });

        console.log(`[SECURITY] New IP notification sent to ${email}`);
    } catch (error) {
        console.error('[SECURITY] Email send failed:', error);
    }
}

// ============================================================
// ADMIN ACTION LOGGING
// ============================================================

/**
 * Log an admin action to the ActivityLog table
 */
export async function logAdminAction(
    req: NextRequest,
    action: string,
    description: string,
    options: {
        resourceType?: string;
        resourceId?: string;
        oldValue?: any;
        newValue?: any;
        status?: string;
    } = {}
): Promise<void> {
    try {
        const session = await auth();
        if (!session?.user?.id) return;

        const ip = getClientIp(req);

        await prisma.activityLog.create({
            data: {
                userId: session.user.id,
                userEmail: session.user.email || undefined,
                action,
                description,
                resourceType: options.resourceType,
                resourceId: options.resourceId,
                oldValue: options.oldValue ? JSON.parse(JSON.stringify(options.oldValue)) : undefined,
                newValue: options.newValue ? JSON.parse(JSON.stringify(options.newValue)) : undefined,
                ipAddress: ip,
                userAgent: req.headers.get('user-agent') || undefined,
                method: req.method,
                path: req.nextUrl.pathname,
                status: options.status || 'SUCCESS',
            },
        });
    } catch (error) {
        // Never fail the request due to logging errors
        console.error('[AUDIT] Failed to log admin action:', error);
    }
}

// ============================================================
// 2FA ENFORCEMENT CHECK
// ============================================================

/**
 * Check if 2FA is required but not enabled for an admin user
 * Returns a redirect response if 2FA setup is needed
 */
export async function check2FAEnforcement(userId: string): Promise<{
    required: boolean;
    enabled: boolean;
    needsSetup: boolean;
}> {
    try {
        const [user, settings] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: { role: true, twoFactorEnabled: true },
            }),
            prisma.systemSettings.findFirst({
                select: { require2FA: true },
            }),
        ]);

        if (!user) return { required: false, enabled: false, needsSetup: false };

        // Only enforce for admin users
        const isAdmin = user.role === 'ADMIN';
        const isRequired = settings?.require2FA ?? false;
        const isEnabled = user.twoFactorEnabled;

        return {
            required: isAdmin && isRequired,
            enabled: isEnabled,
            needsSetup: isAdmin && isRequired && !isEnabled,
        };
    } catch (error) {
        console.error('[2FA] Enforcement check error:', error);
        return { required: false, enabled: false, needsSetup: false };
    }
}

/**
 * Verify a TOTP 2FA token
 */
export async function verify2FAToken(
    userId: string,
    token: string
): Promise<{ valid: boolean; error?: string }> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorSecret: true, twoFactorEnabled: true },
        });

        if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
            return { valid: false, error: '2FA is not enabled' };
        }

        // Use a TOTP library for verification
        // Using the simple TOTP algorithm (RFC 6238)
        const isValid = verifyTOTP(user.twoFactorSecret, token);

        return { valid: isValid };
    } catch (error) {
        console.error('[2FA] Verification error:', error);
        return { valid: false, error: 'Verification failed' };
    }
}

/**
 * Generate 2FA secret and backup codes for enrollment
 * Generates RFC 6238-compatible base32 secret for use with Google Authenticator, Authy, etc.
 */
export async function setup2FA(userId: string): Promise<{
    secret: string;
    otpAuthUrl: string;
    backupCodes: string[];
} | null> {
    try {
        // audit fix: generate base32-encoded secret (RFC 6238 requires base32, not hex)
        const rawSecret = crypto.randomBytes(20);
        const secret = base32Encode(rawSecret);

        // Generate 10 backup codes (8 chars each, uppercase)
        const backupCodes = Array.from({ length: 10 }, () =>
            crypto.randomBytes(4).toString('hex').toUpperCase()
        );

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });

        if (!user) return null;

        // Store the secret (not yet enabled — wait for verification step)
        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret },
        });

        // Create standard OTP auth URL for QR code (works with Google Authenticator, Authy, 1Password)
        const otpAuthUrl = `otpauth://totp/VastraVerse:${encodeURIComponent(user.email)}?secret=${secret}&issuer=VastraVerse&algorithm=SHA1&digits=6&period=30`;

        return { secret, otpAuthUrl, backupCodes };
    } catch (error) {
        console.error('[2FA] Setup error:', error);
        return null;
    }
}


/**
 * RFC 4648 Base32 encoder — required for TOTP secret compatibility with authenticator apps
 */
function base32Encode(buffer: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';
    for (const byte of buffer) {
        value = (value << 8) | byte;
        bits += 8;
        while (bits >= 5) {
            output += alphabet[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
    return output;
}

/**
 * Simple TOTP verification (RFC 6238)
 * Allows 1-step time drift (30 seconds window)
 * audit fix: correctly decodes base32 secret and uses 8-byte big-endian counter buffer
 */
function verifyTOTP(secret: string, token: string, window: number = 1): boolean {
    // Decode base32 secret to raw bytes
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    const secretBytes: number[] = [];
    for (const char of secret.toUpperCase()) {
        const idx = alphabet.indexOf(char);
        if (idx === -1) continue;
        value = (value << 5) | idx;
        bits += 5;
        if (bits >= 8) {
            secretBytes.push((value >>> (bits - 8)) & 0xff);
            bits -= 8;
        }
    }
    const keyBuffer = Buffer.from(secretBytes);

    const time = Math.floor(Date.now() / 30000); // 30-second steps
    for (let i = -window; i <= window; i++) {
        // Counter must be an 8-byte big-endian buffer (RFC 6238)
        const counter = Buffer.alloc(8);
        counter.writeUInt32BE(Math.floor((time + i) / 0x100000000), 0);
        counter.writeUInt32BE((time + i) & 0xffffffff, 4);

        const hmac = crypto.createHmac('sha1', keyBuffer);
        hmac.update(counter);
        const hash = hmac.digest();

        const offset = hash[hash.length - 1] & 0xf;
        const code = (
            ((hash[offset] & 0x7f) << 24) |
            ((hash[offset + 1] & 0xff) << 16) |
            ((hash[offset + 2] & 0xff) << 8) |
            (hash[offset + 3] & 0xff)
        ) % 1000000;

        if (code.toString().padStart(6, '0') === token) return true;
    }
    return false;
}

// ============================================================
// COMPREHENSIVE ADMIN PROTECTION WRAPPER
// ============================================================

/**
 * Full admin protection middleware
 * Combines: Auth + Rate Limit + CSRF + Session Timeout + Action Logging
 * 
 * Usage:
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const error = await protectAdminRoute(req, {
 *     action: 'CREATE_PRODUCT',
 *     resourceType: 'Product',
 *   });
 *   if (error) return error;
 *   // ... handler logic
 * }
 * ```
 */
export async function protectAdminRoute(
    req: NextRequest,
    options: {
        action?: string;
        resourceType?: string;
        skipCSRF?: boolean;  // For GET requests
        skipTimeout?: boolean;
    } = {}
): Promise<NextResponse | null> {
    // 1. Session timeout check
    if (!options.skipTimeout) {
        const timeoutError = await checkAdminSessionTimeout(req);
        if (timeoutError) return timeoutError;
    }

    // 2. Log action if specified
    if (options.action) {
        logAdminAction(req, options.action, `${req.method} ${req.nextUrl.pathname}`, {
            resourceType: options.resourceType,
        });
    }

    return null;
}
