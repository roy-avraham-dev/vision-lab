/* Module 5 visuals — chapters 1–4: tracking by detection, 1-D Kalman, Kalman for boxes, association.
   Also the shared tracking helpers (window.TR). */
(function () {
const W = window.W, V = window.V, el = V.el; const { f, ltr, mono, svgBox, rect, txt, iou, rng, randn } = window.BX;
const path = (svg, pts, st) => V.s('path', { d: pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(''), style: Object.assign({ fill: 'none', stroke: 'var(--c1)', strokeWidth: 2 }, st || {}) }, svg);
const COL = i => ['#2f9e44', '#e8590c', '#1c7ed6', '#ae3ec9', '#f08c00', '#0c8599', '#c2255c', '#5c940d', '#364fc7', '#a61e4d'][i % 10];

/* 1-D constant-velocity Kalman filter, exactly as KF1D of section 2.4 */
class KF1 { constructor(x0, p0, q, r, v0) { this.x = [x0, v0 || 0]; this.P = [[p0, 0], [0, p0]]; this.q = q; this.r = r; }
  predict() { const [p, v] = this.x; this.x = [p + v, v]; const P = this.P; const a = P[0][0] + P[0][1] + P[1][0] + P[1][1], b = P[0][1] + P[1][1], c = P[1][0] + P[1][1], d = P[1][1]; this.P = [[a + this.q * 0.25, b + this.q * 0.5], [c + this.q * 0.5, d + this.q]]; }
  update(z) { const P = this.P; const y = z - this.x[0], S = P[0][0] + this.r; const K = [P[0][0] / S, P[1][0] / S]; this.x = [this.x[0] + K[0] * y, this.x[1] + K[1] * y]; this.P = [[(1 - K[0]) * P[0][0], (1 - K[0]) * P[0][1]], [P[1][0] - K[1] * P[0][0], P[1][1] - K[1] * P[0][1]]]; return K; } }
/* a box filter = four 1-D filters on cx, cy, w, h (exercise 3.3) with size-dependent noise (section 3.2) */
class KFBox { constructor(b) { const z = toZ(b); const h = Math.max(4, z[3]); this.k = z.map(v => new KF1(v, (h / 10) ** 2, (h / 160) ** 2 * 4, (h / 20) ** 2)); this.age = 0; }
  predict() { this.k.forEach(k => k.predict()); return this.box(); } update(b) { const z = toZ(b); this.k.forEach((k, i) => k.update(z[i])); } box() { return fromZ(this.k.map(k => k.x[0])); } }
const toZ = b => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2, b[2] - b[0], b[3] - b[1]], fromZ = z => [z[0] - z[2] / 2, z[1] - z[3] / 2, z[0] + z[2] / 2, z[1] + z[3] / 2];
/* Hungarian on small matrices (cost minimisation); rectangular handled by padding */
function hungarian(C) { const n = C.length, m = C[0] ? C[0].length : 0; if (!n || !m) return []; const N = Math.max(n, m); const a = [...Array(N)].map((_, i) => [...Array(N)].map((_, j) => (i < n && j < m) ? C[i][j] : 0));
  const u = Array(N + 1).fill(0), v = Array(N + 1).fill(0), p = Array(N + 1).fill(0), way = Array(N + 1).fill(0);
  for (let i = 1; i <= N; i++) { p[0] = i; let j0 = 0; const minv = Array(N + 1).fill(Infinity), used = Array(N + 1).fill(false); do { used[j0] = true; const i0 = p[j0]; let d = Infinity, j1 = 0; for (let j = 1; j <= N; j++) if (!used[j]) { const cur = a[i0 - 1][j - 1] - u[i0] - v[j]; if (cur < minv[j]) { minv[j] = cur; way[j] = j0; } if (minv[j] < d) { d = minv[j]; j1 = j; } } for (let j = 0; j <= N; j++) if (used[j]) { u[p[j]] += d; v[j] -= d; } else minv[j] -= d; j0 = j1; } while (p[j0] !== 0); do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0); }
  const res = []; for (let j = 1; j <= N; j++) if (p[j] && p[j] - 1 < n && j - 1 < m) res.push([p[j] - 1, j - 1]); return res; }
const associate = (T, D, thr) => { if (!T.length || !D.length) return { m: [], ut: T.map((_, i) => i), ud: D.map((_, j) => j) }; const M = T.map(t => D.map(d => iou(t, d))); const pairs = hungarian(M.map(r => r.map(x => -x))).filter(([i, j]) => M[i][j] >= thr);
  return { m: pairs, ut: T.map((_, i) => i).filter(i => !pairs.some(p => p[0] === i)), ud: D.map((_, j) => j).filter(j => !pairs.some(p => p[1] === j)), M }; };
