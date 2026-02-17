/**
 * Worker Process Entry Point
 * 
 * Starts all background workers.
 * Run with: npm run worker
 * 
 * In production, deploy as a separate Railway service.
 */

import { startEmailWorker } from './email.worker';
import { startInvoiceWorker } from './invoice.worker';
import { startRefundWorker } from './refund.worker';
import { startNotificationWorker } from './notification.worker';
import { startWebhookWorker } from './webhook.worker';
import { logInfo } from '@/lib/logger';

// ============================================================
// Start All Workers
// ============================================================

async function main() {
    logInfo('WORKERS', '🚀 Starting background workers...');

    const workers = [
        { name: 'Email', start: startEmailWorker },
        { name: 'Invoice', start: startInvoiceWorker },
        { name: 'Refund', start: startRefundWorker },
        { name: 'Notification', start: startNotificationWorker },
        { name: 'Webhook', start: startWebhookWorker },
    ];

    for (const w of workers) {
        try {
            w.start();
            logInfo('WORKERS', `✅ ${w.name} worker started`);
        } catch (error) {
            console.error(`❌ Failed to start ${w.name} worker:`, error);
        }
    }

    logInfo('WORKERS', '🎉 All workers started successfully');

    // Graceful shutdown
    const shutdown = async () => {
        logInfo('WORKERS', '🛑 Shutting down workers...');
        const { closeAllQueues } = await import('@/lib/queue');
        await closeAllQueues();
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

main().catch((error) => {
    console.error('Fatal worker error:', error);
    process.exit(1);
});
