/**
 * Courier Partner Seed
 * Upsert-based using unique `name` field
 */

async function seedCourierPartners(prisma) {
    console.log('  📮 Seeding CourierPartners...');

    const partners = [
        {
            name: 'Shiprocket',
            trackingUrlTemplate: 'https://shiprocket.co/tracking/{awb}',
            supportsCOD: true,
            supportsInternational: false,
            isActive: true,
            displayOrder: 1,
        },
        {
            name: 'BlueDart',
            trackingUrlTemplate: 'https://www.bluedart.com/tracking/{awb}',
            supportsCOD: true,
            supportsInternational: true,
            isActive: true,
            displayOrder: 2,
        },
        {
            name: 'DTDC',
            trackingUrlTemplate: 'https://www.dtdc.com/tracking/{awb}',
            supportsCOD: true,
            supportsInternational: false,
            isActive: true,
            displayOrder: 3,
        },
        {
            name: 'Ecom Express',
            trackingUrlTemplate: 'https://ecomexpress.in/tracking/?awb_field={awb}',
            supportsCOD: true,
            supportsInternational: false,
            isActive: false,
            displayOrder: 4,
        },
    ];

    for (const partner of partners) {
        await prisma.courierPartner.upsert({
            where: { name: partner.name },
            update: {
                trackingUrlTemplate: partner.trackingUrlTemplate,
                supportsCOD: partner.supportsCOD,
                supportsInternational: partner.supportsInternational,
                isActive: partner.isActive,
                displayOrder: partner.displayOrder,
            },
            create: partner,
        });
        console.log(`  ✅ Courier "${partner.name}" upserted`);
    }
}

module.exports = { seedCourierPartners };
