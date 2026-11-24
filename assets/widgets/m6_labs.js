/* Module 6 — lab-grade demos (an ADDITION). Each W.<id> here replaces the simpler original widget of the same id. */
(function () {
const W = window.W, V = window.V, el = V.el, D4 = window.D4; const { F, ltr, flex, colm, canvas, table, row, txt, rng, randn } = D4;
const pct = (a, p) => { const s = a.slice().sort((x, y) => x - y); const i = (s.length - 1) * p / 100, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); };
const SC = ['#1c7ed6', '#e8590c', '#2f9e44', '#ae3ec9', '#f08c00', '#0c8599'];
/* a discrete-event pipeline: stages with times (ms, optional jitter), frames arriving every `period` ms (0 = a file: as fast as possible).
   mode 'seq': one loop runs all stages per frame; 'par': one thread per stage, queues between stages (size qmax, 0 = unbounded;
   'drop' = a full queue throws the OLDEST item away, chapter 7). Returns per frame: arrival, start/end per stage, dropped. */
function simPipe(T, o) { const r = rng(o.seed || 1); const N = o.n || 40, per = o.period || 0; const st = (i) => Math.max(0.2, T[i] * (1 + (o.jit || 0) * randn(r)));
  const fr = []; for (let k = 0; k < N; k++) fr.push({ k, arr: per ? k * per : 0, s: [], e: [], drop: false });
  if (o.mode === 'seq') { let tcur = 0; let next = 0; while (next < N) { let k = next; if (per) { /* take the newest frame that has arrived (a camera keeps only the latest) */ const avail = fr.filter(f => f.arr <= tcur && f.k >= next); if (!avail.length) { tcur = fr[next].arr; continue; } k = avail[avail.length - 1].k; for (let j = next; j < k; j++) fr[j].drop = true; } else k = next; let t = Math.max(tcur, fr[k].arr); T.forEach((_, i) => { fr[k].s[i] = t; t += st(i); fr[k].e[i] = t; }); tcur = t; next = k + 1; } return fr; }
  const free = T.map(() => 0); const q = T.map(() => []);
  // process in time order with a simple loop per stage: stage i takes frames in order of availability
  let ready = fr.map(f => ({ f, t: f.arr })); for (let i = 0; i < T.length; i++) { let tfree = 0; const out = []; const items = ready.slice().sort((a, b) => a.t - b.t);
    let idx = 0; const queue = []; let curT = 0;
    while (idx < items.length || queue.length) { if (!queue.length) { queue.push(items[idx]); curT = Math.max(curT, items[idx].t); idx++; }
      // everything that arrived while the stage was busy joins the queue
      while (idx < items.length && items[idx].t <= Math.max(curT, tfree)) { queue.push(items[idx]); idx++; if (o.qmax && queue.length > o.qmax) { const d = queue.shift(); d.f.drop = true; } }
      const it = queue.shift(); if (!it) continue; const t0 = Math.max(tfree, it.t); it.f.s[i] = t0; const t1 = t0 + st(i); it.f.e[i] = t1; tfree = t1; curT = t1; out.push({ f: it.f, t: t1 }); }
    ready = out; }
  return fr; }
window.SIM6 = { simPipe, pct };

/* 1.1 — three different numbers */
W.w6_pipe_latency = function (box) {
  V.say(box, 'צינור של ארבעה שלבים, ופריימים שנכנסים אליו. כל שורה בתרשים היא פריים; הצבעים הם השלבים; הקו האפור הוא הזמן שהפריים <b>חיכה</b>. <b>שנה זמנים</b>, ועבור בין לולאה אחת לתהליכון לכל שלב, ובין קובץ (כמה שיותר מהר) למצלמה (פריים כל 33 מילישניות). מתחת: השהייה, תפוקה, ופריימים שאבדו.');
  const T = [5, 40, 5, 4], names = ['פענוח ועיבוד מקדים', 'מודל', 'עיבוד מאוחר', 'עוקב וציור']; let mode = 'seq', cam = false, jit = 0.1, qmax = 0;
  const r1 = row(box); T.forEach((v, i) => V.slider(r1, names[i], 0, 60, 1, v, x => { T[i] = x; draw(); }, x => x + ' מ"ש'));
  const r2 = row(box); V.tabs(r2, ['לולאה אחת', 'תהליכון לכל שלב'], i => { mode = i ? 'par' : 'seq'; draw(); }); V.tabs(r2, ['קובץ', 'מצלמה, 30 בשנייה'], i => { cam = !!i; draw(); }); V.tabs(r2, ['תור בלי גבול', 'תור של פריים אחד, זורק ישן'], i => { qmax = i ? 1 : 0; draw(); }); V.slider(r2, 'תנודתיות', 0, 0.5, 0.05, jit, v => { jit = v; draw(); }, v => F(v * 100, 0) + '%');
  V.btns(box, [['תרגיל 1.1: ‏5, ‏40, ‏5', () => { [5, 40, 5, 0].forEach((v, i) => T[i] = v); jit = 0; draw(); }]]);
  const cv = canvas(box, 760, 290, 760); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const fr = simPipe(T, { mode, period: cam ? 33.3 : 0, jit, qmax, n: 40 }); const done = fr.filter(f => !f.drop && f.e.length === T.length); const lat = done.map(f => f.e[T.length - 1] - (cam ? f.arr : f.s[0])); const tEnd = Math.max(...done.map(f => f.e[T.length - 1])); const tp = done.length > 1 ? (done.length - 1) / ((tEnd - done[0].e[T.length - 1]) / 1000) : 0;
    const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 290); const show = fr.slice(0, 12); const span = Math.max(...show.filter(f => f.e.length).map(f => f.e[T.length - 1] || 0), 1) * 1.02; const X = t => 70 + t / span * 680;
    show.forEach((f, k) => { const Y = 14 + k * 21; txt(x, 'פריים ' + (k + 1), 64, Y + 12, '#495057', 10, 'right'); if (f.drop || !f.e.length) { x.fillStyle = '#ffe3e3'; x.fillRect(X(f.arr), Y + 2, 40, 14); txt(x, 'נזרק', X(f.arr) + 20, Y + 13, '#e03131', 10, 'center', true); return; } x.strokeStyle = '#adb5bd'; x.beginPath(); x.moveTo(X(f.arr), Y + 9); x.lineTo(X(f.s[0]), Y + 9); x.stroke(); T.forEach((_, i) => { if (f.e[i] - f.s[i] <= 0) return; if (i && f.s[i] > f.e[i - 1] + 0.01) { x.beginPath(); x.moveTo(X(f.e[i - 1]), Y + 9); x.lineTo(X(f.s[i]), Y + 9); x.stroke(); } x.fillStyle = SC[i]; x.fillRect(X(f.s[i]), Y + 2, Math.max(1, X(f.e[i]) - X(f.s[i])), 14); }); x.fillStyle = '#212529'; x.beginPath(); x.arc(X(f.arr), Y + 9, 2.5, 0, 7); x.fill(); });
    names.forEach((n, i) => { x.fillStyle = SC[i]; x.fillRect(750 - (i + 1) * 150, 272, 10, 10); txt(x, n, 745 - i * 150 - 14, 281, '#495057', 10, 'right'); });
    tb.innerHTML = table(['', 'השהייה: חציון', 'אחוזון 95', 'תפוקה (פריימים בשנייה)', 'פריימים שנזרקו מתוך 40'], [['', F(pct(lat, 50), 1) + ' מ"ש', F(pct(lat, 95), 1) + ' מ"ש', '<b>' + F(tp, 1) + '</b>', fr.filter(f => f.drop).length]]);
    const sum = T.reduce((a, b) => a + b, 0), mx = Math.max(...T);
    out.innerHTML = (mode === 'seq' ? 'בלולאה אחת: תפוקה של 1 חלקי הסכום (' + F(1000 / sum, 1) + ' בשנייה), והשהייה היא הסכום (' + sum + ' מ"ש). ' : 'בתהליכון לכל שלב: התפוקה נקבעת בשלב האיטי (' + F(1000 / mx, 1) + ' בשנייה), אבל ההשהייה <b>עדיין</b> לפחות הסכום — כל פריים עובר בכל השלבים. ') + (cam ? (sum > 33.3 || mx > 33.3 ? 'המצלמה מספקת פריים כל 33 מ"ש, והצינור לא עומד בקצב — ' + (qmax || mode === 'seq' ? 'פריימים נזרקים, אבל ההשהייה נשארת קטנה.' : '<b>התור גדל בלי סוף, וההשהייה איתו</b> — כל פריים מחכה לכל מי שלפניו. זה פרק 7.') : 'הצינור עומד בקצב — כל פריים מעובד.') : (mode === 'par' && !qmax ? 'מקובץ, עם תור בלי גבול: הקורא רץ קדימה ומציף את התור שלפני המודל — התפוקה מרבית, אבל כל פריים מחכה בתור מאות מילישניות. לארכיון זה בסדר; לזמן אמת — לא.' : 'מקובץ, כל פריים זמין מיד — רואים את התפוקה המרבית.')) + (jit ? ' התנודתיות מרחיקה את אחוזון 95 מהחציון.' : ''); }
  draw();
};

/* 1.2 — a real measurement, here in the browser */
W.w6_warmup = function (box) {
  V.say(box, 'מדידה <b>אמיתית</b>, כאן בדפדפן: "מודל" קטן — קונבולוציה של 3 על 3, שמונה ערוצים פנימה ושמונה החוצה, על תמונה של 96 על 96 — כתוב בשפת הדפדפן. <b>לחץ "מדוד"</b>: הריצות הראשונות כוללות את הקימפול של המנוע לקוד מכונה — החימום של הדפדפן. סמן "<b>עומס ברקע</b>" כדי להפעיל תהליכון שני שמעסיק גרעין (תרגיל 1.4).');
  let N = 60, warm = 5, load = false, wk = null; const r1 = row(box); V.slider(r1, 'ריצות', 20, 400, 10, N, v => N = v); V.slider(r1, 'ריצות חימום שמושלכות', 0, 20, 1, warm, v => { warm = v; if (last) draw(last); }); const ck = el('label', { html: '<input type="checkbox"> עומס ברקע: תהליכון שמעסיק גרעין' }); ck.querySelector('input').onchange = e => { load = e.target.checked; if (load) { try { const b = new Blob(['let x=0;for(;;){x+=Math.sqrt(x+1)}'], { type: 'text/javascript' }); wk = new Worker(URL.createObjectURL(b)); } catch (er) { wk = null; } } else if (wk) { wk.terminate(); wk = null; } }; r1.appendChild(ck); V.btns(r1, [['מדוד ←', () => run(), 'primary']]);
  const cv = canvas(box, 760, 230, 760); const tb = el('div'); box.appendChild(tb); const out = V.say(box); let last = null, hist = [];
  const C = 8, Hh = 96, Ww = 96; const inp = new Float32Array(C * Hh * Ww).map((_, i) => Math.sin(i * 0.37)), wts = new Float32Array(C * C * 9).map((_, i) => Math.cos(i * 0.11) * 0.1), outp = new Float32Array(C * Hh * Ww);
  function conv() { for (let co = 0; co < C; co++) for (let y = 1; y < Hh - 1; y++) for (let x = 1; x < Ww - 1; x++) { let s = 0; for (let ci = 0; ci < C; ci++) { const b = ci * Hh * Ww, wb = (co * C + ci) * 9; for (let dy = -1; dy <= 1; dy++) { const r = b + (y + dy) * Ww + x; s += inp[r - 1] * wts[wb + (dy + 1) * 3] + inp[r] * wts[wb + (dy + 1) * 3 + 1] + inp[r + 1] * wts[wb + (dy + 1) * 3 + 2]; } } outp[co * Hh * Ww + y * Ww + x] = s > 0 ? s : 0; } }
  function run() { const ts = []; let i = 0; out.innerHTML = 'מודד...'; const step = () => { const t1 = performance.now() + 30; while (i < N && performance.now() < t1) { const t0 = performance.now(); conv(); ts.push(performance.now() - t0); i++; } if (i < N) setTimeout(step, 0); else { last = { ts, load }; hist.push({ ts, load }); draw(last); } }; setTimeout(step, 30); }
  function draw(L) { const ts = L.ts, M = ts.slice(warm); const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 230); const mx = Math.max(...ts) * 1.08; const X = i => 40 + i / Math.max(1, ts.length - 1) * 700, Y = v => 200 - v / mx * 180; x.strokeStyle = '#dee2e6'; x.strokeRect(40, 20, 700, 180); [0, mx / 2, mx].forEach(v => txt(x, F(v, 1), 36, Y(v) + 4, '#868e96', 10, 'right'));
    if (warm) { x.fillStyle = 'rgba(250,176,5,.18)'; x.fillRect(40, 20, X(warm) - 40, 180); txt(x, 'חימום', (40 + X(warm)) / 2, 34, '#e67700', 10, 'center', true); }
    ts.forEach((v, i) => { x.fillStyle = i < warm ? '#f08c00' : '#1c7ed6'; x.beginPath(); x.arc(X(i), Y(v), 2.5, 0, 7); x.fill(); }); const med = pct(M, 50), p95 = pct(M, 95), p99 = pct(M, 99);
    [[med, '#2f9e44', 'חציון'], [p99, '#e03131', 'אחוזון 99']].forEach(([v, c, n]) => { x.strokeStyle = c; x.setLineDash([4, 3]); x.beginPath(); x.moveTo(40, Y(v)); x.lineTo(740, Y(v)); x.stroke(); x.setLineDash([]); txt(x, n, 736, Y(v) - 3, c, 10, 'right', true); }); txt(x, 'מילישניות לריצה', 44, 14, '#868e96', 10, 'left');
    const mean = M.reduce((a, b) => a + b, 0) / M.length;
    tb.innerHTML = table(['מדידה', 'ריצה ראשונה', 'ממוצע', 'חציון', 'אחוזון 95', 'אחוזון 99', 'מקסימום'], hist.slice(-4).map((h, k) => { const m = h.ts.slice(warm); return ['#' + (hist.length - Math.min(4, hist.length) + k + 1) + (h.load ? ' (עם עומס)' : ''), F(h.ts[0], 2), F(m.reduce((a, b) => a + b, 0) / m.length, 2), '<b>' + F(pct(m, 50), 2) + '</b>', F(pct(m, 95), 2), F(pct(m, 99), 2), F(Math.max(...m), 2)]; })) + '<div class="note-small" style="text-align:center">אלה מדידות של המחשב שלך, עכשיו — כל לחיצה נותנת מספרים קצת אחרים. בקורס (מודל אמיתי במנוע ריצה, מעבד עם שני גרעינים): ריצה ראשונה 16.0, חציון 11.9, אחוזון 99 של 14.6; עם עומס — חציון 30.7 ואחוזון 99 של 61.6.</div>';
    const first = ts[0]; out.innerHTML = 'הריצה הראשונה: ' + F(first, 2) + ' מ"ש, החציון אחרי החימום: ' + F(med, 2) + ' — ' + (first > med * 1.3 ? '<b>פי ' + F(first / med, 1) + '</b>. בלי חימום, המדידה הייתה מדווחת על מודל איטי יותר.' : 'הפעם החימום קטן (המנוע כבר קימפל את הפונקציה בלחיצה קודמת — לחץ שוב אחרי רענון הדף).') + ' הממוצע (' + F(mean, 2) + ') נמשך אחרי כל ריצה שנתקעה; החציון לא. ' + (M.length < 100 ? 'עם ' + M.length + ' ריצות, אחוזון 99 הוא בעצם הריצה האיטית ביותר — מדוד כמה פעמים וראה כמה הוא קופץ (תרגיל 1.2). ' : '') + (L.load ? 'עם העומס ברקע — השווה את השורות בטבלה: הזנב (אחוזון 99) מגיב יותר מהחציון.' : ''); }
};

/* 1.3 — batching: throughput against latency */
W.w6_batch = function (box) {
  V.say(box, 'אצווה: כמה תמונות במעבר אחד. בלשונית הראשונה — המדידה של הקורס על מעבד עם שני גרעינים. בשנייה — מודל של כרטיס מסך עם אלפי ליבות, שבו תמונה אחת לא ממלאת את החומרה. סמן "<b>מצלמה אחת, בזמן אמת</b>": אצווה של b תמונות מחכה ל־b פריימים מהמצלמה — 33 מילישניות כל אחד.');
  let hw = 0, live = false; V.tabs(box, ['מעבד, שני גרעינים (נמדד בקורס)', 'כרטיס מסך (מודל)'], k => { hw = k; draw(); }); const r1 = row(box); const ck = el('label', { html: '<input type="checkbox"> מצלמה אחת, בזמן אמת' }); ck.querySelector('input').onchange = e => { live = e.target.checked; draw(); }; r1.appendChild(ck);
  const fx = flex(box); const c1 = canvas(colm(fx, 'תפוקה (תמונות בשנייה)'), 360, 220, 360); const c2 = canvas(colm(fx, 'השהייה לתמונה (מילישניות)'), 360, 220, 360); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  const B = [1, 2, 4, 8, 16]; const CPU = { 1: 12.2, 2: 22.4, 4: 46.2, 8: 107.0, 16: 225 }; const GPU = b => 2.0 + 3.2 * Math.max(1, b / 6) + 0.25 * b;
  function draw() { const t = B.map(b => hw ? GPU(b) : CPU[b]); const tp = B.map((b, i) => b / t[i] * 1000); const lat = B.map((b, i) => t[i] + (live ? (b - 1) * 33.3 : 0));
    const bars = (cv, vals, col, fmt) => { const x = cv.getContext('2d'); x.clearRect(0, 0, 360, 220); const mx = Math.max(...vals) * 1.15; vals.forEach((v, i) => { const h = v / mx * 170; x.fillStyle = col; x.fillRect(30 + i * 64, 190 - h, 44, h); txt(x, fmt(v), 52 + i * 64, 184 - h, '#212529', 10, 'center'); txt(x, 'אצווה ' + B[i], 52 + i * 64, 206, '#495057', 10, 'center'); }); };
    bars(c1, tp, '#2f9e44', v => F(v, 0)); bars(c2, lat, live ? '#e03131' : '#1c7ed6', v => F(v, 0));
    tb.innerHTML = table(['אצווה', ...B], [['זמן למעבר (מ"ש)', ...t.map(v => F(v, 1))], ['תפוקה', ...tp.map(v => F(v, 0))], ['השהייה לתמונה' + (live ? ' (כולל המתנה למצלמה)' : ''), ...lat.map(v => F(v, 0))]]) + (hw ? '' : '<div class="note-small" style="text-align:center">אצווה 16 — הערכה; השאר נמדדו בקורס.</div>');
    out.innerHTML = (hw ? 'בכרטיס מסך, תמונה אחת משאירה ליבות פנויות: האצווה מגדילה את התפוקה פי ' + F(tp[4] / tp[0], 1) + ' עד 16. ' : 'על שני גרעינים, המעבד כבר עסוק לגמרי עם תמונה אחת: האצווה כמעט לא מוסיפה תפוקה, ומ־8 הזיכרון מתחיל להאט. ') + (live ? 'אבל במצלמה אחת, אצווה של 8 פירושה לחכות לשמונה פריימים — ' + F(lat[3], 0) + ' מ"ש השהייה, יותר מרבע שנייה. לכן ברחפן — אצווה של 1.' : 'סמן "מצלמה אחת" כדי לראות מה זה עולה בזמן אמת. אצווה מתאימה לארכיון, או לכמה מצלמות במקביל.'); }
  draw();
};

/* 1.4 — the target: one line, measured */
W.w6_target = function (box) {
  V.say(box, 'כתוב את היעד כשורה אחת — חומרה, רזולוציה, אצווה, מה נמדד, איזה מדד, ויעד — וה"מדידה" (מודל של זמנים, עם זנב) אומרת אם עמדת בו. מתחת: חמש השאלות של תרגיל 1.3, וכמה מהן השורה שלך כבר עונה.');
  const S = { hw: 0, res: 1, scope: 1, met: 1, target: 33 }; const HW = [['כרטיס מסך של מחשב נייד', 6, 8, 0.12], ['מחשב קצה (סוג Jetson Orin Nano)', 19, 12, 0.18], ['מעבד בלבד, שני גרעינים', 60, 15, 0.15]], RES = [320, 640, 1280], SCOPE = ['מודל בלבד', 'מקצה לקצה'], MET = ['חציון', 'אחוזון 95', 'אחוזון 99'];
  const r1 = row(box); V.tabs(r1, HW.map(h => h[0]), k => { S.hw = k; draw(); }); const r2 = row(box); V.tabs(r2, RES.map(v => 'קלט ' + v), k => { S.res = k; draw(); }, 1); V.tabs(r2, SCOPE, k => { S.scope = k; draw(); }, 1); V.tabs(r2, MET, k => { S.met = k; draw(); }, 1); V.slider(r2, 'יעד (מ"ש)', 5, 150, 1, S.target, v => { S.target = v; draw(); });
  const line = el('div', { style: { fontSize: '16px', textAlign: 'center', margin: '8px 0', padding: '8px', background: 'var(--surface2)', borderRadius: '8px' } }); box.appendChild(line); const cv = canvas(box, 760, 170, 760); const out = V.say(box);
  function draw() { const [hn, base, e2e, sd] = HW[S.hw]; const res = RES[S.res]; const mu = base * (res / 640) ** 2 + (S.scope ? e2e : 0); const r = rng(5); const ts = [...Array(2000)].map(() => mu * Math.exp(sd * randn(r)) + (r() < 0.01 ? mu * 0.8 * r() : 0)); const m = [pct(ts, 50), pct(ts, 95), pct(ts, 99)]; const v = m[S.met]; const ok = v <= S.target;
    line.innerHTML = '"' + hn + ', קלט ' + res + ', אצווה 1, ' + SCOPE[S.scope] + ', ' + MET[S.met] + ' מתחת ל־' + S.target + ' מילישניות" — <b style="color:' + (ok ? '#2f9e44' : '#e03131') + '">' + (ok ? '✓ עומד' : '✗ לא עומד') + ' (' + F(v, 1) + ')</b>';
    const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 170); const mx = Math.max(pct(ts, 99.8), S.target) * 1.1; const NB = 60; const H = Array(NB).fill(0); ts.forEach(t => { const b = Math.min(NB - 1, Math.floor(t / mx * NB)); H[b]++; }); const hm = Math.max(...H); H.forEach((c, b) => { x.fillStyle = (b + 0.5) / NB * mx <= S.target ? '#a5d8ff' : '#ffc9c9'; x.fillRect(20 + b * 720 / NB, 140 - c / hm * 120, 720 / NB - 1, c / hm * 120); });
    const X = t => 20 + t / mx * 720; [[m[0], 'חציון'], [m[1], '95'], [m[2], '99']].forEach(([t, n], i) => { x.strokeStyle = '#495057'; x.beginPath(); x.moveTo(X(t), 18); x.lineTo(X(t), 140); x.stroke(); txt(x, n, X(t), 14, '#495057', 10, 'center'); }); x.strokeStyle = '#e03131'; x.lineWidth = 2; x.beginPath(); x.moveTo(X(S.target), 10); x.lineTo(X(S.target), 150); x.stroke(); x.lineWidth = 1; txt(x, 'יעד', X(S.target), 164, '#e03131', 11, 'center', true);
    const Q = [['על איזו חומרה?', true], ['איזו רזולוציה ואיזו אצווה?', true], ['מה נמדד — מודל בלבד או מקצה לקצה?', true], ['באיזה דיוק מספרי, ומה איבדת בדיוק המודל?', false], ['איך נמדד — חימום, כמה ריצות, חציון או אחוזון?', S.met > 0]];
    out.innerHTML = (ok ? 'עומד ביעד' : 'לא עומד ביעד') + ': חציון ' + F(m[0], 1) + ', אחוזון 95 — ' + F(m[1], 1) + ', אחוזון 99 — ' + F(m[2], 1) + '. ' + (S.met === 0 && m[2] > S.target && m[0] <= S.target ? '<b>שימו לב:</b> בחציון עמדת, אבל אחוז מהפריימים מעל היעד — בקצב 30 בשנייה זה פריים איטי כל שלוש שניות. ' : '') + '<br>חמש השאלות של תרגיל 1.3: ' + Q.map(([q, a]) => (a ? '✓ ' : '✗ ') + q).join(' · ') + '. השורה לא עונה על הדיוק המספרי — מוסיפים אותו כשמגיעים לפרקים 4–6.'; }
  draw();
};
})();

