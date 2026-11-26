// "Seguici": 3 s end-card insert for @asd_roraigrande. Phone with the real profile, tap on Segui -> Segui già.
// Grid: 120 bpm, 1 beat = 0.5 s, 6 beats. Pure function of time.
import * as M from './lib/motion.js';

const { W, H, E, prog, lerp, clamp, springU, SPRING, font, layout, glyph, text, fill, rrect, hash01, mulberry32 } = M;
const C = { black: '#0A1733', red: '#F0A82A', white: '#FFFFFF', igBlue: '#0095F6', igGrey: '#363A40' };
const ITAL = 'Display', UI = 'UI', HEAVY = 'Heavy';
const FAST = { stiffness: 340, damping: 17 };

const HITS = [
  [0, 'phone in', 'whoosh', { len: 0.5, from: 180, to: 900, gain: 0.16 }],
  [0.7, 'SEGUIMI', 'thud', { gain: 0.22, pitch: 110, to: 45 }],
  [3.1, 'tap', 'click', { gain: 0.18 }],
];

// ---------------------------------------------------------------- kit
function rise(ctx, str, x, y, f, color, u, u0, { align = 'center', stagger = 0.03, dur = 0.5 } = {}) {
  const L = layout(ctx, str, f, 0);
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
  if (bar && p > 0) { ctx.fillStyle = bar; ctx.fillRect(x0 - 28, y - L.asc - 20, (L.width + 56) * p, L.asc + L.desc + 40); }
  L.glyphs.forEach((g, j) => {
    const k = springU(u, u0 + j * 0.05, FAST);
    if (k <= 0) return;
    const s = 1.6 - 0.6 * k;
    ctx.save(); ctx.globalAlpha = clamp(k * 3); glyph(ctx, g.ch, x0 + g.cx, y, f, color, s, s); ctx.restore();
  });
}
function bgDark(ctx, u) {
  fill(ctx, C.black);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1.5;
  const off = (u * 10) % 90;
  ctx.beginPath();
  for (let x = -90 + off; x < W + 90; x += 90) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 0; y < H; y += 90) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
  const vg = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.2, W / 2, H * 0.5, H * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------- phone
// profile image (own profile with owner-only rows removed); follow row at y 533..597 in its pixels
const BTN = { segui: [225, 413, 464, 64], msg: [700, 413, 464, 64] };
function phone(ctx, IMG, u, cx, top, w) {
  const h = 1700, r = 90, b = 22;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 90; ctx.shadowOffsetY = 40;
  rrect(ctx, cx - w / 2, top, w, h, r); ctx.fillStyle = '#1A1A1C'; ctx.fill(); ctx.shadowColor = 'transparent';
  const edge = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
  edge.addColorStop(0, '#6A6A70'); edge.addColorStop(0.5, '#2A2A2E'); edge.addColorStop(1, '#55555B');
  rrect(ctx, cx - w / 2, top, w, h, r); ctx.strokeStyle = edge; ctx.lineWidth = 8; ctx.stroke();
  const sx = cx - w / 2 + b, sy = top + b, sw = w - 2 * b, sh = h - 2 * b;
  ctx.save(); rrect(ctx, sx, sy, sw, sh, r - b); ctx.clip();
  ctx.fillStyle = '#0C0E12'; ctx.fillRect(sx, sy, sw, sh);
  const img = IMG.profilo;
  const sc = sw / img.width, py = sy + 80;          // status-bar strip on top
  ctx.drawImage(img, sx, py, sw, img.height * sc);
  // visitor buttons: "Segui" (blue) -> "Segui gia" (grey) after the tap, and "Messaggio"
  const done = u >= 3.3;
  const press = 1 - 0.06 * Math.max(0, 1 - Math.abs(u - 3.15) / 0.2);
  const [bx, by, bw, bh] = BTN.segui, [mx, , mw] = BTN.msg;
  const X = (v) => sx + v * sc, Y = (v) => py + v * sc;
  ctx.save(); ctx.translate(X(bx + bw / 2), Y(by + bh / 2)); ctx.scale(press, press);
  rrect(ctx, -bw * sc / 2, -bh * sc / 2, bw * sc, bh * sc, 14 * sc); ctx.fillStyle = done ? C.igGrey : C.igBlue; ctx.fill();
  text(ctx, done ? 'Segui già' : 'Segui', 0, 11 * sc, font(30 * sc, 700, UI), C.white, 'center');
  ctx.restore();
  rrect(ctx, X(mx), Y(by), mw * sc, bh * sc, 14 * sc); ctx.fillStyle = C.igGrey; ctx.fill();
  text(ctx, 'Messaggio', X(mx + mw / 2), Y(by + bh / 2) + 11 * sc, font(30 * sc, 700, UI), C.white, 'center');
  // status bar + dynamic island
  text(ctx, '9:41', sx + 70, sy + 56, font(30, 700, UI), C.white, 'left');
  ctx.restore();
  rrect(ctx, cx - 80, sy + 22, 160, 46, 23); ctx.fillStyle = '#000'; ctx.fill();
  ctx.restore();
  return { X, Y, segui: [X(bx + bw / 2), Y(by + bh / 2)] };
}

