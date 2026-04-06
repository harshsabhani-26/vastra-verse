/**
 * Store Settings Seed
 * Upsert-based: creates if not exists, updates if exists
 */
const { PrismaClient } = require('@prisma/client');

async function seedStoreSettings(prisma) {
    console.log('  🏪 Seeding StoreSettings...');

    const existing = await prisma.storeSettings.findFirst();

    if (existing) {
        await prisma.storeSettings.update({
            where: { id: existing.id },
            data: {
                storeName: 'Vastraa Verse',
                tagline: 'Timeless Indian Fashion',
                country: 'India',
                updatedAt: new Date(),
            },
        });
        console.log('  ✅ StoreSettings updated');
    } else {
        await prisma.storeSettings.create({
            data: {
                storeName: 'Vastraa Verse',
                tagline: 'Timeless Indian Fashion',
                country: 'India',
            },
        });
        console.log('  ✅ StoreSettings created');
    }
}

module.exports = { seedStoreSettings };
