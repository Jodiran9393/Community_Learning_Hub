# Knowledge Galaxy — Repo-wide Grep Checklist (Codebase Organization Pass)
_Date: 2025-12-17_

This checklist is designed to help you quickly audit and normalize the codebase after the “Security + Architecture Stabilization” iteration.

Goal: **no regressions** back into:
- duplicate Supabase initialization
- confusing `window.supabase` (library) vs `window.sb` (client)
- logged-out users querying non-demo tables
- unsafe `postMessage('*')` usage

---

## 0) Safety first (do this before grepping)
- Make a commit (or create a branch) before changes:
  - `git checkout -b chore/galaxy-architecture-normalize`
  - `git commit -am "checkpoint before supabase + demo/auth cleanup"`

---

## 1) Supabase: library vs client (the canonical rule)

### ✅ Expected
- **Supabase CDN** provides: `window.supabase` (library)
- Your app creates/uses: `window.sb` (client instance)
- All code queries via: `window.sb.from(...)` and `window.sb.auth...`

### 🚫 Never
- `window.supabase = ...` (overwrites the library)
- `const supabase = window.supabase.createClient(...)` in multiple files
- `window.supabase.from(...)` (library does not have `.from()`)

---

## 2) Grep targets (search → fix)

> Tip: run these from repo root. Use Ripgrep (`rg`) if available.

### A) Wrong client usage
**Search**
- `window.supabase.from(`
- `window.supabase.auth`
- `supabase.from(`
- `supabase.auth`

**Fix**
- Replace with `window.sb.from(` / `window.sb.auth`
- Or, if you use a local alias: `const sb = window.sb;` then use `sb.from(...)` and `sb.auth...`

**Why**
- `window.supabase` is the library object; the client is `window.sb`.

---

### B) Duplicate Supabase initialization + global collisions
**Search**
- `const supabase =`
- `let supabase =`
- `var supabase =`
- `createClient(`
- `window.supabase =`

**Fix**
- There should be **exactly one** file responsible for client creation: `js/supabase-client.js`
- Replace duplicates with:
  - `const sb = window.sb;`
- Delete any `window.supabase = ...` assignment.

**Guard check**
- In `js/supabase-client.js`, ensure a double-init guard exists (idempotent):
  - `if (window.__CLH_SB_INIT__) return; window.__CLH_SB_INIT__ = true;`

---

### C) Script-order problems (static site reality)
**Search**
- `@supabase/supabase-js`
- `supabase-client.js`

**Fix**
On every page that uses Supabase, load scripts in this order:
1) Supabase CDN
2) `/js/supabase-client.js`
3) feature scripts

**Common failure symptom**
- `signIn is not defined`
- `window.sb is undefined`
- `createClient is not a function`

---

### D) Demo/auth table switching (public preview mode)
**Search**
- `'learning_topics'`
- `'topic_relationships'`
- `'user_progress'`
- `'demo_learning_topics'`
- `'demo_topic_relationships'`

**Fix**
In `galaxy-dynamic.html` (or wherever the galaxy loads data), ensure:
- Topics query uses `TOPICS_TABLE` (demo when logged out; real when logged in)
- Relationships query uses `RELS_TABLE` (**do not hardcode** `'topic_relationships'`)

**Required pattern**
```js
const TOPICS_TABLE = isAuthed ? 'learning_topics' : 'demo_learning_topics';
const RELS_TABLE   = isAuthed ? 'topic_relationships' : 'demo_topic_relationships';

const { data: topics } = await sb.from(TOPICS_TABLE).select('*');
const { data: rels }   = await sb.from(RELS_TABLE).select('from_topic,to_topic');
```

**Note**
- It’s OK that logged-out users can’t read `user_progress` at all; the UI should show the sign-in prompt instead.

---

### E) Unsafe iframe messaging
**Search**
- `postMessage(`
- `'*'` (especially as the `targetOrigin` argument)
- `addEventListener('message'`

**Fix**
1) Parent -> iframe:
   - `postMessage(..., window.location.origin)`
2) Iframe receiver:
   - Reject messages not from same origin:
     - `if (event.origin !== window.location.origin) return;`

**Why**
- Prevents hostile pages from spoofing auth/progress messages into your iframe.

---

### F) Navigation logic for demo UUID nodes (optional but recommended)
**Search**
- `node.id.toLowerCase()`
- `'/pages/'`

**Fix idea**
If demo topic IDs are UUID-like, avoid navigating to `/pages/<uuid>.html`.
Instead:
- navigate only if a short `slug` exists
- else open your info panel and show “Demo node” / “Sign in to continue”

---

### G) Any mention of service role keys (critical)
**Search**
- `service_role`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_KEY` (non-anon)
- `Authorization: Bearer` (in client code)

**Fix**
- Service role keys must **never** ship to the browser.
- If you find any, remove immediately and rotate keys.

---

## 3) SQL / Supabase verification (fast)
After code changes, verify the intended access model:

### Logged out (anon)
- Galaxy loads using demo tables only.
- Any attempt to query user tables returns 403 (expected).

### Logged in (authenticated)
- Galaxy loads real published tables.
- Progress reads/writes only for the current user.

---

## 4) Smoke test checklist (must pass before “done”)
1) Incognito → `/index.html` (logged out)
   - demo galaxy renders
   - no console red errors
2) Incognito → `/auth.html`
   - Sign In works
   - returns to site correctly
3) After login → `/index.html`
   - galaxy switches to AUTH mode
   - progress HUD updates
4) Hard refresh on `/index.html`
   - still works (no desync)
5) Open `galaxy-dynamic.html` directly
   - still works (standalone + iframe)

---

## 5) Optional: security headers on Vercel (next hardening step)
Once you are stable and don’t mind testing CSP adjustments, add a `vercel.json` with baseline headers.

**Warning:** strict CSP can break your CDN scripts if you don’t include all sources.

Minimal safe starter (no CSP yet):
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

---

## 6) “One-command” grep bundle (copy/paste)
```bash
rg "window\.supabase\.|\bsupabase\.|createClient\(|postMessage\(|addEventListener\('message'|demo_learning_topics|demo_topic_relationships|topic_relationships'|learning_topics'"
```

---

If you want, I can convert this into a **repo task list** (“fix in file X at lines Y”) once you paste (or upload) your current `js/` folder files.
