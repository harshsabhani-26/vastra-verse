/**
 * Scenario: Checkout API
 * Tests: GET /checkout page + POST /api/payment/razorpay (order creation)
 *
 * Production safe: Uses realistic payloads but requires auth.
 * Without SESSION_COOKIE, tests the unauthenticated redirect behavior.
 */

import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, htmlHeaders, jsonHeaders } from '../lib/config.js';
import { checkoutDuration, record, logFailure } from '../lib/metrics.js';

export function checkoutScenario() {
    // Step 1: Load checkout page
    const pageRes = http.get(`${BASE_URL}/checkout`, {
        headers: htmlHeaders(),
        tags: { scenario: 'checkout', step: 'page' },
    });

    const pageOk = check(pageRes, {
        '[checkout] page responds': (r) => r.status !== 0 && r.status < 500,
        '[checkout] page time < 3s': (r) => r.timings.duration < 3000,
        // 200 = loaded, 302 = redirect to login (unauthenticated), both are valid
        '[checkout] expected status': (r) => [200, 302, 307, 308].includes(r.status),
    });

    record(checkoutDuration, pageRes, pageOk);
    logFailure('checkout-page', pageRes);

    // Step 2: Hit Razorpay order creation API
    // This tests the API layer — will return 401 without auth, which is expected
    const orderPayload = JSON.stringify({
        amount: 49900,  // ₹499 in paise
        currency: 'INR',
        orderData: {
            items: [{ productId: 'load-test-product', quantity: 1, price: 49900 }],
            total: 49900,
            subtotal: 49900,
            shippingCharges: 0,
            discount: 0,
            customerName: 'Load Test',
            customerPhone: '9000000000',
            shippingAddress: '1 Test Lane, Mumbai',
            shippingState: 'Maharashtra',
        },
    });

    const apiRes = http.post(`${BASE_URL}/api/payment/razorpay`, orderPayload, {
        headers: jsonHeaders(),
        tags: { scenario: 'checkout', step: 'razorpay-order' },
    });

    const apiOk = check(apiRes, {
        '[checkout-api] responds': (r) => r.status !== 0,
        '[checkout-api] no 5xx': (r) => r.status < 500,
        '[checkout-api] time < 5s': (r) => r.timings.duration < 5000,
    });

    logFailure('checkout-api', apiRes);
}
