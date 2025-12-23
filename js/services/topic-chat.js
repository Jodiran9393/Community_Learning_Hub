/**
 * Topic Chat Service - Allows users to ask follow-up questions about topics
 * Uses the configured LLM provider to answer questions in context
 */

class TopicChat {
    constructor() {
        this.isOpen = false;
        this.isGenerating = false;
        this.currentTopic = null;
        this.messages = [];
        this.container = null;
        this.webSearchEnabled = false;
        this.lastSearchResults = null;
        this.attachedFile = null;
    }

    /**
     * Get storage key for current topic
     */
    getStorageKey() {
        const topicId = this.currentTopic?.id || this.currentTopic?.name || 'general';
        return `chat_history_${topicId}`;
    }

    /**
     * Save chat history to localStorage
     */
    saveHistory() {
        try {
            localStorage.setItem(this.getStorageKey(), JSON.stringify(this.messages));
        } catch (e) {
            console.warn('Failed to save chat history:', e);
        }
    }

    /**
     * Load chat history from localStorage
     */
    loadHistory() {
        try {
            const saved = localStorage.getItem(this.getStorageKey());
            if (saved) {
                this.messages = JSON.parse(saved);
                return true;
            }
        } catch (e) {
            console.warn('Failed to load chat history:', e);
        }
        return false;
    }

