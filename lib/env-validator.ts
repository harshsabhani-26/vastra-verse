/**
 * Environment Variable Validator
 * Validates required environment variables at runtime
 * Prevents deployment with missing critical configuration
 */

const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'AUTH_SECRET',
    'ADMIN_EMAIL',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'MSG91_AUTH_KEY',
] as const;

const optionalEnvVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'STRIPE_SECRET_KEY',
] as const;

export function validateEnv() {
    const missing: string[] = [];
    const warnings: string[] = [];

    // Check required variables
    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            missing.push(envVar);
        }
    }

    // Check optional but recommended variables
    for (const envVar of optionalEnvVars) {
        if (!process.env[envVar]) {
            warnings.push(envVar);
        }
    }

    // Fail fast if required variables are missing
    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach(v => console.error(`   - ${v}`));
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Warn about optional variables
    if (warnings.length > 0 && process.env.NODE_ENV === 'production') {
        console.warn('⚠️  Missing optional environment variables:');
        warnings.forEach(v => console.warn(`   - ${v}`));
    }

    // Validate formats
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
        throw new Error('DATABASE_URL must be a PostgreSQL connection string');
    }

    if (process.env.ADMIN_EMAIL && !process.env.ADMIN_EMAIL.includes('@')) {
        throw new Error('ADMIN_EMAIL must be a valid email address');
    }

    console.log('✅ Environment variables validated successfully');
}

// Auto-validate in production
if (process.env.NODE_ENV === 'production') {
    validateEnv();
}
