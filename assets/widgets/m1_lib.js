/* Module 1 — a tiny image-processing library for the visuals (gray and color images as typed arrays).
   Gray image: {w, h, d: Float32Array}. Color image: {w, h, c: 3, d: Float32Array} in B, G, R order (like the course library). */
(function () {
const IM = window.IM = {};
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
IM.clamp = clamp;
IM.gray = (w, h, v = 0) => ({ w, h, d: new Float32Array(w * h).fill(v) });
IM.color = (w, h, bgr = [0, 0, 0]) => { const im = { w, h, c: 3, d: new Float32Array(w * h * 3) }; for (let i = 0; i < w * h; i++) { im.d[3 * i] = bgr[0]; im.d[3 * i + 1] = bgr[1]; im.d[3 * i + 2] = bgr[2]; } return im; };
IM.copy = im => ({ w: im.w, h: im.h, c: im.c, d: new Float32Array(im.d) });
IM.at = (g, x, y) => g.d[clamp(y, 0, g.h - 1) * g.w + clamp(x, 0, g.w - 1)];
IM.map = (g, f) => { const o = IM.gray(g.w, g.h); for (let i = 0; i < g.d.length; i++) o.d[i] = f(g.d[i], i); return o; };
IM.rng = seed => { let s = (seed || 1) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };
IM.randn = r => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

/* ---- drawing to a canvas (scaled up, pixelated) ---- */
IM.canvas = (parent, w, h, scale = 3) => { const c = document.createElement('canvas'); c.dir = 'ltr'; c.width = w; c.height = h; c.style.width = (w * scale) + 'px'; c.style.maxWidth = '100%'; c.style.imageRendering = 'pixelated'; c.style.borderRadius = '8px'; c.style.border = '1px solid var(--line)'; parent.appendChild(c); return c; };
IM.show = (cv, im, opts = {}) => {
  if (cv.width !== im.w) cv.width = im.w; if (cv.height !== im.h) cv.height = im.h;
  const ctx = cv.getContext('2d'); const id = ctx.createImageData(im.w, im.h); const D = id.data;
  const off = opts.offset || 0, sc = opts.scale || 1;
  for (let i = 0; i < im.w * im.h; i++) {
    if (im.c === 3) { D[4 * i] = clamp(im.d[3 * i + 2], 0, 255); D[4 * i + 1] = clamp(im.d[3 * i + 1], 0, 255); D[4 * i + 2] = clamp(im.d[3 * i], 0, 255); }
    else if (opts.signed) { const v = im.d[i] * sc; D[4 * i] = clamp(128 + v, 0, 255); D[4 * i + 1] = clamp(128 + v, 0, 255); D[4 * i + 2] = clamp(128 + v, 0, 255); }
    else if (opts.tint && im.d[i] > 0) { const t = opts.tint; D[4 * i] = t[0]; D[4 * i + 1] = t[1]; D[4 * i + 2] = t[2]; }
    else { const v = clamp(im.d[i] * sc + off, 0, 255); D[4 * i] = D[4 * i + 1] = D[4 * i + 2] = v; }
    D[4 * i + 3] = 255;
  }
  ctx.putImageData(id, 0, 0);
  return ctx;
};
/* overlay helpers in image coordinates (canvas is drawn at image size and scaled by css) */
IM.ctx = cv => cv.getContext('2d');
IM.mouse = (cv, e) => { const r = cv.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) / r.width * cv.width), Math.floor((e.clientY - r.top) / r.height * cv.height)]; };

