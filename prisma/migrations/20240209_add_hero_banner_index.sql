
-- Create index for HeroBanner optimization
CREATE INDEX CONCURRENTLY hero_banner_active_type_order ON "HeroBanner" ("isActive", "bannerType", "displayOrder");
