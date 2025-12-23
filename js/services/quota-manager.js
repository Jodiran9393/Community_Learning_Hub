/**
 * Quota Manager - Tracks and enforces usage limits for AI features
 * Free tier: 5 content generations/week, 10 chat messages/day
 */

class QuotaManager {
    constructor() {
        this.STORAGE_KEY = 'clh_quotas';
        this.LIMITS = {
            content: { limit: 5, resetPeriod: 'weekly' },  // 5 per week
            chat: { limit: 10, resetPeriod: 'daily' }      // 10 per day
        };
        this.quotas = this.loadQuotas();
    }

    // Check if user can perform action
    canUse(feature) {
        // Authenticated users (paid) bypass quotas for now
        // TODO: Check subscription status

        // Guest users (no email) cannot use AI features
        if (window.userService?.isGuest()) {
            return { allowed: false, reason: 'email_required', remaining: 0 };
        }

        this.checkAndResetQuotas();
        const quota = this.quotas[feature];
        const limit = this.LIMITS[feature]?.limit || 0;
        const used = quota?.used || 0;
        const remaining = Math.max(0, limit - used);

        if (remaining <= 0) {
            return {
                allowed: false,
                reason: 'quota_exceeded',
                remaining: 0,
                resetAt: quota?.resetAt
            };
        }

        return { allowed: true, remaining };
    }

    // Increment usage after successful action
    recordUsage(feature) {
        this.checkAndResetQuotas();

        if (!this.quotas[feature]) {
            this.quotas[feature] = { used: 0, resetAt: this.getNextReset(feature) };
        }

        this.quotas[feature].used++;
        this.saveQuotas();

        const limit = this.LIMITS[feature]?.limit || 0;
        return {
            used: this.quotas[feature].used,
            limit: limit,
            remaining: Math.max(0, limit - this.quotas[feature].used)
        };
    }

    // Get current quota status
    getStatus(feature) {
        this.checkAndResetQuotas();
        const quota = this.quotas[feature] || { used: 0 };
        const limit = this.LIMITS[feature]?.limit || 0;

        return {
            used: quota.used,
            limit: limit,
            remaining: Math.max(0, limit - quota.used),
            resetAt: quota.resetAt || this.getNextReset(feature)
        };
    }

    // Check if quotas need to be reset
    checkAndResetQuotas() {
        const now = new Date();
        let changed = false;

        for (const [feature, config] of Object.entries(this.LIMITS)) {
            const quota = this.quotas[feature];
            if (quota && quota.resetAt) {
                const resetTime = new Date(quota.resetAt);
                if (now >= resetTime) {
                    this.quotas[feature] = {
                        used: 0,
                        resetAt: this.getNextReset(feature)
                    };
                    changed = true;
                }
            } else if (!quota) {
                this.quotas[feature] = {
                    used: 0,
                    resetAt: this.getNextReset(feature)
                };
                changed = true;
            }
        }

        if (changed) this.saveQuotas();
    }

    // Calculate next reset time
    getNextReset(feature) {
        const period = this.LIMITS[feature]?.resetPeriod || 'daily';
        const now = new Date();

        if (period === 'weekly') {
            // Reset on Sunday at midnight
            const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
            const nextSunday = new Date(now);
            nextSunday.setDate(now.getDate() + daysUntilSunday);
            nextSunday.setHours(0, 0, 0, 0);
            return nextSunday.toISOString();
        } else {
            // Reset at midnight
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            return tomorrow.toISOString();
        }
    }

    // Format time until reset
    getTimeUntilReset(feature) {
        const status = this.getStatus(feature);
        if (!status.resetAt) return 'soon';

        const now = new Date();
        const reset = new Date(status.resetAt);
        const diff = reset - now;

        if (diff <= 0) return 'now';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours >= 24) {
            const days = Math.floor(hours / 24);
            return `${days} day${days > 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    // Save quotas to localStorage
    saveQuotas() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.quotas));
        } catch (e) {
            console.warn('Could not save quotas:', e);
        }
    }

    // Load quotas from localStorage
    loadQuotas() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    }

    // Clear quotas (for testing/reset)
    clear() {
        this.quotas = {};
        localStorage.removeItem(this.STORAGE_KEY);
    }
}

// Create singleton instance
window.quotaManager = new QuotaManager();
