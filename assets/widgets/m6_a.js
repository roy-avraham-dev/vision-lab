/* Module 6 visuals — chapters 1–4: measuring, ONNX, the runtime, TensorRT. Shared helpers in window.AC. */
(function () {
const W = window.W, V = window.V, el = V.el; const { f, ltr, mono, svgBox, txt, rng, randn } = window.BX;
const bar = (svg, x, y, w, h, col, st) => V.s('rect', { x, y, width: Math.max(0, w), height: h, rx: 3, style: Object.assign({ fill: col }, st || {}) }, svg);
const pct = (a, p) => { const s = a.slice().sort((x, y) => x - y); const i = (s.length - 1) * p / 100, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); };
const C = ['var(--c1)', 'var(--c3)', 'var(--c2)', 'var(--c4, #ae3ec9)', 'var(--c5, #e8a33d)', '#0c8599'];
/* horizontal bar chart: rows [[label, value, color?]] */
function hbars(box, rows, o) { o = o || {}; const w = o.w || 460, rh = o.rh || 30, lw = o.lw || 150; const svg = svgBox(box, w, rows.length * rh + 10); const mx = o.max || Math.max(...rows.map(r => r[1])) * 1.1;
  rows.forEach(([l, v, col], i) => { const y = 5 + i * rh; V.s('text', { x: w - 4, y: y + rh / 2 + 4, 'font-size': 12, direction: 'rtl', 'text-anchor': 'start', text: l, style: { fill: 'var(--ink2)' } }, svg); const bw = (w - lw - 60) * v / mx; bar(svg, 50, y + 4, bw, rh - 10, col || C[i % C.length]); txt(svg, [54 + bw, y + rh / 2 + 4], o.fmt ? o.fmt(v) : f(v, 1), { fontSize: '11px' }); });
  return svg; }
window.AC = { bar, pct, C, hbars };

/* 1.1 latency vs throughput */
W.w6_pipe_latency = function (box) {
  V.say(box, 'צינור של ארבעה שלבים. <b>שנה את הזמנים</b>, ועבור בין "בזה אחר זה" ל"כל שלב בתהליכון" (עם מספיק גרעינים). תרגיל 1.1: 5, 40, 5.');
  const T = [5, 40, 5, 0], names = ['פענוח ועיבוד מקדים', 'מודל', 'עיבוד מאוחר', 'ציור ועוקב']; let par = false;
  const sr = V.row(box); T.forEach((v, i) => V.slider(sr, names[i], 0, 60, 1, v, x => { T[i] = x; draw(); })); V.tabs(box, ['בזה אחר זה', 'כל שלב בתהליכון'], i => { par = i === 1; draw(); });
  const svg = svgBox(box, 480, 150); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const sum = T.reduce((a, b) => a + b, 0), mx = Math.max(...T); const per = par ? mx : sum; const sc = 440 / Math.max(1, sum * 3);
    for (let k = 0; k < 4; k++) { let x = 20 + k * per * sc; T.forEach((t, i) => { bar(svg, x, 20 + k * 28, t * sc, 20, C[i]); x += t * sc; }); txt(svg, [4, 34 + k * 28], '#' + (k + 1), { fontSize: '10px' }); }
    out.innerHTML = 'תפוקה: <b>' + ltr(f(1000 / Math.max(1e-9, per), 1)) + '</b> פריימים בשנייה (1 חלקי ' + (par ? 'השלב האיטי' : 'סכום הזמנים') + '). השהייה: <b>' + ltr(f(sum, 0)) + '</b> מילישניות לפחות' + (par ? ' — לא השתנתה: כל פריים עדיין עובר את כל השלבים.' : '.'); }
  draw();
};

