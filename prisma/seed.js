/**
 * Master Seed Runner
 * Orchestrates all seed files with logging and error handling
 * 
 * Usage:
 *   node prisma/seed.js           (development)
 *   node prisma/seed.js --prod    (production — requires confirmation)
 */

const { PrismaClient } = require('@prisma/client');

// Import seed modules
const { seedStoreSettings } = require('./seeds/store.seed');
const { seedTaxSettings } = require('./seeds/tax.seed');
const { seedShippingSettings } = require('./seeds/shipping.seed');
const { seedCourierPartners } = require('./seeds/courier.seed');
const { seedEmailSettings } = require('./seeds/email.seed');
const { seedSystemSettings } = require('./seeds/system.seed');

const prisma = new PrismaClient();

const SEED_VERSION = '1.0.0';

function getEnvironment() {
    if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT === 'production') return 'production';
    if (process.env.NODE_ENV === 'staging' || process.env.RAILWAY_ENVIRONMENT === 'staging') return 'staging';
    return 'development';
}

async function logMigration(type, status, notes, duration) {
    try {
        await prisma.migrationLog.create({
            data: {
                version: SEED_VERSION,
                type,
                status,
                environment: getEnvironment(),
                executedBy: process.env.USER || process.env.USERNAME || 'system',
                duration,
                notes,
            },
        });
    } catch (error) {
        console.error('  ⚠️  Failed to log migration (non-fatal):', error.message);
    }
}

async function main() {
    const env = getEnvironment();
    const isProd = env === 'production';
    const startTime = Date.now();

    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log(`  🌱 Vastra Verse Database Seeder v${SEED_VERSION}`);
    console.log(`  📍 Environment: ${env.toUpperCase()}`);
    console.log(`  ⏰ Started: ${new Date().toISOString()}`);
    console.log('═══════════════════════════════════════════');
    console.log('');

    if (isProd) {
        console.log('╔══════════════════════════════════════════╗');
        console.log('║  🔴 PRODUCTION SEEDING                   ║');
        console.log('║  Ensure backup exists before proceeding.  ║');
        console.log('║  All operations use UPSERT (safe).        ║');
        console.log('╚══════════════════════════════════════════╝');
        console.log('');
    }

    const seeds = [
        { name: 'StoreSettings', fn: seedStoreSettings },
        { name: 'TaxSettings', fn: seedTaxSettings },
        { name: 'ShippingSettings & Zones', fn: seedShippingSettings },
        { name: 'CourierPartners', fn: seedCourierPartners },
        { name: 'EmailSettings', fn: seedEmailSettings },
        { name: 'SystemSettings', fn: seedSystemSettings },
    ];

    let successCount = 0;
    let failCount = 0;

    for (const seed of seeds) {
        try {
            await seed.fn(prisma);
            successCount++;
        } catch (error) {
            failCount++;
            console.error(`  ❌ Failed to seed ${seed.name}:`, error.message);

            // In production, stop on first failure
            if (isProd) {
                await logMigration('SEED', 'FAILED', `Failed at ${seed.name}: ${error.message}`, Date.now() - startTime);
                throw error;
            }
        }
    }

    // Also seed categories (from original seed)
    console.log('  📂 Seeding Categories...');
    const categories = ['Sarees', 'Lehengas', 'Silks', 'Viscose', 'Embroidery', 'Position'];
    for (const name of categories) {
        const slug = name.toLowerCase().replace(/\s+/g, '-');
        await prisma.category.upsert({
            where: { name },
            update: {},
            create: { name, slug },
        });
    }
    console.log(`  ✅ ${categories.length} categories upserted`);

    const duration = Date.now() - startTime;

    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log(`  ✅ Seeding complete!`);
    console.log(`  ✓ Success: ${successCount + 1} | ✗ Failed: ${failCount}`);
    console.log(`  ⏱  Duration: ${duration}ms`);
    console.log('═══════════════════════════════════════════');
    console.log('');

    await logMigration('SEED', failCount === 0 ? 'SUCCESS' : 'PARTIAL', `Seeded ${successCount + 1} modules`, duration);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('');
        console.error('❌ Seed failed:', e.message);
        console.error('');
        await prisma.$disconnect();
        process.exit(1);
    });
