/**
 * Scenario: Homepage
 * Tests: GET https://vastraverse.in
 */

import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, htmlHeaders } from '../lib/config.js';
import { homepageDuration, record, logFailure } from '../lib/metrics.js';

export function homepageScenario() {
    const res = http.get(BASE_URL, {
        headers: htmlHeaders(),
        tags: { scenario: 'homepage' },
    });

    const ok = check(res, {
        '[homepage] status 200': (r) => r.status === 200,
        '[homepage] has body': (r) => r.body && r.body.length > 500,
        '[homepage] time < 3s': (r) => r.timings.duration < 3000,
        '[homepage] no server error': (r) => r.status < 500,
    });

    record(homepageDuration, res, ok);
    logFailure('homepage', res);
}
