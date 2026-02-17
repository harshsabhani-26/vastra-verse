/**
 * Notification Worker
 * 
 * Processes notification jobs:
 * - SMS via MSG91
 * - Push notifications (future)
 * - In-app notifications (future)
 */

import { Job } from 'bullmq';
import { createWorker, type NotificationJobData } from '@/lib/queue';
import { withMSG91Breaker } from '@/lib/circuit-breaker';
import { logInfo, logError } from '@/lib/logger';

// ============================================================
// SMS Sender
// ============================================================

async function sendSMS(phone: string, message: string) {
    const authKey = process.env.MSG91_AUTH_KEY;
    if (!authKey) {
        logInfo('NOTIFICATION_WORKER', `SMS skipped (MSG91 not configured): ${phone}`);
        return { status: 'skipped', reason: 'MSG91 not configured' };
    }

    const response = await fetch('https://control.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'authkey': authKey,
        },
        body: JSON.stringify({
            flow_id: process.env.MSG91_TEMPLATE_ID,
            sender: process.env.MSG91_SENDER_ID || 'TXTIND',
            mobiles: phone.replace('+', ''),
            VAR1: message,
        }),
        signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`MSG91 error: ${error}`);
    }

    return response.json();
}

// ============================================================
// Processor
// ============================================================

async function processNotificationJob(job: Job<NotificationJobData>) {
    const { type, phone, message, userId, title } = job.data;

    switch (type) {
        case 'sms': {
            if (!phone) throw new Error('Phone number required for SMS notification');

            const result = await withMSG91Breaker(
                () => sendSMS(phone, message)
            );

            logInfo('NOTIFICATION_WORKER', `SMS sent to ${phone}`, { result });
            return result;
        }

        case 'push': {
            // Future: integrate with FCM or OneSignal
            logInfo('NOTIFICATION_WORKER', 'Push notification queued (not implemented)', {
                userId,
                title,
            });
            return { status: 'skipped', reason: 'Push not implemented' };
        }

        case 'in_app': {
            // Future: store in-app notification in database
            logInfo('NOTIFICATION_WORKER', 'In-app notification queued (not implemented)', {
                userId,
                title,
            });
            return { status: 'skipped', reason: 'In-app not implemented' };
        }

        default:
            throw new Error(`Unknown notification type: ${type}`);
    }
}

// ============================================================
// Start Worker
// ============================================================

export function startNotificationWorker() {
    const worker = createWorker<NotificationJobData>('notification', processNotificationJob, 2);
    logInfo('NOTIFICATION_WORKER', 'Notification worker started', { concurrency: 2 });
    return worker;
}
