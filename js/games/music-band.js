/**
 * Music Band Game - Rhythm game with jungle instruments
 * Theme: Jungle Party
 */

class MusicBand extends GameBase {
    constructor(level = 1) {
        super('music-band', level);

        // Level configuration: 1 instrument at level 1, up to 4 at level 4+
        this.instrumentCount = Math.min(Math.ceil(level / 2), 4);
        this.noteSpeed = 2 + (level * 0.5);
        this.tempo = 90 + (level * 15); // BPM

        // Game state
        this.lanes = [];
        this.notes = [];
        this.noteIdCounter = 0;
        this.isPlaying = false;
        this.gameCompleteCalled = false;

        // Timing
        this.beatInterval = 60000 / this.tempo; // ms per beat
        this.lastBeatTime = 0;
        this.gameTime = 0;

        // Scoring
        this.combo = 0;
        this.maxCombo = 0;
        this.perfectHits = 0;
        this.goodHits = 0;
        this.misses = 0;

        // Instruments
        this.instruments = [
            { name: '鼓', symbol: '🥁', color: '#EF5350' },
            { name: '鈸', symbol: '🎵', color: '#FFB74D' },
            { name: '鈴鼓', symbol: '🎶', color: '#66BB6A' },
            { name: '木魚', symbol: '🥁', color: '#7E57C2' }
        ];

        // Visual effects
        this.hitEffects = [];
        this.laneFlash = [];

        // Input handling
        this.handleInput = this.handleInput.bind(this);
    }

    /**
     * Initialize game elements
     */
    initElements() {
        this.lanes = [];
        this.notes = [];
        this.noteIdCounter = 0;
        this.gameCompleteCalled = false;
        this.combo = 0;
        this.maxCombo = 0;
        this.perfectHits = 0;
        this.goodHits = 0;
        this.misses = 0;
        this.hitEffects = [];
        this.laneFlash = [];
        this.gameTime = 0;
        this.lastBeatTime = 0;

        // Create lanes for each instrument
        const laneWidth = this.width / this.instrumentCount;

        for (let i = 0; i < this.instrumentCount; i++) {
            this.lanes.push({
                id: i,
                x: i * laneWidth,
                width: laneWidth,
                centerX: i * laneWidth + laneWidth / 2,
                instrument: this.instruments[i],
                active: true,
                keyHint: this.getKeyHint(i)
            });
        }
    }

    /**
     * Get key hint for lane
     */
    getKeyHint(index) {
        const keys = ['D', 'F', 'J', 'K'];
        return keys[index] || '';
    }

    /**
     * Update game state
     */
    update(deltaTime) {
        if (this.state !== 'playing') return;

        this.gameTime += deltaTime * 1000;

        // Spawn notes on beat
        if (this.gameTime - this.lastBeatTime >= this.beatInterval) {
            this.lastBeatTime = this.gameTime;
            this.spawnNote();
        }

        // Update notes
        for (let i = this.notes.length - 1; i >= 0; i--) {
            const note = this.notes[i];
            note.y += this.noteSpeed;

            // Check if note passed the hit zone
            if (!note.hit && note.y > this.height - 80) {
                this.missNote(note);
                this.notes.splice(i, 1);
            }

            // Remove notes that are off screen
            if (note.y > this.height + 50) {
                this.notes.splice(i, 1);
            }
        }

        // Update hit effects
        for (let i = this.hitEffects.length - 1; i >= 0; i--) {
            const effect = this.hitEffects[i];
            effect.life -= deltaTime;
            effect.scale += deltaTime * 5;

            if (effect.life <= 0) {
                this.hitEffects.splice(i, 1);
            }
        }

        // Update lane flash
        for (let i = this.laneFlash.length - 1; i >= 0; i--) {
            this.laneFlash[i] -= deltaTime * 5;
            if (this.laneFlash[i] < 0) {
                this.laneFlash[i] = 0;
            }
        }

        // Check game end (after certain number of beats)
        const maxBeats = 32 + this.level * 8;
        const currentBeat = Math.floor(this.gameTime / this.beatInterval);

        if (currentBeat >= maxBeats && this.notes.length === 0) {
            this.win();
        }
    }

