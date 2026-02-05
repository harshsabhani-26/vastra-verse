-- CreateEnum
CREATE TYPE "BannerType" AS ENUM ('HERO', 'MID_PAGE');

-- AlterTable
ALTER TABLE "HeroBanner" ADD COLUMN     "bannerType" "BannerType" NOT NULL DEFAULT 'HERO';

-- CreateIndex
CREATE INDEX "HeroBanner_bannerType_idx" ON "HeroBanner"("bannerType");

-- CreateIndex
CREATE INDEX "HeroBanner_bannerType_isActive_idx" ON "HeroBanner"("bannerType", "isActive");
