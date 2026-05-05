/**
 * Music Band - Tap instruments to the rhythm!
 */
class MusicBand extends GameBase {
    constructor(gameId, levelOrOptions) {
        super(gameId, levelOrOptions);
        const configs = [
            { beats: 8,  tempo: 800,  instruments: 2, target: 6  },
            { beats: 10, tempo: 750,  instruments: 2, target: 8  },
            { beats: 12, tempo: 700,  instruments: 3, target: 10 },
            { beats: 14, tempo: 650,  instruments: 3, target: 12 },
            { beats: 16, tempo: 600,  instruments: 3, target: 14 },
            { beats: 18, tempo: 550,  instruments: 4, target: 16 },
            { beats: 20, tempo: 500,  instruments: 4, target: 18 },
            { beats: 22, tempo: 450,  instruments: 4, target: 20 },
            { beats: 25, tempo: 400,  instruments: 4, target: 22 },
            { beats: 30, tempo: 350,  instruments: 4, target: 26 }
        ];
        const cfg = configs[Math.min(this.level - 1, 9)];
        this.totalBeats = cfg.beats;
        this.tempo = cfg.tempo;
        this.numInstruments = cfg.instruments;
        this.targetHits = cfg.target;

        this.instruments = ['🥁','🎸','🎹','🪇'];
        this.columns = [];
        this.notes = [];
        this.hitEffects = [];
        this.beatIndex = 0;
        this.lastBeatTime = 0;
        this.hits = 0;
        this.misses = 0;
    }

    initElements() {
        this.notes = [];
        this.hitEffects = [];
        this.beatIndex = 0;
        this.lastBeatTime = 0;
        this.hits = 0;
        this.misses = 0;

        const colW = this.width / this.numInstruments;
        this.columns = [];
        for (let i = 0; i < this.numInstruments; i++) {
            this.columns.push({ x: colW * i + colW / 2, w: colW, instrument: this.instruments[i] });
        }
    }

    update(deltaTime) {
        if (this.state !== 'playing' || this.gameCompleteCalled) return;

        if (Date.now() - this.lastBeatTime > this.tempo && this.beatIndex < this.totalBeats) {
            const col = Utils.random(0, this.numInstruments - 1);
            this.notes.push({
                col, x: this.columns[col].x,
                y: -30, speed: 2.5 + (this.level * 0.2),
                hit: false, missed: false
            });
            this.beatIndex++;
            this.lastBeatTime = Date.now();
        }

        for (let i = this.notes.length - 1; i >= 0; i--) {
            const n = this.notes[i];
            n.y += n.speed;
            if (n.y > this.height - 80 && !n.hit && !n.missed) {
                n.missed = true;
                this.misses++;
                Audio.playError();
            }
            if (n.y > this.height + 40) this.notes.splice(i, 1);
        }

        for (let i = this.hitEffects.length - 1; i >= 0; i--) {
            this.hitEffects[i].alpha -= 0.04;
            if (this.hitEffects[i].alpha <= 0) this.hitEffects.splice(i, 1);
        }

        if (this.beatIndex >= this.totalBeats && this.notes.length === 0) this._endGame();
    }

    _endGame() {
        this.stars = this.hits >= this.targetHits * 1.3 ? 3 : this.hits >= this.targetHits ? 2 : this.hits >= this.targetHits * 0.5 ? 1 : 0;
        this.addScore(this.hits * 10);
        if (this.stars > 0) { Audio.playSuccessMelody(); } else { Audio.playGameOver(); }
        setTimeout(() => this.end(), 600);
    }
    calculateStars() {}

    render() {
        this.renderer.drawGradient(0, 0, this.width, this.height, '#1A1A2E', '#16213E');
        const ctx = this.renderer.ctx;

        // Hit zone
        const hzY = this.height - 90;
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(0, hzY); ctx.lineTo(this.width, hzY); ctx.stroke(); ctx.setLineDash([]);

        // Column dividers
        this.columns.forEach(c => {
            ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(c.x, 0); ctx.lineTo(c.x, this.height - 100); ctx.stroke();
            this.renderer.drawEmoji(c.instrument, c.x, this.height - 40, 36);
        });

        // Notes
        this.notes.forEach(n => {
            if (!n.hit && !n.missed) {
                const col = this.columns[n.col];
                ctx.fillStyle = col.instrument === '🥁' ? '#FF6B6B' : col.instrument === '🎸' ? '#4ECDC4' : col.instrument === '🎹' ? '#FFE66D' : '#A8E6CF';
                ctx.shadowColor = ctx.fillStyle;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(n.x, n.y, 16, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        });

        // Hit effects
        this.hitEffects.forEach(e => {
            ctx.globalAlpha = e.alpha;
            ctx.fillStyle = e.color;
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        this.renderer.drawText('分數: ' + this.score, 55, 24, { font: 'bold 18px sans-serif', color: '#FFF', align: 'left' });
        this.renderer.drawText('命中: ' + this.hits + '/' + this.targetHits, this.width - 55, 24, { font: '16px sans-serif', color: '#FFF', align: 'right' });
        const prog = this.beatIndex / this.totalBeats;
        this.renderer.drawRect(10, this.height - 14, this.width - 20, 8, 'rgba(255,255,255,0.15)', 4);
        this.renderer.drawRect(10, this.height - 14, (this.width - 20) * prog, 8, '#4ECDC4', 4);
    }

    _tap(x) {
        const colIdx = Math.floor(x / (this.width / this.numInstruments));
        if (colIdx < 0 || colIdx >= this.numInstruments) return;

        let hit = false;
        for (let i = this.notes.length - 1; i >= 0; i--) {
            const n = this.notes[i];
            if (n.col === colIdx && !n.hit && !n.missed && n.y > this.height - 130 && n.y < this.height - 40) {
                n.hit = true;
                this.hits++;
                this.addScore(10);
                this.hitEffects.push({ x: n.x, y: this.height - 90, color: '#FFD700', radius: 20, alpha: 1 });
                Audio.playStar();
                this.notes.splice(i, 1);
                hit = true;
                break;
            }
        }
        if (!hit) { Audio.playError(); }
    }

    _onTap = (e) => { const r = this.canvas.getBoundingClientRect(); this._tap((e.touches?e.touches[0].clientX:e.clientX) - r.left); };
    _onTTap = (e) => { e.preventDefault(); this._onTap(e); };

    start() { super.start(); this.canvas.addEventListener('mousedown', this._onTap); this.canvas.addEventListener('touchstart', this._onTTap, { passive: false }); }
    destroy() { if (this.canvas) { this.canvas.removeEventListener('mousedown', this._onTap); this.canvas.removeEventListener('touchstart', this._onTTap); } super.destroy(); }
}

if (typeof window !== 'undefined') { window.MusicBand = MusicBand; if (window.GameRegistry) GameRegistry.register('music-band', MusicBand); }
