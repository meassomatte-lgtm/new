// Story teaser "Domani nuovo reel" for @measso.mex: flight through dark clouds, lightning, kinetic type.
// 7 s · grid 120 bpm (1 beat = 0.5 s, 14 beats). Pure function of time.
import * as M from './lib/motion.js';

const { W, H, E, prog, lerp, clamp, springU, SPRING, font, layout, glyph, text, fill, rrect, hash01, mulberry32 } = M;
const C = { black: '#050506', red: '#E03A2F', white: '#FFFFFF', grey: '#B9B9BE' };
const ITAL = 'Display', UI = 'UI', HEAVY = 'Heavy';
const FAST = { stiffness: 340, damping: 17 };

const HITS = [
  [0, 'flight', 'whoosh', { len: 3.0, from: 80, to: 500, gain: 0.2, peak: 0.55 }],
  [3.2, 'DOMANI + lightning', 'sub', { len: 1.6, gain: 0.5 }],
  [3.2, 'thunder body', 'thud', { gain: 0.25, pitch: 70, to: 30, len: 0.8 }],
  [5.4, 'REEL', 'thud', { gain: 0.22, pitch: 110, to: 45 }],
  [8.8, 'notifiche', 'tick', { gain: 0.14 }],
  [11.2, 'out', 'whoosh', { len: 1.6, from: 500, to: 80, gain: 0.16, peak: 0.4 }],
];

