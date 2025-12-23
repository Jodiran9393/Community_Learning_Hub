/**
 * LLM Providers - Abstraction layer for different LLM APIs
 * Supports Ollama (local), OpenAI, Anthropic, and custom endpoints
 */

class LLMProviders {
    constructor() {
        this.config = window.LLM_CONFIG;
    }

    /**
     * Generate content using the active provider
     * @param {string} prompt - The prompt to send
     * @param {object} options - Optional overrides (can include imageData for multimodal)
     * @returns {Promise<string>} Generated content
     */
    async generate(prompt, options = {}) {
        const provider = this.config.getActiveProvider();
        const hasImage = !!options.imageData;
        console.log(`🤖 Using LLM provider: ${provider.name} (${provider.model})${hasImage ? ' [with image]' : ''}`);

        switch (provider.id) {
            case 'ollama':
                return this.generateOllama(prompt, provider, options);
            case 'openai':
                return this.generateOpenAI(prompt, provider, options);
            case 'anthropic':
                return this.generateAnthropic(prompt, provider, options);
            case 'custom':
                return this.generateOpenAI(prompt, provider, options); // Assume OpenAI-compatible
            default:
                throw new Error(`Unknown provider: ${provider.id}`);
        }
    }

    /**
     * Generate using Ollama (local LLM)
     * Supports multimodal with vision models (llava, etc.)
     */
    async generateOllama(prompt, provider, options) {
        try {
            // Build request body
            const requestBody = {
                model: options.model || provider.model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: options.temperature || provider.options?.temperature || 0.7,
                    top_p: options.top_p || provider.options?.top_p || 0.9
                }
            };

            // Add image for multimodal (Ollama uses base64 without the data URI prefix)
            if (options.imageData) {
                // Extract just the base64 part (remove "data:image/png;base64," prefix)
                const base64Only = options.imageData.replace(/^data:image\/\w+;base64,/, '');
                requestBody.images = [base64Only];

                // Auto-switch to vision model if current model isn't vision-capable
                const visionModels = ['llava', 'llava-llama3', 'bakllava', 'llava:13b', 'llava:7b'];
                const currentModel = requestBody.model.toLowerCase();
                if (!visionModels.some(m => currentModel.includes(m))) {
                    console.warn(`⚠️ Model ${requestBody.model} may not support vision. Consider using 'llava'.`);
                }
            }

            const response = await fetch(provider.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ollama error (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            return data.response;

        } catch (error) {
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Cannot connect to Ollama. Make sure Ollama is running on localhost:11434');
            }
            throw error;
        }
    }

    /**
     * Generate using OpenAI API
     * Supports multimodal with vision models (gpt-4o, gpt-4-turbo, gpt-4-vision-preview)
     */
    async generateOpenAI(prompt, provider, options) {
        const apiKey = options.apiKey || provider.apiKey || this.config.getApiKey('openai');

        if (!apiKey) {
            throw new Error('OpenAI API key not configured. Please set your API key in settings.');
        }

        // Build user message content
        let userContent;
        if (options.imageData) {
            // Multimodal format for vision
            userContent = [
                { type: 'text', text: prompt },
                {
                    type: 'image_url',
                    image_url: {
                        url: options.imageData,
                        detail: 'auto' // or 'low' for faster/cheaper
                    }
                }
            ];
        } else {
            // Text-only format
            userContent = prompt;
        }

        const response = await fetch(provider.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: options.model || provider.model,
                messages: [
                    { role: 'system', content: 'You are an expert educator creating learning content. Be clear, practical, and engaging.' },
                    { role: 'user', content: userContent }
                ],
                temperature: options.temperature || provider.options?.temperature || 0.7,
                max_tokens: options.max_tokens || provider.options?.max_tokens || 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenAI error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    /**
     * Generate using Anthropic (Claude) API
     * Supports multimodal with all Claude 3 models
     */
    async generateAnthropic(prompt, provider, options) {
        const apiKey = options.apiKey || provider.apiKey || this.config.getApiKey('anthropic');

        if (!apiKey) {
            throw new Error('Anthropic API key not configured. Please set your API key in settings.');
        }

        // Build user message content
        let userContent;
        if (options.imageData) {
            // Multimodal format for Claude
            // Extract media type and base64 data
            const matches = options.imageData.match(/^data:(image\/\w+);base64,(.+)$/);
            if (matches) {
                const [, mediaType, base64Data] = matches;
                userContent = [
                    {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: mediaType,
                            data: base64Data
                        }
                    },
                    { type: 'text', text: prompt }
                ];
            } else {
                userContent = prompt;
            }
        } else {
            userContent = prompt;
        }

        const response = await fetch(provider.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: options.model || provider.model,
                max_tokens: options.max_tokens || provider.options?.max_tokens || 2000,
                messages: [
                    { role: 'user', content: userContent }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Anthropic error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.content[0].text;
    }

    /**
     * Test connection to the active provider
     */
    async testConnection() {
        try {
            const result = await this.generate('Say "Connection successful!" in exactly those words.');
            return { success: true, message: result };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Check if Ollama is available locally
     */
    async checkOllamaAvailable() {
        try {
            const response = await fetch('http://localhost:11434/api/tags', {
                method: 'GET'
            });
            if (response.ok) {
                const data = await response.json();
                return { available: true, models: data.models || [] };
            }
            return { available: false, models: [] };
        } catch {
            return { available: false, models: [] };
        }
    }
}

// Create singleton instance
window.llmProviders = new LLMProviders();
