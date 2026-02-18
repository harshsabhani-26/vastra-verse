/**
 * Shared Configuration — VastraVerse Load Tests
 *
 * Single source of truth for:
 *  - Base URL (env-driven)
 *  - Thresholds per endpoint category
 *  - Test mode profiles (load / stress / spike)
 *  - Common headers
 */

// ─── Base URL ────────────────────────────────────────────────────────────────
// Override via: k6 run -e BASE_URL=http://localhost:3000 main.js
export const BASE_URL = __ENV.BASE_URL || 'https://vastraverse.in';

// Session cookie for authenticated endpoints
// k6 run -e SESSION_COOKIE="next-auth.session-token=..." main.js
export const SESSION_COOKIE = __ENV.SESSION_COOKIE || '';

// ─── Common Headers ───────────────────────────────────────────────────────────
export function htmlHeaders() {
    return { Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en-IN' };
}

export function jsonHeaders() {
    const h = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (SESSION_COOKIE) h['Cookie'] = SESSION_COOKIE;
    return h;
}

export function authHeaders() {
    const h = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (SESSION_COOKIE) h['Cookie'] = SESSION_COOKIE;
    return h;
}

// ─── Thresholds ───────────────────────────────────────────────────────────────
// Applied globally; individual scenarios add their own Trend metrics.
export const THRESHOLDS = {
    // Global HTTP
    http_req_duration: ['p(95)<3000', 'p(99)<5000'],
    http_req_failed: ['rate<0.01'],

    // Page-specific (set by scenario Trend metrics)
    homepage_duration: ['p(95)<2000', 'p(99)<3500'],
    product_listing_duration: ['p(95)<2500', 'p(99)<4000'],
    product_page_duration: ['p(95)<2500', 'p(99)<4000'],
    checkout_duration: ['p(95)<3000', 'p(99)<5000'],
    payment_verify_duration: ['p(95)<3000', 'p(99)<5000'],
    admin_login_duration: ['p(95)<2000', 'p(99)<3500'],

    // Error rates
    errors: ['rate<0.01'],
};

// ─── Test Mode Profiles ───────────────────────────────────────────────────────

/** Standard load test — sustained realistic traffic */
export const LOAD_PROFILE = {
    stages: [
        { duration: '30s', target: 20 },   // warm-up
        { duration: '2m', target: 50 },   // sustained load
        { duration: '30s', target: 0 },    // ramp-down
    ],
};

/** Stress test — find the breaking point */
export const STRESS_PROFILE = {
    stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '1m', target: 150 },
        { duration: '1m', target: 200 },
        { duration: '30s', target: 0 },    // recovery
    ],
};

/** Spike test — sudden burst of traffic */
export const SPIKE_PROFILE = {
    stages: [
        { duration: '20s', target: 10 },   // baseline
        { duration: '10s', target: 200 },  // spike!
        { duration: '1m', target: 200 },  // hold spike
        { duration: '10s', target: 10 },   // drop back
        { duration: '30s', target: 10 },   // recovery check
    ],
};

/** Quick smoke test — just verify endpoints respond */
export const SMOKE_PROFILE = {
    vus: 2,
    duration: '30s',
};

// ─── Mode Selector ────────────────────────────────────────────────────────────
// k6 run -e MODE=stress main.js
export function getProfile() {
    const mode = (__ENV.MODE || 'load').toLowerCase();
    switch (mode) {
        case 'stress': return { ...STRESS_PROFILE, mode };
        case 'spike': return { ...SPIKE_PROFILE, mode };
        case 'smoke': return { ...SMOKE_PROFILE, mode };
        default: return { ...LOAD_PROFILE, mode: 'load' };
    }
}
