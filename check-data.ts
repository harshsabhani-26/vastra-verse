import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
    try {
        const productCount = await prisma.product.count();
        const refundCount = await prisma.refund.count();
        const orderCount = await prisma.order.count();

        console.log('=== DATABASE STATS ===');
        console.log(`Total Products: ${productCount}`);
        console.log(`Total Refunds: ${refundCount}`);
        console.log(`Total Orders: ${orderCount}`);

        if (productCount > 0) {
            const products = await prisma.product.findMany({
                take: 5,
                include: {
                    category: true
                }
            });
            console.log('\n=== SAMPLE PRODUCTS ===');
            products.forEach(p => {
                console.log(`- ${p.name} (Stock: ${p.stock}, Price: ₹${p.price})`);
            });
        }

        if (refundCount > 0) {
            const refunds = await prisma.refund.findMany({
                take: 5
            });
            console.log('\n=== SAMPLE REFUNDS ===');
            refunds.forEach(r => {
                console.log(`- ${r.id}: ₹${r.amount} (${r.status})`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
