import crypto from 'crypto';
import { Redis } from '@upstash/redis';
import prisma from '@/lib/prisma';
import { logSecurityEvent } from '@/lib/logger';

// Initialize Redis for replay attack prevention
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const REPLAY_ATTACK_TTL = 600; // 10 minutes in seconds
const TIMESTAMP_TOLERANCE = 300; // 5 minutes in seconds

export interface WebhookVerificationResult {
    success: boolean;
    error?: string;
    eventId?: string;
    timestamp?: number;
}

/**
 * Verify Razorpay webhook signature with enterprise security
 * 
 * Features:
 * - HMAC SHA256 signature verification
 * - Timestamp validation (reject > 5 min old)
 * - Replay attack prevention using Redis
 * - Security event logging
 * - Audit trail in database
 */
export async function verifyRazorpayWebhook(
    rawBody: string,
    signature: string | null,
    headers: Record<string, string>
): Promise<WebhookVerificationResult> {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // 1. Check if signature exists
    if (!signature) {
        await logSecurityEvent('WEBHOOK_SIGNATURE_MISSING', {
            severity: 'HIGH',
            details: 'Razorpay webhook received without signature',
            ipAddress: headers['x-real-ip'] || headers['x-forwarded-for'] || 'unknown',
        });

        await createWebhookAuditLog({
            provider: 'RAZORPAY',
            eventType: 'UNKNOWN',
            status: 'REJECTED',
            rejectionReason: 'SIGNATURE_MISSING',
            ipAddress: headers['x-real-ip'] || headers['x-forwarded-for'],
            rawPayload: rawBody.substring(0, 500), // Store first 500 chars
        });

        return {
            success: false,
            error: 'SIGNATURE_MISSING',
        };
    }

    // 2. Verify webhook secret is configured
    if (!webhookSecret) {
        await logSecurityEvent('WEBHOOK_SECRET_NOT_CONFIGURED', {
            severity: 'CRITICAL',
            details: 'RAZORPAY_WEBHOOK_SECRET not configured',
            ipAddress: headers['x-real-ip'] || headers['x-forwarded-for'] || 'unknown',
        });

        return {
            success: false,
            error: 'WEBHOOK_NOT_CONFIGURED',
        };
    }

    // 3. Parse payload to extract event ID and timestamp
    let payload: any;
    let eventId: string;
    let createdAt: number;

    try {
        payload = JSON.parse(rawBody);
        eventId = payload.payload?.payment?.entity?.id ||
            payload.payload?.refund?.entity?.id ||
            payload.event + '_' + Date.now();
        createdAt = payload.created_at || Math.floor(Date.now() / 1000);
    } catch (error) {
        await logSecurityEvent('WEBHOOK_INVALID_JSON', {
            severity: 'MEDIUM',
            details: 'Invalid JSON in webhook payload',
            ipAddress: headers['x-real-ip'] || headers['x-forwarded-for'] || 'unknown',
        });

        return {
            success: false,
            error: 'INVALID_PAYLOAD',
        };
    }

    // 4. Timestamp validation - reject if older than 5 minutes
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const age = currentTimestamp - createdAt;

    if (age > TIMESTAMP_TOLERANCE) {
        await logSecurityEvent('WEBHOOK_TIMESTAMP_TOO_OLD', {
            severity: 'HIGH',
            details: `Webhook timestamp ${age}s old, exceeds ${TIMESTAMP_TOLERANCE}s limit`,
            metadata: { eventId, age, createdAt },
            ipAddress: headers['x-real-ip'] || headers['x-forwarded-for'] || 'unknown',
        });

        await createWebhookAuditLog({
            provider: 'RAZORPAY',
            eventType: payload.event || 'UNKNOWN',
            eventId,
            status: 'REJECTED',
            rejectionReason: 'TIMESTAMP_TOO_OLD',
            ipAddress: headers['x-real-ip'] || headers['x-forwarded-for'],
            rawPayload: rawBody.substring(0, 500),
            metadata: { age, timestamp: createdAt },
        });

        return {
            success: false,
            error: 'TIMESTAMP_TOO_OLD',
            eventId,
            timestamp: createdAt,
        };
    }

    // 5. Verify HMAC signature
    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

    if (expectedSignature !== signature) {
        await logSecurityEvent('WEBHOOK_SIGNATURE_INVALID', {
            severity: 'CRITICAL',
            details: 'Razorpay webhook signature mismatch - possible fraud attempt',
            metadata: { eventId },
            ipAddress: headers['x-real-ip'] || headers['x-forwarded-for'] || 'unknown',
        });

        await createWebhookAuditLog({
            provider: 'RAZORPAY',
            eventType: payload.event || 'UNKNOWN',
            eventId,
            status: 'REJECTED',
            rejectionReason: 'SIGNATURE_INVALID',
            ipAddress: headers['x-real-ip'] || headers['x-forwarded-for'],
            signatureReceived: signature,
            rawPayload: rawBody.substring(0, 500),
        });

        return {
            success: false,
            error: 'SIGNATURE_INVALID',
            eventId,
            timestamp: createdAt,
        };
    }

    // 6. Check for replay attack using Redis cache
    const replayKey = `webhook:razorpay:${eventId}`;
    const alreadyProcessed = await redis.get(replayKey);

    if (alreadyProcessed) {
        await logSecurityEvent('WEBHOOK_REPLAY_ATTACK', {
            severity: 'CRITICAL',
            details: `Duplicate webhook event detected - possible replay attack`,
            metadata: { eventId, originalProcessedAt: alreadyProcessed },
            ipAddress: headers['x-real-ip'] || headers['x-forwarded-for'] || 'unknown',
        });

        await createWebhookAuditLog({
            provider: 'RAZORPAY',
            eventType: payload.event || 'UNKNOWN',
            eventId,
            status: 'REJECTED',
            rejectionReason: 'REPLAY_ATTACK',
            ipAddress: headers['x-real-ip'] || headers['x-forwarded-for'],
            rawPayload: rawBody.substring(0, 500),
            metadata: { originalProcessedAt: alreadyProcessed },
        });

        return {
            success: false,
            error: 'REPLAY_ATTACK',
            eventId,
            timestamp: createdAt,
        };
    }

    // 7. Mark event as processed in Redis (TTL 10 minutes)
    await redis.set(replayKey, Date.now(), { ex: REPLAY_ATTACK_TTL });

    // 8. Create successful audit log
    await createWebhookAuditLog({
        provider: 'RAZORPAY',
        eventType: payload.event || 'UNKNOWN',
        eventId,
        status: 'ACCEPTED',
        ipAddress: headers['x-real-ip'] || headers['x-forwarded-for'],
        signatureReceived: signature,
        rawPayload: rawBody.substring(0, 1000), // Store more for successful webhooks
        metadata: { timestamp: createdAt, age },
    });

    return {
        success: true,
        eventId,
        timestamp: createdAt,
    };
}

/**
 * Create webhook audit log in database
 */
async function createWebhookAuditLog(data: {
    provider: string;
    eventType: string;
    eventId?: string;
    status: string;
    rejectionReason?: string;
    ipAddress?: string;
    signatureReceived?: string;
    rawPayload?: string;
    metadata?: any;
}) {
    try {
        await prisma.webhookAuditLog.create({
            data: {
                provider: data.provider,
                eventType: data.eventType,
                eventId: data.eventId,
                status: data.status,
                rejectionReason: data.rejectionReason,
                ipAddress: data.ipAddress,
                signatureReceived: data.signatureReceived,
                rawPayload: data.rawPayload,
                metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
            },
        });
    } catch (error) {
        console.error('[WebhookAudit] Failed to create audit log:', error);
        // Don't throw - audit logging shouldn't break webhook processing
    }
}
