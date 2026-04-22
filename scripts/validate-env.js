const required = [
    "DATABASE_URL",
    "NEXTAUTH_SECRET"
];

const optional = [
    "DIRECT_URL",
    "DATABASE_REPLICA_URL",
    "DATABASE_POOL_SIZE",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
    "SENTRY_DSN",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "INNGEST_EVENT_KEY",
    "INNGEST_SIGNING_KEY",
    "EMAIL_HOST",
    "EMAIL_USER",
    "EMAIL_PASS",
    "MSG91_AUTH_KEY",
    "CRON_SECRET"
];

const missingRequired = required.filter(v => !process.env[v]);
const missingOptional = optional.filter(v => !process.env[v]);

if (missingRequired.length) {
    console.error("❌ Missing REQUIRED environment variables:");
    missingRequired.forEach(v => console.error(" -", v));
    process.exit(1);
}

console.log("✅ Required environment variables OK");

if (missingOptional.length) {
    console.warn("⚠ Optional environment variables not set:");
    missingOptional.forEach(v => console.warn(" -", v));
} else {
    console.log("✅ All optional services configured");
}

