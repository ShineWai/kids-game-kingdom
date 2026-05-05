/**
 * Audio Engine - Sound effects and music management
 */

class AudioManager {
    constructor() {
        this.context = null;
        this.sounds = {};
        this.enabled = true;
        this.musicEnabled = true;
        this.volume = 0.7;
        this.initialized = false;
    }

    /**
     * Initialize audio context (must be called after user interaction)
     */
    init() {
        if (this.initialized) return;

        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            console.log('[Audio] Initialized');
        } catch (e) {
            console.warn('[Audio] Web Audio API not supported:', e);
        }
    }

    /**
     * Resume audio context if suspended
     */
    async resume() {
        if (this.context && this.context.state === 'suspended') {
            await this.context.resume();
        }
    }

    /**
     * Play a sound effect
     */
    async play(type, options = {}) {
        if (!this.enabled || !this.initialized) return;

        await this.resume();

        const frequency = options.frequency || 440;
        const duration = options.duration || 0.2;
        const volume = options.volume || this.volume;

        try {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);

            oscillator.type = this.getOscillatorType(type);
            oscillator.frequency.value = frequency;

            gainNode.gain.setValueAtTime(volume, this.context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

            oscillator.start(this.context.currentTime);
            oscillator.stop(this.context.currentTime + duration);
        } catch (e) {
            console.warn('[Audio] Play error:', e);
        }
    }

    /**
     * Get oscillator type based on sound type
     */
    getOscillatorType(type) {
        switch (type) {
            case Constants.AUDIO.SUCCESS:
            case Constants.AUDIO.STAR:
                return 'sine';
            case Constants.AUDIO.ERROR:
            case Constants.AUDIO.GAME_OVER:
                return 'sawtooth';
            case Constants.AUDIO.CLICK:
            case Constants.AUDIO.BUTTON_CLICK:
                return 'triangle';
            case Constants.AUDIO.LEVEL_UP:
                return 'sine';
            default:
                return 'sine';
        }
    }

    /**
     * Get frequency for sound type
     */
    getFrequency(type) {
        const frequencies = {
            [Constants.AUDIO.SUCCESS]: 523.25, // C5
            [Constants.AUDIO.ERROR]: 220, // A3
            [Constants.AUDIO.CLICK]: 880, // A5
            [Constants.AUDIO.STAR]: 783.99, // G5
            [Constants.AUDIO.LEVEL_UP]: 1046.50, // C6
            [Constants.AUDIO.GAME_OVER]: 174.61, // F3
            [Constants.AUDIO.BUTTON_CLICK]: 660 // E5
        };
        return frequencies[type] || 440;
    }

    /**
     * Play predefined sound
     */
    async playSound(type) {
        const duration = type === Constants.AUDIO.SUCCESS ? 0.3 : 0.2;
        await this.play(type, {
            frequency: this.getFrequency(type),
            duration
        });
    }

    /**
     * Play success melody (three ascending notes)
     */
    async playSuccessMelody() {
        if (!this.enabled || !this.initialized) return;

        await this.resume();

        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        for (let i = 0; i < notes.length; i++) {
            setTimeout(() => {
                this.play(Constants.AUDIO.SUCCESS, {
                    frequency: notes[i],
                    duration: 0.2,
                    volume: this.volume
                });
            }, i * 100);
        }
    }

    /**
     * Play star collect sound
     */
    async playStar() {
        await this.playSound(Constants.AUDIO.STAR);
    }

    /**
     * Play level up sound
     */
    async playLevelUp() {
        if (!this.enabled || !this.initialized) return;

        await this.resume();

        const notes = [523.25, 587.33, 659.25, 783.99, 1046.50]; // C5, D5, E5, G5, C6
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.play(Constants.AUDIO.LEVEL_UP, {
                    frequency: freq,
                    duration: 0.15,
                    volume: this.volume
                });
            }, i * 80);
        });
    }

    /**
     * Play game over sound
     */
    async playGameOver() {
        if (!this.enabled || !this.initialized) return;

        await this.resume();

        const notes = [293.66, 261.63, 220]; // D4, C4, A3
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.play(Constants.AUDIO.GAME_OVER, {
                    frequency: freq,
                    duration: 0.3,
                    volume: this.volume
                });
            }, i * 150);
        });
    }

    /**
     * Play button click sound
     */
    async playButtonClick() {
        await this.playSound(Constants.AUDIO.BUTTON_CLICK);
    }

    /**
     * Enable/disable sounds
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Enable/disable music
     */
    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
    }

    /**
     * Set volume (0-1)
     */
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }

    /**
     * Preload sounds
     */
    preload() {
        // Web Audio doesn't need preloading, but we can verify context
        if (!this.initialized) {
            this.init();
        }
    }

    /**
     * Vibrate (if supported)
     */
    vibrate(pattern = 50) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }

    /**
     * Vibrate for success
     */
    vibrateSuccess() {
        this.vibrate([50, 50, 100]);
    }

    /**
     * Vibrate for error
     */
    vibrateError() {
        this.vibrate([50, 50, 50, 50, 100]);
    }
}

// Export singleton instance
const Audio = new AudioManager();