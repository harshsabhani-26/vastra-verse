import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.05'], // Allow higher failure rate since stock will hit 0 and throw 400s
  },
};

const TEST_USER_ID = "test-user-id";
const TEST_PRODUCT_ID = "test-product-id";

export default function () {
  const payload = JSON.stringify({
    productId: TEST_PRODUCT_ID,
    quantity: 1,
    userId: TEST_USER_ID,
    // Unique session ID per iteration to simulate DIFFERENT orders from different checkouts
    checkoutSessionId: `test_session_${__VU}_${__ITER}` 
  });

  const res = http.post(
    'http://localhost:3000/api/test-create-order',
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(res, {
    'status is 200 or 400 (OOS)': (r) => r.status === 200 || r.status === 400,
    'handled out of stock correctly': (r) => {
      if (r.status === 400) {
        return r.body.includes('out of stock');
      }
      return true;
    }
  });

  if (res.status !== 200 && res.status !== 400 && res.status !== 409) {
    console.log('Error:', res.status, res.body);
  }

  sleep(1);
}
