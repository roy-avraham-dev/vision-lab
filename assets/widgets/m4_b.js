/* Module 4 visuals — chapters 5–8: the YOLO family, attention detector and matching, small objects, data */
(function () {
const W = window.W, V = window.V, el = V.el; const { f, ltr, mono, svgBox, rect, txt, iou, nms, rng, randn } = window.BX;

/* 5.1 backbone, neck, head: how many cells */
W.w4_heads = function (box) {
  V.say(box, 'שלוש מפות בצעדים 8, 16 ו־32. כל תא הוא מועמד לזיהוי. <b>שנה את גודל הקלט</b> (תרגיל 5.1: 1280).');
  let s = 640; V.slider(box, 'גודל קלט', 320, 1600, 32, s, v => { s = v; draw(); });
  const svg = svgBox(box, 520, 190); const out = V.say(box);
  function draw() { svg.innerHTML = ''; let tot = 0; [8, 16, 32].forEach((st, i) => { const n = Math.floor(s / st); tot += n * n; const size = 150, x0 = 10 + i * 172; V.s('rect', { x: x0, y: 10, width: size, height: size, style: { fill: 'var(--surface2, #f6f6f4)', stroke: 'var(--line2)' } }, svg); const step = size / n; if (step > 2) for (let k = 0; k <= n; k++) { V.s('line', { x1: x0 + k * step, y1: 10, x2: x0 + k * step, y2: 10 + size, style: { stroke: 'var(--line2)', strokeWidth: 0.4 } }, svg); V.s('line', { x1: x0, y1: 10 + k * step, x2: x0 + size, y2: 10 + k * step, style: { stroke: 'var(--line2)', strokeWidth: 0.4 } }, svg); } txt(svg, [x0, 180], 'צעד ' + st + ': ' + n + '² = ' + (n * n).toLocaleString('en'), { fontSize: '12px' }); });
    out.innerHTML = 'סך הכול <b>' + tot.toLocaleString('en') + '</b> תאים. ' + (s === 640 ? 'בקלט 640: 8,400, כמו בסעיף.' : 'פי ' + f(tot / 8400, 2) + ' מקלט 640, ובערך אותו יחס בחישוב.'); }
  draw();
};

/* 5.2 anchor-free decoding */
W.w4_anchor_free = function (box) {
  V.say(box, 'מזהה בלי עוגנים: כל תא חוזה ארבעה מרחקים ממרכזו, ביחידות של הצעד. <b>שנה את המרחקים</b>. ערכי ההתחלה הם של תרגיל 5.2: תא (12, 10), צעד 32.');
  const d = [1.5, 0.75, 2, 1.25]; const cell = [12, 10], st = 32;
  const r1 = V.row(box); ['שמאל', 'למעלה', 'ימין', 'למטה'].forEach((n, i) => V.slider(r1, n, 0, 4, 0.25, d[i], v => { d[i] = v; draw(); }));
  const svg = svgBox(box, 480, 300); const out = mono(box);
  function draw() { svg.innerHTML = ''; const o = [240 - 400 * 0.6, 150 - 336 * 0.6]; const k = 0.6; for (let x = 8; x <= 17; x++) for (let y = 7; y <= 14; y++) V.s('rect', { x: o[0] + x * st * k, y: o[1] + y * st * k, width: st * k, height: st * k, style: { fill: x === cell[0] && y === cell[1] ? 'rgba(66,99,235,.25)' : 'none', stroke: 'var(--line2)', strokeWidth: 0.5 } }, svg);
    const c = [(cell[0] + 0.5) * st, (cell[1] + 0.5) * st]; const b = [c[0] - d[0] * st, c[1] - d[1] * st, c[0] + d[2] * st, c[1] + d[3] * st]; rect(svg, b, { stroke: 'var(--c2)', strokeWidth: 2.5 }, k, o); V.s('circle', { cx: o[0] + c[0] * k, cy: o[1] + c[1] * k, r: 4, style: { fill: 'var(--c1)' } }, svg);
    out.textContent = 'cell center = ((12 + 0.5)·32, (10 + 0.5)·32) = (' + c.join(', ') + ')\ndistances × 32 = (' + d.map(x => x * st).join(', ') + ')\nbox = (' + b.join(', ') + ')'; }
  draw();
};

/* 5.3 why the box loss uses IoU */
W.w4_loss_iou = function (box) {
  V.say(box, 'אותה טעות של 5 פיקסלים במלבן קטן ובגדול. הפסד בפיקסלים רואה אותו דבר; הפסד שמבוסס על חפיפה מבחין. <b>שנה את הטעות</b>.');
  let e = 5; V.slider(box, 'טעות (פיקסלים)', 0, 20, 1, e, v => { e = v; draw(); });
  const out = mono(box);
  function draw() { const L = s => { const g = [0, 0, s, s], p = [e, e, s + e, s + e]; return { l1: 4 * e, iou: 1 - iou(g, p) }; }; const a = L(10), b = L(300);
    out.textContent = '            L1 (pixels)   1 − IoU\nbox 10:     ' + f(a.l1, 0).padEnd(14) + f(a.iou, 3) + '\nbox 300:    ' + f(b.l1, 0).padEnd(14) + f(b.iou, 3) + '\n→ the IoU loss says the small box is much worse; L1 says they are equal'; }
  draw();
};

/* 5.4 with and without duplicate filtering */
W.w4_e2e = function (box) {
  V.say(box, 'שני מצבי הרצה: עם סינון כפילויות אחרי הרשת, ובלעדיו (מקצה לקצה). <b>הוסף עצמים לתמונה</b> וראה מה תלוי במספר שלהם. היחידות יחסיות, להמחשה.');
  let n = 20; V.slider(box, 'עצמים בתמונה', 1, 300, 1, n, v => { n = v; draw(); });
  const svg = svgBox(box, 480, 140); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const net = 50; const nmsT = 2 + 0.0015 * (n * 8) ** 1.3 / 10; const bars = [['עם סינון', [net, nmsT]], ['מקצה לקצה', [net + 3, 0]]]; const mx = net + 3 + Math.max(nmsT, 3);
    bars.forEach(([l, parts], i) => { let x = 100; parts.forEach((p, j) => { if (!p) return; V.s('rect', { x, y: 25 + i * 55, width: p / mx * 360, height: 32, style: { fill: j ? 'var(--c2)' : 'var(--c1)' } }, svg); x += p / mx * 360; }); txt(svg, [10, 46 + i * 55], l, { fontSize: '13px' }); });
    out.innerHTML = 'כחול: הרשת. אדום: הסינון, שרץ על המעבד וגדל עם מספר המלבנים. בלי סינון הזמן קבוע.'; }
  draw();
};

/* 5.5 dataset layout and the working threshold */
W.w4_dataset_files = function (box) {
  V.say(box, 'מבנה התיקיות שהספרייה מצפה לו: לכל תמונה קובץ תיוג באותו שם. <b>בחר תמונה</b> וראה איפה התיוג שלה. ולמטה: conf, סף העבודה.');
  const imgs = ['train/frame_0001.jpg', 'train/frame_0002.jpg', 'val/frame_0451.jpg']; let pick = 0, conf = 0.4;
  V.tabs(box, imgs, i => { pick = i; draw(); }); V.slider(box, 'conf', 0.05, 0.95, 0.05, conf, v => { conf = v; draw(); });
  const out = mono(box); const preds = [[0.92, 'vehicle'], [0.81, 'vehicle'], [0.66, 'person'], [0.44, 'person'], [0.31, 'vehicle'], [0.12, 'person']];
  function draw() { const im = imgs[pick]; const lab = im.replace(/^/, '').replace('.jpg', '.txt');
    out.textContent = 'drone.yaml → path: /data/drone\n/data/drone/images/' + im + '\n/data/drone/labels/' + lab + '   ← same name, .txt\n\nresults with conf=' + conf + ':\n' + preds.filter(p => p[0] >= conf).map(p => '  ' + p[1].padEnd(8) + ' ' + p[0]).join('\n') + '\n(' + preds.filter(p => p[0] < conf).length + ' hidden below the threshold)'; }
  draw();
};

/* 6.1 queries */
W.w4_queries = function (box) {
  V.say(box, 'מזהה מבוסס קשב: מספר קבוע של שאילתות, וכל אחת מוציאה מלבן או "אין עצם". <b>הוסף רכבים לחניון</b> מעבר למספר השאילתות.');
  let cars = 40, Q = 100; const r1 = V.row(box); V.slider(r1, 'רכבים בתמונה', 1, 200, 1, cars, v => { cars = v; draw(); }); V.slider(r1, 'שאילתות', 50, 300, 50, Q, v => { Q = v; draw(); });
  const svg = svgBox(box, 480, 200); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const cols = 25; for (let i = 0; i < Q; i++) { const x = 10 + (i % cols) * 18, y = 10 + Math.floor(i / cols) * 16; V.s('rect', { x, y, width: 14, height: 12, rx: 2, style: { fill: i < Math.min(cars, Q) ? 'var(--c3)' : 'var(--line2)' } }, svg); }
    const miss = Math.max(0, cars - Q); out.innerHTML = 'ירוק: שאילתה שתפסה רכב. אפור: "אין עצם". ' + (miss ? '<b class="bad">' + miss + ' רכבים הוחמצו בוודאות</b>: מספר השאילתות הוא תקרה.' : 'יש מספיק שאילתות.'); }
  draw();
};

