/**
 * Database Connection Pooling Configuration
 *
 * When DATABASE_POOL_SIZE is set, configures the Prisma connection pool.
 * For Railway/Supabase, PgBouncer is typical — this module provides
 * helpers and documentation around pool sizing.
 *
 * Recommended:
 *   - Railway: Set DATABASE_POOL_SIZE=10 per replica
 *   - Supabase: Connection pooling is managed via supavisor on port 6543
 *   - Direct connection: Use DIRECT_URL in Prisma schema
 *
 * Usage:
 *   import { getPoolConfig } from '@/lib/db-pool';
 */

import { logInfo } from '@/lib/logger';

interface PoolConfig {
    poolSize: number;
    connectionTimeout: number;   // seconds
    idleTimeout: number;         // seconds
    replicaEnabled: boolean;
    replicaUrl?: string;
}

/**
 * Get the current database pool configuration based on env vars.
 */
export function getPoolConfig(): PoolConfig {
    return {
        poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
        connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '10', 10),
        idleTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30', 10),
        replicaEnabled: !!process.env.DATABASE_REPLICA_URL,
        replicaUrl: process.env.DATABASE_REPLICA_URL,
    };
}

/**
 * Log pool configuration on startup (for diagnostics).
 */
export function logPoolConfig(): void {
    const config = getPoolConfig();
    logInfo('DB_POOL', `Database pool configuration`, {
        poolSize: config.poolSize,
        connectionTimeout: config.connectionTimeout,
        idleTimeout: config.idleTimeout,
        replicaEnabled: config.replicaEnabled,
        replicaConfigured: !!config.replicaUrl,
    });
}

/**
 * Best-practice pool size calculator.
 *
 * Rules of thumb for PostgreSQL:
 *   - Web servers: connections = (2 × CPU cores) + available disks
 *   - Supabase free tier: max 60 connections via pooler
 *   - Railway: Each replica gets ~10 connections
 *
 * @param cpuCores Number of CPU cores available
 * @param replicas Number of application replicas
 */
export function recommendedPoolSize(cpuCores: number = 2, replicas: number = 1): number {
    const perReplicaSize = (2 * cpuCores) + 1;
    const total = perReplicaSize * replicas;
    // Cap at 60 for Supabase free tier
    return Math.min(total, 60);
}
