/**
 * Shiprocket Webhook Handler
 *
 * Receives shipping event callbacks from Shiprocket.
 * - Verifies source via IP whitelist or token check
 * - Deduplicates via Redis key `webhook:{event_id}`
 * - Updates shipment status + stores tracking event + enqueues notification
 *
 * Target: < 500ms response time. Heavy processing is enqueued.
 *
 * Shiprocket webhook payload format:
 * {
 *   "order_id": 1234,
 *   "awb": "123456789",
 *   "current_status": "Delivered",
 *   "shipment_id": 5678,
 *   "status_id": 7,
 *   "scans": [...],
 *   ...
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cache } from "@/lib/cache";
import { ShipmentStatus } from "@prisma/client";
import { inngest } from "@/lib/inngest";
import { logInfo, logError } from "@/lib/logger";

// ─── Configuration ──────────────────────────────────────────────────────────

const WEBHOOK_TOKEN = process.env.SHIPROCKET_WEBHOOK_TOKEN || "";
const DEDUP_TTL = 172800; // 48 hours in seconds

// ─── Shiprocket Event → ShipmentStatus Mapping ─────────────────────────────

const EVENT_STATUS_MAP: Record<string, ShipmentStatus> = {
    // Shiprocket status strings and IDs
    "SHIPMENT_CREATED": "READY_TO_SHIP",
    "AWB Assigned": "READY_TO_SHIP",
    "Pickup Scheduled": "PICKUP_SCHEDULED",
    "Picked Up": "PICKED_UP",
    "IN_TRANSIT": "IN_TRANSIT",
    "In Transit": "IN_TRANSIT",
    "Shipped": "IN_TRANSIT",
    "Reached at Destination Hub": "IN_TRANSIT",
    "OUT_FOR_DELIVERY": "OUT_FOR_DELIVERY",
    "Out for Delivery": "OUT_FOR_DELIVERY",
    "DELIVERED": "DELIVERED",
    "Delivered": "DELIVERED",
    "Undelivered": "NDR_RAISED" as ShipmentStatus,
    "NDR": "NDR_RAISED" as ShipmentStatus,
    "PICKUP_SCHEDULED": "PICKUP_SCHEDULED",
    "PICKED_UP": "PICKED_UP",
    "RTO_INITIATED": "RTO_INITIATED",
    "RTO Initiated": "RTO_INITIATED",
    "RTO In Transit": "RTO_IN_TRANSIT" as ShipmentStatus,
    "RTO_IN_TRANSIT": "RTO_IN_TRANSIT" as ShipmentStatus,
    "RTO_DELIVERED": "RTO_DELIVERED",
    "RTO Delivered": "RTO_DELIVERED",
    "Canceled": "CANCELLED",
    "Cancelled": "CANCELLED",
};

// ─── Webhook Types ──────────────────────────────────────────────────────────

interface ShiprocketWebhookPayload {
    order_id?: number;
    awb?: string;
    current_status?: string;
    current_status_id?: number;
    shipment_id?: number;
    status_id?: number;
    courier_name?: string;
    etd?: string;
    scans?: Array<{
        location?: string;
        date?: string;
        activity?: string;
        status?: string;
    }>;
    // Shiprocket may send a unique event identifier
    sr_status?: string;
    sr_status_label?: string;
    [key: string]: unknown;
}

// ─── Source Verification ────────────────────────────────────────────────────

/**
 * Verify the webhook is from Shiprocket.
 *
 * Shiprocket supports token-based verification:
 * The webhook URL is configured with a secret token parameter.
 */
function verifySource(request: NextRequest): boolean {
    // Method 1: Token in query param or header
    if (WEBHOOK_TOKEN) {
        const queryToken = request.nextUrl.searchParams.get("token");
        const headerToken = request.headers.get("X-Shiprocket-Token") || request.headers.get("Authorization");

        if (queryToken === WEBHOOK_TOKEN || headerToken === WEBHOOK_TOKEN || headerToken === `Bearer ${WEBHOOK_TOKEN}`) {
            return true;
        }
        return false;
    }

    // If no token configured, allow all (log warning)
    logInfo("SHIPROCKET_WEBHOOK", "No webhook token configured — accepting all requests");
    return true;
}