    /**
     * Clear chat history
     */
    clearHistory() {
        this.messages = [];
        localStorage.removeItem(this.getStorageKey());

        // Reset UI
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = `
                <div class="chat-welcome">
                    <p>👋 Have questions about <strong>${this.currentTopic?.name || 'this topic'}</strong>?</p>
                    <p>Ask anything or try a suggestion:</p>
                    <div class="chat-suggestions">
                        ${this.getInitialSuggestions()}
                    </div>
                </div>
            `;
        }
    }

    /**
     * Restore messages to UI from history
     */
    restoreMessagesUI() {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer || this.messages.length === 0) return;

        // Remove welcome message
        const welcome = messagesContainer.querySelector('.chat-welcome');
        if (welcome) welcome.remove();

        // Add all messages back to UI
        this.messages.forEach(msg => {
            const messageEl = document.createElement('div');
            messageEl.className = `chat-message ${msg.role}`;
            messageEl.innerHTML = msg.role === 'assistant' ? this.formatMessage(msg.content) : msg.content;
            messagesContainer.appendChild(messageEl);
        });

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Initialize chat for a specific topic
     */
    init(topic) {
        this.currentTopic = topic;
        this.messages = [];
        this.createChatUI();

        // Load saved history
        if (this.loadHistory()) {
            this.restoreMessagesUI();
        }
    }

    /**
     * Create the chat UI elements
     */
    createChatUI() {
        // Remove existing chat if any
        const existing = document.getElementById('topic-chat-container');
        if (existing) existing.remove();

        // Create chat container
        this.container = document.createElement('div');
        this.container.id = 'topic-chat-container';
        this.container.innerHTML = `
            <button id="chat-toggle-btn" class="chat-toggle-btn" onclick="window.topicChat.toggle()">
                💬 Ask Questions
            </button>
            
            <div id="chat-panel" class="chat-panel">
                <div class="chat-header">
                    <h3>💬 Ask About ${this.currentTopic?.name || 'This Topic'}</h3>
                    <div class="chat-header-actions">
                        <button class="chat-clear-btn" onclick="window.topicChat.clearHistory()" title="Clear chat history">🗑️</button>
                        <button class="chat-close-btn" onclick="window.topicChat.close()">×</button>
                    </div>
                </div>
                
                <!-- Web Search Toggle -->
                <div class="search-toggle-bar">
                    <label class="search-toggle-label">
                        <input type="checkbox" id="web-search-toggle" onchange="window.topicChat.toggleWebSearch()">
                        <span class="toggle-slider"></span>
                        <span class="toggle-text">🔍 Web Search</span>
                    </label>
                    <span class="toggle-hint" id="search-hint">OFF</span>
                </div>
                
                <div id="chat-messages" class="chat-messages">
                    <div class="chat-welcome">
                        <p>👋 Have questions about <strong>${this.currentTopic?.name || 'this topic'}</strong>?</p>
                        <p>Ask anything or try a suggestion:</p>
                        <div class="chat-suggestions">
                            ${this.getInitialSuggestions()}
                        </div>
                    </div>
                </div>
                
                <div class="chat-input-area">
                    <input type="file" id="chat-file-input" accept="image/*,.pdf,.txt,.md,.js,.css,.html" 
                           style="display: none;" onchange="window.topicChat.handleFileSelect(event)">
                    <button class="upload-btn" onclick="document.getElementById('chat-file-input').click()" title="Attach file">
                        +
                    </button>
                    <div class="input-wrapper">
                        <div id="file-preview" class="file-preview" style="display: none;"></div>
                        <textarea id="chat-input" placeholder="Type your question..." rows="1"
                               onkeydown="if(event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); window.topicChat.sendMessage(); }"
                               oninput="window.topicChat.updateSendButton(); window.topicChat.autoResizeTextarea(this);"
                               onpaste="window.topicChat.handlePaste(event);"></textarea>
                    </div>
                    <button id="chat-send-btn" onclick="window.topicChat.sendMessage()" disabled>
                        Send
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);
        this.addStyles();
    }

    /**
     * Update Send button enabled state
     */
    updateSendButton() {
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send-btn');
        if (input && sendBtn) {
            const hasContent = input.value.trim() || this.attachedFile;
            sendBtn.disabled = !hasContent || this.isGenerating;
        }
    }

    /**
     * Auto-resize textarea as user types
     */
    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    /**
     * Handle file selection
     */
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.attachedFile = file;
        this.attachedImageData = null; // Reset image data

        const preview = document.getElementById('file-preview');
        if (preview) {
            preview.style.display = 'flex';

            // Show image thumbnail or file icon
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    // Store the base64 data for multimodal LLM
                    this.attachedImageData = e.target.result;

                    preview.innerHTML = `
                        <img src="${e.target.result}" alt="Preview">
                        <span class="file-name">${file.name}</span>
                        <button class="remove-file" onclick="window.topicChat.removeAttachment()">×</button>
                    `;
                };
                reader.readAsDataURL(file);
            } else {
                preview.innerHTML = `
                    <span>📄</span>
                    <span class="file-name">${file.name}</span>
                    <button class="remove-file" onclick="window.topicChat.removeAttachment()">×</button>
                `;
            }
        }

        this.updateSendButton();
    }

    /**
     * Remove attached file
     */
    removeAttachment() {
        this.attachedFile = null;
        this.attachedImageData = null; // Clear image data
        const preview = document.getElementById('file-preview');
        const fileInput = document.getElementById('chat-file-input');

        if (preview) {
            preview.style.display = 'none';
            preview.innerHTML = '';
        }
        if (fileInput) {
            fileInput.value = '';
        }
        this.updateSendButton();
    }

    /**
     * Handle paste events (for pasting images from clipboard)
     */
    handlePaste(event) {
        const items = event.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.startsWith('image/')) {
                event.preventDefault();

                const file = item.getAsFile();
                if (file) {
                    // Create a named file from the blob
                    const timestamp = Date.now();
                    const namedFile = new File([file], `pasted-image-${timestamp}.png`, { type: file.type });

                    this.attachedFile = namedFile;
                    this.attachedImageData = null; // Will be set after reading

                    const preview = document.getElementById('file-preview');
                    if (preview) {
                        preview.style.display = 'flex';

                        const reader = new FileReader();
                        reader.onload = (e) => {
                            // Store the base64 data for multimodal LLM
                            this.attachedImageData = e.target.result;

                            preview.innerHTML = `
                                <img src="${e.target.result}" alt="Pasted image">
                                <span class="file-name">${namedFile.name}</span>
                                <button class="remove-file" onclick="window.topicChat.removeAttachment()">×</button>
                            `;
                        };
                        reader.readAsDataURL(namedFile);
                    }

                    this.updateSendButton();
                }
                break; // Only handle first image
            }
        }
    }

    /**
     * Add chat styles to the page
     */
    addStyles() {
        if (document.getElementById('topic-chat-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'topic-chat-styles';
        styles.textContent = `
            .chat-toggle-btn {
                position: fixed;
                bottom: 24px;
                right: 24px;
                padding: 16px 24px;
                background: linear-gradient(90deg, #4c8bf5, #d367c1);
                color: white;
                border: none;
                border-radius: 50px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(76, 139, 245, 0.4);
                transition: all 0.3s;
                z-index: 1000;
            }

            .chat-toggle-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 6px 30px rgba(76, 139, 245, 0.5);
            }

            .chat-toggle-btn.hidden {
                display: none;
            }

            .chat-panel {
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 400px;
                max-width: calc(100vw - 48px);
                height: 500px;
                max-height: calc(100vh - 120px);
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 1px solid rgba(76, 139, 245, 0.3);
                border-radius: 16px;
                display: none;
                flex-direction: column;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                z-index: 1001;
                overflow: hidden;
            }

            .chat-panel.open {
                display: flex;
            }

            .chat-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 20px;
                background: rgba(76, 139, 245, 0.1);
                border-bottom: 1px solid rgba(76, 139, 245, 0.2);
            }

            .chat-header h3 {
                margin: 0;
                font-size: 16px;
                color: white;
            }

            .chat-header-actions {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .chat-clear-btn {
                background: none;
                border: none;
                color: #9495b3;
                font-size: 16px;
                cursor: pointer;
                padding: 4px;
                opacity: 0.7;
                transition: all 0.2s;
            }

            .chat-clear-btn:hover {
                opacity: 1;
                color: #ff6b6b;
            }

            .chat-close-btn {
                background: none;
                border: none;
                color: #9495b3;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }

            .chat-close-btn:hover {
                color: white;
            }

            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .chat-welcome {
                text-align: center;
                color: #9495b3;
                padding: 20px;
            }

            .chat-welcome p {
                margin: 8px 0;
            }

            .chat-message {
                max-width: 85%;
                padding: 12px 16px;
                border-radius: 12px;
                line-height: 1.5;
            }

            .chat-message.user {
                align-self: flex-end;
                background: linear-gradient(90deg, #4c8bf5, #6a9cf5);
                color: white;
            }

            .chat-message.assistant {
                align-self: flex-start;
                background: rgba(255, 255, 255, 0.08);
                color: #e0e0e0;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .chat-message.assistant code {
                background: rgba(0, 0, 0, 0.3);
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 0.9em;
            }

            .code-block-wrapper {
                position: relative;
                margin: 8px 0;
                border-radius: 8px;
                overflow: hidden;
                background: rgba(0, 0, 0, 0.4);
                padding-top: 8px;
            }

            .code-block-wrapper .code-lang {
                position: absolute;
                top: 8px;
                left: 12px;
                font-size: 10px;
                color: #666;
                text-transform: uppercase;
                font-weight: 500;
            }

            .copy-code-btn {
                position: absolute;
                top: 6px;
                right: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                padding: 0;
                background: rgba(60, 60, 80, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                color: #888;
                cursor: pointer;
                transition: all 0.2s;
            }

            .copy-code-btn:hover {
                background: rgba(80, 80, 100, 0.8);
                color: white;
                border-color: rgba(255, 255, 255, 0.2);
            }

            .copy-code-btn.copied {
                background: rgba(74, 222, 128, 0.2);
                border-color: rgba(74, 222, 128, 0.4);
                color: #4ade80;
            }

            .copy-code-btn .copy-icon {
                display: inline;
                font-size: 14px;
            }

            .copy-code-btn .check-icon {
                display: none;
                font-size: 14px;
                color: #4ade80;
            }

            .copy-code-btn.copied .copy-icon {
                display: none;
            }

            .copy-code-btn.copied .check-icon {
                display: inline;
            }

            .chat-message.assistant pre {
                background: transparent;
                padding: 12px;
                margin: 0;
                overflow-x: auto;
            }

            .chat-message.assistant .code-block-wrapper pre code {
                background: none;
                padding: 0;
            }

            .chat-message.assistant pre code {
                background: none;
                padding: 0;
            }

            .chat-message.loading::after {
                content: '...';
                animation: dots 1.5s infinite;
            }

            @keyframes dots {
                0%, 20% { content: '.'; }
                40% { content: '..'; }
                60%, 100% { content: '...'; }
            }

            .chat-input-area {
                display: flex;
                gap: 8px;
                padding: 12px 16px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                background: rgba(0, 0, 0, 0.2);
                align-items: flex-end;
            }

            .upload-btn {
                width: 36px;
                height: 36px;
                min-width: 36px;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 8px;
                color: #9495b3;
                font-size: 20px;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .upload-btn:hover {
                background: rgba(76, 139, 245, 0.2);
                color: #4c8bf5;
                border-color: rgba(76, 139, 245, 0.4);
            }

            .input-wrapper {
                flex: 1;
                display: flex;
                flex-direction: column;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 8px;
                overflow: hidden;
            }

            .chat-input-area textarea {
                width: 100%;
                padding: 10px 12px;
                background: transparent;
                border: none;
                color: white;
                font-size: 14px;
                font-family: inherit;
                resize: none;
                min-height: 36px;
                max-height: 120px;
                line-height: 1.4;
                box-sizing: border-box;
                overflow: hidden;
            }

            .chat-input-area textarea:focus {
                outline: none;
            }

            .input-wrapper:focus-within {
                border-color: #4c8bf5;
            }

            .file-preview {
                padding: 8px 12px;
                background: rgba(76, 139, 245, 0.1);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 12px;
                color: #b8b9d6;
            }

            .file-preview img {
                width: 40px;
                height: 40px;
                object-fit: cover;
                border-radius: 4px;
            }

            .file-preview .file-name {
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .file-preview .remove-file {
                background: none;
                border: none;
                color: #ff6b6b;
                cursor: pointer;
                padding: 4px;
                font-size: 14px;
            }

            .chat-input-area button#chat-send-btn {
                padding: 10px 16px;
                background: #4c8bf5;
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                height: 36px;
            }

            .chat-input-area button#chat-send-btn:hover {
                background: #5a9aff;
            }

            .chat-input-area button#chat-send-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .chat-suggestions {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 12px;
                justify-content: center;
            }

            .chat-suggestion-btn {
                background: rgba(76, 139, 245, 0.15);
                border: 1px solid rgba(76, 139, 245, 0.3);
                color: #4c8bf5;
                padding: 8px 14px;
                border-radius: 20px;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .chat-suggestion-btn:hover {
                background: rgba(76, 139, 245, 0.25);
                transform: translateY(-1px);
            }

            .follow-up-suggestions {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-top: 10px;
            }

            .follow-up-suggestions .chat-suggestion-btn {
                font-size: 12px;
                padding: 6px 12px;
            }

            /* Web Search Toggle */
            .search-toggle-bar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px 16px;
                background: rgba(255, 255, 255, 0.03);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .search-toggle-label {
                display: flex;
                align-items: center;
                gap: 10px;
                cursor: pointer;
            }

            .search-toggle-label input {
                display: none;
            }

            .toggle-slider {
                width: 36px;
                height: 20px;
                background: rgba(255, 255, 255, 0.15);
                border-radius: 10px;
                position: relative;
                transition: all 0.3s;
            }

            .toggle-slider::after {
                content: '';
                position: absolute;
                width: 16px;
                height: 16px;
                background: white;
                border-radius: 50%;
                top: 2px;
                left: 2px;
                transition: all 0.3s;
            }

            .search-toggle-label input:checked + .toggle-slider {
                background: #4c8bf5;
            }

            .search-toggle-label input:checked + .toggle-slider::after {
                left: 18px;
            }

            .toggle-text {
                font-size: 13px;
                color: #9495b3;
            }

            .toggle-hint {
                font-size: 12px;
                color: #666;
                text-transform: uppercase;
            }

            .toggle-hint.on {
                color: #4c8bf5;
            }

            /* Sources Section */
            .sources-section {
                margin-top: 12px;
                padding: 12px;
                background: rgba(76, 139, 245, 0.08);
                border: 1px solid rgba(76, 139, 245, 0.2);
                border-radius: 8px;
            }

            .sources-header {
                font-size: 13px;
                font-weight: 600;
                color: #4c8bf5;
                margin-bottom: 8px;
            }

            .source-item {
                display: flex;
                align-items: flex-start;
                gap: 8px;
                padding: 6px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }

            .source-item:last-child {
                border-bottom: none;
            }

            .source-number {
                color: #4c8bf5;
                font-weight: 600;
                font-size: 12px;
            }

            .source-link {
                display: flex;
                flex-direction: column;
                text-decoration: none;
                flex: 1;
            }

            .source-title {
                color: #e0e0e0;
                font-size: 13px;
                line-height: 1.3;
            }

            .source-url {
                color: #666;
                font-size: 11px;
            }

            .source-link:hover .source-title {
                color: #4c8bf5;
            }

            .search-status {
                color: #4c8bf5;
                font-size: 13px;
                padding: 8px 12px;
                background: rgba(76, 139, 245, 0.1);
                border-radius: 8px;
                margin-bottom: 8px;
            }
        `;

        document.head.appendChild(styles);
    }

    /**
     * Toggle chat panel visibility
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Open chat panel
     */
    open() {
        const panel = document.getElementById('chat-panel');
        const toggleBtn = document.getElementById('chat-toggle-btn');

        if (panel) {
            panel.classList.add('open');
            toggleBtn.classList.add('hidden');
            this.isOpen = true;

            // Focus input
            setTimeout(() => {
                document.getElementById('chat-input')?.focus();
            }, 100);
        }
    }

    /**
     * Close chat panel
     */
    close() {
        const panel = document.getElementById('chat-panel');
        const toggleBtn = document.getElementById('chat-toggle-btn');

        if (panel) {
            panel.classList.remove('open');
            toggleBtn.classList.remove('hidden');
            this.isOpen = false;
        }
    }

    /**
     * Send a message
     */
    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input?.value?.trim();
        const hasAttachment = this.attachedFile !== null;

        if ((!message && !hasAttachment) || this.isGenerating) return;

        // Build message with file info if attached
        let displayMessage = message;
        let promptMessage = message;

        if (hasAttachment) {
            const fileInfo = `[Attached: ${this.attachedFile.name}]`;
            displayMessage = message ? `${message}\n${fileInfo}` : fileInfo;

            // For the prompt, include file type info
            const fileType = this.attachedFile.type || 'unknown';
            promptMessage = message ?
                `${message}\n\n[The user attached a file: ${this.attachedFile.name} (${fileType})]` :
                `[The user attached a file: ${this.attachedFile.name} (${fileType}). Please acknowledge the file and ask how you can help with it.]`;
        }

        // Clear input and reset height
        input.value = '';
        input.style.height = 'auto';

        // Clear attachment
        this.removeAttachment();

        // Add user message to UI
        this.addMessageToUI(displayMessage, 'user');

        // Add to history
        this.messages.push({ role: 'user', content: displayMessage });
        this.saveHistory();

        // Generate response
        await this.generateResponse(promptMessage);
    }

    /**
     * Add a message to the chat UI
     */
    addMessageToUI(content, role) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        // Remove welcome message if exists
        const welcome = messagesContainer.querySelector('.chat-welcome');
        if (welcome) welcome.remove();

        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${role}`;
        messageEl.innerHTML = role === 'assistant' ? this.formatMessage(content) : content;

        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        return messageEl;
    }

    /**
     * Generate a response using the LLM
     */
    async generateResponse(userMessage) {
        this.isGenerating = true;
        this.lastSearchResults = null;
        const sendBtn = document.getElementById('chat-send-btn');
        if (sendBtn) sendBtn.disabled = true;

        // Add loading message
        const loadingEl = this.addMessageToUI('Thinking', 'assistant');
        loadingEl.classList.add('loading');

        let searchContext = '';

        // Perform web search if enabled
        if (this.webSearchEnabled && window.webSearch?.isAvailable()) {
            loadingEl.textContent = 'Searching the web';
            try {
                const searchResult = await window.webSearch.search(userMessage);
                if (searchResult.success) {
                    this.lastSearchResults = searchResult.results;
                    searchContext = searchResult.contextText;
                    loadingEl.textContent = 'Generating answer';
                }
            } catch (e) {
                console.error('Web search failed:', e);
            }
        }

        loadingEl.textContent = 'Thinking';

        try {
            // Build context-aware prompt (with search results if available)
            const prompt = this.buildPrompt(userMessage, searchContext);

            // Build options (include image data if attached)
            const options = {};
            if (this.attachedImageData) {
                options.imageData = this.attachedImageData;
                console.log('📷 Sending image to LLM for analysis');
            }

            // Generate response (passing image data if available)
            const response = await window.llmProviders.generate(prompt, options);

            // Update UI with response
            loadingEl.classList.remove('loading');
            loadingEl.innerHTML = this.formatMessage(response);

            // Add sources if we did a web search
            if (this.lastSearchResults && this.lastSearchResults.length > 0) {
                loadingEl.innerHTML += window.webSearch.renderSourcesHTML(this.lastSearchResults);
            }

            // Add to history
            this.messages.push({ role: 'assistant', content: response });
            this.saveHistory();

            // Add follow-up suggestions
            this.addFollowUpSuggestions();

        } catch (error) {
            loadingEl.classList.remove('loading');
            loadingEl.innerHTML = `❌ Error: ${error.message}<br><small>Check your LLM settings in <a href="/settings.html" style="color: #4c8bf5;">Settings</a></small>`;
        }

        this.isGenerating = false;
        this.updateSendButton();

        // Scroll to bottom
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    /**
     * Build a context-aware prompt
     */
    buildPrompt(userMessage, searchContext = '') {
        const topicContext = this.currentTopic ? `
You are a helpful tutor answering questions about "${this.currentTopic.name}".
Topic description: ${this.currentTopic.description || 'No description'}
Category: ${this.currentTopic.category || 'general'}
Prerequisites: ${this.currentTopic.prerequisites?.join(', ') || 'None'}
` : 'You are a helpful tutor answering questions about web development and programming.';

        // Include recent conversation history
        const history = this.messages.slice(-6).map(m =>
            `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`
        ).join('\n');

        // Include web search results if available
        const searchSection = searchContext ? `
${searchContext}
` : '';

        return `${topicContext}

Be concise but helpful. Use examples when useful. Format with markdown for code.
${searchSection}
${history ? `Recent conversation:\n${history}\n` : ''}
Student: ${userMessage}

Tutor:`;
    }

    /**
     * Toggle web search on/off
     */
    toggleWebSearch() {
        const checkbox = document.getElementById('web-search-toggle');
        const hint = document.getElementById('search-hint');

        this.webSearchEnabled = checkbox?.checked || false;

        if (hint) {
            hint.textContent = this.webSearchEnabled ? 'ON' : 'OFF';
            hint.classList.toggle('on', this.webSearchEnabled);
        }

        // Warn if no API key
        if (this.webSearchEnabled && !window.webSearch?.isAvailable()) {
            const messagesContainer = document.getElementById('chat-messages');
            if (messagesContainer) {
                const warning = document.createElement('div');
                warning.className = 'chat-message assistant';
                warning.innerHTML = '⚠️ Web search requires a Tavily API key. <a href="/settings.html" style="color: #4c8bf5;">Configure in Settings</a>';
                messagesContainer.appendChild(warning);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }
    }

    /**
     * Format message content (improved markdown)
     */
    formatMessage(content) {
        let codeBlockId = 0;

        let html = content
            // Escape HTML first
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            // Code blocks (restore angle brackets inside, add copy button at top right)
            .replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
                const cleanCode = code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
                const blockId = `chat-code-${Date.now()}-${codeBlockId++}`;
                const langLabel = lang ? `<span class="code-lang">${lang}</span>` : '';
                return `<div class="code-block-wrapper">
                    ${langLabel}
                    <button class="copy-code-btn" onclick="window.topicChat.copyCode('${blockId}')" title="Copy">
                        <span class="copy-icon">📋</span>
                        <span class="check-icon">✓</span>
                    </button>
                    <pre id="${blockId}"><code>${cleanCode}</code></pre>
                </div>`;
            })
            // Inline code
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // Bold
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            // Headers (## and ###) - must come before line breaks
            .replace(/^### (.+)$/gm, '<h4>$1</h4>')
            .replace(/^## (.+)$/gm, '<h3>$1</h3>')
            .replace(/^# (.+)$/gm, '<h3>$1</h3>')
            // Horizontal rule
            .replace(/^---+$/gm, '<hr>')
            // Numbered lists
            .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
            // Bullet lists
            .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
            // Wrap consecutive <li> in <ol> or <ul>
            .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
            // Line breaks (but not after block elements)
            .replace(/\n(?!<\/?(?:pre|ul|ol|li|h[1-6]|hr|div))/g, '<br>');

        return html;
    }

    /**
     * Copy code block content to clipboard
     */
    copyCode(blockId) {
        const codeBlock = document.getElementById(blockId);
        if (!codeBlock) return;

        const code = codeBlock.textContent;
        navigator.clipboard.writeText(code).then(() => {
            const btn = codeBlock.parentElement.querySelector('.copy-code-btn');
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
     * Get initial suggestions based on topic
     */
    getInitialSuggestions() {
        const topicName = this.currentTopic?.name || 'this topic';
        const suggestions = [
            `What is ${topicName}?`,
            `Why is this important?`,
            `Show me an example`
        ];
        return suggestions.map(s =>
            `<button class="chat-suggestion-btn" onclick="window.topicChat.askQuestion('${s.replace(/'/g, "\\'")}')">💡 ${s}</button>`
        ).join('');
    }

    /**
     * Add follow-up suggestions after a response
     */
    addFollowUpSuggestions() {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        const topicName = this.currentTopic?.name || 'this topic';
        const suggestions = this.generateFollowUpSuggestions();

        const suggestionsEl = document.createElement('div');
        suggestionsEl.className = 'follow-up-suggestions';
        suggestionsEl.innerHTML = suggestions.map(s =>
            `<button class="chat-suggestion-btn" onclick="window.topicChat.askQuestion('${s.replace(/'/g, "\\'")}')">💡 ${s}</button>`
        ).join('');

        messagesContainer.appendChild(suggestionsEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Generate context-aware follow-up suggestions
     */
    generateFollowUpSuggestions() {
        const topicName = this.currentTopic?.name || 'this';
        const messageCount = this.messages.length;

        // Different suggestions based on conversation stage
        if (messageCount <= 2) {
            return [
                'Can you explain more?',
                'Give me a practical example'
            ];
        } else if (messageCount <= 4) {
            return [
                'What are common mistakes?',
                'How do I practice this?'
            ];
        } else {
            return [
                'What should I learn next?',
                'Summarize key points'
            ];
        }
    }

    /**
     * Ask a question from suggestion button
     */
    askQuestion(question) {
        const input = document.getElementById('chat-input');
        if (input) {
            input.value = question;
            this.sendMessage();
        }
    }
}

// Create singleton instance
window.topicChat = new TopicChat();