    /**
     * Spawn a note on a random lane
     */
    spawnNote() {
        // Random lane, weighted towards not hitting same lane twice in a row
        let lastLane = this.notes.length > 0 ? this.notes[this.notes.length - 1].laneId : -1;
        let laneId;

        do {
            laneId = Math.floor(Math.random() * this.instrumentCount);
        } while (laneId === lastLane && this.instrumentCount > 1);

        const note = {
            id: this.noteIdCounter++,
            laneId: laneId,
            y: -30,
            hit: false,
            missed: false
        };

        this.notes.push(note);

        // Occasionally spawn double notes at higher levels
        if (this.level >= 3 && Math.random() < 0.2 && this.instrumentCount >= 2) {
            let secondLane;
            do {
                secondLane = Math.floor(Math.random() * this.instrumentCount);
            } while (secondLane === laneId);

            this.notes.push({
                id: this.noteIdCounter++,
                laneId: secondLane,
                y: -30,
                hit: false,
                missed: false
            });
        }
    }

    /**
     * Handle input (key press or tap)
     */
    handleInput(x, y, laneId = null) {
        if (this.state !== 'playing') return;

        // If laneId not provided, find it from coordinates
        if (laneId === null) {
            const laneWidth = this.width / this.instrumentCount;
            laneId = Math.floor(x / laneWidth);
        }

        if (laneId < 0 || laneId >= this.lanes.length) return;

        // Check for note hit
        let hitNote = null;
        let hitIndex = -1;

        for (let i = 0; i < this.notes.length; i++) {
            const note = this.notes[i];
            if (note.laneId === laneId && !note.hit && !note.missed) {
                const distance = Math.abs(note.y - (this.height - 60));

                if (distance < 50) {
                    hitNote = note;
                    hitIndex = i;
                    break;
                }
            }
        }

        if (hitNote) {
            this.hitNote(hitNote, hitIndex);
        } else {
            // Empty hit - penalize slightly
            this.combo = 0;
            this.laneFlash[laneId] = 0.3;
        }

        Audio.playSound(Constants.AUDIO.CLICK);
    }

    /**
     * Handle key press
     */
    onKeyDown(key) {
        if (this.state !== 'playing') return;

        const keyMap = { 'd': 0, 'f': 1, 'j': 2, 'k': 3 };
        const laneId = keyMap[key.toLowerCase()];

        if (laneId !== undefined && laneId < this.instrumentCount) {
            this.handleInput(0, 0, laneId);
        }
    }

    /**
     * Hit a note
     */
    hitNote(note, index) {
        note.hit = true;
        this.notes.splice(index, 1);

        const distance = Math.abs(note.y - (this.height - 60));

        // Determine hit quality
        if (distance < 20) {
            // Perfect hit
            this.perfectHits++;
            this.combo++;
            this.addScore(20 + this.combo * 2);
            this.createHitEffect(note.laneId, 'perfect');
            Audio.playSound(Constants.AUDIO.SUCCESS);
        } else {
            // Good hit
            this.goodHits++;
            this.combo++;
            this.addScore(10 + this.combo);
            this.createHitEffect(note.laneId, 'good');
            Audio.playSound(Constants.AUDIO.CLICK);
        }

        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
    }

    /**
     * Miss a note
     */
    missNote(note) {
        note.missed = true;
        this.misses++;
        this.combo = 0;
    }

    /**
     * Create hit effect
     */
    createHitEffect(laneId, type) {
        const lane = this.lanes[laneId];

        this.hitEffects.push({
            x: lane.centerX,
            y: this.height - 60,
            type: type,
            scale: 1,
            life: 0.5,
            color: type === 'perfect' ? '#FFD700' : '#66BB6A'
        });

        this.laneFlash[laneId] = 1;
    }

