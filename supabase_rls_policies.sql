-- =====================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES - SECURE VERSION
-- Phase 4: Security Hardening (FIXED)
-- =====================================================
-- 
-- CRITICAL SECURITY FIX:
-- - Removed user_metadata checks (user-editable, insecure!)
-- - Added RLS to ALL public tables
-- - Using service role bypass for Next.js API routes
-- 
-- RECOMMENDED APPROACH FOR NEXT.JS + PRISMA:
-- Since you're using Next.js API routes with Prisma (not Supabase Auth),
-- the BEST security model is:
-- 
-- 1. DISABLE PostgREST API (not needed for Next.js)
-- 2. Use service role key in Prisma (bypasses RLS)
-- 3. All auth happens in Next.js API routes
-- 
-- If you want RLS as defense-in-depth, execute this script.
-- Otherwise, simply disable the PostgREST API.
-- =====================================================

-- =====================================================
-- OPTION 1: DISABLE POSTGREST API (RECOMMENDED)
-- =====================================================
-- 
-- Go to: Dashboard > Settings > API > PostgREST
-- Set "Enable PostgREST" to OFF
-- 
-- This is the SIMPLEST and MOST SECURE option since:
-- - All access goes through your Next.js API routes
-- - Your middleware and requireAdmin() provide security
-- - No need for complex RLS policies
-- - Better performance (one less layer)
-- 
-- If you disabled PostgREST, you can STOP HERE.
-- The remaining script is only needed if PostgREST is enabled.
-- =====================================================

-- =====================================================
-- OPTION 2: COMPREHENSIVE RLS (If PostgREST enabled)
-- =====================================================

-- WARNING: Since you're using NextAuth (not Supabase Auth),
-- auth.uid() will NOT work. These policies will DENY everything
-- except service role access (which is what you want!).

-- This effectively makes PostgREST read-only or admin-only.

-- =====================================================
-- 1. ENABLE RLS ON ALL PUBLIC TABLES
-- =====================================================

-- Critical user data tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailVerification" ENABLE ROW LEVEL SECURITY;

-- User-owned data
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Wishlist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Address" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NotificationPreferences" ENABLE ROW LEVEL SECURITY;

-- Payment and sensitive data
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Refund" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentGatewaySettings" ENABLE ROW LEVEL SECURITY;

-- Order-related
ALTER TABLE "OrderNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderTimeline" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomerNote" ENABLE ROW LEVEL SECURITY;

-- Public read, admin write
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Coupon" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CouponUsage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HeroBanner" ENABLE ROW LEVEL SECURITY;

-- Admin-only tables
ALTER TABLE "ActivityLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StoreSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TaxSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SystemSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShippingSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShippingZone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CourierPartner" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BackupLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DataImportLog" ENABLE ROW LEVEL SECURITY;

-- Public data (analytics, appointments, contact)
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContactSubmission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SearchQuery" ENABLE ROW LEVEL SECURITY;

-- Prisma internal
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. CREATE RESTRICTIVE POLICIES (DENY BY DEFAULT)
-- =====================================================

-- Since you're not using Supabase Auth, these policies will
-- DENY all PostgREST access except via service role.
-- Your Next.js API routes use service role, so they bypass RLS.

-- PUBLIC READ TABLES (anyone can read, only service role can write)
-- =====================================================

-- Products (public catalog)
CREATE POLICY "public_read_products" ON "Product"
FOR SELECT USING (true);

CREATE POLICY "service_role_only_products" ON "Product"
FOR ALL USING (false); -- Denied unless service role

-- Product Images
CREATE POLICY "public_read_product_images" ON "ProductImage"
FOR SELECT USING (true);

CREATE POLICY "service_role_only_product_images" ON "ProductImage"
FOR ALL USING (false);

-- Categories
CREATE POLICY "public_read_categories" ON "Category"
FOR SELECT USING (true);

CREATE POLICY "service_role_only_categories" ON "Category"
FOR ALL USING (false);

-- Hero Banners
CREATE POLICY "public_read_banners" ON "HeroBanner"
FOR SELECT USING (true);

CREATE POLICY "service_role_only_banners" ON "HeroBanner"
FOR ALL USING (false);

-- PRIVATE TABLES (service role only = Next.js API only)
-- =====================================================

