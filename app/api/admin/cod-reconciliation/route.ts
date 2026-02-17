import { NextRequest, NextResponse } from "next/server";
import { checkUserRateLimit } from '@/lib/rate-limit';
import { generateDailyReconciliationReport } from "@/services/finance/cod-reconciliation";

/**
 * API Endpoint: Daily COD Reconciliation Report
 * 
 * GET /api/admin/cod-reconciliation
 * 
 * Generates a comprehensive daily COD reconciliation report showing:
 * - Total COD collected
 * - Settled amounts
 * - Pending settlements
 * - Discrepancies
 */
export async function GET(req: NextRequest) {
    try {
        // SECURITY: Rate limiting (30 req/min for admin)
        const rateLimitResult = await checkUserRateLimit(req, 'admin');
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult;
        }

        // Get date from query params (default: today)
        const { searchParams } = new URL(req.url);
        const dateParam = searchParams.get("date");
        const reportDate = dateParam ? new Date(dateParam) : new Date();

        const report = await generateDailyReconciliationReport(reportDate);

        return NextResponse.json({
            success: true,
            report
        });

    } catch (error: any) {
        console.error("[API] Error generating COD reconciliation report:", error);
        return NextResponse.json(
            {
                error: "Failed to generate report",
                message: error.message
            },
            { status: 500 }
        );
    }
}
