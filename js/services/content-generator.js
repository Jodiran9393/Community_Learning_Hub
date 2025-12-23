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
            const rawContent = await this.providers.generate(prompt);
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
     */
    buildPrompt(topic, template) {
        const sections = template?.sections || [
            'What it is (2-4 sentences)',
            'Why it matters (2-3 bullets)',
            'Key ideas (5-8 bullets)',
            'Common misconceptions (3 bullets)',
            'Worked example',
            'Practice (3 questions with answers)',
            'Proof task (measurable activity)'
        ];

        const prerequisites = topic.prerequisites?.join(', ') || 'None';

        const prompt = `${template?.prompt_skeleton || 'Generate a Topic Card for {topic.name}. Keep it practical and beginner-friendly.'}

Topic: ${topic.name}
Description: ${topic.description || 'No description provided'}
Category: ${topic.category || 'general'}
Difficulty: ${topic.difficulty_level || 1}/5
Estimated Time: ${topic.estimated_hours || 2} hours
Prerequisites: ${prerequisites}

Generate learning content with the following sections. Use markdown formatting. Be practical and engaging.

${sections.map((s, i) => `## ${i + 1}. ${s}`).join('\n')}

Important guidelines:
- Be concise but thorough
- Include practical, real-world examples
- Make the worked example hands-on and copyable
- Practice questions should test understanding, not memorization
- The proof task should be something the learner can actually build or do
- Use code blocks with syntax highlighting where appropriate
- Format for web display (markdown)`;

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

            // Normalize header names
            if (header.includes('what it is')) sections.whatItIs = content;
            else if (header.includes('why it matters')) sections.whyItMatters = content;
            else if (header.includes('key ideas')) sections.keyIdeas = content;
            else if (header.includes('misconception')) sections.misconceptions = content;
            else if (header.includes('example')) sections.workedExample = content;
            else if (header.includes('practice')) sections.practice = content;
            else if (header.includes('proof') || header.includes('task')) sections.proofTask = content;
            else if (header.includes('next')) sections.nextSteps = content;
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
            { key: 'keyIdeas', title: '🎯 Key Ideas', icon: '🎯' },
            { key: 'misconceptions', title: '⚠️ Common Misconceptions', icon: '⚠️' },
            { key: 'workedExample', title: '💻 Worked Example', icon: '💻' },
            { key: 'practice', title: '✏️ Practice Questions', icon: '✏️' },
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
