/**
 * Storage Engine - Handle localStorage with fallback and safety
 */

class StorageManager {
    constructor() {
        this.prefix = 'kidsgame_';
        this.enabled = this.checkAvailability();
    }

    /**
     * Check if localStorage is available
     */
    checkAvailability() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            console.warn('[Storage] localStorage not available:', e);
            return false;
        }
    }

    /**
     * Get item with prefix
     */
    get(key, defaultValue = null) {
        if (!this.enabled) return defaultValue;

        try {
            const fullKey = this.prefix + key;
            const item = localStorage.getItem(fullKey);
            if (item === null) return defaultValue;

            try {
                return JSON.parse(item);
            } catch {
                return item;
            }
        } catch (e) {
            console.error('[Storage] Get error:', e);
            return defaultValue;
        }
    }

    /**
     * Set item with prefix
     */
    set(key, value) {
        if (!this.enabled) return false;

        try {
            const fullKey = this.prefix + key;
            const serialized = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(fullKey, serialized);
            return true;
        } catch (e) {
            console.error('[Storage] Set error:', e);
            return false;
        }
    }

    /**
     * Remove item
     */
    remove(key) {
        if (!this.enabled) return false;

        try {
            const fullKey = this.prefix + key;
            localStorage.removeItem(fullKey);
            return true;
        } catch (e) {
            console.error('[Storage] Remove error:', e);
            return false;
        }
    }

    /**
     * Clear all app data
     */
    clear() {
        if (!this.enabled) return false;

        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (e) {
            console.error('[Storage] Clear error:', e);
            return false;
        }
    }

    /**
     * Get game progress
     */
    getProgress(gameId) {
        const progress = this.get('progress', {});
        return progress[gameId] || { stars: 0, highScore: 0, level: 1, completed: false };
    }

    /**
     * Save game progress
     */
    saveProgress(gameId, data) {
        const progress = this.get('progress', {});
        progress[gameId] = {
            ...progress[gameId],
            ...data,
            lastPlayed: Date.now()
        };
        this.set('progress', progress);
    }

    /**
     * Get total stars earned
     */
    getTotalStars() {
        const progress = this.get('progress', {});
        return Object.values(progress).reduce((sum, p) => sum + (p.stars || 0), 0);
    }

    /**
     * Get settings
     */
    getSettings() {
        return this.get('settings', {
            soundEnabled: true,
            musicEnabled: true,
            vibrationEnabled: true
        });
    }

    /**
     * Save settings
     */
    saveSettings(settings) {
        const current = this.getSettings();
        this.set('settings', { ...current, ...settings });
    }

    /**
     * Check if first launch
     */
    isFirstLaunch() {
        return this.get('launched', true);
    }

    /**
     * Mark as launched
     */
    markLaunched() {
        this.set('launched', false);
    }
}

// Export singleton instance
const Storage = new StorageManager();