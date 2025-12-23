/**
 * Topic Page Loader - Loads topic content dynamically from AI Builder JSON
 * Replaces need for 13+ individual hardcoded HTML pages
 */

class TopicPageLoader {
    constructor() {
        this.topic = null;
        this.trackId = null;
        this.userProgress = null;
    }

    /**
     * Initialize page by loading topic from URL or localStorage
     */
    async init() {
        console.log('📚 Initializing dynamic topic page...');

        // Get topic slug from URL
        const params = new URLSearchParams(window.location.search);
        const topicId = params.get('id');
        const topicSlug = params.get('slug');

        if (!topicId && !topicSlug) {
            this.showError('No topic specified. Please return to the homepage.');
            return;
        }

        try {
            // Load track data
            await window.trackLoader.loadAllTracks();

            // Find topic across all tracks
            this.topic = topicId
                ? await window.trackLoader.findTopic(topicId)
                : await this.findTopicBySlug(topicSlug);

            if (!this.topic) {
                this.showError(`Topic "${topicId || topicSlug}" not found.`);
                return;
            }

            this.trackId = this.topic.track_id;

            // Load user progress (if logged in)
            await this.loadUserProgress();

            // Render the page
            this.render();

            // Initialize chat for follow-up questions
            if (window.topicChat) {
                window.topicChat.init(this.topic);
            }

        } catch (error) {
            console.error('Failed to load topic:', error);
            this.showError('Failed to load topic. Please try again.');
        }
    }

    /**
     * Find topic by slug across all tracks
     */
    async findTopicBySlug(slug) {
        const tracks = window.trackLoader.tracks;
        if (!tracks) return null;

        const allTopics = [
            ...tracks.frontend.topics,
            ...tracks.ai.topics,
            ...tracks.data.topics
        ];

        const topic = allTopics.find(t => t.slug === slug);
        if (!topic) return null;

        // Determine which track this topic belongs to
        if (tracks.frontend.topics.includes(topic)) {
            return { ...topic, track_id: tracks.frontend.track_id };
        } else if (tracks.ai.topics.includes(topic)) {
            return { ...topic, track_id: tracks.ai.track_id };
        } else {
            return { ...topic, track_id: tracks.data.track_id };
        }
    }

    /**
     * Load user's progress for this topic
     */
    async loadUserProgress() {
        if (!window.sb) return;

        try {
            const { data: session } = await window.sb.auth.getSession();
            if (!session?.session) return;

            const { data, error } = await window.sb.from('user_progress')
                .select('*')
                .eq('user_id', session.session.user.id)
                .eq('topic_id', this.topic.id)
                .single();

            if (!error && data) {
                this.userProgress = data;
            }
        } catch (error) {
            console.warn('Could not load user progress:', error);
        }
    }

