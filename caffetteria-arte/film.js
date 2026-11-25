// Caffetteria d'Arte, v2 (formal): pure function of time. window.seek(t) paints frame t.
// 30 s · 96 bpm · 48 beats. Scenes are cut to the voice-over (audio/vo.wav, Tommy, offset 0.7 s).
import * as M from './lib/motion.js';
import * as AERIAL from './aerial.js';

const { W, H, E, prog, lerp, clamp, springU, SPRING, font, layout, glyph, text, fill, cover, rrect, hash01, mulberry32 } = M;

// Palette: espresso, cream (from the logo) and one accent, a muted gold.
const C = { ink: '#15100C', espresso: '#221710', cream: '#F1E8D6', gold: '#C9A46A', muted: '#A8998A', white: '#FFFFFF' };
const SERIF = 'Serif', ITAL = 'Display', UI = 'UI';

const HITS = [
  [0, 'descent', 'whoosh', { len: 1.2, from: 200, to: 1200 }],
  [5, 'marker lands', 'thud'],
  [6.5, 'brand', 'sub', { len: 1.2 }],
  [7, 'logo', 'bell', { pitch: 'F6' }],
  [9.5, 'hours', 'whoosh', { len: 0.5 }],
  [10.5, 'row 1', 'tick'],
  [15.5, 'row 2', 'tick'],
  [17.5, 'row 3', 'tick'],
  [20, 'colazione', 'whoosh', { len: 0.45, from: 500, to: 2000 }],
  [25.8, 'pranzo', 'whoosh', { len: 0.45, from: 2000, to: 500 }],
  [29.4, 'aperitivo', 'whoosh', { len: 0.45, from: 500, to: 2000 }],
  [31.5, 'language club card', 'tick'],
  [34.3, 'arte', 'whoosh', { len: 0.5 }],
  [35, 'Arte', 'tick'], [36.5, 'Libri', 'tick'], [38, 'Incontri', 'tick'],
  [39, 'phone', 'whoosh', { len: 0.6, from: 300, to: 1500 }],
  [42, 'tap follow', 'click'],
  [44, 'end card', 'impact'],
  [44.6, 'logo', 'bell', { pitch: 'F6' }],
];

