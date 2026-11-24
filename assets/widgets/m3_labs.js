/* Module 3 — lab-grade demos (rebuilt chapter by chapter). Loaded after m3_c.js, so the ids here override the old ones.
   Exports window.LAB3 with the helpers, so the numbers can be checked from a test script. */
(function () {
const W = window.W, V = window.V, G = window.G, el = V.el;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const F = (v, d) => { if (!isFinite(v)) return '∞'; const s = (+v).toFixed(d == null ? 2 : d); return s.replace('-', '−'); };
const ltr = s => '<span dir="ltr" style="display:inline-block;direction:ltr;unicode-bidi:isolate">‪' + s + '‬</span>';
const badge = (ok, t) => '<b style="color:' + (ok ? '#2b8a3e' : '#c92a2a') + '">' + (ok ? '✓ ' : '✗ ') + t + '</b>';
const mono = parent => { const p = el('pre', { class: 'code', style: { direction: 'ltr', textAlign: 'left', fontSize: '12.5px', margin: '6px 0', padding: '8px 10px', background: 'var(--surface2)', borderRadius: '8px', whiteSpace: 'pre-wrap' } }); parent.appendChild(p); return p; };
const flex = (parent, gap) => { const d = el('div', { style: { display: 'flex', flexWrap: 'wrap', gap: (gap || 10) + 'px', justifyContent: 'center', alignItems: 'flex-start', direction: 'ltr' } }); parent.appendChild(d); return d; };
const colm = (parent, title) => { const d = el('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' } }); d.appendChild(el('div', { class: 'note-small', html: title || '·' })); parent.appendChild(d); return d; };
const canvas = (parent, w, h, cssW) => { const c = document.createElement('canvas'); c.dir = 'ltr'; c.width = w; c.height = h; c.style.width = (cssW || w) + 'px'; c.style.maxWidth = '100%'; c.style.borderRadius = '8px'; c.style.border = '1px solid var(--line)'; c.style.background = '#fff'; parent.appendChild(c); return c; };
const table = (head, rows) => '<table class="mini" style="margin:6px auto"><tr>' + head.map(h => '<th>' + h + '</th>').join('') + '</tr>' + rows.map(r => '<tr>' + r.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</table>';
const row = parent => { const r = el('div', { class: 'row' }); parent.appendChild(r); return r; };
function arrow(x, x0, y0, x1, y1, col, lw, head) { x.strokeStyle = col; x.fillStyle = col; x.lineWidth = lw || 2; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); if (head === false) return; const a = Math.atan2(y1 - y0, x1 - x0), L = 8; x.beginPath(); x.moveTo(x1, y1); x.lineTo(x1 - L * Math.cos(a - 0.4), y1 - L * Math.sin(a - 0.4)); x.lineTo(x1 - L * Math.cos(a + 0.4), y1 - L * Math.sin(a + 0.4)); x.fill(); }
const txt = (x, s, X, Y, col, size, align) => { x.fillStyle = col || '#495057'; x.font = (size || 12) + 'px sans-serif'; x.textAlign = align || 'left'; x.fillText(s, X, Y); x.textAlign = 'left'; };
/* the projection of section 1.2: x = f·X/Z, y = f·Y/Z (camera: Z forward, Y down) */
const projectPinhole = (P, f) => P.map(p => [f * p[0] / p[2], f * p[1] / p[2]]);
/* draw a "camera view": the sensor rectangle (width sw, height sh in mm), mapped to a canvas */
function sensorView(cv, sw, sh) { const x = cv.getContext('2d'), Wc = cv.width, Hc = cv.height, s = Math.min((Wc - 20) / sw, (Hc - 20) / sh); x.fillStyle = '#f1f3f5'; x.fillRect(0, 0, Wc, Hc); x.fillStyle = '#fff'; x.fillRect(Wc / 2 - sw / 2 * s, Hc / 2 - sh / 2 * s, sw * s, sh * s); x.strokeStyle = '#adb5bd'; x.strokeRect(Wc / 2 - sw / 2 * s, Hc / 2 - sh / 2 * s, sw * s, sh * s);
  return { x, P: (u, v) => [Wc / 2 + u * s, Hc / 2 + v * s], s }; }

