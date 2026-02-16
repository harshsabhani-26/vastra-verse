/**
 * Production Safety Guards
 * Prevents destructive operations in production environments
 */

const isProduction = () => process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT === 'production';
const isStaging = () => process.env.NODE_ENV === 'staging' || process.env.RAILWAY_ENVIRONMENT === 'staging';

export function getEnvironment(): 'development' | 'staging' | 'production' {
    if (isProduction()) return 'production';
    if (isStaging()) return 'staging';
    return 'development';
}

/**
 * Guard that blocks destructive operations in production
 */
export function blockDestructiveInProduction(operation: string): void {
    if (!isProduction()) return;

    const destructiveOps = [
        'migrate reset',
        'db push --force-reset',
        'deleteMany without filter',
        'drop table',
        'truncate',
    ];

    const isDestructive = destructiveOps.some(op =>
        operation.toLowerCase().includes(op.toLowerCase())
    );

    if (isDestructive) {
        throw new Error(
            `🚫 BLOCKED: Destructive operation "${operation}" is not allowed in production.\n` +
            `Environment: ${getEnvironment()}\n` +
            `If this is intentional, use the manual database tools directly.`
        );
    }
}

/**
 * Pre-migration safety check
 */
export function preMigrationCheck(): { safe: boolean; warnings: string[] } {
    const warnings: string[] = [];

    if (isProduction()) {
        warnings.push('⚠️  You are running migrations in PRODUCTION environment');
        warnings.push('⚠️  Ensure you have a recent backup before proceeding');

        if (!process.env.DATABASE_URL) {
            return { safe: false, warnings: [...warnings, '❌ DATABASE_URL is not set'] };
        }
    }

    return { safe: true, warnings };
}

/**
 * Validate migration token for production operations
 */
export function validateMigrationToken(token?: string): boolean {
    if (!isProduction()) return true;

    const expectedToken = process.env.MIGRATION_TOKEN;
    if (!expectedToken) {
        console.warn('⚠️  MIGRATION_TOKEN not set. Production migrations require a token.');
        return false;
    }

    return token === expectedToken;
}

/**
 * Console warning for production operations
 */
export function logSafetyBanner(): void {
    const env = getEnvironment();

    if (env === 'production') {
        console.log('');
        console.log('╔══════════════════════════════════════════════════════════╗');
        console.log('║  🔴 PRODUCTION DATABASE OPERATION                       ║');
        console.log('║  Ensure backup exists before proceeding.                ║');
        console.log('║  All operations are logged to MigrationLog.             ║');
        console.log('╚══════════════════════════════════════════════════════════╝');
        console.log('');
    } else if (env === 'staging') {
        console.log('🟡 Running in STAGING environment');
    } else {
        console.log('🟢 Running in DEVELOPMENT environment');
    }
}
