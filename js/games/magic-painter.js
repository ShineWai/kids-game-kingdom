/**
 * Magic Painter Game - Guided drawing that unlocks into free creation
 * Theme: Rainbow Fairy Tale
 */

class MagicPainter extends GameBase {
    constructor(level = 1) {
        super('magic-painter', level);

        // Level configuration
        this.isFreeDrawMode = level >= 8;
        this.level = level;

        // Guided drawing patterns for levels 1-7
        this.patterns = this.createPatterns();

        // Current pattern
        this.currentPattern = this.isFreeDrawMode ? null : this.patterns[level - 1] || this.patterns[0];

        // Drawing state
        this.lines = [];
        this.currentLine = [];
        this.isDrawing = false;

        // Brush settings
        this.brushSize = 8;
        this.brushColor = '#EF5350';

        // Rainbow colors
        this.rainbowColors = ['#EF5350', '#FFB74D', '#FFEB3B', '#66BB6A', '#4FC3F7', '#7E57C2', '#EC407A'];

        // Progress for guided drawing
        this.progress = 0;
        this.requiredProgress = 0.7; // 70% completion required

        // Input handling
        this.handleInput = this.handleInput.bind(this);

        // Completion state
        this.gameCompleteCalled = false;
    }

    /**
     * Create drawing patterns for guided levels
     */
    createPatterns() {
        return [
            // Level 1: Sun
            {
                name: '太陽',
                strokes: [
                    {
                        type: 'circle',
                        cx: 200,
                        cy: 150,
                        radius: 50,
                        color: '#FFD54F'
                    },
                    {
                        type: 'lines',
                        points: [
                            { x: 200, y: 70 }, { x: 200, y: 40 },
                            { x: 200, y: 230 }, { x: 200, y: 260 },
                            { x: 120, y: 150 }, { x: 90, y: 150 },
                            { x: 280, y: 150 }, { x: 310, y: 150 },
                            { x: 145, y: 95 }, { x: 125, y: 75 },
                            { x: 255, y: 205 }, { x: 275, y: 225 },
                            { x: 145, y: 205 }, { x: 125, y: 225 },
                            { x: 255, y: 95 }, { x: 275, y: 75 }
                        ],
                        color: '#FFD54F'
                    }
                ]
            },
            // Level 2: Flower
            {
                name: '花朵',
                strokes: [
                    {
                        type: 'ellipse',
                        cx: 200,
                        cy: 120,
                        radiusX: 30,
                        radiusY: 25,
                        color: '#EC407A'
                    },
                    {
                        type: 'ellipse',
                        cx: 160,
                        cy: 150,
                        radiusX: 30,
                        radiusY: 25,
                        rotation: -45,
                        color: '#EC407A'
                    },
                    {
                        type: 'ellipse',
                        cx: 240,
                        cy: 150,
                        radiusX: 30,
                        radiusY: 25,
                        rotation: 45,
                        color: '#EC407A'
                    },
                    {
                        type: 'ellipse',
                        cx: 165,
                        cy: 190,
                        radiusX: 25,
                        radiusY: 20,
                        rotation: -20,
                        color: '#EC407A'
                    },
                    {
                        type: 'ellipse',
                        cx: 235,
                        cy: 190,
                        radiusX: 25,
                        radiusY: 20,
                        rotation: 20,
                        color: '#EC407A'
                    },
                    {
                        type: 'circle',
                        cx: 200,
                        cy: 160,
                        radius: 20,
                        color: '#FFEB3B'
                    },
                    {
                        type: 'line',
                        x1: 200,
                        y1: 180,
                        x2: 200,
                        y2: 280,
                        color: '#66BB6A',
                        width: 6
                    }
                ]
            },
            // Level 3: House
            {
                name: '房子',
                strokes: [
                    {
                        type: 'triangle',
                        points: [
                            { x: 200, y: 80 },
                            { x: 100, y: 180 },
                            { x: 300, y: 180 }
                        ],
                        color: '#8D6E63'
                    },
                    {
                        type: 'rect',
                        x: 100,
                        y: 180,
                        width: 200,
                        height: 150,
                        color: '#FFCC80'
                    },
                    {
                        type: 'rect',
                        x: 170,
                        y: 230,
                        width: 60,
                        height: 100,
                        color: '#795548'
                    },
                    {
                        type: 'rect',
                        x: 120,
                        y: 200,
                        width: 40,
                        height: 40,
                        color: '#81D4FA'
                    },
                    {
                        type: 'rect',
                        x: 240,
                        y: 200,
                        width: 40,
                        height: 40,
                        color: '#81D4FA'
                    }
                ]
            },
            // Level 4: Tree
            {
                name: '大樹',
                strokes: [
                    {
                        type: 'rect',
                        x: 170,
                        y: 200,
                        width: 60,
                        height: 130,
                        color: '#795548'
                    },
                    {
                        type: 'circle',
                        cx: 200,
                        cy: 150,
                        radius: 70,
                        color: '#66BB6A'
                    },
                    {
                        type: 'circle',
                        cx: 160,
                        cy: 180,
                        radius: 40,
                        color: '#81C784'
                    },
                    {
                        type: 'circle',
                        cx: 240,
                        cy: 180,
                        radius: 40,
                        color: '#81C784'
                    }
                ]
            },
            // Level 5: Rainbow
            {
                name: '彩虹',
                strokes: [
                    { type: 'arc', cx: 200, cy: 300, radius: 120, startAngle: Math.PI, endAngle: 0, color: '#EF5350', width: 15 },
                    { type: 'arc', cx: 200, cy: 300, radius: 100, startAngle: Math.PI, endAngle: 0, color: '#FFB74D', width: 15 },
                    { type: 'arc', cx: 200, cy: 300, radius: 80, startAngle: Math.PI, endAngle: 0, color: '#FFEB3B', width: 15 },
                    { type: 'arc', cx: 200, cy: 300, radius: 60, startAngle: Math.PI, endAngle: 0, color: '#66BB6A', width: 15 },
                    { type: 'arc', cx: 200, cy: 300, radius: 40, startAngle: Math.PI, endAngle: 0, color: '#4FC3F7', width: 15 }
                ]
            },
            // Level 6: Car
            {
                name: '汽車',
                strokes: [
                    {
                        type: 'rect',
                        x: 80,
                        y: 150,
                        width: 240,
                        height: 80,
                        color: '#42A5F5'
                    },
                    {
                        type: 'rect',
                        x: 130,
                        y: 100,
                        width: 140,
                        height: 60,
                        color: '#42A5F5'
                    },
                    {
                        type: 'circle',
                        cx: 130,
                        cy: 230,
                        radius: 30,
                        color: '#37474F'
                    },
                    {
                        type: 'circle',
                        cx: 270,
                        cy: 230,
                        radius: 30,
                        color: '#37474F'
                    },
                    {
                        type: 'rect',
                        x: 145,
                        y: 110,
                        width: 50,
                        height: 40,
                        color: '#81D4FA'
                    },
                    {
                        type: 'rect',
                        x: 205,
                        y: 110,
                        width: 50,
                        height: 40,
                        color: '#81D4FA'
                    }
                ]
            },
            // Level 7: Bird
            {
                name: '小鳥',
                strokes: [
                    {
                        type: 'ellipse',
                        cx: 200,
                        cy: 150,
                        radiusX: 60,
                        radiusY: 40,
                        color: '#FF8A65'
                    },
                    {
                        type: 'circle',
                        cx: 250,
                        cy: 130,
                        radius: 25,
                        color: '#FF8A65'
                    },
                    {
                        type: 'triangle',
                        points: [
                            { x: 275, y: 130 },
                            { x: 310, y: 125 },
                            { x: 275, y: 135 }
                        ],
                        color: '#FFB74D'
                    },
                    {
                        type: 'circle',
                        cx: 260,
                        cy: 125,
                        radius: 5,
                        color: '#37474F'
                    },
                    {
                        type: 'triangle',
                        points: [
                            { x: 170, y: 140 },
                            { x: 100, y: 100 },
                            { x: 100, y: 180 }
                        ],
                        color: '#FF8A65'
                    },
                    {
                        type: 'triangle',
                        points: [
                            { x: 230, y: 180 },
                            { x: 260, y: 250 },
                            { x: 200, y: 250 }
                        ],
                        color: '#FFB74D'
                    }
                ]
            }
        ];
    }

