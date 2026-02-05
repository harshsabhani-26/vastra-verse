/*
  Warnings:

  - You are about to drop the column `ctaText` on the `HeroBanner` table. All the data in the column will be lost.
  - You are about to drop the column `subtitle` on the `HeroBanner` table. All the data in the column will be lost.
  - You are about to drop the column `subtitleFont` on the `HeroBanner` table. All the data in the column will be lost.
  - You are about to drop the column `subtitleSize` on the `HeroBanner` table. All the data in the column will be lost.
  - You are about to drop the column `textColor` on the `HeroBanner` table. All the data in the column will be lost.
  - You are about to drop the column `textPosition` on the `HeroBanner` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `HeroBanner` table. All the data in the column will be lost.
  - You are about to drop the column `titleFont` on the `HeroBanner` table. All the data in the column will be lost.
  - You are about to drop the column `titleSize` on the `HeroBanner` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "HeroBanner" DROP COLUMN "ctaText",
DROP COLUMN "subtitle",
DROP COLUMN "subtitleFont",
DROP COLUMN "subtitleSize",
DROP COLUMN "textColor",
DROP COLUMN "textPosition",
DROP COLUMN "title",
DROP COLUMN "titleFont",
DROP COLUMN "titleSize";

-- DropEnum
DROP TYPE "BannerTextPosition";