/* 6.2 one-to-one matching on the section's example */
W.w4_hungarian = function (box) {
  V.say(box, 'מטריצת העלויות של הסעיף: שש שאילתות, שני עצמים. <b>לחץ על תא</b> כדי לשייך שאילתה לעצם, ונסה להגיע לעלות הנמוכה ביותר. השיוך האופטימלי מסומן אחרי שתלחץ "פתור".');
  const gts = [[100, 100, 200, 200], [300, 120, 380, 260]]; const q = [[102, 98, 198, 205], [105, 103, 203, 199], [298, 118, 385, 262], [50, 50, 90, 90], [310, 130, 370, 250], [400, 400, 450, 450]]; const p = [0.9, 0.85, 0.8, 0.1, 0.6, 0.05];
  const C = q.map((b, i) => gts.map(g => -p[i] + 5 * b.reduce((s, x, k) => s + Math.abs(x - g[k]), 0) / 640 + 2 * (1 - iou(b, g)))); let sel = [null, null], show = false;
  const g = el('div', { style: { display: 'grid', gridTemplateColumns: '90px 110px 110px', gap: '4px', direction: 'ltr', margin: '8px auto', width: 'fit-content' } }); box.appendChild(g); V.btns(box, [['פתור', () => { show = true; draw(); }, 'primary'], ['איפוס', () => { sel = [null, null]; show = false; draw(); }, 'ghost']]); const out = V.say(box);
  function best() { let b = null, bv = 1e9; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) if (i !== j && C[i][0] + C[j][1] < bv) { bv = C[i][0] + C[j][1]; b = [i, j]; } return [b, bv]; }
  function draw() { g.innerHTML = ''; g.append(el('span'), el('b', { style: { textAlign: 'center' } }, 'עצם 0'), el('b', { style: { textAlign: 'center' } }, 'עצם 1')); const [b] = best();
    C.forEach((row, i) => { g.appendChild(el('b', {}, 'שאילתה ' + i)); row.forEach((v, j) => { const on = sel[j] === i, opt = show && b[j] === i; const c = el('button', { class: 'sm', style: { background: on ? 'var(--c1)' : opt ? 'rgba(47,158,68,.3)' : '', color: on ? '#fff' : '' } }, f(v, 2)); c.onclick = () => { sel[j] = sel[j] === i ? null : i; if (sel[1 - j] === i) sel[1 - j] = null; draw(); }; g.appendChild(c); }); });
    const [bb, bv] = best(); const tot = sel.every(x => x !== null) ? C[sel[0]][0] + C[sel[1]][1] : null; out.innerHTML = (tot !== null ? 'העלות שלך: <b>' + f(tot, 3) + '</b>. ' : 'בחר שאילתה לכל עצם. ') + (show ? 'האופטימום: שאילתה ' + bb[0] + ' לעצם 0 ושאילתה ' + bb[1] + ' לעצם 1, עלות ' + f(bv, 3) + '. שאילתה 1, הכמעט זהה ל־0, מקבלת "אין עצם".' : ''); }
  draw();
};

