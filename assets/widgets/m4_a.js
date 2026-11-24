/* Module 4 visuals — chapters 1–4: detection basics, IoU, NMS, metrics. Also the shared box helpers (window.BX). */
(function () {
const W = window.W, V = window.V, el = V.el;
const f = (x, d) => V.fmt(x, d === undefined ? 2 : d);
const ltr = s => '<span style="display:inline-block;direction:ltr">' + s + '</span>';
const mono = (parent, txt) => { const d = el('div', { class: 'mono', style: { direction: 'ltr', textAlign: 'left', fontSize: '.85em', background: 'var(--code-bg)', padding: '8px 10px', borderRadius: '8px', whiteSpace: 'pre-wrap', marginTop: '6px' } }); d.textContent = txt || ''; parent.appendChild(d); return d; };
const svgBox = (box, w, h) => { const s = V.s('svg', { viewBox: `0 0 ${w} ${h}`, width: w, style: { maxWidth: '100%', direction: 'ltr', display: 'block', margin: '0 auto' } }); box.appendChild(s); return s; };
const rect = (svg, b, st, k, o) => { k = k || 1; o = o || [0, 0]; return V.s('rect', { x: o[0] + b[0] * k, y: o[1] + b[1] * k, width: Math.max(0, (b[2] - b[0]) * k), height: Math.max(0, (b[3] - b[1]) * k), style: Object.assign({ fill: 'none', stroke: 'var(--c1)', strokeWidth: 2 }, st || {}) }, svg); };
const txt = (svg, p, t, st) => V.s('text', { x: p[0], y: p[1], 'font-size': 11, text: t, style: Object.assign({ fill: 'var(--ink2)' }, st || {}) }, svg);
const iou = (a, b) => { const w = Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])), h = Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1])); const i = w * h; const u = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - i; return u > 0 ? i / u : 0; };
const nms = (boxes, scores, thr) => { let order = scores.map((s, i) => i).sort((a, b) => scores[b] - scores[a]); const keep = []; while (order.length) { const i = order[0]; keep.push(i); order = order.slice(1).filter(j => iou(boxes[i], boxes[j]) < thr); } return keep; };
const rng = s => { s = s || 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
const randn = r => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
/* AP: dets [{score, tp}], nGT → 101-point interpolated AP (section 4.3) */
const apOf = (dets, nGT) => { const d = dets.slice().sort((a, b) => b.score - a.score); let tp = 0, fp = 0; const P = [], R = []; d.forEach(x => { x.tp ? tp++ : fp++; P.push(tp / (tp + fp)); R.push(tp / Math.max(1, nGT)); });
  const env = P.slice(); for (let i = env.length - 2; i >= 0; i--) env[i] = Math.max(env[i], env[i + 1]); let ap = 0; for (let k = 0; k <= 100; k++) { const r = k / 100; const idx = R.findIndex(x => x >= r - 1e-12); ap += idx >= 0 ? env[idx] : 0; } return { ap: ap / 101, P, R, env }; };
const match = (dets, scores, gts, thr) => { const order = scores.map((s, i) => i).sort((a, b) => scores[b] - scores[a]); const used = gts.map(() => false); return order.map(k => { let bj = -1, bv = -1; gts.forEach((g, j) => { if (used[j]) return; const v = iou(dets[k], g); if (v > bv) { bv = v; bj = j; } }); const tp = bv >= thr; if (tp) used[bj] = true; return { k, score: scores[k], tp, iou: bv }; }); };
window.BX = { f, ltr, mono, svgBox, rect, txt, iou, nms, rng, randn, apOf, match };

/* a synthetic drone scene used by several visuals */
const scene = (() => { const r = rng(5); const cars = [], ppl = []; for (let i = 0; i < 6; i++) { const x = 30 + r() * 480, y = 30 + r() * 300; cars.push([x, y, x + 50 + r() * 20, y + 26 + r() * 6]); } for (let i = 0; i < 5; i++) { const x = 40 + r() * 500, y = 40 + r() * 300; ppl.push([x, y, x + 10, y + 12]); } return { cars, ppl }; })();
const drawScene = (svg, k, o) => { k = k || 1; o = o || [0, 0]; V.s('rect', { x: o[0], y: o[1], width: 600 * k, height: 380 * k, style: { fill: '#dfe5d8' } }, svg); V.s('rect', { x: o[0], y: o[1] + 150 * k, width: 600 * k, height: 70 * k, style: { fill: '#b9bcbf' } }, svg);
  scene.cars.forEach(b => V.s('rect', { x: o[0] + b[0] * k, y: o[1] + b[1] * k, width: (b[2] - b[0]) * k, height: (b[3] - b[1]) * k, rx: 5 * k, style: { fill: '#5b6d8c' } }, svg)); scene.ppl.forEach(b => V.s('circle', { cx: o[0] + (b[0] + 5) * k, cy: o[1] + (b[1] + 6) * k, r: 5 * k, style: { fill: '#b8572e' } }, svg)); };
window.BX.scene = scene; window.BX.drawScene = drawScene;

/* 1.1 classification, detection, segmentation */
W.w4_tasks = function (box) {
  V.say(box, 'אותה תמונת רחפן, שלוש משימות. <b>עבור בין הלשוניות</b>, ובזיהוי סמן "מלבן מסובב" כדי לראות כמה מלבן רגיל מבזבז על רכב באלכסון.');
  let mode = 1, obb = false;
  V.tabs(box, ['סיווג', 'זיהוי עצמים', 'סגמנטציה'], i => { mode = i; draw(); }, 1); V.tabs(box, ['מלבן רגיל', 'מלבן מסובב'], i => { obb = i === 1; draw(); });
  const svg = svgBox(box, 600, 380); const out = V.say(box);
  function draw() { svg.innerHTML = ''; drawScene(svg); const diag = [460, 300]; const g = V.s('g', { transform: `rotate(35 ${diag[0]} ${diag[1]})` }, svg); V.s('rect', { x: diag[0] - 30, y: diag[1] - 14, width: 60, height: 28, rx: 5, style: { fill: '#5b6d8c' } }, g);
    if (mode === 0) { V.s('rect', { x: 10, y: 10, width: 230, height: 34, rx: 6, style: { fill: 'rgba(0,0,0,.65)' } }, svg); txt(svg, [20, 32], 'vehicle: 0.97   person: 0.88', { fill: '#fff', fontSize: '14px' }); out.innerHTML = 'פלט אחד לכל התמונה: ציון לכל מחלקה. לא אומר איפה ולא כמה.'; return; }
    if (mode === 2) { scene.cars.forEach(b => V.s('rect', { x: b[0], y: b[1], width: b[2] - b[0], height: b[3] - b[1], rx: 5, style: { fill: 'rgba(66,99,235,.45)' } }, svg)); scene.ppl.forEach(b => V.s('circle', { cx: b[0] + 5, cy: b[1] + 6, r: 6, style: { fill: 'rgba(224,49,49,.5)' } }, svg)); V.s('rect', { x: diag[0] - 30, y: diag[1] - 14, width: 60, height: 28, rx: 5, transform: `rotate(35 ${diag[0]} ${diag[1]})`, style: { fill: 'rgba(66,99,235,.45)' } }, svg); out.innerHTML = 'לכל פיקסל: לאיזה עצם הוא שייך. מדויק, אבל יקר לתייג ולחשב.'; return; }
    scene.cars.forEach(b => rect(svg, b)); scene.ppl.forEach(b => rect(svg, [b[0] - 2, b[1] - 1, b[2] + 2, b[3] + 1], { stroke: 'var(--c2)' }));
    const c = Math.cos(G35), s = Math.sin(G35); const hw = 30 * Math.abs(c) + 14 * Math.abs(s), hh = 30 * Math.abs(s) + 14 * Math.abs(c);
    if (obb) V.s('rect', { x: diag[0] - 31, y: diag[1] - 15, width: 62, height: 30, transform: `rotate(35 ${diag[0]} ${diag[1]})`, style: { fill: 'none', stroke: 'var(--c3)', strokeWidth: 2.5 } }, svg); else rect(svg, [diag[0] - hw, diag[1] - hh, diag[0] + hw, diag[1] + hh], { stroke: 'var(--c3)', strokeWidth: 2.5 });
    const fill = (60 * 28) / (4 * hw * hh); out.innerHTML = 'רשימה: מלבן, מחלקה וציון לכל עצם. ' + (obb ? 'המלבן המסובב צמוד לרכב.' : 'הרכב באלכסון ממלא רק <b>' + f(fill * 100, 0) + '%</b> מהמלבן שלו.'); }
  const G35 = 35 * Math.PI / 180; draw();
};

/* 1.2 three box formats */
W.w4_formats = function (box) {
  V.say(box, 'אותו מלבן בשלושה פורמטים. <b>הזז את המלבן</b>, ואחר כך הקטן את התמונה לחצי: רק הפורמט המנורמל לא משתנה.');
  const b = [100, 50, 140, 130]; let half = false;
  const r1 = V.row(box); ['x1', 'y1', 'x2', 'y2'].forEach((n, i) => V.slider(r1, n, 0, i % 2 ? 480 : 640, 1, b[i], v => { b[i] = v; draw(); }));
  V.tabs(box, ['תמונה 640×480', 'אחרי הקטנה ל־320×240'], i => { half = i === 1; draw(); });
  const svg = svgBox(box, 400, 300); const out = mono(box);
  function draw() { svg.innerHTML = ''; const s = half ? 0.5 : 1, Wd = 640 * s, Hd = 480 * s; const k = 400 / 640; V.s('rect', { x: 0, y: 0, width: Wd * k, height: Hd * k, style: { fill: 'var(--surface2, #f6f6f4)', stroke: 'var(--line2)' } }, svg);
    const bb = [Math.min(b[0], b[2]), Math.min(b[1], b[3]), Math.max(b[0], b[2]), Math.max(b[1], b[3])].map(x => x * s); rect(svg, bb, {}, k);
    const [x1, y1, x2, y2] = bb; out.textContent = 'corners (x1, y1, x2, y2):  ' + [x1, y1, x2, y2].map(x => f(x, 0)).join(', ') + '\nCOCO (x, y, w, h):        ' + [x1, y1, x2 - x1, y2 - y1].map(x => f(x, 0)).join(', ') + '\nYOLO (cx, cy, w, h)/size:  ' + [(x1 + x2) / 2 / Wd, (y1 + y2) / 2 / Hd, (x2 - x1) / Wd, (y2 - y1) / Hd].map(x => f(x, 4)).join(' '); }
  draw();
};

/* 1.3 one-stage vs two-stage */
W.w4_two_stage = function (box) {
  V.say(box, 'דו־שלבי: שלב ראשון מציע אזורים, ושלב שני בודק כל אחד. חד־שלבי: רשת של תאים, וכל תא חוזה בבת אחת. <b>הגדל את מספר ההצעות</b> וראה מה קורה לזמן (יחידות יחסיות, לא מדידה).');
  let n = 100; V.slider(box, 'הצעות בשלב הראשון', 10, 1000, 10, n, v => { n = v; draw(); });
  const svg = svgBox(box, 480, 150); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const one = 20, two = 20 + n * 0.08; const mx = Math.max(one, two); [['חד־שלבי', one, 'var(--c3)'], ['דו־שלבי', two, 'var(--c2)']].forEach(([l, t, c], i) => { V.s('rect', { x: 90, y: 30 + i * 55, width: t / mx * 360, height: 34, style: { fill: c } }, svg); txt(svg, [10, 52 + i * 55], l, { fontSize: '13px' }); });
    out.innerHTML = 'חד־שלבי: זמן קבוע, מעבר אחד. דו־שלבי: הזמן גדל עם מספר ההצעות, כי כל הצעה עוברת סיווג משלה.'; }
  draw();
};