/* a tiny SORT / two-stage / appearance tracker for the simulations */
function makeTracker(o) { o = Object.assign({ minHits: 3, maxAge: 30, thr: 0.3, high: 0.5, low: 0.1, two: false, reid: false, reidThr: 0.4, noPredictFirst: false, idAtConfirm: false, returnPred: false, firstFrames: false }, o); let next = 1, frame = 0, tmp = 1; const tracks = [];
  const cos = (a, b) => 1 - a.reduce((s, x, i) => s + x * b[i], 0);
  function match(T, D, thr) { if (!T.length || !D.length) return { m: [], ut: T.map((_, i) => i), ud: D.map((_, j) => j) }; const M = T.map(t => D.map(d => iou(t.b, d.b)));
    let C = M.map(r => r.map(x => 1 - x)), bad = (i, j) => M[i][j] < thr;
    if (o.reid) { C = T.map((t, i) => D.map((d, j) => { const c = cos(t.emb, d.emb); return 0.5 * (1 - M[i][j]) + 0.5 * c; })); bad = (i, j) => M[i][j] < thr && cos(T[i].emb, D[j].emb) > o.reidThr; }
    const C2 = C.map((r, i) => r.map((x, j) => bad(i, j) ? 1e3 : x)); const pairs = hungarian(C2).filter(([i, j]) => C2[i][j] < 1e3);
    return { m: pairs, ut: T.map((_, i) => i).filter(i => !pairs.some(p => p[0] === i)), ud: D.map((_, j) => j).filter(j => !pairs.some(p => p[1] === j)) }; }
  const upd = (t, d) => { t.kf.update(d.b); t.hits++; t.missed = 0; t.last = d; if (d.emb && t.emb) { const e = t.emb.map((x, i) => 0.9 * x + 0.1 * d.emb[i]); const n = Math.hypot(...e); t.emb = e.map(x => x / n); } if (!t.id && t.hits >= o.minHits) t.id = next++; };
  return { tracks, step(dets, shift) { frame++;
      if (shift) tracks.forEach(t => { t.kf.k[0].x[0] += shift[0]; t.kf.k[1].x[0] += shift[1]; });
      const prevB = tracks.map(t => t.kf.box()); tracks.forEach(t => { t.kf.predict(); t.missed++; });
      const hi = dets.filter(d => d.s >= o.high), lo = dets.filter(d => d.s >= o.low && d.s < o.high);
      const T = tracks.map((t, i) => ({ b: o.noPredictFirst ? prevB[i] : t.kf.box(), emb: t.emb }));
      const a = match(T, hi, o.thr); a.m.forEach(([i, j]) => upd(tracks[i], hi[j]));
      let ut = a.ut; if (o.two && ut.length && lo.length) { const sv = o.reid; o.reid = false; const a2 = match(ut.map(i => T[i]), lo, 0.5); o.reid = sv; a2.m.forEach(([k, j]) => upd(tracks[ut[k]], lo[j])); }
      a.ud.forEach(j => { const t = { kf: new KFBox(hi[j].b), id: o.idAtConfirm ? 0 : next++, tmp: tmp++, hits: 1, missed: 0, last: hi[j], emb: hi[j].emb && hi[j].emb.slice() }; if (o.idAtConfirm && o.minHits <= 1) t.id = next++; tracks.push(t); });
      for (let i = tracks.length - 1; i >= 0; i--) if (tracks[i].missed > o.maxAge || (tracks[i].hits < o.minHits && tracks[i].missed > 1)) tracks.splice(i, 1);
      return tracks.filter(t => (t.missed === 0 || (o.returnPred && t.hits >= o.minHits)) && (t.hits >= o.minHits || (o.firstFrames && frame <= o.minHits)) && t.id).map(t => ({ id: t.id, b: t.kf.box(), pred: t.missed > 0 })); }, get created() { return next - 1; } }; }
/* a synthetic scene: objects moving straight with occasional misses, false positives and occlusions */
function makeScene(o) { o = Object.assign({ n: 14, T: 150, miss: 0.1, noise: 0.04, fp: 0, fixedFP: 0, seed: 1, crossing: false, occl: 0, camV: 0, W: 640, H: 400 }, o); const r = rng(o.seed); const objs = [];
  for (let k = 0; k < o.n; k++) { const s = 18 + r() * 30; const e0 = [...Array(16)].map(() => randn(r)), n0 = Math.hypot(...e0); objs.push({ emb: e0.map(x => x / n0), x: r() * (o.W - 60) + 30, y: r() * (o.H - 60) + 30, vx: (r() - 0.5) * 3, vy: (r() - 0.5) * 2, s, occ0: o.occl ? Math.floor(20 + r() * (o.T - 80)) : -1, tx: (r() - 0.5) * 3, ty: (r() - 0.5) * 2 }); }
  const rndE = () => { const e = [...Array(16)].map(() => randn(r)), n = Math.hypot(...e); return e.map(x => x / n); }; const fixed = [...Array(o.fixedFP)].map(() => [r() * o.W, r() * o.H]); const frames = [];
  for (let t = 0; t < o.T; t++) { const dets = [], gts = []; const cam = o.camV && t >= 40 && t < 100 ? o.camV * (t - 40) : o.camV && t >= 100 ? o.camV * 60 : 0;
    objs.forEach((ob, k) => { const sp = o.speed || 1; let x = ob.x + ob.vx * sp * t, y = ob.y + ob.vy * sp * t; if (o.turn && ob.occ0 >= 0 && t > ob.occ0) { x = ob.x + ob.vx * sp * ob.occ0 + ob.tx * sp * (t - ob.occ0); y = ob.y + ob.vy * sp * ob.occ0 + ob.ty * sp * (t - ob.occ0); } if (x < 0 || x > o.W || y < 0 || y > o.H) return; x += cam; const b = [x - ob.s / 2, y - ob.s, x + ob.s / 2, y + ob.s]; gts.push({ id: k, b });
      const hidden = ob.occ0 >= 0 && t >= ob.occ0 && t < ob.occ0 + o.occl; if (hidden || r() < o.miss) return; const j = () => randn(r) * o.noise * ob.s; const lowS = o.lowFrac && r() < o.lowFrac; const em = ob.emb.map(x => x + randn(r) * (o.embNoise || 0.15)), en = Math.hypot(...em); dets.push({ b: [b[0] + j(), b[1] + j(), b[2] + j(), b[3] + j()], s: lowS ? 0.12 + r() * 0.35 : 0.55 + r() * 0.4, gt: k, emb: em.map(x => x / en) }); });
    fixed.forEach(([x, y]) => { if (r() < 0.8) dets.push({ b: [x - 8, y - 8, x + 8, y + 8], s: 0.15 + r() * 0.25, gt: -1, emb: rndE() }); }); for (let k = 0; k < o.fp; k++) if (r() < 0.5) { const x = r() * o.W, y = r() * o.H; dets.push({ b: [x - 10, y - 10, x + 10, y + 10], s: 0.2 + r() * 0.6, gt: -1, emb: rndE() }); }
    const camPrev = o.camV && t - 1 >= 40 && t - 1 < 100 ? o.camV * (t - 41) : o.camV && t - 1 >= 100 ? o.camV * 60 : 0; frames.push({ dets, gts, shift: [cam - (t ? camPrev : cam), 0] }); } return frames; }
