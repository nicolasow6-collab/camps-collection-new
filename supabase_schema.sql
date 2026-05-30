-- Create login_attempts table if not exists for server-side rate limiting
CREATE TABLE IF NOT EXISTS public.login_attempts (
  ip TEXT NOT NULL PRIMARY KEY,
  attempts INTEGER DEFAULT 1,
  last_attempt TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid duplication errors)
DROP POLICY IF EXISTS "Allow public read access to cards" ON public.cards;
DROP POLICY IF EXISTS "Allow admin all access to cards" ON public.cards;
DROP POLICY IF EXISTS "Allow public read access to categories" ON public.categories;
DROP POLICY IF EXISTS "Allow admin all access to categories" ON public.categories;
DROP POLICY IF EXISTS "Allow admin all access to orders" ON public.orders;
DROP POLICY IF EXISTS "Allow admin all access to users" ON public.users;

-- ==========================================
-- 1. Policies for `cards`
-- ==========================================

-- Allow anyone (public/anonymous) to view active or sold cards
CREATE POLICY "Allow public read access to cards" 
ON public.cards 
FOR SELECT 
USING (status = 'active' OR status = 'sold');

-- Allow authenticated users (admin) to perform any action on cards
CREATE POLICY "Allow admin all access to cards" 
ON public.cards 
TO authenticated 
USING (true) 
WITH CHECK (true);


-- ==========================================
-- 2. Policies for `categories`
-- ==========================================

-- Allow anyone to view categories
CREATE POLICY "Allow public read access to categories" 
ON public.categories 
FOR SELECT 
USING (true);

-- Allow authenticated users (admin) to perform any action on categories
CREATE POLICY "Allow admin all access to categories" 
ON public.categories 
TO authenticated 
USING (true) 
WITH CHECK (true);


-- ==========================================
-- 3. Policies for `orders`
-- ==========================================

-- Allow authenticated users (admin) to perform any action on orders
CREATE POLICY "Allow admin all access to orders" 
ON public.orders 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Note: Anonymous users do not need read/write access to orders directly 
-- because order creation and retrieval are handled by the backend API 
-- (server.js) using the service role key. This prevents client-side leaks of 
-- sensitive customer details (addresses, emails, phone numbers).


-- ==========================================
-- 4. Policies for `users` (Legacy SQLite table migration)
-- ==========================================

-- Only authenticated users (admin) can view users
CREATE POLICY "Allow admin all access to users" 
ON public.users 
TO authenticated 
USING (true) 
WITH CHECK (true);