/* ===================================================================== chapter 2 */
(function () {
const W = window.W, V = window.V, el = V.el, D4 = window.D4; const { F, ltr, flex, colm, canvas, table, row, txt, rng, randn } = D4;
/* onnx_mini of section 2.3, ported line for line: the same bytes as the Python writer */
const enc = new TextEncoder();
function varint(n) { n = BigInt.asUintN(64, BigInt(n)); const out = []; for (;;) { let b = Number(n & 0x7Fn); n >>= 7n; if (n) out.push(b | 0x80); else { out.push(b); return out; } } }
const key = (f, w) => varint((f << 3) | w); const cat = (...a) => a.flat();
const fInt = (f, v) => cat(key(f, 0), varint(v)), fBytes = (f, b) => cat(key(f, 2), varint(b.length), b), fStr = (f, s) => fBytes(f, [...enc.encode(s)]);
const fFloat = (f, v) => { const b = new Uint8Array(new Float32Array([v]).buffer); return cat(key(f, 5), [...b]); };
function tensor(name, shape, data) { const b = [...new Uint8Array(new Float32Array(data).buffer)]; return cat(...shape.map(d => fInt(1, d)), fInt(2, 1), fStr(8, name), fBytes(9, b)); }
function valueInfo(name, elem, shape) { const dims = cat(...shape.map(d => fBytes(1, typeof d === 'string' ? fStr(2, d) : fInt(1, d)))); const tt = cat(fInt(1, elem), fBytes(2, dims)); return cat(fStr(1, name), fBytes(2, fBytes(1, tt))); }
function attr(name, v) { const b = fStr(1, name); if (Array.isArray(v)) return cat(b, ...v.map(x => fInt(8, x)), fInt(20, 7)); if (Number.isInteger(v)) return cat(b, fInt(3, v), fInt(20, 2)); return cat(b, fFloat(2, v), fInt(20, 1)); }
function node(op, ins, outs, attrs) { return cat(...ins.map(i => fStr(1, i)), ...outs.map(o => fStr(2, o)), fStr(3, outs[0]), fStr(4, op), ...Object.entries(attrs || {}).map(([k, v]) => fBytes(5, attr(k, v)))); }
function model(nodes, inits, inputs, outputs, opset) { const g = cat(...nodes.map(n => fBytes(1, n)), fStr(2, 'g'), ...inits.map(t => fBytes(5, t)), ...inputs.map(i => fBytes(11, valueInfo(...i))), ...outputs.map(o => fBytes(12, valueInfo(...o)))); return cat(fInt(1, 8), fBytes(7, g), fBytes(8, cat(fStr(1, ''), fInt(2, opset || 17)))); }
/* a protobuf reader (wire types 0, 2, 5) that returns the field tree; length-delimited fields are tried as sub-messages */
function parse(b, s, e, depth) { const out = []; let i = s; const rv = () => { let r = 0n, sh = 0n; for (;;) { const x = b[i++]; r |= BigInt(x & 0x7F) << sh; sh += 7n; if (!(x & 0x80)) return r; } };
  while (i < e) { const at = i; const k = Number(rv()); const f = k >> 3, w = k & 7; if (w === 0) out.push({ f, w, v: rv(), at, end: i }); else if (w === 5) { out.push({ f, w, v: new Float32Array(new Uint8Array(b.slice(i, i + 4)).buffer)[0], at, end: i + 4 }); i += 4; } else if (w === 2) { const n = Number(rv()); const st = i; i += n; let sub = null; if (depth < 6 && n > 0 && n < 200000) { try { sub = parse(b, st, st + n, depth + 1); } catch (er) { sub = null; } } out.push({ f, w, len: n, st, at, end: i, sub }); } else throw new Error('wire ' + w); }
  if (i !== e) throw new Error('bad'); return out; }
window.ONNXJS = { varint, key, fInt, fBytes, fStr, tensor, valueInfo, attr, node, model, parse };
/* the module-2 style MLP: 64 -> 32 -> 32 -> 10, random weights (seeded) */
function mlp(batch, opset) { const r = rng(7); const S = [[64, 32], [32, 32], [32, 10]]; const nodes = [], inits = []; let x = 'pixels'; S.forEach(([a, b], i) => { inits.push(tensor('W' + i, [a, b], [...Array(a * b)].map(() => randn(r) * 0.2))); inits.push(tensor('b' + i, [b], [...Array(b)].map(() => 0.01 * randn(r)))); nodes.push(node('Gemm', [x, 'W' + i, 'b' + i], ['h' + i])); x = 'h' + i; if (i < 2) { nodes.push(node('Relu', [x], ['r' + i])); x = 'r' + i; } }); return model(nodes, inits, [['pixels', 1, [batch, 64]]], [[x, 1, [batch, 10]]], opset); }
const MNAME = { 1: 'ir_version', 7: 'graph', 8: 'opset_import' }, GNAME = { 1: 'node', 2: 'name', 5: 'initializer', 11: 'input', 12: 'output' }, NNAME = { 1: 'input', 2: 'output', 3: 'name', 4: 'op_type', 5: 'attribute' }, TNAME = { 1: 'dims', 2: 'data_type', 8: 'name', 9: 'raw_data' };
const dec = new TextDecoder(); const str = (b, it) => dec.decode(new Uint8Array(b.slice(it.st, it.st + it.len)));
const hex = (b, s, e) => b.slice(s, e).map(x => x.toString(16).padStart(2, '0')).join(' ');

/* 2.1 — what is in the file */
W.w6_onnx_graph = function (box) {
  V.say(box, 'קובץ ONNX אמיתי של רשת בסגנון מודול 2 (64 ← 32 ← 32 ← 10), שנבנה <b>כאן</b> בכותב של סעיף 2.3 (מועתק שורה אחר שורה לשפת הדפדפן), ונקרא חזרה בקורא קטן של protobuf. משמאל — הגרף; מימין — מה יש בקובץ. <b>לחץ על צומת</b> כדי לראות את הבתים שלו.');
  let sel = 0, opset = 17, eng = 17; const r1 = row(box); V.slider(r1, 'גרסת סט הפעולות בקובץ', 9, 21, 1, opset, v => { opset = v; draw(); }); V.slider(r1, 'המנוע על המכשיר תומך עד', 9, 21, 1, eng, v => { eng = v; draw(); });
  const fx = flex(box); const cv = canvas(colm(fx, 'הגרף'), 300, 330, 300); const side = el('div', { style: { minWidth: '420px' } }); fx.appendChild(side); const out = V.say(box);
  function draw() { const b = mlp('N', opset); const top = parse(b, 0, b.length, 0); const g = top.find(q => q.f === 7); const nodes = g.sub.filter(q => q.f === 1), inits = g.sub.filter(q => q.f === 5), ins = g.sub.filter(q => q.f === 11), outs = g.sub.filter(q => q.f === 12);
    const nd = nodes.map(n => ({ op: str(b, n.sub.find(q => q.f === 4)), ins: n.sub.filter(q => q.f === 1).map(q => str(b, q)), outs: n.sub.filter(q => q.f === 2).map(q => str(b, q)), it: n }));
    const x = cv.getContext('2d'); x.clearRect(0, 0, 300, 330); const Y = i => 30 + i * 52; txt(x, 'pixels [N, 64]', 150, 16, '#495057', 11, 'center');
    nd.forEach((n, i) => { const y = Y(i); x.fillStyle = i === sel ? '#1c7ed6' : (n.op === 'Gemm' ? '#d0ebff' : '#e9ecef'); x.fillRect(80, y, 140, 30); txt(x, n.op, 150, y + 19, i === sel ? '#fff' : '#212529', 13, 'center', true); if (n.ins.length > 1) txt(x, n.ins.slice(1).join(', '), 228, y + 19, '#868e96', 10, 'left'); x.strokeStyle = '#adb5bd'; x.beginPath(); x.moveTo(150, y - 22); x.lineTo(150, y); x.stroke(); txt(x, n.outs[0], 74, y + 19, '#868e96', 10, 'right'); });
    cv.onclick = e => { const [mx, my] = D4.mouse(cv, e); const i = Math.floor((my - 30) / 52); if (i >= 0 && i < nd.length) { sel = i; draw(); } };
    const wBytes = inits.reduce((a, q) => a + q.len, 0); const n = nd[sel];
    side.innerHTML = table(['בקובץ', 'כמה', 'בתים'], [['צמתים (שדה 1 של הגרף)', nodes.length, nodes.reduce((a, q) => a + q.end - q.at, 0)], ['משקלות קבועים (שדה 5)', inits.length + ' — ' + inits.map(q => str(b, q.sub.find(z => z.f === 8))).join(', '), wBytes], ['קלטים ופלטים (11, 12)', ins.length + ' + ' + outs.length, ins.concat(outs).reduce((a, q) => a + q.end - q.at, 0)], ['כל הקובץ', '', '<b>' + b.length + '</b>']]) +
      '<div class="note-small" style="margin-top:6px">הצומת <b>' + n.op + '</b>: קלטים ' + ltr(n.ins.join(', ')) + ' → פלט ' + ltr(n.outs.join(', ')) + '. הבתים שלו (' + (n.it.end - n.it.at) + '):</div><div style="direction:ltr;text-align:left;font:11px monospace;background:var(--surface2);padding:6px;border-radius:6px;word-break:break-all">' + hex(b, n.it.at, n.it.end) + '</div>' +
      '<div class="note-small">הבית הראשון ' + ltr(hex(b, n.it.at, n.it.at + 1)) + ' = שדה 1 (צומת), סוג 2 (אורך), ואחריו האורך. בפנים: <span class="ltr">0a</span> = קלט, <span class="ltr">12</span> = פלט, <span class="ltr">22</span> = סוג הפעולה — ואחרי כל אחד אורך ואותיות.</div>';
    const params = 64 * 32 + 32 + 32 * 32 + 32 + 32 * 10 + 10; out.innerHTML = 'המשקלות הם ' + F(wBytes / b.length * 100, 1) + '% מהקובץ: ' + params + ' פרמטרים × 4 בתים = ' + params * 4 + '. כל השאר — מבנה ושמות. הצמתים מחוברים <i>רק דרך שמות</i>: הפלט ' + ltr('h0') + ' הוא הקלט של הצומת הבא. ' + (opset > eng ? '<b style="color:#e03131">המנוע לא יטען את הקובץ</b>: גרסת סט הפעולות ' + opset + ' חדשה מ־' + eng + ' — סיבה נפוצה לכישלון על מכשיר קצה. מייצאים מחדש עם הגרסה שהמנוע תומך בה.' : 'הגרסה בקובץ (' + opset + ') נתמכת.'); }
  draw();
};

/* 2.2 — the export arguments, and what each mistake does */
W.w6_export_args = function (box) {
  V.say(box, 'ארבעה ארגומנטים של הייצוא, וכל אחד עם התסמין שלו כששוכחים אותו. <b>כבה ארגומנט</b> וקרא מה קורה בהרצה. מתחת: רשת קטנה עם נרמול מנה, שרצה על אותה תמונה בשלוש אצוות שונות — במצב הסקה ובמצב אימון (תרגיל 2.3).');
  const O = { eval: true, dyn: true, names: true, opset: 17 }; const r1 = row(box); [['model.eval()', 'eval'], ['dynamic_axes', 'dyn'], ['input_names / output_names', 'names']].forEach(([n, k]) => { const c = el('label', { html: '<input type="checkbox" checked> <span class="ltr">' + n + '</span>' }); c.querySelector('input').onchange = e => { O[k] = e.target.checked; draw(); }; r1.appendChild(c); }); V.slider(r1, 'opset_version', 9, 21, 1, O.opset, v => { O.opset = v; draw(); });
  const pre = el('pre', { class: 'code', style: { direction: 'ltr', textAlign: 'left', fontSize: '12px', background: 'var(--surface2)', padding: '8px', borderRadius: '8px' } }); box.appendChild(pre); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  /* a 4-feature input -> BatchNorm -> linear, with stored running statistics */
  const rm = [0.5, -0.2, 1.0, 0.3], rv = [1.0, 0.5, 2.0, 0.8], wv = [0.8, -1.2, 0.5, 1.5];
  const bnLin = (X, train) => { const n = X.length; const m = train ? rm.map((_, j) => X.reduce((a, r) => a + r[j], 0) / n) : rm; const v = train ? rm.map((_, j) => X.reduce((a, r) => a + (r[j] - m[j]) ** 2, 0) / n + 1e-5) : rv; return X.map(r => r.reduce((a, x, j) => a + (x - m[j]) / Math.sqrt(v[j]) * wv[j], 0)); };
  function draw() { pre.textContent = (O.eval ? 'model.eval()\n' : '# model.eval()   <- forgotten\n') + 'dummy = torch.zeros(1, 3, 640, 640)\ntorch.onnx.export(\n    model, dummy, "detector.onnx",\n' + (O.names ? '    input_names=["images"], output_names=["preds"],\n' : '') + (O.dyn ? '    dynamic_axes={"images": {0: "N"}, "preds": {0: "N"}},\n' : '') + '    opset_version=' + O.opset + ', )';
    const img = [0.9, 0.1, 1.4, 0.2]; const comp = [[[0.1, 0.0, 0.2, 0.1]], [[2.0, -1.0, 3.0, 1.0], [1.5, -0.5, 2.5, 0.9]], [img, img, img]]; const res = comp.map(c => bnLin([img, ...c], !O.eval)[0]);
    const rows = [['שם הקלט בקובץ', O.names ? ltr('images') : ltr('input.1') + ' — הקוד שקורא לו נשבר כשמייצאים מחדש'], ['הרצה עם אצווה של 5 תמונות', O.dyn ? '✓ עובד' : '<b style="color:#e03131">' + ltr('[ONNXRuntimeError] INVALID_ARGUMENT : Got invalid dimensions for input: images. index: 0 Got: 5 Expected: 1') + '</b>'], ['טעינה על מנוע שתומך עד גרסה 17', O.opset <= 17 ? '✓ נטען' : '<b style="color:#e03131">✗ opset ' + O.opset + ' לא נתמך</b>'], ['אותה תמונה, שלוש אצוות שונות (ציון)', res.map(v => F(v, 3)).join(' · ') + (O.eval ? ' — זהים' : ' — <b style="color:#e03131">שונים!</b>')]];
    tb.innerHTML = table(['בדיקה', 'תוצאה'], rows);
    out.innerHTML = O.eval ? 'במצב הסקה, נרמול המנה משתמש בממוצע ובשונות שנשמרו באימון — התוצאה של תמונה לא תלויה במה שעוד יש באצווה.' : '<b>בלי ' + ltr('model.eval()') + '</b> הייצוא תפס את התנהגות האימון: נרמול המנה מנרמל לפי <i>האצווה הנוכחית</i>, אז אותה תמונה מקבלת ציון אחר לפי השכנות שלה — ובאצווה שכולה עותקים של אותה תמונה, הכול מנורמל כמעט לאפס. ובמזהה עם השמטה אקראית — עוד רעש בכל ריצה.'; }
  draw();
};

/* 2.3 — varint and field keys */
W.w6_varint = function (box) {
  V.say(box, 'הקידוד שבבסיס הקובץ. <b>הקלד מספר</b>: שבעה ביטים בכל בית, והביט העליון אומר "יש עוד". מתחת — מפתח של שדה: מספר השדה מוזז שלושה ביטים, ועליו הסוג. ואת הבתים אפשר <b>לפענח חזרה</b>.');
  let n = 300, fld = 1, wire = 2; const r1 = row(box); const inp = el('input', { type: 'text', value: '300', style: { direction: 'ltr', width: '140px', fontSize: '15px', padding: '4px' } }); inp.oninput = () => { n = inp.value.trim(); draw(); }; r1.appendChild(el('span', { html: 'מספר: ' })); r1.appendChild(inp); V.btns(r1, [['1', () => set(1)], ['127', () => set(127)], ['128', () => set(128)], ['300', () => set(300)], ['409600', () => set(409600)], ['−1', () => set(-1)]]);
  const r2 = row(box); V.slider(r2, 'מספר שדה', 1, 20, 1, fld, v => { fld = v; draw(); }); V.tabs(r2, ['סוג 0: מספר', 'סוג 2: אורך ובתים', 'סוג 5: עשרוני 4 בתים'], k => { wire = [0, 2, 5][k]; draw(); }, 1);
  const out1 = el('div'); box.appendChild(out1); const out = V.say(box);
  function set(v) { inp.value = String(v); n = String(v); draw(); }
  function draw() { let v; try { v = BigInt(n); } catch (e) { out1.innerHTML = '<div class="note-small">לא מספר שלם</div>'; return; } const bytes = varint(v); const bits = BigInt.asUintN(64, v).toString(2);
    const groups = []; let rest = BigInt.asUintN(64, v); do { groups.push(Number(rest & 0x7Fn)); rest >>= 7n; } while (rest);
    out1.innerHTML = '<div class="note-small" style="text-align:center;margin:6px 0">הבתים, מהראשון לאחרון — הביט המודגש הוא ביט ההמשך; קבוצת שבעת הביטים הראשונה היא הנמוכה:</div>' +
      '<div style="display:flex;gap:6px;justify-content:center;direction:ltr;flex-wrap:wrap">' + bytes.map((b, i) => '<div style="text-align:center;border:1px solid var(--border);border-radius:6px;padding:4px 6px"><div style="font:13px monospace"><span style="color:' + (b & 0x80 ? '#e03131' : '#2f9e44') + ';font-weight:bold">' + (b >> 7) + '</span>' + (b & 0x7F).toString(2).padStart(7, '0') + '</div><div class="note-small">' + b.toString(16).padStart(2, '0') + ' · ' + (b & 0x7F) + '×128' + (i ? '<sup>' + i + '</sup>' : '<sup>0</sup>') + '</div></div>').join('') + '</div>' +
      table(['', ''], [['המספר בבינארי (64 ביט אם שלילי)', '<span class="ltr" style="font:12px monospace">' + bits + '</span>'], ['כמה בתים', '<b>' + bytes.length + '</b>' + (v < 0n ? ' — שלילי נכתב כמו long במשלים לשתיים, ולכן תמיד 10' : '')], ['מפתח השדה: ' + ltr('(' + fld + ' << 3) | ' + wire + ' = ' + ((fld << 3) | wire)), '<span class="ltr" style="font:13px monospace">' + key(fld, wire).map(x => x.toString(16).padStart(2, '0')).join(' ') + '</span>'], ['שדה שלם, אם הערך הוא המספר', '<span class="ltr" style="font:13px monospace">' + (wire === 0 ? fInt(fld, v) : wire === 2 ? fBytes(fld, bytes) : fFloat(fld, Number(v))).map(x => x.toString(16).padStart(2, '0')).join(' ') + '</span>']]);
    const back = parse(fInt(fld, v), 0, fInt(fld, v).length, 0)[0]; out.innerHTML = 'פענוח חזרה של השדה כמספר: שדה ' + back.f + ', ערך ' + ltr(String(BigInt.asIntN(64, back.v))) + ' ✓. ' + (bytes.length === 1 ? 'מספר עד 127 — בית אחד. ' : 'כל בית חוץ מהאחרון — ביט עליון 1 (אדום): "יש עוד". ') + 'זו הסיבה שמספרי שדות קטנים ואורכים קצרים כמעט לא תופסים מקום — ושמשקלות הם רוב הקובץ.'; }
  draw();
};

/* 2.4 — verification: same input, same output */
W.w6_verify = function (box) {
  V.say(box, 'אימות של ייצוא: מריצים את "המקור" ואת "הקובץ" על אותם קלטים ומשווים עם סובלנות. כאן שניהם רשת קטנה עם אותם משקלות; <b>הכנס באג</b> לצד של הקובץ, ובחר קלט — <b>אקראי</b> בין 0 ל־1, או <b>תמונות אמיתיות</b> (ערכי פיקסלים 0 עד 16, כמו בספרות של מודול 2). חלק מהבאגים מתגלים רק על קלט אמיתי.');
  let bug = 0, real = true, rtol = 1e-4, atol = 1e-5; const BUGS = ['בלי באג', 'עיגול ל־16 ביט (חצי דיוק)', 'חיתוך הקלט ל־[0, 1] (נרמול כפול)', 'ערוצים בסדר הפוך', 'שכבה אחרונה בלי הטיה']; V.tabs(box, BUGS, k => { bug = k; draw(); }); const r1 = row(box); V.tabs(r1, ['קלט אקראי 0–1', 'תמונות אמיתיות 0–16'], k => { real = !!k; draw(); }, 1); V.slider(r1, 'rtol', -6, -1, 1, -4, v => { rtol = 10 ** v; draw(); }, v => '1e' + v); V.slider(r1, 'atol', -7, -2, 1, -5, v => { atol = 10 ** v; draw(); }, v => '1e' + v);
  const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  const r = rng(3); const Wt = [[...Array(64 * 16)].map(() => randn(r) * 0.1), [...Array(16 * 10)].map(() => randn(r) * 0.3)], Bs = [[...Array(16)].map(() => randn(r) * 0.1), [...Array(10)].map(() => randn(r) * 0.2)];
  const fwd = (x, b) => { let xi = x.slice(); if (b === 2) xi = xi.map(v => Math.min(1, Math.max(0, v))); if (b === 3) { const y = xi.slice(); for (let i = 0; i < 64; i++) y[i] = xi[(i % 8) * 8 + Math.floor(i / 8)]; xi = y; } const f16 = v => { const a = new Float32Array([v]); const u = new Uint32Array(a.buffer); u[0] &= 0xFFFFE000; return a[0]; }; const h = [...Array(16)].map((_, j) => { let s = Bs[0][j]; for (let i = 0; i < 64; i++) s += xi[i] * Wt[0][i * 16 + j]; s = Math.max(0, s); return b === 1 ? f16(s) : s; }); return [...Array(10)].map((_, k) => { let s = b === 4 ? 0 : Bs[1][k]; for (let j = 0; j < 16; j++) s += h[j] * Wt[1][j * 10 + k]; return b === 1 ? f16(s) : s; }); };
  function draw() { const rr = rng(11); const X = [...Array(200)].map((_, n) => [...Array(64)].map((_, i) => real ? Math.round(Math.max(0, Math.min(16, 8 + 7 * Math.sin(i * 0.7 + n) + 3 * randn(rr)))) : rr())); let mx = 0, fails = 0, agree = 0; X.forEach(x => { const a = fwd(x, 0), b = fwd(x, bug); let bad = false; a.forEach((v, k) => { const d = Math.abs(v - b[k]); mx = Math.max(mx, d); if (d > atol + rtol * Math.abs(v)) bad = true; }); if (bad) fails++; if (a.indexOf(Math.max(...a)) === b.indexOf(Math.max(...b))) agree++; });
    const pass = fails === 0; tb.innerHTML = table(['', ''], [['ההפרש המוחלט המרבי', '<b>' + (mx === 0 ? '0.0' : mx.toExponential(2)) + '</b>'], ['קלטים שנכשלו בסובלנות', fails + ' מתוך 200'], ['ההחלטה (המחלקה הגבוהה) זהה', agree + ' מתוך 200'], ['assert_allclose', pass ? '<b style="color:#2f9e44">✓ עבר</b>' : '<b style="color:#e03131">✗ נכשל</b>']]);
    const msg = ['אותו חשבון — הפרש אפס, כמו בקורס.', 'חצי דיוק: הפרשים קטנים בכל מקום. ההחלטות כמעט תמיד זהות — אבל הסובלנות של 32 ביט נכשלת. לחצי דיוק מאמתים עם סובלנות גדולה יותר, ובודקים גם את ההחלטות.', 'חיתוך ל־[0, 1]: על קלט אקראי בין 0 ל־1 <b>אין שום הבדל</b> — הבאג בלתי נראה. על תמונות אמיתיות (0–16) הוא הורס הכול. זו הסיבה שמאמתים על קלטים אמיתיים.', 'ערוצים בסדר הפוך — הבאג הנפוץ ביותר בייצוא (שאלת הראיון של 2.5): הקובץ "עובד", מחזיר מספרים סבירים, ומחליט אחרת.', 'שכבה בלי הטיה: הפרש קבוע בכל הפלטים — ובמקרה הזה חלק מההחלטות עוד יוצאות זהות. רק השוואה מספרית תופסת את זה.'][bug];
    out.innerHTML = msg + (bug === 2 && !real ? ' <b>עבור לתמונות אמיתיות.</b>' : ''); }
  draw();
};

/* 2.5 — simplifying the graph */
W.w6_simplify = function (box) {
  V.say(box, 'גרף כמו שייצוא מספריית אימון משאיר: מסביב לשכבה אחת יש שרשרת שמחשבת צורה (Shape ← Gather ← Concat ← Reshape), צומת Identity, וקבוע שמחושב בכל ריצה (Mul של שני קבועים). <b>לחץ "צעד"</b>: כל צומת שכל הקלטים שלו קבועים — מחושב מראש והופך לקבוע (קיפול קבועים); Identity — מוסר. בסוף: אימות.');
  let G0 = () => [{ id: 'shape', op: 'Shape', ins: ['x'], out: 's', c: false }, { id: 'gather', op: 'Gather', ins: ['s', 'idx0'], out: 'n', c: false }, { id: 'concat', op: 'Concat', ins: ['n', 'm1'], out: 'shp', c: false }, { id: 'conv', op: 'Conv', ins: ['x', 'W', 'B'], out: 'y', c: false }, { id: 'mul', op: 'Mul', ins: ['scale', 'two'], out: 'k', c: false }, { id: 'mul2', op: 'Mul', ins: ['y', 'k'], out: 'y2', c: false }, { id: 'ident', op: 'Identity', ins: ['y2'], out: 'y3', c: false }, { id: 'reshape', op: 'Reshape', ins: ['y3', 'shp'], out: 'out', c: false }];
  let G = G0(), consts = new Set(['idx0', 'm1', 'W', 'B', 'scale', 'two']), fixedBatch = true, log = []; const r1 = row(box); V.btns(r1, [['צעד ←', () => { step(); draw(); }, 'primary'], ['עד הסוף', () => { for (let i = 0; i < 10; i++) step(); draw(); }], ['↺', () => { G = G0(); consts = new Set(['idx0', 'm1', 'W', 'B', 'scale', 'two']); log = []; draw(); }]]); const ck = el('label', { html: '<input type="checkbox" checked> אצווה קבועה (הקלט [1, 3, 640, 640])' }); ck.querySelector('input').onchange = e => { fixedBatch = e.target.checked; G = G0(); consts = new Set(['idx0', 'm1', 'W', 'B', 'scale', 'two']); log = []; draw(); }; r1.appendChild(ck);
  const cv = canvas(box, 760, 250, 760); const out = V.say(box);
  function step() { const n = G.find(q => q.op === 'Identity'); if (n) { G = G.filter(q => q !== n); G.forEach(q => q.ins = q.ins.map(i => i === n.out ? n.ins[0] : i)); log.push('הוסר Identity'); return; }
    const isC = i => consts.has(i) || (i === 'x' ? false : false); const f = G.find(q => q.op !== 'Conv' && (q.op === 'Shape' ? fixedBatch : q.ins.every(i => consts.has(i)))); if (f) { G = G.filter(q => q !== f); consts.add(f.out); log.push(f.op + ' חושב מראש → ' + f.out + ' קבוע'); } }
  function draw() { const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 250); G.forEach((n, i) => { const X = 20 + (i % 4) * 185, Y = 20 + Math.floor(i / 4) * 80; x.fillStyle = n.op === 'Conv' ? '#d0ebff' : n.op === 'Identity' ? '#fff3bf' : '#e9ecef'; x.fillRect(X, Y, 160, 50); txt(x, n.op, X + 80, Y + 20, '#212529', 13, 'center', true); txt(x, ltr(n.ins.join(', ') + ' → ' + n.out), X + 80, Y + 40, '#495057', 10, 'center'); });
    txt(x, 'קבועים: ' + [...consts].join(', '), 750, 220, '#2f9e44', 11, 'right'); txt(x, G.length + ' צמתים', 20, 240, '#212529', 13, 'left', true);
    const done = !G.some(q => q.op === 'Identity') && !G.some(q => q.op !== 'Conv' && (q.op === 'Shape' ? fixedBatch : q.ins.every(i => consts.has(i))));
    out.innerHTML = (log.length ? log.map(l => ltr(l.split(' ')[0]) + ' ' + l.split(' ').slice(1).join(' ')).slice(-3).join(' · ') + '. ' : '') + (done ? 'נשארו ' + G.length + ' צמתים מתוך 8. ' + (fixedBatch ? 'עם אצווה קבועה גם חישוב הצורה כולו התקפל — הצורה ידועה מראש. ' : 'עם אצווה דינמית, <span class="ltr">Shape</span> תלוי בקלט ונשאר — וכל השרשרת אחריו. ') + 'ותמיד אחרי פישוט: לאמת שוב, בדיוק כמו בסעיף 2.4.' : 'לחץ "צעד".'); }
  draw();
};
})();

