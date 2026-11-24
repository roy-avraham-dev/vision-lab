/* Module 1 visuals — chapters 4–6: filtering, edges, morphology */
(function () {
const W = window.W, V = window.V, IM = window.IM, el = V.el;
const row = box => { const r = V.row(box); r.style.direction = 'ltr'; r.style.justifyContent = 'center'; r.style.alignItems = 'flex-start'; return r; };
const col = (parent, title) => { const d = el('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' } }); if (title) d.appendChild(el('div', { class: 'note-small', html: title })); parent.appendChild(d); return d; };
const stepImg = (w = 80, h = 60) => { const g = IM.gray(w, h, 60); for (let y = 0; y < h; y++) for (let x = w / 2; x < w; x++) g.d[y * w + x] = 190; return g; };
const square = (n = 80, a = 20, b = 60, v = 200) => { const g = IM.gray(n, n); IM.fillRect(g, a, a, b - 1, b - 1, v); return g; };

/* 4.1 why filter: noise wrecks a threshold */
W.w1_noise = function (box) {
  V.say(box, 'תמונה עם קצה חד. <b>הגבר את הרעש</b> וראה מה קורה לסף (באמצע): המסכה הופכת למנוקדת. אחר כך הדלק טשטוש קל לפני הסף.');
  const clean = stepImg(); let amt = 20, kind = 'g', blur = false;
  V.tabs(box, ['רעש גאוסיאני', 'מלח ופלפל'], i => { kind = i ? 'sp' : 'g'; draw(); });
  const sr = V.row(box); V.slider(sr, 'כמות רעש', 0, 60, 1, amt, v => { amt = v; draw(); });
  V.tabs(box, ['בלי סינון', 'טשטוש גאוסיאני 5×5 לפני הסף'], i => { blur = i === 1; draw(); });
  const rr = row(box); const c1 = IM.canvas(col(rr, 'התמונה'), 80, 60, 3); const c2 = IM.canvas(col(rr, 'סף 125'), 80, 60, 3); const out = V.say(box);
  function draw() {
    let g = IM.noise(clean, kind, kind === 'sp' ? amt / 200 : amt, 4); if (blur) g = kind === 'sp' ? IM.median(g, 3) : IM.blur(g, 5);
    IM.show(c1, g); const m = IM.map(g, v => v > 125 ? 255 : 0); IM.show(c2, m);
    let wrong = 0; for (let y = 0; y < 60; y++) for (let x = 0; x < 80; x++) if ((m.d[y * 80 + x] > 0) !== (x >= 40)) wrong++;
    out.innerHTML = 'פיקסלים בצד הלא נכון של הסף: <b>' + wrong + '</b>' + (blur && kind === 'sp' ? ' (למלח ופלפל השתמשתי כאן בחציוני, תכף נראה למה)' : '') + '.';
  }
  draw();
};