/* 6.3 greedy vs optimal */
W.w4_greedy = function (box) {
  V.say(box, 'המטריצה של הסעיף. <b>שנה מספרים</b>, והשווה את השיטה החמדנית (כל פעם הזוג הזול ביותר) לשיוך האופטימלי.');
  const M = [[4, 1, 3], [2, 0, 5], [3, 2, 2]];
  const g = el('div', { style: { display: 'grid', gridTemplateColumns: '80px repeat(3, 60px)', gap: '4px', direction: 'ltr', margin: '8px auto', width: 'fit-content' } }); box.appendChild(g); const out = V.say(box);
  g.append(el('span'), ...[0, 1, 2].map(j => el('b', { style: { textAlign: 'center' } }, 'עצם ' + j))); M.forEach((r, i) => { g.appendChild(el('b', {}, 'שאילתה ' + i)); r.forEach((v, j) => { const inp = el('input', { type: 'number', value: v, style: { width: '60px', textAlign: 'center' } }); inp.oninput = () => { M[i][j] = +inp.value || 0; calc(); }; g.appendChild(inp); }); });
  const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  function calc() { const used = [new Set(), new Set()]; let gsum = 0; const gp = []; for (let k = 0; k < 3; k++) { let b = null; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (!used[0].has(i) && !used[1].has(j) && (!b || M[i][j] < M[b[0]][b[1]])) b = [i, j]; used[0].add(b[0]); used[1].add(b[1]); gsum += M[b[0]][b[1]]; gp.push('(' + b.join(',') + ')=' + M[b[0]][b[1]]); }
    let best = null; perms.forEach(p => { const s = p.reduce((a, j, i) => a + M[i][j], 0); if (!best || s < best[0]) best = [s, p]; }); out.innerHTML = 'חמדני: ' + ltr(gp.join(' → ')) + ' = <b>' + gsum + '</b>. אופטימלי (ההונגרי): <b>' + best[0] + '</b> ' + ltr('(' + best[1].map((j, i) => i + '→' + j).join(', ') + ')') + '.'; }
  calc();
};

