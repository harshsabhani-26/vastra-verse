-- =====================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- Phase 4: Security Hardening
-- =====================================================
-- 
-- IMPORTANT: Execute these SQL commands in your Supabase SQL Editor
-- Navigate to: Supabase Dashboard > SQL Editor > New Query
--
-- These policies ensure:
-- 1. Users can only access their own data
-- 2. Admin users can access all data
-- 3. Proper data isolation for multi-tenant security
-- =====================================================

-- =====================================================
-- 1. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on User table
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on Order table
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on OrderItem table  
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on Wishlist table
ALTER TABLE "Wishlist" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. DROP EXISTING POLICIES (IF ANY)
-- =====================================================

-- Clean up existing policies to avoid conflicts
DROP POLICY IF EXISTS "users_select_own" ON "User";
DROP POLICY IF EXISTS "users_update_own" ON "User";
DROP POLICY IF EXISTS "admin_all_users" ON "User";

DROP POLICY IF EXISTS "users_select_own_orders" ON "Order";
DROP POLICY IF EXISTS "admin_all_orders" ON "Order";

DROP POLICY IF EXISTS "users_select_own_order_items" ON "OrderItem";
DROP POLICY IF EXISTS "admin_all_order_items" ON "OrderItem";

DROP POLICY IF EXISTS "users_select_own_wishlist" ON "Wishlist";
DROP POLICY IF EXISTS "users_manage_own_wishlist" ON "Wishlist";
DROP POLICY IF EXISTS "admin_all_wishlist" ON "Wishlist";

-- =====================================================
-- 3. USER TABLE POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "users_select_own" 
ON "User" FOR SELECT
USING (
    auth.uid() = id 
    OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
);

-- Users can update their own profile
CREATE POLICY "users_update_own" 
ON "User" FOR UPDATE
USING (
    auth.uid() = id 
    OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
);

-- Admin can perform all operations on any user
CREATE POLICY "admin_all_users" 
ON "User" FOR ALL
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
);

-- =====================================================
-- 4. ORDER TABLE POLICIES
-- =====================================================

-- Users can view their own orders
CREATE POLICY "users_select_own_orders" 
ON "Order" FOR SELECT
USING (
    "userId" = auth.uid() 
    OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
);

-- Only admins can modify orders
CREATE POLICY "admin_all_orders" 
ON "Order" FOR ALL
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
);

-- =====================================================
-- 5. ORDER ITEM TABLE POLICIES
-- =====================================================

-- Users can view their own order items (via order relationship)
CREATE POLICY "users_select_own_order_items" 
ON "OrderItem" FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM "Order"
        WHERE "Order".id = "OrderItem"."orderId"
        AND (
            "Order"."userId" = auth.uid()
            OR
            (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
        )
    )
);

-- Only admins can modify order items
CREATE POLICY "admin_all_order_items" 
ON "OrderItem" FOR ALL
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
);

-- =====================================================
-- 6. WISHLIST TABLE POLICIES
-- =====================================================

-- Users can view their own wishlist
CREATE POLICY "users_select_own_wishlist" 
ON "Wishlist" FOR SELECT
USING (
    "userId" = auth.uid() 
    OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
);

-- Users can manage (insert, update, delete) their own wishlist
CREATE POLICY "users_manage_own_wishlist" 
ON "Wishlist" FOR ALL
USING (
    "userId" = auth.uid()
);

-- Admin can perform all operations on any wishlist
CREATE POLICY "admin_all_wishlist" 
ON "Wishlist" FOR ALL
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
);

-- =====================================================
-- 7. VERIFICATION & TESTING
-- =====================================================

-- After running these policies, test the following:

-- 1. As a regular user, verify you can:
--    - View your own user profile
--    - View your own orders and order items
--    - Manage your own wishlist
--    - NOT view other users' data

-- 2. As an admin user, verify you can:
--    - View all users
--    - View all orders
--    - Modify any data

-- 3. Test queries:
/*
-- Test as non-admin user (should only return their orders)
SELECT * FROM "Order" WHERE "userId" = '<your-user-id>';

-- Test as admin user (should return all orders)
SELECT * FROM "Order";
*/

-- =====================================================
-- NOTES
-- =====================================================

-- 1. These policies assume NextAuth v5 with JWT tokens
-- 2. The 'role' field must be in user_metadata of the JWT
-- 3. Supabase auth.uid() returns the authenticated user's ID
-- 4. Admin role is verified via JWT metadata: role = 'ADMIN'

-- 5. If you're using a different auth system, adjust:
--    auth.uid() -> your user ID function
--    auth.jwt() -> your JWT extraction method

-- 6. For production, consider adding:
--    - IP-based restrictions
--    - Additional audit logging
--    - More granular permissions

-- =====================================================
-- END OF RLS POLICIES
-- =====================================================