/* ===================================================================== chapter 3 */
(function () {
const W = window.W, V = window.V, el = V.el, D4 = window.D4; const { F, ltr, flex, colm, canvas, table, row, txt, rng, randn } = D4; const f32 = Math.fround;

/* 3.1 — folding BatchNorm into the convolution, in float32 */
W.w6_bn_fold = function (box) {
  V.say(box, 'קונבולוציה של 3 ערוצים ל־8, ואחריה נרמול מנה עם ערכים אקראיים — מחושבת כאן, בדיוק של 32 ביט, על קלט של 32 על 32. ואותה שכבה אחרי <b>קיפול</b>: <span class="ltr">W′ = k·W</span>, ‏<span class="ltr">b′ = k·(b − μ) + β</span>, עם <span class="ltr">k = γ / √(σ² + ε)</span>. מתחת: כמה קריאות וכתיבות לזיכרון חוסך האיחוד של קונבולוציה, נרמול והפעלה (תרגיל 3.4 ושאלת הראיון).');
  let seed = 1, eps = 1e-5, hw = 160, ch = 64; const r1 = row(box); V.btns(r1, [['🎲 ערכים אחרים', () => { seed++; draw(); }]]); V.slider(r1, 'ε', -8, -1, 1, -5, v => { eps = 10 ** v; draw(); }, v => '1e' + v); const r2 = row(box); V.slider(r2, 'גודל מפת התכונות', 20, 320, 20, hw, v => { hw = v; draw(); }, v => v + '×' + v); V.slider(r2, 'ערוצים', 16, 256, 16, ch, v => { ch = v; draw(); });
  const tb = el('div'); box.appendChild(tb); const cv = canvas(box, 760, 150, 760); const out = V.say(box);
  function draw() { const r = rng(seed * 13); const Ci = 3, Co = 8, S = 32; const X = Float32Array.from({ length: Ci * S * S }, () => r()); const Wt = Float32Array.from({ length: Co * Ci * 9 }, () => randn(r) * 0.3), Bb = Float32Array.from({ length: Co }, () => randn(r) * 0.1);
    const g = [...Array(Co)].map(() => f32(0.5 + r())), be = [...Array(Co)].map(() => f32(randn(r) * 0.2)), mu = [...Array(Co)].map(() => f32(randn(r) * 0.3)), va = [...Array(Co)].map(() => f32(0.3 + 2 * r()));
    const k = g.map((gg, c) => f32(gg / f32(Math.sqrt(f32(va[c] + eps))))); const W2 = Wt.map((w, i) => f32(w * k[Math.floor(i / (Ci * 9))])), B2 = Bb.map((b, c) => f32(f32(k[c] * f32(b - mu[c])) + be[c]));
    const conv = (Wx, Bx, c, y, x) => { let s = Bx[c]; for (let ci = 0; ci < Ci; ci++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const yy = y + dy, xx = x + dx; if (yy < 0 || xx < 0 || yy >= S || xx >= S) continue; s = f32(s + f32(Wx[((c * Ci + ci) * 3 + dy + 1) * 3 + dx + 1] * X[(ci * S + yy) * S + xx])); } return s; };
    let mx = 0, mxv = 0; for (let c = 0; c < Co; c++) for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const a = conv(Wt, Bb, c, y, x); const bn = f32(f32(g[c] * f32(f32(a - mu[c]) / f32(Math.sqrt(f32(va[c] + eps))))) + be[c]); const fo = conv(W2, B2, c, y, x); mx = Math.max(mx, Math.abs(bn - fo)); mxv = Math.max(mxv, Math.abs(bn)); }
    tb.innerHTML = table(['ערוץ', 'γ', 'β', 'μ', 'σ²', '<b>k</b>', 'b′'], [...Array(4)].map((_, c) => [c, F(g[c], 3), F(be[c], 3), F(mu[c], 3), F(va[c], 3), '<b>' + F(k[c], 3) + '</b>', F(B2[c], 3)])) + '<div class="note-small" style="text-align:center">ארבעה מתוך שמונה הערוצים. ההפרש המרבי בין "קונבולוציה ואז נרמול" ל"קונבולוציה מקופלת", על 8,192 ערכים: <b>' + mx.toExponential(1) + '</b> (הערך הגדול ביותר בפלט ' + F(mxv, 2) + '). בקורס: ‏8.3 · 10⁻⁷.</div>';
    const fm = hw * hw * ch * 4 / 1e6; const unf = [['קונבולוציה: קריאה וכתיבה', 2 * fm], ['נרמול: קריאה וכתיבה', 2 * fm], ['הפעלה: קריאה וכתיבה', 2 * fm]], fus = [['הכול יחד: קריאה וכתיבה', 2 * fm]];
    const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 150); const tot = 6 * fm; [['בלי איחוד', unf, 30], ['עם איחוד', fus, 90]].forEach(([n, parts, Y]) => { let X0 = 150; parts.forEach(([pn, v], i) => { const w = v / tot * 580; x.fillStyle = ['#1c7ed6', '#e8590c', '#2f9e44', '#868e96'][parts.length === 1 ? 3 : i]; x.fillRect(X0, Y, w - 2, 34); if (w > 90) txt(x, pn, X0 + w / 2, Y + 21, '#fff', 10, 'center', true); X0 += w; }); txt(x, n + ': ' + F(parts.reduce((a, p) => a + p[1], 0), 1) + ' MB', 140, Y + 21, '#212529', 12, 'right', true); });
    out.innerHTML = 'ההפרש בין שתי הגרסאות הוא שגיאת עיגול של סדר פעולות — לא שינוי במודל. נרמול המנה <b>נעלם</b>: אין יותר פעולה כזו. ובזיכרון: מפת תכונות של ' + hw + '×' + hw + '×' + ch + ' היא ' + F(fm, 1) + ' MB; בלי איחוד כל אחת משלוש הפעולות קוראת וכותבת אותה — פי 3 תעבורה. נרמול והפעלה עושים כמעט אפס חשבון לכל בית — הם מוגבלים במהירות הזיכרון, ולכן האיחוד מאיץ גם כשמספר פעולות החשבון לא משתנה. בקורס: מ־15.6 ל־6.0 מ"ש בתהליכון אחד, פי 2.6.'; }
  draw();
};

/* 3.2 — how many threads: a small scheduler simulation */
W.w6_threads = function (box) {
  V.say(box, 'סימולציה של מתזמן: המודל הוא 15 פעולות, כל אחת מחולקת שווה בין T תהליכונים, ובסוף כל פעולה — <b>מחסום</b>: אף תהליכון לא מתחיל את הבאה לפני שכולם סיימו. מערכת ההפעלה מחלקת את הגרעינים בין התהליכונים בפרוסות זמן. תהליכון שסיים ומחכה במחסום <b>מסתובב</b> (בודק שוב ושוב) — וממשיך לתפוס גרעין. בחר גרעינים ותהליכונים, והסתכל על התרשים.');
  let cores = 2, th = 2, spin = true, quantum = 1, bg = 0; const r1 = row(box); V.slider(r1, 'גרעינים', 1, 8, 1, cores, v => { cores = v; draw(); }); V.slider(r1, 'תהליכונים', 1, 8, 1, th, v => { th = v; draw(); }); V.slider(r1, 'פרוסת זמן (מ"ש)', 0.5, 5, 0.5, quantum, v => { quantum = v; draw(); }); const r2 = row(box); const ck = el('label', { html: '<input type="checkbox" checked> המתנה מסתובבת במחסום' }); ck.querySelector('input').onchange = e => { spin = e.target.checked; draw(); }; r2.appendChild(ck); V.slider(r2, 'תהליכים אחרים שתופסים גרעין', 0, 3, 1, bg, v => { bg = v; draw(); });
  const cv = canvas(box, 760, 230, 760); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function sim(C, T, sp, q, B, rec) { const WORK = [2.4, 3.1, 3.1, 3.1, 1.6, 0.3, 0.3, 0.3, 0.3, 0.3, 0.2, 0.2, 0.2, 0.2, 0.2].map(w => w * 23.3 / 15.8); const dt = 0.05; let t = 0, op = 0; const thr = [...Array(T)].map(() => ({ rem: WORK[0] / T })); const all = thr.map((_, i) => ({ id: i })).concat([...Array(B)].map((_, i) => ({ id: T + i, bg: true }))); const rq = all.slice(); const run = []; const slice = {}; const tl = [];
    while (op < WORK.length && t < 400) { while (run.length < C && rq.length) { const p = rq.shift(); run.push(p); slice[p.id] = q; } run.forEach(p => { if (!p.bg) { const s = thr[p.id]; if (s.rem > 0) s.rem -= dt; } slice[p.id] -= dt; if (rec && t < 120) tl.push([t, run.indexOf(p), p.bg ? -1 : (thr[p.id].rem > 0 ? p.id : -2)]); });
      if (thr.every(s => s.rem <= 0)) { op++; if (op < WORK.length) thr.forEach(s => s.rem = WORK[op] / T); }
      for (let i = run.length - 1; i >= 0; i--) { const p = run[i]; const blocked = !p.bg && !sp && thr[p.id].rem <= 0; if (slice[p.id] <= 0 || blocked) { run.splice(i, 1); rq.push(p); } }
      t += dt; } return { t, tl }; }
  function draw() { const res = sim(cores, th, spin, quantum, bg, true); const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 230); const span = Math.min(120, res.t); const X = t => 60 + t / span * 690;
    for (let c = 0; c < cores; c++) txt(x, 'גרעין ' + (c + 1), 54, 26 + c * 22, '#495057', 10, 'right');
    res.tl.forEach(([t, c, id]) => { if (t > span || c < 0) return; x.fillStyle = id === -1 ? '#adb5bd' : id === -2 ? '#ffc9c9' : ['#1c7ed6', '#2f9e44', '#e8590c', '#ae3ec9', '#f08c00', '#0c8599', '#c2255c', '#5c940d'][id % 8]; x.fillRect(X(t), 16 + c * 22, Math.max(1, X(t + 0.05) - X(t)), 16); });
    txt(x, 'צבע — תהליכון שעובד · ורוד — מסתובב במחסום (תופס גרעין בלי לעבוד) · אפור — תהליך אחר', 750, 16 + cores * 22 + 18, '#495057', 10, 'right'); [0, span / 2, span].forEach(t => txt(x, F(t, 0) + ' מ"ש', X(t), 16 + cores * 22 + 34, '#868e96', 10, 'center'));
    const rows = [1, 2, 4, 8].map(T => [T, F(sim(cores, T, spin, quantum, bg).t, 1)]); tb.innerHTML = table(['תהליכונים', ...rows.map(r => r[0])], [['זמן ריצה (מ"ש) — סימולציה', ...rows.map(r => r[1])], ['בקורס, שני גרעינים (חציון)', '23.3', '13.4', '24.0', '64.6']]);
    const t1 = sim(cores, 1, spin, quantum, bg).t; out.innerHTML = 'עם ' + th + ' תהליכונים על ' + cores + ' גרעינים: ' + F(res.t, 1) + ' מ"ש (תהליכון אחד: ' + F(t1, 1) + '). ' + (th > cores ? '<b>יותר תהליכונים מגרעינים</b>: כשתהליכון מסיים את החלק שלו ומחכה במחסום, הוא ' + (spin ? 'ממשיך להסתובב ולתפוס גרעין — בזמן שתהליכון אחר, שעוד לא סיים, מחכה בתור לפרוסת הזמן הבאה. כל מחסום מחכה לאיטי ביותר.' : 'מוותר על הגרעין — זה עוזר, אבל המחסום עדיין מחכה לתהליכון שהמערכת עוד לא תזמנה.') : th === cores ? 'תהליכון לכל גרעין — הכי מהר.' : 'פחות תהליכונים מגרעינים — גרעינים פנויים.') + (bg ? ' ותהליכים אחרים (פענוח, עוקב) מתחרים על אותם גרעינים — בדיוק המצב על מחשב קצה.' : ''); }
  draw();
};

/* 3.3 — execution providers */
W.w6_providers = function (box) {
  V.say(box, 'מזהה של 12 צמתים, ורשימת ספקים לפי סדר עדיפות. כל צומת נשלח לספק <b>הראשון</b> שזמין במכונה ויודע לבצע אותו. בחר מכונה ורשימה: התרשים מראה איפה כל צומת רץ, כמה פעמים המידע עובר בין כרטיס למעבד, מה יוצא מ־<code class="ltr">get_providers()</code> — ומה עושה הבדיקה של הסעיף.');
  const MACH = [['מחשב נייד, כרטיס של אנבידיה, דרייברים תקינים', ['TensorRT', 'CUDA', 'CPU']], ['אותו מחשב — אחרי עדכון ששבר את הדרייברים', ['CPU']], ['מחשב קצה של אנבידיה (Jetson)', ['TensorRT', 'CUDA', 'CPU']], ['מחשב עם מעבד של אינטל, בלי כרטיס', ['OpenVINO', 'CPU']]];
  const LISTS = [['CUDA', 'CPU'], ['TensorRT', 'CUDA', 'CPU'], ['CPU'], ['OpenVINO', 'CPU']];
  const NODES = ['Conv', 'Conv', 'Conv', 'Conv', 'Resize', 'Concat', 'Conv', 'Conv', 'Sigmoid', 'TopK', 'NonMaxSuppression', 'Gather'];
  const SUP = { TensorRT: n => !['NonMaxSuppression', 'TopK'].includes(n), CUDA: n => n !== 'NonMaxSuppression', CPU: () => true, OpenVINO: n => n !== 'NonMaxSuppression' };
  const COST = { TensorRT: 0.25, CUDA: 0.5, CPU: 6, OpenVINO: 3 }; const COLS = { TensorRT: '#2f9e44', CUDA: '#1c7ed6', CPU: '#868e96', OpenVINO: '#ae3ec9' };
  let mi = 0, li = 0, check = true; V.tabs(box, MACH.map(m => m[0]), k => { mi = k; draw(); }); const r1 = row(box); V.tabs(r1, LISTS.map(l => ltr('[' + l.map(p => p + 'EP').join(', ') + ']')), k => { li = k; draw(); }); const ck = el('label', { html: '<input type="checkbox" checked> הבדיקה של הסעיף (raise אם הספק הראשון חסר)' }); ck.querySelector('input').onchange = e => { check = e.target.checked; draw(); }; r1.appendChild(ck);
  const cv = canvas(box, 760, 150, 760); const out = V.say(box);
  function draw() { const avail = MACH[mi][1]; const want = LISTS[li]; const got = want.filter(p => avail.includes(p)); const asg = NODES.map(n => got.find(p => SUP[p](n)) || 'CPU');
    let copies = 0; asg.forEach((p, i) => { if (i && (p === 'CPU') !== (asg[i - 1] === 'CPU')) copies++; }); const t = asg.reduce((a, p, i) => a + COST[p] * (NODES[i] === 'Conv' ? 4 : 1), 0) + copies * 1.2;
    const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 150); NODES.forEach((n, i) => { const X = 10 + i * 62; x.fillStyle = COLS[asg[i]]; x.fillRect(X, 30, 56, 40); txt(x, n.length > 9 ? n.slice(0, 8) + '…' : n, X + 28, 54, '#fff', 10, 'center', true); txt(x, asg[i], X + 28, 86, COLS[asg[i]], 10, 'center', true); if (i && (asg[i] === 'CPU') !== (asg[i - 1] === 'CPU')) { x.fillStyle = '#e03131'; x.fillRect(X - 5, 22, 3, 56); } });
    txt(x, 'קו אדום — העתקה בין כרטיס המסך לזיכרון של המעבד', 750, 120, '#e03131', 10, 'right'); txt(x, 'זמן משוער: ' + F(t, 1) + ' מ"ש', 10, 120, '#212529', 12, 'left', true);
    const miss = want[0] !== got[0]; const prov = ltr('[' + got.map(p => "'" + p + "ExecutionProvider'").join(', ') + ']');
    out.innerHTML = '<code class="ltr">sess.get_providers()</code> → ' + prov + '. ' + (miss ? (check ? '<b style="color:#e03131">' + ltr('RuntimeError: running on ' + got.map(p => p + 'ExecutionProvider').join(', ') + ', not on the GPU') + '</b> — עדיף להיכשל ברעש. ' : '<b>שימו לב:</b> ביקשת ' + want[0] + ' והוא לא זמין — סביבת הריצה רק כתבה אזהרה ורצה בשקט על ' + got[0] + '. בלי הבדיקה, המערכת על הרחפן פשוט איטית פי כמה, בלי שום שגיאה (תרגיל 3.3). ') : '') + (copies ? 'צמתים שהספק לא תומך בהם (כמו סינון כפילויות) עוברים למעבד — ' + copies + ' העתקות בין זיכרונות בכל ריצה. ' : '') + (got[0] === 'TensorRT' ? 'מנוע ההאצה בונה מנוע בהרצה הראשונה — עשרות שניות (פרק 4).' : '');
  }
  draw();
};
})();

/* ===================================================================== chapter 4 (no GPU here: every number is a stated model, not a measurement) */
(function () {
const W = window.W, V = window.V, el = V.el, D4 = window.D4; const { F, ltr, canvas, table, row, txt, rng } = D4;
const MODEL = '<span class="badge" style="background:#fff3bf;color:#5c3c00;padding:1px 6px;border-radius:6px">מודל — לא מדידה</span> ';
/* the backbone of chapters 1 and 3: five Conv(3x3, stride 2)+BN+Relu, channels 3,32,64,128,256,256, input 640 */
const CH = [3, 32, 64, 128, 256, 512]; const LAY = CH.slice(1).map((c, i) => ({ cin: CH[i], cout: c, hw: 640 >> (i + 1) })); LAY.forEach(l => { l.gflop = 2 * l.cin * 9 * l.cout * l.hw * l.hw / 1e9; l.outMB = l.cout * l.hw * l.hw * 4 / 1e6; });
const GPUS = [['כרטיס של מחשב נייד (RTX 4060)', 11], ['Jetson Orin Nano', 3], ['שרת (A100)', 41]];

/* 4.1 — what the builder does, step by step */
W.w6_trt_build = function (box) {
  V.say(box, MODEL + 'בניית מנוע לשלד של פרקים 1 ו־3, חמישה שלבים — לחץ "שלב הבא". הגרף, הצורות והזיכרון <b>מחושבים</b> מהשלד האמיתי; הזמנים של הקרנלים הם מודל (אין כאן כרטיס). החלף כרטיס ובנה שוב — וראה שהמנוע שיוצא שונה.');
  let gi = 0, step = 0, fp16 = true, bad = false; V.tabs(box, GPUS.map(g => g[0]), k => { gi = k; step = 0; draw(); }); const r1 = row(box);
  V.btns(r1, [['▶ שלב הבא', () => { step = Math.min(5, step + 1); draw(); }, 'primary'], ['⟲ מההתחלה', () => { step = 0; draw(); }]]);
  const c1 = el('label', { html: '<input type="checkbox" checked> מותר חצי דיוק (<span class="ltr">--fp16</span>)' }); c1.querySelector('input').onchange = e => { fp16 = e.target.checked; step = 0; draw(); }; r1.appendChild(c1);
  const c2 = el('label', { html: ' <input type="checkbox"> בגרף יש פעולה לא נתמכת' }); c2.querySelector('input').onchange = e => { bad = e.target.checked; step = 0; draw(); }; r1.appendChild(c2);
  const body = el('div'); box.appendChild(body); const out = V.say(box);
  const STEPS = ['קריאת הגרף', 'איחוד', 'בחירת קרנלים', 'בחירת דיוק', 'תכנון זיכרון'];
  function tactics(li) { const r = rng(1000 * gi + li * 7 + 3); const tf = GPUS[gi][1]; const base = LAY[li].gflop / (tf * 0.35); return ['implicit_gemm_128x64', 'implicit_gemm_64x64', 'winograd_4x4', 'direct_tiled', 'fft_conv', 'gemm_nhwc_256x128'].map(n => ({ n, ms32: base * (0.9 + 1.6 * r()), r16: 0.35 + 0.75 * r() })); }
  function draw() { let h = '<div style="display:flex;gap:6px;margin:6px 0">' + STEPS.map((s, i) => '<span style="padding:3px 8px;border-radius:6px;background:' + (i < step ? '#d3f9d8' : i === step ? '#e7f5ff' : '#f1f3f5') + '">' + (i + 1) + '. ' + s + '</span>').join('') + '</div>'; let msg = '';
    if (step >= 1) { if (bad) { body.innerHTML = h + '<pre class="ltr" style="background:#fff5f5;padding:8px">[E] [TRT] ModelImporter.cpp: No importer registered for op: CustomNMS\n[E] Failed to parse onnx file</pre>'; out.innerHTML = 'הבנייה נעצרת כבר בשלב הראשון: פעולה שהמפענח לא מכיר עוצרת <i>הכול</i> — לא כמו בסביבת הריצה, שם היא נופלת לספק הבא. פתרונות: לייצא בלי הפעולה (סינון כפילויות בקוד, אחרי המודל), לגרסת סט פעולות שנתמכת, או לכתוב תוסף.'; return; }
      h += '<div class="note-small">הגרף נקרא: 15 צמתים (5 קונבולוציות, 5 נרמולי מנה, 5 הפעלות), קלט <span class="ltr">1×3×640×640</span>.</div>'; }
    if (step >= 2) h += '<div class="note-small"><b>איחוד:</b> נרמול מנה מתקפל לקונבולוציה (סעיף 3.1), וההפעלה מאוחדת לתוך הקרנל — <b>15 צמתים ← 5 שכבות</b>.</div>';
    if (step >= 3) { const rows = LAY.map((l, i) => { const t = tactics(i); const best = t.reduce((a, b) => a.ms32 < b.ms32 ? a : b); l.best = best; return ['conv' + (i + 1) + ' ' + ltr(l.cin + '→' + l.cout + ', ' + l.hw + '²'), F(l.gflop, 2), t.map(x => (x === best ? '<b>' : '') + ltr(x.n) + ' ' + F(x.ms32, 3) + (x === best ? '</b>' : '')).slice(0, 6).join('<br>')]; }); h += table(['שכבה', 'GFLOP', 'הקרנלים שנוסו (מ"ש, מודל) — הנבחר מודגש'], rows); }
    if (step >= 4) { let tot = 0; const rows = LAY.map((l, i) => { const t32 = l.best.ms32, t16 = t32 * l.best.r16; const use16 = fp16 && t16 < t32; const t = use16 ? t16 : t32; tot += t; return ['conv' + (i + 1), F(t32, 3), fp16 ? F(t16, 3) : '—', use16 ? '<b>FP16</b>' : 'FP32']; }); h += table(['שכבה', 'FP32', 'FP16', 'נבחר'], rows) + '<div class="note-small">סך הכול (מודל): <b>' + F(tot, 2) + ' מ"ש</b> לחישוב בכרטיס.</div>'; }
    if (step >= 5) { const sizes = [4.92].concat(LAY.map(l => l.outMB)); const naive = sizes.reduce((a, b) => a + b, 0); let peak = 0; for (let i = 0; i < LAY.length; i++) peak = Math.max(peak, sizes[i] + sizes[i + 1]); h += '<div class="note-small"><b>תכנון זיכרון</b> (מחושב מהצורות): כל טנזור ביניים חי רק בין השכבה שכותבת אותו לשכבה שקוראת אותו. בלי שימוש חוזר: ' + F(naive, 1) + ' MB; עם — רק שני טנזורים חיים בכל רגע, והשיא ' + F(peak, 1) + ' MB (הפלט של השכבה הראשונה, בזמן שהשנייה כותבת את שלה).</div>'; msg = 'המנוע מוכן — והוא <b>תפור לכרטיס הזה</b>: הקרנלים שנבחרו (ועליהם הדיוק) תלויים במדידה על ' + GPUS[gi][0] + '. החלף כרטיס ובנה שוב: הבחירות משתנות. לכן לא מעתיקים מנוע בין מכשירים — מעבירים את קובץ ONNX ובונים על היעד (שאלת הראיון).'; }
    body.innerHTML = h; out.innerHTML = msg || (step === 0 ? 'לחץ "שלב הבא".' : step === 3 ? 'לכל שכבה המנוע <i>מריץ</i> כמה מימושים ובוחר את המהיר — זה מה שלוקח דקות בבנייה, ולכן גם התוצאה תלויה בכרטיס.' : step === 4 ? (fp16 ? 'חצי דיוק <i>מותר</i>, לא מחייב: המנוע בוחר אותו לכל שכבה שבה הוא מהיר יותר. לכן בודקים בפלט המפורט מה נבחר בפועל (תרגיל 4.4).' : 'בלי הדגל — הכול בדיוק מלא.') : '');
  }
  draw();
};

/* 4.2 — reading trtexec: H2D, compute, D2H, and what to do about the copies */
W.w6_trtexec = function (box) {
  V.say(box, MODEL + 'הפלט של כלי שורת הפקודות מפרק את הזמן לשלושה: העתקה לכרטיס, חישוב, והעתקה בחזרה. גודל הנתונים <b>מחושב</b> (קלט <span class="ltr">1×3×640×640</span>); רוחב הפס והחישוב — מודל. כפתור "תרגיל 4.2" טוען את המצב של התרגיל: 3 מ"ש חישוב ו־2 העתקה. ונסה את שלושת התיקונים.');
  let comp = 3, u8 = false, pinned = false, streams = false, bw = 2.5; const r1 = row(box); V.slider(r1, 'חישוב בכרטיס (מ"ש)', 0.5, 20, 0.5, comp, v => { comp = v; draw(); }); V.slider(r1, 'רוחב פס, זיכרון רגיל (GB/s)', 1, 12, 0.5, bw, v => { bw = v; draw(); });
  const r2 = row(box); [['שולחים שמונה ביטים ומנרמלים בכרטיס', 'u8'], ['זיכרון נעול', 'pin'], ['שני זרמים — חפיפה', 'st']].forEach(([lab, k]) => { const c = el('label', { html: '<input type="checkbox"> ' + lab + ' &nbsp;' }); c.querySelector('input').onchange = e => { if (k === 'u8') u8 = e.target.checked; if (k === 'pin') pinned = e.target.checked; if (k === 'st') streams = e.target.checked; draw(); }; r2.appendChild(c); });
  const pre = el('pre', { class: 'ltr', style: 'background:#f8f9fa;padding:8px;font-size:12px' }); box.appendChild(pre); const cv = canvas(box, 760, 120, 760); const out = V.say(box);
  function draw() { const inMB = 3 * 640 * 640 * (u8 ? 1 : 4) / 1e6, outMB = 0.4; const B = pinned ? bw * 2.6 : bw; const h2d = inMB / B, d2h = outMB / B; const per = streams ? Math.max(h2d + d2h, comp) : h2d + comp + d2h; const lat = h2d + comp + d2h;
    pre.textContent = '[I] === Performance summary ===\n[I] Throughput: ' + F(1000 / per, 1) + ' qps\n[I] Latency: median = ' + F(lat, 3) + ' ms\n[I] H2D Latency: median = ' + F(h2d, 3) + ' ms   (' + F(inMB, 2) + ' MB)\n[I] GPU Compute Time: median = ' + F(comp, 3) + ' ms\n[I] D2H Latency: median = ' + F(d2h, 3) + ' ms';
    const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 120); const S = 680 / (3 * Math.max(lat, 1)); for (let k = 0; k < 3; k++) { const t0 = streams ? k * per : k * lat; [[h2d, '#e8590c', 'H2D', 0], [comp, '#2f9e44', 'חישוב', 1], [d2h, '#1c7ed6', 'D2H', 0]].reduce((t, [d, c, n, lane]) => { const X = 60 + t * S; const Y = streams ? 20 + lane * 32 : 36; x.fillStyle = c; x.fillRect(X, Y, Math.max(1, d * S - 1), 24); if (d * S > 30) txt(x, n, X + d * S / 2, Y + 16, '#fff', 10, 'center', true); return t + d; }, t0); }
    txt(x, streams ? 'העתקות' : 'זרם אחד', 55, streams ? 36 : 52, '#495057', 10, 'right'); if (streams) txt(x, 'חישוב', 55, 68, '#495057', 10, 'right'); txt(x, 'שלושה פריימים', 740, 110, '#868e96', 10, 'right');
    out.innerHTML = 'ההעתקות הן <b>' + F(100 * (h2d + d2h) / lat, 0) + '%</b> מזמן הפריים. ' + (u8 ? 'שמונה ביטים: פי ארבעה פחות נתונים בדרך לכרטיס. ' : '') + (pinned ? 'זיכרון נעול: ההעתקה לא עוברת דרך חוצץ ביניים — מהירה יותר, ואפשר לעשות אותה ברקע. ' : '') + (streams ? 'שני זרמים: ההעתקה של הפריים הבא רצה בזמן החישוב של הקודם — התפוקה לפי השלב הארוך (' + F(per, 2) + ' מ"ש), אבל ההשהייה של פריים בודד לא קטנה.' : 'כל עוד ההעתקה והחישוב בזה אחר זה, יש גבול למה שהאצת המודל לבד נותנת: ' + (h2d + d2h > comp * 0.4 ? 'גם מודל מהיר פי אינסוף ייתן לכל היותר פי ' + F(lat / (h2d + d2h), 1) + '.' : 'כאן ההעתקה קטנה, והחישוב הוא העיקר.')) + ' בלוח Jetson הזיכרון משותף למעבד ולכרטיס — חלק מההעתקות נחסכות לגמרי.'; }
  V.btns(box, [['תרגיל 4.2', () => { comp = 3; bw = 2.5; draw(); }]]); draw();
};

/* 4.3 — optimization profiles: min / opt / max */
W.w6_profile_shapes = function (box) {
  V.say(box, MODEL + 'פרופיל צורות: מינימום, מיטבי ומקסימום של גודל האצווה. המנוע <b>מקצה זיכרון</b> לפי המקסימום (מחושב מהשלד) ו<b>מכוון קרנלים</b> לפי המיטבי (היעילות — מודל). למטה: שבוע של הפעלה — מצלמה אחת רוב הזמן, ולפעמים שתיים (תרגיל 4.1). צורה מחוץ לטווח — שגיאה.');
  let mn = 1, op = 1, mx = 2, cams = 2; const r1 = row(box); V.slider(r1, 'מינימום', 1, 32, 1, mn, v => { mn = v; draw(); }); V.slider(r1, 'מיטבי', 1, 32, 1, op, v => { op = v; draw(); }); V.slider(r1, 'מקסימום', 1, 32, 1, mx, v => { mx = v; draw(); }); const r2 = row(box); V.slider(r2, 'מספר מצלמות מרבי בשטח', 1, 4, 1, cams, v => { cams = v; draw(); });
  const cv = canvas(box, 760, 170, 760); const out = V.say(box);
  const eff = b => Math.exp(-Math.pow(Math.log2(b / op), 2) / 3);  // 1 at opt, lower away from it
  const ms = b => (2.0 + 1.2 * b) / (0.55 + 0.45 * eff(b));
  function draw() { const ok = mn <= op && op <= mx; const sz = [4.92].concat(LAY.map(l => l.outMB)); let act = 0; for (let i = 0; i < 5; i++) act = Math.max(act, sz[i] + sz[i + 1]); const mem = act * mx; const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 170);
    for (let b = 1; b <= 32; b++) { const X = 40 + (b - 1) * 22; const inR = b >= mn && b <= mx; const t = ms(b) / b; x.fillStyle = !inR ? '#dee2e6' : b === op ? '#2f9e44' : '#74c0fc'; const hh = Math.min(110, t * 30); x.fillRect(X, 130 - hh, 16, hh); if (b <= 4 || b % 4 === 0) txt(x, b, X + 8, 146, '#495057', 10, 'center'); }
    txt(x, 'מ"ש לתמונה, לפי גודל האצווה (אפור — מחוץ לפרופיל: שגיאה)', 750, 14, '#495057', 11, 'right'); txt(x, 'אצווה', 20, 146, '#868e96', 10, 'center');
    const need = [...Array(cams)].map((_, i) => i + 1); const fail = need.filter(b => b < mn || b > mx);
    out.innerHTML = (!ok ? '<b style="color:#e03131">הפרופיל לא חוקי: צריך מינימום ≤ מיטבי ≤ מקסימום.</b> ' : '') + 'זיכרון לטנזורי ביניים: כ־<b>' + F(mem, 0) + ' MB</b> (פי ' + mx + ' משל תמונה אחת). אצווה 1: ' + F(ms(1), 2) + ' מ"ש. ' + (fail.length ? '<b style="color:#e03131">' + ltr('[E] ... dimensions not in range: ' + fail.join(', ')) + '</b> — בשטח יש עד ' + cams + ' מצלמות והפרופיל לא מכסה. ' : 'כל הצורות שבשטח (עד ' + cams + ') בתוך הפרופיל. ') + (mx > 2 * cams ? 'טווח רחב מדי: זיכרון מבוזבז, ' + (op > cams ? 'והקרנלים מכוונים לאצווה שלא קורית.' : 'אף שהקרנלים עדיין מכוונים נכון.') : '') + ' חלופה: שני פרופילים באותו מנוע, או שני מנועים.'; }
  draw();
};

