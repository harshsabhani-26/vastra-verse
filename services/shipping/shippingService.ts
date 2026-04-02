/**
 * Shipping Service Layer
 *
 * Orchestrates the full shipment lifecycle via Shiprocket:
 * - Create shipment for an order (validate → API → AWB → DB → queue label)
 * - Cancel shipment
 *
 * All writes use Prisma transactions for consistency.
 */

import prisma from "@/lib/prisma";
import { ShipmentStatus } from "@prisma/client";
import { checkServiceability } from "@/lib/shiprocket/serviceability";
import {
    createShipment as shiprocketCreateOrder,
    assignAwb,
    cancelShipment as shiprocketCancelShipment,
} from "@/lib/shiprocket/shipment";
import type { OrderCreateRequest, OrderItem } from "@/lib/shiprocket/types";
import { shipmentQueue } from "@/lib/queue";
import { logInfo, logError } from "@/lib/logger";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CreateShipmentResult {
    shipmentId: string;
    shiprocketOrderId: number | null;
    shiprocketShipmentId: number | null;
    awbNumber: string | null;
    labelQueued: boolean;
    status: ShipmentStatus;
}

interface CancelShipmentResult {
    success: boolean;
    shipmentId: string;
    awbNumber: string | null;
    message: string;
}

// ─── Configuration ──────────────────────────────────────────────────────────

const PICKUP_PINCODE = process.env.WAREHOUSE_PINCODE || "380015";
const PICKUP_LOCATION_NAME = process.env.SHIPROCKET_PICKUP_LOCATION || process.env.WAREHOUSE_NAME || "Vastraa Verse- Office";

// ─── Create Shipment For Order ──────────────────────────────────────────────

/**
 * End-to-end shipment creation for an order.
 *
 * Steps:
 * 1. Load order + shipping address via Prisma
 * 2. Validate serviceability (Shiprocket pincode check)
 * 3. Create order on Shiprocket
 * 4. Assign AWB number
 * 5. Save shipment record in DB (transaction)
 * 6. Queue label generation job
 *
 * @param orderId - The order to create a shipment for
 * @returns Shipment creation result with AWB and status
 */
