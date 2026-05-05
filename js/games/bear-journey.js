/**
 * Bear's Journey - 小熊找媽媽
 * A maze navigation game where players guide a bear cub to find its mother
 * Collect honey while avoiding obstacles
 */

class BearJourney extends GameBase {
    constructor(gameId = 'bearJourney', options = {}) {
        super(gameId, options);

        // Game elements
        this.bear = null;
        this.honeyPots = [];
        this.obstacles = [];
        this.mazeWalls = [];
        this.particles = [];
        this.exitPos = null;

        // Level settings
        this.levels = [
            { maze: 'simple', honey: 5, obstacles: 3, time: 60, name: '新手' },
            { maze: 'medium', honey: 8, obstacles: 5, time: 75, name: '第一關' },
            { maze: 'hard', honey: 12, obstacles: 8, time: 90, name: '初次挑戰' },
            { maze: 'expert', honey: 15, obstacles: 12, time: 100, name: '熟練工人' }
        ];
        this.currentLevel = 0;

        // Player state
        this.lives = 3;
        this.honeyCollected = 0;
        this.totalHoney = 0;

        // Movement
        this.moveSpeed = 120;
        this.targetX = 0;
        this.targetY = 0;
        this.isMoving = false;

        // Direction
        this.directions = {
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 }
        };
        this.currentDirection = 'right';

        // Bind methods
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    /**
     * Initialize game elements
     */
    initElements() {
        // Clear arrays
        this.honeyPots = [];
        this.obstacles = [];
        this.mazeWalls = [];
        this.particles = [];

        // Initialize bear
        this.bear = {
            x: 60,
            y: 60,
            width: 40,
            height: 40,
            radius: 20,
            targetX: 60,
            targetY: 60,
            animFrame: 0,
            direction: 'right',
            isMoving: false
        };

        // Get level config
        const levelConfig = this.levels[this.currentLevel];
        this.totalHoney = levelConfig.honey;
        this.honeyCollected = 0;

        // Generate maze
        this.generateMaze(levelConfig.maze);

        // Place honey pots
        this.placeHoneyPots(levelConfig.honey);

        // Place obstacles
        this.placeObstacles(levelConfig.obstacles);

        // Set exit position
        this.exitPos = {
            x: this.width - 60,
            y: this.height - 60,
            width: 50,
            height: 50
        };

        // Setup input
        this.setupInputHandlers();

        this.lives = 3;
    }

    /**
     * Generate maze based on type
     */
    generateMaze(type) {
        const cellSize = 50;
        const cols = Math.floor(this.width / cellSize);
        const rows = Math.floor(this.height / cellSize) - 2; // Leave space for HUD

        this.mazeWalls = [];

        switch (type) {
            case 'simple':
                // Create simple horizontal and vertical walls
                for (let i = 0; i < 3; i++) {
                    const horizontal = Math.random() > 0.5;
                    if (horizontal) {
                        const y = 150 + i * 100;
                        const startX = 100 + Math.random() * 100;
                        const length = 150 + Math.random() * 100;
                        this.mazeWalls.push({
                            x: startX,
                            y: y,
                            width: length,
                            height: 15
                        });
                    } else {
                        const x = 100 + i * 150;
                        const startY = 100 + Math.random() * 100;
                        const length = 150 + Math.random() * 100;
                        this.mazeWalls.push({
                            x: x,
                            y: startY,
                            width: 15,
                            height: length
                        });
                    }
                }
                break;

            case 'medium':
                // Create grid-like walls with gaps
                for (let row = 0; row < 4; row++) {
                    for (let col = 0; col < 5; col++) {
                        if (Math.random() > 0.4) {
                            const x = 50 + col * 100;
                            const y = 100 + row * 80;
                            this.mazeWalls.push({
                                x: x,
                                y: y,
                                width: 60 + Math.random() * 40,
                                height: 12
                            });
                        }
                    }
                }
                break;

            case 'hard':
                // Create more complex maze
                for (let i = 0; i < 8; i++) {
                    const x = 80 + (i % 4) * 120;
                    const y = 80 + Math.floor(i / 4) * 150;
                    this.mazeWalls.push({
                        x: x,
                        y: y,
                        width: 80,
                        height: 12
                    });
                    if (i % 2 === 0) {
                        this.mazeWalls.push({
                            x: x + 70,
                            y: y,
                            width: 12,
                            height: 100
                        });
                    }
                }
                break;

            case 'expert':
                // Create expert level maze
                for (let row = 0; row < 5; row++) {
                    for (let col = 0; col < 6; col++) {
                        if (Math.random() > 0.3) {
                            this.mazeWalls.push({
                                x: 40 + col * 90,
                                y: 80 + row * 70,
                                width: 50 + Math.random() * 30,
                                height: 10
                            });
                        }
                    }
                }
                break;
        }
    }

