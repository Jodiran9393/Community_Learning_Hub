/**
 * Diagnostic Engine - Universal assessment system
 * Works for all 3 tracks (Frontend, AI, Data)
 * Handles confidence sliders + quizzes, calculates placement
 */

class DiagnosticEngine {
    constructor(trackData, outcomeId) {
        this.track = trackData;
        this.outcomeId = outcomeId;
        this.outcome = trackData.outcomes.find(o => o.id === outcomeId);
        this.diagnostic = trackData.diagnostic;

        this.responses = {
            confidence: {},
            coreQuiz: [],
            outcomeQuiz: []
        };
    }

    /**
     * Render confidence sliders step
     */
    renderConfidenceSliders(container) {
        const sliders = this.diagnostic.core_confidence_sliders;

        container.innerHTML = `
            <div class="diagnostic-step">
                <h2>How confident are you?</h2>
                <p class="step-description">Rate your confidence level in these core areas (0 = none, 5 = expert)</p>
                
                <div class="sliders-container">
                    ${sliders.map((slider, i) => `
                        <div class="confidence-slider">
                            <label class="slider-label">${slider.prompt}</label>
                            <div class="slider-track">
                                <input 
                                    type="range" 
                                    id="slider-${i}" 
                                    min="0" 
                                    max="5" 
                                    value="0" 
                                    data-topic="${slider.topic_id}"
                                    class="slider-input"
                                />
                                <div class="slider-labels">
                                    <span>None</span>
                                    <span>Expert</span>
                                </div>
                                <div class="slider-value" id="value-${i}">0</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Add event listeners
        sliders.forEach((slider, i) => {
            const input = container.querySelector(`#slider-${i}`);
            const valueDisplay = container.querySelector(`#value-${i}`);

            input.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                valueDisplay.textContent = value;
                this.responses.confidence[slider.topic_id] = value;
            });
        });
    }

    /**
     * Render core quiz step
     */
    renderCoreQuiz(container) {
        const questions = this.diagnostic.core_micro_quiz;

        container.innerHTML = `
            <div class="diagnostic-step">
                <h2>Quick Knowledge Check</h2>
                <p class="step-description">Answer these questions to help us understand your current level</p>
                
                <div class="quiz-container">
                    ${questions.map((q, i) => `
                        <div class="quiz-question" data-question="${i}">
                            <div class="question-number">Question ${i + 1} of ${questions.length}</div>
                            <h3 class="question-text">${q.prompt}</h3>
                            <div class="question-options">
                                ${q.options.map((option, optIdx) => `
                                    <label class="option-label">
                                        <input 
                                            type="radio" 
                                            name="core-q${i}" 
                                            value="${optIdx}"
                                            data-question="${i}"
                                            data-correct="${q.correct_index}"
                                        />
                                        <span class="option-text">${option}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Track answers
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const questionIdx = parseInt(e.target.dataset.question);
                const selected = parseInt(e.target.value);
                const correct = parseInt(e.target.dataset.correct);

                this.responses.coreQuiz[questionIdx] = {
                    selected,
                    correct: selected === correct
                };
            });
        });
    }

    /**
     * Render outcome-specific quiz step
     */
    renderOutcomeQuiz(container) {
        const pool = this.diagnostic.outcome_micro_quiz_pool;
        const questions = pool.filter(q => q.outcome_id === this.outcomeId);

        container.innerHTML = `
            <div class="diagnostic-step">
                <h2>Outcome-Specific Questions</h2>
                <p class="step-description">A few questions specific to ${this.outcome.label}</p>
                
                <div class="quiz-container">
                    ${questions.map((q, i) => `
                        <div class="quiz-question">
                            <div class="question-number">Question ${i + 1} of ${questions.length}</div>
                            <h3 class="question-text">${q.prompt}</h3>
                            <div class="question-options">
                                ${q.options.map((option, optIdx) => `
                                    <label class="option-label">
                                        <input 
                                            type="radio" 
                                            name="outcome-q${i}" 
                                            value="${optIdx}"
                                            data-question="${i}"
                                            data-correct="${q.correct_index}"
                                        />
                                        <span class="option-text">${option}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Track answers
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const questionIdx = parseInt(e.target.dataset.question);
                const selected = parseInt(e.target.value);
                const correct = parseInt(e.target.dataset.correct);

                this.responses.outcomeQuiz[questionIdx] = {
                    selected,
                    correct: selected === correct
                };
            });
        });
    }

    /**
     * Calculate placement based on responses
     * Returns recommended starting topic and learning path
     */
    async calculatePlacement() {
        console.log('📊 Calculating placement...', this.responses);

        const diagnosticTopics = this.outcome.diagnostic_topic_ids;
        const capstones = this.outcome.capstones;

        // 1. Score each diagnostic topic based on confidence + quiz
        const topicScores = {};

        // Confidence contributes 60% to score
        for (const [topicId, confidence] of Object.entries(this.responses.confidence)) {
            topicScores[topicId] = (confidence / 5) * 0.6;
        }

        // Quiz correctness contributes 40%
        const totalQuizzes = [...this.responses.coreQuiz, ...this.responses.outcomeQuiz];
        const correctCount = totalQuizzes.filter(r => r.correct).length;
        const quizScore = (correctCount / totalQuizzes.length) * 0.4;

        // Add quiz score to all topics
        for (const topicId of diagnosticTopics) {
            topicScores[topicId] = (topicScores[topicId] || 0) + quizScore;
        }

        // 2. Identify gaps (topics with low scores)
        const gaps = diagnosticTopics.filter(topicId => {
            const score = topicScores[topicId] || 0;
            return score < 0.5; // Below 50% proficiency
        });

        console.log('💡 Identified gaps:', gaps);

        // 3. Find starting point (first gap's prerequisites)
        let startTopic;
        if (gaps.length > 0) {
            const firstGap = gaps[0];
            const prereqChain = await window.trackLoader.getPrerequisiteChain(firstGap);

            // Start at the earliest prerequisite they don't know
            startTopic = prereqChain.length > 0 ? prereqChain[prereqChain.length - 1] : firstGap;
        } else {
            // No gaps - start at first capstone
            startTopic = capstones[0];
        }

        // 4. Build path to all capstones
        const path = await this.buildPathToCapstones(startTopic, capstones);

        return {
            startTopic,
            recommendedPath: path,
            gaps,
            scores: topicScores,
            overallProficiency: Object.values(topicScores).reduce((a, b) => a + b, 0) / Object.keys(topicScores).length
        };
    }

    /**
     * Build learning path from start topic to all capstones
     */
    async buildPathToCapstones(startTopic, capstones) {
        const path = [startTopic];
        const visited = new Set([startTopic]);

        // Simple breadth-first path building
        // In reality, this would use the prerequisite graph from JSON
        // For now, just return capstones in order
        for (const capstone of capstones) {
            if (!visited.has(capstone)) {
                path.push(capstone);
                visited.add(capstone);
            }
        }

        return path;
    }

    /**
     * Save assessment to database
     */
    async saveToDatabase(placement, userId) {
        try {
            const { data, error } = await window.sb.from('user_assessments').upsert({
                user_id: userId,
                track_id: this.track.track_id,
                outcome_chosen: this.outcomeId,
                responses: this.responses,
                placement_result: placement,
                completed_at: new Date().toISOString()
            });

            if (error) throw error;

            // Also update user_learning_profiles
            await window.sb.from('user_learning_profiles').upsert({
                user_id: userId,
                primary_track: this.track.track_id,
                chosen_outcome: this.outcomeId,
                recommended_path: placement.recommendedPath,
                assessment_completed_at: new Date().toISOString()
            });

            console.log('✅ Assessment saved to database');
            return true;
        } catch (error) {
            console.error('❌ Failed to save assessment:', error);
            return false;
        }
    }
}

window.DiagnosticEngine = DiagnosticEngine;
