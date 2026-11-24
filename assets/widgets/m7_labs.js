/* Module 7 — lab-grade widgets (override the original widgets of the same id). Shared kit: window.VL7. */
(function () {
const W = window.W, V = window.V, el = V.el, D4 = window.D4; const { F, ltr, canvas, table, row, txt, rng, randn } = D4;

/* ------------------------------------------------------------------ the shared kit */
const SHAPES = ['circle', 'square', 'triangle', 'cross'], COLORS = ['red', 'green', 'blue', 'yellow'], SIZES = ['small', 'large'];
const HEB = { circle: 'עיגול', square: 'ריבוע', triangle: 'משולש', cross: 'צלב', red: 'אדום', green: 'ירוק', blue: 'כחול', yellow: 'צהוב', small: 'קטן', large: 'גדול' };
const RGB = { red: [220, 40, 40], green: [40, 190, 60], blue: [40, 70, 220], yellow: [230, 210, 40] };
const HOLD = ['triangle blue', 'circle yellow', 'square red', 'cross green'];
const TEMPL = ['a photo of a {s} {c} {sh}', 'one {s} {sh} colored {c}', 'a {c} {sh} that is {s}', 'there is a {s} {c} {sh}'];
const fill = (t, sh, c, s) => t.replace('{s}', s).replace('{c}', c).replace('{sh}', sh);
/* draw one 32x32 sample of the course data into an ImageData-like RGB array */
function sample(sh, c, s, r) { const im = new Uint8ClampedArray(32 * 32 * 3); for (let i = 0; i < im.length; i++) im[i] = 70 + Math.floor(r() * 80);
  const R = s === 'large' ? 10 + Math.floor(r() * 3) : 5 + Math.floor(r() * 2); const cx = R + 1 + Math.floor(r() * (30 - 2 * R)), cy = R + 1 + Math.floor(r() * (30 - 2 * R)); const col = RGB[c].map(v => Math.max(0, Math.min(255, v + Math.floor(r() * 41) - 20)));
  const inside = (x, y) => { const dx = x - cx, dy = y - cy; if (sh === 'circle') return dx * dx + dy * dy <= R * R; if (sh === 'square') return Math.abs(dx) <= R && Math.abs(dy) <= R; if (sh === 'triangle') { if (dy < -R || dy > R) return false; const half = (dy + R) / 2; return Math.abs(dx) <= half; } const w = Math.max(2, R >> 1); return (Math.abs(dx) <= R && Math.abs(dy) <= w) || (Math.abs(dx) <= w && Math.abs(dy) <= R); };
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (inside(x, y)) { const o = (y * 32 + x) * 3; im[o] = col[0]; im[o + 1] = col[1]; im[o + 2] = col[2]; } return im; }
function paint(ctx, im, X, Y, scale) { for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const o = (y * 32 + x) * 3; ctx.fillStyle = 'rgb(' + im[o] + ',' + im[o + 1] + ',' + im[o + 2] + ')'; ctx.fillRect(X + x * scale, Y + y * scale, scale, scale); } }
/* a perfectly disentangled toy space (illustration): 10 concept axes */
const AX = SHAPES.concat(COLORS, SIZES); const AXH = AX.map(a => HEB[a]);
const textVec = s => { const v = new Array(AX.length).fill(0); let any = false; s.toLowerCase().split(/\s+/).forEach(w => { const i = AX.indexOf(w); if (i >= 0) { v[i] += 1; any = true; } }); return any ? v : null; };
const imgVec = (sh, c, s, r, noise) => AX.map(a => (a === sh || a === c || a === s ? 1 : 0) + (noise || 0) * randn(r));
const nrm = v => { const n = Math.hypot(...v) || 1; return v.map(x => x / n); }; const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0); const cos = (a, b) => dot(nrm(a), nrm(b));
const heat = v => { const t = Math.max(-1, Math.min(1, v)); return t >= 0 ? 'rgb(' + Math.round(255 - 200 * t) + ',' + Math.round(255 - 120 * t) + ',255)' : 'rgb(255,' + Math.round(255 + 150 * t) + ',' + Math.round(255 + 150 * t) + ')'; };
window.VL7 = { SHAPES, COLORS, SIZES, HEB, HOLD, TEMPL, fill, sample, paint, AX, AXH, textVec, imgVec, nrm, dot, cos, heat };

/* ===================================================================== chapter 1 */
/* 1.1 — the last layer of a closed classifier vs a column computed from text */
W.w7_closed_vs_open = function (box) {
  V.say(box, 'שש תמונות מהנתונים של המודול, ומסווג סגור עם ארבע מחלקות — מטריצה עם עמודה לכל מחלקה, שנלמדה באימון. הוסף מחלקה: במסווג הסגור צריך דוגמאות מתויגות ואימון (המחוון — כמה דוגמאות); במודל הפתוח כותבים משפט, ומקודד הטקסט מחשב את העמודה מיד. <b>זו המחשה</b> במרחב של עשרה מושגים (צורה, צבע, גודל), שבו כל תמונה ומשפט הם וקטור.');
  const r0 = rng(4); const IMGS = [['circle', 'red', 'large'], ['square', 'blue', 'small'], ['triangle', 'green', 'large'], ['cross', 'yellow', 'small'], ['triangle', 'blue', 'large'], ['circle', 'yellow', 'small']].map(([a, b, c]) => ({ l: [a, b, c], im: VL7.sample(a, b, c, r0), v: imgVec(a, b, c, r0, 0.15) }));
  let cols = [['red circle', textVec('red circle')], ['blue square', textVec('blue square')], ['green triangle', textVec('green triangle')], ['yellow cross', textVec('yellow cross')]].map(([n, v]) => ({ n, v, kind: 'closed' }));
  let mode = 1, nEx = 20, prompt = 'a blue triangle'; V.tabs(box, ['מסווג סגור — מחלקה חדשה דורשת אימון', 'מודל פתוח — מחלקה חדשה היא משפט'], k => { mode = k; draw(); }, 1);
  const r1 = row(box); const inp = el('input', { type: 'text', value: prompt, class: 'ltr', style: 'width:220px' }); inp.oninput = () => { prompt = inp.value; draw(); }; r1.appendChild(inp); V.slider(r1, 'דוגמאות מתויגות (סגור)', 0, 500, 10, nEx, v => { nEx = v; draw(); });
  const cv = canvas(box, 760, 230, 760); const out = V.say(box);
  function draw() { const tv = textVec(prompt); const r = rng(nEx + 7); let newCol; if (mode === 0) { const target = tv || new Array(AX.length).fill(0); const q = 1 - Math.exp(-nEx / 60); newCol = target.map(v => v * q + (1 - q) * randn(r) * 0.8); } else newCol = tv; const all = newCol ? cols.concat([{ n: prompt, v: newCol, kind: 'new' }]) : cols;
    const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 230); IMGS.forEach((it, i) => VL7.paint(x, it.im, 640, 21 + i * 36, 1)); 
    const cw = 110; all.forEach((c, j) => { txt(x, c.n, 600 - j * cw - cw / 2, 14, c.kind === 'new' ? '#e8590c' : '#495057', 10, 'center', true); IMGS.forEach((it, i) => { const s = cos(it.v, c.v); const best = all.reduce((bi, cc, k) => cos(it.v, cc.v) > cos(it.v, all[bi].v) ? k : bi, 0) === j; x.fillStyle = heat(s); x.fillRect(600 - (j + 1) * cw + 4, 22 + i * 36, cw - 8, 30); txt(x, F(s, 2), 600 - j * cw - cw / 2, 42 + i * 36, best ? '#000' : '#495057', 11, 'center', best); if (best) { x.strokeStyle = '#212529'; x.lineWidth = 2; x.strokeRect(600 - (j + 1) * cw + 4, 22 + i * 36, cw - 8, 30); x.lineWidth = 1; } }); });
    out.innerHTML = !tv ? 'המשפט לא מכיל אף מושג שהמקודד מכיר (במודל הזעיר של פרק 3 — מילה לא מוכרת היא 0). נסה "a blue triangle" או "yellow".' : mode === 1 ? 'העמודה החדשה (כתום) חושבה מהמשפט — בלי תמונה אחת מתויגת. כל תמונה הולכת לעמודה עם הציון הגבוה (מסגרת). שים לב: <b>"משולש כחול" לא היה באף מחלקה</b>, ובכל זאת הוא מנצח בתמונה החמישית. בתנאי אחד — שהמרחב באמת מפרק צורה וצבע (פרק 4).' : 'במסווג הסגור העמודה נלמדת מדוגמאות: עם ' + nEx + ' דוגמאות היא ' + (nEx < 50 ? 'עדיין רעש' : nEx < 200 ? 'מתקרבת' : 'טובה') + '. וכל מחלקה חדשה — שוב תיוג ושוב אימון, ובדיקה שהישנות לא נפגעו (תרגיל 1.3).'; }
  draw();
};

/* 1.2 — cosine similarity, by hand and by drag */
W.w7_cosine3 = function (box) {
  V.say(box, 'הדוגמה של הסעיף: וקטור תמונה ושלושה וקטורי טקסט, בשלושה ממדים — ערוך את המספרים. מתחת, אותו רעיון בשני ממדים שאפשר לגרור: הקוסינוס תלוי רק בזווית. שני מתגים: "אורך פי 10" לתמונה (תרגיל 1.2), והוספת משפט שהוא בדיוק התמונה (תרגיל 1.4).');
  const img = [0.9, 0.1, 0.4]; const T = [[1, 0, 0.5, 'a red car'], [0, 1, 0, 'a person'], [0.2, 0.1, 1, 'a truck']]; let x10 = false, same = false;
  const ed = el('div'); box.appendChild(ed); const r1 = row(box); [['תמונה × 10', 'x'], ['הוסף משפט = התמונה', 's']].forEach(([n, k]) => { const c = el('label', { html: '<input type="checkbox"> ' + n + ' &nbsp;' }); c.querySelector('input').onchange = e => { if (k === 'x') x10 = e.target.checked; else same = e.target.checked; draw(); }; r1.appendChild(c); });
  const tb = el('div'); box.appendChild(tb); const cv = canvas(box, 760, 220, 760); const out = V.say(box);
  const mk = (arr, i) => el('input', { type: 'number', step: '0.1', value: arr[i], style: 'width:60px', class: 'ltr' });
  ed.innerHTML = ''; const lines = [['תמונה', img]].concat(T.map(t => [t[3], t])); lines.forEach(([n, arr]) => { const d = el('div', { style: 'margin:2px 0' }); d.appendChild(el('span', { html: '<b>' + n + '</b>: ', style: 'display:inline-block;width:90px' })); [0, 1, 2].forEach(i => { const inp = mk(arr, i); inp.oninput = () => { arr[i] = +inp.value; draw(); }; d.appendChild(inp); }); ed.appendChild(d); });
  let ang = 0.35; let drag = false; const P = [[Math.cos(0.1), Math.sin(0.1), 'a red car'], [Math.cos(1.5), Math.sin(1.5), 'a person'], [Math.cos(0.9), Math.sin(0.9), 'a truck']];
  cv.onmousedown = () => drag = true; window.addEventListener('mouseup', () => drag = false); cv.onmousemove = e => { if (!drag) return; const r = cv.getBoundingClientRect(); const X = (e.clientX - r.left) / r.width * 760 - 200, Y = 200 - (e.clientY - r.top) / r.height * 220; ang = Math.atan2(Y, X); draw(); };
  function draw() { const iv = img.map(v => v * (x10 ? 10 : 1)); const rows = T.map(t => [t[3], F(dot(iv, t.slice(0, 3)), 3), '<b>' + F(cos(iv, t.slice(0, 3)), 3) + '</b>']); if (same) rows.push(['"משפט" = התמונה', F(dot(iv, img), 3), '<b>' + F(cos(iv, img), 3) + '</b>']);
    tb.innerHTML = table(['משפט', 'מכפלה סקלרית (בלי נרמול)', 'קוסינוס'], rows);
    const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 220); const O = [200, 200], R = 170; x.strokeStyle = '#dee2e6'; x.beginPath(); x.arc(O[0], O[1], R, -Math.PI, 0); x.stroke();
    const arrow = (a, col, lab, len) => { const X = O[0] + Math.cos(a) * R * len, Y = O[1] - Math.sin(a) * R * len; x.strokeStyle = col; x.lineWidth = 3; x.beginPath(); x.moveTo(O[0], O[1]); x.lineTo(X, Y); x.stroke(); x.lineWidth = 1; txt(x, lab, X + 4, Y - 4, col, 11, 'left', true); };
    P.forEach(p => arrow(Math.atan2(p[1], p[0]), '#868e96', p[2], 1)); arrow(ang, '#e8590c', 'תמונה (גרור)', 0.8);
    P.forEach((p, i) => txt(x, p[2] + ': ' + F(Math.cos(ang - Math.atan2(p[1], p[0])), 3), 740, 40 + i * 20, '#212529', 12, 'right'));
    const sc = T.map(t => cos(iv, t.slice(0, 3))); const best = sc.indexOf(Math.max(...sc));
    out.innerHTML = 'התמונה הכי קרובה ל־<b>' + T[best][3] + '</b>. ' + (x10 ? 'הכפלת את התמונה ב־10: <b>הקוסינוס לא זז</b>, המכפלה הסקלרית גדלה פי 10 — בחיפוש בארכיון זה היה מעדיף תמונות עם וקטור ארוך. ' : '') + (same ? 'המשפט החדש קיבל קוסינוס 1 וגונב את הסיווג — מודל פתוח בוחר את הטוב <i>מתוך הרשימה</i>, ולכן הרשימה צריכה להיות באותה רמת פירוט ובלי חפיפות. ' : '') + 'למטה: הזווית היא כל מה שהקוסינוס רואה.'; }
  draw();
};

/* 1.3 — three families on one frame */
W.w7_families = function (box) {
  V.say(box, 'שלוש המשפחות על אותה תמונה. בחר משפחה: מה נכנס, מה יוצא, ואיזה חלק משותף לאחרות. <b>הפלטים הם המחשה</b> — לא מודל אמיתי.');
  const fam = [['מקודדים משותפים (CLIP, SigLIP)', 'תמונה, או טקסט', 'וקטור אחד', 'בסיס לשתי האחרות'], ['מזהים פתוחים (YOLO-World, Grounding DINO)', 'תמונה + רשימת תיאורים', 'קופסאות עם תיאור', 'משתמש במקודד הטקסט'], ['מודלי שפה־ראייה (פרק 8)', 'תמונה + שאלה', 'תשובה במילים', 'משתמש במקודד התמונה']]; let k = 0;
  V.tabs(box, fam.map(f => f[0]), i => { k = i; draw(); }); const cv = canvas(box, 760, 210, 760); const out = V.say(box);
  const r0 = rng(11); const ims = [['triangle', 'blue', 'large'], ['circle', 'red', 'small'], ['cross', 'yellow', 'large']].map(l => VL7.sample(...l, r0));
  function draw() { const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 210); ims.forEach((im, i) => VL7.paint(x, im, 640 - i * 4, 20 + i * 60, 1.6));
    const box_ = (X, Y, w, h, t, c) => { x.fillStyle = c; x.fillRect(X, Y, w, h); txt(x, t, X + w / 2, Y + h / 2 + 4, '#fff', 11, 'center', true); };
    box_(470, 80, 120, 40, k === 2 ? 'מקודד תמונה' : k === 1 ? 'מקודד תמונה+קופסאות' : 'מקודד תמונה', '#1c7ed6'); if (k > 0) box_(300, 20, 120, 34, 'מקודד טקסט', '#ae3ec9'); if (k === 0) box_(300, 140, 120, 34, 'מקודד טקסט', '#ae3ec9');
    x.strokeStyle = '#495057'; x.beginPath(); x.moveTo(630, 100); x.lineTo(590, 100); x.stroke();
    if (k === 0) { const v = [0.31, -0.12, 0.44, 0.05, -0.27, 0.18, 0.09, -0.33]; v.forEach((a, i) => { x.fillStyle = a > 0 ? '#2f9e44' : '#e03131'; x.fillRect(250 + i * 18, 100 - Math.max(0, a) * 60, 14, Math.abs(a) * 60); }); txt(x, 'וקטור, ואותו מרחב לטקסט:', 400, 75, '#495057', 11, 'right'); txt(x, '"a blue triangle" → וקטור · קוסינוס 0.31', 420, 195, '#495057', 11, 'right'); }
    if (k === 1) { txt(x, 'קלט: ["blue triangle", "red circle"]', 420, 70, '#495057', 11, 'right'); x.strokeStyle = '#e8590c'; x.lineWidth = 2; x.strokeRect(80, 90, 120, 90); x.lineWidth = 1; txt(x, 'blue triangle 0.71', 200, 86, '#e8590c', 11, 'right', true); }
    if (k === 2) { txt(x, 'שאלה: "What shape is blue?"', 420, 70, '#495057', 11, 'right'); txt(x, 'תשובה: "A large blue triangle."', 420, 160, '#2f9e44', 13, 'right', true); }
    out.innerHTML = '<b>' + fam[k][0] + '</b>: נכנס — ' + fam[k][1] + '; יוצא — ' + fam[k][2] + '; ' + fam[k][3] + '. ' + (k === 0 ? 'רוב המודול — פרקים 2 עד 6 — עוסק במשפחה הזו.' : k === 1 ? 'פרק 7: מזהה פתוח בונים מאפס בשני שלבים — הצעות קופסאות, וסיווג פתוח לכל קופסה.' : 'פרק 8: מקודד התמונה ממיר תמונה ל"מילים" שמודל השפה קורא.'); }
  draw();
};

/* ===================================================================== chapter 2 */
/* 2.1 — the data: pairs, four phrasings, four held-out combinations, duplicates in a batch */
W.w7_pairs = function (box) {
  V.say(box, 'דוגמאות מהנתונים של המודול — מצוירות כאן באותו מתכון כמו בקורס: צורה אחת על רקע רועש, ארבעה צבעים, שני גדלים, וכיתוב באחד מארבעה נוסחים. מתחת: 32 הצירופים, וארבעת אלה שלא מופיעים באימון. ולמטה: כמה כפילויות יש במנה — מה שקובע את רצפת ההפסד (תרגיל 2.2).');
  let seed = 1, B = 128; const r1 = row(box); V.btns(r1, [['🎲 דוגמאות אחרות', () => { seed++; draw(); }]]); V.slider(r1, 'גודל מנה', 8, 512, 8, B, v => { B = v; draw(); });
  const cv = canvas(box, 760, 270, 760); const out = V.say(box);
  function draw() { const r = rng(seed); const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 270);
    for (let i = 0; i < 8; i++) { let sh, c, s; do { sh = SHAPES[Math.floor(r() * 4)]; c = COLORS[Math.floor(r() * 4)]; s = SIZES[Math.floor(r() * 2)]; } while (HOLD.includes(sh + ' ' + c)); const X = 760 - (i + 1) * 94; VL7.paint(x, VL7.sample(sh, c, s, r), X + 15, 6, 2); const cap = fill(TEMPL[Math.floor(r() * 4)], sh, c, s); const words = cap.split(' '); txt(x, words.slice(0, 3).join(' '), X + 47, 86, '#495057', 9, 'center'); txt(x, words.slice(3).join(' '), X + 47, 97, '#495057', 9, 'center'); }
    SHAPES.forEach((sh, i) => COLORS.forEach((c, j) => { const X = 400 + j * 85, Y = 120 + i * 30; const h = HOLD.includes(sh + ' ' + c); x.fillStyle = h ? '#fff5f5' : '#ebfbee'; x.fillRect(X, Y, 80, 26); x.strokeStyle = h ? '#e03131' : '#b2f2bb'; x.strokeRect(X, Y, 80, 26); txt(x, HEB[sh] + ' ' + HEB[c], X + 40, Y + 17, h ? '#e03131' : '#2b8a3e', 10, 'center', h); }));
    txt(x, 'אדום — לא מופיע באימון (בשני הגדלים)', 740, 252, '#e03131', 10, 'right');
    const counts = {}; for (let i = 0; i < B; i++) { let sh, c, s; do { sh = SHAPES[Math.floor(r() * 4)]; c = COLORS[Math.floor(r() * 4)]; s = SIZES[Math.floor(r() * 2)]; } while (HOLD.includes(sh + ' ' + c)); const k = sh + c + s; counts[k] = (counts[k] || 0) + 1; } const vals = Object.values(counts); const avg = B / vals.length; let floor = 0; vals.forEach(n => floor += n * Math.log(n)); floor /= B;
    vals.sort((a, b) => b - a).slice(0, 24).forEach((n, i) => { x.fillStyle = '#74c0fc'; x.fillRect(20 + i * 14, 250 - n * 3, 11, n * 3); }); txt(x, 'כמה פעמים כל צירוף במנה (מנה אקראית)', 20, 120, '#495057', 10, 'left');
    out.innerHTML = 'במנה של ' + B + ' יש ' + vals.length + ' צירופים שונים מתוך 24, כל אחד בממוצע ' + F(B / 24, 1) + ' פעמים (במנה הזו: עד ' + Math.max(...vals) + '). מודל מושלם יכול רק לחלק את ההסתברות בין הכפילויות: רצפת ההפסד בכיוון אחד היא הממוצע של <span class="ltr">ln(n)</span> — כאן <b>' + F(floor, 2) + '</b> (ההערכה של תרגיל 2.2: <span class="ltr">ln(' + F(B / 24, 1) + ') = ' + F(Math.log(B / 24), 2) + '</span>). ובפועל קצת פחות — ארבעת הנוסחים מבדילים בין כיתובים של אותו צירוף.'; }
  draw();
};

