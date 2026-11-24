/* Module 5 visuals — chapters 9–12: tracking metrics, the library, analytics, the drone project. */
(function () {
const W = window.W, V = window.V, el = V.el; const { f, ltr, mono, svgBox, rect, txt, rng, randn } = window.BX; const { makeScene, makeTracker, score, COL } = window.TR;
const table = (box, head, rows) => { const t = el('table', { class: 'mini', style: { margin: '8px auto' } }); t.appendChild(el('tr', {}, ...head.map(h => el('th', {}, h)))); rows.forEach(r => t.appendChild(el('tr', {}, ...r.map(c => el('td', { html: String(c) }))))); box.appendChild(t); return t; };

/* 9.1 one switch, three metrics */
W.w5_metrics_example = function (box) {
  V.say(box, 'הדוגמה של הסעיף: עצם אחד, 100 פריימים, העוקב מוצא אותו תמיד, אבל המספר מתחלף. <b>הזז את רגע ההחלפה</b>, והוסף החלפות חוזרות (1 → 2 → 1 → 2...).');
  let k = 50, n = 1; const sr = V.row(box); V.slider(sr, 'פריים ההחלפה הראשונה', 1, 99, 1, k, v => { k = v; draw(); }); V.slider(sr, 'מספר החלפות', 1, 20, 1, n, v => { n = v; draw(); });
  const svg = svgBox(box, 480, 50); const out = mono(box);
  function draw() { const ids = [...Array(100)].map((_, t) => { if (t < k) return 1; const seg = Math.floor((t - k) / Math.max(1, (100 - k) / n)); return seg % 2 ? 1 : 2; }); let sw = 0; for (let t = 1; t < 100; t++) if (ids[t] !== ids[t - 1]) sw++;
    svg.innerHTML = ''; ids.forEach((id, t) => V.s('rect', { x: 40 + t * 4, y: 10, width: 4, height: 26, style: { fill: COL(id) } }, svg));
    const c1 = ids.filter(x => x === 1).length, c2 = 100 - c1, idtp = Math.max(c1, c2); const ass = (c1 * (c1 / 100) + c2 * (c2 / 100)) / 100;
    out.textContent = 'switches = ' + sw + '\nMOTA = 1 − (0 + 0 + ' + sw + ') / 100 = ' + f(1 - sw / 100, 2) + '\nIDF1 = 2·' + idtp + ' / (2·' + idtp + ' + ' + (100 - idtp) + ' + ' + (100 - idtp) + ') = ' + f(idtp / 100, 2) + '\nHOTA = sqrt(DetA 1 × AssA ' + f(ass, 3) + ') = ' + f(Math.sqrt(ass), 2); }
  draw();
};

/* 9.2 MOTA calculator */
W.w5_mota_calc = function (box) {
  V.say(box, 'מחשבון של MOTA. <b>שנה את המספרים</b>, או טען את התרגילים.');
  const v = { GT: 1000, FN: 80, FP: 30, IDSW: 10 }; const g = el('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', direction: 'ltr' } }); box.appendChild(g); const ins = {};
  Object.keys(v).forEach(k => { const i = el('input', { type: 'number', min: 0, value: v[k], style: { width: '80px' } }); i.oninput = () => { v[k] = +i.value || 0; calc(); }; ins[k] = i; g.appendChild(el('label', {}, k + ' ', i)); });
  V.btns(box, [['תרגיל 9.1', () => set(1000, 80, 30, 10)], ['תרגיל 9.3', () => set(100, 20, 90, 0)]]); const out = mono(box);
  function set(a, b, c, d) { [['GT', a], ['FN', b], ['FP', c], ['IDSW', d]].forEach(([k, x]) => { v[k] = x; ins[k].value = x; }); calc(); }
  function calc() { const m = 1 - (v.FN + v.FP + v.IDSW) / Math.max(1, v.GT); out.textContent = 'MOTA = 1 − (' + v.FN + ' + ' + v.FP + ' + ' + v.IDSW + ') / ' + v.GT + ' = ' + f(m, 3) + (m < 0 ? '\nnegative: FP is not bounded by GT' : ''); }
  calc();
};

