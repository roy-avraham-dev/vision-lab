/* Module 0 widgets — chapters 10–12: Bayes & losses, convolution, logistic regression project */
(function () {
const W = window.W, V = window.V, el = V.el;
const hr = box => box.appendChild(el('hr', { style: { border: 0, borderTop: '1px dashed var(--line2)' } }));

/* ===== chapter 10 ===== */
W.w_cond = function (box) {
  V.say(box, 'P(A | B) פירושו: <b>מסתכלים רק על המקרים שבהם B קרה</b>, וסופרים כמה מהם הם A. לחץ על התנאי, והעולם "מצטמצם".');
  const rnd = V.rng(5); const pts = [...Array(100)].map(() => { const intr = rnd() < 0.2; const alarm = intr ? rnd() < 0.9 : rnd() < 0.25; return { intr, alarm }; });
  let mode = 0;
  V.tabs(box, ['כל הפריימים', 'בהינתן פולש', 'בהינתן התראה'], i => { mode = i; draw(); });
  const grid = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(20, 1fr)', gap: '3px', maxWidth: '480px', margin: '8px auto', direction: 'ltr' } }); box.appendChild(grid);
  V.legend(box, [['var(--c2)', 'פולש'], ['var(--line2)', 'שקט'], ['transparent;border:2px solid var(--c1)', 'התראה']]);
  const out = V.say(box);
  function draw() {
    grid.innerHTML = '';
    pts.forEach(p => { const vis = mode === 0 || (mode === 1 && p.intr) || (mode === 2 && p.alarm); grid.appendChild(el('div', { style: { aspectRatio: 1, borderRadius: '50%', background: p.intr ? 'var(--c2)' : 'var(--line2)', outline: p.alarm ? '2px solid var(--c1)' : '', opacity: vis ? 1 : 0.08, transition: 'opacity .3s' } })); });
    const I = pts.filter(p => p.intr), A = pts.filter(p => p.alarm), both = pts.filter(p => p.intr && p.alarm);
    out.innerHTML = mode === 0 ? '100 פריימים.' : mode === 1 ? `מתוך ${I.length} פריימים עם פולש, ${both.length} עם התראה: P(התראה | פולש) = <b>${V.fmt(both.length / I.length * 100, 0)}%</b>` : `מתוך ${A.length} התראות, ${both.length} עם פולש אמיתי: P(פולש | התראה) = <b>${V.fmt(both.length / A.length * 100, 0)}%</b>. שונה לגמרי מהקודם! הסדר חשוב.`;
  }
  draw();
};

W.w_bayes = function (box) {
  V.say(box, 'דוגמת האבטחה מהטקסט, עם 10,000 פריימים. שנה את שלושת המספרים ותראה כמה מההתראות באמת אמיתיות. הנקודות האדומות הן פולשים, והמסגרות הן התראות.');
  let prior = 1, sens = 90, fa = 5;
  const r = V.row(box); V.slider(r, 'פולשים (%)', 0.5, 20, 0.5, prior, v => { prior = v; draw(); }); V.slider(r, 'מזהה פולש (%)', 50, 100, 1, sens, v => { sens = v; draw(); }); V.slider(r, 'התראות שווא (%)', 0, 20, 0.5, fa, v => { fa = v; draw(); });
  const cv = V.canvas(box, 400, 250, 1); cv.style.width = '400px'; cv.style.display = 'block'; cv.style.margin = '6px auto';
  const out = V.say(box);
  function draw() {
    const N = 10000, I = Math.round(N * prior / 100), TP = Math.round(I * sens / 100), FP = Math.round((N - I) * fa / 100);
    const ctx = cv.getContext('2d'); ctx.clearRect(0, 0, 400, 250);
    // 10,000 cells: 100 x 100 at 4x2.5 px
    let k = 0; const cells = [];
    for (let i = 0; i < N; i++) cells.push(i < TP ? 'tp' : i < I ? 'fn' : i < I + FP ? 'fp' : 'tn');
    cells.forEach((c, i) => { const x = (i % 100) * 4, y = Math.floor(i / 100) * 2.5; ctx.fillStyle = c === 'tp' ? '#e03131' : c === 'fn' ? '#ffa8a8' : c === 'fp' ? '#3d5afe' : '#e6e1d6'; ctx.fillRect(x, y, 3.4, 2); });
    const post = TP / (TP + FP || 1);
    out.innerHTML = `<span style="color:#e03131">■</span> ${TP} התראות אמיתיות, <span style="color:#3d5afe">■</span> ${FP} התראות שווא. מתוך ${TP + FP} התראות, רק ${TP} אמיתיות: <b>${V.fmt(post * 100, 1)}%</b>` + (prior === 1 && sens === 90 && fa === 5 ? ' ← 90 מתוך 585 ≈ 15%, כמו בטקסט.' : '') + (prior === 1 && sens === 90 && fa === 1 ? ' ← תרגיל 10.1: 90/189 ≈ 48%.' : '');
  }
  draw();
};

W.w_mle = function (box) {
  V.say(box, 'הטלת מטבע 10 פעמים ויצאו 7 עץ. איזה p (הסיכוי לעץ) הכי מסביר את מה שראית? הזז את p וצפה בסבירות. השיא הוא הסבירות המרבית. למטה: מינוס הלוגריתם, וזו בדיוק פונקציית הפסד, ומחפשים לה מינימום.');
  let p = 0.5, h = 7, n = 10;
  const r = V.row(box); V.slider(r, 'p', 0.01, 0.99, 0.01, p, v => { p = v; draw(); }); V.slider(r, 'כמה עץ מתוך 10', 0, 10, 1, h, v => { h = v; draw(); });
  const rr = V.row(box); rr.style.justifyContent = 'center';
  const P1 = V.plane(rr, { w: 300, h: 200, x: [0, 1], y: [0, 1.05], grid: false }), P2 = V.plane(rr, { w: 300, h: 200, x: [0, 1], y: [0, 8], grid: false });
  const out = V.say(box);
  function draw() {
    const Lk = q => q ** h * (1 - q) ** (n - h), mx = Lk(h / n) || 1;
    P1.clear(); P2.clear(); P1.fn(q => Lk(q) / mx, 'var(--c1)', 3); P2.fn(q => -Math.log(Lk(q) + 1e-12), 'var(--c2)', 3, 200, 0.01, 0.99);
    P1.dot(p, Lk(p) / mx, 6, 'var(--ink)'); P2.dot(p, Math.min(8, -Math.log(Lk(p))), 6, 'var(--ink)');
    P1.text(0.15, 0.95, 'סבירות', 'var(--c1)', 12); P2.text(0.2, 7.3, '−log סבירות = הפסד', 'var(--c2)', 12);
    out.innerHTML = 'הסבירות המרבית ב־p = <b>' + V.fmt(h / n) + '</b>, וזה בדיוק המקום שבו ההפסד מינימלי.';
  }
  draw();
};

W.w_softmax = function (box) {
  V.say(box, 'הרשת מוציאה "ציונים" גולמיים. סופטמקס הופך אותם להסתברויות: מעלים את e בחזקת כל ציון (הכול נעשה חיובי), ומחלקים בסכום (הכול מסתכם ל־1). הזז את הציונים.');
  let z = [2, 1, 0.1]; const names = ['רכב', 'אדם', 'רקע'];
  const r = V.row(box); z.forEach((v, i) => V.slider(r, 'ציון ' + names[i], -3, 10, 0.1, v, x => { z[i] = x; draw(); }));
  const t = el('table', { class: 't', style: { margin: '8px auto' } }); box.appendChild(t);
  const bars = el('div'); box.appendChild(bars);
  function draw() {
    const m = Math.max(...z), e = z.map(v => Math.exp(v - m)), s = e.reduce((a, b) => a + b), p = e.map(v => v / s);
    t.innerHTML = '<tr><th></th>' + names.map(n => '<th>' + n + '</th>').join('') + '<th>סכום</th></tr>' +
      '<tr><td>ציון z</td>' + z.map(v => '<td>' + V.fmt(v, 1) + '</td>').join('') + '<td></td></tr>' +
      '<tr><td>e^(z − max)</td>' + e.map(v => '<td>' + V.fmt(v, 3) + '</td>').join('') + '<td>' + V.fmt(s, 3) + '</td></tr>' +
      '<tr><td><b>הסתברות</b></td>' + p.map(v => '<td><b>' + V.fmt(v, 3) + '</b></td>').join('') + '<td>1</td></tr>';
    bars.innerHTML = p.map((v, i) => `<div style="display:flex;align-items:center;gap:8px;margin:4px 0"><span style="width:50px">${names[i]}</span><div style="flex:1;background:var(--line);border-radius:7px"><div class="bar" style="width:${v * 100}%;background:${['var(--c1)', 'var(--c3)', 'var(--c5)'][i]}"></div></div><span class="mono" style="width:54px">${V.fmt(v * 100, 1)}%</span></div>`).join('');
  }
  draw();
};

W.w_ce = function (box) {
  V.say(box, 'אנטרופיה צולבת: הקנס הוא מינוס הלוגריתם של ההסתברות שהמודל נתן <b>לתשובה הנכונה</b>. הזז את ההסתברות: כשהמודל בטוח וצודק הקנס כמעט אפס, וכשהוא בטוח וטועה הקנס עצום.');
  let p = 0.7;
  V.slider(V.row(box), 'ההסתברות לתשובה הנכונה', 0.01, 0.99, 0.01, p, v => { p = v; draw(); });
  const P = V.plane(box, { w: 460, h: 260, x: [0, 1], y: [0, 5], grid: false }); const out = V.say(box);
  function draw() { P.clear(); P.fn(q => -Math.log(q), 'var(--c2)', 3, 200, 0.005, 1); P.dot(p, -Math.log(p), 7, 'var(--ink)'); P.line(p, 0, p, -Math.log(p), 'var(--c2)', 1.5, '3 3'); out.innerHTML = 'L = −log(' + V.fmt(p) + ') = <b>' + V.fmt(-Math.log(p), 3) + '</b>' + (p > 0.95 ? ' כמעט אפס: מושלם.' : p < 0.1 ? ' קנס ענק: בטוח וטועה.' : ''); }
  draw();
};

W.w_focal = function (box) {
  V.say(box, 'הפסד מומקד מכפיל את האנטרופיה הצולבת ב־(1 − p)^γ. דוגמאות קלות (p גבוה) כמעט נעלמות, והאימון מתרכז בקשות. הזז את γ.');
  let g = 2;
  V.slider(V.row(box), 'γ', 0, 5, 0.5, g, v => { g = v; draw(); });
  const P = V.plane(box, { w: 460, h: 260, x: [0, 1], y: [0, 3], grid: false }); const t = el('table', { class: 't', style: { margin: '8px auto' } }); box.appendChild(t);
  V.legend(box, [['var(--c2)', 'אנטרופיה צולבת רגילה'], ['var(--c1)', 'הפסד מומקד']]);
  function draw() {
    P.clear(); P.fn(q => -Math.log(q), 'var(--c2)', 2, 200, 0.01, 1); P.fn(q => -((1 - q) ** g) * Math.log(q), 'var(--c1)', 3, 200, 0.01, 1);
    t.innerHTML = '<tr><th>p</th><th>רגיל</th><th>מומקד</th><th>ירידה</th></tr>' + [0.5, 0.7, 0.9, 0.99].map(q => { const a = -Math.log(q), b = -((1 - q) ** g) * Math.log(q); return `<tr><td>${q}</td><td>${V.fmt(a, 3)}</td><td>${b < 0.001 ? b.toExponential(0) : V.fmt(b, 3)}</td><td>פי ${V.fmt(a / b, 0)}</td></tr>`; }).join('');
  }
  draw();
};

W.x10_2 = function (box) { V.ask(box, 'סופטמקס של (1, 1, 1): מה ההסתברות של כל מחלקה? ומה ההפסד (−log) אם הנכונה היא הראשונה? (שני מספרים)', s => { const n = V.nums(s); return (Math.abs(n[0] - 0.333) < 0.01 || Math.abs(n[0] - 33.3) < 0.2) && Math.abs(n[1] - 1.1) < 0.02; }, '⅓ לכל אחת, וההפסד ln 3 ≈ 1.10'); };

/* ===== chapter 11 ===== */
W.w_conv1d = function (box) {
  V.say(box, 'הגרעין "מחליק" על השורה. בכל עצירה: מכפילים זוג־זוג, מסכמים, וכותבים תוצאה אחת. בחר דוגמה או כתוב משלך.');
  const ex = { 'טשטוש [0,0,9,0,0] עם [⅓,⅓,⅓]': [[0, 0, 9, 0, 0], [1 / 3, 1 / 3, 1 / 3]], 'קצה [3,3,3,9,9,9] עם [−1,0,1]': [[3, 3, 3, 9, 9, 9], [-1, 0, 1]], 'תרגיל 11.1: [1..5] עם [1,0,−1]': [[1, 2, 3, 4, 5], [1, 0, -1]] };
  let sig, k, sp;
  V.tabs(box, Object.keys(ex), (i, l) => { [sig, k] = ex[l]; build(); }, 1);
  const stage = el('div', { style: { direction: 'ltr', textAlign: 'center' } }); box.appendChild(stage);
  const calc = el('div', { class: 'mono', style: { textAlign: 'center', direction: 'ltr', minHeight: '26px' } }); box.appendChild(calc);
  const ctrl = el('div'); box.appendChild(ctrl);
  function build() {
    stage.innerHTML = ''; ctrl.innerHTML = '';
    const n = sig.length - k.length + 1; const out = [...Array(n)].map((_, i) => k.reduce((s, w, j) => s + w * sig[i + j], 0));
    const l1 = V.ltrRow(stage); const S = V.matrix(l1, [sig]);
    const l2 = V.ltrRow(stage); const kr = el('div', { style: { display: 'flex', gap: '4px', transition: 'transform .35s' } }); l2.appendChild(kr); const K = V.matrix(kr, [k], { fmt: v => Math.abs(v - 1 / 3) < 1e-9 ? '⅓' : V.fmt(v) });
    const l3 = V.ltrRow(stage); const O = V.matrix(l3, [out.map(() => '')], { fmt: v => v === '' ? '' : V.fmt(v, 2) });
    sp = V.stepper(ctrl, n + 1, s => {
      if (!s) { S.cls(() => ''); O.vals([out.map(() => '')]); O.cls(() => ''); kr.style.transform = 'translateX(0)'; calc.textContent = ''; return; }
      const i = s - 1; const cw = S.cells[0][1].getBoundingClientRect().left - S.cells[0][0].getBoundingClientRect().left || 44;
      kr.style.transform = `translateX(${i * cw - (sig.length - k.length) * cw / 2}px)`;
      S.cls((r, c) => c >= i && c < i + k.length ? 'on' : '');
      O.vals([out.map((v, j) => j <= i ? v : '')]); O.cls((r, c) => c === i ? 'ok' : c < i ? 'soft' : '');
      calc.textContent = k.map((w, j) => (Math.abs(w - 1 / 3) < 1e-9 ? '⅓' : V.fmt(w)) + '·' + sig[i + j]).join(' + ') + ' = ' + V.fmt(out[i], 2);
    }, { speed: 1100 });
    setTimeout(() => sp.go(0), 30);
  }
  [sig, k] = ex['קצה [3,3,3,9,9,9] עם [−1,0,1]']; build();
};

W.w_conv2d = function (box) {
  V.say(box, 'החלון של 3×3 מחליק על תמונה של 5×5, שורה אחר שורה. בכל עצירה: 9 מכפלות, סכום אחד. הגרעין כאן הוא גלאי קצה אנכי.');
  const img = [[10, 10, 10, 80, 80], [10, 10, 10, 80, 80], [10, 10, 10, 80, 80], [10, 10, 10, 80, 80], [10, 10, 10, 80, 80]];
  const k = [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]];
  const out = [0, 1, 2].map(y => [0, 1, 2].map(x => k.reduce((s, r, i) => s + r.reduce((t, w, j) => t + w * img[y + i][x + j], 0), 0)));
  const st = V.ltrRow(box); const I = V.matrix(st, img); V.op(st, '⊛'); const K = V.matrix(st, k); V.op(st, '='); const O = V.matrix(st, [['', '', ''], ['', '', ''], ['', '', '']], { fmt: v => v === '' ? '' : V.fmt(v) });
  I.cells.forEach((r, y) => r.forEach((c, x) => { c.style.background = `rgb(${img[y][x] * 2.5},${img[y][x] * 2.5},${img[y][x] * 2.5})`; c.style.color = img[y][x] > 50 ? '#000' : '#fff'; }));
  const calc = el('div', { class: 'mono note-small', style: { textAlign: 'center', direction: 'ltr' } }); box.appendChild(calc);
  V.stepper(box, 10, s => {
    I.cells.forEach((r, y) => r.forEach((c, x) => { c.style.outline = ''; }));
    if (!s) { O.vals([['', '', ''], ['', '', ''], ['', '', '']]); O.cls(() => ''); calc.textContent = ''; return; }
    const i = s - 1, y = Math.floor(i / 3), x = i % 3;
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) I.cells[y + a][x + b].style.outline = '3px solid var(--c2)';
    O.vals(out.map((r, yy) => r.map((v, xx) => yy * 3 + xx <= i ? v : ''))); O.cls((r, c) => r * 3 + c === i ? 'ok' : '');
    calc.textContent = 'out[' + y + ',' + x + '] = Σ window · kernel = ' + out[y][x];
  }, { speed: 1000 });
};

