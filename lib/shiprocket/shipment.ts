/**
 * Shiprocket – Shipment Operations
 *
 * Create orders, assign AWB, generate labels, schedule pickups,
 * and cancel shipments via the Shiprocket API.
 */

import { shiprocketGet, shiprocketPost, ShiprocketClientError } from "./client";
import {
    OrderCreateRequestSchema,
    OrderCreateResponseSchema,
    AssignAwbRequestSchema,
    AssignAwbResponseSchema,
    LabelResponseSchema,
    PickupRequestSchema,
    PickupResponseSchema,
    CancelResponseSchema,
    type OrderCreateRequest,
    type OrderCreateResponse,
    type AssignAwbRequest,
    type AssignAwbResponse,
    type LabelResponse,
    type PickupRequest,
    type PickupResponse,
    type CancelResponse,
} from "./types";
import { logInfo, logError } from "@/lib/logger";

// ─── Create Shipment (Order) ────────────────────────────────────────────────

/**
 * Create a new order on Shiprocket.
 *
 * This creates both the order and a shipment in one call.
 * Shiprocket returns `order_id` and `shipment_id` which you'll need
 * for AWB assignment, label generation, and pickup scheduling.
 *
 * @param orderData - Order creation parameters
 * @returns Validated response with Shiprocket order_id and shipment_id
 *
 * @throws {z.ZodError} on input or response validation failure
 * @throws {ShiprocketClientError} on API failure
 */
export async function createShipment(
    orderData: OrderCreateRequest
): Promise<OrderCreateResponse> {
    // 1. Validate input
    const validated = OrderCreateRequestSchema.parse(orderData);

    logInfo("SHIPROCKET", "Creating order/shipment", {
        orderId: validated.order_id,
        pincode: validated.billing_pincode,
        paymentMethod: validated.payment_method,
    });

    // 2. Call API
    const rawResponse = await shiprocketPost<unknown>(
        `/orders/create/adhoc`,
        validated
    );

    // 3. Validate & return
    const parsed = OrderCreateResponseSchema.parse(rawResponse);

    logInfo("SHIPROCKET", "Order created", {
        shiprocketOrderId: parsed.order_id,
        shipmentId: parsed.shipment_id,
        status: parsed.status,
    });

    return parsed;
}

// ─── Assign AWB ─────────────────────────────────────────────────────────────

/**
 * Assign an AWB (Air Waybill) number to a shipment.
 *
 * This step is required before generating a label or scheduling pickup.
 * Optionally specify a courier_id, or let Shiprocket auto-assign.
 *
 * @param request - Shipment ID and optional courier ID
 * @returns AWB assignment response with AWB code and courier details
 */
export async function assignAwb(
    request: AssignAwbRequest
): Promise<AssignAwbResponse> {
    const validated = AssignAwbRequestSchema.parse(request);

    logInfo("SHIPROCKET", "Assigning AWB", {
        shipmentId: validated.shipment_id,
        courierId: validated.courier_id,
    });

    const rawResponse = await shiprocketPost<unknown>(
        `/courier/assign/awb`,
        validated
    );

    const parsed = AssignAwbResponseSchema.parse(rawResponse);

    logInfo("SHIPROCKET", "AWB assigned", {
        awbCode: parsed.response?.data?.awb_code,
        courierName: parsed.response?.data?.courier_name,
        shipmentId: validated.shipment_id,
    });

    return parsed;
}

// ─── Generate Label ─────────────────────────────────────────────────────────

/**
 * Generate a shipping label for a shipment.
 *
 * The shipment must have an AWB assigned before label generation.
 *
 * @param shipmentId - Shiprocket shipment ID (numeric)
 * @returns Label response containing PDF URL
 */
export async function generateLabel(
    shipmentId: number | number[]
): Promise<LabelResponse> {
    const ids = Array.isArray(shipmentId) ? shipmentId : [shipmentId];

    if (ids.length === 0) {
        throw new ShiprocketClientError(
            "At least one shipment ID is required",
            400,
            "INVALID_SHIPMENT_ID"
        );
    }

    logInfo("SHIPROCKET", "Generating label", { shipmentIds: ids });

    const rawResponse = await shiprocketPost<unknown>(
        `/courier/generate/label`,
        { shipment_id: ids }
    );

    const parsed = LabelResponseSchema.parse(rawResponse);

    logInfo("SHIPROCKET", "Label generated", {
        labelUrl: parsed.label_url,
        created: parsed.label_created,
    });

    return parsed;
}