/* 2.2 — the batch similarity matrix and the contrastive loss, computed here */
W.w7_contrastive = function (box) {
  V.say(box, 'מנה של B זוגות: וקטורי תמונה ווקטורי טקסט, מנורמלים, ומטריצת הקוסינוסים ביניהם. ההפסד מחושב כאן בדיוק כמו בקוד של הסעיף: סיווג על כל שורה (תמונה ← טקסט) ועל כל עמודה (טקסט ← תמונה), והאלכסון הוא התשובה הנכונה. מימין — הנגזרת לפי הציונים, <span class="ltr">(P − I) / B</span> (תרגיל 2.4): כחול מושך למעלה, אדום דוחף למטה.');
  let st = 1, scale = 10, B = 4, dup = 1, mix = 0; V.tabs(box, ['אקראי', 'התאמה מושלמת', 'זוגות זהים'], k => { st = k; draw(); }, 1);
  const r1 = row(box); V.slider(r1, 'קנה מידה s', 1, 50, 0.5, scale, v => { scale = v; draw(); }); V.slider(r1, 'B', 2, 16, 1, B, v => { B = v; draw(); }); V.slider(r1, 'כמה זוגות זהים', 1, 16, 1, dup, v => { dup = v; draw(); }); V.slider(r1, 'כמה המודל למד', 0, 1, 0.05, 1, v => { mix = 1 - v; draw(); });
  const cv = canvas(box, 760, 250, 760); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const r = rng(5 + B); const d = 32; const rnd = () => nrm([...Array(d)].map(() => randn(r)));
    let U, Vt; if (st === 0) { U = [...Array(B)].map(rnd); Vt = [...Array(B)].map(rnd); } else { const base = [...Array(B)].map(rnd); const k = st === 2 ? Math.min(dup < 2 ? B : dup, B) : 1; for (let i = 0; i < B; i++) if (st === 2 && i < k) base[i] = base[0]; U = base.map(v => nrm(v.map((x, j) => x * (1 - mix) + mix * randn(r)))); Vt = base.slice(); }
    const C = U.map(u => Vt.map(v => dot(u, v))); const L = C.map(rw => rw.map(c => scale * c)); const lsm = A => A.map(rw => { const m = Math.max(...rw); const z = Math.log(rw.reduce((s, a) => s + Math.exp(a - m), 0)) + m; return rw.map(a => a - z); });
    const A1 = lsm(L), A2 = lsm(L[0].map((_, j) => L.map(rw => rw[j]))); const i2t = -A1.reduce((s, rw, i) => s + rw[i], 0) / B, t2i = -A2.reduce((s, rw, i) => s + rw[i], 0) / B; const loss = (i2t + t2i) / 2;
    const P = A1.map(rw => rw.map(Math.exp)); const G = P.map((rw, i) => rw.map((p, j) => (p - (i === j ? 1 : 0)) / B)); const gm = Math.max(...G.flat().map(Math.abs));
    const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 250); const cs = Math.min(50, 210 / B);
    const grid = (M, X0, f, lab) => { M.forEach((rw, i) => rw.forEach((v, j) => { x.fillStyle = f(v); x.fillRect(X0 + j * cs, 30 + i * cs, cs - 1, cs - 1); if (B <= 6) txt(x, F(v, Math.abs(v) < 0.01 && v !== 0 ? 3 : 2), X0 + j * cs + cs / 2, 30 + i * cs + cs / 2 + 4, '#212529', 11, 'center'); })); txt(x, lab, X0 + B * cs / 2, 20, '#495057', 11, 'center', true); };
    grid(C, 450, v => heat(v), 'קוסינוס (שורה = תמונה, עמודה = כיתוב)'); grid(G, 80, v => heat(-v / (gm || 1)), 'נגזרת לפי הציונים');
    tb.innerHTML = table(['תמונה ← טקסט', 'טקסט ← תמונה', 'ההפסד', 'רצפה (ln של הכפילויות)', 'ניחוש (ln B)'], [[F(i2t, 4), F(t2i, 4), '<b>' + F(loss, 4) + '</b>', st === 2 ? F(Math.log(Math.min(dup < 2 ? B : dup, B)), 3) : '0', F(Math.log(B), 3)]]);
    out.innerHTML = (st === 1 && scale <= 1.5 ? 'התאמה מושלמת בקנה מידה 1 — ההפסד לא יורד לאפס (בקורס 0.736): קוסינוס בין −1 ל־1 לא מספיק כדי להבדיל. לכן מאמנים את s. ' : '') + (st === 2 ? 'זוגות זהים: המודל לא יכול לדעת איזה "שלו" — ההסתברות מתחלקת, וההפסד נתקע ב־<span class="ltr">ln</span> של מספר הכפילויות (בקורס, ארבעה זהים: 1.386). אלה <b>שליליים מדומים</b>. ' : '') + (st === 0 ? 'וקטורים אקראיים: ההפסד מעל <span class="ltr">ln B</span> (בקורס 4.353 בקנה מידה 10) — ציונים אקראיים מותחים לא נכון. ' : '') + 'בנגזרת: האלכסון מושך את הזוג הנכון למעלה בעוצמה של מה שחסר לו; מחוץ לאלכסון, כל כיתוב ש"גנב" הסתברות נדחף — שלילי שכבר רחוק כמעט לא זז.'; }
  draw();
};
})();

/* ===================================================================== the tiny CLIP, in the browser (chapters 3–5) */
(function () {
const V7 = window.VL7; const { rng, randn } = window.D4;
/* preprocessing — the two inputs of the course: pixels (24x24x3) and chroma (24x24 chroma + 8x8x3 thumb) */
function resizeArea(src, C, S, D) { const out = new Float32Array(D * D * C); const f = S / D; for (let y = 0; y < D; y++) for (let x = 0; x < D; x++) { const x0 = x * f, x1 = x0 + f, y0 = y * f, y1 = y0 + f; for (let c = 0; c < C; c++) { let s = 0; for (let yy = Math.floor(y0); yy < Math.ceil(y1); yy++) { const wy = Math.min(y1, yy + 1) - Math.max(y0, yy); for (let xx = Math.floor(x0); xx < Math.ceil(x1); xx++) { const wx = Math.min(x1, xx + 1) - Math.max(x0, xx); s += wy * wx * src[(yy * S + xx) * C + c]; } } out[(y * D + x) * C + c] = s / (f * f); } } return out; }
function prepPix(im) { const f = new Float32Array(32 * 32 * 3); for (let i = 0; i < f.length; i++) f[i] = im[i] / 255; const r = resizeArea(f, 3, 32, 24); for (let i = 0; i < r.length; i++) r[i] -= 0.5; return r; }
function prepChroma(im) { const ch = new Float32Array(32 * 32), f = new Float32Array(32 * 32 * 3); for (let p = 0; p < 1024; p++) { const a = im[p * 3] / 255, b = im[p * 3 + 1] / 255, c = im[p * 3 + 2] / 255; ch[p] = Math.max(a, b, c) - Math.min(a, b, c); f[p * 3] = a; f[p * 3 + 1] = b; f[p * 3 + 2] = c; }
  const cr = resizeArea(ch, 1, 32, 24), th = resizeArea(f, 3, 32, 8); const out = new Float32Array(576 + 192); for (let i = 0; i < 576; i++) out[i] = cr[i] - 0.3; for (let i = 0; i < 192; i++) out[576 + i] = th[i] - 0.5; return out; }
/* data */
function makeData(n, seed, unseen) { const r = rng(seed); const X = [], caps = [], lab = []; while (X.length < n) { const sh = V7.SHAPES[Math.floor(r() * 4)], c = V7.COLORS[Math.floor(r() * 4)], s = V7.SIZES[Math.floor(r() * 2)]; if (V7.HOLD.includes(sh + ' ' + c) !== !!unseen) continue; X.push(V7.sample(sh, c, s, r)); lab.push([sh, c, s]); caps.push(V7.fill(V7.TEMPL[Math.floor(r() * 4)], sh, c, s)); } return { X, caps, lab }; }
const WORDS = [...new Set(V7.TEMPL.join(' ').replace(/[{}]/g, ' ').split(/\s+/).filter(w => w && !['s', 'c', 'sh'].includes(w)).concat(V7.SHAPES, V7.COLORS, V7.SIZES, ['look', 'which'].slice(0, 0)))].sort();
const VOC = {}; WORDS.forEach((w, i) => VOC[w] = i + 1); const tok = s => s.toLowerCase().split(/\s+/).filter(Boolean).map(w => VOC[w] || 0);
/* the model */
function Model(opt) { const o = Object.assign({ din: 768, H: 96, d: 32, dw: 32, seed: 0, prep: 'chroma', bias: -5, scale: 10 }, opt); const r = rng(o.seed + 1); const nv = WORDS.length + 1; const g = (n, s) => Float32Array.from({ length: n }, () => randn(r) * s);
  this.o = o; this.p = { W1: g(o.din * o.H, Math.sqrt(2 / o.din)), b1: new Float32Array(o.H), W2: g(o.H * o.d, Math.sqrt(1 / o.H)), b2: new Float32Array(o.d), E: g(nv * o.dw, 0.1), W3: g(o.dw * o.d, Math.sqrt(1 / o.dw)), b3: new Float32Array(o.d), t: Float32Array.of(Math.log(o.scale)), bias: Float32Array.of(o.bias) };
  this.m = {}; this.v = {}; for (const k in this.p) { this.m[k] = new Float32Array(this.p[k].length); this.v[k] = new Float32Array(this.p[k].length); } this.k = 0; this.hist = []; }
Model.prototype.prepAll = function (X) { const f = this.o.prep === 'chroma' ? prepChroma : prepPix; return X.map(f); };
Model.prototype.img = function (xs, keep) { const { din, H, d } = this.o, P = this.p; const B = xs.length; const A = new Float32Array(B * H), Z = new Float32Array(B * d), U = new Float32Array(B * d), N = new Float32Array(B);
  for (let b = 0; b < B; b++) { const x = xs[b]; for (let j = 0; j < H; j++) A[b * H + j] = P.b1[j]; for (let i = 0; i < din; i++) { const xi = x[i]; if (xi === 0) continue; const row = i * H; for (let j = 0; j < H; j++) A[b * H + j] += xi * P.W1[row + j]; }
    for (let k = 0; k < d; k++) Z[b * d + k] = P.b2[k]; for (let j = 0; j < H; j++) { const h = A[b * H + j]; if (h <= 0) continue; for (let k = 0; k < d; k++) Z[b * d + k] += h * P.W2[j * d + k]; }
    let n = 0; for (let k = 0; k < d; k++) n += Z[b * d + k] ** 2; n = Math.sqrt(n) || 1; N[b] = n; for (let k = 0; k < d; k++) U[b * d + k] = Z[b * d + k] / n; } return keep ? { A, U, N } : U; };
Model.prototype.txt = function (caps, keep) { const { dw, d } = this.o, P = this.p; const B = caps.length; const Em = new Float32Array(B * dw), U = new Float32Array(B * d), N = new Float32Array(B), ids = caps.map(tok);
  for (let b = 0; b < B; b++) { const id = ids[b]; for (const t of id) for (let i = 0; i < dw; i++) Em[b * dw + i] += P.E[t * dw + i] / id.length; let n = 0; for (let k = 0; k < d; k++) { let z = P.b3[k]; for (let i = 0; i < dw; i++) z += Em[b * dw + i] * P.W3[i * d + k]; U[b * d + k] = z; n += z * z; } n = Math.sqrt(n) || 1; N[b] = n; for (let k = 0; k < d; k++) U[b * d + k] /= n; } return keep ? { Em, U, N, ids } : U; };
Model.prototype.step = function (xs, caps, kind, lr) { const { din, H, d, dw } = this.o, P = this.p, B = xs.length; const I = this.img(xs, true), T = this.txt(caps, true); const s = Math.exp(P.t[0]); const C = new Float32Array(B * B);
  for (let i = 0; i < B; i++) for (let j = 0; j < B; j++) { let c = 0; for (let k = 0; k < d; k++) c += I.U[i * d + k] * T.U[j * d + k]; C[i * B + j] = c; }
  const G = new Float32Array(B * B); let loss = 0, gb = 0;
  if (kind === 'sigmoid') { for (let i = 0; i < B; i++) for (let j = 0; j < B; j++) { const y = i === j ? 1 : -1, z = s * C[i * B + j] + P.bias[0]; const m = -y * z; loss += m > 0 ? m + Math.log1p(Math.exp(-m)) : Math.log1p(Math.exp(m)); const g = -y / (1 + Math.exp(y * z)) / B; G[i * B + j] = g; gb += g; } loss /= B; }
  else { for (let i = 0; i < B; i++) { let mx = -1e9; for (let j = 0; j < B; j++) mx = Math.max(mx, s * C[i * B + j]); let z = 0; for (let j = 0; j < B; j++) z += Math.exp(s * C[i * B + j] - mx); for (let j = 0; j < B; j++) { const p = Math.exp(s * C[i * B + j] - mx) / z; G[i * B + j] += (p - (i === j ? 1 : 0)) / (2 * B); if (i === j) loss -= Math.log(p + 1e-12) / (2 * B); } }
    for (let j = 0; j < B; j++) { let mx = -1e9; for (let i = 0; i < B; i++) mx = Math.max(mx, s * C[i * B + j]); let z = 0; for (let i = 0; i < B; i++) z += Math.exp(s * C[i * B + j] - mx); for (let i = 0; i < B; i++) { const p = Math.exp(s * C[i * B + j] - mx) / z; G[i * B + j] += (p - (i === j ? 1 : 0)) / (2 * B); if (i === j) loss -= Math.log(p + 1e-12) / (2 * B); } } }
  const g = {}; for (const k in P) g[k] = new Float32Array(P[k].length); let gt = 0; for (let q = 0; q < B * B; q++) gt += G[q] * C[q]; g.t[0] = gt * s; g.bias[0] = kind === 'sigmoid' ? gb : 0;
  const dU = new Float32Array(B * d), dV = new Float32Array(B * d); for (let i = 0; i < B; i++) for (let j = 0; j < B; j++) { const gg = s * G[i * B + j]; if (gg === 0) continue; for (let k = 0; k < d; k++) { dU[i * d + k] += gg * T.U[j * d + k]; dV[j * d + k] += gg * I.U[i * d + k]; } }
  const back = (U, N, dX, b) => { let dt = 0; for (let k = 0; k < d; k++) dt += U[b * d + k] * dX[b * d + k]; const out = new Float32Array(d); for (let k = 0; k < d; k++) out[k] = (dX[b * d + k] - U[b * d + k] * dt) / N[b]; return out; };
  for (let b = 0; b < B; b++) { const dz = back(I.U, I.N, dU, b); const da = new Float32Array(H); for (let j = 0; j < H; j++) { const h = I.A[b * H + j]; if (h <= 0) continue; let acc = 0; for (let k = 0; k < d; k++) { g.W2[j * d + k] += h * dz[k]; acc += dz[k] * P.W2[j * d + k]; } da[j] = acc; } for (let k = 0; k < d; k++) g.b2[k] += dz[k];
    const x = xs[b]; for (let i = 0; i < din; i++) { const xi = x[i]; if (xi === 0) continue; const row = i * H; for (let j = 0; j < H; j++) if (da[j] !== 0) g.W1[row + j] += xi * da[j]; } for (let j = 0; j < H; j++) g.b1[j] += da[j];
    const dzt = back(T.U, T.N, dV, b); const de = new Float32Array(dw); for (let i = 0; i < dw; i++) { const e = T.Em[b * dw + i]; let acc = 0; for (let k = 0; k < d; k++) { g.W3[i * d + k] += e * dzt[k]; acc += dzt[k] * P.W3[i * d + k]; } de[i] = acc; } for (let k = 0; k < d; k++) g.b3[k] += dzt[k]; const id = T.ids[b]; for (const t of id) for (let i = 0; i < dw; i++) g.E[t * dw + i] += de[i] / id.length; }
  this.k++; const b1 = 0.9, b2 = 0.999, c1 = 1 - b1 ** this.k, c2 = 1 - b2 ** this.k; for (const k in P) { const p = P[k], m = this.m[k], v = this.v[k], gk = g[k]; for (let i = 0; i < p.length; i++) { m[i] = b1 * m[i] + (1 - b1) * gk[i]; v[i] = b2 * v[i] + (1 - b2) * gk[i] * gk[i]; p[i] -= lr * (m[i] / c1) / (Math.sqrt(v[i] / c2) + 1e-8); } } P.t[0] = Math.min(P.t[0], Math.log(100));
  return { loss, C, s }; };
Model.prototype.classes = function () { const cl = []; V7.SHAPES.forEach(sh => V7.COLORS.forEach(c => V7.SIZES.forEach(s => cl.push([sh, c, s])))); return cl; };
Model.prototype.zeroshot = function (xs, lab, tmpl) { const cl = this.classes(); const T = this.txt(cl.map(([sh, c, s]) => V7.fill(tmpl || 'a {s} {c} {sh}', sh, c, s))); const U = this.img(xs); const d = this.o.d; const pred = []; for (let b = 0; b < xs.length; b++) { let best = -9, bi = 0; for (let q = 0; q < cl.length; q++) { let c = 0; for (let k = 0; k < d; k++) c += U[b * d + k] * T[q * d + k]; if (c > best) { best = c; bi = q; } } pred.push(cl[bi]); } const ok = pred.filter((p, i) => p.join() === lab[i].join()).length; return { acc: ok / xs.length, pred }; };
/* a trainer that runs in chunks, so the page stays responsive */
function trainAsync(model, data, opt, onTick, onDone) { const o = Object.assign({ epochs: 3, B: 128, kind: 'softmax', lr: 2e-3, seed: 0 }, opt); const xs = data.xs || (data.xs = model.prepAll(data.X)); const r = rng(o.seed + 99); let ep = 0, k = 0, idx = null, sum = 0, cnt = 0; let stop = false;
  const tick = () => { if (stop) return; const t0 = performance.now(); while (performance.now() - t0 < 40) { if (!idx || k + o.B > xs.length) { if (idx) { model.hist.push({ ep: model.hist.length, loss: sum / cnt, s: Math.exp(model.p.t[0]) }); ep++; sum = 0; cnt = 0; if (ep >= o.epochs) { onDone && onDone(); return; } } idx = [...Array(xs.length).keys()]; for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; } k = 0; }
      const j = idx.slice(k, k + o.B); k += o.B; const res = model.step(j.map(i => xs[i]), j.map(i => data.caps[i]), o.kind, o.lr); sum += res.loss; cnt++; model.last = res; model.steps = (model.steps || 0) + 1; }
    onTick && onTick(ep + k / xs.length); setTimeout(tick, 0); };
  setTimeout(tick, 0); return { stop: () => stop = true }; }
V7.TC = { Model, makeData, prepPix, prepChroma, trainAsync, WORDS, VOC, tok }; V7.state = V7.state || {};
})();

/* ===================================================================== chapter 3 */
(function () {
const W = window.W, V = window.V, el = V.el, D4 = window.D4; const { F, canvas, table, row, txt, rng } = D4; const V7 = window.VL7, T = V7.TC;
const paintF = (x, arr, C, S, X, Y, sc, off) => { for (let y = 0; y < S; y++) for (let xx = 0; xx < S; xx++) { const o = (y * S + xx) * C; const v = k => Math.max(0, Math.min(255, Math.round((arr[o + k] + off) * 255))); x.fillStyle = C === 3 ? 'rgb(' + v(0) + ',' + v(1) + ',' + v(2) + ')' : 'rgb(' + v(0) + ',' + v(0) + ',' + v(0) + ')'; x.fillRect(X + xx * sc, Y + y * sc, sc, sc); } };
/* a shared model, trained on demand (used by 3.2–3.5) */
V7.getModel = function (prep) { const st = V7.state; st.models = st.models || {}; return st.models[prep]; };
V7.trainShared = function (prep, opt, onTick, onDone) { const st = V7.state; st.models = st.models || {}; st.data = st.data || T.makeData(6000, 1); const key = prep + (opt.kind === 'sigmoid' ? '|sig' : ''); const m = new T.Model({ prep, din: prep === 'chroma' ? 768 : 1728, H: 64, seed: opt.seed || 0 }); st.models[key] = m; m.data = { X: st.data.X, caps: st.data.caps }; return T.trainAsync(m, m.data, Object.assign({ epochs: 15, lr: 3e-3 }, opt), onTick, () => { m.done = true; onDone && onDone(m); }); };

/* 3.1 — the data, and what each input sees */
W.w7_shapes_data = function (box) {
  V.say(box, 'כל אחד מ־32 הצירופים — צורה, צבע וגודל — מצויר כאן באותו מתכון כמו בקורס. מתחת לכל תמונה: מה רואה מגדל התמונה. <b>פיקסלים</b>: ‏24 על 24 בשלושה ערוצים — משולש אדום ומשולש כחול נראים לשכבה הראשונה כשני דברים שונים לגמרי. <b>רוויה</b> (פרק 4): מפת "כמה צבעוני" של 24 על 24, ותמונה זעירה של 8 על 8 — הצורה כמעט זהה בכל הצבעים.');
  let view = 0, seed = 2; V.tabs(box, ['התמונה', 'קלט פיקסלים (24×24×3)', 'קלט רוויה (24×24) + זעירה (8×8)'], k => { view = k; draw(); }); V.btns(box, [['🎲', () => { seed++; draw(); }]]);
  const cv = canvas(box, 760, 330, 760); const out = V.say(box);
  function draw() { const r = rng(seed); const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 330);
    V7.SHAPES.forEach((sh, i) => V7.COLORS.forEach((c, j) => { const s = (i + j) % 2 ? 'large' : 'small'; const X = 740 - (j + 1) * 180 + 10, Y = 10 + i * 80; const im = V7.sample(sh, c, s, r); const held = V7.HOLD.includes(sh + ' ' + c);
      if (view === 0) V7.paint(x, im, X, Y, 2); else if (view === 1) paintF(x, T.prepPix(im), 3, 24, X, Y, 2.66, 0.5); else { const p = T.prepChroma(im); paintF(x, p.slice(0, 576), 1, 24, X, Y, 2.66, 0.3); paintF(x, p.slice(576), 3, 8, X + 70, Y, 3, 0.5); }
      txt(x, V7.HEB[sh] + ' ' + V7.HEB[c], X + 150, Y + 30, held ? '#e03131' : '#495057', 11, 'right', held); if (held) txt(x, 'לא באימון', X + 150, Y + 46, '#e03131', 10, 'right'); }));
    out.innerHTML = view === 0 ? 'התמונות כמו בנתונים — 32 על 32, רקע רועש. ארבעת הצירופים באדום לא מופיעים באימון.' : view === 1 ? 'זה הקלט של מגדל התמונה בגרסת הפיקסלים: 1,728 מספרים. משולש אדום מדליק את הערוץ האדום, משולש כחול — את הכחול. <b>לשכבה הראשונה אין שום סיבה לחשוב שהם אותה צורה.</b>' : 'הקלט המפורק: מפת הרוויה (576) לא יודעת איזה צבע — רק <i>כמה</i> צבעוני; כל המשולשים נראים בה כמעט זהים. והתמונה הזעירה (192) נושאת את הצבע. 768 מספרים — וזה התיקון של פרק 4.'; }
  draw();
};

/* 3.2 — the text tower: tokens, a bag of words, and order */
W.w7_text_tower = function (box) {
  V.say(box, 'מגדל הטקסט של הקורס: כל מילה הופכת למספר (0 = לא מוכרת), כל מספר לשורה בטבלת שיכונים, ממוצע של השורות, שכבה ליניארית ונרמול. הקלד שני משפטים — והקוסינוס ביניהם מחושב כאן, במודל שאומן בסעיף 3.4 (אם אימנת) או במודל לא מאומן. נסה את תרגיל 3.3: אותן מילים בסדר אחר.');
  let a = 'a red circle and a blue square', b = 'a blue circle and a red square'; const r1 = row(box); const ia = el('input', { type: 'text', value: a, class: 'ltr', style: 'width:330px' }), ib = el('input', { type: 'text', value: b, class: 'ltr', style: 'width:330px' }); ia.oninput = () => { a = ia.value; draw(); }; ib.oninput = () => { b = ib.value; draw(); }; r1.appendChild(ia); r1.appendChild(ib);
  const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const m = V7.getModel('chroma') || V7.getModel('pixels') || (V7.state.fresh = V7.state.fresh || new T.Model({ prep: 'chroma', din: 768, H: 64 })); const ta = T.tok(a), tbk = T.tok(b); const va = m.txt([a]), vb = m.txt([b]); let c = 0; for (let k = 0; k < va.length; k++) c += va[k] * vb[k];
    tb.innerHTML = table(['', 'מספרי המילים', 'מילים לא מוכרות'], [['משפט 1', '<span class="ltr">[' + ta.join(', ') + ']</span>', a.split(/\s+/).filter((w, i) => w && ta[i] === 0).join(', ') || '—'], ['משפט 2', '<span class="ltr">[' + tbk.join(', ') + ']</span>', b.split(/\s+/).filter((w, i) => w && tbk[i] === 0).join(', ') || '—']]) + '<div class="note-small">אוצר המילים: ' + T.WORDS.length + ' מילים — ' + T.WORDS.join(', ') + '</div>';
    const same = [...ta].sort().join() === [...tbk].sort().join(); out.innerHTML = 'קוסינוס בין שני המשפטים: <b>' + F(c, 4) + '</b> ' + (m.done ? '(מודל מאומן)' : '(מודל <i>לא</i> מאומן — אמן בסעיף 3.4)') + '. ' + (same ? '<b>אותן מילים — אותו ממוצע — אותו וקטור בדיוק</b>, גם אם המשמעות הפוכה. מודל אמיתי משתמש ברובוטריק עם קידוד מיקום וקשב, שמקשר כל תואר לשם העצם שלו.' : 'מילים שונות. ושימו לב: "and" לא באוצר המילים — הופכת ל־0, ושורה 0 בטבלה משותפת לכל המילים הלא מוכרות.'); }
  draw();
};

