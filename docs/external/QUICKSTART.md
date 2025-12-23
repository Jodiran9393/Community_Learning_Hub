# Quick Start Guide

Get the Community Learning Hub running in 60 seconds!

## 🚀 Local Development

```bash
# 1. Install dependencies (first time only)
npm install

# 2. Start the development server
npm run dev

# 3. Open your browser to http://localhost:3000
```

That's it! The site is now running locally with hot module reloading.

---

## 🎮 Try These Features

1. **Click any galaxy node** → Opens side panel with topic info
2. **Click "View Resources"** → Navigate to detailed learning page
3. **Click "← Back to Hub"** → Return to galaxy
4. **Drag to rotate** the galaxy view
5. **Scroll to zoom** in/out

---

## 🌐 Deploy to Production

### Vercel (1-Click Deploy)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repo
5. Click "Deploy" → Done! ✨

### Netlify (Drag & Drop)

```bash
# Build the project
npm run build

# Go to https://app.netlify.com/drop
# Drag the 'dist' folder
# Done! ✨
```

For more deployment options, see [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📝 Adding New Topics

1. **Add node to `src/data/knowledge-graph.js`:**
```javascript
{
  id: 'Vue',
  group: 1,  // 1=Web, 2=AI, 3=Design
  val: 20,
  name: 'Vue.js',
  desc: 'Progressive JavaScript framework',
  hasPage: true
}
```

2. **Add link connection:**
```javascript
{ source: 'Vue', target: 'JS' }
```

3. **Create resource page at `src/pages/vue.html`:**
- Copy any existing page as a template
- Update content

4. **Restart dev server** → Your new topic appears!

---

## 🛠 Useful Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
```

---

## 📚 Documentation

- **README.md** - Full project overview
- **DEPLOYMENT.md** - Detailed deployment instructions
- **PROJECT_STATUS.md** - Current status and features

---

## 💡 Tips

- **Dev Server Port:** Default is 3000, change in `vite.config.js`
- **Auto-open Browser:** Configured in vite.config.js
- **Hot Reload:** Changes auto-refresh the browser
- **Build Warnings:** Large bundle size is expected for 3D libraries

---

## 🐛 Troubleshooting

**Port already in use?**
```bash
# Kill the process or change port in vite.config.js
```

**Dependencies issue?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Build fails?**
```bash
npm run build
# Check the error message and fix accordingly
```

---

## 🎉 You're All Set!

The site is running locally. Explore, modify, and deploy when ready!

**Need help?** Check the other documentation files or the project README.
