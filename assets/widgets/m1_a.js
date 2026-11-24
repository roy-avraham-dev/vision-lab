/* Module 1 visuals — chapters 1–3: images and video, color spaces, thresholds and masks */
(function () {
const W = window.W, V = window.V, IM = window.IM, el = V.el;
const row = (box, ltr) => { const r = V.row(box); if (ltr !== false) { r.style.direction = 'ltr'; r.style.justifyContent = 'center'; r.style.alignItems = 'flex-start'; } return r; };
const col = (parent, title) => { const d = el('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' } }); if (title) d.appendChild(el('div', { class: 'note-small', html: title })); parent.appendChild(d); return d; };
const mono = (parent, txt) => { const d = el('div', { class: 'mono', style: { direction: 'ltr', textAlign: 'left', fontSize: '.85em', background: 'var(--code-bg)', padding: '8px 10px', borderRadius: '8px', whiteSpace: 'pre-wrap' } }); d.textContent = txt; parent.appendChild(d); return d; };

/* 1.1 an image is an array: fill it, and see the BGR/RGB mix-up */
W.w1_imgrw = function (box) {
  V.say(box, 'כל פיקסל בספרייה נשמר בסדר <b>כחול, ירוק, אדום</b>. הזז את שלושת הערכים, וראה מה <code class="inline-code">img[:] = (B, G, R)</code> עושה. אחר כך הדלק את "הצג בלי היפוך" כדי לראות מה קורה כשמציגים עם ספריית הציור ושוכחים את <code class="inline-code">[:, :, ::-1]</code>.');
  let b = 40, g = 40, r = 40, wrong = false;
  const sr = V.row(box);
  V.slider(sr, 'B (כחול)', 0, 255, 1, b, v => { b = v; draw(); }); V.slider(sr, 'G (ירוק)', 0, 255, 1, g, v => { g = v; draw(); }); V.slider(sr, 'R (אדום)', 0, 255, 1, r, v => { r = v; draw(); });
  V.tabs(box, ['הצגה נכונה', 'הצג בלי היפוך'], i => { wrong = i === 1; draw(); });
  const rr = row(box); const cv = IM.canvas(col(rr, 'התמונה (300 על 400, מוקטנת)'), 40, 30, 6); const info = col(rr);
  const code = mono(info, ''); const say = V.say(box);
  function draw() {
    const im = IM.color(40, 30, wrong ? [r, g, b] : [b, g, r]);
    for (let y = 18; y < 30; y++) for (let x = 0; x < 40; x++) IM.set(im, x, y, wrong ? [235, 200, 120] : [120, 200, 235]); // "sky" strip would be at the top; here a sand strip
    for (let y = 0; y < 8; y++) for (let x = 0; x < 40; x++) IM.set(im, x, y, wrong ? [70, 150, 235] : [235, 150, 70]); // blue sky in BGR
    IM.show(cv, im);
    code.textContent = 'img = np.zeros((300, 400, 3), dtype=np.uint8)\nimg[:] = (' + b + ', ' + g + ', ' + r + ')\nprint(img[0, 0])   # [' + b + ' ' + g + ' ' + r + ']  ← B, G, R';
    say.innerHTML = wrong ? 'ספריית הציור קוראת את אותם שלושה מספרים בסדר <b>R, G, B</b>. לכן הכחול והאדום מתחלפים: השמיים הכחולים למעלה נראים כתומים.' : 'הפס העליון הוא שמיים כחולים: בסדר של הספרייה זה (235, 150, 70), כלומר <b>הכחול ראשון</b>.';
  }
  draw();
};

