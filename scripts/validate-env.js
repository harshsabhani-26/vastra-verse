const required = [
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "NODE_ENV"
];

const optional = [
    "SENTRY_DSN",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN"
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
    console.log("✅ Optional services configured");
}
