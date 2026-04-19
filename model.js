class AudioModel {
    constructor() {
        this.audioCtx = null;
        this.analyser = null;
        this.dataArray = null;
        this.isInitialized = false;
    }
    async init() {
        if (this.isInitialized) return;
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = this.audioCtx.createMediaStreamSource(stream);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256; 
        source.connect(this.analyser);
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.isInitialized = true;
    }
    getFrequencyData() {
        if (!this.isInitialized) return null;
        this.analyser.getByteFrequencyData(this.dataArray);
        return this.dataArray;
    }
}

class MusicModel {
    constructor() {
        this.isInitialized = false;
        this.synth = null;
        this.part = null;
    }
    async init() {
        if (this.isInitialized) return;
        await Tone.start();
        Tone.Transport.bpm.value = 110;
        this.synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'sine' },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.6 }
        }).toDestination();
        this.isInitialized = true;
    }
    stop() {
        Tone.Transport.stop();
        Tone.Transport.cancel(0);
        if (this.part) { this.part.dispose(); this.part = null; }
    }
    playFromDrawing(drawing) {
        this.stop();
        const events = drawing.toToneEvents();
        if (events.length === 0) return;
        this.part = new Tone.Part((time, value) => {
            this.synth.triggerAttackRelease(value.note, value.dur, time, value.vel);
        }, events).start(0);
        Tone.Transport.start();
    }
}

class DrawingModel {
    constructor() {
        this.strokes = [];
        this.isDrawing = false;
        this.activeStroke = null;
        this.t0 = null;
    }
    startStroke(point) {
        const now = performance.now();
        if (this.t0 === null) this.t0 = now;
        this.isDrawing = true;
        this.activeStroke = { points: [{ ...point, t: now - this.t0 }] };
        this.strokes.push(this.activeStroke);
    }
    addPoint(point) {
        if (!this.isDrawing || !this.activeStroke) return;
        this.activeStroke.points.push({ ...point, t: performance.now() - this.t0 });
    }
    endStroke() { this.isDrawing = false; this.activeStroke = null; }
    clear() { this.strokes = []; this.t0 = null; }
    toToneEvents() {
        const points = this.strokes.flatMap(s => s.points);
        if (points.length < 2) return [];
        const durationSec = 5;
        const scale = ['C4','D4','E4','G4','A4','C5','D5','E5','G5','A5'];
        const canvas = document.getElementById('artCanvas');
        return points.filter((_, i) => i % 6 === 0).map(p => {
            const timeSec = (p.x / canvas.width) * durationSec;
            const idx = Math.max(0, Math.min(scale.length - 1, Math.floor((1 - (p.y / canvas.height)) * (scale.length - 1))));
            return [timeSec, { note: scale[idx], dur: 0.12, vel: 0.5 }];
        }).sort((a, b) => a[0] - b[0]);
    }
}
export {DrawingModel, MusicModel, AudioModel}