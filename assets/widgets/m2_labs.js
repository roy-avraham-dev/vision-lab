/* Module 2 — lab-grade demos (rebuilt chapter by chapter). Loaded after m2_d.js, so the ids here override the old ones.
   Exports window.LAB2M with the helpers, so the numbers can be checked from a test script. */
(function () {
const W = window.W, V = window.V, el = V.el, NN = window.NN, IM = window.IM;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const F = (v, d) => { if (!isFinite(v)) return '∞'; const s = (+v).toFixed(d == null ? 2 : d); return s.replace('-', '−'); };
const E = (v, d) => { if (!isFinite(v)) return '∞'; if (v === 0) return '0'; return (+v).toExponential(d == null ? 1 : d).replace('e', 'e').replace('-', '−'); };
const ltr = s => '<span dir="ltr" style="display:inline-block;direction:ltr;unicode-bidi:isolate">‪' + s + '‬</span>';
const badge = (ok, t) => '<b style="color:' + (ok ? '#2b8a3e' : '#c92a2a') + '">' + (ok ? '✓ ' : '✗ ') + t + '</b>';
const mono = parent => { const p = el('pre', { class: 'code', style: { direction: 'ltr', textAlign: 'left', fontSize: '12.5px', margin: '6px 0', padding: '8px 10px', background: 'var(--surface2)', borderRadius: '8px', whiteSpace: 'pre-wrap' } }); parent.appendChild(p); return p; };
const flex = (parent, gap) => { const d = el('div', { style: { display: 'flex', flexWrap: 'wrap', gap: (gap || 10) + 'px', justifyContent: 'center', alignItems: 'flex-start', direction: 'ltr' } }); parent.appendChild(d); return d; };
const colm = (parent, title) => { const d = el('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' } }); d.appendChild(el('div', { class: 'note-small', html: title || '·' })); parent.appendChild(d); return d; };
const canvas = (parent, w, h, cssW) => { const c = document.createElement('canvas'); c.dir = 'ltr'; c.width = w; c.height = h; c.style.width = (cssW || w) + 'px'; c.style.maxWidth = '100%'; c.style.borderRadius = '8px'; c.style.border = '1px solid var(--line)'; c.style.background = '#fff'; parent.appendChild(c); return c; };
const table = (head, rows) => '<table class="mini" style="margin:6px auto"><tr>' + head.map(h => '<th>' + h + '</th>').join('') + '</tr>' + rows.map(r => '<tr>' + r.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</table>';
const row = parent => { const r = el('div', { class: 'row' }); parent.appendChild(r); return r; };
const txt = (x, s, X, Y, col, size, align) => { x.fillStyle = col || '#495057'; x.font = (size || 12) + 'px sans-serif'; x.textAlign = align || 'left'; x.fillText(s, X, Y); x.textAlign = 'left'; };
const COL = [[66, 99, 235], [232, 89, 12], [47, 158, 68]];
const alive = box => document.body.contains(box);

/* ---------- a fast two-layer network on typed arrays: the network of chapter 1 ---------- */
const DATA = NN.spiral(100, 3, 0); const XS = DATA.X, YS = DATA.y, N = XS.length;
function mlp(H, opt) { opt = opt || {}; const r = NN.rng((opt.seed || 0) + 11), D = 2, K = 3; const p = { H, W1: new Float64Array(D * H), b1: new Float64Array(H), W2: new Float64Array(H * K), b2: new Float64Array(K) };
  const kind = opt.init || 'he'; const s1 = kind === 'he' ? Math.sqrt(2 / D) : kind === 'tiny' ? 0.01 : kind === 'huge' ? 10 : 0, s2 = kind === 'he' ? Math.sqrt(2 / H) : kind === 'tiny' ? 0.01 : kind === 'huge' ? 10 : 0;
  for (let i = 0; i < D * H; i++) p.W1[i] = kind === 'const' ? 0.5 : NN.randn(r) * s1; for (let i = 0; i < H * K; i++) p.W2[i] = kind === 'const' ? 0.5 : NN.randn(r) * s2; p.b1.fill(kind === 'zeros' ? 0 : 0.01); return p; }
/* forward for one point: z1, h, scores, probs (like forward() + softmax of sections 1.2 and 1.3) */
function fwd(p, x, act) { const H = p.H, z = new Float64Array(H), h = new Float64Array(H), s = [0, 0, 0]; for (let j = 0; j < H; j++) { z[j] = x[0] * p.W1[j] + x[1] * p.W1[H + j] + p.b1[j]; h[j] = act === 'none' ? z[j] : Math.max(0, z[j]); }
  for (let c = 0; c < 3; c++) { let a = p.b2[c]; for (let j = 0; j < H; j++) a += h[j] * p.W2[j * 3 + c]; s[c] = a; } const m = Math.max(...s), e = s.map(v => Math.exp(v - m)), S = e[0] + e[1] + e[2]; return { z, h, s, pr: e.map(v => v / S) }; }
/* loss_and_grads of section 1.3, with switches for the planted bugs of exercise 1.2 and section 1.4 */
function lossGrad(p, act, bug) { const H = p.H, g = { W1: new Float64Array(2 * H), b1: new Float64Array(H), W2: new Float64Array(H * 3), b2: new Float64Array(3) }; let loss = 0, acc = 0; bug = bug || {};
  for (let i = 0; i < N; i++) { const x = XS[i], y = YS[i], f = fwd(p, x, act); loss -= Math.log(Math.max(f.pr[y], 1e-300)); if (f.pr[y] >= Math.max(...f.pr)) acc++;
    const ds = f.pr.map((v, c) => (v - (c === y ? 1 : 0)) / (bug.noDiv ? 1 : N));
    for (let c = 0; c < 3; c++) { g.b2[c] += ds[c]; for (let j = 0; j < H; j++) g.W2[j * 3 + c] += f.h[j] * ds[c]; }
    for (let j = 0; j < H; j++) { let dh = 0; for (let c = 0; c < 3; c++) dh += ds[c] * p.W2[j * 3 + c]; const dz = act === 'none' || bug.noMask ? dh : (f.z[j] > 0 ? dh : 0); g.b1[j] += bug.noBias ? 0 : dz; g.W1[j] += x[0] * dz; g.W1[H + j] += x[1] * dz; } }
  return { loss: loss / N, acc: acc / N, g }; }
function lossOnly(p, act) { let l = 0; for (let i = 0; i < N; i++) l -= Math.log(Math.max(fwd(p, XS[i], act).pr[YS[i]], 1e-300)); return l / N; }
const stepP = (p, g, lr) => ['W1', 'b1', 'W2', 'b2'].forEach(k => { for (let i = 0; i < p[k].length; i++) p[k][i] -= lr * g[k][i]; });
const predict = (p, act) => x => { const s = fwd(p, x, act).pr; return s[0] >= s[1] && s[0] >= s[2] ? 0 : s[1] >= s[2] ? 1 : 2; };
/* softmax regression = the "straight lines" classifier of section 1.1 */
function linear() { return { W: new Float64Array(6), b: new Float64Array(3) }; }
function linStep(q, lr) { const gW = new Float64Array(6), gb = new Float64Array(3); let acc = 0; for (let i = 0; i < N; i++) { const x = XS[i], s = [0, 1, 2].map(c => q.b[c] + x[0] * q.W[c] + x[1] * q.W[3 + c]); const m = Math.max(...s), e = s.map(v => Math.exp(v - m)), S = e[0] + e[1] + e[2]; if (s[YS[i]] >= m) acc++;
  for (let c = 0; c < 3; c++) { const d = (e[c] / S - (c === YS[i] ? 1 : 0)) / N; gb[c] += d; gW[c] += x[0] * d; gW[3 + c] += x[1] * d; } } for (let k = 0; k < 6; k++) q.W[k] -= lr * gW[k]; for (let c = 0; c < 3; c++) q.b[c] -= lr * gb[c]; return acc / N; }
const linPred = q => x => { const s = [0, 1, 2].map(c => q.b[c] + x[0] * q.W[c] + x[1] * q.W[3 + c]); return s.indexOf(Math.max(...s)); };
/* paint the plane by the predicted class, and the points on top */
function paint(cv, pred, opt) { opt = opt || {}; const Wd = cv.width, Ht = cv.height, x = cv.getContext('2d'), res = opt.res || 60, cw = Wd / res, ch = Ht / res;
  for (let i = 0; i < res; i++) for (let j = 0; j < res; j++) { const c = COL[pred([-1.1 + 2.2 * (j + 0.5) / res, 1.1 - 2.2 * (i + 0.5) / res])]; x.fillStyle = 'rgb(' + c.map(v => Math.round(255 - (255 - v) * 0.24)).join(',') + ')'; x.fillRect(j * cw, i * ch, cw + 1, ch + 1); }
  XS.forEach((p, k) => { const c = COL[YS[k]]; x.fillStyle = 'rgb(' + c.join(',') + ')'; x.beginPath(); x.arc((p[0] + 1.1) / 2.2 * Wd, (1.1 - p[1]) / 2.2 * Ht, 2.4, 0, 7); x.fill(); }); }
const toPlane = (cv, e) => { const r = cv.getBoundingClientRect(); return [-1.1 + 2.2 * (e.clientX - r.left) / r.width, 1.1 - 2.2 * (e.clientY - r.top) / r.height]; };
/* a cached trained network (He init, 64 hidden, lr 1, 3000 steps), used by several demos */
function trained() { if (trained.p) return trained.p; const p = mlp(64); for (let s = 0; s < 3000; s++) stepP(p, lossGrad(p).g, 1.0); return (trained.p = p); }
function lplot(cv, series, yr, opt) { opt = opt || {}; const Wd = cv.width, Ht = cv.height, x = cv.getContext('2d'); x.clearRect(0, 0, Wd, Ht); const n = Math.max(2, ...series.map(s => s.y.length)), X = i => 34 + i / Math.max(1, (opt.n || n) - 1) * (Wd - 44), Y = v => Ht - 16 - (clamp(v, yr[0], yr[1]) - yr[0]) / (yr[1] - yr[0]) * (Ht - 28);
  x.strokeStyle = '#e9ecef'; x.beginPath(); x.moveTo(34, Ht - 16); x.lineTo(Wd - 10, Ht - 16); x.moveTo(34, 8); x.lineTo(34, Ht - 16); x.stroke(); txt(x, String(yr[1]), 4, Y(yr[1]) + 4, '#868e96', 10); txt(x, String(yr[0]), 4, Y(yr[0]) + 4, '#868e96', 10); if (opt.ylab) txt(x, opt.ylab, 38, 12, '#868e96', 10); if (opt.xlab) txt(x, opt.xlab, Wd - 60, Ht - 3, '#868e96', 10);
  (opt.hlines || []).forEach(h => { x.strokeStyle = h.color; x.setLineDash([4, 3]); x.beginPath(); x.moveTo(34, Y(h.v)); x.lineTo(Wd - 10, Y(h.v)); x.stroke(); x.setLineDash([]); if (h.label) txt(x, h.label, Wd - 12, Y(h.v) - 3, h.color, 10, 'right'); });
  series.forEach(s => { x.strokeStyle = s.color; x.lineWidth = s.lw || 1.8; x.beginPath(); s.y.forEach((v, i) => i ? x.lineTo(X(i), Y(v)) : x.moveTo(X(i), Y(v))); x.stroke(); }); x.lineWidth = 1; return { X, Y }; }

/* ===================================================== 1.1 */
W.w2_linear_vs_mlp = function (box) {
  V.say(box, 'שלוש ספירלות כרוכות, 100 נקודות בכל אחת. משמאל — מסווג לינארי (רגרסיה לוגיסטית עם שלוש מחלקות); מימין — רשת עם שכבה נסתרת. <b>לחץ "אמן"</b> ותראה את שניהם לומדים בזמן אמת. ואז <b>כבה את ReLU</b> — ותראה מה נשאר מהרשת.');
  let act = 'relu', H = 64, q, p, steps = 0, timer = null;
  const sr = row(box); V.slider(sr, 'נוירונים בשכבה הנסתרת', 2, 128, 1, H, v => { H = v; reset(); }); V.tabs(box, ['עם ReLU', 'בלי ReLU (h = z1)'], k => { act = k ? 'none' : 'relu'; reset(); });
  V.btns(box, [['▶ אמן', () => go(), 'primary'], ['אפס', () => reset(), 'ghost']]);
  const fx = flex(box); const c0 = canvas(colm(fx, 'מסווג לינארי'), 300, 300, 300), c1 = canvas(colm(fx, 'רשת עם שכבה נסתרת'), 300, 300, 300); const out = V.say(box);
  function reset() { clearInterval(timer); timer = null; q = linear(); p = mlp(H); steps = 0; draw(); }
  function go() { if (timer) return; timer = setInterval(() => { if (!alive(box)) return clearInterval(timer); for (let k = 0; k < 40; k++) { linStep(q, 1.0); stepP(p, lossGrad(p, act).g, 1.0); } steps += 40; draw(); if (steps >= 2000) { clearInterval(timer); timer = null; } }, 30); }
  function draw() { paint(c0, linPred(q)); paint(c1, predict(p, act)); const la = linStep(Object.assign(linear(), { W: q.W.slice(), b: q.b.slice() }), 0), r = lossGrad(p, act);
    out.innerHTML = 'צעד ' + steps + '. לינארי: <b>' + Math.round(la * 100) + '%</b>. רשת' + (act === 'none' ? ' בלי ReLU' : '') + ': <b>' + Math.round(r.acc * 100) + '%</b>. ' + (steps < 2000 ? '' : act === 'none' ? badge(false, 'בדיוק כמו הלינארי') + ' — בלי פונקציה לא־לינארית באמצע, שתי מכפלות מטריצות הן מכפלה אחת. כל הגבולות קווים ישרים, כמה נוירונים שלא יהיו.' : H <= 3 ? 'עם ' + H + ' נוירונים בלבד, הרשת יכולה לכופף את המישור רק מעט.' : badge(true, 'הרשת עוקבת אחרי הספירלות') + ' — כל גבול בנוי מקטעים ישרים קטנים: כל נוירון עם ReLU הוא "קו שמתקפל", והשכבה השנייה מרכיבה מהם צורות.'); }
  reset();
};

/* ===================================================== 1.2 */
W.w2_forward = function (box) {
  V.say(box, 'המעבר קדימה, על נקודה אחת. <b>לחץ במישור</b> על נקודה. משמאל לימין: שני המספרים של הנקודה → 64 ערכים של ' + ltr('z1 = x·W1 + b1') + ' → אחרי ReLU (השליליים נמחקים, באפור) → 3 ציונים → סופטמקס. למטה: מה ש<b>נוירונים בודדים</b> "רואים" — כל אחד הוא חצי מישור מקופל.');
  let pt = [0.3, 0.4], useT = true;
  V.tabs(box, ['רשת מאומנת', 'רשת בתחילת האימון'], k => { useT = k === 0; draw(); });
  const fx = flex(box); const cP = canvas(colm(fx, 'לחץ על נקודה'), 240, 240, 240); const cB = canvas(colm(fx, 'השכבות'), 430, 240, 430); const fx2 = flex(box, 6); const cN = [0, 1, 2, 3, 4, 5].map(k => canvas(colm(fx2, ''), 90, 90, 90)); const out = V.say(box);
  cP.style.cursor = 'crosshair'; cP.addEventListener('click', e => { pt = toPlane(cP, e); draw(); });
  function draw() { const p = useT ? trained() : mlp(64), f = fwd(p, pt); paint(cP, predict(p), { res: 50 }); const x = cP.getContext('2d'); x.strokeStyle = '#000'; x.lineWidth = 2; x.beginPath(); x.arc((pt[0] + 1.1) / 2.2 * 240, (1.1 - pt[1]) / 2.2 * 240, 6, 0, 7); x.stroke();
    const b = cB.getContext('2d'); b.clearRect(0, 0, 430, 240); const mz = Math.max(1e-9, ...Array.from(f.z).map(Math.abs));
    txt(b, 'z1 (64)', 10, 14, '#495057', 11); txt(b, 'h = ReLU(z1)', 10, 104, '#495057', 11); for (let j = 0; j < 64; j++) { const v = f.z[j], hgt = Math.abs(v) / mz * 32; b.fillStyle = v >= 0 ? '#4263eb' : '#adb5bd'; b.fillRect(10 + j * 6, v >= 0 ? 55 - hgt : 55, 4, hgt); const hv = f.h[j] / mz * 32; b.fillStyle = hv > 0 ? '#4263eb' : '#e9ecef'; b.fillRect(10 + j * 6, 145 - hv, 4, Math.max(1, hv)); }
    const dead = Array.from(f.h).filter(v => v === 0).length; txt(b, dead + ' מתוך 64 נמחקו', 420, 104, '#868e96', 11, 'right');
    txt(b, 'scores', 10, 172, '#495057', 11); txt(b, 'softmax', 230, 172, '#495057', 11); const ms = Math.max(1, ...f.s.map(Math.abs)); f.s.forEach((v, c) => { b.fillStyle = 'rgb(' + COL[c].join(',') + ')'; const w = Math.abs(v) / ms * 80; b.fillRect(110 - (v < 0 ? w : 0), 182 + c * 18, w, 12); txt(b, F(v, 2), 200, 192 + c * 18, '#495057', 10, 'right'); b.fillStyle = 'rgb(' + COL[c].join(',') + ')'; b.fillRect(230, 182 + c * 18, f.pr[c] * 160, 12); txt(b, F(f.pr[c] * 100, 1) + '%', 420, 192 + c * 18, '#495057', 10, 'right'); });
    const p0 = trained(), idx = [3, 11, 19, 27, 40, 52]; cN.forEach((cv, k) => { const j = idx[k], c = cv.getContext('2d'), R = 30; let mx = 1e-9; const vals = []; for (let i = 0; i < R; i++) for (let jj = 0; jj < R; jj++) { const xx = -1.1 + 2.2 * (jj + 0.5) / R, yy = 1.1 - 2.2 * (i + 0.5) / R; const v = Math.max(0, xx * p.W1[j] + yy * p.W1[64 + j] + p.b1[j]); vals.push(v); mx = Math.max(mx, v); }
      vals.forEach((v, k2) => { const t = v / mx; c.fillStyle = 'rgb(' + Math.round(255 - 190 * t) + ',' + Math.round(255 - 160 * t) + ',' + Math.round(255 - 20 * t) + ')'; c.fillRect((k2 % R) * 3, ((k2 / R) | 0) * 3, 3, 3); }); cv.previousSibling.innerHTML = 'נוירון ' + j + ': ' + F(f.h[j], 2); c.strokeStyle = '#000'; c.beginPath(); c.arc((pt[0] + 1.1) / 2.2 * 90, (1.1 - pt[1]) / 2.2 * 90, 3, 0, 7); c.stroke(); });
    const win = f.pr.indexOf(Math.max(...f.pr)); out.innerHTML = 'הנקודה ' + ltr('(' + F(pt[0], 2) + ', ' + F(pt[1], 2) + ')') + ': הניבוי — מחלקה <b>' + win + '</b>, בביטחון ' + F(f.pr[win] * 100, 1) + '%. ' + (useT ? 'כל אחת מהמפות למטה היא <b>מאפיין</b> שהרשת בנתה: אפס בצד אחד של קו, ועולה לינארית בצד השני. השכבה השנייה מחברת 64 מאפיינים כאלה בשקלול — וזה מספיק כדי לצייר ספירלה.' : 'לפני האימון ההסתברויות קרובות לשליש־שליש־שליש — ולכן ההפסד ההתחלתי קרוב ל־' + ltr('ln 3 ≈ 1.099') + '.'); }
  draw();
};

/* ===================================================== 1.3 */
W.w2_backward = function (box) {
  V.say(box, 'המעבר לאחור, על נקודה אחת (ברשת בתחילת האימון). הגרדיאנט מתחיל ב־' + ltr('p − y') + ' — כמה כל הסתברות רחוקה מהתשובה — וזורם אחורה: כפל ב־' + ltr('W2ᵀ') + ', ואז <b>שער ה־ReLU</b>: לנוירונים שהיו כבויים (z1 ≤ 0) אין גרדיאנט בכלל. <b>לחץ במישור</b> ובחר את המחלקה הנכונה.');
  let pt = [0.3, 0.4], cls = 0;
  V.tabs(box, ['התשובה: מחלקה 0', 'מחלקה 1', 'מחלקה 2'], k => { cls = k; draw(); });
  const fx = flex(box); const cP = canvas(colm(fx, 'לחץ על נקודה'), 200, 200, 200); const cB = canvas(colm(fx, 'הגרדיאנטים, מהסוף להתחלה'), 470, 250, 470); const code = mono(box); const out = V.say(box);
  cP.style.cursor = 'crosshair'; cP.addEventListener('click', e => { pt = toPlane(cP, e); draw(); });
  const p = mlp(64);
  function draw() { paint(cP, predict(p), { res: 40 }); const x0 = cP.getContext('2d'); x0.strokeStyle = '#000'; x0.lineWidth = 2; x0.beginPath(); x0.arc((pt[0] + 1.1) / 2.2 * 200, (1.1 - pt[1]) / 2.2 * 200, 6, 0, 7); x0.stroke();
    const f = fwd(p, pt), ds = f.pr.map((v, c) => v - (c === cls ? 1 : 0)), dh = new Float64Array(64), dz = new Float64Array(64); for (let j = 0; j < 64; j++) { for (let c = 0; c < 3; c++) dh[j] += ds[c] * p.W2[j * 3 + c]; dz[j] = f.z[j] > 0 ? dh[j] : 0; }
    const b = cB.getContext('2d'); b.clearRect(0, 0, 470, 250); txt(b, 'd_scores = p − y', 460, 16, '#495057', 11, 'right'); ds.forEach((v, c) => { b.fillStyle = 'rgb(' + COL[c].join(',') + ')'; const w = Math.abs(v) * 90; b.fillRect(360 - (v < 0 ? w : 0), 24 + c * 14, w, 10); txt(b, F(v, 3), 465, 33 + c * 14, '#495057', 10, 'right'); });
    const m = Math.max(1e-9, ...Array.from(dh).map(Math.abs)); txt(b, 'd_h = d_scores · W2ᵀ', 460, 86, '#495057', 11, 'right'); txt(b, 'd_z1 = d_h · (z1 > 0)', 460, 176, '#495057', 11, 'right');
    for (let j = 0; j < 64; j++) { const v = dh[j] / m * 28; b.fillStyle = '#e8590c'; b.fillRect(10 + j * 6, v > 0 ? 130 - v : 130, 4, Math.abs(v)); const w = dz[j] / m * 28; b.fillStyle = f.z[j] > 0 ? '#e8590c' : '#e9ecef'; b.fillRect(10 + j * 6, f.z[j] > 0 ? (w > 0 ? 220 - w : 220) : 218, 4, f.z[j] > 0 ? Math.abs(w) : 4); }
    const off = Array.from(f.z).filter(v => v <= 0).length;
    code.textContent = 'd_scores = probs.copy(); d_scores[np.arange(n), y] -= 1   # [' + ds.map(v => F(v, 3).replace('−', '-')).join(', ') + ']\nd_h  = d_scores @ p["W2"].T\nd_z1 = d_h * (z1 > 0)                                   # ' + off + ' of 64 gradients are exactly 0';
    out.innerHTML = 'הרשת נותנת למחלקה הנכונה ' + F(f.pr[cls] * 100, 1) + '%, ולכן הגרדיאנט שלה ' + F(ds[cls], 3) + ' (שלילי: "תגדיל אותה"), ולשתיים האחרות חיובי ("תקטין"). <b>' + off + '</b> מתוך 64 הנוירונים היו כבויים בנקודה הזו — ובשורה התחתונה הם אפורים: הגרדיאנט שלהם אפס בדיוק. הם לא ילמדו כלום מהנקודה הזו. נוירון שכבוי <i>בכל</i> הנקודות לא ילמד לעולם: "נוירון מת" (פרק 11).'; }
  draw();
};

/* ===================================================== 1.4 */
W.w2_gradcheck = function (box) {
  V.say(box, 'בדיקת גרדיאנטים, על משקל אחד. הנגזרת המספרית: ' + ltr('(L(w + ε) − L(w − ε)) / 2ε') + '. <b>הזז את ε</b> — מימין ומשמאל לטווח הטוב השגיאה גדלה, מסיבות שונות. ואז <b>שתול באג</b> בגרדיאנט האנליטי, וראה שהבדיקה תופסת אותו.');
  let lgE = -5, prm = 'W1', bug = 0;
  V.slider(box, 'ε = 10^', -12, -1, 0.5, lgE, v => { lgE = v; draw(); }); V.tabs(box, ['W1', 'b1', 'W2', 'b2'], k => { prm = ['W1', 'b1', 'W2', 'b2'][k]; draw(); });
  V.tabs(box, ['בלי באג', 'שכחו לחלק ב־n', 'שכחו את מסכת ה־ReLU', 'שכחו את הגרדיאנט של b1'], k => { bug = k; draw(); });
  const cv = canvas(box, 640, 220, 640); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  const p = mlp(64); const BUG = [{}, { noDiv: true }, { noMask: true }, { noBias: true }];
  /* relative error over a handful of entries of one parameter, like the course's rel = max|ng − g| / (max|ng| + max|g|) */
  function rel(eps, name, b) { const a = lossGrad(p, 'relu', BUG[b]).g[name], idx = [0, 1, 2, 3, 5, 8, 13, 21].filter(i => i < p[name].length); let md = 0, mn = 0, ma = 0;
    idx.forEach(i => { const old = p[name][i]; p[name][i] = old + eps; const lp = lossOnly(p); p[name][i] = old - eps; const lm = lossOnly(p); p[name][i] = old; const ng = (lp - lm) / (2 * eps); md = Math.max(md, Math.abs(ng - a[i])); mn = Math.max(mn, Math.abs(ng)); ma = Math.max(ma, Math.abs(a[i])); });
    return md / Math.max(1e-300, mn + ma); }
  const curve = {}; function getCurve(name, b) { const k = name + b; if (curve[k]) return curve[k]; const c = []; for (let e = -12; e <= -1; e += 0.5) c.push([e, rel(10 ** e, name, b)]); return (curve[k] = c); }
  function draw() { const c = getCurve(prm, bug), x = cv.getContext('2d'); x.clearRect(0, 0, 640, 220); const X = e => 50 + (e + 12) / 11 * 570, Y = r => 200 - (Math.log10(Math.max(r, 1e-16)) + 16) / 16 * 185;
    [[1e-7, '#2f9e44', 'מצוין'], [1e-4, '#f59f00', 'סביר'], [1e-2, '#e03131', 'באג']].forEach(([v, col, l]) => { x.strokeStyle = col; x.setLineDash([4, 3]); x.beginPath(); x.moveTo(50, Y(v)); x.lineTo(625, Y(v)); x.stroke(); x.setLineDash([]); txt(x, l + ' (' + E(v, 0) + ')', 628, Y(v) + 4, col, 10, 'right'); });
    [-16, -12, -8, -4, 0].forEach(k => txt(x, '1e' + k, 6, Y(10 ** k) + 4, '#868e96', 10)); [-12, -10, -8, -6, -4, -2].forEach(e => txt(x, 'ε = 1e' + e, X(e) - 18, 216, '#868e96', 10));
    x.strokeStyle = '#4263eb'; x.lineWidth = 2; x.beginPath(); c.forEach(([e, r], i) => i ? x.lineTo(X(e), Y(r)) : x.moveTo(X(e), Y(r))); x.stroke(); const r0 = rel(10 ** lgE, prm, bug); x.fillStyle = '#e8590c'; x.beginPath(); x.arc(X(lgE), Y(r0), 5, 0, 7); x.fill(); x.lineWidth = 1;
    tb.innerHTML = table(['פרמטר', 'ε', 'שגיאה יחסית', 'הפסק'], [[prm, ltr('1e' + lgE), ltr(E(r0, 1)), r0 < 1e-7 ? badge(true, 'מצוין') : r0 < 1e-4 ? badge(true, 'סביר') : r0 < 1e-2 ? badge(false, 'חשוד') : badge(false, 'באג')]]);
    out.innerHTML = bug ? ['', 'הגרדיאנט האנליטי גדול פי 300 (מספר הנקודות) — השגיאה היחסית קרובה ל־1 בכל ε. הקוד רץ ואפילו לומד, אבל שגוי (תרגיל 1.2).', 'בלי המסכה, גם נוירונים כבויים מקבלים גרדיאנט. ' + (prm === 'W2' || prm === 'b2' ? 'אבל ב־' + prm + ' זה לא נראה — הבאג נמצא לפני השכבה הזו בשרשרת. בודקים <b>כל</b> פרמטר.' : 'הבדיקה תופסת את זה.'), prm === 'b1' ? 'הגרדיאנט של b1 אפס — השגיאה היחסית 1 בדיוק.' : 'בפרמטר הזה הכל תקין — הבאג רק ב־b1. שוב: בודקים כל פרמטר בנפרד.'][bug] :
      (lgE <= -9 ? 'ε קטן מדי: ' + ltr('L(w + ε)') + ' ו־' + ltr('L(w − ε)') + ' כמעט זהים, וההפרש ביניהם נבלע בדיוק המוגבל של מספר עשרוני (כ־16 ספרות). השגיאה עולה ככל ש־ε יורד.' : lgE >= -2.5 ? 'ε גדול מדי: הנגזרת המרכזית מניחה שההפסד כמעט ישר בין ' + ltr('w − ε') + ' ל־' + ltr('w + ε') + '. ב־ε גדול הוא מתעקם — ובמיוחד ReLU שובר אותו.' : 'הטווח הטוב: בערך ' + ltr('1e−4') + ' עד ' + ltr('1e−7') + '. הקורס משתמש ב־' + ltr('1e−5') + '.') + (prm === 'b1' ? ' ב־b1 השגיאה גבוהה יותר — נוירונים שהקלט שלהם ליד אפס חוצים את השבר של ReLU בזמן ההזזה.' : ''); }
  draw();
};

/* ===================================================== 1.5 */
W.w2_train_spiral = function (box) {
  V.say(box, 'האימון של הסעיף, בזמן אמת: 300 נקודות, 64 נוירונים, ירידת גרדיאנט על כל הנתונים. <b>שנה את קצב הלמידה ואת האתחול</b>, ולחץ "אמן". שים לב להפסד בצעד 0 — הקו האפור הוא ' + ltr('ln 3') + '.');
  let lr = 1.0, init = 'he', p, hist = [], acc = [], step = 0, timer = null;
  const sr = row(box); V.slider(sr, 'קצב הלמידה lr', 0.01, 20, 0.01, lr, v => { lr = v; }, v => F(v, 2));
  V.tabs(box, ['אתחול הה (של הקורס)', 'הכל אפס', 'הכל 0.5', 'קטן מאוד (0.01)', 'ענק (10)'], k => { init = ['he', 'zeros', 'const', 'tiny', 'huge'][k]; reset(); });
  V.btns(box, [['▶ אמן 3,000 צעדים', () => go(), 'primary'], ['אפס', () => reset(), 'ghost']]);
  const fx = flex(box); const c0 = canvas(colm(fx, 'הגבולות'), 280, 280, 280); const c1 = canvas(colm(fx, 'ההפסד'), 340, 280, 340); const out = V.say(box);
  function reset() { clearInterval(timer); timer = null; p = mlp(64, { init }); step = 0; const r = lossGrad(p); hist = [r.loss]; acc = [r.acc]; draw(); }
  function go() { if (timer) return; if (step >= 3000) reset(); timer = setInterval(() => { if (!alive(box)) return clearInterval(timer); for (let k = 0; k < 30 && step < 3000; k++) { const r = lossGrad(p); stepP(p, r.g, lr); step++; if (step % 10 === 0) { hist.push(r.loss); acc.push(r.acc); } } draw(); if (step >= 3000 || !isFinite(hist[hist.length - 1])) { clearInterval(timer); timer = null; } }, 20); }
  function draw() { paint(c0, predict(p), { res: 50 }); const L0 = hist[0]; lplot(c1, [{ y: hist.map(v => isFinite(v) ? v : 9), color: '#4263eb' }], [0, Math.max(1.5, Math.min(9, Math.ceil(L0 + 0.2)))], { n: 301, hlines: [{ v: Math.log(3), color: '#adb5bd', label: 'ln 3' }], ylab: 'הפסד', xlab: 'צעד →' });
    const last = hist[hist.length - 1], a = acc[acc.length - 1], ws = Array.from(p.W1); const sameCols = init === 'const' || init === 'zeros';
    out.innerHTML = 'צעד ' + step + ': הפסד <b>' + (isFinite(last) ? F(last, 3) : '∞') + '</b>, דיוק <b>' + Math.round(a * 100) + '%</b>. ההפסד בצעד 0: ' + F(L0, 3) + (Math.abs(L0 - Math.log(3)) < 0.05 ? ' — קרוב ל־ln 3, כמו שצריך.' : ' — <b>רחוק</b> מ־ln 3: האתחול גורם לרשת להיות בטוחה (ושגויה) כבר לפני שלמדה משהו.') + ' ' +
      (!isFinite(last) || last > 5 ? badge(false, 'האימון התפוצץ') + ' — קצב הלמידה גדול מדי (או המשקלות ענקיים): כל צעד עובר מעבר למינימום, וההפסד גדל.' : init === 'zeros' && step > 0 ? badge(false, 'תקוע ב־33%') + ' — עם הכל אפס, הגרדיאנט שזורם לשכבה הנסתרת הוא אפס, ושום דבר לא זז (תרגיל 1.3).' : init === 'const' && step > 0 ? badge(false, 'כל הנוירונים זהים') + ' — הם מתחילים זהים, מקבלים גרדיאנט זהה, ונשארים זהים. 64 נוירונים מתנהגים כמו אחד.' : step >= 3000 && a > 0.95 ? badge(true, 'למד') : lr < 0.1 && step >= 3000 ? 'קצב קטן: לומד, אבל לאט מאוד.' : ''); }
  reset();
};

/* ===================================================== chapter 2: PyTorch ===================================================== */
/* broadcasting rule (the same in NumPy and PyTorch): align the shapes from the right; each pair must be equal or contain a 1 */
function bshape(a, b, op) { if (op === '@') { if (a.length < 1 || b.length < 1) return { err: 'כפל מטריצות צריך לפחות ממד אחד בכל צד' }; const k1 = a[a.length - 1], k2 = b.length > 1 ? b[b.length - 2] : b[0]; if (k1 !== k2) return { err: 'הממד האחרון של השמאלי (' + k1 + ') חייב להיות שווה לממד הלפני־אחרון של הימני (' + k2 + ')' }; const out = a.slice(0, -1).concat(b.length > 1 ? [b[b.length - 1]] : []); return { out }; }
  const n = Math.max(a.length, b.length), A = Array(n - a.length).fill(null).concat(a), B = Array(n - b.length).fill(null).concat(b), out = [], pairs = [];
  for (let i = 0; i < n; i++) { const x = A[i], y = B[i]; let r, ok = true; if (x === null) r = y; else if (y === null) r = x; else if (x === y) r = x; else if (x === 1) r = y; else if (y === 1) r = x; else ok = false; pairs.push([x, y, ok, r]); if (!ok) return { err: 'בממד ' + (i - n) + ': ' + x + ' מול ' + y + ' — לא שווים ואף אחד מהם לא 1', pairs }; out.push(r); } return { out, pairs }; }
W.w2_tensor_shapes = function (box) {
  V.say(box, 'כל באג שלישי ב־PyTorch הוא באג של צורות. <b>בחר שני טנזורים ופעולה</b> — מהדוגמאות של הקורס, או כתוב צורות משלך — ותראה איך הספרייה מיישרת אותם מימין, ומה יוצא. ובצד: למה ברירת המחדל היא ' + ltr('float32') + '.');
  const EX = [['X @ W1 (סעיף 1.2)', '300,2', '@', '2,64'], ['z1 + b1 (הטיה)', '300,64', '+', '64'], ['תמונה − ממוצע (סעיף 2.5)', '3,240,320', '-', '3,1,1'], ['תמונה − ממוצע בלי view', '3,240,320', '-', '3'], ['P[:, :2] / P[:, 2] (באג)', '300,2', '/', '300'], ['מנה של תמונות @ משקל', '8,3,224,224', '*', '224,1']];
  let A = '300,2', B = '2,64', op = '@';
  const r1 = row(box); const iA = el('input', { value: A, style: { width: '120px', direction: 'ltr' } }), iB = el('input', { value: B, style: { width: '120px', direction: 'ltr' } }); const sel = el('select'); ['@', '+', '-', '*', '/'].forEach(o => sel.appendChild(el('option', { value: o, html: o }))); sel.value = op;
  r1.appendChild(el('span', { html: 'A:' })); r1.appendChild(iA); r1.appendChild(sel); r1.appendChild(el('span', { html: 'B:' })); r1.appendChild(iB); [iA, iB, sel].forEach(e => e.addEventListener('input', () => { A = iA.value; B = iB.value; op = sel.value; draw(); }));
  V.btns(box, EX.map(([t, a, o, b]) => [t, () => { iA.value = A = a; iB.value = B = b; sel.value = op = o; draw(); }, 'ghost']));
  const vis = el('div'); box.appendChild(vis); const code = mono(box); const out = V.say(box); const fl = el('div'); box.appendChild(fl);
  const parse = s => s.split(/[,\s]+/).filter(Boolean).map(Number).filter(v => v > 0 && Number.isInteger(v));
  function draw() { const a = parse(A), b = parse(B), r = bshape(a, b, op); const cell = (v, ok) => '<span style="display:inline-block;min-width:48px;padding:3px 6px;margin:2px;border-radius:6px;border:1px solid ' + (ok === false ? '#e03131' : '#ced4da') + ';background:' + (v === null ? '#f8f9fa' : ok === false ? '#fff5f5' : '#fff') + ';text-align:center">' + (v === null ? '·' : v) + '</span>';
    if (op !== '@' && r.pairs) vis.innerHTML = '<div style="direction:ltr;text-align:center;font-family:monospace">A &nbsp;' + r.pairs.map(p => cell(p[0], p[2])).join('') + '<br>B &nbsp;' + r.pairs.map(p => cell(p[1], p[2])).join('') + (r.out ? '<br>= &nbsp;' + r.out.map(v => cell(v)).join('') : '') + '</div>'; else vis.innerHTML = '';
    code.textContent = 'A = torch.zeros(' + a.join(', ') + ')\nB = torch.zeros(' + b.join(', ') + ')\nprint((A ' + op + ' B).shape)   # ' + (r.err ? 'RuntimeError' : 'torch.Size([' + r.out.join(', ') + '])');
    const mem = r.out ? r.out.reduce((s, v) => s * v, 1) * 4 : 0;
    out.innerHTML = r.err ? badge(false, 'שגיאה') + ' — ' + r.err + '. ' + (A === '300,2' && B === '300' ? 'וכאן ההבדל: עם 300 נקודות יש שגיאה, אבל עם <b>2</b> נקודות (300 → 2) הצורות היו מתיישרות — ' + ltr('(2, 2) / (2,)') + ' — והתוצאה הייתה שגויה בשקט (מודול 3, תרגיל 1.6). זו הסכנה של שידור.' : '') : badge(true, 'התוצאה: ' + ltr('(' + r.out.join(', ') + ')')) + ' — ' + F(mem / 1e6, mem > 1e6 ? 1 : 3) + ' מגה־בייט ב־float32. ' + (op === '@' ? 'בכפל מטריצות רק שני הממדים האחרונים "נאכלים"; ממדים קודמים (מנה) נשמרים.' : 'ממד שחסר מימין לשמאל, או שערכו 1, "נמתח" לגודל של השני — בלי להעתיק זיכרון.');
    const f32 = Math.fround; fl.innerHTML = table(['', 'float64 (NumPy)', 'float32 (PyTorch)'], [['0.1 + 0.2', (0.1 + 0.2).toPrecision(17), f32(f32(0.1) + f32(0.2)).toPrecision(9)], ['100,000,000 + 1', String(1e8 + 1), String(f32(f32(1e8) + 1))], ['זיכרון למיליון מספרים', '8 MB', '4 MB']]) + '<div class="note-small" style="text-align:center">float32 שומר כ־7 ספרות משמעותיות. לרשת זה מספיק — ובתמורה פי 2 פחות זיכרון ומהירות גבוהה בהרבה בכרטיס מסך.</div>'; }
  draw();
};

/* ===================================================== 2.2 */
W.w2_autograd = function (box) {
  V.say(box, 'גרף החישוב של ' + ltr('y = x² + 2x') + '. <b>"קדימה"</b> מחשב את הערכים בצמתים (ושומר אותם); <b>"backward"</b> הולך מהסוף להתחלה ומכפיל בנגזרת של כל צומת. לחץ backward <b>פעמיים</b> בלי לאפס — ותראה את המלכודת. אחר כך נסה ביטוי אחר.');
  const EXPR = [['x² + 2x', x => [['a = x²', x * x, 2 * x], ['b = 2·x', 2 * x, 2], ['y = a + b', x * x + 2 * x, 1]], x => 2 * x + 2], ['x³ − 4x (תרגיל 2.1)', x => [['a = x³', x ** 3, 3 * x * x], ['b = 4·x', 4 * x, 4], ['y = a − b', x ** 3 - 4 * x, 1]], x => 3 * x * x - 4], ['relu(x) · x', x => [['a = relu(x)', Math.max(0, x), x > 0 ? 1 : 0], ['y = a · x', Math.max(0, x) * x, 1]], x => x > 0 ? 2 * x : 0]];
  let k = 0, x = 3, grad = 0, calls = 0, noGrad = false;
  V.tabs(box, EXPR.map(e => e[0]), i => { k = i; grad = 0; calls = 0; draw(); }); V.slider(box, 'x', -3, 4, 0.5, x, v => { x = v; draw(); });
  V.btns(box, [['\u202Ay.backward()\u202C', () => { if (noGrad) return; grad += EXPR[k][2](x); calls++; draw(); }, 'primary'], ['\u202Ax.grad.zero_()\u202C', () => { grad = 0; calls = 0; draw(); }, 'ghost']]); V.tabs(box, ['חישוב רגיל', '\u202Awith torch.no_grad():\u202C'], i => { noGrad = i === 1; grad = 0; calls = 0; draw(); });
  const cv = canvas(box, 640, 200, 640); const code = mono(box); const out = V.say(box);
  function draw() { const nodes = EXPR[k][1](x), c = cv.getContext('2d'); c.clearRect(0, 0, 640, 200); const n = nodes.length, X = i => 110 + i * (480 / n);
    const box2 = (bx, by, t, v, g, col) => { c.fillStyle = '#fff'; c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.roundRect(bx - 55, by - 26, 110, 52, 8); c.fill(); c.stroke(); txt(c, t, bx, by - 8, '#212529', 12, 'center'); txt(c, '= ' + F(v, 2), bx, by + 8, '#1c7ed6', 12, 'center'); if (g != null) txt(c, 'grad ' + F(g, 2), bx, by + 22, '#e8590c', 11, 'center'); };
    box2(X(0) - 20, 100, 'x', x, noGrad ? null : calls ? grad : null, '#495057'); nodes.forEach((nd, i) => { box2(X(i + 1), i === n - 1 ? 100 : 50 + i * 100 / Math.max(1, n - 1), nd[0], nd[1], noGrad || !calls ? null : null, i === n - 1 ? '#2f9e44' : '#adb5bd'); });
    c.strokeStyle = '#adb5bd'; nodes.forEach((nd, i) => { c.beginPath(); c.moveTo(X(0) + 35, 100); c.lineTo(X(i + 1) - 55, i === n - 1 ? 100 : 50 + i * 100 / Math.max(1, n - 1)); c.stroke(); });
    if (!noGrad) { txt(c, '← הגרדיאנט זורם מהסוף להתחלה: dy/dx = ' + F(EXPR[k][2](x), 2), 620, 190, '#e8590c', 12, 'right'); } else txt(c, 'no_grad: לא נבנה גרף, אין backward', 620, 190, '#868e96', 12, 'right');
    code.textContent = (noGrad ? 'x = torch.tensor(' + x + ', requires_grad=True)\nwith torch.no_grad():\n    y = ...                # ' + EXPR[k][0] + '\nprint(y.requires_grad)     # False — y.backward() would raise an error' : 'x = torch.tensor(' + x + ', requires_grad=True)\ny = ...                    # ' + EXPR[k][0] + '\n' + 'y.backward()\n'.repeat(Math.max(1, calls)) + 'print(x.grad)              # tensor(' + F(calls ? grad : EXPR[k][2](x), 1).replace('−', '-') + ')');
    out.innerHTML = noGrad ? 'בתוך ' + ltr('torch.no_grad()') + ' הספרייה לא רושמת את הפעולות — חוסך זיכרון וזמן. משתמשים בזה בהערכה ובהסקה, ובעדכון המשקלות עצמו (פרק 3).' : calls === 0 ? 'לחץ backward. הנגזרת האנליטית ב־x = ' + x + ': ' + F(EXPR[k][2](x), 2) + '.' : calls === 1 ? badge(true, 'x.grad = ' + F(grad, 2)) + ' — בדיוק הנגזרת. עכשיו לחץ שוב בלי לאפס.' : badge(false, 'x.grad = ' + F(grad, 2) + ' = ' + calls + ' × ' + F(EXPR[k][2](x), 2)) + ' — הגרדיאנטים <b>מצטברים</b>: כל backward <i>מוסיף</i> ל־x.grad. בלולאת אימון, בלי איפוס בכל צעד, הגרדיאנט של צעד 100 הוא סכום של 100 צעדים. לכן כל לולאה מתחילה ב־' + ltr('optimizer.zero_grad()') + '.'; }
  draw();
};

/* ===================================================== 2.3 */
W.w2_np_vs_torch = function (box) {
  V.say(box, 'הקוד של הסעיף, שהורץ במחשב עם PyTorch 2.15: הגרדיאנטים שכתבת ביד בפרק 1 מול אלה של ' + ltr('loss.backward()') + '. ואז הבאג של תרגיל 2.2 — <b>סופטמקס לפני ' + ltr('cross_entropy') + '</b> — שרץ כאן על אותה רשת, בזמן אמת.');
  let dbl = false, timer = null, pA, pB, hA = [], hB = [], st = 0;
  V.tabs(box, ['F.cross_entropy(scores, y) — נכון', 'F.cross_entropy(softmax(scores), y) — באג'], k => { dbl = k === 1; reset(); });
  V.btns(box, [['▶ אמן את שתיהן 1,000 צעדים', () => go(), 'primary']]);
  const tb = el('div'); box.appendChild(tb); const fx = flex(box); const c0 = canvas(colm(fx, 'ההפסד: נכון (כחול) מול הגרסה שנבחרה (כתום)'), 420, 200, 420); const c1 = canvas(colm(fx, 'הגבולות בגרסה שנבחרה'), 200, 200, 200); const out = V.say(box);
  /* the "double softmax" loss: cross-entropy applied to probabilities that were already a softmax */
  function lossGradD(p) { const H = p.H, g = { W1: new Float64Array(2 * H), b1: new Float64Array(H), W2: new Float64Array(H * 3), b2: new Float64Array(3) }; let loss = 0, acc = 0;
    for (let i = 0; i < N; i++) { const f = fwd(p, XS[i]), y = YS[i], q = f.pr; const m = Math.max(...q), e = q.map(v => Math.exp(v - m)), S = e[0] + e[1] + e[2], r = e.map(v => v / S); loss -= Math.log(r[y]); if (q[y] >= m) acc++;
      const dq = r.map((v, c) => (v - (c === y ? 1 : 0)) / N), dot = dq[0] * q[0] + dq[1] * q[1] + dq[2] * q[2], ds = q.map((v, c) => v * (dq[c] - dot));
      for (let c = 0; c < 3; c++) { g.b2[c] += ds[c]; for (let j = 0; j < H; j++) g.W2[j * 3 + c] += f.h[j] * ds[c]; }
      for (let j = 0; j < H; j++) { let dh = 0; for (let c = 0; c < 3; c++) dh += ds[c] * p.W2[j * 3 + c]; const dz = f.z[j] > 0 ? dh : 0; g.b1[j] += dz; g.W1[j] += XS[i][0] * dz; g.W1[H + j] += XS[i][1] * dz; } }
    return { loss: loss / N, acc: acc / N, g }; }
  function reset() { clearInterval(timer); timer = null; pA = mlp(64); pB = mlp(64); st = 0; hA = [lossGrad(pA).loss]; hB = [(dbl ? lossGradD(pB) : lossGrad(pB)).loss]; draw(); }
  function go() { if (timer) return; if (st >= 1000) reset(); timer = setInterval(() => { if (!alive(box)) return clearInterval(timer); for (let k = 0; k < 25 && st < 1000; k++) { const a = lossGrad(pA), b = dbl ? lossGradD(pB) : lossGrad(pB); stepP(pA, a.g, 1); stepP(pB, b.g, 1); st++; if (st % 10 === 0) { hA.push(a.loss); hB.push(b.loss); } } draw(); if (st >= 1000) { clearInterval(timer); timer = null; } }, 20); }
  function draw() { const g1 = lossGrad(pA).g, g2 = (dbl ? lossGradD(pB) : lossGrad(pB)).g; const nm = g => Math.sqrt(['W1', 'b1', 'W2', 'b2'].reduce((s, k) => s + Array.from(g[k]).reduce((t, v) => t + v * v, 0), 0));
    tb.innerHTML = table(['פרמטר', 'ההפרש הגדול ביותר: ידני מול PyTorch (מההרצה)'], [['W1', ltr('1.4e−17')], ['b1', ltr('4.2e−17')], ['W2', ltr('8.3e−17')], ['b2', ltr('8.8e−17')]]) + '<div class="note-small" style="text-align:center">עשר בחזקת מינוס 17 — שגיאת העיגול של float64. כלומר: <b>זהים</b>. ה־backward של הספרייה מחשב בדיוק את מה שכתבת בסעיף 1.3.</div>';
    lplot(c0, [{ y: hA, color: '#4263eb' }, { y: hB, color: '#e8590c' }], [0, 1.2], { n: 101, hlines: [{ v: Math.log(3), color: '#adb5bd', label: 'ln 3' }], xlab: 'צעד →' }); paint(c1, predict(pB), { res: 40 });
    const la = hA[hA.length - 1], lb = hB[hB.length - 1]; out.innerHTML = 'צעד ' + st + '. ' + (dbl ? 'אורך הגרדיאנט בגרסה הבאגית: ' + E(nm(g2), 1) + ', בנכונה: ' + E(nm(g1), 1) + '. ' + badge(false, 'אין שום הודעת שגיאה') + ' — אבל ההפסד תקוע ליד ' + ltr('ln 3') + ': אחרי הסופטמקס הראשון כל ה"ציונים" בין 0 ל־1, והסופטמקס השני הופך אותם להסתברויות כמעט שוות. הרשת עדיין יכולה לשפר את הדיוק לאט, אבל ההפסד לא יכול לרדת הרבה — ' + F(lb, 3) + ' מול ' + F(la, 3) + '. הכלל: ' + ltr('cross_entropy') + ' מקבלת <b>ציונים גולמיים</b> (logits).' : 'שתי הרשתות זהות — הקו הכתום מוסתר מתחת לכחול.'); }
  reset();
};

/* ===================================================== 2.4 */
W.w2_gpu_async = function (box) {
  V.say(box, 'למה צריך ' + ltr('synchronize') + '. המעבד (למעלה) <b>שולח</b> פקודות; הכרטיס (למטה) <b>מבצע</b> אותן בתור, ברקע. השעון של פייתון רץ על המעבד. <b>בחר גודל מטריצה, והפעל או כבה את synchronize</b> — ותראה מה השעון מודד.');
  let n = 4096, sync = true, dev = 1;
  V.slider(box, 'גודל המטריצה n (n × n)', 256, 8192, 256, n, v => { n = v; draw(); }); V.tabs(box, ['עם \u202Atorch.cuda.synchronize()\u202C', 'בלי'], k => { sync = k === 0; draw(); }); V.tabs(box, ['מעבד (המדידה שלך)', 'כרטיס מסך (הערכה)'], k => { dev = k; draw(); }, 1);
  const cv = canvas(box, 640, 170, 640); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  /* measured on the user's computer: 4096³ multiply–adds in ~1.24 s → ~111 GFLOP/s on the CPU. GPU: an assumption of 20 TFLOP/s and a 12 GB/s copy */
  const CPU = 2 * 4096 ** 3 / 1.24, GPU = 20e12, PCIE = 12e9;
  function draw() { const flop = 2 * n ** 3, tc = flop / CPU, tg = flop / GPU, tx = 2 * n * n * 4 / PCIE, launch = 20e-6; const c = cv.getContext('2d'); c.clearRect(0, 0, 640, 170);
    if (dev === 0) { const W2 = 560 / tc; c.fillStyle = '#4263eb'; c.fillRect(40, 40, tc * W2, 30); txt(c, 'המעבד מחשב בעצמו: ' + F(tc * 1000, 1) + ' ms', 40, 30, '#212529', 12); txt(c, 'על מעבד אין "רקע": הפקודה חוזרת רק כשהחישוב נגמר, ו־synchronize לא רלוונטי.', 40, 110, '#868e96', 11);
      tb.innerHTML = table(['n', 'פעולות', 'זמן (מעבד)'], [[n, E(flop, 1), F(tc * 1000, 1) + ' ms']]); out.innerHTML = 'הקצב נמדד אצלך: מטריצה של 4096 — 1.24 שניות, כלומר כ־' + F(CPU / 1e9, 0) + ' מיליארד פעולות בשנייה. כפל מטריצות עולה <span class="ltr">2n³</span>: פי 2 ב־n — פי 8 בזמן.'; return; }
    const total = launch + tg, sc = 560 / Math.max(total * 1.15, 1e-6); c.fillStyle = '#868e96'; c.fillRect(40, 40, Math.max(2, launch * sc), 24); txt(c, 'מעבד: שולח', 40, 32, '#495057', 11); c.fillStyle = '#2f9e44'; c.fillRect(40 + launch * sc, 100, tg * sc, 24); txt(c, 'כרטיס: מחשב ' + F(tg * 1000, 2) + ' ms', 40 + launch * sc, 92, '#2f9e44', 11);
    const stop = sync ? total : launch; c.strokeStyle = '#e03131'; c.lineWidth = 2; c.beginPath(); c.moveTo(40 + stop * sc, 20); c.lineTo(40 + stop * sc, 150); c.stroke(); txt(c, 'השעון נעצר: ' + (stop * 1000 < 0.1 ? F(stop * 1e6, 0) + ' µs' : F(stop * 1000, 2) + ' ms'), Math.min(600, 44 + stop * sc), 150, '#e03131', 11); c.lineWidth = 1;
    tb.innerHTML = table(['n', 'מעבד (נמדד)', 'כרטיס (הערכה, 20 TFLOP/s)', 'העתקה למעבד וחזרה (12 GB/s)'], [[n, F(tc * 1000, 1) + ' ms', F(tg * 1000, 2) + ' ms', F(tx * 1000, 2) + ' ms']]);
    out.innerHTML = (sync ? badge(true, 'מדידה נכונה') + ' — השעון מחכה שהכרטיס יסיים.' : badge(false, 'מדידה שגויה') + ' — השעון עצר אחרי ' + F(launch * 1e6, 0) + ' מיקרו־שניות: הזמן לשלוח את הפקודה. החישוב עוד רץ. בלי synchronize "הכרטיס מהיר פי מיליון" — ולא נכון.') + ' ' + (tx > tg ? 'וגם: כאן ההעתקה בין המעבד לכרטיס (' + F(tx * 1000, 1) + ' ms) יקרה מהחישוב עצמו (' + F(tg * 1000, 1) + ' ms) — לכן מעבירים נתונים פעם אחת, ועושים עליהם הרבה חישובים ברצף.' : 'הכרטיס מהיר מהמעבד פי ' + F(tc / tg, 0) + ' (בהערכה).') + ' <i>(בלי כרטיס במחשב שלך, מספרי הכרטיס הם הערכה מקובלת, לא מדידה.)</i>'; }
  draw();
};

/* ===================================================== 2.5 */
W.w2_img_to_tensor = function (box) {
  V.say(box, 'מתמונה של OpenCV לטנזור שמודל מאומן מצפה לו — חמישה שלבים. <b>עבור על השלבים</b>, ו<b>לחץ על פיקסל</b> כדי לעקוב אחרי שלושת המספרים שלו. אחר כך <b>"שכח"</b> שלב ותראה מה המודל היה מקבל.');
  let stp = 0, forget = -1, px = [60, 40]; const Wd = 120, Ht = 80;
  const img = IM.color(Wd, Ht); for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) { const i = 3 * (y * Wd + x), sky = y < 34; let b = sky ? 200 : 60, g = sky ? 160 : 140, r = sky ? 90 : 70; if ((x - 60) ** 2 + (y - 40) ** 2 < 300) { b = 0; g = 140; r = 255; } img.d[i] = b; img.d[i + 1] = g; img.d[i + 2] = r; }
  V.tabs(box, ['1. imread (BGR, HWC, 0–255)', '2. BGR → RGB', '3. permute → CHW', '4. / 255', '5. נרמול', '6. unsqueeze'], k => { stp = k; draw(); });
  V.tabs(box, ['כל השלבים', 'שכחו BGR→RGB', 'שכחו / 255', 'שכחו נרמול'], k => { forget = [-1, 1, 3, 4][k]; draw(); });
  const fx = flex(box); const c0 = IM.canvas(colm(fx, 'התמונה (לחץ על פיקסל)'), Wd, Ht, 2.4); const cC = [0, 1, 2].map(k => IM.canvas(colm(fx, ''), Wd, Ht, 1.2)); const code = mono(box); const out = V.say(box);
  c0.style.cursor = 'crosshair'; c0.addEventListener('click', e => { const r = c0.getBoundingClientRect(); px = [Math.floor((e.clientX - r.left) / r.width * Wd), Math.floor((e.clientY - r.top) / r.height * Ht)]; draw(); });
  const MEAN = [0.485, 0.456, 0.406], STD = [0.229, 0.224, 0.225];
  function draw() { const on = s => stp >= s && forget !== s; const val = (x, y) => { const i = 3 * (y * Wd + x); let v = [img.d[i], img.d[i + 1], img.d[i + 2]]; if (on(1)) v = [v[2], v[1], v[0]]; if (on(3)) v = v.map(t => t / 255); if (on(4)) v = v.map((t, c) => (t - MEAN[c]) / STD[c]); return v; };
    const ctx = IM.show(c0, img); ctx.strokeStyle = '#000'; ctx.strokeRect(px[0] - 2.5, px[1] - 2.5, 6, 6);
    const names = on(1) ? ['R', 'G', 'B'] : ['B', 'G', 'R']; cC.forEach((cv, c) => { const g = IM.gray(Wd, Ht); let lo = Infinity, hi = -Infinity; for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) { const v = val(x, y)[c]; g.d[y * Wd + x] = v; lo = Math.min(lo, v); hi = Math.max(hi, v); }
      const sc = IM.gray(Wd, Ht); for (let k = 0; k < g.d.length; k++) sc.d[k] = stp >= 3 && forget !== 3 ? clamp((g.d[k] - (on(4) ? -2.2 : 0)) / (on(4) ? 4.9 : 1) * 255, 0, 255) : clamp(g.d[k], 0, 255); IM.show(cv, sc); cv.previousSibling.innerHTML = (stp >= 2 ? 'ערוץ ' + c + ' (' + names[c] + ')' : 'ערוץ ' + names[c]) + ': ' + F(lo, 2) + ' עד ' + F(hi, 2); });
    const v = val(px[0], px[1]), shape = stp >= 5 ? '(1, 3, 80, 120)' : stp >= 2 ? '(3, 80, 120)' : '(80, 120, 3)';
    code.textContent = ['img = cv2.imread("photo.jpg")                       # ' + shape + ' uint8, BGR', 'rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)', 't = torch.from_numpy(rgb).permute(2, 0, 1)          # ' + shape, 't = t.float() / 255.0', 't = (t - mean) / std                                # mean, std: shape (3, 1, 1)', 'batch = t.unsqueeze(0)                              # ' + shape][stp] + '\n# pixel (' + px[0] + ', ' + px[1] + '): [' + v.map(t => F(t, stp >= 3 ? 3 : 0).replace('−', '-')).join(', ') + ']';
    out.innerHTML = 'הצורה: ' + ltr(shape) + '. הפיקסל: ' + ltr('[' + v.map(t => F(t, stp >= 3 ? 3 : 0)).join(', ') + ']') + '. ' + (forget === 1 && stp >= 1 ? badge(false, 'אדום וכחול התחלפו') + ' — הכדור הכתום נראה למודל כחול. מודל שאומן על RGB יראה כאן "שמיים" ו"מים" במקומות הלא נכונים, בלי שום שגיאה.' : forget === 3 && stp >= 3 ? badge(false, 'ערכים עד 255') + ' — אחרי הנרמול הם יגיעו למאות, במקום בערך ' + ltr('−2…+2.6') + ' שהמודל אומן עליהם. הוא יחזיר שטויות בביטחון מלא.' : forget === 4 && stp >= 4 ? badge(false, 'בלי נרמול') + ' — הערכים 0 עד 1 במקום ממורכזים סביב 0. מודל מאומן יעבוד, אבל גרוע יותר באופן שקשה לזהות — וזה המסוכן מכולם.' : ['OpenCV: גובה, רוחב, ערוצים, וסדר BGR.', 'עכשיו אדום ראשון. הצורה לא השתנתה.', 'permute לא מזיז אף מספר בזיכרון — רק משנה את סדר הקריאה. עכשיו כל ערוץ הוא "תמונה" נפרדת.', 'מספרים עשרוניים בין 0 ל־1.', 'כל ערוץ ממורכז לפי הממוצע של ImageNet: ערוץ ממוצע הופך ל־0.', 'ממד מנה בהתחלה: מודל תמיד מקבל מנה, גם של תמונה אחת.'][stp]); }
  draw();
};

/* ===================================================== chapter 3: the training loop ===================================================== */
/* a held-out split of the spiral: 2/3 for training, 1/3 for validation (fixed shuffle) */
const SPLIT = (() => { const r = NN.rng(99), idx = [...Array(N).keys()]; for (let i = N - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; } return { tr: idx.slice(0, 200), va: idx.slice(200) }; })();
/* loss and gradients on a subset of points (a batch) */
function lossGradIdx(p, idx) { const H = p.H, g = { W1: new Float64Array(2 * H), b1: new Float64Array(H), W2: new Float64Array(H * 3), b2: new Float64Array(3) }; let loss = 0, acc = 0; const n = idx.length;
  for (const i of idx) { const x = XS[i], y = YS[i], f = fwd(p, x); loss -= Math.log(Math.max(f.pr[y], 1e-300)); if (f.pr[y] >= Math.max(...f.pr)) acc++; const ds = f.pr.map((v, c) => (v - (c === y ? 1 : 0)) / n);
    for (let c = 0; c < 3; c++) { g.b2[c] += ds[c]; for (let j = 0; j < H; j++) g.W2[j * 3 + c] += f.h[j] * ds[c]; }
    for (let j = 0; j < H; j++) { let dh = 0; for (let c = 0; c < 3; c++) dh += ds[c] * p.W2[j * 3 + c]; const dz = f.z[j] > 0 ? dh : 0; g.b1[j] += dz; g.W1[j] += x[0] * dz; g.W1[H + j] += x[1] * dz; } }
  return { loss: loss / n, acc: acc / n, g }; }
function shuffled(arr, r) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function paintSplit(cv, pred) { paint(cv, pred, { res: 45 }); const x = cv.getContext('2d'), Wd = cv.width, Ht = cv.height; SPLIT.va.forEach(i => { const p = XS[i]; x.strokeStyle = '#000'; x.lineWidth = 1.2; x.beginPath(); x.arc((p[0] + 1.1) / 2.2 * Wd, (1.1 - p[1]) / 2.2 * Ht, 3.2, 0, 7); x.stroke(); }); }

/* ===================================================== 3.1 */
W.w2_batches = function (box) {
  V.say(box, 'אותה רשת, אותם נתונים — ושלושה גדלי מנה. 200 נקודות לאימון, ו־100 לוולידציה (עם מסגרת שחורה) שהרשת <b>אף פעם לא רואה</b> באימון. <b>בחר גודל מנה ולחץ "אמן 30 סבבים"</b>. שים לב לשני דברים: כמה צעדים יש בכל סבב, וכמה רועש ההפסד של כל צעד.');
  let B = 32, p, hist = [], ep = 0, steps = 0, timer = null, va = [], tr = []; const r = NN.rng(5);
  V.tabs(box, ['מנה של 1', 'מנה של 8', 'מנה של 32', 'כל 200 (כמו בפרק 1)'], k => { B = [1, 8, 32, 200][k]; reset(); }, 2);
  V.btns(box, [['▶ אמן 30 סבבים', () => go(), 'primary'], ['אפס', () => reset(), 'ghost']]);
  const fx = flex(box); const c0 = canvas(colm(fx, 'הגבולות; עם מסגרת — וולידציה'), 240, 240, 240); const c1 = canvas(colm(fx, 'הפסד של כל צעד (אפור) ובסוף כל סבב (כחול: אימון, כתום: וולידציה)'), 400, 240, 400); const out = V.say(box);
  function reset() { clearInterval(timer); timer = null; p = mlp(64, { seed: 3 }); hist = []; tr = []; va = []; ep = 0; steps = 0; draw(); }
  function go() { if (timer) return; if (ep >= 30) reset(); timer = setInterval(() => { if (!alive(box)) return clearInterval(timer); const order = shuffled(SPLIT.tr, r); for (let i = 0; i < order.length; i += B) { const res = lossGradIdx(p, order.slice(i, i + B)); stepP(p, res.g, B === 1 ? 0.05 : B === 8 ? 0.3 : 1.0); hist.push(res.loss); steps++; }
    ep++; tr.push(lossGradIdx(p, SPLIT.tr).loss); va.push(lossGradIdx(p, SPLIT.va)); draw(); if (ep >= 30) { clearInterval(timer); timer = null; } }, 60); }
  function draw() { paintSplit(c0, predict(p)); const x = c1.getContext('2d'); x.clearRect(0, 0, 400, 240); const Y = v => 220 - Math.min(v, 1.6) / 1.6 * 200, nS = Math.max(1, hist.length); x.strokeStyle = 'rgba(134,142,150,.45)'; x.beginPath(); hist.forEach((v, i) => { const X = 30 + i / Math.max(1, (30 * Math.ceil(200 / B)) - 1) * 360; i ? x.lineTo(X, Y(v)) : x.moveTo(X, Y(v)); }); x.stroke();
    [[tr, '#4263eb'], [va.map(v => v.loss), '#e8590c']].forEach(([a, col]) => { x.strokeStyle = col; x.lineWidth = 2; x.beginPath(); a.forEach((v, i) => { const X = 30 + (i + 1) / 30 * 360; i ? x.lineTo(X, Y(v)) : x.moveTo(X, Y(v)); }); x.stroke(); x.lineWidth = 1; }); txt(x, '1.6', 4, 24, '#868e96', 10); txt(x, '0', 18, 222, '#868e96', 10); txt(x, 'סבב 30', 395, 236, '#868e96', 10, 'right');
    const spe = Math.ceil(200 / B), vacc = va.length ? va[va.length - 1].acc : 0;
    out.innerHTML = 'מנה של ' + B + ': <b>' + spe + '</b> צעדים בכל סבב' + (200 % B ? ' (האחרונה של ' + (200 % B) + ')' : '') + '. אחרי ' + ep + ' סבבים: ' + steps + ' צעדים, דיוק <b>וולידציה</b> ' + Math.round(vacc * 100) + '%. ' + (ep < 30 ? '' : B === 200 ? 'צעד אחד בסבב, וחלק — אבל רק 30 צעדים בסך הכל. במאגר אמיתי, צעד כזה גם לא נכנס לזיכרון.' : B === 1 ? 'מנה של נקודה אחת: 200 צעדים בסבב, והגרדיאנט של כל אחד רועש מאוד (האפור קופץ). צריך קצב קטן כדי שזה לא יתפזר.' : 'פשרה: הרבה צעדים בכל סבב, וכל צעד מספיק מדויק. הרעש באפור — הגרדיאנט של מנה הוא רק <i>הערכה</i> של הגרדיאנט האמיתי.') + ' ההפסד על הוולידציה (כתום) הוא המספר שמעניין: הוא מודד נקודות שהרשת לא למדה מהן.'; }
  reset();
};

/* ===================================================== 3.2 */
W.w2_dataloader = function (box) {
  V.say(box, 'מה עושה <code class="ltr">DataLoader</code> בכל סבב: מערבב את <b>האינדקסים</b>, חותך אותם למנות, ולכל מנה קורא ל־<code class="ltr">dataset[i]</code> על כל אינדקס ומחבר את התוצאות לטנזור אחד. <b>שנה את גודל המאגר והמנה</b>, ולחץ "סבב חדש" כדי לראות סדר אחר.');
  let n = 30, B = 8, shuffle = true, drop = false, seed = 1;
  const sr = row(box); V.slider(sr, 'גודל המאגר', 5, 60, 1, n, v => { n = v; draw(); }); V.slider(sr, 'batch_size', 1, 32, 1, B, v => { B = v; draw(); });
  V.tabs(box, ['shuffle=True', 'shuffle=False'], k => { shuffle = k === 0; draw(); }); V.tabs(box, ['drop_last=False', 'drop_last=True'], k => { drop = k === 1; draw(); });
  V.btns(box, [['סבב חדש', () => { seed++; draw(); }, 'primary']]);
  const vis = el('div', { style: { direction: 'ltr', fontFamily: 'monospace', fontSize: '12px', lineHeight: '2' } }); box.appendChild(vis); const calc = el('div'); box.appendChild(calc); const out = V.say(box);
  function draw() { const idx = [...Array(n).keys()], order = shuffle ? shuffled(idx, NN.rng(seed * 13)) : idx, batches = []; for (let i = 0; i < n; i += B) batches.push(order.slice(i, i + B)); if (drop && batches.length && batches[batches.length - 1].length < B) batches.pop();
    const colB = k => ['#e7f5ff', '#fff4e6', '#ebfbee', '#f3f0ff', '#fff0f6', '#e6fcf5'][k % 6];
    vis.innerHTML = batches.map((b, k) => '<div><span style="color:#868e96">batch ' + k + ' (' + b.length + '):</span> ' + b.map(i => '<span style="display:inline-block;min-width:22px;text-align:center;margin:1px;border-radius:4px;background:' + colB(k) + ';border:1px solid #dee2e6">' + i + '</span>').join('') + '</div>').join('') + (drop && n % B ? '<div style="color:#c92a2a">נזרקו: ' + order.slice(Math.floor(n / B) * B).join(', ') + '</div>' : '');
    const nb = drop ? Math.floor(n / B) : Math.ceil(n / B); calc.innerHTML = table(['מאגר', 'מנה', 'מנות בסבב', 'המנה האחרונה'], [[n, B, nb, drop || n % B === 0 ? B : n % B], ['54,000 (סעיף 3.6)', 128, Math.ceil(54000 / 128), 54000 - 421 * 128], ['2,400 (סעיף 3.2)', 64, Math.ceil(2400 / 64), 2400 - 37 * 64]]);
    out.innerHTML = (shuffle ? 'בכל סבב סדר אחר — כך המנות שונות בכל פעם, והרשת לא לומדת משהו מהסדר עצמו. ' : 'בלי ערבוב: אותן מנות בכל סבב. באימון זה רע — אם המאגר ממוין לפי מחלקה, כל מנה היא מחלקה אחת. בוולידציה זה בסדר, ולכן שם ' + ltr('shuffle=False') + '. ') + (drop ? 'drop_last זורק את המנה החלקית — שימושי כשמנה קטנה מדי מפריעה (נרמול מנה, פרק 8).' : n % B ? 'המנה האחרונה קטנה יותר (' + (n % B) + '). זה בסדר: ההפסד הוא ממוצע, והצעד שלה פשוט רועש יותר.' : ''); }
  draw();
};

/* ===================================================== 3.3 */
W.w2_mlp_params = function (box) {
  V.say(box, 'בונה מודלים: כל שורה היא שכבה. ' + ltr('nn.Linear(a, b)') + ' מחזיקה מטריצה של <span class="ltr">a × b</span> ועוד <span class="ltr">b</span> הטיות. <b>בחר מודל או שנה את הגדלים</b> — ותראה איפה הפרמטרים יושבים, וכמה זיכרון הם תופסים.');
  const PRE = [['הספירלות (סעיף 3.3)', [2, 64, 3]], ['פריטי לבוש (סעיף 3.6)', [784, 256, 10]], ['פריטי לבוש, עמוק יותר', [784, 256, 128, 10]], ['תמונה צבעונית 224×224, שכבה אחת', [150528, 256, 1000]]];
  let sizes = [2, 64, 3];
  V.btns(box, PRE.map(([t, s]) => [t, () => { sizes = s.slice(); inp.value = sizes.join(', '); draw(); }, 'ghost'])); const inp = el('input', { value: sizes.join(', '), style: { width: '260px', direction: 'ltr' } }); const r = row(box); r.appendChild(el('span', { html: 'הגדלים:' })); r.appendChild(inp); inp.addEventListener('input', () => { const v = inp.value.split(/[,\s]+/).map(Number).filter(x => x > 0 && Number.isInteger(x)); if (v.length >= 2) { sizes = v; draw(); } });
  const code = mono(box); const cv = canvas(box, 640, 60, 640); const out = V.say(box);
  function draw() { const L = sizes.slice(0, -1).map((a, i) => ({ a, b: sizes[i + 1], w: a * sizes[i + 1], bias: sizes[i + 1] })), tot = L.reduce((s, l) => s + l.w + l.bias, 0);
    code.textContent = 'model = nn.Sequential(\n' + L.map((l, i) => '    nn.Linear(' + l.a + ', ' + l.b + '),' + (i < L.length - 1 ? '\n    nn.ReLU(),' : '') + '        # ' + (l.w + l.bias).toLocaleString('en') + ' = ' + l.a + '·' + l.b + ' + ' + l.b).join('\n') + '\n)\nprint(sum(p.numel() for p in model.parameters()))     # ' + tot.toLocaleString('en');
    const x = cv.getContext('2d'); x.clearRect(0, 0, 640, 60); let X = 10; const cols = ['#4263eb', '#e8590c', '#2f9e44', '#ae3ec9']; L.forEach((l, i) => { const w = (l.w + l.bias) / tot * 620; x.fillStyle = cols[i % 4]; x.fillRect(X, 14, Math.max(1, w), 30); if (w > 60) txt(x, Math.round((l.w + l.bias) / tot * 100) + '%', X + w / 2, 34, '#fff', 12, 'center'); X += w; });
    const mb = tot * 4 / 1e6; out.innerHTML = 'סך הכל <b>' + tot.toLocaleString('en') + '</b> פרמטרים — ' + (mb < 1 ? F(mb * 1000, 1) + ' קילו־בייט' : F(mb, 1) + ' מגה־בייט') + ' ב־float32. באימון עם Adam צריך פי 4 בערך (משקל, גרדיאנט, ושני ממוצעים של Adam). ' + (L[0].a > 10000 ? badge(false, 'השכבה הראשונה היא כמעט הכל') + ' — כל פיקסל מחובר לכל נוירון. לתמונה צבעונית רגילה זה מאות מיליוני פרמטרים, והרשת לא יודעת שפיקסלים שכנים קשורים. זו בדיוק הבעיה שקונבולוציה פותרת (פרק 4).' : L.length > 1 && L[0].w / tot > 0.9 ? 'השכבה הראשונה מחזיקה ' + Math.round(L[0].w / tot * 100) + '% מהפרמטרים — כמעט תמיד המצב ברשת מלאה על תמונה.' : ''); }
  draw();
};

/* ===================================================== 3.4 */
W.w2_train_loop = function (box) {
  V.say(box, 'הלולאה של הסעיף, שורה אחר שורה, על הספירלות. <b>"צעד"</b> מריץ מנה אחת ומדגיש כל שורה; <b>"סבב"</b> מריץ את כל המנות ואת ההערכה. ואז <b>שבור משהו</b> — הסר את <code class="ltr">zero_grad</code> או את <code class="ltr">step</code> — ותראה מה זה עושה לאימון.');
  let bug = 0, p, grad = null, ep = 0, bi = 0, order = [], hist = [], vh = [], line = -1, timer = null; const r = NN.rng(8), B = 32, LR = 0.5;
  V.tabs(box, ['הלולאה כמו בקורס', 'בלי optimizer.zero_grad()', 'בלי optimizer.step()'], k => { bug = k; reset(); });
  V.btns(box, [['צעד (מנה אחת)', () => stepB(true), 'ghost'], ['▶ סבב', () => epoch(), 'primary'], ['▶▶ 15 סבבים', () => many(), 'ghost'], ['אפס', () => reset(), 'ghost']]);
  const fx = flex(box); const cd = el('pre', { style: { direction: 'ltr', textAlign: 'left', fontSize: '12px', margin: 0, padding: '8px', background: 'var(--surface2)', borderRadius: '8px', minWidth: '330px' } }); fx.appendChild(cd); const c1 = canvas(colm(fx, 'הפסד: אימון (כחול), וולידציה (כתום)'), 300, 220, 300); const out = V.say(box);
  const CODE = ['for xb, yb in dl:', '    optimizer.zero_grad()', '    out = model(xb)', '    loss = loss_fn(out, yb)', '    loss.backward()', '    optimizer.step()'];
  function reset() { clearInterval(timer); timer = null; p = mlp(64, { seed: 3 }); grad = null; ep = 0; bi = 0; order = shuffled(SPLIT.tr, r); hist = []; vh = []; line = -1; draw(); }
  function stepB(show) { if (bi * B >= order.length) { order = shuffled(SPLIT.tr, r); bi = 0; } const idx = order.slice(bi * B, bi * B + B); bi++; const res = lossGradIdx(p, idx);
    if (bug !== 1 || !grad) grad = res.g; else ['W1', 'b1', 'W2', 'b2'].forEach(k => { for (let i = 0; i < grad[k].length; i++) grad[k][i] += res.g[k][i]; });
    if (bug !== 2) stepP(p, grad, LR); hist.push(res.loss); line = 5; if (show) draw(res); return res; }
  function epoch() { const n0 = Math.ceil(order.length / B); for (let k = 0; k < n0; k++) stepB(false); ep++; vh.push(lossGradIdx(p, SPLIT.va).loss); draw(); }
  function many() { if (timer) return; let k = 0; timer = setInterval(() => { if (!alive(box)) return clearInterval(timer); epoch(); if (++k >= 15) { clearInterval(timer); timer = null; } }, 60); }
  function draw(res) { cd.innerHTML = CODE.map((l, i) => { const off = (bug === 1 && i === 1) || (bug === 2 && i === 5); return '<div style="' + (off ? 'text-decoration:line-through;color:#adb5bd' : i === line ? 'background:#fff3bf' : '') + '">' + l.replace(/</g, '&lt;') + '</div>'; }).join('') + '<div style="color:#868e96;margin-top:6px"># batch ' + bi + ', epoch ' + ep + (res ? ', loss ' + res.loss.toFixed(3) : '') + '</div>';
    const gn = grad ? Math.sqrt(['W1', 'b1', 'W2', 'b2'].reduce((s, k) => s + Array.from(grad[k]).reduce((t, v) => t + v * v, 0), 0)) : 0;
    const x = c1.getContext('2d'); x.clearRect(0, 0, 300, 220); const Y = v => 200 - Math.min(v, 2) / 2 * 185, nT = Math.max(1, hist.length); x.strokeStyle = 'rgba(66,99,235,.6)'; x.beginPath(); hist.forEach((v, i) => { const X = 20 + i / Math.max(nT - 1, 105) * 270; i ? x.lineTo(X, Y(v)) : x.moveTo(X, Y(v)); }); x.stroke(); x.strokeStyle = '#e8590c'; x.lineWidth = 2; x.beginPath(); vh.forEach((v, i) => { const X = 20 + (i + 1) * 7 / Math.max(nT - 1, 105) * 270; i ? x.lineTo(X, Y(v)) : x.moveTo(X, Y(v)); }); x.stroke(); x.lineWidth = 1; txt(x, '2', 4, 20, '#868e96', 10); txt(x, '0', 4, 202, '#868e96', 10);
    const last = hist.length ? hist[hist.length - 1] : NaN; out.innerHTML = 'מנות של 32 מתוך 200 נקודות אימון: 7 צעדים בסבב. אורך הגרדיאנט שבשימוש: <b>' + F(gn, 3) + '</b>. ' + (bug === 1 ? badge(false, 'בלי zero_grad') + ' — הגרדיאנט שבשימוש הוא סכום של <i>כל</i> המנות מתחילת האימון (האורך שלו רק גדל). כל צעד גדול מהקודם, וההפסד קופץ במקום לרדת. אין שום הודעת שגיאה.' : bug === 2 ? badge(false, 'בלי step') + ' — הגרדיאנטים מחושבים בכל צעד, אבל אף משקל לא משתנה. ההפסד תקוע ליד ' + ltr('ln 3') + ' (רק הרעש של המנות זז). זה נראה כמו "הרשת לא לומדת", והבאג בשורה אחת.' : 'כל צעד: איפוס, קדימה, הפסד, אחורה, עדכון. ' + (ep >= 10 ? 'הכתום (וולידציה) יורד יחד עם הכחול — הרשת לומדת משהו שנכון גם לנקודות שלא ראתה.' : '')); }
  reset();
};

/* ===================================================== 3.5 */
W.w2_optimizers = function (box) {
  V.say(box, 'משטח הפסד בשני משקלות — עמק צר וארוך, כמו שקורה כשמשקל אחד רגיש פי 25 מהאחר — עם רעש של מנות. שלושה אופטימייזרים מתחילים מאותה נקודה. <b>שנה את הקצב של כל אחד</b> ונגן. כוכב — המינימום.');
  let lrS = 0.035, lrM = 0.035, lrA = 0.15, noise = 0.6, paths = null, timer = null, t = 0;
  const sr = row(box); V.slider(sr, 'SGD: lr', 0.005, 0.08, 0.005, lrS, v => { lrS = v; reset(); }); V.slider(sr, 'SGD + momentum 0.9: lr', 0.002, 0.08, 0.002, lrM, v => { lrM = v; reset(); }); const sr2 = row(box); V.slider(sr2, 'Adam: lr', 0.01, 0.5, 0.01, lrA, v => { lrA = v; reset(); }); V.slider(sr2, 'רעש המנות', 0, 2, 0.1, noise, v => { noise = v; reset(); });
  V.btns(box, [['▶ 150 צעדים', () => go(), 'primary']]); const cv = canvas(box, 640, 300, 640); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  const L = (a, b) => 0.5 * (a * a + 25 * b * b), G = (a, b) => [a, 25 * b]; const X0 = [-4.5, 0.9];
  const toC = (a, b) => [320 + a * 64, 150 - b * 120];
  function reset() { clearInterval(timer); timer = null; t = 0; const r = NN.rng(4); const nz = () => [NN.randn(r) * noise, NN.randn(r) * noise * 5]; paths = { S: [X0.slice()], M: [X0.slice()], A: [X0.slice()], v: [0, 0], m: [0, 0], s: [0, 0], nz: [...Array(150)].map(nz) }; draw(); }
  function go() { if (timer) return; if (t >= 150) reset(); timer = setInterval(() => { if (!alive(box)) return clearInterval(timer); for (let k = 0; k < 3 && t < 150; k++, t++) { const nz = paths.nz[t];
      let [a, b] = paths.S[paths.S.length - 1], g = G(a, b); paths.S.push([a - lrS * (g[0] + nz[0]), b - lrS * (g[1] + nz[1])]);
      [a, b] = paths.M[paths.M.length - 1]; g = G(a, b); paths.v = paths.v.map((v, i) => 0.9 * v + g[i] + nz[i]); paths.M.push([a - lrM * paths.v[0], b - lrM * paths.v[1]]);
      [a, b] = paths.A[paths.A.length - 1]; g = G(a, b).map((v, i) => v + nz[i]); paths.m = paths.m.map((m, i) => 0.9 * m + 0.1 * g[i]); paths.s = paths.s.map((s, i) => 0.999 * s + 0.001 * g[i] * g[i]); const mh = paths.m.map(m => m / (1 - 0.9 ** (t + 1))), sh = paths.s.map(s => s / (1 - 0.999 ** (t + 1))); paths.A.push([a - lrA * mh[0] / (Math.sqrt(sh[0]) + 1e-8), b - lrA * mh[1] / (Math.sqrt(sh[1]) + 1e-8)]); }
    draw(); if (t >= 150) { clearInterval(timer); timer = null; } }, 40); }
  function draw() { const x = cv.getContext('2d'); x.clearRect(0, 0, 640, 300); [0.5, 2, 5, 10, 20, 40].forEach(c => { x.strokeStyle = '#e9ecef'; x.beginPath(); for (let k = 0; k <= 80; k++) { const th = k / 80 * 2 * Math.PI, a = Math.sqrt(2 * c) * Math.cos(th), b = Math.sqrt(2 * c / 25) * Math.sin(th); const [X, Y] = toC(a, b); k ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.stroke(); });
    const [sx, sy] = toC(0, 0); txt(x, '★', sx, sy + 5, '#212529', 16, 'center'); const rows = [];
    [['S', '#4263eb', 'SGD'], ['M', '#e8590c', 'SGD + momentum'], ['A', '#2f9e44', 'Adam']].forEach(([k, col, name]) => { const P = paths[k]; x.strokeStyle = col; x.lineWidth = 1.6; x.beginPath(); P.forEach((q, i) => { const [X, Y] = toC(clamp(q[0], -5, 5), clamp(q[1], -1.25, 1.25)); i ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.stroke(); const q = P[P.length - 1], l = L(q[0], q[1]); rows.push(['<span style="color:' + col + '">■</span> ' + name, isFinite(l) && l < 1e6 ? F(l, 3) : badge(false, 'התפוצץ')]); });
    tb.innerHTML = table(['אופטימייזר', 'ההפסד אחרי ' + t + ' צעדים'], rows);
    out.innerHTML = 'SGD עם קצב גדול מ־' + ltr('2/25 = 0.08') + ' מתפוצץ בכיוון התלול; עם קצב קטן הוא בטוח שם — אבל זוחל לאורך העמק. <b>Momentum</b> צובר מהירות בכיוון שבו הגרדיאנטים מסכימים (לאורך העמק) ומבטל את הקפיצות הלוך־חזור. <b>Adam</b> נותן לכל משקל צעד משלו, לפי גודל הגרדיאנטים שלו לאחרונה — כך הכיוון התלול והשטוח זזים באותו קצב בערך. לכן ברירת המחדל המקובלת: ' + ltr('AdamW, lr = 1e−3') + '.'; }
  reset();
};

/* ===================================================== 3.6 */
W.w2_fashion_params = function (box) {
  V.say(box, 'סעיף 3.6, כמו שרץ במחשב שלך (PyTorch 2.15, על מעבד): פריטי לבוש — 54,000 תמונות לאימון ו־6,000 לוולידציה, 5 סבבים. למטה — איפה יושבים 203,530 הפרמטרים של המודל: כל אחד מ־256 הנוירונים הראשונים "מסתכל" על כל 784 הפיקסלים.');
  const R = window.LAB2M_FASHION || null;   /* set by m2_deep.js from the real run */ const tb = el('div'); box.appendChild(tb); const fx = flex(box); const cv = canvas(colm(fx, 'דיוק וולידציה לפי סבב'), 330, 200, 330); const cw = canvas(colm(fx, 'השכבה הראשונה: 784 × 256 משקלות'), 260, 200, 260); const out = V.say(box);
  function draw() { const rows = (R || []).map((r, i) => [i, F(r[0], 3), (r[1] * 100).toFixed(1) + '%']); tb.innerHTML = R ? table(['סבב', 'הפסד אימון', 'דיוק וולידציה'], rows) : '<div class="note-small" style="text-align:center">התוצאות מההרצה יופיעו כאן.</div>';
    if (R) lplot(cv, [{ y: R.map(r => r[1] * 100), color: '#2f9e44' }], [80, 92], { hlines: [{ v: 87, color: '#adb5bd', label: '87%' }, { v: 89, color: '#adb5bd', label: '89%' }], ylab: '%' });
    const x = cw.getContext('2d'), r = NN.rng(2); for (let j = 0; j < 64; j++) for (let i = 0; i < 112; i++) { const v = NN.randn(r); x.fillStyle = v > 0 ? 'rgba(66,99,235,' + Math.min(1, v * 0.5) + ')' : 'rgba(232,89,12,' + Math.min(1, -v * 0.5) + ')'; x.fillRect(4 + i * 2.25, 4 + j * 3, 2.2, 2.9); } txt(x, 'המחשה: כל משבצת — משקל אחד, כמו באתחול', 130, 196, '#868e96', 10, 'center');
    out.innerHTML = R ? 'אחרי 5 סבבים: <b>' + (R[R.length - 1][1] * 100).toFixed(1) + '%</b> על הוולידציה — בטווח שהקורס צפה (87%–89%). זה הסף שרשת קונבולוציה צריכה לעבור בפרק 4, עם הרבה פחות פרמטרים. ' + table(['שכבה', 'פרמטרים'], [['nn.Linear(784, 256)', '784·256 + 256 = 200,960'], ['nn.Linear(256, 10)', '256·10 + 10 = 2,570'], ['סך הכל', '203,530']]) : ''; }
  draw();
};

/* ===================================================== chapter 4: convolutional networks ===================================================== */
const FASHION = ['חולצת טי', 'מכנסיים', 'סוודר', 'שמלה', 'מעיל', 'סנדל', 'חולצה', 'נעל ספורט', 'תיק', 'מגף'];
const L4 = () => window.M2LAB4 || null;          /* real data from the run on the user's computer (content/m2_lab4data.js) */
function grayImg(vals, w, h) { const g = IM.gray(w, h); for (let i = 0; i < w * h; i++) g.d[i] = vals[i]; return g; }
function heat(cv, vals, w, h, signed) { const x = cv.getContext('2d'), im = x.createImageData(w, h); let m = 1e-9; vals.forEach(v => m = Math.max(m, Math.abs(v)));
  vals.forEach((v, i) => { const t = v / m; let r, g, b; if (signed) { r = t > 0 ? 255 - 190 * t : 255; g = 255 - 170 * Math.abs(t); b = t < 0 ? 255 + 190 * t : 255; if (t > 0) { r = 255 - 190 * t; g = 255 - 150 * t; b = 255; } else { r = 255; g = 255 + 150 * t; b = 255 + 220 * t; } } else { r = g = b = 255 - 255 * t; } im.data[4 * i] = r; im.data[4 * i + 1] = g; im.data[4 * i + 2] = b; im.data[4 * i + 3] = 255; }); x.putImageData(im, 0, 0); }
const pixCanvas = (parent, w, h, css, title) => { const c = canvas(colm(parent, title || ''), w, h, css); c.style.imageRendering = 'pixelated'; return c; };

/* ===================================================== 4.1 */
W.w2_shuffle_pixels = function (box) {
  V.say(box, 'הניסוי של הסעיף, באמת. כל תמונה עוברת <b>אותו ערבוב של פיקסלים</b> (אותה תמורה לכל התמונות). לעין זה רעש. אבל רשת מלאה מחברת כל פיקסל לכל נוירון בלי שום סדר — אז מבחינתה שום דבר לא השתנה. ורשת קונבולוציה, שמסתכלת על שכנים? <b>בחר תמונה</b>, ותסתכל על התוצאות שהורצו במחשב.');
  let k = 0; const fx = flex(box); const c0 = pixCanvas(fx, 28, 28, 168, 'המקורית'), c1 = pixCanvas(fx, 28, 28, 168, 'אחרי הערבוב'); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  const D = L4(); if (D) V.btns(box, D.ys.map((y, i) => [FASHION[y], () => { k = i; draw(); }, 'ghost']));
  const perm = (() => { const r = NN.rng(77), a = [...Array(784).keys()]; for (let i = 783; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; })();
  function draw() { const D = L4(); if (!D) { out.innerHTML = 'הנתונים מההרצה עוד לא נטענו.'; return; } const im = D.imgs[k]; heat(c0, im.map(v => v), 28, 28); heat(c1, perm.map(i => im[i]), 28, 28);
    const S = D.shuffle; tb.innerHTML = S ? table(['', 'תמונות רגילות', 'אחרי ערבוב'], [['רשת מלאה (סעיף 3.6)', (S.mlp_normal * 100).toFixed(1) + '%', (S.mlp_shuffled * 100).toFixed(1) + '%'], ['רשת קונבולוציה (סעיף 4.6)', (S.cnn_normal * 100).toFixed(1) + '%', (S.cnn_shuffled * 100).toFixed(1) + '%']]) + '<div class="note-small" style="text-align:center">דיוק וולידציה אחרי 2 סבבים, הורץ במחשב (PyTorch 2.15, מעבד).</div>' : '';
    out.innerHTML = S ? 'הרשת המלאה: ' + (S.mlp_normal * 100).toFixed(1) + '% מול ' + (S.mlp_shuffled * 100).toFixed(1) + '% — אותו דבר, עד רעש. היא <b>לא יודעת</b> שפיקסלים שכנים קשורים. רשת הקונבולוציה: יורדת מ־' + (S.cnn_normal * 100).toFixed(1) + '% ל־' + (S.cnn_shuffled * 100).toFixed(1) + '% — בערך לרמה של הרשת המלאה: היתרון שלה נעלם. בלי שכנים קשורים, הגרעינים של 3 על 3 מסתכלים על פיקסלים אקראיים. בדיוק המבנה המרחבי הוא מה שהיא מנצלת — וכשהוא קיים, זה היתרון שלה.' : ''; }
  draw();
};

/* ===================================================== 4.2 */
W.w2_multichannel_conv = function (box) {
  V.say(box, 'קונבולוציה על קלט עם 3 ערוצים. הגרעין הוא <b>קובייה</b> של <span class="ltr">3 × 3 × 3</span>: פרוסה אחת לכל ערוץ. בכל מקום: כל פרוסה כפול הערוץ שלה, איבר באיבר — ו<b>הכל</b> מסוכם למספר אחד (ועוד הטיה). <b>לחץ על התמונה</b> כדי להזיז את החלון, ובחר גרעין.');
  const Wd = 24, Ht = 18; let px = 10, py = 8, kk = 0;
  const img = IM.color(Wd, Ht); for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) { const i = 3 * (y * Wd + x); const red = (x - 7) ** 2 + (y - 9) ** 2 < 25, blue = x > 13 && x < 21 && y > 4 && y < 14; img.d[i] = blue ? 220 : 60; img.d[i + 1] = red ? 40 : 60; img.d[i + 2] = red ? 230 : blue ? 40 : 60; }
  const KS = [['קצה אנכי, בכל הערוצים', [[[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]]], ['"אדום ולא כחול"', [[[0, 0, 0], [0, 1, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, -1, 0], [0, 0, 0]]].reverse()], ['ממוצע בהירות', [[[1, 1, 1], [1, 1, 1], [1, 1, 1]], [[1, 1, 1], [1, 1, 1], [1, 1, 1]], [[1, 1, 1], [1, 1, 1], [1, 1, 1]]].map(s => s.map(r => r.map(v => v / 27)))]];
  V.tabs(box, KS.map(k => k[0]), i => { kk = i; draw(); });
  const fx = flex(box); const cI = IM.canvas(colm(fx, 'הקלט (לחץ)'), Wd, Ht, 8); cI.style.cursor = 'crosshair'; const cCh = [0, 1, 2].map(c => pixCanvas(fx, Wd, Ht, 96, ['ערוץ R', 'ערוץ G', 'ערוץ B'][c])); const cO = pixCanvas(fx, Wd - 2, Ht - 2, 110, 'הפלט (ערוץ אחד)'); const calc = el('div'); box.appendChild(calc); const out = V.say(box);
  cI.addEventListener('click', e => { const r = cI.getBoundingClientRect(); px = clamp(Math.floor((e.clientX - r.left) / r.width * Wd), 1, Wd - 2); py = clamp(Math.floor((e.clientY - r.top) / r.height * Ht), 1, Ht - 2); draw(); });
  const ch = (x, y, c) => img.d[3 * (y * Wd + x) + (2 - c)] / 255;   /* c: 0 = R, 1 = G, 2 = B (the image is stored BGR) */
  function draw() { const K = KS[kk][1]; const ctx = IM.show(cI, img); ctx.strokeStyle = '#ffd43b'; ctx.lineWidth = 0.4; ctx.strokeRect(px - 1.5, py - 1.5, 3, 3);
    cCh.forEach((cv, c) => { const v = []; for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) v.push(ch(x, y, c)); heat(cv, v, Wd, Ht); const x = cv.getContext('2d'); x.strokeStyle = '#e8590c'; x.lineWidth = 1; x.strokeRect(px - 1.5, py - 1.5, 3, 3); });
    const outV = []; for (let y = 1; y < Ht - 1; y++) for (let x = 1; x < Wd - 1; x++) { let s = 0; for (let c = 0; c < 3; c++) for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) s += K[c][j + 1][i + 1] * ch(x + i, y + j, c); outV.push(s); } heat(cO, outV, Wd - 2, Ht - 2, true); const o = cO.getContext('2d'); o.strokeStyle = '#000'; o.strokeRect(px - 1.5, py - 1.5, 1, 1);
    const per = [0, 1, 2].map(c => { let s = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) s += K[c][j + 1][i + 1] * ch(px + i, py + j, c); return s; });
    calc.innerHTML = table(['', 'ערוץ R', 'ערוץ G', 'ערוץ B', 'סך הכל'], [['פרוסה × חלון, מסוכם', F(per[0], 2), F(per[1], 2), F(per[2], 2), '<b>' + F(per[0] + per[1] + per[2], 2) + '</b>']]);
    out.innerHTML = 'הפלט ב־' + ltr('(' + px + ', ' + py + ')') + ' הוא <b>' + F(per[0] + per[1] + per[2], 2) + '</b> — סכום של שלושת התרומות. ' + ['אותו קצה בכל ערוץ: הגרעין מגיב לשינוי בהירות אנכי, בלי קשר לצבע.', 'גרעין שמסתכל על ערוצים <i>שונים</i> בסימנים שונים: חיובי על אדום, שלילי על כחול. כך שכבה ראשונה לומדת מאפייני צבע — משהו שלא אפשרי עם גרעין דו־ממדי על תמונת אפור.', 'ממוצע של 27 ערכים: טשטוש שמערבב גם את הערוצים.'][kk] + ' שכבה עם 32 גרעינים כאלה — 32 קוביות שונות — מוציאה 32 ערוצי פלט. המשקלות של שכבה כזו בצורה <span class="ltr">(32, 3, 3, 3)</span>.'; }
  draw();
};

/* ===================================================== 4.3 */
W.w2_out_size = function (box) {
  V.say(box, 'נוסחת הגודל, על רשת של משבצות. <b>הזז את k, s, p</b> — משבצות אפורות הן הריפוד, והמסגרות הכתומות הן כל המקומות שבהם הגרעין עוצר. ובלשונית השנייה: שרשרת של שכבות, כמו במזהים (תרגיל 4.1).');
  let n = 9, k = 3, s = 1, p = 1, mode = 0, chainN = 640;
  V.tabs(box, ['שכבה אחת', 'שרשרת: 5 שכבות של k=3, s=2, p=1'], i => { mode = i; ctl(); draw(); }); const cb = el('div'); box.appendChild(cb);
  const cv = canvas(box, 640, 260, 640); const out = V.say(box);
  function ctl() { cb.innerHTML = ''; const r = row(cb); if (mode === 0) { V.slider(r, 'n (קלט)', 4, 14, 1, n, v => { n = v; draw(); }); V.slider(r, 'k', 1, 7, 1, k, v => { k = v; draw(); }); const r2 = row(cb); V.slider(r2, 's', 1, 3, 1, s, v => { s = v; draw(); }); V.slider(r2, 'p', 0, 3, 1, p, v => { p = v; draw(); }); } else V.slider(r, 'גודל הקלט', 64, 1280, 32, chainN, v => { chainN = v; draw(); }); }
  const outN = (n, k, s, p) => Math.floor((n + 2 * p - k) / s) + 1;
  function draw() { const x = cv.getContext('2d'); x.clearRect(0, 0, 640, 260);
    if (mode === 1) { let v = chainN; const sizes = [v]; for (let i = 0; i < 5; i++) { v = outN(v, 3, 2, 1); sizes.push(v); } sizes.forEach((v, i) => { const w = Math.max(4, v / chainN * 200); x.fillStyle = 'rgba(66,99,235,' + (0.25 + i * 0.13) + ')'; x.fillRect(20 + i * 120, 130 - w / 2, Math.min(100, w / 2), w); txt(x, v + '×' + v, 20 + i * 120, 250, '#212529', 12); if (i) txt(x, '÷2', 5 + i * 120, 135, '#868e96', 11); });
      out.innerHTML = 'אחרי 5 שכבות: מפה של <b>' + sizes[5] + ' על ' + sizes[5] + '</b> — כל משבצת בה "אחראית" על אזור של ' + Math.round(chainN / sizes[5]) + ' פיקסלים בקלט (פסיעה 32). זו בדיוק הרזולוציה הגסה של מזהים כמו YOLO. ' + (chainN % 32 ? 'שים לב: ' + chainN + ' לא מתחלק ב־32, והגדלים מעוגלים בדרך — לכן מזהים מקבלים תמונות שהגודל שלהן כפולה של 32.' : ''); return; }
    const N = n + 2 * p, c = Math.min(24, 600 / N), ox = 20, oy = 20, o = outN(n, k, s, p);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const pad = i < p || j < p || i >= n + p || j >= n + p; x.fillStyle = pad ? '#e9ecef' : '#fff'; x.fillRect(ox + i * c, oy + j * c, c - 1, c - 1); x.strokeStyle = '#dee2e6'; x.strokeRect(ox + i * c, oy + j * c, c - 1, c - 1); }
    for (let a = 0; a < Math.max(0, o); a++) { const X = ox + a * s * c; x.strokeStyle = 'rgba(232,89,12,' + (a === 0 ? 0.95 : 0.35) + ')'; x.lineWidth = a === 0 ? 2.5 : 1.2; x.strokeRect(X + 1, oy + 1, k * c - 3, k * c - 3); } x.lineWidth = 1;
    const ox2 = ox + N * c + 30; for (let j = 0; j < o; j++) for (let i = 0; i < o; i++) { x.fillStyle = '#d0ebff'; x.fillRect(ox2 + i * c, oy + j * c, c - 1, c - 1); } txt(x, 'פלט ' + o + '×' + o, ox2, oy + o * c + 16, '#1c7ed6', 12);
    out.innerHTML = ltr('⌊(' + n + ' + 2·' + p + ' − ' + k + ') / ' + s + '⌋ + 1 = ' + o) + '. ' + (o === n && s === 1 ? 'הגודל נשמר — ' + ltr('p = (k − 1) / 2') + '.' : s === 2 && o === Math.ceil(n / 2) ? 'הגודל חצי, מעוגל למעלה.' : p === 0 && k > 1 ? 'בלי ריפוד, כל שכבה אוכלת ' + (k - 1) + ' פיקסלים (חצי מכל צד). אחרי עשר שכבות — נשאר מעט מאוד.' : '') + ' ' + ((n + 2 * p - k) % s ? 'החלון לא מגיע בדיוק לקצה: ' + ((n + 2 * p - k) % s) + ' עמודות בסוף לא נכנסות לאף חלון (העיגול למטה בנוסחה).' : ''); }
  ctl(); draw();
};

/* ===================================================== 4.4 */
W.w2_maxpool = function (box) {
  V.say(box, 'כינוס מקסימום, על מפת מאפיינים <b>אמיתית</b> — הפלט של גרעין אחד בשכבה הראשונה של הרשת שאומנה במחשב (סעיף 4.6). <b>בחר מפה</b>, ואז <b>הזז את התמונה בפיקסל</b>: לפני הכינוס הכל זז; אחרי — רוב המקסימומים נשארים באותו ריבוע.');
  let k = 0, f = 0, sh = 0; const fx = flex(box); const cA = pixCanvas(fx, 28, 28, 196, 'מפת המאפיין (28×28)'), cB = pixCanvas(fx, 14, 14, 196, 'אחרי MaxPool2d(2) (14×14)'); const out = V.say(box);
  const r = row(box); V.slider(r, 'מפה מתוך 32', 0, 31, 1, f, v => { f = v; draw(); }); V.slider(r, 'הזזה ימינה (פיקסלים)', 0, 2, 1, sh, v => { sh = v; draw(); });
  const D0 = L4(); if (D0) V.btns(box, D0.ys.map((y, i) => [FASHION[y], () => { k = i; draw(); }, 'ghost']));
  const pool = (a, w) => { const o = []; for (let y = 0; y < w / 2; y++) for (let x = 0; x < w / 2; x++) o.push(Math.max(a[2 * y * w + 2 * x], a[2 * y * w + 2 * x + 1], a[(2 * y + 1) * w + 2 * x], a[(2 * y + 1) * w + 2 * x + 1])); return o; };
  function draw() { const D = L4(); if (!D) { out.innerHTML = 'הנתונים מההרצה עוד לא נטענו.'; return; } const a = D.a1[k].slice(f * 784, f * 784 + 784), b = a.map((_, i) => { const x = i % 28 - sh; return x >= 0 ? a[i - sh] : 0; });
    heat(cA, b, 28, 28); const P = pool(b, 28), P0 = pool(a, 28); heat(cB, P, 14, 14);
    let same = 0, nz = 0; P.forEach((v, i) => { if (P0[i] > 20 || v > 20) { nz++; if (Math.abs(v - P0[i]) <= 0.15 * Math.max(v, P0[i])) same++; } });
    out.innerHTML = 'מתוך 784 ערכים נשארים 196 — רבע — ואין לשכבה אף פרמטר. ' + (sh ? 'בהזזה של ' + sh + ' פיקסל, ' + Math.round(same / Math.max(1, nz) * 100) + '% מהערכים המשמעותיים אחרי הכינוס כמעט לא השתנו. ' + (sh === 1 ? 'הזזה של פיקסל אחד נשארת לרוב בתוך אותו ריבוע של 2×2 — זו העמידות לתזוזות קטנות.' : 'בהזזה של 2 כל המקסימום עובר לריבוע הבא — הכינוס לא מבטל תזוזות, רק מקטין אותן פי 2.') : 'הזז את התמונה כדי לראות את העמידות לתזוזה.') + ' (מפה ' + f + ', תמונה של ' + FASHION[D.ys[k]] + '.)'; }
  draw();
};

/* ===================================================== 4.5 */
W.w2_receptive = function (box) {
  V.say(box, 'כמה מהתמונה רואה נוירון בשכבה העמוקה ביותר? <b>בנה רשת</b> מהכפתורים, וראה את השדה הקולט גדל — ומשמאל, מה גודלו על צילום רחפן של 1920 פיקסלים, מול רכב שתופס 100.');
  let L = [['conv3', 3, 1], ['pool2', 2, 2], ['conv3', 3, 1], ['pool2', 2, 2]];
  const ADD = [['+ conv 3×3', ['conv3', 3, 1]], ['+ conv 3×3, צעד 2', ['conv3/2', 3, 2]], ['+ pool 2', ['pool2', 2, 2]], ['+ conv 7×7, צעד 2', ['conv7/2', 7, 2]]];
  V.btns(box, ADD.map(([t, l]) => [t, () => { L.push(l.slice()); draw(); }, 'ghost']).concat([['הסר אחרונה', () => { L.pop(); draw(); }, 'ghost'], ['תחילת ResNet (תרגיל 4.3)', () => { L = [['conv7/2', 7, 2], ['pool3/2', 3, 2], ['conv3', 3, 1], ['conv3', 3, 1], ['conv3', 3, 1], ['conv3', 3, 1]]; draw(); }, 'primary']]));
  const fx = flex(box); const cv = canvas(colm(fx, 'השדה הקולט אחרי כל שכבה'), 380, 230, 380); const cI = canvas(colm(fx, 'על צילום של 1920 פיקסלים'), 240, 135, 240); const code = mono(box); const out = V.say(box);
  function draw() { let r = 1, j = 1; const rows = []; L.forEach(([nm, k, s]) => { r = r + (k - 1) * j; j = j * s; rows.push([nm, r, j]); });
    const x = cv.getContext('2d'); x.clearRect(0, 0, 380, 230); const mx = Math.max(10, ...rows.map(q => q[1])); rows.forEach(([nm, rr, jj], i) => { const h = rr / mx * 180, w = Math.min(34, 340 / Math.max(1, rows.length) - 4); x.fillStyle = '#4263eb'; x.fillRect(20 + i * (w + 4), 200 - h, w, h); txt(x, String(rr), 20 + i * (w + 4) + w / 2, 196 - h, '#212529', 10, 'center'); txt(x, nm, 20 + i * (w + 4) + w / 2, 214, '#868e96', 8, 'center'); });
    const c = cI.getContext('2d'); c.fillStyle = '#5c7a3a'; c.fillRect(0, 0, 240, 135); c.fillStyle = '#495057'; c.fillRect(0, 60, 240, 18); const sc = 240 / 1920; c.fillStyle = '#e03131'; c.fillRect(120 - 50 * sc, 69 - 22 * sc, 100 * sc, 44 * sc); c.strokeStyle = '#ffd43b'; c.lineWidth = 1.5; c.strokeRect(120 - r / 2 * sc, 69 - r / 2 * sc, r * sc, r * sc);
    code.textContent = 'receptive_field([' + L.map(([n, k, s]) => '("' + n + '", ' + k + ', ' + s + ')').join(', ') + '])\n' + rows.map(([n, rr, jj]) => n.padEnd(8) + ' rf=' + String(rr).padStart(3) + ' jump=' + jj).join('\n');
    out.innerHTML = 'השדה הקולט: <b>' + r + '</b> פיקסלים, ונוירונים שכנים בשכבה האחרונה רחוקים ' + j + ' פיקסלים זה מזה. ' + (r < 100 ? 'הריבוע הצהוב קטן מהרכב (100 פיקסלים): אף נוירון ברשת לא "רואה" רכב שלם. הוסף שכבות עם צעד — שם השדה גדל מהר.' : badge(true, 'השדה גדול מהרכב') + ' — נוירון בשכבה האחרונה יכול לשלב מידע מכל הרכב.') + ' כל שכבה מוסיפה ' + ltr('(k − 1) · jump') + ': אחרי צעדים, אותו גרעין קטן מכסה הרבה יותר.'; }
  draw();
};

/* ===================================================== 4.6 */
W.w2_cnn_shapes = function (box) {
  V.say(box, 'הרשת של הסעיף — אחרי שאומנה במחשב שלך 5 סבבים על פריטי לבוש. <b>בחר תמונה</b> ועקוב אחריה: 32 הגרעינים שהרשת <b>למדה</b> בשכבה הראשונה, 32 מפות הפלט שלהם, 64 המפות של השכבה השנייה, וההסתברויות בסוף.');
  let k = 0; const D0 = L4(); if (D0) V.btns(box, D0.ys.map((y, i) => [FASHION[y], () => { k = i; draw(); }, 'ghost']));
  const top = flex(box); const cIn = pixCanvas(top, 28, 28, 112, 'הקלט'); const cP = canvas(colm(top, 'ההסתברויות'), 300, 150, 300); const t1 = el('div', { class: 'note-small', html: 'השכבה הראשונה: 32 גרעינים של 3×3 שנלמדו (כחול חיובי, כתום שלילי), ומתחת לכל אחד — הפלט שלו (28×28)', style: { textAlign: 'center' } }); box.appendChild(t1);
  const g1 = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: '3px', direction: 'ltr', maxWidth: '680px', margin: '0 auto' } }); box.appendChild(g1); const cells1 = [...Array(32)].map(() => { const d = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '1px' } }); const a = document.createElement('canvas'); a.width = 3; a.height = 3; a.style.width = '100%'; a.style.imageRendering = 'pixelated'; const b = document.createElement('canvas'); b.width = 28; b.height = 28; b.style.width = '100%'; b.style.imageRendering = 'pixelated'; d.appendChild(a); d.appendChild(b); g1.appendChild(d); return [a, b]; });
  box.appendChild(el('div', { class: 'note-small', html: 'השכבה השנייה (אחרי כינוס): 64 מפות של 14×14', style: { textAlign: 'center', marginTop: '6px' } })); const g2 = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: '2px', direction: 'ltr', maxWidth: '680px', margin: '0 auto' } }); box.appendChild(g2); const cells2 = [...Array(64)].map(() => { const b = document.createElement('canvas'); b.width = 14; b.height = 14; b.style.width = '100%'; b.style.imageRendering = 'pixelated'; g2.appendChild(b); return b; });
  const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const D = L4(); if (!D) { out.innerHTML = 'הנתונים מההרצה עוד לא נטענו.'; return; } heat(cIn, D.imgs[k], 28, 28);
    cells1.forEach(([a, b], f) => { heat(a, D.w1.slice(f * 9, f * 9 + 9), 3, 3, true); heat(b, D.a1[k].slice(f * 784, f * 784 + 784), 28, 28); }); cells2.forEach((b, f) => heat(b, D.a2[k].slice(f * 196, f * 196 + 196), 14, 14));
    const pr = D.probs[k], x = cP.getContext('2d'); x.clearRect(0, 0, 300, 150); pr.forEach((v, c) => { x.fillStyle = c === D.ys[k] ? '#2f9e44' : '#adb5bd'; x.fillRect(80, 4 + c * 14, v * 180, 11); txt(x, FASHION[c], 74, 13 + c * 14, '#495057', 10, 'right'); txt(x, (v * 100).toFixed(1) + '%', 296, 13 + c * 14, '#495057', 9, 'right'); });
    const H = D.hist; tb.innerHTML = table(['סבב', 'הפסד אימון', 'דיוק וולידציה', 'זמן'], H.map((h, i) => [i, F(h[0], 3), (h[1] * 100).toFixed(1) + '%', F(h[2], 0) + ' שנ׳']));
    const win = pr.indexOf(Math.max(...pr)); out.innerHTML = 'התמונה: ' + FASHION[D.ys[k]] + '. הרשת: <b>' + FASHION[win] + '</b> (' + (pr[win] * 100).toFixed(1) + '%). ' + (win !== D.ys[k] ? badge(false, 'טעות') + ' — ובדרך כלל בין מחלקות דומות (חולצה, חולצת טי, סוודר). ' : '') + 'בגרעינים של השכבה הראשונה רואים חלק מסנני קצוות (חצי כחול, חצי כתום — כמו סובל, בכיוונים שונים) וחלק מסנני בהירות. הרשת למדה אותם לבד. במפות של השכבה השנייה כבר קשה לתת שם למה שכל אחת מחפשת — הן משלבות את הראשונות. אחרי 5 סבבים: <b>' + (H[H.length - 1][1] * 100).toFixed(1) + '%</b> על הוולידציה, מול 87.0% של הרשת המלאה (סעיף 3.6).'; }
  draw();
};

/* ===================================================== chapter 5 */
const L5 = () => window.M2LAB5 || null;          /* real data from the runs on the user's computer (content/m2_lab5data.js) */
const log10 = v => Math.log(Math.max(v, 1e-300)) / Math.LN10;
const fmtN = v => Math.round(v).toLocaleString('en-US');
const fmtE = v => v >= 0.01 && v < 1e4 ? (v >= 100 ? F(v, 0) : v >= 1 ? F(v, 1) : F(v, v >= 0.1 ? 2 : 4)) : E(v, 1);
/* a log-scale line chart: series of {y: [...] (raw values), color, dash}, x = index */
function logPlot(cv, series, lo, hi, opt) { opt = opt || {}; const Wd = cv.width, Ht = cv.height, x = cv.getContext('2d'); x.clearRect(0, 0, Wd, Ht); const L0 = 44, R0 = 12, T0 = 10, B0 = 22;
  const n = Math.max(2, ...series.map(s => s.y.length)), X = i => L0 + i / (n - 1) * (Wd - L0 - R0), Y = v => T0 + (hi - clamp(log10(v), lo, hi)) / (hi - lo) * (Ht - T0 - B0);
  const stepE = (hi - lo) > 10 ? 4 : (hi - lo) > 5 ? 2 : 1;
  for (let e = Math.ceil(lo); e <= hi; e++) { if ((e - Math.ceil(lo)) % stepE) continue; const yy = Y(Math.pow(10, e)); x.strokeStyle = '#f1f3f5'; x.beginPath(); x.moveTo(L0, yy); x.lineTo(Wd - R0, yy); x.stroke(); txt(x, e === 0 ? '1' : '1e' + e, L0 - 4, yy + 4, '#868e96', 10, 'right'); }
  x.strokeStyle = '#ced4da'; x.beginPath(); x.moveTo(L0, T0); x.lineTo(L0, Ht - B0); x.lineTo(Wd - R0, Ht - B0); x.stroke();
  (opt.hlines || []).forEach(h => { x.strokeStyle = h.color; x.setLineDash([4, 3]); x.beginPath(); x.moveTo(L0, Y(h.v)); x.lineTo(Wd - R0, Y(h.v)); x.stroke(); x.setLineDash([]); if (h.label) txt(x, h.label, Wd - R0 - 2, Y(h.v) - 4, h.color, 10, 'right'); });
  series.forEach(s => { x.strokeStyle = s.color; x.lineWidth = s.lw || 2; if (s.dash) x.setLineDash(s.dash); x.beginPath(); s.y.forEach((v, i) => i ? x.lineTo(X(i), Y(v)) : x.moveTo(X(i), Y(v))); x.stroke(); x.setLineDash([]); x.lineWidth = 1; });
  if (opt.xl) { txt(x, opt.xl[0], L0, Ht - 6, '#868e96', 10); txt(x, opt.xl[1], Wd - R0, Ht - 6, '#868e96', 10, 'right'); }
  return { X, Y }; }
const legend = (parent, items) => { const d = el('div', { class: 'note-small', style: { textAlign: 'center' }, html: items.map(([c, t, dash]) => '<span style="white-space:nowrap;display:inline-block;margin:0 8px"><span style="display:inline-block;width:18px;height:0;border-top:3px ' + (dash ? 'dashed ' : 'solid ') + c + ';vertical-align:middle;margin-left:5px"></span>' + t + '</span>').join('') }); parent.appendChild(d); return d; };

/* the code of section 5.1, in JavaScript: same network, same backward pass, also keeps the norm at every layer */
function gradProfile(depth, scale, seed, d) { d = d || 64; const r = NN.rng(seed * 7919 + 13), s = scale / Math.sqrt(d);
  const Ws = []; for (let l = 0; l < depth; l++) { const M = new Float64Array(d * d); for (let i = 0; i < d * d; i++) M[i] = NN.randn(r) * s; Ws.push(M); }
  const h0 = new Float64Array(d); for (let i = 0; i < d; i++) h0[i] = NN.randn(r);
  const out = {};
  [false, true].forEach(res => { let h = h0.slice(); const zs = [], fw = [Math.hypot(...h)];
    for (let l = 0; l < depth; l++) { const W = Ws[l], z = new Float64Array(d); for (let j = 0; j < d; j++) { let a = 0; for (let i = 0; i < d; i++) a += h[i] * W[i * d + j]; z[j] = a; } zs.push(z); const nh = new Float64Array(d); for (let j = 0; j < d; j++) nh[j] = (res ? h[j] : 0) + Math.tanh(z[j]); h = nh; fw.push(Math.hypot(...h)); }
    let g = new Float64Array(d).fill(1); const bw = [Math.hypot(...g)];
    for (let l = depth - 1; l >= 0; l--) { const W = Ws[l], z = zs[l], t = new Float64Array(d); for (let j = 0; j < d; j++) { const th = Math.tanh(z[j]); t[j] = g[j] * (1 - th * th); } const ng = new Float64Array(d); for (let i = 0; i < d; i++) { let a = 0; for (let j = 0; j < d; j++) a += t[j] * W[i * d + j]; ng[i] = (res ? g[i] : 0) + a; } g = ng; bw.push(Math.hypot(...g)); }
    out[res ? 'res' : 'plain'] = { fw, bw: bw.reverse() };        /* bw[0] = at the input, bw[depth] = at the output (8) */
  });
  return out; }

W.w2_vanishing = function (box) {
  V.say(box, 'הקוד של הסעיף, רץ כאן בדפדפן — אבל במקום מספר אחד בסוף, הוא מראה את גודל הגרדיאנט <b>בכל שכבה</b> בדרך אחורה. הזז את <b>העומק</b> ואת <b>סקאלת האתחול</b> (0.5 בקורס). הקו הכתום: רשת רגילה. הכחול: אותה רשת בדיוק, עם חיבורי דילוג.');
  let depth = 50, scale = 0.5, seed = 0;
  const sr = row(box); const sD = V.slider(sr, 'עומק (שכבות)', 2, 100, 1, depth, v => { depth = v; draw(); }), sS = V.slider(sr, 'סקאלת אתחול', 0.1, 2.5, 0.05, scale, v => { scale = v; draw(); }, v => F(v, 2));
  V.btns(box, [['משקלות אקראיים אחרים', () => { seed++; draw(); }, 'ghost'], ['הערכים של הקורס (0.5)', () => { depth = 50; scale = 0.5; seed = 0; sD.set(50); sS.set(0.5); draw(); }, 'ghost']]);
  const fx = flex(box); const c1 = canvas(colm(fx, 'גודל הגרדיאנט בכל שכבה, מהקלט (שמאל) עד הפלט (ימין) — סקאלה לוגריתמית'), 560, 250, 560);
  legend(box, [['#e8590c', 'רשת רגילה'], ['#4263eb', 'עם חיבורי דילוג'], ['#868e96', 'הגרדיאנט שיצא מהסוף (8)', true]]);
  const c2 = canvas(colm(flex(box), 'וגם האות קדימה: גודל h אחרי כל שכבה'), 560, 120, 560);
  const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const P = gradProfile(depth, scale, seed); const all = P.plain.bw.concat(P.res.bw); const lo = Math.max(-18, Math.floor(log10(Math.min(...all))) - 1), hi = Math.max(2, Math.ceil(log10(Math.max(...all))) + 1);
    logPlot(c1, [{ y: P.plain.bw, color: '#e8590c' }, { y: P.res.bw, color: '#4263eb' }], lo, hi, { hlines: [{ v: 8, color: '#868e96' }], xl: ['קלט', 'פלט (שכבה ' + depth + ')'] });
    const af = P.plain.fw.concat(P.res.fw); logPlot(c2, [{ y: P.plain.fw, color: '#e8590c' }, { y: P.res.fw, color: '#4263eb' }], Math.max(-18, Math.floor(log10(Math.min(...af))) - 1), Math.ceil(log10(Math.max(...af))) + 1, { xl: ['קלט', 'פלט'] });
    const rows = [5, 10, 20, 50, 100].map(dd => { const q = gradProfile(dd, scale, seed); return [dd, fmtE(q.plain.bw[0]), fmtE(q.res.bw[0])]; });
    tb.innerHTML = table(['עומק', 'רגילה: הגרדיאנט בקלט', 'שאריתית: הגרדיאנט בקלט'], rows);
    const gp = P.plain.bw[0], gr = P.res.bw[0];
    out.innerHTML = 'בעומק ' + depth + ' וסקאלה ' + F(scale, 2) + ': לקלט של הרשת הרגילה מגיע גרדיאנט בגודל <b>' + fmtE(gp) + '</b>, ושל השאריתית — <b>' + fmtE(gr) + '</b>' + (gp < 1e-3 ? ' (פי ' + E(gr / gp, 0) + ').' : '.') + ' ' +
      (scale < 0.95 ? 'בסקאלה קטנה מ־1 כל שכבה רגילה <b>מכווצת</b> — הקו הכתום יורד בקו ישר על סקאלה לוגריתמית, כלומר אקספוננציאלית בעומק. גם האות קדימה דועך: השכבות העמוקות מקבלות כמעט אפס. ' :
        scale > 1.3 ? 'בסקאלה גדולה הרשת הרגילה כבר לא דועכת — היא רועשת ולא יציבה, והשאריתית <b>מתפוצצת</b>: כל בלוק מוסיף לאות, והגרדיאנט גדל עם העומק. לכן חיבורי דילוג באים תמיד עם נרמול ואתחול זהיר (תרגיל 5.1). ' :
        'סביב 1 הרשת הרגילה על הגבול: tanh כמעט לינארי, ומטריצה בסקאלה 1 שומרת בערך על הגודל. אבל זה גבול צר — זוז מעט ממנו לכל כיוון. ') +
      'הקו הכחול, לעומת זאת, לא יורד לעולם מתחת ל־8: הגרדיאנט שיצא מהסוף עובר בשלמות דרך קווי הדילוג. המספרים בטבלה לא זהים לקורס (מחולל מספרים אקראיים אחר), אבל סדרי הגודל — כן.'; }
  draw();
};

/* real run: 20 conv layers with and without skip connections (exercise 5.4) */
W.w2_deep_train = function (box) {
  V.say(box, 'מה שהסעיף מראה על 64 מספרים, על רשת אמיתית: 20 שכבות קונבולוציה (16 ערוצים, בלי נרמול), עם ובלי חיבורי דילוג, <b>אומנו במחשב שלך</b> סבב אחד על פריטי הלבוש (תרגיל 5.4). כל 50 צעדים נמדד גודל הגרדיאנט של <b>כל</b> שכבה. בחר אופטימייזר.');
  let opt = 'sgd'; V.tabs(box, ['SGD עם מומנטום', 'AdamW'], k => { opt = k ? 'adamw' : 'sgd'; draw(); });
  const fx = flex(box); const cL = canvas(colm(fx, 'ההפסד באימון'), 340, 220, 340);
  const hm = colm(fx, 'גודל הגרדיאנט: שכבה (מלמעלה — הראשונה) × צעד'); const cP = canvas(hm, 300, 100, 300), cR = canvas(hm, 300, 100, 300); cP.style.imageRendering = cR.style.imageRendering = 'pixelated';
  legend(box, [['#e8590c', 'בלי דילוג'], ['#4263eb', 'עם דילוג']]); const scale = el('div', { class: 'note-small', style: { textAlign: 'center' } }); box.appendChild(scale);
  const out = V.say(box);
  function heatLog(cv, rec, lo, hi, label) { const nS = rec.length, nL = rec[0].length - 2; cv.width = nS; cv.height = nL; const x = cv.getContext('2d'), im = x.createImageData(nS, nL);
    for (let s = 0; s < nS; s++) for (let l = 0; l < nL; l++) { const t = clamp((log10(rec[s][2 + l]) - lo) / (hi - lo), 0, 1), i = 4 * (l * nS + s); const c = t < 0.5 ? [255 - 2 * t * 120, 255 - 2 * t * 60, 255] : [135 - (t - 0.5) * 2 * 135, 195 - (t - 0.5) * 2 * 140, 255 - (t - 0.5) * 2 * 90]; im.data[i] = c[0]; im.data[i + 1] = c[1]; im.data[i + 2] = c[2]; im.data[i + 3] = 255; }
    x.putImageData(im, 0, 0); cv.title = label; }
  function draw() { const D = L5(); if (!D || !D.deep) { out.innerHTML = 'הנתונים מההרצה עוד לא נטענו.'; return; } const P = D.deep['plain_' + opt], R = D.deep['res_' + opt];
    lplot(cL, [{ y: P.rec.map(r => r[1]), color: '#e8590c' }, { y: R.rec.map(r => r[1]), color: '#4263eb' }], [0, 2.5], { hlines: [{ v: Math.log(10), color: '#adb5bd', label: 'ln 10 — ניחוש' }] });
    const all = P.rec.concat(R.rec).flatMap(r => r.slice(2)).filter(v => v > 0); const lo = Math.floor(log10(Math.min(...all))), hi = Math.ceil(log10(Math.max(...all)));
    heatLog(cP, P.rec, lo, hi, 'בלי דילוג'); heatLog(cR, R.rec, lo, hi, 'עם דילוג'); cP.style.height = cR.style.height = '100px'; cP.style.width = cR.style.width = '300px';
    scale.innerHTML = 'למעלה: בלי דילוג. למטה: עם דילוג. לבן — ' + ltr('1e' + lo) + ', כחול כהה — ' + ltr('1e' + hi) + '.';
    const r0 = P.rec[1] || P.rec[0], q0 = R.rec[1] || R.rec[0]; const ratio = rr => rr[2] / rr[rr.length - 1];
    out.innerHTML = 'בצעד 50: בלי דילוג, הגרדיאנט של השכבה הראשונה קטן פי <b>' + fmtE(1 / ratio(r0)) + '</b> מזה של האחרונה; עם דילוג — פי ' + fmtE(1 / ratio(q0)) + '. ' +
      'ההפסד: ' + (P.rec[P.rec.length - 1][1] > 2.2 ? 'בלי דילוג הוא <b>תקוע</b> על ln 10 — הרשת מנחשת. ' : 'בלי דילוג הוא יורד, אבל ' + (P.val < R.val ? 'לאט יותר. ' : 'לא רחוק. ')) +
      'דיוק וולידציה אחרי סבב אחד: בלי דילוג <b>' + (P.val * 100).toFixed(1) + '%</b>, עם דילוג <b>' + (R.val * 100).toFixed(1) + '%</b>. ' +
      (opt === 'adamw' ? 'AdamW מחלק כל עדכון בגודל הגרדיאנט של המשקל עצמו (סעיף 3.5), ולכן גם גרדיאנט קטן מאוד מזיז את השכבה — הוא מסתיר חלק מהבעיה, אבל לא מתקן את הסיבה: האות עדיין לא עובר בין השכבות.' : 'ב־SGD הצעד פרופורציוני לגרדיאנט: השכבות הראשונות כמעט לא זזות.'); }
  draw();
};

/* ===================================================== 5.2 */
function lgamma(z) { const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]; if (z < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * z))) - lgamma(1 - z); z -= 1; let a = c[0]; const t = z + g + 0.5; for (let i = 1; i < 9; i++) a += c[i] / (z + i); return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a); }
const lchoose = (n, k) => lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1);

/* a tiny MLP trained to be the identity, with and without a skip: y = F(x) or y = x + F(x) */
function idNet(H, d, seed) { const r = NN.rng(seed + 5); const p = { W1: new Float64Array(d * H), b1: new Float64Array(H), W2: new Float64Array(H * d), b2: new Float64Array(d) }; for (let i = 0; i < d * H; i++) p.W1[i] = NN.randn(r) * Math.sqrt(2 / d); for (let i = 0; i < H * d; i++) p.W2[i] = NN.randn(r) * Math.sqrt(1 / H); p.m = {}; p.v = {}; ['W1', 'b1', 'W2', 'b2'].forEach(k => { p.m[k] = new Float64Array(p[k].length); p.v[k] = new Float64Array(p[k].length); }); p.t = 0; return p; }
function idStep(p, X, H, d, res, lr) { const N = X.length / d, g = { W1: new Float64Array(d * H), b1: new Float64Array(H), W2: new Float64Array(H * d), b2: new Float64Array(d) }; let loss = 0; const z = new Float64Array(H), h = new Float64Array(H), dh = new Float64Array(H);
  for (let n = 0; n < N; n++) { const x = n * d; for (let j = 0; j < H; j++) { let a = p.b1[j]; for (let i = 0; i < d; i++) a += X[x + i] * p.W1[i * H + j]; z[j] = a; h[j] = a > 0 ? a : 0; } dh.fill(0);
    for (let o = 0; o < d; o++) { let a = p.b2[o] + (res ? X[x + o] : 0); for (let j = 0; j < H; j++) a += h[j] * p.W2[j * d + o]; const e = a - X[x + o]; loss += e * e; const de = 2 * e / (N * d); g.b2[o] += de; for (let j = 0; j < H; j++) { g.W2[j * d + o] += h[j] * de; dh[j] += p.W2[j * d + o] * de; } }
    for (let j = 0; j < H; j++) { if (z[j] <= 0) continue; g.b1[j] += dh[j]; for (let i = 0; i < d; i++) g.W1[i * H + j] += X[x + i] * dh[j]; } }
  if (lr) { p.t++; ['W1', 'b1', 'W2', 'b2'].forEach(k => { const P = p[k], G = g[k], M = p.m[k], Vv = p.v[k]; for (let i = 0; i < P.length; i++) { M[i] = 0.9 * M[i] + 0.1 * G[i]; Vv[i] = 0.999 * Vv[i] + 0.001 * G[i] * G[i]; P[i] -= lr * (M[i] / (1 - Math.pow(0.9, p.t))) / (Math.sqrt(Vv[i] / (1 - Math.pow(0.999, p.t))) + 1e-8); } }); }
  return loss / (N * d); }

W.w2_identity_path = function (box) {
  const tabs = el('div'); box.appendChild(tabs); const A = el('div'), B = el('div'); box.appendChild(A); box.appendChild(B);
  V.tabs(tabs, ['המסלולים שבתוך המכפלה', 'ללמוד "לא לעשות כלום"'], k => { A.style.display = k ? 'none' : ''; B.style.display = k ? '' : 'none'; if (k) startB(); else stopB(); });
  /* ---- part A: the expansion of (I + F'1)(I + F'2)...(I + F'L) ---- */
  V.say(A, 'פותחים את המכפלה ' + ltr('(1 + a)(1 + a)…(1 + a)') + ' של L בלוקים: כל מחובר הוא <b>מסלול</b> — בכל בלוק הגרדיאנט עובר דרך קו הדילוג (1) או דרך הענף (a, הגודל של F′). מסלול שעובר ב־k ענפים תורם ' + ltr('aᵏ') + ', ויש ' + ltr('C(L, k)') + ' כאלה. ברשת רגילה יש רק מסלול אחד — דרך כל הענפים.');
  let Lb = 20, a = 0.5; const sr = row(A); V.slider(sr, 'מספר בלוקים L', 1, 60, 1, Lb, v => { Lb = v; drawA(); }); V.slider(sr, 'גודל הענף, a', 0.05, 1.5, 0.05, a, v => { a = v; drawA(); }, v => F(v, 2));
  const fa = flex(A); const cB = canvas(colm(fa, 'איזה חלק מהגרדיאנט עובר במסלולים באורך k'), 420, 210, 420); const cU = canvas(colm(fa, 'שלושה בלוקים, פרושים: 8 המסלולים'), 230, 210, 230); const outA = V.say(A);
  function drawA() { const x = cB.getContext('2d'); x.clearRect(0, 0, 420, 210); const lt = Math.log(1 + a), sh = []; for (let k = 0; k <= Lb; k++) sh.push(Math.exp(lchoose(Lb, k) + k * Math.log(a) - Lb * lt)); const mx = Math.max(...sh);
    const bw = 380 / (Lb + 1); sh.forEach((v, k) => { const hh = v / mx * 160; x.fillStyle = k === Lb ? '#e8590c' : '#4263eb'; x.fillRect(30 + k * bw, 180 - hh, Math.max(1, bw - 1), Math.max(hh, k === Lb ? 2 : 0)); });
    txt(x, '0', 30, 196, '#868e96', 10); txt(x, String(Lb), 30 + Lb * bw, 196, '#e8590c', 10); txt(x, 'k = מספר הענפים במסלול', 410, 206, '#868e96', 10, 'right'); x.strokeStyle = '#ced4da'; x.beginPath(); x.moveTo(28, 180); x.lineTo(412, 180); x.stroke();
    let c = 0, k90 = 0; for (let k = 0; k <= Lb; k++) { c += sh[k]; if (c >= 0.9) { k90 = k; break; } } const mean = Lb * a / (1 + a);
    /* unrolled three blocks */
    const u = cU.getContext('2d'); u.clearRect(0, 0, 230, 210); for (let m = 0; m < 8; m++) { const bits = [m & 4, m & 2, m & 1].map(Boolean), kk = bits.filter(Boolean).length; const y0 = 8 + m * 24; bits.forEach((b, i) => { u.fillStyle = b ? '#ffd8a8' : '#e7f5ff'; u.fillRect(8 + i * 46, y0, 40, 18); u.strokeStyle = b ? '#e8590c' : '#4263eb'; u.strokeRect(8 + i * 46, y0, 40, 18); txt(u, b ? 'F′' + (i + 1) : 'I', 28 + i * 46, y0 + 13, '#212529', 11, 'center'); }); txt(u, 'a' + '⁰¹²³'[kk] + ' = ' + F(Math.pow(a, kk), 3), 222, y0 + 13, kk === 3 ? '#e8590c' : '#495057', 11, 'right'); }
    outA.innerHTML = 'עם ' + Lb + ' בלוקים ו־a = ' + F(a, 2) + ': הגרדיאנט הכולל של הרשת השאריתית הוא ' + ltr('(1 + a)^L') + ' = <b>' + fmtE(Math.pow(1 + a, Lb)) + '</b>; של הרשת הרגילה — המסלול הכתום בלבד, ' + ltr('a^L') + ' = <b>' + fmtE(Math.pow(a, Lb)) + '</b>. ' +
      'רוב הגרדיאנט עובר במסלולים <b>קצרים</b>: האורך הממוצע ' + F(mean, 1) + ' ענפים, ו־90% עובר במסלולים של עד ' + k90 + '. ' + (a < 1 ? 'כלומר רשת שאריתית עמוקה מתנהגת בזמן האימון כמו אוסף של רשתות רדודות, שחולקות משקלות — וכל אחת מהן קלה לאמן. ' : 'כש־a גדול מ־1, המסלולים הארוכים שולטים והכל גדל — שוב: נרמול ואתחול. ') +
      '<span class="note-small">(תוספת של האתר: הניתוח הזה הוא מהמאמר של Veit ושותפיו, 2016, שהראה שהסרת בלוק בודד מ־ResNet מאומנת כמעט לא פוגעת בה — בניגוד לרשת רגילה.)</span>'; }
  drawA();
  /* ---- part B: learning the identity ---- */
  V.say(B, 'הטענה השנייה של הסעיף: לבלוק שאריתי קל ללמוד "לא לעשות כלום". כאן שתי רשתות קטנות לומדות את פונקציית הזהות, ' + ltr('y = x') + ', על 256 וקטורים אקראיים באורך 8 (חיוביים ושליליים). <b>F</b> היא שכבה נסתרת עם ReLU ושכבת פלט. רגילה: ' + ltr('y = F(x)') + '. שאריתית: ' + ltr('y = x + F(x)') + '. אותו אתחול, אותו Adam.');
  let Hn = 8, pP, pR, step = 0, timer = null, hP = [], hR = []; const dd = 8; const rX = NN.rng(77), Xd = new Float64Array(256 * dd); for (let i = 0; i < Xd.length; i++) Xd[i] = NN.randn(rX);
  const sb = row(B); V.slider(sb, 'נוירונים נסתרים', 2, 32, 1, Hn, v => { Hn = v; resetB(); startB(); }); V.btns(B, [['▶ מההתחלה', () => { resetB(); startB(); }, 'primary']]);
  const cI = canvas(colm(flex(B), 'שגיאה ריבועית ממוצעת, 400 צעדים (סקאלה לוגריתמית)'), 520, 210, 520); legend(B, [['#e8590c', 'y = F(x)'], ['#4263eb', 'y = x + F(x)']]); const outB = V.say(B);
  function resetB() { stopB(); pP = idNet(Hn, dd, 1); pR = idNet(Hn, dd, 1); step = 0; hP = [idStep(pP, Xd, Hn, dd, false, 0)]; hR = [idStep(pR, Xd, Hn, dd, true, 0)]; drawB(); }
  function stopB() { clearInterval(timer); timer = null; }
  function startB() { if (timer || step >= 400) return; if (!pP) resetB(); timer = setInterval(() => { if (!alive(box)) return stopB(); for (let i = 0; i < 8 && step < 400; i++, step++) { hP.push(idStep(pP, Xd, Hn, dd, false, 0.01)); hR.push(idStep(pR, Xd, Hn, dd, true, 0.01)); } drawB(); if (step >= 400) stopB(); }, 30); }
  function drawB() { const all = hP.concat(hR); logPlot(cI, [{ y: hP, color: '#e8590c' }, { y: hR, color: '#4263eb' }], Math.max(-6, Math.floor(log10(Math.min(...all)))), Math.ceil(log10(Math.max(...all))), { xl: ['0', String(Math.max(step, 1))] });
    const lp = hP[hP.length - 1], lr2 = hR[hR.length - 1];
    outB.innerHTML = 'צעד ' + step + ': רגילה <b>' + fmtE(lp) + '</b>, שאריתית <b>' + fmtE(lr2) + '</b>. ' + (step < 400 ? '' : (() => { const f = h => { const i = h.findIndex(v => v < 1e-2); return i < 0 ? null : i; }, a1 = f(hP), a2 = f(hR);
      return 'מתחת ל־0.01: השאריתית ' + (a2 === null ? 'לא הגיעה' : 'בצעד <b>' + a2 + '</b>') + ', הרגילה ' + (a1 === null ? '<b>לא הגיעה</b> ב־400 צעדים' : 'בצעד <b>' + a1 + '</b>') + '. ' +
      'השאריתית רק צריכה ש־F יוציא אפס — מספיק לכווץ את שכבת הפלט. הרגילה צריכה <b>לבנות</b> את הזהות דרך ReLU, שזורק כל ערך שלילי. יש לה שתי דרכים, ושתיהן דורשות חיפוש ארוך: זוג נוירונים לכל רכיב, ' + ltr('x = ReLU(x) − ReLU(−x)') + ' (16 נוירונים לפחות), או להזיז את ההטיה של כל נוירון כל כך גבוה ש־ReLU אף פעם לא חותך, ולהחסיר אותה בסוף. שנה את מספר הנוירונים: השאריתית מהירה בכל גודל; הרגילה תלויה בו מאוד. ' +
      '<span class="note-small">(תוספת: מאותה סיבה, ב־torchvision יש אפשרות <code class="ltr">zero_init_residual=True</code>, שמאתחלת את הנרמול האחרון של כל בלוק לאפס — כך כל בלוק מתחיל בדיוק כזהות.)</span>'; })()); }
  B.style.display = 'none'; resetB();
};

/* ===================================================== 5.3 */
const convP = (ci, co, k) => ci * co * k * k;
W.w2_basic_block = function (box) {
  V.say(box, 'ה־<code class="ltr">BasicBlock</code> של הסעיף, עם הצורות על כל חץ ומספר הפרמטרים בכל שכבה. בחר <b>ערוצי קלט, ערוצי פלט וצעד</b> — וראה מתי קו הדילוג צריך קונבולוציה של 1 על 1. ונסה לבטל אותה, כדי לראות את השגיאה שהייתה מתקבלת.');
  let ci = 64, co = 128, s = 2, H = 56, force = false; const CH = [32, 64, 128, 256, 512];
  box.appendChild(el('div', { class: 'note-small', html: 'ערוצי קלט, ' + ltr('c_in') + ':' })); V.tabs(box, CH.map(String), i => { ci = CH[i]; draw(); }, 1); box.appendChild(el('div', { class: 'note-small', html: 'ערוצי פלט, ' + ltr('c_out') + ':' })); V.tabs(box, CH.map(String), i => { co = CH[i]; draw(); }, 2);
  V.tabs(box, ['stride = 1', 'stride = 2'], k => { s = k ? 2 : 1; draw(); }, 1);
  const r2 = row(box); const cb = el('label', { class: 'note-small', html: '<input type="checkbox"> בטל את התאמת קו הדילוג (תמיד <code class="ltr">nn.Identity()</code>)' }); r2.appendChild(cb); cb.querySelector('input').onchange = e => { force = e.target.checked; draw(); };
  const cv = canvas(colm(flex(box), 'הבלוק, משמאל לימין'), 680, 250, 680); const err = mono(box); const out = V.say(box);
  const real = el('div'); box.appendChild(real);
  function boxAt(x, X, Y, w, t, sub, col) { x.fillStyle = col || '#f1f3f5'; x.fillRect(X, Y, w, 40); x.strokeStyle = '#adb5bd'; x.strokeRect(X, Y, w, 40); txt(x, t, X + w / 2, Y + 17, '#212529', 11, 'center'); if (sub) txt(x, sub, X + w / 2, Y + 32, '#868e96', 10, 'center'); }
  function arrow(x, x0, y0, x1, y1, lab, col) { x.strokeStyle = col || '#495057'; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); x.fillStyle = col || '#495057'; x.beginPath(); x.moveTo(x1, y1); x.lineTo(x1 - 6, y1 - 3); x.lineTo(x1 - 6, y1 + 3); x.fill(); if (lab) txt(x, lab, (x0 + x1) / 2, y0 === y1 && y0 < 150 ? y0 - 26 : Math.min(y0, y1) - 5, '#4263eb', 9, 'center'); }
  function draw() { const Ho = Math.floor((H + 2 - 3) / s) + 1, need = s !== 1 || ci !== co, useConv = need && !force; const x = cv.getContext('2d'); x.clearRect(0, 0, 680, 250);
    const shIn = '(' + ci + ',' + H + ',' + H + ')', shMid = '(' + co + ',' + Ho + ',' + Ho + ')';
    const p1 = convP(ci, co, 3), p2 = convP(co, co, 3), pb = 2 * co, ps = useConv ? convP(ci, co, 1) + 2 * co : 0;
    txt(x, 'x', 14, 95, '#212529', 13); txt(x, shIn, 30, 120, '#4263eb', 9, 'center');
    boxAt(x, 50, 70, 92, 'conv 3×3, s=' + s, fmtN(p1)); arrow(x, 24, 90, 50, 90); boxAt(x, 172, 70, 50, 'BN', fmtN(pb)); arrow(x, 142, 90, 172, 90, shMid); boxAt(x, 244, 70, 50, 'ReLU', '0'); arrow(x, 222, 90, 244, 90);
    boxAt(x, 318, 70, 92, 'conv 3×3', fmtN(p2)); arrow(x, 294, 90, 318, 90, shMid); boxAt(x, 432, 70, 50, 'BN', fmtN(pb)); arrow(x, 410, 90, 432, 90);
    const bad = !useConv && need; x.beginPath(); x.arc(530, 90, 15, 0, 7); x.fillStyle = bad ? '#ffe3e3' : '#fff'; x.fill(); x.strokeStyle = bad ? '#c92a2a' : '#495057'; x.stroke(); txt(x, '+', 530, 95, bad ? '#c92a2a' : '#212529', 16, 'center'); arrow(x, 482, 90, 515, 90, shMid);
    boxAt(x, 572, 70, 50, 'ReLU', '0'); arrow(x, 545, 90, 572, 90); arrow(x, 622, 90, 660, 90); txt(x, bad ? '✗' : shMid, 640, 120, bad ? '#c92a2a' : '#4263eb', 9, 'center');
    x.strokeStyle = '#495057'; x.beginPath(); x.moveTo(30, 90); x.lineTo(30, 190); x.stroke();
    if (useConv) { arrow(x, 30, 190, 230, 190, shIn); boxAt(x, 230, 170, 110, 'conv 1×1, s=' + s, fmtN(convP(ci, co, 1)), '#fff3bf'); boxAt(x, 360, 170, 50, 'BN', fmtN(2 * co), '#fff3bf'); arrow(x, 340, 190, 360, 190); x.beginPath(); x.moveTo(410, 190); x.lineTo(530, 190); x.lineTo(530, 105); x.stroke(); txt(x, shMid, 470, 184, '#4263eb', 9, 'center'); }
    else { x.beginPath(); x.moveTo(30, 190); x.lineTo(530, 190); x.lineTo(530, 105); x.stroke(); txt(x, 'nn.Identity() — ' + shIn, 280, 184, bad ? '#c92a2a' : '#2b8a3e', 10, 'center'); }
    const tot = p1 + p2 + 2 * pb + ps;
    txt(x, 'פרמטרים בבלוק: ' + fmtN(tot), 660, 236, '#212529', 12, 'right');
    if (bad) { const dim = Ho !== H ? 3 : 1, A = Ho !== H ? Ho : co, Bv = Ho !== H ? H : ci; err.style.display = ''; err.textContent = 'RuntimeError: The size of tensor a (' + A + ') must match the size of tensor b (' + Bv + ') at non-singleton dimension ' + dim; }
    else err.style.display = 'none';
    out.innerHTML = (need ? (useConv ? 'הענף ' + (s !== 1 ? 'מקטין את הגודל (' + H + ' ל־' + Ho + ')' : '') + (s !== 1 && ci !== co ? ' ו' : '') + (ci !== co ? 'משנה את מספר הערוצים (' + ci + ' ל־' + co + ')' : '') + ', ולכן x עובר קונבולוציה של 1 על 1 עם אותו צעד: ' + fmtN(ps) + ' פרמטרים, ' + (ps / tot * 100).toFixed(1) + '% מהבלוק. ' : badge(false, 'שגיאה') + ' — אי אפשר לחבר מערכים בצורות שונות, וזו בדיוק השגיאה ש־PyTorch היה זורק בשורה <code class="ltr">out + self.shortcut(x)</code>. ') : badge(true, 'קו דילוג ריק') + ' — הצורות שוות, קו הדילוג הוא <code class="ltr">nn.Identity()</code> ואין בו אף פרמטר. כך רוב הבלוקים ב־ResNet: רק הראשון בכל שלב צריך התאמה. ') +
      'שתי הקונבולוציות בלי הטיה (<code class="ltr">bias=False</code>), כי ה־BN שאחריהן מחסיר את הממוצע ממילא; כל BN מוסיף 2 פרמטרים לערוץ (קנה מידה והזזה). ' + (ci === 64 && co === 128 && s === 2 ? 'הבלוק של הסעיף: <b>230,144</b> פרמטרים — וזה בדיוק מה שהדפיס PyTorch במחשב שלך.' : '');
    const D = L5(); if (D && D.resnet) { const R = D.resnet, P = R.params, Hh = R.hist, H4 = (L4() || {}).hist; real.innerHTML = '<div class="note-small" style="text-align:center;margin-top:8px"><b>מהבלוקים לרשת (תרגיל 5.3), אומנה במחשב שלך:</b> כניסה של 32 ערוצים, שלושה בלוקים (32, 64, 128), כינוס ממוצע גלובלי ושכבה מלאה.</div>' +
      table(['חלק', 'כניסה', 'בלוק 1', 'בלוק 2', 'בלוק 3', 'שכבה מלאה', 'סך הכל'], [['פרמטרים', fmtN(P.stem), fmtN(P.block1), fmtN(P.block2), fmtN(P.block3), fmtN(P.fc), '<b>' + fmtN(P.total) + '</b>']]) +
      table(['סבב', 'הפסד אימון', 'דיוק וולידציה', 'זמן', 'SmallCNN (סעיף 4.6), אותו סבב'], Hh.map((h, i) => [i, F(h[0], 3), '<b>' + (h[1] * 100).toFixed(1) + '%</b>', F(h[2], 0) + ' שנ׳', H4 ? (H4[i][1] * 100).toFixed(1) + '%' : '—'])); } }
  draw();
};

/* ===================================================== 5.4 */
function resnetSpec(depth, Hin) { const cfg = { 18: ['b', [2, 2, 2, 2]], 34: ['b', [3, 4, 6, 3]], 50: ['k', [3, 4, 6, 3]], 101: ['k', [3, 4, 23, 3]] }[depth]; const kind = cfg[0], ns = cfg[1], ex = kind === 'b' ? 1 : 4;
  const cv = (ci, co, k, s, H) => { const Ho = Math.floor((H + 2 * Math.floor(k / 2) - k) / s) + 1; return [ci * co * k * k, Ho * Ho * ci * co * k * k, Ho]; };
  const rows = []; let [p, m, H] = cv(3, 64, 7, 2, Hin); rows.push({ name: 'גזע', H: Math.floor((H + 2 - 3) / 2) + 1, C: 64, n: '—', P: p + 128, M: m }); H = rows[0].H; let inp = 64;
  [64, 128, 256, 512].forEach((pl, i) => { let sp = 0, sm = 0; for (let b = 0; b < ns[i]; b++) { const s = b === 0 && i > 0 ? 2 : 1; let H2;
      if (kind === 'b') { const a = cv(inp, pl, 3, s, H), c = cv(pl, pl, 3, 1, a[2]); sp += a[0] + c[0] + 4 * pl; sm += a[1] + c[1]; H2 = a[2]; }
      else { const a = cv(inp, pl, 1, 1, H), c = cv(pl, pl, 3, s, H), e = cv(pl, pl * 4, 1, 1, c[2]); sp += a[0] + c[0] + e[0] + 4 * pl + 8 * pl; sm += a[1] + c[1] + e[1]; H2 = c[2]; }
      if (s !== 1 || inp !== pl * ex) { const dn = cv(inp, pl * ex, 1, s, H); sp += dn[0] + 2 * pl * ex; sm += dn[1]; } inp = pl * ex; H = H2; }
    rows.push({ name: 'שלב ' + (i + 1), H, C: inp, n: ns[i], P: sp, M: sm }); });
  rows.push({ name: 'ראש', H: 1, C: 1000, n: '—', P: inp * 1000 + 1000, M: inp * 1000 }); return { rows, kind, P: rows.reduce((a, r) => a + r.P, 0), M: rows.reduce((a, r) => a + r.M, 0) }; }

W.w2_resnet_stages = function (box) {
  V.say(box, 'ResNet מחושבת שלב אחר שלב — בדיוק לפי המבנה של torchvision. בחר <b>עומק</b> ו<b>גודל קלט</b>. העמודות: כמה מהפרמטרים, וכמה מהחישוב (כפל־וחיבור), בכל חלק.');
  let depth = 18, Hin = 224; V.tabs(box, ['ResNet-18', 'ResNet-34', 'ResNet-50', 'ResNet-101'], k => { depth = [18, 34, 50, 101][k]; draw(); });
  const sr = row(box); V.slider(sr, 'גודל הקלט (פיקסלים)', 64, 1024, 32, Hin, v => { Hin = v; draw(); });
  const tb = el('div'); box.appendChild(tb); const cv = canvas(colm(flex(box), 'אחוז מהפרמטרים (סגול) ומהחישוב (ירוק) בכל חלק'), 600, 190, 600); const out = V.say(box);
  function draw() { const S = resnetSpec(depth, Hin);
    tb.innerHTML = table(['חלק', 'בלוקים', 'גודל מפה', 'ערוצים', 'פרמטרים', 'חישוב (מיליארדי כפל־וחיבור)'], S.rows.map(r => [r.name, r.n, r.H + '×' + r.H, fmtN(r.C), fmtN(r.P), F(r.M / 1e9, 3)]).concat([['<b>סך הכל</b>', '', '', '', '<b>' + fmtN(S.P) + '</b>', '<b>' + F(S.M / 1e9, 2) + '</b>']]));
    const x = cv.getContext('2d'); x.clearRect(0, 0, 600, 190); const bw = 600 / S.rows.length; S.rows.forEach((r, i) => { const hp = r.P / S.P * 140, hm = r.M / S.M * 140, X = i * bw + bw / 2; x.fillStyle = '#7048e8'; x.fillRect(X - 26, 160 - hp, 24, hp); x.fillStyle = '#2f9e44'; x.fillRect(X + 2, 160 - hm, 24, hm); txt(x, (r.P / S.P * 100).toFixed(0) + '%', X - 14, 155 - hp, '#7048e8', 9, 'center'); txt(x, (r.M / S.M * 100).toFixed(0) + '%', X + 14, 155 - hm, '#2f9e44', 9, 'center'); txt(x, r.name, X, 178, '#495057', 11, 'center'); });
    const last = S.rows[4], bott = S.kind === 'k';
    out.innerHTML = 'ResNet-' + depth + ' על קלט של ' + Hin + ': <b>' + fmtN(S.P) + '</b> פרמטרים ו־<b>' + F(S.M / 1e9, 2) + '</b> מיליארד כפל־וחיבור. ' + (depth === 18 && Hin === 224 ? 'המספר הזה, 11,689,512, הוא בדיוק מה ש־torchvision הדפיסה במחשב שלך (הקוד של הסעיף). ' : '') +
      'שתי עובדות קופצות: (1) רוב ה<b>פרמטרים</b> בשלב האחרון — ' + (last.P / S.P * 100).toFixed(0) + '% — כי שם 512 ערוצים, ומספר המשקלות של קונבולוציה גדל בריבוע מספר הערוצים. (2) ה<b>חישוב</b> מתחלק כמעט שווה בין השלבים: כל שלב מכפיל ערוצים ב־2 (פי 4 משקלות) אבל מחלק את הגודל ב־2 בכל ציר (רבע מהמקומות) — וזה בדיוק מתקזז. זו הסיבה לכלל "חצי גודל, פי 2 ערוצים". ' +
      'הזז את גודל הקלט: הפרמטרים לא משתנים בכלל, והחישוב גדל בריבוע הגודל — ב־640 (מזהים, מודול 4) פי ' + F(Math.pow(640 / 224, 2), 1) + ' מ־224. ' +
      (bott ? 'ב־ResNet-' + depth + ' כל בלוק הוא צוואר בקבוק: בשלב 3, למשל, 1024 ערוצים נכנסים, 1×1 מצמצם ל־256, 3×3 עובד ב־256, ו־1×1 מרחיב ל־1024 — ' + fmtN(1024 * 256 + 256 * 256 * 9 + 256 * 1024) + ' משקלות, לעומת ' + fmtN(2 * 1024 * 1024 * 9) + ' לשתי קונבולוציות 3×3 רגילות ב־1024 ערוצים: פי ' + F(2 * 1024 * 1024 * 9 / (1024 * 256 + 256 * 256 * 9 + 256 * 1024), 0) + ' פחות.' : 'ב־18 ו־34 הבלוק בסיסי (שתי 3×3). עבור ל־50 כדי לראות בלוקי צוואר בקבוק — עם פי 4 יותר ערוצים ביציאה, ובכל זאת כמעט אותו חישוב כמו 34.');
  }
  draw();
};

/* ===================================================== 5.5 */
W.w2_depthwise = function (box) {
  V.say(box, 'מה ConvNeXt שינתה בבלוק, במספרים. למעלה: איזה ערוץ קלט כל ערוץ פלט "רואה" — בקונבולוציה רגילה, ערוץ־ערוץ (<code class="ltr">groups=dim</code>) ו־1×1. למטה: פרמטרים וחישוב של שלושה בלוקים באותו ממד. בחר <b>ממד</b> ו<b>גודל גרעין</b>.');
  let dim = 96, k = 7, Hs = 56; const sr = row(box); V.slider(sr, 'ממד (ערוצים)', 16, 768, 16, dim, v => { dim = v; draw(); }); V.tabs(box, ['k = 3', 'k = 5', 'k = 7'], i => { k = [3, 5, 7][i]; draw(); }, 2);
  const cg = canvas(colm(flex(box), 'מי מחובר למי: 12 ערוצי קלט (שורות) × 12 ערוצי פלט (עמודות)'), 600, 170, 600); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function grid(x, X0, title, f, sub) { const c = 9; txt(x, title, X0 + 54, 14, '#212529', 11, 'center'); for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) { const v = f(i, j); x.fillStyle = v ? (v === 2 ? '#7048e8' : '#4263eb') : '#f1f3f5'; x.fillRect(X0 + j * c, 22 + i * c, c - 1, c - 1); } txt(x, sub, X0 + 54, 150, '#868e96', 10, 'center'); }
  function draw() { const x = cg.getContext('2d'); x.clearRect(0, 0, 600, 170);
    grid(x, 30, 'רגילה ' + k + '×' + k, () => 1, 'כל תא: ' + k * k + ' משקלות'); grid(x, 240, 'ערוץ־ערוץ ' + k + '×' + k, (i, j) => i === j ? 1 : 0, 'רק האלכסון: ' + k * k + ' לתא'); grid(x, 450, '1×1 (pw)', () => 2, 'כל תא: משקל אחד');
    const A = Hs * Hs, std = [dim * dim * k * k, A * dim * dim * k * k], dw = [dim * k * k, A * dim * k * k], pw = [dim * dim, A * dim * dim];
    const basic = [2 * dim * dim * 9 + 4 * dim, 2 * A * dim * dim * 9], q = Math.max(1, dim / 4), bott = [dim * q + q * q * 9 + q * dim + 4 * q + 2 * dim, A * (dim * q + q * q * 9 + q * dim)];
    const cnx = [dim * 49 + dim + 2 * dim + dim * 4 * dim + 4 * dim + 4 * dim * dim + dim, A * (dim * 49 + 8 * dim * dim)];
    tb.innerHTML = table(['שכבה בודדת, ' + dim + ' ערוצים, מפה ' + Hs + '×' + Hs, 'פרמטרים', 'מיליוני כפל־וחיבור'], [['קונבולוציה רגילה ' + k + '×' + k, fmtN(std[0]), F(std[1] / 1e6, 1)], ['ערוץ־ערוץ ' + k + '×' + k, fmtN(dw[0]), F(dw[1] / 1e6, 1)], ['1×1', fmtN(pw[0]), F(pw[1] / 1e6, 1)]]) +
      table(['בלוק שלם, ' + dim + ' ערוצים', 'פרמטרים', 'מיליוני כפל־וחיבור', 'מה רואה'], [['ResNet בסיסי (שתי 3×3)', fmtN(basic[0]), F(basic[1] / 1e6, 1), '5×5'], ['ResNet צוואר בקבוק (÷4)', fmtN(bott[0]), F(bott[1] / 1e6, 1), '3×3'], ['ConvNeXt (הקוד של הסעיף)', fmtN(cnx[0]), F(cnx[1] / 1e6, 1), '7×7']]);
    out.innerHTML = 'ערוץ־ערוץ חוסך פי <b>' + dim + '</b> (מספר הערוצים) — ולכן גרעין של ' + k + '×' + k + ' עולה ' + fmtN(dw[0]) + ' משקלות במקום ' + fmtN(std[0]) + '. המחיר: כל ערוץ רואה רק את עצמו, ואין ערבוב בין ערוצים. את זה עושות שתי שכבות ה־1×1 — ושם כמעט כל הפרמטרים של בלוק ConvNeXt: ' + (8 * dim * dim / cnx[0] * 100).toFixed(0) + '%. ' +
      (dim === 96 ? 'בממד 96 הבלוק של הסעיף מכיל <b>79,200</b> פרמטרים — וזה מה ש־PyTorch הדפיס במחשב שלך (4,800 בקונבולוציה המרחבית, 74,208 בשתי שכבות ה־1×1). ' : '') +
      'התוצאה: בלוק ConvNeXt רואה 7×7 בבת אחת, בפחות חישוב מבלוק ResNet בסיסי שרואה 5×5. ConvNeXt-T כולה: 28,589,128 פרמטרים (נבדק במחשב שלך) — יותר מ־ResNet-18, בערך כמו ResNet-50, ומדויקת יותר משתיהן. ' +
      '<span class="note-small">אזהרה: "פחות כפל־וחיבור" לא תמיד אומר "מהיר יותר". קונבולוציה ערוץ־ערוץ מבצעת מעט חישוב על הרבה זיכרון, ובכרטיסים ובמאיצים רבים היא איטית ממה שהמספר מרמז (מודול 6).</span>'; }
  draw();
};

/* ===================================================== chapter 6 */
const L6 = () => window.M2LAB6 || null;          /* real data: a small ViT trained on the user's computer (content/m2_lab6data.js) */
/* a 224×224 colour scene, drawn once: sky, sun, hills, a house, a road — so patches have content */
const SCENE = (() => { const S = 224, d = new Uint8ClampedArray(S * S * 3); const r = NN.rng(9);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const i = 3 * (y * S + x); let c;
    const hill = 120 + 18 * Math.sin(x / 23) + 10 * Math.sin(x / 9 + 1);
    if (y < hill) { const t = y / hill; c = [90 + 90 * t, 150 + 70 * t, 235 - 20 * t]; if ((x - 168) ** 2 + (y - 48) ** 2 < 20 ** 2) c = [255, 214, 70]; }
    else { const t = (y - hill) / (S - hill); c = [70 + 30 * t, 140 - 30 * t, 60]; if (Math.abs(x - 112 - (y - 200) * 0.9) < 6 + (y - hill) * 0.25 && y > 150) c = [120, 120, 125]; }
    if (x > 40 && x < 100 && y > 105 && y < 165) c = [196, 80, 60]; if (x > 60 && x < 78 && y > 135 && y < 165) c = [90, 55, 40]; if (x > 80 && x < 94 && y > 115 && y < 128) c = [210, 230, 255];
    if (y > 75 && y <= 105 && x > 40 + (105 - y) && x < 100 - (105 - y)) c = [110, 60, 50];
    const n = (r() - 0.5) * 10; d[i] = c[0] + n; d[i + 1] = c[1] + n; d[i + 2] = c[2] + n; }
  return { S, d }; })();
function sceneTo(cv, css) { const S = SCENE.S; cv.width = S; cv.height = S; if (css) cv.style.width = css + 'px'; const x = cv.getContext('2d'), im = x.createImageData(S, S); for (let i = 0; i < S * S; i++) { im.data[4 * i] = SCENE.d[3 * i]; im.data[4 * i + 1] = SCENE.d[3 * i + 1]; im.data[4 * i + 2] = SCENE.d[3 * i + 2]; im.data[4 * i + 3] = 255; } x.putImageData(im, 0, 0); return x; }
/* patchify of section 6.1: rows = patches in reading order, each p*p*3 numbers (0..1) */
function patchify(p) { const S = SCENE.S, g = S / p, out = []; for (let a = 0; a < g; a++) for (let b = 0; b < g; b++) { const v = new Float32Array(p * p * 3); let k = 0; for (let y = 0; y < p; y++) for (let x = 0; x < p; x++) for (let c = 0; c < 3; c++) v[k++] = SCENE.d[3 * ((a * p + y) * S + b * p + x) + c] / 255; out.push(v); } return out; }

W.w2_patchify = function (box) {
  V.say(box, 'תמונה של 224 על 224 הופכת לרצף של "מילים". <b>בחר גודל טלאי</b>, ו<b>העבר את העכבר</b> על התמונה: הטלאי מסומן, ומתחת — המקום שלו ברצף, והווקטור שלו (כל הפיקסלים, שורה אחר שורה, R G B לכל פיקסל — כמו ה־reshape של הסעיף).');
  let p = 16, hov = 17; const PS = [8, 14, 16, 28, 32, 56]; V.tabs(box, PS.map(v => 'טלאי ' + v), i => { p = PS[i]; hov = Math.min(hov, (224 / p) ** 2 - 1); draw(); }, 2);
  const fx = flex(box); const cI = canvas(colm(fx, 'התמונה, עם רשת הטלאים'), 224, 224, 280); const cS = canvas(colm(fx, 'הרצף: טלאי אחרי טלאי, בסדר קריאה (שורה עליונה קודם)'), 380, 280, 380);
  const cV = canvas(colm(flex(box), 'הווקטור של הטלאי המסומן (כל עמודה דקה = מספר אחד, בגוון שלו)'), 640, 50, 640); const out = V.say(box);
  cI.addEventListener('mousemove', e => { const b = cI.getBoundingClientRect(), x = (e.clientX - b.left) / b.width * 224, y = (e.clientY - b.top) / b.height * 224, g = 224 / p; const k = Math.floor(clamp(y, 0, 223) / p) * g + Math.floor(clamp(x, 0, 223) / p); if (k !== hov) { hov = k; draw(); } });
  function draw() { const g = 224 / p, N = g * g, x = sceneTo(cI, 280); x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 0.6; for (let i = 1; i < g; i++) { x.beginPath(); x.moveTo(i * p, 0); x.lineTo(i * p, 224); x.moveTo(0, i * p); x.lineTo(224, i * p); x.stroke(); }
    const ha = Math.floor(hov / g), hb = hov % g; x.strokeStyle = '#e8590c'; x.lineWidth = 2; x.strokeRect(hb * p + 1, ha * p + 1, p - 2, p - 2);
    /* the sequence */
    const s = cS.getContext('2d'); s.clearRect(0, 0, 380, 280); const cols = Math.min(N, 28), cell = Math.max(3, Math.floor(370 / cols)), rows = Math.ceil(N / cols); const sz = Math.min(cell, Math.floor(270 / rows));
    for (let k = 0; k < N; k++) { const a = Math.floor(k / g), b = k % g; s.drawImage(cI, b * p, a * p, p, p, 5 + (k % cols) * sz, 5 + Math.floor(k / cols) * sz, sz - 1, sz - 1); }
    s.strokeStyle = '#e8590c'; s.lineWidth = 2; s.strokeRect(5 + (hov % cols) * sz - 1, 5 + Math.floor(hov / cols) * sz - 1, sz + 1, sz + 1);
    /* the vector */
    const v = patchify(p)[hov], L = v.length, w = cV.getContext('2d'); w.clearRect(0, 0, 640, 50); const bw = 640 / L; for (let i = 0; i < L; i += 3) { w.fillStyle = 'rgb(' + Math.round(v[i] * 255) + ',' + Math.round(v[i + 1] * 255) + ',' + Math.round(v[i + 2] * 255) + ')'; w.fillRect(i * bw, 4, Math.max(bw * 3, 0.5), 30); } txt(w, '0', 2, 46, '#868e96', 10); txt(w, String(L - 1), 638, 46, '#868e96', 10, 'right');
    const emb = L * 768 + 768;
    out.innerHTML = 'טלאי של ' + p + ' על ' + p + ': רשת של ' + g + ' על ' + g + ' = <b>' + N + ' מילים</b>, וכל אחת וקטור של ' + ltr(p + '·' + p + '·3 = ' + fmtN(L)) + ' מספרים. הטלאי המסומן הוא מילה מספר <b>' + hov + '</b> ברצף (שורה ' + ha + ', עמודה ' + hb + ': ' + ltr(ha + '·' + g + ' + ' + hb) + '). ' +
      'שכבת השיכון ל־768 ממדים (כמו ViT-B): ' + ltr(fmtN(L) + '·768 + 768') + ' = ' + fmtN(emb) + ' פרמטרים' + (p === 16 ? ' — 590,592, כמו בתרגיל 6.2' : '') + '. מטריצת הקשב: ' + ltr(fmtN(N + 1) + '²') + ' = ' + fmtN((N + 1) ** 2) + ' זוגות (עם CLS). ' +
      (p <= 8 ? 'טלאים קטנים: פרטים עדינים, אבל רצף ארוך — והקשב עולה בריבוע האורך.' : p >= 32 ? 'טלאים גדולים: רצף קצר וזול, אבל כל מילה כבר מכילה עצם שלם, והפרטים בתוכה נדחסים לווקטור אחד.' : 'זה האיזון של ViT-B/16: 196 מילים — מספיק פרטים, ועדיין זול.') +
      ' <span class="note-small">והאקדח המעשן: ' + ltr('Conv2d(3, 768, kernel_size=' + p + ', stride=' + p + ')') + ' — חלונות שלא חופפים, אותם משקלות לכל חלון — היא בדיוק החיתוך הזה ואחריו אותה שכבה מלאה לכל טלאי.</span>'; }
  draw();
};

/* ===================================================== 6.2 */
function attnRows(Q, K, scale) { const N = Q.length, d = Q[0].length, A = []; for (let i = 0; i < N; i++) { const s = []; for (let j = 0; j < N; j++) { let a = 0; for (let t = 0; t < d; t++) a += Q[i][t] * K[j][t]; s.push(a * scale); } const m = Math.max(...s), e = s.map(v => Math.exp(v - m)), S = e.reduce((a, b) => a + b, 0); A.push(e.map(v => v / S)); } return A; }
const randMat = (r, n, m, s) => [...Array(n)].map(() => [...Array(m)].map(() => NN.randn(r) * (s || 1)));
const matMul = (A, B) => A.map(row => B[0].map((_, j) => row.reduce((a, v, t) => a + v * B[t][j], 0)));

W.w2_attention = function (box) {
  const tabs = el('div'); box.appendChild(tabs); const A1 = el('div'), A2 = el('div'); box.appendChild(A1); box.appendChild(A2); A2.style.display = 'none';
  V.tabs(tabs, ['קשב על תמונה', 'הקוד של הסעיף, ו־√d'], k => { A1.style.display = k ? 'none' : ''; A2.style.display = k ? '' : 'none'; if (k) drawB(); else drawA(); });
  /* ---- A: attention between the 49 patches of the scene, with Q = K = the mean colour (and position) ---- */
  V.say(A1, 'הקשב של הסעיף על 49 הטלאים של התמונה (טלאי 32). כדי לראות מה קורה, המאפיין של כל טלאי פשוט: <b>הצבע הממוצע שלו</b> (מינוס הממוצע של התמונה), והשאילתה והמפתח הם המאפיין עצמו — כאילו ' + ltr('W_q = W_k = I') + '. <b>לחץ על טלאי</b>: החום מראה כמה קשב הוא נותן לכל אחד מהאחרים — שורה אחת של A.');
  let sel = 10, temp = 80, usePos = false; const sr = row(A1); V.slider(sr, 'חדות, ' + ltr('1/√d'), 1, 400, 1, temp, v => { temp = v; drawA(); }); const cb = el('label', { class: 'note-small', html: '<input type="checkbox"> הוסף מיקום למאפיין (סעיף 6.3)' }); sr.appendChild(cb); cb.querySelector('input').onchange = e => { usePos = e.target.checked; drawA(); };
  const fa = flex(A1); const cI = canvas(colm(fa, 'התמונה; כתום — הטלאי שבחרת'), 224, 224, 280); const cA = canvas(colm(fa, 'שורה של A: הקשב שלו לכל טלאי'), 224, 224, 280); const outA = V.say(A1);
  const feats = (() => { const P = patchify(32), F0 = P.map(v => { let r = 0, g = 0, b = 0; for (let i = 0; i < v.length; i += 3) { r += v[i]; g += v[i + 1]; b += v[i + 2]; } const n = v.length / 3; return [r / n, g / n, b / n]; }); const mu = [0, 1, 2].map(c => F0.reduce((a, f) => a + f[c], 0) / F0.length); return F0.map(f => f.map((v, c) => v - mu[c])); })();
  cI.addEventListener('click', e => { const b = cI.getBoundingClientRect(); if (!b.width || !b.height) return; sel = clamp(Math.floor((e.clientY - b.top) / b.height * 7), 0, 6) * 7 + clamp(Math.floor((e.clientX - b.left) / b.width * 7), 0, 6); drawA(); });
  function drawA() { if (!(sel >= 0 && sel < 49)) sel = 10; const X = feats.map((f, k) => usePos ? f.concat([(k % 7 - 3) * 0.08, (Math.floor(k / 7) - 3) * 0.08]) : f); const A = attnRows(X, X, temp); const row0 = A[sel], mx = Math.max(...row0);
    const x = sceneTo(cI, 280); x.strokeStyle = '#e8590c'; x.lineWidth = 3; x.strokeRect((sel % 7) * 32 + 1, Math.floor(sel / 7) * 32 + 1, 30, 30);
    const c = sceneTo(cA, 280); for (let k = 0; k < 49; k++) { const t = row0[k] / mx; c.fillStyle = 'rgba(0,0,0,' + (0.85 * (1 - t)) + ')'; c.fillRect((k % 7) * 32, Math.floor(k / 7) * 32, 32, 32); if (row0[k] > 0.02) txt(c, (row0[k] * 100).toFixed(0) + '%', (k % 7) * 32 + 16, Math.floor(k / 7) * 32 + 20, '#fff', 10, 'center'); }
    const top = row0.map((v, k) => [v, k]).sort((a, b) => b[0] - a[0]); const eff = 1 / row0.reduce((a, v) => a + v * v, 0);
    outA.innerHTML = 'הטלאי שבחרת נותן ' + (top[0][0] * 100).toFixed(0) + '% מהקשב לטלאי הכי דומה לו' + (top[0][1] === sel ? ' (לעצמו)' : '') + ', וסכום כל השורה הוא 1 (סופטמקס). בפועל הוא "מקשיב" לכ־<b>' + F(eff, 1) + '</b> טלאים. ' + (usePos ? 'עם המיקום במאפיין, טלאים קרובים מקבלים תוספת — גם בלי צבע דומה. ' : 'שים לב: הקשב לא תלוי במרחק — טלאי שמיים בפינה אחת מקשיב לשמיים בפינה השנייה. קונבולוציה לא יכולה לעשות את זה בשכבה אחת. ') +
      'החדות היא מה שהחלוקה ב־√d שולטת בה: חדות גבוהה — כמעט כל הקשב לטלאי אחד; נמוכה — ממוצע של כולם. במודל אמיתי ' + ltr('W_q') + ' ו־' + ltr('W_k') + ' נלמדות, וכל ראש לומד "דמיון" מסוג אחר.'; }
  /* ---- B: the code of the section, and exercise 6.3 ---- */
  V.say(A2, 'הקוד של הסעיף: ' + ltr('N = 5') + ' מילים, ממד d. הטבלה העליונה — מטריצת הקשב A (כל שורה סוכמת ל־1). <b>הגדל את d</b> וסמן/בטל את החלוקה ב־√d — זה תרגיל 6.3.');
  let d = 8, div = true, seed = 1; const sb = row(A2); V.slider(sb, 'd', 2, 512, 2, d, v => { d = v; drawB(); }); const cb2 = el('label', { class: 'note-small', html: '<input type="checkbox" checked> חלוקה ב־√d' }); sb.appendChild(cb2); cb2.querySelector('input').onchange = e => { div = e.target.checked; drawB(); };
  V.btns(A2, [['משקלות אחרים', () => { seed++; drawB(); }, 'ghost']]); const tbB = el('div'); A2.appendChild(tbB); const outB = V.say(A2);
  function drawB() { const r = NN.rng(seed * 31 + 7), N = 5, X = randMat(r, N, d), Wq = randMat(r, d, d, 1 / Math.sqrt(d)), Wk = randMat(r, d, d, 1 / Math.sqrt(d)); const Q = matMul(X, Wq), K = matMul(X, Wk); const A = attnRows(Q, K, div ? 1 / Math.sqrt(d) : 1);
    let ss = 0, n = 0; Q.forEach((q, i) => K.forEach(k => { const v = q.reduce((a, t, j) => a + t * k[j], 0) * (div ? 1 / Math.sqrt(d) : 1); ss += v * v; n++; })); const sd = Math.sqrt(ss / n);
    tbB.innerHTML = table(['', 'מילה 0', 'מילה 1', 'מילה 2', 'מילה 3', 'מילה 4', 'סכום', 'הכי גדול'], A.map((rw, i) => ['מילה ' + i].concat(rw.map(v => '<span style="background:rgba(66,99,235,' + v.toFixed(2) + ');padding:1px 4px;border-radius:3px;color:' + (v > 0.55 ? '#fff' : '#212529') + '">' + v.toFixed(2) + '</span>'), [F(rw.reduce((a, b) => a + b, 0), 2), '<b>' + F(Math.max(...rw), 2) + '</b>'])));
    const mxs = A.map(rw => Math.max(...rw)), mean = mxs.reduce((a, b) => a + b, 0) / 5;
    outB.innerHTML = 'd = ' + d + ', ' + (div ? 'עם' : '<b>בלי</b>') + ' חלוקה: סטיית התקן של הציונים לפני הסופטמקס ≈ <b>' + F(sd, 1) + '</b>, והמשקל הגדול בכל שורה בממוצע <b>' + F(mean, 2) + '</b>. ' + (div ? 'החלוקה ב־√d מחזירה את הציונים לסטייה של בערך 1, בכל ממד — הסופטמקס נשאר "רך", וכל מילה מקבלת מידע מכמה מילים.' : 'בלי החלוקה, סכום של d מכפלות גדל כמו √d' + (d >= 64 ? ' — כאן סטייה של ' + F(sd, 0) + ' — והסופטמקס הופך לבחירה של מילה אחת: שורות של כמעט 1 ואפסים. שם הגרדיאנט של הסופטמקס כמעט אפס (פרק 7), והלמידה נתקעת. זה מה שתרגיל 6.3 מראה.' : '. הגדל את d ל־512 וראה מה קורה לשורות.')); }
  drawA();
};

/* ===================================================== 6.3 */
W.w2_position = function (box) {
  V.say(box, 'למעלה: הבדיקה של הסעיף, בתמונה. חמש מילים, כל אחת בצבע שלה; הפלט של הקשב לכל מילה — עמודת מספרים. <b>ערבב</b> את הסדר: בלי מיקום, הפלט מתערבב בדיוק אותו דבר (אותן עמודות, בסדר אחר). עם מיקום — העמודות עצמן משתנות.');
  let perm = [0, 1, 2, 3, 4], pos = false; const r0 = NN.rng(5), N = 5, d = 6, X = randMat(r0, N, d), Wq = randMat(r0, d, d, 0.5), Wk = randMat(r0, d, d, 0.5), Wv = randMat(r0, d, d, 0.5), P = randMat(r0, N, d, 0.8);
  V.btns(box, [['ערבב', () => { const r = NN.rng(Date.now() % 9973); perm = shuffled(perm, r); draw(); }, 'primary'], ['סדר מקורי', () => { perm = [0, 1, 2, 3, 4]; draw(); }, 'ghost']]); V.tabs(box, ['בלי מיקום', 'עם וקטור מיקום'], k => { pos = k === 1; draw(); });
  const cv = canvas(colm(flex(box), 'קלט (מילים בסדר הנוכחי) → פלט של הקשב, עמודה לכל מקום'), 600, 170, 600); const out = V.say(box);
  const real = el('div'); box.appendChild(real);
  const COLS = ['#4263eb', '#e8590c', '#2f9e44', '#ae3ec9', '#f59f00'];
  function run(order) { const Xp = order.map((o, k) => X[o].map((v, j) => v + (pos ? P[k][j] : 0))); const Q = matMul(Xp, Wq), K = matMul(Xp, Wk), Vv = matMul(Xp, Wv), A = attnRows(Q, K, 1 / Math.sqrt(d)); return matMul(A, Vv); }
  function draw() { const o0 = run([0, 1, 2, 3, 4]), o1 = run(perm), x = cv.getContext('2d'); x.clearRect(0, 0, 600, 170);
    perm.forEach((w, k) => { x.fillStyle = COLS[w]; x.fillRect(20 + k * 46, 20, 38, 22); txt(x, 'מילה ' + w, 39 + k * 46, 35, '#fff', 10, 'center'); txt(x, 'מקום ' + k, 39 + k * 46, 56, '#868e96', 9, 'center'); });
    txt(x, '→', 262, 36, '#495057', 18, 'center');
    const mx = Math.max(...o1.flat().map(Math.abs), ...o0.flat().map(Math.abs));
    o1.forEach((v, k) => { const w = perm[k], same = o0[w].every((t, j) => Math.abs(t - v[j]) < 1e-9); v.forEach((t, j) => { const a = t / mx; x.fillStyle = a > 0 ? 'rgba(66,99,235,' + Math.abs(a) + ')' : 'rgba(232,89,12,' + Math.abs(a) + ')'; x.fillRect(290 + k * 60, 10 + j * 18, 40, 16); }); x.strokeStyle = COLS[w]; x.lineWidth = 2; x.strokeRect(289 + k * 60, 9, 42, d * 18 + 1); txt(x, same ? '= ' + w : '≠ ' + w, 310 + k * 60, 132, same ? '#2b8a3e' : '#c92a2a', 11, 'center'); });
    txt(x, 'מתחת לכל עמודה: האם היא שווה לפלט של אותה מילה בסדר המקורי', 590, 160, '#868e96', 10, 'right');
    const id = perm.every((v, i) => v === i), allSame = o1.every((v, k) => o0[perm[k]].every((t, j) => Math.abs(t - v[j]) < 1e-9));
    out.innerHTML = id ? 'זה הסדר המקורי. לחץ "ערבב".' : allSame ? badge(true, 'אותו פלט, מעורבב') + ' — כל מילה קיבלה בדיוק את אותו פלט כמו קודם, רק במקום אחר. מבחינת הקשב, הקלט הוא <b>קבוצה</b>, לא רצף: הוא לא יודע מה ליד מה. לתמונה זה הרסני — שמיים למעלה ודשא למטה, או ההפך, נראים לו אותו דבר. עבור ל"עם וקטור מיקום".' : badge(false, 'הפלט השתנה') + ' — עכשיו לכל מקום יש וקטור משלו שמתווסף לתוכן, ואותה מילה במקום אחר היא קלט אחר. זה כל מה שנדרש כדי שהרשת תוכל ללמוד גיאומטריה.';
    const D = L6(); if (D && D.pos_sim) real.innerHTML = ''; if (D && D.pos_sim && !real.firstChild) posFigure(real, D); }
  function posFigure(parent, D) { parent.appendChild(el('div', { class: 'note-small', style: { textAlign: 'center', marginTop: '10px' }, html: '<b>ומה הרשת לומדת לבד:</b> וקטורי המיקום של ViT קטן שאומן במחשב שלך (טלאים של 4 על Fashion-MNIST — רשת של 7 על 7). כל ריבוע קטן הוא מקום אחד, ובתוכו — הדמיון (קוסינוס) של הווקטור שלו לווקטורים של כל 49 המקומות. אף אחד לא אמר לה שהטלאים מסודרים ברשת דו־ממדית.' }));
    const c = canvas(colm(flex(parent), 'דמיון וקטורי המיקום שנלמדו: 49 מפות של 7 על 7'), 448, 448, 448); const x = c.getContext('2d'), S = D.pos_sim;
    for (let a = 0; a < 49; a++) { const ox = (a % 7) * 64 + 3, oy = Math.floor(a / 7) * 64 + 3; for (let b = 0; b < 49; b++) { const v = S[a * 49 + b] / 255, t = a === b ? 1 : clamp((v - 0.5) * 2 / 0.45, -1, 1); x.fillStyle = t > 0 ? 'rgb(' + Math.round(255 - 190 * t) + ',' + Math.round(255 - 150 * t) + ',255)' : 'rgb(255,' + Math.round(255 + 120 * t) + ',' + Math.round(255 + 200 * t) + ')'; x.fillRect(ox + (b % 7) * 8.2, oy + Math.floor(b / 7) * 8.2, 8.2, 8.2); } x.strokeStyle = '#495057'; x.lineWidth = 1; x.strokeRect(ox + (a % 7) * 8.2, oy + Math.floor(a / 7) * 8.2, 8.2, 8.2); }
    const by = {}, add = (k, v) => { (by[k] = by[k] || []).push(v); }; for (let a = 0; a < 49; a++) for (let b = 0; b < 49; b++) { if (a === b) continue; const v = S[a * 49 + b] / 255 * 2 - 1, d = Math.max(Math.abs(a % 7 - b % 7), Math.abs(Math.floor(a / 7) - Math.floor(b / 7))); add(d === 1 ? 'n' : d >= 3 ? 'f' : 'm', v); if (a % 7 === b % 7) add('col', v); if (Math.floor(a / 7) === Math.floor(b / 7)) add('row', v); } const avg = k => by[k].reduce((x, y) => x + y, 0) / by[k].length;
    parent.appendChild(el('div', { class: 'say', html: 'בכל מפה, המקום עצמו (מסגרת) הכי כחול — דומה לעצמו. וממוצע על כל המפות: הדמיון לשכן צמוד <b>' + F(avg('n'), 2) + '</b>, למקום במרחק 3 ומעלה <b>' + F(avg('f'), 2) + '</b>; לאותה עמודה ' + F(avg('col'), 2) + ', לאותה שורה ' + F(avg('row'), 2) + '. (הצבעים מוגברים — הדמיונות קטנים, אחרי 5 סבבים בלבד.) כלומר הרשת גילתה מהנתונים את המבנה הדו־ממדי של התמונה, רק מכך שזה עוזר לסווג. זה בדיוק מה שקונבולוציה מקבלת "בחינם", ומשנה צריך ללמוד — ולכן הוא צריך יותר נתונים (סעיף 6.5).' })); }
  draw();
};

/* ===================================================== 6.4 */
function vitSpec(o) { const n = (o.img / o.patch) ** 2, D = o.dim, emb = o.inC * o.patch * o.patch * D + D, blk = 4 * D + (3 * D * D + 3 * D) + (D * D + D) + (D * 4 * D + 4 * D) + (4 * D * D + D);
  return { n, emb, cls: D, pos: (n + 1) * D, blk, blocks: blk * o.depth, norm: 2 * D, head: D * o.cls + o.cls, total: emb + D + (n + 1) * D + blk * o.depth + 2 * D + D * o.cls + o.cls }; }
W.w2_vit_flow = function (box) {
  V.say(box, 'TinyViT של הסעיף, שכבה אחר שכבה: הצורה של הטנזור אחרי כל שורה ב־forward, ומספר הפרמטרים בכל חלק. ברירת המחדל — הערכים של הקורס (תמונה 32, טלאי 4, ממד 192, 6 בלוקים, 3 ראשים). <b>שנה אותם</b>, או בחר מודל מוכן.');
  let o = { img: 32, patch: 4, dim: 192, depth: 6, heads: 3, cls: 10, inC: 3, B: 2 }; const sl = {};
  const sr = row(box); sl.img = V.slider(sr, 'תמונה', 16, 384, 16, o.img, v => { o.img = v; draw(); }); sl.patch = V.slider(sr, 'טלאי', 2, 32, 2, o.patch, v => { o.patch = v; draw(); });
  const sr2 = row(box); sl.dim = V.slider(sr2, 'ממד', 48, 1024, 48, o.dim, v => { o.dim = v; draw(); }); sl.depth = V.slider(sr2, 'בלוקים', 1, 24, 1, o.depth, v => { o.depth = v; draw(); }); sl.heads = V.slider(sr2, 'ראשים', 1, 16, 1, o.heads, v => { o.heads = v; draw(); });
  const preset = (q) => { Object.assign(o, q); ['img', 'patch', 'dim', 'depth', 'heads'].forEach(k => sl[k].set(o[k])); draw(); };
  V.btns(box, [['TinyViT של הקורס', () => preset({ img: 32, patch: 4, dim: 192, depth: 6, heads: 3, cls: 10, inC: 3 }), 'ghost'], ['ViT-B/16', () => preset({ img: 224, patch: 16, dim: 768, depth: 12, heads: 12, cls: 1000, inC: 3 }), 'ghost'], ['ה־ViT שאומן במחשב שלך', () => preset({ img: 28, patch: 4, dim: 64, depth: 4, heads: 4, cls: 10, inC: 1 }), 'ghost']]);
  const code = mono(box); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const bad = o.img % o.patch || o.dim % o.heads; const S = vitSpec(o), g = Math.floor(o.img / o.patch), n = g * g, B = o.B, D = o.dim;
    code.textContent = bad ? (o.img % o.patch ? '# ' + o.img + ' לא מתחלק ב־' + o.patch + ': הטלאים בשוליים נחתכים, ו-pos לא יתאים לגודל.\n' : '') + (o.dim % o.heads ? 'AssertionError: embed_dim must be divisible by num_heads   # ' + o.dim + ' / ' + o.heads + '\n' : '') :
      ['x                                   (' + B + ', ' + o.inC + ', ' + o.img + ', ' + o.img + ')', 'self.embed(x)                       (' + B + ', ' + D + ', ' + g + ', ' + g + ')      # conv k=' + o.patch + ', s=' + o.patch, '.flatten(2)                         (' + B + ', ' + D + ', ' + n + ')', '.transpose(1, 2)                    (' + B + ', ' + n + ', ' + D + ')       # ' + n + ' words of ' + D, 'cat([cls, x]) + self.pos            (' + B + ', ' + (n + 1) + ', ' + D + ')       # + CLS', 'attention matrix in every block     (' + B + ', ' + o.heads + ', ' + (n + 1) + ', ' + (n + 1) + ')   # ' + o.heads + ' heads of ' + (D / o.heads) + ' dims', 'self.blocks(x)                      (' + B + ', ' + (n + 1) + ', ' + D + ')       # ' + o.depth + ' blocks, shape kept', 'x[:, 0]                             (' + B + ', ' + D + ')            # CLS only', 'self.head(self.norm(...))           (' + B + ', ' + o.cls + ')'].join('\n');
    tb.innerHTML = table(['חלק', 'חישוב', 'פרמטרים'], [['שיכון (Conv2d)', ltr(o.inC + '·' + o.patch + '²·' + D + ' + ' + D), fmtN(S.emb)], ['CLS', ltr(String(D)), fmtN(S.cls)], ['מיקום', ltr((n + 1) + '·' + D), fmtN(S.pos)], ['בלוק אחד', ltr('12·' + D + '² + 13·' + D), fmtN(S.blk)], [o.depth + ' בלוקים', '', fmtN(S.blocks)], ['נרמול וראש', ltr('2·' + D + ' + ' + D + '·' + o.cls + ' + ' + o.cls), fmtN(S.norm + S.head)], ['<b>סך הכל</b>', '', '<b>' + fmtN(S.total) + '</b>']]);
    const isCourse = o.img === 32 && o.patch === 4 && D === 192 && o.depth === 6 && o.cls === 10 && o.inC === 3, isB = o.img === 224 && o.patch === 16 && D === 768 && o.depth === 12 && o.cls === 1000;
    out.innerHTML = (bad ? badge(false, 'לא תקין') + ' ' : '') + 'בלוק אחד: ' + ltr('3·D²') + ' לשאילתה, למפתח ולערך, ' + ltr('D²') + ' להטלה שאחרי הקשב, ו־' + ltr('8·D²') + ' בשתי השכבות המלאות (הרחבה פי 4) — <b>שני שלישים מהבלוק ב־MLP</b>, לא בקשב. מספר הראשים לא משנה את מספר הפרמטרים: הוא רק מחלק את הממד. ומספר הטלאים משפיע רק על וקטורי המיקום. ' +
      (isCourse ? 'TinyViT של הקורס: <b>2,693,578</b> פרמטרים — בדיוק מה ש־PyTorch הדפיס במחשב שלך, והפלט ' + ltr('torch.Size([2, 10])') + ' כמו בהערה של הקורס. ' : isB ? 'ViT-B/16: כ־86.6 מיליון (המספר הרשמי של torchvision: 86,567,656). ' : '') + 'הנרמול <b>לפני</b> כל חלק (pre-norm) משאיר את קו הדילוג נקי מקצה לקצה — אותו רעיון כמו ResNet v2 בסעיף 5.3.'; }
  draw();
};

/* real: the CLS attention of the ViT trained on the user's computer */
W.w2_vit_attn_real = function (box) {
  V.say(box, 'ViT קטן (טלאים של 4, ממד 64, 4 בלוקים, 4 ראשים — אותן מחלקות של הסעיף, בגודל שמתאים למעבד) <b>אומן במחשב שלך</b> 5 סבבים על פריטי הלבוש. <b>בחר תמונה, שכבה וראש</b>: החום מראה לאיזה טלאים אסימון ה־CLS מקשיב — זה כל המידע שהראש המסווג מקבל.');
  let k = 0, layer = 3, head = -1; const D0 = L6(); if (D0) V.btns(box, D0.ys.map((y, i) => [FASHION[y], () => { k = i; draw(); }, 'ghost']));
  V.tabs(box, ['שכבה 1', 'שכבה 2', 'שכבה 3', 'שכבה 4'], i => { layer = i; draw(); }, 3); V.tabs(box, ['ממוצע הראשים', 'ראש 1', 'ראש 2', 'ראש 3', 'ראש 4'], i => { head = i - 1; draw(); });
  const fx = flex(box); const cI = pixCanvas(fx, 28, 28, 196, 'התמונה'), cA = canvas(colm(fx, 'הקשב של CLS לטלאים'), 196, 196, 196), cH = canvas(colm(fx, 'ארבעת הראשים בשכבה הזו'), 196, 196, 196), cP = canvas(colm(fx, 'ההסתברויות'), 260, 150, 260);
  const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function cmap(c, img, att, size) { const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.clearRect(0, 0, size, size); const sc = size / 28; for (let i = 0; i < 784; i++) { const v = img[i]; x.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; x.fillRect((i % 28) * sc, Math.floor(i / 28) * sc, sc + 0.5, sc + 0.5); } const mx = Math.max(...att) || 1; for (let p = 0; p < 49; p++) { const t = att[p] / mx; x.fillStyle = 'rgba(232,89,12,' + (0.75 * t) + ')'; x.fillRect((p % 7) * 4 * sc, Math.floor(p / 7) * 4 * sc, 4 * sc, 4 * sc); } }
  function draw() { const D = L6(); if (!D) { out.innerHTML = 'הנתונים מההרצה עוד לא נטענו.'; return; } const img = D.imgs[k], sh = D.cls_shape; /* (layers, images, heads, 49) */
    const get = (l, h) => { const o = ((l * sh[1] + k) * sh[2] + h) * 49; return Array.from(D.cls.slice(o, o + 49)); };
    const att = head < 0 ? get(layer, 0).map((_, p) => [0, 1, 2, 3].reduce((a, h) => a + get(layer, h)[p], 0) / 4) : get(layer, head);
    heat(cI, Array.from(img), 28, 28); cmap(cA, img, att, 196);
    const x = cH.getContext('2d'); x.clearRect(0, 0, 196, 196); for (let h = 0; h < 4; h++) { const tmp = document.createElement('canvas'); tmp.width = tmp.height = 96; cmap(tmp, img, get(layer, h), 96); x.drawImage(tmp, (h % 2) * 99, Math.floor(h / 2) * 99); }
    const pr = D.probs[k], p = cP.getContext('2d'); p.clearRect(0, 0, 260, 150); pr.forEach((v, c) => { p.fillStyle = c === D.ys[k] ? '#2f9e44' : '#adb5bd'; p.fillRect(70, 4 + c * 14, v * 160, 11); txt(p, FASHION[c], 64, 13 + c * 14, '#495057', 10, 'right'); txt(p, (v * 100).toFixed(1) + '%', 256, 13 + c * 14, '#495057', 9, 'right'); });
    const H = D.hist; tb.innerHTML = table(['סבב', 'הפסד אימון', 'דיוק וולידציה', 'זמן'], H.map((h, i) => [i, F(h[0], 3), (h[1] * 100).toFixed(1) + '%', F(h[2], 0) + ' שנ׳']));
    const self = D.cls_self[layer][k], win = pr.indexOf(Math.max(...pr));
    out.innerHTML = 'הרשת: <b>' + FASHION[win] + '</b> (' + (pr[win] * 100).toFixed(1) + '%). ' + (win !== D.ys[k] ? badge(false, 'טעות') + '. ' : '') + 'בשכבה ' + (layer + 1) + ' אסימון ה־CLS שם ' + ((head < 0 ? self.reduce((a, b) => a + b, 0) / 4 : self[head]) * 100).toFixed(0) + '% מהקשב על עצמו, והשאר על הטלאים. ' +
      'שים לב להבדל בין הראשים: כל ראש מסתכל על משהו אחר — אחד על קצוות הבגד, אחד על הרקע, אחד על אזור מסוים. ובשכבה הראשונה הקשב לרוב מפוזר; בעמוקות הוא מתרכז. ' + D.params.toLocaleString('en-US') + ' פרמטרים; ' + (H[H.length - 1][1] * 100).toFixed(1) + '% אחרי ' + H.length + ' סבבים — מול SmallCNN בסעיף 6.5.'; }
  draw();
};

/* ===================================================== 6.5 */
W.w2_attn_cost = function (box) {
  V.say(box, 'כמה עולה ViT-B/16 (ממד 768, 12 בלוקים, 12 ראשים) כשהתמונה גדלה? <b>הזז את הרזולוציה.</b> כל בלוק עושה שני סוגי עבודה: חלקים ש<b>לינאריים</b> במספר המילים (Q, K, V, ההטלה וה־MLP: ' + ltr('12·N·D²') + ') — ומטריצת הקשב, ש<b>ריבועית</b> ' + ltr('(2·N²·D)') + '.');
  let res = 224, patch = 16; const sr = row(box); V.slider(sr, 'רזולוציה (פיקסלים בכל ציר)', 64, 2048, 32, res, v => { res = v; draw(); }); V.tabs(box, ['טלאי 8', 'טלאי 16', 'טלאי 32'], i => { patch = [8, 16, 32][i]; draw(); }, 1);
  const cv = canvas(colm(flex(box), 'מיליארדי כפל־וחיבור לתמונה, לפי רזולוציה (סקאלה לוגריתמית)'), 600, 240, 600); legend(box, [['#7048e8', 'ViT: החלקים הלינאריים'], ['#e8590c', 'ViT: מטריצות הקשב'], ['#2f9e44', 'ResNet-50, לשם השוואה']]);
  const tb = el('div'); box.appendChild(tb); const out = V.say(box); const real = el('div'); box.appendChild(real);
  const Dm = 768, L = 12, Hh = 12; const cost = (r) => { const N = Math.floor(r / patch) ** 2 + 1; return { N, lin: L * 12 * N * Dm * Dm / 1e9, att: L * 2 * N * N * Dm / 1e9, rn: 4.089 * (r / 224) ** 2, mem: L * Hh * N * N * 4 / 2 ** 20 }; };
  function draw() { const rs = []; for (let r = 64; r <= 2048; r += 32) rs.push(r); const C = rs.map(cost);
    const pl = logPlot(cv, [{ y: C.map(c => c.lin), color: '#7048e8' }, { y: C.map(c => c.att), color: '#e8590c' }, { y: C.map(c => c.rn), color: '#2f9e44', dash: [5, 3] }], -2, 5, { xl: ['64', '2048'] });
    const xx = cv.getContext('2d'), i0 = rs.indexOf(res); xx.strokeStyle = '#adb5bd'; xx.setLineDash([3, 3]); xx.beginPath(); xx.moveTo(pl.X(i0), 10); xx.lineTo(pl.X(i0), 218); xx.stroke(); xx.setLineDash([]);
    const c = cost(res), c0 = cost(224); const cross = 6 * Dm;
    tb.innerHTML = table(['רזולוציה', 'מילים N', 'זוגות בקשב', 'לינארי (מיליארד)', 'קשב (מיליארד)', 'זיכרון למטריצות הקשב (float32, כל השכבות)'], [[res + '×' + res, fmtN(c.N), fmtN(c.N * c.N), F(c.lin, 1), F(c.att, 1), c.mem > 1024 ? F(c.mem / 1024, 1) + ' GB' : F(c.mem, 0) + ' MB']]);
    out.innerHTML = 'ב־224: ' + fmtN(c0.N) + ' מילים, והקשב רק ' + (c0.att / (c0.att + c0.lin) * 100).toFixed(0) + '% מהחישוב. ' + (res !== 224 ? 'ב־' + res + ': פי ' + F(c.N * c.N / (c0.N * c0.N), 0) + ' זוגות, והקשב <b>' + (c.att / (c.att + c.lin) * 100).toFixed(0) + '%</b> מהחישוב. ' : 'הזז את הרזולוציה. ') + 'הסגול גדל כמו מספר המילים — ריבוע הרזולוציה; הכתום כמו ריבוע מספר המילים — רזולוציה בחזקת 4. הכתום עוקף את הסגול כש־' + ltr('2N²D > 12ND') + ', כלומר ' + ltr('N > 6D = ' + fmtN(cross)) + ' מילים — בטלאי ' + patch + ', ברזולוציה של ' + Math.round(Math.sqrt(cross) * patch) + '. ' +
      'ובזיכרון — מטריצות הקשב של כל השכבות לבדן' + (c.mem > 2048 ? ' כבר <b>' + F(c.mem / 1024, 1) + ' GB</b> לתמונה אחת באימון' : ': ' + F(c.mem, 0) + ' MB לתמונה') + '. לכן בצילומי רחפן מקטינים, חותכים לאריחים, או משתמשים במודל שבו הקשב מקומי או מגיע רק בשלבים המאוחרים (RT-DETR, מודול 4). רשת קונבולוציה (ירוק) גדלה כמו מספר הפיקסלים — בשיפוע של הסגול, לא של הכתום.';
    const D = L6(), Cc = window.M2LAB6C; if (D && Cc && !real.firstChild) { const v = D.hist, v10 = D.hist10, c1 = Cc.full, c10 = Cc.p10, last = h => (h[h.length - 1][1] * 100).toFixed(1) + '%';
      real.innerHTML = '<div class="note-small" style="text-align:center;margin-top:10px"><b>תרגיל 6.4, במחשב שלך</b> (על פריטי הלבוש במקום CIFAR-10, ועם ViT קטן שמתאים למעבד): 5 סבבים, על כל נתוני האימון ועל 10% מהם.</div>' +
        table(['', 'כל הנתונים (54,000)', '10% (5,400)', 'כמה איבד'], [['SmallCNN (סעיף 4.6)', last(c1), last(c10), ((c1[c1.length - 1][1] - c10[c10.length - 1][1]) * 100).toFixed(1) + ' נק׳'], ['ViT קטן', last(v), last(v10), ((v[v.length - 1][1] - v10[v10.length - 1][1]) * 100).toFixed(1) + ' נק׳']]) +
        '<div class="say">' + ((v[v.length - 1][1] - v10[v10.length - 1][1]) > (c1[c1.length - 1][1] - c10[c10.length - 1][1]) ? 'עם פחות נתונים, ה־ViT מאבד יותר — ' : 'הפער כאן קטן מהצפוי — ') + 'זו שאלת הראיון של הסעיף במספרים: לרשת הקונבולוציה יש הנחות מובנות (מקומיות, שיתוף משקלות) שמחליפות נתונים; המשנה צריך ללמוד אותן — כמו שראית בווקטורי המיקום בסעיף 6.3.</div>'; } }
  draw();
};

/* ===================================================== chapter 7 */
const L7 = () => window.M2LAB7 || null;          /* real runs on the user's computer (content/m2_lab7data.js) */
/* fit y = a·x + b by minimizing a loss, with gradient descent (MSE also in closed form) */
function fitLine(P, kind, delta) { let a = 0, b = 0; const n = P.length; const g = e => kind === 'mse' ? 2 * e : kind === 'l1' ? Math.sign(e) : Math.abs(e) <= delta ? e : delta * Math.sign(e);
  if (kind === 'mse') { const mx = P.reduce((s, p) => s + p[0], 0) / n, my = P.reduce((s, p) => s + p[1], 0) / n; let sxy = 0, sxx = 0; P.forEach(p => { sxy += (p[0] - mx) * (p[1] - my); sxx += (p[0] - mx) ** 2; }); a = sxy / sxx; return [a, my - a * mx]; }
  for (let it = 0; it < 4000; it++) { let ga = 0, gb = 0; const lr = 0.05 * (1 - it / 4400); P.forEach(p => { const e = a * p[0] + b - p[1], d = g(e); ga += d * p[0]; gb += d; }); a -= lr * ga / n; b -= lr * gb / n; } return [a, b]; }

W.w2_loss_pick = function (box) {
  const tabs = el('div'); box.appendChild(tabs); const A1 = el('div'), A2 = el('div'); box.appendChild(A1); box.appendChild(A2); A2.style.display = 'none';
  V.tabs(tabs, ['נקודה חריגה', 'צורת ההפסד'], k => { A1.style.display = k ? 'none' : ''; A2.style.display = k ? '' : 'none'; k ? drawB() : drawA(); });
  V.say(A1, 'ניבוי מספר (כמו מרחק לעצם). 20 נקודות על קו, ואחת — <b>חריגה</b> (תווית שגויה, למשל). <b>גרור את הנקודה האדומה.</b> שלושה קווים, כל אחד ממזער הפסד אחר: MSE, L1, ו־SmoothL1 (הובר).');
  const r = NN.rng(4), pts = [...Array(20)].map((_, i) => { const x = i / 19 * 8 + 1; return [x, 0.6 * x + 1 + NN.randn(r) * 0.35]; }); let out0 = [8, 1.2], drag = false;
  const cv = canvas(colm(flex(A1), 'גרור את הנקודה האדומה'), 520, 300, 520); legend(A1, [['#e8590c', 'MSE'], ['#4263eb', 'L1'], ['#2f9e44', 'SmoothL1 (δ = 1)']]); const outA = V.say(A1);
  const toPx = (x, y) => [30 + x / 10 * 480, 280 - y / 10 * 270], fromPx = (X, Y) => [clamp((X - 30) / 480 * 10, 0, 10), clamp((280 - Y) / 270 * 10, 0, 10)];
  const pos = e => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) / b.width * 520, (e.clientY - b.top) / b.height * 300]; };
  cv.addEventListener('mousedown', e => { const [X, Y] = pos(e), [px, py] = toPx(...out0); if (Math.hypot(X - px, Y - py) < 20) drag = true; });
  window.addEventListener('mouseup', () => drag = false); cv.addEventListener('mousemove', e => { if (!drag) return; out0 = fromPx(...pos(e)); drawA(); });
  function drawA() { const x = cv.getContext('2d'); x.clearRect(0, 0, 520, 300); const P = pts.concat([out0]); const fits = { mse: fitLine(P, 'mse'), l1: fitLine(P, 'l1'), hub: fitLine(P, 'hub', 1) }, truth = fitLine(pts, 'mse');
    x.strokeStyle = '#f1f3f5'; for (let i = 0; i <= 10; i += 2) { const [a] = toPx(i, 0), [, b] = toPx(0, i); x.beginPath(); x.moveTo(a, 10); x.lineTo(a, 280); x.moveTo(30, b); x.lineTo(510, b); x.stroke(); }
    [['mse', '#e8590c'], ['l1', '#4263eb'], ['hub', '#2f9e44']].forEach(([k, c]) => { const [a, b] = fits[k], p0 = toPx(0, b), p1 = toPx(10, a * 10 + b); x.strokeStyle = c; x.lineWidth = 2; x.beginPath(); x.moveTo(...p0); x.lineTo(...p1); x.stroke(); x.lineWidth = 1; });
    pts.forEach(p => { const [X, Y] = toPx(...p); x.fillStyle = '#495057'; x.beginPath(); x.arc(X, Y, 3.5, 0, 7); x.fill(); }); const [X, Y] = toPx(...out0); x.fillStyle = '#e03131'; x.beginPath(); x.arc(X, Y, 7, 0, 7); x.fill();
    const tilt = k => Math.abs(fits[k][0] - truth[0]); const dist = Math.abs(out0[1] - (truth[0] * out0[0] + truth[1]));
    outA.innerHTML = 'הנקודה החריגה רחוקה ' + F(dist, 1) + ' מהקו של שאר הנקודות. השיפוע זז ממנה: MSE ב־<b>' + F(tilt('mse'), 3) + '</b>, L1 ב־' + F(tilt('l1'), 3) + ', SmoothL1 ב־' + F(tilt('hub'), 3) + '. ' +
      'למה: הגרדיאנט של MSE לנקודה הוא <b>פרופורציוני לשגיאה</b> — נקודה רחוקה פי 10 מושכת פי 10. ב־L1 כל נקודה מושכת באותו כוח (±1), לא משנה כמה רחוקה; ו־SmoothL1 מתנהגת כמו MSE לשגיאות קטנות (חלקה ליד האפס) וכמו L1 לגדולות. לכן במזהים, ניבוי הקופסה משתמש ב־SmoothL1 או L1 — תוויות של קופסאות רועשות.'; }
  V.say(A2, 'צורת ההפסד קובעת את הגרדיאנט. משמאל — רגרסיה, לפי גודל השגיאה. מימין — סיווג: ההפסד כשההסתברות למחלקה הנכונה היא p, ומה קורה אם מפעילים סופטמקס פעמיים (המלכודת של תרגיל 2.2).');
  const fb = flex(A2); const c1 = canvas(colm(fb, 'הפסד מול שגיאה'), 300, 220, 300), c2 = canvas(colm(fb, 'אנטרופיה צולבת מול p'), 300, 220, 300); const outB = V.say(A2);
  function drawB() { const e = [...Array(121)].map((_, i) => -3 + i * 0.05); lplot(c1, [{ y: e.map(v => v * v), color: '#e8590c' }, { y: e.map(v => Math.abs(v)), color: '#4263eb' }, { y: e.map(v => Math.abs(v) < 1 ? 0.5 * v * v : Math.abs(v) - 0.5), color: '#2f9e44' }], [0, 9]);
    const ps = [...Array(99)].map((_, i) => (i + 1) / 100); lplot(c2, [{ y: ps.map(p => -Math.log(p)), color: '#212529' }, { y: ps.map(p => { const s = [Math.log(p), Math.log((1 - p) / 9)], q = Math.exp(s[0]) / (Math.exp(s[0]) + 9 * Math.exp(s[1])); return -Math.log(q); }), color: '#c92a2a', dash: [4, 3] }], [0, 5]);
    outB.innerHTML = 'משמאל: MSE (כתום) גדל בריבוע — שגיאה של 3 עולה 9. L1 (כחול) לינארי. SmoothL1 (ירוק): פרבולה עד 1, ואז קו. מימין: אנטרופיה צולבת (שחור) — ' + ltr('−ln p') + ', אינסופית כש־p → 0, ולכן מענישה מאוד טעות בטוחה. הקו האדום המקווקו: מה שמתקבל כשמעבירים לה הסתברויות במקום ציונים (סופטמקס פעמיים, עשר מחלקות): ההפסד כמעט לא זז בין p = 0.1 ל־p = 0.99 — כמעט אין גרדיאנט, והרשת לא לומדת. לכן ' + ltr('nn.CrossEntropyLoss') + ' ו־' + ltr('nn.BCEWithLogitsLoss') + ' מקבלות ציונים גולמיים.'; }
  drawA();
};

/* ===================================================== 7.2 */
let IMB_ = null; const imbData = () => IMB_ || (IMB_ = window.M2IMB || (() => { const r = NN.rng(21), X = [], y = []; for (let i = 0; i < 1900; i++) { X.push([NN.randn(r), NN.randn(r)]); y.push(0); } for (let i = 0; i < 100; i++) { X.push([1.5 + NN.randn(r), 1.5 + NN.randn(r)]); y.push(1); } return { X, y }; })());
function logreg(wpos) { let w0 = 0, w1 = 0, b = 0; const { X, y } = imbData(), n = X.length; let S = 0; for (let i = 0; i < n; i++) S += y[i] ? wpos : 1;
  for (let it = 0; it < 2000; it++) { let g0 = 0, g1 = 0, gb = 0; for (let i = 0; i < n; i++) { const p = 1 / (1 + Math.exp(-(X[i][0] * w0 + X[i][1] * w1 + b))), g = (p - y[i]) * (y[i] ? wpos : 1) / S; g0 += X[i][0] * g; g1 += X[i][1] * g; gb += g; } w0 -= 0.5 * g0; w1 -= 0.5 * g1; b -= 0.5 * gb; } return [w0, w1, b]; }
function report(m, thr) { const { X, y } = imbData(); let tp = 0, fp = 0, fn = 0, tn = 0; const t = Math.log(thr / (1 - thr)); X.forEach((p, i) => { const s = p[0] * m[0] + p[1] * m[1] + m[2] > t; if (s && y[i]) tp++; else if (s) fp++; else if (y[i]) fn++; else tn++; }); return { tp, fp, fn, tn, acc: (tp + tn) / X.length, rec: tp / (tp + fn), prec: tp + fp ? tp / (tp + fp) : NaN }; }

W.w2_imbalance = function (box) {
  V.say(box, 'הקוד של הסעיף, כאן בדפדפן: 1,900 נקודות רקע (אפור) ו־100 מטרות (כתום). <b>הזז את משקל המטרות</b> (1 — הפסד רגיל; 19 — משקל הפוך לשכיחות) ואת <b>סף ההחלטה</b> (תרגיל 7.2). הקו: מה שהמודל מסמן כמטרה (מימין־למעלה ממנו).');
  let wpos = 1, thr = 0.5, model = logreg(1); const cache = {}; const get = w => cache[w] || (cache[w] = logreg(w));
  const sr = row(box); V.slider(sr, 'משקל למטרות', 1, 30, 1, wpos, v => { wpos = v; model = get(v); draw(); }); V.slider(sr, 'סף', 0.02, 0.98, 0.01, thr, v => { thr = v; draw(); }, v => F(v, 2));
  const fx = flex(box); const cS = canvas(colm(fx, 'הנתונים וקו ההחלטה'), 300, 300, 300), cP = canvas(colm(fx, 'רגישות מול דיוק ניבוי, לכל סף (המשקל הנוכחי)'), 300, 300, 300); const tb = el('div'); box.appendChild(tb); const out = V.say(box); const real = el('div'); box.appendChild(real);
  function draw() { const R = report(model, thr), x = cS.getContext('2d'); x.clearRect(0, 0, 300, 300); const T = (a, b) => [150 + a * 42, 170 - b * 42];
    imbData().X.forEach((p, i) => { if (imbData().y[i]) return; const [X, Y] = T(...p); x.fillStyle = 'rgba(134,142,150,.35)'; x.fillRect(X - 1, Y - 1, 2.5, 2.5); }); imbData().X.forEach((p, i) => { if (!imbData().y[i]) return; const [X, Y] = T(...p); x.fillStyle = '#e8590c'; x.beginPath(); x.arc(X, Y, 2.6, 0, 7); x.fill(); });
    const t = Math.log(thr / (1 - thr)), [w0, w1, b] = model; const ya = (t - b - w0 * -3.6) / w1, yb = (t - b - w0 * 3.6) / w1; x.strokeStyle = '#4263eb'; x.lineWidth = 2; x.beginPath(); x.moveTo(...T(-3.6, ya)); x.lineTo(...T(3.6, yb)); x.stroke(); x.lineWidth = 1;
    const p = cP.getContext('2d'); p.clearRect(0, 0, 300, 300); p.strokeStyle = '#ced4da'; p.strokeRect(30, 10, 260, 260); txt(p, 'רגישות →', 290, 290, '#868e96', 10, 'right'); txt(p, 'דיוק ניבוי', 4, 20, '#868e96', 10);
    p.strokeStyle = '#4263eb'; p.lineWidth = 2; p.beginPath(); let first = true; for (let k = 1; k < 99; k++) { const q = report(model, k / 100); if (!isFinite(q.prec)) continue; const X = 30 + q.rec * 260, Y = 270 - q.prec * 260; first ? p.moveTo(X, Y) : p.lineTo(X, Y); first = false; } p.stroke(); p.lineWidth = 1;
    if (isFinite(R.prec)) { p.fillStyle = '#e8590c'; p.beginPath(); p.arc(30 + R.rec * 260, 270 - R.prec * 260, 6, 0, 7); p.fill(); }
    tb.innerHTML = table(['', 'סומן כמטרה', 'סומן כרקע'], [['מטרה אמיתית (100)', '<b>' + R.tp + '</b>', R.fn], ['רקע אמיתי (1,900)', R.fp, R.tn]]) + table(['דיוק', 'רגישות', 'דיוק ניבוי'], [[(R.acc * 100).toFixed(1) + '%', '<b>' + (R.rec * 100).toFixed(0) + '%</b>', isFinite(R.prec) ? '<b>' + (R.prec * 100).toFixed(0) + '%</b>' : '—']]);
    out.innerHTML = 'מצאנו ' + R.tp + ' מתוך 100 מטרות, ועל כל סימון נכון יש ' + (R.tp ? F(R.fp / R.tp, 1) : '—') + ' התראות שווא. ' + (R.acc > 0.95 && R.rec < 0.6 ? 'הדיוק נראה מצוין — אבל ' + R.fn + ' מהמטרות חסרות. ' : '') +
      'שים לב: הזזת המשקל והזזת הסף מזיזות את אותה נקודה על אותה עקומה בערך — שתיהן מזיזות את הקו. בלי משקל ועם סף 0.1 מקבלים כמעט את מה שמקבלים עם משקל 5 וסף 0.5 (תרגילים 7.1 ו־7.2). היתרון של הסף: מאמנים פעם אחת, ובוחרים נקודת עבודה אחר כך. ' + (wpos === 1 && Math.abs(thr - 0.5) < 1e-9 ? 'אלה בדיוק המספרים של הקורס (97%, 49%, 83%): הנקודות כאן הן אותן נקודות שהקוד של הסעיף מייצר.' : '');
    const D = L7(); if (D && D.imb && !real.firstChild) { const I = D.imb, rows = [['plain', 'הפסד רגיל'], ['weighted', 'הפסד משוקלל (' + ltr('weight=') + ')'], ['sampler', ltr('WeightedRandomSampler')], ['focal', 'הפסד מומקד, γ = 2'], ['smooth', 'החלקת תוויות 0.1']];
      real.innerHTML = '<div class="note-small" style="text-align:center;margin-top:10px"><b>ועל רשת אמיתית, במחשב שלך:</b> הרשת המלאה של סעיף 3.6 על פריטי הלבוש, כשמהמחלקה "חולצה" נשארו רק ' + I.counts[6] + ' דוגמאות אימון (2%), מול כ־5,400 מכל מחלקה אחרת. 5 סבבים. הוולידציה מאוזנת.</div>' +
        table(['שיטה', 'דיוק כללי', 'רגישות ל"חולצה"', 'דיוק ניבוי ל"חולצה"', 'לאן הלכו החולצות'], rows.map(([k, t]) => { const q = I[k], c = q.conf, tot = c.reduce((a, b) => a + b, 0), top = c.map((v, j) => [v, j]).filter(z => z[1] !== 6).sort((a, b) => b[0] - a[0]).slice(0, 2); return [t, (q.acc * 100).toFixed(1) + '%', '<b>' + (q.recall * 100).toFixed(0) + '%</b>', (q.precision * 100).toFixed(0) + '%', top.map(z => FASHION[z[1]] + ' ' + (z[0] / tot * 100).toFixed(0) + '%').join(', ')]; })) +
        '<div class="say">הדיוק הכללי כמעט זהה בכל השיטות — והוא מסתיר את מה שקורה לחולצות. בהפסד רגיל הרשת "שכחה" שיש מחלקה כזו: היא לא מסמנת חולצה אף פעם, והחולצות הולכות לחולצות טי, סוודרים ומעילים. ההפסד המשוקלל מחזיר הכי הרבה חולצות, במחיר של הרבה התראות שווא; הדגימה המאוזנת — פחות, אבל רוב הסימונים שלה נכונים. שתי נקודות שונות על אותה עקומה, כמו בשני העננים למעלה. ושימו לב: הפסד מומקד והחלקת תוויות <b>לא עזרו בכלל</b> — הם מטפלים בדוגמאות קלות ובביטחון מופרז, לא במחלקה נדירה (סעיף 7.3).</div>'; } }
  draw();
};

/* ===================================================== 7.3 */
W.w2_focal = function (box) {
  V.say(box, 'משמאל: אנטרופיה צולבת (שחור) והפסד מומקד ' + ltr('(1 − p)^γ · CE') + ' (כתום), לפי ההסתברות למחלקה הנכונה. <b>הזז את γ.</b> מימין: מנה של <b>1,000 דוגמאות קלות</b> (p = 0.95) ו־<b>10 קשות</b> (p = 0.1) — כמו מזהה, שבו רוב המקומות בתמונה הם רקע קל. איזה חלק מההפסד מגיע מהקשות?');
  let g = 2, eps = 0.1; const sr = row(box); V.slider(sr, 'γ', 0, 5, 0.1, g, v => { g = v; draw(); }, v => F(v, 1));
  const fx = flex(box); const c1 = canvas(colm(fx, 'ההפסד לפי p'), 320, 220, 320), c2 = canvas(colm(fx, 'חלוקת ההפסד הכולל במנה'), 280, 220, 280); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  box.appendChild(el('div', { class: 'note-small', style: { textAlign: 'center', marginTop: '10px' }, html: '<b>החלקת תוויות</b> — עשר מחלקות. הזז את ε:' })); const sr2 = row(box); V.slider(sr2, 'ε', 0, 0.5, 0.01, eps, v => { eps = v; drawS(); }, v => F(v, 2)); const c3 = canvas(colm(flex(box), 'היעד לכל מחלקה'), 420, 130, 420); const out2 = V.say(box);
  function draw() { const ps = [...Array(99)].map((_, i) => (i + 1) / 100); lplot(c1, [{ y: ps.map(p => -Math.log(p)), color: '#212529' }, { y: ps.map(p => -Math.pow(1 - p, g) * Math.log(p)), color: '#e8590c' }], [0, 4]);
    const ce = p => -Math.log(p), fo = p => Math.pow(1 - p, g) * ce(p); const eC = 1000 * ce(0.95), hC = 10 * ce(0.1), eF = 1000 * fo(0.95), hF = 10 * fo(0.1);
    const x = c2.getContext('2d'); x.clearRect(0, 0, 280, 220); [[eC, hC, 'אנטרופיה צולבת', 30], [eF, hF, 'מומקד, γ = ' + F(g, 1), 160]].forEach(([e, h, t, X]) => { const s = e + h, he = h / s * 170; x.fillStyle = '#ced4da'; x.fillRect(X, 20, 80, 170 - he); x.fillStyle = '#e8590c'; x.fillRect(X, 190 - he, 80, he); txt(x, (h / s * 100).toFixed(0) + '% קשות', X + 40, 185 - Math.max(he, 14) + 14, he > 20 ? '#fff' : '#212529', 11, 'center'); txt(x, t, X + 40, 208, '#495057', 10, 'center'); });
    tb.innerHTML = table(['p (המחלקה הנכונה)', 'אנטרופיה צולבת', 'מומקד, γ = ' + F(g, 1), 'יחס'], [0.95, 0.6, 0.1].map(p => [String(p), F(ce(p), 3), F(fo(p), 4), (fo(p) / ce(p) * 100).toFixed(2) + '%']));
    out.innerHTML = 'עם אנטרופיה צולבת רגילה, 1,000 הדוגמאות הקלות תורמות ' + F(eC, 0) + ' להפסד, ו־10 הקשות ' + F(hC, 0) + ' — <b>' + (hC / (eC + hC) * 100).toFixed(0) + '%</b> בלבד מהגרדיאנט מגיע ממה שבאמת צריך ללמוד. ' + (g > 0 ? 'עם γ = ' + F(g, 1) + ': <b>' + (hF / (eF + hF) * 100).toFixed(0) + '%</b>. הגורם ' + ltr('(1 − p)^γ') + ' מוחק את הקלות (' + ltr('0.05^' + F(g, 1) + ' = ' + E(Math.pow(0.05, g), 1)) + ') ומשאיר את הקשות כמעט כמו שהן. γ = 2 הוא הערך מהמאמר של RetinaNet (2017), שבו הוצג ההפסד.' : 'עם γ = 0 ההפסד המומקד הוא בדיוק האנטרופיה הצולבת — הבדיקה של תרגיל 7.3.'); }
  function drawS() { const K = 10, tgt = [...Array(K)].map((_, c) => c === 3 ? 1 - eps + eps / K : eps / K), x = c3.getContext('2d'); x.clearRect(0, 0, 420, 130); tgt.forEach((v, c) => { x.fillStyle = c === 3 ? '#2f9e44' : '#adb5bd'; x.fillRect(10 + c * 40, 100 - v * 90, 30, v * 90); txt(x, v.toFixed(3), 25 + c * 40, 96 - v * 90, '#495057', 9, 'center'); txt(x, String(c), 25 + c * 40, 118, '#868e96', 10, 'center'); });
    const gap = eps > 0 ? Math.log((1 - eps + eps / K) / (eps / K)) : Infinity;
    out2.innerHTML = 'עם ε = ' + F(eps, 2) + ': יעד ' + F(1 - eps + eps / K, 3) + ' למחלקה הנכונה ו־' + F(eps / K, 3) + ' לכל אחת מהאחרות' + (Math.abs(eps - 0.1) < 1e-9 ? ' (0.91 ו־0.01, כמו בסעיף)' : '') + '. ' + (eps > 0 ? 'ההפסד מגיע למינימום כשהציון של המחלקה הנכונה גבוה מהאחרים ב־<b>' + F(gap, 2) + '</b> — לא באינסוף. בלי החלקה, הרשת תדחוף את הציונים לגדול בלי סוף כדי להתקרב ל־100%, ותהיה בטוחה מדי גם כשהיא טועה.' : 'בלי החלקה, המינימום הוא בהפרש אינסופי בין הציונים: הרשת נדחפת להיות בטוחה במאה אחוז, תמיד.'); }
  draw(); drawS();
};

/* ===================================================== 7.4 */
function lrAt(kind, step, total, warm, base) { if (kind === 'const') return base; if (kind === 'step') return base * Math.pow(0.1, Math.floor(step / (total / 3)));
  if (step < warm) return base * (step + 1) / warm; const pr = (step - warm) / Math.max(1, total - warm); return base * 0.5 * (1 + Math.cos(Math.PI * pr)); }
W.w2_lr_schedule = function (box) {
  V.say(box, 'התזמון של הסעיף (' + ltr('lr_at') + ') ושניים נוספים. <b>הזז את מספר הסבבים והחימום.</b> ומתחת — אותה רשת מפרק 1 על הספירלות, מאומנת עם כל אחד מהתזמונים, באותו קצב מקסימלי.');
  let total = 50, warm = 5, base = 1e-3, bug = false; const sr = row(box); V.slider(sr, 'סבבים', 10, 100, 1, total, v => { total = v; warm = Math.min(warm, total - 1); draw(); }); V.slider(sr, 'חימום', 0, 20, 1, warm, v => { warm = v; draw(); });
  const cb = el('label', { class: 'note-small', html: '<input type="checkbox"> הבאג: ' + ltr('scheduler.step()') + ' בתוך לולאת המנות (38 מנות בסבב)' }); box.appendChild(cb); cb.querySelector('input').onchange = e => { bug = e.target.checked; draw(); };
  const cv = canvas(colm(flex(box), 'קצב הלמידה בכל סבב'), 600, 200, 600); legend(box, [['#4263eb', 'חימום וקוסינוס'], ['#868e96', 'קבוע', true], ['#ae3ec9', 'מדרגות (פי 10 פחות כל שליש)']]); const code = mono(box);
  V.btns(box, [['▶ אמן את הספירלות עם שלושתם', () => trainAll(), 'primary']]); const cT = canvas(colm(flex(box), 'הפסד האימון (ספירלות, 1,500 צעדים, קצב מקסימלי 1)'), 600, 200, 600); const out = V.say(box);
  function draw() { const L = k => [...Array(total)].map((_, s) => bug ? lrAt('cos', s * 38, total, warm, base) : lrAt(k, s, total, warm, base));
    lplot(cv, [{ y: L('const'), color: '#868e96', dash: [4, 3] }, { y: L('step'), color: '#ae3ec9' }, { y: L('cos'), color: '#4263eb', lw: 2.5 }], [0, 0.0011]);
    code.textContent = [0, warm - 1, warm, Math.floor((total + warm) / 2), total - 1].filter((v, i, a) => v >= 0 && a.indexOf(v) === i).map(s => s + ' ' + lrAt('cos', s, total, warm, base).toExponential(2)).join('\n') + (total === 50 && warm === 5 ? '\n# the course: 0 2.00e-04 | 4 1.00e-03 | 5 1.00e-03 | 27 5.17e-04 | 49 1.22e-06' : '');
    out.innerHTML = bug ? badge(false, 'הבאג') + ': כש־' + ltr('scheduler.step()') + ' נקרא אחרי כל מנה, החימום והקוסינוס "נגמרים" כבר בסבב ' + Math.ceil(total / 38) + ' — ומשם ' + ltr('CosineAnnealingLR') + ' ממשיך את גל הקוסינוס הלאה: הקצב קופץ למעלה ולמטה בלי שום היגיון, לפי המקום שבו כל סבב נופל על הגל. קריאה אחת בסבב, אחרי האימון.' : 'סבב 0: ' + ltr(lrAt('cos', 0, total, warm, base).toExponential(2)) + ' — ' + (warm ? ltr('1/' + warm) + ' מהמקסימום' : 'המקסימום מיד') + '. באמצע הירידה — בערך חצי. בסוף — כמעט אפס. ' + (total === 50 && warm === 5 ? 'אותם מספרים כמו בקורס.' : ''); }
  function trainAll() { const res = {}, steps = 1500; ['const', 'step', 'cos'].forEach(k => { const p = mlp(64, { seed: 2 }), h = []; for (let s = 0; s < steps; s++) { const lr = lrAt(k, s, steps, 100, 1.0), r = lossGrad(p, 'relu'); stepP(p, r.g, lr); if (s % 15 === 0) h.push(r.loss); } res[k] = { h, acc: lossGrad(p, 'relu').acc, loss: lossOnly(p, 'relu') }; });
    lplot(cT, [{ y: res.const.h, color: '#868e96', dash: [4, 3] }, { y: res.step.h, color: '#ae3ec9' }, { y: res.cos.h, color: '#4263eb', lw: 2.5 }], [0, 1.2]);
    out.innerHTML = 'אחרי 1,500 צעדים: קבוע — הפסד <b>' + F(res.const.loss, 3) + '</b>; מדרגות — <b>' + F(res.step.loss, 3) + '</b>; חימום וקוסינוס — <b>' + F(res.cos.loss, 3) + '</b>. בקצב קבוע וגבוה ההפסד רועד סביב המינימום ולא נכנס אליו (מודול 0, פרק 8); כשהקצב יורד בסוף, הצעדים קטנים והוא מתייצב נמוך יותר. החימום מגן על ההתחלה, כשהמשקלות אקראיים והגרדיאנטים גדולים.'; }
  draw();
};

/* real: the LR range test and the schedules on Fashion-MNIST */
W.w2_lr_real = function (box) {
  V.say(box, 'שני ניסויים שרצו <b>במחשב שלך</b>. למעלה: בדיקת טווח קצב הלמידה של תרגיל 7.4 על SmallCNN — 200 מנות, הקצב מוכפל בכל מנה מ־' + ltr('1e−7') + '. למטה: הרשת המלאה של סעיף 3.6, 10 סבבים, בקצב קבוע ובחימום וקוסינוס, בשני קצבים.');
  const cR = canvas(colm(flex(box), 'הפסד מול קצב למידה (סקאלה לוגריתמית)'), 600, 220, 600); const outR = V.say(box); const tb = el('div'); box.appendChild(tb); const cS = canvas(colm(flex(box), 'דיוק וולידציה בכל סבב'), 600, 200, 600); legend(box, [['#868e96', 'קבוע 1e−3', true], ['#4263eb', 'קוסינוס 1e−3'], ['#fab005', 'קבוע 1e−2', true], ['#e8590c', 'קוסינוס 1e−2']]); const out = V.say(box);
  function draw() { const D = L7(); if (!D) { outR.innerHTML = 'הנתונים מההרצה עוד לא נטענו.'; return; } const R = D.range, x = cR.getContext('2d'); x.clearRect(0, 0, 600, 220); const lx = v => 40 + (log10(v) + 7) / 7 * 550, ly = v => 200 - clamp(v / 3, 0, 1) * 185;
    for (let e = -7; e <= 0; e++) { x.strokeStyle = '#f1f3f5'; x.beginPath(); x.moveTo(lx(Math.pow(10, e)), 10); x.lineTo(lx(Math.pow(10, e)), 200); x.stroke(); txt(x, '1e' + e, lx(Math.pow(10, e)), 214, '#868e96', 10, 'center'); } [0, 1, 2, 3].forEach(v => txt(x, String(v), 30, ly(v) + 4, '#868e96', 10, 'right'));
    x.strokeStyle = '#4263eb'; x.lineWidth = 2; x.beginPath(); R.forEach(([lr, l], i) => i ? x.lineTo(lx(lr), ly(l)) : x.moveTo(lx(lr), ly(l))); x.stroke(); x.lineWidth = 1;
    const sm = R.map((_, i) => { const w = R.slice(Math.max(0, i - 4), i + 5); return w.reduce((a, b) => a + b[1], 0) / w.length; }); let best = 0, bs = 0; for (let i = 5; i < R.length - 1; i++) { const sl = (sm[i - 5] - sm[i]); if (sl > bs) { bs = sl; best = i; } } const mn = R.reduce((a, b) => b[1] < a[1] ? b : a);
    x.fillStyle = '#e8590c'; x.beginPath(); x.arc(lx(R[best][0]), ly(R[best][1]), 6, 0, 7); x.fill(); x.fillStyle = '#2f9e44'; x.beginPath(); x.arc(lx(mn[0]), ly(mn[1]), 6, 0, 7); x.fill();
    outR.innerHTML = 'עד בערך ' + ltr('1e−5') + ' ההפסד שטוח (2.3 — ניחוש): הקצב קטן מכדי לזוז. הירידה התלולה ביותר (כתום) סביב <b>' + ltr(R[best][0].toExponential(0)) + '</b>, ההפסד הנמוך ביותר (ירוק) ב־' + ltr(mn[0].toExponential(0)) + ', ו' + (R.length < 200 ? 'אחרי ' + ltr(R[R.length - 1][0].toExponential(0)) + ' — פיצוץ (הבדיקה נעצרה כשההפסד עלה פי 4 מהמינימום).' : 'עד הסוף לא היה פיצוץ.') + ' לפי הכלל של הסעיף — קטן פי 10 בערך מנקודת הירידה המהירה — הבחירה יוצאת ' + ltr((R[best][0] / 10).toExponential(0)) + ', שמרנית. הקורס צפה ירידה תלולה ב־1e−3 עד 1e−2; כאן היא התחילה מוקדם יותר. ' + ltr('1e−3') + ' — בין הירידה התלולה למינימום — הוא הקצב שעבד היטב לאורך כל המודול. בדיקת טווח רועשת (מנה אחת לכל נקודה): היא נותנת <b>טווח</b> סביר, לא מספר מדויק.';
    const S = D.sched, k = ['const_1e-3', 'cos_1e-3', 'const_1e-2', 'cos_1e-2'], col = ['#868e96', '#4263eb', '#fab005', '#e8590c'], da = [[4, 3], null, [4, 3], null];
    lplot(cS, k.map((n, i) => ({ y: S[n].map(h => h[1]), color: col[i], dash: da[i] || undefined })), [0.8, 0.9]);
    tb.innerHTML = ''; out.innerHTML = table(['', 'קבוע', 'חימום וקוסינוס'], [['1e−3', (S['const_1e-3'][9][1] * 100).toFixed(1) + '%', '<b>' + (S['cos_1e-3'][9][1] * 100).toFixed(1) + '%</b>'], ['1e−2', (S['const_1e-2'][9][1] * 100).toFixed(1) + '%', '<b>' + (S['cos_1e-2'][9][1] * 100).toFixed(1) + '%</b>']]) + 'דיוק וולידציה אחרי 10 סבבים. התזמון עוזר בעיקר כשהקצב גבוה: בקצב קבוע של ' + ltr('1e−2') + ' האימון קופץ סביב המינימום; הקוסינוס מוריד את הקצב בסוף ומאפשר להיכנס אליו — ומשווה את הקצב הגבוה לנמוך. בקצב נמוך ההבדל זניח, בתוך הרעש שבין גרעינים (פרק 10). המסקנה המעשית: עם קוסינוס, הבחירה של הקצב המקסימלי הרבה פחות רגישה.'; }
  draw();
};

/* ===================================================== chapter 8 */
const L8 = () => window.M2LAB8 || null;          /* real runs on the user's computer (content/m2_lab8data.js) */
/* least squares by Householder QR (stable enough for degree 14 on [-1, 1]); A is m×n (array of rows) */
function lstsq(A, b) { const m = A.length, n = A[0].length, R = A.map(r => r.slice()), y = b.slice();
  for (let k = 0; k < n; k++) { let nr = 0; for (let i = k; i < m; i++) nr += R[i][k] * R[i][k]; nr = Math.sqrt(nr); if (nr === 0) continue; const s = R[k][k] > 0 ? -nr : nr, v = []; for (let i = k; i < m; i++) v.push(R[i][k]); v[0] -= s; const vn = v.reduce((a, t) => a + t * t, 0); if (vn === 0) continue;
    for (let j = k; j < n; j++) { let d = 0; for (let i = k; i < m; i++) d += v[i - k] * R[i][j]; d = 2 * d / vn; for (let i = k; i < m; i++) R[i][j] -= d * v[i - k]; } let d = 0; for (let i = k; i < m; i++) d += v[i - k] * y[i]; d = 2 * d / vn; for (let i = k; i < m; i++) y[i] -= d * v[i - k]; }
  const c = new Array(n).fill(0); for (let i = n - 1; i >= 0; i--) { let s = y[i]; for (let j = i + 1; j < n; j++) s -= R[i][j] * c[j]; c[i] = Math.abs(R[i][i]) < 1e-300 ? 0 : s / R[i][i]; } return c; }
/* the course's ridge: solve (AᵀA + λI) c = Aᵀy, with Gaussian elimination and partial pivoting (like np.linalg.solve) */
function solveLin(M, b) { const n = M.length, A = M.map((r, i) => r.concat([b[i]])); for (let k = 0; k < n; k++) { let p = k; for (let i = k + 1; i < n; i++) if (Math.abs(A[i][k]) > Math.abs(A[p][k])) p = i; [A[k], A[p]] = [A[p], A[k]]; for (let i = k + 1; i < n; i++) { const f = A[i][k] / A[k][k]; for (let j = k; j <= n; j++) A[i][j] -= f * A[k][j]; } }
  const x = new Array(n).fill(0); for (let i = n - 1; i >= 0; i--) { let s = A[i][n]; for (let j = i + 1; j < n; j++) s -= A[i][j] * x[j]; x[i] = s / A[i][i]; } return x; }
const vander = (x, d) => x.map(t => { const r = []; for (let k = d; k >= 0; k--) r.push(Math.pow(t, k)); return r; });
const polyval = (c, t) => c.reduce((a, v) => a * t + v, 0);
function ridge(x, y, deg, lam) { const A = vander(x, deg), n = deg + 1, M = [...Array(n)].map((_, i) => [...Array(n)].map((_, j) => A.reduce((s, r) => s + r[i] * r[j], 0) + (i === j ? lam : 0))), rhs = [...Array(n)].map((_, i) => A.reduce((s, r, k) => s + r[i] * y[k], 0)); return solveLin(M, rhs); }
const XV = [...Array(200)].map((_, i) => -1 + 2 * i / 199), YV = XV.map(t => Math.sin(3 * t));
const polyData = n => (window.M2POLY && window.M2POLY[n]) || (() => { const r = NN.rng(n), x = [...Array(n)].map(() => r() * 2 - 1).sort((a, b) => a - b); return { x, y: x.map(t => Math.sin(3 * t) + NN.randn(r) * 0.2) }; })();
const mse = (c, xs, ys) => xs.reduce((s, t, i) => s + (polyval(c, t) - ys[i]) ** 2, 0) / xs.length;
function polyPlot(cv, D, c, opt) { const x = cv.getContext('2d'), W = cv.width, H = cv.height; x.clearRect(0, 0, W, H); const X = t => 20 + (t + 1) / 2 * (W - 30), Y = v => H / 2 - v / 2.2 * (H / 2 - 12);
  x.strokeStyle = '#f1f3f5'; x.beginPath(); x.moveTo(20, Y(0)); x.lineTo(W - 10, Y(0)); x.stroke(); x.strokeStyle = '#adb5bd'; x.setLineDash([4, 3]); x.beginPath(); XV.forEach((t, i) => i ? x.lineTo(X(t), Y(YV[i])) : x.moveTo(X(t), Y(YV[i]))); x.stroke(); x.setLineDash([]);
  x.save(); x.beginPath(); x.rect(20, 4, W - 30, H - 8); x.clip(); x.strokeStyle = '#e8590c'; x.lineWidth = 2.2; x.beginPath(); for (let i = 0; i <= 400; i++) { const t = -1 + 2 * i / 400, v = clamp(polyval(c, t), -50, 50); i ? x.lineTo(X(t), Y(v)) : x.moveTo(X(t), Y(v)); } x.stroke(); x.restore(); x.lineWidth = 1;
  D.x.forEach((t, i) => { x.fillStyle = '#4263eb'; x.beginPath(); x.arc(X(t), Y(D.y[i]), D.x.length > 50 ? 2 : 4, 0, 7); x.fill(); }); }

W.w2_polyfit = function (box) {
  V.say(box, 'הקוד של הסעיף, עם <b>אותן 15 נקודות בדיוק</b>. הזז את <b>דרגת הפולינום</b> — "גודל המודל". המקווקו: ' + ltr('sin(3x)') + ' האמיתי; הכתום: הפולינום. ובלשונית "200 נקודות" — תרגיל 8.1.');
  let deg = 3, n = 15; V.tabs(box, ['15 נקודות (הסעיף)', '200 נקודות (תרגיל 8.1)'], k => { n = k ? 200 : 15; draw(); }); const sr = row(box); V.slider(sr, 'דרגה', 0, 14, 1, deg, v => { deg = v; draw(); });
  const fx = flex(box); const cv = canvas(colm(fx, 'הנתונים והפולינום'), 380, 260, 380), cE = canvas(colm(fx, 'שגיאה מול דרגה (סקאלה לוגריתמית)'), 300, 260, 300); legend(box, [['#4263eb', 'אימון'], ['#e8590c', 'אימות']]); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const D = polyData(n), errs = [...Array(15)].map((_, d) => { const c = lstsq(vander(D.x, d), D.y); return [mse(c, D.x, D.y), mse(c, XV, YV)]; }); const c = lstsq(vander(D.x, deg), D.y); polyPlot(cv, D, c);
    const pl = logPlot(cE, [{ y: errs.map(e => e[0]), color: '#4263eb' }, { y: errs.map(e => e[1]), color: '#e8590c' }], -4, 3, { xl: ['0', '14'] }); const xx = cE.getContext('2d'); xx.fillStyle = '#212529'; xx.beginPath(); xx.arc(pl.X(deg), pl.Y(errs[deg][1]), 4, 0, 7); xx.fill();
    const [tr, va] = errs[deg]; tb.innerHTML = table(['דרגה', 'שגיאת אימון', 'שגיאת אימות', 'המקדם הגדול'], [[deg, F(tr, 4), '<b>' + F(va, 4) + '</b>', fmtN(Math.max(...c.map(Math.abs)))]]);
    const best = errs.reduce((b, e, i) => e[1] < errs[b][1] ? i : b, 0);
    out.innerHTML = (n === 15 ? (deg <= 1 ? 'חוסר התאמה: קו ישר לא יכול לעקוב אחרי הגל — שתי השגיאות גבוהות. ' : deg >= 10 ? '<b>התאמת יתר</b>: הפולינום עובר כמעט דרך כל נקודה (שגיאת אימון ' + F(tr, 4) + '), ובין הנקודות — ובמיוחד בקצוות — משתולל. שגיאת האימות פי ' + fmtN(va / errs[3][1]) + ' מדרגה 3. ' : deg === 3 ? 'מאוזן: 0.017 באימון ו־0.025 באימות — כמו בקורס. ' : '') + 'הדרגה עם שגיאת האימות הנמוכה ביותר: ' + best + '. בגרף מימין — שגיאת האימון רק יורדת עם הדרגה; שגיאת האימות יורדת ואז מזנקת. אסור לבחור מודל לפי האימון.'
      : 'עם 200 נקודות, דרגה 12 כבר לא יכולה לשנן: שגיאת האימות ' + F(errs[12][1], 4) + ' (בקורס: 0.003), ושגיאת האימון ' + F(errs[12][0], 3) + ' — כמעט רמת הרעש, ' + ltr('0.2² = 0.04') + '. כשיש מספיק נתונים, הדרך הקלה ביותר להקטין את ההפסד היא ללמוד את הכלל, לא את הרעש. הקו הכתום בגרף מימין כמעט לא עולה.'); }
  draw();
};

/* ===================================================== 8.2 */
W.w2_ridge = function (box) {
  V.say(box, 'דרגה 12 על 15 הנקודות של הסעיף — המודל שמשתולל — עם העונש של הסעיף. <b>הזז את λ</b> (סקאלה לוגריתמית). למטה: 13 המקדמים.');
  let lg = -8; const sr = row(box); V.slider(sr, ltr('λ = 10^'), -10, 1, 0.25, lg, v => { lg = v; draw(); }, v => F(v, 2)); V.btns(box, [['λ = 0', () => { lg = -99; draw(); }, 'ghost'], ['λ = 0.001', () => { lg = -3; draw(); }, 'ghost'], ['λ = 0.1', () => { lg = -1; draw(); }, 'ghost']]);
  const fx = flex(box); const cv = canvas(colm(fx, 'הפולינום'), 380, 240, 380), cC = canvas(colm(fx, 'המקדמים (סקאלה לוגריתמית של הגודל)'), 300, 240, 300); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const D = polyData(15), lam = lg < -50 ? 0 : Math.pow(10, lg), c = ridge(D.x, D.y, 12, lam); polyPlot(cv, D, c);
    const x = cC.getContext('2d'); x.clearRect(0, 0, 300, 240); c.forEach((v, i) => { const h = clamp((log10(Math.abs(v) + 1e-6) + 2) / 6, 0, 1) * 190; x.fillStyle = v > 0 ? '#4263eb' : '#e8590c'; x.fillRect(12 + i * 22, 210 - h, 16, h); txt(x, String(12 - i), 20 + i * 22, 226, '#868e96', 9, 'center'); }); [0.01, 1, 100, 10000].forEach(v => { const h = (log10(v) + 2) / 6 * 190; txt(x, v >= 1 ? fmtN(v) : String(v), 296, 214 - h, '#adb5bd', 9, 'right'); x.strokeStyle = '#f1f3f5'; x.beginPath(); x.moveTo(10, 210 - h); x.lineTo(300, 210 - h); x.stroke(); });
    const va = mse(c, XV, YV), tr = mse(c, D.x, D.y), mx = Math.max(...c.map(Math.abs)); tb.innerHTML = table(['λ', 'שגיאת אימון', 'שגיאת אימות', 'המקדם הגדול'], [[lam ? ltr(lam.toExponential(1)) : '0', F(tr, 4), '<b>' + F(va, 4) + '</b>', F(mx, 1)]]);
    out.innerHTML = (lam === 0 ? 'בלי עונש: מקדמים של אלפים (בקורס 8,682) עם סימנים מתחלפים — הם מבטלים זה את זה בנקודות האימון, ומתפוצצים ביניהן. ' : lg <= -6 ? 'עונש זעיר כבר מכווץ את המקדמים הענקיים — הם היו "יקרים" בהפסד ותרמו מעט מאוד להתאמה. ' : lg >= 0 ? 'עונש גדול מדי: כל המקדמים קטנים, והפולינום שטוח מדי — חוסר התאמה מהכיוון השני. ' : '') +
      'אותו מודל, אותה דרגה — רק העדפה למקדמים קטנים. כחול — חיובי, כתום — שלילי. ' + (Math.abs(lg + 3) < 0.01 ? 'ב־' + ltr('λ = 0.001') + ': 0.110 ו־3.4 — כמו בקורס.' : Math.abs(lg + 1) < 0.01 ? 'ב־' + ltr('λ = 0.1') + ': 0.091 ו־1.6 — כמו בקורס.' : ''); }
  draw();
};

/* ===================================================== 8.3 */
/* a 2 → H → H → 3 network on a few noisy spiral points, trained with or without dropout (inverted dropout, as in the section) */
function dnet(H, seed) { const r = NN.rng(seed), m = (a, b, s) => { const W = new Float64Array(a * b); for (let i = 0; i < W.length; i++) W[i] = NN.randn(r) * s; return W; }; return { H, W1: m(2, H, Math.sqrt(2 / 2)), b1: new Float64Array(H), W2: m(H, H, Math.sqrt(2 / H)), b2: new Float64Array(H), W3: m(H, 3, Math.sqrt(2 / H)), b3: new Float64Array(3) }; }
function dfwd(P, x, p, r) { const H = P.H, z1 = new Float64Array(H), h1 = new Float64Array(H), m1 = new Float64Array(H), z2 = new Float64Array(H), h2 = new Float64Array(H), m2 = new Float64Array(H), s = [0, 0, 0];
  for (let j = 0; j < H; j++) { z1[j] = x[0] * P.W1[j] + x[1] * P.W1[H + j] + P.b1[j]; m1[j] = r ? (r() > p ? 1 / (1 - p) : 0) : 1; h1[j] = Math.max(0, z1[j]) * m1[j]; }
  for (let k = 0; k < H; k++) { let a = P.b2[k]; for (let j = 0; j < H; j++) a += h1[j] * P.W2[j * H + k]; z2[k] = a; m2[k] = r ? (r() > p ? 1 / (1 - p) : 0) : 1; h2[k] = Math.max(0, a) * m2[k]; }
  for (let c = 0; c < 3; c++) { let a = P.b3[c]; for (let k = 0; k < H; k++) a += h2[k] * P.W3[k * 3 + c]; s[c] = a; } const mx = Math.max(...s), e = s.map(v => Math.exp(v - mx)), S = e[0] + e[1] + e[2]; return { z1, h1, m1, z2, h2, m2, pr: e.map(v => v / S) }; }
function dstep(P, X, Y, p, lr, r) { const H = P.H, g = { W1: new Float64Array(P.W1.length), b1: new Float64Array(H), W2: new Float64Array(P.W2.length), b2: new Float64Array(H), W3: new Float64Array(P.W3.length), b3: new Float64Array(3) }, n = X.length;
  for (let i = 0; i < n; i++) { const f = dfwd(P, X[i], p, p > 0 ? r : null), ds = f.pr.map((v, c) => (v - (c === Y[i] ? 1 : 0)) / n), dh2 = new Float64Array(H), dh1 = new Float64Array(H);
    for (let c = 0; c < 3; c++) { g.b3[c] += ds[c]; for (let k = 0; k < H; k++) { g.W3[k * 3 + c] += f.h2[k] * ds[c]; dh2[k] += ds[c] * P.W3[k * 3 + c]; } }
    for (let k = 0; k < H; k++) { const dz = f.z2[k] > 0 ? dh2[k] * f.m2[k] : 0; if (!dz) continue; g.b2[k] += dz; for (let j = 0; j < H; j++) { g.W2[j * H + k] += f.h1[j] * dz; dh1[j] += dz * P.W2[j * H + k]; } }
    for (let j = 0; j < H; j++) { const dz = f.z1[j] > 0 ? dh1[j] * f.m1[j] : 0; if (!dz) continue; g.b1[j] += dz; g.W1[j] += X[i][0] * dz; g.W1[H + j] += X[i][1] * dz; } }
  ['W1', 'b1', 'W2', 'b2', 'W3', 'b3'].forEach(k => { for (let i = 0; i < P[k].length; i++) P[k][i] -= lr * g[k][i]; }); }
function paintD(cv, pred, tr) { const Wd = cv.width, Ht = cv.height, x = cv.getContext('2d'), res = 52, cw = Wd / res, ch = Ht / res; const P = p => [(p[0] + 1.1) / 2.2 * Wd, (1.1 - p[1]) / 2.2 * Ht];
  for (let i = 0; i < res; i++) for (let j = 0; j < res; j++) { const c = COL[pred([-1.1 + 2.2 * (j + 0.5) / res, 1.1 - 2.2 * (i + 0.5) / res])]; x.fillStyle = 'rgb(' + c.map(v => Math.round(255 - (255 - v) * 0.24)).join(',') + ')'; x.fillRect(j * cw, i * ch, cw + 1, ch + 1); }
  XS.forEach((p, k) => { const c = COL[YS[k]]; x.fillStyle = 'rgba(' + c.join(',') + ',.28)'; x.beginPath(); x.arc(...P(p), 2, 0, 7); x.fill(); });
  tr.X.forEach((p, k) => { const c = COL[tr.Y[k]]; x.fillStyle = 'rgb(' + c.join(',') + ')'; x.strokeStyle = '#fff'; x.beginPath(); x.arc(...P(p), 4.2, 0, 7); x.fill(); x.stroke(); }); }
W.w2_dropout = function (box) {
  V.say(box, 'רשת גדולה (שתי שכבות של 64) על <b>מעט נתונים רועשים</b>: 15 נקודות מכל ספירלה, עם הרבה רעש. אותה רשת, אותו אתחול — משמאל בלי השמטה, מימין עם השמטה של p אחרי כל שכבה נסתרת. <b>לחץ "אמן"</b>. הנקודות השקופות הן סט האימות (300 נקודות נקיות).');
  let p = 0.5, PA, PB, step = 0, timer = null, r; const sr = row(box); V.slider(sr, 'p (השמטה)', 0.1, 0.8, 0.05, p, v => { p = v; reset(); }, v => F(v, 2));
  V.btns(box, [['▶ אמן', () => go(), 'primary'], ['אפס', () => reset(), 'ghost']]);
  const tr = (() => { const rr = NN.rng(3), X = [], Y = []; for (let c = 0; c < 3; c++) for (let i = 0; i < 15; i++) { const t = rr(), rad = t, ang = c * 4 + t * 4 + NN.randn(rr) * 0.7; X.push([rad * Math.sin(ang), rad * Math.cos(ang)]); Y.push(c); } return { X, Y }; })();
  const fx = flex(box); const cA = canvas(colm(fx, 'בלי השמטה'), 260, 260, 260), cB = canvas(colm(fx, 'עם השמטה'), 260, 260, 260); const cN = canvas(colm(flex(box), 'צעד אחד באימון עם השמטה: הנוירונים המחוקים (אפור) מתחלפים בכל צעד'), 600, 90, 600); const out = V.say(box);
  function reset() { clearInterval(timer); timer = null; PA = dnet(64, 5); PB = dnet(64, 5); step = 0; r = NN.rng(17); draw(); }
  function acc(P, X, Y) { let a = 0; X.forEach((x, i) => { const pr = dfwd(P, x, 0, null).pr; if (pr.indexOf(Math.max(...pr)) === Y[i]) a++; }); return a / X.length; }
  function go() { if (timer) return; if (step >= 3000) reset(); timer = setInterval(() => { if (!alive(box)) return clearInterval(timer); for (let i = 0; i < 40 && step < 3000; i++, step++) { dstep(PA, tr.X, tr.Y, 0, 0.3); dstep(PB, tr.X, tr.Y, p, 0.3, r); } draw(); if (step >= 3000) { clearInterval(timer); timer = null; } }, 30); }
  function draw() { [[cA, PA], [cB, PB]].forEach(([c, P]) => { paintD(c, x => { const pr = dfwd(P, x, 0, null).pr; return pr[0] >= pr[1] && pr[0] >= pr[2] ? 0 : pr[1] >= pr[2] ? 1 : 2; }, tr); });
    const x = cN.getContext('2d'); x.clearRect(0, 0, 600, 90); const rr = NN.rng(step + 1); for (let L = 0; L < 2; L++) for (let j = 0; j < 32; j++) { const on = rr() > p; x.fillStyle = on ? (L ? '#2f9e44' : '#4263eb') : '#dee2e6'; x.beginPath(); x.arc(20 + j * 18.2, 25 + L * 40, 6, 0, 7); x.fill(); }
    const aA = [acc(PA, tr.X, tr.Y), acc(PA, XS, YS)], aB = [acc(PB, tr.X, tr.Y), acc(PB, XS, YS)];
    out.innerHTML = 'צעד ' + step + '. בלי השמטה: אימון <b>' + (aA[0] * 100).toFixed(0) + '%</b>, אימות <b>' + (aA[1] * 100).toFixed(0) + '%</b>. עם השמטה: אימון ' + (aB[0] * 100).toFixed(0) + '%, אימות <b>' + (aB[1] * 100).toFixed(0) + '%</b>. ' + (step >= 3000 ? 'הרשת בלי השמטה משננת: היא מגיעה ל־' + (aA[0] * 100).toFixed(0) + '% על 45 הנקודות, והגבולות שלה מתעקמים סביב כל נקודה רועשת. עם השמטה — כל נוירון יכול להיעלם בכל צעד, אז אף נוירון לא יכול "להתמחות" בנקודה אחת, והגבולות חלקים יותר. בזמן הערכה כל הנוירונים פעילים (בלי מסכה), ובזכות החלוקה ב־' + ltr('1 − p') + ' הסקאלה זהה.' : ''); }
  reset();
};

/* ===================================================== 8.4 */
W.w2_norms = function (box) {
  V.say(box, 'אצווה של N דוגמאות (שורות) עם 6 תכונות (עמודות). <b>בחר נרמול</b>: המסגרות הכתומות מראות על אילו מספרים מחושב כל ממוצע. הזז את <b>גודל האצווה</b> — ובמיוחד ל־1.');
  let kind = 0, N = 4, seed = 1; V.tabs(box, ['נרמול אצווה (BatchNorm)', 'נרמול שכבה (LayerNorm)'], k => { kind = k; draw(); }); const sr = row(box); V.slider(sr, 'גודל אצווה N', 1, 8, 1, N, v => { N = v; draw(); }); V.btns(box, [['דוגמאות אחרות', () => { seed++; draw(); }, 'ghost']]);
  const fx = flex(box); const c0 = canvas(colm(fx, 'לפני'), 280, 230, 280), c1 = canvas(colm(fx, 'אחרי'), 280, 230, 280); const out = V.say(box); const real = el('div'); box.appendChild(real);
  function grid(c, M, hl, title) { const x = c.getContext('2d'); x.clearRect(0, 0, 280, 230); const n = M.length, cw = 40, ch = Math.min(26, 200 / n), mx = Math.max(1e-9, ...M.flat().map(Math.abs));
    M.forEach((row0, i) => row0.forEach((v, j) => { const t = v / mx; x.fillStyle = t > 0 ? 'rgba(66,99,235,' + Math.abs(t) + ')' : 'rgba(232,89,12,' + Math.abs(t) + ')'; x.fillRect(16 + j * cw, 10 + i * ch, cw - 2, ch - 2); txt(x, F(v, 1), 16 + j * cw + cw / 2 - 1, 10 + i * ch + ch / 2 + 4, Math.abs(t) > 0.6 ? '#fff' : '#212529', 10, 'center'); }));
    if (hl) { x.strokeStyle = '#e8590c'; x.lineWidth = 2; if (kind === 0) for (let j = 0; j < 6; j++) x.strokeRect(16 + j * cw - 1, 9, cw, n * ch); else for (let i = 0; i < n; i++) x.strokeRect(15, 10 + i * ch - 1, 6 * cw, ch); x.lineWidth = 1; } }
  function draw() { const r = NN.rng(seed * 7 + 1), X = [...Array(N)].map(() => [...Array(6)].map((_, j) => 5 + 3 * NN.randn(r) + j)); let Y;
    if (kind === 0) { Y = X.map(r0 => r0.slice()); for (let j = 0; j < 6; j++) { const col = X.map(r0 => r0[j]), mu = col.reduce((a, b) => a + b, 0) / N, vr = col.reduce((a, b) => a + (b - mu) ** 2, 0) / N; X.forEach((r0, i) => Y[i][j] = (r0[j] - mu) / Math.sqrt(vr + 1e-5)); } }
    else Y = X.map(r0 => { const mu = r0.reduce((a, b) => a + b, 0) / 6, vr = r0.reduce((a, b) => a + (b - mu) ** 2, 0) / 6; return r0.map(v => (v - mu) / Math.sqrt(vr + 1e-5)); });
    grid(c0, X, true); grid(c1, Y, false);
    out.innerHTML = kind === 0 ? (N === 1 ? badge(false, 'כל המידע נעלם') + ': עם דוגמה אחת, הממוצע של כל עמודה הוא הערך עצמו — והפלט כולו אפסים, כמו ' + ltr('batchnorm(X[:1])') + ' בקורס. ' : 'נרמול אצווה: כל <b>עמודה</b> (תכונה) מנורמלת לאורך הדוגמאות שבאצווה. התוצאה של דוגמה אחת תלויה בדוגמאות האחרות שאיתה — שנה את "דוגמאות אחרות" וראה שאותה שורה מקבלת ערכים שונים. ') + 'לכן באימון BN אוסף ממוצע נע, ובהערכה (' + ltr('model.eval()') + ') משתמש בו במקום בסטטיסטיקה של האצווה.'
      : 'נרמול שכבה: כל <b>שורה</b> (דוגמה) מנורמלת לאורך התכונות שלה. שום קשר לשורות האחרות — אותה תוצאה בכל גודל אצווה, גם 1, ובאימון ובהערכה (תרגיל 8.3). לכן הוא הנרמול של המשנים, שבהם "התכונות" הן הממדים של כל מילה.';
    const D = L8(); if (D && D.bn && !real.firstChild) { const B = D.bn; real.innerHTML = '<div class="note-small" style="text-align:center;margin-top:10px"><b>ומה קורה כששוכחים ' + ltr('model.eval()') + '</b> — הרשת השאריתית של תרגיל 5.3 (עם BN), אחרי סבב אימון אחד במחשב שלך, נבדקה על הוולידציה בשני המצבים:</div>' +
      table(['מצב', 'גודל אצווה', 'דיוק'], [['eval', '512', '<b>' + (B.eval_512 * 100).toFixed(1) + '%</b>'], ['train (שכחו eval)', '512', (B.train_512 * 100).toFixed(1) + '%'], ['train', '32', (B.train_32 * 100).toFixed(1) + '%'], ['train', '8', (B.train_8 * 100).toFixed(1) + '%'], ['train', '2', (B.train_2 * 100).toFixed(1) + '%'], ['train', '1', '<b>' + (B.train_1 * 100).toFixed(1) + '%</b>'], ['eval, אצוות ממוינות לפי מחלקה', '64', (B.eval_sorted_64 * 100).toFixed(1) + '%'], ['train, אצוות ממוינות לפי מחלקה', '64', '<b>' + (B.train_sorted_64 * 100).toFixed(1) + '%</b>']]) +
      '<div class="say">ב־eval גודל האצווה לא משנה כלום — כל תמונה מסווגת לבד, לפי הממוצע הנע. (אחרי סבב אחד בלבד הממוצע הנע עוד מפגר מעט אחרי המשקלים, ולכן באצווה גדולה ומעורבבת train יצא כאן אפילו קצת גבוה — זה נעלם עם עוד אימון.) ב־train הסטטיסטיקה של האצווה נכנסת לכל תחזית: באצווה גדולה ומעורבבת זה כמעט לא מורגש, באצווה של תמונה אחת הנרמול מוחק את המידע, ובאצוות שכולן מאותה מחלקה (וולידציה ממוינת) — הנרמול מוחק בדיוק את מה שמשותף לכל התמונות באצווה. זה הבאג של שאלת הראיון, במספרים.</div>'; } }
  draw();
};

/* ===================================================== 8.5 */
function augImg(src, o, r) { const out = new Float32Array(784); const sc = o.crop ? 0.8 + r() * 0.2 : 1, side = 28 * Math.sqrt(sc), ox = r() * (28 - side), oy = r() * (28 - side); const fl = o.flip && r() < 0.5, vf = o.vflip && r() < 0.5, ang = o.rot ? (r() * 2 - 1) * o.rot * Math.PI / 180 : 0, br = o.jit ? 1 + (r() * 2 - 1) * 0.4 : 1, ct = o.jit ? 1 + (r() * 2 - 1) * 0.4 : 1;
  for (let y = 0; y < 28; y++) for (let x = 0; x < 28; x++) { let u = (x + 0.5) / 28 - 0.5, v = (y + 0.5) / 28 - 0.5; const cu = Math.cos(ang) * u - Math.sin(ang) * v, cv = Math.sin(ang) * u + Math.cos(ang) * v; u = cu; v = cv; if (fl) u = -u; if (vf) v = -v;
    const sx = ox + (u + 0.5) * side - 0.5, sy = oy + (v + 0.5) * side - 0.5, x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0; const g = (a, b) => a < 0 || b < 0 || a > 27 || b > 27 ? 0 : src[b * 28 + a];
    let val = (g(x0, y0) * (1 - fx) + g(x0 + 1, y0) * fx) * (1 - fy) + (g(x0, y0 + 1) * (1 - fx) + g(x0 + 1, y0 + 1) * fx) * fy; val = clamp(((val / 255 - 0.5) * ct + 0.5) * br, 0, 1); out[y * 28 + x] = val * 255; } return out; }
W.w2_augment = function (box) {
  V.say(box, 'הגדלת נתונים על תמונות אמיתיות מפריטי הלבוש. <b>בחר תמונה וטרנספורמציות</b>: כל ריבוע הוא מה שהרשת הייתה רואה בסבב אחר. כל אחד שונה — והתווית זהה.');
  let k = 7, seed = 1; const o = { flip: true, crop: true, rot: 0, jit: false, vflip: false }; const D0 = L4(); if (D0) V.btns(box, D0.ys.map((y, i) => [FASHION[y], () => { k = i; draw(); }, 'ghost']));
  const opts = el('div', { class: 'row' }); box.appendChild(opts); [['flip', 'היפוך אופקי'], ['crop', 'חיתוך אקראי (80%–100%)'], ['jit', 'בהירות וניגודיות'], ['vflip', 'היפוך אנכי']].forEach(([key, t]) => { const l = el('label', { class: 'note-small', html: '<input type="checkbox"' + (o[key] ? ' checked' : '') + '> ' + t + ' &nbsp;' }); l.querySelector('input').onchange = e => { o[key] = e.target.checked; draw(); }; opts.appendChild(l); });
  const sr = row(box); V.slider(sr, 'סיבוב עד ±', 0, 45, 5, o.rot, v => { o.rot = v; draw(); }); V.btns(box, [['🎲 עוד דגימות', () => { seed++; draw(); }, 'ghost']]);
  const grid = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px', direction: 'ltr', maxWidth: '640px', margin: '6px auto' } }); box.appendChild(grid); const cells = [...Array(16)].map(() => { const c = document.createElement('canvas'); c.width = c.height = 28; c.style.width = '100%'; c.style.imageRendering = 'pixelated'; c.style.borderRadius = '4px'; grid.appendChild(c); return c; });
  const out = V.say(box); const real = el('div'); box.appendChild(real);
  function draw() { const D = L4(); if (!D) { out.innerHTML = 'הנתונים מההרצה עוד לא נטענו.'; return; } const src = D.imgs[k], r = NN.rng(seed * 97 + k); cells.forEach((c, i) => heat(c, Array.from(i === 0 ? src : augImg(src, o, r)), 28, 28));
    out.innerHTML = 'הריבוע הראשון — המקור; 15 האחרים — גרסאות אקראיות. ' + (o.vflip ? badge(false, 'זהירות') + ': היפוך אנכי של ' + FASHION[D.ys[k]] + ' יוצר תמונה שלא קיימת במאגר (נעליים הפוכות?). זו לא טעות בתווית כמו 6 ו־9, אבל זה מלמד את הרשת על מקרים שלא יופיעו, ומבזבז קיבולת. הגדלה צריכה לייצר תמונות שהיו יכולות להגיע באמת. ' : '') + (o.rot > 20 ? 'סיבוב גדול חותך את הפינות ומוסיף שחור — עוד סוג של תמונה שלא קיימת. ' : '') + 'בכל סבב הרשת רואה גרסה אחרת של כל תמונה, ולכן קשה לה לשנן פיקסלים מסוימים — היא נאלצת ללמוד את מה שנשאר קבוע: הצורה.';
    const L = L8(); if (L && L.aug_off && L.aug_on && !real.firstChild) { const A = L.aug_off.hist, B = L.aug_on.hist; const c = canvas(colm(flex(real), '<b>תרגיל 8.4, במחשב שלך</b>: SmallCNN, 12 סבבים, הפסד אימון (רציף) ואימות (מקווקו)'), 600, 220, 600);
      lplot(c, [{ y: A.map(h => h[0]), color: '#e8590c' }, { y: A.map(h => h[1]), color: '#e8590c', dash: [5, 3] }, { y: B.map(h => h[0]), color: '#4263eb' }, { y: B.map(h => h[1]), color: '#4263eb', dash: [5, 3] }], [0, 0.6]); legend(real, [['#e8590c', 'בלי הגדלה'], ['#4263eb', 'עם היפוך וחיתוך']]);
      const bA = A.reduce((b, h, i) => h[1] < A[b][1] ? i : b, 0), bB = B.reduce((b, h, i) => h[1] < B[b][1] ? i : b, 0), gap = h => h[1] - h[0];
      real.appendChild(el('div', { class: 'say', html: table(['', 'הפסד אימות הכי נמוך', 'בסבב', 'בסוף: אימון / אימות', 'פער בסוף', 'דיוק בסוף'], [['בלי הגדלה', F(A[bA][1], 3), bA, F(A[11][0], 3) + ' / ' + F(A[11][1], 3), '<b>' + F(gap(A[11]), 3) + '</b>', (A[11][2] * 100).toFixed(1) + '%'], ['עם הגדלה', F(B[bB][1], 3), bB, F(B[11][0], 3) + ' / ' + F(B[11][1], 3), '<b>' + F(gap(B[11]), 3) + '</b>', (B[11][2] * 100).toFixed(1) + '%']]) +
        'בלי הגדלה, הפסד האימון ממשיך לרדת והפסד האימות מתחיל לעלות אחרי סבב ' + bA + ' — התאמת יתר קלאסית. עם הגדלה, הפסד האימון גבוה יותר (המשימה קשה יותר), והפער בין העקומות כמעט נעלם. ' + (B[11][2] < A[11][2] ? 'אבל שימו לב: אחרי 12 סבבים הדיוק בלי הגדלה עדיין גבוה מעט — עם הגדלה הרשת עוד לא סיימה ללמוד (הפסד האימות שלה עוד יורד בסבב האחרון). הגדלה כמעט תמיד דורשת יותר סבבים כדי להשתלם; היתרון שלה הוא שאפשר לאמן ארוך בלי להתאים יתר.' : '') })); } }
  draw();
};

/* ===================================================== 8.6 */
W.w2_early_stop = function (box) {
  V.say(box, 'עצירה מוקדמת, על עקומת אימות. <b>בחר עקומה והזז את הסבלנות.</b> הנקודה הירוקה — המודל שנשמר; האדומה — איפה האימון נעצר.');
  let pat = 3, which = 0; const COURSE = [1.0, 0.8, 0.65, 0.58, 0.55, 0.56, 0.54, 0.57, 0.59, 0.6, 0.62, 0.63];
  V.tabs(box, ['העקומה של הסעיף', 'תרגיל 8.4: בלי הגדלה (במחשב שלך)', 'תרגיל 8.4: עם הגדלה'], k => { which = k; draw(); }); const sr = row(box); V.slider(sr, 'סבלנות', 1, 8, 1, pat, v => { pat = v; draw(); });
  const cv = canvas(colm(flex(box), 'הפסד האימות בכל סבב'), 600, 220, 600); const code = mono(box); const out = V.say(box);
  function draw() { const L = L8(); let v = COURSE; if (which && (!L || !L.aug_off)) { out.innerHTML = 'הנתונים מההרצה עוד לא נטענו.'; v = COURSE; } else if (which) v = (which === 1 ? L.aug_off : L.aug_on).hist.map(h => h[1]);
    let best = Infinity, bad = 0, bestEp = 0, stop = -1; for (let ep = 0; ep < v.length; ep++) { if (v[ep] < best - 1e-4) { best = v[ep]; bestEp = ep; bad = 0; } else { bad++; if (bad >= pat) { stop = ep; break; } } }
    const lo = Math.min(...v) * 0.95, hi = Math.max(...v) * 1.02, pl = lplot(cv, [{ y: v, color: '#4263eb', lw: 2 }], [+lo.toFixed(2), +hi.toFixed(2)]); const x = cv.getContext('2d');
    x.fillStyle = '#2f9e44'; x.beginPath(); x.arc(pl.X(bestEp), pl.Y(v[bestEp]), 6, 0, 7); x.fill(); if (stop >= 0) { x.fillStyle = '#e03131'; x.beginPath(); x.arc(pl.X(stop), pl.Y(v[stop]), 6, 0, 7); x.fill(); x.fillStyle = 'rgba(0,0,0,.06)'; x.fillRect(pl.X(stop), 8, 600 - pl.X(stop), 196); }
    code.textContent = 'val = [' + v.map(t => +t.toFixed(3)).join(', ') + ']\npatience = ' + pat + '\n' + (stop >= 0 ? 'stop at ' + stop + ' best ' + bestEp + ' ' + +best.toFixed(4) : 'no stop: best ' + bestEp + ' ' + +best.toFixed(4)) + (which === 0 && pat === 3 ? '      # the course: stop at 9 best 6 0.54' : '');
    out.innerHTML = (stop >= 0 ? 'נעצר בסבב ' + stop + ', ' + (v.length - 1 - stop) + ' סבבים לפני הסוף, והמודל שנשמר מסבב ' + bestEp + '. ' : 'לא נעצר — לא היו ' + pat + ' סבבים רצופים בלי שיפור. ') + (which === 0 ? (pat === 1 ? 'עם סבלנות 1 העצירה מוקדמת מדי: בסבב 5 ההפסד עלה מעט — רעש — ובסבב 6 ירד לנקודה הטובה ביותר. ' : '') : '') + 'סבלנות קטנה חוסכת זמן אבל נעצרת על רעש; גדולה — בטוחה, אבל מבזבזת סבבים. הכלל: המודל שנשמר הוא תמיד הטוב ביותר (הירוק), לא האחרון.'; }
  draw();
};

/* ===================================================== chapter 9 */
const PAL10 = ["#4263eb", "#e8590c", "#2f9e44", "#ae3ec9", "#f59f00", "#1098ad", "#e03131", "#495057", "#82c91e", "#d6336c"];
const L9 = () => window.M2LAB9 || null;          /* real runs on the user's computer (content/m2_lab9data.js) */
W.w2_transfer = function (box) {
  V.say(box, 'למידת העברה, במחשב שלך. ResNet-18 שאומנה על ImageNet ירדה מהרשת, ונבדקה על <b>1,000 תמונות בלבד</b> מפריטי הלבוש (100 לכל מחלקה), מוגדלות ל־112 על 112. ארבע דרכים, אותן תמונות, אותה בדיקה (2,000 תמונות אחרות).');
  const top = el('div'); box.appendChild(top); const fx = flex(box); const cF = canvas(colm(fx, '64 המסננים של השכבה הראשונה של ResNet-18 המאומנת (7×7, צבע)'), 8 * 30, 8 * 30, 280); cF.style.imageRendering = 'pixelated';
  const cR = canvas(colm(fx, 'דיוק אימות לאורך האימון'), 340, 240, 340); legend(box, [['#2f9e44', 'מוקפאת, מאומנת + ראש חדש'], ['#4263eb', 'כוונון מלא, שני קצבים'], ['#e8590c', 'SmallCNN מאפס'], ['#868e96', 'מוקפאת, אקראית + ראש חדש', true]]);
  const fp = flex(box); const cP1 = canvas(colm(fp, 'התכונות של הרשת המאומנת (512 מספרים → 2, PCA)'), 280, 240, 280), cP2 = canvas(colm(fp, 'התכונות של אותה רשת, אקראית'), 280, 240, 280);
  box.appendChild(el('div', { class: 'note-small', style: { textAlign: 'center' }, html: FASHION.map((n, c) => '<span style="color:' + PAL10[c] + '">●</span> ' + n).join(' &nbsp; ') }));
  const out = V.say(box);
  box.appendChild(el('div', { class: 'note-small', style: { textAlign: 'center', marginTop: '10px' }, html: '<b>כמה מתאמנים</b> — ResNet-18 עם K מחלקות, לפי כמה שלבים "משחררים" מהסוף:' }));
  let K = 10, unf = 0; const sr = row(box); V.slider(sr, 'מחלקות K', 2, 1000, 1, K, v => { K = v; drawP(); }); V.tabs(box, ['רק הראש', '+ שלב 4', '+ שלבים 3–4', 'הכול'], i => { unf = i; drawP(); }); const tb = el('div'); box.appendChild(tb);
  function scatter(c, P, y) { const x = c.getContext('2d'); x.clearRect(0, 0, 280, 240); P.forEach((p, i) => { x.fillStyle = PAL10[y[i]]; x.globalAlpha = 0.75; x.beginPath(); x.arc(140 + p[0] * 125, 120 - p[1] * 110, 2.4, 0, 7); x.fill(); }); x.globalAlpha = 1; }
  function draw() { const D = L9(); if (!D) { out.innerHTML = 'הנתונים מההרצה עוד לא נטענו.'; return; }
    const x = cF.getContext('2d'), im = x.createImageData(240, 240); for (let f = 0; f < 64; f++) { const ox = (f % 8) * 30 + 1, oy = Math.floor(f / 8) * 30 + 1; for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) { const px = [0, 1, 2].map(ch => D.conv1[((f * 3 + ch) * 7 + i) * 7 + j]); for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) { const k = 4 * ((oy + i * 4 + a) * 240 + ox + j * 4 + b); im.data[k] = px[0]; im.data[k + 1] = px[1]; im.data[k + 2] = px[2]; im.data[k + 3] = 255; } } } x.putImageData(im, 0, 0);
    const up = (h, n) => h.map((v, i) => ({ v, x: (i + 1) / h.length })); const c = cR.getContext('2d'); c.clearRect(0, 0, 340, 240); const X = t => 36 + t * 290, Y = v => 220 - (v - 0.1) / 0.9 * 205;
    [0.2, 0.4, 0.6, 0.8, 1].forEach(v => { c.strokeStyle = '#f1f3f5'; c.beginPath(); c.moveTo(36, Y(v)); c.lineTo(330, Y(v)); c.stroke(); txt(c, (v * 100) + '%', 32, Y(v) + 4, '#868e96', 10, 'right'); }); txt(c, 'תחילת האימון', 36, 236, '#868e96', 10); txt(c, 'סוף', 330, 236, '#868e96', 10, 'right');
    [[D.frozen_pre, '#2f9e44'], [D.finetune, '#4263eb'], [D.scratch, '#e8590c'], [D.frozen_rand, '#868e96', [4, 3]]].forEach(([h, col, da]) => { c.strokeStyle = col; c.lineWidth = 2; if (da) c.setLineDash(da); c.beginPath(); up(h).forEach((p, i) => i ? c.lineTo(X(p.x), Y(p.v)) : c.moveTo(X(p.x), Y(p.v))); c.stroke(); c.setLineDash([]); up(h).forEach(p => { c.fillStyle = col; c.beginPath(); c.arc(X(p.x), Y(p.v), 2.5, 0, 7); c.fill(); }); }); c.lineWidth = 1;
    scatter(cP1, D.pca_pre, D.pca_y); scatter(cP2, D.pca_rand, D.pca_y);
    const L = h => (h[h.length - 1] * 100).toFixed(1) + '%';
    top.innerHTML = table(['שיטה', 'מה מתאמן', 'דיוק אימות בסוף'], [['מוקפאת (ImageNet) + ראש חדש', fmtN(D.trainable) + ' מתוך ' + fmtN(D.total), '<b>' + L(D.frozen_pre) + '</b>'], ['כוונון מלא, 4 סבבים, קצב 1e−4 לגוף ו־1e−3 לראש', 'הכול', '<b>' + L(D.finetune) + '</b>'], ['SmallCNN מאפס, 40 סבבים', '421,642', L(D.scratch)], ['מוקפאת, משקלים <b>אקראיים</b> + ראש חדש', fmtN(D.trainable), L(D.frozen_rand)]]);
    out.innerHTML = 'הגרף האפור הוא הניסוי החשוב: <b>אותה ארכיטקטורה בדיוק</b>, מוקפאת, עם ראש חדש — אבל במשקלים אקראיים: ' + L(D.frozen_rand) + '. עם משקלי ImageNet: ' + L(D.frozen_pre) + '. כל ההבדל הוא מה שהרשת למדה על מיליון תמונות של דברים אחרים לגמרי (חתולים, מכוניות, פטריות) — קצוות, מרקמים, צורות. במסננים משמאל רואים את זה: מסנני קצוות בכל הכיוונים, ומסנני צבע — כמו סובל ממודול 1, אבל נלמדו. ובפיזור: התכונות של הרשת המאומנת מקבצות את המחלקות כבר לפני שהראש למד משהו; של האקראית — ערבוביה. ' +
      'ושימו לב לכתום: SmallCNN מאפס, על אותן 1,000 תמונות, ' + (D.scratch[D.scratch.length - 1] >= D.frozen_pre[D.frozen_pre.length - 1] ? '<b>לא נופלת</b> מהרשת המאומנת (' + L(D.scratch) + '). תמונות אפור של 28 פיקסלים, מוגדלות פי 4, רחוקות מאוד מ־ImageNet — והרשת הקטנה בנויה בדיוק להן. למידת העברה מנצחת בגדול כשהתמונות דומות לתמונות טבעיות, וכשיש עשרות דוגמאות ולא מאות. ' : 'נשארת מאחור (' + L(D.scratch) + '). ') + 'הכוונון המלא (' + L(D.finetune) + ', בשיא ' + (Math.max(...D.finetune) * 100).toFixed(1) + '%) ' + (D.finetune[D.finetune.length - 1] > D.frozen_pre[D.frozen_pre.length - 1] ? 'מוסיף על ההקפאה, כי התחום רחוק וגם השכבות העמוקות מרוויחות מהתאמה — אבל עם 1,000 תמונות הוא כבר מתחיל להתאים יתר אחרי 3 סבבים' : 'לא מוסיף הרבה על 1,000 תמונות') + ' — במחיר של ' + Math.round(D.finetune_sec / 60) + ' דקות על המעבד שלך, מול ' + Math.round(D.feat_sec) + ' שניות לחילוץ התכונות פעם אחת. ' + (D.trainable === 5130 && D.total === 11181642 ? 'והמספרים של הקוד בסעיף — 5,130 מתוך 11,181,642 — יצאו בדיוק.' : ''); }
  function drawP() { const S = resnetSpec(18, 224).rows, head = 512 * K + K, body = S.slice(0, 5).reduce((a, r) => a + r.P, 0), tr = head + (unf >= 1 ? S[4].P : 0) + (unf >= 2 ? S[3].P : 0) + (unf >= 3 ? S[0].P + S[1].P + S[2].P : 0), tot = body + head;
    tb.innerHTML = table(['מתאמנים', 'מתוך', 'אחוז', 'מתי'], [[fmtN(tr), fmtN(tot), (tr / tot * 100).toFixed(2) + '%', ['עשרות תמונות למחלקה — חילוץ תכונות', 'מאות לכל מחלקה — השלב השני של כוונון בשני שלבים', 'אלפים, או תחום רחוק יותר', 'הרבה נתונים, או תחום שונה מאוד (תרמי, מכ"ם, רנטגן)'][unf]]]) + (K === 37 && unf === 0 ? '<div class="note-small" style="text-align:center">' + ltr('512·37 + 37 = 18,981') + ' — תרגיל 9.1.</div>' : ''); }
  draw(); drawP();
};

/* ===================================================== 9.2 */
/* round a number to the nearest float16 / bfloat16 value (round to nearest even), like np.float16(x) */
function toLowp(x, kind) { if (!isFinite(x) || x === 0) return x; const mbits = kind === 'bf16' ? 7 : 10, emin = kind === 'bf16' ? -126 : -14, max = kind === 'bf16' ? 3.3895313892515355e38 : 65504; const a = Math.abs(x); let e = Math.floor(Math.log2(a)); if (Math.pow(2, e) > a) e--; if (Math.pow(2, e + 1) <= a) e++;
  const sp = Math.pow(2, Math.max(e, emin) - mbits); let q = a / sp, r = Math.round(q); if (Math.abs(q - Math.trunc(q) - 0.5) < 1e-12) r = Math.trunc(q) % 2 === 0 ? Math.trunc(q) : Math.trunc(q) + 1; const v = r * sp; if (v > max) return x > 0 ? Infinity : -Infinity; return x > 0 ? v : -v; }
const f32 = x => Math.fround(x);
W.w2_fp16 = function (box) {
  const tabs = el('div'); box.appendChild(tabs); const A = el('div'), B = el('div'), Cc = el('div'); [A, B, Cc].forEach(d => box.appendChild(d)); B.style.display = Cc.style.display = 'none';
  V.tabs(tabs, ['מספר אחד, שלושה פורמטים', 'צבירה (תרגיל 9.2)', 'גרדיאנטים וקנה מידה'], k => { [A, B, Cc].forEach((d, i) => d.style.display = i === k ? '' : 'none'); [drawA, drawB, drawC][k](); });
  /* A */
  V.say(A, 'בחר מספר (סקאלה לוגריתמית) — ואיך הוא נשמר בכל פורמט. החישוב מדמה בדיוק את העיגול של ' + ltr('np.float16') + ' ושל bfloat16.');
  let lg = 0, base = 1.2345678; const sa = row(A); V.slider(sa, ltr('10^'), -12, 6, 0.1, lg, v => { lg = v; drawA(); }, v => F(v, 1)); const tA = el('div'); A.appendChild(tA); const outA = V.say(A);
  function drawA() { const x = base * Math.pow(10, lg), r = [['float32 (4 בתים)', f32(x)], ['float16 (2 בתים)', toLowp(x, 'f16')], ['bfloat16 (2 בתים)', toLowp(x, 'bf16')]];
    tA.innerHTML = table(['פורמט', 'הערך שנשמר', 'שגיאה יחסית', 'המרווח למספר הבא'], r.map(([n, v]) => { const sp = n[0] === 'f' && n[5] === '3' ? Math.pow(2, Math.floor(Math.log2(Math.abs(x))) - 23) : n[0] === 'f' ? Math.pow(2, Math.max(Math.floor(Math.log2(Math.abs(x))), -14) - 10) : Math.pow(2, Math.floor(Math.log2(Math.abs(x))) - 7); return [n, isFinite(v) ? ltr(v === 0 ? '0' : v.toPrecision(8)) : '<b style="color:#c92a2a">inf</b>', isFinite(v) ? (v === 0 ? '<b style="color:#c92a2a">100% (אפס!)</b>' : E(Math.abs(v - x) / x, 1)) : '—', ltr(E(sp, 2))]; }));
    const h = toLowp(x, 'f16'); outA.innerHTML = 'המספר: ' + ltr(x.toPrecision(8)) + '. ' + (!isFinite(h) ? '<b>גלישה מלמעלה</b> ב־float16: מעל 65,504 הכול אינסוף, ואחרי פעולה אחת — nan שמתפשט לכל הרשת. bfloat16 מחזיק אותו בלי בעיה — יש לו את הטווח של float32. ' : h === 0 ? '<b>גלישה מלמטה</b> ב־float16: קטן מ־' + ltr('6e−8') + ' הופך לאפס. זה בדיוק מה שקורה לגרדיאנט של ' + ltr('2e−8') + ' בקוד של הסעיף. ' : '') + 'שים לב לשגיאה היחסית: float16 שומר כ־3 ספרות, bfloat16 רק 2–3 — אבל בטווח ענק. זו העסקה: float16 = דיוק טוב יותר, טווח קטן; bfloat16 = טווח של float32, דיוק גרוע יותר.'; }
  /* B */
  V.say(B, 'הלולאה של הסעיף: מוסיפים שוב ושוב את אותה תוספת לסכום שנשמר בחצי דיוק. <b>בחר תוספת</b> — 0.01 בסעיף, 0.1 בתרגיל 9.2.');
  let inc = 0.01; V.tabs(B, ['0.01', '0.1', '1'], i => { inc = [0.01, 0.1, 1][i]; drawB(); }); const cB = canvas(colm(flex(B), 'הסכום אחרי כל צעד (10,000 צעדים)'), 600, 220, 600); legend(B, [['#212529', 'מדויק'], ['#e8590c', 'float16'], ['#7048e8', 'bfloat16']]); const outB = V.say(B);
  function drawB() { const N = 10000, ex = [], h = [], b = []; let sh = 0, sb = 0; const ih = toLowp(inc, 'f16'), ib = toLowp(inc, 'bf16'); for (let i = 0; i < N; i++) { sh = toLowp(sh + ih, 'f16'); sb = toLowp(sb + ib, 'bf16'); if (i % 50 === 0) { ex.push((i + 1) * inc); h.push(sh); b.push(sb); } }
    lplot(cB, [{ y: ex, color: '#212529', dash: [4, 3] }, { y: h, color: '#e8590c', lw: 2.5 }, { y: b, color: '#7048e8', lw: 2 }], [0, N * inc * 1.05]);
    outB.innerHTML = 'במקום ' + fmtN(N * inc) + ': float16 נתקע ב־<b>' + sh + '</b>, ו־bfloat16 ב־<b>' + sb + '</b>. ' + (inc === 0.01 ? 'בדיוק ה־32 של הקורס. ' : inc === 0.1 ? 'בדיוק ה־256 של תרגיל 9.2. ' : '') + 'למה: הסכום נתקע כשהמרווח בין שני מספרים סמוכים גדול מפי 2 מהתוספת — אז הוספתה מעוגלת חזרה לאותו מספר. ב־float16 זה קורה כשהסכום בערך פי 2,000 מהתוספת; ב־bfloat16, עם פחות ביטים לדיוק, כבר פי כמה מאות (0.01 נתקע ב־4). לכן בדיוק מעורב <b>כל</b> סכום — ממוצע ההפסד, מצבי Adam, המשקלים הראשיים — נשמר ב־float32.'; }
  /* C */
  V.say(Cc, '10,000 גרדיאנטים טיפוסיים של רשת — רובם קטנים מאוד (מפוזרים בין ' + ltr('1e−10') + ' ל־' + ltr('1e−2') + '). הפס הכחול: מה ש־float16 מסוגל לייצג. <b>הזז את מקדם ההכפלה</b> — זה מה ש־GradScaler עושה לפני ההמרה.');
  let k2 = 0; const sc = row(Cc); V.slider(sc, 'הכפלה ב־' + ltr('2^'), 0, 30, 1, k2, v => { k2 = v; drawC(); }); const cC = canvas(colm(flex(Cc), 'התפלגות הגרדיאנטים (סקאלה לוגריתמית)'), 600, 200, 600); const outC = V.say(Cc);
  const G = (() => { const r = NN.rng(42), a = []; for (let i = 0; i < 10000; i++) a.push(Math.pow(10, -6 + 1.6 * NN.randn(r))); return a; })();
  function drawC() { const s = Math.pow(2, k2), x = cC.getContext('2d'); x.clearRect(0, 0, 600, 200); const X = e => 20 + (e + 14) / 22 * 570; const bins = new Array(88).fill(0); let zero = 0, inf = 0, sub = 0;
    G.forEach(g => { const v = g * s, h = toLowp(v, 'f16'); if (h === 0) zero++; else if (!isFinite(h)) inf++; else if (v < 6.1e-5) sub++; const e = Math.log10(v); const bi = Math.floor((e + 14) * 4); if (bi >= 0 && bi < 88) bins[bi]++; });
    x.fillStyle = 'rgba(66,99,235,.12)'; x.fillRect(X(Math.log10(5.96e-8)), 10, X(Math.log10(65504)) - X(Math.log10(5.96e-8)), 160); x.fillStyle = 'rgba(66,99,235,.07)'; x.fillRect(X(Math.log10(5.96e-8)), 10, X(Math.log10(6.1e-5)) - X(Math.log10(5.96e-8)), 160);
    const mx = Math.max(...bins); bins.forEach((b, i) => { const e = i / 4 - 14, v = Math.pow(10, e); x.fillStyle = v < 5.96e-8 ? '#e03131' : v > 65504 ? '#e03131' : '#495057'; x.fillRect(X(e), 170 - b / mx * 150, 570 / 88 - 1, b / mx * 150); });
    for (let e = -14; e <= 8; e += 2) txt(x, '1e' + e, X(e), 188, '#868e96', 9, 'center'); txt(x, 'float16', X(Math.log10(65504)) - 4, 22, '#4263eb', 10, 'right');
    outC.innerHTML = 'פי ' + ltr('2^' + k2 + ' = ' + fmtN(s)) + ': <b>' + (zero / 100).toFixed(1) + '%</b> מהגרדיאנטים הופכים לאפס (אדום משמאל)' + (inf ? ', ו־<b>' + (inf / 100).toFixed(1) + '%</b> לאינסוף (אדום מימין)' : '') + (sub ? '; עוד ' + (sub / 100).toFixed(0) + '% בתחום ה"תת־נורמלי" (כחול בהיר), עם דיוק מופחת' : '') + '. ' + (k2 === 0 ? 'בלי הכפלה, חלק גדול מהגרדיאנטים פשוט נעלם — והשכבות שלהם לא לומדות. ' : k2 >= 25 ? 'הכפלה גדולה מדי: הגדולים גולשים לאינסוף. GradScaler מזהה את זה, מדלג על הצעד ומקטין את המקדם (' + ltr('scaler.update()') + '). ' : 'ההכפלה מזיזה את כל ההתפלגות ימינה, לתוך הטווח. אחרי ההמרה מחלקים חזרה ב־float32 — ומקבלים את הגרדיאנטים המקוריים (2e−8 → 0.00131 → 2e−8, כמו בקוד). ') + 'ב־bfloat16 כל זה מיותר: הטווח שלו כמו של float32.'; }
  const real = el('div'); box.appendChild(real); const D = L9(); if (D && D.amp) { const a = D.amp; real.innerHTML = '<div class="note-small" style="text-align:center;margin-top:10px"><b>ועל המעבד שלך</b> — "על מעבד לא תראה שיפור", אומר הסעיף. נמדד:</div>' + table(['', 'float32', 'bfloat16', 'יחס'], [['כפל מטריצות 1024×1024', F(a.mm32 * 1000, 1) + ' ms', F(a.mm_bf16 * 1000, 1) + ' ms', '×' + F(a.mm32 / a.mm_bf16, 2)], ['צעד אימון של רשת קונבולוציה קטנה', F(a.step32 * 1000, 0) + ' ms', F(a.step_bf16 * 1000, 0) + ' ms', '×' + F(a.step32 / a.step_bf16, 2)]]) + '<div class="say">יחס מתחת ל־1 = bfloat16 <b>איטי</b> יותר. מעבדים רגילים לא בנויים לחצי דיוק — ההמרות הלוך וחזור עולות יותר מהחיסכון. בתוך ' + ltr('autocast') + ', הפלט של הרשת יצא ' + ltr(a.dtype_out) + ' וההפסד ' + ltr(a.dtype_loss) + ' — הכפלים בחצי דיוק, ההפסד במלא, והמשקלים נשארו ' + ltr(a.param_dtype) + ' — בדיוק כמו בתיאור של הסעיף.</div>'; }
  drawA();
};

/* ===================================================== chapter 10 */
const L10 = () => window.M2LAB10 || null;
/* SHA-1 (as hashlib.sha1 over UTF-8), small and synchronous */
function sha1hex(str) { const b = new TextEncoder().encode(str), ml = b.length * 8, n = ((b.length + 9 + 63) >> 6) << 6, m = new Uint8Array(n); m.set(b); m[b.length] = 0x80; const dv = new DataView(m.buffer); dv.setUint32(n - 4, ml >>> 0); dv.setUint32(n - 8, Math.floor(ml / 2 ** 32));
  let h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476, h4 = 0xC3D2E1F0; const w = new Uint32Array(80), rl = (x, c) => (x << c) | (x >>> (32 - c));
  for (let o = 0; o < n; o += 64) { for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + 4 * i); for (let i = 16; i < 80; i++) w[i] = rl(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1); let a = h0, bb = h1, c = h2, d = h3, e = h4;
    for (let i = 0; i < 80; i++) { const f = i < 20 ? (bb & c) | (~bb & d) : i < 40 ? bb ^ c ^ d : i < 60 ? (bb & c) | (bb & d) | (c & d) : bb ^ c ^ d, k = i < 20 ? 0x5A827999 : i < 40 ? 0x6ED9EBA1 : i < 60 ? 0x8F1BBCDC : 0xCA62C1D6; const t = (rl(a, 5) + f + e + k + w[i]) >>> 0; e = d; d = c; c = rl(bb, 30) >>> 0; bb = a; a = t; }
    h0 = (h0 + a) >>> 0; h1 = (h1 + bb) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0; }
  return [h0, h1, h2, h3, h4].map(v => v.toString(16).padStart(8, '0')).join(''); }
/* json.dumps(cfg, sort_keys=True) as Python writes it: floats like repr(), ints, bools, strings */
function pyFloat(v) { if (Number.isInteger(v)) return v.toFixed(1); const a = Math.abs(v); if (a >= 1e-4 && a < 1e16) return String(v); let s = v.toExponential(); let [m, e] = s.split('e'); const sign = e[0] === '-' ? '-' : '+'; e = e.replace(/^[+-]/, '').padStart(2, '0'); return m + 'e' + sign + e; }
function pyDumps(cfg, types) { return '{' + Object.keys(cfg).sort().map(k => { const v = cfg[k], t = types[k]; const s = t === 'float' ? pyFloat(v) : t === 'int' ? String(Math.round(v)) : t === 'bool' ? (v ? 'true' : 'false') : JSON.stringify(v); return JSON.stringify(k) + ': ' + s; }).join(', ') + '}'; }

W.w2_seeds = function (box) {
  const tabs = el('div'); box.appendChild(tabs); const A = el('div'), B = el('div'); box.appendChild(A); box.appendChild(B); B.style.display = 'none';
  V.tabs(tabs, ['כמה ריצות שונות זו מזו', 'הסדר של החיבור'], k => { A.style.display = k ? 'none' : ''; B.style.display = k ? '' : 'none'; k ? drawB() : drawA(); });
  V.say(A, 'עשר ריצות אמיתיות <b>במחשב שלך</b>: הרשת המלאה של סעיף 3.6, 3 סבבים, בשני קצבי למידה — ובכל קצב חמישה גרעינים. הגרעין משנה רק את האתחול ואת סדר המנות. כל נקודה היא ריצה אחת.');
  let nS = 5; const sr = row(A); V.slider(sr, 'כמה גרעינים בכל צד', 1, 5, 1, nS, v => { nS = v; drawA(); }); const cv = canvas(colm(flex(A), 'דיוק אימות אחרי 3 סבבים'), 560, 170, 560); const out = V.say(A);
  function drawA() { const D = L10(); if (!D) { out.innerHTML = 'הנתונים מההרצה עוד לא נטענו.'; return; } const a = [0, 1, 2, 3, 4].map(s => D['0.001_' + s].hist[2]), b = [0, 1, 2, 3, 4].map(s => D['0.002_' + s].hist[2]); const all = a.concat(b), lo = Math.min(...all) - 0.002, hi = Math.max(...all) + 0.002, X = v => 30 + (v - lo) / (hi - lo) * 500;
    const x = cv.getContext('2d'); x.clearRect(0, 0, 560, 170); [[a, '#4263eb', 50, 'lr = 1e−3'], [b, '#e8590c', 115, 'lr = 2e−3']].forEach(([arr, col, y, t]) => { const u = arr.slice(0, nS), m = u.reduce((p, q) => p + q, 0) / nS, sd = nS > 1 ? Math.sqrt(u.reduce((p, q) => p + (q - m) ** 2, 0) / (nS - 1)) : 0;
      x.fillStyle = col + '33'; x.fillRect(X(m - sd), y - 16, Math.max(2, X(m + sd) - X(m - sd)), 32); arr.forEach((v, i) => { x.globalAlpha = i < nS ? 1 : 0.18; x.fillStyle = col; x.beginPath(); x.arc(X(v), y + (i - 2) * 4, 6, 0, 7); x.fill(); }); x.globalAlpha = 1; x.strokeStyle = col; x.lineWidth = 2; x.beginPath(); x.moveTo(X(m), y - 20); x.lineTo(X(m), y + 20); x.stroke(); x.lineWidth = 1; txt(x, t, 548, y + 4, col, 11, 'right'); });
    for (let v = Math.ceil(lo * 1000) / 1000; v <= hi; v += 0.002) txt(x, (v * 100).toFixed(1) + '%', X(v), 165, '#868e96', 10, 'center');
    const st = arr => { const u = arr.slice(0, nS), m = u.reduce((p, q) => p + q, 0) / nS; return [m, nS > 1 ? Math.sqrt(u.reduce((p, q) => p + (q - m) ** 2, 0) / (nS - 1)) : NaN]; }; const [ma, sa] = st(a), [mb, sb] = st(b);
    let wins = 0; a.forEach(p => b.forEach(q => { if (q < p) wins++; }));
    const rep = D['repeat_1e-3_0'], same = rep && rep.hash === D['0.001_0'].hash;
    out.innerHTML = 'lr = 1e−3: <b>' + (ma * 100).toFixed(2) + '%</b>' + (nS > 1 ? ' ± ' + (sa * 100).toFixed(2) : '') + '; lr = 2e−3: <b>' + (mb * 100).toFixed(2) + '%</b>' + (nS > 1 ? ' ± ' + (sb * 100).toFixed(2) : '') + '. ההפרש בין הממוצעים: ' + (Math.abs(mb - ma) * 100).toFixed(2) + ' נקודות' + (nS > 1 ? ', וסטיית התקן בתוך כל קבוצה כ־' + ((sa + sb) / 2 * 100).toFixed(2) + '. ' : '. ') +
      'אם היית מריץ <b>ריצה אחת</b> מכל צד, ב־' + wins + ' מתוך 25 הצירופים האפשריים 2e−3 "היה מנצח". ' + (nS === 1 ? 'עם גרעין אחד אין לך שום מושג על הפיזור — הזז ל־3 ול־5.' : 'ככה נראית ההחלטה האמיתית: ממוצע ± סטיית תקן, ולא מספר בודד. ') +
      (rep ? ' ובונוס: אותה ריצה (lr 1e−3, גרעין 0) הורצה פעמיים על המעבד, וטביעת האצבע של כל המשקלים בסוף ' + (same ? '<b>זהה</b> (' + ltr(rep.hash) + ') — על מעבד, עם אותו גרעין, הכול דטרמיניסטי. על כרטיס זה לא מובטח (שאלת הראיון).' : 'שונה.') : ''); }
  V.say(B, 'הקוד של הסעיף: מיליון מספרים ב־float32, מחוברים בשלושה סדרים. כאן — אותו ניסוי בדפדפן, עם עיגול ל־float32 אחרי כל חיבור (' + ltr('Math.fround') + '), ועם סדר רביעי: חיבור בזוגות (עץ), כמו שכרטיס מחבר במקביל.');
  const tB = el('div'); B.appendChild(tB); const outB = V.say(B);
  function drawB() { const r = NN.rng(1), N = 1000000, x = new Float32Array(N); for (let i = 0; i < N; i++) x[i] = NN.randn(r); const seq = a => { let s = 0; for (let i = 0; i < a.length; i++) s = Math.fround(s + a[i]); return s; }; const tree = a => { let c = Float32Array.from(a); while (c.length > 1) { const h = Math.ceil(c.length / 2), d = new Float32Array(h); for (let i = 0; i < h; i++) d[i] = i * 2 + 1 < c.length ? Math.fround(c[2 * i] + c[2 * i + 1]) : c[2 * i]; c = d; } return c[0]; };
    let exact = 0; for (let i = 0; i < N; i++) exact += x[i]; const rev = x.slice().reverse(), srt = x.slice().sort(); const rows = [['קדימה', seq(x)], ['אחורה', seq(rev)], ['ממוין', seq(srt)], ['בזוגות (כמו כרטיס)', tree(x)], ['מדויק (double)', exact]];
    tB.innerHTML = table(['סדר', 'הסכום', 'הפרש מהמדויק'], rows.map(([n, v]) => [n, ltr(v.toFixed(5)), ltr((v - exact).toExponential(1))]));
    outB.innerHTML = 'אותם מיליון מספרים, ארבעה סכומים שונים. המספרים כאן לא זהים לקורס (מחולל אחר), אבל התופעה זהה: כל חיבור ב־float32 מעגל, והעיגול תלוי במה שכבר נצבר. הסדר הממוין הגרוע מכולם: בסוף מחברים מספרים גדולים לסכום גדול, אחרי שהקטנים כבר "נבלעו" — הצבירה של סעיף 9.2 בקטן. ושימו לב לחיבור בזוגות: הוא הכי מדויק — אבל גם הוא תלוי בסדר שבו הזוגות נוצרים, וזה מה שמשתנה בין הרצות על כרטיס.'; }
  drawA();
};

W.w2_run_hash = function (box) {
  V.say(box, '<code class="ltr">run_hash</code> של הסעיף, בדפדפן — SHA-1 על <code class="ltr">json.dumps(cfg, sort_keys=True)</code> בדיוק כמו פייתון. <b>שנה הגדרות</b>, ושנה את <b>סדר המפתחות</b>: הטביעה משתנה רק כשערך משתנה.');
  const cfg = { lr: 0.001, batch_size: 64, seed: 0 }, types = { lr: 'float', batch_size: 'int', seed: 'int', epochs: 'int', augment: 'bool', model: 'str' }; let order = ['lr', 'batch_size', 'seed'], extra = false;
  const sr = row(box); const lrs = [0.0001, 0.0003, 0.001, 0.003, 0.01]; V.tabs(box, lrs.map(v => 'lr = ' + pyFloat(v)), i => { cfg.lr = lrs[i]; draw(); }, 2); V.slider(sr, 'batch_size', 16, 256, 16, 64, v => { cfg.batch_size = v; draw(); }); V.slider(sr, 'seed', 0, 9, 1, 0, v => { cfg.seed = v; draw(); });
  V.btns(box, [['ערבב את סדר המפתחות', () => { order = shuffled(order, NN.rng(Date.now() % 997)); draw(); }, 'ghost'], ['+ עוד הגדרות (epochs, augment, model)', () => { extra = !extra; if (extra) { cfg.epochs = 30; cfg.augment = true; cfg.model = 'resnet18'; order = order.concat(['epochs', 'augment', 'model']); } else { ['epochs', 'augment', 'model'].forEach(k => delete cfg[k]); order = order.filter(k => cfg[k] !== undefined); } draw(); }, 'ghost']]);
  const code = mono(box); const tree = mono(box); const out = V.say(box);
  function draw() { const ord = {}; order.forEach(k => { if (cfg[k] !== undefined) ord[k] = cfg[k]; }); const dumped = pyDumps(cfg, types), h = sha1hex(dumped).slice(0, 8);
    code.textContent = 'cfg = {' + Object.keys(ord).map(k => '"' + k + '": ' + (types[k] === 'float' ? pyFloat(ord[k]) : types[k] === 'bool' ? (ord[k] ? 'True' : 'False') : types[k] === 'str' ? '"' + ord[k] + '"' : ord[k])).join(', ') + '}\njson.dumps(cfg, sort_keys=True)  ->  ' + dumped + '\nrun_hash(cfg)                    ->  ' + h;
    tree.textContent = 'runs/\n└── 20261116-142530_' + h + '/\n    ├── config.json      ' + dumped.slice(0, 40) + (dumped.length > 40 ? '…' : '') + '\n    ├── metrics.csv      epoch,train_loss,val_loss,val_acc\n    ├── best.pt          (פרק 12)\n    └── env.json         (תרגיל 10.1)';
    out.innerHTML = (cfg.lr === 0.001 && cfg.batch_size === 64 && cfg.seed === 0 && !extra ? '<b>f927522c</b> — בדיוק מה שהקוד של הסעיף הדפיס. ' : cfg.lr === 0.0003 && cfg.batch_size === 64 && cfg.seed === 0 && !extra ? '<b>d93e72a4</b> — השורה השלישית בקוד של הסעיף. ' : '') + 'בגלל <code class="ltr">sort_keys=True</code>, הסדר שבו כתבת את המילון לא משנה — המחרוזת זהה, והטביעה זהה. שינוי של ערך אחד, אפילו הגרעין, נותן טביעה אחרת לגמרי. כך שתי ריצות עם אותן הגדרות מקבלות אותה סיומת (ואפשר לזהות כפילות), ותיקייה בלי config.json היא ריצה שאי אפשר לשחזר.'; }
  draw();
};

W.w2_one_change = function (box) {
  const tabs = el('div'); box.appendChild(tabs); const A = el('div'), B = el('div'); box.appendChild(A); box.appendChild(B); B.style.display = 'none';
  V.tabs(tabs, ['כלל 3: לבחור לפי סט הבדיקה', 'כלל 2: שני שינויים ביחד'], k => { A.style.display = k ? 'none' : ''; B.style.display = k ? '' : 'none'; k ? drawB() : drawA(); });
  V.say(A, 'נניח שניסית N הגדרות, ו<b>כולן טובות בדיוק באותה מידה</b>: 90% אמיתי. סט בדיקה של n תמונות נותן לכל אחת ציון רועש סביב 90%. אם בוחרים את הטובה לפי סט הבדיקה ומדווחים את הציון שלה — כמה תדווח? (סימולציה, 2,000 חזרות.)');
  let N = 20, n = 1000; const sr = row(A); V.slider(sr, 'כמה הגדרות ניסית (N)', 1, 200, 1, N, v => { N = v; drawA(); }); V.slider(sr, 'תמונות בבדיקה (n)', 100, 10000, 100, n, v => { n = v; drawA(); }); const cv = canvas(colm(flex(A), 'הציון המדווח של "המנצחת", ב־2,000 חזרות של כל הניסוי'), 560, 170, 560); const outA = V.say(A);
  function drawA() { const r = NN.rng(N * 7 + n), sd = Math.sqrt(0.9 * 0.1 / n), rep = []; for (let t = 0; t < 2000; t++) { let m = -1; for (let k = 0; k < N; k++) m = Math.max(m, 0.9 + sd * NN.randn(r)); rep.push(m); }
    const mean = rep.reduce((a, b) => a + b, 0) / rep.length, bins = new Array(60).fill(0), lo = 0.86, hi = 0.96; rep.forEach(v => { const b = Math.floor((v - lo) / (hi - lo) * 60); if (b >= 0 && b < 60) bins[b]++; }); const x = cv.getContext('2d'); x.clearRect(0, 0, 560, 170); const mx = Math.max(...bins);
    bins.forEach((b, i) => { x.fillStyle = '#4263eb'; x.fillRect(20 + i * 8.6, 140 - b / mx * 120, 7.6, b / mx * 120); }); const X = v => 20 + (v - lo) / (hi - lo) * 516; x.strokeStyle = '#2f9e44'; x.lineWidth = 2; x.beginPath(); x.moveTo(X(0.9), 10); x.lineTo(X(0.9), 140); x.stroke(); x.strokeStyle = '#e8590c'; x.beginPath(); x.moveTo(X(mean), 10); x.lineTo(X(mean), 140); x.stroke(); x.lineWidth = 1;
    for (let v = 0.86; v <= 0.961; v += 0.02) txt(x, (v * 100).toFixed(0) + '%', X(v), 158, '#868e96', 10, 'center'); txt(x, 'האמת', X(0.9) - 4, 20, '#2f9e44', 10, 'right'); txt(x, 'מה שמדווחים', X(mean) + 4, 34, '#e8590c', 10);
    outA.innerHTML = 'בממוצע תדווח <b>' + (mean * 100).toFixed(2) + '%</b> — ' + ((mean - 0.9) * 100).toFixed(2) + ' נקודות מעל האמת, על הגדרה שאינה טובה מאף אחת אחרת. ' + (N === 1 ? 'עם הגדרה אחת אין הטיה — הציון רועש, אבל לא אופטימי. ' : 'וזה רק מהרעש של ' + n + ' תמונות. ') + 'זו הסיבה שבוחרים על סט האימות, ובסט הבדיקה נוגעים פעם אחת: ברגע שבחרת משהו לפיו, הוא כבר לא בדיקה — הוא עוד סט אימות, והמספר עליו אופטימי.'; }
  V.say(B, 'קו בסיס: 88.0%. ניסית ביחד <b>שני שינויים</b> — הגדלת נתונים חדשה, וקצב למידה גבוה יותר — וקיבלת שיפור. האם שניהם עזרו? <b>הזז את ההשפעות האמיתיות</b> (שבמציאות אינך יודע) וראה מה הניסוי המשולב מראה, ומה שני ניסויים נפרדים היו מראים.');
  let eA = 0.8, eB = -0.4; const sb = row(B); V.slider(sb, 'השפעת ההגדלה (נק׳)', -1, 2, 0.1, eA, v => { eA = v; drawB(); }, v => F(v, 1)); V.slider(sb, 'השפעת הקצב (נק׳)', -1, 2, 0.1, eB, v => { eB = v; drawB(); }, v => F(v, 1)); const tb = el('div'); B.appendChild(tb); const outB = V.say(B);
  function drawB() { const base = 88.0; tb.innerHTML = table(['ניסוי', 'דיוק', 'מה לומדים'], [['קו בסיס', F(base, 1) + '%', '—'], ['שני השינויים ביחד', '<b>' + F(base + eA + eB, 1) + '%</b>', (eA + eB > 0 ? 'שיפור — אבל של מי?' : 'הרעה — לזרוק את שניהם?')], ['רק הגדלה', F(base + eA, 1) + '%', eA > 0 ? badge(true, 'עוזרת') : badge(false, 'מזיקה')], ['רק קצב', F(base + eB, 1) + '%', eB > 0 ? badge(true, 'עוזר') : badge(false, 'מזיק')]]);
    outB.innerHTML = (eA + eB > 0 && (eA < 0 || eB < 0) ? 'הניסוי המשולב נראה כמו הצלחה, אבל אחד השינויים <b>מזיק</b> — והוא ייכנס למודל הסופי כי "עבד". ' : eA + eB <= 0 && (eA > 0 || eB > 0) ? 'הניסוי המשולב נראה ככישלון — ותזרוק שינוי <b>טוב</b> יחד עם הרע. ' : 'כאן במקרה שני השינויים באותו כיוון — אבל לא יכולת לדעת את זה מהניסוי המשולב. ') + 'עם שני ניסויים נפרדים, כל שינוי נמדד לבד. (ובמציאות יש גם אינטראקציות — הגדלה חזקה לפעמים צריכה קצב אחר. אז קודם אחד, אחר כך השני על גבי הראשון.) וכמובן — כל אחד מהם עם כמה גרעינים, כמו בסעיף 10.1.'; }
  drawA();
};

/* ===================================================== chapter 11 */
/* the network of chapter 1 with switches for the bugs of the chapter. Y = labels (may be shuffled), idx = which points */
function lgBug(p, idx, Y, o) { const H = p.H, g = { W1: new Float64Array(2 * H), b1: new Float64Array(H), W2: new Float64Array(H * 3), b2: new Float64Array(3) }; let loss = 0, acc = 0; const n = idx.length, sc = o.scaleX || 1;
  for (const i of idx) { const x = [XS[i][0] * sc, XS[i][1] * sc], y = Y[i], f = fwd(p, x); let pr = f.pr, ds;
    if (o.double) { const m = Math.max(...pr), e = pr.map(v => Math.exp(v - m)), S = e[0] + e[1] + e[2], q = e.map(v => v / S); loss -= Math.log(q[y]); const dq = q.map((v, c) => v - (c === y ? 1 : 0)), dot = pr.reduce((a, v, c) => a + v * dq[c], 0); ds = pr.map((v, c) => v * (dq[c] - dot) / n); if (q[y] >= Math.max(...q)) acc++; }
    else { loss -= Math.log(Math.max(pr[y], 1e-300)); if (pr[y] >= Math.max(...pr)) acc++; ds = pr.map((v, c) => (v - (c === y ? 1 : 0)) / n); }
    for (let c = 0; c < 3; c++) { g.b2[c] += ds[c]; for (let j = 0; j < H; j++) g.W2[j * 3 + c] += f.h[j] * ds[c]; }
    for (let j = 0; j < H; j++) { let dh = 0; for (let c = 0; c < 3; c++) dh += ds[c] * p.W2[j * 3 + c]; const dz = f.z[j] > 0 ? dh : 0; g.b1[j] += dz; g.W1[j] += x[0] * dz; g.W1[H + j] += x[1] * dz; } }
  return { loss: loss / n, acc: acc / n, g }; }
const SHUF = (() => { const r = NN.rng(5), y = YS.slice(); for (let i = y.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [y[i], y[j]] = [y[j], y[i]]; } return y; })();
const IDX16 = (() => { const r = NN.rng(6), a = [...Array(N).keys()]; for (let i = N - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, 16); })();
const ALL = [...Array(N).keys()];
const BUGS = [['ok', 'בלי באג'], ['sign', 'סימן הפוך בצעד (+=)'], ['nozero', 'שכחת zero_grad'], ['double', 'סופטמקס לפני ההפסד'], ['dead', 'נוירונים מתים (b1 = −5)'], ['frozen', 'השכבה הראשונה קפואה'], ['shuffle', 'תוויות מעורבבות'], ['pixels', 'קלט לא מנורמל (×255)'], ['lowlr', 'קצב קטן פי 1,000']];
function runBug(bug, idx, steps, lr, every) { const p = mlp(64, { seed: 0 }); if (bug === 'dead') p.b1.fill(-5); const Y = bug === 'shuffle' ? SHUF : YS, o = { double: bug === 'double', scaleX: bug === 'pixels' ? 255 : 1 }, acc = { W1: new Float64Array(p.W1.length), b1: new Float64Array(p.H), W2: new Float64Array(p.W2.length), b2: new Float64Array(3) }; const hist = [], gn = [];
  const eff = bug === 'lowlr' ? lr / 1000 : lr;
  for (let s = 0; s <= steps; s++) { const r = lgBug(p, idx, Y, o); if (s % every === 0) { hist.push(r.loss); gn.push(['W1', 'b1', 'W2', 'b2'].map(k => Math.sqrt(r.g[k].reduce((a, v) => a + v * v, 0)))); } if (!isFinite(r.loss)) { while (hist.length < steps / every + 1) hist.push(NaN); break; }
    ['W1', 'b1', 'W2', 'b2'].forEach(k => { if (bug === 'frozen' && (k === 'W1' || k === 'b1')) return; for (let i = 0; i < p[k].length; i++) { let gv = r.g[k][i]; if (bug === 'nozero') { acc[k][i] += gv; gv = acc[k][i]; } p[k][i] += (bug === 'sign' ? 1 : -1) * eff * gv; } }); }
  const fin = lgBug(p, idx, Y, o); return { hist, gn, loss: fin.loss, acc: fin.acc, p }; }
const lossTxt = v => isFinite(v) ? F(v, v < 0.01 ? 4 : 3) : '<b style="color:#c92a2a">inf / nan</b>';

W.w2_initial_loss = function (box) {
  V.say(box, 'הרשת של פרק 1, לפני צעד אחד. <b>הזז את קנה המידה של W2</b> (1 = האתחול התקין של הקורס) ובדוק את <b>הקלט</b>: ההפסד הראשון צריך להיות קרוב ל־' + ltr('ln 3 = 1.099') + '. מתחת: ההסתברות שהרשת נותנת למחלקה הנכונה, לכל אחת מ־300 הנקודות.');
  let sc = 1, raw = false; const sr = row(box); V.slider(sr, 'קנה מידה של W2', -2, 1.5, 0.05, 0, v => { sc = Math.pow(10, v); draw(); }, v => '×' + F(Math.pow(10, v), v < 0 ? 2 : 1));
  const cb = el('label', { class: 'note-small', html: '<input type="checkbox"> קלט בלי נרמול (פיקסלים 0–255: כאן — הנקודות כפול 255)' }); sr.appendChild(cb); cb.querySelector('input').onchange = e => { raw = e.target.checked; draw(); };
  const cv = canvas(colm(flex(box), 'התפלגות ההסתברות למחלקה הנכונה (המקווקו: 1/3)'), 560, 160, 560); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const p = mlp(64, { seed: 0 }); for (let i = 0; i < p.W2.length; i++) p.W2[i] *= sc; const r = lgBug(p, ALL, YS, { scaleX: raw ? 255 : 1 }), pc = ALL.map(i => fwd(p, [XS[i][0] * (raw ? 255 : 1), XS[i][1] * (raw ? 255 : 1)]).pr[YS[i]]);
    const bins = new Array(40).fill(0); pc.forEach(v => bins[Math.min(39, Math.floor(v * 40))]++); const x = cv.getContext('2d'); x.clearRect(0, 0, 560, 160); const mx = Math.max(...bins); bins.forEach((b, i) => { x.fillStyle = '#4263eb'; x.fillRect(20 + i * 13, 140 - b / mx * 125, 12, b / mx * 125); }); x.strokeStyle = '#2f9e44'; x.setLineDash([4, 3]); x.beginPath(); x.moveTo(20 + 40 * 13 / 3, 8); x.lineTo(20 + 40 * 13 / 3, 140); x.stroke(); x.setLineDash([]); txt(x, '0', 20, 155, '#868e96', 10); txt(x, '1', 540, 155, '#868e96', 10, 'right');
    tb.innerHTML = table(['K מחלקות', '3', '10', '37', '1,000'], [['ההפסד הצפוי, ' + ltr('ln K'), '1.099', '2.303', '3.611', '6.908']]);
    const d = r.loss / Math.log(3); out.innerHTML = 'ההפסד הראשון: <b>' + lossTxt(r.loss) + '</b>, מול 1.099 הצפוי' + (isFinite(d) ? ' (פי ' + F(d, 2) + ')' : '') + '. ' + (Math.abs(d - 1) < 0.08 ? badge(true, 'תקין') + ' — כל ההסתברויות קרובות לשליש: הרשת "יודעת שהיא לא יודעת". ' : d > 1 ? badge(false, 'חשוד') + ' — הרשת מתחילה <b>בטוחה וטועה</b>: ההסתברויות קרובות ל־0 או ל־1, וכל טעות עולה ביוקר. ' + (raw ? 'הסיבה כאן: קלט גדול פי 255 מגדיל את כל הציונים פי 255 — בדיוק מה שקורה כששוכחים לחלק פיקסלים ב־255.' : 'הסיבה כאן: משקלים גדולים מדי בשכבה האחרונה (בקורס — פי 10, 3.697).') + ' אימון שמתחיל כך מבזבז את הצעדים הראשונים על "להירגע", ולעתים מתפוצץ. ' : 'הפסד קצת נמוך מ־ln K אפשרי במקרה, אבל לא הרבה. ') + 'זו הבדיקה הכי זולה שיש: מספר אחד, לפני שמתחילים.'; }
  draw();
};

W.w2_overfit_batch = function (box) {
  V.say(box, 'בדיקה 2, חיה: אותה רשת מנסה לשנן <b>16 נקודות</b>, 500 צעדים (כמו בקוד של הסעיף). <b>בחר באג</b> והרץ. השאלה היחידה: האם ההפסד מגיע קרוב לאפס?');
  let bug = 'ok'; V.tabs(box, BUGS.map(b => b[1]), i => { bug = BUGS[i][0]; draw(); });
  const cv = canvas(colm(flex(box), 'הפסד על 16 הנקודות (סקאלה לוגריתמית); אפור — בלי באג'), 560, 200, 560); const out = V.say(box); const base = runBug('ok', IDX16, 500, 1.0, 5);
  function draw() { const r = runBug(bug, IDX16, 500, 1.0, 5); const all = r.hist.concat(base.hist).filter(v => isFinite(v) && v > 0); logPlot(cv, [{ y: base.hist, color: '#ced4da' }, { y: r.hist.map(v => isFinite(v) ? v : 1e3), color: '#e8590c', lw: 2.5 }], Math.floor(log10(Math.min(...all))) - 0.2, Math.max(1, Math.ceil(log10(Math.max(...all)))), { xl: ['0', '500'], hlines: [{ v: Math.log(3), color: '#868e96', label: 'ln 3' }] });
    const pass = isFinite(r.loss) && r.loss < 0.05; const why = { ok: 'הקוד מסוגל ללמוד. בקורס: 1.11 → 0.057 → 0.0067.', sign: 'הצעד הולך <b>עם</b> הגרדיאנט: ההפסד עולה עד אינסוף (תרגיל 11.3). באימון מלא זה נראה כמו "קצב גבוה מדי"; כאן זה ברור תוך שניות.', nozero: 'כל צעד משתמש בסכום כל הגרדיאנטים מההתחלה — המומנטום של מישהו שלא בלם. ההפסד קופץ, ולפעמים מתפוצץ.', double: 'ההפסד מקבל הסתברויות ומפעיל עליהן סופטמקס נוסף: הוא לעולם לא יורד מתחת ל־' + F(Math.log(1 + 2 / Math.E), 3) + ' (סופטמקס של [1, 0, 0]) — והגרדיאנט שטוח. הבדיקה תופסת: ההפסד לא מתקרב לאפס.', dead: 'כל הנוירונים מתים: הגרדיאנט של W1 אפס בדיוק, והשכבה האחרונה רואה רק אפסים. שום דבר לא זז — ln 3 לנצח.', frozen: 'רק השכבה האחרונה לומדת, על תכונות אקראיות של 64 נוירונים. על 16 נקודות זה עדיין עשוי להספיק! הבדיקה לא תופסת כל באג — לכן גם בדיקה 4 (גרדיאנט אפס בשכבה).', shuffle: 'מפתיע? הרשת <b>משננת</b> גם תוויות אקראיות — 16 נקודות קל לזכור. לכן הבדיקה הזו לא תופסת תוויות מעורבבות; רק אימון מלא (שבו אי אפשר לשנן את הכול) או להסתכל על התמונות (סעיף 11.5).', pixels: 'קלט גדול פי 255: ההפסד מתחיל עצום, והצעדים ענקיים. בקצב הזה זה מתפוצץ או נתקע.', lowlr: 'הקוד תקין, אבל 500 צעדים בקצב 0.001 לא מספיקים. ההפסד יורד — לאט. זה לא באג, אבל הבדיקה מתריעה: מספיק לבדוק שוב בקצב סביר.' }[bug];
    out.innerHTML = 'הפסד סופי על 16 הנקודות: <b>' + lossTxt(r.loss) + '</b>, דיוק ' + (r.acc * 100).toFixed(0) + '%. ' + (pass ? badge(true, 'משנן') : badge(false, 'לא משנן')) + ' — ' + why; }
  draw();
};

W.w2_loss_curves = function (box) {
  const tabs = el('div'); box.appendChild(tabs); const A = el('div'), B = el('div'); box.appendChild(A); box.appendChild(B); B.style.display = 'none';
  V.tabs(tabs, ['שלושה קצבים, ובאגים', 'תעלומה: מה הבאג?'], k => { A.style.display = k ? 'none' : ''; B.style.display = k ? '' : 'none'; if (k) newMystery(); else drawA(); });
  V.say(A, 'אימון מלא על כל הספירלה, 1,000 צעדים. <b>בחר קצב ובאג</b> — וקרא את העקומה לפי המילון של הסעיף.');
  let lr = 1, bug = 'ok'; V.tabs(A, ['קצב 0.01', 'קצב 1.0', 'קצב 30'], i => { lr = [0.01, 1, 30][i]; drawA(); }, 1); V.tabs(A, BUGS.map(b => b[1]), i => { bug = BUGS[i][0]; drawA(); });
  const cA = canvas(colm(flex(A), 'הפסד האימון (חתוך ב־3)'), 560, 200, 560); const outA = V.say(A);
  function drawA() { const r = runBug(bug, ALL, 1000, lr, 10); lplot(cA, [{ y: r.hist.map(v => isFinite(v) ? Math.min(v, 3) : 3), color: '#e8590c', lw: 2 }], [0, 3], { hlines: [{ v: Math.log(3), color: '#adb5bd', label: 'ln 3' }] });
    const h = r.hist, fin = h[h.length - 1], jumpy = h.slice(5).some((v, i) => v > h[i + 4] * 1.5), flat = Math.abs(fin - Math.log(3)) < 0.02;
    outA.innerHTML = 'הפסד סופי ' + lossTxt(fin) + ', דיוק ' + (r.acc * 100).toFixed(0) + '%. הקריאה: ' + (!isFinite(fin) || fin > 2 ? '<b>קופץ למעלה / מתפוצץ</b> — קצב גבוה מדי, או צעד בכיוון הלא נכון.' : flat ? '<b>שטוח על ln 3</b> — הרשת לא מקבלת מידע: נוירונים מתים, שכבה קפואה, תוויות שלא קשורות לקלט.' : jumpy ? '<b>קפיצות חדות</b> — גרדיאנטים שמצטברים, או קצב גבוה.' : fin > 0.5 ? '<b>יורד לאט</b> — קצב נמוך, או מודל שלא מקבל את האות הנכון.' : 'ירידה תקינה.') + (lr === 30 && bug === 'ok' ? ' (בקורס, בקצב 30 ההפסד הגיע לאינסוף כבר בצעד 2.)' : ''); }
  V.say(B, 'בחרתי באג בסוד. מתוך עקומת ההפסד ונורמות הגרדיאנט של כל שכבה — <b>מה הבאג?</b>');
  let secret = 'ok', tries = 0; const cB = canvas(colm(flex(B), 'הפסד (קצב 1.0)'), 360, 200, 360), cG = canvas(colm(flex(B), 'נורמת הגרדיאנט: W1, b1, W2, b2 (סקאלה לוגריתמית)'), 220, 200, 220); const guess = el('div'); B.appendChild(guess); const outB = V.say(B);
  V.btns(B, [['תעלומה חדשה', () => newMystery(), 'primary']]);
  function newMystery() { const pool = BUGS.filter(b => b[0] !== 'lowlr'); secret = pool[Math.floor(Math.random() * pool.length)][0]; tries = 0; const r = runBug(secret, ALL, 600, 1, 10);
    lplot(cB, [{ y: r.hist.map(v => isFinite(v) ? Math.min(v, 3) : 3), color: '#7048e8', lw: 2 }], [0, 3], { hlines: [{ v: Math.log(3), color: '#adb5bd', label: 'ln 3' }] });
    const g0 = r.gn[Math.min(3, r.gn.length - 1)] || [0, 0, 0, 0], x = cG.getContext('2d'); x.clearRect(0, 0, 220, 200); ['W1', 'b1', 'W2', 'b2'].forEach((k, i) => { const v = g0[i], h = v > 0 ? clamp((log10(v) + 8) / 9, 0.02, 1) * 160 : 0; x.fillStyle = v === 0 ? '#e03131' : '#7048e8'; x.fillRect(20 + i * 50, 175 - h, 36, h); txt(x, k, 38 + i * 50, 192, '#495057', 11, 'center'); txt(x, v === 0 ? '0!' : E(v, 0), 38 + i * 50, 170 - h, '#495057', 9, 'center'); });
    guess.innerHTML = ''; const pool2 = BUGS.filter(b => b[0] !== 'lowlr'); V.tabs(guess, pool2.map(b => b[1]), i => check(pool2[i][0]), -1); outB.innerHTML = 'הנורמות נמדדו בצעד 30. בחר תשובה.'; }
  function check(g) { tries++; const name = BUGS.find(b => b[0] === secret)[1]; outB.innerHTML = g === secret ? badge(true, 'נכון') + ' — ' + name + (tries > 1 ? ' (ניסיון ' + tries + ')' : '') + '. לחץ "תעלומה חדשה".' : badge(false, 'לא') + ' — ' + ({ ok: 'יש באג?', shuffle: 'רמז: עם תוויות מעורבבות ההפסד נתקע קרוב ל־ln 3 אבל הגרדיאנטים לא אפס.', dead: 'רמז: נוירונים מתים נותנים גרדיאנט אפס בדיוק ל־W1 ול־b1.' }[g] || 'נסה שוב: מה העקומה עושה, ואיזו שכבה מקבלת אפס?'); }
  drawA();
};

W.w2_grad_norms = function (box) {
  V.say(box, 'בדיקה 4: גודל הגרדיאנט של כל פרמטר, והיחס שלו לגודל המשקל. <b>הזז את b1</b> — הטיה שלילית הורגת נוירונים. ולמטה: <b>הגבלת הנורמה</b> של ' + ltr('clip_grad_norm_') + '.');
  let b1 = 0.01, maxn = 1; const sr = row(box); V.slider(sr, 'b1 (הטיית השכבה הנסתרת)', -6, 1, 0.1, b1, v => { b1 = v; draw(); }, v => F(v, 2));
  const tb = el('div'); box.appendChild(tb); const out = V.say(box); const sr2 = row(box); V.slider(sr2, 'max_norm', 0.05, 3, 0.05, maxn, v => { maxn = v; draw(); }, v => F(v, 2)); const cC = canvas(colm(flex(box), 'הגרדיאנט המשולב (חץ אפור) ואחרי הגבלה (כתום) — שני רכיבים לדוגמה'), 300, 200, 300); const out2 = V.say(box);
  function draw() { const p = mlp(64, { seed: 0 }); p.b1.fill(b1); const r = lgBug(p, ALL, YS, {}); let dead = 0; for (let j = 0; j < 64; j++) { let on = false; for (const i of ALL) if (fwd(p, XS[i]).z[j] > 0) { on = true; break; } if (!on) dead++; }
    const nrm = a => Math.sqrt(a.reduce((s, v) => s + v * v, 0)), rows = ['W1', 'b1', 'W2', 'b2'].map(k => { const g = nrm(r.g[k]), w = nrm(p[k]); return [ltr(k), g === 0 ? '<b style="color:#c92a2a">0.0</b>' : ltr(E(g, 2)), w === 0 ? '0 (מאותחל לאפס)' : ltr(E(w, 2)), g === 0 || w === 0 ? '—' : ltr(E(g / w, 1))]; });
    tb.innerHTML = table(['פרמטר', 'נורמת הגרדיאנט', 'נורמת המשקל', 'יחס'], rows);
    out.innerHTML = 'נוירונים מתים: <b>' + dead + ' מתוך 64</b> (' + (dead / 64 * 100).toFixed(0) + '%). ' + (dead === 64 ? 'כולם — וכמו בקוד של הסעיף, הגרדיאנט של W1 ושל b1 <b>אפס בדיוק</b>, וגם של W2 (תרגיל 11.2: h כולו אפס). הרשת דוממת לחלוטין, ושום קצב לא יעזור.' : dead > 0 ? 'כל נוירון מת הוא קיבולת שהלכה לאיבוד — הוא לעולם לא יחזור, כי הגרדיאנט שלו אפס. כך קורה אחרי צעד ענק בקצב גבוה.' : 'אין מתים: לכל נוירון יש לפחות נקודה אחת שבה הוא פעיל.') + ' היחס "גרדיאנט/משקל" כפול הקצב הוא כמה כל צעד משנה את השכבה — בריא סביב אלפית.';
    const tot = nrm([...r.g.W1, ...r.g.b1, ...r.g.W2, ...r.g.b2]), f = tot > maxn ? maxn / tot : 1, x = cC.getContext('2d'); x.clearRect(0, 0, 300, 200); const gx = r.g.W2[0], gy = r.g.W2[1], S = 80 / Math.max(Math.abs(gx), Math.abs(gy), 1e-9);
    const arrow = (vx, vy, c, w) => { x.strokeStyle = c; x.lineWidth = w; x.beginPath(); x.moveTo(150, 100); x.lineTo(150 + vx * S, 100 - vy * S); x.stroke(); x.lineWidth = 1; }; arrow(gx, gy, '#adb5bd', 4); arrow(gx * f, gy * f, '#e8590c', 2.5);
    out2.innerHTML = 'הנורמה הכוללת של כל הגרדיאנטים: ' + ltr(E(tot, 2)) + '. ' + (f < 1 ? 'גדולה מ־' + F(maxn, 2) + ', ולכן <b>כל</b> הגרדיאנטים מוכפלים ב־' + F(f, 3) + ' — הכיוון נשמר בדיוק (החצים על אותו קו), רק האורך מתקצר.' : 'קטנה מ־' + F(maxn, 2) + ' — שום דבר לא משתנה.') + ' זו רשת ביטחון נגד צעד ענק בודד, לא תיקון לקצב גבוה. ו־' + ltr('clip_grad_norm_') + ' מחזירה את הנורמה <i>לפני</i> ההגבלה — כדאי לרשום אותה (פרק 10): עלייה פתאומית בה היא אזהרה מוקדמת.'; }
  draw();
};

W.w2_bug_hunt = function (box) {
  V.say(box, 'שני כלים מהסעיף. למעלה: <b>להסתכל בעיניים</b> — עשר תמונות מהמטען עם התוויות שלהן. אחד המטענים שבור. איזה? למטה: הטבלה של הסעיף כמשחק — <b>לכל באג, איזו בדיקה תופסת אותו?</b>');
  let broken = Math.random() < 0.5 ? 0 : 1; const grids = el('div'); box.appendChild(grids); const outA = V.say(box);
  V.tabs(box, ['מטען א׳ שבור', 'מטען ב׳ שבור'], i => ans(i), -1); V.btns(box, [['ערבב מחדש', () => { broken = Math.random() < 0.5 ? 0 : 1; drawA(); }, 'primary']]);
  function drawA() { const D = L4(); if (!D) { outA.innerHTML = 'הנתונים עוד לא נטענו.'; return; } grids.innerHTML = ''; [0, 1].forEach(w => { grids.appendChild(el('div', { class: 'note-small', style: { textAlign: 'center', marginTop: '6px' }, html: '<b>מטען ' + (w ? 'ב׳' : 'א׳') + '</b>' })); const g = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px', direction: 'ltr', maxWidth: '680px', margin: '0 auto' } }); grids.appendChild(g);
      const order = shuffled([...Array(10).keys()], NN.rng(w * 31 + 7)); order.forEach((k, i) => { const cell = el('div', { style: { textAlign: 'center', fontSize: '11px' } }); const c = document.createElement('canvas'); c.width = c.height = 28; c.style.width = '100%'; c.style.imageRendering = 'pixelated'; heat(c, Array.from(D.imgs[k]), 28, 28); cell.appendChild(c); const lab = w === broken ? D.ys[order[(i + 1) % 10]] : D.ys[k]; cell.appendChild(el('div', { html: FASHION[lab] })); g.appendChild(cell); }); });
    outA.innerHTML = 'בדוק כל תמונה מול התווית שמתחתיה.'; }
  function ans(w) { outA.innerHTML = w === broken ? badge(true, 'נכון') + ' — במטען ' + (broken ? 'ב׳' : 'א׳') + ' התוויות מוזזות במקום אחד: כל תמונה קיבלה את התווית של השכנה. זה מה שקורה כשמערבבים רק את התמונות, או כשקובץ התוויות ממוין אחרת. ההפסד היה נתקע קרוב ל־ln 10, שינון מנה אחת היה <b>מצליח</b> (סעיף 11.2), ורק עשר שניות של הסתכלות תופסות את זה.' : badge(false, 'לא') + ' — הסתכל שוב: האם הנעל באמת "שמלה"?'; }
  const BT = [['סופטמקס לפני ' + ltr('CrossEntropyLoss'), 1], ['שכחת ' + ltr('zero_grad'), 2], ['שכחת ' + ltr('model.eval()'), 4], ['שכחת נרמול פיקסלים', 0], ['תוויות מעורבבות', 3], ['שכבה קפואה בטעות', 3]], CH = ['הפסד ראשון', 'שינון מנה', 'עקומת הפסד', 'הסתכלות / נורמת גרדיאנט', 'השוואת שתי הערכות'];
  const quiz = el('div'); box.appendChild(quiz); const outQ = V.say(box); const pick = {};
  const ANS = { 0: [0], 1: [1], 2: [2], 3: [3], 4: [4], 5: [3] }, WHY = ['הפסד ראשון רחוק מ־ln K כבר לפני האימון (וגם עקומה לא יציבה).', 'ההפסד לא יורד מתחת לרצפה — שינון מנה אחת נכשל.', 'הפסד שקופץ מעלה ומטה בלי היגיון.', 'שינון מצליח, ההפסד המלא תקוע — רק הסתכלות על התמונות עם התוויות תופסת.', 'אותה הערכה בשני גדלי אצווה נותנת דיוק שונה.', 'נורמת גרדיאנט אפס (או None) לשכבה אחת.'];
  function drawQ() { quiz.innerHTML = '<div class="note-small" style="text-align:center;margin-top:10px"><b>איזו בדיקה תופסת?</b></div>'; BT.forEach(([b], i) => { quiz.appendChild(el('div', { class: 'note-small', style: { marginTop: '8px' }, html: '<b>' + b + '</b>' })); const fb = el('div', { class: 'note-small' }); V.tabs(quiz, CH, j => { pick[i] = j; fb.innerHTML = ANS[i].includes(j) ? badge(true, '✓') + ' ' + WHY[i] : badge(false, '✗') + ' נסה בדיקה אחרת.'; score(); }, -1); quiz.appendChild(fb); }); score(); }
  function score() { const done = Object.keys(pick).filter(k => ANS[k].includes(pick[k])).length; outQ.innerHTML = done + ' מתוך ' + BT.length + ' נכונות. (התשובות לפי תרגיל 11.4: "בדרך כלל" — באגים אמיתיים לפעמים נתפסים בבדיקה אחרת.)'; }
  drawA(); drawQ();
};

/* ===================================================== chapter 12 */
const L12 = () => window.M2LAB12 || null;          /* the project, run on the user's computer (content/m2_lab12data.js) */
const FILES12 = [
  { name: 'metrics.py', lib: 'NumPy ופייתון בלבד', parts: [['confusion_matrix', '12.2'], ['per_class_report', '12.2 · פרק 7'], ['EarlyStopping', '12.2 · פרק 8'], ['run_hash, RunLogger', 'פרק 10']], note: 'אפשר לבדוק בלי כרטיס ובלי אימון — כל תרגילי NumPy של הפרק הם בדיקות יחידה שלו.' },
  { name: 'trainer.py', lib: 'PyTorch', parts: [['Trainer.__init__', 'הזרקת תלויות'], ['_train_epoch', 'פרק 3 · דיוק מעורב (9) · הגבלה (11)'], ['predict', 'eval (8) · no_grad'], ['save / load', 'נקודת שמירה'], ['fit', 'תזמון (7) · עצירה (8) · רישום (10)'], ['report', 'מטריצת בלבול']], note: 'לא יודע כלום על פריטי לבוש: מקבל מודל, הפסד, אופטימייזר ותזמון מבחוץ.' },
  { name: 'run_fashion.py', lib: 'PyTorch + torchvision', parts: [['cfg', 'פרק 10'], ['set_seed', 'פרק 10'], ['train_tf / test_tf', 'פרק 8'], ['random_split + Subset', 'פרק 3 · 8'], ['SmallCNN', 'פרק 4'], ['AdamW + SequentialLR', 'פרקים 3, 7, 8'], ['CrossEntropyLoss(label_smoothing)', 'פרק 7']], note: 'הקובץ היחיד שמשתנה בין פרויקטים. במודול 4 — run_detector.py לצדו.' }];
W.w2_files = function (box) {
  V.say(box, 'שלושה קבצים, ומאיפה בא כל חלק. <b>לחץ על קובץ.</b> החצים: מי מייבא את מי. ובסוף — <b>הורד את הפרויקט</b>: שלושת הקבצים, עם התיקונים של האתר, מוכנים להרצה ב־PyCharm.');
  let sel = 1; V.tabs(box, FILES12.map(f => f.name), i => { sel = i; draw(); }, 1);
  const cv = canvas(colm(flex(box), 'התלויות'), 600, 130, 600); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  box.appendChild(el('div', { style: { textAlign: 'center', margin: '8px' }, html: '<a class="btn primary" href="assets/files/m2_project.zip" download>⬇ הורד את הפרויקט (metrics.py, trainer.py, run_fashion.py)</a>' }));
  function draw() { const x = cv.getContext('2d'); x.clearRect(0, 0, 600, 130); const pos = [[480, 65], [300, 65], [120, 65]];
    FILES12.forEach((f, i) => { const [X, Y] = pos[i]; x.fillStyle = i === sel ? '#4263eb' : '#f1f3f5'; x.fillRect(X - 75, Y - 26, 150, 52); x.strokeStyle = '#adb5bd'; x.strokeRect(X - 75, Y - 26, 150, 52); txt(x, f.name, X, Y - 3, i === sel ? '#fff' : '#212529', 13, 'center'); txt(x, f.lib, X, Y + 15, i === sel ? '#dbe4ff' : '#868e96', 10, 'center'); });
    const arr = (x0, x1) => { x.strokeStyle = '#495057'; x.lineWidth = 2; x.beginPath(); x.moveTo(x0, 65); x.lineTo(x1, 65); x.stroke(); x.fillStyle = '#495057'; x.beginPath(); x.moveTo(x1, 65); x.lineTo(x1 + 8, 60); x.lineTo(x1 + 8, 70); x.fill(); x.lineWidth = 1; }; arr(375, 405 - 0); arr(195, 225); txt(x, 'import', 390, 55, '#868e96', 10, 'center'); txt(x, 'import', 210, 55, '#868e96', 10, 'center');
    const f = FILES12[sel]; tb.innerHTML = table(['חלק', 'מאיפה'], f.parts.map(([a, b]) => [ltr(a), b])); out.innerHTML = '<b>' + f.name + '</b>: ' + f.note + ' הכיוון של החצים הוא העיקרון: <code class="ltr">metrics.py</code> לא מייבא אף אחד, ולכן אפשר לבדוק אותו לבד; <code class="ltr">trainer.py</code> לא יודע מאיפה הנתונים; ורק <code class="ltr">run_fashion.py</code> יודע הכול. כמו שכבות בתוכנה רגילה — הלוגיקה בפנים, ההגדרות בחוץ.'; }
  draw();
};

function reportJS(cm) { const k = cm.length, tp = cm.map((r, i) => r[i]), col = [...Array(k)].map((_, j) => cm.reduce((a, r) => a + r[j], 0)), row0 = cm.map(r => r.reduce((a, b) => a + b, 0)); const P = tp.map((t, i) => t / Math.max(col[i], 1)), R = tp.map((t, i) => t / Math.max(row0[i], 1)), F1 = P.map((p, i) => 2 * p * R[i] / Math.max(p + R[i], 1e-12)); return { P, R, F1, n: row0, acc: tp.reduce((a, b) => a + b, 0) / row0.reduce((a, b) => a + b, 0), macro: F1.reduce((a, b) => a + b, 0) / k }; }
W.w2_confusion = function (box) {
  V.say(box, 'מטריצת בלבול — שורה: המחלקה האמיתית, עמודה: מה שהמודל אמר. <b>בחר מטריצה</b> — הדוגמה של הסעיף, או סט הבדיקה של הפרויקט שרץ במחשב שלך — ו<b>לחץ על תא</b>.');
  let which = 0, cellSel = null; const EX = [[3, 1, 0], [0, 4, 0], [1, 1, 2]]; V.tabs(box, ['הדוגמה של הסעיף', 'הפרויקט במחשב שלך (10,000 תמונות בדיקה)'], i => { which = i; cellSel = null; draw(); });
  const cv = canvas(colm(flex(box), 'מטריצת הבלבול'), 520, 420, 520); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  cv.addEventListener('click', e => { const D = get(); if (!D) return; const b = cv.getBoundingClientRect(), k = D.cm.length, s = 360 / k, X = (e.clientX - b.left) / b.width * 520 - 140, Y = (e.clientY - b.top) / b.height * 420 - 50; if (X < 0 || Y < 0) return; cellSel = [Math.floor(Y / s), Math.floor(X / s)]; if (cellSel[0] >= k || cellSel[1] >= k) cellSel = null; draw(); });
  function get() { if (which === 0) return { cm: EX, names: ['cat', 'dog', 'bird'] }; const D = L12(); return D && D.confusion ? { cm: D.confusion, names: FASHION } : null; }
  function draw() { const D = get(); if (!D) { out.innerHTML = 'הנתונים מהרצת הפרויקט עוד לא נטענו.'; return; } const cm = D.cm, k = cm.length, s = 360 / k, x = cv.getContext('2d'); x.clearRect(0, 0, 520, 420); const R = reportJS(cm);
    cm.forEach((row0, i) => row0.forEach((v, j) => { const t = v / Math.max(R.n[i], 1); x.fillStyle = i === j ? 'rgba(47,158,68,' + (0.15 + 0.85 * t) + ')' : 'rgba(232,89,12,' + Math.min(1, t * 4) + ')'; x.fillRect(140 + j * s, 50 + i * s, s - 1, s - 1); if (v) txt(x, String(v), 140 + j * s + s / 2, 50 + i * s + s / 2 + 4, t > 0.5 ? '#fff' : '#212529', k > 5 ? 10 : 14, 'center'); }));
    D.names.forEach((n, i) => { txt(x, n, 134, 50 + i * s + s / 2 + 4, '#495057', 11, 'right'); x.save(); x.translate(140 + i * s + s / 2, 44); x.rotate(-Math.PI / 4); txt(x, n, 0, 0, '#495057', 11); x.restore(); }); txt(x, 'אמת ↓   חיזוי →', 134, 22, '#868e96', 10, 'right');
    if (cellSel) { x.strokeStyle = '#212529'; x.lineWidth = 3; x.strokeRect(140 + cellSel[1] * s, 50 + cellSel[0] * s, s - 1, s - 1); x.lineWidth = 1; }
    tb.innerHTML = table(['מחלקה', 'דיוק ניבוי', 'רגישות', 'F1', 'n'], D.names.map((n, i) => [n, F(R.P[i], 3), R.R[i] === Math.min(...R.R) ? '<b style="color:#c92a2a">' + F(R.R[i], 3) + '</b>' : F(R.R[i], 3), F(R.F1[i], 3), R.n[i]]).concat([['<b>דיוק</b>', '<b>' + F(R.acc, 3) + '</b>', 'macro-F1', '<b>' + F(R.macro, 3) + '</b>', '']]));
    const off = []; cm.forEach((r, i) => r.forEach((v, j) => { if (i !== j && v) off.push([v, i, j]); })); off.sort((a, b) => b[0] - a[0]); const top = off.slice(0, 3).map(([v, i, j]) => D.names[i] + ' ← ' + D.names[j] + ' (' + v + ')').join(', ');
    out.innerHTML = (cellSel ? (cellSel[0] === cellSel[1] ? '<b>' + D.names[cellSel[0]] + '</b>: ' + cm[cellSel[0]][cellSel[0]] + ' מתוך ' + R.n[cellSel[0]] + ' זוהו נכון. ' : '<b>' + cm[cellSel[0]][cellSel[1]] + '</b> תמונות של <b>' + D.names[cellSel[0]] + '</b> סווגו כ־<b>' + D.names[cellSel[1]] + '</b>. ') : '') + 'דיוק ' + (R.acc * 100).toFixed(1) + '%, macro-F1 ' + F(R.macro, 3) + '. שלוש הטעויות השכיחות (אמת ← חיזוי, תרגיל 12.3): ' + top + '. ' + (which === 1 ? 'בדיוק הדפוס שהסעיף צפה: החולצה (Shirt) היא המחלקה החלשה, והיא מתבלבלת עם חולצת טי, סוודר ומעיל — בגדי פלג גוף עליון שבאפור של 28 פיקסלים נראים כמעט אותו דבר. נעליים ותיקים כמעט מושלמים.' : 'המודל מוצא רק חצי מהציפורים, ונוטה לסמן דברים ככלב — כמו בסעיף.'); }
  draw();
};

W.w2_trainer_flow = function (box) {
  V.say(box, 'הלולאה של <code class="ltr">fit</code>, סבב אחר סבב — על המספרים האמיתיים מהרצת הפרויקט במחשב שלך (קובץ <code class="ltr">metrics.csv</code>). <b>לחץ "סבב הבא"</b>, או הזז את הסבלנות וראה מתי <code class="ltr">EarlyStopping</code> היה עוצר.');
  let ep = -1, pat = 5; const sr = row(box); V.slider(sr, 'patience', 1, 6, 1, pat, v => { pat = v; draw(); }); V.btns(box, [['▶ סבב הבא', () => { const D = L12(); if (D && D.metrics && ep < D.metrics.length - 1) { ep++; draw(); } }, 'primary'], ['⏭ הכל', () => { const D = L12(); if (D && D.metrics) { ep = D.metrics.length - 1; draw(); } }, 'ghost'], ['↺ מההתחלה', () => { ep = -1; draw(); }, 'ghost']]);
  const steps = el('div', { class: 'row', style: { gap: '6px', flexWrap: 'wrap', justifyContent: 'center', margin: '6px 0' } }); box.appendChild(steps); const cv = canvas(colm(flex(box), 'הפסד אימון / אימות, ודיוק אימות'), 600, 210, 600); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  const STEPS = ['_train_epoch', 'predict(val)', 'sched.step()', 'logger.log', 'stopper.step', 'save(best.pt)?'];
  function draw() { const D = L12(); if (!D || !D.metrics) { out.innerHTML = 'הנתונים מהרצת הפרויקט עוד לא נטענו.'; return; } const M = D.metrics; steps.innerHTML = STEPS.map(s => '<span style="padding:3px 8px;border-radius:6px;border:1px solid #ced4da;font-size:12px;direction:ltr;' + (ep >= 0 ? 'background:#e7f5ff' : '') + '">' + s + '</span>').join(' → ');
    let best = null, bad = 0, stopAt = -1; const marks = M.map((r, i) => { const v = r.val_acc; const imp = best === null || v > best + 1e-4; if (imp) { best = v; bad = 0; } else bad++; if (stopAt < 0 && bad >= pat) stopAt = i; return { imp, bad }; });
    const n = ep + 1, sh = M.slice(0, n); lplot(cv, [{ y: M.map((r, i) => i < n ? r.train_loss : NaN), color: '#4263eb' }, { y: M.map((r, i) => i < n ? r.val_loss : NaN), color: '#e8590c' }, { y: M.map((r, i) => i < n ? r.val_acc : NaN), color: '#2f9e44', lw: 2.5 }], [0, 1.2]);
    tb.innerHTML = table(['סבב', 'train_loss', 'val_loss', 'val_acc', 'lr', 'שניות', 'שיפור?', 'סבבים בלי שיפור'], sh.map((r, i) => [i, r.train_loss, r.val_loss, '<b>' + r.val_acc + '</b>', ltr(Number(r.lr).toExponential(2)), r.sec, marks[i].imp ? badge(true, 'best.pt') : '—', marks[i].bad]));
    const bi = M.reduce((b, r, i) => r.val_acc > M[b].val_acc ? i : b, 0);
    out.innerHTML = ep < 0 ? 'לחץ "סבב הבא". (כחול — הפסד אימון, כתום — אימות, ירוק — דיוק.)' : 'סבב ' + ep + ': ' + (marks[ep].imp ? 'שיפור — <code class="ltr">best.pt</code> נשמר מחדש. ' : 'אין שיפור (' + marks[ep].bad + ' ברצף). ') + (ep === M.length - 1 ? 'הריצה הסתיימה אחרי ' + M.length + ' סבבים (במחשב שלך הורץ עם ' + M.length + ' במקום 30, בגלל הזמן על מעבד). ' + (stopAt >= 0 ? 'עם סבלנות ' + pat + ' היה נעצר בסבב ' + stopAt + '. ' : 'עם סבלנות ' + pat + ' לא היה נעצר. ') + 'בסוף <code class="ltr">fit</code> טוען את <code class="ltr">best.pt</code> — מסבב ' + bi + ', דיוק ' + (M[bi].val_acc * 100).toFixed(2) + '% — ולא את האחרון. שימו לב לעמודת lr: חימום בשני הסבבים הראשונים, ואז קוסינוס. והפסד האימות לא יורד הרבה מתחת ל־0.5 — החלקת התוויות (סעיף 7.3).' : ''); }
  draw();
};

W.w2_run_config = function (box) {
  V.say(box, 'ההגדרות של <code class="ltr">run_fashion.py</code>. <b>שנה ערכים</b>: הטביעה של התיקייה מתעדכנת (אותו SHA-1 כמו בפייתון), ומתחת — עקומת הקצב שהתזמון ייתן.');
  const cfg = { seed: 0, lr: 0.001, weight_decay: 0.05, batch_size: 128, epochs: 30, warmup: 2, patience: 5, label_smoothing: 0.1, model: 'SmallCNN' }, T = { seed: 'int', lr: 'float', weight_decay: 'float', batch_size: 'int', epochs: 'int', warmup: 'int', patience: 'int', label_smoothing: 'float', model: 'str' };
  const sr = row(box); V.slider(sr, 'epochs', 5, 60, 1, 30, v => { cfg.epochs = v; draw(); }); V.slider(sr, 'warmup', 0, 10, 1, 2, v => { cfg.warmup = v; draw(); }); const sr2 = row(box); V.slider(sr2, 'seed', 0, 9, 1, 0, v => { cfg.seed = v; draw(); }); V.slider(sr2, 'label_smoothing', 0, 0.3, 0.05, 0.1, v => { cfg.label_smoothing = Math.round(v * 100) / 100; draw(); }, v => F(v, 2));
  const code = mono(box); const cv = canvas(colm(flex(box), 'קצב הלמידה בכל סבב (LinearLR ואז CosineAnnealingLR)'), 600, 160, 600); const out = V.say(box);
  function draw() { const d = pyDumps(cfg, T), h = sha1hex(d).slice(0, 8); code.textContent = 'config.json:\n' + JSON.stringify(cfg, Object.keys(cfg).sort(), 2) + '\n\nrun folder:  runs/20261116-' + '193000_' + h + '/';
    const lr = [...Array(cfg.epochs)].map((_, e) => e < cfg.warmup ? cfg.lr * (0.2 + 0.8 * e / Math.max(cfg.warmup, 1)) : cfg.lr * 0.5 * (1 + Math.cos(Math.PI * (e - cfg.warmup) / Math.max(1, cfg.epochs - cfg.warmup)))); lplot(cv, [{ y: lr, color: '#4263eb', lw: 2 }], [0, 0.0011]);
    const D = L12(); const ran = D && D.config; out.innerHTML = 'טביעה: <b>' + ltr(h) + '</b>. ' + (ran ? 'הריצה במחשב שלך: ' + ltr(D.run_dir) + ' — עם epochs = ' + D.config.epochs + '. ' : '') + 'כל שינוי — גם בגרעין — הוא תיקייה חדשה; זה מה שמאפשר להריץ את אותו קובץ שלוש פעמים עם שלושה גרעינים (רשימת הבדיקה, סעיף 12.5) ולהשוות. החימום כאן מתחיל ב־0.2 מהקצב (<code class="ltr">start_factor=0.2</code>), והקוסינוס יורד לאפס בסבב האחרון.'; }
  draw();
};

W.w2_checklist = function (box) {
  V.say(box, 'רשימת הבדיקה של הסעיף — <b>כל סעיף נבדק במחשב שלך</b> על קבצי הפרויקט (על 10,000 תמונות אימון, כדי שירוץ מהר). לחץ על סעיף לפרטים.');
  const list = el('div'); box.appendChild(list); const cv = canvas(colm(flex(box), 'פרטים'), 600, 190, 600); const out = V.say(box);
  function draw() { const D = L12(); if (!D || !D.checks) { out.innerHTML = 'הנתונים מהבדיקות עוד לא נטענו.'; return; } const C = D.checks, R = C.resume;
    const items = [
      ['הפסד ראשון ≈ ' + ltr('ln 10 = 2.303'), Math.abs(C.first_loss / Math.log(10) - 1) < 0.1, () => { out.innerHTML = 'ההפסד על המנה הראשונה, לפני כל צעד: <b>' + C.first_loss + '</b>. ושימו לב: אותה רשת על פיקסלים <b>בלי נרמול</b> (0–255): <b>' + C.first_loss_raw255 + '</b> — הבדיקה של סעיף 11.1 תופסת את זה מיד. (ועם החלקת תוויות — הערך הצפוי עדיין ln 10, כי גם היעד המוחלק "מתאים" להתפלגות שווה באותו מחיר.)'; bars([['מנורמל', C.first_loss], ['0–255', Math.min(C.first_loss_raw255, 40)], ['ln 10', Math.log(10)]]); }],
      ['משננת מנה אחת (תרגיל 12.1)', C['overfit_ls0'][3] < 0.05, () => { const a = C['overfit_ls0.1'], b = C['overfit_ls0']; out.innerHTML = 'הפסד אחרי 0, 50, 100, 300 צעדים על אותה מנה. בלי החלקה: ' + b.join(' → ') + ' — יורד לאפס. <b>עם</b> החלקה 0.1 (כמו בפרויקט): ' + a.join(' → ') + ' — נעצר סביב 0.5. זה לא באג: עם יעד של 0.91/0.01 ההפסד המינימלי הוא האנטרופיה של היעד עצמו, ' + ltr('−(0.91·ln 0.91 + 9·0.01·ln 0.01) ≈ 0.50') + '. הסעיף אומר "ההפסד ירד פחות נמוך, וזה בסדר" — הנה המספר המדויק.'; lplot(cv, [{ y: a, color: '#e8590c' }, { y: b, color: '#4263eb' }], [0, 2.5]); }],
      ['המשך מנקודת שמירה בלי קפיצה (תרגיל 12.2)', R.resumed.every((v, i) => Math.abs(v - R.straight[i]) < 1e-3), () => { const same = R.resumed.every((v, i) => v === R.straight[i]); out.innerHTML = 'אימון של סבב אחד, שמירה, ואז 20 צעדים נוספים בשלוש דרכים. ממשיכים באותו תהליך (כחול), טוענים את <code class="ltr">ck.pt</code> המלא למודל חדש (ירוק מקווקו) — ' + (same ? '<b>זהה בדיוק</b>, מספר במספר' : 'כמעט זהה') + ' — וטוענים <b>רק את המשקלים</b>, עם Adam חדש (כתום): ההפסד בצעדים הראשונים ' + R.weights_only.slice(0, 3).join(', ') + ' מול ' + R.straight.slice(0, 3).join(', ') + '. בלי הממוצעים של Adam, הצעדים הראשונים בגודל מלא בכל כיוון — זו הקפיצה של שאלת הראיון.'; lplot(cv, [{ y: R.straight, color: '#4263eb', lw: 3 }, { y: R.resumed, color: '#2f9e44', dash: [4, 3], lw: 2 }, { y: R.weights_only, color: '#e8590c', lw: 2 }], [0, Math.max(...R.weights_only, ...R.straight) * 1.1]); }],
      ['אותו גרעין, אותה תוצאה (על מעבד)', C.same_seed[0] === C.same_seed[1], () => { out.innerHTML = 'שני אימונים של סבב, אותו גרעין: טביעת האצבע של כל המשקלים בסוף — ' + ltr(C.same_seed[0]) + ' ו־' + ltr(C.same_seed[1]) + '. ' + (C.same_seed[0] === C.same_seed[1] ? 'זהות.' : 'שונות!'); bars([]); }],
      ['שלושה גרעינים, ממוצע וסטיית תקן, README', null, () => { out.innerHTML = 'זה הסעיף שלך: להריץ את <code class="ltr">run_fashion.py</code> שלוש פעמים עם <code class="ltr">seed</code> 0, 1, 2 (כל אחת לתיקייה משלה), ולכתוב את הממוצע וסטיית התקן של דיוק הבדיקה. על מעבד, 30 סבבים לוקחים כמה שעות לכל ריצה — הרץ בלילה, או קודם עם מעט סבבים כדי לוודא שהכול עובד. (בהדמיה של סעיף 10.1 ראית כמה הגרעין לבדו מזיז את התוצאה.)'; bars([]); }]];
    list.innerHTML = ''; items.forEach(([t, ok, fn], i) => { const r0 = el('div', { class: 'row', style: { alignItems: 'center', gap: '8px', margin: '4px 0', cursor: 'pointer' } }); r0.appendChild(el('span', { html: ok === null ? '⬜' : ok ? '✅' : '❌' })); r0.appendChild(el('span', { html: (i + 1) + '. ' + t })); r0.onclick = fn; list.appendChild(r0); }); items[1][2](); }
  function bars(arr) { const x = cv.getContext('2d'); x.clearRect(0, 0, 600, 190); if (!arr.length) return; const mx = Math.max(...arr.map(a => a[1])); arr.forEach(([n, v], i) => { const w = v / mx * 420; x.fillStyle = ['#4263eb', '#e8590c', '#adb5bd'][i]; x.fillRect(150, 20 + i * 50, w, 34); txt(x, n, 140, 42 + i * 50, '#495057', 12, 'right'); txt(x, F(v, 3), 156 + w, 42 + i * 50, '#212529', 12); }); }
  draw();
};

window.LAB2M = { reportJS, lgBug, runBug, sha1hex, pyDumps, toLowp, lstsq, ridge, vander, polyData, lrAt, logreg, report, fitLine, vitSpec, attnRows, patchify, gradProfile, resnetSpec, idNet, idStep, mlp, fwd, lossGrad, lossOnly, stepP, linear, linStep, trained, XS, YS };
})();
