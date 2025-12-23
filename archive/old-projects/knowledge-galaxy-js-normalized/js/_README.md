# js/ folder — normalized set (2025-12-18)

This folder contains canonical “stable iteration” JS files.

## 1) supabase-client.js (required)
- Creates exactly one Supabase client instance at `window.sb`
- Keeps `window.supabase` untouched (library)
- Exposes window.signIn / window.signUp / window.signOut (used by auth.html)

## 2) homepage-content.js
- Loads demo vs auth content safely
- Must never create clients; uses window.sb only

## 3) intelligence-cards.js
- Shows “demo cards” for logged-out users
- Shows basic personalized insights for logged-in users (user_progress summary)

## Critical integration rule
Every page that uses Supabase must load, in order:
1) supabase-js CDN
2) /js/supabase-client.js
3) other feature scripts
