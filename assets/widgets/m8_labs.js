/* Module 8 — the final project: a synthetic drone world (map, roads, cars, trees, shadow, a false-positive shed),
   a camera that flies over it, and a scripted "system" (detector, tracker, geolocation) in two behaviours:
   naive (what a first attempt does) and required (what the project must reach). Everything here is a DEPICTION of
   behaviour for the brief — not an implementation the learner can copy. */
(function () {
const { F, flex, colm, row, clamp } = window.D4;
const W = window.W, V = window.V, el = V.el, K0 = window.K0, D4 = window.D4;
const TAU = Math.PI * 2;
/* ---------------- the world (meters, x east, y north, origin at the junction area) ---------------- */
const WX0 = -200, WX1 = 200, WY0 = -130, WY1 = 130, MPP = 0.5, MW = 800, MH = 520;
const mx = x => (x - WX0) / MPP, my = y => (WY1 - y) / MPP;
const TREES = []; for (let x = -74; x <= -26; x += 8) TREES.push([x, 6.5, 6]); for (let x = -150; x <= -100; x += 10) TREES.push([x, -40, 7]); [[80, 90, 9], [-20, -90, 8], [160, -70, 9], [-170, 90, 8]].forEach(t => TREES.push(t));
const SHADOW = [[92, 17], [128, 17], [146, -14], [110, -14]];
const BUILDING = [[95, 17], [125, 17], [125, 37], [95, 37]];
const SHED = { x: 152, y: 46, l: 6, w: 2.4, a: 0.3 };
const ORIGIN = { lat: 31.25, lon: 34.79 };   /* a demonstration origin for the map — any point would do */
const toLL = (x, y) => [ORIGIN.lat + y / 111320, ORIGIN.lon + x / (111320 * Math.cos(ORIGIN.lat * Math.PI / 180))];
const LANES = { E: { a: [-200, -3.5], b: [200, -3.5] }, Wb: { a: [200, 3.5], b: [-200, 3.5] }, N: { a: [43.5, -130], b: [43.5, 130] }, S: { a: [36.5, 130], b: [36.5, -130] } };
const CARS = [
  { id: 'A', lane: 'E', v: 12, off: 0, col: '#c92a2a' }, { id: 'B', lane: 'E', v: 9, off: 175, col: '#f1f3f5' },
  { id: 'C', lane: 'Wb', v: 11, off: 60, col: '#1c4e9e' }, { id: 'D', lane: 'Wb', v: 13, off: 250, col: '#212529' },
  { id: 'E', lane: 'N', v: 10, off: 184, col: '#e0b000' }, { id: 'F', lane: 'S', v: 8, off: 90, col: '#adb5bd' },
  { id: 'G', park: [-126, 58, 0], col: '#f8f9fa' }, { id: 'H', park: [-118, 58, 0], col: '#5f3dc4' }, { id: 'I', park: [-110, 64, 3.1416], col: '#868e96' }];
function carAt(c, t) { if (c.park) return { x: c.park[0], y: c.park[1], h: c.park[2] + Math.PI / 2 }; const L = LANES[c.lane]; const len = Math.hypot(L.b[0] - L.a[0], L.b[1] - L.a[1]); const s = ((c.off + c.v * t) % len + len) % len; const ux = (L.b[0] - L.a[0]) / len, uy = (L.b[1] - L.a[1]) / len; return { x: L.a[0] + ux * s, y: L.a[1] + uy * s, h: Math.atan2(uy, ux) }; }
const inPoly = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const underTree = (x, y) => TREES.some(([tx, ty, r]) => Math.hypot(x - tx, y - ty) < r - 0.3);
/* base map: drawn once */
let BASE = null;
function baseMap() { if (BASE) return BASE; const cv = document.createElement('canvas'); cv.width = MW; cv.height = MH; const x = cv.getContext('2d'); let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  x.fillStyle = '#6b8e4e'; x.fillRect(0, 0, MW, MH); for (let i = 0; i < 2600; i++) { x.fillStyle = rnd() < 0.5 ? 'rgba(80,110,55,.5)' : 'rgba(120,150,85,.45)'; x.fillRect(rnd() * MW, rnd() * MH, 2 + rnd() * 5, 2 + rnd() * 5); }
  x.fillStyle = '#c2a878'; x.fillRect(mx(-200), my(-60), 120 / MPP, 70 / MPP); for (let i = 0; i < 14; i++) { x.strokeStyle = 'rgba(150,120,80,.6)'; x.beginPath(); x.moveTo(mx(-200), my(-60 - i * 5)); x.lineTo(mx(-80), my(-60 - i * 5)); x.stroke(); }
  const road = (x0, y0, x1, y1, w) => { x.strokeStyle = '#55595c'; x.lineWidth = w / MPP; x.beginPath(); x.moveTo(mx(x0), my(y0)); x.lineTo(mx(x1), my(y1)); x.stroke(); };
  road(-200, 0, 200, 0, 14); road(40, -130, 40, 130, 14); x.fillStyle = '#5c6063'; x.fillRect(mx(-140), my(72), 44 / MPP, 24 / MPP); road(-118, 48, -118, 6, 7);
  x.setLineDash([6, 8]); x.strokeStyle = '#f1f3f5'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(0, my(0)); x.lineTo(mx(32), my(0)); x.moveTo(mx(48), my(0)); x.lineTo(MW, my(0)); x.moveTo(mx(40), 0); x.lineTo(mx(40), my(8)); x.moveTo(mx(40), my(-8)); x.lineTo(mx(40), MH); x.stroke(); x.setLineDash([]);
  x.strokeStyle = '#e9ecef'; x.lineWidth = 1; for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(mx(-138 + i * 5), my(72)); x.lineTo(mx(-138 + i * 5), my(64)); x.stroke(); }
  x.fillStyle = '#8d6e63'; x.beginPath(); BUILDING.forEach(([a, b], i) => i ? x.lineTo(mx(a), my(b)) : x.moveTo(mx(a), my(b))); x.fill(); x.fillStyle = '#a1887f'; x.fillRect(mx(97), my(35), 26 / MPP, 16 / MPP);
  x.fillStyle = '#d7d2c8'; x.beginPath(); x.ellipse(mx(-60), my(-100), 18 / MPP, 12 / MPP, 0, 0, TAU); x.fill();
  BASE = cv; return cv; }
/* the dynamic ground for one instant: base + cars + shed + shadow + tree canopies (canopies last: they hide cars) */
let GND = null, GCTX = null;
function ground(t, light) { if (!GND) { GND = document.createElement('canvas'); GND.width = MW; GND.height = MH; GCTX = GND.getContext('2d', { willReadFrequently: true }); } const x = GCTX; x.drawImage(baseMap(), 0, 0);
  const rect = (cx, cy, l, w, a, col) => { x.save(); x.translate(mx(cx), my(cy)); x.rotate(-a); x.fillStyle = col; x.fillRect(-l / 2 / MPP, -w / 2 / MPP, l / MPP, w / MPP); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(l / 2 / MPP * 0.15, -w / 2 / MPP, l / MPP * 0.22, w / MPP); x.restore(); };
  rect(SHED.x, SHED.y, SHED.l, SHED.w, SHED.a, '#dee2e6');
  CARS.forEach(c => { const p = carAt(c, t); rect(p.x, p.y, 4.6, 1.9, p.h, c.col); });
  x.fillStyle = 'rgba(10,20,30,.55)'; x.beginPath(); SHADOW.forEach(([a, b], i) => i ? x.lineTo(mx(a), my(b)) : x.moveTo(mx(a), my(b))); x.fill();
  TREES.forEach(([a, b, r]) => { x.fillStyle = '#2f5d2a'; x.beginPath(); x.arc(mx(a), my(b), r / MPP, 0, TAU); x.fill(); x.fillStyle = 'rgba(90,140,70,.6)'; x.beginPath(); x.arc(mx(a) - r * 0.5, my(b) - r * 0.5, r / MPP * 0.5, 0, TAU); x.fill(); });
  if (light && light !== 1) { x.fillStyle = 'rgba(0,0,0,' + (1 - light) + ')'; x.fillRect(0, 0, MW, MH); }
  return x.getImageData(0, 0, MW, MH).data; }
/* ---------------- the camera ---------------- */
const IW = 400, IH = 250, FOV = 70 * Math.PI / 180, FL = (IW / 2) / Math.tan(FOV / 2);
function axes(P) { const hx = Math.cos(P.yaw), hy = Math.sin(P.yaw); const z = [Math.sin(P.tilt) * hx, Math.sin(P.tilt) * hy, -Math.cos(P.tilt)]; const xr = [hy, -hx, 0]; const y = [z[1] * xr[2] - z[2] * xr[1], z[2] * xr[0] - z[0] * xr[2], z[0] * xr[1] - z[1] * xr[0]]; return { x: xr, y, z }; }
function project(P, A, X, Y) { const d = [X - P.x, Y - P.y, -P.h]; const zc = d[0] * A.z[0] + d[1] * A.z[1] + d[2] * A.z[2]; if (zc <= 0.1) return null; return [IW / 2 + FL * (d[0] * A.x[0] + d[1] * A.x[1] + d[2] * A.x[2]) / zc, IH / 2 + FL * (d[0] * A.y[0] + d[1] * A.y[1] + d[2] * A.y[2]) / zc]; }
function unproject(P, A, u, v) { const a = (u - IW / 2) / FL, b = (v - IH / 2) / FL; const d = [A.x[0] * a + A.y[0] * b + A.z[0], A.x[1] * a + A.y[1] * b + A.z[1], A.x[2] * a + A.y[2] * b + A.z[2]]; if (d[2] >= -1e-6) return null; const s = -P.h / d[2]; return [P.x + s * d[0], P.y + s * d[1]]; }
/* what a naive geolocation does: assumes the camera looks straight down (meters per pixel = h / f, rotated by yaw) */
function naiveGeo(P, u, v) { const s = P.h / FL; const a = (u - IW / 2) * s, b = (v - IH / 2) * s; const hx = Math.cos(P.yaw), hy = Math.sin(P.yaw); return [P.x + a * hy - b * hx, P.y - a * hx - b * hy]; }
function render(ctx, P, G) { const A = axes(P); const img = ctx.createImageData(IW, IH); const o = img.data; for (let v = 0; v < IH; v++) for (let u = 0; u < IW; u++) { const k = 4 * (v * IW + u); const g = unproject(P, A, u, v); if (!g) { o[k] = 170; o[k + 1] = 200; o[k + 2] = 230; o[k + 3] = 255; continue; } const px = Math.floor((g[0] - WX0) / MPP), py = Math.floor((WY1 - g[1]) / MPP); if (px < 0 || py < 0 || px >= MW || py >= MH) { o[k] = 70; o[k + 1] = 95; o[k + 2] = 55; o[k + 3] = 255; continue; } const q = 4 * (py * MW + px); o[k] = G[q]; o[k + 1] = G[q + 1]; o[k + 2] = G[q + 2]; o[k + 3] = 255; } ctx.putImageData(img, 0, 0); return A; }
/* ---------------- scenarios ---------------- */
const hover = (x, y, h, yaw, tilt) => () => ({ x, y, h, yaw: yaw == null ? Math.PI / 2 : yaw, tilt: tilt || 0 });
const SC = {
  tour: { name: 'סיור מלא', pose: t => ({ x: -150 + 5 * t, y: -6 + 10 * Math.sin(t / 9), h: 115, yaw: Math.PI / 2, tilt: 0.18 }), T: 60, ev: [[6, 'חניון: רכבים חונים'], [19, 'שורת עצים'], [37, 'צומת'], [51, 'צל של מבנה'], [58, 'מכולה על הדשא']] },
  occl: { name: 'הסתרה מתחת לעצים', pose: hover(-50, 2, 75), T: 12, t0: 12, ev: [[15.1, 'רכב C נכנס לשורת העצים'], [20, 'יוצא — אותו רכב?']], focus: 'C' },
  cross: { name: 'שני רכבים חוצים', pose: hover(40, 0, 70), T: 10, t0: 16, ev: [[20.3, 'A ו־E נפגשים בצומת']], focus: 'E' },
  shadow: { name: 'כניסה לצל', pose: hover(115, 2, 85), T: 10, t0: 22, ev: [[25.4, 'רכב A נכנס לצל המבנה'], [28.4, 'יוצא']], focus: 'A' },
  yaw: { name: 'הרחפן מסתובב', pose: t => ({ x: 40, y: 0, h: 100, yaw: Math.PI / 2 + (t < 4 ? 0 : t < 5.2 ? (t - 4) / 1.2 * Math.PI / 2 : Math.PI / 2), tilt: 0 }), T: 9, t0: 0, ev: [[4, 'סיבוב של 90° בשנייה וחצי']] },
  climb: { name: 'הרחפן מטפס', pose: t => ({ x: 20, y: 0, h: 70 + 22 * t, yaw: Math.PI / 2, tilt: 0 }), T: 9, t0: 0, ev: [[0, 'גובה 70 מטר'], [8.5, 'גובה 260 מטר — רכב הוא כמה פיקסלים']] },
  exit: { name: 'רכב יוצא מהתמונה וחוזר', pose: t => ({ x: -118 + (t < 2 ? 0 : t < 6 ? (t - 2) * 18 : t < 8 ? 72 : t < 12 ? 72 - (t - 8) * 18 : 0), y: 58, h: 60, yaw: Math.PI / 2, tilt: 0 }), T: 14, t0: 0, ev: [[2, 'הרחפן זז מזרחה — החניון יוצא מהתמונה'], [8, 'וחוזר']] },
  fp: { name: 'זיהוי שווא', pose: hover(150, 40, 70), T: 10, t0: 0, ev: [[0, 'מכולה בגודל של רכב, על הדשא']] },
  lag: { name: 'סימונים שלא מסונכרנים', pose: hover(30, 0, 90), T: 20, t0: 8, ev: [[8, 'המנוע מדלג על פריימים']] },
  tilt: { name: 'מצלמה מוטה', pose: hover(30, -95, 80, Math.PI / 2, 0.95), T: 20, t0: 14, ev: [[14, 'הטיה של 54° — האופק כמעט בתמונה']] } };
/* deterministic noise */
const hsh = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const FPS = 15;
/* precompute a scenario: per frame, per car — box, flags, detections and IDs under both behaviours */
function build(key) { const S = SC[key]; const t0 = S.t0 || 0; const N = Math.round(S.T * FPS); const fr = [];
  for (let f = 0; f < N; f++) { const t = t0 + f / FPS, P = S.pose(t - t0), A = axes(P); const cars = CARS.map((c, ci) => { const p = carAt(c, t); const co = [[2.3, 0.95], [2.3, -0.95], [-2.3, -0.95], [-2.3, 0.95]].map(([a, b]) => project(P, A, p.x + a * Math.cos(p.h) - b * Math.sin(p.h), p.y + a * Math.sin(p.h) + b * Math.cos(p.h))); if (co.some(q => !q)) return { c, p, vis: false };
      const us = co.map(q => q[0]), vs = co.map(q => q[1]); const b = [Math.min(...us), Math.min(...vs), Math.max(...us), Math.max(...vs)]; const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2; const vis = cx > 2 && cy > 2 && cx < IW - 2 && cy < IH - 2; const occ = underTree(p.x, p.y), shd = inPoly(SHADOW, p.x, p.y), sz = Math.max(b[2] - b[0], b[3] - b[1]), small = sz < 9;
      const r1 = hsh(f, ci), r2 = hsh(f + 977, ci); const detReq = vis && !occ && r1 < (small ? 0.9 : 0.98); const detNv = vis && !occ && r2 < (shd ? 0.25 : small ? 0.3 : 0.97); const jit = () => (hsh(f * 7 + 3, ci * 13) - 0.5) * 1.6;
      return { c, ci, p, vis, occ, shd, small, sz, b: b.map(v => v + jit()), cx, cy }; });
    const sc = project(P, A, SHED.x, SHED.y); fr.push({ t, P, cars, shed: sc && sc[0] > 0 && sc[1] > 0 && sc[0] < IW && sc[1] < IH ? sc : null, A }); }
  /* required: one stable ID per car (numbered by first appearance), predicted through occlusion for up to 3 s */
  const reqId = {}; let nR = 0; const lastSeen = {};
  /* naive: image-space nearest neighbour with a 6-pixel gate, no prediction, no camera-motion compensation, no re-identification */
  const nvId = {}; let nN = 0; const nvPrev = {}; const missRun = {};
  fr.forEach((F0, f) => { F0.cars.forEach(k => { if (!k.vis) return; const r1 = hsh(f, k.ci), r2 = hsh(f + 977, k.ci); k.dR = !k.occ && r1 < (k.small ? 0.9 : 0.98); k.dN = !k.occ && r2 < (k.shd ? 0.25 : k.sz < 6 ? 0.2 : k.small ? 0.6 : 0.97);
      if (k.dR) { if (!reqId[k.c.id]) reqId[k.c.id] = ++nR; lastSeen[k.c.id] = f; } k.idR = reqId[k.c.id] && f - (lastSeen[k.c.id] ?? -1e9) <= 45 ? reqId[k.c.id] : (reqId[k.c.id] && k.dR ? reqId[k.c.id] : null); k.predR = k.idR && !k.dR;
      if (k.dN) { const pv = nvPrev[k.c.id]; const jump = pv ? Math.hypot(k.cx - pv[0], k.cy - pv[1]) : 1e9; if (!nvId[k.c.id] || (missRun[k.c.id] || 0) >= 3 || (pv && jump > 6 + 1.2 * (missRun[k.c.id] || 0) * 3)) nvId[k.c.id] = ++nN; nvPrev[k.c.id] = [k.cx, k.cy]; missRun[k.c.id] = 0; k.idN = nvId[k.c.id]; } else { missRun[k.c.id] = (missRun[k.c.id] || 0) + 1; k.idN = null; } });
    /* naive swap: two detected boxes that overlap trade identities */
    const d = F0.cars.filter(k => k.vis && k.dN); for (let i = 0; i < d.length; i++) for (let j = i + 1; j < d.length; j++) { const a = d[i], b = d[j]; const close = Math.hypot(a.cx - b.cx, a.cy - b.cy) < 9; const key2 = a.c.id + b.c.id; F0.close = F0.close || {}; if (close && !(fr[f - 1] && fr[f - 1].close && fr[f - 1].close[key2])) { const tmp = nvId[a.c.id]; nvId[a.c.id] = nvId[b.c.id]; nvId[b.c.id] = tmp; a.idN = nvId[a.c.id]; b.idN = nvId[b.c.id]; F0.swap = true; } if (close) F0.close[key2] = 1; } });
  return { key, S, fr, N, nR, nN }; }
/* ---------------- the player: camera + map + overlays ---------------- */
const ACC = { req: '#2f9e44', nv: '#e8590c' };
function player(box, o) { o = Object.assign({ sc: 'tour', mode: 'req', layers: { det: true, trk: true, geo: true }, compare: false, map: false, info: true }, o);
  let B = build(o.sc), f = 0, play = true, timer = null, mode = o.mode; const L = Object.assign({}, o.layers);
  const top = row(box); const bp = el('button', { class: 'primary', html: '⏸' }); bp.onclick = () => { play = !play; bp.textContent = play ? '⏸' : '▶'; }; top.appendChild(bp);
  const sl = el('input', { type: 'range', min: 0, max: B.N - 1, value: 0, style: 'flex:1;min-width:240px' }); sl.oninput = () => { f = +sl.value; play = false; bp.textContent = '▶'; draw(); }; top.appendChild(sl); const tl = el('span', { class: 'note-small', style: 'min-width:70px' }); top.appendChild(tl);
  const lr = row(box); [['det', 'זיהויים'], ['trk', 'מסלולים, מספרים ומהירות']].concat(o.map ? [['geo', 'מיקום על המפה']] : []).forEach(([k, n]) => { const l = el('label', { class: 'ctl' }); const cb = el('input', { type: 'checkbox' }); cb.checked = !!L[k]; cb.onchange = () => { L[k] = cb.checked; draw(); }; l.appendChild(cb); l.appendChild(el('span', { html: n })); lr.appendChild(l); });
  if (o.compare) V.tabs(lr, ['המערכת הנדרשת', 'ניסיון ראשון נאיבי'], i => { mode = i ? 'nv' : 'req'; draw(); }, mode === 'nv' ? 1 : 0);
  const fx = flex(box); const cv = D4.canvas(colm(fx, 'מה הרחפן רואה'), IW, IH); const cx = cv.getContext('2d'); let mc = null, mctx = null; if (o.map) { mc = D4.canvas(colm(fx, 'המפה (מלמעלה, צפון למעלה)'), 320, 208); mctx = mc.getContext('2d'); }
  const evs = el('div', { class: 'note-small', style: 'min-height:1.4em;margin:4px 0' }); box.appendChild(evs); const info = el('div'); if (o.info) box.appendChild(info);
  const trailR = {}, trailM = {};
  function draw() { const F0 = B.fr[f]; const G = ground(F0.t, 1); const A = render(cx, F0.P, G); const col = mode === 'req' ? ACC.req : ACC.nv;
    if (mode === 'nv' && o.sc === 'lag') { /* stale overlays: the system draws what it computed many frames ago */ }
    const lagF = o.sc === 'lag' ? (mode === 'nv' ? Math.min(f, Math.floor(f * 0.6)) : Math.max(0, f - 1)) : f; const Fo = B.fr[lagF];
    /* the speed in the label: required = the true speed; naive = what 'metres per pixel = height / focal' gives over half a second */
    const spT = k => { if (mode === 'req') return k.c.park ? 'עומד' : Math.round(k.c.v * 3.6 + (hsh(f, k.ci) - 0.5) * 2) + ' קמ״ש'; const f0 = Math.max(0, lagF - 15); const q = B.fr[f0].cars.find(z => z.c.id === k.c.id); if (!q || !q.vis || lagF - f0 < 5) return '…'; const a = naiveGeo(B.fr[f0].P, (q.b[0] + q.b[2]) / 2, (q.b[1] + q.b[3]) / 2), b = naiveGeo(Fo.P, (k.b[0] + k.b[2]) / 2, (k.b[1] + k.b[3]) / 2); if (!a || !b) return '…'; const v = Math.hypot(b[0] - a[0], b[1] - a[1]) / ((lagF - f0) / FPS) * 3.6; return v < 9 ? 'עומד' : Math.round(v) + ' קמ״ש'; };
    Fo.cars.forEach(k => { if (!k.vis) return; const id = mode === 'req' ? k.idR : k.idN, det = mode === 'req' ? k.dR : k.dN; const pred = mode === 'req' && k.predR;
      if (L.det && det) { cx.strokeStyle = col; cx.lineWidth = 1.6; cx.strokeRect(k.b[0] - 1.5, k.b[1] - 1.5, k.b[2] - k.b[0] + 3, k.b[3] - k.b[1] + 3); }
      if (L.trk && pred) { cx.setLineDash([3, 3]); cx.strokeStyle = col; cx.lineWidth = 1.2; cx.strokeRect(k.b[0] - 1.5, k.b[1] - 1.5, k.b[2] - k.b[0] + 3, k.b[3] - k.b[1] + 3); cx.setLineDash([]); }
      if (L.trk && id) { const t = '#' + id + ' · ' + spT(k); cx.font = 'bold 9px sans-serif'; const tw = cx.measureText(t).width + 6; cx.fillStyle = col; cx.fillRect(k.b[0] - 2, k.b[1] - 13, tw, 11); cx.fillStyle = '#fff'; cx.fillText(t, k.b[0] + 1, k.b[1] - 4); } });
    if (L.det && Fo.shed && mode === 'nv') { cx.strokeStyle = '#e03131'; cx.lineWidth = 1.6; cx.strokeRect(Fo.shed[0] - 9, Fo.shed[1] - 6, 18, 12); cx.fillStyle = '#e03131'; cx.font = 'bold 9px sans-serif'; cx.fillText('רכב?', Fo.shed[0] - 9, Fo.shed[1] - 8); }
    if (L.trk) { /* short trails, in image coordinates */ const tr = mode === 'req' ? trailR : trailM; Fo.cars.forEach(k => { const id = mode === 'req' ? k.idR : k.idN; if (!k.vis || !id) return; (tr[id] = tr[id] || []).push([f, k.cx, k.cy]); }); Object.keys(tr).forEach(id => { tr[id] = tr[id].filter(q => q[0] <= f && f - q[0] < 25); if (tr[id].length < 2) return; cx.strokeStyle = col; cx.globalAlpha = 0.6; cx.beginPath(); tr[id].forEach((q, i) => i ? cx.lineTo(q[1], q[2]) : cx.moveTo(q[1], q[2])); cx.stroke(); cx.globalAlpha = 1; }); }
    D4.txt(cx, 'גובה ' + F(F0.P.h, 0) + ' מ׳ · הטיה ' + F(F0.P.tilt * 180 / Math.PI, 0) + '° · כיוון ' + F(((F0.P.yaw * 180 / Math.PI) % 360 + 360) % 360, 0) + '°', IW - 6, IH - 6, '#fff', 10, 'right');
    if (mc) { const s = 320 / MW; mctx.drawImage(GND, 0, 0, 320, 208); const fp = [[0, 0], [IW, 0], [IW, IH], [0, IH]].map(([u, v]) => unproject(F0.P, A, u, Math.max(v, F0.P.tilt > 0.6 ? IH * 0.35 : 0))).filter(Boolean); mctx.strokeStyle = '#fff'; mctx.lineWidth = 1.5; mctx.beginPath(); fp.forEach((g, i) => i ? mctx.lineTo(mx(g[0]) * s, my(g[1]) * s) : mctx.moveTo(mx(g[0]) * s, my(g[1]) * s)); mctx.closePath(); mctx.stroke(); mctx.fillStyle = '#fff'; mctx.beginPath(); mctx.arc(mx(F0.P.x) * s, my(F0.P.y) * s, 3, 0, TAU); mctx.fill();
      if (L.geo) Fo.cars.forEach(k => { const id = mode === 'req' ? k.idR : k.idN; if (!k.vis || !id) return; const g = mode === 'req' ? [k.p.x + (hsh(f, k.ci + 50) - 0.5) * 2, k.p.y + (hsh(f + 5, k.ci + 50) - 0.5) * 2] : naiveGeo(Fo.P, (k.b[0] + k.b[2]) / 2, (k.b[1] + k.b[3]) / 2); const X = mx(g[0]) * s, Y = my(g[1]) * s; mctx.fillStyle = col; mctx.beginPath(); mctx.arc(X, Y, 4, 0, TAU); mctx.fill(); mctx.fillStyle = '#fff'; mctx.font = 'bold 9px sans-serif'; mctx.fillText(String(id), X + 5, Y - 3); }); }
    const tNow = F0.t - (B.S.t0 || 0); const e = (B.S.ev || []).filter(q => Math.abs(q[0] - (o.sc === 'tour' ? F0.t : F0.t)) < 1.6); evs.innerHTML = e.length ? '⚑ ' + e.map(q => q[1]).join(' · ') : '&nbsp;';
    sl.value = f; tl.textContent = F(tNow, 1) + ' / ' + F(B.S.T, 0) + ' ש׳';
    if (o.info) { const vis = Fo.cars.filter(k => k.vis), dets = vis.filter(k => mode === 'req' ? k.dR : k.dN).length, ids = new Set(); B.fr.slice(0, f + 1).forEach(Q => Q.cars.forEach(k => { const id = mode === 'req' ? k.idR : k.idN; if (id) ids.add(id); })); const truth = new Set(); B.fr.slice(0, f + 1).forEach(Q => Q.cars.forEach(k => { if (k.vis) truth.add(k.c.id); }));
      info.innerHTML = '<div class="note-small">בפריים: ' + vis.length + ' רכבים נראים · ' + dets + ' זוהו' + (mode === 'nv' && Fo.shed ? ' · <b style="color:#e03131">זיהוי שווא אחד</b>' : '') + ' · עד עכשיו ' + truth.size + ' רכבים אמיתיים קיבלו <b>' + ids.size + '</b> מספרי זהות' + (ids.size > truth.size ? ' — <b style="color:#e8590c">' + (ids.size - truth.size) + ' מיותרים</b>' : '') + (o.sc === 'lag' ? ' · פער בין הסימונים לסרטון: <b>' + F((f - lagF) / FPS, 1) + ' ש׳</b>' : '') + '</div>'; } }
  timer = setInterval(() => { if (!K0.alive(box)) return clearInterval(timer); if (!play) return; f = (f + 1) % B.N; if (f === 0) { Object.keys(trailR).forEach(k => delete trailR[k]); Object.keys(trailM).forEach(k => delete trailM[k]); } draw(); }, 1000 / FPS);
  draw();
  return { set(sc, md) { B = build(sc); o.sc = sc; f = 0; sl.max = B.N - 1; if (md) mode = md; Object.keys(trailR).forEach(k => delete trailR[k]); Object.keys(trailM).forEach(k => delete trailM[k]); draw(); }, mode(m) { mode = m; draw(); }, get frame() { return B.fr[f]; }, B: () => B };
}
window.SIM8 = { SC, CARS, build, player, toLL, IW, IH, FL, axes, project, unproject, naiveGeo, ground, render, FPS, hsh, ACC };
})();
(function () {
const { F, flex, colm, row, table, badge } = window.D4;
const W = window.W, V = window.V, el = V.el, K0 = window.K0, D4 = window.D4;
const S8 = window.SIM8;
const ST = { get(k, d) { try { const v = JSON.parse(localStorage.getItem('m8_' + k)); return v == null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('m8_' + k, JSON.stringify(v)); } catch (e) { } } };
const lnk = (href, t) => '<a href="#/' + href + '">' + t + '</a>';

/* 1.1 — the finished system, flying over the whole area */
W.w8_scene = function (box) {
  V.say(box, 'המנוע שמאחורי האפליקציה, על עולם סינתטי. הרחפן חוצה את כל האזור בגובה 115 מטר. על כל רכב: מלבן, מספר זהות שנשאר צמוד אליו, מהירות, ושובל קצר. כבה ודלק שכבות כדי לראות מה כל שלב מוסיף. ⚑ מסמן אירועים בדרך.');

  S8.player(box, { sc: 'tour' });
  V.say(box, '<span class="note-small">זו הדמיה של <b>התנהגות</b> — עולם סינתטי ומערכת "מתוסרטת" שמראה מה התוצר צריך לעשות. היא לא מכילה אלגוריתם שאפשר להעתיק: את זה בונים בפרקים 3–9.</span>');
};

/* 1.2 — one moment, four views */
W.w8_views = function (box) {
  V.say(box, 'רגע אחד מהסיור, משתי זוויות. <b>מצלמה ישר למטה</b> ו<b>מצלמה מוטה</b> — אותו רחפן, אותו רגע, רק הזווית שונה: שים לב כמה המלבנים משנים צורה וגודל. <b>הטבלה</b> — מה מסך התוצאות מציג ברגע הזה. הזז את הזמן.');

  const B = S8.build('tour'); let f = 300; const r = row(box); V.slider(r, 'זמן (שניות)', 0, (B.N - 1) / S8.FPS, 1 / S8.FPS, f / S8.FPS, v => { f = Math.round(v * S8.FPS); draw(); }, v => F(v, 1));
  const g = el('div', { style: 'display:grid;grid-template-columns:repeat(2,auto);gap:10px;justify-content:center;direction:rtl' }); box.appendChild(g);
  const c1 = D4.canvas(colm(g, 'מצלמה ישר למטה (הטיה 0°)'), S8.IW, S8.IH), c2 = D4.canvas(colm(g, 'אותו רגע, מצלמה מוטה ב־45°'), S8.IW, S8.IH); const tb = el('div'); box.appendChild(tb);
  function boxes(ctx, P, A, t) { S8.CARS.forEach(c => { const pos = (() => { const k = B.fr[f].cars.find(q => q.c.id === c.id); return k.p; })(); const co = [[2.3, 0.95], [2.3, -0.95], [-2.3, -0.95], [-2.3, 0.95]].map(([a, b]) => S8.project(P, A, pos.x + a * Math.cos(pos.h) - b * Math.sin(pos.h), pos.y + a * Math.sin(pos.h) + b * Math.cos(pos.h))); if (co.some(q => !q)) return; const us = co.map(q => q[0]), vs = co.map(q => q[1]); const x0 = Math.min(...us), y0 = Math.min(...vs), x1 = Math.max(...us), y1 = Math.max(...vs); if (x1 < 0 || y1 < 0 || x0 > S8.IW || y0 > S8.IH) return; ctx.strokeStyle = '#2f9e44'; ctx.lineWidth = 1.5; ctx.strokeRect(x0 - 1, y0 - 1, x1 - x0 + 2, y1 - y0 + 2); }); }
  function draw() { const F0 = B.fr[f]; const G = S8.ground(F0.t, 1); const P1 = Object.assign({}, F0.P, { tilt: 0 }), P2 = Object.assign({}, F0.P, { tilt: Math.PI / 4, y: F0.P.y - F0.P.h * 0.7 }); const A1 = S8.render(c1.getContext('2d'), P1, G); boxes(c1.getContext('2d'), P1, A1); const A2 = S8.render(c2.getContext('2d'), P2, G); boxes(c2.getContext('2d'), P2, A2);
    const rows = F0.cars.filter(k => k.vis && k.idR).map(k => { const c = S8.CARS.find(q => q.id === k.c.id); const sp = c.park ? 0 : c.v * 3.6; return ['<b>' + k.idR + '</b>', c.park ? 'עומד' : F(sp, 0), '<span class="ltr">(' + F(k.cx, 0) + ', ' + F(k.b[3], 0) + ')</span>', 'נתיבים + רכבים', 'רכב']; });
    tb.innerHTML = '<p class="note-small" style="margin:.4em 0">הטבלה של מסך התוצאות בפריים ' + f + ':</p>' + table(['מספר זיהוי', 'מהירות (קמ״ש)', 'פיקסל (נקודת מגע בקרקע)', 'מקור קנה המידה', 'סוג'], rows); }
  draw();
};

/* 1.3 — the triggers: every way the system can fail, naive vs required */
const TRIG = {
  occl: ['רכב C נוסע מערבה ונכנס מתחת לשורת עצים לכ־5 שניות. המזהה לא רואה אותו — אף מזהה לא היה רואה.', 'המסלול נקטע; כשהרכב יוצא הוא מקבל מספר זהות חדש. בדוח יופיעו שני רכבים במקום אחד.', 'המסלול ממשיך בחיזוי (מלבן מקווקו) לפי המהירות האחרונה, והרכב שיוצא משויך לאותו מספר.', 5, 'מודול 5, פרק 3; מודול 5, סעיף 5.3; מודול 5, פרק 6'],
  cross: ['A נוסע מזרחה ו־E צפונה; הם נפגשים בצומת, והמלבנים חופפים לרגע.', 'השיוך הולך לפי "הקרוב ביותר" — והמספרים מתחלפים: A ממשיך עם המספר של E.', 'החיזוי יודע לאן כל רכב נסע, ולכן השיוך אחרי המפגש נכון.', 5, 'מודול 5, פרק 4; מודול 5, פרק 9'],
  shadow: ['רכב נכנס לצל של מבנה: התמונה כהה בהרבה, הניגודיות יורדת.', 'מזהה שאומן רק על רכבים מוארים מפספס אותם בצל; המסלול נשבר שוב ושוב.', 'הזיהוי ממשיך: אומן גם על דוגמאות כהות (הגדלת נתונים), ונבדק על "פרוסת צל" בנפרד.', 4, 'מודול 2, סעיף 8.5; מודול 4, סעיף 10.2; מודול 1, פרק 2'],
  yaw: ['הרחפן מסתובב ב־90° בשנייה וחצי. כל הרכבים "זזים" בתמונה בבת אחת, למרות שעל הקרקע כמעט לא זזו.', 'הקפיצה בתמונה גדולה מהשער — כמעט כל הרכבים מקבלים מספרים חדשים.', 'מעריכים את תנועת המצלמה בין פריימים ומזיזים את המסלולים לפניה — או עוקבים בקואורדינטות של הקרקע.', 7, 'מודול 5, פרק 8; מודול 1, פרק 9'],
  climb: ['הרחפן מטפס מ־70 ל־260 מטר. רכב שהיה 18 פיקסלים הופך ל־5.', 'מתחת לכ־8 פיקסלים המזהה מפספס את רוב הרכבים.', 'חלוקה לאריחים, או מזהה שאומן על עצמים קטנים; והמהירות נשארת אותה מהירות בכל גובה, כי קנה המידה מתעדכן עם הטיפוס.', 4, 'מודול 4, פרק 7; מודול 3, סעיף 6.3'],
  exit: ['הרחפן זז מזרחה והחניון יוצא מהתמונה לכמה שניות, ואז חוזר.', 'כל הרכבים החונים מקבלים מספרים חדשים כשהם חוזרים לתמונה.', 'המערכת זוכרת רכבים לפי המיקום שלהם על הקרקע: רכב חונה שחוזר לאותו מקום הוא אותו רכב.', 6, 'מודול 5, סעיף 1.2; מודול 3, פרק 6'],
  fp: ['מכולה לבנה על הדשא, בגודל ובצורה של רכב, מלמעלה.', 'המזהה מסמן אותה כרכב, בכל פריים — רכב "חונה" שלא קיים.', 'הזיהוי השגוי לא מופיע: נבדק בניתוח שגיאות, ותוקן בדוגמאות שליליות.', 4, 'מודול 4, פרק 9; מודול 4, פרק 8'],
  lag: ['כדי לסרוק מהר, המנוע מריץ את המזהה רק על חלק מהפריימים, אבל שומר את התוצאות לפי מונה משלו — לא לפי מספר הפריים האמיתי.', 'בניגון, כל פריים מקבל את הסימונים של פריים מוקדם יותר, והפער גדל לאורך הסרטון: המלבנים "נגררים" מאחורי הרכבים.', 'כל תוצאה נשמרת לפי מספר הפריים האמיתי, ופריימים שדולגו מקבלים את המיקום מהמעקב — הסימונים יושבים על הרכבים לאורך כל הסרטון.', 8, 'מודול 5, פרק 3; מודול 5, פרק 5; מודול 1, פרק 1'],
  tilt: ['המצלמה מוטה ב־54°: רואים רחוק, וכל פיקסל בחלק העליון של התמונה "שווה" הרבה מטרים.', 'ההמרה מניחה מצלמה שמסתכלת ישר למטה — מטר־לפיקסל אחד לכל התמונה. המהירות בתוויות הכתומות שגויה, ושונה בין רכבים קרובים לרחוקים שנוסעים באותה מהירות. (ובנוסף, הרכבים הרחוקים קטנים — גם הזיהוי והמעקב סובלים, וזה עניין לאבני דרך 2 ו־3.)', 'ההמרה לוקחת בחשבון את ההטיה — מנקודת המגוז של הנתיבים או ממודל עומק — והמהירות בתוויות הירוקות נכונה בכל מקום בתמונה.', 6, 'מודול 3, סעיף 12.7; מודול 3, פרק 6; מודול 5, סעיף 11.1'] };
const MS = { 3: 'אבן דרך 1: נתונים ואמת מידה', 4: 'אבן דרך 2: זיהוי', 5: 'אבן דרך 3: מעקב', 6: 'אבן דרך 4: מפיקסל למטרים', 7: 'אבן דרך 5: עמידות', 8: 'אבן דרך 6: האפליקציה וסריקה מהירה', 9: 'אבן דרך 7: הערכה' };
const linkify = t => t.replace(/מודול (\d), (פרקים|פרק|סעיף) ([\d.]+)/g, (m, mo, kind, id) => '<a class="ref" href="#/m' + mo + '/' + (id.includes('.') ? 's' : 'c') + '/' + id + '">' + m + '</a>');
function trigCard(k) { const T = TRIG[k]; return '<div class="deep" style="padding:8px 12px">' + table(['', ''], [['<b>מה קורה</b>', T[0]], ['<b style="color:#e8590c">ניסיון ראשון נאיבי</b>', T[1]], ['<b style="color:#2f9e44">המערכת הנדרשת</b>', T[2]], ['<b>איפה זה נבנה</b>', lnk('m8/c/' + T[3], 'פרק ' + T[3] + ' — ' + MS[T[3]])], ['<b>מה לחזור עליו בקורס</b>', linkify(T[4])]]) + '</div>'; }
W.w8_triggers = function (box) {
  V.say(box, 'תשעה מצבים שבהם מערכת מעקב מרחפן נשברת. לכל אחד: <b>בחר מצב</b>, צפה בו פעם כ<b>ניסיון ראשון נאיבי</b> (כתום) ופעם כ<b>מערכת הנדרשת</b> (ירוק). שורת המידע למטה סופרת כמה מספרי זהות קיבלו הרכבים האמיתיים — כל מספר מיותר הוא רכב שנספר פעמיים.');
  const keys = Object.keys(TRIG); let k = keys[0]; const tabs = el('div'); box.appendChild(tabs); const holder = el('div'); box.appendChild(holder); const card = el('div'); box.appendChild(card); let P = null;
  V.tabs(tabs, keys.map(q => S8.SC[q].name), i => { k = keys[i]; P.set(k); card.innerHTML = trigCard(k); }, 0);
  P = S8.player(holder, { sc: k, compare: true, mode: 'nv' }); card.innerHTML = trigCard(k);
};
/* a single trigger, for the "planned fault" section of each milestone */
const fault = (k, extra) => function (box) { V.say(box, 'התקלה המתוכננת של השלב: <b>' + S8.SC[k].name + '</b>. צפה בה כ<b>ניסיון נאיבי</b> וכ<b>מערכת הנדרשת</b>. המערכת שלך צריכה להתנהג כמו הירוק — על הסרטון האמיתי שלך, לא על ההדמיה.'); S8.player(box, { sc: k, compare: true, mode: 'nv' }); box.insertAdjacentHTML('beforeend', trigCard(k) + (extra ? '<div class="note-small" style="margin-top:6px">' + extra + '</div>' : '')); };
W.w8_fault_occl = fault('occl'); W.w8_fault_cross = fault('cross'); W.w8_fault_shadow = fault('shadow'); W.w8_fault_climb = fault('climb'); W.w8_fault_fp = fault('fp'); W.w8_fault_yaw = fault('yaw'); W.w8_fault_exit = fault('exit'); W.w8_fault_lag = fault('lag'); W.w8_fault_tilt = fault('tilt');
W.w8_fault_data = function (box) { V.say(box, 'התקלה של שלב הנתונים לא נראית בסרטון — היא נראית במספרים. שלושה תיוגים של אותו פריים: <b>הנכון</b>, תיוג <b>שמפספס רכבים מוסתרים</b> (מתייג רק את מה שרואים), ותיוג <b>עם מלבנים רופפים</b>. בחר, וראה איך אותה מערכת בדיוק "משתפרת" או "מתקלקלת" רק בגלל אמת המידה.');
  const sim = { rec: 0.9, prec: 0.92 }; let lab = 0; V.tabs(row(box), ['תיוג נכון', 'בלי רכבים מוסתרים', 'מלבנים רופפים'], i => { lab = i; draw(); }, 0); const tb = el('div'); box.appendChild(tb);
  function draw() { const R = [[0.90, 0.92, 'נקודת הייחוס.'], [0.97, 0.92, 'הרגישות "קפצה" ל־97% — כי מהמכנה נעלמו בדיוק הרכבים הקשים. המערכת לא השתפרה; אמת המידה התקלקלה, ושלב המעקב (שצריך לגשר על הסתרות) כבר לא נמדד בכלל.'], [0.71, 0.73, 'עם מלבנים רופפים, חלק מהזיהויים הנכונים לא עוברים את סף החפיפה 0.5 — ונספרים גם כהחמצה וגם כזיהוי שגוי.']][lab]; tb.innerHTML = table(['', 'רגישות', 'דיוק'], [['אותה מערכת, מול התיוג הזה', '<b>' + F(100 * R[0], 0) + '%</b>', '<b>' + F(100 * R[1], 0) + '%</b>']]) + '<p>' + R[2] + ' לכן הכללים לתיוג נקבעים <b>לפני</b> שמתייגים, ונכתבים — ' + lnk('m4/s/8.1', 'מודול 4, סעיף 8.1') + '.</p>'; }
  draw(); };

/* 1.4 — what counts as success: metrics computed on the simulation, naive vs required */
W.w8_metrics = function (box) {
  V.say(box, 'כך תמדוד את המערכת שלך. המספרים כאן <b>חושבו</b> על כל הסיור בהדמיה, פעם עם ההתנהגות הנאיבית ופעם עם הנדרשת, מול האמת שידועה בהדמיה. בטבלה — הסף של בדיקת הקבלה, ו"עבר / לא עבר". בפרויקט שלך את האמת תיצור בעצמך בפרק 3.');
  const B = S8.build('tour'); const calc = m => { let vis = 0, tp = 0, fp = 0, ge = 0, gn = 0; const ids = new Set(), cars = new Set(); B.fr.forEach((Q, f) => { Q.cars.forEach(k => { if (!k.vis) return; vis++; cars.add(k.c.id); const d = m === 'req' ? k.dR : k.dN; if (d) { tp++; const g = m === 'req' ? [k.p.x + (S8.hsh(f, k.ci + 50) - 0.5) * 2, k.p.y + (S8.hsh(f + 5, k.ci + 50) - 0.5) * 2] : S8.naiveGeo(Q.P, k.cx, k.cy); ge += Math.hypot(g[0] - k.p.x, g[1] - k.p.y); gn++; } const id = m === 'req' ? k.idR : k.idN; if (id) ids.add(id); }); if (m === 'nv' && Q.shed) fp++; }); return { rec: tp / vis, prec: tp / (tp + fp), idr: ids.size / cars.size, geo: ge / gn, fps: m === 'req' ? 17 : 6 }; };
  const a = calc('nv'), b = calc('req'); const TH = [['רגישות הזיהוי', 'rec', v => F(100 * v, 1) + '%', v => v >= 0.85, '≥ 85%'], ['דיוק הזיהוי', 'prec', v => F(100 * v, 1) + '%', v => v >= 0.9, '≥ 90%'], ['מספרי זהות לכל רכב אמיתי', 'idr', v => F(v, 2), v => v <= 1.2, '≤ 1.2'], ['שגיאת מיקום ממוצעת', 'geo', v => F(v, 1) + ' מ׳', v => v <= 5, '≤ 5 מ׳'], ['קצב סריקה', 'fps', v => F(v, 0) + ' פריימים בשנייה', v => v >= 15, '≥ 15']];
  box.insertAdjacentHTML('beforeend', table(['מדד', 'הסף', 'ניסיון נאיבי', 'המערכת הנדרשת'], TH.map(([n, k, f, ok, th]) => [n, th, f(a[k]) + ' ' + badge(ok(a[k]), ok(a[k]) ? 'עבר' : 'לא עבר'), f(b[k]) + ' ' + badge(ok(b[k]), ok(b[k]) ? 'עבר' : 'לא עבר')])));
  V.say(box, 'שים לב: <b>קצב העיבוד</b> כאן הוא הנחה של ההדמיה (שום רשת לא רצה כאן) — במערכת שלך תמדוד אותו לפי הפרוטוקול של ' + lnk('m6/s/1.2', 'מודול 6, סעיף 1.2') + '. ושגיאת המיקום של הנאיבי גדולה רק בגלל הטיה של 10° במצלמה — 0.18 רדיאן מספיקים כדי להזיז רכב רחוק עשרות מטרים.');
};

/* 1.5 — the pipeline, clickable */
W.w8_roadmap = function (box) {
  V.say(box, 'הצינור שתבנה, משמאל לימין בזמן ריצה. <b>לחץ על שלב</b>: מה הוא מקבל, מה הוא מוציא, באיזה פרק של הפרויקט בונים אותו, ומה בקורס מכין אותך אליו.');
  const ST2 = [['וידאו', 'קובץ סרטון רחפן + נתוני טיסה (גובה, זוויות) אם יש', 'פריים אחרי פריים, עם מספר וזמן', 3, 'מודול 1, פרק 1'], ['זיהוי', 'פריים', 'רשימת מלבנים עם ציון ביטחון', 4, 'מודול 4, פרק 5; מודול 4, פרק 7'], ['מעקב', 'מלבנים מהפריים הנוכחי + המסלולים הפתוחים', 'מסלולים: מספר זהות קבוע + מלבן לכל רכב', 5, 'מודול 5, פרקים 3–5'], ['מפיקסל למטרים', 'מרכז תחתון של כל מלבן + קנה מידה מתוך הסצנה (נתיבים, רכבים, נקודת מגוז) או ממודל עומק מוכן', 'מטרים ומהירות על הקרקע, עם טווח, רמה ומקור', 6, 'מודול 3, סעיף 12.7; מודול 5, סעיף 11.6; מודול 3, פרק 6'], ['האפליקציה', 'מסלולים, מהירויות ומספרים', 'סרטון מסומן + טבלה חיה + חלון זום (וקובץ תוצאות לבדיקה)', 8, 'מודול 6, סעיף 7.4; מודול 1, סעיף 1.3']];
  const X = [['עמידות', 'כל השלבים', 7, 'מודול 5, פרק 8; מודול 4, פרק 10'], ['סריקה מהירה', 'כל השלבים', 8, 'מודול 6, פרקים 1, 8, 9'], ['הערכה', 'הפלט מול האמת', 9, 'מודול 4, פרק 4; מודול 5, פרק 9']];
  const cv = el('div', { style: 'display:flex;gap:6px;align-items:stretch;flex-wrap:wrap;direction:ltr;justify-content:center;margin:8px 0' }); box.appendChild(cv); const cv2 = el('div', { style: 'display:flex;gap:6px;justify-content:center;margin:4px 0 10px' }); box.appendChild(cv2); const out = el('div'); box.appendChild(out);
  const show = h => out.innerHTML = '<div class="deep" style="padding:8px 12px">' + h + '</div>';
  ST2.forEach((s, i) => { const b = el('button', { html: s[0], style: 'min-width:96px;padding:12px 8px' }); b.onclick = () => show(table(['', ''], [['<b>מקבל</b>', s[1]], ['<b>מוציא</b>', s[2]], ['<b>נבנה ב</b>', lnk('m8/c/' + s[3], 'פרק ' + s[3])], ['<b>הכנה בקורס</b>', linkify(s[4])]])); cv.appendChild(b); if (i < ST2.length - 1) cv.appendChild(el('span', { html: '→', style: 'align-self:center;font-size:20px;color:#868e96' })); });
  X.forEach(s => { const b = el('button', { html: '↔ ' + s[0], class: 'ghost' }); b.onclick = () => show(table(['', ''], [['<b>חל על</b>', s[1]], ['<b>נבנה ב</b>', lnk('m8/c/' + s[2], 'פרק ' + s[2])], ['<b>הכנה בקורס</b>', linkify(s[3])]])); cv2.appendChild(b); });
  show('לחץ על שלב.');
};

/* 2.2 — acceptance tests, ticked off and remembered */
const ACCEPT = [
  [3, 'יש לך סרטון של לפחות 3 דקות, ממבט רחפן, עם רכבים בתנועה'], [3, 'תייגת לפחות 300 פריימים ברצף, לפי מסמך כללי תיוג שכתבת לפני'], [3, 'אמת המידה כוללת רכבים מוסתרים חלקית ומספר זהות לכל רכב'],
  [4, 'רגישות הזיהוי ≥ 85% ודיוק ≥ 90% על הפריימים המתויגים (חפיפה ≥ 0.5)'], [4, 'בדקת בנפרד שלוש פרוסות: צל, רכבים קטנים, קצה התמונה'], [4, 'מצאת ותיעדת לפחות 3 זיהויים שגויים שחוזרים, ותיקנת אחד'],
  [5, 'מספרי זהות לכל רכב אמיתי ≤ 1.2 על הסרטון המתויג'], [5, 'רכב שמוסתר עד 3 שניות שומר על המספר שלו'], [5, 'מדדת את שלושת מדדי המעקב והסברת מה כל אחד מראה'],
  [6, 'על הסרטונים הסינתטיים, ברמה 1: שגיאת מהירות ≤ 10% ושגיאת מיקום ≤ 5 מטרים'], [6, 'על הסרטון האמיתי: רכב חונה מתחת ל־9 קמ״ש, רוחב נתיב מחושב 3.5 ± 0.3 מ׳ בתחילה ובסוף, רכבים צמודים בהפרש ≤ 10%'], [6, 'כל שורה בפלט: מהירות עם טווח, רמת תשובה ומקור קנה המידה — ובקטע בלי כביש המערכת יורדת רמה'],
  [7, 'סיבוב של הרחפן לא מחליף מספרי זהות'], [7, 'רכב שיוצא מהתמונה וחוזר תוך 10 שניות — אותו מספר'], [7, 'הוספת "תקלה" אחת משלך שלא הופיעה כאן, ותיקון שלה'],
  [8, 'האפליקציה עובדת עם המנוע שלך מקצה לקצה: מסך מלא, בחירה, תצוגה מקדימה, סריקה, ומסך תוצאות עם טבלה מסונכרנת וחלון זום'], [8, 'בזמן הסריקה החלון מגיב: פס ההתקדמות זז, וביטול עוצר את הסריקה'], [8, '≥ 15 פריימים בשנייה בסריקה, נמדד; תוצאה לכל פריים; הרגישות לא ירדה ביותר מ־2 נקודות אחוז'],
  [9, 'הרצה אחת מלאה מהסרטון עד הדוח, בפקודה אחת'], [9, 'דוח עם כל המדדים, 3 כישלונות אמיתיים ומה למדת מכל אחד'], [9, 'כל אבני הדרך מסומנות כעוברות']];
W.w8_contract = function (box) {
  V.say(box, 'בדיקות הקבלה של הפרויקט, לפי אבני הדרך. <b>סמן</b> כל בדיקה כשהמערכת שלך עוברת אותה באמת (נשמר בדפדפן הזה). אל תסמן "כמעט".');
  const s = ST.get('accept', {}); const out = el('div'); box.appendChild(out);
  function draw() { let h = ''; [3, 4, 5, 6, 7, 8, 9].forEach(ch => { const it = ACCEPT.map((a, i) => [a, i]).filter(([a]) => a[0] === ch); const done = it.filter(([, i]) => s[i]).length; h += '<div style="margin:10px 0"><b>' + lnk('m8/c/' + ch, MS[ch]) + '</b> <span class="note-small">' + done + '/' + it.length + '</span>' + it.map(([a, i]) => '<label class="ctl" style="display:flex;gap:8px;align-items:flex-start;margin:4px 0"><input type="checkbox" data-i="' + i + '"' + (s[i] ? ' checked' : '') + '><span>' + a[1] + '</span></label>').join('') + '</div>'; });
    const n = Object.values(s).filter(Boolean).length; out.innerHTML = '<p><b>' + n + ' מתוך ' + ACCEPT.length + '</b> בדיקות עוברות.</p>' + h; out.querySelectorAll('input').forEach(c => c.onchange = () => { s[c.dataset.i] = c.checked; ST.set('accept', s); draw(); }); }
  draw();
};

/* 2.3 — results board: every run of your system, the same five numbers */
const COLS = [['rec', 'רגישות (%)'], ['prec', 'דיוק (%)'], ['idr', 'זהויות לרכב'], ['geo', 'שגיאת מיקום (מ׳)'], ['fps', 'קצב סריקה (פריימים בשנייה)']];
W.w8_board = function (box) {
  V.say(box, 'לוח התוצאות שלך. אחרי <b>כל</b> שינוי שמשפיע על המערכת — הרצה מלאה על הסרטון המתויג, ושורה כאן: שם קצר לגרסה ומה שינית, וחמשת המספרים. הגרף מראה מדד אחד לאורך הגרסאות. זה מה שתראה בהגנה (פרק 10): לא "זה עובד", אלא "זה השתפר מ־X ל־Y בגלל Z". נשמר בדפדפן הזה.');
  let runs = ST.get('runs', []); let met = 'rec'; const form = el('div', { style: 'display:flex;flex-wrap:wrap;gap:6px;align-items:end' }); box.appendChild(form);
  const inp = {}; [['name', 'גרסה / מה שינית', 220]].concat(COLS.map(c => [c[0], c[1], 90])).forEach(([k, n, w]) => { const c = el('label', { style: 'display:flex;flex-direction:column;font-size:.85em' }); c.appendChild(el('span', { html: n })); const i = el('input', { type: k === 'name' ? 'text' : 'number', step: 'any', style: 'width:' + w + 'px' }); inp[k] = i; c.appendChild(i); form.appendChild(c); });
  const add = el('button', { class: 'primary', html: 'הוסף שורה' }); add.onclick = () => { if (!inp.name.value.trim()) return; const r = { name: inp.name.value.trim(), d: new Date().toISOString().slice(0, 10) }; COLS.forEach(([k]) => r[k] = inp[k].value === '' ? null : +inp[k].value); runs.push(r); ST.set('runs', runs); Object.values(inp).forEach(i => i.value = ''); draw(); }; form.appendChild(add);
  V.tabs(row(box), COLS.map(c => c[1]), i => { met = COLS[i][0]; draw(); }, 0); const cv = D4.canvas(box, 620, 200); const tb = el('div'); box.appendChild(tb);
  function draw() { const x = cv.getContext('2d'); x.clearRect(0, 0, 620, 200); const v = runs.map(r => r[met]).filter(q => q != null); if (v.length) { const mn = Math.min(...v), mxv = Math.max(...v), span = (mxv - mn) || 1; x.strokeStyle = '#1c7ed6'; x.lineWidth = 2; x.beginPath(); let k = 0; runs.forEach((r, i) => { if (r[met] == null) return; const X = 30 + i / Math.max(1, runs.length - 1) * 560, Y = 170 - (r[met] - mn) / span * 140; k++ === 0 ? x.moveTo(X, Y) : x.lineTo(X, Y); }); x.stroke(); runs.forEach((r, i) => { if (r[met] == null) return; const X = 30 + i / Math.max(1, runs.length - 1) * 560, Y = 170 - (r[met] - mn) / span * 140; x.fillStyle = '#1c7ed6'; x.beginPath(); x.arc(X, Y, 4, 0, 7); x.fill(); D4.txt(x, String(r[met]), X, Y - 8, '#495057', 10, 'center'); D4.txt(x, String(i + 1), X, 190, '#868e96', 10, 'center'); }); } else D4.txt(x, 'עוד אין הרצות', 310, 100, '#adb5bd', 14, 'center');
    tb.innerHTML = runs.length ? table(['#', 'תאריך', 'גרסה'].concat(COLS.map(c => c[1])).concat(['']), runs.map((r, i) => [String(i + 1), r.d, r.name].concat(COLS.map(c => r[c[0]] == null ? '—' : String(r[c[0]]))).concat(['<button class="ghost" data-del="' + i + '">מחק</button>']))) : ''; tb.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { runs.splice(+b.dataset.del, 1); ST.set('runs', runs); draw(); }); }
  draw();
};

/* hints in three levels — level 2 and 3 open only after you write what you tried */
function hintsW(ch) { return function (box) { const H = (window.M8HINTS || {})[ch]; if (!H) return; const s = ST.get('hints' + ch, { open: 0, tried: ['', ''] });
  V.say(box, 'שלוש רמות עזרה. <b>רמה 1</b> — כיוון. <b>רמה 2</b> — איפה בקורס נמצא הרעיון. <b>רמה 3</b> — שלד של הפתרון במילים. כדי לפתוח את הרמה הבאה, כתוב קודם במשפט־שניים <b>מה ניסית ומה לא עבד</b>. אין כאן קוד, ולא יהיה.');
  const out = el('div'); box.appendChild(out);
  function draw() { let h = ''; for (let i = 0; i < 3; i++) { const opened = s.open > i; h += '<div class="deep" style="padding:8px 12px;margin:8px 0' + (opened ? '' : ';opacity:.85') + '"><b>רמה ' + (i + 1) + ' — ' + ['כיוון', 'איפה בקורס', 'שלד במילים'][i] + '</b>'; if (opened) h += '<div>' + H[i] + '</div>'; else if (i === s.open) { h += i === 0 ? '<div><button class="primary" data-open="0">פתח רמה 1</button></div>' : '<div class="note-small">מה ניסית אחרי רמה ' + i + '? (לפחות 40 תווים)</div><textarea data-t="' + (i - 1) + '" rows="2" style="width:100%">' + (s.tried[i - 1] || '') + '</textarea><div><button class="primary" data-open="' + i + '">פתח רמה ' + (i + 1) + '</button></div>'; } h += '</div>'; }
    out.innerHTML = h; out.querySelectorAll('textarea').forEach(t => t.oninput = () => { s.tried[+t.dataset.t] = t.value; ST.set('hints' + ch, s); }); out.querySelectorAll('[data-open]').forEach(b => b.onclick = () => { const i = +b.dataset.open; if (i > 0 && (s.tried[i - 1] || '').trim().length < 40) { b.insertAdjacentHTML('afterend', ' <span class="note-small" style="color:#e03131">כתוב קודם מה ניסית.</span>'); return; } s.open = i + 1; ST.set('hints' + ch, s); draw(); }); }
  draw(); }; }
[3, 4, 5, 6, 7, 8, 9].forEach(ch => W['w8_hints' + ch] = hintsW(ch));

/* the engineer's log — one per milestone */
function logW(ch) { return function (box) { const s = ST.get('log' + ch, {});
  V.say(box, 'יומן המהנדס של השלב. שלוש שאלות, תשובות קצרות. בסוף הפרויקט היומן הזה הופך לחלק "החלטות" בדוח ובהגנה. נשמר בדפדפן הזה.');
  const Q = [['dec', 'מה ההחלטה החשובה בשלב, ומה החלופה שדחית — ולמה?'], ['fail', 'מה נכשל בדרך, ואיך גילית?'], ['num', 'המספרים: לפני ואחרי השלב (ותעדכן גם את לוח התוצאות בסעיף 2.3)']];
  Q.forEach(([k, q]) => { box.appendChild(el('div', { html: '<b>' + q + '</b>', style: 'margin-top:8px' })); const t = el('textarea', { rows: 3, style: 'width:100%' }); t.value = s[k] || ''; t.oninput = () => { s[k] = t.value; ST.set('log' + ch, s); }; box.appendChild(t); });
  box.appendChild(el('div', { class: 'note-small', html: 'לוח התוצאות: ' + lnk('m8/s/2.3', 'סעיף 2.3') + ' · בדיקות הקבלה: ' + lnk('m8/s/2.2', 'סעיף 2.2') })); }; }
[3, 4, 5, 6, 7, 8, 9].forEach(ch => W['w8_log' + ch] = logW(ch));

/* 10.1 — the defense: answer first, then see a model answer */
W.w8_defense = function (box) {
  const DEF = window.M8DEF || []; V.say(box, 'סימולציה של ועדה. לכל שאלה: <b>כתוב תשובה</b> (בקול או בכתב) — רק אז נפתחת תשובה לדוגמה. סמן "ידעתי" או "לחזור", ובסוף תראה על מה לחזור. השאלות על <b>הפרויקט שלך</b>: התשובה לדוגמה אומרת מה ועדה מחפשת, לא מה המספרים שלך.');
  const s = ST.get('def', {}); let i = 0; const out = el('div'); box.appendChild(out); const sum = el('div'); box.appendChild(sum);
  function draw() { const q = DEF[i], st = s[i] || {}; out.innerHTML = '<div class="note-small">שאלה ' + (i + 1) + ' מתוך ' + DEF.length + ' · ' + q[0] + '</div><h3 style="margin:.3em 0">' + q[1] + '</h3><textarea rows="4" style="width:100%" placeholder="התשובה שלך">' + (st.a || '') + '</textarea><div class="actions"><button class="primary" data-k="show">הראה תשובה לדוגמה</button><button data-k="prev">→ הקודמת</button><button data-k="next">הבאה ←</button></div>' + (st.shown ? '<div class="deep" style="padding:8px 12px">' + q[2] + '</div><div class="actions"><button data-k="ok">ידעתי ✓</button><button data-k="again">לחזור ↺</button></div>' : '');
    const ta = out.querySelector('textarea'); ta.oninput = () => { s[i] = Object.assign(s[i] || {}, { a: ta.value }); ST.set('def', s); };
    out.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { const k = b.dataset.k; if (k === 'show') { if ((ta.value || '').trim().length < 25) { b.insertAdjacentHTML('afterend', ' <span class="note-small" style="color:#e03131">ענה קודם.</span>'); return; } s[i] = Object.assign(s[i] || {}, { shown: true }); } if (k === 'ok' || k === 'again') s[i] = Object.assign(s[i] || {}, { mark: k }); if (k === 'next') i = (i + 1) % DEF.length; if (k === 'prev') i = (i - 1 + DEF.length) % DEF.length; ST.set('def', s); draw(); });
    const again = DEF.map((q, j) => [q, j]).filter(([, j]) => (s[j] || {}).mark === 'again'); const ok = DEF.filter((q, j) => (s[j] || {}).mark === 'ok').length; sum.innerHTML = '<p class="note-small">ידעתי: ' + ok + ' · לחזור: ' + again.length + (again.length ? ' — ' + again.map(([q, j]) => '<a href="javascript:void 0" data-go="' + j + '">' + (j + 1) + '</a>').join(', ') : '') + '</p>'; sum.querySelectorAll('[data-go]').forEach(a => a.onclick = () => { i = +a.dataset.go; draw(); }); }
  draw();
};