/* 6.4 which family */
W.w4_choose = function (box) {
  V.say(box, 'מצבים מהשטח. לכל אחד, מה השיקול הכי חשוב?');
  const Q = [['מחשב קצה חלש בלי האצה לשכבות קשב.', 0, 'שכבות קשב כבדות על חומרה שלא בנויה להן. מודדים, כמו במודול 6.'], ['חניון מצולם מלמעלה עם 400 רכבים.', 1, 'מספר השאילתות הוא תקרה.'], ['מערכת שחייבת זמן ריצה קבוע לכל פריים.', 2, 'בלי סינון, הזמן לא תלוי במספר העצמים.']];
  const A = ['חומרה', 'תקרת שאילתות', 'זמן קבוע']; let k = 0; const q = el('div', { style: { fontWeight: 600, margin: '8px 0' } }); box.appendChild(q); const opts = V.row(box); const out = V.say(box);
  function show() { if (k >= Q.length) { q.textContent = 'סיימת.'; opts.innerHTML = ''; return; } q.textContent = Q[k][0]; opts.innerHTML = ''; A.forEach((a, i) => opts.appendChild(V.button(a, () => { out.innerHTML = (i === Q[k][1] ? '<b class="good">נכון.</b> ' : '<b class="bad">לא בדיוק.</b> ') + Q[k][2]; k++; setTimeout(show, 1400); }, 'sm'))); }
  show();
};

