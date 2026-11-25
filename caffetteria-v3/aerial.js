// aerial.js: a photographic-looking aerial view of a town, painted once in code (seeded, no network).
// World units are ~metres; the cafe sits at (0,0) on the main avenue (world x axis, rotated by ANG).
// Two prerendered levels: CITY (wide, coarse) and BLOCK (around the cafe, fine); film.js crossfades.
import { mulberry32, clamp, lerp } from './lib/motion.js';

export const ANG = -0.30;                 // grid orientation (the avenue runs along it)
const CA = Math.cos(ANG), SA = Math.sin(ANG);
const toW = (lx, ly) => [lx * CA - ly * SA, lx * SA + ly * CA];  // grid-local -> world

const ROOF = ['#B5623E', '#A9573A', '#C0714A', '#9E5236', '#B86B47', '#C77C57', '#A4604A', '#8F4B33'];
const FLAT = ['#8E8B86', '#A19D96', '#7D7A75', '#B3AEA6', '#9A958C'];
const TREE = ['#3E5A2E', '#466636', '#365227', '#4E6E3A', '#2F4A24'];

// ------------------------------------------------------------ world model (seeded)
export const WORLD = { river: [], xs: [], ys: [], blocks: [], avenueY: 0 };
function near(pts, x, y, d) {
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const vx = bx - ax, vy = by - ay, l = vx * vx + vy * vy;
    const t = clamp(((x - ax) * vx + (y - ay) * vy) / l);
    if (Math.hypot(ax + vx * t - x, ay + vy * t - y) < d) return true;
  }
  return false;
}
export function buildWorld() {
  const R = mulberry32(2026);
  // river (Noncello-like): meanders north-south, west of the cafe
  for (let i = 0; i <= 120; i++) {
    const k = i / 120;
    WORLD.river.push([-520 + Math.sin(k * 11) * 150 + Math.sin(k * 3.1) * 260 + (k - 0.5) * 500, lerp(-4200, 4200, k)]);
  }
  // street lines in grid-local space: irregular spacing, the avenue at ly = 0
  let x = -4200; while (x < 4200) { WORLD.xs.push(x); x += 70 + R() * 90; }
  let y = 0; const ys = [0];
  while (y < 4200) { y += 80 + R() * 70; ys.push(y); }
  y = 0; while (y > -4200) { y -= 80 + R() * 70; ys.unshift(y); }
  WORLD.ys = ys;
  // blocks between street lines
  for (let i = 1; i < WORLD.xs.length; i++) for (let j = 1; j < ys.length; j++) {
    const x0 = WORLD.xs[i - 1], x1 = WORLD.xs[i], y0 = ys[j - 1], y1 = ys[j];
    const [cx, cy] = toW((x0 + x1) / 2, (y0 + y1) / 2);
    const r = Math.hypot(cx + 300, cy + 200);
    const onRiver = near(WORLD.river, cx, cy, 60 + Math.max(x1 - x0, y1 - y0) * 0.5);
    let kind;
    if (onRiver) kind = 'bank';
    else if (r > 3000 + R() * 600) kind = 'field';
    else if (r > 2000 + R() * 500) kind = R() < 0.6 ? 'houses' : 'field';
    else { const q = R(); kind = q < 0.07 ? 'park' : q < 0.12 ? 'square' : q < 0.25 ? 'houses' : 'urban'; }
    // the cafe's own blocks are dense urban
    if (Math.abs(cx) < 220 && Math.abs(cy) < 220 && kind !== 'bank') kind = 'urban';
    WORLD.blocks.push({ x0, x1, y0, y1, kind, seed: Math.floor(R() * 1e9) });
  }
}
// widths of the street on each grid line (avenue wider)
const roadW = (ly) => (ly === 0 ? 26 : Math.abs(ly) < 1 ? 26 : 11);