W.w_kernels = function (box) {
  V.say(box, 'קטלוג גרעינים על תמונה אמיתית. בחר גרעין או ערוך את 9 המספרים בעצמך, ותראה מה הוא עושה. אפשר גם להעלות תמונה משלך.');
  const kers = { 'טשטוש ממוצע': [[1, 1, 1], [1, 1, 1], [1, 1, 1]].map(r => r.map(v => v / 9)), 'גאוסיאני': [[1, 2, 1], [2, 4, 2], [1, 2, 1]].map(r => r.map(v => v / 16)), 'חידוד': [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], 'סובל אנכי': [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], 'סובל אופקי': [[-1, -2, -1], [0, 0, 0], [1, 2, 1]], 'זהות': [[0, 0, 0], [0, 1, 0], [0, 0, 0]] };
  let K = kers['גאוסיאני']; let G = V.scene(120, 90);
  V.tabs(box, Object.keys(kers), (i, l) => { K = kers[l].map(r => r.slice()); sync(); draw(); }, 1);
  const r = V.row(box); r.style.direction = 'ltr'; r.style.justifyContent = 'center'; r.style.alignItems = 'center';
  const c1 = V.canvas(r, 120, 90, 2.6); const ins = []; const kg = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 56px)', gap: '4px' } });
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const inp = el('input', { type: 'number', step: 0.1, style: { width: '56px', textAlign: 'center' } }); inp.oninput = () => { K[i][j] = +inp.value || 0; draw(); }; ins.push(inp); kg.appendChild(inp); }
  r.appendChild(kg); const c2 = V.canvas(r, 120, 90, 2.6);
  const up = el('input', { type: 'file', accept: 'image/*' }); V.row(box).append(el('span', { class: 'note-small' }, 'תמונה משלך: '), up);
  up.onchange = e => { const f = e.target.files[0]; if (!f) return; const im = new Image(); im.onload = () => { const cv = document.createElement('canvas'); cv.width = 120; cv.height = 90; const ctx = cv.getContext('2d'); ctx.drawImage(im, 0, 0, 120, 90); const d = ctx.getImageData(0, 0, 120, 90).data; G = [...Array(90)].map((_, y) => [...Array(120)].map((_, x) => { const i = (y * 120 + x) * 4; return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; })); draw(); }; im.src = URL.createObjectURL(f); };
  function sync() { ins.forEach((inp, i) => inp.value = V.fmt(K[Math.floor(i / 3)][i % 3], 3).replace('−', '-')); }
  function draw() { V.drawGray(c1, G); const sum = K.flat().reduce((a, b) => a + b); const O = V.conv(G, K); V.drawGray(c2, O.map(r => r.map(v => Math.abs(sum) < 1e-9 ? 128 + v : v))); }
  sync(); draw();
};

