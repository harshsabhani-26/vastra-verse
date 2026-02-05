const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient()

async function checkAdmin() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'yogitextile43@gmail.com' }
        });

        if (!user) {
            console.log('❌ User not found: yogitextile43@gmail.com');
            return;
        }

        console.log('✅ User found:');
        console.log('  Email:', user.email);
        console.log('  Name:', user.name);
        console.log('  Role:', user.role);
        console.log('  Has password:', !!user.password);
        console.log('  Password hash (first 20 chars):', user.password?.substring(0, 20));

        // Test password
        if (user.password) {
            const isValid = await bcrypt.compare('password123', user.password);
            console.log('  Password "password123" is valid:', isValid);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdmin();
