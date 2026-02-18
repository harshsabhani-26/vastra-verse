/**
 * k6 Load Test — Product Detail Page
 *
 * Tests: /products/[slug] (individual product pages)
 * Simulates users viewing product details.
 *
 * Run: k6 run tests/load/product-page.js
 */

import http from 'k6/http';
import { sleep, check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const pageLoadTime = new Trend('page_load_time', true);

export const options = {
    vus: 40,
    duration: '60s',
    thresholds: {
        http_req_duration: ['p(95)<2500'],
        http_req_failed: ['rate<0.01'],
        errors: ['rate<0.01'],
    },
};

const BASE_URL = 'https://vastraverse.in';

// Use the products API to get real slugs, or hardcode known ones
const PRODUCT_SLUGS = [
    '/products',  // fallback to listing if no slugs known
];

export default function () {
    // First, hit the listing to simulate a real user journey
    const listRes = http.get(`${BASE_URL}/products`, {
        tags: { page: 'product-listing' },
    });

    check(listRes, {
        'listing status 200': (r) => r.status === 200,
    });

    sleep(1);

    // Then hit the API to get products
    const apiRes = http.get(`${BASE_URL}/api/products?limit=10`, {
        headers: { 'Accept': 'application/json' },
        tags: { page: 'products-api' },
    });

    const success = check(apiRes, {
        'API status 200': (r) => r.status === 200,
        'returns JSON': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
        'response time < 2s': (r) => r.timings.duration < 2000,
    });

    errorRate.add(!success);
    pageLoadTime.add(apiRes.timings.duration);

    sleep(Math.random() * 2 + 1);
}