/* 4.4 — the engine cache: when is it rebuilt */
W.w6_trt_cache = function (box) {
  V.say(box, MODEL + 'עשר הפעלות של המערכת על הרחפן, עם מטמון מנועים. בין ההפעלות קורים אירועים — לחץ כדי להוסיף אותם. המפתח של המטמון קובע מתי בונים מחדש: בחר מה הוא כולל. הבנייה ארוכה (כאן 45 שניות), טעינה מהמטמון — חצי שנייה.');
  const KEYS = [['hash', 'תוכן קובץ ONNX'], ['opts', 'אפשרויות הבנייה (חצי דיוק)'], ['gpu', 'דגם הכרטיס'], ['ver', 'גרסת המנוע']]; const key = { hash: true, opts: true, gpu: true, ver: true };
  const EV = [['📦 מודל חדש (אימון מחדש)', 'hash'], ['⚙ הודלק חצי דיוק', 'opts'], ['🔁 הוחלף הלוח בדגם אחר', 'gpu'], ['⬆ עודכנה גרסת המנוע', 'ver'], ['🔌 סתם הפעלה מחדש', null]]; let events = [];
  const r1 = row(box); KEYS.forEach(([k, n]) => { const c = el('label', { html: '<input type="checkbox" checked> ' + n + ' &nbsp;' }); c.querySelector('input').onchange = e => { key[k] = e.target.checked; draw(); }; r1.appendChild(c); });
  const r2 = row(box); V.btns(r2, EV.map(([n, k]) => [n, () => { if (events.length < 9) events.push(k); draw(); }]).concat([['נקה', () => { events = []; draw(); }]]));
  const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const st = { hash: 0, opts: 0, gpu: 0, ver: 0 }; let cache = null; const rows = []; let total = 0, wrong = 0, builds = 0;
    for (let i = 0; i <= events.length; i++) { const ev = i ? events[i - 1] : null; if (ev) st[ev]++; const real = JSON.stringify(st); const k = JSON.stringify(Object.keys(st).filter(x => key[x]).map(x => st[x]));
      let what, t; if (cache && cache.k === k) { if (cache.real === real) { what = 'נטען מהמטמון'; t = 0.5; } else { const bad = cache.real && JSON.parse(cache.real); const diff = Object.keys(st).find(x => bad[x] !== st[x]); if (diff === 'gpu' || diff === 'ver') { what = '<b style="color:#e03131">נטען מנוע של כרטיס/גרסה אחרים — נכשל או רץ עם קרנלים לא נכונים</b>'; } else { what = '<b style="color:#e03131">נטען מנוע <i>ישן</i> — ' + (diff === 'hash' ? 'המודל הקודם רץ בשקט' : 'בלי חצי דיוק, בשקט') + '</b>'; } t = 0.5; wrong++; } } else { what = 'נבנה (' + (cache ? 'המפתח השתנה' : 'אין מטמון') + ')'; t = 45; builds++; cache = { k, real }; }
      total += t; rows.push([i + 1, ev ? EV.find(e => e[1] === ev)[0] : '—', what, F(t, 1) + ' ש׳']); }
    tb.innerHTML = table(['הפעלה', 'מה קרה לפני', 'המנוע', 'זמן עלייה'], rows);
    out.innerHTML = 'בניות: ' + builds + '. ' + (wrong ? '<b style="color:#e03131">הפעלות עם מנוע לא נכון: ' + wrong + '</b>. ' : 'אף מנוע לא נכון. ') + (wrong ? 'כל שדה שחסר במפתח הוא מקרה שבו המטמון "מצליח" — וטוען משהו שלא מתאים. ' : '') + 'המפתח הנכון כולל את כל הארבעה; והבנייה הראשונה אחרי כל שינוי עולה עשרות שניות — על רחפן עושים אותה בהכנה לטיסה, לא בהמראה.'; }
  draw();
};

/* 4.5 — two ways to INT8 in the engine */
W.w6_int8_paths = function (box) {
  V.say(box, MODEL + 'שמונה שכבות של מזהה. <b>כיול</b>: המנוע מקבל תמונות, מחשב טווחים, ומכמם כל שכבה שבה זה מהיר יותר. <b>צמתי כימום מפורשים</b> (Q/DQ): אתה מסמן אילו שכבות מכוממות — לחץ על שכבה. הרגישות של כל שכבה (כמה נקודות דיוק היא מאבדת) והזמנים — מודל; פרקים 5 ו־6 מחשבים אותם באמת.');
  const LS = [['conv ראשונה', 1.8, 0.9], ['conv 2', 0.3, 1.6], ['conv 3', 0.2, 1.8], ['conv 4', 0.2, 1.7], ['conv 5', 0.3, 1.2], ['איחוד סולמות', 0.4, 0.8], ['ראש — מחלקות', 0.5, 0.6], ['ראש — תיבות', 2.2, 0.6]]; let path = 0, calNight = false; const sel = LS.map((_, i) => i > 0 && i < 7);
  V.tabs(box, ['כיול (המנוע מחליט)', 'צמתי Q/DQ (אתה מחליט)'], k => { path = k; draw(); }); const r1 = row(box); const c = el('label', { html: '<input type="checkbox"> סט הכיול צולם ביום — והטיסה בלילה' }); c.querySelector('input').onchange = e => { calNight = e.target.checked; draw(); }; r1.appendChild(c);
  const cv = canvas(box, 760, 120, 760); const out = V.say(box);
  cv.onclick = e => { if (path !== 1) return; const r = cv.getBoundingClientRect(); const i = Math.floor((e.clientX - r.left) / r.width * 760 / 95); if (i >= 0 && i < 8) { sel[i] = !sel[i]; draw(); } };
  function draw() { const q = LS.map((_, i) => path === 0 ? true : sel[i]); const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 120); let t = 0, loss = 0;
    LS.forEach(([n, s, ms], i) => { const X = 5 + i * 95; x.fillStyle = q[i] ? '#ae3ec9' : '#1c7ed6'; x.fillRect(X, 20, 88, 50); txt(x, n, X + 44, 42, '#fff', 10, 'center', true); txt(x, q[i] ? 'INT8' : 'FP16', X + 44, 60, '#fff', 10, 'center'); txt(x, '−' + F(s, 1) + ' נק׳', X + 44, 86, '#495057', 10, 'center'); t += q[i] ? ms * 0.55 : ms; loss += q[i] ? s * (calNight ? 2.5 : 1) : 0; });
    txt(x, path === 1 ? 'לחץ על שכבה כדי להחליף' : 'המנוע מכמם כל שכבה שבה INT8 מהיר יותר', 750, 108, '#868e96', 10, 'right');
    const full = LS.reduce((a, l) => a + l[2], 0); out.innerHTML = 'זמן (מודל): <b>' + F(t, 2) + ' מ"ש</b> (הכול בחצי דיוק: ' + F(full, 2) + '); אובדן דיוק משוער: <b>' + F(loss, 1) + ' נקודות</b>. ' + (path === 0 ? 'המנוע בוחר לפי <i>מהירות</i>, לא לפי רגישות: גם השכבה הראשונה וראש התיבות — הרגישות ביותר — כוממו. ' : (q[0] || q[7] ? 'השכבה הראשונה וראש התיבות הן הרגישות — נסה להשאיר אותן בחצי דיוק: מאבדים מעט מהירות ומרוויחים את רוב הדיוק. ' : 'השארת את הרגישות בחצי דיוק — רוב המהירות, ומעט אובדן. זו הסיבה שהדרך המפורשת מומלצת בגרסאות החדשות. ')) + (calNight ? '<b>וסט כיול שלא מייצג את השטח</b> נותן טווחים שגויים — האובדן גדל בכל שכבה מכוממת. מכיילים על פריימים מהשטח, ונפרדים מסט ההערכה (תרגיל 4.4).' : ''); }
  draw();
};
})();

/* ===================================================================== chapter 5 — all computed here */
(function () {
const W = window.W, V = window.V, el = V.el, D4 = window.D4; const { F, ltr, canvas, table, row, txt, rng, randn } = D4;
const Q = window.Q6 = {
  sym(xs, bits) { const qmax = 2 ** (bits - 1) - 1; const m = Math.max(1e-12, ...xs.map(Math.abs)); const s = m / qmax; return { s, z: 0, lo: -qmax, hi: qmax, q: xs.map(x => Math.max(-qmax, Math.min(qmax, Math.round(x / s)))) }; },
  asym(xs, bits) { const qmax = 2 ** bits - 1; const lo = Math.min(0, ...xs), hi = Math.max(0, ...xs); const s = Math.max(hi - lo, 1e-12) / qmax; const z = Math.round(-lo / s); return { s, z, lo: 0, hi: qmax, q: xs.map(x => Math.max(0, Math.min(qmax, Math.round(x / s) + z))) }; },
  deq(r) { return r.q.map(q => (q - r.z) * r.s); },
  f16(x) { if (!isFinite(x)) return x; const a = Math.abs(x); if (a >= 65520) return x > 0 ? Infinity : -Infinity; let e = a ? Math.floor(Math.log2(a)) : -14; if (e < -14) e = -14; const u = 2 ** (e - 10); return Math.sign(x) * Math.round(a / u) * u; }
};
const parseVec = s => s.split(/[ ,;]+/).map(Number).filter(v => !isNaN(v));

/* 5.1 — the formula on a number line */
W.w6_quant_vec = function (box) {
  V.say(box, 'הקלד וקטור (או בחר דוגמה), בחר ביטים ושיטה. ציר המספרים מראה את כל המדרגות האפשריות (הקווים האפורים), כל ערך מקורי (נקודה) ולאן הוא נוחת (חץ). הטבלה עושה את הנוסחה עמודה אחר עמודה: <span class="ltr">x/s</span>, עיגול וחיתוך, ושחזור <span class="ltr">x̂ = s·(q − z)</span>.');
  let txtv = '0.31, -1.27, 0.5, 0.004', bits = 8, mode = 0; const r1 = row(box); const inp = el('input', { type: 'text', value: txtv, class: 'ltr', style: 'width:280px' }); inp.oninput = () => { txtv = inp.value; draw(); }; r1.appendChild(inp);
  V.btns(r1, [['הסעיף', () => set('0.31, -1.27, 0.5, 0.004', 0)], ['תרגיל 5.1', () => set('0.8, -0.2, 2.54, 0.011', 0)], ['אחרי הפעלה (5.2)', () => set('0, 0.4, 1.1, 2.05, 3.3', -1)]]);
  const r2 = row(box); V.slider(r2, 'ביטים', 2, 8, 1, bits, v => { bits = v; draw(); }); const tabs = el('div'); r2.appendChild(tabs); V.tabs(tabs, ['סימטרי (z = 0)', 'לא סימטרי (0 עד 2ᵇ−1)'], k => { mode = k; draw(); });
  const cv = canvas(box, 760, 130, 760); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function set(v, m) { txtv = v; inp.value = v; draw(); }
  function draw() { const xs = parseVec(txtv); if (!xs.length) return; const r = mode ? Q.asym(xs, bits) : Q.sym(xs, bits); const xh = Q.deq(r); const lo = Math.min(...xs, ...xh, 0), hi = Math.max(...xs, ...xh, 0); const pad = (hi - lo) * 0.05 + 1e-9; const X = v => 20 + (v - lo + pad) / (hi - lo + 2 * pad) * 720;
    const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 130); x.strokeStyle = '#495057'; x.beginPath(); x.moveTo(10, 70); x.lineTo(750, 70); x.stroke();
    const nlev = r.hi - r.lo + 1; if (nlev <= 260) for (let q = r.lo; q <= r.hi; q++) { const v = (q - r.z) * r.s; if (v < lo - pad || v > hi + pad) continue; x.strokeStyle = nlev > 64 ? '#e9ecef' : '#ced4da'; x.beginPath(); x.moveTo(X(v), 58); x.lineTo(X(v), 82); x.stroke(); }
    x.strokeStyle = '#212529'; x.beginPath(); x.moveTo(X(0), 50); x.lineTo(X(0), 90); x.stroke(); txt(x, '0', X(0), 104, '#212529', 10, 'center');
    xs.forEach((v, i) => { const c = ['#1c7ed6', '#e8590c', '#2f9e44', '#ae3ec9', '#f08c00', '#0c8599'][i % 6]; x.fillStyle = c; x.beginPath(); x.arc(X(v), 40, 5, 0, 7); x.fill(); x.strokeStyle = c; x.beginPath(); x.moveTo(X(v), 45); x.lineTo(X(xh[i]), 66); x.stroke(); x.fillRect(X(xh[i]) - 2, 66, 4, 8); txt(x, F(v, 3), X(v), 24 - (i % 2) * 10, c, 10, 'center'); });
    tb.innerHTML = table(['x', 'x / s', 'q', 'x̂', 'שגיאה'], xs.map((v, i) => [F(v, 4), F(v / r.s + (mode ? r.z : 0), 2), '<b>' + r.q[i] + '</b>', F(xh[i], 4), F(Math.abs(v - xh[i]), 4)]));
    const emax = Math.max(...xs.map((v, i) => Math.abs(v - xh[i]))); const neg = xs.some(v => v < 0);
    out.innerHTML = 'סקאלה <b>s = ' + F(r.s, 5) + '</b>' + (mode ? ', נקודת אפס <b>z = ' + r.z + '</b>' : '') + ', ' + nlev + ' מדרגות. שגיאה מרבית ' + F(emax, 4) + ' — לכל היותר חצי סקאלה (' + F(r.s / 2, 4) + ')' + (xs.some((v, i) => v !== 0 && r.q[i] === r.z) ? '. <b>ערך קטן מחצי סקאלה נעלם לגמרי</b> — הופך לאפס' : '') + '. ' + (!mode && !neg ? 'כל הערכים חיוביים — <b>חצי מהמדרגות (השליליות) מבוזבזות</b>. עבור ללא סימטרי: הסקאלה קטנה פי שניים בערך.' : mode && neg ? 'בלא סימטרי, z מזיז את האפס כך שגם המינימום וגם המקסימום נכנסים — ואפס עדיין מיוצג בדיוק (חשוב לריפוד).' : ''); }
  draw();
};

/* 5.2 — how big is the error, really */
W.w6_quant_error = function (box) {
  V.say(box, 'מטריצה של 64 על 64 משקלות מהתפלגות נורמלית (כמו שכבה מאומנת), מכוממת כאן. ההיסטוגרמה היא של השגיאות <span class="ltr">x − x̂</span>, והקווים — התאוריה: <span class="ltr">±s/2</span> לשגיאה המרבית, <span class="ltr">s/√12</span> לשורש ממוצע הריבועים. מחוון "חיתוך" קובע את הסקאלה לפי אחוזון במקום לפי המקסימום: הסקאלה קטנה, אבל הערכים הקיצוניים נחתכים — ההתחלה של הכיול בפרק 6.');
  let bits = 8, pct = 100, seed = 0, tails = false; const r1 = row(box); V.slider(r1, 'ביטים', 2, 8, 1, bits, v => { bits = v; draw(); }); V.slider(r1, 'חיתוך באחוזון', 99, 100, 0.05, pct, v => { pct = v; draw(); }, v => F(v, 2)); const r2 = row(box); V.btns(r2, [['🎲 מטריצה אחרת', () => { seed++; draw(); }]]); const c = el('label', { html: ' <input type="checkbox"> זנבות כבדים (כמה משקלות חריגים)' }); c.querySelector('input').onchange = e => { tails = e.target.checked; draw(); }; r2.appendChild(c);
  const cv = canvas(box, 760, 180, 760); const cv2 = canvas(box, 760, 120, 760); const out = V.say(box);
  function err(w, bits, p) { const a = w.map(Math.abs).sort((x, y) => x - y); const m = a[Math.min(a.length - 1, Math.floor(p / 100 * (a.length - 1)))]; const qmax = 2 ** (bits - 1) - 1; const s = m / qmax; let se = 0, mx = 0; const e = w.map(v => { const xh = Math.max(-qmax, Math.min(qmax, Math.round(v / s))) * s; const d = v - xh; se += d * d; mx = Math.max(mx, Math.abs(d)); return d; }); return { s, rms: Math.sqrt(se / w.length), mx, e }; }
  function draw() { const r = rng(seed * 97 + 5); const w = [...Array(4096)].map(() => randn(r) * 0.1 * (tails && r() < 0.004 ? 6 : 1)); const R = err(w, bits, pct); const sd = Math.sqrt(w.reduce((a, v) => a + v * v, 0) / w.length);
    const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 180); const lim = Math.max(R.mx, R.s * 0.6) * 1.1; const NB = 60; const h = new Array(NB).fill(0); R.e.forEach(d => { const k = Math.floor((d + lim) / (2 * lim) * NB); if (k >= 0 && k < NB) h[k]++; }); const hm = Math.max(...h); const X = d => 30 + (d + lim) / (2 * lim) * 700;
    h.forEach((n, k) => { x.fillStyle = '#74c0fc'; const hh = n / hm * 130; x.fillRect(30 + k * 700 / NB, 150 - hh, 700 / NB - 1, hh); }); [[-R.s / 2, 's/2−'], [R.s / 2, 's/2']].forEach(([v, n]) => { x.strokeStyle = '#e03131'; x.setLineDash([4, 3]); x.beginPath(); x.moveTo(X(v), 10); x.lineTo(X(v), 150); x.stroke(); x.setLineDash([]); txt(x, n, X(v), 166, '#e03131', 10, 'center'); }); txt(x, 'היסטוגרמה של השגיאות', 750, 14, '#495057', 11, 'right'); txt(x, '0', X(0), 166, '#495057', 10, 'center');
    const x2 = cv2.getContext('2d'); x2.clearRect(0, 0, 760, 120); const ps = [99, 99.2, 99.4, 99.6, 99.8, 99.9, 99.95, 100]; const rs = ps.map(p => err(w, bits, p).rms); const rm = Math.max(...rs); ps.forEach((p, i) => { const X2 = 60 + i * 85; const hh = rs[i] / rm * 70; x2.fillStyle = Math.abs(p - pct) < 0.03 ? '#e8590c' : '#adb5bd'; x2.fillRect(X2, 90 - hh, 50, hh); txt(x2, F(p, 2), X2 + 25, 104, '#495057', 10, 'center'); }); txt(x2, 'שורש ממוצע ריבועי השגיאה, לפי אחוזון החיתוך', 750, 14, '#495057', 11, 'right');
    out.innerHTML = 'סקאלה ' + F(R.s, 5) + '. שגיאה מרבית <b>' + F(R.mx, 5) + '</b> (חצי סקאלה: ' + F(R.s / 2, 5) + (R.mx > R.s * 0.51 ? ' — <b>חרגנו: ערכים שנחתכו</b>' : '') + '). שורש ממוצע ריבועים <b>' + F(R.rms, 5) + '</b> (התאוריה <span class="ltr">s/√12</span>: ' + F(R.s / Math.sqrt(12), 5) + '), ‏' + F(100 * R.rms / sd, 1) + '% מפיזור המשקלות. ' + (bits <= 4 ? 'בקורס, על הרשת של פרק 2: 8 ביטים — 0.9%, 4 ביטים — 15.6%, והדיוק כמעט לא זז עד 4 ביטים; ב־2 ביטים הוא קורס.' : '') + (tails ? ' עם זנבות כבדים, הסקאלה לפי המקסימום גדולה מדי לכל השאר — וחיתוך קל מנצח.' : ''); }
  draw();
};