/* 4.2 the four filters on one neighborhood */
W.w1_filters_kernel = function (box) {
  V.say(box, 'שכונה של 5×5 פיקסלים עם <b>קצה</b> (משמאל 60, מימין 190) ו<b>נקודת מלח</b> אחת (255). בחר מסנן וראה את המשקלות ואת הערך החדש של הפיקסל במרכז.');
  const N = [[60, 60, 190, 190, 190], [60, 60, 190, 190, 190], [60, 60, 255, 190, 190], [60, 60, 190, 190, 190], [60, 60, 190, 190, 190]];
  let f = 0, cx = 2;
  const rr = row(box); const M = V.matrix(rr, N); V.op(rr, '→'); const res = el('div', { class: 'big mono', style: { fontSize: '1.6em', alignSelf: 'center' } }); rr.appendChild(res);
  const Wt = V.matrix(row(box), N.map(r => r.map(() => 0)), { fmt: v => v ? V.fmt(v, 2) : '' });
  const out = V.say(box);
  V.tabs(box, ['ממוצע', 'גאוסיאני', 'חציוני', 'דו־צדדי'], i => { f = i; draw(); });
  function draw() {
    const c = N[2][2]; let w = N.map(r => r.map(() => 0)), v = 0;
    if (f === 0) { w = w.map(r => r.map(() => 1 / 25)); }
    if (f === 1) { w = IM.gaussK(5, 1.1); }
    if (f === 3) { const ws = N.map((r, i) => r.map((p, j) => Math.exp(-((i - 2) ** 2 + (j - 2) ** 2) / 4.5 - ((p - c) ** 2) / (2 * 40 * 40)))); const s = ws.flat().reduce((a, b) => a + b); w = ws.map(r => r.map(x => x / s)); }
    if (f === 2) { const a = N.flat().slice().sort((p, q) => p - q); v = a[12]; out.innerHTML = 'ממוינים: <span class="ltr mono" style="display:inline-block">' + a.join(' ') + '</span>. האמצעי (מספר 13 מתוך 25) הוא <b>' + v + '</b>. ה־255 נמצא בקצה המיון, ולכן נעלם בלי להשאיר עקבות.'; Wt.vals(N.map(r => r.map(() => 0))); }
    else { v = 0; N.forEach((r, i) => r.forEach((p, j) => v += p * w[i][j])); Wt.vals(w);
      out.innerHTML = ['כל שכן מקבל 1/25. נקודת ה־255 ושני הצדדים של הקצה נמרחים יחד.', 'פעמון: המרכז והשכנים הקרובים שוקלים יותר. עדיין ממוצע, ולכן ה־255 עדיין "מושך".', '', 'המשקל תלוי גם בדמיון בבהירות: שכנים של 60 כמעט לא נספרים, כי הם רחוקים מהערך של המרכז. הקצה נשמר.'][f]; }
    res.textContent = '= ' + Math.round(v);
    M.cls((i, j) => (f === 3 && Math.abs(N[i][j] - c) < 100) || (f === 2 && N[i][j] === v) ? 'ok' : '');
  }
  draw();
};

/* 4.3 compare the four filters with an error number */
W.w1_filter_compare = function (box) {
  V.say(box, 'התמונה הנקייה מהסעיף (קצה באמצע), שתי גרסאות רועשות, וארבעת המסננים. המספר מתחת לכל תמונה הוא השגיאה הממוצעת מהתמונה הנקייה: <b>קטן יותר זה טוב יותר</b>.');
  const clean = stepImg(64, 48); let kind = 'g', k = 5;
  V.tabs(box, ['רעש גאוסיאני (20)', 'מלח ופלפל (10%)'], i => { kind = i ? 'sp' : 'g'; draw(); });
  V.slider(box, 'גודל הגרעין', 3, 7, 2, k, v => { k = v; draw(); });
  const rr = row(box); rr.style.flexWrap = 'wrap';
  const names = ['בלי סינון', 'ממוצע', 'גאוסיאני', 'חציוני', 'דו־צדדי']; const cs = names.map(n => { const c = col(rr, n); const cv = IM.canvas(c, 64, 48, 2); const t = el('div', { class: 'mono' }); c.appendChild(t); return [cv, t]; });
  function draw() {
    const g = IM.noise(clean, kind, kind === 'sp' ? 0.1 : 20, 1);
    const res = [g, IM.conv(g, IM.boxK(k)), IM.blur(g, k), IM.median(g, k), IM.bilateral(g, k, 60, k / 2)];
    const errs = res.map(r => IM.err(r, clean)); const best = Math.min(...errs.slice(1));
    res.forEach((r, i) => { IM.show(cs[i][0], r); cs[i][1].innerHTML = (errs[i] === best ? '<b class="good">' : '') + V.fmt(errs[i], 1) + (errs[i] === best ? '</b>' : ''); });
  }
  draw();
};

