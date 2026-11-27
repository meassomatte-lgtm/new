// ASD Rorai Grande: presentation reel. 24 s, Tommy VO (offset 0.4 s), house bed 120 bpm.
// Timings are in SECONDS (t), cut to the VO phrase onsets. Facts only from the club's own poster/profile.
import * as M from './lib/motion.js';

const { W, H, E, prog, lerp, clamp, spring, SPRING, font, layout, glyph, text, fill, cover, rrect, hash01, mulberry32 } = M;
const C = { navy: '#0A1733', navy2: '#11234D', blue: '#2447A6', yellow: '#F0A82A', cream: '#F4EFE6', white: '#FFFFFF', ink: '#0A1733' };
const ITAL = 'Display', UI = 'UI', HEAVY = 'Heavy';
const FAST = { stiffness: 340, damping: 17 };
const sp = (t, t0, cfg = FAST) => spring(t - t0, cfg);
const U = (t) => t / 0.5;   // seconds -> beats on the 120 bpm grid (offset ~0)

// cut points (s)
const CUT = { mini: 2.25, giov: 7.25, prima: 12.7, fam: 14.9, cta: 18.0 };

const HITS = [
  [U(0.1), 'logo spin', 'whoosh', { len: 0.8, from: 150, to: 900, gain: 0.16 }],
  [U(0.9), 'RORAI GRANDE', 'thud', { gain: 0.22, pitch: 110, to: 45 }],
  [U(2.2), 'minibasket', 'whoosh', { len: 0.5, from: 180, to: 900, gain: 0.14 }],
  [U(7.25), 'giovanile', 'whoosh', { len: 0.5, from: 180, to: 900, gain: 0.14 }],
  [U(12.7), 'prima squadra', 'whoosh', { len: 0.5, from: 180, to: 900, gain: 0.14 }],
  [U(13.8), 'DR2', 'thud', { gain: 0.2, pitch: 110, to: 45 }],
  [U(14.9), 'famiglia', 'sub', { len: 1.2, gain: 0.35 }],
  [U(18.0), 'cta', 'whoosh', { len: 0.5, from: 180, to: 900, gain: 0.14 }],
];

