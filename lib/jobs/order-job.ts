/**
 * Inngest Job: Order Processing
 *
 * Orchestrates the full post-order workflow:
 * 1. Send confirmation email
 * 2. Trigger invoice generation
 * 3. Update inventory
 * 4. Record analytics
 *
 * Retries: 3 attempts with exponential backoff
 */

import { inngest, logJobStart, logJobComplete, logJobError } from '@/lib/inngest';

// ─── Order Placed ─────────────────────────────────────────────────────────────

export const processOrderPlaced = inngest.createFunction(
    {
        id: 'process-order-placed',
        name: 'Process Order Placed',
        retries: 3,
    },
    { event: 'order/placed' },
    async ({ event, step }) => {
        const { orderId, userId, orderNumber, customerEmail, customerName, totalAmount, paymentMethod, items } = event.data;
        const startTime = Date.now();

        logJobStart('process-order-placed', { orderId, orderNumber });

        // Step 1: Send order confirmation email
        await step.run('send-confirmation-email', async () => {
            await inngest.send({
                name: 'email/send',
                data: {
                    to: customerEmail,
                    subject: `Order Confirmed — ${orderNumber}`,
                    html: buildOrderConfirmationHtml(orderNumber, customerName, totalAmount, paymentMethod, items),
                    orderId,
                    type: 'order_confirmation',
                },
            });
        });

        // Step 2: Trigger invoice generation
        await step.run('trigger-invoice', async () => {
            await inngest.send({
                name: 'invoice/generate',
                data: { orderId, userId },
            });
        });

        // Step 3: Update inventory for each item
        await step.run('update-inventory', async () => {
            for (const item of items) {
                await inngest.send({
                    name: 'inventory/update',
                    data: {
                        productId: item.productId,
                        variantId: item.variantId,
                        quantityChange: -item.quantity,
                        reason: 'order_placed',
                        orderId,
                        userId,
                    },
                });
            }
        });

        // Step 4: Record analytics
        await step.run('record-analytics', async () => {
            await inngest.send({
                name: 'analytics/record',
                data: {
                    event: 'order_placed',
                    properties: {
                        orderNumber,
                        totalAmount,
                        paymentMethod,
                        itemCount: items.length,
                    },
                    userId,
                    orderId,
                },
            });
        });

        logJobComplete('process-order-placed', { orderId, orderNumber }, Date.now() - startTime);
        return { success: true, orderId, orderNumber };
    }
);

// ─── Order Status Updated ─────────────────────────────────────────────────────

export const processOrderStatusUpdated = inngest.createFunction(
    {
        id: 'process-order-status-updated',
        name: 'Process Order Status Update',
        retries: 2,
    },
    { event: 'order/status-updated' },
    async ({ event, step }) => {
        const { orderId, orderNumber, previousStatus, newStatus, customerEmail, customerName, customerPhone } = event.data;

        logJobStart('process-order-status-updated', { orderId, newStatus });

        // Step 1: Send status update email
        await step.run('send-status-email', async () => {
            await inngest.send({
                name: 'email/send',
                data: {
                    to: customerEmail,
                    subject: `Order ${orderNumber} — ${formatStatus(newStatus)}`,
                    html: buildStatusUpdateHtml(orderNumber, customerName, previousStatus, newStatus),
                    orderId,
                    type: 'order_status_update',
                },
            });
        });

        // Step 2: Send SMS notification if phone available
        if (customerPhone) {
            await step.run('send-status-sms', async () => {
                await inngest.send({
                    name: 'notification/send',
                    data: {
                        type: 'sms',
                        phone: customerPhone,
                        message: `Your order ${orderNumber} is now ${formatStatus(newStatus)}. Track at vastraverse.in/orders/${orderId}`,
                        title: 'Order Update',
                    },
                });
            });
        }

        // Step 3: Record analytics
        await step.run('record-status-analytics', async () => {
            await inngest.send({
                name: 'analytics/record',
                data: {
                    event: 'order_status_changed',
                    properties: { previousStatus, newStatus },
                    orderId,
                },
            });
        });

        logJobComplete('process-order-status-updated', { orderId, newStatus });
        return { success: true, orderId, newStatus };
    }
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatStatus(status: string): string {
    const map: Record<string, string> = {
        PENDING: 'Pending',
        CONFIRMED: 'Confirmed',
        PROCESSING: 'Processing',
        SHIPPED: 'Shipped',
        DELIVERED: 'Delivered',
        CANCELLED: 'Cancelled',
        RETURNED: 'Returned',
    };
    return map[status] || status;
}

function buildOrderConfirmationHtml(
    orderNumber: string,
    customerName: string,
    totalAmount: number,
    paymentMethod: string,
    items: Array<{ name: string; quantity: number; price: number }>
): string {
    const itemRows = items
        .map(i => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${i.price.toLocaleString('en-IN')}</td></tr>`)
        .join('');

    return `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <h2 style="color:#8B4513">🎉 Order Confirmed!</h2>
      <p>Dear ${customerName},</p>
      <p>Thank you for your order! Here are your order details:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px;text-align:center">Qty</th><th style="padding:8px;text-align:right">Price</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <p style="font-size:18px;font-weight:bold;text-align:right">Total: ₹${totalAmount.toLocaleString('en-IN')}</p>
      <p><strong>Order Number:</strong> ${orderNumber}<br><strong>Payment:</strong> ${paymentMethod}</p>
      <hr>
      <p style="font-size:12px;color:#999">Vastraa Verse — Tradition Woven in Every Thread</p>
    </div>
    `;
}

function buildStatusUpdateHtml(
    orderNumber: string,
    customerName: string,
    previousStatus: string,
    newStatus: string
): string {
    return `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <h2 style="color:#8B4513">Order Update</h2>
      <p>Dear ${customerName},</p>
      <p>Your order <strong>${orderNumber}</strong> has been updated:</p>
      <div style="background:#f9f9f9;padding:16px;border-radius:8px;margin:16px 0">
        <p style="margin:0"><span style="color:#999">${formatStatus(previousStatus)}</span> → <strong style="color:#8B4513">${formatStatus(newStatus)}</strong></p>
      </div>
      <hr>
      <p style="font-size:12px;color:#999">Vastraa Verse — Tradition Woven in Every Thread</p>
    </div>
    `;
}
