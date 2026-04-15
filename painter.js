// painter.js
const LINE_WIDTH = 3;
const PIXELS_TO_MOVE = 3;

export class Painter {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        // each frequency index gets its own starting position
        this.positions = [];
        this.initPositions(128); // matches the frequency count
    }

    initPositions(count) {
        for (let i = 0; i < count; i++) {
            this.positions.push({
                x: this.width / 2,
                y: this.height / 2
            });
        }
    }

    // this is the core "Random Walk" logic
    drawStep(ctx, frequencyData) {
        if (!frequencyData) return;

        frequencyData.forEach((value, index) => {
            if (value === 0) return; // skip if no sound at this frequency

            // map frequency value to "energy" (number of steps)
            const steps = Math.floor(value / 10); 
            
            ctx.beginPath();
            ctx.lineWidth = LINE_WIDTH; 
            // random RGB color for this specific frequency stroke
            ctx.strokeStyle = `rgb(${Math.random()*255}, ${Math.random()*255}, ${Math.random()*255})`;
            
            let pos = this.positions[index];
            ctx.moveTo(pos.x, pos.y);

            for (let s = 0; s < steps; s++) {
                // randomly choose direction: 0 = Up, 1 = Down, 2 = Left, 3 = Right
                const direction = Math.floor(Math.random() * 4);
                const stride = PIXELS_TO_MOVE; // how many pixels to move per step

                if (direction === 0) pos.y -= stride;
                else if (direction === 1) pos.y += stride;
                else if (direction === 2) pos.x -= stride;
                else pos.x += stride;

                // keep painter within canvas bounds
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