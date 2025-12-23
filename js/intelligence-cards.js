// ============================================
// LEARNING INTELLIGENCE CARDS
// Transform mission cards into live data dashboards
// ============================================

async function initIntelligenceCards() {
    console.log('🧠 Intelligence Cards: Starting initialization...');

    if (!window.sb) {
        console.log('⚠️ Supabase not available yet');
        return;
    }

    const { data: { user } } = await window.sb.auth.getUser();

    console.log('🧠 Loading Learning Intelligence...', user ? 'User logged in' : 'Guest user');

    // ============================================
    // CARD 1: YOUR LEARNING JOURNEY
    // ============================================
    async function loadPersonalStats() {
        if (!user) {
            return {
                completed: 0,
                total: 14,
                percentage: 0,
                streak: 0,
                nextTopic: 'Sign in to track progress'
            };
        }

        // Get user progress
        const { data: progress } = await window.sb
            .from('user_progress')
            .select('*')
            .eq('user_id', user.id);

        const completed = progress?.filter(p => p.status === 'completed').length || 0;
        const total = 14;
        const percentage = Math.round((completed / total) * 100);

        // Get streak
        const { data: streaks } = await window.sb
            .from('learning_streaks')
            .select('current_streak')
            .eq('user_id', user.id)
            .single();

        const streak = streaks?.current_streak || 0;

        // Get learning profile
        const { data: profile } = await window.sb
            .from('user_learning_profiles')
            .select('total_learning_time_hours, learning_velocity')
            .eq('user_id', user.id)
            .single();

        return {
            completed,
            total,
            percentage,
            streak,
            learningTime: profile?.total_learning_time_hours || 0,
            velocity: profile?.learning_velocity || 'building...'
        };
    }

    // ============================================
    // CARD 2: COMMUNITY INSIGHTS
    // ============================================
    async function loadCommunityStats() {
        // Get total completions across all users
        const { data: allProgress } = await window.sb
            .from('user_progress')
            .select('node_id, status')
            .eq('status', 'completed');

        const totalCompletions = allProgress?.length || 0;

        // Find most popular topic
        const nodeCounts = {};
        allProgress?.forEach(p => {
            nodeCounts[p.node_id] = (nodeCounts[p.node_id] || 0) + 1;
        });

        const mostPopular = Object.entries(nodeCounts)
            .sort((a, b) => b[1] - a[1])[0];

        // Get unique learners
        const { data: users } = await window.sb
            .from('user_progress')
            .select('user_id', { count: 'exact', head: false });

        const uniqueUsers = new Set(users?.map(u => u.user_id)).size;

        // Get popular pathway
        const { data: pathways } = await window.sb
            .from('learning_pathways')
            .select('from_topic, to_topic')
            .limit(1000);

        const pathwayCounts = {};
        pathways?.forEach(p => {
            const key = `${p.from_topic} → ${p.to_topic}`;
            pathwayCounts[key] = (pathwayCounts[key] || 0) + 1;
        });

        const topPathway = Object.entries(pathwayCounts)
            .sort((a, b) => b[1] - a[1])[0];

        return {
            totalCompletions,
            mostPopular: mostPopular ? mostPopular[0] : 'React.js',
            popularCount: mostPopular ? mostPopular[1] : 0,
            activeLearners: uniqueUsers || 0,
            topPathway: topPathway ? topPathway[0] : 'HTML → CSS'
        };
    }

    // ============================================
    // CARD 3: SMART RECOMMENDATIONS
    // ============================================
    async function loadRecommendations() {
        if (!user) {
            return {
                nextTopic: 'Sign in for personalized recommendations',
                reason: '',
                estimatedTime: 0,
                confidence: 0
            };
        }

        // Get user's completed topics
        const { data: completed } = await window.sb
            .from('user_progress')
            .select('node_id')
            .eq('user_id', user.id)
            .eq('status', 'completed');

        const completedIds = completed?.map(c => c.node_id) || [];

        // All available topics
        const allTopics = ['React', 'HTML', 'CSS', 'JavaScript', 'TypeScript',
            'NextJS', 'Python', 'LLM', 'Prompting', 'Agents',
            'Figma', 'UI', 'A11y'];

        // Not completed yet
        const remaining = allTopics.filter(t => !completedIds.includes(t));

        if (remaining.length === 0) {
            return {
                nextTopic: '🎉 All topics completed!',
                reason: 'You\'re a learning champion!',
                estimatedTime: 0,
                confidence: 100
            };
        }

        // Simple recommendation: next in common pathways
        const recommendations = {
            'HTML': { next: 'CSS', time: 12, reason: 'Natural progression from HTML' },
            'CSS': { next: 'JavaScript', time: 40, reason: 'Essential for interactivity' },
            'JavaScript': { next: 'React', time: 35, reason: 'Most popular framework' },
            'React': { next: 'TypeScript', time: 25, reason: 'Type-safe React development' },
            'TypeScript': { next: 'NextJS', time: 20, reason: 'Full-stack React framework' },
            'Python': { next: 'LLM', time: 30, reason: 'AI/ML foundation' },
            'LLM': { next: 'Prompting', time: 15, reason: 'Effective AI communication' },
            'Prompting': { next: 'Agents', time: 25, reason: 'Advanced AI applications' }
        };

        // Find recommendation based on last completed
        let nextTopic = remaining[0];
        let reason = 'Start your learning journey';
        let estimatedTime = 20;

        if (completedIds.length > 0) {
            const lastCompleted = completedIds[completedIds.length - 1];
            const rec = recommendations[lastCompleted];

            if (rec && remaining.includes(rec.next)) {
                nextTopic = rec.next;
                reason = rec.reason;
                estimatedTime = rec.time;
            }
        }

        return {
            nextTopic,
            reason,
            estimatedTime,
            confidence: 85
        };
    }

    // ============================================
    // UPDATE CARDS WITH REAL DATA
    // ============================================

    const [personalStats, communityStats, recommendations] = await Promise.all([
        loadPersonalStats(),
        loadCommunityStats(),
        loadRecommendations()
    ]);

    console.log('📊 Stats loaded:', { personalStats, communityStats, recommendations });

    // Update Card 1: Inclusive Learning → Your Learning Journey
    const card1 = document.querySelector('.mission-item:nth-child(1)');
    if (card1) {
        card1.innerHTML = `
            <div class="mission-icon" style="font-size: 48px;">🧠</div>
            <h3 style="background: linear-gradient(90deg, #4c8bf5, #d367c1); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;">
                Your Learning Journey
            </h3>
            <div style="margin: 20px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="font-size: 32px; font-weight: bold; color: #4c8bf5;">${personalStats.completed}/${personalStats.total}</span>
                    <span style="font-size: 32px; font-weight: bold; color: #d367c1;">${personalStats.percentage}%</span>
                </div>
                <div style="background: rgba(76, 139, 245, 0.1); border-radius: 10px; height: 12px; overflow: hidden;">
                    <div style="
                        background: linear-gradient(90deg, #4c8bf5, #d367c1);
                        height: 100%;
                        width: ${personalStats.percentage}%;
                        transition: width 1s ease;
                        border-radius: 10px;
                    "></div>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
                <div style="background: rgba(76, 139, 245, 0.05); padding: 15px; border-radius: 10px; border: 1px solid rgba(76, 139, 245, 0.2);">
                    <div style="font-size: 24px;">🔥</div>
                    <div style="font-size: 20px; font-weight: bold; color: #4c8bf5;">${personalStats.streak}</div>
                    <div style="font-size: 12px; color: #888;">Day Streak</div>
                </div>
                <div style="background: rgba(211, 103, 193, 0.05); padding: 15px; border-radius: 10px; border: 1px solid rgba(211, 103, 193, 0.2);">
                    <div style="font-size: 24px;">⚡</div>
                    <div style="font-size: 20px; font-weight: bold; color: #d367c1;">${personalStats.velocity}</div>
                    <div style="font-size: 12px; color: #888;">Pace</div>
                </div>
            </div>
            ${user ? `
                <button onclick="window.location.href='#galaxy-hero'" style="
                    width: 100%;
                    margin-top: 20px;
                    background: linear-gradient(90deg, #4c8bf5, #d367c1);
                    color: white;
                    border: none;
                    padding: 12px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='translateY(-2px)'" 
                   onmouseout="this.style.transform='translateY(0)'">
                    View Galaxy
                </button>
            ` : `
                <button onclick="window.location.href='auth.html'" style="
                    width: 100%;
                    margin-top: 20px;
                    background: linear-gradient(90deg, #4c8bf5, #d367c1);
                    color: white;
                    border: none;
                    padding: 12px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                ">
                    Sign In to Track Progress
                </button>
            `}
        `;
    }

    // Update Card 2: Community Support → Community Insights
    const card2 = document.querySelector('.mission-item:nth-child(2)');
    if (card2) {
        card2.innerHTML = `
            <div class="mission-icon" style="font-size: 48px;">🌍</div>
            <h3 style="background: linear-gradient(90deg, #4c8bf5, #d367c1); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;">
                Community Insights
            </h3>
            <div style="margin: 20px 0;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 48px; font-weight: bold; background: linear-gradient(90deg, #4c8bf5, #d367c1); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;">
                        ${communityStats.totalCompletions}
                    </div>
                    <div style="color: #888; font-size: 14px;">Total Topic Completions</div>
                </div>
                <div style="background: rgba(76, 139, 245, 0.05); padding: 15px; border-radius: 10px; margin-bottom: 10px; border: 1px solid rgba(76, 139, 245, 0.2);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 12px; color: #888; margin-bottom: 5px;">🔥 Most Popular</div>
                            <div style="font-weight: bold; color: #4c8bf5;">${communityStats.mostPopular}</div>
                        </div>
                        <div style="font-size: 20px; font-weight: bold; color: #d367c1;">${communityStats.popularCount}</div>
                    </div>
                </div>
                <div style="background: rgba(211, 103, 193, 0.05); padding: 15px; border-radius: 10px; border: 1px solid rgba(211, 103, 193, 0.2);">
                    <div style="font-size: 12px; color: #888; margin-bottom: 5px;">🚀 Popular Path</div>
                    <div style="font-weight: bold; color: #d367c1; font-size: 14px;">${communityStats.topPathway}</div>
                </div>
            </div>
            <div style="text-align: center; padding: 15px; background: rgba(76, 139, 245, 0.05); border-radius: 10px;">
                <span style="font-size: 24px; font-weight: bold; color: #4c8bf5;">${communityStats.activeLearners}</span>
                <span style="color: #888; margin-left: 10px;">Active Learners</span>
            </div>
        `;
    }

    // Update Card 3: Practical Knowledge → Smart Recommendations
    const card3 = document.querySelector('.mission-item:nth-child(3)');
    if (card3) {
        card3.innerHTML = `
            <div class="mission-icon" style="font-size: 48px;">🎯</div>
            <h3 style="background: linear-gradient(90deg, #4c8bf5, #d367c1); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;">
                Recommended Next
            </h3>
            <div style="margin: 20px 0;">
                <div style="text-align: center; margin-bottom: 15px;">
                    <div style="font-size: 32px; font-weight: bold; color: #4c8bf5; margin-bottom: 10px;">
                        ${recommendations.nextTopic}
                    </div>
                    ${recommendations.reason ? `
                        <div style="color: #888; font-size: 14px; margin-bottom: 15px;">
                            ${recommendations.reason}
                        </div>
                    ` : ''}
                </div>
                ${recommendations.estimatedTime > 0 ? `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                        <div style="background: rgba(76, 139, 245, 0.05); padding: 12px; border-radius: 8px; text-align: center; border: 1px solid rgba(76, 139, 245, 0.2);">
                            <div style="font-size: 20px;">⏱️</div>
                            <div style="font-weight: bold; color: #4c8bf5;">${recommendations.estimatedTime}h</div>
                            <div style="font-size: 11px; color: #888;">Est. Time</div>
                        </div>
                        <div style="background: rgba(211, 103, 193, 0.05); padding: 12px; border-radius: 8px; text-align: center; border: 1px solid rgba(211, 103, 193, 0.2);">
                            <div style="font-size: 20px;">🎲</div>
                            <div style="font-weight: bold; color: #d367c1;">${recommendations.confidence}%</div>
                            <div style="font-size: 11px; color: #888;">Confidence</div>
                        </div>
                    </div>
                ` : ''}
                ${user && recommendations.estimatedTime > 0 ? `
                    <button onclick="window.location.href='/pages/${recommendations.nextTopic.toLowerCase()}.html'" style="
                        width: 100%;
                        background: linear-gradient(90deg, #4c8bf5, #d367c1);
                        color: white;
                        border: none;
                        padding: 14px;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 16px;
                        cursor: pointer;
                        transition: transform 0.2s;
                    " onmouseover="this.style.transform='translateY(-2px)'" 
                       onmouseout="this.style.transform='translateY(0)'">
                        Start Learning
                    </button>
                ` : ''}
                <div style="margin-top: 15px; padding: 12px; background: rgba(76, 139, 245, 0.05); border-radius: 8px; border: 1px solid rgba(76, 139, 245, 0.2);">
                    <div style="font-size: 12px; color: #888; margin-bottom: 8px;">💡 Pro Tip</div>
                    <div style="font-size: 13px; color: #aaa;">
                        Based on ${communityStats.activeLearners}+ learners' pathways
                    </div>
                </div>
            </div>
        `;
    }

    // Add subtle animation
    document.querySelectorAll('.mission-item').forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, i * 150);
    });

    console.log('✨ Intelligence Cards Updated!');
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initIntelligenceCards, 500); // Wait for Supabase to load
    });
} else {
    setTimeout(initIntelligenceCards, 500);
}
