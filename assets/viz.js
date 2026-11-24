/* Small toolkit the interactive widgets are built from: DOM/SVG helpers, a 2D plane with draggable handles,
   sliders, a step player, matrix displays, function plots and procedural test images. */
(function () {
'use strict';
const NS = 'http://www.w3.org/2000/svg';
const V = {};
V.C = { a: 'var(--c1)', b: 'var(--c2)', c: 'var(--c3)', d: 'var(--c4)', e: 'var(--c5)', f: 'var(--c6)', ink: 'var(--ink)', ink2: 'var(--ink2)', ink3: 'var(--ink3)', line: 'var(--line)', line2: 'var(--line2)' };
V.fmt = (x, d = 2) => { if (typeof x !== 'number' || !isFinite(x)) return String(x); const r = Math.round(x * 10 ** d) / 10 ** d; return (Object.is(r, -0) ? 0 : r).toString().replace('-', '−'); };
V.f1 = x => V.fmt(x, 1); V.f2 = x => V.fmt(x, 2);
V.el = function (tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) { if (k === 'style' && typeof attrs[k] === 'object') Object.assign(e.style, attrs[k]); else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]); else if (k === 'html') e.innerHTML = attrs[k]; else if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]); }
  kids.flat().forEach(k => { if (k === null || k === undefined) return; e.appendChild(typeof k === 'string' || typeof k === 'number' ? document.createTextNode(String(k)) : k); });
  return e;
};
V.s = function (tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs || {}) { if (k === 'text') e.textContent = attrs[k]; else if (k === 'style' && typeof attrs[k] === 'object') Object.assign(e.style, attrs[k]); else e.setAttribute(k, attrs[k]); }
  if (parent) parent.appendChild(e);
  return e;
};
V.row = (parent, ...kids) => { const r = V.el('div', { class: 'row' }, ...kids); parent.appendChild(r); return r; };
V.say = (parent, html) => { const d = V.el('div', { class: 'say', html: html || '' }); parent.appendChild(d); return d; };
V.button = (label, fn, cls) => V.el('button', { class: cls || '', onclick: fn, html: label });
V.btns = (parent, list) => { const r = V.row(parent); list.forEach(([l, f, c]) => r.appendChild(V.button(l, f, c))); return r; };
V.slider = function (parent, label, min, max, step, val, fn, fmt) {
  fmt = fmt || (x => V.fmt(x, step < 1 ? (step < 0.1 ? 2 : 1) : 0));
  const out = V.el('span', { class: 'val' }, fmt(val));
  const inp = V.el('input', { type: 'range', min, max, step, value: val });
  const wrap = V.el('label', { class: 'ctl' }, V.el('span', { html: label }), inp, out);
  inp.addEventListener('input', () => { out.textContent = fmt(+inp.value); fn(+inp.value); });
  (parent.classList && parent.classList.contains('row') ? parent : V.row(parent)).appendChild(wrap);
  return { el: wrap, input: inp, get v() { return +inp.value; }, set(v, fire) { inp.value = v; out.textContent = fmt(+inp.value); if (fire) fn(+inp.value); } };
};
V.tabs = function (parent, labels, fn, sel = 0) {
  const t = V.el('div', { class: 'tabs' }); parent.appendChild(t);
  const bs = labels.map((l, i) => { const b = V.button(l, () => { bs.forEach(x => x.classList.remove('sel')); b.classList.add('sel'); fn(i, l); }, 'sm' + (i === sel ? ' sel' : '')); t.appendChild(b); return b; });
  return { el: t, select(i) { bs[i].click(); } };
};
/* step player: steps = count or array; render(i) */
V.stepper = function (parent, n, render, opts = {}) {
  let i = 0, timer = null;
  const bar = V.el('div', { class: 'stepbar' });
  const prev = V.button('→ הקודם', () => go(i - 1));
  const next = V.button('הבא ←', () => go(i + 1), 'primary');
  const play = V.button('▶ נגן', () => toggle(), 'ghost');
  const reset = V.button('↺', () => { stop(); go(0); }, 'ghost');
  const count = V.el('span', { class: 'note-small' });
  bar.append(prev, next, play, reset, count); parent.appendChild(bar);
  function N() { return typeof n === 'function' ? n() : n; }
  function go(j) { j = Math.max(0, Math.min(N() - 1, j)); i = j; render(i); count.textContent = (i + 1) + ' / ' + N(); prev.disabled = i === 0; next.disabled = i === N() - 1; if (i === N() - 1) stop(); }
  function toggle() { if (timer) stop(); else { if (i === N() - 1) go(0); timer = setInterval(() => go(i + 1), opts.speed || 1100); play.textContent = '⏸ עצור'; } }
  function stop() { clearInterval(timer); timer = null; play.textContent = '▶ נגן'; }
  setTimeout(() => go(0), 0);
  return { go, get i() { return i; }, refresh() { go(Math.min(i, N() - 1)); } };
};
/* matrix/array display. data: 2D array of values. returns {cells, set, el} */
V.matrix = function (parent, data, opts = {}) {
  const wrap = V.el('span', { class: 'bracket', style: { margin: '0 4px' } });
  const g = V.el('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(' + (data[0] ? data[0].length : 1) + ', auto)' } });
  wrap.appendChild(g);
  const cells = data.map(r => r.map(v => { const c = V.el('div', { class: 'cell' }, opts.fmt ? opts.fmt(v) : V.fmt(v)); if (opts.w) c.style.minWidth = opts.w + 'px'; g.appendChild(c); return c; }));
  if (parent) parent.appendChild(wrap);
  return {
    el: wrap, cells,
    set(r, c, v, cls) { const e = cells[r][c]; if (v !== undefined) e.textContent = opts.fmt ? opts.fmt(v) : V.fmt(v); if (cls !== undefined) e.className = 'cell ' + cls; },
    cls(fn) { cells.forEach((row, r) => row.forEach((e, c) => { e.className = 'cell ' + (fn(r, c) || ''); })); },
    vals(d) { d.forEach((row, r) => row.forEach((v, c) => { if (cells[r] && cells[r][c]) cells[r][c].textContent = opts.fmt ? opts.fmt(v) : V.fmt(v); })); },
  };
};
V.op = (parent, s) => { const e = V.el('span', { style: { fontSize: '1.4em', color: 'var(--ink2)', margin: '0 4px' } }, s); parent.appendChild(e); return e; };
V.ltrRow = parent => { const r = V.el('div', { class: 'row', style: { direction: 'ltr', justifyContent: 'center' } }); parent.appendChild(r); return r; };

