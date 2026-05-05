/**
 * Block Kingdom Game - Stack blocks to build a tower
 * Theme: Colorful Block Castle
 */

class BlockKingdom extends GameBase {
    constructor(level = 1) {
        super('block-kingdom', level);

        // Level configuration
        this.instrumentCount = Math.min(1 + Math.floor((level - 1) / 2), 4);
        this.tempo = 80 + (level * 10);

        // Game state
        this.blocks = [];
        this.blockIdCounter = 0;
        this.isDropping = false;
        this.currentBlock = null;
        this.gameOverTriggered = false;

        // Physics properties
        this.gravity = 0.3;
        this.friction = 0.8;

        // Block types
        this.blockTypes = [
            { type: 'square', width: 60, height: 60, color: '#EF5350' },
            { type: 'rect', width: 80, height: 40, color: '#42A5F5' },
            { type: 'triangle', width: 60, height: 50, color: '#66BB6A' }
        ];

        // Special events
        this.windDirection = 0;
        this.windStrength = 0;
        this.earthquakeTimer = 0;
        this.earthquakeActive = false;

        // Wind change interval (seconds)
        this.windChangeInterval = 10 + Utils.random(0, 5);
        this.windTimer = 0;

        // Input handling
        this.handleClick = this.handleClick.bind(this);
    }

    /**
     * Initialize game elements
     */
    initElements() {
        this.blocks = [];
        this.blockIdCounter = 0;
        this.gameOverTriggered = false;
        this.windDirection = Utils.randomBool() ? 1 : -1;
        this.windStrength = 0;
        this.windTimer = 0;
        this.earthquakeTimer = 0;
        this.earthquakeActive = false;

        // Create foundation platform
        this.blocks.push({
            id: this.blockIdCounter++,
            x: this.width / 2 - 100,
            y: this.height - 60,
            width: 200,
            height: 30,
            vx: 0,
            vy: 0,
            rotation: 0,
            vRotation: 0,
            color: '#795548',
            type: 'platform',
            isStatic: true
        });

        // Spawn first block
        this.spawnBlock();
    }

    /**
     * Spawn a new block
     */
    spawnBlock() {
        const blockType = Utils.randomItem(this.blockTypes);
        const x = Utils.random(50, this.width - 50 - blockType.width);
        const y = 50;

        this.currentBlock = {
            id: this.blockIdCounter++,
            x: x,
            y: y,
            width: blockType.width,
            height: blockType.height,
            vx: 0,
            vy: 0,
            rotation: 0,
            vRotation: 0,
            color: blockType.color,
            type: blockType.type,
            isStatic: false,
            grounded: false
        };
    }

    /**
     * Update game state
     */
    update(deltaTime) {
        if (this.state !== 'playing') return;

        // Update wind
        this.windTimer += deltaTime;
        if (this.windTimer >= this.windChangeInterval) {
            this.windTimer = 0;
            this.windChangeInterval = 10 + Utils.random(0, 5);
            this.windDirection = Utils.randomBool() ? 1 : -1;
            this.windStrength = Utils.random(0.5, 2);
        }

        // Update earthquake
        if (this.earthquakeActive) {
            this.earthquakeTimer -= deltaTime;
            if (this.earthquakeTimer <= 0) {
                this.earthquakeActive = false;
            }
        }

        // Apply wind force to non-grounded blocks
        this.blocks.forEach(block => {
            if (!block.isStatic && !block.grounded) {
                block.vx += this.windDirection * this.windStrength * 0.1;
            }
        });

        // Update current block
        if (this.currentBlock) {
            // Apply gravity
            this.currentBlock.vy += this.gravity;

            // Apply wind
            this.currentBlock.vx += this.windDirection * this.windStrength * 0.05;

            // Apply velocity
            this.currentBlock.x += this.currentBlock.vx;
            this.currentBlock.y += this.currentBlock.vy;

            // Apply rotation (angular velocity)
            this.currentBlock.rotation += this.currentBlock.vRotation;
            this.currentBlock.vRotation *= 0.98;

            // Check collisions with placed blocks
            this.checkCollisions(this.currentBlock);

            // Check if block fell off screen
            if (this.currentBlock.y > this.height + 100) {
                this.gameOver();
                return;
            }

            // Check if block is settled (grounded for a while)
            if (this.currentBlock.grounded) {
                this.placeBlock();
            }
        }

        // Apply earthquake shake
        if (this.earthquakeActive) {
            this.blocks.forEach(block => {
                if (!block.isStatic) {
                    block.x += Utils.random(-5, 5);
                    block.vx += Utils.random(-0.5, 0.5);
                }
            });
        }

        // Update score based on tower height
        this.updateScore();

        // Check game over (tower collapsed)
        this.checkTowerCollapse();
    }

