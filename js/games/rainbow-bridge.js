/**
 * Rainbow Bridge - Build a bridge across the river!
 */
class RainbowBridge extends GameBase {
    constructor(gameId, levelOrOptions) {
        super(gameId, levelOrOptions);
        const configs = [
            { gapWidth: 150, planks: 8,  target: 6  },
            { gapWidth: 180, planks: 10, target: 8  },
            { gapWidth: 200, planks: 10, target: 9  },
            { gapWidth: 220, planks: 12, target: 10 },
            { gapWidth: 240, planks: 12, target: 11 },
            { gapWidth: 260, planks: 14, target: 12 },
            { gapWidth: 280, planks: 14, target: 13 },
            { gapWidth: 300, planks: 16, target: 14 },
            { gapWidth: 310, planks: 16, target: 15 },
            { gapWidth: 330, planks: 18, target: 16 }
        ];
        const cfg = configs[Math.min(this.level - 1, 9)];
        this.gapWidth = cfg.gapWidth;
        this.maxPlanks = cfg.planks;
        this.targetPlanks = cfg.target;
        this.planks = [];
        this.currentPlank = null;
        this.placedCount = 0;
        this.failed = false;
        this.bridgeY = this.height / 2 + 30;
    }

    initElements() {
        this.planks = [];
        this.currentPlank = null;
        this.placedCount = 0;
        this.failed = false;
        this._newPlank();
    }

    _newPlank() {
        if (this.placedCount >= this.maxPlanks) return;
        this.currentPlank = {
            x: 40, y: 60,
            w: Utils.random(35, 55), h: 10,
            swinging: true, swingAngle: 0, swingSpeed: 0.03 + this.level * 0.004,
            placed: false,
            color: ['#EF5350','#FFB74D','#4FC3F7','#66BB6A','#AB47BC','#FFD700'][Utils.random(0, 5)]
        };
    }

    update(deltaTime) {
        if (this.state !== 'playing' || this.gameCompleteCalled) return;
        if (!this.currentPlank && this.placedCount < this.maxPlanks) this._newPlank();
        if (this.currentPlank && this.currentPlank.swinging) {
            this.currentPlank.swingAngle = Math.sin(Date.now() * this.currentPlank.swingSpeed) * 0.5;
        }
    }

    render() {
        this.renderer.drawGradient(0, 0, this.width, this.height, '#87CEEB', '#E0F7FA');
        const ctx = this.renderer.ctx;

        // Banks
        this.renderer.drawRect(0, this.bridgeY - 30, 30, 80, '#8BC34A');
        this.renderer.drawRect(this.width - 30, this.bridgeY - 30, 30, 80, '#8BC34A');

        // River
        ctx.fillStyle = 'rgba(33,150,243,0.3)';
        const riverL = 30, riverR = this.width - 30;
        ctx.fillRect(riverL, this.bridgeY + 10, riverR - riverL, 40);

        // Waves
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
        for (let x = riverL; x < riverR; x += 20) {
            const wy = this.bridgeY + 28 + Math.sin(x * 0.05 + Date.now() * 0.003) * 5;
            ctx.beginPath(); ctx.moveTo(x, wy); ctx.lineTo(x + 15, wy); ctx.stroke();
        }

        // Gap indicator
        ctx.strokeStyle = 'rgba(239,83,80,0.4)'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(riverL, this.bridgeY - 5); ctx.lineTo(riverR, this.bridgeY - 5); ctx.stroke();
        ctx.setLineDash([]);

        // Placed planks
        this.planks.forEach(p => {
            this.renderer.drawRect(p.x, p.y - p.h / 2, p.w, p.h, p.color, 3);
            ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(p.x + 2, p.y - p.h / 2 + 1, p.w - 4, p.h / 3);
        });

        // Current swinging plank
        const cp = this.currentPlank;
        if (cp) {
            const cx = cp.x, cy = cp.y, angle = cp.swingAngle;
            this.renderer.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle);
            this.renderer.drawRect(-cp.w / 2, -cp.h / 2, cp.w, cp.h, cp.color, 3);
            ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-cp.w / 2 + 2, -cp.h / 2 + 1, cp.w - 4, cp.h / 3);
            this.renderer.restore();
        }

        this.renderer.drawText('放置: ' + this.placedCount + '/' + this.maxPlanks, 55, 22, { font: 'bold 16px sans-serif', color: '#37474F', align: 'left' });
        this.renderer.drawText('目標: ' + this.targetPlanks, this.width - 55, 22, { font: '14px sans-serif', color: '#546E7A', align: 'right' });
    }

    _dropPlank() {
        if (!this.currentPlank || !this.currentPlank.swinging) return;
        const cp = this.currentPlank;
        cp.swinging = false;

        // Calculate landing position (where it falls to bridge level)
        const landX = cp.x + Math.sin(cp.swingAngle) * 30;
        const landY = this.bridgeY;

        // Check if within gap
        const riverL = 35, riverR = this.width - 35;
        if (landX - cp.w / 2 > riverL && landX + cp.w / 2 < riverR) {
            cp.x = landX;
            cp.y = landY;
            cp.placed = true;
            this.planks.push(cp);
            this.placedCount++;
            this.addScore(1);
            Audio.playSound(Constants.AUDIO.CLICK);

            if (this.placedCount >= this.targetPlanks) {
                this.stars = this.placedCount >= this.maxPlanks * 0.8 ? 3 : this.placedCount >= this.targetPlanks * 1.2 ? 2 : 1;
                Audio.playSuccessMelody();
                setTimeout(() => this.end(), 600);
                return;
            }
        } else {
            this.addScore(-1);
            Audio.playError();
        }

        this.currentPlank = null;
        if (this.placedCount >= this.maxPlanks && this.placedCount < this.targetPlanks) {
            this.stars = this.placedCount >= this.targetPlanks * 0.6 ? 1 : 0;
            if (this.stars === 0) Audio.playGameOver();
            setTimeout(() => this.end(), 600);
        }
    }

    calculateStars() {}

    _onTap = () => { this._dropPlank(); };
    _onTTap = (e) => { e.preventDefault(); this._dropPlank(); };

    start() { super.start(); this.canvas.addEventListener('mousedown', this._onTap); this.canvas.addEventListener('touchstart', this._onTTap, { passive: false }); }
    destroy() { if (this.canvas) { this.canvas.removeEventListener('mousedown', this._onTap); this.canvas.removeEventListener('touchstart', this._onTTap); } super.destroy(); }
}

if (typeof window !== 'undefined') { window.RainbowBridge = RainbowBridge; if (window.GameRegistry) GameRegistry.register('rainbow-bridge', RainbowBridge); }
