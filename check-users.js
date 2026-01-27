const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
    try {
        // Get all users
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        console.log('\n=== ALL USERS IN DATABASE ===');
        console.log(`Total users: ${allUsers.length}\n`);

        if (allUsers.length === 0) {
            console.log('❌ No users found in database');
        } else {
            allUsers.forEach((user, index) => {
                console.log(`${index + 1}. ${user.name || 'No name'}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
                console.log('');
            });
        }

        // Count by role
        const adminCount = allUsers.filter(u => u.role === 'ADMIN').length;
        const userCount = allUsers.filter(u => u.role === 'USER').length;

        console.log('\n=== ROLE BREAKDOWN ===');
        console.log(`👑 Admins: ${adminCount}`);
        console.log(`👤 Customers (USER role): ${userCount}`);

        if (userCount === 0) {
            console.log('\n⚠️  WARNING: No users with role "USER" found!');
            console.log('   The admin customers page will show "No customers found"');
            console.log('   because it only displays users with role "USER".');
        }

        // Get total orders
        const orderCount = await prisma.order.count();
        console.log(`\n📦 Total orders in database: ${orderCount}`);

    } catch (error) {
        console.error('Error checking users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
