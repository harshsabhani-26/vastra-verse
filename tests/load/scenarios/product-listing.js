/**
 * Scenario: Product Listing
 * Tests: GET /products (with pagination + sort variants)
 */

import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, htmlHeaders, jsonHeaders } from '../lib/config.js';
import { productListDuration, record, logFailure } from '../lib/metrics.js';

const LISTING_PATHS = [
    '/products',
    '/products?page=1',
    '/products?page=2',
    '/products?sort=price_asc',
    '/products?sort=newest',
];

export function productListingScenario() {
    const path = LISTING_PATHS[Math.floor(Math.random() * LISTING_PATHS.length)];

    // Page load
    const pageRes = http.get(`${BASE_URL}${path}`, {
        headers: htmlHeaders(),
        tags: { scenario: 'product-listing', type: 'page' },
    });

    const pageOk = check(pageRes, {
        '[product-listing] status 200': (r) => r.status === 200,
        '[product-listing] time < 3s': (r) => r.timings.duration < 3000,
        '[product-listing] no server error': (r) => r.status < 500,
    });

    record(productListDuration, pageRes, pageOk);
    logFailure('product-listing page', pageRes);

    // Also hit the products API (used by client-side filtering)
    const apiRes = http.get(`${BASE_URL}/api/products?limit=20`, {
        headers: jsonHeaders(),
        tags: { scenario: 'product-listing', type: 'api' },
    });

    check(apiRes, {
        '[products-api] status ok': (r) => r.status === 200 || r.status === 401,
        '[products-api] time < 2s': (r) => r.timings.duration < 2000,
        '[products-api] no 5xx': (r) => r.status < 500,
    });

    logFailure('products-api', apiRes);
}
