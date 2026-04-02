/**
 * Shiprocket – Shipment Tracking
 *
 * Fetches real-time tracking data for a shipment by AWB number
 * and normalises the Shiprocket scan activities into our TrackingEvent format.
 */

import { shiprocketGet } from "./client";
import {
    TrackingResponseSchema,
    type TrackingResponse,
} from "./types";
import type { TrackingEvent } from "@/types/shipping";
import { logInfo, logError } from "@/lib/logger";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TrackingResult {
    /** AWB number */
    awbNumber: string;
    /** Current shipment status */
    currentStatus: string;
    /** Current location */
    currentLocation: string | null;
    /** Expected delivery date (ISO-8601) */
    expectedDeliveryDate: string | null;
    /** Actual delivery date if delivered (ISO-8601) */
    deliveryDate: string | null;
    /** Pickup date (ISO-8601) */
    pickupDate: string | null;
    /** Origin location */
    origin: string | null;
    /** Destination location */
    destination: string | null;
    /** Courier company name */
    courierName: string | null;
    /** Normalised tracking events (newest first) */
    events: TrackingEvent[];
    /** Track URL from Shiprocket */
    trackUrl: string | null;
    /** Raw response from Shiprocket */
    raw: TrackingResponse;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Fetch tracking data for a shipment by AWB number.
 *
 * @param awbNumber - Air Waybill number
 * @returns Structured tracking result with normalised events
 *
 * @throws {ShiprocketClientError} on API failure
 * @throws {z.ZodError} on response validation failure
 */
export async function getTrackingData(awbNumber: string): Promise<TrackingResult> {
    if (!awbNumber || awbNumber.trim().length === 0) {
        throw new Error("AWB number is required for tracking");
    }

    logInfo("SHIPROCKET", "Fetching tracking data", { awbNumber });

    // Call Shiprocket tracking API
    const rawResponse = await shiprocketGet<unknown>(
        `/courier/track/awb/${awbNumber}`
    );

    // Validate response
    const parsed = TrackingResponseSchema.parse(rawResponse);

    // Check for errors
    if (parsed.tracking_data.track_status === 0) {
        logError("SHIPROCKET", new Error("No tracking data found"), { awbNumber });
        throw new Error(`No tracking data found for AWB: ${awbNumber}`);
    }

    // Transform to our format
    const result = transformTrackingData(parsed, awbNumber);

    logInfo("SHIPROCKET", "Tracking data fetched", {
        awbNumber,
        status: result.currentStatus,
        eventCount: result.events.length,
    });

    return result;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function transformTrackingData(
    response: TrackingResponse,
    awbNumber: string
): TrackingResult {
    const trackData = response.tracking_data;
    const shipmentTrack = trackData.shipment_track?.[0];
    const activities = trackData.shipment_track_activities || [];

    // Normalise scan activities to our TrackingEvent interface
    const events: TrackingEvent[] = activities.map((activity) => ({
        timestamp: activity.date,
        status: activity["sr-status"] || activity.status,
        activity: activity.activity,
        location: activity.location || "",
        remarks: activity["sr-status-label"],
        statusCode: activity["sr-status"],
        scanType: activity.status,
    }));

    // Sort newest first
    events.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return {
        awbNumber: shipmentTrack?.awb_code || awbNumber,
        currentStatus: shipmentTrack?.current_status || "UNKNOWN",
        currentLocation: events.length > 0 ? events[0].location : null,
        expectedDeliveryDate: trackData.etd || shipmentTrack?.edd || null,
        deliveryDate: shipmentTrack?.delivered_date || null,
        pickupDate: shipmentTrack?.pickup_date || null,
        origin: shipmentTrack?.origin || null,
        destination: shipmentTrack?.destination || null,
        courierName: null,
        events,
        trackUrl: trackData.track_url || null,
        raw: response,
    };
}
