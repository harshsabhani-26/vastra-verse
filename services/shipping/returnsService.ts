/**
 * Returns Service
 *
 * Handles the return shipment lifecycle:
 * - Create return order via Shiprocket
 * - Update ReturnRequest status
 * - Send customer notification
 *
 * All writes use Prisma transactions.
 */

import prisma from "@/lib/prisma";
import { ReturnStatus } from "@prisma/client";
import { createReturnShipment } from "@/lib/shiprocket/returns";
import type { ReturnOrderRequest, OrderItem } from "@/lib/shiprocket/types";
import { notificationService } from "@/lib/notifications/notificationService";
import { logInfo, logError } from "@/lib/logger";

// ─── Configuration ──────────────────────────────────────────────────────────

const WAREHOUSE_PINCODE = process.env.WAREHOUSE_PINCODE || "380015";
const WAREHOUSE_NAME = process.env.WAREHOUSE_NAME || "Vastraa Verse- Office";
const WAREHOUSE_ADDRESS = process.env.WAREHOUSE_ADDRESS || "";
const WAREHOUSE_CITY = process.env.WAREHOUSE_CITY || "";
const WAREHOUSE_STATE = process.env.WAREHOUSE_STATE || "";
const WAREHOUSE_PHONE = process.env.WAREHOUSE_PHONE || "";
const WAREHOUSE_EMAIL = process.env.WAREHOUSE_EMAIL || "";

// ─── Types ──────────────────────────────────────────────────────────────────

interface InitiateReturnResult {
    returnRequestId: string;
    shiprocketOrderId: number | null;
    shipmentId: number | null;
    awbNumber: string | null;
    status: ReturnStatus;
    notificationSent: boolean;
}

// ─── Initiate Return ────────────────────────────────────────────────────────

/**
 * Initiate a return by creating a return order on Shiprocket,
 * updating the ReturnRequest record, and notifying the customer.
 *
 * Steps:
 * 1. Load ReturnRequest + order + customer address
 * 2. Create return order on Shiprocket
 * 3. Update ReturnRequest + create shipment record (transaction)
 * 4. Send customer notification
 *
 * @param returnRequestId - ID of the approved ReturnRequest
 * @returns Return initiation result
 */
