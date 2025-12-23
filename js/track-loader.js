/**
 * Track Loader - Client-side JSON curriculum loader
 * Loads all 3 tracks from AI Builder folder, caches in localStorage
 * JSON is source of truth, database only stores user progress
 */

class TrackLoader {
    constructor() {
        this.tracks = null;
        this.cacheKey = 'clh_tracks_cache';
        this.cacheVersion = 'v1.1'; // Increment when JSON structure changes
    }

    /**
     * Load all 3 tracks (Frontend, AI, Data)
     * Uses cache if available and valid
     */
    async loadAllTracks() {
        console.log('📚 Loading curriculum tracks...');

        // Try cache first
        const cached = this.getCachedTracks();
        if (cached) {
            console.log('✅ Loaded tracks from cache');
            this.tracks = cached;
            return cached;
        }

        // Load from JSON files
        try {
            const [frontend, ai, data] = await Promise.all([
                fetch('/AI%20Builder/track_frontend_web_dev.json').then(r => r.json()),
                fetch('/AI%20Builder/track_ai_llms_builder_agents.json').then(r => r.json()),
                fetch('/AI%20Builder/track_data_analytics.json').then(r => r.json())
            ]);

            this.tracks = { frontend, ai, data };

            // Cache for performance
            this.setCachedTracks(this.tracks);

            console.log('✅ Loaded tracks from JSON:', {
                frontend: frontend.topics.length + ' topics',
                ai: ai.topics.length + ' topics',
                data: data.topics.length + ' topics'
            });

            return this.tracks;
        } catch (error) {
            console.error('❌ Failed to load tracks:', error);
            throw new Error('Could not load curriculum. Please refresh the page.');
        }
    }

    /**
     * Get a specific track by ID
     * @param {string} trackId - 'Frontend_Web_Dev', 'AI_LLMs_Builder_Agents', or 'Data_Analytics'
     */
    async getTrack(trackId) {
        if (!this.tracks) {
            await this.loadAllTracks();
        }

        const trackMap = {
            'Frontend_Web_Dev': this.tracks.frontend,
            'AI_LLMs_Builder_Agents': this.tracks.ai,
            'Data_Analytics': this.tracks.data
        };

        return trackMap[trackId];
    }

    /**
     * Get all outcomes for a track
     */
    async getOutcomes(trackId) {
        const track = await this.getTrack(trackId);
        return track.outcomes;
    }

    /**
     * Get diagnostic configuration for a track
     */
    async getDiagnostic(trackId) {
        const track = await this.getTrack(trackId);
        return track.diagnostic;
    }

    /**
     * Find a topic by ID across all tracks
     */
    async findTopic(topicId) {
        if (!this.tracks) {
            await this.loadAllTracks();
        }

        const allTracks = [this.tracks.frontend, this.tracks.ai, this.tracks.data];

        for (const track of allTracks) {
            const topic = track.topics.find(t => t.id === topicId);
            if (topic) {
                return { ...topic, track_id: track.track_id };
            }
        }

        return null;
    }

    /**
     * Get topic prerequisites (recursive dependencies)
     */
    async getPrerequisiteChain(topicId) {
        const topic = await this.findTopic(topicId);
        if (!topic || !topic.prerequisites || topic.prerequisites.length === 0) {
            return [];
        }

        const chain = [...topic.prerequisites];

        // Recursively get prerequisites of prerequisites
        for (const prereqId of topic.prerequisites) {
            const subChain = await this.getPrerequisiteChain(prereqId);
            chain.push(...subChain);
        }

        // Remove duplicates and return
        return [...new Set(chain)];
    }

    // ========== CACHING ==========

    getCachedTracks() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (!cached) return null;

            const { version, timestamp, data } = JSON.parse(cached);

            // Cache expires after 7 days
            const cacheAge = Date.now() - timestamp;
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

            if (version !== this.cacheVersion || cacheAge > maxAge) {
                localStorage.removeItem(this.cacheKey);
                return null;
            }

            return data;
        } catch (error) {
            console.warn('Cache read error:', error);
            return null;
        }
    }

    setCachedTracks(tracks) {
        try {
            const cacheData = {
                version: this.cacheVersion,
                timestamp: Date.now(),
                data: tracks
            };
            localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Cache write error (localStorage full?):', error);
        }
    }

    clearCache() {
        localStorage.removeItem(this.cacheKey);
        console.log('🗑️ Track cache cleared');
    }
}

// Global instance
window.trackLoader = new TrackLoader();
