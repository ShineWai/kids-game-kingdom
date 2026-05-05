/**
 * Magic Painter - Draw and color beautiful pictures!
 */
class MagicPainter extends GameBase {
    constructor(gameId, levelOrOptions) {
        super(gameId, levelOrOptions);
        const configs = [
            { mode: 'guided', target: 'sun',      colors: 3, targetPct: 60 },
            { mode: 'guided', target: 'flower',   colors: 3, targetPct: 60 },
            { mode: 'guided', target: 'house',    colors: 4, targetPct: 65 },
            { mode: 'guided', target: 'tree',     colors: 4, targetPct: 65 },
            { mode: 'guided', target: 'butterfly',colors: 5, targetPct: 70 },
            { mode: 'guided', target: 'fish',     colors: 5, targetPct: 70 },
            { mode: 'guided', target: 'rocket',   colors: 6, targetPct: 75 },
            { mode: 'free',   target: 'free',     colors: 6, targetPct: 50 },
            { mode: 'free',   target: 'free',     colors: 7, targetPct: 55 },
            { mode: 'free',   target: 'free',     colors: 8, targetPct: 60 }
        ];
        const cfg = configs[Math.min(this.level - 1, 9)];
        this.mode = cfg.mode;
        this.targetShape = cfg.target;
        this.colorCount = cfg.colors;
        this.targetPct = cfg.targetPct;

        this.palette = ['#EF5350','#FFB74D','#4FC3F7','#66BB6A','#AB47BC','#FF7043','#26C6DA','#FFD700'];
        this.activeColor = this.palette[0];
        this.isDrawing = false;
        this.drawnPixels = new Set();
        this.guidePixels = new Set();
        this.pixelSize = 12;
    }

    initElements() {
        this.isDrawing = false;
        this.drawnPixels = new Set();
        this.guidePixels = new Set();
        this.activeColor = this.palette[0];

        if (this.mode === 'guided') {
            const cx = Math.floor(this.width / 2 / this.pixelSize);
            const cy = Math.floor(this.height / 2 / this.pixelSize);
            const r = Math.floor(Math.min(12, 50 / this.pixelSize));
            this._generateGuideShape(cx, cy, r);
        }
    }

    _generateGuideShape(cx, cy, r) {
        switch (this.targetShape) {
            case 'sun':
                for (let dy = -r; dy <= r; dy++) {
                    for (let dx = -r; dx <= r; dx++) {
                        if (dx*dx + dy*dy <= r*r) this.guidePixels.add((cx+dx)+','+(cy+dy));
                    }
                }
                for (let i = 0; i < 8; i++) {
                    const a = (Math.PI*2/8)*i;
                    for (let d = r; d < r+3; d++) {
                        const px = Math.round(cx + Math.cos(a)*d);
                        const py = Math.round(cy + Math.sin(a)*d);
                        this.guidePixels.add(px+','+py);
                    }
                }
                break;
            case 'flower':
                for (let dy = -r; dy <= r; dy++) {
                    for (let dx = -r; dx <= r; dx++) {
                        if (dx*dx + dy*dy <= r*r*0.5) this.guidePixels.add((cx+dx)+','+(cy+dy));
                    }
                }
                for (let p = 0; p < 5; p++) {
                    const pa = (Math.PI*2/5)*p;
                    const px = Math.round(cx + Math.cos(pa)*r*0.8);
                    const py = Math.round(cy + Math.sin(pa)*r*0.8);
                    for (let ddy = -2; ddy <= 2; ddy++) {
                        for (let ddx = -2; ddx <= 2; ddx++) {
                            if (ddx*ddx + ddy*ddy <= 5) this.guidePixels.add((px+ddx)+','+(py+ddy));
                        }
                    }
                }
                break;
            case 'house':
                for (let dy = 0; dy <= r+2; dy++) {
                    for (let dx = -r; dx <= r; dx++) this.guidePixels.add((cx+dx)+','+(cy+dy));
                }
                for (let dy = -r; dy <= 0; dy++) {
                    const w = Math.round((r+2) * (1 + dy/r));
                    for (let dx = -w; dx <= w; dx++) this.guidePixels.add((cx+dx)+','+(cy+dy));
                }
                break;
            default:
                for (let dy = -r; dy <= r; dy++) {
                    for (let dx = -r; dx <= r; dx++) {
                        if (dx*dx + dy*dy <= r*r) this.guidePixels.add((cx+dx)+','+(cy+dy));
                    }
                }
                if (this.targetShape === 'tree') {
                    for (let dy = r; dy <= r+4; dy++) {
                        for (let dx = -2; dx <= 2; dx++) this.guidePixels.add((cx+dx)+','+(cy+dy));
                    }
                }
                if (this.targetShape === 'rocket') {
                    for (let dy = -r-3; dy <= -r; dy++) {
                        for (let dx = -1; dx <= 1; dx++) this.guidePixels.add((cx+dx)+','+(cy+dy));
                    }
                }
                break;
        }
    }

