import { NextRequest, NextResponse } from "next/server";
import { getCourierRankings } from "@/services/shipping/courier-updater";

/**
 * API Endpoint: Courier Performance Rankings
 * 
 * GET /api/admin/courier-performance
 * 
 * Returns current courier performance rankings based on:
 * - Score (composite)
 * - Success rate
 * - Average delivery time
 * - RTO rate
 */
export async function GET(req: NextRequest) {
    try {
        const rankings = await getCourierRankings();

        return NextResponse.json({
            success: true,
            rankings
        });

    } catch (error: any) {
        console.error("[API] Error fetching courier rankings:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch rankings",
                message: error.message
            },
            { status: 500 }
        );
    }
}
