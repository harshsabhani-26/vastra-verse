/**
 * Shiprocket API Integration Service
 * 
 * Production-grade shipping provider service with:
 * - JWT authentication with auto-refresh
 * - Shipment creation and tracking
 * - Pickup scheduling
 * - Return shipment support
 * - Test/Live mode support
 * - Retry logic and error handling
 */

// Environment configuration
const SHIPROCKET_CONFIG = {
    test: {
        baseUrl: "https://apiv2.shiprocket.in/v1/external",
        authUrl: "https://apiv2.shiprocket.in/v1/external/auth/login"
    },
    live: {
        baseUrl: "https://apiv2.shiprocket.in/v1/external",
        authUrl: "https://apiv2.shiprocket.in/v1/external/auth/login"
    }
};

// Type definitions
interface ShiprocketAuthResponse {
    token: string;
    expires_at?: string;
}

interface ShipmentCreateParams {
    orderId: string;
    orderNumber: string;
    orderDate: string;
    pickupLocation: string;
    billingCustomerName: string;
    billingLastName: string;
    billingAddress: string;
    billingCity: string;
    billingState: string;
    billingPincode: string;
    billingCountry: string;
    billingEmail: string;
    billingPhone: string;
    shippingIsBilling: boolean;
    shippingCustomerName?: string;
    shippingLastName?: string;
    shippingAddress?: string;
    shippingCity?: string;
    shippingState?: string;
    shippingPincode?: string;
    shippingCountry?: string;
    shippingEmail?: string;
    shippingPhone?: string;
    orderItems: Array<{
        name: string;
        sku: string;
        units: number;
        selling_price: number;
        discount?: number;
        tax?: number;
        hsn?: number;
    }>;
    paymentMethod: "Prepaid" | "COD";
    subTotal: number;
    length: number;
    breadth: number;
    height: number;
    weight: number;
}

// Enhanced interfaces for cost tracking
interface ServiceabilityResponse {
    courier_id: number;
    courier_name: string;
    rate: number;
    currency: string;
    delivery_time: string;
    etd: string;
    cod: number; // COD charges?
    shipping_cost: number; // More explicit if available
}

interface ShipmentCreateResponse {
    shipment_id: number;
    status: string;
    status_code: number;
    onboarding_completed_now: boolean;
    order_id: number;
    awb_code?: string;
    courier_name?: string;
    label_url?: string;
    // Capture any additional cost info if provided by API immediately
    response_payload?: any;
}

interface TrackingResponse {
    tracking_data: {
        track_status: number;
        shipment_status: string;
        shipment_track: Array<{
            id: number;
            awb_code: string;
            courier_name: string;
            current_status: string;
            destination: string;
            origin: string;
            delivered_date?: string;
            delivered_to?: string;
            edd?: string;
            shipment_track_activities: Array<{
                date: string;
                activity: string;
                location: string;
                sr_status?: string;
                sr_status_label?: string;
            }>;
        }>;
    };
}

interface PickupScheduleResponse {
    pickup_scheduled_date: string;
    pickup_token_number: string;
    status: string;
    response: {
        pickup_scheduled_date: string;
        pickup_token_number: string;
    };
}

// Token cache (in-memory)
let authToken: string | null = null;
let tokenExpiryTime: number = 0;

/**
 * Get authentication token (with auto-refresh)
 */
async function getAuthToken(): Promise<string> {
    const now = Date.now();

    // Return cached token if still valid (with 1 hour buffer)
    if (authToken && tokenExpiryTime > now + 3600000) {
        return authToken;
    }

    // Refresh token
    const mode = (process.env.SHIPPING_MODE || "test") as "test" | "live";
    const config = SHIPROCKET_CONFIG[mode];

    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;

    if (!email || !password) {
        throw new Error("Shiprocket credentials not configured in environment variables");
    }

    try {
        const response = await fetch(config.authUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password }),
            signal: AbortSignal.timeout(10000) // 10-second timeout for auth
        });

        if (!response.ok) {
            throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
        }

        const data: ShiprocketAuthResponse = await response.json();

        authToken = data.token;
        // Token expires in 10 days, store expiry time
        tokenExpiryTime = now + (10 * 24 * 60 * 60 * 1000);

        console.log("[Shiprocket] Authentication successful, token expires in 10 days");

        return authToken;
    } catch (error) {
        console.error("[Shiprocket] Authentication error:", error);
        throw new Error("Failed to authenticate with Shiprocket API");
    }
}

/**
 * Make authenticated API request with retry logic
 */
