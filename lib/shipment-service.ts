/**
 * Shipment Service Layer
 * 
 * Database operations for shipment management:
 * - Create and update shipment records
 * - Link shipments to orders
 * - Append order timeline events
 * - Query shipment history
 */

import prisma from "@/lib/prisma";
import { ShipmentStatus, OrderStatus } from "@prisma/client";

// Strict mapping of ShipmentStatus to OrderStatus
const ORDER_STATUS_MAPPING: Partial<Record<ShipmentStatus, OrderStatus>> = {
    READY_TO_SHIP: "PACKED",
    PICKUP_SCHEDULED: "PACKED",
    IN_TRANSIT: "SHIPPED",
    OUT_FOR_DELIVERY: "SHIPPED",
    DELIVERED: "DELIVERED",
    RETURN_INITIATED: "RETURNED",
    RETURN_DELIVERED: "RETURNED",
    RETURN_PICKED: "RETURNED"
};

/**
 * Calculate volumetric weight (L*B*H / 5000)
 * Dimensions in cm, result in kg
 */
export function calculateVolumetricWeight(length: number, breadth: number, height: number): number {
    return (length * breadth * height) / 5000;
}

// Rank for forward-only progression check
const SHIPMENT_STATUS_RANK: Record<ShipmentStatus, number> = {
    PENDING: 0,
    READY_TO_SHIP: 1,
    PICKUP_SCHEDULED: 2,
    IN_TRANSIT: 3,
    OUT_FOR_DELIVERY: 4,
    DELIVERED: 5,
    RETURN_INITIATED: 6,
    RETURN_PICKED: 7,
    RETURN_DELIVERED: 8,
    CANCELLED: 99,
    FAILED: 99
};

interface CreateShipmentParams {
    orderId: string;
    providerShipmentId?: string;
    awbNumber?: string;
    courierName?: string;
    labelUrl?: string;
    trackingUrl?: string;
    status?: ShipmentStatus;
    isReturn?: boolean;
    weight?: number;
    length?: number;
    breadth?: number;
    height?: number;
    providerResponse?: any;
    createdBy?: string;
}

interface UpdateShipmentParams {
    status?: ShipmentStatus;
    awbNumber?: string;
    courierName?: string;
    labelUrl?: string;
    trackingUrl?: string;
    pickupScheduledAt?: Date;
    shippedAt?: Date;
    deliveredAt?: Date;
    cancelledAt?: Date;
    returnInitiatedAt?: Date;
    estimatedDeliveryAt?: Date;
    trackingData?: any;
    cancellationReason?: string;
    failureReason?: string;
}

/**
 * Create a new shipment record
 */
export async function createShipmentRecord(params: CreateShipmentParams) {
    const volumetricWeight = (params.length && params.breadth && params.height)
        ? calculateVolumetricWeight(params.length, params.breadth, params.height)
        : 0;

    const chargeableWeight = params.weight
        ? Math.max(params.weight, volumetricWeight)
        : volumetricWeight;

    const shipment = await prisma.shipment.create({
        data: {
            orderId: params.orderId,
            providerShipmentId: params.providerShipmentId,
            awbNumber: params.awbNumber,
            courierName: params.courierName,
            labelUrl: params.labelUrl,
            trackingUrl: params.trackingUrl,
            status: params.status || "PENDING",
            isReturn: params.isReturn || false,
            weight: params.weight,
            length: params.length,
            breadth: params.breadth,
            height: params.height,
            volumetricWeight,
            chargeableWeight,
            providerResponse: params.providerResponse,
            createdBy: params.createdBy
        },
        include: {
            order: true
        }
    });

    // Create order timeline entry
    await prisma.orderTimeline.create({
        data: {
            orderId: params.orderId,
            event: params.isReturn ? "RETURN_SHIPMENT_CREATED" : "SHIPMENT_CREATED",
            details: params.isReturn
                ? `Return shipment created${params.awbNumber ? ` with AWB: ${params.awbNumber}` : ""}`
                : `Shipment created${params.awbNumber ? ` with AWB: ${params.awbNumber}` : ""}${params.courierName ? ` via ${params.courierName}` : ""}`,
            createdBy: params.createdBy || "SYSTEM"
        }
    });

    return shipment;
}

/**
 * Update shipment record
 */
export async function updateShipmentRecord(shipmentId: string, params: UpdateShipmentParams) {
    const shipment = await prisma.shipment.update({
        where: { id: shipmentId },
        data: params,
        include: {
            order: true
        }
    });

    return shipment;
}

/**
 * Update shipment status with timeline event
 */
/**
 * Updates a shipment's status and syncs with order status if applicable.
 * Enforces forward-only progression for standard delivery flow.
 */