// ---------------------------------------------------------------- kit (seconds)
function rise(ctx, str, x, y, f, color, t, t0, { align = 'left', stagger = 0.012, dur = 0.32, track = 0 } = {}) {
  const L = layout(ctx, str, f, track);
  const x0 = align === 'center' ? x - L.width / 2 : align === 'right' ? x - L.width : x;
  ctx.save(); ctx.beginPath(); ctx.rect(0, y - L.asc - 60, W, L.asc + L.desc + 66); ctx.clip();
  L.glyphs.forEach((g, j) => {
    const p = E.outQuint(prog(t, t0 + j * stagger, t0 + j * stagger + dur));
    if (p > 0) glyph(ctx, g.ch, x0 + g.cx, y + (1 - p) * (L.asc + L.desc + 30), f, color);
  });
  ctx.restore();
}
function slam(ctx, str, x, y, size, color, t, t0, { align = 'center', bar = null } = {}) {
  const f = font(size, 900, HEAVY);
  const L = layout(ctx, str, f, -0.02 * size);
  const x0 = align === 'center' ? x - L.width / 2 : x;
  if (bar) {
    const p = E.inOutCubic(prog(t, t0 - 0.12, t0 + 0.08));
    if (p > 0) { ctx.fillStyle = bar; ctx.fillRect(x0 - 26, y - L.asc - 20, (L.width + 52) * p, L.asc + L.desc + 40); }
  }
  L.glyphs.forEach((g, j) => {
    const k = sp(t, t0 + j * 0.018);
    if (k <= 0) return;
    const s = 1.6 - 0.6 * k;
    ctx.save(); ctx.globalAlpha = clamp(k * 3); glyph(ctx, g.ch, x0 + g.cx, y, f, color, s, s); ctx.restore();
  });
}
const fit = (ctx, str, maxW, max) => Math.min(max, Math.floor((100 * maxW) / layout(ctx, str, font(100, 900, HEAVY), -2).width));
function pair(ctx, small, big, y, t, t0, { smallCol = C.white, bigCol = C.yellow, max = 220, bar = null, maxW = W - 160 } = {}) {
  const sz = fit(ctx, big, maxW, max);
  const L = layout(ctx, big, font(sz, 900, HEAVY), -0.02 * sz);
  rise(ctx, small, W / 2 - L.width / 2 + 6, y - L.asc - 30, font(72, 500, ITAL), smallCol, t, t0);
  slam(ctx, big, W / 2, y, sz, bigCol, t, t0 + 0.15, { bar });
}
function pill(ctx, str, cx, cy, t, t0, { bg = C.yellow, fg = C.navy, size = 40 } = {}) {
  const k = sp(t, t0);
  if (k <= 0) return;
  const f = font(size, 800, UI), L = layout(ctx, str, f, size * 0.1);
  const pw = L.width + size * 1.6, ph = size * 2;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
  rrect(ctx, -pw / 2, -ph / 2, pw, ph, ph / 2); ctx.fillStyle = bg; ctx.fill();
  text(ctx, str, 0, size * 0.36, f, fg, 'center', size * 0.1);
  ctx.restore();
}
function bgNavy(ctx, t) {
  fill(ctx, C.navy);
  // court lines drifting: a faint half-court arc + grid
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1.5;
  const off = (t * 20) % 90;
  ctx.beginPath();
  for (let x = -90 + off; x < W + 90; x += 90) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 0; y < H; y += 90) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(240,168,42,0.12)'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(W / 2, H + 120, 620, Math.PI, 0); ctx.stroke();
  ctx.beginPath(); ctx.arc(W / 2, -160, 420, 0, Math.PI); ctx.stroke();
  const vg = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.15, W / 2, H * 0.5, H * 0.75);
  vg.addColorStop(0, 'rgba(36,71,166,0.35)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}
// the club badge spinning around its vertical axis (a coin flip that settles)
function badge(ctx, IMG, x, y, r, t, t0, turns = 1.5) {
  const k = sp(t, t0, { stiffness: 90, damping: 14 });
  if (k <= 0 || !IMG.logo) return;
  const ang = (1 - k) * turns * M.TAU;
  const sx = Math.cos(ang);
  ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(0.02, Math.abs(sx)) * clamp(k * 1.4), clamp(k * 1.4));
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 20;
  ctx.drawImage(IMG.logo, -r, -r, 2 * r, 2 * r);
  ctx.shadowColor = 'transparent';
  // edge sheen while turning
  if (Math.abs(sx) < 0.98) { ctx.fillStyle = `rgba(255,255,255,${0.25 * (1 - Math.abs(sx))})`; ctx.beginPath(); ctx.arc(0, 0, r, 0, M.TAU); ctx.fill(); }
  ctx.restore();
}
function card(ctx, img, x, y, w, h, rot, { fx = 0.5, fy = 0.5, zoom = 1, edge = C.yellow } = {}) {
  if (!img) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 26;
  rrect(ctx, -w / 2 - 12, -h / 2 - 12, w + 24, h + 24, 30); ctx.fillStyle = edge; ctx.fill();
  ctx.shadowColor = 'transparent';
  cover(ctx, img, -w / 2, -h / 2, w, h, { fx, fy, zoom, radius: 20 });
  ctx.restore();
}

