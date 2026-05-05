/**
 * Little Astronaut - Jump between space platforms!
 */
class LittleAstronaut extends GameBase {
    constructor(gameId, levelOrOptions) {
        super(gameId, levelOrOptions);
        const configs = [
            { platforms: 5,  gap: 60,  speed: 0.5,  target: 4  },
            { platforms: 6,  gap: 65,  speed: 0.6,  target: 5  },
            { platforms: 7,  gap: 70,  speed: 0.7,  target: 6  },
            { platforms: 7,  gap: 75,  speed: 0.8,  target: 6  },
            { platforms: 8,  gap: 80,  speed: 0.9,  target: 7  },
            { platforms: 8,  gap: 85,  speed: 1.0,  target: 7  },
            { platforms: 9,  gap: 90,  speed: 1.1,  target: 8  },
            { platforms: 9,  gap: 95,  speed: 1.2,  target: 8  },
            { platforms: 10, gap: 100, speed: 1.3,  target: 9  },
            { platforms: 10, gap: 105, speed: 1.5,  target: 10 }
        ];
        const cfg = configs[Math.min(this.level - 1, 9)];
        this.numPlatforms = cfg.platforms;
        this.platformGap = cfg.gap;
        this.scrollSpeed = cfg.speed;
        this.targetPlatforms = cfg.target;

        this.astro = { x: this.width / 2, y: this.height - 120, vy: 0, onGround: true };
        this.platforms = [];
        this.stars_collected = [];
        this.particles = [];
        this.cameraY = 0;
        this.platformsReached = 0;
        this.highestPlatform = 0;
    }

    initElements() {
        this.astro = { x: this.width / 2, y: this.height - 120, vy: 0, onGround: true };
        this.platforms = []; this.stars_collected = []; this.particles = [];
        this.cameraY = 0; this.platformsReached = 0; this.highestPlatform = 0;

        // Generate platforms going upward
        for (let i = 0; i < this.numPlatforms; i++) {
            this.platforms.push({
                x: Utils.random(20, this.width - 100),
                y: this.height - 140 - i * this.platformGap,
                w: Utils.random(55, 90), h: 14,
                visited: false, color: ['#FFB74D','#4FC3F7','#AB47BC','#66BB6A'][i % 4]
            });
        }
    }

    update(deltaTime) {
        if (this.state !== 'playing' || this.gameCompleteCalled) return;

        // Gravity
        if (!this.astro.onGround) {
            this.astro.vy += 0.6;
            this.astro.y += this.astro.vy;
        }

        // Camera follows astronaut upward
        if (this.astro.y < this.height / 3) {
            this.cameraY += (this.height / 3 - this.astro.y) * 0.1;
            this.astro.y = this.height / 3;
        }

        // Check platform collisions
        this.astro.onGround = false;
        for (const p of this.platforms) {
            const py = p.y - this.cameraY;
            if (this.astro.vy > 0 &&
                this.astro.x > p.x - 10 && this.astro.x < p.x + p.w + 10 &&
                this.astro.y + 20 >= py && this.astro.y + 20 <= py + p.h + 10) {
                this.astro.y = py - 20;
                this.astro.vy = 0;
                this.astro.onGround = true;
                if (!p.visited) {
                    p.visited = true;
                    this.platformsReached++;
                    this.addScore(10);
                    this._sparkle(p.x + p.w / 2, py);
                    Audio.playStar();
                }
            }
        }

        // Fall off bottom
        if (this.astro.y > this.height + 40) {
            this._endGame();
            return;
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.y += p.vy; p.alpha -= 0.03;
            if (p.alpha <= 0) this.particles.splice(i, 1);
        }

        // Win check
        if (this.platformsReached >= this.targetPlatforms && this.astro.onGround) {
            this.stars = this.platformsReached >= this.numPlatforms ? 3 : this.platformsReached >= this.targetPlatforms * 1.2 ? 2 : 1;
            Audio.playSuccessMelody();
            setTimeout(() => this.end(), 600);
        }
    }

    _endGame() {
        this.stars = this.platformsReached >= this.targetPlatforms * 0.5 ? 1 : 0;
        if (this.stars === 0) Audio.playGameOver();
        setTimeout(() => this.end(), 600);
    }

