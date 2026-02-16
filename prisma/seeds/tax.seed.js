/**
 * Tax Settings Seed
 * Upsert-based: creates if not exists, updates if exists
 */

async function seedTaxSettings(prisma) {
    console.log('  💰 Seeding TaxSettings...');

    const existing = await prisma.taxSettings.findFirst();

    if (existing) {
        await prisma.taxSettings.update({
            where: { id: existing.id },
            data: {
                gstEnabled: true,
                cgstRate: 9,
                sgstRate: 9,
                igstRate: 18,
                updatedAt: new Date(),
            },
        });
        console.log('  ✅ TaxSettings updated');
    } else {
        await prisma.taxSettings.create({
            data: {
                gstEnabled: true,
                cgstRate: 9,
                sgstRate: 9,
                igstRate: 18,
            },
        });
        console.log('  ✅ TaxSettings created');
    }
}

module.exports = { seedTaxSettings };