/* 2D coordinate plane */
V.plane = function (parent, opts = {}) {
  const W = opts.w || 420, H = opts.h || 420;
  const xr = opts.x || [-5, 5], yr = opts.y || [-5, 5];
  const svg = V.s('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, style: { maxWidth: '100%', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--line)' } });
  const wrap = V.el('div', { style: { direction: 'ltr', display: 'flex', justifyContent: 'center' } }); wrap.appendChild(svg);
  (parent.appendChild ? parent : parent.el).appendChild(wrap);
  const X = x => (x - xr[0]) / (xr[1] - xr[0]) * W, Y = y => H - (y - yr[0]) / (yr[1] - yr[0]) * H;
  const ux = W / (xr[1] - xr[0]);
  const P = { svg, W, H, X, Y, xr, yr, ux };
  P.inv = (px, py) => [xr[0] + px / W * (xr[1] - xr[0]), yr[0] + (H - py) / H * (yr[1] - yr[0])];
  const gridG = V.s('g', {}, svg), layer = V.s('g', {}, svg), top = V.s('g', {}, svg);
  P.layer = layer; P.top = top;
  P.drawGrid = function (step = 1) {
    gridG.innerHTML = '';
    if (opts.grid === false) return;
    for (let x = Math.ceil(xr[0] / step) * step; x <= xr[1]; x += step) V.s('line', { x1: X(x), y1: 0, x2: X(x), y2: H, style: { stroke: 'var(--line)', strokeWidth: Math.abs(x) < 1e-9 ? 0 : 1 } }, gridG);
    for (let y = Math.ceil(yr[0] / step) * step; y <= yr[1]; y += step) V.s('line', { x1: 0, y1: Y(y), x2: W, y2: Y(y), style: { stroke: 'var(--line)', strokeWidth: 1 } }, gridG);
    if (opts.axes !== false) {
      V.s('line', { x1: 0, y1: Y(0), x2: W, y2: Y(0), style: { stroke: 'var(--ink3)', strokeWidth: 1.5 } }, gridG);
      V.s('line', { x1: X(0), y1: 0, x2: X(0), y2: H, style: { stroke: 'var(--ink3)', strokeWidth: 1.5 } }, gridG);
      if (opts.labels !== false) {
        for (let x = Math.ceil(xr[0]); x <= xr[1]; x += (opts.labelStep || Math.max(1, Math.round((xr[1] - xr[0]) / 10)))) if (x) V.s('text', { x: X(x), y: Y(0) + 14, 'text-anchor': 'middle', 'font-size': 10, style: { fill: 'var(--ink3)' }, text: String(x).replace('-', '−') }, gridG);
        for (let y = Math.ceil(yr[0]); y <= yr[1]; y += (opts.labelStep || Math.max(1, Math.round((yr[1] - yr[0]) / 10)))) if (y) V.s('text', { x: X(0) - 6, y: Y(y) + 4, 'text-anchor': 'end', 'font-size': 10, style: { fill: 'var(--ink3)' }, text: String(y).replace('-', '−') }, gridG);
      }
    }
  };
  P.drawGrid(opts.step || 1);
  P.clear = () => { layer.innerHTML = ''; };
  P.line = (x1, y1, x2, y2, color = V.C.ink2, w = 2, dash, g = layer) => V.s('line', { x1: X(x1), y1: Y(y1), x2: X(x2), y2: Y(y2), style: { stroke: color, strokeWidth: w, strokeDasharray: dash || '' }, 'stroke-linecap': 'round' }, g);
  P.arrow = function (x1, y1, x2, y2, color = V.C.a, w = 3, label, g = layer) {
    const px1 = X(x1), py1 = Y(y1), px2 = X(x2), py2 = Y(y2);
    const ang = Math.atan2(py2 - py1, px2 - px1), L = Math.hypot(px2 - px1, py2 - py1);
    const hs = Math.min(12, L * 0.45);
    const grp = V.s('g', {}, g);
    V.s('line', { x1: px1, y1: py1, x2: px2 - Math.cos(ang) * hs * 0.6, y2: py2 - Math.sin(ang) * hs * 0.6, style: { stroke: color, strokeWidth: w }, 'stroke-linecap': 'round' }, grp);
    if (L > 2) V.s('path', { d: `M${px2},${py2} L${px2 - hs * Math.cos(ang - 0.42)},${py2 - hs * Math.sin(ang - 0.42)} L${px2 - hs * Math.cos(ang + 0.42)},${py2 - hs * Math.sin(ang + 0.42)} Z`, style: { fill: color } }, grp);
    if (label) V.s('text', { x: px2 + 8 * Math.cos(ang) + 4, y: py2 + 8 * Math.sin(ang) - 4, 'font-size': 14, 'font-weight': 700, style: { fill: color }, text: label }, grp);
    return grp;
  };
  P.poly = (pts, fill, stroke, op = 0.25, g = layer) => V.s('polygon', { points: pts.map(p => X(p[0]) + ',' + Y(p[1])).join(' '), style: { fill: fill || 'none', fillOpacity: op, stroke: stroke || fill || 'none', strokeWidth: 2 } }, g);
  P.path = (pts, color = V.C.a, w = 2.5, dash, g = layer) => !pts.length ? V.s('g', {}, g) : V.s('path', { d: 'M' + pts.map(p => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' L'), style: { fill: 'none', stroke: color, strokeWidth: w, strokeDasharray: dash || '' }, 'stroke-linejoin': 'round' }, g);
  P.dot = (x, y, r = 5, color = V.C.a, g = layer) => V.s('circle', { cx: X(x), cy: Y(y), r, style: { fill: color } }, g);
  P.text = (x, y, t, color = V.C.ink, size = 13, anchor = 'middle', g = layer) => V.s('text', { x: X(x), y: Y(y), 'text-anchor': anchor, 'font-size': size, style: { fill: color }, text: t }, g);
  P.fn = (f, color = V.C.a, w = 2.5, n = 240, from = xr[0], to = xr[1], g = layer) => { const pts = []; for (let i = 0; i <= n; i++) { const x = from + (to - from) * i / n; const y = f(x); if (isFinite(y) && y > yr[0] - 50 && y < yr[1] + 50) pts.push([x, Math.max(yr[0] - 5, Math.min(yr[1] + 5, y))]); else if (pts.length) { P.path(pts.splice(0), color, w, null, g); } } if (pts.length) P.path(pts, color, w, null, g); };
  /* draggable handle in data coordinates. snap: grid step or null. onMove(x,y) */
  P.handle = function (x, y, color, onMove, opts2 = {}) {
    const c = V.s('circle', { cx: X(x), cy: Y(y), r: opts2.r || 9, style: { fill: color, fillOpacity: 0.85, stroke: '#fff', strokeWidth: 2, cursor: 'grab' } }, top);
    const h = { x, y, el: c };
    let drag = false;
    const pt = e => { const r = svg.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return P.inv((t.clientX - r.left) / r.width * W, (t.clientY - r.top) / r.height * H); };
    const down = e => { drag = true; e.preventDefault(); c.style.cursor = 'grabbing'; };
    const move = e => {
      if (!drag) return; let [nx, ny] = pt(e);
      const sn = opts2.snap === undefined ? 0.5 : opts2.snap; if (sn) { nx = Math.round(nx / sn) * sn; ny = Math.round(ny / sn) * sn; }
      nx = Math.max(xr[0], Math.min(xr[1], nx)); ny = Math.max(yr[0], Math.min(yr[1], ny));
      if (opts2.lockY) ny = h.y; if (opts2.lockX) nx = h.x;
      h.set(nx, ny); onMove && onMove(nx, ny);
    };
    const up = () => { drag = false; c.style.cursor = 'grab'; };
    c.addEventListener('mousedown', down); c.addEventListener('touchstart', down, { passive: false });
    window.addEventListener('mousemove', move); window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('mouseup', up); window.addEventListener('touchend', up);
    h.set = (nx, ny) => { h.x = nx; h.y = ny; c.setAttribute('cx', X(nx)); c.setAttribute('cy', Y(ny)); };
    return h;
  };
  return P;
};
V.legend = (parent, items) => { const d = V.el('div', { class: 'legend' }); items.forEach(([c, t]) => d.appendChild(V.el('span', { html: `<i style="background:${c}"></i>${t}` }))); parent.appendChild(d); return d; };

