/**
 * Parent Mode - Parental controls and settings
 */

class ParentMode {
    constructor() {
        this.isUnlocked = false;
        this.pin = null;
        this.attempts = 0;
        this.lockoutUntil = null;
        this.onUnlock = null;
        this.onLock = null;
    }

    /**
     * Initialize parent mode
     */
    init() {
        this.loadPIN();
        this.checkLockout();
    }

    /**
     * Load saved PIN
     */
    loadPIN() {
        const savedPIN = Storage.get(Constants.STORAGE.PARENT_PIN, null);
        if (savedPIN) {
            this.pin = savedPIN;
        }
    }

    /**
     * Set PIN
     */
    setPIN(newPIN) {
        if (!this.validatePINFormat(newPIN)) {
            return { success: false, error: 'PIN格式不正確，需要4位數字' };
        }

        this.pin = newPIN;
        Storage.set(Constants.STORAGE.PARENT_PIN, newPIN);
        return { success: true };
    }

    /**
     * Verify PIN
     */
    verifyPIN(inputPIN) {
        if (this.isLockedOut()) {
            const remainingTime = Math.ceil((this.lockoutUntil - Date.now()) / 1000);
            return {
                success: false,
                error: `請等待 ${remainingTime} 秒後再試`,
                locked: true
            };
        }

        if (!this.pin) {
            return { success: false, error: '請先設定PIN碼' };
        }

        if (inputPIN === this.pin) {
            this.isUnlocked = true;
            this.attempts = 0;
            if (this.onUnlock) this.onUnlock();
            return { success: true };
        }

        this.attempts++;
        if (this.attempts >= Constants.PARENT.MAX_ATTEMPTS) {
            this.lockoutUntil = Date.now() + Constants.PARENT.LOCKOUT_TIME;
            this.attempts = 0;
            return {
                success: false,
                error: '已達最大嘗試次數，請稍後再試',
                locked: true
            };
        }

        const remaining = Constants.PARENT.MAX_ATTEMPTS - this.attempts;
        return {
            success: false,
            error: `PIN碼錯誤，剩餘 ${remaining} 次嘗試機會`
        };
    }

    /**
     * Check if locked out
     */
    isLockedOut() {
        if (!this.lockoutUntil) return false;

        if (Date.now() >= this.lockoutUntil) {
            this.lockoutUntil = null;
            return false;
        }

        return true;
    }

    /**
     * Check PIN format
     */
    validatePINFormat(pin) {
        return /^\d{4}$/.test(pin);
    }

    /**
     * Lock parent mode
     */
    lock() {
        this.isUnlocked = false;
        if (this.onLock) this.onLock();
    }

    /**
     * Change PIN
     */
    changePIN(oldPIN, newPIN) {
        const verify = this.verifyPIN(oldPIN);
        if (!verify.success) {
            return verify;
        }

        return this.setPIN(newPIN);
    }

    /**
     * Get current settings (uses centralized settings store)
     */
    getSettings() {
        return Storage.getSettings();
    }

    /**
     * Update settings (uses centralized settings store)
     */
    updateSettings(settings) {
        Storage.saveSettings(settings);
    }

    /**
     * Get game progress overview
     */
    getProgressOverview() {
        const progress = Storage.get('progress', {});
        const overview = [];

        Object.entries(progress).forEach(([gameId, data]) => {
            overview.push({
                gameId,
                stars: data.stars || 0,
                highScore: data.highScore || 0,
                lastPlayed: data.lastPlayed || null,
                completed: data.completed || false
            });
        });

        return overview;
    }

    /**
     * Get total statistics
     */
    getStats() {
        const totalStars = Storage.getTotalStars();
        const progress = Storage.get('progress', {});
        const gamesPlayed = Object.keys(progress).length;
        const totalPlayTime = Object.values(progress).reduce((sum, p) => {
            return sum + (p.totalTime || 0);
        }, 0);

        return {
            totalStars,
            gamesPlayed,
            totalPlayTime,
            averageStars: gamesPlayed > 0 ? (totalStars / gamesPlayed).toFixed(1) : 0
        };
    }

    /**
     * Reset all data
     */
    resetAllData() {
        Storage.clear();
        this.pin = null;
        this.isUnlocked = false;
        this.lockoutUntil = null;
        this.attempts = 0;
    }

    /**
     * Reset game progress only
     */
    resetProgress(gameId = null) {
        const progress = Storage.get('progress', {});

        if (gameId) {
            delete progress[gameId];
        } else {
            Object.keys(progress).forEach(key => delete progress[key]);
        }

        Storage.set('progress', progress);
    }

    /**
     * Show parent mode panel
     */
    showPanel() {
        if (!this.isUnlocked) {
            return this.showPINEntry();
        }

        return this.showControlPanel();
    }

    /**
     * Show PIN entry UI
     */
    showPINEntry() {
        return `
            <div class="parent-panel">
                <h2>家長專區</h2>
                <div class="pin-entry">
                    <input type="password" id="parent-pin" maxlength="4" placeholder="輸入PIN碼" />
                    <button id="pin-submit" class="btn btn-primary">確認</button>
                </div>
                <div id="pin-error" class="error-message"></div>
            </div>
        `;
    }

    /**
     * Show control panel
     */
    showControlPanel() {
        const stats = this.getStats();
        const settings = this.getSettings();

        return `
            <div class="parent-panel">
                <h2>家長專區</h2>
                <div class="stats-overview">
                    <div class="stat-item">
                        <span class="stat-label">總星星</span>
                        <span class="stat-value">${stats.totalStars}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">遊戲記錄</span>
                        <span class="stat-value">${stats.gamesPlayed}</span>
                    </div>
                </div>
                <div class="settings-section">
                    <h3>音效設定</h3>
                    <label>
                        <input type="checkbox" id="sound-toggle" ${settings.soundEnabled ? 'checked' : ''} />
                        聲音效果
                    </label>
                    <label>
                        <input type="checkbox" id="music-toggle" ${settings.musicEnabled ? 'checked' : ''} />
                        背景音樂
                    </label>
                    <label>
                        <input type="checkbox" id="vibration-toggle" ${settings.vibrationEnabled ? 'checked' : ''} />
                        震動回饋
                    </label>
                </div>
                <div class="actions-section">
                    <button id="change-pin" class="btn btn-secondary">更改PIN碼</button>
                    <button id="reset-progress" class="btn btn-error">重置進度</button>
                    <button id="parent-lock" class="btn btn-primary">鎖定</button>
                </div>
            </div>
        `;
    }
}

// Export singleton
if (typeof window !== 'undefined') {
    window.ParentMode = new ParentMode();
}