/* 7.1 the problem in numbers */
W.w4_downscale = function (box) {
  V.say(box, 'כמה פיקסלים נשארים לעצם אחרי שהתמונה מוקטנת לקלט של הרשת? <b>שנה את הגדלים</b>. תא במפה העדינה ביותר הוא 8 פיקסלים.');
  let Wd = 4000, obj = 15, inp = 640; const r1 = V.row(box); V.slider(r1, 'רוחב התמונה', 1000, 8000, 100, Wd, v => { Wd = v; draw(); }); V.slider(r1, 'גודל העצם (פיקסלים)', 5, 100, 1, obj, v => { obj = v; draw(); }); V.slider(r1, 'קלט הרשת', 320, 1920, 32, inp, v => { inp = v; draw(); });
  const svg = svgBox(box, 360, 120); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const px = obj * inp / Wd; [[8, 'תא בצעד 8', 'var(--line2)'], [px, 'העצם ברשת', 'var(--c2)']].forEach(([s, l, c], i) => { V.s('rect', { x: 60 + i * 160, y: 60 - s * 2, width: s * 4, height: s * 4, style: { fill: c } }, svg); txt(svg, [40 + i * 160, 112], l); });
    out.innerHTML = 'הקטנה פי ' + f(Wd / inp, 2) + ': העצם תופס <b>' + f(px, 1) + '</b> פיקסלים ברשת. ' + (px < 8 ? 'קטן מתא אחד: אין לרשת מה לראות.' : 'מספיק כדי שיהיה סיכוי.'); }
  draw();
};

/* 7.2 tiles */
W.w4_tiles = function (box) {
  V.say(box, 'חלוקה לאריחים, כמו הפונקציה tiles של הסעיף. <b>שנה גודל תמונה, אריח וחפיפה</b> (תרגיל 7.1: 1920 על 1080).');
  let Wd = 4000, Hd = 3000, t = 640, ov = 0.2; const r1 = V.row(box); V.slider(r1, 'רוחב', 640, 6000, 40, Wd, v => { Wd = v; draw(); }); V.slider(r1, 'גובה', 640, 4000, 40, Hd, v => { Hd = v; draw(); }); const r2 = V.row(box); V.slider(r2, 'אריח', 320, 1280, 32, t, v => { t = v; draw(); }); V.slider(r2, 'חפיפה', 0, 0.5, 0.05, ov, v => { ov = v; draw(); });
  const svg = svgBox(box, 480, 360); const out = V.say(box);
  function axis(L) { const step = Math.floor(t * (1 - ov)); const xs = []; for (let x = 0; x <= Math.max(L - t, 0); x += step) xs.push(x); if (xs[xs.length - 1] + t < L) xs.push(L - t); return xs; }
  function draw() { svg.innerHTML = ''; const k = Math.min(470 / Wd, 350 / Hd); V.s('rect', { x: 0, y: 0, width: Wd * k, height: Hd * k, style: { fill: 'var(--surface2, #f6f6f4)', stroke: 'var(--ink3)' } }, svg); const xs = axis(Wd), ys = axis(Hd);
    ys.forEach((y, j) => xs.forEach((x, i) => V.s('rect', { x: x * k, y: y * k, width: t * k, height: t * k, style: { fill: (i + j) % 2 ? 'rgba(66,99,235,.10)' : 'rgba(224,49,49,.08)', stroke: 'var(--c1)', strokeWidth: 0.7 } }, svg)));
    out.innerHTML = 'עמודות: ' + ltr(xs.join(', ')) + '. שורות: ' + ltr(ys.join(', ')) + '. סך הכול <b>' + xs.length * ys.length + '</b> אריחים. בקצב של 8 מילישניות לאריח: ' + f(xs.length * ys.length * 8, 0) + ' מילישניות לתמונה.'; }
  draw();
};

