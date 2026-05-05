/**
 * Shape Slicer - Drag pieces to complete the shape puzzle!
 */
class ShapeSlicer extends GameBase {
    constructor(gameId, levelOrOptions) {
        super(gameId, levelOrOptions);
        const configs = [
            { shape: 'circle',   pieces: 3, time: 60 },
            { shape: 'square',   pieces: 3, time: 55 },
            { shape: 'triangle', pieces: 4, time: 55 },
            { shape: 'star',     pieces: 4, time: 50 },
            { shape: 'heart',    pieces: 4, time: 50 },
            { shape: 'diamond',  pieces: 5, time: 45 },
            { shape: 'hexagon',  pieces: 5, time: 45 },
            { shape: 'star',     pieces: 6, time: 40 },
            { shape: 'heart',    pieces: 6, time: 40 },
            { shape: 'hexagon',  pieces: 7, time: 35 }
        ];
        const cfg = configs[Math.min(this.level - 1, 9)];
        this.shapeType = cfg.shape;
        this.pieceCount = cfg.pieces;
        this.timeLimit = cfg.time;
        this.remainingTime = cfg.time;
        this.pieces = [];
        this.dragging = null;
        this.placedCount = 0;
        this.targetCX = this.width / 2;
        this.targetCY = this.height / 2 - 20;
    }

    initElements() {
        this.pieces = []; this.dragging = null; this.placedCount = 0; this.remainingTime = this.timeLimit;
        const colors = ['#EF5350','#FFB74D','#4FC3F7','#66BB6A','#AB47BC','#FF7043','#26C6DA'];
        for (let i = 0; i < this.pieceCount; i++) {
            const aStart = (i / this.pieceCount) * Math.PI * 2;
            const aEnd = ((i + 1) / this.pieceCount) * Math.PI * 2;
            const sx = Utils.random(50, this.width - 50);
            const sy = i < this.pieceCount / 2 ? Utils.random(30, 120) : Utils.random(this.height - 150, this.height - 30);
            this.pieces.push({ x: sx, y: sy, origX: sx, origY: sy, targetX: this.targetCX, targetY: this.targetCY, angleStart: aStart, angleEnd: aEnd, idx: i, placed: false, color: colors[i % colors.length] });
        }
    }

    update(deltaTime) {
        if (this.state !== 'playing' || this.gameCompleteCalled) return;
        this.remainingTime -= deltaTime;
        if (this.remainingTime <= 0) { this.remainingTime = 0; this._endGame(); }
    }

    _endGame() {
        if (this.placedCount >= this.pieceCount) {
            const pct = this.remainingTime / this.timeLimit;
            this.stars = pct > 0.5 ? 3 : pct > 0.25 ? 2 : 1;
            this.addScore(this.placedCount * 100 + Math.floor(this.remainingTime) * 2);
            Audio.playSuccessMelody(); Audio.vibrateSuccess();
        } else if (this.placedCount >= this.pieceCount * 0.5) {
            this.stars = 1; this.addScore(this.placedCount * 50);
        } else { this.stars = 0; Audio.playGameOver(); }
        setTimeout(() => this.end(), 600);
    }
    calculateStars() {}

    render() {
        this.renderer.clearWithColor('#F3E5F5');
        const ctx = this.renderer.ctx, cx = this.targetCX, cy = this.targetCY, r = 60;
        ctx.strokeStyle = 'rgba(120,100,140,0.3)'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
        this._drawShapePath(cx, cy, r); ctx.stroke(); ctx.setLineDash([]);

        this.pieces.forEach(p => {
            this.renderer.save();
            if (p.placed) { ctx.globalAlpha = 0.7; ctx.shadowColor = 'rgba(102,187,106,0.6)'; ctx.shadowBlur = 10; }
            if (p === this.dragging) { ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3; }
            ctx.fillStyle = p.color; ctx.beginPath();
            const size = p.placed ? r : 22;
            ctx.moveTo(p.x, p.y); ctx.arc(p.x, p.y, size, p.angleStart, p.angleEnd); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            const midA = (p.angleStart + p.angleEnd) / 2;
            ctx.fillText(p.idx + 1, p.x + Math.cos(midA) * 11, p.y + Math.sin(midA) * 11);
            this.renderer.restore();
        });

        ctx.strokeStyle = 'rgba(102,187,106,0.4)'; ctx.lineWidth = 3;
        this._drawShapePath(cx, cy, r); ctx.stroke();

        const tbw = this.width - 40, tby = 14;
        this.renderer.drawRect(20, tby, tbw, 10, 'rgba(0,0,0,0.1)', 5);
        this.renderer.drawRect(20, tby, tbw * (this.remainingTime / this.timeLimit), 10, this.remainingTime > 10 ? '#AB47BC' : '#EF5350', 5);
        this.renderer.drawText('拼好: ' + this.placedCount + '/' + this.pieceCount, 50, 36, { font: 'bold 14px sans-serif', color: '#4A148C', align: 'left' });
        this.renderer.drawText(Math.ceil(this.remainingTime) + 's', this.width - 50, 36, { font: 'bold 14px sans-serif', color: '#4A148C', align: 'right' });
        const names = { circle: '圓形', square: '正方形', triangle: '三角形', star: '星形', heart: '愛心', diamond: '菱形', hexagon: '六邊形' };
        this.renderer.drawText(names[this.shapeType], this.width / 2, 36, { font: 'bold 16px sans-serif', color: '#6A1B9A' });
    }

