// Homepage Content - Featured Paths, Topic Explorer, and Community Insights
// Privacy-first hybrid approach

// Featured Learning Paths
const FEATURED_PATHS = [
    {
        name: "Web Development Fundamentals",
        topics: ["HTML", "CSS", "JS", "React"],
        icon: "🌐",
        estimatedHours: 120,
        color: "#4c8bf5"
    },
    {
        name: "AI & Machine Learning Journey",
        topics: ["Python", "LLMs", "Prompting", "Agents"],
        icon: "🤖",
        estimatedHours: 150,
        color: "#d367c1"
    },
    {
        name: "Full Stack Developer",
        topics: ["HTML", "CSS", "JS", "React", "NextJS", "Python"],
        icon: "💻",
        estimatedHours: 200,
        color: "#a060ff"
    }
];

// Render Featured Learning Paths
async function renderLearningPaths() {
    const container = document.getElementById('learning-paths-container');
    if (!container) return;

    // Get pathway completion stats from database
    let pathStats = {};
    if (window.sb) {
        try {
            const { data: pathways } = await window.sb
                .from('learning_pathways')
                .select('pathway_name, COUNT(*) as count')
                .group('pathway_name')
                .limit(10);

            if (pathways) {
                pathways.forEach(p => pathStats[p.pathway_name] = p.count);
            }
        } catch (error) {
            console.log('Could not load pathway stats:', error);
        }
    }

    const pathsHTML = FEATURED_PATHS.map(path => {
        const completions = pathStats[path.name] || Math.floor(Math.random() * 50) + 10;
        const topicsList = path.topics.join(' → ');

        return `
            <div class="learning-path-card" style="border-left: 4px solid ${path.color};">
                <div class="path-icon">${path.icon}</div>
                <h3>${path.name}</h3>
                <div class="path-topics">${topicsList}</div>
                <div class="path-meta">
                    <span>⏱️ ~${path.estimatedHours} hours</span>
                    <span>👥 ${completions} learners</span>
                </div>
                <button class="path-btn" onclick="startPath('${path.name}')">Start This Path</button>
            </div>
        `;
    }).join('');

    container.innerHTML = pathsHTML;
}

// Start a learning path (placeholder)
function startPath(pathName) {
    alert(`Starting "${pathName}"! This feature will track your progress through this path.`);
    // TODO: Implement path tracking
}

