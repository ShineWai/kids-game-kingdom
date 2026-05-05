/**
 * Physics Engine - Simple physics simulation
 */

class Physics {
    constructor() {
        this.gravity = Constants.PHYSICS.GRAVITY;
        this.friction = Constants.PHYSICS.FRICTION;
        this.bounce = Constants.PHYSICS.BOUNCE;
        this.maxVelocity = Constants.PHYSICS.MAX_VELOCITY;
    }

    /**
     * Apply gravity to velocity
     */
    applyGravity(entity, deltaTime = 1) {
        entity.vy += this.gravity * deltaTime;
    }

    /**
     * Apply friction to velocity
     */
    applyFriction(entity) {
        entity.vx *= this.friction;
        entity.vy *= this.friction;
    }

    /**
     * Update entity position
     */
    updatePosition(entity, deltaTime = 1) {
        entity.x += entity.vx * deltaTime;
        entity.y += entity.vy * deltaTime;
    }

    /**
     * Update entity with all physics
     */
    update(entity, deltaTime = 1) {
        this.applyGravity(entity, deltaTime);
        this.applyFriction(entity);
        this.clampVelocity(entity);
        this.updatePosition(entity, deltaTime);
    }

    /**
     * Clamp velocity to max
     */
    clampVelocity(entity) {
        entity.vx = Utils.clamp(entity.vx, -this.maxVelocity, this.maxVelocity);
        entity.vy = Utils.clamp(entity.vy, -this.maxVelocity, this.maxVelocity);
    }

    /**
     * Handle boundary collision
     */
    handleBoundary(entity, bounds, options = {}) {
        const { bounce = true, callback = null } = options;

        // Left boundary
        if (entity.x < bounds.x) {
            entity.x = bounds.x;
            if (bounce) entity.vx *= -this.bounce;
            if (callback) callback('left', entity);
        }

        // Right boundary
        if (entity.x + entity.width > bounds.x + bounds.width) {
            entity.x = bounds.x + bounds.width - entity.width;
            if (bounce) entity.vx *= -this.bounce;
            if (callback) callback('right', entity);
        }

        // Top boundary
        if (entity.y < bounds.y) {
            entity.y = bounds.y;
            if (bounce) entity.vy *= -this.bounce;
            if (callback) callback('top', entity);
        }

        // Bottom boundary
        if (entity.y + entity.height > bounds.y + bounds.height) {
            entity.y = bounds.y + bounds.height - entity.height;
            if (bounce) entity.vy *= -this.bounce;
            if (callback) callback('bottom', entity);
        }
    }

    /**
     * Check AABB collision
     */
    checkCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    /**
     * Check circle-rectangle collision
     */
    circleRectCollision(circle, rect) {
        const closestX = Utils.clamp(circle.x, rect.x, rect.x + rect.width);
        const closestY = Utils.clamp(circle.y, rect.y, rect.y + rect.height);
        const distanceX = circle.x - closestX;
        const distanceY = circle.y - closestY;
        return (distanceX * distanceX + distanceY * distanceY) < (circle.radius * circle.radius);
    }

    /**
     * Resolve collision between two entities
     */
    resolveCollision(a, b, callback = null) {
        if (!this.checkCollision(a, b)) return false;

        // Calculate overlap
        const overlapX = Math.min(a.x + a.width - b.x, b.x + b.width - a.x);
        const overlapY = Math.min(a.y + a.height - b.y, b.y + b.height - a.y);

        // Resolve along smallest overlap axis
        if (overlapX < overlapY) {
            if (a.x < b.x) {
                a.x -= overlapX;
                a.vx *= -this.bounce;
            } else {
                a.x += overlapX;
                a.vx *= -this.bounce;
            }
        } else {
            if (a.y < b.y) {
                a.y -= overlapY;
                a.vy *= -this.bounce;
            } else {
                a.y += overlapY;
                a.vy *= -this.bounce;
            }
        }

        if (callback) callback(a, b);
        return true;
    }

    /**
     * Create physics body
     */
    createBody(x, y, width, height, options = {}) {
        return {
            x, y, width, height,
            vx: options.vx || 0,
            vy: options.vy || 0,
            mass: options.mass || 1,
            elasticity: options.elasticity || 0.5,
            friction: options.friction || 0.98,
            isStatic: options.isStatic || false
        };
    }

    /**
     * Apply force to body
     */
    applyForce(body, fx, fy) {
        if (body.isStatic) return;
        body.vx += fx / body.mass;
        body.vy += fy / body.mass;
    }

    /**
     * Jump force (for character)
     */
    jump(entity, force = -10) {
        entity.vy = force;
    }

    /**
     * Move left
     */
    moveLeft(entity, speed = 5) {
        entity.vx = -speed;
    }

    /**
     * Move right
     */
    moveRight(entity, speed = 5) {
        entity.vx = speed;
    }

    /**
     * Check if entity is falling
     */
    isFalling(entity) {
        return entity.vy > 0;
    }

    /**
     * Check if entity is grounded
     */
    isGrounded(entity, groundY) {
        return entity.y + entity.height >= groundY && entity.vy >= 0;
    }
}