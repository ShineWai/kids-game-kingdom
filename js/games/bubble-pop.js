/**
 * Bubble Pop - Pop colorful bubbles before they escape!
 * Extends GameBase
 */
class BubblePop extends GameBase {
    constructor(gameId, levelOrOptions) {
        super(gameId, levelOrOptions);

        const configs = [
            { bubbles: 5,  speed: 0.3, special: 'none',      target: 5  },
            { bubbles: 8,  speed: 0.3, special: 'none',      target: 8  },
            { bubbles: 10, speed: 0.5, special: 'none',      target: 10 },
            { bubbles: 10, speed: 0.5, special: 'gold',      target: 12 },
            { bubbles: 12, speed: 0.7, special: 'gold',      target: 15 },
            { bubbles: 12, speed: 0.7, special: 'bomb',      target: 15 },
            { bubbles: 15, speed: 0.7, special: 'bomb+gold', target: 18 },
            { bubbles: 15, speed: 0.9, special: 'all',       target: 20 },
            { bubbles: 18, speed: 0.9, special: 'all',       target: 22 },
            { bubbles: 20, speed: 1.2, special: 'ultimate',  target: 25 }
        ];

        const cfg = configs[Math.min(this.level - 1, 9)];
        this.maxBubbles = cfg.bubbles;
        this.bubbleSpeed = cfg.speed;
        this.specialType = cfg.special;
        this.targetScore = cfg.target;

        this.colors = ['#EF5350', '#FFB74D', '#4FC3F7', '#66BB6A'];
        this.bubbles = [];
        this.particles = [];
        this.combo = 0;
        this.comboTimer = 0;
        this.bubblesPopped = 0;
        this.spawnedCount = 0;
        this.lastSpawnTime = 0;
        this.spawnInterval = Math.max(600, 1500 - this.level * 100);

        this._inputHandler = this._handleInput.bind(this);
    }

    initElements() {
        this.bubbles = [];
        this.particles = [];
        this.combo = 0;
        this.comboTimer = 0;
        this.bubblesPopped = 0;
        this.spawnedCount = 0;
        this.lastSpawnTime = 0;
        for (let i = 0; i < 3; i++) this._spawnBubble();
    }

    _spawnBubble() {
        if (this.spawnedCount >= this.maxBubbles) return;
        const r = Utils.random(25, 40);
        const x = Utils.random(r + 10, this.width - r - 10);
        const y = this.height + r + 10;
        let type = 'normal';
        let color = Utils.randomItem(this.colors);

        if (this.specialType !== 'none') {
            const rand = Math.random();
            const hasGold = ['gold','bomb+gold','all','ultimate'].includes(this.specialType);
            const hasBomb = ['bomb','bomb+gold','all','ultimate'].includes(this.specialType);
            const hasRainbow = ['all','ultimate'].includes(this.specialType);
            if (hasGold && rand < 0.1) { type = 'gold'; color = '#FFD700'; }
            else if (hasBomb && rand < 0.08) { type = 'bomb'; color = '#37474F'; }
            else if (hasRainbow && rand < 0.05) { type = 'rainbow'; color = 'rainbow'; }
        }

        this.bubbles.push({
            x, y, radius: r, color, type,
            speed: this.bubbleSpeed + Utils.randomFloat(-0.1, 0.1),
            wobble: Utils.randomFloat(0, Math.PI * 2),
            wobbleSpeed: Utils.randomFloat(0.02, 0.05),
            alpha: 1, scale: 1
        });
        this.spawnedCount++;
    }