/* 2.1 IoU */
W.w4_iou_def = function (box) {
  V.say(box, 'חפיפה = שטח החיתוך חלקי שטח האיחוד. <b>הזז את המלבן החזוי</b> (אדום) ביחס למלבן האמת (ירוק).');
  let dx = 30, dy = 10, sc = 1;
  const r1 = V.row(box); V.slider(r1, 'הזזה x', -150, 150, 1, dx, v => { dx = v; draw(); }); V.slider(r1, 'הזזה y', -150, 150, 1, dy, v => { dy = v; draw(); }); V.slider(r1, 'גודל', 0.4, 2, 0.05, sc, v => { sc = v; draw(); });
  const svg = svgBox(box, 460, 300); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const g = [150, 80, 290, 220]; const c = [220 + dx, 150 + dy]; const h = 70 * sc; const p = [c[0] - h, c[1] - h, c[0] + h, c[1] + h];
    const I = [Math.max(g[0], p[0]), Math.max(g[1], p[1]), Math.min(g[2], p[2]), Math.min(g[3], p[3])]; if (I[2] > I[0] && I[3] > I[1]) V.s('rect', { x: I[0], y: I[1], width: I[2] - I[0], height: I[3] - I[1], style: { fill: 'rgba(66,99,235,.35)' } }, svg);
    rect(svg, g, { stroke: 'var(--c3)', strokeWidth: 3 }); rect(svg, p, { stroke: 'var(--c2)', strokeWidth: 3 }); const v = iou(g, p); const inter = Math.max(0, I[2] - I[0]) * Math.max(0, I[3] - I[1]); const uni = 140 * 140 + (2 * h) ** 2 - inter;
    out.innerHTML = 'חיתוך ' + f(inter, 0) + ', איחוד ' + f(uni, 0) + ', חפיפה <b>' + f(v, 3) + '</b>. ' + (v >= 0.5 ? 'מעל 0.5: נספר כפגיעה.' : 'מתחת ל־0.5: נספר כפספוס, וגם כהחמצה.'); }
  draw();
};