/* 3.3 — the image tower: parameters, and what the first layer learned */
W.w7_image_tower = function (box) {
  V.say(box, 'מגדל התמונה של הקורס: קלט משוטח, שכבה נסתרת עם ReLU, שכבת יציאה ל־32 ממדים, נרמול. למעלה: כמה פרמטרים בכל חלק (תרגיל 3.1). למטה: 16 מהנוירונים של השכבה הראשונה במודל שאומן בסעיף 3.4 — כל אחד מוצג כתמונה של 24 על 24 של המשקלות שלו. בגרסת הפיקסלים תראו גלאים <b>צבעוניים</b>: גלאי שמגיב לצורה באדום לא מגיב לאותה צורה בכחול.');
  let H = 256, dout = 32, kind = 0; V.tabs(box, ['פיקסלים (1,728)', 'רוויה (768)'], k => { kind = k; draw(); }); const r1 = row(box); V.slider(r1, 'שכבה נסתרת', 16, 512, 16, H, v => { H = v; draw(); }); V.slider(r1, 'ממד יציאה', 8, 128, 8, dout, v => { dout = v; draw(); });
  const tb = el('div'); box.appendChild(tb); const cv = canvas(box, 760, 170, 760); const out = V.say(box);
  function draw() { const din = kind ? 768 : 1728; const p1 = din * H + H, p2 = H * dout + dout; tb.innerHTML = table(['חלק', 'חשבון', 'פרמטרים'], [['שכבה ראשונה', din.toLocaleString() + ' · ' + H + ' + ' + H, p1.toLocaleString()], ['שכבת יציאה', H + ' · ' + dout + ' + ' + dout, p2.toLocaleString()], ['<b>סך הכול</b>', '', '<b>' + (p1 + p2).toLocaleString() + '</b> — ' + F(100 * p1 / (p1 + p2), 1) + '% בשכבה הראשונה']]);
    const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 170); const m = V7.getModel(kind ? 'chroma' : 'pixels');
    if (!m || !m.done) { txt(x, 'אמן מודל ' + (kind ? 'רוויה' : 'פיקסלים') + ' בסעיף 3.4 כדי לראות את הגלאים', 380, 90, '#868e96', 13, 'center'); } else { const Hm = m.o.H; for (let n = 0; n < 16; n++) { const w = new Float32Array(kind ? 576 : 1728); for (let i = 0; i < w.length; i++) w[i] = m.p.W1[i * Hm + n]; let mx = 1e-9; w.forEach(v => mx = Math.max(mx, Math.abs(v))); const X = 740 - (n % 8 + 1) * 92, Y = 8 + Math.floor(n / 8) * 80; for (let y = 0; y < 24; y++) for (let xx = 0; xx < 24; xx++) { if (kind) { const v = w[y * 24 + xx] / mx; x.fillStyle = v > 0 ? 'rgb(255,' + Math.round(255 - 200 * v) + ',' + Math.round(255 - 200 * v) + ')' : 'rgb(' + Math.round(255 + 200 * v) + ',' + Math.round(255 + 200 * v) + ',255)'; } else { const o = (y * 24 + xx) * 3; const c = k => Math.round(128 + 127 * w[o + k] / mx); x.fillStyle = 'rgb(' + c(0) + ',' + c(1) + ',' + c(2) + ')'; } x.fillRect(X + xx * 3, Y + y * 3, 3, 3); } } }
    out.innerHTML = 'כמעט כל הפרמטרים בשכבה הראשונה — שם המודל מחליט <i>איך</i> לראות. ' + (kind ? 'במודל הרוויה הגלאים הם של צורה בלבד (אדום = חיובי, כחול = שלילי) — אין להם צבע לבחור.' : 'במודל הפיקסלים כל גלאי הוא תמונה צבעונית: הוא לומד "צורה בצבע מסוים" — ולכן לצירוף שלא ראה אין לו גלאי (פרק 4).'); }
  draw();
};

/* 3.4 — the training loop, live */
W.w7_train_loop = function (box) {
  V.say(box, 'מודל ניגודי זעיר <b>מתאמן כאן</b>, בדפדפן — אותה לולאה כמו בקוד של הסעיף: ערבוב, מנות, ההפסד והנגזרות ביד, וצעד Adam. 6,000 תמונות (בקורס 20,000), שכבה נסתרת של 64 (בקורס 256), 15 סבבים. הגרף: ההפסד בכל צעד, וקנה המידה; הקו המקווקו — רצפת הכפילויות (פרק 2). מימין — מטריצת הקוסינוסים של המנה האחרונה. המודל נשמר לשימוש בסעיפים 3.2, 3.3, 3.5 ובפרק 4.');
  let prep = 'chroma', kind = 'softmax', B = 128, job = null; const r1 = row(box); V.tabs(r1, ['קלט רוויה (מהיר)', 'קלט פיקסלים (איטי פי 2)'], k => { prep = k ? 'pixels' : 'chroma'; }); V.tabs(r1, ['הפסד ניגודי', 'הפסד סיגמואידי (פרק 5)'], k => { kind = k ? 'sigmoid' : 'softmax'; }); V.slider(r1, 'מנה', 16, 256, 16, B, v => { B = v; });
  V.btns(box, [['▶ אמן 15 סבבים', () => start(), 'primary'], ['■ עצור', () => { if (job) job.stop(); }]]);
  const cv = canvas(box, 760, 230, 760); const out = V.say(box); const losses = [];
  function start() { if (job) job.stop(); losses.length = 0; out.innerHTML = 'מתאמן...'; const key = prep + (kind === 'sigmoid' ? '|sig' : ''); job = V7.trainShared(prep, { kind, B, epochs: 15 }, ep => { const m = V7.getModel(key); if (m.last) losses.push([m.steps, m.last.loss, m.last.s]); draw(m, ep); }, m => { draw(m, 15); const S = T.makeData(300, 2), U = T.makeData(300, 3, true); const a = m.zeroshot(m.prepAll(S.X), S.lab).acc, b = m.zeroshot(m.prepAll(U.X), U.lab).acc; m.acc = [a, b]; out.innerHTML = 'סיום: הפסד ' + F(m.hist[m.hist.length - 1].loss, 3) + ', קנה מידה ' + F(m.hist[m.hist.length - 1].s, 1) + '. סיווג ללא דוגמאות (פרק 4): <b>' + F(100 * a, 1) + '%</b> על צירופים שנראו, <b>' + F(100 * b, 1) + '%</b> על צירופים שלא נראו. ' + (prep === 'pixels' ? 'שימו לב לפער — זה הכישלון של פרק 4.' : 'הקלט המפורק מכליל גם לצירופים שלא ראה.') + ' המודל נשמר לסעיפים הבאים.'; }); }
  function draw(m, ep) { const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 230); const X0 = 220, Wd = 520; if (!losses.length) return; const n = losses.length; const ym = Math.max(5, ...losses.map(l => l[1])); const X = i => X0 + i / Math.max(n - 1, 1) * Wd, Y = v => 200 - v / ym * 180;
    const fl = Math.log(B / 24); x.strokeStyle = '#e03131'; x.setLineDash([5, 4]); x.beginPath(); x.moveTo(X0, Y(fl)); x.lineTo(X0 + Wd, Y(fl)); x.stroke(); x.setLineDash([]); if (kind === 'softmax') txt(x, 'רצפה ≈ ln(' + B + '/24) = ' + F(fl, 2), X0 + Wd, Y(fl) - 4, '#e03131', 10, 'right');
    x.strokeStyle = '#1c7ed6'; x.beginPath(); losses.forEach((l, i) => i ? x.lineTo(X(i), Y(l[1])) : x.moveTo(X(i), Y(l[1]))); x.stroke(); x.strokeStyle = '#2f9e44'; x.beginPath(); losses.forEach((l, i) => i ? x.lineTo(X(i), 200 - l[2] / 40 * 180) : x.moveTo(X(i), 200 - l[2] / 40 * 180)); x.stroke(); txt(x, 'הפסד (כחול) · קנה מידה (ירוק, 0–40) · סבב ' + F(ep, 1) + ' מתוך 15', X0 + Wd, 14, '#495057', 10, 'right');
    if (m.last) { const C = m.last.C, Bq = Math.round(Math.sqrt(C.length)), k = Math.min(Bq, 32), cs = 190 / k; for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) { x.fillStyle = V7.heat(C[i * Bq + j]); x.fillRect(10 + j * cs, 20 + i * cs, cs, cs); } txt(x, 'קוסינוסים, ' + k + ' זוגות ראשונים', 105, 14, '#495057', 10, 'center'); } }
};

/* 3.5 — the loss is stuck; is the model? */
W.w7_loss_floor = function (box) {
  V.say(box, 'ההפסד נתקע מעל אפס — האם המודל נתקע? שלוש מדידות על מנה חדשה של 128, עם המודל שאומן בסעיף 3.4: ההפסד כמו שהוא; ההפסד אחרי <b>הסרת כפילויות</b> (משאירים צירוף אחד מכל סוג, כך שאין שליליים מדומים); ו<b>דיוק אחזור</b> — האם כל תמונה מוצאת כיתוב של הצירוף שלה בין 1 / 5 הראשונים.');
  V.btns(box, [['מדוד', () => draw(), 'primary']]); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const m = V7.getModel('chroma') || V7.getModel('pixels'); if (!m || !m.done) { out.innerHTML = 'אמן קודם מודל בסעיף 3.4 (15 סבבים, כחצי דקה).'; return; } const D = T.makeData(128, 77); const xs = m.prepAll(D.X); const loss = (idx) => { const U = m.img(idx.map(i => xs[i])), Vt = m.txt(idx.map(i => D.caps[i])); const B = idx.length, d = m.o.d, s = Math.exp(m.p.t[0]); let L = 0; for (let i = 0; i < B; i++) { const row = []; for (let j = 0; j < B; j++) { let c = 0; for (let k = 0; k < d; k++) c += U[i * d + k] * Vt[j * d + k]; row.push(s * c); } const mx = Math.max(...row); const z = row.reduce((a, v) => a + Math.exp(v - mx), 0); L -= row[i] - mx - Math.log(z); } return L / B; };
    const all = [...Array(128).keys()]; const seen = {}, uniq = all.filter(i => { const k = D.lab[i].join(); if (seen[k]) return false; seen[k] = 1; return true; });
    const U = m.img(xs), Vt = m.txt(D.caps), d = m.o.d; let r1 = 0, r5 = 0; for (let i = 0; i < 128; i++) { const sc = all.map(j => { let c = 0; for (let k = 0; k < d; k++) c += U[i * d + k] * Vt[j * d + k]; return [c, j]; }).sort((a, b) => b[0] - a[0]); const ok = j => D.lab[j].join() === D.lab[i].join(); if (ok(sc[0][1])) r1++; if (sc.slice(0, 5).some(q => ok(q[1]))) r5++; }
    tb.innerHTML = table(['מדידה', 'ערך'], [['הפסד על המנה (128, עם כפילויות)', F(loss(all), 3)], ['רצפת הכפילויות במנה הזו', F(Object.values(D.lab.reduce((a, l) => (a[l.join()] = (a[l.join()] || 0) + 1, a), {})).reduce((s, n) => s + n * Math.log(n), 0) / 128, 3)], ['הפסד אחרי הסרת כפילויות (' + uniq.length + ' זוגות)', '<b>' + F(loss(uniq), 3) + '</b>'], ['אחזור: הכיתוב הראשון מהצירוף הנכון', F(100 * r1 / 128, 1) + '%'], ['אחזור: בין חמשת הראשונים', F(100 * r5 / 128, 1) + '%']]);
    out.innerHTML = 'ההפסד על המנה קרוב לרצפה — אבל כשמסירים כפילויות הוא <b>צונח</b>, והאחזור גבוה. המודל לא תקוע: ההפסד "תקוע" כי אין לו דרך לדעת איזה מבין חמשת הכיתובים הזהים שייך לאיזו תמונה. <b>ערך ההפסד לבדו לא אומר אם המודל טוב</b> — מודדים אחזור (שאלת הראיון).'; }
};
})();

/* ===================================================================== chapter 4 */
(function () {
const W = window.W, V = window.V, el = V.el, D4 = window.D4; const { F, canvas, table, row, txt, rng } = D4; const V7 = window.VL7, T = V7.TC;
/* make sure a trained model exists; report progress into `out` */
V7.ensure = function (key, out, done) { const prep = key.split('|')[0], sg = key.includes('|sig'); const nm = (prep === 'chroma' ? 'רוויה' : 'פיקסלים') + (sg ? ', סיגמואידי' : ''); const m = V7.getModel(key); if (m && m.done) return done(m); if (m && !m.done) { out.innerHTML = 'מודל ' + nm + ' עדיין מתאמן...'; const iv = setInterval(() => { if (m.done) { clearInterval(iv); done(m); } }, 500); return; }
  out.innerHTML = 'מאמן מודל ' + nm + ' (15 סבבים, ' + (prep === 'chroma' ? 'כחצי דקה' : 'כדקה') + ')...'; V7.trainShared(prep, { epochs: 15, kind: sg ? 'sigmoid' : 'softmax' }, ep => { out.innerHTML = 'מאמן מודל ' + nm + ': סבב ' + F(ep, 1) + ' מתוך 15'; }, done); };
V7.testSets = function () { const st = V7.state; if (!st.tests) st.tests = { S: T.makeData(400, 2), U: T.makeData(400, 3, true) }; return st.tests; };
const pct = v => F(100 * v, 1) + '%';

/* 4.1 — zero-shot: the class matrix is computed from text */
W.w7_zeroshot = function (box) {
  V.say(box, 'סיווג ללא דוגמאות, כמו בקוד של הסעיף: משפט לכל אחת מ־32 המחלקות, קידוד במגדל הטקסט — וזו המטריצה של המסווג. בחר תמונה (כולל צירופים שלא באימון): הפסים הם הקוסינוסים מול כל המחלקות, במודל הרוויה שאומן בדפדפן. ומתג של ארבעה נוסחים ממוצעים במקום אחד (שאלת הראיון).');
  let sh = 'triangle', c = 'blue', s = 'large', ens = false, seed = 1; const r1 = row(box); const sel = (opts, cur, f) => { const e = el('select'); opts.forEach(o => e.appendChild(el('option', { value: o, html: V7.HEB[o] }))); e.value = cur; e.onchange = () => { f(e.value); draw(); }; r1.appendChild(e); }; sel(V7.SHAPES, sh, v => sh = v); sel(V7.COLORS, c, v => c = v); sel(V7.SIZES, s, v => s = v);
  V.btns(r1, [['🎲 תמונה אחרת', () => { seed++; draw(); }]]); const ck = el('label', { html: ' <input type="checkbox"> ארבעה נוסחים, ממוצע' }); ck.querySelector('input').onchange = e => { ens = e.target.checked; draw(); }; r1.appendChild(ck);
  const cv = canvas(box, 760, 260, 760); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function textMat(m) { const cl = m.classes(); const tmpls = ens ? V7.TEMPL : ['a {s} {c} {sh}']; const d = m.o.d; const M = new Float32Array(cl.length * d); tmpls.forEach(t => { const Tm = m.txt(cl.map(([a, b, e]) => V7.fill(t, a, b, e))); for (let i = 0; i < M.length; i++) M[i] += Tm[i]; }); for (let q = 0; q < cl.length; q++) { let n = 0; for (let k = 0; k < d; k++) n += M[q * d + k] ** 2; n = Math.sqrt(n); for (let k = 0; k < d; k++) M[q * d + k] /= n; } return { cl, M }; }
  function draw() { V7.ensure('chroma', out, m => { const { cl, M } = textMat(m); const im = V7.sample(sh, c, s, rng(seed)); const u = m.img([T.prepChroma(im)]); const d = m.o.d; const sc = cl.map((_, q) => { let v = 0; for (let k = 0; k < d; k++) v += u[k] * M[q * d + k]; return v; });
    const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 260); V7.paint(x, im, 680, 10, 2); const best = sc.indexOf(Math.max(...sc)); const mn = Math.min(...sc), mx = Math.max(...sc);
    cl.forEach((k, q) => { const X = 650 - (q + 1) * 20, h = (sc[q] - mn) / (mx - mn + 1e-9) * 170; const held = V7.HOLD.includes(k[0] + ' ' + k[1]); x.fillStyle = q === best ? '#2f9e44' : held ? '#ffa8a8' : '#74c0fc'; x.fillRect(X, 200 - h, 16, h); if (k[0] === sh && k[1] === c && k[2] === s) { x.strokeStyle = '#212529'; x.lineWidth = 2; x.strokeRect(X - 1, 200 - h - 1, 18, h + 2); x.lineWidth = 1; } x.save(); x.translate(X + 11, 206); x.rotate(-Math.PI / 2); x.fillStyle = '#495057'; x.font = '9px sans-serif'; x.textAlign = 'right'; x.fillText(V7.HEB[k[0]] + ' ' + V7.HEB[k[1]] + ' ' + V7.HEB[k[2]], 0, 0); x.restore(); });
    txt(x, 'ירוק — הנבחר · ורוד — מחלקה שלא באימון · מסגרת — התשובה הנכונה', 650, 14, '#495057', 10, 'right');
    const { S, U } = V7.testSets(); const acc = (D) => { const xs = m.prepAll(D.X); const Ui = m.img(xs); let ok = 0; for (let b = 0; b < xs.length; b++) { let bi = 0, bv = -9; for (let q = 0; q < cl.length; q++) { let v = 0; for (let k = 0; k < d; k++) v += Ui[b * d + k] * M[q * d + k]; if (v > bv) { bv = v; bi = q; } } if (cl[bi].join() === D.lab[b].join()) ok++; } return ok / xs.length; };
    const a = acc(S), b = acc(U); tb.innerHTML = table(['', 'צירופים שנראו', 'צירופים שלא נראו'], [['דיוק על 400 תמונות (' + (ens ? 'ארבעה נוסחים' : 'נוסח אחד') + ')', pct(a), pct(b)]]);
    out.innerHTML = 'הנבחר: <b>' + cl[best].map(w => V7.HEB[w]).join(' ') + '</b> ' + (cl[best].join() === [sh, c, s].join() ? '— נכון.' : '— <b>טעות</b>.') + ' המטריצה <span class="ltr">T</span> היא בדיוק המשקלות של מסווג סגור, רק שחושבה מטקסט — פעם אחת, ואפשר לשמור. ' + (ens ? 'עם ארבעה נוסחים — בקורס זה <i>הוריד</i> את הדיוק (94.0% ← 89.6%), כי נוסח אחד היה חלש. תמיד מודדים.' : ''); }); }
  draw();
};

/* 4.2 — the first experiment: raw pixels */
W.w7_pixels_fail = function (box) {
  V.say(box, 'מודל הפיקסלים, מאומן בדפדפן (אם לא אומן בסעיף 3.4 — הוא יתאמן עכשיו, כדקה). ואז הטבלה של הסעיף: דיוק על צירופים שנראו ושלא נראו, ושני מבחנים חלקיים — "רק צבע" (משפט כמו "a blue") ו"רק צורה" ("a triangle"). ולמטה: לאן הולכים המשולשים הכחולים.');
  V.btns(box, [['הרץ', () => draw(), 'primary']]); const tb = el('div'); box.appendChild(tb); const cv = canvas(box, 760, 150, 760); const out = V.say(box); out.innerHTML = 'לחץ "הרץ".';
  function draw() { V7.ensure('pixels', out, m => { const { S, U } = V7.testSets(); const d = m.o.d; const xsU = m.prepAll(U.X); const Ui = m.img(xsU);
    const part = (words, key) => { const Tm = m.txt(words.map(w => 'a ' + w)); let ok = 0; for (let b = 0; b < xsU.length; b++) { let bi = 0, bv = -9; for (let q = 0; q < words.length; q++) { let v = 0; for (let k = 0; k < d; k++) v += Ui[b * d + k] * Tm[q * d + k]; if (v > bv) { bv = v; bi = q; } } if (words[bi] === U.lab[b][key]) ok++; } return ok / xsU.length; };
    const a = m.zeroshot(m.prepAll(S.X), S.lab).acc, zb = m.zeroshot(xsU, U.lab); const pc = part(V7.COLORS, 1), ps = part(V7.SHAPES, 0);
    tb.innerHTML = table(['מדד', 'כאן', 'בקורס'], [['דיוק על צירופים שנראו', pct(a), '98.1%'], ['דיוק על צירופים שלא נראו', '<b>' + pct(zb.acc) + '</b>', '<b>3.2%</b>'], ['רק צבע, על צירופים שלא נראו', pct(pc), '100%'], ['רק צורה, על צירופים שלא נראו', pct(ps), '16.1%']]);
    const cnt = {}; let n = 0; U.lab.forEach((l, i) => { if (l[0] === 'triangle' && l[1] === 'blue') { n++; const p = zb.pred[i]; const k = p[0] + ' ' + p[1]; cnt[k] = (cnt[k] || 0) + 1; } }); const ent = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
    const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 150); ent.slice(0, 6).forEach(([k, v], i) => { const [s1, c1] = k.split(' '); const w = v / n * 600; x.fillStyle = k === 'triangle blue' ? '#2f9e44' : '#ffa8a8'; x.fillRect(740 - w, 10 + i * 22, w, 18); txt(x, V7.HEB[s1] + ' ' + V7.HEB[c1] + ': ' + v, 735 - w, 24 + i * 22, '#212529', 11, 'right'); });
    out.innerHTML = 'מתוך ' + n + ' משולשים כחולים: ' + ent.map(([k, v]) => V7.HEB[k.split(' ')[0]] + ' ' + V7.HEB[k.split(' ')[1]] + ' — ' + v).join(', ') + '. <b>הצבע נכון כמעט תמיד; הצורה הולכת לאיבוד.</b> השכבה הראשונה רואה שלושה ערוצי צבע נפרדים: גלאי "משולש אדום" ו"משולש ירוק" מורידים את ההפסד בדיוק כמו גלאי "משולש" כללי — ולמשולש כחול אין לו גלאי.'; }); }
};

