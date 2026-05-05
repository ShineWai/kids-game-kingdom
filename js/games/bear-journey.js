/**
 * Bear Journey - Help the bear find mama through the maze!
 */
class BearJourney extends GameBase {
    constructor(gameId, levelOrOptions) {
        super(gameId, levelOrOptions);
        const configs = [
            { mazeSize: 5, obstacles: 3,  targetSteps: 10 },
            { mazeSize: 6, obstacles: 5,  targetSteps: 14 },
            { mazeSize: 6, obstacles: 6,  targetSteps: 16 },
            { mazeSize: 7, obstacles: 7,  targetSteps: 20 },
            { mazeSize: 7, obstacles: 8,  targetSteps: 22 },
            { mazeSize: 8, obstacles: 9,  targetSteps: 26 },
            { mazeSize: 8, obstacles: 10, targetSteps: 28 },
            { mazeSize: 9, obstacles: 11, targetSteps: 32 },
            { mazeSize: 9, obstacles: 12, targetSteps: 34 },
            { mazeSize: 10, obstacles: 14, targetSteps: 38 }
        ];
        const cfg = configs[Math.min(this.level - 1, 9)];
        this.mazeSize = cfg.mazeSize;
        this.numObstacles = cfg.obstacles;
        this.targetSteps = cfg.targetSteps;
        this.cellSize = Math.floor(Math.min(this.width, this.height - 80) / this.mazeSize);
        this.grid = [];
        this.bear = { x: 0, y: 0 };
        this.mama = { x: this.mazeSize - 1, y: this.mazeSize - 1 };
        this.steps = 0;
        this.won = false;
    }

    initElements() {
        this.steps = 0;
        this.won = false;
        this.bear = { x: 0, y: 0 };
        this.mama = { x: this.mazeSize - 1, y: this.mazeSize - 1 };
        this.grid = [];
        for (let y = 0; y < this.mazeSize; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.mazeSize; x++) {
                this.grid[y][x] = 0; // 0=empty, 1=obstacle
            }
        }
        // Place obstacles randomly (not on start/mama)
        let placed = 0;
        while (placed < this.numObstacles) {
            const ox = Utils.random(0, this.mazeSize - 1);
            const oy = Utils.random(0, this.mazeSize - 1);
            if ((ox === 0 && oy === 0) || (ox === this.mama.x && oy === this.mama.y) || this.grid[oy][ox] === 1) continue;
            this.grid[oy][ox] = 1;
            placed++;
        }
    }

    update(deltaTime) {
        if (this.state !== 'playing' || this.gameCompleteCalled || this.won) return;
        if (this.bear.x === this.mama.x && this.bear.y === this.mama.y) {
            this.won = true;
            const efficiency = this.targetSteps / Math.max(this.steps, 1);
            this.stars = efficiency >= 1.5 ? 3 : efficiency >= 1.0 ? 2 : 1;
            this.addScore(Math.floor(efficiency * 100));
            Audio.playSuccessMelody();
            setTimeout(() => this.end(), 600);
        }
    }
    calculateStars() {}

    render() {
        this.renderer.clearWithColor('#FFF8E1');
        const ctx = this.renderer.ctx;
        const offsetX = (this.width - this.mazeSize * this.cellSize) / 2;
        const offsetY = 50;

        // Grid cells
        for (let y = 0; y < this.mazeSize; y++) {
            for (let x = 0; x < this.mazeSize; x++) {
                const cx = offsetX + x * this.cellSize;
                const cy = offsetY + y * this.cellSize;
                ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                ctx.lineWidth = 1;
                ctx.strokeRect(cx, cy, this.cellSize, this.cellSize);

                if (this.grid[y][x] === 1) {
                    // Bush/obstacle
                    ctx.fillStyle = '#8BC34A';
                    ctx.beginPath();
                    ctx.arc(cx + this.cellSize/2, cy + this.cellSize/2, this.cellSize * 0.4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#689F38';
                    ctx.beginPath();
                    ctx.arc(cx + this.cellSize/2, cy + this.cellSize/2, this.cellSize * 0.25, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Mama bear
        const mx = offsetX + this.mama.x * this.cellSize + this.cellSize / 2;
        const my = offsetY + this.mama.y * this.cellSize + this.cellSize / 2;
        this.renderer.drawEmoji('🐻', mx, my, this.cellSize * 0.8);
        ctx.fillStyle = '#E91E63'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('媽媽', mx, my - this.cellSize * 0.5);

        // Baby bear
        const bx = offsetX + this.bear.x * this.cellSize + this.cellSize / 2;
        const by = offsetY + this.bear.y * this.cellSize + this.cellSize / 2;
        this.renderer.drawEmoji('🐾', bx, by, this.cellSize * 0.7);

        // Path trail
        if (!this.won && this.bear.x !== this.mama.x || this.bear.y !== this.mama.y) {
            ctx.strokeStyle = 'rgba(255,183,77,0.3)'; ctx.lineWidth = 3; ctx.setLineDash([3, 3]);
            ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(mx, my); ctx.stroke(); ctx.setLineDash([]);
        }

        this.renderer.drawText('步數: ' + this.steps + ' / ' + this.targetSteps, this.width / 2, 24, { font: 'bold 16px sans-serif', color: '#5D4037' });
    }

    _moveBear(dx, dy) {
        if (this.state !== 'playing' || this.won) return;
        const nx = this.bear.x + dx;
        const ny = this.bear.y + dy;
        if (nx >= 0 && nx < this.mazeSize && ny >= 0 && ny < this.mazeSize && this.grid[ny][nx] !== 1) {
            this.bear.x = nx;
            this.bear.y = ny;
            this.steps++;
            Audio.playSound(Constants.AUDIO.CLICK);
        } else {
            Audio.playError();
        }
    }

    _onTap = (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        const offsetX = (this.width - this.mazeSize * this.cellSize) / 2;
        const offsetY = 50;

        const dx = x - (offsetX + this.bear.x * this.cellSize + this.cellSize / 2);
        const dy = y - (offsetY + this.bear.y * this.cellSize + this.cellSize / 2);

        if (Math.abs(dx) > Math.abs(dy)) {
            this._moveBear(dx > 0 ? 1 : -1, 0);
        } else {
            this._moveBear(0, dy > 0 ? 1 : -1);
        }
    };

    start() { super.start(); this.canvas.addEventListener('mousedown', this._onTap); this.canvas.addEventListener('touchstart', this._onTap, { passive: false }); }
    destroy() { if (this.canvas) { this.canvas.removeEventListener('mousedown', this._onTap); this.canvas.removeEventListener('touchstart', this._onTap); } super.destroy(); }
}

if (typeof window !== 'undefined') { window.BearJourney = BearJourney; if (window.GameRegistry) GameRegistry.register('bear-journey', BearJourney); }
