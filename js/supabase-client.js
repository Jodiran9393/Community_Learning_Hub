// Supabase Configuration
// TODO: Replace with your actual Supabase project credentials
// Find these at: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api

const SUPABASE_URL ='https://mwkbezrdprlotddxegqo.supabase.co'; // e.g., 'https://xxxxx.supabase.co'
const SUPABASE_ANON_KEY ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13a2JlenJkcHJsb3RkZHhlZ3FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTY5MzcsImV4cCI6MjA4MDk5MjkzN30.Dxo7rlXSB9zxIwsT-bUcXHSJJXMyJ7wqIPorObfB81o';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Auth state listener
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session);
    updateAuthUI(session);
});

// Update UI based on auth state
function updateAuthUI(session) {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');

    if (session?.user) {
        // User is logged in
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'block';
            document.getElementById('user-display-name').textContent =
                session.user.user_metadata?.display_name || session.user.email;
        }
    } else {
        // User is logged out
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
}

// Sign up
async function signUp(email, password, displayName) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                display_name: displayName
            }
        }
    });

    if (error) {
        console.error('Sign up error:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

// Sign in
async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error('Sign in error:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

// Sign out
async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Sign out error:', error);
    } else {
        window.location.href = '/index.html';
    }
}

// Get current user
async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Check if user is logged in
async function isLoggedIn() {
    const user = await getCurrentUser();
    return !!user;
}

// Export supabase to window for use in other scripts
window.supabase = supabase;