/* 5.3 — one scale, or one per output channel */
W.w6_per_channel = function (box) {
  V.say(box, 'מטריצה של 64 קלטים על 16 עמודות (ערוצי פלט), ועמודה אחת חריגה — המשקלות שלה גדולים פי k. עם <b>סקאלה אחת</b>, העמודה החריגה קובעת את הסקאלה לכולן; עם <b>סקאלה לכל עמודה</b>, כל עמודה מנצלת את כל 255 המדרגות. המפה: השגיאה היחסית בכל תא (כהה = גדולה).');
  let k = 40, bits = 8; const r1 = row(box); V.slider(r1, 'פי כמה העמודה החריגה', 1, 80, 1, k, v => { k = v; draw(); }); V.slider(r1, 'ביטים', 2, 8, 1, bits, v => { bits = v; draw(); });
  const cv = canvas(box, 760, 200, 760); const out = V.say(box);
  function draw() { const r = rng(17); const Wm = [...Array(64)].map(() => [...Array(16)].map((_, j) => randn(r) * 0.1 * (j === 5 ? k : 1))); const qmax = 2 ** (bits - 1) - 1;
    const sT = Math.max(...Wm.flat().map(Math.abs)) / qmax; const sC = [...Array(16)].map((_, j) => Math.max(...Wm.map(row => Math.abs(row[j]))) / qmax);
    const relErr = (s) => { const res = []; for (let j = 0; j < 16; j++) { let se = 0, sx = 0; for (let i = 0; i < 64; i++) { const v = Wm[i][j], sj = Array.isArray(s) ? s[j] : s; const e = v - Math.max(-qmax, Math.min(qmax, Math.round(v / sj))) * sj; se += e * e; sx += v * v; } res.push(Math.sqrt(se / sx)); } return res; };
    const eT = relErr(sT), eC = relErr(sC); const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 200);
    [[eT, 'סקאלה אחת', 20], [eC, 'סקאלה לכל עמודה', 400]].forEach(([e, n, X0]) => { txt(x, n, X0 + 170, 16, '#212529', 12, 'center', true); e.forEach((v, j) => { const c = Math.min(1, v / 0.5); x.fillStyle = 'rgb(' + Math.round(255 - 200 * c) + ',' + Math.round(255 - 220 * c) + ',' + Math.round(255 - 120 * c) + ')'; x.fillRect(X0 + j * 21, 26, 19, 130); if (j === 5) { x.strokeStyle = '#e8590c'; x.lineWidth = 2; x.strokeRect(X0 + j * 21, 26, 19, 130); x.lineWidth = 1; } txt(x, F(100 * v, v < 0.1 ? 1 : 0), X0 + j * 21 + 10, 172, '#495057', 9, 'center'); }); });
    txt(x, 'שגיאה יחסית בכל עמודה, %  (המסגרת הכתומה — העמודה החריגה)', 750, 194, '#868e96', 10, 'right');
    const avg = e => e.filter((_, j) => j !== 5).reduce((a, b) => a + b, 0) / 15; out.innerHTML = 'בעמודות הרגילות: <b>' + F(100 * avg(eT), 1) + '%</b> עם סקאלה אחת, <b>' + F(100 * avg(eC), 1) + '%</b> עם סקאלה לכל עמודה (בקורס, פי 40: ‏24.2% ו־0.6%). המחיר: 16 סקאלות במקום אחת — ‏64 בתים. ולמה רק לפי ערוץ <i>פלט</i>: ‏<span class="ltr">y_j = s_x·s_j·Σ q_i·w_ij</span> — הסקאלה של עמודה j יוצאת מחוץ לסכום. סקאלה לכל ערוץ <i>קלט</i> הייתה בתוך הסכום, וכל מכפלה הייתה צריכה כפל עשרוני משלה (שאלת הראיון).'; }
  draw();
};

/* 5.4 — half precision: spacing, overflow, underflow */
W.w6_fp16 = function (box) {
  V.say(box, 'חצי דיוק כאן מחושב ביד (עיגול ל־10 ביטים של מנטיסה, טווח מעריך של 16 ביט). שלושה ניסויים: (1) המרווח בין שני מספרים סמוכים — לפי הגודל; (2) סכום ארוך <i>בחצי דיוק</i> של 4,096 הפעלות, מול סכום מדויק; (3) פונקציית הסתברות על ערכים גדולים, עם ובלי החסרת המקסימום.');
  let v = 1000, n = 4096, act = 3.2, top = 12; const r1 = row(box); V.slider(r1, 'מספר (1)', -3, 5, 0.1, 3, x => { v = 10 ** x; draw(); }, x => F(10 ** x, x < 0 ? 4 : 1)); const r2 = row(box); V.slider(r2, 'גודל הפעלה ממוצע (2)', 0.5, 30, 0.1, act, x => { act = x; draw(); }); V.slider(r2, 'הערך הגדול ביותר לפני ההסתברות (3)', 2, 20, 0.5, top, x => { top = x; draw(); });
  const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const f = Q.f16; const u = Math.max(f(v * (1 + 1e-3)) - f(v), 2 ** -24); let e = Math.floor(Math.log2(v)); if (e < -14) e = -14; const ulp = 2 ** (e - 10);
    const r = rng(3); const xs = [...Array(n)].map(() => act * (0.5 + r())); let s16 = 0, s32 = 0; let stuck = -1; xs.forEach((x, i) => { const ns = f(s16 + f(x)); if (ns === s16 && stuck < 0) stuck = i; s16 = ns; s32 += x; });
    const z = [top, top - 1, top - 3, 1, 0]; const ex16 = z.map(t => f(Math.exp(t))); const sum16 = ex16.reduce((a, b) => f(a + b), 0); const p16 = ex16.map(t => f(t / sum16)); const zm = z.map(t => t - top); const e2 = zm.map(t => f(Math.exp(t))); const s2 = e2.reduce((a, b) => f(a + b), 0); const p2 = e2.map(t => f(t / s2));
    tb.innerHTML = table(['ניסוי', 'בחצי דיוק', 'מדויק'], [['(1) ' + F(v, 4) + ' נשמר כ־', F(f(v), 6), F(v, 6)], ['(1) המרווח לשכן הבא', F(ulp, 6) + ' (' + F(100 * ulp / v, 3) + '%)', '—'], ['(2) סכום של 4,096 הפעלות', isFinite(s16) ? F(s16, 1) : '<b style="color:#e03131">inf</b>', F(s32, 1)], ['(3) הסתברויות, ישירות', p16.map(p => isNaN(p) ? '<b style="color:#e03131">NaN</b>' : F(p, 3)).join(', '), ''], ['(3) עם החסרת המקסימום', p2.map(p => F(p, 3)).join(', '), (() => { const ee = z.map(t => Math.exp(t - top)); const ss = ee.reduce((a, b) => a + b); return ee.map(t => F(t / ss, 3)).join(', '); })()]]);
    out.innerHTML = 'בחצי דיוק יש 11 ביטים משמעותיים — בערך 0.05%–0.1% דיוק יחסי, בכל גודל. ' + (v < 6.1e-5 ? 'מתחת ל־6·10⁻⁵ המרווח כבר לא קטן עם הערך (מספרים "תת־נורמליים"), ומתחת ל־6·10⁻⁸ — הכול אפס. ' : '') + 'בסכום הארוך: ' + (isFinite(s16) ? (stuck >= 0 ? 'מהאיבר ה־' + stuck + ' הסכום כבר גדול, המרווח שלו מתקרב לגודל ההפעלה, וחלק מההוספות <b>מתעגלות לאפס</b> — בסוף הוא חסר ' + F(100 * (1 - s16 / s32), 1) + '%. ' : 'הסכום קרוב. ') : '<b>עבר את 65,504 והפך לאינסוף.</b> ') + (ex16.some(t => !isFinite(t)) ? '<b>וההסתברות: <span class="ltr">e^' + top + '</span> עבר את 65,504</b> — אינסוף, ואחר כך NaN. החסרת המקסימום (מה שכל מימוש טוב עושה) פותרת. ' : '') + 'לכן מנועים צוברים בדיוק מלא ומשאירים שכבות רגישות בדיוק מלא — והמשקלות עצמם, בחצי דיוק, כמעט לא משתנים (בקורס: שגיאה מרבית 0.0004, הדיוק לא זז).'; }
  draw();
};

/* 5.5 — one output in real integer arithmetic */
W.w6_int_dot = function (box) {
  V.say(box, 'נוירון אחד, בחשבון שלם אמיתי: קלטים ומשקלות בשמונה ביטים, מכפלות שלמות, וצבירה — ב־32 ביט, או ב־16 ביט (שגולש ומתעטף, כמו <code class="ltr">short</code> ב־Java). הגרף: הצבר אחרי כל מכפלה. בסוף — כפל אחד בסקאלות, והשוואה לחישוב העשרוני.');
  let n = 64, u8 = false, worst = false, seed = 0; const r1 = row(box); V.tabs(r1, ['64 קלטים (השכבה של 5.5)', '2,304 (קונבולוציה 3×3×256)'], k => { n = k ? 2304 : 64; draw(); }); const r2 = row(box); [['קלט 0..255 (uint8)', 'u'], ['המקרה הגרוע (כולם מקסימליים)', 'w']].forEach(([l, k]) => { const c = el('label', { html: '<input type="checkbox"> ' + l + ' &nbsp;' }); c.querySelector('input').onchange = e => { if (k === 'u') u8 = e.target.checked; else worst = e.target.checked; draw(); }; r2.appendChild(c); }); V.btns(r2, [['🎲', () => { seed++; draw(); }]]);
  const cv = canvas(box, 760, 190, 760); const out = V.say(box);
  function draw() { const r = rng(seed * 31 + 7); const xmax = u8 ? 255 : 127; const x = [...Array(n)].map(() => worst ? 1 : r()); const w = [...Array(n)].map(() => worst ? 0.1 : randn(r) * 0.1 + 0.04);
    const sx = 1 / xmax, qx = x.map(v => Math.round(v / sx)); const sw = Math.max(...w.map(Math.abs)) / 127, qw = w.map(v => Math.round(v / sw));
    let a32 = 0, a16 = 0; const p32 = [], p16 = []; for (let i = 0; i < n; i++) { a32 += qx[i] * qw[i]; a16 = ((a16 + qx[i] * qw[i] + 32768) % 65536 + 65536) % 65536 - 32768; p32.push(a32); p16.push(a16); }
    const yf = x.reduce((s, v, i) => s + v * w[i], 0); const yi = a32 * sx * sw, y16 = a16 * sx * sw; const mx = Math.max(...p32.map(Math.abs), 40000);
    const c = cv.getContext('2d'); c.clearRect(0, 0, 760, 190); const Y = v => 95 - v / mx * 80; const X = i => 40 + i / (n - 1) * 700; c.fillStyle = '#fff4e6'; c.fillRect(40, Y(32767), 700, Y(-32768) - Y(32767)); txt(c, 'טווח של 16 ביט', 736, Y(32767) + 12, '#e8590c', 10, 'right');
    [[p32, '#1c7ed6'], [p16, '#e03131']].forEach(([p, col]) => { c.strokeStyle = col; c.beginPath(); p.forEach((v, i) => i ? c.lineTo(X(i), Y(v)) : c.moveTo(X(i), Y(v))); c.stroke(); }); c.strokeStyle = '#adb5bd'; c.beginPath(); c.moveTo(40, Y(0)); c.lineTo(740, Y(0)); c.stroke(); txt(c, 'כחול — צבר של 32 ביט · אדום — 16 ביט', 736, 184, '#495057', 10, 'right');
    const bound = n * xmax * 127; out.innerHTML = 'הצבר הגיע ל־<b>' + a32.toLocaleString() + '</b>; התוצאה: <span class="ltr">' + a32 + ' · ' + F(sx, 5) + ' · ' + F(sw, 6) + ' = ' + F(yi, 4) + '</span>, מול עשרוני ' + F(yf, 4) + ' (הפרש ' + F(Math.abs(yi - yf), 4) + '). ' + (p32.some(v => Math.abs(v) > 32767) ? '<b style="color:#e03131">בצבר של 16 ביט — גלישה:</b> הוא התעטף ונתן ' + F(y16, 3) + '. ' : 'הצבר לא יצא מטווח של 16 ביט הפעם — אבל אין על זה ערובה. ') + 'הגבול העליון: <span class="ltr">' + n.toLocaleString() + ' × ' + xmax + ' × 127 = ' + bound.toLocaleString() + '</span> — ' + (bound < 2 ** 31 ? 'בטוח בתוך 32 ביט (2.1 מיליארד), תרגיל 5.3.' : 'מעבר ל־32 ביט!') + ' ובזיכרון: ' + n + ' משקלות — ' + (4 * n).toLocaleString() + ' בתים ב־32 ביט, ' + n.toLocaleString() + ' בשמונה.'; }
  draw();
};
})();

/* ===================================================================== chapter 6 */
(function () {
const W = window.W, V = window.V, el = V.el, D4 = window.D4; const { F, canvas, table, row, txt, rng, randn } = D4;

/* 6.1 — calibration: choose the range from calibration data, measure on separate data */
W.w6_calib = function (box) {
  V.say(box, 'ההפעלות בקלט של שכבה אחרי Relu, מ־<b>סט כיול</b> של 100 "תמונות" (כל אחת 400 ערכים). בחר שיטה, והטווח שנבחר מסומן על ההיסטוגרמה. השגיאה נמדדת על <b>סט הערכה נפרד</b> — כמה רחוק הכימום מהמקור. שני קלקולים: פיקסלים שרופים בתמונה אחת (כמו בקורס), וטיסה בלילה כשהכיול נעשה ביום. "החיפוש" בוחר את נקודת החיתוך שממזערת את השגיאה על סט הכיול — הרעיון של שיטות כמו האנטרופיה.');
  let method = 1, pct = 99.9, bits = 4, burned = true, night = false; V.tabs(box, ['מינימום־מקסימום', 'אחוזון', 'חיפוש (שגיאה מינימלית)'], k => { method = k; draw(); }, 1);
  const r1 = row(box); V.slider(r1, 'אחוזון', 90, 100, 0.01, pct, v => { pct = v; draw(); }, v => F(v, 2)); V.slider(r1, 'ביטים להפעלות', 2, 8, 1, bits, v => { bits = v; draw(); });
  const r2 = row(box); [['פיקסלים שרופים בתמונה אחת', 'b', true], ['הערכה בלילה (כיול ביום)', 'n', false]].forEach(([l, k, on]) => { const c = el('label', { html: '<input type="checkbox"' + (on ? ' checked' : '') + '> ' + l + ' &nbsp;' }); c.querySelector('input').onchange = e => { if (k === 'b') burned = e.target.checked; else night = e.target.checked; draw(); }; r2.appendChild(c); });
  const cv = canvas(box, 760, 170, 760); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  const gen = (seed, n, scale) => { const r = rng(seed); return [...Array(n)].map(() => Math.max(0, randn(r) * 0.9 + 0.3) * scale); };
  const mse = (xs, hi, b) => { const qm = 2 ** b - 1, s = Math.max(hi, 1e-9) / qm; let e = 0; for (const v of xs) { const d = v - Math.min(qm, Math.round(v / s)) * s; e += d * d; } return Math.sqrt(e / xs.length); };
  const pctl = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor(p / 100 * (sorted.length - 1)))];
  function draw() { const cal = gen(11, 40000, 1); if (burned) for (let i = 0; i < 4; i++) cal[i] = 8 * 3.8; const ev = gen(23, 20000, night ? 0.45 : 1); const srt = cal.slice().sort((a, b) => a - b); const mx = srt[srt.length - 1];
    let hi; if (method === 0) hi = mx; else if (method === 1) hi = pctl(srt, pct); else { const sub = cal.filter((_, i) => i % 4 === 0); let best = 1e9; for (let k = 1; k <= 200; k++) { const h = mx * k / 200; const e = mse(sub, h, bits); if (e < best) { best = e; hi = h; } } }
    const e = mse(ev, hi, bits); const eMax = mse(ev, mx, bits); const evs = ev.slice().sort((a, b) => a - b); const eOr = mse(ev, evs[evs.length - 1], bits); const clipped = ev.filter(v => v > hi).length / ev.length;
    const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 170); const top = Math.min(mx, 6); const NB = 80; const hc = new Array(NB).fill(0), he = new Array(NB).fill(0); cal.forEach(v => { const k = Math.min(NB - 1, Math.floor(v / top * NB)); hc[k]++; }); ev.forEach(v => { const k = Math.min(NB - 1, Math.floor(v / top * NB)); he[k] += cal.length / ev.length; }); const hm = Math.max(...hc.slice(1), ...he.slice(1));
    const X = v => 30 + Math.min(v, top) / top * 700; for (let k = 0; k < NB; k++) { const hh = Math.min(120, hc[k] / hm * 120); x.fillStyle = '#74c0fc'; x.fillRect(30 + k * 700 / NB, 140 - hh, 700 / NB - 1, hh); if (night) { const h2 = Math.min(120, he[k] / hm * 120); x.strokeStyle = '#7048e8'; x.strokeRect(30 + k * 700 / NB, 140 - h2, 700 / NB - 1, h2); } }
    x.strokeStyle = '#e03131'; x.lineWidth = 2; x.beginPath(); x.moveTo(X(hi), 10); x.lineTo(X(hi), 140); x.stroke(); x.lineWidth = 1; txt(x, 'hi = ' + F(hi, 2) + (hi > top ? ' →' : ''), X(hi) - 4, 22, '#e03131', 11, 'right', true);
    if (burned) txt(x, 'ארבעה פיקסלים שרופים ב־' + F(mx, 1) + ' (מחוץ לתרשים)', 740, 22, '#e8590c', 10, 'right'); txt(x, '0', 30, 156, '#495057', 10, 'center'); txt(x, F(top, 1), 730, 156, '#495057', 10, 'center'); if (night) txt(x, 'סגול — התפלגות ההערכה בלילה', 740, 38, '#7048e8', 10, 'right');
    tb.innerHTML = table(['', 'הטווח העליון', 'סקאלה', 'שגיאה על סט ההערכה', 'נחתכו'], [['השיטה שבחרת', F(hi, 3), F(hi / (2 ** bits - 1), 4), '<b>' + F(e, 4) + '</b>', F(100 * clipped, 2) + '%'], ['מינימום־מקסימום', F(mx, 3), F(mx / (2 ** bits - 1), 4), F(eMax, 4), '0%'], ['"רמאות": מקסימום של סט ההערכה עצמו', F(evs[evs.length - 1], 3), '', F(eOr, 4), '0%']]);
    out.innerHTML = (burned && method === 0 ? '<b>ארבעה ערכים מתוך 40,000 קבעו את הסקאלה</b> — פי ' + F(mx / pctl(srt, 99.9), 1) + ' מאחוזון 99.9. ' : '') + (method === 1 && pct < 99 ? 'חיתוך אגרסיבי: ' + F(100 * clipped, 1) + '% מהערכים האמיתיים נחתכים — גם הם שגיאה. ' : '') + (method === 2 ? 'החיפוש מצא את נקודת האיזון בין עיגול (סקאלה גדולה) לחיתוך (סקאלה קטנה). ' : '') + (night ? 'בלילה ההפעלות קטנות יותר: הטווח שכויל ביום רחב מדי בשבילן, ורוב המדרגות לא בשימוש — השגיאה היחסית גדלה. סט כיול צריך לייצג את השטח (תרגיל 6.1). ' : '') + 'בקורס, על הרשת של מודול 2 עם פיקסלים שרופים והפעלות בארבעה ביטים: 96.3% במינימום־מקסימום, 97.2% באחוזון 99.9 — ובשמונה ביטים 97.6% בכל השיטות. הרשת קלה; במזהה ההבדלים גדולים יותר.'; }
  draw();
};

/* 6.2 — quantization-aware training with the straight-through estimator, really trained here */
W.w6_ste = function (box) {
  V.say(box, 'רשת קטנה (2 ← 16 ← 16 ← 2) מאומנת <b>כאן</b> על 300 נקודות של שתי ספירלות שלובות. שלב 1: אימון רגיל. שלב 2: כימום של כל המשקלות ל־2 ביטים (שלושה ערכים לכל עמודה: <span class="ltr">−s, 0, s</span>) — אחרי אימון. שלב 3: 15 סבבים של אימון מודע כימום — מעבר קדימה עם משקלות מכוממים, ועדכון של המשקלות המקוריים (אומדן המעבר הישר). המפה: איך הרשת מסווגת כל נקודה במישור.');
  const r = rng(5); const N = 300; const D = [...Array(N)].map((_, i) => { const c = i % 2, t = r(); const ang = t * 1.0 * 2 * Math.PI + c * Math.PI, rad = 0.15 + 1.1 * t; return [0.3 + rad * Math.cos(ang) + randn(r) * 0.04, 0.2 + rad * Math.sin(ang) + randn(r) * 0.04, c]; });
  const sizes = [2, 16, 16, 2]; let P, stage = 0, steOn = true, bits = 2, log = []; let trace = [];
  const init = () => { const rr = rng(9); P = sizes.slice(0, -1).map((a, i) => ({ W: [...Array(a)].map(() => [...Array(sizes[i + 1])].map(() => randn(rr) * Math.sqrt(2 / a))), b: new Array(sizes[i + 1]).fill(0) })); };
  const fq = Wm => { const qmax = 2 ** (bits - 1) - 1; const cols = Wm[0].length; const s = [...Array(cols)].map((_, j) => Math.max(1e-9, ...Wm.map(rw => Math.abs(rw[j]))) / qmax); return Wm.map(rw => rw.map((v, j) => Math.max(-qmax, Math.min(qmax, Math.round(v / s[j]))) * s[j])); };
  const fwd = (Ps, x, q) => { const acts = [x]; let h = x; Ps.forEach((L, i) => { const Wm = q ? fq(L.W) : L.W; const o = L.b.map((bb, j) => bb + h.reduce((a, v, k) => a + v * Wm[k][j], 0)); h = i < Ps.length - 1 ? o.map(v => Math.max(0, v)) : o; acts.push(h); }); return acts; };
  const acc = q => D.filter(([x, y, c]) => { const o = fwd(P, [x, y], q).pop(); return (o[1] > o[0] ? 1 : 0) === c; }).length / N;
  const epoch = (q, lr) => { for (let s = 0; s < N; s += 20) { const Gs = P.map(L => ({ W: L.W.map(rw => rw.map(() => 0)), b: L.b.map(() => 0) })); const Wq = P.map(L => q ? fq(L.W) : L.W);
      for (let t = s; t < Math.min(N, s + 20); t++) { const [x, y, c] = D[t]; const acts = fwd(P, [x, y], q); const o = acts[acts.length - 1]; const m = Math.max(...o); const e = o.map(v => Math.exp(v - m)); const z = e[0] + e[1]; let g = e.map((v, j) => v / z - (j === c ? 1 : 0));
        for (let i = P.length - 1; i >= 0; i--) { const a = acts[i]; for (let k = 0; k < a.length; k++) for (let j = 0; j < g.length; j++) Gs[i].W[k][j] += a[k] * g[j]; g.forEach((v, j) => Gs[i].b[j] += v); if (i) { const Wm = q ? Wq[i] : P[i].W; g = a.map((av, k) => av > 0 ? g.reduce((sm, gj, j) => sm + gj * Wm[k][j], 0) : 0); } } }
      P.forEach((L, i) => { const kw = (q && !steOn) ? 0 : lr / 20, kb = lr / 20; L.W = L.W.map((rw, a) => rw.map((v, j) => v - kw * Gs[i].W[a][j])); L.b = L.b.map((v, j) => v - kb * Gs[i].b[j]); }); } };
  const r1 = row(box); V.btns(r1, [['1. אמן (200 סבבים)', () => { init(); trace = []; for (let e = 0; e < 200; e++) epoch(false, 0.1); stage = 1; log = [['אחרי אימון רגיל', acc(false)]]; draw(); }, 'primary'], ['2. כמם אחרי אימון', () => { if (stage < 1) return; stage = 2; log.push(['כימום אחרי אימון, ' + bits + ' ביטים', acc(true)]); draw(); }], ['3. אימון מודע כימום (15)', () => { if (stage < 2) return; for (let e = 0; e < 15; e++) { epoch(true, 0.03); trace.push([P[1].W.map(rw => rw.slice()), fq(P[1].W)]); } stage = 3; log.push(['אחרי ' + trace.length + ' סבבים מודעי כימום' + (steOn ? '' : ' — בלי האומדן'), acc(true)]); draw(); }]]);
  V.slider(r1, 'ביטים', 2, 4, 1, bits, v => { bits = v; draw(); }); const c = el('label', { html: ' <input type="checkbox" checked> אומדן המעבר הישר' }); c.querySelector('input').onchange = e => { steOn = e.target.checked; }; r1.appendChild(c);
  const cv = canvas(box, 760, 250, 760); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 250); const S = 220, X0 = 10; const mx = (u) => X0 + (u + 1.4) / 3.8 * S, my = v => 15 + (1.5 - v) / 2.6 * S;
    if (P && stage) { const q = stage >= 2; for (let i = 0; i < 44; i++) for (let j = 0; j < 44; j++) { const u = -1.4 + 3.8 * (i + .5) / 44, v = 1.5 - 2.6 * (j + .5) / 44; const o = fwd(P, [u, v], q).pop(); x.fillStyle = o[1] > o[0] ? '#ffe8cc' : '#d0ebff'; x.fillRect(X0 + i * S / 44, 15 + j * S / 44, S / 44 + 1, S / 44 + 1); } }
    D.forEach(([u, v, c]) => { x.fillStyle = c ? '#e8590c' : '#1c7ed6'; x.fillRect(mx(u) - 1.5, my(v) - 1.5, 3, 3); }); x.strokeStyle = '#adb5bd'; x.strokeRect(X0, 15, S, S); txt(x, stage >= 2 ? 'הרשת עם משקלות מכוממים' : 'הרשת בדיוק מלא', X0 + S / 2, 12, '#495057', 10, 'center');
    const gx = 270; txt(x, 'המשקל ששינה מדרגה הכי הרבה פעמים (שכבה 2): המקורי (כחול) והמכומם (כתום)', 750, 20, '#495057', 11, 'right');
    if (trace.length) { let bk = 0, bj = 0, bc = -1; for (let k = 0; k < 16; k++) for (let j = 0; j < 16; j++) { let ch = 0; for (let t = 1; t < trace.length; t++) if (trace[t][1][k][j] !== trace[t - 1][1][k][j]) ch++; const sc = ch * 10 + Math.abs(trace[trace.length - 1][0][k][j] - trace[0][0][k][j]); if (sc > bc) { bc = sc; bk = k; bj = j; } } const tr = trace.map(t => [t[0][bk][bj], t[1][bk][bj]]); const all = tr.flat(); const lo = Math.min(...all), hi = Math.max(...all) + 1e-6; const Y = v => 230 - (v - lo) / (hi - lo) * 180; [[0, '#1c7ed6'], [1, '#e8590c']].forEach(([k, col]) => { x.strokeStyle = col; x.lineWidth = 2; x.beginPath(); tr.forEach((t, i) => { const X = gx + 20 + i / Math.max(1, tr.length - 1) * 440; i ? x.lineTo(X, Y(t[k])) : x.moveTo(X, Y(t[k])); }); x.stroke(); x.lineWidth = 1; }); txt(x, 'סבב', 740, 245, '#868e96', 10, 'right'); } else txt(x, '(יופיע אחרי שלב 3)', 500, 130, '#adb5bd', 11, 'center');
    tb.innerHTML = log.length ? table(['שלב', 'דיוק על 300 הנקודות'], log.map(([n, a]) => [n, F(100 * a, 1) + '%'])) : '';
    out.innerHTML = stage === 0 ? 'התחל בשלב 1.' : stage === 1 ? 'רשת מאומנת. עכשיו כמם אותה — בלי לאמן.' : stage === 2 ? 'כימום אחרי אימון ל־' + bits + ' ביטים — המשקלות קפצו למדרגה הקרובה, והגבול זז. עכשיו נסה לתקן עם אימון.' : (steOn ? 'האימון המודע מעדכן את המשקל המקורי (כחול) בצעדים קטנים, והמכומם (כתום) קופץ למדרגה אחרת רק כשהמקורי חוצה סף (בין הקפיצות הוא זז מעט, כי הסקאלה של העמודה נקבעת לפי הערך הגדול בה — וגם הוא לומד). הרשת לומדת משקלות שעובדים <i>אחרי</i> העיגול. בקורס, על הרשת של מודול 2 ב־2 ביטים: ‏54.3% ← ‏95.9%.' : '<b>בלי האומדן</b> הנגזרת של העיגול היא אפס — אף משקל לא זז (הקו הכחול שטוח, תרגיל 6.2). מה שעוד לומד הן ההטיות, שלא מכוממות — ובבעיה הקטנה הזו הן לבדן מחזירות את רוב הדיוק (תיקון הטיות הוא שיטה מוכרת בפני עצמה). ברשת אמיתית יש מיליוני משקלות ומעט הטיות, ובדרך כלל זה לא מספיק — לכן האומדן. השווה את השורה האחרונה בטבלה, עם האומדן ובלעדיו.'); }
  draw();
};

