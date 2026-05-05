/**
 * Game Registry - Global registry for all games
 * Provides a centralized way to access game classes
 */

const GameRegistry = {
    games: {},

    /**
     * Register a game class
     */
    register(gameId, GameClass) {
        this.games[gameId] = GameClass;
        // Also register on window for direct access
        if (typeof window !== 'undefined') {
            window[gameId] = GameClass;
        }
    },

    /**
     * Get a game class by ID
     */
    get(gameId) {
        return this.games[gameId] || null;
    },

    /**
     * Get all registered games
     */
    getAll() {
        return Object.keys(this.games).map(id => ({
            id,
            name: this.games[id].name || id,
            icon: this.games[id].icon || '🎮'
        }));
    },

    /**
     * Check if a game is registered
     */
    has(gameId) {
        return gameId in this.games;
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameRegistry;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.GameRegistry = GameRegistry;
}
