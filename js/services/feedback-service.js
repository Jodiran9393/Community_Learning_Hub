/**
 * Feedback Service - Comprehensive AI feedback collection
 * Syncs to Supabase and provides downvote reason modal
 */

class FeedbackService {
    constructor() {
        this.sessionId = this.getOrCreateSessionId();
        this.pendingFeedback = [];
        this.init();
    }

    init() {
        // Try to sync any pending feedback on load
        this.syncPendingFeedback();
    }

    getOrCreateSessionId() {
        let sessionId = sessionStorage.getItem('clh_session_id');
        if (!sessionId) {
            sessionId = 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('clh_session_id', sessionId);
        }
        return sessionId;
    }

    /**
     * Submit feedback - main entry point
     */
    async submitFeedback(data) {
        const feedback = {
            feedback_type: data.type,
            topic_id: data.topicId || null,
            content_preview: data.contentPreview?.substring(0, 200) || null,
            vote: data.vote,
            reason: data.reason || null,
            custom_feedback: data.customFeedback || null,
            user_email: window.userService?.getEmail() || null,
            session_id: this.sessionId,
            model_used: data.model || null,
            provider: data.provider || null,
            response_time_ms: data.responseTime || null,
            created_at: new Date().toISOString()
        };

        // Store locally immediately
        this.storeLocally(feedback);

        // Try to sync to Supabase
        const synced = await this.syncToSupabase(feedback);

        if (!synced) {
            // Add to pending queue for later sync
            this.addToPending(feedback);
        }

        console.log('📊 Feedback submitted:', feedback.vote, synced ? '(synced)' : '(pending)');
        return { success: true, synced };
    }

    /**
     * Store feedback locally
     */
    storeLocally(feedback) {
        try {
            const key = 'clh_ai_feedback';
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            existing.push(feedback);
            // Keep last 100 entries
            localStorage.setItem(key, JSON.stringify(existing.slice(-100)));
        } catch (e) {
            console.warn('Could not store feedback locally:', e);
        }
    }

    /**
     * Sync to Supabase
     */
    async syncToSupabase(feedback) {
        if (!window.sb) return false;

        try {
            const { error } = await window.sb
                .from('ai_feedback')
                .insert(feedback);

            if (error) throw error;
            return true;
        } catch (e) {
            console.warn('Could not sync to Supabase:', e);
            return false;
        }
    }

    /**
     * Add to pending queue
     */
    addToPending(feedback) {
        try {
            const key = 'clh_pending_feedback';
            const pending = JSON.parse(localStorage.getItem(key) || '[]');
            pending.push(feedback);
            localStorage.setItem(key, JSON.stringify(pending));
        } catch (e) {
            console.warn('Could not add to pending:', e);
        }
    }

    /**
     * Sync pending feedback
     */
    async syncPendingFeedback() {
        if (!window.sb) return;

        try {
            const key = 'clh_pending_feedback';
            const pending = JSON.parse(localStorage.getItem(key) || '[]');

            if (pending.length === 0) return;

            const { error } = await window.sb
                .from('ai_feedback')
                .insert(pending);

            if (!error) {
                // Clear pending queue
                localStorage.removeItem(key);
                console.log(`📊 Synced ${pending.length} pending feedback items`);
            }
        } catch (e) {
            console.warn('Could not sync pending feedback:', e);
        }
    }

