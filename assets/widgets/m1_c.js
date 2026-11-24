/* Module 1 visuals — chapters 7–9: contours and tracking, geometric transforms, keypoints and RANSAC */
(function () {
const W = window.W, V = window.V, IM = window.IM, el = V.el;
const row = box => { const r = V.row(box); r.style.direction = 'ltr'; r.style.justifyContent = 'center'; r.style.alignItems = 'flex-start'; return r; };
const col = (parent, title) => { const d = el('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' } }); if (title) d.appendChild(el('div', { class: 'note-small', html: title })); parent.appendChild(d); return d; };
const mono = (parent, txt) => { const d = el('div', { class: 'mono', style: { direction: 'ltr', textAlign: 'left', fontSize: '.85em', background: 'var(--code-bg)', padding: '8px 10px', borderRadius: '8px', whiteSpace: 'pre-wrap' } }); d.textContent = txt; parent.appendChild(d); return d; };
const cleanup = (box, fn) => { const o = new MutationObserver(() => { if (!document.body.contains(box)) { fn(); o.disconnect(); } }); o.observe(document.body, { childList: true, subtree: true }); };

/* 7.1 what a contour gives you */
W.w1_contour_props = function (box) {
  V.say(box, 'כתם לבן אחד במסכה. בחר צורה ושנה את הגודל, וראה את כל המדדים שמתאר נותן: שטח, היקף, מרכז, מלבן חוסם, עיגול חוסם ועגלגלות.');
  let shape = 0, s = 18, ar = 1;
  V.tabs(box, ['עיגול', 'מלבן', 'צורת L'], i => { shape = i; draw(); });
  const sr = V.row(box); V.slider(sr, 'גודל', 6, 26, 1, s, v => { s = v; draw(); }); V.slider(sr, 'יחס רוחב לגובה', 1, 3, 0.1, ar, v => { ar = v; draw(); });
  const rr = row(box); const cv = IM.canvas(rr, 90, 70, 4); const out = el('div'); rr.appendChild(out);
  function draw() {
    const m = IM.gray(90, 70);
    if (shape === 0) { for (let y = 0; y < 70; y++) for (let x = 0; x < 90; x++) if (((x - 45) / (s * Math.min(ar, 1.6))) ** 2 + ((y - 35) / s) ** 2 <= 1) m.d[y * 90 + x] = 255; }
    if (shape === 1) IM.fillRect(m, Math.round(45 - s * ar), 35 - s, Math.round(45 + s * ar), 35 + s, 255);
    if (shape === 2) { IM.fillRect(m, 45 - s, 35 - s, 45 - s + Math.round(s * 0.7), 35 + s, 255); IM.fillRect(m, 45 - s, 35 + s - Math.round(s * 0.7), Math.round(45 + s * ar), 35 + s, 255); }
    const c = IM.components(m).comps[0]; const ctx = IM.show(cv, m);
    ctx.strokeStyle = '#2f4bd8'; ctx.lineWidth = 0.6; ctx.strokeRect(c.x0 - 0.5, c.y0 - 0.5, c.x1 - c.x0 + 1, c.y1 - c.y0 + 1);
    ctx.strokeStyle = '#2a9d3c'; ctx.beginPath(); ctx.arc(c.cx + 0.5, c.cy + 0.5, c.r, 0, 7); ctx.stroke(); ctx.fillStyle = '#e8590c'; ctx.beginPath(); ctx.arc(c.cx + 0.5, c.cy + 0.5, 1.4, 0, 7); ctx.fill();
    out.innerHTML = '<table class="mini" style="direction:rtl"><tr><td>שטח (m00)</td><td>' + c.area + '</td></tr><tr><td>היקף</td><td>' + V.fmt(c.perimeter, 0) + '</td></tr><tr><td>מרכז (m10/m00, m01/m00)</td><td class="ltr">(' + V.fmt(c.cx, 1) + ', ' + V.fmt(c.cy, 1) + ')</td></tr><tr><td>מלבן חוסם</td><td>' + (c.x1 - c.x0 + 1) + ' על ' + (c.y1 - c.y0 + 1) + '</td></tr><tr><td>רדיוס חוסם</td><td>' + V.fmt(c.r, 1) + '</td></tr><tr><td>עגלגלות 4πA/P²</td><td><b>' + V.fmt(c.circ, 2) + '</b></td></tr></table>';
  }
  draw();
};

