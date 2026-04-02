/**
 * NDR (Non-Delivery Report) Service
 *
 * Handles:
 * - Syncing NDR events from Shiprocket tracking into the NdrEvent table
 * - Submitting NDR actions (re-attempt, RTO)
 *
 * Shiprocket handles NDRs through tracking status updates and the
 * /orders/update/ndr endpoint. Shiprocket exposes NDRs through
 * NDR list API — NDRs are detected via tracking status "Undelivered" / "NDR".
 *
 * All writes use Prisma transactions.
 */

import prisma from "@/lib/prisma";
import { ShipmentStatus } from "@prisma/client";
import { shiprocketPost } from "@/lib/shiprocket/client";
import { getTrackingData } from "@/lib/shiprocket/tracking";
import { logInfo, logError } from "@/lib/logger";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SyncNdrResult {
    synced: number;
    skipped: number;
    errors: number;
    total: number;
}

interface SubmitNdrResult {
    success: boolean;
    ndrEventId: string;
    awbNumber: string;
    action: string;
    message: string;
}

/** Shiprocket NDR action types */
type ShiprocketNdrAction = "re-attempt" | "return";

// ─── Fetch & Sync NDRs ─────────────────────────────────────────────────────

/**
 * Fetch all active shipments with DELIVERY_ATTEMPTED status and sync
 * their NDR events from Shiprocket tracking data.
 *
 * Since Shiprocket doesn't have a standalone NDR list API, this function:
 * 1. Queries local DB for shipments with DELIVERY_ATTEMPTED or OUT_FOR_DELIVERY status
 * 2. Fetches tracking from Shiprocket for each
 * 3. Detects "Undelivered" / "NDR" events and creates NdrEvent records
 *
 * Uses a Prisma transaction per NDR entry for atomicity.
 *
 * @returns Summary of sync operation
 */
export async function fetchAndSyncNdrs(): Promise<SyncNdrResult> {
    logInfo("NDR_SERVICE", "Starting NDR sync from Shiprocket tracking");

    const result: SyncNdrResult = {
        synced: 0,
        skipped: 0,
        errors: 0,
        total: 0,
    };

    // 1. Get shipments that might have NDR events
    const activeShipments = await prisma.shipment.findMany({
        where: {
            status: {
                in: [
                    "OUT_FOR_DELIVERY",
                    "DELIVERY_ATTEMPTED",
                    "IN_TRANSIT",
                ],
            },
            awbNumber: { not: null },
        },
        select: {
            id: true,
            awbNumber: true,
            orderId: true,
            status: true,
        },
    });

    result.total = activeShipments.length;

    if (activeShipments.length === 0) {
        logInfo("NDR_SERVICE", "No active shipments to check for NDRs");
        return result;
    }

    // 2. Check each shipment's tracking for NDR events
    for (const shipment of activeShipments) {
        if (!shipment.awbNumber) continue;

        try {
            await syncShipmentNdrs(shipment, result);
        } catch (err) {
            result.errors++;
            logError("NDR_SERVICE", err, {
                operation: "sync_shipment_ndrs",
                awbNumber: shipment.awbNumber,
            });
        }
    }

    logInfo("NDR_SERVICE", "NDR sync completed", {
        synced: result.synced,
        skipped: result.skipped,
        errors: result.errors,
        total: result.total,
    });

    return result;
}

/**
 * Check a single shipment's tracking data for NDR/undelivered events.
 */
async function syncShipmentNdrs(
    shipment: {
        id: string;
        awbNumber: string | null;
        orderId: string;
        status: ShipmentStatus;
    },
    result: SyncNdrResult
): Promise<void> {
    if (!shipment.awbNumber) return;

    const trackingData = await getTrackingData(shipment.awbNumber);

    // Look for "Undelivered" / "NDR" events in tracking activities
    const ndrEvents = trackingData.events.filter(
        (event) =>
            event.status.toLowerCase().includes("undelivered") ||
            event.status.toLowerCase().includes("ndr") ||
            event.activity.toLowerCase().includes("delivery failed") ||
            event.activity.toLowerCase().includes("delivery attempt")
    );

    if (ndrEvents.length === 0) {
        result.skipped++;
        return;
    }

    for (const ndrEvent of ndrEvents) {
        const attemptDate = new Date(ndrEvent.timestamp);

        // Check for duplicate
        const existingNdr = await prisma.ndrEvent.findFirst({
            where: {
                awbNumber: shipment.awbNumber,
                attemptDate: attemptDate,
                resolvedAt: null,
            },
        });

        if (existingNdr) {
            result.skipped++;
            continue;
        }

        // Determine NDR code and reason from tracking event
        const ndrCode = extractNdrCode(ndrEvent.statusCode || ndrEvent.status);
        const ndrReason = ndrEvent.activity || ndrEvent.remarks || ndrEvent.status;

        // Create NdrEvent in a transaction
        await prisma.$transaction(async (tx) => {
            await tx.ndrEvent.create({
                data: {
                    shipmentId: shipment.id,
                    awbNumber: shipment.awbNumber!,
                    ndrCode,
                    ndrReason,
                    attemptDate,
                },
            });

            // Update shipment status to DELIVERY_ATTEMPTED if not already
            if (
                shipment.status !== "DELIVERY_ATTEMPTED" &&
                shipment.status !== "RTO_INITIATED" &&
                shipment.status !== "RTO_DELIVERED"
            ) {
                await tx.shipment.update({
                    where: { id: shipment.id },
                    data: { status: "DELIVERY_ATTEMPTED" },
                });

                await tx.orderTimeline.create({
                    data: {
                        orderId: shipment.orderId,
                        event: "DELIVERY_ATTEMPTED",
                        details: `Delivery attempt failed: ${ndrReason} (Code: ${ndrCode})`,
                        createdBy: "SYSTEM",
                    },
                });
            }
        });

        result.synced++;
    }
}

