/**
 * Shipping Settings & Zones Seed
 * Upsert-based: creates if not exists, updates if exists
 */

async function seedShippingSettings(prisma) {
    console.log('  🚚 Seeding ShippingSettings...');

    const existing = await prisma.shippingSettings.findFirst();

    if (existing) {
        await prisma.shippingSettings.update({
            where: { id: existing.id },
            data: {
                freeShippingEnabled: true,
                freeShippingThreshold: 999,
                codEnabled: true,
                codMaxAmount: 50000,
                giftWrapEnabled: true,
                giftWrapCharge: 50,
                autoSendTrackingEmail: true,
                updatedAt: new Date(),
            },
        });
        console.log('  ✅ ShippingSettings updated');
    } else {
        await prisma.shippingSettings.create({
            data: {
                freeShippingEnabled: true,
                freeShippingThreshold: 999,
                codEnabled: true,
                codMaxAmount: 50000,
                giftWrapEnabled: true,
                giftWrapCharge: 50,
                autoSendTrackingEmail: true,
            },
        });
        console.log('  ✅ ShippingSettings created');
    }

    // Default shipping zones
    console.log('  📦 Seeding ShippingZones...');

    const defaultZones = [
        {
            name: 'Metro Cities',
            type: 'METRO',
            pincodes: JSON.stringify(['110001-110099', '400001-400099', '560001-560099', '600001-600099', '700001-700099']),
            minDeliveryDays: 2,
            maxDeliveryDays: 4,
            baseCharge: 0,
            perKgCharge: 0,
            isActive: true,
            displayOrder: 1,
        },
        {
            name: 'Tier-1 Cities',
            type: 'TIER1',
            pincodes: JSON.stringify(['201001-201099', '302001-302099', '380001-380099', '411001-411099']),
            minDeliveryDays: 3,
            maxDeliveryDays: 5,
            baseCharge: 49,
            perKgCharge: 0,
            isActive: true,
            displayOrder: 2,
        },
        {
            name: 'Rest of India',
            type: 'REST',
            pincodes: JSON.stringify(['*']),
            minDeliveryDays: 5,
            maxDeliveryDays: 8,
            baseCharge: 99,
            perKgCharge: 15,
            isActive: true,
            displayOrder: 3,
        },
    ];

    for (const zone of defaultZones) {
        const existingZone = await prisma.shippingZone.findFirst({
            where: { name: zone.name },
        });

        if (existingZone) {
            await prisma.shippingZone.update({
                where: { id: existingZone.id },
                data: { ...zone, updatedAt: new Date() },
            });
            console.log(`  ✅ Zone "${zone.name}" updated`);
        } else {
            await prisma.shippingZone.create({ data: zone });
            console.log(`  ✅ Zone "${zone.name}" created`);
        }
    }
}

module.exports = { seedShippingSettings };