/* ---- shapes ---- */
IM.fillCircle = (im, cx, cy, r, val) => { for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(im.h - 1, Math.ceil(cy + r)); y++) for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(im.w - 1, Math.ceil(cx + r)); x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) IM.set(im, x, y, val); return im; };
IM.fillRect = (im, x0, y0, x1, y1, val) => { for (let y = Math.max(0, y0); y <= Math.min(im.h - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(im.w - 1, x1); x++) IM.set(im, x, y, val); return im; };
IM.set = (im, x, y, val) => { const i = y * im.w + x; if (im.c === 3) { im.d[3 * i] = val[0]; im.d[3 * i + 1] = val[1]; im.d[3 * i + 2] = val[2]; } else im.d[i] = val; };
IM.get3 = (im, x, y) => { const i = 3 * (y * im.w + x); return [im.d[i], im.d[i + 1], im.d[i + 2]]; };
IM.toGray = im => { const g = IM.gray(im.w, im.h); for (let i = 0; i < g.d.length; i++) g.d[i] = 0.114 * im.d[3 * i] + 0.587 * im.d[3 * i + 1] + 0.299 * im.d[3 * i + 2]; return g; };

/* ---- color: B, G, R  <->  H (0..179), S, V like the course library ---- */
IM.bgr2hsv = (b, g, r) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0;
  if (d > 0) { if (mx === r) h = 60 * ((g - b) / d); else if (mx === g) h = 60 * ((b - r) / d) + 120; else h = 60 * ((r - g) / d) + 240; }
  if (h < 0) h += 360;
  return [Math.round(h / 2) % 180, mx ? Math.round(255 * d / mx) : 0, Math.round(mx)];
};
IM.hsv2bgr = (h, s, v) => {
  const H = h * 2, S = s / 255, Vv = v / 255; const c = Vv * S, x = c * (1 - Math.abs((H / 60) % 2 - 1)), m = Vv - c;
  let r = 0, g = 0, b = 0;
  if (H < 60) [r, g, b] = [c, x, 0]; else if (H < 120) [r, g, b] = [x, c, 0]; else if (H < 180) [r, g, b] = [0, c, x]; else if (H < 240) [r, g, b] = [0, x, c]; else if (H < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
  return [Math.round((b + m) * 255), Math.round((g + m) * 255), Math.round((r + m) * 255)];
};
IM.inRange = (im, lo, hi, space) => { const m = IM.gray(im.w, im.h); for (let i = 0; i < m.d.length; i++) { let p = [im.d[3 * i], im.d[3 * i + 1], im.d[3 * i + 2]]; if (space === 'hsv') p = IM.bgr2hsv(p[0], p[1], p[2]); m.d[i] = p[0] >= lo[0] && p[0] <= hi[0] && p[1] >= lo[1] && p[1] <= hi[1] && p[2] >= lo[2] && p[2] <= hi[2] ? 255 : 0; } return m; };
IM.count = m => { let n = 0; for (const v of m.d) if (v > 0) n++; return n; };
IM.applyMask = (im, m) => { const o = IM.copy(im); for (let i = 0; i < m.d.length; i++) if (!m.d[i]) { o.d[3 * i] = o.d[3 * i + 1] = o.d[3 * i + 2] = 0; } return o; };

/* ---- filters ---- */
IM.conv = (g, K) => { const kh = K.length, kw = K[0].length, oy = kh >> 1, ox = kw >> 1, o = IM.gray(g.w, g.h);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) { let s = 0; for (let i = 0; i < kh; i++) for (let j = 0; j < kw; j++) s += K[i][j] * IM.at(g, x + j - ox, y + i - oy); o.d[y * g.w + x] = s; } return o; };
IM.boxK = k => [...Array(k)].map(() => Array(k).fill(1 / (k * k)));
IM.gaussK = (k, sigma) => { sigma = sigma || 0.3 * ((k - 1) * 0.5 - 1) + 0.8; const o = k >> 1; const g1 = [...Array(k)].map((_, i) => Math.exp(-((i - o) ** 2) / (2 * sigma * sigma))); const s = g1.reduce((a, b) => a + b); const n = g1.map(v => v / s); return n.map(a => n.map(b => a * b)); };
IM.gauss1 = k => { const K = IM.gaussK(k); const s = K.map(r => r.reduce((a, b) => a + b)); return s; };
IM.median = (g, k) => { const o = k >> 1, out = IM.gray(g.w, g.h), a = new Float32Array(k * k);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) { let n = 0; for (let i = -o; i <= o; i++) for (let j = -o; j <= o; j++) a[n++] = IM.at(g, x + j, y + i); a.sort(); out.d[y * g.w + x] = a[n >> 1]; } return out; };
IM.bilateral = (g, k, sc, ss) => { const o = k >> 1, out = IM.gray(g.w, g.h); ss = ss || o; sc = sc || 40;
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) { const c = g.d[y * g.w + x]; let s = 0, ws = 0; for (let i = -o; i <= o; i++) for (let j = -o; j <= o; j++) { const v = IM.at(g, x + j, y + i); const w = Math.exp(-(i * i + j * j) / (2 * ss * ss) - ((v - c) ** 2) / (2 * sc * sc)); s += w * v; ws += w; } out.d[y * g.w + x] = s / ws; } return out; };
IM.blur = (g, k) => IM.conv(g, IM.gaussK(k));
IM.noise = (g, kind, amt, seed) => { const r = IM.rng(seed || 3); return IM.map(g, v => { if (kind === 'sp') { const u = r(); return u < amt / 2 ? 0 : u < amt ? 255 : v; } return clamp(v + IM.randn(r) * amt, 0, 255); }); };
IM.err = (a, b) => { let s = 0; for (let i = 0; i < a.d.length; i++) s += Math.abs(Math.round(clamp(a.d[i], 0, 255)) - b.d[i]); return s / a.d.length; };

