/**
 * Shiprocket Shipping Integration - TypeScript Interfaces
 *
 * Standalone interfaces for use across the application.
 * These complement the Prisma-generated types with domain-specific shapes
 * for tracking events, NDR handling, and pickup batching.
 */

// ─── Enums ──────────────────────────────────────────────────────────────────

export enum ShipmentStatusEnum {
    PENDING = "PENDING",
    READY_TO_SHIP = "READY_TO_SHIP",
    LABEL_GENERATED = "LABEL_GENERATED",
    PICKUP_SCHEDULED = "PICKUP_SCHEDULED",
    PICKED_UP = "PICKED_UP",
    IN_TRANSIT = "IN_TRANSIT",
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
    DELIVERED = "DELIVERED",
    DELIVERY_ATTEMPTED = "DELIVERY_ATTEMPTED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED",
    RTO_INITIATED = "RTO_INITIATED",
    RTO_DELIVERED = "RTO_DELIVERED",
    EXCEPTION = "EXCEPTION",
    RETURN_INITIATED = "RETURN_INITIATED",
    RETURN_PICKED = "RETURN_PICKED",
    RETURN_DELIVERED = "RETURN_DELIVERED",
}

// ─── Shipment ───────────────────────────────────────────────────────────────

export interface Shipment {
    id: string;
    orderId: string;
    providerShipmentId: string | null;
    awbNumber: string | null;
    courierName: string | null;
    labelUrl: string | null;
    trackingUrl: string | null;
    status: ShipmentStatusEnum;
    isReturn: boolean;

    // Shiprocket-specific
    shiprocketOrderId: string | null;
    pickupPincode: string | null;
    carrier: string; // defaults to "SHIPROCKET"

    // Scheduling
    pickupScheduledAt: Date | null;
    shippedAt: Date | null;
    deliveredAt: Date | null;
    cancelledAt: Date | null;
    returnInitiatedAt: Date | null;
    estimatedDeliveryAt: Date | null;

    // Dimensions
    weight: number | null;
    length: number | null;
    breadth: number | null;
    height: number | null;

    // Weight calculations
    actualWeight: number | null;
    volumetricWeight: number | null;
    chargeableWeight: number | null;

    // Financial
    shippingCost: number | null;
    rtoCost: number | null;
    codCollectionFee: number | null;
    insuranceFee: number | null;
    fuelSurcharge: number | null;
    totalShippingCost: number | null;
    profitImpact: number | null;

    // COD
    codRemittance: number | null;
    codCollectedAmount: number | null;
    codSettledAmount: number | null;
    codSettlementDate: Date | null;
    codTransactionId: string | null;
    codSettlementStatus: string | null;
    codSettlementReference: string | null;

    // Pickup management
    pickupConfirmedAt: Date | null;
    pickupManifestId: string | null;
    courierAgentName: string | null;

    // Raw data
    providerResponse: Record<string, unknown> | null;
    trackingData: TrackingEvent[] | null;
    cancellationReason: string | null;
    failureReason: string | null;
    createdBy: string | null;

    createdAt: Date;
    updatedAt: Date;
}

// ─── Tracking Event ─────────────────────────────────────────────────────────

export interface TrackingEvent {
    /** ISO-8601 timestamp of the tracking scan */
    timestamp: string;
    /** Shipment status at time of scan */
    status: string;
    /** Human-readable description of the activity */
    activity: string;
    /** City/hub location where the scan occurred */
    location: string;
    /** Detailed remarks from the courier */
    remarks?: string;
    /** Shiprocket-specific status code */
    statusCode?: string;
    /** Shiprocket scan type (e.g. "pickup", "in_transit", "delivered") */
    scanType?: string;
}

// ─── NDR Event ──────────────────────────────────────────────────────────────

export interface NdrEvent {
    id: string;
    shipmentId: string;
    awbNumber: string;
    /** NDR code from Shiprocket (e.g. "CNA", "ODA", "REF") */
    ndrCode: string;
    /** Human-readable reason for non-delivery */
    ndrReason: string;
    /** Date/time of the delivery attempt */
    attemptDate: Date;
    /** Action taken to resolve (e.g. "RE_ATTEMPT", "RTO", "ADDRESS_CORRECTED") */
    actionTaken: string | null;
    /** Date/time the action was taken */
    actionDate: Date | null;
    /** Internal admin notes */
    adminNotes: string | null;
    /** When the NDR was resolved */
    resolvedAt: Date | null;
    createdAt: Date;
}

// ─── Pickup Batch ───────────────────────────────────────────────────────────

export interface PickupBatch {
    /** Unique batch identifier */
    id: string;
    /** Pickup request token/ID from Shiprocket */
    pickupTokenNumber: string;
    /** Origin warehouse/pickup pincode */
    pickupPincode: string;
    /** Scheduled pickup date */
    scheduledDate: Date;
    /** AWB numbers included in this pickup batch */
    waybills: string[];
    /** Current batch status */
    status: PickupBatchStatus;
    /** Courier agent assigned for pickup */
    courierAgentName?: string;
    /** When pickup was actually completed */
    pickedUpAt?: Date;
    /** Number of packages in this batch */
    packageCount: number;
    /** Total weight of the batch in kg */
    totalWeight?: number;
    /** Any remarks from the pickup agent */
    remarks?: string;
    createdAt: Date;
    updatedAt: Date;
}

export enum PickupBatchStatus {
    SCHEDULED = "SCHEDULED",
    AGENT_ASSIGNED = "AGENT_ASSIGNED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    PARTIAL = "PARTIAL",
    CANCELLED = "CANCELLED",
    FAILED = "FAILED",
}
