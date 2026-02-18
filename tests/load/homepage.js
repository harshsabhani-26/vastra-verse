/**
 * k6 Load Test — Homepage
 *
 * Tests: https://vastraverse.in (landing page)
 * Simulates 50 concurrent users browsing for 60 seconds.
 *
 * Run: k6 run tests/load/homepage.js
 */

import http from 'k6/http';
import { sleep, check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const pageLoadTime = new Trend('page_load_time', true);

export const options = {
    vus: 50,
    duration: '60s',
    thresholds: {
        http_req_duration: ['p(95)<2000'],   // 95% of requests under 2s
        http_req_failed: ['rate<0.01'],      // <1% failure rate
        errors: ['rate<0.01'],
    },
};

const BASE_URL = 'https://vastraverse.in';

export default function () {
    const res = http.get(BASE_URL, {
        headers: { 'Accept': 'text/html,application/xhtml+xml' },
        tags: { page: 'homepage' },
    });

    const success = check(res, {
        'status is 200': (r) => r.status === 200,
        'page has content': (r) => r.body && r.body.length > 1000,
        'response time < 3s': (r) => r.timings.duration < 3000,
    });

    errorRate.add(!success);
    pageLoadTime.add(res.timings.duration);

    sleep(1);
}
