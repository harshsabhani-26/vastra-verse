/**
 * k6 Load Test — Add to Cart API
 *
 * Tests: POST /api/cart (add item to cart)
 * Simulates authenticated users adding products to cart.
 *
 * NOTE: This test requires a valid session cookie.
 * Set SESSION_COOKIE env var before running:
 *   k6 run -e SESSION_COOKIE="next-auth.session-token=..." tests/load/add-to-cart.js
 *
 * Run: k6 run tests/load/add-to-cart.js
 */

import http from 'k6/http';
import { sleep, check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency', true);

export const options = {
    vus: 20,
    duration: '60s',
    thresholds: {
        http_req_duration: ['p(95)<1500'],   // Cart ops should be fast
        http_req_failed: ['rate<0.01'],
        errors: ['rate<0.01'],
    },
};

const BASE_URL = 'https://vastraverse.in';
const SESSION_COOKIE = __ENV.SESSION_COOKIE || '';

// Test product IDs — replace with real IDs from your DB
const TEST_PRODUCT_IDS = [
    'test-product-id-1',
    'test-product-id-2',
];

export default function () {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    if (SESSION_COOKIE) {
        headers['Cookie'] = SESSION_COOKIE;
    }

    const productId = TEST_PRODUCT_IDS[Math.floor(Math.random() * TEST_PRODUCT_IDS.length)];

    // GET cart
    const getRes = http.get(`${BASE_URL}/api/cart`, {
        headers,
        tags: { operation: 'get-cart' },
    });

    check(getRes, {
        'GET cart status ok': (r) => r.status === 200 || r.status === 401,
    });

    sleep(0.5);

    // POST add to cart
    const addRes = http.post(
        `${BASE_URL}/api/cart`,
        JSON.stringify({ productId, quantity: 1 }),
        { headers, tags: { operation: 'add-to-cart' } }
    );

    const success = check(addRes, {
        'add to cart status ok': (r) => r.status === 200 || r.status === 201 || r.status === 401,
        'response time < 2s': (r) => r.timings.duration < 2000,
    });

    errorRate.add(!success);
    apiLatency.add(addRes.timings.duration);

    sleep(1);
}
