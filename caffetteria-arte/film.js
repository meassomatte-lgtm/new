// Caffetteria d'Arte: pure function of time. window.seek(t) paints frame t (see lib/motion.js).
// Timing is in beats (u) on the measured grid (96 bpm, 32 beats = 20 s); docs/shotlist.md is the plan.
import * as M from './lib/motion.js';
import * as AERIAL from './aerial.js';

const { W, H, FORMAT, E, prog, lerp, clamp, springU, springKeys, SPRING, wobble, font, layout, glyph, text, fill, cover, rrect, hash01, mulberry32 } = M;

// Brand tokens: from the logo (cream + coffee) with one accent (terracotta, from the painting).
const C = {
  cream: '#F1E6C8', paper: '#EADFC6', coffee: '#3B2418', coffee2: '#4A2F20', accent: '#D9622B',
  muted: '#8A7360', river: '#A9C2BD', park: '#C3CB9C', block: '#DCCDAE', block2: '#D3C2A0', road: '#FBF6EA',
};
const DISPLAY = 'Display', UI = 'UI';

const HITS = [
  [0, 'map open', 'whoosh', { len: 0.8, from: 300, to: 1600 }],
  [0.25, 'PORDENONE', 'tick'],
  [2.5, 'Viale Marconi label', 'tick'],
  [4.5, 'pin falls', 'whoosh', { len: 0.3, from: 2400, to: 500 }],
  [5, 'pin lands', 'thud'],
  [5.5, 'address card', 'pop', { pitch: 'C6' }],
  [6, 'logo lands', 'impact'],
  [6.5, 'SIAMO', 'bell', { pitch: 'F6' }],
  [7.5, 'APERTI on', 'bell', { pitch: 'C6' }],
  [10, 'orari row 1', 'pop', { pitch: 'F5' }],
  [11, 'orari row 2', 'pop', { pitch: 'A5' }],
  [12, 'orari row 3', 'pop', { pitch: 'C6' }],
  [14.5, 'coffee wipe', 'whoosh', { len: 0.5 }],
  [15, 'card colazione', 'thud'],
  [18, 'pan pranzo', 'whoosh', { len: 0.4, from: 600, to: 2400 }],
  [21, 'pan aperitivo', 'whoosh', { len: 0.4, from: 2400, to: 600, pan: 0.3 }],
  [23.6, 'cream rises', 'whoosh', { len: 0.4 }],
  [24, 'Arte', 'pop', { pitch: 'F5' }],
  [25, 'Libri', 'pop', { pitch: 'G5' }],
  [26, 'Relax', 'pop', { pitch: 'A5' }],
  [27, 'Incontri', 'pop', { pitch: 'C6' }],
  [28, 'end card', 'impact'],
  [28.5, 'logo', 'bell', { pitch: 'F6' }],
];

// ================================================================ helpers
function ease01(u, a, b, e = E.outQuint) { return e(prog(u, a, b)); }
function logoDisc(ctx, IMG, x, y, r, rot = 0) {
  // the real logo, clipped to its own cream disc (the crop has the Instagram ring around it)
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, M.TAU); ctx.fillStyle = C.cream; ctx.fill();
  ctx.clip();
  const img = IMG.logo;
  if (img) { const s = (2 * r) / (img.width * 0.86); ctx.drawImage(img, -img.width * 0.5 * s, -img.height * 0.5 * s, img.width * s, img.height * s); }
  ctx.restore();
}
function polaroid(ctx, img, x, y, w, h, rot, { pad = 22, bottom = 90, fx = 0.5, fy = 0.5, zoom = 1, shadow = 0.28 } = {}) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot);
  const fw = w + pad * 2, fh = h + pad + bottom;
  ctx.shadowColor = `rgba(30,15,5,${shadow})`; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  ctx.fillStyle = '#FFFBF2'; ctx.fillRect(-fw / 2, -fh / 2, fw, fh);
  ctx.shadowColor = 'transparent';
  if (img) cover(ctx, img, -fw / 2 + pad, -fh / 2 + pad, w, h, { fx, fy, zoom });
  ctx.restore();
  return { fw, fh };
}