/* ---- edges ---- */
IM.KX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]; IM.KY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
IM.sobel = g => { const gx = IM.conv(g, IM.KX), gy = IM.conv(g, IM.KY); const mag = IM.gray(g.w, g.h); for (let i = 0; i < mag.d.length; i++) mag.d[i] = Math.hypot(gx.d[i], gy.d[i]); return { gx, gy, mag }; };
IM.nms = (S) => { const { gx, gy, mag } = S, w = mag.w, h = mag.h, o = IM.gray(w, h);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x, m = mag.d[i]; if (!m) continue; let a = Math.atan2(gy.d[i], gx.d[i]) * 180 / Math.PI; if (a < 0) a += 180;
    let dx = 1, dy = 0; if (a >= 22.5 && a < 67.5) { dx = 1; dy = 1; } else if (a >= 67.5 && a < 112.5) { dx = 0; dy = 1; } else if (a >= 112.5 && a < 157.5) { dx = -1; dy = 1; }
    const p = mag.d[(y + dy) * w + x + dx], q = mag.d[(y - dy) * w + x - dx]; if (m > p && m >= q) o.d[i] = m; } return o; };
IM.hyst = (n, lo, hi) => { const w = n.w, h = n.h, o = IM.gray(w, h), st = [];
  for (let i = 0; i < n.d.length; i++) if (n.d[i] >= hi) { o.d[i] = 255; st.push(i); }
  while (st.length) { const i = st.pop(), x = i % w, y = (i / w) | 0; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const xx = x + b, yy = y + a; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const j = yy * w + xx; if (!o.d[j] && n.d[j] >= lo) { o.d[j] = 255; st.push(j); } } }
  return o; };
IM.canny = (g, lo, hi, blurK) => { const b = blurK ? IM.blur(g, blurK) : g; const S = IM.sobel(b); return IM.hyst(IM.nms(S), lo, hi); };  // thresholds on the Sobel magnitude, exactly like the library

/* ---- morphology ---- */
IM.morph = (m, k, op, shape) => { const o = k >> 1, out = IM.gray(m.w, m.h); const inK = (i, j) => shape === 'ellipse' ? (i * i + j * j <= o * o + 0.5) : shape === 'cross' ? (i === 0 || j === 0) : true;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { let v = op === 'erode' ? 255 : 0; for (let i = -o; i <= o; i++) for (let j = -o; j <= o; j++) { if (!inK(i, j)) continue; const yy = y + i, xx = x + j; const p = (yy < 0 || xx < 0 || yy >= m.h || xx >= m.w) ? (op === 'erode' ? 255 : 0) : m.d[yy * m.w + xx]; v = op === 'erode' ? Math.min(v, p) : Math.max(v, p); } out.d[y * m.w + x] = v; } return out; };
IM.erode = (m, k, s) => IM.morph(m, k || 3, 'erode', s); IM.dilate = (m, k, s) => IM.morph(m, k || 3, 'dilate', s);
IM.open = (m, k, s) => IM.dilate(IM.erode(m, k, s), k, s); IM.close = (m, k, s) => IM.erode(IM.dilate(m, k, s), k, s);
IM.diff = (a, b) => { let n = 0; for (let i = 0; i < a.d.length; i++) if ((a.d[i] > 0) !== (b.d[i] > 0)) n++; return n; };

