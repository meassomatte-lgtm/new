// Caffetteria d'Arte · "Pranzo": Instagram motion-graphics style (as caffetteria-v3), Tommy VO (offset 0.5 s).
// 25 s · 96 bpm · 40 beats. Dish cuts land on the words in the voice-over. Real dish photos (assets/piatti).
import * as M from './lib/motion.js';

const { W, H, E, prog, lerp, clamp, springU, SPRING, font, layout, glyph, text, fill, cover, rrect, hash01, mulberry32, wobble } = M;

const C = { black: '#101010', paper: '#ECEAE6', red: '#E07A2B', brown: '#5B3A24', orangeDark: '#B85E1C', white: '#FFFFFF', ink: '#141414', grey: '#8D8A86', cream: '#F1E8D6', skin: '#E9C3A0', hair: '#2B1D14' };
const ITAL = 'Display', UI = 'UI', HEAVY = 'Heavy';

// cut points (beats), from the VO word onsets
const CUT = { logo: 15.0, carb: 17.9, pol: 20.5, frit: 22.7, forno: 25.0, ris: 26.6, mare: 28.2, coll: 30.6, end: 35.9 };

const HITS = [
  [0.4, 'PORDENONE', 'thud'],
  [2.4, 'pausa pranzo', 'tick'],
  [4.3, 'la solita domanda', 'whoosh', { len: 0.3 }],
  [4.7, 'DOVE PRANZO', 'thud'],
  [6.5, 'OGGI?', 'boing', { pitch: 'C5', to: 'G5' }],
  [9.0, 'VARIETA', 'thud'],
  [10.5, 'more ?', 'pop', { pitch: 'E6' }], [11.1, 'more ?', 'pop', { pitch: 'G6' }],
  [11.7, 'menu pill', 'click'],
  [15.0, 'logo', 'impact'],
  [17.9, '01', 'whoosh', { len: 0.3, from: 600, to: 2400 }],
  [20.5, '02', 'whoosh', { len: 0.3, from: 2400, to: 600 }],
  [22.7, '03', 'whoosh', { len: 0.3, from: 600, to: 2400 }],
  [25.0, '04', 'whoosh', { len: 0.3, from: 2400, to: 600 }],
  [26.6, '05', 'whoosh', { len: 0.3, from: 600, to: 2400 }],
  [28.2, '06', 'whoosh', { len: 0.3, from: 2400, to: 600 }],
  [30.6, 'collage', 'impact'],
  [33.4, 'address', 'click'],
  [35.9, 'end', 'whoosh', { len: 0.5 }],
  [36.3, 'logo', 'bell', { pitch: 'G6' }],
];

