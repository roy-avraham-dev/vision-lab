/* Module 5 visuals — chapters 5–8: a full tracker, appearance, low-score detections, camera motion. */
(function () {
const W = window.W, V = window.V, el = V.el; const { f, ltr, mono, svgBox, rect, txt, iou, rng, randn } = window.BX; const { makeScene, makeTracker, score, COL } = window.TR;

/* a reusable player: scene + tracker options → frames drawn with IDs, plus a score line */
function player(box, sceneOpts, trackOpts, o) { o = o || {}; const svg = svgBox(box, 480, 300); const out = V.say(box); let fr, outs, sc;
  function run() { fr = makeScene(Object.assign({ W: 480, H: 300 }, sceneOpts())); const tr = makeTracker(trackOpts()); outs = fr.map(x => tr.step(x.dets, trackOpts().cmc ? x.shift : null)); sc = score(fr, outs); sc.maxId = Math.max(0, ...outs.flat().map(x => x.id)); st.refresh(); }
  const st = V.stepper(box, () => fr ? fr.length : 1, t => { if (!fr) return; svg.innerHTML = ''; V.s('rect', { x: 0, y: 0, width: 480, height: 300, style: { fill: '#e6eadf' } }, svg);
    if (o.showDets !== false) fr[t].dets.forEach(d => rect(svg, d.b, { stroke: d.s < 0.5 ? '#c92a2a' : '#555', strokeDasharray: '2 2', strokeWidth: 0.8, opacity: 0.7 }));
    outs[t].forEach(x => { rect(svg, x.b, { stroke: COL(x.id), strokeWidth: 2.2, strokeDasharray: x.pred ? '5 3' : '' }); txt(svg, [x.b[0], x.b[1] - 2], String(x.id), { fill: COL(x.id), fontSize: '11px', fontWeight: 700 }); });
    out.innerHTML = 'פריים ' + (t + 1) + '/' + fr.length + '. בכל הסרטון: <b>' + sc.sw + '</b> החלפות מזהה, <b>' + sc.ids + '</b> מספרים בפלט, ' + ltr('MOTA ' + f(sc.mota, 3)) + (o.extra ? ' ' + o.extra(sc) : '') + '.'; }, { speed: 90 });
  setTimeout(run, 0); return { run }; }

/* 5.1 the full tracker */
W.w5_sort_sim = function (box) {
  V.say(box, 'העוקב המלא של הפרק, ב־JavaScript: ארבעה מסנני קלמן לכל מסלול, חפיפה, האלגוריתם ההונגרי ושער. 18 עצמים, 10% פספוסים. <b>שנה פרמטרים ולחץ נגן</b>. מקווקו אפור: זיהוי. צבע: מסלול.');
  let mh = 3, ma = 30, thr = 0.3; const sr = V.row(box); V.slider(sr, 'min_hits', 1, 6, 1, mh, v => { mh = v; p.run(); }); V.slider(sr, 'max_age', 1, 60, 1, ma, v => { ma = v; p.run(); }); V.slider(sr, 'סף חפיפה', 0.05, 0.7, 0.05, thr, v => { thr = v; p.run(); });
  const p = player(box, () => ({ n: 18, T: 150, miss: 0.1, seed: 4 }), () => ({ minHits: mh, maxAge: ma, thr }));
};

/* 5.2 three details */
W.w5_order_bug = function (box) {
  V.say(box, 'שלושת הפרטים של הסעיף, כל אחד כמתג. <b>בחר פרט</b> והשווה את הספירות.');
  let mode = 0; V.tabs(box, ['הקוד של הסעיף', 'סדר הפוך: שיוך מול הפריים הקודם', 'פלט: גם מסלולים לא נמדדים', 'מספרים: רק באישור'], i => { mode = i; p.run(); });
  const p = player(box, () => ({ n: 22, T: 120, miss: 0.15, seed: 1, fp: 3, speed: 6 }), () => ({ minHits: 3, maxAge: 20, noPredictFirst: mode === 1, returnPred: mode === 2, idAtConfirm: mode === 3 }), { extra: sc => ', FP ' + sc.fp + ', המספר הגבוה בפלט ' + sc.maxId + '<br>' + ['חיזוי ואז שיוך, פלט רק של מסלולים שנמדדו, מספר בזמן היצירה (קפיצות של זמניים שמתו).', 'שיוך בלי חיזוי = העוקב התמים מפרק 1: עצמים מהירים מאבדים חפיפה עם המקום הישן, ויש החלפות.', 'מסלול לא נמדד מוצג במקווקו: הוא ניחוש, וחלק מהניחושים הם עצמים שכבר יצאו. FP קופץ.', 'מספר ניתן רק אחרי min_hits: המספרים רציפים, בלי קפיצות (תרגיל 5.3).'][mode] });
};

/* 5.3 max_age */
W.w5_max_age = function (box) {
  V.say(box, 'עצמים שמוסתרים 25 פריימים כל אחד. <b>הזז את max_age</b>: קצר מההסתרה — מספר חדש; ארוך מאוד — אותו דבר כמו 30, כי החיזוי כבר רחוק מדי (הטבלה של הסעיף: 5 → 67 מספרים, 30 ו־100 → 31).');
  let ma = 5; V.slider(box, 'max_age', 1, 100, 1, ma, v => { ma = v; p.run(); });
  const p = player(box, () => ({ n: 14, T: 150, miss: 0.05, occl: 25, seed: 6 }), () => ({ maxAge: ma }));
};

/* 6.1 cosine distance */
W.w5_cosine = function (box) {
  V.say(box, 'וקטורי מראה בדו־ממד (במציאות 128). <b>גרור את הזווית</b>: מרחק קוסינוס הוא 1 − cos של הזווית, ובשני וקטורים באורך 1 זה גם ½ ממרחק אוקלידי בריבוע (תרגיל 6.1: 60° → 0.5, ומרחק אוקלידי 1).');
  let a = 60; V.slider(box, 'זווית (מעלות)', 0, 180, 1, a, v => { a = v; draw(); }); const svg = svgBox(box, 300, 220); const out = mono(box);
  function draw() { svg.innerHTML = ''; const c = [150, 150], R = 110; V.s('circle', { cx: c[0], cy: c[1], r: R, style: { fill: 'none', stroke: 'var(--line2)' } }, svg); const r = a * Math.PI / 180;
    [[0, 'var(--c1)'], [r, 'var(--c2)']].forEach(([t, col]) => V.s('line', { x1: c[0], y1: c[1], x2: c[0] + R * Math.cos(t), y2: c[1] - R * Math.sin(t), style: { stroke: col, strokeWidth: 3 } }, svg));
    const cs = Math.cos(r); out.textContent = 'cos = ' + f(cs, 3) + '\ncosine distance = 1 − cos = ' + f(1 - cs, 3) + '\n|a − b| = sqrt(2 − 2 cos) = ' + f(Math.sqrt(2 - 2 * cs), 3); }
  draw();
};

/* 6.2 moving average of the embedding */
W.w5_ema = function (box) {
  V.say(box, 'כל תצפית של אותו אדם היא הווקטור האמיתי ועוד רעש. <b>שנה את הרעש ואת משקל הממוצע</b>: הממוצע הנע מתקרב לאמת, והמרחק לתצפית חדשה קטן (בסעיף: 0.41 בודד, 0.25 ממוצע, 0.62 לאדם אחר).');
  let nz = 0.3, w = 0.9; const sr = V.row(box); V.slider(sr, 'רעש המראה', 0.05, 0.8, 0.05, nz, v => { nz = v; draw(); }); V.slider(sr, 'משקל הממוצע', 0, 0.99, 0.01, w, v => { w = v; draw(); });
  const P = window.IM.plot(box, { w: 460, h: 190 }); const out = V.say(box); const D = 32;
  function draw() { const r = rng(3); const unit = v => { const n = Math.hypot(...v); return v.map(x => x / n); }; const g = unit([...Array(D)].map(() => randn(r))), o2 = unit([...Array(D)].map(() => randn(r))); const obs = () => unit(g.map(x => x + randn(r) * nz / Math.sqrt(D) * 4)); const cd = (a, b) => 1 - a.reduce((s, x, i) => s + x * b[i], 0);
    let e = obs(); const s1 = [], s2 = [], s3 = []; for (let t = 1; t < 60; t++) { const z = obs(); s1.push([t, cd(obs(), z)]); s2.push([t, cd(e, z)]); s3.push([t, cd(e, unit(o2.map(x => x + randn(r) * nz / Math.sqrt(D) * 4)))]); e = unit(e.map((x, i) => w * x + (1 - w) * z[i])); }
    const m = a => a.slice(20).reduce((s, p) => s + p[1], 0) / (a.length - 20); P.draw([{ pts: s1, color: '#adb5bd', width: 1.5 }, { pts: s2, color: 'var(--c3)', width: 2.5 }, { pts: s3, color: 'var(--c2)', width: 2 }], [1, 59], [0, 1.4]);
    out.innerHTML = 'אפור: תצפית מול תצפית (' + f(m(s1), 2) + '). ירוק: ממוצע המסלול מול תצפית חדשה (<b>' + f(m(s2), 2) + '</b>). אדום: ממוצע המסלול מול אדם אחר (' + f(m(s3), 2) + '). כל עוד הירוק מתחת לאדום, המראה מבחין.'; }
  draw();
};

/* 6.3 long occlusions with appearance */
W.w5_long_occ = function (box) {
  V.say(box, 'הסתרות של 40 פריימים, ובזמן ההסתרה העצם משנה כיוון: החיזוי של התנועה מפספס. <b>הדלק מאפייני מראה</b> ושנה את רעש המראה (תרגיל 6.4: מעל 0.3 המראה כבר לא עוזר).');
  let reid = false, nz = 0.15, ma = 60; const sr = V.row(box); V.tabs(sr, ['תנועה בלבד', 'תנועה + מראה'], i => { reid = i === 1; p.run(); }); V.slider(sr, 'רעש המראה', 0.05, 0.6, 0.05, nz, v => { nz = v; p.run(); }); V.slider(sr, 'max_age', 10, 90, 5, ma, v => { ma = v; p.run(); });
  const p = player(box, () => ({ n: 12, T: 160, miss: 0.05, occl: 40, seed: 7, embNoise: nz, turn: true }), () => ({ maxAge: ma, reid, thr: 0.3 }));
};

/* 7.1 the score dilemma */
W.w5_score_dilemma = function (box) {
  V.say(box, 'ההתפלגות של ציוני הזיהויים: עצמים אמיתיים (ירוק, כולל מוסתרים חלקית עם ציון נמוך) ורעש (אדום). <b>הזז את הסף</b>: אין ערך שמוותר גם על הרעש וגם לא מאבד עצמים.');
  let thr = 0.5; V.slider(box, 'סף ציון', 0.05, 0.95, 0.05, thr, v => { thr = v; draw(); }); const P = window.IM.plot(box, { w: 460, h: 190 }); const out = V.say(box);
  const g = (m, s, a) => x => a * Math.exp(-((x - m) ** 2) / (2 * s * s)); const tp = x => g(0.8, 0.1, 1)(x) + g(0.3, 0.1, 0.45)(x), fp = g(0.25, 0.09, 0.9);
  function draw() { const X = [...Array(101)].map((_, i) => i / 100); P.draw([{ pts: X.map(x => [x, tp(x)]), color: 'var(--c3)', width: 2.5 }, { pts: X.map(x => [x, fp(x)]), color: 'var(--c2)', width: 2.5 }, { vline: thr, color: 'var(--ink)', dash: '4 3' }], [0, 1], [0, 1.2]);
    const S = (fn, a, b) => X.filter(x => x >= a && x < b).reduce((s, x) => s + fn(x), 0); const lost = S(tp, 0, thr) / S(tp, 0, 2), kept = S(fp, thr, 2) / S(fp, 0, 2);
    out.innerHTML = 'עם סף ' + f(thr, 2) + ': מאבדים <b>' + f(lost * 100, 0) + '%</b> מהזיהויים האמיתיים, ומקבלים <b>' + f(kept * 100, 0) + '%</b> מהרעש. השלב השני של ByteTrack משתמש בזיהויים הנמוכים רק ליד מסלול קיים.'; }
  draw();
};

/* 7.2 two stages */
W.w5_byte = function (box) {
  V.say(box, 'פריים אחד, שלושה מסלולים. <b>עבור על השלבים</b>: שלב ראשון עם הזיהויים הגבוהים, שלב שני עם הנמוכים רק מול המסלולים שנשארו, ומה נשאר בחוץ.');
  const T = [[60, 60, 110, 160], [200, 70, 250, 170], [340, 60, 390, 160]], D = [{ b: [64, 62, 114, 162], s: 0.9 }, { b: [204, 74, 252, 172], s: 0.32 }, { b: [345, 65, 393, 163], s: 0.15 }, { b: [420, 200, 440, 220], s: 0.25 }, { b: [130, 210, 150, 230], s: 0.7 }];
  const svg = svgBox(box, 480, 250); const out = V.say(box);
  V.stepper(box, 4, s => { svg.innerHTML = ''; T.forEach((b, i) => { rect(svg, b, { stroke: COL(i + 1), strokeWidth: 2.5, strokeDasharray: '6 3' }); txt(svg, [b[0], b[1] - 4], 'מסלול ' + (i + 1), { fill: COL(i + 1) }); });
    D.forEach((d, j) => { let st = { stroke: d.s >= 0.5 ? '#333' : '#c92a2a', strokeWidth: 1.2 }; const m1 = j === 0, m2 = j === 1, newT = j === 4; if ((s >= 1 && m1) || (s >= 2 && m2)) st = { stroke: 'var(--c3)', strokeWidth: 3 }; if (s >= 3 && newT) st = { stroke: 'var(--c1)', strokeWidth: 3 }; if (s >= 3 && (j === 2 || j === 3)) st.opacity = 0.3; rect(svg, d.b, st); txt(svg, [d.b[0], d.b[3] + 12], f(d.s, 2), { fill: '#444' }); });
    out.innerHTML = ['5 זיהויים: שניים גבוהים (שחור, ≥ 0.5) ושלושה נמוכים (אדום, בין 0.1 ל־0.5).', 'שלב 1: הגבוה 0.9 משויך למסלול 1. הגבוה 0.7 לא חופף אף מסלול.', 'שלב 2: מסלולים 2 ו־3 נשארו. הזיהוי 0.32 חופף את 2 מעל 0.5 ומשויך (אדם מוסתר חלקית). 0.15 מתחת ל־low.', 'סוף: מסלול 3 מתיישן. הגבוה 0.7 פותח מסלול חדש. 0.25 הבודד נזרק: <b>זיהוי נמוך לעולם לא פותח מסלול</b>.'][s]; });
};

/* 7.3 results */
W.w5_byte_results = function (box) {
  V.say(box, 'שלוש גרסאות על אותה סצנה, עם נקודות רעש קבועות (תרגיל 7.4). <b>שנה את מספר נקודות הרעש</b> והשווה. בסעיף: בסיסי 0.825, שני שלבים 0.889, סף נמוך 0.645 (עם 15 נקודות).');
  let fx = 15; V.slider(box, 'נקודות רעש קבועות', 0, 40, 1, fx, v => { fx = v; calc(); }); const out = mono(box);
  function calc() { const fr = makeScene({ n: 16, T: 140, miss: 0.05, lowFrac: 0.3, fixedFP: fx, seed: 12, W: 480, H: 300 }); const res = [['basic, thr 0.5', { high: 0.5 }], ['basic, thr 0.1', { high: 0.1 }], ['two-stage', { two: true }]].map(([n, o]) => { const tr = makeTracker(o); const s = score(fr, fr.map(x => tr.step(x.dets))); return n.padEnd(16) + 'MOTA ' + f(s.mota, 3).padEnd(7) + ' FP ' + String(s.fp).padEnd(5) + ' FN ' + s.fn; });
    out.textContent = res.join('\n') + '\n(30% of real detections have a low score)'; }
  calc();
};

/* 8.1 camera motion breaks prediction */
W.w5_cam_shift = function (box) {
  V.say(box, 'עצם עומד במקום, והמצלמה זזה ימינה. בתמונה הוא "קופץ" שמאלה, והחיזוי של קלמן (שמניח שהוא עומד) מחטיא. <b>הגדל את מהירות המצלמה</b>.');
  let v = 8, w = 24; const sr = V.row(box); V.slider(sr, 'תנועת מצלמה (פיקסלים לפריים)', 0, 20, 1, v, x => { v = x; draw(); }); V.slider(sr, 'רוחב העצם', 8, 80, 2, w, x => { w = x; draw(); });
  const svg = svgBox(box, 480, 160); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const pred = [220, 50, 220 + w, 50 + w * 2], det = [220 - v, 50, 220 - v + w, 50 + w * 2]; rect(svg, pred, { stroke: 'var(--c2)', strokeWidth: 2.5, strokeDasharray: '5 3' }); rect(svg, det, { stroke: 'var(--c3)', strokeWidth: 2.5 }); txt(svg, [pred[0], 40], 'חיזוי', { fill: 'var(--c2)' }); txt(svg, [det[0], 150], 'זיהוי', { fill: 'var(--c3)' });
    const io = iou(pred, det); out.innerHTML = 'חפיפה ' + ltr(f(io, 3)) + (io < 0.3 ? ' — <b class="bad">מתחת לשער 0.3</b>: מסלול חדש והחלפת מזהה.' : ' — עדיין משויך.') + ' התזוזה הקריטית: ' + ltr(f(w * 0.46, 1)) + ' פיקסלים, כחצי רוחב.'; }
  draw();
};

/* 8.2 background flow */
W.w5_flow_bg = function (box) {
  V.say(box, 'נקודות רקע (אפור) ושני רכבים (צבע). כל נקודה זזה בתנועת המצלמה, והרכבים גם בתנועה שלהם. <b>שנה את תנועת המצלמה</b>: חציון הזרימה (או RANSAC) מוצא את תנועת הרקע ומתעלם מהרכבים.');
  let dx = 12, dy = 3; const sr = V.row(box); V.slider(sr, 'dx', -20, 20, 1, dx, v => { dx = v; draw(); }); V.slider(sr, 'dy', -20, 20, 1, dy, v => { dy = v; draw(); }); const svg = svgBox(box, 480, 260); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const r = rng(4); const fl = []; for (let i = 0; i < 60; i++) { const x = 20 + r() * 440, y = 20 + r() * 220; const car = i < 8; const u = -dx + (car ? 25 : 0) + randn(r) * 0.6, w2 = -dy + (car ? -6 : 0) + randn(r) * 0.6; fl.push([u, w2]); V.s('line', { x1: x, y1: y, x2: x + u, y2: y + w2, style: { stroke: car ? 'var(--c2)' : '#868e96', strokeWidth: car ? 2.5 : 1.3 } }, svg); V.s('circle', { cx: x, cy: y, r: 2, style: { fill: car ? 'var(--c2)' : '#495057' } }, svg); }
    const med = k => fl.map(p => p[k]).sort((a, b) => a - b)[30], mean = k => fl.reduce((s, p) => s + p[k], 0) / fl.length; out.innerHTML = 'ממוצע פשוט: ' + ltr('(' + f(mean(0), 2) + ', ' + f(mean(1), 2) + ')') + ' (מושפע מהרכבים). חציון: <b>' + ltr('(' + f(med(0), 2) + ', ' + f(med(1), 2) + ')') + '</b>. הסימן הפוך לתנועת המצלמה, כמו (−12.018, −3.006) בסעיף.'; }
  draw();
};