/* ===================================================== 1.1 */
W.w3_pinhole = function (box) {
  V.say(box, 'מצלמת נקב במבט מהצד. עצם בגובה Y עומד במרחק Z מהחור; הקרן מהקצה שלו עוברת דרך החור ופוגעת בחיישן, במרחק f מאחור. <b>הזז את שלושת המספרים</b> ועקוב אחרי שני המשולשים הדומים: היחס בצד אחד שווה ליחס בצד השני. ואז החלף לחיישן המדומה, שעומד <i>לפני</i> החור.');
  let Z = 10, Y = 1.8, f = 4, virt = false;
  const sr = row(box); V.slider(sr, 'Z — מרחק (מ׳)', 2, 20, 0.5, Z, v => { Z = v; draw(); }); V.slider(sr, 'Y — גובה (מ׳)', 0.3, 3, 0.1, Y, v => { Y = v; draw(); }); V.slider(sr, 'f — מרחק מוקד (מ״מ)', 2, 20, 0.5, f, v => { f = v; draw(); });
  V.tabs(box, ['החיישן האמיתי (מאחור, הפוך)', 'החיישן המדומה (מלפנים, ישר)'], k => { virt = k === 1; draw(); });
  const cv = canvas(box, 680, 260, 680); const out = V.say(box);
  function draw() { const x = cv.getContext('2d'); x.clearRect(0, 0, 680, 260); const hole = [290, 150], sx = 18, sy = 34, fs = 12;   // world: 24 px per metre along Z, 34 px per metre in Y; the sensor side is magnified
    const top = [hole[0] + Z * sx, hole[1] - Y * sy], base = [hole[0] + Z * sx, hole[1]];
    x.fillStyle = '#212529'; x.fillRect(hole[0] - 3, 30, 6, hole[1] - 34); x.fillRect(hole[0] - 3, hole[1] + 4, 6, 90);   // the wall with the hole
    x.strokeStyle = '#ced4da'; x.setLineDash([4, 4]); x.beginPath(); x.moveTo(20, hole[1]); x.lineTo(670, hole[1]); x.stroke(); x.setLineDash([]); txt(x, 'ציר ההסתכלות (Z)', 560, hole[1] + 14, '#868e96', 11);
    arrow(x, base[0], base[1], top[0], top[1], '#1c7ed6', 4); txt(x, 'Y = ' + F(Y, 1) + ' מ׳', top[0] + 8, (top[1] + base[1]) / 2, '#1c7ed6');
    const sxp = virt ? hole[0] + f * fs : hole[0] - f * fs, yimg = Y * f / Z, yp = hole[1] + (virt ? -1 : 1) * yimg * 72;
    x.strokeStyle = '#495057'; x.lineWidth = 3; x.setLineDash(virt ? [5, 3] : []); x.beginPath(); x.moveTo(sxp, hole[1] - 90); x.lineTo(sxp, hole[1] + 90); x.stroke(); x.setLineDash([]); txt(x, virt ? 'חיישן מדומה' : 'חיישן', sxp, 22, '#495057', 11, 'center');
    x.strokeStyle = 'rgba(232,89,12,.85)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(top[0], top[1]); x.lineTo(hole[0], hole[1]); if (!virt) x.lineTo(sxp, yp); x.stroke(); if (virt) { x.setLineDash([3, 3]); x.beginPath(); x.moveTo(hole[0], hole[1]); x.lineTo(sxp, yp); x.stroke(); x.setLineDash([]); }
    arrow(x, sxp, hole[1], sxp, yp, '#e8590c', 4); txt(x, 'y = ' + F(yimg, 3) + ' מ״מ', sxp + (virt ? 10 : -10), (hole[1] + yp) / 2 + 4, '#e8590c', 12, virt ? 'left' : 'right');
    x.fillStyle = 'rgba(28,126,214,.08)'; x.beginPath(); x.moveTo(hole[0], hole[1]); x.lineTo(top[0], top[1]); x.lineTo(base[0], base[1]); x.fill(); x.fillStyle = 'rgba(232,89,12,.12)'; x.beginPath(); x.moveTo(hole[0], hole[1]); x.lineTo(sxp, yp); x.lineTo(sxp, hole[1]); x.fill();
    txt(x, 'Z = ' + F(Z, 1) + ' מ׳', (hole[0] + base[0]) / 2, hole[1] + 28, '#1c7ed6', 12, 'center'); txt(x, 'f = ' + F(f, 1) + ' מ״מ', (hole[0] + sxp) / 2, hole[1] + (virt ? 28 : -10), '#e8590c', 12, 'center'); txt(x, 'צד החיישן מוגדל פי 72', 20, 250, '#adb5bd', 10);
    out.innerHTML = 'יחס במשולש הגדול: ' + ltr('Y / Z = ' + F(Y, 1) + ' / ' + F(Z, 1) + ' = ' + F(Y / Z, 4)) + '. יחס בקטן: ' + ltr('y / f = ' + F(yimg, 3) + ' / ' + F(f, 1) + ' = ' + F(yimg / f, 4)) + ' — אותו מספר. לכן ' + ltr('y = f · Y / Z') + '. ' + (virt ? 'החיישן המדומה נותן את אותו גודל, אבל ישר — כך נוח לחשב, ומעכשיו נעבוד רק איתו.' : 'על החיישן האמיתי התמונה הפוכה (החץ מצביע למטה) — המצלמה הופכת אותה בתוכנה.') + (Z >= 18 ? ' שים לב כמה קטן היה הצד הימני אילו לא היינו מגדילים אותו: ' + F(yimg, 3) + ' מ״מ.' : ''); }
  draw();
};