// ================================================================ type + graphics kit (as v3)
const ease01 = (u, a, b, e = E.outQuint) => e(prog(u, a, b));
function rise(ctx, str, x, y, f, color, u, u0, { align = 'left', track = 0, stagger = 0.02, dur = 0.6 } = {}) {
  const L = layout(ctx, str, f, track);
  const x0 = align === 'center' ? x - L.width / 2 : align === 'right' ? x - L.width : x;
  ctx.save(); ctx.beginPath(); ctx.rect(0, y - L.asc - 60, W, L.asc + L.desc + 66); ctx.clip();
  L.glyphs.forEach((g, j) => {
    const p = E.outQuint(prog(u, u0 + j * stagger, u0 + j * stagger + dur));
    if (p > 0) glyph(ctx, g.ch, x0 + g.cx, y + (1 - p) * (L.asc + L.desc + 30), f, color);
  });
  ctx.restore();
}
function slam(ctx, str, x, y, size, color, u, u0, { align = 'center', bar = null } = {}) {
  const f = font(size, 900, HEAVY);
  const L = layout(ctx, str, f, -0.02 * size);
  const x0 = align === 'center' ? x - L.width / 2 : align === 'right' ? x - L.width : x;
  if (bar) {
    const p = E.inOutCubic(prog(u, u0 - 0.25, u0 + 0.15));
    if (p > 0) { ctx.fillStyle = bar; ctx.fillRect(x0 - 24, y - L.asc - 18, (L.width + 48) * p, L.asc + L.desc + 36); }
  }
  L.glyphs.forEach((g, j) => {
    const k = springU(u, u0 + j * 0.03, SPRING.bouncy);
    if (k <= 0) return;
    const s = 1.6 - 0.6 * k;
    ctx.save(); ctx.globalAlpha = clamp(k * 3); glyph(ctx, g.ch, x0 + g.cx, y, f, color, s, s); ctx.restore();
  });
  return { L, x0 };
}
const fitHeavy = (ctx, str, maxW, max) => Math.min(max, Math.floor((100 * maxW) / layout(ctx, str, font(100, 900, HEAVY), -2).width));
function pair(ctx, small, big, y, u, u0, { dark = true, bar = false, maxW = W - 160, max = 230, smallSize = 76, align = 'center', x = W / 2 } = {}) {
  const sz = fitHeavy(ctx, big, maxW, max);
  const L = layout(ctx, big, font(sz, 900, HEAVY), -0.02 * sz);
  const x0 = align === 'center' ? x - L.width / 2 : x;
  rise(ctx, small, x0 + 6, y - L.asc - 34, font(smallSize, 500, ITAL), dark ? C.white : C.brown, u, u0);
  return slam(ctx, big, x, y, sz, bar ? C.white : C.red, u, u0 + 0.35, { align, bar: bar ? C.red : null });
}
function swoosh(ctx, u, u0, pts, color, w = 3, dur = 1.2) {
  const p = E.inOutCubic(prog(u, u0, u0 + dur));
  if (p <= 0) return;
  ctx.save(); ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); ctx.bezierCurveTo(pts[2], pts[3], pts[4], pts[5], pts[6], pts[7]);
  ctx.setLineDash([4000 * p, 4000]); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore();
}
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
function logoDisc(ctx, IMG, x, y, r) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, M.TAU); ctx.fillStyle = C.cream; ctx.fill(); ctx.clip();
  const img = IMG.logo;
  if (img) { const s = (2 * r) / (img.width * 0.86); ctx.drawImage(img, -img.width * 0.5 * s, -img.height * 0.5 * s, img.width * s, img.height * s); }
  ctx.restore();
}
function card(ctx, img, x, y, w, h, rot, { fx = 0.5, fy = 0.5, zoom = 1, border = 14, edge = C.red } = {}) {
  if (!img) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 30;
  rrect(ctx, -w / 2 - border, -h / 2 - border, w + 2 * border, h + 2 * border, 34); ctx.fillStyle = edge; ctx.fill();
  ctx.shadowColor = 'transparent';
  cover(ctx, img, -w / 2, -h / 2, w, h, { fx, fy, zoom, radius: 22 });
  ctx.restore();
}
function pill(ctx, str, cx, cy, u, u0, { bg = C.red, fg = C.white, size = 40 } = {}) {
  const k = springU(u, u0, SPRING.bouncy);
  if (k <= 0) return;
  const f = font(size, 800, UI); const L = layout(ctx, str, f, size * 0.12);
  const pw = L.width + size * 1.6, ph = size * 2;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
  rrect(ctx, -pw / 2, -ph / 2, pw, ph, 14); ctx.fillStyle = bg; ctx.fill();
  text(ctx, str, 0, size * 0.36, f, fg, 'center', size * 0.12);
  ctx.restore();
}

