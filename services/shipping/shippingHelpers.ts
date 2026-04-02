/**
 * Shipping Helpers
 *
 * Pure utility functions used across the shipping service layer.
 * No side effects — no DB calls, no API calls, no Redis.
 */

import { ShipmentStatus } from "@prisma/client";

// ─── Types ──────────────────────────────────────────────────────────────────

interface OrderItem {
    weight?: number | { toNumber(): number } | null;
    quantity: number;
}

interface AddressInput {
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    phone?: string | null;
    email?: string | null;
    country?: string | null;
}

export interface ShiprocketAddress {
    billing_customer_name: string;
    billing_last_name: string;
    billing_address: string;
    billing_address_2: string;
    billing_city: string;
    billing_state: string;
    billing_pincode: string;
    billing_phone: string;
    billing_email: string;
    billing_country: string;
}

// ─── Weight Calculation ─────────────────────────────────────────────────────

const DEFAULT_ITEM_WEIGHT_KG = 0.3;
const MIN_SHIPMENT_WEIGHT_KG = 0.5;

/**
 * Calculate total shipment weight from order items.
 * Falls back to DEFAULT_ITEM_WEIGHT_KG per item if weight is not set.
 * Ensures minimum weight of MIN_SHIPMENT_WEIGHT_KG.
 */
export function calculateTotalWeight(items: OrderItem[]): number {
    let totalWeight = 0;

    for (const item of items) {
        const qty = item.quantity || 1;
        let itemWeight = DEFAULT_ITEM_WEIGHT_KG;

        if (item.weight != null) {
            itemWeight =
                typeof item.weight === "number"
                    ? item.weight
                    : item.weight.toNumber();
        }

        totalWeight += itemWeight * qty;
    }

    // Shiprocket requires minimum 0.5 kg
    return Math.max(totalWeight, MIN_SHIPMENT_WEIGHT_KG);
}

// ─── Address Formatter ──────────────────────────────────────────────────────

/**
 * Normalise an internal address into Shiprocket's billing/shipping format.
 */
export function formatShiprocketAddress(address: AddressInput): ShiprocketAddress {
    const names = splitName(address.fullName, address.firstName, address.lastName);

    return {
        billing_customer_name: names.firstName,
        billing_last_name: names.lastName,
        billing_address: address.addressLine1 || "",
        billing_address_2: address.addressLine2 || "",
        billing_city: address.city || "",
        billing_state: address.state || "",
        billing_pincode: address.pincode || "",
        billing_phone: sanitisePhone(address.phone || ""),
        billing_email: address.email || "",
        billing_country: address.country || "India",
    };
}

// ─── Status Guards ──────────────────────────────────────────────────────────

/** Statuses that are terminal — cannot be changed further. */
const TERMINAL_STATUSES: Set<ShipmentStatus> = new Set([
    "DELIVERED",
    "RTO_DELIVERED",
    "CANCELLED",
    "RETURN_DELIVERED",
]);

/** Statuses where cancellation is still possible. */
const CANCELLABLE_STATUSES: Set<ShipmentStatus> = new Set([
    "PENDING",
    "READY_TO_SHIP",
    "LABEL_GENERATED",
    "PICKUP_SCHEDULED",
]);

/**
 * Check if a shipment in the given status can be cancelled.
 */
export function isStatusCancellable(status: ShipmentStatus): boolean {
    return CANCELLABLE_STATUSES.has(status);
}

/**
 * Check if the given status is terminal (no further transitions).
 */
export function isTerminalStatus(status: ShipmentStatus): boolean {
    return TERMINAL_STATUSES.has(status);
}

/**
 * Statuses considered "active" — shipment is still in progress.
 */
export const ACTIVE_STATUSES: ShipmentStatus[] = [
    "READY_TO_SHIP",
    "LABEL_GENERATED",
    "PICKUP_SCHEDULED",
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERY_ATTEMPTED",
    "NDR_RAISED",
];

// ─── Internal Helpers ───────────────────────────────────────────────────────

function splitName(
    fullName?: string | null,
    firstName?: string | null,
    lastName?: string | null
): { firstName: string; lastName: string } {
    if (firstName) {
        return {
            firstName: firstName.trim(),
            lastName: (lastName || "").trim() || ".",
        };
    }

    if (fullName) {
        const parts = fullName.trim().split(/\s+/);
        return {
            firstName: parts[0] || "Customer",
            lastName: parts.slice(1).join(" ") || ".",
        };
    }

    return { firstName: "Customer", lastName: "." };
}

function sanitisePhone(phone: string): string {
    // Strip everything except digits
    const digits = phone.replace(/\D/g, "");

    // Remove leading 91 country code if present and length > 10
    if (digits.length > 10 && digits.startsWith("91")) {
        return digits.slice(2);
    }

    return digits.slice(-10) || "0000000000";
}
