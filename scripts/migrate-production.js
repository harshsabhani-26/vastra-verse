/**
 * Production Migration Runner
 * Safe migration deployment with pre-flight checks and logging
 * 
 * Usage:
 *   node scripts/migrate-production.js
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

function getEnvironment() {
    if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT === 'production') return 'production';
    if (process.env.NODE_ENV === 'staging' || process.env.RAILWAY_ENVIRONMENT === 'staging') return 'staging';
    return 'development';
}

async function preFlight() {
    const env = getEnvironment();
    const checks = [];

    // Check DATABASE_URL
    if (!process.env.DATABASE_URL) {
        checks.push({ name: 'DATABASE_URL', status: 'FAIL', message: 'DATABASE_URL not set' });
        return { pass: false, checks };
    }
    checks.push({ name: 'DATABASE_URL', status: 'PASS', message: 'Set' });

    // Check database connection
    try {
        await prisma.$queryRaw`SELECT 1`;
        checks.push({ name: 'DB Connection', status: 'PASS', message: 'Connected' });
    } catch (error) {
        checks.push({ name: 'DB Connection', status: 'FAIL', message: error.message });
        return { pass: false, checks };
    }

    // Environment warning
    if (env === 'production') {
        checks.push({ name: 'Environment', status: 'WARN', message: 'PRODUCTION — ensure backup exists' });
    } else {
        checks.push({ name: 'Environment', status: 'PASS', message: env });
    }

    return { pass: true, checks };
}

async function main() {
    const env = getEnvironment();
    const startTime = Date.now();

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║          Vastra Verse — Migration Runner                 ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');

    // Pre-flight checks
    console.log('🔍 Pre-flight checks...');
    const { pass, checks } = await preFlight();

    for (const check of checks) {
        const icon = check.status === 'PASS' ? '✅' : check.status === 'WARN' ? '⚠️' : '❌';
        console.log(`  ${icon} ${check.name}: ${check.message}`);
    }
    console.log('');

    if (!pass) {
        console.error('❌ Pre-flight checks failed. Aborting migration.');
        process.exit(1);
    }

    // Run prisma migrate deploy
    console.log('🚀 Running: prisma migrate deploy');
    console.log('');

    try {
        const output = execSync('npx prisma migrate deploy', {
            encoding: 'utf-8',
            stdio: 'pipe',
            env: process.env,
        });

        console.log(output);

        const duration = Date.now() - startTime;

        // Log success
        try {
            await prisma.migrationLog.create({
                data: {
                    version: new Date().toISOString().slice(0, 10),
                    type: 'MIGRATION',
                    status: 'SUCCESS',
                    environment: env,
                    executedBy: process.env.USER || process.env.USERNAME || 'system',
                    duration,
                    notes: 'Automated migration via migrate-production script',
                },
            });
        } catch {
            // MigrationLog table may not exist yet on first run
            console.log('  ⚠️  Could not log to MigrationLog (table may not exist yet)');
        }

        console.log('');
        console.log(`✅ Migration completed in ${duration}ms`);
        console.log('');
    } catch (error) {
        const duration = Date.now() - startTime;

        // Log failure
        try {
            await prisma.migrationLog.create({
                data: {
                    version: new Date().toISOString().slice(0, 10),
                    type: 'MIGRATION',
                    status: 'FAILED',
                    environment: env,
                    executedBy: process.env.USER || process.env.USERNAME || 'system',
                    duration,
                    notes: `Migration failed: ${error.message}`,
                },
            });
        } catch {
            // Non-fatal
        }

        console.error('');
        console.error('❌ Migration FAILED');
        console.error(error.stderr || error.message);
        console.error('');
        console.error('⚡ Rollback: Restore from backup if partial migration applied.');
        process.exit(1);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
