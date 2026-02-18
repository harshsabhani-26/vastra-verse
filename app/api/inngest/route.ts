/**
 * Inngest Webhook Handler
 *
 * This route serves as the bridge between Inngest's cloud/dev server
 * and your Next.js application. All registered functions are served here.
 *
 * - Local dev: Inngest Dev Server connects to http://localhost:3000/api/inngest
 * - Production: Inngest Cloud calls this endpoint to execute functions
 *
 * Add INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY to Railway env vars.
 * Get them from: https://app.inngest.com/env/production/manage/keys
 */

import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest';
import { sendEmailJob } from '@/lib/jobs/email-job';
import { generateInvoiceJob } from '@/lib/jobs/invoice-job';
import { recordAnalyticsJob } from '@/lib/jobs/analytics-job';
import { processOrderPlaced, processOrderStatusUpdated } from '@/lib/jobs/order-job';
import { processPaymentCaptured, processPaymentFailed } from '@/lib/jobs/payment-job';
import { processNotification } from '@/lib/jobs/notification-job';
import { processInventoryUpdate } from '@/lib/jobs/inventory-job';

// Register all Inngest functions here
export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        // Existing jobs
        sendEmailJob,
        generateInvoiceJob,
        recordAnalyticsJob,
        // New enterprise jobs
        processOrderPlaced,
        processOrderStatusUpdated,
        processPaymentCaptured,
        processPaymentFailed,
        processNotification,
        processInventoryUpdate,
    ],
});