// ================================================================ S1-2 the puzzled diner   (u 0..12.6)
// A flat, stylised bust drawn in code: head tilts, hand scratches the head, a question mark pops.
function person(ctx, u, cx, cy, s) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  const tilt = -0.08 + 0.05 * Math.sin(u * 1.3);
  const scratch = Math.sin(u * 2 * Math.PI * 2.2);     // fast little scratch, ~2 per beat
  // shoulders / sweater
  ctx.fillStyle = C.red;
  ctx.beginPath(); ctx.moveTo(-300, 520); ctx.bezierCurveTo(-300, 300, -200, 230, 0, 225); ctx.bezierCurveTo(200, 230, 300, 300, 300, 520); ctx.closePath(); ctx.fill();
  // collar
  ctx.fillStyle = C.orangeDark; ctx.beginPath(); ctx.ellipse(0, 238, 92, 34, 0, 0, M.TAU); ctx.fill();
  // neck
  ctx.fillStyle = '#D9AE88'; ctx.fillRect(-42, 150, 84, 90);
  // head (tilts)
  ctx.save(); ctx.translate(0, 150); ctx.rotate(tilt); ctx.translate(0, -150);
  ctx.fillStyle = C.skin; ctx.beginPath(); ctx.ellipse(0, 40, 118, 135, 0, 0, M.TAU); ctx.fill();
  // ears
  ctx.beginPath(); ctx.ellipse(-118, 50, 18, 30, 0, 0, M.TAU); ctx.ellipse(118, 50, 18, 30, 0, 0, M.TAU); ctx.fill();
  // hair
  ctx.fillStyle = C.hair; ctx.beginPath(); ctx.moveTo(-122, 20); ctx.bezierCurveTo(-130, -110, 120, -130, 124, 10);
  ctx.bezierCurveTo(90, -40, 20, -60, -40, -40); ctx.bezierCurveTo(-80, -30, -110, -10, -122, 20); ctx.fill();
  // brows: one raised (puzzled)
  ctx.strokeStyle = C.hair; ctx.lineWidth = 10; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-70, 0); ctx.lineTo(-25, 8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(25, -12 - 6 * (0.5 + 0.5 * scratch)); ctx.lineTo(72, -24); ctx.stroke();
  // eyes looking up-right
  ctx.fillStyle = C.hair;
  ctx.beginPath(); ctx.arc(-45, 38, 11, 0, M.TAU); ctx.arc(48, 34, 11, 0, M.TAU); ctx.fill();
  // mouth: a wavy, unsure line
  ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-34, 112); ctx.bezierCurveTo(-14, 100, 6, 122, 30, 104); ctx.stroke();
  ctx.restore();
  // arm: shoulder -> elbow -> hand on top of the head, scratching
  const hx = 70 + 14 * scratch, hy = -95 + 6 * Math.abs(scratch);
  ctx.strokeStyle = C.red; ctx.lineWidth = 78; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(230, 330); ctx.lineTo(300, 60); ctx.lineTo(hx + 50, hy + 40); ctx.stroke();
  ctx.fillStyle = C.skin; ctx.beginPath(); ctx.ellipse(hx, hy, 52, 40, -0.5 + 0.2 * scratch, 0, M.TAU); ctx.fill();
  // fingers
  ctx.strokeStyle = '#D9AE88'; ctx.lineWidth = 5;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(hx - 30 + i * 18, hy - 22); ctx.lineTo(hx - 34 + i * 18, hy - 38); ctx.stroke(); }
  ctx.restore();
}
function qmark(ctx, x, y, size, u, u0, col = C.red) {
  const k = springU(u, u0, SPRING.wobbly);
  if (k <= 0) return;
  const rot = 0.15 * Math.sin((u - u0) * 2.2) + (1 - k) * -0.6;
  const bob = 10 * Math.sin((u - u0) * 1.7);
  ctx.save(); ctx.translate(x, y + bob); ctx.rotate(rot); ctx.scale(k, k);
  text(ctx, '?', 0, size * 0.36, font(size, 900, HEAVY), col, 'center');
  ctx.restore();
}
function sceneQuestion(ctx, u) {
  bgLight(ctx, u);
  swoosh(ctx, u, 0, [-40, 760, 300, 560, 760, 900, W + 40, 640], 'rgba(91,58,36,0.35)', 3);
  const phase = (u0, u1, fn) => {
    if (u < u0 - 0.4 || u >= u1) return;
    const out = E.inBack(prog(u, u1 - 0.4, u1), 1.4);
    ctx.save(); ctx.translate(-out * W, 0); fn(); ctx.restore();
  };
  // A: "Pordenone, pausa pranzo."
  phase(0, 4.3, () => {
    const sz = fitHeavy(ctx, 'PORDENONE', W - 160, 210);
    slam(ctx, 'PORDENONE', W / 2, 440, sz, C.red, u, 0.15);
    rise(ctx, 'pausa pranzo.', W / 2, 560, font(76, 500, ITAL), C.brown, u, 2.2, { align: 'center' });
  });
  // B: "La solita domanda: dove pranzo oggi?"
  phase(4.3, 9.0, () => {
    pair(ctx, 'La solita domanda:', 'DOVE PRANZO', 420, u, 4.3, { dark: false, max: 190 });
    const sz = fitHeavy(ctx, 'OGGI?', W - 160, 150);
    slam(ctx, 'OGGI?', W / 2, 590, sz, C.white, u, 6.4, { bar: C.brown });
  });
  // C: "Vuoi tanta varieta... e un menu che non e mai lo stesso?"
  if (u >= 8.6) {
    pair(ctx, 'Tanta', 'VARIET\u00C0', 430, u, 9.0, { dark: false, max: 260 });
    pill(ctx, 'E UN MEN\u00D9 SEMPRE DIVERSO', W / 2, 560, u, 11.6, { size: 34, bg: C.brown });
  }
  // the diner: rises in, then keeps scratching
  const k = springU(u, -0.3, SPRING.gentle);
  person(ctx, u, W / 2 - 40, 1120 + (1 - k) * 900, 1.15);
  qmark(ctx, 790, 860, 240, u, 6.5);
  qmark(ctx, 270, 900, 130, u, 10.4, C.brown);
  qmark(ctx, 900, 1150, 110, u, 11.0, C.brown);
}