/* count identity switches and output IDs against ground truth */
function score(frames, outs) { let sw = 0, fn = 0, fp = 0, tp = 0, gt = 0; const last = {}; const ids = new Set();
  frames.forEach((fr, t) => { const o = outs[t]; gt += fr.gts.length; const used = new Set(); fr.gts.forEach(g => { let best = -1, bv = 0.5; o.forEach((x, k) => { if (used.has(k)) return; const v = iou(g.b, x.b); if (v >= bv) { bv = v; best = k; } }); if (best < 0) { fn++; return; } used.add(best); tp++; const id = o[best].id; ids.add(id); if (last[g.id] !== undefined && last[g.id] !== id) sw++; last[g.id] = id; }); fp += o.length - used.size; });
  return { sw, fn, fp, tp, gt, mota: 1 - (fn + fp + sw) / gt, ids: ids.size }; }
window.TR = { KF1, KFBox, hungarian, associate, makeTracker, makeScene, score, COL, path, toZ, fromZ };

/* 1.1 tracking by detection */
W.w5_tbd = function (box) {
  V.say(box, 'המזהה רץ על כל פריים ומוציא מלבנים בלי זהות (אפור). העוקב מחבר אותם בין פריימים ונותן לכל עצם מספר קבוע (צבע). <b>עבור על הפריימים</b>.');
  const fr = makeScene({ n: 5, T: 40, miss: 0.08, seed: 3, W: 480, H: 260 }); const tr = makeTracker({ minHits: 1 }); const outs = fr.map(x => tr.step(x.dets));
  const svg = svgBox(box, 480, 260); const out = V.say(box);
  V.stepper(box, fr.length, t => { svg.innerHTML = ''; V.s('rect', { x: 0, y: 0, width: 480, height: 260, style: { fill: '#dfe5d8' } }, svg); fr[t].dets.forEach(d => rect(svg, d.b, { stroke: '#666', strokeDasharray: '3 2', strokeWidth: 1 })); outs[t].forEach(o => { rect(svg, o.b, { stroke: COL(o.id), strokeWidth: 2.5 }); txt(svg, [o.b[0], o.b[1] - 3], '#' + o.id, { fill: COL(o.id), fontSize: '12px' }); });
    out.innerHTML = 'פריים ' + (t + 1) + ': ' + fr[t].dets.length + ' זיהויים, ' + outs[t].length + ' מסלולים בפלט. העוקב לא רואה את התמונה: רק מלבנים.'; }, { speed: 300 });
};

/* 1.2 track life cycle */
W.w5_lifecycle = function (box) {
  V.say(box, 'רצף של זיהויים לעצם אחד (✓ יש, ✗ אין) ופספוסים בודדים. <b>שנה את min_hits ו־max_age</b> וראה מתי המסלול זמני, מאושר, אבוד ונמחק.');
  let mh = 3, ma = 5; const seq = '✓✓✓✓✗✓✓✓✗✗✓✓✓✓✓✗✗✗✗✗✗✗✓✓'.split(''); const sr = V.row(box); V.slider(sr, 'min_hits', 1, 6, 1, mh, v => { mh = v; draw(); }); V.slider(sr, 'max_age', 1, 10, 1, ma, v => { ma = v; draw(); });
  const svg = svgBox(box, 520, 120); const out = V.say(box);
  function draw() { svg.innerHTML = ''; let hits = 0, miss = 0, alive = false, id = 0, ids = 0; const C = { 'זמני': '#adb5bd', 'מאושר': 'var(--c3)', 'אבוד': 'var(--c5, #e8a33d)', 'נמחק': 'var(--c2)', '—': '#f1f3f5' };
    seq.forEach((s, t) => { let st; if (s === '✓') { if (!alive) { alive = true; hits = 0; id = ++ids; } hits++; miss = 0; st = hits >= mh ? 'מאושר' : 'זמני'; } else if (alive) { miss++; st = miss > ma ? 'נמחק' : 'אבוד'; if (miss > ma) alive = false; } else st = '—';
      V.s('rect', { x: 10 + t * 21, y: 30, width: 19, height: 30, style: { fill: C[st] } }, svg); txt(svg, [14 + t * 21, 22], s, { fontSize: '12px' }); if (st !== '—') txt(svg, [13 + t * 21, 78], '#' + id, { fontSize: '9px' }); });
    Object.entries(C).slice(0, 4).forEach(([k, c], i) => { V.s('rect', { x: 10 + i * 110, y: 95, width: 14, height: 14, style: { fill: c } }, svg); txt(svg, [28 + i * 110, 107], k); });
    out.innerHTML = 'נוצרו <b>' + ids + '</b> מספרים לעצם אחד. ' + (ids > 1 ? 'ההסתרה הארוכה ארוכה מ־max_age, והעצם חזר עם מספר חדש.' : 'מספר אחד לאורך כל הרצף.'); }
  draw();
};