/* 4.4 what happens to the edge: a row profile */
W.w1_edge_profile = function (box) {
  V.say(box, 'שורה אחת מהתמונה הנקייה, אחרי כל מסנן. <b>הגדל את הגרעין</b> וספור כמה פיקסלים נמצאים "באמצע הדרך" (לא 60 ולא 190): זה רוחב המדרון שהמסנן יצר.');
  const clean = stepImg(40, 21); let k = 9;
  V.slider(box, 'גודל הגרעין', 3, 11, 2, k, v => { k = v; draw(); });
  const P = IM.plot(box, { w: 460, h: 190 }); V.legend(box, [['var(--c1)', 'ממוצע'], ['var(--c2)', 'גאוסיאני'], ['var(--c4)', 'דו־צדדי'], ['var(--c3)', 'חציוני']]); const out = V.say(box);
  function draw() {
    const fs = [IM.conv(clean, IM.boxK(k)), IM.blur(clean, k), IM.bilateral(clean, k, 30, k / 2), IM.median(clean, k)];
    const rowOf = g => [...Array(40)].map((_, x) => [x, g.d[10 * 40 + x]]);
    P.draw(fs.map((g, i) => ({ pts: rowOf(g), color: ['var(--c1)', 'var(--c2)', 'var(--c4)', 'var(--c3)'][i], dots: true })), [8, 31], [50, 200]);
    const wd = fs.map(g => rowOf(g).filter(([, v]) => v > 61 && v < 189).length);
    out.innerHTML = 'רוחב המעבר: ממוצע <b>' + wd[0] + '</b>, גאוסיאני <b>' + wd[1] + '</b>, דו־צדדי <b>' + wd[2] + '</b>, חציוני <b>' + wd[3] + '</b> פיקסלים.';
  }
  draw();
};

/* 4.5 choose a filter: scenarios */
W.w1_filter_choose = function (box) {
  V.say(box, 'מצבים מהשטח. לכל אחד, בחר את המסנן שהיית בוחר.');
  const Q = [['מצלמה רגילה, לפני סף צבע ומתארים.', 1, 'גאוסיאני 5×5 הוא ברירת המחדל לפני כמעט כל שלב.'], ['חיישן עם כמה פיקסלים מתים שתמיד לבנים.', 2, 'נקודות בודדות הרוסות לגמרי: חציוני.'], ['צילום פנים לפני עיבוד, צריך לשמור על קצוות חדים ויש זמן.', 3, 'דו־צדדי שומר קצוות, במחיר של זמן.'], ['מערכת על מחשב חלש מאוד, האיכות פחות חשובה.', 0, 'ממוצע הוא הכי מהיר.'], ['מסכה עם חורים קטנים בודדים בתוך העצם.', 2, 'חציוני ממלא חור של פיקסל בודד. (בפרק 6 תכיר את הסגירה, שמתאימה לזה עוד יותר.)']];
  const names = ['ממוצע', 'גאוסיאני', 'חציוני', 'דו־צדדי']; let k = 0, score = 0;
  const q = el('div', { class: 'q', style: { fontWeight: 600, margin: '8px 0' } }); box.appendChild(q); const opts = V.row(box); const out = V.say(box);
  function show() { if (k >= Q.length) { q.textContent = 'סיימת: ' + score + ' מתוך ' + Q.length + '.'; opts.innerHTML = ''; return; } q.textContent = (k + 1) + '. ' + Q[k][0]; opts.innerHTML = ''; names.forEach((n, i) => opts.appendChild(V.button(n, () => { const ok = i === Q[k][1]; if (ok) score++; out.innerHTML = (ok ? '<b class="good">נכון.</b> ' : '<b class="bad">לא הפעם.</b> ') + Q[k][2]; k++; setTimeout(show, 900); }))); }
  show();
};

