-- ============================================
-- MULTI-TRACK ASSESSMENT SYSTEM
-- Minimal schema - JSON is source of truth
-- ============================================

-- 1. USER ASSESSMENTS - Track onboarding results
CREATE TABLE IF NOT EXISTS user_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    track_id TEXT NOT NULL, -- 'Frontend_Web_Dev', 'AI_LLMs_Builder_Agents', 'Data_Analytics'
    outcome_chosen TEXT NOT NULL, -- e.g., 'responsive_websites', 'build_tool_agent'
    responses JSONB NOT NULL, -- All assessment data: {confidence: {...}, quiz: {...}}
    placement_result JSONB, -- Calculated path: {startTopic, recommendedPath, gaps}
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, track_id) -- One assessment per track per user
);

CREATE INDEX idx_assessments_user ON user_assessments(user_id);
CREATE INDEX idx_assessments_track ON user_assessments(track_id);

-- 2. EXTEND user_learning_profiles - Add track selection
ALTER TABLE user_learning_profiles ADD COLUMN IF NOT EXISTS 
    primary_track TEXT; -- User's main focus track

ALTER TABLE user_learning_profiles ADD COLUMN IF NOT EXISTS 
    chosen_outcome TEXT; -- Current outcome they're working toward

ALTER TABLE user_learning_profiles ADD COLUMN IF NOT EXISTS 
    assessment_completed_at TIMESTAMP WITH TIME ZONE; -- When they completed onboarding

ALTER TABLE user_learning_profiles ADD COLUMN IF NOT EXISTS 
    secondary_tracks TEXT[]; -- Other tracks they're exploring

-- 3. RLS POLICIES
ALTER TABLE user_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assessments"
    ON user_assessments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessments"
    ON user_assessments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessments"
    ON user_assessments FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- NOTES
-- ============================================
-- Topic content, prerequisites, quizzes stay in JSON
-- Database only stores user-specific data + metadata
-- This keeps the database lean and curriculum flexible