/* 1.2 two coordinate orders */
W.w1_coords = function (box) {
  V.say(box, '<b>לחץ על פיקסל.</b> תראה את אותו מקום בשתי הכתיבות: במערך (שורה, עמודה) ובפונקציות הציור (x, y). אחר כך נסה את האתגר: מצא את הנקודה שהספרייה מבקשת.');
  const w = 12, h = 8; const rr = row(box);
  const svg = V.s('svg', { viewBox: `-30 -24 ${w * 30 + 40} ${h * 30 + 40}`, width: w * 30 + 40, style: { maxWidth: '100%' } }); rr.appendChild(svg);
  const out = V.say(box); let target = null, sel = null;
  const goal = el('div', { class: 'note-small' }); box.appendChild(goal);
  V.btns(box, [['אתגר חדש', () => { target = [Math.floor(Math.random() * w), Math.floor(Math.random() * h)]; draw(); }, 'primary']]);
  function draw() {
    svg.innerHTML = '';
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = V.s('rect', { x: x * 30, y: y * 30, width: 29, height: 29, rx: 3, style: { fill: sel && sel[0] === x && sel[1] === y ? 'var(--c1)' : 'var(--surface2)', stroke: 'var(--line)', cursor: 'pointer' } }, svg); c.addEventListener('click', () => pick(x, y)); }
    for (let x = 0; x < w; x++) V.s('text', { x: x * 30 + 14, y: -6, 'text-anchor': 'middle', 'font-size': 11, style: { fill: 'var(--c2)' }, text: x }, svg);
    for (let y = 0; y < h; y++) V.s('text', { x: -10, y: y * 30 + 19, 'text-anchor': 'middle', 'font-size': 11, style: { fill: 'var(--c4)' }, text: y }, svg);
    V.s('text', { x: w * 30 - 10, y: -6, 'font-size': 11, style: { fill: 'var(--c2)' }, text: 'x →' }, svg); V.s('text', { x: -28, y: h * 30 + 12, 'font-size': 11, style: { fill: 'var(--c4)' }, text: 'y ↓' }, svg);
    goal.innerHTML = target ? 'אתגר: פונקציית ציור קיבלה את הנקודה <b class="ltr" style="display:inline-block">(' + target[0] + ', ' + target[1] + ')</b>. לחץ על הפיקסל הזה.' : '';
  }
  function pick(x, y) {
    sel = [x, y]; draw();
    let s = 'במערך: <b class="ltr" style="display:inline-block">img[' + y + ', ' + x + ']</b> (שורה ' + y + ', עמודה ' + x + '). בציור: <b class="ltr" style="display:inline-block">(' + x + ', ' + y + ')</b>. אותו פיקסל, סדר הפוך.';
    if (target) s += target[0] === x && target[1] === y ? ' <b class="good">נכון!</b> x הוא העמודה.' : ' <span class="bad">לא זה.</span> ' + (target[0] === y && target[1] === x ? 'הפכת את הסדר: בציור x (העמודה) בא ראשון.' : 'חפש שוב: x הוא העמודה, y השורה.');
    out.innerHTML = s;
  }
  draw(); out.innerHTML = 'הצורה של המערך הזה היא <b class="ltr" style="display:inline-block">(8, 12)</b> (גובה, רוחב), אבל פונקציה שמקבלת גודל תבקש <b class="ltr" style="display:inline-block">(12, 8)</b> (רוחב, גובה).';
};

