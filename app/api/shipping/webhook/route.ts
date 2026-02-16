import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { updateShipmentStatus, updateShipmentCosts, findShipmentByAwb } from "@/lib/shipment-service";
import { ShipmentStatus } from "@prisma/client";

/**
 * POST /api/shipping/webhook
 * 
 * Shiprocket Webhook Handler
 * Handles tracking updates and status changes
 * 
 * Security: Verifies x-api-key header
 * Idempotent: Safe to receive same event multiple times
 */
export async function POST(req: NextRequest) {
    try {
        // 1. Verify webhook signature
        const webhookSecret = process.env.SHIPROCKET_WEBHOOK_SECRET;
        const apiKey = req.headers.get("x-api-key");

        if (!webhookSecret) {
            console.error("[Webhook] SHIPROCKET_WEBHOOK_SECRET not configured");
            return NextResponse.json({ received: true }); // Return 200 to avoid retries
        }

        if (apiKey !== webhookSecret) {
            console.error("[Webhook] Invalid x-api-key");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // 2. Parse webhook payload
        const payload = await req.json();
        console.log("[Webhook] Received event:", payload);

        const {
            awb,
            current_status,
            shipment_status,
            delivered_date,
            edd,
            courier_name,
            scans
        } = payload;

        if (!awb) {
            console.error("[Webhook] Missing AWB in payload");
            return NextResponse.json({ received: true });
        }

        // 3. Find shipment by AWB
        const shipment = await findShipmentByAwb(awb);

        if (!shipment) {
            console.log("[Webhook] Shipment not found for AWB:", awb);
            return NextResponse.json({ received: true });
        }

        // 5. Map Shiprocket status to our ShipmentStatus enum
        const statusMap: Record<string, ShipmentStatus> = {
            "Shipment Pickup Scheduled": "PICKUP_SCHEDULED",
            "Pickup Scheduled": "PICKUP_SCHEDULED",
            "Shipped": "IN_TRANSIT",
            "In Transit": "IN_TRANSIT",
            "Out for Delivery": "OUT_FOR_DELIVERY",
            "Delivered": "DELIVERED",
            "RTO Initiated": "RETURN_INITIATED",
            "RTO In Transit": "RETURN_INITIATED",
            "RTO Delivered": "RETURN_DELIVERED",
            "Cancelled": "CANCELLED",
            "Failed": "FAILED"
        };

        const incomingStatus = current_status || shipment_status;
        const mappedStatus = statusMap[incomingStatus];

        if (!mappedStatus) {
            console.log("[Webhook] Unknown status:", incomingStatus);
            return NextResponse.json({ received: true });
        }

        // 6. Update shipment status (Service handles forward-only check)
        const updateData: any = {};

        // Update estimated delivery
        if (edd) {
            updateData.estimatedDeliveryAt = new Date(edd);
        }

        // Store tracking timeline
        if (scans && scans.length > 0) {
            updateData.trackingData = { scans, lastUpdated: new Date() };
        }

        await updateShipmentStatus(
            shipment.id,
            mappedStatus,
            updateData,
            `${incomingStatus}${courier_name ? ` via ${courier_name}` : ""}`
        );

        // 7. Update Financial & Weight Data (if present)
        // Shipsocket often sends 'freight_charges' etc. in payload
        const {
            freight_charges,
            applied_weight,
            volumetric_weight,
            cod_amount
        } = payload;

        if (freight_charges || applied_weight || volumetric_weight || cod_amount) {
            await updateShipmentCosts(shipment.id, {
                shippingCost: freight_charges ? parseFloat(freight_charges) : undefined,
                weight: applied_weight ? parseFloat(applied_weight) : undefined,
                volumetricWeight: volumetric_weight ? parseFloat(volumetric_weight) : undefined,
                codRemittance: cod_amount ? parseFloat(cod_amount) : undefined
            });
            console.log("[Webhook] Updated shipment costs/weights for", awb);
        }

        console.log("[Webhook] ✅ Shipment processed:", {
            awb,
            status: mappedStatus,
            orderId: shipment.orderId
        });

        // 8. Return 200 OK immediately
        return NextResponse.json({ received: true });

    } catch (error) {
        console.error("[Webhook] Error processing webhook:", error);
        return NextResponse.json({ received: true });
    }
}
