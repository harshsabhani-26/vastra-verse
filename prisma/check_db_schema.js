
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        // Try to count accounts - if table exists it works, else throws
        const count = await prisma.account.count()
        console.log(`Account Table Exists. Count: ${count}`)

        // Also check database name
        // const dbName = await prisma.$queryRaw`SELECT current_database();`
        // console.log('Connected to DB:', dbName)
    } catch (e) {
        console.error('Error verifying Account table:', e.message)
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