// real footage (assets/video/A = empty court with the painted R, B = youth team huddle), 24 fps frames
function clip(ctx, IMG, key, n, t, t0, speed = 1, { zoom = 1, fy = 0.5 } = {}) {
  const i = Math.max(1, Math.min(n, Math.floor((t - t0) * 24 * speed) + 1));
  const img = IMG[key + i];
  if (img) cover(ctx, img, 0, 0, W, H, { fx: 0.5, fy, zoom });
}
// ---------------------------------------------------------------- scenes
function sLogo(ctx, t, IMG) {
  fill(ctx, C.navy);
  // the PalaRorai court with the R painted at centre: the badge spins up out of it
  const z = 1.0 * (1.12 / 1.0) ** E.inOutSine(prog(t, 0, 2.3));
  ctx.save(); ctx.translate(W / 2, 1020); ctx.scale(z, z); ctx.translate(-W / 2, -1020);
  clip(ctx, IMG, 'A', 71, t, 0, 1);
  ctx.restore();
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(10,23,51,0.88)'); g.addColorStop(0.35, 'rgba(10,23,51,0.35)'); g.addColorStop(1, 'rgba(10,23,51,0.6)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  badge(ctx, IMG, W / 2, 1020, 300, t, 0.55, 1.5);
  pair(ctx, 'Questa è', 'RORAI GRANDE', 520, t, 0.15, { max: 160 });
}
const CATS = [['PULCINI', '2020–21'], ['SCOIATTOLI', '2018–19'], ['AQUILOTTI', '2016–17'], ['ESORDIENTI', '2015']];
function sMini(ctx, t, IMG) {
  bgNavy(ctx, t);
  slam(ctx, 'MINIBASKET', W / 2, 400, fit(ctx, 'MINIBASKET', W - 150, 200), C.yellow, t, 2.3);
  rise(ctx, 'per i più piccoli', W / 2, 500, font(64, 500, ITAL), C.white, t, 3.1, { align: 'center' });
  // the poster's kids illustration, as a tilted card
  const k = sp(t, 2.35, { stiffness: 220, damping: 22 });
  card(ctx, IMG.locandina, W / 2 + 220 + (1 - k) * 700, 1000, 380, 560, 0.05, { fx: 0.25, fy: 0.75, zoom: 1.5 + 0.08 * prog(t, 2.2, 7) });
  CATS.forEach(([n, y], i) => {
    const t0 = 3.0 + i * 0.28, kk = sp(t, t0);
    if (kk <= 0) return;
    const yy = 790 + i * 150, x = 90 + (1 - kk) * -600;
    ctx.save(); ctx.translate(x, 0);
    rrect(ctx, 0, yy - 52, 470, 116, 20); ctx.fillStyle = C.navy2; ctx.fill();
    ctx.fillStyle = C.yellow; rrect(ctx, 0, yy - 52, 14, 116, 7); ctx.fill();
    text(ctx, n, 40, yy + 6, font(44, 900, HEAVY), C.white, 'left');
    text(ctx, 'nati ' + y, 40, yy + 48, font(33, 700, UI), C.yellow, 'left', 2);
    ctx.restore();
  });
  rise(ctx, 'Il primo canestro non si scorda mai.', W / 2, 1420, font(52, 500, ITAL), C.white, t, 4.6, { align: 'center', stagger: 0.008 });
}
function sGiov(ctx, t, IMG) {
  fill(ctx, C.navy);
  // the youth team on court (real footage, slowed to fill the scene), slow push-in
  ctx.save(); ctx.filter = 'brightness(0.7) saturate(1.05)';
  clip(ctx, IMG, 'B', 104, t, 7.1, 0.78, { zoom: 1.0 * (1.1 / 1.0) ** E.inOutSine(prog(t, 7.2, 12.8)), fy: 0.55 });
  ctx.restore();
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(10,23,51,0.85)'); g.addColorStop(0.5, 'rgba(10,23,51,0.35)'); g.addColorStop(1, 'rgba(10,23,51,0.9)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  rise(ctx, 'Il', 110, 330, font(72, 500, ITAL), C.white, t, 7.1);
  slam(ctx, 'SETTORE', 90, 500, fit(ctx, 'GIOVANILE', W - 180, 210), C.white, t, 7.15, { align: 'left' });
  slam(ctx, 'GIOVANILE', 90, 690, fit(ctx, 'GIOVANILE', W - 180, 210), C.yellow, t, 7.4, { align: 'left' });
  ['U13', 'U14', 'U15', 'U17'].forEach((n, i) => {
    const t0 = 8.6 + i * 0.4, k = sp(t, t0);
    if (k <= 0) return;
    const cx = 200 + i * 226, cy = 960;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
    ctx.beginPath(); ctx.arc(0, 0, 96, 0, M.TAU); ctx.fillStyle = i % 2 ? C.blue : C.yellow; ctx.fill();
    text(ctx, n, 0, 22, font(64, 900, HEAVY), i % 2 ? C.white : C.navy, 'center');
    ctx.restore();
  });
  rise(ctx, 'qui si cresce', W / 2, 1260, font(80, 500, ITAL), C.white, t, 11.05, { align: 'center' });
  slam(ctx, 'INSIEME', W / 2, 1420, 150, C.navy, t, 11.35, { bar: C.yellow });
}
function sPrima(ctx, t, IMG) {
  bgNavy(ctx, t);
  const k = sp(t, 12.65, { stiffness: 260, damping: 24 });
  card(ctx, IMG.prima, W / 2 + (1 - k) * W, 960, 960, 640, -0.025 * k, { fx: 0.5, fy: 0.5, zoom: 1.0 + 0.05 * prog(t, 12.7, 15) });
  rise(ctx, 'E la', 110, 330, font(72, 500, ITAL), C.white, t, 12.75);
  slam(ctx, 'PRIMA SQUADRA', W / 2, 520, fit(ctx, 'PRIMA SQUADRA', W - 160, 170), C.yellow, t, 12.9);
  pill(ctx, 'IN DR2', W / 2, 1420, t, 13.75, { size: 52 });
}
function sFam(ctx, t, IMG) {
  fill(ctx, C.yellow);
  // basketball seams sweeping across the yellow
  ctx.strokeStyle = 'rgba(10,23,51,0.12)'; ctx.lineWidth = 14;
  const r0 = 900 + (t - 14.9) * 40;
  ctx.beginPath(); ctx.arc(W / 2, H / 2, r0, 0, M.TAU); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-200, H / 2, 700, 1200, 0, -0.9, 0.9); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(W + 200, H / 2, 700, 1200, 0, Math.PI - 0.9, Math.PI + 0.9); ctx.stroke();
  badge(ctx, IMG, W / 2, 1000, 200, t, 14.55, 1);
  pair(ctx, 'Un’unica', 'FAMIGLIA', 560, t, 14.7, { smallCol: C.navy, bigCol: C.navy, max: 240 });
  pill(ctx, 'PALARORAI · VIA MAGGIORE', W / 2, 1360, t, 16.3, { bg: C.navy, fg: C.white, size: 40 });
  rise(ctx, 'DAL 1990', W / 2, 1270, font(40, 800, UI), C.navy, t, 16.0, { align: 'center', track: 10 });
}
function sCta(ctx, t, IMG) {
  bgNavy(ctx, t);
  pair(ctx, 'Vieni a', 'PROVARE!', 460, t, 17.8, { max: 230 });
  badge(ctx, IMG, W / 2, 800, 190, t, 17.7, 1);
  pill(ctx, '@asd_roraigrande', W / 2, 1110, t, 19.0, { size: 46 });
  rise(ctx, 'PER INFO', W / 2, 1250, font(30, 800, UI), C.yellow, t, 20.0, { align: 'center', track: 8 });
  rise(ctx, '333 2116124  ·  333 7834586', W / 2, 1320, font(44, 700, UI), C.white, t, 20.2, { align: 'center', stagger: 0.006 });
  rise(ctx, 'roraigrande@gmail.com', W / 2, 1385, font(40, 500, UI), C.cream, t, 20.5, { align: 'center', stagger: 0.006 });
}