    /**
     * Check collisions between blocks
     */
    checkCollisions(block) {
        // Ground collision
        if (block.y + block.height >= this.height - 60) {
            block.y = this.height - 60 - block.height;
            block.vy = 0;
            block.vx *= this.friction;
            block.grounded = true;
            block.vRotation = block.vx * 0.02;
        }

        // Platform collision
        const platform = this.blocks.find(b => b.type === 'platform');
        if (platform && block !== platform) {
            if (this.rectIntersect(block, platform)) {
                block.y = platform.y - block.height;
                block.vy = 0;
                block.vx *= this.friction;
                block.grounded = true;
            }
        }

        // Block-to-block collision
        this.blocks.forEach(other => {
            if (other.id === block.id || other.isStatic) return;

            if (this.rectIntersect(block, other)) {
                // Simple collision response
                const overlapX = Math.min(block.x + block.width - other.x, other.x + other.width - block.x);
                const overlapY = Math.min(block.y + block.height - other.y, other.y + other.height - block.y);

                if (overlapX < overlapY) {
                    // Horizontal collision
                    if (block.x < other.x) {
                        block.x = other.x - block.width;
                    } else {
                        block.x = other.x + other.width;
                    }
                    block.vx *= -this.friction;
                } else {
                    // Vertical collision
                    if (block.y < other.y) {
                        block.y = other.y - block.height;
                        block.vy = 0;
                        block.vx *= this.friction;
                        block.grounded = true;
                    } else {
                        block.y = other.y + other.height;
                        block.vy *= -0.3;
                    }
                }
            }
        });

        // Screen boundary
        if (block.x < 0) {
            block.x = 0;
            block.vx *= -0.5;
        }
        if (block.x + block.width > this.width) {
            block.x = this.width - block.width;
            block.vx *= -0.5;
        }
    }