/* 7.3 the simulated experiment */
W.w4_tile_results = function (box) {
  V.say(box, 'הניסוי המדומה של הסעיף: 30 תמונות של 4000 על 3000, 50 עצמים בכל אחת. <b>בחר שיטה</b>.');
  const rows = [['תמונה מלאה מוקטנת', 1, 2.1, 0.033, 0.035], ['אריחים, בלי איחוד', 48, 82.1, 0.974, 0.756], ['אריחים + סינון כפילויות', 48, 53.2, 0.974, 0.924], ['אריחים + סינון + איחוד לפי IoS', 48, 49.2, 0.973, 0.969]];
  let k = 0; V.tabs(box, rows.map(r => r[0]), i => { k = i; draw(); });
  const svg = svgBox(box, 480, 170); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const r = rows[k]; [['רגישות', r[3]], ['AP@0.5', r[4]], ['זיהויים / 50', Math.min(1, r[2] / 100)]].forEach(([l, v], i) => { V.s('rect', { x: 120, y: 15 + i * 50, width: v * 340, height: 30, style: { fill: ['var(--c3)', 'var(--c1)', 'var(--c5, #e8a33d)'][i] } }, svg); txt(svg, [10, 35 + i * 50], l, { fontSize: '12px' }); txt(svg, [126 + v * 340, 35 + i * 50], i === 2 ? String(r[2]) : f(v, 3)); });
    out.innerHTML = r[1] + ' הרצות של המזהה לתמונה. ' + ['כמעט כל העצמים קטנים מדי אחרי ההקטנה.', 'הרגישות קפצה, אבל כפילויות מהחפיפה הורידו את הדיוק.', 'הסינון הוריד את הכפילויות.', 'איחוד לפי חיתוך חלקי השטח הקטן מטפל בחלק החתוך שנשאר.'][k]; }
  draw();
};

/* 7.4 an object cut by a tile border */
W.w4_tile_merge = function (box) {
  V.say(box, 'עצם שנחתך בגבול של אריח: אריח אחד רואה חצי, השכן רואה את כולו. <b>הזז את העצם</b> וראה למה סינון רגיל לא מאחד אותם, ומדד IoS (חיתוך חלקי השטח הקטן) כן.');
  let x = 600; V.slider(box, 'מיקום העצם', 540, 640, 2, x, v => { x = v; draw(); });
  const svg = svgBox(box, 480, 200); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const k = 0.5, o = [0, 20]; const border = 640; V.s('rect', { x: 0, y: o[1], width: border * k, height: 300 * k, style: { fill: 'rgba(66,99,235,.08)', stroke: 'var(--c1)' } }, svg); V.s('rect', { x: 512 * k, y: o[1] + 10, width: 640 * k, height: 300 * k, style: { fill: 'rgba(224,49,49,.06)', stroke: 'var(--c2)' } }, svg);
    const obj = [x, 120, x + 100, 180]; const part = [obj[0], obj[1], Math.min(obj[2], border), obj[3]]; rect(svg, obj, { stroke: 'var(--c3)', strokeWidth: 3 }, k, o); rect(svg, part, { stroke: 'var(--c1)', strokeWidth: 2, strokeDasharray: '5 3' }, k, o);
    const i = iou(obj, part); const ios = (part[2] - part[0]) * (part[3] - part[1]) / Math.min((part[2] - part[0]) * (part[3] - part[1]), 100 * 60); out.innerHTML = 'חפיפה בין המלא לחלקי: <b>' + f(i, 2) + '</b> ' + (i < 0.5 ? '(מתחת לסף: שניהם נשארים)' : '') + '. IoS: <b>' + f(ios, 2) + '</b>: החלקי כולו בתוך המלא. זהירות: כך גם אדם על משאית יאוחד בטעות.'; }
  draw();
};

