const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient()

async function setupAdmin() {
    try {
        // Delete existing user if exists
        await prisma.user.deleteMany({
            where: { email: 'yogitextile43@gmail.com' }
        });
        console.log('🗑️  Deleted existing user (if any)');

        // Create new admin user
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await prisma.user.create({
            data: {
                name: 'Admin User',
                email: 'yogitextile43@gmail.com',
                password: hashedPassword,
                role: 'ADMIN',
                emailVerified: new Date()
            }
        });

        console.log('✅ Admin user created successfully!');
        console.log('  Email:', user.email);
        console.log('  Name:', user.name);
        console.log('  Role:', user.role);
        console.log('\n🔑 Login credentials:');
        console.log('  Email: yogitextile43@gmail.com');
        console.log('  Password: password123');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

setupAdmin();