/* 6.3 — is INT8 actually faster: fixed costs vs compute */
W.w6_int8_speed = function (box) {
  V.say(box, 'מודל שמכויל למדידה של הקורס (השלד בשלושה רוחבים, שני תהליכונים): זמן בשמונה ביטים = מחיר קבוע (כימום והחזרה בקצוות, שתי טרנספוזיציות, וקונבולוציה אחת שנשארה בעשרוני) + החישוב חלקי ההאצה של החומרה. הנקודות — המדידות של הקורס. בחר חומרה ורוחב, וחפש את נקודת האיזון.');
  const HW = [['מעבד עם הוראות שמונה ביטים (כמו בקורס)', 2.35, 2.3], ['מעבד ישן, בלי הוראות כאלה', 1.05, 2.3], ['כרטיס מסך, ליבות טנזור (מול חצי דיוק)', 1.9, 0.25]]; let hi = 0, w = 2;
  V.tabs(box, HW.map(h => h[0]), k => { hi = k; draw(); }); const r1 = row(box); V.slider(r1, 'רוחב (כפולה של 16..256 ערוצים)', 0.5, 8, 0.1, w, v => { w = v; draw(); }, v => '×' + F(v, 1));
  const cv = canvas(box, 760, 200, 760); const out = V.say(box);
  const fp = m => 4.2 * Math.pow(m, 1.62); const int8 = (m, h) => h[2] + 0.45 + fp(m) / h[1];
  const PTS = [[1, 4.2, 4.9], [2, 15.1, 11.0], [4, 52.3, 28.7]];
  function draw() { const h = HW[hi]; const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 200); const ms = [...Array(76)].map((_, i) => 0.5 + i * 0.1); const ymax = fp(8) * 1.02; const X = m => 50 + (Math.log2(m) + 1) / 4 * 690, Y = v => 175 - Math.log10(Math.max(v, 0.5)) / Math.log10(ymax) * 160;
    [[fp, '#1c7ed6', 'עשרוני'], [m => int8(m, h), '#ae3ec9', 'שמונה ביטים']].forEach(([f, col, n], k) => { x.strokeStyle = col; x.lineWidth = 2; x.beginPath(); ms.forEach((m, i) => i ? x.lineTo(X(m), Y(f(m))) : x.moveTo(X(m), Y(f(m)))); x.stroke(); x.lineWidth = 1; txt(x, n, 60, 20 + k * 16, col, 11, 'left', true); });
    if (hi === 0) PTS.forEach(([m, a, b]) => { [[a, '#1c7ed6'], [b, '#ae3ec9']].forEach(([v, col]) => { x.fillStyle = col; x.beginPath(); x.arc(X(m), Y(v), 4, 0, 7); x.fill(); }); });
    x.strokeStyle = '#495057'; x.setLineDash([4, 3]); x.beginPath(); x.moveTo(X(w), 10); x.lineTo(X(w), 175); x.stroke(); x.setLineDash([]); [0.5, 1, 2, 4, 8].forEach(m => txt(x, '×' + m, X(m), 192, '#868e96', 10, 'center')); txt(x, 'מ"ש (סולם לוגריתמי)', 740, 20, '#868e96', 10, 'right');
    let be = null; for (let m = 0.5; m <= 8; m += 0.01) if (int8(m, h) < fp(m)) { be = m; break; } const a = fp(w), b = int8(w, h);
    out.innerHTML = 'ברוחב ×' + F(w, 1) + ': עשרוני ' + F(a, 1) + ' מ"ש, שמונה ביטים ' + F(b, 1) + ' — ' + (b < a ? '<b>פי ' + F(a / b, 2) + ' מהר יותר</b>' : '<b>איטי יותר</b>') + '. ' + (be ? 'נקודת האיזון: רוחב ×' + F(be, 1) + ' — מתחתיה המחיר הקבוע שולט. ' : '<b>על החומרה הזו שמונה ביטים לא משתלמים בשום רוחב</b> — אין הוראות שמבצעות אותם מהר. ') + (hi === 0 ? 'בקורס: ‏4.2 ← 4.9 (איטי), ‏15.1 ← 11.0, ‏52.3 ← 28.7. ' : '') + 'כימום הוא השערה — מודדים על החומרה של היעד, בגודל של המודל האמיתי.'; }
  draw();
};
})();

/* ===================================================================== chapter 7 */
(function () {
const W = window.W, V = window.V, el = V.el, D4 = window.D4; const { F, canvas, table, row, txt, rng, randn } = D4; const pct = window.SIM6.pct;
/* time-stepped pipeline: camera -> q0 -> stage0 -> q1 -> stage1 -> q2 -> stage2 -> done.  policy: 'fifo' (unbounded), 'latest' (size 1, drop the old), 'block' (size k, the producer waits — files only) */
function runPipe(o) { const dt = 0.25, Tend = (o.seconds || 60) * 1000; const S = o.loop ? [o.T.reduce((a, b) => a + b, 0)] : o.T.slice(); const n = S.length; const r = rng(o.seed || 3);
  const q = [...Array(n)].map(() => []); const busy = new Array(n).fill(null); let k = 0, nextArr = 0, dropped = 0; const done = []; const occ = []; const maxQ = o.policy === 'latest' ? 1 : o.policy === 'block' ? (o.k || 2) : 1e9; let waiting = null;
  for (let t = 0; t <= Tend + 20000; t += dt) { if ((o.file ? k >= o.nFrames : t > Tend) && !busy.some(Boolean) && !q.some(x => x.length) && !waiting) break;
    if (o.file) { if (!waiting && k < o.nFrames) waiting = { k: k++, arr: t }; } else if (t >= nextArr && t <= Tend) { waiting = { k: k++, arr: t }; nextArr += 1000 / o.fps; }
    if (waiting) { if (q[0].length < (o.file ? 1 : maxQ)) { q[0].push(waiting); waiting = null; } else if (!o.file && o.policy !== 'block') { q[0].shift(); dropped++; q[0].push(waiting); waiting = null; } }
    let gilFree = true;
    for (let i = n - 1; i >= 0; i--) { const b = busy[i]; if (b) { if (o.gil) { if (!gilFree) continue; gilFree = false; } b.rem -= dt; if (b.rem <= 0) { if (i === n - 1) { b.it.done = t; done.push(b.it); busy[i] = null; } else if (q[i + 1].length < maxQ) { q[i + 1].push(b.it); busy[i] = null; } else if (o.policy === 'latest') { q[i + 1].shift(); dropped++; q[i + 1].push(b.it); busy[i] = null; } else b.rem = 0; } } }
    for (let i = 0; i < n; i++) if (!busy[i] && q[i].length) { busy[i] = { it: q[i].shift(), rem: Math.max(0.3, S[i] * (1 + (o.jit || 0) * randn(r))) }; }
    if (Math.round(t / dt) % 40 === 0) occ.push([t, q[0].length + (q[1] ? q[1].length : 0)]); }
  const lat = done.map(d => d.done - d.arr); const span = done.length > 1 ? (done[done.length - 1].done - done[0].done) / 1000 : 1;
  return { done, lat, dropped: o.file ? 0 : dropped + Math.max(0, k - done.length - dropped - (o.file ? 0 : 0)), fps: (done.length - 1) / span, occ, n: k }; }
window.SIM6.runPipe = runPipe;

/* 7.1 — what breaks in a simple loop */
W.w6_loop_vs_threads = function (box) {
  V.say(box, 'הניסוי של הקורס, כסימולציה: מצלמה של 30 פריימים בשנייה במשך שש שניות, ושלושה שלבים (קליטה ועיבוד מקדים, מודל, ציור). שלושה מבנים זה לצד זה. הגרף: ההשהייה של כל פריים שעובד, לפי הרגע שבו צולם — קו שעולה הוא מערכת שרואה את העבר. ומתג של <b>הנעילה הגלובלית של פייתון</b>: כשהעבודה היא לולאות פייתון (ולא קוד מהודר), רק שלב אחד רץ בכל רגע.');
  const T = [5, 40, 5]; const nm = ['קליטה', 'מודל', 'ציור']; let fps = 30, jit = 0.05, gil = false; const r1 = row(box); T.forEach((v, i) => V.slider(r1, nm[i], 1, 80, 1, v, x => { T[i] = x; draw(); }, x => x + ' מ"ש')); const r2 = row(box); V.slider(r2, 'מצלמה (בשנייה)', 10, 60, 1, fps, v => { fps = v; draw(); }); V.slider(r2, 'תנודתיות', 0, 0.3, 0.01, jit, v => { jit = v; draw(); }, v => F(100 * v, 0) + '%'); const c = el('label', { html: ' <input type="checkbox"> העבודה מחזיקה את הנעילה (לולאות פייתון)' }); c.querySelector('input').onchange = e => { gil = e.target.checked; draw(); }; r2.appendChild(c);
  V.btns(box, [['הניסוי של הקורס: 5, 40, 5', () => { T.splice(0, 3, 5, 40, 5); fps = 30; draw(); }], ['הסקה של 20 מ"ש', () => { T[1] = 20; draw(); }]]);
  const cv = canvas(box, 760, 200, 760); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  const MODES = [['לולאה אחת', { loop: true, policy: 'fifo' }, '#868e96'], ['תהליכונים, תורים בלי גבול', { policy: 'fifo' }, '#e8590c'], ['תהליכונים, תור של החדש בלבד', { policy: 'latest' }, '#2f9e44']];
  function draw() { const res = MODES.map(([n, o]) => runPipe(Object.assign({ T, fps, seconds: 6, jit, gil }, o))); const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 200); const ym = Math.max(100, ...res.map(r => Math.max(...r.lat))); const Y = v => 180 - v / ym * 165, X = t => 50 + t / 6000 * 690;
    res.forEach((r, k) => { x.strokeStyle = MODES[k][2]; x.lineWidth = 2; x.beginPath(); r.done.forEach((d, i) => i ? x.lineTo(X(d.arr), Y(d.done - d.arr)) : x.moveTo(X(d.arr), Y(d.done - d.arr))); x.stroke(); x.lineWidth = 1; txt(x, MODES[k][0], 745, 20 + k * 15, MODES[k][2], 11, 'right', true); });
    [0, ym / 2, ym].forEach(v => txt(x, F(v, 0) + ' מ"ש', 46, Y(v) + 4, '#868e96', 10, 'right')); [0, 2, 4, 6].forEach(s => txt(x, s + ' ש׳', X(s * 1000), 196, '#868e96', 10, 'center'));
    tb.innerHTML = table(['מבנה', 'תפוקה', 'השהייה חציונית', 'מקסימלית', 'נזרקו', 'בקורס (תפוקה / חציון / מקס׳ / נזרקו)'], res.map((r, k) => [MODES[k][0], F(r.fps, 1), F(pct(r.lat, 50), 0), F(Math.max(...r.lat), 0), r.n - r.done.length, ['19.8 / 1,578 / 3,103 / 0', '24.7 / 662 / 1,275 / 0', '24.6 / 67 / 84 / 32'][k]]));
    const sum = T.reduce((a, b) => a + b, 0), mx = Math.max(...T), per = 1000 / fps; out.innerHTML = 'פריים כל ' + F(per, 1) + ' מ"ש. לולאה אחת מעבדת פריים כל ' + sum + ' מ"ש' + (sum > per ? ' — <b>איטית מהמצלמה</b>: המאגר של המצלמה גדל, וכל פריים שנקרא ישן מקודמו.' : ' — עומדת בקצב.') + ' בתהליכונים, השלב האיטי (' + mx + ' מ"ש) קובע' + (mx > per ? ': עם תורים בלי גבול העומס רק עובר לתור שלפני המודל; עם תור של החדש — פריימים נזרקים, וההשהייה חסומה.' : ' — ושלושת המבנים עומדים בקצב.') + (gil ? ' <b>עם הנעילה</b> השלבים לא רצים במקביל — התהליכונים לא מוסיפים תפוקה. לולאות פייתון כבדות — לתהליכים נפרדים.' : ' (סביבת הריצה, הפענוח של OpenCV ו־NumPy משחררים את הנעילה — לכן התהליכונים עובדים.)'); }
  draw();
};

/* 7.2 — the latest-only queue, and what it does to the tracker */
W.w6_queue_sim = function (box) {
  V.say(box, 'מצלמה של 30 בשנייה, מודל של 40 מ"ש, ותור של החדש בלבד. למעלה: אילו פריימים עובדו (ירוק) ואילו נזרקו (אדום) — והפער בזמן בין שני פריימים מעובדים. למטה: עוקב עם מסנן מהירות קבועה (מודול 5) שעוקב אחרי עצם שזז במהירות קבועה. אם הוא מניח שבין פריים לפריים עוברים תמיד 33 מ"ש — מה קורה לניבוי?');
  let model = 40, useReal = false; const r1 = row(box); V.slider(r1, 'מודל (מ"ש)', 10, 80, 1, model, v => { model = v; draw(); }); const c = el('label', { html: ' <input type="checkbox"> העוקב מקבל את הזמן האמיתי בין הפריימים' }); c.querySelector('input').onchange = e => { useReal = e.target.checked; draw(); }; r1.appendChild(c);
  const cv = canvas(box, 760, 250, 760); const out = V.say(box);
  function draw() { const R = runPipe({ T: [1, model, 1], fps: 30, seconds: 2, policy: 'latest', jit: 0.08, seed: 7 }); const got = new Set(R.done.map(d => d.k)); const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 250);
    for (let i = 0; i < 60; i++) { x.fillStyle = got.has(i) ? '#2f9e44' : '#ffa8a8'; x.fillRect(20 + i * 12, 20, 10, 18); } txt(x, 'פריימים 1–60 (שתי שניות): ירוק — עובד, אדום — נזרק', 740, 14, '#495057', 10, 'right');
    const ks = R.done.map(d => d.k).sort((a, b) => a - b); const gaps = ks.slice(1).map((k, i) => (k - ks[i]) * 33.3); const hist = {}; gaps.forEach(g => { const k = Math.round(g); hist[k] = (hist[k] || 0) + 1; });
    Object.keys(hist).forEach((g, i) => txt(x, 'פער ' + g + ' מ"ש: ' + hist[g] + ' פעמים', 740 - i * 150, 58, '#495057', 11, 'right', true));
    const v = 0.3; let pos = 0, vel = v, err = []; const truth = k => v * k * 33.3; let lastK = ks[0]; pos = truth(lastK);
    ks.slice(1).forEach(k => { const dtA = useReal ? (k - lastK) * 33.3 : 33.3; const pred = pos + vel * dtA; err.push([k, pred - truth(k)]); pos = truth(k); vel = v; lastK = k; });
    const em = Math.max(5, ...err.map(e => Math.abs(e[1]))); const Y = e => 165 - e / em * 70; x.strokeStyle = '#adb5bd'; x.beginPath(); x.moveTo(20, 165); x.lineTo(740, 165); x.stroke(); err.forEach(([k, e]) => { x.fillStyle = Math.abs(e) > 1 ? '#e03131' : '#1c7ed6'; x.fillRect(20 + k * 12, Math.min(Y(e), 165), 10, Math.abs(Y(e) - 165) || 2); }); txt(x, 'שגיאת הניבוי של העוקב בכל פריים מעובד (פיקסלים; העצם זז ' + F(v * 33.3, 0) + ' פיקסלים לפריים)', 740, 245, '#495057', 10, 'right');
    const bad = err.filter(e => Math.abs(e[1]) > 1).length; out.innerHTML = 'עובדו ' + R.done.length + ' מתוך 60, נזרקו ' + (60 - R.done.length) + '. ' + (useReal ? 'עם הזמן האמיתי — הניבוי מדויק בכל פריים, גם אחרי פריים שנזרק.' : '<b>' + bad + ' ניבויים שגויים</b> — בכל פעם שנזרק פריים, העוקב מניח 33 מ"ש כשעברו 67, ומנבא חצי מהתזוזה. בשער של שיוך (מודול 5) זו בדיוק החמצה, ואז מספר חדש לאותו עצם.') + ' לכן כל פריים נושא את זמן הצילום שלו, והעוקב מקבל <span class="ltr">dt</span> אמיתי.'; }
  draw();
};

/* 7.3 — a file is not a camera; and the cores are shared */
W.w6_file_vs_cam = function (box) {
  V.say(box, 'שתי שאלות. <b>(1) קובץ:</b> מפענח בתהליכון ומודל בתהליכון, על 300 פריימים מקובץ — עם תור שזורק את הישן (נכון למצלמה) או תור קטן שמחכה כשהוא מלא. <b>(2) גרעינים:</b> מודל של הקורס, מפוצל לפענוח ולמודל — על כמה גרעינים, ועם כמה תהליכונים למודל. הנקודות של (2) מכוילות למדידה של הקורס.');
  let k = 2, pol = 1, cores = 2, thr = 1, gpu = false; V.tabs(box, ['תור של החדש (כמו במצלמה)', 'תור קטן שמחכה'], i => { pol = i; draw(); }, 1); const r1 = row(box); V.slider(r1, 'גודל התור', 1, 8, 1, k, v => { k = v; draw(); }); const r2 = row(box); V.slider(r2, 'גרעינים', 1, 8, 1, cores, v => { cores = v; draw(); }); V.slider(r2, 'תהליכוני מודל', 1, 8, 1, thr, v => { thr = v; draw(); }); const c = el('label', { html: ' <input type="checkbox"> המודל על כרטיס מסך' }); c.querySelector('input').onchange = e => { gpu = e.target.checked; draw(); }; r2.appendChild(c);
  const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const R = runPipe({ T: [14, 20, 1], file: true, nFrames: 300, policy: pol ? 'block' : 'latest', k, jit: 0.6, seed: 4 }); const lost = 300 - R.done.length;
    const d = 4.4, m1 = 25.3; const m = gpu ? 6 : m1 * Math.pow(Math.min(thr, cores), -0.62); const over = !gpu && thr + 1 > cores; const loopP = d + m + (over ? 0 : 0); const parP = Math.max(d * (gpu ? 1 : 1), m + (over ? 0.75 * d * (thr + 1 - cores) : 0));
    tb.innerHTML = table(['', 'תוצאה'], [['(1) פריימים שעובדו מתוך 300', R.done.length + (lost ? ' — <b style="color:#e03131">' + lost + ' אבדו</b>' : '')], ['(1) קצב', F(R.fps, 1) + ' בשנייה'], ['(2) לולאה אחת', F(1000 / loopP, 1) + ' בשנייה'], ['(2) פענוח בתהליכון נפרד', F(1000 / parP, 1) + ' בשנייה'], ['(2) בקורס, שני גרעינים', 'תהליכון אחד: 33.7 ← 39.6; שניים: 48.3 ← 51.0']]);
    out.innerHTML = (pol ? 'על קובץ התור מחכה כשהוא מלא — המפענח רץ מעט קדימה, ושום פריים לא נופל. ' + (k === 1 ? 'תור של אחד עובד, אבל כל תנודה בזמן הפענוח עוצרת את המודל; שניים עד ארבעה מחליקים את התנודות. ' : '') : '<b>על קובץ, תור שזורק מאבד פריימים בלי שום סיבה</b> — הקובץ היה מחכה. ') + (gpu ? 'כשהמודל על הכרטיס, המעבד פנוי לפענוח — והפיצול מרוויח הכי הרבה. זה המצב על לוח קצה.' : over ? 'יש יותר תהליכונים עסוקים מגרעינים: הפענוח מתחרה במודל על אותם גרעינים, והשיפור קטן (פרק 3.2).' : 'יש גרעין פנוי לפענוח — הפיצול מרוויח.'); }
  draw();
};
})();

/* ===================================================================== chapter 8 */
(function () {
const W = window.W, V = window.V, el = V.el, D4 = window.D4; const { F, canvas, table, row, txt } = D4;

/* 8.1 — Amdahl, on the course's measured stages */
W.w6_amdahl = function (box) {
  V.say(box, 'הטבלה של הסעיף (חציונים, הורץ בקורס): פענוח, עיבוד מקדים, הסקה ועיבוד מאוחר. בחר שלב והאץ אותו — העקומה מראה את ההאצה של הצינור כולו לפי פי כמה האצת את השלב, והקו המקווקו את התקרה (השלב לוקח אפס). למטה: בתוך המודל — כמה כפלות בכל קונבולוציה (מחושב מהשלד), מול החלק מהזמן שנמדד.');
  const T = [2.99, 2.75, 14.35, 0.05]; const nm = ['פענוח', 'עיבוד מקדים', 'הסקה', 'עיבוד מאוחר']; let st = 2, f = 2;
  V.tabs(box, nm, k => { st = k; draw(); }, 2); const r1 = row(box); V.slider(r1, 'פי כמה מאיצים את השלב', 1, 20, 0.5, f, v => { f = v; draw(); }); const r2 = row(box); T.forEach((v, i) => V.slider(r2, nm[i], 0.05, 30, 0.05, v, x => { T[i] = x; draw(); }, x => F(x, 2)));
  const cv = canvas(box, 760, 200, 760); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const tot = T.reduce((a, b) => a + b, 0); const sp = g => tot / (tot - T[st] + T[st] / g); const ceil = tot / (tot - T[st]); const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 200);
    const ym = Math.min(Math.max(ceil * 1.1, 2), 25); const X = g => 50 + Math.log(g) / Math.log(20) * 360, Y = v => 170 - (v - 1) / (ym - 1) * 150;
    x.strokeStyle = '#1c7ed6'; x.lineWidth = 2; x.beginPath(); for (let g = 1; g <= 20; g += 0.1) g === 1 ? x.moveTo(X(g), Y(sp(g))) : x.lineTo(X(g), Y(sp(g))); x.stroke(); x.lineWidth = 1;
    if (isFinite(ceil) && ceil < ym) { x.strokeStyle = '#e03131'; x.setLineDash([5, 4]); x.beginPath(); x.moveTo(50, Y(ceil)); x.lineTo(410, Y(ceil)); x.stroke(); x.setLineDash([]); txt(x, 'תקרה: פי ' + F(ceil, 2), 405, Y(ceil) - 5, '#e03131', 10, 'right'); }
    x.fillStyle = '#1c7ed6'; x.beginPath(); x.arc(X(f), Y(sp(f)), 5, 0, 7); x.fill(); [1, 2, 5, 10, 20].forEach(g => txt(x, '×' + g, X(g), 188, '#868e96', 10, 'center')); txt(x, 'האצת הצינור', 46, 20, '#495057', 10, 'right');
    const cols = ['#e8590c', '#ae3ec9', '#2f9e44', '#1c7ed6']; [[T, 'לפני', 40], [T.map((v, i) => i === st ? v / f : v), 'אחרי', 110]].forEach(([arr, n, Yb]) => { let X0 = 480; arr.forEach((v, i) => { const w = v / tot * 260; x.fillStyle = cols[i]; x.fillRect(X0, Yb, Math.max(0.5, w - 1), 34); if (w > 30) txt(x, F(v, 1), X0 + w / 2, Yb + 22, '#fff', 10, 'center', true); X0 += w; }); txt(x, n + ': ' + F(arr.reduce((a, b) => a + b, 0), 1) + ' מ"ש', 745, Yb - 4, '#212529', 11, 'right', true); });
    const LAYm = [[3, 32, 320], [32, 64, 160], [64, 128, 80], [128, 256, 40], [256, 512, 20]].map(([ci, co, hw]) => hw * hw * co * ci * 9 / 1e6); const sm = LAYm.reduce((a, b) => a + b, 0);
    tb.innerHTML = table(['קונבולוציה', '1', '2', '3', '4', '5'], [['מיליוני כפלות (מחושב)', ...LAYm.map(v => F(v, 0))], ['חלק מהכפלות', ...LAYm.map(v => F(100 * v / sm, 0) + '%')], ['חלק מהזמן (בקורס)', 'כ־10%', '21%–23%', '21%–23%', '21%–23%', '21%–23%']]);
    out.innerHTML = 'האצת ' + nm[st] + ' פי ' + F(f, 1) + ': הצינור כולו פי <b>' + F(sp(f), 2) + '</b> (' + F(1000 / tot, 1) + ' ← ' + F(1000 / (tot - T[st] + T[st] / f), 1) + ' פריימים בשנייה). ' + (isFinite(ceil) ? 'גם אם ' + nm[st] + ' ייקח אפס — לא יותר מפי ' + F(ceil, 2) + '. ' : '') + 'זה חוק אמדהל: החלק שלא האצת קובע את התקרה. ובתוך המודל: ארבע הקונבולוציות האחרונות עושות אותו מספר כפלות — ולוקחות אותו זמן; הראשונה עושה פי 5.3 פחות, ולוקחת רק כחצי — שלושה ערוצי קלט לא ממלאים את ההוראות הווקטוריות (תרגיל 8.3).'; }
  draw();
};