W.w_padstride = function (box) {
  V.say(box, 'הנוסחה לגודל הפלט, בציור. כל קופסה צבעונית היא מיקום אחד של הגרעין. ריפוד מוסיף משבצות אפורות בקצוות, וצעד קובע כמה זזים בכל פעם.');
  let n = 7, k = 3, p = 0, s = 1;
  const r = V.row(box); V.slider(r, 'קלט n', 3, 14, 1, n, v => { n = v; draw(); }); V.slider(r, 'גרעין k', 1, 7, 2, k, v => { k = v; draw(); }); V.slider(r, 'ריפוד p', 0, 3, 1, p, v => { p = v; draw(); }); V.slider(r, 'צעד s', 1, 4, 1, s, v => { s = v; draw(); });
  const svg = V.s('svg', { viewBox: '0 0 640 170', width: 640 }); const w = el('div', { style: { display: 'flex', justifyContent: 'center', direction: 'ltr' } }); w.appendChild(svg); box.appendChild(w);
  const out = V.say(box);
  function draw() {
    svg.innerHTML = ''; const tot = n + 2 * p, cw = Math.min(40, 600 / tot), x0 = (640 - tot * cw) / 2;
    for (let i = 0; i < tot; i++) V.s('rect', { x: x0 + i * cw, y: 20, width: cw - 3, height: 30, rx: 4, style: { fill: i < p || i >= p + n ? 'var(--line2)' : 'var(--accent-bg)', stroke: 'var(--line2)' } }, svg);
    const outN = Math.floor((n + 2 * p - k) / s) + 1; const cols = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)'];
    for (let j = 0; j < Math.max(0, outN); j++) { const y = 62 + (j % 4) * 18; V.s('rect', { x: x0 + j * s * cw, y, width: k * cw - 3, height: 12, rx: 3, style: { fill: cols[j % 6], fillOpacity: .55 } }, svg); }
    out.innerHTML = '<span class="mono" style="direction:ltr;display:inline-block">out = ⌊(n + 2p − k) / s⌋ + 1 = ⌊(' + n + ' + ' + 2 * p + ' − ' + k + ') / ' + s + '⌋ + 1 = <b>' + Math.max(0, outN) + '</b></span>' + (p === (k - 1) / 2 && s === 1 ? ' ← ריפוד (k−1)/2 עם צעד 1 שומר על הגודל.' : '');
  }
  draw();
};

