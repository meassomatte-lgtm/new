// Caffetteria d'Arte, v3: Instagram motion-graphics style (docs/style_guide.md, ref/pin_reference.mp4).
// 30 s · 96 bpm · 48 beats. Cut to the voice-over (audio/vo.wav, offset 0.7 s). Pure function of time.
import * as M from './lib/motion.js';
import * as AERIAL from './aerial.js';

const { W, H, E, prog, lerp, clamp, springU, SPRING, font, layout, glyph, text, fill, cover, rrect, hash01, mulberry32, wobble } = M;

const C = { black: '#101010', paper: '#ECEAE6', red: '#E07A2B', brown: '#5B3A24', white: '#FFFFFF', ink: '#141414', grey: '#8D8A86', cream: '#F1E8D6' };
const SERIF = 'Serif', ITAL = 'Display', UI = 'UI', HEAVY = 'Heavy';

// Sound: sober and sparse (no cymbals, no cartoon sounds; the user adds more in post)
const HITS = [
  [0, 'descent', 'whoosh', { len: 1.4, from: 120, to: 700, gain: 0.14 }],
  [1.5, 'PORDENONE', 'thud', { gain: 0.2, pitch: 110, to: 45 }],
  [5, 'marker', 'thud', { gain: 0.18, pitch: 120, to: 50 }],
  [6.5, 'brand', 'sub', { len: 1.4, gain: 0.4 }],
  [9.5, 'aperti', 'whoosh', { len: 0.6, from: 180, to: 900, gain: 0.14 }],
  [20, 'colazione', 'whoosh', { len: 0.6, from: 180, to: 900, gain: 0.14 }],
  [25.8, 'pranzo', 'whoosh', { len: 0.6, from: 180, to: 900, gain: 0.14 }],
  [29.4, 'aperitivo', 'whoosh', { len: 0.6, from: 180, to: 900, gain: 0.14 }],
  [34.3, 'arte', 'whoosh', { len: 0.6, from: 180, to: 900, gain: 0.14 }],
  [39, 'phone', 'whoosh', { len: 0.6, from: 180, to: 900, gain: 0.14 }],
  [42.2, 'tap', 'tick', { gain: 0.12 }],
  [44, 'end', 'sub', { len: 1.2, gain: 0.35 }],
];

