-- =============================================================
-- PRIVCEY EDU — Seed Super Admin (Alternative SQL Method)
-- =============================================================
-- 
-- RECOMMENDED: Use the script instead:
--   npx tsx scripts/seed-admin.ts
-- 
-- The script creates the user in Supabase Auth AND profiles table
-- automatically using the service_role key.
--
-- This SQL method only works if you manually create the auth user
-- via Supabase Dashboard > Authentication > Users > Add user first.
-- Then run this to ensure the profile role is 'admin'.
-- =============================================================

-- After manually creating user in Supabase Auth Dashboard,
-- replace 'admin@privcey.com' with the actual admin email:
UPDATE profiles
SET role = 'admin',
    is_active = true,
    payment_status = 'active',
    payment_expires_at = NULL,
    updated_at = NOW()
WHERE email = 'admin@privcey.com';

-- Verify
SELECT id, email, full_name, role, is_active
FROM profiles
WHERE role = 'admin';
