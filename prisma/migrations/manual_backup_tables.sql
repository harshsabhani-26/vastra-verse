-- Create BackupStatus enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "BackupStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create BackupType enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "BackupType" AS ENUM ('MANUAL', 'AUTOMATIC');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create ImportStatus enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "ImportStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create BackupLog table
CREATE TABLE IF NOT EXISTS "BackupLog" (
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
);

-- Create unique index on filename
CREATE UNIQUE INDEX IF NOT EXISTS "BackupLog_filename_key" ON "BackupLog"("filename");

-- Create indexes
CREATE INDEX IF NOT EXISTS "BackupLog_createdAt_idx" ON "BackupLog"("createdAt");
CREATE INDEX IF NOT EXISTS "BackupLog_backupType_idx" ON "BackupLog"("backupType");
CREATE INDEX IF NOT EXISTS "BackupLog_status_idx" ON "BackupLog"("status");

-- Create DataImportLog table
CREATE TABLE IF NOT EXISTS "DataImportLog" (
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
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "DataImportLog_createdAt_idx" ON "DataImportLog"("createdAt");
CREATE INDEX IF NOT EXISTS "DataImportLog_entityType_idx" ON "DataImportLog"("entityType");
CREATE INDEX IF NOT EXISTS "DataImportLog_status_idx" ON "DataImportLog"("status");
CREATE INDEX IF NOT EXISTS "DataImportLog_importedBy_idx" ON "DataImportLog"("importedBy");