// ---------------------------------------------------------------- clouds (sprites built once, seeded)
let SPR = [];
function makeClouds() {
  const out = [];
  for (let s = 0; s < 6; s++) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 512;
    const c = cv.getContext('2d'); const R = mulberry32(100 + s);
    for (let i = 0; i < 60; i++) {
      const a = R() * M.TAU, d = Math.pow(R(), 0.7) * 170;
      const x = 256 + Math.cos(a) * d * 1.3, y = 256 + Math.sin(a) * d * 0.75, r = 40 + R() * 90;
      const v = 120 + Math.floor(R() * 90);
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${v},${v},${v + 6},0.16)`); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    // dark undersides give the puffs volume
    for (let i = 0; i < 25; i++) {
      const x = 256 + (R() - 0.5) * 360, y = 300 + R() * 90, r = 50 + R() * 70;
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    out.push(cv);
  }
  return out;
}
const N = 90, RZ = 9;
const PARTS = (() => { const R = mulberry32(7); return Array.from({ length: N }, () => ({ x: (R() - 0.5) * 7, y: (R() - 0.5) * 9, z0: R() * RZ, s: R() < 0.5 ? 0 : 1 + Math.floor(R() * 5), rot: R() * M.TAU, size: 1.4 + R() * 1.8 })); })();
function camZ(t) {
  return 10 * E.outCubic(clamp(t / 1.9)) + 0.7 * t + 8 * E.inCubic(clamp((t - 5.3) / 1.7));
}
function clouds(ctx, t, lit) {
  const cz = camZ(t), f = 900;
  const list = PARTS.map((p) => {
    let z = RZ - ((cz + p.z0) % RZ);
    return { p, z: z + 0.25 };
  }).sort((a, b) => b.z - a.z);
  list.forEach(({ p, z }) => {
    const sc = f / z;
    const x = W / 2 + p.x * sc * 0.55, y = H / 2 + p.y * sc * 0.55;
    const size = p.size * sc * 0.9;
    if (x + size < -200 || x - size > W + 200 || y + size < -200 || y - size > H + 200) return;
    const near = clamp((z - 0.25) / 1.2), far = clamp((RZ - z) / 2.5);
    const a = near * far;
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a * (0.75 + 0.6 * lit); ctx.translate(x, y); ctx.rotate(p.rot + t * 0.05);
    ctx.drawImage(SPR[p.s], -size / 2, -size / 2, size, size);
    ctx.restore();
  });
}

// ---------------------------------------------------------------- type kit
function rise(ctx, str, x, y, f, color, u, u0, { align = 'center', stagger = 0.03, dur = 0.5, track = 0 } = {}) {
  const L = layout(ctx, str, f, track);
  const x0 = align === 'center' ? x - L.width / 2 : x;
  ctx.save(); ctx.beginPath(); ctx.rect(0, y - L.asc - 60, W, L.asc + L.desc + 66); ctx.clip();
  L.glyphs.forEach((g, j) => {
    const p = E.outQuint(prog(u, u0 + j * stagger, u0 + j * stagger + dur));
    if (p > 0) glyph(ctx, g.ch, x0 + g.cx, y + (1 - p) * (L.asc + L.desc + 30), f, color);
  });
  ctx.restore();
}
function slam(ctx, str, x, y, size, color, u, u0, bar) {
  const f = font(size, 900, HEAVY);
  const L = layout(ctx, str, f, -0.02 * size);
  const x0 = x - L.width / 2;
  const p = E.inOutCubic(prog(u, u0 - 0.3, u0 + 0.1));
  if (bar && p > 0) { ctx.fillStyle = bar; ctx.fillRect(x0 - 30, y - L.asc - 22, (L.width + 60) * p, L.asc + L.desc + 44); }
  L.glyphs.forEach((g, j) => {
    const k = springU(u, u0 + j * 0.05, FAST);
    if (k <= 0) return;
    const s = 1.7 - 0.7 * k;
    ctx.save(); ctx.globalAlpha = clamp(k * 3); glyph(ctx, g.ch, x0 + g.cx, y, f, color, s, s); ctx.restore();
  });
}
const fitHeavy = (ctx, str, maxW, max) => Math.min(max, Math.floor((100 * maxW) / layout(ctx, str, font(100, 900, HEAVY), -2).width));
function bell(ctx, x, y, s, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(-14, 8); ctx.bezierCurveTo(-14, -16, -10, -22, 0, -22); ctx.bezierCurveTo(10, -22, 14, -16, 14, 8);
  ctx.lineTo(18, 13); ctx.lineTo(-18, 13); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(0, 17, 5, 0, M.TAU); ctx.fill(); ctx.fillRect(-2, -27, 4, 6);
  ctx.restore();
}

// ---------------------------------------------------------------- scene
function scene(ctx, u, t) {
  fill(ctx, C.black);
  // lightning at the reveal: one structural flash, then a red glow that stays
  const flash = t >= 1.6 ? Math.exp(-(t - 1.6) * 9) + 0.35 * Math.exp(-Math.abs(t - 1.78) * 40) : 0;
  const glow = E.outCubic(prog(t, 1.55, 2.4)) * (1 - 0.6 * E.inCubic(prog(t, 5.6, 7)));
  const gg = ctx.createRadialGradient(W / 2, H * 0.48, 40, W / 2, H * 0.48, H * 0.7);
  gg.addColorStop(0, `rgba(224,58,47,${0.55 * glow})`); gg.addColorStop(0.5, `rgba(120,20,16,${0.25 * glow})`); gg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H);
  clouds(ctx, t, flash + 0.3 * glow);
  // the red light also falls on the clouds (screen blend, over them)
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  const g2 = ctx.createRadialGradient(W / 2, H * 0.5, 60, W / 2, H * 0.5, H * 0.6);
  g2.addColorStop(0, `rgba(224,58,47,${0.42 * glow})`); g2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H); ctx.restore();
  if (flash > 0.01) { ctx.fillStyle = `rgba(235,240,255,${0.75 * flash})`; ctx.fillRect(0, 0, W, H); }
  // vignette
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.75)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

  // type (leaves with the camera at the end)
  const out = E.inCubic(prog(t, 5.6, 6.5));
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.scale(1 + out * 0.6, 1 + out * 0.6); ctx.translate(-W / 2, -H / 2);
  ctx.globalAlpha = 1 - out;
  ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 40;
  const s1 = fitHeavy(ctx, 'DOMANI', W - 140, 300);
  slam(ctx, 'DOMANI', W / 2, 800, s1, C.white, u, 3.2);
  rise(ctx, 'nuovo', W / 2, 935, font(104, 500, ITAL), C.grey, u, 5.0);
  slam(ctx, 'REEL', W / 2, 1230, fitHeavy(ctx, 'REEL', W - 300, 300), C.white, u, 5.4, C.red);
  rise(ctx, 'Resta sintonizzato', W / 2, 1420, font(62, 500, ITAL), C.white, u, 8.0, { stagger: 0.02 });
  // notifications pill with a bell that rings
  const pk = springU(u, 8.8, FAST);
  if (pk > 0) {
    const f = font(36, 800, UI), L = layout(ctx, 'ATTIVA LE NOTIFICHE', f, 4);
    const pw = L.width + 150, ph = 92;
    ctx.save(); ctx.translate(W / 2, 1540); ctx.scale(pk, pk); ctx.shadowColor = 'transparent';
    rrect(ctx, -pw / 2, -ph / 2, pw, ph, ph / 2); ctx.fillStyle = C.white; ctx.fill();
    const ring = 0.35 * Math.sin((u - 9.2) * 9) * Math.exp(-Math.max(0, u - 9.2) * 1.2) * (u > 9.2 ? 1 : 0);
    ctx.save(); ctx.translate(-pw / 2 + 58, 0); ctx.rotate(ring); bell(ctx, 0, 0, 1.3, C.red); ctx.restore();
    text(ctx, 'ATTIVA LE NOTIFICHE', 28, 13, f, C.black, 'center', 4);
    ctx.restore();
  }
  ctx.restore();
  // handle stays to the end
  rise(ctx, '@measso.mex', W / 2, 1700, font(44, 700, UI), C.white, u, 10.6, { stagger: 0.02 });
  // fade to black on the last half second
  const fb = E.inQuad(prog(t, 6.55, 7));
  if (fb > 0) { ctx.fillStyle = `rgba(0,0,0,${fb})`; ctx.fillRect(0, 0, W, H); }
}

let GRAIN = null;
function makeGrain() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512;
  const c = cv.getContext('2d'); const im = c.createImageData(512, 512); const R = mulberry32(9);
  for (let i = 0; i < im.data.length; i += 4) { const v = R() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 14; }
  c.putImageData(im, 0, 0); return cv;
}

M.film({
  fonts: [font(100, 900, HEAVY), font(100, 500, ITAL), font(40, 700, UI), font(40, 800, UI)],
  hits: HITS,
  init() { SPR = makeClouds(); GRAIN = makeGrain(); },
  draw(ctx, u, t) { scene(ctx, u, t); },
  post(ctx, u) {
    if (!GRAIN) return;
    const f = Math.floor(u * 12);
    const ox = -Math.floor(hash01(f, 3) * 512), oy = -Math.floor(hash01(f, 5) * 512);
    for (let x = ox; x < W; x += 512) for (let y = oy; y < H; y += 512) ctx.drawImage(GRAIN, x, y);
  },
});
