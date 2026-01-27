/*
  Warnings:

  - The values [PROCESSING] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `images` on the `Product` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Category` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "ImageType" AS ENUM ('MAIN', 'FRONT_VIEW', 'BACK_VIEW', 'BORDER_CLOSEUP', 'PALLU_CLOSEUP', 'BLOUSE_PIECE');

-- CreateEnum
CREATE TYPE "OrderRefundStatus" AS ENUM ('NONE', 'PARTIAL', 'FULL');

-- CreateEnum
CREATE TYPE "PaymentStatusEnum" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethodEnum" AS ENUM ('COD', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'WALLET');

-- CreateEnum
CREATE TYPE "RefundStatusEnum" AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'PROCESSED', 'REJECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FLAT_AMOUNT', 'FREE_SHIPPING');

-- CreateEnum
CREATE TYPE "CouponStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_ORDER', 'ORDER_STATUS_CHANGED', 'ORDER_CANCELLED', 'PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'LOW_STOCK_ALERT', 'OUT_OF_STOCK', 'RETURN_REQUEST', 'REFUND_PROCESSED', 'NEW_USER_SIGNUP', 'NEW_APPOINTMENT', 'ADMIN_ACTION', 'SYSTEM_ALERT');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'WHATSAPP', 'PUSH');

-- CreateEnum
CREATE TYPE "BackupType" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'RETURNED', 'CANCELLED');
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cgst" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "courierName" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "discount" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "giftWrapCharge" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "giftWrapEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "giftWrapMessage" TEXT,
ADD COLUMN     "gstRate" DECIMAL(65,30) DEFAULT 18,
ADD COLUMN     "igst" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "refundStatus" "OrderRefundStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "sgst" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "shippingAddress" TEXT,
ADD COLUMN     "shippingCharges" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "shippingState" TEXT,
ADD COLUMN     "subtotal" DECIMAL(65,30),
ADD COLUMN     "trackingNumber" TEXT;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "images",
ADD COLUMN     "isBestSeller" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isNewArrival" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "blockedAt" TIMESTAMP(3),
ADD COLUMN     "blockedReason" TEXT,
ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fcmToken" TEXT,
ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVIP" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lastLoginIP" TEXT,
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "passwordChangedAt" TIMESTAMP(3),
ADD COLUMN     "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT,
ADD COLUMN     "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "ImageType" NOT NULL DEFAULT 'MAIN',
    "position" INTEGER NOT NULL DEFAULT 0,
    "alt" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderNote" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderTimeline" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "details" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatusEnum" NOT NULL DEFAULT 'PENDING',
    "method" "PaymentMethodEnum" NOT NULL,
    "gatewayProvider" TEXT,
    "gatewayOrderId" TEXT,
    "gatewayPaymentId" TEXT,
    "gatewaySignature" TEXT,
    "failureReason" TEXT,
    "failureCode" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(65,30),
    "cgst" DECIMAL(65,30) DEFAULT 0,
    "sgst" DECIMAL(65,30) DEFAULT 0,
    "igst" DECIMAL(65,30) DEFAULT 0,
    "gstRate" DECIMAL(65,30) DEFAULT 18,
    "metadata" JSONB,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RefundStatusEnum" NOT NULL DEFAULT 'PENDING',
    "gatewayRefundId" TEXT,
    "gatewayStatus" TEXT,
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvalNotes" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "processingNotes" TEXT,
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentGatewaySettings" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isTestMode" BOOLEAN NOT NULL DEFAULT true,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "merchantId" TEXT,
    "webhookSecret" TEXT,
    "webhookUrl" TEXT,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentGatewaySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "pincodes" JSONB NOT NULL,
    "minDeliveryDays" INTEGER NOT NULL DEFAULT 2,
    "maxDeliveryDays" INTEGER NOT NULL DEFAULT 5,
    "baseCharge" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "perKgCharge" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourierPartner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trackingUrlTemplate" TEXT,
    "supportsCOD" BOOLEAN NOT NULL DEFAULT false,
    "supportsInternational" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourierPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingSettings" (
    "id" TEXT NOT NULL,
    "freeShippingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "freeShippingThreshold" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "codEnabled" BOOLEAN NOT NULL DEFAULT true,
    "codMaxAmount" DECIMAL(65,30) NOT NULL DEFAULT 10000,
    "codExtraCharges" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "giftWrapEnabled" BOOLEAN NOT NULL DEFAULT true,
    "giftWrapCharge" DECIMAL(65,30) NOT NULL DEFAULT 50,
    "giftWrapMessageMaxLength" INTEGER NOT NULL DEFAULT 200,
    "internationalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoSendTrackingEmail" BOOLEAN NOT NULL DEFAULT true,
    "defaultCourierId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "type" "CouponType" NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxUses" INTEGER,
    "maxUsesPerUser" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "minOrderValue" DECIMAL(65,30),
    "applicableProducts" JSONB,
    "applicableCategories" JSONB,
    "newUsersOnly" BOOLEAN NOT NULL DEFAULT false,
    "firstOrderOnly" BOOLEAN NOT NULL DEFAULT false,
    "autoApply" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalDiscount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponUsage" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "discountAmount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreSettings" (
    "id" TEXT NOT NULL,
    "storeName" TEXT NOT NULL DEFAULT 'My Store',
    "tagline" TEXT,
    "logo" TEXT,
    "favicon" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "zipCode" TEXT,
    "businessName" TEXT,
    "registrationNumber" TEXT,
    "panNumber" TEXT,
    "operatingHours" JSONB,
    "facebook" TEXT,
    "instagram" TEXT,
    "twitter" TEXT,
    "youtube" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxSettings" (
    "id" TEXT NOT NULL,
    "gstEnabled" BOOLEAN NOT NULL DEFAULT true,
    "gstin" TEXT,
    "stateOfReg" TEXT,
    "cgstRate" DECIMAL(65,30) NOT NULL DEFAULT 9,
    "sgstRate" DECIMAL(65,30) NOT NULL DEFAULT 9,
    "igstRate" DECIMAL(65,30) NOT NULL DEFAULT 18,
    "defaultHsnCode" TEXT,
    "taxExemptCategories" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailSettings" (
    "id" TEXT NOT NULL,
    "smtpHost" TEXT,
    "smtpPort" INTEGER DEFAULT 587,
    "smtpUsername" TEXT,
    "smtpPassword" TEXT,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT true,
    "fromEmail" TEXT,
    "fromName" TEXT,
    "replyToEmail" TEXT,
    "orderConfirmation" BOOLEAN NOT NULL DEFAULT true,
    "orderShipped" BOOLEAN NOT NULL DEFAULT true,
    "orderDelivered" BOOLEAN NOT NULL DEFAULT true,
    "accountCreated" BOOLEAN NOT NULL DEFAULT true,
    "passwordReset" BOOLEAN NOT NULL DEFAULT true,
    "adminOrderEmail" TEXT,
    "adminNotifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT,
    "maintenanceAllowedIPs" JSONB,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "currencySymbol" TEXT NOT NULL DEFAULT '₹',
    "currencyPosition" TEXT NOT NULL DEFAULT 'before',
    "decimalPlaces" INTEGER NOT NULL DEFAULT 2,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "timeFormat" TEXT NOT NULL DEFAULT '12',
    "sessionTimeout" INTEGER NOT NULL DEFAULT 30,
    "passwordMinLength" INTEGER NOT NULL DEFAULT 12,
    "passwordRequireUpper" BOOLEAN NOT NULL DEFAULT true,
    "passwordRequireLower" BOOLEAN NOT NULL DEFAULT true,
    "passwordRequireNumber" BOOLEAN NOT NULL DEFAULT true,
    "passwordRequireSymbol" BOOLEAN NOT NULL DEFAULT true,
    "passwordExpiryDays" INTEGER,
    "maxLoginAttempts" INTEGER NOT NULL DEFAULT 5,
    "lockoutDuration" INTEGER NOT NULL DEFAULT 30,
    "require2FA" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "method" TEXT,
    "path" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "role" "Role",
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "resourceType" TEXT,
    "resourceId" TEXT,
    "data" JSONB,
    "channels" "NotificationChannel"[] DEFAULT ARRAY['IN_APP']::"NotificationChannel"[],
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "whatsappSent" BOOLEAN NOT NULL DEFAULT false,
    "whatsappSentAt" TIMESTAMP(3),
    "pushSent" BOOLEAN NOT NULL DEFAULT false,
    "pushSentAt" TIMESTAMP(3),
    "actionUrl" TEXT,
    "actionText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "digestEnabled" BOOLEAN NOT NULL DEFAULT false,
    "digestFrequency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupLog" (
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

-- CreateTable
CREATE TABLE "DataImportLog" (
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

-- CreateTable
CREATE TABLE "SearchQuery" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeroBanner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "ctaText" TEXT NOT NULL,
    "ctaLink" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroBanner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "storeLocation" TEXT NOT NULL,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "preferredTime" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3),
    "message" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "allowPhoneContact" BOOLEAN NOT NULL DEFAULT true,
    "newsletterSignup" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");

-- CreateIndex
CREATE INDEX "OrderNote_orderId_idx" ON "OrderNote"("orderId");

-- CreateIndex
CREATE INDEX "OrderTimeline_orderId_idx" ON "OrderTimeline"("orderId");

-- CreateIndex
CREATE INDEX "CustomerNote_userId_idx" ON "CustomerNote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_gatewayOrderId_key" ON "Payment"("gatewayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_gatewayPaymentId_key" ON "Payment"("gatewayPaymentId");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_method_idx" ON "Payment"("method");

-- CreateIndex
CREATE INDEX "Payment_gatewayOrderId_idx" ON "Payment"("gatewayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_gatewayRefundId_key" ON "Refund"("gatewayRefundId");

-- CreateIndex
CREATE INDEX "Refund_paymentId_idx" ON "Refund"("paymentId");

-- CreateIndex
CREATE INDEX "Refund_orderId_idx" ON "Refund"("orderId");

-- CreateIndex
CREATE INDEX "Refund_status_idx" ON "Refund"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentGatewaySettings_provider_key" ON "PaymentGatewaySettings"("provider");

-- CreateIndex
CREATE INDEX "ShippingZone_type_idx" ON "ShippingZone"("type");

-- CreateIndex
CREATE INDEX "ShippingZone_isActive_idx" ON "ShippingZone"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CourierPartner_name_key" ON "CourierPartner"("name");

-- CreateIndex
CREATE INDEX "CourierPartner_isActive_idx" ON "CourierPartner"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_code_idx" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_isActive_idx" ON "Coupon"("isActive");

-- CreateIndex
CREATE INDEX "Coupon_type_idx" ON "Coupon"("type");

-- CreateIndex
CREATE INDEX "Coupon_startDate_endDate_idx" ON "Coupon"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "CouponUsage_couponId_idx" ON "CouponUsage"("couponId");

-- CreateIndex
CREATE INDEX "CouponUsage_userId_idx" ON "CouponUsage"("userId");

-- CreateIndex
CREATE INDEX "CouponUsage_orderId_idx" ON "CouponUsage"("orderId");

-- CreateIndex
CREATE INDEX "CouponUsage_createdAt_idx" ON "CouponUsage"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");

-- CreateIndex
CREATE INDEX "ActivityLog_resourceType_idx" ON "ActivityLog"("resourceType");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_status_idx" ON "ActivityLog"("status");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_expiresAt_idx" ON "Notification"("expiresAt");

-- CreateIndex
CREATE INDEX "Notification_role_idx" ON "Notification"("role");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreferences_userId_key" ON "NotificationPreferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BackupLog_filename_key" ON "BackupLog"("filename");

-- CreateIndex
CREATE INDEX "BackupLog_createdAt_idx" ON "BackupLog"("createdAt");

-- CreateIndex
CREATE INDEX "BackupLog_backupType_idx" ON "BackupLog"("backupType");

-- CreateIndex
CREATE INDEX "BackupLog_status_idx" ON "BackupLog"("status");

-- CreateIndex
CREATE INDEX "DataImportLog_createdAt_idx" ON "DataImportLog"("createdAt");

-- CreateIndex
CREATE INDEX "DataImportLog_entityType_idx" ON "DataImportLog"("entityType");

-- CreateIndex
CREATE INDEX "DataImportLog_status_idx" ON "DataImportLog"("status");

-- CreateIndex
CREATE INDEX "DataImportLog_importedBy_idx" ON "DataImportLog"("importedBy");

-- CreateIndex
CREATE UNIQUE INDEX "SearchQuery_term_key" ON "SearchQuery"("term");

-- CreateIndex
CREATE INDEX "HeroBanner_isActive_idx" ON "HeroBanner"("isActive");

-- CreateIndex
CREATE INDEX "HeroBanner_displayOrder_idx" ON "HeroBanner"("displayOrder");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE INDEX "Appointment_appointmentDate_idx" ON "Appointment"("appointmentDate");

-- CreateIndex
CREATE INDEX "Appointment_createdAt_idx" ON "Appointment"("createdAt");

-- CreateIndex
CREATE INDEX "Appointment_customerEmail_idx" ON "Appointment"("customerEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Order_shippingState_idx" ON "Order"("shippingState");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");

-- CreateIndex
CREATE INDEX "Order_status_paymentStatus_idx" ON "Order"("status", "paymentStatus");

-- CreateIndex
CREATE INDEX "Order_userId_status_idx" ON "Order"("userId", "status");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");

-- CreateIndex
CREATE INDEX "Product_isBestSeller_status_idx" ON "Product"("isBestSeller", "status");

-- CreateIndex
CREATE INDEX "Product_isNewArrival_status_idx" ON "Product"("isNewArrival", "status");

-- CreateIndex
CREATE INDEX "Product_isFeatured_status_idx" ON "Product"("isFeatured", "status");

-- CreateIndex
CREATE INDEX "Product_price_idx" ON "Product"("price");

-- CreateIndex
CREATE INDEX "Product_status_createdAt_idx" ON "Product"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Product_categoryId_status_idx" ON "Product"("categoryId", "status");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_isVIP_idx" ON "User"("isVIP");

-- CreateIndex
CREATE INDEX "User_role_createdAt_idx" ON "User"("role", "createdAt");

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderNote" ADD CONSTRAINT "OrderNote_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderTimeline" ADD CONSTRAINT "OrderTimeline_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerNote" ADD CONSTRAINT "CustomerNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreferences" ADD CONSTRAINT "NotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