/* 4.3 — the fix: split the input into shape and color */
W.w7_saturation = function (box) {
  V.say(box, 'אותו אימון, שני קלטים: פיקסלים, ורוויה עם תמונה זעירה. שני המודלים מאומנים בדפדפן (אם עוד לא) — כדקה וחצי יחד. הטבלה של הסעיף, עם עמודה של נוסח שלא הופיע באימון כלל: "look a blue triangle which is large" — שתי מילים שהמודל לא מכיר.');
  V.btns(box, [['הרץ את שני המודלים', () => run(), 'primary']]); const tb = el('div'); box.appendChild(tb); const out = V.say(box); out.innerHTML = 'לחץ "הרץ".';
  function evalModel(m) { const { S, U } = V7.testSets(); const d = m.o.d; const xsU = m.prepAll(U.X), Ui = m.img(xsU); const shape = (() => { const Tm = m.txt(V7.SHAPES.map(w => 'a ' + w)); let ok = 0; for (let b = 0; b < xsU.length; b++) { let bi = 0, bv = -9; for (let q = 0; q < 4; q++) { let v = 0; for (let k = 0; k < d; k++) v += Ui[b * d + k] * Tm[q * d + k]; if (v > bv) { bv = v; bi = q; } } if (V7.SHAPES[bi] === U.lab[b][0]) ok++; } return ok / xsU.length; })();
    return [m.zeroshot(m.prepAll(S.X), S.lab).acc, m.zeroshot(xsU, U.lab).acc, shape, m.zeroshot(xsU, U.lab, 'look a {c} {sh} which is {s}').acc]; }
  function run() { V7.ensure('pixels', out, mp => V7.ensure('chroma', out, mc => { const a = evalModel(mp), b = evalModel(mc);
    tb.innerHTML = table(['קלט', 'שנראו', 'שלא נראו', 'רק צורה, שלא נראו', 'נוסח שלא נראה'], [['פיקסלים — כאן', ...a.map(pct)], ['רוויה ותמונה זעירה — כאן', ...b.map((v, i) => i === 1 ? '<b>' + pct(v) + '</b>' : pct(v))], ['פיקסלים — בקורס', '98.1%', '3.2%', '16.1%', '17.1%'], ['רוויה — בקורס', '100%', '<b>94.0%</b>', '99.0%', '94.1%']]);
    out.innerHTML = 'אותו אימון, אותו מספר סבבים — ההבדל היחיד הוא <b>הייצוג של הקלט</b>. במפת הרוויה משולש כחול ומשולש אדום כמעט זהים, אז גלאי משולש אחד משרת את כולם; והצבע מגיע מהתמונה הזעירה. המודל בדפדפן קטן יותר ומאומן על פחות נתונים, אז המספרים נמוכים מהקורס — אבל הכיוון זהה: בצירופים שלא נראו, כמעט אפס מול רוב התמונות. ובנוסח שלא נראה, "look" ו־"which" הופכות ל־0 — ושק המילים פשוט מתעלם מהן.'; })); }
};

/* 4.4 — where an open model is most likely to fail: check before trusting */
W.w7_composition = function (box) {
  V.say(box, 'לפני שסומכים על מודל פתוח — בודקים אותו לפי צירוף. המפה: הדיוק של סיווג ללא דוגמאות לכל צירוף של צורה וצבע, במודל שבחרת (מאומן בדפדפן). המסגרות האדומות — הצירופים שלא באימון. ולמטה, הבעיה של שק מילים עם שני עצמים במשפט.');
  let prep = 'pixels'; V.tabs(box, ['מודל פיקסלים', 'מודל רוויה'], k => { prep = k ? 'chroma' : 'pixels'; draw(); }); const cv = canvas(box, 760, 190, 760); const out = V.say(box);
  function draw() { V7.ensure(prep, out, m => { const D = V7.state.compSet || (V7.state.compSet = (() => { const A = T.makeData(600, 4), B = T.makeData(300, 5, true); return { X: A.X.concat(B.X), lab: A.lab.concat(B.lab) }; })()); const z = m.zeroshot(m.prepAll(D.X), D.lab); const acc = {}; D.lab.forEach((l, i) => { const k = l[0] + ' ' + l[1]; acc[k] = acc[k] || [0, 0]; acc[k][1]++; if (z.pred[i].join() === l.join()) acc[k][0]++; });
    const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 190); V7.SHAPES.forEach((sh, i) => V7.COLORS.forEach((c, j) => { const k = sh + ' ' + c, a = acc[k] ? acc[k][0] / acc[k][1] : 0; const X = 600 - j * 110, Y = 10 + i * 42; x.fillStyle = 'rgb(' + Math.round(255 - 180 * a) + ',' + Math.round(200 + 55 * a) + ',' + Math.round(255 - 180 * a) + ')'; x.fillRect(X, Y, 104, 36); if (V7.HOLD.includes(k)) { x.strokeStyle = '#e03131'; x.lineWidth = 3; x.strokeRect(X + 1, Y + 1, 102, 34); x.lineWidth = 1; } txt(x, V7.HEB[sh] + ' ' + V7.HEB[c], X + 52, Y + 15, '#212529', 10, 'center'); txt(x, pct(a), X + 52, Y + 30, '#212529', 11, 'center', true); }));
    const v1 = m.txt(['a white horse near a black car']), v2 = m.txt(['a black horse near a white car']); let cs = 0; for (let k = 0; k < m.o.d; k++) cs += v1[k] * v2[k];
    out.innerHTML = (prep === 'pixels' ? 'במודל הפיקסלים — <b>כל המשבצות האדומות כמעט ריקות</b>, וכל השאר מלאות. מדד ממוצע על כל הנתונים היה נראה מצוין.' : 'במודל הרוויה הצירופים החדשים כמעט כמו הישנים — המודל למד צורה וצבע בנפרד.') + ' ושני משפטים עם אותן מילים בסדר אחר: קוסינוס <b>' + F(cs, 4) + '</b> — מבחינת שק מילים, "סוס לבן ליד מכונית שחורה" ו"סוס שחור ליד מכונית לבנה" הם אותו דבר. גם CLIP אמיתי מתקשה בזה. <b>תיאור שמשלב שני מושגים נדירים יחד הוא המקום שבו מודל פתוח הכי צפוי להיכשל</b> — ובודקים אותו על דוגמאות כאלה לפני שסומכים עליו.'; }); }
  draw();
};
})();

/* ===================================================================== chapter 5 */
(function () {
const W = window.W, V = window.V, el = V.el, D4 = window.D4; const { F, canvas, table, row, txt, rng, randn } = D4; const V7 = window.VL7, T = V7.TC; const { nrm, dot, heat } = V7;
const sig = z => 1 / (1 + Math.exp(-z)); const softplus = z => z > 0 ? z + Math.log1p(Math.exp(-z)) : Math.log1p(Math.exp(z));

/* 5.1 — the sigmoid loss, computed here */
W.w7_sigmoid_loss = function (box) {
  V.say(box, 'אותה מטריצת ציונים של פרק 2, ופרמטר נוסף — הטיה b. כל תא הוא שאלת כן־או־לא עצמאית: <span class="ltr">σ(s · cos + b)</span>, ‏1 על האלכסון ו־0 בכל השאר. ההפסד מחושב כאן כמו בקוד של הסעיף. מימין — ההסתברות בכל תא; למטה — מאיזה קוסינוס ההסתברות עוברת חצי (תרגיל 5.2).');
  let st = 1, s = 10, b = -10, B = 4; V.tabs(box, ['אקראי', 'התאמה מושלמת', 'זוגות זהים'], k => { st = k; draw(); }, 1); const r1 = row(box); V.slider(r1, 'קנה מידה s', 1, 30, 0.1, s, v => { s = v; draw(); }); V.slider(r1, 'הטיה b', -15, 5, 0.1, b, v => { b = v; draw(); }); V.slider(r1, 'B', 2, 16, 1, B, v => { B = v; draw(); });
  V.btns(box, [['הטבלה של הקורס: s = 10, b = −10', () => { s = 10; b = -10; draw(); }], ['b = −5', () => { s = 10; b = -5; draw(); }], ['הערכים שהמודל למד בקורס: 15.6, −5.31', () => { s = 15.6; b = -5.31; draw(); }]]);
  const cv = canvas(box, 760, 240, 760); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const r = rng(5 + B); const rnd = () => nrm([...Array(32)].map(() => randn(r))); let U, Vt; if (st === 0) { U = [...Array(B)].map(rnd); Vt = [...Array(B)].map(rnd); } else { const base = [...Array(B)].map(rnd); if (st === 2) for (let i = 1; i < B; i++) base[i] = base[0]; U = base; Vt = base; }
    const C = U.map(u => Vt.map(v => dot(u, v))); let L = 0, pos = 0, neg = 0; const P = C.map((rw, i) => rw.map((c, j) => { const z = s * c + b, y = i === j ? 1 : -1; const l = softplus(-y * z); L += l; if (i === j) pos += l; else neg += l; return sig(z); })); L /= B;
    const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 240); const cs = Math.min(50, 210 / B); P.forEach((rw, i) => rw.forEach((p, j) => { x.fillStyle = 'rgb(' + Math.round(255 - 200 * p) + ',' + Math.round(255 - 120 * p) + ',255)'; x.fillRect(450 + j * cs, 30 + i * cs, cs - 1, cs - 1); if (B <= 6) txt(x, F(p, p < 0.01 ? 4 : 3), 450 + j * cs + cs / 2, 30 + i * cs + cs / 2 + 4, '#212529', 11, 'center'); })); txt(x, 'הסתברות "זוג" בכל תא', 450 + B * cs / 2, 20, '#495057', 11, 'center', true);
    const X = c => 40 + (c + 1) / 2 * 340, Y = p => 200 - p * 160; x.strokeStyle = '#adb5bd'; x.strokeRect(40, 40, 340, 160); x.strokeStyle = '#1c7ed6'; x.lineWidth = 2; x.beginPath(); for (let c = -1; c <= 1.0001; c += 0.02) { c > -1 ? x.lineTo(X(c), Y(sig(s * c + b))) : x.moveTo(X(c), Y(sig(s * c + b))); } x.stroke(); x.lineWidth = 1; const c0 = -b / s; if (c0 >= -1 && c0 <= 1) { x.strokeStyle = '#e03131'; x.setLineDash([4, 3]); x.beginPath(); x.moveTo(X(c0), 40); x.lineTo(X(c0), 200); x.stroke(); x.setLineDash([]); } txt(x, 'הסתברות לפי קוסינוס', 210, 30, '#495057', 11, 'center', true); txt(x, '−1', 40, 214, '#868e96', 10, 'center'); txt(x, '1', 380, 214, '#868e96', 10, 'center');
    tb.innerHTML = table(['ההפסד', 'מהאלכסון', 'מהשליליים', 'חצי — מקוסינוס'], [['<b>' + F(L, 3) + '</b>', F(pos / B, 3), F(neg / B, 3), c0 > 1 ? 'אף פעם (יותר מ־1)' : F(c0, 3)]]);
    out.innerHTML = (st === 1 && Math.abs(b + 10) < 0.05 && Math.abs(s - 10) < 0.05 ? 'התאמה מושלמת עם s = 10 ו־b = −10: זוג מושלם (קוסינוס 1) מקבל ציון 0 — הסתברות חצי בלבד (בקורס: 0.694). המודל ידחוף את s למעלה או את b. ' : '') + (st === 2 ? 'זוגות זהים: כל התאים שווים — המודל יכול רק לתת לכולם אותה הסתברות (תרגיל 5.3). ' : '') + 'ההטיה מתחילה שלילית בכוונה: במנה יש B חיוביים וכמעט B² שליליים, וההתחלה "כמעט הכול לא" קרובה למצב האמיתי. וההסתברות עוברת חצי בקוסינוס <span class="ltr">−b/s</span> = ' + F(c0, 3) + (Math.abs(s - 15.6) < 0.05 ? ' — בדיוק סביב הציונים 0.23–0.43 של פרק 6.' : '.'); }
  draw();
};

/* 5.2 — what we gain: an absolute score, no communication, softer false negatives */
W.w7_sig_vs_soft = function (box) {
  V.say(box, 'שלושה יתרונות של ההפסד הסיגמואידי, כל אחד בחישוב. בחר.');
  let k = 0, match = true, dev = 8, Bd = 1024, dup = 5; V.tabs(box, ['ציון מוחלט', 'בלי תקשורת בין כרטיסים', 'שליליים מדומים'], i => { k = i; draw(); }); const r1 = row(box); const c1 = el('label', { html: '<input type="checkbox" checked> ברשימה יש משפט שמתאים לתמונה' }); c1.querySelector('input').onchange = e => { match = e.target.checked; draw(); }; r1.appendChild(c1); V.slider(r1, 'כרטיסים', 1, 64, 1, dev, v => { dev = v; draw(); }); V.slider(r1, 'מנה לכרטיס', 128, 8192, 128, Bd, v => { Bd = v; draw(); }); V.slider(r1, 'כפילויות של הזוג', 1, 10, 1, dup, v => { dup = v; draw(); });
  const cv = canvas(box, 760, 190, 760); const out = V.say(box);
  function draw() { const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 190);
    if (k === 0) { const names = ['a blue triangle', 'a red circle', 'a yellow cross', 'a green square']; const cosv = match ? [0.42, 0.08, 0.05, 0.11] : [0.12, 0.08, 0.05, 0.11]; const s = 15.6, b = -5.31; const z = cosv.map(c => s * c); const mx = Math.max(...z); const e = z.map(v => Math.exp(v - mx)); const sm = e.reduce((a, v) => a + v); const pS = e.map(v => v / sm), pG = cosv.map(c => sig(s * c + b));
      names.forEach((n, i) => { const Y = 20 + i * 40; txt(x, n + ' (קוסינוס ' + F(cosv[i], 2) + ')', 750, Y + 16, '#212529', 11, 'right'); x.fillStyle = '#74c0fc'; x.fillRect(560 - pS[i] * 220, Y, pS[i] * 220, 14); txt(x, F(pS[i], 2), 555 - pS[i] * 220, Y + 12, '#1c7ed6', 10, 'right'); x.fillStyle = '#b197fc'; x.fillRect(560 - pG[i] * 220, Y + 16, pG[i] * 220, 14); txt(x, F(pG[i], 2), 555 - pG[i] * 220, Y + 28, '#7048e8', 10, 'right'); });
      txt(x, 'כחול — סיווג על השורה · סגול — סיגמואיד לכל זוג', 330, 180, '#495057', 10, 'center');
      out.innerHTML = match ? 'כשיש משפט מתאים, שני הסוגים בוחרים בו. אבל הסיווג על השורה תמיד מסתכם ל־1 — הוא אומר רק "יחסית לשאר".' : '<b>אין אף משפט מתאים</b> — והסיווג על השורה עדיין נותן לאחד מהם הסתברות גבוהה, כי הוא חייב לבחור. הסיגמואיד נותן לכולם נמוך: "אין כאן אף אחד מהם". זה מה שמאפשר סף והתראה בפרק 6.'; }
    if (k === 1) { const Btot = dev * Bd, d = 768, bytes = 2; const gather = (dev - 1) * Bd * d * bytes / 1e6; const full = Bd * Btot * 4 / 1e6; const chunk = Bd * Bd * 4 / 1e6; [['ניגודי: כל כרטיס אוסף את כל שיכוני הטקסט', gather, full], ['סיגמואידי: מעבירים מקטע אחרי מקטע', gather, chunk]].forEach(([n, g, m], i) => { const Y = 30 + i * 70; txt(x, n, 750, Y, '#212529', 12, 'right', true); x.fillStyle = '#ffa94d'; x.fillRect(750 - Math.min(400, m / Math.max(full, 1) * 400), Y + 8, Math.min(400, m / Math.max(full, 1) * 400), 18); txt(x, 'זיכרון לציונים: ' + F(m, 0) + ' MB', 340, Y + 22, '#495057', 11, 'right'); });
      out.innerHTML = 'מנה כוללת של ' + Btot.toLocaleString() + '. בהפסד הניגודי, הסיווג של שורה צריך את <i>כל</i> השורה: כל כרטיס מחזיק מטריצת ציונים של ' + Bd.toLocaleString() + ' × ' + Btot.toLocaleString() + ' (' + F(full, 0) + ' MB). בסיגמואידי כל תא עצמאי — מחשבים מקטע של ' + Bd + ' × ' + Bd + ' (' + F(chunk, 0) + ' MB), מעבירים את שיכוני הטקסט לכרטיס הבא, וממשיכים. אותה תעבורה בסך הכול, זיכרון קטן פי ' + dev + ' — וזה מה שמאפשר מנות של עשרות אלפים.'; }
    if (k === 2) { const B = 16, s = 15; const others = 0.1; const posCos = 0.9; const row_ = [...Array(B)].map((_, j) => j < dup ? posCos : others); const z = row_.map(c => s * c); const mx = Math.max(...z); const e = z.map(v => Math.exp(v - mx)); const sm = e.reduce((a, v) => a + v); const pDiag = e[0] / sm; const gSoft = pDiag - 1; const gSig = -(1 - sig(s * posCos - 5)); const gSigDup = sig(s * posCos - 5);
      [['ניגודי — האלכסון', gSoft], ['ניגודי — כל כפילות', e[1 % B] / sm * (dup > 1 ? 1 : 0)], ['סיגמואידי — האלכסון', gSig], ['סיגמואידי — כל כפילות', dup > 1 ? gSigDup : 0]].forEach(([n, g], i) => { const Y = 20 + i * 40, w = Math.abs(g) * 300; x.fillStyle = g < 0 ? '#1c7ed6' : '#e03131'; x.fillRect(450 - (g < 0 ? w : 0), Y, w, 22); txt(x, n + ': ' + F(g, 3), 750, Y + 16, '#212529', 11, 'right'); });
      out.innerHTML = dup === 1 ? 'בלי כפילויות, שני ההפסדים מושכים את הזוג הנכון.' : 'יש ' + dup + ' כיתובים זהים בשורה. בהפסד הניגודי הם <b>מתחרים</b> על אותה הסתברות: הזוג הנכון מקבל רק 1/' + dup + ' ממנה, נמשך חזק למעלה, וכל כפילות נדחפת למטה — השורה כולה מעוותת. בסיגמואידי כל כפילות היא שאלה נפרדת: היא מקבלת עונש קטן משלה, והזוג הנכון כמעט לא מושפע.'; }
  }
  draw();
};

/* 5.3 — the experiment: run rows of the table, in the browser */
W.w7_batch_table = function (box) {
  V.say(box, 'הניסוי של הסעיף, בקטן: מודל רוויה, אותם נתונים, אותו מספר סבבים — רק ההפסד וגודל המנה משתנים. בחר שורה והרץ (כחצי דקה לשורה); התוצאות מצטברות בטבלה, לצד המספרים של הקורס. ומתג של "אותו מספר צעדים" — תרגיל 5.4. (כאן 6,000 תמונות, אז בכל סבב יש פי 3.3 פחות צעדים מבקורס — והמנות הגדולות נפגעות מזה יותר.)');
  let B = 128, kind = 'sigmoid', sameSteps = false, seed = 0; const res = []; const r1 = row(box); V.tabs(r1, ['סיגמואידי', 'ניגודי'], k => { kind = k ? 'softmax' : 'sigmoid'; }); const sel = el('select'); [8, 32, 128, 512].forEach(v => sel.appendChild(el('option', { value: v, html: 'מנה ' + v }))); sel.value = 128; sel.onchange = () => B = +sel.value; r1.appendChild(sel); const c = el('label', { html: ' <input type="checkbox"> אותו מספר צעדים כמו במנה של 128' }); c.querySelector('input').onchange = e => sameSteps = e.target.checked; r1.appendChild(c); V.slider(r1, 'זרע', 0, 4, 1, 0, v => seed = v);
  V.btns(box, [['▶ הרץ שורה', () => run(), 'primary']]); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  const COURSE = { 8: ['99.8% / 70.7%', '99.9% / 79.0%'], 32: ['98.2% / 95.1%', '100% / 87.4%'], 128: ['98.1% / 97.3%', '100% / 94.0%'], 512: ['97.4% / 83.4%', '100% / 99.6%'] };
  function show() { tb.innerHTML = table(['הפסד', 'מנה', 'סבבים', 'צעדים', 'זרע', 'שנראו / שלא נראו — כאן', 'בקורס'], res.map(r => [r.kind === 'sigmoid' ? 'סיגמואידי' : 'ניגודי', r.B, r.ep, r.steps, r.seed, r.acc, COURSE[r.B] ? COURSE[r.B][r.kind === 'sigmoid' ? 0 : 1] : ''])); }
  function run() { const st = V7.state; st.data = st.data || T.makeData(6000, 1); const ep = sameSteps ? Math.max(3, Math.round(15 * B / 128)) : 15; const epc = Math.min(ep, 60); const m = new T.Model({ prep: 'chroma', din: 768, H: 64, seed }); const d = { X: st.data.X, caps: st.data.caps }; out.innerHTML = 'מאמן: ' + (kind === 'sigmoid' ? 'סיגמואידי' : 'ניגודי') + ', מנה ' + B + ', ' + epc + ' סבבים...';
    T.trainAsync(m, d, { epochs: epc, B, kind, lr: 3e-3, seed }, e => { out.innerHTML = 'מאמן: סבב ' + F(e, 1) + ' מתוך ' + epc; }, () => { const { S, U } = window.VL7.testSets(); const a = m.zeroshot(m.prepAll(S.X), S.lab).acc, b = m.zeroshot(m.prepAll(U.X), U.lab).acc; res.push({ kind, B, ep: epc, steps: m.steps, seed, acc: F(100 * a, 1) + '% / <b>' + F(100 * b, 1) + '%</b>' }); show(); out.innerHTML = 'נוספה שורה. ' + (kind === 'sigmoid' ? 'קנה מידה ' + F(Math.exp(m.p.t[0]), 1) + ', הטיה ' + F(m.p.bias[0], 2) + '. ' : '') + 'בקורס: במנות של 32 ו־128 הסיגמואיד ניצח בצירופים שלא נראו; במנה של 512 — הניגודי, כי לסיגמואיד היו מעט צעדים (תרגיל 5.4). שורה אחת היא זרע אחד — הרץ עוד זרעים לפני שמסיקים.'; }); }
  show();
};
})();

