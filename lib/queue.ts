/**
 * BullMQ Queue Infrastructure
 * 
 * Production-grade background job system using BullMQ + Upstash Redis.
 * 
 * Queues:
 * - emailQueue: Email sending (retry: 3, backoff: 1s-10s)
 * - invoiceQueue: PDF generation (retry: 2, backoff: 2s-20s)
 * - shipmentQueue: Shiprocket API calls (retry: 3, backoff: 2s-30s)
 * - refundQueue: Razorpay refund processing (retry: 3, backoff: 1s-10s)
 * - notificationQueue: Push/SMS notifications (retry: 2, backoff: 1s-5s)
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { logInfo, logError } from '@/lib/logger';

// ============================================================
// Redis Connection
// ============================================================

let redisConnection: IORedis | null = null;

function getRedisConnection(): IORedis {
    if (redisConnection) return redisConnection;

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
        throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required for queue system');
    }

    // BullMQ needs a standard Redis connection, not REST API
    // Upstash provides a Redis-compatible URL for direct connections
    // Format: rediss://default:<token>@<host>:<port>
    const host = redisUrl.replace('https://', '').replace('http://', '');
    const connectionUrl = `rediss://default:${redisToken}@${host}:6379`;

    redisConnection = new IORedis(connectionUrl, {
        maxRetriesPerRequest: null, // Required by BullMQ
        enableReadyCheck: false,
        tls: {
            rejectUnauthorized: false,
        },
    });

    redisConnection.on('error', (err) => {
        logError('REDIS', err, { context: 'Queue connection error' });
    });

    redisConnection.on('connect', () => {
        logInfo('REDIS', 'Queue Redis connection established');
    });

    return redisConnection;
}

// ============================================================
// Job Type Definitions
// ============================================================

export interface EmailJobData {
    to: string;
    subject: string;
    html: string;
    from?: string;
    replyTo?: string;
    orderId?: string;
    type?: 'order_confirmation' | 'payment_receipt' | 'shipment_notification' |
    'return_approval' | 'refund_confirmation' | 'security_alert';
}

export interface InvoiceJobData {
    orderId: string;
    userId: string;
}

export interface ShipmentJobData {
    orderId: string;
    shipmentData: {
        orderId: string;
        orderNumber: string;
        orderDate: string;
        pickupLocation: string;
        billingCustomerName: string;
        billingLastName: string;
        billingAddress: string;
        billingCity: string;
        billingState: string;
        billingPincode: string;
        billingCountry: string;
        billingEmail: string;
        billingPhone: string;
        shippingIsBilling: boolean;
        orderItems: Array<{
            name: string;
            sku: string;
            units: number;
            selling_price: number;
        }>;
        paymentMethod: 'Prepaid' | 'COD';
        subTotal: number;
        length: number;
        breadth: number;
        height: number;
        weight: number;
    };
}

export interface RefundJobData {
    refundId: string;
    paymentId: string;
    gatewayPaymentId: string;
    amount: number;
    orderId: string;
    reason?: string;
}

export interface NotificationJobData {
    type: 'sms' | 'push' | 'in_app';
    userId?: string;
    phone?: string;
    message: string;
    title?: string;
    data?: Record<string, any>;
}

export interface WebhookJobData {
    provider: 'razorpay' | 'shiprocket';
    event: string;
    payload: Record<string, any>;
    signature?: string;
    receivedAt: string;
}

// ============================================================
// Queue Configurations
// ============================================================

interface QueueConfig {
    name: string;
    defaultJobOptions: {
        attempts: number;
        backoff: {
            type: 'exponential' | 'fixed';
            delay: number;
        };
        removeOnComplete: {
            count: number;
        };
        removeOnFail: {
            count: number;
        };
    };
}

const QUEUE_CONFIGS: Record<string, QueueConfig> = {
    email: {
        name: 'email',
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 500 },
        },
    },
    invoice: {
        name: 'invoice',
        defaultJobOptions: {
            attempts: 2,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: { count: 50 },
            removeOnFail: { count: 200 },
        },
    },
    shipment: {
        name: 'shipment',
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 500 },
        },
    },
    refund: {
        name: 'refund',
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 500 },
        },
    },
    notification: {
        name: 'notification',
        defaultJobOptions: {
            attempts: 2,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: { count: 50 },
            removeOnFail: { count: 200 },
        },
    },
    webhook: {
        name: 'webhook',
        defaultJobOptions: {
            attempts: 5,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: { count: 200 },
            removeOnFail: { count: 1000 },
        },
    },
};

// ============================================================
// Queue Instances (Singleton)
// ============================================================

const queues: Map<string, Queue> = new Map();

function getQueue<T = any>(name: string): Queue<T> {
    if (queues.has(name)) {
        return queues.get(name)! as Queue<T>;
    }

    const config = QUEUE_CONFIGS[name];
    if (!config) {
        throw new Error(`Unknown queue: ${name}`);
    }

    const queue = new Queue<T>(config.name, {
        connection: getRedisConnection(),
        defaultJobOptions: config.defaultJobOptions,
    });

    queues.set(name, queue);
    return queue;
}

// ============================================================
// Public Queue Accessors
// ============================================================

export const emailQueue = () => getQueue<EmailJobData>('email');
export const invoiceQueue = () => getQueue<InvoiceJobData>('invoice');
export const shipmentQueue = () => getQueue<ShipmentJobData>('shipment');
export const refundQueue = () => getQueue<RefundJobData>('refund');
export const notificationQueue = () => getQueue<NotificationJobData>('notification');
export const webhookQueue = () => getQueue<WebhookJobData>('webhook');

// ============================================================
// Helper: Create Worker
// ============================================================

export function createWorker<T = any>(
    queueName: string,
    processor: (job: Job<T>) => Promise<any>,
    concurrency: number = 1
): Worker<T> {
    const worker = new Worker<T>(
        queueName,
        async (job) => {
            const startTime = Date.now();
            logInfo('WORKER', `Job started: ${queueName}/${job.name}`, {
                jobId: job.id,
                attempt: job.attemptsMade + 1,
                data: job.name,
            });

            try {
                const result = await processor(job);
                const duration = Date.now() - startTime;
                logInfo('WORKER', `Job completed: ${queueName}/${job.name}`, {
                    jobId: job.id,
                    duration: `${duration}ms`,
                });
                return result;
            } catch (error) {
                const duration = Date.now() - startTime;
                logError('WORKER', error, {
                    jobId: job.id,
                    queue: queueName,
                    jobName: job.name,
                    attempt: job.attemptsMade + 1,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        },
        {
            connection: getRedisConnection(),
            concurrency,
        }
    );

    worker.on('failed', (job, err) => {
        logError('WORKER', err, {
            queue: queueName,
            jobId: job?.id,
            jobName: job?.name,
            attempt: job?.attemptsMade,
            maxAttempts: job?.opts.attempts,
        });
    });

    worker.on('error', (err) => {
        logError('WORKER', err, { queue: queueName, context: 'Worker error' });
    });

    return worker;
}

// ============================================================
// Queue Stats (for monitoring)
// ============================================================

export async function getQueueStats() {
    const stats: Record<string, any> = {};

    for (const [name] of Object.entries(QUEUE_CONFIGS)) {
        try {
            const queue = getQueue(name);
            const [waiting, active, completed, failed, delayed] = await Promise.all([
                queue.getWaitingCount(),
                queue.getActiveCount(),
                queue.getCompletedCount(),
                queue.getFailedCount(),
                queue.getDelayedCount(),
            ]);

            stats[name] = { waiting, active, completed, failed, delayed };
        } catch {
            stats[name] = { error: 'Unable to fetch stats' };
        }
    }

    return stats;
}

export async function getFailedJobs(queueName: string, start = 0, end = 20) {
    const queue = getQueue(queueName);
    const jobs = await queue.getFailed(start, end);

    return jobs.map((job) => ({
        id: job.id,
        name: job.name,
        data: job.data,
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
    }));
}

export async function retryFailedJob(queueName: string, jobId: string) {
    const queue = getQueue(queueName);
    const job = await queue.getJob(jobId);
    if (job) {
        await job.retry();
        return true;
    }
    return false;
}

// ============================================================
// Graceful Shutdown
// ============================================================

export async function closeAllQueues() {
    const closePromises: Promise<void>[] = [];
    for (const [, queue] of queues) {
        closePromises.push(queue.close());
    }
    await Promise.all(closePromises);

    if (redisConnection) {
        await redisConnection.quit();
        redisConnection = null;
    }

    queues.clear();
    logInfo('QUEUE', 'All queues closed gracefully');
}