/* ===================================================== 1.2 */
W.w3_project_person = function (box) {
  V.say(box, 'אדם בגובה 1.8 מטר הולך מהמצלמה. מימין — מה שהחיישן רואה (מצלמת טלפון: f = 4 מ״מ, חיישן 6.4 × 4.8 מ״מ); למטה — הגובה בתמונה כפונקציה של המרחק. <b>הזז את המרחק</b>, ונסה גם להזיז את האדם הצידה ולשנות את גובה המצלמה.');
  let Z = 10, Xs = 0, camH = 1.5, f = 4;
  const sr = row(box); V.slider(sr, 'Z — המרחק (מ׳)', 2, 60, 0.5, Z, v => { Z = v; draw(); }); V.slider(sr, 'X — הצידה (מ׳)', -6, 6, 0.5, Xs, v => { Xs = v; draw(); }); V.slider(sr, 'גובה המצלמה (מ׳)', 0.5, 3, 0.1, camH, v => { camH = v; draw(); });
  const fx = flex(box); const cS = canvas(colm(fx, 'החיישן (מ״מ), מה שהמצלמה רואה'), 320, 240, 320); const cP = canvas(colm(fx, 'הגובה בתמונה מול המרחק'), 320, 240, 320); const code = mono(box); const out = V.say(box);
  function person(Z) { const top = camH - 1.8, bot = camH; return [[Xs, top, Z], [Xs, bot, Z]]; }   // Y grows downward; the camera is at height camH, the feet are on the ground (Y = camH)
  function draw() { const S = sensorView(cS, 6.4, 4.8); const x = S.x; const p = projectPinhole(person(Z), f).map(q => S.P(q[0], q[1]));
    x.strokeStyle = '#dee2e6'; x.beginPath(); const hz = S.P(0, 0); x.moveTo(hz[0] - 6.4 / 2 * S.s, hz[1]); x.lineTo(hz[0] + 6.4 / 2 * S.s, hz[1]); x.stroke(); txt(x, 'אופק', hz[0] + 3.2 * S.s - 30, hz[1] - 3, '#adb5bd', 10);
    [40, 20, 10, 5].forEach(z => { const g = projectPinhole([[-3, camH, z], [3, camH, z]], f).map(q => S.P(q[0], q[1])); x.strokeStyle = '#e9ecef'; x.beginPath(); x.moveTo(g[0][0], g[0][1]); x.lineTo(g[1][0], g[1][1]); x.stroke(); });
    const hpx = Math.abs(p[1][1] - p[0][1]); x.strokeStyle = '#1c7ed6'; x.lineWidth = Math.max(1.5, hpx / 7); x.lineCap = 'round'; x.beginPath(); x.moveTo(p[0][0], p[0][1] + hpx * 0.15); x.lineTo(p[1][0], p[1][1]); x.stroke(); x.fillStyle = '#1c7ed6'; x.beginPath(); x.arc(p[0][0], p[0][1] + hpx * 0.07, hpx * 0.08, 0, 7); x.fill(); x.lineCap = 'butt';
    const hmm = 1.8 * f / Z; const P = cP.getContext('2d'); P.clearRect(0, 0, 320, 240); const X = z => 30 + (z - 2) / 58 * 280, Y = h => 220 - h / 3.6 * 200;
    P.strokeStyle = '#dee2e6'; P.beginPath(); P.moveTo(30, 220); P.lineTo(315, 220); P.moveTo(30, 10); P.lineTo(30, 220); P.stroke(); txt(P, 'מ״מ', 34, 16, '#868e96', 10); txt(P, 'Z (מ׳) →', 255, 236, '#868e96', 10); [0, 1, 2, 3].forEach(h => txt(P, String(h), 14, Y(h) + 4, '#868e96', 10));
    P.strokeStyle = '#1c7ed6'; P.lineWidth = 2; P.beginPath(); for (let z = 2; z <= 60; z += 0.25) { const v = 1.8 * f / z; z === 2 ? P.moveTo(X(z), Y(v)) : P.lineTo(X(z), Y(v)); } P.stroke();
    P.fillStyle = '#e8590c'; P.beginPath(); P.arc(X(Z), Y(hmm), 5, 0, 7); P.fill(); P.setLineDash([3, 3]); P.strokeStyle = '#e8590c'; P.beginPath(); P.moveTo(X(Z), 220); P.lineTo(X(Z), Y(hmm)); P.lineTo(30, Y(hmm)); P.stroke(); P.setLineDash([]);
    code.textContent = 'person = np.array([[' + F(Xs, 1) + ', ' + F(camH - 1.8, 1) + ', ' + F(Z, 1) + '], [' + F(Xs, 1) + ', ' + F(camH, 1) + ', ' + F(Z, 1) + ']])\nx = project_pinhole(person, f)\nprint((x[1, 1] - x[0, 1]) * 1000)     # ' + F(hmm, 4) + ' mm';
    const px = hmm / 0.0016; out.innerHTML = 'גובה על החיישן: <b>' + F(hmm, 3) + ' מ״מ</b> — בחיישן של 4000 פיקסלים לרוחב 6.4 מ״מ (פיקסל של ' + ltr('1.6 µm') + '), זה כ־<b>' + F(px, 0) + '</b> פיקסלים. ' + (Math.abs(Z - 20) < 0.3 ? 'פי 2 רחוק מ־10 מטר — ובדיוק חצי מהגובה: ' + ltr('0.36') + '. ' : '') + 'הגובה תלוי <i>רק</i> ביחס ' + ltr('f · 1.8 / Z') + ' — הזזה הצידה מזיזה את האדם בתמונה, אבל לא משנה את גובהו. ' + (camH !== 1.5 ? 'גובה המצלמה הזיז את האדם למעלה או למטה בתמונה, אבל גם הוא לא שינה את הגובה.' : 'נסה לשנות את גובה המצלמה.'); }
  draw();
};

