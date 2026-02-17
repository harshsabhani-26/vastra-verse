import { PrismaClient } from '@prisma/client';
import { logInfo } from '@/lib/logger';

const SLOW_QUERY_THRESHOLD = parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || '500', 10);

const prismaClientSingleton = () => {
    const client = new PrismaClient();

    // Middleware to log slow queries (configurable via SLOW_QUERY_THRESHOLD_MS env var)
    client.$use(async (params, next) => {
        const start = Date.now();
        const result = await next(params);
        const duration = Date.now() - start;

        if (duration > SLOW_QUERY_THRESHOLD) {
            logInfo('SLOW_QUERY', `${params.model}.${params.action} took ${duration}ms`, {
                model: params.model,
                action: params.action,
                duration,
                threshold: SLOW_QUERY_THRESHOLD,
            });

            // Record to PerformanceMetric (non-blocking, lazy import to avoid circular deps)
            import('@/lib/metrics').then(({ recordPerformance }) => {
                recordPerformance(
                    'DATABASE',
                    `${params.model}.${params.action}`,
                    duration,
                    undefined,
                    { model: params.model, action: params.action }
                );
            }).catch(() => { /* metrics unavailable, ignore */ });
        }

        return result;
    });

    return client;
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