/* 2.2 same error, different sizes */
W.w4_iou_size = function (box) {
  V.say(box, 'אותה טעות בפיקסלים, מלבנים בגדלים שונים. <b>שנה את הטעות</b>: מתחת לקו האדום המלבן נספר כפספוס. ההזזה המותרת היא s/3 (תרגיל 2.2).');
  let d = 2; V.slider(box, 'הזזה (פיקסלים, בשני הצירים)', 0, 20, 0.5, d, v => { d = v; draw(); });
  const P = window.IM.plot(box, { w: 440, h: 190 }); const out = V.say(box);
  function draw() { const pts = []; for (let s = 4; s <= 120; s += 1) pts.push([s, iou([0, 0, s, s], [d, d, s + d, s + d])]); P.draw([{ pts, color: 'var(--c1)', width: 2.5 }, { pts: [[4, 0.5], [120, 0.5]], color: 'var(--c2)', dash: '4 3' }], [4, 120], [0, 1]);
    out.innerHTML = 'מלבן של 10: חפיפה <b>' + f(iou([0, 0, 10, 10], [d, d, 10 + d, 10 + d]), 3) + '</b>. מלבן של 100: <b>' + f(iou([0, 0, 100, 100], [d, d, 100 + d, 100 + d]), 3) + '</b>. הציר האופקי הוא גודל המלבן.'; }
  draw();
};

