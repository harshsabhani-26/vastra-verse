const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function main() { 
    await prisma.product.update({ where: { id: 'cmo8l2cvm00087p6gaqnbt3xj' }, data: { stock: 1000 } }); 
    console.log('STOCK RESET TO 1000'); 
} 
main().finally(() => prisma.$disconnect());