/* ===================================================================== chapter 6 */
(function () {
const W = window.W, V = window.V, el = V.el, D4 = window.D4; const { F, canvas, table, row, txt, rng } = D4; const V7 = window.VL7, T = V7.TC;
/* the archive: 5,000 frames, 1,000 of them from the unseen combinations (like the course) — built once */
V7.archive = function () { const st = V7.state; if (!st.arch) { const A = T.makeData(4000, 21), B = T.makeData(1000, 22, true); st.arch = { X: A.X.concat(B.X), lab: A.lab.concat(B.lab) }; } return st.arch; };
V7.indexOf = function (m) { const a = V7.archive(); if (!m.index) { const t0 = performance.now(); m.index = m.img(m.prepAll(a.X)); m.indexMs = performance.now() - t0; } return m.index; };
const matches = (q, l) => { const w = q.toLowerCase().split(/\s+/); return [V7.SHAPES, V7.COLORS, V7.SIZES].every((g, k) => { const asked = g.filter(v => w.includes(v)); return !asked.length || asked.includes(l[k]); }); };

/* 6.1 — which pretrained model */
W.w7_models_table = function (box) {
  V.say(box, 'ארבעת המודלים של הסעיף, וארבע דרישות של מערכת הדגל. סמן מה חשוב לך — והטבלה מסמנת מי עומד בזה. (העובדות מהטבלה של הקורס; "נתונים פתוחים" — רק OpenCLIP מתואר כך בקורס. בדוק רישיון וגרסה לפני שימוש.)');
  const M = [['CLIP (OpenAI, 2021)', { loss: 'ניגודי', heb: false, thr: false, open: false }], ['OpenCLIP', { loss: 'ניגודי', heb: false, thr: false, open: true }], ['SigLIP (Google, 2023)', { loss: 'סיגמואידי', heb: false, thr: true, open: false }], ['SigLIP 2 (Google, 2025)', { loss: 'סיגמואידי ועוד', heb: true, thr: true, open: false }]];
  const need = { heb: true, thr: true, open: false }; const r1 = row(box); [['heb', 'שאילתות בעברית'], ['thr', 'ציון מוחלט לסף (התראה)'], ['open', 'אימון על נתונים פתוחים']].forEach(([k, n]) => { const c = el('label', { html: '<input type="checkbox"' + (need[k] ? ' checked' : '') + '> ' + n + ' &nbsp;' }); c.querySelector('input').onchange = e => { need[k] = e.target.checked; draw(); }; r1.appendChild(c); });
  const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const ok = m => Object.keys(need).every(k => !need[k] || m[k]); tb.innerHTML = table(['מודל', 'הפסד', 'עברית', 'סף', 'נתונים פתוחים', ''], M.map(([n, m]) => [n, m.loss, m.heb ? '✓' : '—', m.thr ? '✓' : '—', m.open ? '✓' : '—', ok(m) ? '<b style="color:#2f9e44">מתאים</b>' : ''])); const good = M.filter(([, m]) => ok(m)).map(([n]) => n);
    out.innerHTML = good.length ? 'מתאימים: ' + good.join(', ') + '. ' + (need.thr ? 'ציון מוחלט מגיע מההפסד הסיגמואידי (פרק 5) — לכן SigLIP. ' : '') + (need.heb ? 'עברית — רק הרב־לשוני (SigLIP 2) חוסך תרגום. ' : '') + 'למערכת הדגל: SigLIP 2 בגודל הבסיסי — ומכיילים את הסף על הנתונים שלכם (6.4).' : 'אף מודל לא עומד בכל הדרישות — תרגום של השאילתות, או כיול סף על מודל ניגודי (שאלת הראיון).'; }
  draw();
};

/* 6.2 — a real model, step by step (not run) */
W.w7_real_usage = function (box) {
  V.say(box, 'מה עושה הקוד של הסעיף, צעד אחר צעד — <b>המחשה</b>, הקוד לא הורץ כאן (צריך PyTorch והורדה של המודל). הזז את הקוסינוס: הפלט <code class="ltr">logits_per_image</code> הוא <span class="ltr">s · cos + b</span>, וההסתברות — סיגמואיד שלו. הערכים של s ו־b כאן מדומים, בסדר הגודל של מודלי SigLIP.');
  let c = 0.12, s = 110, b = -16; const r1 = row(box); V.slider(r1, 'קוסינוס', -0.2, 0.4, 0.005, c, v => { c = v; draw(); }, v => F(v, 3)); V.slider(r1, 's', 10, 130, 1, s, v => { s = v; draw(); }); V.slider(r1, 'b', -20, 0, 0.5, b, v => { b = v; draw(); });
  const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const z = s * c + b, p = 1 / (1 + Math.exp(-z)); tb.innerHTML = table(['שלב', 'מה קורה'], [['<code class="ltr">proc(text=..., images=...)</code>', 'התמונה: שינוי גודל ל־224 על 224 ונרמול; הטקסט: מילים לאסימונים, ריפוד ל־64 (<span class="ltr">padding="max_length"</span> — כך המודל אומן)'], ['<code class="ltr">model(**inputs)</code>', 'שני המקודדים, וקטור לכל קלט, ומכפלה'], ['<code class="ltr">out.logits_per_image</code>', '<span class="ltr">s · cos + b = ' + F(s, 0) + ' · ' + F(c, 3) + ' + (' + F(b, 1) + ') = ' + F(z, 2) + '</span>'], ['<code class="ltr">torch.sigmoid(...)</code>', '<b>' + F(p, p < 0.01 ? 4 : 3) + '</b> — סיגמואיד, לא סיווג על השורה']]);
    out.innerHTML = 'עם קנה מידה גדול והטיה שלילית מאוד, קוסינוס של 0.1–0.15 על כיתוב <i>נכון</i> נותן הסתברות של עשירית או מאית — דבר רגיל במודלי הבסיס, שלמדו "כמעט הכול לא". לכן לא קוראים את המספר כאחוז ביטחון, ומכיילים סף על הנתונים שלכם (6.4).'; }
  draw();
};

/* 6.3 — archive search on our model */
W.w7_archive_search = function (box) {
  V.say(box, 'הארכיון של הסעיף: 5,000 "פריימים", 1,000 מהם מהצירופים שהמודל לא ראה. המודל — רוויה עם הפסד סיגמואידי, מאומן בדפדפן (אם עוד לא — כחצי דקה). מקודדים את כל הארכיון פעם אחת; כל שאילתה היא קידוד משפט ומכפלה. הקלד שאילתה: עשרת הראשונים, הציונים, הדיוק בעשרה — והזמנים, שנמדדים כאן.');
  let q = 'a small blue triangle'; const r1 = row(box); const inp = el('input', { type: 'text', value: q, class: 'ltr', style: 'width:260px' }); inp.onchange = () => { q = inp.value; draw(); }; r1.appendChild(inp); V.btns(r1, [['חפש', () => { q = inp.value; draw(); }, 'primary'], ...['a large red circle', 'a small blue triangle', 'a yellow cross', 'a large green cross'].map(v => [v, () => { inp.value = q = v; draw(); }])]);
  const cv = canvas(box, 760, 120, 760); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { V7.ensure('chroma|sig', out, m => { const a = V7.archive(); const idx = V7.indexOf(m); const d = m.o.d; const t0 = performance.now(); const qv = m.txt([q]); const sc = new Float32Array(a.X.length); for (let i = 0; i < a.X.length; i++) { let v = 0; for (let k = 0; k < d; k++) v += idx[i * d + k] * qv[k]; sc[i] = v; } const top = [...sc.keys()].sort((x, y) => sc[y] - sc[x]).slice(0, 10); const qms = performance.now() - t0;
    const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 120); const ok = top.map(i => matches(q, a.lab[i])); top.forEach((i, r) => { const X = 740 - (r + 1) * 74; V7.paint(x, a.X[i], X + 5, 8, 2); x.strokeStyle = ok[r] ? '#2f9e44' : '#e03131'; x.lineWidth = 3; x.strokeRect(X + 4, 7, 66, 66); x.lineWidth = 1; txt(x, F(sc[i], 3), X + 37, 90, '#212529', 11, 'center'); txt(x, '#' + (r + 1), X + 37, 104, '#868e96', 10, 'center'); });
    const seen = !V7.HOLD.some(h => { const [s1, c1] = h.split(' '); return q.includes(s1) && q.includes(c1); });
    tb.innerHTML = table(['שאילתה', 'צירוף שנראה באימון?', 'דיוק בעשרה', 'ציון הראשון', 'זמן שאילתה', 'קידוד הארכיון (פעם אחת)'], [[q, seen ? 'כן' : '<b>לא</b>', ok.filter(Boolean).length + ' מתוך 10', F(sc[top[0]], 3), F(qms, 2) + ' מ"ש', F(m.indexMs / 1000, 2) + ' שניות']]);
    out.innerHTML = 'ירוק — מתאים לתיאור, אדום — לא. שתי תצפיות, כמו בקורס: הזמן של שאילתה הוא מכפלה של 5,000 וקטורים — מילישניות; ו<b>הציונים עצמם</b> משתנים משאילתה לשאילתה גם כשהדירוג מושלם (בקורס 0.23 עד 0.43). נסה את ארבע השאילתות של הטבלה והשווה את "ציון הראשון" — ולכן אסור לשים סף אחד על קוסינוס.'; }); }
  draw();
};

/* 6.4 — from ranking to an alert: the sigmoid probability and a threshold */
W.w7_threshold = function (box) {
  V.say(box, 'אותו ארכיון ומודל. עכשיו לא דירוג — החלטה לכל פריים: <span class="ltr">σ(s · cos + b)</span> מעל סף. לכל שאילתה: כמה נבחרו, דיוק (כמה מהנבחרים נכונים) וכיסוי (כמה מהנכונים נבחרו), ועקומת דיוק־כיסוי. הזז את הסף ועבור בין שאילתות: האם סף אחד מתאים לכולן?');
  let q = 'a small blue triangle', thr = 0.5; const r1 = row(box); const sel = el('select'); ['a small blue triangle', 'a large green cross', 'a large red circle', 'a yellow cross', 'a small square'].forEach(v => sel.appendChild(el('option', { value: v, html: v }))); sel.onchange = () => { q = sel.value; draw(); }; r1.appendChild(sel); V.slider(r1, 'סף', 0.01, 0.99, 0.01, thr, v => { thr = v; draw(); });
  const cv = canvas(box, 760, 200, 760); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { V7.ensure('chroma|sig', out, m => { const a = V7.archive(); const idx = V7.indexOf(m); const d = m.o.d, s = Math.exp(m.p.t[0]), b = m.p.bias[0]; const qv = m.txt([q]); const P = a.X.map((_, i) => { let v = 0; for (let k = 0; k < d; k++) v += idx[i * d + k] * qv[k]; return 1 / (1 + Math.exp(-(s * v + b))); }); const Y = a.lab.map(l => matches(q, l)); const nPos = Y.filter(Boolean).length;
    const at = t => { let sel = 0, tp = 0; P.forEach((p, i) => { if (p > t) { sel++; if (Y[i]) tp++; } }); return { sel, prec: sel ? tp / sel : 1, rec: tp / Math.max(nPos, 1) }; }; const cur = at(thr);
    const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 200); const X = r => 420 + r * 300, Yp = p => 180 - p * 160; x.strokeStyle = '#adb5bd'; x.strokeRect(420, 20, 300, 160); x.strokeStyle = '#1c7ed6'; x.lineWidth = 2; x.beginPath(); for (let t = 0.99; t >= 0.01; t -= 0.01) { const r = at(t); t > 0.985 ? x.moveTo(X(r.rec), Yp(r.prec)) : x.lineTo(X(r.rec), Yp(r.prec)); } x.stroke(); x.lineWidth = 1; x.fillStyle = '#e03131'; x.beginPath(); x.arc(X(cur.rec), Yp(cur.prec), 6, 0, 7); x.fill(); txt(x, 'כיסוי ←', 720, 196, '#868e96', 10, 'right'); txt(x, 'דיוק', 416, 30, '#868e96', 10, 'right');
    const H = new Array(20).fill(0), Hn = new Array(20).fill(0); P.forEach((p, i) => { const k = Math.min(19, Math.floor(p * 20)); (Y[i] ? H : Hn)[k]++; }); const mh = Math.max(...H, ...Hn.map(v => v / 20)); for (let k = 0; k < 20; k++) { x.fillStyle = '#b2f2bb'; x.fillRect(20 + k * 18, 180 - H[k] / mh * 150, 8, H[k] / mh * 150); x.fillStyle = '#ffc9c9'; x.fillRect(28 + k * 18, 180 - Hn[k] / 20 / mh * 150, 8, Hn[k] / 20 / mh * 150); } x.strokeStyle = '#e03131'; x.beginPath(); x.moveTo(20 + thr * 360, 20); x.lineTo(20 + thr * 360, 180); x.stroke(); txt(x, 'הסתברות: ירוק — נכונים, ורוד — אחרים (÷20)', 380, 14, '#495057', 10, 'right');
    tb.innerHTML = table(['שאילתה', 'נכונים בארכיון', 'סף', 'נבחרו', 'דיוק', 'כיסוי'], [[q, nPos, F(thr, 2), cur.sel, F(100 * cur.prec, 1) + '%', F(100 * cur.rec, 1) + '%']]);
    out.innerHTML = 'בקורס: סף 0.5 על "a small blue triangle" — דיוק 100%, כיסוי 95%; על "a large green cross" — דיוק 100%, כיסוי 57.6%. <b>אותו סף, תוצאות שונות מאוד.</b> ההסתברות של מודל סיגמואידי טובה יותר מקוסינוס גולמי, אבל <b>לא מכוילת</b> — ובצירופים שלא נראו היא נוטה להיות זהירה מדי. כיילו סף לכל מטרה חדשה, על כמה עשרות דוגמאות מתויגות — כמו עקומת דיוק־כיסוי של מודול 4.'; }); }
  draw();
};

/* 6.5 — from frames to video: an index calculator */
W.w7_video_index = function (box) {
  V.say(box, 'מחשבון לאינדקס של ארכיון וידאו: כמה פריימים, כמה זיכרון, כמה זמן לקדד, וכמה זמן לחפש. ההנחות (מהירות קידוד, מכפלה) — סדרי גודל, לא מדידה.');
  let hours = 40, fps = 1, dim = 768, f16 = true, gpu = true, change = 0; const r1 = row(box); V.slider(r1, 'שעות וידאו', 1, 2000, 1, hours, v => { hours = v; draw(); }); V.slider(r1, 'פריימים לשנייה שנשמרים', 0.2, 5, 0.1, fps, v => { fps = v; draw(); }); V.slider(r1, 'ממד השיכון', 256, 1152, 64, dim, v => { dim = v; draw(); });
  const r2 = row(box); [['חצי דיוק (float16)', 'f', true], ['קידוד על כרטיס מסך', 'g', true]].forEach(([n, k, on]) => { const c = el('label', { html: '<input type="checkbox"' + (on ? ' checked' : '') + '> ' + n + ' &nbsp;' }); c.querySelector('input').onchange = e => { if (k === 'f') f16 = e.target.checked; else gpu = e.target.checked; draw(); }; r2.appendChild(c); }); V.slider(r2, 'פריימים שלא השתנו (מדולגים)', 0, 95, 5, change, v => { change = v; draw(); }, v => v + '%');
  const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const n = Math.round(hours * 3600 * fps * (1 - change / 100)); const bytes = n * dim * (f16 ? 2 : 4); const encS = n / (gpu ? 60 : 5); const qms = n * dim / 5e9 * 1000;
    tb.innerHTML = table(['', 'ערך'], [['פריימים באינדקס', n.toLocaleString()], ['זיכרון', bytes > 1e9 ? F(bytes / 1e9, 2) + ' GB' : F(bytes / 1e6, 0) + ' MB'], ['קידוד (פעם אחת)', encS > 3600 ? F(encS / 3600, 1) + ' שעות' : F(encS / 60, 1) + ' דקות'], ['שאילתה (מכפלה מלאה)', F(qms, qms < 10 ? 2 : 0) + ' מ"ש'], ['מעבר לספריית שכנים מקורבת (FAISS)?', n > 3e6 ? '<b>כן</b> — מיליוני שיכונים' : 'לא צריך']]);
    out.innerHTML = 'לשעה של וידאו בפריים לשנייה — 3,600 פריימים. מיליון שיכונים של 768 מספרים, בארבעה בתים כל אחד, הם כ־3 GB, ומכפלה אחת עדיין פחות משנייה; מעבר לכמה מיליונים — FAISS, שמוותרת על מעט דיוק תמורת מהירות. ושני חיסכונים: לדלג על פריימים שלא השתנו (הפרש רקע ממודול 1), ולקדד <i>חיתוכים</i> של עצמים מהמזהה — עצם קטן נבלע בשיכון של פריים שלם.'; }
  draw();
};
})();

/* ===================================================================== chapter 7 */
(function () {
const W = window.W, V = window.V, el = V.el, D4 = window.D4; const { F, canvas, table, row, txt, rng, iou } = D4; const V7 = window.VL7, T = V7.TC;
const RGBc = { red: [220, 40, 40], green: [40, 190, 60], blue: [40, 70, 220], yellow: [230, 210, 40] };
/* scenes of 128x128 with 3–6 shapes, like the course */
function scene(seed) { const r = rng(seed); const S = 128; const im = new Uint8ClampedArray(S * S * 3); for (let i = 0; i < im.length; i++) im[i] = 70 + Math.floor(r() * 80); const objs = []; const n = 3 + Math.floor(r() * 4); let tries = 0;
  while (objs.length < n && tries++ < 200) { const sh = V7.SHAPES[Math.floor(r() * 4)], c = V7.COLORS[Math.floor(r() * 4)], s = V7.SIZES[Math.floor(r() * 2)]; const R = s === 'large' ? 10 + Math.floor(r() * 3) : 5 + Math.floor(r() * 2); const cx = R + 2 + Math.floor(r() * (S - 2 * R - 4)), cy = R + 2 + Math.floor(r() * (S - 2 * R - 4)); if (objs.some(o => Math.abs(o.cx - cx) < o.R + R + 4 && Math.abs(o.cy - cy) < o.R + R + 4)) continue; const col = RGBc[c].map(v => Math.max(0, Math.min(255, v + Math.floor(r() * 41) - 20))); objs.push({ sh, c, s, R, cx, cy });
    const ins = (x, y) => { const dx = x - cx, dy = y - cy; if (sh === 'circle') return dx * dx + dy * dy <= R * R; if (sh === 'square') return Math.abs(dx) <= R && Math.abs(dy) <= R; if (sh === 'triangle') { if (dy < -R || dy > R) return false; return Math.abs(dx) <= (dy + R) / 2; } const w = Math.max(2, R >> 1); return (Math.abs(dx) <= R && Math.abs(dy) <= w) || (Math.abs(dx) <= w && Math.abs(dy) <= R); };
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) if (ins(x, y)) { const o = (y * S + x) * 3; im[o] = col[0]; im[o + 1] = col[1]; im[o + 2] = col[2]; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } objs[objs.length - 1].box = [x0, y0, x1 + 1, y1 + 1]; }
  return { im, objs, S }; }
/* stage 1: saturation > 90, connected components (area >= 20), a 32x32 crop around each center (reflect padding) */
function proposals(sc) { const { im, S } = sc; const mask = new Uint8Array(S * S); for (let p = 0; p < S * S; p++) { const a = im[p * 3], b = im[p * 3 + 1], c = im[p * 3 + 2]; mask[p] = Math.max(a, b, c) - Math.min(a, b, c) > 90 ? 1 : 0; }
  const lab = new Int32Array(S * S); let n = 0; const boxes = []; for (let p = 0; p < S * S; p++) { if (!mask[p] || lab[p]) continue; n++; const st = [p]; lab[p] = n; let x0 = S, y0 = S, x1 = 0, y1 = 0, a = 0; while (st.length) { const q = st.pop(); const x = q % S, y = (q / S) | 0; a++; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= S || yy >= S) continue; const k = yy * S + xx; if (mask[k] && !lab[k]) { lab[k] = n; st.push(k); } } } if (a >= 20) boxes.push([x0, y0, x1 + 1, y1 + 1]); }
  const refl = v => v < 0 ? -v - 1 : v >= S ? 2 * S - v - 1 : v; const crops = boxes.map(([x0, y0, x1, y1]) => { const cx = (x0 + x1) >> 1, cy = (y0 + y1) >> 1; const c = new Uint8ClampedArray(32 * 32 * 3); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const sx = refl(cx - 16 + x), sy = refl(cy - 16 + y); for (let k = 0; k < 3; k++) c[(y * 32 + x) * 3 + k] = im[(sy * S + sx) * 3 + k]; } return c; }); return { boxes, crops }; }
V7.det = { scene, proposals };
const iouB = (a, b) => { const ix = Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])), iy = Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1])); const I = ix * iy; return I / ((a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - I); };
function paintScene(x, sc, X, Y, k) { for (let y = 0; y < sc.S; y++) for (let xx = 0; xx < sc.S; xx++) { const o = (y * sc.S + xx) * 3; x.fillStyle = 'rgb(' + sc.im[o] + ',' + sc.im[o + 1] + ',' + sc.im[o + 2] + ')'; x.fillRect(X + xx * k, Y + y * k, k, k); } }
/* the detection set: crops of N scenes, with the true label of the object each crop hits (IoU > 0.5) or null */
V7.detSet = function (N) { const st = V7.state; if (st.detSet && st.detSet.N === N) return st.detSet; let nObj = 0, hit = 0, t = 0; const items = []; for (let k = 0; k < N; k++) { const sc = scene(500 + k); nObj += sc.objs.length; const t0 = performance.now(); const P = proposals(sc); t += performance.now() - t0; const used = new Set(); P.boxes.forEach((b, i) => { let best = -1, bv = 0; sc.objs.forEach((o, j) => { const v = iouB(b, o.box); if (v > bv) { bv = v; best = j; } }); const lab = bv > 0.5 ? sc.objs[best] : null; if (lab) used.add(best); items.push({ crop: P.crops[i], lab: lab ? [lab.sh, lab.c, lab.s] : null, scene: k }); }); hit += used.size; } st.detSet = { N, items, nObj, recall: hit / nObj, ms: t / N }; return st.detSet; };

/* 7.1 — an open detector from scratch, in two stages */
W.w7_two_stage_det = function (box) {
  V.say(box, 'מזהה פתוח בשני שלבים, כמו בקוד של הסעיף — רץ כאן: (1) <b>הצעות</b> — סף על רוויה ורכיבים קשורים (מודול 1), בלי לדעת מה העצם; (2) <b>סיווג פתוח</b> — כל חיתוך של 32 על 32 עובר במודל הרוויה שאומן בדפדפן, מול 32 התיאורים. הקלד שאילתה כדי לסמן התאמות. ולמטה — המדדים על 100 סצנות.');
  let seed = 3, q = 'a blue triangle'; const r1 = row(box); V.btns(r1, [['🎲 סצנה', () => { seed++; draw(); }]]); const inp = el('input', { type: 'text', value: q, class: 'ltr', style: 'width:200px' }); inp.onchange = () => { q = inp.value; draw(); }; r1.appendChild(inp);
  const cv = canvas(box, 760, 290, 760); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { V7.ensure('chroma|sig', out, m => { const sc = scene(seed); const t0 = performance.now(); const P = proposals(sc); const tP = performance.now() - t0; const cl = m.classes(); const Tm = m.txt(cl.map(([a, b, c]) => V7.fill('a {s} {c} {sh}', a, b, c))); const qv = m.txt([q]); const d = m.o.d, s = Math.exp(m.p.t[0]), bb = m.p.bias[0]; const U = P.crops.length ? m.img(P.crops.map(T.prepChroma)) : [];
    const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 290); paintScene(x, sc, 470, 10, 2);
    P.boxes.forEach((bx, i) => { let bi = 0, bv = -9; for (let k = 0; k < cl.length; k++) { let v = 0; for (let j = 0; j < d; j++) v += U[i * d + j] * Tm[k * d + j]; if (v > bv) { bv = v; bi = k; } } let qc = 0; for (let j = 0; j < d; j++) qc += U[i * d + j] * qv[j]; const p = 1 / (1 + Math.exp(-(s * qc + bb))); const isQ = p > 0.5; x.strokeStyle = isQ ? '#e8590c' : '#fff'; x.lineWidth = isQ ? 3 : 1.5; x.strokeRect(470 + bx[0] * 2, 10 + bx[1] * 2, (bx[2] - bx[0]) * 2, (bx[3] - bx[1]) * 2); x.lineWidth = 1; const lab = cl[bi].map(w => V7.HEB[w]).join(' '); txt(x, lab + ' · ' + F(p, 2), 460, 24 + i * 22, isQ ? '#e8590c' : '#495057', 11, 'right', isQ); V7.paint(x, P.crops[i], 20 + (i % 4) * 36, 12 + Math.floor(i / 4) * 36, 1); });
    txt(x, 'החיתוכים שנכנסים לסיווג', 90, 100, '#868e96', 10, 'center');
    const D = V7.detSet(100); const items = D.items.filter(it => it.lab); const xs = items.map(it => T.prepChroma(it.crop)); const z = m.zeroshot(xs, items.map(it => it.lab)); const seenOk = [], unOk = []; items.forEach((it, i) => { const ok = z.pred[i].join() === it.lab.join(); (V7.HOLD.includes(it.lab[0] + ' ' + it.lab[1]) ? unOk : seenOk).push(ok); }); const av = a => a.length ? a.filter(Boolean).length / a.length : 0;
    tb.innerHTML = table(['מדד', 'כאן (100 סצנות)', 'בקורס (300 סצנות)'], [['עצמים בסצנות', D.nObj, '1,325'], ['כיסוי ההצעות (IoU מעל 0.5)', F(100 * D.recall, 1) + '%', '100%'], ['זמן הצעות לסצנה', F(D.ms, 2) + ' מ"ש', '0.9 מ"ש'], ['סיווג פתוח של החיתוכים ל־32 תיאורים', F(100 * z.acc, 1) + '% (נראו ' + F(100 * av(seenOk), 1) + '%, לא נראו ' + F(100 * av(unOk), 1) + '%)', '91.4% (92.4% / 88.6%)']]);
    out.innerHTML = 'בסצנה: ' + P.boxes.length + ' הצעות ב־' + F(tP, 1) + ' מ"ש; כתום — הסתברות מעל חצי לשאילתה "' + q + '". הדיוק על חיתוכים נמוך מאשר על תמונות בודדות (פרק 4): החיתוך נוגס בשכנים, וצלב קטן הוא כמה פיקסלים. בקורס — מחיקה של מה שמחוץ למלבן שיפרה רק ל־92.2%: הבעיה היא הרזולוציה, וזו גם הבעיה של מזהים פתוחים אמיתיים על עצמים קטנים ורחוקים.'; }); }
  draw();
};

