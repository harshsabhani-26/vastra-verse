/**
 * Inngest Job: Email Sending
 *
 * Handles async email delivery with automatic retries.
 * Replaces direct nodemailer calls in the request cycle.
 *
 * Retries: 3 attempts with exponential backoff
 */

import { inngest } from '@/lib/inngest';
import { logInfo, logError } from '@/lib/logger';
import nodemailer from 'nodemailer';

export const sendEmailJob = inngest.createFunction(
    {
        id: 'send-email',
        name: 'Send Email',
        retries: 3,
    },
    { event: 'email/send' },
    async ({ event, step }) => {
        const { to, subject, html, from, replyTo, orderId, type } = event.data;

        logInfo('INNGEST', `Processing email job: ${type || 'generic'}`, {
            to,
            orderId,
            type,
        });

        await step.run('send-email', async () => {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            await transporter.sendMail({
                from: from || `"Vastra Verse" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                html,
                replyTo,
            });
        });

        logInfo('INNGEST', `Email sent successfully`, { to, type });

        return { success: true, to, type };
    }
);