/* 8.2 — measurement traps: an asynchronous GPU */
W.w6_async_clock = function (box) {
  V.say(box, 'שני צירי זמן: המעבד והכרטיס, לשלושה פריימים. המעבד מפענח, מעבד מקדים, <b>שולח</b> את המודל לכרטיס (הפקודה חוזרת מיד), ואז עיבוד מאוחר — שצריך את התוצאה, ולכן מחכה. השעונים של הקוד (הסוגריים) מראים מה הם מודדים — עם סנכרון ובלעדיו. ומתג של חפיפה: המעבד מכין את הפריים הבא בזמן שהכרטיס עובד.');
  let dec = 3, pre = 2.8, gpu = 8, post = 1, sync = false, overlap = false; const r1 = row(box); [['פענוח', 'dec', dec], ['עיבוד מקדים', 'pre', pre], ['מודל בכרטיס', 'gpu', gpu], ['עיבוד מאוחר', 'post', post]].forEach(([n, k, v]) => V.slider(r1, n, 0.5, 20, 0.1, v, x => { if (k === 'dec') dec = x; if (k === 'pre') pre = x; if (k === 'gpu') gpu = x; if (k === 'post') post = x; draw(); }, x => F(x, 1)));
  const r2 = row(box); [['סנכרון לפני עצירת שעון ההסקה', 's'], ['חפיפה בין מעבד לכרטיס', 'o']].forEach(([n, k]) => { const c = el('label', { html: '<input type="checkbox"> ' + n + ' &nbsp;' }); c.querySelector('input').onchange = e => { if (k === 's') sync = e.target.checked; else overlap = e.target.checked; draw(); }; r2.appendChild(c); });
  const cv = canvas(box, 760, 170, 760); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const L = 0.15; const ev = []; let tc = 0, gfree = 0, prepared = false; const meas = { infer: [], post: [] };
    for (let k = 0; k < 3; k++) { if (!prepared) { ev.push(['c', tc, tc + dec, '#e8590c']); tc += dec; ev.push(['c', tc, tc + pre, '#ae3ec9']); tc += pre; }
      const launch = tc; ev.push(['c', tc, tc + L, '#495057']); tc += L; const gs = Math.max(tc, gfree), ge = gs + gpu; ev.push(['g', gs, ge, '#2f9e44']); gfree = ge;
      prepared = overlap && k < 2; if (prepared) { ev.push(['c', tc, tc + dec, '#e8590c']); tc += dec; ev.push(['c', tc, tc + pre, '#ae3ec9']); tc += pre; }
      if (sync) { if (ge > tc) ev.push(['w', tc, ge]); tc = Math.max(tc, ge); meas.infer.push(tc - launch - (prepared ? dec + pre : 0)); } else meas.infer.push(L);
      const pS = tc; if (ge > tc) { ev.push(['w', tc, ge]); tc = ge; } ev.push(['c', tc, tc + post, '#1c7ed6']); tc += post; meas.post.push(tc - pS); }
    const end = Math.max(tc, gfree); const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 170); const X = t => 70 + t / end * 680; txt(x, 'מעבד', 64, 46, '#495057', 11, 'right', true); txt(x, 'כרטיס', 64, 106, '#495057', 11, 'right', true);
    ev.forEach(([lane, a, b, col]) => { if (lane === 'w') { x.fillStyle = '#fff5f5'; x.fillRect(X(a), 30, X(b) - X(a), 26); x.strokeStyle = '#ffa8a8'; x.strokeRect(X(a), 30, X(b) - X(a), 26); if (X(b) - X(a) > 30) txt(x, 'מחכה', (X(a) + X(b)) / 2, 47, '#e03131', 10, 'center'); return; } x.fillStyle = col; x.fillRect(X(a), lane === 'c' ? 30 : 90, Math.max(1, X(b) - X(a) - 0.5), 26); });
    const busy = ev.filter(e => e[0] === 'g').reduce((a, e) => a + e[2] - e[1], 0); txt(x, 'כתום — פענוח · סגול — עיבוד מקדים · אפור — שליחה · ירוק — המודל · כחול — עיבוד מאוחר', 750, 150, '#495057', 10, 'right');
    const avg = a => a.reduce((s, v) => s + v, 0) / a.length; tb.innerHTML = table(['', 'מה השעון של "הסקה" מראה', 'מה השעון של "עיבוד מאוחר" מראה', 'ניצולת הכרטיס'], [['מדידה', F(avg(meas.infer), 2) + ' מ"ש', F(avg(meas.post), 2) + ' מ"ש', F(100 * busy / end, 0) + '%'], ['באמת', F(gpu, 2) + ' מ"ש', F(post, 2) + ' מ"ש', '']]);
    out.innerHTML = (sync ? 'עם סנכרון, השעון של ההסקה עוצר רק כשהכרטיס סיים — המספרים נכונים. ' : '<b>בלי סנכרון</b>, שעון ההסקה מודד רק את השליחה (' + F(L, 2) + ' מ"ש), וכל זמן המודל "קופץ" לעיבוד המאוחר — שמחכה לתוצאה (תרגיל 8.2). ') + 'הכרטיס עסוק ' + F(100 * busy / end, 0) + '% מהזמן' + (busy / end < 0.6 ? ' — <b>הוא מחכה למעבד</b>: האצת המודל לא תעזור; האץ את הפענוח והעיבוד המקדים, או חפוף.' : '.') + (overlap ? ' עם חפיפה, המעבד מכין את הפריים הבא בזמן שהכרטיס עובד — הכרטיס כמעט לא מחכה.' : '') + ' על כרטיסי אנבידיה, כלי ציר הזמן (Nsight Systems) מראה בדיוק את התמונה הזו; ועל Jetson, <code class="ltr">tegrastats</code> נותן את הניצולת.'; }
  draw();
};
})();

/* ===================================================================== chapter 9 */
(function () {
const W = window.W, V = window.V, el = V.el, D4 = window.D4; const { F, canvas, table, row, txt } = D4;

/* 9.1 — the same result, different prices: measured here, in the browser */
W.w6_preproc_order = function (box) {
  V.say(box, 'מדידה <b>אמיתית</b>, כאן בדפדפן: פריים סינתטי של 1920 על 1080 (שלושה ערוצים, שמונה ביטים), ושלוש גרסאות של אותו עיבוד מקדים — שינוי גודל ל־640 על 360 (הקטנה דו־ליניארית), ריפוד ל־640 על 640, נרמול ל־0..1 בעשרוני, וסידור ערוצים <span class="ltr">CHW</span>. לחץ "מדוד". הטבלה מראה גם כמה בתים כל גרסה מזיזה — מחושב.');
  let k4 = false; const r1 = row(box); V.btns(r1, [['מדוד ←', () => run(), 'primary']]); const c = el('label', { html: ' <input type="checkbox"> פריים של 4K' }); c.querySelector('input').onchange = e => { k4 = e.target.checked; }; r1.appendChild(c);
  const tb = el('div'); box.appendChild(tb); const out = V.say(box); out.innerHTML = 'לחץ "מדוד" (כמה שניות).';
  function resizeU8(src, sw, sh, dw, dh) { const dst = new Uint8Array(dw * dh * 3); const fx = sw / dw, fy = sh / dh; for (let y = 0; y < dh; y++) { const sy = Math.min(sh - 1.001, (y + 0.5) * fy - 0.5), y0 = Math.max(0, sy | 0), wy = Math.max(0, sy - y0); for (let x = 0; x < dw; x++) { const sx = Math.min(sw - 1.001, (x + 0.5) * fx - 0.5), x0 = Math.max(0, sx | 0), wx = Math.max(0, sx - x0); const a = (y0 * sw + x0) * 3, b = a + 3, c2 = a + sw * 3, d = c2 + 3, o = (y * dw + x) * 3; for (let ch = 0; ch < 3; ch++) dst[o + ch] = (src[a + ch] * (1 - wx) + src[b + ch] * wx) * (1 - wy) + (src[c2 + ch] * (1 - wx) + src[d + ch] * wx) * wy + 0.5; } } return dst; }
  function resizeF(src, sw, sh, dw, dh) { const dst = new Float32Array(dw * dh * 3); const fx = sw / dw, fy = sh / dh; for (let y = 0; y < dh; y++) { const sy = Math.min(sh - 1.001, (y + 0.5) * fy - 0.5), y0 = Math.max(0, sy | 0), wy = Math.max(0, sy - y0); for (let x = 0; x < dw; x++) { const sx = Math.min(sw - 1.001, (x + 0.5) * fx - 0.5), x0 = Math.max(0, sx | 0), wx = Math.max(0, sx - x0); const a = (y0 * sw + x0) * 3, b = a + 3, c2 = a + sw * 3, d = c2 + 3, o = (y * dw + x) * 3; for (let ch = 0; ch < 3; ch++) dst[o + ch] = (src[a + ch] * (1 - wx) + src[b + ch] * wx) * (1 - wy) + (src[c2 + ch] * (1 - wx) + src[d + ch] * wx) * wy; } } return dst; }
  function padCHW(small, dw, dh, isF) { const out = new Float32Array(3 * 640 * 640).fill(114 / 255); const top = (640 - dh) >> 1; for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) { const i = (y * dw + x) * 3; for (let ch = 0; ch < 3; ch++) out[(2 - ch) * 409600 + (y + top) * 640 + x] = isF ? small[i + ch] : small[i + ch] / 255; } return out; }
  function run() { out.innerHTML = 'מודד...'; setTimeout(() => { const sw = k4 ? 3840 : 1920, sh = k4 ? 2160 : 1080; const dw = 640, dh = 360; const src = new Uint8Array(sw * sh * 3); for (let i = 0; i < src.length; i++) src[i] = (i * 2654435761 >>> 24) ^ (i >> 9); const N = k4 ? 5 : 9;
      const V1 = () => resizeU8(src, sw, sh, dw, dh); const V2 = () => padCHW(resizeU8(src, sw, sh, dw, dh), dw, dh, false); const V3 = () => { const f = new Float32Array(src.length); for (let i = 0; i < src.length; i++) f[i] = src[i] / 255; return padCHW(resizeF(f, sw, sh, dw, dh), dw, dh, true); };
      const time = fn => { fn(); fn(); const ts = []; for (let i = 0; i < N; i++) { const t0 = performance.now(); fn(); ts.push(performance.now() - t0); } ts.sort((a, b) => a - b); return ts[N >> 1]; };
      const a = time(V1), b = time(V2), c3 = time(V3); const d1 = padCHW(resizeU8(src, sw, sh, dw, dh), dw, dh, false), d2 = V3(); let mx = 0; for (let i = 0; i < d1.length; i++) mx = Math.max(mx, Math.abs(d1[i] - d2[i]));
      const inB = sw * sh * 3 / 1e6; tb.innerHTML = table(['גרסה', 'חציון כאן (מ"ש)', 'בתים שעוברים בהקטנה', 'בקורס (פייתון)'], [['הקטנה בלבד, שמונה ביטים', F(a, 2), F(inB, 1) + ' MB', '0.42'], ['הקטנה, ואז נרמול וסידור', F(b, 2), F(inB, 1) + ' MB', '3.49 (NumPy) / 1.89 (פונקציה אחת)'], ['נרמול לעשרוני קודם, ואז הקטנה', F(c3, 2), F(inB * 4, 1) + ' MB (ועוד ' + F(inB * 4, 1) + ' כתיבה)', '8.37']]);
      out.innerHTML = 'נרמול קודם איטי פי <b>' + F(c3 / b, 1) + '</b> כאן (בקורס פי 2.4): ההקטנה רצה על ' + F(inB * 4, 0) + ' MB של עשרוני במקום ' + F(inB, 1) + ' MB של שמונה ביטים, ועוד כתיבה של מערך עשרוני בגודל התמונה המקורית. ' + (mx === 0 ? 'התוצאות זהות לגמרי (כאן ההקטנה היא בדיוק פי ' + (sw / 640) + ' — כל פיקסל ביעד נדגם מפיקסל אחד, ואין עיגול). ' : 'התוצאות כמעט זהות — הפרש מרבי ' + mx.toExponential(1) + ' (עיגול לשלם בהקטנה של שמונה ביטים). ') + 'ושימו לב: הלולאות כאן בשפת הדפדפן מהודרות לקוד מכונה — בפייתון, לולאה על פיקסלים הייתה איטית פי מאות (בקורס: פי 525).'; }, 30); }
};

/* 9.2 — video decoding: software vs the hardware decoder */
W.w6_decode = function (box) {
  V.say(box, 'כמה מהמעבד הולך על פענוח, לפי רזולוציה, מעבד ומפענח. התקציב: 33 מ"ש לפריים במצלמה של 30. בפענוח בחומרה המעבד כמעט לא מפענח — אבל המרת הצבע האחרונה לסדר של OpenCV (<span class="ltr">videoconvert</span>) עדיין עליו, וזה מעבר מלא על התמונה. מכויל לנקודה אחת שנמדדה בקורס: 1080 על המעבד — כ־3 מ"ש; השאר מודל.');
  const RES = [['720', 0.44], ['1080', 1], ['4K', 4]]; const CPU = [['מחשב נייד', 1], ['Jetson Orin Nano (מעבד)', 3.5], ['מחשב קצה חלש', 6]]; let ri = 1, ci = 0, hw = false, conv = true;
  V.tabs(box, RES.map(r => r[0]), k => { ri = k; draw(); }, 1); V.tabs(box, CPU.map(c => c[0]), k => { ci = k; draw(); }); const r1 = row(box); [['מפענח בחומרה (צינור GStreamer)', 'h', false], ['המרת צבע לסדר של OpenCV על המעבד', 'c', true]].forEach(([n, k, on]) => { const c = el('label', { html: '<input type="checkbox"' + (on ? ' checked' : '') + '> ' + n + ' &nbsp;' }); c.querySelector('input').onchange = e => { if (k === 'h') hw = e.target.checked; else conv = e.target.checked; draw(); }; r1.appendChild(c); });
  const cv = canvas(box, 760, 90, 760); const out = V.say(box);
  function draw() { const px = RES[ri][1], f = CPU[ci][1]; const dec = hw ? 0.15 : 3 * px * f; const cc = hw && conv ? 0.9 * px * f : 0; const tot = dec + cc; const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 90); const S = 700 / Math.max(33.3, tot * 1.05);
    x.fillStyle = '#f1f3f5'; x.fillRect(30, 25, 33.3 * S, 30); x.fillStyle = '#e8590c'; x.fillRect(30, 25, dec * S, 30); x.fillStyle = '#ae3ec9'; x.fillRect(30 + dec * S, 25, cc * S, 30); x.strokeStyle = '#e03131'; x.beginPath(); x.moveTo(30 + 33.3 * S, 15); x.lineTo(30 + 33.3 * S, 65); x.stroke(); txt(x, '33 מ"ש', 30 + 33.3 * S, 80, '#e03131', 10, 'center'); txt(x, 'כתום — פענוח על המעבד · סגול — המרת צבע', 740, 12, '#495057', 10, 'right');
    out.innerHTML = 'מהמעבד לכל פריים: <b>' + F(tot, 1) + ' מ"ש</b> — ' + F(100 * tot / 33.3, 0) + '% מגרעין אחד בקצב של 30. ' + (tot > 33.3 ? '<b>הפענוח לבד לא עומד בקצב</b> — אף מודל לא יציל את זה. ' : '') + (hw ? (conv ? 'המפענח בחומרה חסך את הפענוח, אבל המרת הצבע נשארה — ' + (cc > dec ? 'והיא עכשיו העיקר. מודדים; לפעמים עדיף לקבל את הפורמט של המפענח ולהמיר בכרטיס.' : 'קטנה.') : 'בלי המרה על המעבד — כמעט חינם.') : 'בתוכנה, הפענוח גדל עם מספר הפיקסלים: 4K הוא פי ארבעה מ־1080.') + ' ובצינור: ‏<span class="ltr">appsink drop=true max-buffers=1</span> — תור של החדש בלבד, כמו בפרק 7.'; }
  draw();
};

/* 9.3 — copies between the CPU and the GPU */
W.w6_transfer = function (box) {
  V.say(box, 'שלוש דרכים להביא פריים למודל על כרטיס מסך. הגדלים <b>מחושבים</b>; רוחב הפס — מודל (זיכרון רגיל מול נעול). בחר רזולוציה ומכונה.');
  const P = [['נרמול על המעבד, מעתיקים עשרוני', 'f'], ['מעתיקים שמונה ביטים, מנרמלים בכרטיס', 'u'], ['פענוח ועיבוד בכרטיס — לא חוזרים למעבד', 'g']]; let res = 1, pinned = false, jetson = false;
  V.tabs(box, ['1080', '4K'], k => { res = k; draw(); }); const r1 = row(box); [['זיכרון נעול', 'p'], ['Jetson — זיכרון משותף', 'j']].forEach(([n, k]) => { const c = el('label', { html: '<input type="checkbox"> ' + n + ' &nbsp;' }); c.querySelector('input').onchange = e => { if (k === 'p') pinned = e.target.checked; else jetson = e.target.checked; draw(); }; r1.appendChild(c); });
  const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const w = res ? 3840 : 1920, h = res ? 2160 : 1080; const frame = w * h * 3 / 1e6, f32 = 3 * 640 * 640 * 4 / 1e6, u8 = 3 * 640 * 640 / 1e6; const bw = jetson ? Infinity : (pinned ? 12 : 4.5);
    const rows = P.map(([n, k]) => { const mb = k === 'f' ? f32 : k === 'u' ? u8 : 0; const ms = jetson ? 0 : mb / bw; return [n, F(mb, 2) + ' MB', F(ms, 2) + ' מ"ש', F(mb * 30, 0) + ' MB/s']; });
    tb.innerHTML = table(['דרך', 'עובר לכרטיס בכל פריים', 'זמן העתקה', 'בקצב של 30'], rows) + '<div class="note-small">הפריים מהמצלמה: ' + F(frame, 1) + ' MB (שמונה ביטים) — ' + F(frame * 30, 0) + ' MB בשנייה; בעשרוני לפני ההקטנה: ' + F(frame * 4 * 30 / 1000, 2) + ' GB בשנייה (תרגיל 9.1).</div>';
    out.innerHTML = 'שמונה ביטים במקום עשרוני — פי ארבעה פחות על הערוץ, והנרמול בכרטיס כמעט חינם; המעבד נשאר פנוי לפענוח ולעוקב. ' + (jetson ? 'ב־Jetson המעבד והכרטיס חולקים זיכרון פיזי — ההעתקות נחסכות (אם מקצים נכון), והשאלה הופכת לכמה פעמים <i>עוברים</i> על הנתונים. ' : pinned ? 'זיכרון נעול: ההעתקה מהירה יותר, ויכולה לרוץ במקביל לחישוב (פרק 4.2). ' : '') + 'והכי טוב: להכניס את הנרמול לתוך המודל (חלוקה ב־255 בתחילת הגרף) — ואז הקלט הוא שמונה ביטים בכל מנוע.'; }
  draw();
};
})();

/* ===================================================================== chapter 10 */
(function () {
const W = window.W, V = window.V, el = V.el, D4 = window.D4; const { F, canvas, table, row, txt, rng, randn } = D4; const f32 = Math.fround;

/* 10.1 — what is different from Java: memory over time, and passing by value */
W.w6_java_cpp = function (box) {
  V.say(box, 'מודל של לולאת זמן אמת: בכל פריים מוקצה חוצץ של 5 MB (תמונה מעובדת) ומשתחרר בסופו. ב־Java הזיכרון מתפנה כשמנקה הזבל מחליט — הערימה עולה כמו מסור, ובכל איסוף יש עצירה שמוסיפה זמן לפריים. ב־C++ החוצץ משתחרר ביציאה מהתחום (RAII) — שטוח, בלי עצירות. ולמטה: מחיר העברה לפי ערך של <code class="ltr">std::vector</code>, מחושב.');
  let heap = 512, pause = 12, mb = 5, n = 1e6; const r1 = row(box); V.slider(r1, 'ערימה (MB)', 64, 2048, 64, heap, v => { heap = v; draw(); }); V.slider(r1, 'עצירת איסוף (מ"ש)', 1, 60, 1, pause, v => { pause = v; draw(); }); V.slider(r1, 'חוצץ לפריים (MB)', 1, 25, 1, mb, v => { mb = v; draw(); }); const r2 = row(box); V.slider(r2, 'איברים בווקטור שמועבר', 1e3, 1e7, 1e3, n, v => { n = v; draw(); }, v => Math.round(v).toLocaleString());
  const cv = canvas(box, 760, 200, 760); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const N = 600; const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 200); let used = 50; const jl = [], cl = []; const base = 14; const jLat = [], cLat = [];
    for (let i = 0; i < N; i++) { used += mb; let p = 0; if (used > heap) { used = 50; p = pause; } jl.push(used); jLat.push(base + p); cl.push(50 + mb); cLat.push(base); }
    const X = i => 50 + i / N * 690, Y = v => 90 - v / heap * 75; x.strokeStyle = '#e8590c'; x.beginPath(); jl.forEach((v, i) => i ? x.lineTo(X(i), Y(v)) : x.moveTo(X(i), Y(v))); x.stroke(); x.strokeStyle = '#1c7ed6'; x.beginPath(); cl.forEach((v, i) => i ? x.lineTo(X(i), Y(v)) : x.moveTo(X(i), Y(v))); x.stroke(); txt(x, 'זיכרון: Java (כתום), C++ (כחול)', 745, 12, '#495057', 10, 'right');
    const Y2 = v => 190 - v / (base + pause) * 70; x.fillStyle = '#e8590c'; jLat.forEach((v, i) => { if (v > base) x.fillRect(X(i) - 1, Y2(v), 3, 190 - Y2(v)); }); x.strokeStyle = '#adb5bd'; x.beginPath(); x.moveTo(50, Y2(base)); x.lineTo(740, Y2(base)); x.stroke(); txt(x, 'זמן פריים: עצירות איסוף (כתום) מעל ' + base + ' מ"ש', 745, 118, '#495057', 10, 'right');
    const s = jLat.slice().sort((a, b) => a - b); const p99 = s[Math.floor(0.99 * N)], gcs = jLat.filter(v => v > base).length; const bytes = n * 4 / 1e6, copyMs = bytes / 10;
    tb.innerHTML = table(['', 'Java (מנקה זבל)', 'C++ (RAII)'], [['איסופים ב־600 פריימים', gcs, 0], ['אחוזון 99 של זמן הפריים', F(p99, 0) + ' מ"ש', base + ' מ"ש'], ['העברה של ' + Math.round(n).toLocaleString() + ' מספרים לפונקציה', 'הפניה — 0', 'לפי ערך: העתקה של ' + F(bytes, 1) + ' MB (כ־' + F(copyMs, 2) + ' מ"ש); ‏<code class="ltr">const std::vector&lt;float&gt;&amp;</code> — 0']]);
    out.innerHTML = 'מנקה הזבל לא "איטי" — הוא <b>לא צפוי</b>: ' + gcs + ' עצירות של ' + pause + ' מ"ש, והן בדיוק הזנב שאחוזון 99 מודד (פרק 1.2). ב־C++ המחיר הוא שאתה אחראי: שכחת לשחרר — דליפה (סעיף 10.3); העברת ווקטור לפי ערך — העתקה שקטה בכל קריאה. לכן <code class="ltr">const T&amp;</code> הוא ברירת המחדל לפרמטר גדול (תרגיל 10.1).'; }
  draw();
};

