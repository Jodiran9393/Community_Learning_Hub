/**
 * Content Generator - Generates learning content for topics using LLMs
 * Uses topic_card_template from track JSON to structure content
 */

class ContentGenerator {
    constructor() {
        this.providers = window.llmProviders;
    }

    /**
     * Get cache key for a topic
     */
    getCacheKey(topicId) {
        return `topic_content_${topicId}`;
    }

    /**
     * Get cached content for a topic
     */
    getCachedContent(topicId) {
        try {
            const cached = localStorage.getItem(this.getCacheKey(topicId));
            if (cached) {
                const data = JSON.parse(cached);
                // Cache is valid for 7 days
                const maxAge = 7 * 24 * 60 * 60 * 1000;
                if (Date.now() - data.timestamp < maxAge) {
                    console.log(`📦 Using cached content for: ${topicId}`);
                    return data.content;
                }
            }
        } catch (e) {
            console.warn('Failed to load cached content:', e);
        }
        return null;
    }

    /**
     * Cache generated content
     */
    cacheContent(topicId, content) {
        try {
            localStorage.setItem(this.getCacheKey(topicId), JSON.stringify({
                content: content,
                timestamp: Date.now()
            }));
            console.log(`💾 Cached content for: ${topicId}`);
        } catch (e) {
            console.warn('Failed to cache content:', e);
        }
    }

    /**
     * Clear cached content for a topic (for regeneration)
     */
    clearContentCache(topicId) {
        localStorage.removeItem(this.getCacheKey(topicId));
    }