/* 7.2 three orange blobs and their measures */
W.w1_contours = function (box) {
  V.say(box, 'תמונת הבדיקה של הסעיף: כדור, קופסה ונקודה קטנה, כולם באותו כתום. <b>לחץ על כתם</b> כדי לראות את המדדים שלו.');
  const im = IM.color(100, 75, [40, 40, 40]); IM.fillCircle(im, 25, 37, 11, [0, 140, 255]); IM.fillRect(im, 55, 20, 82, 35, [0, 140, 255]); IM.fillCircle(im, 75, 60, 1, [0, 140, 255]);
  const m = IM.inRange(im, [5, 120, 40], [25, 255, 255], 'hsv'); const { lab, comps } = IM.components(m);
  const names = c => c.area < 20 ? 'נקודה' : c.circ > 0.82 ? 'כדור' : 'קופסה'; let sel = null;
  const rr = row(box); const cv = IM.canvas(rr, 100, 75, 4); const out = V.say(box);
  cv.addEventListener('click', e => { const [x, y] = IM.mouse(cv, e); let best = null, bd = 1e9; comps.forEach(c => { const d = Math.hypot(c.cx - x, c.cy - y); if (d < bd) { bd = d; best = c; } }); sel = best; draw(); });
  function draw() { const ctx = IM.show(cv, im); comps.forEach(c => { ctx.strokeStyle = c === sel ? '#ff0' : '#4c6ef5'; ctx.lineWidth = 0.5; ctx.strokeRect(c.x0 - 0.5, c.y0 - 0.5, c.x1 - c.x0 + 1, c.y1 - c.y0 + 1); });
    out.innerHTML = sel ? '<b>' + names(sel) + '</b>: שטח ' + sel.area + ', מרכז <span class="ltr" style="display:inline-block">(' + V.fmt(sel.cx, 0) + ', ' + V.fmt(sel.cy, 0) + ')</span>, מלבן ' + (sel.x1 - sel.x0 + 1) + ' על ' + (sel.y1 - sel.y0 + 1) + ', עגלגלות <b>' + V.fmt(sel.circ, 2) + '</b>. ' + (names(sel) === 'כדור' ? 'כדור מפיקסלים לא מגיע ל־1, כי הגבול מדורג.' : '') : 'נמצאו <b>' + comps.length + '</b> מתארים.'; }
  draw();
};

/* 7.3 filter by area and circularity */
W.w1_filter_objects = function (box) {
  V.say(box, 'הרבה מתארים, רק אחד מהם הכדור. קבע <b>שטח מינימלי</b> ו<b>עגלגלות מינימלית</b>, עד שנשאר רק הוא. מתאר שעבר מסומן בירוק.');
  const m = IM.gray(110, 70); IM.fillCircle(m, 30, 35, 13, 255); IM.fillRect(m, 60, 12, 95, 30, 255); IM.fillRect(m, 62, 45, 70, 62, 255); const r = IM.rng(8); for (let k = 0; k < 14; k++) IM.fillCircle(m, r() * 110, r() * 70, r() * 1.6, 255);
  const { comps } = IM.components(m); let A = 0, C = 0;
  const sr = V.row(box); V.slider(sr, 'שטח מינימלי', 0, 400, 10, A, v => { A = v; draw(); }); V.slider(sr, 'עגלגלות מינימלית', 0, 1, 0.02, C, v => { C = v; draw(); });
  const rr = row(box); const cv = IM.canvas(rr, 110, 70, 4); const out = V.say(box);
  function draw() { const ctx = IM.show(cv, m); const pass = comps.filter(c => c.area > A && c.circ >= C);
    comps.forEach(c => { const ok = pass.includes(c); ctx.strokeStyle = ok ? '#2f9e44' : 'rgba(255,80,80,.6)'; ctx.lineWidth = ok ? 0.8 : 0.4; ctx.strokeRect(c.x0 - 0.5, c.y0 - 0.5, c.x1 - c.x0 + 1, c.y1 - c.y0 + 1); });
    const win = pass.length === 1 && pass[0].circ > 0.8;
    out.innerHTML = 'עברו <b>' + pass.length + '</b> מתוך ' + comps.length + '. ' + (win ? '<b class="good">נשאר רק הכדור ✓</b> בקוד זה: <code class="inline-code">[c for c in contours if cv2.contourArea(c) > ' + A + ']</code> ואז הכי עגול.' : ''); }
  draw();
};

