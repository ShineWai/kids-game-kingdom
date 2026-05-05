/**
 * Garden Party - 花園派對
 * A garden/farm simulation game where players water, pest control, and grow plants
 * Plants go through stages: seed -> sprout -> growing -> flowering/fruiting
 * Pests like aphids and snails reproduce over time
 */

class GardenParty extends GameBase {
    constructor(gameId = 'gardenParty', options = {}) {
        super(gameId, options);

        // Game elements
        this.plants = [];
        this.pests = [];
        this.soilPatches = [];
        this.waterDrops = [];
        this.particles = [];

        // Level settings
        this.levels = [
            { plants: 5, pests: 2, time: 90, name: '新手' },
            { plants: 8, pests: 4, time: 120, name: '第一關' },
            { plants: 12, pests: 6, time: 150, name: '初次挑戰' },
            { plants: 16, pests: 9, time: 180, name: '熟練工人' }
        ];
        this.currentLevel = 0;

        // Game state
        this.harvestCount = 0;
        this.totalToHarvest = 0;

        // Plant stages
        this.plantStages = ['seed', 'sprout', 'growing', 'flowering'];

        // Tools
        this.currentTool = 'water';
        this.tools = [
            { type: 'water', x: 20, y: this.height - 80, width: 50, height: 50, label: '澆水' },
            { type: 'pesticide', x: 80, y: this.height - 80, width: 50, height: 50, label: '除蟲' },
            { type: 'seed', x: 140, y: this.height - 80, width: 50, height: 50, label: '種植' }
        ];

        // Water/pesticide range
        this.actionRange = 60;

        // Bind methods
        this.handleClick = this.handleClick.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
    }

    /**
     * Initialize game elements
     */
    initElements() {
        // Clear arrays
        this.plants = [];
        this.pests = [];
        this.soilPatches = [];
        this.waterDrops = [];
        this.particles = [];

        // Get level config
        const levelConfig = this.levels[this.currentLevel];
        this.totalToHarvest = levelConfig.plants;

        // Create soil patches (planting spots)
        const rows = 3;
        const cols = Math.ceil(levelConfig.plants / rows);
        const startX = (this.width - cols * 100) / 2 + 50;
        const startY = 100;

        let plantCount = 0;
        for (let row = 0; row < rows && plantCount < levelConfig.plants; row++) {
            for (let col = 0; col < cols && plantCount < levelConfig.plants; col++) {
                this.soilPatches.push({
                    x: startX + col * 100,
                    y: startY + row * 100,
                    width: 70,
                    height: 70,
                    hasPlant: false,
                    plant: null
                });
                plantCount++;
            }
        }

        // Spawn initial pests
        for (let i = 0; i < levelConfig.pests; i++) {
            this.spawnPest();
        }

        // Setup input
        this.setupInputHandlers();

        this.harvestCount = 0;
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
            if (e.key === '1') this.currentTool = 'water';
            if (e.key === '2') this.currentTool = 'pesticide';
            if (e.key === '3') this.currentTool = 'seed';
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

        this.handleAction(x, y);
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

        this.handleAction(x, y);
    }

