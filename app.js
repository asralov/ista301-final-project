import { AudioModel, MusicModel, DrawingModel } from "./model.js";
import { ArtView } from "./view.js";
class AppController {
    constructor() {
        this.audioModel = new AudioModel();
        this.musicModel = new MusicModel();
        this.drawingModel = new DrawingModel();
        this.view = new ArtView('artCanvas');

        this.currentMode = 'soundToDraw'; // or 'drawToSound'
        this.isBusy = false; // prevents mode switching while recording/playing

        this.initEventListeners();
    }

    initEventListeners() {
        // mode Switchers
        document.getElementById('modeSoundToDraw').addEventListener('click', () => this.setMode('soundToDraw'));
        document.getElementById('modeDrawToSound').addEventListener('click', () => this.setMode('drawToSound'));

        // sound to draw
        document.getElementById('startBtn').addEventListener('click', () => this.toggleSoundMode());

        // draw to sound
        document.getElementById('drawBtn').addEventListener('click', () => this.toggleDrawingState());
        document.getElementById('playBtn').addEventListener('click', () => this.playDrawing());

        // shared
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());

        // pointer events for drawing
        this.view.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        this.view.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
        window.addEventListener('pointerup', () => this.onPointerUp());
    }

    setMode(mode) {
        if (this.isBusy) return; // locked while recording or playing

        this.currentMode = mode;
        this.view.clear();
        this.drawingModel.clear();

        // ui updates
        document.getElementById('modeSoundToDraw').classList.toggle('active', mode === 'soundToDraw');
        document.getElementById('modeDrawToSound').classList.toggle('active', mode === 'drawToSound');

        document.getElementById('startBtn').classList.toggle('hidden', mode !== 'soundToDraw');
        document.getElementById('drawBtn').classList.toggle('hidden', mode !== 'drawToSound');
        document.getElementById('playBtn').classList.toggle('hidden', mode !== 'drawToSound');

        document.getElementById('hint').innerText = mode === 'soundToDraw' ?
            "The canvas is hungry for sound. Feed it." : "Draw on the canvas, then press Play.";

        // toggle visibility of the sound settings panel
        const settingsPanel = document.getElementById('soundSettings');
        if (settingsPanel) {
            settingsPanel.classList.toggle('hidden', mode !== 'soundToDraw');
        }
    }

    // mode: sound
    async toggleSoundMode() {
        if (!this.audioModel.isInitialized) await this.audioModel.init();

        this.isBusy = !this.isBusy;
        const btn = document.getElementById('startBtn');
        const clearBtn = document.getElementById('clearBtn');

        btn.innerText = this.isBusy ? "STOP & VIEW ART" : "PRESS AND MAKE NOISES";
        btn.style.background = this.isBusy ? "#e74c3c" : "#2d3436";

        clearBtn.disabled = this.isBusy;
        clearBtn.classList.toggle('disabled', this.isBusy)

        this.toggleModeSwitcher(!this.isBusy);

        if (this.isBusy) this.soundLoop();
    }

    soundLoop() {
        if (!this.isBusy || this.currentMode !== 'soundToDraw') return;

        const speed = parseInt(document.getElementById('speedRange').value);

        // initialize frame counter if it does not exist
        this.frameCount = (this.frameCount || 0) + 1;

        // only draw if the frame matches the speed setting
        // (11 - speed) makes 10 the fastest (every frame) and 1 the slowest (every 10 frames)
        if (this.frameCount % (11 - speed) === 0) {

            // get values from the new sliders
            const lineWidth = parseInt(document.getElementById('lineWidthRange').value);
            const stride = parseInt(document.getElementById('strideRange').value);

            // get audio data
            const data = this.audioModel.getFrequencyData();

            // pass audio data + UI variables to the view
            this.view.updateSoundArt(data, lineWidth, stride);
        }

        requestAnimationFrame(() => this.soundLoop());
    }


    // mode: draw
    toggleDrawingState() {
        this.drawingActive = !this.drawingActive;
        const btn = document.getElementById('drawBtn');
        btn.innerText = this.drawingActive ? 'DRAWING MODE: ON' : 'DRAWING MODE: OFF';
        btn.style.background = this.drawingActive ? '#00b894' : '#0984e3';
    }

    async playDrawing() {
        if (!this.musicModel.isInitialized) await this.musicModel.init();
        this.isBusy = true;

        const clearBtn = document.getElementById('clearBtn');
        clearBtn.disabled = true;
        clearBtn.classList.toggle('disabled', true);

        this.toggleModeSwitcher(false);

        this.musicModel.playFromDrawing(this.drawingModel);

        // simulating playback end to unlock UI (or you could use Tone.Transport events)
        setTimeout(() => {
            this.isBusy = false;
            clearBtn.disabled = false;
            clearBtn.classList.toggle('disabled', false);
            this.toggleModeSwitcher(true);
        }, 5000);
    }

    // locking Mode Switcher
    toggleModeSwitcher(enable) {
        document.getElementById('modeContainer').classList.toggle('disabled', !enable);
    }

    // pointer logic (only active in Draw mode)
    onPointerDown(e) {
        if (this.currentMode !== 'drawToSound' || !this.drawingActive) return;
        const p = this.getCoords(e);
        this.lastPoint = p;
        this.drawingModel.startStroke(p);
    }

    onPointerMove(e) {
        if (this.currentMode !== 'drawToSound' || !this.drawingActive || !this.drawingModel.isDrawing) return;
        const p = this.getCoords(e);
        this.view.drawStrokeSegment(this.lastPoint, p);
        this.drawingModel.addPoint(p);
        this.lastPoint = p;
    }

    onPointerUp() {
        this.drawingModel.endStroke();
    }

    getCoords(e) {
        const rect = this.view.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.view.canvas.width / rect.width),
            y: (e.clientY - rect.top) * (this.view.canvas.height / rect.height)
        };
    }

    clearAll() {
        this.audioModel.isInitialized = false; // reset mic
        this.musicModel.stop();
        this.drawingModel.clear();
        this.view.clear();
    }
}

new AppController();