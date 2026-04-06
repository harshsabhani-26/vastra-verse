-- CreateEnum
CREATE TYPE "BannerDisplayFor" AS ENUM ('WEB', 'MOBILE', 'BOTH');

-- CreateEnum
CREATE TYPE "CodSettlementStatus" AS ENUM ('PENDING', 'COLLECTED', 'SETTLED', 'DISPUTED', 'FAILED');

-- CreateEnum
CREATE TYPE "ErrorSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'ORDER_CONFIRMED';
ALTER TYPE "NotificationType" ADD VALUE 'STOCK_REPLENISHED';
ALTER TYPE "NotificationType" ADD VALUE 'RETURN_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'RETURN_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'REFUND_INITIATED';
ALTER TYPE "NotificationType" ADD VALUE 'REFUND_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE 'SHIPMENT_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'SHIPMENT_PICKUP_SCHEDULED';
ALTER TYPE "NotificationType" ADD VALUE 'OUT_FOR_DELIVERY';
ALTER TYPE "NotificationType" ADD VALUE 'DELIVERED';
ALTER TYPE "NotificationType" ADD VALUE 'DELIVERY_FAILED';
ALTER TYPE "NotificationType" ADD VALUE 'RTO_INITIATED';
ALTER TYPE "NotificationType" ADD VALUE 'COURIER_EXCEPTION';
ALTER TYPE "NotificationType" ADD VALUE 'COD_SETTLEMENT_MISMATCH';
ALTER TYPE "NotificationType" ADD VALUE 'WEBHOOK_FAILURE';
ALTER TYPE "NotificationType" ADD VALUE 'GATEWAY_ERROR';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ShipmentStatus" ADD VALUE 'LABEL_GENERATED';
ALTER TYPE "ShipmentStatus" ADD VALUE 'PICKED_UP';
ALTER TYPE "ShipmentStatus" ADD VALUE 'DELIVERY_ATTEMPTED';
ALTER TYPE "ShipmentStatus" ADD VALUE 'NDR_RAISED';
ALTER TYPE "ShipmentStatus" ADD VALUE 'RTO_INITIATED';
ALTER TYPE "ShipmentStatus" ADD VALUE 'RTO_IN_TRANSIT';
ALTER TYPE "ShipmentStatus" ADD VALUE 'RTO_DELIVERED';
ALTER TYPE "ShipmentStatus" ADD VALUE 'EXCEPTION';

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "appointmentType" TEXT NOT NULL DEFAULT 'STORE';

-- AlterTable
ALTER TABLE "HeroBanner" ADD COLUMN     "displayFor" "BannerDisplayFor" NOT NULL DEFAULT 'BOTH';

-- AlterTable
ALTER TABLE "MainCategory" ADD COLUMN     "mobileImage" TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingCity" TEXT;

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "carrier" TEXT NOT NULL DEFAULT 'SHIPROCKET',
ADD COLUMN     "codCollectionFee" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "codSettlementReference" TEXT,
ADD COLUMN     "codSettlementStatus" "CodSettlementStatus" DEFAULT 'PENDING',
ADD COLUMN     "courierAgentName" TEXT,
ADD COLUMN     "fuelSurcharge" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "insuranceFee" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "manifestUrl" TEXT,
ADD COLUMN     "pickupConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "pickupManifestId" TEXT,
ADD COLUMN     "pickupPincode" TEXT,
ADD COLUMN     "profitImpact" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "shiprocketOrderId" TEXT,
ADD COLUMN     "totalShippingCost" DECIMAL(65,30) DEFAULT 0;