export async function initiateReturn(
    returnRequestId: string
): Promise<InitiateReturnResult> {
    logInfo("RETURNS_SERVICE", "Initiating return", { returnRequestId });

    // ── Step 1: Load return request with order and user ──
    const returnRequest = await prisma.returnRequest.findUnique({
        where: { id: returnRequestId },
        include: {
            order: {
                include: {
                    user: true,
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            },
            items: {
                include: {
                    orderItem: {
                        include: {
                            product: true,
                        },
                    },
                },
            },
            user: true,
        },
    });

    if (!returnRequest) {
        throw new Error(`Return request not found: ${returnRequestId}`);
    }

    if (returnRequest.status !== "APPROVED") {
        throw new Error(
            `Return request must be APPROVED to initiate pickup. Current status: ${returnRequest.status}`
        );
    }

    // Parse customer address from the order
    let customerAddress: {
        firstName?: string;
        lastName?: string;
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
        customerAddress = JSON.parse(returnRequest.order.shippingAddress || "{}");
    } catch {
        throw new Error(
            `Invalid shipping address on order for return: ${returnRequestId}`
        );
    }

    if (!customerAddress.zipCode || !customerAddress.city) {
        throw new Error(
            `Incomplete customer address for return: ${returnRequestId}`
        );
    }

    // ── Step 2: Create return order on Shiprocket ──
    const consigneeName = [
        customerAddress.firstName,
        customerAddress.lastName,
    ]
        .filter(Boolean)
        .join(" ")
        .trim() || returnRequest.user.name || "Customer";

    // Calculate total weight of return items (kg)
    const returnWeightKg = returnRequest.items.reduce(
        (total, item) => total + item.quantity * 0.5, // 0.5 kg per item default
        0
    );

    // Build return order items
    const returnItems: OrderItem[] = returnRequest.items.map((item) => ({
        name: item.orderItem.product.name,
        sku: item.orderItem.product.sku || item.orderItem.productId,
        units: item.quantity,
        selling_price: Number(item.orderItem.price),
        discount: 0,
        tax: 0,
        hsn: "",
    }));

    const returnOrderRequest: ReturnOrderRequest = {
        order_id: `RET-${returnRequest.orderId.slice(0, 12)}`,
        order_date: formatDate(returnRequest.requestedAt),

        // Pickup from customer
        pickup_customer_name: consigneeName,
        pickup_last_name: customerAddress.lastName || "",
        pickup_address: customerAddress.address1,
        pickup_address_2: customerAddress.address2 || "",
        pickup_city: customerAddress.city,
        pickup_state: customerAddress.state,
        pickup_country: customerAddress.country || "India",
        pickup_pincode: customerAddress.zipCode,
        pickup_email: customerAddress.email || returnRequest.user.email || "",
        pickup_phone:
            customerAddress.phone ||
            returnRequest.order.customerPhone ||
            "",

        // Ship to warehouse
        shipping_customer_name: WAREHOUSE_NAME,
        shipping_address: WAREHOUSE_ADDRESS,
        shipping_city: WAREHOUSE_CITY,
        shipping_state: WAREHOUSE_STATE,
        shipping_country: "India",
        shipping_pincode: WAREHOUSE_PINCODE,
        shipping_email: WAREHOUSE_EMAIL,
        shipping_phone: WAREHOUSE_PHONE,

        // Items
        order_items: returnItems,

        // Returns are always prepaid
        payment_method: "Prepaid",
        sub_total: returnRequest.items.reduce(
            (sum, item) => sum + item.quantity * Number(item.orderItem.price),
            0
        ),

        // Dimensions
        length: 25,
        breadth: 20,
        height: Math.max(5, returnRequest.items.length * 5),
        weight: returnWeightKg,
    };

    const shiprocketResponse = await createReturnShipment(returnOrderRequest);

    const awbNumber = shiprocketResponse.awb_code || null;

    if (shiprocketResponse.status_code !== 1) {
        logError(
            "RETURNS_SERVICE",
            new Error(shiprocketResponse.status || "Return order creation failed"),
            { returnRequestId }
        );
        throw new Error(
            `Shiprocket return order failed: ${shiprocketResponse.status || "Unknown error"}`
        );
    }

    // ── Step 3: Update DB in Prisma transaction ──
    await prisma.$transaction(async (tx) => {
        // Create return shipment record
        await tx.shipment.create({
            data: {
                orderId: returnRequest.orderId,
                awbNumber,
                shiprocketOrderId: String(shiprocketResponse.order_id),
                pickupPincode: customerAddress.zipCode,
                carrier: "SHIPROCKET",
                courierName: shiprocketResponse.courier_name || "Shiprocket",
                status: "RETURN_INITIATED",
                weight: returnWeightKg,
                createdBy: "SYSTEM",
            },
        });

        // Update return request status
        await tx.returnRequest.update({
            where: { id: returnRequestId },
            data: {
                status: "APPROVED", // Stays at APPROVED until item is received
                adminNotes: `Return order created. Shiprocket #${shiprocketResponse.order_id}${awbNumber ? `. AWB: ${awbNumber}` : ""}`,
            },
        });

        // Add order timeline entry
        await tx.orderTimeline.create({
            data: {
                orderId: returnRequest.orderId,
                event: "RETURN_PICKUP_SCHEDULED",
                details: `Return pickup created via Shiprocket${awbNumber ? `. AWB: ${awbNumber}` : ""}`,
                createdBy: "SYSTEM",
            },
        });
    });

    // ── Step 4: Send customer notification ──
    let notificationSent = false;
    try {
        if (returnRequest.user.id) {
            await notificationService.sendImmediate({
                userId: returnRequest.user.id,
                type: "RETURN_REQUEST",
                title: "Return Pickup Scheduled",
                message: `A pickup has been scheduled for your return on Order #${returnRequest.orderId.slice(0, 8)}. ${awbNumber ? `Tracking number: ${awbNumber}` : "You will receive tracking details shortly."
                    }`,
                priority: "NORMAL",
                resourceType: "Order",
                resourceId: returnRequest.orderId,
                actionUrl: `/orders/${returnRequest.orderId}`,
                actionText: "View Order",
                channels: ["IN_APP", "EMAIL"],
            });
            notificationSent = true;
        }
    } catch (err) {
        logError("RETURNS_SERVICE", err, {
            operation: "send_notification",
            returnRequestId,
        });
    }

    logInfo("RETURNS_SERVICE", "Return initiated successfully", {
        returnRequestId,
        shiprocketOrderId: shiprocketResponse.order_id,
        awbNumber,
        notificationSent,
    });

    return {
        returnRequestId,
        shiprocketOrderId: shiprocketResponse.order_id,
        shipmentId: shiprocketResponse.shipment_id,
        awbNumber,
        status: returnRequest.status,
        notificationSent,
    };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

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