const FAST = { stiffness: 340, damping: 17 };   // entrances ~25% quicker than SPRING.bouncy
// ================================================================ type + graphics kit
const ease01 = (u, a, b, e = E.outQuint) => e(prog(u, a, b));
// glyphs rise out of a mask line
function rise(ctx, str, x, y, f, color, u, u0, { align = 'left', track = 0, stagger = 0.014, dur = 0.42 } = {}) {
  const L = layout(ctx, str, f, track);
  const x0 = align === 'center' ? x - L.width / 2 : align === 'right' ? x - L.width : x;
  ctx.save(); ctx.beginPath(); ctx.rect(0, y - L.asc - 60, W, L.asc + L.desc + 66); ctx.clip();
  L.glyphs.forEach((g, j) => {
    const p = E.outQuint(prog(u, u0 + j * stagger, u0 + j * stagger + dur));
    if (p > 0) glyph(ctx, g.ch, x0 + g.cx, y + (1 - p) * (L.asc + L.desc + 30), f, color);
  });
  ctx.restore();
  return { L, x0 };
}
// a big heavy word that slams in: scale overshoot, then holds; optional red bar wipes behind it
function slam(ctx, str, x, y, size, color, u, u0, { align = 'center', bar = null, track = -0.02 } = {}) {
  const f = font(size, 900, HEAVY);
  const L = layout(ctx, str, f, track * size);
  const x0 = align === 'center' ? x - L.width / 2 : align === 'right' ? x - L.width : x;
  if (bar) {
    const p = E.inOutCubic(prog(u, u0 - 0.25, u0 + 0.15));
    if (p > 0) { ctx.fillStyle = bar; ctx.fillRect(x0 - 24, y - L.asc - 18, (L.width + 48) * p, L.asc + L.desc + 36); }
  }
  L.glyphs.forEach((g, j) => {
    const k = springU(u, u0 + j * 0.022, FAST);
    if (k <= 0) return;
    const s = 1.6 - 0.6 * k;
    ctx.save(); ctx.globalAlpha = clamp(k * 3);
    glyph(ctx, g.ch, x0 + g.cx, y, f, color, s, s);
    ctx.restore();
  });
  return { L, x0 };
}
function fitHeavy(ctx, str, maxW, max) {
  const w100 = layout(ctx, str, font(100, 900, HEAVY), -2).width;
  return Math.min(max, Math.floor((100 * maxW) / w100));
}
// small italic word + big heavy word: the reference's signature pair
function pair(ctx, small, big, y, u, u0, { dark = true, bar = false, maxW = W - 160, max = 230, smallSize = 76, align = 'center', x = W / 2 } = {}) {
  const sz = fitHeavy(ctx, big, maxW, max);
  const L = layout(ctx, big, font(sz, 900, HEAVY), -0.02 * sz);
  const x0 = align === 'center' ? x - L.width / 2 : x;
  rise(ctx, small, x0 + 6, y - L.asc - 34, font(smallSize, 500, ITAL), dark ? C.white : C.brown, u, u0);
  return slam(ctx, big, x, y, sz, bar ? C.white : C.red, u, u0 + 0.25, { align, bar: bar ? C.red : null });
}
// thin swoosh curve drawn on
function swoosh(ctx, u, u0, pts, color, w = 3, dur = 1.2) {
  const p = E.inOutCubic(prog(u, u0, u0 + dur));
  if (p <= 0) return;
  ctx.save(); ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]); ctx.bezierCurveTo(pts[2], pts[3], pts[4], pts[5], pts[6], pts[7]);
  ctx.setLineDash([4000 * p, 4000]); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke();
  ctx.restore();
}
// backgrounds
function bgDark(ctx, u) {
  fill(ctx, C.black);
  ctx.strokeStyle = 'rgba(255,255,255,0.055)'; ctx.lineWidth = 1.5;
  const off = (u * 6) % 90;
  ctx.beginPath();
  for (let x = -90 + off; x < W + 90; x += 90) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 0; y < H; y += 90) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
  const vg = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.2, W / 2, H * 0.5, H * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.65)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}
