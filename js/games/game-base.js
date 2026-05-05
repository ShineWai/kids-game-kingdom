/**
 * Game Base Class - Foundation for all games
 */

class GameBase {
    constructor(gameId, options = {}) {
        this.gameId = gameId;
        this.canvas = null;
        this.renderer = null;
        this.physics = new Physics();
        this.state = 'idle'; // idle, loading, playing, paused, gameOver
        this.score = 0;
        this.stars = 0;
        this.highScore = 0;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.isPaused = false;
        this.animationId = null;
        this.lastFrameTime = 0;

        // Settings
        this.width = options.width || Constants.GAME.DEFAULT_WIDTH;
        this.height = options.height || Constants.GAME.DEFAULT_HEIGHT;
        this.targetFPS = options.targetFPS || Constants.GAME.TARGET_FPS;
        this.frameInterval = 1000 / this.targetFPS;

        // Callbacks
        this.onScoreChange = options.onScoreChange || null;
        this.onGameOver = options.onGameOver || null;
        this.onStarEarned = options.onStarEarned || null;
        this.onPause = options.onPause || null;
        this.onResume = options.onResume || null;

        // Load saved progress
        this.loadProgress();
    }

    /**
     * Initialize the game
     */
    init(container) {
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        container.appendChild(this.canvas);

        // Create renderer
        this.renderer = new Renderer(this.canvas);
        this.renderer.resize(this.width, this.height);

        // Initialize game-specific elements
        this.initElements();

        // Start game loop
        this.startGameLoop();

        console.log(`[Game] ${this.gameId} initialized`);
    }

    /**
     * Override in subclass to initialize game elements
     */
    initElements() {
        // To be implemented by subclass
    }

    /**
     * Main game loop
     */
    startGameLoop() {
        const loop = (timestamp) => {
            if (this.state !== 'playing' || this.isPaused) {
                this.animationId = requestAnimationFrame(loop);
                return;
            }

            const deltaTime = timestamp - this.lastFrameTime;

            if (deltaTime >= this.frameInterval) {
                this.lastFrameTime = timestamp - (deltaTime % this.frameInterval);
                this.update(deltaTime / 1000);
                this.render();
            }

            this.animationId = requestAnimationFrame(loop);
        };

        this.animationId = requestAnimationFrame(loop);
    }

    /**
     * Update game state
     */
    update(deltaTime) {
        this.elapsedTime = (Date.now() - this.startTime) / 1000;
    }

    /**
     * Render game
     */
    render() {
        this.renderer.clear();
    }

    /**
     * Start the game
     */
    start() {
        if (this.state === 'playing') return;

        this.state = 'playing';
        this.startTime = Date.now();
        this.score = 0;
        this.stars = 0;
        this.elapsedTime = 0;
        this.isPaused = false;
        this.lastFrameTime = performance.now();

        this.onStart?.();
        console.log(`[Game] ${this.gameId} started`);
    }

    /**
     * Pause the game
     */
    pause() {
        if (this.state !== 'playing') return;

        this.isPaused = true;
        this.state = 'paused';
        this.pauseTime = Date.now();

        if (this.onPause) this.onPause();
        console.log(`[Game] ${this.gameId} paused`);
    }

    /**
     * Resume the game
     */
    resume() {
        if (this.state !== 'paused') return;

        // Adjust start time to account for pause duration
        const pauseDuration = Date.now() - this.pauseTime;
        this.startTime += pauseDuration;

        this.isPaused = false;
        this.state = 'playing';
        this.lastFrameTime = performance.now();

        if (this.onResume) this.onResume();
        console.log(`[Game] ${this.gameId} resumed`);
    }

    /**
     * End the game
     */
    end() {
        this.state = 'gameOver';
        this.gameOverTime = Date.now();

        // Calculate final stars
        this.calculateStars();

        // Save progress
        this.saveProgress();

        if (this.onGameOver) this.onGameOver(this.getResult());
        console.log(`[Game] ${this.gameId} ended with score: ${this.score}`);
    }

    /**
     * Calculate stars earned
     */
    calculateStars() {
        // Override in subclass
        this.stars = Utils.calculateStars(this.score, {
            one: 10,
            two: 20,
            three: 30
        });
    }

    /**
     * Get game result
     */
    getResult() {
        return {
            gameId: this.gameId,
            score: this.score,
            stars: this.stars,
            highScore: this.highScore,
            elapsedTime: this.elapsedTime,
            isNewHighScore: this.score > this.highScore
        };
    }

    /**
     * Add score
     */
    addScore(points) {
        this.score += points;
        if (this.score > this.highScore) {
            this.highScore = this.score;
        }
        if (this.onScoreChange) this.onScoreChange(this.score);
    }

    /**
     * Load saved progress
     */
    loadProgress() {
        const progress = Storage.getProgress(this.gameId);
        this.highScore = progress.highScore || 0;
    }

    /**
     * Save progress
     */
    saveProgress() {
        Storage.saveProgress(this.gameId, {
            score: this.score,
            stars: this.stars,
            highScore: this.highScore,
            completed: this.stars > 0
        });
    }

    /**
     * Reset game
     */
    reset() {
        this.state = 'idle';
        this.score = 0;
        this.stars = 0;
        this.elapsedTime = 0;
        this.isPaused = false;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        this.initElements();
    }

    /**
     * Clean up
     */
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }

        this.state = 'idle';
        console.log(`[Game] ${this.gameId} destroyed`);
    }

    /**
     * Handle touch start
     */
    onTouchStart(x, y) {
        // Override in subclass
    }

    /**
     * Handle touch move
     */
    onTouchMove(x, y) {
        // Override in subclass
    }

    /**
     * Handle touch end
     */
    onTouchEnd(x, y) {
        // Override in subclass
    }

    /**
     * Handle key press
     */
    onKeyDown(key) {
        // Override in subclass
    }

    /**
     * Show HUD
     */
    showHUD() {
        const hud = document.createElement('div');
        hud.className = 'game-hud';
        hud.innerHTML = `
            <div class="hud-item hud-score">
                <span class="hud-icon">⭐</span>
                <span class="hud-value" id="score-display">${this.score}</span>
            </div>
            <div class="hud-item hud-time">
                <span class="hud-icon">⏱️</span>
                <span class="hud-value" id="time-display">00:00</span>
            </div>
        `;
        return hud;
    }

    /**
     * Update HUD
     */
    updateHUD() {
        const scoreDisplay = document.getElementById('score-display');
        const timeDisplay = document.getElementById('time-display');

        if (scoreDisplay) scoreDisplay.textContent = this.score;
        if (timeDisplay) timeDisplay.textContent = Utils.formatTime(this.elapsedTime);
    }
}