export class Painter {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.positions = [];
        this.initPositions(128);
    }

    // Give each frequency index a unique, random starting point
    initPositions(count) {
        this.positions = []; // Ensure array is fresh
        for (let i = 0; i < count; i++) {
            this.positions.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height
            });
        }
    }

    drawStep(ctx, frequencyData, lineWidth, stride) {
        if (!frequencyData) return;
        
        // Note: 140 is quite high! If you find it's too hard to trigger,
        // you might want to try 50-70. But if your PC is loud, stay high.
        const THRESHOLD = 180; 
        
        frequencyData.forEach((value, index) => {
            if (value < THRESHOLD) return;

            const steps = Math.floor(value / 10); 
            
            ctx.beginPath();
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = `rgb(${Math.random()*255}, ${Math.random()*255}, ${Math.random()*255})`;
            
            let pos = this.positions[index];
            ctx.moveTo(pos.x, pos.y);

            for (let s = 0; s < steps; s++) {
                const direction = Math.floor(Math.random() * 4);

                if (direction === 0) pos.y -= stride;
                else if (direction === 1) pos.y += stride;
                else if (direction === 2) pos.x -= stride;
                else pos.x += stride;

                // Keep painter within canvas bounds
                pos.x = Math.max(0, Math.min(this.width, pos.x));
                pos.y = Math.max(0, Math.min(this.height, pos.y));

                ctx.lineTo(pos.x, pos.y);
            }
            ctx.stroke();
        });
    }

    // When clearing, randomize the positions again so the next 
    // "performance" starts fresh in different spots
    resetPositions() {
        this.positions.forEach(pos => {
            pos.x = Math.random() * this.width;
            pos.y = Math.random() * this.height;
        });
    }
}