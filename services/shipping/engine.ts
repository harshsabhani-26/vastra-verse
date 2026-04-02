/**
 * Shipping Engine Service
 * 
 * Core logic for:
 * - Address validation (pincode/state matching)
 * - Weight calculations (volumetric vs actual)
 * - Cost estimation
 * - Courier selection based on performance
 */

import prisma from "@/lib/prisma";
import { checkServiceability } from "@/lib/shiprocket/serviceability";

// Indian State-Pincode mapping (first 2 digits)
const PINCODE_STATE_MAP: Record<string, string> = {
    "11": "Delhi",
    "12": "Haryana",
    "13": "Punjab",
    "14": "Punjab",
    "15": "Punjab",
    "16": "Punjab",
    "17": "Himachal Pradesh",
    "18": "Jammu and Kashmir",
    "19": "Jammu and Kashmir",
    "20": "Uttar Pradesh",
    "21": "Uttar Pradesh",
    "22": "Uttar Pradesh",
    "23": "Uttar Pradesh",
    "24": "Uttar Pradesh",
    "25": "Uttar Pradesh",
    "26": "Rajasthan",
    "27": "Rajasthan",
    "28": "Rajasthan",
    "30": "Rajasthan",
    "31": "Rajasthan",
    "32": "Himachal Pradesh",
    "33": "Punjab",
    "34": "Rajasthan",
    "36": "Madhya Pradesh",
    "37": "Madhya Pradesh",
    "38": "Gujarat",
    "39": "Gujarat",
    "40": "Maharashtra",
    "41": "Maharashtra",
    "42": "Maharashtra",
    "43": "Maharashtra",
    "44": "Maharashtra",
    "45": "Goa",
    "46": "Karnataka",
    "47": "Karnataka",
    "48": "Karnataka",
    "49": "Karnataka",
    "50": "Andhra Pradesh",
    "51": "Andhra Pradesh",
    "52": "Andhra Pradesh",
    "53": "Andhra Pradesh",
    "56": "Tamil Nadu",
    "57": "Tamil Nadu",
    "58": "Tamil Nadu",
    "59": "Tamil Nadu",
    "60": "Tamil Nadu",
    "61": "Tamil Nadu",
    "62": "Tamil Nadu",
    "63": "Tamil Nadu",
    "64": "Tamil Nadu",
    "67": "Kerala",
    "68": "Kerala",
    "69": "Kerala",
    "70": "West Bengal",
    "71": "West Bengal",
    "72": "West Bengal",
    "73": "West Bengal",
    "74": "West Bengal",
    "75": "Bihar",
    "76": "Bihar",
    "77": "Jharkhand",
    "78": "Assam",
    "79": "Assam",
    "80": "Odisha",
    "81": "Odisha",
    "82": "Chhattisgarh",
    "83": "Madhya Pradesh",
    "84": "Andhra Pradesh",
    "85": "Andhra Pradesh",
};

interface AddressValidationResult {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
}

interface WeightCalculation {
    actualWeight: number;
    volumetricWeight: number;
    chargeableWeight: number;
}

interface CourierOption {
    courierId: number;
    courierName: string;
    rate: number;
    estimatedDays: string;
    score?: number; // Performance score from our DB
}

/**
 * Validate shipping address
 */
export function validateAddress(params: {
    pincode: string;
    state: string;
    phone: string;
}): AddressValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Pincode validation
    const pincodePattern = /^\d{6}$/;
    if (!pincodePattern.test(params.pincode)) {
        errors.push("Invalid pincode format. Must be 6 digits.");
    } else {
        // Check state-pincode match
        const prefix = params.pincode.substring(0, 2);
        const expectedState = PINCODE_STATE_MAP[prefix];

        if (expectedState && expectedState.toLowerCase() !== params.state.toLowerCase()) {
            errors.push(`Pincode ${params.pincode} does not match state ${params.state}. Expected: ${expectedState}`);
        }
    }

    // 2. Phone validation
    const phonePattern = /^[6-9]\d{9}$/;
    if (!phonePattern.test(params.phone.replace(/[\s\-]/g, ""))) {
        errors.push("Invalid phone number format. Must be a 10-digit Indian mobile number.");
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined
    };
}

/**
 * Calculate volumetric and chargeable weight
 */
export function calculateWeight(params: {
    actualWeight: number; // in kg
    length: number; // in cm
    breadth: number; // in cm
    height: number; // in cm
}): WeightCalculation {
    // Volumetric weight formula: (L × B × H) / 5000
    const volumetricWeight = (params.length * params.breadth * params.height) / 5000;

    // Chargeable weight is the maximum of actual and volumetric
    const chargeableWeight = Math.max(params.actualWeight, volumetricWeight);

    return {
        actualWeight: params.actualWeight,
        volumetricWeight: parseFloat(volumetricWeight.toFixed(2)),
        chargeableWeight: parseFloat(chargeableWeight.toFixed(2))
    };
}

/**
 * Get best courier based on serviceability and performance
 */
export async function selectBestCourier(params: {
    pickupPincode: string;
    deliveryPincode: string;
    weight: number;
    isCOD: boolean;
}): Promise<CourierOption | null> {
    try {
        // Check Shiprocket serviceability for this route
        const result = await checkServiceability(
            params.pickupPincode,
            params.deliveryPincode,
            params.weight, // Shiprocket expects kg
            params.isCOD
        );

        if (!result.serviceable) {
            console.error("[ShippingEngine] Route not serviceable via Shiprocket");
            return null;
        }

        if (params.isCOD && !result.codAvailable) {
            console.error("[ShippingEngine] COD not available for this route");
            return null;
        }

        // Return best available courier from Shiprocket
        const bestCourier = result.couriers[0];
        return {
            courierId: bestCourier?.id || 0,
            courierName: bestCourier?.name || "Shiprocket",
            rate: bestCourier?.freightCharge || 0,
            estimatedDays: bestCourier?.estimatedDays || "3-5 business days",
            score: 100,
        };

    } catch (error) {
        console.error("[ShippingEngine] Error selecting courier:", error);
        return null;
    }
}

/**
 * Estimate shipping cost for an order
 */
export async function estimateShippingCost(params: {
    pickupPincode: string;
    deliveryPincode: string;
    weight: number;
    length: number;
    breadth: number;
    height: number;
    isCOD: boolean;
}): Promise<{
    courier: CourierOption | null;
    weightBreakdown: WeightCalculation;
    estimatedCost: number;
} | null> {
    // Calculate weight
    const weightBreakdown = calculateWeight({
        actualWeight: params.weight,
        length: params.length,
        breadth: params.breadth,
        height: params.height
    });

    // Select best courier using chargeable weight
    const courier = await selectBestCourier({
        pickupPincode: params.pickupPincode,
        deliveryPincode: params.deliveryPincode,
        weight: weightBreakdown.chargeableWeight,
        isCOD: params.isCOD
    });

    if (!courier) {
        return null;
    }

    return {
        courier,
        weightBreakdown,
        estimatedCost: courier.rate
    };
}