/* 8.1 annotation guidelines */
W.w4_guidelines = function (box) {
  V.say(box, 'שני מתייגים, אותה תמונה, בלי הנחיות. <b>הוסף כללים</b> מהמסמך וראה איך ההסכמה עולה.');
  const rules = ['מתייגים רכב מוסתר אם רואים לפחות רבע ממנו', 'המלבן צמוד לפיקסלים, בלי שוליים', 'פחות מ־6 פיקסלים: אזור "להתעלם"']; const on = [false, false, false];
  rules.forEach((r, i) => { const l = el('label', { style: { display: 'flex', gap: '8px', margin: '4px 0' } }); const c = el('input', { type: 'checkbox' }); c.onchange = () => { on[i] = c.checked; draw(); }; l.append(c, el('span', {}, r)); box.appendChild(l); });
  const svg = svgBox(box, 440, 220); const out = V.say(box);
  function draw() { svg.innerHTML = ''; V.s('rect', { x: 0, y: 0, width: 440, height: 220, style: { fill: '#dfe5d8' } }, svg); const objs = [[40, 40, 140, 90], [200, 60, 290, 110], [330, 140, 345, 150], [100, 140, 180, 190]]; V.s('rect', { x: 230, y: 50, width: 70, height: 70, style: { fill: '#8a9a7b' } }, svg);
    objs.forEach(b => V.s('rect', { x: b[0], y: b[1], width: b[2] - b[0], height: b[3] - b[1], rx: 4, style: { fill: '#5b6d8c' } }, svg));
    const A = [[38, 38, 142, 92], [198, 58, 232, 112], [328, 138, 347, 152], [98, 138, 182, 192]]; const Bb = [[32, 32, 148, 98], null, null, [92, 132, 188, 198]];
    if (on[0]) Bb[1] = [198, 58, 232, 112]; if (on[1]) { Bb[0] = A[0]; Bb[3] = A[3]; } if (on[2]) { A[2] = null; } else Bb[2] = null;
    A.forEach(b => b && V.s('rect', { x: b[0], y: b[1], width: b[2] - b[0], height: b[3] - b[1], style: { fill: 'none', stroke: 'var(--c1)', strokeWidth: 2 } }, svg)); Bb.forEach(b => b && V.s('rect', { x: b[0], y: b[1], width: b[2] - b[0], height: b[3] - b[1], style: { fill: 'none', stroke: 'var(--c2)', strokeWidth: 2, strokeDasharray: '5 3' } }, svg));
    let agree = 0, tot = 0; A.forEach((a, i) => { const b = Bb[i]; if (!a && !b) return; tot++; if (a && b && iou(a, b) >= 0.9) agree++; }); out.innerHTML = 'כחול: מתייג א׳. אדום: מתייג ב׳. הסכמה (חפיפה מעל 0.9): <b>' + agree + ' מתוך ' + tot + '</b>.'; }
  draw();
};

/* 8.2 pre-labelling with a model */
W.w4_prelabel = function (box) {
  V.say(box, 'תיוג מוקדם: המודל מציע, ואתה מאשר או מתקן. החשבון של תרגיל 12.3: ציור ביד 8 שניות, אישור 3, תיקון 8. <b>שנה את איכות ההצעות</b>.');
  let good = 0.7, n = 10000; const r1 = V.row(box); V.slider(r1, 'הצעות נכונות (%)', 0, 100, 5, 70, v => { good = v / 100; draw(); }); V.slider(r1, 'עצמים', 1000, 50000, 1000, n, v => { n = v; draw(); });
  const out = V.say(box);
  function draw() { const hand = n * 8 / 3600, pre = (n * good * 3 + n * (1 - good) * 8) / 3600; out.innerHTML = 'ביד: <b>' + f(hand, 1) + '</b> שעות. עם הצעות: <b>' + f(pre, 1) + '</b> שעות. חיסכון: ' + f(hand - pre, 1) + ' שעות. הסיכון: מתייג עייף שמאשר הצעות כמעט נכונות, והמודל הבא לומד את הטעויות.'; }
  draw();
};

