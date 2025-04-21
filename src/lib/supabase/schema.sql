-- Schema for the Community Learning Hub Supabase database

-- User Profiles Table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  subscription_tier TEXT DEFAULT 'free' NOT NULL CHECK (subscription_tier IN ('free', 'basic', 'premium')),
  post_count INTEGER DEFAULT 0 NOT NULL,
  thread_count INTEGER DEFAULT 0 NOT NULL,
  badges TEXT[] DEFAULT '{}' NOT NULL
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Forum Categories Table
CREATE TABLE forum_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_premium BOOLEAN DEFAULT false NOT NULL
);

-- Enable RLS on forum_categories
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;

-- Forum Threads Table
CREATE TABLE forum_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES forum_categories(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_pinned BOOLEAN DEFAULT false NOT NULL,
  is_locked BOOLEAN DEFAULT false NOT NULL,
  view_count INTEGER DEFAULT 0 NOT NULL
);

-- Enable RLS on forum_threads
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;

-- Forum Posts Table
CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_solution BOOLEAN DEFAULT false NOT NULL
);

-- Enable RLS on forum_posts
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

-- Events Table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  is_online BOOLEAN DEFAULT true NOT NULL,
  meeting_url TEXT,
  is_premium BOOLEAN DEFAULT false NOT NULL,
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0 NOT NULL
);

-- Enable RLS on events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Event Registrations Table
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  status TEXT DEFAULT 'registered' NOT NULL CHECK (status IN ('registered', 'waitlisted', 'cancelled')),
  UNIQUE(event_id, user_id)
);

-- Enable RLS on event_registrations
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Subscription Tiers Table
CREATE TABLE subscription_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  features TEXT[] NOT NULL,
  stripe_price_id TEXT UNIQUE NOT NULL
);

-- Enable RLS on subscription_tiers
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Function to increment user post count
CREATE OR REPLACE FUNCTION increment_user_post_count(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET post_count = post_count + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment user thread count
CREATE OR REPLACE FUNCTION increment_user_thread_count(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET thread_count = thread_count + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment thread count when a new thread is created
CREATE TRIGGER increment_thread_count_trigger
AFTER INSERT ON forum_threads
FOR EACH ROW
EXECUTE FUNCTION increment_user_thread_count(NEW.user_id);

-- Row Level Security Policies

-- User Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Forum Categories Policies
CREATE POLICY "Categories are viewable by everyone" ON forum_categories
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert categories" ON forum_categories
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update categories" ON forum_categories
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete categories" ON forum_categories
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Forum Threads Policies
CREATE POLICY "Threads are viewable by everyone" ON forum_threads
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create threads in non-premium categories" ON forum_threads
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM forum_categories
      WHERE id = forum_threads.category_id AND is_premium = false
    )
  );

CREATE POLICY "Premium users can create threads in premium categories" ON forum_threads
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND (subscription_tier = 'premium' OR subscription_tier = 'basic')
    )
  );

CREATE POLICY "Users can update their own threads" ON forum_threads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own threads" ON forum_threads
  FOR DELETE USING (auth.uid() = user_id);

-- Forum Posts Policies
CREATE POLICY "Posts are viewable by everyone" ON forum_posts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" ON forum_posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own posts" ON forum_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON forum_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Events Policies
CREATE POLICY "Events are viewable by everyone" ON events
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert events" ON events
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update events" ON events
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete events" ON events
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Event Registrations Policies
CREATE POLICY "Registrations are viewable by everyone" ON event_registrations
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can register for non-premium events" ON event_registrations
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM events
      WHERE id = event_registrations.event_id AND is_premium = false
    )
  );

CREATE POLICY "Premium users can register for premium events" ON event_registrations
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND (subscription_tier = 'premium' OR subscription_tier = 'basic')
    )
  );

CREATE POLICY "Users can update their own registrations" ON event_registrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own registrations" ON event_registrations
  FOR DELETE USING (auth.uid() = user_id);

-- Subscription Tiers Policies
CREATE POLICY "Tiers are viewable by everyone" ON subscription_tiers
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert tiers" ON subscription_tiers
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update tiers" ON subscription_tiers
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete tiers" ON subscription_tiers
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Initial Data

-- Insert default subscription tiers
INSERT INTO subscription_tiers (name, description, price, features, stripe_price_id)
VALUES
  ('Free', 'Basic access to the community', 0, ARRAY['Access to public forum categories', 'Read-only access to blog posts', 'Participation in free events'], 'price_free'),
  ('Basic', 'Enhanced community access', 9.99, ARRAY['All Free tier features', 'Access to premium forum categories', 'Participation in premium events', 'Full access to blog content'], 'price_basic'),
  ('Premium', 'Full community access with exclusive benefits', 19.99, ARRAY['All Basic tier features', 'Early access to new content', 'Direct messaging with community experts', 'Exclusive monthly webinars', 'Downloadable resources'], 'price_premium');

-- Insert default forum categories
INSERT INTO forum_categories (name, description, slug, is_premium)
VALUES
  ('General Discussion', 'Introduce yourself and discuss general topics related to AI and machine learning.', 'general-discussion', false),
  ('Project Showcase', 'Share your AI projects and get feedback from the community.', 'project-showcase', false),
  ('Help & Support', 'Ask questions and get help with your AI learning journey.', 'help-support', false),
  ('Resources & Tutorials', 'Share and discover learning resources, tutorials, and articles.', 'resources-tutorials', false),
  ('Advanced Topics', 'Discuss advanced AI concepts and cutting-edge research.', 'advanced-topics', true),
  ('Career Development', 'Get advice on AI careers, job opportunities, and professional growth.', 'career-development', true);
