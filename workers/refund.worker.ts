/**
 * Refund Worker
 * 
 * Processes refund jobs through Razorpay API (wrapped in circuit breaker).
 * Handles full and partial refunds with retry logic.
 */

import { Job } from 'bullmq';
import { createWorker, type RefundJobData, emailQueue } from '@/lib/queue';
import { withRazorpayBreaker } from '@/lib/circuit-breaker';
import { logInfo, logError } from '@/lib/logger';
import prisma from '@/lib/prisma';

// ============================================================
// Razorpay Refund API
// ============================================================

async function initiateRazorpayRefund(gatewayPaymentId: string, amount: number) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        throw new Error('Razorpay credentials not configured');
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const amountInPaise = Math.round(amount * 100);

    const response = await fetch(
        `https://api.razorpay.com/v1/payments/${gatewayPaymentId}/refund`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount: amountInPaise }),
            signal: AbortSignal.timeout(10000),
        }
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { description: 'Unknown error' } }));
        throw new Error(error.error?.description || `Razorpay refund failed: ${response.status}`);
    }

    return response.json();
}

// ============================================================
// Processor
// ============================================================

async function processRefundJob(job: Job<RefundJobData>) {
    const { refundId, paymentId, gatewayPaymentId, amount, orderId, reason } = job.data;

    logInfo('REFUND_WORKER', `Processing refund: ${refundId}`, {
        paymentId,
        amount,
        orderId,
    });

    // 1. Initiate refund through circuit breaker
    const refundResult = await withRazorpayBreaker(
        () => initiateRazorpayRefund(gatewayPaymentId, amount)
    );

    // 2. Update refund record in database
    await prisma.refund.update({
        where: { id: refundId },
        data: {
            status: 'PROCESSED',
            gatewayRefundId: refundResult.id,
            processedAt: new Date(),
        },
    });

    // 3. Update payment status
    await prisma.payment.update({
        where: { id: paymentId },
        data: {
            status: 'REFUNDED',
        },
    });

    logInfo('REFUND_WORKER', `Refund completed: ${refundResult.id}`, {
        refundId,
        gatewayRefundId: refundResult.id,
        amount,
    });

    return {
        status: 'completed',
        gatewayRefundId: refundResult.id,
        amount,
    };
}

// ============================================================
// Start Worker
// ============================================================

export function startRefundWorker() {
    const worker = createWorker<RefundJobData>('refund', processRefundJob, 1);
    logInfo('REFUND_WORKER', 'Refund worker started', { concurrency: 1 });
    return worker;
}
