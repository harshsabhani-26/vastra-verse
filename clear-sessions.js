const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupSessions() {
    try {
        console.log('🧹 Cleaning up all sessions...');

        // Delete all sessions
        const deleted = await prisma.session.deleteMany({});
        console.log(`✅ Deleted ${deleted.count} sessions`);

        // Show current users
        const users = await prisma.user.findMany({
            select: {
                email: true,
                name: true,
                role: true,
            }
        });

        console.log('\n📧 Current users in database:');
        users.forEach(user => {
            console.log(`  ${user.email} - ${user.name} - ${user.role}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupSessions();