    /**
     * Handle win condition
     */
    win() {
        if (this.gameCompleteCalled) return;
        this.gameCompleteCalled = true;

        // Bonus for high accuracy
        const totalNotes = this.perfectHits + this.goodHits + this.misses;
        const accuracy = totalNotes > 0 ? (this.perfectHits + this.goodHits * 0.5) / totalNotes : 0;

        this.addScore(Math.floor(this.maxCombo * 5));
        this.addScore(Math.floor(accuracy * 50));

        setTimeout(() => {
            this.end();
            if (this.onGameOver) {
                this.onGameOver(this.getResult());
            }
        }, 500);
    }

    /**
     * Calculate stars
     */
    calculateStars() {
        const totalNotes = this.perfectHits + this.goodHits + this.misses;
        const accuracy = totalNotes > 0 ? (this.perfectHits + this.goodHits) / totalNotes : 0;

        if (accuracy >= 0.9 && this.combo >= 10) {
            this.stars = 3;
        } else if (accuracy >= 0.7) {
            this.stars = 2;
        } else if (accuracy >= 0.5) {
            this.stars = 1;
        }
    }

    /**
     * Render game
     */
    render() {
        // Draw jungle background
        this.renderer.drawGradient(0, 0, this.width, this.height, '#1B5E20', '#4CAF50');

        // Draw decorative jungle elements
        this.drawJungleDecor();

        // Draw lanes
        this.lanes.forEach((lane, index) => {
            this.drawLane(lane, index);
        });

        // Draw notes
        this.notes.forEach(note => {
            this.drawNote(note);
        });

        // Draw hit effects
        this.hitEffects.forEach(effect => {
            this.drawHitEffect(effect);
        });

        // Draw hit zone
        this.drawHitZone();

        // Draw HUD
        this.renderHUD();
    }

    /**
     * Draw jungle decorations
     */
    drawJungleDecor() {
        const ctx = this.renderer.ctx;

        // Draw vines
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 3;

        for (let i = 0; i < 5; i++) {
            const x = 30 + i * 80;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.bezierCurveTo(x + 20, 50, x - 10, 100, x + 5, 150);
            ctx.stroke();
        }

        // Draw leaves
        ctx.fillStyle = '#43A047';
        for (let i = 0; i < 8; i++) {
            const x = 50 + i * 60;
            const y = 80 + Math.sin(i) * 20;
            this.drawLeaf(x, y, 15 + (i % 3) * 5);
        }
    }

