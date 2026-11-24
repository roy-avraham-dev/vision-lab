/* Module 2 visuals — chapters 7–9: losses and imbalance, overfitting and regularization, transfer and mixed precision */
(function () {
const W = window.W, V = window.V, NN = window.NN, el = V.el;
const row = box => { const r = V.row(box); r.style.direction = 'ltr'; r.style.justifyContent = 'center'; r.style.alignItems = 'flex-start'; return r; };
const mono = (parent, txt) => { const d = el('div', { class: 'mono', style: { direction: 'ltr', textAlign: 'left', fontSize: '.85em', background: 'var(--code-bg)', padding: '8px 10px', borderRadius: '8px', whiteSpace: 'pre-wrap' } }); d.textContent = txt; parent.appendChild(d); return d; };
const plot = (box, w, h) => window.IM.plot(box, { w: w || 440, h: h || 180 });

/* 7.1 which loss */
W.w2_loss_pick = function (box) {
  V.say(box, 'מצבים מהשטח. לכל אחד, בחר את פונקציית ההפסד.');
  const Q = [['לסווג תמונה לאחת מעשר מחלקות.', 0, 'מחלקה אחת מתוך כמה: אנטרופיה צולבת.'], ['לסמן בכל תמונה אילו מתוך "אדם", "רכב", "כלב" מופיעים (אפשר כמה).', 1, 'כמה תוויות במקביל: אנטרופיה בינארית לכל אחת.'], ['לנבא את העומק של כל פיקסל במטרים.', 2, 'ניבוי מספר: ממוצע ריבועי השגיאה.'], ['לנבא קואורדינטות של תיבה, כשחלק מהתיוגים שגויים לגמרי.', 3, 'עם נקודות חריגות: L1 או הובר, שמענישים פחות שגיאה ענקית.'], ['להחליט אם בתמונה יש רחפן או אין.', 1, 'כן או לא: אנטרופיה בינארית.']];
  const names = ['CrossEntropyLoss', 'BCEWithLogitsLoss', 'MSELoss', 'SmoothL1Loss'];
  let k = 0, score = 0; const q = el('div', { class: 'q', style: { fontWeight: 600, margin: '8px 0' } }); box.appendChild(q); const opts = V.row(box); opts.style.direction = 'ltr'; const out = V.say(box);
  function show() { if (k >= Q.length) { q.textContent = 'סיימת: ' + score + ' מתוך ' + Q.length + '.'; opts.innerHTML = ''; return; } q.textContent = (k + 1) + '. ' + Q[k][0]; opts.innerHTML = ''; names.forEach((n, i) => opts.appendChild(V.button(n, () => { const ok = i === Q[k][1]; if (ok) score++; out.innerHTML = (ok ? '<b class="good">נכון.</b> ' : '<b class="bad">לא הפעם.</b> ') + Q[k][2]; k++; setTimeout(show, 900); }))); }
  show();
};

/* 7.2 class imbalance: weight and threshold */
W.w2_imbalance = function (box) {
  V.say(box, 'הניסוי של הסעיף: 1,900 נקודות רקע ו־100 מטרות. <b>שנה את המשקל של המטרות ואת סף ההחלטה</b>, וראה את שלושת המדדים. אין תשובה אחת נכונה: רק מחיר שונה לכל טעות.');
  const r = NN.rng(3); const X = [], y = []; for (let i = 0; i < 1900; i++) { X.push([NN.randn(r), NN.randn(r)]); y.push(0); } for (let i = 0; i < 100; i++) { X.push([1.5 + NN.randn(r), 1.5 + NN.randn(r)]); y.push(1); }
  let wpos = 1, th = 0.5;
  const sr = V.row(box); V.slider(sr, 'w_pos', 1, 19, 1, wpos, v => { wpos = v; fit(); draw(); }); V.slider(sr, 'סף', 0.05, 0.95, 0.05, th, v => { th = v; draw(); });
  const cv = el('canvas', { width: 260, height: 260, style: { width: '260px', borderRadius: '8px', border: '1px solid var(--line)' } }); const rr = row(box); rr.appendChild(cv); const out = V.say(box);
  let w = [0, 0], b = 0;
  function fit() { w = [0, 0]; b = 0; const sw = y.map(t => t ? wpos : 1), S = sw.reduce((a, c) => a + c); for (let it = 0; it < 600; it++) { let gw = [0, 0], gb = 0; X.forEach((x, i) => { const p = 1 / (1 + Math.exp(-(x[0] * w[0] + x[1] * w[1] + b))); const g = (p - y[i]) * sw[i] / S; gw[0] += g * x[0]; gw[1] += g * x[1]; gb += g; }); w = [w[0] - 0.5 * gw[0], w[1] - 0.5 * gw[1]]; b -= 0.5 * gb; } }
  function draw() { const ctx = cv.getContext('2d'); ctx.clearRect(0, 0, 260, 260); const T = v => (v + 4) / 9 * 260; let tp = 0, fp = 0, fn = 0, ok = 0; const z = Math.log(th / (1 - th));
    X.forEach((x, i) => { const pred = x[0] * w[0] + x[1] * w[1] + b > z; if (pred && y[i]) tp++; if (pred && !y[i]) fp++; if (!pred && y[i]) fn++; if (pred === !!y[i]) ok++; ctx.fillStyle = y[i] ? '#e8590c' : 'rgba(66,99,235,.35)'; ctx.beginPath(); ctx.arc(T(x[0]), 260 - T(x[1]), y[i] ? 2.4 : 1.6, 0, 7); ctx.fill(); });
    ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let k = 0; k <= 1; k++) { const xx = -4 + 9 * k; const yy = (z - b - w[0] * xx) / (w[1] || 1e-9); k ? ctx.lineTo(T(xx), 260 - T(yy)) : ctx.moveTo(T(xx), 260 - T(yy)); } ctx.stroke();
    out.innerHTML = 'דיוק <b>' + V.fmt(ok / 20, 1) + '%</b> · רגישות <b>' + Math.round(tp / 100 * 100) + '%</b> · דיוק ניבוי <b>' + (tp + fp ? Math.round(tp / (tp + fp) * 100) : '—') + '%</b>' + (wpos === 1 && th === 0.5 ? ' · הפסד רגיל: דיוק גבוה, אבל חצי מהמטרות מפוספסות.' : ''); }
  fit(); draw();
};

/* 7.3 focal loss and label smoothing */
W.w2_focal = function (box) {
  V.say(box, 'אנטרופיה צולבת (−ln p) מול הפסד מומקד (1 − p)^γ · (−ln p). <b>שנה את γ ואת p</b>: דוגמה קלה כמעט נמחקת, וקשה כמעט לא נפגעת.');
  let g = 2, p = 0.95;
  const sr = V.row(box); V.slider(sr, 'γ', 0, 5, 0.5, g, v => { g = v; draw(); }); V.slider(sr, 'p למחלקה הנכונה', 0.05, 0.99, 0.01, p, v => { p = v; draw(); });
  const P = plot(box); V.legend(box, [['var(--c1)', 'אנטרופיה צולבת'], ['var(--c2)', 'הפסד מומקד']]); const out = V.say(box);
  function draw() { const xs = [...Array(99)].map((_, i) => (i + 1) / 100); P.draw([{ pts: xs.map(x => [x, -Math.log(x)]), color: 'var(--c1)' }, { pts: xs.map(x => [x, (1 - x) ** g * -Math.log(x)]), color: 'var(--c2)' }, { vline: p, color: 'var(--ink3)', dash: '3 3' }], [0, 1], [0, 4.6]);
    const ce = -Math.log(p), fl = (1 - p) ** g * ce; out.innerHTML = 'ב־p = ' + p + ': אנטרופיה <b>' + V.fmt(ce, 4) + '</b>, מומקד <b>' + V.fmt(fl, 4) + '</b>, יחס <b>' + V.fmt(fl / ce * 100, 2) + '%</b>.'; }
  draw();
};

/* 7.4 learning rate schedule and range test */
W.w2_lr_schedule = function (box) {
  V.say(box, 'חימום וקוסינוס, כמו הפונקציה lr_at של הסעיף. <b>שנה את מספר סבבי החימום ואת אורך האימון</b>, והשווה לקצב קבוע.');
  let warm = 5, total = 50, base = 1e-3;
  const sr = V.row(box); V.slider(sr, 'חימום', 0, 15, 1, warm, v => { warm = v; draw(); }); V.slider(sr, 'סבבים', 10, 100, 5, total, v => { total = v; draw(); });
  const P = plot(box); V.legend(box, [['var(--c1)', 'חימום + קוסינוס'], ['var(--ink3)', 'קבוע']]); const out = V.say(box);
  const lr = s => s < warm ? base * (s + 1) / warm : base * 0.5 * (1 + Math.cos(Math.PI * (s - warm) / Math.max(1, total - warm)));
  function draw() { const xs = [...Array(total)].map((_, i) => i); P.draw([{ pts: xs.map(s => [s, lr(s) * 1000]), color: 'var(--c1)', width: 3 }, { pts: xs.map(s => [s, 1]), color: 'var(--ink3)', dash: '4 3' }], [0, total - 1], [0, 1.1]);
    const mid = warm + Math.round((total - warm) / 2); out.innerHTML = 'בסבב 0: <b>' + lr(0).toExponential(2) + '</b> · בסבב ' + Math.max(0, warm - 1) + ': המקסימום · באמצע הירידה (סבב ' + mid + '): <b>' + lr(mid).toExponential(2) + '</b> · בסבב האחרון: <b>' + lr(total - 1).toExponential(2) + '</b>.'; }
  draw();
};

/* ===== chapter 8 ===== */
const polyData = (n, seed) => { const r = NN.rng(seed); const x = [...Array(n)].map(() => r() * 2 - 1).sort((a, b) => a - b); return { x, y: x.map(v => Math.sin(3 * v) + NN.randn(r) * 0.2) }; };
const xv = [...Array(200)].map((_, i) => -1 + 2 * i / 199), yv = xv.map(v => Math.sin(3 * v));
const mse = (c, xs, ys) => xs.reduce((s, x, i) => s + (NN.polyval(c, x) - ys[i]) ** 2, 0) / xs.length;

W.w2_polyfit = function (box) {
  V.say(box, '15 נקודות רועשות מ־sin(3x), ופולינום שמנסה לעבור דרכן. <b>הגדל את הדרגה</b> והשווה את שגיאת האימון לשגיאת האימות. ואז הגדל את מספר הנקודות (תרגיל 8.1).');
  let deg = 3, n = 15;
  const sr = V.row(box); V.slider(sr, 'דרגה', 1, 12, 1, deg, v => { deg = v; draw(); }); V.slider(sr, 'נקודות אימון', 15, 200, 5, n, v => { n = v; draw(); });
  const P = plot(box, 440, 220); const out = V.say(box);
  function draw() { const D = polyData(n, 1); const c = NN.polyfit(D.x, D.y, deg, 1e-12); const tr = mse(c, D.x, D.y), va = mse(c, xv, yv);
    P.draw([{ pts: xv.map(x => [x, Math.max(-3, Math.min(3, NN.polyval(c, x)))]), color: 'var(--c2)', width: 2.5 }, { pts: xv.map((x, i) => [x, yv[i]]), color: 'var(--ink3)', dash: '4 3' }, { pts: D.x.map((x, i) => [x, D.y[i]]), color: 'transparent', dots: true }], [-1, 1], [-3, 3]);
    out.innerHTML = 'שגיאת אימון <b>' + V.fmt(tr, 4) + '</b> · שגיאת אימות <b>' + (va > 100 ? Math.round(va) : V.fmt(va, 4)) + '</b> · ' + (deg <= 1 ? 'חוסר התאמה: פשוט מדי.' : va > 10 * tr && va > 0.1 ? '<span class="bad">התאמת יתר:</span> עובר דרך הנקודות ומשתולל ביניהן.' : 'מאוזן.'); }
  draw();
};

W.w2_ridge = function (box) {
  V.say(box, 'אותו פולינום בדרגה 12, עם עונש λ על ריבועי המקדמים. <b>הזז את λ</b> וראה את הקו מתעשת ואת המקדם הגדול ביותר מתכווץ.');
  let le = -8;
  V.slider(box, 'log10(λ)', -12, 0, 0.5, le, v => { le = v; draw(); });
  const P = plot(box, 440, 220); const out = V.say(box); const D = polyData(15, 1);
  function draw() { const lam = 10 ** le; const c = NN.polyfit(D.x, D.y, 12, lam); const va = mse(c, xv, yv);
    P.draw([{ pts: xv.map(x => [x, Math.max(-3, Math.min(3, NN.polyval(c, x)))]), color: 'var(--c2)', width: 2.5 }, { pts: xv.map((x, i) => [x, yv[i]]), color: 'var(--ink3)', dash: '4 3' }, { pts: D.x.map((x, i) => [x, D.y[i]]), color: 'transparent', dots: true }], [-1, 1], [-3, 3]);
    out.innerHTML = 'λ = ' + lam.toExponential(0) + ' · שגיאת אימות <b>' + (va > 100 ? Math.round(va) : V.fmt(va, 4)) + '</b> · המקדם הגדול ביותר <b>' + Math.round(Math.max(...c.map(Math.abs))).toLocaleString() + '</b>'; }
  draw();
};

W.w2_dropout = function (box) {
  V.say(box, 'שכבה של 40 נוירונים, כולם עם ערך 1. השמטה מאפסת כל נוירון בהסתברות p, ומגדילה את השורדים פי 1/(1 − p). <b>שנה את p ולחץ "מסכה חדשה"</b>: הממוצע נשאר בערך 1.');
  let p = 0.5, seed = 1, train = true;
  V.slider(box, 'p', 0, 0.9, 0.05, p, v => { p = v; draw(); });
  V.tabs(box, ['model.train()', 'model.eval()'], i => { train = i === 0; draw(); });
  V.btns(box, [['מסכה חדשה', () => { seed++; draw(); }, 'primary']]);
  const svg = V.s('svg', { viewBox: '0 0 400 60', width: 400, style: { maxWidth: '100%' } }); const rr = row(box); rr.appendChild(svg); const out = V.say(box);
  function draw() { const r = NN.rng(seed); svg.innerHTML = ''; let s = 0, z = 0; for (let i = 0; i < 40; i++) { const keep = !train || r() > p; const v = keep ? (train ? 1 / (1 - p) : 1) : 0; s += v; if (!v) z++; V.s('circle', { cx: 10 + i * 9.7, cy: 30, r: 4 + Math.min(6, v * 2), style: { fill: v ? 'var(--c1)' : 'var(--line2)' } }, svg); }
    out.innerHTML = train ? 'אופסו <b>' + z + '</b> מתוך 40, כל שורד מוכפל ב־<b>' + V.fmt(1 / (1 - p), 2) + '</b>, והממוצע <b>' + V.fmt(s / 40, 2) + '</b>.' : 'במצב הערכה לא משמיטים כלום, והממוצע בדיוק 1.'; }
  draw();
};

W.w2_norms = function (box) {
  V.say(box, 'אצווה של 4 דוגמאות עם 3 תכונות. נרמול אצווה מנרמל כל <b>עמודה</b> (תכונה לאורך הדוגמאות), נרמול שכבה כל <b>שורה</b> (דוגמה לאורך התכונות). נסה אצווה של דוגמה אחת.');
  let mode = 0, bs = 4; const r = NN.rng(4); const X0 = [...Array(4)].map(() => [...Array(3)].map(() => 5 + 3 * NN.randn(r)));
  V.tabs(box, ['BatchNorm (axis=0)', 'LayerNorm (axis=1)'], i => { mode = i; draw(); });
  V.tabs(box, ['אצווה של 4', 'אצווה של 1'], i => { bs = i ? 1 : 4; draw(); });
  const out = el('div'); box.appendChild(out); const say = V.say(box);
  function draw() { const X = X0.slice(0, bs); const N = X.map((rw, i) => rw.map((v, j) => { const vals = mode === 0 ? X.map(q => q[j]) : rw; const m = vals.reduce((a, b) => a + b) / vals.length; const s = Math.sqrt(vals.reduce((a, b) => a + (b - m) ** 2, 0) / vals.length + 1e-5); return (v - m) / s; }));
    const cell = (v, i, j) => '<td style="background:' + (mode === 0 ? `hsla(${j * 120},60%,60%,.18)` : `hsla(${i * 90},60%,60%,.18)`) + '">' + V.fmt(v, 2) + '</td>';
    out.innerHTML = '<div style="display:flex;gap:16px;justify-content:center;direction:ltr"><table class="mini">' + X.map((rw, i) => '<tr>' + rw.map((v, j) => cell(v, i, j)).join('') + '</tr>').join('') + '</table><span style="align-self:center">→</span><table class="mini">' + N.map((rw, i) => '<tr>' + rw.map((v, j) => cell(v, i, j)).join('') + '</tr>').join('') + '</table></div>';
    say.innerHTML = mode === 0 ? (bs === 1 ? '<span class="bad">עם דוגמה אחת, כל תכונה שווה לממוצע שלה, והפלט כולו אפסים.</span> כל המידע נעלם.' : 'הצבע מסמן מה מנורמל יחד: כל עמודה. הנרמול של דוגמה תלוי בדוגמאות האחרות באצווה.') : 'כל שורה מנורמלת לבד, ולכן התוצאה לא תלויה בגודל האצווה (תרגיל 8.3).'; }
  draw();
};

W.w2_augment = function (box) {
  V.say(box, 'הגדלת נתונים: בכל פעם שהתמונה נטענת, היא עוברת שינוי אקראי. לחץ <b>טען שוב</b> כמה פעמים. ואז נסה את "היפוך אנכי" על הספרה 6.');
  let seed = 1, mode = 0;
  V.tabs(box, ['חתוך + היפוך + צבע', 'היפוך אנכי של 6'], i => { mode = i; draw(); });
  V.btns(box, [['טען שוב', () => { seed++; draw(); }, 'primary']]);
  const cv = el('canvas', { width: 160, height: 160, style: { width: '200px', borderRadius: '8px', border: '1px solid var(--line)' } }); const rr = row(box); rr.appendChild(cv); const out = V.say(box);
  function draw() { const r = NN.rng(seed * 7); const c = cv.getContext('2d'); c.save(); c.clearRect(0, 0, 160, 160);
    if (mode === 0) { const sc = 0.6 + 0.4 * r(), flip = r() < 0.5, br = 0.7 + 0.6 * r(); c.fillStyle = `rgb(${Math.min(255, 200 * br)},${Math.min(255, 230 * br)},${Math.min(255, 255 * br)})`; c.fillRect(0, 0, 160, 160); c.translate(80, 80); c.scale((flip ? -1 : 1) / sc, 1 / sc); c.translate(-80 + (r() - 0.5) * 40, -80 + (r() - 0.5) * 40);
      c.fillStyle = `rgb(${Math.min(255, 230 * br)},${Math.min(255, 120 * br)},40)`; c.beginPath(); c.ellipse(80, 95, 38, 28, 0, 0, 7); c.fill(); c.beginPath(); c.arc(112, 70, 18, 0, 7); c.fill(); c.beginPath(); c.moveTo(104, 56); c.lineTo(108, 38); c.lineTo(116, 54); c.fill(); c.fillStyle = '#222'; c.beginPath(); c.arc(117, 68, 2.5, 0, 7); c.fill();
      out.innerHTML = 'חיתוך ' + Math.round(sc * 100) + '% · ' + (flip ? 'הפוך שמאל־ימין' : 'בלי היפוך') + ' · בהירות ×' + V.fmt(br, 2) + '. עדיין חתול, והתווית לא השתנתה.'; }
    else { const fl = seed % 2 === 0; c.fillStyle = '#fff'; c.fillRect(0, 0, 160, 160); c.translate(80, 80); if (fl) c.scale(1, -1); c.rotate(fl ? Math.PI : 0); c.fillStyle = '#111'; c.font = 'bold 120px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('6', 0, 6);
      out.innerHTML = fl ? '<span class="bad">היפוך אנכי הפך את 6 ל־9.</span> הגדלה חייבת לשמור על התווית.' : 'לחץ "טען שוב" כדי להפעיל היפוך אנכי.'; }
    c.restore(); }
  draw();
};

W.w2_early_stop = function (box) {
  V.say(box, 'עקומת האימות של הסעיף. <b>שנה את הסבלנות</b> וראה מתי האימון נעצר ואיזה סבב נשמר כטוב ביותר.');
  const val = [1.0, 0.8, 0.65, 0.58, 0.55, 0.56, 0.54, 0.57, 0.59, 0.6, 0.62, 0.63], tr = [1.0, 0.75, 0.58, 0.47, 0.4, 0.34, 0.3, 0.26, 0.23, 0.2, 0.18, 0.16]; let pat = 3;
  V.slider(box, 'סבלנות', 1, 6, 1, pat, v => { pat = v; draw(); });
  const P = plot(box, 440, 200); V.legend(box, [['var(--c1)', 'אימון'], ['var(--c2)', 'אימות']]); const out = V.say(box);
  function draw() { let best = Infinity, bad = 0, be = 0, stop = val.length - 1; for (let e = 0; e < val.length; e++) { if (val[e] < best - 1e-4) { best = val[e]; be = e; bad = 0; } else { bad++; if (bad >= pat) { stop = e; break; } } }
    P.draw([{ pts: tr.map((v, i) => [i, v]), color: 'var(--c1)', dots: true }, { pts: val.map((v, i) => [i, v]), color: 'var(--c2)', dots: true }, { vline: stop, color: 'var(--ink3)', dash: '4 3', label: 'stop ' + stop }, { vline: be, color: 'var(--c3)', label: 'best ' + be }], [0, 11], [0, 1.05]);
    out.innerHTML = 'עוצרים בסבב <b>' + stop + '</b>, והמודל שנשמר הוא מסבב <b>' + be + '</b> (הפסד ' + val[be] + '). ' + (pat === 1 ? 'סבלנות 1 עוצרת מוקדם מדי: בסבב 5 ההפסד עלה מעט, ובסבב 6 ירד שוב.' : ''); }
  draw();
};

/* ===== chapter 9 ===== */
W.w2_transfer = function (box) {
  V.say(box, 'ResNet-18 מאומן, וראש חדש של 10 מחלקות. בחר אסטרטגיה וראה מה מתאמן (בכתום) ומה קפוא (באפור).');
  let st = 0; const blocks = [['גזע', 9536], ['שלב 1', 147968], ['שלב 2', 525568], ['שלב 3', 2099712], ['שלב 4', 8393728], ['ראש חדש', 5130]];
  V.tabs(box, ['חילוץ תכונות', 'כוונון בשני שלבים: שלב ב׳', 'כוונון מלא'], i => { st = i; draw(); });
  const svg = V.s('svg', { viewBox: '0 0 460 90', width: 460, style: { maxWidth: '100%', direction: 'ltr' } }); const rr = row(box); rr.appendChild(svg); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const tot = blocks.reduce((s, b) => s + b[1], 0); let tr = 0;
    blocks.forEach(([n, p], i) => { const train = i === 5 || st === 2 || (st === 1); if (train) tr += p; const x = 5 + i * 76; V.s('rect', { x, y: 15, width: 70, height: 40, rx: 6, style: { fill: train ? (st === 1 && i < 5 ? 'rgba(232,89,12,.35)' : 'var(--c2)') : 'var(--line2)' } }, svg); V.s('text', { x: x + 35, y: 39, 'text-anchor': 'middle', 'font-size': 11, style: { fill: '#222' }, text: n }, svg); V.s('text', { x: x + 35, y: 72, 'text-anchor': 'middle', 'font-size': 9, style: { fill: 'var(--ink3)' }, text: p.toLocaleString() }, svg); });
    out.innerHTML = 'מתאמנים <b>' + tr.toLocaleString() + '</b> מתוך ' + tot.toLocaleString() + ' (' + V.fmt(tr / tot * 100, tr / tot < 0.01 ? 2 : 0) + '%). ' + ['רק הראש: 5,130 פרמטרים, פחות מחצי אחוז.', 'הכול משתחרר, אבל לגוף קצב קטן פי 10 (כתום בהיר) ולראש קצב מלא.', 'הכול מתאמן, עדיין מתחילים מהמשקלים המאומנים.'][st]; }
  draw();
};

