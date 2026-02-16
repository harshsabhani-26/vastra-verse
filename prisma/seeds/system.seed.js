/**
 * System Settings Seed
 * Upsert-based: creates if not exists, updates if exists
 */

async function seedSystemSettings(prisma) {
    console.log('  ⚙️  Seeding SystemSettings...');

    const existing = await prisma.systemSettings.findFirst();

    if (existing) {
        await prisma.systemSettings.update({
            where: { id: existing.id },
            data: {
                currency: 'INR',
                currencySymbol: '₹',
                currencyPosition: 'before',
                decimalPlaces: 2,
                timezone: 'Asia/Kolkata',
                dateFormat: 'DD/MM/YYYY',
                timeFormat: '12',
                sessionTimeout: 30,
                passwordMinLength: 12,
                passwordRequireUpper: true,
                passwordRequireLower: true,
                passwordRequireNumber: true,
                passwordRequireSymbol: true,
                maxLoginAttempts: 5,
                lockoutDuration: 30,
                maintenanceMode: false,
                updatedAt: new Date(),
            },
        });
        console.log('  ✅ SystemSettings updated');
    } else {
        await prisma.systemSettings.create({
            data: {
                currency: 'INR',
                currencySymbol: '₹',
                currencyPosition: 'before',
                decimalPlaces: 2,
                timezone: 'Asia/Kolkata',
                dateFormat: 'DD/MM/YYYY',
                timeFormat: '12',
                sessionTimeout: 30,
                passwordMinLength: 12,
                passwordRequireUpper: true,
                passwordRequireLower: true,
                passwordRequireNumber: true,
                passwordRequireSymbol: true,
                maxLoginAttempts: 5,
                lockoutDuration: 30,
                maintenanceMode: false,
            },
        });
        console.log('  ✅ SystemSettings created');
    }
}

module.exports = { seedSystemSettings };