/* 10.2 — portfolio checklist */
const PORT = [['סרטון הדגמה של 60–90 שניות', 'הקלטת מסך של האפליקציה: בחירה, סריקה, ומסך התוצאות עם חלון הזום, עם כתוביות קצרות לאירועים: הסתרה, צומת, סיבוב.'], ['דוח של עמוד־שניים', 'הבעיה, הצינור בתרשים אחד, טבלת המדדים מול הסף, שלושה כישלונות ומה למדת, מה הלאה.'], ['מאגר קוד מסודר', 'מבנה תיקיות ברור, הוראות הרצה בשלושה צעדים, קובץ הגדרות אחד, בלי נתיבים מהמחשב שלך.'], ['לוח התוצאות כגרף', 'גרף אחד: מדד מרכזי לאורך הגרסאות, עם שם לכל קפיצה.'], ['תרשים הצינור', 'חמש קופסאות, מה נכנס ומה יוצא, וזמן הריצה של כל אחת.'], ['שלושה כישלונות מתועדים', 'לכל אחד: פריים, מה קרה, למה, ומה תיקן — או למה לא תוקן.'], ['תשובה מוכנה ל"מה הייתי עושה עם עוד חודש"', 'שניים־שלושה כיוונים קונקרטיים, עם מה שכל אחד היה משפר במספרים.']];
W.w8_portfolio = function (box) {
  V.say(box, 'מה הופך את הפרויקט לפריט בתיק עבודות. סמן כשמוכן (נשמר בדפדפן הזה).');
  const s = ST.get('port', {}); const out = el('div'); box.appendChild(out);
  function draw() { out.innerHTML = PORT.map((p, i) => '<label class="ctl" style="display:flex;gap:10px;align-items:flex-start;padding:6px 0;border-bottom:1px solid var(--line,#eee)"><input type="checkbox" data-i="' + i + '"' + (s[i] ? ' checked' : '') + '><span><b>' + p[0] + '</b><br><span class="note-small">' + p[1] + '</span></span></label>').join('') + '<p><b>' + Object.values(s).filter(Boolean).length + ' מתוך ' + PORT.length + '</b></p>'; out.querySelectorAll('input').forEach(c => c.onchange = () => { s[c.dataset.i] = c.checked; ST.set('port', s); draw(); }); }
  draw();
};
})();
