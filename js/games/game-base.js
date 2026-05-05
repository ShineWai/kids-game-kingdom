/**
 * Game Base Class - Foundation for all games
 */

class GameBase {
    /**
     * @param {string} gameId - Game identifier
     * @param {number|object} levelOrOptions - Level number (1-10) or options object
     */
    constructor(gameId, levelOrOptions = {}) {
        this.gameId = gameId;

        // Handle both calling conventions: (gameId, level) and (gameId, options)
        if (typeof levelOrOptions === 'number') {
            this.level = levelOrOptions;
            this.options = {};
        } else {
            this.level = levelOrOptions.level || 1;
            this.options = levelOrOptions;
        }

        this.canvas = null;
        this.renderer = null;
        this.physics = new Physics();
        this.state = 'idle';
        this.score = 0;
        this.stars = 0;
        this.highScore = 0;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.isPaused = false;
        this.animationId = null;
        this.lastFrameTime = 0;
        this.gameCompleteCalled = false;

        // Canvas settings
        this.width = this.options.width || Constants.GAME.DEFAULT_WIDTH;
        this.height = this.options.height || Constants.GAME.DEFAULT_HEIGHT;
        this.targetFPS = this.options.targetFPS || Constants.GAME.TARGET_FPS;
        this.frameInterval = 1000 / this.targetFPS;

        // Callbacks
        this.onScoreChange = this.options.onScoreChange || null;
        this.onGameOver = this.options.onGameOver || null;
        this.onStarEarned = this.options.onStarEarned || null;
        this.onPause = this.options.onPause || null;
        this.onResume = this.options.onResume || null;
        this.onBack = this.options.onBack || null;
        this.onNextLevel = this.options.onNextLevel || null;

        // Load saved progress
        this.loadProgress();
    }

    /**
     * Initialize the game
     */
    init(container) {
        this.container = container;

        // Back button
        this._backBtn = document.createElement('button');
        this._backBtn.className = 'game-back-btn';
        this._backBtn.innerHTML = '🏠';
        this._backBtn.title = '回首頁';
        this._backBtn.addEventListener('click', () => { if (this.onBack) this.onBack(); });
        this._backBtn.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); if (this.onBack) this.onBack(); });
        container.appendChild(this._backBtn);

        // Level badge
        this._levelBadge = document.createElement('div');
        this._levelBadge.className = 'game-level-badge';
        this._levelBadge.textContent = '第 ' + this.level + ' 關';
        container.appendChild(this._levelBadge);

        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.className = 'game-canvas';
        container.appendChild(this.canvas);

        // Create renderer
        this.renderer = new Renderer(this.canvas);
        this.renderer.resize(this.width, this.height);

        // Initialize game-specific elements
        this.initElements();

        // Start game loop
        this.startGameLoop();
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
        this.gameCompleteCalled = false;
        this.lastFrameTime = performance.now();

        this.onStart?.();
    }

    /**
     * Resize canvas to fit container
     */
    resizeCanvas(containerWidth, containerHeight) {
        const size = Math.min(containerWidth, containerHeight, Constants.GAME.DEFAULT_WIDTH);
        this.width = size;
        this.height = size * 1.5;
        if (this.renderer) {
            this.renderer.resize(this.width, this.height);
        }
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
    }

    /**
     * End the game
     */
    end() {
        if (this.gameCompleteCalled) return;
        this.gameCompleteCalled = true;

        this.state = 'gameOver';
        this.gameOverTime = Date.now();

        this.calculateStars();
        this.saveProgress();

        if (this.onGameOver) this.onGameOver(this.getResult());
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
            level: this.level,
            score: this.score,
            stars: this.stars,
            highScore: Math.max(this.score, this.highScore),
            elapsedTime: this.elapsedTime,
            isNewHighScore: this.score > this.highScore,
            isWin: this.stars > 0
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
        const current = Storage.getProgress(this.gameId);
        Storage.saveProgress(this.gameId, {
            score: this.score,
            stars: Math.max(current.stars || 0, this.stars),
            highScore: Math.max(current.highScore || 0, this.highScore),
            level: Math.max(current.level || 1, (this.stars > 0) ? this.level + 1 : this.level),
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
        if (this._backBtn && this._backBtn.parentNode) {
            this._backBtn.parentNode.removeChild(this._backBtn);
        }
        if (this._levelBadge && this._levelBadge.parentNode) {
            this._levelBadge.parentNode.removeChild(this._levelBadge);
        }

        this.state = 'idle';
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