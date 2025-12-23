# 🚀 Deploy Skill Constellation - Simple Git Method

## Method 1: Git Push (EASIEST)

Since you already have Git set up on your VPS:

```powershell
# 1. Commit all changes
git add .
git commit -m "Add Skill Constellation gamification system with Mark Complete buttons"

# 2. Push to GitHub
git push origin static-poc

# 3. On VPS (SSH in first)
cd /var/www/community-learning-hub
git pull origin static-poc
```

Done! All files are now on your VPS.

---

## Method 2: Manual File List (if Git doesn't work)

If you need to manually upload, here are the critical files:

### NEW Files (must upload):
```
Community Learning Hub Blog Layout/
├── galaxy-live.html          ← Production constellation
├── demo-constellation.html   ← Demo version
├── test-constellation.html   ← Testing interface
├── skill-constellation-schema.sql  ← Database schema

src/
└── js/
    └── mark-complete.js      ← Button logic
```

### UPDATED Files (replace existing):
```
Community Learning Hub Blog Layout/
└── index.html               ← Now embeds galaxy-live.html

src/pages/                   ← ALL 13 updated with buttons:
├── react.html
├── html.html
├── css.html
├── js.html
├── ts.html
├── nextjs.html
├── llm.html
├── prompting.html
├── agents.html
├── python.html
├── figma.html
├── ui.html
└── a11y.html
```

---

## After Deployment

### 1. Run SQL Schema in Supabase

Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

Copy/paste contents of `skill-constellation-schema.sql` and click **Run**

### 2. Test Live Site

1. Visit: `https://your-domain.com/`
2. See the galaxy (all blue if not logged in)
3. Sign in: `https://your-domain.com/auth.html`
4. Visit: `https://your-domain.com/pages/react.html`
5. Scroll down → Click "Mark as Complete"
6. Return to homepage → **React glows GREEN!** 🌟

### 3. Test Controls

Visit: `https://your-domain.com/test-constellation.html`
- Click "Complete All Nodes"
- Watch entire galaxy light up!

---

## Quick Git Commands

```bash
# On VPS terminal
cd /var/www/community-learning-hub

# Check current branch
git branch

# Pull latest changes
git pull origin static-poc

# If merge conflict, force update
git fetch origin
git reset --hard origin/static-poc

# Reload nginx (if needed)
sudo systemctl reload nginx
```

---

## Troubleshooting

**Galaxy not showing?**
- Check: `ls -la galaxy-live.html` (file exists?)
- Check: View source of index.html (iframe points to galaxy-live.html?)

**Buttons not working?**
- Check: Browser console for errors
- Check: `/js/mark-complete.js` exists
- Check: Supabase client loaded (window.supabase defined?)

**Progress not saving?**
- Check: SQL schema ran successfully
- Check: User is logged in
- Check: RLS policies are correct

---

## Files Summary

✅ **13 resource pages** updated with Mark Complete buttons  
✅ **3 galaxy versions** (live, demo, test)  
✅ **1 JS file** for button logic  
✅ **1 SQL file** for database schema  
✅ **Documentation** files for reference

**Ready to go live!** 🎉