/* ===================================================== 1.3 */
W.w3_ray_rails = function (box) {
  V.say(box, 'שתי התוצאות של "מה הולך לאיבוד". <b>בלשונית הראשונה</b>: כמה עצמים שונים על אותה קרן — כולם נופלים על אותו פיקסל. <b>בשנייה</b>: מסילות רכבת מקבילות, שנפגשות בתמונה בנקודת מגוז; הטה אותן (המקדם של תרגיל 1.3) ועקוב אחרי הנקודה.');
  let tab = 0, s = 1, slope = 0, camH = 1.5, f = 4;
  V.tabs(box, ['אותה קרן — עומק לא ידוע', 'מסילות ונקודת מגוז'], k => { tab = k; ctl(); draw(); });
  const ctlBox = el('div'); box.appendChild(ctlBox); const fx = flex(box); const cA = canvas(colm(fx, ''), 340, 240, 340); const cB = canvas(colm(fx, ''), 320, 240, 320); const out = V.say(box);
  function ctl() { ctlBox.innerHTML = ''; const r = row(ctlBox); if (tab === 0) V.slider(r, 's — כמה רחוק לאורך הקרן', 0.3, 3, 0.05, s, v => { s = v; draw(); }); else { V.slider(r, 'הטיה: X = ±0.7 + k·Z, k =', -0.5, 0.5, 0.05, slope, v => { slope = v; draw(); }); V.slider(r, 'גובה המצלמה (מ׳)', 0.5, 5, 0.1, camH, v => { camH = v; draw(); }); } cA.previousSibling.innerHTML = tab ? 'מבט מלמעלה' : 'מבט מהצד: הקרן'; cB.previousSibling.innerHTML = 'מה שהמצלמה רואה (מ״מ)'; }
  function draw() { const A = cA.getContext('2d'); A.clearRect(0, 0, 340, 240);
    if (tab === 0) { const base = [1.0, -0.6, 4]; const O = [20, 160], sc = 30; A.strokeStyle = 'rgba(232,89,12,.7)'; A.lineWidth = 1.5; A.beginPath(); A.moveTo(O[0], O[1]); A.lineTo(O[0] + base[2] * 3.2 * sc, O[1] + base[1] * 3.2 * sc); A.stroke(); A.fillStyle = '#212529'; A.fillRect(O[0] - 4, O[1] - 4, 8, 8); txt(A, 'מצלמה', O[0], O[1] + 18, '#495057', 11);
      const objs = [[0.5, '#adb5bd'], [1, '#adb5bd'], [2, '#adb5bd'], [s, '#1c7ed6']]; objs.forEach(([k, c]) => { const P = base.map(v => v * k); const X0 = O[0] + P[2] * sc, Y0 = O[1] + P[1] * sc; A.fillStyle = c; A.beginPath(); A.arc(X0, Y0, 4 + 2 * k, 0, 7); A.fill(); });
      const P = base.map(v => v * s); txt(A, '(' + P.map(v => v.toFixed(2)).join(', ') + ')', O[0] + P[2] * sc + 10, O[1] + P[1] * sc - 8, '#1c7ed6', 11);
      const S = sensorView(cB, 6.4, 4.8); const q = projectPinhole([P], f)[0], Q = S.P(q[0], q[1]); S.x.fillStyle = '#1c7ed6'; S.x.beginPath(); S.x.arc(Q[0], Q[1], 6, 0, 7); S.x.fill();
      out.innerHTML = 'הנקודה ' + ltr('(' + F(P[0], 2) + ', ' + F(P[1], 2) + ', ' + F(P[2], 2) + ')') + ' = ' + ltr(F(s, 2) + ' · (1.0, −0.6, 4)') + ' נופלת ב־' + ltr('(' + F(q[0], 3) + ', ' + F(q[1], 3) + ')') + ' מ״מ — בדיוק אותו מקום לכל s: ' + ltr('f·(s·X)/(s·Z) = f·X/Z') + '. הפיקסל לא אומר <i>איפה</i> על הקרן. זו בדיוק נקודה בקואורדינטות הומוגניות: ' + ltr('(x, y, 1) ~ (s·x, s·y, s)') + '.'; return; }
    const sc = 7, O = [170, 230]; A.fillStyle = '#212529'; A.fillRect(O[0] - 5, O[1] - 5, 10, 10); [-1, 1].forEach(sg => { A.strokeStyle = '#495057'; A.lineWidth = 2; A.beginPath(); for (let z = 0; z <= 30; z += 1) { const X = sg * 0.7 + slope * z; z ? A.lineTo(O[0] + X * sc * 3, O[1] - z * sc) : A.moveTo(O[0] + X * sc * 3, O[1] - z * sc); } A.stroke(); }); txt(A, 'מצלמה', O[0] + 8, O[1] - 2, '#495057', 11);
    const S = sensorView(cB, 6.4, 4.8); const x = S.x; const Zs = []; for (let z = 1.5; z < 2000; z *= 1.15) Zs.push(z);
    for (let z = 2; z < 400; z *= 1.35) { const a = projectPinhole([[-0.7 + slope * z - 0.4, camH, z], [0.7 + slope * z + 0.4, camH, z]], f).map(q => S.P(q[0], q[1])); x.strokeStyle = '#ced4da'; x.lineWidth = 2; x.beginPath(); x.moveTo(a[0][0], a[0][1]); x.lineTo(a[1][0], a[1][1]); x.stroke(); }
    [-0.7, 0.7].forEach(X0 => { x.strokeStyle = '#495057'; x.lineWidth = 2; x.beginPath(); Zs.forEach((z, k) => { const q = projectPinhole([[X0 + slope * z, camH, z]], f)[0], Q = S.P(q[0], q[1]); k ? x.lineTo(Q[0], Q[1]) : x.moveTo(Q[0], Q[1]); }); x.stroke(); });
    const vp = [f * slope, 0], Q = S.P(vp[0], vp[1]); x.strokeStyle = '#e8590c'; x.lineWidth = 2; x.beginPath(); x.arc(Q[0], Q[1], 6, 0, 7); x.stroke(); x.strokeStyle = 'rgba(232,89,12,.4)'; x.setLineDash([3, 3]); x.beginPath(); x.moveTo(0, Q[1]); x.lineTo(320, Q[1]); x.stroke(); x.setLineDash([]);
    out.innerHTML = 'נקודת המגוז (העיגול הכתום): ' + ltr('(' + F(vp[0], 2) + ', 0)') + ' מ״מ = ' + ltr('(f · k, 0)') + '. היא תלויה רק ב<b>כיוון</b> המסילות ' + ltr('(k, 0, 1)') + ' — לא ברוחב שלהן, ולא בגובה המצלמה' + (camH !== 1.5 ? ' (שינית את הגובה, והנקודה לא זזה; רק הזווית שבה המסילות מגיעות אליה)' : '') + '. הקו המקווקו הוא האופק: כל הקווים המקבילים לקרקע, בכל כיוון, נפגשים עליו. ' + (Math.abs(f * slope) > 3.2 ? 'עכשיו נקודת המגוז מחוץ לחיישן — היא עדיין קיימת, רק לא בתמונה.' : ''); }
  ctl(); draw();
};

