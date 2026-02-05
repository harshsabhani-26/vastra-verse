-- CreateEnum
CREATE TYPE "BannerTextPosition" AS ENUM ('LEFT', 'CENTER', 'RIGHT', 'TOP', 'BOTTOM');

-- AlterTable
ALTER TABLE "HeroBanner" ADD COLUMN     "subtitleFont" TEXT,
ADD COLUMN     "subtitleSize" TEXT,
ADD COLUMN     "textColor" TEXT,
ADD COLUMN     "textPosition" "BannerTextPosition" NOT NULL DEFAULT 'CENTER',
ADD COLUMN     "titleFont" TEXT,
ADD COLUMN     "titleSize" TEXT;
