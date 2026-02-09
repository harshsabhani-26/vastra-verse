
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const colors = ['Beige']; // Test with a color known to exist

    console.log('Testing query with colors:', colors);

    const where = {
        colors: {
            hasSome: colors
        }
    };

    const products = await prisma.product.findMany({
        where,
        select: {
            name: true,
            colors: true
        }
    });

    console.log('Found products:', JSON.stringify(products, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