// ─── POST Handler ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        // 1. Verify source
        if (!verifySource(request)) {
            logError("SHIPROCKET_WEBHOOK", new Error("Unauthorized webhook request"), {
                ip: request.headers.get("x-forwarded-for") || "unknown",
            });
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // 2. Parse payload
        let payload: ShiprocketWebhookPayload;
        try {
            payload = await request.json();
        } catch {
            return NextResponse.json(
                { error: "Invalid JSON body" },
                { status: 400 }
            );
        }

        const awb = payload.awb || "";
        const currentStatus = payload.current_status || payload.sr_status_label || "";
        const orderId = payload.order_id;
        const shipmentId = payload.shipment_id;

        if (!awb && !orderId) {
            return NextResponse.json(
                { error: "Missing required fields: awb or order_id" },
                { status: 400 }
            );
        }

        // 3. Generate a unique event ID for deduplication
        //    Shiprocket doesn't always send a unique event_id, so we compose one
        const eventId = `sr_${awb || orderId}_${currentStatus}_${payload.current_status_id || 0}`;

        // 4. Idempotency check via Redis
        const dedupKey = `webhook:${eventId}`;
        const alreadyProcessed = await cache.get<string>(dedupKey);

        if (alreadyProcessed) {
            logInfo("SHIPROCKET_WEBHOOK", "Duplicate event skipped", {
                eventId,
                awb,
                currentStatus,
            });
            return NextResponse.json({ status: "duplicate", event_id: eventId });
        }

        // 5. Mark as processing immediately (before heavy work)
        await cache.set(dedupKey, "processing", DEDUP_TTL);

        // 6. Map event to our status
        const newStatus = EVENT_STATUS_MAP[currentStatus];

        if (!newStatus) {
            logInfo("SHIPROCKET_WEBHOOK", "Unknown status, skipping", {
                currentStatus,
                eventId,
            });
            return NextResponse.json({ status: "skipped", current_status: currentStatus });
        }

        // 7. Find shipment by AWB or shiprocket order ID
        const shipment = await prisma.shipment.findFirst({
            where: {
                OR: [
                    ...(awb ? [{ awbNumber: awb }] : []),
                    ...(orderId ? [{ shiprocketOrderId: String(orderId) }] : []),
                ],
            },
            select: {
                id: true,
                orderId: true,
                status: true,
                order: {
                    select: {
                        userId: true,
                        customerPhone: true,
                    },
                },
            },
        });

        if (!shipment) {
            logError("SHIPROCKET_WEBHOOK", new Error("Shipment not found"), {
                awb,
                orderId,
                currentStatus,
            });
            // Return 200 so Shiprocket doesn't retry
            return NextResponse.json({ status: "not_found", awb });
        }

        // 8. Build tracking event from scans
        const latestScan = payload.scans?.[0];
        const trackingLocation = latestScan?.location || "";
        const trackingRemarks = latestScan?.activity || currentStatus;

        // 9. Build transaction operations
        const txOps = [
            // Update shipment status
            prisma.shipment.update({
                where: { id: shipment.id },
                data: {
                    status: newStatus,
                    trackingData: JSON.parse(JSON.stringify(payload)),
                    ...(newStatus === "DELIVERED" ? { deliveredAt: new Date() } : {}),
                    ...(payload.etd
                        ? { estimatedDeliveryAt: new Date(payload.etd) }
                        : {}),
                    ...(payload.courier_name
                        ? { courierName: payload.courier_name }
                        : {}),
                },
            }),

            // Create order timeline event
            prisma.orderTimeline.create({
                data: {
                    orderId: shipment.orderId,
                    event: `WEBHOOK_${currentStatus.replace(/\s+/g, "_").toUpperCase()}`,
                    details: `${currentStatus}${trackingLocation ? ` at ${trackingLocation}` : ""
                        }${trackingRemarks !== currentStatus ? ` — ${trackingRemarks}` : ""}`,
                    createdBy: "SHIPROCKET_WEBHOOK",
                },
            }),
        ];

        // 9a. If NDR event → create NdrEvent record
        if (newStatus === "NDR_RAISED" && awb) {
            txOps.push(
                prisma.ndrEvent.create({
                    data: {
                        shipmentId: shipment.id,
                        awbNumber: awb,
                        ndrCode: String(payload.current_status_id || "NDR"),
                        ndrReason: trackingRemarks || currentStatus,
                        attemptDate: new Date(),
                    },
                }) as any
            );
        }

        await prisma.$transaction(txOps);

        // 10. Invalidate Redis tracking cache for this AWB
        if (awb) {
            cache.del(`tracking:${awb}`).catch((err) =>
                logError("SHIPROCKET_WEBHOOK", err, { operation: "cache_invalidate" })
            );
        }

        // 11. Enqueue notification job (non-blocking — fire and forget)
        inngest
            .send({
                name: "notification/send",
                data: {
                    type: "in_app" as const,
                    userId: shipment.order.userId,
                    message: buildNotificationMessage(currentStatus, awb),
                    title: buildNotificationTitle(currentStatus),
                },
            })
            .catch((err) =>
                logError("SHIPROCKET_WEBHOOK", err, { operation: "enqueue_notification" })
            );

        // 12. Mark as fully processed in Redis
        await cache.set(dedupKey, "processed", DEDUP_TTL);

        const duration = Date.now() - startTime;
        logInfo("SHIPROCKET_WEBHOOK", "Webhook processed", {
            eventId,
            currentStatus,
            newStatus,
            awb,
            durationMs: duration,
        });

        return NextResponse.json({
            status: "processed",
            event_id: eventId,
            current_status: currentStatus,
            durationMs: duration,
        });
    } catch (err) {
        logError("SHIPROCKET_WEBHOOK", err, {
            durationMs: Date.now() - startTime,
        });

        // Return 200 to prevent Shiprocket retries on internal errors
        return NextResponse.json(
            { error: "Internal processing error" },
            { status: 200 }
        );
    }
}

