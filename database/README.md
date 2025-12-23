# Database Organization

This directory contains all SQL schema, seed data, and configuration for the Community Learning Hub.

## Structure

### schema/
Core database table definitions and structure:
- `database-schema.sql` - Main database tables (user_progress, learning_streaks, node_stats)
- `learning-intelligence-schema.sql` - Intelligence platform tables (sessions, pathways, insights)
- `skill-constellation-schema.sql` - Skill constellation feature tables
- `topic-management-schema.sql` - Topic and relationship management tables

### seeds/
Sample and bulk insert data:
- `add-topics-guide.sql` - Bulk topic insertion (86+ topics ready to use)

### config/
Database configuration and setup:
- `enable-realtime.sql` - Supabase real-time subscriptions setup

## Deployment Order

When setting up a new database, run files in this order:

1. **Schema** (create tables):
   ```sql
   -- Run in Supabase SQL Editor
   database/schema/database-schema.sql
   database/schema/topic-management-schema.sql  
   database/schema/learning-intelligence-schema.sql
   database/schema/skill-constellation-schema.sql
   ```

2. **Seeds** (populate data):
   ```sql
   database/seeds/add-topics-guide.sql
   ```

3. **Config** (enable features):
   ```sql
   database/config/enable-realtime.sql
   ```

## Tables Overview

**Core Progress Tracking**:
- `user_progress` - Topic completion status per user
- `learning_streaks` - Daily learning streaks
- `node_stats` - Community statistics per topic

**Topics & Content**:
- `learning_topics` - All learning topics (scalable, database-driven)
- `topic_relationships` - Prerequisites and related topics
- `topic_categories` - Topic organization

**Learning Intelligence**:
- `learning_sessions` - Session behavior tracking
- `learning_pathways` - Auto-detected topic sequences
- `difficulty_ratings` - User feedback and ratings
- `learning_insights` - Aggregated community intelligence
- `user_learning_profiles` - Individual "Learning DNA"
- `recommended_next` - AI-powered recommendations

## Notes

- All tables use Row Level Security (RLS)
- Users can only access their own progress data
- Community insights are anonymized
- Supabase anon key is safe to expose (RLS enforced)