/* 7.4 the full color tracker on the ball video */
W.w1_tracker = function (box) {
  V.say(box, 'העוקב המלא על <code class="inline-code">ball.mp4</code>: בכל פריים מסכה, מתאר הכי גדול, ומרכז שנשמר ב־<code class="inline-code">track</code>. הדלק את "עצם נוסף באותו צבע" כדי לראות את הבעיה משאלת הראיון.');
  let i = 0, timer = null, other = false, nearest = false; const track = [];
  V.tabs(box, ['רק הכדור', 'עצם נוסף באותו צבע'], k => { other = k === 1; track.length = 0; i = 0; draw(); });
  V.tabs(box, ['בחירה: המתאר הגדול ביותר', 'בחירה: הקרוב למיקום הקודם'], k => { nearest = k === 1; track.length = 0; i = 0; draw(); });
  const rr = row(box); const cv = IM.canvas(col(rr, 'פריים + מסלול'), 128, 96, 3); const cm = IM.canvas(col(rr, 'המסכה'), 128, 96, 2); const out = V.say(box);
  V.btns(box, [['▶ נגן / עצור', () => { if (timer) { clearInterval(timer); timer = null; } else timer = setInterval(() => { i = (i + 1) % 90; if (!i) track.length = 0; draw(); }, 70); }, 'primary']]);
  cleanup(box, () => clearInterval(timer));
  function draw() {
    const im = IM.color(128, 96, [0, 0, 0]); const bx = 10 + i * 1.2, by = 48; IM.fillCircle(im, bx, by, 4, [0, 200, 255]);
    if (other) IM.fillRect(im, 60 + Math.round(10 * Math.sin(i / 8)), 20, 80 + Math.round(10 * Math.sin(i / 8)), 34, [0, 190, 250]);
    const m = IM.inRange(im, [10, 120, 70], [35, 255, 255], 'hsv'); const { comps } = IM.components(m);
    let c = null; if (comps.length) { if (nearest && track.length && track[track.length - 1]) { const p = track[track.length - 1]; c = comps.reduce((a, b) => Math.hypot(a.cx - p[0], a.cy - p[1]) < Math.hypot(b.cx - p[0], b.cy - p[1]) ? a : b); } else c = comps.reduce((a, b) => a.area > b.area ? a : b); }
    track.push(c ? [c.cx, c.cy] : null);
    const ctx = IM.show(cv, im); ctx.strokeStyle = '#2f9e44'; ctx.lineWidth = 0.7; ctx.beginPath(); track.slice(-40).forEach((p, k) => { if (p) { k ? ctx.lineTo(p[0] + 0.5, p[1] + 0.5) : ctx.moveTo(p[0] + 0.5, p[1] + 0.5); } }); ctx.stroke();
    if (c) { ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(c.cx + 0.5, c.cy + 0.5, c.r + 1, 0, 7); ctx.stroke(); }
    IM.show(cm, m);
    const err = c ? Math.hypot(c.cx - bx, c.cy - by) : null;
    out.innerHTML = 'פריים ' + i + ' · מרכז שנמצא: ' + (c ? '<span class="ltr" style="display:inline-block">(' + V.fmt(c.cx, 1) + ', ' + V.fmt(c.cy, 1) + ')</span>' : 'None') + ' · שגיאה: ' + (err === null ? '—' : '<b' + (err > 3 ? ' class="bad"' : '') + '>' + V.fmt(err, 1) + '</b>') + (err > 3 ? ' — העוקב ננעל על העצם האחר, הגדול יותר.' : '');
  }
  draw();
};

/* ===== chapter 8 ===== */
const tile = () => { const im = IM.color(48, 36, [235, 235, 235]); IM.fillRect(im, 6, 6, 41, 29, [60, 60, 200]); IM.fillCircle(im, 16, 18, 6, [40, 200, 250]); IM.fillRect(im, 26, 12, 36, 24, [60, 160, 40]); for (let x = 6; x < 42; x += 2) IM.set(im, x, 32, [0, 0, 0]); return im; };

W.w1_resize = function (box) {
  V.say(box, 'תמונה קטנה של 48 על 36. <b>הגדל אותה</b> עם כל אחת משיטות האינטרפולציה והשווה. שים לב שהגודל נכתב (רוחב, גובה), אבל הצורה של המערך יוצאת (גובה, רוחב).');
  const im = tile(); let f = 3, mode = 'nearest';
  V.tabs(box, ['INTER_NEAREST', 'INTER_LINEAR'], i => { mode = i ? 'bilinear' : 'nearest'; draw(); });
  V.slider(box, 'פי כמה', 1, 6, 0.5, f, v => { f = v; draw(); });
  const rr = row(box); const cv = IM.canvas(rr, 48, 36, 1); cv.style.imageRendering = 'auto'; const code = mono(box, '');
  function draw() { const w = Math.round(48 * f), h = Math.round(36 * f); const o = IM.color(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) IM.set(o, x, y, IM.sample(im, (x + 0.5) / f - 0.5, (y + 0.5) / f - 0.5, mode === 'nearest' ? 'nearest' : '')); IM.show(cv, o); cv.style.width = w * 2 + 'px';
    code.textContent = 'big = cv2.resize(img, (' + w + ', ' + h + '), interpolation=cv2.' + (mode === 'nearest' ? 'INTER_NEAREST' : 'INTER_LINEAR') + ')\nprint(big.shape)   # (' + h + ', ' + w + ', 3)'; }
  draw();
};

