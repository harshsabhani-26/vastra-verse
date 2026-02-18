/**
 * Inngest Job: Notification Routing
 *
 * Routes notifications to the appropriate channel:
 * - SMS via MSG91
 * - In-app via database
 * - Push via FCM (placeholder)
 *
 * Retries: 2 attempts (best-effort)
 */

import { inngest, logJobStart, logJobComplete, logJobError } from '@/lib/inngest';
import prisma from '@/lib/prisma';
import { logInfo, logError } from '@/lib/logger';

export const processNotification = inngest.createFunction(
    {
        id: 'process-notification',
        name: 'Process Notification',
        retries: 2,
    },
    { event: 'notification/send' },
    async ({ event, step }) => {
        const { type, userId, phone, message, title, data } = event.data;
        const startTime = Date.now();

        logJobStart('process-notification', { type, userId });

        // Route based on type
        switch (type) {
            case 'sms':
                await step.run('send-sms', async () => {
                    if (!phone) throw new Error('Phone number required for SMS');
                    await sendSMS(phone, message);
                });
                break;

            case 'in_app':
                await step.run('create-in-app-notification', async () => {
                    if (!userId) throw new Error('userId required for in-app notification');
                    await prisma.notification.create({
                        data: {
                            userId,
                            type: 'NEW_ORDER', // Default type
                            title: title || 'Notification',
                            message,
                            data: data || {},
                        },
                    });
                });
                break;

            case 'push':
                await step.run('send-push', async () => {
                    // FCM push notification — placeholder for future implementation
                    logInfo('NOTIFICATION', `Push notification skipped (not implemented)`, { userId, title });
                });
                break;

            default:
                logError('NOTIFICATION', new Error(`Unknown notification type: ${type}`), { type });
        }

        logJobComplete('process-notification', { type, userId }, Date.now() - startTime);
        return { success: true, type, userId };
    }
);

// ─── SMS Helper ───────────────────────────────────────────────────────────────

async function sendSMS(phone: string, message: string): Promise<void> {
    const authKey = process.env.MSG91_AUTH_KEY;
    if (!authKey) {
        logInfo('SMS', 'MSG91_AUTH_KEY not configured, skipping SMS', { phone });
        return;
    }

    try {
        const response = await fetch('https://control.msg91.com/api/v5/flow/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authkey': authKey,
            },
            body: JSON.stringify({
                sender: process.env.MSG91_SENDER_ID || 'VSTRVS',
                route: '4',
                country: '91',
                sms: [{
                    message,
                    to: [phone.replace(/^\+?91/, '')],
                }],
            }),
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            throw new Error(`MSG91 API returned ${response.status}`);
        }

        logInfo('SMS', `SMS sent to ${phone.slice(-4).padStart(phone.length, '*')}`, { status: response.status });
    } catch (err) {
        logError('SMS', err, { phone: phone.slice(-4) });
        throw err; // Let Inngest retry
    }
}