// ================================================================ S3 logo   (u 12.6..16)
function sceneLogo(ctx, u, IMG) {
  bgDark(ctx, u);
  swoosh(ctx, u, 14.9, [-40, 1500, 300, 1100, 800, 1700, W + 40, 1250], 'rgba(255,255,255,0.7)', 3);
  const k = springU(u, 15.0, SPRING.bouncy);
  if (k > 0) {
    ctx.save(); ctx.translate(W / 2, 680); ctx.rotate((1 - k) * -1.2); ctx.translate(-W / 2, -680);
    ctx.beginPath(); ctx.arc(W / 2, 680, 210 * k + 16, 0, M.TAU); ctx.fillStyle = C.red; ctx.fill();
    logoDisc(ctx, IMG, W / 2, 680, 210 * k);
    ctx.restore();
  }
  rise(ctx, 'Passa alla', 150, 1030, font(84, 500, ITAL), C.white, u, 15.2);
  const sz = fitHeavy(ctx, 'CAFFETTERIA', W - 160, 200);
  slam(ctx, 'CAFFETTERIA', W / 2, 1200, sz, C.white, u, 15.6);
  slam(ctx, 'D’ARTE', W / 2, 1400, sz * 1.15, C.white, u, 16.1, { bar: C.red });
}

// ================================================================ S4 the dishes   (u 16..28.7)
const DISHES = [
  { key: 'carb', img: 'carbonara', name: ['SPAGHETTI', 'ALLA CARBONARA'], small: 'Un classico', fy: 0.55 },
  { key: 'pol', img: 'cotechino', name: ['POLENTA', 'E COTECHINO'], small: 'Sapori di casa', fy: 0.6, fan: ['polenta', 'tegame'] },
  { key: 'frit', img: 'frittura', name: ['FRITTURA', 'DI CALAMARI'], small: 'Croccante', fy: 0.62, fx: 0.42, zoom: 1.12 },
  { key: 'forno', img: 'forno', name: ['PASTA', 'AL FORNO'], small: 'Gratinata', fy: 0.5 },
  { key: 'ris', img: 'risotto', name: ['RISOTTO'], small: 'Cremoso', fy: 0.75, zoom: 1.25 },
  { key: 'mare', img: 'mare', name: ['SAPORI', 'DEL MARE'], small: 'E poi', fy: 0.6 },
];
const ORDER = ['carb', 'pol', 'frit', 'forno', 'ris', 'mare'];
function sceneDish(ctx, u, IMG, i) {
  const d = DISHES[i];
  const u0 = CUT[d.key], u1 = i < 5 ? CUT[ORDER[i + 1]] : CUT.coll;
  const dark = i % 2 === 0;
  dark ? bgDark(ctx, u) : bgLight(ctx, u);
  // giant outlined index number behind everything
  ctx.save(); ctx.font = font(560, 900, HEAVY); ctx.textAlign = 'right';
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.10)' : 'rgba(20,20,20,0.08)'; ctx.lineWidth = 4;
  ctx.strokeText(String(i + 1).padStart(2, '0'), W - 40 + (u - u0) * 12, 760); ctx.restore();
  // photo card(s): the main one flies in and keeps pushing in
  const k = springU(u, u0 - 0.15, SPRING.snappy);
  const drift = prog(u, u0, u1);
  const from = dark ? 1 : -1;
  const cx = W / 2 + (1 - k) * from * W * 0.9, cy = 770 - drift * 20;
  const rot = (dark ? -0.03 : 0.03) * k + (1 - k) * from * 0.2;
  if (d.fan) {
    d.fan.forEach((key, j) => {
      const kk = springU(u, u0 + 0.25 + j * 0.2, SPRING.snappy);
      if (kk <= 0) return;
      const s = j === 0 ? -1 : 1;
      card(ctx, IMG[key], cx + s * 240 * kk, cy + 30, 460, 600, s * 0.16 * kk, { fy: 0.6, edge: dark ? C.red : C.brown });
    });
  }
  const z = (d.zoom || 1.04) * (1.12 ** E.inOutSine(drift));
  card(ctx, IMG[d.img], cx, cy, d.fan ? 560 : 740, d.fan ? 740 : 760, rot, { fx: d.fx || 0.5, fy: d.fy, zoom: z, edge: dark ? C.red : C.brown });
  // index pill + name
  pill(ctx, `${String(i + 1).padStart(2, '0')} / 06`, 190, 300, u, u0 + 0.05, { size: 30, bg: dark ? C.red : C.brown, fg: C.white });
  const yName = 1480;
  rise(ctx, d.small, 96, yName - (d.name.length > 1 ? 250 : 140), font(60, 500, ITAL), dark ? C.white : C.brown, u, u0 + 0.1);
  d.name.forEach((line, j) => {
    const sz = fitHeavy(ctx, line, W - 192, 128);
    const y = yName - (d.name.length - 1 - j) * (sz * 0.95);
    slam(ctx, line, 96, y, sz, j === 0 ? C.red : (dark ? C.white : C.brown), u, u0 + 0.15 + j * 0.15, { align: 'left' });
  });
}