W.w1_affine = function (box) {
  V.say(box, 'מטריצה אפינית 2×3: שתי העמודות הראשונות מסובבות ומגדילות, השלישית מזיזה. הזז את הפרמטרים וקרא את המטריצה שהספרייה הייתה בונה.');
  const im = IM.color(80, 60, [0, 0, 0]); IM.fillRect(im, 30, 20, 49, 39, [255, 255, 255]); IM.fillRect(im, 30, 20, 35, 25, [0, 0, 255]);
  let tx = 0, ty = 0, ang = 0, sc = 1;
  const sr = V.row(box); V.slider(sr, 'הזזה x', -30, 30, 1, tx, v => { tx = v; draw(); }); V.slider(sr, 'הזזה y', -20, 20, 1, ty, v => { ty = v; draw(); }); V.slider(sr, 'זווית', -180, 180, 5, ang, v => { ang = v; draw(); }); V.slider(sr, 'הגדלה', 0.5, 1.5, 0.05, sc, v => { sc = v; draw(); });
  const rr = row(box); const cv = IM.canvas(rr, 80, 60, 4); const code = mono(box, '');
  function draw() {
    const a = ang * Math.PI / 180, al = sc * Math.cos(a), be = sc * Math.sin(a), cx = 40, cy = 30;
    const M = [[al, be, (1 - al) * cx - be * cy + tx], [-be, al, be * cx + (1 - al) * cy + ty]];   // like getRotationMatrix2D + shift
    IM.show(cv, IM.warp(im, IM.aff(M), 80, 60));
    code.textContent = 'M = cv2.getRotationMatrix2D((40, 30), ' + ang + ', ' + sc + ')  # + shift (' + tx + ', ' + ty + ')\n[[' + V.fmt(M[0][0], 3) + ', ' + V.fmt(M[0][1], 3) + ', ' + V.fmt(M[0][2], 1) + '],\n [' + V.fmt(M[1][0], 3) + ', ' + V.fmt(M[1][1], 3) + ', ' + V.fmt(M[1][2], 1) + ']]';
  }
  draw();
};

W.w1_perspective = function (box) {
  V.say(box, 'שלט שצולם מזווית. <b>גרור את ארבע הפינות</b> כך שיתאימו לשלט, והתמונה המיושרת מתעדכנת מיד. כפתור "סדר שגוי" מחליף שתי פינות, כמו בתרגיל 8.2.');
  const src = IM.color(100, 75, [40, 40, 40]); const quad0 = [[30, 15], [82, 22], [77, 60], [22, 52]];
  const Hs = V.homography([[0, 0], [100, 0], [100, 50], [0, 50]], quad0); const sign = IM.color(100, 50, [255, 255, 255]); for (let y = 10; y < 40; y += 10) IM.fillRect(sign, 10, y, 89, y + 4, [40, 40, 160]); IM.fillRect(sign, 0, 0, 99, 2, [0, 120, 0]);
  const S2 = IM.warp(sign, Hs, 100, 75); for (let i = 0; i < 100 * 75; i++) { const p = IM.get3(S2, i % 100, (i / 100) | 0); if (p[0] + p[1] + p[2] > 0) IM.set(src, i % 100, (i / 100) | 0, p); }
  let q = quad0.map(p => p.slice()), swap = false;
  const rr = row(box); const wrap = el('div', { style: { position: 'relative' } }); rr.appendChild(wrap); const cv = IM.canvas(wrap, 100, 75, 3.6); const co = IM.canvas(col(rr, 'מיושר: 100 על 50'), 100, 50, 3);
  const out = V.say(box); V.btns(box, [['סדר שגוי / נכון', () => { swap = !swap; draw(); }], ['איפוס', () => { q = quad0.map(p => p.slice()); draw(); }, 'ghost']]);
  let drag = -1;
  cv.addEventListener('pointerdown', e => { const [x, y] = IM.mouse(cv, e); q.forEach((p, k) => { if (Math.hypot(p[0] - x, p[1] - y) < 6) drag = k; }); cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (drag < 0) return; const [x, y] = IM.mouse(cv, e); q[drag] = [x, y]; draw(); });
  cv.addEventListener('pointerup', () => { drag = -1; });
  function draw() {
    const ctx = IM.show(cv, src); ctx.strokeStyle = '#ff0'; ctx.lineWidth = 0.6; ctx.beginPath(); q.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.stroke();
    q.forEach((p, k) => { ctx.fillStyle = ['#f03e3e', '#37b24d', '#1c7ed6', '#f59f00'][k]; ctx.beginPath(); ctx.arc(p[0], p[1], 2.2, 0, 7); ctx.fill(); });
    const qq = swap ? [q[0], q[1], q[3], q[2]] : q; const H = V.homography(qq, [[0, 0], [100, 0], [100, 50], [0, 50]]);
    IM.show(co, IM.warp(src, H, 100, 50));
    out.innerHTML = swap ? 'הפינות התחתונות הוחלפו: התוצאה מקופלת "כמו עניבה". תמיד אותו סדר בשתי הרשימות.' : 'הסדר: שמאל־למעלה (אדום), ימין־למעלה (ירוק), ימין־למטה (כחול), שמאל־למטה (כתום). ארבע התאמות = 8 משוואות = הומוגרפיה אחת.';
  }
  draw();
};

