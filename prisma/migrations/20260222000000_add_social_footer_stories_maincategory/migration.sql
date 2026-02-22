-- =================================================================
--  Migration: add_social_footer_stories_maincategory
--  All schema additions since 20260215070235_hardening_shipment_model
-- =================================================================

-- ── StoreSettings: new optional columns ─────────────────────────
ALTER TABLE "StoreSettings"
  ADD COLUMN IF NOT EXISTS "footerLogo"  TEXT,
  ADD COLUMN IF NOT EXISTS "heroBg"      TEXT,
  ADD COLUMN IF NOT EXISTS "footerBg"    TEXT,
  ADD COLUMN IF NOT EXISTS "whatsapp"    TEXT,
  ADD COLUMN IF NOT EXISTS "facebook"    TEXT,
  ADD COLUMN IF NOT EXISTS "instagram"   TEXT,
  ADD COLUMN IF NOT EXISTS "twitter"     TEXT,
  ADD COLUMN IF NOT EXISTS "youtube"     TEXT;

-- ── User: extra security / profile columns ──────────────────────
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "fcmToken"             TEXT,
  ADD COLUMN IF NOT EXISTS "isVIP"                BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "lastLoginAt"          TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lastLoginIP"          TEXT,
  ADD COLUMN IF NOT EXISTS "lockedUntil"          TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "passwordChangedAt"    TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "phoneVerified"        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "twoFactorEnabled"     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "twoFactorSecret"      TEXT,
  ADD COLUMN IF NOT EXISTS "whatsappOptIn"        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "blockedAt"            TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "blockedReason"        TEXT,
  ADD COLUMN IF NOT EXISTS "failedLoginAttempts"  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "isBlocked"            BOOLEAN NOT NULL DEFAULT false;

-- ── MainCategory table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "MainCategory" (
    "id"           TEXT NOT NULL,
    "name"         TEXT NOT NULL,
    "href"         TEXT NOT NULL,
    "isActive"     BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MainCategory_pkey" PRIMARY KEY ("id")
);

-- ── Story table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Story" (
    "id"             TEXT NOT NULL,
    "title"          TEXT NOT NULL,
    "videoUrl"       TEXT,
    "videoFile"      TEXT,
    "thumbnailImage" TEXT NOT NULL,
    "productId"      TEXT,
    "price"          DECIMAL(65,30),
    "isActive"       BOOLEAN NOT NULL DEFAULT true,
    "displayOrder"   INTEGER NOT NULL DEFAULT 0,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- ── SocialImage table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "SocialImage" (
    "id"           TEXT NOT NULL,
    "imageFile"    TEXT NOT NULL,
    "title"        TEXT,
    "redirectUrl"  TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive"     BOOLEAN NOT NULL DEFAULT true,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SocialImage_pkey" PRIMARY KEY ("id")
);

-- ── SocialVideo table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "SocialVideo" (
    "id"           TEXT NOT NULL,
    "videoUrl"     TEXT,
    "videoFile"    TEXT,
    "thumbnail"    TEXT NOT NULL,
    "overlayText"  TEXT,
    "redirectUrl"  TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive"     BOOLEAN NOT NULL DEFAULT true,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SocialVideo_pkey" PRIMARY KEY ("id")
);

-- ── Indexes: Story ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "Story_isActive_idx"              ON "Story"("isActive");
CREATE INDEX IF NOT EXISTS "Story_displayOrder_idx"          ON "Story"("displayOrder");
CREATE INDEX IF NOT EXISTS "Story_isActive_displayOrder_idx" ON "Story"("isActive", "displayOrder");
CREATE INDEX IF NOT EXISTS "Story_createdAt_idx"             ON "Story"("createdAt");

-- ── Indexes: SocialImage ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "SocialImage_isActive_idx"              ON "SocialImage"("isActive");
CREATE INDEX IF NOT EXISTS "SocialImage_displayOrder_idx"          ON "SocialImage"("displayOrder");
CREATE INDEX IF NOT EXISTS "SocialImage_isActive_displayOrder_idx" ON "SocialImage"("isActive", "displayOrder");

-- ── Indexes: SocialVideo ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "SocialVideo_isActive_idx"              ON "SocialVideo"("isActive");
CREATE INDEX IF NOT EXISTS "SocialVideo_displayOrder_idx"          ON "SocialVideo"("displayOrder");
CREATE INDEX IF NOT EXISTS "SocialVideo_isActive_displayOrder_idx" ON "SocialVideo"("isActive", "displayOrder");

-- ── Foreign key: Story → Product (cascade on delete) ────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Story_productId_fkey'
  ) THEN
    ALTER TABLE "Story"
      ADD CONSTRAINT "Story_productId_fkey"
      FOREIGN KEY ("productId")
      REFERENCES "Product"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
