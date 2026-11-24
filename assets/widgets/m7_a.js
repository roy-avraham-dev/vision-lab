/* Module 7 visuals — chapters 1–5: embeddings, the contrastive loss, a tiny CLIP, zero-shot, SigLIP.
   Shared helpers in window.VL (shape drawing, softmax/sigmoid losses). */
(function () {
const W = window.W, V = window.V, el = V.el; const { f, ltr, mono, svgBox, txt, rng, randn } = window.BX; const { bar, hbars } = window.AC;
const COLS = { red: '#e03131', green: '#2f9e44', blue: '#1c7ed6', yellow: '#f2b705' }, HE = { red: 'אדום', green: 'ירוק', blue: 'כחול', yellow: 'צהוב', circle: 'עיגול', square: 'ריבוע', triangle: 'משולש', cross: 'צלב' };
const HELD = ['blue triangle', 'yellow circle', 'red square', 'green cross'];
function shape(svg, sh, col, cx, cy, r) { const st = { fill: COLS[col] || col };
  if (sh === 'circle') return V.s('circle', { cx, cy, r, style: st }, svg);
  if (sh === 'square') return V.s('rect', { x: cx - r * 0.85, y: cy - r * 0.85, width: r * 1.7, height: r * 1.7, style: st }, svg);
  if (sh === 'triangle') return V.s('polygon', { points: `${cx},${cy - r} ${cx + r},${cy + r * 0.8} ${cx - r},${cy + r * 0.8}`, style: st }, svg);
  const t = r * 0.38; return V.s('path', { d: `M${cx - t},${cy - r}h${2 * t}v${r - t}h${r - t}v${2 * t}h${-(r - t)}v${r - t}h${-2 * t}v${-(r - t)}h${-(r - t)}v${-2 * t}h${r - t}z`, style: st }, svg); }
const unit = v => { const n = Math.hypot(...v) || 1; return v.map(x => x / n); }, dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
function softmaxLoss(S, s) { const B = S.length; let L = 0; for (let i = 0; i < B; i++) { const r = S[i].map(x => x * s), m = Math.max(...r); L += -(r[i] - m - Math.log(r.reduce((a, x) => a + Math.exp(x - m), 0))); const c = S.map(row => row[i] * s), mc = Math.max(...c); L += -(c[i] - mc - Math.log(c.reduce((a, x) => a + Math.exp(x - mc), 0))); } return L / (2 * B); }
function sigmoidLoss(S, s, b) { const B = S.length; let L = 0; for (let i = 0; i < B; i++) for (let j = 0; j < B; j++) { const z = (i === j ? 1 : -1) * (s * S[i][j] + b); L += Math.log1p(Math.exp(-z)); } return L / B; }
window.VL = { COLS, HE, HELD, shape, unit, dot, softmaxLoss, sigmoidLoss };

/* 1.1 closed vs open last layer */
W.w7_closed_vs_open = function (box) {
  V.say(box, 'השכבה האחרונה היא מטריצה עם עמודה לכל מחלקה. <b>הוסף מחלקה</b> בשני העולמות.');
  let n = 3, open = false; const cls = ['אדם', 'רכב', 'משאית', 'טנדר לבן', 'אדם עם תיק גב']; V.tabs(box, ['מזהה סגור', 'עולם פתוח'], i => { open = i === 1; draw(); }); V.btns(box, [['הוסף מחלקה', () => { if (n < 5) n++; draw(); }, 'primary'], ['איפוס', () => { n = 3; draw(); }, 'ghost']]);
  const svg = svgBox(box, 480, 170); const out = V.say(box);
  function draw() { svg.innerHTML = ''; bar(svg, 20, 60, 50, 50, 'var(--c1)'); txt(svg, [24, 125], 'תכונות התמונה', { fontSize: '10px' }); txt(svg, [82, 90], '×', { fontSize: '20px' });
    for (let k = 0; k < n; k++) { const isNew = k >= 3; bar(svg, 110 + k * 70, 30, 54, 100, open && isNew ? 'var(--c3)' : isNew ? 'var(--c2)' : '#adb5bd'); V.s('text', { x: 137 + k * 70, y: 150, 'font-size': 10, 'text-anchor': 'middle', text: cls[k], style: { fill: 'var(--ink2)' } }, svg); if (isNew) V.s('text', { x: 137 + k * 70, y: 85, 'font-size': 10, 'text-anchor': 'middle', text: open ? 'מקודד מטקסט' : 'צריך אימון', style: { fill: '#fff' } }, svg); }
    out.innerHTML = n === 3 ? 'שלוש עמודות שנלמדו באימון.' : open ? 'העמודה החדשה היא פשוט הוקטור של המשפט "' + cls[n - 1] + '" ממקודד הטקסט. <b>בלי אימון.</b>' : 'עמודה חדשה = איסוף, תיוג ואימון מחדש (תרגיל 1.3).'; }
  draw();
};

/* 1.2 the small example */
W.w7_cosine3 = function (box) {
  V.say(box, 'שיכון של תמונה ושלושה משפטים בשלושה ממדים, כמו בדוגמה. <b>ערוך את הוקטורים</b> או נסה את תרגילים 1.2 ו־1.4.');
  const vs = { img: [0.9, 0.1, 0.4], s1: [0.85, 0.15, 0.45], s2: [0.05, 0.98, 0.1], s3: [0.2, 0.1, 1.0] }; const names = { img: 'תמונה', s1: '"a red car"', s2: '"a person"', s3: '"a truck"' }; const ins = {};
  const g = el('div', { style: { display: 'grid', gridTemplateColumns: 'auto auto', gap: '6px', direction: 'ltr', width: 'fit-content', margin: '0 auto' } }); box.appendChild(g);
  Object.keys(vs).forEach(k => { const i = el('input', { value: vs[k].join(', '), style: { width: '160px' } }); i.oninput = () => { const v = i.value.split(/[,\s]+/).map(Number).filter(x => !isNaN(x)); if (v.length === 3) { vs[k] = v; draw(); } }; ins[k] = i; g.append(el('span', {}, names[k]), i); });
  V.btns(box, [['תמונה × 10 (תרגיל 1.2)', () => { vs.img = vs.img.map(x => x * 10); ins.img.value = vs.img.join(', '); draw(); }], ['משפט = התמונה (תרגיל 1.4)', () => { vs.s2 = vs.img.slice(); ins.s2.value = vs.s2.join(', '); draw(); }], ['איפוס', () => { Object.assign(vs, { img: [0.9, 0.1, 0.4], s1: [0.85, 0.15, 0.45], s2: [0.05, 0.98, 0.1], s3: [0.2, 0.1, 1.0] }); Object.keys(vs).forEach(k => ins[k].value = vs[k].join(', ')); draw(); }, 'ghost']]);
  const tb = el('div'); box.appendChild(tb); const out = mono(box);
  function draw() { const c = ['s1', 's2', 's3'].map(k => dot(unit(vs.img), unit(vs[k]))); const d = ['s1', 's2', 's3'].map(k => dot(vs.img, vs[k])); tb.innerHTML = ''; hbars(tb, ['s1', 's2', 's3'].map((k, i) => [names[k], Math.max(0, c[i]), i === c.indexOf(Math.max(...c)) ? 'var(--c3)' : 'var(--c1)']), { lw: 100, max: 1.05, fmt: v => f(v, 3) });
    out.textContent = 'cosine:      ' + c.map(x => f(x, 3)).join('  ') + '\ndot product: ' + d.map(x => f(x, 3)).join('  ') + '   (not normalized)'; }
  draw();
};

/* 1.3 three families */
W.w7_families = function (box) {
  V.say(box, 'שלוש משפחות. <b>בחר משפחה</b> וראה מה נכנס ומה יוצא.');
  const F = [['מקודדים משותפים', 'תמונה, או טקסט', 'וקטור אחד לכל קלט', 'CLIP, SigLIP'], ['מזהים פתוחים', 'תמונה ורשימת תיאורים', 'קופסאות עם תיאור', 'YOLO-World, Grounding DINO'], ['מודלי שפה־ראייה', 'תמונה ושאלה', 'תשובה במילים', 'מודלים קטנים וגדולים (פרק 8)']];
  const svg = svgBox(box, 480, 110); const out = V.say(box);
  const tb7 = V.tabs(box, F.map(x => x[0]), i => { svg.innerHTML = ''; const [n, a, b, e] = F[i]; bar(svg, 10, 35, 140, 40, 'var(--c5, #e8a33d)'); bar(svg, 170, 25, 140, 60, 'var(--c1)'); bar(svg, 330, 35, 140, 40, 'var(--c3)'); [[80, a], [240, n], [400, b]].forEach(([x, t]) => V.s('text', { x, y: 60, 'font-size': 12, 'text-anchor': 'middle', text: t, style: { fill: '#fff' } }, svg)); txt(svg, [152, 60], '→', { fontSize: '16px' }); txt(svg, [312, 60], '→', { fontSize: '16px' });
    out.innerHTML = 'דוגמאות: ' + ltr(e) + '. ' + (i === 0 ? 'הבסיס לשתי האחרות.' : i === 1 ? 'משתמשים במקודד הטקסט של המשפחה הראשונה.' : 'משתמשים במקודד התמונה של המשפחה הראשונה.'); });
  tb7.select(0);
};

/* 2.1 web pairs */
W.w7_pairs = function (box) {
  V.say(box, 'הנתונים: תמונות עם טקסט לידן, רועש אבל חינמי. <b>עבור בין הזוגות</b> וראה כמה מידע יש בכיתוב לעומת שם מחלקה.');
  const P = [['circle', 'red', 'a photo of a large red circle', 'עיגול'], ['cross', 'blue', 'one small cross colored blue', 'צלב'], ['square', 'yellow', 'my favourite yellow thing!!', 'ריבוע'], ['triangle', 'green', 'IMG_2031.jpg', 'משולש']];
  const svg = svgBox(box, 480, 120); const out = V.say(box);
  V.stepper(box, P.length, i => { svg.innerHTML = ''; V.s('rect', { x: 20, y: 10, width: 100, height: 100, style: { fill: '#868e96' } }, svg); shape(svg, P[i][0], P[i][1], 70, 60, 34); txt(svg, [140, 50], P[i][2], { fontSize: '14px' }); txt(svg, [140, 80], 'שם מחלקה: ' + P[i][3], { fontSize: '12px' });
    out.innerHTML = ['כיתוב טוב: צורה, צבע וגודל — יותר מידע משם המחלקה.', 'נוסח אחר לאותו מושג: המודל לומד שהם אותו דבר.', 'רעש: אין צורה בכיתוב. על מאות מיליונים, זה ממוצע.', 'כיתוב חסר תוכן. גם זה קורה באינטרנט.'][i]; });
};

/* 2.2 the batch similarity matrix (replaces the original figure) */
W.w7_contrastive = function (box) {
  V.say(box, 'מנה של B זוגות: מטריצת קוסינוס של B על B, והאלכסון הוא התשובה הנכונה. <b>שנה את קנה המידה, את איכות ההתאמה ואת מספר הכפילויות</b> וראה את ההפסד (הטבלה בסעיף: 4.353, 0.001, 0.736, 1.386).');
  let s = 10, q = 1, dup = 1, B = 4; const sr = V.row(box); V.slider(sr, 'קנה מידה s', 1, 30, 0.5, s, v => { s = v; draw(); }); V.slider(sr, 'איכות ההתאמה', 0, 1, 0.05, q, v => { q = v; draw(); }); V.slider(sr, 'זוגות זהים', 1, 4, 1, dup, v => { dup = v; draw(); });
  V.btns(box, [['אקראי, s=10', () => set(10, 0, 1)], ['מושלם, s=10', () => set(10, 1, 1)], ['מושלם, s=1', () => set(1, 1, 1)], ['ארבעה זהים', () => set(10, 1, 4)]]); const svg = svgBox(box, 480, 200); const out = mono(box);
  function set(a, b, c) { s = a; q = b; dup = c; draw(); }
  function draw() { const r = rng(3); const base = [...Array(B)].map(() => unit([...Array(8)].map(() => randn(r)))); const grp = i => Math.min(i, B - dup); const tgt = [...Array(B)].map((_, i) => base[grp(i) === B - dup ? B - dup : i]);
    const I = tgt.map(v => unit(v.map(x => x * q + randn(r) * (1 - q)))), T = tgt.map(v => unit(v.map(x => x * q + randn(r) * (1 - q)))); const S = I.map(a => T.map(b => dot(a, b)));
    svg.innerHTML = ''; const c = 40; S.forEach((row, i) => row.forEach((v, j) => { const t = (v + 1) / 2; V.s('rect', { x: 150 + j * c, y: 20 + i * c, width: c - 2, height: c - 2, style: { fill: `rgba(28,126,214,${t})`, stroke: i === j ? 'var(--c3)' : 'none', strokeWidth: 3 } }, svg); txt(svg, [156 + j * c, 44 + i * c], f(v, 2), { fontSize: '10px', fill: t > 0.6 ? '#fff' : 'var(--ink)' }); }));
    txt(svg, [150, 14], 'טקסט →', { fontSize: '10px' }); txt(svg, [100, 100], 'תמונה ↓', { fontSize: '10px' });
    out.textContent = 'contrastive loss (rows + columns) = ' + f(softmaxLoss(S, s), 3) + '\nfloor from duplicates ≈ ln(' + dup + ') = ' + f(Math.log(dup), 3); }
  draw();
};

/* 3.1 the shape data */
W.w7_shapes_data = function (box) {
  V.say(box, 'דוגמאות מהנתונים: צורה אחת על רקע רועש, עם כיתוב. ארבעה צירופים <b>לא מופיעים באימון</b> (מסומנים באדום). <b>הגרל</b>.');
  let seed = 1; V.btns(box, [['הגרל', () => { seed++; draw(); }, 'primary']]); const svg = svgBox(box, 480, 250); const out = V.say(box);
  const SH = ['circle', 'square', 'triangle', 'cross'], CL = ['red', 'green', 'blue', 'yellow'], TPL = ['a photo of a {s} {c} {sh}', 'one {s} {sh} colored {c}', 'a {c} {sh} which is {s}', 'there is a {s} {c} {sh}'];
  function draw() { svg.innerHTML = ''; const r = rng(seed * 13); for (let k = 0; k < 8; k++) { const sh = SH[Math.floor(r() * 4)], c = CL[Math.floor(r() * 4)], big = r() < 0.5; const x = 10 + (k % 4) * 118, y = 10 + Math.floor(k / 4) * 120; const held = HELD.includes(c + ' ' + sh);
      for (let i = 0; i < 60; i++) V.s('rect', { x: x + r() * 76, y: y + r() * 76, width: 4, height: 4, style: { fill: '#555', opacity: 0.4 } }, svg); V.s('rect', { x, y, width: 80, height: 80, style: { fill: 'none', stroke: held ? 'var(--c2)' : 'var(--line2)', strokeWidth: held ? 3 : 1 } }, svg); shape(svg, sh, c, x + 40, y + 40, big ? 26 : 13);
      txt(svg, [x, y + 95], TPL[Math.floor(r() * 4)].replace('{s}', big ? 'large' : 'small').replace('{c}', c).replace('{sh}', sh), { fontSize: '7px' }); }
    out.innerHTML = 'לא באימון: ' + HELD.map(h => { const [c, sh] = h.split(' '); return HE[sh] + ' ' + HE[c]; }).join(', ') + '.'; }
  draw();
};

/* 3.2 the text tower: a bag of words */
W.w7_text_tower = function (box) {
  V.say(box, 'מגדל הטקסט: כל מילה מקבלת מספר, ממצעים את שיכוני המילים ומכפילים במטריצה. <b>כתוב כיתוב</b> — וגם בסדר מילים אחר.');
  const voc = ['a', 'blue', 'circle', 'colored', 'cross', 'green', 'is', 'large', 'of', 'one', 'photo', 'red', 'small', 'square', 'there', 'triangle', 'which', 'yellow']; const idx = {}; voc.forEach((w, i) => idx[w] = i + 1);
  const a = el('input', { value: 'a red circle', style: { width: '220px', direction: 'ltr' } }), b = el('input', { value: 'circle a red', style: { width: '220px', direction: 'ltr' } }); box.appendChild(el('div', {}, 'כיתוב 1 ', a)); box.appendChild(el('div', {}, 'כיתוב 2 ', b)); a.oninput = b.oninput = draw; const out = mono(box);
  const r = rng(7); const E = [...Array(voc.length + 1)].map(() => [...Array(6)].map(() => randn(r)));
  const enc = s => { const ids = s.toLowerCase().split(/\s+/).filter(Boolean).map(w => idx[w] || 0); const m = E[0].map((_, k) => ids.reduce((acc, i) => acc + E[i][k], 0) / Math.max(1, ids.length)); return { ids, v: unit(m) }; };
  function draw() { const x = enc(a.value), y = enc(b.value); out.textContent = 'ids 1: [' + x.ids.join(', ') + ']   (0 = unknown word)\nids 2: [' + y.ids.join(', ') + ']\ncosine(caption 1, caption 2) = ' + f(dot(x.v, y.v), 4) + (Math.abs(dot(x.v, y.v) - 1) < 1e-9 ? '   ← identical: word order is ignored (exercise 3.3)' : ''); }
  draw();
};

/* 3.3 the image tower */
W.w7_image_tower = function (box) {
  V.say(box, 'מגדל התמונה: הקטנה ל־24 על 24, שכבה נסתרת, ויציאה לממד המשותף. <b>שנה את הגדלים</b> וראה את מספר הפרמטרים (תרגיל 3.1: 450,848).');
  let side = 24, hid = 256, d = 32; const sr = V.row(box); V.slider(sr, 'צד התמונה', 8, 48, 4, side, v => { side = v; draw(); }); V.slider(sr, 'שכבה נסתרת', 32, 512, 32, hid, v => { hid = v; draw(); }); V.slider(sr, 'ממד משותף', 8, 128, 8, d, v => { d = v; draw(); }); const out = mono(box);
  function draw() { const inp = side * side * 3; const p = inp * hid + hid + hid * d + d; out.textContent = 'input  ' + side + '×' + side + '×3 = ' + inp + '\nW1 ' + inp + '×' + hid + ' + b1 ' + hid + '\nW2 ' + hid + '×' + d + ' + b2 ' + d + '\nparameters = ' + p.toLocaleString('en') + '\nthen L2-normalize → a point on the unit sphere'; }
  draw();
};

/* 3.4 the training loop */
W.w7_train_loop = function (box) {
  V.say(box, 'סבב אחד בלולאת האימון, צעד אחר צעד. <b>עבור על השלבים</b>.');
  const S = [['idx = rng.permutation(n)', 'ערבוב — כל סבב מנות אחרות.'], ['j = idx[k:k + B]', 'מנה של B זוגות.'], ['encode_image / encode_text', 'שני המגדלים, וקטורים באורך 1.'], ['L = s · I Tᵀ', 'מטריצת B על B, מוכפלת בקנה המידה.'], ['loss = (CE rows + CE cols) / 2', 'הסיווג הסימטרי: האלכסון הוא התשובה.'], ['grads (checked numerically)', 'נגזרות ביד, שנבדקו מול נגזרת מספרית.'], ['m.adam(g)', 'עדכון כל הפרמטרים, כולל קנה המידה.']];
  const out = mono(box); const say = V.say(box); V.stepper(box, S.length, s => { out.textContent = S.map((x, i) => (i === s ? '▶ ' : '  ') + x[0]).join('\n'); say.innerHTML = S[s][1]; });
};

/* 3.5 the loss floor */
W.w7_loss_floor = function (box) {
  V.say(box, 'ההפסד בששת הסבבים, ו"רצפה" של כפילויות במנה: בערך ln(128/24). <b>שנה את גודל המנה ומספר הצירופים</b> (תרגילים 2.2 ו־3.4).');
  let B = 128, K = 24; const sr = V.row(box); V.slider(sr, 'גודל מנה', 8, 512, 8, B, v => { B = v; draw(); }); V.slider(sr, 'צירופים שונים', 4, 200, 1, K, v => { K = v; draw(); });
  const P = window.IM.plot(box, { w: 440, h: 180 }); const out = V.say(box);
  function draw() { const fl = Math.log(Math.max(1, B / K)); P.draw([{ pts: [[0, 2.355], [1, 1.85], [2, 1.81], [3, 1.788], [5, 1.78]], color: 'var(--c1)', width: 2.5, dots: true }, { pts: [[0, fl], [5, fl]], color: 'var(--c2)', dash: '4 3' }, { pts: [[0, Math.log(B)], [5, Math.log(B)]], color: '#adb5bd', dash: '2 3' }], [0, 5], [0, 5.5]);
    out.innerHTML = 'כחול: ההפסד בפועל (מנה 128, 24 צירופים). אדום: רצפת הכפילויות ' + ltr('ln(' + B + '/' + K + ') ≈ ' + f(fl, 2)) + '. אפור: מודל שלא למד כלום ' + ltr('ln ' + B + ' = ' + f(Math.log(B), 2)) + '.'; }
  draw();
};

/* 4.1 zero-shot */
W.w7_zeroshot = function (box) {
  V.say(box, 'סיווג בלי אימון: משפט לכל אחת מ־32 המחלקות, ובוחרים את הקרוב לתמונה. <b>בחר תמונה</b>. (כאן מודל מדומה שמתנהג כמו המודל עם קלט הרוויה.)');
  const SH = ['circle', 'square', 'triangle', 'cross'], CL = ['red', 'green', 'blue', 'yellow']; let sh = 2, c = 2, big = 1; const sr = V.row(box); V.tabs(sr, SH.map(x => HE[x]), i => { sh = i; draw(); }, 2); V.tabs(sr, CL.map(x => HE[x]), i => { c = i; draw(); }, 2); V.tabs(sr, ['קטן', 'גדול'], i => { big = i; draw(); }, 1);
  const svg = svgBox(box, 480, 110); const tb = el('div'); box.appendChild(tb);
  function draw() { svg.innerHTML = ''; V.s('rect', { x: 10, y: 5, width: 100, height: 100, style: { fill: '#868e96' } }, svg); shape(svg, SH[sh], CL[c], 60, 55, big ? 34 : 16); const held = HELD.includes(CL[c] + ' ' + SH[sh]); txt(svg, [130, 55], held ? 'צירוף שלא נראה באימון' : 'צירוף שנראה באימון', { fill: held ? 'var(--c2)' : 'var(--ink2)', fontSize: '13px' });
    const r = rng(sh * 9 + c * 3 + big + 1); const scores = []; SH.forEach((s2, i) => CL.forEach((c2, j) => [0, 1].forEach(b2 => { const v = 0.05 + (i === sh ? 0.45 : 0) + (j === c ? 0.35 : 0) + (b2 === big ? 0.1 : 0) + randn(r) * 0.03; scores.push(['a ' + (b2 ? 'large' : 'small') + ' ' + c2 + ' ' + s2, v]); })));
    scores.sort((a, b) => b[1] - a[1]); tb.innerHTML = ''; hbars(tb, scores.slice(0, 5).map((x, i) => [x[0], x[1], i ? 'var(--c1)' : 'var(--c3)']), { lw: 170, max: 1.05, fmt: v => f(v, 3) }); }
  draw();
};

/* 4.2 the pixel model fails on unseen combinations */
W.w7_pixels_fail = function (box) {
  V.say(box, 'המודל על פיקסלים גולמיים. <b>בחר מה להציג</b>.');
  const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  V.tabs(box, ['דיוק', 'מה הוא חושב שמשולש כחול'], i => { tb.innerHTML = ''; if (!i) { hbars(tb, [['צירופים שנראו', 98.1, 'var(--c3)'], ['צירופים שלא נראו', 3.2, 'var(--c2)'], ['רק צבע, שלא נראו', 100, 'var(--c1)'], ['רק צורה, שלא נראו', 16.1, 'var(--c5, #e8a33d)']], { lw: 150, max: 105, fmt: v => v + '%' }); out.innerHTML = 'הצבע נלמד כמושג; הצורה לא. ניסיונות תיקון: להסתיר צירוף אחד (18.5%), תמונות בשחור־לבן (4.6% עד 6.1%).'; }
    else { hbars(tb, [['עיגול כחול', 253, 'var(--c2)'], ['צלב כחול', 155, 'var(--c2)'], ['משולש כחול', 37, 'var(--c3)'], ['אחר', 35, '#adb5bd']], { lw: 150, max: 270, fmt: v => v + ' מתוך 480' }); out.innerHTML = 'הצבע נכון תמיד; הצורה הולכת לאיבוד. למודל אין סיבה ללמוד "משולש" כללי כשמשולש אדום, ירוק וצהוב מספיקים.'; } });
  tb.innerHTML = ''; hbars(tb, [['צירופים שנראו', 98.1, 'var(--c3)'], ['צירופים שלא נראו', 3.2, 'var(--c2)'], ['רק צבע, שלא נראו', 100, 'var(--c1)'], ['רק צורה, שלא נראו', 16.1, 'var(--c5, #e8a33d)']], { lw: 150, max: 105, fmt: v => v + '%' });
};

/* 4.3 decomposing the input */
W.w7_saturation = function (box) {
  V.say(box, 'התיקון: במקום פיקסלים בשלושה ערוצים, מפה של <b>רוויה</b> (איפה יש צבע — כלומר הצורה) ועוד תמונה מזערית (איזה צבע). <b>החלף צבע</b> — מפת הצורה כמעט לא משתנה.');
  let c = 'blue'; V.tabs(box, ['כחול', 'אדום', 'ירוק', 'צהוב'], i => { c = ['blue', 'red', 'green', 'yellow'][i]; draw(); }); const svg = svgBox(box, 480, 130); const tb = el('div'); box.appendChild(tb);
  function draw() { svg.innerHTML = ''; [[10, 'פיקסלים'], [170, 'מפת רוויה (צורה)'], [330, 'מזערית (צבע)']].forEach(([x, t]) => { V.s('rect', { x, y: 5, width: 100, height: 100, style: { fill: '#868e96' } }, svg); txt(svg, [x, 122], t, { fontSize: '11px' }); });
    shape(svg, 'triangle', c, 60, 55, 34); V.s('rect', { x: 170, y: 5, width: 100, height: 100, style: { fill: '#111' } }, svg); shape(svg, 'triangle', '#f8f9fa', 220, 55, 34); V.s('rect', { x: 345, y: 20, width: 70, height: 70, style: { fill: COLS[c], opacity: 0.6 } }, svg); }
  hbars(tb, [['פיקסלים: שלא נראו', 3.2, 'var(--c2)'], ['רוויה: שלא נראו', 94.0, 'var(--c3)'], ['רוויה: רק צורה', 99.0, 'var(--c1)'], ['רוויה: נוסח שלא נראה', 94.1, 'var(--c5, #e8a33d)']], { lw: 160, max: 105, fmt: v => v + '%' }); draw();
};

/* 4.4 composition: word order */
W.w7_composition = function (box) {
  V.say(box, 'תמונה עם שתי צורות, ושני כיתובים שמחליפים את הצבעים (תרגיל 4.4). <b>בחר מקודד</b>.');
  let real = false; V.tabs(box, ['ממוצע מילים (שלנו)', 'מקודד עם סדר וקשב'], i => { real = i === 1; draw(); }); const svg = svgBox(box, 480, 110); const out = mono(box);
  function draw() { svg.innerHTML = ''; V.s('rect', { x: 10, y: 5, width: 180, height: 100, style: { fill: '#868e96' } }, svg); shape(svg, 'circle', 'red', 60, 55, 28); shape(svg, 'square', 'blue', 140, 55, 26);
    const a = real ? 0.81 : 0.62, b = real ? 0.37 : 0.62; out.textContent = '"a red circle and a blue square"  ' + f(a, 2) + (a > b ? '  ✓' : '') + '\n"a blue circle and a red square"  ' + f(b, 2) + '\n' + (real ? 'order and attention bind each adjective to its noun (still imperfect in CLIP)' : 'same words → same vector → identical score: a coin flip'); }
  draw();
};

/* 5.1 the sigmoid loss */
W.w7_sigmoid_loss = function (box) {
  V.say(box, 'SigLIP: סיגמואיד על כל תא, עם קנה מידה s והטיה b. <b>שנה את הערכים</b> (הטבלה בסעיף: 9.499, 0.694, 0.138, 2.773). תרגיל 5.2: s=15.6, b=−5.31.');
  let s = 10, b = -10, q = 1, dup = 1; const sr = V.row(box); V.slider(sr, 's', 1, 30, 0.1, s, v => { s = v; draw(); }); V.slider(sr, 'b', -15, 5, 0.01, b, v => { b = v; draw(); }); V.slider(sr, 'התאמה', 0, 1, 0.05, q, v => { q = v; draw(); }); V.slider(sr, 'זהים', 1, 4, 1, dup, v => { dup = v; draw(); });
  V.btns(box, [['אקראי', () => set(10, -10, 0, 1)], ['מושלם b=−10', () => set(10, -10, 1, 1)], ['מושלם b=−5', () => set(10, -5, 1, 1)], ['ארבעה זהים', () => set(10, -10, 1, 4)], ['תרגיל 5.2', () => set(15.6, -5.31, 1, 1)]]);
  const P = window.IM.plot(box, { w: 440, h: 150 }); const out = mono(box);
  function set(a, c, d, e) { s = a; b = c; q = d; dup = e; draw(); }
  function draw() { const B = 4, r = rng(3); const base = [...Array(B)].map(() => unit([...Array(8)].map(() => randn(r)))); const tg = base.map((v, i) => i >= B - dup ? base[B - dup] : v); const I = tg.map(v => unit(v.map(x => x * q + randn(r) * (1 - q)))), T = tg.map(v => unit(v.map(x => x * q + randn(r) * (1 - q)))); const S = I.map(a => T.map(c => dot(a, c)));
    const X = [...Array(81)].map((_, i) => -1 + i / 40); P.draw([{ pts: X.map(x => [x, 1 / (1 + Math.exp(-(s * x + b)))]), color: 'var(--c1)', width: 2.5 }, { vline: -b / s, color: 'var(--c2)', dash: '4 3' }], [-1, 1], [0, 1]);
    out.textContent = 'sigmoid loss = ' + f(sigmoidLoss(S, s, b), 3) + '   (per pair, summed over the row, averaged over B)\np = 0.5 at cosine = −b/s = ' + f(-b / s, 3); }
  draw();
};

/* 5.2 what we gained */
W.w7_sig_vs_soft = function (box) {
  V.say(box, 'מוסיפים קבוע לכל הציונים של תמונה אחת. <b>הזז את הקבוע</b>: ההסתברויות של softmax לא משתנות — הן רק יחסיות. הסיגמואיד נותן תשובה מוחלטת לכל זוג.');
  let k = 0; V.slider(box, 'קבוע שמוסיפים לשורה', -3, 3, 0.1, k, v => { k = v; draw(); }); const out = mono(box);
  function draw() { const L = [2.0, 0.5, -0.3, 0.1].map(x => x + k); const m = Math.max(...L), e = L.map(x => Math.exp(x - m)), Z = e.reduce((a, b) => a + b, 0);
    out.textContent = 'logits   ' + L.map(x => f(x, 2).padStart(6)).join('') + '\nsoftmax  ' + e.map(x => f(x / Z, 3).padStart(6)).join('') + '   ← unchanged\nsigmoid  ' + L.map(x => f(1 / (1 + Math.exp(-x)), 3).padStart(6)).join('') + '   ← moves: an absolute yes/no per pair'; }
  draw();
};

/* 5.3 the experiment */
W.w7_batch_table = function (box) {
  V.say(box, 'הטבלה של הסעיף: דיוק על צירופים שלא נראו, לפי גודל מנה. <b>רחף על קבוצה</b>.');
  const D = [[8, 79.0, 70.7, 270], [32, 87.4, 95.1, 60], [128, 94.0, 97.3, 36], [512, 99.6, 83.4, 37]]; const svg = svgBox(box, 480, 200); const out = V.say(box, 'כחול: ניגודי. ירוק: סיגמואידי.');
  D.forEach(([b, c, s2, t], i) => { const g = V.s('g', {}, svg); bar(g, 40 + i * 110, 180 - c * 1.6, 38, c * 1.6, 'var(--c1)'); bar(g, 80 + i * 110, 180 - s2 * 1.6, 38, s2 * 1.6, 'var(--c3)'); txt(g, [60 + i * 110, 196], 'מנה ' + b); g.addEventListener('mouseenter', () => { out.innerHTML = 'מנה ' + b + ': ניגודי ' + c + '%, סיגמואידי ' + s2 + '%, כ־' + t + ' שניות. ' + (b === 512 ? 'בתרגיל 5.4: עם 60 סבבים הסיגמואיד חזר ל־99.7% — מעט מדי צעדים.' : b === 128 ? 'שלושה זרעים: יתרון עקבי לסיגמואיד.' : ''); }); });
};
})();