    /**
     * Handle mouse move
     */
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;
    }

    /**
     * Handle action based on current tool
     */
    handleAction(x, y) {
        // Check tool selection first
        for (const tool of this.tools) {
            if (x >= tool.x && x <= tool.x + tool.width &&
                y >= tool.y && y <= tool.y + tool.height) {
                this.currentTool = tool.type;
                return;
            }
        }

        // Apply tool effect
        switch (this.currentTool) {
            case 'water':
                this.water(x, y);
                break;
            case 'pesticide':
                this.applyPesticide(x, y);
                break;
            case 'seed':
                this.plantSeed(x, y);
                break;
        }
    }

    /**
     * Water at position
     */
    water(x, y) {
        let watered = false;

        // Water soil patches
        for (const patch of this.soilPatches) {
            if (patch.hasPlant && this.isInRange(x, y, patch.x, patch.y, this.actionRange)) {
                patch.plant.waterLevel = Math.min(100, patch.plant.waterLevel + 30);
                watered = true;
            }
        }

        // Create water drops effect
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const dist = Math.random() * 30;
            this.waterDrops.push({
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                vy: -1 - Math.random(),
                size: 3 + Math.random() * 3,
                life: 0.5 + Math.random() * 0.3
            });
        }

        if (watered) {
            this.addScore(5);
        }
    }

    /**
     * Apply pesticide at position
     */
    applyPesticide(x, y) {
        let killed = false;

        for (let i = this.pests.length - 1; i >= 0; i--) {
            const pest = this.pests[i];
            if (this.isInRange(x, y, pest.x, pest.y, this.actionRange)) {
                // Create death particles
                this.createParticles(pest.x, pest.y, pest.type === 'aphid' ? '#8BC34A' : '#9E9E9E', 8);
                this.pests.splice(i, 1);
                killed = true;
            }
        }

        if (killed) {
            this.addScore(15);
        }
    }

    /**
     * Plant seed at position
     */
    plantSeed(x, y) {
        for (const patch of this.soilPatches) {
            if (!patch.hasPlant && this.isInRange(x, y, patch.x, patch.y, this.actionRange)) {
                patch.hasPlant = true;
                patch.plant = {
                    type: Math.random() > 0.5 ? 'flower' : 'vegetable',
                    stage: 'seed',
                    growth: 0,
                    waterLevel: 50,
                    pestDamage: 0,
                    stageProgress: 0,
                    sunLevel: 50
                };
                this.addScore(10);
                break;
            }
        }
    }

    /**
     * Check if position is in range
     */
    isInRange(x1, y1, x2, y2, range) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy) <= range;
    }

    /**
     * Spawn a new pest
     */
    spawnPest() {
        const type = Math.random() > 0.5 ? 'aphid' : 'snail';
        const targetPatch = this.soilPatches[Math.floor(Math.random() * this.soilPatches.length)];

        this.pests.push({
            x: Math.random() * this.width,
            y: 80 + Math.random() * (this.height - 200),
            width: type === 'aphid' ? 20 : 30,
            height: type === 'aphid' ? 15 : 20,
            type: type,
            vx: (Math.random() - 0.5) * 20,
            vy: 0,
            targetPatch: targetPatch,
            eatTimer: 0
        });
    }

    /**
     * Update game state
     */
    update(deltaTime) {
        super.update(deltaTime);

        if (this.state !== 'playing') return;

        // Update plants
        this.updatePlants(deltaTime);

        // Update pests
        this.updatePests(deltaTime);

        // Update water drops
        this.updateWaterDrops(deltaTime);

        // Update particles
        this.updateParticles(deltaTime);

        // Check win condition
        if (this.harvestCount >= this.totalToHarvest) {
            this.handleLevelComplete();
        }
    }

    /**
     * Update plants
     */
    updatePlants(deltaTime) {
        for (const patch of this.soilPatches) {
            if (!patch.hasPlant || !patch.plant) continue;

            const plant = patch.plant;

            // Decrease water level over time
            plant.waterLevel = Math.max(0, plant.waterLevel - deltaTime * 2);

            // Sunlight effect
            plant.sunLevel = 50 + Math.sin(Date.now() / 3000) * 20;

            // Growth rate based on water and sun
            const growthRate = (plant.waterLevel / 100) * (plant.sunLevel / 100) * 10;

            // Pest damage slows growth
            const pestMultiplier = 1 - (plant.pestDamage / 100) * 0.5;

            plant.growth += deltaTime * growthRate * pestMultiplier;

            // Update stage based on growth
            if (plant.growth >= 100) {
                plant.stage = 'flowering';
                plant.stageProgress = (plant.growth - 100) / 100;
            } else if (plant.growth >= 60) {
                plant.stage = 'growing';
                plant.stageProgress = (plant.growth - 60) / 40;
            } else if (plant.growth >= 20) {
                plant.stage = 'sprout';
                plant.stageProgress = (plant.growth - 20) / 40;
            } else {
                plant.stage = 'seed';
                plant.stageProgress = plant.growth / 20;
            }

            // Wilting if no water
            if (plant.waterLevel <= 10) {
                plant.pestDamage += deltaTime * 5;
            }

            // Check for harvesting
            if (plant.stage === 'flowering' && plant.stageProgress >= 0.8) {
                // Ready to harvest - auto harvest after short delay
                if (!plant.readyToHarvest) {
                    plant.readyToHarvest = true;
                    plant.harvestTimer = 0;
                } else {
                    plant.harvestTimer += deltaTime;
                    if (plant.harvestTimer >= 0.5) {
                        this.harvestPlant(patch);
                    }
                }
            }
        }
    }

    /**
     * Harvest a plant
     */
    harvestPlant(patch) {
        patch.hasPlant = false;
        patch.plant = null;
        this.harvestCount++;
        this.addScore(50);
        this.createParticles(patch.x, patch.y, '#FFD700', 20);
    }

    /**
     * Update pests
     */
    updatePests(deltaTime) {
        // Move towards target patches
        for (const pest of this.pests) {
            // Find a patch with plants
            const targetPatch = this.soilPatches.find(p => p.hasPlant && p.plant);

            if (targetPatch) {
                // Move towards target
                const dx = targetPatch.x - pest.x;
                const dy = targetPatch.y - pest.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 30) {
                    pest.vx = (dx / dist) * 30;
                    pest.vy = (dy / dist) * 30;
                } else {
                    // At plant - eat it
                    pest.eatTimer += deltaTime;
                    if (pest.eatTimer >= 1) {
                        targetPatch.plant.pestDamage += 10;
                        pest.eatTimer = 0;
                    }
                    pest.vx = 0;
                    pest.vy = 0;
                }
            } else {
                // Wander
                pest.vx += (Math.random() - 0.5) * 20 * deltaTime;
                pest.vy = Math.sin(Date.now() / 1000 + pest.x) * 10;
            }

            pest.x += pest.vx * deltaTime;
            pest.y += pest.vy * deltaTime;

            // Keep in bounds
            pest.x = Math.max(20, Math.min(this.width - 20, pest.x));
            pest.y = Math.max(80, Math.min(this.height - 120, pest.y));
        }

        // Reproduce pests over time
        if (this.pests.length < 15 && Math.random() < 0.001 * (1 + this.currentLevel * 0.2)) {
            this.spawnPest();
        }
    }

    /**
     * Update water drops
     */
    updateWaterDrops(deltaTime) {
        for (let i = this.waterDrops.length - 1; i >= 0; i--) {
            const drop = this.waterDrops[i];
            drop.y += drop.vy * 60 * deltaTime;
            drop.vy += 5 * deltaTime; // Gravity
            drop.life -= deltaTime;

            if (drop.life <= 0 || drop.y > this.height) {
                this.waterDrops.splice(i, 1);
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
            p.vy += 2 * deltaTime; // Gravity
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
                vy: Math.sin(angle) * speed - 2,
                radius: 3 + Math.random() * 4,
                color: color,
                life: 0.5 + Math.random() * 0.5,
                maxLife: 1,
                alpha: 1
            });
        }
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

        // Draw soil patches
        this.drawSoilPatches(ctx);

        // Draw plants
        this.drawPlants(ctx);

        // Draw pests
        this.drawPests(ctx);

        // Draw water drops
        this.drawWaterDrops(ctx);

        // Draw particles
        this.drawParticles(ctx);

        // Draw tools
        this.drawTools(ctx);

        // Draw UI
        this.drawUI(ctx);
    }

    /**
     * Draw background
     */
    drawBackground(ctx) {
        // Sky gradient
        const skyGradient = ctx.createLinearGradient(0, 0, 0, this.height * 0.6);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(1, '#E1F5FE');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, this.width, this.height * 0.6);

        // Sun
        ctx.fillStyle = '#FFD54F';
        ctx.beginPath();
        ctx.arc(this.width - 80, 80, 40, 0, Math.PI * 2);
        ctx.fill();

        // Sun rays
        ctx.strokeStyle = '#FFD54F';
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i + Date.now() / 3000;
            ctx.beginPath();
            ctx.moveTo(this.width - 80 + Math.cos(angle) * 50, 80 + Math.sin(angle) * 50);
            ctx.lineTo(this.width - 80 + Math.cos(angle) * 65, 80 + Math.sin(angle) * 65);
            ctx.stroke();
        }

        // Grass
        const grassGradient = ctx.createLinearGradient(0, this.height * 0.5, 0, this.height);
        grassGradient.addColorStop(0, '#8BC34A');
        grassGradient.addColorStop(1, '#689F38');
        ctx.fillStyle = grassGradient;
        ctx.fillRect(0, this.height * 0.5, this.width, this.height * 0.5);

        // Grass blades
        ctx.strokeStyle = '#7CB342';
        ctx.lineWidth = 2;
        for (let i = 0; i < 50; i++) {
            const x = (i * 23) % this.width;
            const y = this.height * 0.5 + (i * 17) % (this.height * 0.5);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(x + 5, y - 15, x + 3, y - 25);
            ctx.stroke();
        }
    }

    /**
     * Draw soil patches
     */
    drawSoilPatches(ctx) {
        for (const patch of this.soilPatches) {
            // Soil
            ctx.fillStyle = '#5D4037';
            ctx.beginPath();
            ctx.roundRect(patch.x - patch.width / 2, patch.y - patch.height / 2, patch.width, patch.height, 10);
            ctx.fill();

            // Soil highlight
            ctx.fillStyle = '#795548';
            ctx.beginPath();
            ctx.roundRect(patch.x - patch.width / 2 + 5, patch.y - patch.height / 2 + 5, patch.width - 10, patch.height / 3, 5);
            ctx.fill();

            // Soil lines
            ctx.strokeStyle = '#4E342E';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(patch.x - patch.width / 2 + 10, patch.y - patch.height / 2 + 20 + i * 15);
                ctx.lineTo(patch.x + patch.width / 2 - 10, patch.y - patch.height / 2 + 20 + i * 15);
                ctx.stroke();
            }
        }
    }

    /**
     * Draw plants
     */
    drawPlants(ctx) {
        for (const patch of this.soilPatches) {
            if (!patch.hasPlant || !patch.plant) continue;

            const plant = patch.plant;
            const x = patch.x;
            const y = patch.y;

            ctx.save();
            ctx.translate(x, y);

            // Stem based on stage
            if (plant.stage !== 'seed') {
                ctx.strokeStyle = '#4CAF50';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(0, 10);

                const stemHeight = 10 + plant.growth * 0.3;
                ctx.lineTo(0, -stemHeight);
                ctx.stroke();

                // Leaves
                if (plant.stage !== 'sprout') {
                    const leafSize = plant.stage === 'seed' ? 5 : 10 + plant.stageProgress * 10;
                    ctx.fillStyle = '#66BB6A';

                    // Left leaf
                    ctx.beginPath();
                    ctx.ellipse(-leafSize / 2, -stemHeight * 0.5, leafSize, leafSize / 3, -0.5, 0, Math.PI * 2);
                    ctx.fill();

                    // Right leaf
                    ctx.beginPath();
                    ctx.ellipse(leafSize / 2, -stemHeight * 0.7, leafSize, leafSize / 3, 0.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Draw based on stage
            switch (plant.stage) {
                case 'seed':
                    ctx.fillStyle = '#8D6E63';
                    ctx.beginPath();
                    ctx.ellipse(0, 5, 8, 5, 0, 0, Math.PI * 2);
                    ctx.fill();
                    break;

                case 'sprout':
                    ctx.fillStyle = '#81C784';
                    ctx.beginPath();
                    ctx.ellipse(0, -stemHeight - 5, 6, 10, 0, 0, Math.PI * 2);
                    ctx.fill();
                    break;

                case 'growing':
                    ctx.fillStyle = '#66BB6A';
                    ctx.beginPath();
                    ctx.arc(0, -stemHeight - 10, 12, 0, Math.PI * 2);
                    ctx.fill();
                    break;

                case 'flowering':
                    if (plant.type === 'flower') {
                        // Flower petals
                        ctx.fillStyle = plant.pestDamage > 30 ? '#FF8A80' : '#FF4081';
                        for (let i = 0; i < 6; i++) {
                            const angle = (Math.PI * 2 / 6) * i + Date.now() / 2000;
                            ctx.beginPath();
                            ctx.ellipse(
                                Math.cos(angle) * 12,
                                -stemHeight - 15 + Math.sin(angle) * 12,
                                8, 5, angle, 0, Math.PI * 2
                            );
                            ctx.fill();
                        }
                        // Flower center
                        ctx.fillStyle = '#FFD54F';
                        ctx.beginPath();
                        ctx.arc(0, -stemHeight - 15, 8, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        // Vegetable (tomato-like)
                        ctx.fillStyle = plant.pestDamage > 30 ? '#FFAB91' : '#F44336';
                        ctx.beginPath();
                        ctx.arc(0, -stemHeight - 15, 15, 0, Math.PI * 2);
                        ctx.fill();
                        // Stem
                        ctx.fillStyle = '#4CAF50';
                        ctx.beginPath();
                        ctx.ellipse(0, -stemHeight - 25, 5, 8, 0, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    break;
            }

            // Wilting effect
            if (plant.waterLevel < 20) {
                ctx.globalAlpha = 0.5;
                ctx.strokeStyle = '#795548';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-20, 0);
                ctx.lineTo(20, 0);
                ctx.stroke();
            }

            // Ready to harvest indicator
            if (plant.readyToHarvest) {
                ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.3;
                ctx.fillStyle = '#FFD700';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('!', 0, -stemHeight - 40);
            }

            ctx.restore();
        }
    }

    /**
     * Draw pests
     */
    drawPests(ctx) {
        for (const pest of this.pests) {
            ctx.save();
            ctx.translate(pest.x, pest.y);

            if (pest.type === 'aphid') {
                // Aphid body
                ctx.fillStyle = '#8BC34A';
                ctx.beginPath();
                ctx.ellipse(0, 0, pest.width / 2, pest.height / 2, 0, 0, Math.PI * 2);
                ctx.fill();

                // Aphid head
                ctx.fillStyle = '#689F38';
                ctx.beginPath();
                ctx.arc(pest.vx > 0 ? pest.width / 3 : -pest.width / 3, 0, 5, 0, Math.PI * 2);
                ctx.fill();

                // Antennae
                ctx.strokeStyle = '#33691E';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(pest.vx > 0 ? 8 : -8, -3);
                ctx.lineTo(pest.vx > 0 ? 12 : -12, -8);
                ctx.moveTo(pest.vx > 0 ? 8 : -8, 3);
                ctx.lineTo(pest.vx > 0 ? 12 : -12, 8);
                ctx.stroke();
            } else {
                // Snail shell
                ctx.fillStyle = '#9E9E9E';
                ctx.beginPath();
                ctx.arc(0, -5, 12, 0, Math.PI * 2);
                ctx.fill();

                // Shell spiral
                ctx.strokeStyle = '#757575';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, -5, 8, 0, Math.PI);
                ctx.stroke();

                // Snail body
                ctx.fillStyle = '#BDBDBD';
                ctx.beginPath();
                ctx.ellipse(pest.vx > 0 ? 10 : -10, 5, 15, 8, 0, 0, Math.PI * 2);
                ctx.fill();

                // Eye stalks
                ctx.strokeStyle = '#9E9E9E';
                ctx.lineWidth = 2;
                const eyeX = pest.vx > 0 ? 15 : -15;
                ctx.beginPath();
                ctx.moveTo(eyeX, 2);
                ctx.lineTo(eyeX, -5);
                ctx.moveTo(eyeX, 2);
                ctx.lineTo(eyeX + 3, -5);
                ctx.stroke();

                // Eyes
                ctx.fillStyle = '#212121';
                ctx.beginPath();
                ctx.arc(eyeX, -6, 2, 0, Math.PI * 2);
                ctx.arc(eyeX + 3, -6, 2, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    /**
     * Draw water drops
     */
    drawWaterDrops(ctx) {
        ctx.fillStyle = '#4FC3F7';
        for (const drop of this.waterDrops) {
            ctx.globalAlpha = drop.life;
            ctx.beginPath();
            ctx.arc(drop.x, drop.y, drop.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
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
     * Draw tools
     */
    drawTools(ctx) {
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, this.height - 100, this.width, 100);

        for (const tool of this.tools) {
            const isSelected = tool.type === this.currentTool;

            // Highlight selected
            if (isSelected) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(tool.x - 5, tool.y - 5, tool.width + 10, tool.height + 10);
            }

            switch (tool.type) {
                case 'water':
                    // Watering can
                    ctx.fillStyle = '#4FC3F7';
                    ctx.fillRect(tool.x + 10, tool.y + 15, 30, 25);
                    ctx.fillRect(tool.x + 35, tool.y + 20, 10, 15);
                    // Spout
                    ctx.beginPath();
                    ctx.moveTo(tool.x + 40, tool.y + 25);
                    ctx.lineTo(tool.x + 50, tool.y + 15);
                    ctx.lineTo(tool.x + 50, tool.y + 30);
                    ctx.closePath();
                    ctx.fill();
                    break;

                case 'pesticide':
                    // Spray bottle
                    ctx.fillStyle = '#8BC34A';
                    ctx.fillRect(tool.x + 15, tool.y + 20, 20, 25);
                    ctx.fillRect(tool.x + 10, tool.y + 10, 30, 15);
                    // Nozzle
                    ctx.fillStyle = '#F44336';
                    ctx.fillRect(tool.x + 5, tool.y + 15, 10, 5);
                    break;

                case 'seed':
                    // Seed packet
                    ctx.fillStyle = '#FF8F00';
                    ctx.fillRect(tool.x + 10, tool.y + 10, 30, 35);
                    ctx.fillStyle = '#FFE0B2';
                    ctx.fillRect(tool.x + 15, tool.y + 15, 20, 15);
                    // Seeds
                    ctx.fillStyle = '#8D6E63';
                    ctx.beginPath();
                    ctx.arc(tool.x + 20, tool.y + 22, 3, 0, Math.PI * 2);
                    ctx.arc(tool.x + 28, tool.y + 22, 3, 0, Math.PI * 2);
                    ctx.arc(tool.x + 24, tool.y + 28, 3, 0, Math.PI * 2);
                    ctx.fill();
                    break;
            }

            // Label
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(tool.label, tool.x + tool.width / 2, tool.y + tool.height + 15);
        }

        // Instructions
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '11px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('按 1/2/3 選擇工具', 230, this.height - 60);
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

        // Harvest progress
        ctx.fillStyle = '#FFD700';
        ctx.font = '18px Arial';
        ctx.fillText(`收成: ${this.harvestCount}/${this.totalToHarvest}`, 15, 60);

        // Level
        const levelConfig = this.levels[this.currentLevel];
        ctx.textAlign = 'right';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`第${this.currentLevel + 1}關: ${levelConfig.name}`, this.width - 15, 35);

        // Pest count
        ctx.font = '16px Arial';
        ctx.fillStyle = '#F44336';
        ctx.fillText(`害蟲: ${this.pests.length}`, this.width - 15, 60);

        // Instructions
        ctx.textAlign = 'center';
        ctx.font = '14px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText('選擇工具後點擊花園進行操作！', this.width / 2, this.height - 110);
    }

    /**
     * Calculate stars
     */
    calculateStars() {
        this.stars = Utils.calculateStars(this.score, {
            one: 150,
            two: 300,
            three: 600
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
    module.exports = GardenParty;
}

// Register globally for browser use
if (typeof window !== 'undefined') {
    window.GardenParty = GardenParty;
    if (window.GameRegistry) {
        GameRegistry.register('garden-party', GardenParty);
    }
}