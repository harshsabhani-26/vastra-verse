/**
 * Email Worker
 * 
 * Processes email jobs from the emailQueue.
 * Uses nodemailer with Gmail transport.
 * Retries on SMTP failure with exponential backoff.
 */

import { Job } from 'bullmq';
import nodemailer from 'nodemailer';
import { createWorker, type EmailJobData } from '@/lib/queue';
import { logInfo, logError } from '@/lib/logger';

// ============================================================
// Transporter (singleton)
// ============================================================

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
    if (transporter) return transporter;

    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        pool: true,
        maxConnections: 3,
        maxMessages: 100,
        socketTimeout: 10000,
        greetingTimeout: 10000,
    });

    return transporter;
}

// ============================================================
// Processor
// ============================================================

async function processEmailJob(job: Job<EmailJobData>) {
    const { to, subject, html, from, replyTo, type, orderId } = job.data;

    const emailUser = process.env.EMAIL_USER;
    if (!emailUser) {
        throw new Error('EMAIL_USER environment variable not configured');
    }

    const transport = getTransporter();

    const info = await transport.sendMail({
        from: from || `"Vastraa Verse" <${emailUser}>`,
        to,
        subject,
        html,
        replyTo: replyTo || emailUser,
    });

    logInfo('EMAIL_WORKER', `Email sent: ${subject}`, {
        to,
        messageId: info.messageId,
        type,
        orderId,
    });

    return { messageId: info.messageId, accepted: info.accepted };
}

// ============================================================
// Start Worker
// ============================================================

export function startEmailWorker() {
    const worker = createWorker<EmailJobData>('email', processEmailJob, 2);
    logInfo('EMAIL_WORKER', 'Email worker started', { concurrency: 2 });
    return worker;
}