/* 1.2 warm-up and percentiles */
W.w6_warmup = function (box) {
  V.say(box, 'זמני ריצה מדומים בסגנון הסעיף: ריצות ראשונות איטיות, ואחר כך פיזור עם זנב. <b>שנה את מספר הריצות</b> ואת השלכת החימום, וראה כמה אחוזון 99 יציב (תרגיל 1.2).');
  let n = 50, warm = 5, seed = 1; const sr = V.row(box); V.slider(sr, 'ריצות', 20, 2000, 10, n, v => { n = v; draw(); }); V.slider(sr, 'ריצות חימום שמושלכות', 0, 10, 1, warm, v => { warm = v; draw(); });
  V.btns(box, [['הגרל מחדש', () => { seed++; draw(); }, 'ghost']]); const P = window.IM.plot(box, { w: 460, h: 180 }); const out = mono(box);
  function draw() { const r = rng(seed * 7 + 1); const t = []; for (let i = 0; i < n + 10; i++) { let v = 11.9 + Math.abs(randn(r)) * 0.6 + (r() < 0.04 ? 2 + r() * 2.5 : 0); if (i === 0) v = 16.0; if (i === 1) v = 15.6; if (i < 5 && i > 1) v += 1.5; t.push(v); }
    const used = t.slice(warm, warm + n); P.draw([{ pts: t.slice(0, warm + n).map((v, i) => [i, v]), color: '#adb5bd', width: 0, dots: true }, { vline: warm - 0.5, color: 'var(--c2)', dash: '4 3' }, { pts: [[0, pct(used, 50)], [warm + n, pct(used, 50)]], color: 'var(--c3)', width: 2 }, { pts: [[0, pct(used, 99)], [warm + n, pct(used, 99)]], color: 'var(--c2)', width: 2 }], [0, warm + n], [10, 18]);
    const mean = used.reduce((a, b) => a + b, 0) / used.length; out.textContent = 'mean ' + f(mean, 2) + '   median ' + f(pct(used, 50), 2) + '   p95 ' + f(pct(used, 95), 2) + '   p99 ' + f(pct(used, 99), 2) + ' ms\nruns above p99: ' + f(n * 0.01, 1) + (n < 1000 ? '   (fewer than 10 → p99 is basically the max)' : ''); }
  draw();
};

/* 1.3 batching */
W.w6_batch = function (box) {
  V.say(box, 'הטבלה של הסעיף, על מעבד עם שני גרעינים. <b>בחר גודל אצווה</b>. ובמצלמה אחת: כדי למלא אצווה צריך גם <b>לחכות</b> לפריימים.');
  const D = [[1, 12.2, 82], [2, 22.4, 89], [4, 46.2, 87], [8, 107.0, 75]]; let k = 0, fps = 30; V.tabs(box, D.map(d => 'אצווה ' + d[0]), i => { k = i; draw(); }); V.slider(box, 'קצב מצלמה', 10, 60, 5, fps, v => { fps = v; draw(); });
  const svg = svgBox(box, 480, 120); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const [b, lat, thr] = D[k]; const wait = (b - 1) * 1000 / fps; const sc = 440 / 400;
    bar(svg, 20, 20, wait * sc, 26, '#adb5bd'); bar(svg, 20 + wait * sc, 20, lat * sc, 26, 'var(--c1)'); txt(svg, [20, 66], 'אפור: מחכים שהאצווה תתמלא. כחול: ההסקה.', { fontSize: '11px' });
    D.forEach((d, i) => { bar(svg, 20 + i * 110, 112 - d[2] * 0.4, 40, d[2] * 0.4, i === k ? 'var(--c3)' : 'var(--line2)'); txt(svg, [66 + i * 110, 110], d[2] + ' בשנייה', { fontSize: '10px' }); });
    out.innerHTML = 'השהייה של הפריים הראשון באצווה: ' + ltr(f(wait, 0) + ' + ' + f(lat, 1) + ' = <b>' + f(wait + lat, 0) + '</b>') + ' מילישניות. תפוקה ' + thr + ' תמונות בשנייה (העמודות: תפוקה לכל גודל אצווה). במעבד הזה האצווה כמעט לא עוזרת.'; }
  draw();
};