// ================================================================ aerial map (aerial.js, painted once)
const CAFE_W = [Math.cos(AERIAL.ANG) * 0 - Math.sin(AERIAL.ANG) * -19, Math.sin(AERIAL.ANG) * 0 + Math.cos(AERIAL.ANG) * -19];
const LV = {};
function buildMap() {
  AERIAL.buildWorld();
  LV.city = AERIAL.paintLevel(-200, -150, 4200, 6144);
  LV.mid = AERIAL.paintLevel(CAFE_W[0], CAFE_W[1], 1200, 6144);
  LV.block = AERIAL.paintLevel(CAFE_W[0], CAFE_W[1], 420, 6144);
}

// ---------------------------------------------------------------- S1 zoom dall'alto   (u 0..6)
const PIN = { x: W / 2, y: H * 0.46 };
function camAt(u) {
  // log-space dolly: constant-rate descent from the whole town to the street
  const p = E.inOutSine(prog(u, -0.8, 5.0));
  const s = 0.26 * (8 / 0.26) ** p;
  const q = E.inOutCubic(prog(u, 0, 4.4));
  const cx = lerp(-350, CAFE_W[0], q), cy = lerp(-250, CAFE_W[1], q);
  const rot = lerp(-AERIAL.ANG - 0.55, -AERIAL.ANG, E.inOutCubic(prog(u, 0, 5)));   // the avenue turns horizontal
  return { s, cx, cy, rot };
}
function drawLevel(ctx, L, c, alpha) {
  if (alpha <= 0) return;
  const k = L.cv.width / (2 * L.half);
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.translate(PIN.x, PIN.y); ctx.rotate(c.rot); ctx.scale(c.s, c.s); ctx.translate(-c.cx, -c.cy);
  ctx.imageSmoothingQuality = 'high';
  ctx.filter = 'saturate(0.78) contrast(1.06) brightness(1.02)';
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
  // altitude haze + soft vignette
  const haze = clamp(1 - Math.log(c.s / 0.26) / Math.log(8 / 0.26) * 1.6);
  if (haze > 0) { ctx.fillStyle = `rgba(214,224,232,${0.32 * haze})`; ctx.fillRect(0, 0, W, H); }
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,8,5,0.38)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  // clouds we fall through at the start
  const cl = prog(u, -0.2, 2.4);
  if (cl < 1) {
    const R = mulberry32(12);
    for (let i = 0; i < 9; i++) {
      const ax = R() * W, ay = R() * H, r0 = 260 + R() * 320;
      const dx = ax - W / 2, dy = ay - H / 2;
      const push = 1 + E.inCubic(cl) * 2.2;
      const x = W / 2 + dx * push, y = H / 2 + dy * push, r = r0 * (1 + cl * 1.5);
      const a = 0.85 * (1 - E.inQuad(cl));
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.6, `rgba(250,250,252,${a * 0.6})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
  }
  const shadowText = (fn) => { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 4; fn(); ctx.restore(); };
  // "PORDENONE": over the town, lifts away as we descend
  const sz = 118;
  const fOut = E.inBack(prog(u, 2.0, 2.7), 1.3);
  if (fOut < 1) {
    const f = font(sz, 800, UI);
    const L = layout(ctx, 'PORDENONE', f, sz * 0.12);
    const y0 = H * 0.27 - fOut * 900;
    shadowText(() => L.glyphs.forEach((g, j) => {
      const k = springU(u, -0.2 + j * 0.035, SPRING.bouncy);
      if (k > 0) glyph(ctx, g.ch, W / 2 - L.width / 2 + g.cx, y0 + (1 - k) * 80, f, '#FFFFFF', 1, k);
    }));
    const t2 = ease01(u, 0.5, 1.3);
    shadowText(() => text(ctx, 'FRIULI VENEZIA GIULIA', W / 2, y0 + 70, font(36, 600, UI), `rgba(255,255,255,${0.9 * t2})`, 'center', 8));
  }
  // street label on the avenue, Google-Earth style
  const lab = ease01(u, 2.6, 3.3);
  if (lab > 0) {
    const ang = AERIAL.ANG + c.rot;
    const wx = CAFE_W[0] - Math.cos(AERIAL.ANG) * 60, wy = CAFE_W[1] - Math.sin(AERIAL.ANG) * 60;
    const dx = wx - c.cx, dy = wy - c.cy;
    const lx = PIN.x + (dx * Math.cos(c.rot) - dy * Math.sin(c.rot)) * c.s;
    const ly = PIN.y + (dx * Math.sin(c.rot) + dy * Math.cos(c.rot)) * c.s;
    ctx.save(); ctx.translate(lx, ly + 150); ctx.rotate(ang); ctx.globalAlpha = lab;
    shadowText(() => text(ctx, 'Viale Marconi', 0, -(1 - lab) * 20, font(50, 700, UI), '#FFFFFF', 'center', 2));
    ctx.restore();
  }
  // pin: falls on 4.5, lands on 5, squashes
  if (u >= 4.5) {
    const fallP = prog(u, 4.5, 5);
    const yDrop = u < 5 ? -700 * (1 - E.inQuad(fallP)) : 0;
    const sq = u >= 5 ? 0.18 * wobble(u - 5, 2.5, 4) : 0;
    drawPin(ctx, PIN.x, PIN.y + yDrop, 1 + sq, 1 - sq);
    if (u >= 5) {
      const r = ease01(u, 5, 6, E.outCubic);
      ctx.save(); ctx.globalAlpha = 1 - r; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.ellipse(PIN.x, PIN.y, 40 + r * 170, (40 + r * 170) * 0.35, 0, 0, M.TAU); ctx.stroke(); ctx.restore();
    }
  }
  // address card under the pin
  const ac = springU(u, 5.4, SPRING.bouncy);
  if (ac > 0) {
    const w = 640, h = 150, x = W / 2 - w / 2, y = PIN.y + 90 + (1 - ac) * 60;
    ctx.save(); ctx.globalAlpha = clamp(ac * 2);
    ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
    rrect(ctx, x, y, w, h, 28); ctx.fillStyle = C.coffee; ctx.fill(); ctx.shadowColor = 'transparent';
    text(ctx, 'Caffetteria d’Arte', W / 2, y + 66, font(52, 700, DISPLAY), C.cream, 'center');
    text(ctx, 'VIALE MARCONI 40', W / 2, y + 118, font(32, 600, UI), C.accent, 'center', 5);
    ctx.restore();
  }
}
function drawPin(ctx, x, y, sx = 1, sy = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy);
  ctx.shadowColor = 'rgba(40,20,5,0.3)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 10;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-18, -40, -62, -70, -62, -118);
  ctx.arc(0, -118, 62, Math.PI, 0);
  ctx.bezierCurveTo(62, -70, 18, -40, 0, 0);
  ctx.fillStyle = C.accent; ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.beginPath(); ctx.arc(0, -118, 30, 0, M.TAU); ctx.fillStyle = C.cream; ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- S2 SIAMO APERTI   (u 6..10)
// The pin head's cream dot grows to fill the frame (5.5..6): the iris carries into the logo.
function logoPose(u) {
  // big and centred, then lifts into the header for the opening hours
  const k = springU(u, 9.4, SPRING.gentle);
  return { x: W / 2, y: lerp(H * 0.36, 380, k), r: lerp(250, 120, k) };
}
function sceneOpen(ctx, u, IMG) {
  fill(ctx, C.cream);
  const lp = logoPose(u);
  const drop = springU(u, 5.8, SPRING.bouncy);
  const sp = 0.06 * wobble(u - 6.2, 2.2, 5);
  logoDisc(ctx, IMG, lp.x, lp.y - (1 - drop) * 260, lp.r * (0.6 + 0.4 * drop) * (1 + sp), (1 - drop) * -0.5);
  // ring around the logo in coffee
  ctx.beginPath(); ctx.arc(lp.x, lp.y - (1 - drop) * 260, lp.r * (0.6 + 0.4 * drop) + 14, 0, M.TAU);
  ctx.strokeStyle = C.coffee; ctx.lineWidth = 6; ctx.stroke();

  const out = E.inBack(prog(u, 9.2, 9.8), 1.4);
  // "SIAMO" in UI caps, "aperti" in display italic: an insegna switching on
  const by = H * 0.36 + 470 - out * 900;
  const k1 = springU(u, 6.5, SPRING.snappy);
  if (k1 > 0) {
    const L = layout(ctx, 'SIAMO', font(86, 800, UI), 30);
    L.glyphs.forEach((g, j) => {
      const k = springU(u, 6.5 + j * 0.06, SPRING.bouncy);
      glyph(ctx, g.ch, W / 2 - L.width / 2 + g.cx, by - 170 + (1 - k) * 50, font(86, 800, UI), C.coffee, 1, k);
    });
  }
  if (u >= 7.3) {
    const f = font(250, 800, DISPLAY);
    const L = layout(ctx, 'aperti!', f, -4);
    L.glyphs.forEach((g, j) => {
      // flicker on like a sign: each letter its own seeded stutter, settling lit on 7.5 + j*0.12
      const u0 = 7.3 + j * 0.1;
      const lit = u > u0 + 0.35 ? 1 : (hash01(Math.floor((u - u0) * 24) + j * 13, 7) > 0.45 ? 1 : 0.18);
      const col = lit === 1 ? C.accent : 'rgba(217,98,43,0.18)';
      glyph(ctx, g.ch, W / 2 - L.width / 2 + g.cx, by + 60, f, u < u0 ? 'rgba(217,98,43,0.12)' : col);
    });
  }
  // underline swash draws under "aperti"
  const sw = ease01(u, 8.0, 8.8, E.inOutCubic);
  if (sw > 0) {
    ctx.save(); ctx.beginPath();
    const x0 = W / 2 - 300, x1 = W / 2 + 300, y = by + 120;
    ctx.moveTo(x0, y);
    ctx.quadraticCurveTo(W / 2, y + 40, x0 + (x1 - x0) * sw, y - 10 * sw);
    ctx.strokeStyle = C.coffee; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore();
  }
}

// ---------------------------------------------------------------- S3 orari   (u 10..15)
const ROWS = [
  { day: 'LUNEDÌ – VENERDÌ', hrs: '7:00 – 20:30', u: 10 },
  { day: 'SABATO', hrs: '8:00 – 15:00', u: 11 },
  { day: 'DOMENICA', hrs: 'chiuso', u: 12, off: true },
];
function sceneHours(ctx, u, IMG) {
  fill(ctx, C.cream);
  const lp = logoPose(u);
  logoDisc(ctx, IMG, lp.x, lp.y, lp.r);
  ctx.beginPath(); ctx.arc(lp.x, lp.y, lp.r + 14, 0, M.TAU); ctx.strokeStyle = C.coffee; ctx.lineWidth = 6; ctx.stroke();
  // title
  const tk = springU(u, 9.7, SPRING.snappy);
  text(ctx, 'I nostri orari', W / 2, 660 + (1 - tk) * 60, font(96, 700, DISPLAY), `rgba(59,36,24,${clamp(tk * 1.5)})`, 'center');
  const x0 = 110, x1 = W - 110;
  ROWS.forEach((r, i) => {
    const k = springU(u, r.u - 0.2, SPRING.snappy);
    if (k <= 0) return;
    const y = 800 + i * 230;
    const dx = (1 - k) * -W;
    ctx.save(); ctx.translate(dx, 0);
    rrect(ctx, x0, y, x1 - x0, 196, 30);
    ctx.fillStyle = r.off ? 'rgba(59,36,24,0.06)' : C.coffee; ctx.fill();
    text(ctx, r.day, x0 + 50, y + 70, font(34, 700, UI), r.off ? C.muted : C.accent, 'left', 5);
    text(ctx, r.hrs, x0 + 50, y + 160, font(r.off ? 84 : 92, 700, r.off ? DISPLAY : UI), r.off ? C.muted : C.cream, 'left', r.off ? 0 : -2);
    ctx.restore();
  });
  // small clock: hands sweep the day once the rows are in
  const ck = springU(u, 12.6, SPRING.bouncy);
  if (ck > 0) {
    const cx = W - 200, cy = 800 + 2 * 230 + 98, R0 = 62 * ck;
    ctx.beginPath(); ctx.arc(cx, cy, R0, 0, M.TAU); ctx.fillStyle = C.accent; ctx.fill();
    const hrs = 7 + 13.5 * E.inOutCubic(prog(u, 12.6, 14.4));
    const ha = (hrs / 12) * M.TAU - Math.PI / 2, ma = (hrs % 1) * M.TAU - Math.PI / 2;
    ctx.strokeStyle = C.cream; ctx.lineCap = 'round';
    ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ha) * R0 * 0.5, cy + Math.sin(ha) * R0 * 0.5); ctx.stroke();
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ma) * R0 * 0.75, cy + Math.sin(ma) * R0 * 0.75); ctx.stroke();
  }
}

// ---------------------------------------------------------------- S4-6 quando passare   (u 15..24)
function cappuccino(ctx, x, y, r) {
  // top view of a cappuccino on its saucer: pure shape, no invented photo
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.arc(0, 0, r * 1.45, 0, M.TAU); ctx.fillStyle = '#FFFBF2'; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, r * 1.45, 0, M.TAU); ctx.strokeStyle = '#E8DCC2'; ctx.lineWidth = 6; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(r * 1.12, -r * 0.05, r * 0.34, r * 0.16, 0, 0, M.TAU); ctx.fillStyle = '#FFFBF2'; ctx.fill();
  ctx.strokeStyle = '#E8DCC2'; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r * 1.02, 0, M.TAU); ctx.fillStyle = '#FFFFFF'; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.88, 0, M.TAU); ctx.fillStyle = '#8B5A35'; ctx.fill();
  // latte-art heart
  ctx.fillStyle = '#F6EBD9';
  ctx.beginPath(); ctx.ellipse(0, 0, r * 0.62, r * 0.6, 0, 0, M.TAU); ctx.fill();
  ctx.fillStyle = '#8B5A35';
  ctx.beginPath(); ctx.moveTo(0, r * 0.42);
  ctx.bezierCurveTo(-r * 0.55, -r * 0.05, -r * 0.3, -r * 0.5, 0, -r * 0.2);
  ctx.bezierCurveTo(r * 0.3, -r * 0.5, r * 0.55, -r * 0.05, 0, r * 0.42); ctx.fill();
  ctx.fillStyle = '#F6EBD9';
  ctx.beginPath(); ctx.moveTo(0, r * 0.3);
  ctx.bezierCurveTo(-r * 0.36, -r * 0.02, -r * 0.2, -r * 0.33, 0, -r * 0.1);
  ctx.bezierCurveTo(r * 0.2, -r * 0.33, r * 0.36, -r * 0.02, 0, r * 0.3); ctx.fill();
  ctx.restore();
}
// cornetto: a croissant drawn as five crescents
function cornetto(ctx, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  const seg = [[-1.6, 0.55], [-0.8, 0.8], [0, 1], [0.8, 0.8], [1.6, 0.55]];
  seg.forEach(([dx, sc], i) => {
    ctx.beginPath(); ctx.ellipse(dx * 34, (Math.abs(dx) ** 2) * 9, 40 * sc, 46 * sc, dx * 0.5, 0, M.TAU);
    ctx.fillStyle = i % 2 ? '#C98A3E' : '#B8742C'; ctx.fill();
    ctx.strokeStyle = '#8E5520'; ctx.lineWidth = 3; ctx.stroke();
  });
  ctx.restore();
}
const CARDS = [
  { n: '01', title: 'Colazione', sub: 'cappuccino e cornetto, dalle 7:00' },
  { n: '02', title: 'Pranzo veloce', sub: 'la pausa giusta, a due passi' },
  { n: '03', title: 'Aperitivo', sub: 'e le serate del Language Club' },
];
function card(ctx, i, cx, cy, u, IMG) {
  const w = 840, h = 1000, x = cx - w / 2, y = cy - h / 2;
  const sway = 0.03 * wobble(u - (15 + i * 3), 1.6, 3.5);
  ctx.save(); ctx.translate(cx, cy + h / 2); ctx.rotate(sway); ctx.translate(-cx, -(cy + h / 2));
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 24;
  rrect(ctx, x, y, w, h, 36); ctx.fillStyle = C.cream; ctx.fill(); ctx.shadowColor = 'transparent';
  const px = x + 34, py = y + 34, pw = w - 68, ph = 640;
  const push = 1 + 0.06 * prog(u, 15 + i * 3, 15 + i * 3 + 3.2);
  if (i === 0) {
    rrect(ctx, px, py, pw, ph, 24); ctx.fillStyle = '#D9C6A0'; ctx.fill();
    ctx.save(); rrect(ctx, px, py, pw, ph, 24); ctx.clip();
    // wood-ish table stripes
    for (let k = 0; k < 9; k++) { ctx.fillStyle = k % 2 ? 'rgba(120,80,40,0.08)' : 'rgba(255,255,255,0.06)'; ctx.fillRect(px, py + k * 75, pw, 75); }
    const steam = u - 15;
    cappuccino(ctx, px + pw * 0.42, py + ph * 0.5, 150 * push);
    cornetto(ctx, px + pw * 0.8, py + ph * 0.8, 1.15 * push, -0.5);
    ctx.restore();
  } else if (i === 1) {
    rrect(ctx, px, py, pw, ph, 24); ctx.fillStyle = C.coffee2; ctx.fill();
    ctx.save(); rrect(ctx, px, py, pw, ph, 24); ctx.clip();
    // the wide panino photo, as a print on a darker board
    if (IMG.panino) polaroid(ctx, IMG.panino, px + pw / 2, py + ph / 2 + 10, pw - 50, (pw - 50) * IMG.panino.height / IMG.panino.width, -0.04, { pad: 16, bottom: 16, zoom: push });
    ctx.restore();
  } else {
    if (IMG.club) cover(ctx, IMG.club, px, py, pw, ph, { fx: 0.5, fy: 0.62, zoom: 1.15 * push, radius: 24 });
  }
  text(ctx, CARDS[i].n, x + 50, y + ph + 34 + 92, font(40, 700, UI), C.accent, 'left', 4);
  text(ctx, CARDS[i].title, x + 50, y + ph + 34 + 190, font(104, 700, DISPLAY), C.coffee, 'left');
  text(ctx, CARDS[i].sub, x + 50, y + ph + 34 + 262, font(40, 500, UI), C.muted, 'left');
  ctx.restore();
}
function sceneWhen(ctx, u, IMG) {
  fill(ctx, C.coffee);
  // title stays; the carousel pans one card per three beats
  const tk = springU(u, 14.8, SPRING.snappy);
  const tOut = E.inBack(prog(u, 23.4, 23.9), 1.3);
  const ty = 300 + (1 - tk) * 40 - tOut * 300;
  text(ctx, 'QUANDO PASSARE?', W / 2, ty, font(48, 800, UI), C.accent, 'center', 10);
  const pos = springKeys(u, [[0, 0], [17.7, 1], [20.7, 2]], SPRING.snappy);
  const rise = springU(u, 14.7, SPRING.gentle);
  const drop = E.inBack(prog(u, 23.4, 24), 1.2);
  // dots
  for (let i = 0; i < 3; i++) {
    const a = clamp(1 - Math.abs(pos - i));
    ctx.beginPath(); ctx.roundRect(W / 2 - 90 + i * 70 - a * 14, 1470 + tOut * 200, 28 + a * 28, 14, 7);
    ctx.fillStyle = a > 0.5 ? C.accent : 'rgba(241,230,200,0.35)'; ctx.fill();
  }
  for (let i = 0; i < 3; i++) {
    const cx = W / 2 + (i - pos) * (W * 0.92);
    if (Math.abs(cx - W / 2) > W * 1.2) continue;
    const cy = 920 + (1 - rise) * 1300 + drop * 1500;
    card(ctx, i, cx, cy, u, IMG);
  }
}
// coffee stain wipe from the bottom-right: the cream world gives way to coffee (14.5..15)
function coffeeWipe(ctx, u) {
  const p = E.inOutCubic(prog(u, 14.4, 15));
  if (p <= 0) return;
  const r = p * Math.hypot(W, H) * 1.05;
  ctx.beginPath();
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * M.TAU, rr = r * (1 + 0.05 * Math.sin(a * 7 + 1.3) + 0.03 * Math.sin(a * 13));
    const X = W * 0.85 + Math.cos(a) * rr, Y = H * 1.02 + Math.sin(a) * rr;
    i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
  }
  ctx.fillStyle = C.coffee; ctx.fill();
}

// ---------------------------------------------------------------- S7 perche' sceglierci   (u 24..28)
const WORDS = [['Arte', 'quadri alle pareti'], ['Libri', 'da sfogliare con calma'], ['Relax', 'il tuo angolo tranquillo'], ['Incontri', 'punto d’incontro e condivisione']];
function sceneWhy(ctx, u, IMG) {
  fill(ctx, C.cream);
  const tk = springU(u, 23.8, SPRING.snappy);
  text(ctx, 'Perché sceglierci?', 100, 340 + (1 - tk) * 50, font(96, 700, DISPLAY), C.coffee, 'left');
  // the painting falls in as a polaroid, settles tilted
  const pk = springU(u, 24, SPRING.bouncy);
  if (pk > 0 && IMG.quadro) {
    const pw = 340, ph = pw * IMG.quadro.height / IMG.quadro.width;
    polaroid(ctx, IMG.quadro, W - 280, lerp(-600, 700, pk), pw, ph, lerp(0.5, 0.09, pk) + 0.02 * wobble(u - 24.4, 1.8, 4), { pad: 20, bottom: 70 });
    const nk = ease01(u, 24.6, 25.2);
    if (nk > 0) text(ctx, 'le opere esposte', W - 280 + 30, 700 + (ph + 90) / 2 - 22, font(30, 600, UI), `rgba(138,115,96,${nk})`, 'center');
  }
  WORDS.forEach(([w, sub], i) => {
    const k = springU(u, 24 + i - 0.1, SPRING.bouncy);
    if (k <= 0) return;
    const y = 1100 + i * 125;
    const x = 100;
    const on = i === Math.min(3, Math.floor(u - 24 + 0.1));
    ctx.save(); ctx.globalAlpha = clamp(k * 2);
    ctx.beginPath(); ctx.arc(x + 18, y - 34, 14 * k, 0, M.TAU); ctx.fillStyle = C.accent; ctx.fill();
    glyphLine(ctx, w, x + 60, y + (1 - k) * 40, font(112, 700, DISPLAY), on ? C.accent : C.coffee);
    ctx.restore();
  });
}
function glyphLine(ctx, s, x, y, f, color) { text(ctx, s, x, y, f, color, 'left'); }

// ---------------------------------------------------------------- S8 end card   (u 28..32)
function sceneEnd(ctx, u, IMG) {
  fill(ctx, C.coffee);
  const lk = springU(u, 27.7, SPRING.bouncy);
  const ly = 720;
  const r = 240 * (1 + 0.05 * wobble(u - 28, 2, 4));
  if (r > 1) {
    ctx.beginPath(); ctx.arc(W / 2, ly, r + 16, 0, M.TAU); ctx.strokeStyle = C.accent; ctx.lineWidth = 8; ctx.stroke();
    logoDisc(ctx, IMG, W / 2, ly, r, (1 - lk) * 0.6);
  }
  const t1 = springU(u, 28.6, SPRING.snappy);
  if (t1 > 0) {
    const f = font(124, 700, DISPLAY);
    const L = layout(ctx, 'Ti aspettiamo!', f, -2);
    L.glyphs.forEach((g, j) => {
      const k = springU(u, 28.6 + j * 0.035, SPRING.bouncy);
      if (k > 0) glyph(ctx, g.ch, W / 2 - L.width / 2 + g.cx, 1160 + (1 - k) * 60, f, C.cream, 1, k);
    });
  }
  const t2 = springU(u, 29.4, SPRING.snappy);
  if (t2 > 0) {
    ctx.save(); ctx.globalAlpha = clamp(t2 * 1.5);
    text(ctx, 'VIALE MARCONI 40 · PORDENONE', W / 2, 1260 + (1 - t2) * 30, font(36, 700, UI), C.cream, 'center', 4);
    ctx.restore();
  }
  const t3 = springU(u, 30, SPRING.bouncy);
  if (t3 > 0) {
    const L = layout(ctx, '@caffetteriadarte', font(44, 700, UI), 1);
    const pw = L.width + 90, ph = 92, px = W / 2 - pw / 2, py = 1330;
    ctx.save(); ctx.translate(W / 2, py + ph / 2); ctx.scale(t3, t3); ctx.translate(-W / 2, -(py + ph / 2));
    rrect(ctx, px, py, pw, ph, ph / 2); ctx.fillStyle = C.accent; ctx.fill();
    text(ctx, '@caffetteriadarte', W / 2, py + 61, font(44, 700, UI), C.cream, 'center', 1);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- post: soft paper grain
let GRAIN = null;
function makeGrain() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512;
  const c = cv.getContext('2d'); const im = c.createImageData(512, 512); const R = mulberry32(9);
  for (let i = 0; i < im.data.length; i += 4) { const v = R() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 14; }
  c.putImageData(im, 0, 0); return cv;
}

M.film({
  fonts: [font(100, 700, DISPLAY), font(40, 500, UI), font(40, 800, UI)],
  images: { logo: 'assets/logo.png', quadro: 'assets/photos/quadro.png', panino: 'assets/photos/panino.png', club: 'assets/photos/language_club.png' },
  hits: HITS,
  init() { buildMap(); GRAIN = makeGrain(); },
  draw(ctx, u, t, IMG) {
    if (u < 6) {
      sceneMap(ctx, u);
      // iris: the pin's cream dot opens into the next scene
      const p = E.inCubic(prog(u, 5.45, 6));
      if (p > 0) {
        const cx = PIN.x, cy = PIN.y - 118;
        ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, 30 + p * Math.hypot(W, H), 0, M.TAU); ctx.clip();
        sceneOpen(ctx, u, IMG); ctx.restore();
      }
    } else if (u < 10) sceneOpen(ctx, u, IMG);
    else if (u < 15) { sceneHours(ctx, u, IMG); coffeeWipe(ctx, u); }
    else if (u < 24) {
      sceneWhen(ctx, u, IMG);
      // cream rises from the bottom as the cards fall away (23.6..24)
      const p = E.inOutCubic(prog(u, 23.5, 24));
      if (p > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, H * (1 - p), W, H * p); ctx.clip(); sceneWhy(ctx, u, IMG); ctx.restore(); }
    } else if (u < 28) {
      sceneWhy(ctx, u, IMG);
      // iris closes on the logo position: the why-page shrinks into the end card's circle
      const p = E.inOutCubic(prog(u, 27.45, 28));
      if (p > 0) {
        ctx.save(); fill(ctx, C.coffee); ctx.beginPath(); ctx.arc(W / 2, 720, lerp(Math.hypot(W, H), 240, p), 0, M.TAU); ctx.clip();
        sceneWhy(ctx, u, IMG); ctx.restore();
        const a = E.inOutCubic(prog(u, 27.65, 28));
        if (a > 0) { ctx.save(); ctx.globalAlpha = a; logoDisc(ctx, IMG, W / 2, 720, 240, (1 - a) * 0.6); ctx.restore(); }
      }
    } else sceneEnd(ctx, u, IMG);
  },
  post(ctx, u) {
    if (!GRAIN) return;
    const f = Math.floor(u * 8);
    const ox = -Math.floor(hash01(f, 3) * 512), oy = -Math.floor(hash01(f, 5) * 512);
    for (let x = ox; x < W; x += 512) for (let y = oy; y < H; y += 512) ctx.drawImage(GRAIN, x, y);
  },
});