/* ---- connected components and simple contour measures ---- */
IM.components = m => { const w = m.w, h = m.h, lab = new Int32Array(w * h).fill(-1), comps = [];
  for (let i = 0; i < w * h; i++) { if (!m.d[i] || lab[i] >= 0) continue; const id = comps.length, st = [i]; lab[i] = id; const c = { id, area: 0, sx: 0, sy: 0, x0: 1e9, y0: 1e9, x1: -1, y1: -1, per: 0, pix: [] };
    while (st.length) { const p = st.pop(), x = p % w, y = (p / w) | 0; c.area++; c.sx += x; c.sy += y; c.pix.push(p); if (x < c.x0) c.x0 = x; if (y < c.y0) c.y0 = y; if (x > c.x1) c.x1 = x; if (y > c.y1) c.y1 = y;
      let edge = false; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h || !m.d[yy * w + xx]) { edge = true; return; } const q = yy * w + xx; if (lab[q] < 0) { lab[q] = id; st.push(q); } });
      for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h && m.d[yy * w + xx] && lab[yy * w + xx] < 0) { lab[yy * w + xx] = id; st.push(yy * w + xx); } }
      if (edge) c.per++; }
    c.cx = c.sx / c.area; c.cy = c.sy / c.area;
    // perimeter estimate: boundary pixel count scaled toward a smooth outline; circularity on the same basis
    c.perimeter = c.per * 1.06; c.circ = Math.min(1, 4 * Math.PI * c.area / (c.perimeter * c.perimeter));
    let r = 0; c.pix.forEach(p => { const x = p % w, y = (p / w) | 0; r = Math.max(r, Math.hypot(x - c.cx, y - c.cy)); }); c.r = r + 0.5;
    comps.push(c); }
  return { lab, comps }; };

/* ---- geometry ---- */
IM.sample = (im, x, y, mode) => { // bilinear / nearest, outside = 0
  if (mode === 'nearest') { const xi = Math.round(x), yi = Math.round(y); if (xi < 0 || yi < 0 || xi >= im.w || yi >= im.h) return im.c === 3 ? [0, 0, 0] : 0; return im.c === 3 ? IM.get3(im, xi, yi) : im.d[yi * im.w + xi]; }
  if (x < 0 || y < 0 || x > im.w - 1 || y > im.h - 1) return im.c === 3 ? [0, 0, 0] : 0;
  const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(x0 + 1, im.w - 1), y1 = Math.min(y0 + 1, im.h - 1), a = x - x0, b = y - y0;
  if (im.c === 3) { const p = [0, 1, 2].map(c => (1 - a) * (1 - b) * im.d[3 * (y0 * im.w + x0) + c] + a * (1 - b) * im.d[3 * (y0 * im.w + x1) + c] + (1 - a) * b * im.d[3 * (y1 * im.w + x0) + c] + a * b * im.d[3 * (y1 * im.w + x1) + c]); return p; }
  return (1 - a) * (1 - b) * im.d[y0 * im.w + x0] + a * (1 - b) * im.d[y0 * im.w + x1] + (1 - a) * b * im.d[y1 * im.w + x0] + a * b * im.d[y1 * im.w + x1]; };
IM.inv3 = M => { const [a, b, c] = M[0], [d, e, f] = M[1], [g, h, i] = M[2]; const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C;
  return [[A / det, -(b * i - c * h) / det, (b * f - c * e) / det], [B / det, (a * i - c * g) / det, -(a * f - c * d) / det], [C / det, -(a * h - b * g) / det, (a * e - b * d) / det]]; };
IM.warp = (im, H, w, h, mode) => { // H maps source -> destination (3x3); inverse mapping
  const Hi = IM.inv3(H), o = im.c === 3 ? IM.color(w, h) : IM.gray(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const W = Hi[2][0] * x + Hi[2][1] * y + Hi[2][2]; const sx = (Hi[0][0] * x + Hi[0][1] * y + Hi[0][2]) / W, sy = (Hi[1][0] * x + Hi[1][1] * y + Hi[1][2]) / W; const v = IM.sample(im, sx, sy, mode); if (im.c === 3) IM.set(o, x, y, v); else o.d[y * w + x] = v; }
  return o; };
IM.aff = M => [M[0], M[1], [0, 0, 1]];

/* ---- corners and optical flow (small, for the visuals) ---- */
IM.corners = (g, maxN, minDist, qual) => { const S = IM.sobel(g); const w = g.w, h = g.h, R = new Float32Array(w * h); let mx = 0;
  for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) { let a = 0, b = 0, c = 0; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const k = (y + i) * w + x + j; const ix = S.gx.d[k], iy = S.gy.d[k]; a += ix * ix; b += ix * iy; c += iy * iy; } const tr = a + c, dt = a * c - b * b; const l = tr / 2 - Math.sqrt(Math.max(0, tr * tr / 4 - dt)); R[y * w + x] = l; if (l > mx) mx = l; }
  const cand = []; for (let i = 0; i < R.length; i++) if (R[i] > mx * (qual || 0.05)) cand.push(i); cand.sort((p, q) => R[q] - R[p]);
  const out = []; for (const i of cand) { const x = i % w, y = (i / w) | 0; if (out.every(p => Math.hypot(p[0] - x, p[1] - y) >= (minDist || 6))) out.push([x, y, R[i] / mx]); if (out.length >= (maxN || 50)) break; }
  return out; };
