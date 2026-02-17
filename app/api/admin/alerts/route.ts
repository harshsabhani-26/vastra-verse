import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
    getAlerts,
    getAlertSummary,
    resolveAlert,
    resolveAlertsByType,
    runBusinessAlertChecks,
} from '@/lib/system-alerts';

/**
 * GET /api/admin/alerts
 * 
 * Fetch system alerts with optional filters.
 * Query params: resolved, type, severity, limit, offset, action=summary|check
 */
export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    try {
        // Special action: get alert summary for dashboard cards
        if (action === 'summary') {
            const summary = await getAlertSummary();
            return NextResponse.json(summary);
        }

        // Special action: run business alert checks on demand
        if (action === 'check') {
            const results = await runBusinessAlertChecks();
            return NextResponse.json({ checked: true, results });
        }

        // Default: fetch alerts with filters
        const resolved = searchParams.get('resolved');
        const type = searchParams.get('type') || undefined;
        const severity = searchParams.get('severity') || undefined;
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        const data = await getAlerts({
            resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
            type,
            severity,
            limit,
            offset,
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to fetch alerts:', error);
        return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
    }
}

/**
 * POST /api/admin/alerts
 * 
 * Resolve alerts.
 * Body: { alertId, resolvedBy } or { type, resolvedBy }
 */
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { alertId, type, resolvedBy } = body;

        if (alertId) {
            const result = await resolveAlert(alertId, resolvedBy || session.user.id);
            return NextResponse.json({ success: true, alert: result });
        }

        if (type) {
            const result = await resolveAlertsByType(type, resolvedBy || session.user.id);
            return NextResponse.json({ success: true, count: result.count });
        }

        return NextResponse.json({ error: 'alertId or type required' }, { status: 400 });
    } catch (error) {
        console.error('Failed to resolve alert:', error);
        return NextResponse.json({ error: 'Failed to resolve alert' }, { status: 500 });
    }
}
