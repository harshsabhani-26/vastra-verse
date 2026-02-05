-- AlterEnum
ALTER TYPE "BannerType" ADD VALUE 'BOTTOM_PAGE';

-- AlterTable
ALTER TABLE "EmailVerification" ADD COLUMN     "phone" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "EmailVerification_phone_otp_idx" ON "EmailVerification"("phone", "otp");

-- CreateIndex
CREATE INDEX "EmailVerification_phone_type_idx" ON "EmailVerification"("phone", "type");
