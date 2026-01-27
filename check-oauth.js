const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAccounts() {
    try {
        console.log('🔍 Checking OAuth accounts and sessions...\n');

        // Check all accounts
        const accounts = await prisma.account.findMany({
            include: {
                user: true
            }
        });

        console.log('📱 OAuth Accounts:');
        accounts.forEach(acc => {
            console.log(`  Provider: ${acc.provider}`);
            console.log(`  Provider Account ID: ${acc.providerAccountId}`);
            console.log(`  Linked to User: ${acc.user.email} (${acc.user.name})`);
            console.log('  ---');
        });

        // Check all sessions
        const sessions = await prisma.session.findMany({
            include: {
                user: true
            }
        });

        console.log('\n🔐 Active Sessions:');
        if (sessions.length === 0) {
            console.log('  No active sessions');
        } else {
            sessions.forEach(sess => {
                console.log(`  User: ${sess.user.email} (${sess.user.name})`);
                console.log(`  Expires: ${sess.expires}`);
                console.log('  ---');
            });
        }

        // Check users
        const users = await prisma.user.findMany({
            select: {
                email: true,
                name: true,
                role: true,
                image: true
            }
        });

        console.log('\n👥 All Users:');
        users.forEach(user => {
            console.log(`  ${user.email} - ${user.name} - Role: ${user.role}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAccounts();
