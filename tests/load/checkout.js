/**
 * k6 Load Test — Checkout Flow
 *
 * Tests: GET /checkout page + POST /api/payment/razorpay (order creation)
 * Simulates users going through the checkout process.
 *
 * NOTE: Requires a valid session cookie for authenticated endpoints.
 *   k6 run -e SESSION_COOKIE="next-auth.session-token=..." tests/load/checkout.js
 *
 * Run: k6 run tests/load/checkout.js
 */

import http from 'k6/http';
import { sleep, check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const checkoutLatency = new Trend('checkout_latency', true);
const razorpayLatency = new Trend('razorpay_order_latency', true);

export const options = {
    // Ramp up gradually — checkout is a critical path
    stages: [
        { duration: '15s', target: 10 },  // warm up
        { duration: '30s', target: 25 },  // ramp to load
        { duration: '15s', target: 0 },   // ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<3000'],
        http_req_failed: ['rate<0.01'],
        checkout_latency: ['p(95)<3000'],
        razorpay_order_latency: ['p(95)<5000'],  // Razorpay API can be slower
        errors: ['rate<0.01'],
    },
};

const BASE_URL = 'https://vastraverse.in';
const SESSION_COOKIE = __ENV.SESSION_COOKIE || '';

export default function () {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    if (SESSION_COOKIE) {
        headers['Cookie'] = SESSION_COOKIE;
    }

    // Step 1: Load checkout page
    const checkoutRes = http.get(`${BASE_URL}/checkout`, {
        headers: { ...headers, Accept: 'text/html' },
        tags: { step: 'checkout-page' },
    });

    const pageOk = check(checkoutRes, {
        'checkout page loads': (r) => r.status === 200 || r.status === 302 || r.status === 401,
        'checkout page time < 3s': (r) => r.timings.duration < 3000,
    });

    checkoutLatency.add(checkoutRes.timings.duration);
    errorRate.add(!pageOk);

    sleep(2); // User reads the page

    // Step 2: Create Razorpay order (simulates clicking "Place Order")
    const orderPayload = {
        amount: 1999,  // ₹19.99 test amount in paise
        currency: 'INR',
        orderData: {
            items: [{ productId: 'test-id', quantity: 1, price: 1999 }],
            total: 1999,
            subtotal: 1999,
            shippingCharges: 0,
            customerName: 'Load Test User',
            customerPhone: '9999999999',
            shippingAddress: '123 Test St, Mumbai',
            shippingState: 'Maharashtra',
        },
    };

    const razorpayRes = http.post(
        `${BASE_URL}/api/payment/razorpay`,
        JSON.stringify(orderPayload),
        { headers, tags: { step: 'create-razorpay-order' } }
    );

    const orderOk = check(razorpayRes, {
        'razorpay order status ok': (r) => r.status === 200 || r.status === 400 || r.status === 401,
        'razorpay order time < 5s': (r) => r.timings.duration < 5000,
    });

    razorpayLatency.add(razorpayRes.timings.duration);
    errorRate.add(!orderOk);

    sleep(1);
}