export async function updateShipmentStatus(
    id: string,
    status: ShipmentStatus,
    additionalData?: UpdateShipmentParams,
    timelineDetails?: string
) {
    const shipment = await prisma.shipment.findUnique({
        where: { id },
        include: { order: true }
    });

    if (!shipment) {
        throw new Error("Shipment not found");
    }

    // 1. Forward-only progression check
    const currentRank = SHIPMENT_STATUS_RANK[shipment.status] || 0;
    const newRank = SHIPMENT_STATUS_RANK[status] || 0;

    const isForwardMove = newRank > currentRank;
    const isIdempotent = newRank === currentRank;
    // status exceptions that are allowed to break strict forward rank (e.g. failure/cancellation from any state)
    const isException = status === "CANCELLED" || status === "FAILED" || status === "RETURN_INITIATED";

    // Prevent any backward move unless it's a special exception case
    if (!isForwardMove && !isIdempotent && !isException) {
        console.warn(`[ShipmentService] Skipping backward/invalid status update for ${id}: ${shipment.status} -> ${status}`);
        return shipment;
    }

    // 2. Update Shipment
    const updatedShipment = await prisma.shipment.update({
        where: { id },
        data: {
            status,
            ...additionalData
        }
    });

    // 3. Create Shipment Timeline Event
    const eventMap: Record<ShipmentStatus, string> = {
        PENDING: "SHIPMENT_PENDING",
        READY_TO_SHIP: "SHIPMENT_READY",
        PICKUP_SCHEDULED: "PICKUP_SCHEDULED",
        IN_TRANSIT: "SHIPMENT_IN_TRANSIT",
        OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
        DELIVERED: "SHIPMENT_DELIVERED",
        FAILED: "SHIPMENT_FAILED",
        CANCELLED: "SHIPMENT_CANCELLED",
        RETURN_INITIATED: "RETURN_INITIATED",
        RETURN_PICKED: "RETURN_PICKED",
        RETURN_DELIVERED: "RETURN_DELIVERED"
    };

    await prisma.orderTimeline.create({
        data: {
            orderId: shipment.orderId,
            event: eventMap[status] || status,
            details: timelineDetails || `Shipment status updated to ${status}`,
            createdBy: "SHIPROCKET_WEBHOOK"
        }
    });

    // 4. Create Order Status Timeline Event (if order status changes)
    const mappedOrderStatus = ORDER_STATUS_MAPPING[status];

    if (mappedOrderStatus && shipment.order.status !== mappedOrderStatus) {
        // Exception: Don't revert DELIVERED order to PACKED
        if (shipment.order.status === "DELIVERED" && mappedOrderStatus !== "RETURNED") {
            // Do nothing
        } else {
            await prisma.order.update({
                where: { id: shipment.orderId },
                data: { status: mappedOrderStatus }
            });

            await prisma.orderTimeline.create({
                data: {
                    orderId: shipment.orderId,
                    event: `ORDER_${mappedOrderStatus}`,
                    details: `Order status updated to ${mappedOrderStatus} via shipment update`,
                    createdBy: "SYSTEM"
                }
            });
        }
    }

    return updatedShipment;
}

/**
 * Updates shipment financial and weight details
 */
export async function updateShipmentCosts(
    id: string,
    data: {
        shippingCost?: number;
        rtoCost?: number;
        codCollectionFee?: number;
        insuranceFee?: number;
        fuelSurcharge?: number;
        weight?: number;
        volumetricWeight?: number;
        codRemittance?: number;
    }
) {
    // Calculate total shipping cost
    const totalShippingCost =
        (data.shippingCost || 0) +
        (data.rtoCost || 0) +
        (data.codCollectionFee || 0) +
        (data.insuranceFee || 0) +
        (data.fuelSurcharge || 0);

    return await prisma.shipment.update({
        where: { id },
        data: {
            shippingCost: data.shippingCost,
            rtoCost: data.rtoCost,
            codCollectionFee: data.codCollectionFee,
            insuranceFee: data.insuranceFee,
            fuelSurcharge: data.fuelSurcharge,
            totalShippingCost: totalShippingCost > 0 ? totalShippingCost : undefined,
            actualWeight: data.weight,
            volumetricWeight: data.volumetricWeight,
            chargeableWeight: data.weight && data.volumetricWeight
                ? Math.max(data.weight, data.volumetricWeight)
                : undefined,
            codRemittance: data.codRemittance
        }
    });
}

/**
 * Calculate and update profit impact for a shipment
 */
export async function updateProfitImpact(id: string): Promise<void> {
    const shipment = await prisma.shipment.findUnique({
        where: { id },
        include: { order: true }
    });

    if (!shipment) return;

    const orderTotal = Number(shipment.order.total);
    const shippingCost = Number(shipment.totalShippingCost || 0);

    // Simple profit = revenue - shipping cost
    // (In reality, you'd also subtract product cost, taxes, etc.)
    const profitImpact = orderTotal - shippingCost;

    await prisma.shipment.update({
        where: { id },
        data: { profitImpact }
    });
}

/**
 * Find shipment by AWB number
 */
export async function findShipmentByAwb(awb: string) {
    return prisma.shipment.findUnique({
        where: { awbNumber: awb },
        include: {
            order: {
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            }
        }
    });
}

/**
 * Find shipment by provider shipment ID
 */
export async function findShipmentByProviderId(providerId: string) {
    return prisma.shipment.findUnique({
        where: { providerShipmentId: providerId },
        include: {
            order: true
        }
    });
}

/**
 * Get all shipments for an order
 */
export async function getOrderShipments(orderId: string) {
    return prisma.shipment.findMany({
        where: { orderId },
        orderBy: { createdAt: "desc" }
    });
}

/**
 * Get active shipments (not delivered/cancelled)
 */
export async function getActiveShipments() {
    return prisma.shipment.findMany({
        where: {
            status: {
                notIn: ["DELIVERED", "CANCELLED", "FAILED", "RETURN_DELIVERED"]
            }
        },
        include: {
            order: true
        },
        orderBy: { createdAt: "desc" }
    });
}

/**
 * Update order status based on shipment status
 */

