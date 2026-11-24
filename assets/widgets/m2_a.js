/* Module 2 visuals — chapters 1–3: a network from scratch, tensors and autograd, the training loop */
(function () {
const W = window.W, V = window.V, NN = window.NN, el = V.el;
const row = box => { const r = V.row(box); r.style.direction = 'ltr'; r.style.justifyContent = 'center'; r.style.alignItems = 'flex-start'; return r; };
const col = (parent, title) => { const d = el('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' } }); if (title) d.appendChild(el('div', { class: 'note-small', html: title })); parent.appendChild(d); return d; };
const mono = (parent, txt) => { const d = el('div', { class: 'mono', style: { direction: 'ltr', textAlign: 'left', fontSize: '.85em', background: 'var(--code-bg)', padding: '8px 10px', borderRadius: '8px', whiteSpace: 'pre-wrap' } }); d.textContent = txt; parent.appendChild(d); return d; };
const canvas = (parent, w, h) => { const c = el('canvas', { width: w, height: h, style: { width: w + 'px', maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--line)', background: '#fff' } }); parent.appendChild(c); return c; };
const cleanup = (box, fn) => { const o = new MutationObserver(() => { if (!document.body.contains(box)) { fn(); o.disconnect(); } }); o.observe(document.body, { childList: true, subtree: true }); };
const bars = (parent, vals, opts = {}) => { const W0 = opts.w || 320, H0 = opts.h || 90; const svg = V.s('svg', { viewBox: `0 0 ${W0} ${H0}`, width: W0, style: { maxWidth: '100%', direction: 'ltr' } }); parent.appendChild(svg);
  return { draw(v, colors, labels) { svg.innerHTML = ''; const mx = Math.max(1e-9, ...v.map(Math.abs)); const bw = W0 / v.length; const zero = opts.signed ? H0 / 2 : H0 - 14;
    v.forEach((x, i) => { const hgt = Math.abs(x) / mx * (opts.signed ? H0 / 2 - 8 : H0 - 22); V.s('rect', { x: i * bw + 2, y: x >= 0 ? zero - hgt : zero, width: bw - 4, height: hgt, style: { fill: (colors && colors[i]) || 'var(--c1)' } }, svg); if (labels) V.s('text', { x: i * bw + bw / 2, y: H0 - 2, 'text-anchor': 'middle', 'font-size': 10, style: { fill: 'var(--ink3)' }, text: labels[i] }, svg); });
    V.s('line', { x1: 0, x2: W0, y1: zero, y2: zero, style: { stroke: 'var(--line2)' } }, svg); } }; };
const S = NN.spiral();

/* 1.1 why a hidden layer (and why ReLU) */
W.w2_linear_vs_mlp = function (box) {
  V.say(box, 'שלוש ספירלות, 300 נקודות. בחר מודל ולחץ <b>אמן</b>. הצבע ברקע הוא מה שהמודל היה אומר על כל נקודה במישור.');
  let mode = 0; const rr = row(box); const cv = canvas(rr, 300, 300); const out = V.say(box);
  V.tabs(box, ['מסווג לינארי', 'שכבה נסתרת בלי ReLU', 'שכבה נסתרת עם ReLU'], i => { mode = i; reset(); });
  V.btns(box, [['אמן', () => train(), 'primary']]);
  let p, q;
  function reset() { p = NN.init(2, 64, 3, 0); q = NN.linInit(2, 3); draw(null); }
  function predict(x) { return mode === 0 ? NN.linPred(q, x) : (f => f.s.indexOf(Math.max(...f.s)))(NN.forward1(p, x, mode === 1 ? 'id' : 'relu')); }
  function train() { if (mode === 0) NN.linTrain(q, S.X, S.y, 1, 300); else for (let s = 0; s < 400; s++) { const r = NN.lossGrad(p, S.X, S.y, mode === 1 ? 'id' : 'relu'); NN.step(p, r.g, mode === 1 ? 0.3 : 1); } draw(true); }
  function draw(done) { NN.paint(cv, predict, S.X, S.y); let acc = 0; S.X.forEach((x, i) => { if (predict(x) === S.y[i]) acc++; });
    out.innerHTML = 'דיוק: <b>' + Math.round(acc / 3) + '%</b>. ' + (!done ? 'עוד לא אומן.' : mode === 0 ? 'קווים ישרים בלבד: כמו בסעיף, בערך חצי.' : mode === 1 ? 'בלי ReLU שתי מכפלות מטריצה הן מכפלה אחת: עדיין מסווג לינארי בתחפושת.' : 'עם ReLU הרשת בונה גבולות מעוקלים, והספירלות נפרדות.'); }
  reset();
};

/* 1.2 forward pass for one point */
W.w2_forward = function (box) {
  V.say(box, 'מעבר קדימה של נקודה אחת דרך רשת קטנה (2 → 8 → 3). <b>גרור את הנקודה</b> (המחוונים), ועבור על השלבים: z1, ReLU, ציונים, הסתברויות.');
  const p = NN.init(2, 8, 3, 3); p.W2 = p.W2.map(r => r.map(v => v * 120)); let x = [0.4, 0.3];
  const sr = V.row(box); V.slider(sr, 'x₁', -1, 1, 0.05, x[0], v => { x[0] = v; go(st.i); }); V.slider(sr, 'x₂', -1, 1, 0.05, x[1], v => { x[1] = v; go(st.i); });
  const rr = row(box); const b1 = col(rr, 'z1 = x·W1 + b1 (8)'); const B1 = bars(b1, [], { signed: true, w: 220 }); const b2 = col(rr, 'h = ReLU(z1)'); const B2 = bars(b2, [], { w: 220 }); const b3 = col(rr, 'ציונים / הסתברויות'); const B3 = bars(b3, [], { signed: true, w: 140 });
  const out = V.say(box);
  const names = ['z1: כל נוירון נסתר מקבל צירוף לינארי של שתי הקואורדינטות.', 'ReLU: כל מה שהיה שלילי הופך לאפס.', 'ציונים: צירוף לינארי של הנוירונים הנסתרים, אחד לכל מחלקה.', 'סופטמקס: ציונים להסתברויות שסוכמות ל־1.'];
  const go = i => { const f = NN.forward1(p, x); B1.draw(f.z, f.z.map(v => v > 0 ? 'var(--c1)' : 'var(--ink3)')); B2.draw(i >= 1 ? f.h : f.h.map(() => 0)); const cs = ['var(--c1)', 'var(--c2)', 'var(--c3)'];
    B3.draw(i < 2 ? [0, 0, 0] : i === 2 ? f.s : f.pr, cs, ['0', '1', '2']); out.innerHTML = '<b>' + names[i] + '</b>' + (i === 3 ? ' ההסתברויות: <span class="ltr mono" style="display:inline-block">' + f.pr.map(v => V.fmt(v, 2)).join(', ') + '</span>' : ''); };
  const st = V.stepper(box, 4, go, { speed: 1300 });
};

/* 1.3 backward: p - y and the chain */
W.w2_backward = function (box) {
  V.say(box, 'המעבר לאחור לנקודה אחת שהתווית שלה היא 0. עבור על השלבים מהסוף להתחלה: כל שלב הוא שורה אחת בקוד של הסעיף.');
  const p = NN.init(2, 8, 3, 3); p.W2 = p.W2.map(r => r.map(v => v * 120)); const x = [0.4, 0.3], y = 0; const f = NN.forward1(p, x);
  const ds = f.pr.map((v, c) => v - (c === y ? 1 : 0)); const dh = f.h.map((_, j) => ds.reduce((s, d, c) => s + d * p.W2[j][c], 0)); const dz = dh.map((v, j) => f.z[j] > 0 ? v : 0);
  const rr = row(box); const c1 = col(rr, ''); const B = bars(c1, [], { signed: true, w: 300, h: 110 }); const code = mono(box, ''); const out = V.say(box);
  const steps = [[ds, 'd_scores = probs − one_hot(y)', 'הנגזרת של סופטמקס ואנטרופיה צולבת יחד: p מינוס y. במחלקה הנכונה שלילי (להגדיל), באחרות חיובי.'], [dh, 'd_h = d_scores @ W2.T', 'כל נוירון נסתר מקבל את סכום ה"אשמה" שלו, לפי המשקלות שמחברים אותו לציונים.'], [dz, 'd_z1 = d_h * (z1 > 0)', 'ReLU מעביר גרדיאנט רק דרך נוירונים שהיו פעילים. האחרים מקבלים אפס.'], [p.W1[0].map((_, j) => x[0] * dz[j]), 'g["W1"] = X.T @ d_z1', 'הגרדיאנט של כל משקל: הקלט שלו כפול הגרדיאנט שהגיע לנוירון (מוצג לשורה הראשונה של W1).']];
  V.stepper(box, 4, i => { B.draw(steps[i][0], steps[i][0].map(v => v >= 0 ? 'var(--c2)' : 'var(--c1)')); code.textContent = steps[i][1]; out.innerHTML = steps[i][2]; }, { speed: 1600 });
};

/* 1.4 gradient check */
W.w2_gradcheck = function (box) {
  V.say(box, 'בדיקת גרדיאנט על משקל אחד: מזיזים אותו ב־±eps ומודדים את השיפוע של ההפסד. <b>שנה את eps</b> והשווה לגרדיאנט שחושב בהפצה לאחור. ובחר "שכח לחלק ב־n" כדי לשתול את הבאג מתרגיל 1.2.');
  const X = S.X.slice(0, 300), y = S.y.slice(0, 300); const p = NN.init(2, 16, 3, 1, 1, 0.01); p.W2 = p.W2.map(r => r.map(v => v * 50)); let le = -5, bug = false, which = 0;
  V.slider(box, 'log10(eps)', -9, -1, 0.5, le, v => { le = v; draw(); });
  V.tabs(box, ['קוד תקין', 'שכח לחלק ב־n'], i => { bug = i === 1; draw(); });
  V.tabs(box, ['W1[0][0]', 'b1[0]', 'W2[0][0]'], i => { which = i; draw(); });
  const out = V.say(box);
  function draw() { const eps = 10 ** le; const key = ['W1', 'b1', 'W2'][which]; const get = q => which === 1 ? q.b1[0] : q[key][0][0]; const set = (q, v) => { if (which === 1) q.b1[0] = v; else q[key][0][0] = v; };
    const an = (r => which === 1 ? r.g.b1[0] : r.g[key][0][0])(NN.lossGrad(p, X, y, 'relu', bug)); const q1 = NN.clone(p), q2 = NN.clone(p); set(q1, get(p) + eps); set(q2, get(p) - eps); const num = (NN.lossGrad(q1, X, y).loss - NN.lossGrad(q2, X, y).loss) / (2 * eps);
    const rel = Math.abs(an - num) / Math.max(1e-12, Math.abs(an) + Math.abs(num));
    out.innerHTML = 'אנליטי: <b class="ltr" style="display:inline-block">' + an.toExponential(4) + '</b> · מספרי: <b class="ltr" style="display:inline-block">' + num.toExponential(4) + '</b> · שגיאה יחסית: <b class="ltr" style="display:inline-block">' + rel.toExponential(1) + '</b> ' + (rel < 1e-7 ? '<span class="good">מצוין</span>' : rel < 1e-4 ? 'סביר' : rel > 1e-2 ? '<span class="bad">כמעט בטוח באג</span>' : '') + (bug ? ' · היחס בין שניהם: <b>' + V.fmt(an / num, 1) + '</b>, בדיוק מספר הדוגמאות.' : le < -7 ? ' · eps קטן מדי: שגיאות עיגול של המחשב מתחילות לשלוט.' : ''); }
  draw();
};

/* 1.5 training with a learning rate */
W.w2_train_spiral = function (box) {
  V.say(box, 'האימון של הסעיף, על הספירלות. בחר קצב למידה ולחץ ▶. שים לב להפסד ההתחלתי: הוא קרוב ל־ln 3 ≈ 1.099.');
  let lr = 1, p, step = 0, timer = null; const losses = [];
  V.slider(box, 'קצב למידה', 0.01, 3, 0.01, lr, v => { lr = v; });
  const rr = row(box); const cv = canvas(rr, 260, 260); const P = window.IM ? window.IM.plot(rr, { w: 300, h: 260 }) : null; const out = V.say(box);
  V.btns(box, [['▶ אמן / עצור', () => { if (timer) { clearInterval(timer); timer = null; } else timer = setInterval(tick, 30); }, 'primary'], ['התחל מחדש', () => { reset(); }, 'ghost']]); cleanup(box, () => clearInterval(timer));
  function reset() { p = NN.init(2, 64, 3, 0); step = 0; losses.length = 0; const r = NN.lossGrad(p, S.X, S.y); losses.push([0, r.loss]); draw(r); }
  function tick() { let r; for (let k = 0; k < 10; k++) { r = NN.lossGrad(p, S.X, S.y); NN.step(p, r.g, lr); step++; } losses.push([step, r.loss]); draw(r); if (step >= 3000) { clearInterval(timer); timer = null; } }
  function draw(r) { NN.paint(cv, x => (f => f.s.indexOf(Math.max(...f.s)))(NN.forward1(p, x)), S.X, S.y, 50); if (P) P.draw([{ pts: losses.map(([s, l]) => [s, Math.min(l, 3)]), color: 'var(--c2)' }], [0, Math.max(100, step)], [0, 3]);
    out.innerHTML = 'צעד <b>' + step + '</b> · הפסד <b>' + V.fmt(r.loss, 3) + '</b> · דיוק <b>' + Math.round(r.acc * 100) + '%</b>' + (step === 0 ? ' · ההפסד ההתחלתי קרוב ל־ln 3: בדיקת שפיות עברה.' : !isFinite(r.loss) || r.loss > 2 ? ' · <span class="bad">קצב גבוה מדי: ההפסד קופץ.</span>' : ''); }
  reset();
};

/* ===== chapter 2 ===== */
W.w2_tensor_shapes = function (box) {
  V.say(box, 'טנזור הוא מערך של ספריית המערכים עם עוד שני כוחות. כאן: <b>שנה את המספרים</b> במטריצה a וראה את <code class="inline-code">a @ a.T</code> ואת <code class="inline-code">d[0, 1].item()</code>.');
  const a = [[1, 2], [3, 4]]; const rr = row(box); const ins = [];
  const g = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 60px)', gap: '4px' } }); rr.appendChild(g);
  a.forEach((r, i) => r.forEach((v, j) => { const inp = el('input', { type: 'number', value: v, style: { width: '60px', textAlign: 'center' } }); inp.oninput = () => { a[i][j] = +inp.value || 0; draw(); }; g.appendChild(inp); }));
  const code = mono(box, '');
  function draw() { const d = [[a[0][0] ** 2 + a[0][1] ** 2, a[0][0] * a[1][0] + a[0][1] * a[1][1]], [0, 0]]; d[1][0] = d[0][1]; d[1][1] = a[1][0] ** 2 + a[1][1] ** 2;
    code.textContent = 'a = torch.tensor([[' + a[0].join('., ') + '.], [' + a[1].join('., ') + '.]])\nprint(a.shape, a.dtype)   # torch.Size([2, 2]) torch.float32\nd = a @ a.T\nprint(d)                  # tensor([[' + d[0].join('., ') + '.], [' + d[1].join('., ') + '.]])\nprint(d[0, 1].item())     # ' + d[0][1] + '.0  = ' + a[0][0] + '·' + a[1][0] + ' + ' + a[0][1] + '·' + a[1][1]; }
  draw();
};

W.w2_autograd = function (box) {
  V.say(box, 'גרף החישוב של y = x² + 2x. בחר x ולחץ <b>backward</b>. אחר כך לחץ שוב בלי לאפס, וראה את המלכודת: הגרדיאנט מצטבר.');
  let x = 3, grad = 0;
  V.slider(box, 'x', -4, 4, 0.5, x, v => { x = v; grad = 0; draw(''); });
  const svg = V.s('svg', { viewBox: '0 0 460 150', width: 460, style: { maxWidth: '100%', direction: 'ltr' } }); const rr = row(box); rr.appendChild(svg); const out = V.say(box);
  V.btns(box, [['y.backward()', () => { grad += 2 * x + 2; draw('backward'); }, 'primary'], ['x.grad.zero_()', () => { grad = 0; draw('zero'); }]]);
  function node(x0, y0, t, sub) { V.s('rect', { x: x0 - 42, y: y0 - 20, width: 84, height: 40, rx: 8, style: { fill: 'var(--surface)', stroke: 'var(--c1)' } }, svg); V.s('text', { x: x0, y: y0 - 2, 'text-anchor': 'middle', 'font-size': 13, style: { fill: 'var(--ink)' }, text: t }, svg); if (sub) V.s('text', { x: x0, y: y0 + 14, 'text-anchor': 'middle', 'font-size': 11, style: { fill: 'var(--c2)' }, text: sub }, svg); }
  function draw(ev) { svg.innerHTML = ''; [[60, 75, 160, 35], [60, 75, 160, 115], [160, 35, 280, 75], [160, 115, 280, 75], [280, 75, 400, 75]].forEach(([a, b, c, d]) => V.s('line', { x1: a + 42, y1: b, x2: c - 42, y2: d, style: { stroke: 'var(--line2)', strokeWidth: 2 } }, svg));
    node(60, 75, 'x = ' + x, ev ? 'grad ' + grad : ''); node(160, 35, 'x² = ' + x * x, ev ? '∂ = 2x = ' + 2 * x : ''); node(160, 115, '2x = ' + 2 * x, ev ? '∂ = 2' : ''); node(280, 75, '+', ''); node(400, 75, 'y = ' + (x * x + 2 * x), ev ? '∂y/∂y = 1' : '');
    out.innerHTML = ev === 'backward' ? 'x.grad = <b>' + grad + '</b>' + (grad !== 2 * x + 2 ? ' — <span class="bad">נצבר!</span> הנגזרת היא ' + (2 * x + 2) + ', אבל backward הוסיף לערך הקיים.' : ' — בדיוק 2x + 2.') : ev === 'zero' ? 'אופס. בלולאת אימון זה optimizer.zero_grad() בתחילת כל צעד.' : 'הנגזרת של x² + 2x היא 2x + 2. ב־x = ' + x + ' זה ' + (2 * x + 2) + '.'; }
  draw('');
};

W.w2_np_vs_torch = function (box) {
  V.say(box, 'ההשוואה של הסעיף: הגרדיאנטים שכתבת ביד מול מה שגזירה אוטומטית הייתה מחזירה (כאן: גזירה מספרית מדויקת כמחליף). בחר "סופטמקס כפול" כדי לראות את הבאג של תרגיל 2.2.');
  const X = S.X.filter((_, i) => i % 5 === 0), y = S.y.filter((_, i) => i % 5 === 0); const p = NN.init(2, 8, 3, 2); p.W2 = p.W2.map(r => r.map(v => v * 120)); let dbl = false;
  V.tabs(box, ['cross_entropy על ציונים גולמיים', 'סופטמקס לפני cross_entropy'], i => { dbl = i === 1; draw(); });
  const out = el('div'); box.appendChild(out);
  const lossOf = q => { let L = 0; X.forEach((x, i) => { let s = NN.forward1(q, x).s; if (dbl) { const m = Math.max(...s); const e = s.map(v => Math.exp(v - m)); const Z = e.reduce((a, b) => a + b); s = e.map(v => v / Z); } const m = Math.max(...s); const e = s.map(v => Math.exp(v - m)); const Z = e.reduce((a, b) => a + b); L -= Math.log(e[y[i]] / Z); }); return L / X.length; };
  function draw() { const an = NN.lossGrad(p, X, y).g; const rows = []; [['W2', 0, 0], ['W2', 3, 1], ['b2', 2], ['W1', 1, 4]].forEach(([k, i, j]) => { const q1 = NN.clone(p), q2 = NN.clone(p); const e = 1e-5; if (j === undefined) { q1[k][i] += e; q2[k][i] -= e; } else { q1[k][i][j] += e; q2[k][i][j] -= e; } const num = (lossOf(q1) - lossOf(q2)) / (2 * e); const a = j === undefined ? an[k][i] : an[k][i][j]; rows.push('<tr><td class="ltr">' + k + '[' + i + (j === undefined ? '' : '][' + j) + ']</td><td>' + V.fmt(a, 5) + '</td><td>' + V.fmt(num, 5) + '</td><td>' + (Math.abs(a - num) < 1e-6 ? '✓' : '<b class="bad">✗</b>') + '</td></tr>'); });
    out.innerHTML = '<table class="mini" style="margin:auto"><tr><th>פרמטר</th><th>ידני (פרק 1)</th><th>הספרייה</th><th></th></tr>' + rows.join('') + '</table><p class="note-small" style="text-align:center">הפסד: ' + V.fmt(lossOf(p), 4) + (dbl ? ' · אין הודעת שגיאה, אבל הגרדיאנטים כבר לא של אותו הפסד, וקטנים בהרבה.' : ' · זהים עד הספרה האחרונה.') + '</p>'; }
  draw();
};

W.w2_gpu_async = function (box) {
  V.say(box, 'המעבד שולח פקודות לכרטיס וממשיך מיד, והכרטיס עובד ברקע. לחץ <b>מדוד</b> עם ובלי synchronize, וראה מה השעון באמת מודד.');
  let sync = true;
  V.tabs(box, ['עם torch.cuda.synchronize()', 'בלי synchronize'], i => { sync = i === 0; draw(); });
  const svg = V.s('svg', { viewBox: '0 0 460 120', width: 460, style: { maxWidth: '100%', direction: 'ltr' } }); const rr = row(box); rr.appendChild(svg); const out = V.say(box);
  function draw() { svg.innerHTML = ''; V.s('text', { x: 4, y: 34, 'font-size': 12, style: { fill: 'var(--ink2)' }, text: 'CPU' }, svg); V.s('text', { x: 4, y: 84, 'font-size': 12, style: { fill: 'var(--ink2)' }, text: 'GPU' }, svg);
    V.s('rect', { x: 50, y: 20, width: 30, height: 22, rx: 4, style: { fill: 'var(--c1)' } }, svg); V.s('text', { x: 65, y: 35, 'text-anchor': 'middle', 'font-size': 10, style: { fill: '#fff' }, text: 'a @ a' }, svg);
    V.s('rect', { x: 80, y: 70, width: 300, height: 22, rx: 4, style: { fill: 'var(--c3)' } }, svg); V.s('text', { x: 230, y: 85, 'text-anchor': 'middle', 'font-size': 11, style: { fill: '#fff' }, text: 'כפל המטריצות בפועל' }, svg);
    if (sync) V.s('rect', { x: 80, y: 20, width: 300, height: 22, rx: 4, style: { fill: 'var(--ink3)', opacity: 0.4 } }, svg);
    const end = sync ? 380 : 80; V.s('line', { x1: 50, x2: end, y1: 108, y2: 108, style: { stroke: 'var(--c2)', strokeWidth: 3 } }, svg); V.s('text', { x: (50 + end) / 2, y: 104, 'text-anchor': 'middle', 'font-size': 11, style: { fill: 'var(--c2)' }, text: 'מה שהשעון מודד' }, svg);
    out.innerHTML = sync ? 'synchronize מחכה שהכרטיס יסיים, ולכן הזמן הוא הזמן האמיתי של החישוב.' : 'בלי synchronize השעון נעצר כשהפקודה <b>נשלחה</b>. המספר קטן באופן מחשיד, וזה תרגיל 2.3.'; }
  draw();
};

W.w2_img_to_tensor = function (box) {
  V.say(box, 'תמונה קטנה של 2 על 3 פיקסלים מהספרייה של מודול 1, בדרך לטנזור שמודל מקבל. עבור על חמשת השלבים וראה את הצורה ואת הערכים.');
  const img = [[[255, 0, 0], [0, 255, 0], [0, 0, 255]], [[40, 40, 40], [128, 128, 128], [255, 255, 255]]]; const mean = [0.485, 0.456, 0.406], std = [0.229, 0.224, 0.225];
  const code = mono(box, ''); const out = V.say(box);
  const fmt = a => JSON.stringify(a, (k, v) => typeof v === 'number' ? Math.round(v * 1000) / 1000 : v).replace(/\],\[/g, '],\n  [');
  const st = [['img = cv2.imread(...)   # shape (2, 3, 3), BGR, uint8', img, 'גובה, רוחב, ערוצים. הפיקסל הראשון (255, 0, 0) הוא כחול, כי הסדר B, G, R.'],
    ['rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)', img.map(r => r.map(p => p.slice().reverse())), 'אותם מספרים, סדר הצבעים הפוך: עכשיו (0, 0, 255) הוא הכחול.'],
    ['t = torch.from_numpy(rgb).permute(2, 0, 1)   # shape (3, 2, 3)', [0, 1, 2].map(c => img.map(r => r.map(p => p[2 - c]))), 'הערוצים עוברים להתחלה: שלוש "תמונות" של 2 על 3, אחת לכל צבע.'],
    ['t = t.float() / 255.0', [0, 1, 2].map(c => img.map(r => r.map(p => p[2 - c] / 255))), 'עשרוני בטווח 0 עד 1.'],
    ['t = (t - mean) / std;  batch = t.unsqueeze(0)   # shape (1, 3, 2, 3)', [[0, 1, 2].map(c => img.map(r => r.map(p => (p[2 - c] / 255 - mean[c]) / std[c])))], 'נרמול לפי ערוץ, ואז ממד מנה בגודל 1 בהתחלה. זה מה שהמודל מקבל.']];
  V.stepper(box, 5, i => { code.textContent = st[i][0] + '\n' + fmt(st[i][1]); out.innerHTML = st[i][2]; }, { speed: 1800 });
};

/* ===== chapter 3 ===== */
W.w2_batches = function (box) {
  V.say(box, 'משטח ההפסד של שני משקלות. הקו הכחול הוא ירידה עם הגרדיאנט המלא, הכתום עם מנות. <b>הקטן את גודל המנה</b>: הצעדים רועשים יותר, אבל בכיוון הנכון בממוצע. ולמטה: כמה צעדים יש בסבב.');
  let bs = 32, N = 54000; const r0 = NN.rng(5); const pts = [...Array(400)].map(() => [NN.randn(r0), NN.randn(r0)]);
  const sr = V.row(box); V.slider(sr, 'גודל מנה', 1, 400, 1, bs, v => { bs = v; draw(); });
  const svg = V.s('svg', { viewBox: '-110 -110 220 220', width: 260 }); const rr = row(box); rr.appendChild(svg); const out = V.say(box);
  const grad = (w, set) => { let g = [0, 0]; set.forEach(([a, b]) => { const e = w[0] * a + w[1] * b - (2 * a - b); g[0] += e * a * 2; g[1] += e * b * 2; }); return g.map(v => v / set.length); };
  function draw() { svg.innerHTML = ''; [20, 45, 70, 95].forEach(rad => V.s('ellipse', { cx: 2 * 40 - 80 + 0, cy: -(-1) * 40 + 0, rx: rad, ry: rad * 0.7, style: { fill: 'none', stroke: 'var(--line2)' } }, svg));
    const path = (full) => { const r = NN.rng(9); let w = [-2, 1.5]; const P = [w.slice()]; for (let s = 0; s < 40; s++) { let set = pts; if (!full) { set = []; for (let k = 0; k < bs; k++) set.push(pts[Math.floor(r() * pts.length)]); } const g = grad(w, set); w = [w[0] - 0.1 * g[0], w[1] - 0.1 * g[1]]; P.push(w.slice()); } return P; };
    [[path(true), 'var(--c1)'], [path(false), 'var(--c2)']].forEach(([P, c]) => V.s('path', { d: 'M' + P.map(([a, b]) => (a * 40 - 0) + ',' + (-b * 40)).join(' L'), style: { fill: 'none', stroke: c, strokeWidth: 2 } }, svg));
    V.s('circle', { cx: 80, cy: 40, r: 4, style: { fill: 'var(--ink)' } }, svg);
    const steps = Math.ceil(N / bs), last = N - (steps - 1) * bs; out.innerHTML = 'על 54,000 תמונות עם מנה של ' + bs + ': <b>' + steps.toLocaleString() + '</b> צעדים בסבב, והמנה האחרונה בגודל <b>' + last + '</b>.'; }
  draw();
};

W.w2_dataloader = function (box) {
  V.say(box, 'מאגר (Dataset) נותן דוגמה אחת לפי מספר. מטען (DataLoader) מערבב את המספרים ואוסף אותם למנות. לחץ <b>סבב חדש</b> כמה פעמים.');
  let bs = 4, shuffle = true, ep = 0; const n = 14;
  V.slider(box, 'batch_size', 2, 7, 1, bs, v => { bs = v; draw(); });
  V.tabs(box, ['shuffle=True', 'shuffle=False'], i => { shuffle = i === 0; draw(); });
  V.btns(box, [['סבב חדש', () => { ep++; draw(); }, 'primary']]);
  const out = el('div', { style: { direction: 'ltr', display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', margin: '10px 0' } }); box.appendChild(out); const say = V.say(box);
  function draw() { const r = NN.rng(ep + 3); const idx = [...Array(n)].map((_, i) => i); if (shuffle) for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    out.innerHTML = ''; for (let b = 0; b < n; b += bs) { const g = el('div', { style: { border: '1px solid var(--line2)', borderRadius: '8px', padding: '6px', display: 'flex', gap: '3px' } }); idx.slice(b, b + bs).forEach(i => g.appendChild(el('span', { style: { width: '26px', height: '26px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.8em', background: ['#4263eb', '#e8590c', '#2f9e44'][i % 3] } }, String(i)))); out.appendChild(g); }
    say.innerHTML = 'סבב ' + (ep + 1) + ': ' + Math.ceil(n / bs) + ' מנות' + (n % bs ? ', האחרונה בגודל ' + (n % bs) : '') + '. ' + (shuffle ? 'בכל סבב סדר אחר.' : 'בלי ערבוב הסדר קבוע, ואם המאגר ממוין לפי מחלקה, כל מנה מכילה מחלקה אחת. זה באג מהטבלה של פרק 11.'); }
  draw();
};

W.w2_mlp_params = function (box) {
  V.say(box, 'כל nn.Linear(a, b) הוא מטריצה של a על b ועוד b הטיות. <b>שנה את הגדלים</b> וראה כמה פרמטרים יש בכל שכבה, וכמה ביחד.');
  let a = 2, h = 64, k = 3;
  const sr = V.row(box); V.slider(sr, 'd_in', 1, 784, 1, a, v => { a = v; draw(); }); V.slider(sr, 'd_hidden', 1, 512, 1, h, v => { h = v; draw(); }); V.slider(sr, 'd_out', 1, 20, 1, k, v => { k = v; draw(); });
  const code = mono(box, '');
  function draw() { const p1 = a * h + h, p2 = h * k + k; code.textContent = 'nn.Sequential(\n  nn.Linear(' + a + ', ' + h + '),   # ' + a + '·' + h + ' + ' + h + ' = ' + p1.toLocaleString() + '\n  nn.ReLU(),            # 0\n  nn.Linear(' + h + ', ' + k + '),   # ' + h + '·' + k + ' + ' + k + ' = ' + p2.toLocaleString() + '\n)                       # total ' + (p1 + p2).toLocaleString(); }
  draw();
};

W.w2_train_loop = function (box) {
  V.say(box, 'חמש השורות של כל לולאת אימון, על משקל אחד w וההפסד (w − 3)². עבור צעד אחר צעד. אחר כך כבה את zero_grad וראה מה קורה.');
  let zero = true, w = 0, grad = 0, line = 0, step = 0; const hist = [];
  V.tabs(box, ['עם optimizer.zero_grad()', 'בלי zero_grad'], i => { zero = i === 0; w = 0; grad = 0; line = 0; step = 0; hist.length = 0; draw(); });
  const lines = ['optimizer.zero_grad()', 'out = model(xb)', 'loss = loss_fn(out, yb)', 'loss.backward()', 'optimizer.step()'];
  const L = el('div', { class: 'mono', style: { direction: 'ltr', fontSize: '.88em', display: 'flex', flexDirection: 'column', gap: '3px', margin: '6px auto', width: 'fit-content' } }); box.appendChild(L); const items = lines.map(t => { const d = el('div', { style: { padding: '3px 8px', borderRadius: '6px' } }); d.textContent = t; L.appendChild(d); return d; });
  const out = V.say(box);
  V.btns(box, [['שורה הבאה', () => next(), 'primary'], ['סבב מלא ×10', () => { for (let i = 0; i < 50; i++) next(); }]]);
  function next() { if (line === 0 && zero) grad = 0; if (line === 3) grad += 2 * (w - 3); if (line === 4) { w -= 0.2 * grad; step++; hist.push(w); } line = (line + 1) % 5; draw(); }
  function draw() { items.forEach((d, i) => { d.style.background = i === line ? 'var(--accent-bg)' : ''; d.style.opacity = !zero && i === 0 ? 0.35 : 1; d.style.textDecoration = !zero && i === 0 ? 'line-through' : ''; });
    out.innerHTML = 'צעד ' + step + ' · w = <b>' + V.fmt(w, 3) + '</b> · grad = <b>' + V.fmt(grad, 3) + '</b> · הפסד ' + V.fmt((w - 3) ** 2, 3) + (step > 3 ? (zero ? ' · מתכנס ל־3.' : ' · <span class="bad">הגרדיאנט מצטבר, ו־w מתנדנד ועובר את 3 שוב ושוב.</span>') : ''); }
  draw();
};

W.w2_optimizers = function (box) {
  V.say(box, 'שלושה אופטימייזרים יוצאים מאותה נקודה על "קערה מוארכת". לחץ ▶ ושנה את קצב הלמידה. SGD מזגזג, תנע מחליק, ו־Adam מתאים צעד לכל כיוון.');
  let lr = 0.05, timer = null, t = 0; const f = (x, y) => 0.5 * x * x + 10 * y * y, g = (x, y) => [x, 20 * y];
  V.slider(box, 'קצב למידה', 0.005, 0.1, 0.005, lr, v => { lr = v; reset(); });
  const svg = V.s('svg', { viewBox: '-120 -60 240 120', width: 360, style: { maxWidth: '100%', direction: 'ltr' } }); const rr = row(box); rr.appendChild(svg); V.legend(box, [['var(--c1)', 'SGD'], ['var(--c2)', 'SGD + תנע'], ['var(--c3)', 'Adam']]); const out = V.say(box);
  V.btns(box, [['▶ / ⏸', () => { if (timer) { clearInterval(timer); timer = null; } else timer = setInterval(tick, 60); }, 'primary'], ['איפוס', () => reset(), 'ghost']]); cleanup(box, () => clearInterval(timer));
  let st;
  function reset() { t = 0; st = [{ p: [-10, 2], P: [[-10, 2]] }, { p: [-10, 2], v: [0, 0], P: [[-10, 2]] }, { p: [-10, 2], m: [0, 0], s: [0, 0], P: [[-10, 2]] }]; draw(); }
  function tick() { t++; st.forEach((o, k) => { const gr = g(...o.p); if (k === 0) o.p = o.p.map((v, i) => v - lr * gr[i]); if (k === 1) { o.v = o.v.map((v, i) => 0.9 * v + gr[i]); o.p = o.p.map((v, i) => v - lr * o.v[i]); } if (k === 2) { o.m = o.m.map((v, i) => 0.9 * v + 0.1 * gr[i]); o.s = o.s.map((v, i) => 0.999 * v + 0.001 * gr[i] ** 2); o.p = o.p.map((v, i) => v - lr * 6 * (o.m[i] / (1 - 0.9 ** t)) / (Math.sqrt(o.s[i] / (1 - 0.999 ** t)) + 1e-8)); } o.P.push(o.p.slice()); }); draw(); if (t > 150) { clearInterval(timer); timer = null; } }
  function draw() { svg.innerHTML = ''; [1, 4, 12, 30, 60].forEach(c => V.s('ellipse', { cx: 0, cy: 0, rx: Math.sqrt(2 * c) * 8, ry: Math.sqrt(c / 10) * 8, style: { fill: 'none', stroke: 'var(--line2)' } }, svg));
    st.forEach((o, k) => V.s('path', { d: 'M' + o.P.map(([x, y]) => (x * 8).toFixed(1) + ',' + (-y * 8).toFixed(1)).join(' L'), style: { fill: 'none', stroke: ['var(--c1)', 'var(--c2)', 'var(--c3)'][k], strokeWidth: 2 } }, svg));
    out.innerHTML = 'צעד ' + t + ' · הפסד: SGD <b>' + V.fmt(f(...st[0].p), 2) + '</b>, תנע <b>' + V.fmt(f(...st[1].p), 2) + '</b>, Adam <b>' + V.fmt(f(...st[2].p), 2) + '</b>' + (f(...st[0].p) > 1e4 ? ' · SGD התפוצץ: הכיוון התלול לא סובל את הקצב.' : ''); }
  reset();
};

W.w2_fashion_params = function (box) {
  V.say(box, 'תמונת פריט לבוש של 28 על 28 משוטחת לווקטור של 784, ועוברת ברשת 784 → 256 → 10. <b>רחף על התמונה</b> כדי לראות איפה כל פיקסל נמצא בווקטור.');
  const g = [...Array(28)].map((_, y) => [...Array(28)].map((_, x) => { const shirt = (y > 5 && y < 25 && x > 8 && x < 20) || (y > 5 && y < 12 && x > 3 && x < 25); return shirt ? 200 - y * 3 : 0; }));
  const rr = row(box); const cv = canvas(rr, 140, 140); const strip = canvas(rr, 392, 40); const out = V.say(box);
  const ctx = cv.getContext('2d'); g.forEach((r, y) => r.forEach((v, x) => { ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(x * 5, y * 5, 5, 5); }));
  const drawStrip = hi => { const c = strip.getContext('2d'); c.clearRect(0, 0, 392, 40); for (let i = 0; i < 784; i++) { const v = g[Math.floor(i / 28)][i % 28]; c.fillStyle = `rgb(${v},${v},${v})`; c.fillRect((i % 392), i < 392 ? 0 : 20, 1, 18); } if (hi !== undefined) { c.fillStyle = '#f03e3e'; c.fillRect(hi % 392 - 1, hi < 392 ? 0 : 20, 3, 18); } };
  cv.addEventListener('mousemove', e => { const r = cv.getBoundingClientRect(); const x = Math.floor((e.clientX - r.left) / r.width * 28), y = Math.floor((e.clientY - r.top) / r.height * 28); const i = y * 28 + x; drawStrip(i); out.innerHTML = 'פיקסל (שורה ' + y + ', עמודה ' + x + ') הוא איבר <b>' + i + '</b> בווקטור: ' + y + '·28 + ' + x + '. שכנים אנכיים רחוקים 28 מקומות זה מזה.'; });
  drawStrip(); out.innerHTML = 'פרמטרים: 784·256 + 256 = <b>200,960</b>, ועוד 256·10 + 10 = <b>2,570</b>. סך הכול <b>203,530</b> (תרגיל 3.2).';
};
})();