/* 1.3 naive nearest vs prediction */
W.w5_naive = function (box) {
  V.say(box, 'שני אנשים הולכים זה מול זה וחולפים קרוב. העוקב התמים מחבר לנקודה הקרובה מהפריים הקודם; עוקב עם חיזוי משווה למקום הצפוי (תרגיל 1.1). <b>הזז את הזמן</b>.');
  let t = 0, mode = 0; V.slider(box, 'פריים', 0, 40, 1, t, v => { t = v; draw(); }); V.tabs(box, ['הקרוב ביותר', 'עם חיזוי'], i => { mode = i; draw(); });
  const svg = svgBox(box, 480, 200); const out = V.say(box);
  const A = k => [40 + k * 10, 104], B = k => [445 - k * 10, 96];
  function run() { let a = A(0), b = B(0), va = [0, 0], vb = [0, 0]; const ids = [[0, 1]]; let sw = 0; let lab = [0, 1];
    for (let k = 1; k <= 40; k++) { const P = [A(k), B(k)]; const pa = mode ? [a[0] + va[0], a[1] + va[1]] : a, pb = mode ? [b[0] + vb[0], b[1] + vb[1]] : b; const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]); const keep = d(pa, P[0]) + d(pb, P[1]) <= d(pa, P[1]) + d(pb, P[0]);
      const na = keep ? P[0] : P[1], nb = keep ? P[1] : P[0]; va = [na[0] - a[0], na[1] - a[1]]; vb = [nb[0] - b[0], nb[1] - b[1]]; a = na; b = nb; const nl = keep ? [0, 1] : [1, 0]; if (nl[0] !== lab[0]) sw++; lab = nl; ids.push(lab.slice()); } return { ids, sw }; }
  function draw() { svg.innerHTML = ''; const { ids, sw } = run(); for (let k = 0; k <= t; k++) { const L = ids[k]; V.s('circle', { cx: A(k)[0], cy: A(k)[1], r: 3, style: { fill: COL(L[0]) } }, svg); V.s('circle', { cx: B(k)[0], cy: B(k)[1], r: 3, style: { fill: COL(L[1]) } }, svg); }
    txt(svg, [30, 130], 'א׳ →', { fontSize: '12px' }); txt(svg, [420, 80], '← ב׳', { fontSize: '12px' }); out.innerHTML = 'הצבע הוא המספר שהעוקב נתן. ' + (sw ? '<b class="bad">החלפת מזהים</b> ברגע החלוף, בלי אף החמצה.' : 'המזהים נשמרו: החיזוי כבר בצד הנכון.'); }
  draw();
};

/* 2.1 fusing two gaussians */
W.w5_gauss_fuse = function (box) {
  V.say(box, 'החיזוי (12) והמדידה (13) הם שתי התפלגויות. <b>שנה את השונויות</b>: המשולבת תמיד בין שתיהן, וצרה משתיהן. הרווח K הוא המשקל של המדידה.');
  let pv = 5, rv = 4; const sr = V.row(box); V.slider(sr, 'שונות החיזוי', 0.5, 20, 0.5, pv, v => { pv = v; draw(); }); V.slider(sr, 'שונות המדידה R', 0.5, 20, 0.5, rv, v => { rv = v; draw(); });
  const P = window.IM.plot(box, { w: 440, h: 190 }); const out = V.say(box);
  const g = (m, s) => { const pts = []; for (let x = 4; x <= 21; x += 0.1) pts.push([x, Math.exp(-((x - m) ** 2) / (2 * s)) / Math.sqrt(2 * Math.PI * s)]); return pts; };
  function draw() { const K = pv / (pv + rv), m = 12 + K * (13 - 12), s = (1 - K) * pv; P.draw([{ pts: g(12, pv), color: 'var(--c1)', width: 2 }, { pts: g(13, rv), color: 'var(--c5, #e8a33d)', width: 2 }, { pts: g(m, s), color: 'var(--c3)', width: 3 }], [4, 21], [0, 0.6]);
    out.innerHTML = 'כחול: חיזוי. כתום: מדידה. ירוק: משולב. ' + ltr('K = ' + f(pv, 1) + ' / (' + f(pv, 1) + ' + ' + f(rv, 1) + ') = ' + f(K, 3)) + ', מיקום <b>' + f(m, 2) + '</b>, שונות <b>' + f(s, 2) + '</b>.'; }
  draw();
};

