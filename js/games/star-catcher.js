/**
 * Star Catcher - Catch falling stars with your fairy!
 */
class StarCatcher extends GameBase {
    constructor(gameId, levelOrOptions) {
        super(gameId, levelOrOptions);
        const configs = [
            { stars: 10, fallSpd: 0.5,  clouds: 2, target: 8  },
            { stars: 12, fallSpd: 0.6,  clouds: 2, target: 10 },
            { stars: 15, fallSpd: 0.7,  clouds: 3, target: 12 },
            { stars: 15, fallSpd: 0.8,  clouds: 3, target: 15 },
            { stars: 18, fallSpd: 0.9,  clouds: 4, target: 18 },
            { stars: 20, fallSpd: 1.0,  clouds: 4, target: 20 },
            { stars: 22, fallSpd: 1.1,  clouds: 5, target: 22 },
            { stars: 25, fallSpd: 1.2,  clouds: 5, target: 25 },
            { stars: 25, fallSpd: 1.4,  clouds: 6, target: 28 },
            { stars: 30, fallSpd: 1.5,  clouds: 6, target: 30 }
        ];
        const cfg = configs[Math.min(this.level - 1, 9)];
        this.maxStars = cfg.stars;
        this.fallSpeed = cfg.fallSpd;
        this.maxClouds = cfg.clouds;
        this.targetScore = cfg.target;
        this.items = [];
        this.particles = [];
        this.fairyX = this.width / 2;
        this.fairyY = this.height - 90;
        this.isDragging = false;
        this.spawnedStars = 0;
        this.spawnedClouds = 0;
        this.lastSpawnTime = 0;
        this.spawnInterval = Math.max(400, 1200 - this.level * 80);
        this.totalCaught = 0;
    }

    initElements() {
        this.items = [];
        this.particles = [];
        this.fairyX = this.width / 2;
        this.isDragging = false;
        this.spawnedStars = 0;
        this.spawnedClouds = 0;
        this.lastSpawnTime = 0;
        this.totalCaught = 0;
    }

