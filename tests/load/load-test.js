import http from 'k6/http';
import { check, sleep, group } from 'k6';

// ====================================================================
// 1. CONFIGURATION & THRESHOLDS
// ====================================================================
export const options = {
    // Advanced: Staged ramp-up for realistic traffic simulation
    stages: [
        { duration: '10s', target: 20 }, // Ramp up from 0 to 20 users over 10 seconds
        { duration: '20s', target: 20 }, // Hold steady at 20 users for 20 seconds
        { duration: '5s', target: 0 },   // Ramp down to 0 users over 5 seconds
    ],
    
    // Performance Thresholds (Pass/Fail criteria)
    thresholds: {
        http_req_duration: ['p(95)<800'], // 95% of requests must complete below 800ms
        http_req_failed: ['rate<0.01'],   // Error rate must be less than 1%
    },
};

// Target local environment
const BASE_URL = 'http://localhost:3000';

// ====================================================================
// 2. USER BEHAVIOR FLOW (VIRTUAL USER SCENARIO)
// ====================================================================
export default function () {
    // We use a random number to simulate different types of users
    // 50% Browsers, 30% Product Viewers, 20% Cart Checkers
    const userType = Math.random();

    group('1. Homepage Browsing', () => {
        // All users start at the homepage
        const res = http.get(`${BASE_URL}/`);
        check(res, {
            'Homepage loaded (200)': (r) => r.status === 200,
        });
        
        // Realistic sleep between 1 to 3 seconds as user reads the page
        sleep(Math.random() * 2 + 1); 
    });

    if (userType > 0.5) {
        group('2. Category Browsing', () => {
            // 50% of users navigate to a category page
            const res = http.get(`${BASE_URL}/shop/saree/embrodery-saree`);
            check(res, {
                'Category loaded (200)': (r) => r.status === 200,
            });
            sleep(Math.random() * 2 + 1);
        });
    }

    if (userType > 0.2) {
        group('3. Product Viewing', () => {
            // 80% of users view a specific product using the real URL provided
            const res = http.get(`${BASE_URL}/shop/saree/embrodery-saree/embrodery-saree`);
            check(res, {
                'Product loaded (200)': (r) => r.status === 200,
            });
            sleep(Math.random() * 3 + 2); // Users spend more time reading product details
        });
    }

    if (userType > 0.8) {
        group('4. Cart Interaction (Read-Only)', () => {
            // 20% of users check their cart
            // Since this app uses Server Actions, we'll hit a valid public API route or just the /cart page
            const res = http.get(`${BASE_URL}/cart`);
            check(res, {
                'Cart page responded (200)': (r) => r.status === 200,
            });
            sleep(1);
        });
    }
}