let LEAVES = null;
function makeLeaves() {
  const cv = document.createElement('canvas'); cv.width = W + 400; cv.height = H + 400;
  const c = cv.getContext('2d'); const R = mulberry32(21);
  c.filter = 'blur(22px)'; c.fillStyle = 'rgba(40,40,40,0.16)';
  for (let i = 0; i < 26; i++) {
    const x = R() < 0.5 ? R() * 420 : cv.width - R() * 420, y = R() * cv.height, l = 160 + R() * 220, a = R() * Math.PI;
    c.save(); c.translate(x, y); c.rotate(a);
    c.beginPath(); c.moveTo(-l / 2, 0); c.quadraticCurveTo(0, -l * 0.28, l / 2, 0); c.quadraticCurveTo(0, l * 0.28, -l / 2, 0); c.fill();
    c.restore();
  }
  return cv;
}
function bgLight(ctx, u) {
  fill(ctx, C.paper);
  const g = ctx.createRadialGradient(W * 0.55, H * 0.4, 100, W / 2, H / 2, H * 0.8);
  g.addColorStop(0, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0.10)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (LEAVES) ctx.drawImage(LEAVES, -200 + Math.sin(u * 0.35) * 30, -200 + Math.cos(u * 0.27) * 20);
}
// floating coffee beans in the foreground (depth: big + blurred near, small + sharp far)
let BEANS = null;
function makeBeans() {
  const mk = (blur) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 220;
    const c = cv.getContext('2d'); c.filter = `blur(${blur}px)`;
    c.translate(110, 110);
    const g = c.createRadialGradient(-20, -25, 5, 0, 0, 80);
    g.addColorStop(0, '#8A5A35'); g.addColorStop(0.6, '#4E2E19'); g.addColorStop(1, '#2A170C');
    c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, 58, 80, 0, 0, M.TAU); c.fill();
    c.strokeStyle = '#1C0F07'; c.lineWidth = 9; c.beginPath(); c.moveTo(0, -66); c.bezierCurveTo(-22, -20, 22, 20, 0, 66); c.stroke();
    return cv;
  };
  return [mk(0), mk(3), mk(9)];
}
function beans(ctx, u, u0, u1, seed, n = 5) {
  if (!BEANS) return;
  const R = mulberry32(seed);
  for (let i = 0; i < n; i++) {
    const depth = R(), lvl = depth > 0.75 ? 2 : depth > 0.4 ? 1 : 0;
    const s = 0.35 + depth * 0.9;
    const x0 = R() * W, y0 = R() * H, vx = (R() - 0.5) * 60, vy = -40 - depth * 120;
    const t = (u - u0) * 0.625;
    const k = springU(u, u0 + i * 0.12, SPRING.gentle);
    const x = x0 + vx * t, y = y0 + vy * t + (1 - k) * 400 * (0.5 + depth);
    const rot = R() * M.TAU + t * (R() - 0.5) * 1.2;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.drawImage(BEANS[lvl], -110, -110);
    ctx.restore();
  }
}
function logoDisc(ctx, IMG, x, y, r) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, M.TAU); ctx.fillStyle = C.cream; ctx.fill(); ctx.clip();
  const img = IMG.logo;
  if (img) { const s = (2 * r) / (img.width * 0.86); ctx.drawImage(img, -img.width * 0.5 * s, -img.height * 0.5 * s, img.width * s, img.height * s); }
  ctx.restore();
}
// photo card: white border, rounded, tilted, flies in from a side and keeps drifting
function photoCard(ctx, img, u, u0, u1, cx, cy, w, h, { from = 1, rot = -0.04, fx0 = 0.4, fx1 = 0.6, fy = 0.5, edge = C.red } = {}) {
  if (!img) return;
  const k = springU(u, u0 - 0.2, { stiffness: 460, damping: 34 });
  const drift = prog(u, u0, u1);
  const x = cx + (1 - k) * from * (W + w) * 0.7, y = cy - drift * 30;
  const r = rot * k + (1 - k) * from * 0.25 + 0.01 * Math.sin(drift * Math.PI);
  ctx.save(); ctx.translate(x, y); ctx.rotate(r);
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 30;
  rrect(ctx, -w / 2 - 14, -h / 2 - 14, w + 28, h + 28, 34); ctx.fillStyle = edge; ctx.fill();
  ctx.shadowColor = 'transparent';
  const z = 1.04 * (1.14 / 1.04) ** E.inOutSine(drift);
  cover(ctx, img, -w / 2, -h / 2, w, h, { fx: lerp(fx0, fx1, drift), fy, zoom: z, radius: 22 });
  ctx.restore();
}
function pill(ctx, str, cx, cy, u, u0, { bg = C.red, fg = C.white, size = 40 } = {}) {
  const k = springU(u, u0, FAST);
  if (k <= 0) return;
  const f = font(size, 800, UI); const L = layout(ctx, str, f, size * 0.12);
  const pw = L.width + size * 1.6, ph = size * 2;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
  rrect(ctx, -pw / 2, -ph / 2, pw, ph, 14); ctx.fillStyle = bg; ctx.fill();
  text(ctx, str, 0, size * 0.36, f, fg, 'center', size * 0.12);
  ctx.restore();
}

