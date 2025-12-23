# 🚀 Deployment Checklist for Pricing Page

## 📋 Pre-Deployment Checklist

### 1. Database Setup in Supabase

- [ ] **Run database-schema.sql** in Supabase SQL Editor
  - Go to https://supabase.com/dashboard/project/mwkbezrdprlotddxegqo/sql
  - Copy entire contents of `database-schema.sql`
  - Click "Run"
  - Verify no errors

- [ ] **Verify Tables Created**
  ```sql
  SELECT * FROM subscription_tiers ORDER BY sort_order;
  SELECT * FROM profiles;
  ```

- [ ] **Check RLS Policies**
  ```sql
  SELECT tablename, policyname, cmd 
  FROM pg_policies 
  WHERE tablename IN ('profiles', 'subscription_tiers');
  ```

- [ ] **Verify Trigger Exists**
  ```sql
  SELECT trigger_name, event_manipulation 
  FROM information_schema.triggers 
  WHERE trigger_name = 'on_auth_user_created';
  ```

### 2. Local Testing

- [ ] Open `test-supabase.html` in browser (via local server)
- [ ] Verify all 4 tests pass:
  - ✓ Client initialization
  - ✓ Subscription tiers query returns 3 tiers
  - ✓ Profile check (after login)
  - ✓ Auth status shows current user

- [ ] Test `pricing.html` locally:
  - Should show 3 pricing cards (Free, Basic, Premium)
  - No console errors
  - Buttons should be enabled/disabled correctly

### 3. File Verification

Ensure these files exist and are up-to-date:
- [ ] `index.html`
- [ ] `pricing.html`
- [ ] `auth.html`
- [ ] `profile.html`
- [ ] `galaxy-v2.html`
- [ ] `js/supabase-client.js` (with window.supabase export)
- [ ] `styles.css`
- [ ] `auth.css`

### 4. Deployment Steps

#### If deploying to VPS:

```bash
# 1. Navigate to deployment directory
cd /var/www/html  # or your web root

# 2. Pull latest changes
git pull origin main

# 3. Check files are present
ls -la

# 4. Verify js/supabase-client.js has correct credentials
cat js/supabase-client.js | grep SUPABASE_URL

# 5. Test in browser
curl http://your-domain.com/pricing.html -I
```

#### If deploying to Netlify/Vercel:

- [ ] Push changes to Git repository
- [ ] Ensure `netlify.toml` or `vercel.json` exists
- [ ] Deploy via dashboard or CLI
- [ ] Test live URL

### 5. Post-Deployment Verification

- [ ] Visit `https://your-domain.com/test-supabase.html`
  - All tests should pass
  
- [ ] Visit `https://your-domain.com/pricing.html`
  - 3 pricing cards visible
  - No 404 errors in console
  - No JavaScript errors
  
- [ ] Test user flow:
  - Sign up new user
  - Check profile created automatically
  - Visit pricing page
  - Verify "Free" tier shows as current plan

### 6. Common Issues & Fixes

#### Issue: 404 on pricing.html
**Fix:** Verify file exists in deployment directory
```bash
ls -la pricing.html
```

#### Issue: "Error loading pricing"
**Causes:**
1. Database tables don't exist → Run `database-schema.sql`
2. RLS policies blocking access → Check policies in SQL editor
3. No data in `subscription_tiers` → Run INSERT statements from schema

#### Issue: Supabase client undefined
**Fix:** Ensure `js/supabase-client.js` loaded before `pricing.html` scripts
```html
<!-- This order matters -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-client.js"></script>
```

#### Issue: Profile not created on signup
**Fix:** Check trigger exists:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

### 7. Monitoring

After deployment, monitor for:
- [ ] JavaScript console errors
- [ ] Network tab 404s or 500s
- [ ] Supabase dashboard auth logs
- [ ] Supabase dashboard logs for query errors

---

## 🔧 Quick Fixes

### Reset Everything (if needed):

```sql
-- Drop tables (WARNING: Deletes all data)
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS subscription_tiers CASCADE;

-- Then re-run database-schema.sql
```

### Test Database Connection:

```javascript
// In browser console on any page
await window.supabase.from('subscription_tiers').select('count');
// Should return: { data: [{count: 3}], error: null }
```

---

## ✅ Success Criteria

Deployment is successful when:
1. ✓ All 3 pricing tiers display
2. ✓ No console errors
3. ✓ Logged-in users see "Current Plan" button
4. ✓ Logged-out users see sign-up buttons
5. ✓ New signups automatically get a profile with 'free' tier
6. ✓ test-supabase.html shows all green checkmarks