/* 9.3 what each metric sees */
W.w5_metric_table = function (box) {
  V.say(box, 'הטבלה של הסעיף כגרף. <b>רחף על קבוצה</b>: MOTA כמעט לא זז בין הגרסאות, IDF1 ו־HOTA קופצים.');
  const rows = [['הסתרות ארוכות', 0.748, 0.522, 0.535], ['+ מראה', 0.760, 0.833, 0.739], ['מצלמה מהירה', 0.809, 0.575, 0.612], ['+ פיצוי', 0.885, 0.861, 0.837]]; const cols = ['var(--c1)', 'var(--c3)', 'var(--c4, #ae3ec9)'];
  const svg = svgBox(box, 480, 220); const out = V.say(box); rows.forEach((r, i) => { const g = V.s('g', {}, svg); r.slice(1).forEach((x, j) => V.s('rect', { x: 30 + i * 115 + j * 28, y: 190 - x * 170, width: 24, height: x * 170, style: { fill: cols[j] } }, g)); txt(g, [30 + i * 115, 208], r[0]); g.addEventListener('mouseenter', () => { out.innerHTML = r[0] + ': ' + ltr('MOTA ' + r[1] + ', IDF1 ' + r[2] + ', HOTA ' + r[3]); }); });
  out.innerHTML = 'כחול MOTA, ירוק IDF1, סגול HOTA.';
};

/* 10.1 YAML fields → our parameters */
W.w5_yaml_map = function (box) {
  V.say(box, 'קובץ ההגדרות של העוקב בספרייה. <b>לחץ על שדה</b> וראה למה הוא מקביל אצלנו.');
  const rows = [['track_high_thresh', 'סף הציון של השלב הראשון', 'high, פרק 7'], ['track_low_thresh', 'הציון המינימלי לשלב השני', 'low, פרק 7'], ['new_track_thresh', 'ציון שנדרש כדי לפתוח מסלול חדש', 'אצלנו שווה ל־ high'], ['track_buffer', 'כמה פריימים מסלול אבוד נשמר', 'max_age, פרק 5'], ['match_thresh', 'סף השיוך, כמרחק (ערך גבוה מקל יותר)', '1 פחות iou_thr, פרק 4'], ['fuse_score', 'משלב את ציון הזיהוי בעלות השיוך', 'אין אצלנו'], ['gmc_method', 'פיצוי תנועת מצלמה (רק BoT-SORT)', 'פרק 8. ברירת המחדל היא זרימה אופטית דלילה, בדיוק כמו אצלנו'], ['with_reid', 'מאפייני מראה (רק BoT-SORT, כבוי בברירת מחדל)', 'פרק 6']];
  const code = el('div', { class: 'mono', style: { direction: 'ltr', textAlign: 'left', background: 'var(--code-bg)', padding: '8px 10px', borderRadius: '8px' } }); box.appendChild(code); const out = V.say(box, 'בחר שורה.');
  rows.forEach(([k, what, ours]) => { const line = el('div', { style: { cursor: 'pointer', padding: '1px 4px', borderRadius: '4px' } }, k + ': …'); line.onclick = () => { [...code.children].forEach(c => c.style.background = ''); line.style.background = 'rgba(66,99,235,.2)'; out.innerHTML = '<b>' + ltr(k) + '</b>: ' + what + '. אצלנו: ' + ours + '.'; }; code.appendChild(line); });
};

/* 10.2 conf passed to the detector */
W.w5_conf_effect = function (box) {
  V.say(box, 'ב־model.track מעבירים conf=0.1. למה כל כך נמוך? כי מה שהמזהה זורק, העוקב לעולם לא רואה, והשלב השני של ByteTrack צריך את הזיהויים הנמוכים. <b>שנה את conf</b>.');
  let conf = 0.1; V.slider(box, 'conf של המזהה', 0.05, 0.6, 0.05, conf, v => { conf = v; calc(); }); const out = mono(box);
  function calc() { const fr = makeScene({ n: 16, T: 140, miss: 0.05, lowFrac: 0.3, fixedFP: 5, seed: 12, W: 480, H: 300 }); const cut = fr.map(x => ({ dets: x.dets.filter(d => d.s >= conf), gts: x.gts })); const tr = makeTracker({ two: true }); const s = score(cut, cut.map(x => tr.step(x.dets)));
    out.textContent = 'two-stage tracker, detector conf = ' + f(conf, 2) + '\nMOTA ' + f(s.mota, 3) + '   FN ' + s.fn + '   IDSW ' + s.sw + (conf > 0.1 ? '\nlow detections removed before the tracker: stage 2 starves' : ''); }
  calc();
};

