/**
 * Main Entry - App initialization, lobby, game launching, parent panel
 */
class App {
    constructor() {
        this.currentView = 'home';
        this.currentGame = null;
        this.currentGameId = null;
        this.currentLevel = 1;
        this.container = document.getElementById('app');
    }

    init() {
        try {
            this.setupAudio();
            this.registerServiceWorker();
            this.setupGlobalListeners();
            if (Storage.isFirstLaunch()) { this.showWelcome(); } else { this.renderHome(); }
        } catch (e) { console.error('[App] Init error:', e); this.showFatalError(e); }
    }

    setupAudio() {
        const initAudio = () => { Audio.init(); Audio.preload(); };
        document.addEventListener('click', initAudio, { once: true });
        document.addEventListener('touchstart', initAudio, { once: true });
        const s = Storage.getSettings();
        Audio.setEnabled(s.soundEnabled);
        Audio.setMusicEnabled(s.musicEnabled);
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    setupGlobalListeners() {
        window.addEventListener('popstate', () => { if (this.currentView !== 'home') this.goBack(); });
        window.addEventListener('resize', Utils.debounce(() => {
            if (this.currentGame && this.currentGame.resizeCanvas) {
                const c = this.container.querySelector('.game-container');
                if (c) this.currentGame.resizeCanvas(c.clientWidth, c.clientHeight);
            }
        }, 250));
    }

    /* ── Welcome ── */
    showWelcome() {
        this.clearContainer();
        const el = document.createElement('div');
        el.className = 'welcome-screen';
        el.innerHTML = `
            <div class="welcome-content">
                <h1>歡迎來到<br>小小遊戲王國</h1>
                <p>10 款趣味遊戲，邊玩邊學！</p>
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

    /* ── Lobby ── */
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
            { id: 'bubble-pop',   name: '泡泡大作戰', icon: '🫧', desc: '戳破彩色泡泡！',       learn: '顏色辨識、手眼協調' },
            { id: 'star-catcher', name: '星星小精靈', icon: '⭐', desc: '收集掉落星星！',       learn: '空間感知、反應速度' },
            { id: 'shape-slicer', name: '形狀拼接師', icon: '🧩', desc: '拼出完整形狀！',       learn: '形狀辨識、幾何概念' },
            { id: 'block-kingdom',name: '積木王國',   icon: '🧱', desc: '堆高高積木城堡！',     learn: '物理概念、平衡感' },
            { id: 'magic-painter',name: '魔法畫筆',   icon: '🎨', desc: '畫出美麗圖畫！',       learn: '創造力、精細動作' },
            { id: 'music-band',   name: '歡樂小樂隊', icon: '🥁', desc: '跟著節奏敲樂器！',     learn: '節奏感、聽覺訓練' },
            { id: 'rainbow-bridge',name:'彩虹橋梁',   icon: '🌈', desc: '搭建過河橋梁！',       learn: '工程思維、空間規劃' },
            { id: 'bear-journey', name: '小熊找媽媽', icon: '🐾', desc: '幫小熊找到媽媽！',     learn: '問題解決、方向感' },
            { id: 'garden-party', name: '花園派對',   icon: '🦋', desc: '照顧花園植物！',       learn: '責任感、因果關係' },
            { id: 'astronaut',    name: '小小太空人', icon: '🚀', desc: '跳躍在太空站間！',     learn: '重力概念、空間推理' }
        ];
        return games.map((g, i) => {
            const prog = Storage.getProgress(g.id);
            const unlocked = prog.level || 1;
            const cardStars = prog.stars || 0;
            const starsHtml = [1,2,3].map(s => s <= cardStars ? '⭐' : '☆').join('');
            const progressPct = ((unlocked - 1) / 10) * 100;

            return `
            <div class="game-card pop pop-delay-${Math.min(i + 1, 5)}" data-game="${g.id}">
                <div class="game-card-icon">${g.icon}</div>
                <div class="game-card-title">${g.name}</div>
                <div class="game-card-stars">${starsHtml}</div>
                <div class="game-card-progress">
                    <div class="game-card-progress-bar" style="width:${progressPct}%"></div>
                </div>
                <div class="game-card-level">關卡 ${unlocked}/10</div>
                <div class="game-card-learn">🧠 ${g.learn}</div>
            </div>`;
        }).join('');
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
    launchGame(gameId, level) {
        let GameClass = null;
        if (typeof GameRegistry !== 'undefined' && GameRegistry.has(gameId)) {
            GameClass = GameRegistry.get(gameId);
        }
        if (!GameClass) {
            const pascal = gameId.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('');
            GameClass = window[pascal] || window[gameId];
        }
        if (!GameClass) { this.showError('遊戲不存在'); return; }

        this.currentGameId = gameId;
        this.currentLevel = level || (Storage.getProgress(gameId).level || 1);
        this.startGame(GameClass);
    }

    startGame(GameClass) {
        this.clearContainer();
        this.currentView = 'game';

        const gc = document.createElement('div');
        gc.className = 'game-container';
        this.container.appendChild(gc);

        this.currentGame = new GameClass(this.currentGameId, this.currentLevel);
        this.currentGame.onGameOver = (r) => this.showGameOver(r);
        this.currentGame.onBack = () => this.goBack();
        this.currentGame.init(gc);
        this.currentGame.start();

        if (this.currentGame.resizeCanvas) {
            this.currentGame.resizeCanvas(gc.clientWidth, gc.clientHeight);
        }
    }

    /* ── Game Over ── */
    showGameOver(result) {
        this.container.querySelector('.game-overlay')?.remove();

        const starsHtml = [0, 1, 2].map(i =>
            `<span class="star ${i < result.stars ? 'filled' : 'empty'} ${i < result.stars ? 'starEarned' : ''}" style="animation-delay:${i * 0.2}s">${i < result.stars ? '⭐' : '☆'}</span>`
        ).join('');

        const isMaxLevel = result.level >= 10;
        const hasNextLevel = result.isWin && !isMaxLevel;
        const learnMessages = {
            'bubble-pop': '你練習了顏色辨識和手眼協調！',
            'star-catcher': '你練習了空間感知和反應速度！',
            'shape-slicer': '你練習了形狀辨識和幾何概念！',
            'block-kingdom': '你練習了物理概念和平衡感！',
            'magic-painter': '你練習了創造力和精細動作！',
            'music-band': '你練習了節奏感和聽覺訓練！',
            'rainbow-bridge': '你練習了工程思維和空間規劃！',
            'bear-journey': '你練習了問題解決和方向感！',
            'garden-party': '你練習了責任感和因果關係！',
            'astronaut': '你練習了重力概念和空間推理！'
        };

        const overlay = document.createElement('div');
        overlay.className = 'game-overlay active';
        overlay.innerHTML = `
            <div class="overlay-title">${result.isWin ? '🎉 過關！' : '遊戲結束'}</div>
            <div class="overlay-level">第 ${result.level} 關</div>
            <div class="result-stars">${starsHtml}</div>
            <div class="result-score">分數: ${result.score}</div>
            ${result.isNewHighScore ? '<div class="new-high-score">🏆 新紀錄！</div>' : ''}
            ${result.isWin ? '<div class="learn-message">' + (learnMessages[result.gameId] || '你做到了！繼續加油！') + '</div>' : ''}
            <div class="modal-buttons" style="margin-top:16px">
                <button class="btn btn-primary" id="replay-btn">🔄 再玩一次</button>
                ${hasNextLevel ? '<button class="btn btn-success" id="next-btn">▶ 下一關</button>' : ''}
                <button class="btn btn-secondary" id="home-btn">🏠 回首頁</button>
            </div>
        `;
        this.container.appendChild(overlay);

        document.getElementById('total-stars') && (document.getElementById('total-stars').textContent = Storage.getTotalStars());

        document.getElementById('replay-btn')?.addEventListener('click', () => {
            overlay.remove();
            if (this.currentGame) { this.currentGame.reset(); this.currentGame.start(); }
        });

        document.getElementById('next-btn')?.addEventListener('click', () => {
            overlay.remove();
            if (this.currentGame) this.currentGame.destroy();
            this.currentLevel = result.level + 1;
            let GameClass = null;
            if (typeof GameRegistry !== 'undefined' && GameRegistry.has(result.gameId)) {
                GameClass = GameRegistry.get(result.gameId);
            }
            if (!GameClass) {
                const pascal = result.gameId.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('');
                GameClass = window[pascal] || window[result.gameId];
            }
            if (GameClass) this.startGame(GameClass);
        });

        document.getElementById('home-btn')?.addEventListener('click', () => this.goBack());
    }

    /* ── Parent Panel ── */
    showParentPanel() {
        ParentMode.init();
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `<div class="modal" style="max-width:380px;max-height:90vh;overflow-y:auto;"><div class="modal-title">家長專區</div><div id="parent-content">${ParentMode.showPanel()}</div></div>`;
        this.container.appendChild(modal);
        this.setupParentListeners(modal);
    }

    setupParentListeners(modal) {
        const content = document.getElementById('parent-content');
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        document.getElementById('pin-submit')?.addEventListener('click', () => {
            const val = document.getElementById('parent-pin')?.value || '';
            const errEl = document.getElementById('pin-error');
            const result = ParentMode.verifyPIN(val);
            if (result.success) { content.innerHTML = ParentMode.showControlPanel(); this.setupControlListeners(modal, content); }
            else if (errEl) { errEl.textContent = result.error; Audio.playError(); }
        });
        document.getElementById('parent-pin')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('pin-submit')?.click(); });
        document.getElementById('parent-lock')?.addEventListener('click', () => { ParentMode.lock(); modal.remove(); });
    }

    setupControlListeners(modal, content) {
        ['sound-toggle','music-toggle','vibration-toggle'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => {
                const s = {
                    soundEnabled: document.getElementById('sound-toggle')?.checked ?? true,
                    musicEnabled: document.getElementById('music-toggle')?.checked ?? true,
                    vibrationEnabled: document.getElementById('vibration-toggle')?.checked ?? true,
                };
                Storage.saveSettings(s); Audio.setEnabled(s.soundEnabled); Audio.setMusicEnabled(s.musicEnabled);
            });
        });
        document.getElementById('change-pin')?.addEventListener('click', () => {
            const oldPin = prompt('請輸入目前的 PIN 碼：'); if (!oldPin) return;
            const newPin = prompt('請輸入新的 4 位數字 PIN 碼：'); if (!newPin) return;
            alert(ParentMode.changePIN(oldPin, newPin).success ? 'PIN 碼已更新！' : '失敗');
        });
        document.getElementById('reset-progress')?.addEventListener('click', () => {
            if (confirm('確定要重置所有遊戲進度嗎？')) {
                ParentMode.resetProgress(); content.innerHTML = ParentMode.showControlPanel();
                this.setupControlListeners(modal, content);
                document.getElementById('total-stars') && (document.getElementById('total-stars').textContent = '0');
            }
        });
        document.getElementById('parent-lock')?.addEventListener('click', () => { ParentMode.lock(); modal.remove(); });
    }

    /* ── Navigation ── */
    goBack() {
        if (this.currentGame) { this.currentGame.destroy(); this.currentGame = null; this.currentGameId = null; }
        this.currentView = 'home';
        history.pushState(null, '', '/');
        this.renderHome();
    }

    clearContainer() { if (this.container) this.container.innerHTML = ''; }

    showError(msg) {
        const el = document.createElement('div'); el.className = 'error-toast'; el.textContent = msg;
        this.container.appendChild(el); setTimeout(() => el.remove(), 3000);
    }

    showFatalError(error) {
        if (!this.container) { document.body.innerHTML = `<div style="padding:40px;text-align:center;color:#FF4757;"><h2>載入失敗</h2><p>${error.message||''}</p></div>`; return; }
        this.clearContainer();
        const el = document.createElement('div'); el.className = 'fatal-error';
        el.innerHTML = `<h2 style="color:#FF4757;margin-bottom:16px">載入失敗</h2><p style="color:#8892B0">系統發生錯誤</p><button class="btn btn-primary" onclick="location.reload()" style="margin-top:24px">重新整理</button>`;
        this.container.appendChild(el);
    }
}

document.addEventListener('DOMContentLoaded', () => { new App().init(); });
