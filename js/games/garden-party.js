/**
 * Garden Party - Care for your garden plants!
 */
class GardenParty extends GameBase {
    constructor(gameId, levelOrOptions) {
        super(gameId, levelOrOptions);
        const configs = [
            { plants: 3, weeds: 2, target: 3  },
            { plants: 4, weeds: 3, target: 4  },
            { plants: 4, weeds: 4, target: 4  },
            { plants: 5, weeds: 4, target: 5  },
            { plants: 5, weeds: 5, target: 5  },
            { plants: 6, weeds: 5, target: 6  },
            { plants: 6, weeds: 6, target: 6  },
            { plants: 7, weeds: 6, target: 7  },
            { plants: 7, weeds: 7, target: 7  },
            { plants: 8, weeds: 7, target: 8  }
        ];
        const cfg = configs[Math.min(this.level - 1, 9)];
        this.numPlants = cfg.plants;
        this.numWeeds = cfg.weeds;
        this.targetPlants = cfg.target;

        this.plots = [];
        this.blooms = [];
        this.caredPlants = 0;
        this.plotSize = 60;
        this.toolMode = 'water'; // 'water' | 'weed'
    }

    initElements() {
        this.plots = []; this.blooms = []; this.caredPlants = 0; this.toolMode = 'water';

        const cols = Math.floor((this.width - 20) / (this.plotSize + 10));
        const rows = 3;
        const totalW = cols * (this.plotSize + 10) - 10;
        const startX = (this.width - totalW) / 2;
        const startY = this.height / 2 - 60;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.plots.push({
                    x: startX + c * (this.plotSize + 10), y: startY + r * (this.plotSize + 10),
                    hasPlant: false, hasWeed: false,
                    watered: false, weeded: false,
                    plantGrowth: 0, plantType: '🌻'
                });
            }
        }

        // Randomly assign plants
        let plantsAssigned = 0;
        const available = [...this.plots];
        Utils.shuffle(available);
        for (const plot of available) {
            if (plantsAssigned >= this.numPlants) break;
            plot.hasPlant = true;
            plot.plantType = ['🌻','🌷','🌹','🌸','🌺','🪷'][Utils.random(0, 5)];
            plantsAssigned++;
        }

        // Randomly assign weeds (on non-planted plots or some planted ones)
        let weedsAssigned = 0;
        const nonPlanted = this.plots.filter(p => !p.hasPlant || (p.hasPlant && weedsAssigned < this.numWeeds - this.plots.filter(pp => !pp.hasPlant).length));
        Utils.shuffle(nonPlanted);
        for (const plot of nonPlanted) {
            if (weedsAssigned >= this.numWeeds) break;
            plot.hasWeed = true;
            weedsAssigned++;
        }
    }

    update(deltaTime) {
        if (this.state !== 'playing' || this.gameCompleteCalled) return;

        // Grow watered plants
        this.plots.forEach(p => {
            if (p.hasPlant && p.watered && p.plantGrowth < 1) p.plantGrowth += 0.003;
            if (p.hasWeed && p.weeded && p.plantGrowth < 1) p.plantGrowth += 0.003;
        });

        // Count cared plants
        let cared = 0;
        this.plots.forEach(p => {
            if (p.hasPlant && p.watered && p.plantGrowth >= 0.5) cared++;
        });
        this.caredPlants = cared;

        if (this.caredPlants >= this.targetPlants && !this.gameCompleteCalled) {
            this.stars = this.caredPlants >= this.numPlants ? 3 : this.caredPlants >= this.targetPlants * 1.2 ? 2 : 1;
            this.addScore(this.caredPlants * 50);
            Audio.playSuccessMelody();
            Audio.vibrateSuccess();
            setTimeout(() => this.end(), 600);
        }
    }
    calculateStars() {}

    render() {
        this.renderer.drawGradient(0, 0, this.width, this.height, '#E8F5E9', '#C8E6C9');
        const ctx = this.renderer.ctx;

        this.plots.forEach(p => {
            // Soil
            this.renderer.drawRect(p.x, p.y, this.plotSize, this.plotSize, '#8D6E63', 8);

            // Plant
            if (p.hasPlant) {
                this.renderer.drawEmoji(p.plantType, p.x + this.plotSize / 2, p.y + this.plotSize / 2 - 4, 28);
                if (p.watered) {
                    // Growth indicator
                    ctx.fillStyle = 'rgba(102,187,106,0.5)';
                    ctx.fillRect(p.x, p.y + this.plotSize - 4, this.plotSize * p.plantGrowth, 4);
                }
                if (p.plantGrowth >= 0.9) {
                    ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(p.x + this.plotSize / 2, p.y + this.plotSize / 2, this.plotSize / 2, 0, Math.PI * 2); ctx.stroke();
                }
            }

            // Weed
            if (p.hasWeed && !p.weeded) {
                this.renderer.drawEmoji('🌿', p.x + this.plotSize - 16, p.y + this.plotSize - 16, 18);
            }

            // Watered indicator
            if (p.watered && p.hasPlant) {
                ctx.fillStyle = 'rgba(33,150,243,0.2)';
                ctx.fillRect(p.x, p.y, this.plotSize, this.plotSize);
            }
        });

        // Bloom effects
        this.blooms.forEach((b, i) => {
            ctx.globalAlpha = b.alpha;
            this.renderer.drawEmoji('✨', b.x, b.y, 16);
            b.y -= 0.5; b.alpha -= 0.02;
        });
        ctx.globalAlpha = 1;

        // Tool indicator
        const toolIcon = this.toolMode === 'water' ? '💧' : '✂️';
        const toolLabel = this.toolMode === 'water' ? '澆水' : '除草';
        this.renderer.drawText(toolIcon + ' ' + toolLabel + ' (點擊切換)', this.width / 2, 24, { font: 'bold 16px sans-serif', color: '#2E7D32' });
        this.renderer.drawText('照顧: ' + this.caredPlants + '/' + this.targetPlants, this.width / 2, this.height - 16, { font: '14px sans-serif', color: '#33691E' });
    }

    _handleTap(x, y) {
        if (this.state !== 'playing') return;

        // Check tool toggle area (top)
        if (y < 50) { this.toolMode = this.toolMode === 'water' ? 'weed' : 'water'; Audio.playSound(Constants.AUDIO.CLICK); return; }

        for (const p of this.plots) {
            if (x >= p.x && x <= p.x + this.plotSize && y >= p.y && y <= p.y + this.plotSize) {
                if (this.toolMode === 'water' && p.hasPlant && !p.watered) {
                    p.watered = true;
                    this.blooms.push({ x: p.x + this.plotSize / 2, y: p.y, alpha: 1 });
                    Audio.playStar();
                    return;
                }
                if (this.toolMode === 'weed' && p.hasWeed && !p.weeded) {
                    p.weeded = true;
                    this.blooms.push({ x: p.x + this.plotSize / 2, y: p.y, alpha: 1 });
                    Audio.playSound(Constants.AUDIO.CLICK);
                    return;
                }
                Audio.playError();
                return;
            }
        }
    }

    _onTap = (e) => { const r = this.canvas.getBoundingClientRect(); this._handleTap((e.touches?e.touches[0].clientX:e.clientX) - r.left, (e.touches?e.touches[0].clientY:e.clientY) - r.top); };
    _onTTap = (e) => { e.preventDefault(); this._onTap(e); };

    start() { super.start(); this.canvas.addEventListener('mousedown', this._onTap); this.canvas.addEventListener('touchstart', this._onTTap, { passive: false }); }
    destroy() { if (this.canvas) { this.canvas.removeEventListener('mousedown', this._onTap); this.canvas.removeEventListener('touchstart', this._onTTap); } super.destroy(); }
}

if (typeof window !== 'undefined') { window.GardenParty = GardenParty; if (window.GameRegistry) GameRegistry.register('garden-party', GardenParty); }
