import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.01'],
  },
};

const TEST_USER_ID = "test-user-id";
const TEST_PRODUCT_ID = "test-product-id";

export default function () {
  // Use a unique payment/order ID per test run, but same across VUs to test idempotency!
  // Wait, the prompt says "Same payment should not create multiple orders", meaning we should 
  // intentionally trigger concurrent requests with the SAME ID.
  const uniqueId = `test_payment_${__VU}_${__ITER}`;
  
  // Actually, to test idempotency fully, let's have all 10 VUs hit the endpoint with the exact same payload
  // concurrently. Then we do random payloads to test throughput.
  // Wait, if all VUs hit the same ID, they should all return 200, but only ONE order should be created.
  
  const payload = JSON.stringify({
    razorpay_order_id: "order_test_123",
    razorpay_payment_id: "pay_test_123",
    razorpay_signature: "test_signature",
    userId: TEST_USER_ID,
    orderData: {
      items: [{
        id: TEST_PRODUCT_ID,
        quantity: 1,
        price: 100,
        name: "Test Product"
      }],
      total: 100,
      subtotal: 100,
      discount: 0,
      shippingCharges: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      gstRate: 0,
      customerName: "Test User",
      customerPhone: "9999999999",
      shippingAddress: "123 Test St",
      shippingCity: "Test City",
      shippingState: "Test State"
    }
  });

  const res = http.post(
    'http://localhost:3000/api/payment/verify',
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(res, {
    'status is 200 or 409': (r) => r.status === 200 || r.status === 409,
    'success is true': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch (e) {
        return false;
      }
    }
  });

  if (res.status !== 200 && res.status !== 409) {
    console.log('Unexpected:', res.status, res.body);
  }

  sleep(1);
}