/* 8.3 export formats */
W.w4_export = function (box) {
  V.say(box, 'אותו עצם בשני פורמטי הייצוא. <b>שנה את המלבן</b>. ערכי ההתחלה הם של תרגיל 8.2 (מרכז (120, 90), תמונה 640 על 480).');
  const b = [100, 50, 140, 130]; let cls = 1;
  const r1 = V.row(box); ['x1', 'y1', 'x2', 'y2'].forEach((n, i) => V.slider(r1, n, 0, i % 2 ? 480 : 640, 1, b[i], v => { b[i] = v; draw(); })); V.tabs(box, ['0 person', '1 vehicle'], i => { cls = i; draw(); }, 1);
  const out = mono(box);
  function draw() { const [x1, y1, x2, y2] = b; out.textContent = 'labels/frame_0001.txt  (YOLO):\n' + cls + ' ' + [(x1 + x2) / 2 / 640, (y1 + y2) / 2 / 480, (x2 - x1) / 640, (y2 - y1) / 480].map(x => +x.toFixed(4)).join(' ') + '\n\nannotations.json  (COCO):\n{"image_id": 1, "category_id": ' + cls + ', "bbox": [' + [x1, y1, x2 - x1, y2 - y1].join(', ') + ']}'; }
  draw();
};

/* 8.4 split without leakage */
W.w4_leak = function (box) {
  V.say(box, 'הניסוי של הסעיף בקטן: 40 סרטונים, לכל אחד "מראה" ייחודי ותווית אחת, והסימן האמיתי חלש. מסווג שכן קרוב. <b>בחר איך לפצל</b>.');
  let group = false; V.tabs(box, ['אקראי לפי פריימים', 'לפי סרטונים'], i => { group = i === 1; run(); });
  const out = V.say(box);
  function run() { const accs = []; for (let rep = 0; rep < 10; rep++) { const r = rng(100 + rep); const vids = [...Array(40)].map((_, v) => ({ y: v % 2, look: [randn(r) * 3, randn(r) * 3, randn(r) * 3] })); const pts = [];
      vids.forEach((vd, v) => { for (let k = 0; k < 20; k++) pts.push({ v, y: vd.y, x: vd.look.map(a => a + randn(r) * 0.2).concat([(vd.y ? 0.3 : -0.3) + randn(r)]) }); });
      let test; if (group) { const tv = new Set(); while (tv.size < 10) tv.add(Math.floor(r() * 40)); test = p => tv.has(p.v); } else { const ids = new Set(pts.map((_, i) => i).filter(() => r() < 0.25)); test = (p, i) => ids.has(i); }
      const tr = pts.filter((p, i) => !test(p, i)), te = pts.filter((p, i) => test(p, i)); let ok = 0; te.forEach(p => { let bd = 1e9, by = 0; tr.forEach(q => { const d = q.x.reduce((s, a, k) => s + (a - p.x[k]) ** 2, 0); if (d < bd) { bd = d; by = q.y; } }); if (by === p.y) ok++; }); accs.push(ok / te.length); }
    const m = accs.reduce((a, b) => a + b) / accs.length, sd = Math.sqrt(accs.reduce((a, b) => a + (b - m) ** 2, 0) / accs.length); out.innerHTML = 'דיוק בבדיקה, 10 חלוקות: <b>' + f(m, 3) + '</b>, סטיית תקן ' + f(sd, 3) + '. ' + (group ? 'קרוב למטבע: המסווג לא למד את הסימן האמיתי. וסטיית התקן גבוהה, כי יש רק 10 סרטוני בדיקה.' : 'כמעט מושלם: פריים מאותו סרטון באימון, והמסווג פשוט זוכר את הסרטון.'); }
  run();
};
})();
