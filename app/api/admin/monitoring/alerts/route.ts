/**
 * Admin Monitoring Alerts API
 * 
 * GET: List alert configurations with recent history
 * POST: Create/update alert configuration
 * 
 * Access: Admin only
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
    getAlertConfigurations,
    getAlertHistory,
    upsertAlertConfig,
    resolveAlert,
    checkAlerts,
} from "@/lib/alert-service";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const type = req.nextUrl.searchParams.get('type');

        if (type === 'history') {
            const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
            const history = await getAlertHistory(limit);
            return NextResponse.json({ history });
        }

        if (type === 'check') {
            // Manually trigger alert checks
            const result = await checkAlerts();
            return NextResponse.json({ result });
        }

        const configurations = await getAlertConfigurations();
        return NextResponse.json({ configurations });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { action } = body;

        if (action === 'resolve') {
            const result = await resolveAlert(body.alertId, session.user.email || 'admin');
            return NextResponse.json({ result });
        }

        // Create/update alert configuration
        const config = await upsertAlertConfig({
            name: body.name,
            type: body.type,
            metric: body.metric,
            threshold: body.threshold,
            window: body.window,
            severity: body.severity,
            channels: body.channels,
            enabled: body.enabled,
            cooldown: body.cooldown,
        });

        return NextResponse.json({ config });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
    }
}
