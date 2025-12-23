/**
 * LLM Configuration - Provider settings and preferences
 * Supports local LLMs (Ollama), OpenAI, and other providers
 */

const LLM_CONFIG = {
    // Default provider to use (can be overridden in settings)
    defaultProvider: 'ollama',

    // Provider configurations
    providers: {
        ollama: {
            name: 'Ollama (Local)',
            endpoint: 'http://localhost:11434/api/generate',
            model: 'llama3.2',
            description: 'Run LLMs locally - free, private, requires Ollama installation',
            options: {
                temperature: 0.7,
                top_p: 0.9
            }
        },
        openai: {
            name: 'OpenAI',
            endpoint: 'https://api.openai.com/v1/chat/completions',
            model: 'gpt-4o-mini',
            description: 'OpenAI API - easy setup, requires API key, costs per token',
            options: {
                temperature: 0.7,
                max_tokens: 2000
            }
        },
        anthropic: {
            name: 'Anthropic (Claude)',
            endpoint: 'https://api.anthropic.com/v1/messages',
            model: 'claude-3-haiku-20240307',
            description: 'Claude API - requires API key',
            options: {
                temperature: 0.7,
                max_tokens: 2000
            }
        },
        custom: {
            name: 'Custom Endpoint',
            endpoint: '',
            model: '',
            description: 'Configure your own OpenAI-compatible endpoint',
            options: {}
        }
    },

    // Get saved settings from localStorage
    getSettings() {
        try {
            const saved = localStorage.getItem('clh_llm_settings');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.warn('Could not load LLM settings:', e);
            return {};
        }
    },

    // Save settings to localStorage
    saveSettings(settings) {
        try {
            localStorage.setItem('clh_llm_settings', JSON.stringify(settings));
        } catch (e) {
            console.warn('Could not save LLM settings:', e);
        }
    },

    // Get the active provider configuration
    getActiveProvider() {
        const settings = this.getSettings();
        const providerId = settings.provider || this.defaultProvider;
        const providerConfig = { ...this.providers[providerId] };

        // Override with user settings
        if (settings.endpoint) providerConfig.endpoint = settings.endpoint;
        if (settings.model) providerConfig.model = settings.model;
        if (settings.apiKey) providerConfig.apiKey = settings.apiKey;

        providerConfig.id = providerId;
        return providerConfig;
    },

    // Get API key for a provider (from localStorage)
    getApiKey(providerId) {
        const settings = this.getSettings();
        return settings.apiKeys?.[providerId] || '';
    },

    // Set API key for a provider
    setApiKey(providerId, key) {
        const settings = this.getSettings();
        if (!settings.apiKeys) settings.apiKeys = {};
        settings.apiKeys[providerId] = key;
        this.saveSettings(settings);
    }
};

// Make available globally
window.LLM_CONFIG = LLM_CONFIG;
