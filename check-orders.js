const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkOrdersAndFixUsers() {
    try {
        // Get all orders with user info
        const orders = await prisma.order.findMany({
            select: {
                id: true,
                userId: true,
                customerName: true,
                customerPhone: true,
                total: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
            take: 5, // Just show first 5
        });

        console.log('\n=== SAMPLE ORDERS ===');
        orders.forEach((order, index) => {
            console.log(`${index + 1}. Order ID: ${order.id.slice(0, 8)}...`);
            console.log(`   Total: ₹${order.total}`);
            console.log(`   Customer: ${order.customerName || 'N/A'}`);
            if (order.user) {
                console.log(`   User: ${order.user.name} (${order.user.email})`);
                console.log(`   User Role: ${order.user.role}`);
            } else {
                console.log(`   User: Not found (orphaned order)`);
            }
            console.log('');
        });

        // Check if harshsabhani18@gmail.com made orders
        const harshOrders = await prisma.order.count({
            where: {
                user: {
                    email: 'harshsabhani18@gmail.com'
                }
            }
        });

        console.log(`\n📊 Orders by harshsabhani18@gmail.com: ${harshOrders}`);

        // Should we change Harsh's role to USER?
        if (harshOrders > 0) {
            console.log('\n💡 RECOMMENDATION:');
            console.log('   User "Harsh Sabhani" (harshsabhani18@gmail.com) has placed orders');
            console.log('   but has ADMIN role. Change to USER role so they appear in customers page?');
            console.log('\n   Run: node fix-harsh-role.js');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkOrdersAndFixUsers();
