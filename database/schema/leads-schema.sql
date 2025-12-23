-- Leads table for email capture (lead magnet)
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    source TEXT, -- Page where email was captured (e.g., 'assessment-results')
    captured_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Track user engagement
    assessment_completed BOOLEAN DEFAULT FALSE,
    assessment_score INTEGER,
    recommended_track TEXT,
    
    -- Marketing consent
    opted_in BOOLEAN DEFAULT TRUE,
    unsubscribed_at TIMESTAMPTZ
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS leads_email_idx ON public.leads (email);

-- RLS: Allow anonymous inserts (upserts) for lead capture
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow lead capture" ON public.leads
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Allow updates from anon for upsert to work
CREATE POLICY "Allow lead upsert" ON public.leads
    FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

-- Grant permissions
GRANT INSERT, UPDATE ON public.leads TO anon;
