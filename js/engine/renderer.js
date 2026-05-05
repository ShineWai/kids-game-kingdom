/**
 * Renderer Engine - Canvas rendering utilities
 */

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.scale = window.devicePixelRatio || 1;
        this.clearColor = '#E3F2FD';
    }

    /**
     * Resize canvas to match container
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.scale = window.devicePixelRatio || 1;
        this.canvas.width = width * this.scale;
        this.canvas.height = height * this.scale;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        this.ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    }

    /**
     * Clear canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * Clear with background color
     */
    clearWithColor(color = this.clearColor) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Draw filled rectangle
     */
    drawRect(x, y, width, height, color, radius = 0) {
        this.ctx.fillStyle = color;
        if (radius > 0) {
            this.roundRect(x, y, width, height, radius, true, false);
        } else {
            this.ctx.fillRect(x, y, width, height);
        }
    }

    /**
     * Draw outlined rectangle
     */
    drawRectOutline(x, y, width, height, color, lineWidth = 2, radius = 0) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        if (radius > 0) {
            this.roundRect(x, y, width, height, radius, false, true);
        } else {
            this.ctx.strokeRect(x, y, width, height);
        }
    }

    /**
     * Draw rounded rectangle
     */
    roundRect(x, y, width, height, radius, fill = true, stroke = false) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        if (fill) this.ctx.fill();
        if (stroke) this.ctx.stroke();
    }

    /**
     * Draw circle
     */
    drawCircle(x, y, radius, color, fill = true) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        if (fill) {
            this.ctx.fill();
        } else {
            this.ctx.stroke();
        }
    }

    /**
     * Draw text
     */
    drawText(text, x, y, options = {}) {
        const {
            font = '16px -apple-system, BlinkMacSystemFont, sans-serif',
            color = '#37474F',
            align = 'center',
            baseline = 'middle',
            maxWidth = null
        } = options;

        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;

        if (maxWidth) {
            this.ctx.fillText(text, x, y, maxWidth);
        } else {
            this.ctx.fillText(text, x, y);
        }
    }

    /**
     * Draw emoji or emoji-style text
     */
    drawEmoji(emoji, x, y, size = 32) {
        this.ctx.font = `${size}px serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(emoji, x, y);
    }

    /**
     * Draw image
     */
    drawImage(image, x, y, width, height) {
        if (image.complete) {
            this.ctx.drawImage(image, x, y, width || image.width, height || image.height);
        }
    }

    /**
     * Draw line
     */
    drawLine(x1, y1, x2, y2, color = '#37474F', lineWidth = 2) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    /**
     * Draw gradient background
     */
    drawGradient(x, y, width, height, color1, color2, direction = 'vertical') {
        const gradient = direction === 'horizontal'
            ? this.ctx.createLinearGradient(x, y, x + width, y)
            : this.ctx.createLinearGradient(x, y, x, y + height);

        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, width, height);
    }

    /**
     * Set shadow
     */
    setShadow(color = 'rgba(0,0,0,0.3)', blur = 5, offsetX = 2, offsetY = 2) {
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = blur;
        this.ctx.shadowOffsetX = offsetX;
        this.ctx.shadowOffsetY = offsetY;
    }

    /**
     * Clear shadow
     */
    clearShadow() {
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }

    /**
     * Save context state
     */
    save() {
        this.ctx.save();
    }

    /**
     * Restore context state
     */
    restore() {
        this.ctx.restore();
    }

    /**
     * Clip to rectangle
     */
    clip(x, y, width, height) {
        this.ctx.beginPath();
        this.ctx.rect(x, y, width, height);
        this.ctx.clip();
    }

    /**
     * Draw particles
     */
    drawParticles(particles) {
        particles.forEach(p => {
            this.ctx.globalAlpha = p.alpha || 1;
            this.drawCircle(p.x, p.y, p.radius, p.color);
        });
        this.ctx.globalAlpha = 1;
    }
}