/* 2.2 state and covariance */
W.w5_state = function (box) {
  V.say(box, 'המצב הוא [מיקום, מהירות], ו־P היא אליפסה של אי־ודאות. <b>לחץ חיזוי ועדכון</b>: החיזוי מותח ומטה את האליפסה (מיקום ומהירות נקשרים), העדכון מכווץ אותה בכיוון המיקום בלבד.');
  const k = new KF1(10, 4, 0.05, 4, 2); k.P = [[4, 0], [0, 1]]; const log = [];
  V.btns(box, [['חיזוי', () => { k.predict(); log.push('predict'); draw(); }, 'primary'], ['עדכון עם מדידה', () => { k.update(k.x[0] + 1); log.push('update'); draw(); }], ['איפוס', () => { k.x = [10, 2]; k.P = [[4, 0], [0, 1]]; log.length = 0; draw(); }, 'ghost']]);
  const svg = svgBox(box, 360, 240); const out = mono(box);
  function draw() { svg.innerHTML = ''; const P = k.P; const a = P[0][0], b = P[0][1], c = P[1][1]; const tr = a + c, det = a * c - b * b; const l1 = tr / 2 + Math.sqrt(tr * tr / 4 - det), l2 = tr / 2 - Math.sqrt(Math.max(0, tr * tr / 4 - det)); const ang = Math.atan2(l1 - a, b || 1e-9);
    V.s('line', { x1: 20, y1: 120, x2: 340, y2: 120, style: { stroke: 'var(--line2)' } }, svg); V.s('line', { x1: 180, y1: 10, x2: 180, y2: 230, style: { stroke: 'var(--line2)' } }, svg); txt(svg, [300, 135], 'מיקום'); txt(svg, [185, 20], 'מהירות');
    V.s('ellipse', { cx: 180, cy: 120, rx: Math.sqrt(l1) * 22, ry: Math.sqrt(Math.max(l2, 0.001)) * 22, transform: `rotate(${-ang * 180 / Math.PI} 180 120)`, style: { fill: 'rgba(66,99,235,.18)', stroke: 'var(--c1)', strokeWidth: 2 } }, svg);
    out.textContent = 'x = [' + k.x.map(v => f(v, 2)).join(', ') + ']\nP = [[' + f(a, 2) + ', ' + f(b, 2) + '], [' + f(b, 2) + ', ' + f(c, 2) + ']]\n' + (log.slice(-6).join(' → ') || 'start'); }
  draw();
};

/* 2.3 the formulas, step by step on the section's example */
W.w5_kf_steps = function (box) {
  V.say(box, 'הדוגמה של הסעיף: מיקום 10, מהירות 2, שונויות 4 ו־1, מדידה 13. <b>עבור על השלבים</b>, ואז שנה את R ל־1 (תרגיל 2.1).');
  let R = 4; V.slider(box, 'R', 0.5, 10, 0.5, R, v => { R = v; st.go(0); }); const out = mono(box);
  const st = V.stepper(box, 6, s => { const lines = ['x = [10, 2],  P = [[4, 0], [0, 1]]']; const xp = [12, 2], Pp = [[5, 1], [1, 1]]; if (s >= 1) lines.push('predict:  x ← F x = [12, 2],  P ← F P Fᵀ = [[5, 1], [1, 1]]');
    const y = 13 - 12, S = 5 + R, K = [5 / S, 1 / S]; if (s >= 2) lines.push('y = z − H x = 13 − 12 = 1'); if (s >= 3) lines.push('S = H P Hᵀ + R = 5 + ' + R + ' = ' + f(S, 2)); if (s >= 4) lines.push('K = P Hᵀ S⁻¹ = [' + f(K[0], 3) + ', ' + f(K[1], 3) + ']');
    if (s >= 5) { const x = [12 + K[0], 2 + K[1]]; const P = [[(1 - K[0]) * 5, (1 - K[0]) * 1], [1 - K[1] * 5, 1 - K[1] * 1]]; lines.push('x ← x + K y = [' + f(x[0], 3) + ', ' + f(x[1], 3) + ']'); lines.push('P ← (I − K H) P → var(pos) ' + f(P[0][0], 2) + ', var(vel) ' + f(P[1][1], 2)); }
    void xp; void Pp; out.textContent = lines.join('\n'); });
};

/* 2.4 running the filter */
W.w5_kf_run = function (box) {
  V.say(box, 'רכב במהירות 2 פיקסלים לפריים, מדידות עם רעש 2, 60 פריימים. <b>שנה את q</b>, ונסה "חור במדידות" כדי לראות את השונות גדלה.');
  let q = 0.05, gap = false; V.slider(box, 'q', 0.001, 2, 0.001, q, v => { q = v; draw(); }, x => f(x, 3)); V.tabs(box, ['כל המדידות', 'בלי מדידות בפריימים 30 עד 40'], i => { gap = i === 1; draw(); });
  const P = window.IM.plot(box, { w: 460, h: 200 }); const out = V.say(box); const r = rng(5); const Z = [...Array(60)].map((_, t) => 2 * t + randn(r) * 2);
  function draw() { const k = new KF1(Z[0], 100, q, 4); const est = [], vars = []; for (let t = 0; t < 60; t++) { if (t) k.predict(); if (!(gap && t >= 30 && t < 40)) k.update(Z[t]); est.push([t, k.x[0] - 2 * t]); vars.push(k.P[0][0]); }
    const meas = Z.map((z, t) => [t, z - 2 * t]); P.draw([{ pts: meas.filter((_, t) => !(gap && t >= 30 && t < 40)), color: '#adb5bd', width: 0, dots: true }, { pts: est, color: 'var(--c2)', width: 2.5 }, { pts: [[0, 0], [59, 0]], color: 'var(--c3)', dash: '4 3' }], [0, 59], [-7, 7]);
    const rm = a => Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length); out.innerHTML = 'הציר האנכי: שגיאה מהאמת (ירוק). אפור: מדידות, אדום: המסנן. RMSE מדידות ' + f(rm(meas.map(m => m[1])), 2) + ', מסנן <b>' + f(rm(est.slice(5).map(m => m[1])), 2) + '</b>. מהירות משוערת ' + f(k.x[1], 2) + '. ' + (gap ? 'שונות המיקום בפריים 39: ' + f(vars[39], 1) + '.' : ''); }
  draw();
};