// ---------------------------------------------------------------- scene
function scene(ctx, u, IMG) {
  bgDark(ctx, u);
  // red spotlight disc behind the phone
  const dk = springU(u, 0, SPRING.gentle);
  ctx.beginPath(); ctx.arc(W / 2, 1250, 520 * dk, 0, M.TAU); ctx.fillStyle = 'rgba(240,168,42,0.9)'; ctx.fill();

  // camera: after the headline, push into the follow button
  const k = springU(u, -0.25, FAST);
  const w = 900, top = 700 + (1 - k) * 1300;
  const zp = E.inOutCubic(prog(u, 1.9, 2.9));
  // follow-button screen position at rest (computed from the layout, no state)
  const sc = (w - 44) / IMG.profilo.width;
  const fx = W / 2 - w / 2 + 22 + (BTN.segui[0] + BTN.segui[2] / 2) * sc;
  const fy = 700 + 22 + 80 + (BTN.segui[1] + BTN.segui[3] / 2) * sc;
  const z = 1 + 0.42 * zp;
  ctx.save();
  // keep the follow button on its spot while scaling, then glide it to mid-frame
  ctx.translate(lerp(fx, W / 2, zp), lerp(fy, 1180, zp));
  ctx.scale(z, z);
  ctx.translate(-fx, -fy);
  ctx.translate(W / 2, top + 850); ctx.rotate(0.05 * (1 - k)); ctx.translate(-W / 2, -(top + 850));
  phone(ctx, IMG, u, W / 2, top, w);
  // the tap: ring + soft fill where the finger lands
  const tp = prog(u, 3.1, 4.0);
  if (tp > 0 && tp < 1) {
    ctx.beginPath(); ctx.arc(fx, fy - (1 - k) * 0, 26 + tp * 90, 0, M.TAU);
    ctx.strokeStyle = `rgba(255,255,255,${0.9 * (1 - tp)})`; ctx.lineWidth = 6; ctx.stroke();
    ctx.beginPath(); ctx.arc(fx, fy, 30 * (1 - tp * 0.4), 0, M.TAU); ctx.fillStyle = `rgba(255,255,255,${0.45 * (1 - tp)})`; ctx.fill();
  }
  ctx.restore();

  // headline on top (stays above the zoom), on a dark band
  const band = ctx.createLinearGradient(0, 0, 0, 720);
  band.addColorStop(0, 'rgba(10,23,51,0.95)'); band.addColorStop(0.75, 'rgba(10,23,51,0.85)'); band.addColorStop(1, 'rgba(10,23,51,0)');
  ctx.fillStyle = band; ctx.fillRect(0, 0, W, 720);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 30;
  rise(ctx, 'Ami il basket?', W / 2, 330, font(96, 500, ITAL), C.white, u, 0.05);
  slam(ctx, 'SEGUICI', W / 2, 520, 200, C.black, u, 0.7, C.red);
  ctx.restore();
  // after the tap: a small confirmation chip
  const ck = springU(u, 3.5, FAST);
  if (ck > 0) {
    const f = font(40, 800, UI), L = layout(ctx, '@asd_roraigrande', f, 2);
    const pw = L.width + 70, ph = 84;
    ctx.save(); ctx.translate(W / 2, 1580); ctx.scale(ck, ck); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 30;
    rrect(ctx, -pw / 2, -ph / 2, pw, ph, ph / 2); ctx.fillStyle = C.white; ctx.fill();
    text(ctx, '@asd_roraigrande', 0, 14, f, C.black, 'center', 2);
    ctx.restore();
  }
}

let GRAIN = null;
function makeGrain() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512;
  const c = cv.getContext('2d'); const im = c.createImageData(512, 512); const R = mulberry32(9);
  for (let i = 0; i < im.data.length; i += 4) { const v = R() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 9; }
  c.putImageData(im, 0, 0); return cv;
}

M.film({
  fonts: [font(100, 900, HEAVY), font(100, 500, ITAL), font(40, 700, UI), font(40, 800, UI)],
  images: { profilo: 'assets/profilo.png' },
  hits: HITS,
  init() { GRAIN = makeGrain(); },
  draw(ctx, u, t, IMG) { scene(ctx, u, IMG); },
  post(ctx, u) {
    if (!GRAIN) return;
    const f = Math.floor(u * 12);
    const ox = -Math.floor(hash01(f, 3) * 512), oy = -Math.floor(hash01(f, 5) * 512);
    for (let x = ox; x < W; x += 512) for (let y = oy; y < H; y += 512) ctx.drawImage(GRAIN, x, y);
  },
});
