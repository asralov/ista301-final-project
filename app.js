/**
 * file: app.js
 * author: Abrorjon Asralov
 */


import {Painter} from './painter.js';

class AudioModel {
    constructor() {
        this.audioCtx = null;
        this.analyser = null;
        this.dataArray = null;
        this.isInitialized = false;
    }

    async init() {
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

    clear() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.painter.resetPositions();
    }
}

class AppController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.isActive = false;

        document.getElementById('startBtn').addEventListener('click', () => this.toggleAudio());
        document.getElementById('clearBtn').addEventListener('click', () => this.view.clear());
    }

    async toggleAudio() {
        if (!this.model.isInitialized) await this.model.init();
        
        this.isActive = !this.isActive;
        const btn = document.getElementById('startBtn');
        btn.innerText = this.isActive ? "STOP & VIEW ART" : "PRESS AND MAKE NOISES";
        btn.style.background = this.isActive ? "#e74c3c" : "#2d3436";

        if (this.isActive) this.renderLoop();
    }

    renderLoop() {
        if (!this.isActive) return;
        const data = this.model.getFrequencyData();
        this.view.update(data);
        requestAnimationFrame(() => this.renderLoop());
    }
}

const app = new AppController(new AudioModel(), new ArtView('artCanvas'));