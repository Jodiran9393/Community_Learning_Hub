/**
 * Personalized Dashboard - Shows user's learning path on homepage
 * Displays after assessment completion, shows next topics and progress
 */

class PersonalizedDashboard {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.userPath = null;
        this.userProgress = null;
        this.assessment = null;
    }

    /**
     * Initialize dashboard
     */
    async init() {
        if (!this.container) return;

        // Check if user is logged in
        if (!window.sb) {
            this.showGuestState();
            return;
        }

        try {
            const { data: session } = await window.sb.auth.getSession();
            if (!session?.session) {
                this.showGuestState();
                return;
            }

            // Load user's assessment data
            await this.loadAssessmentData(session.session.user.id);

            if (!this.assessment) {
                this.showNoAssessmentState();
                return;
            }

            // Load user's progress
            await this.loadProgress(session.session.user.id);

            // Render personalized dashboard
            this.render();

        } catch (error) {
            console.error('Dashboard error:', error);
            this.showGuestState();
        }
    }

    /**
     * Load user's assessment data from localStorage or database
     */
    async loadAssessmentData(userId) {
        // First check localStorage (from recent assessment)
        const localResult = localStorage.getItem('clh_assessment_result');
        const selectedTrack = localStorage.getItem('clh_selected_track');
        const selectedOutcome = localStorage.getItem('clh_selected_outcome');

        if (localResult && selectedTrack && selectedOutcome) {
            const placement = JSON.parse(localResult);
            this.assessment = {
                track_id: selectedTrack,
                outcome_chosen: selectedOutcome,
                placement_result: placement
            };
            return;
        }

        // Otherwise try database
        try {
            const { data, error } = await window.sb.from('user_assessments')
                .select('*')
                .eq('user_id', userId)
                .order('completed_at', { ascending: false })
                .limit(1);

            if (!error && data && data.length > 0) {
                this.assessment = data[0];
            }
        } catch (error) {
            console.warn('Could not load assessment from DB:', error);
        }
    }

    /**
     * Load user's topic progress
     */
    async loadProgress(userId) {
        try {
            const { data, error } = await window.sb.from('user_progress')
                .select('*')
                .eq('user_id', userId);

            if (!error) {
                this.userProgress = data || [];
            }
        } catch (error) {
            console.warn('Could not load progress:', error);
            this.userProgress = [];
        }
    }

    /**
     * Render the personalized dashboard
     */
    render() {
        const placement = this.assessment.placement_result || {};
        const path = placement.recommendedPath || [];
        const proficiency = Math.round((placement.overallProficiency || 0) * 100);

        // Calculate progress
        const completedTopics = this.userProgress?.filter(p => p.status === 'completed').map(p => p.topic_id) || [];
        const pathProgress = path.filter(id => completedTopics.includes(id)).length;
        const progressPercent = path.length > 0 ? Math.round((pathProgress / path.length) * 100) : 0;

        // Find next topic to complete
        const nextTopic = path.find(id => !completedTopics.includes(id)) || path[0];

        // Track display name
        const trackNames = {
            'Frontend_Web_Dev': '🌐 Frontend Web Dev',
            'AI_LLMs_Builder_Agents': '🤖 AI & LLMs',
            'Data_Analytics': '📊 Data Analytics'
        };

        this.container.innerHTML = `
            <div class="personalized-dashboard">
                <div class="dashboard-header">
                    <div class="welcome-text">
                        <h2>🎯 Your Learning Journey</h2>
                        <p class="track-badge">${trackNames[this.assessment.track_id] || 'Learning Path'}</p>
                    </div>
                    <div class="progress-ring">
                        <svg viewBox="0 0 100 100">
                            <circle class="progress-bg" cx="50" cy="50" r="45"/>
                            <circle class="progress-fill" cx="50" cy="50" r="45" 
                                    style="stroke-dashoffset: ${283 - (283 * progressPercent / 100)}"/>
                        </svg>
                        <span class="progress-text">${progressPercent}%</span>
                    </div>
                </div>

                <div class="dashboard-stats">
                    <div class="stat-box">
                        <span class="stat-value">${pathProgress}</span>
                        <span class="stat-label">Completed</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-value">${path.length - pathProgress}</span>
                        <span class="stat-label">Remaining</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-value">${proficiency}%</span>
                        <span class="stat-label">Proficiency</span>
                    </div>
                </div>

                ${nextTopic ? `
                    <div class="continue-learning">
                        <h3>Continue Learning</h3>
                        <a href="/topic.html?id=${nextTopic}" class="next-topic-btn">
                            <span class="next-label">Up Next:</span>
                            <span class="next-name">${nextTopic}</span>
                            <span class="next-arrow">→</span>
                        </a>
                    </div>
                ` : `
                    <div class="continue-learning completed">
                        <h3>🎉 Path Complete!</h3>
                        <p>Congratulations! You've completed your learning path.</p>
                        <a href="/topic-explorer.html" class="explore-btn">Explore More Topics →</a>
                    </div>
                `}

                <div class="dashboard-actions">
                    <a href="/topic-explorer.html" class="action-link">Browse All Topics</a>
                    <a href="/onboarding.html" class="action-link">Retake Assessment</a>
                </div>
            </div>
        `;
    }

    /**
     * Show state for guests (not logged in)
     */
    showGuestState() {
        this.container.innerHTML = `
            <div class="personalized-dashboard guest-state">
                <h2>🎯 Start Your Learning Journey</h2>
                <p>Take a quick assessment to get a personalized learning path tailored to your goals.</p>
                <div class="guest-actions">
                    <a href="/onboarding.html" class="cta-primary">Take Assessment</a>
                    <a href="/topic-explorer.html" class="cta-secondary">Browse Topics</a>
                </div>
            </div>
        `;
    }

    /**
     * Show state for logged-in users without assessment
     */
    showNoAssessmentState() {
        this.container.innerHTML = `
            <div class="personalized-dashboard no-assessment">
                <h2>🎯 Personalize Your Learning</h2>
                <p>Complete a quick assessment to get recommendations based on your goals and current skills.</p>
                <div class="assessment-cta">
                    <a href="/onboarding.html" class="cta-primary">Start Assessment</a>
                </div>
                <p class="cta-note">Takes only 5-10 minutes</p>
            </div>
        `;
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('personalized-dashboard')) {
        window.personalizedDashboard = new PersonalizedDashboard('personalized-dashboard');
        window.personalizedDashboard.init();
    }
});