// ─── Schedule Pickup ────────────────────────────────────────────────────────

/**
 * Schedule a courier pickup for one or more shipments.
 *
 * Shipments must have AWB assigned and labels generated.
 *
 * @param pickupData - Array of shipment IDs to include in pickup
 * @returns Pickup response with scheduled date and token number
 */
export async function schedulePickup(
    pickupData: PickupRequest
): Promise<PickupResponse> {
    const validated = PickupRequestSchema.parse(pickupData);

    logInfo("SHIPROCKET", "Scheduling pickup", {
        shipmentIds: validated.shipment_id,
        count: validated.shipment_id.length,
    });

    const rawResponse = await shiprocketPost<unknown>(
        `/courier/generate/pickup`,
        validated
    );

    const parsed = PickupResponseSchema.parse(rawResponse);

    logInfo("SHIPROCKET", "Pickup scheduled", {
        tokenNumber: parsed.response?.pickup_token_number,
        scheduledDate: parsed.response?.pickup_scheduled_date,
    });

    return parsed;
}

// ─── Cancel Shipment ────────────────────────────────────────────────────────

/**
 * Cancel a Shiprocket order by its order IDs.
 *
 * Only works before the shipment is picked up by the courier.
 *
 * @param orderIds - Shiprocket order IDs to cancel
 * @returns Cancel confirmation with status
 */
export async function cancelShipment(
    orderIds: number | number[]
): Promise<CancelResponse> {
    const ids = Array.isArray(orderIds) ? orderIds : [orderIds];

    if (ids.length === 0) {
        throw new ShiprocketClientError(
            "At least one order ID is required",
            400,
            "INVALID_ORDER_ID"
        );
    }

    logInfo("SHIPROCKET", "Cancelling order(s)", { orderIds: ids });

    const rawResponse = await shiprocketPost<unknown>(
        `/orders/cancel`,
        { ids }
    );

    const parsed = CancelResponseSchema.parse(rawResponse);

    logInfo("SHIPROCKET", "Order(s) cancelled", {
        orderIds: ids,
        status: parsed.status,
        message: parsed.message,
    });

    return parsed;
}

// ─── Get Shipment Details ───────────────────────────────────────────────────

/**
 * Fetch shipment/order details from Shiprocket by order ID.
 *
 * @param orderId - Shiprocket order ID (numeric)
 * @returns Raw order details from Shiprocket
 */
export async function getShipmentDetails(
    orderId: number
): Promise<Record<string, unknown>> {
    if (!orderId || orderId <= 0) {
        throw new ShiprocketClientError(
            "A valid order ID is required",
            400,
            "INVALID_ORDER_ID"
        );
    }

    logInfo("SHIPROCKET", "Fetching shipment details", { orderId });

    const rawResponse = await shiprocketGet<Record<string, unknown>>(
        `/orders/show/${orderId}`
    );

    logInfo("SHIPROCKET", "Shipment details fetched", { orderId });

    return rawResponse;
}

// ─── Cancel by AWB ──────────────────────────────────────────────────────────

/**
 * Cancel Shiprocket shipments by AWB numbers.
 *
 * Shiprocket also supports cancellation by AWB via a different endpoint.
 * Use this when you only have the AWB number and not the order ID.
 *
 * @param awbNumbers - AWB numbers to cancel
 * @returns Cancel confirmation
 */
export async function cancelByAwb(
    awbNumbers: string | string[]
): Promise<CancelResponse> {
    const awbs = Array.isArray(awbNumbers) ? awbNumbers : [awbNumbers];

    if (awbs.length === 0) {
        throw new ShiprocketClientError(
            "At least one AWB number is required",
            400,
            "INVALID_AWB"
        );
    }

    logInfo("SHIPROCKET", "Cancelling by AWB", { awbNumbers: awbs });

    const rawResponse = await shiprocketPost<unknown>(
        `/orders/cancel/shipment/awbs`,
        { awbs }
    );

    const parsed = CancelResponseSchema.parse(rawResponse);

    logInfo("SHIPROCKET", "AWB cancellation complete", {
        awbs,
        status: parsed.status,
    });

    return parsed;
}
