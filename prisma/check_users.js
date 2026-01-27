
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const count = await prisma.user.count()
    console.log(`User Count: ${count}`)
    const users = await prisma.user.findMany({ select: { email: true, id: true } })
    console.log('Users:', users)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