    /**
     * Check if two rectangles intersect
     */
    rectIntersect(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    /**
     * Place current block
     */
    placeBlock() {
        if (!this.currentBlock) return;

        this.blocks.push(this.currentBlock);

        // Calculate score based on height
        const towerHeight = this.height - 60 - this.currentBlock.y;
        this.addScore(Math.floor(towerHeight / 10));

        // Random chance for special events
        if (Math.random() < 0.1) {
            this.triggerEarthquake();
        }

        // Spawn new block
        this.spawnBlock();

        Audio.playSound(Constants.AUDIO.CLICK);
    }

    /**
     * Trigger earthquake event
     */
    triggerEarthquake() {
        this.earthquakeActive = true;
        this.earthquakeTimer = 2;
        Audio.playSound(Constants.AUDIO.WARNING);
    }

    /**
     * Update score based on tower height
     */
    updateScore() {
        if (this.blocks.length > 1) {
            // Calculate average height of top 3 blocks
            const sortedBlocks = this.blocks
                .filter(b => !b.isStatic)
                .sort((a, b) => a.y - b.y);

            if (sortedBlocks.length > 0) {
                let totalHeight = 0;
                const topBlocks = sortedBlocks.slice(0, 3);
                topBlocks.forEach(b => {
                    totalHeight += this.height - 60 - b.y;
                });
                const avgHeight = totalHeight / topBlocks.length;
                const heightScore = Math.floor(avgHeight / 10);

                if (heightScore > this.score) {
                    this.addScore(heightScore - this.score);
                }
            }
        }
    }

    /**
     * Check if tower has collapsed
     */
    checkTowerCollapse() {
        // Check if any block fell off the bottom
        const fallenBlock = this.blocks.find(b => !b.isStatic && b.y > this.height);
        if (fallenBlock && !this.gameOverTriggered) {
            // Only game over if tower is tall enough
            if (this.blocks.length > 5) {
                this.gameOver();
            }
        }
    }

    /**
     * Handle game over
     */
    gameOver() {
        if (this.gameOverTriggered) return;
        this.gameOverTriggered = true;

        setTimeout(() => {
            this.end();
            if (this.onGameOver) {
                this.onGameOver(this.getResult());
            }
        }, 500);
    }

    /**
     * Handle click/tap - drop block
     */
    handleClick(x, y) {
        if (this.state !== 'playing' || !this.currentBlock) return;

        // Drop the current block with some random velocity based on click position
        const centerX = this.currentBlock.x + this.currentBlock.width / 2;
        const clickOffset = (x - centerX) / this.width;

        this.currentBlock.vx = clickOffset * 5;
        this.currentBlock.vRotation = clickOffset * 0.1;

        this.isDropping = true;
        Audio.playSound(Constants.AUDIO.CLICK);
    }

    /**
     * Calculate stars based on tower height
     */
    calculateStars() {
        if (this.score >= 100) {
            this.stars = 3;
        } else if (this.score >= 50) {
            this.stars = 2;
        } else if (this.score >= 20) {
            this.stars = 1;
        }
    }

    /**
     * Render game
     */
    render() {
        // Draw sky gradient background
        this.renderer.drawGradient(0, 0, this.width, this.height, '#87CEEB', '#E0F7FA');

        // Draw castle background
        this.drawCastleBackground();

        // Draw wind indicator
        this.drawWindIndicator();

        // Draw earthquake warning
        if (this.earthquakeActive) {
            this.drawEarthquakeWarning();
        }

        // Draw blocks
        this.blocks.forEach(block => {
            this.drawBlock(block);
        });

        // Draw current block
        if (this.currentBlock && !this.currentBlock.grounded) {
            this.drawBlock(this.currentBlock);
        }

        // Draw ground
        this.drawGround();

        // Draw HUD
        this.renderHUD();
    }

    /**
     * Draw castle background
     */
    drawCastleBackground() {
        const ctx = this.renderer.ctx;

        // Castle towers
        const towerColor = '#D7CCC8';

        // Left tower
        ctx.fillStyle = towerColor;
        ctx.fillRect(20, this.height - 200, 40, 150);
        ctx.fillStyle = '#8D6E63';
        ctx.beginPath();
        ctx.moveTo(15, this.height - 200);
        ctx.lineTo(40, this.height - 250);
        ctx.lineTo(65, this.height - 200);
        ctx.fill();

        // Right tower
        ctx.fillStyle = towerColor;
        ctx.fillRect(this.width - 60, this.height - 180, 40, 130);
        ctx.fillStyle = '#8D6E63';
        ctx.beginPath();
        ctx.moveTo(this.width - 65, this.height - 180);
        ctx.lineTo(this.width - 40, this.height - 230);
        ctx.lineTo(this.width - 15, this.height - 180);
        ctx.fill();
    }

    /**
     * Draw wind indicator
     */
    drawWindIndicator() {
        const indicatorX = 50;
        const indicatorY = 50;

        this.renderer.drawText('風向', indicatorX, indicatorY, {
            font: '12px -apple-system, BlinkMacSystemFont, sans-serif',
            color: '#546E7A'
        });

        // Draw wind arrow
        const arrowX = indicatorX + 30;
        const arrowY = indicatorY + 5;
        const arrowLen = this.windStrength * 15;

        this.renderer.ctx.strokeStyle = '#4FC3F7';
        this.renderer.ctx.lineWidth = 3;
        this.renderer.ctx.beginPath();
        this.renderer.ctx.moveTo(arrowX, arrowY);
        this.renderer.ctx.lineTo(arrowX + this.windDirection * arrowLen, arrowY);
        this.renderer.ctx.stroke();

        // Arrow head
        this.renderer.ctx.beginPath();
        this.renderer.ctx.moveTo(arrowX + this.windDirection * arrowLen, arrowY);
        this.renderer.ctx.lineTo(arrowX + this.windDirection * (arrowLen - 8), arrowY - 5);
        this.renderer.ctx.moveTo(arrowX + this.windDirection * arrowLen, arrowY);
        this.renderer.ctx.lineTo(arrowX + this.windDirection * (arrowLen - 8), arrowY + 5);
        this.renderer.ctx.stroke();
    }

    /**
     * Draw earthquake warning
     */
    drawEarthquakeWarning() {
        const warningText = '地震!';
        this.renderer.drawText(warningText, this.width / 2, 100, {
            font: 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif',
            color: '#D32F2F'
        });
    }

    /**
     * Draw a block
     */
    drawBlock(block) {
        this.renderer.save();

        const cx = block.x + block.width / 2;
        const cy = block.y + block.height / 2;

        this.renderer.ctx.translate(cx, cy);
        this.renderer.ctx.rotate(block.rotation);

        if (block.type === 'triangle') {
            this.renderer.ctx.beginPath();
            this.renderer.ctx.moveTo(0, -block.height / 2);
            this.renderer.ctx.lineTo(block.width / 2, block.height / 2);
            this.renderer.ctx.lineTo(-block.width / 2, block.height / 2);
            this.renderer.ctx.closePath();
            this.renderer.ctx.fillStyle = block.color;
            this.renderer.ctx.fill();
            this.renderer.ctx.strokeStyle = this.darkenColor(block.color, 20);
            this.renderer.ctx.lineWidth = 2;
            this.renderer.ctx.stroke();
        } else {
            // Rectangle or square
            this.renderer.drawRect(
                -block.width / 2,
                -block.height / 2,
                block.width,
                block.height,
                block.color,
                2
            );

            // Add highlight
            this.renderer.ctx.fillStyle = this.lightenColor(block.color, 30);
            this.renderer.ctx.fillRect(
                -block.width / 2 + 4,
                -block.height / 2 + 4,
                block.width - 8,
                8
            );
        }

        this.renderer.restore();
    }

    /**
     * Draw ground
     */
    drawGround() {
        // Grass
        this.renderer.drawRect(0, this.height - 60, this.width, 60, '#8BC34A');

        // Dirt
        this.renderer.drawRect(0, this.height - 30, this.width, 30, '#795548');

        // Grass blades
        const ctx = this.renderer.ctx;
        ctx.strokeStyle = '#689F38';
        ctx.lineWidth = 2;
        for (let i = 0; i < this.width; i += 15) {
            ctx.beginPath();
            ctx.moveTo(i, this.height - 60);
            ctx.lineTo(i + 3, this.height - 70);
            ctx.stroke();
        }
    }

    /**
     * Render HUD
     */
    renderHUD() {
        // Score
        this.renderer.drawText(`高度: ${this.score}`, this.width / 2, 30, {
            font: 'bold 22px -apple-system, BlinkMacSystemFont, sans-serif',
            color: '#37474F'
        });

        // Tower height
        const topBlock = this.blocks
            .filter(b => !b.isStatic)
            .sort((a, b) => a.y - b.y)[0];

        if (topBlock) {
            const heightCm = Math.floor((this.height - 60 - topBlock.y) / 2);
            this.renderer.drawText(`塔高: ${heightCm}層`, this.width / 2, 55, {
                font: '16px -apple-system, BlinkMacSystemFont, sans-serif',
                color: '#546E7A'
            });
        }

        // Instructions
        if (!this.isDropping) {
            this.renderer.drawText('點擊放下積木', this.width / 2, this.height - 80, {
                font: '14px -apple-system, BlinkMacSystemFont, sans-serif',
                color: '#78909C'
            });
        }
    }

    /**
     * Lighten a hex color
     */
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    /**
     * Darken a hex color
     */
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    /**
     * Set up input handlers
     */
    setupInput() {
        const canvas = this.canvas;

        // Mouse events
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.handleClick(e.clientX - rect.left, e.clientY - rect.top);
        });

        // Touch events
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            this.handleClick(touch.clientX - rect.left, touch.clientY - rect.top);
        }, { passive: false });
    }

    /**
     * Start the game
     */
    start() {
        super.start();
        this.setupInput();
    }

    /**
     * Clean up
     */
    destroy() {
        if (this.canvas) {
            this.canvas.removeEventListener('click', this.handleClick);
            this.canvas.removeEventListener('touchstart', this.handleClick);
        }
        super.destroy();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlockKingdom;
}