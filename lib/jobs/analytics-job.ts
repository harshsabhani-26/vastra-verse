/**
 * Inngest Job: Analytics & Metrics Recording
 *
 * Records business events asynchronously to avoid adding latency
 * to the request cycle. Retries: 1 attempt (analytics are best-effort).
 */

import { inngest } from '@/lib/inngest';
import { logInfo } from '@/lib/logger';
import { recordMetric, type MetricName } from '@/lib/metrics';

export const recordAnalyticsJob = inngest.createFunction(
    {
        id: 'record-analytics',
        name: 'Record Analytics Event',
        retries: 1, // Best-effort — analytics loss is acceptable
    },
    { event: 'analytics/record' },
    async ({ event, step }) => {
        const { event: eventName, properties, userId, orderId } = event.data;

        await step.run('record-metric', async () => {
            // Map event name to MetricName enum
            const metricName = (eventName.toUpperCase().replace(/\//g, '_')) as MetricName;
            const value = typeof properties.value === 'number' ? properties.value : 1;

            recordMetric(metricName, value, 'DAILY', {
                userId,
                orderId,
                ...properties,
            });
        });

        logInfo('INNGEST', `Analytics recorded: ${eventName}`, { userId, orderId });
        return { success: true, event: eventName };
    }
);
