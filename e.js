(() => {
  'use strict';

  const MD = (window.MD = window.MD || {});
  const { PW, PH, TS, BIOME_PALETTES, hash2D, clamp, lerp } = MD;

  // =========================================================================
  // 1. VERLET PHYSICS SYSTEM (CABLES, CHAINS, SPARKING WIRES, BANNERS)
  // =========================================================================
  class VerletSystem {
    constructor() {
      this.chains = [];
    }
    clear() {
      this.chains = [];
    }
    addChain(x, anchorY, links, segLen = 5, broken = false) {
      const nodes = Array.from({ length: links + 1 }, (_, i) => ({
        x, y: anchorY + i * segLen, ox: x, oy: anchorY + i * segLen, pin: i === 0
      }));
      this.chains.push({
        type: broken ? 'broken' : 'chain',
        anchorX: x, anchorY, nodes, len: segLen, broken,
        spark: 0.8 + Math.random() * 2.2, phase: Math.random() * 6.28
      });
    }
    addCable(x0, y0, x1, y1, slack = 1.15, segs = 14) {
      const total = Math.hypot(x1 - x0, y1 - y0) * slack;
      const len = total / segs;
      const nodes = [];
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const nx = lerp(x0, x1, t);
        const ny = lerp(y0, y1, t) + Math.sin(t * Math.PI) * (total * 0.13);
        nodes.push({ x: nx, y: ny, ox: nx, oy: ny, pin: i === 0 || i === segs });
      }
      this.chains.push({
        type: 'cable', x0, y0, x1, y1, nodes, len, broken: false, phase: Math.random() * 6.28
      });
    }

    update(dt, time, player, windForce = 0) {
      const damp = 0.984, grav = 430 * dt * dt;
      const px = player.x + player.w * 0.5, py = player.y + player.h * 0.5;

      for (const ch of this.chains) {
        const nodes = ch.nodes;
        const wind = (Math.sin(time * 1.5 + ch.phase) * 20 + windForce) * dt * dt;
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          if (n.pin) continue;
          const vx = (n.x - n.ox) * damp, vy = (n.y - n.oy) * damp;
          n.ox = n.x; n.oy = n.y;
          n.x += vx + wind * (0.4 + 0.6 * (i / nodes.length));
          n.y += vy + grav;
          const dx = n.x - px, dy = n.y - py, d = Math.hypot(dx, dy);
          if (d < 14 && d > 0.1) {
            n.x += (dx / d) * 1.25 + player.vx * dt * 0.22;
            n.y += (dy / d) * 0.65;
          }
        }
        for (let it = 0; it < 6; it++) {
          for (let i = 0; i < nodes.length - 1; i++) {
            const a = nodes[i], b = nodes[i + 1];
            const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001, diff = (ch.len - d) / d;
            if (!a.pin && !b.pin) {
              a.x -= dx * diff * 0.5; a.y -= dy * diff * 0.5;
              b.x += dx * diff * 0.5; b.y += dy * diff * 0.5;
            } else if (a.pin && !b.pin) {
              b.x += dx * diff; b.y += dy * diff;
            } else if (!a.pin && b.pin) {
              a.x -= dx * diff; a.y -= dy * diff;
            }
          }
        }
      }
    }

    render(ctx, camX, camY) {
      for (const ch of this.chains) {
        const nodes = ch.nodes;
        if (ch.type === 'cable') {
          for (const [ax, ay] of [[ch.x0, ch.y0], [ch.x1, ch.y1]]) {
            ctx.fillStyle = '#090d14'; ctx.fillRect(Math.round(ax - camX - 3), Math.round(ay - camY - 3), 6, 6);
            ctx.fillStyle = '#4c6482'; ctx.fillRect(Math.round(ax - camX - 2), Math.round(ay - camY - 2), 4, 4);
          }
          for (let i = 0; i < nodes.length - 1; i++) {
            this.line(ctx, Math.round(nodes[i].x - camX), Math.round(nodes[i].y - camY), Math.round(nodes[i + 1].x - camX), Math.round(nodes[i + 1].y - camY), '#090d14', 2);
            this.line(ctx, Math.round(nodes[i].x - camX), Math.round(nodes[i].y - camY) - 1, Math.round(nodes[i + 1].x - camX), Math.round(nodes[i + 1].y - camY) - 1, '#314461', 1);
          }
        } else if (ch.type === 'broken') {
          ctx.fillStyle = '#384c66'; ctx.fillRect(Math.round(ch.anchorX - camX - 3), Math.round(ch.anchorY - camY - 1), 6, 3);
          for (let i = 0; i < nodes.length - 1; i++) {
            this.line(ctx, Math.round(nodes[i].x - camX), Math.round(nodes[i].y - camY), Math.round(nodes[i + 1].x - camX), Math.round(nodes[i + 1].y - camY), '#243245', 2);
          }
          const end = nodes[nodes.length - 1];
          ctx.fillStyle = ch.spark < 0.14 ? '#ffffff' : '#ffe135';
          ctx.fillRect(Math.round(end.x - camX) - 1, Math.round(end.y - camY), 2, 2);
        } else {
          ctx.fillStyle = '#384c66'; ctx.fillRect(Math.round(ch.anchorX - camX - 3), Math.round(ch.anchorY - camY - 1), 6, 3);
          for (let i = 0; i < nodes.length - 1; i++) {
            const mx = Math.round((nodes[i].x + nodes[i + 1].x) * 0.5 - camX);
            const my = Math.round((nodes[i].y + nodes[i + 1].y) * 0.5 - camY);
            ctx.fillStyle = i % 2 === 0 ? '#182230' : '#536c8a';
            ctx.fillRect(mx - 1, my - 2, 2, 4);
          }
        }
      }
    }

    line(ctx, x0, y0, x1, y1, col, th = 1) {
      ctx.fillStyle = col;
      const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx - dy;
      while (true) {
        ctx.fillRect(x0, y0, th, th);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
      }
    }
  }
  MD.VerletSystem = VerletSystem;

  // =========================================================================
  // 2. ATMOSPHERIC PARTICLE SYSTEM (BLIZZARD SNOW, ACID BUBBLES, SPARKS)
  // =========================================================================
  class ParticleSystem {
    constructor(ww, wh, pal) {
      this.motes = [];
      this.particles = [];
      this.waves = [];
      this.bubbles = [];
      this.reset(ww, wh, pal);
    }

    reset(ww, wh, pal) {
      this.ww = ww; this.wh = wh; this.pal = pal;
      this.motes = []; this.particles = []; this.waves = []; this.bubbles = [];
      for (let i = 0; i < 160; i++) {
        this.motes.push({
          x: Math.random() * ww, y: Math.random() * wh,
          vx: -28 - Math.random() * 35, vy: 12 + Math.random() * 26,
          s: Math.random() < 0.25 ? 2 : 1,
          p: Math.random() * 6.28,
          c: pal.motes[i % pal.motes.length]
        });
      }
    }

    spawn(x, y, vx, vy, life, c, grav = 0, s = 1) {
      this.particles.push({ x, y, vx, vy, life, max: life, c, grav, s });
    }

    burst(x, y, col, count = 14, spd = 75) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2, v = 15 + Math.random() * spd;
        this.spawn(x, y, Math.cos(a) * v, Math.sin(a) * v - 14, 0.35 + Math.random() * 0.35, i % 3 === 0 ? '#ffffff' : col, 110, i % 4 === 0 ? 2 : 1);
      }
    }

    wave(x, y, maxR = 45, col = '#c24dff') {
      this.waves.push({ x, y, r: 3, maxR, life: 0.48, max: 0.48, col });
    }

    update(dt, time, level, camX) {
      const isExt = level.biome === 'blizzard' || level.biome === 'spire';
      for (const m of this.motes) {
        m.x += (isExt ? m.vx : Math.sin(time + m.p) * 6) * dt;
        m.y += (isExt ? m.vy : -4 - Math.cos(time + m.p) * 2) * dt;
        if (m.x < 0) m.x += this.ww; if (m.x >= this.ww) m.x -= this.ww;
        if (m.y < 0) m.y += this.wh; if (m.y >= this.wh) m.y -= this.wh;
      }

      if (level.verlet) {
        for (const ch of level.verlet.chains) {
          if (!ch.broken) continue;
          ch.spark -= dt;
          if (ch.spark <= 0) {
            ch.spark = 1.3 + Math.random() * 2.5;
            const end = ch.nodes[ch.nodes.length - 1];
            this.burst(end.x, end.y, '#ffe135', 6, 55);
            if (Math.abs(end.x - (camX + PW * 0.5)) < 260 && level.audio) level.audio.tone(1300, 320, 0.06, 'sawtooth', 0.03);
          }
        }
      }

      for (const pd of level.puddles) {
        if (pd.acid && Math.random() < dt * 8) {
          this.bubbles.push({ x: pd.x + 4 + Math.random() * (pd.w - 8), y: pd.y + pd.h - 2, ty: pd.y, vy: -7 - Math.random() * 6 });
        }
      }
      for (let i = this.bubbles.length - 1; i >= 0; i--) {
        const b = this.bubbles[i]; b.y += b.vy * dt;
        if (b.y <= b.ty) {
          this.spawn(b.x, b.ty, (Math.random() - 0.5) * 18, -18, 0.25, '#ffe135', 60, 1);
          this.bubbles.splice(i, 1);
        }
      }

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i]; p.life -= dt;
        if (p.life <= 0) { this.particles.splice(i, 1); continue; }
        p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      }
      for (let i = this.waves.length - 1; i >= 0; i--) {
        const w = this.waves[i]; w.life -= dt;
        if (w.life <= 0) { this.waves.splice(i, 1); continue; }
        w.r = lerp(3, w.maxR, 1 - w.life / w.max);
      }
    }

    render(ctx, ix, iy, isExterior) {
      for (const m of this.motes) {
        const sx = Math.round(m.x - ix), sy = Math.round(m.y - iy);
        if (sx < -2 || sx > PW + 2 || sy < -2 || sy > PH + 2) continue;
        ctx.globalAlpha = isExterior ? 0.65 : 0.42;
        ctx.fillStyle = isExterior ? '#e6f3ff' : m.c;
        ctx.fillRect(sx, sy, m.s, m.s);
      }
      ctx.globalAlpha = 1;
      for (const b of this.bubbles) {
        ctx.fillStyle = '#fff5bd';
        ctx.fillRect(Math.round(b.x - ix), Math.round(b.y - iy), 2, 2);
      }
      for (const p of this.particles) {
        ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
        ctx.fillStyle = p.c;
        ctx.fillRect(Math.round(p.x - ix), Math.round(p.y - iy), p.s, p.s);
      }
      ctx.globalAlpha = 1;
      for (const w of this.waves) {
        ctx.globalAlpha = clamp(w.life / w.max, 0, 1);
        ctx.strokeStyle = w.col;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(Math.round(w.x - ix), Math.round(w.y - iy), Math.round(w.r), 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }
  MD.ParticleSystem = ParticleSystem;

  // =========================================================================
  // 3. LEVEL MANAGER (5 HORIZONTAL PILOT ACTS — ~9,000 PX JOURNEY)
  // =========================================================================
  class LevelManager {
    constructor(assets, verlet, particles, audio) {
      this.assets = assets;
      this.verlet = verlet;
      this.particles = particles;
      this.audio = audio;

      this.act = 0;
      this.biome = 'bunker';
      this.pal = MD.BIOME_PALETTES.bunker;
      this.cols = 118;
      this.rows = 26;
      this.ww = this.cols * TS;
      this.wh = this.rows * TS;

      this.grid = [];
      this.masks = [];
      this.doors = [];
      this.switches = [];
      this.gondolas = [];
      this.lifts = [];
      this.lamps = [];
      this.signs = [];
      this.crates = [];
      this.canisters = [];
      this.terminals = [];
      this.cells = [];
      this.pickups = [];
      this.puddles = [];
      this.hazards = [];
      this.triggers = [];
      this.enemies = [];
      this.landmarks = [];
      this.exitZone = null;
      this.spawn = { x: 8 * TS, y: 22 * TS };
    }

    initGrid(cols, rows, hasRoof = true) {
      this.cols = cols; this.rows = rows;
      this.ww = cols * TS; this.wh = rows * TS;
      this.grid = Array.from({ length: rows }, (_, r) => {
        const arr = Array(cols).fill('.');
        for (let c = 0; c < cols; c++) {
          if (c <= 1 || c >= cols - 2 || r >= rows - 2) arr[c] = '#';
          else if (hasRoof && r <= 1) arr[c] = '#';
        }
        return arr;
      });
    }

    span(r, c0, c1, ch = '#') {
      for (let c = c0; c <= c1; c++) if (this.grid[r] && c >= 0 && c < this.cols) this.grid[r][c] = ch;
    }

    computeMasks() {
      const solidG = (c, r) => c < 0 || c >= this.cols || r < 0 || r >= this.rows || this.grid[r][c] === '#';
      this.masks = Array.from({ length: this.rows }, (_, r) =>
        Array.from({ length: this.cols }, (__, c) =>
          this.grid[r][c] === '#'
            ? ((solidG(c, r - 1) ? 1 : 0) | (solidG(c + 1, r) ? 2 : 0) | (solidG(c, r + 1) ? 4 : 0) | (solidG(c - 1, r) ? 8 : 0))
            : 0
        )
      );
    }

    isSolid(c, r) {
      if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return true;
      if (this.grid[r][c] === '#') return true;
      const wx = c * TS + 8, wy = r * TS + 8;
      for (const d of this.doors) {
        if (d.prog < 0.72 && wx >= d.x && wx < d.x + 18 && wy >= d.y && wy < d.y + 52) return true;
      }
      return false;
    }

    isTruss(c, r) {
      return c >= 0 && c < this.cols && r >= 0 && r < this.rows && this.grid[r][c] === 'T';
    }

    findUp(wx, wy) {
      const c = clamp(Math.floor(wx / TS), 0, this.cols - 1);
      let r = clamp(Math.floor(wy / TS), 0, this.rows - 1);
      while (r > 0) { if (this.grid[r][c] === '#') return (r + 1) * TS; r--; }
      return TS;
    }

    findDown(wx, wy) {
      const c = clamp(Math.floor(wx / TS), 0, this.cols - 1);
      let r = clamp(Math.floor(wy / TS), 0, this.rows - 1);
      while (r < this.rows - 1) { if (this.grid[r][c] === '#') return r * TS; r++; }
      return (this.rows - 1) * TS;
    }

    openDoor(id) {
      const d = this.doors.find(x => x.id === id);
      if (d) d.open = true;
    }

    closeDoor(id) {
      const d = this.doors.find(x => x.id === id);
      if (d) { d.open = false; d.prog = 0; }
    }

    getPlatforms() {
      return [...this.gondolas, ...this.lifts];
    }

    updateMachinery(dt, time, player) {
      const px = player.x + 6, py = player.y + 18;
      for (const sw of this.switches) {
        if (!sw.pressed && Math.abs(px - (sw.x + 8)) < 12 && Math.abs(py - (sw.y + 10)) < 6) {
          sw.pressed = true;
          this.openDoor(sw.doorId);
          this.audio.playDoorSlide();
        }
      }
      for (const d of this.doors) {
        if (d.open && d.prog < 1) d.prog = Math.min(1, d.prog + dt * 1.15);
      }
      for (const g of this.gondolas) {
        g.px = g.x; g.py = g.y;
        g.t += dt * g.speed;
        g.x = lerp(g.x0, g.x1, 0.5 - 0.5 * Math.cos(g.t * Math.PI));
        g.dx = g.x - g.px; g.dy = 0;
      }
      for (const l of this.lifts) {
        l.px = l.x; l.py = l.y;
        l.t += dt * l.speed;
        l.y = lerp(l.botY, l.topY, 0.5 - 0.5 * Math.cos(l.t * Math.PI));
        l.dx = 0; l.dy = l.y - l.py;
      }
      for (const lp of this.lamps) {
        const tgt = Math.sin(time * 1.7 + lp.x) * 0.05;
        lp.vel = (lp.vel + (tgt - lp.ang) * 24 * dt) * 0.96;
        lp.ang += lp.vel * dt;
      }
    }

    loadAct(actIdx) {
      this.act = clamp(actIdx, 0, 4);
      const biomes = ['bunker', 'blizzard', 'blizzard', 'breach', 'evac'];
      this.biome = biomes[this.act];
      this.pal = BIOME_PALETTES[this.biome];

      this.verlet.clear();
      this.doors = []; this.switches = []; this.gondolas = []; this.lifts = [];
      this.lamps = []; this.signs = []; this.crates = []; this.canisters = [];
      this.terminals = []; this.cells = []; this.pickups = []; this.puddles = [];
      this.hazards = []; this.triggers = []; this.enemies = []; this.landmarks = [];
      this.exitZone = null;

      if (this.act === 0) this.buildAct1();
      else if (this.act === 1) this.buildAct2();
      else if (this.act === 2) this.buildAct3();
      else if (this.act === 3) this.buildAct4();
      else this.buildAct5();

      this.computeMasks();
      this.particles.reset(this.ww, this.wh, this.pal);
      this.audio.setZoneMood(this.act === 1 || this.act === 2 ? 'blizzard' : (this.act === 3 ? 'breach' : 'bunker'));
    }

    // -----------------------------------------------------------------------
    // ACT 1: OUTPOST 3 SCHOOL, NURSE'S OFFICE, WORKSHOP & DOORS 03 -> 01
    // -----------------------------------------------------------------------
    buildAct1() {
      this.initGrid(118, 26, true);
      // Bulkhead divider walls with open doorways below row 20
      for (let r = 2; r <= 20; r++) {
        this.grid[r][27] = '#'; // Classroom -> Nurse wall
        this.grid[r][49] = '#'; // Nurse -> Workshop corridor
        this.grid[r][75] = '#'; // Door 03 bulkhead
        this.grid[r][86] = '#'; // Door 02 bulkhead
        this.grid[r][104] = '#'; // Door 01 outer colony blast wall!
      }

      // Workshop & Door Corridor Platforms (<= 3 tiles vertical everywhere)
      this.span(21, 53, 58, '#');
      this.span(18, 60, 65, 'T');
      this.span(15, 67, 74, '#');
      this.span(12, 52, 58, 'T');
      // Coolant pit + Horizontal Gondola before Door 03
      this.span(24, 60, 69, 'W');
      this.span(25, 60, 69, '#');
      this.span(21, 63, 66, 'T');

      this.spawn = { x: 8 * TS, y: 22 * TS };

      // Landmarks: Classroom Projector, Nurse Bed, Gin Rummy Table
      this.landmarks.push({ type: 'projector', x: 18 * TS, y: 24 * TS - 26 });
      this.landmarks.push({ type: 'nurseBed', x: 39 * TS, y: 24 * TS - 18 });
      this.landmarks.push({ type: 'cardTable', x: 91 * TS, y: 24 * TS - 18 });

      // Signs & Lamps
      this.signs.push({ x: 52 * TS, y: 24 * TS - 42, spr: 'school' });
      this.signs.push({ x: 96 * TS, y: 24 * TS - 42, spr: 'wdf' });
      for (const lx of [12, 38, 56, 70, 81, 93, 110]) {
        this.lamps.push({ x: lx * TS, y: 12 * TS, top: 2 * TS, ang: 0, vel: 0, red: lx > 95 });
      }

      // Doors 03, 02, 01 + Override Switches
      this.doors.push({ id: '03', x: 75 * TS, y: 21 * TS, open: false, prog: 0 });
      this.switches.push({ x: 71 * TS, y: 24 * TS - 10, pressed: false, doorId: '03' });

      this.doors.push({ id: '02', x: 86 * TS, y: 21 * TS, open: false, prog: 0 });
      this.switches.push({ x: 82 * TS, y: 24 * TS - 10, pressed: false, doorId: '02' });

      this.doors.push({ id: '01', x: 104 * TS, y: 21 * TS, open: false, prog: 0 });

      this.gondolas.push({ id: 'a1_gond', x0: 60 * TS, x1: 68 * TS, y: 18 * TS, x: 60 * TS, px: 60 * TS, py: 18 * TS, w: 48, t: 0, speed: 0.45, dx: 0, dy: 0 });

      // Pickups: Branded Pen (unlocks [Q]), Power Cells, Oil Can
      this.pickups.push({ kind: 'pen', x: 70 * TS, y: 14 * TS, got: false });
      this.cells.push({ x: 54 * TS, y: 10.5 * TS, got: false, p: 0 });
      this.cells.push({ x: 80 * TS, y: 22.5 * TS, got: false, p: 1.5 });
      this.pickups.push({ kind: 'oil', x: 68 * TS, y: 14 * TS, got: false });

      // Props & Terminals
      this.crates.push({ x: 50 * TS, y: 24 * TS - 16, v: 0 }, { x: 88 * TS, y: 24 * TS - 16, v: 0 });
      this.canisters.push({ x: 58 * TS, y: 24 * TS - 20 }, { x: 100 * TS, y: 24 * TS - 20 });
      this.puddles.push({ x: 60 * TS, y: 24 * TS + 6, w: 10 * TS, h: 10, acid: false });

      for (const tm of MD.ACT_TERMINALS[0]) {
        this.terminals.push({ id: `a1_${tm.x}`, x: tm.x, y: 24 * TS - 22, title: tm.title, lines: tm.lines, read: false });
      }
      for (const cx of [14, 33, 62, 79, 98]) this.verlet.addChain(cx * TS, 2 * TS, 7, cx === 62 || cx === 98);
      this.verlet.addCable(4 * TS, 3 * TS, 25 * TS, 3 * TS, 1.12);
      this.verlet.addCable(51 * TS, 3 * TS, 73 * TS, 3 * TS, 1.14);

      // Cutscene Trigger: Khan at Door 01 (`col 99`)
      this.triggers.push({ x: 99 * TS, id: 'act1_khan_door' });
      this.exitZone = { x: 112 * TS, nextAct: 1 };
    }

    // -----------------------------------------------------------------------
    // ACT 2: COPPER-9 WASTELAND, LANDING POD & CORPSE SPIRE (BOSS: N)
    // -----------------------------------------------------------------------
    buildAct2() {
      this.initGrid(132, 26, false);
      // Open Blizzard Sky across whole map!
      // Ruined Overpasses & Nanite Acid Pits
      this.span(21, 12, 18, '#');
      this.span(18, 20, 24, 'T');
      this.span(24, 26, 39, 'H'); this.span(25, 26, 39, '#');
      this.span(21, 29, 32, 'T'); this.span(21, 35, 38, 'T');
      this.span(18, 43, 52, '#');
      this.span(15, 55, 62, 'T');
      this.span(18, 65, 70, '#');
      this.span(24, 86, 95, 'H'); this.span(25, 86, 95, '#');
      this.span(21, 87, 94, 'T');
      // Corpse Spire Arena Multi-Tiered Platforms (`cols 100..128`)
      this.span(20, 102, 108, 'T');
      this.span(20, 118, 124, 'T');
      this.span(16, 109, 117, 'T');

      this.spawn = { x: 4 * TS, y: 22 * TS };
      this.landmarks.push({ type: 'landingPod', x: 72 * TS, y: 24 * TS - 68 });
      this.landmarks.push({ type: 'corpseSpire', x: 108 * TS, y: 24 * TS - 250 });

      this.signs.push({ x: 8 * TS, y: 24 * TS - 42, spr: 'exterior' });
      this.gondolas.push({ id: 'a2_gond', x0: 27 * TS, x1: 37 * TS, y: 16 * TS, x: 27 * TS, px: 27 * TS, py: 16 * TS, w: 48, t: 0, speed: 0.42, dx: 0, dy: 0 });

      this.crates.push({ x: 14 * TS, y: 21 * TS - 16, v: 1 }, { x: 47 * TS, y: 18 * TS - 16, v: 1 }, { x: 101 * TS, y: 24 * TS - 16, v: 1 });
      this.canisters.push({ x: 24 * TS, y: 24 * TS - 20 }, { x: 83 * TS, y: 24 * TS - 20 }, { x: 112 * TS, y: 24 * TS - 20 });
      this.cells.push({ x: 48 * TS, y: 16.5 * TS, got: false, p: 0 }, { x: 67 * TS, y: 16.5 * TS, got: false, p: 1.3 }, { x: 113 * TS, y: 14.5 * TS, got: false, p: 2.6 });
      this.pickups.push({ kind: 'oil', x: 96 * TS, y: 23 * TS, got: false });
      this.pickups.push({ kind: 'core', x: 114 * TS, y: 22.8 * TS, got: false });

      this.puddles.push({ x: 26 * TS, y: 24 * TS + 4, w: 14 * TS, h: 12, acid: true });
      this.puddles.push({ x: 86 * TS, y: 24 * TS + 4, w: 10 * TS, h: 12, acid: true });
      this.hazards.push({ x: 26 * TS, y: 24 * TS + 4, w: 14 * TS, h: 12 }, { x: 86 * TS, y: 24 * TS + 4, w: 10 * TS, h: 12 });

      for (const tm of MD.ACT_TERMINALS[1]) {
        this.terminals.push({ id: `a2_${tm.x}`, x: tm.x, y: 24 * TS - 22, title: tm.title, lines: tm.lines, read: false });
      }

      // World Enemies along frozen ruins
      this.enemies.push(
        { type: 'bug', x: 44 * TS, y: 22 * TS, bx: 44 * TS, range: 36, hp: 2, maxHp: 2, phase: 0, cd: 1.5 },
        { type: 'turret', x: 66 * TS, y: 18 * TS - 18, hp: 2, maxHp: 2, cd: 1.8, face: -1 },
        { type: 'bug', x: 98 * TS, y: 20 * TS, bx: 98 * TS, range: 34, hp: 2, maxHp: 2, phase: 1.2, cd: 1.6 }
      );

      this.triggers.push({ x: 6 * TS, id: 'act2_outside' });
    }

    // -----------------------------------------------------------------------
    // ACT 3: THE ESCAPE CHASE BACK TO OUTPOST 3
    // -----------------------------------------------------------------------
    buildAct3() {
      this.initGrid(116, 26, false);
      this.span(24, 18, 25, 'H'); this.span(25, 18, 25, '#');
      this.span(21, 19, 24, 'T');
      this.span(21, 30, 38, '#');
      this.span(18, 41, 49, 'T');
      this.span(24, 52, 62, 'H'); this.span(25, 52, 62, '#');
      this.span(21, 54, 59, 'T');
      this.span(19, 68, 76, '#');
      this.span(21, 80, 88, 'T');
      this.span(24, 90, 96, 'H'); this.span(25, 90, 96, '#');
      this.span(21, 91, 95, 'T');
      // Outpost 3 Gatehouse on far right (`cols 104..115`)
      for (let r = 0; r <= 20; r++) { this.grid[r][105] = '#'; this.grid[r][106] = '#'; }

      this.spawn = { x: 5 * TS, y: 22 * TS };
      this.doors.push({ id: '01', x: 105 * TS, y: 21 * TS, open: false, prog: 0 });
      this.signs.push({ x: 98 * TS, y: 24 * TS - 42, spr: 'wdf' });
      this.landmarks.push({ type: 'cardTable', x: 109 * TS, y: 24 * TS - 18 });

      this.lifts.push({ id: 'a3_lift', x: 64 * TS, y: 23 * TS, px: 64 * TS, py: 23 * TS, topY: 18 * TS, botY: 23 * TS, w: 48, t: 0, speed: 0.65, dx: 0, dy: 0 });
      this.gondolas.push({ id: 'a3_gond', x0: 53 * TS, x1: 60 * TS, y: 17 * TS, x: 53 * TS, px: 53 * TS, py: 17 * TS, w: 48, t: 0, speed: 0.55, dx: 0, dy: 0 });

      this.puddles.push({ x: 18 * TS, y: 24 * TS + 4, w: 8 * TS, h: 12, acid: true });
      this.puddles.push({ x: 52 * TS, y: 24 * TS + 4, w: 11 * TS, h: 12, acid: true });
      this.puddles.push({ x: 90 * TS, y: 24 * TS + 4, w: 7 * TS, h: 12, acid: true });
      this.hazards.push({ x: 18 * TS, y: 24 * TS + 4, w: 8 * TS, h: 12 }, { x: 52 * TS, y: 24 * TS + 4, w: 11 * TS, h: 12 }, { x: 90 * TS, y: 24 * TS + 4, w: 7 * TS, h: 12 });

      this.cells.push({ x: 45 * TS, y: 16.5 * TS, got: false, p: 0 }, { x: 72 * TS, y: 17.5 * TS, got: false, p: 1.7 });
      this.pickups.push({ kind: 'oil', x: 34 * TS, y: 20 * TS, got: false });
      for (const tm of MD.ACT_TERMINALS[2]) this.terminals.push({ id: `a3_${tm.x}`, x: tm.x, y: 24 * TS - 22, title: tm.title, lines: tm.lines, read: false });

      this.enemies.push(
        { type: 'bug', x: 33 * TS, y: 18 * TS, bx: 33 * TS, range: 30, hp: 2, maxHp: 2, phase: 0, cd: 1.4 },
        { type: 'turret', x: 73 * TS, y: 19 * TS - 18, hp: 2, maxHp: 2, cd: 1.5, face: -1 },
        { type: 'bug', x: 84 * TS, y: 17 * TS, bx: 84 * TS, range: 34, hp: 2, maxHp: 2, phase: 2.0, cd: 1.3 }
      );

      this.triggers.push({ x: 6 * TS, id: 'act3_chase_start' });
      this.triggers.push({ x: 102 * TS, id: 'act3_rummy_breach' });
      this.exitZone = { x: 112 * TS, nextAct: 3 };
    }

    // -----------------------------------------------------------------------
    // ACT 4: OUTPOST 3 BREACH HALLWAY & KHAN'S BETRAYAL
    // -----------------------------------------------------------------------
    buildAct4() {
      this.initGrid(104, 26, true);
      for (let r = 2; r <= 20; r++) { this.grid[r][55] = '#'; this.grid[r][96] = '#'; }
      this.span(21, 18, 25, '#');
      this.span(18, 28, 35, 'T');
      this.span(15, 38, 45, '#');
      this.span(24, 38, 49, 'H'); this.span(25, 38, 49, '#'); // Electrified coolant trench
      this.span(21, 62, 70, 'T');
      this.span(18, 72, 80, '#');

      this.spawn = { x: 5 * TS, y: 22 * TS };
      this.signs.push({ x: 60 * TS, y: 24 * TS - 42, spr: 'evac' });
      this.doors.push({ id: 'mid_02', x: 55 * TS, y: 21 * TS, open: false, prog: 0 });
      this.switches.push({ x: 43 * TS, y: 15 * TS - 10, pressed: false, doorId: 'mid_02' });
      this.doors.push({ id: 'evac_door', x: 96 * TS, y: 21 * TS, open: true, prog: 1 }); // Slams shut in cutscene!

      for (const lx of [12, 28, 48, 66, 84]) this.lamps.push({ x: lx * TS, y: 12 * TS, top: 2 * TS, ang: 0, vel: 0, red: true });
      for (const cx of [16, 36, 60, 78, 90]) this.verlet.addChain(cx * TS, 2 * TS, 8, cx === 36 || cx === 78);

      this.puddles.push({ x: 38 * TS, y: 24 * TS + 4, w: 12 * TS, h: 12, acid: true });
      this.hazards.push({ x: 38 * TS, y: 24 * TS + 4, w: 12 * TS, h: 12 });
      this.cells.push({ x: 76 * TS, y: 16.5 * TS, got: false, p: 0 });
      this.pickups.push({ kind: 'oil', x: 21 * TS, y: 20 * TS, got: false });
      for (const tm of MD.ACT_TERMINALS[3]) this.terminals.push({ id: `a4_${tm.x}`, x: tm.x, y: 24 * TS - 22, title: tm.title, lines: tm.lines, read: false });

      this.enemies.push(
        { type: 'turret', x: 22 * TS, y: 21 * TS - 18, hp: 2, maxHp: 2, cd: 1.4, face: -1 },
        { type: 'bug', x: 64 * TS, y: 17 * TS, bx: 64 * TS, range: 32, hp: 2, maxHp: 2, phase: 0.5, cd: 1.2 },
        { type: 'turret', x: 77 * TS, y: 18 * TS - 18, hp: 2, maxHp: 2, cd: 1.3, face: -1 }
      );

      this.triggers.push({ x: 89 * TS, id: 'act4_betrayal', nextAct: 4 });
    }

    // -----------------------------------------------------------------------
    // ACT 5: EVACUATION SECTOR & FINAL SHOWDOWN VS V & J
    // -----------------------------------------------------------------------
    buildAct5() {
      this.initGrid(98, 26, true);
      // Spacious multi-tiered combat cathedral (cols 24..94)
      this.span(19, 34, 44, 'T');
      this.span(19, 70, 80, 'T');
      this.span(15, 47, 67, 'T');
      this.span(21, 22, 27, '#');
      this.span(21, 87, 92, '#');

      this.spawn = { x: 5 * TS, y: 22 * TS };
      this.signs.push({ x: 10 * TS, y: 24 * TS - 42, spr: 'evac' });
      for (const lx of [14, 34, 57, 80]) this.lamps.push({ x: lx * TS, y: 11 * TS, top: 2 * TS, ang: 0, vel: 0, red: lx > 20 });

      this.lifts.push({ id: 'a5_l', x: 29 * TS, y: 23 * TS, px: 29 * TS, py: 23 * TS, topY: 16 * TS, botY: 23 * TS, w: 48, t: 0, speed: 0.5, dx: 0, dy: 0 });
      this.lifts.push({ id: 'a5_r', x: 82 * TS, y: 23 * TS, px: 82 * TS, py: 23 * TS, topY: 16 * TS, botY: 23 * TS, w: 48, t: 1.5, speed: 0.5, dx: 0, dy: 0 });
      this.gondolas.push({ id: 'a5_g', x0: 46 * TS, x1: 64 * TS, y: 12 * TS, x: 46 * TS, px: 46 * TS, py: 12 * TS, w: 48, t: 0, speed: 0.45, dx: 0, dy: 0 });

      this.pickups.push({ kind: 'oil', x: 24 * TS, y: 20 * TS, got: false });
      this.pickups.push({ kind: 'oil', x: 89 * TS, y: 20 * TS, got: false });
      this.pickups.push({ kind: 'pen', x: 57 * TS, y: 14 * TS, got: false }); // Spare JCJenson Pen!
      this.crates.push({ x: 16 * TS, y: 24 * TS - 16, v: 0 }, { x: 92 * TS, y: 24 * TS - 16, v: 0 });
      for (const tm of MD.ACT_TERMINALS[4]) this.terminals.push({ id: `a5_${tm.x}`, x: tm.x, y: 24 * TS - 22, title: tm.title, lines: tm.lines, read: false });

      this.triggers.push({ x: 22 * TS, id: 'act5_teamup', startFinalBoss: true });
    }
  }
  MD.LevelManager = LevelManager;
})();
