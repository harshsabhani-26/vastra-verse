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
import { systemMonitoringCron, dailyCleanupCron } from '@/inngest/monitoring';
import { syncTrackingCron, ndrEscalationCron } from '@/inngest/shipping';

// Register all Inngest functions here
export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        // Existing jobs
        sendEmailJob,
        generateInvoiceJob,
        recordAnalyticsJob,
        // Enterprise jobs
        processOrderPlaced,
        processOrderStatusUpdated,
        processPaymentCaptured,
        processPaymentFailed,
        processNotification,
        processInventoryUpdate,
        // Monitoring & cleanup crons (audit: added)
        systemMonitoringCron,  // Runs every 5 min — alerts on critical issues
        dailyCleanupCron,      // Runs at 2am — cleans expired OTPs, sessions, old logs
        // Shipping crons
        syncTrackingCron,      // Runs every 15 min — syncs tracking from Shiprocket
        ndrEscalationCron,     // Runs daily at 10 AM IST — escalates unresolved NDRs
    ],
});


