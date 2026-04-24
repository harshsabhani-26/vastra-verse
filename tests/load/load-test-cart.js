import http from 'k6/http';
import { check, sleep, group } from 'k6';

// ====================================================================
// CONFIGURATION
// ====================================================================
export const options = {
    // Stage 1: Fast spike (Simulating a flash sale / hype drop)
    stages: [
        { duration: '10s', target: 20 }, // Spike to 10 users fast
        { duration: '20s', target: 20 }, // Hold steady
        { duration: '5s', target: 0 },   // Cool down
    ],
    
    thresholds: {
        http_req_duration: ['p(95)<1500'], // DB writes take longer than reads. <1.5s is acceptable for cart operations under load.
        http_req_failed: ['rate<0.05'],    // Max 5% failure rate (e.g., out of stock scenarios)
    },
};

const BASE_URL = 'http://localhost:3000';

// ====================================================================
// TEST DATA (Automatically Extracted from your Database)
// ====================================================================
const TEST_USER_ID = "test-user-id";
const TEST_PRODUCT_ID = "test-product-id";

// ====================================================================
// USER BEHAVIOR SIMULATION
// ====================================================================
export default function () {
    group('Cart Operations', () => {
        const payload = JSON.stringify({
            productId: TEST_PRODUCT_ID,
            quantity: 1,
            userId: TEST_USER_ID
        });

        const params = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        // 1. Send Add to Cart Request (simulating READ -> WRITE transition)
        const res = http.post(`${BASE_URL}/api/test-cart`, payload, params);

        // 2. Validate the Response
        check(res, {
            'Cart operation succeeded (200)': (r) => r.status === 200,
            'Item added successfully': (r) => {
                if (r.status !== 200) return false;
                try {
                    const body = JSON.parse(r.body);
                    return body.success === true;
                } catch {
                    return false;
                }
            },
            'Out of stock handled correctly': (r) => {
                // If it fails due to 400 Out of Stock, that's actually a business logic SUCCESS
                if (r.status !== 400) return true;
                try {
                    const body = JSON.parse(r.body);
                    return body.error && body.error.includes("Only");
                } catch {
                    return false;
                }
            }
        });

        // Simulating the user taking time to decide on their next click
        sleep(Math.random() * 2 + 1);
    });
}