W.w_median = function (box) {
  V.say(box, 'החלון סביב פיקסל, עם פיקסל פגום אחד (255). לחץ על <b>ממוצע</b> או על <b>חציון</b>.');
  const vals = [10, 12, 11, 255, 10, 13, 12, 11, 10];
  const st = V.ltrRow(box); const M = V.matrix(st, [vals.slice(0, 3), vals.slice(3, 6), vals.slice(6)]); M.set(1, 0, undefined, 'warn');
  const line = el('div', { style: { display: 'flex', gap: '4px', justifyContent: 'center', direction: 'ltr', minHeight: '44px', margin: '8px 0' } }); box.appendChild(line);
  const out = V.say(box);
  V.btns(box, [['ממוצע', () => { line.innerHTML = ''; out.innerHTML = '(' + vals.join(' + ') + ') / 9 = 344 / 9 ≈ <b>38</b>. הפיקסל הפגום משך את כל הסביבה למעלה, והרעש נמרח.'; }, 'primary'], ['חציון', () => {
    const s = vals.slice().sort((a, b) => a - b); line.innerHTML = ''; s.forEach((v, i) => line.appendChild(el('div', { class: 'cell' + (i === 4 ? ' on' : v === 255 ? ' warn' : ''), style: { transition: 'all .3s', transitionDelay: (i * 0.06) + 's' } }, String(v))));
    out.innerHTML = 'ממיינים, ולוקחים את האמצעי: <b>11</b>. ה־255 נדחק לקצה, והערך הקיצוני פשוט נעלם.'; }, 'primary']]);
  hr(box);
  V.say(box, 'ועל תמונה: רעש "מלח ופלפל" (2% מהפיקסלים), ניקוי בממוצע 3×3 מול חציון 3×3.');
  const r = V.row(box); r.style.direction = 'ltr'; r.style.justifyContent = 'center';
  const N = V.addNoise(V.scene(96, 72), 'sp', 0.04);
  const mk = (t, G) => { const c = el('div', { style: { textAlign: 'center' } }); const cv = V.canvas(c, 96, 72, 2.2); V.drawGray(cv, G); c.appendChild(el('div', { class: 'note-small' }, t)); r.appendChild(c); };
  mk('רועש', N); mk('ממוצע 3×3', V.conv(N, [[1, 1, 1], [1, 1, 1], [1, 1, 1]].map(r => r.map(v => v / 9)))); mk('חציון 3×3', V.median(N, 3));
};

