// ============================================
// LEARNING INTELLIGENCE TRACKER
// Captures HOW users learn in real-time
// ============================================

(async function() {
    if (!window.sb) {
        console.warn('Supabase not loaded - learning tracking disabled');
        return;
    }

    const { data: { user } } = await window.sb.auth.getUser();
    if (!user) {
        console.log('User not logged in - tracking disabled');
        return;
    }

    // Get current node ID from page
    const nodeId = document.body.dataset.nodeId;
    if (!nodeId) {
        console.log('No node ID - not a learning resource page');
        return;
    }

    console.log('📊 Learning Intelligence Tracker Active:', nodeId);

    // ============================================
    // SESSION TRACKING
    // ============================================
    
    let sessionId = null;
    let sessionStart = new Date();
    let interactions = 0;
    let pageViews = 1;
    
    // Detect device type
    const getDeviceType = () => {
        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    };

    // Start session
    async function startSession() {
        const { data, error } = await window.sb
            .from('learning_sessions')
            .insert({
                user_id: user.id,
                node_id: nodeId,
                session_start: sessionStart.toISOString(),
                device_type: getDeviceType(),
                page_views: 1,
                interactions: 0
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to start session:', error);
        } else {
            sessionId = data.id;
            console.log('📝 Session started:', sessionId);
        }
    }

    // End session
    async function endSession(completedInSession = false) {
        if (!sessionId) return;

        const sessionEnd = new Date();
        const durationSeconds = Math.floor((sessionEnd - sessionStart) / 1000);

        const { error } = await window.sb
            .from('learning_sessions')
            .update({
                session_end: sessionEnd.toISOString(),
                duration_seconds: durationSeconds,
                interactions: interactions,
                page_views: pageViews,
                completed_in_session: completedInSession
            })
            .eq('id', sessionId);

        if (error) {
            console.error('Failed to end session:', error);
        } else {
            console.log(`✅ Session ended: ${durationSeconds}s, ${interactions} interactions`);
        }
    }

    // Track interactions
    function trackInteraction() {
        interactions++;
        
        // Throttle updates (every 10 interactions)
        if (sessionId && interactions % 10 === 0) {
            window.sb
                .from('learning_sessions')
                .update({ interactions: interactions })
                .eq('id', sessionId)
                .then(() => console.log(`🎯 Updated interactions: ${interactions}`));
        }
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    // Track clicks
    document.addEventListener('click', trackInteraction);

    // Track scrolling (throttled)
    let scrollTimeout;
    document.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(trackInteraction, 1000);
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            endSession();
        } else {
            // User came back - start new session
            pageViews++;
            sessionStart = new Date();
            startSession();
        }
    });

    // End session on page unload
    window.addEventListener('beforeunload', () => {
        endSession();
    });

    // Track if user completes topic in this session
    window.addEventListener('message', (event) => {
        if (event.data?.type === 'TOPIC_COMPLETED') {
            endSession(true);
        }
    });

    // ============================================
    // DIFFICULTY RATING MODAL
    // ============================================

    // Show difficulty rating after completion
    async function showDifficultyRating() {
        // Check if already rated
        const { data: existing } = await window.sb
            .from('difficulty_ratings')
            .select('id')
            .eq('user_id', user.id)
            .eq('node_id', nodeId)
            .single();

        if (existing) {
            console.log('Already rated this topic');
            return;
        }

        // Create modal
        const modal = document.createElement('div');
        modal.id = 'difficulty-modal';
        modal.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s;
            ">
                <div style="
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    padding: 40px;
                    border-radius: 20px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(76, 139, 245, 0.3);
                ">
                    <h2 style="
                        color: #4c8bf5;
                        margin: 0 0 10px 0;
                        font-size: 24px;
                    ">🎉 Congrats on completing ${nodeId}!</h2>
                    <p style="color: #aaa; margin: 0 0 30px 0;">
                        Help the community by sharing your experience
                    </p>
                    
                    <div style="margin-bottom: 25px;">
                        <label style="color: white; display: block; margin-bottom: 10px; font-weight: 600;">
                            How difficult was this topic?
                        </label>
                        <div id="difficulty-stars" style="display: flex; gap: 10px; font-size: 32px; cursor: pointer;">
                            <span data-rating="1">⭐</span>
                            <span data-rating="2">⭐</span>
                            <span data-rating="3">⭐</span>
                            <span data-rating="4">⭐</span>
                            <span data-rating="5">⭐</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; color: #888; font-size: 12px; margin-top: 5px;">
                            <span>Very Easy</span>
                            <span>Very Hard</span>
                        </div>
                    </div>

                    <div style="margin-bottom: 25px;">
                        <label style="color: white; display: block; margin-bottom: 10px; font-weight: 600;">
                            What was most challenging? (optional)
                        </label>
                        <textarea id="struggles-input" placeholder="e.g., Understanding async/await..." style="
                            width: 100%;
                            padding: 12px;
                            border-radius: 8px;
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            background: rgba(0, 0, 0, 0.3);
                            color: white;
                            font-family: inherit;
                            font-size: 14px;
                            resize: vertical;
                            min-height: 60px;
                        "></textarea>
                    </div>

                    <div style="margin-bottom: 25px;">
                        <label style="color: white; display: block; margin-bottom: 10px; font-weight: 600;">
                            Any tips for future learners? (optional)
                        </label>
                        <textarea id="tips-input" placeholder="e.g., Practice with real projects..." style="
                            width: 100%;
                            padding: 12px;
                            border-radius: 8px;
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            background: rgba(0, 0, 0, 0.3);
                            color: white;
                            font-family: inherit;
                            font-size: 14px;
                            resize: vertical;
                            min-height: 60px;
                        "></textarea>
                    </div>

                    <div style="display: flex; gap: 15px;">
                        <button id="submit-rating" style="
                            flex: 1;
                            background: linear-gradient(90deg, #4c8bf5, #d367c1);
                            color: white;
                            border: none;
                            padding: 15px;
                            border-radius: 10px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: transform 0.2s;
                        " onmouseover="this.style.transform='translateY(-2px)'" 
                           onmouseout="this.style.transform='translateY(0)'">
                            Submit Feedback
                        </button>
                        <button id="skip-rating" style="
                            background: transparent;
                            color: #888;
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            padding: 15px 25px;
                            border-radius: 10px;
                            font-size: 14px;
                            cursor: pointer;
                        ">Skip</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Star rating interaction
        let selectedRating = 0;
        const stars = modal.querySelectorAll('#difficulty-stars span');
        stars.forEach(star => {
            star.addEventListener('click', () => {
                selectedRating = parseInt(star.dataset.rating);
                stars.forEach((s, i) => {
                    s.style.opacity = i < selectedRating ? '1' : '0.3';
                });
            });
        });

        // Submit rating
        modal.querySelector('#submit-rating').addEventListener('click', async () => {
            if (!selectedRating) {
                alert('Please select a difficulty rating');
                return;
            }

            const struggles = modal.querySelector('#struggles-input').value;
            const tips = modal.querySelector('#tips-input').value;

            const { error } = await window.sb
                .from('difficulty_ratings')
                .insert({
                    user_id: user.id,
                    node_id: nodeId,
                    difficulty_score: selectedRating,
                    struggles: struggles || null,
                    tips: tips || null,
                    would_recommend: true
                });

            if (error) {
                console.error('Failed to submit rating:', error);
                alert('Failed to submit feedback');
            } else {
                console.log('✅ Difficulty rating submitted');
                modal.remove();
                showThankYou();
            }
        });

        // Skip rating
        modal.querySelector('#skip-rating').addEventListener('click', () => {
            modal.remove();
        });
    }

    function showThankYou() {
        const thank = document.createElement('div');
        thank.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(90deg, #4c8bf5, #d367c1);
            color: white;
            padding: 20px 30px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(76, 139, 245, 0.5);
            z-index: 10001;
            animation: slideIn 0.3s;
        `;
        thank.textContent = '🙏 Thanks for helping the community!';
        document.body.appendChild(thank);
        
        setTimeout(() => thank.remove(), 3000);
    }

    // ============================================
    // INITIALIZE
    // ============================================

    // Start tracking
    await startSession();

    // Listen for completion to show rating
    const markCompleteBtn = document.getElementById('mark-complete-btn');
    if (markCompleteBtn) {
        markCompleteBtn.addEventListener('click', () => {
            setTimeout(() => {
                showDifficultyRating();
            }, 1500); // Show after completion animation
        });
    }

})();