/* 2.3 IoU matrix by broadcasting */
W.w4_iou_matrix = function (box) {
  V.say(box, 'N חיזויים מול M מלבני אמת: טבלה אחת, בלי לולאות. <b>לחץ "חיזויים חדשים"</b> ומצא בטבלה את הזוגות שעוברים את 0.5.');
  let seed = 1; V.btns(box, [['חיזויים חדשים', () => { seed++; draw(); }, 'primary']]);
  const svg = svgBox(box, 560, 230); const out = mono(box);
  const gts = [[40, 40, 120, 100], [150, 60, 230, 160], [60, 130, 110, 200]];
  function draw() { svg.innerHTML = ''; const r = rng(seed * 31); const dets = [...Array(5)].map(() => { const g = gts[Math.floor(r() * 3)]; const j = () => (r() - 0.5) * 40; return [g[0] + j(), g[1] + j(), g[2] + j(), g[3] + j()]; });
    V.s('rect', { x: 0, y: 0, width: 260, height: 230, style: { fill: 'var(--surface2, #f6f6f4)' } }, svg); gts.forEach((g, j) => { rect(svg, g, { stroke: 'var(--c3)', strokeWidth: 3 }); txt(svg, [g[0] + 3, g[1] + 13], 'g' + j, { fill: 'var(--c3)' }); }); dets.forEach((d, i) => { rect(svg, d, { stroke: 'var(--c2)', strokeDasharray: '4 2' }); txt(svg, [d[2] - 14, d[3] - 3], 'd' + i, { fill: 'var(--c2)' }); });
    const M = dets.map(d => gts.map(g => iou(d, g))); M.forEach((row, i) => row.forEach((v, j) => { V.s('rect', { x: 300 + j * 80, y: 20 + i * 40, width: 76, height: 36, style: { fill: v >= 0.5 ? 'rgba(47,158,68,.35)' : `rgba(66,99,235,${v * 0.5})` } }, svg); txt(svg, [318 + j * 80, 43 + i * 40], f(v, 2), { fontSize: '13px' }); }));
    gts.forEach((_, j) => txt(svg, [330 + j * 80, 14], 'g' + j)); dets.forEach((_, i) => txt(svg, [282, 43 + i * 40], 'd' + i));
    out.textContent = 'A[:, None, :] → (5, 1, 4)    B[None, :, :] → (1, 3, 4)\nbroadcast → (5, 3): one IoU per pair'; }
  draw();
};