W.w1_hpoint = function (box) {
  V.say(box, 'מה עושה ההומוגרפיה לנקודה אחת: כופלים בווקטור <b>(x, y, 1)</b>, ואז <b>מחלקים ברכיב השלישי</b>. בחר פינה של השלט מסעיף 8.4 וראה את החישוב.');
  const quad = [[120, 60], [330, 90], [310, 240], [90, 210]], dst = [[0, 0], [400, 0], [400, 200], [0, 200]]; const H = V.homography(quad, dst);
  const out = el('div', { class: 'mono', style: { direction: 'ltr', textAlign: 'left', fontSize: '.9em' } });
  V.tabs(box, ['שמאל־למעלה', 'ימין־למעלה', 'ימין־למטה', 'שמאל־למטה', 'מרכז המרובע'], i => { const p = i < 4 ? quad[i] : [212.5, 150]; const v = [0, 1, 2].map(r => H[r][0] * p[0] + H[r][1] * p[1] + H[r][2]); out.innerHTML = 'H · (' + p[0] + ', ' + p[1] + ', 1) = (' + V.fmt(v[0], 2) + ', ' + V.fmt(v[1], 2) + ', <b>' + V.fmt(v[2], 3) + '</b>)\n→ (' + V.fmt(v[0], 2) + ' / ' + V.fmt(v[2], 3) + ', ' + V.fmt(v[1], 2) + ' / ' + V.fmt(v[2], 3) + ') = <b>(' + V.fmt(v[0] / v[2], 1) + ', ' + V.fmt(v[1] / v[2], 1) + ')</b>'; out.style.whiteSpace = 'pre-wrap'; note.innerHTML = i < 4 ? 'הפינה נוחתת בדיוק בפינה המתאימה של המלבן 400 על 200.' : 'המרכז של המרובע <b>לא</b> נוחת במרכז המלבן (200, 100): הטלה פרספקטיבית לא שומרת על אמצעים. זה ההבדל מטרנספורמציה אפינית.'; });
  box.appendChild(out); const note = V.say(box);
  const Hm = el('div', { class: 'mono note-small', style: { direction: 'ltr', textAlign: 'left', marginTop: '6px' } }); Hm.textContent = 'H =\n' + H.map(r => '[' + r.map(v => V.fmt(v, 4)).join(', ') + ']').join('\n'); Hm.style.whiteSpace = 'pre'; box.appendChild(Hm);
  setTimeout(() => box.querySelector('.tabs button').click(), 0);
};