    update(deltaTime) {
        if (this.state !== 'playing') return;
        if (Date.now() - this.lastSpawnTime > this.spawnInterval) {
            if (this.spawnedStars < this.maxStars || this.spawnedClouds < this.maxClouds) {
                const spawnStar = this.spawnedStars < this.maxStars && (Math.random() < 0.7 || this.spawnedClouds >= this.maxClouds);
                if (spawnStar) {
                    this.items.push({ type: 'star', x: Utils.random(20, this.width - 20), y: -20, r: Utils.random(11, 18), speed: this.fallSpeed + Utils.randomFloat(-0.1, 0.2), wobble: Utils.randomFloat(0, Math.PI * 2), wobbleSpeed: Utils.randomFloat(0.01, 0.03) });
                    this.spawnedStars++;
                } else {
                    this.items.push({ type: 'cloud', x: Utils.random(30, this.width - 30), y: -30, r: Utils.random(22, 32), speed: this.fallSpeed * 0.8 + Utils.randomFloat(-0.05, 0.1), wobble: Utils.randomFloat(0, Math.PI * 2), wobbleSpeed: Utils.randomFloat(0.005, 0.02) });
                    this.spawnedClouds++;
                }
                this.lastSpawnTime = Date.now();
            }
        }
        for (let i = this.items.length - 1; i >= 0; i--) {
            const it = this.items[i];
            it.y += it.speed;
            it.wobble += it.wobbleSpeed;
            it.x += Math.sin(it.wobble) * 0.4;
            if (it.y > this.height + 50) { this.items.splice(i, 1); continue; }
            const dist = Utils.distance(it.x, it.y, this.fairyX, this.fairyY);
            if (dist < 35 + it.r) {
                if (it.type === 'star') { this.addScore(1); this.totalCaught++; this._sparkle(it.x, it.y, '#FFD700', 8); Audio.playStar(); }
                else { this.addScore(-3); this._sparkle(it.x, it.y, '#546E7A', 6); Audio.playError(); Audio.vibrateError(); }
                this.items.splice(i, 1);
            }
        }
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.alpha -= 0.025;
            if (p.alpha <= 0) this.particles.splice(i, 1);
        }
        this._checkGameOver();
    }

    _checkGameOver() {
        if (this.gameCompleteCalled) return;
        if (this.spawnedStars >= this.maxStars && this.spawnedClouds >= this.maxClouds && this.items.length === 0) {
            this.calculateStars();
            if (this.stars > 0) { Audio.playSuccessMelody(); } else { Audio.playGameOver(); }
            setTimeout(() => this.end(), 700);
        }
    }

    _sparkle(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const a = (Math.PI * 2 / count) * i;
            const s = Utils.randomFloat(1.5, 4);
            this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, color, alpha: 1 });
        }
    }

    calculateStars() {
        const pct = this.score / this.targetScore;
        this.stars = pct >= 1.5 ? 3 : pct >= 1.2 ? 2 : pct >= 1.0 ? 1 : 0;
    }

    render() {
        const ctx = this.renderer.ctx;
        this.renderer.drawGradient(0, 0, this.width, this.height, '#0D1B2A', '#1B2838');
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 40; i++) {
            const sx = (i * 137 + 50) % this.width, sy = (i * 97 + 30) % this.height;
            const flicker = 0.4 + 0.6 * Math.abs(Math.sin(Date.now() * 0.001 + i));
            ctx.globalAlpha = flicker * 0.7;
            ctx.beginPath(); ctx.arc(sx, sy, 1 + (i % 3) * 0.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        this.items.forEach(it => {
            if (it.type === 'star') { this.renderer.drawEmoji('⭐', it.x, it.y, it.r * 2); }
            else {
                ctx.fillStyle = '#546E7A';
                ctx.beginPath(); ctx.arc(it.x - it.r * 0.3, it.y, it.r * 0.8, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(it.x + it.r * 0.4, it.y - it.r * 0.1, it.r * 0.7, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(it.x, it.y + it.r * 0.2, it.r * 0.75, 0, Math.PI * 2); ctx.fill();
            }
        });
        this.particles.forEach(p => { ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill(); });
        ctx.globalAlpha = 1;
        this._drawFairy();
        this.renderer.drawText('分數: ' + this.score, 60, 24, { font: 'bold 18px sans-serif', color: '#FFD700', align: 'left' });
        this.renderer.drawText('目標: ' + this.targetScore, this.width - 60, 24, { font: '16px sans-serif', color: '#FFF', align: 'right' });
        this.renderer.drawText('抓到: ' + this.totalCaught + '/' + this.maxStars, this.width / 2, this.height - 16, { font: '14px sans-serif', color: '#8892B0' });
    }

    _drawFairy() {
        const { renderer: rd, fairyX: x, fairyY: y } = this;
        const ctx = rd.ctx; rd.save();
        ctx.shadowColor = 'rgba(255,215,0,0.4)'; ctx.shadowBlur = 15;
        ctx.fillStyle = '#FFF9C4';
        ctx.beginPath(); ctx.ellipse(x - 14, y - 5, 10, 16, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 14, y - 5, 10, 16, 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFB74D'; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFCC80'; ctx.beginPath(); ctx.arc(x, y - 18, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(x - 5, y - 20, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x + 5, y - 20, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y - 14, 6, 0.2, Math.PI - 0.2); ctx.stroke();
        ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 10, y - 5); ctx.lineTo(x + 22, y - 28); ctx.stroke();
        ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(x + 22, y - 28, 4, 0, Math.PI * 2); ctx.fill();
        rd.restore();
    }

    _getX(e) { const r = this.canvas.getBoundingClientRect(); const cx = e.touches ? e.touches[0].clientX : e.clientX; return Utils.clamp(cx - r.left, 30, this.width - 30); }
    _onDown = (e) => { this.isDragging = true; this.fairyX = this._getX(e); };
    _onMove = (e) => { if (this.isDragging) this.fairyX = this._getX(e); };
    _onUp = () => { this.isDragging = false; };
    _onTDown = (e) => { e.preventDefault(); this.isDragging = true; this.fairyX = this._getX(e); };
    _onTMove = (e) => { e.preventDefault(); if (this.isDragging) this.fairyX = this._getX(e); };
    _onTUp = () => { this.isDragging = false; };

    start() {
        super.start();
        this.canvas.addEventListener('mousedown', this._onDown);
        this.canvas.addEventListener('mousemove', this._onMove);
        this.canvas.addEventListener('mouseup', this._onUp);
        this.canvas.addEventListener('touchstart', this._onTDown, { passive: false });
        this.canvas.addEventListener('touchmove', this._onTMove, { passive: false });
        this.canvas.addEventListener('touchend', this._onTUp);
    }

    destroy() {
        if (this.canvas) {
            const c = this.canvas;
            c.removeEventListener('mousedown', this._onDown); c.removeEventListener('mousemove', this._onMove); c.removeEventListener('mouseup', this._onUp);
            c.removeEventListener('touchstart', this._onTDown); c.removeEventListener('touchmove', this._onTMove); c.removeEventListener('touchend', this._onTUp);
        }
        super.destroy();
    }
}

if (typeof window !== 'undefined') {
    window.StarCatcher = StarCatcher;
    if (window.GameRegistry) GameRegistry.register('star-catcher', StarCatcher);
}