/* 7.2 — ranking vs threshold, per query */
W.w7_rank_vs_thr = function (box) {
  V.say(box, 'על החיתוכים של 100 סצנות: לכל שאילתה — דיוק ממוצע (AP, מודול 4), ההסתברויות על מטרות ועל אחרים, ומה סף אחד עושה לכל השאילתות יחד. הזז את הסף: האם יש ערך שמתאים לכולן?');
  let thr = 0.5; const r1 = row(box); V.slider(r1, 'סף אחד לכל השאילתות', 0.02, 0.98, 0.01, thr, v => { thr = v; draw(); }); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  const QS = ['a red circle', 'a large yellow square', 'a blue triangle', 'a small green cross'];
  function draw() { V7.ensure('chroma|sig', out, m => { const D = V7.detSet(100); const it = D.items; const U = m.state7 || (m.state7 = m.img(it.map(i => T.prepChroma(i.crop)))); const d = m.o.d, s = Math.exp(m.p.t[0]), bb = m.p.bias[0];
    const match = (q, l) => { if (!l) return false; const w = q.split(' '); return [V7.SHAPES, V7.COLORS, V7.SIZES].every((g, k) => { const a = g.filter(v => w.includes(v)); return !a.length || a.includes(l[k]); }); };
    const rows = QS.map(q => { const qv = m.txt([q]); const P = it.map((_, i) => { let v = 0; for (let j = 0; j < d; j++) v += U[i * d + j] * qv[j]; return 1 / (1 + Math.exp(-(s * v + bb))); }); const Y = it.map(i => match(q, i.lab)); const o = P.map((p, i) => [p, Y[i]]).sort((a, b) => b[0] - a[0]); let tp = 0, ap = 0; const npos = Y.filter(Boolean).length; o.forEach(([, y], k) => { if (y) { tp++; ap += tp / (k + 1); } }); ap /= Math.max(npos, 1); const pos = P.filter((_, i) => Y[i]).sort((a, b) => a - b), neg = P.filter((_, i) => !Y[i]); const sel = P.map((p, i) => p >= thr ? i : -1).filter(i => i >= 0); const prec = sel.length ? sel.filter(i => Y[i]).length / sel.length : 1, rec = sel.filter(i => Y[i]).length / Math.max(npos, 1);
      const seen = !V7.HOLD.some(h => { const [a, b] = h.split(' '); return q.includes(a) && q.includes(b); }); return [q, seen ? 'כן' : '<b>לא</b>', npos, F(ap, 3), F(pos[pos.length >> 1] || 0, 3), F(Math.max(...neg), 3), F(100 * prec, 0) + '% / ' + F(100 * rec, 0) + '%']; });
    tb.innerHTML = table(['שאילתה', 'נראה?', 'מטרות', 'AP', 'חציון ההסתברות על מטרות', 'מקסימום על אחרים', 'בסף ' + F(thr, 2) + ': דיוק / כיסוי'], rows);
    const meds = rows.map(r => +r[4]); out.innerHTML = 'כאן — מודל קטן שאומן בדפדפן על 6,000 דוגמאות, וה־AP שלו נמוך מזה של הקורס (וגם מהרצת הקוד המלא: 0.86–1.00). אבל התופעה זהה: חציון ההסתברות על מטרות נע בין ' + F(Math.min(...meds), 2) + ' ל־' + F(Math.max(...meds), 2) + ', ואין סף אחד שמתאים לכל השאילתות.<br>בקורס: AP של 0.976 עד 1.000 בכל השאילתות — הדירוג כמעט מושלם, גם על מטרות שלא נראו. אבל חציון ההסתברות על מטרות נע בין 0.110 ל־0.831: סף 0.5 מצא רק את המשולשים הכחולים, וסף 0.2 — עיגולים אדומים, אבל 6.8% מהריבועים הצהובים ואף צלב ירוק קטן. <b>במזהה פתוח מכיילים סף לכל תיאור בנפרד</b> — גם במודלים האמיתיים, שבהם ברירת המחדל של YOLO-World נמוכה בהרבה מזו של YOLO רגיל.'; }); }
  draw();
};

/* 7.3 — YOLO-World: the text is encoded once (illustration) */
W.w7_yoloworld = function (box) {
  V.say(box, '<b>המחשה, לא הורץ.</b> שלוש דרכים לזהות לפי טקסט, ומה עולה כל אחת כשרשימת התיאורים גדלה: הזמנים הם מודל של סדרי גודל — כדי לראות את <i>הצורה</i> של העלות, לא את המספרים.');
  let nCls = 2, nObj = 8, change = false; const r1 = row(box); V.slider(r1, 'תיאורים ברשימה', 1, 80, 1, nCls, v => { nCls = v; draw(); }); V.slider(r1, 'עצמים בפריים', 1, 40, 1, nObj, v => { nObj = v; draw(); }); const c = el('label', { html: ' <input type="checkbox"> הרשימה משתנה בכל פריים' }); c.querySelector('input').onchange = e => { change = e.target.checked; draw(); }; r1.appendChild(c);
  const cv = canvas(box, 760, 170, 760); const out = V.say(box);
  function draw() { const yw = 8 + nCls * 0.01 + (change ? nCls * 1.5 : 0), two = 3 + nObj * 4 + nCls * 0.01, gd = 120 + nCls * 6; const R = [['YOLO-World: הטקסט מקודד פעם אחת', yw, '#2f9e44'], ['שני שלבים (סעיף 7.1): מקודד כל חיתוך', two, '#1c7ed6'], ['Grounding DINO: טקסט ותמונה יחד, כל פריים', gd, '#ae3ec9']]; const mx = Math.max(...R.map(r => r[1]));
    const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 170); R.forEach(([n, v, col], i) => { const Y = 20 + i * 48, w = Math.min(420, Math.log10(1 + v) / Math.log10(1 + mx) * 420); x.fillStyle = col; x.fillRect(740 - w, Y, w, 28); txt(x, n, 735, Y + 18, '#fff', 11, 'right', true); txt(x, F(v, 0) + ' מ"ש (מודל)', 735 - w - 6, Y + 18, '#212529', 11, 'right'); });
    out.innerHTML = 'YOLO-World: <code class="ltr">set_classes</code> מקודד את הרשימה <b>פעם אחת</b>, והשיכונים יושבים במקום מטריצת המשקלות של שכבת הסיווג — מאז זה מזהה YOLO רגיל, וכמעט לא משנה כמה תיאורים יש' + (change ? '; אבל אם הרשימה משתנה בכל פריים — מקודדים מחדש בכל פריים.' : '.') + ' שני שלבים: העלות גדלה עם מספר <i>העצמים</i>. Grounding DINO: הטקסט נכנס לתוך הרשת — כל פריים עם כל תיאור, איטי בהרבה, ומבין תיאורים מורכבים יותר (סעיף 7.4). והציונים של YOLO-World נמוכים מהרגיל (0.1–0.4) — לכן <span class="ltr">conf=0.05</span> בקוד, וכיול לכל תיאור.'; }
  draw();
};

/* 7.4 — Grounding DINO vs YOLO-World: relations need the text inside the network (illustration) */
W.w7_gdino_vs_world = function (box) {
  V.say(box, '<b>המחשה.</b> סצנה עם שני משולשים כחולים ועיגול אדום, ותיאור עם יחס: "המשולש הכחול <i>שמשמאל</i> לעיגול האדום". מזהה שמשווה כל קופסה לטקסט <b>בנפרד</b> (כמו YOLO-World, וכמו המזהה של 7.1) נותן לשני המשולשים אותו ציון — הוא לא רואה את העיגול כשהוא שופט משולש. מודל שמערבב טקסט ותמונה לאורך הרשת (Grounding DINO) יכול לקשר. ולמטה — טבלת ההחלטה של הסעיף.');
  let mode = 0; V.tabs(box, ['כל קופסה בנפרד (YOLO-World)', 'טקסט ותמונה יחד (Grounding DINO)'], k => { mode = k; draw(); }); const cv = canvas(box, 760, 170, 760); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 170); x.fillStyle = '#8a8a8a'; x.fillRect(360, 10, 380, 150); const obj = [[420, 85, 'triangle', '#2846dc'], [560, 85, 'circle', '#dc2828'], [680, 85, 'triangle', '#2846dc']]; obj.forEach(([cx, cy, sh, col]) => { x.fillStyle = col; x.beginPath(); if (sh === 'circle') x.arc(cx, cy, 24, 0, 7); else { x.moveTo(cx, cy - 26); x.lineTo(cx - 26, cy + 24); x.lineTo(cx + 26, cy + 24); } x.fill(); });
    const scores = mode === 0 ? [0.71, 0.04, 0.71] : [0.83, 0.03, 0.12]; obj.forEach(([cx, cy], i) => { if (i === 1) return; const hi = scores[i] > 0.5; x.strokeStyle = hi ? '#e8590c' : '#fff'; x.lineWidth = hi ? 3 : 1.5; x.strokeRect(cx - 32, cy - 32, 64, 64); x.lineWidth = 1; txt(x, F(scores[i], 2), cx, cy + 50, '#fff', 12, 'center', true); }); txt(x, '"the blue triangle left of the red circle"', 340, 85, '#495057', 12, 'right');
    tb.innerHTML = table(['', 'YOLO-World', 'Grounding DINO'], [['איך הטקסט נכנס', 'מקודד פעם אחת, מושווה בסוף', 'מעורבב בכל הרשת'], ['מהירות', 'זמן אמת', 'איטי'], ['תיאורים מורכבים', 'חלש', 'טוב יותר'], ['שימוש טבעי', 'מערכת חיה עם מטרה חדשה', 'תיוג אוטומטי, חיפוש מדויק בארכיון']]);
    out.innerHTML = mode === 0 ? '<b>שני המשולשים מקבלים אותו ציון</b> — כל קופסה נשפטת לבד מול וקטור אחד של המשפט, ו"שמשמאל לעיגול" הוא מידע שאין בקופסה. ומקודד הטקסט של CLIP ממילא חלש ביחסים (פרק 4.4).' : 'רק השמאלי מסומן: הטקסט משתתף בעיבוד התמונה, והמודל יכול לקשר בין "משולש" ל"עיגול" ול"שמשמאל". המחיר: אין "מטריצה של תיאורים" לשמור מראש (תרגיל 7.3) — כל פריים עם כל משפט עובר את כל הרשת, שניות על מעבד.'; }
  draw();
};
})();

/* ===================================================================== chapter 8 */
(function () {
const W = window.W, V = window.V, el = V.el, D4 = window.D4; const { F, canvas, table, row, txt, rng } = D4; const V7 = window.VL7;

/* 8.1 — how many visual tokens, and what they cost */
W.w7_vis_tokens = function (box) {
  V.say(box, 'התמונה מחולקת לטלאים, כל טלאי הופך לוקטור, ולפעמים ארבעה שכנים מאוחדים לאסימון אחד. בחר תצורה או הזז את המחוונים: הרשת על התמונה מראה את הטלאים (צבע אחד לכל אסימון), והחשבון למטה — כמה אסימונים, וכמה זמן לוקח רק לקרוא אותם בקצב של תרגיל 8.1. ובצד — צלב קטן מפרק 7: בכמה טלאים הוא נופל?');
  let side = 224, patch = 16, sh = 1, rate = 2000, q = 10; const PRE = [[224, 16, 1], [384, 14, 1], [512, 16, 4], [1024, 16, 4]];
  V.btns(box, PRE.map(([a, b, c]) => [a + ' · טלאי ' + b + ' · איחוד ' + c, () => { side = a; patch = b; sh = c; sync(); draw(); }]));
  const r1 = row(box); const sS = V.slider(r1, 'צלע התמונה', 112, 1536, 16, side, v => { side = v; draw(); }); const sP = V.slider(r1, 'טלאי', 8, 32, 1, patch, v => { patch = v; draw(); });
  const r2 = row(box); let shB; V.tabs(r2, ['בלי איחוד', 'איחוד 2×2'], k => { sh = k ? 4 : 1; draw(); }); V.slider(r2, 'קצב קריאה (אסימונים בשנייה)', 200, 10000, 100, rate, v => { rate = v; draw(); }, v => F(v, 0)); V.slider(r2, 'מילים בשאלה', 3, 60, 1, q, v => { q = v; draw(); });
  function sync() { try { sS.set && sS.set(side); sP.set && sP.set(patch); } catch (e) {} }
  const cv = canvas(box, 760, 260, 760); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  const r = rng(7); const scn = V7.det ? V7.det.scene(11) : null;
  function draw() { const n = Math.floor(side / patch), toks = Math.floor(n * n / sh); const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 260);
    /* the image: a scene stretched to 240 px */
    const S0 = 240, X0 = 500, Y0 = 10; if (scn) { const k = S0 / scn.S; for (let y = 0; y < scn.S; y++) for (let xx = 0; xx < scn.S; xx++) { const o = (y * scn.S + xx) * 3; x.fillStyle = 'rgb(' + scn.im[o] + ',' + scn.im[o + 1] + ',' + scn.im[o + 2] + ')'; x.fillRect(X0 + xx * k, Y0 + y * k, k + 0.5, k + 0.5); } }
    const cell = S0 / n; const g = sh === 4 ? 2 : 1; if (cell >= 2) { for (let i = 0; i < n; i += g) for (let j = 0; j < n; j += g) { const hue = ((i / g) * 37 + (j / g) * 61) % 360; x.fillStyle = 'hsla(' + hue + ',70%,50%,0.18)'; x.fillRect(X0 + j * cell, Y0 + i * cell, cell * g, cell * g); } x.strokeStyle = 'rgba(255,255,255,0.5)'; x.lineWidth = 0.5; for (let i = 0; i <= n; i++) { x.beginPath(); x.moveTo(X0 + i * cell, Y0); x.lineTo(X0 + i * cell, Y0 + S0); x.stroke(); x.beginPath(); x.moveTo(X0, Y0 + i * cell); x.lineTo(X0 + S0, Y0 + i * cell); x.stroke(); } }
    else txt(x, 'הרשת צפופה מכדי לצייר', X0 + S0 / 2, Y0 + S0 + 0, '#868e96', 10, 'center');
    /* the sequence the language model reads */
    const tot = toks + q + 8; const W0 = 440; let xx = 20; const seg = [['תבנית', 8, '#adb5bd'], ['אסימונים חזותיים', toks, '#1c7ed6'], ['שאלה', q, '#e8590c']]; seg.forEach(([n0, v, col]) => { const w = Math.max(2, W0 * v / tot); x.fillStyle = col; x.fillRect(xx, 60, w, 34); if (w > 60) txt(x, n0, xx + w / 2, 82, '#fff', 11, 'center', true); xx += w; });
    txt(x, 'מה שמודל השפה קורא לפני המילה הראשונה של התשובה', 460, 46, '#495057', 11, 'right');
    txt(x, F(100 * toks / tot, 1) + '% מהקלט הוא התמונה', 460, 116, '#1c7ed6', 13, 'right', true);
    /* a small cross of 6 px radius in a 128 px scene, scaled to `side` */
    const crossPx = 13 * side / 128; txt(x, 'צלב קטן (13 פיקסלים בסצנה של 128) בתמונה הזו: ' + F(crossPx, 0) + ' פיקסלים — ' + F(crossPx / patch, 1) + ' טלאים לרוחב', 460, 160, '#495057', 11, 'right');
    txt(x, 'זמן קריאת התמונה: ' + F(toks / rate, 2) + ' שניות', 460, 190, '#212529', 13, 'right', true);
    tb.innerHTML = table(['תצורה', 'טלאים לרוחב', 'אסימונים חזותיים', 'זמן קריאה בקצב ' + F(rate, 0)], PRE.map(([a, b, c]) => { const t = Math.floor(Math.floor(a / b) ** 2 / c); return [a + ' · ' + b + ' · ' + c, Math.floor(a / b), t.toLocaleString(), F(t / rate, 2) + ' ש׳']; }).concat([['<b>שלך: ' + side + ' · ' + patch + ' · ' + sh + '</b>', n, '<b>' + toks.toLocaleString() + '</b>', '<b>' + F(toks / rate, 2) + ' ש׳</b>']]));
    out.innerHTML = 'הכפלת הצלע מכפילה את האסימונים פי ארבעה; איחוד 2×2 מחזיר פי ארבעה. השאלה (' + q + ' מילים) היא ' + F(100 * q / tot, 1) + '% מהקלט — <b>התמונה היא רוב העבודה</b>. ובצד השני — הצלב הקטן של פרק 7 ' + (crossPx / patch < 1 ? 'קטן כאן מטלאי אחד: הוא מתערבב עם הרקע שבאותו טלאי, ומודל השפה לא יכול לענות עליו.' : 'הוא כאן רוחב של ' + F(crossPx / patch, 1) + ' טלאים בלבד — מעט מאוד מידע. כדי לראות עצמים קטנים צריך רזולוציה, והרזולוציה עולה באסימונים.'); }
  draw();
};

/* 8.2 — which model family fits which requirement (only the course table's strengths) */
W.w7_vlm_models = function (box) {
  V.say(box, 'ארבע המשפחות של הטבלה (סתיו 2026). סמן מה המערכת שלך צריכה — והטבלה מסמנת מי <i>חזק במיוחד</i> בזה לפי הקורס. זה לא אומר שהאחרים לא יודעים; זה אומר איפה להתחיל לבדוק.');
  const M = [['Qwen3-VL', 'Alibaba', '2, 4, 8 מיליארד', { ocr: 1, video: 1, ground: 1, lic: 1 }], ['SmolVLM2', 'Hugging Face', 'מאות מיליונים עד כ־2 מיליארד', { edge: 1, cpu: 1 }], ['Moondream', '', 'כ־2 מיליארד', { count: 1, ground: 1, small: 1 }], ['Gemma 3 ו־PaliGemma 2', 'Google', '3 עד 4 מיליארד בגדלים הקטנים', { tune: 1 }]];
  const REQ = [['edge', 'מחשב קצה או מעבד בלבד'], ['ocr', 'קריאת טקסט ומסמכים'], ['video', 'וידאו'], ['ground', 'מיקום עצמים / הצבעה'], ['count', 'ספירה'], ['tune', 'כיוונון למשימה שלי'], ['lic', 'רישיון Apache 2.0 (לפי הטבלה)']];
  const on = new Set(); const r1 = el('div', { class: 'row', style: 'flex-wrap:wrap;gap:10px' }); box.appendChild(r1); REQ.forEach(([k, l]) => { const c = el('label', { html: '<input type="checkbox"> ' + l }); c.querySelector('input').onchange = e => { e.target.checked ? on.add(k) : on.delete(k); draw(); }; r1.appendChild(c); });
  const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const rows = M.map(([n, org, sz, f]) => { const hit = [...on].filter(k => f[k] || (k === 'edge' && f.cpu)).length; const all = on.size && hit === on.size; return [(all ? '✅ ' : '') + '<span class="ltr">' + n + '</span>' + (org ? ' (' + '<span class="ltr">' + org + '</span>)' : ''), sz, REQ.filter(([k]) => f[k] || (k === 'edge' && f.cpu)).map(([, l]) => l).join(' · '), on.size ? hit + ' מתוך ' + on.size : '—']; });
    tb.innerHTML = table(['משפחה', 'גדלים קטנים', 'חזקה במיוחד ב־', 'דרישות שסומנו'], rows);
    const full = M.filter(([, , , f]) => on.size && [...on].every(k => f[k] || (k === 'edge' && f.cpu))).map(m => m[0]);
    out.innerHTML = !on.size ? 'סמן דרישה אחת או יותר.' : full.length ? 'מתאימים לכל הדרישות שסומנו (לפי הטבלה): <b class="ltr">' + full.join(', ') + '</b>. הצעד הבא — להריץ על 50–100 פריימים שלכם עם השאלות שלכם, ולמדוד דיוק, זמן והזיות (תרגיל 8.4★).' : '<b>אף משפחה לא חזקה במיוחד בכל מה שסומן.</b> בוחרים לפי הדרישה הקשה ביותר (בדרך כלל החומרה), ובודקים על הנתונים שלכם אם השאר "מספיק טוב". והתחום זז מהר — בודקים מה חדש לפני שבוחרים.'; }
  draw();
};