/* 3.1 why duplicates */
W.w4_dups = function (box) {
  V.say(box, 'רשת של תאים מעל רכב. כל תא שהרכב נוגע בו חוזה מלבן משלו, ורובם טובים. <b>שנה את גודל התא</b>.');
  let cell = 32; V.slider(box, 'גודל תא (צעד)', 8, 64, 8, cell, v => { cell = v; draw(); });
  const svg = svgBox(box, 400, 260); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const car = [130, 90, 260, 160]; V.s('rect', { x: car[0], y: car[1], width: 130, height: 70, rx: 10, style: { fill: '#5b6d8c' } }, svg); const r = rng(3); let n = 0;
    for (let x = 0; x < 400; x += cell) for (let y = 0; y < 260; y += cell) { V.s('rect', { x, y, width: cell, height: cell, style: { fill: 'none', stroke: 'var(--line2)', strokeWidth: 0.5 } }, svg); const c = [x + cell / 2, y + cell / 2]; if (c[0] > car[0] && c[0] < car[2] && c[1] > car[1] && c[1] < car[3]) { n++; const j = () => (r() - 0.5) * 14; rect(svg, [car[0] + j(), car[1] + j(), car[2] + j(), car[3] + j()], { stroke: 'var(--c2)', strokeWidth: 1.2 }); V.s('circle', { cx: c[0], cy: c[1], r: 3, style: { fill: 'var(--c2)' } }, svg); } }
    out.innerHTML = '<b>' + n + '</b> תאים "ראו" את הרכב, ו־' + n + ' מלבנים דומים יצאו. זה לא באג: כך המזהה אומן (אחד־לרבים).'; }
  draw();
};

/* 3.2 greedy NMS with a threshold */
W.w4_nms = function (box) {
  V.say(box, 'האלגוריתם החמדני על ענן של מלבנים משלושה רכבים. <b>שנה את הסף</b>: נמוך מדי מוחק עצמים אמיתיים, גבוה מדי משאיר כפילויות.');
  let thr = 0.5; V.slider(box, 'סף חפיפה', 0.1, 0.95, 0.05, thr, v => { thr = v; draw(); });
  const r = rng(12); const objs = [[60, 60, 160, 120], [150, 70, 250, 135], [300, 120, 380, 220]]; const boxes = [], scores = []; objs.forEach(o => { for (let k = 0; k < 5; k++) { const j = () => randn(r) * 6; boxes.push([o[0] + j(), o[1] + j(), o[2] + j(), o[3] + j()]); scores.push(0.5 + r() * 0.45); } });
  const svg = svgBox(box, 440, 260); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const keep = nms(boxes, scores, thr); boxes.forEach((b, i) => rect(svg, b, keep.includes(i) ? { stroke: 'var(--c3)', strokeWidth: 3 } : { stroke: 'var(--ink3)', strokeWidth: 0.8, strokeDasharray: '3 2' }));
    const per = objs.map(o => keep.filter(i => iou(boxes[i], o) > 0.5).length); out.innerHTML = 'נשארו <b>' + keep.length + '</b> מלבנים לשלושה רכבים (' + per.join(', ') + ' לכל רכב). ' + (per.some(x => x === 0) ? 'רכב אחד נמחק לגמרי: הסף נמוך מדי לרכבים שחופפים.' : per.some(x => x > 1) ? 'נשארו כפילויות.' : 'אחד לכל רכב.'); }
  draw();
};