W.w_freq = function (box) {
  V.say(box, 'אות = גל איטי (צורה) + גל מהיר (פרטים ורעש). <b>טשטוש</b> (ממוצע על חלון) מוחק את המהיר ומשאיר את האיטי. <b>גילוי קצוות</b> (הפרש) עושה את ההפך. הגדל את החלון.');
  let w = 5;
  V.slider(V.row(box), 'רוחב חלון הטשטוש', 1, 21, 2, w, v => { w = v; draw(); });
  const P = V.plane(box, { w: 520, h: 300, x: [0, 100], y: [-4.5, 3], grid: false });
  V.legend(box, [['var(--ink3)', 'האות המקורי'], ['var(--c1)', 'אחרי טשטוש (מעביר נמוכים)'], ['var(--c2)', 'הפרש בין שכנים (מעביר גבוהים)']]);
  const sig = [...Array(101)].map((_, i) => Math.sin(i / 100 * 2 * Math.PI * 1.5) * 1.5 + Math.sin(i * 1.7) * 0.5);
  function draw() {
    P.clear(); const h = Math.floor(w / 2);
    const bl = sig.map((_, i) => { let s = 0, c = 0; for (let j = i - h; j <= i + h; j++) if (j >= 0 && j < sig.length) { s += sig[j]; c++; } return s / c; });
    const hi = sig.map((v, i) => i ? (v - sig[i - 1]) : 0);
    P.path(sig.map((v, i) => [i, v]), 'var(--ink3)', 1.5); P.path(bl.map((v, i) => [i, v]), 'var(--c1)', 3); P.path(hi.map((v, i) => [i, v * 1.2 - 3.3]), 'var(--c2)', 2);
  }
  draw();
};

