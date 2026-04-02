import { NextRequest, NextResponse } from "next/server";
import { findShipmentByAwb } from "@/lib/shipment-service";
import { getTrackingData } from "@/lib/shiprocket/tracking";

/**
 * GET /api/tracking/[awb]
 * 
 * Public tracking API
 * Allows customers to track their shipment without logging in
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ awb: string }> }
) {
    try {
        const { awb } = await params;

        if (!awb || awb.length < 10) {
            return NextResponse.json(
                { error: "Invalid AWB number" },
                { status: 400 }
            );
        }

        // Find shipment in database
        const shipment = await findShipmentByAwb(awb);

        if (!shipment) {
            return NextResponse.json(
                { error: "Shipment not found" },
                { status: 404 }
            );
        }

        // Fetch live tracking data from Shiprocket
        let liveTracking = null;
        try {
            const trackingData = await getTrackingData(awb);
            liveTracking = {
                currentStatus: trackingData.currentStatus,
                currentLocation: trackingData.currentLocation,
                expectedDeliveryDate: trackingData.expectedDeliveryDate,
                deliveryDate: trackingData.deliveryDate,
                events: trackingData.events,
            };
        } catch (error) {
            console.error("[Tracking] Failed to fetch live data:", error);
            // Continue with database data
        }

        // Return sanitized data (no sensitive order details)
        return NextResponse.json({
            awb: shipment.awbNumber,
            courierName: shipment.courierName,
            status: shipment.status,
            isReturn: shipment.isReturn,
            pickupScheduledAt: shipment.pickupScheduledAt,
            shippedAt: shipment.shippedAt,
            deliveredAt: shipment.deliveredAt,
            estimatedDeliveryAt: shipment.estimatedDeliveryAt,
            trackingUrl: shipment.trackingUrl,
            trackingData: shipment.trackingData,
            liveTracking,
        });

    } catch (error: any) {
        console.error("[Tracking] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch tracking information" },
            { status: 500 }
        );
    }
}
