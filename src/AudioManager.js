export class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isMuted = false;
        this.isInitialized = false;

        // Music state
        this.musicInterval = null;
        this.musicStep = 0;
    }

    init() {
        if (this.isInitialized) return;

        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.isInitialized = true;

        console.log('Audio Context Initialized');
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime, 0.1);
        }
        return this.isMuted;
    }

    playJump() {
        if (!this.isInitialized || this.isMuted) return;
        this._playNote(440, 'square', 0.1, 0.2); // Simple upward sweep feel if we add ramp
    }

    playCrash() {
        if (!this.isInitialized || this.isMuted) return;
        this._playNoise(0.5);
    }

    startMusic() {
        if (!this.isInitialized || this.musicInterval) return;

        const tempo = 120;
        const stepTime = 60 / tempo / 2; // 8th notes

        const scale = [130.81, 146.83, 164.81, 196.00]; // C3, D3, E3, G3

        this.musicInterval = setInterval(() => {
            if (this.isMuted) return;

            // Kick/Pulse every beat
            if (this.musicStep % 2 === 0) {
                this._playNote(65.41, 'sine', 0.1, 0.4);
            }

            // Bassline
            const note = scale[Math.floor(Math.random() * scale.length)];
            this._playNote(note, 'triangle', 0.05, 0.15);

            this.musicStep = (this.musicStep + 1) % 16;
        }, stepTime * 1000);
    }

    _playNote(freq, type, duration, volume) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(volume * 0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    _playNoise(duration) {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        noise.connect(gain);
        gain.connect(this.masterGain);

        noise.start();
        noise.stop(this.ctx.currentTime + duration);
    }
}
