/**
 * Scenario: Admin Login
 * Tests: GET /admin/login + GET /api/auth/csrf
 *
 * Production safe: Tests page load and CSRF endpoint only.
 * Does NOT attempt actual login to avoid triggering brute-force protection.
 */

import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, htmlHeaders, jsonHeaders } from '../lib/config.js';
import { adminLoginDuration, record, logFailure } from '../lib/metrics.js';

export function adminLoginScenario() {
    // Step 1: Load admin login page
    const pageRes = http.get(`${BASE_URL}/admin/login`, {
        headers: htmlHeaders(),
        tags: { scenario: 'admin-login', step: 'page' },
    });

    const pageOk = check(pageRes, {
        '[admin-login] page responds': (r) => r.status !== 0,
        '[admin-login] no server error': (r) => r.status < 500,
        '[admin-login] page time < 2s': (r) => r.timings.duration < 2000,
        // 200 = login page, 302 = redirect to dashboard (already authed)
        '[admin-login] expected status': (r) => [200, 302, 307, 308].includes(r.status),
    });

    record(adminLoginDuration, pageRes, pageOk);
    logFailure('admin-login-page', pageRes);

    // Step 2: Hit CSRF endpoint (required for NextAuth forms)
    const csrfRes = http.get(`${BASE_URL}/api/auth/csrf`, {
        headers: jsonHeaders(),
        tags: { scenario: 'admin-login', step: 'csrf' },
    });

    check(csrfRes, {
        '[csrf] status 200': (r) => r.status === 200,
        '[csrf] has token': (r) => {
            try { return !!JSON.parse(r.body).csrfToken; } catch (_) { return false; }
        },
        '[csrf] time < 1s': (r) => r.timings.duration < 1000,
    });

    logFailure('admin-csrf', csrfRes);
}