/* 10.2 — floating-point addition is not associative: computed here in float32 */
W.w6_assoc = function (box) {
  V.say(box, 'סכום של מיליון מספרים נורמליים, מחושב <b>כאן</b> בדיוק של 32 ביט (<code class="ltr">Math.fround</code> אחרי כל חיבור), בשלושה סדרים: איבר אחר איבר (מה שהקוד כותב); בשמונה סכומים חלקיים במקביל (מה שהוראה וקטורית הייתה עושה); ובזוגות (עץ). ואותו דבר במספרים שלמים של שמונה ביטים. אם הסדר משנה את התוצאה — המהדר <b>אסור</b> לשנות אותו.');
  let lanes = 8, nexp = 20, seed = 0; const r1 = row(box); V.slider(r1, 'מסלולים במקביל', 2, 32, 2, lanes, v => { lanes = v; draw(); }); V.slider(r1, 'איברים (חזקה של 2)', 10, 22, 1, nexp, v => { nexp = v; draw(); }, v => '2^' + v); V.btns(r1, [['🎲', () => { seed++; draw(); }]]);
  const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const n = 1 << nexp; const r = rng(seed * 7 + 1); const a = new Float32Array(n), b = new Float32Array(n); for (let i = 0; i < n; i++) { a[i] = randn(r); b[i] = randn(r); }
    let exact = 0; for (let i = 0; i < n; i++) exact += a[i] * b[i]; let seq = 0; for (let i = 0; i < n; i++) seq = f32(seq + f32(a[i] * b[i]));
    const part = new Array(lanes).fill(0); for (let i = 0; i < n; i++) part[i % lanes] = f32(part[i % lanes] + f32(a[i] * b[i])); let lane = 0; part.forEach(p => lane = f32(lane + p));
    let lvl = Array.from(a, (v, i) => f32(v * b[i])); while (lvl.length > 1) { const nx = []; for (let i = 0; i < lvl.length; i += 2) nx.push(f32(lvl[i] + (lvl[i + 1] || 0))); lvl = nx; } const tree = lvl[0];
    let ma = 0, mb = 0; for (let i = 0; i < n; i++) { ma = Math.max(ma, Math.abs(a[i])); mb = Math.max(mb, Math.abs(b[i])); } const qa = Array.from(a, v => Math.round(v / ma * 127)), qb = Array.from(b, v => Math.round(v / mb * 127)); let i1 = 0; for (let i = 0; i < n; i++) i1 += qa[i] * qb[i]; const p8 = new Array(lanes).fill(0); for (let i = 0; i < n; i++) p8[i % lanes] += qa[i] * qb[i]; const i2 = p8.reduce((s, v) => s + v, 0);
    tb.innerHTML = table(['סדר החיבור', 'תוצאה בעשרוני של 32 ביט', 'מרחק מהמדויק'], [['מדויק (64 ביט)', F(exact, 4), '—'], ['איבר אחר איבר', F(seq, 4), F(Math.abs(seq - exact), 4)], [lanes + ' סכומים חלקיים', F(lane, 4), F(Math.abs(lane - exact), 4)], ['בזוגות (עץ)', F(tree, 4), F(Math.abs(tree - exact), 4)], ['<b>שמונה ביטים</b>: איבר אחר איבר / ' + lanes + ' חלקיים', i1.toLocaleString() + ' / ' + i2.toLocaleString(), i1 === i2 ? '<b>זהה</b>' : 'שונה']]);
    out.innerHTML = 'שלושת הסדרים בעשרוני נותנים <b>שלוש תוצאות שונות</b> — כולן "נכונות" בערך, אף אחת לא זהה. לכן המהדר, ש<i>חייב</i> לשמור על התוצאה של הקוד כפי שנכתב, לא יפצל את הלולאה לסכומים חלקיים — והיא נשארת איבר אחר איבר (בקורס: 3,034 ← 2,905 מיקרו־שניות בלבד עם <span class="ltr">-O3 -march=native</span>). בשלמים החיבור קיבוצי — הסדר לא משנה — והמהדר חופשי להפוך לוקטורי (435 ← 212). ‏<span class="ltr">-ffast-math</span> מרשה לו לשנות סדר גם בעשרוני (תרגיל 10.4). ובדרך: הסכום בזוגות מדויק יותר מאיבר אחר איבר — טריק שספריות משתמשות בו.'; }
  draw();
};

/* 10.3 — RAII: a leak on a rare path, over a long flight */
W.w6_raii = function (box) {
  V.say(box, 'טיסה ארוכה: בכל פריים מוקצה חוצץ בזיכרון הכרטיס (3 MB) ומשוחרר בסוף. אבל פעם ב־N פריימים יש מסלול נדיר — חריגה, או <code class="ltr">return</code> מוקדם כשאין זיהוי — שמדלג על השורה של השחרור. בשחרור ידני (<code class="ltr">cudaFree</code> בסוף הפונקציה) הזיכרון דולף; עם RAII (מפרק שרץ תמיד) — לא. ומתג שלישי: מחלקה עם RAII שמותר <b>להעתיק</b>.');
  let mode = 0, every = 100, mem = 8, fps = 30; V.tabs(box, ['שחרור ידני', 'RAII — מפרק משחרר', 'RAII, אבל מותר להעתיק'], k => { mode = k; draw(); }); const r1 = row(box); V.slider(r1, 'מסלול נדיר: פעם ב־', 50, 5000, 50, every, v => { every = v; draw(); }, v => v + ' פריימים'); V.slider(r1, 'זיכרון הלוח (GB)', 4, 32, 4, mem, v => { mem = v; draw(); });
  const cv = canvas(box, 760, 170, 760); const out = V.say(box);
  function draw() { const hours = 3, frames = hours * 3600 * fps; const leakPer = mode === 0 ? 3 / every : 0; const free0 = mem * 1024 - 2500; const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 170); const X = h => 50 + h / hours * 690, Y = v => 150 - v / (mem * 1024) * 130;
    let crash = null; x.strokeStyle = '#1c7ed6'; x.lineWidth = 2; x.beginPath(); for (let i = 0; i <= 300; i++) { const h = i / 300 * hours; const used = 2500 + leakPer * h * 3600 * fps; if (used > mem * 1024 && crash === null) crash = h; const u = Math.min(used, mem * 1024); i ? x.lineTo(X(h), Y(u)) : x.moveTo(X(h), Y(u)); } x.stroke(); x.lineWidth = 1;
    x.strokeStyle = '#e03131'; x.setLineDash([5, 4]); x.beginPath(); x.moveTo(50, Y(mem * 1024)); x.lineTo(740, Y(mem * 1024)); x.stroke(); x.setLineDash([]); txt(x, 'זיכרון הלוח', 735, Y(mem * 1024) - 4, '#e03131', 10, 'right'); [0, 1, 2, 3].forEach(h => txt(x, h + ' ש׳', X(h), 166, '#868e96', 10, 'center'));
    if (mode === 2) { x.fillStyle = '#e03131'; x.fillRect(X(0.0005), 20, 4, 130); txt(x, 'קריסה מיד: שחרור כפול', X(0.02), 40, '#e03131', 12, 'left', true); }
    if (crash !== null && mode === 0) { x.fillStyle = '#e03131'; x.beginPath(); x.arc(X(crash), Y(mem * 1024), 6, 0, 7); x.fill(); }
    out.innerHTML = mode === 0 ? ('דליפה של 3 MB כל ' + every + ' פריימים — ' + F(leakPer * fps * 3600 / 1024, 2) + ' GB בשעה. ' + (crash !== null ? '<b>הזיכרון נגמר אחרי ' + F(crash * 60, 0) + ' דקות</b> — באמצע טיסה, בלי מנקה זבל שיציל. ובבדיקה של עשר דקות על השולחן? ' + F(leakPer * fps * 600, 0) + ' MB — אף אחד לא שם לב.' : 'בשלוש שעות הדליפה לא מגיעה לגבול — אבל היא שם, ותגיע בטיסה ארוכה יותר או על לוח קטן יותר.')) : mode === 1 ? 'המפרק רץ <b>תמיד</b> כשהאובייקט יוצא מהתחום — ב־<code class="ltr">return</code>, בחריגה, בכל מסלול. הזיכרון שטוח לכל אורך הטיסה. זה RAII: המשאב שייך לאובייקט (<code class="ltr">std::unique_ptr</code>, או <code class="ltr">DeviceBuffer</code> של תרגיל 10.3).' : '<b>שתי העתקות של אותו מצביע</b> — וכל אחת משחררת אותו במפרק שלה: שחרור כפול, קריסה מיד או השחתה שקטה של הזיכרון. לכן במחלקה כזו <b>מוחקים</b> את ההעתקה (<code class="ltr">= delete</code>) ומרשים רק העברה (<code class="ltr">&amp;&amp;</code>), שמאפסת את המקור (תרגיל 10.3).'; }
  draw();
};
})();

/* ===================================================================== chapter 11 — the project */
(function () {
const W = window.W, V = window.V, el = V.el, D4 = window.D4; const { F, canvas, table, row, txt } = D4;
const store = { get(k, d) { try { const v = localStorage.getItem('m6p_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('m6p_' + k, JSON.stringify(v)); } catch (e) { } } };

/* 11.1 — the deliverable as a system: every choice of the module in one place */
W.w6_deliverables = function (box) {
  V.say(box, 'הצינור של הפרויקט, כמערכת אחת: כל בחירה מפרקי המודול, והתוצאה המשוערת מול שורת היעד של פרק 1.4 (אחוזון 95 מקצה לקצה מתחת ל־33 מ"ש, 30 בשנייה, מעט פריימים שנזרקו). <b>זה מודל</b> שמחבר את המספרים של הפרקים — לא מדידה; התפקיד שלו לעזור לבחור מה למדוד ראשון.');
  const HW = [['מחשב נייד עם כרטיס', { gpu: 1, cpu: 1, ms: { fp32: 9, fp16: 4.2, int8: 3.1 } }], ['Jetson Orin Nano', { gpu: 1, cpu: 3.5, ms: { fp32: 28, fp16: 13, int8: 9 } }], ['מעבד בלבד (כמו בקורס)', { gpu: 0, cpu: 1, ms: { fp32: 46, fp16: 46, int8: 30 } }]];
  const o = store.get('sys', { hw: 1, prec: 'fp16', pre: 1, q: 1, hwdec: 1, u8: 1, thr: 1 });
  V.tabs(box, HW.map(h => h[0]), k => { o.hw = k; draw(); }, o.hw); V.tabs(box, ['דיוק מלא', 'חצי דיוק', 'שמונה ביטים'], k => { o.prec = ['fp32', 'fp16', 'int8'][k]; draw(); }, ['fp32', 'fp16', 'int8'].indexOf(o.prec));
  const r1 = row(box); [['pre', 'הקטנה לפני נרמול (9.1)'], ['q', 'תור של החדש (7.2)'], ['hwdec', 'פענוח בחומרה (9.2)'], ['u8', 'שמונה ביטים לכרטיס (9.3)'], ['thr', 'תהליכון לכל שלב (7.1)']].forEach(([k, n]) => { const c = el('label', { html: '<input type="checkbox"' + (o[k] ? ' checked' : '') + '> ' + n + ' &nbsp;' }); c.querySelector('input').onchange = e => { o[k] = e.target.checked ? 1 : 0; draw(); }; r1.appendChild(c); });
  const cv = canvas(box, 760, 110, 760); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { store.set('sys', o); const h = HW[o.hw][1]; const dec = (o.hwdec && h.gpu ? 0.9 : 3) * h.cpu; const pre = (o.pre ? 1.9 : 8.4) * h.cpu * (o.u8 && h.gpu ? 0.6 : 1); const copy = h.gpu ? (o.u8 ? 0.3 : 1.1) * (o.hw === 1 ? 0.2 : 1) : 0; const inf = h.ms[o.prec]; const trk = 0.5 * h.cpu, draw_ = 1.1 * h.cpu; const S = [dec, pre + copy, inf, trk + draw_]; const nm = ['פענוח', 'עיבוד מקדים והעתקה', 'מזהה', 'עוקב וציור'];
    const R = window.SIM6.runPipe({ T: o.thr ? S : [S.reduce((a, b) => a + b, 0)], loop: false, fps: 30, seconds: 6, policy: o.q ? 'latest' : 'fifo', jit: 0.12, seed: 5 }); const lat = R.lat.slice().sort((a, b) => a - b); const p95 = lat[Math.floor(0.95 * (lat.length - 1))]; const drop = 100 * (R.n - R.done.length) / R.n;
    const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 110); const tot = S.reduce((a, b) => a + b, 0); let X0 = 20; const cols = ['#e8590c', '#ae3ec9', '#2f9e44', '#1c7ed6']; S.forEach((v, i) => { const w = v / Math.max(tot, 33.3) * 720; x.fillStyle = cols[i]; x.fillRect(X0, 30, Math.max(1, w - 1), 34); if (w > 60) txt(x, nm[i] + ' ' + F(v, 1), X0 + w / 2, 52, '#fff', 10, 'center', true); X0 += w; }); const L33 = 20 + 33.3 / Math.max(tot, 33.3) * 720; x.strokeStyle = '#e03131'; x.beginPath(); x.moveTo(L33, 20); x.lineTo(L33, 74); x.stroke(); txt(x, '33 מ"ש', L33, 90, '#e03131', 10, 'center'); const big = S.indexOf(Math.max(...S));
    const ok = p95 < 33 && R.fps > 28 && drop < 5; tb.innerHTML = table(['תפוקה', 'אחוזון 95 של ההשהייה', 'נזרקו', 'הצוואר', 'שורת היעד'], [[F(R.fps, 1) + ' בשנייה', F(p95, 0) + ' מ"ש', F(drop, 0) + '%', nm[big], ok ? '<b style="color:#2f9e44">עומד</b>' : '<b style="color:#e03131">לא עומד</b>']]);
    out.innerHTML = 'הצוואר: <b>' + nm[big] + '</b> (' + F(S[big], 1) + ' מ"ש). ' + (big === 2 ? 'המזהה — המקום לפרקים 4–6 (מנוע, חצי דיוק, שמונה ביטים). ' : big === 0 ? 'הפענוח — פרק 9.2: מפענח בחומרה, או רזולוציה נמוכה יותר במצלמה. ' : big === 1 ? 'העיבוד המקדים — פרק 9.1 ו־9.3: להקטין קודם, ולשלוח שמונה ביטים. ' : 'העוקב והציור — לצייר רק מה שמוצג (תרגיל 8.4). ') + (!o.q ? 'תור בלי גבול: אם משהו איטי מ־33 מ"ש, ההשהייה גדלה בלי סוף. ' : '') + 'זו הפסקה הרביעית של ההגשה — "איפה הצוואר עכשיו" — אבל מהמדידה שלך, לא מכאן.'; }
  draw();
};

/* 11.2 — the work plan, with a pass/fail check for every stage */
W.w6_plan6 = function (box) {
  V.say(box, 'חמשת שלבי העבודה, ולכל אחד בדיקת הצלחה עם מספר. הכנס את מה שמדדת — והשלב מסומן כעובר או נכשל. מה שתכניס נשמר בדפדפן הזה.');
  const ST = [['1. קו בסיס', 'הפרש מרבי בין הקובץ למקור (סעיף 2.4)', 'diff', v => v <= 1e-4, '≤ 0.0001'], ['2. חצי דיוק', 'ירידה במדד הזיהוי, נקודות', 'd16', v => v < 1, '< 1'], ['3. שמונה ביטים', 'ירידה במדד מול חצי דיוק, נקודות (הסף נכתב מראש — תרגיל 11.3)', 'd8', (v, s) => v <= (s.thr || 1), '≤ הסף שלך'], ['4. צינור', 'אחוזון 95 של ההשהייה מקצה לקצה, מ"ש', 'p95', v => v < 33, '< 33'], ['5. דו"ח', 'שורות מלאות בטבלה של 11.3, מתוך 9', 'rows', v => v >= 9, '9']];
  const s = store.get('plan', {}); const r0 = row(box); const ti = el('label', { html: 'הסף שלך לשלב 3 (נקודות): <input type="number" step="0.1" style="width:70px" value="' + (s.thr || 1) + '">' }); ti.querySelector('input').oninput = e => { s.thr = +e.target.value; draw(); }; r0.appendChild(ti);
  const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { store.set('plan', s); tb.innerHTML = table(['שלב', 'מה מודדים', 'סף', 'מה מדדת', 'מצב'], ST.map(([n, m, k, f, th]) => { const v = s[k]; const has = v !== undefined && v !== ''; return [n, m, th, '<input data-k="' + k + '" type="number" step="any" style="width:90px" value="' + (has ? v : '') + '">', has ? (f(+v, s) ? '<b style="color:#2f9e44">עובר</b>' : '<b style="color:#e03131">נכשל</b>') : '—']; }));
    tb.querySelectorAll('input').forEach(i => i.onchange = e => { const k = e.target.dataset.k; s[k] = e.target.value === '' ? undefined : +e.target.value; draw(); });
    const done = ST.filter(([, , k, f]) => s[k] !== undefined && f(+s[k], s)).length; out.innerHTML = done + ' מתוך 5 שלבים עוברים. ' + (s.d8 !== undefined && s.d8 > (s.thr || 1) ? 'שלב 3 נכשל — לפי שאלת הראיון של הפרק: מכממים שכבה אחת בכל פעם כדי למצוא את הרגישה, ואז מהזול ליקר — סט כיול, שיטת כיול, השארת שכבות בחצי דיוק, ורק בסוף אימון מודע כימום. ' : '') + (s.p95 !== undefined && s.p95 >= 33 ? 'שלב 4 נכשל — חזרה לפרק 8: שעון לכל שלב, ומי הצוואר. ' : '') + 'שלב רשות: אותו מנוע מתוך C++ (פרק 10).'; }
  draw();
};

/* 11.3 — the report table: fill it, get the comparison */
W.w6_report6 = function (box) {
  V.say(box, 'התבנית של סעיף 11.3 כטופס: שורת פתיחה, ושמונה שורות לשלושה דיוקים. מלא מה שמדדת — מתחת מתקבלים היחסים מול דיוק מלא, בדיקה מול שורת היעד, וטבלה מוכנה להעתקה לדו"ח. נשמר בדפדפן הזה.');
  const ROWS = [['inf50', 'הסקה בלבד: חציון (מ"ש)'], ['inf95', 'הסקה בלבד: אחוזון 95 (מ"ש)'], ['fps', 'מקצה לקצה: פריימים בשנייה'], ['lat95', 'מקצה לקצה: אחוזון 95 של השהייה (מ"ש)'], ['drop', 'פריימים שנזרקו מכל מאה'], ['mem', 'זיכרון: כרטיס ותהליך (MB)'], ['eng', 'גודל קובץ המנוע (MB)'], ['map', 'מדד זיהוי (מודול 4)'], ['ids', 'החלפות זהות בעוקב (מודול 5)']]; const PR = ['fp32', 'fp16', 'int8'];
  const d = store.get('rep', { head: 'Jetson Orin Nano, מצב 15W, JetPack 6, ‏TensorRT 10, קלט 640, אצווה 1, סרטון: drone.mp4 (2 דקות)' }); const r0 = el('div'); box.appendChild(r0); r0.innerHTML = '<label>שורת פתיחה: <input type="text" style="width:640px" value="' + d.head.replace(/"/g, '&quot;') + '"></label>'; r0.querySelector('input').oninput = e => { d.head = e.target.value; draw(); };
  const tb = el('div'); box.appendChild(tb); const res = el('div'); box.appendChild(res); const pre = el('pre', { class: 'ltr', style: 'background:#f8f9fa;padding:8px;font-size:12px;white-space:pre-wrap' }); box.appendChild(pre); V.btns(box, [['📋 העתק את הטבלה', () => { try { navigator.clipboard.writeText(pre.textContent); } catch (e) { } }], ['דוגמה (מספרים מומצאים להמחשה)', () => { Object.assign(d, { fp32_inf50: 28, fp32_inf95: 31, fp32_fps: 24, fp32_lat95: 61, fp32_drop: 20, fp32_map: 52.1, fp16_inf50: 13, fp16_inf95: 15, fp16_fps: 30, fp16_lat95: 31, fp16_drop: 1, fp16_map: 52.0, int8_inf50: 9, int8_inf95: 11, int8_fps: 30, int8_lat95: 27, int8_drop: 0, int8_map: 50.4 }); build(); draw(); }]]); const out = V.say(box);
  function build() { tb.innerHTML = table(['מדד', 'דיוק מלא', 'חצי דיוק', 'שמונה ביטים'], ROWS.map(([k, n]) => [n, ...PR.map(p => '<input data-k="' + p + '_' + k + '" type="number" step="any" style="width:80px" value="' + (d[p + '_' + k] ?? '') + '">')])); tb.querySelectorAll('input').forEach(i => i.oninput = e => { const k = e.target.dataset.k; d[k] = e.target.value === '' ? undefined : +e.target.value; draw(); }); }
  function draw() { store.set('rep', d); const g = (p, k) => d[p + '_' + k]; const lines = [];
    const HN = { fp16: 'חצי דיוק', int8: 'שמונה ביטים' }; PR.slice(1).forEach(p => { if (g(p, 'inf50') && g('fp32', 'inf50')) lines.push(HN[p] + ': הסקה מהירה פי ' + F(g('fp32', 'inf50') / g(p, 'inf50'), 2) + (g(p, 'fps') && g('fp32', 'fps') ? ', הצינור פי ' + F(g(p, 'fps') / g('fp32', 'fps'), 2) : '') + (g(p, 'map') !== undefined && g('fp32', 'map') !== undefined ? ', מדד הזיהוי ' + (g(p, 'map') - g('fp32', 'map') >= 0 ? '+' : '') + F(g(p, 'map') - g('fp32', 'map'), 1) + ' נקודות' : '') + '.'); if (g(p, 'lat95') !== undefined) lines.push(HN[p] + ': אחוזון 95 מקצה לקצה ' + g(p, 'lat95') + ' מ"ש — ' + (g(p, 'lat95') < 33 ? 'עומד ביעד.' : '<b>לא עומד ביעד</b>.')); });
    if (g('fp16', 'inf50') && g('fp16', 'fps') && g('fp32', 'inf50') && g('fp32', 'fps')) { const a = g('fp32', 'inf50') / g('fp16', 'inf50'), b = g('fp16', 'fps') / g('fp32', 'fps'); if (b < a * 0.7) lines.push(g('fp16', 'fps') >= 28 ? 'הצינור הואץ פחות מההסקה כי הוא כבר בקצב המצלמה — מעבר לזה אין מה להרוויח בתפוקה; הרווח הוא בהשהייה ובפריימים שלא נזרקים.' : 'הצינור הואץ הרבה פחות מההסקה — הצוואר עבר למקום אחר (פרק 8).'); }
    res.innerHTML = lines.length ? '<ul>' + lines.map(l => '<li>' + l + '</li>').join('') + '</ul>' : '';
    const md = [d.head, '', '| מדד | דיוק מלא | חצי דיוק | שמונה ביטים |', '|---|---|---|---|'].concat(ROWS.map(([k, n]) => '| ' + n + ' | ' + PR.map(p => g(p, k) ?? '').join(' | ') + ' |')); pre.textContent = md.join('\n');
    out.innerHTML = 'שתי השורות האחרונות — מדד הזיהוי והחלפות הזהות — הן מה שמבדיל דו"ח מפרסומת: מנוע מהיר עם תיבות רועשות יותר עלול להוסיף החלפות בעוקב, וזה לא נראה במדד הזיהוי.'; }
  build(); draw();
};

/* 11.4 — the dry run: fixed cost vs work, from the course's four measurements */
W.w6_dryrun = function (box) {
  V.say(box, 'ארבע מדידות של הקורס על הרשת של פרק 2 (מיקרו־שניות): תמונה אחת — דיוק מלא 5.2, שמונה ביטים 9.7; אצווה של 540 — ‏188.8 ו־133.3. מכל זוג מחשבים קו ישר: <b>מחיר קבוע + מחיר לתמונה</b>. הזז את גודל האצווה: איפה הקווים נחתכים?');
  const A = { a: 5.2 - (188.8 - 5.2) / 539, b: (188.8 - 5.2) / 539 }, B = { a: 9.7 - (133.3 - 9.7) / 539, b: (133.3 - 9.7) / 539 }; let n = 1; const r1 = row(box); V.slider(r1, 'תמונות בקריאה', 1, 540, 1, n, v => { n = v; draw(); });
  const cv = canvas(box, 760, 200, 760); const out = V.say(box); const cross = (B.a - A.a) / (A.b - B.b);
  function draw() { const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 200); const X = k => 50 + k / 540 * 690, Y = v => 180 - v / 200 * 165;
    [[A, '#1c7ed6', 'דיוק מלא'], [B, '#ae3ec9', 'שמונה ביטים']].forEach(([L, col, nmm], i) => { x.strokeStyle = col; x.lineWidth = 2; x.beginPath(); x.moveTo(X(1), Y(L.a + L.b)); x.lineTo(X(540), Y(L.a + L.b * 540)); x.stroke(); x.lineWidth = 1; txt(x, nmm, 745, 18 + i * 15, col, 11, 'right', true); });
    [[1, 5.2, '#1c7ed6'], [540, 188.8, '#1c7ed6'], [1, 9.7, '#ae3ec9'], [540, 133.3, '#ae3ec9']].forEach(([k, v, c]) => { x.fillStyle = c; x.beginPath(); x.arc(X(k), Y(v), 4, 0, 7); x.fill(); });
    x.strokeStyle = '#495057'; x.setLineDash([4, 3]); x.beginPath(); x.moveTo(X(n), 10); x.lineTo(X(n), 180); x.stroke(); x.setLineDash([]); [0, 100, 200].forEach(v => txt(x, v + ' µs', 46, Y(v) + 4, '#868e96', 10, 'right')); x.fillStyle = '#e03131'; x.beginPath(); x.arc(X(cross), Y(A.a + A.b * cross), 5, 0, 7); x.fill(); txt(x, 'נקודת החיתוך: ' + F(cross, 0) + ' תמונות', X(cross) + 8, Y(A.a + A.b * cross) - 8, '#e03131', 10, 'left');
    const ta = A.a + A.b * n, tb = B.a + B.b * n; out.innerHTML = 'מחיר קבוע לקריאה: דיוק מלא ' + F(A.a, 1) + ', שמונה ביטים <b>' + F(B.a, 1) + '</b> מיקרו־שניות; לתמונה: ' + F(A.b, 3) + ' מול <b>' + F(B.b, 3) + '</b>. ב־' + n + ' תמונות: ' + F(ta, 1) + ' מול ' + F(tb, 1) + ' — ' + (tb < ta ? 'שמונה ביטים מהירים פי ' + F(ta / tb, 2) : 'דיוק מלא מהיר פי ' + F(tb / ta, 2)) + '. החיתוך בכ־' + F(cross, 0) + ' תמונות: מתחתיו המחיר הקבוע של הכימום שולט — כמו בפרק 6.3, וכמו בתרגיל 11.1. מזהה אמיתי ב־640 הוא עבודה של מיליארדי כפלות <i>בתמונה אחת</i> — הרבה מעבר לחיתוך (תרגיל 11.4). (שני קווים ישרים משתי נקודות — קירוב; במדידה אמיתית מודדים עוד גדלים.)'; }
  draw();
};
})();