// ================================================================ S1 aerial descent   (u 0..6.5)
const CAFE_W = [-Math.sin(AERIAL.ANG) * -19, Math.cos(AERIAL.ANG) * -19];
const LV = {};
function buildMap() {
  AERIAL.buildWorld();
  LV.city = AERIAL.paintLevel(-200, -150, 4200, 6144);
  LV.mid = AERIAL.paintLevel(CAFE_W[0], CAFE_W[1], 1200, 6144);
  LV.block = AERIAL.paintLevel(CAFE_W[0], CAFE_W[1], 420, 6144);
}
const PIN = { x: W / 2, y: H * 0.5 };
function camAt(u) {
  const p = E.inOutSine(prog(u, -0.8, 5.0));
  const s = 0.26 * (8 / 0.26) ** p * (1 + 0.08 * E.inOutSine(prog(u, 5, 6.5)));
  const q = E.inOutCubic(prog(u, 0, 4.4));
  return { s, cx: lerp(-350, CAFE_W[0], q), cy: lerp(-250, CAFE_W[1], q), rot: lerp(-AERIAL.ANG - 0.55, -AERIAL.ANG, E.inOutCubic(prog(u, 0, 5))) };
}
function drawLevel(ctx, L, c, alpha) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.translate(PIN.x, PIN.y); ctx.rotate(c.rot); ctx.scale(c.s, c.s); ctx.translate(-c.cx, -c.cy);
  ctx.imageSmoothingQuality = 'high';
  ctx.filter = 'saturate(0.7) contrast(1.08) brightness(0.95)';
  ctx.drawImage(L.cv, L.cx - L.half, L.cy - L.half, 2 * L.half, 2 * L.half);
  ctx.restore();
}
function sceneMap(ctx, u) {
  fill(ctx, '#7C7F5C');
  const c = camAt(u);
  const toMid = E.inOutSine(prog(c.s, 0.95, 1.2)), toBlock = E.inOutSine(prog(c.s, 2.6, 3.1));
  if (toMid < 1) drawLevel(ctx, LV.city, c, 1);
  if (toBlock < 1) drawLevel(ctx, LV.mid, c, toMid);
  drawLevel(ctx, LV.block, c, toBlock);
  const haze = clamp(1 - (Math.log(c.s / 0.26) / Math.log(8 / 0.26)) * 1.6);
  if (haze > 0) { ctx.fillStyle = `rgba(214,224,232,${0.3 * haze})`; ctx.fillRect(0, 0, W, H); }
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  const cl = prog(u, -0.2, 2.4);
  if (cl < 1) {
    const R = mulberry32(12);
    for (let i = 0; i < 9; i++) {
      const ax = R() * W, ay = R() * H, r0 = 260 + R() * 320, pu = 1 + E.inCubic(cl) * 2.2;
      const x = W / 2 + (ax - W / 2) * pu, y = H / 2 + (ay - H / 2) * pu, r = r0 * (1 + cl * 1.5), a = 0.85 * (1 - E.inQuad(cl));
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.6, `rgba(250,250,252,${a * 0.6})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
  }
  // "Nel cuore di / PORDENONE": the reference's small-italic + heavy pair
  const out = E.inBack(prog(u, 3.3, 3.9), 1.4);
  ctx.save(); ctx.translate(0, -out * 700);
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 30;
  pair(ctx, 'Nel cuore di', 'PORDENONE', 520, u, 1.1, { bar: true, max: 170 });
  ctx.restore();
  swoosh(ctx, u, 0.6, [-50, 900, 300, 600, 700, 1200, W + 60, 700], 'rgba(255,255,255,0.8)', 3, 1.6);
  // red marker + callout
  if (u >= 4.4) {
    const k = springU(u, 4.4, SPRING.snappy), len = 200 * k;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 18;
    ctx.strokeStyle = C.red; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(PIN.x, PIN.y); ctx.lineTo(PIN.x, PIN.y - len); ctx.stroke();
    ctx.beginPath(); ctx.arc(PIN.x, PIN.y, 15, 0, M.TAU); ctx.fillStyle = C.red; ctx.fill();
    const rp = ease01(u, 5, 6.4, E.outCubic);
    ctx.globalAlpha = 1 - rp; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(PIN.x, PIN.y, 15 + rp * 120, 0, M.TAU); ctx.stroke();
    ctx.restore();
    const lk = springU(u, 4.9, SPRING.snappy);
    if (lk > 0) {
      const bw = 560, bh = 140, bx = PIN.x - bw / 2, by = PIN.y - len - bh - 6;
      ctx.save(); ctx.translate(PIN.x, by + bh); ctx.scale(lk, lk); ctx.translate(-PIN.x, -(by + bh));
      ctx.fillStyle = C.white; rrect(ctx, bx, by, bw, bh, 12); ctx.fill();
      ctx.fillStyle = C.red; rrect(ctx, bx, by, 18, bh, 12); ctx.fill(); ctx.fillRect(bx + 8, by, 10, bh);
      text(ctx, 'Viale Marconi, 40', bx + 48, by + 66, font(52, 900, HEAVY), C.brown, 'left');
      text(ctx, 'PORDENONE', bx + 48, by + 112, font(28, 700, UI), C.red, 'left', 8);
      ctx.restore();
    }
  }
}

// ================================================================ S2 brand   (u 6.5..9.5)
function sceneBrand(ctx, u, IMG) {
  bgDark(ctx, u);
  swoosh(ctx, u, 6.4, [-40, 1500, 300, 1100, 800, 1700, W + 40, 1250], 'rgba(255,255,255,0.7)', 3);
  const k = springU(u, 6.5, SPRING.bouncy);
  const r = 190 * k;
  if (r > 1) {
    ctx.save(); ctx.translate(W / 2, 640); ctx.rotate((1 - k) * -1.2); ctx.translate(-W / 2, -640);
    ctx.beginPath(); ctx.arc(W / 2, 640, r + 16, 0, M.TAU); ctx.fillStyle = C.red; ctx.fill();
    logoDisc(ctx, IMG, W / 2, 640, r);
    ctx.restore();
  }
  rise(ctx, 'c’è la', 150, 990, font(84, 500, ITAL), C.white, u, 6.9);
  const sz = fitHeavy(ctx, 'CAFFETTERIA', W - 160, 200);
  slam(ctx, 'CAFFETTERIA', W / 2, 1160, sz, C.white, u, 7.3);
  slam(ctx, 'd’ARTE', W / 2, 1360, sz * 1.15, C.white, u, 8.0, { bar: C.red });
}

// ================================================================ S3 hours   (u 9.5..20)
function sceneHours(ctx, u) {
  bgLight(ctx, u);
  // the camera pushes in slowly across the whole scene
  const z = 1 + 0.05 * prog(u, 9.5, 20);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
  pair(ctx, 'Siamo', 'APERTI', 520, u, 9.6, { dark: false, max: 300 });
  swoosh(ctx, u, 10.2, [-40, 640, 260, 560, 760, 760, W + 40, 600], 'rgba(20,20,20,0.35)', 3);
  const rows = [
    { tag: 'LUN – VEN', hrs: '7:00 – 20:30', u: 12 },
    { tag: 'SABATO', hrs: '8:00 – 15:00', u: 15.5 },
    { tag: 'DOMENICA', hrs: 'chiuso', u: 17.5, off: true },
  ];
  rows.forEach((r, i) => {
    const y = 820 + i * 220;
    const k = springU(u, r.u - 0.15, SPRING.snappy);
    if (k <= 0) return;
    const x = 96 + (1 - k) * -W;
    ctx.save(); ctx.translate(x, 0);
    ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
    rrect(ctx, 0, y, W - 192, 180, 26); ctx.fillStyle = r.off ? '#E2DFDA' : C.white; ctx.fill();
    ctx.shadowColor = 'transparent';
    rrect(ctx, 30, y + 30, 26 + layout(ctx, r.tag, font(30, 800, UI), 4).width + 26, 52, 10); ctx.fillStyle = r.off ? C.grey : C.red; ctx.fill();
    text(ctx, r.tag, 56, y + 67, font(30, 800, UI), C.white, 'left', 4);
    text(ctx, r.hrs, 34, y + 158, font(r.off ? 64 : 72, 900, r.off ? ITAL : HEAVY), r.off ? C.grey : C.brown, 'left', r.off ? 0 : -1);
    ctx.restore();
  });
  ctx.restore();
}

// ================================================================ S4-6 food   (u 20..34.3)
function sceneColazione(ctx, u, IMG) {
  bgDark(ctx, u);
  swoosh(ctx, u, 20, [W + 40, 300, 700, 600, 200, 200, -40, 520], 'rgba(255,255,255,0.6)', 3);
  photoCard(ctx, IMG.colazione, u, 20, 25.8, W / 2, 1060, 860, 760, { from: 1, rot: -0.035, fx0: 0.22, fx1: 0.36, fy: 0.55 });
  pair(ctx, 'Al mattino', 'COLAZIONE', 470, u, 20.2, { max: 200 });
  pill(ctx, 'CAPPUCCINO & CORNETTO', W / 2, 1560, u, 23.1, { size: 34 });
  beans(ctx, u, 20, 25.8, 7, 6);
}
function scenePranzo(ctx, u, IMG) {
  bgLight(ctx, u);
  photoCard(ctx, IMG.pranzo, u, 25.8, 29.4, W / 2, 1060, 860, 760, { from: -1, rot: 0.03, fx0: 0.5, fx1: 0.5, fy: 0.5, edge: C.brown });
  pair(ctx, 'A mezzogiorno', 'PRANZO VELOCE', 470, u, 25.9, { dark: false, max: 150 });
  swoosh(ctx, u, 26, [-40, 1500, 300, 1700, 800, 1400, W + 40, 1600], 'rgba(20,20,20,0.35)', 3);
}
function sceneAperitivo(ctx, u, IMG) {
  bgDark(ctx, u);
  photoCard(ctx, IMG.aperitivo, u, 29.4, 34.3, W / 2 - 40, 1060, 820, 760, { from: 1, rot: -0.03, fx0: 0.85, fx1: 0.7, fy: 0.55 });
  // the real Language Club poster, a second card overlapping
  const k = springU(u, 31.4, SPRING.snappy);
  if (k > 0 && IMG.club) {
    const w = 320, h = w * IMG.club.height / IMG.club.width;
    const x = W - 210 + (1 - k) * 500, y = 1290;
    ctx.save(); ctx.translate(x, y); ctx.rotate(0.08);
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20;
    rrect(ctx, -w / 2 - 12, -h / 2 - 12, w + 24, h + 24, 20); ctx.fillStyle = C.brown; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.save(); rrect(ctx, -w / 2, -h / 2, w, h, 12); ctx.clip(); ctx.drawImage(IMG.club, -w / 2, -h / 2, w, h); ctx.restore();
    ctx.restore();
  }
  pair(ctx, 'La sera', 'APERITIVO', 470, u, 29.5, { max: 210 });
  pill(ctx, '+ LANGUAGE CLUB', 330, 1580, u, 32.3, { size: 34 });
  swoosh(ctx, u, 29.6, [-40, 760, 400, 520, 700, 980, W + 40, 640], 'rgba(255,255,255,0.6)', 3);
}

// ================================================================ S7 art   (u 34.3..39)
function sceneArte(ctx, u, IMG) {
  bgLight(ctx, u);
  if (IMG.quadro) {
    const k = springU(u, 34.2, SPRING.snappy);
    const w = 370, h = w * IMG.quadro.height / IMG.quadro.width;
    const cx = W - 250, cy = 720 + (1 - k) * -900;
    const rot = 0.06 + (1 - k) * 0.3 + 0.01 * wobble(u - 34.8, 1.5, 3);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 26;
    // ornate frame: layered gilded bevels
    const fr = [[44, '#6E5A3C'], [36, '#B89A62'], [24, '#8A7148'], [14, '#D8C08A'], [6, '#5E4B30']];
    fr.forEach(([p, col], i) => { ctx.fillStyle = col; ctx.fillRect(-w / 2 - p, -h / 2 - p, w + 2 * p, h + 2 * p); if (i === 0) ctx.shadowColor = 'transparent'; });
    ctx.drawImage(IMG.quadro, -w / 2, -h / 2, w, h);
    ctx.restore();
  }
  rise(ctx, 'Un luogo di', 96, 1000, font(76, 500, ITAL), C.brown, u, 34.4);
  const words = [['ARTE', 35, 1150], ['LIBRI', 36.5, 1330], ['INCONTRI', 38, 1510]];
  words.forEach(([w, u0, y], i) => slam(ctx, w, 96, y, 170, i === 1 ? C.white : C.red, u, u0, { align: 'left', bar: i === 1 ? C.red : null }));
}

// ================================================================ S8 phone · Instagram   (u 39..44)
const phoneSrcX = (u) => lerp(1050, 640, E.inOutSine(prog(u, 39.6, 41.8)));
function iphoneWhite(ctx, IMG, cx, cy, w, h, u) {
  const r = 78;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 80; ctx.shadowOffsetY = 40;
  rrect(ctx, cx - w / 2, cy - h / 2, w, h, r); ctx.fillStyle = '#E9E7E3'; ctx.fill();
  ctx.shadowColor = 'transparent';
  const edge = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
  edge.addColorStop(0, '#FFFFFF'); edge.addColorStop(0.5, '#CFCCC7'); edge.addColorStop(1, '#F7F6F3');
  rrect(ctx, cx - w / 2, cy - h / 2, w, h, r); ctx.strokeStyle = edge; ctx.lineWidth = 8; ctx.stroke();
  const b = 20, sx = cx - w / 2 + b, sy = cy - h / 2 + b, sw = w - 2 * b, sh = h - 2 * b;
  rrect(ctx, sx - 4, sy - 4, sw + 8, sh + 8, r - b + 4); ctx.fillStyle = '#0A0A0A'; ctx.fill();
  ctx.save(); rrect(ctx, sx, sy, sw, sh, r - b); ctx.clip();
  ctx.fillStyle = '#0F1115'; ctx.fillRect(sx, sy, sw, sh);
  if (IMG.ig) {
    const img = IMG.ig, scale = sh / img.height, vw = sw / scale;
    const srcX = phoneSrcX(u);
    ctx.drawImage(img, srcX, 0, vw, img.height, sx, sy, sw, sh);
    const bx = 946, by = 812, bw = 470, bh = 626;   // blur the group photo
    const dx = sx + (bx - srcX) * scale, dy = sy + by * scale;
    ctx.save(); ctx.beginPath(); ctx.rect(dx, dy, bw * scale, bh * scale); ctx.clip(); ctx.filter = 'blur(14px)';
    ctx.drawImage(img, bx - 40, by - 40, bw + 80, bh + 80, dx - 40 * scale, dy - 40 * scale, (bw + 80) * scale, (bh + 80) * scale);
    ctx.restore();
  }
  ctx.restore();
  rrect(ctx, cx - 70, sy + 18, 140, 40, 20); ctx.fillStyle = '#000'; ctx.fill();
  ctx.restore();
  return { sx, sy, sw, sh };
}
function scenePhone(ctx, u, IMG) {
  bgDark(ctx, u);
  // big red disc behind the phone, like the reference's spotlight circles
  const dk = springU(u, 39, SPRING.gentle);
  ctx.beginPath(); ctx.arc(W / 2, 1120, 470 * dk, 0, M.TAU); ctx.fillStyle = 'rgba(224,122,43,0.92)'; ctx.fill();
  swoosh(ctx, u, 39.2, [-40, 1250, 300, 900, 760, 1500, W + 40, 1000], 'rgba(255,255,255,0.7)', 3);
  pair(ctx, 'Seguiteci su', 'INSTAGRAM', 420, u, 39.2, { max: 200 });
  rise(ctx, '@caffetteriadarte', W / 2, 520, font(52, 700, UI), C.white, u, 40.2, { align: 'center', stagger: 0.012 });
  const k = springU(u, 38.9, SPRING.gentle);
  // after the scroll the camera pushes into the follow button
  const zp = E.inOutCubic(prog(u, 41.6, 42.4));
  const w = 580, h = 1140, cx = W / 2, cy = 1150 + (1 - k) * 1300;
  const z = 1 + 0.38 * zp;
  const sc = (h - 40) / 1640;
  const fx = cx - w / 2 + 20 + (825 - phoneSrcX(u)) * sc, fy = cy - h / 2 + 20 + 666 * sc;
  ctx.save();
  ctx.translate(fx, fy); ctx.scale(z, z); ctx.translate(-fx, -fy);
  ctx.translate(cx, cy); ctx.rotate(0.04 * (1 - k) - 0.025 * (1 - zp)); ctx.translate(-cx, -cy);
  iphoneWhite(ctx, IMG, cx, cy, w, h, u);
  const tp = prog(u, 42.2, 43.2);
  if (tp > 0 && tp < 1) {
    ctx.beginPath(); ctx.arc(fx, fy, 24 + tp * 70, 0, M.TAU); ctx.strokeStyle = `rgba(255,255,255,${0.9 * (1 - tp)})`; ctx.lineWidth = 5; ctx.stroke();
    ctx.beginPath(); ctx.arc(fx, fy, 22 * (1 - tp * 0.4), 0, M.TAU); ctx.fillStyle = `rgba(91,58,36,${0.6 * (1 - tp)})`; ctx.fill();
  }
  ctx.restore();
}

// ================================================================ S9 end card   (u 44..48)
function sceneEnd(ctx, u, IMG) {
  bgLight(ctx, u);
  swoosh(ctx, u, 44, [-40, 380, 400, 160, 700, 560, W + 40, 300], 'rgba(20,20,20,0.3)', 3);
  pill(ctx, 'SEGUICI', W / 2, 480, u, 44.1, { size: 46 });
  const k = springU(u, 43.65, SPRING.bouncy);
  if (k > 0) {
    ctx.save(); ctx.translate(W / 2, 780); ctx.rotate((1 - k) * 0.8); ctx.translate(-W / 2, -780);
    ctx.beginPath(); ctx.arc(W / 2, 780, 210 * k + 12, 0, M.TAU); ctx.fillStyle = C.brown; ctx.fill();
    logoDisc(ctx, IMG, W / 2, 780, 210 * k);
    ctx.restore();
  }
  pair(ctx, 'Vi', 'ASPETTIAMO', 1230, u, 44.5, { dark: false, max: 170 });
  rise(ctx, 'Viale Marconi 40 · Pordenone', W / 2, 1330, font(40, 600, UI), C.brown, u, 45.2, { align: 'center', stagger: 0.008 });
  rise(ctx, 'Lun–Ven 7:00–20:30  ·  Sab 8:00–15:00', W / 2, 1395, font(34, 500, UI), C.grey, u, 45.5, { align: 'center', stagger: 0.006 });
  rise(ctx, '@caffetteriadarte', W / 2, 1470, font(44, 800, UI), C.red, u, 45.8, { align: 'center', stagger: 0.008 });
}

// ================================================================ transitions + post
// whip: A slides out left as B slides in from the right, both on screen, done on the cut
function whip(ctx, u, uc, drawA, drawB, dir = 1, dur = 0.3) {
  const p = E.inOutCubic(prog(u, uc - dur, uc));
  if (p <= 0) { drawA(); return; }
  if (p >= 1) { drawB(); return; }
  ctx.save(); ctx.translate(-dir * p * W, 0); drawA(); ctx.restore();
  ctx.save(); ctx.translate(dir * (1 - p) * W, 0); drawB(); ctx.restore();
}
let GRAIN = null;
function makeGrain() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512;
  const c = cv.getContext('2d'); const im = c.createImageData(512, 512); const R = mulberry32(9);
  for (let i = 0; i < im.data.length; i += 4) { const v = R() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 10; }
  c.putImageData(im, 0, 0); return cv;
}

M.film({
  fonts: [font(100, 900, HEAVY), font(100, 500, ITAL), font(40, 500, UI), font(40, 800, UI), font(100, 500, SERIF)],
  images: {
    logo: 'assets/logo.png', quadro: 'assets/photos/quadro.png', club: 'assets/photos/language_club.png', ig: 'assets/instagram_screenshot.png',
    colazione: 'assets/ai/colazione.jpg', pranzo: 'assets/piatti/pasta_forno.jpg', aperitivo: 'assets/ai/aperitivo.jpg',
  },
  hits: HITS,
  init() { buildMap(); GRAIN = makeGrain(); LEAVES = makeLeaves(); BEANS = makeBeans(); },
  draw(ctx, u, t, IMG) {
    const S = {
      map: () => sceneMap(ctx, u), brand: () => sceneBrand(ctx, u, IMG), hours: () => sceneHours(ctx, u),
      col: () => sceneColazione(ctx, u, IMG), pra: () => scenePranzo(ctx, u, IMG), ape: () => sceneAperitivo(ctx, u, IMG),
      arte: () => sceneArte(ctx, u, IMG), phone: () => scenePhone(ctx, u, IMG), end: () => sceneEnd(ctx, u, IMG),
    };
    if (u < 6.5) whip(ctx, u, 6.5, S.map, S.brand, 1, 0.35);
    else if (u < 9.5) whip(ctx, u, 9.5, S.brand, S.hours, 1);
    else if (u < 20) whip(ctx, u, 20, S.hours, S.col, -1);
    else if (u < 25.8) whip(ctx, u, 25.8, S.col, S.pra, 1);
    else if (u < 29.4) whip(ctx, u, 29.4, S.pra, S.ape, -1);
    else if (u < 34.3) whip(ctx, u, 34.3, S.ape, S.arte, 1);
    else if (u < 39) whip(ctx, u, 39, S.arte, S.phone, -1);
    else if (u < 44) whip(ctx, u, 44, S.phone, S.end, 1);
    else S.end();
  },
  post(ctx, u) {
    if (!GRAIN) return;
    const f = Math.floor(u * 8);
    const ox = -Math.floor(hash01(f, 3) * 512), oy = -Math.floor(hash01(f, 5) * 512);
    for (let x = ox; x < W; x += 512) for (let y = oy; y < H; y += 512) ctx.drawImage(GRAIN, x, y);
  },
});
