// Small procedural soundscape. No audio assets, no network.

export class Sound {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.ambient = null;
    this.enabled = true;
    this.started = false;
    this.noiseBuffer = null;
    this.bellTimer = null;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    try {
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.enabled ? 0.32 : 0;
      this.master.connect(this.ctx.destination);
      this.makeNoise();
      this.buildAmbient();
      this.started = true;
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      this.bellTimer = setInterval(() => {
        if (this.enabled && document.visibilityState === 'visible') this.distantBell();
      }, 19000);
    } catch {
      this.ctx = null;
    }
  }

  setEnabled(on) {
    this.enabled = !!on;
    if (!this.ctx) {
      if (on) this.init();
      return;
    }
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(on ? 0.32 : 0, this.ctx.currentTime + 0.35);
  }

  makeNoise() {
    const len = Math.floor(this.ctx.sampleRate * 3);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    this.noiseBuffer = buf;
  }

  buildAmbient() {
    const ctx = this.ctx;
    const bus = ctx.createGain();
    bus.gain.value = 0.0001;
    bus.connect(this.master);
    bus.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 3.5);

    const drones = [
      { f: 55, g: 0.028, d: 0.001 },
      { f: 82.41, g: 0.014, d: 0.004 },
      { f: 110, g: 0.009, d: 0.002 },
    ];
    const oscs = [];
    for (const d of drones) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = d.f;
      o.detune.value = Math.random() * 6 - 3;
      g.gain.value = d.g;
      o.connect(g).connect(bus);
      o.start();
      oscs.push(o);
    }

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.055;
    lfoGain.gain.value = 4;
    lfo.connect(lfoGain);
    lfoGain.connect(oscs[0].frequency);
    lfo.start();

    if (this.noiseBuffer) {
      const n = ctx.createBufferSource();
      n.buffer = this.noiseBuffer;
      n.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 240;
      f.Q.value = 0.7;
      const g = ctx.createGain();
      g.gain.value = 0.022;
      n.connect(f).connect(g).connect(bus);
      n.start();
    }

    this.ambient = bus;
  }

  tone({ freq = 220, dur = 0.15, type = 'sine', gain = 0.08, slide = null, delay = 0, filter = null }) {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (filter) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filter;
      o.connect(f).connect(g).connect(this.master);
    } else {
      o.connect(g).connect(this.master);
    }
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  burst({ dur = 0.25, gain = 0.11, freq = 700, q = 0.9, type = 'lowpass', delay = 0, slide = null }) {
    if (!this.ctx || !this.enabled || !this.noiseBuffer) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const n = ctx.createBufferSource();
    n.buffer = this.noiseBuffer;
    n.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (slide) f.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(f).connect(g).connect(this.master);
    n.start(t);
    n.stop(t + dur + 0.02);
  }

  sfx(name) {
    if (!this.ctx) {
      if (this.enabled) this.init();
      if (!this.ctx) return;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    switch (name) {
      case 'ui':
        this.tone({ freq: 310, dur: 0.06, type: 'triangle', gain: 0.035, slide: 260 });
        break;
      case 'select':
        this.tone({ freq: 440, dur: 0.09, type: 'sine', gain: 0.045 });
        this.tone({ freq: 660, dur: 0.12, type: 'sine', gain: 0.022, delay: 0.03 });
        break;
      case 'target':
        this.tone({ freq: 520, dur: 0.07, type: 'triangle', gain: 0.025, slide: 620 });
        break;
      case 'hit':
        this.burst({ dur: 0.19, gain: 0.16, freq: 1100, slide: 180 });
        this.tone({ freq: 92, dur: 0.22, type: 'sine', gain: 0.11, slide: 52 });
        break;
      case 'crit':
        this.burst({ dur: 0.28, gain: 0.2, freq: 1800, slide: 280 });
        this.tone({ freq: 130, dur: 0.35, type: 'triangle', gain: 0.13, slide: 58 });
        this.tone({ freq: 880, dur: 0.22, type: 'sine', gain: 0.04, delay: 0.02 });
        break;
      case 'heal':
        this.tone({ freq: 392, dur: 0.32, type: 'sine', gain: 0.055 });
        this.tone({ freq: 523.25, dur: 0.42, type: 'sine', gain: 0.045, delay: 0.08 });
        this.tone({ freq: 659.25, dur: 0.6, type: 'sine', gain: 0.03, delay: 0.17 });
        break;
      case 'stress':
        this.tone({ freq: 196, dur: 0.45, type: 'sawtooth', gain: 0.025, slide: 174, filter: 700 });
        this.tone({ freq: 207.65, dur: 0.45, type: 'sawtooth', gain: 0.018, slide: 180, filter: 700 });
        break;
      case 'mark':
        this.tone({ freq: 740, dur: 0.28, type: 'sine', gain: 0.03, slide: 990 });
        this.tone({ freq: 990, dur: 0.4, type: 'sine', gain: 0.018, delay: 0.09 });
        break;
      case 'block':
        this.tone({ freq: 185, dur: 0.18, type: 'square', gain: 0.03, slide: 150, filter: 900 });
        break;
      case 'enemy':
        this.burst({ dur: 0.2, gain: 0.08, freq: 440, slide: 140 });
        break;
      case 'death':
        this.tone({ freq: 73, dur: 0.8, type: 'sine', gain: 0.16, slide: 42 });
        this.burst({ dur: 0.6, gain: 0.07, freq: 500, slide: 70 });
        break;
      case 'break':
        this.tone({ freq: 233, dur: 0.6, type: 'sawtooth', gain: 0.035, slide: 110, filter: 1200 });
        this.burst({ dur: 0.3, gain: 0.08, freq: 1600, slide: 280 });
        break;
      case 'learn':
        this.tone({ freq: 146.83, dur: 1.2, type: 'sine', gain: 0.07, slide: 138 });
        this.tone({ freq: 155.56, dur: 1.2, type: 'sine', gain: 0.05, slide: 146 });
        this.burst({ dur: 1.4, gain: 0.035, freq: 300, slide: 80 });
        break;
      case 'lantern':
        this.tone({ freq: 880, dur: 0.6, type: 'sine', gain: 0.025, slide: 1320 });
        this.tone({ freq: 1320, dur: 0.9, type: 'sine', gain: 0.014, delay: 0.08 });
        break;
      case 'step':
        this.burst({ dur: 0.25, gain: 0.06, freq: 220, slide: 100 });
        this.tone({ freq: 65, dur: 0.3, type: 'sine', gain: 0.07, slide: 48 });
        break;
      case 'victory':
        [261.63, 392, 523.25, 783.99].forEach((f, i) => {
          this.tone({ freq: f, dur: 1.5 - i * 0.18, type: 'sine', gain: 0.045 - i * 0.006, delay: i * 0.16 });
        });
        this.burst({ dur: 1.8, gain: 0.03, freq: 900, slide: 220 });
        break;
      case 'loss':
        [130.81, 123.47, 116.54, 110].forEach((f, i) => {
          this.tone({ freq: f, dur: 1.2, type: 'sine', gain: 0.065, delay: i * 0.22, slide: f * 0.94 });
        });
        break;
      default:
        break;
    }
  }

  distantBell() {
    if (!this.ctx || !this.enabled) return;
    this.tone({ freq: 196, dur: 3.4, type: 'sine', gain: 0.012, slide: 193 });
    this.tone({ freq: 392.7, dur: 2.8, type: 'sine', gain: 0.007, delay: 0.04 });
    this.tone({ freq: 587.3, dur: 2.2, type: 'sine', gain: 0.004, delay: 0.1 });
  }
}
