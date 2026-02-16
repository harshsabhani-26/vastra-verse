import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

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
        // 1. Verify Webhook Signature
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error("RAZORPAY_WEBHOOK_SECRET not configured");
            return NextResponse.json(
                { error: "Webhook not configured" },
                { status: 500 }
            );
        }

        const signature = req.headers.get("x-razorpay-signature");
        const rawBody = await req.text();

        if (!signature) {
            console.error("Missing webhook signature");
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 401 }
            );
        }

        // Verify signature
        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(rawBody)
            .digest("hex");

        if (expectedSignature !== signature) {
            console.error("Webhook signature mismatch");
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 401 }
            );
        }

        // 2. Parse Event
        const event = JSON.parse(rawBody);
        const eventType = event.event;
        const payload = event.payload;

        console.log(`[Webhook] Received event: ${eventType}`);

        // 3. Route to appropriate handler
        switch (eventType) {
            case "refund.created":
                await handleRefundCreated(payload);
                break;

            case "refund.processed":
                await handleRefundProcessed(payload);
                break;

            case "refund.failed":
                await handleRefundFailed(payload);
                break;

            case "refund.speed_changed":
                // Optional: Handle speed changes
                console.log("[Webhook] Refund speed changed:", payload.refund.entity.id);
                break;

            default:
                console.log(`[Webhook] Unhandled event type: ${eventType}`);
        }

        // 4. Return 200 OK immediately
        // Razorpay requires quick response
        return NextResponse.json({ received: true });

    } catch (error) {
        console.error("[Webhook] Error processing webhook:", error);
        // Still return 200 to prevent Razorpay retries for parsing errors
        return NextResponse.json({ received: true });
    }
}

/**
 * Handle refund.created event
 * Updates status to PROCESSING
 */
async function handleRefundCreated(payload: any) {
    const refund = payload.refund.entity;
    const gatewayRefundId = refund.id;

    try {
        await prisma.refund.updateMany({
            where: { gatewayRefundId: gatewayRefundId },
            data: {
                status: "PROCESSING",
                gatewayStatus: refund.status
            }
        });

        console.log(`[Webhook] Refund ${gatewayRefundId} status updated to PROCESSING`);
    } catch (error) {
        console.error(`[Webhook] Error updating refund ${gatewayRefundId}:`, error);
    }
}

/**
 * Handle refund.processed event
 * ✅ CRITICAL: This is where we mark refund as complete
 */
async function handleRefundProcessed(payload: any) {
    const refund = payload.refund.entity;
    const gatewayRefundId = refund.id;

    try {
        // Find refund record
        const refundRecord = await prisma.refund.findUnique({
            where: { gatewayRefundId: gatewayRefundId },
            include: {
                returnRequest: true,
                payment: true
            }
        });

        if (!refundRecord) {
            console.error(`[Webhook] Refund ${gatewayRefundId} not found in database`);
            return;
        }

        // Idempotency check
        if (refundRecord.status === "PROCESSED") {
            console.log(`[Webhook] Refund ${gatewayRefundId} already processed. Skipping.`);
            return;
        }

        // Update in transaction
        await prisma.$transaction(async (tx) => {
            // Update refund status
            await tx.refund.update({
                where: { id: refundRecord.id },
                data: {
                    status: "PROCESSED",
                    gatewayStatus: refund.status,
                    processedAt: new Date()
                }
            });

            // Update return request if linked
            if (refundRecord.returnRequest) {
                await tx.returnRequest.update({
                    where: { id: refundRecord.returnRequest.id },
                    data: {
                        status: "REFUND_COMPLETED",
                        refundCompletedAt: new Date()
                    }
                });
            }

            // Update payment status
            const payment = refundRecord.payment;
            const totalRefunded = await tx.refund.aggregate({
                where: {
                    paymentId: payment.id,
                    status: "PROCESSED"
                },
                _sum: { amount: true }
            });

            const totalRefundedAmount = Number(totalRefunded._sum.amount || 0);
            const paymentAmount = Number(payment.amount);

            if (totalRefundedAmount >= paymentAmount) {
                await tx.payment.update({
                    where: { id: payment.id },
                    data: { status: "REFUNDED" }
                });
            } else {
                await tx.payment.update({
                    where: { id: payment.id },
                    data: { status: "PARTIALLY_REFUNDED" }
                });
            }

            // Update order status
            await tx.order.update({
                where: { id: refundRecord.orderId },
                data: {
                    paymentStatus: totalRefundedAmount >= paymentAmount ? "REFUNDED" : "PAID",
                    refundStatus: totalRefundedAmount >= paymentAmount ? "FULL" : "PARTIAL",
                    status: totalRefundedAmount >= paymentAmount ? "REFUNDED" : "DELIVERED"
                }
            });

            // Create timeline entry
            await tx.orderTimeline.create({
                data: {
                    orderId: refundRecord.orderId,
                    event: "REFUND_COMPLETED",
                    details: `Refund of ₹${refundRecord.amount} processed successfully by Razorpay. Refund ID: ${gatewayRefundId}`,
                    createdBy: "RAZORPAY_WEBHOOK"
                }
            });
        });

        console.log(`[Webhook] ✅ Refund ${gatewayRefundId} completed successfully`);

    } catch (error) {
        console.error(`[Webhook] Error processing refund ${gatewayRefundId}:`, error);
    }
}

/**
 * Handle refund.failed event
 * Marks refund as failed and notifies admin
 */
async function handleRefundFailed(payload: any) {
    const refund = payload.refund.entity;
    const gatewayRefundId = refund.id;

    try {
        const refundRecord = await prisma.refund.findUnique({
            where: { gatewayRefundId: gatewayRefundId }
        });

        if (!refundRecord) {
            console.error(`[Webhook] Refund ${gatewayRefundId} not found`);
            return;
        }

        await prisma.$transaction(async (tx) => {
            // Update refund status
            await tx.refund.update({
                where: { id: refundRecord.id },
                data: {
                    status: "FAILED",
                    gatewayStatus: refund.status,
                    processingNotes: `Razorpay refund failed: ${refund.error_description || "Unknown error"}`
                }
            });

            // Create timeline entry
            await tx.orderTimeline.create({
                data: {
                    orderId: refundRecord.orderId,
                    event: "REFUND_FAILED",
                    details: `Razorpay refund failed: ${refund.error_description || "Unknown error"}. Refund ID: ${gatewayRefundId}`,
                    createdBy: "RAZORPAY_WEBHOOK"
                }
            });

            // TODO: Send notification to admin
        });

        console.log(`[Webhook] ❌ Refund ${gatewayRefundId} failed`);

    } catch (error) {
        console.error(`[Webhook] Error handling failed refund ${gatewayRefundId}:`, error);
    }
}