async function makeApiRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 3
): Promise<T> {
    const mode = (process.env.SHIPPING_MODE || "test") as "test" | "live";
    const config = SHIPROCKET_CONFIG[mode];
    const url = `${config.baseUrl}${endpoint}`;

    for (let i = 0; i < retries; i++) {
        try {
            const token = await getAuthToken();

            const response = await fetch(url, {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                    ...options.headers
                },
                signal: AbortSignal.timeout(15000) // 15-second timeout
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));

                // If unauthorized, clear token and retry
                if (response.status === 401 && i < retries - 1) {
                    console.log("[Shiprocket] Token expired, refreshing...");
                    authToken = null;
                    tokenExpiryTime = 0;
                    continue;
                }

                throw new Error(
                    `Shiprocket API error: ${response.status} - ${errorData.message || errorData.errors || response.statusText}`
                );
            }

            return await response.json();
        } catch (error: any) {
            // If last retry, throw the error
            if (i === retries - 1) {
                console.error(`[Shiprocket] API request failed after ${retries} attempts:`, error);
                throw error;
            }

            // Exponential backoff
            const delay = Math.min(1000 * Math.pow(2, i), 5000);
            console.log(`[Shiprocket] Retry ${i + 1}/${retries} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw new Error("Failed to complete API request");
}

/**
 * Create a new shipment
 */
export async function createShipment(params: ShipmentCreateParams): Promise<ShipmentCreateResponse> {
    console.log("[Shiprocket] Creating shipment for order:", params.orderNumber);

    const response = await makeApiRequest<any>("/orders/create/adhoc", {
        method: "POST",
        body: JSON.stringify(params)
    });

    console.log("[Shiprocket] Shipment created:", {
        shipmentId: response.shipment_id,
        orderId: response.order_id,
        awb: response.awb_code
    });

    // Return the full response for logging/storage
    return {
        ...response,
        response_payload: response
    };
}

/**
 * Generate AWB for a shipment
 */
export async function generateAWB(shipmentId: number, courierId?: number): Promise<{
    awb_assign_status: number;
    awb_code: string;
    courier_name: string;
    courier_id: number;
    response: {
        data: {
            awb_code: string;
            courier_name: string;
            label_url?: string;
        };
    };
}> {
    console.log("[Shiprocket] Generating AWB for shipment:", shipmentId);

    const body: any = { shipment_id: shipmentId };
    if (courierId) {
        body.courier_id = courierId;
    }

    const response = await makeApiRequest<any>("/courier/assign/awb", {
        method: "POST",
        body: JSON.stringify(body)
    });

    console.log("[Shiprocket] AWB generated:", response.awb_code);

    return response;
}

/**
 * Schedule pickup for a shipment
 */
export async function schedulePickup(shipmentId: number): Promise<PickupScheduleResponse> {
    console.log("[Shiprocket] Scheduling pickup for shipment:", shipmentId);

    const response = await makeApiRequest<PickupScheduleResponse>("/courier/generate/pickup", {
        method: "POST",
        body: JSON.stringify({ shipment_id: [shipmentId] })
    });

    console.log("[Shiprocket] Pickup scheduled:", response.pickup_scheduled_date);

    return response;
}

/**
 * Track a shipment by AWB number
 */
export async function trackShipment(awb: string): Promise<TrackingResponse> {
    console.log("[Shiprocket] Tracking shipment:", awb);

    const response = await makeApiRequest<TrackingResponse>(`/courier/track/awb/${awb}`, {
        method: "GET"
    });

    return response;
}

/**
 * Cancel a shipment
 */
export async function cancelShipment(awbNumbers: string[]): Promise<{
    message: string;
}> {
    console.log("[Shiprocket] Cancelling shipment(s):", awbNumbers);

    const response = await makeApiRequest<any>("/orders/cancel/shipment/awbs", {
        method: "POST",
        body: JSON.stringify({ awbs: awbNumbers })
    });

    console.log("[Shiprocket] Shipment(s) cancelled");

    return response;
}

/**
 * Create return pickup
 */
export async function createReturnPickup(params: {
    orderId: string;
    orderNumber: string;
    pickupCustomerName: string;
    pickupLastName: string;
    pickupAddress: string;
    pickupCity: string;
    pickupState: string;
    pickupPincode: string;
    pickupCountry: string;
    pickupEmail: string;
    pickupPhone: string;
    pickupDate: string;
    returnItems: Array<{
        name: string;
        sku: string;
        units: number;
        selling_price: number;
    }>;
    length: number;
    breadth: number;
    height: number;
    weight: number;
}): Promise<{
    shipment_id: number;
    awb_code?: string;
    courier_name?: string;
}> {
    console.log("[Shiprocket] Creating return pickup for order:", params.orderNumber);

    const response = await makeApiRequest<any>("/orders/create/return", {
        method: "POST",
        body: JSON.stringify(params)
    });

    console.log("[Shiprocket] Return pickup created:", response.shipment_id);

    return response;
}

/**
 * Get shipping label URL
 */
export async function getShippingLabel(shipmentIds: number[]): Promise<{
    label_url: string;
}> {
    console.log("[Shiprocket] Generating label for shipments:", shipmentIds);

    const response = await makeApiRequest<any>("/courier/generate/label", {
        method: "POST",
        body: JSON.stringify({ shipment_id: shipmentIds })
    });

    console.log("[Shiprocket] Label generated:", response.label_url);

    return response;
}
/**
 * Check serviceability for a pincode
 */
export async function checkServiceability(params: {
    pickupPostcode: string;
    deliveryPostcode: string;
    weight: string;
    cod: boolean;
}): Promise<{
    courier_id: number;
    courier_name: string;
    rate: number;
    mode: number;
    min_weight: number;
    rating: number;
    etd: string;
    estimated_delivery_days: string;
    charge_weight: number;
}[]> {
    console.log("[Shiprocket] Checking serviceability:", params);

    const qs = new URLSearchParams({
        pickup_postcode: params.pickupPostcode,
        delivery_postcode: params.deliveryPostcode,
        weight: params.weight,
        cod: params.cod ? "1" : "0"
    }).toString();

    const response = await makeApiRequest<any>(`/courier/serviceability?${qs}`, {
        method: "GET"
    });

    if (response.status === 200 && response.data && response.data.available_courier_companies) {
        return response.data.available_courier_companies;
    }

    return [];
}
