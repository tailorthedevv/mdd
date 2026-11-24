(() => {
  'use strict';

  const MD = (window.MD = window.MD || {});

  // =========================================================================
  // 1. CORE ENGINE CONSTANTS & MATH UTILITIES
  // =========================================================================
  MD.PW = 480;
  MD.PH = 270;
  MD.TS = 16;
  MD.DT = 1 / 60;

  const BAYER4 = [
    [ 0,  8,  2, 10],
    [12,  4, 14,  6],
    [ 3, 11,  1,  9],
    [15,  7, 13,  5]
  ];
  MD.BAYER4 = BAYER4;

  class SeededRNG {
    constructor(seed = 3071) {
      this.s = seed >>> 0;
      if (this.s === 0) this.s = 0x6d2b79f5;
    }
    next() {
      let t = (this.s += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    range(min, max) { return min + this.next() * (max - min); }
    int(min, max) { return Math.floor(this.range(min, max + 1)); }
    chance(p) { return this.next() < p; }
    pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  }
  MD.SeededRNG = SeededRNG;

  function hash2D(x, y, seed = 42) {
    let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  MD.hash2D = hash2D;

  const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const approach = (cur, target, maxDelta) => {
    if (cur < target) return Math.min(target, cur + maxDelta);
    if (cur > target) return Math.max(target, cur - maxDelta);
    return target;
  };
  MD.clamp = clamp;
  MD.lerp = lerp;
  MD.approach = approach;

  function hexToRgb(hex) {
    const clean = hex.charAt(0) === '#' ? hex.slice(1) : hex;
    const n = parseInt(clean, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  MD.hexToRgb = hexToRgb;

  function bayerCheck(x, y, threshold) {
    return (BAYER4[y & 3][x & 3] + 0.5) / 16 < threshold;
  }
  MD.bayerCheck = bayerCheck;

  function noise1D(t, seed = 17) {
    const i = Math.floor(t);
    const f = t - i;
    const u = f * f * (3 - 2 * f);
    return lerp(hash2D(i, 0, seed), hash2D(i + 1, 0, seed), u);
  }
  MD.noise1D = noise1D;

  function offscreen(w, h, smooth = false) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = smooth;
    return { c, ctx };
  }
  MD.offscreen = offscreen;

  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }
  MD.rectsOverlap = rectsOverlap;

  // =========================================================================
  // 2. FULL CRISP PIXEL BITMAP FONT (DIALOGUE, SIGNS, TERMINALS & HUD)
  // =========================================================================
  const GLYPHS = {
    'A':['0110','1001','1111','1001','1001'], 'B':['1110','1001','1110','1001','1110'],
    'C':['0111','1000','1000','1000','0111'], 'D':['1110','1001','1001','1001','1110'],
    'E':['1111','1000','1110','1000','1111'], 'F':['1111','1000','1110','1000','1000'],
    'G':['0111','1000','1011','1001','0111'], 'H':['1001','1001','1111','1001','1001'],
    'I':['111','010','010','010','111'],     'J':['0011','0001','0001','1001','0110'],
    'K':['1001','1010','1100','1010','1001'], 'L':['1000','1000','1000','1000','1111'],
    'M':['10001','11011','10101','10001','10001'], 'N':['1001','1101','1011','1001','1001'],
    'O':['0110','1001','1001','1001','0110'], 'P':['1110','1001','1110','1000','1000'],
    'Q':['0110','1001','1001','1011','0111'], 'R':['1110','1001','1110','1010','1001'],
    'S':['0111','1000','0110','0001','1110'], 'T':['11111','00100','00100','00100','00100'],
    'U':['1001','1001','1001','1001','0110'], 'V':['1001','1001','1001','0110','0110'],
    'W':['10001','10001','10101','11011','10001'], 'X':['1001','1001','0110','1001','1001'],
    'Y':['10001','01010','00100','00100','00100'], 'Z':['1111','0010','0100','1000','1111'],
    'a':['0000','0110','0001','0111','0111'], 'b':['1000','1110','1001','1001','1110'],
    'c':['0000','0111','1000','1000','0111'], 'd':['0001','0111','1001','1001','0111'],
    'e':['0000','0110','1111','1000','0111'], 'f':['0011','0100','1110','0100','0100'],
    'g':['0111','1001','0111','0001','1110'], 'h':['1000','1110','1001','1001','1001'],
    'i':['010','000','010','010','010'],      'j':['001','000','001','101','010'],
    'k':['1000','1010','1100','1010','1001'], 'l':['110','010','010','010','011'],
    'm':['00000','11010','10101','10101','10001'], 'n':['0000','1110','1001','1001','1001'],
    'o':['0000','0110','1001','1001','0110'], 'p':['0000','1110','1001','1110','1000'],
    'q':['0000','0111','1001','0111','0001'], 'r':['0000','1011','1100','1000','1000'],
    's':['0000','0111','1100','0011','1110'], 't':['0100','1110','0100','0100','0011'],
    'u':['0000','1001','1001','1001','0111'], 'v':['0000','1001','1001','0110','0110'],
    'w':['00000','10001','10101','10101','01010'], 'x':['0000','1001','0110','0110','1001'],
    'y':['0000','1001','0111','0001','1110'], 'z':['0000','1111','0010','0100','1111'],
    '0':['0110','1011','1101','1001','0110'], '1':['010','110','010','010','111'],
    '2':['1110','0001','0110','1000','1111'], '3':['1110','0001','0110','0001','1110'],
    '4':['1001','1001','1111','0001','0001'], '5':['1111','1000','1110','0001','1110'],
    '6':['0111','1000','1111','1001','0110'], '7':['1111','0001','0010','0100','0100'],
    '8':['0110','1001','0110','1001','0110'], '9':['0110','1001','0111','0001','1110'],
    '-':['000','000','111','000','000'], '_':['000','000','000','000','111'],
    '+':['000','010','111','010','000'], '=':['000','111','000','111','000'],
    '/':['001','001','010','100','100'], ':':['0','1','0','1','0'],
    ';':['0','1','0','1','1'], '.':['0','0','0','0','1'],
    ',':['00','00','00','01','10'], '!':['1','1','1','0','1'],
    '?':['110','001','010','000','010'], "'":['1','1','0','0','0'],
    '"':['101','101','000','000','000'], '(' :['01','10','10','10','01'],
    ')':['10','01','01','01','10'], '[':['11','10','10','10','11'],
    ']':['11','01','01','01','11'], '>':['100','010','001','010','100'],
    '<':['001','010','100','010','001'], '#':['01010','11111','01010','11111','01010'],
    '%':['1001','0010','0100','1001','0000'], '•':['00','00','11','11','00'],
    '→':['00100','00010','11111','00010','00100'], '←':['00100','01000','11111','01000','00100'],
    '↑':['00100','01110','10101','00100','00100'], '↓':['00100','00100','10101','01110','00100'],
    ' ':['000','000','000','000','000']
  };
  MD.GLYPHS = GLYPHS;

  function measureText(text) {
    let w = 0;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const g = GLYPHS[ch] || GLYPHS[ch.toUpperCase()] || GLYPHS[' '];
      w += g[0].length + (i < text.length - 1 ? 1 : 0);
    }
    return w;
  }
  MD.measureText = measureText;

  function drawText(ctx, text, x, y, color = '#eef4ff', shadowColor = '#030408') {
    let cx = Math.floor(x);
    const cy = Math.floor(y);
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const g = GLYPHS[ch] || GLYPHS[ch.toUpperCase()] || GLYPHS[' '];
      const gw = g[0].length;
      if (shadowColor) {
        ctx.fillStyle = shadowColor;
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < gw; c++) {
            if (g[r][c] === '1') ctx.fillRect(cx + c, cy + r + 1, 1, 1);
          }
        }
      }
      ctx.fillStyle = color;
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < gw; c++) {
          if (g[r][c] === '1') ctx.fillRect(cx + c, cy + r, 1, 1);
        }
      }
      cx += gw + 1;
    }
    return cx - Math.floor(x);
  }
  MD.drawText = drawText;

  // Word-wrap helper for dialogue boxes
  function wrapText(text, maxPxWidth) {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (measureText(test) <= maxPxWidth) cur = test;
      else {
        if (cur) lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }
  MD.wrapText = wrapText;

  // =========================================================================
  // 3. CANONICAL ABSOLUTE SOLVER RENDERER (EXACT CANON GEOMETRY)
  // =========================================================================
  // Outer pointy-top hollow hexagon + smaller filled solid inner hexagon
  // + 3 prongs at -90° (top), 30° (bottom-right), 150° (bottom-left).
  // Modes: 'translate' (triangles), 'scale' (double-hexagons), 'rotate' (tilted ellipses + orbit dots)
  function drawSolverSymbol(ctx, cx, cy, rad, color, mode = 'translate', rot = 0, lw = 1.6, glow = false) {
    ctx.save();
    ctx.translate(cx, cy);
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = rad * 0.55;
    }
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lw;
    ctx.lineJoin = 'miter';

    const R = rad * 0.42;
    const r = rad * 0.20;
    const drawHex = (radius, angleOff = 0, fill = false) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = rot + angleOff - Math.PI / 2 + (i * Math.PI) / 3;
        const hx = Math.cos(a) * radius;
        const hy = Math.sin(a) * radius;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      if (fill) ctx.fill();
      else ctx.stroke();
    };

    if (mode === 'rotate') {
      ctx.save();
      ctx.rotate(rot);
      for (const tilt of [-0.66, 0.66]) {
        ctx.save();
        ctx.rotate(tilt);
        ctx.beginPath();
        ctx.ellipse(0, 0, rad * 0.94, rad * 0.34, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
      for (let i = 0; i < 12; i++) {
        const a = -rot * 0.9 + (i * Math.PI) / 6;
        ctx.fillRect(Math.cos(a) * rad * 0.97 - lw * 0.5, Math.sin(a) * rad * 0.97 - lw * 0.5, lw, lw);
      }
    } else {
      const prongs = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6];
      for (const baseA of prongs) {
        const a = rot + baseA;
        const cos = Math.cos(a), sin = Math.sin(a);
        const px = -sin, py = cos;
        const tipDist = rad * 0.96;
        const shaftEnd = rad * 0.72;

        ctx.beginPath();
        ctx.moveTo(cos * R, sin * R);
        ctx.lineTo(cos * shaftEnd, sin * shaftEnd);
        ctx.stroke();

        if (mode === 'scale') {
          ctx.save();
          ctx.translate(cos * (rad * 0.84), sin * (rad * 0.84));
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const ha = a + (i * Math.PI) / 3;
            const hx = Math.cos(ha) * (rad * 0.16);
            const hy = Math.sin(ha) * (rad * 0.16);
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const ha = a + (i * Math.PI) / 3;
            const hx = Math.cos(ha) * (rad * 0.08);
            const hy = Math.sin(ha) * (rad * 0.08);
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.moveTo(cos * tipDist, sin * tipDist);
          ctx.lineTo(cos * shaftEnd + px * (rad * 0.17), sin * shaftEnd + py * (rad * 0.17));
          ctx.lineTo(cos * shaftEnd - px * (rad * 0.17), sin * shaftEnd - py * (rad * 0.17));
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    drawHex(R, 0, false);
    drawHex(r, 0, true);
    ctx.restore();
  }
  MD.drawSolverSymbol = drawSolverSymbol;

  // =========================================================================
  // 4. PROCEDURAL WEB AUDIO SYNTHESIZER (ZONES, COMBAT, VOICES, SOLVER)
  // =========================================================================
  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.droneFilter = null;
      this.droneGain = null;
      this.noiseBuffer = null;
      this.muted = false;
      this.started = false;
      this.sirenTimer = 0;
    }

    unlock() {
      if (this.started) {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.34;
        this.master.connect(this.ctx.destination);

        const len = this.ctx.sampleRate * 1.5;
        this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        src.loop = true;

        this.droneFilter = this.ctx.createBiquadFilter();
        this.droneFilter.type = 'lowpass';
        this.droneFilter.frequency.value = 140;

        this.droneGain = this.ctx.createGain();
        this.droneGain.gain.value = 0.08;

        src.connect(this.droneFilter);
        this.droneFilter.connect(this.droneGain);
        this.droneGain.connect(this.master);
        src.start();

        this.started = true;
      } catch (e) {}
    }

    toggleMute() {
      this.muted = !this.muted;
      if (this.master && this.ctx) {
        this.master.gain.setTargetAtTime(this.muted ? 0 : 0.34, this.ctx.currentTime, 0.05);
      }
    }

    setZoneMood(zone) {
      if (!this.droneFilter || !this.ctx) return;
      const t = this.ctx.currentTime;
      const freq = zone === 'blizzard' || zone === 'spire' ? 420 : (zone === 'breach' ? 190 : 140);
      const gain = zone === 'blizzard' || zone === 'spire' ? 0.12 : 0.07;
      this.droneFilter.frequency.setTargetAtTime(freq, t, 0.4);
      this.droneGain.gain.setTargetAtTime(gain, t, 0.4);
    }

    tone(f0, f1, dur, type = 'sine', vol = 0.09, delay = 0) {
      if (!this.started || this.muted) return;
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, f0), t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(vol, t + Math.min(0.02, dur * 0.25));
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }

    noiseBurst(dur, filterFreq, filterType = 'bandpass', vol = 0.08) {
      if (!this.started || this.muted || !this.noiseBuffer) return;
      const t = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const f = this.ctx.createBiquadFilter();
      f.type = filterType;
      f.frequency.setValueAtTime(filterFreq, t);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.02);
    }

    playStep(metal) { this.tone(metal ? 270 : 120, metal ? 110 : 52, 0.045, metal ? 'triangle' : 'sine', 0.06); }
    playJump() { this.tone(215, 445, 0.11, 'sine', 0.09); }
    playLand(hard) { this.tone(hard ? 140 : 95, 38, 0.09, 'triangle', hard ? 0.14 : 0.08); }
    playPickup() { this.tone(520, 780, 0.09, 'sine', 0.09); this.tone(780, 1170, 0.14, 'sine', 0.09, 0.05); }
    playWrench() { this.tone(360, 140, 0.08, 'triangle', 0.11); this.noiseBurst(0.06, 1800, 'highpass', 0.06); }
    playPenThrow() { this.tone(920, 420, 0.08, 'sine', 0.08); }
    playPenHit() { this.tone(1450, 780, 0.06, 'square', 0.08); this.tone(540, 260, 0.12, 'triangle', 0.09, 0.03); }
    playPlasmaShot() { this.tone(680, 210, 0.12, 'sawtooth', 0.08); }
    playEnemyHit() { this.tone(280, 90, 0.10, 'square', 0.09); this.noiseBurst(0.08, 1200, 'bandpass', 0.07); }
    playPlayerHurt() { this.tone(190, 55, 0.22, 'sawtooth', 0.16); this.noiseBurst(0.18, 900, 'lowpass', 0.12); }
    playDoorSlide() { this.tone(92, 48, 0.72, 'sawtooth', 0.09); this.noiseBurst(0.65, 650, 'bandpass', 0.05); }
    playSirenPing() { this.tone(660, 480, 0.35, 'sawtooth', 0.045); }
    playEmp() { this.tone(110, 35, 0.55, 'sawtooth', 0.15); this.tone(1600, 180, 0.42, 'sine', 0.09); }

    playRailgunFull() {
      this.tone(140, 920, 0.35, 'sawtooth', 0.09);
      this.tone(860, 65, 0.75, 'sawtooth', 0.18, 0.30);
      this.tone(180, 38, 0.85, 'triangle', 0.22, 0.30);
      setTimeout(() => this.noiseBurst(0.55, 950, 'lowpass', 0.16), 300);
    }

    playSolverGlitch() {
      [220, 293.66, 392, 587.33].forEach((f, i) => this.tone(f, f * 1.04, 0.45, 'triangle', 0.07, i * 0.045));
      this.tone(120, 65, 0.38, 'sawtooth', 0.08);
    }

    playVoiceBlip(speaker) {
      const map = {
        UZI: [420, 360, 'square', 0.025],
        N: [540, 680, 'triangle', 0.032],
        V: [640, 480, 'sawtooth', 0.024],
        J: [490, 430, 'square', 0.026],
        KHAN: [240, 210, 'triangle', 0.03],
        THAD: [460, 520, 'sine', 0.03],
        TEACHER: [190, 185, 'sine', 0.022],
        LIZZY: [690, 610, 'sine', 0.022],
        WDF: [310, 290, 'triangle', 0.024],
        SOLVER: [145, 95, 'sawtooth', 0.045],
        LORE: [330, 330, 'sine', 0.018]
      };
      const [f0, f1, type, vol] = map[speaker] || map.LORE;
      this.tone(f0 + (Math.random() - 0.5) * 40, f1, 0.042, type, vol);
    }
  }
  MD.AudioEngine = AudioEngine;
})();
