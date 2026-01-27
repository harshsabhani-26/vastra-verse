const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        console.log('=== USERS IN DATABASE ===');
        console.log(`Total users: ${users.length}\n`);

        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name || 'No Name'} (${user.email})`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
            console.log('');
        });

        await prisma.$disconnect();
    } catch (error) {
        console.error('Error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

listUsers();
