/**
 * Environment Variable Contract
 * 
 * Single source of truth for env validation.
 * Grouped by domain, fails fast with readable errors at boot.
 */

// ─── Auth ─────────────────────────────────────────────
const AUTH_REQUIRED = [
    "NEXTAUTH_SECRET",
    "AUTH_SECRET",
    "NEXTAUTH_URL",
] as const;

const AUTH_OPTIONAL = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
] as const;

// ─── Razorpay ─────────────────────────────────────────
const RAZORPAY_REQUIRED = [
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "NEXT_PUBLIC_RAZORPAY_KEY_ID",
] as const;

// ─── Supabase ─────────────────────────────────────────
const SUPABASE_REQUIRED = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const SUPABASE_OPTIONAL = [
    "SUPABASE_SERVICE_ROLE_KEY",
] as const;

// ─── Cloudinary ────────────────────────────────────────
const CLOUDINARY_REQUIRED = [
    "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
] as const;

// ─── App ──────────────────────────────────────────────
const APP_REQUIRED = [
    "DATABASE_URL",
    "ADMIN_EMAIL",
] as const;

// ─── Aggregate ────────────────────────────────────────
const ALL_REQUIRED = [
    ...AUTH_REQUIRED,
    ...RAZORPAY_REQUIRED,
    ...SUPABASE_REQUIRED,
    ...CLOUDINARY_REQUIRED,
    ...APP_REQUIRED,
] as const;

const ALL_OPTIONAL = [
    ...AUTH_OPTIONAL,
    ...SUPABASE_OPTIONAL,
] as const;

type EnvGroup = {
    name: string;
    vars: readonly string[];
};

const REQUIRED_GROUPS: EnvGroup[] = [
    { name: "Auth", vars: AUTH_REQUIRED },
    { name: "Razorpay", vars: RAZORPAY_REQUIRED },
    { name: "Supabase", vars: SUPABASE_REQUIRED },
    { name: "Cloudinary", vars: CLOUDINARY_REQUIRED },
    { name: "App", vars: APP_REQUIRED },
];

/**
 * Validate all required environment variables.
 * Throws with a grouped, readable error if any are missing.
 */
export function validateEnv(): void {
    const missingByGroup: Record<string, string[]> = {};
    let totalMissing = 0;

    for (const group of REQUIRED_GROUPS) {
        const missing = group.vars.filter((v) => !process.env[v]);
        if (missing.length > 0) {
            missingByGroup[group.name] = missing;
            totalMissing += missing.length;
        }
    }

    // Check optional vars for warnings
    const optionalMissing = ALL_OPTIONAL.filter((v) => !process.env[v]);

    if (totalMissing > 0) {
        const lines = [
            "",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "⛔  MISSING REQUIRED ENVIRONMENT VARIABLES",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "",
        ];

        for (const [group, vars] of Object.entries(missingByGroup)) {
            lines.push(`  [${group}]`);
            for (const v of vars) {
                lines.push(`    ❌ ${v}`);
            }
            lines.push("");
        }

        lines.push("Configure these in your .env file or hosting environment.");
        lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        const msg = lines.join("\n");
        console.error(msg);
        throw new Error(`Missing ${totalMissing} required env variable(s): ${Object.values(missingByGroup).flat().join(", ")}`);
    }

    // Format validations
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("postgresql://")) {
        throw new Error("DATABASE_URL must be a PostgreSQL connection string (starts with postgresql://)");
    }

    if (process.env.ADMIN_EMAIL && !process.env.ADMIN_EMAIL.includes("@")) {
        throw new Error("ADMIN_EMAIL must be a valid email address");
    }

    // Warn about optional vars
    if (optionalMissing.length > 0) {
        console.warn(`⚠️  Optional env vars not set: ${optionalMissing.join(", ")}. Some features may be unavailable.`);
    }

    console.log("✅ All required environment variables validated");
}
