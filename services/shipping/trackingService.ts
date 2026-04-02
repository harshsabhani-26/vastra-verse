/**
 * Tracking Service
 *
 * Syncs shipment tracking from Shiprocket and provides
 * cached public tracking for customer-facing views.
 *
 * All tracking updates use Prisma transactions.
 */

import prisma from "@/lib/prisma";
import { ShipmentStatus } from "@prisma/client";
import { getTrackingData } from "@/lib/shiprocket/tracking";
import type { TrackingResult } from "@/lib/shiprocket/tracking";
import { cache } from "@/lib/cache";
import { updateShipmentStatus } from "@/lib/shipment-service";
import { logInfo, logError } from "@/lib/logger";
import type { TrackingEvent } from "@/types/shipping";

// ─── Cache Config ───────────────────────────────────────────────────────────

const TRACKING_CACHE_TTL = 300; // 5 minutes
const TRACKING_CACHE_PREFIX = "tracking";

function trackingCacheKey(awbNumber: string): string {
    return `${TRACKING_CACHE_PREFIX}:${awbNumber}`;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PublicTrackingData {
    awbNumber: string;
    status: string;
    currentLocation: string | null;
    expectedDeliveryDate: string | null;
    deliveryDate: string | null;
    events: TrackingEvent[];
    carrier: string;
    courierName: string | null;
    trackUrl: string | null;
    updatedAt: string;
}

// ─── Shiprocket Status → ShipmentStatus Mapping ────────────────────────────

const SHIPROCKET_STATUS_MAP: Record<string, ShipmentStatus> = {
    // Shiprocket sr-status / current_status strings → our enum
    "NEW": "PENDING",
    "AWB Assigned": "READY_TO_SHIP",
    "Label Generated": "LABEL_GENERATED",
    "Pickup Scheduled": "PICKUP_SCHEDULED",
    "Pickup Queued": "PICKUP_SCHEDULED",
    "Pickup Generated": "PICKUP_SCHEDULED",
    "PICKED UP": "PICKED_UP",
    "Picked Up": "PICKED_UP",
    "In Transit": "IN_TRANSIT",
    "SHIPPED": "IN_TRANSIT",
    "Shipped": "IN_TRANSIT",
    "Reached at Destination Hub": "IN_TRANSIT",
    "Out for Delivery": "OUT_FOR_DELIVERY",
    "OUT FOR DELIVERY": "OUT_FOR_DELIVERY",
    "DELIVERED": "DELIVERED",
    "Delivered": "DELIVERED",
    "UNDELIVERED": "DELIVERY_ATTEMPTED",
    "Undelivered": "DELIVERY_ATTEMPTED",
    "NDR": "DELIVERY_ATTEMPTED",
    "RTO Initiated": "RTO_INITIATED",
    "RTO_INITIATED": "RTO_INITIATED",
    "RTO In Transit": "RTO_INITIATED",
    "RTO Delivered": "RTO_DELIVERED",
    "RTO_DELIVERED": "RTO_DELIVERED",
    "CANCELED": "CANCELLED",
    "Canceled": "CANCELLED",
    "Cancelled": "CANCELLED",
    "CANCELLED": "CANCELLED",
    "Lost": "EXCEPTION",
    "Damaged": "EXCEPTION",
};

function mapShiprocketStatus(shiprocketStatus: string): ShipmentStatus {
    return SHIPROCKET_STATUS_MAP[shiprocketStatus] || "IN_TRANSIT";
}

// ─── Sync Tracking ──────────────────────────────────────────────────────────

/**
 * Sync tracking data from Shiprocket for a given AWB number.
 *
 * Fetches latest tracking from Shiprocket API, maps the status to our
 * ShipmentStatus enum, and updates the shipment record + order timeline
 * via Prisma transaction.
 *
 * @param awbNumber - AWB / tracking number
 * @returns Updated tracking data
 */
export async function syncTracking(awbNumber: string): Promise<TrackingResult> {
    logInfo("TRACKING_SERVICE", "Syncing tracking data", { awbNumber });

    // 1. Fetch from Shiprocket
    const trackingData = await getTrackingData(awbNumber);

    // 2. Find our shipment record
    const shipment = await prisma.shipment.findFirst({
        where: {
            OR: [
                { awbNumber: awbNumber },
                { shiprocketOrderId: awbNumber },
            ],
        },
    });

    if (!shipment) {
        logError("TRACKING_SERVICE", new Error("Shipment not found for AWB"), { awbNumber });
        throw new Error(`No shipment found for AWB: ${awbNumber}`);
    }

    // 3. Map Shiprocket status to our ShipmentStatus
    const newStatus = mapShiprocketStatus(trackingData.currentStatus);

    // 4. Update shipment if status changed
    if (newStatus !== shipment.status) {
        await updateShipmentStatus(
            shipment.id,
            newStatus,
            {
                trackingData: trackingData.events as any,
                deliveredAt: newStatus === "DELIVERED" ? new Date() : undefined,
                estimatedDeliveryAt: trackingData.expectedDeliveryDate
                    ? new Date(trackingData.expectedDeliveryDate)
                    : undefined,
            },
            `Tracking update: ${trackingData.currentStatus} at ${trackingData.currentLocation || "unknown"}`
        );

        logInfo("TRACKING_SERVICE", "Shipment status updated", {
            awbNumber,
            oldStatus: shipment.status,
            newStatus,
        });
    } else {
        // Still update tracking data even if status hasn't changed
        await prisma.shipment.update({
            where: { id: shipment.id },
            data: {
                trackingData: trackingData.events as any,
                estimatedDeliveryAt: trackingData.expectedDeliveryDate
                    ? new Date(trackingData.expectedDeliveryDate)
                    : undefined,
            },
        });
    }

    // 5. Invalidate tracking cache
    await cache.del(trackingCacheKey(awbNumber)).catch(() => { });

    return trackingData;
}

// ─── Public Tracking ────────────────────────────────────────────────────────

/**
 * Get tracking data for public/customer-facing display.
 *
 * Cached in Redis for 5 minutes to reduce API calls and DB load.
 *
 * @param awbNumber - AWB / tracking number
 * @returns Sanitised tracking data for customer display
 */
export async function getPublicTracking(
    awbNumber: string
): Promise<PublicTrackingData> {
    // 1. Check cache
    const cacheKey = trackingCacheKey(awbNumber);
    const cached = await cache.get<PublicTrackingData>(cacheKey);
    if (cached) {
        logInfo("TRACKING_SERVICE", "Public tracking cache hit", { awbNumber });
        return cached;
    }

    // 2. Load from DB first (faster than API)
    const shipment = await prisma.shipment.findFirst({
        where: {
            OR: [
                { awbNumber: awbNumber },
                { shiprocketOrderId: awbNumber },
            ],
        },
        select: {
            status: true,
            carrier: true,
            courierName: true,
            trackingData: true,
            trackingUrl: true,
            estimatedDeliveryAt: true,
            deliveredAt: true,
            updatedAt: true,
            shiprocketOrderId: true,
            awbNumber: true,
        },
    });

    if (!shipment) {
        throw new Error(`No shipment found for AWB: ${awbNumber}`);
    }

    // 3. Build public-facing data
    const events: TrackingEvent[] = Array.isArray(shipment.trackingData)
        ? (shipment.trackingData as unknown as TrackingEvent[])
        : [];

    const result: PublicTrackingData = {
        awbNumber: shipment.awbNumber || awbNumber,
        status: shipment.status,
        currentLocation: events[0]?.location || null,
        expectedDeliveryDate: shipment.estimatedDeliveryAt?.toISOString() || null,
        deliveryDate: shipment.deliveredAt?.toISOString() || null,
        events,
        carrier: shipment.carrier || "SHIPROCKET",
        courierName: shipment.courierName || null,
        trackUrl: shipment.trackingUrl || null,
        updatedAt: shipment.updatedAt.toISOString(),
    };

    // 4. Cache the result
    cache.set(cacheKey, result, TRACKING_CACHE_TTL).catch(() => { });

    return result;
}