/* 1.4 the target line */
W.w6_target = function (box) {
  V.say(box, 'שורת היעד של המודול. <b>בחר ערך לכל שדה</b> — שורה בלי אחד מהם היא הבטחה, לא מספר (תרגיל 1.3).');
  const F = [['חומרה', ['—', 'כרטיס מסך של מחשב נייד', 'Jetson במצב הספק מלא', 'מעבד עם שני גרעינים']], ['רזולוציה', ['—', 'קלט 640', 'קלט 1280']], ['אצווה', ['—', 'אצווה 1', 'אצווה 8']], ['מה נמדד', ['—', 'מודל בלבד', 'מקצה לקצה']], ['יעד', ['—', 'אחוזון 95 מתחת ל־33 מילישניות', 'חציון מתחת ל־10 מילישניות']]];
  const v = F.map(() => 0); const g = el('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px' } }); box.appendChild(g); const out = V.say(box);
  F.forEach(([n, o], i) => { const s = el('select', {}, ...o.map((x, j) => el('option', { value: j }, x))); s.onchange = () => { v[i] = +s.value; draw(); }; g.appendChild(el('label', {}, n + ' ', s)); });
  function draw() { const miss = F.filter((_, i) => !v[i]).map(x => x[0]); out.innerHTML = miss.length ? 'חסר: <b>' + miss.join(', ') + '</b>.' : '"' + F.map((x, i) => x[1][v[i]]).join(', ') + '" — <b>שורה שאפשר לבדוק.</b>'; }
  draw();
};

/* 2.1 what is in the file */
W.w6_onnx_graph = function (box) {
  V.say(box, 'הקובץ של הרשת מפרק 2 כגרף. <b>לחץ על רכיב</b> וראה לאיזה מארבעת החלקים הוא שייך.');
  const svg = svgBox(box, 480, 200); const out = V.say(box, 'בחר רכיב.');
  const items = [['pixels [N, 64]', 10, 90, 'io', 'קלט: שם, סוג (עשרוני 32) וצורה. N הוא ממד דינמי — כל גודל אצווה.'], ['Gemm', 120, 90, 'node', 'צומת: x כפול W ועוד b. קלטים: x, W0, b0. פלט: h0.'], ['Relu', 190, 90, 'node', 'צומת הפעלה, בלי משקלות.'], ['Gemm', 250, 90, 'node', 'שכבה שנייה.'], ['Relu', 320, 90, 'node', 'הפעלה.'], ['Gemm', 380, 90, 'node', 'שכבה שלישית. הפלט h2 הוא [N, 10].'], ['W0 b0', 120, 30, 'init', 'משקלות קבועים עם שם, שהצמתים קוראים כקלטים.'], ['W1 b1', 250, 30, 'init', 'משקלות קבועים.'], ['W2 b2', 380, 30, 'init', 'משקלות קבועים.'], ['opset 17', 10, 170, 'op', 'גרסת סט הפעולות. מנוע ישן לא יודע לקרוא גרסה חדשה מדי.']];
  const col = { io: 'var(--c3)', node: 'var(--c1)', init: 'var(--c5, #e8a33d)', op: 'var(--c2)' };
  [[70, 100, 120], [165, 100, 190], [235, 100, 250], [295, 100, 320], [365, 100, 380]].forEach(([a, y, b]) => V.s('line', { x1: a, y1: y, x2: b, y2: y, style: { stroke: 'var(--ink3)' } }, svg)); [120, 250, 380].forEach(x => V.s('line', { x1: x + 25, y1: 50, x2: x + 25, y2: 80, style: { stroke: 'var(--ink3)', strokeDasharray: '3 2' } }, svg));
  items.forEach(([t, x, y, k, d]) => { const g = V.s('g', { style: { cursor: 'pointer' } }, svg); V.s('rect', { x, y, width: t.length * 6.5 + 12, height: 22, rx: 5, style: { fill: col[k], opacity: 0.85 } }, g); txt(g, [x + 6, y + 15], t, { fill: '#fff', fontSize: '11px' }); g.addEventListener('click', () => { out.innerHTML = '<b>' + ltr(t) + '</b>: ' + d; }); });
  txt(svg, [300, 190], 'ירוק: קלט/פלט · כחול: צומת · כתום: משקלות · אדום: גרסה', { fontSize: '10px' });
};

