-- Enable real-time updates for user_progress table
-- Run this in Supabase SQL Editor after running skill-constellation-schema.sql

-- Enable real-time on user_progress table
ALTER PUBLICATION supabase_realtime ADD TABLE user_progress;

-- Verify it's enabled
-- SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
