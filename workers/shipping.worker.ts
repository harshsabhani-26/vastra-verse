/**
 * Shipping Worker
 *
 * BullMQ worker that processes background shipping jobs:
 * - GENERATE_LABEL: Generate shipping label via Shiprocket
 * - SCHEDULE_PICKUP: Schedule courier pickup via Shiprocket
 * - SYNC_TRACKING: Sync tracking data for an AWB
 * - NDR_SYNC: Sync all NDR events from Shiprocket tracking
 *
 * Uses the existing createWorker helper from lib/queue.
 */

import { Job } from "bullmq";
import { createWorker, shipmentQueue } from "@/lib/queue";
import { generateLabel, schedulePickup } from "@/lib/shiprocket/shipment";
import { syncTracking } from "@/services/shipping/trackingService";
import { fetchAndSyncNdrs } from "@/services/shipping/ndrService";
import prisma from "@/lib/prisma";
import { logInfo, logError } from "@/lib/logger";

// ─── Job Data Types ─────────────────────────────────────────────────────────

interface GenerateLabelJobData {
    orderId: string;
    shipmentData: { orderId: string };
}

interface SchedulePickupJobData {
    shipmentIds: string[];
    pickupDate?: string;
    pickupLocation?: string;
}

interface SyncTrackingJobData {
    waybill: string;
}

interface NdrSyncJobData {
    triggeredBy?: string;
}

type ShippingJobData =
    | GenerateLabelJobData
    | SchedulePickupJobData
    | SyncTrackingJobData
    | NdrSyncJobData;

// ─── Job Processors ─────────────────────────────────────────────────────────

async function processGenerateLabel(data: GenerateLabelJobData): Promise<{
    status: string;
    labelUrl?: string;
}> {
    const { orderId } = data;

    // Find the shipment for this order
    const shipment = await prisma.shipment.findFirst({
        where: { orderId },
        orderBy: { createdAt: "desc" },
    });

    if (!shipment) {
        logError("SHIPPING_WORKER", new Error("No shipment found"), {
            orderId,
        });
        return { status: "skipped", labelUrl: undefined };
    }

    // Shiprocket requires the shipment_id (numeric) for label generation
    const shiprocketShipmentId = shipment.providerResponse
        ? (shipment.providerResponse as any)?.shipment_id
        : null;

    if (!shiprocketShipmentId) {
        logError("SHIPPING_WORKER", new Error("No Shiprocket shipment ID found"), {
            orderId,
            localShipmentId: shipment.id,
        });
        return { status: "skipped" };
    }

    // Generate label via Shiprocket API
    const labelResult = await generateLabel(shiprocketShipmentId);

    const labelUrl = labelResult.label_url;

    if (labelUrl) {
        // Store label URL on shipment
        await prisma.shipment.update({
            where: { id: shipment.id },
            data: {
                labelUrl,
                status: "LABEL_GENERATED",
            },
        });

        logInfo("SHIPPING_WORKER", "Label generated", {
            orderId,
            awb: shipment.awbNumber,
            labelUrl,
        });

        return { status: "generated", labelUrl };
    }

    logError("SHIPPING_WORKER", new Error("Label generation returned no URL"), {
        orderId,
        awb: shipment.awbNumber,
        response: labelResult,
    });
    return { status: "failed" };
}

async function processSchedulePickup(
    data: SchedulePickupJobData
): Promise<{ status: string; scheduledDate?: string }> {
    const { shipmentIds } = data;

    // Load all shipments for this pickup batch
    const shipments = await prisma.shipment.findMany({
        where: { id: { in: shipmentIds } },
        select: {
            id: true,
            providerResponse: true,
        },
    });

    // Extract Shiprocket shipment IDs
    const shiprocketShipmentIds = shipments
        .map((s) => (s.providerResponse as any)?.shipment_id)
        .filter((id): id is number => typeof id === "number");

    if (shiprocketShipmentIds.length === 0) {
        logInfo("SHIPPING_WORKER", "No valid Shiprocket shipment IDs for pickup", {
            shipmentIds,
        });
        return { status: "skipped" };
    }

    // Schedule pickup via Shiprocket — Shiprocket takes an array of shipment IDs
    const pickupResult = await schedulePickup({
        shipment_id: shiprocketShipmentIds,
    });

    // Update shipment statuses
    await prisma.shipment.updateMany({
        where: { id: { in: shipmentIds } },
        data: { status: "PICKUP_SCHEDULED" },
    });

    const scheduledDate = pickupResult.response?.pickup_scheduled_date;

    logInfo("SHIPPING_WORKER", "Pickup scheduled", {
        count: shiprocketShipmentIds.length,
        scheduledDate,
    });

    return {
        status: "scheduled",
        scheduledDate: scheduledDate || undefined,
    };
}

async function processSyncTracking(
    data: SyncTrackingJobData
): Promise<{ status: string }> {
    const { waybill } = data;

    await syncTracking(waybill);

    logInfo("SHIPPING_WORKER", "Tracking synced", { waybill });
    return { status: "synced" };
}

async function processNdrSync(
    _data: NdrSyncJobData
): Promise<{ status: string; synced?: number }> {
    const result = await fetchAndSyncNdrs();

    logInfo("SHIPPING_WORKER", "NDR sync completed", {
        synced: result.synced,
        skipped: result.skipped,
        errors: result.errors,
    });

    return { status: "completed", synced: result.synced };
}

// ─── Main Router ────────────────────────────────────────────────────────────

async function processShippingJob(job: Job<ShippingJobData>) {
    const startTime = Date.now();

    logInfo("SHIPPING_WORKER", `Processing job: ${job.name}`, {
        jobId: job.id,
        jobName: job.name,
    });

    try {
        let result: Record<string, unknown>;

        switch (job.name) {
            case "generate-label":
            case "GENERATE_LABEL":
                result = await processGenerateLabel(
                    job.data as GenerateLabelJobData
                );
                break;

            case "schedule-pickup":
            case "SCHEDULE_PICKUP":
                result = await processSchedulePickup(
                    job.data as SchedulePickupJobData
                );
                break;

            case "sync-tracking":
            case "SYNC_TRACKING":
                result = await processSyncTracking(
                    job.data as SyncTrackingJobData
                );
                break;

            case "ndr-sync":
            case "NDR_SYNC":
                result = await processNdrSync(job.data as NdrSyncJobData);
                break;

            default:
                logError(
                    "SHIPPING_WORKER",
                    new Error(`Unknown job name: ${job.name}`),
                    { jobId: job.id }
                );
                result = { status: "unknown_job" };
        }

        const duration = Date.now() - startTime;
        logInfo("SHIPPING_WORKER", `Job completed: ${job.name}`, {
            jobId: job.id,
            durationMs: duration,
            ...result,
        });

        return result;
    } catch (err) {
        logError("SHIPPING_WORKER", err, {
            jobId: job.id,
            jobName: job.name,
            durationMs: Date.now() - startTime,
        });
        throw err; // Let BullMQ retry
    }
}

// ─── Start Worker ───────────────────────────────────────────────────────────

export function startShippingWorker() {
    const worker = createWorker<ShippingJobData>(
        "shipment",
        processShippingJob,
        3 // Concurrency: 3 parallel jobs
    );
    logInfo("SHIPPING_WORKER", "Shipping worker started", { concurrency: 3 });
    return worker;
}