/* 10.3 MOT format */
W.w5_fair = function (box) {
  V.say(box, 'שורה בפורמט MOT: פריים (מ־1), מספר, פינה שמאלית עליונה, רוחב, גובה, ציון, ושלושה שדות לא בשימוש. <b>שנה את המלבן</b> וראה את השורה, ואת הקריאה חזרה.');
  const v = { t: 0, id: 7, x1: 100, y1: 50, x2: 140, y2: 130 }; const g = el('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', direction: 'ltr' } }); box.appendChild(g);
  Object.keys(v).forEach(k => { const i = el('input', { type: 'number', value: v[k], style: { width: '70px' } }); i.oninput = () => { v[k] = +i.value || 0; calc(); }; g.appendChild(el('label', {}, (k === 't' ? 't (0-based)' : k) + ' ', i)); }); const out = mono(box);
  function calc() { const line = (v.t + 1) + ',' + v.id + ',' + f(v.x1, 1) + ',' + f(v.y1, 1) + ',' + f(v.x2 - v.x1, 1) + ',' + f(v.y2 - v.y1, 1) + ',1,-1,-1,-1'; const r = line.split(',').map(Number);
    out.textContent = 'write_mot →  ' + line + '\nread_mot  →  frame index ' + (r[0] - 1) + ', id ' + r[1] + ', box [' + [r[2], r[3], r[2] + r[4], r[3] + r[5]].join(', ') + ']'; }
  calc();
};

/* 11.1 pixels to metres: foot point vs centre */
W.w5_px_to_m = function (box) {
  V.say(box, 'מצלמה בגובה h מעל קרקע שטוחה. כל שורת פיקסלים מכסה יותר מטרים ככל שמתרחקים. ומרכז הקופסה של אדם נמצא באוויר, ולכן ההומוגרפיה של הקרקע "מפילה" אותו מאחוריו (תרגיל 11.2). <b>שנה גובה ומרחק</b>.');
  let hc = 3, Z = 12; const sr = V.row(box); V.slider(sr, 'גובה מצלמה (מטר)', 2, 30, 0.5, hc, v => { hc = v; draw(); }); V.slider(sr, 'מרחק האדם (מטר)', 3, 40, 0.5, Z, v => { Z = v; draw(); });
  const svg = svgBox(box, 480, 200); const out = V.say(box); const hp = 1.8;
  function draw() { svg.innerHTML = ''; const sx = 440 / 50, gy = 180; const X = z => 20 + z * sx, Y = h => gy - h * 12; V.s('line', { x1: 10, y1: gy, x2: 470, y2: gy, style: { stroke: 'var(--ink3)', strokeWidth: 2 } }, svg); V.s('rect', { x: X(0) - 4, y: Y(hc), width: 8, height: gy - Y(hc), style: { fill: '#868e96' } }, svg);
    V.s('rect', { x: X(Z) - 3, y: Y(hp), width: 6, height: gy - Y(hp), style: { fill: 'var(--c3)' } }, svg); const hcen = hp / 2; const Zc = hc > hcen ? Z * hc / (hc - hcen) : 999; const ray = (zz, col) => V.s('line', { x1: X(0), y1: Y(hc), x2: X(Math.min(zz, 50)), y2: zz > 50 ? Y(hc - (hc - 0) * 50 / zz) : gy, style: { stroke: col, strokeWidth: 1.5, strokeDasharray: '4 3' } }, svg);
    ray(Z, 'var(--c3)'); ray(Zc, 'var(--c2)'); V.s('circle', { cx: X(Math.min(Zc, 50)), cy: gy, r: 4, style: { fill: 'var(--c2)' } }, svg);
    const fpx = 1000, tilt = Math.atan(hc / 15); const v = z => fpx * Math.tan(Math.atan(hc / z) - tilt); const pix = z => Math.abs(0.01 / (v(z + 0.005) - v(z - 0.005)));
    out.innerHTML = 'ירוק: הקרן לנקודת הרגל, נכונה. אדום: הקרן דרך מרכז הקופסה (0.9 מטר) פוגשת את הקרקע ב־' + ltr(f(Zc, 1)) + ' מטר במקום ' + ltr(f(Z, 1)) + ': ניפוח פי <b>' + ltr(f(hc / (hc - hcen), 2)) + '</b>. פיקסל אחד (מוקד 1000) מכסה כאן ' + ltr(f(pix(Z), 3)) + ' מטר, ובמרחק כפול ' + ltr(f(pix(Z * 2), 3)) + '.'; }
  draw();
};