-- AlterTable
ALTER TABLE "SocialImage" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SocialVideo" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Story" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "CourierPerformance" (
    "id" TEXT NOT NULL,
    "courierId" TEXT,
    "courierName" TEXT NOT NULL,
    "avgDeliveryTime" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "successRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "rtoRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "score" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalShipments" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourierPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodReconciliation" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "codAmount" DECIMAL(65,30) NOT NULL,
    "collectedDate" TIMESTAMP(3),
    "settlementDate" TIMESTAMP(3),
    "settlementReference" TEXT,
    "settlementStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "gapAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NdrEvent" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "awbNumber" TEXT NOT NULL,
    "ndrCode" TEXT NOT NULL,
    "ndrReason" TEXT NOT NULL,
    "attemptDate" TIMESTAMP(3) NOT NULL,
    "actionTaken" TEXT,
    "actionDate" TIMESTAMP(3),
    "adminNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NdrEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemAlert" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MigrationLog" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedBy" TEXT,
    "status" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "duration" INTEGER,
    "notes" TEXT,

    CONSTRAINT "MigrationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookAuditLog" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventId" TEXT,
    "status" TEXT NOT NULL,
    "rejectionReason" TEXT,
    "ipAddress" TEXT,
    "signatureReceived" TEXT,
    "signatureExpected" TEXT,
    "rawPayload" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,

    CONSTRAINT "WebhookAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorLog" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "severity" "ErrorSeverity" NOT NULL DEFAULT 'ERROR',
    "source" TEXT NOT NULL,
    "endpoint" TEXT,
    "statusCode" INTEGER,
    "userId" TEXT,
    "orderId" TEXT,
    "requestId" TEXT,
    "metadata" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "count" INTEGER NOT NULL DEFAULT 1,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessMetric" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "period" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertConfiguration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "threshold" DECIMAL(65,30) NOT NULL,
    "window" INTEGER NOT NULL DEFAULT 60,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'WARNING',
    "channels" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "cooldown" INTEGER NOT NULL DEFAULT 15,
    "lastFiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertHistory" (
    "id" TEXT NOT NULL,
    "configurationId" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "channel" TEXT NOT NULL,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "firedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceMetric" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "statusCode" INTEGER,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourierPerformance_courierName_key" ON "CourierPerformance"("courierName");

-- CreateIndex
CREATE INDEX "CourierPerformance_courierName_idx" ON "CourierPerformance"("courierName");

-- CreateIndex
CREATE INDEX "CourierPerformance_score_idx" ON "CourierPerformance"("score");

-- CreateIndex
CREATE INDEX "CourierPerformance_lastUpdated_idx" ON "CourierPerformance"("lastUpdated");

-- CreateIndex
CREATE INDEX "CodReconciliation_shipmentId_idx" ON "CodReconciliation"("shipmentId");

-- CreateIndex
CREATE INDEX "CodReconciliation_settlementStatus_idx" ON "CodReconciliation"("settlementStatus");

-- CreateIndex
CREATE INDEX "CodReconciliation_collectedDate_idx" ON "CodReconciliation"("collectedDate");

-- CreateIndex
CREATE INDEX "CodReconciliation_settlementDate_idx" ON "CodReconciliation"("settlementDate");

-- CreateIndex
CREATE INDEX "NdrEvent_shipmentId_idx" ON "NdrEvent"("shipmentId");

-- CreateIndex
CREATE INDEX "NdrEvent_awbNumber_idx" ON "NdrEvent"("awbNumber");

-- CreateIndex
CREATE INDEX "NdrEvent_actionTaken_idx" ON "NdrEvent"("actionTaken");

-- CreateIndex
CREATE INDEX "SystemAlert_isResolved_idx" ON "SystemAlert"("isResolved");

-- CreateIndex
CREATE INDEX "SystemAlert_severity_idx" ON "SystemAlert"("severity");

-- CreateIndex
CREATE INDEX "SystemAlert_createdAt_idx" ON "SystemAlert"("createdAt");

-- CreateIndex
CREATE INDEX "MigrationLog_version_idx" ON "MigrationLog"("version");

-- CreateIndex
CREATE INDEX "MigrationLog_executedAt_idx" ON "MigrationLog"("executedAt");

-- CreateIndex
CREATE INDEX "MigrationLog_status_idx" ON "MigrationLog"("status");

-- CreateIndex
CREATE INDEX "MigrationLog_environment_idx" ON "MigrationLog"("environment");

-- CreateIndex
CREATE INDEX "WebhookAuditLog_provider_idx" ON "WebhookAuditLog"("provider");

-- CreateIndex
CREATE INDEX "WebhookAuditLog_eventType_idx" ON "WebhookAuditLog"("eventType");

-- CreateIndex
CREATE INDEX "WebhookAuditLog_status_idx" ON "WebhookAuditLog"("status");

-- CreateIndex
CREATE INDEX "WebhookAuditLog_processedAt_idx" ON "WebhookAuditLog"("processedAt");

-- CreateIndex
CREATE INDEX "WebhookAuditLog_eventId_idx" ON "WebhookAuditLog"("eventId");

-- CreateIndex
CREATE INDEX "WebhookAuditLog_provider_status_processedAt_idx" ON "WebhookAuditLog"("provider", "status", "processedAt");

-- CreateIndex
CREATE INDEX "ErrorLog_fingerprint_idx" ON "ErrorLog"("fingerprint");

-- CreateIndex
CREATE INDEX "ErrorLog_severity_idx" ON "ErrorLog"("severity");

-- CreateIndex
CREATE INDEX "ErrorLog_source_idx" ON "ErrorLog"("source");

-- CreateIndex
CREATE INDEX "ErrorLog_resolved_idx" ON "ErrorLog"("resolved");

-- CreateIndex
CREATE INDEX "ErrorLog_createdAt_idx" ON "ErrorLog"("createdAt");

-- CreateIndex
CREATE INDEX "ErrorLog_userId_idx" ON "ErrorLog"("userId");

-- CreateIndex
CREATE INDEX "ErrorLog_orderId_idx" ON "ErrorLog"("orderId");

-- CreateIndex
CREATE INDEX "ErrorLog_fingerprint_resolved_idx" ON "ErrorLog"("fingerprint", "resolved");

-- CreateIndex
CREATE INDEX "ErrorLog_source_severity_createdAt_idx" ON "ErrorLog"("source", "severity", "createdAt");

-- CreateIndex
CREATE INDEX "BusinessMetric_name_period_idx" ON "BusinessMetric"("name", "period");

-- CreateIndex
CREATE INDEX "BusinessMetric_timestamp_idx" ON "BusinessMetric"("timestamp");

-- CreateIndex
CREATE INDEX "BusinessMetric_name_timestamp_idx" ON "BusinessMetric"("name", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessMetric_name_period_timestamp_key" ON "BusinessMetric"("name", "period", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "AlertConfiguration_name_key" ON "AlertConfiguration"("name");

-- CreateIndex
CREATE INDEX "AlertConfiguration_type_idx" ON "AlertConfiguration"("type");

-- CreateIndex
CREATE INDEX "AlertConfiguration_enabled_idx" ON "AlertConfiguration"("enabled");

-- CreateIndex
CREATE INDEX "AlertHistory_configurationId_idx" ON "AlertHistory"("configurationId");

-- CreateIndex
CREATE INDEX "AlertHistory_severity_idx" ON "AlertHistory"("severity");

-- CreateIndex
CREATE INDEX "AlertHistory_firedAt_idx" ON "AlertHistory"("firedAt");

-- CreateIndex
CREATE INDEX "AlertHistory_resolved_idx" ON "AlertHistory"("resolved");

-- CreateIndex
CREATE INDEX "PerformanceMetric_type_name_idx" ON "PerformanceMetric"("type", "name");

-- CreateIndex
CREATE INDEX "PerformanceMetric_timestamp_idx" ON "PerformanceMetric"("timestamp");

-- CreateIndex
CREATE INDEX "PerformanceMetric_type_timestamp_idx" ON "PerformanceMetric"("type", "timestamp");

-- CreateIndex
CREATE INDEX "PerformanceMetric_name_timestamp_idx" ON "PerformanceMetric"("name", "timestamp");

-- CreateIndex
CREATE INDEX "Address_userId_idx" ON "Address"("userId");

-- CreateIndex
CREATE INDEX "Address_userId_type_idx" ON "Address"("userId", "type");

-- CreateIndex
CREATE INDEX "Address_userId_isDefault_idx" ON "Address"("userId", "isDefault");

-- CreateIndex
CREATE INDEX "EmailVerification_expiresAt_idx" ON "EmailVerification"("expiresAt");

-- CreateIndex
CREATE INDEX "EmailVerification_createdAt_idx" ON "EmailVerification"("createdAt");

-- CreateIndex
CREATE INDEX "HeroBanner_displayFor_idx" ON "HeroBanner"("displayFor");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_paymentMethod_createdAt_idx" ON "Order"("paymentStatus", "paymentMethod", "createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expires_idx" ON "Session"("expires");

-- CreateIndex
CREATE INDEX "Shipment_codSettlementStatus_idx" ON "Shipment"("codSettlementStatus");

-- CreateIndex
CREATE INDEX "Shipment_shiprocketOrderId_idx" ON "Shipment"("shiprocketOrderId");

-- AddForeignKey
ALTER TABLE "CodReconciliation" ADD CONSTRAINT "CodReconciliation_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NdrEvent" ADD CONSTRAINT "NdrEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertHistory" ADD CONSTRAINT "AlertHistory_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "AlertConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
