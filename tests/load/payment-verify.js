/**
 * k6 Load Test — Payment Verify API
 *
 * Tests: POST /api/payment/verify
 * Simulates the payment verification endpoint under load.
 *
 * NOTE: This test intentionally sends INVALID signatures to avoid
 * creating real orders. It validates the endpoint handles load
 * correctly and returns proper error responses.
 *
 * Run: k6 run tests/load/payment-verify.js
 */

import http from 'k6/http';
import { sleep, check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const verifyLatency = new Trend('verify_latency', true);

export const options = {
    // Conservative — payment verify is rate-limited (3 req/min per IP)
    // Use fewer VUs to avoid triggering rate limits
    vus: 5,
    duration: '60s',
    thresholds: {
        http_req_duration: ['p(95)<3000'],
        // Rate limit (429) and auth errors (401) are expected — not failures
        errors: ['rate<0.05'],
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

    // Send intentionally invalid payload — tests endpoint resilience
    // without creating real orders or charging real payments
    const payload = {
        razorpay_order_id: `order_loadtest_${Date.now()}`,
        razorpay_payment_id: `pay_loadtest_${Date.now()}`,
        razorpay_signature: 'invalid_signature_for_load_test',
        orderData: {
            items: [],
            total: 0,
            subtotal: 0,
        },
    };

    const res = http.post(
        `${BASE_URL}/api/payment/verify`,
        JSON.stringify(payload),
        { headers, tags: { endpoint: 'payment-verify' } }
    );

    // Acceptable responses: 400 (invalid sig), 401 (unauth), 429 (rate limit)
    const success = check(res, {
        'endpoint responds': (r) => r.status !== 0 && r.status !== 502 && r.status !== 503,
        'not a server crash': (r) => r.status !== 500,
        'response time < 3s': (r) => r.timings.duration < 3000,
    });

    errorRate.add(!success);
    verifyLatency.add(res.timings.duration);

    // Respect rate limits — longer sleep between requests
    sleep(Math.random() * 3 + 2); // 2–5s between requests
}