/* 11.2 speed from per-frame differences vs a window */
W.w5_speed_window = function (box) {
  V.say(box, 'הולך רגל ב־1.4 מטר לשנייה, רעש קופסה של 1.5 פיקסל. <b>שנה את הרעש (בס״מ לפיקסל) ואת החלון</b>. הפרש בין פריימים סמוכים תמיד מנפח, כי הנורמה של רעש לא שלילית.');
  let m = 3.1, win = 30; const sr = V.row(box); V.slider(sr, 'ס״מ לפיקסל', 1, 15, 0.1, m, v => { m = v; draw(); }); V.slider(sr, 'חלון (פריימים, 30 לשנייה)', 1, 60, 1, win, v => { win = v; draw(); });
  const P = window.IM.plot(box, { w: 460, h: 190 }); const out = V.say(box);
  function draw() { const r = rng(4); const sd = 1.5 * m / 100; const pos = [...Array(300)].map((_, t) => [1.4 * t / 30 * 0.8 + randn(r) * sd, 1.4 * t / 30 * 0.6 + randn(r) * sd]); const sp = []; for (let t = win; t < 300; t++) sp.push([t, Math.hypot(pos[t][0] - pos[t - win][0], pos[t][1] - pos[t - win][1]) * 30 / win]);
    const mu = sp.reduce((s, p) => s + p[1], 0) / sp.length, s2 = Math.sqrt(sp.reduce((s, p) => s + (p[1] - mu) ** 2, 0) / sp.length); P.draw([{ pts: sp, color: 'var(--c2)', width: 1.5 }, { pts: [[0, 1.4], [299, 1.4]], color: 'var(--c3)', width: 2, dash: '4 3' }], [0, 299], [0, Math.max(3, mu + 3 * s2)]);
    out.innerHTML = 'מהירות נמדדת: <b>' + ltr(f(mu, 2) + ' ± ' + f(s2, 2)) + '</b> מטר לשנייה (אמת 1.4). בסעיף: הפרש בין פריימים 4.36 ± 2.55 קרוב, וחלון של שנייה 1.41 ± 0.12.'; }
  draw();
};

/* 11.3 line crossing with hysteresis */
W.w5_line_cross = function (box) {
  V.say(box, 'אדם עומד ליד קו הספירה ורועד (רעש), ואז חוצה פעם אחת. הסימן של המכפלה הווקטורית אומר באיזה צד הוא. <b>שנה את מספר הפריימים ליציבות</b> (בסעיף: 27 חציות בלי, 1 עם 5 פריימים).');
  let st = 5, nz = 0.2; const sr = V.row(box); V.slider(sr, 'פריימים ליציבות', 1, 12, 1, st, v => { st = v; draw(); }); V.slider(sr, 'רעש (מטר)', 0.02, 0.6, 0.02, nz, v => { nz = v; draw(); });
  const P = window.IM.plot(box, { w: 460, h: 180 }); const out = V.say(box);
  function draw() { const r = rng(2); const y = [...Array(200)].map((_, t) => (t < 120 ? 9.75 : 9.75 + (t - 120) * 0.05) + randn(r) * nz); let side = Math.sign(y[0] - 10), naive = 0, hy = 0, cand = side, run = 0, conf = side; const marks = [];
    for (let t = 1; t < 200; t++) { const s = Math.sign(y[t] - 10); if (s !== side) { naive++; side = s; } if (s === cand) run++; else { cand = s; run = 1; } if (run >= st && cand !== conf) { conf = cand; hy++; marks.push(t); } }
    P.draw([{ pts: y.map((v, t) => [t, v]), color: 'var(--c1)', width: 1.5 }, { pts: [[0, 10], [199, 10]], color: 'var(--c2)', width: 2 }, ...marks.map(m => ({ vline: m, color: 'var(--c3)', dash: '3 3' }))], [0, 199], [8.5, 15]);
    out.innerHTML = 'אדום: הקו (y = 10). חציות בספירה תמימה: <b>' + naive + '</b>. עם היסטרזיס של ' + st + ' פריימים: <b>' + hy + '</b> (ירוק).'; }
  draw();
};

