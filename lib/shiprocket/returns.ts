/**
 * Shiprocket – Return Shipment (Reverse Pickup)
 *
 * Creates a reverse pickup / return order on Shiprocket.
 * The courier picks up from the customer address and delivers
 * to the seller/warehouse address.
 */

import { shiprocketPost, ShiprocketClientError } from "./client";
import {
    ReturnOrderRequestSchema,
    ReturnOrderResponseSchema,
    type ReturnOrderRequest,
    type ReturnOrderResponse,
} from "./types";
import { logInfo, logError } from "@/lib/logger";

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Create a return shipment on Shiprocket.
 *
 * Shiprocket creates a reverse pickup — courier picks up from the customer
 * address and delivers to the seller/warehouse address.
 *
 * @param returnRequest - Return order parameters (customer address, items, dimensions)
 * @returns Validated response with Shiprocket order_id and shipment_id
 *
 * @throws {z.ZodError} on input or response validation failure
 * @throws {ShiprocketClientError} on API failure
 */
export async function createReturnShipment(
    returnRequest: ReturnOrderRequest
): Promise<ReturnOrderResponse> {
    // 1. Validate input
    const validated = ReturnOrderRequestSchema.parse(returnRequest);

    logInfo("SHIPROCKET", "Creating return order", {
        orderId: validated.order_id,
        customerPin: validated.pickup_pincode,
        weight: validated.weight,
    });

    // 2. Call Shiprocket Return API
    const rawResponse = await shiprocketPost<unknown>(
        `/orders/create/return`,
        validated
    );

    // 3. Validate response
    const parsed = ReturnOrderResponseSchema.parse(rawResponse);

    if (parsed.status_code !== 1) {
        logError("SHIPROCKET", new Error(parsed.status || "Return order creation failed"), {
            orderId: validated.order_id,
            statusCode: parsed.status_code,
        });
    } else {
        logInfo("SHIPROCKET", "Return order created", {
            shiprocketOrderId: parsed.order_id,
            shipmentId: parsed.shipment_id,
            awbCode: parsed.awb_code,
        });
    }

    return parsed;
}