// ─── Submit NDR Action ──────────────────────────────────────────────────────

/**
 * Submit an action for an NDR event via Shiprocket.
 *
 * Shiprocket supports two NDR actions:
 * - "re-attempt": Reattempt delivery
 * - "return": Initiate RTO
 *
 * @param ndrEventId - Internal NdrEvent ID
 * @param action     - Action to take ("re-attempt" or "return")
 * @param options    - Optional correction data
 * @returns Action submission result
 */
export async function submitNdrAction(
    ndrEventId: string,
    action: ShiprocketNdrAction,
    options?: {
        name?: string;
        phone?: string;
        address?: string;
        city?: string;
        pincode?: string;
        remarks?: string;
    }
): Promise<SubmitNdrResult> {
    logInfo("NDR_SERVICE", "Submitting NDR action", { ndrEventId, action });

    // 1. Load NDR event
    const ndrEvent = await prisma.ndrEvent.findUnique({
        where: { id: ndrEventId },
        include: {
            shipment: true,
        },
    });

    if (!ndrEvent) {
        throw new Error(`NDR event not found: ${ndrEventId}`);
    }

    if (ndrEvent.resolvedAt) {
        throw new Error(`NDR event already resolved: ${ndrEventId}`);
    }

    // 2. Submit to Shiprocket
    let shiprocketResponse: { status: number; message?: string } = { status: 0 };

    try {
        shiprocketResponse = await shiprocketPost<{ status: number; message?: string }>(
            `/orders/update/ndr`,
            {
                awb: ndrEvent.awbNumber,
                action,
                ...(action === "re-attempt" && options
                    ? {
                        name: options.name,
                        phone: options.phone,
                        address: options.address,
                        city: options.city,
                        pincode: options.pincode,
                        comments: options.remarks,
                    }
                    : {}),
            }
        );
    } catch (err) {
        logError("NDR_SERVICE", err, {
            operation: "shiprocket_ndr_action",
            awbNumber: ndrEvent.awbNumber,
            action,
        });
        throw new Error(`Failed to submit NDR action to Shiprocket: ${(err as Error).message}`);
    }

    // 3. Update local DB in transaction
    await prisma.$transaction(async (tx) => {
        await tx.ndrEvent.update({
            where: { id: ndrEventId },
            data: {
                actionTaken: action,
                actionDate: new Date(),
                adminNotes: options?.remarks || `Action submitted: ${action}`,
                resolvedAt: action === "return" ? new Date() : null,
            },
        });

        // Update shipment status based on action
        if (action === "return") {
            await tx.shipment.update({
                where: { id: ndrEvent.shipmentId },
                data: { status: "RTO_INITIATED" },
            });

            await tx.orderTimeline.create({
                data: {
                    orderId: ndrEvent.shipment.orderId,
                    event: "RTO_INITIATED",
                    details: `RTO initiated for AWB ${ndrEvent.awbNumber}. Reason: ${ndrEvent.ndrReason}`,
                    createdBy: "SYSTEM",
                },
            });
        } else {
            await tx.orderTimeline.create({
                data: {
                    orderId: ndrEvent.shipment.orderId,
                    event: "NDR_ACTION_SUBMITTED",
                    details: `NDR action "${action}" submitted for AWB ${ndrEvent.awbNumber}${options?.remarks ? `. Note: ${options.remarks}` : ""
                        }`,
                    createdBy: "SYSTEM",
                },
            });
        }
    });

    logInfo("NDR_SERVICE", "NDR action submitted successfully", {
        ndrEventId,
        action,
        awbNumber: ndrEvent.awbNumber,
    });

    return {
        success: shiprocketResponse.status === 1 || shiprocketResponse.status === 200,
        ndrEventId,
        awbNumber: ndrEvent.awbNumber,
        action,
        message: shiprocketResponse.message || "Action submitted",
    };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Extract a standardised NDR code from Shiprocket's tracking status.
 */
function extractNdrCode(statusOrCode: string): string {
    const lower = statusOrCode.toLowerCase();

    if (lower.includes("refused") || lower.includes("reject")) return "CR";
    if (lower.includes("not available") || lower.includes("unavailable")) return "CNA";
    if (lower.includes("defer")) return "CD";
    if (lower.includes("oda") || lower.includes("out of delivery area")) return "ODA";
    if (lower.includes("address") || lower.includes("incomplete")) return "AI";
    if (lower.includes("damage")) return "SD";
    if (lower.includes("dispute")) return "DISP";

    return "OTH"; // Other / generic
}