W.w1_dof = function (box) {
  V.say(box, 'ארבע משפחות של טרנספורמציות, מהפשוטה לחופשית. לכל אחת: כמה מספרים חופשיים (דרגות חופש) ומה היא <b>יכולה</b> לעשות לרשת. נסה לשבור מקבילות בכל אחת.');
  let fam = 0; const ps = [0, 0, 0, 0, 0, 0, 0, 0];
  const tabs = V.tabs(box, ['הזזה (2)', 'אוקלידית (3)', 'אפינית (6)', 'הומוגרפיה (8)'], i => { fam = i; build(); });
  const sl = el('div'); box.appendChild(sl);
  const svg = V.s('svg', { viewBox: '-60 -60 220 180', width: 300, style: { maxWidth: '100%', direction: 'ltr' } }); const rr = row(box); rr.appendChild(svg); const out = V.say(box);
  const names = [['tx', 'ty'], ['tx', 'ty', 'זווית'], ['a', 'b', 'c', 'd', 'tx', 'ty'], ['a', 'b', 'c', 'd', 'tx', 'ty', 'g', 'h']];
  function build() { sl.innerHTML = ''; ps.fill(0); const r = V.row(sl); names[fam].forEach((n, k) => V.slider(r, n, -1, 1, 0.05, 0, v => { ps[k] = v; draw(); })); draw(); }
  function M() { const p = ps; if (fam === 0) return [[1, 0, 40 * p[0]], [0, 1, 40 * p[1]], [0, 0, 1]]; if (fam === 1) { const a = p[2] * Math.PI; return [[Math.cos(a), -Math.sin(a), 40 * p[0]], [Math.sin(a), Math.cos(a), 40 * p[1]], [0, 0, 1]]; } if (fam === 2) return [[1 + p[0] * 0.8, p[1] * 0.8, 40 * p[4]], [p[2] * 0.8, 1 + p[3] * 0.8, 40 * p[5]], [0, 0, 1]]; return [[1 + p[0] * 0.8, p[1] * 0.8, 40 * p[4]], [p[2] * 0.8, 1 + p[3] * 0.8, 40 * p[5]], [p[6] * 0.008, p[7] * 0.008, 1]]; }
  function draw() { svg.innerHTML = ''; const H = M(); const T = (x, y) => V.applyH(H, [x, y]);
    for (let k = 0; k <= 4; k++) { const a = T(0, k * 25), b = T(100, k * 25), c = T(k * 25, 0), d = T(k * 25, 100); V.s('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], style: { stroke: 'var(--c1)', strokeWidth: 1.5 } }, svg); V.s('line', { x1: c[0], y1: c[1], x2: d[0], y2: d[1], style: { stroke: 'var(--c2)', strokeWidth: 1.5 } }, svg); }
    out.innerHTML = ['רק מזיזה. צריך נקודה אחת כדי לחשב אותה.', 'מזיזה ומסובבת, הצורה לא משתנה. שתי נקודות. זה המודל של רעידת מצלמה בפרק 11.', 'יכולה לגזור ולמתוח, אבל קווים מקבילים <b>נשארים מקבילים</b>. שלוש נקודות.', 'שני המספרים בשורה התחתונה (g, h) שוברים את המקבילות: זה מה שמאפשר ליישר שלט. ארבע נקודות.'][fam]; }
  build();
};

/* ===== chapter 9 ===== */
const sceneGray = (seed, w = 96, h = 72) => IM.toGray(IM.scene(w, h, seed, 22));

W.w1_patch_unique = function (box) {
  V.say(box, '<b>לחץ על מקום בתמונה.</b> מימין: מפה של כמה כל מקום בתמונה דומה לחלון שבחרת (בהיר = דומה). על משטח אחיד הכול דומה, על קצה יש קו שלם של דומים, ורק בפינה יש נקודה אחת.');
  const im = IM.gray(96, 72, 200); IM.fillRect(im, 20, 20, 70, 55, 70); const r = IM.rng(4); for (let i = 0; i < im.d.length; i++) im.d[i] += (r() - 0.5) * 6;
  const rr = row(box); const c0 = IM.canvas(rr, 96, 72, 3); const c1 = IM.canvas(rr, 96, 72, 3); const out = V.say(box);
  let px = 45, py = 20;
  c0.addEventListener('click', e => { [px, py] = IM.mouse(c0, e); draw(); });
  V.btns(box, [['משטח', () => { px = 80; py = 62; draw(); }], ['קצה', () => { px = 45; py = 20; draw(); }], ['פינה', () => { px = 20; py = 20; draw(); }]]);
  function draw() { const ctx = IM.show(c0, im); ctx.strokeStyle = '#f0f'; ctx.lineWidth = 0.6; ctx.strokeRect(px - 3.5, py - 3.5, 7, 7);
    const S = IM.gray(96, 72); let n = 0; for (let y = 3; y < 69; y++) for (let x = 3; x < 93; x++) { let d = 0; for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) d += (IM.at(im, x + j, y + i) - IM.at(im, px + j, py + i)) ** 2; const s = Math.exp(-d / 20000); S.d[y * 96 + x] = 255 * Math.sqrt(s); if (s > 0.5) n++; }
    IM.show(c1, S); out.innerHTML = 'מקומות שנראים כמעט אותו דבר: <b>' + n + '</b>. ' + (n < 15 ? '<b class="good">פינה: ייחודית בשני הכיוונים.</b>' : n < 200 ? 'קצה: אפשר להחליק לאורכו.' : 'משטח אחיד: אין שום דרך לדעת איפה בדיוק.'); }
  draw();
};

W.w1_descriptor = function (box) {
  V.say(box, 'מתאר בינארי בסגנון ORB: בתוך החלון סביב הנקודה בוחרים זוגות פיקסלים קבועים, וכל ביט עונה על "האם פיקסל א׳ בהיר מפיקסל ב׳". בחר שתי נקודות והשווה את המתארים: <b>מרחק המינג</b> הוא מספר הביטים השונים.');
  const g = IM.blur(sceneGray(5), 3); const r = IM.rng(11); const pairs = [...Array(32)].map(() => [Math.round((r() - 0.5) * 12), Math.round((r() - 0.5) * 12), Math.round((r() - 0.5) * 12), Math.round((r() - 0.5) * 12)]);
  const g2 = IM.shift(g, 3, 2); let pA = [30, 30], pB = [33, 32], which = 0;
  { let best = -1; for (let y = 10; y < 62; y += 2) for (let x = 10; x < 86; x += 2) { const v = pairs.reduce((acc, [a, b, c, d]) => acc + (IM.at(g, x + a, y + b) < IM.at(g, x + c, y + d) ? 1 : 0), 0); const sc = -Math.abs(v - 16); if (sc > best) { best = sc; pA = [x, y]; } } pB = [pA[0] + 3, pA[1] + 2]; }
  const rr = row(box); const c0 = IM.canvas(col(rr, 'תמונה 1'), 96, 72, 3); const c1 = IM.canvas(col(rr, 'תמונה 2 (מוזזת ב־3, 2)'), 96, 72, 3);
  c0.addEventListener('click', e => { pA = IM.mouse(c0, e); draw(); }); c1.addEventListener('click', e => { pB = IM.mouse(c1, e); draw(); });
  const bits = el('div', { class: 'mono', style: { direction: 'ltr', textAlign: 'center', letterSpacing: '2px' } }); box.appendChild(bits); const out = V.say(box);
  const desc = (G, p) => pairs.map(([a, b, c, d]) => IM.at(G, p[0] + a, p[1] + b) < IM.at(G, p[0] + c, p[1] + d) ? 1 : 0);
  function draw() { const a = desc(g, pA), b = desc(g2, pB); const ham = a.reduce((s, v, i) => s + (v !== b[i]), 0);
    [[c0, g, pA], [c1, g2, pB]].forEach(([cv, G, p]) => { const ctx = IM.show(cv, G); ctx.strokeStyle = '#f0f'; ctx.lineWidth = 0.5; ctx.strokeRect(p[0] - 6, p[1] - 6, 12, 12); });
    bits.innerHTML = a.join('') + '<br>' + b.map((v, i) => v !== a[i] ? '<b style="color:var(--c2)">' + v + '</b>' : v).join('');
    out.innerHTML = 'מרחק המינג: <b>' + ham + '</b> מתוך 32. ' + (ham <= 5 ? '<b class="good">כנראה אותה נקודה בעולם.</b>' : ham >= 12 ? 'מתארים רחוקים: כנראה נקודות שונות.' : '') + ' (המתאר האמיתי של ORB הוא 256 ביטים.)'; }
  draw();
};

W.w1_ratio = function (box) {
  V.say(box, 'כל שורה היא נקודה מהתמונה הראשונה, עם המרחק לשכן הקרוב ביותר (d1) ולשני (d2) בתמונה השנייה. ההתאמה נשמרת אם <b>d1 &lt; יחס · d2</b>. הזז את היחס וראה כמה התאמות נכונות ושגויות נשארות.');
  const r = IM.rng(21); const rows = [...Array(40)].map((_, k) => { const good = r() < 0.6; const d2 = 40 + r() * 30; const d1 = good ? d2 * (0.15 + r() * 0.55) : d2 * (0.7 + r() * 0.3); return { good, d1, d2 }; });
  let ratio = 0.75;
  V.slider(box, 'יחס', 0.3, 1, 0.01, ratio, v => { ratio = v; draw(); });
  const svg = V.s('svg', { viewBox: '0 0 420 150', width: 420, style: { maxWidth: '100%', direction: 'ltr' } }); const rr = row(box); rr.appendChild(svg); const out = V.say(box);
  function draw() { svg.innerHTML = ''; let kg = 0, kb = 0, tg = rows.filter(x => x.good).length;
    rows.forEach((x, k) => { const keep = x.d1 < ratio * x.d2; if (keep) x.good ? kg++ : kb++; const X = 10 + k * 10; V.s('rect', { x: X, y: 140 - x.d1 / x.d2 * 130, width: 7, height: x.d1 / x.d2 * 130, style: { fill: x.good ? 'var(--c3)' : 'var(--c2)', opacity: keep ? 1 : 0.2 } }, svg); });
    V.s('line', { x1: 0, x2: 420, y1: 140 - ratio * 130, y2: 140 - ratio * 130, style: { stroke: 'var(--ink)', strokeDasharray: '4 3' } }, svg);
    out.innerHTML = 'הגובה של כל עמודה הוא d1/d2. ירוק = התאמה נכונה, כתום = שגויה. נשארו <b>' + kg + '</b> נכונות מתוך ' + tg + ' ו־<b>' + kb + '</b> שגויות. ' + (ratio > 0.9 ? 'יחס גבוה משאיר הרבה שגויות.' : ratio < 0.45 ? 'יחס נמוך זורק גם הרבה נכונות.' : ''); }
  draw();
};

W.w1_ransac = function (box) {
  V.say(box, 'התאמת קו ישר לנקודות שבהן 30% שגויות לגמרי, כמו בתרגיל 9.4. הקו האפור הוא ריבועים פחותים על כולן. <b>עבור על הניסיונות של רנסק</b>: בכל ניסיון 2 נקודות אקראיות, קו דרכן, וספירת המסכימות (פחות מ־1 מהקו).');
  const r = IM.rng(3); const pts = [...Array(50)].map((_, k) => { const x = r() * 100; return k < 15 ? [x, r() * 300] : [x, 2 * x + 5 + IM.randn(r) * 0.8]; });
  const fit = P => { const n = P.length, sx = P.reduce((s, p) => s + p[0], 0), sy = P.reduce((s, p) => s + p[1], 0), sxx = P.reduce((s, p) => s + p[0] * p[0], 0), sxy = P.reduce((s, p) => s + p[0] * p[1], 0); const a = (n * sxy - sx * sy) / (n * sxx - sx * sx); return [a, (sy - a * sx) / n]; };
  const ls = fit(pts); const tries = [...Array(12)].map(() => { const i = Math.floor(r() * 50); let j = Math.floor(r() * 50); if (j === i) j = (j + 1) % 50; const [x1, y1] = pts[i], [x2, y2] = pts[j]; const a = (y2 - y1) / (x2 - x1), b = y1 - a * x1; const inl = pts.filter(p => Math.abs(p[1] - (a * p[0] + b)) < 3); return { i, j, a, b, n: inl.length }; });
  const svg = V.s('svg', { viewBox: '0 0 420 230', width: 420, style: { maxWidth: '100%', direction: 'ltr' } }); const rr = row(box); rr.appendChild(svg); const out = V.say(box);
  const X = x => 20 + x * 3.9, Y = y => 220 - y / 300 * 210;
  function draw(k) { svg.innerHTML = ''; const done = k >= tries.length; const best = tries.slice(0, Math.min(k + 1, tries.length)).reduce((a, b) => b.n > a.n ? b : a);
    const t = done ? best : tries[k];
    pts.forEach((p, i) => { const inl = Math.abs(p[1] - (t.a * p[0] + t.b)) < 3; V.s('circle', { cx: X(p[0]), cy: Y(p[1]), r: (!done && (i === t.i || i === t.j)) ? 5 : 3, style: { fill: inl ? 'var(--c3)' : 'var(--ink3)' } }, svg); });
    V.s('line', { x1: X(0), y1: Y(ls[1]), x2: X(100), y2: Y(ls[0] * 100 + ls[1]), style: { stroke: 'var(--ink3)', strokeWidth: 2, strokeDasharray: '5 4' } }, svg);
    let line = t; if (done) { const inl = pts.filter(p => Math.abs(p[1] - (best.a * p[0] + best.b)) < 3); const f = fit(inl); line = { a: f[0], b: f[1] }; }
    V.s('line', { x1: X(0), y1: Y(line.b), x2: X(100), y2: Y(line.a * 100 + line.b), style: { stroke: done ? 'var(--c3)' : 'var(--c1)', strokeWidth: 2.5 } }, svg);
    out.innerHTML = done ? 'הניסיון הטוב ביותר: <b>' + best.n + '</b> מסכימות. השלב האחרון: ריבועים פחותים רק עליהן. התוצאה: שיפוע <b>' + V.fmt(line.a, 2) + '</b>, חיתוך <b>' + V.fmt(line.b, 1) + '</b> (האמת: 2 ו־5). ריבועים פחותים על הכול (מקווקו): שיפוע ' + V.fmt(ls[0], 2) + '.' : 'ניסיון ' + (k + 1) + ': <b>' + t.n + '</b> נקודות מסכימות (בירוק). הטוב ביותר עד עכשיו: ' + best.n + '.'; }
  V.stepper(box, tries.length + 1, draw, { speed: 900 });
};

W.w1_fail_cases = function (box) {
  V.say(box, 'גלאי פינות על ארבעה סוגי תמונות. בחר תמונה וראה כמה פינות שימושיות יש בה (מסומנות בצהוב).');
  const rr = row(box); const cv = IM.canvas(rr, 96, 72, 3.5); const out = V.say(box);
  V.tabs(box, ['סצנה רגילה', 'קיר חלק', 'אריחים חוזרים', 'טשטוש תנועה'], i => {
    let g; if (i === 0) g = sceneGray(7); if (i === 1) { g = IM.gray(96, 72, 180); const r = IM.rng(2); g = IM.map(g, v => v + (r() - 0.5) * 3); }
    if (i === 2) { g = IM.gray(96, 72); for (let y = 0; y < 72; y++) for (let x = 0; x < 96; x++) g.d[y * 96 + x] = ((Math.floor(x / 12) + Math.floor(y / 12)) % 2) ? 200 : 60; }
    if (i === 3) { const s = sceneGray(7); g = IM.conv(s, [Array(9).fill(1 / 9)]); }
    const cs = IM.corners(g, 40, 6, 0.08); const ctx = IM.show(cv, g); ctx.fillStyle = '#ffd43b'; cs.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x + 0.5, y + 0.5, 1.4, 0, 7); ctx.fill(); });
    out.innerHTML = ['<b>' + cs.length + '</b> פינות, מפוזרות ושונות זו מזו: מצב טוב להתאמה.', 'כמעט אין פינות: בקיר חלק אין במה להיאחז.', '<b>' + cs.length + '</b> פינות, אבל <b>כולן נראות אותו דבר</b>. מתאר לא יבדיל ביניהן, וההתאמות יהיו שגויות.', 'הטשטוש האופקי מורח את הפינות לקווים: נשארו <b>' + cs.length + '</b>, וגם הן פחות אמינות.'][i];
  });
  setTimeout(() => box.querySelector('.tabs button').click(), 0);
};
})();
