/**
 * Inngest Job: Invoice Generation
 *
 * Generates PDF invoices asynchronously after order placement.
 * Retries: 2 attempts with exponential backoff
 */

import { inngest } from '@/lib/inngest';
import { logInfo, logError } from '@/lib/logger';
import { buildInvoiceData } from '@/lib/invoice-data-builder';
import { generateInvoicePDF } from '@/lib/invoice-pdf-generator';
import { sendInvoiceEmail } from '@/lib/email/send-invoice';

export const generateInvoiceJob = inngest.createFunction(
    {
        id: 'generate-invoice',
        name: 'Generate Invoice PDF',
        retries: 2,
    },
    { event: 'invoice/generate' },
    async ({ event, step }) => {
        const { orderId } = event.data;

        logInfo('INNGEST', `Processing invoice job for order ${orderId}`);

        // Step 1: Build invoice data (fetches order from DB)
        const invoiceData = await step.run('build-invoice-data', async () => {
            return buildInvoiceData(orderId);
        });

        if (!invoiceData) {
            logError('INNGEST', new Error(`Invoice data not found for order: ${orderId}`), { orderId });
            return { success: false, error: 'Invoice data not found' };
        }

        // Step 2: Generate PDF
        const pdfBuffer = await step.run('generate-pdf', async () => {
            return generateInvoicePDF(invoiceData as any);
        });

        // Step 3: Send email with PDF attachment
        if (invoiceData.customer?.email) {
            await step.run('send-invoice-email', async () => {
                // Inngest serializes step results as JSON — reconstruct Buffer from the data array
                const buffer = Buffer.isBuffer(pdfBuffer)
                    ? pdfBuffer
                    : Buffer.from((pdfBuffer as any).data ?? pdfBuffer);
                await sendInvoiceEmail(invoiceData as any, buffer);
            });
        }

        logInfo('INNGEST', `Invoice generated and emailed for order ${orderId}`);
        return { success: true, orderId };
    }
);
