/**
 * Email Capture Modal - Reusable component for lead capture
 * Call: emailCaptureModal.show() to display
 */

class EmailCaptureModal {
    constructor() {
        this.modal = null;
        this.resolvePromise = null;
        this.rejectPromise = null;
    }

    // Show modal and return promise that resolves with captured email
    show(options = {}) {
        const {
            title = "🎯 See Your Personalized Results",
            subtitle = "Enter your email to unlock your AI readiness score and personalized learning path.",
            buttonText = "Show My Results →",
            source = window.location.pathname
        } = options;

        return new Promise((resolve, reject) => {
            this.resolvePromise = resolve;
            this.rejectPromise = reject;
            this.createModal(title, subtitle, buttonText, source);
        });
    }

    createModal(title, subtitle, buttonText, source) {
        // Remove existing modal if any
        this.hide();

        // Create modal HTML
        const modal = document.createElement('div');
        modal.id = 'email-capture-modal';
        modal.innerHTML = `
            <div class="ecm-backdrop"></div>
            <div class="ecm-container">
                <div class="ecm-content">
                    <h2 class="ecm-title">${title}</h2>
                    <p class="ecm-subtitle">${subtitle}</p>
                    
                    <form class="ecm-form" onsubmit="emailCaptureModal.submit(event)">
                        <div class="ecm-form-group">
                            <input type="text" id="ecm-name" placeholder="Your name (optional)" autocomplete="name">
                        </div>
                        <div class="ecm-form-group">
                            <input type="email" id="ecm-email" placeholder="Your email address" required autocomplete="email">
                        </div>
                        <button type="submit" class="ecm-submit-btn">
                            <span class="ecm-btn-text">${buttonText}</span>
                            <span class="ecm-btn-loading" style="display:none;">Verifying...</span>
                        </button>
                        <p class="ecm-privacy">🔒 We respect your privacy. No spam, unsubscribe anytime.</p>
                    </form>
                    
                    <div class="ecm-error" id="ecm-error" style="display:none;"></div>
                </div>
            </div>
        `;

        // Add styles
        this.addStyles();

        // Append to body
        document.body.appendChild(modal);
        this.modal = modal;
        this.source = source;

        // Focus email input
        setTimeout(() => {
            document.getElementById('ecm-email')?.focus();
        }, 100);

        // Close on backdrop click
        modal.querySelector('.ecm-backdrop').addEventListener('click', () => {
            this.cancel();
        });

        // Close on escape
        document.addEventListener('keydown', this.handleEscape);
    }

    handleEscape = (e) => {
        if (e.key === 'Escape') {
            this.cancel();
        }
    }

    async submit(event) {
        event.preventDefault();

        const email = document.getElementById('ecm-email').value.trim();
        const name = document.getElementById('ecm-name').value.trim();
        const submitBtn = document.querySelector('.ecm-submit-btn');
        const btnText = submitBtn.querySelector('.ecm-btn-text');
        const btnLoading = submitBtn.querySelector('.ecm-btn-loading');
        const errorEl = document.getElementById('ecm-error');

        // Show loading state
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        submitBtn.disabled = true;
        errorEl.style.display = 'none';

        try {
            // Capture email
            const result = await window.userService.captureEmail(email, name);

            if (result.success) {
                this.hide();
                this.resolvePromise?.({ email, name });
            } else {
                throw new Error(result.error || 'Invalid email');
            }
        } catch (error) {
            errorEl.textContent = '❌ ' + error.message;
            errorEl.style.display = 'block';

            // Reset button
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
        }
    }

    cancel() {
        this.hide();
        this.rejectPromise?.('cancelled');
    }

    hide() {
        document.removeEventListener('keydown', this.handleEscape);
        const modal = document.getElementById('email-capture-modal');
        if (modal) {
            modal.remove();
        }
        this.modal = null;
    }

    addStyles() {
        if (document.getElementById('ecm-styles')) return;

        const style = document.createElement('style');
        style.id = 'ecm-styles';
        style.textContent = `
            #email-capture-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .ecm-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(4px);
            }

            .ecm-container {
                position: relative;
                width: 90%;
                max-width: 440px;
                animation: ecm-slide-up 0.3s ease;
            }

            @keyframes ecm-slide-up {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .ecm-content {
                background: linear-gradient(135deg, rgba(76, 139, 245, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 20px;
                padding: 40px 32px;
                text-align: center;
                backdrop-filter: blur(20px);
            }

            .ecm-title {
                font-size: 24px;
                font-weight: 700;
                margin: 0 0 12px 0;
                color: white;
            }

            .ecm-subtitle {
                font-size: 15px;
                color: #b8b9d6;
                margin: 0 0 28px 0;
                line-height: 1.5;
            }

            .ecm-form-group {
                margin-bottom: 14px;
            }

            .ecm-form-group input {
                width: 100%;
                padding: 14px 18px;
                font-size: 16px;
                border: 2px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                background: rgba(255, 255, 255, 0.05);
                color: white;
                outline: none;
                transition: all 0.2s;
                box-sizing: border-box;
            }

            .ecm-form-group input:focus {
                border-color: #4c8bf5;
                background: rgba(76, 139, 245, 0.1);
            }

            .ecm-form-group input::placeholder {
                color: #8888aa;
            }

            .ecm-submit-btn {
                width: 100%;
                padding: 16px 24px;
                font-size: 17px;
                font-weight: 600;
                border: none;
                border-radius: 12px;
                background: linear-gradient(90deg, #4c8bf5, #8b5cf6);
                color: white;
                cursor: pointer;
                transition: all 0.2s;
                margin-top: 8px;
            }

            .ecm-submit-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(76, 139, 245, 0.4);
            }

            .ecm-submit-btn:disabled {
                opacity: 0.7;
                cursor: not-allowed;
            }

            .ecm-privacy {
                font-size: 12px;
                color: #7a7b9a;
                margin: 18px 0 0 0;
            }

            .ecm-error {
                margin-top: 16px;
                padding: 12px;
                background: rgba(255, 100, 100, 0.1);
                border: 1px solid rgba(255, 100, 100, 0.3);
                border-radius: 8px;
                color: #ff8888;
                font-size: 14px;
            }
        `;
        document.head.appendChild(style);
    }
}

// Create singleton instance
window.emailCaptureModal = new EmailCaptureModal();
