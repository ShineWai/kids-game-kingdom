/**
 * Bubble Pop Game - Pop colorful bubbles before they escape!
 */

class BubblePop extends GameBase {
    constructor(level = 1) {
        super('bubble-pop', level);

        // Level configuration
        const levelConfigs = [
            { bubbles: 5,  speed: 0.3,  special: 'none',     target: 5  },
            { bubbles: 8,  speed: 0.3,  special: 'none',     target: 8  },
            { bubbles: 10, speed: 0.5,  special: 'none',     target: 10 },
            { bubbles: 10, speed: 0.5,  special: 'gold',     target: 12 },
            { bubbles: 12, speed: 0.7,  special: 'gold',     target: 15 },
            { bubbles: 12, speed: 0.7,  special: 'bomb',    target: 15 },
            { bubbles: 15, speed: 0.7,  special: 'bomb+gold', target: 18 },
            { bubbles: 15, speed: 0.9,  special: 'all',     target: 20 },
            { bubbles: 18, speed: 0.9,  special: 'all',     target: 22 },
            { bubbles: 20, speed: 1.2,  special: 'ultimate', target: 25 }
        ];

        const config = levelConfigs[level - 1] || levelConfigs[9];
        this.bubbleCount = config.bubbles;
        this.bubbleSpeed = config.speed;
        this.specialType = config.special;
        this.targetScore = config.target;

        // Game state
        this.bubbles = [];
        this.particles = [];
        this.combo = 0;
        this.comboTimer = 0;
        this.bubblesPopped = 0;
        this.totalBubbles = config.bubbles;
        this.gameCompleteCalled = false;

        // Bubble colors
        this.colors = ['#EF5350', '#FFB74D', '#4FC3F7', '#66BB6A'];
        this.specialColors = {
            gold: '#FFD700',
            bomb: '#37474F',
            rainbow: 'rainbow'
        };

        // Input handling
        this.handleInput = this.handleInput.bind(this);
    }

    /**
     * Initialize game elements
     */
    initElements() {
        this.bubbles = [];
        this.particles = [];
        this.combo = 0;
        this.comboTimer = 0;
        this.bubblesPopped = 0;
        this.gameCompleteCalled = false;
        this.spawnedCount = 0;
        this.lastSpawnTime = 0;
        this.spawnInterval = 1500 - (this.level * 100);

        // Spawn initial bubbles
        for (let i = 0; i < Math.min(3, this.bubbleCount); i++) {
            this.spawnBubble();
        }
    }

    /**
     * Spawn a new bubble
     */
    spawnBubble() {
        if (this.spawnedCount >= this.bubbleCount) return;

        const radius = Utils.random(25, 40);
        const x = Utils.random(radius + 10, this.width - radius - 10);
        const y = this.height + radius + 10;

        // Determine bubble type
        let type = 'normal';
        let color = Utils.randomItem(this.colors);

        if (this.specialType !== 'none') {
            const rand = Math.random();
            if (this.specialType === 'gold' || this.specialType === 'bomb+gold' || this.specialType === 'all' || this.specialType === 'ultimate') {
                if (rand < 0.1) {
                    type = 'gold';
                    color = this.specialColors.gold;
                }
            }
            if (this.specialType === 'bomb' || this.specialType === 'bomb+gold' || this.specialType === 'all' || this.specialType === 'ultimate') {
                if (rand < 0.08) {
                    type = 'bomb';
                    color = this.specialColors.bomb;
                }
            }
            if (this.specialType === 'all' || this.specialType === 'ultimate') {
                if (rand < 0.05) {
                    type = 'rainbow';
                    color = this.specialColors.rainbow;
                }
            }
        }

        const bubble = {
            x,
            y,
            radius,
            color,
            type,
            speed: this.bubbleSpeed + Utils.randomFloat(-0.1, 0.1),
            wobble: Utils.randomFloat(0, Math.PI * 2),
            wobbleSpeed: Utils.randomFloat(0.02, 0.05),
            alpha: 1,
            scale: 1
        };

        this.bubbles.push(bubble);
        this.spawnedCount++;
    }

    /**
     * Update game state
     */
    update(deltaTime) {
        if (this.state !== 'playing') return;

        // Spawn new bubbles
        const now = Date.now();
        if (this.spawnedCount < this.bubbleCount && now - this.lastSpawnTime > this.spawnInterval) {
            this.spawnBubble();
            this.lastSpawnTime = now;
        }

        // Update bubbles
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const bubble = this.bubbles[i];

            // Rise upward
            bubble.y -= bubble.speed;

            // Wobble effect
            bubble.wobble += bubble.wobbleSpeed;
            bubble.x += Math.sin(bubble.wobble) * 0.5;

            // Remove bubbles that escaped
            if (bubble.y < -bubble.radius * 2) {
                this.bubbles.splice(i, 1);
                this.bubblesPopped++;
            }
        }