/* ===== chapter 5 ===== */
W.w1_deriv_row = function (box) {
  V.say(box, 'שורה של שישה פיקסלים. <b>שנה את הערכים</b> וראה את ההפרשים בין כל פיקסל לשכנו: היכן שיש קצה, ההפרש קופץ.');
  const vals = [0, 0, 0, 200, 200, 200];
  const rr = row(box); const ins = vals.map((v, i) => { const inp = el('input', { type: 'number', value: v, min: 0, max: 255, style: { width: '76px', textAlign: 'center', direction: 'ltr' } }); inp.oninput = () => { vals[i] = +inp.value || 0; draw(); }; rr.appendChild(inp); return inp; });
  const svg = V.s('svg', { viewBox: '0 0 440 230', width: 440, style: { maxWidth: '100%', direction: 'ltr', display: 'block', margin: '0 auto' } }); box.appendChild(svg); const out = V.say(box);
  function draw() { const d = vals.slice(1).map((v, i) => v - vals[i]); svg.innerHTML = ''; const T = (x, y, t, st) => V.s('text', Object.assign({ x, y, 'font-size': 12, 'text-anchor': 'middle', text: t, style: { fill: 'var(--ink2)' } }, st || {}), svg);
    T(20, 16, 'פיקסלים', { 'text-anchor': 'start' }); vals.forEach((v, i) => { const c = Math.max(0, Math.min(255, v)); V.s('rect', { x: 40 + i * 64, y: 24, width: 58, height: 44, rx: 4, style: { fill: `rgb(${c},${c},${c})`, stroke: 'var(--line2)' } }, svg); T(69 + i * 64, 51, String(v), { style: { fill: c > 128 ? '#111' : '#fff' } }); });
    const z = 160, k = 60 / 255; V.s('line', { x1: 30, y1: z, x2: 430, y2: z, style: { stroke: 'var(--ink3)' } }, svg); T(20, 96, 'הפרש לשכן', { 'text-anchor': 'start' }); T(28, z + 4, '0', { 'text-anchor': 'end', 'font-size': 10 });
    d.forEach((v, i) => { const x = 101 + i * 64, hgt = Math.abs(v) * k; const big = Math.abs(v) === Math.max(...d.map(Math.abs)) && v; V.s('rect', { x: x - 10, y: v > 0 ? z - hgt : z, width: 20, height: Math.max(1, hgt), style: { fill: big ? 'var(--c2)' : 'var(--c1)' } }, svg); T(x, v >= 0 ? z - hgt - 5 : z + hgt + 14, (v > 0 ? '+' : '') + v, { 'font-size': 11 }); });
    out.innerHTML = 'ההפרשים: <b class="ltr mono" style="display:inline-block">' + d.join(', ') + '</b>. הערך הגדול (בכתום) מסמן את המקום של הקצה, והסימן אומר אם עולים לבהיר (+) או יורדים לכהה (−).'; }
  draw();
};

W.w1_sobel = function (box) {
  V.say(box, 'ריבוע בהיר על רקע שחור. בחר מה להציג, ו<b>לחץ על פיקסל</b> כדי לראות את החלון 3×3 ואת החישוב של gx שם. אחר כך נסה את "המלכודת": פלט באותו טיפוס של התמונה.');
  const img = square(60, 15, 45); const S = IM.sobel(img); let mode = 0, trap = false, px = 15, py = 30;
  V.tabs(box, ['gx (אופקי)', 'gy (אנכי)', 'גודל הגרדיאנט'], i => { mode = i; draw(); });
  V.tabs(box, ['פלט עשרוני CV_64F', 'מלכודת: Sobel(img, -1, ...)'], i => { trap = i === 1; draw(); });
  const rr = row(box); const c0 = IM.canvas(col(rr, 'התמונה'), 60, 60, 3.5); const c1 = IM.canvas(col(rr, 'התוצאה (אפור = 0)'), 60, 60, 3.5); IM.show(c0, img);
  const calc = el('div', { class: 'mono note-small', style: { direction: 'ltr', textAlign: 'center' } }); box.appendChild(calc); const out = V.say(box);
  [c0, c1].forEach(c => c.addEventListener('click', e => { [px, py] = IM.mouse(c, e); draw(); }));
  function draw() {
    let g = [S.gx, S.gy, S.mag][mode]; if (trap) g = IM.map(g, v => Math.max(0, Math.min(255, v)));
    const ctx = mode === 2 || trap ? IM.show(c1, g, { scale: 255 / 800 * (trap ? 3.1 : 1) }) : IM.show(c1, g, { signed: true, scale: 128 / 800 });
    ctx.strokeStyle = '#f0f'; ctx.lineWidth = 0.4; ctx.strokeRect(px - 1.5, py - 1.5, 3, 3);
    const w = []; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) w.push(IM.at(img, px + j, py + i));
    calc.textContent = 'window ' + JSON.stringify([w.slice(0, 3), w.slice(3, 6), w.slice(6)]) + '  ·  gx = ' + S.gx.d[py * 60 + px] + '   gy = ' + S.gy.d[py * 60 + px];
    out.innerHTML = trap ? 'בטיפוס של תמונה אין מספרים שליליים: כל ערך שלילי נחתך לאפס. ' + (mode === 0 ? 'הקצה הימני של הריבוע (מבהיר לכהה, ערך שלילי) <b>נעלם</b>.' : mode === 1 ? 'הקצה התחתון נעלם.' : '') : 'על הקצה השמאלי gx = 800: ההפרש 200 כפול סכום המשקלות 1 + 2 + 1 = 4. על הקצה הימני −800.';
  }
  draw();
};

