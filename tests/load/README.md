# Load Tests — VastraVerse

k6 load tests for all critical pages and APIs.

## Install k6

```powershell
# Windows (winget)
winget install k6 --source winget

# Mac
brew install k6

# Linux
sudo apt install k6
```

## Test Scripts

| Script | Target | VUs | Duration |
|--------|--------|-----|----------|
| `homepage.js` | `vastraverse.in` | 50 | 60s |
| `product-listing.js` | `/products` | 40 | 60s |
| `product-page.js` | `/products/[slug]` + API | 40 | 60s |
| `add-to-cart.js` | `POST /api/cart` | 20 | 60s |
| `checkout.js` | `/checkout` + Razorpay order | staged | 60s |
| `payment-verify.js` | `POST /api/payment/verify` | 5 | 60s |
| `admin-login.js` | `/admin/login` + auth | 5 | 60s |

## Run Tests

```bash
# Individual tests
k6 run tests/load/homepage.js
k6 run tests/load/product-listing.js
k6 run tests/load/product-page.js
k6 run tests/load/add-to-cart.js
k6 run tests/load/checkout.js
k6 run tests/load/payment-verify.js
k6 run tests/load/admin-login.js

# With session cookie (for authenticated endpoints)
k6 run -e SESSION_COOKIE="next-auth.session-token=<your-token>" tests/load/add-to-cart.js
k6 run -e SESSION_COOKIE="next-auth.session-token=<your-token>" tests/load/checkout.js

# Save results to JSON
k6 run --out json=results/homepage.json tests/load/homepage.js
```

## How to Get Your Session Cookie

1. Log in to `vastraverse.in` in Chrome
2. Open DevTools → Application → Cookies
3. Copy the value of `next-auth.session-token`
4. Pass it as: `-e SESSION_COOKIE="next-auth.session-token=<value>"`

## Performance Thresholds

| Metric | Target |
|--------|--------|
| `http_req_duration` p95 | < 2000ms |
| `http_req_failed` | < 1% |
| `errors` | < 1% |
| Payment verify p95 | < 3000ms |
| Razorpay order p95 | < 5000ms |

## Interpreting Results

```
✓ status is 200 .............. 3000/3000 (100%)
✓ response time < 3s ......... 2998/3000 (99.9%)

http_req_duration ............: avg=312ms  p(95)=890ms  p(99)=1.2s
http_req_failed ..............: 0.00%
```

- **`http_req_duration` p95 < 500ms** → Excellent
- **`http_req_duration` p95 < 2000ms** → Acceptable
- **`http_req_duration` p95 > 2000ms** → Needs optimization
- **`http_req_failed` > 1%** → Critical issue

## Notes

- `payment-verify.js` uses **invalid signatures** intentionally — it tests resilience without creating real orders
- `admin-login.js` uses **invalid credentials** intentionally — tests rate limiting and error handling
- `checkout.js` uses a **staged ramp-up** to simulate realistic traffic growth
- Rate-limited endpoints (payment verify, admin login) use low VU counts to avoid false failures