function whip(ctx, t, tc, A, B, dir = 1, dur = 0.16) {
  const p = E.inOutCubic(prog(t, tc - dur, tc));
  if (p <= 0) { A(); return; }
  if (p >= 1) { B(); return; }
  ctx.save(); ctx.translate(-dir * p * W, 0); A(); ctx.restore();
  ctx.save(); ctx.translate(dir * (1 - p) * W, 0); B(); ctx.restore();
}
let GRAIN = null;
function makeGrain() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512;
  const c = cv.getContext('2d'); const im = c.createImageData(512, 512); const R = mulberry32(9);
  for (let i = 0; i < im.data.length; i += 4) { const v = R() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 9; }
  c.putImageData(im, 0, 0); return cv;
}

M.film({
  fonts: [font(100, 900, HEAVY), font(100, 500, ITAL), font(40, 600, UI), font(40, 800, UI)],
  images: { logo: 'assets/logo.png', partita: 'assets/partita.png', locandina: 'assets/locandina.png', prima: 'assets/prima_squadra.jpg',
    ...Object.fromEntries(Array.from({ length: 71 }, (_, i) => ['A' + (i + 1), `assets/video/A/f${String(i + 1).padStart(3, '0')}.jpg`])),
    ...Object.fromEntries(Array.from({ length: 104 }, (_, i) => ['B' + (i + 1), `assets/video/B/f${String(i + 1).padStart(3, '0')}.jpg`])),
  },
  hits: HITS,
  init() { GRAIN = makeGrain(); },
  draw(ctx, u, t, IMG) {
    const S = [() => sLogo(ctx, t, IMG), () => sMini(ctx, t, IMG), () => sGiov(ctx, t, IMG), () => sPrima(ctx, t, IMG), () => sFam(ctx, t, IMG), () => sCta(ctx, t, IMG)];
    const cuts = [CUT.mini, CUT.giov, CUT.prima, CUT.fam, CUT.cta];
    let i = cuts.findIndex((c) => t < c);
    if (i === -1) { S[5](); return; }
    whip(ctx, t, cuts[i], S[i], S[i + 1], i % 2 ? -1 : 1);
  },
  post(ctx, u) {
    if (!GRAIN) return;
    const f = Math.floor(u * 8);
    const ox = -Math.floor(hash01(f, 3) * 512), oy = -Math.floor(hash01(f, 5) * 512);
    for (let x = ox; x < W; x += 512) for (let y = oy; y < H; y += 512) ctx.drawImage(GRAIN, x, y);
  },
});
