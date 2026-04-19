import {Painter} from './painter.js'
export class ArtView {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.painter = new Painter(this.canvas.width, this.canvas.height);
        this.clear();
    }
    updateSoundArt(data, lineWidth, stride) {
        this.painter.drawStep(this.ctx, data, lineWidth, stride);
    }
    drawStrokeSegment(p0, p1) {
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = '#111111';
        this.ctx.beginPath();
        this.ctx.moveTo(p0.x, p0.y);
        this.ctx.lineTo(p1.x, p1.y);
        this.ctx.stroke();
    }
    clear() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.painter.resetPositions();
    }
}