W.w_cnn = function (box) {
  V.say(box, 'למה קונבולוציה ולא שכבה רגילה? שכבה רגילה שמחברת תמונה 224×224 לתמונה באותו גודל צריכה משקל לכל זוג פיקסלים. גרעין 3×3 משתמש באותם 9 משקלות בכל מקום.');
  const dense = 224 * 224 * 224 * 224, conv = 9;
  const bars = el('div', { style: { direction: 'ltr' } }); box.appendChild(bars);
  bars.innerHTML = `<div style="margin:6px 0">שכבה רגילה: <b class="mono">${dense.toLocaleString('en')}</b> משקלות (כ־2.5 מיליארד)</div><div class="bar" style="width:100%;background:var(--c2)"></div><div style="margin:10px 0 6px">גרעין 3×3: <b class="mono">9</b> משקלות</div><div class="bar" style="width:3px;background:var(--c3)"></div><div class="note-small" style="margin-top:6px">(הפס הירוק באמת כל כך קטן: היחס הוא בערך 1 ל־280 מיליון.)</div>`;
  hr(box);
  V.say(box, 'ברשת קונבולוציה יש הרבה גרעינים, וכל אחד מוציא "מפת מאפיינים" משלו. כאן ארבעה גרעינים על אותה תמונה. ברשת אמיתית המשקלות האלה <b>נלמדים</b> (מודול 2).');
  const r = V.row(box); r.style.direction = 'ltr'; r.style.justifyContent = 'center';
  const G = V.scene(96, 72);
  [['קצה אנכי', [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]], ['קצה אופקי', [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]], ['אלכסון', [[0, 1, 2], [-1, 0, 1], [-2, -1, 0]]], ['טשטוש', [[1, 2, 1], [2, 4, 2], [1, 2, 1]].map(r => r.map(v => v / 16))]].forEach(([t, k]) => { const c = el('div', { style: { textAlign: 'center' } }); const cv = V.canvas(c, 96, 72, 1.6); const O = V.conv(G, k); const sum = k.flat().reduce((a, b) => a + b); V.drawGray(cv, O.map(r => r.map(v => Math.abs(sum) < 1e-9 ? Math.min(255, Math.abs(v) * 1.5) : v))); c.appendChild(el('div', { class: 'note-small' }, t)); r.appendChild(c); });
};

W.x11_1 = function (box) { V.ask(box, 'הקונבולוציה של [1, 2, 3, 4, 5] עם [1, 0, −1], בלי ריפוד:', s => { const n = V.nums(s.replace(/−/g, '-')); return n.length === 3 && n.every(v => v === -2); }, '[−2, −2, −2]: השיפוע קבוע, ולכן הפלט קבוע.'); };
W.x11_2 = function (box) { [['קלט 32, גרעין 5, בלי ריפוד, צעד 1', 28], ['קלט 64, גרעין 3, ריפוד 1, צעד 2', 32], ['קלט 640, גרעין 7, ריפוד 3, צעד 2', 320]].forEach(([q, a]) => V.ask(box, q + ':', s => V.nums(s)[0] === a, 'נכון: ' + a)); };

