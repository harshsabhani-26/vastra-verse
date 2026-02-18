
# Enterprise Architecture Setup Guide

Vastra Verse has been upgraded with enterprise-scaled infrastructure.
This guide covers setup for every service.

---

## Architecture Overview

```mermaid
graph TD
  Client[Next.js Frontend] --> API[API Routes]
  API --> Cache[Upstash Redis Cache]
  API --> DB[(PostgreSQL Primary)]
  API --> ReadDB[(PostgreSQL Replica)]
  API --> Inngest[Inngest Background Jobs]
  Inngest --> EmailJob[Email Job]
  Inngest --> OrderJob[Order Job]
  Inngest --> PaymentJob[Payment Job]
  Inngest --> InventoryJob[Inventory Job]
  Inngest --> NotificationJob[Notification Job]
  API --> CircuitBreaker[Circuit Breakers]
  CircuitBreaker --> Razorpay
  CircuitBreaker --> Shiprocket
  CircuitBreaker --> MSG91
```

---

## 1. Redis Caching (Upstash)

**Files:**
- `lib/cache.ts` — Core cache service (get/set/mget/mset/incr/decr/ttl/expire)
- `lib/cache/product-cache.ts` — Product-specific cache helpers
- `lib/cache/category-cache.ts` — Category cache helpers
- `lib/cache/session-cache.ts` — Cart/user session cache
- `lib/cache-invalidation.ts` — Centralized cache invalidation

