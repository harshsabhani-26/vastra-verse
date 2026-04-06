/**
 * Inngest Job: Payment Event Handling
 *
 * Handles payment lifecycle events:
 * - payment/captured → confirm order + send receipt
 * - payment/failed → restore inventory + notify customer
 *
 * Retries: 3 attempts (critical path)
 */

import { inngest, logJobStart, logJobComplete, logJobError } from '@/lib/inngest';
import prisma from '@/lib/prisma';
import { invalidateProducts } from '@/lib/cache-invalidation';

// ─── Payment Captured ─────────────────────────────────────────────────────────

export const processPaymentCaptured = inngest.createFunction(
    {
        id: 'process-payment-captured',
        name: 'Process Payment Captured',
        retries: 3,
    },
    { event: 'payment/captured' },
    async ({ event, step }) => {
        const { orderId, userId, paymentId, gatewayPaymentId, amount, method, customerEmail } = event.data;
        const startTime = Date.now();

        logJobStart('process-payment-captured', { orderId, paymentId });

        // Step 1: Update payment status in DB
        const order = await step.run('update-payment-status', async () => {
            const [updatedOrder] = await prisma.$transaction([
                prisma.order.update({
                    where: { id: orderId },
                    data: {
                        paymentStatus: 'PAID',
                        status: 'CONFIRMED',
                    },
                    include: {
                        items: {
                            include: { product: true },
                        },
                        user: { select: { name: true, email: true } },
                    },
                }),
                prisma.payment.updateMany({
                    where: { id: paymentId },
                    data: {
                        status: 'COMPLETED',
                        gatewayPaymentId,
                        verifiedAt: new Date(),
                    },
                }),
            ]);
            return updatedOrder;
        });

        // Step 2: Fire order/placed to trigger full order workflow
        await step.run('trigger-order-placed', async () => {
            await inngest.send({
                name: 'order/placed',
                data: {
                    orderId,
                    userId,
                    orderNumber: order.id,
                    customerEmail: order.user?.email || customerEmail,
                    customerName: order.user?.name || 'Customer',
                    totalAmount: Number(order.total),
                    paymentMethod: 'ONLINE',
                    items: order.items.map((item: any) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: Number(item.price),
                        name: item.product?.name || 'Product',
                    })),
                },
            });
        });

        // Step 3: Send payment receipt
        await step.run('send-payment-receipt', async () => {
            await inngest.send({
                name: 'email/send',
                data: {
                    to: customerEmail,
                    subject: `Payment Received — ₹${amount.toLocaleString('en-IN')}`,
                    html: `
                    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
                      <h2 style="color:#4CAF50">✅ Payment Received</h2>
                      <p>We've received your payment of <strong>₹${amount.toLocaleString('en-IN')}</strong>.</p>
                      <p><strong>Payment ID:</strong> ${gatewayPaymentId}<br><strong>Method:</strong> ${method}</p>
                      <p>Your order is being processed and you'll receive updates shortly.</p>
                      <hr>
                      <p style="font-size:12px;color:#999">Vastraa Verse — Tradition Woven in Every Thread</p>
                    </div>`,
                    orderId,
                    type: 'payment_receipt',
                },
            });
        });

        logJobComplete('process-payment-captured', { orderId, amount }, Date.now() - startTime);
        return { success: true, orderId, paymentId };
    }
);

// ─── Payment Failed ───────────────────────────────────────────────────────────

export const processPaymentFailed = inngest.createFunction(
    {
        id: 'process-payment-failed',
        name: 'Process Payment Failed',
        retries: 2,
    },
    { event: 'payment/failed' },
    async ({ event, step }) => {
        const { orderId, userId, amount, reason, customerEmail, items } = event.data;

        logJobStart('process-payment-failed', { orderId, reason });

        // Step 1: Update order status
        await step.run('mark-order-failed', async () => {
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: 'FAILED',
                    status: 'CANCELLED',
                    cancellationReason: `Payment failed: ${reason}`,
                    cancelledAt: new Date(),
                },
            });
        });

        // Step 2: Restore inventory
        await step.run('restore-inventory', async () => {
            for (const item of items) {
                await inngest.send({
                    name: 'inventory/update',
                    data: {
                        productId: item.productId,
                        variantId: item.variantId,
                        quantityChange: item.quantity, // positive = restore
                        reason: 'order_cancelled',
                        orderId,
                        userId,
                    },
                });
            }
        });

        // Step 3: Invalidate product cache (stock changed)
        await step.run('invalidate-cache', async () => {
            await invalidateProducts();
        });

        // Step 4: Notify customer
        await step.run('send-failure-email', async () => {
            await inngest.send({
                name: 'email/send',
                data: {
                    to: customerEmail,
                    subject: `Payment Issue — Order Could Not Be Processed`,
                    html: `
                    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
                      <h2 style="color:#f44336">⚠️ Payment Not Processed</h2>
                      <p>We were unable to process your payment of <strong>₹${amount.toLocaleString('en-IN')}</strong>.</p>
                      <p><strong>Reason:</strong> ${reason}</p>
                      <p>No amount has been charged. If deducted, it will be refunded within 5-7 business days.</p>
                      <p>Please try again or use a different payment method.</p>
                      <hr>
                      <p style="font-size:12px;color:#999">Vastraa Verse — Tradition Woven in Every Thread</p>
                    </div>`,
                    orderId,
                    type: 'payment_failed',
                },
            });
        });

        logJobComplete('process-payment-failed', { orderId, reason });
        return { success: true, orderId, reason };
    }
);
