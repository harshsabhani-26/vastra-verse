const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function makeUserAdmin(email) {
    try {
        const user = await prisma.user.update({
            where: { email: email },
            data: { role: 'ADMIN' }
        });

        console.log(`✅ User ${user.email} is now an ADMIN`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role}`);

        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await prisma.$disconnect();
        process.exit(1);
    }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    console.error('Usage: node scripts/make_admin.js <email>');
    process.exit(1);
}

makeUserAdmin(email);