/* ---------- tiny linear algebra ---------- */
V.mul2 = (M, v) => [M[0][0] * v[0] + M[0][1] * v[1], M[1][0] * v[0] + M[1][1] * v[1]];
V.mm = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));
V.mv = (A, v) => A.map(r => r.reduce((s, a, k) => s + a * v[k], 0));
V.det2 = M => M[0][0] * M[1][1] - M[0][1] * M[1][0];
V.T = A => A[0].map((_, j) => A.map(r => r[j]));
V.rot = d => { const t = d * Math.PI / 180; return [[Math.cos(t), -Math.sin(t)], [Math.sin(t), Math.cos(t)]]; };
V.randn = (() => { let s = 1234567; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; return () => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }; })();
V.rng = seed => { let s = seed || 42; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
/* 3x3 homography from 4 point pairs (DLT, solved by Gaussian elimination with h33 = 1) */
V.homography = function (src, dst) {
  const A = [], b = [];
  for (let i = 0; i < 4; i++) { const [x, y] = src[i], [u, v] = dst[i]; A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u); A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v); }
  const h = V.solve(A, b); if (!h) return null; return [[h[0], h[1], h[2]], [h[3], h[4], h[5]], [h[6], h[7], 1]];
};
V.solve = function (A, b) {
  const n = A.length; const M = A.map((r, i) => r.concat([b[i]]));
  for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; if (Math.abs(M[p][c]) < 1e-12) return null; [M[c], M[p]] = [M[p], M[c]]; for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; } }
  return M.map((r, i) => r[n] / r[i]);
};
V.applyH = (H, p) => { const w = H[2][0] * p[0] + H[2][1] * p[1] + H[2][2]; return [(H[0][0] * p[0] + H[0][1] * p[1] + H[0][2]) / w, (H[1][0] * p[0] + H[1][1] * p[1] + H[1][2]) / w, w]; };
/* symmetric eigen (Jacobi) — used for SVD of small images */
V.svd = function (A) {
  const m = A.length, n = A[0].length;
  const AtA = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => { let s = 0; for (let k = 0; k < m; k++) s += A[k][i] * A[k][j]; return s; }));
  const Vm = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  const S = AtA;
  for (let sweep = 0; sweep < 12; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      off += S[p][q] * S[p][q]; if (Math.abs(S[p][q]) < 1e-9) continue;
      const th = (S[q][q] - S[p][p]) / (2 * S[p][q]); const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)); const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const a = S[k][p], b = S[k][q]; S[k][p] = c * a - s * b; S[k][q] = s * a + c * b; }
      for (let k = 0; k < n; k++) { const a = S[p][k], b = S[q][k]; S[p][k] = c * a - s * b; S[q][k] = s * a + c * b; }
      for (let k = 0; k < n; k++) { const a = Vm[k][p], b = Vm[k][q]; Vm[k][p] = c * a - s * b; Vm[k][q] = s * a + c * b; }
    }
    if (off < 1e-10) break;
  }
  const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => S[b][b] - S[a][a]);
  const sv = idx.map(i => Math.sqrt(Math.max(0, S[i][i])));
  const Vt = idx.map(i => Vm.map(r => r[i]));
  const U = idx.map((i, k) => { const v = Vt[k]; const u = A.map(r => r.reduce((s, a, j) => s + a * v[j], 0) / (sv[k] || 1)); return u; });
  return { U, s: sv, Vt };
};

