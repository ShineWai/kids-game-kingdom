/**
 * Shape Slicer Game - Drag fragments to assemble target shapes
 * Theme: Rainbow Valley
 */

class ShapeSlicer extends GameBase {
    constructor(level = 1) {
        super('shape-slicer', level);

        // Level configuration: pieceCount increases from 2 to 10
        const pieceCount = Math.min(2 + (level - 1), 10);
        this.targetPieceCount = pieceCount;
        this.piecesPlaced = 0;

        // Game state
        this.shapes = ['circle', 'triangle', 'square'];
        this.currentShapeIndex = (level - 1) % 3;
        this.currentShape = this.shapes[this.currentShapeIndex];

        this.fragments = [];
        this.targetFragments = [];
        this.draggingFragment = null;
        this.dragOffset = { x: 0, y: 0 };
        this.snapDistance = 40;

        // Rainbow valley theme colors
        this.rainbowColors = ['#EF5350', '#FFB74D', '#FFEB3B', '#66BB6A', '#4FC3F7', '#7E57C2', '#EC407A'];

        // Shape colors
        this.shapeColors = {
            circle: '#FF7043',
            triangle: '#42A5F5',
            square: '#66BB6A'
        };

        this.gameCompleteCalled = false;

        // Input handling
        this.handleInput = this.handleInput.bind(this);
    }

    /**
     * Initialize game elements
     */
    initElements() {
        this.fragments = [];
        this.targetFragments = [];
        this.piecesPlaced = 0;
        this.gameCompleteCalled = false;
        this.currentShape = this.shapes[(this.level - 1) % 3];
        this.targetPieceCount = Math.min(2 + (this.level - 1), 10);

        // Create target shape outline
        this.createTargetShape();

        // Create draggable fragments
        this.createFragments();
    }

    /**
     * Create target shape outline
     */
    createTargetShape() {
        const centerX = this.width / 2;
        const centerY = this.height / 2 - 30;
        const size = Math.min(this.width, this.height) * 0.25;

        this.targetFragments = [];

        // Calculate shape points
        if (this.currentShape === 'circle') {
            const radius = size;
            for (let i = 0; i < this.targetPieceCount; i++) {
                const angle1 = (Math.PI * 2 / this.targetPieceCount) * i;
                const angle2 = (Math.PI * 2 / this.targetPieceCount) * (i + 1);
                const midAngle = (angle1 + angle2) / 2;

                this.targetFragments.push({
                    type: 'arc',
                    cx: centerX,
                    cy: centerY,
                    radius: radius,
                    angle1: angle1,
                    angle2: angle2,
                    color: this.shapeColors.circle,
                    placed: false
                });
            }
        } else if (this.currentShape === 'triangle') {
            for (let i = 0; i < this.targetPieceCount; i++) {
                const angle = (Math.PI * 2 / 3) * i - Math.PI / 2;
                const nextAngle = (Math.PI * 2 / 3) * (i + 1) - Math.PI / 2;

                this.targetFragments.push({
                    type: 'polygon',
                    points: [
                        { x: centerX, y: centerY },
                        { x: centerX + Math.cos(angle) * size, y: centerY + Math.sin(angle) * size },
                        { x: centerX + Math.cos(nextAngle) * size, y: centerY + Math.sin(nextAngle) * size }
                    ],
                    color: this.shapeColors.triangle,
                    placed: false
                });
            }
        } else if (this.currentShape === 'square') {
            const halfSize = size * 0.7;
            const quarterSize = halfSize / 2;

            for (let i = 0; i < this.targetPieceCount; i++) {
                const col = i % 2;
                const row = Math.floor(i / 2);
                const w = halfSize;
                const h = halfSize;

                this.targetFragments.push({
                    type: 'rect',
                    x: centerX - halfSize + col * w,
                    y: centerY - halfSize + row * h,
                    width: w,
                    height: h,
                    color: this.shapeColors.square,
                    placed: false
                });
            }
        }
    }

    /**
     * Create draggable fragments
     */
    createFragments() {
        const startY = this.height - 150;

        for (let i = 0; i < this.targetPieceCount; i++) {
            // Shuffle position in bottom area
            const fragment = {
                id: i,
                x: 100 + (i % 4) * 120 + Utils.random(-20, 20),
                y: startY + Math.floor(i / 4) * 100 + Utils.random(-10, 10),
                width: 80,
                height: 60,
                color: this.rainbowColors[i % this.rainbowColors.length],
                rotation: Utils.random(-0.3, 0.3),
                placed: false,
                scale: 1,
                targetIndex: i
            };
            this.fragments.push(fragment);
        }

        // Shuffle fragments for challenge
        this.fragments.sort(() => Math.random() - 0.5);
    }

    /**
     * Update game state
     */
    update(deltaTime) {
        if (this.state !== 'playing') return;

        // Check win condition
        if (this.piecesPlaced >= this.targetPieceCount) {
            this.win();
        }
    }

