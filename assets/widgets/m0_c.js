/* Module 0 widgets — chapters 7–9: chain rule & backprop, gradient descent, probability */
(function () {
const W = window.W, V = window.V, el = V.el;
const hr = box => box.appendChild(el('hr', { style: { border: 0, borderTop: '1px dashed var(--line2)' } }));

/* ===== chapter 7 ===== */
W.w_gears = function (box) {
  V.say(box, 'שלושה גלגלי שיניים. כשהגלגל x מסתובב פעם אחת, y מסתובב 3 פעמים, ו־z מסתובב פי 2 מ־y. אז כמה z רגיש ל־x? <b>מכפילים: 3 × 2 = 6.</b> זה כל כלל השרשרת. שנה את היחסים ולחץ "סובב".');
  let r1 = 3, r2 = 2;
  const r = V.row(box); V.slider(r, 'dy/dx', 0.5, 4, 0.5, r1, v => { r1 = v; info(); }); V.slider(r, 'dz/dy', 0.5, 4, 0.5, r2, v => { r2 = v; info(); });
  const svg = V.s('svg', { viewBox: '0 0 560 210', width: 560 }); const w = el('div', { style: { display: 'flex', justifyContent: 'center', direction: 'ltr' } }); w.appendChild(svg); box.appendChild(w);
  const out = V.say(box);
  function gear(cx, cy, R, teeth, col, label) {
    const g = V.s('g', {}, svg); const d = []; for (let i = 0; i < teeth * 2; i++) { const a = i / (teeth * 2) * 2 * Math.PI; const rr = i % 2 ? R : R + 9; d.push((cx + Math.cos(a) * rr).toFixed(1) + ',' + (cy + Math.sin(a) * rr).toFixed(1)); }
    V.s('polygon', { points: d.join(' '), style: { fill: col, fillOpacity: .25, stroke: col, strokeWidth: 2 } }, g);
    V.s('line', { x1: cx, y1: cy, x2: cx + R - 6, y2: cy, style: { stroke: col, strokeWidth: 4 } }, g);
    V.s('circle', { cx, cy, r: 6, style: { fill: col } }, g);
    V.s('text', { x: cx, y: cy + R + 30, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 700, style: { fill: col }, text: label }, svg);
    return g;
  }
  const G = [gear(90, 95, 62, 18, 'var(--c1)', 'x'), gear(270, 95, 42, 12, 'var(--c3)', 'y'), gear(430, 95, 30, 8, 'var(--c2)', 'z')];
  let ang = 0, raf;
  function info() { out.innerHTML = `dz/dx = dz/dy · dy/dx = ${V.fmt(r2)} × ${V.fmt(r1)} = <b>${V.fmt(r1 * r2)}</b>. כש־x עושה סיבוב אחד, z עושה ${V.fmt(r1 * r2)}.`; }
  function spin() { cancelAnimationFrame(raf); let t = 0; const go = () => { t += 1; ang += 1.2; const a = [ang, -ang * r1, ang * r1 * r2]; G.forEach((g, i) => { const c = [[90, 95], [270, 95], [430, 95]][i]; g.setAttribute('transform', `rotate(${a[i]} ${c[0]} ${c[1]})`); }); if (t < 300) raf = requestAnimationFrame(go); }; go(); }
  V.btns(box, [['סובב', spin, 'primary']]); info();
};

W.w_compgraph = function (box) {
  V.say(box, 'גרף החישוב של ניורון אחד: z = w·x + b, ואחר כך L = (z − y)². לחץ "הבא": קודם <b style="color:var(--c1)">המעבר קדימה</b> (חישוב הערכים), ואז <b style="color:var(--c2)">המעבר לאחור</b> (הנגזרות זורמות מהסוף להתחלה ומוכפלות לאורך הדרך).');
  const x = 2, w = 0.5, b = 1, y = 3;
  const svg = V.s('svg', { viewBox: '0 0 640 250', width: 640 }); const wr = el('div', { style: { display: 'flex', justifyContent: 'center', direction: 'ltr' } }); wr.appendChild(svg); box.appendChild(wr);
  const say = V.say(box);
  const N = { w: [60, 50, 'w', w], x: [60, 130, 'x', x], b: [60, 210, 'b', b], mul: [210, 90, '×', 1], add: [340, 150, '+', 2], y: [340, 40, 'y', 3], sub: [470, 100, '−', -1], sq: [590, 100, '( )²', 1] };
  const E = [['w', 'mul'], ['x', 'mul'], ['mul', 'add'], ['b', 'add'], ['add', 'sub'], ['y', 'sub'], ['sub', 'sq']];
  const vals = { w: 0.5, x: 2, b: 1, mul: 1, add: 2, y: 3, sub: -1, sq: 1 };
  const grads = { sq: 1, sub: -2, add: -2, mul: -2, w: -4, b: -2, x: -1 };
  const steps = [
    { f: [], g: [], s: 'הקלטים: w = 0.5, x = 2, b = 1, ותווית אמת y = 3.' },
    { f: ['mul'], g: [], s: 'קדימה: w·x = 0.5 · 2 = 1' },
    { f: ['mul', 'add'], g: [], s: 'קדימה: z = 1 + b = 2' },
    { f: ['mul', 'add', 'sub'], g: [], s: 'קדימה: z − y = 2 − 3 = −1' },
    { f: ['mul', 'add', 'sub', 'sq'], g: [], s: 'קדימה: L = (−1)² = 1. זו הטעות.' },
    { f: ['mul', 'add', 'sub', 'sq'], g: ['sq', 'sub', 'add'], s: 'אחורה: כמה L רגיש ל־z? הנגזרת של (z − y)² היא 2(z − y) = 2 · (−1) = <b>−2</b>' },
    { f: ['mul', 'add', 'sub', 'sq'], g: ['sq', 'sub', 'add', 'b', 'mul'], s: 'אחורה דרך החיבור: z = (w·x) + b, ולכן z רגיש ל־b בדיוק 1. ∂L/∂b = −2 · 1 = <b>−2</b>' },
    { f: ['mul', 'add', 'sub', 'sq'], g: ['sq', 'sub', 'add', 'b', 'mul', 'w'], s: 'אחורה דרך הכפל: z רגיש ל־w פי x = 2. כלל השרשרת: ∂L/∂w = −2 · 2 = <b>−4</b>. הנגזרת שלילית, ולכן כדי להקטין את L צריך להגדיל את w.' }];
  function draw(k) {
    svg.innerHTML = ''; const st = steps[k];
    E.forEach(([a, c]) => { const A = N[a], C = N[c]; const back = st.g.includes(a) && st.g.includes(c) || (st.g.includes(a) && ['w', 'b'].includes(a)); V.s('line', { x1: A[0] + 30, y1: A[1], x2: C[0] - 30, y2: C[1], style: { stroke: back ? 'var(--c2)' : st.f.includes(c) ? 'var(--c1)' : 'var(--line2)', strokeWidth: back ? 4 : 2.5 } }, svg); });
    Object.entries(N).forEach(([k2, [cx, cy, lab]]) => {
      const leaf = ['w', 'x', 'b', 'y'].includes(k2); const on = leaf || st.f.includes(k2);
      V.s('rect', { x: cx - 30, y: cy - 22, width: 60, height: 44, rx: leaf ? 22 : 10, style: { fill: on ? 'var(--accent-bg)' : 'var(--surface2)', stroke: on ? 'var(--c1)' : 'var(--line2)', strokeWidth: 2 } }, svg);
      V.s('text', { x: cx, y: cy - 2, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, style: { fill: 'var(--ink)' }, text: lab }, svg);
      if (on) V.s('text', { x: cx, y: cy + 15, 'text-anchor': 'middle', 'font-size': 12, style: { fill: 'var(--c1)' }, text: (k2 === 'sq' ? 'L=' : k2 === 'add' ? 'z=' : '') + V.fmt(vals[k2]) }, svg);
      if (st.g.includes(k2)) V.s('text', { x: cx, y: cy + 38, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, style: { fill: 'var(--c2)' }, text: '∂L=' + V.fmt(grads[k2]) }, svg);
    });
    say.innerHTML = st.s;
  }
  V.stepper(box, steps.length, draw, { speed: 1800 });
};

W.w_act = function (box) {
  V.say(box, 'שלוש פונקציות אקטיבציה. בכחול הפונקציה, בכתום הנגזרת. גרור את x ושים לב: הנגזרת של הסיגמואיד <b>לעולם לא עולה מעל 0.25</b>. בהמשך זו בדיוק הבעיה של הגרדיאנט הנעלם.');
  const fs = { 'סיגמואיד σ': [z => 1 / (1 + Math.exp(-z)), z => { const s = 1 / (1 + Math.exp(-z)); return s * (1 - s); }], 'tanh': [Math.tanh, z => 1 - Math.tanh(z) ** 2], 'ReLU': [z => Math.max(0, z), z => z > 0 ? 1 : 0] };
  let F = fs['סיגמואיד σ'], x = 0;
  V.tabs(box, Object.keys(fs), (i, l) => { F = fs[l]; draw(); });
  const P = V.plane(box, { w: 460, h: 300, x: [-6, 6], y: [-1.2, 2] , step: 1});
  V.slider(V.row(box), 'z', -6, 6, 0.1, x, v => { x = v; draw(); }); const out = V.say(box);
  function draw() { P.clear(); P.line(-6, 0.25, 6, 0.25, 'var(--c2)', 1, '3 4'); P.fn(F[0], 'var(--c1)', 3); P.fn(F[1], 'var(--c2)', 2.5); P.dot(x, F[0](x), 6, 'var(--c1)'); P.dot(x, F[1](x), 6, 'var(--c2)'); out.innerHTML = 'f(' + V.fmt(x, 1) + ') = <b style="color:var(--c1)">' + V.fmt(F[0](x), 3) + '</b>, f′(' + V.fmt(x, 1) + ') = <b style="color:var(--c2)">' + V.fmt(F[1](x), 3) + '</b>'; }
  draw();
};

W.w_vanish = function (box) {
  V.say(box, 'בהפצה לאחור, הגרדיאנט מוכפל בכל שכבה בגורם כלשהו. אם הגורם קטן מ־1, אחרי הרבה שכבות לא נשאר כלום (<b>נעלם</b>). אם הוא גדול מ־1, הגרדיאנט <b>מתפוצץ</b>. הפעל "חיבור דילוג" ותראה למה ResNet עובד.');
  let n = 10, f = 0.25, skip = false;
  const r = V.row(box); V.slider(r, 'שכבות', 2, 40, 1, n, v => { n = v; draw(); }); V.slider(r, 'גורם לשכבה', 0.1, 1.3, 0.05, f, v => { f = v; draw(); });
  const cb = el('input', { type: 'checkbox' }); cb.onchange = () => { skip = cb.checked; draw(); }; r.appendChild(el('label', { class: 'ctl' }, cb, ' חיבור דילוג (x + F(x))'));
  const bars = el('div', { style: { display: 'flex', alignItems: 'flex-end', gap: '3px', height: '170px', direction: 'ltr', padding: '6px', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--line)' } }); box.appendChild(bars);
  const out = V.say(box);
  function draw() {
    const g = []; let v = 1; for (let i = 0; i < n; i++) { g.push(v); v *= skip ? (1 + (f - 1) * 0.02) : f; }
    const lg = x => Math.max(0, (Math.log10(x) + 8) / 12);
    bars.innerHTML = g.reverse().map((x, i) => `<div title="שכבה ${i + 1}: ${x.toExponential(1)}" style="flex:1;height:${Math.max(2, lg(x) * 150)}px;background:${x < 1e-3 ? 'var(--c2)' : x > 100 ? 'var(--c5)' : 'var(--c3)'};border-radius:3px 3px 0 0"></div>`).join('');
    const first = g[0];
    out.innerHTML = 'הגרדיאנט שמגיע לשכבה הראשונה: <b class="mono">' + first.toExponential(2) + '</b> (סולם לוגריתמי, שמאל = שכבה ראשונה). ' + (skip ? 'עם חיבור דילוג הנגזרת היא 1 + F′, ולכן הגרדיאנט "עובר בכביש מהיר" בלי להיעלם.' : first < 1e-4 ? 'נעלם! השכבות הראשונות לא לומדות.' : first > 100 ? 'התפוצץ! האימון יקרוס.' : '') + (Math.abs(f - 0.25) < 1e-9 && n === 10 && !skip ? ' ← 0.25 בחזקת 10 ≈ מיליונית.' : '');
  }
  draw();
};

W.x7_5 = function (box) {
  V.ask(box, 'כמה זה 1.05 בחזקת 100? (בערך, מספר שלם)', s => Math.abs(V.nums(s)[0] - 131.5) < 3, 'כ־131: גם גורם קצת מעל 1 מתפוצץ.');
};

/* ===== chapter 8 ===== */
const L83 = w => (w - 3) ** 2, d83 = w => 2 * (w - 3);

W.w_fog = function (box) {
  V.say(box, 'אתה על הר בערפל ורואה רק מטר סביבך. הדבר היחיד שאתה יודע הוא <b>השיפוע מתחת לרגליים</b>. לחץ "צעד" כדי לרדת בכיוון ההפוך לשיפוע. הסר את הערפל רק בסוף.');
  const f = x => 0.15 * (x - 1) ** 2 + Math.sin(x * 1.3) * 0.6 + 2;
  const df = x => 0.3 * (x - 1) + 0.78 * Math.cos(x * 1.3);
  let x = -4.5, fog = true; const path = [x];
  const P = V.plane(box, { w: 500, h: 280, x: [-6, 7], y: [0, 9], grid: false });
  const out = V.say(box);
  function draw() {
    P.clear(); if (fog) P.fn(f, 'var(--c1)', 3, 40, x - 0.8, x + 0.8); else P.fn(f, 'var(--c1)', 3);
    path.forEach((p, i) => i && P.line(path[i - 1], f(path[i - 1]) + 0.25, p, f(p) + 0.25, 'var(--c5)', 2, '3 3'));
    P.dot(x, f(x) + 0.25, 9, 'var(--c2)');
    if (fog) { const g = P.svg.querySelector('#fogrect'); }
    const d = df(x); P.arrow(x, f(x) + 0.9, x - Math.sign(d) * Math.min(1.5, Math.abs(d) * 2 + 0.3), f(x) + 0.9, 'var(--c3)', 3);
    out.innerHTML = 'מיקום: ' + V.fmt(x) + ', שיפוע: ' + V.fmt(d) + '. צעדים: ' + (path.length - 1) + (Math.abs(d) < 0.03 ? ' — <span class="good">השיפוע כמעט אפס: הגענו לתחתית.</span>' : '');
  }
  V.btns(box, [['צעד (η = 0.8)', () => { x -= 0.8 * df(x); path.push(x); draw(); }, 'primary'], ['הסר / החזר ערפל', () => { fog = !fog; draw(); }], ['↺', () => { x = -4.5; path.length = 0; path.push(x); draw(); }]]);
  draw();
};

W.w_update = function (box) {
  V.say(box, 'כלל העדכון, חלק אחרי חלק. L(w) = (w − 3)². הזז את w ואת η, וראה בדיוק איך מחושב הצעד הבא.');
  let w = 0, eta = 0.1;
  const r = V.row(box); V.slider(r, 'w הנוכחי', -2, 7, 0.1, w, v => { w = v; draw(); }); V.slider(r, 'η (קצב למידה)', 0.01, 1, 0.01, eta, v => { eta = v; draw(); });
  const f = el('div', { style: { textAlign: 'center' } }); box.appendChild(f);
  const P = V.plane(box, { w: 460, h: 260, x: [-2, 7], y: [-1, 26], step: 1, labelStep: 1 });
  function draw() {
    const g = d83(w), wn = w - eta * g;
    f.innerHTML = window.texHTML(`w_{\\text{new}} = \\underbrace{${V.fmt(w)}}_{w_{\\text{old}}} - \\underbrace{${V.fmt(eta)}}_{\\eta} \\cdot \\underbrace{(${V.fmt(g)})}_{\\partial L/\\partial w = 2(w-3)} = \\mathbf{${V.fmt(wn, 3)}}`);
    P.clear(); P.fn(L83, 'var(--c1)', 3); P.dot(w, L83(w), 7, 'var(--c2)'); P.arrow(w, L83(w), wn, L83(wn), 'var(--c3)', 3); P.dot(wn, L83(wn), 6, 'var(--c3)');
  }
  draw();
};

W.w_gd_table = function (box) {
  V.say(box, 'הדוגמה מהטקסט: L(w) = (w − 3)², מתחילים מ־w = 0 עם η = 0.1. כל לחיצה מוסיפה שורה לטבלה ונקודה לגרף. שים לב שהמרחק מ־3 מוכפל כל פעם ב־0.8.');
  const P = V.plane(box, { w: 460, h: 260, x: [-0.5, 4], y: [-0.5, 9.5], step: 1, labelStep: 1 });
  const tb = el('table', { class: 't', style: { margin: '8px auto' } }); box.appendChild(tb);
  const rows = []; let w = 0; for (let i = 0; i <= 8; i++) { rows.push([i, w, d83(w), w - 0.1 * d83(w)]); w = w - 0.1 * d83(w); }
  V.stepper(box, rows.length, k => {
    P.clear(); P.fn(L83, 'var(--c1)', 3); for (let i = 0; i <= k; i++) { P.dot(rows[i][1], L83(rows[i][1]), i === k ? 7 : 5, i === k ? 'var(--c2)' : 'var(--c5)'); if (i) P.line(rows[i - 1][1], L83(rows[i - 1][1]), rows[i][1], L83(rows[i][1]), 'var(--c5)', 1.5, '3 3'); }
    tb.innerHTML = '<tr><th>צעד</th><th>w</th><th>נגזרת 2(w−3)</th><th>w חדש</th><th>מרחק מ־3</th></tr>' + rows.slice(0, k + 1).map(r => `<tr${r[0] === k ? ' style="background:var(--accent-bg)"' : ''}><td>${r[0]}</td><td>${V.fmt(r[1], 3)}</td><td>${V.fmt(r[2], 3)}</td><td>${V.fmt(r[3], 3)}</td><td>${V.fmt(3 - r[1], 3)}</td></tr>`).join('');
  }, { speed: 1000 });
};

W.w_lr = function (box) {
  V.say(box, 'קצב הלמידה הוא הפרמטר החשוב ביותר. בחר η ולחץ "רוץ": קטן מדי זוחל, מתאים מתכנס יפה, וגדול מדי קופץ ומתבדר.');
  let eta = 0.1;
  const pr = [0.001, 0.01, 0.1, 0.5, 0.9, 1.0, 1.1];
  V.tabs(box, pr.map(String), i => { eta = pr[i]; run(); }, 2);
  const r = V.row(box); r.style.justifyContent = 'center';
  const P = V.plane(r, { w: 340, h: 260, x: [-4, 10], y: [-1, 40], grid: false });
  const P2 = V.plane(r, { w: 300, h: 260, x: [0, 30], y: [-6, 12], grid: false });
  const out = V.say(box);
  let t;
  function run() {
    clearInterval(t); let w = 0, k = 0; const hist = [0];
    t = setInterval(() => {
      w = w - eta * d83(w); hist.push(w); k++;
      P.clear(); P.fn(L83, 'var(--c1)', 2.5); hist.forEach((v, i) => { if (i && Math.abs(v) < 50) P.line(hist[i - 1], Math.min(40, L83(hist[i - 1])), v, Math.min(40, L83(v)), 'var(--c5)', 1.2); }); if (Math.abs(w) < 50) P.dot(w, Math.min(40, L83(w)), 6, 'var(--c2)');
      P2.clear(); P2.line(0, 3, 30, 3, 'var(--c3)', 1, '4 4'); P2.text(29, 3.6, 'w = 3', 'var(--c3)', 11, 'end'); P2.path(hist.map((v, i) => [i, Math.max(-6, Math.min(12, v))]), 'var(--c4)', 2.5); P2.text(15, -5, 'צעדים →', 'var(--ink3)', 11);
      const verdict = Math.abs(w - 3) < 0.01 ? 'התכנס ✓' : Math.abs(w) > 30 ? '<span class="bad">התבדר! הטעות קופצת לאינסוף (NaN).</span>' : eta === 1 ? 'קופץ לנצח בין 0 ל־6' : eta <= 0.01 ? 'זוחל…' : eta > 0.5 ? 'מתנדנד מצד לצד…' : '';
      out.innerHTML = 'η = ' + eta + ', אחרי ' + k + ' צעדים: w = <b>' + (Math.abs(w) > 1e6 ? w.toExponential(1) : V.fmt(w, 3)) + '</b>. ' + verdict + ' <span class="note-small">(המרחק מ־3 מוכפל בכל צעד ב־(1 − 2η) = ' + V.fmt(1 - 2 * eta, 3) + ')</span>';
      if (k >= 30 || Math.abs(w) > 1e6) clearInterval(t);
    }, 120);
  }
  run();
};

function bowlWidget(box, opts) {
  const f = opts.f, g = opts.g;
  const P = V.plane(box, { w: 440, h: 360, x: opts.x, y: opts.y, grid: false });
  const img = V.s('image', { x: 0, y: 0, width: 440, height: 360, preserveAspectRatio: 'none' }); P.svg.insertBefore(img, P.svg.firstChild);
  const cv = document.createElement('canvas'); cv.width = 110; cv.height = 90; const ctx = cv.getContext('2d'); const im = ctx.createImageData(110, 90);
  let vals = [], lo = Infinity, hi = -Infinity;
  for (let j = 0; j < 90; j++) for (let i = 0; i < 110; i++) { const x = opts.x[0] + (opts.x[1] - opts.x[0]) * i / 109, y = opts.y[1] - (opts.y[1] - opts.y[0]) * j / 89; const v = Math.log(1 + f(x, y)); vals.push(v); lo = Math.min(lo, v); hi = Math.max(hi, v); }
  vals.forEach((v, k) => { const t = (v - lo) / (hi - lo); const band = Math.abs(((t * 10) % 1) - 0.5) < 0.05; const c = band ? 90 : 245 - t * 160; im.data[k * 4] = c * 0.9; im.data[k * 4 + 1] = c * 0.95; im.data[k * 4 + 2] = c; im.data[k * 4 + 3] = 140; });
  ctx.putImageData(im, 0, 0); img.setAttribute('href', cv.toDataURL());
  return P;
}

W.w_sgd = function (box) {
  V.say(box, 'במקום לחשב את השיפוע על <b>כל</b> הנתונים, ירידה במורד סטוכסטית לוקחת מקבץ קטן. השיפוע רועש, והדרך מזגזגת, אבל כל צעד זול בהרבה ובסוף מגיעים לאותו מקום.');
  const f = (x, y) => (x - 1) ** 2 + 2 * (y - 0.5) ** 2, g = (x, y) => [2 * (x - 1), 4 * (y - 0.5)];
  let bs = 8;
  const P = bowlWidget(box, { f, g, x: [-4, 4], y: [-3, 3] });
  V.slider(V.row(box), 'גודל מקבץ', 1, 64, 1, bs, v => { bs = v; run(); }); const out = V.say(box);
  function run() {
    P.clear(); const rnd = V.randn;
    let a = [-3.5, 2.5], b = [-3.5, 2.5]; const pa = [a.slice()], pb = [b.slice()];
    for (let i = 0; i < 40; i++) { const ga = g(...a); a = [a[0] - 0.1 * ga[0], a[1] - 0.1 * ga[1]]; pa.push(a.slice()); const gb = g(...b); const noise = 3 / Math.sqrt(bs); b = [b[0] - 0.1 * (gb[0] + rnd() * noise), b[1] - 0.1 * (gb[1] + rnd() * noise)]; pb.push(b.slice()); }
    P.path(pa, 'var(--c1)', 3); P.path(pb, 'var(--c2)', 2); P.dot(1, 0.5, 6, 'var(--c3)');
    out.innerHTML = 'כחול: כל הנתונים (חלק ויקר). כתום: מקבץ של ' + bs + ' דוגמאות (רועש וזול). ככל שהמקבץ קטן יותר, הזיגזג גדול יותר.';
  }
  run();
};

W.w_optim = function (box) {
  V.say(box, 'מרוץ אופטימייזרים על קערה מוארכת, f = (x − 1)² + 4(y + 2)² (כמו בתרגיל 8.3). <b style="color:var(--c1)">ירידה רגילה</b> מזגזגת בכיוון התלול, <b style="color:var(--c2)">תנע</b> צובר מהירות, ו<b style="color:var(--c3)">אדם</b> מתאים קצב נפרד לכל כיוון.');
  const f = (x, y) => (x - 1) ** 2 + 4 * (y + 2) ** 2, g = (x, y) => [2 * (x - 1), 8 * (y + 2)];
  let eta = 0.2;
  const P = bowlWidget(box, { f, g, x: [-3, 3], y: [-4, 1] });
  V.slider(V.row(box), 'η', 0.02, 0.24, 0.01, eta, v => { eta = v; run(); }); const out = V.say(box);
  function run() {
    P.clear(); const s0 = [-2.5, 0.5]; const N = 40;
    let p = s0.slice(); const A = [p.slice()]; for (let i = 0; i < N; i++) { const d = g(...p); p = [p[0] - eta * d[0], p[1] - eta * d[1]]; A.push(p.slice()); }
    p = s0.slice(); let v = [0, 0]; const B = [p.slice()]; for (let i = 0; i < N; i++) { const d = g(...p); v = [0.8 * v[0] - eta * 0.4 * d[0], 0.8 * v[1] - eta * 0.4 * d[1]]; p = [p[0] + v[0], p[1] + v[1]]; B.push(p.slice()); }
    p = s0.slice(); let m = [0, 0], s = [0, 0]; const C = [p.slice()]; for (let i = 1; i <= N; i++) { const d = g(...p); m = m.map((x, k) => 0.9 * x + 0.1 * d[k]); s = s.map((x, k) => 0.999 * x + 0.001 * d[k] * d[k]); const mh = m.map(x => x / (1 - 0.9 ** i)), sh = s.map(x => x / (1 - 0.999 ** i)); p = p.map((x, k) => x - eta * 1.5 * mh[k] / (Math.sqrt(sh[k]) + 1e-8)); C.push(p.slice()); }
    const clip = a => a.map(q => [Math.max(-3, Math.min(3, q[0])), Math.max(-4, Math.min(1, q[1]))]);
    P.path(clip(A), 'var(--c1)', 2.5); P.path(clip(B), 'var(--c2)', 2.5); P.path(clip(C), 'var(--c3)', 2.5); P.dot(1, -2, 7, 'var(--ink)');
    const dist = a => V.fmt(Math.hypot(a[a.length - 1][0] - 1, a[a.length - 1][1] + 2), 3);
    out.innerHTML = `אחרי ${N} צעדים, מרחק מהמינימום (1, −2): רגילה ${dist(A)}, תנע ${dist(B)}, אדם ${dist(C)}.` + (eta > 0.25 ? '' : eta > 0.2 ? ' שים לב: בכיוון y הגורם הוא (1 − 8η), והוא קרוב להתבדרות.' : '');
  }
  run();
};

W.w_fail = function (box) {
  V.say(box, 'מה יכול להשתבש? בחר תרחיש ולחץ "רוץ".');
  const sc = {
    'מינימום מקומי': [x => 0.08 * x ** 4 - 0.9 * x ** 2 + 0.6 * x + 4, x => 0.32 * x ** 3 - 1.8 * x + 0.6, 2.8, 'הכדור נתקע בבור הקטן, למרות שיש בור עמוק יותר משמאל.'],
    'מישור (פלטו)': [x => 4 - 3 / (1 + Math.exp(-(x - 2) * 2)) + 0.02 * (x + 4) ** 2 * 0.1, x => -6 * Math.exp(-(x - 2) * 2) / (1 + Math.exp(-(x - 2) * 2)) ** 2 + 0.004 * (x + 4), -3.5, 'השיפוע כמעט אפס, אז הכדור כמעט לא זז. האימון "תקוע" למרות שלא הגענו לשום מקום.'],
    'קצב גבוה מדי': [x => 0.3 * x * x + 1, x => 0.6 * x, 3, 'הצעדים גדולים מדי, והכדור קופץ מעבר לתחתית ומתרחק.'] };
  let k = 'מינימום מקומי';
  V.tabs(box, Object.keys(sc), (i, l) => { k = l; run(); });
  const P = V.plane(box, { w: 480, h: 260, x: [-4, 4], y: [0, 9], grid: false }); const out = V.say(box);
  let t;
  function run() {
    clearInterval(t); const [f, d, x0, msg] = sc[k]; let x = x0, n = 0; const eta = k === 'קצב גבוה מדי' ? 3.6 : 0.15;
    t = setInterval(() => { P.clear(); P.fn(f, 'var(--c1)', 3); P.dot(Math.max(-4, Math.min(4, x)), Math.min(9, f(x)) + 0.25, 9, 'var(--c2)'); x -= eta * d(x); n++; if (n > 40 || Math.abs(x) > 6) { clearInterval(t); out.innerHTML = msg; } }, 140);
    out.innerHTML = '…';
  }
  run();
};

W.x8_1 = function (box) { V.ask(box, 'בטבלה של 8.3, אחרי צעד 4 הגענו ל־w = 1.771. מה w אחרי צעד 5? (3 ספרות אחרי הנקודה)', s => Math.abs(V.nums(s)[0] - 2.017) < 0.002, 'נכון: 1.771 − 0.1 · 2(1.771 − 3) = 2.017'); };
W.x8_2 = function (box) { [['0.5', 1], ['1.0', 3], ['1.1', 4], ['0.9', 2]].forEach(([e, c]) => V.quiz(box, 'מה יקרה עם η = ' + e + '?', ['איטי מאוד', 'מגיע ל־3 בצעד אחד', 'מתנדנד ומתכנס', 'קופץ לנצח בין 0 ל־6', 'מתבדר'], c)); };

/* ===== chapter 9 ===== */
W.w_dice = function (box) {
  V.say(box, 'משתנה מקרי: ערך שנקבע בהגרלה. הטל קוביות ותראה את ההיסטוגרמה נבנית. עם קובייה אחת כל פאה מקבלת שישית. עם <b>סכום של שתי קוביות</b>, 7 הכי נפוץ.');
  let mode = 1, counts = {}, n = 0;
  V.tabs(box, ['קובייה אחת', 'סכום של שתיים'], i => { mode = i + 1; counts = {}; n = 0; draw(); });
  const bars = el('div', { style: { display: 'flex', alignItems: 'flex-end', gap: '6px', height: '180px', direction: 'ltr', justifyContent: 'center' } }); box.appendChild(bars);
  const out = V.say(box);
  const roll = k => { for (let i = 0; i < k; i++) { let s = 0; for (let j = 0; j < mode; j++) s += 1 + Math.floor(Math.random() * 6); counts[s] = (counts[s] || 0) + 1; n++; } draw(); };
  V.btns(box, [['הטל פעם אחת', () => roll(1), 'primary'], ['×100', () => roll(100)], ['×1000', () => roll(1000)], ['↺', () => { counts = {}; n = 0; draw(); }]]);
  function draw() {
    const keys = mode === 1 ? [1, 2, 3, 4, 5, 6] : [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const mx = Math.max(1, ...keys.map(k => counts[k] || 0));
    bars.innerHTML = keys.map(k => `<div style="text-align:center;width:34px"><div class="note-small">${n ? V.fmt((counts[k] || 0) / n * 100, 0) + '%' : ''}</div><div style="height:${(counts[k] || 0) / mx * 130}px;background:var(--c1);border-radius:6px 6px 0 0;transition:height .2s"></div><div>${k}</div></div>`).join('');
    out.innerHTML = n + ' הטלות. ' + (mode === 1 ? 'התפלגות בדידה אחידה: כל ערך 16.7%.' : 'הסיכוי ל־7 הוא 6/36 ≈ 16.7%, ל־2 רק 1/36 ≈ 2.8%.');
  }
  draw();
};

W.w_meanvar = function (box) {
  V.say(box, 'הדוגמה מהטקסט: מזהה דיווח על מרכז מטרה במקומות 100, 103, 98, 101, 98. <b>גרור את הנקודות.</b> הקו הירוק הוא הממוצע. הריבועים הם המרחקים בריבוע, והשונות היא הממוצע שלהם.');
  let xs = [100, 103, 98, 101, 98];
  const P = V.plane(box, { w: 520, h: 260, x: [94, 107], y: [-1, 6], grid: false, axes: false });
  const out = V.say(box); let hs = [];
  function draw() {
    P.clear(); const mu = xs.reduce((a, b) => a + b) / xs.length; const sq = xs.map(x => (x - mu) ** 2); const vr = sq.reduce((a, b) => a + b) / xs.length; const sd = Math.sqrt(vr);
    for (let x = 95; x <= 106; x++) P.text(x, -0.6, String(x), 'var(--ink3)', 10);
    P.line(94, 0, 107, 0, 'var(--line2)', 1);
    P.poly([[mu - sd, -0.2], [mu + sd, -0.2], [mu + sd, 5.6], [mu - sd, 5.6]], 'var(--c3)', 'none', .08);
    xs.forEach((x, i) => { const y = i + 0.5; const d = x - mu; const s = Math.abs(d); V.s('rect', { x: P.X(Math.min(x, mu)), y: P.Y(y + s * 0.18), width: Math.abs(P.X(x) - P.X(mu)), height: s * 0.18 * (P.H / 7), style: { fill: 'var(--c2)', fillOpacity: .2, stroke: 'var(--c2)' } }, P.layer); });
    P.line(mu, -0.2, mu, 5.6, 'var(--c3)', 2.5);
    out.innerHTML = `ממוצע μ = <b>${V.fmt(mu)}</b> &nbsp; מרחקים: ${xs.map(x => V.fmt(x - mu)).join(', ')} &nbsp; ריבועים: ${sq.map(v => V.fmt(v)).join(', ')} &nbsp; שונות σ² = <b>${V.fmt(vr)}</b> &nbsp; סטיית תקן σ = <b>${V.fmt(sd)}</b> פיקסלים. <span class="note-small">(הרצועה הירוקה היא μ ± σ)</span>`;
  }
  function rebuild() { hs.forEach(h => h.el.remove()); hs = xs.map((x, i) => P.handle(x, i + 0.5, 'var(--c1)', (nx) => { xs[i] = nx; hs[i].set(nx, i + 0.5); draw(); }, { snap: 0.5, lockY: true, r: 8 })); draw(); }
  rebuild();
};

W.w_gauss = function (box) {
  V.say(box, 'ההתפלגות הנורמלית: פעמון. μ מזיז אותו, σ מרחיב אותו. בין μ − σ ל־μ + σ יש 68% מהשטח, ובין μ − 2σ ל־μ + 2σ יש 95%.');
  let mu = 0, sd = 1, band = 1;
  const r = V.row(box); V.slider(r, 'μ', -3, 3, 0.1, mu, v => { mu = v; draw(); }); V.slider(r, 'σ', 0.3, 2.5, 0.05, sd, v => { sd = v; draw(); });
  V.tabs(box, ['±1σ → 68%', '±2σ → 95%', '±3σ → 99.7%'], i => { band = i + 1; draw(); });
  const P = V.plane(box, { w: 500, h: 260, x: [-7, 7], y: [-0.05, 1.4], grid: false }); const out = V.say(box);
  const p = x => Math.exp(-((x - mu) ** 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI));
  function draw() {
    P.clear(); P.line(-7, 0, 7, 0, 'var(--ink3)', 1);
    const a = mu - band * sd, b = mu + band * sd; const pts = [[a, 0]]; for (let i = 0; i <= 60; i++) { const x = a + (b - a) * i / 60; pts.push([x, p(x)]); } pts.push([b, 0]);
    P.poly(pts, 'var(--c1)', 'none', .3); P.fn(p, 'var(--c1)', 3);
    P.line(mu, 0, mu, p(mu), 'var(--c3)', 1.5, '3 3');
    out.innerHTML = 'השטח המוצלל: <b>' + ['68%', '95%', '99.7%'][band - 1] + '</b> מהערכים נופלים בין ' + V.fmt(a) + ' ל־' + V.fmt(b) + '.';
  }
  draw();
  hr(box);
  V.say(box, '<b>למה הפעמון בכל מקום?</b> סכום של הרבה השפעות מקריות נראה גאוסיאני, גם כשכל השפעה לבד "שטוחה". הגדל את מספר הקוביות שמסכמים.');
  let k = 1; const bars = el('div', { style: { display: 'flex', alignItems: 'flex-end', gap: '1px', height: '140px', direction: 'ltr' } }); box.appendChild(bars);
  V.slider(V.row(box), 'כמה קוביות בסכום', 1, 12, 1, k, v => { k = v; clt(); });
  function clt() { const c = {}; for (let i = 0; i < 6000; i++) { let s = 0; for (let j = 0; j < k; j++) s += 1 + Math.floor(Math.random() * 6); c[s] = (c[s] || 0) + 1; } const keys = []; for (let s = k; s <= 6 * k; s++) keys.push(s); const mx = Math.max(...keys.map(s => c[s] || 0)); bars.innerHTML = keys.map(s => `<div style="flex:1;height:${(c[s] || 0) / mx * 130}px;background:var(--c4);border-radius:2px 2px 0 0" title="${s}"></div>`).join(''); }
  clt();
};

W.w_normalize = function (box) {
  V.say(box, 'שני מאפיינים בסולמות שונים לגמרי (גודל בפיקסלים ובהירות). לחץ בסדר: <b>הורד ממוצע</b> (מרכז את הענן סביב 0), ואז <b>חלק בסטיית התקן</b> (מביא את שני הצירים לאותו סולם).');
  const rnd = V.rng(3); const pts = [...Array(60)].map(() => { const a = (rnd() + rnd() + rnd() - 1.5); return [160 + a * 60 + (rnd() - .5) * 30, 0.6 + (rnd() + rnd() - 1) * 0.15 + a * 0.05]; });
  let st = 0;
  const P = V.plane(box, { w: 460, h: 330, x: [-4, 260], y: [-4, 4], grid: false });
  const out = V.say(box);
  const mean = i => pts.reduce((s, p) => s + p[i], 0) / pts.length, std = i => Math.sqrt(pts.reduce((s, p) => s + (p[i] - mean(i)) ** 2, 0) / pts.length);
  function cur() { return pts.map(p => [0, 1].map(i => st === 0 ? p[i] : st === 1 ? p[i] - mean(i) : (p[i] - mean(i)) / std(i))); }
  function draw() {
    P.clear(); const q = cur();
    const xr = st ? [-4, 4] : [0, 260], yr = st ? [-4, 4] : [-0.5, 1.5];
    const sx = x => P.xr[0] + (x - xr[0]) / (xr[1] - xr[0]) * (P.xr[1] - P.xr[0]), sy = y => P.yr[0] + (y - yr[0]) / (yr[1] - yr[0]) * (P.yr[1] - P.yr[0]);
    P.line(sx(0), P.yr[0], sx(0), P.yr[1], 'var(--ink3)', 1); P.line(P.xr[0], sy(0), P.xr[1], sy(0), 'var(--ink3)', 1);
    q.forEach(p => P.dot(sx(p[0]), sy(p[1]), 4, 'var(--c1)'));
    const m = [0, 1].map(i => q.reduce((s, p) => s + p[i], 0) / q.length), s = [0, 1].map(i => Math.sqrt(q.reduce((a, p) => a + (p[i] - m[i]) ** 2, 0) / q.length));
    out.innerHTML = `ממוצעים: (${V.fmt(m[0])}, ${V.fmt(m[1])}) &nbsp; סטיות תקן: (${V.fmt(s[0])}, ${V.fmt(s[1])}) ` + (st === 2 ? '<span class="good">✓ שני המאפיינים עם ממוצע 0 וסטיית תקן 1.</span>' : '');
  }
  V.btns(box, [['1. הורד ממוצע', () => { st = Math.max(st, 1); draw(); }, 'primary'], ['2. חלק בסטיית תקן', () => { st = 2; draw(); }, 'primary'], ['↺', () => { st = 0; draw(); }]]);
  draw();
};

W.w_cov = function (box) {
  V.say(box, 'בשני ממדים, ענן נקודות מתואר במטריצת שונות משותפת. האלכסון הוא השונות של כל ציר, ומחוץ לאלכסון השונות המשותפת (האם הם עולים יחד). הזז את הסליידרים ותראה את האליפסה מסתובבת.');
  let a = 4, d = 4, c = 3;
  const r = V.row(box); V.slider(r, 'שונות x', 0.5, 6, 0.5, a, v => { a = v; draw(); }); V.slider(r, 'שונות y', 0.5, 6, 0.5, d, v => { d = v; draw(); }); V.slider(r, 'משותפת', -4, 4, 0.5, c, v => { c = v; draw(); });
  const rr = V.row(box); rr.style.justifyContent = 'center'; rr.style.alignItems = 'center';
  const P = V.plane(rr, { w: 360, h: 360, x: [-8, 8], y: [-8, 8], labelStep: 2 }); const M = el('div'); rr.appendChild(M);
  const out = V.say(box);
  const Z = [...Array(300)].map(() => [V.randn(), V.randn()]);
  function draw() {
    P.clear(); const cc = Math.max(-Math.sqrt(a * d) * 0.98, Math.min(Math.sqrt(a * d) * 0.98, c));
    const l11 = Math.sqrt(a), l21 = cc / l11, l22 = Math.sqrt(Math.max(1e-6, d - l21 * l21));
    Z.forEach(z => P.dot(l11 * z[0], l21 * z[0] + l22 * z[1], 2.5, 'var(--c1)'));
    const tr = a + d, det = a * d - cc * cc, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det)); const L1 = tr / 2 + disc, L2 = tr / 2 - disc; const th = Math.atan2(L1 - a, cc || 1e-9);
    const ell = [...Array(73)].map((_, i) => { const t = i / 72 * 2 * Math.PI; const x = 2 * Math.sqrt(L1) * Math.cos(t), y = 2 * Math.sqrt(Math.max(0, L2)) * Math.sin(t); return [x * Math.cos(th) - y * Math.sin(th), x * Math.sin(th) + y * Math.cos(th)]; });
    P.path(ell, 'var(--c2)', 2.5);
    M.innerHTML = window.texHTML(`\\Sigma = \\begin{pmatrix} ${a} & ${V.fmt(cc)} \\\\ ${V.fmt(cc)} & ${d} \\end{pmatrix}`);
    out.innerHTML = `הצירים של האליפסה הם הווקטורים העצמיים של Σ, והאורכים שלהם לפי הערכים העצמיים: ${V.fmt(L1)} ו־${V.fmt(L2)}.` + (a === 4 && d === 4 && c === 3 ? ' ← תרגיל 9.5: הכיוון (1, 1) עם 7, והכיוון (1, −1) עם 1.' : '');
  }
  draw();
};

W.w_pr = function (box) {
  V.say(box, 'בתמונה יש 50 מטרות אמיתיות (●). המזהה נותן לכל מועמד ציון ביטחון. הזז את <b>סף הביטחון</b>: סף גבוה פירושו פחות סימונים אבל יותר מדויקים (<b>דיוק</b> עולה), סף נמוך פירושו שמוצאים יותר מטרות (<b>רגישות</b> עולה).');
  const rnd = V.rng(9); const items = [];
  for (let i = 0; i < 50; i++) items.push({ real: true, s: 0.35 + rnd() * 0.65 });
  for (let i = 0; i < 30; i++) items.push({ real: false, s: rnd() * 0.75 });
  items.sort(() => rnd() - 0.5);
  let th = 0.5;
  V.slider(V.row(box), 'סף ביטחון', 0, 1, 0.01, th, v => { th = v; draw(); });
  const grid = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: '4px', direction: 'ltr', maxWidth: '520px', margin: '0 auto' } }); box.appendChild(grid);
  const out = V.say(box);
  function draw() {
    let tp = 0, fp = 0; grid.innerHTML = '';
    items.forEach(it => { const on = it.s >= th; if (on && it.real) tp++; if (on && !it.real) fp++; grid.appendChild(el('div', { title: 'ביטחון ' + V.fmt(it.s), style: { aspectRatio: '1', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', border: '2px solid ' + (on ? (it.real ? 'var(--c3)' : 'var(--c2)') : 'transparent'), background: 'var(--surface2)' } }, it.real ? '●' : '·')); });
    const fn = 50 - tp; const prec = tp + fp ? tp / (tp + fp) : 1, rec = tp / 50;
    out.innerHTML = `סימנת ${tp + fp}: <span class="good">${tp} נכונים</span>, <span class="bad">${fp} שגויים</span>, ופספסת ${fn}. &nbsp; <b>דיוק</b> = ${tp}/${tp + fp} = ${V.fmt(prec * 100, 0)}% &nbsp; <b>רגישות</b> = ${tp}/50 = ${V.fmt(rec * 100, 0)}%`;
  }
  draw();
};

W.x9_1 = function (box) { V.ask(box, 'לנתונים 2, 4, 4, 4, 5, 5, 7, 9: כתוב ממוצע, שונות וסטיית תקן:', s => { const n = V.nums(s); return n[0] === 5 && n[1] === 4 && n[2] === 2; }, 'ממוצע 5, שונות 4, סטיית תקן 2'); };
W.x9_4 = function (box) { V.ask(box, 'המזהה סימן 60, מהם 30 נכונים, ובתמונה היו 40 מטרות. כתוב דיוק ורגישות באחוזים:', s => { const n = V.nums(s); return n[0] === 50 && n[1] === 75; }, 'דיוק 30/60 = 50%, רגישות 30/40 = 75%'); };
})();
