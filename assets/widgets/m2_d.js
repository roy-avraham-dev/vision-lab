/* Module 2 visuals — chapters 10–12: experiments and reproducibility, debugging, the training framework */
(function () {
const W = window.W, V = window.V, NN = window.NN, el = V.el;
const row = box => { const r = V.row(box); r.style.direction = 'ltr'; r.style.justifyContent = 'center'; r.style.alignItems = 'flex-start'; return r; };
const mono = (parent, txt) => { const d = el('div', { class: 'mono', style: { direction: 'ltr', textAlign: 'left', fontSize: '.85em', background: 'var(--code-bg)', padding: '8px 10px', borderRadius: '8px', whiteSpace: 'pre-wrap' } }); d.textContent = txt; parent.appendChild(d); return d; };
const plot = (box, w, h) => window.IM.plot(box, { w: w || 440, h: h || 180 });
const S = NN.spiral();

/* 10.1 seeds, and float sums that depend on order */
W.w2_seeds = function (box) {
  V.say(box, 'שתי גרסאות של "שיפור": בכל אחת הרצנו כמה גרעינים. <b>הוסף גרעינים</b> וראה אם ההבדל בין הגרסאות גדול מהרעש. ולמטה: סכום של אותם מספרים בסדר שונה.');
  let n = 1;
  V.slider(box, 'גרעינים לכל גרסה', 1, 10, 1, n, v => { n = v; draw(); });
  const svg = V.s('svg', { viewBox: '0 0 420 120', width: 420, style: { maxWidth: '100%', direction: 'ltr' } }); const rr = row(box); rr.appendChild(svg); const out = V.say(box);
  const r = NN.rng(4); const A = [...Array(10)].map(() => 91.2 + NN.randn(r) * 0.4), B = [...Array(10)].map(() => 91.5 + NN.randn(r) * 0.4);
  const xs = Float32Array.from([...Array(20000)].map(() => NN.randn(r)));
  const sum32 = arr => { let s = Math.fround(0); for (const v of arr) s = Math.fround(s + v); return s; };
  function draw() { svg.innerHTML = ''; const all = A.concat(B), lo = Math.floor(Math.min(...all) - 0.3), hi = Math.ceil(Math.max(...all) + 0.3); const X = v => 30 + (v - lo) / (hi - lo) * 370; [[A, 35, 'var(--c1)', 'A'], [B, 85, 'var(--c2)', 'B']].forEach(([D, y, c, t]) => { D.slice(0, n).forEach(v => V.s('circle', { cx: X(v), cy: y, r: 6, style: { fill: c, opacity: 0.8 } }, svg)); V.s('text', { x: 6, y: y + 4, 'font-size': 12, style: { fill: c }, text: t }, svg); });
    [...Array(hi - lo + 1)].map((_, i) => lo + i).forEach(v => V.s('text', { x: X(v), y: 115, 'text-anchor': 'middle', 'font-size': 10, style: { fill: 'var(--ink3)' }, text: v + '%' }, svg));
    const m = D => D.slice(0, n).reduce((a, b) => a + b) / n, s = D => n < 2 ? 0 : Math.sqrt(D.slice(0, n).reduce((a, b) => a + (b - m(D)) ** 2, 0) / (n - 1));
    out.innerHTML = 'גרסה A: <b><bdi dir="ltr">' + V.fmt(m(A), 2) + '% ± ' + V.fmt(s(A), 2) + '</span></b> · גרסה B: <b><bdi dir="ltr">' + V.fmt(m(B), 2) + '% ± ' + V.fmt(s(B), 2) + '</span></b>. ' + (n === 1 ? 'ריצה אחת לא מוכיחה כלום.' : '') + '<br>סכום float32 של 20,000 מספרים: בסדר רגיל <span class="mono" style="display:inline-block;direction:ltr">' + sum32(xs).toFixed(5) + '</span>, הפוך <span class="mono" style="display:inline-block;direction:ltr">' + sum32(xs.slice().reverse()).toFixed(5) + '</span>, ממוין <span class="mono" style="display:inline-block;direction:ltr">' + sum32(xs.slice().sort()).toFixed(5) + '</span>.'; }
  draw();
};

/* 10.2 config → hash → run folder */
W.w2_run_hash = function (box) {
  V.say(box, 'כל ההגדרות במילון אחד, ומהן טביעת אצבע של 8 תווים (SHA-1 של ה־JSON הממוין), כמו run_hash של הסעיף. <b>שנה ערך</b>, ואחר כך הפוך את סדר המפתחות: הטביעה לא משתנה.');
  const cfg = { lr: 0.001, batch: 64, epochs: 5, model: 'cnn' }; let rev = false;
  const sr = V.row(box); V.slider(sr, 'lr ×1e-4', 1, 100, 1, 10, v => { cfg.lr = v / 10000; draw(); }); V.slider(sr, 'batch', 16, 256, 16, 64, v => { cfg.batch = v; draw(); }); V.slider(sr, 'epochs', 1, 30, 1, 5, v => { cfg.epochs = v; draw(); });
  V.tabs(box, ['סדר מפתחות רגיל', 'סדר מפתחות הפוך'], i => { rev = i === 1; draw(); });
  const out = mono(box, ''); const say = V.say(box);
  function draw() { const keys = Object.keys(cfg); const shown = '{' + (rev ? keys.slice().reverse() : keys).map(k => JSON.stringify(k) + ': ' + JSON.stringify(cfg[k])).join(', ') + '}'; const sorted = '{' + keys.slice().sort().map(k => JSON.stringify(k) + ': ' + JSON.stringify(cfg[k])).join(', ') + '}'; const h = NN.sha1(sorted).slice(0, 8);
    out.textContent = 'cfg      = ' + shown + '\nsorted   = ' + sorted + '\nrun_hash = ' + h + '\nfolder   = runs/2026-11-15_2214_' + h + '/'; say.innerHTML = 'הטביעה תלויה רק בערכים, לא בסדר שבו כתבת אותם. שתי ריצות עם אותה טביעה הן אותה הגדרה בדיוק.'; }
  draw();
};

/* 10.3 baseline and one change at a time */
W.w2_one_change = function (box) {
  V.say(box, 'יומן ניסויים. קו הבסיס 88.0%. בכל ניסוי בחר מה לשנות, ונסה לגלות איזה שינוי באמת עוזר. כששני דברים משתנים יחד, אי אפשר לדעת.');
  const eff = { 'קצב 3e-4': 0.8, 'הגדלת נתונים': 1.6, 'שכבה נוספת': -0.3, 'השמטה 0.3': 0.2 }; const runs = [['קו בסיס', 88.0]]; const sel = new Set();
  const opts = V.row(box); Object.keys(eff).forEach(k => { const b = V.button(k, () => { sel.has(k) ? sel.delete(k) : sel.add(k); b.classList.toggle('sel'); }, 'sm'); opts.appendChild(b); });
  V.btns(box, [['הרץ ניסוי', () => { const r = NN.rng(runs.length * 13); const v = 88 + [...sel].reduce((s, k) => s + eff[k], 0) + NN.randn(r) * 0.25; runs.push([[...sel].join(' + ') || 'שוב קו בסיס', v]); draw(); }, 'primary']]);
  const out = el('div'); box.appendChild(out); const say = V.say(box);
  function draw() { out.innerHTML = '<table class="mini" style="margin:auto"><tr><th>#</th><th>מה השתנה</th><th>דיוק</th></tr>' + runs.map((r, i) => '<tr><td>' + i + '</td><td>' + r[0] + '</td><td>' + V.fmt(r[1], 1) + '%</td></tr>').join('') + '</table>'; const last = runs[runs.length - 1][0]; say.innerHTML = last.includes('+') ? 'שינית כמה דברים יחד: גם אם השתפר, לא תדע מי מהם עזר.' : runs.length > 1 ? 'שינוי אחד: ההבדל מקו הבסיס הוא שלו (פלוס רעש של בערך ±0.25).' : ''; }
  draw();
};

/* ===== chapter 11 ===== */
W.w2_initial_loss = function (box) {
  V.say(box, 'ההפסד בצעד הראשון צריך להיות בערך ln K. <b>שנה את מספר המחלקות ואת קנה המידה של השכבה האחרונה</b> (כמו הניסוי עם scale 10).');
  let K = 3, sc = 1;
  const sr = V.row(box); V.slider(sr, 'K מחלקות', 2, 1000, 1, K, v => { K = v; draw(); }); V.slider(sr, 'scale של W2', 1, 50, 1, sc, v => { sc = v; draw(); });
  const out = V.say(box);
  function draw() { const r = NN.rng(2); let L = 0; for (let n = 0; n < 200; n++) { const s = [...Array(K)].map(() => NN.randn(r) * 0.05 * sc); const m = Math.max(...s); const Z = s.reduce((a, v) => a + Math.exp(v - m), 0); L -= s[0] - m - Math.log(Z); } L /= 200;
    out.innerHTML = 'ln ' + K + ' = <b>' + V.fmt(Math.log(K), 3) + '</b> · ההפסד ההתחלתי בפועל: <b>' + V.fmt(L, 3) + '</b> ' + (L > 1.3 * Math.log(K) ? '<span class="bad">— רחוק מהצפוי: הרשת מתחילה בטוחה וטועה. בדוק את האתחול.</span>' : '<span class="good">— תקין.</span>'); }
  draw();
};

W.w2_overfit_batch = function (box) {
  V.say(box, 'הבדיקה החשובה ביותר: 16 נקודות, אימון רק עליהן. רשת תקינה מגיעה להפסד קרוב לאפס. בחר "באג בסימן" (תרגיל 11.3) וראה מה הבדיקה תופסת.');
  let bug = false;
  V.tabs(box, ['קוד תקין: p -= lr·g', 'באג: p += lr·g'], i => { bug = i === 1; run(); });
  const P = plot(box, 420, 180); const out = V.say(box);
  function run() { const r = NN.rng(1); const idx = []; while (idx.length < 16) { const i = Math.floor(r() * 300); if (!idx.includes(i)) idx.push(i); } const X = idx.map(i => S.X[i]), y = idx.map(i => S.y[i]); const p = NN.init(2, 64, 3, 0); const L = [];
    for (let s = 0; s <= 300; s++) { const q = NN.lossGrad(p, X, y); L.push([s, Math.min(6, isFinite(q.loss) ? q.loss : 6)]); NN.step(p, q.g, 1, bug ? -1 : 1); }
    P.draw([{ pts: L, color: bug ? 'var(--c2)' : 'var(--c3)', width: 2.5 }], [0, 300], [0, 6]); out.innerHTML = 'הפסד ראשון <b>' + V.fmt(L[0][1], 3) + '</b>, אחרון <b>' + V.fmt(L[300][1], 4) + '</b>. ' + (bug ? '<span class="bad">ההפסד עולה עד שמתפוצץ: הקוד שבור, ותוך שניות אתה יודע את זה.</span>' : 'הקוד מסוגל ללמוד. עכשיו אפשר לאמן על הכול.'); }
  run();
};

W.w2_loss_curves = function (box) {
  V.say(box, 'מילון לקריאת עקומות הפסד. בחר מקרה, וקרא את הסיבה ומה עושים.');
  const r = NN.rng(5); const t = [...Array(60)].map((_, i) => i);
  const C = { 'קצב גבוה מדי': [t.map(i => 1.1 + (i > 3 ? 4 + Math.sin(i) * 2 + NN.randn(r) : i)), 'להקטין קצב פי 3 עד 10, חימום, הגבלת גרדיאנטים'], 'קצב נמוך מדי': [t.map(i => 1.1 - i * 0.008), 'להגדיל קצב, בדיקת טווח (תרגיל 7.4)'], 'שטוח על ln K': [t.map(() => 1.099 + NN.randn(r) * 0.003), 'תוויות מעורבבות, גרדיאנט אפס, נוירונים מתים (11.4, 11.5)'], 'zero_grad נשכח': [t.map(i => 1.1 * Math.exp(-i / 15) + Math.abs(Math.sin(i * 0.7)) * 1.4), 'לאפס בתחילת כל צעד'], 'תקין': [t.map(i => 0.05 + 1.05 * Math.exp(-i / 8) + NN.randn(r) * 0.01), 'להמשיך'] };
  const P = plot(box, 420, 180); const out = V.say(box);
  V.tabs(box, Object.keys(C), (i, l) => { P.draw([{ pts: t.map((x, k) => [x, Math.min(7, C[l][0][k])]), color: 'var(--c2)', width: 2.5 }, { pts: t.map(x => [x, 1.099]), color: 'var(--ink3)', dash: '3 3' }], [0, 59], [0, 7]); out.innerHTML = '<b>' + l + '</b> → ' + C[l][1] + '. (הקו המקווקו הוא ln 3.)'; });
  setTimeout(() => box.querySelector('.tabs button').click(), 0);
};

W.w2_grad_norms = function (box) {
  V.say(box, 'נורמת הגרדיאנט של כל פרמטר אחרי backward. בחר מצב: רגיל, נוירונים מתים (b1 = −5), או שכבה קפואה. ואז הפעל הגבלת נורמה (clip) ל־1.');
  let mode = 0, clip = false;
  V.tabs(box, ['רגיל', 'b1 = −5 (נוירונים מתים)', 'W1 קפוא'], i => { mode = i; draw(); });
  V.tabs(box, ['בלי clip', 'clip_grad_norm_(…, 1.0)'], i => { clip = i === 1; draw(); });
  const svg = V.s('svg', { viewBox: '0 0 420 130', width: 420, style: { maxWidth: '100%', direction: 'ltr' } }); const rr = row(box); rr.appendChild(svg); const out = V.say(box);
  function draw() { const p = NN.init(2, 64, 3, 0); p.W2 = p.W2.map(rw => rw.map(v => v * 300)); if (mode === 1) p.b1 = p.b1.map(() => -5); const { g } = NN.lossGrad(p, S.X, S.y); if (mode === 2) g.W1 = g.W1.map(rw => rw.map(() => NaN));
    const nrm = k => { const a = (Array.isArray(g[k][0]) ? g[k].flat() : g[k]); return a.some(isNaN) ? null : Math.hypot(...a); }; const ks = ['W1', 'b1', 'W2', 'b2']; let ns = ks.map(nrm); const tot = Math.hypot(...ns.filter(v => v !== null)); const f = clip && tot > 1 ? 1 / tot : 1; ns = ns.map(v => v === null ? null : v * f);
    svg.innerHTML = ''; const mx = Math.max(1e-9, ...ns.filter(v => v !== null)); ks.forEach((k, i) => { const v = ns[i]; const h = v === null ? 0 : v / mx * 90; V.s('rect', { x: 30 + i * 95, y: 105 - h, width: 60, height: h, style: { fill: v === 0 || v === null ? 'var(--c2)' : 'var(--c1)' } }, svg); V.s('text', { x: 60 + i * 95, y: 122, 'text-anchor': 'middle', 'font-size': 11, style: { fill: 'var(--ink2)' }, text: k + ': ' + (v === null ? 'NO GRAD' : V.fmt(v, 4)) }, svg); });
    out.innerHTML = 'נורמה כוללת: <b>' + V.fmt(tot, 3) + '</b>' + (clip && tot > 1 ? ' → הוגבלה ל־1 (כל הגרדיאנטים הוקטנו פי ' + V.fmt(tot, 2) + ')' : '') + '. ' + ['', 'כל הנוירונים כבויים: הגרדיאנט של W1 ו־b1 אפס בדיוק, ושל W2 גם, כי h כולו אפס.', 'פרמטר קפוא לא מקבל גרדיאנט כלל: prm.grad is None.'][mode]; }
  draw();
};

W.w2_bug_hunt = function (box) {
  V.say(box, 'סימפטום מהשטח. בחר את הבאג שגורם לו.');
  const Q = [['למידה איטית מאוד, ההפסד נתקע מעל ערך מסוים.', 0], ['ההפסד קופץ למעלה ולמטה בלי סיבה.', 1], ['דיוק הבדיקה משתנה בין הרצות ותלוי בגודל האצווה.', 2], ['ההפסד ההתחלתי רחוק מ־ln K והאימון לא יציב.', 3], ['מודל מאומן מראש עובד גרוע מהצפוי על תמונות מהמצלמה.', 4], ['ההפסד קופץ בכל מעבר בין מחלקות, והרשת שוכחת.', 5]];
  const B = ['סופטמקס לפני CrossEntropyLoss', 'שכחת zero_grad', 'שכחת model.eval()', 'שכחת נרמול פיקסלים', 'BGR מול RGB', 'מטען בלי ערבוב'];
  let k = 0, score = 0; const q = el('div', { class: 'q', style: { fontWeight: 600, margin: '8px 0' } }); box.appendChild(q); const opts = V.row(box); const out = V.say(box);
  function show() { if (k >= Q.length) { q.textContent = 'סיימת: ' + score + ' מתוך ' + Q.length + '.'; opts.innerHTML = ''; return; } q.textContent = (k + 1) + '. ' + Q[k][0]; opts.innerHTML = ''; B.forEach((n, i) => opts.appendChild(V.button(n, () => { const ok = i === Q[k][1]; if (ok) score++; out.innerHTML = (ok ? '<b class="good">נכון.</b>' : '<b class="bad">לא הפעם.</b> התשובה: ' + B[Q[k][1]] + '.'); k++; setTimeout(show, 1000); }, 'sm'))); }
  show();
};

/* ===== chapter 12 ===== */
W.w2_files = function (box) {
  V.say(box, 'שלושת קבצי הפרויקט ומי תלוי במי. <b>לחץ על קובץ</b>.');
  const F = [['metrics.py', 60, 'NumPy ופייתון בלבד: מטריצת בלבול, דוח, EarlyStopping, RunLogger. נבדק בלי כרטיס ובלי אימון.'], ['trainer.py', 220, 'המחלקה Trainer. מקבלת מבחוץ מודל, נתונים, הפסד, אופטימייזר ותזמון. לא יודעת על FashionMNIST.'], ['run_fashion.py', 380, 'ההגדרות, הנתונים, המודל וההפעלה. הקובץ היחיד שמשתנה בין פרויקטים.']];
  const svg = V.s('svg', { viewBox: '0 0 440 110', width: 440, style: { maxWidth: '100%', direction: 'ltr' } }); const rr = row(box); rr.appendChild(svg); const out = V.say(box);
  [[380, 220], [220, 60], [380, 60]].forEach(([a, b]) => V.s('path', { d: `M${a - 55},55 Q${(a + b) / 2},${a - b > 200 ? 0 : 30} ${b + 55},55`, style: { fill: 'none', stroke: 'var(--line2)', strokeWidth: 2 } }, svg));
  F.forEach(([n, x, d]) => { const g = V.s('g', { style: { cursor: 'pointer' } }, svg); V.s('rect', { x: x - 55, y: 40, width: 110, height: 32, rx: 7, style: { fill: 'var(--surface)', stroke: 'var(--c1)' } }, g); V.s('text', { x, y: 60, 'text-anchor': 'middle', 'font-size': 12, style: { fill: 'var(--ink)' }, text: n }, g); g.addEventListener('click', () => { out.innerHTML = '<b>' + n + '</b>: ' + d; }); });
  out.innerHTML = 'החצים: run_fashion משתמש ב־trainer וב־metrics, ו־trainer משתמש ב־metrics.';
};

W.w2_confusion = function (box) {
  V.say(box, 'מטריצת הבלבול של הסעיף. <b>שנה את המספרים</b> (שורה = אמת, עמודה = חיזוי) וראה את הדיוק, הרגישות וה־F1 לכל מחלקה.');
  const names = ['cat', 'dog', 'bird']; const cm = [[3, 1, 0], [0, 4, 0], [1, 1, 2]];
  const g = el('div', { style: { display: 'grid', gridTemplateColumns: '60px repeat(3, 56px)', gap: '4px', direction: 'ltr', margin: '8px auto', width: 'fit-content' } }); box.appendChild(g);
  g.appendChild(el('div', { class: 'note-small' }, 'true \\ pred')); names.forEach(n => g.appendChild(el('b', { style: { textAlign: 'center' } }, n)));
  cm.forEach((r, i) => { g.appendChild(el('b', {}, names[i])); r.forEach((v, j) => { const inp = el('input', { type: 'number', min: 0, value: v, style: { width: '56px', textAlign: 'center', background: i === j ? 'rgba(47,158,68,.15)' : '' } }); inp.oninput = () => { cm[i][j] = Math.max(0, +inp.value || 0); draw(); }; g.appendChild(inp); }); });
  const out = el('div'); box.appendChild(out);
  function draw() { const tp = cm.map((r, i) => r[i]), col = [0, 1, 2].map(j => cm.reduce((s, r) => s + r[j], 0)), rowS = cm.map(r => r.reduce((a, b) => a + b)); const prec = tp.map((t, i) => t / Math.max(col[i], 1)), rec = tp.map((t, i) => t / Math.max(rowS[i], 1)), f1 = prec.map((p, i) => p + rec[i] ? 2 * p * rec[i] / (p + rec[i]) : 0);
    const acc = tp.reduce((a, b) => a + b) / Math.max(1, rowS.reduce((a, b) => a + b));
    out.innerHTML = '<table class="mini" style="margin:auto;direction:ltr"><tr><th>class</th><th>prec</th><th>rec</th><th>f1</th><th>n</th></tr>' + names.map((n, i) => '<tr><td>' + n + '</td><td>' + prec[i].toFixed(3) + '</td><td>' + rec[i].toFixed(3) + '</td><td>' + f1[i].toFixed(3) + '</td><td>' + rowS[i] + '</td></tr>').join('') + '</table><p style="text-align:center">דיוק כללי <b>' + V.fmt(acc * 100, 1) + '%</b> · macro-F1 <b>' + (f1.reduce((a, b) => a + b) / 3).toFixed(3) + '</b></p>'; }
  draw();
};

W.w2_trainer_flow = function (box) {
  V.say(box, 'הלולאה של Trainer.fit, סבב אחרי סבב, על עקומת אימות לדוגמה. עבור על הסבבים וראה מתי נשמר best.pt ומתי עוצרים. סט הבדיקה נגוע רק בסוף.');
  const val = [0.80, 0.85, 0.87, 0.869, 0.871, 0.868, 0.870, 0.869, 0.866]; const pat = 3;
  const out = mono(box, ''); const say = V.say(box);
  V.stepper(box, val.length + 1, s => { const lines = []; let best = null, bad = 0, stopAt = null; for (let e = 0; e < Math.min(s, val.length); e++) { const imp = best === null || val[e] > best + 1e-4; if (imp) { best = val[e]; bad = 0; } else bad++; lines.push('ep ' + e + '  train → validate  val_acc ' + val[e].toFixed(3) + '  log' + (imp ? '  save best.pt' : '') + (bad >= pat ? '  STOP' : '')); if (bad >= pat) { stopAt = e; break; } }
    out.textContent = lines.join('\n') + (stopAt !== null || s > val.length ? '\n\nload best.pt → evaluate on TEST (once) → confusion.csv' : ''); say.innerHTML = stopAt !== null ? 'נעצר בסבב ' + stopAt + ' אחרי ' + pat + ' סבבים בלי שיפור. רק עכשיו, עם המודל הטוב ביותר, נוגעים בסט הבדיקה.' : 'בכל סבב: אימון, אימות, רישום, ובדיקה אם לשמור ואם לעצור.'; }, { speed: 1200 });
};

W.w2_run_config = function (box) {
  V.say(box, 'ההגדרות של run_fashion.py במקום אחד. <b>שנה אותן</b> וראה את תיקיית הריצה ואת הקבצים שיופיעו בה.');
  const cfg = { lr: 0.001, epochs: 30, batch: 128, label_smoothing: 0.1, seed: 0 };
  const sr = V.row(box); V.slider(sr, 'seed', 0, 4, 1, 0, v => { cfg.seed = v; draw(); }); V.slider(sr, 'epochs', 5, 60, 5, 30, v => { cfg.epochs = v; draw(); }); V.slider(sr, 'label_smoothing ×10', 0, 3, 1, 1, v => { cfg.label_smoothing = v / 10; draw(); });
  const out = mono(box, ''); const say = V.say(box);
  function draw() { const s = '{' + Object.keys(cfg).sort().map(k => JSON.stringify(k) + ': ' + JSON.stringify(cfg[k])).join(', ') + '}'; const h = NN.sha1(s).slice(0, 8);
    out.textContent = 'runs/2026-11-15_2214_' + h + '/\n  config.json\n  metrics.csv\n  best.pt\n  confusion.csv'; say.innerHTML = cfg.label_smoothing > 0 ? 'עם החלקת תוויות, הפסד האימות לא יורד הרבה מתחת ל־0.5, וזה צפוי.' : 'בלי החלקה, ההפסד יכול לרדת נמוך יותר, אבל הביטחון של המודל מוגזם יותר.'; }
  draw();
};

W.w2_checklist = function (box) {
  V.say(box, 'רשימת הבדיקה של הסעיף. סמן כל פריט כשבדקת אותו בפרויקט שלך. הסימונים נשמרים.');
  const items = ['ההפסד בצעד הראשון קרוב ל־2.30 ≈ ln 10', 'המסגרת משננת מנה אחת', 'המשך מנקודת שמירה בלי קפיצה בהפסד', 'שתי ריצות עם אותו גרעין על מעבד: אותן תוצאות', 'שלושה גרעינים, ממוצע וסטיית תקן ומטריצת בלבול ב־README'];
  const st = window.Store.map('notes'); const key = 'm2-checklist'; const done = JSON.parse(st[key] || '[]'); const out = V.say(box);
  items.forEach((t, i) => { const l = el('label', { style: { display: 'flex', gap: '8px', alignItems: 'center', margin: '6px 0' } }); const c = el('input', { type: 'checkbox' }); c.checked = !!done[i]; c.onchange = () => { done[i] = c.checked; st[key] = JSON.stringify(done); window.Store.save(); upd(); }; l.append(c, el('span', {}, t)); box.insertBefore(l, out); });
  function upd() { const n = done.filter(Boolean).length; out.innerHTML = n + ' מתוך ' + items.length + (n === items.length ? ' <b class="good">— אפשר להכריז על סיום.</b>' : ''); }
  upd();
};
})();
