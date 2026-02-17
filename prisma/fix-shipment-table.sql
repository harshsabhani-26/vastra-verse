-- Fix: Create missing Shipment table and enum
-- The migrations were marked as applied but the table was never actually created.
-- Run this against your Supabase database.

-- Step 1: Create the ShipmentStatus enum (if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE "ShipmentStatus" AS ENUM (
        'PENDING', 'READY_TO_SHIP', 'PICKUP_SCHEDULED', 'IN_TRANSIT',
        'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED',
        'RETURN_INITIATED', 'RETURN_PICKED', 'RETURN_DELIVERED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create the Shipment table (from migration 20260215065305)
CREATE TABLE IF NOT EXISTS "Shipment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "providerShipmentId" TEXT,
    "awbNumber" TEXT,
    "courierName" TEXT,
    "labelUrl" TEXT,
    "trackingUrl" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "isReturn" BOOLEAN NOT NULL DEFAULT false,
    "pickupScheduledAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "returnInitiatedAt" TIMESTAMP(3),
    "estimatedDeliveryAt" TIMESTAMP(3),
    "weight" DECIMAL(65,30) DEFAULT 0,
    "length" DECIMAL(65,30) DEFAULT 0,
    "breadth" DECIMAL(65,30) DEFAULT 0,
    "height" DECIMAL(65,30) DEFAULT 0,
    "providerResponse" JSONB,
    "trackingData" JSONB,
    "cancellationReason" TEXT,
    "failureReason" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Shipment_providerShipmentId_key" ON "Shipment"("providerShipmentId");
CREATE UNIQUE INDEX IF NOT EXISTS "Shipment_awbNumber_key" ON "Shipment"("awbNumber");
CREATE INDEX IF NOT EXISTS "Shipment_orderId_idx" ON "Shipment"("orderId");
CREATE INDEX IF NOT EXISTS "Shipment_awbNumber_idx" ON "Shipment"("awbNumber");
CREATE INDEX IF NOT EXISTS "Shipment_status_idx" ON "Shipment"("status");
CREATE INDEX IF NOT EXISTS "Shipment_isReturn_idx" ON "Shipment"("isReturn");
CREATE INDEX IF NOT EXISTS "Shipment_createdAt_idx" ON "Shipment"("createdAt");

-- Step 4: Add foreign key (skip if already exists)
DO $$ BEGIN
    ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey"
        FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 5: Add hardening columns (from migration 20260215070235)
DO $$ BEGIN
    ALTER TABLE "Shipment" ADD COLUMN "actualWeight" DECIMAL(65,30) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "Shipment" ADD COLUMN "chargeableWeight" DECIMAL(65,30) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "Shipment" ADD COLUMN "codCollectedAmount" DECIMAL(65,30) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "Shipment" ADD COLUMN "codRemittance" DECIMAL(65,30) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "Shipment" ADD COLUMN "codSettledAmount" DECIMAL(65,30) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "Shipment" ADD COLUMN "codSettlementDate" TIMESTAMP(3);
EXCEPTION WHEN duplicate_column THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "Shipment" ADD COLUMN "codTransactionId" TEXT;
EXCEPTION WHEN duplicate_column THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "Shipment" ADD COLUMN "rtoCost" DECIMAL(65,30) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "Shipment" ADD COLUMN "shippingCost" DECIMAL(65,30) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "Shipment" ADD COLUMN "volumetricWeight" DECIMAL(65,30) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN null; END $$;
