/**
 * Shared Constants - Game configuration and constants
 */

const Constants = {
    // Game settings
    GAME: {
        DEFAULT_WIDTH: 400,
        DEFAULT_HEIGHT: 600,
        TARGET_FPS: 60,
        DEFAULT_LANGUAGE: 'zh-TW'
    },

    // Physics
    PHYSICS: {
        GRAVITY: 0.5,
        FRICTION: 0.98,
        BOUNCE: 0.6,
        MAX_VELOCITY: 15
    },

    // Audio
    AUDIO: {
        SUCCESS: 'success',
        ERROR: 'error',
        CLICK: 'click',
        STAR: 'star',
        LEVEL_UP: 'levelUp',
        GAME_OVER: 'gameOver',
        BUTTON_CLICK: 'buttonClick'
    },

    // Storage keys (Storage class adds 'kidsgame_' prefix automatically)
    STORAGE: {
        PROGRESS: 'progress',
        SETTINGS: 'settings',
        STARS: 'stars',
        PARENT_PIN: 'parent_pin'
    },

    // Game difficulty levels
    DIFFICULTY: {
        EASY: 'easy',
        MEDIUM: 'medium',
        HARD: 'hard'
    },

    // Star rating thresholds
    STARS: {
        ONE: 1,
        TWO: 2,
        THREE: 3
    },

    // Animation durations (ms)
    ANIMATION: {
        FAST: 150,
        NORMAL: 300,
        SLOW: 500
    },

    // Touch controls
    CONTROLS: {
        LEFT: 'left',
        RIGHT: 'right',
        JUMP: 'jump',
        ACTION: 'action'
    },

    // Color palette
    COLORS: {
        PRIMARY: '#4FC3F7',
        PRIMARY_DARK: '#0288D1',
        SECONDARY: '#FFB74D',
        ACCENT: '#81C784',
        ERROR: '#EF5350',
        SUCCESS: '#66BB6A',
        WARNING: '#FFA726'
    },

    // Game types
    GAMES: {
        BUBBLE_POP: 'bubble-pop',
        STAR_CATCHER: 'star-catcher',
        SHAPE_SLICER: 'shape-slicer',
        BLOCK_KINGDOM: 'block-kingdom',
        MAGIC_PAINTER: 'magic-painter',
        MUSIC_BAND: 'music-band',
        RAINBOW_BRIDGE: 'rainbow-bridge',
        BEAR_JOURNEY: 'bear-journey',
        GARDEN_PARTY: 'garden-party',
        ASTRONAUT: 'astronaut'
    },

    // Parent mode
    PARENT: {
        PIN_LENGTH: 4,
        MAX_ATTEMPTS: 3,
        LOCKOUT_TIME: 30000 // 30 seconds
    }
};

// Freeze to prevent modification
Object.freeze(Constants.GAME);
Object.freeze(Constants.PHYSICS);
Object.freeze(Constants.AUDIO);
Object.freeze(Constants.STORAGE);
Object.freeze(Constants.DIFFICULTY);
Object.freeze(Constants.STARS);
Object.freeze(Constants.ANIMATION);
Object.freeze(Constants.CONTROLS);
Object.freeze(Constants.COLORS);
Object.freeze(Constants.GAMES);
Object.freeze(Constants.PARENT);
Object.freeze(Constants);