/* 2.5 q and a turn */
W.w5_q_turn = function (box) {
  V.say(box, 'תרגיל 2.3: 30 פריימים במהירות 2, ואז פנייה למהירות −2. <b>שנה את q</b>: קטן מסנן רעש יפה בקטע הישר, אבל "ממשיך קדימה" אחרי הפנייה.');
  let lq = Math.log10(0.05); V.slider(box, 'log10(q)', -3, 1, 0.1, lq, v => { lq = v; draw(); }); const P = window.IM.plot(box, { w: 460, h: 200 }); const out = V.say(box);
  const r = rng(7); const tru = [...Array(60)].map((_, t) => t < 30 ? 2 * t : 60 - 2 * (t - 30)); const Z = tru.map(x => x + randn(r) * 2);
  function draw() { const q = 10 ** lq; const k = new KF1(Z[0], 100, q, 4); const est = []; for (let t = 0; t < 60; t++) { if (t) k.predict(); k.update(Z[t]); est.push([t, k.x[0]]); }
    P.draw([{ pts: Z.map((z, t) => [t, z]), color: '#adb5bd', width: 0, dots: true }, { pts: tru.map((x, t) => [t, x]), color: 'var(--c3)', width: 2 }, { pts: est, color: 'var(--c2)', width: 2.5 }], [0, 59], [-5, 65]);
    const err = est.map(([t, x]) => x - tru[t]); out.innerHTML = 'q = ' + f(q, 3) + '. RMSE <b>' + f(Math.sqrt(err.reduce((s, e) => s + e * e, 0) / 60), 2) + '</b>, שגיאה מקסימלית אחרי הפנייה <b>' + f(Math.max(...err.slice(30).map(Math.abs)), 2) + '</b>. בטבלה של הפתרון: q = 0.001 נותן 6.5 ו־13.4.'; }
  draw();
};