    /**
     * Draw a leaf
     */
    drawLeaf(x, y, size) {
        const ctx = this.renderer.ctx;
        ctx.beginPath();
        ctx.ellipse(x, y, size, size / 2, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw a lane
     */
    drawLane(lane, index) {
        const ctx = this.renderer.ctx;

        // Lane background with flash effect
        const flash = this.laneFlash[index] || 0;
        const baseColor = flash > 0
            ? this.lerpColor('#2E7D32', lane.instrument.color, flash)
            : '#2E7D32';

        ctx.fillStyle = baseColor;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(lane.x, 0, lane.width, this.height);
        ctx.globalAlpha = 1;

        // Lane divider
        ctx.strokeStyle = '#1B5E20';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lane.x, 0);
        ctx.lineTo(lane.x, this.height);
        ctx.stroke();
    }

    /**
     * Draw a note
     */
    drawNote(note) {
        const lane = this.lanes[note.laneId];
        const ctx = this.renderer.ctx;

        // Note glow
        ctx.shadowColor = lane.instrument.color;
        ctx.shadowBlur = 15;

        // Draw note based on type
        ctx.fillStyle = lane.instrument.color;
        ctx.beginPath();

        // Circular note
        const radius = 25;
        ctx.arc(lane.centerX, note.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner highlight
        ctx.fillStyle = this.lightenColor(lane.instrument.color, 40);
        ctx.beginPath();
        ctx.arc(lane.centerX - 5, note.y - 5, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Reset shadow
        ctx.shadowBlur = 0;

        // Instrument symbol
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(lane.instrument.symbol, lane.centerX, note.y);
    }

    /**
     * Draw hit zone
     */
    drawHitZone() {
        const ctx = this.renderer.ctx;
        const hitY = this.height - 60;

        // Hit zone bar
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(0, hitY - 10, this.width, 20);

        // Hit zone markers
        this.lanes.forEach(lane => {
            ctx.fillStyle = lane.instrument.color;
            ctx.beginPath();
            ctx.arc(lane.centerX, hitY, 20, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();
        });
    }

    /**
     * Draw hit effect
     */
    drawHitEffect(effect) {
        const ctx = this.renderer.ctx;
        ctx.globalAlpha = effect.life * 2;

        ctx.strokeStyle = effect.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, 30 * effect.scale, 0, Math.PI * 2);
        ctx.stroke();

        // Text effect
        if (effect.type === 'perfect') {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('PERFECT!', effect.x, effect.y - 40 * effect.scale);
        }

        ctx.globalAlpha = 1;
    }

    /**
     * Render HUD
     */
    renderHUD() {
        // Score
        this.renderer.drawText(`${this.score}`, this.width / 2, 30, {
            font: 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif',
            color: '#FFD700'
        });

        // Combo
        if (this.combo > 1) {
            this.renderer.drawText(`${this.combo}x COMBO`, this.width / 2, 60, {
                font: 'bold 22px -apple-system, BlinkMacSystemFont, sans-serif',
                color: '#FF9800'
            });
        }

        // Key hints at bottom
        const hintY = this.height - 15;
        this.lanes.forEach((lane, index) => {
            this.renderer.drawText(lane.keyHint, lane.centerX, hintY, {
                font: 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif',
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'center'
            });
        });

        // Instruments legend on side
        this.instruments.slice(0, this.instrumentCount).forEach((inst, i) => {
            const x = 15;
            const y = 80 + i * 25;

            this.renderer.ctx.fillStyle = inst.color;
            this.renderer.ctx.beginPath();
            this.renderer.ctx.arc(x, y, 6, 0, Math.PI * 2);
            this.renderer.ctx.fill();

            this.renderer.drawText(`${inst.name}`, x + 15, y + 5, {
                font: '12px -apple-system, BlinkMacSystemFont, sans-serif',
                color: '#fff'
            });
        });
    }

    /**
     * Lighten a hex color
     */
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    /**
     * Lerp between two colors
     */
    lerpColor(color1, color2, t) {
        const c1 = parseInt(color1.replace('#', ''), 16);
        const c2 = parseInt(color2.replace('#', ''), 16);

        const r1 = (c1 >> 16) & 0xff;
        const g1 = (c1 >> 8) & 0xff;
        const b1 = c1 & 0xff;

        const r2 = (c2 >> 16) & 0xff;
        const g2 = (c2 >> 8) & 0xff;
        const b2 = c2 & 0xff;

        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);

        return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
    }

    /**
     * Set up input handlers
     */
    setupInput() {
        const canvas = this.canvas;

        // Mouse events
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleInput(x, y);
        });

        // Touch events
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            this.handleInput(x, y);
        }, { passive: false });

        // Keyboard events
        this.handleKeyDown = (e) => {
            this.onKeyDown(e.key);
        };
        document.addEventListener('keydown', this.handleKeyDown);
    }

    /**
     * Start the game
     */
    start() {
        super.start();
        this.setupInput();
    }

    /**
     * Clean up
     */
    destroy() {
        if (this.canvas) {
            this.canvas.removeEventListener('mousedown', this.handleInput);
            this.canvas.removeEventListener('touchstart', this.handleInput);
        }
        if (this.handleKeyDown) {
            document.removeEventListener('keydown', this.handleKeyDown);
        }
        super.destroy();
    }

    /**
     * Get result data
     */
    getResult() {
        return {
            gameId: this.gameId,
            level: this.level,
            score: this.score,
            stars: this.stars,
            highScore: this.highScore,
            maxCombo: this.maxCombo,
            perfectHits: this.perfectHits,
            goodHits: this.goodHits,
            misses: this.misses,
            elapsedTime: this.elapsedTime,
            isNewHighScore: this.score > this.highScore
        };
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MusicBand;
}

// Register globally for browser use
if (typeof window !== 'undefined') {
    window.MusicBand = MusicBand;
    if (window.GameRegistry) {
        GameRegistry.register('music-band', MusicBand);
    }
}