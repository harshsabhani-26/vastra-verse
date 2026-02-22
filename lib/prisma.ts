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

        // Skip PerformanceMetric itself to avoid infinite feedback loop:
        // slow query → PerformanceMetric.create (slow) → PerformanceMetric.create → ∞
        if (params.model === 'PerformanceMetric') return result;

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

    // ── Auto-revalidation middleware ──────────────────────────────
    // Automatically invalidates Next.js cache tags when Prisma
    // performs write operations. Only calls revalidateTag (safe) —
    // NOT revalidatePath (which throws when called during render).
    client.$use(async (params, next) => {
        const result = await next(params);

        const WRITE_ACTIONS = new Set([
            'create', 'createMany', 'update', 'updateMany',
            'upsert', 'delete', 'deleteMany',
        ]);

        if (params.model && WRITE_ACTIONS.has(params.action)) {
            import('@/lib/cache/cache-tags').then(({ MODEL_TO_TAGS, revalidateNextTags }: any) => {
                const tags = MODEL_TO_TAGS[params.model!];
                if (!tags || tags.length === 0) return;

                logInfo('PRISMA_AUTO_REVALIDATE', `${params.model}.${params.action} → revalidating [${tags.join(', ')}]`);

                // Only invalidate Next.js cache tags — revalidatePath is NOT called here
                // because calling it during a render cycle causes a Next.js error.
                // revalidatePath is called manually in the Server Actions instead.
                if (typeof revalidateNextTags === 'function') {
                    revalidateNextTags(tags);
                }
            }).catch(() => { /* cache-tags unavailable during init */ });
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