// ================================================================ S5 collage   (u 28.7..34.2)
const GRID = ['carbonara', 'cotechino', 'frittura', 'forno', 'risotto', 'mare', 'polenta', 'tegame'];
function sceneCollage(ctx, u, IMG) {
  fill(ctx, C.black);
  // 2 x 4 mosaic; the camera starts tight on one tile and pulls back to show them all
  const cols = 2, rows = 4, gap = 14, tw = (W - gap * 3) / cols, th = (H - gap * 5) / rows;
  const p = E.inOutCubic(prog(u, 30.6, 32.4));
  const z = 2.2 * (1 / 2.2) ** p;
  const fx = W * 0.25, fy = th * 1.5 + gap * 2;
  ctx.save(); ctx.translate(lerp(fx, W / 2, p), lerp(fy, H / 2, p)); ctx.scale(z, z); ctx.translate(-lerp(fx, W / 2, p), -lerp(fy, H / 2, p));
  GRID.forEach((key, i) => {
    const c = i % cols, r = Math.floor(i / cols);
    const x = gap + c * (tw + gap), y = gap + r * (th + gap);
    const zz = 1.08 + 0.06 * Math.sin(u * 0.4 + i);
    cover(ctx, IMG[key], x, y, tw, th, { fy: 0.55, zoom: zz, radius: 18 });
  });
  ctx.restore();
  // dark band with the message
  const bk = E.outQuint(prog(u, 31.0, 31.7));
  ctx.fillStyle = `rgba(12,10,8,${0.82 * bk})`; ctx.fillRect(0, 700, W, 520);
  ctx.fillStyle = C.red; ctx.fillRect(0, 700, W * bk, 8); ctx.fillStyle = C.brown; ctx.fillRect(W * (1 - bk), 1212, W * bk, 8);
  pair(ctx, 'Un pranzo', 'RICCO DI SAPORE', 1040, u, 31.1, { max: 140 });
  pill(ctx, 'VIALE MARCONI 40 · PORDENONE', W / 2, 1130, u, 33.4, { size: 32, bg: C.brown });
}

