(() => {
    // Prevent double-init if the script is included twice in the same window
    if (window.__CLH_SB_INIT__) return;
    window.__CLH_SB_INIT__ = true;

    const SUPABASE_URL = 'https://mwkbezrdprlotddxegqo.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13a2JlenJkcHJsb3RkZHhlZ3FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTY5MzcsImV4cCI6MjA4MDk5MjkzN30.Dxo7rlXSB9zxIwsT-bUcXHSJJXMyJ7wqIPorObfB81o';

    if (!window.supabase?.createClient) {
        console.error('Supabase JS not loaded. Make sure the CDN script loads before supabase-client.js');
        return;
    }

    // IMPORTANT: keep window.supabase as the library; store the CLIENT as window.sb
    window.sb = window.sb || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const sb = window.sb;

    function updateAuthUI(session) {
        const authButtons = document.getElementById('auth-buttons');
        const userMenu = document.getElementById('user-menu');
        const nameEl = document.getElementById('user-display-name');

        if (session?.user) {
            if (authButtons) authButtons.style.display = 'none';
            if (userMenu) userMenu.style.display = 'block';
            if (nameEl) nameEl.textContent = session.user.user_metadata?.display_name || session.user.email;
        } else {
            if (authButtons) authButtons.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
        }
    }

    // Expose helpers globally (so auth.html inline script can call them)
    window.signUp = async (email, password, displayName) => {
        const { data, error } = await sb.auth.signUp({
            email,
            password,
            options: { data: { display_name: displayName } }
        });
        if (error) return { success: false, error: error.message };
        return { success: true, data };
    };

    window.signIn = async (email, password) => {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) return { success: false, error: error.message };
        return { success: true, data };
    };

    window.signOut = async () => {
        const { error } = await sb.auth.signOut();
        if (error) console.error('Sign out error:', error);
        else window.location.href = '/index.html';
    };

    window.getCurrentUser = async () => {
        const { data: { user } } = await sb.auth.getUser();
        return user;
    };

    window.isLoggedIn = async () => !!(await window.getCurrentUser());

    // Sync navbar state (only if elements exist on the page)
    sb.auth.getSession().then(({ data }) => updateAuthUI(data.session));
    sb.auth.onAuthStateChange((_event, session) => updateAuthUI(session));
})();