IM.lk = (g1, g2, x, y, r) => { // one Lucas–Kanade step at a point
  r = r || 3; let a = 0, b = 0, c = 0, p = 0, q = 0;
  for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) { const X = x + j, Y = y + i; const ix = (IM.at(g1, X + 1, Y) - IM.at(g1, X - 1, Y)) / 2, iy = (IM.at(g1, X, Y + 1) - IM.at(g1, X, Y - 1)) / 2, it = IM.at(g2, X, Y) - IM.at(g1, X, Y); a += ix * ix; b += ix * iy; c += iy * iy; p += ix * it; q += iy * it; }
  const det = a * c - b * b; if (Math.abs(det) < 1e-6) return null; return [(-c * p + b * q) / det, (b * p - a * q) / det, Math.min(a, c) / (Math.max(a, c) + 1e-9), det]; };
IM.shift = (g, dx, dy) => { const o = IM.gray(g.w, g.h); for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) o.d[y * g.w + x] = IM.sample(g, x - dx, y - dy) || IM.at(g, Math.round(x - dx), Math.round(y - dy)); return o; };
IM.down = g => { const w = g.w >> 1, h = g.h >> 1, o = IM.gray(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) o.d[y * w + x] = (IM.at(g, 2 * x, 2 * y) + IM.at(g, 2 * x + 1, 2 * y) + IM.at(g, 2 * x, 2 * y + 1) + IM.at(g, 2 * x + 1, 2 * y + 1)) / 4; return o; };

/* ---- a random scene of shapes, like make_scene ---- */
IM.scene = (w, h, seed, n) => { const r = IM.rng(seed || 1), im = IM.color(w, h, [128, 128, 128]);
  for (let k = 0; k < (n || 25); k++) { const col = [r() * 255, r() * 255, r() * 255].map(Math.round), x = Math.floor(r() * w), y = Math.floor(r() * h);
    if (r() < 0.5) IM.fillCircle(im, x, y, 2 + r() * w * 0.06, col); else IM.fillRect(im, x, y, x + 3 + Math.floor(r() * w * 0.1), y + 3 + Math.floor(r() * h * 0.1), col); }
  return im; };

/* ---- small plotting helper on svg ---- */
IM.plot = (parent, opts) => { const W = opts.w || 420, H = opts.h || 160; const svg = V.s('svg', { viewBox: `0 0 ${W} ${H}`, width: W, style: { maxWidth: '100%', direction: 'ltr' } }); const wr = V.el('div', { style: { display: 'flex', justifyContent: 'center' } }); wr.appendChild(svg); parent.appendChild(wr);
  return { svg, draw(series, xr, yr) { svg.innerHTML = ''; const X = x => 30 + (x - xr[0]) / (xr[1] - xr[0]) * (W - 40), Y = y => H - 18 - (y - yr[0]) / (yr[1] - yr[0]) * (H - 30);
    V.s('line', { x1: 30, y1: H - 18, x2: W - 10, y2: H - 18, style: { stroke: 'var(--line2)' } }, svg); V.s('line', { x1: 30, y1: 8, x2: 30, y2: H - 18, style: { stroke: 'var(--line2)' } }, svg);
    series.forEach(s => { if (s.bars) { s.pts.forEach(([x, y]) => V.s('rect', { x: X(x) - s.bw / 2, y: Y(Math.max(0, y)), width: s.bw, height: Math.abs(Y(0) - Y(y)), style: { fill: s.color, opacity: s.op || 0.85 } }, svg)); return; }
      if (s.vline !== undefined) { V.s('line', { x1: X(s.vline), y1: 8, x2: X(s.vline), y2: H - 18, style: { stroke: s.color, strokeWidth: s.width || 2, strokeDasharray: s.dash || '' } }, svg); if (s.label) V.s('text', { x: X(s.vline) + 4, y: 18, 'font-size': 11, style: { fill: s.color }, text: s.label }, svg); return; }
      const d = s.pts.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(''); V.s('path', { d, style: { fill: 'none', stroke: s.color, strokeWidth: s.width || 2, strokeDasharray: s.dash || '' } }, svg);
      if (s.dots) s.pts.forEach(p => V.s('circle', { cx: X(p[0]), cy: Y(p[1]), r: 3, style: { fill: s.color } }, svg)); });
    (opts.labels || []).forEach(([t, x, y]) => V.s('text', { x, y, 'font-size': 11, style: { fill: 'var(--ink3)' }, text: t }, svg));
    return { X, Y }; } }; };
})();
