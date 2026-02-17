/**
 * Webhook Processing Worker
 * 
 * Processes webhook events asynchronously.
 * Webhook API routes store the event and return 200 immediately.
 * This worker handles the actual processing.
 */

import { Job } from 'bullmq';
import { createWorker, type WebhookJobData } from '@/lib/queue';
import { withRazorpayBreaker } from '@/lib/circuit-breaker';
import { logInfo, logError } from '@/lib/logger';
import prisma from '@/lib/prisma';

// ============================================================
// Razorpay Webhook Processor
// ============================================================

async function processRazorpayWebhook(payload: Record<string, any>) {
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;

    if (!paymentEntity) {
        logInfo('WEBHOOK_WORKER', 'Razorpay webhook without payment entity, skipping', { event });
        return { status: 'skipped' };
    }

    switch (event) {
        case 'payment.authorized':
        case 'payment.captured': {
            // Find payment by gateway order ID
            const payment = await prisma.payment.findFirst({
                where: { gatewayOrderId: paymentEntity.order_id },
            });

            if (payment) {
                await prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: 'COMPLETED',
                        gatewayPaymentId: paymentEntity.id,
                        verifiedAt: new Date(),
                        verifiedBy: 'webhook',
                    },
                });

                await prisma.order.update({
                    where: { id: payment.orderId },
                    data: {
                        paymentStatus: 'PAID',
                        status: 'CONFIRMED',
                    },
                });

                logInfo('WEBHOOK_WORKER', `Payment confirmed via webhook: ${paymentEntity.id}`, {
                    orderId: payment.orderId,
                });
            }
            break;
        }

        case 'payment.failed': {
            const payment = await prisma.payment.findFirst({
                where: { gatewayOrderId: paymentEntity.order_id },
            });

            if (payment) {
                await prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: 'FAILED',
                        failureReason: paymentEntity.error_description,
                        failureCode: paymentEntity.error_code,
                    },
                });

                await prisma.order.update({
                    where: { id: payment.orderId },
                    data: {
                        paymentStatus: 'FAILED',
                        status: 'CANCELLED',
                    },
                });

                logInfo('WEBHOOK_WORKER', `Payment failed via webhook: ${paymentEntity.id}`, {
                    orderId: payment.orderId,
                    reason: paymentEntity.error_description,
                });
            }
            break;
        }

        case 'refund.processed': {
            const refundEntity = payload.payload?.refund?.entity;
            if (refundEntity) {
                const refund = await prisma.refund.findFirst({
                    where: { gatewayRefundId: refundEntity.id },
                });

                if (refund) {
                    await prisma.refund.update({
                        where: { id: refund.id },
                        data: {
                            status: 'PROCESSED',
                            processedAt: new Date(),
                        },
                    });

                    logInfo('WEBHOOK_WORKER', `Refund confirmed via webhook: ${refundEntity.id}`);
                }
            }
            break;
        }

        default:
            logInfo('WEBHOOK_WORKER', `Unhandled Razorpay event: ${event}`);
    }

    return { status: 'processed', event };
}

// ============================================================
// Main Processor
// ============================================================

async function processWebhookJob(job: Job<WebhookJobData>) {
    const { provider, event, payload } = job.data;

    logInfo('WEBHOOK_WORKER', `Processing webhook: ${provider}/${event}`);

    switch (provider) {
        case 'razorpay':
            return processRazorpayWebhook(payload);

        case 'shiprocket':
            // Future: process Shiprocket webhook events
            logInfo('WEBHOOK_WORKER', 'Shiprocket webhook — not implemented yet', { event });
            return { status: 'skipped', reason: 'Not implemented' };

        default:
            logError('WEBHOOK_WORKER', new Error(`Unknown webhook provider: ${provider}`));
            return { status: 'error', reason: `Unknown provider: ${provider}` };
    }
}

// ============================================================
// Start Worker
// ============================================================

export function startWebhookWorker() {
    const worker = createWorker<WebhookJobData>('webhook', processWebhookJob, 2);
    logInfo('WEBHOOK_WORKER', 'Webhook worker started', { concurrency: 2 });
    return worker;
}
