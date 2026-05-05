/**
 * Rainbow Bridge - 彩虹橋梁
 * A game where players click to place planks/stones/lily pads to build a bridge across a river
 * Blocks get washed away by water flow
 */

class RainbowBridge extends GameBase {
    constructor(gameId = 'rainbowBridge', options = {}) {
        super(gameId, options);

        // Game elements
        this.planks = [];
        this.stones = [];
        this.lilyPads = [];
        this.riverBanks = [];
        this.obstacles = [];
        this.currentItem = 'plank';
        this.itemPalette = [];

        // River settings
        this.riverWidth = 0;
        this.riverStartX = 0;
        this.waterFlow = 0;
        this.waterWave = 0;

        // Level settings
        this.levels = [
            { width: 400, gaps: 3, obstacles: 0, time: 60, name: '新手' },
            { width: 500, gaps: 4, obstacles: 1, time: 75, name: '第一關' },
            { width: 600, gaps: 5, obstacles: 2, time: 90, name: '初次挑戰' },
            { width: 700, gaps: 6, obstacles: 3, time: 100, name: '熟練工人' }
        ];
        this.currentLevel = 0;

        // Score tracking
        this.bridgesBuilt = 0;
        this.itemsUsed = 0;

        // Input state
        this.mouseX = 0;
        this.mouseY = 0;
        this.isHovering = false;

        // Bind methods
        this.handleClick = this.handleClick.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
    }

    /**
     * Initialize game elements
     */
    initElements() {
        // Clear previous state
        this.planks = [];
        this.stones = [];
        this.lilyPads = [];
        this.obstacles = [];

        // Setup river
        const levelConfig = this.levels[this.currentLevel];
        this.riverWidth = levelConfig.width;
        this.riverStartX = (this.width - this.riverWidth) / 2;

        // Create river banks
        this.riverBanks = [
            { x: 0, y: 0, width: this.riverStartX, height: this.height, type: 'grass' },
            { x: this.riverStartX + this.riverWidth, y: 0, width: this.width - this.riverStartX - this.riverWidth, height: this.height, type: 'grass' }
        ];

        // Create item palette
        this.itemPalette = [
            { type: 'plank', x: 20, y: this.height - 80, width: 60, height: 20, color: '#8B4513', label: '木板' },
            { type: 'stone', x: 100, y: this.height - 80, width: 50, height: 20, color: '#696969', label: '石頭' },
            { type: 'lilypad', x: 170, y: this.height - 80, width: 40, height: 15, color: '#228B22', label: '蓮葉' }
        ];

        // Spawn obstacles
        this.spawnObstacles(levelConfig.obstacles);

        // Setup input
        this.setupInputHandlers();

        this.itemsUsed = 0;
        this.bridgesBuilt = 0;
        this.currentItem = 'plank';
    }