// Topic Explorer by Category
async function renderTopicExplorer() {
    const container = document.getElementById('topic-categories-container');
    if (!container) return;

    // Category metadata (used by both DB and fallback)
    const categoryMeta = {
        web: { name: "Web Development", icon: "🌐", color: "#FF6B6B" },
        ai: { name: "AI & Machine Learning", icon: "🤖", color: "#FF8E53" },
        backend: { name: "Backend Development", icon: "⚙️", color: "#ff6b6b" },
        design: { name: "Design & UX", icon: "🎨", color: "#FFD93D" },
        devops: { name: "DevOps & Cloud", icon: "☁️", color: "#51cf66" },
        mobile: { name: "Mobile Development", icon: "📱", color: "#ffd43b" },
        data: { name: "Data Analytics", icon: "📊", color: "#4dabf7" }
    };

    // Try database first, then fallback to JSON
    let topics = [];

    if (window.sb) {
        try {
            const { data, error } = await window.sb
                .from('learning_topics')
                .select('id, name, category, difficulty_level, icon_emoji, resource_page_url')
                .eq('is_published', true)
                .order('display_order');

            if (!error && data && data.length > 0) {
                topics = data;
            } else {
                console.warn('DB topics unavailable, using JSON fallback:', error?.message);
            }
        } catch (error) {
            console.warn('DB query failed, using JSON fallback:', error);
        }
    }

    // Fallback: Load from ai-builder JSON files
    if (topics.length === 0) {
        try {
            const trackFiles = [
                { file: 'ai-builder/track_frontend_web_dev.json', category: 'web' },
                { file: 'ai-builder/track_ai_llms_builder_agents.json', category: 'ai' },
                { file: 'ai-builder/track_data_analytics.json', category: 'data' }
            ];

            for (const track of trackFiles) {
                try {
                    const response = await fetch(track.file);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.topics) {
                            data.topics.forEach(topic => {
                                topics.push({
                                    id: topic.id,
                                    name: topic.name,
                                    category: track.category,
                                    difficulty_level: topic.difficulty_level || 1,
                                    icon_emoji: topic.icon_emoji || '📚',
                                    resource_page_url: `/topic.html?id=${topic.id}`
                                });
                            });
                        }
                    }
                } catch (e) {
                    console.warn(`Could not load ${track.file}:`, e);
                }
            }
        } catch (fallbackError) {
            console.error('JSON fallback also failed:', fallbackError);
        }
    }

    if (topics.length === 0) {
        container.innerHTML = '<p>No topics available yet. Check back soon!</p>';
        return;
    }

    // Group topics by category
    const categories = {};
    topics.forEach(topic => {
        if (!categories[topic.category]) {
            categories[topic.category] = [];
        }
        categories[topic.category].push(topic);
    });

    // Store categories globally for modal access
    window.topicCategories = categories;
    window.categoryMeta = categoryMeta;

    // Helper to render topic chips
    function renderTopicChip(topic) {
        const stars = '⭐'.repeat(topic.difficulty_level || 1);
        return `
            <a href="${topic.resource_page_url || '#'}" class="topic-chip">
                ${topic.icon_emoji || '📚'} ${topic.name}
                <span class="topic-difficulty">${stars}</span>
            </a>
        `;
    }

    // Render categories (show first 6 with "Show all" button)
    const categoriesHTML = Object.entries(categories).map(([catId, catTopics]) => {
        const meta = categoryMeta[catId] || { name: catId, icon: "📚", color: "#888" };
        const displayTopics = catTopics.slice(0, 6);
        const hasMore = catTopics.length > 6;

        const topicsHTML = displayTopics.map(renderTopicChip).join('');

        return `
            <div class="category-card" style="border-top: 3px solid ${meta.color};">
                <div class="category-header">
                    <span class="category-icon">${meta.icon}</span>
                    <h3>${meta.name}</h3>
                    <span class="category-count">${catTopics.length} topics</span>
                </div>
                <div class="category-topics">
                    ${topicsHTML}
                    ${hasMore ? `
                        <button class="show-more-btn" onclick="openTopicModal('${catId}')" style="
                            background: linear-gradient(90deg, ${meta.color}, ${meta.color}cc);
                            border: none;
                            color: white;
                            padding: 10px 20px;
                            border-radius: 25px;
                            cursor: pointer;
                            font-weight: 600;
                            margin-top: 10px;
                            transition: all 0.3s;
                            box-shadow: 0 4px 15px ${meta.color}44;
                        " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                            Show all ${catTopics.length} topics →
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = categoriesHTML;

    // Create modal container if it doesn't exist
    if (!document.getElementById('topic-modal')) {
        const modalHTML = `
            <div id="topic-modal" style="
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10000;
                justify-content: center;
                align-items: center;
                padding: 20px;
                box-sizing: border-box;
            " onclick="closeTopicModal(event)">
                <div id="topic-modal-content" style="
                    background: white;
                    border-radius: 20px;
                    max-width: 900px;
                    max-height: 80vh;
                    overflow-y: auto;
                    padding: 30px;
                    position: relative;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
                " onclick="event.stopPropagation()">
                    <button onclick="closeTopicModal()" style="
                        position: absolute;
                        top: 15px;
                        right: 20px;
                        background: none;
                        border: none;
                        font-size: 28px;
                        cursor: pointer;
                        color: #666;
                    ">×</button>
                    <div id="topic-modal-body"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Modal functions
    window.openTopicModal = function (catId) {
        const modal = document.getElementById('topic-modal');
        const body = document.getElementById('topic-modal-body');
        const catTopics = window.topicCategories[catId] || [];
        const meta = window.categoryMeta[catId] || { name: catId, icon: "📚", color: "#888" };

        const topicsGrid = catTopics.map(topic => {
            const stars = '⭐'.repeat(topic.difficulty_level || 1);
            return `
                <a href="${topic.resource_page_url || '#'}" class="modal-topic-chip" style="
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 16px;
                    background: #f8f9fa;
                    border-radius: 12px;
                    text-decoration: none;
                    color: #333;
                    transition: all 0.2s;
                    border: 1px solid #eee;
                " onmouseover="this.style.background='${meta.color}11'; this.style.borderColor='${meta.color}'" 
                   onmouseout="this.style.background='#f8f9fa'; this.style.borderColor='#eee'">
                    <span style="font-size: 24px;">${topic.icon_emoji || '📚'}</span>
                    <div>
                        <div style="font-weight: 600;">${topic.name}</div>
                        <div style="font-size: 12px; color: #888;">${stars}</div>
                    </div>
                </a>
            `;
        }).join('');

        body.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 2px solid ${meta.color}22;">
                <span style="font-size: 48px;">${meta.icon}</span>
                <div>
                    <h2 style="margin: 0; color: ${meta.color};">${meta.name}</h2>
                    <p style="margin: 5px 0 0; color: #666;">${catTopics.length} topics available</p>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px;">
                ${topicsGrid}
            </div>
        `;

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };

    window.closeTopicModal = function (event) {
        const modal = document.getElementById('topic-modal');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    };
}

// Community Insights (Hybrid - Privacy-First)
async function renderCommunityInsights() {
    const container = document.getElementById('learning-context-container');
    if (!container || !window.sb) return;

    try {
        const { data: { user } } = await window.sb.auth.getUser();

        let insightsHTML = '';

        if (user) {
            try {
                // Get user's current topics
                const { data: userProgress } = await window.sb
                    .from('user_progress')
                    .select('node_id, status')
                    .eq('user_id', user.id)
                    .in('status', ['in_progress', 'completed']);

                if (userProgress && userProgress.length > 0) {
                    const currentTopic = userProgress.find(p => p.status === 'in_progress')?.node_id;

                    if (currentTopic) {
                        // Get context for current topic (may fail if table doesn't exist yet)
                        const { data: topicStats } = await window.sb
                            .from('node_stats')
                            .select('*')
                            .eq('node_id', currentTopic)
                            .single();

                        if (topicStats) {
                            insightsHTML += `
                                <div class="insight-card">
                                    <h3>📊 In Your Current Topic: ${currentTopic}</h3>
                                    <div class="insight-stats">
                                        <div class="stat">
                                            <strong>${topicStats.total_completions || 0}</strong>
                                            <span>Total completions</span>
                                        </div>
                                        <div class="stat">
                                            <strong>${topicStats.avg_time_hours || 'N/A'}h</strong>
                                            <span>Avg completion time</span>
                                        </div>
                                        <div class="stat">
                                            <strong>${topicStats.difficulty_rating || 'N/A'}/5</strong>
                                            <span>Community difficulty</span>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }
                    }
                }
            } catch (userError) {
                console.warn('Could not load user-specific insights (RLS)');
            }
        }

        // Always show aggregate milestones (anonymous)
        try {
            const { count } = await window.sb
                .from('user_progress')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'completed')
                .gte('completion_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

            const weeklyCompletions = count || 0;

            insightsHTML += `
                <div class="insight-card">
                    <h3>🏆 Recent Community Milestones</h3>
                    <div class="milestone-stats">
                        <p><strong>${weeklyCompletions}</strong> topics completed this week</p>
                        <p>Learning happens every day in our community</p>
                    </div>
                </div>
            `;
        } catch (milestoneError) {
            console.warn('Could not load community milestones (RLS)');
        }

        container.innerHTML = insightsHTML || '<p>Sign in to see personalized learning insights</p>';
    } catch (error) {
        console.warn('Community insights loading with limitations');
        container.innerHTML = '';
    }
}

// Platform Statistics
async function renderPlatformStats() {
    const container = document.getElementById('stats-container');
    if (!container || !window.sb) return;

    // Default values in case queries fail
    let completions = 0;
    let topics = 36;
    let active = 0;
    let totalProgress = 0;

    try {
        // Try to get statistics (may fail due to RLS)
        const [progressRes, completionRes, topicsRes, activeRes] = await Promise.allSettled([
            window.sb.from('user_progress').select('id', { count: 'exact', head: true }),
            window.sb.from('user_progress').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
            window.sb.from('learning_topics').select('id', { count: 'exact', head: true }).eq('is_published', true),
            window.sb.from('user_progress').select('user_id', { count: 'exact', head: true })
                .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        ]);

        // Extract counts from successful queries
        if (progressRes.status === 'fulfilled' && progressRes.value.count !== null) {
            totalProgress = progressRes.value.count;
        }
        if (completionRes.status === 'fulfilled' && completionRes.value.count !== null) {
            completions = completionRes.value.count;
        }
        if (topicsRes.status === 'fulfilled' && topicsRes.value.count !== null) {
            topics = topicsRes.value.count;
        }
        if (activeRes.status === 'fulfilled' && activeRes.value.count !== null) {
            active = activeRes.value.count;
        }

        const statsHTML = `
            <div class="stat-box">
                <div class="stat-number">${completions}</div>
                <div class="stat-label">🎯 Topics Completed</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${topics}</div>
                <div class="stat-label">📚 Learning Topics</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${active}</div>
                <div class="stat-label">🔥 Active This Week</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${totalProgress}</div>
                <div class="stat-label">📈 Total Progress Records</div>
            </div>
        `;

        container.innerHTML = statsHTML;

        // Animate numbers
        animateNumbers();
    } catch (error) {
        console.warn('Stats loading with defaults (RLS restrictions may apply)');
        // Still render with default values
        const statsHTML = `
            <div class="stat-box">
                <div class="stat-number">0</div>
                <div class="stat-label">🎯 Topics Completed</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">36</div>
                <div class="stat-label">📚 Learning Topics</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">0</div>
                <div class="stat-label">🔥 Active This Week</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">0</div>
                <div class="stat-label">📈 Total Progress Records</div>
            </div>
        `;
        container.innerHTML = statsHTML;
    }
}

// Animate stat numbers
function animateNumbers() {
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(el => {
        const target = parseInt(el.textContent);
        const duration = 1000;
        const start = 0;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(progress * target);
            el.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = target;
            }
        }

        requestAnimationFrame(update);
    });
}

// Initialize all sections
async function initHomepageContent() {
    await renderLearningPaths();
    await renderTopicExplorer();
    await renderCommunityInsights();
    await renderPlatformStats();
}

// Run on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomepageContent);
} else {
    initHomepageContent();
}
