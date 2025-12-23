-- ============================================
-- LEARNING INTELLIGENCE PLATFORM - Database Schema
-- Tracks HOW users learn, not just WHAT they learn
-- ============================================

-- 1. LEARNING SESSIONS - Track time and engagement
CREATE TABLE IF NOT EXISTS learning_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    page_views INTEGER DEFAULT 1,
    interactions INTEGER DEFAULT 0, -- clicks, scrolls, etc.
    completed_in_session BOOLEAN DEFAULT FALSE,
    device_type TEXT, -- 'mobile', 'tablet', 'desktop'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX idx_sessions_user ON learning_sessions(user_id);
CREATE INDEX idx_sessions_node ON learning_sessions(node_id);
CREATE INDEX idx_sessions_date ON learning_sessions(session_start);

-- 2. LEARNING PATHWAYS - Track topic sequences
CREATE TABLE IF NOT EXISTS learning_pathways (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    from_topic TEXT NOT NULL,
    to_topic TEXT NOT NULL,
    sequence_number INTEGER, -- 1st, 2nd, 3rd topic in their journey
    days_between DECIMAL(10,2),
    completed_both BOOLEAN DEFAULT FALSE,
    pathway_success BOOLEAN, -- Did this sequence lead to completion?
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, from_topic, to_topic)
);

CREATE INDEX idx_pathways_user ON learning_pathways(user_id);
CREATE INDEX idx_pathways_topics ON learning_pathways(from_topic, to_topic);

-- 3. DIFFICULTY RATINGS - User feedback on topic difficulty
CREATE TABLE IF NOT EXISTS difficulty_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL,
    difficulty_score INTEGER CHECK (difficulty_score BETWEEN 1 AND 5),
    time_to_complete_hours DECIMAL(10,2),
    would_recommend BOOLEAN,
    helpful_resources TEXT[], -- Array of resource URLs they found helpful
    struggles TEXT, -- What was hard?
    tips TEXT, -- What helped them succeed?
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, node_id)
);

CREATE INDEX idx_difficulty_node ON difficulty_ratings(node_id);

-- 4. LEARNING INSIGHTS - Aggregated community intelligence
CREATE TABLE IF NOT EXISTS learning_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insight_type TEXT NOT NULL, -- 'optimal_path', 'prerequisite', 'difficulty', 'recommendation'
    topic_a TEXT NOT NULL,
    topic_b TEXT, -- For pathways
    insight_data JSONB, -- Flexible data storage
    confidence_score DECIMAL(5,2), -- 0-100, how reliable is this insight?
    sample_size INTEGER, -- How many users contributed to this insight?
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(insight_type, topic_a, topic_b)
);

CREATE INDEX idx_insights_type ON learning_insights(insight_type);
CREATE INDEX idx_insights_topic ON learning_insights(topic_a);

