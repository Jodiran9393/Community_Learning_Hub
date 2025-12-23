-- Community Learning Hub Database Schema
-- Run these commands in Supabase SQL Editor

-- ============================================
-- 1. SUBSCRIPTION TIERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_tiers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- 'free', 'basic', 'premium'
    display_name TEXT NOT NULL, -- 'Free', 'Basic', 'Premium'
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    features JSONB DEFAULT '[]'::jsonb,
    stripe_price_id TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 2. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    display_name TEXT,
    subscription_tier TEXT DEFAULT 'free',
    subscription_status TEXT DEFAULT 'active',
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 3. TRIGGER: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, subscription_tier)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
        'free'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" 
    ON profiles FOR SELECT 
    USING (auth.uid() = id);

-- Profiles: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Subscription Tiers: Everyone can read active tiers
DROP POLICY IF EXISTS "Anyone can read active subscription tiers" ON subscription_tiers;
CREATE POLICY "Anyone can read active subscription tiers" 
    ON subscription_tiers FOR SELECT 
    USING (is_active = true);

-- ============================================
-- 5. INSERT DEFAULT SUBSCRIPTION TIERS
-- ============================================
INSERT INTO subscription_tiers (name, display_name, description, price, features, sort_order, is_active)
VALUES 
    (
        'free',
        'Free',
        'Perfect for getting started',
        0.00,
        '["Access to basic courses", "Community forum access", "Monthly newsletter", "Limited resource downloads"]'::jsonb,
        1,
        true
    ),
    (
        'basic',
        'Basic',
        'For serious learners',
        9.99,
        '["Everything in Free", "Unlimited course access", "Priority community support", "Downloadable resources", "Certificate of completion", "Ad-free experience"]'::jsonb,
        2,
        true
    ),
    (
        'premium',
        'Premium',
        'For professionals and teams',
        29.99,
        '["Everything in Basic", "1-on-1 mentorship sessions", "Exclusive workshops", "Early access to new content", "Custom learning paths", "Team collaboration tools", "API access"]'::jsonb,
        3,
        true
    )
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    features = EXCLUDED.features,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active;

-- ============================================
-- 6. VERIFICATION QUERIES
-- ============================================
-- Run these to verify everything is working:

-- Check subscription tiers
SELECT * FROM subscription_tiers ORDER BY sort_order;

-- Check profiles (after creating a user)
SELECT * FROM profiles;

-- Check RLS policies
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE tablename IN ('profiles', 'subscription_tiers');
