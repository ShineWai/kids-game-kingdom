/**
 * Block Kingdom - Stack blocks to build the tallest tower!
 */
class BlockKingdom extends GameBase {
    constructor(gameId, levelOrOptions) {
        super(gameId, levelOrOptions);
        const configs = [
            { targetH: 150, speed: 1.0, wind: 0,   shake: 0,   maxBlocks: 15 },
            { targetH: 180, speed: 1.2, wind: 0,   shake: 0,   maxBlocks: 18 },
            { targetH: 200, speed: 1.4, wind: 0,   shake: 0,   maxBlocks: 20 },
            { targetH: 220, speed: 1.4, wind: 0.3, shake: 0,   maxBlocks: 22 },
            { targetH: 240, speed: 1.6, wind: 0.3, shake: 0,   maxBlocks: 25 },
            { targetH: 250, speed: 1.6, wind: 0.5, shake: 0.2, maxBlocks: 25 },
            { targetH: 270, speed: 1.8, wind: 0.5, shake: 0.3, maxBlocks: 28 },
            { targetH: 280, speed: 1.8, wind: 0.7, shake: 0.4, maxBlocks: 30 },
            { targetH: 300, speed: 2.0, wind: 0.7, shake: 0.5, maxBlocks: 30 },
            { targetH: 320, speed: 2.2, wind: 0.8, shake: 0.6, maxBlocks: 35 }
        ];
        const cfg = configs[Math.min(this.level - 1, 9)];
        this.targetHeight = cfg.targetH;
        this.blockSpeed = cfg.speed;
        this.windForce = cfg.wind;
        this.shakeForce = cfg.shake;
        this.maxBlocks = cfg.maxBlocks;
        this.colors = ['#EF5350','#FFB74D','#4FC3F7','#66BB6A','#AB47BC','#FF7043'];
        this.groundY = this.height - 40;
        this.stackedBlocks = [];
        this.currentBlock = null;
        this.towerHeight = 0;
        this.blocksPlaced = 0;
        this.fallSpeed = 0;
    }

    initElements() {
        this.stackedBlocks = []; this.currentBlock = null; this.towerHeight = 0; this.blocksPlaced = 0; this.fallSpeed = 0;
        this._spawnBlock();
    }

    _spawnBlock() {
        const w = Utils.random(55, 85);
        this.currentBlock = { x: 0, y: 30, w, h: 28, color: Utils.randomItem(this.colors), falling: false, direction: 1 };
        this.fallSpeed = 2;
    }

    update(deltaTime) {
        if (this.state !== 'playing') return;
        const cb = this.currentBlock;
        if (!cb) return;
        if (!cb.falling) {
            cb.x += cb.direction * this.blockSpeed;
            if (cb.x + cb.w > this.width - 5) { cb.x = this.width - cb.w - 5; cb.direction = -1; }
            if (cb.x < 5) { cb.x = 5; cb.direction = 1; }
        } else {
            this.fallSpeed += 0.35;
            cb.y += this.fallSpeed;
            cb.x += this.windForce * (Math.sin(Date.now() * 0.003) * 0.5 + 0.5);
            const landY = this.groundY - this.towerHeight - cb.h;
            if (cb.y >= landY) { cb.y = landY; this._landBlock(cb); }
        }
        if (this.shakeForce > 0) {
            const sx = Math.sin(Date.now() * 0.01) * this.shakeForce * 2;
            this.stackedBlocks.forEach(b => { b._shakeX = sx * (b.y / this.groundY); });
        }
    }

    _landBlock(block) {
        let overlap = block.w;
        if (this.stackedBlocks.length > 0) {
            const base = this.stackedBlocks[this.stackedBlocks.length - 1];
            overlap = Math.max(0, Math.min(block.x + block.w, base.x + base.w) - Math.max(block.x, base.x));
        }
        if (overlap / block.w > 0.4) {
            block._shakeX = 0;
            this.stackedBlocks.push(block);
            this.towerHeight += block.h;
            this.blocksPlaced++;
            this.addScore(1);
            if (this.stackedBlocks.length > 1 && Math.abs(block.x - this.stackedBlocks[this.stackedBlocks.length - 2].x) < 8) this.addScore(2);
            Audio.playSound(Constants.AUDIO.CLICK);
            if (this.towerHeight >= this.targetHeight) { this._win(); return; }
            if (this.blocksPlaced >= this.maxBlocks) { this._lose(); return; }
            this._spawnBlock();
        } else { this._lose(); }
    }

    _win() { const r = this.maxBlocks - this.blocksPlaced; this.stars = r > 5 ? 3 : r > 3 ? 2 : 1; Audio.playSuccessMelody(); Audio.vibrateSuccess(); setTimeout(() => this.end(), 600); }
    _lose() { this.stars = 0; Audio.playGameOver(); setTimeout(() => this.end(), 600); }
    calculateStars() {}

    render() {
        this.renderer.drawGradient(0, 0, this.width, this.height, '#E3F2FD', '#BBDEFB');
        this.renderer.drawRect(0, this.groundY, this.width, this.height - this.groundY, '#795548');
        this.renderer.drawRect(0, this.groundY, this.width, 6, '#8BC34A');
        const targetY = this.groundY - this.targetHeight;
        const ctx = this.renderer.ctx;
        ctx.strokeStyle = 'rgba(239,83,80,0.5)'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
        ctx.beginPath(); ctx.moveTo(10, targetY); ctx.lineTo(this.width - 10, targetY); ctx.stroke(); ctx.setLineDash([]);
        this.renderer.drawText('目標', this.width - 35, targetY - 10, { font: '11px sans-serif', color: '#EF5350', align: 'right' });

        this.stackedBlocks.forEach(b => {
            const sx = b._shakeX || 0;
            this.renderer.drawRect(b.x + sx, b.y, b.w, b.h, b.color, 3);
            ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(b.x + sx + 2, b.y + 2, b.w - 4, b.h / 2);
            ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(b.x + sx, b.y + b.h - 5, b.w, 5);
        });

        const cb = this.currentBlock;
        if (cb) {
            this.renderer.save(); ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
            this.renderer.drawRect(cb.x, cb.y, cb.w, cb.h, cb.color, 3);
            ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(cb.x + 2, cb.y + 2, cb.w - 4, cb.h / 2);
            this.renderer.restore();
        }

        this.renderer.drawText('分數: ' + this.score, 55, 22, { font: 'bold 16px sans-serif', color: '#37474F', align: 'left' });
        this.renderer.drawText('高度: ' + Math.floor(this.towerHeight) + '/' + this.targetHeight, this.width - 55, 22, { font: '14px sans-serif', color: '#546E7A', align: 'right' });
        this.renderer.drawText('積木: ' + (this.maxBlocks - this.blocksPlaced), this.width / 2, 22, { font: '13px sans-serif', color: '#78909C' });
    }

    _onTap = () => { if (this.currentBlock && !this.currentBlock.falling) this.currentBlock.falling = true; };
    _onTTap = (e) => { e.preventDefault(); this._onTap(); };

    start() { super.start(); this.canvas.addEventListener('mousedown', this._onTap); this.canvas.addEventListener('touchstart', this._onTTap, { passive: false }); }
    destroy() { if (this.canvas) { this.canvas.removeEventListener('mousedown', this._onTap); this.canvas.removeEventListener('touchstart', this._onTTap); } super.destroy(); }
}

if (typeof window !== 'undefined') { window.BlockKingdom = BlockKingdom; if (window.GameRegistry) GameRegistry.register('block-kingdom', BlockKingdom); }