W.w1_gradthresh = function (box) {
  V.say(box, 'סף פשוט על גודל הגרדיאנט של ריבוע מטושטש ורועש. <b>הזז את הסף</b> והשווה את מספר הפיקסלים להיקף האמיתי (160): או שהקצה עבה מדי, או שהוא נקטע.');
  const img = IM.blur(IM.noise(square(60, 10, 50), 'g', 12, 9), 3); const S = IM.sobel(img); let t = 250;
  V.slider(box, 'סף על הגודל', 50, 900, 10, t, v => { t = v; draw(); });
  const rr = row(box); const c1 = IM.canvas(rr, 60, 60, 4); const out = V.say(box);
  function draw() { const m = IM.map(S.mag, v => v > t ? 255 : 0); IM.show(c1, m); const n = IM.count(m); const { comps } = IM.components(m);
    out.innerHTML = '<b>' + n + '</b> פיקסלים (היקף אמיתי 160), ב־<b>' + comps.length + '</b> חלקים נפרדים. ' + (n > 220 ? 'הקצה ברוחב 2 פיקסלים ויותר.' : comps.length > 1 ? 'הקצה נקטע: חלק ממנו מעט מתחת לסף.' : ''); }
  draw();
};

W.w1_canny = function (box) {
  V.say(box, 'ארבעת השלבים של קני, אחד אחרי השני, על ריבוע רועש. עבור על השלבים, ואז כבה את שלב 1 (הטשטוש) כדי לראות כמה קצוות מזויפים מופיעים.');
  const base = IM.noise(square(80, 20, 60), 'g', 25, 4); let blur = true, k = 0;
  V.tabs(box, ['עם טשטוש (שלב 1)', 'בלי טשטוש'], i => { blur = i === 0; draw(k); });
  const rr = row(box); const cv = IM.canvas(rr, 80, 80, 4); const out = V.say(box);
  const names = ['1. טשטוש גאוסיאני', '2. סובל: גודל הגרדיאנט', '3. דילול: רק המקסימום לאורך כיוון הגרדיאנט', '4. שני ספים (50, 150)'];
  function draw(i) {
    k = i; const b = blur ? IM.blur(base, 5) : base; const S = IM.sobel(b); let im = b, n = null;
    if (i === 1) im = S.mag; if (i >= 2) { im = IM.nms(S); } if (i === 3) { im = IM.hyst(im, 200, 600); n = IM.count(im); }
    IM.show(cv, im, { scale: i === 1 || i === 2 ? 255 / 1000 : 1 });
    out.innerHTML = '<b>' + names[i] + '</b>' + (n !== null ? ': <b>' + n + '</b> פיקסלי קצה (ההיקף האמיתי 160). ' + (blur ? 'קו דק ורציף.' : 'בלי טשטוש, הרעש הופך למאות קצוות מזויפים.') : '');
  }
  V.stepper(box, 4, draw, { speed: 1500 });
};