// ================================================================ helpers
const ease01 = (u, a, b, e = E.outQuint) => e(prog(u, a, b));
function logoDisc(ctx, IMG, x, y, r) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, M.TAU); ctx.fillStyle = C.cream; ctx.fill(); ctx.clip();
  const img = IMG.logo;
  if (img) { const s = (2 * r) / (img.width * 0.86); ctx.drawImage(img, -img.width * 0.5 * s, -img.height * 0.5 * s, img.width * s, img.height * s); }
  ctx.restore();
}
// type that rises out of a mask line, glyph by glyph (no fades)
function rise(ctx, str, x, y, f, color, u, u0, { align = 'left', track = 0, stagger = 0.025, dur = 0.7 } = {}) {
  const L = layout(ctx, str, f, track);
  const x0 = align === 'center' ? x - L.width / 2 : align === 'right' ? x - L.width : x;
  ctx.save(); ctx.beginPath(); ctx.rect(0, y - L.asc - 40, W, L.asc + L.desc + 40 + 6); ctx.clip();
  L.glyphs.forEach((g, j) => {
    const p = E.outQuint(prog(u, u0 + j * stagger, u0 + j * stagger + dur));
    if (p <= 0) return;
    glyph(ctx, g.ch, x0 + g.cx, y + (1 - p) * (L.asc + L.desc + 20), f, color);
  });
  ctx.restore();
  return L;
}
function rule(ctx, x, y, w, u, u0, color = C.gold, dur = 0.8) {
  const p = E.inOutCubic(prog(u, u0, u0 + dur));
  if (p <= 0) return;
  ctx.fillStyle = color; ctx.fillRect(x, y, w * p, 3);
}
function shadeBottom(ctx, a0 = 0, a1 = 0.85, from = 0.45) {
  const g = ctx.createLinearGradient(0, H * from, 0, H);
  g.addColorStop(0, `rgba(12,8,5,${a0})`); g.addColorStop(1, `rgba(12,8,5,${a1})`);
  ctx.fillStyle = g; ctx.fillRect(0, H * from, W, H * (1 - from));
}
function shadeTop(ctx, a = 0.55, to = 0.3) {
  const g = ctx.createLinearGradient(0, 0, 0, H * to);
  g.addColorStop(0, `rgba(12,8,5,${a})`); g.addColorStop(1, 'rgba(12,8,5,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * to);
}
// a landscape photo in a portrait frame: log-zoom push + lateral pan across it
function kenBurns(ctx, img, u, u0, u1, { fx0 = 0.3, fx1 = 0.7, fy = 0.5, z0 = 1.0, z1 = 1.12 } = {}) {
  if (!img) return;
  const p = E.inOutSine(prog(u, u0 - 0.5, u1 + 0.5));
  const z = z0 * (z1 / z0) ** p;
  cover(ctx, img, 0, 0, W, H, { fx: lerp(fx0, fx1, p), fy, zoom: z });
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
const PIN = { x: W / 2, y: H * 0.47 };
function camAt(u) {
  const p = E.inOutSine(prog(u, -0.8, 5.0));
  const s = 0.26 * (8 / 0.26) ** p;
  // after the landing the camera keeps drifting in, slowly (it never parks)
  const s2 = s * (1 + 0.06 * E.inOutSine(prog(u, 5, 6.5)));
  const q = E.inOutCubic(prog(u, 0, 4.4));
  return { s: s2, cx: lerp(-350, CAFE_W[0], q), cy: lerp(-250, CAFE_W[1], q), rot: lerp(-AERIAL.ANG - 0.55, -AERIAL.ANG, E.inOutCubic(prog(u, 0, 5))) };
}
function drawLevel(ctx, L, c, alpha) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.translate(PIN.x, PIN.y); ctx.rotate(c.rot); ctx.scale(c.s, c.s); ctx.translate(-c.cx, -c.cy);
  ctx.imageSmoothingQuality = 'high';
  ctx.filter = 'saturate(0.72) contrast(1.08) brightness(0.98)';
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
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(8,6,4,0.55)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  // clouds we fall through
  const cl = prog(u, -0.2, 2.4);
  if (cl < 1) {
    const R = mulberry32(12);
    for (let i = 0; i < 9; i++) {
      const ax = R() * W, ay = R() * H, r0 = 260 + R() * 320, push = 1 + E.inCubic(cl) * 2.2;
      const x = W / 2 + (ax - W / 2) * push, y = H / 2 + (ay - H / 2) * push, r = r0 * (1 + cl * 1.5), a = 0.85 * (1 - E.inQuad(cl));
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.6, `rgba(250,250,252,${a * 0.6})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
  }
  shadeTop(ctx, 0.45, 0.32);
  // title: elegant serif over the town, then it lifts away
  const out = E.inCubic(prog(u, 3.2, 3.9));
  ctx.save(); ctx.translate(0, -out * 120); ctx.globalAlpha = 1 - out;
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 30;
  rise(ctx, 'PORDENONE', W / 2, 420, font(40, 600, UI), C.gold, u, 0.4, { align: 'center', track: 18, stagger: 0.03 });
  rise(ctx, 'Nel cuore', W / 2, 560, font(120, 500, SERIF), C.white, u, 0.9, { align: 'center' });
  rise(ctx, 'della città', W / 2, 690, font(120, 500, ITAL), C.white, u, 1.4, { align: 'center' });
  ctx.restore();
  // the marker: a thin gold needle + ring, no cartoon pin
  if (u >= 4.4) {
    const k = springU(u, 4.4, SPRING.snappy);
    const len = 220 * k;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 18;
    ctx.strokeStyle = C.gold; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(PIN.x, PIN.y); ctx.lineTo(PIN.x, PIN.y - len); ctx.stroke();
    ctx.beginPath(); ctx.arc(PIN.x, PIN.y, 12, 0, M.TAU); ctx.fillStyle = C.gold; ctx.fill();
    const rp = ease01(u, 5, 6.4, E.outCubic);
    ctx.globalAlpha = 1 - rp; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(PIN.x, PIN.y, 12 + rp * 110, 0, M.TAU); ctx.stroke();
    ctx.restore();
    // callout label at the top of the needle
    const lk = ease01(u, 4.9, 5.7);
    if (lk > 0) {
      const bw = 560, bh = 132, bx = PIN.x - bw / 2, by = PIN.y - len - bh - 10;
      ctx.save(); ctx.globalAlpha = lk;
      ctx.fillStyle = 'rgba(21,16,12,0.86)'; rrect(ctx, bx, by, bw, bh, 6); ctx.fill();
      ctx.fillStyle = C.gold; ctx.fillRect(bx, by, 6, bh);
      ctx.restore();
      rise(ctx, 'Viale Marconi, 40', bx + 40, by + 62, font(46, 500, SERIF), C.cream, u, 4.95, { stagger: 0.015 });
      rise(ctx, 'PORDENONE · ITALIA', bx + 40, by + 106, font(26, 600, UI), C.gold, u, 5.15, { track: 6, stagger: 0.01 });
    }
  }
}

// ================================================================ S2 brand   (u 6.5..9.5)
function sceneBrand(ctx, u, IMG) {
  fill(ctx, C.ink);
  // the interior photo of the painting, deep in the background, slowly breathing
  if (IMG.quadro) {
    ctx.save(); ctx.globalAlpha = 0.18; ctx.filter = 'blur(18px)';
    cover(ctx, IMG.quadro, -60, -60, W + 120, H + 120, { zoom: 1 + 0.05 * prog(u, 6.5, 9.5) });
    ctx.restore();
  }
  const k = springU(u, 6.6, SPRING.gentle);
  const r = 210 * (0.85 + 0.15 * k);
  ctx.save(); ctx.globalAlpha = clamp(k * 1.4);
  logoDisc(ctx, IMG, W / 2, 760, r);
  ctx.strokeStyle = C.gold; ctx.lineWidth = 3;
  const a = E.inOutCubic(prog(u, 6.6, 7.6));
  ctx.beginPath(); ctx.arc(W / 2, 760, r + 22, -Math.PI / 2, -Math.PI / 2 + a * M.TAU); ctx.stroke();
  ctx.restore();
  rise(ctx, 'Caffetteria', W / 2, 1150, font(104, 500, SERIF), C.cream, u, 7.1, { align: 'center' });
  rise(ctx, 'd’Arte', W / 2, 1280, font(128, 500, ITAL), C.gold, u, 7.5, { align: 'center' });
  rule(ctx, W / 2 - 90, 1340, 180, u, 8.0);
  rise(ctx, 'CAFFÈ · ARTE · INCONTRI', W / 2, 1410, font(28, 600, UI), C.muted, u, 8.2, { align: 'center', track: 8, stagger: 0.01 });
}

// ================================================================ S3 hours   (u 9.5..20)
const ROWS = [
  { day: 'Lunedì – Venerdì', hrs: '7:00 – 20:30', u: 10.5 },
  { day: 'Sabato', hrs: '8:00 – 15:00', u: 15.5 },
  { day: 'Domenica', hrs: 'Chiuso', u: 17.5, off: true },
];
function sceneHours(ctx, u, IMG) {
  fill(ctx, C.ink);
  // background: the breakfast photo, dark and soft, drifting
  ctx.save(); ctx.filter = 'blur(6px) brightness(0.42) saturate(0.8)';
  kenBurns(ctx, IMG.colazione, u, 9.5, 20, { fx0: 0.15, fx1: 0.45, z0: 1.08, z1: 1.2 });
  ctx.restore();
  ctx.fillStyle = 'rgba(21,16,12,0.35)'; ctx.fillRect(0, 0, W, H);
  const x0 = 110, x1 = W - 110;
  rise(ctx, 'ORARI DI APERTURA', x0, 520, font(30, 600, UI), C.gold, u, 9.8, { track: 8, stagger: 0.012 });
  rise(ctx, 'Siamo aperti', x0, 650, font(110, 500, SERIF), C.cream, u, 10.0);
  rule(ctx, x0, 720, x1 - x0, u, 10.3, 'rgba(201,164,106,0.6)', 1.2);
  ROWS.forEach((r, i) => {
    const y = 860 + i * 190;
    const col = r.off ? C.muted : C.cream;
    rise(ctx, r.day, x0, y, font(58, 500, SERIF), col, u, r.u, { stagger: 0.012 });
    const L = layout(ctx, r.hrs, font(58, 500, UI), 0);
    rise(ctx, r.hrs, x1, y, font(58, r.off ? 400 : 500, UI), r.off ? C.muted : C.gold, u, r.u + 0.25, { align: 'right', stagger: 0.012 });
    rule(ctx, x0, y + 50, x1 - x0, u, r.u + 0.2, 'rgba(241,232,214,0.18)', 0.9);
  });
}

// ================================================================ S4-6 photo scenes   (u 20..34.3)
// each: a real-looking photo moving, a kicker, a serif title and one line, bottom-left
function photoScene(ctx, u, img, u0, u1, kicker, title, line, opts) {
  fill(ctx, C.ink);
  kenBurns(ctx, img, u, u0, u1, opts);
  shadeBottom(ctx, 0, 0.88, 0.42);
  shadeTop(ctx, 0.35, 0.2);
  const x = 96, y = 1330;
  rise(ctx, kicker, x, y - 150, font(30, 600, UI), C.gold, u, u0 + 0.3, { track: 8, stagger: 0.012 });
  rise(ctx, title, x, y, font(124, 500, SERIF), C.white, u, u0 + 0.5);
  rule(ctx, x, y + 40, 140, u, u0 + 0.9);
  rise(ctx, line, x, y + 110, font(40, 400, UI), C.cream, u, u0 + 1.1, { stagger: 0.008 });
}
function sceneColazione(ctx, u, IMG) {
  photoScene(ctx, u, IMG.colazione, 20, 25.8, 'AL MATTINO · DALLE 7:00', 'Colazione', 'Cappuccino e cornetto', { fx0: 0.2, fx1: 0.42, fy: 0.55, z0: 1.05, z1: 1.18 });
}
function scenePranzo(ctx, u, IMG) {
  photoScene(ctx, u, IMG.pranzo, 25.8, 29.4, 'A MEZZOGIORNO', 'Pranzo veloce', 'Una pausa gustosa e veloce', { fx0: 0.38, fx1: 0.55, fy: 0.6, z0: 1.12, z1: 1.0 });
}
function sceneAperitivo(ctx, u, IMG) {
  photoScene(ctx, u, IMG.aperitivo, 29.4, 34.3, 'LA SERA', 'Aperitivo', 'e le serate del Language Club', { fx0: 0.9, fx1: 0.7, fy: 0.55, z0: 1.0, z1: 1.12 });
  // the real Language Club poster slides in as a card, top-right
  const k = springU(u, 31.3, SPRING.snappy);
  if (k > 0 && IMG.club) {
    const w = 300, h = w * IMG.club.height / IMG.club.width;
    const x = W - 96 - w + (1 - k) * 420, y = 300;
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(0.035 * k);
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16;
    ctx.fillStyle = C.cream; ctx.fillRect(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20); ctx.shadowColor = 'transparent';
    ctx.drawImage(IMG.club, -w / 2, -h / 2, w, h);
    ctx.restore();
  }
}
// push transition: A slides up and out as B rises in; done exactly on the cut
function push(ctx, u, uc, drawA, drawB, dur = 0.45) {
  const p = E.inOutCubic(prog(u, uc - dur, uc));
  if (p <= 0) { drawA(); return; }
  if (p >= 1) { drawB(); return; }
  ctx.save(); ctx.translate(0, -p * H * 0.35); drawA(); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(0, H * (1 - p), W, H * p); ctx.clip(); ctx.translate(0, (1 - p) * H * 0.25); drawB(); ctx.restore();
}

// ================================================================ S7 art   (u 34.3..39)
function sceneArte(ctx, u, IMG) {
  fill(ctx, C.espresso);
  // gallery wall light
  const g = ctx.createRadialGradient(W / 2, 640, 50, W / 2, 640, 900);
  g.addColorStop(0, 'rgba(255,230,190,0.16)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (IMG.quadro) {
    const z = 1 + 0.08 * E.inOutSine(prog(u, 34.3, 39.5));
    const w = 520 * z, h = w * IMG.quadro.height / IMG.quadro.width;
    const k = springU(u, 34.3, SPRING.gentle);
    const cx = W / 2, cy = 640 + (1 - k) * 120;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 30;
    ctx.fillStyle = '#B8925A'; ctx.fillRect(cx - w / 2 - 26, cy - h / 2 - 26, w + 52, h + 52);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#8C6A3A'; ctx.fillRect(cx - w / 2 - 10, cy - h / 2 - 10, w + 20, h + 20);
    ctx.drawImage(IMG.quadro, cx - w / 2, cy - h / 2, w, h);
    ctx.restore();
  }
  const words = [['Arte', 35], ['Libri', 36.5], ['Incontri', 38]];
  const y = 1260;
  rise(ctx, 'UN LUOGO DI', W / 2, y - 120, font(30, 600, UI), C.gold, u, 34.6, { align: 'center', track: 8, stagger: 0.012 });
  let x = 0; const f = font(92, 500, SERIF);
  const parts = words.map(([w]) => layout(ctx, w, f, 0).width);
  const gap = 70, total = parts.reduce((a, b) => a + b, 0) + gap * 2;
  x = W / 2 - total / 2;
  words.forEach(([w, u0], i) => {
    rise(ctx, w, x, y, i === 1 ? font(92, 500, ITAL) : f, i === 1 ? C.gold : C.cream, u, u0);
    if (i < 2) { const d = ease01(u, u0 + 0.3, u0 + 0.8); if (d > 0) { ctx.beginPath(); ctx.arc(x + parts[i] + gap / 2, y - 30, 5 * d, 0, M.TAU); ctx.fillStyle = C.gold; ctx.fill(); } }
    x += parts[i] + gap;
  });
}

// ================================================================ S8 phone · Instagram   (u 39..44)
function phone(ctx, IMG, cx, cy, w, h, u) {
  const r = 70;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 80; ctx.shadowOffsetY = 40;
  rrect(ctx, cx - w / 2, cy - h / 2, w, h, r); ctx.fillStyle = '#0B0B0D'; ctx.fill();
  ctx.shadowColor = 'transparent';
  // titanium edge
  rrect(ctx, cx - w / 2, cy - h / 2, w, h, r); ctx.strokeStyle = '#5A5650'; ctx.lineWidth = 4; ctx.stroke();
  const b = 18, sx = cx - w / 2 + b, sy = cy - h / 2 + b, sw = w - 2 * b, sh = h - 2 * b;
  ctx.save(); rrect(ctx, sx, sy, sw, sh, r - b); ctx.clip();
  ctx.fillStyle = '#0F1115'; ctx.fillRect(sx, sy, sw, sh);
  if (IMG.ig) {
    // the café's real Instagram profile (screenshot), fit to height, panning from the profile to the grid
    const img = IMG.ig, scale = sh / img.height;
    const vw = sw / scale;                               // source px visible
    const pan = E.inOutSine(prog(u, 39.6, 43.6));
    const srcX = lerp(600, 1050, pan);
    ctx.drawImage(img, srcX, 0, vw, img.height, sx, sy, sw, sh);
    // the group photo in the grid is blurred: no recognisable faces in the reel
    const bx = 946, by = 812, bw = 470, bh = 626;
    const dx = sx + (bx - srcX) * scale, dy = sy + by * scale;
    ctx.save(); ctx.beginPath(); ctx.rect(dx, dy, bw * scale, bh * scale); ctx.clip();
    ctx.filter = 'blur(14px)';
    ctx.drawImage(img, bx - 40, by - 40, bw + 80, bh + 80, dx - 40 * scale, dy - 40 * scale, (bw + 80) * scale, (bh + 80) * scale);
    ctx.restore();
  }
  ctx.restore();
  // dynamic island
  rrect(ctx, cx - 70, sy + 18, 140, 40, 20); ctx.fillStyle = '#000'; ctx.fill();
  // glass reflection
  const gl = ctx.createLinearGradient(sx, sy, sx + sw, sy + sh);
  gl.addColorStop(0, 'rgba(255,255,255,0.10)'); gl.addColorStop(0.35, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(255,255,255,0.04)');
  ctx.save(); rrect(ctx, sx, sy, sw, sh, r - b); ctx.clip(); ctx.fillStyle = gl; ctx.fillRect(sx, sy, sw, sh); ctx.restore();
  ctx.restore();
}
function scenePhone(ctx, u, IMG) {
  fill(ctx, C.ink);
  const g = ctx.createRadialGradient(W / 2, 1000, 100, W / 2, 1000, 1100);
  g.addColorStop(0, 'rgba(201,164,106,0.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  rise(ctx, 'SEGUITECI SU INSTAGRAM', W / 2, 330, font(30, 600, UI), C.gold, u, 39.2, { align: 'center', track: 8, stagger: 0.01 });
  rise(ctx, '@caffetteriadarte', W / 2, 440, font(84, 500, SERIF), C.cream, u, 39.5, { align: 'center', stagger: 0.015 });
  const k = springU(u, 38.9, SPRING.gentle);
  const w = 600, h = 1150;
  const cx = W / 2, cy = 1090 + (1 - k) * 1200;
  const tilt = 0.05 * (1 - k) - 0.02 * Math.sin(prog(u, 39, 44) * Math.PI);
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt); ctx.translate(-cx, -cy);
  phone(ctx, IMG, cx, cy, w, h, u);
  // tap on the follow button: a ring where the finger lands
  const tp = prog(u, 42, 43);
  if (tp > 0 && tp < 1) {
    const px = cx - 140, py = cy - h / 2 + 18 + (565 / 1640) * (h - 36);
    ctx.beginPath(); ctx.arc(px, py, 30 + tp * 60, 0, M.TAU);
    ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - tp)})`; ctx.lineWidth = 5; ctx.stroke();
    ctx.beginPath(); ctx.arc(px, py, 26 * (1 - tp * 0.5), 0, M.TAU); ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - tp)})`; ctx.fill();
  }
  ctx.restore();
}

// ================================================================ S9 end card   (u 44..48)
function sceneEnd(ctx, u, IMG) {
  fill(ctx, C.ink);
  if (IMG.aperitivo) { ctx.save(); ctx.filter = 'blur(14px) brightness(0.3)'; kenBurns(ctx, IMG.aperitivo, u, 44, 48, { fx0: 0.6, fx1: 0.7, z0: 1.15, z1: 1.25 }); ctx.restore(); }
  const k = springU(u, 43.9, SPRING.gentle);
  logoDisc(ctx, IMG, W / 2, 700, 190 * (0.9 + 0.1 * k));
  ctx.strokeStyle = C.gold; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(W / 2, 700, 212, -Math.PI / 2, -Math.PI / 2 + E.inOutCubic(prog(u, 44, 45)) * M.TAU); ctx.stroke();
  rise(ctx, 'Vi aspettiamo', W / 2, 1090, font(112, 500, ITAL), C.cream, u, 44.3, { align: 'center' });
  rule(ctx, W / 2 - 90, 1150, 180, u, 44.9);
  rise(ctx, 'VIALE MARCONI 40 · PORDENONE', W / 2, 1230, font(30, 600, UI), C.gold, u, 45.1, { align: 'center', track: 6, stagger: 0.008 });
  rise(ctx, 'Lun–Ven 7:00–20:30  ·  Sab 8:00–15:00', W / 2, 1300, font(34, 400, UI), C.cream, u, 45.4, { align: 'center', stagger: 0.006 });
  rise(ctx, '@caffetteriadarte', W / 2, 1380, font(40, 600, UI), C.white, u, 45.7, { align: 'center', stagger: 0.008 });
}

// ================================================================ post: film grain
let GRAIN = null;
function makeGrain() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512;
  const c = cv.getContext('2d'); const im = c.createImageData(512, 512); const R = mulberry32(9);
  for (let i = 0; i < im.data.length; i += 4) { const v = R() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 12; }
  c.putImageData(im, 0, 0); return cv;
}

M.film({
  fonts: [font(100, 500, SERIF), font(100, 500, ITAL), font(40, 500, UI), font(40, 600, UI)],
  images: {
    logo: 'assets/logo.png', quadro: 'assets/photos/quadro.png', club: 'assets/photos/language_club.png', ig: 'assets/instagram_screenshot.png',
    colazione: 'assets/ai/colazione.jpg', pranzo: 'assets/ai/pranzo.jpg', aperitivo: 'assets/ai/aperitivo.jpg',
  },
  hits: HITS,
  init() { buildMap(); GRAIN = makeGrain(); },
  draw(ctx, u, t, IMG) {
    const S = {
      map: () => sceneMap(ctx, u), brand: () => sceneBrand(ctx, u, IMG), hours: () => sceneHours(ctx, u, IMG),
      col: () => sceneColazione(ctx, u, IMG), pra: () => scenePranzo(ctx, u, IMG), ape: () => sceneAperitivo(ctx, u, IMG),
      arte: () => sceneArte(ctx, u, IMG), phone: () => scenePhone(ctx, u, IMG), end: () => sceneEnd(ctx, u, IMG),
    };
    if (u < 6.5) {
      S.map();
      // dolly-through: the map keeps pushing in and dissolves into darkness, then the brand rises
      const p = E.inCubic(prog(u, 5.9, 6.5));
      if (p > 0) { ctx.fillStyle = `rgba(21,16,12,${p})`; ctx.fillRect(0, 0, W, H); }
    } else if (u < 9.5) push(ctx, u, 9.5, S.brand, S.hours);
    else if (u < 20) push(ctx, u, 20, S.hours, S.col);
    else if (u < 25.8) push(ctx, u, 25.8, S.col, S.pra);
    else if (u < 29.4) push(ctx, u, 29.4, S.pra, S.ape);
    else if (u < 34.3) push(ctx, u, 34.3, S.ape, S.arte);
    else if (u < 39) push(ctx, u, 39, S.arte, S.phone);
    else if (u < 44) push(ctx, u, 44, S.phone, S.end);
    else S.end();
  },
  post(ctx, u) {
    if (!GRAIN) return;
    const f = Math.floor(u * 8);
    const ox = -Math.floor(hash01(f, 3) * 512), oy = -Math.floor(hash01(f, 5) * 512);
    for (let x = ox; x < W; x += 512) for (let y = oy; y < H; y += 512) ctx.drawImage(GRAIN, x, y);
  },
});
