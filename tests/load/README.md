# Load Testing (k6)

## Overview
This directory contains performance, concurrency, and load tests for the Vastra-Verse platform using [k6](https://k6.io/).

## Available Tests

- `load-test.js` - Simulates general website traffic (browsing, viewing products, checking cart).
- `load-test-cart.js` - Tests high concurrency on the Add to Cart functionality.
- `load-test-prepaid.js` - Tests the idempotency of the Prepaid Payment Verification webhook/endpoint.
- `load-test-cod.js` - Tests high concurrency on Cash On Delivery checkout to ensure stock integrity and prevent overselling.

## How to Run

1. Make sure your Next.js server is running locally:
   ```bash
   npm run dev
   # or
   npm run build && npm start
   ```

2. Run a specific test:
   ```bash
   k6 run load-test-cart.js
   ```

## Notes

- **Environment**: These tests are configured to run against `http://localhost:3000`. Update `BASE_URL` in the scripts if testing against a staging server.
- **Data Privacy**: No real User IDs or Product IDs are committed here. When running tests on staging/local, you can temporarily update `TEST_USER_ID` and `TEST_PRODUCT_ID` in the scripts to point to actual database entries.
- **Production Safety**: ⚠️ **Do NOT run these on the production environment** with high VUs (Virtual Users) as they will generate artificial orders and reduce actual product stock.

## Continuous Integration
These scripts can be hooked into CI/CD pipelines (e.g., GitHub Actions) to run regression tests before deployment.