/* 11.4 forbidden zone */
W.w5_zone = function (box) {
  V.say(box, 'האזור בין 12 ל־18 מטר. אדם הולך דרכו. התראה רק אחרי <b>stable</b> פריימים ברצף בפנים, ופעם אחת לכל כניסה. <b>שנה stable והרעש</b>, ועבור על הזמן.');
  let stb = 5, nz = 0.15; const sr = V.row(box); V.slider(sr, 'stable', 1, 15, 1, stb, v => { stb = v; st.refresh(); }); V.slider(sr, 'רעש (מטר)', 0, 0.6, 0.05, nz, v => { nz = v; st.refresh(); });
  const svg = svgBox(box, 480, 200); const out = V.say(box); const poly = [[8, 12], [14, 12], [14, 18], [8, 18]];
  const inside = (p, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c; } return c; };
  const sim = () => { const r = rng(5); const path = [...Array(300)].map((_, t) => [11 + randn(r) * nz, 2 + t * 0.07 + randn(r) * nz]); let cnt = 0, alerted = false; const alerts = []; path.forEach((p, t) => { const i = inside(p, poly); cnt = i ? cnt + 1 : 0; if (cnt >= stb && !alerted) { alerted = true; alerts.push(t); } if (!i) alerted = false; }); return { path, alerts }; };
  const S = x => 20 + x * 20, Yv = y => 190 - y * 7.5;
  const st = V.stepper(box, 300, t => { const { path, alerts } = sim(); svg.innerHTML = ''; V.s('polygon', { points: poly.map(p => S(p[0]) + ',' + Yv(p[1])).join(' '), style: { fill: 'rgba(224,49,49,.15)', stroke: 'var(--c2)', strokeWidth: 2 } }, svg);
    V.s('polyline', { points: path.slice(0, t + 1).map(p => S(p[0]) + ',' + Yv(p[1])).join(' '), style: { fill: 'none', stroke: 'var(--c1)', strokeWidth: 1.5 } }, svg); const p = path[t]; V.s('circle', { cx: S(p[0]), cy: Yv(p[1]), r: 5, style: { fill: inside(p, poly) ? 'var(--c2)' : 'var(--c1)' } }, svg);
    const first = path.findIndex(q => inside(q, poly)); const done = alerts.filter(a => a <= t); out.innerHTML = 'פריים ' + t + '. כניסה ראשונה לפי הנקודה: ' + first + '. התראות: <b>' + (done.length ? done.join(', ') : '—') + '</b>' + (alerts.length > 1 ? ' — יותר מאחת: הרעש מוציא ומכניס אותו. הגדל stable.' : '.'); }, { speed: 40 });
};

/* 11.5 the hook loop */
W.w5_hook = function (box) {
  V.say(box, 'הלולאה של הסעיף על זרם מסומלץ: בכל פריים מסלול, נקודת רגל, מהירות, קו ואזור. <b>נגן</b> וראה שההדפסות מעטות: אחת לכל חציה ואחת לכל כניסה.');
  const log = mono(box); const r = rng(8); const tracks = [1, 2, 3].map(k => ({ id: k, x: 4 + k * 4, y: 2 + r() * 3, vy: 0.04 + r() * 0.05 }));
  V.stepper(box, 300, t => { const lines = []; const state = tracks.map(tk => ({ id: tk.id, side: 0, cnt: 0, al: false, ls: 0, lc: 0 }));
    for (let k = 0; k <= t; k++) tracks.forEach((tk, i) => { const s = state[i]; const y = tk.y + tk.vy * k + randn(r) * 0.0; const x = tk.x; const sd = Math.sign(y - 10); if (k === 0) s.side = sd; if (sd !== s.side) { s.lc++; if (s.lc >= 5) { s.side = sd; s.lc = 0; lines.push(k + ' crossing ' + tk.id); } } else s.lc = 0; const ins = x >= 8 && x <= 14 && y >= 12 && y <= 18; s.cnt = ins ? s.cnt + 1 : 0; if (s.cnt >= 5 && !s.al) { s.al = true; lines.push(k + ' ALERT ' + tk.id); } if (!ins) s.al = false; });
    log.textContent = 'frame ' + t + '\n' + (lines.join('\n') || '(nothing printed yet)'); }, { speed: 30 });
};

