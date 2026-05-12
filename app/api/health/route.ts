/**
 * Enhanced Health Check API Endpoint
 * 
 * Provides comprehensive system health status:
 * - Database connection
 * - Redis connection
 * - Email provider
 * - Payment gateway
 * - Shipping provider
 * 
 * Access: GET /api/health
 * Quick check: GET /api/health?quick=true  (bypasses cache — used by Render health checks)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSystemHealth, getQuickHealth } from "@/lib/healthcheck";
import { cache } from "@/lib/cache";

export const dynamic = 'force-dynamic';

const HEALTH_CACHE_KEY = 'system:health:full';
const HEALTH_CACHE_TTL = 30; // 30 seconds — reduces external API calls from monitoring tools

export async function GET(req: NextRequest) {
    try {
        const isQuick = req.nextUrl.searchParams.get('quick') === 'true';

        if (isQuick) {
            // Quick path: no cache — Render health checker needs real-time status
            const health = await getQuickHealth();
            return NextResponse.json(health, {
                status: health.status === 'healthy' ? 200 : 503,
            });
        }

        // Full health check: cache for 30 seconds to reduce pressure on external services
        const health = await cache.getOrSet(HEALTH_CACHE_KEY, () => getSystemHealth(), HEALTH_CACHE_TTL);

        return NextResponse.json(health, {
            status: health.overall === 'healthy' ? 200 : health.overall === 'degraded' ? 200 : 503,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'X-Health-Cached': 'true',
            },
        });
    } catch (error) {
        return NextResponse.json({
            overall: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Health check failed',
        }, { status: 503 });
    }
}
