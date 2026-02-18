/**
 * k6 Load Test — Product Listing Page
 *
 * Tests: /products (category browse + search)
 * Simulates users browsing product listings with pagination.
 *
 * Run: k6 run tests/load/product-listing.js
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

// Simulate different browsing patterns
const LISTING_URLS = [
    `${BASE_URL}/products`,
    `${BASE_URL}/products?page=1`,
    `${BASE_URL}/products?page=2`,
    `${BASE_URL}/products?sort=price_asc`,
    `${BASE_URL}/products?sort=newest`,
];

export default function () {
    const url = LISTING_URLS[Math.floor(Math.random() * LISTING_URLS.length)];

    const res = http.get(url, {
        headers: { 'Accept': 'text/html,application/xhtml+xml' },
        tags: { page: 'product-listing' },
    });

    const success = check(res, {
        'status is 200': (r) => r.status === 200,
        'has products': (r) => r.body && r.body.length > 500,
        'response time < 3s': (r) => r.timings.duration < 3000,
    });

    errorRate.add(!success);
    pageLoadTime.add(res.timings.duration);

    sleep(Math.random() * 2 + 1); // 1–3s think time
}