/* 2.2 export arguments: dynamic axes */
W.w6_export_args = function (box) {
  V.say(box, 'הפרמטרים של הייצוא. <b>בחר ממד אצווה וגודל קלט</b> וראה מה המנוע אומר (בסעיף 2.4: ממד 0 קיבל 5 וציפה ל־1).');
  let dyn = false, nb = 5, opset = 17, eng = 17; const sr = V.row(box); V.tabs(sr, ['ממד קבוע 1', 'dynamic_axes: N'], i => { dyn = i === 1; draw(); }); V.slider(sr, 'תמונות בהרצה', 1, 8, 1, nb, v => { nb = v; draw(); });
  const sr2 = V.row(box); V.slider(sr2, 'opset בקובץ', 11, 20, 1, opset, v => { opset = v; draw(); }); V.slider(sr2, 'המקסימום שהמנוע מכיר', 11, 20, 1, eng, v => { eng = v; draw(); }); const out = mono(box);
  function draw() { const lines = ['input: images [' + (dyn ? 'N' : '1') + ', 3, 640, 640]   opset ' + opset]; if (opset > eng) lines.push('load: FAILED — opset ' + opset + ' is newer than this runtime supports (' + eng + ')'); else if (!dyn && nb !== 1) lines.push('run(' + nb + ' images): ERROR — dimension 0 got ' + nb + ', expected 1'); else lines.push('run(' + nb + ' images): OK → preds [' + nb + ', ...]'); out.textContent = lines.join('\n'); }
  draw();
};

/* 2.3 varint encoding */
W.w6_varint = function (box) {
  V.say(box, 'כך הכותב שלנו כותב מספר שלם: שבעה ביטים בכל בית, והביט העליון אומר "יש עוד". <b>הקלד מספר</b> (גם שלילי).');
  const inp = el('input', { type: 'number', value: 300, style: { width: '140px', direction: 'ltr' } }); box.appendChild(el('label', {}, 'n = ', inp)); const out = mono(box); inp.oninput = draw;
  function draw() { let n = BigInt(Math.trunc(+inp.value || 0)); n &= (1n << 64n) - 1n; const bytes = []; do { let b = n & 0x7Fn; n >>= 7n; if (n) b |= 0x80n; bytes.push(Number(b)); } while (n); out.textContent = bytes.map(b => b.toString(2).padStart(8, '0') + '  0x' + b.toString(16).padStart(2, '0') + (b & 0x80 ? '  (continue)' : '  (last)')).join('\n') + '\n' + bytes.length + ' byte' + (bytes.length > 1 ? 's' : '') + (+inp.value < 0 ? '  — negative numbers become 64-bit two\'s complement: 10 bytes' : ''); }
  draw();
};

/* 2.4 verification */
W.w6_verify = function (box) {
  V.say(box, 'מריצים את המקור ואת הקובץ המיוצא על אותם קלטים ומשווים עם סובלנות. <b>בחר מה השתבש</b> וראה את ההפרש.');
  let mode = 0; V.tabs(box, ['ייצוא תקין', 'סדר ערוצים הפוך', 'נרמול שונה', 'מצב אימון (בלי eval)'], i => { mode = i; draw(); }); const out = mono(box);
  function draw() { const r = rng(4); const ref = [...Array(10)].map(() => randn(r) * 3); let ort = ref.map(x => x); if (mode === 1) ort = ref.map((x, i) => ref[(i * 3) % 10] * 0.8 + randn(r)); if (mode === 2) ort = ref.map(x => x * 0.6 + 0.4); if (mode === 3) ort = ref.map(x => x * (r() < 0.3 ? 0 : 1.4));
    const d = Math.max(...ref.map((x, i) => Math.abs(x - ort[i]))); const ok = ref.every((x, i) => Math.abs(x - ort[i]) <= 1e-5 + 1e-4 * Math.abs(x)); const am = a => a.indexOf(Math.max(...a));
    out.textContent = 'y_ref: ' + ref.map(x => f(x, 2)).join(' ') + '\ny_ort: ' + ort.map(x => f(x, 2)).join(' ') + '\nmax abs diff = ' + f(d, 4) + '   class ' + am(ref) + ' vs ' + am(ort) + '\nassert_allclose(rtol=1e-4, atol=1e-5): ' + (ok ? 'PASS' : 'FAIL'); }
  draw();
};

