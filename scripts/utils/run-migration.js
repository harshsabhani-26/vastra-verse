// Quick script to run the SQL migration
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runMigration() {
    try {
        console.log('Executing SQL migration...');

        // Split by semicolon but respect split within blocks if possible, 
        // for simplicity we'll try splitting by double newline + semicolon or just try to execute the whole thing if it's a simple script.
        // However, the error said "cannot insert multiple commands". 
        // The provided SQL uses DO $$ blocks which contain semicolons.
        // A robust split is complex. Since we know the structure:
        // 1. Enums (DO blocks)
        // 2. CREATE TABLE
        // 3. CREATE INDEX

        // Let's try splitting by specific markers or just run them individually manually in the code for safety.
        // actually, let's just define the queries here directly to be safe and avoid parsing issues.

        const queries = [
            `DO $$ BEGIN
            CREATE TYPE "BackupStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;`,

            `DO $$ BEGIN
            CREATE TYPE "BackupType" AS ENUM ('MANUAL', 'AUTOMATIC');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;`,

            `DO $$ BEGIN
            CREATE TYPE "ImportStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;`,

            `CREATE TABLE IF NOT EXISTS "BackupLog" (
            "id" TEXT NOT NULL,
            "filename" TEXT NOT NULL,
            "fileSize" INTEGER NOT NULL,
            "backupType" "BackupType" NOT NULL DEFAULT 'MANUAL',
            "status" "BackupStatus" NOT NULL DEFAULT 'IN_PROGRESS',
            "totalRecords" INTEGER,
            "entityCounts" JSONB,
            "compressed" BOOLEAN NOT NULL DEFAULT true,
            "errorMessage" TEXT,
            "createdBy" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "completedAt" TIMESTAMP(3),
            CONSTRAINT "BackupLog_pkey" PRIMARY KEY ("id")
        );`,

            `CREATE UNIQUE INDEX IF NOT EXISTS "BackupLog_filename_key" ON "BackupLog"("filename");`,
            `CREATE INDEX IF NOT EXISTS "BackupLog_createdAt_idx" ON "BackupLog"("createdAt");`,
            `CREATE INDEX IF NOT EXISTS "BackupLog_backupType_idx" ON "BackupLog"("backupType");`,
            `CREATE INDEX IF NOT EXISTS "BackupLog_status_idx" ON "BackupLog"("status");`,

            `CREATE TABLE IF NOT EXISTS "DataImportLog" (
            "id" TEXT NOT NULL,
            "filename" TEXT NOT NULL,
            "entityType" TEXT NOT NULL,
            "totalRows" INTEGER NOT NULL DEFAULT 0,
            "successCount" INTEGER NOT NULL DEFAULT 0,
            "failureCount" INTEGER NOT NULL DEFAULT 0,
            "status" "ImportStatus" NOT NULL DEFAULT 'IN_PROGRESS',
            "errors" JSONB,
            "importedBy" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "completedAt" TIMESTAMP(3),
            CONSTRAINT "DataImportLog_pkey" PRIMARY KEY ("id")
        );`,

            `CREATE INDEX IF NOT EXISTS "DataImportLog_createdAt_idx" ON "DataImportLog"("createdAt");`,
            `CREATE INDEX IF NOT EXISTS "DataImportLog_entityType_idx" ON "DataImportLog"("entityType");`,
            `CREATE INDEX IF NOT EXISTS "DataImportLog_status_idx" ON "DataImportLog"("status");`,
            `CREATE INDEX IF NOT EXISTS "DataImportLog_importedBy_idx" ON "DataImportLog"("importedBy");`
        ];

        for (const query of queries) {
            await prisma.$executeRawUnsafe(query);
        }

        console.log('✅ Migration completed successfully!');
        console.log('Backup tables created:');
        console.log('  - BackupLog');
        console.log('  - DataImportLog');
        console.log('\nYou can now use the backup system at /admin/backup');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

runMigration();
