/**
 * Shiprocket – Typed Error Classes
 *
 * Granular error types for different failure modes.
 * All extend the base ShiprocketClientError from client.ts.
 */

import { ShiprocketClientError } from "./client";

// ─── Auth Error ─────────────────────────────────────────────────────────────

/** Thrown when Shiprocket authentication fails (invalid credentials, expired token). */
export class ShiprocketAuthError extends ShiprocketClientError {
    constructor(message = "Shiprocket authentication failed", rawResponse?: unknown) {
        super(message, 401, "AUTH_FAILED", rawResponse);
        this.name = "ShiprocketAuthError";
    }
}

// ─── API Error ──────────────────────────────────────────────────────────────

/** Thrown for general Shiprocket API errors (4xx/5xx responses). */
export class ShiprocketApiError extends ShiprocketClientError {
    public readonly endpoint: string;

    constructor(
        message: string,
        endpoint: string,
        status = 500,
        rawResponse?: unknown
    ) {
        super(message, status, `API_ERROR_${status}`, rawResponse);
        this.name = "ShiprocketApiError";
        this.endpoint = endpoint;
    }
}

// ─── Serviceability Error ───────────────────────────────────────────────────

/** Thrown when a pincode pair is not serviceable or no couriers available. */
export class ServiceabilityError extends ShiprocketClientError {
    public readonly pickupPincode: string;
    public readonly deliveryPincode: string;

    constructor(
        pickupPincode: string,
        deliveryPincode: string,
        message = "Route not serviceable",
        rawResponse?: unknown
    ) {
        super(message, 422, "NOT_SERVICEABLE", rawResponse);
        this.name = "ServiceabilityError";
        this.pickupPincode = pickupPincode;
        this.deliveryPincode = deliveryPincode;
    }
}

// ─── Shipment Creation Error ────────────────────────────────────────────────

/** Thrown when shipment/order creation fails on Shiprocket. */
export class ShipmentCreationError extends ShiprocketClientError {
    public readonly orderId?: string;
    public readonly reason: string;

    constructor(
        reason: string,
        orderId?: string,
        rawResponse?: unknown
    ) {
        super(`Shipment creation failed: ${reason}`, 422, "SHIPMENT_CREATION_FAILED", rawResponse);
        this.name = "ShipmentCreationError";
        this.orderId = orderId;
        this.reason = reason;
    }
}

// ─── Cancellation Error ─────────────────────────────────────────────────────

/** Thrown when shipment cancellation is not allowed (e.g. already delivered). */
export class ShipmentCancellationError extends ShiprocketClientError {
    public readonly shipmentId: string;
    public readonly currentStatus: string;

    constructor(
        shipmentId: string,
        currentStatus: string,
        rawResponse?: unknown
    ) {
        super(
            `Cannot cancel shipment ${shipmentId}: current status is ${currentStatus}`,
            409,
            "CANCELLATION_NOT_ALLOWED",
            rawResponse
        );
        this.name = "ShipmentCancellationError";
        this.shipmentId = shipmentId;
        this.currentStatus = currentStatus;
    }
}

// ─── Tracking Error ─────────────────────────────────────────────────────────

/** Thrown when tracking data cannot be fetched for an AWB. */
export class TrackingError extends ShiprocketClientError {
    public readonly awbNumber: string;

    constructor(
        awbNumber: string,
        message = "Failed to fetch tracking data",
        rawResponse?: unknown
    ) {
        super(message, 404, "TRACKING_NOT_FOUND", rawResponse);
        this.name = "TrackingError";
        this.awbNumber = awbNumber;
    }
}
