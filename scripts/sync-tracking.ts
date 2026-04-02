import prisma from "@/lib/prisma";
import { getActiveShipments, updateShipmentStatus } from "@/lib/shipment-service";
import { getTrackingData } from "@/lib/shiprocket/tracking";
import { ShipmentStatus } from "@prisma/client";

/**
 * Background job to sync tracking status for all active shipments
 * Should be run via cron every 30-60 minutes
 */
async function syncTracking() {
    console.log("[Sync] Starting tracking sync job...");

    try {
        // 1. Get all active shipments (not delivered/cancelled)
        const activeShipments = await getActiveShipments();
        console.log(`[Sync] Found ${activeShipments.length} active shipments`);

        let updatedCount = 0;
        let errorCount = 0;
        let slaViolations = 0;

        // Shiprocket status mapping
        const statusMap: Record<string, ShipmentStatus> = {
            "AWB Assigned": "READY_TO_SHIP",
            "Pickup Scheduled": "PICKUP_SCHEDULED",
            "Picked Up": "PICKED_UP",
            "In Transit": "IN_TRANSIT",
            "Shipped": "IN_TRANSIT",
            "Out for Delivery": "OUT_FOR_DELIVERY",
            "Delivered": "DELIVERED",
            "Undelivered": "NDR_RAISED",
            "RTO Initiated": "RTO_INITIATED",
            "RTO In Transit": "RTO_IN_TRANSIT",
            "RTO Delivered": "RTO_DELIVERED",
            "Canceled": "CANCELLED",
            "Cancelled": "CANCELLED",
        };

        // 2. Process each shipment
        for (const shipment of activeShipments) {
            try {
                if (!shipment.awbNumber) {
                    continue;
                }

                // 3. Check SLA violations
                if (shipment.estimatedDeliveryAt && shipment.status !== "DELIVERED") {
                    const now = new Date();
                    if (now > shipment.estimatedDeliveryAt) {
                        console.warn(`[Sync] ⚠️ SLA VIOLATION: Shipment ${shipment.awbNumber} is delayed`);
                        slaViolations++;
                    }
                }

                // 4. Fetch latest tracking info from Shiprocket
                const trackingData = await getTrackingData(shipment.awbNumber);

                if (!trackingData) {
                    continue;
                }

                // 5. Map status
                const currentStatus = trackingData.currentStatus;
                const mappedStatus = statusMap[currentStatus];

                if (mappedStatus && mappedStatus !== shipment.status) {
                    // Update status
                    await updateShipmentStatus(
                        shipment.id,
                        mappedStatus,
                        {
                            trackingData: trackingData.raw as any,
                            deliveredAt: mappedStatus === "DELIVERED" ? new Date() : undefined,
                        },
                        `Batch Sync: Status updated to ${mappedStatus}`
                    );

                    console.log(`[Sync] Updated ${shipment.awbNumber}: ${shipment.status} -> ${mappedStatus}`);
                    updatedCount++;
                }

                // Small delay to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (err) {
                console.error(`[Sync] Error processing shipment ${shipment.id}:`, err);
                errorCount++;
            }
        }

        console.log(`[Sync] Job completed. Updated: ${updatedCount}, Errors: ${errorCount}, SLA Violations: ${slaViolations}`);

    } catch (error) {
        console.error("[Sync] Job failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

// Execute if run directly
if (require.main === module) {
    syncTracking()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export { syncTracking };