/* 8.3 — a closed question: what goes in, what it costs, and how to read the answer */
W.w7_closed_question = function (box) {
  V.say(box, 'שני חלקים של אותה שאלה סגורה. <b>מה זה עולה</b>: קריאת הקלט מהירה (הכול במקביל), אבל כל אסימון של תשובה נוצר לבד — לכן <code class="ltr">max_new_tokens=16</code> ו־"Answer yes or no" חוסכים זמן. <b>איך מפענחים</b>: מודל אמיתי לא תמיד עונה במילה אחת. כתוב תשובה, וראה מה הפענוח שלנו מחליט.');
  let mode = 0; V.tabs(box, ['מה זה עולה', 'פענוח התשובה'], k => { mode = k; build(); }); const body = el('div'); box.appendChild(body);
  function build() { body.innerHTML = ''; mode === 0 ? cost() : parse(); }
  function cost() { let toks = 729, q = 12, ans = 2, pre = 2000, dec = 20; const r1 = row(body); V.slider(r1, 'אסימונים חזותיים', 64, 2048, 1, toks, v => { toks = v; draw(); }, v => F(v, 0)); V.slider(r1, 'אסימונים בשאלה', 4, 80, 1, q, v => { q = v; draw(); }); V.slider(r1, 'אסימונים בתשובה', 1, 200, 1, ans, v => { ans = v; draw(); });
    const r2 = row(body); V.slider(r2, 'קצב קריאה', 200, 8000, 100, pre, v => { pre = v; draw(); }, v => F(v, 0)); V.slider(r2, 'קצב יצירה (אסימונים בשנייה)', 2, 100, 1, dec, v => { dec = v; draw(); });
    const cv = canvas(body, 760, 130, 760); const out = V.say(body);
    function draw() { const tp = (toks + q) / pre, td = ans / dec, T0 = tp + td; const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 130); const Wd = 700; const w1 = Wd * tp / T0; x.fillStyle = '#1c7ed6'; x.fillRect(740 - w1, 30, w1, 40); x.fillStyle = '#e8590c'; x.fillRect(740 - Wd, 30, Wd - w1, 40); if (w1 > 90) txt(x, 'קריאה ' + F(tp, 2) + ' ש׳', 740 - w1 / 2, 55, '#fff', 12, 'center', true); if (Wd - w1 > 90) txt(x, 'יצירה ' + F(td, 2) + ' ש׳', 40 + (Wd - w1) / 2, 55, '#fff', 12, 'center', true); txt(x, 'סה"כ ' + F(T0, 2) + ' שניות לשאלה', 740, 100, '#212529', 13, 'right', true);
      out.innerHTML = 'ב־' + ans + ' אסימוני תשובה' + (ans <= 3 ? ' — תשובה של מילה' : ans > 40 ? ' — תיאור חופשי' : '') + ', היצירה היא ' + F(100 * td / T0, 0) + '% מהזמן. ' + (ans > 40 ? 'שאלה פתוחה ("תאר את הפריים") עולה פי כמה מסגורה, ואת התשובה צריך לפענח עם עוד מודל — או בכלל לא.' : 'שאלה סגורה: מעט אסימונים, ותשובה שקוד יכול לקרוא.') + ' הקצבים כאן הם הנחה; על מעבד הם נמוכים בהרבה — מדדו אצלכם.'; }
    draw(); }
  function parse() { const EX = ['Yes', 'yes.', 'Yes, the person is carrying a backpack.', 'No', 'NO.', 'There is no backpack.', 'I cannot determine this from the image.', 'Yes and no.', 'Not sure, but probably yes.', 'Nope']; const inp = el('input', { type: 'text', value: EX[2], class: 'ltr', style: 'width:420px' }); const r1 = row(body); r1.appendChild(inp); const one = V.say(body); const tb = el('div'); body.appendChild(tb);
    const parseYN = t => { const w = t.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean); if (!w.length) return null; if (w[0] === 'yes') return w.includes('no') ? null : true; if (w[0] === 'no') return w.includes('yes') ? null : false; return null; };
    const show = v => v === true ? '<b style="color:#2f9e44">כן</b>' : v === false ? '<b style="color:#c92a2a">לא</b>' : '<b style="color:#e8590c">לא ברור — לא מחליטים</b>';
    const naive = t => /yes/i.test(t);
    function draw() { one.innerHTML = 'הפענוח: ' + show(parseYN(inp.value)) + ' · פענוח נאיבי ("יש yes בטקסט?"): ' + (naive(inp.value) ? 'כן' : 'לא'); tb.innerHTML = table(['תשובה של המודל', 'הפענוח שלנו', 'נאיבי'], EX.map(e => ['<span class="ltr">' + e + '</span>', show(parseYN(e)), naive(e) ? 'כן' : 'לא'])); }
    inp.oninput = draw; draw(); const o2 = V.say(body); o2.innerHTML = 'הכלל: המילה <b>הראשונה</b> קובעת, ותשובה שמכילה גם "yes" וגם "no" — לא ברורה. "לא ברור" הוא תוצאה לגיטימית: בצינור של 8.4 הוא "לא אומת", ולא "לא". הנאיבי טועה ב־"Not sure, but probably yes" ומפספס את "Nope" ואת "There is no backpack" — תרגיל 8.7 בונה פענוח כזה עם בדיקות.'; }
  build();
};

/* 8.4 — the VLM as a second stage: a queue simulation */
W.w7_vlm_pipeline = function (box) {
  V.say(box, 'סימולציה של דקה במערכת הדגל: המזהה רץ ב־30 פריימים בשנייה, מסלולים חדשים מופיעים באקראי, ומודל שפה־ראייה אחד עונה על שאלה ב־300 מילישניות (תרגיל 8.3). השווה מדיניות: לשאול על <b>כל פריים</b> של כל מסלול, או רק על <b>ההתראה הראשונה</b> של כל מסלול. הגרף: אורך התור לאורך הדקה; הטבלה: כמה זמן מפעיל מחכה לאימות.');
  let pol = 1, rate = 0.5, svc = 300, life = 5, seed = 1; V.tabs(box, ['כל פריים של כל מסלול', 'רק ההתראה הראשונה של מסלול'], k => { pol = k; draw(); }, 1);
  const r1 = row(box); V.slider(r1, 'מסלולים חדשים בשנייה', 0.05, 4, 0.05, rate, v => { rate = v; draw(); }); V.slider(r1, 'זמן לשאלה (מ"ש)', 50, 1500, 10, svc, v => { svc = v; draw(); }); V.slider(r1, 'משך מסלול (שניות)', 1, 20, 1, life, v => { life = v; draw(); }); V.btns(r1, [['🎲 דקה אחרת', () => { seed++; draw(); }]]);
  const cv = canvas(box, 760, 200, 760); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function sim(policy) { const r = rng(seed); const jobs = []; let t = 0; const tracks = []; while (true) { t += -Math.log(1 - r()) / rate; if (t > 60) break; tracks.push(t); } tracks.forEach(t0 => { if (policy) jobs.push(t0); else for (let f = t0; f < Math.min(60, t0 + life); f += 1 / 30) jobs.push(f); }); jobs.sort((a, b) => a - b);
    let free = 0; const wait = [], q = []; const done = []; jobs.forEach(a => { const s = Math.max(a, free); free = s + svc / 1000; wait.push(free - a); done.push(free); }); for (let k = 0; k <= 120; k++) { const tt = k / 2; let n = 0; for (let i = 0; i < jobs.length; i++) if (jobs[i] <= tt && done[i] > tt) n++; q.push(n); } return { n: tracks.length, jobs: jobs.length, wait, q }; }
  function draw() { const A = sim(0), B = sim(1); const cur = pol ? B : A; const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 200); const mx = Math.max(5, ...cur.q); x.strokeStyle = '#dee2e6'; x.strokeRect(40, 10, 700, 160); x.beginPath(); cur.q.forEach((v, k) => { const X = 40 + k * 700 / 120, Y = 170 - 160 * v / mx; k ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.strokeStyle = pol ? '#2f9e44' : '#c92a2a'; x.lineWidth = 2; x.stroke(); x.lineWidth = 1; txt(x, F(mx, 0), 36, 18, '#868e96', 10, 'right'); txt(x, '0', 36, 170, '#868e96', 10, 'right'); txt(x, 'שניות 0–60', 390, 190, '#868e96', 10, 'center'); txt(x, 'שאלות בתור', 46, 26, '#495057', 11, 'left');
    const pct = (a, p) => { const s = a.slice().sort((u, v) => u - v); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0; }; const util = (m, S) => m.jobs * svc / 1000 / 60;
    tb.innerHTML = table(['מדיניות', 'מסלולים', 'שאלות בדקה', 'עומס על המודל', 'זמן עד תשובה (חציון)', 'זמן עד תשובה (95%)'], [[ 'כל פריים', A.n, A.jobs.toLocaleString(), F(100 * util(A), 0) + '%', F(pct(A.wait, 0.5), 1) + ' ש׳', F(pct(A.wait, 0.95), 1) + ' ש׳'], ['התראה ראשונה', B.n, B.jobs, F(100 * util(B), 0) + '%', F(pct(B.wait, 0.5), 2) + ' ש׳', F(pct(B.wait, 0.95), 2) + ' ש׳']]);
    const u = util(B); out.innerHTML = 'לשאול על כל פריים — ' + A.jobs.toLocaleString() + ' שאלות בדקה מול ' + F(60 * 1000 / svc, 0) + ' שהמודל מסוגל לענות: התור רק גדל, והאימות מגיע אחרי דקות. רק ההתראה הראשונה — עומס של ' + F(100 * u, 0) + '%' + (u > 0.8 ? ', <b>קרוב מדי לקיבולת</b>: גם כאן התור מתחיל להתנפח בפרצים. כשהעומס מעל כ־70–80%, ההמתנה קופצת — סדרו לפי עדיפות, או הוסיפו מודל.' : ', והמפעיל מקבל תשובה בדרך כלל תוך פחות משנייה. זה ההבדל בין צינור שעובד לצינור שקורס — לא דיוק המודל.') + ' (מסלולים מגיעים כתהליך פואסון; המספרים משתנים בין דקות — לחץ 🎲.)'; }
  draw();
};
})();

/* ===================================================================== chapter 9 */
(function () {
const W = window.W, V = window.V, el = V.el, D4 = window.D4; const { F, canvas, table, row, txt, rng, randn } = D4; const V7 = window.VL7, T = V7.TC;
/* a closed classifier: the same input and a hidden layer like the image tower, softmax over a fixed list of classes */
function Closed(din, H, C, seed) { const r = rng(seed || 0); const mk = (n, s) => { const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = s * randn(r); return a; }; this.din = din; this.H = H; this.C = C; this.p = { W1: mk(din * H, Math.sqrt(2 / din)), b1: new Float32Array(H), W2: mk(H * C, Math.sqrt(1 / H)), b2: new Float32Array(C) }; this.m = {}; this.v = {}; for (const k in this.p) { this.m[k] = new Float32Array(this.p[k].length); this.v[k] = new Float32Array(this.p[k].length); } this.t = 0; }
Closed.prototype.fwd = function (x) { const { W1, b1, W2, b2 } = this.p, H = this.H, C = this.C, din = this.din; const h = new Float32Array(H); for (let j = 0; j < H; j++) h[j] = b1[j]; for (let i = 0; i < din; i++) { const xi = x[i]; if (!xi) continue; const o = i * H; for (let j = 0; j < H; j++) h[j] += xi * W1[o + j]; } for (let j = 0; j < H; j++) if (h[j] < 0) h[j] = 0; const z = new Float32Array(C); for (let c = 0; c < C; c++) z[c] = b2[c]; for (let j = 0; j < H; j++) { const hj = h[j]; if (!hj) continue; const o = j * C; for (let c = 0; c < C; c++) z[c] += hj * W2[o + c]; } let mx = -1e9; for (let c = 0; c < C; c++) mx = Math.max(mx, z[c]); let s = 0; for (let c = 0; c < C; c++) { z[c] = Math.exp(z[c] - mx); s += z[c]; } for (let c = 0; c < C; c++) z[c] /= s; return { h, p: z }; };
Closed.prototype.step = function (xs, ys, lr) { const { W2 } = this.p, H = this.H, C = this.C, din = this.din; const g = {}; for (const k in this.p) g[k] = new Float32Array(this.p[k].length); let L = 0; const B = xs.length;
  for (let b = 0; b < B; b++) { const x = xs[b], { h, p } = this.fwd(x); L -= Math.log(p[ys[b]] + 1e-12); p[ys[b]] -= 1; const dh = new Float32Array(H); for (let j = 0; j < H; j++) { if (!h[j]) continue; const o = j * C; for (let c = 0; c < C; c++) { g.W2[o + c] += h[j] * p[c]; dh[j] += W2[o + c] * p[c]; } } for (let c = 0; c < C; c++) g.b2[c] += p[c]; for (let i = 0; i < din; i++) { const xi = x[i]; if (!xi) continue; const o = i * H; for (let j = 0; j < H; j++) if (h[j]) g.W1[o + j] += xi * dh[j]; } for (let j = 0; j < H; j++) if (h[j]) g.b1[j] += dh[j]; }
  this.t++; const b1 = 0.9, b2 = 0.999; for (const k in this.p) { const P = this.p[k], G = g[k], M = this.m[k], Vv = this.v[k]; for (let i = 0; i < P.length; i++) { const gi = G[i] / B; M[i] = b1 * M[i] + (1 - b1) * gi; Vv[i] = b2 * Vv[i] + (1 - b2) * gi * gi; P[i] -= lr * (M[i] / (1 - Math.pow(b1, this.t))) / (Math.sqrt(Vv[i] / (1 - Math.pow(b2, this.t))) + 1e-8); } } return L / B; };
Closed.prototype.probs = function (xs) { return xs.map(x => this.fwd(x).p); };
function trainClosed(model, xs, ys, opt, onTick, onDone) { const o = Object.assign({ epochs: 8, B: 64, lr: 3e-3, seed: 0 }, opt); const r = rng(o.seed + 5); const n = xs.length; let ep = 0, k = 0, idx = null, stop = false; const t0 = performance.now();
  function tick() { if (stop) return; const t1 = performance.now(); while (performance.now() - t1 < 40) { if (!idx || k >= n) { if (idx) ep++; if (ep >= o.epochs) { model.ms = performance.now() - t0; return onDone && onDone(model); } idx = Array.from({ length: n }, (_, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; } k = 0; } const bi = idx.slice(k, k + o.B); k += o.B; model.last = model.step(bi.map(i => xs[i]), bi.map(i => ys[i]), o.lr); } onTick && onTick(ep + k / n); setTimeout(tick, 0); }
  setTimeout(tick, 0); return { stop() { stop = true; } }; }
V7.Closed = Closed; V7.trainClosed = trainClosed;
const SEEN = []; V7.SHAPES.forEach(sh => V7.COLORS.forEach(c => V7.SIZES.forEach(s => { if (!V7.HOLD.includes(sh + ' ' + c)) SEEN.push([sh, c, s]); })));
const keyOf = l => l.join(' ');
/* the course's closed classifier, trained once on the shared data with labels instead of captions */
V7.ensureClosed = function (out, done) { const st = V7.state; if (st.closed && st.closed.done) return done(st.closed); if (st.closedJob) { const iv = setInterval(() => { if (st.closed.done) { clearInterval(iv); done(st.closed); } }, 400); return; }
  st.data = st.data || T.makeData(6000, 1); const xs = st.data.xsC || (st.data.xsC = st.data.X.map(T.prepChroma)); const ys = st.data.lab.map(l => SEEN.findIndex(c => keyOf(c) === keyOf(l))); const m = new Closed(768, 64, SEEN.length, 0); st.closed = m;
  st.closedJob = trainClosed(m, xs, ys, { epochs: 15 }, e => { out.innerHTML = 'מאמן מסווג סגור (24 מחלקות, אותו קלט רוויה, כחצי דקה): סבב ' + F(e, 1) + ' מתוך 15...'; }, () => { m.done = true; done(m); }); };

/* 9.1 — open vs closed on the same crops */
W.w7_open_vs_closed = function (box) {
  V.say(box, 'הניסוי של 9.1, בדפדפן: מסווג <b>סגור</b> רגיל — אותו קלט רוויה, אותה שכבה נסתרת (64 כאן), softmax על 24 המחלקות שבאימון — מול המסווג <b>הפתוח</b> הסיגמואידי. שניהם על אותם חיתוכים מ־100 הסצנות של פרק 7. ולמטה — הבדיקה של תרגיל 9.4★: כמה הסגור <i>בטוח בעצמו</i> על צירופים שלא ראה.');
  let nPer = 0; const r1 = row(box); V.tabs(r1, ['סגור — כל התוויות (6,000)', 'סגור — 20 תוויות למחלקה'], k => { nPer = k ? 20 : 0; draw(); });
  const cv = canvas(box, 760, 170, 760); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function trainSmall(done) { const st = V7.state; if (st.closed20 && st.closed20.done) return done(st.closed20); const xs = [], ys = []; const cnt = {}; st.data.lab.forEach((l, i) => { const k = keyOf(l); cnt[k] = (cnt[k] || 0) + 1; if (cnt[k] <= 20) { xs.push(st.data.xsC[i]); ys.push(SEEN.findIndex(c => keyOf(c) === k)); } }); const m = new Closed(768, 64, SEEN.length, 1); st.closed20 = m; trainClosed(m, xs, ys, { epochs: 60, B: 32 }, e => { out.innerHTML = 'מאמן סגור על 20 תוויות למחלקה (480 בסך הכול)...'; }, () => { m.done = true; done(m); }); }
  function draw() { V7.ensure('chroma|sig', out, mo => V7.ensureClosed(out, mc0 => { const go = mc => { const D = V7.detSet(100); const it = D.items.filter(i => i.lab); const xs = it.map(i => T.prepChroma(i.crop)); const unseen = it.map(i => V7.HOLD.includes(i.lab[0] + ' ' + i.lab[1]));
      let t0 = performance.now(); const P = mc.probs(xs); const tC = (performance.now() - t0) / xs.length; t0 = performance.now(); const z = mo.zeroshot(xs, it.map(i => i.lab)); const tO = (performance.now() - t0) / xs.length;
      const acc = (pred, f) => { let a = 0, n = 0; it.forEach((x, i) => { if (f(i)) { n++; if (pred(i)) a++; } }); return n ? a / n : 0; };
      const cOK = i => keyOf(SEEN[P[i].indexOf(Math.max(...P[i]))]) === keyOf(it[i].lab), oOK = i => z.pred[i].join() === it[i].lab.join();
      const conf = it.map((_, i) => Math.max(...P[i])).filter((_, i) => unseen[i]).sort((a, b) => a - b); const med = conf[conf.length >> 1] || 0, hi = conf.filter(v => v > 0.9).length / Math.max(conf.length, 1);
      tb.innerHTML = table(['מודל', 'מחלקות שנראו', 'צירופים שלא נראו', 'זמן לחיתוך (כאן, כולל המקודד)'], [['סגור, ' + (nPer ? '20 תוויות למחלקה' : '6,000 תוויות'), '<b>' + F(100 * acc(cOK, i => !unseen[i]), 1) + '%</b>', F(100 * acc(cOK, i => unseen[i]), 1) + '% (אין לו מחלקה כזו)', F(tC, 3) + ' מ"ש'], ['פתוח, בלי תוויות', F(100 * acc(oOK, i => !unseen[i]), 1) + '%', '<b>' + F(100 * acc(oOK, i => unseen[i]), 1) + '%</b>', F(tO, 3) + ' מ"ש'], ['בקורס: סגור / פתוח', '100% / 92.4%', '0% / 88.6%', '0.019 / 0.009 מ"ש (מתכונות)']]);
      const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 170); const bins = new Array(20).fill(0); conf.forEach(v => bins[Math.min(19, Math.floor(v * 20))]++); const mx = Math.max(...bins, 1); bins.forEach((b, k) => { const h = 110 * b / mx; x.fillStyle = k >= 18 ? '#c92a2a' : '#adb5bd'; x.fillRect(740 - (k + 1) * 34, 130 - h, 30, h); }); txt(x, 'הביטחון של הסגור (ההסתברות הגבוהה) על חיתוכים מצירופים שלא ראה — וכולם טעויות', 740, 18, '#495057', 11, 'right'); txt(x, '1.0', 60, 148, '#868e96', 10, 'center'); txt(x, '0', 740, 148, '#868e96', 10, 'center'); txt(x, 'חציון ' + F(med, 3) + ' · מעל 0.9: ' + F(100 * hi, 1) + '%', 400, 165, '#c92a2a', 12, 'center', true);
      out.innerHTML = 'הסגור מנצח על מה שהוא מכיר — ' + (nPer ? 'גם עם 20 תוויות בלבד למחלקה' : 'עם כל התוויות') + ' — ועיוור לגמרי לשאר. הפתוח משלם כמה אחוזים על הכלליות, ומכסה את מה שלא ראה. <b>והגרף:</b> על צירופים שלא ראה הסגור תמיד טועה, ובכל זאת הוא בטוח בעצמו (בקורס: חציון 0.998, ו־88.3% מעל 0.9) — לכן "לעבור לפתוח כשהסגור לא בטוח" לא עובד (תרגיל 9.4★). המספרים כאן ממודלים קטנים שאומנו בדפדפן; הזמנים כוללים את כל הרשת, ושניהם באותו סדר גודל.'; };
    nPer ? trainSmall(go) : go(mc0); })); }
  draw();
};

/* 9.2 — the decision table as questions */
W.w7_decision = function (box) {
  V.say(box, 'טבלת ההחלטה של 9.2, כשאלות. ענה על המצב שלך — והשורה המתאימה מסומנת, עם מה לעשות עכשיו.');
  const Q = [['permanent', 'המטרה תהיה קבועה במערכת (חודשים)?'], ['labels', 'יש (או אפשר לאסוף בימים) עשרות דוגמאות מתויגות?'], ['today', 'צריך כיסוי כבר היום?'], ['human', 'אדם עובר על כל תוצאה בכל מקרה?'], ['rare', 'המטרה נדירה מאוד — כמעט אין דוגמאות בעולם?']]; const a = { permanent: true, labels: true, today: false, human: false, rare: false };
  const r1 = el('div', { style: 'display:flex;flex-direction:column;gap:4px' }); box.appendChild(r1); Q.forEach(([k, l]) => { const c = el('label', { html: '<input type="checkbox"' + (a[k] ? ' checked' : '') + '> ' + l }); c.querySelector('input').onchange = e => { a[k] = e.target.checked; draw(); }; r1.appendChild(c); });
  const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  const ROWS = [['מטרה קבועה, יש תוויות', 'סגור', 'מדויק יותר, סף יציב, קל לאשר מבחינת בטיחות'], ['מטרה חדשה שצריך היום', 'פתוח', 'אין זמן לאסוף ולתייג'], ['חיפוש חד־פעמי בארכיון', 'פתוח', 'אדם מסנן את התוצאות בכל מקרה'], ['מטרה נדירה שאי אפשר לאסוף עליה דוגמאות', 'פתוח, עם בדיקה ידנית', 'אין ברירה אחרת'], ['מטרה חדשה שתהיה קבועה בהמשך', 'פתוח עכשיו, סגור אחר כך', 'ראו 9.3']];
  function pick() { if (a.rare) return 3; if (!a.permanent && a.human) return 2; if (a.permanent && a.today) return 4; if (a.permanent && a.labels) return 0; if (a.permanent && !a.labels) return 4; return 1; }
  const NEXT = ['מאמנים מזהה סגור (מודול 4) על התוויות, מכיילים סף, ומייצאים (מודול 6). מדויק ויציב.', 'מגדירים את התיאור ב־YOLO-World, מכיילים סף על כמה עשרות פריימים (תרגיל 7.2), והתראות עוברות אישור אנושי. אומרים במפורש שהאמינות נמוכה משל מטרה מאומנת.', 'חיפוש בארכיון (פרק 6) — דירוג, בלי סף; האדם עובר על הראש. אין טעם לאמן כלום.', 'פתוח, עם אישור אנושי לכל התראה, ותמונת דוגמה במקום תיאור אם אפשר (YOLOE). כל זיהוי מאושר נשמר — אולי יום אחד יהיו מספיק.', 'הדרך המשולבת של 9.3: פתוח מהיום הראשון עם אישור אנושי; הזיהויים המאושרים הם התוויות; כשיש מספיק — מאמנים סגור ומחליפים.'];
  function draw() { const k = pick(); tb.innerHTML = table(['מצב', 'בחירה', 'למה'], ROWS.map((r, i) => i === k ? r.map(c => '<b style="color:#1c7ed6">' + c + '</b>') : r)); out.innerHTML = '<b>מה עושים עכשיו:</b> ' + NEXT[k] + (a.today && a.labels && a.permanent ? ' (יש תוויות, אבל צריך היום — האימון לוקח ימים, אז מתחילים בפתוח.)' : ''); }
  draw();
};

/* 9.3 — the combined way, for real: the open model labels, a person reviews, a closed model learns the new class */
W.w7_hybrid = function (box) {
  V.say(box, 'הדרך המשולבת של 9.3 — כניסוי אמיתי על הצורות. המטרה החדשה: <b>משולש כחול</b> (צירוף שאף מודל לא ראה). (1) המודל הפתוח מסמן בארכיון של סצנות את החיתוכים שמעל סף; (2) "אדם" עובר עליהם ומוחק טעויות (כאן — לפי האמת); (3) מאמנים מסווג סגור עם מחלקה 25 — "משולש כחול" — על מה שנשאר. בודקים על 100 סצנות <b>חדשות</b>: מי מוצא משולשים כחולים טוב יותר — הפתוח או הסגור שאומן על התוויות שלו?');
  let nSc = 150, thr = 0.5, review = true, busy = false; const r1 = row(box); V.slider(r1, 'סצנות בארכיון', 30, 300, 10, nSc, v => { nSc = v; }); V.slider(r1, 'סף של הפתוח לתיוג', 0.05, 0.95, 0.01, thr, v => { thr = v; }); const c = el('label', { html: ' <input type="checkbox" checked> אדם עובר ומתקן' }); c.querySelector('input').onchange = e => { review = e.target.checked; }; r1.appendChild(c); V.btns(r1, [['▶ הרץ את הניסוי', () => run(), 'primary']]);
  const tb = el('div'); box.appendChild(tb); const out = V.say(box); out.innerHTML = 'בחר ולחץ "הרץ". אימון הסגור לוקח כמה שניות.';
  const isBT = l => l && l[0] === 'triangle' && l[1] === 'blue';
  function crops(from, n) { const it = []; for (let k = 0; k < n; k++) { const sc = V7.det.scene(from + k); const P = V7.det.proposals(sc); P.boxes.forEach((b, i) => { let best = null, bv = 0; sc.objs.forEach(o => { const ix = Math.max(0, Math.min(b[2], o.box[2]) - Math.max(b[0], o.box[0])), iy = Math.max(0, Math.min(b[3], o.box[3]) - Math.max(b[1], o.box[1])); const I = ix * iy, u = (b[2] - b[0]) * (b[3] - b[1]) + (o.box[2] - o.box[0]) * (o.box[3] - o.box[1]) - I; if (I / u > bv) { bv = I / u; best = o; } }); it.push({ x: T.prepChroma(P.crops[i]), lab: bv > 0.5 ? [best.sh, best.c, best.s] : null }); }); } return it; }
  function run() { if (busy) return; busy = true; V7.ensure('chroma|sig', out, mo => { const d = mo.o.d, s = Math.exp(mo.p.t[0]), bb = mo.p.bias[0]; const q = mo.txt(['a blue triangle']); const prob = it => { const U = mo.img(it.map(i => i.x)); return it.map((_, i) => { let v = 0; for (let j = 0; j < d; j++) v += U[i * d + j] * q[j]; return 1 / (1 + Math.exp(-(s * v + bb))); }); };
      const arch = crops(2000, nSc), test = crops(5000, 100); const pa = prob(arch); const cand = arch.filter((_, i) => pa[i] >= thr); const kept = review ? cand.filter(i => isBT(i.lab)) : cand; const wrong = kept.filter(i => !isBT(i.lab)).length; const totalBT = arch.filter(i => isBT(i.lab)).length;
      if (!kept.length) { busy = false; out.innerHTML = 'אין אף חיתוך מעל הסף — הורד את הסף.'; return; }
      const st = V7.state; st.data = st.data || T.makeData(6000, 1); const xsC = st.data.xsC || (st.data.xsC = st.data.X.map(T.prepChroma)); const xs = xsC.slice(), ys = st.data.lab.map(l => SEEN.findIndex(cc => keyOf(cc) === keyOf(l))); const rep = Math.max(1, Math.round(250 / kept.length)); for (let k = 0; k < rep; k++) kept.forEach(i => { xs.push(i.x); ys.push(SEEN.length); });
      const mc = new Closed(768, 64, SEEN.length + 1, 3); trainClosed(mc, xs, ys, { epochs: 6 }, e => { out.innerHTML = 'תוויות: ' + kept.length + (review ? ' (אחרי ביקורת)' : ' (בלי ביקורת, ' + wrong + ' שגויות)') + ' · מאמן סגור עם 25 מחלקות: סבב ' + F(e, 1) + ' מתוך 6...'; }, () => {
        const pt = prob(test); const P = mc.probs(test.map(i => i.x)); const yT = test.map(i => isBT(i.lab)); const pr = sel => { const tp = sel.filter((v, i) => v && yT[i]).length, ns = sel.filter(Boolean).length, np = yT.filter(Boolean).length; return [ns ? tp / ns : 1, np ? tp / np : 0]; };
        const oSel = pt.map(p => p >= thr); const cSel = P.map(p => p.indexOf(Math.max(...p)) === SEEN.length); const [op, orc] = pr(oSel), [cp, crc] = pr(cSel); const lab20 = test.filter(i => i.lab && !isBT(i.lab)); let keepOld = 0; test.forEach((it, i) => { if (it.lab && !isBT(it.lab) && !V7.HOLD.includes(it.lab[0] + ' ' + it.lab[1])) { const k = P[i].indexOf(Math.max(...P[i])); if (k < SEEN.length && keyOf(SEEN[k]) === keyOf(it.lab)) keepOld++; } }); const nOld = test.filter(it => it.lab && !isBT(it.lab) && !V7.HOLD.includes(it.lab[0] + ' ' + it.lab[1])).length;
        tb.innerHTML = table(['', 'ערך'], [['משולשים כחולים בארכיון', totalBT], ['מעל הסף של הפתוח', cand.length + ' (מהם נכונים ' + cand.filter(i => isBT(i.lab)).length + ')'], ['תוויות לאימון הסגור', kept.length + (review ? ' — כולן נכונות' : ' — <b>' + wrong + ' שגויות</b>')], ['על 100 סצנות חדשות — פתוח, בסף ' + F(thr, 2), 'דיוק ' + F(100 * op, 1) + '% · כיסוי ' + F(100 * orc, 1) + '%' + ' · F1 ' + F(2 * op * orc / Math.max(op + orc, 1e-9), 2)], ['על 100 סצנות חדשות — סגור שאומן על התוויות', 'דיוק <b>' + F(100 * cp, 1) + '%</b> · כיסוי <b>' + F(100 * crc, 1) + '%</b> · F1 ' + F(2 * cp * crc / Math.max(cp + crc, 1e-9), 2)], ['הסגור על 24 המחלקות הישנות', F(100 * keepOld / Math.max(nOld, 1), 1) + '% (שלא נשכחו)']]);
        const f1 = (p, r) => p + r ? 2 * p * r / (p + r) : 0; const better = f1(cp, crc) > f1(op, orc) + 0.01; out.innerHTML = 'הסגור שאומן על ' + kept.length + ' תוויות ' + (better ? '<b>עקף את הפתוח שתייג לו אותן</b>: הוא למד מה משותף לדוגמאות של המחלקה, ואינו תלוי בסף של הפתוח, שמפספס משולשים עם הסתברות נמוכה. ' : '<b>לא עקף את הפתוח</b> הפעם — מעט תוויות, או תוויות שגויות. ') + (review ? 'עם ביקורת התוויות נקיות; הפתוח רק מציע מועמדים, ולכן לתיוג אפשר להוריד את הסף — הביקורת תנקה. ' : 'בלי ביקורת, כל טעות של הפתוח נכנסת כתווית, והסגור לומד אותה בביטחון. נסה סף נמוך בלי ביקורת — ואז עם. ') + 'זה הטיעון של 9.3: הפתוח מתייג, אדם מתקן — מהר בהרבה מלתייג מאפס — והסגור מזהה, מהר ובסף יציב. זו ריצה אחת על כמה עשרות תוויות, במודלים קטנים; התוצאות זזות בין ריצות ובין ארכיונים.'; busy = false; }); }); }
};
})();

