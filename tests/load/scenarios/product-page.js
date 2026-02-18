/**
 * Scenario: Product Detail Page
 * Tests: GET /products/[slug] + product detail API
 */

import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, htmlHeaders, jsonHeaders } from '../lib/config.js';
import { productPageDuration, record, logFailure } from '../lib/metrics.js';

// Add real product slugs from your DB here for more accurate testing
// k6 run -e PRODUCT_SLUGS="slug-1,slug-2,slug-3" main.js
function getSlugs() {
    if (__ENV.PRODUCT_SLUGS) return __ENV.PRODUCT_SLUGS.split(',');
    return []; // Falls back to API-only test
}

export function productPageScenario() {
    const slugs = getSlugs();

    if (slugs.length > 0) {
        // Test actual product page with real slug
        const slug = slugs[Math.floor(Math.random() * slugs.length)];
        const res = http.get(`${BASE_URL}/products/${slug}`, {
            headers: htmlHeaders(),
            tags: { scenario: 'product-page', type: 'page' },
        });

        const ok = check(res, {
            '[product-page] status 200': (r) => r.status === 200,
            '[product-page] has body': (r) => r.body && r.body.length > 500,
            '[product-page] time < 3s': (r) => r.timings.duration < 3000,
            '[product-page] no server error': (r) => r.status < 500,
        });

        record(productPageDuration, res, ok);
        logFailure('product-page', res);
    } else {
        // Fallback: test the products API endpoint
        const res = http.get(`${BASE_URL}/api/products?limit=1`, {
            headers: jsonHeaders(),
            tags: { scenario: 'product-page', type: 'api-fallback' },
        });

        const ok = check(res, {
            '[product-api] status ok': (r) => r.status === 200 || r.status === 401,
            '[product-api] time < 2s': (r) => r.timings.duration < 2000,
            '[product-api] no 5xx': (r) => r.status < 500,
        });

        record(productPageDuration, res, ok);
        logFailure('product-api', res);
    }
}
