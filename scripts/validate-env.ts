import { z } from 'zod';

const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(1),
    RAZORPAY_KEY_ID: z.string().min(1),
    RAZORPAY_KEY_SECRET: z.string().min(1),
    RAZORPAY_WEBHOOK_SECRET: z.string().min(1),
    SHIPROCKET_EMAIL: z.string().email(),
    SHIPROCKET_PASSWORD: z.string().min(1),
    SMTP_HOST: z.string().min(1),
    SMTP_USER: z.string().min(1),
    SMTP_PASS: z.string().min(1),
    SENTRY_DSN: z.string().url(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

function validateEnv() {
    console.log('🔒 Validating environment variables...');

    try {
        envSchema.parse(process.env);
        console.log('✅ Environment validation passed');
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('❌ Invalid environment variables:');
            error.issues.forEach((err) => {
                console.error(`  - ${err.path.join('.')}: ${err.message}`);
            });
        } else {
            console.error('❌ An unexpected error occurred during environment validation');
        }
        process.exit(1);
    }
}

validateEnv();
