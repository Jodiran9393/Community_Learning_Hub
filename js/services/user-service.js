/**
 * User Service - Handles guest email capture and user identification
 * Integrates with Supabase for persistent storage
 */

class UserService {
    constructor() {
        this.STORAGE_KEY = 'clh_user';
        this.user = null;
        this.init();
    }

    init() {
        // Load user from localStorage
        this.user = this.loadFromStorage();
    }

    // Check if user is a guest (no email provided)
    isGuest() {
        return !this.user?.email;
    }

    // Check if user is fully authenticated (via Supabase auth)
    async isAuthenticated() {
        if (window.isLoggedIn) {
            return await window.isLoggedIn();
        }
        return false;
    }

    // Get current user (guest or authenticated)
    getUser() {
        return this.user;
    }

    // Get user email
    getEmail() {
        return this.user?.email || null;
    }

    // Get user ID (email hash for guests, Supabase ID for authenticated)
    async getUserId() {
        const authUser = await window.getCurrentUser?.();
        if (authUser) {
            return authUser.id;
        }
        if (this.user?.email) {
            // Use email hash for guest users
            return 'guest_' + this.hashEmail(this.user.email);
        }
        return null;
    }

    // Simple email hash for guest identification
    hashEmail(email) {
        let hash = 0;
        for (let i = 0; i < email.length; i++) {
            const char = email.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    // Capture email from guest user
    async captureEmail(email, name = '') {
        if (!this.validateEmail(email)) {
            return { success: false, error: 'Invalid email address' };
        }

        const userData = {
            email: email.toLowerCase().trim(),
            name: name.trim(),
            capturedAt: new Date().toISOString(),
            source: window.location.pathname
        };

        // Save locally
        this.user = userData;
        this.saveToStorage(userData);

        // Save to Supabase
        try {
            await this.saveToSupabase(userData);
        } catch (e) {
            console.warn('Could not save to Supabase (offline mode):', e);
        }

        return { success: true, user: userData };
    }

    // Validate email format
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Save user to localStorage
    saveToStorage(userData) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData));
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }
    }

    // Load user from localStorage
    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    // Save to Supabase leads table
    async saveToSupabase(userData) {
        if (!window.sb) {
            throw new Error('Supabase not initialized');
        }

        const { error } = await window.sb
            .from('leads')
            .upsert({
                email: userData.email,
                name: userData.name,
                source: userData.source,
                captured_at: userData.capturedAt
            }, { onConflict: 'email' });

        if (error) throw error;
    }

    // Clear user data (logout/reset)
    clear() {
        this.user = null;
        localStorage.removeItem(this.STORAGE_KEY);
    }
}

// Create singleton instance
window.userService = new UserService();