/* 8.3 apply the affine to the state */
W.w5_apply_affine = function (box) {
  V.say(box, 'apply_affine מזיז את מרכז המסלול באותה העתקה של הרקע, מסובב את המהירות, ומכפיל את הגודל בשורש הדטרמיננטה. <b>שנה סיבוב, קנה מידה והזזה</b>.');
  let th = 10, sc = 1.1, tx = 20; const sr = V.row(box); V.slider(sr, 'סיבוב°', -30, 30, 1, th, v => { th = v; draw(); }); V.slider(sr, 'קנה מידה', 0.7, 1.4, 0.01, sc, v => { sc = v; draw(); }); V.slider(sr, 'הזזה x', -60, 60, 1, tx, v => { tx = v; draw(); });
  const svg = svgBox(box, 480, 260); const out = mono(box);
  function draw() { svg.innerHTML = ''; const r = th * Math.PI / 180; const A = [[sc * Math.cos(r), -sc * Math.sin(r), tx], [sc * Math.sin(r), sc * Math.cos(r), 0]]; const x = [200, 120, 40, 70, 12, 4]; const ap = (p, t) => [A[0][0] * p[0] + A[0][1] * p[1] + (t ? A[0][2] : 0), A[1][0] * p[0] + A[1][1] * p[1] + (t ? A[1][2] : 0)];
    const c = ap(x, 1), v = ap([x[4], x[5]], 0), s = Math.sqrt(Math.abs(A[0][0] * A[1][1] - A[0][1] * A[1][0])); const draw1 = (cx, cy, w, h, vx, vy, col, d) => { rect(svg, [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2], { stroke: col, strokeWidth: 2.5, strokeDasharray: d || '' }); V.s('line', { x1: cx, y1: cy, x2: cx + vx * 4, y2: cy + vy * 4, style: { stroke: col, strokeWidth: 2 } }, svg); };
    draw1(x[0], x[1], x[2], x[3], x[4], x[5], '#868e96', '4 3'); draw1(c[0], c[1], x[2] * s, x[3] * s, v[0], v[1], 'var(--c1)');
    out.textContent = 'A = [[' + A[0].map(a => f(a, 3)).join(', ') + '], [' + A[1].map(a => f(a, 3)).join(', ') + ']]\ncenter (200, 120) → (' + f(c[0], 1) + ', ' + f(c[1], 1) + ')\nvelocity (12, 4) → (' + f(v[0], 2) + ', ' + f(v[1], 2) + ')   (no translation!)\nsize × sqrt|det| = × ' + f(s, 3); }
  draw();
};

/* 8.4 results */
W.w5_cmc_results = function (box) {
  V.say(box, 'סצנה שבה המצלמה זזה בפריימים 40 עד 100. <b>שנה את מהירות המצלמה והדלק פיצוי</b>. בטבלת הסעיף: במהירות 8, 14.7 החלפות בלי ו־5.0 עם.');
  let v = 8, cmc = false; const sr = V.row(box); V.slider(sr, 'מהירות מצלמה', 0, 14, 1, v, x => { v = x; p.run(); }); V.tabs(sr, ['בלי פיצוי', 'עם פיצוי'], i => { cmc = i === 1; p.run(); });
  const p = player(box, () => ({ n: 16, T: 140, miss: 0.05, camV: v, seed: 9 }), () => ({ cmc }));
};
})();
