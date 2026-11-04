// VVS
(() => {
  'use strict';

  const RAMP = ' .:-=+*cxoaX#%&@';
  const WORLD_W = 1000;
  const WORLD_H = 1100;
  const FPS = 30;

  const PALETTES = [
    { // paletas rosa
      petal: '#f39ab2', edge: '#f9c3d2', blush: '#d99aa6', throat: '#c9dc78', vein: 'rgba(170,40,80,0.45)',
      anther: '#4a1d10', spots: true,
    },
    { // paletas blanca
      petal: '#f6f2ea', edge: '#ffffff', blush: '#d8dcc0', throat: '#c8d87a', vein: 'rgba(120,130,90,0.4)',
      anther: '#8a3a16', spots: false,
    },
    { // mix
      petal: ['#e3233a', '#d24aa9', '#f08a2a', '#e9c63c', '#f1e4c6', '#f39ab2'], edge: null,
      blush: '#c98a7a', throat: '#e8d070', vein: 'rgba(80,10,20,0.45)', anther: '#3a160a', spots: true,
    },
  ];

  // ---------- helpers ----------
  function rng(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (T, start, dur) => clamp((T - start) / dur, 0, 1);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  // "pop"
  const easeOutBack = (t, k = 1.70158) => 1 + (k + 1) * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const smooth = (a, b, t) => { const x = clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
  const rad = (d) => (d * Math.PI) / 180;

  function rgbOf(c) {
    if (c[0] === '#') {
      const n = parseInt(c.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    return c.match(/\d+/g).slice(0, 3).map(Number);
  }
  function mix(a, b, t) {
    const A = rgbOf(a), B = rgbOf(b);
    return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`;
  }

  function bez(p, t) {
    const u = 1 - t;
    return [
      u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0],
      u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1],
    ];
  }
  function bezAngle(p, t) {
    const a = bez(p, Math.max(0, t - 0.01)), b = bez(p, Math.min(1, t + 0.01));
    return Math.atan2(b[1] - a[1], b[0] - a[0]);
  }

  let T = 0;
  function sway(x, y) {
    const lift = clamp((1090 - y) / 800, 0, 1);
    return [x + Math.sin(T * 0.9 + y * 0.006) * 8 * lift + Math.sin(T * 0.43 + x * 0.004) * 4 * lift, y];
  }

  // ---------- scene ----------
  const STEM_START = 0, STEM_DUR = 2.6;
  const LEAF_START = 1.0;
  const BUD_START = 2.2;
  const BLUSH_START = 3.6;
  const OPEN_START = 5.0, OPEN_GAP = 0.85, OPEN_DUR = 3.2;

  function buildScene() {
    const r = rng(11);
    const S = { stems: [], leaves: [], buds: [] };

    // [top x, top y, side pedicels]
    const tops = [
      [310, 470, 2], [395, 360, 2], [500, 300, 3], [600, 350, 2],
      [700, 420, 2], [740, 500, 1], [350, 560, 1], [650, 560, 1],
    ];
    for (const [tx, ty, sides] of tops) {
      const bx = 485 + r() * 30;
      const stem = [[bx, 1090], [bx + (tx - bx) * 0.1, 860], [lerp(bx, tx, 0.7), ty + 220], [tx, ty]];
      const lean = (tx - 500) * 0.1;
      const stemRef = { pts: stem, start: STEM_START + r() * 0.4 };
      S.stems.push(stemRef);

      // medio de las stems
      const n = 5 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) {
        const t = 0.22 + (i / n) * 0.5 + r() * 0.04;
        const side = i % 2 ? 1 : -1;
        S.leaves.push({
          stem, t, side, len: 85 + r() * 55, w: 13 + r() * 6,
          spread: rad(28 + r() * 26), start: LEAF_START + t * 1.5 + r() * 0.3, tint: r(),
        });
      }

      // buds
      S.buds.push({ stem, stemRef, at: 1, ped: null, dir: rad(-90 + lean + (r() - 0.5) * 10) });
      for (let k = 0; k < sides; k++) {
        const side = k % 2 ? 1 : -1;
        const at = 0.82 + r() * 0.12;
        const base = bez(stem, at);
        const ang = rad(-90 + lean + side * (30 + r() * 25));
        const len = 40 + r() * 45;
        const end = [base[0] + Math.cos(ang) * len, base[1] + Math.sin(ang) * len];
        const ped = [base, [lerp(base[0], end[0], 0.3), base[1] - len * 0.35], [lerp(base[0], end[0], 0.8), lerp(base[1], end[1], 0.7)], end];
        S.buds.push({ stem, stemRef, at, ped, dir: ang });
      }
    }

    // matematica buds
    const order = S.buds.map((_, i) => i).sort(() => r() - 0.5);
    order.forEach((idx, rank) => {
      const b = S.buds[idx];
      b.len = 120 + r() * 40;
      b.width = 19 + r() * 5;
      b.squash = 0.6 + r() * 0.25;
      b.twist = (r() - 0.5) * 0.8;
      b.droop = rad((b.dir > rad(-90) ? 1 : -1) * (15 + r() * 20));
      b.colorIdx = rank;
      b.rnd = Array.from({ length: 12 }, r);
      b.grow = BUD_START + r() * 1.2;
      if (rank < 7) {
        b.maxOpen = 1; b.blush = 1; b.openAt = OPEN_START + rank * OPEN_GAP + r() * 0.3;
      } else if (rank < 11) {
        b.maxOpen = 0.08; b.blush = 0.8; b.openAt = OPEN_START + 2 + r() * 4;
      } else {
        b.maxOpen = 0; b.blush = 0.1 + r() * 0.2; b.openAt = Infinity; b.len *= 0.75;
      }
    });
    addFillers(S);
    return S;
  }

  // quien sos y por que estas leyendo el codigo
  const RUSCUS_START = 0.6;
  const GYP_START = 2.4;

  function addFillers(S) {
    const r = rng(29);
    S.ruscus = [];
    S.gyp = [];

    // ruscus
    const sprig = (base, ang, len, start, depth) => {
      const end = [base[0] + Math.cos(ang) * len, base[1] + Math.sin(ang) * len];
      const bend = (r() - 0.5) * len * 0.3;
      const pts = [base, [lerp(base[0], end[0], 0.33) + bend, lerp(base[1], end[1], 0.33)],
        [lerp(base[0], end[0], 0.7) + bend * 0.5, lerp(base[1], end[1], 0.7)], end];
      const leaves = [];
      for (let t = 0.2 + r() * 0.08, i = 0; t <= 1; t += 0.075 + r() * 0.035, i++) {
        leaves.push({ t, side: i % 2 ? 1 : -1, len: 34 + r() * 18, w: 10 + r() * 4, tint: r() });
      }
      leaves.push({ t: 1, side: 0, len: 46 + r() * 16, w: 11, tint: r() });
      S.ruscus.push({ pts, leaves, start });
      if (depth > 0) {
        for (let k = 0; k < 2; k++) {
          const t = 0.35 + r() * 0.35;
          const p = bez(pts, t);
          const side = k ? 1 : -1;
          sprig(p, ang + side * rad(25 + r() * 20), len * (0.4 + r() * 0.2), start + t * 1.4, depth - 1);
        }
      }
    };
  
    for (const end of [[210, 560], [270, 340], [420, 215], [600, 205], [750, 320], [810, 560]]) {
      const base = [490 + r() * 20, 820 - r() * 40];
      const ang = Math.atan2(end[1] - base[1], end[0] - base[0]);
      sprig(base, ang, Math.hypot(end[0] - base[0], end[1] - base[1]), RUSCUS_START + r() * 0.8, 0);
    }


    const clouds = [
      [340, 460], [660, 430], [500, 330], [280, 610], [740, 610],
      [450, 610], [590, 640], [400, 340], [620, 340], [520, 520],
    ];
    clouds.forEach(([cx, cy], ci) => {
      const base = [485 + r() * 30, 1000 + r() * 60];
      const start = GYP_START + ci * 0.12 + r() * 0.4;
      const outward = Math.atan2(cy - 620, cx - 500);
      const segs = [], flowers = [];
      const branch = (x, y, ang, len, depth, t) => {
        const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
        segs.push({ x, y, x2, y2, t, w: 1.5 + depth * 0.8 });
        const t2 = t + 0.18;
        if (depth === 0) {
          flowers.push({ x: x2, y: y2, s: 4.5 + r() * 3.5, t: t2 + r() * 0.3, puffs: 2 + Math.floor(r() * 2) });
          return;
        }
        if (depth < 3 && r() < 0.75) flowers.push({ x: x2, y: y2, s: 3.5 + r() * 2.5, t: t2 + r() * 0.3, puffs: 1 });
        const kids = 2 + (r() < 0.45 ? 1 : 0);
        for (let k = 0; k < kids; k++) {
          const spread = rad(lerp(-70, 70, kids === 1 ? 0.5 : k / (kids - 1)) + (r() - 0.5) * 30);
          const target = lerp(ang + spread, outward, 0.25);
          branch(x2, y2, target, len * (0.4 + r() * 0.45), depth - 1, t2);
        }
      };
      const main = [[base[0], base[1]], [lerp(base[0], cx, 0.2), lerp(base[1], cy, 0.5)], [lerp(base[0], cx, 0.8), cy + 60], [cx, cy + 40]];
      branch(cx, cy + 40, outward * 0.5 - Math.PI / 4, 40 + r() * 10, 4, 0.6);
      S.gyp.push({ main, segs, flowers, start, front: ci % 2 === 1 });
    });
  }

  // ---------- drawing ----------
  function strokeCurve(g, pts, from, upto, width, color) {
    if (upto <= from) return;
    const N = 36;
    g.beginPath();
    for (let i = 0; i <= N; i++) {
      const p = bez(pts, lerp(from, upto, i / N));
      const q = sway(p[0], p[1]);
      i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]);
    }
    g.lineWidth = width;
    g.strokeStyle = color;
    g.lineCap = 'round';
    g.stroke();
  }

  function stemProgress(st) {
    return easeInOut(prog(T, st.start, STEM_DUR));
  }

  function drawLeaf(g, lf) {
    const p = easeOut(prog(T, lf.start, 1.4));
    if (!p) return;
    const a = bez(lf.stem, lf.t);
    const [x, y] = sway(a[0], a[1]);
    const ang = bezAngle(lf.stem, lf.t) + lf.side * lf.spread * (0.4 + 0.6 * p);
    const L = lf.len * p, W = lf.w * (0.4 + 0.6 * p);
    g.save();
    g.translate(x, y);
    g.rotate(ang);
    const bend = lf.side * L * 0.18;
    g.beginPath();
    g.moveTo(0, 0);
    g.bezierCurveTo(L * 0.3, -W, L * 0.7, -W * 0.8 + bend * 0.5, L, bend);
    g.bezierCurveTo(L * 0.7, W * 0.8 + bend * 0.5, L * 0.3, W, 0, 0);
    const grad = g.createLinearGradient(0, 0, L, 0);
    grad.addColorStop(0, '#2e6e22');
    grad.addColorStop(0.5, lf.tint > 0.5 ? '#4c9a2e' : '#3f8a2a');
    grad.addColorStop(1, '#78bc44');
    g.fillStyle = grad;
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.55)';
    g.lineWidth = 5;
    g.stroke();
    g.strokeStyle = 'rgba(20,60,15,0.8)';
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * 0.6, bend * 0.3, L * 0.95, bend * 0.95); g.stroke();
    g.restore();
  }


  function tepal(g, L, W, color, edge, throat, vein, open, curl, spots, rnd) {
    const rc = smooth(0.45, 1, open);
    const tipX = L * (1 - 0.12 * rc), tipY = curl * W * 1.6 * rc;
    g.beginPath();
    g.moveTo(0, 0);
    g.bezierCurveTo(L * 0.3, -W * 0.85, L * 0.72, -W * 1.05 + tipY * 0.3, tipX, tipY);
    g.bezierCurveTo(L * 0.72, W * 1.05 + tipY * 0.3, L * 0.3, W * 0.85, 0, 0);
    const grad = g.createLinearGradient(0, 0, L, 0);
    grad.addColorStop(0, throat);
    grad.addColorStop(lerp(0.45, 0.22, open), color);
    grad.addColorStop(1, edge);
    g.fillStyle = grad;
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.65)';
    g.lineWidth = 6;
    g.stroke();
    // seam on the bud, nectar groove on the open tepal
    g.strokeStyle = open > 0.2 ? vein : 'rgba(40,70,20,0.55)';
    g.lineWidth = 5;
    g.beginPath(); g.moveTo(L * 0.05, 0); g.quadraticCurveTo(L * 0.6, tipY * 0.2, tipX * 0.94, tipY * 0.9); g.stroke();
    if (spots && open > 0.6) {
      g.fillStyle = `rgba(110,15,40,${(open - 0.6) * 2})`;
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.arc(L * (0.18 + rnd[i] * 0.22), (rnd[i + 4] - 0.5) * W * 0.8, 3.5, 0, Math.PI * 2);
        g.fill();
      }
    }
  }

  function budState(b) {
    const grow = easeOut(prog(T, b.grow, 2.2));
    const blush = smooth(0, 1, prog(T, BLUSH_START + (b.grow - BUD_START), 2.5)) * b.blush;
    const p = prog(T, b.openAt, OPEN_DUR);
    const open = easeOutBack(p * p, 1.6) * b.maxOpen;
    return { grow, blush, open };
  }

  function drawBud(g, b, pal) {
    const sp = stemProgress(b.stemRef);
    if (b.ped) {
      if (sp < b.at) return;
      const pp = easeOut(prog(T, b.stemRef.start + STEM_DUR * b.at, 1.0));
      strokeCurve(g, b.ped, 0, pp, 5, '#5f9a34');
      if (pp < 0.6) return;
    } else if (sp < 0.98) {
      return;
    }
    const { grow, blush, open } = budState(b);
    if (!grow) return;

    const base = b.ped ? b.ped[3] : bez(b.stem, 1);
    const [x, y] = sway(base[0], base[1]);
    const multi = Array.isArray(pal.petal);
    const petal = multi ? pal.petal[b.colorIdx % pal.petal.length] : pal.petal;
    const edge = pal.edge || mix(petal, '#ffffff', 0.25);

    // bud colour: green → dusty pink as it matures → petal colour as it opens
    const budCol = mix('#9cc63e', pal.blush, blush);
    const color = mix(budCol, petal, smooth(0.05, 0.45, open));
    const edgeCol = mix(mix('#b4d860', pal.blush, blush), edge, smooth(0.05, 0.45, open));
    const throat = mix('#8fbf3a', pal.throat, open);

    const L = b.len * (0.3 + 0.7 * grow) * (1 + 0.3 * open);
    const W = b.width * (0.6 + 0.4 * grow) * (1 + 1.4 * open);

    g.save();
    g.translate(x, y);
    g.rotate(b.dir + b.droop * open);
    g.scale(1, lerp(1, b.squash, open));
    g.fillStyle = '#5f9a34';
    g.beginPath(); g.ellipse(0, 0, 9, 7, 0, 0, Math.PI * 2); g.fill();
    g.rotate(b.twist * open);
    for (const k of [3, 1, -1, 2, -2, 0]) {
      g.save();
      g.rotate(rad(k * 60) * open);
      const wob = 1 + (b.rnd[(k + 3) % 12] - 0.5) * 0.12 * open;
      tepal(g, L * wob, W, color, edgeCol, throat, pal.vein, open, k === 0 ? 0.3 : Math.sign(k) || 1, pal.spots, b.rnd);
      g.restore();
    }
    const st = smooth(0.55, 1, open);
    if (st > 0) {
      for (let i = 0; i < 6; i++) {
        const a = rad(-28 + i * 11);
        const l = L * 0.72 * st * (0.92 + b.rnd[i] * 0.16);
        g.strokeStyle = '#d6dca8';
        g.lineWidth = 3;
        g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(l * 0.5, a * l * 0.3, Math.cos(a) * l, Math.sin(a) * l); g.stroke();
        g.fillStyle = pal.anther;
        g.beginPath(); g.ellipse(Math.cos(a) * l, Math.sin(a) * l, 11, 4.5, a + Math.PI / 2, 0, Math.PI * 2); g.fill();
      }
      const pl = L * 0.82 * st;
      g.strokeStyle = '#cfe0a0';
      g.lineWidth = 4;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(pl, 0); g.stroke();
      g.fillStyle = '#86a83c';
      g.beginPath(); g.arc(pl, 0, 7, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }

  function leafShape(g, L, W, bend) {
    g.beginPath();
    g.moveTo(0, 0);
    g.bezierCurveTo(L * 0.25, -W, L * 0.7, -W * 0.8 + bend * 0.5, L, bend);
    g.bezierCurveTo(L * 0.7, W * 0.8 + bend * 0.5, L * 0.25, W, 0, 0);
  }

  function drawRuscus(g, S) {
    for (const sp of S.ruscus) {
      const p = easeOut(prog(T, sp.start, 2.2));
      if (!p) continue;
      strokeCurve(g, sp.pts, 0, p, 4, '#4f7a34');
      for (const lf of sp.leaves) {
        const lp = easeOut(prog(p, lf.t - 0.04, 0.22));
        if (!lp) continue;
        const a = bez(sp.pts, lf.t);
        const [x, y] = sway(a[0], a[1]);
        g.save();
        g.translate(x, y);
        g.rotate(bezAngle(sp.pts, lf.t) + lf.side * rad(38));
        const L = lf.len * lp, W = lf.w * lp;
        leafShape(g, L, W, lf.side * L * 0.08);
        const grad = g.createLinearGradient(0, -W, L, W);
        grad.addColorStop(0, lf.tint > 0.5 ? '#356a2c' : '#2c5f30');
        grad.addColorStop(0.55, lf.tint > 0.5 ? '#5aa046' : '#4c9240');
        grad.addColorStop(1, '#3a7436');
        g.fillStyle = grad;
        g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.6)';
        g.lineWidth = 4;
        g.stroke();
        g.strokeStyle = 'rgba(150,190,110,0.5)';
        g.lineWidth = 2;
        g.beginPath(); g.moveTo(0, 0); g.lineTo(L * 0.85, lf.side * L * 0.06); g.stroke();
        g.restore();
      }
    }
  }

  function drawGyp(g, S, front) {
    for (const c of S.gyp) {
      if (c.front !== front) continue;
      const p = prog(T, c.start, 3.2);
      if (!p) continue;
      strokeCurve(g, c.main, 0, easeOut(Math.min(1, p * 3)), 3, '#6b8a4a');
      const local = p * 3.2 - 0.6; // seconds since the branching began
      g.strokeStyle = '#6f8f50';
      for (const sg of c.segs) {
        const k = clamp((local - sg.t) / 0.25, 0, 1);
        if (!k) continue;
        const [x, y] = sway(sg.x, sg.y), [x2, y2] = sway(sg.x2, sg.y2);
        g.lineWidth = sg.w;
        g.beginPath(); g.moveTo(x, y); g.lineTo(lerp(x, x2, k), lerp(y, y2, k)); g.stroke();
      }
      for (const f of c.flowers) {
        const k = easeOut(clamp((local - f.t) / 0.5, 0, 1));
        if (!k) continue;
        const [x, y] = sway(f.x, f.y);
        const tw = 0.88 + 0.12 * Math.sin(T * 2.5 + f.x * 0.3);
        g.fillStyle = `rgba(252,250,244,${tw})`;
        for (let i = 0; i < f.puffs; i++) {
          g.beginPath();
          g.arc(x + (i - (f.puffs - 1) / 2) * f.s * 0.9, y - (i % 2) * f.s * 0.6, f.s * k, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
  }

  const VISITOR_NAMES = ['butterfly', 'bee', 'ladybug', 'none'];
  const WING_NAMES = ['blue', 'lilac', 'yellow', 'orange', 'mint', 'white'];

  // ---------- gift wrapping ----------
  // el mensaje se pone con (?to=&from=&msg=) en la url y queda al costado del bow.
  const BOW_START = 2.8, BOW_Y = 960;
  const TAG_START = 3.8, TYPE_SPEED = 16; // caracteres por segundo
  const RIBBON = { main: '#ff86b0', dark: '#b8406e', light: '#ffc6da' };
  let tagHole = null; // posicion de tag

  function drawBow(g) {
    const p = prog(T, BOW_START, 0.9);
    if (!p) return;
    const [x, y] = sway(500, BOW_Y);
    g.save();
    g.translate(x, y);
    const bw = 44 * easeOut(Math.min(1, p * 2.5));
    g.fillStyle = RIBBON.dark;
    g.beginPath(); g.roundRect(-bw, -11, bw * 2, 22, 8); g.fill();
    g.scale(1.25, 1.25);
    const s = easeOutBack(p, 2.4);
    g.scale(s, s);
    g.strokeStyle = 'rgba(0,0,0,0.6)';
    g.lineWidth = 5;
    for (const side of [-1, 1]) {
      g.save();
      g.rotate(Math.sin(T * 1.7 + side) * 0.05);
      g.beginPath();
      g.moveTo(side * 2, 6); g.lineTo(side * 20, 2);
      g.lineTo(side * 58, 94); g.lineTo(side * 43, 84); g.lineTo(side * 31, 104);
      g.closePath();
      g.fillStyle = RIBBON.main; g.fill(); g.stroke();
      g.restore();
    }
    for (const side of [-1, 1]) {
      g.save();
      g.rotate(Math.sin(T * 2.1 + side * 1.3) * 0.06);
      g.beginPath();
      g.moveTo(0, 0);
      g.bezierCurveTo(side * 28, -62, side * 98, -54, side * 84, -6);
      g.bezierCurveTo(side * 74, 30, side * 30, 22, 0, 0);
      const grad = g.createLinearGradient(0, 0, side * 90, -30);
      grad.addColorStop(0, RIBBON.dark);
      grad.addColorStop(0.45, RIBBON.main);
      grad.addColorStop(1, RIBBON.light);
      g.fillStyle = grad; g.fill(); g.stroke();
      g.beginPath();
      g.moveTo(side * 14, -4);
      g.bezierCurveTo(side * 30, -36, side * 70, -32, side * 66, -9);
      g.bezierCurveTo(side * 58, 8, side * 30, 6, side * 14, -4);
      g.fillStyle = 'rgba(90,20,50,0.75)'; g.fill();
      g.restore();
    }
    // knot
    g.beginPath(); g.ellipse(0, 0, 17, 15, 0, 0, Math.PI * 2);
    g.fillStyle = RIBBON.main; g.fill(); g.stroke();
    g.beginPath(); g.ellipse(-4, -5, 6, 4, -0.4, 0, Math.PI * 2);
    g.fillStyle = RIBBON.light; g.fill();
    g.restore();
  }

  // añadir comentarios
  function drawTagString(g) {
    if (!tagHole) return;
    const p = easeOut(prog(T, TAG_START, 0.5));
    if (!p) return;
    const [x, y] = sway(512, BOW_Y + 6);
    const [hx, hy] = tagHole;
    const cx = (x + hx) / 2, cy = Math.max(y, hy) + 30;
    g.beginPath();
    g.moveTo(x, y);
    const N = 20;
    for (let i = 1; i <= N * p; i++) {
      const t = i / N, u = 1 - t;
      g.lineTo(u * u * x + 2 * u * t * cx + t * t * hx, u * u * y + 2 * u * t * cy + t * t * hy);
    }
    g.strokeStyle = '#efe2c8';
    g.lineWidth = 3;
    g.stroke();
  }

  // ?to=M&from=Valen&msg=happy%20birthday
  const params = new URLSearchParams(location.search);
  const settings = {
    visitor: VISITOR_NAMES.includes(params.get('bug')) ? params.get('bug') : 'butterfly',
    wing: (params.get('wing') || 'blue').toLowerCase(),
    ribbon: !/^(0|off|no|false)$/i.test(params.get('ribbon') || ''),
  };
  if (!/^(blue|lilac|yellow|orange|mint|white|#?[0-9a-f]{6})$/.test(settings.wing)) settings.wing = 'blue';
  const cut = (v) => Array.from(v.trim()).slice(0, 22).join('');
  const TAG_LINES = [
    params.get('to') && `for ${cut(params.get('to'))} ♡`,
    params.get('msg') && cut(params.get('msg')),
    params.get('from') && `xoxo, ${cut(params.get('from'))}`,
  ].filter(Boolean);
  if (TAG_LINES.length === 1) TAG_LINES.push('');
  if (params.get('to')) document.title = `for ${cut(params.get('to'))} ♡`;


  function tagRows() {
    const w = Math.max(...TAG_LINES.map((l) => Array.from(l).length)) + 4;
    const frame = (str) => Array.from(str).map((ch) => [ch, ch === ' ' ? null : 'frame']);
    const rows = [frame('  .' + '-'.repeat(w) + '.')];
    let n = 0;
    TAG_LINES.forEach((l, i) => {
      const lead = i === 0 ? ' /o' : i === TAG_LINES.length - 1 ? ' \\ ' : ' | ';
      const row = frame(lead);
      if (i === 0) row[2] = ['o', 'hole'];
      const chars = Array.from(l);
      for (let c = 0; c < w; c++) {
        const ch = chars[c - 2];
        row.push(ch && ch !== ' ' ? [ch, ch === '♡' ? 'heart' : 'text', n++] : [' ', 'blank']);
      }
      row.push(['|', 'frame']);
      rows.push(row);
    });
    rows.push(frame("  '" + '-'.repeat(w) + "'"));
    return rows;
  }
  const TAG = TAG_LINES.length ? tagRows() : null;

  // ---------- butterfly, bee or ladybug ----------
  const BF_START = 10.5, BF_FLY = 3, BF_SIT = 3.5, BF_REST = 6;
  const BF_PERIOD = 4 * BF_FLY + 3 * BF_SIT + BF_REST;

  function landingSpot(b) {
    const { open } = budState(b);
    const base = b.ped ? b.ped[3] : bez(b.stem, 1);
    const [x, y] = sway(base[0], base[1]);
    const ang = b.dir + b.droop * open;
    const d = b.len * (1 + 0.3 * open) * 0.4;
    return [x + Math.cos(ang) * d, y + Math.sin(ang) * d - 20];
  }

  function butterflyState(S) {
    const t = T - BF_START;
    if (t < 0) return null;
    const cycle = Math.floor(t / BF_PERIOD);
    let local = t - cycle * BF_PERIOD;

    const r = rng(100 + cycle);
    const opened = S.buds.filter((b) => b.maxOpen === 1);
    const stops = opened.map((b) => [r(), b]).sort((a, b) => a[0] - b[0]).slice(0, 3).map(([, b]) => landingSpot(b));
    const fromLeft = cycle % 2 === 0;
    const pts = [[fromLeft ? -700 : 1700, -150 + r() * 200], ...stops, [fromLeft ? 1700 : -700, -250 + r() * 200]];

    for (let leg = 0; leg < 4; leg++) {
      if (local < BF_FLY) {
        const u = local / BF_FLY, e = easeInOut(u);
        const [a, b] = [pts[leg], pts[leg + 1]];
        const x = lerp(a[0], b[0], e) + Math.sin(u * Math.PI * 2) * 30;
        const y = lerp(a[1], b[1], e) - Math.sin(u * Math.PI) * 90 + Math.sin(T * 7) * 6;
        const face = Math.sign(b[0] - a[0]) || 1;
        const tilt = face * 0.3 * Math.sin(u * Math.PI);
        return { x, y, tilt, face, flying: true, local, wings: 0.15 + 0.85 * Math.abs(Math.sin(T * 14)) };
      }
      local -= BF_FLY;
      if (leg === 3) return null; // resting off screen
      if (local < BF_SIT) {
        const [x, y] = pts[leg + 1];
        const settle = smooth(0, 0.4, local);
        const wings = lerp(0.6, 0.55 + 0.45 * Math.cos(local * 2.2), settle);
        const face = Math.sign(pts[leg + 1][0] - pts[leg][0]) || 1;
        return { x, y: y + Math.sin(T * 1.5) * 1.5, tilt: 0, face, flying: false, local, wings };
      }
      local -= BF_SIT;
    }
    return null;
  }

  // [light centre, main, dark edge, accent spot]
  const WINGS = {
    blue: ['#f4fcff', '#86e0ff', '#3d8cff', '#ffd86b'],
    lilac: ['#fbf4ff', '#c9a6ff', '#7a4fd6', '#ffd86b'],
    yellow: ['#fffbe6', '#ffe066', '#e0a020', '#ff7aa8'],
    orange: ['#fff1e0', '#ffa040', '#c85a10', '#fff3c0'],
    mint: ['#f0fff6', '#8ef0c0', '#2fae7a', '#ffd86b'],
    white: ['#ffffff', '#eef2ff', '#a8b4d8', '#ffb3c8'],
  };
  const OUTLINE = 'rgba(0,0,0,0.85)';

  // any hex colour becomes a matching light / main / dark set
  function wingColors(name) {
    if (WINGS[name]) return WINGS[name];
    const hex = '#' + name.replace(/^#/, '');
    return [mix(hex, '#ffffff', 0.8), hex, mix(hex, '#000000', 0.35), '#fffaf0'];
  }

  function drawVisitor(g, S) {
    if (settings.visitor === 'none') return;
    const v = butterflyState(S);
    if (!v) return;
    g.save();
    g.translate(v.x, v.y);
    g.rotate(v.tilt);
    if (settings.visitor === 'bee') drawBee(g, v);
    else if (settings.visitor === 'ladybug') drawLadybug(g, v);
    else drawButterfly(g, v);
    g.restore();
  }

  function drawButterfly(g, v) {
    const [light, main, dark, accent] = wingColors(settings.wing);
    g.translate(0, -20); // perch with the body on the flower, wings above it
    g.scale(1.7, 1.7);
    g.strokeStyle = OUTLINE;
    g.lineWidth = 6;
    for (const s of [-1, 1]) {
      g.save();
      g.scale(v.wings, 1);
      const grad = g.createRadialGradient(0, 0, 4, 0, 0, 70);
      grad.addColorStop(0, light);
      grad.addColorStop(0.45, main);
      grad.addColorStop(1, dark);
      // upper wing
      g.beginPath();
      g.moveTo(0, -4);
      g.bezierCurveTo(s * 20, -50, s * 70, -55, s * 62, -14);
      g.bezierCurveTo(s * 58, 0, s * 20, 4, 0, 2);
      g.fillStyle = grad; g.fill(); g.stroke();
      // lower wing
      g.beginPath();
      g.moveTo(0, 2);
      g.bezierCurveTo(s * 40, 4, s * 52, 36, s * 30, 46);
      g.bezierCurveTo(s * 14, 52, s * 4, 24, 0, 6);
      g.fillStyle = grad; g.fill(); g.stroke();
      // spots
      g.fillStyle = '#fffaf0';
      g.beginPath(); g.arc(s * 46, -30, 6, 0, Math.PI * 2); g.fill();
      g.fillStyle = accent;
      g.beginPath(); g.arc(s * 26, 32, 5, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    // body, head and curly antennae
    g.fillStyle = '#9a78bc';
    g.beginPath(); g.ellipse(0, 10, 5, 22, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.arc(0, -16, 7, 0, Math.PI * 2); g.fill(); g.stroke();
    g.strokeStyle = '#c8b2e6';
    g.lineWidth = 2.5;
    g.fillStyle = '#c8b2e6';
    for (const s of [-1, 1]) {
      g.beginPath(); g.moveTo(s * 2, -21); g.quadraticCurveTo(s * 4, -40, s * 16, -44); g.stroke();
      g.beginPath(); g.arc(s * 16, -44, 4, 0, Math.PI * 2); g.fill();
    }
  }

  // importante
  const BUG_SCALE = 1.7;

  function drawBee(g, v) {
    if (v.flying) g.translate(Math.sin(T * 23) * 3, Math.sin(T * 31) * 2.5);
    else g.translate(Math.sin(T * 9) * 1, 4);
    g.scale(v.face * BUG_SCALE, BUG_SCALE);
    g.strokeStyle = OUTLINE;
    g.lineWidth = 2.5;
    const beat = v.flying ? 0.35 + 0.65 * Math.abs(Math.sin(T * 40)) : 0.9;
    for (const k of [0, 1]) {
      g.save();
      g.translate(-4 - k * 7, -16);
      g.rotate(v.flying ? -0.25 - k * 0.4 : -1.0 - k * 0.25);
      g.scale(1, beat);
      g.beginPath(); g.ellipse(0, -14, 10 - k * 2, 16 - k * 3, 0, 0, Math.PI * 2);
      g.fillStyle = 'rgba(232,248,255,0.95)'; g.fill();
      g.restore();
    }
    // chubby 
    g.beginPath(); g.ellipse(-4, 0, 24, 20, 0, 0, Math.PI * 2);
    const grad = g.createRadialGradient(-8, -8, 2, -4, 0, 26);
    grad.addColorStop(0, '#fff6b0');
    grad.addColorStop(0.55, '#ffd23f');
    grad.addColorStop(1, '#f0a818');
    g.fillStyle = grad; g.fill();
    g.save();
    g.clip();
    g.fillStyle = '#2e1c0c';
    for (const sx of [-16, -1]) g.fillRect(sx, -24, 7, 48);
    g.restore();
    g.stroke();
    // tiny stinger
    g.fillStyle = '#5a3a1a';
    g.beginPath(); g.moveTo(-27, -3); g.lineTo(-35, 1); g.lineTo(-27, 4); g.fill();
    // big round head 
    g.fillStyle = '#a8743c';
    g.beginPath(); g.arc(22, -3, 13, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(27, -6, 3.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ff8fb0';
    g.beginPath(); g.arc(28, 3, 3, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#c09060';
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(25, -15); g.quadraticCurveTo(30, -26, 37, -25); g.stroke();
  }

  function drawLadybug(g, v) {
    if (!v.flying) g.translate(Math.sin(v.local * 1.3) * 5, 6);
    g.scale(v.face * BUG_SCALE, BUG_SCALE);
    g.strokeStyle = OUTLINE;
    g.lineWidth = 2.5;
    if (v.flying) {
      const beat = 0.35 + 0.65 * Math.abs(Math.sin(T * 30));
      for (const k of [0, 1]) {
        g.save();
        g.translate(2 - k * 8, -10);
        g.rotate(-0.5 - k * 0.5);
        g.scale(1, beat);
        g.beginPath(); g.ellipse(0, -16, 8, 19, 0, 0, Math.PI * 2);
        g.fillStyle = 'rgba(245,238,228,0.95)'; g.fill();
        g.restore();
      }
    }
    // little head with big white eyes
    g.fillStyle = '#5a4848';
    g.beginPath(); g.arc(19, 3, 10, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(23, 0, 3.5, 0, Math.PI * 2); g.fill();
    // round shell that tips up at the back when it flies
    g.save();
    g.translate(12, 3);
    g.rotate(v.flying ? -0.45 : 0);
    g.translate(-12, -3);
    g.beginPath(); g.ellipse(-2, 1, 21, 18, 0, 0, Math.PI * 2);
    const grad = g.createRadialGradient(-8, -8, 2, -2, 1, 24);
    grad.addColorStop(0, '#ffa090');
    grad.addColorStop(0.5, '#ff3030');
    grad.addColorStop(1, '#c81818');
    g.fillStyle = grad; g.fill();
    g.stroke();
    // just a few big spots, so they survive being turned into characters
    g.fillStyle = '#220808';
    for (const [sx, sy, sr] of [[-10, -6, 5], [5, -8, 4.5], [-4, 10, 5]]) {
      g.beginPath(); g.arc(sx, sy, sr, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = 'rgba(255,240,235,0.95)';
    g.beginPath(); g.ellipse(-6, -13, 5, 2.5, -0.3, 0, Math.PI * 2); g.fill();
    g.restore();
  }

  function drawScene(g, S, pal) {
    drawRuscus(g, S);
    drawGyp(g, S, false);
    for (const st of S.stems) strokeCurve(g, st.pts, 0, stemProgress(st), 9, '#5a9a30');
    for (const lf of S.leaves) drawLeaf(g, lf);
    const sorted = S.buds.slice().sort((a, b) => budState(a).open - budState(b).open || (a.openAt - b.openAt || 0));
    for (const b of sorted) drawBud(g, b, pal);
    drawGyp(g, S, true);
    if (settings.ribbon) drawBow(g);
    drawTagString(g);
    drawVisitor(g, S);
  }

  // ---------- ascii renderer ----------
  const screen = document.getElementById('screen');
  const sctx = screen.getContext('2d');
  const off = document.createElement('canvas');
  const octx = off.getContext('2d', { willReadFrequently: true });

  let cols = 0, rows = 0, cellW = 0, cellH = 0, fontSize = 0, dpr = 1;
  let reservePx = 0; // screen space kept clear at the bottom for the buttons
  let avail = 0; // rows above the buttons that the bouquet is fitted into
  const styleCache = new Map();
  function style(r, g, b) {
    const key = (r << 16) | (g << 8) | b;
    let s = styleCache.get(key);
    if (!s) { s = `rgb(${r},${g},${b})`; styleCache.set(key, s); }
    return s;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    fontSize = clamp(Math.floor(Math.min(w / 100, h / 85)), 5, 11);
    const font = `bold ${fontSize}px Menlo, Consolas, "DejaVu Sans Mono", monospace`;
    sctx.font = font;
    cellW = sctx.measureText('M').width || fontSize * 0.6;
    cellH = fontSize;
    screen.width = Math.floor(w * dpr);
    screen.height = Math.floor(h * dpr);
    sctx.font = font; // resizing the canvas resets its context, font included
    cols = Math.ceil(w / cellW);
    rows = Math.ceil(h / cellH);
    off.width = cols;
    off.height = rows;
  }

  function render(S, pal) {
    const aspect = cellH / cellW;
    avail = Math.max(10, rows - Math.ceil(reservePx / cellH));
    const sx = Math.min(cols / WORLD_W, (avail * aspect) / WORLD_H) * 0.96;
    octx.setTransform(1, 0, 0, 1, 0, 0);
    octx.fillStyle = '#000';
    octx.fillRect(0, 0, cols, rows);
    const ox = (cols - WORLD_W * sx) / 2, oy = (avail - (WORLD_H * sx) / aspect) / 2;
    octx.setTransform(sx, 0, 0, sx / aspect, ox, oy);

    // place the tag below and to the right of the bow, kept on screen
    let tagCol = 0, tagRow = 0;
    if (TAG) {
      const k = textScale();
      const tw = Math.max(...TAG.map((r) => r.length)) * k;
      tagCol = clamp(Math.round(612 * sx + ox), 0, Math.max(0, cols - tw));
      tagRow = clamp(Math.round(((BOW_Y + 25) * sx) / aspect + oy), 0, Math.max(0, avail - TAG.length * k));
      tagHole = [(tagCol + 2.5 * k - ox) / sx, ((tagRow + 1.5 * k - oy) * aspect) / sx];
    }

    drawScene(octx, S, pal);

    const data = octx.getImageData(0, 0, cols, rows).data;
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sctx.fillStyle = '#000';
    sctx.fillRect(0, 0, screen.width, screen.height);
    // soft glow of the same image underneath the glyphs, like a CRT bloom
    sctx.save();
    sctx.globalAlpha = 0.42;
    sctx.filter = `blur(${Math.round(cellH * 0.4)}px)`;
    sctx.imageSmoothingEnabled = true;
    sctx.drawImage(off, 0, 0, cols * cellW, rows * cellH);
    sctx.restore();
    sctx.textBaseline = 'top';
    const n = RAMP.length - 1;
    const flick = Math.floor(T * 8);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const m = Math.max(r, g, b);
        if (m < 14) continue;
        const v = m / 255;
        // a little shimmer so the glyphs feel alive
        const h = ((x * 73856093) ^ (y * 19349663) ^ (flick * 83492791)) >>> 0;
        const j = h % 7 === 0 ? (h & 8 ? 1 : -1) : 0;
        const idx = clamp(Math.round(Math.pow(v, 0.7) * n) + j, 1, n);
        const k = Math.min(1.25, (40 + 215 * v) / m);
        sctx.fillStyle = style(Math.min(255, (r * k) | 0) & 0xf8, Math.min(255, (g * k) | 0) & 0xf8, Math.min(255, (b * k) | 0) & 0xf8);
        sctx.fillText(RAMP[idx], x * cellW, y * cellH);
      }
    }
    if (TAG) drawTag(tagCol, tagRow);
    drawToast();
  }

  // a small label in the corner confirming what a key just changed
  let toast = null;
  function showToast(text) { toast = { text, at: performance.now() }; }
  // readable text needs at least 11px letters, even when the art's grid is finer
  const MIN_TEXT_PX = 11;
  const textScale = () => Math.max(1, MIN_TEXT_PX / fontSize);
  function useTextFont() {
    sctx.font = `bold ${Math.round(fontSize * textScale())}px Menlo, Consolas, "DejaVu Sans Mono", monospace`;
  }

  function drawToast() {
    if (!toast) return;
    const age = (performance.now() - toast.at) / 1000;
    if (age > 2.2) { toast = null; return; }
    sctx.save();
    sctx.globalAlpha = 1 - smooth(1.6, 2.2, age);
    useTextFont();
    const k = textScale(), cw = cellW * k, ch = cellH * k;
    const x = cw * 1.5, y = avail * cellH - ch * 1.5;
    sctx.fillStyle = '#000';
    sctx.fillRect(x - cw, y, (Array.from(toast.text).length + 2) * cw, ch);
    sctx.fillStyle = RIBBON.light;
    Array.from(toast.text).forEach((c, i) => sctx.fillText(c, x + i * cw, y));
    sctx.restore();
  }


  function drawTag(col, row) {
    const shown = prog(T, TAG_START + 0.45, 0.35);
    if (!shown) return;
    const typed = Math.max(0, (T - TAG_START - 0.8) * TYPE_SPEED);
    const drop = Math.round((1 - easeOut(shown)) * -2);
    const k = textScale(), cw = cellW * k, chH = cellH * k;
    sctx.save();
    useTextFont();
    TAG.forEach((cells, r) => {
      const y = row * cellH + (r + drop) * chH;
      const first = cells.findIndex(([, kind]) => kind);
      sctx.fillStyle = '#000';
      sctx.fillRect(col * cellW + first * cw, y, (cells.length - first) * cw, chH);
      cells.forEach(([ch, kind, order], c) => {
        if (!kind || kind === 'blank') return;
        if (order !== undefined && order >= typed) return;
        sctx.fillStyle = kind === 'text' ? '#fbf1e2' : kind === 'heart' ? RIBBON.main : kind === 'hole' ? '#8a7f74' : RIBBON.light;
        sctx.fillText(ch, col * cellW + c * cw, y);
      });
    });
    sctx.restore();
  }

  // ---------- loop ----------
  const S = buildScene();
  let palette = 0;
  let t0 = performance.now();
  let last = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    if (now - last < 1000 / FPS) return;
    last = now;
    T = (now - t0) / 1000;
    render(S, PALETTES[palette]);
  }

  const replay = () => { t0 = performance.now(); };
  const next = (list, cur) => list[(list.indexOf(cur) + 1) % list.length];
  const PALETTE_NAMES = ['pink', 'white', 'mixed'];

  const actions = {
    replay,
    flowers() { palette = (palette + 1) % PALETTES.length; replay(); return `flowers: ${PALETTE_NAMES[palette]}`; },
    visitor() {
      settings.visitor = next(VISITOR_NAMES, settings.visitor);
      return `visitor: ${settings.visitor}${T < BF_START && settings.visitor !== 'none' ? ' (arrives at ~11s)' : ''}`;
    },
    wings() {
      settings.wing = next(WING_NAMES, WING_NAMES.includes(settings.wing) ? settings.wing : 'white');
      settings.visitor = 'butterfly'; // wing colours are for the butterfly
      return `butterfly wings: ${settings.wing}`;
    },
    ribbon() { settings.ribbon = !settings.ribbon; return `ribbon: ${settings.ribbon ? 'on' : 'off'}`; },
  };
  function act(name, fromKey) {
    const msg = actions[name]();
    if (name === 'replay') return;

    if (fromKey || /arrives/.test(msg)) showToast(msg);
    syncUrl();
    updateButtons();
  }

  window.addEventListener('resize', resize);
  screen.addEventListener('click', replay);
  const KEYS = { ' ': 'replay', r: 'replay', p: 'flowers', c: 'flowers', v: 'visitor', w: 'wings', b: 'ribbon' };
  window.addEventListener('keydown', (e) => {
    if (e.key === 'h') return toggleButtons();
    const name = KEYS[e.key];
    if (name) { e.preventDefault(); act(name, true); }
  });

  // ---------- buttons, para celu o sin teclado----------
  const controls = document.getElementById('controls');
  const swatch = (c) => `<i class="dot" style="background:${c}"></i>`;
  function updateButtons() {
    const label = {
      flowers: `flores · ${PALETTE_NAMES[palette]}`,
      visitor: `bichito · ${settings.visitor}`,
      wings: `${swatch(wingColors(settings.wing)[1])}wings`,
      ribbon: `cinta? · ${settings.ribbon ? 'on' : 'off'}`,
      replay: '↻',
    };
    for (const btn of controls.querySelectorAll('button')) {
      const name = btn.dataset.action;
      if (label[name]) btn.innerHTML = label[name];
      if (name === 'wings') btn.hidden = settings.visitor !== 'butterfly';
    }
  }
  controls.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (btn) act(btn.dataset.action, false);
  });
  function measureButtons() {
    reservePx = controls.hidden ? 0 : controls.getBoundingClientRect().height + 12;
  }
  new ResizeObserver(measureButtons).observe(controls);
  function toggleButtons() {
    controls.hidden = !controls.hidden;
    measureButtons();
    syncUrl();
  }

  function syncUrl() {
    const q = new URLSearchParams(location.search);
    q.delete('t');
    q.set('p', palette);
    settings.visitor === 'butterfly' ? q.delete('bug') : q.set('bug', settings.visitor);
    settings.wing === 'blue' ? q.delete('wing') : q.set('wing', settings.wing.replace('#', ''));
    settings.ribbon ? q.delete('ribbon') : q.set('ribbon', 'off');
    controls.hidden ? q.set('ui', 'off') : q.delete('ui');
    try { history.replaceState(null, '', '?' + q.toString()); } catch (err) { /* some browsers block this on file:// */ }
  }

  // ?t=8 starts 8s into the bloom, ?p=1 picks a palette
  if (params.has('p')) palette = clamp(+params.get('p') | 0, 0, PALETTES.length - 1);
  if (params.has('t')) t0 = performance.now() - +params.get('t') * 1000;

  // ?ui=off hides the buttons, for a clean link to send someone
  controls.hidden = /^(0|off|no|false)$/i.test(params.get('ui') || '');
  updateButtons();
  measureButtons();
  resize();
  requestAnimationFrame(frame);
})();