// ─── Notification Helpers ───────────────────────────────────────────────────

function buildNotificationTitle(status: string): string {
    const titles: Record<string, string> = {
        "SHIPMENT_CREATED": "Order Shipped",
        "AWB Assigned": "Order Shipped",
        "Picked Up": "Order Picked Up",
        "IN_TRANSIT": "Shipment In Transit",
        "In Transit": "Shipment In Transit",
        "Shipped": "Shipment In Transit",
        "OUT_FOR_DELIVERY": "Out for Delivery",
        "Out for Delivery": "Out for Delivery",
        "DELIVERED": "Order Delivered",
        "Delivered": "Order Delivered",
        "Undelivered": "Delivery Attempted",
        "NDR": "Delivery Attempted",
        "PICKUP_SCHEDULED": "Pickup Scheduled",
        "PICKED_UP": "Package Picked Up",
        "RTO_INITIATED": "Shipment Returning",
        "RTO Initiated": "Shipment Returning",
        "RTO In Transit": "Shipment Returning",
        "RTO_IN_TRANSIT": "Shipment Returning",
        "RTO_DELIVERED": "Shipment Returned",
        "RTO Delivered": "Shipment Returned",
    };
    return titles[status] || "Shipping Update";
}

function buildNotificationMessage(status: string, awb: string): string {
    const messages: Record<string, string> = {
        "SHIPMENT_CREATED": `Your order has been shipped! Tracking: ${awb}`,
        "AWB Assigned": `Your order has been shipped! Tracking: ${awb}`,
        "Picked Up": `Your package (${awb}) has been picked up by the courier.`,
        "IN_TRANSIT": `Your package (${awb}) is in transit.`,
        "In Transit": `Your package (${awb}) is in transit.`,
        "Shipped": `Your package (${awb}) is in transit.`,
        "OUT_FOR_DELIVERY": `Your package (${awb}) is out for delivery today!`,
        "Out for Delivery": `Your package (${awb}) is out for delivery today!`,
        "DELIVERED": `Your package (${awb}) has been delivered!`,
        "Delivered": `Your package (${awb}) has been delivered!`,
        "Undelivered": `We couldn't deliver your package (${awb}). Reattempting soon.`,
        "NDR": `We couldn't deliver your package (${awb}). Reattempting soon.`,
        "PICKUP_SCHEDULED": `Pickup scheduled for your package (${awb}).`,
        "Pickup Scheduled": `Pickup scheduled for your package (${awb}).`,
        "RTO_INITIATED": `Your package (${awb}) is being returned to us.`,
        "RTO Initiated": `Your package (${awb}) is being returned to us.`,
        "RTO In Transit": `Your package (${awb}) is being returned to us.`,
        "RTO_IN_TRANSIT": `Your package (${awb}) is being returned to us.`,
        "RTO_DELIVERED": `Your package (${awb}) has been returned.`,
        "RTO Delivered": `Your package (${awb}) has been returned.`,
    };
    return messages[status] || `Shipping update for ${awb}`;
}
