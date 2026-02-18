/**
 * Read Replica Prisma Client
 *
 * Separate PrismaClient configured for read-only queries (SELECT).
 * If DATABASE_REPLICA_URL is set, uses that; otherwise falls back
 * to the primary connection.
 *
 * Usage:
 *   import { prismaRead } from '@/lib/db-read';
 *   const products = await prismaRead.product.findMany();
 */

import { PrismaClient } from '@prisma/client';

const globalForPrismaRead = globalThis as unknown as {
    prismaRead: PrismaClient | undefined;
};

function createReadClient(): PrismaClient {
    const url = process.env.DATABASE_REPLICA_URL || process.env.DATABASE_URL;

    const client = new PrismaClient({
        datasourceUrl: url,
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
    });

    // Add slow-query logging middleware for read replica
    client.$use(async (params, next) => {
        const before = Date.now();
        const result = await next(params);
        const after = Date.now();
        const duration = after - before;

        if (duration > 500) {
            console.warn(
                `[READ_REPLICA] Slow query detected (${duration}ms): ${params.model}.${params.action}`,
            );
        }

        return result;
    });

    return client;
}

export const prismaRead = globalForPrismaRead.prismaRead ?? createReadClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrismaRead.prismaRead = prismaRead;
}

/**
 * Check if a read replica is configured.
 */
export function hasReadReplica(): boolean {
    return !!process.env.DATABASE_REPLICA_URL;
}

/**
 * Use the read replica if available, otherwise fall back to primary.
 * Convenience wrapper for migration path.
 */
export function getReadClient(): PrismaClient {
    return prismaRead;
}