// ------------------------------------------------------------ painting
function noiseTile(size, seed, a) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const c = cv.getContext('2d'); const im = c.createImageData(size, size); const R = mulberry32(seed);
  for (let i = 0; i < im.data.length; i += 4) { const v = R() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = a; }
  c.putImageData(im, 0, 0); return cv;
}
function tree(c, x, y, r, R, shadow) {
  if (shadow) { c.fillStyle = 'rgba(10,20,5,0.35)'; c.beginPath(); c.ellipse(x + r * 0.45, y + r * 0.55, r, r * 0.92, 0, 0, Math.PI * 2); c.fill(); return; }
  const col = TREE[Math.floor(R() * TREE.length)];
  const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.05);
  g.addColorStop(0, '#7E9A57'); g.addColorStop(0.45, col); g.addColorStop(1, '#22361A');
  c.fillStyle = g;
  c.beginPath();
  for (let k = 0; k <= 10; k++) { const a = (k / 10) * Math.PI * 2, rr = r * (0.85 + R() * 0.25); k ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  c.fill();
}
// a gabled roof in grid-local coordinates (rect), ridge along the long side; sun from the top-left
function roof(c, x, y, w, h, col, R, flat) {
  if (flat) {
    c.fillStyle = col; c.fillRect(x, y, w, h);
    c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 0.8; c.strokeRect(x + 1, y + 1, w - 2, h - 2);
    if (R() < 0.6) { c.fillStyle = 'rgba(60,60,60,0.5)'; c.fillRect(x + w * R() * 0.7 + 1, y + h * R() * 0.6 + 1, 2.5, 2.5); }
    return;
  }
  const along = w >= h;
  c.fillStyle = col; c.fillRect(x, y, w, h);
  // the shaded half
  c.fillStyle = 'rgba(40,15,5,0.28)';
  if (along) c.fillRect(x, y + h / 2, w, h / 2); else c.fillRect(x + w / 2, y, w / 2, h);
  // lit half sheen
  c.fillStyle = 'rgba(255,220,180,0.10)';
  if (along) c.fillRect(x, y, w, h / 2); else c.fillRect(x, y, w / 2, h);
  // ridge
  c.strokeStyle = 'rgba(70,30,15,0.55)'; c.lineWidth = 0.6; c.beginPath();
  if (along) { c.moveTo(x + 1, y + h / 2); c.lineTo(x + w - 1, y + h / 2); } else { c.moveTo(x + w / 2, y + 1); c.lineTo(x + w / 2, y + h - 1); }
  c.stroke();
  // tile courses
  c.strokeStyle = 'rgba(60,20,8,0.12)'; c.lineWidth = 0.35; c.beginPath();
  if (along) for (let k = x + 1.2; k < x + w; k += 1.3) { c.moveTo(k, y); c.lineTo(k, y + h); }
  else for (let k = y + 1.2; k < y + h; k += 1.3) { c.moveTo(x, k); c.lineTo(x + w, k); }
  c.stroke();
}
function paintBlock(c, b, pass) {
  const R = mulberry32(b.seed);
  const hw = (ly) => roadW(ly) / 2 + 3;                 // half road + sidewalk
  const x0 = b.x0 + 6 + 3, x1 = b.x1 - 6 - 3, y0 = b.y0 + hw(b.y0), y1 = b.y1 - hw(b.y1);
  const w = x1 - x0, h = y1 - y0;
  if (w < 8 || h < 8) return;
  if (pass === 'ground') {
    const base = { urban: '#8C8577', square: '#B9AF9C', houses: '#7A8059', park: '#5F7A3C', field: null, bank: '#5E7440' }[b.kind];
    if (b.kind === 'field') {
      // strip fields
      const n = 2 + Math.floor(R() * 4);
      for (let k = 0; k < n; k++) {
        const col = ['#8C9A55', '#A3A060', '#6F8445', '#B6A86C', '#7E8C4C', '#9C8F5E'][Math.floor(R() * 6)];
        c.fillStyle = col; c.fillRect(x0 - 6, y0 - 6 + (k * (h + 12)) / n, w + 12, (h + 12) / n);
      }
      c.strokeStyle = 'rgba(60,50,30,0.15)'; c.lineWidth = 0.6;
      for (let k = x0; k < x1; k += 3) { c.beginPath(); c.moveTo(k, y0); c.lineTo(k, y1); c.stroke(); }
      return;
    }
    c.fillStyle = base; c.fillRect(x0, y0, w, h);
    if (b.kind === 'square') { c.fillStyle = '#CFC5B0'; c.fillRect(x0 + 4, y0 + 4, w - 8, h - 8); }
    return;
  }
  // buildings and trees
  const shadow = pass === 'shadow';
  const S = shadow ? 3.2 : 0;   // shadow offset (sun top-left)
  if (b.kind === 'urban' && (b.seed % 9 === 0) && w > 40 && h > 40) {
    const bw = w * (0.55 + R() * 0.3), bh = h * (0.45 + R() * 0.3), bx = x0 + (w - bw) * R(), by = y0 + (h - bh) * R();
    if (!shadow) { c.fillStyle = '#9C9483'; c.fillRect(x0, y0, w, h); }
    if (shadow) { c.fillStyle = 'rgba(15,10,5,0.45)'; c.fillRect(bx + 6, by + 6, bw, bh); }
    else roof(c, bx, by, bw, bh, R() < 0.5 ? ROOF[Math.floor(R() * ROOF.length)] : FLAT[Math.floor(R() * FLAT.length)], R, R() < 0.5);
    const nt = 5 + Math.floor(R() * 6);
    for (let k = 0; k < nt; k++) { const tx = x0 + R() * w, ty = y0 + R() * h; if (tx > bx - 3 && tx < bx + bw + 3 && ty > by - 3 && ty < by + bh + 3) continue; tree(c, tx, ty, 3 + R() * 3, R, shadow); }
    return;
  }
  if (b.kind === 'urban') {
    // perimeter block, Italian style: buildings along each side, courtyard in the middle
    const d = 12 + R() * 6;
    const sides = [
      [x0, y0, w, d, true], [x0, y1 - d, w, d, true], [x0, y0 + d, d, h - 2 * d, false], [x1 - d, y0 + d, d, h - 2 * d, false],
    ];
    sides.forEach(([sx, sy, sw, sh, horiz]) => {
      let p = 0; const L = horiz ? sw : sh;
      while (p < L - 4) {
        const seg = Math.min(L - p, 9 + R() * 18);
        const flat = R() < 0.16;
        const col = flat ? FLAT[Math.floor(R() * FLAT.length)] : ROOF[Math.floor(R() * ROOF.length)];
        const bx = horiz ? sx + p : sx, by = horiz ? sy : sy + p, bw = horiz ? seg - 0.4 : sw, bh = horiz ? sh : seg - 0.4;
        const tall = 1 + R() * 1.6;
        if (shadow) { c.fillStyle = 'rgba(15,10,5,0.42)'; c.fillRect(bx + S * tall, by + S * tall, bw, bh); }
        else roof(c, bx, by, bw, bh, col, R, flat);
        p += seg;
      }
    });
    // courtyard: a patchwork of gardens, paving, parking and sheds, plus trees
    const ix = x0 + d, iy = y0 + d, iw = w - 2 * d, ih = h - 2 * d;
    if (iw > 6 && ih > 6) {
      const cols = Math.max(1, Math.round(iw / (14 + R() * 10))), rows = Math.max(1, Math.round(ih / (14 + R() * 10)));
      for (let a = 0; a < cols; a++) for (let q = 0; q < rows; q++) {
        const px = ix + (a * iw) / cols, py = iy + (q * ih) / rows, pw = iw / cols, ph = ih / rows;
        const t = R();
        if (!shadow) {
          c.fillStyle = t < 0.35 ? ['#6E8248', '#7A8C52', '#5F7440'][Math.floor(R() * 3)] : t < 0.6 ? ['#A39C8E', '#B2AA9A', '#958E80'][Math.floor(R() * 3)] : t < 0.8 ? '#77746E' : '#8A7F6B';
          c.fillRect(px, py, pw, ph);
          if (t >= 0.6 && t < 0.8) { // parking with cars
            for (let k = py + 1; k < py + ph - 4; k += 5) if (R() < 0.7) { c.fillStyle = ['#E8E6E1', '#2B2D33', '#8A8D93', '#B3262A', '#1F3A66'][Math.floor(R() * 5)]; c.fillRect(px + 1 + R() * Math.max(0, pw - 4), k, 2.1, 4.2); }
          }
        }
        if (t >= 0.8 && pw > 5 && ph > 5) { // shed / low annex
          const sw = pw * (0.4 + R() * 0.4), sh = ph * (0.4 + R() * 0.4);
          if (shadow) { c.fillStyle = 'rgba(15,10,5,0.35)'; c.fillRect(px + 1.5, py + 1.5, sw, sh); }
          else roof(c, px, py, sw, sh, R() < 0.5 ? FLAT[Math.floor(R() * FLAT.length)] : ROOF[Math.floor(R() * ROOF.length)], R, R() < 0.5);
        }
        if (t < 0.35) { const nt = 1 + Math.floor(R() * 3); for (let k = 0; k < nt; k++) tree(c, px + R() * pw, py + R() * ph, 2.5 + R() * 3.5, R, shadow); }
      }
    }
  } else if (b.kind === 'houses') {
    const n = 3 + Math.floor(R() * 6);
    for (let k = 0; k < n; k++) {
      const bw = 9 + R() * 9, bh = 8 + R() * 8;
      const bx = x0 + R() * Math.max(1, w - bw), by = y0 + R() * Math.max(1, h - bh);
      if (shadow) { c.fillStyle = 'rgba(15,10,5,0.4)'; c.fillRect(bx + S, by + S, bw, bh); }
      else roof(c, bx, by, bw, bh, ROOF[Math.floor(R() * ROOF.length)], R, false);
    }
    const nt = 4 + Math.floor(R() * 8);
    for (let k = 0; k < nt; k++) tree(c, x0 + R() * w, y0 + R() * h, 2.5 + R() * 3.5, R, shadow);
  } else if (b.kind === 'park' || b.kind === 'bank') {
    const nt = Math.floor((w * h) / 120);
    for (let k = 0; k < nt; k++) tree(c, x0 + R() * w, y0 + R() * h, 3 + R() * 5, R, shadow);
    if (b.kind === 'park' && !shadow) { c.strokeStyle = '#C9BFA6'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, y0 + h * 0.5); c.quadraticCurveTo(x0 + w * 0.5, y0 + h * R(), x1, y0 + h * 0.6); c.stroke(); }
  } else if (b.kind === 'square') {
    for (let k = 0; k < 6; k++) tree(c, x0 + 6 + (k % 3) * (w - 12) / 2, k < 3 ? y0 + 6 : y1 - 6, 3.2, R, shadow);
  }
}
function paintRoads(c, ext) {
  const { xs, ys } = WORLD;
  // sidewalks
  c.fillStyle = '#B9B2A4';
  ys.forEach((ly) => c.fillRect(ext.x0, ly - roadW(ly) / 2 - 3, ext.x1 - ext.x0, roadW(ly) + 6));
  xs.forEach((lx) => c.fillRect(lx - 9, ext.y0, 18, ext.y1 - ext.y0));
  // asphalt
  c.fillStyle = '#56575A';
  ys.forEach((ly) => c.fillRect(ext.x0, ly - roadW(ly) / 2, ext.x1 - ext.x0, roadW(ly)));
  xs.forEach((lx) => c.fillRect(lx - 6, ext.y0, 12, ext.y1 - ext.y0));
  // the avenue: two carriageways split by a tree-lined median, white dashes
  c.fillStyle = '#4C4D50'; c.fillRect(ext.x0, -13, ext.x1 - ext.x0, 26);
  c.fillStyle = '#6E7F4A'; c.fillRect(ext.x0, -1.6, ext.x1 - ext.x0, 3.2);
  c.fillStyle = 'rgba(240,240,235,0.85)';
  for (let x = ext.x0; x < ext.x1; x += 9) { c.fillRect(x, -7.2, 4.5, 0.45); c.fillRect(x, 6.8, 4.5, 0.45); }
  // zebra crossings at every junction of the avenue
  xs.forEach((lx) => { for (let k = -12; k < 12; k += 1.6) c.fillRect(lx + 7, k, 3, 0.8); });
}
function paintRiver(c) {
  const path = () => { c.beginPath(); WORLD.river.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); };
  c.lineCap = 'round'; c.lineJoin = 'round';
  path(); c.strokeStyle = '#4F6A3A'; c.lineWidth = 62; c.stroke();     // green banks
  path(); c.strokeStyle = '#7E8A64'; c.lineWidth = 40; c.stroke();
  path(); c.strokeStyle = '#3B5A57'; c.lineWidth = 30; c.stroke();     // water
  path(); c.strokeStyle = 'rgba(120,160,150,0.35)'; c.lineWidth = 12; c.stroke();
}
function paintRiverTrees(c, R, shadow) {
  for (let i = 0; i < WORLD.river.length - 1; i++) {
    const [x, y] = WORLD.river[i];
    for (let k = 0; k < 6; k++) { const s = R() < 0.5 ? -1 : 1; tree(c, x + s * (19 + R() * 12), y + R() * 70, 3 + R() * 4, R, shadow); }
  }
}
function paintCars(c, ext) {
  const R = mulberry32(77);
  const cols = ['#E8E6E1', '#2B2D33', '#8A8D93', '#B3262A', '#1F3A66', '#D9D4C9', '#5B6470'];
  const lanes = [-10, -4.5, 4.5, 10];
  for (let x = ext.x0; x < ext.x1; x += 6 + R() * 26) {
    const ly = lanes[Math.floor(R() * 4)];
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x + 0.5, ly - 0.7, 4.6, 2.2);
    c.fillStyle = cols[Math.floor(R() * cols.length)]; c.fillRect(x, ly - 1, 4.4, 2);
    c.fillStyle = 'rgba(20,30,40,0.6)'; c.fillRect(x + 2.6, ly - 0.8, 1, 1.6);
  }
  // parked cars along side streets
  WORLD.xs.forEach((lx) => { for (let y = ext.y0; y < ext.y1; y += 5.5 + R() * 9) { if (R() < 0.5) continue; c.fillStyle = cols[Math.floor(R() * cols.length)]; c.fillRect(lx - 5.6, y, 2, 4.2); } });
}
// paint the world region [cx±half] into a canvas of size px
export function paintLevel(cx, cy, half, px) {
  const cv = document.createElement('canvas'); cv.width = cv.height = px;
  const c = cv.getContext('2d');
  const k = px / (2 * half);
  c.fillStyle = '#7C7F5C'; c.fillRect(0, 0, px, px);
  c.setTransform(k, 0, 0, k, px / 2 - cx * k, px / 2 - cy * k);
  // grid-local drawing
  const local = () => { c.save(); c.rotate(ANG); };
  const ext = { x0: -4400, x1: 4400, y0: -4400, y1: 4400 };
  const vis = (b) => {
    const [wx, wy] = toW((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2);
    return Math.abs(wx - cx) < half + 200 && Math.abs(wy - cy) < half + 200;
  };
  const blocks = WORLD.blocks.filter(vis);
  local(); blocks.forEach((b) => paintBlock(c, b, 'ground')); paintRoads(c, ext); c.restore();
  paintRiver(c);
  local(); blocks.forEach((b) => b.kind !== 'field' && paintBlock(c, b, 'shadow')); c.restore();
  paintRiverTrees(c, mulberry32(5), true);
  local(); blocks.forEach((b) => b.kind !== 'field' && paintBlock(c, b, 'roof'));
  // avenue median trees
  const R = mulberry32(31);
  for (let x = ext.x0; x < ext.x1; x += 9) tree(c, x, 0, 3.4, R, true);
  for (let x = ext.x0; x < ext.x1; x += 9) tree(c, x, 0, 3.4, R, false);
  paintCars(c, ext);
  c.restore();
  paintRiverTrees(c, mulberry32(5), false);
  // photographic finish: grain + soft tonal variation
  c.setTransform(1, 0, 0, 1, 0, 0);
  const n = noiseTile(256, 11, 18);
  for (let x = 0; x < px; x += 256) for (let y = 0; y < px; y += 256) c.drawImage(n, x, y);
  const Rv = mulberry32(3);
  for (let i = 0; i < 40; i++) {
    const x = Rv() * px, y = Rv() * px, r = px * (0.05 + Rv() * 0.12);
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    const warm = Rv() < 0.5;
    g.addColorStop(0, warm ? 'rgba(255,230,190,0.07)' : 'rgba(20,30,20,0.07)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  return { cv, cx, cy, half };
}
