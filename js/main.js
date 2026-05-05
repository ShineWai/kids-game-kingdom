/**
 * Main Entry - App initialization and navigation
 */

class App {
    constructor() {
        this.currentView = 'home';
        this.currentGame = null;
        this.isLoading = false;
        this.container = document.getElementById('app');
    }

    /**
     * Initialize the app
     */
    init() {
        // Initialize storage
        this.checkFirstLaunch();

        // Initialize audio
        this.setupAudio();

        // Register service worker
        this.registerServiceWorker();

        // Setup event listeners
        this.setupEventListeners();

        // Render home view
        this.renderHome();

        console.log('[App] Initialized');
    }

    /**
     * Check first launch
     */
    checkFirstLaunch() {
        if (Storage.isFirstLaunch()) {
            // Show welcome screen on first launch
            this.showWelcome();
            Storage.markLaunched();
        }
    }

    /**
     * Setup audio
     */
    setupAudio() {
        // Initialize audio on first interaction
        document.addEventListener('click', () => {
            Audio.init();
            Audio.preload();
        }, { once: true });

        document.addEventListener('touchstart', () => {
            Audio.init();
            Audio.preload();
        }, { once: true });

        // Load settings
        const settings = Storage.getSettings();
        Audio.setEnabled(settings.soundEnabled);
        Audio.setMusicEnabled(settings.musicEnabled);
    }