**Setup:**
1. Create a Redis database at [console.upstash.com](https://console.upstash.com)
2. Copy URL and token to `.env`:
   ```
   UPSTASH_REDIS_REST_URL=https://your-region.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AX...
   ```

**TTL Strategy:**
| Data Type | TTL | Reason |
|-----------|-----|--------|
| Product list | 3 min | Changes moderately |
| Product detail | 5 min | Less frequent changes |
| Featured products | 2 min | Curated content |
| Categories | 10 min | Rarely changes |
| User cart | 1 hour | Session-bound |
| API responses | 30 sec | Fresh enough for most APIs |

---

## 2. Background Jobs (Inngest)

**Files:**
- `lib/inngest.ts` — Client + typed event schema
- `lib/jobs/email-job.ts` — Async email sending
- `lib/jobs/invoice-job.ts` — PDF invoice generation
- `lib/jobs/order-job.ts` — Order lifecycle orchestration
- `lib/jobs/payment-job.ts` — Payment event handling
- `lib/jobs/notification-job.ts` — SMS/push/in-app routing
- `lib/jobs/inventory-job.ts` — Atomic stock updates
- `app/api/inngest/route.ts` — Webhook handler

**Setup:**
1. Sign up at [inngest.com](https://inngest.com)
2. Create a production environment
3. Add keys to `.env`:
   ```
   INNGEST_EVENT_KEY=xxx
   INNGEST_SIGNING_KEY=xxx
   ```
4. For local dev: `npx inngest-cli@latest dev`

**Event Flow:**
```
payment/captured → order/placed → [email, invoice, inventory, analytics]
payment/failed → [restore inventory, cancel order, notify customer]
order/status-updated → [email, SMS, analytics]
inventory/update → [stock change, cache invalidation, low-stock alerts]
```

---

## 3. Database Scaling

**Files:**
- `lib/prisma.ts` — Primary Prisma client with slow-query logging
- `lib/db-read.ts` — Read replica client
- `lib/db-pool.ts` — Pool sizing helpers

**Read Replica Setup:**
1. Create a read replica in Supabase or your PostgreSQL provider
2. Add to `.env`:
   ```
   DATABASE_REPLICA_URL=postgresql://user:pass@replica-host:6543/postgres
   DATABASE_POOL_SIZE=10
   ```
3. Import `prismaRead` instead of `prisma` for SELECT queries:
   ```ts
   import { prismaRead } from '@/lib/db-read';
   const products = await prismaRead.product.findMany();
   ```

---

## 4. API Performance

**Files:**
- `lib/api-middleware.ts` — Timeout, cache headers, fallback wrappers
- `lib/middleware/response-cache.ts` — Redis-backed response caching
- `lib/middleware/request-dedup.ts` — Idempotency key deduplication
- `lib/circuit-breaker.ts` — Opossum circuit breakers

**Response Caching Example:**
```ts
import { withResponseCache } from '@/lib/middleware/response-cache';

export async function GET(req: NextRequest) {
  return withResponseCache(req, 60, async () => {
    const data = await getExpensiveData();
    return NextResponse.json(data);
  });
}
```

**Idempotency Example:**
```ts
import { withIdempotency } from '@/lib/middleware/request-dedup';

export async function POST(req: NextRequest) {
  return withIdempotency(req, 300, async () => {
    // This won't run twice for the same x-idempotency-key
    return NextResponse.json({ success: true });
  });
}
```

---

## 5. Railway Deployment

**Files:**
- `railway.json` — Railway deployment config
- `railway.toml` — Extended Railway config

**Scaling Configuration:**
```json
{
  "deploy": {
    "numReplicas": 1,
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 120,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**To scale up:**
- Increase `numReplicas` in `railway.json`
- Add `DATABASE_REPLICA_URL` for read scaling
- Increase `DATABASE_POOL_SIZE` per replica

---

## 6. Folder Structure (New/Modified Files)

```
lib/
├── cache.ts                      # Enhanced: mget/mset/incr/decr/ttl/expire
├── cache/
│   ├── product-cache.ts          # NEW: Product cache helpers
│   ├── category-cache.ts         # NEW: Category cache helpers
│   └── session-cache.ts          # NEW: Cart/user session cache
├── cache-invalidation.ts         # Enhanced: order/user patterns
├── inngest.ts                    # Enhanced: full typed event schema
├── jobs/
│   ├── email-job.ts              # Existing
│   ├── invoice-job.ts            # Existing
│   ├── analytics-job.ts          # Existing
│   ├── order-job.ts              # NEW: Order lifecycle orchestration
│   ├── payment-job.ts            # NEW: Payment event handling
│   ├── notification-job.ts       # NEW: Multi-channel routing
│   └── inventory-job.ts          # NEW: Atomic stock updates
├── db-read.ts                    # NEW: Read replica client
├── db-pool.ts                    # NEW: Pool config helpers
├── middleware/
│   ├── response-cache.ts         # NEW: Redis response cache
│   └── request-dedup.ts          # NEW: Idempotency keys
├── api-middleware.ts              # Existing
├── circuit-breaker.ts             # Existing
└── healthcheck.ts                 # Existing

app/api/inngest/route.ts           # Enhanced: all jobs registered
railway.json                       # Enhanced: replicas, health, restart
railway.toml                       # NEW: Extended Railway config
.env.example                       # Enhanced: all env vars
```

---

## 7. Environment Variables Checklist

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `DATABASE_URL` | ✅ | — | Supabase pooler URL |
| `DIRECT_URL` | ✅ | — | Direct Postgres connection |
| `DATABASE_REPLICA_URL` | ❌ | — | Read replica (optional) |
| `DATABASE_POOL_SIZE` | ❌ | 10 | Connections per replica |
| `NEXTAUTH_SECRET` | ✅ | — | Auth secret |
| `UPSTASH_REDIS_REST_URL` | ✅ | — | Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | — | Redis token |
| `INNGEST_EVENT_KEY` | ✅ | — | Inngest production key |
| `INNGEST_SIGNING_KEY` | ✅ | — | Inngest signing key |
| `RAZORPAY_KEY_ID` | ✅ | — | Payment gateway |
| `RAZORPAY_KEY_SECRET` | ✅ | — | Payment gateway |
| `EMAIL_HOST` | ✅ | — | SMTP host |
| `EMAIL_USER` | ✅ | — | SMTP username |
| `EMAIL_PASS` | ✅ | — | SMTP password |
| `MSG91_AUTH_KEY` | ❌ | — | SMS provider |
| `LOW_STOCK_THRESHOLD` | ❌ | 5 | Inventory alert threshold |
| `LOG_LEVEL` | ❌ | info | debug/info/warn/error |