/* 2.5 simplification */
W.w6_simplify = function (box) {
  V.say(box, 'גרף כמו שיוצא מספריית אימון: חישובי צורה שתמיד נותנים אותו דבר וצומת העתקה. <b>עבור על הפישוט</b>.');
  const svg = svgBox(box, 480, 170); const out = V.say(box);
  const G = [['images', 'io'], ['Conv', 'n'], ['Shape', 'c'], ['Gather', 'c'], ['Concat', 'c'], ['Reshape', 'n'], ['Identity', 'i'], ['Relu', 'n'], ['preds', 'io']];
  V.stepper(box, 3, s => { svg.innerHTML = ''; const show = G.filter(([n, k]) => !(s >= 1 && k === 'c') && !(s >= 2 && k === 'i')); show.forEach(([n, k], i) => { const x = 10 + i * (460 / show.length); V.s('rect', { x, y: 60, width: 460 / show.length - 10, height: 30, rx: 5, style: { fill: { io: 'var(--c3)', n: 'var(--c1)', c: 'var(--c5, #e8a33d)', i: '#adb5bd' }[k] } }, svg); txt(svg, [x + 3, 79], n + (s >= 1 && n === 'Reshape' ? ' [1,−1]' : ''), { fill: '#fff', fontSize: (show.length > 7 ? 8.5 : 11) + 'px' }); });
    out.innerHTML = ['לפני: ' + G.length + ' צמתים. כתום: חישוב צורה שלא תלוי בקלט. אפור: העתקה שלא עושה כלום.', 'קיפול קבועים: Shape, Gather ו־Concat מחושבים מראש, והתוצאה נכנסת כקבוע ל־Reshape.', 'הסרת Identity. נשארו ' + show.length + ' צמתים. ועכשיו — <b>מאמתים שוב</b>, כמו בסעיף 2.4.'][s]; });
};

/* 3.1 folding batch-norm into the convolution */
W.w6_bn_fold = function (box) {
  V.say(box, 'ערוץ אחד: קונבולוציה (משקל w והטיה b) ואחריה נרמול מנה. <b>שנה את ערכי הנרמול</b> — הקיפול נותן בדיוק אותו פלט עם פעולה אחת.');
  const p = { w: 0.8, b: 0.1, g: 1.5, be: 0.2, mu: 0.3, v: 0.25 }; const sr = V.row(box); [['w', -2, 2], ['b', -1, 1], ['g', 0.1, 3], ['be', -1, 1], ['mu', -1, 1], ['v', 0.01, 2]].forEach(([k, a, c]) => V.slider(sr, { g: 'γ', be: 'β', mu: 'μ', v: 'σ²' }[k] || k, a, c, 0.01, p[k], x => { p[k] = x; draw(); }));
  const out = mono(box); V.say(box, 'בסעיף: בלי אופטימיזציה רצו 16 פעולות (15.6 מילישניות בתהליכון אחד), עם כל האופטימיזציות 7 (6.0) — פי 2.6, בלי לשנות אף משקל.');
  function draw() { const eps = 1e-5, k = p.g / Math.sqrt(p.v + eps), W2 = k * p.w, b2 = k * (p.b - p.mu) + p.be; const x = 1.7; const y1 = p.g * (p.w * x + p.b - p.mu) / Math.sqrt(p.v + eps) + p.be, y2 = W2 * x + b2;
    out.textContent = "k  = γ / sqrt(σ² + ε) = " + f(k, 4) + "\nW' = k·w = " + f(W2, 4) + "    b' = k·(b − μ) + β = " + f(b2, 4) + '\nx = 1.7:  conv→BN = ' + f(y1, 6) + '   folded = ' + f(y2, 6); }
  draw();
};

/* 3.2 threads */
W.w6_threads = function (box) {
  V.say(box, 'הטבלה של הסעיף על מחשב עם שני גרעינים. <b>רחף על עמודה</b>: מעבר למספר הגרעינים, התהליכונים מחכים זה לזה.');
  const D = [[1, 23.3, 24.0], [2, 13.4, 15.5], [4, 24.0, 45.5], [8, 64.6, 82.6]]; const svg = svgBox(box, 480, 200); const out = V.say(box, 'כחול: חציון. אדום: אחוזון 95.');
  D.forEach(([n, m, p], i) => { const g = V.s('g', {}, svg); bar(g, 50 + i * 105, 180 - m * 1.8, 36, m * 1.8, 'var(--c1)'); bar(g, 88 + i * 105, 180 - p * 1.8, 36, p * 1.8, 'var(--c2)'); txt(g, [60 + i * 105, 196], n + ' תהליכונים'); if (n > 2) txt(g, [55 + i * 105, 172 - p * 1.8], 'יותר מגרעינים', { fontSize: '10px', fill: 'var(--c2)' }); g.addEventListener('mouseenter', () => { out.innerHTML = n + ' תהליכונים: חציון ' + m + ', אחוזון 95 ' + p + ' מילישניות.'; }); });
};

