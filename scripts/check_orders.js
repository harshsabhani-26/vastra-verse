const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrders() {
    try {
        const orders = await prisma.order.findMany({
            include: {
                user: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        console.log('=== ORDERS IN DATABASE ===');
        console.log(`Total orders: ${orders.length}\n`);

        orders.forEach((order, index) => {
            console.log(`Order ${index + 1}:`);
            console.log(`  ID: ${order.id}`);
            console.log(`  User: ${order.user?.name || order.user?.email}`);
            console.log(`  Total: ₹${order.total}`);
            console.log(`  Status: ${order.status}`);
            console.log(`  Items: ${order.items.length}`);
            order.items.forEach((item, i) => {
                console.log(`    ${i + 1}. ${item.product.name} - Qty: ${item.quantity} - Price: ₹${item.price}`);
            });
            console.log('');
        });

        await prisma.$disconnect();
    } catch (error) {
        console.error('Error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

checkOrders();
