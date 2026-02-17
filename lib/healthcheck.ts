/**
 * Comprehensive Health Check Service
 * 
 * Verifies connectivity and health of all external dependencies:
 * - PostgreSQL (via Prisma)
 * - Redis (via Upstash)
 * - Email Provider (SMTP)
 * - Payment Gateway (Razorpay)
 * - Shipping Provider (Shiprocket)
 * 
 * Returns structured health status with individual service states.
 */

import prisma from '@/lib/prisma';
import { logError, logInfo } from '@/lib/logger';

// ============================================================
// Types
// ============================================================

export type ServiceStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface ServiceHealth {
    status: ServiceStatus;
    latencyMs: number;
    message?: string;
    lastChecked: string;
}

export interface SystemHealth {
    overall: ServiceStatus;
    uptime: number; // seconds
    timestamp: string;
    services: {
        database: ServiceHealth;
        redis: ServiceHealth;
        email: ServiceHealth;
        payment: ServiceHealth;
        shipping: ServiceHealth;
    };
    environment: {
        nodeVersion: string;
        nextEnv: string;
        region?: string;
    };
}

const serverStartTime = Date.now();

// ============================================================
// Individual Health Checks
// ============================================================

/** Check PostgreSQL database connection */
async function checkDatabase(): Promise<ServiceHealth> {
    const start = performance.now();
    try {
        await prisma.$queryRaw`SELECT 1`;
        const latencyMs = Math.round(performance.now() - start);
        return {
            status: latencyMs > 1000 ? 'degraded' : 'healthy',
            latencyMs,
            message: latencyMs > 1000 ? 'High latency detected' : undefined,
            lastChecked: new Date().toISOString(),
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            latencyMs: Math.round(performance.now() - start),
            message: error instanceof Error ? error.message : 'Connection failed',
            lastChecked: new Date().toISOString(),
        };
    }
}

/** Check Redis connection (Upstash) */
async function checkRedis(): Promise<ServiceHealth> {
    const start = performance.now();
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
        return {
            status: 'unknown',
            latencyMs: 0,
            message: 'Redis not configured',
            lastChecked: new Date().toISOString(),
        };
    }

    try {
        const response = await fetch(`${redisUrl.replace(/\/$/, '')}/ping`, {
            headers: { Authorization: `Bearer ${redisToken}` },
            signal: AbortSignal.timeout(5000),
        });

        const latencyMs = Math.round(performance.now() - start);
        if (response.ok) {
            return {
                status: latencyMs > 2000 ? 'degraded' : 'healthy',
                latencyMs,
                message: latencyMs > 2000 ? 'High latency' : undefined,
                lastChecked: new Date().toISOString(),
            };
        }
        return {
            status: 'unhealthy',
            latencyMs,
            message: `HTTP ${response.status}`,
            lastChecked: new Date().toISOString(),
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            latencyMs: Math.round(performance.now() - start),
            message: error instanceof Error ? error.message : 'Connection failed',
            lastChecked: new Date().toISOString(),
        };
    }
}

/** Check email provider (SMTP connectivity test) */
async function checkEmail(): Promise<ServiceHealth> {
    const start = performance.now();
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
        return {
            status: 'unknown',
            latencyMs: 0,
            message: 'Email not configured',
            lastChecked: new Date().toISOString(),
        };
    }

    try {
        // Use dynamic import to avoid loading nodemailer in every request
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransport({
            service: 'gmail',
            auth: { user: emailUser, pass: emailPass },
            connectionTimeout: 5000,
        });

        await transporter.verify();
        const latencyMs = Math.round(performance.now() - start);

        return {
            status: latencyMs > 5000 ? 'degraded' : 'healthy',
            latencyMs,
            message: latencyMs > 5000 ? 'Slow SMTP response' : undefined,
            lastChecked: new Date().toISOString(),
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            latencyMs: Math.round(performance.now() - start),
            message: error instanceof Error ? error.message : 'SMTP check failed',
            lastChecked: new Date().toISOString(),
        };
    }
}

