/*
  Warnings:

  - You are about to drop the `ProductVariant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VariantImage` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "BannerMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- DropForeignKey
ALTER TABLE "ProductVariant" DROP CONSTRAINT "ProductVariant_productId_fkey";

-- DropForeignKey
ALTER TABLE "VariantImage" DROP CONSTRAINT "VariantImage_variantId_fkey";

-- AlterTable
ALTER TABLE "HeroBanner" ADD COLUMN     "mediaType" "BannerMediaType" NOT NULL DEFAULT 'IMAGE',
ADD COLUMN     "videoUrl" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "colors" TEXT[];

-- DropTable
DROP TABLE "ProductVariant";

-- DropTable
DROP TABLE "VariantImage";