export async function createShipmentForOrder(
    orderId: string
): Promise<CreateShipmentResult> {
    logInfo("SHIPPING_SERVICE", "Creating shipment for order", { orderId });

    // ── Step 1: Load order with items and address ──
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
            user: true,
        },
    });

    if (!order) {
        throw new Error(`Order not found: ${orderId}`);
    }

    if (order.status === "CANCELLED") {
        throw new Error(`Cannot create shipment for cancelled order: ${orderId}`);
    }

    // Parse shipping address (stored as JSON string)
    let shippingAddress: {
        firstName: string;
        lastName: string;
        address1: string;
        address2?: string;
        city: string;
        state: string;
        zipCode: string;
        phone: string;
        email?: string;
        country?: string;
    };

    try {
        shippingAddress = JSON.parse(order.shippingAddress || "{}");
    } catch {
        throw new Error(`Invalid shipping address for order: ${orderId}`);
    }

    if (!shippingAddress.zipCode || !shippingAddress.city) {
        throw new Error(`Incomplete shipping address for order: ${orderId}`);
    }

    // ── Step 2: Validate serviceability ──
    const isCod = order.paymentMethod === "COD";
    const weightKg = calculateOrderWeightKg(order.items);

    const serviceability = await checkServiceability(
        PICKUP_PINCODE,
        shippingAddress.zipCode,
        weightKg,
        isCod
    );

    if (!serviceability.serviceable) {
        throw new Error(
            `Pincode ${shippingAddress.zipCode} is not serviceable${isCod && !serviceability.codAvailable ? " for COD" : ""
            }`
        );
    }

    // ── Step 3: Create order on Shiprocket ──
    const consigneeName = `${shippingAddress.firstName || ""} ${shippingAddress.lastName || ""}`.trim() || "Customer";

    const orderItems: OrderItem[] = order.items.map((item) => ({
        name: item.product.name,
        sku: item.product.sku || item.productId,
        units: item.quantity,
        selling_price: Number(item.price),
        discount: 0,
        tax: 0,
        hsn: "",
    }));

    const dimensions = calculateOrderDimensions(order.items);

    const shiprocketOrderRequest: OrderCreateRequest = {
        order_id: orderId,
        order_date: formatDate(order.createdAt),
        pickup_location: PICKUP_LOCATION_NAME,

        // Billing
        billing_customer_name: shippingAddress.firstName || consigneeName,
        billing_last_name: shippingAddress.lastName || "",
        billing_address: shippingAddress.address1,
        billing_address_2: shippingAddress.address2 || "",
        billing_city: shippingAddress.city,
        billing_pincode: shippingAddress.zipCode,
        billing_state: shippingAddress.state,
        billing_country: shippingAddress.country || "India",
        billing_email: shippingAddress.email || order.user?.email || "",
        billing_phone: shippingAddress.phone || order.customerPhone || "",

        // Shipping = billing
        shipping_is_billing: true,

        // Items
        order_items: orderItems,

        // Payment
        payment_method: isCod ? "COD" : "Prepaid",
        sub_total: Number(order.total),
        shipping_charges: 0,
        giftwrap_charges: 0,
        transaction_charges: 0,
        total_discount: 0,

        // Dimensions (cm) and weight (kg)
        length: dimensions.length,
        breadth: dimensions.breadth,
        height: dimensions.height,
        weight: weightKg,
    };

    const shiprocketOrder = await shiprocketCreateOrder(shiprocketOrderRequest);

    if (shiprocketOrder.status_code !== 1) {
        throw new Error(
            `Shiprocket order creation failed: ${shiprocketOrder.status || "Unknown error"}`
        );
    }

    // ── Step 4: Assign AWB ──
    let awbNumber: string | null = shiprocketOrder.awb_code || null;
    let courierName: string | null = shiprocketOrder.courier_name || null;

    if (!awbNumber && shiprocketOrder.shipment_id) {
        try {
            const awbRequest: { shipment_id: number; courier_id?: number } = {
                shipment_id: shiprocketOrder.shipment_id,
            };
            if (serviceability.recommendedCourierId) {
                awbRequest.courier_id = serviceability.recommendedCourierId;
            }
            const awbResponse = await assignAwb(awbRequest);

            awbNumber = awbResponse.response?.data?.awb_code || null;
            courierName = awbResponse.response?.data?.courier_name || courierName;

            logInfo("SHIPPING_SERVICE", "AWB assigned", {
                awbNumber,
                courierName,
                shipmentId: shiprocketOrder.shipment_id,
            });
        } catch (err) {
            logError("SHIPPING_SERVICE", err, {
                operation: "assign_awb",
                shipmentId: shiprocketOrder.shipment_id,
            });
            // Continue — AWB assignment can be retried later
        }
    }

    // ── Step 5: Save shipment record (Prisma transaction) ──
    const shipment = await prisma.$transaction(async (tx) => {
        const newShipment = await tx.shipment.create({
            data: {
                orderId,
                awbNumber,
                shiprocketOrderId: String(shiprocketOrder.order_id),
                pickupPincode: PICKUP_PINCODE,
                carrier: "SHIPROCKET",
                courierName: courierName || "Shiprocket",
                status: awbNumber ? "READY_TO_SHIP" : "PENDING",
                providerResponse: JSON.parse(JSON.stringify(shiprocketOrder)),
                weight: weightKg,
                length: dimensions.length,
                breadth: dimensions.breadth,
                height: dimensions.height,
                createdBy: "SYSTEM",
            },
        });

        await tx.order.update({
            where: { id: orderId },
            data: {
                status: "PACKED",
                trackingNumber: awbNumber,
                courierName: courierName || "Shiprocket",
            },
        });

        await tx.orderTimeline.create({
            data: {
                orderId,
                event: "SHIPMENT_CREATED",
                details: `Shipment created via Shiprocket. Order #${shiprocketOrder.order_id}${awbNumber ? `. AWB: ${awbNumber}` : ""}`,
                createdBy: "SYSTEM",
            },
        });

        return newShipment;
    });

    // ── Step 6: Queue label generation job ──
    let labelQueued = false;
    if (awbNumber && shiprocketOrder.shipment_id) {
        try {
            await shipmentQueue().add(
                "generate-label",
                {
                    orderId,
                    shipmentData: { orderId } as any,
                },
                { delay: 3000 } // Small delay to let Shiprocket process
            );
            labelQueued = true;
            logInfo("SHIPPING_SERVICE", "Label generation job queued", { orderId, awbNumber });
        } catch (err) {
            logError("SHIPPING_SERVICE", err, { operation: "queue_label", orderId });
        }
    }

    logInfo("SHIPPING_SERVICE", "Shipment created successfully", {
        shipmentId: shipment.id,
        shiprocketOrderId: shiprocketOrder.order_id,
        awbNumber,
        orderId,
    });

    return {
        shipmentId: shipment.id,
        shiprocketOrderId: shiprocketOrder.order_id,
        shiprocketShipmentId: shiprocketOrder.shipment_id,
        awbNumber,
        labelQueued,
        status: shipment.status,
    };
}

