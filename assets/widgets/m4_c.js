/* Module 4 visuals — chapters 9–12: error analysis, train/field gap, thermal, segmentation as a labelling tool */
(function () {
const W = window.W, V = window.V, el = V.el; const { f, ltr, mono, svgBox, rect, txt, iou, rng, randn } = window.BX;

/* 9.1 four kinds of false positive */
W.w4_err_types = function (box) {
  V.say(box, 'זיהויים שגויים מהשטח. לכל אחד, <b>בחר את הסוג</b>. ירוק: מלבן אמת, אדום: הזיהוי.');
  const T = ['כפילות', 'בלבול מחלקות', 'מיקום', 'רקע']; const C = [
    { g: [[60, 60, 160, 130, 'רכב']], d: [[62, 58, 162, 128, 'רכב'], [70, 66, 168, 136, 'רכב']], hi: 1, a: 0, why: 'חופף מעל הסף לעצם שזיהוי בטוח יותר כבר תפס.' },
    { g: [[60, 60, 160, 130, 'רכב']], d: [[62, 62, 158, 128, 'אדם']], hi: 0, a: 1, why: 'חופף לעצם, אבל ממחלקה אחרת.' },
    { g: [[60, 60, 160, 130, 'רכב']], d: [[110, 80, 210, 150, 'רכב']], hi: 0, a: 2, why: 'אותה מחלקה, חפיפה בין 0.1 לסף.' },
    { g: [[60, 60, 160, 130, 'רכב']], d: [[200, 40, 250, 70, 'אדם']], hi: 0, a: 3, why: 'כמעט לא נוגע בשום עצם: צל, שלט, אבן.' }];
  let k = 0; const svg = svgBox(box, 300, 180); const opts = V.row(box); const out = V.say(box);
  function show() { svg.innerHTML = ''; const c = C[k % 4]; V.s('rect', { x: 0, y: 0, width: 300, height: 180, style: { fill: '#dfe5d8' } }, svg); c.g.forEach(b => { rect(svg, b, { stroke: 'var(--c3)', strokeWidth: 3 }); txt(svg, [b[0] + 3, b[3] + 14], b[4], { fill: 'var(--c3)' }); }); c.d.forEach((b, i) => { rect(svg, b, { stroke: i === c.hi ? 'var(--c2)' : 'var(--c1)', strokeWidth: i === c.hi ? 3 : 1.5, strokeDasharray: i === c.hi ? '' : '4 3' }); if (i === c.hi) txt(svg, [b[0] + 3, b[1] - 4], b[4], { fill: 'var(--c2)' }); });
    opts.innerHTML = ''; T.forEach((t, i) => opts.appendChild(V.button(t, () => { out.innerHTML = (i === c.a ? '<b class="good">נכון.</b> ' : '<b class="bad">לא.</b> זה ' + T[c.a] + '. ') + c.why + (i === c.a ? '' : ''); k++; setTimeout(show, 1500); }, 'sm'))); }
  show();
};

/* 9.2 the analyze function on a synthetic image */
W.w4_analyze = function (box) {
  V.say(box, 'הפונקציה analyze על תמונה מדומה: כל זיהוי מסווג לפגיעה או לאחד מארבעת הסוגים, וכל עצם שלא נמצא נספר לפי גודל. <b>שנה את הספים</b> ולחץ תמונה חדשה.');
  let thr = 0.5, sthr = 0.3, seed = 1; const r1 = V.row(box); V.slider(r1, 'סף חפיפה', 0.3, 0.9, 0.05, thr, v => { thr = v; draw(); }); V.slider(r1, 'סף ציון', 0.05, 0.9, 0.05, sthr, v => { sthr = v; draw(); }); V.btns(box, [['תמונה חדשה', () => { seed++; draw(); }]]);
  const svg = svgBox(box, 480, 300); const out = V.say(box); const COL = { TP: 'var(--c3)', duplicate: 'var(--c5, #e8a33d)', class: 'var(--c4, #ae3ec9)', location: 'var(--c1)', background: 'var(--c2)' };
  function draw() { svg.innerHTML = ''; V.s('rect', { x: 0, y: 0, width: 480, height: 300, style: { fill: '#dfe5d8' } }, svg); const r = rng(seed * 7); const gts = [], gcls = [], dets = [];
    for (let i = 0; i < 12; i++) { const s = r() < 0.4 ? 10 + r() * 10 : 25 + r() * 40; const x = r() * (470 - s), y = r() * (290 - s); gts.push([x, y, x + s, y + s]); gcls.push(r() < 0.5 ? 0 : 1); }
    gts.forEach((g, i) => { const s = g[2] - g[0]; if (r() < (s < 20 ? 0.5 : 0.12)) return; const j = () => randn(r) * s * 0.08; const c = r() < 0.08 ? 1 - gcls[i] : gcls[i]; dets.push({ b: [g[0] + j(), g[1] + j(), g[2] + j(), g[3] + j()], c, s: 0.4 + r() * 0.55 }); if (r() < 0.12) dets.push({ b: [g[0] + j() * 2, g[1] + j() * 2, g[2] + j() * 2, g[3] + j() * 2], c: gcls[i], s: 0.3 + r() * 0.4 }); });
    for (let k = 0; k < 2; k++) { const x = r() * 440, y = r() * 260; dets.push({ b: [x, y, x + 20 + r() * 20, y + 20 + r() * 20], c: Math.floor(r() * 2), s: 0.2 + r() * 0.6 }); }
    const D = dets.filter(d => d.s >= sthr).sort((a, b) => b.s - a.s); const used = gts.map(() => false); const cnt = { TP: 0, duplicate: 0, class: 0, location: 0, background: 0 };
    D.forEach(d => { const M = gts.map(g => iou(d.b, g)); let bj = -1, bv = -1; gts.forEach((g, j) => { if (gcls[j] === d.c && !used[j] && M[j] > bv) { bv = M[j]; bj = j; } }); let kind;
      if (bv >= thr) { used[bj] = true; kind = 'TP'; } else if (gts.some((g, j) => gcls[j] === d.c && used[j] && M[j] >= thr)) kind = 'duplicate'; else if (gts.some((g, j) => gcls[j] !== d.c && M[j] >= thr)) kind = 'class'; else if (gts.some((g, j) => gcls[j] === d.c && M[j] >= 0.1)) kind = 'location'; else kind = 'background'; cnt[kind]++; rect(svg, d.b, { stroke: COL[kind], strokeWidth: 2 }); });
    gts.forEach((g, j) => { if (!used[j]) rect(svg, g, { stroke: '#222', strokeWidth: 1.5, strokeDasharray: '3 2' }); });
    const small = gts.filter((g, j) => !used[j] && g[2] - g[0] < 20).length, smallT = gts.filter(g => g[2] - g[0] < 20).length;
    out.innerHTML = '<span style="color:var(--c3)">פגיעות ' + cnt.TP + '</span> · <span style="color:var(--c5, #e8a33d)">כפילויות ' + cnt.duplicate + '</span> · <span style="color:var(--c4, #ae3ec9)">בלבול ' + cnt.class + '</span> · <span style="color:var(--c1)">מיקום ' + cnt.location + '</span> · <span style="color:var(--c2)">רקע ' + cnt.background + '</span>. החמצות (שחור מקווקו): ' + gts.filter((g, j) => !used[j]).length + ', מהן קטנים ' + small + ' מתוך ' + smallT + '.'; }
  draw();
};

/* 9.3 the result tables */
W.w4_err_result = function (box) {
  V.say(box, 'התוצאה של הסעיף על 300 תמונות. <b>לחץ על עמודה</b> כדי לראות מה הצעד הבא.');
  const fp = [['פספוס רקע', 402, 'תמונות רקע קשות באימון, סף ציון גבוה יותר'], ['בלבול מחלקות', 192, 'עוד דוגמאות משתי המחלקות, קווי תיוג ברורים'], ['כפילויות', 106, 'סף סינון אחר, איחוד אריחים'], ['מיקום', 56, 'קלט גדול יותר, תיוג צמוד יותר']]; const miss = [['קטן', 0.53, 'חלוקה לאריחים או קלט גדול (פרק 7)'], ['בינוני', 0.17, ''], ['גדול', 0.112, '']];
  const svg = svgBox(box, 500, 210); const out = V.say(box);
  fp.forEach(([l, n, fix], i) => { const g = V.s('g', { style: { cursor: 'pointer' } }, svg); V.s('rect', { x: 20 + i * 60, y: 180 - n / 402 * 150, width: 44, height: n / 402 * 150, style: { fill: 'var(--c2)' } }, g); txt(g, [20 + i * 60, 198], l.split(' ')[0]); txt(g, [24 + i * 60, 174 - n / 402 * 150], String(n)); g.addEventListener('click', () => { out.innerHTML = '<b>' + l + ' (' + n + '):</b> ' + fix + '.'; }); });
  miss.forEach(([l, v, fix], i) => { const g = V.s('g', { style: { cursor: 'pointer' } }, svg); V.s('rect', { x: 300 + i * 60, y: 180 - v * 280, width: 44, height: v * 280, style: { fill: 'var(--c5, #e8a33d)' } }, g); txt(g, [304 + i * 60, 198], l); txt(g, [302 + i * 60, 174 - v * 280], f(v * 100, 1) + '%'); g.addEventListener('click', () => { out.innerHTML = '<b>החמצות, ' + l + ': ' + f(v * 100, 1) + '%.</b> ' + (fix || 'פחות דחוף.'); }); });
  txt(svg, [20, 14], 'זיהויים שגויים', { fontSize: '12px' }); txt(svg, [300, 14], 'שיעור החמצה לפי גודל', { fontSize: '12px' }); out.innerHTML = 'אף אחד מהצעדים האלה לא נראה מתוך ציון mAP אחד.';
};

/* 10.1 what changes between dataset and field */
W.w4_shift = function (box) {
  V.say(box, 'אותה סצנה, בתנאים של השטח. <b>הזז את התנאים</b> וראה מה קורה לתמונה. המספר הוא ציון מדומה להמחשה, לא מדידה.');
  let light = 1, alt = 40, fog = 0; const r1 = V.row(box); V.slider(r1, 'אור', 0.15, 1, 0.05, light, v => { light = v; draw(); }); V.slider(r1, 'גובה (מ׳)', 20, 150, 5, alt, v => { alt = v; draw(); }); V.slider(r1, 'ערפל', 0, 0.8, 0.05, fog, v => { fog = v; draw(); });
  const c = V.el('canvas', { width: 360, height: 220, style: { display: 'block', margin: '0 auto', maxWidth: '100%' } }); box.appendChild(c); const out = V.say(box);
  function draw() { const x = c.getContext('2d'); x.fillStyle = `rgb(${200 * light},${210 * light},${190 * light})`; x.fillRect(0, 0, 360, 220); const s = 40 * 40 / alt; const r = rng(3);
    for (let i = 0; i < 8; i++) { const px = r() * 320, py = r() * 190; x.fillStyle = `rgba(0,0,0,${0.25 * light})`; x.fillRect(px + s * 0.3, py + s * 0.3, s * 1.6, s * 0.8); x.fillStyle = `rgb(${80 * light},${100 * light},${140 * light})`; x.fillRect(px, py, s * 1.6, s * 0.8); }
    x.fillStyle = `rgba(220,220,220,${fog})`; x.fillRect(0, 0, 360, 220); const score = Math.max(0, Math.min(1, 0.95 * Math.min(1, light * 1.4) * Math.min(1, s / 18) * (1 - fog * 0.9)));
    out.innerHTML = 'רכב תופס ' + f(s * 1.6, 0) + ' פיקסלים. ציון מדומה: <b>' + f(score, 2) + '</b>. ' + (s < 12 ? 'גובה רב: נכנסים לבעיה של פרק 7.' : light < 0.4 ? 'חושך: הציונים יורדים.' : fog > 0.4 ? 'ערפל: ניגודיות נמוכה.' : ''); }
  draw();
};

/* 10.2 evaluation by slices */
W.w4_slices = function (box) {
  V.say(box, 'הרגישות של הסעיף, לפי גובה ושעה. הרגישות הכוללת 0.65 מסתירה את כל זה. <b>רחף על משבצת</b>.');
  const rows = [['40 מטר', 0.88, 0.66], ['80 מטר', 0.82, 0.5], ['120 מטר', 0.67, 0.37]]; const svg = svgBox(box, 360, 200); const out = V.say(box);
  txt(svg, [140, 18], 'יום', { fontSize: '12px' }); txt(svg, [260, 18], 'לילה', { fontSize: '12px' });
  rows.forEach(([l, d, n], i) => { txt(svg, [10, 60 + i * 55], l, { fontSize: '12px' }); [d, n].forEach((v, j) => { const g = V.s('g', {}, svg); V.s('rect', { x: 100 + j * 120, y: 30 + i * 55, width: 110, height: 50, style: { fill: `rgba(${Math.round(224 - v * 180)},${Math.round(60 + v * 120)},80,.75)` } }, g); txt(g, [140 + j * 120, 60 + i * 55], f(v, 2), { fill: '#fff', fontSize: '14px' }); g.addEventListener('mouseenter', () => { out.innerHTML = l + ', ' + (j ? 'לילה' : 'יום') + ': רגישות <b>' + f(v, 2) + '</b>.' + (v < 0.5 ? ' כאן המערכת לא שמישה.' : ''); }); }); });
  out.innerHTML = 'ביום ב־40 מטר המערכת מצוינת; בלילה ב־120 היא מוצאת פחות מ־40%.';
};

/* 10.3 KS test flags everything with many images */
W.w4_ks = function (box) {
  V.say(box, 'מבחן KS בין בהירות תמונות האימון לבהירות בשטח. <b>הקטן את ההבדל</b> והגדל את מספר התמונות: המבחן מסמן גם הבדל שלא משנה למודל.');
  let shift = 5, n = 200; const r1 = V.row(box); V.slider(r1, 'הבדל בבהירות הממוצעת', 0, 40, 1, shift, v => { shift = v; draw(); }); V.slider(r1, 'תמונות בכל צד', 20, 2000, 20, n, v => { n = v; draw(); });
  const P = window.IM.plot(box, { w: 440, h: 170 }); const out = V.say(box);
  function draw() { const r = rng(9); const a = [...Array(n)].map(() => 120 + randn(r) * 20).sort((x, y) => x - y), b = [...Array(n)].map(() => 120 + shift + randn(r) * 20).sort((x, y) => x - y); let D = 0, i = 0, j = 0; const xs = a.concat(b).sort((x, y) => x - y); xs.forEach(x => { while (i < n && a[i] <= x) i++; while (j < n && b[j] <= x) j++; D = Math.max(D, Math.abs(i - j) / n); });
    const ne = n / 2, lam = (Math.sqrt(ne) + 0.12 + 0.11 / Math.sqrt(ne)) * D; let p = 0; for (let k = 1; k < 100; k++) p += 2 * (-1) ** (k - 1) * Math.exp(-2 * k * k * lam * lam); p = Math.max(0, Math.min(1, p));
    const cdf = arr => arr.map((x, k) => [x, (k + 1) / n]).filter((_, k) => k % Math.max(1, Math.floor(n / 80)) === 0); P.draw([{ pts: cdf(a), color: 'var(--c1)', width: 2 }, { pts: cdf(b), color: 'var(--c2)', width: 2 }], [50, 200], [0, 1]);
    out.innerHTML = 'D = ' + f(D, 3) + ', p = <b>' + (p < 0.001 ? '< 0.001' : f(p, 3)) + '</b>. ' + (p < 0.05 ? 'המבחן מסמן הבדל' + (shift < 8 ? ', גם שהוא קטן מאוד. עם מספיק תמונות כל הבדל "מובהק".' : '.') : 'לא מסומן.'); }
  draw();
};

/* 10.4 what to do with the gap */
W.w4_gap_fix = function (box) {
  V.say(box, 'ארבעה מצבים. לכל אחד, בחר את התגובה הכי מתאימה מבין ארבע הדרכים של הסעיף.');
  const A = ['נתונים מהפרוסה', 'העשרה שמחקה את הפער', 'שינוי בצינור', 'להגביל את ההבטחה']; const Q = [['הרגישות בלילה נמוכה, ויש לך גישה לרחפן ולמצלמה תרמית.', 2], ['יש לך 300 תמונות מהשטח מתויגות מהגובה שבו נכשלת.', 0], ['המצלמה בשטח דוחסת וידאו חזק, והמאגר נקי.', 1], ['אין זמן ואין נתונים, והלקוח שואל אם זה עובד ב־150 מטר.', 3]];
  let k = 0; const q = el('div', { style: { fontWeight: 600, margin: '8px 0' } }); box.appendChild(q); const opts = V.row(box); const out = V.say(box);
  function show() { if (k >= Q.length) { q.textContent = 'סיימת.'; opts.innerHTML = ''; return; } q.textContent = Q[k][0]; opts.innerHTML = ''; A.forEach((a, i) => opts.appendChild(V.button(a, () => { out.innerHTML = i === Q[k][1] ? '<b class="good">נכון.</b>' : '<b class="bad">אפשרי, אבל הכי מתאים: ' + A[Q[k][1]] + '.</b>'; k++; setTimeout(show, 1300); }, 'sm'))); }
  show();
};

/* 11.1 thermal crossover */
W.w4_crossover = function (box) {
  V.say(box, 'טמפרטורת הקרקע ואדם לאורך היממה (מודל פשוט להמחשה). <b>הזז את השעה</b>: סביב הזריחה והשקיעה הקרקע עוברת את טמפרטורת הגוף, והניגודיות נעלמת.');
  let h = 17; V.slider(box, 'שעה', 0, 24, 0.25, h, v => { h = v; draw(); });
  const P = window.IM.plot(box, { w: 440, h: 180 }); const out = V.say(box);
  const ground = t => 24 + 14 * Math.sin((t - 9) / 24 * 2 * Math.PI), person = () => 33;
  function draw() { const g = [], p = []; for (let t = 0; t <= 24; t += 0.25) { g.push([t, ground(t)]); p.push([t, person(t)]); } P.draw([{ pts: g, color: 'var(--c5, #e8a33d)', width: 2.5 }, { pts: p, color: 'var(--c2)', width: 2.5 }, { vline: h, color: 'var(--ink3)', dash: '3 3' }], [0, 24], [5, 45]);
    const d = Math.abs(person(h) - ground(h)); out.innerHTML = 'בשעה ' + f(h, 2) + ': הפרש של <b>' + f(d, 1) + '</b> מעלות. ' + (d < 2 ? '<b class="bad">כמעט אין ניגודיות: האדם נעלם בתמונה.</b>' : ''); }
  draw();
};

/* 11.2 16 bits to 8 */
W.w4_pstretch = function (box) {
  V.say(box, 'הניסוי של הסעיף: רקע סביב 7,500, אדם חם ב־400 יחידות ממנו, ומנוע של 16,000. <b>בחר המרה</b> ושנה את האחוזונים.');
  let mode = 1, lo = 1, hi = 99; V.tabs(box, ['מינימום־מקסימום', 'אחוזונים'], i => { mode = i; draw(); }, 1); const r1 = V.row(box); V.slider(r1, 'אחוזון תחתון', 0, 10, 0.5, lo, v => { lo = v; draw(); }); V.slider(r1, 'אחוזון עליון', 90, 100, 0.1, hi, v => { hi = v; draw(); });
  const c = V.el('canvas', { width: 200, height: 150, style: { width: '400px', height: '300px', imageRendering: 'pixelated', display: 'block', margin: '0 auto', maxWidth: '100%' } }); box.appendChild(c); const out = V.say(box);
  const r = rng(2); const raw = new Float32Array(200 * 150); for (let y = 0; y < 150; y++) for (let x = 0; x < 200; x++) { let v = 7500 + randn(r) * 60; if ((x - 70) ** 2 / 64 + (y - 80) ** 2 / 400 < 1) v += 400; if (x > 160 && x < 172 && y > 20 && y < 32) v = 16000; raw[y * 200 + x] = v; }
  const sorted = Array.from(raw).sort((a, b) => a - b); const pct = q => sorted[Math.min(sorted.length - 1, Math.floor(q / 100 * (sorted.length - 1)))];
  function draw() { const a = mode ? pct(lo) : sorted[0], b = mode ? pct(hi) : sorted[sorted.length - 1]; const x = c.getContext('2d'); const im = x.createImageData(200, 150); const conv = v => Math.max(0, Math.min(255, (v - a) / (b - a) * 255));
    for (let i = 0; i < raw.length; i++) { const v = conv(raw[i]); im.data[4 * i] = im.data[4 * i + 1] = im.data[4 * i + 2] = v; im.data[4 * i + 3] = 255; } x.putImageData(im, 0, 0);
    const bg = conv(7500 + 35), pe = conv(7900 + 35); out.innerHTML = 'אדם ' + f(pe, 1) + ', רקע ' + f(bg, 1) + ': הפרש <b>' + f(pe - bg, 1) + '</b>. ' + (mode ? (pe >= 255 ? 'האדם נחתך ב־255: הפרטים בתוכו אבדו (תרגיל 11.2).' : '') : 'המנוע תופס את רוב הטווח, וכל השאר נדחס.'); }
  draw();
};

/* 11.3 open datasets */
W.w4_datasets = function (box) {
  V.say(box, 'שני סוגי מאגרים שהסעיף מזכיר. <b>בחר</b>, וקרא מה כל אחד נותן ומה צריך לבדוק.');
  const D = [['HIT-UAV', 'רחפן תרמי, 60 עד 130 מטר, 30 עד 90 מעלות, בערך 2,900 תמונות, אנשים וכלי רכב, מטא־דאטה של גובה, זווית ותאורה. הכי קרוב לפרויקט.'], ['מצלמות רכב (למשל FLIR)', 'זוגות של צבע ותרמי. זווית צילום שונה מרחפן, שימושי לשלב ביניים.']];
  const out = V.say(box); V.tabs(box, D.map(d => d[0]), i => { out.innerHTML = D[i][1] + ' <b>ותמיד: לבדוק רישיון, ובמיוחד שימוש מסחרי.</b>'; }); setTimeout(() => box.querySelector('.tabs button').click(), 0);
};

/* 11.4 one input channel instead of three */
W.w4_gray_conv = function (box) {
  V.say(box, 'במקום לשכפל ערוץ אפור פי 3, אפשר לסכום את משקלות השכבה הראשונה על ציר הערוצים (תרגיל 11.3). <b>שנה את ערך הפיקסל</b> ובדוק ששתי הדרכים נותנות אותה תוצאה.');
  let v = 0.6; V.slider(box, 'ערך הפיקסל האפור', 0, 1, 0.05, v, x => { v = x; draw(); });
  const out = mono(box); const r = rng(4); const Wt = [0, 1, 2].map(() => [...Array(9)].map(() => randn(r) * 0.3));
  function draw() { const three = Wt.reduce((s, ch) => s + ch.reduce((a, w) => a + w * v, 0), 0); const summed = Wt[0].map((_, k) => Wt[0][k] + Wt[1][k] + Wt[2][k]); const one = summed.reduce((a, w) => a + w * v, 0);
    out.textContent = 'weights (3, 3, 3) → sum over channels → (1, 3, 3)\n3 identical channels:  ' + f(three, 5) + '\n1 channel, summed:     ' + f(one, 5) + '\nsame output, 3× less work in the first layer'; }
  draw();
};

/* 12.1 a click becomes a mask */
W.w4_click_mask = function (box) {
  V.say(box, 'רמז של לחיצה אחת, ומודל כללי מחזיר מסכה. כאן "המודל" הוא מילוי אזור לפי צבע, רק להמחשה. <b>לחץ על עצם</b>, ושנה את הסובלנות.');
  let tol = 40, seedPt = null; V.slider(box, 'סובלנות', 5, 120, 5, tol, v => { tol = v; draw(); });
  const c = V.el('canvas', { width: 240, height: 160, style: { width: '480px', height: '320px', display: 'block', margin: '0 auto', maxWidth: '100%', cursor: 'crosshair' } }); box.appendChild(c); const out = V.say(box);
  const base = (() => { const x = document.createElement('canvas'); x.width = 240; x.height = 160; const g = x.getContext('2d'); g.fillStyle = '#9fb08c'; g.fillRect(0, 0, 240, 160); g.fillStyle = '#b9bcbf'; g.fillRect(0, 60, 240, 40); g.fillStyle = '#4a5f8a'; g.fillRect(40, 66, 50, 26); g.fillStyle = '#7a3b2e'; g.fillRect(150, 70, 44, 22); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(156, 92, 44, 6); g.fillStyle = '#c25a2f'; g.beginPath(); g.arc(120, 30, 6, 0, 7); g.fill(); return g.getImageData(0, 0, 240, 160); })();
  c.addEventListener('click', e => { const rc = c.getBoundingClientRect(); seedPt = [Math.floor((e.clientX - rc.left) * 240 / rc.width), Math.floor((e.clientY - rc.top) * 160 / rc.height)]; draw(); });
  function draw() { const g = c.getContext('2d'); const im = new ImageData(new Uint8ClampedArray(base.data), 240, 160); if (seedPt) { const d = base.data; const i0 = (seedPt[1] * 240 + seedPt[0]) * 4; const ref = [d[i0], d[i0 + 1], d[i0 + 2]]; const seen = new Uint8Array(240 * 160); const st = [seedPt]; let n = 0, bx = [1e9, 1e9, -1, -1];
      while (st.length) { const [x, y] = st.pop(); if (x < 0 || y < 0 || x >= 240 || y >= 160) continue; const k = y * 240 + x; if (seen[k]) continue; const j = k * 4; if (Math.abs(d[j] - ref[0]) + Math.abs(d[j + 1] - ref[1]) + Math.abs(d[j + 2] - ref[2]) > tol) continue; seen[k] = 1; n++; bx = [Math.min(bx[0], x), Math.min(bx[1], y), Math.max(bx[2], x), Math.max(bx[3], y)]; im.data[j] = (im.data[j] + 66) / 2; im.data[j + 1] = (im.data[j + 1] + 140) / 2; im.data[j + 2] = (im.data[j + 2] + 255) / 2; st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
      g.putImageData(im, 0, 0); g.strokeStyle = '#e03131'; g.lineWidth = 1; g.strokeRect(bx[0], bx[1], bx[2] - bx[0] + 1, bx[3] - bx[1] + 1); out.innerHTML = 'מסכה של ' + n + ' פיקסלים, מלבן ' + ltr('(' + bx.map(x => x + 0).join(', ') + ')') + '. ' + (n > 3000 ? 'גדולה מדי: נזלה לרקע. הורד סובלנות.' : ''); } else { g.putImageData(im, 0, 0); out.innerHTML = 'לחץ על אחד הרכבים או על האדם.'; } }
  draw();
};

/* 12.2 mask to box, and a stray pixel */
W.w4_mask_box = function (box) {
  V.say(box, 'מסכה של עצם 40 על 20, ופיקסל בודד במרחק. <b>הזז את הפיקסל</b>, והפעל סינון לרכיב הגדול ביותר (תרגיל 12.1).');
  let px = [80, 60], big = false; const r1 = V.row(box); V.slider(r1, 'x של הפיקסל', 72, 110, 1, px[0], v => { px[0] = v; draw(); }); V.slider(r1, 'y של הפיקסל', 42, 75, 1, px[1], v => { px[1] = v; draw(); }); V.tabs(box, ['mask_to_box', 'רכיב גדול ואז מלבן'], i => { big = i === 1; draw(); });
  const svg = svgBox(box, 480, 300); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const k = 4; V.s('rect', { x: 0, y: 0, width: 480, height: 300, style: { fill: 'var(--surface2, #f6f6f4)' } }, svg); V.s('rect', { x: 30 * k, y: 20 * k, width: 40 * k, height: 20 * k, style: { fill: 'rgba(66,99,235,.5)' } }, svg); V.s('rect', { x: px[0] * k, y: px[1] * k, width: k, height: k, style: { fill: 'var(--c1)' } }, svg);
    const tru = [30, 20, 70, 40]; const b = big ? tru : [30, 20, Math.max(70, px[0] + 1), Math.max(40, px[1] + 1)]; rect(svg, b, { stroke: 'var(--c2)', strokeWidth: 2 }, k);
    out.innerHTML = 'המלבן: ' + ltr('(' + b.join(', ') + ')') + '. חפיפה עם האמת: <b>' + f(iou(b, tru), 2) + '</b>. ' + (iou(b, tru) < 0.5 ? 'פיקסל אחד הפך תיוג נכון לשגוי.' : ''); }
  draw();
};

/* 12.3 labelling time */
W.w4_label_time = function (box) {
  V.say(box, 'מתי לחיצה אחת עדיפה על ציור מלבן? על רכב גדול המסכה מדויקת; על אדם של 10 פיקסלים מגובה, היא נוטה לכלול את הצל. <b>שנה את גודל העצם</b> (מודל להמחשה).');
  let s = 40; V.slider(box, 'גודל העצם (פיקסלים)', 5, 120, 1, s, v => { s = v; draw(); }); const out = V.say(box);
  function draw() { const ok = Math.min(0.97, Math.max(0.2, (s - 6) / 60)); const click = 2 + (1 - ok) * 8, hand = 8; out.innerHTML = 'הסתברות שהמסכה טובה: ' + f(ok * 100, 0) + '%. זמן ממוצע: לחיצה ' + f(click, 1) + ' שניות, ציור ' + hand + '. ' + (click < hand ? '<b>עדיף ללחוץ.</b>' : '<b>עדיף לצייר ביד.</b>'); }
  draw();
};

/* 12.4 the project report table */
W.w4_project = function (box) {
  V.say(box, 'טבלת הדוח של הפרויקט. מלא את המספרים שלך; הטבלה נשמרת בדפדפן ואפשר להעתיק אותה כ־Markdown.');
  const cols = ['שיטה', 'AP קטנים', 'AP בינוניים', 'AP גדולים', 'רגישות בסף העבודה', 'מילישניות לתמונה']; const rows = ['קלט 640', 'קלט 1280', 'אריחים 640, חפיפה 20%'];
  const st = window.Store.map('notes'); const key = 'm4-project'; const data = JSON.parse(st[key] || '{}');
  const t = el('table', { class: 'mini', style: { margin: '8px auto' } }); t.appendChild(el('tr', {}, ...cols.map(c => el('th', {}, c)))); rows.forEach((r, i) => { const tr = el('tr', {}, el('td', {}, r)); cols.slice(1).forEach((c, j) => { const inp = el('input', { style: { width: '80px' } }); inp.value = data[i + '-' + j] || ''; inp.oninput = () => { data[i + '-' + j] = inp.value; st[key] = JSON.stringify(data); window.Store.save(); }; tr.appendChild(el('td', {}, inp)); }); t.appendChild(tr); }); box.appendChild(t);
  const gpu = el('input', { placeholder: 'כרטיס המסך', style: { width: '200px' } }); gpu.value = data.gpu || ''; gpu.oninput = () => { data.gpu = gpu.value; st[key] = JSON.stringify(data); window.Store.save(); }; box.appendChild(gpu);
  V.btns(box, [['העתק כ־Markdown', () => { const md = '| ' + cols.join(' | ') + ' |\n|' + cols.map(() => '---').join('|') + '|\n' + rows.map((r, i) => '| ' + r + ' | ' + cols.slice(1).map((_, j) => data[i + '-' + j] || '').join(' | ') + ' |').join('\n') + '\n\nGPU: ' + (data.gpu || ''); try { navigator.clipboard.writeText(md); } catch (e) { } window.toast && window.toast('הועתק'); }, 'primary']]);
};
})();