-- User data
CREATE POLICY "service_role_only_users" ON "User"
FOR ALL USING (false);

CREATE POLICY "service_role_only_accounts" ON "Account"
FOR ALL USING (false);

CREATE POLICY "service_role_only_sessions" ON "Session"
FOR ALL USING (false);

CREATE POLICY "service_role_only_verification_tokens" ON "VerificationToken"
FOR ALL USING (false);

CREATE POLICY "service_role_only_email_verification" ON "EmailVerification"
FOR ALL USING (false);

-- Orders
CREATE POLICY "service_role_only_orders" ON "Order"
FOR ALL USING (false);

CREATE POLICY "service_role_only_order_items" ON "OrderItem"
FOR ALL USING (false);

CREATE POLICY "service_role_only_order_notes" ON "OrderNote"
FOR ALL USING (false);

CREATE POLICY "service_role_only_order_timeline" ON "OrderTimeline"
FOR ALL USING (false);

-- Payments
CREATE POLICY "service_role_only_payments" ON "Payment"
FOR ALL USING (false);

CREATE POLICY "service_role_only_refunds" ON "Refund"
FOR ALL USING (false);

CREATE POLICY "service_role_only_payment_settings" ON "PaymentGatewaySettings"
FOR ALL USING (false);

-- User preferences
CREATE POLICY "service_role_only_wishlist" ON "Wishlist"
FOR ALL USING (false);

CREATE POLICY "service_role_only_addresses" ON "Address"
FOR ALL USING (false);

CREATE POLICY "service_role_only_notifications" ON "Notification"
FOR ALL USING (false);

CREATE POLICY "service_role_only_notification_prefs" ON "NotificationPreferences"
FOR ALL USING (false);

-- Coupons
CREATE POLICY "service_role_only_coupons" ON "Coupon"
FOR ALL USING (false);

CREATE POLICY "service_role_only_coupon_usage" ON "CouponUsage"
FOR ALL USING (false);

-- Admin/Settings
CREATE POLICY "service_role_only_activity_log" ON "ActivityLog"
FOR ALL USING (false);

CREATE POLICY "service_role_only_customer_notes" ON "CustomerNote"
FOR ALL USING (false);

CREATE POLICY "service_role_only_store_settings" ON "StoreSettings"
FOR ALL USING (false);

CREATE POLICY "service_role_only_tax_settings" ON "TaxSettings"
FOR ALL USING (false);

CREATE POLICY "service_role_only_email_settings" ON "EmailSettings"
FOR ALL USING (false);

CREATE POLICY "service_role_only_system_settings" ON "SystemSettings"
FOR ALL USING (false);

CREATE POLICY "service_role_only_shipping_settings" ON "ShippingSettings"
FOR ALL USING (false);

CREATE POLICY "service_role_only_shipping_zones" ON "ShippingZone"
FOR ALL USING (false);

CREATE POLICY "service_role_only_courier_partners" ON "CourierPartner"
FOR ALL USING (false);

CREATE POLICY "service_role_only_backup_log" ON "BackupLog"
FOR ALL USING (false);

CREATE POLICY "service_role_only_import_log" ON "DataImportLog"
FOR ALL USING (false);

-- Public data collection
CREATE POLICY "service_role_only_appointments" ON "Appointment"
FOR ALL USING (false);

CREATE POLICY "service_role_only_contact" ON "ContactSubmission"
FOR ALL USING (false);

CREATE POLICY "service_role_only_search" ON "SearchQuery"
FOR ALL USING (false);

-- Prisma
CREATE POLICY "service_role_only_migrations" ON "_prisma_migrations"
FOR ALL USING (false);

-- =====================================================
-- 3. SUMMARY
-- =====================================================

-- WHAT THIS DOES:
-- ✅ Enables RLS on ALL public tables (fixes security warnings)
-- ✅ Makes PostgREST read-only for public catalog (Product, Category, etc.)
-- ✅ Blocks ALL PostgREST write access (only service role = Next.js API)
-- ✅ Blocks ALL PostgREST access to sensitive tables
-- ✅ Your Next.js API routes work normally (use service role key)

-- RECOMMENDED: Disable PostgREST entirely and remove these policies
-- Go to: Dashboard > Settings > API > Disable PostgREST

-- =====================================================
-- END OF RLS POLICIES
-- =====================================================
