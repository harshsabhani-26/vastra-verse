import prisma from "@/lib/prisma";
import { getActiveShipments, updateShipmentStatus, updateShipmentCosts } from "@/lib/shipment-service";
import { trackShipment } from "@/lib/shipping-provider";
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
                        // TODO: Send notification to admin
                    }
                }

                // 4. Fetch latest tracking info from Shiprocket
                const trackingData = await trackShipment(shipment.awbNumber);
                const trackStatus = trackingData.tracking_data.shipment_track[0];

                if (!trackStatus) {
                    continue;
                }

                // 5. Map status
                const currentStatus = trackStatus.current_status;

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

                const mappedStatus = statusMap[currentStatus.toUpperCase()];

                if (mappedStatus && mappedStatus !== shipment.status) {
                    // Update status
                    await updateShipmentStatus(
                        shipment.id,
                        mappedStatus,
                        {
                            trackingData: trackStatus as any
                        },
                        `Batch Sync: Status updated to ${mappedStatus}`
                    );

                    console.log(`[Sync] Updated ${shipment.awbNumber}: ${shipment.status} -> ${mappedStatus}`);
                    updatedCount++;
                }

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
