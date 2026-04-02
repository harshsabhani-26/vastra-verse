/**
 * Shiprocket API – Zod Schemas & TypeScript Types
 *
 * All request/response shapes validated at runtime via Zod.
 * Inferred TS types exported for static type-safety.
 *
 * API Reference: https://apiv2.shiprocket.in/v1/external
 */

import { z } from "zod";

// ─── Common ─────────────────────────────────────────────────────────────────

export const ShiprocketErrorSchema = z.object({
    status_code: z.number().optional(),
    status: z.number().optional(),
    message: z.string(),
    errors: z.record(z.string(), z.array(z.string())).optional(),
});
export type ShiprocketApiError = z.infer<typeof ShiprocketErrorSchema>;

// ─── Auth ───────────────────────────────────────────────────────────────────

export const AuthResponseSchema = z.object({
    id: z.number(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string(),
    company_id: z.number(),
    created_at: z.string(),
    token: z.string(),
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// ─── Serviceability ─────────────────────────────────────────────────────────

export const ServiceabilityRequestSchema = z.object({
    pickupPin: z.string().min(6).max(6),
    deliveryPin: z.string().min(6).max(6),
    weight: z.number().positive(),
    cod: z.boolean(),
});
export type ServiceabilityRequest = z.infer<typeof ServiceabilityRequestSchema>;

export const CourierDataSchema = z.object({
    courier_company_id: z.number(),
    courier_name: z.string(),
    freight_charge: z.number(),
    cod_charges: z.number().optional().default(0),
    coverage_charges: z.number().optional().default(0),
    rate: z.number().optional(),
    estimated_delivery_days: z.string().optional(),
    etd: z.string().optional(),
    min_weight: z.number().optional(),
    charge_weight: z.number().optional(),
    cod: z.number().optional(), // 1 = COD available
    is_surface: z.number().optional(),
    suppress_date: z.string().optional(),
    suppress_text: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postcode: z.string().optional(),
    region: z.number().optional(),
    delivery_performance: z.number().optional(),
    rto_performance: z.number().optional(),
    rating: z.number().optional(),
    blocked: z.number().optional().default(0),
});
export type CourierData = z.infer<typeof CourierDataSchema>;

export const ServiceabilityResponseSchema = z.object({
    status: z.number(),
    message: z.string().optional(),
    data: z.object({
        available_courier_companies: z.array(CourierDataSchema).optional().default([]),
        child_courier_id: z.number().optional().nullable(),
        shiprocket_recommended_courier_id: z.number().optional().nullable(),
    }).optional(),
    currency: z.string().optional(),
});
export type ServiceabilityResponse = z.infer<typeof ServiceabilityResponseSchema>;

// ─── Shipment / Order ───────────────────────────────────────────────────────

export const OrderItemSchema = z.object({
    name: z.string(),
    sku: z.string(),
    units: z.number().int().positive(),
    selling_price: z.number().positive(),
    discount: z.number().optional().default(0),
    tax: z.number().optional().default(0),
    hsn: z.string().optional(),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderCreateRequestSchema = z.object({
    order_id: z.string(),
    order_date: z.string(), // YYYY-MM-DD HH:mm
    pickup_location: z.string(),
    channel_id: z.string().optional(),
    comment: z.string().optional(),

    // Billing
    billing_customer_name: z.string(),
    billing_last_name: z.string().optional().default(""),
    billing_address: z.string(),
    billing_address_2: z.string().optional().default(""),
    billing_city: z.string(),
    billing_pincode: z.string(),
    billing_state: z.string(),
    billing_country: z.string().default("India"),
    billing_email: z.string().email(),
    billing_phone: z.string(),

    // Shipping (if different)
    shipping_is_billing: z.boolean().default(true),
    shipping_customer_name: z.string().optional(),
    shipping_last_name: z.string().optional(),
    shipping_address: z.string().optional(),
    shipping_address_2: z.string().optional(),
    shipping_city: z.string().optional(),
    shipping_pincode: z.string().optional(),
    shipping_state: z.string().optional(),
    shipping_country: z.string().optional(),
    shipping_email: z.string().optional(),
    shipping_phone: z.string().optional(),

    // Items
    order_items: z.array(OrderItemSchema).min(1),

    // Payment
    payment_method: z.enum(["Prepaid", "COD"]),
    sub_total: z.number().positive(),
    shipping_charges: z.number().optional().default(0),
    giftwrap_charges: z.number().optional().default(0),
    transaction_charges: z.number().optional().default(0),
    total_discount: z.number().optional().default(0),

    // Dimensions
    length: z.number().positive(),
    breadth: z.number().positive(),
    height: z.number().positive(),
    weight: z.number().positive(), // in kg
});
export type OrderCreateRequest = z.infer<typeof OrderCreateRequestSchema>;

export const OrderCreateResponseSchema = z.object({
    order_id: z.number(),
    shipment_id: z.number(),
    status: z.string(),
    status_code: z.number(),
    onboarding_completed_now: z.number().optional(),
    awb_code: z.string().optional().nullable(),
    courier_company_id: z.string().optional().nullable(),
    courier_name: z.string().optional().nullable(),
});
export type OrderCreateResponse = z.infer<typeof OrderCreateResponseSchema>;

// ─── AWB Assignment ─────────────────────────────────────────────────────────

export const AssignAwbRequestSchema = z.object({
    shipment_id: z.number(),
    courier_id: z.number().optional(),
    is_return: z.number().optional(),
});
export type AssignAwbRequest = z.infer<typeof AssignAwbRequestSchema>;

export const AssignAwbResponseSchema = z.object({
    awb_assign_status: z.number(),
    response: z.object({
        data: z.object({
            courier_company_id: z.number().optional(),
            courier_name: z.string().optional(),
            awb_code: z.string().optional(),
            cod: z.number().optional(),
            order_id: z.number().optional(),
            shipment_id: z.number().optional(),
            applied_weight: z.number().optional(),
            routing_code: z.string().optional().nullable(),
        }).optional(),
    }).optional(),
});
export type AssignAwbResponse = z.infer<typeof AssignAwbResponseSchema>;

// ─── Label ──────────────────────────────────────────────────────────────────

export const LabelResponseSchema = z.object({
    label_created: z.number().optional(),
    label_url: z.string().optional(),
    response: z.string().optional(),
    not_created: z.array(z.unknown()).optional(),
});
export type LabelResponse = z.infer<typeof LabelResponseSchema>;

// ─── Pickup ─────────────────────────────────────────────────────────────────

export const PickupRequestSchema = z.object({
    shipment_id: z.array(z.number()).min(1),
});
export type PickupRequest = z.infer<typeof PickupRequestSchema>;

export const PickupResponseSchema = z.object({
    pickup_status: z.number().optional(),
    response: z.object({
        pickup_scheduled_date: z.string().optional(),
        pickup_token_number: z.string().optional(),
        status: z.number().optional(),
        others: z.string().optional(),
        pickup_generated_date: z.object({
            date: z.string().optional(),
        }).optional(),
    }).optional(),
});
export type PickupResponse = z.infer<typeof PickupResponseSchema>;

// ─── Cancel ─────────────────────────────────────────────────────────────────

export const CancelResponseSchema = z.object({
    status: z.number().optional(),
    message: z.string().optional(),
});
export type CancelResponse = z.infer<typeof CancelResponseSchema>;

// ─── Tracking ───────────────────────────────────────────────────────────────

export const TrackingActivitySchema = z.object({
    date: z.string(),
    status: z.string(),
    activity: z.string(),
    location: z.string().optional().default(""),
    "sr-status": z.string().optional(),
    "sr-status-label": z.string().optional(),
});
export type TrackingActivity = z.infer<typeof TrackingActivitySchema>;

export const TrackingResponseSchema = z.object({
    tracking_data: z.object({
        track_status: z.number(),
        shipment_status: z.number().optional(),
        shipment_track: z.array(z.object({
            id: z.number(),
            awb_code: z.string(),
            courier_company_id: z.number().optional(),
            shipment_id: z.number().optional(),
            order_id: z.number().optional(),
            pickup_date: z.string().optional().nullable(),
            delivered_date: z.string().optional().nullable(),
            weight: z.string().optional().nullable(),
            packages: z.number().optional(),
            current_status: z.string(),
            delivered_to: z.string().optional().nullable(),
            destination: z.string().optional().nullable(),
            consignee_name: z.string().optional().nullable(),
            origin: z.string().optional().nullable(),
            courier_agent_details: z.string().optional().nullable(),
            edd: z.string().optional().nullable(),
        })).optional(),
        shipment_track_activities: z.array(TrackingActivitySchema).optional(),
        track_url: z.string().optional(),
        etd: z.string().optional(),
        qc_response: z.unknown().optional(),
    }),
});
export type TrackingResponse = z.infer<typeof TrackingResponseSchema>;

// ─── Return Order ───────────────────────────────────────────────────────────

export const ReturnOrderRequestSchema = z.object({
    order_id: z.string(),
    order_date: z.string(),
    channel_id: z.number().optional(),
    pickup_customer_name: z.string(),
    pickup_last_name: z.string().optional().default(""),
    pickup_address: z.string(),
    pickup_address_2: z.string().optional().default(""),
    pickup_city: z.string(),
    pickup_state: z.string(),
    pickup_country: z.string().default("India"),
    pickup_pincode: z.string(),
    pickup_email: z.string().email(),
    pickup_phone: z.string(),

    shipping_customer_name: z.string().optional(),
    shipping_last_name: z.string().optional(),
    shipping_address: z.string().optional(),
    shipping_address_2: z.string().optional(),
    shipping_city: z.string().optional(),
    shipping_state: z.string().optional(),
    shipping_country: z.string().optional(),
    shipping_pincode: z.string().optional(),
    shipping_email: z.string().optional(),
    shipping_phone: z.string().optional(),

    order_items: z.array(OrderItemSchema).min(1),

    payment_method: z.literal("Prepaid").default("Prepaid"),
    sub_total: z.number(),
    length: z.number().positive(),
    breadth: z.number().positive(),
    height: z.number().positive(),
    weight: z.number().positive(),
});
export type ReturnOrderRequest = z.infer<typeof ReturnOrderRequestSchema>;

export const ReturnOrderResponseSchema = z.object({
    order_id: z.number(),
    shipment_id: z.number(),
    status: z.string(),
    status_code: z.number(),
    awb_code: z.string().optional().nullable(),
    courier_company_id: z.string().optional().nullable(),
    courier_name: z.string().optional().nullable(),
});
export type ReturnOrderResponse = z.infer<typeof ReturnOrderResponseSchema>;