/* 3.3 manual trace of the five boxes */
W.w4_nms_trace = function (box) {
  V.say(box, 'חמשת המלבנים של הסעיף, צעד אחרי צעד, עם הסף שתבחר (תרגיל 3.1: נסה 0.7 ו־0.8).');
  const B = [[100, 100, 200, 200], [110, 105, 210, 205], [300, 300, 380, 380], [105, 95, 195, 190], [305, 310, 385, 390]], S = [0.9, 0.8, 0.75, 0.7, 0.6]; let thr = 0.5;
  const svg = svgBox(box, 440, 330); const out = mono(box);
  V.slider(box, 'סף', 0.3, 0.9, 0.05, thr, v => { thr = v; st.go(0); });
  function trace() { let order = [0, 1, 2, 3, 4]; const steps = []; const keep = []; while (order.length) { const i = order[0]; keep.push(i); const rest = order.slice(1); const del = rest.filter(j => iou(B[i], B[j]) >= thr); steps.push({ pick: i, ious: rest.map(j => j + ': ' + f(iou(B[i], B[j]), 2)), del, keep: keep.slice() }); order = rest.filter(j => !del.includes(j)); } return steps; }
  const st = V.stepper(box, () => trace().length + 1, s => { const T = trace(); svg.innerHTML = ''; const done = new Set(), gone = new Set(); T.slice(0, s).forEach(t => { done.add(t.pick); t.del.forEach(d => gone.add(d)); });
    B.forEach((b, i) => { rect(svg, [b[0] - 80, b[1] - 70, b[2] - 80, b[3] - 70], done.has(i) ? { stroke: 'var(--c3)', strokeWidth: 3 } : gone.has(i) ? { stroke: 'var(--c2)', strokeDasharray: '4 3', strokeWidth: 1 } : { stroke: 'var(--ink3)' }); txt(svg, [b[0] - 76, b[1] - 56 + i * 10], i + ' (' + S[i] + ')', { fill: done.has(i) ? 'var(--c3)' : 'var(--ink3)' }); });
    out.textContent = s === 0 ? 'sorted by score: 0, 1, 2, 3, 4' : T.slice(0, s).map((t, k) => 'step ' + (k + 1) + ': keep ' + t.pick + '   IoU with ' + (t.ious.join(', ') || '—') + '   → delete ' + (t.del.join(', ') || 'none')).join('\n') + (s === T.length ? '\nresult: ' + T[T.length - 1].keep.join(', ') : ''); });
};

/* 3.4 the crowd problem */
W.w4_crowd = function (box) {
  V.say(box, 'שני אנשים צמודים, כל אחד זוהה נכון (חפיפה ביניהם 0.6), ועוד כפילות של אדם שלישי (חפיפה 0.75). <b>הזז את הסף</b> וחפש ערך שפותר את שתי הבעיות.');
  let thr = 0.5; V.slider(box, 'סף', 0.3, 0.9, 0.05, thr, v => { thr = v; draw(); });
  const B = [[100, 100, 160, 260], [115, 100, 175, 260], [260, 100, 320, 260], [266, 105, 326, 262]], S = [0.9, 0.85, 0.88, 0.7];
  const svg = svgBox(box, 440, 300); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const keep = nms(B, S, thr); B.forEach((b, i) => rect(svg, b, keep.includes(i) ? { stroke: i === 3 ? 'var(--c2)' : 'var(--c3)', strokeWidth: 3 } : { stroke: 'var(--ink3)', strokeDasharray: '4 3' }));
    const lost = !keep.includes(1), dup = keep.includes(3); out.innerHTML = (lost ? '<b class="bad">אדם אמיתי נמחק.</b> ' : '') + (dup ? '<b class="bad">כפילות נשארה.</b> ' : '') + (!lost && !dup ? 'כאן זה עבד, כי 0.6 < סף ≤ 0.75. בקהל אמיתי אין חלון כזה.' : ''); }
  draw();
};