W.w2_fp16 = function (box) {
  V.say(box, 'הקלד מספר וראה איך הוא נשמר ב־float16 וב־bfloat16. נסה 70000, ‏0.0001 + 1, ו־2e-8. ואז הפעל הכפלה (loss scaling) כדי להציל גרדיאנט קטן.');
  let v = '2e-8', scale = 0;
  const inp = el('input', { type: 'text', value: v, style: { width: '160px', direction: 'ltr' } }); inp.oninput = () => { v = inp.value; draw(); }; const r = V.row(box); r.append(el('span', {}, 'ערך: '), inp);
  V.slider(box, 'הכפלה: 2^', 0, 20, 1, scale, x => { scale = x; draw(); });
  V.tabs(box, ['70000', '1 + 1e-4', '2e-8', '256 + 0.1'], i => { inp.value = ['70000', '1 + 1e-4', '2e-8', '256 + 0.1'][i]; v = inp.value; draw(); });
  const out = mono(box, ''); const say = V.say(box);
  function draw() { let x; try { x = Function('"use strict";return (' + v.replace(/[^0-9e+\-.* ()]/g, '') + ')')(); } catch (e) { x = NaN; } const s = 2 ** scale;
    const f16 = v.includes('+') ? v.split('+').map(t => NN.f16(+t)).reduce((a, b) => NN.f16(a + b)) : NN.f16(x * s) / s, b16 = NN.bf16(x);
    out.textContent = 'float32 : ' + x + '\nfloat16 : ' + f16 + (scale && !v.includes('+') ? '   (×2^' + scale + ' לפני ההמרה, ÷ אחרי)' : '') + '\nbfloat16: ' + b16;
    say.innerHTML = !isFinite(f16) ? '<b class="bad">גלישה מלמעלה:</b> מעל 65,504 הופך לאינסוף.' : x !== 0 && f16 === 0 ? '<b class="bad">גלישה מלמטה:</b> הגרדיאנט הפך לאפס. הגדל את ההכפלה.' : v.includes('+') && f16 !== x ? '<b>דיוק:</b> התוספת קטנה מחצי המרווח בין מספרים שכנים, ופשוט נעלמה.' : scale && x < 1e-6 ? '<b class="good">ניצל:</b> ההכפלה הכניסה את הערך לטווח, והחלוקה בדיוק מלא מחזירה אותו. זה GradScaler.' : 'bfloat16 שומר על הטווח של float32, במחיר של פחות ספרות.'; }
  draw();
};
})();
