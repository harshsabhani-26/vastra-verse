import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { updateShipmentStatus } from "@/lib/shipment-service";
import { ShipmentStatus } from "@prisma/client";

/**
 * Verify Shiprocket Webhook Signature
 */
function verifySignature(payload: string, signature: string, secret: string) {
    const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("base64");
    return generatedSignature === signature;
}

export async function POST(req: NextRequest) {
    try {
        const bodyText = await req.text();
        const signature = req.headers.get("x-shiprocket-signature");
        const secret = process.env.SHIPROCKET_WEBHOOK_SECRET;

        // 1. Security Check
        if (secret && signature) {
            if (!verifySignature(bodyText, signature, secret)) {
                console.error("[Webhook] Invalid signature");
                return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
            }
        } else if (process.env.NODE_ENV === "production") {
            console.warn("[Webhook] Missing secret/signature in production");
            // In strict mode we might want to reject, but for now log warning
        }

        const body = JSON.parse(bodyText);
        console.log("[Webhook] Received event:", body.current_status || "Unknown");

        // 2. Extract Data
        const awb = body.awb;
        const currentStatus = body.current_status;
        const shipmentId = body.shipment_id;

        if (!awb) {
            return NextResponse.json({ message: "No AWB in payload" }, { status: 200 }); // Respond 200 to acknowledge
        }

        // 3. Find Shipment
        const shipment = await prisma.shipment.findUnique({
            where: { awbNumber: awb },
            include: { order: true }
        });

        if (!shipment) {
            console.warn(`[Webhook] Shipment not found for AWB: ${awb}`);
            return NextResponse.json({ message: "Shipment not found" }, { status: 200 });
        }

        // 4. Map Status
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

        // Shiprocket sends raw status strings, uppercase or mixed
        const mappedStatus = statusMap[currentStatus?.toUpperCase()];

        if (!mappedStatus) {
            console.log(`[Webhook] Unmapped status: ${currentStatus}`);
            return NextResponse.json({ message: "Status ignored" }, { status: 200 });
        }

        // 5. Update Status (Idempotency & Monotonicity handled in service)
        await updateShipmentStatus(
            shipment.id,
            mappedStatus,
            {
                trackingData: body, // Store full payload
                deliveredAt: mappedStatus === "DELIVERED" ? new Date() : undefined
            },
            `Webhook: Status updated to ${mappedStatus}`
        );

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("[Webhook] Error processing:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
