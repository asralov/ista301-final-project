export class Painter {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.positions = [];
        this.initPositions(128);
    }

    initPositions(count) {
        for (let i = 0; i < count; i++) {
            this.positions.push({ x: this.width / 2, y: this.height / 2 });
        }
    }

    // Now accepts lineWidth and stride as parameters
    drawStep(ctx, frequencyData, lineWidth, stride) {
        if (!frequencyData) return;

        frequencyData.forEach((value, index) => {
            if (value === 0) return;

            const steps = Math.floor(value / 10); 
            
            ctx.beginPath();
            ctx.lineWidth = lineWidth; // Controlled by UI
            ctx.strokeStyle = `rgb(${Math.random()*255}, ${Math.random()*255}, ${Math.random()*255})`;
            
            let pos = this.positions[index];
            ctx.moveTo(pos.x, pos.y);

            for (let s = 0; s < steps; s++) {
                const direction = Math.floor(Math.random() * 4);

                if (direction === 0) pos.y -= stride; // Controlled by UI
                else if (direction === 1) pos.y += stride;
                else if (direction === 2) pos.x -= stride;
                else pos.x += stride;

                pos.x = Math.max(0, Math.min(this.width, pos.x));
                pos.y = Math.max(0, Math.min(this.height, pos.y));

                ctx.lineTo(pos.x, pos.y);
            }
            ctx.stroke();
        });
    }

    resetPositions() {
        this.positions.forEach(pos => {
            pos.x = this.width / 2;
            pos.y = this.height / 2;
        });
    }
}