/**
 * Star Catcher Game - 星星小精靈
 * A game where players control a fairy to catch falling stars while avoiding obstacles
 */

class StarCatcher extends GameBase {
    constructor(gameId = 'starCatcher', options = {}) {
        super(gameId, options);

        // Game elements
        this.fairy = null;
        this.stars = [];
        this.clouds = [];
        this.meteors = [];
        this.meteorShower = [];
        this.asteroids = [];
        this.shields = [];
        this.particles = [];

        // Level settings
        this.currentLevel = 1;
        this.maxLevel = 10;
        this.levelConfig = this.getLevelConfig();
        this.starsCollected = 0;
        this.totalStarsToCollect = 0;
        this.levelStars = 0;

        // Player state
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.isBlinking = false;

        // Input state
        this.targetX = 0;
        this.isDragging = false;
        this.tiltEnabled = false;
        this.tiltX = 0;

        // Visual effects
        this.backgroundOffset = 0;
        this.starTwinkle = 0;

        // Bind methods
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleOrientation = this.handleOrientation.bind(this);
    }

    /**
     * Get level configuration
     */
    getLevelConfig() {
        return [
            { stars: 8, clouds: 0, meteorCount: 0, asteroidCount: 0, shieldCount: 0, speed: 0.5, meteorShower: false, name: '新手' },
            { stars: 10, clouds: 1, meteorCount: 0, asteroidCount: 0, shieldCount: 0, speed: 0.5, meteorShower: false, name: '第一關' },
            { stars: 12, clouds: 2, meteorCount: 0, asteroidCount: 0, shieldCount: 0, speed: 0.8, meteorShower: false, name: '初次挑戰' },
            { stars: 15, clouds: 2, meteorCount: 1, asteroidCount: 0, shieldCount: 0, speed: 0.8, meteorShower: false, name: '流星來襲' },
            { stars: 15, clouds: 3, meteorCount: 2, asteroidCount: 0, shieldCount: 0, speed: 1.0, meteorShower: false, name: '流星雨' },
            { stars: 18, clouds: 3, meteorCount: 2, asteroidCount: 1, shieldCount: 0, speed: 1.0, meteorShower: false, name: '隕石危機' },
            { stars: 20, clouds: 4, meteorCount: 3, asteroidCount: 1, shieldCount: 0, speed: 1.2, meteorShower: false, name: '全面來襲' },
            { stars: 20, clouds: 4, meteorCount: 3, asteroidCount: 2, shieldCount: 0, speed: 1.5, meteorShower: true, name: '流星暴雨' },
            { stars: 25, clouds: 5, meteorCount: 4, asteroidCount: 2, shieldCount: 1, speed: 1.5, meteorShower: true, name: '守護天使' },
            { stars: 30, clouds: 5, meteorCount: 5, asteroidCount: 3, shieldCount: 1, speed: 2.0, meteorShower: true, name: '終極挑戰' }
        ];
    }

    /**
     * Initialize game elements
     */
    initElements() {
        // Initialize fairy (player)
        this.fairy = {
            x: this.width / 2,
            y: this.height - 80,
            width: 50,
            height: 60,
            radius: 25,
            speed: 5,
            wingAngle: 0,
            wingDirection: 1
        };

        // Set initial target position
        this.targetX = this.fairy.x;

        // Reset game state
        this.stars = [];
        this.clouds = [];
        this.meteors = [];
        this.meteorShower = [];
        this.asteroids = [];
        this.shields = [];
        this.particles = [];
        this.starsCollected = 0;

        // Load level configuration
        const config = this.levelConfig[this.currentLevel - 1];
        this.totalStarsToCollect = config.stars;
        this.levelStars = config.stars;

        // Spawn initial elements
        this.spawnClouds(config.clouds);
        this.spawnShields(config.shieldCount);

        // Setup input handlers
        this.setupInputHandlers();

        // Enable tilt on mobile
        if (Utils.isMobile() && window.DeviceOrientationEvent) {
            this.enableTilt();
        }
    }

