/**
 * Scenario: Payment Verify API
 * Tests: POST /api/payment/verify
 *
 * Production safe: Sends intentionally invalid signatures.
 * Tests endpoint resilience, rate limiting, and error handling
 * WITHOUT creating real orders or charging real payments.
 */

import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, jsonHeaders } from '../lib/config.js';
import { paymentVerifyDuration, record, logFailure } from '../lib/metrics.js';

export function paymentVerifyScenario() {
    const payload = JSON.stringify({
        razorpay_order_id: `order_loadtest_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        razorpay_payment_id: `pay_loadtest_${Date.now()}`,
        razorpay_signature: 'invalid_signature_load_test_safe',
        orderData: {
            items: [],
            total: 0,
            subtotal: 0,
            shippingCharges: 0,
        },
    });

    const res = http.post(`${BASE_URL}/api/payment/verify`, payload, {
        headers: jsonHeaders(),
        tags: { scenario: 'payment-verify' },
    });

    // Acceptable: 400 (bad sig), 401 (unauth), 429 (rate limited)
    // Failure: 500, 502, 503, or timeout (status 0)
    const ok = check(res, {
        '[payment-verify] endpoint responds': (r) => r.status !== 0,
        '[payment-verify] no server crash': (r) => r.status < 500,
        '[payment-verify] time < 3s': (r) => r.timings.duration < 3000,
        '[payment-verify] rate limit handled': (r) => r.status !== 503,
    });

    record(paymentVerifyDuration, res, ok);
    logFailure('payment-verify', res);
}
