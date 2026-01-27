/**
 * Database Migration Script for Settings & Security System
 * 
 * Run this script manually when ready to migrate:
 * 1. Close all dev servers and applications using the database
 * 2. Run: node scripts/migrate-settings.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Settings & Security System - Database Migration');
console.log('===================================================\n');

// Check if node_modules/.prisma exists and can be deleted
const prismaPath = path.join(__dirname, '..', 'node_modules', '.prisma');

try {
    console.log('Step 1: Cleaning up Prisma client...');

    if (fs.existsSync(prismaPath)) {
        console.log('  Removing old Prisma client...');
        fs.rmSync(prismaPath, { recursive: true, force: true });
        console.log('  ✅ Old client removed');
    } else {
        console.log('  ℹ️  No old client found');
    }

    console.log('\nStep 2: Running database migration...');
    execSync('npx prisma db push --skip-generate', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
    });
    console.log('  ✅ Database migration complete');

    console.log('\nStep 3: Generating new Prisma client...');
    execSync('npx prisma generate', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
    });
    console.log('  ✅ Prisma client generated');

    console.log('\n✅ Migration Complete!');
    console.log('\nNext steps:');
    console.log('1. Restart your development server: npm run dev');
    console.log('2. Navigate to /admin/settings to configure your store');
    console.log('3. Test the new security features');
    console.log('\nNew Features Available:');
    console.log('- Store Settings (/admin/settings/store)');
    console.log('- Tax & GST Settings (/admin/settings/tax)');
    console.log('- System Settings (/admin/settings/system)');
    console.log('- Activity Logs (/admin/activity-logs)');
    console.log('- Two-Factor Authentication');
    console.log('- Account Lockout Protection');
    console.log('- Maintenance Mode');

} catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure no dev servers are running');
    console.log('2. Close your IDE and restart it');
    console.log('3. Try running: npm run db:push manually');
    console.log('4. Check that your database is accessible');
    process.exit(1);
}