    /**
     * Register service worker
     */
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('[SW] Registered:', registration.scope);
                })
                .catch(error => {
                    console.log('[SW] Registration failed:', error);
                });
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Handle back button
        window.addEventListener('popstate', () => {
            if (this.currentView !== 'home') {
                this.goBack();
            }
        });

        // Handle resize
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));
    }

    /**
     * Handle window resize
     */
    handleResize() {
        if (this.currentGame && this.currentGame.renderer) {
            // Handle game resize
        }
    }

    /**
     * Show welcome screen
     */
    showWelcome() {
        const welcomeScreen = document.createElement('div');
        welcomeScreen.className = 'welcome-screen';
        welcomeScreen.innerHTML = `
            <div class="welcome-content">
                <h1>歡迎來到小小遊戲王國！</h1>
                <p>這裡有好多有趣的遊戲等你來玩喔！</p>
                <button class="btn btn-primary btn-large" id="start-btn">
                    開始玩！
                </button>
            </div>
        `;

        this.container.appendChild(welcomeScreen);

        document.getElementById('start-btn').addEventListener('click', () => {
            welcomeScreen.classList.add('fadeOut');
            setTimeout(() => {
                welcomeScreen.remove();
            }, 500);
        });
    }

    /**
     * Render home view
     */
    renderHome() {
        this.currentView = 'home';
        this.clearContainer();

        const homeView = document.createElement('div');
        homeView.className = 'home-view';
        homeView.innerHTML = `
            <header class="header">
                <h1 class="header-title">小小遊戲王國</h1>
                <button class="btn btn-icon" id="parent-btn" title="家長專區">🔒</button>
            </header>
            <div class="stars-bar">
                <span class="stars-icon">⭐</span>
                <span class="stars-count" id="total-stars">${Storage.getTotalStars()}</span>
            </div>
            <main class="game-grid" id="game-grid">
                ${this.renderGameCards()}
            </main>
        `;

        this.container.appendChild(homeView);
        this.setupHomeListeners();
    }

    /**
     * Render game cards
     */
    renderGameCards() {
        const games = [
            { id: 'flappyBird', name: '小小飛飛', icon: '🐦', description: '控制小鳥飛翔！' },
            { id: 'catchGame', name: '接水果', icon: '🍎', description: '接住掉下的水果！' },
            { id: 'puzzle', name: '形狀拼拼', icon: '🧩', description: '拼出形狀！' },
            { id: 'memory', name: '記憶翻翻', icon: '🃏', description: '翻出相同卡片！' }
        ];

        return games.map(game => `
            <div class="game-card pop" data-game="${game.id}">
                <div class="game-card-icon">${game.icon}</div>
                <div class="game-card-title">${game.name}</div>
            </div>
        `).join('');
    }

    /**
     * Setup home listeners
     */
    setupHomeListeners() {
        // Game card clicks
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', (e) => {
                Audio.playButtonClick();
                const gameId = e.currentTarget.dataset.game;
                this.launchGame(gameId);
            });
        });

        // Parent button
        document.getElementById('parent-btn')?.addEventListener('click', () => {
            this.showParentPanel();
        });
    }

    /**
     * Launch a game
     */
    launchGame(gameId) {
        this.showLoading();

        // Dynamically load game
        const gamePath = `js/games/${gameId}.js`;

        import(gamePath)
            .then(module => {
                this.hideLoading();
                this.startGame(module.default || module);
            })
            .catch(error => {
                console.error('[App] Failed to load game:', error);
                this.hideLoading();
                this.showError('遊戲載入失敗，請稍後再試');
            });
    }

    /**
     * Start game
     */
    startGame(GameClass) {
        this.clearContainer();
        this.currentView = 'game';

        // Create game container
        const gameContainer = document.createElement('div');
        gameContainer.className = 'game-container';
        this.container.appendChild(gameContainer);

        // Initialize game
        this.currentGame = new GameClass();
        this.currentGame.init(gameContainer);
        this.currentGame.onGameOver = (result) => this.showGameOver(result);
        this.currentGame.start();
    }

    /**
     * Show loading
     */
    showLoading() {
        this.isLoading = true;
        const loader = document.createElement('div');
        loader.className = 'loader';
        loader.id = 'loader';
        loader.innerHTML = '<div class="spinner"></div><p>載入中...</p>';
        this.container.appendChild(loader);
    }

    /**
     * Hide loading
     */
    hideLoading() {
        this.isLoading = false;
        const loader = document.getElementById('loader');
        if (loader) loader.remove();
    }

    /**
     * Show game over screen
     */
    showGameOver(result) {
        const overlay = document.createElement('div');
        overlay.className = 'game-overlay active';
        overlay.innerHTML = `
            <div class="overlay-title">遊戲結束！</div>
            <div class="result-stars">${this.renderStars(result.stars)}</div>
            <div class="result-score">分數: ${result.score}</div>
            ${result.isNewHighScore ? '<div class="new-high-score">新紀錄！</div>' : ''}
            <div class="modal-buttons">
                <button class="btn btn-secondary" id="replay-btn">再玩一次</button>
                <button class="btn btn-primary" id="home-btn">回首頁</button>
            </div>
        `;

        this.container.appendChild(overlay);

        // Update total stars
        document.getElementById('total-stars').textContent = Storage.getTotalStars();

        // Button listeners
        document.getElementById('replay-btn')?.addEventListener('click', () => {
            overlay.remove();
            if (this.currentGame) {
                this.currentGame.reset();
                this.currentGame.start();
            }
        });

        document.getElementById('home-btn')?.addEventListener('click', () => {
            this.goBack();
        });
    }

    /**
     * Render stars
     */
    renderStars(count) {
        let stars = '';
        for (let i = 0; i < 3; i++) {
            stars += i < count ? '⭐' : '☆';
        }
        return stars;
    }

    /**
     * Show parent panel
     */
    showParentPanel() {
        ParentMode.init();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-title">家長專區</div>
                <div class="modal-content" id="parent-content">
                    ${ParentMode.showPanel()}
                </div>
            </div>
        `;

        this.container.appendChild(modal);

        this.setupParentListeners(modal);
    }

    /**
     * Setup parent panel listeners
     */
    setupParentListeners(modal) {
        const content = document.getElementById('parent-content');

        // Close modal on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // PIN submit
        document.getElementById('pin-submit')?.addEventListener('click', () => {
            const pinInput = document.getElementById('parent-pin');
            const errorDiv = document.getElementById('pin-error');
            const result = ParentMode.verifyPIN(pinInput.value);

            if (result.success) {
                content.innerHTML = ParentMode.showControlPanel();
                this.setupParentListeners(modal);
            } else {
                errorDiv.textContent = result.error;
                Audio.playError();
            }
        });

        // Lock button
        document.getElementById('parent-lock')?.addEventListener('click', () => {
            ParentMode.lock();
            modal.remove();
        });
    }

    /**
     * Show error message
     */
    showError(message) {
        const error = document.createElement('div');
        error.className = 'error-toast';
        error.textContent = message;
        this.container.appendChild(error);

        setTimeout(() => {
            error.remove();
        }, 3000);
    }

    /**
     * Go back to home
     */
    goBack() {
        if (this.currentGame) {
            this.currentGame.destroy();
            this.currentGame = null;
        }

        this.currentView = 'home';
        history.pushState(null, '', '/');
        this.renderHome();
    }

    /**
     * Clear container
     */
    clearContainer() {
        this.container.innerHTML = '';
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();

    // Expose for debugging
    window.App = app;
});