    /**
     * Initialize game elements
     */
    initElements() {
        this.lines = [];
        this.currentLine = [];
        this.isDrawing = false;
        this.progress = 0;
        this.gameCompleteCalled = false;
        this.brushColor = '#EF5350';
        this.brushSize = 8;

        // Calculate required progress for guided levels
        if (this.currentPattern) {
            let totalLength = 0;
            this.currentPattern.strokes.forEach(stroke => {
                totalLength += this.getStrokeLength(stroke);
            });
            this.requiredProgress = totalLength * 0.7;
        }
    }

    /**
     * Get length of a stroke for progress calculation
     */
    getStrokeLength(stroke) {
        switch (stroke.type) {
            case 'line':
                return Utils.distance(stroke.x1, stroke.y1, stroke.x2, stroke.y2);
            case 'lines':
                let len = 0;
                for (let i = 0; i < stroke.points.length - 1; i += 2) {
                    len += Utils.distance(stroke.points[i].x, stroke.points[i].y,
                                        stroke.points[i + 1].x, stroke.points[i + 1].y);
                }
                return len;
            case 'circle':
                return Math.PI * 2 * stroke.radius;
            case 'arc':
                const angleRange = stroke.endAngle - stroke.startAngle;
                return Math.abs(angleRange) * stroke.radius;
            case 'rect':
                return 2 * (stroke.width + stroke.height);
            default:
                return 100;
        }
    }