    /**
     * Setup input handlers
     */
    setupInputHandlers() {
        const canvas = this.canvas;

        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('mousemove', this.handleMouseMove);
        canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });

        document.addEventListener('keydown', (e) => {
            if (e.key === '1') this.currentItem = 'plank';
            if (e.key === '2') this.currentItem = 'stone';
            if (e.key === '3') this.currentItem = 'lilypad';
        });
    }

    /**
     * Handle click
     */
    handleClick(event) {
        if (this.state !== 'playing') return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.handlePlaceItem(x, y);
    }

    /**
     * Handle touch start
     */
    handleTouchStart(event) {
        event.preventDefault();
        if (this.state !== 'playing') return;

        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        this.handlePlaceItem(x, y);
    }

    /**
     * Handle mouse move
     */
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;

        // Check palette hover
        this.isHovering = false;
        for (const item of this.itemPalette) {
            if (this.isPointInRect(this.mouseX, this.mouseY, item)) {
                this.isHovering = true;
                break;
            }
        }
    }

    /**
     * Handle placing item
     */
    handlePlaceItem(x, y) {
        // Check palette selection first
        for (const item of this.itemPalette) {
            if (this.isPointInRect(x, y, item)) {
                this.currentItem = item.type;
                return;
            }
        }

        // Only place in river area
        if (x < this.riverStartX || x > this.riverStartX + this.riverWidth) {
            return;
        }

        // Create item
        const item = this.createItem(x, y);
        if (item) {
            this.addItem(item);
            this.itemsUsed++;
            this.addScore(5);
        }
    }

    /**
     * Create item based on type
     */
    createItem(x, y) {
        switch (this.currentItem) {
            case 'plank':
                return {
                    x: x,
                    y: y,
                    width: 80,
                    height: 15,
                    type: 'plank',
                    vx: 0,
                    vy: 0,
                    rotation: 0,
                    health: 100,
                    floatOffset: Math.random() * Math.PI * 2
                };
            case 'stone':
                return {
                    x: x,
                    y: y,
                    width: 40,
                    height: 30,
                    type: 'stone',
                    vx: 0,
                    vy: 0,
                    rotation: 0,
                    health: 200,
                    floatOffset: 0
                };
            case 'lilypad':
                return {
                    x: x,
                    y: y,
                    width: 35,
                    height: 25,
                    type: 'lilypad',
                    vx: 0,
                    vy: 0,
                    rotation: 0,
                    health: 50,
                    floatOffset: Math.random() * Math.PI * 2,
                    hasFlower: Math.random() > 0.7
                };
        }
        return null;
    }

    /**
     * Add item to appropriate array
     */
    addItem(item) {
        switch (item.type) {
            case 'plank':
                this.planks.push(item);
                break;
            case 'stone':
                this.stones.push(item);
                break;
            case 'lilypad':
                this.lilyPads.push(item);
                break;
        }
    }

    /**
     * Spawn obstacles (tree roots, vortices)
     */
    spawnObstacles(count) {
        for (let i = 0; i < count; i++) {
            const type = Math.random() > 0.5 ? 'root' : 'vortex';
            this.obstacles.push({
                x: this.riverStartX + 50 + Math.random() * (this.riverWidth - 100),
                y: 50 + Math.random() * (this.height - 150),
                radius: type === 'root' ? 25 : 35,
                type: type,
                rotation: 0,
                strength: type === 'vortex' ? 2 : 0
            });
        }
    }

    /**
     * Check if point is in rectangle
     */
    isPointInRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.width &&
               y >= rect.y && y <= rect.y + rect.height;
    }

    /**
     * Update game state
     */
    update(deltaTime) {
        super.update(deltaTime);

        if (this.state !== 'playing') return;

        // Update water effect
        this.waterFlow += deltaTime * 30;
        this.waterWave += deltaTime * 2;

        // Update items
        this.updateItems(deltaTime);

        // Check if bridge is complete
        this.checkBridgeCompletion();
    }

    /**
     * Update all bridge items
     */
    updateItems(deltaTime) {
        const flowSpeed = 0.5 + this.currentLevel * 0.2;
        const allItems = [...this.planks, ...this.stones, ...this.lilyPads];

        for (const item of allItems) {
            // Apply water flow
            item.vx = flowSpeed;

            // Apply vortex effect
            for (const obs of this.obstacles) {
                if (obs.type === 'vortex') {
                    const dx = item.x - obs.x;
                    const dy = item.y - obs.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < obs.radius * 3) {
                        // Rotate around vortex
                        const angle = Math.atan2(dy, dx) + obs.strength * deltaTime;
                        const pushBack = (obs.radius * 3 - dist) * 0.02;
                        item.vx += Math.cos(angle) * pushBack * -1;
                        item.vy = Math.sin(angle) * pushBack * 5;
                    }
                }
            }

            // Apply position
            item.x += item.vx * 60 * deltaTime;

            // Float effect for planks and lily pads
            if (item.type !== 'stone') {
                item.y += Math.sin(this.waterFlow * 0.05 + item.floatOffset) * 0.3;
                item.rotation = Math.sin(this.waterFlow * 0.03 + item.floatOffset) * 0.1;
            }

            // Decrease health based on water damage
            if (item.type === 'plank') {
                item.health -= deltaTime * 10;
            } else if (item.type === 'lilypad') {
                item.health -= deltaTime * 5;
            }
        }

        // Remove items that are off screen or destroyed
        this.planks = this.planks.filter(p => p.x < this.width + 100 && p.health > 0);
        this.stones = this.stones.filter(s => s.x < this.width + 100 && s.health > 0);
        this.lilyPads = this.lilyPads.filter(l => l.x < this.width + 100 && l.health > 0);

        // Update obstacles
        for (const obs of this.obstacles) {
            obs.rotation += deltaTime * 2;
        }
    }

    /**
     * Check if bridge spans the river
     */
    checkBridgeCompletion() {
        // Find leftmost and rightmost items
        const allItems = [...this.planks, ...this.stones, ...this.lilyPads];

        if (allItems.length < 2) return;

        // Sort by x position
        allItems.sort((a, b) => a.x - b.x);

        let leftmost = allItems[0];
        let rightmost = allItems[allItems.length - 1];

        // Check if bridge spans from one bank to the other
        const spansLeft = leftmost.x - leftmost.width / 2 < this.riverStartX + 20;
        const spansRight = rightmost.x + rightmost.width / 2 > this.riverStartX + this.riverWidth - 20;

        // Check connectivity
        let isConnected = true;
        for (let i = 0; i < allItems.length - 1; i++) {
            const current = allItems[i];
            const next = allItems[i + 1];
            const gap = next.x - next.width / 2 - (current.x + current.width / 2);

            if (gap > 60) { // Max gap for walking
                isConnected = false;
                break;
            }
        }

        if (spansLeft && spansRight && isConnected) {
            this.bridgesBuilt++;
            this.addScore(100);

            // Clear bridge and increase difficulty
            this.planks = [];
            this.stones = [];
            this.lilyPads = [];

            if (this.currentLevel < this.levels.length - 1) {
                this.currentLevel++;
                this.initElements();
            } else {
                this.end();
            }
        }
    }

    /**
     * Render game
     */
    render() {
        const ctx = this.renderer.ctx;

        // Draw background
        this.drawBackground(ctx);

        // Draw river banks
        this.drawRiverBanks(ctx);

        // Draw river
        this.drawRiver(ctx);

        // Draw obstacles
        this.drawObstacles(ctx);

        // Draw bridge items
        this.drawItems(ctx);

        // Draw preview item
        this.drawPreview(ctx);

        // Draw palette
        this.drawPalette(ctx);

        // Draw UI
        this.drawUI(ctx);
    }

    /**
     * Draw background
     */
    drawBackground(ctx) {
        // Sky gradient
        const skyGradient = ctx.createLinearGradient(0, 0, 0, this.height);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(1, '#E0F7FA');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, this.width, this.height);

        // Draw trees in background
        ctx.fillStyle = '#2E7D32';
        for (let i = 0; i < 8; i++) {
            const x = 50 + i * 120;
            const y = 30;

            // Tree trunk
            ctx.fillStyle = '#5D4037';
            ctx.fillRect(x - 5, y + 30, 10, 40);

            // Tree foliage
            ctx.fillStyle = '#2E7D32';
            ctx.beginPath();
            ctx.arc(x, y + 10, 35, 0, Math.PI * 2);
            ctx.fill();
        }

        // Clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.drawCloud(ctx, 100, 60, 40);
        this.drawCloud(ctx, 300, 40, 50);
        this.drawCloud(ctx, 500, 70, 35);
        this.drawCloud(ctx, 650, 45, 45);
    }

    /**
     * Draw cloud
     */
    drawCloud(ctx, x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.8, y, size * 0.45, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y + size * 0.2, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw river banks
     */
    drawRiverBanks(ctx) {
        for (const bank of this.riverBanks) {
            // Grass
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(bank.x, bank.y, bank.width, bank.height);

            // Dirt edge
            ctx.fillStyle = '#795548';
            if (bank.x < this.width / 2) {
                ctx.fillRect(bank.x + bank.width - 10, bank.y, 10, bank.height);
            } else {
                ctx.fillRect(bank.x, bank.y, 10, bank.height);
            }
        }
    }

    /**
     * Draw river
     */
    drawRiver(ctx) {
        // River base
        const riverGradient = ctx.createLinearGradient(this.riverStartX, 0, this.riverStartX + this.riverWidth, 0);
        riverGradient.addColorStop(0, '#1565C0');
        riverGradient.addColorStop(0.5, '#1E88E5');
        riverGradient.addColorStop(1, '#1565C0');
        ctx.fillStyle = riverGradient;
        ctx.fillRect(this.riverStartX, 0, this.riverWidth, this.height);

        // Water ripples
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        for (let y = 0; y < this.height; y += 40) {
            ctx.beginPath();
            for (let x = this.riverStartX; x < this.riverStartX + this.riverWidth; x += 10) {
                const waveY = y + Math.sin(this.waterFlow * 0.05 + x * 0.02) * 5;
                if (x === this.riverStartX) {
                    ctx.moveTo(x, waveY);
                } else {
                    ctx.lineTo(x, waveY);
                }
            }
            ctx.stroke();
        }
    }

    /**
     * Draw obstacles
     */
    drawObstacles(ctx) {
        for (const obs of this.obstacles) {
            ctx.save();
            ctx.translate(obs.x, obs.y);
            ctx.rotate(obs.rotation);

            if (obs.type === 'root') {
                // Tree root
                ctx.fillStyle = '#5D4037';
                ctx.beginPath();
                ctx.moveTo(0, -obs.radius);
                ctx.lineTo(obs.radius * 0.8, obs.radius * 0.5);
                ctx.lineTo(obs.radius * 0.3, obs.radius * 0.8);
                ctx.lineTo(-obs.radius * 0.3, obs.radius * 0.6);
                ctx.lineTo(-obs.radius * 0.7, obs.radius * 0.3);
                ctx.lineTo(-obs.radius * 0.5, -obs.radius * 0.5);
                ctx.closePath();
                ctx.fill();

                // Root details
                ctx.strokeStyle = '#4E342E';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else {
                // Vortex
                ctx.strokeStyle = '#0D47A1';
                ctx.lineWidth = 3;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.arc(0, 0, obs.radius - i * 8, i * 0.5, Math.PI + i * 0.5);
                    ctx.stroke();
                }

                // Center
                ctx.fillStyle = '#0a0a3e';
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    /**
     * Draw all items
     */
    drawItems(ctx) {
        // Draw planks
        for (const plank of this.planks) {
            ctx.save();
            ctx.translate(plank.x, plank.y);
            ctx.rotate(plank.rotation);

            // Plank body
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-plank.width / 2, -plank.height / 2, plank.width, plank.height);

            // Wood grain
            ctx.strokeStyle = '#6D4C41';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-plank.width / 2 + 5, -plank.height / 2 + 3);
            ctx.lineTo(plank.width / 2 - 5, -plank.height / 2 + 3);
            ctx.moveTo(-plank.width / 2 + 5, plank.height / 2 - 3);
            ctx.lineTo(plank.width / 2 - 5, plank.height / 2 - 3);
            ctx.stroke();

            ctx.restore();
        }

        // Draw stones
        for (const stone of this.stones) {
            ctx.save();
            ctx.translate(stone.x, stone.y);

            // Stone body
            const stoneGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, stone.width / 2);
            stoneGradient.addColorStop(0, '#9E9E9E');
            stoneGradient.addColorStop(1, '#616161');
            ctx.fillStyle = stoneGradient;
            ctx.beginPath();
            ctx.ellipse(0, 0, stone.width / 2, stone.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Stone outline
            ctx.strokeStyle = '#424242';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();
        }

        // Draw lily pads
        for (const pad of this.lilyPads) {
            ctx.save();
            ctx.translate(pad.x, pad.y);
            ctx.rotate(pad.rotation);

            // Pad body
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.arc(0, 0, pad.width / 2, 0.2, Math.PI * 2 - 0.2);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();

            // Pad vein
            ctx.strokeStyle = '#1B5E20';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(pad.width / 2 - 5, 0);
            ctx.stroke();

            // Flower
            if (pad.hasFlower) {
                ctx.fillStyle = '#FF69B4';
                ctx.beginPath();
                ctx.arc(pad.width / 4, 0, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(pad.width / 4, 0, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    /**
     * Draw preview item
     */
    drawPreview(ctx) {
        if (this.isHovering) return;
        if (this.mouseX < this.riverStartX || this.mouseX > this.riverStartX + this.riverWidth) return;
        if (this.state !== 'playing') return;

        ctx.globalAlpha = 0.5;

        let previewItem;
        switch (this.currentItem) {
            case 'plank':
                previewItem = { width: 80, height: 15 };
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.mouseX - previewItem.width / 2, this.mouseY - previewItem.height / 2, previewItem.width, previewItem.height);
                break;
            case 'stone':
                previewItem = { width: 40, height: 30 };
                ctx.fillStyle = '#696969';
                ctx.beginPath();
                ctx.ellipse(this.mouseX, this.mouseY, previewItem.width / 2, previewItem.height / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'lilypad':
                previewItem = { width: 35, height: 25 };
                ctx.fillStyle = '#228B22';
                ctx.beginPath();
                ctx.arc(this.mouseX, this.mouseY, previewItem.width / 2, 0.2, Math.PI * 2 - 0.2);
                ctx.lineTo(this.mouseX, this.mouseY);
                ctx.closePath();
                ctx.fill();
                break;
        }

        ctx.globalAlpha = 1;
    }

    /**
     * Draw item palette
     */
    drawPalette(ctx) {
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, this.height - 100, this.width, 100);

        for (const item of this.itemPalette) {
            // Highlight selected
            if (item.type === this.currentItem) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(item.x - 5, item.y - 5, item.width + 10, item.height + 10);
            }

            switch (item.type) {
                case 'plank':
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(item.x, item.y, item.width, item.height);
                    ctx.strokeStyle = '#6D4C41';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(item.x, item.y, item.width, item.height);
                    break;
                case 'stone':
                    ctx.fillStyle = '#696969';
                    ctx.beginPath();
                    ctx.ellipse(item.x + item.width / 2, item.y + item.height / 2, item.width / 2, item.height / 2, 0, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'lilypad':
                    ctx.fillStyle = '#228B22';
                    ctx.beginPath();
                    ctx.arc(item.x + item.width / 2, item.y + item.height / 2, item.width / 2, 0.2, Math.PI * 2 - 0.2);
                    ctx.lineTo(item.x + item.width / 2, item.y + item.height / 2);
                    ctx.closePath();
                    ctx.fill();
                    break;
            }

            // Label
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(item.label, item.x + item.width / 2, item.y + item.height + 15);
        }

        // Instructions
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '11px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('按 1/2/3 選擇道具', 250, this.height - 60);
    }

    /**
     * Draw UI
     */
    drawUI(ctx) {
        // Score
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`分數: ${this.score}`, 15, 35);

        // Level
        const levelConfig = this.levels[this.currentLevel];
        ctx.textAlign = 'right';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`第${this.currentLevel + 1}關: ${levelConfig.name}`, this.width - 15, 35);

        // Bridges built
        ctx.font = '16px Arial';
        ctx.fillText(`橋樑: ${this.bridgesBuilt}`, this.width - 15, 60);

        // Instructions
        ctx.textAlign = 'center';
        ctx.font = '14px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText('在河流中放置物品搭建橋樑！', this.width / 2, this.height - 110);
    }

    /**
     * Calculate stars
     */
    calculateStars() {
        this.stars = Utils.calculateStars(this.score, {
            one: 100,
            two: 250,
            three: 500
        });
    }

    /**
     * Start game
     */
    start() {
        this.currentLevel = 0;
        super.start();
    }

    /**
     * Clean up
     */
    destroy() {
        this.canvas?.removeEventListener('click', this.handleClick);
        this.canvas?.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas?.removeEventListener('touchstart', this.handleTouchStart);
        super.destroy();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RainbowBridge;
}

// Register globally for browser use
if (typeof window !== 'undefined') {
    window.RainbowBridge = RainbowBridge;
    if (window.GameRegistry) {
        GameRegistry.register('rainbow-bridge', RainbowBridge);
    }
}