W.w1_canny_thresh = function (box) {
  V.say(box, 'קני על סצנה, עם שני ספים שאתה קובע. נסה את הכללים מהסעיף: יחס של 2 עד 3, ואת כלל החציון.');
  const scene = IM.gray(96, 72); const S0 = V.scene(96, 72); S0.forEach((r, y) => r.forEach((v, x) => scene.d[y * 96 + x] = v)); const g = IM.noise(scene, 'g', 6, 2);
  let lo = 50, hi = 150;
  const sr = V.row(box); const L = V.slider(sr, 'סף תחתון', 0, 300, 5, lo, v => { lo = v; draw(); }); const H = V.slider(sr, 'סף עליון', 0, 400, 5, hi, v => { hi = v; draw(); });
  const med = [...g.d].sort((a, b) => a - b)[g.d.length >> 1];
  V.btns(box, [['כלל החציון: 0.66 ו־1.33 כפול החציון', () => { L.set(Math.round(0.66 * med), true); H.set(Math.round(1.33 * med), true); }]]);
  const rr = row(box); const c0 = IM.canvas(rr, 96, 72, 3); const c1 = IM.canvas(rr, 96, 72, 3); IM.show(c0, g); const out = V.say(box);
  function draw() { const e = IM.canny(g, Math.min(lo, hi), Math.max(lo, hi), 5); IM.show(c1, e); out.innerHTML = '<b>' + IM.count(e) + '</b> פיקסלי קצה · יחס עליון/תחתון: <b>' + (lo ? V.fmt(hi / lo, 1) : '∞') + '</b> · חציון הבהירות: ' + Math.round(med) + '.'; }
  draw();
};

/* ===== chapter 6 ===== */
const noisyMask = (seed, n = 90, h = 60, specks = 0.01, holes = 0.03) => { const t = IM.gray(n, h); IM.fillCircle(t, 26, 30, 17, 255); IM.fillCircle(t, 64, 30, 15, 255); const m = IM.copy(t); const r = IM.rng(seed); for (let i = 0; i < m.d.length; i++) { const u = r(); if (u < specks) m.d[i] = 255; if (u > 1 - holes && t.d[i]) m.d[i] = 0; } return { t, m }; };

W.w1_morph_problem = function (box) {
  V.say(box, 'מסכת הבדיקה של הפרק: שני עיגולים, נקודות רעש ברקע וחורים בתוכם. <b>הגבר את הרעש</b> ושים לב למספר העצמים שספירת רכיבים מוצאת.');
  let sp = 0.01;
  V.slider(box, 'כמות נקודות רעש', 0, 0.05, 0.002, sp, v => { sp = v; draw(); }, v => Math.round(v * 1000) / 10 + '%');
  const rr = row(box); const cv = IM.canvas(rr, 90, 60, 4); const out = V.say(box);
  function draw() { const { m } = noisyMask(3, 90, 60, sp); const { comps } = IM.components(m); const ctx = IM.show(cv, m); ctx.strokeStyle = '#f80'; ctx.lineWidth = 0.5; comps.forEach(c => ctx.strokeRect(c.x0 - 0.5, c.y0 - 0.5, c.x1 - c.x0 + 1, c.y1 - c.y0 + 1));
    out.innerHTML = 'ספירת רכיבים מוצאת <b>' + comps.length + '</b> עצמים, כשיש בעצם שניים. כל נקודה כתומה היא "עצם" בעיני הספירה.'; }
  draw();
};

W.w1_erode_dilate = function (box) {
  V.say(box, '<b>צייר במסכה</b> (לחיצה הופכת פיקסל), ואז הפעל כירסום או הרחבה עם חלון 3×3. כירסום = מינימום בחלון, הרחבה = מקסימום.');
  let m = IM.gray(24, 16); IM.fillRect(m, 4, 4, 13, 11, 255); m.d[3 * 24 + 19] = 255; m.d[8 * 24 + 8] = 0;
  const hist = [];
  const rr = row(box); const cv = IM.canvas(rr, 24, 16, 16); const out = V.say(box);
  cv.addEventListener('click', e => { const [x, y] = IM.mouse(cv, e); m.d[y * 24 + x] = m.d[y * 24 + x] ? 0 : 255; draw('ציירת.'); });
  V.btns(box, [['כירסום', () => { hist.push(m); m = IM.erode(m, 3); draw('כירסום: לבן נשאר רק אם כל 9 הפיקסלים בחלון לבנים. העצם התכווץ בפיקסל מכל צד, והנקודה הבודדת נעלמה.'); }], ['הרחבה', () => { hist.push(m); m = IM.dilate(m, 3); draw('הרחבה: לבן אם לפחות אחד מ־9 הפיקסלים לבן. העצם גדל, החור נסגר, והנקודה גדלה לריבוע.'); }], ['בטל', () => { if (hist.length) m = hist.pop(); draw(''); }, 'ghost']]);
  function draw(t) { const ctx = IM.show(cv, m); ctx.strokeStyle = 'rgba(128,128,128,.4)'; ctx.lineWidth = 0.05; for (let x = 0; x <= 24; x++) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 16); ctx.stroke(); } for (let y = 0; y <= 16; y++) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(24, y); ctx.stroke(); } out.innerHTML = (t || '') + ' פיקסלים לבנים: <b>' + IM.count(m) + '</b>.'; }
  draw('');
};

