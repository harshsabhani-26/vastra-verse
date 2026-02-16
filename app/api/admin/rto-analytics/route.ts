import { NextRequest, NextResponse } from "next/server";
import { getRTOAnalytics } from "@/services/shipping/rto-management";

/**
 * API Endpoint: RTO Analytics Dashboard
 * 
 * GET /api/admin/rto-analytics
 * 
 * Provides comprehensive RTO statistics:
 * - Total RTO count and rate
 * - Financial losses
 * - Average return time
 * - Top RTO reasons
 */
export async function GET(req: NextRequest) {
    try {
        // Get date range from query params
        const { searchParams } = new URL(req.url);
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");

        const startDate = startDateParam ? new Date(startDateParam) : undefined;
        const endDate = endDateParam ? new Date(endDateParam) : undefined;

        const analytics = await getRTOAnalytics(startDate, endDate);

        return NextResponse.json({
            success: true,
            analytics
        });

    } catch (error: any) {
        console.error("[API] Error generating RTO analytics:", error);
        return NextResponse.json(
            {
                error: "Failed to generate analytics",
                message: error.message
            },
            { status: 500 }
        );
    }
}