/* 3.3 providers */
W.w6_providers = function (box) {
  V.say(box, 'רשימת הספקים מסודרת לפי עדיפות. <b>סמן מה מותקן במכשיר</b> וראה על מה הסשן רץ בפועל — ושהנפילה למעבד שקטה.');
  const P = [['TensorrtExecutionProvider', false], ['CUDAExecutionProvider', false], ['CPUExecutionProvider', true]]; const g = el('div'); box.appendChild(g); const out = mono(box);
  P.forEach((p, i) => { const cb = el('input', { type: 'checkbox' }); cb.checked = p[1]; cb.disabled = i === 2; cb.onchange = () => { p[1] = cb.checked; draw(); }; g.appendChild(el('label', { style: { display: 'block', direction: 'ltr', textAlign: 'left' } }, cb, ' ' + p[0] + (i === 2 ? ' (always)' : ''))); });
  function draw() { const wanted = P.map(p => p[0]); const got = P.filter(p => p[1]).map(p => p[0]); const lines = []; P.forEach(p => { if (!p[1]) lines.push("UserWarning: Specified provider '" + p[0] + "' is not in available provider names."); });
    lines.push('sess.get_providers() → ' + JSON.stringify(got)); lines.push(got[0] === wanted[0] ? 'OK: running on the first choice' : "RuntimeError: running on '" + got[0] + "', not on " + wanted[0] + '  ← check this in code'); out.textContent = lines.join('\n'); }
  draw();
};

/* 4.1 what happens in the build */
W.w6_trt_build = function (box) {
  V.say(box, 'חמשת שלבי בניית המנוע. בשלב 3 המנוע <b>מודד</b> כמה מימושים לכל שכבה על הכרטיס הזה ובוחר את המהיר — ולכן התוצאה קשורה לכרטיס.');
  const svg = svgBox(box, 480, 170); const out = V.say(box); const names = ['קריאת הגרף', 'איחוד', 'בחירת קרנלים', 'בחירת דיוק', 'תכנון זיכרון'];
  const desc = ['פעולה שאינה נתמכת עוצרת את הכול כאן.', 'כמו בפרק 3, אבל אגרסיבי יותר.', 'לכל שכבה עשרות מימושים. מודדים ובוחרים. זו הסיבה שהבנייה לוקחת דקות.', 'אם הרשית חצי דיוק או שמונה ביטים, נבחר לכל שכבה מה שמהיר יותר.', 'טנזורים שלא חיים באותו זמן חולקים זיכרון.'];
  V.stepper(box, 5, s => { svg.innerHTML = ''; names.forEach((n, i) => { bar(svg, 10 + i * 94, 10, 86, 28, i === s ? 'var(--c1)' : i < s ? 'var(--c3)' : 'var(--line2)'); txt(svg, [16 + i * 94, 29], n, { fill: i <= s ? '#fff' : 'var(--ink2)', fontSize: '11px' }); });
    if (s === 2) { const r = rng(3); const ts = [...Array(8)].map(() => 0.4 + r() * 1.2); const b = ts.indexOf(Math.min(...ts)); ts.forEach((t, i) => { bar(svg, 20, 52 + i * 14, t * 200, 10, i === b ? 'var(--c3)' : '#adb5bd'); txt(svg, [30 + t * 200, 61 + i * 14], 'kernel ' + i + ': ' + f(t, 2) + ' ms', { fontSize: '9px' }); }); }
    out.innerHTML = '<b>' + names[s] + '</b>: ' + desc[s]; });
};