/* ---------- images ---------- */
V.canvas = (parent, w, h, scale = 1) => { const c = V.el('canvas', { width: w, height: h }); c.style.width = (w * scale) + 'px'; parent.appendChild(c); return c; };
V.drawGray = (cv, G) => { const h = G.length, w = G[0].length; cv.width = w; cv.height = h; const ctx = cv.getContext('2d'); const im = ctx.createImageData(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = Math.max(0, Math.min(255, G[y][x])); const i = (y * w + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } ctx.putImageData(im, 0, 0); };
V.drawRGB = (cv, R) => { const h = R.length, w = R[0].length; cv.width = w; cv.height = h; const ctx = cv.getContext('2d'); const im = ctx.createImageData(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; const p = R[y][x]; im.data[i] = p[0]; im.data[i + 1] = p[1]; im.data[i + 2] = p[2]; im.data[i + 3] = 255; } ctx.putImageData(im, 0, 0); };
/* a little procedural scene: sky gradient, sun, house, road — handy for filters & edges */
V.scene = function (w = 96, h = 72) {
  const G = [];
  for (let y = 0; y < h; y++) { const r = []; for (let x = 0; x < w; x++) {
    let v = 200 - y * 1.1;                                  // sky
    if ((x - w * 0.78) ** 2 + (y - h * 0.22) ** 2 < (h * 0.12) ** 2) v = 245;   // sun
    if (y > h * 0.62) v = 90 + ((x + y) % 7 === 0 ? 10 : 0);  // ground
    if (x > w * 0.18 && x < w * 0.48 && y > h * 0.38 && y < h * 0.8) v = 150;   // house
    if (y > h * 0.2 && y < h * 0.4 && Math.abs(x - w * 0.33) < (y - h * 0.2) * 0.85) v = 60;  // roof
    if (x > w * 0.28 && x < w * 0.36 && y > h * 0.6 && y < h * 0.8) v = 40;   // door
    if (x > w * 0.21 && x < w * 0.26 && y > h * 0.45 && y < h * 0.53) v = 230;  // window
    r.push(v); } G.push(r); }
  return G;
};
V.addNoise = (G, kind, amt, seed = 7) => { const rnd = V.rng(seed); return G.map(r => r.map(v => { if (kind === 'sp') { const u = rnd(); return u < amt / 2 ? 0 : u < amt ? 255 : v; } return v + (rnd() + rnd() + rnd() - 1.5) * amt * 2; })); };
V.conv = function (G, K, mode = 'same') {
  const h = G.length, w = G[0].length, kh = K.length, kw = K[0].length, oy = Math.floor(kh / 2), ox = Math.floor(kw / 2);
  const out = [];
  for (let y = 0; y < h; y++) { const r = []; for (let x = 0; x < w; x++) { let s = 0; for (let i = 0; i < kh; i++) for (let j = 0; j < kw; j++) { const yy = Math.min(h - 1, Math.max(0, y + i - oy)), xx = Math.min(w - 1, Math.max(0, x + j - ox)); s += G[yy][xx] * K[i][j]; } r.push(s); } out.push(r); }
  return out;
};
V.median = function (G, k = 3) {
  const h = G.length, w = G[0].length, o = Math.floor(k / 2);
  return G.map((r, y) => r.map((_, x) => { const a = []; for (let i = -o; i <= o; i++) for (let j = -o; j <= o; j++) a.push(G[Math.min(h - 1, Math.max(0, y + i))][Math.min(w - 1, Math.max(0, x + j))]); a.sort((p, q) => p - q); return a[a.length >> 1]; }));
};
/* render tex in a widget */
V.tex = (parent, src, display) => { const d = V.el('div', { class: 'ltr', style: { textAlign: 'center' }, html: window.texHTML ? window.texHTML(src, display !== false) : src }); parent.appendChild(d); return d; };
V.texInline = src => window.texHTML ? window.texHTML(src, false) : src;
/* simple quiz used inside widgets: choices -> feedback */
V.quiz = function (parent, q, choices, correct, explain) {
  const box = V.el('div', { class: 'say' }); parent.appendChild(box);
  box.innerHTML = '<div style="margin-bottom:6px">' + q + '</div>';
  const r = V.el('div', { class: 'row' }); box.appendChild(r);
  const fb = V.el('div', { style: { marginTop: '6px' } }); box.appendChild(fb);
  choices.forEach((c, i) => r.appendChild(V.button(c, () => { fb.innerHTML = i === correct ? '<span class="good">✓ נכון! </span>' + (explain || '') : '<span class="bad">✗ לא בדיוק. </span>נסה שוב.'; }, 'sm')));
  return box;
};
/* number input check */
V.ask = function (parent, q, check, ok, bad) {
  const box = V.el('div', { class: 'say' }); parent.appendChild(box);
  const inp = V.el('input', { style: { width: '160px', direction: 'ltr' }, placeholder: 'התשובה שלך' });
  const fb = V.el('span', { style: { marginRight: '8px' } });
  const go = () => { const v = inp.value.trim(); if (!v) { fb.innerHTML = '<span class="err">כתוב תשובה קודם</span>'; return; } const r = check(v); fb.innerHTML = r ? '<span class="good">✓ ' + (ok || 'נכון!') + '</span>' : '<span class="bad">✗ ' + (bad || 'עוד לא. נסה שוב או קח רמז.') + '</span>'; };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }); inp.addEventListener('input', () => fb.innerHTML = '');
  box.append(V.el('div', { html: q, style: { marginBottom: '6px' } }), inp, ' ', V.button('בדוק', go, 'sm primary'), fb);
  return box;
};
V.nums = s => (s.match(/-?\d+(\.\d+)?/g) || []).map(Number);
window.V = V;
window.W = window.W || {}; window.LAYER = window.LAYER || {}; window.CONTENT = window.CONTENT || {};
})();
