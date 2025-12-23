-- AI Feedback table for collecting user ratings
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.ai_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- What was rated
    feedback_type TEXT NOT NULL, -- 'content', 'chat'
    topic_id TEXT,
    content_preview TEXT, -- First 200 chars of content
    
    -- The rating
    vote TEXT NOT NULL CHECK (vote IN ('upvote', 'downvote')),
    reason TEXT, -- 'inaccurate', 'too_long', 'unclear', 'off_topic', 'other'
    custom_feedback TEXT, -- User's own words
    
    -- Context
    user_email TEXT, -- From lead capture
    session_id TEXT, -- Browser session
    model_used TEXT, -- e.g., 'gpt-4o-mini', 'claude-3-haiku'
    provider TEXT, -- 'openai', 'anthropic'
    
    -- Analytics
    response_time_ms INTEGER, -- How long generation took
    token_count INTEGER, -- Estimated tokens used
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS ai_feedback_type_idx ON public.ai_feedback (feedback_type);
CREATE INDEX IF NOT EXISTS ai_feedback_vote_idx ON public.ai_feedback (vote);
CREATE INDEX IF NOT EXISTS ai_feedback_topic_idx ON public.ai_feedback (topic_id);
CREATE INDEX IF NOT EXISTS ai_feedback_created_idx ON public.ai_feedback (created_at);

-- RLS: Allow anonymous inserts for feedback collection
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow feedback submission" ON public.ai_feedback
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Allow reading for analytics (authenticated users only)
CREATE POLICY "Allow authenticated read" ON public.ai_feedback
    FOR SELECT
    TO authenticated
    USING (true);

-- Grant permissions
GRANT INSERT ON public.ai_feedback TO anon;
GRANT SELECT ON public.ai_feedback TO authenticated;

-- View for quick analytics
CREATE OR REPLACE VIEW public.feedback_summary AS
SELECT 
    feedback_type,
    topic_id,
    COUNT(*) as total_votes,
    COUNT(*) FILTER (WHERE vote = 'upvote') as upvotes,
    COUNT(*) FILTER (WHERE vote = 'downvote') as downvotes,
    ROUND(
        COUNT(*) FILTER (WHERE vote = 'upvote')::NUMERIC / 
        NULLIF(COUNT(*), 0) * 100, 
        1
    ) as satisfaction_rate,
    DATE_TRUNC('day', created_at) as date
FROM public.ai_feedback
GROUP BY feedback_type, topic_id, DATE_TRUNC('day', created_at)
ORDER BY date DESC;

GRANT SELECT ON public.feedback_summary TO authenticated;