    update(deltaTime) {
        if (this.state !== 'playing') return;

        if (this.spawnedCount < this.maxBubbles && Date.now() - this.lastSpawnTime > this.spawnInterval) {
            this._spawnBubble();
            this.lastSpawnTime = Date.now();
        }

        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const b = this.bubbles[i];
            b.y -= b.speed;
            b.wobble += b.wobbleSpeed;
            b.x += Math.sin(b.wobble) * 0.5;
            if (b.y < -b.radius * 2) { this.bubbles.splice(i, 1); this.bubblesPopped++; }
        }

        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) this.combo = 0;
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.1;
            p.alpha -= 0.02; p.radius *= 0.98;
            if (p.alpha <= 0 || p.radius < 1) this.particles.splice(i, 1);
        }

        this._checkGameOver();
    }

    _checkGameOver() {
        if (this.gameCompleteCalled) return;
        if (this.score >= this.targetScore && this.bubblesPopped >= this.maxBubbles - 2) {
            this._win();
        } else if (this.spawnedCount >= this.maxBubbles && this.bubbles.length === 0 && this.score < this.targetScore) {
            this._lose();
        }
    }

    _win() {
        this.calculateStars();
        Audio.playSuccessMelody();
        Audio.vibrateSuccess();
        setTimeout(() => this.end(), 600);
    }

    _lose() {
        this.stars = 0;
        Audio.playGameOver();
        setTimeout(() => this.end(), 600);
    }

    calculateStars() {
        const pct = this.score / this.targetScore;
        this.stars = pct >= 1.5 ? 3 : pct >= 1.2 ? 2 : pct >= 1.0 ? 1 : 0;
    }

    _handleInput(x, y) {
        if (this.state !== 'playing') return;
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const b = this.bubbles[i];
            if (Utils.distance(x, y, b.x, b.y) < b.radius * b.scale) {
                this._popBubble(b, i);
                break;
            }
        }
    }

    _popBubble(bubble, index) {
        this._createParticles(bubble.x, bubble.y, bubble.type === 'rainbow' ? 20 : 10, bubble.color);

        switch (bubble.type) {
            case 'normal':
                this.addScore(1); this.combo = 0;
                Audio.playSound(Constants.AUDIO.CLICK);
                break;
            case 'gold':
                this.addScore(2); this.combo = 0;
                Audio.playStar();
                break;
            case 'bomb':
                this.addScore(-3); this.combo = 0;
                Audio.playError(); Audio.vibrateError();
                break;
            case 'rainbow':
                this._triggerRainbow();
                this.combo++; this.comboTimer = 1.5;
                Audio.playSound(Constants.AUDIO.SUCCESS);
                break;
        }

        if (this.combo >= 3) this._triggerFireCombo();
        this.bubbles.splice(index, 1);
        this.bubblesPopped++;
    }

    _createParticles(x, y, count, color) {
        const colors = color === 'rainbow' ? this.colors.concat('#FFD700') : [color];
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Utils.randomFloat(-0.3, 0.3);
            const speed = Utils.randomFloat(2, 5);
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                radius: Utils.random(3, 8),
                color: Utils.randomItem(colors),
                alpha: 1
            });
        }
    }

    _triggerRainbow() {
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const b = this.bubbles[i];
            if (b.type === 'normal' && i < this.bubbles.length) {
                const ref = this.bubbles[Math.min(i, this.bubbles.length - 1)];
                if (Utils.distance(b.x, b.y, ref.x || 200, ref.y || 300) < 120 || this.combo >= 3) {
                    this._createParticles(b.x, b.y, 10, b.color);
                    this.addScore(1);
                    this.bubbles.splice(i, 1);
                    this.bubblesPopped++;
                }
            }
        }
    }

    _triggerFireCombo() {
        const cx = this.width / 2, cy = this.height / 2;
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const b = this.bubbles[i];
            if (Utils.distance(b.x, b.y, cx, cy) < 150) {
                this._createParticles(b.x, b.y, 8, b.type === 'gold' ? '#FFD700' : b.color);
                this.addScore(b.type === 'gold' ? 2 : 1);
                this.bubbles.splice(i, 1);
                this.bubblesPopped++;
            }
        }
        Audio.playSound(Constants.AUDIO.LEVEL_UP);
        Audio.vibrateSuccess();
    }

    render() {
        this.renderer.drawGradient(0, 0, this.width, this.height, '#E3F2FD', '#BBDEFB');

        this.bubbles.forEach(b => {
            const { x, y, radius: r, color, type } = b;
            const ctx = this.renderer.ctx;
            this.renderer.save();
            ctx.globalAlpha = b.alpha;

            if (type === 'rainbow') {
                const grad = ctx.createRadialGradient(x - r*0.3, y - r*0.3, 0, x, y, r);
                grad.addColorStop(0, '#fff');
                grad.addColorStop(0.25, '#EF5350');
                grad.addColorStop(0.5, '#FFB74D');
                grad.addColorStop(0.75, '#4FC3F7');
                grad.addColorStop(1, '#66BB6A');
                ctx.fillStyle = grad;
            } else {
                const grad = ctx.createRadialGradient(x - r*0.3, y - r*0.3, 0, x, y, r);
                grad.addColorStop(0, _lighten(color, 40));
                grad.addColorStop(0.7, color);
                grad.addColorStop(1, _darken(color, 20));
                ctx.fillStyle = grad;
            }

            ctx.beginPath();
            ctx.arc(x, y, r * b.scale, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.arc(x - r*0.3, y - r*0.3, r*0.25, 0, Math.PI * 2);
            ctx.fill();

            if (type === 'gold') this.renderer.drawEmoji('⭐', x, y, r*0.8);
            else if (type === 'bomb') this.renderer.drawEmoji('💣', x, y, r*0.8);
            else if (type === 'rainbow') this.renderer.drawEmoji('🌈', x, y, r*0.8);

            this.renderer.restore();
        });

        this.particles.forEach(p => {
            this.renderer.ctx.globalAlpha = p.alpha;
            this.renderer.drawCircle(p.x, p.y, p.radius, p.color);
        });
        this.renderer.ctx.globalAlpha = 1;

        // HUD
        this.renderer.drawText('分數: ' + this.score, 70, 26, { font: 'bold 18px sans-serif', color: '#37474F', align: 'left' });
        this.renderer.drawText('目標: ' + this.targetScore, this.width - 70, 26, { font: '16px sans-serif', color: '#546E7A', align: 'right' });

        if (this.combo >= 2) {
            this.renderer.drawText(this.combo + 'x 連擊!', this.width / 2, 55, { font: 'bold 22px sans-serif', color: '#FF6F00' });
        }

        const bw = 200, bh = 10, bx = (this.width - bw) / 2, by = this.height - 30;
        const progress = Math.min(this.score / this.targetScore, 1);
        this.renderer.drawRect(bx, by, bw, bh, '#CFD8DC', 5);
        this.renderer.drawRect(bx, by, bw * progress, bh, progress >= 1 ? '#66BB6A' : '#4FC3F7', 5);

        this.renderer.drawText('剩下: ' + (this.maxBubbles - this.bubblesPopped), this.width / 2, by - 8, { font: '13px sans-serif', color: '#78909C' });
    }

    start() {
        super.start();
        this.canvas.addEventListener('mousedown', this._onMouse);
        this.canvas.addEventListener('touchstart', this._onTouch, { passive: false });
    }

    _onMouse = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this._handleInput(e.clientX - rect.left, e.clientY - rect.top);
    };

    _onTouch = (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const t = e.touches[0];
        this._handleInput(t.clientX - rect.left, t.clientY - rect.top);
    };

    destroy() {
        if (this.canvas) {
            this.canvas.removeEventListener('mousedown', this._onMouse);
            this.canvas.removeEventListener('touchstart', this._onTouch);
        }
        super.destroy();
    }
}

function _lighten(color, pct) {
    const num = parseInt(color.replace('#',''), 16);
    const amt = Math.round(2.55 * pct);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + (0x1000000 + R*0x10000 + G*0x100 + B).toString(16).slice(1);
}

function _darken(color, pct) {
    const num = parseInt(color.replace('#',''), 16);
    const amt = Math.round(2.55 * pct);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return '#' + (0x1000000 + R*0x10000 + G*0x100 + B).toString(16).slice(1);
}

if (typeof window !== 'undefined') {
    window.BubblePop = BubblePop;
    if (window.GameRegistry) GameRegistry.register('bubble-pop', BubblePop);
}