W.w1_open_close = function (box) {
  V.say(box, 'המסכה הרועשת והמסכה הנכונה. הפעל כל פעולה ובדוק את שני המספרים: פיקסלים שגויים ועצמים שנספרו (התשובה הנכונה: 2).');
  const { t, m } = noisyMask(3); let k = 5, shape = 'ellipse';
  V.slider(box, 'גודל האלמנט', 3, 9, 2, k, v => { k = v; run(cur); });
  const rr = row(box); const c0 = IM.canvas(col(rr, 'אחרי הפעולה'), 90, 60, 4); const out = V.say(box);
  const ops = { 'גולמית': x => x, 'כירסום בלבד': x => IM.erode(x, k, shape), 'הרחבה בלבד': x => IM.dilate(x, k, shape), 'פתיחה': x => IM.open(x, k, shape), 'סגירה': x => IM.close(x, k, shape), 'פתיחה ואז סגירה': x => IM.close(IM.open(x, k, shape), k, shape) };
  let cur = 'גולמית';
  V.tabs(box, Object.keys(ops), (i, l) => run(l));
  function run(l) { cur = l; const r = ops[l](m); IM.show(c0, r); const { comps } = IM.components(r); const bad = IM.diff(r, t);
    out.innerHTML = '<b>' + l + '</b>: <b>' + bad + '</b> פיקסלים שגויים · <b>' + comps.length + '</b> עצמים' + (comps.length === 2 && l === 'פתיחה ואז סגירה' ? ' <b class="good">✓ שני העצמים, ומעט שגיאות על הגבול בלבד</b>' : ''); }
  run('גולמית');
};

W.w1_morph_more = function (box) {
  V.say(box, 'שני עיגולים שנוגעים זה בזה בגשר. <b>הוסף איטרציות כירסום</b> עד שהם נפרדים לשני רכיבים. ובלשונית השנייה: הגרדיאנט המורפולוגי, הרחבה פחות כירסום.');
  const t = IM.gray(90, 60); IM.fillCircle(t, 30, 30, 18, 255); IM.fillCircle(t, 58, 30, 16, 255);
  let it = 0, mode = 0;
  V.tabs(box, ['איטרציות כירסום', 'גרדיאנט מורפולוגי'], i => { mode = i; draw(); });
  const s = V.slider(box, 'מספר חזרות של כירסום', 0, 12, 1, it, v => { it = v; draw(); });
  const rr = row(box); const cv = IM.canvas(rr, 90, 60, 4); const out = V.say(box);
  function draw() {
    s.el.style.display = mode ? 'none' : '';
    if (mode) { const g = IM.gray(90, 60), d = IM.dilate(t, 3), e = IM.erode(t, 3); for (let i = 0; i < g.d.length; i++) g.d[i] = d.d[i] - e.d[i]; IM.show(cv, g); out.innerHTML = 'מה שנשאר הוא רצועה דקה לאורך הגבול: דרך מהירה לצייר מתאר סביב מסכה.'; return; }
    let m = t; for (let i = 0; i < it; i++) m = IM.erode(m, 3); IM.show(cv, m); const n = IM.components(m).comps.length;
    out.innerHTML = 'אחרי <b>' + it + '</b> איטרציות: <b>' + n + '</b> רכיבים מחוברים. ' + (n === 2 ? '<b class="good">הופרדו.</b> שים לב כמה כל עיגול התכווץ בדרך.' : '');
  }
  draw();
};
})();
