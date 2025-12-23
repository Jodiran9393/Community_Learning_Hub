# Community Learning Hub

An AI-powered Learning Intelligence Platform with an interactive 3D Knowledge Galaxy visualization.

## 🚀 Quick Start

**Local Development**:
```bash
python -m http.server 8000
# Open http://localhost:8000
```

**Production**: Static files can be deployed to any web server (Vercel, Netlify, VPS, etc.)

## 🌟 Features

- **3D Knowledge Galaxy** - Interactive visualization of learning topics
- **Progress Tracking** - Track completion status with real-time updates  
- **Learning Intelligence** - Session tracking, pathway detection, smart recommendations
- **Demo Mode** - Public preview with safe demo data for logged-out users
- **Auth Integration** - Supabase authentication with OAuth support

## 📁 Project Structure

```
/
├── index.html              # Main landing page
├── galaxy-dynamic.html     # Production galaxy (iframe)
├── galaxy-dq.html          # Data quality debug tool (dev only)
├── auth.html, profile.html, pricing.html
│
├── js/                     # JavaScript modules
│   ├── supabase-client.js  # Single source of truth for Supabase client
│   ├── homepage-content.js # Dynamic homepage cards
│   ├── intelligence-cards.js # Learning intelligence UI
│   ├── learning-tracker.js # Session & behavior tracking
│   └── mark-complete.js    # Progress updates
│
├── pages/                  # Resource pages (13 topics)
│   └── *.html              # React, HTML, CSS, JS, Python, AI, Design, etc.
│
├── database/               # SQL schema & seeds
│   ├── schema/             # Table definitions
│   ├── seeds/              # Sample data
│   └── config/             # Database configuration
│
├── docs/                   # Documentation
│   ├── architecture/       # System design
│   ├── deployment/         # Deploy guides
│   ├── features/           # Feature docs
│   └── archive/            # Old/verbose docs
│
└── archive/                # Archived code
    ├── galaxy-variants/    # Old galaxy implementations
    └── chatgpt-iterations/ # DQ system development history
```

## 🔧 Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **3D Visualization**: Three.js, 3d-force-graph
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Deployment**: Static hosting (Vercel recommended)

## 📚 Documentation

- **Architecture**: See [docs/architecture/](file:///c:/dev/CLH/Community%20Learning%20Hub%20Blog%20Layout/docs/architecture/)
- **Deployment**: See [docs/deployment/DEPLOYMENT_CHECKLIST.md](file:///c:/dev/CLH/Community%20Learning%20Hub%20Blog%20Layout/docs/deployment/DEPLOYMENT_CHECKLIST.md)
- **Features**: See [docs/features/](file:///c:/dev/CLH/Community%20Learning%20Hub%20Blog%20Layout/docs/features/)
- **Database**: See [database/README.md](file:///c:/dev/CLH/Community%20Learning%20Hub%20Blog%20Layout/database/README.md)

## 🎯 Key Concepts

### Supabase Architecture
- `window.supabase` = CDN library (never overwrite)
- `window.sb` = single client instance
- Only `js/supabase-client.js` creates the client
- All other scripts use `window.sb`

### Demo vs Auth Mode
- **Logged out**: Uses demo tables (safe, read-only)
- **Logged in**: Uses production tables + user progress
- Automatic table switching based on auth state

### Galaxy Files
- **Production**: `galaxy-dynamic.html` (public-facing)
- **Dev Tool**: `galaxy-dq.html` (data quality debugging, internal only)

## 🔒 Security

- Row Level Security (RLS) enforced on all Supabase tables
- postMessage uses `window.location.origin` (not `'*'`)
- No service role keys in client code
- Supabase anon key is safe to expose (RLS protects data)

## 🚀 Development Workflow

1. **Add new topic**: Insert into `learning_topics` table (no code deploy needed)
2. **Update pages**: Add cache busting `?v=2` to force reload
3. **Test locally**: `python -m http.server 8000`
4. **Deploy**: Push to Git → auto-deploy (if configured)

## 📊 Learning Intelligence

The platform captures:
- Session duration and interactions
- Learning pathways (topic sequences)  
- Difficulty ratings and feedback
- User learning profiles ("Learning DNA")
- AI-powered topic recommendations

All data powers personalized learning experiences and community insights.

## 🤝 Contributing

This is a private project. For team members:
1. Follow the established Supabase architecture
2. Add cache busting when modifying JS files
3. Test in both demo and auth modes
4. Update relevant documentation

## 📝 License

Private project - All rights reserved

---

**Version**: 3.0 (Dynamic Galaxy + Learning Intelligence)  
**Last Updated**: 2025-12-18  
**Status**: Production Ready
