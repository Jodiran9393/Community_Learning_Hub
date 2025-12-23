/**
 * Quota Status Indicator - Shows users their remaining AI usage
 * Displays limits, usage, and reset times to encourage wise usage
 */

class QuotaStatusIndicator {
    constructor() {
        this.containerId = 'quota-status-container';
        this.addStyles();
    }

    /**
     * Render the quota status indicator
     * Call this after page load to inject the indicator
     */
    render(targetSelector = '#generated-content-container') {
        const target = document.querySelector(targetSelector);
        if (!target) return;

        // Check if already rendered
        if (document.getElementById(this.containerId)) return;

        // Get quota statuses
        const contentStatus = window.quotaManager?.getStatus('content') || { used: 0, limit: 5, remaining: 5 };
        const chatStatus = window.quotaManager?.getStatus('chat') || { used: 0, limit: 10, remaining: 10 };
        const email = window.userService?.getEmail();
        const isGuest = window.userService?.isGuest();

        // Calculate percentages
        const contentPercent = ((contentStatus.limit - contentStatus.remaining) / contentStatus.limit) * 100;
        const chatPercent = ((chatStatus.limit - chatStatus.remaining) / chatStatus.limit) * 100;

        // Time until reset
        const contentReset = window.quotaManager?.getTimeUntilReset('content') || 'Sunday';
        const chatReset = window.quotaManager?.getTimeUntilReset('chat') || 'midnight';

        // Build HTML
        const indicator = document.createElement('div');
        indicator.id = this.containerId;
        indicator.className = 'quota-status-indicator';

        if (isGuest) {
            // Guest user - show email capture prompt
            indicator.innerHTML = `
                <div class="quota-card quota-guest">
                    <div class="quota-header">
                        <span class="quota-icon">🔒</span>
                        <span class="quota-title">Unlock AI Features</span>
                    </div>
                    <p class="quota-desc">Enter your email to access AI-generated content and chat assistance.</p>
                    <div class="quota-benefits">
                        <div class="benefit">✨ ${contentStatus.limit} content generations/week</div>
                        <div class="benefit">💬 ${chatStatus.limit} chat messages/day</div>
                    </div>
                </div>
            `;
        } else {
            // Free user - show quota status
            indicator.innerHTML = `
                <div class="quota-card">
                    <div class="quota-header">
                        <span class="quota-icon">⚡</span>
                        <span class="quota-title">Your AI Credits</span>
                        <span class="quota-email">${email}</span>
                    </div>
                    
                    <div class="quota-meters">
                        <div class="quota-meter">
                            <div class="meter-label">
                                <span>📝 Content Generation</span>
                                <span class="meter-count">${contentStatus.remaining}/${contentStatus.limit}</span>
                            </div>
                            <div class="meter-bar">
                                <div class="meter-fill ${contentPercent > 80 ? 'low' : ''}" 
                                     style="width: ${100 - contentPercent}%"></div>
                            </div>
                            <div class="meter-reset">Resets in ${contentReset}</div>
                        </div>
                        
                        <div class="quota-meter">
                            <div class="meter-label">
                                <span>💬 Chat Messages</span>
                                <span class="meter-count">${chatStatus.remaining}/${chatStatus.limit}</span>
                            </div>
                            <div class="meter-bar">
                                <div class="meter-fill ${chatPercent > 80 ? 'low' : ''}" 
                                     style="width: ${100 - chatPercent}%"></div>
                            </div>
                            <div class="meter-reset">Resets in ${chatReset}</div>
                        </div>
                    </div>
                    
                    ${contentStatus.remaining === 0 || chatStatus.remaining === 0 ? `
                        <div class="quota-upgrade">
                            <span>Need more? </span>
                            <a href="/pricing.html">Upgrade to Pro →</a>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        // Insert before the target
        target.parentNode.insertBefore(indicator, target);
    }

    /**
     * Update the quota display (call after using a feature)
     */
    update() {
        const existing = document.getElementById(this.containerId);
        if (existing) {
            existing.remove();
        }
        this.render();
    }

    /**
     * Show a toast notification when quota is used
     */
    showUsageToast(feature, remaining) {
        const toast = document.createElement('div');
        toast.className = 'quota-toast';

        if (remaining <= 2) {
            toast.classList.add('warning');
            toast.innerHTML = `⚠️ Only ${remaining} ${feature} ${remaining === 1 ? 'credit' : 'credits'} remaining!`;
        } else {
            toast.innerHTML = `✓ ${remaining} ${feature} credits remaining`;
        }

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('visible'), 10);

        // Remove after 3s
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    addStyles() {
        if (document.getElementById('quota-indicator-styles')) return;

        const style = document.createElement('style');
        style.id = 'quota-indicator-styles';
        style.textContent = `
            .quota-status-indicator {
                margin-bottom: 20px;
            }

            .quota-card {
                background: linear-gradient(135deg, rgba(76, 139, 245, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                padding: 20px;
            }

            .quota-card.quota-guest {
                background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%);
                border-color: rgba(251, 191, 36, 0.3);
            }

            .quota-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 16px;
            }

            .quota-icon {
                font-size: 20px;
            }

            .quota-title {
                font-weight: 600;
                color: white;
                font-size: 16px;
            }

            .quota-email {
                margin-left: auto;
                font-size: 12px;
                color: #7a7b9a;
                background: rgba(255, 255, 255, 0.1);
                padding: 4px 10px;
                border-radius: 12px;
            }

            .quota-desc {
                color: #b8b9d6;
                font-size: 14px;
                margin: 0 0 16px 0;
            }

            .quota-benefits {
                display: flex;
                gap: 16px;
                flex-wrap: wrap;
            }

            .quota-benefits .benefit {
                color: #4ade80;
                font-size: 14px;
            }

            .quota-meters {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
            }

            .quota-meter {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .meter-label {
                display: flex;
                justify-content: space-between;
                font-size: 13px;
                color: #d4d5e9;
            }

            .meter-count {
                font-weight: 600;
                color: white;
            }

            .meter-bar {
                height: 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                overflow: hidden;
            }

            .meter-fill {
                height: 100%;
                background: linear-gradient(90deg, #4c8bf5, #8b5cf6);
                border-radius: 4px;
                transition: width 0.3s ease;
            }

            .meter-fill.low {
                background: linear-gradient(90deg, #f59e0b, #f87171);
            }

            .meter-reset {
                font-size: 11px;
                color: #7a7b9a;
            }

            .quota-upgrade {
                margin-top: 16px;
                padding-top: 16px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                text-align: center;
                font-size: 13px;
                color: #7a7b9a;
            }

            .quota-upgrade a {
                color: #4c8bf5;
                text-decoration: none;
                font-weight: 500;
            }

            .quota-upgrade a:hover {
                text-decoration: underline;
            }

            /* Toast notification */
            .quota-toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 12px 20px;
                background: rgba(30, 31, 51, 0.95);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                color: white;
                font-size: 14px;
                z-index: 10000;
                transform: translateY(100px);
                opacity: 0;
                transition: all 0.3s ease;
            }

            .quota-toast.visible {
                transform: translateY(0);
                opacity: 1;
            }

            .quota-toast.warning {
                border-color: rgba(251, 191, 36, 0.5);
                background: rgba(251, 191, 36, 0.1);
            }

            @media (max-width: 480px) {
                .quota-header {
                    flex-wrap: wrap;
                }

                .quota-email {
                    margin-left: 0;
                    margin-top: 8px;
                    width: 100%;
                    text-align: center;
                }

                .quota-benefits {
                    flex-direction: column;
                    gap: 8px;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Create singleton instance
window.quotaStatusIndicator = new QuotaStatusIndicator();
