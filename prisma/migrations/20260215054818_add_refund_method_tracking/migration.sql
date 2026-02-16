-- CreateEnum
CREATE TYPE "RefundMethodEnum" AS ENUM ('AUTOMATIC', 'MANUAL_UPI', 'MANUAL_BANK', 'STORE_CREDIT');

-- AlterEnum
ALTER TYPE "RefundStatusEnum" ADD VALUE 'INITIATED';

-- AlterTable
ALTER TABLE "Refund" ADD COLUMN     "manualRefundAccountNo" TEXT,
ADD COLUMN     "manualRefundBankName" TEXT,
ADD COLUMN     "manualRefundIfsc" TEXT,
ADD COLUMN     "manualRefundNotes" TEXT,
ADD COLUMN     "manualRefundUpiId" TEXT,
ADD COLUMN     "refundMethod" "RefundMethodEnum" NOT NULL DEFAULT 'AUTOMATIC';

-- CreateIndex
CREATE INDEX "Refund_refundMethod_idx" ON "Refund"("refundMethod");
