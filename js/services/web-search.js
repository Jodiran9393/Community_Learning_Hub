/**
 * Web Search Service - Uses Tavily API for web search with AI-optimized results
 * Provides sources for LLM to cite in responses
 */

class WebSearchService {
    constructor() {
        this.apiEndpoint = 'https://api.tavily.com/search';
    }

    /**
     * Get Tavily API key from settings
     */
    getApiKey() {
        try {
            const keys = JSON.parse(localStorage.getItem('llm_api_keys') || '{}');
            return keys.tavily || '';
        } catch {
            return '';
        }
    }

    /**
     * Set Tavily API key
     */
    setApiKey(key) {
        try {
            const keys = JSON.parse(localStorage.getItem('llm_api_keys') || '{}');
            keys.tavily = key;
            localStorage.setItem('llm_api_keys', JSON.stringify(keys));
        } catch (e) {
            console.error('Failed to save Tavily API key:', e);
        }
    }

    /**
     * Check if web search is available
     */
    isAvailable() {
        return !!this.getApiKey();
    }

    /**
     * Search the web using Tavily API
     * @param {string} query - The search query
     * @param {object} options - Search options
     * @returns {object} - { success, results, contextText, error }
     */
    async search(query, options = {}) {
        const apiKey = this.getApiKey();

        if (!apiKey) {
            return {
                success: false,
                error: 'Tavily API key not configured. Add it in Settings.',
                results: [],
                contextText: ''
            };
        }

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    api_key: apiKey,
                    query: query,
                    search_depth: options.depth || 'basic', // 'basic' or 'advanced'
                    include_answer: false,
                    include_raw_content: false,
                    max_results: options.maxResults || 5,
                    include_domains: options.includeDomains || [],
                    exclude_domains: options.excludeDomains || []
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `API error: ${response.status}`);
            }

            const data = await response.json();
            const results = data.results || [];

            // Format results for display and LLM context
            const formattedResults = results.map((r, i) => ({
                index: i + 1,
                title: r.title,
                url: r.url,
                snippet: r.content,
                score: r.score
            }));

            // Create context text for LLM prompt
            const contextText = this.formatForLLM(formattedResults);

            return {
                success: true,
                results: formattedResults,
                contextText: contextText,
                query: query
            };

        } catch (error) {
            console.error('Web search error:', error);
            return {
                success: false,
                error: error.message,
                results: [],
                contextText: ''
            };
        }
    }

    /**
     * Format search results for LLM context
     */
    formatForLLM(results) {
        if (!results.length) return '';

        const lines = results.map(r =>
            `[${r.index}] ${r.title}\nURL: ${r.url}\nContent: ${r.snippet}\n`
        );

        return `\n---\nWEB SEARCH RESULTS:\n${lines.join('\n')}\n---\n\nUse the above sources to answer. Cite sources using [1], [2], etc.`;
    }

    /**
     * Render sources section as HTML
     */
    renderSourcesHTML(results) {
        if (!results || !results.length) return '';

        const sourcesList = results.map(r =>
            `<div class="source-item">
                <span class="source-number">[${r.index}]</span>
                <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="source-link">
                    <span class="source-title">${r.title}</span>
                    <span class="source-url">${new URL(r.url).hostname}</span>
                </a>
            </div>`
        ).join('');

        return `
            <div class="sources-section">
                <div class="sources-header">📚 Sources</div>
                ${sourcesList}
            </div>
        `;
    }

    /**
     * Test connection to Tavily API
     */
    async testConnection() {
        const result = await this.search('test query');
        if (result.success) {
            return { success: true, message: 'Connected to Tavily API' };
        } else {
            return { success: false, message: result.error };
        }
    }
}

// Create singleton instance
window.webSearch = new WebSearchService();
