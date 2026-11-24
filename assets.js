(() => {
  'use strict';

  const MD = (window.MD = window.MD || {});
  const {
    PW, PH, TS, SeededRNG, hash2D, clamp, lerp, hexToRgb, bayerCheck, offscreen, measureText, drawText
  } = MD;

  // =========================================================================
  // 1. FIVE HORIZONTAL ACT BIOME PALETTES (COPPER-9 & OUTPOST 3)
  // =========================================================================
  const BIOME_PALETTES = {
    bunker: {
      name: 'OUTPOST 3 // COLONY BUNKER',
      sky: [[0, '#050812'], [0.35, '#0c1528'], [0.75, '#142442'], [1, '#1d345c']],
      arch: ['#091224', '#0e1b33', '#132445', '#1a315c'],
      mortar: '#060c18',
      bricks: ['#0b1529', '#0e1a33', '#11203d', '#15274a'],
      pipe: '#1a2f54', pipeHi: '#325285',
      stone: { core: '#030408', dark: '#0b1220', mid: '#1a2942', edge: '#3a5275', rimMid: '#5a779e', rimHi: '#8fb1d9', crack: '#070b14' },
      frost: { dark: '#233b59', mid: '#487099', hi: '#96bee6', tip: '#e3f2ff' },
      truss: { top: '#87a6c7', mid: '#3a506e', dark: '#141e2e', braceA: '#293952', braceB: '#4f6b8f', rivet: '#cfe8ff' },
      shadow: 'rgba(3, 6, 16, 0.72)',
      shaft: [140, 195, 255],
      lamp: [255, 195, 75],
      accent: '#c24dff',
      motes: ['#8ec5ff', '#cfe8ff', '#d48cff'],
      fog: 'rgba(10, 22, 46, 0.08)'
    },

    blizzard: {
      name: 'COPPER-9 // FROZEN WASTELAND',
      sky: [[0, '#040712'], [0.32, '#0a142b'], [0.68, '#162b52'], [0.92, '#27477d'], [1, '#396199']],
      arch: ['#0a1426', '#101f3b', '#172b4f', '#223d6b'],
      mortar: '#060d1c',
      bricks: ['#0c182e', '#10203d', '#15284a', '#1b345e'],
      pipe: '#243c66', pipeHi: '#587eb8',
      stone: { core: '#030408', dark: '#0b1426', mid: '#1a2c4a', edge: '#415d87', rimMid: '#6f8eb8', rimHi: '#b5d4f5', crack: '#060b14' },
      frost: { dark: '#395a80', mid: '#6e96bf', hi: '#b8dcff', tip: '#ffffff' },
      truss: { top: '#b8dcff', mid: '#415b80', dark: '#121c2e', braceA: '#2d4161', braceB: '#6585b0', rivet: '#ffffff' },
      shadow: 'rgba(4, 10, 24, 0.56)',
      shaft: [165, 215, 255],
      lamp: [255, 225, 53],
      accent: '#ffe135',
      motes: ['#e6f3ff', '#ffffff', '#9dc6f0'],
      fog: 'rgba(26, 52, 96, 0.12)'
    },

    spire: {
      name: 'THE CORPSE SPIRE // LANDING POD',
      sky: [[0, '#0a0714'], [0.35, '#19102b'], [0.70, '#2e1b42'], [0.92, '#4d2747'], [1, '#663140']],
      arch: ['#140d21', '#1f1433', '#2e1c42', '#42254a'],
      mortar: '#0a0612',
      bricks: ['#160e24', '#1d1230', '#26183b', '#331e45'],
      pipe: '#3b2447', pipeHi: '#8a5275',
      stone: { core: '#030408', dark: '#120c1c', mid: '#261a36', edge: '#543b63', rimMid: '#8a668c', rimHi: '#d4b8c7', crack: '#09060f' },
      frost: { dark: '#382a4d', mid: '#6e527a', hi: '#c9a6bf', tip: '#ffe6f2' },
      truss: { top: '#d4b8c7', mid: '#543b63', dark: '#171024', braceA: '#3a2747', braceB: '#87608a', rivet: '#fff0f5' },
      shadow: 'rgba(12, 6, 20, 0.60)',
      shaft: [255, 195, 110],
      lamp: [255, 225, 53],
      accent: '#ffe135',
      motes: ['#ffe135', '#e6f3ff', '#ff9ebb'],
      fog: 'rgba(54, 24, 48, 0.12)'
    },

    breach: {
      name: 'OUTPOST 3 // BREACH HALLWAY',
      sky: [[0, '#0a0204'], [0.4, '#1a0509'], [0.8, '#2b090f'], [1, '#400d15']],
      arch: ['#170508', '#24080c', '#330b12', '#471019'],
      mortar: '#080203',
      bricks: ['#140407', '#1c060a', '#24080e', '#2e0b12'],
      pipe: '#4a151d', pipeHi: '#9e2e3a',
      stone: { core: '#030408', dark: '#140608', mid: '#290d12', edge: '#5c212b', rimMid: '#8a3843', rimHi: '#c46c74', crack: '#080203' },
      frost: { dark: '#2e1418', mid: '#54242b', hi: '#a84f59', tip: '#ff8fa3' },
      truss: { top: '#c4747e', mid: '#5c242c', dark: '#1c080b', braceA: '#3d151b', braceB: '#8f3944', rivet: '#ffd6db' },
      shadow: 'rgba(14, 3, 6, 0.78)',
      shaft: [255, 46, 76],
      lamp: [255, 46, 76],
      accent: '#ff2e4c',
      motes: ['#ff5973', '#ffaa33', '#ffffff'],
      fog: 'rgba(72, 10, 18, 0.14)'
    },

    evac: {
      name: 'EVACUATION SECTOR // FINAL STAND',
      sky: [[0, '#050812'], [0.4, '#0d1429'], [0.8, '#1a1e38'], [1, '#292242']],
      arch: ['#0a0f1f', '#121830', '#1c2140', '#2a284f'],
      mortar: '#04060f',
      bricks: ['#0a0f1f', '#0f162b', '#151d38', '#1c2445'],
      pipe: '#262e52', pipeHi: '#5e6b9e',
      stone: { core: '#030408', dark: '#0d1224', mid: '#1c2542', edge: '#445382', rimMid: '#6d7fb5', rimHi: '#a9bceb', crack: '#060812' },
      frost: { dark: '#242b4a', mid: '#45507d', hi: '#8b99cf', tip: '#dce6ff' },
      truss: { top: '#b8c7eb', mid: '#404c75', dark: '#121629', braceA: '#2a3354', braceB: '#6676ab', rivet: '#ffffff' },
      shadow: 'rgba(5, 8, 18, 0.70)',
      shaft: [194, 77, 255],
      lamp: [255, 175, 45],
      accent: '#c24dff',
      motes: ['#c24dff', '#ffe135', '#38ff8c', '#ffffff'],
      fog: 'rgba(26, 18, 52, 0.12)'
    }
  };
  MD.BIOME_PALETTES = BIOME_PALETTES;

  // =========================================================================
  // 2. PROCEDURAL ASSET FACTORY
  // =========================================================================
  class AssetFactory {
    constructor() {
      this.bg = {};
      this.tiles = {};
      this.trusses = {};
      this.corners = {};
      this.uzi = {};
      this.nDrone = {};
      this.vDrone = {};
      this.jDrone = {};
      this.npcs = {};
      this.turret = [];
      this.bug = [];
      this.signs = {};
      this.lamps = {};
      this.doors = {};
      this.sw = [];
      this.crates = [];
      this.canister = null;
      this.cellFrames = [];
      this.pen = null;
      this.wrench = null;
      this.oilCan = null;
      this.terminal = null;
      this.gondola = null;
      this.lift = null;
      this.pulley = [];
      this.cw = null;
      this.corpseSpire = null;
      this.landingPod = null;
      this.cardTable = null;
      this.projector = null;
      this.nurseBed = null;
      this.dofTop = [];
      this.dofBot = [];
    }

    bakeAll() {
      for (const [k, pal] of Object.entries(BIOME_PALETTES)) {
        this.bakeBiomeBG(k, pal);
        this.bakeBiomeTiles(k, pal);
        this.bakeBiomeTruss(k, pal);
      }
      this.bakeUzi();
      this.bakeMurderDrones();
      this.bakeNPCsAndEnemies();
      this.bakeLandmarks();
      this.bakePropsAndMachinery();
      this.bakeDOF();
    }

    // -----------------------------------------------------------------------
    // A. MULTI-LAYER BACKGROUNDS (WITH RINGED COPPER-9 MOON & BLINKING LEDS)
    // -----------------------------------------------------------------------
    bakeBiomeBG(biome, pal) {
      // Layer 0: Dithered sky + stars + shattered ringed planet (exterior biomes)
      const sky = offscreen(PW, PH);
      const stops = pal.sky.map(([y, h]) => [y, hexToRgb(h)]);
      const img = sky.ctx.createImageData(PW, PH);
      for (let y = 0; y < PH; y++) {
        const t = y / (PH - 1);
        let s0 = stops[0], s1 = stops[stops.length - 1];
        for (let i = 0; i < stops.length - 1; i++) {
          if (t >= stops[i][0] && t <= stops[i + 1][0]) { s0 = stops[i]; s1 = stops[i + 1]; break; }
        }
        const lt = (t - s0[0]) / Math.max(0.001, s1[0] - s0[0]);
        for (let x = 0; x < PW; x++) {
          const rgb = bayerCheck(x, y, lt) ? s1[1] : s0[1];
          const k = (y * PW + x) * 4;
          img.data[k] = rgb[0]; img.data[k + 1] = rgb[1]; img.data[k + 2] = rgb[2]; img.data[k + 3] = 255;
        }
      }
      sky.ctx.putImageData(img, 0, 0);

      if (biome === 'blizzard' || biome === 'spire') {
        for (let i = 0; i < 60; i++) {
          sky.ctx.fillStyle = i % 3 === 0 ? '#ffffff' : '#85a6d4';
          sky.ctx.fillRect(Math.floor(hash2D(i, 1, 7) * PW), Math.floor(hash2D(i, 2, 7) * 145), 1, 1);
        }
        // Copper-9 shattered ringed exoplanet
        const mx = 350, my = 62;
        for (let dy = -26; dy <= 26; dy++) for (let dx = -26; dx <= 26; dx++) {
          const d = Math.hypot(dx, dy);
          if (d < 25) {
            if (dx > 7 && dy < -4 && hash2D(dx, dy, 9) > 0.32) continue;
            sky.ctx.fillStyle = (dx + dy < -6) ? '#b8d8fa' : (d > 19 ? '#2c4673' : '#4a6ea6');
            sky.ctx.fillRect(mx + dx, my + dy, 1, 1);
          }
        }
        sky.ctx.fillStyle = 'rgba(195, 224, 255, 0.45)';
        for (let t = -48; t <= 48; t++) {
          const rx = Math.round(mx + t), ry = Math.round(my + t * 0.25 + Math.sin(t * 0.08) * 2);
          if (Math.abs(t) > 22 || t * 0.25 > 2) sky.ctx.fillRect(rx, ry, 2, 1);
        }
      }

      // Layer 1: Colossal Distant Structures (0.15x)
      const far = offscreen(640, 270);
      far.ctx.fillStyle = pal.arch[0];
      for (let x = 20; x < 640; x += 150) {
        far.ctx.fillRect(x, 30, 32, 240);
        far.ctx.fillStyle = pal.arch[2];
        far.ctx.fillRect(x + 3, 30, 6, 240);
        far.ctx.fillStyle = pal.arch[0];
        far.ctx.fillRect(x - 14, 52, 60, 10);
      }
      if (biome === 'blizzard' || biome === 'spire') {
        // Distant ruined JCJenson skyscrapers & Corpse Spire silhouette
        far.ctx.fillStyle = pal.arch[1];
        far.ctx.beginPath();
        far.ctx.moveTo(430, 270); far.ctx.lineTo(465, 90); far.ctx.lineTo(484, 48);
        far.ctx.lineTo(504, 96); far.ctx.lineTo(532, 270); far.ctx.closePath(); far.ctx.fill();
      } else {
        // Giant bunker overhead arches
        far.ctx.fillStyle = pal.arch[1];
        far.ctx.fillRect(0, 68, 640, 18);
        far.ctx.fillStyle = pal.arch[3];
        far.ctx.fillRect(0, 68, 640, 3);
      }

      // Layer 2: Midground Vaults & Blinking LEDs (0.35x)
      const mid = offscreen(512, 270);
      const leds = [];
      if (biome !== 'blizzard' && biome !== 'spire') {
        for (let y = 0; y < 270; y += 10) {
          const stag = ((y / 10) & 1) ? 10 : 0;
          for (let x = 0; x < 512; x += 20) {
            const n = hash2D(x, y, 55);
            mid.ctx.fillStyle = pal.bricks[Math.min(3, Math.floor(n * 4))];
            mid.ctx.fillRect(x + stag + 1, y + 1, 18, 8);
          }
        }
      }
      for (let x = 28; x < 512; x += 128) {
        mid.ctx.fillStyle = pal.mortar; mid.ctx.fillRect(x, 0, 16, 270);
        mid.ctx.fillStyle = pal.pipe; mid.ctx.fillRect(x + 2, 0, 8, 270);
        mid.ctx.fillStyle = pal.pipeHi; mid.ctx.fillRect(x + 3, 0, 2, 270);
        for (let y = 30; y < 230; y += 56) {
          mid.ctx.fillStyle = pal.mortar; mid.ctx.fillRect(x + 18, y, 10, 14);
          leds.push({ x: x + 21, y: y + 5, col: (y % 112 === 30) ? '#ff2e4c' : pal.accent, p: x * 0.1 + y });
        }
      }
      mid.c.leds = leds;

      // Layer 3: Hanging Foreground Silhouette Wires & Icicles (0.7x)
      const near = offscreen(480, 270);
      near.ctx.fillStyle = pal.mortar;
      for (const [x0, y0, x1, y1] of [[0, 28, 175, 42], [170, 42, 360, 22], [350, 22, 480, 38]]) {
        for (let i = 0; i <= x1 - x0; i++) {
          const t = i / (x1 - x0);
          near.ctx.fillRect(x0 + i, Math.round(lerp(y0, y1, t) + Math.sin(t * Math.PI) * 24), 1, 1);
        }
      }

      this.bg[biome] = { sky: sky.c, far: far.c, mid: mid.c, near: near.c };
    }

    // -----------------------------------------------------------------------
    // B. 16-MASK × 4-VARIANT AUTO-TILED 16x16 TERRAIN (20x28 STAMPS)
    // -----------------------------------------------------------------------
    bakeBiomeTiles(biome, pal) {
      const C = hexToRgb(pal.stone.core), D = hexToRgb(pal.stone.dark), M = hexToRgb(pal.stone.mid);
      const E = hexToRgb(pal.stone.edge), RM = hexToRgb(pal.stone.rimMid), RH = hexToRgb(pal.stone.rimHi);
      const CR = hexToRgb(pal.stone.crack);
      const FD = hexToRgb(pal.frost.dark), FM = hexToRgb(pal.frost.mid), FH = hexToRgb(pal.frost.hi), FT = hexToRgb(pal.frost.tip);
      const SW = 20, SH = 28, OX = 2, OY = 6;
      const byMask = [];

      for (let mask = 0; mask < 16; mask++) {
        byMask[mask] = [];
        const hasN = mask & 1, hasE = mask & 2, hasS = mask & 4, hasW = mask & 8;
        for (let v = 0; v < 4; v++) {
          const { c, ctx } = offscreen(SW, SH);
          const img = ctx.createImageData(SW, SH), d = img.data;
          const seed = mask * 37 + v * 113 + biome.charCodeAt(0) * 19;
          const px = (x, y, rgb) => {
            if (x < 0 || x >= SW || y < 0 || y >= SH) return;
            const i = (y * SW + x) * 4;
            d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255;
          };

          for (let ly = 0; ly < 16; ly++) for (let lx = 0; lx < 16; lx++) {
            const n = hash2D(lx, ly, seed);
            const dN = hasN ? 99 : ly, dS = hasS ? 99 : 15 - ly, dW = hasW ? 99 : lx, dE = hasE ? 99 : 15 - lx;
            if (!hasN && !hasW && lx === 0 && ly === 0) continue;
            if (!hasN && !hasE && lx === 15 && ly === 0) continue;
            if (!hasS && ly === 15 && n < 0.35) continue;

            let col = C;
            const seam = (!hasN && ly >= 1 && ly <= 4 && (lx === 7 + (v % 3) || ly === 3)) || (!hasW && lx <= 3 && ly === 7);
            if (dN === 0) col = n > 0.25 ? RH : RM;
            else if (dN === 1) col = seam ? CR : (n > 0.4 ? RM : E);
            else if (dN === 2) col = seam ? CR : (n > 0.35 ? E : M);
            else if (dN <= 4) col = bayerCheck(lx, ly, 1 - (dN - 2) / 3) ? M : D;
            else if (dN <= 6) col = bayerCheck(lx, ly, 0.38) ? D : C;
            else if (dW === 0 || dE === 0) col = n > 0.35 ? E : M;
            else if (dW <= 3 || dE <= 3) col = bayerCheck(lx, ly, 0.42) ? D : C;
            else if (dS <= 2) col = bayerCheck(lx, ly, 0.45 - dS * 0.12) ? D : C;
            if (col !== C && seam) col = CR;
            px(OX + lx, OY + ly, col);
          }

          if (!hasN) {
            const cov = biome === 'blizzard' || biome === 'spire' ? 0.92 : 0.48;
            for (let lx = 0; lx < 16; lx++) {
              const fn = hash2D(lx, v, seed + 501);
              if (fn > cov) continue;
              px(OX + lx, OY, fn < 0.35 ? FT : FH);
              px(OX + lx, OY + 1, FM);
              if ((biome === 'blizzard' || biome === 'spire') && hash2D(lx, 11, seed) < 0.5) {
                px(OX + lx, OY - 1, FT);
              }
              if (hash2D(lx, 21, seed) < 0.25) {
                const h = 2 + Math.floor(hash2D(lx, 22, seed) * 4);
                for (let k = 1; k <= h; k++) px(OX + lx, OY + 1 + k, k === h ? FD : FM);
              }
            }
          }
          if (!hasS) {
            for (let lx = 1; lx < 15; lx++) {
              const sn = hash2D(lx, 77, seed);
              if (sn < 0.28) {
                const drop = 1 + Math.floor(hash2D(lx, 78, seed) * 5);
                for (let r = 0; r < drop; r++) px(OX + lx, OY + 16 + r, r < 2 ? D : (r === drop - 1 ? FH : E));
              }
            }
          }
          ctx.putImageData(img, 0, 0);
          byMask[mask].push(c);
        }
      }
      this.tiles[biome] = byMask;

      const corners = {};
      for (const nm of ['NW', 'NE', 'SE', 'SW']) {
        const { c, ctx } = offscreen(4, 4);
        ctx.fillStyle = pal.stone.edge; ctx.fillRect(0, 0, 4, 4);
        ctx.fillStyle = pal.stone.mid; ctx.fillRect(1, 1, 2, 2);
        ctx.fillStyle = pal.stone.rimHi;
        if (nm === 'NW') ctx.fillRect(3, 3, 1, 1);
        if (nm === 'NE') ctx.fillRect(0, 3, 1, 1);
        if (nm === 'SE') ctx.fillRect(0, 0, 1, 1);
        if (nm === 'SW') ctx.fillRect(3, 0, 1, 1);
        corners[nm] = c;
      }
      this.corners[biome] = corners;
    }

    bakeBiomeTruss(biome, pal) {
      const list = [];
      for (let v = 0; v < 4; v++) {
        const { c, ctx } = offscreen(16, 16);
        const t = pal.truss;
        ctx.fillStyle = t.top; ctx.fillRect(0, 0, 16, 1);
        ctx.fillStyle = t.mid; ctx.fillRect(0, 1, 16, 2); ctx.fillRect(0, 12, 16, 2);
        ctx.fillStyle = t.dark; ctx.fillRect(0, 3, 16, 1);
        ctx.fillStyle = t.rivet; ctx.fillRect(2, 1, 1, 1); ctx.fillRect(8, 1, 1, 1); ctx.fillRect(13, 1, 1, 1);
        for (let bx = 0; bx < 16; bx += 8) for (let i = 0; i < 8; i++) {
          ctx.fillStyle = t.braceA; ctx.fillRect(bx + i, 4 + i, 1, 1);
          ctx.fillStyle = t.braceB; ctx.fillRect(bx + (7 - i), 4 + i, 1, 1);
        }
        if (v % 2 === 1) { ctx.fillStyle = pal.frost.hi; ctx.fillRect(1, 0, 5, 1); }
        list.push(c);
      }
      this.trusses[biome] = list;
    }

    // -----------------------------------------------------------------------
    // C. PROTAGONIST: UZI DOORMAN (24x24 MULTI-FRAME SHEET)
    // -----------------------------------------------------------------------
    bakeUzi() {
      const drawUzi = (opts) => {
        const { bob = 0, legL = 0, legR = 0, tilt = 0, gun = false, wrench = false, hurt = false } = opts;
        const { c, ctx } = offscreen(24, 24);
        const cx = 12 + tilt, top = 6 + bob;

        // Boots
        ctx.fillStyle = '#080b12'; ctx.fillRect(cx - 4, 18 + legL, 3, 4); ctx.fillRect(cx + 1, 18 + legR, 3, 4);
        ctx.fillStyle = '#536c8a'; ctx.fillRect(cx - 3, 19 + legL, 2, 2); ctx.fillRect(cx + 2, 19 + legR, 2, 2);

        // Dark purple-black hoodie + tiny Solver chest badge
        ctx.fillStyle = '#080b12'; ctx.fillRect(cx - 5, top + 7, 10, 7);
        ctx.fillStyle = '#1f2338'; ctx.fillRect(cx - 4, top + 8, 8, 5);
        ctx.fillStyle = '#c24dff'; ctx.fillRect(cx - 1, top + 9, 2, 2);

        // Worker Drone head
        ctx.fillStyle = '#080b12'; ctx.fillRect(cx - 6, top, 12, 8);
        ctx.fillStyle = '#e6f0ff'; ctx.fillRect(cx - 5, top + 1, 10, 6);
        ctx.fillStyle = '#9db4d4'; ctx.fillRect(cx - 5, top + 6, 10, 1);

        // Beanie + pom-pom + side hair tuft
        ctx.fillStyle = '#2b1d42'; ctx.fillRect(cx - 5, top - 2, 10, 3);
        ctx.fillStyle = '#553a82'; ctx.fillRect(cx - 4, top - 3, 8, 2);
        ctx.fillStyle = '#8763c4'; ctx.fillRect(cx - 1, top - 4, 2, 1);
        ctx.fillStyle = '#362754'; ctx.fillRect(cx - 6, top + 2, 1, 3);

        // Dark Visor
        ctx.fillStyle = '#0a0d16'; ctx.fillRect(cx - 4, top + 2, 8, 4);

        if (hurt) {
          ctx.fillStyle = '#ffe135'; ctx.fillRect(cx + 3, top + 9, 3, 3); // bandaged hand
        } else if (gun) {
          // Magnetically Amplified Photon Converger (Railgun)
          ctx.fillStyle = '#080b12'; ctx.fillRect(cx + 2, top + 8, 10, 4);
          ctx.fillStyle = '#5c7594'; ctx.fillRect(cx + 3, top + 9, 8, 2);
          ctx.fillStyle = '#38ff8c'; ctx.fillRect(cx + 5, top + 9, 5, 1);
          ctx.fillStyle = '#ffffff'; ctx.fillRect(cx + 9, top + 9, 1, 1);
        } else if (wrench) {
          ctx.fillStyle = '#8fa8c7'; ctx.fillRect(cx + 4, top + 4, 2, 7);
          ctx.fillStyle = '#eef4ff'; ctx.fillRect(cx + 3, top + 3, 4, 2);
        }

        c.vx = cx - 4; c.vy = top + 2;
        return c;
      };

      this.uzi.idle = [drawUzi({ bob: 0 }), drawUzi({ bob: 0 }), drawUzi({ bob: 1 }), drawUzi({ bob: 1 })];
      this.uzi.run = [
        drawUzi({ bob: -1, legL: -1, legR: 1, tilt: 1 }),
        drawUzi({ bob: 0, legL: 0, legR: -1, tilt: 1 }),
        drawUzi({ bob: 1, legL: 1, legR: -1, tilt: 1 }),
        drawUzi({ bob: 0, legL: -1, legR: 0, tilt: 1 })
      ];
      this.uzi.jump = [drawUzi({ bob: -1, legL: -1, legR: -1 })];
      this.uzi.fall = [drawUzi({ bob: 1, legL: 0, legR: -1 })];
      this.uzi.gun = [drawUzi({ gun: true }), drawUzi({ bob: 1, gun: true })];
      this.uzi.wrench = [drawUzi({ wrench: true }), drawUzi({ bob: 1, wrench: true })];
      this.uzi.hurt = [drawUzi({ hurt: true })];
    }

    // -----------------------------------------------------------------------
    // D. DISASSEMBLY DRONES: N, V, J (32x34 MULTI-FRAME SPRITES)
    // -----------------------------------------------------------------------
    bakeMurderDrones() {
      const makeMurderDrone = (style, opts = {}) => {
        const { wings = false, headless = false, penned = false, hover = 0 } = opts;
        const { c, ctx } = offscreen(32, 34);
        const cx = 16, top = 5 + hover;

        if (wings) {
          ctx.fillStyle = '#141c29';
          for (let i = 0; i < 12; i++) {
            ctx.fillRect(cx - 5 - i, top + 9 - Math.floor(i * 0.55), 2, 10);
            ctx.fillRect(cx + 4 + i, top + 9 - Math.floor(i * 0.55), 2, 10);
          }
          ctx.fillStyle = '#7b94ad';
          ctx.fillRect(cx - 16, top + 2, 11, 2); ctx.fillRect(cx + 6, top + 2, 11, 2);
        }

        // Nanite Acid Tail
        ctx.fillStyle = '#090d14'; ctx.fillRect(cx + 5, top + 16, 4, 2); ctx.fillRect(cx + 8, top + 10, 2, 7);
        ctx.fillStyle = '#ffe135'; ctx.fillRect(cx + 7, top + 7, 4, 4);

        // Legs & Coat/Jacket
        ctx.fillStyle = '#090d14';
        ctx.fillRect(cx - 3, 25, 2, 7); ctx.fillRect(cx + 1, 25, 2, 7);
        if (style === 'V') {
          ctx.fillStyle = '#1c2433'; ctx.fillRect(cx - 5, top + 10, 10, 8);
          ctx.fillStyle = '#2d394f'; ctx.fillRect(cx - 4, top + 11, 8, 6);
        } else {
          ctx.fillStyle = '#1a2130'; ctx.fillRect(cx - 5, top + 10, 10, 12);
          ctx.fillStyle = '#33415c'; ctx.fillRect(cx - 4, top + 11, 8, 9);
          if (style === 'J') { ctx.fillStyle = '#ffffff'; ctx.fillRect(cx - 1, top + 11, 2, 4); } // tie/collar
        }
        ctx.fillStyle = '#ffe135'; ctx.fillRect(cx - 5, top + 13, 2, 2); // JCJenson armband

        if (!headless) {
          ctx.fillStyle = '#090d14'; ctx.fillRect(cx - 6, top, 12, 9);
          ctx.fillStyle = '#e6f0ff'; ctx.fillRect(cx - 5, top + 1, 10, 7);
          // Hair / Hat
          if (style === 'N') {
            ctx.fillStyle = '#18202e'; ctx.fillRect(cx - 6, top - 2, 12, 4); // Pilot cap
            ctx.fillStyle = '#8fa8c7'; ctx.fillRect(cx - 6, top + 2, 2, 3);
          } else if (style === 'V') {
            ctx.fillStyle = '#dce8fa'; ctx.fillRect(cx - 6, top - 1, 12, 3);
            ctx.fillRect(cx - 6, top + 2, 2, 4); ctx.fillRect(cx + 4, top + 2, 2, 4);
          } else if (style === 'J') {
            ctx.fillStyle = '#dce8fa'; ctx.fillRect(cx - 6, top - 1, 12, 3);
            // Pigtails
            ctx.fillStyle = '#18202e'; ctx.fillRect(cx - 7, top + 1, 2, 2); ctx.fillRect(cx + 5, top + 1, 2, 2);
            ctx.fillStyle = '#dce8fa'; ctx.fillRect(cx - 9, top + 2, 2, 7); ctx.fillRect(cx + 7, top + 2, 2, 7);
          }
          // Yellow headband bulbs
          ctx.fillStyle = '#ffe135';
          ctx.fillRect(cx - 4, top + 1, 2, 1); ctx.fillRect(cx - 1, top + 1, 2, 1); ctx.fillRect(cx + 2, top + 1, 2, 1);

          // Visor
          ctx.fillStyle = '#0a0d16'; ctx.fillRect(cx - 4, top + 4, 8, 4);
          if (penned) {
            // JCJenson Branded Pen sticking out of J's eye!
            ctx.fillStyle = '#253347'; ctx.fillRect(cx - 8, top + 4, 6, 2);
            ctx.fillStyle = '#ffe135'; ctx.fillRect(cx - 9, top + 4, 2, 2);
          }
        }
        c.vx = cx - 4; c.vy = top + 4;
        return c;
      };

      this.nDrone = {
        idle: makeMurderDrone('N'),
        wings: makeMurderDrone('N', { wings: true }),
        hover: makeMurderDrone('N', { wings: true, hover: -1 }),
        headless: makeMurderDrone('N', { headless: true })
      };
      this.vDrone = {
        idle: makeMurderDrone('V'),
        wings: makeMurderDrone('V', { wings: true }),
        hover: makeMurderDrone('V', { wings: true, hover: -1 })
      };
      this.jDrone = {
        idle: makeMurderDrone('J'),
        wings: makeMurderDrone('J', { wings: true }),
        penned: makeMurderDrone('J', { penned: true })
      };
    }

    // -----------------------------------------------------------------------
    // E. SUPPORTING CAST NPCs & WORLD ENEMIES
    // -----------------------------------------------------------------------
    bakeNPCsAndEnemies() {
      const makeWorker = (hatCol, shirtCol, eyeCol, mustache = false, capBack = false, bow = null) => {
        const { c, ctx } = offscreen(24, 24);
        const cx = 12, top = 6;
        ctx.fillStyle = '#080b12'; ctx.fillRect(cx - 4, 18, 3, 4); ctx.fillRect(cx + 1, 18, 3, 4);
        ctx.fillStyle = shirtCol; ctx.fillRect(cx - 4, top + 8, 8, 5);
        ctx.fillStyle = '#080b12'; ctx.fillRect(cx - 6, top, 12, 8);
        ctx.fillStyle = '#e6f0ff'; ctx.fillRect(cx - 5, top + 1, 10, 6);
        if (hatCol) {
          ctx.fillStyle = hatCol; ctx.fillRect(cx - 6, top - 2, 12, 3);
          if (capBack) ctx.fillRect(cx - 8, top, 3, 1);
          else ctx.fillRect(cx - 5, top - 3, 10, 2);
        }
        if (bow) { ctx.fillStyle = bow; ctx.fillRect(cx - 5, top - 2, 3, 2); ctx.fillRect(cx + 2, top - 2, 3, 2); }
        ctx.fillStyle = '#0a0d16'; ctx.fillRect(cx - 4, top + 2, 8, 4);
        ctx.fillStyle = eyeCol; ctx.fillRect(cx - 3, top + 3, 2, 2); ctx.fillRect(cx + 1, top + 3, 2, 2);
        if (mustache) { ctx.fillStyle = '#3b4a61'; ctx.fillRect(cx - 4, top + 6, 8, 2); }
        return c;
      };

      this.npcs.khan = makeWorker('#d49a2a', '#263854', '#ffe135', true, false);
      this.npcs.thad = makeWorker('#a82e3b', '#224f3c', '#38ff8c', false, true);
      this.npcs.teacher = makeWorker(null, '#333b4f', '#9db4d4', false, false);
      this.npcs.lizzy = makeWorker(null, '#4d2247', '#ff70c8', false, false, '#ff70c8');
      this.npcs.doll = makeWorker(null, '#2e1d36', '#ff3b4d', false, false, '#ff2e4c');
      this.npcs.wdf = makeWorker('#2e4c73', '#1c2a42', '#7af5ff', false, false);

      // Corrupted JCJenson Security Turret (2 frames, 20x18 px)
      for (let fire = 0; fire < 2; fire++) {
        const { c, ctx } = offscreen(20, 18);
        ctx.fillStyle = '#090d14'; ctx.fillRect(4, 12, 12, 6);
        ctx.fillStyle = '#2d3d54'; ctx.fillRect(5, 13, 10, 4);
        ctx.fillStyle = '#485f7d'; ctx.fillRect(3, 4, 14, 9);
        ctx.fillStyle = '#182230'; ctx.fillRect(1, 7, 18, 3);
        ctx.fillStyle = fire ? '#ffffff' : '#ff2e4c';
        ctx.fillRect(8, 6, 4, 4);
        this.turret.push(c);
      }

      // Rogue Mining Sentinel Bug (2 frames, 18x14 px)
      for (let f = 0; f < 2; f++) {
        const { c, ctx } = offscreen(18, 14);
        ctx.fillStyle = '#090d14'; ctx.fillRect(3, 2, 12, 8);
        ctx.fillStyle = '#384c66'; ctx.fillRect(4, 3, 10, 6);
        ctx.fillStyle = '#ff2e4c'; ctx.fillRect(7, 5, 4, 2);
        ctx.fillStyle = '#ffe135'; ctx.fillRect(5 + f * 4, 10, 3, 2);
        this.bug.push(c);
      }
    }

    // -----------------------------------------------------------------------
    // F. HERO LANDMARKS: CORPSE SPIRE, CRASHED LANDING POD, WDF TABLE
    // -----------------------------------------------------------------------
    bakeLandmarks() {
      // 1. Towering Corpse Spire (220x250 px)
      {
        const { c, ctx } = offscreen(220, 250);
        const rng = new SeededRNG(888);
        // Jagged scrap-metal conical spire base
        ctx.fillStyle = '#070a12';
        ctx.beginPath();
        ctx.moveTo(10, 250); ctx.lineTo(52, 135); ctx.lineTo(86, 55);
        ctx.lineTo(110, 8); ctx.lineTo(134, 58); ctx.lineTo(168, 138); ctx.lineTo(210, 250);
        ctx.closePath(); ctx.fill();

        // Scrap drone limbs, twisted rebar ribs & steel plating
        for (let y = 30; y < 245; y += 12) {
          const halfW = Math.round(((y - 10) / 240) * 86);
          ctx.fillStyle = y % 24 === 6 ? '#26364f' : '#141e30';
          ctx.fillRect(110 - halfW, y, halfW * 2, 4);
          // Poking scrap girders
          ctx.fillStyle = '#384c66';
          ctx.fillRect(110 - halfW - rng.int(2, 10), y + 1, 8, 2);
          ctx.fillRect(110 + halfW + 2, y + 1, rng.int(4, 10), 2);
        }
        // Central steel spine + scattered dim yellow visors in scrap pile
        ctx.fillStyle = '#486080'; ctx.fillRect(108, 12, 4, 238);
        for (let i = 0; i < 22; i++) {
          const vy = rng.int(130, 240);
          const span = Math.round(((vy - 10) / 240) * 65);
          const vx = 110 + rng.int(-span, span);
          ctx.fillStyle = '#05080f'; ctx.fillRect(vx - 3, vy - 2, 7, 4);
          ctx.fillStyle = rng.chance(0.4) ? '#ff2e4c' : '#ffe135';
          ctx.fillRect(vx - 2, vy - 1, 1, 1); ctx.fillRect(vx + 1, vy - 1, 1, 1);
        }
        this.corpseSpire = c;
      }

      // 2. Crashed JCJenson Disassembly Drone Landing Pod (84x68 px)
      {
        const { c, ctx } = offscreen(84, 68);
        // Splayed steel landing struts
        ctx.fillStyle = '#182230';
        for (let i = 0; i < 16; i++) {
          ctx.fillRect(22 - i, 50 + i, 5, 3);
          ctx.fillRect(57 + i, 50 + i, 5, 3);
        }
        // Main rocket pod hull
        ctx.fillStyle = '#090d14'; ctx.fillRect(18, 12, 48, 46);
        ctx.fillStyle = '#2d3b4e'; ctx.fillRect(20, 14, 44, 42);
        ctx.fillStyle = '#5c7594'; ctx.fillRect(22, 14, 10, 42);
        // Conical nose cap
        ctx.fillStyle = '#3c4f69'; ctx.fillRect(26, 5, 32, 9);
        ctx.fillStyle = '#87a6c7'; ctx.fillRect(34, 1, 16, 5);
        // Hazard stripes & JCJENSON decal
        for (let x = 22; x < 62; x++) {
          ctx.fillStyle = ((x >> 1) & 1) ? '#ffe135' : '#18202c';
          ctx.fillRect(x, 38, 1, 4);
        }
        drawText(ctx, 'JCJENSON', 24, 20, '#eef4ff', '#090d14');
        // Glowing warm interior hatch doorway
        ctx.fillStyle = '#090d14'; ctx.fillRect(34, 43, 16, 15);
        ctx.fillStyle = '#332011'; ctx.fillRect(36, 45, 12, 13);
        ctx.fillStyle = '#ffaa33'; ctx.fillRect(39, 48, 6, 4);
        this.landingPod = c;
      }

      // 3. WDF Gin Rummy Card Table (42x18 px)
      {
        const { c, ctx } = offscreen(42, 18);
        ctx.fillStyle = '#182230'; ctx.fillRect(4, 5, 2, 13); ctx.fillRect(36, 5, 2, 13);
        ctx.fillStyle = '#28394f'; ctx.fillRect(0, 3, 42, 4);
        ctx.fillStyle = '#1c5c46'; ctx.fillRect(2, 3, 38, 2); // green felt
        // Scattered playing cards
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(8, 1, 4, 3); ctx.fillRect(16, 2, 4, 2); ctx.fillRect(24, 1, 4, 3); ctx.fillRect(31, 2, 4, 2);
        ctx.fillStyle = '#ff2e4c'; ctx.fillRect(9, 2, 1, 1); ctx.fillRect(25, 2, 1, 1);
        this.cardTable = c;
      }

      // 4. Classroom Projector & Nurse Bed
      {
        const { c, ctx } = offscreen(44, 26);
        ctx.fillStyle = '#253347'; ctx.fillRect(20, 18, 4, 8);
        ctx.fillStyle = '#090d14'; ctx.fillRect(0, 0, 44, 20);
        ctx.fillStyle = '#dce8fa'; ctx.fillRect(2, 2, 40, 16);
        drawText(ctx, 'JCJENSON', 6, 5, '#182233', null);
        drawText(ctx, 'IN SPACE', 7, 12, '#73222b', null);
        this.projector = c;
      }
      {
        const { c, ctx } = offscreen(34, 18);
        ctx.fillStyle = '#384c66'; ctx.fillRect(2, 6, 2, 12); ctx.fillRect(30, 6, 2, 12);
        ctx.fillStyle = '#5c7594'; ctx.fillRect(2, 10, 30, 4);
        ctx.fillStyle = '#dce8fa'; ctx.fillRect(4, 7, 26, 4);
        ctx.fillStyle = '#c24dff'; ctx.fillRect(5, 6, 8, 3);
        this.nurseBed = c;
      }
    }

    // -----------------------------------------------------------------------
    // G. SIGNS, DOORS 01-03, PROPS & MACHINERY
    // -----------------------------------------------------------------------
    bakePropsAndMachinery() {
      const makeSign = (hdr, lines, badgeBg, glow, seed) => {
        const bh = 16 + lines.length * 7 + 4, h = 10 + bh + 12;
        let mw = measureText(hdr) + 12;
        lines.forEach(l => mw = Math.max(mw, measureText(l.t)));
        const bw = Math.max(96, mw + 14), w = bw + 8, bx = 4;
        const { c, ctx } = offscreen(w, h);
        for (const lx of [bx + 12, bx + bw - 15]) {
          ctx.fillStyle = '#253347'; ctx.fillRect(lx, 10 + bh - 1, 3, 13);
          ctx.fillStyle = '#4c6382'; ctx.fillRect(lx - 3, h - 2, 9, 2);
        }
        ctx.fillStyle = '#080c12'; ctx.fillRect(bx - 1, 9, bw + 2, bh + 2);
        ctx.fillStyle = '#384c66'; ctx.fillRect(bx, 10, bw, bh);
        ctx.fillStyle = '#0f1929'; ctx.fillRect(bx + 2, 12, bw - 4, bh - 4);
        const badgeW = measureText(hdr) + 6;
        ctx.fillStyle = badgeBg; ctx.fillRect(bx + 5, 14, badgeW, 7);
        drawText(ctx, hdr, bx + 8, 15, '#ffffff', '#050812');
        let ly = 24;
        lines.forEach(l => { drawText(ctx, l.t, bx + 6, ly, l.c); ly += 7; });
        const hw = Math.floor(bw * 0.55), hx = bx + Math.floor((bw - hw) / 2);
        ctx.fillStyle = '#253347'; ctx.fillRect(hx + 4, 4, 2, 6); ctx.fillRect(hx + hw - 6, 4, 2, 6);
        ctx.fillStyle = '#3c4f69'; ctx.fillRect(hx, 2, hw, 3);
        c.tube = { x: hx + 2, y: 5, w: hw - 4, h: 2 };
        c.glow = glow; c.seed = seed;
        return c;
      };

      this.signs.school = makeSign('OUTPOST 03', [{ t: 'CLASSROOM A', c: '#cfe8ff' }, { t: 'DOORS 1-3 →', c: '#ffe135' }], '#502473', '#c24dff', 11);
      this.signs.wdf = makeSign('WDF GATE', [{ t: 'DO NOT OPEN', c: '#ff5973' }, { t: 'GIN RUMMY →', c: '#ffe135' }], '#73222b', '#ffaa33', 22);
      this.signs.exterior = makeSign('COPPER-9', [{ t: 'EXTERIOR ZONE', c: '#cfe8ff' }, { t: 'CORPSE SPIRE →', c: '#ffe135' }], '#1d3b5c', '#87d4ff', 33);
      this.signs.evac = makeSign('EVAC BAY', [{ t: 'EMERGENCY', c: '#ff2e4c' }, { t: 'SHELTER →', c: '#ffe135' }], '#731722', '#ff2e4c', 44);

      const mkLamp = (b0, b1) => {
        const { c, ctx } = offscreen(18, 24);
        ctx.fillStyle = '#253347'; ctx.fillRect(8, 0, 2, 7);
        ctx.fillStyle = '#384c66'; ctx.fillRect(4, 6, 10, 4);
        ctx.fillStyle = b0; ctx.fillRect(6, 10, 6, 5);
        ctx.fillStyle = b1; ctx.fillRect(7, 11, 4, 3);
        return c;
      };
      this.lamps.amber = mkLamp('#ffaa00', '#fff5bd');
      this.lamps.red = mkLamp('#ff2e4c', '#ffd6db');

      // Hydraulic Doors 01, 02, 03 (18x52 px)
      for (const num of ['01', '02', '03']) {
        const { c, ctx } = offscreen(18, 52);
        ctx.fillStyle = '#070a10'; ctx.fillRect(0, 0, 18, 52);
        ctx.fillStyle = '#2b394f'; ctx.fillRect(1, 1, 16, 50);
        ctx.fillStyle = '#5c7594'; ctx.fillRect(2, 1, 2, 50);
        for (const hy of [3, 45]) for (let x = 2; x < 16; x++) {
          ctx.fillStyle = ((x >> 1) & 1) ? '#ffe135' : '#18202c'; ctx.fillRect(x, hy, 1, 4);
        }
        ctx.fillStyle = '#0e1724'; ctx.fillRect(3, 18, 12, 14);
        drawText(ctx, num, 5, 22, '#eef4ff', '#050812');
        this.doors[num] = c;
      }

      for (let p = 0; p < 2; p++) {
        const { c, ctx } = offscreen(16, 10);
        ctx.fillStyle = '#080b12'; ctx.fillRect(0, 6, 16, 4);
        ctx.fillStyle = '#2a394f'; ctx.fillRect(1, 7, 14, 2);
        const py = p ? 5 : 3;
        ctx.fillStyle = '#485f7d'; ctx.fillRect(2, py, 12, 4);
        ctx.fillStyle = p ? '#38ff8c' : '#ff2e4c'; ctx.fillRect(6, py + 1, 4, 2);
        this.sw.push(c);
      }

      // Crates, Canisters, Oil Can, Branded Pen, Wrench, Cells, Terminal, Lift
      for (let v = 0; v < 2; v++) {
        const { c, ctx } = offscreen(20, 16);
        ctx.fillStyle = '#090d14'; ctx.fillRect(0, 0, 20, 16);
        ctx.fillStyle = '#28364a'; ctx.fillRect(1, 1, 18, 14);
        ctx.fillStyle = '#536c8a'; ctx.fillRect(1, 1, 18, 2);
        for (let x = 2; x < 18; x++) { ctx.fillStyle = ((x >> 1) & 1) ? '#ffe135' : '#18202c'; ctx.fillRect(x, 7, 1, 3); }
        if (v === 1) { ctx.fillStyle = '#cfe8ff'; ctx.fillRect(2, 0, 8, 2); }
        this.crates.push(c);
      }
      {
        const { c, ctx } = offscreen(14, 20);
        ctx.fillStyle = '#090d14'; ctx.fillRect(2, 2, 10, 18);
        ctx.fillStyle = '#2d3d54'; ctx.fillRect(3, 3, 8, 3); ctx.fillRect(3, 16, 8, 3);
        ctx.fillStyle = '#d4a817'; ctx.fillRect(4, 6, 6, 10);
        ctx.fillStyle = '#ffe135'; ctx.fillRect(5, 7, 3, 8);
        this.canister = c;
      }
      {
        const { c, ctx } = offscreen(12, 14);
        ctx.fillStyle = '#090d14'; ctx.fillRect(2, 3, 8, 10);
        ctx.fillStyle = '#5c7594'; ctx.fillRect(3, 4, 6, 8);
        ctx.fillStyle = '#38ff8c'; ctx.fillRect(4, 7, 4, 3);
        ctx.fillStyle = '#ffe135'; ctx.fillRect(5, 1, 2, 2);
        this.oilCan = c;
      }
      {
        const { c, ctx } = offscreen(12, 4);
        ctx.fillStyle = '#182233'; ctx.fillRect(0, 1, 9, 2);
        ctx.fillStyle = '#ffe135'; ctx.fillRect(9, 1, 3, 2);
        this.pen = c;
      }
      {
        const { c, ctx } = offscreen(14, 6);
        ctx.fillStyle = '#8fa8c7'; ctx.fillRect(2, 2, 9, 2);
        ctx.fillStyle = '#eef4ff'; ctx.fillRect(0, 1, 3, 4); ctx.fillRect(10, 1, 3, 4);
        this.wrench = c;
      }
      for (let f = 0; f < 4; f++) {
        const { c, ctx } = offscreen(10, 12);
        ctx.fillStyle = '#090d14'; ctx.fillRect(2, 1, 6, 10);
        ctx.fillStyle = f % 2 ? '#c24dff' : '#38ff8c'; ctx.fillRect(3, 2, 4, 8);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(4, 3, 2, 4);
        this.cellFrames.push(c);
      }
      {
        const { c, ctx } = offscreen(18, 22);
        ctx.fillStyle = '#090d14'; ctx.fillRect(3, 12, 12, 10);
        ctx.fillStyle = '#2d3d54'; ctx.fillRect(4, 13, 10, 8);
        ctx.fillStyle = '#182230'; ctx.fillRect(1, 1, 16, 12);
        ctx.fillStyle = '#4c6482'; ctx.fillRect(2, 2, 14, 10);
        ctx.fillStyle = '#071410'; ctx.fillRect(3, 3, 12, 8);
        this.terminal = c;
      }
      {
        const { c, ctx } = offscreen(48, 12);
        ctx.fillStyle = '#090d14'; ctx.fillRect(0, 2, 48, 10);
        ctx.fillStyle = '#7b94ad'; ctx.fillRect(1, 2, 46, 2);
        for (let x = 2; x < 46; x++) { ctx.fillStyle = ((x >> 1) & 1) ? '#ffe135' : '#18202c'; ctx.fillRect(x, 5, 1, 3); }
        this.lift = c;
      }
    }

    bakeDOF() {
      const mkBlur = (w, h, fn) => {
        const p = 14, r = offscreen(w + p * 2, h + p * 2), b = offscreen(w + p * 2, h + p * 2, true);
        r.ctx.save(); r.ctx.translate(p, p); fn(r.ctx, w, h); r.ctx.restore();
        if ('filter' in b.ctx) { b.ctx.filter = 'blur(5px)'; b.ctx.drawImage(r.c, 0, 0); b.ctx.filter = 'none'; }
        else b.ctx.drawImage(r.c, 0, 0);
        return b.c;
      };
      for (let i = 0; i < 2; i++) {
        this.dofBot.push(mkBlur(260, 36, (ctx, w, h) => {
          ctx.fillStyle = '#020308'; ctx.beginPath(); ctx.moveTo(-10, h + 10);
          for (let x = 0; x <= w + 10; x += 16) ctx.lineTo(x, h - 8 - hash2D(x, i, 71) * 20);
          ctx.lineTo(w + 10, h + 10); ctx.closePath(); ctx.fill();
        }));
        this.dofTop.push(mkBlur(260, 32, (ctx, w, h) => {
          ctx.fillStyle = '#020308'; ctx.beginPath(); ctx.moveTo(-10, -10);
          for (let x = 0; x <= w + 10; x += 14) ctx.lineTo(x, 8 + hash2D(x, i, 83) * 18);
          ctx.lineTo(w + 10, -10); ctx.closePath(); ctx.fill();
        }));
      }
    }
  }
  MD.AssetFactory = AssetFactory;
})();