/* 12.1 the engine flow */
W.w5_engine_flow = function (box) {
  V.say(box, 'המבנה לפי סדר הזרימה. <b>לחץ על שלב</b> וראה מאיזה פרק הוא בא.');
  const st = [['פריים', 'קריאת וידאו, מודול 1'], ['גלאי', 'מודול 4, עם conf נמוך (פרק 10)'], ['תנועת מצלמה', 'פרק 8: זרימה אופטית ו־RANSAC'], ['עוקב', 'פרקים 2 עד 7: קלמן, שיוך, שני שלבים'], ['מיפוי לקרקע', 'פרק 11 ומודול 3: הומוגרפיה של הקרקע, נקודת רגל, ועיגון (12.2)'], ['אנליטיקה', 'פרק 11: מהירות בחלון, קו עם היסטרזיס, פוליגון'], ['פלט', 'וידאו מסומן, קובץ MOT (פרק 10), דו״ח (12.5)']];
  const row = el('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', alignItems: 'center' } }); box.appendChild(row); const out = V.say(box, 'בחר שלב.');
  st.forEach(([n, d], i) => { const b = V.button(n, () => { out.innerHTML = '<b>' + n + '</b>: ' + d + '.'; }, 'sm'); row.appendChild(b); if (i < st.length - 1) row.appendChild(el('span', {}, '←')); });
};

/* 12.2 GSD and drift */
W.w5_gsd = function (box) {
  V.say(box, 'רחפן שמצלם ישר למטה: פיקסל אחד מכסה גובה × גודל פיקסל ÷ מוקד. ושרשור של הומוגרפיות בין פריימים סוחף כמו הילוך מקרי. <b>שנה את הערכים</b> (12.2: 2.7 ס״מ ב־50 מטר; תרגיל 12.1: 4.3 ס״מ ב־80; תרגיל 12.4: 0.08 מטר אחרי 300 פריימים).');
  let H = 50, px = 2.4, fl = 4.5, N = 300; const sr = V.row(box); V.slider(sr, 'גובה (מטר)', 10, 150, 1, H, v => { H = v; draw(); }); V.slider(sr, 'פיקסל (מיקרון)', 1, 6, 0.1, px, v => { px = v; draw(); }); V.slider(sr, 'מוקד (מ״מ)', 2, 24, 0.5, fl, v => { fl = v; draw(); });
  V.slider(box, 'פריימים בלי עיגון', 30, 6000, 30, N, v => { N = v; draw(); }); const P = window.IM.plot(box, { w: 460, h: 170 }); const out = V.say(box);
  function draw() { const g = H * px * 1e-6 / (fl * 1e-3); const s = 0.08 / Math.sqrt(300); const pts = [...Array(101)].map((_, i) => { const n = i * 60; return [n, s * Math.sqrt(n)]; }); P.draw([{ pts, color: 'var(--c2)', width: 2.5 }, { pts: [[0, 0.2], [6000, 0.2]], color: 'var(--ink3)', dash: '4 3' }, { vline: N, color: 'var(--c1)' }], [0, 6000], [0, 0.5]);
    out.innerHTML = 'GSD = <b>' + ltr(f(g * 100, 2)) + '</b> ס״מ לפיקסל. רעש 1.5 פיקסל = ' + ltr(f(g * 150, 1)) + ' ס״מ. סחיפה אחרי ' + N + ' פריימים: <b>' + ltr(f(s * Math.sqrt(N), 3)) + '</b> מטר. ל־0.2 מטר (קו מקווקו): עיגון לכל המאוחר כל ' + ltr(f(300 * (0.2 / 0.08) ** 2, 0)) + ' פריימים.'; }
  draw();
};

