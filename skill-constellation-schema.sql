-- Skill Constellation: User Progress Tracking
-- Run this in Supabase SQL Editor after the main schema

-- ============================================
-- 1. USER PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    node_id TEXT NOT NULL, -- 'React', 'Python', 'LLM', etc.
    status TEXT DEFAULT 'in_progress', -- 'not_started', 'in_progress', 'completed'
    completion_date TIMESTAMP WITH TIME ZONE,
    time_spent_minutes INTEGER DEFAULT 0,
    last_visited TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Prevent duplicate entries
    UNIQUE(user_id, node_id)
);

-- ============================================
-- 2. LEARNING STREAKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS learning_streaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE DEFAULT CURRENT_DATE,
    total_nodes_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 3. COMMUNITY STATS (cached for performance)
-- ============================================
CREATE TABLE IF NOT EXISTS node_stats (
    node_id TEXT PRIMARY KEY,
    total_completions INTEGER DEFAULT 0,
    currently_learning INTEGER DEFAULT 0,
    average_time_minutes INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert default stats for all nodes
INSERT INTO node_stats (node_id, total_completions, currently_learning)
VALUES 
    ('CLH', 0, 0),
    ('React', 0, 0),
    ('HTML', 0, 0),
    ('CSS', 0, 0),
    ('JS', 0, 0),
    ('NextJS', 0, 0),
    ('TS', 0, 0),
    ('LLM', 0, 0),
    ('Prompting', 0, 0),
    ('Agents', 0, 0),
    ('Python', 0, 0),
    ('Figma', 0, 0),
    ('UI', 0, 0),
    ('A11y', 0, 0)
ON CONFLICT (node_id) DO NOTHING;

-- ============================================
-- 4. RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_stats ENABLE ROW LEVEL SECURITY;

-- user_progress: Users can read/write their own progress
DROP POLICY IF EXISTS "Users can manage own progress" ON user_progress;
CREATE POLICY "Users can manage own progress" 
    ON user_progress 
    FOR ALL 
    USING (auth.uid() = user_id);

-- learning_streaks: Users can read/write their own streaks
DROP POLICY IF EXISTS "Users can manage own streaks" ON learning_streaks;
CREATE POLICY "Users can manage own streaks" 
    ON learning_streaks 
    FOR ALL 
    USING (auth.uid() = user_id);

-- node_stats: Everyone can read (for community stats)
DROP POLICY IF EXISTS "Anyone can read node stats" ON node_stats;
CREATE POLICY "Anyone can read node stats" 
    ON node_stats 
    FOR SELECT 
    USING (true);

-- ============================================
-- 5. TRIGGER: Initialize streak on first progress
-- ============================================
CREATE OR REPLACE FUNCTION public.initialize_streak()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.learning_streaks (user_id, current_streak, longest_streak)
    VALUES (NEW.user_id, 1, 1)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_first_progress ON user_progress;
CREATE TRIGGER on_first_progress
    AFTER INSERT ON user_progress
    FOR EACH ROW EXECUTE FUNCTION public.initialize_streak();

-- ============================================
-- 6. FUNCTION: Mark node as completed
-- ============================================
CREATE OR REPLACE FUNCTION mark_node_completed(
    p_user_id UUID,
    p_node_id TEXT
)
RETURNS void AS $$
BEGIN
    -- Update or insert progress
    INSERT INTO user_progress (user_id, node_id, status, completion_date)
    VALUES (p_user_id, p_node_id, 'completed', NOW())
    ON CONFLICT (user_id, node_id) 
    DO UPDATE SET 
        status = 'completed',
        completion_date = NOW();
    
    -- Update node stats
    UPDATE node_stats 
    SET 
        total_completions = total_completions + 1,
        updated_at = NOW()
    WHERE node_id = p_node_id;
    
    -- Update user streak
    UPDATE learning_streaks
    SET 
        total_nodes_completed = total_nodes_completed + 1,
        current_streak = CASE 
            WHEN last_activity_date = CURRENT_DATE THEN current_streak
            WHEN last_activity_date = CURRENT_DATE - 1 THEN current_streak + 1
            ELSE 1
        END,
        longest_streak = GREATEST(longest_streak, 
            CASE 
                WHEN last_activity_date = CURRENT_DATE - 1 THEN current_streak + 1
                ELSE current_streak
            END
        ),
        last_activity_date = CURRENT_DATE
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. VERIFICATION QUERIES
-- ============================================
-- Check user progress
-- SELECT * FROM user_progress WHERE user_id = auth.uid();

-- Check your streak
-- SELECT * FROM learning_streaks WHERE user_id = auth.uid();

-- Check community stats
-- SELECT * FROM node_stats ORDER BY total_completions DESC;