/* 4.2 trtexec breakdown */
W.w6_trtexec = function (box) {
  V.say(box, 'הפירוק של כלי שורת הפקודות: העתקה לכרטיס, חישוב, העתקה בחזרה. <b>שנה את סוג הקלט ואת החישוב</b> (תרגיל 4.2: חישוב 3, העתקה 2).');
  let comp = 3, u8 = false, bw = 6; const sr = V.row(box); V.slider(sr, 'חישוב (מילישניות)', 0.5, 15, 0.5, comp, v => { comp = v; draw(); }); V.slider(sr, 'רוחב פס לכרטיס (GB/s)', 1, 25, 0.5, bw, v => { bw = v; draw(); }); V.tabs(box, ['קלט עשרוני 32', 'קלט 8 ביט, נרמול בכרטיס'], i => { u8 = i === 1; draw(); });
  const svg = svgBox(box, 480, 70); const out = V.say(box);
  function draw() { const bytes = 3 * 640 * 640 * (u8 ? 1 : 4); const h2d = bytes / (bw * 1e9) * 1000, d2h = 0.05; svg.innerHTML = ''; const tot = h2d + comp + d2h, sc = 440 / Math.max(tot, 8); let x = 20; [[h2d, 'var(--c5, #e8a33d)', 'H2D'], [comp, 'var(--c1)', 'GPU'], [d2h, 'var(--c2)', 'D2H']].forEach(([t, c, l]) => { bar(svg, x, 15, t * sc, 30, c); if (t * sc > 30) txt(svg, [x + 4, 34], l, { fill: '#fff' }); x += t * sc; });
    out.innerHTML = 'העתקה: ' + ltr(f(bytes / 1e6, 1) + ' MB → ' + f(h2d, 2)) + ' מילישניות, <b>' + f(h2d / tot * 100, 0) + '%</b> מהזמן. ' + (u8 ? 'פי ארבעה פחות נתונים.' : 'נסה לשלוח 8 ביט.'); }
  draw();
};

/* 4.3 profile shapes */
W.w6_profile_shapes = function (box) {
  V.say(box, 'פרופיל צורות: מינימום, מיטבי ומקסימום של ממד האצווה. המנוע מכוון קרנלים למיטבי ומקצה זיכרון למקסימום. <b>שנה את הטווח</b> (תרגיל 4.1).');
  let mn = 1, op = 1, mx = 2; const sr = V.row(box); V.slider(sr, 'min', 1, 32, 1, mn, v => { mn = v; draw(); }); V.slider(sr, 'opt', 1, 32, 1, op, v => { op = v; draw(); }); V.slider(sr, 'max', 1, 32, 1, mx, v => { mx = v; draw(); }); const out = mono(box);
  function draw() { const bad = !(mn <= op && op <= mx); const mem = mx * 3 * 640 * 640 * 4 / 1e6 * 6; out.textContent = '--minShapes=images:' + mn + 'x3x640x640 --optShapes=images:' + op + 'x3x640x640 --maxShapes=images:' + mx + 'x3x640x640\n' + (bad ? 'ERROR: need min ≤ opt ≤ max' : 'activation memory reserved ≈ ' + f(mem, 0) + ' MB (grows with max)\nkernels tuned for batch ' + op + (op !== 1 ? ' — a single camera mostly sends batch 1' : '')); }
  draw();
};

/* 4.4 engine cache */
W.w6_trt_cache = function (box) {
  V.say(box, 'סביבת הריצה בונה את המנוע בעצמה ושומרת במטמון. <b>לחץ "הפעל"</b> כמה פעמים.');
  let runs = 0; const out = mono(box); V.btns(box, [['הפעל את התוכנית', () => { runs++; draw(); }, 'primary'], ['מחק את trt_cache', () => { runs = 0; draw(); }, 'ghost']]);
  function draw() { out.textContent = runs === 0 ? 'trt_cache/ (empty)' : runs === 1 ? 'session start: building engine … 94 s\ntrt_cache/ model_ctx.engine (new)\nfirst inference: slow, then fast' : 'session start: loading engine from trt_cache … 1.2 s\ninference: fast from the first frame'; }
  draw();
};

/* 4.5 two ways to int8 */
W.w6_int8_paths = function (box) {
  V.say(box, 'שתי דרכים לשמונה ביטים במנוע. <b>בחר דרך</b>.');
  const out = V.say(box); V.tabs(box, ['סט כיול', 'גרף עם צמתי כימום (Q/DQ)'], i => { out.innerHTML = ['נותנים למנוע מאות תמונות מהשטח, והוא מחשב טווחים בעצמו (למשל בשיטת האנטרופיה). פשוט, אבל פחות שליטה על אילו שכבות יורדות לשמונה ביטים.', 'הגרף כבר מכיל QuantizeLinear ו־DequantizeLinear עם סקאלות (נבנה בפרק 6). המנוע מחליף כל תבנית בקרנל שלם. <b>הדרך המומלצת בגרסאות האחרונות</b>: שליטה מלאה, ואותו קובץ מתאים גם לאימון מודע כימום.'][i]; });
  out.innerHTML = 'בחר דרך.';
};
})();
