/**
 * Environment Variable Validation
 * 
 * Validates critical environment variables on startup
 * Provides helpful error messages if configuration is missing
 */

const REQUIRED_ENV_VARS = [
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
    "ADMIN_EMAIL",
] as const;

const OPTIONAL_ENV_VARS = [
    "DIRECT_URL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
] as const;

export function validateEnvironment() {
    const missing: string[] = [];
    const warnings: string[] = [];

    // Check required variables
    for (const varName of REQUIRED_ENV_VARS) {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    }

    // Check optional but recommended variables
    for (const varName of OPTIONAL_ENV_VARS) {
        if (!process.env[varName]) {
            warnings.push(varName);
        }
    }

    if (missing.length > 0) {
        const errorMessage = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  MISSING REQUIRED ENVIRONMENT VARIABLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The following environment variables are required but not set:

${missing.map(v => `  ❌ ${v}`).join('\n')}

Please configure these in your hosting environment or .env file.

For Hostinger deployment:
1. Go to your Hostinger hosting panel
2. Navigate to Environment Variables section
3. Add the missing variables

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `.trim();

        console.error(errorMessage);

        // In production, throw error to prevent startup with bad config
        if (process.env.NODE_ENV === 'production') {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }

    if (warnings.length > 0) {
        console.warn(`⚠️  Optional environment variables not set: ${warnings.join(', ')}`);
        console.warn('Some features may not be available.');
    }

    if (missing.length === 0) {
        console.log('✅ All required environment variables are configured');
    }

    return {
        valid: missing.length === 0,
        missing,
        warnings,
    };
}

// Auto-validate on import in production
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    validateEnvironment();
}