    /**
     * Update game state
     */
    update(deltaTime) {
        if (this.state !== 'playing') return;

        // Check completion for guided levels
        if (!this.isFreeDrawMode && this.progress >= this.requiredProgress) {
            this.win();
        }
    }

    /**
     * Handle win condition
     */
    win() {
        if (this.gameCompleteCalled) return;
        this.gameCompleteCalled = true;

        this.addScore(100 + Math.floor((this.progress / this.requiredProgress) * 50));

        setTimeout(() => {
            this.end();
            if (this.onGameOver) {
                this.onGameOver(this.getResult());
            }
        }, 500);
    }

    /**
     * Calculate stars
     */
    calculateStars() {
        if (this.isFreeDrawMode) {
            // Free draw: stars based on total strokes drawn
            const strokeCount = this.lines.reduce((sum, line) => sum + line.length, 0);
            if (strokeCount >= 500) {
                this.stars = 3;
            } else if (strokeCount >= 200) {
                this.stars = 2;
            } else if (strokeCount >= 50) {
                this.stars = 1;
            }
        } else {
            // Guided: stars based on completion percentage
            const percentage = this.progress / this.requiredProgress;
            if (percentage >= 1.2) {
                this.stars = 3;
            } else if (percentage >= 1.0) {
                this.stars = 2;
            } else if (percentage >= 0.7) {
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
            this.isDrawing = true;
            this.currentLine = [{ x, y, color: this.brushColor, size: this.brushSize }];

            if (this.isFreeDrawMode) {
                Audio.playSound(Constants.AUDIO.CLICK);
            }
        } else if (action === 'move' && this.isDrawing) {
            this.currentLine.push({ x, y, color: this.brushColor, size: this.brushSize });

            // Update progress for guided levels
            if (!this.isFreeDrawMode) {
                this.updateProgress(x, y);
            }
        } else if (action === 'end' && this.isDrawing) {
            if (this.currentLine.length > 0) {
                this.lines.push([...this.currentLine]);
            }
            this.currentLine = [];
            this.isDrawing = false;
        }
    }

    /**
     * Update progress based on drawing
     */
    updateProgress(x, y) {
        if (!this.currentPattern) return;

        // Check if current position is near any stroke in the pattern
        this.currentPattern.strokes.forEach(stroke => {
            const isNear = this.isPointNearStroke(x, y, stroke);
            if (isNear) {
                // Add small progress increment
                this.progress += 0.5;
            }
        });
    }

    /**
     * Check if a point is near a stroke
     */
    isPointNearStroke(x, y, stroke, threshold = 30) {
        switch (stroke.type) {
            case 'line':
                return this.distanceToLine(x, y, stroke.x1, stroke.y1, stroke.x2, stroke.y2) < threshold;
            case 'lines':
                for (let i = 0; i < stroke.points.length - 1; i += 2) {
                    if (this.distanceToLine(x, y, stroke.points[i].x, stroke.points[i].y,
                                          stroke.points[i + 1].x, stroke.points[i + 1].y) < threshold) {
                        return true;
                    }
                }
                return false;
            case 'circle':
            case 'arc':
                const dist = Utils.distance(x, y, stroke.cx, stroke.cy);
                return Math.abs(dist - stroke.radius) < threshold;
            case 'rect':
                return x >= stroke.x - threshold && x <= stroke.x + stroke.width + threshold &&
                       y >= stroke.y - threshold && y <= stroke.y + stroke.height + threshold;
            case 'ellipse':
                return Utils.distance(x, y, stroke.cx, stroke.cy) < stroke.radiusX + threshold;
            case 'triangle':
                // Simple bounding check
                const minX = Math.min(...stroke.points.map(p => p.x));
                const maxX = Math.max(...stroke.points.map(p => p.x));
                const minY = Math.min(...stroke.points.map(p => p.y));
                const maxY = Math.max(...stroke.points.map(p => p.y));
                return x >= minX - threshold && x <= maxX + threshold &&
                       y >= minY - threshold && y <= maxY + threshold;
            default:
                return false;
        }
    }

    /**
     * Distance from point to line segment
     */
    distanceToLine(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        return Utils.distance(px, py, xx, yy);
    }

    /**
     * Render game
     */
    render() {
        // Draw fairy tale background
        this.renderer.drawGradient(0, 0, this.width, this.height, '#FCE4EC', '#F3E5F5');

        // Draw decorative elements
        this.drawBackgroundDecor();

        // Draw guide pattern for guided levels
        if (!this.isFreeDrawMode && this.currentPattern) {
            this.drawGuidePattern();
        }

        // Draw completed lines
        this.lines.forEach(line => {
            this.drawLine(line);
        });

        // Draw current line
        if (this.currentLine.length > 0) {
            this.drawLine(this.currentLine);
        }

        // Draw color palette
        this.drawPalette();

        // Draw brush size
        this.drawBrushSize();

        // Draw HUD
        this.renderHUD();
    }

    /**
     * Draw background decorations
     */
    drawBackgroundDecor() {
        const ctx = this.renderer.ctx;

        // Draw clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.drawCloud(50, 60, 40);
        this.drawCloud(300, 40, 50);
        this.drawCloud(150, 80, 35);

        // Draw grass at bottom
        ctx.fillStyle = '#C8E6C9';
        ctx.fillRect(0, this.height - 40, this.width, 40);
    }

    /**
     * Draw a cloud
     */
    drawCloud(x, y, size) {
        const ctx = this.renderer.ctx;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.8, y, size * 0.35, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y + size * 0.2, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw guide pattern (faded)
     */
    drawGuidePattern() {
        if (!this.currentPattern) return;

        const ctx = this.renderer.ctx;
        ctx.globalAlpha = 0.3;

        this.currentPattern.strokes.forEach(stroke => {
            this.drawStroke(stroke);
        });

        ctx.globalAlpha = 1;
    }

    /**
     * Draw a stroke
     */
    drawStroke(stroke) {
        const ctx = this.renderer.ctx;
        ctx.strokeStyle = stroke.color || '#333';
        ctx.lineWidth = stroke.width || 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        switch (stroke.type) {
            case 'line':
                ctx.beginPath();
                ctx.moveTo(stroke.x1, stroke.y1);
                ctx.lineTo(stroke.x2, stroke.y2);
                ctx.stroke();
                break;

            case 'lines':
                for (let i = 0; i < stroke.points.length - 1; i += 2) {
                    ctx.beginPath();
                    ctx.moveTo(stroke.points[i].x, stroke.points[i].y);
                    ctx.lineTo(stroke.points[i + 1].x, stroke.points[i + 1].y);
                    ctx.stroke();
                }
                break;

            case 'circle':
                ctx.beginPath();
                ctx.arc(stroke.cx, stroke.cy, stroke.radius, 0, Math.PI * 2);
                ctx.fillStyle = stroke.color + '40';
                ctx.fill();
                ctx.stroke();
                break;

            case 'arc':
                ctx.beginPath();
                ctx.arc(stroke.cx, stroke.cy, stroke.radius, stroke.startAngle, stroke.endAngle);
                ctx.stroke();
                break;

            case 'rect':
                ctx.fillStyle = stroke.color + '40';
                ctx.fillRect(stroke.x, stroke.y, stroke.width, stroke.height);
                ctx.strokeRect(stroke.x, stroke.y, stroke.width, stroke.height);
                break;

            case 'ellipse':
                ctx.save();
                ctx.translate(stroke.cx, stroke.cy);
                if (stroke.rotation) {
                    ctx.rotate(stroke.rotation * Math.PI / 180);
                }
                ctx.beginPath();
                ctx.ellipse(0, 0, stroke.radiusX, stroke.radiusY, 0, 0, Math.PI * 2);
                ctx.fillStyle = stroke.color + '40';
                ctx.fill();
                ctx.stroke();
                ctx.restore();
                break;

            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
                stroke.points.forEach(p => ctx.lineTo(p.x, p.y));
                ctx.closePath();
                ctx.fillStyle = stroke.color + '40';
                ctx.fill();
                ctx.stroke();
                break;
        }
    }

    /**
     * Draw a line (array of points)
     */
    drawLine(line) {
        if (line.length < 2) return;

        const ctx = this.renderer.ctx;

        for (let i = 1; i < line.length; i++) {
            const p1 = line[i - 1];
            const p2 = line[i];

            ctx.strokeStyle = p2.color;
            ctx.lineWidth = p2.size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }
    }

    /**
     * Draw color palette
     */
    drawPalette() {
        const startX = 20;
        const startY = this.height - 120;
        const colorSize = 30;
        const spacing = 5;

        this.rainbowColors.forEach((color, index) => {
            const x = startX + index * (colorSize + spacing);

            // Draw color circle
            this.renderer.ctx.fillStyle = color;
            this.renderer.ctx.beginPath();
            this.renderer.ctx.arc(x + colorSize / 2, startY + colorSize / 2, colorSize / 2, 0, Math.PI * 2);
            this.renderer.ctx.fill();

            // Highlight selected color
            if (color === this.brushColor) {
                this.renderer.ctx.strokeStyle = '#37474F';
                this.renderer.ctx.lineWidth = 3;
                this.renderer.ctx.stroke();
            }
        });

        // Clear button
        const clearX = startX + this.rainbowColors.length * (colorSize + spacing) + 10;
        this.renderer.drawRect(clearX, startY, 60, colorSize, '#90A4AE', 2);
        this.renderer.drawText('清除', clearX + 30, startY + 20, {
            font: '14px -apple-system, BlinkMacSystemFont, sans-serif',
            color: '#37474F',
            textAlign: 'center'
        });
    }

    /**
     * Draw brush size indicator
     */
    drawBrushSize() {
        const x = 20;
        const y = this.height - 160;

        this.renderer.drawText('筆刷大小:', x, y, {
            font: '12px -apple-system, BlinkMacSystemFont, sans-serif',
            color: '#546E7A'
        });

        // Draw size preview
        this.renderer.ctx.fillStyle = this.brushColor;
        this.renderer.ctx.beginPath();
        this.renderer.ctx.arc(x + 70, y - 3, this.brushSize / 2, 0, Math.PI * 2);
        this.renderer.ctx.fill();
    }

    /**
     * Render HUD
     */
    renderHUD() {
        if (this.isFreeDrawMode) {
            // Free draw mode title
            this.renderer.drawText('自由創作', this.width / 2, 30, {
                font: 'bold 22px -apple-system, BlinkMacSystemFont, sans-serif',
                color: '#7E57C2'
            });

            // Stroke count
            const strokeCount = this.lines.reduce((sum, line) => sum + line.length, 0);
            this.renderer.drawText(`線條: ${strokeCount}`, this.width / 2, 55, {
                font: '16px -apple-system, BlinkMacSystemFont, sans-serif',
                color: '#546E7A'
            });
        } else {
            // Guided mode title
            this.renderer.drawText(`畫一畫: ${this.currentPattern?.name || ''}`, this.width / 2, 30, {
                font: 'bold 22px -apple-system, BlinkMacSystemFont, sans-serif',
                color: '#EC407A'
            });

            // Progress bar
            const barWidth = 200;
            const barHeight = 15;
            const barX = (this.width - barWidth) / 2;
            const barY = this.height - 80;

            const progress = Math.min(this.progress / this.requiredProgress, 1);

            this.renderer.drawRect(barX, barY, barWidth, barHeight, '#E0E0E0', 5);
            this.renderer.drawRect(barX, barY, barWidth * progress, barHeight, '#66BB6A', 5);

            this.renderer.drawText(`${Math.floor(progress * 100)}%`, this.width / 2, barY + 35, {
                font: '14px -apple-system, BlinkMacSystemFont, sans-serif',
                color: '#546E7A'
            });
        }
    }

    /**
     * Handle click for palette selection
     */
    handleClick(x, y) {
        if (this.state !== 'playing') return;

        // Check palette clicks
        const startX = 20;
        const startY = this.height - 120;
        const colorSize = 30;
        const spacing = 5;

        // Check color selection
        this.rainbowColors.forEach((color, index) => {
            const cx = startX + index * (colorSize + spacing) + colorSize / 2;
            const cy = startY + colorSize / 2;

            if (Utils.distance(x, y, cx, cy) < colorSize / 2) {
                this.brushColor = color;
                Audio.playSound(Constants.AUDIO.CLICK);
            }
        });

        // Check clear button
        const clearX = startX + this.rainbowColors.length * (colorSize + spacing) + 10;
        if (x >= clearX && x <= clearX + 60 && y >= startY && y <= startY + colorSize) {
            this.lines = [];
            Audio.playSound(Constants.AUDIO.CLICK);
        }

        // Check brush size adjustment
        if (x >= 50 && x <= 90 && y >= this.height - 175 && y <= this.height - 140) {
            this.brushSize = Math.max(2, Math.min(20, this.brushSize - 2));
        }
        if (x >= 90 && x <= 130 && y >= this.height - 175 && y <= this.height - 140) {
            this.brushSize = Math.max(2, Math.min(20, this.brushSize + 2));
        }
    }

    /**
     * Set up input handlers
     */
    setupInput() {
        const canvas = this.canvas;

        // Mouse events
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Check for UI clicks first
            if (y > this.height - 130) {
                this.handleClick(x, y);
            } else {
                this.handleInput(x, y, 'start');
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.handleInput(e.clientX - rect.left, e.clientY - rect.top, 'move');
        });

        canvas.addEventListener('mouseup', () => {
            this.handleInput(0, 0, 'end');
        });

        // Touch events
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            if (y > this.height - 130) {
                this.handleClick(x, y);
            } else {
                this.handleInput(x, y, 'start');
            }
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
    module.exports = MagicPainter;
}