/* Module 0 widgets — chapters 4–6: homogeneous coordinates, linear systems & decompositions, derivatives */
(function () {
const W = window.W, V = window.V, el = V.el;
const hr = box => box.appendChild(el('hr', { style: { border: 0, borderTop: '1px dashed var(--line2)' } }));
const SQ = [[0, 0], [1, 0], [1, 1], [0, 1]];

/* ===== chapter 4 ===== */
W.w_translate_fail = function (box) {
  V.say(box, '<b>אתגר:</b> נסה לבנות מטריצה 2×2 שמזיזה את הריבוע 2 צעדים ימינה. שחק עם ארבעת המספרים… ושים לב לנקודה האדומה בראשית: היא אף פעם לא זזה.');
  const M = [[1, 0], [0, 1]];
  const r = V.row(box);
  [['a', 0, 0], ['b', 0, 1], ['c', 1, 0], ['d', 1, 1]].forEach(([n, i, j]) => V.slider(r, n, -2, 3, 0.1, M[i][j], v => { M[i][j] = v; draw(); }));
  const P = V.plane(box, { w: 380, h: 320, x: [-2, 5], y: [-2, 4] });
  const out = V.say(box);
  function draw() {
    P.clear(); P.poly([[2, 0], [3, 0], [3, 1], [2, 1]], 'var(--c3)', 'var(--c3)', .15).setAttribute('stroke-dasharray', '5 4');
    P.text(2.5, 1.3, 'היעד', 'var(--c3)', 12);
    P.poly(SQ.map(p => V.mul2(M, p)), 'var(--c1)', null, .35);
    P.dot(0, 0, 7, 'var(--c2)');
    out.innerHTML = 'M · (0, 0) = (0, 0), תמיד. כפל מטריצה לא יכול להזיז את האפס, ולכן <b>אין</b> מטריצה 2×2 שעושה הזזה. הפתרון בסעיף הבא: רכיב שלישי.';
  }
  draw();
};

W.w_homog = function (box) {
  V.say(box, 'הטריק: כותבים (x, y, 1). האחד "פוגש" את העמודה השלישית, וכך ההזחה נכנסת פנימה. הזז את tₓ ואת tᵧ, ובחר נקודה.');
  let tx = 3, ty = 1, p = [1, 2];
  const r = V.row(box); V.slider(r, 'tₓ', -3, 4, 0.5, tx, v => { tx = v; draw(); }); V.slider(r, 'tᵧ', -3, 3, 0.5, ty, v => { ty = v; draw(); });
  const st = el('div', { style: { textAlign: 'center' } }); box.appendChild(st);
  const P = V.plane(box, { w: 380, h: 300, x: [-2, 6], y: [-2, 5] });
  const h = P.handle(p[0], p[1], 'var(--c1)', (x, y) => { p = [x, y]; draw(); });
  function draw() {
    st.innerHTML = window.texHTML(`\\begin{pmatrix} 1 & 0 & \\color{#e8590c}{${tx}} \\\\ 0 & 1 & \\color{#e8590c}{${ty}} \\\\ 0 & 0 & 1 \\end{pmatrix} \\begin{pmatrix} ${p[0]} \\\\ ${p[1]} \\\\ \\color{#0ca678}{1} \\end{pmatrix} = \\begin{pmatrix} ${p[0]} + \\color{#0ca678}{1}\\cdot\\color{#e8590c}{${tx}} \\\\ ${p[1]} + \\color{#0ca678}{1}\\cdot\\color{#e8590c}{${ty}} \\\\ 1 \\end{pmatrix} = \\begin{pmatrix} ${p[0] + tx} \\\\ ${p[1] + ty} \\\\ 1 \\end{pmatrix}`);
    P.clear(); P.poly(SQ.map(q => [q[0] + p[0] - .5, q[1] + p[1] - .5]), 'var(--line2)', null, .2); P.poly(SQ.map(q => [q[0] + p[0] - .5 + tx, q[1] + p[1] - .5 + ty]), 'var(--c1)', null, .3);
    P.arrow(p[0], p[1], p[0] + tx, p[1] + ty, 'var(--c2)', 3, 't'); P.dot(p[0] + tx, p[1] + ty, 6, 'var(--c1)');
  }
  draw();
  hr(box);
  V.say(box, '<b>סיבוב תמונה סביב המרכז שלה</b> בשלושה שלבים: M = T(c) · R · T(−c). קוראים מימין לשמאל.');
  const P2 = V.plane(box, { w: 420, h: 330, x: [-400, 800], y: [-350, 600], grid: false });
  const img = [[0, 0], [640, 0], [640, 480], [0, 480]], c = [320, 240];
  const say = V.say(box);
  const steps = [
    ['התמונה במקומה. הפינה השמאלית העליונה בראשית, והמרכז ב־(320, 240).', p => p],
    ['שלב 1, T(−c): מזיזים את המרכז לראשית.', p => [p[0] - 320, p[1] - 240]],
    ['שלב 2, R: מסובבים ב־90° סביב הראשית. המרכז נמצא בראשית, אז הוא לא זז.', p => V.mul2(V.rot(90), [p[0] - 320, p[1] - 240])],
    ['שלב 3, T(c): מחזירים. התמונה סובבה סביב המרכז שלה, והמרכז נשאר ב־(320, 240) ✓', p => { const q = V.mul2(V.rot(90), [p[0] - 320, p[1] - 240]); return [q[0] + 320, q[1] + 240]; }],
    ['לעומת זאת, סיבוב "רגיל" בלי ההזזות מסובב סביב הפינה, והתמונה בורחת מהמסך ✗', p => V.mul2(V.rot(90), p)]];
  V.stepper(box, steps.length, i => {
    P2.clear(); P2.poly(img, 'var(--line2)', null, .12); P2.dot(320, 240, 4, 'var(--ink3)'); P2.dot(0, 0, 5, 'var(--c2)');
    const f = steps[i][1]; P2.poly(img.map(f), i === 4 ? 'var(--c2)' : 'var(--c1)', null, .3); const cc = f(c); P2.dot(cc[0], cc[1], 6, 'var(--c3)');
    say.innerHTML = steps[i][0];
  }, { speed: 1500 });
};

W.w_affine = function (box) {
  V.say(box, 'טרנספורמציה אפינית נקבעת לגמרי על ידי 3 נקודות. גרור את שלוש הנקודות הצבעוניות: הרשת מתעוותת, אבל <b>קווים מקבילים נשארים מקבילים</b>. ריבוע יהפוך למקבילית, אף פעם לא לטרפז.');
  const P = V.plane(box, { w: 400, h: 360, x: [-1, 6], y: [-1, 5] });
  const src = [[0, 0], [3, 0], [0, 3]]; let dst = [[0.5, 0.5], [4, 1], [1, 3.5]];
  const out = V.say(box);
  function aff() { // solve [a b tx; c d ty] from 3 pairs
    const A = [], b = []; src.forEach(([x, y], k) => { A.push([x, y, 1, 0, 0, 0]); b.push(dst[k][0]); A.push([0, 0, 0, x, y, 1]); b.push(dst[k][1]); });
    const h = V.solve(A, b); return h ? (p => [h[0] * p[0] + h[1] * p[1] + h[2], h[3] * p[0] + h[4] * p[1] + h[5]]) : null; }
  function draw() {
    P.clear(); const f = aff(); if (!f) return;
    for (let k = 0; k <= 3; k++) { P.path([f([k, 0]), f([k, 3])], 'var(--c1)', 1.2); P.path([f([0, k]), f([3, k])], 'var(--c4)', 1.2); }
    P.poly([[0, 0], [3, 0], [3, 3], [0, 3]].map(f), 'var(--c5)', null, .18);
    out.innerHTML = '6 מספרים לא ידועים (שתי שורות של 3), וכל נקודה נותנת 2 משוואות, ולכן 3 נקודות בדיוק מספיקות.';
  }
  const cols = ['var(--c2)', 'var(--c3)', 'var(--c6)'];
  dst.forEach((d, k) => P.handle(d[0], d[1], cols[k], (x, y) => { dst[k] = [x, y]; draw(); }, { snap: 0.25 }));
  draw();
};

W.w_homography = function (box) {
  V.say(box, 'צילמת שלט מזווית. גרור את <b>ארבע הפינות</b> שלו בתמונה. ההומוגרפיה מחשבת לכל נקודה (x, y, 1) את (x′, y′, w), ו<b>מחלקת ב־w</b>. נקודות עם w גדול "מתכווצות", בדיוק כמו עצמים רחוקים.');
  const P = V.plane(box, { w: 420, h: 360, x: [-1, 7], y: [-1, 5.5] });
  const src = [[0, 0], [4, 0], [4, 2], [0, 2]];
  let dst = [[0.5, 0.3], [5.8, 0.9], [5.2, 3.2], [1, 4.6]];
  const out = V.say(box); const hout = el('div', { class: 'mono note-small', style: { direction: 'ltr', textAlign: 'center' } }); box.appendChild(hout);
  function draw() {
    P.clear(); const H = V.homography(src, dst); if (!H) return;
    for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) { const q = [[i / 2, j / 2], [(i + 1) / 2, j / 2], [(i + 1) / 2, (j + 1) / 2], [i / 2, (j + 1) / 2]].map(p => V.applyH(H, p)); P.poly(q, (i + j) % 2 ? 'var(--c1)' : 'var(--c5)', 'none', .35); }
    for (let k = 0; k <= 8; k++) P.path([0, 1, 2, 3, 4].map(j => V.applyH(H, [k / 2, j / 2])), 'var(--ink3)', .6);
    const ws = src.map(p => V.applyH(H, p)[2]);
    out.innerHTML = 'w בכל פינה: ' + ws.map(w => '<span class="chip mono">' + V.fmt(w) + '</span>').join(' ') + '. קווים שהיו מקבילים כבר לא מקבילים.';
    hout.textContent = 'H = [' + H.map(r => '[' + r.map(v => V.fmt(v, 2)).join(', ') + ']').join(', ') + ']   (8 דרגות חופש: הספרה האחרונה קבועה 1)';
  }
  dst.forEach((d, k) => P.handle(d[0], d[1], ['var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c6)'][k], (x, y) => { dst[k] = [x, y]; draw(); }, { snap: 0.1 }));
  draw();
  hr(box);
  V.say(box, '<b>חלוקה ברכיב האחרון:</b> הקלד נקודה הומוגנית ותראה לאיזו נקודה רגילה היא שווה.');
  const r = V.row(box); r.style.direction = 'ltr';
  const inp = el('input', { value: '(6, 4, 2)', style: { width: '140px' } }); const res = el('span', { class: 'mono big' }); r.append(inp, el('span', {}, ' → '), res);
  const calc = () => { const n = V.nums(inp.value); res.textContent = n.length === 3 && n[2] ? '(' + V.fmt(n[0] / n[2]) + ', ' + V.fmt(n[1] / n[2]) + ')' : '?'; }; inp.oninput = calc; calc();
};

W.w_pinhole = function (box) {
  V.say(box, 'מבט מהצד על מצלמה: עצם בגובה H נמצא במרחק Z. על החיישן הוא נראה בגובה <b>f · H / Z</b>. הרחק את העצם ותראה אותו מתכווץ. זו בדיוק החלוקה ב־w.');
  let Z = 20, H = 1.8, f = 800;
  const r = V.row(box); V.slider(r, 'מרחק Z (מטר)', 5, 60, 1, Z, v => { Z = v; draw(); }); V.slider(r, 'גובה H (מטר)', 0.5, 3, 0.1, H, v => { H = v; draw(); }); V.slider(r, 'f (פיקסלים)', 300, 1500, 50, f, v => { f = v; draw(); });
  const svg = V.s('svg', { viewBox: '0 0 620 220', width: 620 }); const w = el('div', { style: { display: 'flex', justifyContent: 'center' } }); w.appendChild(svg); box.appendChild(w);
  const out = V.say(box);
  function draw() {
    svg.innerHTML = ''; const cx = 120, gy = 160; const sx = 7.5, sy = 40;
    V.s('line', { x1: 0, y1: gy, x2: 620, y2: gy, style: { stroke: 'var(--line2)' } }, svg);
    V.s('rect', { x: cx - 40, y: gy - 60, width: 40, height: 60, rx: 6, style: { fill: 'var(--surface2)', stroke: 'var(--ink3)' } }, svg);
    const hpx = f * H / Z; const sensor = Math.min(70, hpx / 12);
    V.s('line', { x1: cx - 34, y1: gy - 30, x2: cx - 34, y2: gy - 30 + sensor, style: { stroke: 'var(--c2)', strokeWidth: 5 } }, svg);
    const ox = cx + Z * sx; V.s('line', { x1: ox, y1: gy, x2: ox, y2: gy - H * sy, style: { stroke: 'var(--c1)', strokeWidth: 6 }, 'stroke-linecap': 'round' }, svg);
    V.s('circle', { cx: ox, cy: gy - H * sy - 7, r: 7, style: { fill: 'var(--c1)' } }, svg);
    V.s('line', { x1: ox, y1: gy - H * sy, x2: cx - 34, y2: gy - 30 + sensor, style: { stroke: 'var(--c5)', strokeDasharray: '4 3' } }, svg);
    V.s('line', { x1: ox, y1: gy, x2: cx - 34, y2: gy - 30, style: { stroke: 'var(--c5)', strokeDasharray: '4 3' } }, svg);
    V.s('circle', { cx: cx, cy: gy - 30, r: 3, style: { fill: 'var(--ink)' } }, svg);
    V.s('text', { x: (cx + ox) / 2, y: gy + 22, 'text-anchor': 'middle', 'font-size': 13, style: { fill: 'var(--ink2)' }, text: 'Z = ' + Z + ' m' }, svg);
    V.s('text', { x: cx - 20, y: gy + 22, 'text-anchor': 'middle', 'font-size': 12, style: { fill: 'var(--c2)' }, text: 'חיישן' }, svg);
    out.innerHTML = '<span class="mono" style="direction:ltr;display:inline-block">' + f + ' · ' + V.fmt(H, 1) + ' / ' + Z + ' = <b>' + V.fmt(hpx, 1) + '</b> פיקסלים</span>' + (Z === 20 && f === 800 && Math.abs(H - 1.8) < 1e-6 ? ' ← בדיוק תרגיל 4.3: 72 פיקסלים' : '') + '. מרחק כפול → גובה חצי.';
  }
  draw();
};

W.x4_2 = function (box) {
  V.say(box, 'סמן את כל הנקודות ההומוגניות ששוות ל־(1, 2) כנקודה רגילה (חלק בכל רכיב האחרון):');
  const pts = ['(2, 4, 2)', '(1, 2, 1)', '(3, 6, 2)', '(−1, −2, −1)'], good = [0, 1, 3]; const pick = new Set();
  const r = V.row(box); const fb = V.say(box);
  pts.forEach((p, i) => { const b = V.button(p, () => { pick.has(i) ? pick.delete(i) : pick.add(i); b.classList.toggle('sel'); b.style.background = pick.has(i) ? 'var(--accent-bg)' : ''; const ok = good.length === pick.size && good.every(g => pick.has(g)); fb.innerHTML = ok ? '<span class="good">✓ נכון! (3, 6, 2) היא (1.5, 3), אחרת.</span>' : ''; }, 'sm mono'); r.appendChild(b); });
};
W.x4_3 = function (box) { V.ask(box, 'f = 800, אדם בגובה 1.8 מטר במרחק 20 מטר. כמה פיקסלים גובהו בתמונה?', s => Math.abs(V.nums(s)[0] - 72) < 0.6, '800 · 1.8 / 20 = 72. במרחק 40: 36.'); };

/* ===== chapter 5 ===== */
W.w_lines = function (box) {
  V.say(box, 'כל משוואה היא קו. הפתרון הוא הנקודה שבה הקווים נפגשים. שנה את המקדמים: כשהקווים מקבילים אין פתרון, והמטריצה סינגולרית.');
  let A = [[2, 1], [1, 3]], b = [5, 10];
  const r = V.row(box);
  V.slider(r, 'a₁₁', -3, 3, 0.5, 2, v => { A[0][0] = v; draw(); }); V.slider(r, 'a₁₂', -3, 3, 0.5, 1, v => { A[0][1] = v; draw(); }); V.slider(r, 'a₂₁', -3, 3, 0.5, 1, v => { A[1][0] = v; draw(); }); V.slider(r, 'a₂₂', -3, 3, 0.5, 3, v => { A[1][1] = v; draw(); });
  const P = V.plane(box, { w: 380, h: 340, x: [-2, 6], y: [-2, 6] }); const out = V.say(box);
  function line(a, c, col) { if (Math.abs(a[1]) > 1e-9) P.fn(x => (c - a[0] * x) / a[1], col, 3); else if (Math.abs(a[0]) > 1e-9) P.line(c / a[0], -2, c / a[0], 6, col, 3); }
  function draw() {
    P.clear(); line(A[0], b[0], 'var(--c1)'); line(A[1], b[1], 'var(--c2)');
    const d = V.det2(A);
    if (Math.abs(d) < 1e-9) { out.innerHTML = '<span class="bad">הקווים מקבילים (det = 0): אין פתרון יחיד.</span>'; return; }
    const x = (b[0] * A[1][1] - A[0][1] * b[1]) / d, y = (A[0][0] * b[1] - b[0] * A[1][0]) / d; P.dot(x, y, 7, 'var(--c3)');
    out.innerHTML = '<span style="color:var(--c1)">' + V.fmt(A[0][0]) + 'x + ' + V.fmt(A[0][1]) + 'y = 5</span>, <span style="color:var(--c2)">' + V.fmt(A[1][0]) + 'x + ' + V.fmt(A[1][1]) + 'y = 10</span> &nbsp;→ נפגשים ב־<b class="mono">(' + V.fmt(x) + ', ' + V.fmt(y) + ')</b>' + (A[0][0] === 2 && A[0][1] === 1 && A[1][0] === 1 && A[1][1] === 3 ? ' ← x = 1, y = 3 כמו בטקסט.' : '');
  }
  draw();
};

W.w_lsq = function (box) {
  V.say(box, 'יש יותר נקודות מאשר מה שקו אחד יכול לעבור דרכו. ריבועים פחותים מוצא את הקו שמקטין את <b>סכום שטחי הריבועים</b> (השגיאות בריבוע). גרור נקודות, או הוסף נקודה חריגה ותראה איך היא "מושכת" את הקו.');
  let pts = [[1, 12.1], [2, 13.8], [3, 15.9], [4, 17.6], [5, 19.9], [6, 21.6]];
  const P = V.plane(box, { w: 440, h: 340, x: [0, 8], y: [8, 26], step: 2, labelStep: 2 });
  const out = V.say(box); let handles = [];
  V.btns(box, [['נקודה חריגה', () => { pts.push([7, 12]); rebuild(); }], ['↺ מחדש', () => { pts = [[1, 12.1], [2, 13.8], [3, 15.9], [4, 17.6], [5, 19.9], [6, 21.6]]; rebuild(); }]]);
  function fit() { const n = pts.length, sx = pts.reduce((s, p) => s + p[0], 0), sy = pts.reduce((s, p) => s + p[1], 0), sxx = pts.reduce((s, p) => s + p[0] * p[0], 0), sxy = pts.reduce((s, p) => s + p[0] * p[1], 0); const m = (n * sxy - sx * sy) / (n * sxx - sx * sx); return [m, (sy - m * sx) / n]; }
  function draw() {
    P.clear(); const [m, c] = fit(); let E = 0;
    pts.forEach(([x, y]) => { const yh = m * x + c, e = y - yh; E += e * e; const a = P.Y(y), b = P.Y(yh), side = Math.abs(a - b); V.s('rect', { x: P.X(x), y: Math.min(a, b), width: side, height: side, style: { fill: 'var(--c2)', fillOpacity: .18, stroke: 'var(--c2)', strokeWidth: 1 } }, P.layer); });
    P.fn(x => m * x + c, 'var(--c1)', 3);
    out.innerHTML = 'הקו הטוב ביותר: <span class="mono">y = ' + V.fmt(m) + 'x + ' + V.fmt(c) + '</span> &nbsp; סכום השגיאות בריבוע: <b>' + V.fmt(E) + '</b>' + (pts.length > 6 ? ' &nbsp;← נקודה חריגה אחת משכה את כל הקו. לכן בראייה ממוחשבת משתמשים ב־RANSAC.' : '');
  }
  function rebuild() { handles.forEach(h => h.el.remove()); handles = pts.map((p, k) => P.handle(p[0], p[1], 'var(--c4)', (x, y) => { pts[k] = [x, y]; draw(); }, { snap: 0.1, r: 7 })); draw(); }
  rebuild();
};

W.w_eigen = function (box) {
  V.say(box, 'המטריצה מסובבת ומותחת כמעט כל חץ. אבל יש כיוונים מיוחדים שבהם החץ רק <b>נמתח</b> ונשאר על הקו שלו: אלה הווקטורים העצמיים. הזז את הסליידר ותראה איזה חץ לא סוטה.');
  let A = [[2, 1], [1, 2]], t = 1;
  const presets = { 'סימטרית [[2,1],[1,2]]': [[2, 1], [1, 2]], 'הגדלה [[2,0],[0,0.5]]': [[2, 0], [0, 0.5]], 'שונות משותפת [[4,3],[3,4]]': [[4, 3], [3, 4]].map(r => r.map(v => v / 2)) };
  V.tabs(box, Object.keys(presets), (i, l) => { A = presets[l]; draw(); });
  const P = V.plane(box, { w: 400, h: 400, x: [-4, 4], y: [-4, 4] });
  V.slider(V.row(box), 'הפעלת המטריצה', 0, 1, 0.02, 1, v => { t = v; draw(); });
  const out = V.say(box);
  function eig(M) { const tr = M[0][0] + M[1][1], d = V.det2(M), disc = Math.sqrt(Math.max(0, tr * tr / 4 - d)); const l1 = tr / 2 + disc, l2 = tr / 2 - disc; const vec = l => Math.abs(M[0][1]) > 1e-9 ? [M[0][1], l - M[0][0]] : Math.abs(M[1][0]) > 1e-9 ? [l - M[1][1], M[1][0]] : (l === M[0][0] ? [1, 0] : [0, 1]); return [[l1, vec(l1)], [l2, vec(l2)]]; }
  function draw() {
    P.clear(); const Mt = [[1 + (A[0][0] - 1) * t, A[0][1] * t], [A[1][0] * t, 1 + (A[1][1] - 1) * t]];
    const E = eig(A).map(([l, v]) => { const n = Math.hypot(...v); return [l, [v[0] / n, v[1] / n]]; });
    for (let k = 0; k < 24; k++) { const a = k / 24 * 2 * Math.PI; const v = [Math.cos(a), Math.sin(a)]; const w = V.mul2(Mt, v); const special = E.some(([l, e]) => Math.abs(Math.abs(v[0] * e[0] + v[1] * e[1]) - 1) < 0.03); P.arrow(0, 0, w[0], w[1], special ? 'var(--c2)' : 'var(--c1)', special ? 3.5 : 1.5); }
    E.forEach(([l, e]) => P.line(-e[0] * 6, -e[1] * 6, e[0] * 6, e[1] * 6, 'var(--c2)', 1, '4 4'));
    out.innerHTML = 'וקטורים עצמיים (באדום): ' + E.map(([l, e]) => '<span class="chip mono">(' + V.fmt(e[0]) + ', ' + V.fmt(e[1]) + ') × λ = ' + V.fmt(l) + '</span>').join(' ') + '. רק נמתחים פי λ, לא מסתובבים.';
  }
  draw();
};

W.w_svd = function (box) {
  V.say(box, 'כל מטריצה היא <b>סיבוב → מתיחה → סיבוב</b>. צפה במעגל היחידה הופך לאליפסה בשלושה שלבים: Vᵀ מסובב, Σ מותח לאורך הצירים, ו־U מסובב שוב. אורכי צירי האליפסה הם הערכים הסינגולריים.');
  let A = [[2, 1], [0.5, 1.5]];
  const P = V.plane(box, { w: 400, h: 380, x: [-3.5, 3.5], y: [-3.5, 3.5] });
  const say = V.say(box);
  function svd2(M) { const s = V.svd(M); return s; }
  const S = svd2(A);
  const circ = [...Array(73)].map((_, i) => [Math.cos(i / 72 * 2 * Math.PI), Math.sin(i / 72 * 2 * Math.PI)]);
  const Vt = S.Vt, U = [[S.U[0][0], S.U[1][0]], [S.U[0][1], S.U[1][1]]].map((r, i) => r), sig = S.s;
  const Um = [[S.U[0][0], S.U[1][0]], [S.U[0][1], S.U[1][1]]];
  const stages = [
    ['מעגל היחידה, עם שני חיצים מסומנים.', p => p],
    ['Vᵀ: סיבוב (או שיקוף). המעגל נשאר מעגל.', p => V.mul2(Vt, p)],
    [`Σ: מתיחה לאורך הצירים, פי ${V.fmt(sig[0])} ופי ${V.fmt(sig[1])}. עכשיו זו אליפסה.`, p => { const q = V.mul2(Vt, p); return [q[0] * sig[0], q[1] * sig[1]]; }],
    ['U: סיבוב לכיוון הסופי. התוצאה זהה בדיוק להפעלת A ישירות ✓', p => { const q = V.mul2(Vt, p); return V.mul2(Um, [q[0] * sig[0], q[1] * sig[1]]); }]];
  V.stepper(box, stages.length, i => {
    P.clear(); const f = stages[i][1]; P.path(circ, 'var(--line2)', 1.5, '4 4'); P.poly(circ.map(f), 'var(--c1)', null, .2);
    const a = f([1, 0]), b = f([0, 1]); P.arrow(0, 0, a[0], a[1], 'var(--c2)', 3); P.arrow(0, 0, b[0], b[1], 'var(--c3)', 3);
    if (i === 3) { const d = V.mul2(A, [1, 0]); P.dot(d[0], d[1], 5, 'var(--ink)'); }
    say.innerHTML = stages[i][0];
  }, { speed: 1600 });
};

W.w_svd_img = function (box) {
  V.say(box, '<b>דחיסת תמונה עם SVD:</b> שומרים רק את k הערכים הסינגולריים הגדולים. הזז את k ותראה את התמונה "מתחדדת". עם מעט ערכים כבר מזהים את הבית.');
  const G = V.scene(64, 48);
  const S = V.svd(G);
  const r = V.row(box); r.style.direction = 'ltr'; r.style.justifyContent = 'center';
  const c1 = V.canvas(r, 64, 48, 4), c2 = V.canvas(r, 64, 48, 4); V.drawGray(c1, G);
  const sv = el('div', { style: { height: '70px', display: 'flex', alignItems: 'flex-end', gap: '2px', direction: 'ltr', justifyContent: 'center' } }); box.appendChild(sv);
  const out = V.say(box);
  function draw(k) {
    const R = G.map((row, y) => row.map((_, x) => { let s = 0; for (let i = 0; i < k; i++) s += S.U[i][y] * S.s[i] * S.Vt[i][x]; return s; }));
    V.drawGray(c2, R);
    sv.innerHTML = S.s.slice(0, 40).map((s, i) => `<div style="width:7px;height:${Math.max(2, 66 * Math.sqrt(s / S.s[0]))}px;background:${i < k ? 'var(--c1)' : 'var(--line2)'};border-radius:2px"></div>`).join('');
    out.innerHTML = `k = ${k}: שומרים k × (גובה + רוחב + 1) = ${k} × ${48 + 64 + 1} = <b>${k * 113}</b> מספרים, במקום 48 × 64 = <b>3072</b>. העמודות הכחולות הן הערכים הסינגולריים שנשמרו.`;
  }
  V.slider(V.row(box), 'k', 1, 40, 1, 5, draw); draw(5);
};

W.x5_1 = function (box) { V.ask(box, 'פתור: x + y + z = 6,  2y + 5z = −4,  2x + 5y − z = 27. כתוב x, y, z:', s => { const n = V.nums(s.replace(/−/g, '-')); return n[0] === 5 && n[1] === 3 && n[2] === -2; }, 'x = 5, y = 3, z = −2. בקוד: np.linalg.solve(A, b).'); };

/* ===== chapter 6 ===== */
W.w_tangent = function (box) {
  V.say(box, 'נגזרת היא "כמה מהר הפונקציה עולה בנקודה". שני הסליידרים: בחר נקודה, ואז <b>הקטן את h</b>. הקו בין שתי הנקודות (מיתר) הופך לקו המשיק, והשיפוע שלו הוא הנגזרת.');
  const fs = { 'x²': [x => x * x, x => 2 * x], 'x³ − 3x': [x => x ** 3 - 3 * x, x => 3 * x * x - 3], 'sin x': [Math.sin, Math.cos] };
  let F = fs['x²'], x0 = 1, h = 1.5, name = 'x²';
  V.tabs(box, Object.keys(fs), (i, l) => { F = fs[l]; name = l; draw(); });
  const r = V.row(box); V.slider(r, 'x', -2.5, 2.5, 0.1, x0, v => { x0 = v; draw(); }); V.slider(r, 'h', 0.01, 2, 0.01, h, v => { h = v; draw(); });
  const P = V.plane(box, { w: 440, h: 340, x: [-3, 3], y: [-3, 6] }); const out = V.say(box);
  function draw() {
    P.clear(); P.fn(F[0], 'var(--c1)', 3);
    const y0 = F[0](x0), y1 = F[0](x0 + h), sl = (y1 - y0) / h, d = F[1](x0);
    P.fn(x => y0 + sl * (x - x0), 'var(--c2)', 1.8);
    P.fn(x => y0 + d * (x - x0), 'var(--c3)', 1.5);
    P.dot(x0, y0, 6, 'var(--ink)'); P.dot(x0 + h, y1, 5, 'var(--c2)');
    out.innerHTML = `שיפוע המיתר: (f(x+h) − f(x)) / h = <b style="color:var(--c2)">${V.fmt(sl, 3)}</b> &nbsp;→ כש־h קטן, שואף לנגזרת: <b style="color:var(--c3)">f′(${V.fmt(x0, 1)}) = ${V.fmt(d, 3)}</b>`;
  }
  draw();
};

W.w_rules = function (box) {
  V.say(box, 'בחר פונקציה מהטבלה. למעלה הפונקציה, למטה הנגזרת שלה. גרור את הנקודה: הגובה של הגרף התחתון שווה בדיוק לשיפוע של הגרף העליון.');
  const fs = [['xⁿ (n=3)', x => x ** 3, x => 3 * x * x], ['eˣ', Math.exp, Math.exp], ['ln x', x => Math.log(x), x => 1 / x], ['קבוע 2', () => 2, () => 0], ['x² + sin x (סכום)', x => x * x + Math.sin(x), x => 2 * x + Math.cos(x)]];
  let k = 0, x0 = 1;
  V.tabs(box, fs.map(f => f[0]), i => { k = i; draw(); });
  const r = V.row(box); r.style.justifyContent = 'center';
  const P1 = V.plane(r, { w: 300, h: 220, x: [-2, 3], y: [-3, 8] }), P2 = V.plane(r, { w: 300, h: 220, x: [-2, 3], y: [-3, 8] });
  V.slider(V.row(box), 'x', -1.9, 2.9, 0.05, x0, v => { x0 = v; draw(); });
  const out = V.say(box);
  function draw() {
    const [n, f, d] = fs[k]; const X0 = n === 'ln x' ? Math.max(0.15, x0) : x0;
    [P1, P2].forEach(P => P.clear());
    P1.fn(x => n === 'ln x' && x <= 0 ? NaN : f(x), 'var(--c1)', 3); P2.fn(x => n === 'ln x' && x <= 0 ? NaN : d(x), 'var(--c4)', 3);
    const y = f(X0), s = d(X0); P1.fn(x => y + s * (x - X0), 'var(--c3)', 1.5); P1.dot(X0, y, 6, 'var(--ink)'); P2.dot(X0, s, 6, 'var(--c3)'); P2.line(X0, 0, X0, s, 'var(--c3)', 2, '3 3');
    P1.text(-1.6, 7, 'f(x)', 'var(--c1)', 13); P2.text(-1.6, 7, "f′(x)", 'var(--c4)', 13);
    out.innerHTML = 'בנקודה x = ' + V.fmt(X0) + ': שיפוע הקו הירוק למעלה = ' + V.fmt(s) + ' = הגובה של הנקודה למטה.';
  }
  draw();
};

W.w_sign = function (box) {
  V.say(box, 'הנגזרת אומרת לאן לזוז כדי לרדת: נגזרת <b>חיובית</b>, זזים שמאלה; <b>שלילית</b>, זזים ימינה; <b>אפס</b>, הגענו לתחתית. גרור את הכדור על f(x) = (x − 3)².');
  const P = V.plane(box, { w: 440, h: 300, x: [-1, 7], y: [-1, 10] }); const out = V.say(box);
  let x = 5;
  function draw() {
    P.clear(); P.fn(t => (t - 3) ** 2, 'var(--c1)', 3); const y = (x - 3) ** 2, d = 2 * (x - 3);
    P.fn(t => y + d * (t - x), 'var(--c3)', 1.3, 50, x - 1, x + 1);
    if (Math.abs(d) > 0.05) P.arrow(x, y + 0.9, x - Math.sign(d) * 1.2, y + 0.9, 'var(--c2)', 3);
    out.innerHTML = 'x = ' + V.fmt(x) + ', f′(x) = 2(x − 3) = <b>' + V.fmt(d) + '</b> → ' + (Math.abs(d) < 0.05 ? '<span class="good">אפס: זה המינימום (x = 3)</span>' : d > 0 ? 'חיובית: הפונקציה עולה, אז כדי לרדת זזים <b>שמאלה</b>' : 'שלילית: הפונקציה יורדת, אז זזים <b>ימינה</b>');
  }
  const h = P.handle(x, (x - 3) ** 2, 'var(--c2)', (nx) => { x = nx; h.set(x, (x - 3) ** 2); draw(); }, { snap: 0.1 });
  draw();
};

W.w_grad2d = function (box) {
  V.say(box, 'פונקציה של שני משתנים היא כמו מפת גבהים. הצבע הכהה נמוך והבהיר גבוה. גרור את הנקודה: החץ הוא <b>הגרדיאנט</b>, הכיוון שבו העלייה הכי תלולה. הוא תמיד ניצב לקווי הגובה.');
  const fs = { 'קערה x² + 2y²': [(x, y) => x * x + 2 * y * y, (x, y) => [2 * x, 4 * y]], 'גבעה ועמק': [(x, y) => Math.sin(x) * Math.cos(y) * 3, (x, y) => [3 * Math.cos(x) * Math.cos(y), -3 * Math.sin(x) * Math.sin(y)]], 'x²y + 5y (תרגיל 6.3)': [(x, y) => x * x * y + 5 * y, (x, y) => [2 * x * y, x * x + 5]] };
  let F = fs['קערה x² + 2y²'], p = [1.5, 1];
  V.tabs(box, Object.keys(fs), (i, l) => { F = fs[l]; bg(); draw(); });
  const P = V.plane(box, { w: 400, h: 400, x: [-3, 3], y: [-3, 3] });
  const img = V.s('image', { x: 0, y: 0, width: 400, height: 400, preserveAspectRatio: 'none' }); P.svg.insertBefore(img, P.svg.firstChild);
  const out = V.say(box);
  function bg() {
    const cv = document.createElement('canvas'); cv.width = 100; cv.height = 100; const ctx = cv.getContext('2d'); const im = ctx.createImageData(100, 100);
    let lo = Infinity, hi = -Infinity; const vals = [];
    for (let j = 0; j < 100; j++) for (let i = 0; i < 100; i++) { const v = F[0](-3 + i * 0.06, 3 - j * 0.06); vals.push(v); lo = Math.min(lo, v); hi = Math.max(hi, v); }
    vals.forEach((v, k) => { const t = (v - lo) / (hi - lo); const band = Math.abs(((t * 12) % 1) - 0.5) < 0.04; const c = band ? 60 : 40 + t * 200; im.data[k * 4] = c * 0.75; im.data[k * 4 + 1] = c * 0.85; im.data[k * 4 + 2] = c; im.data[k * 4 + 3] = 150; });
    ctx.putImageData(im, 0, 0); img.setAttribute('href', cv.toDataURL());
  }
  function draw() { P.clear(); const g = F[1](p[0], p[1]); const n = Math.hypot(...g) || 1; const s = Math.min(1.2, n) / n; P.arrow(p[0], p[1], p[0] + g[0] * s, p[1] + g[1] * s, 'var(--c2)', 3.5, '∇f'); P.arrow(p[0], p[1], p[0] - g[0] * s, p[1] - g[1] * s, 'var(--c3)', 2, '−∇f'); out.innerHTML = 'בנקודה (' + V.fmt(p[0]) + ', ' + V.fmt(p[1]) + '): ∂f/∂x = <b>' + V.fmt(g[0]) + '</b>, ∂f/∂y = <b>' + V.fmt(g[1]) + '</b>. החץ הירוק (מינוס הגרדיאנט) הוא כיוון הירידה, ומשם נמשיך בפרק 8.'; }
  P.handle(p[0], p[1], 'var(--c2)', (x, y) => { p = [x, y]; draw(); }, { snap: 0.1 });
  bg(); draw();
};

W.w_imggrad = function (box) {
  V.say(box, 'בתמונה, הנגזרת היא פשוט ההפרש בין פיקסל לשכן שלו. לחץ "הבא" כדי לחשב את <span class="mono">img[:, 1:] − img[:, :-1]</span> על שורה אחת: איפה שיש קצה, ההפרש קופץ.');
  const row = [0, 0, 0, 100, 100, 100];
  const st = el('div', { style: { direction: 'ltr', textAlign: 'center' } }); box.appendChild(st);
  const l1 = V.ltrRow(st); const A = V.matrix(l1, [row], { fmt: v => v }); A.cells[0].forEach((c, i) => c.style.background = `rgb(${row[i] * 2.2},${row[i] * 2.2},${row[i] * 2.2})`); A.cells[0].forEach((c, i) => c.style.color = row[i] > 50 ? '#000' : '#fff');
  const l2 = V.ltrRow(st); const D = V.matrix(l2, [['', '', '', '', '']], { fmt: v => v });
  const say = V.say(box);
  V.stepper(box, 6, k => {
    D.vals([[0, 1, 2, 3, 4].map(i => i < k ? row[i + 1] - row[i] : '')]); D.cls((r, c) => c < k ? (row[c + 1] - row[c] ? 'warn' : 'ok') : '');
    A.cls((r, c) => k && (c === k - 1 || c === k) ? 'on' : ''); A.cells[0].forEach((c, i) => { if (!(k && (i === k - 1 || i === k))) { c.style.background = `rgb(${row[i] * 2.2},${row[i] * 2.2},${row[i] * 2.2})`; c.style.color = row[i] > 50 ? '#000' : '#fff'; } else { c.style.background = ''; c.style.color = ''; } });
    say.innerHTML = k ? `${row[k]} − ${row[k - 1]} = <b>${row[k] - row[k - 1]}</b>${row[k] - row[k - 1] ? ' ← כאן הקצה!' : ''}` : 'שורה אחת מתמונה: שמאל כהה, ימין בהיר.';
  }, { speed: 900 });
  hr(box);
  V.say(box, 'על תמונה אמיתית: גודל הגרדיאנט בכל פיקסל. הקצוות זוהרים.');
  const r = V.row(box); r.style.direction = 'ltr'; r.style.justifyContent = 'center';
  const G = V.scene(96, 72); const c1 = V.canvas(r, 96, 72, 3), c2 = V.canvas(r, 96, 72, 3); V.drawGray(c1, G);
  const gx = V.conv(G, [[0, 0, 0], [-1, 0, 1], [0, 0, 0]]), gy = V.conv(G, [[0, -1, 0], [0, 0, 0], [0, 1, 0]]);
  V.drawGray(c2, gx.map((r, y) => r.map((v, x) => Math.min(255, Math.hypot(v, gy[y][x]) * 2))));
};

W.x6_1 = function (box) {
  [['f(x) = 4x³ − 2x', ['12x² − 2', '4x² − 2', '12x³'], 0], ['f(x) = eˣ + ln x', ['eˣ + 1/x', 'xeˣ⁻¹ + x', 'eˣ − 1/x'], 0], ['f(x) = (x − 3)²', ['2x − 6', 'x − 3', '2x − 3'], 0]].forEach(([q, ch, c]) => V.quiz(box, 'מה הנגזרת של ' + q + '?', ch, c));
};
W.x6_3 = function (box) { V.ask(box, 'הגרדיאנט של f(x, y) = x²y + 5y בנקודה (2, 1) הוא:', s => { const n = V.nums(s); return n[0] === 4 && n[1] === 9; }, '(2xy, x² + 5) = (4, 9)'); };
})();
