import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { verifyRazorpayWebhook } from "@/lib/webhook-security";
import { logSecurityEvent } from "@/lib/logger";


/**
 * Razorpay Webhook Handler
 * 
 * Handles webhook events from Razorpay for refund status updates.
 * Critical for production: Never mark refund complete without webhook confirmation.
 * 
 * Events handled:
 * - refund.created
 * - refund.processed (✅ This updates DB to REFUND_COMPLETED)
 * - refund.failed
 * 
 * Security: Verifies webhook signature to prevent fraud
 */

export async function POST(req: Request) {
    try {
        // Extract headers for security verification
        const signature = req.headers.get("x-razorpay-signature");
        const rawBody = await req.text();

        const headers = {
            'x-real-ip': req.headers.get('x-real-ip') || '',
            'x-forwarded-for': req.headers.get('x-forwarded-for') || '',
            'user-agent': req.headers.get('user-agent') || '',
        };

        // 1. Enterprise Security Verification
        const verification = await verifyRazorpayWebhook(rawBody, signature, headers);

        if (!verification.success) {
            console.error(`[Webhook] Security check failed: ${verification.error}`);

            // Return 401 for security failures
            return NextResponse.json(
                { error: verification.error, message: 'Webhook verification failed' },
                { status: 401 }
            );
        }

        console.log(`[Webhook] ✅ Security verification passed for event ${verification.eventId}`);

        // 2. Parse Event
        const event = JSON.parse(rawBody);
        const eventType = event.event;
        const payload = event.payload;

        console.log(`[Webhook] Processing event: ${eventType}`);

        // 3. Async Processing via Queue
        // Enqueue job and return immediately
        const { webhookQueue } = await import('@/lib/queue');

        await webhookQueue().add('process-razorpay', {
            provider: 'razorpay',
            event: eventType,
            payload: event,
            receivedAt: new Date().toISOString(),
        });

        console.log(`[Webhook] Enqueued job for event: ${eventType}`);

        // 4. Return 200 OK immediately
        return NextResponse.json({ received: true, queued: true });

    } catch (error) {
        console.error("[Webhook] Error processing webhook:", error);

        // Log error but return 200 to prevent Razorpay retries for parsing errors
        await logSecurityEvent('WEBHOOK_PROCESSING_ERROR', {
            details: error instanceof Error ? error.message : 'Unknown error',
            ipAddress: 'unknown',
        });

        return NextResponse.json({ received: true });
    }
}


