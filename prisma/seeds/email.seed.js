/**
 * Email Settings Seed
 * Upsert-based: creates if not exists, updates if exists
 */

async function seedEmailSettings(prisma) {
    console.log('  📧 Seeding EmailSettings...');

    const existing = await prisma.emailSettings.findFirst();

    if (existing) {
        await prisma.emailSettings.update({
            where: { id: existing.id },
            data: {
                orderConfirmation: true,
                orderShipped: true,
                orderDelivered: true,
                accountCreated: true,
                passwordReset: true,
                adminNotifications: true,
                updatedAt: new Date(),
            },
        });
        console.log('  ✅ EmailSettings updated');
    } else {
        await prisma.emailSettings.create({
            data: {
                orderConfirmation: true,
                orderShipped: true,
                orderDelivered: true,
                accountCreated: true,
                passwordReset: true,
                adminNotifications: true,
            },
        });
        console.log('  ✅ EmailSettings created');
    }
}

module.exports = { seedEmailSettings };