/* 4.1 TP, FP, FN */
W.w4_tp_fp = function (box) {
  V.say(box, 'מלבני אמת (ירוק) וזיהויים עם ציון. <b>שנה את סף הציון ואת סף החפיפה</b>, וראה איך כל זיהוי מסווג: פגיעה, פספוס, ומלבנים שהוחמצו.');
  let sthr = 0.3, ithr = 0.5; const r1 = V.row(box); V.slider(r1, 'סף ציון', 0, 0.95, 0.05, sthr, v => { sthr = v; draw(); }); V.slider(r1, 'סף חפיפה', 0.3, 0.9, 0.05, ithr, v => { ithr = v; draw(); });
  const G = [[40, 40, 120, 100], [160, 50, 240, 120], [280, 60, 330, 140], [60, 160, 140, 230], [220, 170, 300, 240]];
  const D = [[44, 42, 122, 104, 0.95], [48, 40, 126, 102, 0.6], [165, 60, 250, 130, 0.85], [285, 75, 335, 150, 0.55], [350, 180, 400, 230, 0.4], [210, 165, 290, 238, 0.7], [70, 175, 155, 245, 0.25]];
  const svg = svgBox(box, 440, 270); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const d = D.filter(x => x[4] >= sthr); const m = match(d.map(x => x.slice(0, 4)), d.map(x => x[4]), G, ithr); const used = new Set(); m.forEach(x => { if (x.tp) G.forEach((g, j) => { if (!used.has(j) && Math.abs(iou(d[x.k], g) - x.iou) < 1e-9) used.add(j); }); });
    G.forEach((g, j) => rect(svg, g, { stroke: used.has(j) ? 'var(--c3)' : 'var(--c5, #e8a33d)', strokeWidth: 3, strokeDasharray: used.has(j) ? '' : '6 3' }));
    m.forEach(x => { const b = d[x.k]; rect(svg, b, { stroke: x.tp ? 'var(--c1)' : 'var(--c2)', strokeWidth: 1.5 }); txt(svg, [b[0] + 2, b[3] - 3], (x.tp ? 'TP ' : 'FP ') + b[4], { fill: x.tp ? 'var(--c1)' : 'var(--c2)' }); });
    const tp = m.filter(x => x.tp).length, fp = m.length - tp, fn = G.length - tp; out.innerHTML = 'TP ' + tp + ', FP ' + fp + ', FN ' + fn + ' (בכתום מקווקו). דיוק <b>' + f(tp / Math.max(1, tp + fp), 2) + '</b>, רגישות <b>' + f(tp / G.length, 2) + '</b>. שים לב לזיהוי הכפול על העצם השמאלי העליון.'; }
  draw();
};

/* 4.2 the precision-recall curve of the example */
W.w4_pr_curve = function (box) {
  V.say(box, 'הדוגמה של הסעיף: ארבעה מלבני אמת, חמישה זיהויים. <b>עבור על הזיהויים</b> מהציון הגבוה לנמוך, וראה את העקומה ואת המעטפת שלה.');
  const rows = [[0.95, 1], [0.9, 0], [0.8, 1], [0.6, 0], [0.3, 1]]; const P = window.IM.plot(box, { w: 400, h: 220 }); const out = V.say(box);
  V.stepper(box, 6, s => { const d = rows.slice(0, s).map(([score, tp]) => ({ score, tp })); const res = apOf(rows.map(([score, tp]) => ({ score, tp })), 4); const pts = res.R.slice(0, s).map((r, i) => [r, res.P[i]]);
    const env = []; res.R.forEach((r, i) => env.push([r, res.env[i]])); const series = [{ pts: pts.length ? pts : [[0, 1]], color: 'var(--c1)', width: 2, dots: true }]; if (s === 5) series.push({ pts: [[0, env[0][1]]].concat(env.flatMap((p, i) => i ? [[env[i - 1][0], p[1]], p] : [p])).concat([[env[env.length - 1][0], 0]]), color: 'var(--c2)', width: 2, dash: '4 3' });
    P.draw(series, [0, 1], [0, 1.05]); out.innerHTML = s === 0 ? 'עוד לא עברנו על אף זיהוי.' : 'זיהוי ' + s + ': ציון ' + rows[s - 1][0] + ', ' + (rows[s - 1][1] ? 'פגיעה' : 'פספוס') + '. רגישות ' + f(res.R[s - 1], 2) + ', דיוק ' + f(res.P[s - 1], 2) + '.' + (s === 5 ? ' המעטפת (אדום) ממוצעת על 101 רמות: <b>AP = ' + f(res.ap, 3) + '</b>.' : ''); });
};