    /**
     * Render the topic page
     */
    render() {
        const main = document.getElementById('topic-content');
        if (!main) return;

        // Set page title
        document.title = `${this.topic.name} - Community Learning Hub`;

        // Get difficulty stars
        const difficultyStars = '⭐'.repeat(this.topic.difficulty_level || 1);
        const isCompleted = this.userProgress?.status === 'completed';

        // Get prerequisite topics
        const prereqs = this.topic.prerequisites || [];

        main.innerHTML = `
            <div class="topic-header">
                <div class="topic-icon" style="background: ${this.topic.color_hex}20; color: ${this.topic.color_hex};">
                    ${this.topic.icon_emoji || '📚'}
                </div>
                <div class="topic-meta">
                    <h1 style="color: ${this.topic.color_hex};">${this.topic.name}</h1>
                    <p class="topic-description">${this.topic.description}</p>
                    <div class="topic-stats">
                        <span class="stat">
                            <span class="stat-icon">📊</span>
                            Difficulty: ${difficultyStars}
                        </span>
                        <span class="stat">
                            <span class="stat-icon">⏱️</span>
                            ${this.topic.estimated_hours || 2} hours
                        </span>
                        ${prereqs.length ? `
                            <span class="stat">
                                <span class="stat-icon">🔗</span>
                                ${prereqs.length} prerequisite${prereqs.length > 1 ? 's' : ''}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>

            ${prereqs.length ? `
                <section class="topic-section prerequisites-section">
                    <h3>📋 Prerequisites</h3>
                    <p>Complete these topics first for the best learning experience:</p>
                    <div class="prereq-list">
                        ${prereqs.map(id => this.renderPrereqCard(id)).join('')}
                    </div>
                </section>
            ` : ''}

            <section class="topic-section">
                <h3>📖 Getting Started</h3>
                <p>
                    ${this.topic.name} is an essential part of your learning journey. 
                    This topic ${this.topic.estimated_hours ? `takes approximately ${this.topic.estimated_hours} hours to complete` : 'covers key concepts'} 
                    and builds on ${prereqs.length ? 'your previous knowledge' : 'foundational concepts'}.
                </p>
            </section>

            <section class="topic-section">
                <h3>🎯 What You'll Learn</h3>
                <ul class="learning-list">
                    <li>Core concepts and fundamentals of ${this.topic.name}</li>
                    <li>Practical applications and real-world examples</li>
                    <li>Best practices and common patterns</li>
                    <li>How to connect this knowledge to related topics</li>
                </ul>
            </section>

            <!-- AI Generated Content Section -->
            <div id="generated-content-container">
                <button id="generate-content-btn" class="generate-content-btn" onclick="window.topicPageLoader.generateContent()">
                    🤖 Generate Detailed Learning Content
                </button>
                <p style="text-align: center; color: #9495b3; margin-bottom: 24px;">
                    Click to generate in-depth explanations, examples, and practice questions using AI
                </p>
            </div>

            <section class="topic-section">
                <h3>🔗 Next Steps</h3>
                <p>After completing this topic, you'll be ready to explore:</p>
                <div class="next-topics" id="next-topics">
                    <!-- Dynamically loaded -->
                    <p class="loading-text">Loading next topics...</p>
                </div>
            </section>


            <div class="completion-section ${isCompleted ? 'completed' : ''}">
                <h3>${isCompleted ? '✅ Completed!' : `Finished learning ${this.topic.name}?`}</h3>
                ${isCompleted ? `
                    <p>You completed this topic on ${new Date(this.userProgress.completed_at).toLocaleDateString()}</p>
                    <button id="mark-incomplete-btn" class="btn-secondary">Mark as Incomplete</button>
                ` : `
                    <button id="mark-complete-btn" class="btn-primary">✅ Mark as Complete</button>
                `}
            </div>
        `;

        // Attach event listeners
        this.attachEventListeners();

        // Load next topics
        this.loadNextTopics();
    }

    /**
     * Render a prerequisite topic card
     */
    renderPrereqCard(topicId) {
        // For now, just show the ID - in full version, we'd look up the topic
        return `
            <a href="/topic.html?id=${topicId}" class="prereq-card">
                <span class="prereq-name">${topicId}</span>
                <span class="prereq-arrow">→</span>
            </a>
        `;
    }

    /**
     * Load topics that come after this one
     */
    async loadNextTopics() {
        const container = document.getElementById('next-topics');
        if (!container) return;

        const track = await window.trackLoader.getTrack(this.trackId);
        if (!track) {
            container.innerHTML = '<p>Could not load next topics.</p>';
            return;
        }

        // Find topics that have this topic as a prerequisite
        const nextTopics = track.topics.filter(t =>
            t.prerequisites?.includes(this.topic.id)
        );

        if (nextTopics.length === 0) {
            container.innerHTML = `
                <p class="no-next">🎉 You've reached a capstone topic! 
                Consider exploring other learning paths.</p>
            `;
            return;
        }

        container.innerHTML = nextTopics.map(topic => `
            <a href="/topic.html?id=${topic.id}" class="next-topic-card">
                <span class="next-topic-icon" style="color: ${topic.color_hex};">
                    ${topic.icon_emoji || '📚'}
                </span>
                <span class="next-topic-name">${topic.name}</span>
                <span class="next-topic-arrow">→</span>
            </a>
        `).join('');
    }

    /**
     * Attach event listeners for buttons
     */
    attachEventListeners() {
        const completeBtn = document.getElementById('mark-complete-btn');
        const incompleteBtn = document.getElementById('mark-incomplete-btn');

        if (completeBtn) {
            completeBtn.addEventListener('click', () => this.markComplete());
        }

        if (incompleteBtn) {
            incompleteBtn.addEventListener('click', () => this.markIncomplete());
        }
    }

    /**
     * Generate AI content for this topic
     * @param {boolean} forceRegenerate - Clear cache and regenerate
     */
    async generateContent(forceRegenerate = false) {
        const container = document.getElementById('generated-content-container');
        const btn = document.getElementById('generate-content-btn');

        if (!container || !window.contentGenerator) {
            console.error('Content generator not available');
            return;
        }

        // Clear cache if force regenerating
        if (forceRegenerate && this.topic) {
            window.contentGenerator.clearContentCache(this.topic.id || this.topic.name);
        }

        // Show loading state
        container.innerHTML = `
            <div class="content-loading">
                <div class="loading-spinner"></div>
                <p>${forceRegenerate ? 'Regenerating' : 'Generating'} learning content...</p>
                <p class="loading-hint">Using AI to create personalized content for ${this.topic.name}</p>
            </div>
        `;

        try {
            // Get the topic_card_template from track data
            const track = await window.trackLoader.getTrack(this.trackId);
            const template = track?.topic_card_template || {};

            // Generate content (will use cache if available)
            const result = await window.contentGenerator.generateTopicContent(this.topic, template, forceRegenerate);

            if (result.success) {
                // Render the generated content
                const html = window.contentGenerator.renderContentHTML(result.content);
                const cacheIndicator = result.fromCache ?
                    `<span class="cache-indicator" title="Loaded from saved cache">💾 Cached</span>` :
                    `<span class="cache-indicator fresh" title="Freshly generated">✨ Fresh</span>`;

                container.innerHTML = `
                    ${html}
                    <div class="content-actions">
                        ${cacheIndicator}
                        <button class="regenerate-btn" onclick="window.topicPageLoader.generateContent(true)">
                            🔄 Regenerate Content
                        </button>
                    </div>
                `;
            } else {
                // Show error
                container.innerHTML = `
                    <div class="content-error">
                        <h3>⚠️ Content Generation Failed</h3>
                        <p>${result.error}</p>
                        <button class="btn-primary" onclick="window.topicPageLoader.generateContent()">
                            🔄 Try Again
                        </button>
                        <p class="error-hint">
                            Make sure your LLM provider is configured. 
                            <br>For Ollama: Run <code>ollama serve</code> locally
                            <br>For OpenAI: Set your API key in browser console: 
                            <code>LLM_CONFIG.setApiKey('openai', 'sk-...')</code>
                        </p>
                    </div>
                `;
            }

        } catch (error) {
            console.error('Content generation error:', error);
            container.innerHTML = `
                <div class="content-error">
                    <h3>⚠️ Error</h3>
                    <p>${error.message}</p>
                    <button class="btn-primary" onclick="window.topicPageLoader.generateContent()">
                        🔄 Try Again
                    </button>
                </div>
            `;
        }
    }


    /**
     * Mark topic as complete
     */
    async markComplete() {
        const btn = document.getElementById('mark-complete-btn');
        if (!btn) return;

        btn.disabled = true;
        btn.textContent = 'Saving...';

        try {
            const { data: session } = await window.sb.auth.getSession();
            if (!session?.session) {
                alert('Please sign in to track your progress.');
                btn.disabled = false;
                btn.textContent = '✅ Mark as Complete';
                return;
            }

            const { error } = await window.sb.from('user_progress').upsert({
                user_id: session.session.user.id,
                topic_id: this.topic.id,
                status: 'completed',
                completed_at: new Date().toISOString()
            });

            if (error) throw error;

            // Refresh the page to show completion state
            window.location.reload();

        } catch (error) {
            console.error('Failed to mark complete:', error);
            alert('Failed to save progress. Please try again.');
            btn.disabled = false;
            btn.textContent = '✅ Mark as Complete';
        }
    }

    /**
     * Mark topic as incomplete
     */
    async markIncomplete() {
        const btn = document.getElementById('mark-incomplete-btn');
        if (!btn) return;

        btn.disabled = true;
        btn.textContent = 'Saving...';

        try {
            const { data: session } = await window.sb.auth.getSession();
            if (!session?.session) return;

            const { error } = await window.sb.from('user_progress')
                .delete()
                .eq('user_id', session.session.user.id)
                .eq('topic_id', this.topic.id);

            if (error) throw error;

            window.location.reload();

        } catch (error) {
            console.error('Failed to mark incomplete:', error);
            btn.disabled = false;
            btn.textContent = 'Mark as Incomplete';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const main = document.getElementById('topic-content');
        if (main) {
            main.innerHTML = `
                <div class="error-container">
                    <h2>❌ Error</h2>
                    <p>${message}</p>
                    <a href="/" class="btn-primary">Return to Homepage</a>
                </div>
            `;
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.topicPageLoader = new TopicPageLoader();
    window.topicPageLoader.init();
});