/* ===== chapter 12: logistic regression ===== */
function makeData(c0, c1, n = 100, seed = 1) {
  const rnd = V.rng(seed); const g = () => { let u = 0, v = 0; while (!u) u = rnd(); v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const X = [], y = []; for (let i = 0; i < n; i++) { X.push([g() + c0[0], g() + c0[1]]); y.push(0); X.push([g() + c1[0], g() + c1[1]]); y.push(1); }
  return { X, y };
}
const sig = z => 1 / (1 + Math.exp(-z));

W.w_neuron2d = function (box) {
  V.say(box, 'המודל: z = w · x + b, ואז p = σ(z). <b>גרור את החץ w</b> (הכיוון שבו p עולה) ואת b. הקו השחור הוא z = 0, שם p = 0.5. הרקע מראה את ההסתברות למחלקה 1.');
  let w = [1, 0.5], b = 0;
  const P = V.plane(box, { w: 420, h: 380, x: [-5, 5], y: [-4.5, 4.5] });
  const img = V.s('image', { x: 0, y: 0, width: 420, height: 380, preserveAspectRatio: 'none' }); P.svg.insertBefore(img, P.svg.firstChild);
  V.slider(V.row(box), 'b (הטיה)', -4, 4, 0.1, b, v => { b = v; draw(); });
  const out = V.say(box);
  const D = makeData([-2, -1], [2, 1.5], 60, 3);
  function draw() {
    const cv = document.createElement('canvas'); cv.width = 84; cv.height = 76; const ctx = cv.getContext('2d'); const im = ctx.createImageData(84, 76);
    for (let j = 0; j < 76; j++) for (let i = 0; i < 84; i++) { const x = -5 + i / 83 * 10, y = 4.5 - j / 75 * 9; const p = sig(w[0] * x + w[1] * y + b); const k = (j * 84 + i) * 4; im.data[k] = 255 * (1 - p) * 0.9 + 60 * p; im.data[k + 1] = 140 + 40 * p; im.data[k + 2] = 120 + 135 * p; im.data[k + 3] = 90; }
    ctx.putImageData(im, 0, 0); img.setAttribute('href', cv.toDataURL());
    P.clear(); D.X.forEach((x, i) => P.dot(x[0], x[1], 3.5, D.y[i] ? 'var(--c1)' : 'var(--c2)'));
    if (Math.abs(w[1]) > 1e-6) P.fn(x => -(w[0] * x + b) / w[1], 'var(--ink)', 2.5); else if (Math.abs(w[0]) > 1e-6) P.line(-b / w[0], -5, -b / w[0], 5, 'var(--ink)', 2.5);
    P.arrow(0, 0, w[0], w[1], 'var(--c4)', 3.5, 'w');
    const acc = D.X.reduce((s, x, i) => s + ((sig(w[0] * x[0] + w[1] * x[1] + b) > 0.5) === !!D.y[i] ? 1 : 0), 0) / D.X.length;
    out.innerHTML = 'w = (' + V.fmt(w[0]) + ', ' + V.fmt(w[1]) + '), b = ' + V.fmt(b) + ' &nbsp; דיוק: <b>' + V.fmt(acc * 100, 0) + '%</b>. כחול = מחלקה 1, כתום = מחלקה 0.';
  }
  P.handle(w[0], w[1], 'var(--c4)', (x, y) => { w = [x, y]; draw(); }, { snap: 0.1 });
  draw();
};

W.w_logreg = function (box) {
  V.say(box, '<b>הפרויקט, חי.</b> לחץ ▶ ותראה את המודל לומד: קו ההפרדה זז, ההפסד יורד. גרור את מרכזי העננים כדי לשנות את הבעיה (תרגיל 12.2), ושנה את קצב הלמידה.');
  let c0 = [-2, -1], c1 = [2, 1.5], lr = 0.1, w = [0, 0], b = 0, hist = [], timer = null, D, it = 0;
  const r = V.row(box); r.style.justifyContent = 'center'; r.style.alignItems = 'flex-start';
  const P = V.plane(r, { w: 400, h: 360, x: [-5, 5], y: [-4.5, 4.5] });
  const P2 = V.plane(r, { w: 260, h: 200, x: [0, 300], y: [0, 0.8], grid: false });
  const rr = V.row(box); V.slider(rr, 'קצב למידה η', 0.01, 1, 0.01, lr, v => { lr = v; });
  const out = V.say(box);
  const playB = V.button('▶ אמן', () => toggle(), 'primary');
  V.row(box).append(playB, V.button('צעד אחד', () => { step(); draw(); }), V.button('↺ אפס משקלות', () => { w = [0, 0]; b = 0; hist = []; it = 0; draw(); }), V.button('נתונים חדשים', () => { D = makeData(c0, c1, 100, Math.floor(Math.random() * 1e6)); hist = []; it = 0; w = [0, 0]; b = 0; draw(); }));
  function norm() { const m = [0, 1].map(k => D.X.reduce((s, x) => s + x[k], 0) / D.X.length); const s = [0, 1].map(k => Math.sqrt(D.X.reduce((a, x) => a + (x[k] - m[k]) ** 2, 0) / D.X.length)); return { m, s }; }
  function step() {
    const { m, s } = norm(); const n = D.X.length; let gw = [0, 0], gb = 0, L = 0;
    D.X.forEach((x, i) => { const xn = [(x[0] - m[0]) / s[0], (x[1] - m[1]) / s[1]]; const p = sig(w[0] * xn[0] + w[1] * xn[1] + b); const e = p - D.y[i]; gw[0] += e * xn[0]; gw[1] += e * xn[1]; gb += e; L += -(D.y[i] * Math.log(p + 1e-12) + (1 - D.y[i]) * Math.log(1 - p + 1e-12)); });
    w = [w[0] - lr * gw[0] / n, w[1] - lr * gw[1] / n]; b -= lr * gb / n; hist.push(L / n); it++;
  }
  function draw() {
    const { m, s } = norm();
    P.clear(); D.X.forEach((x, i) => P.dot(x[0], x[1], 3.2, D.y[i] ? 'var(--c1)' : 'var(--c2)'));
    // boundary in original coordinates: w0(x-m0)/s0 + w1(y-m1)/s1 + b = 0
    if (Math.abs(w[1]) > 1e-9) P.fn(x => m[1] - s[1] * (w[0] * (x - m[0]) / s[0] + b) / w[1], 'var(--ink)', 2.5);
    P2.clear(); P2.path(hist.slice(-300).map((v, i) => [i, Math.min(0.8, v)]), 'var(--c4)', 2); P2.text(150, 0.74, 'הפסד לאורך האימון', 'var(--ink3)', 11);
    const acc = D.X.reduce((a, x, i) => a + (((sig(w[0] * (x[0] - m[0]) / s[0] + w[1] * (x[1] - m[1]) / s[1] + b) > 0.5) ? 1 : 0) === D.y[i] ? 1 : 0), 0) / D.X.length;
    out.innerHTML = `צעד ${it} &nbsp; הפסד: <b>${hist.length ? V.fmt(hist[hist.length - 1], 4) : '—'}</b> &nbsp; דיוק: <b>${V.fmt(acc * 100, 1)}%</b> &nbsp; w = (${V.fmt(w[0])}, ${V.fmt(w[1])}), b = ${V.fmt(b)}`;
  }
  function toggle() { if (timer) { clearInterval(timer); timer = null; playB.textContent = '▶ אמן'; } else { timer = setInterval(() => { for (let k = 0; k < 3; k++) step(); draw(); if (it > 900) toggle(); }, 40); playB.textContent = '⏸ עצור'; } }
  D = makeData(c0, c1, 100, 7);
  const h0 = P.handle(c0[0], c0[1], 'var(--c2)', (x, y) => { c0 = [x, y]; D = makeData(c0, c1, 100, 7); draw(); }, { snap: 0.1, r: 11 });
  const h1 = P.handle(c1[0], c1[1], 'var(--c1)', (x, y) => { c1 = [x, y]; D = makeData(c0, c1, 100, 7); draw(); }, { snap: 0.1, r: 11 });
  draw();
};

W.w_gradcheck = function (box) {
  V.say(box, 'בדיקת שפיות: מחשבים את הגרדיאנט בשתי דרכים. <b>אנליטית</b> (הנוסחה (p − y)·x) ו<b>מספרית</b> (מזיזים את w קצת לשני הכיוונים ומחלקים). אם הן זהות, הקוד נכון. שנה את h ושים לב לדיוק.');
  const D = makeData([-2, -1], [2, 1.5], 30, 11); let h = 1e-4; let w = [0.3, -0.2], b = 0.1;
  const L = (w0) => { let s = 0; D.X.forEach((x, i) => { const p = sig(w0[0] * x[0] + w0[1] * x[1] + b); s += -(D.y[i] * Math.log(p) + (1 - D.y[i]) * Math.log(1 - p)); }); return s / D.X.length; };
  const t = el('table', { class: 't', style: { margin: '8px auto' } }); box.appendChild(t);
  V.slider(V.row(box), 'h = 10^', -10, -1, 1, -4, v => { h = 10 ** v; draw(); });
  const out = V.say(box);
  function draw() {
    const an = [0, 1].map(k => D.X.reduce((s, x, i) => s + (sig(w[0] * x[0] + w[1] * x[1] + b) - D.y[i]) * x[k], 0) / D.X.length);
    const nu = [0, 1].map(k => { const a = w.slice(), c = w.slice(); a[k] += h; c[k] -= h; return (L(a) - L(c)) / (2 * h); });
    const diff = Math.max(...an.map((v, k) => Math.abs(v - nu[k])));
    t.innerHTML = '<tr><th></th><th>אנליטי</th><th>מספרי</th></tr>' + [0, 1].map(k => `<tr><td>∂L/∂w${k}</td><td>${an[k].toFixed(8)}</td><td>${nu[k].toFixed(8)}</td></tr>`).join('');
    out.innerHTML = 'הפרש מקסימלי: <b class="mono">' + diff.toExponential(2) + '</b> ' + (diff < 1e-6 ? '<span class="good">✓ זהים כמעט לגמרי.</span>' : h > 1e-3 ? 'h גדול מדי: הקירוב גס.' : 'h קטן מדי: שגיאות עיגול של המחשב מתחילות להשפיע.');
  }
  draw();
};

W.w_portfolio = function (box) {
  V.say(box, 'רשימת משימות לתיק העבודות. סמן מה כבר עשית, והסימונים יישמרו.');
  const items = ['קוד מסודר בקובץ, לא רק במחברת', 'גרף של עקומת הלמידה ושל קו ההפרדה', 'בדיקת גרדיאנט מספרית שעוברת', 'הרחבה לשלוש מחלקות (תרגיל 12.4)', 'שכבה נסתרת (תרגיל 12.5)', 'קובץ README קצר: מה עשיתי, מה למדתי, תוצאות במספרים'];
  const st = window.Store ? window.Store.map('portfolio') : {};
  items.forEach((t, i) => { const cb = el('input', { type: 'checkbox' }); cb.checked = !!st[i]; cb.onchange = () => { st[i] = cb.checked; window.Store && window.Store.save(); }; box.appendChild(el('label', { style: { display: 'flex', gap: '8px', alignItems: 'center', margin: '6px 0' } }, cb, t)); });
};
})();
