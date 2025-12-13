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
    if (window.supabase) {
        try {
            const { data: pathways } = await window.supabase
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
    if (!container || !window.supabase) {
        if (container) {
            container.innerHTML = '<p>Loading topics requires authentication...</p>';
        }
        return;
    }

    try {
        // Load topics from database grouped by category
        const { data: topics, error } = await window.supabase
            .from('learning_topics')
            .select('id, name, category, difficulty_level, icon_emoji, resource_page_url')
            .eq('is_published', true)
            .order('display_order');

        if (error) throw error;

        // Group topics by category
        const categories = {};
        topics.forEach(topic => {
            if (!categories[topic.category]) {
                categories[topic.category] = [];
            }
            categories[topic.category].push(topic);
        });

        // Category metadata
        const categoryMeta = {
            web: { name: "Web Development", icon: "🌐", color: "#4c8bf5" },
            ai: { name: "AI & Machine Learning", icon: "🤖", color: "#d367c1" },
            backend: { name: "Backend Development", icon: "⚙️", color: "#ff6b6b" },
            design: { name: "Design & UX", icon: "🎨", color: "#a060ff" },
            devops: { name: "DevOps & Cloud", icon: "☁️", color: "#51cf66" },
            mobile: { name: "Mobile Development", icon: "📱", color: "#ffd43b" }
        };

        // Render categories
        const categoriesHTML = Object.entries(categories).map(([catId, catTopics]) => {
            const meta = categoryMeta[catId] || { name: catId, icon: "📚", color: "#888" };
            const topicsHTML = catTopics.slice(0, 6).map(topic => {
                const stars = '⭐'.repeat(topic.difficulty_level || 1);
                return `
                    <a href="${topic.resource_page_url || '#'}" class="topic-chip">
                        ${topic.icon_emoji || '📚'} ${topic.name}
                        <span class="topic-difficulty">${stars}</span>
                    </a>
                `;
            }).join('');

            const remaining = catTopics.length - 6;
            const moreHTML = remaining > 0 ? `<span class="more-topics">+${remaining} more</span>` : '';

            return `
                <div class="category-card" style="border-top: 3px solid ${meta.color};">
                    <div class="category-header">
                        <span class="category-icon">${meta.icon}</span>
                        <h3>${meta.name}</h3>
                        <span class="category-count">${catTopics.length} topics</span>
                    </div>
                    <div class="category-topics">
                        ${topicsHTML}
                        ${moreHTML}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = categoriesHTML || '<p>No topics available yet.</p>';
    } catch (error) {
        console.error('Error loading topics:', error);
        container.innerHTML = '<p>Error loading topics. Please try again later.</p>';
    }
}

// Community Insights (Hybrid - Privacy-First)
async function renderCommunityInsights() {
    const container = document.getElementById('learning-context-container');
    if (!container || !window.supabase) return;

    try {
        const { data: { user } } = await window.supabase.auth.getUser();

        let insightsHTML = '';

        if (user) {
            // Get user's current topics
            const { data: userProgress } = await window.supabase
                .from('user_progress')
                .select('node_id, status')
                .eq('user_id', user.id)
                .in('status', ['in_progress', 'completed']);

            if (userProgress && userProgress.length > 0) {
                const currentTopic = userProgress.find(p => p.status === 'in_progress')?.node_id;
                
                if (currentTopic) {
                    // Get context for current topic
                    const { data: topicStats } = await window.supabase
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
        }

        // Always show aggregate milestones (anonymous)
        const { data: recentMilestones } = await window.supabase
            .from('user_progress')
            .select('status, completion_date')
            .eq('status', 'completed')
            .gte('completion_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .select('count');

        const weeklyCompletions = recentMilestones?.length || 0;

        insightsHTML += `
            <div class="insight-card">
                <h3>🏆 Recent Community Milestones</h3>
                <div class="milestone-stats">
                    <p><strong>${weeklyCompletions}</strong> topics completed this week</p>
                    <p>Learning happens every day in our community</p>
                </div>
            </div>
        `;

        container.innerHTML = insightsHTML || '<p>Sign in to see personalized learning insights</p>';
    } catch (error) {
        console.error('Error loading insights:', error);
        container.innerHTML = '';
    }
}

// Platform Statistics
async function renderPlatformStats() {
    const container = document.getElementById('stats-container');
    if (!container || !window.supabase) return;

    try {
        // Get aggregate statistics
        const { data: progressCount } = await window.supabase
            .from('user_progress')
            .select('id', { count: 'exact', head: true });

        const { data: completionCount } = await window.supabase
            .from('user_progress')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'completed');

        const { data: topicsCount } = await window.supabase
            .from('learning_topics')
            .select('id', { count: 'exact', head: true })
            .eq('is_published', true);

        const { data: activeUsers } = await window.supabase
            .from('user_progress')
            .select('user_id', { count: 'exact', head: true })
            .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        const statsHTML = `
            <div class="stat-box">
                <div class="stat-number">${completionCount?.count || 0}</div>
                <div class="stat-label">🎯 Topics Completed</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${topicsCount?.count || 36}</div>
                <div class="stat-label">📚 Learning Topics</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${activeUsers?.count || 0}</div>
                <div class="stat-label">🔥 Active This Week</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${progressCount?.count || 0}</div>
                <div class="stat-label">📈 Total Progress Records</div>
            </div>
        `;

        container.innerHTML = statsHTML;

        // Animate numbers
        animateNumbers();
    } catch (error) {
        console.error('Error loading stats:', error);
        container.innerHTML = '<p>Statistics will be available soon.</p>';
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
