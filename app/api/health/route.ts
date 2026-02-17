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
 * Quick check: GET /api/health?quick=true
 */

import { NextRequest, NextResponse } from "next/server";
import { getSystemHealth, getQuickHealth } from "@/lib/healthcheck";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const isQuick = req.nextUrl.searchParams.get('quick') === 'true';

        if (isQuick) {
            const health = await getQuickHealth();
            return NextResponse.json(health, {
                status: health.status === 'healthy' ? 200 : 503,
            });
        }

        const health = await getSystemHealth();

        return NextResponse.json(health, {
            status: health.overall === 'healthy' ? 200 : health.overall === 'degraded' ? 200 : 503,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
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
