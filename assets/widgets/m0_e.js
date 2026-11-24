/* Module 0 — extra visuals: 7.2 (build a computational graph), 12.2 (the model step by step), 12.3 (where the gradient comes from) */
(function () {
const W = window.W, V = window.V, el = V.el;
const sig = z => 1 / (1 + Math.exp(-z));

/* 7.2: build the graph of L = (w·x + b − y)² one operation at a time, then inspect each edge */
W.w_graph_intro = function (box) {
  V.say(box, 'כל חישוב מתפרק לפעולות קטנות. לחץ "הבא" כדי <b>לבנות</b> את הגרף של L = (w·x + b − y)², פעולה אחר פעולה. בסוף, <b>לחץ על כל קשת</b> כדי לראות את הנגזרת המקומית שלה.');
  const N = { w: [60, 50, 'w'], x: [60, 130, 'x'], b: [60, 210, 'b'], mul: [210, 90, '×'], add: [340, 150, '+'], y: [340, 40, 'y'], sub: [470, 100, '−'], sq: [590, 100, '( )²'] };
  const E = [['w', 'mul', '∂(w·x)/∂w = x'], ['x', 'mul', '∂(w·x)/∂x = w'], ['mul', 'add', '∂(u + b)/∂u = 1'], ['b', 'add', '∂(u + b)/∂b = 1'], ['add', 'sub', '∂(z − y)/∂z = 1'], ['y', 'sub', '∂(z − y)/∂y = −1'], ['sub', 'sq', '∂(d²)/∂d = 2d']];
  const build = [
    { n: ['w', 'x', 'b', 'y'], e: 0, s: 'מתחילים מהקלטים: המשקלות w ו־b, הקלט x, והתווית y. אלה העלים של הגרף.' },
    { n: ['mul'], e: 2, s: 'פעולה ראשונה: כפל. הצומת × מקבל את w ואת x ומוציא w·x.' },
    { n: ['add'], e: 4, s: 'פעולה שנייה: חיבור. מוסיפים את b ומקבלים z = w·x + b.' },
    { n: ['sub'], e: 6, s: 'פעולה שלישית: חיסור. כמה z רחוק מהתשובה: z − y.' },
    { n: ['sq'], e: 7, s: 'פעולה אחרונה: ריבוע. L = (z − y)². זה כל הגרף: ארבע פעולות פשוטות.' }];
  const svg = V.s('svg', { viewBox: '0 0 640 250', width: 640, style: { maxWidth: '100%' } }); const wr = el('div', { style: { display: 'flex', justifyContent: 'center', direction: 'ltr' } }); wr.appendChild(svg); box.appendChild(wr);
  const say = V.say(box); const info = V.say(box);
  let k = 0, sel = -1;
  function draw() {
    svg.innerHTML = '';
    const shown = new Set(); build.slice(0, k + 1).forEach(b => b.n.forEach(n => shown.add(n)));
    const ne = build[k].e;
    E.slice(0, ne).forEach(([a, c, d], i) => {
      const A = N[a], C = N[c];
      const ln = V.s('line', { x1: A[0] + 30, y1: A[1], x2: C[0] - 30, y2: C[1], style: { stroke: i === sel ? 'var(--c2)' : 'var(--c1)', strokeWidth: i === sel ? 5 : 3, cursor: 'pointer' } }, svg);
      const hit = V.s('line', { x1: A[0] + 30, y1: A[1], x2: C[0] - 30, y2: C[1], style: { stroke: 'transparent', strokeWidth: 18, cursor: 'pointer' } }, svg);
      const pick = () => { sel = i; draw(); };
      ln.addEventListener('click', pick); hit.addEventListener('click', pick);
    });
    Object.entries(N).forEach(([key, [cx, cy, lab]]) => {
      if (!shown.has(key)) return; const leaf = ['w', 'x', 'b', 'y'].includes(key);
      V.s('rect', { x: cx - 30, y: cy - 22, width: 60, height: 44, rx: leaf ? 22 : 10, style: { fill: leaf ? 'var(--surface2)' : 'var(--accent-bg)', stroke: 'var(--c1)', strokeWidth: 2 } }, svg);
      V.s('text', { x: cx, y: cy + 5, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, style: { fill: 'var(--ink)' }, text: lab }, svg);
    });
    say.innerHTML = build[k].s;
    info.innerHTML = k < build.length - 1 ? '<span class="note-small">המשך לבנות כדי שאפשר יהיה ללחוץ על כל הקשתות.</span>'
      : sel < 0 ? 'הגרף מוכן. <b>לחץ על קשת</b> כדי לראות את הנגזרת המקומית שלה.'
        : 'הקשת ' + E[sel][0] + ' → ' + E[sel][1] + ': <b class="ltr" style="display:inline-block">' + E[sel][2] + '</b>. כל צומת צריך לדעת רק את הנגזרת של עצמו. המעבר לאחור (סעיף 7.3) רק מכפיל אותן לאורך הדרך.';
  }
  V.stepper(box, build.length, i => { k = i; if (k < build.length - 1) sel = -1; draw(); }, { speed: 1800 });
};

/* 12.2: the model as a pipeline x → z → p → loss, live */
W.w_model_pipe = function (box) {
  V.say(box, 'המודל הוא שרשרת קצרה. בחר נקודה x ואת התווית שלה, ותראה כל שלב מחושב: <b>z = w·x + b</b>, אחר כך <b>p = σ(z)</b>, ובסוף <b>ההפסד</b>. כאן w = (1.5, −1) ו־b = 0.5 קבועים.');
  const w = [1.5, -1], b = 0.5; let x = [1, 1], y = 1;
  V.tabs(box, ['התווית y = 1', 'התווית y = 0'], i => { y = i === 0 ? 1 : 0; draw(); });
  const sr = V.row(box);
  V.slider(sr, 'x₁', -3, 3, 0.1, x[0], v => { x[0] = v; draw(); });
  V.slider(sr, 'x₂', -3, 3, 0.1, x[1], v => { x[1] = v; draw(); });
  const pipe = el('div', { class: 'row', style: { direction: 'ltr', justifyContent: 'center', alignItems: 'stretch', flexWrap: 'wrap', gap: '6px' } }); box.appendChild(pipe);
  const P = V.plane(box, { w: 420, h: 220, x: [-6, 6], y: [-0.1, 1.1], grid: false, labels: false });
  const out = V.say(box);
  const card = (t, v, c) => '<div style="border:1px solid var(--line2);border-radius:10px;padding:8px 10px;min-width:110px;text-align:center;background:var(--surface)"><div class="note-small">' + t + '</div><div style="font-weight:700;color:' + c + '">' + v + '</div></div>';
  const arrow = '<div style="align-self:center;color:var(--ink3);font-size:1.3em">→</div>';
  function draw() {
    const z = w[0] * x[0] + w[1] * x[1] + b, p = sig(z), loss = -(y * Math.log(p) + (1 - y) * Math.log(1 - p));
    pipe.innerHTML = card('x', '(' + V.fmt(x[0], 1) + ', ' + V.fmt(x[1], 1) + ')', 'var(--ink)') + arrow +
      card('z = w·x + b', V.fmt(1.5 * x[0], 2) + ' + ' + V.fmt(-x[1], 2) + ' + 0.5 = ' + V.fmt(z), 'var(--c1)') + arrow +
      card('p = σ(z)', V.fmt(p, 3), 'var(--c4)') + arrow +
      card('הפסד (y = ' + y + ')', V.fmt(loss, 3), loss > 1 ? 'var(--warn-ink, #b42318)' : 'var(--c3)');
    P.clear(); P.line(-6, 0.5, 6, 0.5, 'var(--line2)', 1, '4 4'); P.fn(sig, 'var(--c4)', 3);
    P.line(z, 0, z, p, 'var(--c1)', 1.5, '3 3'); P.dot(Math.max(-6, Math.min(6, z)), p, 7, 'var(--c1)');
    P.text(5.2, 0.08, 'z', 'var(--ink3)', 12); P.text(-5.3, 1.03, 'σ(z)', 'var(--ink3)', 12);
    out.innerHTML = (p > 0.5 ? 'המודל אומר מחלקה 1' : 'המודל אומר מחלקה 0') + ' (p = ' + V.fmt(p, 2) + '). ' +
      ((p > 0.5) === (y === 1) ? 'הוא צודק, ולכן ההפסד ' + (loss < 0.3 ? 'קטן.' : 'בינוני: הוא צודק אבל לא בטוח.') : '<b>הוא טועה</b>, וההפסד גדל ככל שהוא בטוח יותר בטעות.') +
      ' כשההפסד הוא −log p (או −log(1 − p) כש־y = 0), הקנס על טעות בטוחה עצום.';
  }
  draw();
};

/* 12.3: each point pushes w by −(p − y)·x; the sum is the gradient step */
W.w_grad_arrows = function (box) {
  V.say(box, 'הגרדיאנט הוא סכום של תרומות, אחת לכל נקודה: <b>(p − y)·x</b>. החץ ליד כל נקודה מראה לאן היא "מושכת" את w (בכיוון ההפוך לתרומה שלה). <b>גרור נקודות</b>: נקודה שהמודל צודק עליה בביטחון כמעט לא מושכת, ונקודה בצד הלא נכון מושכת חזק.');
  let w = [1, 0.6]; const b = 0;
  const pts = [[2, 1, 1], [1.5, 2.5, 1], [-0.5, 2, 1], [-2, -1, 0], [-1, -2.5, 0], [1, -1.5, 0]];
  const P = V.plane(box, { w: 420, h: 380, x: [-4, 4], y: [-3.6, 3.6] });
  const out = V.say(box);
  const hs = [];
  function draw() {
    P.clear();
    if (Math.abs(w[1]) > 1e-6) P.fn(x => -(w[0] * x + b) / w[1], 'var(--ink)', 2); else P.line(0, -4, 0, 4, 'var(--ink)', 2);
    let g = [0, 0], rows = '';
    pts.forEach(([x1, x2, y], i) => {
      const p = sig(w[0] * x1 + w[1] * x2 + b), e = p - y; g = [g[0] + e * x1, g[1] + e * x2];
      const s = 0.9; P.arrow(x1, x2, x1 - s * e * x1, x2 - s * e * x2, y ? 'var(--c1)' : 'var(--c2)', 2.5);
      rows += '<tr><td>' + (i + 1) + '</td><td>' + y + '</td><td>' + V.fmt(p, 2) + '</td><td><b>' + V.fmt(e, 2) + '</b></td><td>(' + V.fmt(e * x1, 2) + ', ' + V.fmt(e * x2, 2) + ')</td></tr>';
    });
    g = [g[0] / pts.length, g[1] / pts.length];
    P.arrow(0, 0, w[0], w[1], 'var(--c4)', 3.5, 'w');
    P.arrow(w[0], w[1], w[0] - 2 * g[0], w[1] - 2 * g[1], 'var(--c3)', 3, '−∇');
    out.innerHTML = '<table class="mini ltr" style="margin:auto;direction:ltr"><tr><th>#</th><th>y</th><th>p</th><th>p − y</th><th>(p − y)·x</th></tr>' + rows + '</table>' +
      '<div style="margin-top:6px">הגרדיאנט הממוצע לפי w: <b class="ltr" style="display:inline-block">(' + V.fmt(g[0], 3) + ', ' + V.fmt(g[1], 3) + ')</b>. החץ הירוק יוצא מקצה w ומראה לאן הצעד הבא יזיז אותו. נקודה שבה p − y קרוב לאפס לא תורמת כמעט כלום.</div>';
    hs.forEach((h, i) => h.set(pts[i][0], pts[i][1]));
  }
  pts.forEach((pt, i) => hs.push(P.handle(pt[0], pt[1], pt[2] ? 'var(--c1)' : 'var(--c2)', (x, y) => { pts[i][0] = x; pts[i][1] = y; draw(); }, { snap: 0.1, r: 7 })));
  P.handle(w[0], w[1], 'var(--c4)', (x, y) => { w = [x, y]; draw(); }, { snap: 0.1 });
  draw();
};
})();
