/**
 * Main Entry - App initialization, lobby, game launching, parent panel
 */

class App {
    constructor() {
        this.currentView = 'home';
        this.currentGame = null;
        this.currentGameId = null;
        this.container = document.getElementById('app');
    }

    init() {
        try {
            this.setupAudio();
            this.registerServiceWorker();
            this.setupGlobalListeners();

            if (Storage.isFirstLaunch()) {
                this.showWelcome();
            } else {
                this.renderHome();
            }
        } catch (error) {
            console.error('[App] Init error:', error);
            this.showFatalError(error);
        }
    }

    /* ── Audio ── */
    setupAudio() {
        const initAudio = () => {
            Audio.init();
            Audio.preload();
        };
        document.addEventListener('click', initAudio, { once: true });
        document.addEventListener('touchstart', initAudio, { once: true });

        const settings = Storage.getSettings();
        Audio.setEnabled(settings.soundEnabled);
        Audio.setMusicEnabled(settings.musicEnabled);
    }

    /* ── Service Worker ── */
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
        }
    }

    /* ── Global Listeners ── */
    setupGlobalListeners() {
        window.addEventListener('popstate', () => {
            if (this.currentView !== 'home') this.goBack();
        });
        window.addEventListener('resize', Utils.debounce(() => {
            if (this.currentGame && this.currentGame.resizeCanvas) {
                const c = this.container.querySelector('.game-container');
                if (c) this.currentGame.resizeCanvas(c.clientWidth, c.clientHeight);
            }
        }, 250));
    }

    /* ── Welcome Screen ── */
    showWelcome() {
        this.clearContainer();
        const el = document.createElement('div');
        el.className = 'welcome-screen';
        el.innerHTML = `
            <div class="welcome-content">
                <h1>歡迎來到<br>小小遊戲王國</h1>
                <p>10 款趣味遊戲等你來挑戰！</p>
                <button class="btn btn-primary btn-large" id="start-btn">開始探索</button>
            </div>
        `;
        this.container.appendChild(el);

        document.getElementById('start-btn').addEventListener('click', () => {
            Audio.playButtonClick();
            el.classList.add('fadeOut');
            Storage.markLaunched();
            setTimeout(() => { el.remove(); this.renderHome(); }, 500);
        });
    }

    /* ── Home / Lobby ── */
    renderHome() {
        if (!this.container) return;
        this.currentView = 'home';
        this.clearContainer();

        const totalStars = Storage.getTotalStars();
        const el = document.createElement('div');
        el.className = 'home-view';
        el.innerHTML = `
            <header class="header">
                <h1 class="header-title">小小遊戲王國</h1>
                <button class="btn btn-icon" id="parent-btn">🔒</button>
            </header>
            <div class="stars-bar">
                <span class="stars-icon">⭐</span>
                <span class="stars-count" id="total-stars">${totalStars}</span>
            </div>
            <main class="game-grid" id="game-grid">${this.renderGameCards()}</main>
        `;
        this.container.appendChild(el);
        this.setupHomeListeners();
    }

    renderGameCards() {
        const games = [
            { id: 'bubble-pop',   name: '泡泡大作戰', icon: '🫧', desc: '戳破彩色泡泡！' },
            { id: 'star-catcher', name: '星星小精靈', icon: '⭐', desc: '收集掉落星星！' },
            { id: 'shape-slicer', name: '形狀拼接師', icon: '🧩', desc: '拼出完整形狀！' },
            { id: 'block-kingdom',name: '積木王國',   icon: '🧱', desc: '堆高高積木城堡！' },
            { id: 'magic-painter',name: '魔法畫筆',   icon: '🎨', desc: '畫出美麗圖畫！' },
            { id: 'music-band',   name: '歡樂小樂隊', icon: '🥁', desc: '跟著節奏敲樂器！' },
            { id: 'rainbow-bridge',name:'彩虹橋梁',   icon: '🌈', desc: '搭建過河橋梁！' },
            { id: 'bear-journey', name: '小熊找媽媽', icon: '🐾', desc: '幫小熊找到媽媽！' },
            { id: 'garden-party', name: '花園派對',   icon: '🦋', desc: '照顧花園植物！' },
            { id: 'astronaut',    name: '小小太空人', icon: '🚀', desc: '跳躍在太空站間！' }
        ];
        return games.map((g, i) => `
            <div class="game-card pop pop-delay-${Math.min(i + 1, 5)}" data-game="${g.id}">
                <div class="game-card-icon">${g.icon}</div>
                <div class="game-card-title">${g.name}</div>
                <div class="game-card-desc">${g.desc}</div>
            </div>
        `).join('');
    }

    setupHomeListeners() {
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', (e) => {
                Audio.playButtonClick();
                this.launchGame(e.currentTarget.dataset.game);
            });
        });
        document.getElementById('parent-btn')?.addEventListener('click', () => this.showParentPanel());
    }

    /* ── Game Launch ── */
    launchGame(gameId) {
        let GameClass = null;

        if (typeof GameRegistry !== 'undefined' && GameRegistry.has(gameId)) {
            GameClass = GameRegistry.get(gameId);
        }
        if (!GameClass) {
            const pascal = gameId.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('');
            GameClass = window[pascal] || window[gameId];
        }
        if (!GameClass) {
            this.showError('遊戲不存在');
            return;
        }

        this.currentGameId = gameId;
        this.startGame(GameClass);
    }

    startGame(GameClass) {
        this.clearContainer();
        this.currentView = 'game';

        // Create game container
        const gc = document.createElement('div');
        gc.className = 'game-container';
        this.container.appendChild(gc);

        // Init game with level 1 (level selection can be added later)
        this.currentGame = new GameClass(this.currentGameId, 1);
        this.currentGame.init(gc);
        this.currentGame.onGameOver = (result) => this.showGameOver(result);
        this.currentGame.start();

        // Handle resize
        if (this.currentGame.resizeCanvas) {
            this.currentGame.resizeCanvas(gc.clientWidth, gc.clientHeight);
        }
    }

    /* ── Game Over ── */
    showGameOver(result) {
        // Remove any existing overlay
        this.container.querySelector('.game-overlay')?.remove();

        const starsHtml = [0, 1, 2].map(i =>
            `<span class="star ${i < result.stars ? 'filled' : 'empty'} ${i < result.stars ? 'starEarned' : ''}" style="animation-delay:${i * 0.2}s">${i < result.stars ? '⭐' : '☆'}</span>`
        ).join('');

        const overlay = document.createElement('div');
        overlay.className = 'game-overlay active';
        overlay.innerHTML = `
            <div class="overlay-title">${result.isWin ? '過關！' : '遊戲結束'}</div>
            <div class="result-stars">${starsHtml}</div>
            <div class="result-score">分數: ${result.score}</div>
            ${result.isNewHighScore ? '<div class="new-high-score">🏆 新紀錄！</div>' : ''}
            <div class="modal-buttons" style="margin-top:20px">
                <button class="btn btn-primary" id="replay-btn">再玩一次</button>
                <button class="btn btn-secondary" id="home-btn">回首頁</button>
            </div>
        `;
        this.container.appendChild(overlay);

        // Update stars in lobby (in background)
        const starsEl = document.getElementById('total-stars');
        if (starsEl) starsEl.textContent = Storage.getTotalStars();

        document.getElementById('replay-btn')?.addEventListener('click', () => {
            overlay.remove();
            if (this.currentGame) {
                this.currentGame.reset();
                this.currentGame.start();
            }
        });
        document.getElementById('home-btn')?.addEventListener('click', () => this.goBack());
    }

    /* ── Parent Panel ── */
    showParentPanel() {
        ParentMode.init();
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal" style="max-width:380px;max-height:90vh;overflow-y:auto;">
                <div class="modal-title">家長專區</div>
                <div id="parent-content">${ParentMode.showPanel()}</div>
            </div>
        `;
        this.container.appendChild(modal);
        this.setupParentListeners(modal);
    }

    setupParentListeners(modal) {
        const content = document.getElementById('parent-content');

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        // PIN submit
        document.getElementById('pin-submit')?.addEventListener('click', () => {
            const val = document.getElementById('parent-pin')?.value || '';
            const errEl = document.getElementById('pin-error');
            const result = ParentMode.verifyPIN(val);

            if (result.success) {
                content.innerHTML = ParentMode.showControlPanel();
                this.setupControlListeners(modal, content);
            } else if (errEl) {
                errEl.textContent = result.error;
                Audio.playError();
            }
        });

        // Enter key on PIN input
        document.getElementById('parent-pin')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('pin-submit')?.click();
        });

        // Lock button (visible on control panel after unlock)
        document.getElementById('parent-lock')?.addEventListener('click', () => {
            ParentMode.lock();
            modal.remove();
        });
    }

    setupControlListeners(modal, content) {
        // Settings toggles
        ['sound-toggle', 'music-toggle', 'vibration-toggle'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => {
                const s = {
                    soundEnabled: document.getElementById('sound-toggle')?.checked ?? true,
                    musicEnabled: document.getElementById('music-toggle')?.checked ?? true,
                    vibrationEnabled: document.getElementById('vibration-toggle')?.checked ?? true,
                };
                Storage.saveSettings(s);
                Audio.setEnabled(s.soundEnabled);
                Audio.setMusicEnabled(s.musicEnabled);
            });
        });

        // Change PIN
        document.getElementById('change-pin')?.addEventListener('click', () => {
            const oldPin = prompt('請輸入目前的 PIN 碼：');
            if (!oldPin) return;
            const newPin = prompt('請輸入新的 4 位數字 PIN 碼：');
            if (!newPin) return;
            const result = ParentMode.changePIN(oldPin, newPin);
            alert(result.success ? 'PIN 碼已更新！' : result.error);
        });

        // Reset progress
        document.getElementById('reset-progress')?.addEventListener('click', () => {
            if (confirm('確定要重置所有遊戲進度嗎？此操作無法復原。')) {
                ParentMode.resetProgress();
                content.innerHTML = ParentMode.showControlPanel();
                this.setupControlListeners(modal, content);
                const starsEl = document.getElementById('total-stars');
                if (starsEl) starsEl.textContent = '0';
            }
        });

        // Lock button
        document.getElementById('parent-lock')?.addEventListener('click', () => {
            ParentMode.lock();
            modal.remove();
        });
    }

    /* ── Go Back ── */
    goBack() {
        if (this.currentGame) {
            this.currentGame.destroy();
            this.currentGame = null;
            this.currentGameId = null;
        }
        this.currentView = 'home';
        history.pushState(null, '', '/');
        this.renderHome();
    }

    /* ── Utilities ── */
    clearContainer() {
        if (this.container) this.container.innerHTML = '';
    }

    showError(msg) {
        const el = document.createElement('div');
        el.className = 'error-toast';
        el.textContent = msg;
        this.container.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }

    showFatalError(error) {
        if (!this.container) {
            document.body.innerHTML = `<div style="padding:40px;text-align:center;color:#FF4757;"><h2>載入失敗</h2><p>${error.message || 'Unknown error'}</p></div>`;
            return;
        }
        this.clearContainer();
        const el = document.createElement('div');
        el.className = 'fatal-error';
        el.innerHTML = `
            <h2 style="color:#FF4757;margin-bottom:16px">載入失敗</h2>
            <p style="color:#8892B0">系統發生錯誤，請嘗試重新整理。</p>
            <p style="font-size:12px;color:#5A6480;margin-top:8px">${error.message || ''}</p>
            <button class="btn btn-primary" onclick="location.reload()" style="margin-top:24px">重新整理</button>
        `;
        this.container.appendChild(el);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App().init();
});