/* ===================================================================== chapter 10 */
(function () {
const W = window.W, V = window.V, el = V.el, D4 = window.D4; const { F, canvas, table, row, txt } = D4; const V7 = window.VL7, T = V7.TC;
const matches = (q, l) => { const w = q.toLowerCase().split(/\s+/); return [V7.SHAPES, V7.COLORS, V7.SIZES].every((g, k) => { const asked = g.filter(v => w.includes(v)); return !asked.length || asked.includes(l[k]); }); };
V7.proj = V7.proj || {};
/* 10.1 — part A on the archive of chapter 6: build, search, evaluate by query type */
W.w7_index_build = function (box) {
  V.say(box, 'חלק א של הפרויקט, על הארכיון של פרק 6 (5,000 "פריימים", 1,000 מהם צירופים שלא נראו): בונים אינדקס פעם אחת, ומריצים את <b>סט ההערכה</b> — 15 שאילתות בשלושה סוגים, עם התשובות הנכונות. בעולם האמיתי הסוג השלישי הוא יחס ("אדם ליד משאית"); אצלנו אין יחסים, ולכן הוא צירוף שהמודל לא ראה. אפשר להוסיף שאילתה משלך.');
  const QS = { 'שם עצם': ['a circle', 'a square', 'a triangle', 'a cross', 'a red shape'], 'עם תכונה': ['a large green circle', 'a small red cross', 'a yellow square', 'a large blue square', 'a small yellow triangle'], 'צירוף שלא נראה': ['a blue triangle', 'a yellow circle', 'a red square', 'a green cross', 'a small blue triangle'] };
  let half = true; const r1 = row(box); const c = el('label', { html: '<input type="checkbox" checked> אינדקס ב־16 סיביות' }); c.querySelector('input').onchange = e => { half = e.target.checked; draw(); }; r1.appendChild(c); const inp = el('input', { type: 'text', value: '', placeholder: 'a large red triangle', class: 'ltr', style: 'width:220px' }); inp.onchange = draw; r1.appendChild(inp);
  const tb = el('div'); box.appendChild(tb); const tb2 = el('div'); box.appendChild(tb2); const out = V.say(box);
  function draw() { V7.ensure('chroma|sig', out, m => { const a = V7.archive(); const I = V7.indexOf(m); const d = m.o.d, N = a.X.length; const f16 = x => { const b = new Float32Array(1); b[0] = x; const u = new Uint32Array(b.buffer)[0]; const e = ((u >> 23) & 255) - 127; if (e < -14) return 0; const k = Math.pow(2, e - 10); return Math.round(x / k) * k; }; const Ix = half ? (m.index16 || (m.index16 = I.map(f16))) : I;
      const run = q => { const t0 = performance.now(); const v = m.txt([q]); const sc = new Float32Array(N); for (let i = 0; i < N; i++) { let s = 0; for (let j = 0; j < d; j++) s += Ix[i * d + j] * v[j]; sc[i] = s; } const top = Array.from(sc.keys()).sort((x, y) => sc[y] - sc[x]).slice(0, 10); const ms = performance.now() - t0; return { p10: top.filter(i => matches(q, a.lab[i])).length, ms }; };
      const rows = [], mean = {}; let tq = 0, nq = 0; Object.entries(QS).forEach(([ty, qs]) => { const r = qs.map(q => { const o = run(q); tq += o.ms; nq++; return [q, o.p10]; }); mean[ty] = r.reduce((s, x) => s + x[1], 0) / r.length; rows.push(['<b>' + ty + '</b>', r.map(([q, p]) => '<span class="ltr">' + q + '</span> — ' + p).join('<br>'), '<b>' + F(mean[ty], 1) + '</b> / 10']); });
      if (inp.value.trim()) { const o = run(inp.value.trim()); rows.push(['שלך', '<span class="ltr">' + inp.value + '</span>', o.p10 + ' / 10']); }
      tb.innerHTML = table(['סוג', 'שאילתות — נכונים בעשרה', 'ממוצע'], rows);
      const mb = N * d * (half ? 2 : 4) / 1e6; const simple = (mean['שם עצם'] + mean['עם תכונה']) / 2; V7.proj.index = { p10: simple, ms: tq / nq, buildMs: m.indexMs };
      tb2.innerHTML = table(['', 'כאן', 'בפרויקט (10 שעות, SigLIP 2 בסיסי)'], [['פריימים', N.toLocaleString(), '36,000'], ['ממד', d, '768'], ['גודל האינדקס', F(mb, 2) + ' MB', F(36000 * 768 * (half ? 2 : 4) / 1e6, 1) + ' MB'], ['בניית האינדקס', F(m.indexMs / 1000, 2) + ' ש׳', 'דקות על כרטיס, יותר על מעבד'], ['זמן לשאילתה (ממוצע)', F(tq / nq, 1) + ' מ"ש', 'תנאי קבלה: פחות משנייה']]);
      out.innerHTML = 'שאילתות פשוטות (שני הסוגים הראשונים): <b>' + F(simple, 1) + ' מתוך 10</b> — תנאי הקבלה הוא לפחות 7. הסוג השלישי ' + (mean['צירוף שלא נראה'] < simple ? 'חלש יותר, כצפוי (פרק 4)' : 'לא חלש הפעם — במודל הרוויה ההכללה לצירופים טובה') + ' — ובפרויקט האמיתי, שם זה יחס, צפו שיהיה החלש ביותר. ‏16 סיביות ' + (half ? 'חוסכות חצי זיכרון בלי לשנות את הדירוג כמעט — בטל את הסימון והשווה.' : 'כבויות: הזיכרון כפול, והמספרים כמעט זהים.'); }); }
  draw();
};

/* 10.2 — part B: add-target, end to end, with every step measured */
W.w7_add_target = function (box) {
  V.say(box, 'חלק ב — <code class="ltr">add-target</code> מקצה לקצה, על הסצנות של פרק 7: (1) <b>הגדרה</b> — קידוד התיאור, פעם אחת; (2) <b>כיול</b> — המזהה הפתוח על 200 סצנות מהארכיון, "תיוג" מהיר של הזיהויים (כאן — לפי האמת), ובחירת סף שממקסם F1 באמצע הפער (תרגיל 7.9); (3) <b>שילוב</b> — על 100 סצנות חדשות, כל זיהוי מעל הסף הוא התראה עם תג "מטרה פתוחה — דורש אישור". הקלד מטרה והפעל.');
  let busy = false; const r1 = row(box); const inp = el('input', { type: 'text', value: 'a small green cross', class: 'ltr', style: 'width:220px' }); r1.appendChild(inp); V.btns(r1, [['▶ add-target', () => go(), 'primary']]);
  const cv = canvas(box, 760, 120, 760); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  const crops = (from, n) => { const it = []; for (let k = 0; k < n; k++) { const sc = V7.det.scene(from + k); const P = V7.det.proposals(sc); P.boxes.forEach((b, i) => { let best = null, bv = 0; sc.objs.forEach(o => { const ix = Math.max(0, Math.min(b[2], o.box[2]) - Math.max(b[0], o.box[0])), iy = Math.max(0, Math.min(b[3], o.box[3]) - Math.max(b[1], o.box[1])); const I = ix * iy, u = (b[2] - b[0]) * (b[3] - b[1]) + (o.box[2] - o.box[0]) * (o.box[3] - o.box[1]) - I; if (I / u > bv) { bv = I / u; best = o; } }); it.push({ x: T.prepChroma(P.crops[i]), lab: bv > 0.5 ? [best.sh, best.c, best.s] : null, scene: k }); }); } return it; };
  function go() { if (busy) return; busy = true; const q = inp.value.trim(); V7.ensure('chroma|sig', out, m => { const d = m.o.d, s = Math.exp(m.p.t[0]), bb = m.p.bias[0]; const T0 = []; let t = performance.now();
      const qv = m.txt([q]); T0.push(['הגדרה: קידוד התיאור', performance.now() - t]); t = performance.now();
      const cal = crops(3000, 200); const U = m.img(cal.map(i => i.x)); const pc = cal.map((_, i) => { let v = 0; for (let j = 0; j < d; j++) v += U[i * d + j] * qv[j]; return 1 / (1 + Math.exp(-(s * v + bb))); }); T0.push(['כיול: הפתוח על 200 סצנות', performance.now() - t]); t = performance.now();
      const yc = cal.map(i => !!i.lab && matches(q, i.lab)); const o = pc.map((p, i) => i).sort((a, b) => pc[b] - pc[a]); const P = yc.filter(Boolean).length; let tp = 0, best = -1, bk = 0; o.forEach((i, k) => { if (yc[i]) tp++; const f = 2 * tp / (k + 1 + P); if (f > best) { best = f; bk = k; } }); const thr = bk + 1 < o.length ? (pc[o[bk]] + pc[o[bk + 1]]) / 2 : pc[o[bk]]; T0.push(['כיול: בחירת סף', performance.now() - t]); t = performance.now();
      const test = crops(6000, 100); const Ut = m.img(test.map(i => i.x)); const pt = test.map((_, i) => { let v = 0; for (let j = 0; j < d; j++) v += Ut[i * d + j] * qv[j]; return 1 / (1 + Math.exp(-(s * v + bb))); }); const ms = (performance.now() - t) / 100; T0.push(['שילוב: 100 סצנות חדשות', performance.now() - t]);
      const yt = test.map(i => !!i.lab && matches(q, i.lab)); const sel = pt.map(p => p >= thr); const TP = sel.filter((v, i) => v && yt[i]).length, NS = sel.filter(Boolean).length, NP = yt.filter(Boolean).length; const prec = NS ? TP / NS : 1, rec = NP ? TP / NP : 0; const scenesAlert = new Set(test.filter((_, i) => sel[i]).map(i => i.scene)).size;
      const x = cv.getContext('2d'); x.clearRect(0, 0, 760, 120); const tot = T0.reduce((a, r) => a + r[1], 0); let X = 740; const cols = ['#2f9e44', '#1c7ed6', '#74c0fc', '#e8590c']; T0.forEach(([n, v], k) => { const w = Math.max(3, 700 * v / tot); x.fillStyle = cols[k]; x.fillRect(X - w, 20, w, 36); if (w > 90) txt(x, n, X - w / 2, 43, '#fff', 10, 'center', true); X -= w; }); txt(x, 'סה"כ ' + F(tot / 1000, 2) + ' שניות של חישוב (בלי התיוג של האדם)', 740, 80, '#212529', 12, 'right', true);
      V7.proj.target = { q, thr, prec, rec, NP, msPerScene: ms };
      tb.innerHTML = table(['', 'ערך'], [['מטרות בסצנות הכיול', P + ' (מתוך ' + cal.length + ' חיתוכים)'], ['סף שנבחר', F(thr, 3) + ' (F1 בכיול ' + F(best, 2) + ')'], ['על 100 סצנות חדשות', 'דיוק <b>' + F(100 * prec, 1) + '%</b> · כיסוי <b>' + F(100 * rec, 1) + '%</b> (' + NP + ' מטרות)'], ['התראות "מטרה פתוחה — דורש אישור"', NS + ' זיהויים ב־' + scenesAlert + ' סצנות'], ['זמן לסצנה עם המטרה', F(ms, 2) + ' מ"ש']]);
      out.innerHTML = (P < 10 ? '<b>מעט מטרות בכיול (' + P + ')</b> — הסף רועש; בפרויקט האמיתי מוסיפים פריימים עד שיש כמה עשרות. ' : '') + 'בפרויקט אותם צעדים: <code class="ltr">set_classes</code> במקום <code class="ltr">m.txt</code>, ‏200 פריימים מהארכיון, תיוג מהיר של אדם (זה רוב השעה של תנאי הקבלה), וסף נפרד לכל מטרה. ' + (prec < 0.8 ? 'הדיוק כאן נמוך — ולכן התג "דורש אישור" אינו קישוט: הוא מה שמונע מהתראות שווא להגיע למפעיל כעובדה.' : 'גם עם דיוק טוב — התג נשאר עד שהמטרה עוברת לסגור (9.3).'); busy = false; }); }
};

/* 10.3 — the acceptance conditions, filled from what was measured */
W.w7_acceptance = function (box) {
  V.say(box, 'תנאי הקבלה של הפרויקט כרשימת בדיקה. הערכים מתמלאים ממה שמדדת בהדמיות של 10.1 ו־10.2 (אם הרצת אותן), ואפשר לשנות כל ערך ידנית — למשל למדידות מהפרויקט האמיתי שלך.');
  const P = V7.proj || {}; const f = [['ms', 'זמן שאילתה בארכיון (מ"ש)', P.index ? +F(P.index.ms, 1) : 15, v => v < 1000, 'פחות משנייה'], ['p10', 'דיוק בעשרה, שאילתות פשוטות (ממוצע)', P.index ? +F(P.index.p10, 1) : 7.5, v => v >= 7, 'לפחות 7 מתוך 10'], ['min', 'הוספת מטרה עד שהיא במערכת, כולל כיול (דקות)', 45, v => v < 60, 'פחות משעה'], ['fps', 'ירידה בקצב המערכת החיה (%)', 3, v => v <= 10, 'ללא ירידה מהותית (כאן: עד 10%)'], ['rep', 'טבלת סף/דיוק/כיסוי לכל מטרה + 3 כישלונות מתועדים (0 או 1)', P.target ? 1 : 0, v => v >= 1, 'קיים'], ['ui', 'סימון "מטרה פתוחה — לא אומתה" בממשק (0 או 1)', 1, v => v >= 1, 'קיים — לא מוותרים']];
  const vals = {}; const grid = el('div', { style: 'display:grid;grid-template-columns:auto 110px;gap:6px 12px;align-items:center' }); box.appendChild(grid); f.forEach(([k, l, v0]) => { vals[k] = v0; grid.appendChild(el('span', { html: l })); const i = el('input', { type: 'number', value: v0, step: 'any', style: 'width:100px' }); i.oninput = () => { vals[k] = +i.value; draw(); }; grid.appendChild(i); });
  const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const res = f.map(([k, l, , ok, goal]) => [l, goal, vals[k], ok(vals[k])]); tb.innerHTML = table(['תנאי', 'יעד', 'נמדד', 'עובר?'], res.map(([l, g, v, ok]) => [l, g, v, ok ? '✅' : '❌'])); const bad = res.filter(r => !r[3]); out.innerHTML = !bad.length ? '<b>כל התנאים עוברים.</b> ובדוח — גם המספרים, גם שלוש דוגמאות כישלון אמיתיות (מה זוהה, מה היה נכון, למה כנראה טעה). דוח בלי כישלונות הוא דוח שלא בדק.' : '<b>' + bad.length + ' תנאים לא עוברים:</b> ' + bad.map(r => r[0]).join('; ') + '. ' + (bad.some(r => r[0].includes('סימון')) ? 'הסימון בממשק הוא אחת משתי הדרישות שלא מוותרים עליהן — בלעדיו מפעיל לא יודע מה אומת ומה לא.' : 'מה עושים: לא מורידים את היעד — מחפשים את הסיבה (תרגיל 10.2 לסדר הבדיקה).'); }
  draw();
};
})();
