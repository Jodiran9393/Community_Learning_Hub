// js/supabase-client.js
// Canonical Supabase client initialization for the whole site.
//
// RULES:
// - window.supabase  => Supabase CDN library (do not overwrite)
// - window.sb        => Supabase client instance (create once, reuse everywhere)
// - All other scripts must use window.sb (or const sb = window.sb)
//
// IMPORTANT:
// - The anon key is expected to be public in browser apps.
// - NEVER put the service-role key in frontend code.

(() => {
  // Prevent double-execution if this script is accidentally loaded twice.
  if (window.__CLH_SB_INIT__) return;
  window.__CLH_SB_INIT__ = true;

  // ✅ Replace with your project values (or inject via window.__CLH_CONFIG__ from HTML).
  const SUPABASE_URL =
    (window.__CLH_CONFIG__ && window.__CLH_CONFIG__.SUPABASE_URL) ||
    "https://YOUR_PROJECT.supabase.co";

  const SUPABASE_ANON_KEY =
    (window.__CLH_CONFIG__ && window.__CLH_CONFIG__.SUPABASE_ANON_KEY) ||
    "YOUR_SUPABASE_ANON_KEY";

  // Supabase CDN library must be loaded first:
  // <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error(
      "[CLH] Supabase library not found. Load supabase-js CDN before /js/supabase-client.js"
    );
    return;
  }

  // Create/reuse client instance
  window.sb =
    window.sb ||
    window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

  const sb = window.sb;

  // ---------- UI helpers ----------
  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? "";
  }

  function show(el, display) {
    if (!el) return;
    el.style.display = display;
  }

  function updateAuthUI(session) {
    const authButtons = document.getElementById("auth-buttons");
    const userMenu = document.getElementById("user-menu");

    if (session?.user) {
      show(authButtons, "none");
      show(userMenu, "flex");

      const name =
        session.user.user_metadata?.display_name ||
        session.user.email ||
        "Account";
      setText("user-display-name", name);
    } else {
      show(authButtons, "flex");
      show(userMenu, "none");
      setText("user-display-name", "");
    }
  }

  // Expose for pages that call it explicitly (optional)
  window.updateAuthUI = updateAuthUI;

  // ---------- Auth functions (used by auth.html) ----------
  window.signUp = async function signUp(email, password, displayName) {
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (error) {
      console.error("[CLH] Sign up error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  };

  window.signIn = async function signIn(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("[CLH] Sign in error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  };

  window.signOut = async function signOut() {
    const { error } = await sb.auth.signOut();
    if (error) {
      console.error("[CLH] Sign out error:", error);
      return;
    }
    window.location.href = "/index.html";
  };

  window.getCurrentUser = async function getCurrentUser() {
    const { data } = await sb.auth.getUser();
    return data?.user ?? null;
  };

  window.isLoggedIn = async function isLoggedIn() {
    const user = await window.getCurrentUser();
    return !!user;
  };

  // ---------- Keep navbar state in sync ----------
  sb.auth.getSession().then(({ data }) => updateAuthUI(data.session));
  sb.auth.onAuthStateChange((_event, session) => updateAuthUI(session));
})();