        // Update combo timer
        if (this.combo > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // gravity
            p.alpha -= 0.02;
            p.radius *= 0.98;

            if (p.alpha <= 0 || p.radius < 1) {
                this.particles.splice(i, 1);
            }
        }

        // Check game over conditions
        this.checkGameOver();
    }

    /**
     * Check if game should end
     */
    checkGameOver() {
        // Win: popped enough bubbles with target score
        if (this.score >= this.targetScore && this.bubblesPopped >= this.bubbleCount - 2) {
            this.win();
            return;
        }

        // Lose: ran out of bubbles and didn't meet target
        if (this.spawnedCount >= this.bubbleCount && this.bubbles.length === 0) {
            if (this.score < this.targetScore) {
                this.lose();
            }
        }
    }

    /**
     * Handle win condition
     */
    win() {
        if (this.gameCompleteCalled) return;
        this.gameCompleteCalled = true;

        this.calculateStars();
        this.saveProgress();

        // Fire combo effect if active
        if (this.combo >= 3) {
            this.triggerFireCombo();
        }

        setTimeout(() => {
            this.end();
            if (this.onGameOver) {
                this.onGameOver(this.getResult());
            }
        }, 500);
    }

    /**
     * Handle lose condition
     */
    lose() {
        if (this.gameCompleteCalled) return;
        this.gameCompleteCalled = true;

        this.stars = 0;
        this.saveProgress();

        setTimeout(() => {
            this.end();
            if (this.onGameOver) {
                this.onGameOver(this.getResult());
            }
        }, 500);
    }

    /**
     * Calculate stars based on percentage
     */
    calculateStars() {
        const percentage = this.score / this.targetScore;
        this.stars = this.starsFromPercentage(percentage);
    }

    /**
     * Calculate stars from percentage
     */
    starsFromPercentage(percentage) {
        if (percentage >= 1.5) return 3;
        if (percentage >= 1.2) return 2;
        if (percentage >= 1.0) return 1;
        return 0;
    }

    /**
     * Handle input (touch/mouse)
     */
    handleInput(x, y) {
        if (this.state !== 'playing') return;

        // Check bubble hits (reverse order for top-most first)
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const bubble = this.bubbles[i];
            const dist = Utils.distance(x, y, bubble.x, bubble.y);

            if (dist < bubble.radius * bubble.scale) {
                this.popBubble(bubble, i);
                break;
            }
        }
    }

    /**
     * Pop a bubble
     */
    popBubble(bubble, index) {
        // Create particles
        this.createParticles(bubble.x, bubble.y, bubble.color, bubble.type);

        // Handle different bubble types
        switch (bubble.type) {
            case 'normal':
                this.addScore(1);
                this.combo = 0;
                Audio.playSound(Constants.AUDIO.CLICK);
                break;

            case 'gold':
                this.addScore(2);
                this.combo = 0;
                Audio.playStar();
                break;

            case 'bomb':
                this.addScore(-3);
                this.combo = 0;
                Audio.playSound(Constants.AUDIO.ERROR);
                Audio.vibrateError();
                break;

            case 'rainbow':
                this.triggerRainbow();
                this.combo++;
                this.comboTimer = 1.5;
                Audio.playSound(Constants.AUDIO.SUCCESS);
                break;
        }

        // Check for fire combo
        if (this.combo >= 3) {
            this.triggerFireCombo();
        }

        // Remove bubble
        this.bubbles.splice(index, 1);
        this.bubblesPopped++;
    }

    /**
     * Create pop particles
     */
    createParticles(x, y, color, type) {
        const count = type === 'rainbow' ? 20 : 10;
        const colors = type === 'rainbow'
            ? ['#EF5350', '#FFB74D', '#4FC3F7', '#66BB6A', '#FFD700']
            : [color];

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Utils.randomFloat(-0.3, 0.3);
            const speed = Utils.randomFloat(2, 5);

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                radius: Utils.random(3, 8),
                color: Utils.randomItem(colors),
                alpha: 1
            });
        }
    }

    /**
     * Trigger rainbow effect
     */
    triggerRainbow() {
        // Clear nearby bubbles for combo attack
        const range = 100;
        const hitBubbles = [];

        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const bubble = this.bubbles[i];
            if (bubble.type === 'normal') {
                const dist = Utils.distance(this.bubbles[i].x, this.bubbles[i].y, this.bubbles.length > 0 ? this.bubbles[0].x : 0, 0);
                if (dist < range || this.combo >= 3) {
                    hitBubbles.push({ bubble, index: i });
                }
            }
        }

        hitBubbles.forEach(({ bubble, index }) => {
            this.createParticles(bubble.x, bubble.y, bubble.color, 'rainbow');
            this.addScore(1);
            this.bubbles.splice(index, 1);
            this.bubblesPopped++;
        });
    }

    /**
     * Trigger fire combo effect
     */
    triggerFireCombo() {
        // Range clear - pop all bubbles within range
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const range = 150;

        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const bubble = this.bubbles[i];
            const dist = Utils.distance(bubble.x, bubble.y, centerX, centerY);

            if (dist < range) {
                this.createParticles(bubble.x, bubble.y, bubble.color, 'fire');
                this.addScore(bubble.type === 'gold' ? 2 : 1);
                this.bubbles.splice(i, 1);
                this.bubblesPopped++;
            }
        }

        Audio.playSound(Constants.AUDIO.LEVEL_UP);
        Audio.vibrateSuccess();
    }

    /**
     * Render game
     */
    render() {
        // Clear with gradient background
        this.renderer.drawGradient(0, 0, this.width, this.height, '#E3F2FD', '#BBDEFB');

        // Draw bubbles
        this.bubbles.forEach(bubble => {
            this.renderBubble(bubble);
        });

        // Draw particles
        this.particles.forEach(p => {
            this.renderer.ctx.globalAlpha = p.alpha;
            this.renderer.drawCircle(p.x, p.y, p.radius, p.color);
        });
        this.renderer.ctx.globalAlpha = 1;

        // Draw HUD
        this.renderHUD();
    }

    /**
     * Render a single bubble
     */
    renderBubble(bubble) {
        const { x, y, radius, color, type, alpha, scale } = bubble;
        const r = radius * scale;

        this.renderer.save();
        this.renderer.ctx.globalAlpha = alpha;

        // Draw bubble body
        if (type === 'rainbow') {
            // Rainbow gradient bubble
            const gradient = this.renderer.ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.3, '#EF5350');
            gradient.addColorStop(0.5, '#FFB74D');
            gradient.addColorStop(0.7, '#4FC3F7');
            gradient.addColorStop(1, '#66BB6A');
            this.renderer.ctx.fillStyle = gradient;
        } else {
            // Solid or special bubble
            const gradient = this.renderer.ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
            gradient.addColorStop(0, this.lightenColor(color, 40));
            gradient.addColorStop(0.7, color);
            gradient.addColorStop(1, this.darkenColor(color, 20));
            this.renderer.ctx.fillStyle = gradient;
        }

        this.renderer.ctx.beginPath();
        this.renderer.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.renderer.ctx.fill();

        // Draw highlight
        this.renderer.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.renderer.ctx.beginPath();
        this.renderer.ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.25, 0, Math.PI * 2);
        this.renderer.ctx.fill();

        // Draw special indicators
        if (type === 'gold') {
            this.renderer.drawEmoji('⭐', x, y, r * 0.8);
        } else if (type === 'bomb') {
            this.renderer.drawEmoji('💣', x, y, r * 0.8);
        } else if (type === 'rainbow') {
            this.renderer.drawEmoji('🌈', x, y, r * 0.8);
        }

        this.renderer.restore();
    }

    /**
     * Render HUD
     */
    renderHUD() {
        // Score
        this.renderer.drawText(`分數: ${this.score}`, 80, 30, {
            font: 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif',
            color: '#37474F'
        });

        // Target
        this.renderer.drawText(`目標: ${this.targetScore}`, this.width - 80, 30, {
            font: '18px -apple-system, BlinkMacSystemFont, sans-serif',
            color: '#546E7A'
        });

        // Combo indicator
        if (this.combo >= 2) {
            this.renderer.drawText(`${this.combo}x 連擊!`, this.width / 2, 60, {
                font: 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif',
                color: '#FF6F00'
            });
        }

        // Progress bar
        const barWidth = 200;
        const barHeight = 10;
        const barX = (this.width - barWidth) / 2;
        const barY = this.height - 30;
        const progress = Math.min(this.score / this.targetScore, 1);

        this.renderer.drawRect(barX, barY, barWidth, barHeight, '#CFD8DC', 5);
        this.renderer.drawRect(barX, barY, barWidth * progress, barHeight, progress >= 1 ? '#66BB6A' : '#4FC3F7', 5);

        // Bubbles remaining
        const remaining = this.bubbleCount - this.bubblesPopped;
        this.renderer.drawText(`剩下: ${remaining}`, this.width / 2, barY - 10, {
            font: '14px -apple-system, BlinkMacSystemFont, sans-serif',
            color: '#78909C'
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
     * Darken a hex color
     */
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
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
            targetScore: this.targetScore,
            elapsedTime: this.elapsedTime,
            isNewHighScore: this.score > this.highScore,
            isWin: this.score >= this.targetScore
        };
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
        super.destroy();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BubblePop;
}

// Register globally for browser use
if (typeof window !== 'undefined') {
    window.BubblePop = BubblePop;
    if (window.GameRegistry) {
        GameRegistry.register('bubble-pop', BubblePop);
    }
}