/*
  Warnings:

  - Made the column `returnRequestId` on table `Refund` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'NOT_APPLICABLE');

-- DropForeignKey
ALTER TABLE "Refund" DROP CONSTRAINT "Refund_returnRequestId_fkey";

-- AlterTable
ALTER TABLE "Refund" ALTER COLUMN "returnRequestId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ReturnRequest" ADD COLUMN     "inspectionStatus" "InspectionStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "refundAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ReturnItem" (
    "id" TEXT NOT NULL,
    "returnRequestId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "refundAmount" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "ReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReturnItem_returnRequestId_idx" ON "ReturnItem"("returnRequestId");

-- CreateIndex
CREATE INDEX "ReturnItem_orderItemId_idx" ON "ReturnItem"("orderItemId");

-- CreateIndex
CREATE INDEX "ReturnRequest_inspectionStatus_idx" ON "ReturnRequest"("inspectionStatus");

-- CreateIndex
CREATE INDEX "ReturnRequest_requestedAt_idx" ON "ReturnRequest"("requestedAt");

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_returnRequestId_fkey" FOREIGN KEY ("returnRequestId") REFERENCES "ReturnRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_returnRequestId_fkey" FOREIGN KEY ("returnRequestId") REFERENCES "ReturnRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
