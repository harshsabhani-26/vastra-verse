-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED', 'SPAM');

-- CreateEnum
CREATE TYPE "ContactPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "ContactSubmission" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT '+91',
    "phoneNumber" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "comment" TEXT,
    "newsletter" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContactStatus" NOT NULL DEFAULT 'NEW',
    "assignedTo" TEXT,
    "priority" "ContactPriority" NOT NULL DEFAULT 'NORMAL',
    "adminNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactSubmission_status_idx" ON "ContactSubmission"("status");

-- CreateIndex
CREATE INDEX "ContactSubmission_createdAt_idx" ON "ContactSubmission"("createdAt");

-- CreateIndex
CREATE INDEX "ContactSubmission_email_idx" ON "ContactSubmission"("email");
