import { NextRequest, NextResponse } from "next/server";
import { updateCourierPerformanceMetrics } from "@/services/shipping/courier-updater";

/**
 * Cron Job: Update Courier Performance Metrics
 * 
 * Endpoint: /api/cron/courier-perf
 * Schedule: Daily (recommended)
 * 
 * Calculates and updates courier performance scores based on recent shipments.
 * This enables data-driven courier selection.
 * 
 * Security: Should be protected by cron secret or IP whitelist in production
 */
export async function GET(req: NextRequest) {
    try {
        // Verify cron secret
        const authHeader = req.headers.get("authorization");
        const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

        if (process.env.NODE_ENV === "production" && authHeader !== expectedAuth) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        console.log("[Cron] Starting courier performance update...");

        // Update metrics for last 30 days
        const result = await updateCourierPerformanceMetrics({
            lookbackDays: 30
        });

        console.log(`[Cron] Courier performance updated: ${result.updated} updated, ${result.created} created`);

        return NextResponse.json({
            success: true,
            updated: result.updated,
            created: result.created,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("[Cron] Error updating courier performance:", error);
        return NextResponse.json(
            {
                error: "Failed to update courier performance",
                message: error.message
            },
            { status: 500 }
        );
    }
}