    _drawShapePath(x, y, r) {
        const ctx = this.renderer.ctx;
        ctx.beginPath();
        switch (this.shapeType) {
            case 'circle': ctx.arc(x, y, r, 0, Math.PI * 2); break;
            case 'square': ctx.rect(x - r, y - r, r * 2, r * 2); break;
            case 'triangle': ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.87, y + r * 0.5); ctx.lineTo(x - r * 0.87, y + r * 0.5); ctx.closePath(); break;
            case 'diamond': ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.7, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.7, y); ctx.closePath(); break;
            case 'hexagon': for (let i = 0; i < 6; i++) { const a = (Math.PI/3)*i - Math.PI/2; i === 0 ? ctx.moveTo(x+r*Math.cos(a), y+r*Math.sin(a)) : ctx.lineTo(x+r*Math.cos(a), y+r*Math.sin(a)); } ctx.closePath(); break;
            case 'star': for (let i = 0; i < 10; i++) { const a = (Math.PI/5)*i - Math.PI/2; const rr = i%2===0 ? r : r*0.45; i === 0 ? ctx.moveTo(x+rr*Math.cos(a), y+rr*Math.sin(a)) : ctx.lineTo(x+rr*Math.cos(a), y+rr*Math.sin(a)); } ctx.closePath(); break;
            case 'heart': ctx.moveTo(x, y + r*0.6); ctx.bezierCurveTo(x - r, y + r*0.1, x - r, y - r*0.7, x, y - r*0.2); ctx.bezierCurveTo(x + r, y - r*0.7, x + r, y + r*0.1, x, y + r*0.6); break;
        }
    }

    _getXY(e) { const r = this.canvas.getBoundingClientRect(); return { x: (e.touches ? e.touches[0].clientX : e.clientX) - r.left, y: (e.touches ? e.touches[0].clientY : e.clientY) - r.top }; }
    _findPiece(x, y) { for (let i = this.pieces.length - 1; i >= 0; i--) { const p = this.pieces[i]; if (!p.placed && Utils.distance(x, y, p.x, p.y) < 28) return p; } return null; }
    _onDown = (e) => { const { x, y } = this._getXY(e); const p = this._findPiece(x, y); if (p) { this.dragging = p; this.dragOffX = p.x - x; this.dragOffY = p.y - y; } };
    _onMove = (e) => { if (!this.dragging) return; const { x, y } = this._getXY(e); this.dragging.x = x + this.dragOffX; this.dragging.y = y + this.dragOffY; };
    _onUp = () => { if (!this.dragging) return; const p = this.dragging; const dist = Utils.distance(p.x, p.y, p.targetX, p.targetY); if (dist < 35) { p.x = p.targetX; p.y = p.targetY; p.placed = true; this.placedCount++; this.addScore(100); Audio.playStar(); if (this.placedCount >= this.pieceCount) this._endGame(); } else { p.x = p.origX; p.y = p.origY; Audio.playError(); } this.dragging = null; };
    _onTDown = (e) => { e.preventDefault(); this._onDown(e); };
    _onTMove = (e) => { e.preventDefault(); this._onMove(e); };
    _onTUp = () => { this._onUp(); };

    start() {
        super.start();
        this.canvas.addEventListener('mousedown', this._onDown); this.canvas.addEventListener('mousemove', this._onMove); this.canvas.addEventListener('mouseup', this._onUp);
        this.canvas.addEventListener('touchstart', this._onTDown, { passive: false }); this.canvas.addEventListener('touchmove', this._onTMove, { passive: false }); this.canvas.addEventListener('touchend', this._onTUp);
    }

    destroy() {
        if (this.canvas) { const c = this.canvas; c.removeEventListener('mousedown', this._onDown); c.removeEventListener('mousemove', this._onMove); c.removeEventListener('mouseup', this._onUp); c.removeEventListener('touchstart', this._onTDown); c.removeEventListener('touchmove', this._onTMove); c.removeEventListener('touchend', this._onTUp); }
        super.destroy();
    }
}

if (typeof window !== 'undefined') { window.ShapeSlicer = ShapeSlicer; if (window.GameRegistry) GameRegistry.register('shape-slicer', ShapeSlicer); }