/* 4.3 the 101-point average */
W.w4_ap101 = function (box) {
  V.say(box, 'ממוצע על 101 רמות רגישות: לכל רמה r, הדיוק הטוב ביותר ברגישות r ומעלה. <b>הוסף פגיעה או פספוס</b> בסוף הרשימה וראה איך AP משתנה.');
  const rows = [[0.95, 1], [0.9, 0], [0.8, 1], [0.6, 0], [0.3, 1]]; let extra = []; const nGT = 4;
  V.btns(box, [['+ פגיעה', () => { if (extra.length < 3) extra.push(1); draw(); }], ['+ פספוס', () => { if (extra.length < 3) extra.push(0); draw(); }], ['איפוס', () => { extra = []; draw(); }, 'ghost']]);
  const svg = svgBox(box, 460, 200); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const all = rows.concat(extra.map((tp, i) => [0.2 - i * 0.05, tp])).map(([score, tp]) => ({ score, tp })); const res = apOf(all, nGT);
    for (let k = 0; k <= 100; k++) { const r = k / 100; const idx = res.R.findIndex(x => x >= r - 1e-12); const v = idx >= 0 ? res.env[idx] : 0; V.s('rect', { x: 20 + k * 4.2, y: 180 - v * 160, width: 3.4, height: v * 160, style: { fill: v ? 'var(--c1)' : 'var(--line2)' } }, svg); }
    txt(svg, [20, 196], '0'); txt(svg, [440, 196], '1'); out.innerHTML = 'עמודה לכל רמת רגישות (101). AP הוא הגובה הממוצע: <b>' + f(res.ap, 3) + '</b>. רמות שלא הושגו תורמות אפס.'; }
  draw();
};

/* 4.4 what each metric hides */
W.w4_metric_hides = function (box) {
  V.say(box, 'מזהה מדומה על 200 תמונות: מחמיץ 10%, מוסיף פספוסים, ומזיז כל מלבן ברעש יחסי לגודלו. <b>הגדל את רעש המיקום</b> וראה איזה מדד שם לב. ולמטה: סף העבודה.');
  let noise = 0.05, conf = 0.5; const r1 = V.row(box); V.slider(r1, 'רעש מיקום (%)', 0, 15, 0.5, 5, v => { noise = v / 100; run(); }); V.slider(r1, 'סף עבודה', 0.1, 0.9, 0.05, conf, v => { conf = v; run(); });
  const out = mono(box);
  function run() { const r = rng(4); const res = {}; const thrs = [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95]; const dets = []; let nGT = 0;
    for (let im = 0; im < 200; im++) { const n = 3 + Math.floor(r() * 4); for (let k = 0; k < n; k++) { nGT++; const s = 30 + r() * 70; const g = [100, 100, 100 + s, 100 + s]; if (r() < 0.1) continue; const j = () => randn(r) * noise * s; const p = [g[0] + j(), g[1] + j(), g[2] + j(), g[3] + j()]; dets.push({ iou: iou(g, p), score: Math.min(0.99, 0.55 + 0.4 * r()) }); } if (r() < 0.5) dets.push({ iou: 0, score: r() * 0.7 }); }
    thrs.forEach(t => { res[t] = apOf(dets.map(d => ({ score: d.score, tp: d.iou >= t })), nGT).ap; }); const avg = thrs.reduce((s, t) => s + res[t], 0) / thrs.length;
    const w = dets.filter(d => d.score >= conf); const tp = w.filter(d => d.iou >= 0.5).length;
    out.textContent = 'AP@0.5      ' + f(res[0.5], 3) + '\nAP@0.75     ' + f(res[0.75], 3) + '\nAP@0.5:0.95 ' + f(avg, 3) + '\n\nat working threshold ' + conf + ':  precision ' + f(tp / Math.max(1, w.length), 2) + '  recall ' + f(tp / nGT, 2); }
  run();
};
})();