/* 12.3 the pipeline loop, line by line */
W.w5_pipeline_steps = function (box) {
  V.say(box, 'מה קורה לפריים אחד בתוך הלולאה של השלד. <b>עבור על השלבים</b>.');
  const steps = [['ok, frame = cap.read()', 'קוראים פריים. אם נגמר הווידאו, יוצאים.'], ['gray = cv2.cvtColor(...)', 'אפור, כי הזרימה האופטית עובדת על בהירות.'], ['A = estimate_motion(prev_gray, gray)', 'תנועת המצלמה בין הפריים הקודם לזה (פרק 8). בפריים הראשון: IDENTITY.'], ['gm.step(A)', 'המיפוי לקרקע מתעדכן באותה תנועה, ומדי פעם מעוגן מחדש (12.2).'], ['dets = detector(frame)', 'הגלאי ממודול 4.'], ['tracker.update(dets, A)', 'העוקב מזיז את המסלולים ב־A, חוזה, ומשייך בשני שלבים.'], ['g = to_ground(gm.H_now(), [foot(box)])', 'נקודת הרגל, לא המרכז, עוברת לקרקע.'], ['hist[tid].append(g); v = speed_from(...)', 'מהירות מחלון של שנייה, לא מהפרש בין פריימים.'], ['zone.update(tid, g)', 'התראה פעם אחת לכל כניסה.'], ['prev_gray = gray', 'שומרים לפריים הבא.']];
  const out = mono(box); const say = V.say(box);
  V.stepper(box, steps.length, s => { out.textContent = steps.map((x, i) => (i === s ? '▶ ' : '  ') + x[0]).join('\n'); say.innerHTML = steps[s][1]; });
};

/* 12.4 plan checklist (stages, persisted) */
W.w5_plan = function (box) {
  V.say(box, 'התוכנית של הסעיף כרשימת שלבים. <b>סמן מה עשית</b>; הסימון נשמר בדפדפן. (בחומר המקורי השלבים מחולקים לשבועות; כאן הם לפי סדר.)');
  const rows = [['נתונים ובסיס', 'קטעי וידאו מרחפן עם תיוג עקיבות (למשל VisDrone, משימת ה־MOT), הרצת הגלאי ממודול 4 ועוקב בסיס פשוט', 'קובץ תוצאות שעובר את הקריאה והכתיבה מפרק 10 בלי שינוי במדדים'], ['עוקב', 'מימוש שלכם (פרק 7) מול העוקב של הספרייה (פרק 10), אותו גלאי לשניהם', 'טבלה עם MOTA, IDF1 ו־HOTA לשניהם; הפרש של יותר מכמה נקודות אחוז דורש הסבר'], ['תנועת מצלמה וקרקע', 'פיצוי תנועת מצלמה, מיפוי לקרקע, עיגון מחדש', 'ניסוי עם ובלי פיצוי על כל הקטעים, כולל קטע אחד שבו הרחפן מסתובב מהר'], ['אנליטיקה ודו״ח', 'מהירות, קו, פוליגון, וידאו מסומן, הדו״ח', 'אימות מהירות מול אמת ידועה (תרגיל 12.2), ודו״ח לפי התבנית']];
  const S = window.Store.map('notes'); const key = 'm5_plan'; let done = {}; try { done = JSON.parse(S[key] || '{}'); } catch (e) { done = {}; } const out = V.say(box);
  rows.forEach(([g, prod, chk], i) => { const cb = el('input', { type: 'checkbox' }); cb.checked = !!done[i]; cb.onchange = () => { done[i] = cb.checked; S[key] = JSON.stringify(done); window.Store.save(); upd(); }; box.appendChild(el('label', { style: { display: 'block', margin: '6px 0', padding: '8px', border: '1px solid var(--line)', borderRadius: '8px' } }, cb, el('b', {}, ' ' + (i + 1) + '. ' + g), el('div', { class: 'note-small' }, 'תוצר: ' + prod), el('div', { class: 'note-small' }, 'בדיקת הצלחה: ' + chk))); });
  function upd() { const n = Object.values(done).filter(Boolean).length; out.innerHTML = n + ' מתוך 4 שלבים.'; } upd();
};

