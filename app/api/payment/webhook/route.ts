"use server";

import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { logError, logInfo, logPaymentEvent } from "@/lib/logger";
import { createOrderAfterPayment } from "@/app/actions/checkout";

/**
 * Razorpay Webhook Handler
 * 
 * Handles server-to-server webhook events from Razorpay.
 * This is a FALLBACK for order creation — the primary path is via
 * the client-side verify route. If verify already created the order,
 * this handler safely skips (idempotent).
 * 
 * Events handled:
 * - payment.captured → create order if not already created
 * - payment.failed → log and ignore
 * 
 * Configure in Razorpay Dashboard:
 *   URL: https://your-domain.com/api/payment/webhook
 *   Events: payment.captured, payment.failed
 *   Secret: Set as RAZORPAY_WEBHOOK_SECRET env var
 */

export async function POST(req: Request) {
    let rawBody: string;
    try {
        rawBody = await req.text();
    } catch (e) {
        return NextResponse.json({ error: "Failed to read body" }, { status: 400 });
    }

    const signature = req.headers.get("x-razorpay-signature");

    // 1. Verify webhook signature
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
        logError("WEBHOOK_CONFIG", new Error("RAZORPAY_WEBHOOK_SECRET not configured"));
        return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    if (!signature) {
        logError("WEBHOOK_SIGNATURE", new Error("Missing x-razorpay-signature header"));
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

    if (expectedSignature !== signature) {
        logError("WEBHOOK_SIGNATURE", new Error("Invalid webhook signature"));
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // 2. Parse event
    let event: any;
    try {
        event = JSON.parse(rawBody);
    } catch (e) {
        logError("WEBHOOK_PARSE", new Error("Failed to parse webhook body"));
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const eventType: string = event.event;
    const webhookEventId = `${event.account_id || "unknown"}_${event.payload?.payment?.entity?.id || Date.now()}`;

    logPaymentEvent("WEBHOOK_RECEIVED", webhookEventId, {
        eventType,
        timestamp: new Date().toISOString(),
    });

    // 3. Handle payment.captured
    if (eventType === "payment.captured") {
        const payment = event.payload?.payment?.entity;
        if (!payment) {
            logError("WEBHOOK_PAYLOAD", new Error("Missing payment entity in webhook payload"));
            return NextResponse.json({ error: "Missing payment entity" }, { status: 400 });
        }

        const razorpayPaymentId: string = payment.id;
        const razorpayOrderId: string = payment.order_id;
        const checkoutSessionId: string | null = payment.notes?.checkoutSessionId || null;

        logInfo("WEBHOOK", "payment.captured received", {
            webhookEventId,
            razorpayPaymentId,
            razorpayOrderId,
            checkoutSessionId,
        });

        // IDEMPOTENCY: Check if this payment was already processed by client verify route
        const existingPayment = await prisma.payment.findFirst({
            where: {
                OR: [
                    { gatewayPaymentId: razorpayPaymentId },
                    { gatewayOrderId: razorpayOrderId },
                ],
            },
        });

        if (existingPayment) {
            logInfo("WEBHOOK", "Payment already processed by client verify, skipping", {
                razorpayPaymentId,
                existingOrderId: existingPayment.orderId,
            });
            return NextResponse.json({ status: "already_processed", orderId: existingPayment.orderId });
        }

        // Try to retrieve pending order data from in-memory store
        let pendingData: { orderData: any; checkoutSessionId: string } | null = null;
        try {
            const { getPendingOrderData } = await import("@/lib/payment-store");
            pendingData = getPendingOrderData(razorpayOrderId);
        } catch (e) {
            logError("WEBHOOK_IMPORT", e);
        }

        if (!pendingData?.orderData) {
            // No pending data — this can happen if:
            // 1. Server restarted between Razorpay order creation and webhook
            // 2. Client verify already handled it (but we checked above)
            // 3. The data expired from in-memory store
            logInfo("WEBHOOK", "No pending order data found for webhook. Cannot create order without order details.", {
                razorpayOrderId,
                razorpayPaymentId,
            });
            // Return 200 to acknowledge — Razorpay will not retry
            // The admin should manually reconcile this payment
            return NextResponse.json({
                status: "no_pending_data",
                message: "Payment captured but order data not available. Manual reconciliation may be needed.",
                razorpayPaymentId,
                razorpayOrderId,
            });
        }

        // Create order via the shared function
        try {
            const orderId = await createOrderAfterPayment({
                ...pendingData.orderData,
                razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature: "webhook_verified",
                checkoutSessionId: pendingData.checkoutSessionId || null,
            });

            logInfo("WEBHOOK", "Order created via webhook fallback", {
                orderId,
                razorpayPaymentId,
                razorpayOrderId,
                checkoutSessionId: pendingData.checkoutSessionId,
            });

            return NextResponse.json({ status: "order_created", orderId });
        } catch (error: any) {
            logError("WEBHOOK_ORDER_CREATE", error, {
                razorpayPaymentId,
                razorpayOrderId,
            });

            // If it's a unique constraint violation, the order was likely created
            // by a concurrent client verify request (race condition handled safely)
            if (error.code === "P2002") {
                logInfo("WEBHOOK", "Concurrent order creation detected (unique constraint). Order likely created by client verify.", {
                    razorpayPaymentId,
                });
                return NextResponse.json({ status: "concurrent_creation", razorpayPaymentId });
            }

            return NextResponse.json({ error: "Order creation failed", details: error.message }, { status: 500 });
        }
    }

    // 4. Handle payment.failed
    if (eventType === "payment.failed") {
        const payment = event.payload?.payment?.entity;
        logInfo("WEBHOOK", "payment.failed received — no action taken", {
            webhookEventId,
            razorpayPaymentId: payment?.id,
            reason: payment?.error_description || payment?.error_reason || "unknown",
            errorCode: payment?.error_code,
        });
        return NextResponse.json({ status: "noted" });
    }

    // 5. Unknown event type — acknowledge but don't process
    logInfo("WEBHOOK", `Unhandled event type: ${eventType}`, { webhookEventId });
    return NextResponse.json({ status: "ignored", event: eventType });
}
