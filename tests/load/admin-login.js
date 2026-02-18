/**
 * k6 Load Test — Admin Login Page
 *
 * Tests: GET /admin/login + POST /api/auth/signin
 * Simulates admin login flow under load.
 *
 * NOTE: Uses invalid credentials intentionally — tests the auth
 * endpoint handles load correctly without creating real sessions.
 *
 * Run: k6 run tests/load/admin-login.js
 */

import http from 'k6/http';
import { sleep, check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const loginLatency = new Trend('login_latency', true);

export const options = {
    // Low VUs — admin login is rate-limited and brute-force protected
    vus: 5,
    duration: '60s',
    thresholds: {
        http_req_duration: ['p(95)<3000'],
        http_req_failed: ['rate<0.05'],
        errors: ['rate<0.05'],
    },
};

const BASE_URL = 'https://vastraverse.in';

export default function () {
    // Step 1: Load admin login page
    const pageRes = http.get(`${BASE_URL}/admin/login`, {
        headers: { Accept: 'text/html' },
        tags: { step: 'admin-login-page' },
    });

    check(pageRes, {
        'login page loads': (r) => r.status === 200 || r.status === 302,
        'page load time < 2s': (r) => r.timings.duration < 2000,
    });

    sleep(1);

    // Step 2: Hit the NextAuth CSRF endpoint (required before signin)
    const csrfRes = http.get(`${BASE_URL}/api/auth/csrf`, {
        headers: { Accept: 'application/json' },
        tags: { step: 'csrf-token' },
    });

    const csrfOk = check(csrfRes, {
        'CSRF endpoint responds': (r) => r.status === 200,
        'CSRF time < 1s': (r) => r.timings.duration < 1000,
    });

    errorRate.add(!csrfOk);
    loginLatency.add(csrfRes.timings.duration);

    sleep(1);

    // Step 3: Attempt login with invalid credentials (tests rate limiting + error handling)
    let csrfToken = '';
    try {
        const csrfBody = JSON.parse(csrfRes.body);
        csrfToken = csrfBody.csrfToken || '';
    } catch (_) { }

    const loginRes = http.post(
        `${BASE_URL}/api/auth/callback/credentials`,
        {
            email: `loadtest_${Date.now()}@example.com`,
            password: 'invalid_password_load_test',
            csrfToken,
            callbackUrl: `${BASE_URL}/admin`,
        },
        {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            tags: { step: 'login-attempt' },
        }
    );

    // Expected: 302 redirect to error page, or 200 with error message
    const loginHandled = check(loginRes, {
        'login handled gracefully': (r) => r.status !== 500 && r.status !== 503,
        'not a server crash': (r) => r.status !== 500,
    });

    errorRate.add(!loginHandled);

    sleep(Math.random() * 2 + 2); // 2–4s between attempts
}