    /**
     * Handle win condition
     */
    win() {
        if (this.gameCompleteCalled) return;
        this.gameCompleteCalled = true;

        this.addScore(this.targetPieceCount * 10);

        setTimeout(() => {
            this.end();
            if (this.onGameOver) {
                this.onGameOver(this.getResult());
            }
        }, 500);
    }

    /**
     * Calculate stars based on placement accuracy
     */
    calculateStars() {
        // All pieces placed successfully
        if (this.piecesPlaced >= this.targetPieceCount) {
            if (this.level >= 8) {
                this.stars = 3;
            } else if (this.level >= 5) {
                this.stars = 2;
            } else {
                this.stars = 1;
            }
        }
    }

    /**
     * Handle input (touch/mouse)
     */
    handleInput(x, y, action = 'start') {
        if (this.state !== 'playing') return;

        if (action === 'start') {
            // Find clicked fragment
            for (let i = this.fragments.length - 1; i >= 0; i--) {
                const frag = this.fragments[i];
                if (!frag.placed) {
                    const dist = Utils.distance(x, y, frag.x, frag.y);
                    if (dist < 50) {
                        this.draggingFragment = frag;
                        this.dragOffset.x = frag.x - x;
                        this.dragOffset.y = frag.y - y;
                        frag.scale = 1.1;
                        Audio.playSound(Constants.AUDIO.CLICK);
                        break;
                    }
                }
            }
        } else if (action === 'move' && this.draggingFragment) {
            this.draggingFragment.x = x + this.dragOffset.x;
            this.draggingFragment.y = y + this.dragOffset.y;
        } else if (action === 'end' && this.draggingFragment) {
            this.checkSnap();
        }
    }

    /**
     * Check if fragment should snap to target
     */
    checkSnap() {
        const frag = this.draggingFragment;

        // Find nearest target position
        let nearestTarget = null;
        let nearestDist = this.snapDistance;

        this.targetFragments.forEach((target, index) => {
            if (!target.placed) {
                const targetX = this.getTargetPosition(target).x;
                const targetY = this.getTargetPosition(target).y;
                const dist = Utils.distance(frag.x, frag.y, targetX, targetY);

                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestTarget = index;
                }
            }
        });

        if (nearestTarget !== null) {
            // Snap to target
            const target = this.targetFragments[nearestTarget];
            const pos = this.getTargetPosition(target);

            frag.x = pos.x;
            frag.y = pos.y;
            frag.placed = true;
            frag.scale = 1;
            target.placed = true;
            this.piecesPlaced++;

            Audio.playSound(Constants.AUDIO.SUCCESS);
        } else {
            // Return to original scale
            frag.scale = 1;
        }