    update(deltaTime) {
        if (this.state !== 'playing' || this.gameCompleteCalled) return;
        if (this.guidePixels.size > 0) {
            let filled = 0;
            this.guidePixels.forEach(k => { if (this.drawnPixels.has(k)) filled++; });
            const pct = filled / this.guidePixels.size;
            if (pct >= this.targetPct / 100) {
                this.stars = pct >= 0.9 ? 3 : pct >= 0.75 ? 2 : 1;
                Audio.playSuccessMelody();
                setTimeout(() => this.end(), 600);
            }
        }
    }

    render() {
        this.renderer.clearWithColor('#FFFDE7');
        const ctx = this.renderer.ctx;

        if (this.mode === 'guided' && this.guidePixels.size > 0) {
            this.guidePixels.forEach(k => {
                if (!this.drawnPixels.has(k)) {
                    const [px, py] = k.split(',').map(Number);
                    ctx.fillStyle = 'rgba(180,180,180,0.25)';
                    ctx.fillRect(px * this.pixelSize, py * this.pixelSize, this.pixelSize - 1, this.pixelSize - 1);
                }
            });
        }

        this.drawnPixels.forEach(k => {
            const [px, py] = k.split(',').map(Number);
            const color = k.split(',')[2] || this.activeColor;
            const idx = parseInt(k.split(',')[2] || '0') || 0;
            ctx.fillStyle = this.palette[Math.min(idx, this.palette.length - 1)];
            ctx.fillRect(px * this.pixelSize, py * this.pixelSize, this.pixelSize - 1, this.pixelSize - 1);
        });

        // Palette at bottom
        const py = this.height - 40;
        this.palette.slice(0, this.colorCount).forEach((c, i) => {
            const px = 20 + i * 44;
            ctx.fillStyle = c;
            ctx.beginPath();
            ctx.arc(px + 18, py + 18, 16, 0, Math.PI * 2);
            ctx.fill();
            if (c === this.activeColor) {
                ctx.strokeStyle = '#333'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(px + 18, py + 18, 18, 0, Math.PI * 2); ctx.stroke();
            }
        });

        const fillPct = this.guidePixels.size > 0 ? (() => { let f=0; this.guidePixels.forEach(k=>{if(this.drawnPixels.has(k.split(',')[0]+','+k.split(',')[1]))f++;}); return f/this.guidePixels.size; })() : 0;
        this.renderer.drawText('完成度: ' + Math.floor(fillPct*100) + '%', this.width/2, 24, { font: 'bold 16px sans-serif', color: '#5D4037' });
    }

    _paint(x, y) {
        const px = Math.floor(x / this.pixelSize);
        const py = Math.floor(y / this.pixelSize);
        // Check if near palette
        if (y > this.height - 50) {
            const pi = Math.floor((x - 20) / 44);
            if (pi >= 0 && pi < this.colorCount && x >= 20 + pi * 44 && x <= 20 + pi * 44 + 36) {
                this.activeColor = this.palette[pi];
                return;
            }
        }
        const ci = this.palette.indexOf(this.activeColor);
        this.drawnPixels.add(px + ',' + py + ',' + ci);
    }

    _onDown = (e) => { this.isDrawing = true; const r = this.canvas.getBoundingClientRect(); this._paint((e.touches?e.touches[0].clientX:e.clientX)-r.left, (e.touches?e.touches[0].clientY:e.clientY)-r.top); };
    _onMove = (e) => { if (!this.isDrawing) return; const r = this.canvas.getBoundingClientRect(); this._paint((e.touches?e.touches[0].clientX:e.clientX)-r.left, (e.touches?e.touches[0].clientY:e.clientY)-r.top); };
    _onUp = () => { this.isDrawing = false; };
    _onTDown = (e) => { e.preventDefault(); this._onDown(e); };
    _onTMove = (e) => { e.preventDefault(); this._onMove(e); };
    calculateStars() {}

    start() {
        super.start();
        this.canvas.addEventListener('mousedown', this._onDown); this.canvas.addEventListener('mousemove', this._onMove); this.canvas.addEventListener('mouseup', this._onUp);
        this.canvas.addEventListener('touchstart', this._onTDown, { passive: false }); this.canvas.addEventListener('touchmove', this._onTMove, { passive: false }); this.canvas.addEventListener('touchend', this._onUp);
    }

    destroy() {
        if (this.canvas) { const c = this.canvas; c.removeEventListener('mousedown', this._onDown); c.removeEventListener('mousemove', this._onMove); c.removeEventListener('mouseup', this._onUp); c.removeEventListener('touchstart', this._onTDown); c.removeEventListener('touchmove', this._onTMove); c.removeEventListener('touchend', this._onUp); }
        super.destroy();
    }
}

if (typeof window !== 'undefined') { window.MagicPainter = MagicPainter; if (window.GameRegistry) GameRegistry.register('magic-painter', MagicPainter); }
