/**
 * file: app.js
 * author: Abrorjon Asralov
 */


import {Painter} from './painter.js';

class MusicModel {
    constructor() {
        this.isInitialized = false;
        this.synth = null;
        this.part = null;
    }

    async init() {
        // Tone.js must be started from a user gesture.
        // Tone is loaded globally via index.html.
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
        if (this.part) {
            this.part.dispose();
            this.part = null;
        }
    }

    playFromDrawing(drawing) {
        if (!this.isInitialized) throw new Error('MusicModel not initialized');

        this.stop();

        const events = drawing.toToneEvents();
        if (events.length === 0) return;

        this.part = new Tone.Part((time, value) => {
            // value: { note, dur, vel }
            this.synth.triggerAttackRelease(value.note, value.dur, time, value.vel);
        }, events).start(0);

        this.part.loop = false;
        Tone.Transport.start();
    }
}

class DrawingModel {
    constructor() {
        this.strokes = []; // [{ points: [{x,y,t}], color, width }]
        this.isDrawing = false;
        this.activeStroke = null;
        this.t0 = null;
    }

    startStroke(point, style) {
        const now = performance.now();
        if (this.t0 === null) this.t0 = now;
        this.isDrawing = true;
        this.activeStroke = {
            points: [{ ...point, t: now - this.t0 }],
            color: style?.color ?? '#111111',
            width: style?.width ?? 3
        };
        this.strokes.push(this.activeStroke);
    }

    addPoint(point) {
        if (!this.isDrawing || !this.activeStroke) return;
        const now = performance.now();
        this.activeStroke.points.push({ ...point, t: now - this.t0 });
    }

    endStroke() {
        this.isDrawing = false;
        this.activeStroke = null;
    }

    clear() {
        this.strokes = [];
        this.isDrawing = false;
        this.activeStroke = null;
        this.t0 = null;
    }

    toToneEvents() {
        // Map drawing to a monophonic-ish melody:
        // x => time, y => pitch, speed => velocity.
        const points = this.strokes.flatMap(s => s.points);
        if (points.length < 2) return [];

        const tMax = Math.max(...points.map(p => p.t));
        const durationSec = Math.max(1.5, Math.min(10, tMax / 1000));

        const canvas = document.getElementById('artCanvas');
        const w = canvas.width;
        const h = canvas.height;

        const scale = ['C4','D4','E4','G4','A4','C5','D5','E5','G5','A5'];

        // Sample N notes across the drawing.
        const N = Math.min(64, Math.max(8, Math.floor(points.length / 6)));
        const sampled = [];
        for (let i = 0; i < N; i++) {
            const idx = Math.floor((i / (N - 1)) * (points.length - 1));
            sampled.push(points[idx]);
        }

        const events = [];
        for (let i = 0; i < sampled.length; i++) {
            const p = sampled[i];
            const prev = sampled[Math.max(0, i - 1)];
            const dx = p.x - prev.x;
            const dy = p.y - prev.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            const timeSec = (p.x / w) * durationSec;
            const scaleIdx = Math.max(0, Math.min(scale.length - 1, Math.floor((1 - (p.y / h)) * (scale.length - 1))));
            const note = scale[scaleIdx];
            const vel = Math.max(0.1, Math.min(0.9, dist / 30));
            const dur = 0.12;

            events.push([timeSec, { note, dur, vel }]);
        }

        // Ensure time-sorted.
        events.sort((a, b) => a[0] - b[0]);
        return events;
    }
}

class ArtView {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.painter = new Painter(this.canvas.width, this.canvas.height);
        
        // background setup
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    update(data) {
        this.painter.drawStep(this.ctx, data);
    }

    drawStrokeSegment(p0, p1, style) {
        this.ctx.save();
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = style?.color ?? '#111111';
        this.ctx.lineWidth = style?.width ?? 3;
        this.ctx.beginPath();
        this.ctx.moveTo(p0.x, p0.y);
        this.ctx.lineTo(p1.x, p1.y);
        this.ctx.stroke();
        this.ctx.restore();
    }

    clear() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.painter.resetPositions();
    }
}

class AppController {
    constructor(music, drawing, view) {
        this.music = music;
        this.drawing = drawing;
        this.view = view;

        this.isDrawMode = false;
        this.pointerIsDown = false;
        this.lastPoint = null;
        this.drawStyle = { color: '#111111', width: 3 };

        document.getElementById('drawBtn').addEventListener('click', () => this.toggleDrawMode());
        document.getElementById('playBtn').addEventListener('click', () => this.playDrawing());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());

        this.view.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        window.addEventListener('pointerup', () => this.onPointerUp());
        this.view.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
    }

    toggleDrawMode() {
        this.isDrawMode = !this.isDrawMode;
        const btn = document.getElementById('drawBtn');
        btn.innerText = this.isDrawMode ? 'DRAW: ON' : 'DRAW: OFF';
        btn.style.background = this.isDrawMode ? '#00b894' : '#0984e3';
    }

    async playDrawing() {
        if (!this.music.isInitialized) await this.music.init();
        this.music.playFromDrawing(this.drawing);
    }

    clearAll() {
        this.music.stop();
        this.drawing.clear();
        this.view.clear();
    }

    canvasPointFromEvent(e) {
        const rect = this.view.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.view.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.view.canvas.height / rect.height);
        return { x, y };
    }

    onPointerDown(e) {
        if (!this.isDrawMode) return;
        this.pointerIsDown = true;
        this.view.canvas.setPointerCapture?.(e.pointerId);
        const p = this.canvasPointFromEvent(e);
        this.lastPoint = p;
        this.drawing.startStroke(p, this.drawStyle);
    }

    onPointerMove(e) {
        if (!this.isDrawMode || !this.pointerIsDown) return;
        const p = this.canvasPointFromEvent(e);
        if (!this.lastPoint) this.lastPoint = p;

        // draw + record
        this.view.drawStrokeSegment(this.lastPoint, p, this.drawStyle);
        this.drawing.addPoint(p);
        this.lastPoint = p;
    }

    onPointerUp() {
        if (!this.pointerIsDown) return;
        this.pointerIsDown = false;
        this.lastPoint = null;
        this.drawing.endStroke();
    }
}

const app = new AppController(new MusicModel(), new DrawingModel(), new ArtView('artCanvas'));
