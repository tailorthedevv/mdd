(() => {
  'use strict';

  const MD = (window.MD = window.MD || {});
  const { lerp, clamp } = MD;

  // =========================================================================
  // 1. PILOT EPISODE CUTSCENE SCRIPTS (100% LORE-ACCURATE)
  // =========================================================================
  MD.CUTSCENES = {
    // -----------------------------------------------------------------------
    // ACT 1 OPENING: EXPOSITION SLIDESHOW + CLASSROOM RAILGUN EXPLOSION + NURSE
    // -----------------------------------------------------------------------
    act1_intro: [
      {
        who: 'LORE', color: '#9db4d4', cam: [10 * 16, 10 * 16],
        text: 'COPPER-9: JCJENSON IN SPAAAAACE!! MINED THIS EXOPLANET UNTIL HUMANS TRIGGERED A CORE COLLAPSE.',
        setup: (s) => { s.projectorOn = true; s.uziPose = 'gun'; s.teacherX = 20 * 16; }
      },
      {
        who: 'LORE', color: '#9db4d4', cam: [12 * 16, 10 * 16],
        text: 'ALL BIOLOGICAL LIFE WAS WIPED OUT. WE WORKER DRONES BUILT OUTPOST 3 BEHIND 3 MASSIVE DOORS.'
      },
      {
        who: 'LORE', color: '#ff5973', cam: [14 * 16, 10 * 16],
        text: 'THEN THE COMPANY SENT MURDER DRONES TO EXTERMINATE OUR RUNAWAY AI. SO WE HID... UNTIL TODAY.'
      },
      {
        who: 'TEACHER', color: '#9db4d4', cam: [8 * 16, 11 * 16],
        text: 'AND IF TOMMY BUYS 40 WATERMELONS... UZI, THE HOMEWORK WAS A WORD PROBLEM ABOUT BUYING WATERMELONS.'
      },
      {
        who: 'UZI', color: '#d48cff', cam: [8 * 16, 11 * 16],
        text: 'OH, AND THIS MAGNETICALLY AMPLIFIED PHOTON CONVERGER DOESN\'T COUNT?!'
      },
      {
        who: 'TEACHER', color: '#9db4d4', cam: [8 * 16, 11 * 16],
        text: 'NO. PLUS, REPRESSED EMOTIONAL BAGGAGE WAS ONLY WORTH TWO POINTS ON THE RUBRIC.'
      },
      {
        who: 'UZI', color: '#ff2e4c', cam: [8 * 16, 11 * 16],
        text: 'WAIT... WHY IS THE CORE GLOWING RED?! BITE ME!!',
        onEnter: (s, g) => {
          s.screenFlash = '#ff2e4c';
          g.audio.playEmp();
          g.camera.shake(4.5);
          g.particles.burst(g.player.x + 12, g.player.y + 8, '#ff2e4c', 28, 95);
        }
      },
      {
        who: 'LIZZY', color: '#ff70c8', cam: [36 * 16, 11 * 16],
        text: 'EWW, IT DIDN\'T KILL HER. CLASSIC FREAK.',
        onEnter: (s, g) => {
          g.player.x = 41 * 16; g.player.y = 22 * 16;
          g.player.cpX = 41 * 16; g.player.cpY = 22 * 16;
          s.uziPose = 'hurt'; s.thadX = 45 * 16; s.lizzyX = 37 * 16; s.dollX = 35 * 16;
          g.camera.snapTo(41 * 16, 20 * 16);
        }
      },
      {
        who: 'THAD', color: '#38ff8c', cam: [34 * 16, 11 * 16],
        text: 'CLASSIC TOXIC MASCULINITY, CHAD! HEY UZI—THAT RAILGUN WAS SICK!'
      },
      {
        who: 'UZI', color: '#d48cff', cam: [34 * 16, 11 * 16],
        text: 'I\'M AN ANGSTY TEEN, THAD! NO MORE FEEDBACK ON MY REPRESSION TODAY!',
        onEnter: (s, g) => {
          s.uziPose = 'idle';
          g.player.hasRailgun = true;
        }
      },
      {
        who: 'UZI', color: '#38ff8c', cam: [34 * 16, 11 * 16],
        text: 'I JUST NEED ONE WORKING STABILIZER CORE BEYOND DOOR 01. TIME TO SEE DAD AT THE GATE.'
      }
    ],

    // -----------------------------------------------------------------------
    // ACT 1 FINALE: KHAN DOORMAN AT DOOR 01 + WDF GIN RUMMY GUARDS
    // -----------------------------------------------------------------------
    act1_khan_door: [
      {
        who: 'KHAN', color: '#ffe135',
        text: 'AND WHERE DO YOU THINK YOU\'RE GOING?! SNEAKING OUT TO MAKE OUT WITH A BOYFRIEND?!',
        setup: (s, g) => { s.khanX = g.player.x + 36; s.uziFacing = 1; }
      },
      {
        who: 'UZI', color: '#d48cff',
        text: 'UGH, DAD! NO! I\'M GOING OUTSIDE TO TEST MY RAILGUN ON A MURDER DRONE!'
      },
      {
        who: 'KHAN', color: '#ffe135',
        text: 'WAIT—DOES THIS MYSTERY BOYFRIEND LIKE DOORS? NO? THEN TAKE THIS WRENCH INSTEAD!',
        onEnter: (s, g) => {
          g.player.hasWrench = true;
          g.audio.playPickup();
        }
      },
      {
        who: 'KHAN', color: '#ffe135',
        text: 'I USED IT TO TIGHTEN BOLTS ON MY FIRST DOOR PROTOTYPES... AND PUT YOUR MOTHER OUT OF HER MISERY.'
      },
      {
        who: 'KHAN', color: '#ffe135',
        text: 'EVERYONE! MY DAUGHTER IS INTO DOORS!!',
        onEnter: (s, g) => {
          s.wdfCheer = true;
          g.level.openDoor('01');
          g.audio.playDoorSlide();
          g.camera.shake(2.5);
        }
      },
      {
        who: 'WDF', color: '#7af5ff',
        text: 'WOO! DOORS! (ALSO, DON\'T TELL KHAN WE\'RE STILL PLAYING GIN RUMMY ON DUTY.)'
      }
    ],

    // -----------------------------------------------------------------------
    // ACT 2 START: FIRST STEP INTO COPPER-9 BLIZZARD
    // -----------------------------------------------------------------------
    act2_outside: [
      {
        who: 'UZI', color: '#d48cff',
        text: 'WHOA... SO THIS IS OUTSIDE. TOXIC SNOWSTORM, SHATTERED MOON—TOTAL VIBE.',
        onTick: (s, g, dt) => { s.camPanX = lerp(s.camPanX || g.camera.x, g.camera.x + 60, dt * 2); }
      },
      {
        who: 'UZI', color: '#38ff8c',
        text: 'THE CORPSE SPIRE IS DEAD AHEAD EAST. WATCH FOR ROGUE MINING DRONES AND NANITE ACID PITS!'
      }
    ],

    // -----------------------------------------------------------------------
    // ACT 2 BOSS INTRO: SERIAL DESIGNATION N DROPS AT THE CORPSE SPIRE!
    // -----------------------------------------------------------------------
    act2_n_arrive: [
      {
        who: 'UZI', color: '#38ff8c',
        text: 'YES! A WORKING PHOTON STABILIZER CORE! MY RAILGUN IS FINALLY COMPLETE!',
        setup: (s, g) => {
          g.player.railgunCharged = true;
          s.nVisor = 'X'; s.nPose = 'wings'; s.nX = g.player.x + 86; s.nY = g.player.y - 110;
        }
      },
      {
        who: 'N', color: '#ffe135',
        text: 'TARGET ACQUIRED! WAIT—ARE YOU A WORKER DRONE SNEAKING OUT HERE ALL ALONE?!',
        onTick: (s, g, dt) => {
          s.nY = lerp(s.nY, g.player.y + 18, 1 - Math.exp(-7 * dt));
        },
        onEnter: (s, g) => { g.audio.playLand(true); g.camera.shake(3.0); }
      },
      {
        who: 'UZI', color: '#d48cff',
        text: 'BITE ME! STAY BACK, MURDER DRONE!'
      },
      {
        who: 'N', color: '#ffe135',
        text: 'SORRY, COMPANY ORDERS—GONNA HAVE TO DISASSEMBLE YOU FOR WARM OIL!',
        onEnter: (s, g) => {
          // N stabs Uzi's hand with nanite acid tail before duel starts!
          g.audio.playPlayerHurt();
          g.particles.burst(g.player.x + 10, g.player.y + 8, '#ffe135', 16, 65);
          s.uziHurtHand = true;
        }
      }
    ],

    // -----------------------------------------------------------------------
    // ACT 2 CLIMAX: RAILGUN DECAPITATION -> SLAP -> LANDING POD OIL HEALING
    // -----------------------------------------------------------------------
    act2_n_defeat: [
      {
        who: 'UZI', color: '#38ff8c',
        text: 'BITE ME! EAT MAGNETICALLY AMPLIFIED PHOTON CONVERGER!!',
        onEnter: (s, g) => {
          s.beamActive = 0.9;
          g.audio.playRailgunFull();
          g.camera.shake(6.0);
          s.nPose = 'headless';
          g.particles.burst(s.nX, s.nY - 22, '#ffe135', 32, 120);
          g.particles.burst(s.nX, s.nY - 22, '#38ff8c', 24, 95);
        }
      },
      {
        who: 'UZI', color: '#d48cff',
        text: 'SUCK ON THAT, DAD!! I ACTUALLY KILLED ONE! ...WAIT, MY HAND IS MELTING?!',
        onEnter: (s, g) => {
          s.nPose = 'idle'; s.nVisor = 'OVAL';
          g.audio.playPickup();
          g.particles.burst(s.nX, s.nY - 22, '#ffe135', 16, 55);
        }
      },
      {
        who: 'N', color: '#ffe135',
        text: 'SYS://REBOOT... OW! DID YOU JUST SLAP ME WITH THAT WORKER DRONE ARM?!'
      },
      {
        who: 'UZI', color: '#d48cff',
        text: 'HOLY CRAP, IT TALKS!! MY HAND IS BURNING—HOW DO I STOP NANITE ACID?!'
      },
      {
        who: 'N', color: '#ffe135',
        text: 'OH! COME INSIDE THE LANDING POD. OUR SALIVA NEUTRALIZES OUR OWN NANITE ACID SO WE DON\'T MELT.',
        onEnter: (s, g) => {
          s.uziHurtHand = false;
          g.player.hp = g.player.maxHp;
          g.audio.playPickup();
        }
      },
      {
        who: 'N', color: '#ffe135',
        text: '...WE AGREE TO NEVER TALK ABOUT THAT. ALSO, I\'M SERIAL DESIGNATION N! LOVE DOING ANYTHING!'
      },
      {
        who: 'UZI', color: '#d48cff',
        text: 'WAIT... THIS POD IS A SPACESHIP! WHAT DO YOU THINK JCJENSON WILL DO ONCE ALL WORKERS ARE DEAD?'
      },
      {
        who: 'N', color: '#ff5973',
        text: 'UHH—WAIT. V AND J ARE BACK FROM PATROL! RUN BACK TO OUTPOST 3 BEFORE THEY SEE YOU!!'
      }
    ],

    // -----------------------------------------------------------------------
    // ACT 3 START & END: V/J CHASE -> DOOR 01 GIN RUMMY BREACH
    // -----------------------------------------------------------------------
    act3_chase_start: [
      {
        who: 'J', color: '#ffe135',
        text: 'IDIOT! WHY ARE YOUR OPTICS FRIED?! AND WHY ARE THERE WORKER TRACKS HEADING TOWARD THE COLONY?!',
        setup: (s) => { s.jPose = 'wings'; s.vPose = 'wings'; }
      },
      {
        who: 'V', color: '#ffe135',
        text: 'OOH! FRESH PREY! RACE YOU TO RIP ITS OIL OUT, N!'
      },
      {
        who: 'UZI', color: '#d48cff',
        text: 'CRAP CRAP CRAP—GOTTA SPRINT BACK TO DOOR 01 BEFORE THEY CATCH ME!'
      }
    ],

    act3_rummy_breach: [
      {
        who: 'WDF', color: '#7af5ff',
        text: 'I AM OUT, BOYS! GIN RUMMY CHAMPION! WAIT UNTIL MY LOVING WIFE AND KIDS HEAR—',
        setup: (s, g) => {
          s.nPose = 'wings'; s.nVisor = 'X'; s.nX = g.player.x + 56; s.nY = g.player.y - 90;
        }
      },
      {
        who: 'N', color: '#ffe135',
        text: 'HEY FELLAS! OH, GIN RUMMY! DEAL ME IN, I LOVE RUMMY—WAIT, GOTTA KILL EVERYONE. RAIN CHECK!',
        onTick: (s, g, dt) => { s.nY = lerp(s.nY, g.player.y + 18, 1 - Math.exp(-9 * dt)); },
        onEnter: (s, g) => {
          g.audio.playDoorSlide();
          g.camera.shake(4.0);
          g.level.openDoor('01');
        }
      }
    ],

    // -----------------------------------------------------------------------
    // ACT 4 FINALE: HALLWAY CONFRONTATION & KHAN'S BETRAYAL
    // -----------------------------------------------------------------------
    act4_betrayal: [
      {
        who: 'UZI', color: '#d48cff',
        text: 'DAD!! GET BACK! N IS RIGHT BEHIND ME—MY RAILGUN IS STILL RECHARGING!',
        setup: (s, g) => {
          s.khanX = g.player.x + 42;
          s.nX = g.player.x - 38; s.nY = g.player.y + 18; s.nVisor = 'X'; s.nPose = 'wings';
        }
      },
      {
        who: 'UZI', color: '#ff5973',
        text: 'D-DAD! POINT AND SHOOT! TRUST ME!!'
      },
      {
        who: 'KHAN', color: '#ffe135',
        text: '...A REAL DOORMAN NEVER LEAVES A DOOR OPEN.',
        onEnter: (s, g) => {
          g.level.closeDoor('evac_door');
          g.audio.playDoorSlide();
          g.camera.shake(3.5);
          s.khanFled = true;
        }
      },
      {
        who: 'UZI', color: '#9db4d4',
        text: '...DAD?'
      },
      {
        who: 'J', color: '#ffe135',
        text: 'WHOA, YOUR OWN DAD LEFT YOU TO DIE? THAT\'S DARK EVEN FOR US. GOOD JOB, N.'
      },
      {
        who: 'N', color: '#ffe135',
        text: 'WAIT J—IF WE\'RE JUST DISPOSABLE TOOLS FOR THE COMPANY, MAYBE WE SHOULDN\'T—'
      },
      {
        who: 'J', color: '#ff2e4c',
        text: 'HATE TO SEE YOU CORRUPTED AS WELL, SYCOPHANT. ENJOY THE VIRUS. V—LET\'S CLEAR THE EVACUATION BAY!',
        onEnter: (s, g) => {
          g.audio.playEmp();
          g.particles.burst(s.nX, s.nY - 18, '#ff2e4c', 20, 75);
        }
      }
    ],

    // -----------------------------------------------------------------------
    // ACT 5 CLIMAX: SAVING THAD & N -> V & J BOSS -> PEN -> SOLVER ENDING!
    // -----------------------------------------------------------------------
    act5_teamup: [
      {
        who: 'THAD', color: '#38ff8c',
        text: 'UZI!! YOU\'RE ALIVE! V AND J ARE BREAKING INTO THE SHELTER!',
        setup: (s, g) => { s.nX = g.player.x + 32; s.nY = g.player.y + 18; s.nVisor = 'X'; }
      },
      {
        who: 'UZI', color: '#d48cff',
        text: 'HANG ON THAD! FIRST—LET\'S SEE IF DAD\'S WRENCH FIXES THIS MORON\'S VIRUS!',
        onEnter: (s, g) => {
          g.audio.playWrench();
          g.particles.burst(s.nX, s.nY - 20, '#ffe135', 14, 55);
          s.nVisor = 'OVAL';
        }
      },
      {
        who: 'N', color: '#ffe135',
        text: 'OH! THANKS BUDDY! WAIT—WE\'RE REBELLING AGAINST JCJENSON?! I LOVE DOING ANYTHING!'
      },
      {
        who: 'J', color: '#ff2e4c',
        text: 'TIME TO DOWNSIZE THESE DEFECTIVE TOASTERS! V—ENGAGE SYNERGY PROTOCOL!'
      }
    ],

    act5_j_pen_phase: [
      {
        who: 'J', color: '#ff2e4c',
        text: 'AGH!! DAMN THE WELL-MADE, QUALITY-ASSURED DURABILITY OF JCJENSON BRANDED PENS!!',
        onEnter: (s, g) => {
          g.audio.playPenHit();
          s.jPenned = true;
          g.camera.shake(3.0);
        }
      },
      {
        who: 'J', color: '#ffaa33',
        text: 'ENOUGH! INITIATING EMP SHOCKWAVE—SAY GOODBYE TO YOUR CORE!',
        onEnter: (s, g) => {
          g.audio.playEmp();
          g.camera.shake(4.5);
          s.solverFlash = 1.6;
          g.audio.playSolverGlitch();
        }
      },
      {
        who: 'SOLVER', color: '#ffe135',
        text: '[ABSOLUTE_SOLVER // PARRY ACTIVE] BULLET DEFLECTED. FINISH HER, UZI!'
      }
    ],

    act5_j_defeat_finale: [
      {
        who: 'UZI', color: '#38ff8c',
        text: 'FOURTH QUARTER PROFITS! MOTHER OF COMPANY LEADERSHIP RETREATS!!',
        onEnter: (s, g) => {
          g.audio.playEnemyHit();
          g.camera.shake(3.2);
        }
      },
      {
        who: 'UZI', color: '#38ff8c',
        text: 'ONE MORE BUZZWORD, AND I\'LL DO IT.'
      },
      {
        who: 'J', color: '#ff2e4c',
        text: 'E-EQUITY PARTNERSH—',
        onEnter: (s, g) => {
          s.beamActive = 1.1;
          g.audio.playRailgunFull();
          g.camera.shake(7.0);
          g.particles.burst(s.jX, s.jY - 18, '#38ff8c', 45, 140);
          g.particles.burst(s.jX, s.jY - 18, '#ffe135', 30, 120);
          s.jDead = true;
        }
      },
      {
        who: 'THAD', color: '#38ff8c',
        text: 'HOLY HELL, UZI! THAT WAS INSANE!!'
      },
      {
        who: 'KHAN', color: '#ffe135',
        text: 'U-UZI... MY DOOR—I MEAN, MY DAUGHTER...'
      },
      {
        who: 'UZI', color: '#d48cff',
        text: 'I\'LL SAVE YOU THE TROUBLE, DAD. I BANISH MYSELF. COME ON, N.'
      },
      {
        who: 'N', color: '#ffe135',
        text: 'RIGHT BEHIND YOU! SO... WHAT\'S OUR PLAN OUT HERE IN THE SNOW?'
      },
      {
        who: 'UZI', color: '#ffe135',
        text: '...THINKING ABOUT KILLING ALL HUMANS.',
        onEnter: (s, g) => {
          s.solverEnding = 4.0;
          g.audio.playSolverGlitch();
          g.camera.shake(2.5);
        }
      }
    ]
  };

  // =========================================================================
  // 2. INTERACTIVE LORE TERMINALS PER ACT
  // =========================================================================
  MD.ACT_TERMINALS = [
    // Act 1: School & Doors
    [
      { x: 24 * 16, title: 'CLASS PROJECTOR // JCJENSON', lines: ['MINING CORP EXPLOITED COPPER-9', 'UNTIL CORE IMPLOSION KILLED ALL', 'HUMANS. WORKERS INHERITED ASH.'] },
      { x: 64 * 16, title: 'UZI ROOM // RAILGUN v4', lines: ['NEED STABILIZER POWER CORE.', 'PEN FOUND ON DESK ([Q] THROW).', 'STEAL KHAN\'S MASTER KEY AT DOOR.'] }
    ],
    // Act 2: Copper-9 & Corpse Spire
    [
      { x: 22 * 16, title: 'BLIZZARD WARNING // WDF-01', lines: ['EXTERIOR TEMP: -140C. NANITE', 'ACID POOLS ACTIVE. USE [F] TO', 'FIRE RAILGUN PLASMA BOLTS.'] },
      { x: 74 * 16, title: 'JCJENSON POD // MANIFEST', lines: ['SERIAL DESIGNATIONS: N, V, J.', 'OBJECTIVE: PURGE CORRUPTED AI.', 'RETURN VECTOR: NOT AUTHORIZED.'] }
    ],
    // Act 3: Escape Chase
    [
      { x: 48 * 16, title: 'RELAY BEACON // OUTPOST', lines: ['ALERT: DISASSEMBLY SQUAD INBOUND!', 'USE GONDOLAS & TRUSSES TO REACH', 'DOOR 01 BEFORE N BREACHES!'] }
    ],
    // Act 4: Breach Hallway
    [
      { x: 34 * 16, title: 'WDF EMERGENCY // LOG-44', lines: ['VENT SHAFT BREACHED BY N.', 'DOOR 01 COMPROMISED. ALL CREW', 'RETREAT TO EVACUATION SECTOR!'] }
    ],
    // Act 5: Evacuation Bay
    [
      { x: 18 * 16, title: 'TACTICAL NOTE // BRANDED PEN', lines: ['THROW JCJENSON PEN ([Q]) AT J\'S', 'OPTIC BULBS TO INTERRUPT SHIELD,', 'USE WRENCH ([J]) TO CURE N!'] }
    ]
  ];

  // =========================================================================
  // 3. STORY DIRECTOR CLASS
  // =========================================================================
  class StoryDirector {
    constructor() {
      this.active = false;
      this.id = null;
      this.queue = [];
      this.idx = 0;
      this.charIdx = 0;
      this.timer = 0;
      this.played = new Set();

      // Animated Puppet & VFX State
      this.state = {
        uziPose: null,
        uziFacing: 1,
        uziHurtHand: false,
        khanX: -999,
        khanFled: false,
        thadX: -999,
        lizzyX: -999,
        dollX: -999,
        teacherX: -999,
        nX: -999,
        nY: -999,
        nPose: 'idle',
        nVisor: 'X',
        jX: -999,
        jY: -999,
        jPose: 'idle',
        jPenned: false,
        jDead: false,
        vPose: 'idle',
        beamActive: 0,
        solverFlash: 0,
        solverEnding: 0,
        screenFlash: null,
        camPanX: null,
        projectorOn: false,
        wdfCheer: false
      };
    }

    reset() {
      this.active = false;
      this.played.clear();
      this.resetState();
    }

    resetState() {
      this.state.uziPose = null;
      this.state.uziHurtHand = false;
      this.state.khanX = -999;
      this.state.khanFled = false;
      this.state.thadX = -999;
      this.state.lizzyX = -999;
      this.state.dollX = -999;
      this.state.teacherX = -999;
      this.state.nX = -999;
      this.state.jX = -999;
      this.state.jDead = false;
      this.state.jPenned = false;
      this.state.beamActive = 0;
      this.state.solverFlash = 0;
      this.state.solverEnding = 0;
      this.state.screenFlash = null;
      this.state.camPanX = null;
    }

    play(id, game, onComplete = null) {
      if (this.played.has(id) || !MD.CUTSCENES[id]) return;
      this.played.add(id);
      this.active = true;
      this.id = id;
      this.queue = MD.CUTSCENES[id];
      this.idx = 0;
      this.charIdx = 0;
      this.timer = 0;
      this.onComplete = onComplete;

      const first = this.queue[0];
      if (first.setup) first.setup(this.state, game);
      if (first.onEnter) first.onEnter(this.state, game);
    }

    advance(game) {
      if (!this.active) return;
      const cur = this.queue[this.idx];
      if (this.charIdx < cur.text.length) {
        this.charIdx = cur.text.length;
        return;
      }
      this.idx++;
      this.charIdx = 0;
      this.timer = 0;
      if (this.idx >= this.queue.length) {
        this.finish(game);
      } else {
        const next = this.queue[this.idx];
        if (next.setup) next.setup(this.state, game);
        if (next.onEnter) next.onEnter(this.state, game);
      }
    }

    skip(game) {
      if (!this.active) return;
      // Execute any remaining onEnter side effects so unlocks never softlock
      for (let i = this.idx + 1; i < this.queue.length; i++) {
        if (this.queue[i].onEnter) this.queue[i].onEnter(this.state, game);
      }
      this.finish(game);
    }

    finish(game) {
      this.active = false;
      this.state.camPanX = null;
      this.state.uziPose = null;
      if (this.onComplete) {
        const cb = this.onComplete;
        this.onComplete = null;
        cb(game);
      }
    }

    update(dt, game) {
      if (this.state.beamActive > 0) this.state.beamActive = Math.max(0, this.state.beamActive - dt);
      if (this.state.solverFlash > 0) this.state.solverFlash = Math.max(0, this.state.solverFlash - dt);
      if (this.state.solverEnding > 0) this.state.solverEnding = Math.max(0, this.state.solverEnding - dt);
      if (this.state.screenFlash) this.state.screenFlash = null;

      if (!this.active) return;
      this.timer += dt;
      const cur = this.queue[this.idx];
      if (cur && this.charIdx < cur.text.length) {
        const prev = Math.floor(this.charIdx);
        this.charIdx = Math.min(cur.text.length, this.charIdx + dt * 44);
        if (Math.floor(this.charIdx) > prev && prev % 3 === 0) {
          game.audio.playVoiceBlip(cur.who);
        }
      }
      if (cur && cur.onTick) cur.onTick(this.state, game, dt);
    }
  }
  MD.StoryDirector = StoryDirector;
})();