    _sparkle(x, y) {
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x, y,
                vy: Utils.randomFloat(-3, -1),
                alpha: 1, color: '#FFD700'
            });
        }
    }
    calculateStars() {}

    render() {
        this.renderer.drawGradient(0, 0, this.width, this.height, '#0D0D2B', '#1A1A4E');
        const ctx = this.renderer.ctx;

        // Background stars
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 50; i++) {
            const sx = (i * 173 + 30) % this.width;
            const sy = ((i * 89) - this.cameraY * 0.3 + this.height * 5) % this.height;
            ctx.globalAlpha = 0.3 + (i % 5) * 0.15;
            ctx.beginPath(); ctx.arc(sx, sy, 0.5 + (i % 4) * 0.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Platforms
        this.platforms.forEach(p => {
            const py = p.y - this.cameraY;
            if (py > -50 && py < this.height + 50) {
                this.renderer.drawRect(p.x, py, p.w, p.h, p.color, 6);
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.fillRect(p.x + 2, py, p.w - 4, p.h / 2);
                if (p.visited) {
                    ctx.strokeStyle = 'rgba(255,215,0,0.5)'; ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.arc(p.x + p.w / 2, py + p.h / 2, 14, 0, Math.PI * 2); ctx.stroke();
                }
            }
        });

        // Astronaut
        const ax = this.astro.x, ay = this.astro.y;
        ctx.fillStyle = '#FFF';
        ctx.beginPath(); ctx.arc(ax, ay - 12, 14, 0, Math.PI * 2); ctx.fill(); // helmet
        ctx.fillStyle = '#FFCC80';
        ctx.beginPath(); ctx.arc(ax, ay - 12, 9, 0, Math.PI * 2); ctx.fill(); // face
        ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(ax - 3, ay - 14, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ax + 3, ay - 14, 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#E0E0E0';
        ctx.fillRect(ax - 10, ay + 2, 20, 18); // body
        ctx.fillStyle = '#B0BEC5';
        ctx.fillRect(ax - 12, ay + 5, 6, 14); // left arm
        ctx.fillRect(ax + 6, ay + 5, 6, 14); // right arm
        ctx.fillRect(ax - 6, ay + 20, 6, 12); // left leg
        ctx.fillRect(ax + 1, ay + 20, 6, 12); // right leg

        // Jet particles when in air
        if (!this.astro.onGround) {
            ctx.fillStyle = '#FF9800'; ctx.globalAlpha = 0.6;
            ctx.beginPath(); ctx.arc(ax - 3, ay + 34, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(ax + 5, ay + 34, 3, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Sparkle particles
        this.particles.forEach(p => {
            ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1;

        this.renderer.drawText('站台: ' + this.platformsReached + '/' + this.targetPlatforms, this.width / 2, 24, { font: 'bold 16px sans-serif', color: '#FFF' });
        this.renderer.drawText('分數: ' + this.score, 55, 24, { font: 'bold 14px sans-serif', color: '#FFD700', align: 'left' });
    }

    _move(dir) {
        this.astro.x += dir * 30;
        this.astro.x = Utils.clamp(this.astro.x, 10, this.width - 10);
    }

    _jump() {
        if (this.astro.onGround) {
            this.astro.vy = -10;
            this.astro.onGround = false;
            Audio.playSound(Constants.AUDIO.CLICK);
        }
    }

    _onTap = (e) => {
        const r = this.canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
        if (x < this.width / 2) { this._move(-1); } else { this._move(1); }
        this._jump();
    };
    _onTTap = (e) => { e.preventDefault(); this._onTap(e); };

    start() { super.start(); this.canvas.addEventListener('mousedown', this._onTap); this.canvas.addEventListener('touchstart', this._onTTap, { passive: false }); }
    destroy() { if (this.canvas) { this.canvas.removeEventListener('mousedown', this._onTap); this.canvas.removeEventListener('touchstart', this._onTTap); } super.destroy(); }
}

if (typeof window !== 'undefined') { window.LittleAstronaut = LittleAstronaut; window.Astronaut = LittleAstronaut; if (window.GameRegistry) GameRegistry.register('astronaut', LittleAstronaut); }