/* 3.1 the 8-dimensional state */
W.w5_state8 = function (box) {
  V.say(box, 'מטריצת המעבר F (8 על 8) ומטריצת המדידה H (4 על 8). <b>לחץ על משתנה</b> וראה את השורה שלו ב־F.');
  const names = ['cx', 'cy', 'w', 'h', 'vcx', 'vcy', 'vw', 'vh']; let sel = 0; const tabs = V.tabs(box, names, i => { sel = i; draw(); }); void tabs; const out = el('div', { style: { direction: 'ltr', display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap', margin: '8px 0' } }); box.appendChild(out); const say = V.say(box);
  function mat(rows, cols, val, hl) { const t = el('table', { class: 'mini' }); for (let i = 0; i < rows; i++) { const tr = el('tr'); for (let j = 0; j < cols; j++) { const v = val(i, j); tr.appendChild(el('td', { style: { textAlign: 'center', padding: '2px 6px', background: hl(i, j) ? 'rgba(66,99,235,.25)' : '', color: v ? 'var(--ink)' : 'var(--ink3)' } }, String(v))); } t.appendChild(tr); } return t; }
  function draw() { out.innerHTML = ''; out.append(el('div', {}, el('b', {}, 'F'), mat(8, 8, (i, j) => +(i === j || (i < 4 && j === i + 4)), i => i === sel)), el('div', {}, el('b', {}, 'H'), mat(4, 8, (i, j) => +(i === j), (i, j) => j === sel)));
    say.innerHTML = sel < 4 ? names[sel] + ' החדש = ' + names[sel] + ' + ' + names[sel + 4] + '. והוא <b>נמדד</b> (עמודה ב־H).' : names[sel] + ' לא משתנה במודל ולא נמדד: המסנן מעריך אותו מתוך שינוי ' + names[sel - 4] + '.'; }
  draw();
};

/* 3.2 size-dependent noise */
W.w5_size_noise = function (box) {
  V.say(box, 'אותו רעש של 3 פיקסלים על אדם של 10 ועל משאית של 200, מול רעש שהוא 1/20 מהגובה. <b>בחר מודל רעש</b> וראה כמה הקופסאות "רועדות" ביחס לגודל.');
  let prop = false; V.tabs(box, ['3 פיקסלים קבוע', '1/20 מהגובה'], i => { prop = i === 1; draw(); }); const svg = svgBox(box, 480, 240); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const r = rng(2); [[60, 120, 10, 20], [300, 120, 200, 100]].forEach(([cx, cy, w, h], k) => { const sd = prop ? h / 20 : 3; for (let i = 0; i < 12; i++) { const j = () => randn(r) * sd; rect(svg, [cx - w / 2 + j(), cy - h / 2 + j(), cx + w / 2 + j(), cy + h / 2 + j()], { stroke: k ? 'var(--c1)' : 'var(--c2)', strokeWidth: 0.8 }); } txt(svg, [cx - 20, 230], k ? 'משאית 200' : 'אדם 10'); });
    const ious = [[10, 20], [200, 100]].map(([w, h]) => { const sd = prop ? h / 20 : 3; return iou([0, 0, w, h], [sd, sd, w + sd, h + sd]); }); out.innerHTML = 'חפיפה של קופסה שזזה בסטיית תקן אחת: אדם <b>' + f(ious[0], 2) + '</b>, משאית <b>' + f(ious[1], 2) + '</b>. ' + (prop ? 'רעש יחסי: אותה איכות לכל גודל.' : 'רעש קבוע: לאדם זה רעש עצום, למשאית זניח.'); }
  draw();
};

/* 3.3 the box filter in action */
W.w5_kfbox = function (box) {
  V.say(box, 'הבדיקה של סעיף 3.4: מלבן 30 על 60 שזז (3, 1) בכל פריים, עם רעש זיהוי של 6%. <b>עבור על הפריימים</b>: אפור הזיהוי, אדום המסנן, ירוק האמת.');
  const r = rng(3); const T = 40; const tru = [...Array(T)].map((_, t) => [40 + 3 * t, 60 + t, 70 + 3 * t, 120 + t]); const det = tru.map(b => { const j = () => randn(r) * 1.8; return [b[0] + j(), b[1] + j(), b[2] + j(), b[3] + j()]; });
  const k = new KFBox(det[0]); const est = [det[0]]; for (let t = 1; t < T; t++) { k.predict(); k.update(det[t]); est.push(k.box()); }
  const svg = svgBox(box, 480, 220); const out = V.say(box); const mi = a => a.reduce((s, x) => s + x, 0) / a.length;
  V.stepper(box, T, t => { svg.innerHTML = ''; rect(svg, tru[t], { stroke: 'var(--c3)', strokeWidth: 3 }); rect(svg, det[t], { stroke: '#868e96', strokeDasharray: '3 2' }); rect(svg, est[t], { stroke: 'var(--c2)', strokeWidth: 2 });
    out.innerHTML = 'חפיפה עם האמת עד עכשיו: זיהוי ' + f(mi(det.slice(0, t + 1).map((b, i) => iou(b, tru[i]))), 3) + ', מסנן <b>' + f(mi(est.slice(0, t + 1).map((b, i) => iou(b, tru[i]))), 3) + '</b>. מהירות משוערת: ' + ltr('(' + f(k.k[0].x[1], 2) + ', ' + f(k.k[1].x[1], 2) + ')') + '.'; }, { speed: 250 });
};

/* 3.4 coasting without detections */
W.w5_coast = function (box) {
  V.say(box, 'עצם שזז במהירות קבועה עם שינויים אקראיים, וחיזוי בלי מדידות. <b>שנה את רוחב העצם</b> (תרגיל 3.4: 10, 30, 100) ואת מספר הפריימים בלי מדידה.');
  let w = 30, n = 10; const sr = V.row(box); V.slider(sr, 'רוחב העצם', 6, 120, 2, w, v => { w = v; run(); }); V.slider(sr, 'פריימים בלי מדידה', 1, 30, 1, n, v => { n = v; run(); });
  const out = V.say(box);
  function run() { const r = rng(9); const ious = []; for (let k = 0; k < 200; k++) { let x = 0, v = 2; const kf = new KF1(0, 1, 0.3, 1, 2); for (let t = 0; t < 20; t++) { v += randn(r) * Math.sqrt(0.3); x += v; kf.predict(); kf.update(x + randn(r)); } let px = kf.x[0], pv = kf.x[1]; for (let t = 0; t < n; t++) { v += randn(r) * Math.sqrt(0.3); x += v; px += pv; } ious.push(iou([x, 0, x + w, w * 2], [px, 0, px + w, w * 2])); }
    const m = ious.reduce((a, b) => a + b) / ious.length, ok = ious.filter(x => x >= 0.3).length / ious.length; out.innerHTML = 'חפיפה ממוצעת בין החיזוי לאמת: <b>' + f(m, 3) + '</b>. מקרים מעל שער 0.3: <b>' + f(ok * 100, 0) + '%</b>. ' + (w <= 12 ? 'עצם קטן: אותה שגיאה בפיקסלים היא חלק עצום ממנו.' : ''); }
  run();
};

/* 4.1 three costs */
W.w5_costs = function (box) {
  V.say(box, 'חיזוי של מסלול מול זיהוי. שלוש עלויות: 1 − חפיפה, מרחק מרכזים מנורמל, ומרחק מהלנוביס (שמתחשב באי־הודאות S). <b>הזז את הזיהוי והגדל את S</b> (מסלול שלא נמדד זמן מה).');
  let dx = 8, S = 9, size = 10; const sr = V.row(box); V.slider(sr, 'הזזה (פיקסלים)', 0, 40, 1, dx, v => { dx = v; draw(); }); V.slider(sr, 'שונות S', 4, 100, 1, S, v => { S = v; draw(); }); V.slider(sr, 'רוחב העצם', 6, 100, 2, size, v => { size = v; draw(); });
  const out = mono(box);
  function draw() { const p = [100, 100, 100 + size, 100 + size * 2], d = [100 + dx, 100, 100 + dx + size, 100 + size * 2]; const io = iou(p, d), cd = dx / size, mh = dx * dx / S;
    out.textContent = '1 − IoU          = ' + f(1 - io, 3) + (io < 0.3 ? '   ✗ (IoU < 0.3)' : '   ✓') + '\ncenter / size    = ' + f(cd, 2) + '\nMahalanobis d²   = ' + f(dx, 0) + '² / ' + S + ' = ' + f(mh, 2) + (mh > 3.84 ? '   ✗ (> 3.84, 95% for one dim)' : '   ✓') + '\n(exercise 4.3: 6 px with S = 9 → 4, with S = 36 → 1)'; }
  draw();
};

/* 4.2 associate, step by step on the section 4.3 example */
W.w5_associate = function (box) {
  V.say(box, 'הפונקציה associate על הדוגמה של סעיף 4.3: טבלת חפיפות, שיוך אופטימלי, ואז השער. <b>עבור על השלבים, ושנה את הסף</b> (תרגיל 4.1: 0.2 ו־0.7).');
  const M = [[0.8, 0.1, 0.0], [0.05, 0.6, 0.25], [0.0, 0.35, 0.2]]; let thr = 0.3; V.slider(box, 'סף', 0.1, 0.9, 0.05, thr, v => { thr = v; st.go(st.i); });
  const out = mono(box);
  const st = V.stepper(box, 4, s => { const pairs = hungarian(M.map(r => r.map(x => -x))); const kept = pairs.filter(([i, j]) => M[i][j] >= thr - 1e-12); const lines = ['M = ' + JSON.stringify(M)];
    if (s >= 1) lines.push('linear_sum_assignment(−M) → ' + pairs.map(p => '(' + p.join('→') + ')').join(' ') + '   sum = ' + f(pairs.reduce((a, [i, j]) => a + M[i][j], 0), 2)); if (s >= 2) lines.push('gate ≥ ' + thr + ': keep ' + (kept.map(p => '(' + p.join('→') + ')').join(' ') || 'none'));
    if (s >= 3) { const ut = [0, 1, 2].filter(i => !kept.some(p => p[0] === i)), ud = [0, 1, 2].filter(j => !kept.some(p => p[1] === j)); lines.push('unmatched tracks ' + JSON.stringify(ut) + ' → age;  unmatched detections ' + JSON.stringify(ud) + ' → new tracks'); }
    out.textContent = lines.join('\n'); });
};

/* 4.3 the hand example, editable */
W.w5_gate_example = function (box) {
  V.say(box, 'הטבלה של הסעיף. <b>שנה את החפיפות</b> וראה מתי השיוך המיטבי כבר לא האלכסון.');
  const M = [[0.8, 0.1, 0.0], [0.05, 0.6, 0.25], [0.0, 0.35, 0.2]]; const g = el('div', { style: { display: 'grid', gridTemplateColumns: '80px repeat(3, 64px)', gap: '4px', direction: 'ltr', margin: '8px auto', width: 'fit-content' } }); box.appendChild(g); const out = V.say(box);
  g.append(el('span'), ...[0, 1, 2].map(j => el('b', { style: { textAlign: 'center' } }, 'זיהוי ' + j))); M.forEach((r, i) => { g.appendChild(el('b', {}, 'מסלול ' + i)); r.forEach((v, j) => { const inp = el('input', { type: 'number', step: 0.05, min: 0, max: 1, value: v, style: { width: '64px', textAlign: 'center' } }); inp.oninput = () => { M[i][j] = +inp.value || 0; calc(); }; g.appendChild(inp); }); });
  function calc() { const p = hungarian(M.map(r => r.map(x => -x))); const s = p.reduce((a, [i, j]) => a + M[i][j], 0); out.innerHTML = 'שיוך מיטבי: ' + ltr(p.map(x => x.join('→')).join(', ')) + ', סכום <b>' + f(s, 2) + '</b>. עם שער 0.3 נשארים: ' + ltr(p.filter(([i, j]) => M[i][j] >= 0.3).map(x => x.join('→')).join(', ') || '—') + '.'; }
  calc();
};

/* 4.4 how strict the gate */
W.w5_gate_table = function (box) {
  V.say(box, 'הטבלה של הסעיף: הסצנה הצפופה, רק סף החפיפה משתנה. <b>רחף על עמודה</b>.');
  const rows = [[0.05, 14, 44, 0.879], [0.1, 15, 45, 0.867], [0.3, 27, 57, 0.796], [0.5, 52, 87, 0.689]]; const svg = svgBox(box, 460, 210); const out = V.say(box);
  rows.forEach(([t, sw, ids, idf], i) => { const g = V.s('g', {}, svg); V.s('rect', { x: 40 + i * 105, y: 180 - sw * 2.8, width: 40, height: sw * 2.8, style: { fill: 'var(--c2)' } }, g); V.s('rect', { x: 82 + i * 105, y: 180 - idf * 160, width: 40, height: idf * 160, style: { fill: 'var(--c3)' } }, g); txt(g, [60 + i * 105, 200], 'סף ' + t);
    g.addEventListener('mouseenter', () => { out.innerHTML = 'סף ' + t + ': ' + sw + ' החלפות, ' + ids + ' מספרים, IDF1 ' + idf + '.'; }); });
  out.innerHTML = 'אדום: החלפות מזהה. ירוק: IDF1. כאן הסף הנמוך ביותר מנצח, כי עצמים קטנים מאבדים חפיפה מהר. בקהל צפוף, סף נמוך מדי יחבר לשכן.';
};
})();
