/**
 * LLM Configuration - Provider settings and preferences
 * Supports separate configurations for:
 * - Content Generation (smarter models for comprehensive learning content)
 * - Chat (faster/cheaper models for quick Q&A)
 */

const LLM_CONFIG = {
    // Default providers for each purpose
    defaultProvider: 'ollama',
    defaultContentProvider: 'openai',      // Smarter model for content
    defaultChatProvider: 'openai',          // Cheaper model for chat

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

    // Recommended models for each purpose
    recommendedModels: {
        content: {
            openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-4o-mini'],
            anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
            ollama: ['llama3.2', 'mistral', 'mixtral']
        },
        chat: {
            openai: ['gpt-4o-mini', 'gpt-3.5-turbo'],
            anthropic: ['claude-3-haiku-20240307', 'claude-3-5-sonnet-20241022'],
            ollama: ['llama3.2', 'phi3', 'gemma2']
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

    // Get the active provider configuration (legacy - uses general settings)
    getActiveProvider() {
        return this.getProviderFor('general');
    },

    // Get provider configuration for a specific purpose
    getProviderFor(purpose = 'general') {
        const settings = this.getSettings();

        // Determine which settings to use based on purpose
        let providerId, model, endpoint;

        // Only use purpose-specific settings if dual mode is enabled
        const dualModeEnabled = settings.dualModeEnabled === true;

        if (dualModeEnabled && purpose === 'content' && settings.contentProvider) {
            providerId = settings.contentProvider;
            model = settings.contentModel;
            endpoint = settings.contentEndpoint;
        } else if (dualModeEnabled && purpose === 'chat' && settings.chatProvider) {
            providerId = settings.chatProvider;
            model = settings.chatModel;
            endpoint = settings.chatEndpoint;
        } else {
            // Fall back to general settings
            providerId = settings.provider || this.defaultProvider;
            model = settings.model;
            endpoint = settings.endpoint;
        }

        const providerConfig = { ...this.providers[providerId] };

        // Override with user settings
        if (endpoint) providerConfig.endpoint = endpoint;
        if (model) providerConfig.model = model;

        // Get API key
        const apiKey = this.getApiKey(providerId);
        if (apiKey) providerConfig.apiKey = apiKey;

        providerConfig.id = providerId;
        providerConfig.purpose = purpose;
        return providerConfig;
    },

    // Check if dual-mode is enabled (separate configs for content vs chat)
    isDualModeEnabled() {
        const settings = this.getSettings();
        return settings.dualModeEnabled === true;
    },

    // Enable or disable dual-mode
    setDualMode(enabled) {
        const settings = this.getSettings();
        settings.dualModeEnabled = enabled;
        this.saveSettings(settings);
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
