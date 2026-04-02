/**
 * Shiprocket – Serviceability Check
 *
 * Checks whether a delivery pincode is serviceable, lists available
 * courier partners, and whether COD is available.
 * Results are cached in Upstash Redis for 24 hours via lib/cache.ts.
 */

import { shiprocketGet, ShiprocketClientError } from "./client";
import {
    ServiceabilityRequestSchema,
    ServiceabilityResponseSchema,
    type ServiceabilityRequest,
    type ServiceabilityResponse,
    type CourierData,
} from "./types";
import { cache } from "@/lib/cache";
import { logInfo, logError } from "@/lib/logger";

// ─── Cache Config ───────────────────────────────────────────────────────────

const CACHE_TTL_SECONDS = 86_400; // 24 hours
const CACHE_PREFIX = "shiprocket:serviceability";

function cacheKey(req: ServiceabilityRequest): string {
    return `${CACHE_PREFIX}:${req.pickupPin}:${req.deliveryPin}:${req.weight}:${req.cod}`;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ServiceabilityResult {
    /** Whether the route is serviceable */
    serviceable: boolean;
    /** Whether COD is available on this route */
    codAvailable: boolean;
    /** Recommended courier by Shiprocket */
    recommendedCourierId: number | null;
    /** Available courier companies sorted by rate */
    couriers: CourierSummary[];
    /** Cheapest available rate */
    cheapestRate: number | null;
    /** Fastest estimated delivery days */
    fastestDeliveryDays: string | null;
    /** Raw API response for debugging */
    raw: ServiceabilityResponse;
}

export interface CourierSummary {
    id: number;
    name: string;
    freightCharge: number;
    codCharges: number;
    estimatedDays: string | null;
    rating: number | null;
    isCodAvailable: boolean;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Check if a delivery pincode is serviceable from a given pickup pincode.
 *
 * @param pickupPin   - 6-digit origin pincode
 * @param deliveryPin - 6-digit destination pincode
 * @param weight      - Package weight in kg
 * @param cod         - Whether COD payment is required
 * @returns Structured serviceability result with available couriers
 *
 * @throws {ShiprocketClientError} on API failure
 * @throws {z.ZodError} on response validation failure
 */
export async function checkServiceability(
    pickupPin: string,
    deliveryPin: string,
    weight: number,
    cod: boolean
): Promise<ServiceabilityResult> {
    // 1. Validate inputs
    const input = ServiceabilityRequestSchema.parse({
        pickupPin,
        deliveryPin,
        weight,
        cod,
    });

    // 2. Check cache
    const key = cacheKey(input);
    const cached = await cache.get<ServiceabilityResult>(key);
    if (cached) {
        logInfo("SHIPROCKET", "Serviceability cache hit", { key });
        return cached;
    }

    // 3. Call Shiprocket API
    logInfo("SHIPROCKET", "Checking serviceability", { pickupPin, deliveryPin, weight, cod });

    const rawResponse = await shiprocketGet<unknown>(
        `/courier/serviceability/`,
        {
            params: {
                pickup_postcode: pickupPin,
                delivery_postcode: deliveryPin,
                weight,
                cod: cod ? 1 : 0,
            },
        }
    );

    // 4. Validate response
    const parsed = ServiceabilityResponseSchema.parse(rawResponse);

    // 5. Transform to structured result
    const result = transformServiceabilityResponse(parsed, cod);

    // 6. Cache the result (non-blocking)
    cache.set(key, result, CACHE_TTL_SECONDS).catch((err: unknown) => {
        logError("SHIPROCKET", err, { operation: "cache_set", key });
    });

    return result;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function transformServiceabilityResponse(
    response: ServiceabilityResponse,
    codRequired: boolean
): ServiceabilityResult {
    // If the API returns a 404 wrapper (e.g. invalid pincode), data is undefined.
    if (!response.data || response.status === 404) {
        return {
            serviceable: false,
            codAvailable: false,
            recommendedCourierId: null,
            couriers: [],
            cheapestRate: null,
            fastestDeliveryDays: null,
            raw: response,
        };
    }

    const companies = response.data.available_courier_companies || [];

    if (companies.length === 0) {
        return {
            serviceable: false,
            codAvailable: false,
            recommendedCourierId: null,
            couriers: [],
            cheapestRate: null,
            fastestDeliveryDays: null,
            raw: response,
        };
    }

    // Filter out blocked couriers
    const activeCouriers = companies.filter((c: CourierData) => c.blocked !== 1);

    const couriers: CourierSummary[] = activeCouriers
        .map((c: CourierData) => ({
            id: c.courier_company_id,
            name: c.courier_name,
            freightCharge: c.freight_charge,
            codCharges: c.cod_charges || 0,
            estimatedDays: c.estimated_delivery_days || c.etd || null,
            rating: c.rating ?? null,
            isCodAvailable: c.cod === 1,
        }))
        .sort((a: CourierSummary, b: CourierSummary) => a.freightCharge - b.freightCharge);

    const codAvailable = codRequired
        ? couriers.some((c: CourierSummary) => c.isCodAvailable)
        : couriers.length > 0;

    return {
        serviceable: couriers.length > 0,
        codAvailable,
        recommendedCourierId: response.data.shiprocket_recommended_courier_id ?? null,
        couriers,
        cheapestRate: couriers.length > 0 ? couriers[0].freightCharge : null,
        fastestDeliveryDays: couriers.length > 0 ? couriers[0].estimatedDays : null,
        raw: response,
    };
}
