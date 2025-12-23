# Deployment Guide

This guide covers deploying the Community Learning Hub to various platforms.

## Prerequisites

1. Push your code to a Git repository (GitHub, GitLab, Bitbucket)
2. Ensure `package.json` and build files are committed
3. Test the production build locally: `npm run build && npm run preview`

---

## Vercel (Recommended)

Vercel provides the best experience for Vite projects with zero configuration.

### Steps:

1. **Sign up at [vercel.com](https://vercel.com)**

2. **Import Project:**
   - Click "New Project"
   - Import your Git repository
   - Vercel auto-detects Vite configuration

3. **Deploy:**
   - Click "Deploy"
   - Done! Your site is live

### Custom Domain:
- Go to Project Settings → Domains
- Add your custom domain
- Follow DNS configuration instructions

### Environment Variables:
- Project Settings → Environment Variables
- Add any API keys or secrets

---

## Netlify

Netlify is another excellent option with similar ease of use.

### Steps:

1. **Sign up at [netlify.com](https://netlify.com)**

2. **Import Project:**
   - "Add new site" → "Import an existing project"
   - Connect your Git repository

3. **Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - (Already configured in `netlify.toml`)

4. **Deploy:**
   - Click "Deploy site"
   - Your site is live!

### Features:
- Automatic HTTPS
- Global CDN
- Form handling
- Serverless functions support

---

## GitHub Pages

Free hosting directly from your GitHub repository.

### Steps:

1. **Install gh-pages:**
```bash
npm install --save-dev gh-pages
```

2. **Add to package.json scripts:**
```json
"deploy": "npm run build && gh-pages -d dist"
```

3. **Deploy:**
```bash
npm run deploy
```

4. **Enable GitHub Pages:**
   - Repository Settings → Pages
   - Source: gh-pages branch
   - Save

Your site will be at: `https://<username>.github.io/<repo-name>/`

**Note:** Update `vite.config.js` base path:
```javascript
export default defineConfig({
  base: '/<repo-name>/',
  // ... rest of config
})
```

---

## CloudFlare Pages

Fast global CDN with generous free tier.

### Steps:

1. **Sign up at [pages.cloudflare.com](https://pages.cloudflare.com)**

2. **Connect Repository:**
   - "Create a project"
   - Connect your Git account
   - Select repository

3. **Build Configuration:**
   - Framework preset: Vite
   - Build command: `npm run build`
   - Build output: `dist`

4. **Deploy:**
   - Click "Save and Deploy"

---

## Self-Hosting

Host on your own server (VPS, shared hosting, etc.)

### Steps:

1. **Build the project:**
```bash
npm run build
```

2. **Upload dist/ folder:**
   - Use FTP, SFTP, or rsync
   - Upload contents of `dist/` to your web root

3. **Configure web server:**

**Nginx:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/clh/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Apache (.htaccess):**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## Docker Deployment

For containerized deployment.

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t clh .
docker run -p 80:80 clh
```

---

## Performance Tips

After deployment, optimize performance:

1. **Enable Compression:**
   - Gzip/Brotli on your hosting platform
   - Most platforms enable this by default

2. **Add Cache Headers:**
   - Configure long cache times for static assets
   - Already configured in `netlify.toml` and `vercel.json`

3. **Use CDN:**
   - Most platforms provide CDN automatically
   - Consider Cloudflare if self-hosting

4. **Monitor Performance:**
   - Use Lighthouse in Chrome DevTools
   - Check Core Web Vitals

---

## Continuous Deployment

All recommended platforms support automatic deployments:

- **Push to main/master branch** → Automatic deployment
- **Pull Request** → Preview deployment
- **Rollback** → One-click via platform dashboard

---

## Troubleshooting

### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Routes Not Working
- Ensure proper redirects/rewrites are configured
- Check `netlify.toml` or `vercel.json`

### Assets Not Loading
- Verify base path in `vite.config.js`
- Check asset paths are relative

### Performance Issues
- Run `npm run build` to minify and optimize
- Use Lighthouse to identify bottlenecks

---

## Need Help?

- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)

Happy Deploying! 🚀