// ================================================================ S6 end card   (u 34.2..40)
function sceneEnd(ctx, u, IMG) {
  bgLight(ctx, u);
  swoosh(ctx, u, 35.9, [-40, 380, 400, 160, 700, 560, W + 40, 300], 'rgba(20,20,20,0.3)', 3);
  const k = springU(u, 35.6, SPRING.bouncy);
  if (k > 0) {
    ctx.save(); ctx.translate(W / 2, 700); ctx.rotate((1 - k) * 0.8); ctx.translate(-W / 2, -700);
    ctx.beginPath(); ctx.arc(W / 2, 700, 210 * k + 12, 0, M.TAU); ctx.fillStyle = C.brown; ctx.fill();
    logoDisc(ctx, IMG, W / 2, 700, 210 * k);
    ctx.restore();
  }
  pair(ctx, 'Ti', 'ASPETTIAMO', 1150, u, 36.1, { dark: false, max: 190 });
  rise(ctx, 'Viale Marconi 40 · Pordenone', W / 2, 1260, font(40, 600, UI), C.brown, u, 36.7, { align: 'center', stagger: 0.008 });
  rise(ctx, 'Lun–Ven 7:00–20:30  ·  Sab 8:00–15:00', W / 2, 1325, font(34, 500, UI), C.grey, u, 37.0, { align: 'center', stagger: 0.006 });
  pill(ctx, '@caffetteriadarte', W / 2, 1440, u, 37.3, { size: 38 });
}

// ================================================================ transitions + post
function whip(ctx, u, uc, drawA, drawB, dir = 1, dur = 0.35) {
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
  fonts: [font(100, 900, HEAVY), font(100, 500, ITAL), font(40, 500, UI), font(40, 800, UI)],
  images: {
    logo: 'assets/logo.png',
    carbonara: 'assets/piatti/carbonara.jpg', cotechino: 'assets/piatti/cotechino_polenta_pure.jpg', polenta: 'assets/piatti/polenta_salvia.jpg',
    tegame: 'assets/piatti/cotechino_tegame.jpg', frittura: 'assets/piatti/frittura.jpg', forno: 'assets/piatti/pasta_forno.jpg',
    risotto: 'assets/piatti/risotto.jpg', mare: 'assets/piatti/mare.jpg',
  },
  hits: HITS,
  init() { GRAIN = makeGrain(); LEAVES = makeLeaves(); },
  draw(ctx, u, t, IMG) {
    const q = () => sceneQuestion(ctx, u), lg = () => sceneLogo(ctx, u, IMG);
    const dish = (i) => () => sceneDish(ctx, u, IMG, i);
    const col = () => sceneCollage(ctx, u, IMG), end = () => sceneEnd(ctx, u, IMG);
    if (u < CUT.logo) whip(ctx, u, CUT.logo, q, lg, 1);
    else if (u < CUT.carb) whip(ctx, u, CUT.carb, lg, dish(0), 1);
    else if (u < CUT.pol) whip(ctx, u, CUT.pol, dish(0), dish(1), -1, 0.28);
    else if (u < CUT.frit) whip(ctx, u, CUT.frit, dish(1), dish(2), 1, 0.28);
    else if (u < CUT.forno) whip(ctx, u, CUT.forno, dish(2), dish(3), -1, 0.28);
    else if (u < CUT.ris) whip(ctx, u, CUT.ris, dish(3), dish(4), 1, 0.28);
    else if (u < CUT.mare) whip(ctx, u, CUT.mare, dish(4), dish(5), -1, 0.28);
    else if (u < CUT.coll) whip(ctx, u, CUT.coll, dish(5), col, 1, 0.3);
    else if (u < CUT.end) whip(ctx, u, CUT.end, col, end, -1);
    else end();
  },
  post(ctx, u) {
    if (!GRAIN) return;
    const f = Math.floor(u * 8);
    const ox = -Math.floor(hash01(f, 3) * 512), oy = -Math.floor(hash01(f, 5) * 512);
    for (let x = ox; x < W; x += 512) for (let y = oy; y < H; y += 512) ctx.drawImage(GRAIN, x, y);
  },
});
