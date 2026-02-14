-- DropForeignKey
ALTER TABLE "Refund" DROP CONSTRAINT "Refund_returnRequestId_fkey";

-- AlterTable
ALTER TABLE "Refund" ALTER COLUMN "returnRequestId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_returnRequestId_fkey" FOREIGN KEY ("returnRequestId") REFERENCES "ReturnRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