-- 5. USER LEARNING PROFILES - Meta-learning analytics
CREATE TABLE IF NOT EXISTS user_learning_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    learning_style TEXT, -- 'visual', 'hands-on', 'theoretical', 'social'
    avg_session_duration INTEGER, -- Average minutes per session
    preferred_time_of_day TEXT, -- 'morning', 'afternoon', 'evening', 'night'
    completion_rate DECIMAL(5,2), -- Percentage of started topics completed
    learning_velocity TEXT, -- 'slow', 'normal', 'fast'
    strength_areas TEXT[], -- Topics they excel at
    struggle_areas TEXT[], -- Topics they find hard
    total_learning_time_hours DECIMAL(10,2),
    longest_streak_days INTEGER,
    profile_data JSONB, -- Additional flexible data
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. RECOMMENDED_NEXT - AI-powered suggestions
CREATE TABLE IF NOT EXISTS recommended_next (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recommended_topic TEXT NOT NULL,
    reason TEXT, -- Why this recommendation?
    confidence_score DECIMAL(5,2), -- 0-100
    based_on_users INTEGER, -- How many similar learners?
    estimated_time_hours DECIMAL(5,2),
    priority INTEGER, -- 1=highest
    shown_to_user BOOLEAN DEFAULT FALSE,
    user_accepted BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recommendations_user ON recommended_next(user_id);
CREATE INDEX idx_recommendations_priority ON recommended_next(priority);

-- ============================================
-- RLS POLICIES - Security
-- ============================================

-- Learning Sessions
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
    ON learning_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
    ON learning_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
    ON learning_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- Learning Pathways
ALTER TABLE learning_pathways ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pathways"
    ON learning_pathways FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pathways"
    ON learning_pathways FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Difficulty Ratings
ALTER TABLE difficulty_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all ratings"
    ON difficulty_ratings FOR SELECT
    USING (true); -- Public to show community insights

CREATE POLICY "Users can insert own ratings"
    ON difficulty_ratings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
    ON difficulty_ratings FOR UPDATE
    USING (auth.uid() = user_id);

-- Learning Insights (Public read, admin write)
ALTER TABLE learning_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view insights"
    ON learning_insights FOR SELECT
    USING (true);

-- User Learning Profiles
ALTER TABLE user_learning_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON user_learning_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON user_learning_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON user_learning_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Recommended Next
ALTER TABLE recommended_next ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations"
    ON recommended_next FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS - Auto-calculate insights
-- ============================================

-- Function: Update user learning profile after each session
CREATE OR REPLACE FUNCTION update_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate and update user learning profile
    INSERT INTO user_learning_profiles (user_id, last_updated)
    VALUES (NEW.user_id, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        avg_session_duration = (
            SELECT AVG(duration_seconds / 60)
            FROM learning_sessions
            WHERE user_id = NEW.user_id AND duration_seconds IS NOT NULL
        ),
        total_learning_time_hours = (
            SELECT COALESCE(SUM(duration_seconds), 0) / 3600.0
            FROM learning_sessions
            WHERE user_id = NEW.user_id
        ),
        completion_rate = (
            SELECT (COUNT(CASE WHEN status = 'completed' THEN 1 END)::DECIMAL / 
                   NULLIF(COUNT(*), 0) * 100)
            FROM user_progress
            WHERE user_id = NEW.user_id
        ),
        last_updated = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update profile after session ends
CREATE TRIGGER trigger_update_profile
    AFTER INSERT OR UPDATE ON learning_sessions
    FOR EACH ROW
    WHEN (NEW.session_end IS NOT NULL)
    EXECUTE FUNCTION update_user_profile();

-- Function: Detect learning pathways
CREATE OR REPLACE FUNCTION detect_pathway()
RETURNS TRIGGER AS $$
DECLARE
    prev_completion RECORD;
BEGIN
    -- When a topic is completed, check what was completed before it
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Find the most recent previous completion
        SELECT node_id, completion_date INTO prev_completion
        FROM user_progress
        WHERE user_id = NEW.user_id 
          AND status = 'completed'
          AND node_id != NEW.node_id
        ORDER BY completion_date DESC
        LIMIT 1;
        
        IF FOUND THEN
            -- Record the pathway
            INSERT INTO learning_pathways (
                user_id, 
                from_topic, 
                to_topic, 
                days_between,
                completed_both,
                pathway_success
            )
            VALUES (
                NEW.user_id,
                prev_completion.node_id,
                NEW.node_id,
                EXTRACT(EPOCH FROM (NEW.completion_date - prev_completion.completion_date)) / 86400,
                true,
                true
            )
            ON CONFLICT (user_id, from_topic, to_topic) DO UPDATE SET
                days_between = EXCLUDED.days_between,
                completed_both = true,
                pathway_success = true;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Detect pathways when topics are completed
CREATE TRIGGER trigger_detect_pathway
    AFTER INSERT OR UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION detect_pathway();

-- ============================================
-- INITIAL INSIGHTS - Seed some data
-- ============================================

-- These will be updated by real data over time
INSERT INTO learning_insights (insight_type, topic_a, topic_b, insight_data, confidence_score, sample_size) VALUES
('optimal_path', 'HTML', 'CSS', '{"avg_days": 7, "success_rate": 0.92}', 92.0, 100),
('optimal_path', 'CSS', 'JavaScript', '{"avg_days": 14, "success_rate": 0.85}', 85.0, 100),
('optimal_path', 'JavaScript', 'React', '{"avg_days": 21, "success_rate": 0.88}', 88.0, 100),
('optimal_path', 'React', 'NextJS', '{"avg_days": 14, "success_rate": 0.91}', 91.0, 100),
('prerequisite', 'JavaScript', 'React', '{"strength": 95, "required": true}', 95.0, 200),
('prerequisite', 'React', 'NextJS', '{"strength": 90, "required": true}', 90.0, 150),
('difficulty', 'HTML', NULL, '{"avg_rating": 2.1, "completion_time_hours": 8}', 85.0, 120),
('difficulty', 'CSS', NULL, '{"avg_rating": 2.8, "completion_time_hours": 12}', 87.0, 115),
('difficulty', 'JavaScript', NULL, '{"avg_rating": 3.5, "completion_time_hours": 40}', 90.0, 200),
('difficulty', 'React', NULL, '{"avg_rating": 3.8, "completion_time_hours": 35}', 92.0, 180),
('difficulty', 'TypeScript', NULL, '{"avg_rating": 3.2, "completion_time_hours": 25}', 88.0, 95)
ON CONFLICT DO NOTHING;

-- ============================================
-- VIEWS - Easy data access
-- ============================================

-- View: Community learning stats
CREATE OR REPLACE VIEW community_stats AS
SELECT 
    node_id,
    COUNT(DISTINCT user_id) as total_learners,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completions,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
    AVG(CASE 
        WHEN status = 'completed' 
        THEN EXTRACT(EPOCH FROM (completion_date - created_at)) / 3600
    END) as avg_completion_time_hours
FROM user_progress
GROUP BY node_id;

-- View: Popular pathways
CREATE OR REPLACE VIEW popular_pathways AS
SELECT 
    from_topic,
    to_topic,
    COUNT(*) as times_taken,
    AVG(days_between) as avg_days,
    (COUNT(CASE WHEN completed_both THEN 1 END)::DECIMAL / COUNT(*)) * 100 as success_rate
FROM learning_pathways
GROUP BY from_topic, to_topic
HAVING COUNT(*) >= 3
ORDER BY times_taken DESC;
