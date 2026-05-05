/**
 * Little Astronaut - 小小太空人
 * A platform jumping game set in space
 * Collect fuel, avoid black holes, meteors, and asteroids
 * Features zero-gravity jumping with touch/swipe controls
 */

class LittleAstronaut extends GameBase {
    constructor(gameId = 'littleAstronaut', options = {}) {
        super(gameId, options);

        // Game elements
        this.astronaut = null;
        this.platforms = [];
        this.fuelCanisters = [];
        this.obstacles = [];
        this.stars = [];
        this.particles = [];
        this.backgroundStars = [];

        // Level settings
        this.levels = [
            { fuel: 5, platforms: 8, obstacles: 3, speed: 1, name: '新手' },
            { fuel: 8, platforms: 10, obstacles: 5, speed: 1.2, name: '第一關' },
            { fuel: 12, platforms: 12, obstacles: 8, speed: 1.5, name: '初次挑戰' },
            { fuel: 15, platforms: 15, obstacles: 12, speed: 2, name: '熟練工人' }
        ];
        this.currentLevel = 0;

        // Physics
        this.gravity = 0.15;
        this.jumpForce = -8;
        this.moveSpeed = 4;
        this.isOnPlatform = false;

        // Player state
        this.fuelCollected = 0;
        this.totalFuel = 0;
        this.fuelCapacity = 100;

        // Input state
        this.targetX = 0;
        this.isDragging = false;
        this.swipeStartX = 0;
        this.swipeStartY = 0;

        // Camera
        this.cameraY = 0;
        this.maxCameraY = 0;

        // Bind methods
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    /**
     * Initialize game elements
     */
    initElements() {
        // Clear arrays
        this.platforms = [];
        this.fuelCanisters = [];
        this.obstacles = [];
        this.particles = [];
        this.backgroundStars = [];

        // Get level config
        const levelConfig = this.levels[this.currentLevel];
        this.totalFuel = levelConfig.fuel;
        this.fuelCollected = 0;

        // Create astronaut
        this.astronaut = {
            x: this.width / 2,
            y: this.height - 100,
            width: 30,
            height: 40,
            vx: 0,
            vy: 0,
            isJumping: false,
            facingRight: true,
            animFrame: 0,
            fuel: 50
        };

        // Generate platforms
        this.generatePlatforms(levelConfig.platforms);

        // Generate fuel canisters
        this.generateFuelCanisters(levelConfig.fuel);

        // Generate obstacles
        this.generateObstacles(levelConfig.obstacles);

        // Generate background stars
        this.generateBackgroundStars();

        // Setup input
        this.setupInputHandlers();

        this.cameraY = 0;
        this.maxCameraY = 0;
    }

    /**
     * Generate platforms
     */
    generatePlatforms(count) {
        const levelConfig = this.levels[this.currentLevel];
        let y = this.height - 50;

        // Starting platform
        this.platforms.push({
            x: this.width / 2,
            y: y,
            width: 120,
            height: 15,
            type: 'normal',
            moving: false
        });

        y -= 80;

        for (let i = 1; i < count; i++) {
            const x = 50 + Math.random() * (this.width - 100);
            const width = 60 + Math.random() * 60;
            const type = Math.random() > 0.8 ? 'moving' : 'normal';

            this.platforms.push({
                x: x,
                y: y,
                width: width,
                height: 15,
                type: type,
                moving: type === 'moving',
                moveSpeed: (Math.random() - 0.5) * 2,
                moveRange: 50
            });

            y -= 70 + Math.random() * 30;
        }

        // Final platform with goal
        this.platforms.push({
            x: this.width / 2,
            y: y - 50,
            width: 150,
            height: 15,
            type: 'goal',
            moving: false
        });
    }

    /**
     * Generate fuel canisters
     */
    generateFuelCanisters(count) {
        for (let i = 0; i < count; i++) {
            // Find a platform to place fuel above
            const platformIndex = 1 + Math.floor(Math.random() * (this.platforms.length - 2));
            const platform = this.platforms[platformIndex];

            this.fuelCanisters.push({
                x: platform.x + (Math.random() - 0.5) * 50,
                y: platform.y - 40,
                width: 25,
                height: 35,
                collected: false,
                bobOffset: Math.random() * Math.PI * 2,
                rotation: 0
            });
        }
    }

    /**
     * Generate obstacles
     */
    generateObstacles(count) {
        for (let i = 0; i < count; i++) {
            const type = Math.random();
            let obstacle;

            if (type < 0.4) {
                // Black hole
                obstacle = {
                    x: 50 + Math.random() * (this.width - 100),
                    y: 100 + Math.random() * 500,
                    width: 60,
                    height: 60,
                    type: 'blackhole',
                    rotation: 0,
                    pullStrength: 0.5
                };
            } else if (type < 0.7) {
                // Meteor
                obstacle = {
                    x: Math.random() > 0.5 ? -30 : this.width + 30,
                    y: 100 + Math.random() * 400,
                    width: 30,
                    height: 30,
                    type: 'meteor',
                    vx: (obstacle.x < 0 ? 1 : -1) * (1 + Math.random() * 2),
                    vy: 0.5 + Math.random(),
                    rotation: 0,
                    rotationSpeed: (Math.random() - 0.5) * 0.2
                };
            } else {
                // Asteroid
                obstacle = {
                    x: 50 + Math.random() * (this.width - 100),
                    y: 100 + Math.random() * 500,
                    width: 25,
                    height: 25,
                    type: 'asteroid',
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: 0.3,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.1
                };
            }

            this.obstacles.push(obstacle);
        }
    }

    /**
     * Generate background stars
     */
    generateBackgroundStars() {
        for (let i = 0; i < 100; i++) {
            this.backgroundStars.push({
                x: Math.random() * this.width,
                y: Math.random() * 3000 - 1500,
                size: Math.random() * 2 + 0.5,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: 1 + Math.random() * 2
            });
        }
    }

    /**
     * Setup input handlers
     */
    setupInputHandlers() {
        const canvas = this.canvas;

        canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
        canvas.addEventListener('mousedown', this.handleMouseDown);
        canvas.addEventListener('mousemove', this.handleMouseMove);
        canvas.addEventListener('mouseup', this.handleMouseUp);
        canvas.addEventListener('mouseleave', this.handleMouseUp);
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
        this.swipeStartX = touch.clientX - rect.left;
        this.swipeStartY = touch.clientY - rect.top;
        this.targetX = this.swipeStartX;
        this.isDragging = true;

        // Jump on tap
        if (this.isOnPlatform) {
            this.jump();
        }
    }

    /**
     * Handle touch move
     */
    handleTouchMove(event) {
        event.preventDefault();
        if (this.state !== 'playing' || !this.isDragging) return;

        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.targetX = touch.clientX - rect.left;
    }

    /**
     * Handle touch end
     */
    handleTouchEnd(event) {
        event.preventDefault();
        this.isDragging = false;
    }

    /**
     * Handle mouse down
     */
    handleMouseDown(event) {
        if (this.state !== 'playing') return;

        const rect = this.canvas.getBoundingClientRect();
        this.swipeStartX = event.clientX - rect.left;
        this.swipeStartY = event.clientY - rect.top;
        this.targetX = this.swipeStartX;
        this.isDragging = true;

        // Jump on click
        if (this.isOnPlatform) {
            this.jump();
        }
    }

    /**
     * Handle mouse move
     */
    handleMouseMove(event) {
        if (this.state !== 'playing' || !this.isDragging) return;

        const rect = this.canvas.getBoundingClientRect();
        this.targetX = event.clientX - rect.left;
    }

    /**
     * Handle mouse up
     */
    handleMouseUp() {
        this.isDragging = false;
    }

    /**
     * Handle key down
     */
    handleKeyDown(key) {
        if (this.state !== 'playing') return;

        switch (key) {
            case 'ArrowLeft':
            case 'a':
                this.targetX = Math.max(30, this.astronaut.x - 50);
                break;
            case 'ArrowRight':
            case 'd':
                this.targetX = Math.min(this.width - 30, this.astronaut.x + 50);
                break;
            case ' ':
            case 'w':
            case 'ArrowUp':
                if (this.isOnPlatform) this.jump();
                break;
        }
    }

    /**
     * Jump
     */
    jump() {
        if (this.astronaut.fuel >= 10) {
            this.astronaut.vy = this.jumpForce;
            this.astronaut.fuel -= 5;
            this.isOnPlatform = false;
            this.createParticles(this.astronaut.x, this.astronaut.y + this.astronaut.height / 2, '#FFFFFF', 8);
        }
    }

    /**
     * Update game state
     */
    update(deltaTime) {
        super.update(deltaTime);

        if (this.state !== 'playing') return;

        const levelConfig = this.levels[this.currentLevel];

        // Update astronaut
        this.updateAstronaut(deltaTime);

        // Update platforms
        this.updatePlatforms(deltaTime, levelConfig);

        // Update fuel canisters
        this.updateFuelCanisters(deltaTime);

        // Update obstacles
        this.updateObstacles(deltaTime);

        // Update particles
        this.updateParticles(deltaTime);

        // Update background stars
        this.updateBackgroundStars(deltaTime);

        // Check collisions
        this.checkCollisions();

        // Check win/lose conditions
        if (this.fuelCollected >= this.totalFuel) {
            this.handleLevelComplete();
        }

        if (this.astronaut.y > this.cameraY + this.height + 100) {
            this.handleFall();
        }
    }

    /**
     * Update astronaut
     */
    updateAstronaut(deltaTime) {
        const astro = this.astronaut;

        // Horizontal movement towards target
        const dx = this.targetX - astro.x;
        astro.vx = dx * 0.1;

        if (Math.abs(dx) > 5) {
            astro.facingRight = dx > 0;
        }

        // Apply gravity
        astro.vy += this.gravity;

        // Apply velocity
        astro.x += astro.vx;
        astro.y += astro.vy;

        // Keep in bounds horizontally
        astro.x = Math.max(20, Math.min(this.width - 20, astro.x));

        // Fuel consumption while jumping
        if (!this.isOnPlatform && astro.vy < 0) {
            astro.fuel = Math.max(0, astro.fuel - deltaTime * 2);
        }

        // Animation
        if (Math.abs(astro.vx) > 0.5 || !this.isOnPlatform) {
            astro.animFrame += deltaTime * 10;
        }

        // Check if on platform
        this.isOnPlatform = false;

        for (const platform of this.platforms) {
            if (this.checkPlatformCollision(astro, platform)) {
                astro.y = platform.y - platform.height / 2 - astro.height / 2;
                astro.vy = 0;
                this.isOnPlatform = true;
                break;
            }
        }

        // Update camera to follow astronaut
        const targetCameraY = astro.y - this.height * 0.6;
        if (targetCameraY < this.maxCameraY) {
            this.maxCameraY = targetCameraY;
        }
        this.cameraY = Math.min(this.cameraY, this.maxCameraY);
    }

    /**
     * Check platform collision
     */
    checkPlatformCollision(astro, platform) {
        const astroBottom = astro.y + astro.height / 2;
        const astroTop = astro.y - astro.height / 2;
        const astroLeft = astro.x - astro.width / 2;
        const astroRight = astro.x + astro.width / 2;

        const platTop = platform.y - platform.height / 2;
        const platBottom = platform.y + platform.height / 2;
        const platLeft = platform.x - platform.width / 2;
        const platRight = platform.x + platform.width / 2;

        return astroBottom >= platTop &&
               astroBottom <= platBottom + 10 &&
               astroRight > platLeft &&
               astroLeft < platRight &&
               astro.vy >= 0;
    }

    /**
     * Update platforms
     */
    updatePlatforms(deltaTime, levelConfig) {
        for (const platform of this.platforms) {
            if (platform.moving) {
                platform.x += platform.moveSpeed * levelConfig.speed;

                if (platform.x < 50 || platform.x > this.width - 50) {
                    platform.moveSpeed *= -1;
                }
            }
        }
    }

    /**
     * Update fuel canisters
     */
    updateFuelCanisters(deltaTime) {
        for (const fuel of this.fuelCanisters) {
            if (fuel.collected) continue;

            fuel.rotation += deltaTime;

            // Bob animation
            fuel.bobY = Math.sin(Date.now() / 300 + fuel.bobOffset) * 3;
        }
    }

    /**
     * Update obstacles
     */
    updateObstacles(deltaTime) {
        const levelConfig = this.levels[this.currentLevel];

        for (const obs of this.obstacles) {
            obs.rotation += obs.rotationSpeed || 0;

            if (obs.type === 'meteor') {
                obs.x += obs.vx * levelConfig.speed;
                obs.y += obs.vy;

                // Wrap around
                if (obs.x < -50) obs.x = this.width + 50;
                if (obs.x > this.width + 50) obs.x = -50;
            } else if (obs.type === 'asteroid') {
                obs.x += obs.vx;
                obs.y += obs.vy;

                // Bounce off walls
                if (obs.x < 20 || obs.x > this.width - 20) {
                    obs.vx *= -1;
                }
            }
            // Black holes don't move
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
     * Update background stars
     */
    updateBackgroundStars(deltaTime) {
        for (const star of this.backgroundStars) {
            star.twinkle += deltaTime * star.twinkleSpeed;
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
                vy: Math.sin(angle) * speed - 1,
                radius: 2 + Math.random() * 3,
                color: color,
                life: 0.3 + Math.random() * 0.4,
                maxLife: 0.7,
                alpha: 1
            });
        }
    }

    /**
     * Check collisions
     */
    checkCollisions() {
        const astro = this.astronaut;

        // Check fuel collection
        for (const fuel of this.fuelCanisters) {
            if (fuel.collected) continue;

            if (this.checkRectCollision(astro, {
                x: fuel.x,
                y: fuel.y,
                width: fuel.width,
                height: fuel.height
            })) {
                fuel.collected = true;
                this.fuelCollected++;
                this.astronaut.fuel = Math.min(this.fuelCapacity, this.astronaut.fuel + 30);
                this.addScore(20);
                this.createParticles(fuel.x, fuel.y, '#4FC3F7', 12);
            }
        }

        // Check obstacle collisions
        for (const obs of this.obstacles) {
            let collision = false;

            if (obs.type === 'blackhole') {
                const dx = astro.x - obs.x;
                const dy = (astro.y - this.cameraY) - obs.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Pull effect
                if (dist < obs.width) {
                    const pull = (obs.width - dist) / obs.width * obs.pullStrength;
                    astro.vx -= (dx / dist) * pull;
                    astro.vy -= (dy / dist) * pull;
                }

                if (dist < obs.width * 0.3) {
                    collision = true;
                }
            } else {
                collision = this.checkRectCollision(astro, obs);
            }

            if (collision) {
                this.handleHit();
                break;
            }
        }
    }

    /**
     * Check rectangle collision
     */
    checkRectCollision(a, b) {
        return a.x - a.width / 2 < b.x + b.width / 2 &&
               a.x + a.width / 2 > b.x - b.width / 2 &&
               a.y - a.height / 2 < b.y + b.height / 2 &&
               a.y + a.height / 2 > b.y - b.height / 2;
    }

    /**
     * Handle astronaut getting hit
     */
    handleHit() {
        this.astronaut.fuel = Math.max(0, this.astronaut.fuel - 20);
        this.createParticles(this.astronaut.x, this.astronaut.y, '#EF5350', 15);

        // Bounce back
        this.astronaut.vy = -5;
        this.astronaut.vx = this.astronaut.facingRight ? -3 : 3;

        if (this.astronaut.fuel <= 0) {
            this.end();
        }
    }

    /**
     * Handle falling off
     */
    handleFall() {
        this.createParticles(this.astronaut.x, this.cameraY + this.height / 2, '#EF5350', 20);
        this.end();
    }

    /**
     * Handle level complete
     */
    handleLevelComplete() {
        this.addScore(100);

        if (this.currentLevel < this.levels.length - 1) {
            this.currentLevel++;
            this.createParticles(this.width / 2, this.height / 2, '#81C784', 30);
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

        // Apply camera transform
        ctx.save();
        ctx.translate(0, -this.cameraY);

        // Draw platforms
        this.drawPlatforms(ctx);

        // Draw fuel canisters
        this.drawFuelCanisters(ctx);

        // Draw obstacles
        this.drawObstacles(ctx);

        // Draw astronaut
        this.drawAstronaut(ctx);

        // Draw particles
        this.drawParticles(ctx);

        ctx.restore();

        // Draw UI
        this.drawUI(ctx);
    }

    /**
     * Draw background
     */
    drawBackground(ctx) {
        // Space gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#0a0a2e');
        gradient.addColorStop(0.5, '#1a1a4e');
        gradient.addColorStop(1, '#2d1b4e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);

        // Draw background stars
        for (const star of this.backgroundStars) {
            const screenY = star.y - this.cameraY * 0.5;
            if (screenY < -50 || screenY > this.height + 50) continue;

            const alpha = (Math.sin(star.twinkle) + 1) * 0.3 + 0.4;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(star.x, screenY, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Nebula effect
        ctx.globalAlpha = 0.1;
        const nebulaGradient = ctx.createRadialGradient(
            this.width * 0.3, this.height * 0.4, 0,
            this.width * 0.3, this.height * 0.4, 200
        );
        nebulaGradient.addColorStop(0, '#9C27B0');
        nebulaGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = nebulaGradient;
        ctx.fillRect(0, 0, this.width, this.height);

        const nebulaGradient2 = ctx.createRadialGradient(
            this.width * 0.7, this.height * 0.6, 0,
            this.width * 0.7, this.height * 0.6, 150
        );
        nebulaGradient2.addColorStop(0, '#00BCD4');
        nebulaGradient2.addColorStop(1, 'transparent');
        ctx.fillStyle = nebulaGradient2;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.globalAlpha = 1;
    }

    /**
     * Draw platforms
     */
    drawPlatforms(ctx) {
        for (const platform of this.platforms) {
            ctx.save();
            ctx.translate(platform.x, platform.y);

            if (platform.type === 'goal') {
                // Goal platform - glowing
                const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, platform.width);
                glowGradient.addColorStop(0, 'rgba(129, 199, 132, 0.5)');
                glowGradient.addColorStop(1, 'rgba(129, 199, 132, 0)');
                ctx.fillStyle = glowGradient;
                ctx.beginPath();
                ctx.arc(0, 0, platform.width, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#4CAF50';
                ctx.fillRect(-platform.width / 2, -platform.height / 2, platform.width, platform.height);

                ctx.fillStyle = '#81C784';
                ctx.fillRect(-platform.width / 2, -platform.height / 2, platform.width, platform.height / 3);

                // Flag
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, -platform.height / 2 - 50, 3, 50);
                ctx.fillStyle = '#F44336';
                ctx.beginPath();
                ctx.moveTo(3, -platform.height / 2 - 50);
                ctx.lineTo(30, -platform.height / 2 - 35);
                ctx.lineTo(3, -platform.height / 2 - 20);
                ctx.closePath();
                ctx.fill();
            } else if (platform.type === 'moving') {
                // Moving platform
                ctx.fillStyle = '#FF9800';
                ctx.fillRect(-platform.width / 2, -platform.height / 2, platform.width, platform.height);
                ctx.fillStyle = '#FFB74D';
                ctx.fillRect(-platform.width / 2, -platform.height / 2, platform.width, platform.height / 3);
            } else {
                // Normal platform
                ctx.fillStyle = '#607D8B';
                ctx.fillRect(-platform.width / 2, -platform.height / 2, platform.width, platform.height);
                ctx.fillStyle = '#78909C';
                ctx.fillRect(-platform.width / 2, -platform.height / 2, platform.width, platform.height / 3);

                // Bolts
                ctx.fillStyle = '#455A64';
                ctx.beginPath();
                ctx.arc(-platform.width / 2 + 8, 0, 4, 0, Math.PI * 2);
                ctx.arc(platform.width / 2 - 8, 0, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    /**
     * Draw fuel canisters
     */
    drawFuelCanisters(ctx) {
        for (const fuel of this.fuelCanisters) {
            if (fuel.collected) continue;

            ctx.save();
            ctx.translate(fuel.x, fuel.y + (fuel.bobY || 0));
            ctx.rotate(Math.sin(fuel.rotation) * 0.1);

            // Glow
            const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
            glowGradient.addColorStop(0, 'rgba(79, 195, 247, 0.4)');
            glowGradient.addColorStop(1, 'rgba(79, 195, 247, 0)');
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.fill();

            // Canister body
            ctx.fillStyle = '#4FC3F7';
            ctx.fillRect(-fuel.width / 2, -fuel.height / 2, fuel.width, fuel.height);

            // Canister top
            ctx.fillStyle = '#29B6F6';
            ctx.fillRect(-fuel.width / 4, -fuel.height / 2 - 5, fuel.width / 2, 8);

            // Fuel symbol
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('F', 0, 5);

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

            switch (obs.type) {
                case 'blackhole':
                    ctx.rotate(obs.rotation);

                    // Event horizon
                    const blackGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, obs.width);
                    blackGradient.addColorStop(0, '#000000');
                    blackGradient.addColorStop(0.5, '#1a1a2e');
                    blackGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    ctx.fillStyle = blackGradient;
                    ctx.beginPath();
                    ctx.arc(0, 0, obs.width, 0, Math.PI * 2);
                    ctx.fill();

                    // Accretion disk
                    ctx.strokeStyle = '#9C27B0';
                    ctx.lineWidth = 3;
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath();
                        ctx.arc(0, 0, obs.width * 0.6 - i * 10, i * 0.3, Math.PI - i * 0.3);
                        ctx.stroke();
                    }
                    break;

                case 'meteor':
                    ctx.rotate(obs.rotation);

                    // Meteor body
                    const meteorGradient = ctx.createRadialGradient(-5, -5, 0, 0, 0, obs.width);
                    meteorGradient.addColorStop(0, '#FFFFFF');
                    meteorGradient.addColorStop(0.3, '#FF8A65');
                    meteorGradient.addColorStop(1, '#BF360C');
                    ctx.fillStyle = meteorGradient;
                    ctx.beginPath();
                    ctx.arc(0, 0, obs.width / 2, 0, Math.PI * 2);
                    ctx.fill();

                    // Craters
                    ctx.fillStyle = '#D84315';
                    ctx.beginPath();
                    ctx.arc(-3, -3, 4, 0, Math.PI * 2);
                    ctx.arc(5, 2, 3, 0, Math.PI * 2);
                    ctx.fill();
                    break;

                case 'asteroid':
                    ctx.rotate(obs.rotation);

                    // Asteroid body
                    ctx.fillStyle = '#757575';
                    ctx.beginPath();
                    ctx.moveTo(obs.width * 0.3, -obs.height * 0.4);
                    ctx.lineTo(obs.width * 0.5, obs.height * 0.2);
                    ctx.lineTo(obs.width * 0.1, obs.height * 0.5);
                    ctx.lineTo(-obs.width * 0.4, obs.height * 0.3);
                    ctx.lineTo(-obs.width * 0.5, -obs.height * 0.2);
                    ctx.lineTo(-obs.width * 0.2, -obs.height * 0.4);
                    ctx.closePath();
                    ctx.fill();

                    // Craters
                    ctx.fillStyle = '#616161';
                    ctx.beginPath();
                    ctx.arc(-3, 0, 4, 0, Math.PI * 2);
                    ctx.fill();
                    break;
            }

            ctx.restore();
        }
    }

    /**
     * Draw astronaut
     */
    drawAstronaut(ctx) {
        const astro = this.astronaut;

        ctx.save();
        ctx.translate(astro.x, astro.y);
        if (!astro.facingRight) ctx.scale(-1, 1);

        // Jetpack flame when jumping
        if (!this.isOnPlatform || astro.vy < 0) {
            ctx.fillStyle = '#FF9800';
            ctx.beginPath();
            ctx.moveTo(-8, astro.height / 2 - 5);
            ctx.lineTo(8, astro.height / 2 - 5);
            ctx.lineTo(0, astro.height / 2 + 10 + Math.random() * 10);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#FFEB3B';
            ctx.beginPath();
            ctx.moveTo(-4, astro.height / 2 - 5);
            ctx.lineTo(4, astro.height / 2 - 5);
            ctx.lineTo(0, astro.height / 2 + 5 + Math.random() * 5);
            ctx.closePath();
            ctx.fill();
        }

        // Suit body
        ctx.fillStyle = '#ECEFF1';
        ctx.beginPath();
        ctx.ellipse(0, 5, 14, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Suit details
        ctx.strokeStyle = '#B0BEC5';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(10, 0);
        ctx.moveTo(-10, 10);
        ctx.lineTo(10, 10);
        ctx.stroke();

        // Helmet
        ctx.fillStyle = '#ECEFF1';
        ctx.beginPath();
        ctx.arc(0, -12, 14, 0, Math.PI * 2);
        ctx.fill();

        // Visor
        const visorGradient = ctx.createLinearGradient(-10, -15, 10, -8);
        visorGradient.addColorStop(0, '#1565C0');
        visorGradient.addColorStop(1, '#0D47A1');
        ctx.fillStyle = visorGradient;
        ctx.beginPath();
        ctx.ellipse(0, -12, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Visor reflection
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(-3, -14, 4, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Helmet rim
        ctx.strokeStyle = '#90A4AE';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -12, 14, 0, Math.PI * 2);
        ctx.stroke();

        // Backpack
        ctx.fillStyle = '#78909C';
        ctx.fillRect(-16, -5, 6, 20);

        // Legs
        const legOffset = this.isOnPlatform ? 0 : Math.sin(astro.animFrame) * 3;
        ctx.fillStyle = '#ECEFF1';
        ctx.beginPath();
        ctx.ellipse(-6, 22 + legOffset, 5, 8, 0, 0, Math.PI * 2);
        ctx.ellipse(6, 22 - legOffset, 5, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Boots
        ctx.fillStyle = '#455A64';
        ctx.beginPath();
        ctx.ellipse(-6, 28 + legOffset, 6, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(6, 28 - legOffset, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Arms
        ctx.fillStyle = '#ECEFF1';
        ctx.beginPath();
        ctx.ellipse(-14, 5, 4, 8, 0.3, 0, Math.PI * 2);
        ctx.ellipse(14, 5, 4, 8, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Gloves
        ctx.fillStyle = '#FF9800';
        ctx.beginPath();
        ctx.arc(-16, 12, 5, 0, Math.PI * 2);
        ctx.arc(16, 12, 5, 0, Math.PI * 2);
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

        // Fuel gauge
        ctx.fillStyle = '#263238';
        ctx.fillRect(15, 50, 120, 20);

        const fuelWidth = (this.astronaut.fuel / this.fuelCapacity) * 116;
        const fuelColor = this.astronaut.fuel > 30 ? '#4FC3F7' : '#F44336';
        ctx.fillStyle = fuelColor;
        ctx.fillRect(17, 52, fuelWidth, 16);

        ctx.strokeStyle = '#455A64';
        ctx.lineWidth = 2;
        ctx.strokeRect(15, 50, 120, 20);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.fillText('燃料', 17, 85);

        // Fuel collected
        ctx.font = '16px Arial';
        ctx.fillStyle = '#FFD54F';
        ctx.fillText(`燃料: ${this.fuelCollected}/${this.totalFuel}`, 15, 105);

        // Level
        const levelConfig = this.levels[this.currentLevel];
        ctx.textAlign = 'right';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`第${this.currentLevel + 1}關: ${levelConfig.name}`, this.width - 15, 35);

        // Instructions
        ctx.textAlign = 'center';
        ctx.font = '14px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText('點擊/空格跳躍，左右滑動移動！', this.width / 2, this.height - 15);
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
        this.canvas?.removeEventListener('touchend', this.handleTouchEnd);
        this.canvas?.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas?.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas?.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas?.removeEventListener('mouseleave', this.handleMouseUp);
        document.removeEventListener('keydown', this.handleKeyDown);
        super.destroy();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LittleAstronaut;
}

// Register globally for browser use
if (typeof window !== 'undefined') {
    window.LittleAstronaut = LittleAstronaut;
    if (window.GameRegistry) {
        GameRegistry.register('astronaut', LittleAstronaut);
    }
}