    /**
     * Setup input handlers
     */
    setupInputHandlers() {
        const canvas = this.canvas;

        // Touch events
        canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });

        // Mouse events
        canvas.addEventListener('mousedown', this.handleMouseDown);
        canvas.addEventListener('mousemove', this.handleMouseMove);
        canvas.addEventListener('mouseup', this.handleMouseUp);
        canvas.addEventListener('mouseleave', this.handleMouseUp);

        // Keyboard
        document.addEventListener('keydown', this.handleKeyDown);
    }

    /**
     * Enable tilt control
     */
    enableTilt() {
        window.addEventListener('deviceorientation', this.handleOrientation);
        this.tiltEnabled = true;
    }

    /**
     * Handle orientation change for tilt control
     */
    handleOrientation(event) {
        if (this.state !== 'playing' || !this.tiltEnabled) return;

        const gamma = event.gamma || 0; // Left/right tilt
        this.tiltX = Utils.clamp(gamma / 30, -1, 1);
    }

    /**
     * Handle touch start
     */
    handleTouchStart(event) {
        event.preventDefault();
        if (this.state !== 'playing') return;

        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.targetX = touch.clientX - rect.left;
        this.isDragging = true;
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
        this.targetX = event.clientX - rect.left;
        this.isDragging = true;
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

        switch(key) {
            case 'ArrowLeft':
            case 'a':
                this.targetX = Math.max(30, this.fairy.x - 30);
                break;
            case 'ArrowRight':
            case 'd':
                this.targetX = Math.min(this.width - 30, this.fairy.x + 30);
                break;
        }
    }

    /**
     * Update game state
     */
    update(deltaTime) {
        super.update(deltaTime);

        if (this.state !== 'playing') return;

        const config = this.levelConfig[this.currentLevel - 1];

        // Update fairy position based on input
        this.updateFairy(deltaTime);

        // Update invincibility
        this.updateInvincibility(deltaTime);

        // Spawn elements
        this.updateSpawning(deltaTime, config);

        // Update game elements
        this.updateStars(deltaTime, config);
        this.updateClouds(deltaTime, config);
        this.updateMeteors(deltaTime, config);
        this.updateMeteorShower(deltaTime, config);
        this.updateAsteroids(deltaTime, config);
        this.updateShields(deltaTime, config);
        this.updateParticles(deltaTime);

        // Check collisions
        this.checkCollisions();

        // Update visual effects
        this.backgroundOffset += deltaTime * 20;
        this.starTwinkle += deltaTime * 3;

        // Check level completion
        if (this.starsCollected >= this.totalStarsToCollect) {
            this.completeLevel();
        }

        // Update HUD
        this.updateHUD();
    }

    /**
     * Update fairy position
     */
    updateFairy(deltaTime) {
        // Use tilt if enabled and not dragging
        if (this.tiltEnabled && !this.isDragging) {
            this.targetX = this.fairy.x + this.tiltX * this.fairy.speed * 10;
        }

        // Smooth movement towards target
        const dx = this.targetX - this.fairy.x;
        this.fairy.x += dx * 0.15;

        // Keep fairy in bounds
        this.fairy.x = Utils.clamp(this.fairy.x, 30, this.width - 30);

        // Animate wings
        this.fairy.wingAngle += this.fairy.wingDirection * deltaTime * 15;
        if (this.fairy.wingAngle > 0.5 || this.fairy.wingAngle < -0.5) {
            this.fairy.wingDirection *= -1;
        }

        // Blinking effect when invincible (after being hit)
        if (this.isBlinking) {
            this.fairy.opacity = Math.sin(Date.now() / 50) > 0 ? 1 : 0.3;
        } else {
            this.fairy.opacity = 1;
        }
    }

    /**
     * Update invincibility timer
     */
    updateInvincibility(deltaTime) {
        if (this.isInvincible) {
            this.invincibleTimer -= deltaTime * 1000;
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
                this.isBlinking = false;
                this.fairy.opacity = 1;
            }
        }
    }

    /**
     * Update spawning logic
     */
    updateSpawning(deltaTime, config) {
        // Spawn stars if needed
        const activeStars = this.stars.filter(s => !s.collected).length;
        const maxStars = Math.min(3, this.totalStarsToCollect - this.starsCollected);
        if (activeStars < maxStars && Math.random() < 0.03 * config.speed) {
            this.spawnStar();
        }

        // Spawn clouds if needed
        const activeClouds = this.clouds.length;
        if (activeClouds < config.clouds && Math.random() < 0.01) {
            this.spawnCloud();
        }

        // Spawn meteors
        if (this.meteors.length < config.meteorCount && Math.random() < 0.005 * config.speed) {
            this.spawnMeteor();
        }

        // Spawn meteor shower
        if (config.meteorShower && Math.random() < 0.01 * config.speed) {
            this.spawnMeteorShower();
        }

        // Spawn asteroids
        if (this.asteroids.length < config.asteroidCount && Math.random() < 0.008 * config.speed) {
            this.spawnAsteroid();
        }

        // Spawn shields
        if (this.shields.length < config.shieldCount && Math.random() < 0.002) {
            this.spawnShield();
        }
    }

    /**
     * Spawn a star
     */
    spawnStar() {
        this.stars.push({
            x: Utils.random(30, this.width - 30),
            y: -20,
            radius: 15,
            speed: (1 + Math.random() * 0.5) * this.levelConfig[this.currentLevel - 1].speed,
            rotation: 0,
            collected: false,
            twinkle: Math.random() * Math.PI * 2,
            type: 'normal',
            points: 1
        });
    }

    /**
     * Spawn a cloud
     */
    spawnCloud() {
        this.clouds.push({
            x: Utils.random(0, this.width),
            y: Utils.random(50, this.height - 200),
            width: Utils.random(80, 150),
            height: Utils.random(40, 70),
            speed: 0.2 + Math.random() * 0.3,
            opacity: 0.6 + Math.random() * 0.3
        });
    }

    /**
     * Spawn a meteor (fast moving, bonus points)
     */
    spawnMeteor() {
        this.meteors.push({
            x: Utils.random(50, this.width - 50),
            y: -30,
            radius: 12,
            speed: 4 + Math.random() * 2,
            rotation: 0,
            trail: []
        });
    }

    /**
     * Spawn meteor shower (multiple meteors)
     */
    spawnMeteorShower() {
        const count = Utils.random(3, 6);
        for (let i = 0; i < count; i++) {
            this.meteorShower.push({
                x: Utils.random(50, this.width - 50),
                y: -30 - i * 40,
                radius: 10,
                speed: 5 + Math.random() * 3,
                rotation: 0,
                trail: []
            });
        }
    }

    /**
     * Spawn an asteroid (hazard)
     */
    spawnAsteroid() {
        this.asteroids.push({
            x: Utils.random(50, this.width - 50),
            y: -30,
            radius: 20,
            speed: 1.5 + Math.random() * 1,
            rotation: 0,
            rotationSpeed: Utils.randomFloat(-2, 2)
        });
    }

    /**
     * Spawn a shield power-up
     */
    spawnShield() {
        this.shields.push({
            x: Utils.random(50, this.width - 50),
            y: -20,
            radius: 18,
            speed: 1,
            pulse: 0
        });
    }

    /**
     * Spawn a shield
     */
    spawnShields(count) {
        for (let i = 0; i < count; i++) {
            this.shields.push({
                x: Utils.random(50, this.width - 50),
                y: Utils.random(-200, -100),
                radius: 18,
                speed: 1,
                pulse: 0
            });
        }
    }

    /**
     * Update stars
     */
    updateStars(deltaTime, config) {
        for (let i = this.stars.length - 1; i >= 0; i--) {
            const star = this.stars[i];
            star.y += star.speed * config.speed;
            star.rotation += deltaTime * 2;
            star.twinkle += deltaTime * 4;

            // Remove if off screen or collected
            if (star.y > this.height + 20 || star.collected) {
                this.stars.splice(i, 1);
            }
        }
    }

    /**
     * Update clouds
     */
    updateClouds(deltaTime, config) {
        for (let i = this.clouds.length - 1; i >= 0; i--) {
            const cloud = this.clouds[i];
            cloud.x += cloud.speed;
            cloud.y += Math.sin(this.backgroundOffset / 100 + i) * 0.1;

            // Wrap around screen
            if (cloud.x > this.width + cloud.width) {
                cloud.x = -cloud.width;
            }

            // Remove if off screen and enough clouds exist
            if (cloud.y > this.height + 50 && this.clouds.length > config.clouds) {
                this.clouds.splice(i, 1);
            }
        }
    }

    /**
     * Update meteors
     */
    updateMeteors(deltaTime, config) {
        for (let i = this.meteors.length - 1; i >= 0; i--) {
            const meteor = this.meteors[i];
            meteor.y += meteor.speed * config.speed;
            meteor.rotation += deltaTime * 5;

            // Add trail
            meteor.trail.push({ x: meteor.x, y: meteor.y, alpha: 1 });
            if (meteor.trail.length > 10) meteor.trail.shift();
            meteor.trail.forEach(t => t.alpha -= 0.1);

            // Remove if off screen
            if (meteor.y > this.height + 30) {
                this.meteors.splice(i, 1);
            }
        }
    }

    /**
     * Update meteor shower
     */
    updateMeteorShower(deltaTime, config) {
        for (let i = this.meteorShower.length - 1; i >= 0; i--) {
            const meteor = this.meteorShower[i];
            meteor.y += meteor.speed * config.speed;
            meteor.x += (meteor.x > this.width / 2 ? 1 : -1) * meteor.speed * 0.5;
            meteor.rotation += deltaTime * 5;

            // Add trail
            meteor.trail.push({ x: meteor.x, y: meteor.y, alpha: 1 });
            if (meteor.trail.length > 8) meteor.trail.shift();
            meteor.trail.forEach(t => t.alpha -= 0.12);

            // Remove if off screen
            if (meteor.y > this.height + 30) {
                this.meteorShower.splice(i, 1);
            }
        }
    }

    /**
     * Update asteroids
     */
    updateAsteroids(deltaTime, config) {
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            asteroid.y += asteroid.speed * config.speed;
            asteroid.rotation += asteroid.rotationSpeed;

            // Remove if off screen
            if (asteroid.y > this.height + 40) {
                this.asteroids.splice(i, 1);
            }
        }
    }

    /**
     * Update shields
     */
    updateShields(deltaTime, config) {
        for (let i = this.shields.length - 1; i >= 0; i--) {
            const shield = this.shields[i];
            shield.y += shield.speed;
            shield.pulse += deltaTime * 4;

            // Remove if off screen
            if (shield.y > this.height + 30) {
                this.shields.splice(i, 1);
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
     * Create particle effect
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
        const fairyBounds = {
            x: this.fairy.x - this.fairy.radius,
            y: this.fairy.y - this.fairy.radius,
            width: this.fairy.radius * 2,
            height: this.fairy.radius * 2,
            radius: this.fairy.radius
        };

        // Check star collisions
        for (const star of this.stars) {
            if (star.collected) continue;

            const dx = this.fairy.x - star.x;
            const dy = this.fairy.y - star.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.fairy.radius + star.radius) {
                star.collected = true;
                this.starsCollected++;
                this.addScore(star.points);
                this.createParticles(star.x, star.y, '#FFD700', 12);
                this.onStarEarned?.();
            }
        }

        // Check meteor collisions (bonus points)
        for (let i = this.meteors.length - 1; i >= 0; i--) {
            const meteor = this.meteors[i];
            const dx = this.fairy.x - meteor.x;
            const dy = this.fairy.y - meteor.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.fairy.radius + meteor.radius) {
                this.meteors.splice(i, 1);
                this.addScore(3);
                this.createParticles(meteor.x, meteor.y, '#FF6B35', 15);
            }
        }

        // Check meteor shower collisions
        for (let i = this.meteorShower.length - 1; i >= 0; i--) {
            const meteor = this.meteorShower[i];
            const dx = this.fairy.x - meteor.x;
            const dy = this.fairy.y - meteor.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.fairy.radius + meteor.radius) {
                this.meteorShower.splice(i, 1);
                this.addScore(3);
                this.createParticles(meteor.x, meteor.y, '#FF6B35', 15);
            }
        }

        // Check asteroid collisions (damage)
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            const dx = this.fairy.x - asteroid.x;
            const dy = this.fairy.y - asteroid.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.fairy.radius + asteroid.radius && !this.isInvincible) {
                this.asteroids.splice(i, 1);
                this.handleAsteroidHit();
            }
        }

        // Check shield collisions
        for (let i = this.shields.length - 1; i >= 0; i--) {
            const shield = this.shields[i];
            const dx = this.fairy.x - shield.x;
            const dy = this.fairy.y - shield.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.fairy.radius + shield.radius) {
                this.shields.splice(i, 1);
                this.activateShield();
            }
        }
    }

    /**
     * Handle asteroid hit
     */
    handleAsteroidHit() {
        this.addScore(-5);
        this.isInvincible = true;
        this.isBlinking = true;
        this.invincibleTimer = 2000;
        this.createParticles(this.fairy.x, this.fairy.y, '#EF5350', 20);
    }

    /**
     * Activate shield power-up
     */
    activateShield() {
        this.isInvincible = true;
        this.invincibleTimer = 3000;
        this.createParticles(this.fairy.x, this.fairy.y, '#4FC3F7', 20);
    }

    /**
     * Complete current level
     */
    completeLevel() {
        if (this.currentLevel < this.maxLevel) {
            this.currentLevel++;
            this.starsCollected = 0;
            const config = this.levelConfig[this.currentLevel - 1];
            this.totalStarsToCollect = config.stars;

            // Spawn more shields for next level
            this.spawnShields(config.shieldCount);

            // Show level up effect
            this.createParticles(this.width / 2, this.height / 2, '#81C784', 30);
        } else {
            // Game completed!
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

        // Draw game elements
        this.drawClouds(ctx);
        this.drawStars(ctx);
        this.drawMeteors(ctx);
        this.drawMeteorShower(ctx);
        this.drawAsteroids(ctx);
        this.drawShields(ctx);
        this.drawFairy(ctx);
        this.drawParticles(ctx);

        // Draw UI overlay
        this.drawUIOverlay(ctx);

        // Draw level indicator
        this.drawLevelIndicator(ctx);
    }

    /**
     * Draw background with stars
     */
    drawBackground(ctx) {
        // Gradient sky
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#0a0a2e');
        gradient.addColorStop(0.5, '#1a1a4e');
        gradient.addColorStop(1, '#2d1b4e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);

        // Draw twinkling background stars
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 50; i++) {
            const x = (i * 73 + this.backgroundOffset * 0.1) % this.width;
            const y = (i * 97) % this.height;
            const size = (Math.sin(this.starTwinkle + i) + 1) * 1.5 + 0.5;
            const alpha = (Math.sin(this.starTwinkle * 2 + i * 0.5) + 1) * 0.4 + 0.3;

            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    /**
     * Draw clouds
     */
    drawClouds(ctx) {
        for (const cloud of this.clouds) {
            ctx.globalAlpha = cloud.opacity;

            // Draw cloud puffs
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.height * 0.5, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.width * 0.25, cloud.y - cloud.height * 0.2, cloud.height * 0.4, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.width * 0.5, cloud.y, cloud.height * 0.5, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.width * 0.75, cloud.y - cloud.height * 0.15, cloud.height * 0.35, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1;
        }
    }

    /**
     * Draw stars
     */
    drawStars(ctx) {
        for (const star of this.stars) {
            if (star.collected) continue;

            ctx.save();
            ctx.translate(star.x, star.y);
            ctx.rotate(star.rotation);

            // Star glow
            const glowAlpha = (Math.sin(star.twinkle) + 1) * 0.3 + 0.4;
            ctx.globalAlpha = glowAlpha;
            ctx.fillStyle = '#FFD700';
            this.drawStarShape(ctx, 0, 0, star.radius * 1.5, star.radius * 0.6, 5);

            // Star
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#FFD700';
            this.drawStarShape(ctx, 0, 0, star.radius, star.radius * 0.4, 5);

            // Star highlight
            ctx.fillStyle = '#FFFFFF';
            ctx.globalAlpha = 0.6;
            this.drawStarShape(ctx, 0, 0, star.radius * 0.5, star.radius * 0.2, 5);

            ctx.restore();
            ctx.globalAlpha = 1;
        }
    }

    /**
     * Draw star shape helper
     */
    drawStarShape(ctx, cx, cy, outerR, innerR, points) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (Math.PI / points) * i - Math.PI / 2;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Draw meteors
     */
    drawMeteors(ctx) {
        for (const meteor of this.meteors) {
            // Draw trail
            for (const t of meteor.trail) {
                ctx.globalAlpha = t.alpha * 0.5;
                ctx.fillStyle = '#FF6B35';
                ctx.beginPath();
                ctx.arc(t.x, t.y, meteor.radius * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw meteor
            ctx.globalAlpha = 1;
            ctx.save();
            ctx.translate(meteor.x, meteor.y);
            ctx.rotate(meteor.rotation);

            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, meteor.radius);
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.3, '#FFD700');
            gradient.addColorStop(1, '#FF6B35');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, meteor.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    /**
     * Draw meteor shower
     */
    drawMeteorShower(ctx) {
        for (const meteor of this.meteorShower) {
            // Draw trail
            for (const t of meteor.trail) {
                ctx.globalAlpha = t.alpha * 0.4;
                ctx.fillStyle = '#FF8C00';
                ctx.beginPath();
                ctx.arc(t.x, t.y, meteor.radius * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw meteor
            ctx.globalAlpha = 1;
            ctx.save();
            ctx.translate(meteor.x, meteor.y);
            ctx.rotate(meteor.rotation);

            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, meteor.radius);
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.4, '#FFD700');
            gradient.addColorStop(1, '#FF4500');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, meteor.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    /**
     * Draw asteroids
     */
    drawAsteroids(ctx) {
        for (const asteroid of this.asteroids) {
            ctx.save();
            ctx.translate(asteroid.x, asteroid.y);
            ctx.rotate(asteroid.rotation);

            // Asteroid body
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.moveTo(asteroid.radius * 0.8, -asteroid.radius * 0.3);
            ctx.lineTo(asteroid.radius, asteroid.radius * 0.2);
            ctx.lineTo(asteroid.radius * 0.5, asteroid.radius * 0.8);
            ctx.lineTo(-asteroid.radius * 0.3, asteroid.radius * 0.6);
            ctx.lineTo(-asteroid.radius * 0.9, asteroid.radius * 0.1);
            ctx.lineTo(-asteroid.radius * 0.5, -asteroid.radius * 0.5);
            ctx.lineTo(asteroid.radius * 0.2, -asteroid.radius * 0.8);
            ctx.closePath();
            ctx.fill();

            // Craters
            ctx.fillStyle = '#654321';
            ctx.beginPath();
            ctx.arc(-asteroid.radius * 0.2, -asteroid.radius * 0.1, asteroid.radius * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(asteroid.radius * 0.3, asteroid.radius * 0.3, asteroid.radius * 0.15, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    /**
     * Draw shields
     */
    drawShields(ctx) {
        for (const shield of this.shields) {
            ctx.save();
            ctx.translate(shield.x, shield.y);

            // Pulsing glow
            const pulseScale = 1 + Math.sin(shield.pulse) * 0.2;
            ctx.scale(pulseScale, pulseScale);

            // Shield glow
            const gradient = ctx.createRadialGradient(0, 0, shield.radius * 0.5, 0, 0, shield.radius * 1.5);
            gradient.addColorStop(0, 'rgba(79, 195, 247, 0.3)');
            gradient.addColorStop(1, 'rgba(79, 195, 247, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, shield.radius * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Shield icon
            ctx.fillStyle = '#4FC3F7';
            ctx.beginPath();
            ctx.moveTo(0, -shield.radius);
            ctx.lineTo(shield.radius, -shield.radius * 0.5);
            ctx.lineTo(shield.radius, shield.radius * 0.3);
            ctx.lineTo(0, shield.radius);
            ctx.lineTo(-shield.radius, shield.radius * 0.3);
            ctx.lineTo(-shield.radius, -shield.radius * 0.5);
            ctx.closePath();
            ctx.fill();

            // Shield highlight
            ctx.fillStyle = '#81D4FA';
            ctx.beginPath();
            ctx.moveTo(0, -shield.radius);
            ctx.lineTo(shield.radius * 0.5, -shield.radius * 0.5);
            ctx.lineTo(shield.radius * 0.3, shield.radius * 0.1);
            ctx.lineTo(0, shield.radius * 0.3);
            ctx.lineTo(-shield.radius * 0.5, -shield.radius * 0.1);
            ctx.lineTo(-shield.radius, -shield.radius * 0.5);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
    }

    /**
     * Draw fairy
     */
    drawFairy(ctx) {
        ctx.save();
        ctx.translate(this.fairy.x, this.fairy.y);
        ctx.globalAlpha = this.fairy.opacity || 1;

        // Shield effect when invincible
        if (this.isInvincible) {
            const shieldPulse = Math.sin(Date.now() / 100) * 0.2 + 0.6;
            ctx.globalAlpha = shieldPulse;
            ctx.fillStyle = 'rgba(79, 195, 247, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, this.fairy.radius * 1.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = this.fairy.opacity || 1;
        }

        // Wings
        const wingY = Math.sin(this.fairy.wingAngle) * 5;
        ctx.fillStyle = 'rgba(200, 230, 255, 0.7)';

        // Left wing
        ctx.beginPath();
        ctx.ellipse(-15, wingY - 5, 15, 8, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Right wing
        ctx.beginPath();
        ctx.ellipse(15, wingY - 5, 15, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Body
        const bodyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
        bodyGradient.addColorStop(0, '#FFFFFF');
        bodyGradient.addColorStop(0.5, '#E1F5FE');
        bodyGradient.addColorStop(1, '#4FC3F7');
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();

        // Face
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-5, -3, 2, 0, Math.PI * 2);
        ctx.arc(5, -3, 2, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 2, 5, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // Crown/sparkle on head
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(3, -16);
        ctx.lineTo(0, -18);
        ctx.lineTo(-3, -16);
        ctx.closePath();
        ctx.fill();

        // Sparkle trail
        if (this.state === 'playing') {
            const sparkleCount = 5;
            for (let i = 0; i < sparkleCount; i++) {
                const t = (Date.now() / 200 + i * 0.5) % sparkleCount;
                const sx = Math.sin(t * 2) * 10;
                const sy = t * 3;
                const alpha = 1 - t / sparkleCount;
                ctx.globalAlpha = alpha * 0.6 * (this.fairy.opacity || 1);
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(sx, sy + 15, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

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
     * Draw UI overlay
     */
    drawUIOverlay(ctx) {
        // Score
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`⭐ ${this.score}`, 15, 35);

        // Stars remaining
        ctx.font = '16px Arial';
        ctx.fillText(`星星: ${this.starsCollected}/${this.totalStarsToCollect}`, 15, 60);

        // Level name
        const config = this.levelConfig[this.currentLevel - 1];
        ctx.textAlign = 'right';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`第${this.currentLevel}關: ${config.name}`, this.width - 15, 35);

        // Invincibility indicator
        if (this.isInvincible) {
            ctx.fillStyle = '#4FC3F7';
            ctx.font = '14px Arial';
            ctx.fillText(`🛡️ ${Math.ceil(this.invincibleTimer / 1000)}秒`, this.width - 15, 60);
        }
    }

    /**
     * Draw level indicator
     */
    drawLevelIndicator(ctx) {
        const indicatorY = this.height - 30;
        const indicatorWidth = 120;
        const indicatorX = (this.width - indicatorWidth) / 2;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.roundRect(indicatorX, indicatorY, indicatorWidth, 20, 10);
        ctx.fill();

        // Progress
        const progress = this.starsCollected / this.totalStarsToCollect;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.roundRect(indicatorX + 2, indicatorY + 2, (indicatorWidth - 4) * progress, 16, 8);
        ctx.fill();

        // Star icon
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.starsCollected}/${this.totalStarsToCollect}`, this.width / 2, indicatorY + 14);
    }

    /**
     * Calculate stars based on score (for star rating)
     */
    calculateStars() {
        const thresholds = {
            one: 20,
            two: 50,
            three: 100
        };
        this.stars = Utils.calculateStars(this.score, thresholds);
    }

    /**
     * Calculate stars from percentage (for level completion)
     */
    starsFromPercentage(percentage) {
        if (percentage >= 100) return 3;
        if (percentage >= 70) return 2;
        if (percentage >= 40) return 1;
        return 0;
    }

    /**
     * Start the game
     */
    start() {
        this.currentLevel = 1;
        super.start();
    }

    /**
     * Clean up
     */
    destroy() {
        // Remove event listeners
        this.canvas?.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas?.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas?.removeEventListener('touchend', this.handleTouchEnd);
        this.canvas?.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas?.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas?.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas?.removeEventListener('mouseleave', this.handleMouseUp);
        document.removeEventListener('keydown', this.handleKeyDown);

        if (this.tiltEnabled) {
            window.removeEventListener('deviceorientation', this.handleOrientation);
        }

        super.destroy();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StarCatcher;
}

// Register globally for browser use
if (typeof window !== 'undefined') {
    window.StarCatcher = StarCatcher;
    if (window.GameRegistry) {
        GameRegistry.register('star-catcher', StarCatcher);
    }
}