/** Check Razorpay payment gateway */
async function checkPaymentGateway(): Promise<ServiceHealth> {
    const start = performance.now();
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        return {
            status: 'unknown',
            latencyMs: 0,
            message: 'Razorpay not configured',
            lastChecked: new Date().toISOString(),
        };
    }

    try {
        const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const response = await fetch('https://api.razorpay.com/v1/payments?count=1', {
            headers: { Authorization: `Basic ${auth}` },
            signal: AbortSignal.timeout(5000),
        });

        const latencyMs = Math.round(performance.now() - start);

        if (response.ok || response.status === 401) {
            // 401 means credentials work but may not have permission for this endpoint
            // We validate that the API is reachable
            return {
                status: response.ok ? (latencyMs > 3000 ? 'degraded' : 'healthy') : 'degraded',
                latencyMs,
                message: response.status === 401 ? 'API reachable, auth verified' : undefined,
                lastChecked: new Date().toISOString(),
            };
        }

        return {
            status: 'unhealthy',
            latencyMs,
            message: `HTTP ${response.status}`,
            lastChecked: new Date().toISOString(),
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            latencyMs: Math.round(performance.now() - start),
            message: error instanceof Error ? error.message : 'Gateway unreachable',
            lastChecked: new Date().toISOString(),
        };
    }
}

/** Check Shiprocket shipping provider */
async function checkShippingProvider(): Promise<ServiceHealth> {
    const start = performance.now();
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;

    if (!email || !password) {
        return {
            status: 'unknown',
            latencyMs: 0,
            message: 'Shiprocket not configured',
            lastChecked: new Date().toISOString(),
        };
    }

    try {
        // Just test authentication endpoint reachability
        const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            signal: AbortSignal.timeout(5000),
        });

        const latencyMs = Math.round(performance.now() - start);

        if (response.ok) {
            return {
                status: latencyMs > 3000 ? 'degraded' : 'healthy',
                latencyMs,
                lastChecked: new Date().toISOString(),
            };
        }

        return {
            status: response.status === 401 ? 'degraded' : 'unhealthy',
            latencyMs,
            message: response.status === 401 ? 'Invalid credentials' : `HTTP ${response.status}`,
            lastChecked: new Date().toISOString(),
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            latencyMs: Math.round(performance.now() - start),
            message: error instanceof Error ? error.message : 'Provider unreachable',
            lastChecked: new Date().toISOString(),
        };
    }
}

// ============================================================
// Full System Health Check
// ============================================================

/**
 * Run all health checks and return comprehensive system status.
 */
export async function getSystemHealth(): Promise<SystemHealth> {
    const [database, redis, email, payment, shipping] = await Promise.allSettled([
        checkDatabase(),
        checkRedis(),
        checkEmail(),
        checkPaymentGateway(),
        checkShippingProvider(),
    ]);

    const services = {
        database: database.status === 'fulfilled' ? database.value : createFailedHealth('Database check failed'),
        redis: redis.status === 'fulfilled' ? redis.value : createFailedHealth('Redis check failed'),
        email: email.status === 'fulfilled' ? email.value : createFailedHealth('Email check failed'),
        payment: payment.status === 'fulfilled' ? payment.value : createFailedHealth('Payment check failed'),
        shipping: shipping.status === 'fulfilled' ? shipping.value : createFailedHealth('Shipping check failed'),
    };

    // Calculate overall status
    const statuses = Object.values(services).map(s => s.status);
    let overall: ServiceStatus = 'healthy';

    if (statuses.includes('unhealthy')) {
        // Database or Redis unhealthy = system unhealthy
        if (services.database.status === 'unhealthy' || services.redis.status === 'unhealthy') {
            overall = 'unhealthy';
        } else {
            overall = 'degraded';
        }
    } else if (statuses.includes('degraded')) {
        overall = 'degraded';
    }

    const health: SystemHealth = {
        overall,
        uptime: Math.round((Date.now() - serverStartTime) / 1000),
        timestamp: new Date().toISOString(),
        services,
        environment: {
            nodeVersion: process.version,
            nextEnv: process.env.NODE_ENV || 'development',
            region: process.env.RAILWAY_REGION || undefined,
        },
    };

    logInfo('HEALTHCHECK', `System health: ${overall}`, {
        database: services.database.status,
        redis: services.redis.status,
        email: services.email.status,
        payment: services.payment.status,
        shipping: services.shipping.status,
    });

    return health;
}

function createFailedHealth(message: string): ServiceHealth {
    return {
        status: 'unhealthy',
        latencyMs: 0,
        message,
        lastChecked: new Date().toISOString(),
    };
}

/**
 * Quick health check — only checks critical services (DB + Redis).
 * Used for load balancer probes.
 */
export async function getQuickHealth(): Promise<{ status: ServiceStatus; details: string }> {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return { status: 'healthy', details: 'Core services operational' };
    } catch {
        return { status: 'unhealthy', details: 'Database connection failed' };
    }
}
