const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function main() { 
    const user = await prisma.user.findFirst(); 
    const product = await prisma.product.findFirst({ where: { status: 'PUBLISHED' } }); 
    console.log(JSON.stringify({ userId: user?.id, productId: product?.id })); 
} 

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