    /**
     * Generate content for a topic
     * @param {object} topic - Topic object from track JSON
     * @param {object} template - topic_card_template from track JSON
     * @param {boolean} forceRegenerate - Skip cache and regenerate
     * @returns {Promise<object>} Structured content object
     */
    async generateTopicContent(topic, template, forceRegenerate = false) {
        const topicId = topic.id || topic.name;

        // Check cache first (unless force regenerate)
        if (!forceRegenerate) {
            const cached = this.getCachedContent(topicId);
            if (cached) {
                return { success: true, content: cached, fromCache: true };
            }
        }

        console.log(`📝 Generating content for: ${topic.name}`);

        const prompt = this.buildPrompt(topic, template);

        try {
            const rawContent = await this.providers.generate(prompt, { purpose: 'content' });
            const structured = this.parseContent(rawContent, template);

            // Cache the generated content
            this.cacheContent(topicId, structured);

            return { success: true, content: structured, fromCache: false };
        } catch (error) {
            console.error('Content generation failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Build the prompt using topic_card_template
     * Enhanced for in-depth, comprehensive educational content
     */
    buildPrompt(topic, template) {
        const sections = template?.sections || [
            'What it is (comprehensive explanation)',
            'Why it matters (real-world impact)',
            'Core concepts (detailed breakdown)',
            'Common misconceptions (with corrections)',
            'Worked example (step-by-step)',
            'Practice challenges (progressive difficulty)',
            'Proof task (portfolio-worthy project)'
        ];

        const prerequisites = topic.prerequisites?.join(', ') || 'None';
        const difficulty = topic.difficulty_level || 1;
        const difficultyLabel = ['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'][difficulty - 1] || 'Beginner';

        const prompt = `You are an expert educator creating comprehensive learning content for a self-paced online learning platform. Your goal is to create content that truly teaches and transforms learners, not just provides surface-level information.

=== TOPIC INFORMATION ===
Topic: ${topic.name}
Description: ${topic.description || 'No description provided'}
Category: ${topic.category || 'general'}
Difficulty Level: ${difficultyLabel} (${difficulty}/5)
Estimated Study Time: ${topic.estimated_hours || 2} hours
Prerequisites: ${prerequisites}

=== CONTENT REQUIREMENTS ===

Generate comprehensive learning content following this structure. Write as an expert mentor who genuinely wants the learner to succeed. Be thorough, practical, and engaging.

## 1. What It Is (Comprehensive Explanation)
Write 4-6 detailed paragraphs that:
- Define the concept clearly with proper technical terminology
- Explain the historical context or origin (why was this created/developed?)
- Describe how it fits into the broader ecosystem/field
- Compare and contrast with related concepts to clarify boundaries
- Use analogies from everyday life to make abstract concepts tangible
- Explain what problem this solves and for whom

## 2. Why It Matters (Real-World Impact)
Write a compelling section that:
- Lists 5-7 specific real-world applications with concrete examples
- Explains career relevance (what jobs use this? how does it help?)
- Quantifies the impact where possible (adoption rates, industry statistics)
- Describes what becomes possible once you master this
- Connects to current industry trends and future directions
- Motivates the learner by showing the "before and after" of knowing this

## 3. Core Concepts (Detailed Breakdown)
For each of 6-10 key concepts:
- **Concept Name**: One-line definition
- Detailed explanation (2-3 paragraphs each)
- How it connects to other concepts
- Common patterns and best practices
- Anti-patterns to avoid
- Code snippet or example if applicable
Structure this as interconnected knowledge, not isolated facts.

## 4. Common Misconceptions (With Corrections)
Address 5-7 misconceptions that learners commonly have:
- State the misconception clearly (what people wrongly believe)
- Explain why it seems reasonable to believe this
- Provide the correct understanding with evidence
- Give an example that demonstrates the correct approach
- Explain the consequences of the misconception in practice

## 5. Worked Example (Step-by-Step Tutorial)
Create a comprehensive, practical example that:
- Starts with a realistic problem statement
- Lists what you'll need (tools, setup, prerequisites)
- Walks through the solution in 8-15 detailed steps
- Explains the "why" behind each step, not just the "what"
- Includes complete, working code with extensive comments
- Shows the expected output/result at key checkpoints
- Addresses common errors and how to fix them
- Suggests variations to try after completing the base example

## 6. Practice Challenges (Progressive Difficulty)
Create 5 practice challenges that build on each other:

**Challenge 1 (Warm-up)**: [Easy - tests basic understanding]
**Challenge 2 (Foundation)**: [Easy-Medium - combines 2 concepts]
**Challenge 3 (Application)**: [Medium - real-world scenario]
**Challenge 4 (Problem-Solving)**: [Medium-Hard - requires research/thinking]
**Challenge 5 (Mastery)**: [Hard - stretches understanding]

For each challenge, provide:
- Clear problem statement
- Hints (hidden in spoiler format)
- Detailed solution with explanation
- Extension ideas for further practice

## 7. Proof Task (Portfolio-Worthy Project)
Design a substantial project that:
- Takes 2-4 hours to complete properly
- Produces something the learner can show others
- Integrates multiple concepts from this topic
- Has clear acceptance criteria (how do you know you're done?)
- Includes bonus challenges for ambitious learners
- Suggests how to present this in a portfolio or interview

=== FORMATTING GUIDELINES ===
- Use markdown formatting throughout
- Use \`\`\`language for code blocks with appropriate syntax highlighting
- Use **bold** for key terms when first introduced
- Use bullet points for lists, numbered lists for sequences
- Use blockquotes > for important callouts or tips
- Structure content with clear visual hierarchy
- Include emojis sparingly to highlight section transitions
- Aim for ${topic.estimated_hours || 2} hours worth of study material

=== QUALITY STANDARDS ===
- Write like you're mentoring a motivated learner one-on-one
- Anticipate questions and answer them proactively
- Connect abstract concepts to concrete applications
- Use first-person plural ("we") to create collaborative feeling
- Balance breadth (covering all key aspects) with depth (explaining thoroughly)
- Every code example must be complete and runnable
- Include context that helps learners remember and apply knowledge

Generate the complete content now:`;

        return prompt;
    }

    /**
     * Parse raw LLM output into structured sections
     */
    parseContent(rawContent, template) {
        // Split by ## headers
        const sections = {};
        const headerRegex = /^##\s*\d*\.?\s*(.+?)$/gm;
        const parts = rawContent.split(headerRegex);

        // Parts will be: [preamble, header1, content1, header2, content2, ...]
        for (let i = 1; i < parts.length; i += 2) {
            const header = parts[i]?.trim().toLowerCase().replace(/[^a-z\s]/g, '').trim();
            const content = parts[i + 1]?.trim() || '';

            // Normalize header names (support both old and new formats)
            if (header.includes('what it is') || header.includes('comprehensive explanation')) {
                sections.whatItIs = content;
            } else if (header.includes('why it matters') || header.includes('real-world impact')) {
                sections.whyItMatters = content;
            } else if (header.includes('core concept') || header.includes('key ideas') || header.includes('detailed breakdown')) {
                sections.coreConcepts = content;
            } else if (header.includes('misconception') || header.includes('with corrections')) {
                sections.misconceptions = content;
            } else if (header.includes('worked example') || header.includes('step-by-step')) {
                sections.workedExample = content;
            } else if (header.includes('practice') || header.includes('challenge')) {
                sections.practice = content;
            } else if (header.includes('proof') || header.includes('portfolio')) {
                sections.proofTask = content;
            } else if (header.includes('next')) {
                sections.nextSteps = content;
            }
        }

        // If parsing failed, return raw content
        if (Object.keys(sections).length === 0) {
            sections.rawContent = rawContent;
        }

        return sections;
    }

    /**
     * Render structured content to HTML
     */
    renderContentHTML(content) {
        if (content.rawContent) {
            return `<div class="generated-content">${this.markdownToHTML(content.rawContent)}</div>`;
        }

        const sections = [
            { key: 'whatItIs', title: '📖 What It Is', icon: '📖' },
            { key: 'whyItMatters', title: '💡 Why It Matters', icon: '💡' },
            { key: 'coreConcepts', title: '🎯 Core Concepts', icon: '🎯' },
            { key: 'misconceptions', title: '⚠️ Common Misconceptions', icon: '⚠️' },
            { key: 'workedExample', title: '💻 Worked Example', icon: '💻' },
            { key: 'practice', title: '✏️ Practice Challenges', icon: '✏️' },
            { key: 'proofTask', title: '🏆 Proof Task', icon: '🏆' }
        ];

        let html = '<div class="generated-content">';

        for (const { key, title, icon } of sections) {
            if (content[key]) {
                html += `
                    <section class="content-section" data-section="${key}">
                        <h3>${title}</h3>
                        <div class="section-content">
                            ${this.markdownToHTML(content[key])}
                        </div>
                    </section>
                `;
            }
        }

        html += '</div>';
        return html;
    }

    /**
     * Simple markdown to HTML converter
     */
    markdownToHTML(markdown) {
        if (!markdown) return '';

        let codeBlockId = 0;

        let html = markdown
            // Code blocks with language - add copy button at top right
            .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
                const blockId = `topic-code-${Date.now()}-${codeBlockId++}`;
                const langLabel = lang ? `<span class="code-lang">${lang}</span>` : '';
                return `<div class="code-block-container">
                    ${langLabel}
                    <button class="copy-btn" onclick="window.contentGenerator.copyCode('${blockId}')" title="Copy">
                        <span class="copy-icon">📋</span>
                        <span class="check-icon">✓</span>
                    </button>
                    <pre id="${blockId}"><code class="language-${lang || 'text'}">${code.trim()}</code></pre>
                </div>`;
            })
            // Inline code
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // Bold
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            // Headers (h4, h5 - since h3 is used for sections)
            .replace(/^####\s+(.+)$/gm, '<h5>$1</h5>')
            .replace(/^###\s+(.+)$/gm, '<h4>$1</h4>')
            // Unordered lists
            .replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
            // Numbered lists
            .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
            // Paragraphs (double newlines)
            .replace(/\n\n/g, '</p><p>')
            // Single newlines to br
            .replace(/\n/g, '<br>');

        // Wrap list items
        html = html.replace(/(<li>.*?<\/li>)+/gs, '<ul>$&</ul>');

        // Wrap in paragraph if not starting with block element
        if (!html.startsWith('<')) {
            html = `<p>${html}</p>`;
        }

        return html;
    }

    /**
     * Copy code to clipboard
     */
    copyCode(blockId) {
        const codeBlock = document.getElementById(blockId);
        if (!codeBlock) return;

        const code = codeBlock.textContent;
        navigator.clipboard.writeText(code).then(() => {
            const btn = codeBlock.parentElement.querySelector('.copy-btn');
            if (btn) {
                btn.classList.add('copied');
                btn.title = 'Copied!';
                setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.title = 'Copy';
                }, 2000);
            }
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    }

    /**
     * Get loading HTML while content generates
     */
    getLoadingHTML() {
        return `
            <div class="content-loading">
                <div class="loading-spinner"></div>
                <p>Generating learning content...</p>
                <p class="loading-hint">Using AI to create personalized content for this topic</p>
            </div>
        `;
    }

    /**
     * Get error HTML when generation fails
     */
    getErrorHTML(error, onRetry) {
        return `
            <div class="content-error">
                <h3>⚠️ Content Generation Failed</h3>
                <p>${error}</p>
                <button class="btn-primary" onclick="${onRetry}">
                    🔄 Try Again
                </button>
                <p class="error-hint">
                    Make sure your LLM provider is configured correctly in 
                    <a href="/settings.html">Settings</a>
                </p>
            </div>
        `;
    }
}

// Create singleton instance
window.contentGenerator = new ContentGenerator();