    /**
     * Place honey pots in valid positions
     */
    placeHoneyPots(count) {
        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let placed = false;

            while (!placed && attempts < 50) {
                const x = 80 + Math.random() * (this.width - 160);
                const y = 80 + Math.random() * (this.height - 200);

                if (this.isValidPosition(x, y, 30, 30)) {
                    this.honeyPots.push({
                        x: x,
                        y: y,
                        width: 30,
                        height: 30,
                        collected: false,
                        bobOffset: Math.random() * Math.PI * 2
                    });
                    placed = true;
                }
                attempts++;
            }
        }
    }

    /**
     * Place obstacles
     */
    placeObstacles(count) {
        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let placed = false;

            while (!placed && attempts < 50) {
                const x = 100 + Math.random() * (this.width - 200);
                const y = 100 + Math.random() * (this.height - 250);
                const type = Math.random() > 0.5 ? 'bee' : 'thorn';

                if (this.isValidPosition(x, y, 35, 35)) {
                    this.obstacles.push({
                        x: x,
                        y: y,
                        width: 35,
                        height: 35,
                        type: type,
                        vx: (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 20),
                        vy: (Math.random() - 0.5) * 40,
                        patrolTime: 0
                    });
                    placed = true;
                }
                attempts++;
            }
        }
    }

    /**
     * Check if position is valid (not colliding with walls)
     */
    isValidPosition(x, y, width, height) {
        const halfW = width / 2;
        const halfH = height / 2;

        for (const wall of this.mazeWalls) {
            if (x + halfW > wall.x && x - halfW < wall.x + wall.width &&
                y + halfH > wall.y && y - halfH < wall.y + wall.height) {
                return false;
            }
        }
        return true;
    }

    /**
     * Setup input handlers
     */
    setupInputHandlers() {
        const canvas = this.canvas;

        canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        canvas.addEventListener('mousedown', this.handleMouseDown);
        canvas.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('keydown', this.handleKeyDown);
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

        this.handleDirectionInput(x, y);
    }

    /**
     * Handle touch move
     */
    handleTouchMove(event) {
        event.preventDefault();
        if (this.state !== 'playing') return;

        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        this.handleDirectionInput(x, y);
    }

    /**
     * Handle mouse down
     */
    handleMouseDown(event) {
        if (this.state !== 'playing') return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.handleDirectionInput(x, y);
    }

    /**
     * Handle mouse move
     */
    handleMouseMove(event) {
        if (this.state !== 'playing' || !this.isMoving) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.handleDirectionInput(x, y);
    }

    /**
     * Handle direction input
     */
    handleDirectionInput(x, y) {
        const dx = x - this.bear.x;
        const dy = y - this.bear.y;

        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        let newDir;
        if (absDx > absDy) {
            newDir = dx > 0 ? 'right' : 'left';
        } else {
            newDir = dy > 0 ? 'down' : 'up';
        }

        this.moveInDirection(newDir);
    }

    /**
     * Handle key down
     */
    handleKeyDown(key) {
        if (this.state !== 'playing') return;

        switch (key) {
            case 'ArrowUp':
            case 'w':
                this.moveInDirection('up');
                break;
            case 'ArrowDown':
            case 's':
                this.moveInDirection('down');
                break;
            case 'ArrowLeft':
            case 'a':
                this.moveInDirection('left');
                break;
            case 'ArrowRight':
            case 'd':
                this.moveInDirection('right');
                break;
        }
    }

    /**
     * Move bear in direction
     */
    moveInDirection(dir) {
        const dirVec = this.directions[dir];
        const newX = this.bear.x + dirVec.x * 50;
        const newY = this.bear.y + dirVec.y * 50;

        if (this.isValidPosition(newX, newY, this.bear.width, this.bear.height)) {
            this.bear.targetX = newX;
            this.bear.targetY = newY;
            this.bear.direction = dir;
            this.bear.isMoving = true;
            this.isMoving = true;
        }
    }

    /**
     * Update game state
     */
    update(deltaTime) {
        super.update(deltaTime);

        if (this.state !== 'playing') return;

        // Update bear movement
        this.updateBear(deltaTime);

        // Update obstacles
        this.updateObstacles(deltaTime);

        // Update particles
        this.updateParticles(deltaTime);

        // Check collisions
        this.checkCollisions();

        // Check win condition
        if (this.honeyCollected >= this.totalHoney) {
            this.handleLevelComplete();
        }

        // Check lose condition
        if (this.lives <= 0) {
            this.end();
        }
    }

    /**
     * Update bear position
     */
    updateBear(deltaTime) {
        if (!this.bear.isMoving) return;

        const dx = this.bear.targetX - this.bear.x;
        const dy = this.bear.targetY - this.bear.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 5) {
            this.bear.x = this.bear.targetX;
            this.bear.y = this.bear.targetY;
            this.bear.isMoving = false;
        } else {
            const speed = this.moveSpeed * deltaTime;
            this.bear.x += (dx / dist) * speed;
            this.bear.y += (dy / dist) * speed;
        }

        // Animation
        if (this.bear.isMoving) {
            this.bear.animFrame += deltaTime * 10;
        }
    }

    /**
     * Update obstacles
     */
    updateObstacles(deltaTime) {
        for (const obs of this.obstacles) {
            obs.patrolTime += deltaTime;

            // Move in patrol pattern
            obs.x += obs.vx * deltaTime;
            obs.y += Math.sin(obs.patrolTime * 2) * 30 * deltaTime;

            // Bounce off walls
            if (obs.x < 30 || obs.x > this.width - 30) {
                obs.vx *= -1;
            }
        }
    }

    /**
     * Update particles
     */
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= deltaTime;
            p.alpha = p.life / p.maxLife;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Create particles
     */
    createParticles(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 3 + Math.random() * 4,
                color: color,
                life: 0.5 + Math.random() * 0.5,
                maxLife: 1,
                alpha: 1
            });
        }
    }

    /**
     * Check collisions
     */
    checkCollisions() {
        const bearBounds = {
            x: this.bear.x - this.bear.width / 2,
            y: this.bear.y - this.bear.height / 2,
            width: this.bear.width,
            height: this.bear.height
        };

        // Check honey collection
        for (const honey of this.honeyPots) {
            if (honey.collected) continue;

            if (this.intersects(bearBounds, honey)) {
                honey.collected = true;
                this.honeyCollected++;
                this.addScore(20);
                this.createParticles(honey.x, honey.y, '#FFD700', 12);
            }
        }

        // Check obstacle collision
        for (const obs of this.obstacles) {
            if (this.intersects(bearBounds, obs)) {
                this.handleHit();
                break;
            }
        }
    }

    /**
     * Check if two rectangles intersect
     */
    intersects(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    /**
     * Handle bear getting hit
     */
    handleHit() {
        this.lives--;
        this.createParticles(this.bear.x, this.bear.y, '#EF5350', 20);

        // Reset bear position
        this.bear.x = 60;
        this.bear.y = 60;
        this.bear.targetX = 60;
        this.bear.targetY = 60;

        // Brief invincibility handled by visual feedback
    }

    /**
     * Handle level complete
     */
    handleLevelComplete() {
        this.addScore(100);

        if (this.currentLevel < this.levels.length - 1) {
            this.currentLevel++;
            this.createParticles(this.bear.x, this.bear.y, '#81C784', 30);
            this.initElements();
        } else {
            this.end();
        }
    }

    /**
     * Render game
     */
    render() {
        const ctx = this.renderer.ctx;

        // Draw background
        this.drawBackground(ctx);

        // Draw maze walls
        this.drawMazeWalls(ctx);

        // Draw exit
        this.drawExit(ctx);

        // Draw honey pots
        this.drawHoneyPots(ctx);

        // Draw obstacles
        this.drawObstacles(ctx);

        // Draw bear
        this.drawBear(ctx);

        // Draw particles
        this.drawParticles(ctx);

        // Draw UI
        this.drawUI(ctx);
    }

    /**
     * Draw background
     */
    drawBackground(ctx) {
        // Forest floor
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#8BC34A');
        gradient.addColorStop(1, '#689F38');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);

        // Draw grass patches
        ctx.fillStyle = '#7CB342';
        for (let i = 0; i < 30; i++) {
            const x = (i * 47) % this.width;
            const y = (i * 73) % this.height;
            ctx.beginPath();
            ctx.ellipse(x, y, 20, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw trees
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(15, 30, 12, 30);
        ctx.fillRect(this.width - 30, 20, 12, 35);
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(21, 25, 25, 0, Math.PI * 2);
        ctx.arc(this.width - 21, 15, 30, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw maze walls
     */
    drawMazeWalls(ctx) {
        for (const wall of this.mazeWalls) {
            // Wall shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(wall.x + 3, wall.y + 3, wall.width, wall.height);

            // Wall body
            ctx.fillStyle = '#795548';
            ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

            // Wall highlight
            ctx.fillStyle = '#8D6E63';
            ctx.fillRect(wall.x, wall.y, wall.width, wall.height / 3);
        }
    }

    /**
     * Draw exit
     */
    drawExit(ctx) {
        const exit = this.exitPos;

        // Den entrance
        ctx.fillStyle = '#5D4037';
        ctx.beginPath();
        ctx.arc(exit.x, exit.y + exit.height / 2, exit.width / 2, Math.PI, 0);
        ctx.lineTo(exit.x + exit.width / 2, exit.y + exit.height);
        ctx.lineTo(exit.x - exit.width / 2, exit.y + exit.height);
        ctx.closePath();
        ctx.fill();

        // Den interior
        ctx.fillStyle = '#3E2723';
        ctx.beginPath();
        ctx.arc(exit.x, exit.y + exit.height / 2, exit.width / 2 - 5, Math.PI, 0);
        ctx.lineTo(exit.x + exit.width / 2 - 5, exit.y + exit.height);
        ctx.lineTo(exit.x - exit.width / 2 + 5, exit.y + exit.height);
        ctx.closePath();
        ctx.fill();

        // Draw mom bear silhouette
        ctx.fillStyle = '#4E342E';
        ctx.beginPath();
        ctx.arc(exit.x, exit.y + exit.height / 2 - 5, 15, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw honey pots
     */
    drawHoneyPots(ctx) {
        for (const honey of this.honeyPots) {
            if (honey.collected) continue;

            const bob = Math.sin(Date.now() / 300 + honey.bobOffset) * 3;

            ctx.save();
            ctx.translate(honey.x, honey.y + bob);

            // Pot body
            ctx.fillStyle = '#FF8F00';
            ctx.beginPath();
            ctx.moveTo(-honey.width / 2, -honey.height / 2);
            ctx.lineTo(-honey.width / 2 + 5, honey.height / 2);
            ctx.lineTo(honey.width / 2 - 5, honey.height / 2);
            ctx.lineTo(honey.width / 2, -honey.height / 2);
            ctx.closePath();
            ctx.fill();

            // Pot rim
            ctx.fillStyle = '#E65100';
            ctx.fillRect(-honey.width / 2 - 3, -honey.height / 2 - 5, honey.width + 6, 8);

            // Honey drip
            ctx.fillStyle = '#FFD54F';
            ctx.beginPath();
            ctx.ellipse(0, honey.height / 2 + 5, 4, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    /**
     * Draw obstacles
     */
    drawObstacles(ctx) {
        for (const obs of this.obstacles) {
            ctx.save();
            ctx.translate(obs.x, obs.y);

            if (obs.type === 'bee') {
                // Bee body
                ctx.fillStyle = '#FFD54F';
                ctx.beginPath();
                ctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2);
                ctx.fill();

                // Stripes
                ctx.fillStyle = '#212121';
                ctx.fillRect(-6, -2, 4, 4);
                ctx.fillRect(2, -2, 4, 4);

                // Wings
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.ellipse(-8, -8, 8, 5, -0.5, 0, Math.PI * 2);
                ctx.ellipse(8, -8, 8, 5, 0.5, 0, Math.PI * 2);
                ctx.fill();

                // Eyes
                ctx.fillStyle = '#212121';
                ctx.beginPath();
                ctx.arc(-3, -2, 2, 0, Math.PI * 2);
                ctx.arc(3, -2, 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Thorn bush
                ctx.fillStyle = '#33691E';
                ctx.beginPath();
                ctx.arc(0, 0, 15, 0, Math.PI * 2);
                ctx.fill();

                // Thorns
                ctx.fillStyle = '#1B5E20';
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i;
                    const tx = Math.cos(angle) * 15;
                    const ty = Math.sin(angle) * 15;
                    ctx.beginPath();
                    ctx.moveTo(tx, ty);
                    ctx.lineTo(tx + Math.cos(angle) * 8, ty + Math.sin(angle) * 8);
                    ctx.lineTo(tx + Math.cos(angle + 0.3) * 5, ty + Math.sin(angle + 0.3) * 5);
                    ctx.closePath();
                    ctx.fill();
                }
            }

            ctx.restore();
        }
    }

    /**
     * Draw bear
     */
    drawBear(ctx) {
        ctx.save();
        ctx.translate(this.bear.x, this.bear.y);

        // Direction-based rotation
        let rotation = 0;
        switch (this.bear.direction) {
            case 'up': rotation = -0.2; break;
            case 'down': rotation = 0.2; break;
            case 'left': rotation = 0; ctx.scale(-1, 1); break;
            case 'right': rotation = 0; break;
        }
        ctx.rotate(rotation);

        // Walking animation
        const walkBounce = this.bear.isMoving ? Math.sin(this.bear.animFrame) * 3 : 0;

        // Body
        ctx.fillStyle = '#795548';
        ctx.beginPath();
        ctx.ellipse(0, 5 + walkBounce, 18, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.arc(0, -15 + walkBounce, 15, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.beginPath();
        ctx.arc(-10, -28 + walkBounce, 6, 0, Math.PI * 2);
        ctx.arc(10, -28 + walkBounce, 6, 0, Math.PI * 2);
        ctx.fill();

        // Inner ears
        ctx.fillStyle = '#BCAAA4';
        ctx.beginPath();
        ctx.arc(-10, -28 + walkBounce, 3, 0, Math.PI * 2);
        ctx.arc(10, -28 + walkBounce, 3, 0, Math.PI * 2);
        ctx.fill();

        // Snout
        ctx.fillStyle = '#BCAAA4';
        ctx.beginPath();
        ctx.ellipse(0, -10 + walkBounce, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.fillStyle = '#3E2723';
        ctx.beginPath();
        ctx.ellipse(0, -12 + walkBounce, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#3E2723';
        ctx.beginPath();
        ctx.arc(-5, -18 + walkBounce, 3, 0, Math.PI * 2);
        ctx.arc(5, -18 + walkBounce, 3, 0, Math.PI * 2);
        ctx.fill();

        // Eye shine
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-4, -19 + walkBounce, 1, 0, Math.PI * 2);
        ctx.arc(6, -19 + walkBounce, 1, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.fillStyle = '#6D4C41';
        const legOffset = this.bear.isMoving ? Math.sin(this.bear.animFrame * 2) * 5 : 0;
        ctx.beginPath();
        ctx.ellipse(-10, 22 + legOffset, 6, 8, 0, 0, Math.PI * 2);
        ctx.ellipse(10, 22 - legOffset, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * Draw particles
     */
    drawParticles(ctx) {
        for (const p of this.particles) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * p.alpha, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
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

        // Lives
        ctx.fillStyle = '#EF5350';
        for (let i = 0; i < this.lives; i++) {
            ctx.beginPath();
            ctx.arc(20 + i * 30, 65, 10, 0, Math.PI * 2);
            ctx.fill();
        }

        // Honey collected
        ctx.fillStyle = '#FFD54F';
        ctx.font = '18px Arial';
        ctx.fillText(`蜂蜜: ${this.honeyCollected}/${this.totalHoney}`, 15, 95);

        // Level
        const levelConfig = this.levels[this.currentLevel];
        ctx.textAlign = 'right';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`第${this.currentLevel + 1}關: ${levelConfig.name}`, this.width - 15, 35);

        // Instructions
        ctx.textAlign = 'center';
        ctx.font = '14px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText('滑動/點擊方向控制小熊，收集蜂蜜！', this.width / 2, this.height - 15);
    }

    /**
     * Calculate stars
     */
    calculateStars() {
        this.stars = Utils.calculateStars(this.score, {
            one: 100,
            two: 200,
            three: 400
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
        this.canvas?.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas?.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas?.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas?.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('keydown', this.handleKeyDown);
        super.destroy();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BearJourney;
}