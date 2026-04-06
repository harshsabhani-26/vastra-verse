/**
 * Razorpay Payment Gateway Integration
 * Handles payment creation, verification, and refunds
 */

import crypto from 'crypto';

export interface RazorpayConfig {
    keyId: string;
    keySecret: string;
    isTestMode: boolean;
}

export interface CreateOrderOptions {
    amount: number; // in paise (smallest currency unit)
    currency?: string;
    receipt?: string;
    notes?: Record<string, any>;
}

export interface CreateOrderResponse {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    attempts: number;
    notes: Record<string, any>;
    created_at: number;
}

export interface VerifyPaymentOptions {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}

export interface RefundOptions {
    paymentId: string;
    amount?: number; // in paise, if not provided, full refund
    notes?: Record<string, any>;
}

export interface RefundResponse {
    id: string;
    entity: string;
    amount: number;
    currency: string;
    payment_id: string;
    notes: Record<string, any>;
    receipt: string | null;
    acquirer_data: {
        arn: string | null;
    };
    created_at: number;
    batch_id: string | null;
    status: string;
    speed_processed: string;
    speed_requested: string;
}

/**
 * Create Razorpay instance
 */
function getRazorpayInstance(config: RazorpayConfig) {
    // In production, use the razorpay npm package
    // For now, we'll use direct API calls
    return {
        keyId: config.keyId,
        keySecret: config.keySecret,
        baseUrl: config.isTestMode
            ? 'https://api.razorpay.com/v1'
            : 'https://api.razorpay.com/v1',
    };
}

/**
 * Make authenticated API request to Razorpay
 */
async function makeRazorpayRequest(
    config: RazorpayConfig,
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any
): Promise<any> {
    const instance = getRazorpayInstance(config);
    const auth = Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64');

    const response = await fetch(`${instance.baseUrl}${endpoint}`, {
        method,
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10-second timeout
        ...(body && { body: JSON.stringify(body) }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.description || 'Razorpay API error');
    }

    return response.json();
}

/**
 * Create a new order in Razorpay
 */
export async function createRazorpayOrder(
    config: RazorpayConfig,
    options: CreateOrderOptions
): Promise<CreateOrderResponse> {
    const orderData = {
        amount: options.amount,
        currency: options.currency || 'INR',
        receipt: options.receipt || `receipt_${Date.now()}`,
        notes: options.notes || {},
    };

    return makeRazorpayRequest(config, '/orders', 'POST', orderData);
}

/**
 * Verify Razorpay payment signature
 */
export function verifyRazorpaySignature(
    config: RazorpayConfig,
    options: VerifyPaymentOptions
): boolean {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = options;

    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
        .createHmac('sha256', config.keySecret)
        .update(text)
        .digest('hex');

    return expectedSignature === razorpaySignature;
}

/**
 * Fetch payment details from Razorpay
 */
export async function fetchPaymentDetails(
    config: RazorpayConfig,
    paymentId: string
): Promise<any> {
    return makeRazorpayRequest(config, `/payments/${paymentId}`);
}

/**
 * Create a refund
 */
export async function createRefund(
    config: RazorpayConfig,
    options: RefundOptions
): Promise<RefundResponse> {
    const refundData: any = {
        ...(options.amount && { amount: options.amount }),
        ...(options.notes && { notes: options.notes }),
    };

    return makeRazorpayRequest(
        config,
        `/payments/${options.paymentId}/refund`,
        'POST',
        refundData
    );
}

/**
 * Fetch refund details
 */
export async function fetchRefundDetails(
    config: RazorpayConfig,
    refundId: string
): Promise<RefundResponse> {
    return makeRazorpayRequest(config, `/refunds/${refundId}`);
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
    webhookSecret: string,
    payload: string,
    signature: string
): boolean {
    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

    return expectedSignature === signature;
}

/**
 * Convert rupees to paise (smallest unit)
 */
export function rupeesToPaise(rupees: number): number {
    return Math.round(rupees * 100);
}

/**
 * Convert paise to rupees
 */
export function paiseToRupees(paise: number): number {
    return paise / 100;
}

/**
 * Get payment status display
 */
export function getPaymentStatusDisplay(status: string): {
    label: string;
    color: string;
} {
    const statusMap: Record<string, { label: string; color: string }> = {
        'created': { label: 'Created', color: 'blue' },
        'authorized': { label: 'Authorized', color: 'yellow' },
        'captured': { label: 'Captured', color: 'green' },
        'refunded': { label: 'Refunded', color: 'purple' },
        'failed': { label: 'Failed', color: 'red' },
    };

    return statusMap[status] || { label: status, color: 'gray' };
}

/**
 * Generate Razorpay checkout options for frontend
 */
export function generateCheckoutOptions(order: {
    orderId: string;
    amount: number;
    currency: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
}) {
    return {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Vastraa Verse',
        description: 'Order Payment',
        order_id: order.orderId,
        prefill: {
            name: order.customerName,
            email: order.customerEmail,
            contact: order.customerPhone,
        },
        theme: {
            color: '#1C1917',
        },
    };
}