/* 12.5 report template (persisted, copy as markdown) */
W.w5_report = function (box) {
  V.say(box, 'תבנית הדו״ח. <b>מלא את המספרים שלך</b>; הם נשמרים בדפדפן, ואפשר להעתיק כטבלת Markdown. (בסימולציה: 17 החלפות ו־0.570 בלי פיצוי, 4 ו־0.861 עם.)');
  const rows = [['החלפות זהות', 'המדד המרכזי של הפרויקט'], ['IDF1', 'יציבות זהות לאורך זמן'], ['MOTA', 'בעיקר איכות גילוי'], ['HOTA', 'איזון בין גילוי לשיוך'], ['מספר מזהים חלקי מספר אובייקטים אמיתיים', 'קרוב ל־1 = טוב'], ['שגיאת מהירות ממוצעת (מטר לשנייה)', 'מול אמת ידועה'], ['התראות שווא באזור האסור', 'לכל שעת וידאו'], ['פריימים לשנייה', 'על החומרה שלכם']];
  const S = window.Store.map('notes'); const key = 'm5_report'; let d = {}; try { d = JSON.parse(S[key] || '{}'); } catch (e) { d = {}; }
  const t = el('table', { class: 'mini', style: { margin: '8px auto' } }); t.appendChild(el('tr', {}, ...['מדד', 'בלי פיצוי', 'עם פיצוי', 'הערה'].map(h => el('th', {}, h)))); box.appendChild(t);
  rows.forEach(([m, note], i) => { const cell = k => { const inp = el('input', { value: d[i + k] || '', style: { width: '80px', direction: 'ltr' } }); inp.oninput = () => { d[i + k] = inp.value; S[key] = JSON.stringify(d); window.Store.save(); }; return el('td', {}, inp); }; t.appendChild(el('tr', {}, el('td', {}, m), cell('a'), cell('b'), el('td', { class: 'note-small' }, note))); });
  const out = V.say(box); V.btns(box, [['העתק כ־Markdown', () => { const md = '| מדד | בלי פיצוי | עם פיצוי | הערה |\n|---|---|---|---|\n' + rows.map(([m, n], i) => '| ' + m + ' | ' + (d[i + 'a'] || '') + ' | ' + (d[i + 'b'] || '') + ' | ' + n + ' |').join('\n'); try { navigator.clipboard.writeText(md); out.textContent = 'הועתק.'; } catch (e) { out.textContent = md; } }]]);
};

/* 12.6 pitfalls quiz */
W.w5_pitfalls = function (box) {
  V.say(box, 'תסמין מהשטח. <b>איזו מלכודת?</b>');
  const P = ['מטרים מהמרכז ולא מהרגל', 'שרשור בלי עיגון', 'אנליטיקה בפיקסלים', 'השוואה לא הוגנת', 'ממוצע שמסתיר'];
  const Q = [['המהירויות של אנשים רחוקים גבוהות בעקביות מאלה של קרובים.', 0], ['בדקה הראשונה המיקומים מושלמים, בדקה החמישית כולם זזים מטר.', 1], ['כשהרחפן מסתובב, אנשים "חוצים" את הקו בלי לזוז.', 2], ['העוקב שלי מנצח את הספרייה ב־10 נקודות, אבל הספרייה קיבלה זיהויים עם conf של 0.5.', 3], ['IDF1 על כל הסרט 0.85, אבל הלקוח מתלונן על החלפות בכל פנייה.', 4]];
  let i = 0; const q = V.say(box); const row = V.row(box); const out = V.say(box);
  function show() { q.innerHTML = '<b>' + (i + 1) + '/' + Q.length + '.</b> ' + Q[i][0]; row.innerHTML = ''; P.forEach((p, j) => row.appendChild(V.button(p, () => { out.innerHTML = j === Q[i][1] ? '✓ נכון.' : '✗ זו "' + P[Q[i][1]] + '".'; setTimeout(() => { i = (i + 1) % Q.length; show(); }, 1200); }, 'sm'))); }
  show();
};
})();