    /**
     * Show downvote reason modal
     * Returns promise that resolves with { reason, customFeedback } or rejects if cancelled
     */
    showDownvoteModal(options = {}) {
        return new Promise((resolve, reject) => {
            const modalId = 'downvote-reason-modal';

            // Remove existing modal
            document.getElementById(modalId)?.remove();

            const modal = document.createElement('div');
            modal.id = modalId;
            modal.innerHTML = `
                <div class="drm-backdrop"></div>
                <div class="drm-container">
                    <div class="drm-content">
                        <h3 class="drm-title">😕 What went wrong?</h3>
                        <p class="drm-subtitle">Help us improve by telling us what was wrong with this response.</p>
                        
                        <div class="drm-reasons">
                            <label class="drm-reason">
                                <input type="radio" name="reason" value="inaccurate">
                                <span class="drm-reason-text">❌ Inaccurate or wrong</span>
                            </label>
                            <label class="drm-reason">
                                <input type="radio" name="reason" value="unclear">
                                <span class="drm-reason-text">😵 Confusing or unclear</span>
                            </label>
                            <label class="drm-reason">
                                <input type="radio" name="reason" value="too_long">
                                <span class="drm-reason-text">📏 Too long or verbose</span>
                            </label>
                            <label class="drm-reason">
                                <input type="radio" name="reason" value="too_short">
                                <span class="drm-reason-text">📝 Too short or incomplete</span>
                            </label>
                            <label class="drm-reason">
                                <input type="radio" name="reason" value="off_topic">
                                <span class="drm-reason-text">🎯 Off-topic or irrelevant</span>
                            </label>
                            <label class="drm-reason">
                                <input type="radio" name="reason" value="other">
                                <span class="drm-reason-text">💬 Other</span>
                            </label>
                        </div>
                        
                        <div class="drm-custom-wrapper" style="display: none;">
                            <textarea id="drm-custom" placeholder="Tell us more..." rows="3"></textarea>
                        </div>
                        
                        <div class="drm-actions">
                            <button class="drm-btn drm-skip">Skip</button>
                            <button class="drm-btn drm-submit" disabled>Submit Feedback</button>
                        </div>
                        
                        ${options.showRegenerate ? `
                            <div class="drm-regenerate">
                                <button class="drm-regenerate-btn">🔄 Try regenerating instead</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;

            // Add styles
            this.addModalStyles();

            document.body.appendChild(modal);

            // Event handlers
            const reasons = modal.querySelectorAll('input[name="reason"]');
            const submitBtn = modal.querySelector('.drm-submit');
            const skipBtn = modal.querySelector('.drm-skip');
            const customWrapper = modal.querySelector('.drm-custom-wrapper');
            const customInput = modal.querySelector('#drm-custom');
            const regenerateBtn = modal.querySelector('.drm-regenerate-btn');

            reasons.forEach(radio => {
                radio.addEventListener('change', () => {
                    submitBtn.disabled = false;
                    customWrapper.style.display = radio.value === 'other' ? 'block' : 'none';
                });
            });

            submitBtn.addEventListener('click', () => {
                const selectedReason = modal.querySelector('input[name="reason"]:checked')?.value;
                const customFeedback = customInput?.value || null;
                modal.remove();
                resolve({ reason: selectedReason, customFeedback });
            });

            skipBtn.addEventListener('click', () => {
                modal.remove();
                resolve({ reason: null, customFeedback: null });
            });

            modal.querySelector('.drm-backdrop').addEventListener('click', () => {
                modal.remove();
                reject('cancelled');
            });

            if (regenerateBtn) {
                regenerateBtn.addEventListener('click', () => {
                    modal.remove();
                    reject('regenerate');
                });
            }
        });
    }

    addModalStyles() {
        if (document.getElementById('drm-styles')) return;

        const style = document.createElement('style');
        style.id = 'drm-styles';
        style.textContent = `
            #downvote-reason-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .drm-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(4px);
            }

            .drm-container {
                position: relative;
                width: 90%;
                max-width: 420px;
                animation: drm-slide 0.3s ease;
            }

            @keyframes drm-slide {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .drm-content {
                background: linear-gradient(135deg, rgba(248, 113, 113, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 20px;
                padding: 28px;
                backdrop-filter: blur(20px);
            }

            .drm-title {
                font-size: 20px;
                font-weight: 600;
                margin: 0 0 8px 0;
                color: white;
            }

            .drm-subtitle {
                font-size: 14px;
                color: #9495b3;
                margin: 0 0 20px 0;
            }

            .drm-reasons {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 16px;
            }

            .drm-reason {
                display: flex;
                align-items: center;
                padding: 12px 14px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .drm-reason:hover {
                background: rgba(255, 255, 255, 0.08);
                border-color: rgba(255, 255, 255, 0.2);
            }

            .drm-reason input {
                margin-right: 12px;
                accent-color: #4c8bf5;
            }

            .drm-reason-text {
                color: #d4d5e9;
                font-size: 14px;
            }

            .drm-custom-wrapper {
                margin-bottom: 16px;
            }

            .drm-custom-wrapper textarea {
                width: 100%;
                padding: 12px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                color: white;
                font-size: 14px;
                resize: none;
                box-sizing: border-box;
            }

            .drm-custom-wrapper textarea:focus {
                outline: none;
                border-color: #4c8bf5;
            }

            .drm-actions {
                display: flex;
                gap: 12px;
            }

            .drm-btn {
                flex: 1;
                padding: 12px 20px;
                border-radius: 10px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }

            .drm-skip {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #b8b9d6;
            }

            .drm-skip:hover {
                background: rgba(255, 255, 255, 0.15);
            }

            .drm-submit {
                background: linear-gradient(90deg, #4c8bf5, #8b5cf6);
                border: none;
                color: white;
            }

            .drm-submit:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .drm-submit:not(:disabled):hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 15px rgba(76, 139, 245, 0.4);
            }

            .drm-regenerate {
                margin-top: 16px;
                text-align: center;
            }

            .drm-regenerate-btn {
                background: none;
                border: none;
                color: #4c8bf5;
                font-size: 14px;
                cursor: pointer;
                padding: 8px;
            }

            .drm-regenerate-btn:hover {
                text-decoration: underline;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Get local feedback stats
     */
    getLocalStats() {
        try {
            const feedback = JSON.parse(localStorage.getItem('clh_ai_feedback') || '[]');
            const total = feedback.length;
            const upvotes = feedback.filter(f => f.vote === 'upvote').length;
            const downvotes = feedback.filter(f => f.vote === 'downvote').length;

            return {
                total,
                upvotes,
                downvotes,
                satisfactionRate: total > 0 ? Math.round((upvotes / total) * 100) : null
            };
        } catch (e) {
            return { total: 0, upvotes: 0, downvotes: 0, satisfactionRate: null };
        }
    }
}

// Create singleton instance
window.feedbackService = new FeedbackService();