/* ===================================================== 1.4 */
W.w3_fov = function (box) {
  V.say(box, 'מבט מלמעלה על מצלמת רחפן ושדה הראייה שלה. רכבים (4.5 מטר אורך, 1.8 רוחב) עומדים במרחקים שונים. <b>שנה את מרחק המוקד</b> — עדשה רחבה מכסה יותר, אבל כל רכב תופס פחות פיקסלים. הטבלה אומרת כמה פיקסלים רוחב יש לכל רכב בתמונה של 1920 פיקסלים.');
  let f = 4, sw = 6.4, need = 20;
  const sr = row(box); V.slider(sr, 'f (מ״מ)', 2, 50, 0.5, f, v => { f = v; draw(); }); V.slider(sr, 'רוחב החיישן (מ״מ)', 3, 36, 0.2, sw, v => { sw = v; draw(); }); V.slider(box, 'מינימום פיקסלים לזיהוי', 8, 60, 1, need, v => { need = v; draw(); });
  const cv = canvas(box, 680, 280, 680); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  const cars = [[-6, 15], [8, 30], [-20, 60], [30, 100], [-50, 180], [0, 250]];
  function draw() { const x = cv.getContext('2d'); x.clearRect(0, 0, 680, 280); const fov = 2 * Math.atan(sw / (2 * f)), O = [340, 268], sc = 1.0;
    const R = 270; x.fillStyle = 'rgba(28,126,214,.09)'; x.beginPath(); x.moveTo(O[0], O[1]); x.arc(O[0], O[1], R, -Math.PI / 2 - fov / 2, -Math.PI / 2 + fov / 2); x.closePath(); x.fill(); x.strokeStyle = '#1c7ed6'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(O[0] + R * Math.sin(-fov / 2), O[1] - R * Math.cos(fov / 2)); x.lineTo(O[0], O[1]); x.lineTo(O[0] + R * Math.sin(fov / 2), O[1] - R * Math.cos(fov / 2)); x.stroke();
    [50, 100, 150, 200, 250].forEach(d => { x.strokeStyle = '#f1f3f5'; x.beginPath(); x.arc(O[0], O[1], d * sc, Math.PI, 2 * Math.PI); x.stroke(); txt(x, d + ' מ׳', O[0] + 3, O[1] - d * sc - 2, '#ced4da', 9); });
    const rows = []; cars.forEach(([X, Z], k) => { const inside = Math.abs(Math.atan2(X, Z)) <= fov / 2; const px = 1920 * (f * 1.8 / Z) / sw; const ok = inside && px >= need; x.fillStyle = !inside ? '#ced4da' : ok ? '#2f9e44' : '#e03131'; x.fillRect(O[0] + X * sc - 2, O[1] - Z * sc - 4, 4, 8); txt(x, String(k + 1), O[0] + X * sc + 5, O[1] - Z * sc + 4, x.fillStyle, 10);
      rows.push([k + 1, F(Math.hypot(X, Z), 0) + ' מ׳', inside ? F(px, 0) : '—', !inside ? '<span style="color:#868e96">מחוץ לשדה</span>' : ok ? badge(true, 'מספיק') : badge(false, 'קטן מדי')]); });
    x.fillStyle = '#212529'; x.fillRect(O[0] - 5, O[1] - 5, 10, 10);
    tb.innerHTML = table(['רכב', 'מרחק', 'רוחב בתמונה (פיקסלים)', 'מזהה?'], rows);
    const W100 = 2 * 100 * Math.tan(fov / 2); out.innerHTML = 'שדה הראייה: ' + ltr('2 · arctan(' + F(sw, 1) + ' / (2 · ' + F(f, 1) + ')) = ' + F(G.deg(fov), 1) + '°') + '. במרחק 100 מטר הוא מכסה רוחב של <b>' + F(W100, 0) + '</b> מטר, וכל פיקסל הוא <b>' + F(W100 / 1920 * 100, 1) + '</b> ס״מ. ' + (G.deg(fov) > 70 ? 'עדשה רחבה: רואים הרבה, אבל רכבים רחוקים הם כמה פיקסלים בלבד.' : G.deg(fov) < 25 ? 'עדשה צרה (טלה): רכבים רחוקים גדולים, אבל השדה צר — רכבים בצד יוצאים ממנו.' : '') + ' זו ההחלטה הראשונה בתכנון מצלמה לרחפן — ואין לה תשובה אחת נכונה.'; }
  draw();
};

window.LAB3 = { projectPinhole };
})();
