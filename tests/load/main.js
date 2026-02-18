/**
 * VastraVerse — Enterprise k6 Load Test Runner
 *
 * Unified entry point for all test modes.
 *
 * Usage:
 *   k6 run tests/load/main.js                          # load (default)
 *   k6 run -e MODE=stress tests/load/main.js           # stress test
 *   k6 run -e MODE=spike  tests/load/main.js           # spike test
 *   k6 run -e MODE=smoke  tests/load/main.js           # smoke test
 *   k6 run -e BASE_URL=http://localhost:3000 ...       # local dev
 *   k6 run -e SESSION_COOKIE="..." ...                 # authenticated
 *   k6 run --out json=results/run.json ...             # export JSON
 *
 * Environment variables:
 *   MODE           = load | stress | spike | smoke  (default: load)
 *   BASE_URL       = target URL                     (default: https://vastraverse.in)
 *   SESSION_COOKIE = next-auth.session-token=...    (optional)
 *   PRODUCT_SLUGS  = slug-1,slug-2,slug-3           (optional)
 */

import { sleep } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

import { getProfile, THRESHOLDS, BASE_URL } from './lib/config.js';
import { homepageScenario } from './scenarios/homepage.js';
import { productListingScenario } from './scenarios/product-listing.js';
import { productPageScenario } from './scenarios/product-page.js';
import { checkoutScenario } from './scenarios/checkout.js';
import { paymentVerifyScenario } from './scenarios/payment-verify.js';
import { adminLoginScenario } from './scenarios/admin-login.js';

// ─── Options ──────────────────────────────────────────────────────────────────
const profile = getProfile();
const mode = profile.mode;

console.log(`\n🚀 VastraVerse Load Test`);
console.log(`   Mode:    ${mode.toUpperCase()}`);
console.log(`   Target:  ${BASE_URL}`);
console.log(`   Profile: ${JSON.stringify(profile.stages || { vus: profile.vus, duration: profile.duration })}\n`);

export const options = {
    // Stages from profile (load / stress / spike) or fixed VUs (smoke)
    ...(profile.stages ? { stages: profile.stages } : { vus: profile.vus, duration: profile.duration }),

    // Smoke mode skips thresholds — just verifies endpoints respond
    ...(mode !== 'smoke' ? { thresholds: THRESHOLDS } : {}),

    // Tag all requests with the test mode for filtering in results
    tags: { mode, target: BASE_URL },
};

// ─── Main Scenario ────────────────────────────────────────────────────────────
// Each VU runs this function in a loop for the test duration.
// Scenarios are weighted to simulate realistic traffic distribution:
//   Homepage:        20%
//   Product listing: 25%
//   Product page:    25%
//   Checkout:        15%
//   Payment verify:   5%  (rate-limited — low weight)
//   Admin login:     10%

export default function () {
    const r = Math.random();

    if (r < 0.20) {
        homepageScenario();
    } else if (r < 0.45) {
        productListingScenario();
    } else if (r < 0.70) {
        productPageScenario();
    } else if (r < 0.85) {
        checkoutScenario();
    } else if (r < 0.90) {
        paymentVerifyScenario();
    } else {
        adminLoginScenario();
    }

    // Think time: 1–3 seconds between requests (realistic user behavior)
    sleep(Math.random() * 2 + 1);
}

// ─── Summary Handler ──────────────────────────────────────────────────────────
// Generates both console summary and JSON file for the HTML report generator.
export function handleSummary(data) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `results/${mode}-${timestamp}.json`;

    console.log('\n📊 Test Complete — Summary:');

    // Key metrics to highlight
    const dur = data.metrics.http_req_duration;
    const failed = data.metrics.http_req_failed;
    const errors = data.metrics.errors;

    if (dur) {
        console.log(`   http_req_duration  avg=${fmt(dur.values.avg)}  p95=${fmt(dur.values['p(95)'])}  p99=${fmt(dur.values['p(99)'])}`);
    }
    if (failed) {
        const rate = (failed.values.rate * 100).toFixed(2);
        const status = failed.values.rate < 0.01 ? '✅' : '❌';
        console.log(`   http_req_failed    ${status} ${rate}%`);
    }
    if (errors) {
        const rate = (errors.values.rate * 100).toFixed(2);
        const status = errors.values.rate < 0.01 ? '✅' : '❌';
        console.log(`   errors             ${status} ${rate}%`);
    }

    // Per-page p95 / p99
    const pageMetrics = [
        ['homepage', data.metrics.homepage_duration],
        ['product-listing', data.metrics.product_listing_duration],
        ['product-page', data.metrics.product_page_duration],
        ['checkout', data.metrics.checkout_duration],
        ['payment-verify', data.metrics.payment_verify_duration],
        ['admin-login', data.metrics.admin_login_duration],
    ];

    console.log('\n   Per-page latency:');
    for (const [name, m] of pageMetrics) {
        if (m) {
            console.log(`     ${name.padEnd(16)} p95=${fmt(m.values['p(95)'])}  p99=${fmt(m.values['p(99)'])}`);
        }
    }

    // Write summary JSON — path set by run.js via RESULT_FILE env var
    // Falls back to a timestamped file in results/ directory
    const resultFile = __ENV.RESULT_FILE || `results/${mode}-${timestamp}.json`;

    return {
        'stdout': textSummary(data, { indent: '  ', enableColors: true }),
        [resultFile]: JSON.stringify(data, null, 2),
    };
}

function fmt(ms) {
    if (ms == null) return 'N/A';
    return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
}