        this.draggingFragment = null;
    }

    /**
     * Get target position for a fragment
     */
    getTargetPosition(target) {
        if (target.type === 'arc') {
            const midAngle = (target.angle1 + target.angle2) / 2;
            return {
                x: target.cx + Math.cos(midAngle) * target.radius * 0.6,
                y: target.cy + Math.sin(midAngle) * target.radius * 0.6
            };
        } else if (target.type === 'polygon') {
            const cx = target.points.reduce((sum, p) => sum + p.x, 0) / 3;
            const cy = target.points.reduce((sum, p) => sum + p.y, 0) / 3;
            return { x: cx, y: cy };
        } else if (target.type === 'rect') {
            return {
                x: target.x + target.width / 2,
                y: target.y + target.height / 2
            };
        }
        return { x: 0, y: 0 };
    }

    /**
     * Render game
     */
    render() {
        // Draw rainbow valley background
        this.renderer.drawGradient(0, 0, this.width, this.height, '#E8F5E9', '#C8E6C9');

        // Draw rainbow mountains in background
        this.drawMountains();

        // Draw target shape outline (ghost)
        this.drawTargetShape();

        // Draw placed fragments
        this.fragments.forEach(frag => {
            if (frag.placed) {
                this.drawFragment(frag);
            }
        });

        // Draw unplaced fragments
        this.fragments.forEach(frag => {
            if (!frag.placed && frag !== this.draggingFragment) {
                this.drawFragment(frag);
            }
        });

        // Draw dragging fragment on top
        if (this.draggingFragment) {
            this.drawFragment(this.draggingFragment);
        }

        // Draw HUD
        this.renderHUD();
    }

    /**
     * Draw rainbow mountains in background
     */
    drawMountains() {
        const colors = ['#EF5350', '#FFB74D', '#FFEB3B', '#66BB6A', '#4FC3F7'];
        const baseY = this.height;

        colors.forEach((color, i) => {
            const height = 80 + i * 20;
            const offset = i * 50;

            this.renderer.ctx.beginPath();
            this.renderer.ctx.moveTo(-50 + offset, baseY);
            this.renderer.ctx.lineTo(150 + offset, baseY - height);
            this.renderer.ctx.lineTo(350 + offset, baseY);
            this.renderer.ctx.closePath();
            this.renderer.ctx.fillStyle = color + '40';
            this.renderer.ctx.fill();
        });
    }

    /**
     * Draw target shape outline
     */
    drawTargetShape() {
        const centerX = this.width / 2;
        const centerY = this.height / 2 - 30;
        const size = Math.min(this.width, this.height) * 0.25;

        this.targetFragments.forEach((target, index) => {
            if (!target.placed) {
                this.renderer.ctx.globalAlpha = 0.3;
                this.drawFragmentShape(target, index);
                this.renderer.ctx.globalAlpha = 1;
            }
        });
    }

    /**
     * Draw a fragment
     */
    drawFragment(frag) {
        this.renderer.save();
        this.renderer.ctx.translate(frag.x, frag.y);
        this.renderer.ctx.rotate(frag.rotation);
        this.renderer.ctx.scale(frag.scale, frag.scale);

        const target = this.targetFragments[frag.targetIndex];

        // Draw fragment shape
        this.drawFragmentShape(target, frag.id, frag.color);

        this.renderer.restore();
    }

    /**
     * Draw fragment shape
     */
    drawFragmentShape(target, index, color = null) {
        const fragColor = color || target.color;

        if (target.type === 'arc') {
            const midAngle = (target.angle1 + target.angle2) / 2;
            const x = target.cx + Math.cos(midAngle) * target.radius * 0.6;
            const y = target.cy + Math.sin(midAngle) * target.radius * 0.6;

            this.renderer.ctx.beginPath();
            this.renderer.ctx.moveTo(target.cx, target.cy);
            this.renderer.ctx.arc(target.cx, target.cy, target.radius, target.angle1, target.angle2);
            this.renderer.ctx.closePath();
            this.renderer.ctx.fillStyle = fragColor + '80';
            this.renderer.ctx.fill();
            this.renderer.ctx.strokeStyle = fragColor;
            this.renderer.ctx.lineWidth = 3;
            this.renderer.ctx.stroke();

        } else if (target.type === 'polygon') {
            this.renderer.ctx.beginPath();
            this.renderer.ctx.moveTo(target.points[0].x, target.points[0].y);
            target.points.forEach(p => this.renderer.ctx.lineTo(p.x, p.y));
            this.renderer.ctx.closePath();
            this.renderer.ctx.fillStyle = fragColor + '80';
            this.renderer.ctx.fill();
            this.renderer.ctx.strokeStyle = fragColor;
            this.renderer.ctx.lineWidth = 3;
            this.renderer.ctx.stroke();

        } else if (target.type === 'rect') {
            this.renderer.drawRect(target.x, target.y, target.width, target.height, fragColor + '80', 3);
        }
    }

    /**
     * Render HUD
     */
    renderHUD() {
        // Shape name
        const shapeNames = { circle: '圓形', triangle: '三角形', square: '正方形' };
        this.renderer.drawText(shapeNames[this.currentShape], this.width / 2, 30, {
            font: 'bold 22px -apple-system, BlinkMacSystemFont, sans-serif',
            color: '#37474F'
        });

        // Progress
        this.renderer.drawText(`${this.piecesPlaced} / ${this.targetPieceCount}`, this.width / 2, 55, {
            font: '18px -apple-system, BlinkMacSystemFont, sans-serif',
            color: '#546E7A'
        });

        // Instructions
        this.renderer.drawText('拖曳碎片到目標位置', this.width / 2, this.height - 20, {
            font: '14px -apple-system, BlinkMacSystemFont, sans-serif',
            color: '#78909C'
        });
    }

    /**
     * Set up input handlers
     */
    setupInput() {
        const canvas = this.canvas;

        // Mouse events
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.handleInput(e.clientX - rect.left, e.clientY - rect.top, 'start');
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.handleInput(e.clientX - rect.left, e.clientY - rect.top, 'move');
        });

        canvas.addEventListener('mouseup', (e) => {
            this.handleInput(0, 0, 'end');
        });

        // Touch events
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            this.handleInput(touch.clientX - rect.left, touch.clientY - rect.top, 'start');
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            this.handleInput(touch.clientX - rect.left, touch.clientY - rect.top, 'move');
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleInput(0, 0, 'end');
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
            this.canvas.removeEventListener('mousedown', this.handleInput);
            this.canvas.removeEventListener('mousemove', this.handleInput);
            this.canvas.removeEventListener('mouseup', this.handleInput);
            this.canvas.removeEventListener('touchstart', this.handleInput);
            this.canvas.removeEventListener('touchmove', this.handleInput);
            this.canvas.removeEventListener('touchend', this.handleInput);
        }
        super.destroy();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShapeSlicer;
}

// Register globally for browser use
if (typeof window !== 'undefined') {
    window.ShapeSlicer = ShapeSlicer;
    if (window.GameRegistry) {
        GameRegistry.register('shape-slicer', ShapeSlicer);
    }
}