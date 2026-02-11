
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    // Products Categories
    const categories = ['Sarees', 'Lehengas', 'Silks', 'Viscose', 'Embroidery', 'Position']
    for (const name of categories) {
        const slug = name.toLowerCase().replace(/\s+/g, '-');
        await prisma.category.upsert({
            where: { name },
            update: {},
            create: { name, slug },
        })
        console.log(`Upserted category: ${name}`)
    }

    // Create Admin User
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);

    await prisma.user.upsert({
        where: { email: 'harshsabhani18@gmail.com' },
        update: {},
        create: {
            name: 'Admin User',
            email: 'harshsabhani18@gmail.com',
            password: hashedPassword,
            role: 'ADMIN'
        }
    });
    console.log('Upserted Admin User: harshsabhani18@gmail.com');
}
main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