/* 1.3 drawing on an image, and the code line for it */
W.w1_draw = function (box) {
  V.say(box, 'בחר צורה, שנה את הפרמטרים, וקרא את השורה שהספרייה הייתה מקבלת. שים לב שהצבע בסדר <b>B, G, R</b> ושעובי <b>−1</b> פירושו צורה מלאה.');
  let shape = 'מלבן', x = 50, y = 50, s = 100, t = 2, colr = [0, 255, 0];
  V.tabs(box, ['מלבן', 'עיגול', 'קו'], (i, l) => { shape = l; draw(); });
  const sr = V.row(box);
  V.slider(sr, 'x', 0, 380, 5, x, v => { x = v; draw(); }); V.slider(sr, 'y', 0, 280, 5, y, v => { y = v; draw(); }); V.slider(sr, 'גודל', 10, 200, 5, s, v => { s = v; draw(); }); V.slider(sr, 'עובי', -1, 10, 1, t, v => { t = v; draw(); });
  V.tabs(box, ['ירוק (0, 255, 0)', 'אדום (0, 0, 255)', 'כחול (255, 0, 0)', 'תכלת (255, 255, 0)'], i => { colr = [[0, 255, 0], [0, 0, 255], [255, 0, 0], [255, 255, 0]][i]; draw(); });
  const cv = el('canvas', { width: 400, height: 300, style: { width: '400px', maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--line)', background: '#000' } }); const rr = row(box); rr.appendChild(cv);
  const code = mono(box, '');
  function draw() {
    const c = cv.getContext('2d'); c.fillStyle = '#000'; c.fillRect(0, 0, 400, 300);
    const css = 'rgb(' + colr[2] + ',' + colr[1] + ',' + colr[0] + ')'; c.strokeStyle = css; c.fillStyle = css; c.lineWidth = Math.max(1, t);
    const tt = t;
    if (shape === 'מלבן') { if (tt < 0) c.fillRect(x, y, s, s * 0.7); else c.strokeRect(x, y, s, s * 0.7); code.textContent = 'cv2.rectangle(canvas, (' + x + ', ' + y + '), (' + (x + s) + ', ' + Math.round(y + s * 0.7) + '), (' + colr.join(', ') + '), ' + tt + ')'; }
    if (shape === 'עיגול') { c.beginPath(); c.arc(x, y, s / 2, 0, 2 * Math.PI); if (tt < 0) c.fill(); else c.stroke(); code.textContent = 'cv2.circle(canvas, (' + x + ', ' + y + '), ' + (s / 2) + ', (' + colr.join(', ') + '), ' + tt + ')'; }
    if (shape === 'קו') { c.beginPath(); c.moveTo(x, y); c.lineTo(Math.min(399, x + s), Math.min(299, y + s / 2)); c.stroke(); code.textContent = 'cv2.line(canvas, (' + x + ', ' + y + '), (' + Math.min(399, x + s) + ', ' + Math.min(299, Math.round(y + s / 2)) + '), (' + colr.join(', ') + '), ' + Math.max(1, tt) + ')'; }
    c.fillStyle = '#ffff00'; c.font = '16px sans-serif'; c.fillText('(0,0)', 4, 16); c.fillText('x →', 360, 16); c.fillText('y ↓', 4, 290);
  }
  draw();
};

/* 1.4 the video loop: read → process → show → wait */
W.w1_videoloop = function (box) {
  V.say(box, 'וידאו הוא לולאה. לחץ <b>▶</b> וצפה בכדור של <code class="inline-code">ball.mp4</code>: בכל סיבוב קוראים פריים, מעבדים, מציגים, ומחכים למקש. מספר הפריים i קובע את המיקום: <b>x = 50 + 6·i</b>.');
  const steps = ['ok, frame = cap.read()', 'gray = cv2.cvtColor(frame, ...)', 'cv2.imshow("video", ...)', 'if cv2.waitKey(1) & 0xFF == ord("q"): break'];
  const rr = row(box); const cv = el('canvas', { width: 640, height: 480, style: { width: '320px', maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--line)' } }); rr.appendChild(cv);
  const list = el('div', { class: 'mono', style: { direction: 'ltr', fontSize: '.85em', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '260px' } }); rr.appendChild(list);
  const items = steps.map(s => { const d = el('div', { style: { padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--line)' } }); d.textContent = s; list.appendChild(d); return d; });
  const info = V.say(box); let i = 0, st = 0, timer = null, gray = false;
  V.btns(box, [['▶ נגן / עצור', () => { if (timer) { clearInterval(timer); timer = null; } else timer = setInterval(tick, 90); }, 'primary'], ['צעד אחד', () => tick()], ['אפור / צבע', () => { gray = !gray; draw(); }]]);
  function tick() { st = (st + 1) % 4; if (st === 0) i = (i + 1) % 90; draw(); }
  function draw() {
    const c = cv.getContext('2d'); c.fillStyle = '#000'; c.fillRect(0, 0, 640, 480);
    c.fillStyle = gray ? 'rgb(163,163,163)' : 'rgb(255,200,0)'; c.beginPath(); c.arc(50 + i * 6, 240, 20, 0, 7); c.fill();
    c.fillStyle = '#0f0'; c.font = '28px monospace'; c.fillText('frame ' + i + '  FPS 30', 16, 40);
    items.forEach((d, k) => { d.style.background = k === st ? 'var(--accent-bg)' : ''; d.style.borderColor = k === st ? 'var(--accent)' : 'var(--line)'; });
    info.innerHTML = 'פריים <b>' + i + '</b> מתוך 90 · מרכז הכדור <b class="ltr" style="display:inline-block">(' + (50 + 6 * i) + ', 240)</b>' + (i === 89 ? ' · הפריים האחרון: בסיבוב הבא <code class="inline-code">ok</code> יהיה False והלולאה תיגמר.' : '');
  }
  draw();
  const obs = new MutationObserver(() => { if (!document.body.contains(box)) { clearInterval(timer); obs.disconnect(); } }); obs.observe(document.body, { childList: true, subtree: true });
};

/* 1.5 throughput vs latency: a pipeline of stages */
W.w1_fps_latency = function (box) {
  V.say(box, 'צנרת של שלבים שעובדים במקביל, כמו פס ייצור: כל שלב מטפל בפריים אחר באותו רגע. <b>קצב הפריימים</b> נקבע לפי השלב האיטי ביותר. <b>זמן ההשהייה</b> הוא סכום כל השלבים. שנה את מספר השלבים ואת הזמן של כל אחד.');
  let n = 4, ms = 16;
  const sr = V.row(box); V.slider(sr, 'מספר שלבים', 1, 12, 1, n, v => { n = v; draw(); }); V.slider(sr, 'אלפיות שנייה לשלב', 2, 60, 1, ms, v => { ms = v; draw(); });
  const svg = V.s('svg', { viewBox: '0 0 520 130', width: 520, style: { maxWidth: '100%', direction: 'ltr' } }); const rr = row(box); rr.appendChild(svg);
  const out = V.say(box);
  function draw() {
    svg.innerHTML = ''; const fps = 1000 / ms, lat = n * ms;
    for (let f = 0; f < 6; f++) for (let s = 0; s < n; s++) { const x = 10 + (f + s) * (500 / (n + 6)), y = 10 + f * 19; V.s('rect', { x, y, width: 500 / (n + 6) - 2, height: 16, rx: 3, style: { fill: `hsl(${200 + s * 25},60%,${55 + (s % 2) * 8}%)` } }, svg); if (s === 0) V.s('text', { x: x - 2, y: y + 12, 'text-anchor': 'end', 'font-size': 9, style: { fill: 'var(--ink3)' }, text: 'f' + f }, svg); }
    out.innerHTML = 'קצב: <b>' + V.fmt(fps, 1) + '</b> פריימים בשנייה · השהייה: <b>' + lat + '</b> אלפיות שנייה. ' + (lat > 150 ? 'הקצב יכול להיות גבוה, ובכל זאת התגובה איטית: כך נראית מערכת עם צנרת ארוכה.' : 'הוספת שלב לא משנה את הקצב, רק את ההשהייה.');
  }
  draw();
};

/* ===== chapter 2 ===== */
const ball = (sh, w = 80, h = 60) => { const im = IM.color(w, h, [90, 90, 90]); IM.fillCircle(im, w / 2, h / 2, h * 0.38, [0, 140, 255]); for (let y = 0; y < h; y++) for (let x = 0; x < w / 2; x++) { const i = 3 * (y * w + x); for (let c = 0; c < 3; c++) im.d[i + c] = Math.round(im.d[i + c] * sh); } return im; };

/* 2.1 a shadow changes all of B, G, R but only V */
W.w1_shadow = function (box) {
  V.say(box, 'כדור כתום, החצי השמאלי בצל. <b>הזז את עוצמת הצל</b> והשווה את שני הפיקסלים: בכחול־ירוק־אדום כל המספרים זזים, ובגוון־רוויה־בהירות זז רק אחד.');
  let sh = 0.4;
  V.slider(box, 'כמה אור נשאר בצל', 0.1, 1, 0.05, sh, v => { sh = v; draw(); });
  const rr = row(box); const cv = IM.canvas(rr, 80, 60, 4); const tbl = el('div'); rr.appendChild(tbl);
  function draw() {
    const im = ball(sh); IM.show(cv, im);
    const sun = IM.get3(im, 55, 30), shade = IM.get3(im, 25, 30); const hs = IM.bgr2hsv(...sun), hd = IM.bgr2hsv(...shade);
    tbl.innerHTML = '<table class="mini" style="direction:ltr"><tr><th></th><th>B, G, R</th><th>H, S, V</th></tr><tr><td>בשמש</td><td>' + sun.join(', ') + '</td><td>' + hs.join(', ') + '</td></tr><tr><td>בצל</td><td>' + shade.map(Math.round).join(', ') + '</td><td><b>' + hd[0] + '</b>, ' + hd[1] + ', ' + hd[2] + '</td></tr></table>';
  }
  draw();
};

/* 2.2 the HSV picker with OpenCV ranges */
W.w1_hsv = function (box) {
  V.say(box, 'בנה צבע משלושת הערכים של הספרייה: <b>גוון 0 עד 179</b> (מעלות חלקי 2), רוויה ובהירות 0 עד 255. נסה להוריד את הרוויה לאפס: הגוון מפסיק להיות משנה.');
  let h = 15, s = 255, v = 255;
  const sr = V.row(box); V.slider(sr, 'H גוון', 0, 179, 1, h, x => { h = x; draw(); }); V.slider(sr, 'S רוויה', 0, 255, 1, s, x => { s = x; draw(); }); V.slider(sr, 'V בהירות', 0, 255, 1, v, x => { v = x; draw(); });
  const rr = row(box); const svg = V.s('svg', { viewBox: '-110 -110 220 220', width: 220 }); rr.appendChild(svg); const sw = el('div', { style: { width: '120px', height: '120px', borderRadius: '12px', border: '1px solid var(--line)' } }); rr.appendChild(sw);
  const out = V.say(box);
  for (let a = 0; a < 180; a += 3) { const t1 = (a * 2 - 90) * Math.PI / 180, t2 = ((a + 3) * 2 - 90) * Math.PI / 180; const c = IM.hsv2bgr(a, 255, 255); V.s('path', { d: `M${90 * Math.cos(t1)},${90 * Math.sin(t1)} A90,90 0 0,1 ${90 * Math.cos(t2)},${90 * Math.sin(t2)} L${65 * Math.cos(t2)},${65 * Math.sin(t2)} A65,65 0 0,0 ${65 * Math.cos(t1)},${65 * Math.sin(t1)}Z`, style: { fill: `rgb(${c[2]},${c[1]},${c[0]})` } }, svg); }
  [0, 30, 60, 90, 120, 150].forEach(a => { const t = (a * 2 - 90) * Math.PI / 180; V.s('text', { x: 104 * Math.cos(t), y: 104 * Math.sin(t) + 4, 'text-anchor': 'middle', 'font-size': 10, style: { fill: 'var(--ink3)' }, text: a }, svg); });
  const needle = V.s('line', { x1: 0, y1: 0, style: { stroke: 'var(--ink)', strokeWidth: 3 } }, svg);
  function draw() {
    const c = IM.hsv2bgr(h, s, v); sw.style.background = `rgb(${c[2]},${c[1]},${c[0]})`;
    const t = (h * 2 - 90) * Math.PI / 180; needle.setAttribute('x2', 60 * Math.cos(t)); needle.setAttribute('y2', 60 * Math.sin(t));
    out.innerHTML = 'H, S, V = <b class="ltr" style="display:inline-block">(' + h + ', ' + s + ', ' + v + ')</b> → B, G, R = <b class="ltr" style="display:inline-block">(' + c.join(', ') + ')</b>. ' + (s < 30 ? 'רוויה נמוכה: זה כמעט אפור, וכל גוון נותן אותו צבע.' : v < 30 ? 'כמעט שחור: הגוון כאן לא אמין.' : 'הגוון בפועל: ' + (h * 2) + ' מעלות על המעגל.');
  }
  draw();
};

/* 2.3 isolating in both spaces */
W.w1_isolate = function (box) {
  V.say(box, 'אותו כדור, שני ניסיונות לבודד אותו. משמאל: טווח קבוע בכחול־ירוק־אדום סביב הכתום המואר. מימין: טווח במרחב הגוון (גוון 5 עד 25, רוויה מעל 120, בהירות מעל 40). <b>הגבר את הצל</b> וראה מי מחזיק מעמד.');
  let sh = 0.4;
  V.slider(box, 'כמה אור נשאר בצל', 0.1, 1, 0.05, sh, v => { sh = v; draw(); });
  const rr = row(box); const c0 = IM.canvas(col(rr, 'התמונה'), 80, 60, 3); const c1 = IM.canvas(col(rr, 'מסכה בכחול־ירוק־אדום'), 80, 60, 3); const c2 = IM.canvas(col(rr, 'מסכה בגוון־רוויה־בהירות'), 80, 60, 3);
  const out = V.say(box);
  function draw() {
    const im = ball(sh); IM.show(c0, im);
    const m1 = IM.inRange(im, [0, 100, 200], [50, 180, 255]), m2 = IM.inRange(im, [5, 120, 40], [25, 255, 255], 'hsv');
    IM.show(c1, m1); IM.show(c2, m2);
    out.innerHTML = 'פיקסלים שנתפסו: בכחול־ירוק־אדום <b>' + IM.count(m1) + '</b>, בגוון־רוויה־בהירות <b>' + IM.count(m2) + '</b>. ' + (IM.count(m2) > IM.count(m1) * 1.5 ? 'במרחב הגוון גם החצי שבצל נכנס.' : '') + (sh < 0.15 ? ' בצל עמוק מאוד הבהירות יורדת מתחת ל־40, וגם מרחב הגוון מפספס: זה תרגיל 2.2.' : '');
  }
  draw();
};

/* 2.4 the live tuner on a synthetic scene */
W.w1_tuner = function (box) {
  V.say(box, 'זה כלי הכיוונון של הסעיף, על סצנה עם כמה עצמים. <b>המשימה: השאר רק את הכדור הירוק.</b> הזז את ששת הגבולות. משמאל המקור, מימין <code class="inline-code">bitwise_and</code> עם המסכה.');
  const im = IM.color(96, 64, [70, 70, 70]);
  IM.fillCircle(im, 20, 30, 12, [40, 200, 40]); IM.fillRect(im, 40, 10, 60, 30, [0, 140, 255]); IM.fillCircle(im, 75, 40, 10, [200, 80, 20]); IM.fillRect(im, 40, 40, 58, 58, [60, 120, 60]);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 48; x++) if (x < 30) { const i = 3 * (y * 96 + x); for (let c = 0; c < 3; c++) im.d[i + c] *= 0.65; }
  const lo = [0, 0, 0], hi = [179, 255, 255];
  const sr = V.row(box);
  [['H low', 0, 0, 179], ['H high', 0, 179, 179], ['S low', 1, 0, 255], ['S high', 1, 255, 255], ['V low', 2, 0, 255], ['V high', 2, 255, 255]].forEach(([n, k, st, mx], j) => V.slider(sr, n, 0, mx, 1, st, v => { (j % 2 ? hi : lo)[k] = v; draw(); }));
  const rr = row(box); const c1 = IM.canvas(rr, 96, 64, 3); const c2 = IM.canvas(rr, 96, 64, 3); IM.show(c1, im);
  const out = V.say(box);
  function draw() {
    const m = IM.inRange(im, lo, hi, 'hsv'); IM.show(c2, IM.applyMask(im, m));
    const { comps } = IM.components(m); const big = comps.filter(c => c.area > 15);
    const onBall = big.length === 1 && Math.hypot(big[0].cx - 20, big[0].cy - 30) < 4;
    out.innerHTML = 'lower: <b class="ltr" style="display:inline-block">[' + lo.join(', ') + ']</b> · upper: <b class="ltr" style="display:inline-block">[' + hi.join(', ') + ']</b> · כתמים: ' + big.length + (onBall ? ' <b class="good">נשאר רק הכדור הירוק ✓</b>' : '');
  }
  draw();
};

/* 2.5 red wraps around */
W.w1_red = function (box) {
  V.say(box, 'על הסצנה שני אדומים: אחד נוטה לכתום (גוון 3) ואחד נוטה לסגול (גוון 176). הדלק כל מסכה בנפרד, ואז את שתיהן עם <b>או</b>.');
  const im = IM.color(96, 48, [60, 60, 60]); IM.fillCircle(im, 25, 24, 14, IM.hsv2bgr(3, 220, 230)); IM.fillCircle(im, 70, 24, 14, IM.hsv2bgr(176, 220, 230));
  let a = true, b = false;
  const rr = row(box); const c0 = IM.canvas(col(rr, 'התמונה'), 96, 48, 3); const c1 = IM.canvas(col(rr, 'המסכה הסופית'), 96, 48, 3); IM.show(c0, im);
  V.btns(box, [['mask1: גוון 0–10', () => { a = !a; draw(); }], ['mask2: גוון 170–179', () => { b = !b; draw(); }]]);
  const out = V.say(box);
  function draw() {
    const m1 = IM.inRange(im, [0, 120, 70], [10, 255, 255], 'hsv'), m2 = IM.inRange(im, [170, 120, 70], [179, 255, 255], 'hsv');
    const m = IM.gray(96, 48); for (let i = 0; i < m.d.length; i++) m.d[i] = (a && m1.d[i]) || (b && m2.d[i]) ? 255 : 0; IM.show(c1, m);
    out.innerHTML = (a && b ? '<code class="inline-code">bitwise_or(mask1, mask2)</code>: שני האדומים נתפסו.' : a ? 'רק mask1: האדום הכתמתם נתפס, הסגלגל לא.' : b ? 'רק mask2: רק האדום שבקצה העליון של הסולם.' : 'אף מסכה לא פעילה.');
  }
  draw();
};

/* 2.6 where HSV fails */
W.w1_hsvfail = function (box) {
  V.say(box, 'ארבעה מקרים שבהם בידוד לפי גוון נכשל. בחר מקרה וראה למה.');
  const rr = row(box); const cv = IM.canvas(rr, 96, 48, 3); const c2 = IM.canvas(rr, 96, 48, 3); const out = V.say(box);
  let mode = 0, tint = 0;
  V.tabs(box, ['אפור ולבן', 'אזור כהה', 'אור צבעוני', 'עצם אחר באותו צבע'], i => { mode = i; draw(); });
  const tl = V.slider(box, 'צבע התאורה (רק במקרה השלישי)', 0, 60, 1, tint, v => { tint = v; draw(); });
  function draw() {
    const r = IM.rng(5); let im = IM.color(96, 48, [80, 80, 80]);
    if (mode === 0) for (let i = 0; i < 96 * 48; i++) { const n = (r() - 0.5) * 6; im.d[3 * i] = 128 + n; im.d[3 * i + 1] = 128 - n; im.d[3 * i + 2] = 128 + n * 0.5; }
    if (mode === 1) { for (let i = 0; i < 96 * 48; i++) { const n = (r() - 0.5) * 4; im.d[3 * i] = 6 + n; im.d[3 * i + 1] = 8 - n; im.d[3 * i + 2] = 10 + n; } IM.fillCircle(im, 48, 24, 14, [0, 140, 255]); }
    if (mode === 2) { IM.fillCircle(im, 48, 24, 16, [0, 140, 255]); for (let i = 0; i < 96 * 48; i++) { im.d[3 * i] *= 1 - tint / 100; im.d[3 * i + 2] = Math.min(255, im.d[3 * i + 2] + tint); } }
    if (mode === 3) { IM.fillCircle(im, 30, 24, 12, [0, 140, 255]); IM.fillRect(im, 55, 10, 85, 40, [0, 130, 250]); }
    IM.show(cv, im);
    if (mode === 0) { const hue = IM.gray(96, 48); for (let i = 0; i < hue.d.length; i++) hue.d[i] = IM.bgr2hsv(im.d[3 * i], im.d[3 * i + 1], im.d[3 * i + 2])[0] * 1.4; IM.show(c2, hue); out.innerHTML = 'מימין: ערוץ הגוון של משטח אפור כמעט אחיד. הרוויה כמעט אפס, והגוון קופץ אקראית בין פיקסלים. לכן תמיד שמים סף תחתון לרוויה.'; }
    else { const m = IM.inRange(im, [5, 120, 40], [25, 255, 255], 'hsv'); IM.show(c2, m);
      out.innerHTML = mode === 1 ? 'כשהבהירות 10 בערך, הפרש של מספר אחד משנה את הגוון בעשרות מעלות. הרקע הכהה כאן לא נתפס כי יש סף בהירות 40, וזה בדיוק התפקיד שלו.' : mode === 2 ? 'אור כתום מזיז את הגוון של <b>כל</b> הסצנה. הגבר את צבע התאורה: הרקע האפור מתחיל להיכנס למסכה. מרחב הגוון חסין לעוצמת האור, לא לצבע שלו.' : 'הכדור והקופסה באותו צבע, והמסכה תופסת את שניהם. צבע לבד לא מספיק: בפרק 7 מוסיפים גודל וצורה.'; }
    tl.el.style.display = mode === 2 ? '' : 'none';
  }
  draw();
};

/* ===== chapter 3 ===== */
const doc = (light, w = 100, h = 60) => { const g = IM.gray(w, h); const r = IM.rng(2);
  const txt = IM.gray(w, h); const strokes = [[16, 12, 21, 48], [16, 12, 40, 17], [16, 43, 40, 48]];
  strokes.forEach(([a, b, c, d]) => IM.fillRect(txt, a, b, c, d, 255));
  for (let y = 12; y <= 48; y++) { const k = (y - 12) / 36; IM.fillRect(txt, Math.round(52 + 12 * k), y, Math.round(57 + 12 * k), y, 255); IM.fillRect(txt, Math.round(87 - 12 * k), y, Math.round(92 - 12 * k), y, 255); }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const L = light ? 60 + 170 * x / (w - 1) : 200; const i = y * w + x; g.d[i] = txt.d[i] ? (light ? L * 0.35 : 50) : L; g.d[i] = IM.clamp(g.d[i] + IM.randn(r) * (light ? 4 : 15), 0, 255); }
  return { g, txt }; };

/* 3.1 a threshold makes a mask */
W.w1_thresh = function (box) {
  V.say(box, 'הזז את הסף. כל פיקסל <b>כהה</b> מהסף נכנס למסכה (לבן), כמו <code class="inline-code">THRESH_BINARY_INV</code>. הדלק "בלי INV" כדי לראות את הכיוון ההפוך.');
  const { g } = doc(false); let t = 127, inv = true;
  V.slider(box, 'סף', 0, 255, 1, t, v => { t = v; draw(); }); V.tabs(box, ['INV: כהה נכנס', 'בלי INV: בהיר נכנס'], i => { inv = i === 0; draw(); });
  const rr = row(box); const c1 = IM.canvas(col(rr, 'תמונת אפור'), 100, 60, 3); const c2 = IM.canvas(col(rr, 'המסכה'), 100, 60, 3); IM.show(c1, g);
  const code = mono(box, '');
  function draw() { const m = IM.map(g, v => (inv ? v < t : v > t) ? 255 : 0); IM.show(c2, m); code.textContent = '_, mask = cv2.threshold(gray, ' + t + ', 255, cv2.THRESH_BINARY' + (inv ? '_INV' : '') + ')\n# ' + IM.count(m) + ' white pixels'; }
  draw();
};

/* 3.2 logic on masks */
W.w1_logic = function (box) {
  V.say(box, 'שתי מסכות: A (המעגל) ו־B (המלבן, "האזור המעניין"). לחץ על כל פעולה וראה את התוצאה פיקסל אחר פיקסל.');
  const A = IM.gray(90, 60), B = IM.gray(90, 60); IM.fillCircle(A, 38, 30, 20, 255); IM.fillRect(B, 0, 0, 44, 59, 255);
  const rr = row(box); const ca = IM.canvas(col(rr, 'A'), 90, 60, 2.5); const cb = IM.canvas(col(rr, 'B'), 90, 60, 2.5); const co = IM.canvas(col(rr, 'התוצאה'), 90, 60, 2.5); IM.show(ca, A); IM.show(cb, B);
  const out = V.say(box);
  const ops = { 'and (A, B)': (a, b) => a && b, 'or (A, B)': (a, b) => a || b, 'not (A)': a => !a, 'xor (A, B)': (a, b) => !!a !== !!b };
  V.tabs(box, Object.keys(ops), (i, l) => { const o = IM.gray(90, 60); for (let k = 0; k < o.d.length; k++) o.d[k] = ops[l](A.d[k], B.d[k]) ? 255 : 0; IM.show(co, o); out.innerHTML = '<code class="inline-code">cv2.bitwise_' + l + '</code>: ' + ['רק מה שבשתיהן: חצי המעגל שבתוך האזור.', 'מה שבאחת מהן לפחות.', 'היפוך: הרקע של A.', 'מה שבאחת בלבד (פחות שימושי, אבל קיים).'][i]; });
  setTimeout(() => box.querySelector('.tabs button').click(), 0);
};

/* 3.3 Otsu: try every threshold */
W.w1_otsu = function (box) {
  V.say(box, 'ההיסטוגרמה של המסמך: הר כהה (הטקסט) והר בהיר (הרקע). <b>הזז את הסף</b> וחפש את המקום שבו "הפיזור בתוך הקבוצות" (הקו הסגול) הכי נמוך. זה מה שאוצו מוצא לבד.');
  const { g } = doc(false); const hist = new Array(256).fill(0); g.d.forEach(v => hist[Math.round(v)]++);
  const score = []; let best = 0, bs = Infinity;
  for (let t = 1; t < 255; t++) { let w0 = 0, w1 = 0, m0 = 0, m1 = 0; for (let k = 0; k < 256; k++) { if (k <= t) { w0 += hist[k]; m0 += k * hist[k]; } else { w1 += hist[k]; m1 += k * hist[k]; } } if (!w0 || !w1) { score.push([t, null]); continue; } m0 /= w0; m1 /= w1; let v0 = 0, v1 = 0; for (let k = 0; k < 256; k++) { if (k <= t) v0 += hist[k] * (k - m0) ** 2; else v1 += hist[k] * (k - m1) ** 2; } const s = v0 + v1; score.push([t, s]); if (s < bs) { bs = s; best = t; } }
  let t = 127;
  V.slider(box, 'סף', 1, 254, 1, t, v => { t = v; draw(); });
  const P = IM.plot(box, { w: 460, h: 170 }); const rr = row(box); const cm = IM.canvas(rr, 100, 60, 2.5); const out = V.say(box);
  const mh = Math.max(...hist), ms = Math.max(...score.filter(s => s[1] !== null).map(s => s[1]));
  function draw() {
    P.draw([{ bars: true, pts: hist.map((v, k) => [k, v / mh]), color: 'var(--c1)', bw: 1.6 }, { pts: score.filter(s => s[1] !== null).map(([k, s]) => [k, s / ms]), color: 'var(--c4)' }, { vline: t, color: 'var(--c2)', label: 't = ' + t }], [0, 255], [0, 1.05]);
    IM.show(cm, IM.map(g, v => v <= t ? 255 : 0));
    const cur = score.find(s => s[0] === t); out.innerHTML = 'הפיזור בסף ' + t + ': <b>' + (cur && cur[1] ? V.fmt(cur[1] / bs, 2) : '—') + '</b> פעמים המינימום. ' + (Math.abs(t - best) <= 1 ? '<b class="good">מצאת את הסף של אוצו: ' + best + '.</b> הוא בעמק שבין ההרים.' : 'נסה להגיע לנקודה הנמוכה של הקו הסגול.');
  }
  draw();
};

/* 3.4 adaptive threshold */
W.w1_adaptive = function (box) {
  V.say(box, 'מסמך שצולם ליד חלון: משמאל כהה, מימין בהיר. השווה סף אחיד לסף מסתגל, ושנה את גודל השכונה ואת הקבוע C. הספירה למטה משווה למסכת הטקסט האמיתית.');
  const { g, txt } = doc(true); let t = 127, bs = 15, C = 10, mode = 1;
  V.tabs(box, ['סף אחיד', 'סף מסתגל'], i => { mode = i; draw(); }, 1);
  const sr = V.row(box); V.slider(sr, 'סף אחיד', 0, 255, 1, t, v => { t = v; draw(); }); V.slider(sr, 'גודל שכונה', 3, 41, 2, bs, v => { bs = v; draw(); }); V.slider(sr, 'C', 0, 30, 1, C, v => { C = v; draw(); });
  const rr = row(box); const c1 = IM.canvas(col(rr, 'המסמך'), 100, 60, 3); const c2 = IM.canvas(col(rr, 'המסכה'), 100, 60, 3); IM.show(c1, g);
  const out = V.say(box);
  // integral image for the local mean
  const S = new Float64Array(101 * 61); for (let y = 0; y < 60; y++) for (let x = 0; x < 100; x++) S[(y + 1) * 101 + x + 1] = g.d[y * 100 + x] + S[y * 101 + x + 1] + S[(y + 1) * 101 + x] - S[y * 101 + x];
  const mean = (x, y, r) => { const x0 = Math.max(0, x - r), y0 = Math.max(0, y - r), x1 = Math.min(99, x + r), y1 = Math.min(59, y + r); return (S[(y1 + 1) * 101 + x1 + 1] - S[y0 * 101 + x1 + 1] - S[(y1 + 1) * 101 + x0] + S[y0 * 101 + x0]) / ((x1 - x0 + 1) * (y1 - y0 + 1)); };
  function draw() {
    const m = IM.gray(100, 60); for (let y = 0; y < 60; y++) for (let x = 0; x < 100; x++) { const v = g.d[y * 100 + x]; m.d[y * 100 + x] = (mode ? v < mean(x, y, bs >> 1) - C : v < t) ? 255 : 0; }
    IM.show(c2, m); let hit = 0, fa = 0, tot = 0; for (let i = 0; i < m.d.length; i++) { if (txt.d[i]) { tot++; if (m.d[i]) hit++; } else if (m.d[i]) fa++; }
    out.innerHTML = 'פיקסלי טקסט שנתפסו: <b>' + hit + '</b> מתוך ' + tot + ' · פיקסלי רקע שנתפסו בטעות: <b>' + fa + '</b>' + (mode && fa === 0 && hit > tot * 0.8 ? ' <b class="good">כמו בטבלה של הסעיף: אפס רקע.</b>' : '');
  }
  draw();
};
})();
