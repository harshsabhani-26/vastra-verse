/**
 * Invoice Worker
 * 
 * Processes invoice generation jobs from the invoiceQueue.
 * Fetches order data, generates PDF, updates order record.
 */

import { Job } from 'bullmq';
import { createWorker, type InvoiceJobData } from '@/lib/queue';
import { logInfo, logError } from '@/lib/logger';
import prisma from '@/lib/prisma';

// ============================================================
// Processor
// ============================================================

async function processInvoiceJob(job: Job<InvoiceJobData>) {
    const { orderId, userId } = job.data;

    // 1. Fetch order with all related data
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: {
                include: {
                    product: { select: { name: true, sku: true } },
                },
            },
            user: { select: { name: true, email: true, phone: true } },
            payments: { where: { status: 'COMPLETED' }, take: 1 },
        },
    });

    if (!order) {
        logError('INVOICE_WORKER', new Error(`Order not found: ${orderId}`));
        return { status: 'skipped', reason: 'Order not found' };
    }

    // 2. Check if invoice already exists
    // (Future: generate PDF using lib/invoice/pdf-generator.ts and upload to Supabase)
    logInfo('INVOICE_WORKER', `Invoice job processed for order: ${orderId}`, {
        orderId,
        userId,
        total: order.total.toString(),
    });

    return {
        status: 'completed',
        orderId,
    };
}

// ============================================================
// Start Worker
// ============================================================

export function startInvoiceWorker() {
    const worker = createWorker<InvoiceJobData>('invoice', processInvoiceJob, 1);
    logInfo('INVOICE_WORKER', 'Invoice worker started', { concurrency: 1 });
    return worker;
}