// ─── Cancel Shipment ────────────────────────────────────────────────────────

/**
 * Cancel an existing shipment.
 *
 * Calls Shiprocket cancellation API and updates the DB record in a transaction.
 *
 * @param shipmentId - Internal shipment ID
 * @returns Cancellation result
 */
export async function cancelShipment(
    shipmentId: string
): Promise<CancelShipmentResult> {
    logInfo("SHIPPING_SERVICE", "Cancelling shipment", { shipmentId });

    // 1. Load shipment
    const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId },
        include: { order: true },
    });

    if (!shipment) {
        throw new Error(`Shipment not found: ${shipmentId}`);
    }

    // Check if cancellation is possible
    const nonCancellableStatuses: ShipmentStatus[] = [
        "DELIVERED",
        "CANCELLED",
        "RTO_DELIVERED",
        "RETURN_DELIVERED",
    ];

    if (nonCancellableStatuses.includes(shipment.status)) {
        return {
            success: false,
            shipmentId,
            awbNumber: shipment.awbNumber,
            message: `Cannot cancel shipment in status: ${shipment.status}`,
        };
    }

    // 2. Call Shiprocket cancellation (using shiprocketOrderId)
    if (shipment.shiprocketOrderId) {
        try {
            const shiprocketOrderId = parseInt(shipment.shiprocketOrderId, 10);
            if (!isNaN(shiprocketOrderId)) {
                await shiprocketCancelShipment(shiprocketOrderId);
            }
        } catch (err) {
            logError("SHIPPING_SERVICE", err, {
                operation: "shiprocket_cancel",
                shiprocketOrderId: shipment.shiprocketOrderId,
            });
            // Continue with local cancellation even if API fails
        }
    }

    // 3. Update DB in transaction
    await prisma.$transaction(async (tx) => {
        await tx.shipment.update({
            where: { id: shipmentId },
            data: {
                status: "CANCELLED",
                cancelledAt: new Date(),
                cancellationReason: "Cancelled by admin/system",
            },
        });

        await tx.orderTimeline.create({
            data: {
                orderId: shipment.orderId,
                event: "SHIPMENT_CANCELLED",
                details: `Shipment ${shipment.awbNumber || shipmentId} cancelled`,
                createdBy: "SYSTEM",
            },
        });
    });

    logInfo("SHIPPING_SERVICE", "Shipment cancelled", {
        shipmentId,
        awbNumber: shipment.awbNumber,
    });

    return {
        success: true,
        shipmentId,
        awbNumber: shipment.awbNumber,
        message: "Shipment cancelled successfully",
    };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Calculate total order weight in kg.
 * Default: 0.5 kg per item (configurable per product in future).
 */
function calculateOrderWeightKg(
    items: Array<{ quantity: number; product: { name: string } }>
): number {
    const DEFAULT_ITEM_WEIGHT_KG = 0.5;
    return items.reduce(
        (total, item) => total + item.quantity * DEFAULT_ITEM_WEIGHT_KG,
        0
    );
}

/**
 * Calculate approximate package dimensions in cm.
 * Returns sensible defaults; override per-product in future.
 */
function calculateOrderDimensions(
    items: Array<{ quantity: number }>
): { length: number; breadth: number; height: number } {
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    return {
        length: 25,
        breadth: 20,
        height: Math.max(5, totalItems * 5), // 5cm per item layer
    };
}

/**
 * Format Date to "YYYY-MM-DD HH:mm" (Shiprocket format).
 */
function formatDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}
