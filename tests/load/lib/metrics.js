/**
 * Shared Metrics & Helpers — VastraVerse Load Tests
 *
 * Custom k6 Trend metrics for per-page p95/p99 tracking.
 * Import these in each scenario to get named metrics in the report.
 */

import { Rate, Trend, Counter } from 'k6/metrics';

// ─── Custom Trend Metrics (per page) ─────────────────────────────────────────
// These appear in k6 output and JSON results as named metrics.
export const homepageDuration = new Trend('homepage_duration', true);
export const productListDuration = new Trend('product_listing_duration', true);
export const productPageDuration = new Trend('product_page_duration', true);
export const checkoutDuration = new Trend('checkout_duration', true);
export const paymentVerifyDuration = new Trend('payment_verify_duration', true);
export const adminLoginDuration = new Trend('admin_login_duration', true);

// ─── Global Error Rate ────────────────────────────────────────────────────────
export const errors = new Rate('errors');

// ─── Request Counters ─────────────────────────────────────────────────────────
export const totalRequests = new Counter('total_requests');
export const failedRequests = new Counter('failed_requests');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Record a request result into the appropriate Trend metric.
 * @param {Trend} trend - The metric to record into
 * @param {object} res  - k6 HTTP response
 * @param {boolean} ok  - Whether all checks passed
 */
export function record(trend, res, ok) {
    trend.add(res.timings.duration);
    totalRequests.add(1);
    errors.add(!ok);
    if (!ok) failedRequests.add(1);
}

/**
 * Log a failure with context for debugging.
 * @param {string} scenario - Scenario name
 * @param {object} res      - k6 HTTP response
 */
export function logFailure(scenario, res) {
    if (res.status >= 500 || res.status === 0) {
        console.error(`[FAIL] ${scenario} → status=${res.status} url=${res.url} time=${res.timings.duration}ms`);
    }
}

/**
 * Detect API failures — returns true if the response is a server error.
 * 4xx are acceptable (auth required, validation), 5xx are failures.
 */
export function isServerError(res) {
    return res.status === 0 || res.status >= 500;
}

/**
 * Safe JSON parse — returns null on failure instead of throwing.
 */
export function safeJson(res) {
    try { return res.json(); } catch (_) { return null; }
}
