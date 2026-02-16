import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { trackShipment } from "@/lib/shipping-provider";
import { updateShipmentStatus } from "@/lib/shipment-service";
import { ShipmentStatus } from "@prisma/client";

/**
 * Cron Job: Sync Tracking Status (Fallback Polling)
 * 
 * Endpoint: /api/cron/tracking-sync
 * Schedule: Every 30 minutes (recommended)
 * 
 * Polls Shiprocket API for shipments that haven't been updated via webhook.
 * This provides resilience against missed webhooks.
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

        console.log("[Cron] Starting tracking sync...");

        // Get all active shipments (not delivered/cancelled)
        const activeShipments = await prisma.shipment.findMany({
            where: {
                status: {
                    notIn: ["DELIVERED", "CANCELLED", "FAILED", "RETURN_DELIVERED"]
                },
                awbNumber: {
                    not: null
                }
            },
            select: {
                id: true,
                awbNumber: true,
                status: true
            }
        });

        console.log(`[Cron] Found ${activeShipments.length} active shipments to sync`);

        let updated = 0;
        let failed = 0;

        // Status mapping
        const statusMap: Record<string, ShipmentStatus> = {
            "PICKUP SCHEDULED": "PICKUP_SCHEDULED",
            "PICKUP BOOKED": "PICKUP_SCHEDULED",
            "OUT FOR PICKUP": "PICKUP_SCHEDULED",
            "SHIPPED": "IN_TRANSIT",
            "IN TRANSIT": "IN_TRANSIT",
            "REACHED AT DESTINATION HUB": "IN_TRANSIT",
            "OUT FOR DELIVERY": "OUT_FOR_DELIVERY",
            "DELIVERED": "DELIVERED",
            "RTO INITIATED": "RETURN_INITIATED",
            "RTO IN TRANSIT": "RETURN_INITIATED",
            "RTO DELIVERED": "RETURN_DELIVERED",
            "CANCELLED": "CANCELLED",
            "LOST": "FAILED"
        };

        // Sync each shipment (with rate limiting)
        for (const shipment of activeShipments) {
            try {
                if (!shipment.awbNumber) continue;

                // Track via Shiprocket API
                const trackingData = await trackShipment(shipment.awbNumber);

                if (!trackingData || !trackingData.tracking_data) {
                    continue;
                }

                const shiprocketStatus = trackingData.tracking_data.shipment_status;
                const mappedStatus = statusMap[shiprocketStatus?.toUpperCase()];

                if (mappedStatus && mappedStatus !== shipment.status) {
                    // Update status
                    await updateShipmentStatus(
                        shipment.id,
                        mappedStatus,
                        {
                            trackingData: trackingData,
                            deliveredAt: mappedStatus === "DELIVERED" ? new Date() : undefined
                        },
                        `Cron sync: Status updated to ${mappedStatus}`
                    );
                    updated++;
                }

                // Add small delay to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error: any) {
                console.error(`[Cron] Failed to sync ${shipment.awbNumber}:`, error.message);
                failed++;
            }
        }

        console.log(`[Cron] Tracking sync complete: ${updated} updated, ${failed} failed`);

        return NextResponse.json({
            success: true,
            total: activeShipments.length,
            updated,
            failed,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("[Cron] Error in tracking sync:", error);
        return NextResponse.json(
            {
                error: "Failed to sync tracking",
                message: error.message
            },
            { status: 500 }
        );
    }
}
