/* Module 3 — lab-grade demos for chapters 2 and on. Loaded after m3_labs.js (and m3_c.js), so the ids here
   override the old ones. Adds a small 3D "world" renderer (the recurring scene of the module: a road seen from a
   camera on a car or from a drone) and exports it on window.LAB3. */
(function () {
const W = window.W, V = window.V, G = window.G, el = V.el;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const F = (v, d) => { if (v === null || v === undefined || !isFinite(v)) return '∞'; const s = (+v).toFixed(d == null ? 2 : d); return (s === '-0' || /^-0\.0*$/.test(s) ? s.slice(1) : s).replace('-', '−'); };
const ltr = s => '<span dir="ltr" style="display:inline-block;direction:ltr;unicode-bidi:isolate">‪' + s + '‬</span>';
const badge = (ok, t) => '<b style="color:' + (ok ? '#2b8a3e' : '#c92a2a') + '">' + (ok ? '✓ ' : '✗ ') + t + '</b>';
const mono = parent => { const p = el('pre', { class: 'code', style: { direction: 'ltr', textAlign: 'left', fontSize: '12.5px', margin: '6px 0', padding: '8px 10px', background: 'var(--surface2)', borderRadius: '8px', whiteSpace: 'pre-wrap' } }); parent.appendChild(p); return p; };
const flex = (parent, gap) => { const d = el('div', { style: { display: 'flex', flexWrap: 'wrap', gap: (gap || 10) + 'px', justifyContent: 'center', alignItems: 'flex-start', direction: 'ltr' } }); parent.appendChild(d); return d; };
const colm = (parent, title) => { const d = el('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' } }); d.appendChild(el('div', { class: 'note-small', html: title || '·' })); parent.appendChild(d); return d; };
const canvas = (parent, w, h, cssW) => { const c = document.createElement('canvas'); c.dir = 'ltr'; c.width = w; c.height = h; c.style.width = (cssW || w) + 'px'; c.style.maxWidth = '100%'; c.style.borderRadius = '8px'; c.style.border = '1px solid var(--line)'; c.style.background = '#fff'; parent.appendChild(c); return c; };
const table = (head, rows) => '<table class="mini" style="margin:6px auto"><tr>' + head.map(h => '<th>' + h + '</th>').join('') + '</tr>' + rows.map(r => '<tr>' + r.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</table>';
const row = parent => { const r = el('div', { class: 'row' }); parent.appendChild(r); return r; };
const txt = (x, s, X, Y, col, size, align) => { x.fillStyle = col || '#495057'; x.font = (size || 12) + 'px sans-serif'; x.textAlign = align || 'left'; x.fillText(s, X, Y); x.textAlign = 'left'; };
const pill = (x, s, X, Y, col) => { x.font = '11px sans-serif'; const w = x.measureText(s).width + 8; x.fillStyle = 'rgba(255,255,255,.88)'; x.fillRect(X - 1, Y - 12, w, 16); x.strokeStyle = col || '#495057'; x.lineWidth = 1; x.strokeRect(X - 1, Y - 12, w, 16); txt(x, s, X + 3, Y, col || '#212529', 11); };
const mouse = (cv, e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
const fmtM = M => '[' + M.map(r => '[' + r.map(v => F(v, Math.abs(v) >= 100 ? 1 : 2)).join(', ') + ']').join(',\n ') + ']';

/* ============================================================ the world (x east, y north, z up, metres) */
function shade(hex, k) { const n = parseInt(hex.slice(1), 16); const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; const f = v => clamp(Math.round(v * k), 0, 255); return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')'; }
function box(x0, x1, y0, y1, z0, z1, col, tag) {
  const P = (x, y, z) => [x, y, z];
  return [
    { pts: [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], n: [0, 0, 1], col: shade(col, 1.08), tag },
    { pts: [P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1)], n: [0, -1, 0], col: shade(col, 0.92), tag },
    { pts: [P(x1, y1, z0), P(x0, y1, z0), P(x0, y1, z1), P(x1, y1, z1)], n: [0, 1, 0], col: shade(col, 0.8), tag },
    { pts: [P(x0, y1, z0), P(x0, y0, z0), P(x0, y0, z1), P(x0, y1, z1)], n: [-1, 0, 0], col: shade(col, 0.72), tag },
    { pts: [P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], n: [1, 0, 0], col: shade(col, 0.86), tag }];
}
const box3 = (...a) => box(...a);
/* a car centred at (x, y), heading along y (north) or along x when 'ew' */
function car(x, y, col, ew, tag) {
  const L = 4.5, Wd = 1.8; const hx = ew ? L / 2 : Wd / 2, hy = ew ? Wd / 2 : L / 2; const cx = ew ? 1.2 : 0.8, cy = ew ? 0.8 : 1.2;
  return box(x - hx, x + hx, y - hy, y + hy, 0.25, 1.0, col, tag).concat(box(x - cx, x + cx, y - cy - (ew ? 0 : 0.2), y + cy - (ew ? 0 : 0.2), 1.0, 1.45, '#cfd8dc', tag),
    box(x - hx + 0.15, x - hx + 0.55, y - hy + 0.15, y - hy + 0.55, 0, 0.25, '#212529', tag), box(x + hx - 0.55, x + hx - 0.15, y - hy + 0.15, y - hy + 0.55, 0, 0.25, '#212529', tag),
    box(x - hx + 0.15, x - hx + 0.55, y + hy - 0.55, y + hy - 0.15, 0, 0.25, '#212529', tag), box(x + hx - 0.55, x + hx - 0.15, y + hy - 0.55, y + hy - 0.15, 0, 0.25, '#212529', tag));
}
function flat(pts, col, layer, tag) { return { pts: pts.map(p => [p[0], p[1], p[2] || 0]), n: [0, 0, 1], col, layer, tag }; }
/* the recurring scene: a two-lane road going north, cars, a cone, a sign, two buildings, trees, and a car park */
function world3(opt) {
  opt = opt || {}; const F3 = { ground: [], marks: [], objects: [] }; const rnd = G.rng(11);
  for (let x = -80; x < 80; x += 20) for (let y = -40; y < 300; y += 20) { const g = 0.92 + 0.12 * rnd(); F3.ground.push(flat([[x, y], [x + 20, y], [x + 20, y + 20], [x, y + 20]], shade('#8fbf72', g), 0)); }
  for (let y = -40; y < 300; y += 20) F3.ground.push(flat([[-3.5, y], [3.5, y], [3.5, y + 20], [-3.5, y + 20]], '#6c7177', 1));
  for (let y = -40; y < 300; y += 20) { F3.marks.push(flat([[-3.4, y], [-3.25, y], [-3.25, y + 20], [-3.4, y + 20]], '#f1f3f5', 2)); F3.marks.push(flat([[3.25, y], [3.4, y], [3.4, y + 20], [3.25, y + 20]], '#f1f3f5', 2)); }
  for (let y = -36; y < 300; y += 9) F3.marks.push(flat([[-0.08, y], [0.08, y], [0.08, y + 3], [-0.08, y + 3]], '#f8f9fa', 2));
  /* a car park on the east side (a 6 × 3 grid of 2.5 × 5 m bays): flat lines, useful for homographies later */
  F3.ground.push(flat([[8, 30], [26, 30], [26, 60], [8, 60]], '#868e96', 1, 'park'));
  for (let i = 0; i <= 6; i++) F3.marks.push(flat([[8 + i * 3 - 0.06, 30], [8 + i * 3 + 0.06, 30], [8 + i * 3 + 0.06, 40], [8 + i * 3 - 0.06, 40]], '#f8f9fa', 2));
  for (let i = 0; i <= 6; i++) F3.marks.push(flat([[8 + i * 3 - 0.06, 50], [8 + i * 3 + 0.06, 50], [8 + i * 3 + 0.06, 60], [8 + i * 3 - 0.06, 60]], '#f8f9fa', 2));
  const cars = opt.cars || [[1.75, 10, '#1c7ed6'], [-1.75, 24, '#e03131'], [1.75, 38, '#f08c00'], [-1.75, 60, '#495057'], [1.75, 95, '#2f9e44'], [12.5, 35, '#7048e8', 1], [18.5, 55, '#c2255c', 1]];
  cars.forEach((c, i) => { F3.objects.push(...car(c[0], c[1], c[2], c[3], 'car' + i)); });
  F3.objects.push(...box(-4.4, -4.3, 18, 18.1, 0, 2.2, '#868e96', 'sign'), ...box(-4.85, -3.85, 17.95, 18.0, 1.6, 2.4, '#1971c2', 'sign'));
  F3.objects.push(...box(3.9, 4.2, 14, 14.3, 0, 0.7, '#fd7e14', 'cone'));
  F3.objects.push(...box(-28, -14, 40, 56, 0, 9, '#ced4da', 'bld'), ...box(-30, -16, 90, 110, 0, 14, '#dee2e6', 'bld'), ...box(30, 44, 70, 84, 0, 7, '#e9ecef', 'bld'));
  [[-8, 8], [-9, 30], [-7.5, 70], [7.5, 75], [-8, 120], [7, 130], [9, 12]].forEach(([x, y]) => F3.objects.push(...box(x - 0.15, x + 0.15, y - 0.15, y + 0.15, 0, 2, '#8d6e63', 'tree'), ...box(x - 1.3, x + 1.3, y - 1.3, y + 1.3, 2, 4.4, '#5c940d', 'tree')));
  return { faces: F3, cars };
}
/* clip a polygon (camera coordinates) to Z > zn */
function clipNear(ps, zn) { const out = []; for (let i = 0; i < ps.length; i++) { const a = ps[i], b = ps[(i + 1) % ps.length]; const ia = a[2] > zn, ib = b[2] > zn; if (ia) out.push(a); if (ia !== ib) { const s = (zn - a[2]) / (b[2] - a[2]); out.push([a[0] + s * (b[0] - a[0]), a[1] + s * (b[1] - a[1]), zn]); } } return out; }
function subdiv(ps, n) { const out = []; for (let i = 0; i < ps.length; i++) { const a = ps[i], b = ps[(i + 1) % ps.length]; for (let k = 0; k < n; k++) { const s = k / n; out.push([a[0] + s * (b[0] - a[0]), a[1] + s * (b[1] - a[1]), a[2] + s * (b[2] - a[2])]); } } return out; }
/* render the world into ctx. cam = {K, R, t, W, H, dist?}; the canvas shows the W×H image scaled to its own width.
   opt.sky: draw a sky above the horizon; opt.alpha: global alpha; opt.outline: draw edges only (for "ghost" overlays) */
function render3(ctx, cam, world, opt) {
  opt = opt || {}; const cw = ctx.canvas.width, ch = ctx.canvas.height, s = cw / cam.W; const C = G.mul(G.mv(G.T(cam.R), cam.t), -1); const K = cam.K, d = cam.dist;
  const pr = p => { let x = p[0] / p[2], y = p[1] / p[2]; if (d) [x, y] = G.distort([x, y], d); return [(K[0][0] * x + K[0][1] * y + K[0][2]) * s, (K[1][1] * y + K[1][2]) * s]; };
  ctx.save(); if (opt.alpha) ctx.globalAlpha = opt.alpha;
  if (!opt.outline) { ctx.fillStyle = opt.bg || '#dbe9f6'; ctx.fillRect(0, 0, cw, ch); }
  const drawFace = f => { let pc = f.pts.map(p => G.toCam(cam.R, cam.t, p)); pc = clipNear(pc, 0.3); if (pc.length < 3) return; if (d) pc = subdiv(pc, 6); const q = pc.map(pr);
    ctx.beginPath(); q.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
    if (opt.outline) { ctx.strokeStyle = opt.outline; ctx.lineWidth = 1; ctx.stroke(); } else { ctx.fillStyle = f.col; ctx.fill(); if (opt.edges !== false) { ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 0.6; ctx.stroke(); } } };
  const dist2 = f => { const c = f.pts.reduce((a, p) => G.add(a, p), [0, 0, 0]).map(v => v / f.pts.length); return G.norm(G.sub(c, C)); };
  if (!opt.outline || opt.outlineGround) { world.faces.ground.slice().sort((a, b) => (a.layer - b.layer) || (dist2(b) - dist2(a))).forEach(drawFace); world.faces.marks.forEach(drawFace); } else if (opt.outlineMarks) world.faces.marks.forEach(drawFace);
  world.faces.objects.filter(f => { const c = f.pts.reduce((a, p) => G.add(a, p), [0, 0, 0]).map(v => v / f.pts.length); return G.dot(f.n, G.sub(C, c)) > 0; }).sort((a, b) => dist2(b) - dist2(a)).forEach(drawFace);
  ctx.restore();
  return { s, pr: P => { const pc = G.toCam(cam.R, cam.t, P); if (pc[2] <= 0.05) return null; return pr(pc); } };
}
/* the camera of chapter 2: on a car, 1.5 m above the road, looking north, horizontal */
const camCar = (K, W, H) => { const la = G.lookAt([0, 0, 1.5], [0, 100, 1.5]); return { K, R: la.R, t: la.t, W, H }; };
/* camera coordinates (X right, Y down, Z forward) of a world point for this camera */
const carCam = P => [P[0], 1.5 - P[2], P[1]];

/* ============================================================ 2.1 — K */
W.w3_K = function (box) {
  V.say(box, 'זו התמונה של מצלמה על רכב, 1.5 מטר מעל הכביש, ברזולוציה 1920 על 1080. כל פיקסל בה נוצר מהנוסחה ' + ltr('u = fx·X/Z + cx') + ', ' + ltr('v = fy·Y/Z + cy') + '. <b>הזז את הסמן</b> מעל הנקודות המסומנות כדי לראות את החישוב, <b>שנה</b> את ארבעת המספרים של K, ועבור ללשוניות: שני באגים קלאסיים, ואתגר — <b>למצוא את K של תמונה נתונה</b> רק מהמראה שלה.');
  const world = world3(); const Wd = 1920, Hd = 1080; let fx = 1333.3, fy = 1333.3, cx = 960, cy = 540, square = true, tab = 0, hover = -1, solved = false;
  const TGT = { fx: 1100, fy: 1100, cx: 1010, cy: 500 };
  /* marked points (world) with a name: corners and tops of things the user can see */
  const PTS = [[[-0.9 + 1.75, 7.75, 0.25], 'פינה קדמית של הרכב הכחול'], [[0.9 + 1.75, 7.75, 1.0], 'פינה עליונה של הרכב הכחול'], [[-4.35, 18.05, 2.4], 'ראש השלט'], [[4.05, 14.15, 0.7], 'ראש החרוט'], [[-1.75, 21.75, 1.0], 'הרכב האדום'], [[0, 60, 0], 'פס במרכז הכביש, 60 מטר'], [[-14, 40, 9], 'פינת הבניין']];
  const tabs = V.tabs(box, ['חופשי', '🐞 שכחתי את cx, cy', '🐞 fx ≠ fy', '🎯 מצא את K'], k => { tab = k; if (k === 1) { cx = 0; cy = 0; } else if (k === 2) { square = false; fx = 1333.3; fy = 700; cx = 960; cy = 540; } else { fx = 1333.3; fy = 1333.3; cx = 960; cy = 540; square = true; } if (k === 3) { fx = 1500; fy = 1500; cx = 900; cy = 600; square = true; solved = false; } build(); draw(); });
  const ctl = el('div'); box.appendChild(ctl);
  const fxw = flex(box); const cv = canvas(colm(fxw, 'התמונה (1920 × 1080), מוקטנת פי 4'), 480, 270, 480);
  const side = colm(fxw, 'החישוב לנקודה שמתחת לסמן'); const code = mono(side); code.style.minWidth = '300px'; code.style.maxWidth = '340px'; const out = V.say(box);
  function build() { ctl.innerHTML = ''; const r1 = row(ctl), r2 = row(ctl);
    V.slider(r1, 'fx (פיקסלים)', 400, 2600, 10, fx, v => { fx = v; if (square) fy = v; draw(); }); V.slider(r1, 'fy', 400, 2600, 10, fy, v => { fy = v; if (square) fx = v; build(); draw(); });
    V.slider(r2, 'cx', 0, 1920, 5, cx, v => { cx = v; draw(); }); V.slider(r2, 'cy', 0, 1080, 5, cy, v => { cy = v; draw(); });
    const c = el('label', { style: { margin: '0 8px' }, html: '<input type="checkbox"' + (square ? ' checked' : '') + '> פיקסלים ריבועיים (fx = fy)' }); c.querySelector('input').onchange = e => { square = e.target.checked; if (square) fy = fx; build(); draw(); }; r2.appendChild(c);
    if (tab === 3) V.btns(ctl, [['רמז', () => { out.innerHTML = '<b>רמז:</b> קודם התאם את <b>cx ו־cy</b>: נקודת המגוז של הכביש (היכן שקווי השוליים נפגשים) היא בדיוק הפיקסל ' + ltr('(cx, cy)') + ', כי המצלמה מסתכלת אופקית לאורך הכביש. אחר כך הגדל או הקטן את fx עד שהגדלים מתאימים — ' + ltr('fx') + ' משנה רק את קנה המידה סביב המרכז.'; }], ['הראה פתרון', () => { fx = fy = TGT.fx; cx = TGT.cx; cy = TGT.cy; build(); draw(); }]]); }
  const cam = () => camCar(G.K(fx, cx, cy, fy), Wd, Hd);
  function draw() { const x = cv.getContext('2d'); const r = render3(x, cam(), world); x.save();
    if (tab === 3) { render3(x, camCar(G.K(TGT.fx, TGT.cx, TGT.cy), Wd, Hd), world, { outline: 'rgba(224,49,49,.75)', outlineGround: false }); }
    /* principal point and the points */
    const pp = [cx * r.s, cy * r.s]; x.strokeStyle = '#e8590c'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(pp[0] - 7, pp[1]); x.lineTo(pp[0] + 7, pp[1]); x.moveTo(pp[0], pp[1] - 7); x.lineTo(pp[0], pp[1] + 7); x.stroke();
    PTS.forEach((p, i) => { const q = r.pr(p[0]); if (!q) return; x.fillStyle = i === hover ? '#e8590c' : '#fff'; x.strokeStyle = '#212529'; x.lineWidth = 1.2; x.beginPath(); x.arc(q[0], q[1], i === hover ? 5 : 3.5, 0, 7); x.fill(); x.stroke(); });
    x.restore();
    const h = hover >= 0 ? hover : 0; const P = carCam(PTS[h][0]); const K = G.K(fx, cx, cy, fy); const kp = G.mv(K, P); const u = kp[0] / kp[2], v = kp[1] / kp[2];
    code.textContent = '# ' + (hover >= 0 ? 'the point under the cursor' : 'the first point (hover over the dots)') + '\nP = [' + P.map(v => F(v, 2)).join(', ') + ']       # X, Y, Z in the camera frame (m)\nK = ' + fmtM(K) + '\nK @ P = [' + kp.map(v => F(v, 1)).join(', ') + ']\nu, v = ' + F(kp[0], 1) + ' / ' + F(kp[2], 2) + ', ' + F(kp[1], 1) + ' / ' + F(kp[2], 2) + '\n     = ' + F(u, 1) + ', ' + F(v, 1) + (u < 0 || u > Wd || v < 0 || v > Hd ? '     # outside the image!' : '');
    let msg = '<b>' + PTS[h][1] + '</b>: ' + ltr('Z = ' + F(P[2], 2) + ' m') + ' — הפיקסל ' + ltr('(' + F(u, 0) + ', ' + F(v, 0) + ')') + '. ';
    if (tab === 0) msg += 'שנה את ' + ltr('cx') + ' — כל התמונה זזה, בלי להשתנות. שנה את ' + ltr('fx') + ' — התמונה גדלה או קטנה <i>סביב</i> הצלב הכתום, ' + ltr('(cx, cy)') + '. הצלב הוא המקום שבו הציר האופטי פוגע בתמונה; כאן הוא גם נקודת המגוז של הכביש, כי המצלמה מסתכלת אופקית לאורכו.';
    else if (tab === 1) msg += '<b>הבאג:</b> כתבו ' + ltr('u = fx·X/Z') + ' בלי ' + ltr('+ cx') + '. הנוסחה של פרק 1 נותנת קואורדינטות <i>סביב המרכז</i> (חיוביות ושליליות), אבל פיקסל (0, 0) הוא הפינה. התוצאה: מרכז התמונה נופל בפינה השמאלית העליונה, ושלושה רבעים מהעולם — כל מה שמשמאל למרכז או מעליו — יוצאים מחוץ לתמונה (קואורדינטות שליליות). החזר את ' + ltr('cx = 960, cy = 540') + '.';
    else if (tab === 2) msg += '<b>הבאג:</b> ' + ltr('fy') + ' לא שווה ל־' + ltr('fx') + ' — למשל מישהו שם ב־' + ltr('fy') + ' את ' + ltr('H / (2·tan(hfov/2))') + ' עם שדה הראייה <i>האופקי</i>. התמונה נמעכת לגובה: רכבים נמוכים, השלט נמוך. בחיישנים כמעט תמיד הפיקסלים ריבועיים — ' + ltr('fx ≈ fy') + ' — וכיול שמחזיר הפרש גדול ביניהם הוא סימן לבעיה (פרק 5).';
    else { const errs = PTS.map(p => { const a = G.project(G.K(fx, cx, cy, fy), cam().R, cam().t, p[0]), b = G.project(G.K(TGT.fx, TGT.cx, TGT.cy), cam().R, cam().t, p[0]); return Math.hypot(a[0] - b[0], a[1] - b[1]); }); const e = errs.reduce((a, b) => a + b, 0) / errs.length; if (e < 6) solved = true;
      msg = 'הקווים <b style="color:#e03131">האדומים</b> הם התמונה של אותה סצנה, מאותה מצלמה בדיוק, אבל עם K אחרת. <b>מצא אותה</b> — הזז את המספרים עד שהתמונה יושבת על הקווים. שגיאה ממוצעת על שבע הנקודות: <b>' + F(e, 1) + ' פיקסלים</b>. ' + (e < 6 ? badge(true, 'מצאת: ' + ltr('fx ≈ ' + F(fx, 0) + ', cx ≈ ' + F(cx, 0) + ', cy ≈ ' + F(cy, 0)) + '. מצלמה עם עדשה רחבה יותר (fx קטן) ומרכז שלא באמצע — כמו מצלמות אמיתיות.') : badge(false, 'עדיין לא — צריך פחות מ־6 פיקסלים.')) + (solved && e >= 6 ? ' (כבר פתרת פעם אחת.)' : ''); }
    out.innerHTML = msg; }
  cv.addEventListener('mousemove', e => { const [mx, my] = mouse(cv, e); const r = { s: cv.width / Wd }; let best = -1, bd = 14; const c = cam(); PTS.forEach((p, i) => { const q = G.project(c.K, c.R, c.t, p[0]); if (!q) return; const d = Math.hypot(q[0] * r.s - mx, q[1] * r.s - my); if (d < bd) { bd = d; best = i; } }); if (best !== hover) { hover = best; draw(); } });
  build(); draw();
};

/* ============================================================ 2.2 — from a pixel back to a ray */
W.w3_backproject = function (box) {
  V.say(box, 'המצלמה של הקוד בסעיף (' + ltr('fx = 1333.3') + ', 1920 על 1080), על רכב בגובה 1.5 מטר. <b>לחץ על פיקסל</b> בתמונה: מימין תראה את הקרן שיוצאת ממנו, מלמעלה ומהצד, ואת החישוב ' + ltr('K⁻¹ · (u, v, 1)') + '. כל הנקודות על הקרן נופלות על אותו פיקסל — אבל אם ידוע שהפיקסל על הכביש, הקרן פוגשת את הכביש בנקודה אחת. בלשונית השנייה: <b>מדוד מרחק</b> לשלושה רכבים רק לפי הרוחב שלהם בפיקסלים.');
  const W0 = 1920, H0 = 1080, fx = 4.0 / 0.003; const K = G.K(fx, 960, 540); const Ki = G.inv3(K); let tab = 0, pick = [1150, 640], bug = false;
  const world = world3(); const cam = camCar(K, W0, H0);
  /* distance task: three cars, unknown distances */
  const MC = [[-1.75, 17.5, '#e03131'], [1.75, 31, '#1c7ed6'], [-1.75, 52, '#f08c00']]; const mworld = world3({ cars: MC });
  let marks = [[], [], []], cur = 0;
  V.tabs(box, ['מפיקסל לקרן', '📏 מדוד מרחק לפי רוחב', '🐞 K במקום K⁻¹'], k => { tab = k; bug = k === 2; draw(); });
  const fxw = flex(box); const cv = canvas(colm(fxw, 'התמונה — לחץ'), 480, 270, 480); const right = colm(fxw, 'מלמעלה (X, Z) ומהצד (Z, Y)'); const top = canvas(right, 300, 150, 300); const sideC = canvas(right, 300, 110, 300);
  const code = mono(box); const out = V.say(box); const ctlB = el('div'); box.appendChild(ctlB);
  function draw() { const x = cv.getContext('2d'); const wd = tab === 1 ? mworld : world; const r = render3(x, cam, wd); ctlB.innerHTML = '';
    if (tab === 1) return drawMeasure(x, r);
    const [u, v] = pick; x.strokeStyle = '#e8590c'; x.lineWidth = 2; x.beginPath(); x.arc(u * r.s, v * r.s, 6, 0, 7); x.stroke(); x.beginPath(); x.moveTo(u * r.s - 10, v * r.s); x.lineTo(u * r.s + 10, v * r.s); x.moveTo(u * r.s, v * r.s - 10); x.lineTo(u * r.s, v * r.s + 10); x.stroke();
    const M = bug ? K : Ki; let d = G.mv(M, [u, v, 1]); const n = G.norm(d); const dn = d.map(a => a / n);
    const ground = !bug && dn[1] > 1e-6 ? 1.5 / dn[1] : null;   // the ray meets the road (camera Y = 1.5) after this length
    /* where does the ray hit something in the world? march along it */
    let hit = null; if (!bug) { for (let s = 0.5; s < 300; s += 0.05) { const Pc = dn.map(a => a * s); const Pw = [Pc[0], Pc[2], 1.5 - Pc[1]]; if (Pw[2] <= 0) { hit = { s, Pw, what: 'הכביש / הקרקע' }; break; } const f = world.faces.objects.find(f => { const xs = f.pts.map(p => p[0]), ys = f.pts.map(p => p[1]), zs = f.pts.map(p => p[2]); return Pw[0] >= Math.min(...xs) - 1e-3 && Pw[0] <= Math.max(...xs) + 1e-3 && Pw[1] >= Math.min(...ys) - 1e-3 && Pw[1] <= Math.max(...ys) + 1e-3 && Pw[2] >= Math.min(...zs) - 1e-3 && Pw[2] <= Math.max(...zs) + 1e-3; }); if (f) { hit = { s, Pw, what: { car0: 'הרכב הכחול', car1: 'הרכב האדום', car2: 'הרכב הכתום', car3: 'הרכב האפור', car4: 'הרכב הירוק', sign: 'השלט', cone: 'החרוט', bld: 'בניין', tree: 'עץ' }[f.tag] || f.tag }; break; } } }
    /* top view */
    const T = top.getContext('2d'); T.clearRect(0, 0, 300, 150); const tx = X => 150 + X * 6, tz = Z => 140 - Z * 2.2; T.fillStyle = '#e9ecef'; T.fillRect(tx(-3.5), 0, 42, 150);
    world.cars.forEach(c => { if (c[3]) return; T.fillStyle = c[2]; T.fillRect(tx(c[0] - 0.9), tz(c[1] + 2.25), 10.8, 5.6); }); T.fillStyle = '#1971c2'; T.fillRect(tx(-4.85), tz(18) - 1, 6, 3); T.fillStyle = '#fd7e14'; T.fillRect(tx(3.9), tz(14.3), 3, 3);
    T.strokeStyle = bug ? '#c92a2a' : '#e8590c'; T.lineWidth = 2; const far = 110; T.beginPath(); T.moveTo(tx(0), tz(0)); T.lineTo(tx(dn[0] / Math.max(1e-6, Math.abs(dn[2])) * far * Math.sign(dn[2] || 1)), tz(far * Math.sign(dn[2] || 1))); T.stroke();
    txt(T, 'מצלמה', tx(0) + 4, 147, '#495057', 10); txt(T, 'Z = 60 m', 4, tz(60) + 4, '#adb5bd', 10);
    [5, 10, 20, 40].forEach(L => { const P = dn.map(a => a * L); if (P[2] < 0) return; T.fillStyle = '#212529'; T.beginPath(); T.arc(tx(P[0]), tz(P[2]), 2.5, 0, 7); T.fill(); });
    if (hit) { T.fillStyle = '#e8590c'; T.beginPath(); T.arc(tx(hit.Pw[0]), tz(hit.Pw[1]), 4.5, 0, 7); T.fill(); }
    const S = sideC.getContext('2d'); S.clearRect(0, 0, 300, 110); const sz = Z => 12 + Z * 4.7, sy = Y => 40 + Y * 30; S.fillStyle = '#6c7177'; S.fillRect(0, sy(1.5), 300, 3); txt(S, 'כביש (Y = 1.5)', 200, sy(1.5) + 14, '#495057', 10);
    S.strokeStyle = bug ? '#c92a2a' : '#e8590c'; S.lineWidth = 2; S.beginPath(); S.moveTo(sz(0), sy(0)); const L2 = dn[2] > 0 ? Math.min(62 / dn[2], ground || 1e9) : 5; S.lineTo(sz(dn[2] * L2), sy(dn[1] * L2)); S.stroke(); S.fillStyle = '#212529'; S.beginPath(); S.arc(sz(0), sy(0), 3.5, 0, 7); S.fill();
    if (hit) { S.fillStyle = '#e8590c'; const Pc = dn.map(a => a * hit.s); S.beginPath(); S.arc(sz(Pc[2]), sy(Pc[1]), 4.5, 0, 7); S.fill(); }
    code.textContent = 'uv1 = [' + F(u, 0) + ', ' + F(v, 0) + ', 1]\nd = np.linalg.' + (bug ? 'K' : 'inv(K)') + ' @ uv1     # ' + (bug ? 'BUG: K instead of inv(K)' : '= (X/Z, Y/Z, 1)') + '\n  = [' + d.map(a => F(a, bug ? 0 : 4)).join(', ') + ']\nray = d / np.linalg.norm(d) = [' + dn.map(a => F(a, 4)).join(', ') + ']' + (ground ? '\n# on the road (Y = 1.5 m below the camera):  s = 1.5 / ray[1] = ' + F(ground, 2) + ' m  ->  P = ' + '[' + dn.map(a => F(a * ground, 2)).join(', ') + ']' : '');
    if (bug) out.innerHTML = '<b>הבאג:</b> כפל ב־' + ltr('K') + ' במקום ב־' + ltr('K⁻¹') + '. הוקטור יוצא ' + ltr('(fx·u + cx, fy·v + cy, 1)') + ' — מספרים של מיליונים, והכיוון אחרי הנרמול כמעט מקביל לתמונה (' + ltr('|ray_z| = ' + F(Math.abs(dn[2]), 4)) + '), כלומר קרן שיוצאת הצידה ולא קדימה. אין שגיאה, שום דבר לא קורס — רק כל מדידה מטורפת. זו הסיבה לבדוק תמיד הלוך ושוב: ' + ltr('project(K, ray · s)') + ' חייב להחזיר את אותו פיקסל.';
    else out.innerHTML = 'הקרן מהפיקסל ' + ltr('(' + F(u, 0) + ', ' + F(v, 0) + ')') + (hit ? ': הדבר הראשון שהיא פוגשת הוא <b>' + hit.what + '</b>, ' + ltr(F(hit.Pw[1], 1) + ' m') + ' קדימה ו־' + ltr(F(hit.Pw[0], 1) + ' m') + ' ' + (hit.Pw[0] >= 0 ? 'ימינה' : 'שמאלה') + '. ' : '. ') + 'הנקודות השחורות על הקרן — במרחקים 5, 10, 20 ו־40 מטר — כולן נופלות בדיוק על הפיקסל הזה. ' + (ground ? 'אם ידוע שהפיקסל הוא על הכביש, אפשר לחשב: הקרן יורדת ' + ltr(F(dn[1], 4)) + ' לכל מטר, והכביש 1.5 מטר מתחת למצלמה — המפגש אחרי ' + ltr(F(ground, 2) + ' m') + '. זה הרעיון של פרק 6 והפרויקט.' : 'הפיקסל מעל האופק (' + ltr('v ≤ cy') + '): הקרן לא יורדת, ולעולם לא תפגוש את הכביש.'); }
  function drawMeasure(x, r) { const ptsRow = row(ctlB);
    marks.forEach((m, i) => { m.forEach(p => { x.fillStyle = MC[i][2]; x.fillRect(p[0] * r.s - 1, p[1] * r.s - 8, 2, 16); }); if (m.length === 2) { x.strokeStyle = MC[i][2]; x.lineWidth = 2; x.beginPath(); x.moveTo(m[0][0] * r.s, m[0][1] * r.s); x.lineTo(m[1][0] * r.s, m[0][1] * r.s); x.stroke(); } });
    let rows = [], okAll = true; MC.forEach((c, i) => { const m = marks[i]; const Ztrue = c[1] - 2.25; if (m.length < 2) { rows.push(['<b style="color:' + c[2] + '">●</b>', '—', '—', '—']); okAll = false; return; } const w = Math.abs(m[1][0] - m[0][0]); const Z = fx * 1.8 / w; const err = (Z - Ztrue) / Ztrue * 100; if (Math.abs(err) > 5) okAll = false; rows.push(['<b style="color:' + c[2] + '">●</b>', F(w, 0), F(Z, 1) + ' מ׳', (Math.abs(err) <= 5 ? '✓ ' : '✗ ') + F(err, 1) + '%']); });
    code.textContent = 'fx = 1333.3\nw_px = abs(u_right - u_left)       # the width you marked\nZ = fx * 1.8 / w_px                # pixels = fx * metres / distance, solved for distance';
    V.btns(ctlB, [['סמן את הרכב ' + ['האדום', 'הכחול', 'הכתום'][cur], () => {}, 'ghost'], ['נקה', () => { marks = [[], [], []]; cur = 0; draw(); }], ['הראה פתרון', () => { MC.forEach((c, i) => { const p1 = r.pr([c[0] - 0.9, c[1] - 2.25, 0.6]), p2 = r.pr([c[0] + 0.9, c[1] - 2.25, 0.6]); marks[i] = [[p1[0] / r.s, p1[1] / r.s], [p2[0] / r.s, p1[1] / r.s]]; }); draw(); }]]);
    out.innerHTML = '<b>לחץ פעמיים על כל רכב</b> — על הקצה השמאלי ועל הקצה הימני של <b>החלק האחורי</b> שלו (הפגוש, ברוחב 1.8 מטר). הסדר: אדום, כחול, כתום. הטבלה מחשבת את המרחק מהרוחב שסימנת, ומשווה לאמת.' + table(['רכב', 'רוחב (פיקסלים)', 'מרחק מחושב', 'מול האמת'], rows) + (okAll ? badge(true, 'שלושתם בטווח של 5%. שים לב כמה רגיש זה לרכב הרחוק: שם הרכב צר, וטעות של 2 פיקסלים היא כבר כמה אחוזים — הטעות במרחק גדלה כמו ' + ltr('Z²') + '.') : 'צריך את שלושתם בטווח של 5% מהאמת.'); }
  cv.addEventListener('click', e => { const [mx, my] = mouse(cv, e); const s = cv.width / W0; if (tab === 1) { if (marks[cur].length >= 2) marks[cur] = []; marks[cur].push([mx / s, my / s]); if (marks[cur].length === 2 && cur < 2) cur++; draw(); return; } pick = [mx / s, my / s]; draw(); });
  draw();
};

/* ============================================================ 2.3 — K and resizing */
W.w3_resize = function (box) {
  V.say(box, 'המזהה לא רואה את התמונה המקורית של 1920 על 1080 — הוא רואה גרסה קטנה. שלוש דרכים נפוצות לבנות אותה, ולכל אחת K אחרת. בכל לשונית: המזהה מחזיר את הפיקסל של תחתית הרכב <i>בתמונה הקטנה</i>, ואנחנו מחשבים ממנו את המרחק לרכב (הקרן פוגשת את הכביש, כמו בסעיף 2.2). <b>בחר איזו K להשתמש</b> — ובדוק מול האמת. המטרה: שלוש מתוך שלוש.');
  const W0 = 1920, H0 = 1080, fx = 4 / 0.003, K = G.K(fx, 960, 540); const world = world3(); const camBig = camCar(K, W0, H0); const target = [-1.75, 21.75, 0], Ztrue = 21.75;
  const PIPES = [
    { name: 'הקטנה ל־640 × 360', W: 640, H: 360, sx: 1 / 3, sy: 1 / 3, ox: 0, oy: 0, desc: 'כל ציר מוקטן פי 3.' },
    { name: 'חיתוך 960 × 540 מהמרכז', W: 960, H: 540, sx: 1, sy: 1, ox: -480, oy: -270, desc: 'אזור באמצע, בלי שינוי גודל.' },
    { name: 'letterbox ל־640 × 640', W: 640, H: 640, sx: 1 / 3, sy: 1 / 3, ox: 0, oy: 140, desc: 'הקטנה פי 3 (ל־640 × 360) ורצועות שחורות של 140 שורות למעלה ולמטה, כמו שמזהים רבים דורשים.' }];
  const OPTS = [['K המקורי', () => K], ['K מוקטן: S @ K', p => G.mm([[1 / 3, 0, 0], [0, 1 / 3, 0], [0, 0, 1]], K)], ['K חתוך: cx, cy פחות ההיסט', p => G.K(fx, 960 - 480, 540 - 270)], ['S @ K, ואז cy + 140', p => { const k = G.mm([[1 / 3, 0, 0], [0, 1 / 3, 0], [0, 0, 1]], K); k[1][2] += 140; return k; }]];
  const RIGHT = [1, 2, 3]; let tab = 0, choice = [-1, -1, -1], half = false;
  V.tabs(box, PIPES.map(p => p.name), k => { tab = k; draw(); });
  const fxw = flex(box); const cvB = canvas(colm(fxw, 'המקור, 1920 × 1080'), 384, 216, 384); const smallCol = colm(fxw, 'מה שהמזהה רואה'); const cvS = canvas(smallCol, 320, 320, 320);
  const opts = row(box); const code = mono(box); const out = V.say(box);
  function smallK(p, opt) { return OPTS[opt][1](p); }
  function draw() { const p = PIPES[tab]; render3(cvB.getContext('2d'), camBig, world); const xB = cvB.getContext('2d'); const sB = 384 / W0;
    xB.strokeStyle = '#e8590c'; xB.lineWidth = 2; xB.setLineDash([4, 3]); const rx0 = -p.ox / p.sx, ry0 = -p.oy / p.sy, rw = p.W / p.sx, rh = p.H / p.sy; xB.strokeRect(Math.max(0, rx0) * sB, Math.max(0, ry0) * sB, Math.min(W0, rw) * sB, Math.min(H0, rh) * sB); xB.setLineDash([]);
    /* the small image: render with the transformed camera */
    const ks = G.mm([[p.sx, 0, p.ox], [0, p.sy, p.oy], [0, 0, 1]], K); const S = cvS.getContext('2d'); const sc = 320 / Math.max(p.W, p.H); cvS.width = Math.round(p.W * sc); cvS.height = Math.round(p.H * sc); cvS.style.width = cvS.width + 'px';
    const S2 = cvS.getContext('2d'); S2.fillStyle = '#000'; S2.fillRect(0, 0, cvS.width, cvS.height); S2.save(); if (tab === 2) { S2.beginPath(); S2.rect(0, 140 * sc, cvS.width, 360 * sc); S2.clip(); } render3(S2, { K: ks, R: camBig.R, t: camBig.t, W: p.W, H: p.H }, world); S2.restore();
    const det = G.project(ks, camBig.R, camBig.t, target); const du = Math.round(det[0]), dv = Math.round(det[1]); const ca = G.project(ks, camBig.R, camBig.t, [-2.65, 21.75, 1.45]), cb = G.project(ks, camBig.R, camBig.t, [-0.85, 21.75, 0]); S2.strokeStyle = '#e8590c'; S2.lineWidth = 2; S2.strokeRect(ca[0] * sc - 2, ca[1] * sc - 2, (cb[0] - ca[0]) * sc + 4, (cb[1] - ca[1]) * sc + 4); S2.fillStyle = '#e8590c'; S2.beginPath(); S2.arc(du * sc, dv * sc, 3, 0, 7); S2.fill();
    opts.innerHTML = ''; opts.appendChild(el('span', { html: '<b>איזו K?</b> ' })); V.tabs(opts, OPTS.map(o => o[0]), i => { choice[tab] = i; draw(); }, choice[tab]);
    const hb = el('label', { style: { margin: '0 8px' }, html: '<input type="checkbox"' + (half ? ' checked' : '') + '> המוסכמה של מרכז פיקסל (חצי פיקסל)' }); hb.querySelector('input').onchange = e => { half = e.target.checked; draw(); }; opts.appendChild(hb);
    const scoreTxt = 'ציון: ' + choice.filter((c, i) => c === RIGHT[i]).length + ' מתוך 3';
    if (choice[tab] < 0) { code.textContent = '# the detector returned the bottom of the car at (u, v) = (' + du + ', ' + dv + ') in the ' + p.W + ' x ' + p.H + ' image\n# which K turns this pixel into a ray?'; out.innerHTML = p.desc + ' המזהה החזיר את תחתית הרכב האדום בפיקסל ' + ltr('(' + du + ', ' + dv + ')') + ' — בקואורדינטות של התמונה הקטנה. <b>בחר K.</b> ' + scoreTxt; return; }
    let Ku = smallK(p, choice[tab]).map(r => r.slice()); if (half && (choice[tab] === 1 || choice[tab] === 3)) { Ku[0][2] = (960 + 0.5) / 3 - 0.5; Ku[1][2] = (540 + 0.5) / 3 - 0.5 + (choice[tab] === 3 ? 140 : 0); }
    const ray = G.mv(G.inv3(Ku), [du, dv, 1]); const Zest = ray[1] > 0 ? 1.5 / ray[1] : Infinity; const Xest = ray[0] * Zest; const ok = isFinite(Zest) && Math.abs(Zest - Ztrue) / Ztrue < 0.04 && Math.abs(Xest + 1.75) < 0.4;
    code.textContent = 'K_used = ' + fmtM(Ku) + '\nray = inv(K_used) @ [' + du + ', ' + dv + ', 1] = [' + ray.map(a => F(a, 4)).join(', ') + ']\nZ = 1.5 / ray[1] = ' + (isFinite(Zest) ? F(Zest, 2) : 'inf (above the horizon)') + ' m,   X = ray[0] * Z = ' + (isFinite(Zest) ? F(Xest, 2) : '—') + ' m\n# truth: Z = ' + F(Ztrue, 2) + ' m (the back of the car), X = -1.75 m';
    const why = ['', 'הקטנה פי 3 בשני הצירים מכפילה את כל ארבעת המספרים בשליש. היחס בין ' + ltr('v − cy') + ' ל־' + ltr('fy') + ' נשמר — והמרחק יוצא נכון.', 'חיתוך לא משנה את גודל הפיקסלים, ולכן ' + ltr('fx') + ' נשאר; רק הראשית זזה ב־' + ltr('(480, 270)') + '.', 'letterbox הוא שתי פעולות: הקטנה (S · K) ואז הזזה של 140 שורות — ולכן ' + ltr('cy') + ' עולה ב־140 אחרי ההקטנה.'];
    const wrong = { 0: 'K המקורי מתאים לתמונה של 1920 על 1080. הפיקסל הקטן נקרא כאילו הוא בתמונה הגדולה — והתוצאה שגויה לגמרי.', 1: 'S @ K מתאים להקטנה, אבל כאן ' + (tab === 1 ? 'לא הייתה הקטנה — רק חיתוך.' : 'יש גם רצועות שחורות שהזיזו את התמונה 140 שורות למטה. שכחת את ההיסט.'), 2: 'כאן ' + (tab === 0 ? 'אין חיתוך — כל התמונה הוקטנה. צריך לשנות את fx ו־fy, לא רק את המרכז.' : 'היתה הקטנה, ולא רק הזזה.'), 3: 'כאן אין רצועות שחורות' + (tab === 1 ? ', וגם לא הקטנה.' : '.') };
    const halfNote = half ? ' (עם מוסכמת חצי הפיקסל ' + ltr('cx = s·(cx + 0.5) − 0.5') + ': ההפרש במרחק הוא סנטימטרים בודדים — זניח כאן, חשוב במדידות של תת־פיקסל.)' : '';
    out.innerHTML = (ok ? badge(true, 'נכון.') + ' ' + why[choice[tab]] : badge(false, 'שגוי: ' + (isFinite(Zest) ? 'מרחק ' + F(Zest, 1) + ' מ׳ במקום ' + F(Ztrue, 1) : 'הקרן לא פוגשת את הכביש') + '.') + ' ' + (wrong[choice[tab]] || '')) + halfNote + ' <b>' + scoreTxt + '</b>' + (choice.every((c, i) => c === RIGHT[i]) ? ' — ' + badge(true, 'כל השלוש. הכלל: כל פעולה על התמונה היא מטריצה 3 על 3 שמוכפלת ב־K משמאל.') : ''); }
  draw();
};


/* ============================================================ chapter 3 helpers: an outside observer, and a camera drawn as a pyramid */
const K3 = G.K(1000, 640, 360), W3 = 1280, H3 = 720;
function observer(C, T) { const la = G.lookAt(C || [-26, -30, 26], T || [2, 14, 0]); return { K: G.K(560, 400, 230), R: la.R, t: la.t, W: 800, H: 460 }; }
/* draw a camera (R, t, K, W, H) as a pyramid with its three axes, as seen by the observer render r */
function camGlyph(x, r, cam, opt) { opt = opt || {}; const Rt = G.T(cam.R), C = G.mul(G.mv(Rt, cam.t), -1), d = opt.depth || 2.2; const Ki = G.inv3(cam.K);
  const corner = (u, v) => { const dc = G.mv(Ki, [u, v, 1]); return G.add(C, G.mv(Rt, G.mul(dc, d))); }; const cs = [corner(0, 0), corner(cam.W, 0), corner(cam.W, cam.H), corner(0, cam.H)];
  const P = q => r.pr(q); const pc = P(C); if (!pc) return; x.save(); x.lineWidth = 1.5; x.strokeStyle = opt.col || '#212529'; x.fillStyle = 'rgba(33,37,41,.12)';
  const q = cs.map(P); if (q.every(Boolean)) { x.beginPath(); q.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fill(); x.stroke(); q.forEach(p => { x.beginPath(); x.moveTo(pc[0], pc[1]); x.lineTo(p[0], p[1]); x.stroke(); }); const top = q[0]; x.fillStyle = opt.col || '#212529'; x.beginPath(); x.arc((q[0][0] + q[1][0]) / 2, (q[0][1] + q[1][1]) / 2, 2.5, 0, 7); x.fill(); }
  if (opt.axes !== false) [['#e03131', 0, 'x'], ['#2f9e44', 1, 'y'], ['#1c7ed6', 2, 'z']].forEach(([col, i, nm]) => { const e = P(G.add(C, G.mul(cam.R[i], opt.axisLen || 3))); if (!e) return; x.strokeStyle = col; x.lineWidth = 2.5; x.beginPath(); x.moveTo(pc[0], pc[1]); x.lineTo(e[0], e[1]); x.stroke(); txt(x, nm + '_cam', e[0] + 3, e[1] - 3, col, 11); });
  x.fillStyle = opt.col || '#212529'; x.beginPath(); x.arc(pc[0], pc[1], 3.5, 0, 7); x.fill(); x.restore(); }
function worldAxes(x, r, L) { L = L || 5; const o = r.pr([0, 0, 0]); if (!o) return; [['#e03131', [L, 0, 0], 'X (מזרח)'], ['#2f9e44', [0, L, 0], 'Y (צפון)'], ['#1c7ed6', [0, 0, L], 'Z (למעלה)']].forEach(([c, e, nm]) => { const q = r.pr(e); if (!q) return; x.strokeStyle = c; x.lineWidth = 3; x.beginPath(); x.moveTo(o[0], o[1]); x.lineTo(q[0], q[1]); x.stroke(); pill(x, nm, q[0] + 2, q[1] - 2, c); }); }
const det3 = G.det3; const RtR = R => G.mm(G.T(R), R);

/* ============================================================ 3.1 — two coordinate systems */
W.w3_frames = function (box) {
  V.say(box, 'משמאל — העולם כפי שצופה מבחוץ רואה אותו: הצירים של העולם (X מזרח, Y צפון, Z למעלה) והמצלמה, עם שלושת הצירים <i>שלה</i> (x ימינה, y למטה, z קדימה). מימין — מה שהמצלמה רואה. <b>הזז ושנה את כיוון המצלמה</b>, ו<b>לחץ על נקודה</b> במבט מבחוץ (על הקרקע) כדי לראות את <code class="ltr">P_cam = R · P_world + t</code> במספרים. בלשוניות — שתי טעויות קלאסיות.');
  const world = world3(); let yaw = 0, pitch = -16.7, roll = 0, Cx = 0, Cy = -10, Cz = 3, tab = 0, Pw = [1.75, 10, 1.0];
  V.tabs(box, ['R ו־t', '🐞 Rᵀ במקום R', '🐞 שתי שורות הפוכות'], k => { tab = k; draw(); });
  const r1 = row(box), r2 = row(box); V.slider(r1, 'כיוון (yaw°)', -180, 180, 1, yaw, v => { yaw = v; draw(); }); V.slider(r1, 'הטיה (pitch°)', -89, 30, 0.5, pitch, v => { pitch = v; draw(); }); V.slider(r1, 'גלגול (roll°)', -45, 45, 1, roll, v => { roll = v; draw(); });
  V.slider(r2, 'C.x', -15, 15, 0.5, Cx, v => { Cx = v; draw(); }); V.slider(r2, 'C.y', -30, 25, 0.5, Cy, v => { Cy = v; draw(); }); V.slider(r2, 'C.z (גובה)', 0.5, 30, 0.5, Cz, v => { Cz = v; draw(); });
  const fx = flex(box); const cO = canvas(colm(fx, 'מבחוץ — לחץ על הקרקע'), 400, 230, 400); const cI = canvas(colm(fx, 'מה שהמצלמה רואה (1280 × 720)'), 384, 216, 384);
  const code = mono(box); const out = V.say(box); const obs = observer([-17, -27, 17], [0, 0, 0]);
  function Rcur() { let R = G.attitude(yaw, pitch, roll); if (tab === 1) R = G.T(R); if (tab === 2) R = [R[1], R[0], R[2]]; return R; }
  function draw() { const R = Rcur(), C = [Cx, Cy, Cz], t = G.mul(G.mv(R, C), -1); const cam = { K: K3, R, t, W: W3, H: H3 };
    const xo = cO.getContext('2d'); const ro = render3(xo, obs, world); worldAxes(xo, ro, 6); camGlyph(xo, ro, cam);
    const pp = ro.pr(Pw); if (pp) { xo.fillStyle = '#e8590c'; xo.beginPath(); xo.arc(pp[0], pp[1], 5, 0, 7); xo.fill(); pill(xo, 'P', pp[0] + 6, pp[1] - 4, '#e8590c'); }
    const xi = cI.getContext('2d'); let ok = true; try { const ri = render3(xi, cam, world); const q = ri.pr(Pw); if (q) { xi.strokeStyle = '#e8590c'; xi.lineWidth = 2.5; xi.beginPath(); xi.arc(q[0], q[1], 7, 0, 7); xi.stroke(); } } catch (e) { ok = false; }
    if (tab === 2) { xi.save(); xi.fillStyle = 'rgba(201,42,42,.12)'; xi.fillRect(0, 0, 384, 216); xi.restore(); }
    const Pc = G.toCam(R, t, Pw); const q = G.project(K3, R, t, Pw); const M = RtR(R), dt = det3(R); const orth = M.every((rw, i) => rw.every((v, j) => Math.abs(v - (i === j)) < 1e-9));
    code.textContent = 'R = ' + fmtM(R) + '      # rows: the camera axes x, y, z, written in world coordinates\nt = -R @ C = [' + t.map(v => F(v, 2)).join(', ') + ']\nP_world = [' + Pw.map(v => F(v, 2)).join(', ') + ']\nP_cam = R @ P_world + t = [' + Pc.map(v => F(v, 2)).join(', ') + ']     # Z_cam = depth\nR.T @ R == I: ' + orth + '     det(R) = ' + F(dt, 3);
    let m = 'העומק של P: <b>' + ltr('Z_cam = ' + F(Pc[2], 2) + ' m') + '</b>' + (Pc[2] <= 0 ? ' — <b style="color:#c92a2a">שלילי: הנקודה מאחורי המצלמה</b>, וההטלה שלה חסרת משמעות (צריך לסנן אותה).' : (q && q[0] >= 0 && q[0] <= W3 && q[1] >= 0 && q[1] <= H3 ? ', והיא נופלת על הפיקסל ' + ltr('(' + F(q[0], 0) + ', ' + F(q[1], 0) + ')') + '.' : ', אבל היא מחוץ לשדה הראייה.')) + ' ';
    if (tab === 0) m += 'השורות של R הן הצירים של המצלמה כפי שהעולם רואה אותם — החצים הצבעוניים במבט מבחוץ. לכן ' + ltr('R · P') + ' מחשב שלוש מכפלות פנימיות: כמה P "ימינה", "למטה" ו"קדימה" מנקודת המבט של המצלמה. שש דרגות חופש: שלוש זוויות ושלושה רכיבים של C.';
    else if (tab === 1) m += '<b>הבאג:</b> השתמשו ב־' + ltr('Rᵀ') + ' — הסיבוב בכיוון ההפוך, ממצלמה לעולם. ' + ltr('Rᵀ·R = I') + ' עדיין מתקיים והדטרמיננטה 1, כך ששום בדיקה של "האם זו מטריצת סיבוב" לא תתפוס את זה. ' + (Math.abs(yaw) < 1 && Math.abs(roll) < 1 ? 'כשהמצלמה מסובבת רק בהטיה, הטעות "רק" הופכת את כיוון ההטיה. ' : '') + 'התמונה מראה מקום אחר לגמרי. שנה את yaw ותראה שהמצלמה "מסתכלת" לצד הלא נכון.';
    else m += '<b>הבאג:</b> החליפו את שורות x ו־y ב־R. ' + ltr('Rᵀ·R = I') + ' עדיין נכון, אבל ' + ltr('det = −1') + ': זה שיקוף, לא סיבוב (תרגיל 3.1). התמונה מסובבת ב־90 מעלות <i>ומשוקפת</i> כמו במראה — כתב היה הפוך. זו הסיבה לבדוק את הדטרמיננטה של כל סיבוב שמגיע מבחוץ.';
    out.innerHTML = m + (ok ? '' : ''); }
  cO.addEventListener('click', e => { const [mx, my] = mouse(cO, e); const s = cO.width / obs.W; const ray = G.mv(G.T(obs.R), G.mv(G.inv3(obs.K), [mx / s, my / s, 1])); const Co = G.mul(G.mv(G.T(obs.R), obs.t), -1); if (ray[2] >= 0) return; const k = -Co[2] / ray[2]; Pw = G.add(Co, G.mul(ray, k)).map(v => Math.round(v * 10) / 10); Pw[2] = 0; draw(); });
  draw();
};

/* ============================================================ 3.2 — look_at */
W.w3_look_at = function (box) {
  V.say(box, 'מצלמת אבטחה על עמוד. במפה מלמעלה: <b>גרור את העיגול השחור</b> (מיקום העמוד) ו<b>את הצלב הכתום</b> (הנקודה שהמצלמה מסתכלת עליה), ושנה את הגובה. <code class="ltr">look_at</code> בונה מזה את R ו־t — בדיוק הקוד של הסעיף, מעודכן חי. <b>האתגר:</b> מצלמה בגובה 6 מטר שרואה את <b>כל החניון</b> (18 על 30 מטר, במזרח) — ארבע הפינות בתוך התמונה.');
  const world = world3(); let C = [0, 22, 6], T = [17, 45, 0], up = 0, drag = null, solvedOnce = false;
  const r1 = row(box); V.slider(r1, 'גובה העמוד C.z', 0.5, 40, 0.5, C[2], v => { C[2] = v; draw(); }); V.tabs(box, ['up = (0, 0, 1)', '🐞 מבט ישר למטה', 'עם התיקון של תרגיל 3.3'], k => { up = k; if (k) { C = [17, 45, 25]; T = [17, 45, 0]; } else { C = [0, 22, 6]; T = [17, 45, 0]; } draw(); });
  const fx = flex(box); const cM = canvas(colm(fx, 'מפה מלמעלה (40 × 80 מטר) — גרור'), 240, 300, 240); const cI = canvas(colm(fx, 'מה שהמצלמה רואה'), 480, 270, 480); const code = mono(box); const out = V.say(box);
  const mx0 = -10, my0 = 0, ms = 6; const toMap = p => [(p[0] - mx0) * ms, 300 - (p[1] - my0) * 3.75], fromMap = (u, v) => [u / ms + mx0, (300 - v) / 3.75 + my0];
  const PARK = [[8, 30, 0], [26, 30, 0], [26, 60, 0], [8, 60, 0]];
  function lookAtPy(C, T, upv) { const z0 = G.sub(T, C); const z = G.mul(z0, 1 / G.norm(z0)); let x = G.cross(z, upv); const n = G.norm(x); x = G.mul(x, 1 / n); const y = G.cross(z, x); return { R: [x, y, z], n }; }
  function draw() { const upv = [0, 0, 1]; let la = lookAtPy(C, T, upv), fixed = false; if (up === 2 && la.n < 1e-6) { la = lookAtPy(C, T, [0, 1, 0]); fixed = true; } const bad = !(la.n >= 1e-6) && !fixed; const R = la.R, t = bad ? [NaN, NaN, NaN] : G.mul(G.mv(R, C), -1);
    /* map */
    const m = cM.getContext('2d'); m.fillStyle = '#b2d79b'; m.fillRect(0, 0, 240, 300); const rd = toMap([-3.5, 0]), rd2 = toMap([3.5, 80]); m.fillStyle = '#868e96'; m.fillRect(rd[0], rd2[1], rd2[0] - rd[0], rd[1] - rd2[1]);
    const pk = PARK.map(toMap); m.fillStyle = '#adb5bd'; m.beginPath(); pk.forEach((p, i) => i ? m.lineTo(p[0], p[1]) : m.moveTo(p[0], p[1])); m.closePath(); m.fill(); txt(m, 'חניון', pk[0][0] + 30, pk[2][1] + 60, '#495057', 11);
    world.cars.forEach(c => { const a = toMap([c[0] - (c[3] ? 2.25 : 0.9), c[1] + (c[3] ? 0.9 : 2.25)]); m.fillStyle = c[2]; m.fillRect(a[0], a[1], (c[3] ? 4.5 : 1.8) * ms, (c[3] ? 1.8 : 4.5) * 3.75); });
    const c0 = toMap(C), t0 = toMap(T); m.strokeStyle = '#212529'; m.setLineDash([4, 3]); m.beginPath(); m.moveTo(c0[0], c0[1]); m.lineTo(t0[0], t0[1]); m.stroke(); m.setLineDash([]);
    if (!bad) { const fovh = Math.atan(640 / 1000); const yawv = Math.atan2(R[2][0], R[2][1]); [-fovh, fovh].forEach(a => { m.strokeStyle = 'rgba(33,37,41,.35)'; m.beginPath(); m.moveTo(c0[0], c0[1]); m.lineTo(c0[0] + Math.sin(yawv + a) * 400, c0[1] - Math.cos(yawv + a) * 400 * 3.75 / ms); m.stroke(); }); }
    m.fillStyle = '#212529'; m.beginPath(); m.arc(c0[0], c0[1], 7, 0, 7); m.fill(); m.strokeStyle = '#e8590c'; m.lineWidth = 3; m.beginPath(); m.moveTo(t0[0] - 7, t0[1]); m.lineTo(t0[0] + 7, t0[1]); m.moveTo(t0[0], t0[1] - 7); m.lineTo(t0[0], t0[1] + 7); m.stroke(); m.lineWidth = 1;
    const xi = cI.getContext('2d'); const fmt = v => isFinite(v) ? F(v, 3) : 'nan';
    code.textContent = 'R, t = look_at(C=[' + C.map(v => F(v, 1)).join(', ') + '], target=[' + T.map(v => F(v, 1)).join(', ') + ']' + (fixed ? ', up=(0, 1, 0)' : '') + ')\n# z = unit(target - C) = [' + R[2].map(fmt).join(', ') + ']\n# x = unit(cross(z, up)) = [' + R[0].map(fmt).join(', ') + ']' + (bad ? '      <- cross(z, up) = 0, divided by 0' : '') + '\n# y = cross(z, x)        = [' + R[1].map(fmt).join(', ') + ']\nt = -R @ C = [' + t.map(fmt).join(', ') + ']';
    if (bad) { xi.fillStyle = '#212529'; xi.fillRect(0, 0, 480, 270); txt(xi, 'R = nan  →  nothing to draw', 240, 140, '#ff8787', 16, 'center'); out.innerHTML = '<b>הבאג של תרגיל 3.3:</b> המצלמה מסתכלת ישר למטה, ולכן z מקביל ל־up. המכפלה הוקטורית של שני וקטורים מקבילים היא אפס, והחלוקה בנורמה שלה נותנת <code class="ltr">nan</code> — בלי שגיאה, רק אזהרה של NumPy. כל ההטלות אחר כך הן nan. בדיוק המקרה של רחפן שמצלם מעל השטח. עבור ללשונית השלישית.'; return; }
    const cam = { K: K3, R, t, W: W3, H: H3 }; const r = render3(xi, cam, world);
    const pq = PARK.map(P => G.project(K3, R, t, P)); const inside = pq.map(q => q && q[0] >= 0 && q[0] <= W3 && q[1] >= 0 && q[1] <= H3);
    pq.forEach((q, i) => { if (!q) return; const p = [q[0] * r.s, q[1] * r.s]; xi.fillStyle = inside[i] ? '#2f9e44' : '#c92a2a'; xi.beginPath(); xi.arc(clamp(p[0], 4, 476), clamp(p[1], 4, 266), 5, 0, 7); xi.fill(); });
    const n = inside.filter(Boolean).length; const ok = n === 4 && Math.abs(C[2] - 6) < 0.01; if (ok) solvedOnce = true;
    out.innerHTML = (up === 2 ? '<b>התיקון:</b> כשהנורמה של <code class="ltr">np.cross(z, up)</code> קטנה מ־1e-6, משתמשים ב־<code class="ltr">up = (0, 1, 0)</code>. במבט ישר למטה זה קובע שהחלק העליון של התמונה פונה צפונה — הצפון במפה למעלה גם בתמונה. ' : '') + 'פינות החניון בתמונה: <b>' + n + ' מתוך 4</b> (נקודות ירוקות — בפנים, אדומות — בחוץ, מוצמדות לשוליים). ' + (up === 0 ? (ok ? badge(true, 'כל החניון בתמונה מגובה 6 מטר.') + ' שים לב כמה הפינה הרחוקה קטנה ונמוכה — בפרק 6 נראה שמהמספרים האלה אפשר לחשב מרחקים על הקרקע.' : (Math.abs(C[2] - 6) > 0.01 ? 'האתגר מחייב גובה של 6 מטר בדיוק. ' : '') + 'רמז: העמוד צריך להיות רחוק מהחניון (המצלמה רואה 65° לרוחב), והמבט — לאמצע שלו או קצת מעבר.') : '');
  }
  const pick = e => { const [u, v] = mouse(cM, e); return fromMap(u, v); };
  cM.addEventListener('mousedown', e => { const p = pick(e); const dC = Math.hypot(p[0] - C[0], (p[1] - C[1]) * 0.6), dT = Math.hypot(p[0] - T[0], (p[1] - T[1]) * 0.6); drag = dC < dT ? 'C' : 'T'; move(e); });
  const move = e => { if (!drag) return; const p = pick(e); const q = [Math.round(clamp(p[0], -10, 30) * 2) / 2, Math.round(clamp(p[1], 0, 80) * 2) / 2]; if (drag === 'C') { C[0] = q[0]; C[1] = q[1]; } else { T[0] = q[0]; T[1] = q[1]; } draw(); };
  cM.addEventListener('mousemove', move); window.addEventListener('mouseup', () => { drag = null; });
  draw();
};

/* ============================================================ 3.3 — t is not the camera position; rvec */
W.w3_t_trap = function (box) {
  V.say(box, 'פונקציה כמו <code class="ltr">solvePnP</code> (פרק 7) מחזירה שני וקטורים: <code class="ltr">rvec</code> ו־<code class="ltr">tvec</code>. <b>איפה המצלמה?</b> במפה מסומנים שלושה מועמדים — <span style="color:#e03131">t</span>, <span style="color:#7048e8">−t</span> ו־<span style="color:#2f9e44">−Rᵀ·t</span> — ואחד מהם הוא המצלמה האמיתית. <b>הזז את המצלמה</b> ובדוק איזה מהם הולך איתה. בלשונית השנייה: מה בדיוק אומר <code class="ltr">rvec</code>.');
  const world = world3(); let ang = 0, rad = 10, h = 3, tab = 0, rx = 0, ry = 0, rz = 0;
  V.tabs(box, ['איפה המצלמה?', 'וקטור סיבוב (rvec)'], k => { tab = k; build(); draw(); });
  const ctl = el('div'); box.appendChild(ctl);
  const fx = flex(box); const cM = canvas(colm(fx, 'מבחוץ'), 420, 250, 420); const cI = canvas(colm(fx, 'מה שהמצלמה רואה'), 320, 180, 320); const code = mono(box); const out = V.say(box); const obs = observer([-15, -22, 15], [0, -3, 0]);
  function build() { ctl.innerHTML = ''; const r1 = row(ctl); if (tab === 0) { V.slider(r1, 'זווית סביב הראשית (°)', -180, 180, 1, ang, v => { ang = v; draw(); }); V.slider(r1, 'מרחק אופקי', 4, 25, 0.5, rad, v => { rad = v; draw(); }); V.slider(r1, 'גובה', 0.5, 15, 0.5, h, v => { h = v; draw(); }); }
    else { V.slider(r1, 'rvec.x', -3.1, 3.1, 0.01, rx, v => { rx = v; draw(); }); V.slider(r1, 'rvec.y', -3.1, 3.1, 0.01, ry, v => { ry = v; draw(); }); V.slider(r1, 'rvec.z', -3.1, 3.1, 0.01, rz, v => { rz = v; draw(); }); V.btns(ctl, [['הדוגמה של הסעיף: (1.8623, 0, 0)', () => { rx = 1.8623; ry = 0; rz = 0; build(); draw(); }]]); } }
  function draw() { const xm = cM.getContext('2d'); const ro = render3(xm, obs, world); worldAxes(xm, ro, 4);
    let R, t, C;
    if (tab === 0) { const a = G.rad(ang); C = [-Math.sin(a) * rad, -Math.cos(a) * rad, h]; const la = G.lookAt(C, [0, 0, 0]); R = la.R; t = la.t; }
    else { R = G.rodrigues([rx, ry, rz]); t = [0, 0, 10.44]; C = G.mul(G.mv(G.T(R), t), -1); }
    const cam = { K: K3, R, t, W: W3, H: H3 }; camGlyph(xm, ro, cam, { axisLen: 2.5 });
    if (tab === 0) { const cands = [[t, '#e03131', 't'], [G.mul(t, -1), '#7048e8', '−t'], [G.mul(G.mv(G.T(R), t), -1), '#2f9e44', '−Rᵀ·t']]; cands.forEach(([p, col, nm]) => { const q = ro.pr(p); if (!q) return; xm.strokeStyle = col; xm.lineWidth = 2.5; xm.beginPath(); xm.arc(q[0], q[1], 8, 0, 7); xm.stroke(); pill(xm, nm, q[0] + 9, q[1] + 4, col); }); }
    else { const th = Math.hypot(rx, ry, rz); if (th > 1e-6) { const ax = [rx / th, ry / th, rz / th]; const o = ro.pr(C), e = ro.pr(G.add(C, G.mul(ax, 5))); if (o && e) { xm.strokeStyle = '#f08c00'; xm.lineWidth = 3; xm.setLineDash([5, 3]); xm.beginPath(); xm.moveTo(o[0], o[1]); xm.lineTo(e[0], e[1]); xm.stroke(); xm.setLineDash([]); pill(xm, 'ציר הסיבוב', e[0] + 3, e[1], '#f08c00'); } } }
    render3(cI.getContext('2d'), cam, world);
    const rv = rvecOf(R); const th = G.norm(rv);
    code.textContent = 'R = ' + fmtM(R) + '\nrvec, _ = cv2.Rodrigues(R)   ->  [' + rv.map(v => F(v, 4)).join(', ') + ']    |rvec| = ' + F(th, 4) + ' rad = ' + F(G.deg(th), 1) + ' deg\ntvec = t = [' + t.map(v => F(v, 2)).join(', ') + ']\nC = -R.T @ t = [' + C.map(v => F(v, 2)).join(', ') + ']        # where the camera really is';
    if (tab === 0) out.innerHTML = 'המצלמה תמיד מסתכלת על הראשית, ממרחק של ' + ltr(F(Math.hypot(rad, h), 2) + ' m') + ', ולכן <b>' + ltr('t = (0, 0, ' + F(Math.hypot(rad, h), 2) + ')') + '</b> — סובב אותה כמה שתרצה, t לא זז. זה כי t הוא <i>הראשית של העולם, כפי שהמצלמה רואה אותה</i>: "ישר מולי, במרחק כזה". הוא לא אומר כלום על המקום של המצלמה בעולם. המיקום האמיתי הוא ' + ltr('C = −Rᵀ·t') + ' — העיגול <b style="color:#2f9e44">הירוק</b>, היחיד שיושב על המצלמה. ו־' + ltr('−t') + '? טעות נפוצה לא פחות: הוא נכון רק כשאין סיבוב בכלל.';
    else out.innerHTML = '<code class="ltr">rvec</code> הוא שלוש דרגות החופש של הסיבוב בשלושה מספרים: <b>הכיוון</b> שלו הוא ציר הסיבוב (החץ המקווקו), ו<b>האורך</b> שלו הוא הזווית ברדיאנים. ' + (Math.abs(rx - 1.8623) < 0.01 && Math.abs(ry) < 0.01 && Math.abs(rz) < 0.01 ? 'זו הדוגמה של הסעיף: סיבוב של <b>106.7°</b> סביב ציר X — 90° כדי שציר z של המצלמה (שבהתחלה מצביע "למעלה", כמו Z של העולם) יצביע קדימה, ועוד 16.7° של הטיה מטה: ' + ltr('arctan(3/10)') + '. ' : 'נסה את כפתור הדוגמה של הסעיף. ') + 'בלי סיבוב (rvec = 0) המצלמה "מסתכלת" לאורך Z של העולם — כלומר לשמיים — וזה מה שרואים בתמונה. ' + ltr('cv2.Rodrigues') + ' ממיר בין שתי הצורות, לשני הכיוונים.'; }
  function rvecOf(R) { const c = clamp((R[0][0] + R[1][1] + R[2][2] - 1) / 2, -1, 1), th = Math.acos(c); if (th < 1e-9) return [0, 0, 0]; if (Math.PI - th < 1e-6) { const k = [0, 1, 2].map(i => Math.sqrt(Math.max(0, (R[i][i] + 1) / 2))); if (R[0][1] < 0) k[1] = -k[1]; if (R[0][2] < 0) k[2] = -k[2]; return k.map(v => v * th); } const s = 2 * Math.sin(th); return [(R[2][1] - R[1][2]) / s * th, (R[0][2] - R[2][0]) / s * th, (R[1][0] - R[0][1]) / s * th]; }
  build(); draw();
};


/* ============================================================ chapter 4 — lens distortion */
const DIST0 = [-0.30, 0.10, 0.001, -0.0005, 0.0];
const cam4 = () => { const la = G.lookAt([-2, -8, 7], [6, 22, 0]); return { K: K3, R: la.R, t: la.t, W: W3, H: H3 }; };
/* pixel → distorted pixel and back, through normalised coordinates (the order of section 4.1) */
const toN = (K, p) => [(p[0] - K[0][2]) / K[0][0], (p[1] - K[1][2]) / K[1][1]], toP = (K, n) => [n[0] * K[0][0] + K[0][2], n[1] * K[1][1] + K[1][2]];
const distortPx = (K, p, d) => toP(K, G.distort(toN(K, p), d));
const undistPx = (K, p, d, it) => { const h = G.undistortIter(toN(K, p), d, it || 10); return h.map(n => toP(K, n)); };

/* ============================================================ 4.1 — the distortion model */
W.w3_distort_grid = function (box) {
  V.say(box, 'החניון והכביש דרך עדשה רחבה. <b>שנה את חמשת המקדמים</b> וראה את הקווים הישרים מתעקמים — חלש במרכז, חזק בפינות. <b>הזז את הסמן</b> מעל התמונה: החישוב של סעיף 4.1 לנקודה שמתחתיו, שלב אחר שלב. בלשוניות: חבית, כרית, עיוות משיקי — ובאג קלאסי.');
  const world = world3(); let d = DIST0.slice(), tab = 0, hov = [1180, 660], ghost = true;
  V.tabs(box, ['המקדמים של הקורס (חבית)', 'כרית (k1 > 0)', 'משיקי בלבד', '🐞 עיוות על פיקסלים'], k => { tab = k; d = [DIST0, [0.25, 0.05, 0, 0, 0], [0, 0, 0.02, -0.015, 0], DIST0][k].slice(); build(); draw(); });
  const ctl = el('div'); box.appendChild(ctl);
  const fx = flex(box); const cv = canvas(colm(fx, 'התמונה המעוותת (1280 × 720) — הקווים האפורים: בלי עיוות'), 512, 288, 512); const code = mono(box); const out = V.say(box);
  function build() { ctl.innerHTML = ''; const r1 = row(ctl), r2 = row(ctl); const nm = ['k1', 'k2', 'p1', 'p2', 'k3'], rg = [[-0.8, 0.5, 0.01], [-0.3, 0.3, 0.01], [-0.03, 0.03, 0.0005], [-0.03, 0.03, 0.0005], [-0.2, 0.2, 0.01]];
    nm.forEach((n, i) => V.slider(i < 3 ? r1 : r2, n, rg[i][0], rg[i][1], rg[i][2], d[i], v => { d[i] = v; draw(); }, v => F(v, i >= 2 && i <= 3 ? 4 : 2)));
    const c = el('label', { style: { margin: '0 8px' }, html: '<input type="checkbox"' + (ghost ? ' checked' : '') + '> הצג את הקווים בלי עיוות' }); c.querySelector('input').onchange = e => { ghost = e.target.checked; draw(); }; r2.appendChild(c); }
  function draw() { const cam = cam4(); const x = cv.getContext('2d'); const s = 512 / W3;
    if (tab === 3) { /* the bug: the formula applied to pixel offsets instead of normalised coordinates → r² is ~1e5 times too big */
      x.fillStyle = '#212529'; x.fillRect(0, 0, 512, 288); const camB = Object.assign({}, cam, { dist: d.map((v, i) => i === 0 || i === 1 || i === 4 ? v * Math.pow(1000, i === 0 ? 2 : i === 1 ? 4 : 6) : v * 1000) }); try { render3(x, camB, world, { bg: '#212529' }); } catch (e) {} }
    else render3(x, Object.assign({}, cam, { dist: d }), world);
    if (ghost && tab !== 3) render3(x, cam, world, { outline: 'rgba(40,40,40,.6)', outlineMarks: true });
    /* the point under the cursor */
    const n = toN(K3, hov), r2 = n[0] * n[0] + n[1] * n[1], rad = 1 + d[0] * r2 + d[1] * r2 * r2 + d[4] * r2 * r2 * r2, nd = G.distort(n, d), pd = toP(K3, nd);
    x.strokeStyle = '#212529'; x.lineWidth = 1.5; x.beginPath(); x.arc(hov[0] * s, hov[1] * s, 4, 0, 7); x.stroke(); arrowL(x, hov[0] * s, hov[1] * s, pd[0] * s, pd[1] * s, '#e8590c');
    if (tab === 3) { code.textContent = '# BUG: distort_normalized(uv - [cx, cy], *dist)   <- pixels, not X/Z, Y/Z\n# r2 at the corner = 640² + 360² = 539,200 instead of 0.54\n# radial = 1 - 0.30 * 539200 + ... = about 2.9e10  ->  every point flies off to infinity'; out.innerHTML = '<b>הבאג:</b> החלו את הנוסחה על הפיקסלים (אחרי החסרת המרכז) במקום על <code class="ltr">X/Z, Y/Z</code>. ‏r² בפינה הוא חצי מיליון במקום 0.54, והפקטור הרדיאלי ענק — כל הנקודות "עפות" אל מחוץ לתמונה, וכמעט כלום לא נשאר. המקדמים מוגדרים על הקואורדינטות המנורמלות, ובגלל זה הם לא תלויים ברזולוציה. הסדר הנכון: לחלק בעומק → לעוות → להכפיל ב־K.'; return; }
    code.textContent = 'x, y = (u - cx) / fx, (v - cy) / fy      = ' + F(n[0], 3) + ', ' + F(n[1], 3) + '        # the ideal pixel (' + F(hov[0], 0) + ', ' + F(hov[1], 0) + ')\nr2 = x*x + y*y                          = ' + F(r2, 4) + '\nradial = 1 + k1*r2 + k2*r2**2 + k3*r2**3 = ' + F(rad, 4) + '\nxd = x*radial + 2*p1*x*y + p2*(r2 + 2*x*x) = ' + F(nd[0], 4) + '\nyd = y*radial + p1*(r2 + 2*y*y) + 2*p2*x*y = ' + F(nd[1], 4) + '\nu_d, v_d = ' + F(pd[0], 1) + ', ' + F(pd[1], 1) + '      # moved by ' + F(Math.hypot(pd[0] - hov[0], pd[1] - hov[1]), 1) + ' px';
    const kind = tab === 0 ? 'k1 שלילי — <b>חבית</b>: כל נקודה נמשכת <i>פנימה</i>, לכיוון המרכז, ויותר ככל שהיא רחוקה ממנו. קווים ישרים שלא עוברים במרכז מתעקמים החוצה, כמו חבית. זה העיוות של עדשות רחבות — מצלמות רחפן, אבטחה ורכב.' : tab === 1 ? 'k1 חיובי — <b>כרית</b>: נקודות נדחפות <i>החוצה</i>, והפינות "נמתחות". נפוץ בעדשות טלה וזום.' : 'רק <b>עיוות משיקי</b>: העדשה מוטה מעט ביחס לחיישן, והתמונה "נמשכת" לצד אחד — לא סימטרי סביב המרכז. בעדשות אמיתיות הוא קטן בהרבה מהרדיאלי (המקדמים של הקורס: 0.001 ו־0.0005−).';
    out.innerHTML = kind + ' בנקודה שמתחת לסמן הפקטור הרדיאלי הוא ' + ltr(F(rad, 3)) + ', והנקודה זזה <b>' + F(Math.hypot(pd[0] - hov[0], pd[1] - hov[1]), 1) + ' פיקסלים</b> (החץ הכתום). במרכז ' + ltr('r = 0') + ' והפקטור 1 — בלי עיוות בכלל.'; }
  function arrowL(x, x0, y0, x1, y1, col) { x.strokeStyle = col; x.fillStyle = col; x.lineWidth = 2.5; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); const a = Math.atan2(y1 - y0, x1 - x0); if (Math.hypot(x1 - x0, y1 - y0) > 4) { x.beginPath(); x.moveTo(x1, y1); x.lineTo(x1 - 7 * Math.cos(a - 0.45), y1 - 7 * Math.sin(a - 0.45)); x.lineTo(x1 - 7 * Math.cos(a + 0.45), y1 - 7 * Math.sin(a + 0.45)); x.fill(); } }
  cv.addEventListener('mousemove', e => { const [mx, my] = mouse(cv, e); hov = [mx * W3 / 512, my * W3 / 512]; draw(); });
  build(); draw();
};

/* ============================================================ 4.2 — how much does it matter? */
W.w3_distort_amount = function (box) {
  V.say(box, 'כמה פיקסלים העיוות מזיז, וכמה <b>מטרים</b> זה עולה. למעלה — ההזזה כפונקציה של המרחק מהמרכז (הטבלה של הסעיף). למטה — מצלמת אבטחה מעל חניון: <b>גרור את הנקודה הכתומה</b> (נקודה על הקרקע) לאורך התמונה. בכל מקום מחושב המיקום שלה על הקרקע פעמיים: מהפיקסל כמו שהוא (בלי לתקן עיוות), ומהפיקסל המתוקן — ומושווה לאמת.');
  const world = world3(); let k1 = -0.30, P = [15, 45, 0], drag = false;
  const sr = row(box); V.slider(sr, 'k1', -0.6, 0.3, 0.01, k1, v => { k1 = v; draw(); });
  const fx = flex(box); const cG = canvas(colm(fx, 'ההזזה (פיקסלים) מול המרחק מהמרכז'), 300, 210, 300); const cI = canvas(colm(fx, 'התמונה המעוותת — גרור את הנקודה'), 384, 216, 384); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  const camd = () => Object.assign(cam4(), { dist: [k1, 0.10, 0.001, -0.0005, 0] });
  function draw() { const d = [k1, 0.10, 0.001, -0.0005, 0]; const g = cG.getContext('2d'); g.clearRect(0, 0, 300, 210); const X = r => 34 + r / 760 * 256, Y = v => 20 + (-v) / 130 * 160;
    g.strokeStyle = '#dee2e6'; g.beginPath(); g.moveTo(34, 20); g.lineTo(34, 182); g.lineTo(292, 182); g.stroke(); [0, 25, 50, 75, 100, 125].forEach(v => { txt(g, '−' + v, 4, Y(-v) + 4, '#868e96', 10); }); [0, 200, 400, 600].forEach(r => txt(g, String(r), X(r) - 8, 196, '#868e96', 10)); txt(g, 'פיקסלים מהמרכז', 190, 208, '#868e96', 10);
    g.strokeStyle = '#1c7ed6'; g.lineWidth = 2.5; g.beginPath(); for (let r = 0; r <= 760; r += 5) { const v = G.distort([r / 1000, 0], d)[0] * 1000 - r; const yy = clamp(Y(v), 2, 208); r ? g.lineTo(X(r), yy) : g.moveTo(X(r), yy); } g.stroke(); g.lineWidth = 1;
    [100, 300, 500, 700].forEach(r => { const v = G.distort([r / 1000, 0], d)[0] * 1000 - r; g.fillStyle = '#1c7ed6'; g.beginPath(); g.arc(X(r), clamp(Y(v), 2, 208), 3.5, 0, 7); g.fill(); });
    g.strokeStyle = '#adb5bd'; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(X(Math.hypot(640, 360)), 20); g.lineTo(X(Math.hypot(640, 360)), 182); g.stroke(); g.setLineDash([]); txt(g, 'פינה', X(734) - 32, 30, '#868e96', 10);
    const cam = camd(); const x = cI.getContext('2d'); const r = render3(x, cam, world); const pi = G.project(K3, cam.R, cam.t, P); const pd = distortPx(K3, pi, d);
    x.fillStyle = '#e8590c'; x.strokeStyle = '#fff'; x.lineWidth = 2; x.beginPath(); x.arc(pd[0] * r.s, pd[1] * r.s, 6, 0, 7); x.fill(); x.stroke();
    /* ground positions */
    const C = G.mul(G.mv(G.T(cam.R), cam.t), -1); const gNo = G.pixelToGround(K3, cam.R, C, pd, 0), gFix = G.pixelToGround(K3, cam.R, C, undistPx(K3, pd, d, 20).pop(), 0);
    const e1 = gNo ? Math.hypot(gNo[0] - P[0], gNo[1] - P[1]) : Infinity, e2 = gFix ? Math.hypot(gFix[0] - P[0], gFix[1] - P[1]) : Infinity; const distC = Math.hypot(P[0] - C[0], P[1] - C[1]);
    const rows = [100, 300, 500, 700].map(rr => [rr, ltr(F(G.distort([rr / 1000, 0], d)[0] * 1000 - rr, 1))]);
    tb.innerHTML = table(['מרחק מהמרכז (פיקסלים)', '0', '100', '300', '500', '700'], [['הזזה בגלל העיוות', '0'].concat(rows.map(r => r[1]))]) + table(['', 'X (מזרח)', 'Y (צפון)', 'שגיאה'], [['האמת', F(P[0], 2), F(P[1], 2), '—'], ['מהפיקסל המעוות, בלי תיקון', gNo ? F(gNo[0], 2) : '—', gNo ? F(gNo[1], 2) : '—', gNo ? '<b style="color:' + (e1 > 0.5 ? '#c92a2a' : '#495057') + '">' + F(e1, 2) + ' מ׳ (' + F(e1 / distC * 100, 1) + '%)</b>' : 'מעל האופק'], ['אחרי ביטול העיוות', gFix ? F(gFix[0], 2) : '—', gFix ? F(gFix[1], 2) : '—', F(e2 * 100, 1) + ' ס״מ']]);
    const off = Math.hypot(pd[0] - 640, pd[1] - 360);
    out.innerHTML = 'הנקודה ' + F(off, 0) + ' פיקסלים מהמרכז. ' + (Math.abs(k1 + 0.30) < 0.005 ? 'עם המקדמים של הקורס, הטבלה למעלה היא בדיוק הטבלה של הסעיף: ' + ltr('−0.3, −8.0, −34.8, −86.8') + '. ' : '') + 'בלי תיקון, המיקום על הקרקע שגוי ב־<b>' + F(e1, 2) + ' מטר</b> — ' + F(e1 / distC * 100, 1) + '% מהמרחק. ' + (off < 200 ? 'קרוב למרכז זה כמעט כלום. גרור לפינה.' : 'בפינות זה כבר אחוזים רבים — "עד עשרה אחוזים", כמו שהסעיף אומר, ולפעמים יותר כשהמבט שטוח. אחרי ביטול העיוות — סנטימטרים בודדים, ורק בגלל עיגול.'); }
  const at = e => { const [mx, my] = mouse(cI, e); const cam = camd(); const d = cam.dist; const s = cI.width / W3; const ideal = undistPx(K3, [mx / s, my / s], d, 20).pop(); const C = G.mul(G.mv(G.T(cam.R), cam.t), -1); const g = G.pixelToGround(K3, cam.R, C, ideal, 0); if (g && Math.hypot(g[0] - C[0], g[1] - C[1]) < 120) { P = [g[0], g[1], 0]; draw(); } };
  cI.addEventListener('mousedown', e => { drag = true; at(e); }); cI.addEventListener('mousemove', e => { if (drag) at(e); }); window.addEventListener('mouseup', () => { drag = false; });
  draw();
};

/* ============================================================ 4.3 — undoing the distortion */
W.w3_undistort = function (box) {
  V.say(box, 'אין נוסחה הפוכה — יש ניחוש ותיקון. <b>לחץ על נקודה</b> בתמונה המעוותת: המסלול הכתום הוא הניחושים של <code class="ltr">undistort_iter</code>, צעד אחר צעד, מהנקודה המעוותת עצמה ועד הנקודה האידאלית. שנה את k1 ל־0.6− (תרגיל 4.2) וראה את ההתכנסות מאטה. בלשונית השנייה — יישור <i>תמונה שלמה</i>, ולמה <code class="ltr">remap</code> קורא ולא כותב.');
  const world = world3(); let k1 = -0.30, its = 3, P = [1130, 640], tab = 0, holes = false;
  V.tabs(box, ['נקודה אחת: undistort_iter', 'תמונה שלמה: remap'], k => { tab = k; build(); draw(); });
  const ctl = el('div'); box.appendChild(ctl);
  const fx = flex(box); const cA = canvas(colm(fx, 'מעוותת — לחץ'), 384, 216, 352); const cB = canvas(colm(fx, 'אחרי ביטול'), 384, 216, 352); const code = mono(box); const out = V.say(box);
  function build() { ctl.innerHTML = ''; const r1 = row(ctl); V.slider(r1, 'k1', -0.7, 0.2, 0.01, k1, v => { k1 = v; draw(); }); if (tab === 0) V.slider(r1, 'צעדים', 1, 40, 1, its, v => { its = v; draw(); });
    else { const c = el('label', { style: { margin: '0 8px' }, html: '<input type="checkbox"' + (holes ? ' checked' : '') + '> 🐞 לכתוב קדימה (לכל פיקסל מקור — לאן הוא הולך)' }); c.querySelector('input').onchange = e => { holes = e.target.checked; draw(); }; r1.appendChild(c); } }
  const dd = () => [k1, 0.10, 0.001, -0.0005, 0];
  function draw() { const d = dd(), cam = cam4(); const a = cA.getContext('2d'); const ra = render3(a, Object.assign({}, cam, { dist: d }), world); const b = cB.getContext('2d'); const s = ra.s;
    if (tab === 0) { render3(b, cam, world);
      const hist = G.undistortIter(toN(K3, P), d, its).map(n => toP(K3, n)); const ideal = undistPx(K3, P, d, 200).pop();
      [a, b].forEach((x, k) => { x.strokeStyle = '#e8590c'; x.lineWidth = 2; x.beginPath(); hist.forEach((p, i) => i ? x.lineTo(p[0] * s, p[1] * s) : x.moveTo(p[0] * s, p[1] * s)); x.stroke(); hist.forEach((p, i) => { x.fillStyle = i === 0 ? '#212529' : '#e8590c'; x.beginPath(); x.arc(p[0] * s, p[1] * s, i === 0 ? 4 : 2.5, 0, 7); x.fill(); }); x.strokeStyle = '#2f9e44'; x.lineWidth = 2; x.beginPath(); x.arc(ideal[0] * s, ideal[1] * s, 7, 0, 7); x.stroke(); });
      const errs = hist.map(p => Math.hypot(p[0] - ideal[0], p[1] - ideal[1]));
      code.textContent = 'xyd = (uvd - [cx, cy]) / [fx, fy]\nxy = xyd.copy()\nfor _ in range(' + its + '):\n    xy = xy - (distort_normalized(xy, *dist) - xyd)\n# error (px) after 0, 1, 2, 3, 5, 10, ' + its + ' steps: ' + [0, 1, 2, 3, 5, 10, its].filter(i => i <= its).map(i => F(errs[i], i < 3 ? 2 : 4)).join(', ');
      const e = errs[errs.length - 1]; out.innerHTML = 'הנקודה השחורה — הפיקסל המעוות ' + ltr('(' + F(P[0], 0) + ', ' + F(P[1], 0) + ')') + '. העיגול הירוק — המקום האמיתי. אחרי ' + its + ' צעדים השגיאה <b>' + (e < 0.01 ? e.toExponential(1) : F(e, 3)) + ' פיקסלים</b>. ' + (Math.abs(k1 + 0.3) < 0.005 ? 'בקוד של הסעיף, על 200 נקודות, השגיאה הגדולה ביותר: 12.35 פיקסלים אחרי צעד אחד, 0.77 אחרי שלושה, ' + ltr('5e-5') + ' אחרי עשרה — אותה התנהגות. ' : '') + (k1 < -0.5 ? 'עם עיוות חזק ההתכנסות איטית: כל צעד מתקן רק חלק מהפער, כי העיוות משתנה מהר מדי סביב הנקודה ("כמעט הזזה" כבר לא נכון). עוד יותר חזק — והשיטה עלולה להתבדר; אז עוברים לשיטת ניוטון, או למודל עין דג.' : 'למה זה עובד: ליד הנקודה העיוות הוא כמעט הזזה קבועה, אז "מה שפספסנו" הוא בערך התיקון שחסר.'); }
    else { /* whole-image undistortion by inverse mapping: for every output pixel, distort it and read there */
      const Wc = 192, Hc = 108, sc = Wc / W3; const src = document.createElement('canvas'); src.width = Wc; src.height = Hc; render3(src.getContext('2d'), Object.assign({}, cam, { dist: d }), world); const sd = src.getContext('2d').getImageData(0, 0, Wc, Hc).data;
      const dst = new ImageData(Wc, Hc); let holesN = 0;
      if (!holes) { for (let y = 0; y < Hc; y++) for (let x = 0; x < Wc; x++) { const q = distortPx(K3, [(x + 0.5) / sc, (y + 0.5) / sc], d); const u = Math.floor(q[0] * sc), v = Math.floor(q[1] * sc); const o = (y * Wc + x) * 4; if (u < 0 || v < 0 || u >= Wc || v >= Hc) { dst.data[o + 3] = 255; continue; } const i = (v * Wc + u) * 4; dst.data[o] = sd[i]; dst.data[o + 1] = sd[i + 1]; dst.data[o + 2] = sd[i + 2]; dst.data[o + 3] = 255; } }
      else { for (let y = 0; y < Hc; y++) for (let x = 0; x < Wc; x++) { const q = undistPx(K3, [(x + 0.5) / sc, (y + 0.5) / sc], d, 10).pop(); const u = Math.floor(q[0] * sc), v = Math.floor(q[1] * sc); if (u < 0 || v < 0 || u >= Wc || v >= Hc) continue; const i = (y * Wc + x) * 4, o = (v * Wc + u) * 4; dst.data[o] = sd[i]; dst.data[o + 1] = sd[i + 1]; dst.data[o + 2] = sd[i + 2]; dst.data[o + 3] = 255; }
        for (let i = 3; i < dst.data.length; i += 4) if (!dst.data[i]) { holesN++; dst.data[i - 3] = 255; dst.data[i - 2] = 0; dst.data[i - 1] = 255; dst.data[i] = 255; } }
      const tmp = document.createElement('canvas'); tmp.width = Wc; tmp.height = Hc; tmp.getContext('2d').putImageData(dst, 0, 0); b.imageSmoothingEnabled = false; b.clearRect(0, 0, 384, 216); b.drawImage(tmp, 0, 0, 384, 216); a.imageSmoothingEnabled = false; a.drawImage(src, 0, 0, 384, 216);
      code.textContent = holes ? '# BUG: forward mapping — for every SOURCE pixel, compute where it lands, and write it there\nfor v in range(h):\n    for u in range(w):\n        u2, v2 = undistort_iter(np.array([[u, v]]), K, dist)[0]\n        out[int(v2), int(u2)] = img[v, u]          # some targets get two pixels, some none' : '# remap reads: for every OUTPUT (undistorted) pixel, where to read it in the distorted image\nmap_x, map_y = cv2.initUndistortRectifyMap(K, np.array(dist), None, K, (w, h), cv2.CV_32FC1)\n# map_x[v, u], map_y[v, u] = distort(u, v)  — the FORWARD distortion\nund = cv2.remap(img, map_x, map_y, cv2.INTER_LINEAR)';
      out.innerHTML = holes ? '<b>הבאג:</b> כתיבה קדימה — כל פיקסל של התמונה המעוותת נשלח למקומו המתוקן. בחבית, התמונה המתוקנת <i>גדולה</i> יותר, ולכן פיקסלים "נמרחים" על שטח גדול יותר ונשארים חורים — ' + holesN + ' פיקסלים בצבע מג׳נטה (מתוך ' + Wc * Hc + ', בתמונה המוקטנת של ההדמיה). לכן <code class="ltr">remap</code> עובד הפוך: לכל פיקסל <i>יעד</i> הוא שואל מאיפה לקרוא. כל יעד מקבל ערך, בלי חורים.' : 'יישור של תמונה שלמה: לכל פיקסל בתמונה <i>המתוקנת</i> מחשבים איפה הוא נמצא בתמונה המעוותת — עם העיוות <b>קדימה</b>, בלי איטרציות — וקוראים משם. הפינות השחורות: מקומות שהעדשה לא ראתה בכלל (הם נפלו מחוץ לחיישן). וזו המסקנה המפתיעה של תרגיל 4.3: ליישר תמונה צריך את פונקציית העיוות, ולעוות תמונה צריך את ההופכית. ' + ltr('initUndistortRectifyMap') + ' מחשבת את המפה פעם אחת, ו־' + ltr('remap') + ' מהירה בכל פריים.'; }
  }
  cA.addEventListener('click', e => { if (tab) return; const [mx, my] = mouse(cA, e); P = [mx / cA.width * W3, my / cA.width * W3]; draw(); });
  build(); draw();
};


/* ============================================================ chapter 5 — calibration engine (Zhang's init + Levenberg–Marquardt), on synthetic boards */
const CB = { cols: 9, rows: 6, sq: 0.025, K: G.K(1100, 650, 350), dist: [-0.28, 0.09, 0, 0, 0], W: 1280, H: 720 };
const objp5 = (() => { const o = []; for (let j = 0; j < CB.rows; j++) for (let i = 0; i < CB.cols; i++) o.push([i * CB.sq, j * CB.sq, 0]); return o; })();
const projD = (K, dist, R, t, P) => { const Pc = G.toCam(R, t, P); if (Pc[2] <= 1e-6) return null; const [x, y] = G.distort([Pc[0] / Pc[2], Pc[1] / Pc[2]], dist); return [K[0][0] * x + K[0][2], K[1][1] * y + K[1][2]]; };
/* 15 poses that put the board in different parts of the image with different tilts (fixed seed: the same for everyone) */
function views5(seed) { const r = G.rng(seed || 5), out = []; const spots = [[0, 0], [-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0], [-0.6, -0.5], [0.6, 0.5], [0.5, -0.6], [-0.5, 0.6], [0, 0], [0.2, -0.2]];
  spots.forEach((sp, k) => { const Z = 0.42 + 0.18 * r(); const tilt = [(r() - 0.5) * 0.9, (r() - 0.5) * 0.9, (r() - 0.5) * 0.6]; const R = G.rodrigues(tilt); const ctr = [0.1, 0.0625, 0];
    const target = [sp[0] * 0.55 * Z * 640 / 1100 * 0.9, sp[1] * 0.55 * Z * 360 / 1100 * 1.1, Z]; const t = G.sub(target, G.mv(R, ctr));
    const ideal = objp5.map(P => projD(CB.K, CB.dist, R, t, P)); const noisy = ideal.map(q => [q[0] + 0.25 * G.randn(r), q[1] + 0.25 * G.randn(r)]); out.push({ R, t, ideal, img: noisy, id: k }); });
  return out; }
function zhangInit(views) { const Hs = views.map(v => G.dlt(objp5.map(P => [P[0], P[1]]), v.img).H); const vij = (H, i, j) => { const h = k => [H[0][k], H[1][k], H[2][k]]; const a = h(i), b = h(j); return [a[0] * b[0], a[0] * b[1] + a[1] * b[0], a[1] * b[1], a[2] * b[0] + a[0] * b[2], a[2] * b[1] + a[1] * b[2], a[2] * b[2]]; };
  const Vm = []; Hs.forEach(H => { Vm.push(vij(H, 0, 1)); const a = vij(H, 0, 0), b = vij(H, 1, 1); Vm.push(a.map((x, k) => x - b[k])); });
  if (Hs.length < 3) { Vm.push([0, 1, 0, 0, 0, 0]); }   /* fewer than 3 views: assume zero skew, like OpenCV does */
  let b = G.nullvec(Vm).v; if (b[0] < 0) b = b.map(x => -x); const [B11, B12, B22, B13, B23, B33] = b;
  const v0 = (B12 * B13 - B11 * B23) / (B11 * B22 - B12 * B12); const lam = B33 - (B13 * B13 + v0 * (B12 * B13 - B11 * B23)) / B11; const al = Math.sqrt(Math.abs(lam / B11)), be = Math.sqrt(Math.abs(lam * B11 / (B11 * B22 - B12 * B12))); const u0 = -B13 * al * al / lam;
  let K = G.K(al, isFinite(u0) ? u0 : 640, isFinite(v0) ? v0 : 360, be); if (!(al > 100 && al < 10000) || !(be > 100 && be < 10000)) K = G.K(1000, 640, 360);
  return { K, poses: Hs.map(H => G.planarPose(K, H)) }; }
function rvecOf3(R) { const c = clamp((R[0][0] + R[1][1] + R[2][2] - 1) / 2, -1, 1), th = Math.acos(c); if (th < 1e-9) return [0, 0, 0]; const s = 2 * Math.sin(th); return [(R[2][1] - R[1][2]) / s * th, (R[0][2] - R[2][0]) / s * th, (R[1][0] - R[0][1]) / s * th]; }
/* calibrate: params [fx, fy, cx, cy, k1, k2, (k3)] + per view [w(3), t(3)] */
function calibrate5(views, opt) { opt = opt || {}; const fixK3 = !!opt.fixK3; const n = views.length; const init = zhangInit(views);
  const nI = fixK3 ? 6 : 7; let p = [init.K[0][0], init.K[1][1], init.K[0][2], init.K[1][2], 0, 0].concat(fixK3 ? [] : [0]); init.poses.forEach(ps => { p = p.concat(rvecOf3(ps.R), ps.t); });
  const unpack = p => ({ K: G.K(p[0], p[2], p[3], p[1]), dist: [p[4], p[5], 0, 0, fixK3 ? 0 : p[6]] });
  const resView = (p, v, k) => { const { K, dist } = unpack(p); const o = nI + 6 * k; const R = G.rodrigues(p.slice(o, o + 3)), t = p.slice(o + 3, o + 6); const out = []; v.img.forEach((q, i) => { const r = projD(K, dist, R, t, objp5[i]); if (!r) { out.push(100, 100); return; } out.push(r[0] - q[0], r[1] - q[1]); }); return out; };
  const resAll = p => views.flatMap((v, k) => resView(p, v, k)); const m = n * objp5.length * 2; const np = p.length;
  let r = resAll(p), cost = r.reduce((a, x) => a + x * x, 0), lam = 1e-3;
  for (let it = 0; it < (opt.iters || 40); it++) {
    /* Jacobian: intrinsic columns touch every residual, pose columns only their own view's */
    const J = [...Array(m)].map(() => new Float64Array(np));
    for (let c = 0; c < nI; c++) { const h = Math.max(1e-6, Math.abs(p[c]) * 1e-6); const q = p.slice(); q[c] += h; const r2 = resAll(q); for (let i = 0; i < m; i++) J[i][c] = (r2[i] - r[i]) / h; }
    views.forEach((v, k) => { const base = k * objp5.length * 2; for (let c = 0; c < 6; c++) { const idx = nI + 6 * k + c; const h = 1e-6; const q = p.slice(); q[idx] += h; const r2 = resView(q, v, k); for (let i = 0; i < r2.length; i++) J[base + i][idx] = (r2[i] - r[base + i]) / h; } });
    const A = [...Array(np)].map(() => new Array(np).fill(0)), g = new Array(np).fill(0);
    for (let i = 0; i < m; i++) { const Ji = J[i]; const nz = []; for (let c = 0; c < np; c++) if (Ji[c] !== 0) nz.push(c); nz.forEach(a => { g[a] -= Ji[a] * r[i]; nz.forEach(b => { A[a][b] += Ji[a] * Ji[b]; }); }); }
    let improved = false; for (let tries = 0; tries < 8 && !improved; tries++) { const Ad = A.map((row, i) => row.map((x, j) => i === j ? x * (1 + lam) + 1e-12 : x)); const dx = V.solve(Ad, g); if (!dx) { lam *= 10; continue; } const q = p.map((x, i) => x + dx[i]); const rn = resAll(q); const cn = rn.reduce((a, x) => a + x * x, 0); if (cn < cost) { const gain = cost - cn; p = q; r = rn; cost = cn; lam = Math.max(1e-9, lam / 5); improved = true; if (gain < 1e-10 * cost) it = 999; } else lam *= 8; }
    if (!improved) break; }
  const { K, dist } = unpack(p); const per = views.map((v, k) => { const rr = resView(p, v, k); let ss = 0; for (let i = 0; i < rr.length; i += 2) ss += rr[i] * rr[i] + rr[i + 1] * rr[i + 1]; return Math.sqrt(ss / (rr.length / 2)); });
  return { K, dist, rms: Math.sqrt(cost / (m / 2)), per, poses: views.map((v, k) => { const o = nI + 6 * k; return { R: G.rodrigues(p.slice(o, o + 3)), t: p.slice(o + 3, o + 6) }; }) }; }
/* draw a board (white margin + 10 × 7 squares) through a camera with distortion, into ctx scaled from the 1280 × 720 image */
function drawBoard(x, K, dist, R, t, s, opt) { opt = opt || {}; const sq = CB.sq; const pr = P => { const q = projD(K, dist, R, t, P); return q ? [q[0] * s, q[1] * s] : null; };
  const poly = (corners, col) => { const pts = []; for (let e = 0; e < 4; e++) { const a = corners[e], b = corners[(e + 1) % 4]; for (let k = 0; k < 6; k++) { const q = pr([a[0] + (b[0] - a[0]) * k / 6, a[1] + (b[1] - a[1]) * k / 6, 0]); if (!q) return; pts.push(q); } } x.fillStyle = col; x.beginPath(); pts.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); x.fill(); };
  poly([[-1.6 * sq, -1.6 * sq], [10.6 * sq, -1.6 * sq], [10.6 * sq, 7.6 * sq], [-1.6 * sq, 7.6 * sq]], '#fff');
  for (let j = -1; j < 6; j++) for (let i = -1; i < 9; i++) if ((i + j) % 2 === 0) poly([[i * sq, j * sq], [(i + 1) * sq, j * sq], [(i + 1) * sq, (j + 1) * sq], [i * sq, (j + 1) * sq]], opt.col || '#212529'); }


/* ============================================================ 5.1 — why a chessboard: sub-pixel corners, and symmetry */
W.w3_chess_sym = function (box) {
  V.say(box, 'שתי התכונות שעושות את לוח השחמט לכלי הכיול הסטנדרטי. <b>בלשונית הראשונה</b>: פינה אמיתית של לוח, מוגדלת — מטושטשת ורועשת כמו בתמונה אמיתית. <b>לחץ "צעד"</b> וראה איך <code class="ltr">cornerSubPix</code> מוצאת את המקום שלה בדיוק של שבר פיקסל, רק מהגרדיאנטים מסביב. <b>בלשונית השנייה</b>: סדר הפינות כשהלוח מסתובב.');
  let tab = 0, seed = 3, est = null, hist = [], blur = 0.8, noise = 4, rot = 0, kind = 0;
  V.tabs(box, ['דיוק תת־פיקסל', 'סימטריה וסדר הפינות'], k => { tab = k; build(); draw(); });
  const ctl = el('div'); box.appendChild(ctl); const fx = flex(box); const cv = canvas(colm(fx, ''), 420, 300, 420); const code = mono(box); const out = V.say(box);
  const N = 15, truth = () => { const r = G.rng(seed); return [7 + r() * 0.9 - 0.45 + 0.0, 7 + r() * 0.9 - 0.45]; };
  let patch = null;
  function makePatch() { const [x0, y0] = truth(); const r = G.rng(seed * 7 + 1); patch = []; for (let y = 0; y < N; y++) { const row = []; for (let x = 0; x < N; x++) { let v = 0; const ss = 6; for (let a = 0; a < ss; a++) for (let b = 0; b < ss; b++) { const px = x + (a + 0.5) / ss - 0.5, py = y + (b + 0.5) / ss - 0.5; const e = z => 0.5 + 0.5 * Math.tanh(z / Math.max(0.05, blur)); const sx = e(px - x0), sy = e(py - y0); v += (sx * sy + (1 - sx) * (1 - sy)); } row.push(30 + 200 * v / (ss * ss) + noise * G.randn(r)); } patch.push(row); } }
  /* cornerSubPix: the corner q satisfies Σ g gᵀ (q − p) = 0 over the window (every gradient is perpendicular to p − q) */
  function step(q) { let a = 0, b = 0, c = 0, bx = 0, by = 0; for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) { if (Math.abs(x - q[0]) > 5 || Math.abs(y - q[1]) > 5) continue; const gx = (patch[y][x + 1] - patch[y][x - 1]) / 2, gy = (patch[y + 1][x] - patch[y - 1][x]) / 2; const w = Math.exp(-((x - q[0]) ** 2 + (y - q[1]) ** 2) / 18); a += w * gx * gx; b += w * gx * gy; c += w * gy * gy; bx += w * (gx * gx * x + gx * gy * y); by += w * (gx * gy * x + gy * gy * y); } const det = a * c - b * b; return [(c * bx - b * by) / det, (a * by - b * bx) / det]; }
  function build() { ctl.innerHTML = ''; const r1 = row(ctl);
    if (tab === 0) { V.slider(r1, 'טשטוש', 0.2, 2, 0.1, blur, v => { blur = v; reset(); }); V.slider(r1, 'רעש', 0, 20, 1, noise, v => { noise = v; reset(); }); V.btns(ctl, [['▶ צעד', () => { if (hist.length < 12) { est = step(est); hist.push(est); draw(); } }, 'primary'], ['⏭ עד הסוף', () => { for (let i = 0; i < 10; i++) { est = step(est); hist.push(est); } draw(); }], ['פינה אחרת', () => { seed++; reset(); }], ['↺', () => reset()]]); }
    else { V.btns(ctl, [['↻ סובב את הלוח ב־90°', () => { rot = (rot + 90) % 360; draw(); }]]); V.tabs(ctl, ['לוח של 9 על 6 פינות', 'לוח של 8 על 8 פינות'], k => { kind = k; draw(); }, kind); } }
  function reset() { makePatch(); est = [Math.round(truth()[0]), Math.round(truth()[1])]; hist = [est]; draw(); }
  function draw() { const x = cv.getContext('2d'); x.clearRect(0, 0, 420, 300); cv.previousSibling.innerHTML = tab ? 'הלוח מול המצלמה — המספרים: הסדר שבו הפינות יוחזרו' : 'פינה מוגדלת (15 × 15 פיקסלים)';
    if (tab === 0) { const S = 19, o = [10, 8]; for (let y = 0; y < N; y++) for (let xx = 0; xx < N; xx++) { const v = clamp(Math.round(patch[y][xx]), 0, 255); x.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; x.fillRect(o[0] + xx * S, o[1] + y * S, S, S); }
      const T = truth(), P = q => [o[0] + (q[0] + 0.5) * S, o[1] + (q[1] + 0.5) * S]; x.strokeStyle = '#2f9e44'; x.lineWidth = 2; const tp = P(T); x.beginPath(); x.moveTo(tp[0] - 9, tp[1]); x.lineTo(tp[0] + 9, tp[1]); x.moveTo(tp[0], tp[1] - 9); x.lineTo(tp[0], tp[1] + 9); x.stroke();
      x.strokeStyle = '#e8590c'; x.lineWidth = 2; x.beginPath(); hist.forEach((q, i) => { const pp = P(q); i ? x.lineTo(pp[0], pp[1]) : x.moveTo(pp[0], pp[1]); }); x.stroke(); hist.forEach((q, i) => { const pp = P(q); x.fillStyle = i === hist.length - 1 ? '#e8590c' : '#ffd8a8'; x.beginPath(); x.arc(pp[0], pp[1], 4, 0, 7); x.fill(); });
      const e = Math.hypot(est[0] - T[0], est[1] - T[1]); txt(x, 'ירוק: הפינה האמיתית', 305, 30, '#2f9e44', 11); txt(x, 'כתום: ההערכה', 305, 48, '#e8590c', 11);
      code.textContent = 'corners = cv2.cornerSubPix(img, corners, (5, 5), (-1, -1), crit)\n# step ' + (hist.length - 1) + ':  q = (' + F(est[0], 3) + ', ' + F(est[1], 3) + ')   truth (' + F(T[0], 3) + ', ' + F(T[1], 3) + ')   error ' + F(e, 3) + ' px';
      out.innerHTML = 'הניחוש הראשון הוא הפיקסל השלם הקרוב — שגיאה של עד חצי פיקסל. הרעיון של <code class="ltr">cornerSubPix</code>: בכל נקודה ליד הפינה, הגרדיאנט (כיוון השינוי בבהירות) <b>מאונך</b> לקו שמחבר אותה לפינה — על שפה הוא ניצב לשפה, ובאזור אחיד הוא אפס. זה נותן מערכת משוואות לינארית קטנה (2 על 2), שהפתרון שלה הוא הפינה. פותרים, מזיזים את החלון, וחוזרים. ' + (hist.length > 1 ? 'עכשיו: <b>' + F(e, 3) + ' פיקסל</b>' + (e < 0.1 ? ' — ' + badge(true, 'שבר של פיקסל.') : '.') + ' ' : '') + 'הגדל את הרעש: הדיוק יורד, אבל לאט — כי משתמשים בעשרות פיקסלים כדי למצוא נקודה אחת. מכאן גם הדרישה לתאורה טובה ולתמונה חדה.'; return; }
    /* symmetry */
    const cols = kind ? 8 : 9, rows = kind ? 8 : 6; const sq = 22; const W0 = (cols + 1) * sq, H0 = (rows + 1) * sq; const cx = 210, cy = 150; const a = G.rad(rot);
    const tr = (u, v) => { const X = u - W0 / 2, Y = v - H0 / 2; return [cx + X * Math.cos(a) - Y * Math.sin(a), cy + X * Math.sin(a) + Y * Math.cos(a)]; };
    x.fillStyle = '#fff'; x.strokeStyle = '#ced4da'; x.beginPath(); [[-12, -12], [W0 + 12, -12], [W0 + 12, H0 + 12], [-12, H0 + 12]].forEach((p, i) => { const q = tr(p[0], p[1]); i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]); }); x.closePath(); x.fill(); x.stroke();
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) if ((i + j) % 2 === 0) { x.fillStyle = '#343a40'; x.beginPath(); [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].forEach((p, k) => { const q = tr(p[0] * sq, p[1] * sq); k ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]); }); x.closePath(); x.fill(); }
    /* the board's own mark (so the viewer sees the rotation): a red dot in the first square */
    const md = tr(0.5 * sq, 0.5 * sq); x.fillStyle = '#e03131'; x.beginPath(); x.arc(md[0], md[1], 5, 0, 7); x.fill();
    /* the detector's order: rows of `cols` corners, starting from the corner nearest the image top-left, along the longer direction — like findChessboardCorners for the pattern size (cols, rows) */
    const pts = []; for (let j = 1; j <= rows; j++) for (let i = 1; i <= cols; i++) pts.push(tr(i * sq, j * sq));
    const fits90 = kind === 1 || rot % 180 === 0; let order = null;
    if (fits90) { const grid = []; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) grid.push([i, j]); const rot90 = (rot / 90) % 4; let start; const idx = (i, j) => j * cols + i; const corners4 = [idx(0, 0), idx(cols - 1, 0), idx(cols - 1, rows - 1), idx(0, rows - 1)]; start = corners4.reduce((b, c) => pts[c][0] + pts[c][1] < pts[b][0] + pts[b][1] ? c : b, corners4[0]);
      /* walk: first along the image-x direction */ const si = start % cols, sj = Math.floor(start / cols); const di = si === 0 ? 1 : -1, dj = sj === 0 ? 1 : -1; const along = Math.abs(pts[idx(si + di, sj)][0] - pts[start][0]) > Math.abs(pts[idx(si, sj + dj)][0] - pts[start][0]); order = [];
      if (along) { for (let jj = 0; jj < rows; jj++) for (let ii = 0; ii < cols; ii++) order.push(idx(si + di * ii, sj + dj * jj)); } else { for (let ii = 0; ii < cols; ii++) for (let jj = 0; jj < rows; jj++) order.push(idx(si + di * ii, sj + dj * jj)); } }
    if (order) order.forEach((c, k) => { if (k > 11 && k < order.length - 3) return; const q = pts[c]; x.fillStyle = k === 0 ? '#e8590c' : '#1c7ed6'; x.beginPath(); x.arc(q[0], q[1], k === 0 ? 6 : 4, 0, 7); x.fill(); txt(x, String(k), q[0] + 4, q[1] - 4, k === 0 ? '#e8590c' : '#1c7ed6', 11); });
    else pts.forEach(q => { x.fillStyle = '#adb5bd'; x.beginPath(); x.arc(q[0], q[1], 3, 0, 7); x.fill(); });
    const firstSq = order ? order[0] : -1; const markCorner = 0; code.textContent = 'ok, corners = cv2.findChessboardCorners(img, (' + (kind ? '8, 8' : '9, 6') + '))' + (order ? '\n# corner 0 is the board\'s corner #' + firstSq + ' (the one next to the red dot is #0)' : '\n# ok = False: the pattern in the image is 6 x 9, not 9 x 6');
    out.innerHTML = kind === 0 ? (rot % 180 === 0 ? 'לוח של 9 על 6 פינות. ' + (rot === 0 ? 'פינה 0 (כתומה) צמודה לנקודה האדומה — הסימן של הלוח עצמו.' : 'סובבנו 180°: הגלאי עדיין מתחיל מלמעלה משמאל, ולכן פינה 0 היא עכשיו <i>הפינה הנגדית</i> של הלוח — רחוקה מהנקודה האדומה.') + ' סובב שוב.' : 'סובבנו 90°: בתמונה רואים לוח של 6 על 9, והגלאי שמחפש 9 על 6 <b>לא מוצא אותו</b> (ok = False) — אין כאן שום בלבול. הסיבוב ב־90° פשוט לא "נראה כמו" אותו לוח. זה מה שהתרגיל אומר.') : 'לוח של 8 על 8: אחרי כל סיבוב ב־90° הוא נראה <b>בדיוק</b> אותו דבר, ולכן הגלאי תמיד מוצא אותו — אבל פינה 0 שלו היא בכל פעם פינה אחרת של הלוח האמיתי (שים לב לנקודה האדומה). ' + (rot ? 'עכשיו פינה 0 היא הפינה #' + firstSq + ' של הלוח.' : '');
    out.innerHTML += ' <span class="note-small">(הערה של האתר: לכיול של מצלמה <i>אחת</i> זה עדיין עובד — כל תמונה מקבלת R ו־t משלה, וסיבוב של מערכת הלוח הוא פשוט R אחרת. הבלבול הורס את מה שמשתמש <i>במיקום</i> הלוח: כיול סטריאו (שתי מצלמות צריכות להסכים איזו פינה היא 0), מדידה מהלוח, וחיבור בין תמונות. גם סיבוב של 180° בלוח 9 על 6 מחליף את פינה 0 — לכן לוחות כיול מקצועיים מוסיפים סימון (ChArUco).)</span>'; }
  build(); reset();
};

/* ============================================================ 5.2 — calibrate (in the browser) on images whose answer we know */
W.w3_calib_overfit = function (box) {
  V.say(box, 'סטודיו כיול. 15 תמונות של לוח, ממצלמה מדומה שהפרמטרים שלה ידועים (כמו בסעיף: ' + ltr('fx = 1100') + ', מרכז ' + ltr('(650, 350)') + ', ' + ltr('k1 = −0.28, k2 = 0.09') + '), עם רעש של רבע פיקסל בפינות. <b>לחץ על תמונות</b> כדי לבחור אילו נכנסות לכיול, ו<b>לחץ "כייל"</b> — הכיול רץ כאן, בדפדפן: אתחול סגור (שיטת ג׳אנג) ואחריו מזעור של שגיאת ההטלה, כמו <code class="ltr">calibrateCamera</code>. <b>האתגר:</b> לבחור ארבע תמונות בלבד שנותנות עיוות נכון גם בפינות.');
  const views = views5(); let sel = new Set([...Array(15).keys()]), fixK3 = false, res = null, busy = false;
  const gal = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(5, 128px)', gap: '6px', justifyContent: 'center', direction: 'ltr', margin: '6px 0' } }); box.appendChild(gal);
  const thumbs = views.map((v, k) => { const c = canvas(gal, 128, 72, 128); c.style.cursor = 'pointer'; c.addEventListener('click', () => { sel.has(k) ? sel.delete(k) : sel.add(k); res = null; drawThumbs(); report(); }); return c; });
  const ctl = row(box); V.btns(box, [['⚙ כייל', () => run(), 'primary'], ['כולן', () => { sel = new Set([...Array(15).keys()]); res = null; drawThumbs(); report(); }], ['רק שלוש מהמרכז', () => { sel = new Set([0, 13, 14]); res = null; drawThumbs(); report(); }], ['נקה', () => { sel = new Set(); res = null; drawThumbs(); report(); }]]);
  const fk = el('label', { style: { margin: '0 8px' }, html: '<input type="checkbox"> <code class="ltr">cv2.CALIB_FIX_K3</code> (k3 = 0)' }); fk.querySelector('input').onchange = e => { fixK3 = e.target.checked; res = null; report(); }; ctl.appendChild(fk);
  const fx = flex(box); const cC = canvas(colm(fx, 'העיוות: הזזה (פיקסלים) מול המרחק מהמרכז'), 330, 220, 330); const cH = canvas(colm(fx, 'כיסוי: איפה בתמונה היו פינות'), 320, 180, 320); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function drawThumbs() { thumbs.forEach((c, k) => { const x = c.getContext('2d'); x.fillStyle = '#868e96'; x.fillRect(0, 0, 128, 72); drawBoard(x, CB.K, CB.dist, views[k].R, views[k].t, 0.1); x.strokeStyle = sel.has(k) ? '#2f9e44' : '#ced4da'; x.lineWidth = sel.has(k) ? 4 : 1; x.strokeRect(1, 1, 126, 70); if (!sel.has(k)) { x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(0, 0, 128, 72); } txt(x, String(k + 1), 5, 14, sel.has(k) ? '#2f9e44' : '#495057', 12); });
    const h = cH.getContext('2d'); h.fillStyle = '#f1f3f5'; h.fillRect(0, 0, 320, 180); views.forEach((v, k) => { if (!sel.has(k)) return; v.img.forEach(q => { h.fillStyle = 'rgba(28,126,214,.55)'; h.fillRect(q[0] * 0.25 - 1, q[1] * 0.25 - 1, 2.5, 2.5); }); }); }
  const shift = (d, r) => G.distort([r / 1100, 0], d)[0] * 1100 - r;
  function run() { if (sel.size < 3) { out.innerHTML = badge(false, 'צריך לפחות שלוש תמונות.') + ' עם פחות מזה יש יותר נעלמים ממה שהאתחול יכול לקבוע (פחות משש משוואות ל־K).'; return; } busy = true; out.innerHTML = 'מכייל…'; setTimeout(() => { res = calibrate5([...sel].sort((a, b) => a - b).map(k => views[k]), { fixK3 }); busy = false; report(); }, 30); }
  function report() { const g = cC.getContext('2d'); g.clearRect(0, 0, 330, 220); const X = r => 36 + r / 760 * 284, Y = v => 110 - v / 140 * 95; g.strokeStyle = '#dee2e6'; g.beginPath(); g.moveTo(36, 10); g.lineTo(36, 205); g.moveTo(36, 110); g.lineTo(325, 110); g.stroke(); [-120, -60, 0, 60, 120].forEach(v => txt(g, String(v).replace('-', '−'), 4, Y(v) + 4, '#868e96', 10)); [0, 300, 600].forEach(r => txt(g, String(r), X(r) - 6, 218, '#868e96', 10));
    const cov = (() => { let m = 0; views.forEach((v, k) => { if (sel.has(k)) v.img.forEach(q => { m = Math.max(m, Math.hypot(q[0] - 650, q[1] - 350)); }); }); return m; })();
    g.fillStyle = 'rgba(28,126,214,.07)'; g.fillRect(36, 10, X(cov) - 36, 195); g.strokeStyle = '#adb5bd'; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(X(cov), 10); g.lineTo(X(cov), 205); g.moveTo(X(Math.hypot(650, 370)), 10); g.lineTo(X(Math.hypot(650, 370)), 205); g.stroke(); g.setLineDash([]); txt(g, 'פינה', X(746) - 26, 22, '#868e96', 10); if (cov > 30) txt(g, 'יש נתונים עד כאן', Math.min(X(cov) - 80, 220), 200, '#1c7ed6', 10);
    const curve = (d, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); for (let r = 0; r <= 760; r += 5) { const yy = clamp(Y(shift(d, r)), 0, 220); r ? g.lineTo(X(r), yy) : g.moveTo(X(r), yy); } g.stroke(); g.lineWidth = 1; };
    curve(CB.dist, '#2f9e44', 3); if (res) curve(res.dist, '#e8590c', 2); txt(g, 'אמת', 280, 30, '#2f9e44', 11); if (res) txt(g, 'נמצא', 280, 46, '#e8590c', 11);
    if (!res) { tb.innerHTML = ''; out.innerHTML = 'נבחרו <b>' + sel.size + '</b> תמונות. ' + (busy ? '' : 'לחץ "כייל".'); return; }
    const K = res.K, d = res.dist; const cornerErr = Math.max(...[300, 500, 700, 746].map(r => Math.abs(shift(d, r) - shift(CB.dist, r)))); const fxErr = Math.abs(K[0][0] - 1100) / 1100 * 100;
    tb.innerHTML = table(['פרמטר', 'אמת', 'נמצא'], [['fx, fy', '1100, 1100', F(K[0][0], 1) + ', ' + F(K[1][1], 1)], ['cx, cy', '650, 350', F(K[0][2], 1) + ', ' + F(K[1][2], 1)], ['k1, k2, k3', ltr('−0.28, 0.09, 0'), ltr(F(d[0], 3) + ', ' + F(d[1], 3) + ', ' + F(d[4], 3))], ['שגיאת הטלה (RMS)', '—', '<b>' + F(res.rms, 3) + '</b> פיקסל'], ['טעות העיוות בפינה', '—', '<b>' + F(cornerErr, 1) + '</b> פיקסלים']]);
    const ok4 = sel.size <= 4 && cornerErr < 2 && fxErr < 1;
    out.innerHTML = 'השגיאה על הנתונים: <b>' + F(res.rms, 3) + ' פיקסל</b> — ' + (res.rms < 0.5 ? 'מצוין לכאורה. ' : 'גבוהה. ') + (cornerErr > 5 ? '<b>אבל</b> העקומה הכתומה בורחת מהירוקה בדיוק היכן שאין נתונים (מימין לאזור הכחול): k2 ו־k3 "הסבירו" את הפינות שנראו, ובשוליים הם משתגעים — ' + F(cornerErr, 0) + ' פיקסלים בפינה. זו התאמת יתר — פולינום שמתאים לנקודות ומטורף ביניהן, כמו במודול 2. ' + (fixK3 ? '' : 'נסה את <code class="ltr">CALIB_FIX_K3</code>, או הוסף תמונות עם הלוח בפינות. ') : 'העקומה צמודה לאמת עד הפינה. ') + (sel.size === 15 ? 'שים לב שגם עם 15 תמונות k2 ו־k3 לא בדיוק כמו האמת — הם מפצים זה את זה, וכמעט אותה עקומה יוצאת מצירופים שונים (בדיוק מה שהסעיף מתאר).' : '') + (ok4 ? ' ' + badge(true, 'ארבע תמונות או פחות, fx בטווח של 1% וטעות עיוות מתחת ל־2 פיקסלים: הבחירה הנכונה היא מגוון — לוחות בפינות ובזוויות שונות, לא כמות.') : (sel.size <= 4 ? ' (אתגר: עם 4 תמונות לכל היותר — fx בטווח 1% וטעות עיוות פחות מ־2 פיקסלים.)' : '')); }
  drawThumbs(); report();
};

/* ============================================================ 5.3 — how do you know the calibration is good? */
W.w3_reproj = function (box) {
  V.say(box, 'אין טבלת אמת במציאות — רק השגיאות. כאן 15 התמונות של סעיף 5.2 ועוד שתיים בעייתיות: אחת <b>מטושטשת</b> (הפינות זזות בפיקסל וחצי) ואחת שבה <b>הלוח לא היה שטוח</b> (הנייר התכופף). <b>לחץ "כייל"</b>, מצא את התמונות שבולטות בגרף, <b>לחץ על העמודה שלהן</b> כדי להוציא אותן — וכייל שוב. בלשונית השנייה: הבאג של ה־reshape.');
  const base = views5(); const r = G.rng(99);
  const mk = (tilt, target, sigma, warp) => { const R = G.rodrigues(tilt); const t = G.sub(target, G.mv(R, [0.1, 0.0625, 0])); const pts = objp5.map(P => { const Pw = warp ? [P[0], P[1], warp * Math.sin(Math.PI * P[0] / 0.2) * 0.006] : P; return projD(CB.K, CB.dist, R, t, Pw); }); return { R, t, img: pts.map(q => [q[0] + sigma * G.randn(r), q[1] + sigma * G.randn(r)]), id: 0 }; };
  const views = base.concat([mk([0.2, -0.3, 0.1], [0.05, -0.03, 0.48], 1.5, 0), mk([-0.3, 0.25, 0], [-0.04, 0.03, 0.45], 0.25, 1)]); const NAMES = views.map((v, k) => k < 15 ? String(k + 1) : k === 15 ? '16 מטושטשת' : '17 לא שטוחה');
  let out0 = new Set(), res = null, tab = 0;
  V.tabs(box, ['שגיאה לכל תמונה', '🐞 בלי reshape'], k => { tab = k; draw(); });
  V.btns(box, [['⚙ כייל', () => { const used = views.map((v, k) => k).filter(k => !out0.has(k)); res = calibrate5(used.map(k => views[k])); res.used = used; draw(); }, 'primary'], ['החזר את כולן', () => { out0 = new Set(); res = null; draw(); }]]);
  const fx = flex(box); const cv = canvas(colm(fx, 'שגיאת ההטלה החוזרת לכל תמונה (פיקסלים) — לחץ על עמודה כדי להוציא'), 600, 230, 600); const code = mono(box); const out = V.say(box);
  function draw() { const x = cv.getContext('2d'); x.clearRect(0, 0, 600, 230);
    if (tab === 1) { const v = views[0]; const est = res || calibrate5(base); const pr = objp5.map(P => projD(est.K, est.dist, est.poses[0].R, est.poses[0].t, P)); /* (N,1,2) - (N,2) broadcasts to (N,N,2) */ let ss = 0, n = 0; pr.forEach(a => v.img.forEach(b => { ss += (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2; n++; })); const bad = Math.sqrt(ss / n); let s2 = 0; pr.forEach((a, i) => { s2 += (a[0] - v.img[i][0]) ** 2 + (a[1] - v.img[i][1]) ** 2; }); const good = Math.sqrt(s2 / pr.length);
      code.textContent = 'p, _ = cv2.projectPoints(o, r, tv, K_est, dist_est)     # p.shape = (54, 1, 2)\n# i.shape = (54, 1, 2) from findChessboardCorners — or (54, 2), depending on how you stored it\nd = p - i.reshape(-1, 2)          # BUG: (54, 1, 2) - (54, 2) -> broadcasts to (54, 54, 2)\nnp.sqrt((d ** 2).sum(axis=-1).mean())   = ' + F(bad, 1) + '   # every corner against every corner\nd = p.reshape(-1, 2) - i.reshape(-1, 2)\nnp.sqrt((d ** 2).sum(axis=1).mean())    = ' + F(good, 3);
      txt(x, 'עם reshape: ' + F(good, 3), 60, 80, '#2f9e44', 16); txt(x, 'בלי: ' + F(bad, 1) + ' פיקסלים', 60, 130, '#c92a2a', 16);
      out.innerHTML = '<b>הבאג שהסעיף מספר עליו:</b> שני מערכים בצורות <span class="ltr">(54, 1, 2)</span> ו־<span class="ltr">(54, 2)</span>. החיסור לא נכשל — NumPy משדר אותו ל־<span class="ltr">(54, 54, 2)</span>: כל פינה מול <i>כל</i> פינה. התוצאה: "שגיאה" של ' + F(bad, 0) + ' פיקסלים — בערך הגודל של הלוח בתמונה — על כיול מצוין. הבדיקה הזולה ביותר: <code class="ltr">print(p.shape, i.shape)</code> לפני כל חיסור.'; return; }
    if (!res) { code.textContent = ''; out.innerHTML = 'לחץ "כייל" — על ' + (17 - out0.size) + ' תמונות.'; txt(x, 'עוד לא כוילה', 250, 120, '#adb5bd', 14); return; }
    const used = res.used; const per = {}; used.forEach((k, i) => per[k] = res.per[i]); const mx = Math.max(1, ...Object.values(per)); const bw = 580 / 17;
    views.forEach((v, k) => { const X0 = 12 + k * bw; if (per[k] === undefined) { txt(x, '—', X0 + 10, 200, '#adb5bd', 12); } else { const h = per[k] / mx * 170; x.fillStyle = out0.has(k) ? '#dee2e6' : per[k] > 0.6 ? '#e03131' : '#1c7ed6'; x.fillRect(X0 + 3, 195 - h, bw - 6, h); txt(x, F(per[k], 2), X0 + 2, 190 - h, '#495057', 10); } txt(x, k < 15 ? String(k + 1) : (k === 15 ? '16' : '17'), X0 + bw / 2 - 5, 214, k >= 15 ? '#c92a2a' : '#495057', 11); });
    x.strokeStyle = '#2f9e44'; x.setLineDash([4, 3]); const yh = 195 - 0.5 / mx * 170; x.beginPath(); x.moveTo(10, yh); x.lineTo(595, yh); x.stroke(); x.setLineDash([]); txt(x, '0.5', 572, yh - 3, '#2f9e44', 10);
    const K = res.K; code.textContent = 'rms = ' + F(res.rms, 3) + '     fx, fy = ' + F(K[0][0], 1) + ', ' + F(K[1][1], 1) + '     cx, cy = ' + F(K[0][2], 1) + ', ' + F(K[1][2], 1) + '     k1, k2, k3 = ' + res.dist.filter((_, i) => i !== 2 && i !== 3).map(v => F(v, 3)).join(', ') + '\n# truth: fx 1100, c (650, 350), k1 -0.28, k2 0.09';
    const bads = [15, 16].filter(k => used.includes(k)); out.innerHTML = 'שגיאה כללית: <b>' + F(res.rms, 3) + '</b>, ‏fx = ' + F(K[0][0], 1) + '. ' + (bads.length ? 'התמונות ' + bads.map(k => '<b>' + NAMES[k] + '</b>').join(' ו־') + ' בולטות מעל השאר' + (bads.includes(16) ? ' — לוח לא שטוח לא נותן רעש אקראי אלא שגיאה <i>שיטתית</i>, ובגללה הכיול מעוות קצת את כל הפרמטרים כדי "לרצות" אותה' : '') + '. לחץ על העמודה כדי להוציא, וכייל שוב.' : badge(true, 'כל התמונות מתחת לחצי פיקסל, ואף אחת לא בולטת') + ' — הסימן של כיול תקין. (ועדיין: זו שגיאה על נתוני האימון. הבדיקה האמיתית היא על תמונות אחרות, או מרחק ידוע — שאלת הראיון.)'); }
  cv.addEventListener('click', e => { if (tab || !res) return; const [mx] = mouse(cv, e); const k = Math.floor((mx - 12) / (580 / 17)); if (k < 0 || k > 16) return; out0.has(k) ? out0.delete(k) : out0.add(k); draw(); out.innerHTML = 'התמונה ' + NAMES[k] + (out0.has(k) ? ' הוצאה' : ' הוחזרה') + '. לחץ "כייל" כדי לראות את ההשפעה.'; res = res; });
  draw();
};

/* ============================================================ chapter 6 — homography and measuring on the ground */
const cam6 = h => { const la = G.lookAt([0, 0, h || 6], [0, 20, 0]); return { K: K3, R: la.R, t: la.t, W: W3, H: H3 }; };
const Hground = cam => { const R = cam.R, t = cam.t; return G.mm(cam.K, [[R[0][0], R[0][1], t[0]], [R[1][0], R[1][1], t[1]], [R[2][0], R[2][1], t[2]]]); };   // H = K [r1 r2 t]: ground (X, Y, 1) → pixel
const normH = H => H.map(r => r.map(x => x / H[2][2]));
const PARK4 = [[8, 30], [26, 30], [26, 60], [8, 60]];
const cam62 = () => { const la = G.lookAt([0, 0, 6], [8, 30, 0]); return { K: K3, R: la.R, t: la.t, W: W3, H: H3 }; };
/* a top-down map of the ground: X from x0 to x1, Y from y0 to y1, into a canvas */
function groundMap(cv, x0, x1, y0, y1, world) { const x = cv.getContext('2d'), W = cv.width, H = cv.height; const sx = W / (x1 - x0), sy = H / (y1 - y0); const P = (X, Y) => [(X - x0) * sx, H - (Y - y0) * sy];
  x.fillStyle = '#a9d18e'; x.fillRect(0, 0, W, H); const fill = (pts, col) => { x.fillStyle = col; x.beginPath(); pts.forEach((p, i) => { const q = P(p[0], p[1]); i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]); }); x.closePath(); x.fill(); };
  fill([[-3.5, y0], [3.5, y0], [3.5, y1], [-3.5, y1]], '#6c7177'); fill([[8, 30], [26, 30], [26, 60], [8, 60]], '#868e96');
  x.strokeStyle = '#f8f9fa'; x.lineWidth = 1; for (let i = 0; i <= 6; i++) { [[30, 40], [50, 60]].forEach(([a, b]) => { const p = P(8 + i * 3, a), q = P(8 + i * 3, b); x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(q[0], q[1]); x.stroke(); }); }
  for (let y = y0 - (y0 % 9); y < y1; y += 9) { const p = P(0, y), q = P(0, y + 3); x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(q[0], q[1]); x.stroke(); }
  (world ? world.cars : []).forEach(c => { const a = P(c[0] - (c[3] ? 2.25 : 0.9), c[1] + (c[3] ? 0.9 : 2.25)); x.fillStyle = c[2]; x.fillRect(a[0], a[1], (c[3] ? 4.5 : 1.8) * sx, (c[3] ? 1.8 : 4.5) * sy); });
  return { P, inv: (u, v) => [u / sx + x0, (H - v) / sy + y0], x }; }

/* ============================================================ 6.1 — where the homography comes from */
W.w3_plane_H = function (box) {
  V.say(box, 'מצלמה על עמוד, מסתכלת על הכביש. מימין — מפה של הקרקע מלמעלה. <b>הזז את הסמן</b> על אחד מהם: הנקודה המתאימה מסומנת בשני, דרך מטריצה אחת של 3 על 3 — <code class="ltr">H = K [r1 r2 t]</code> — בלי שום עומק. שנה את הגובה וההטיה ותראה את H משתנה. ו<b>לחץ "×2"</b>: H אחרת, אותו מיפוי בדיוק.');
  const world = world3(); let h = 6, look = 20, scale = 1, hov = [0, 15], from = 'map';
  const r1 = row(box); V.slider(r1, 'גובה העמוד (מ׳)', 2, 30, 0.5, h, v => { h = v; draw(); }); V.slider(r1, 'מסתכלת לנקודה ב־Y (מ׳)', 8, 80, 1, look, v => { look = v; draw(); });
  V.btns(box, [['H × 2', () => { scale *= 2; draw(); }], ['H × (−1)', () => { scale *= -1; draw(); }], ['איפוס', () => { scale = 1; draw(); }]]);
  const fx = flex(box); const cI = canvas(colm(fx, 'התמונה'), 400, 225, 400); const cM = canvas(colm(fx, 'הקרקע מלמעלה (X ‏−15..30, Y ‏0..70)'), 200, 280, 200); const code = mono(box); const out = V.say(box);
  const cam = () => { const la = G.lookAt([0, 0, h], [0, look, 0]); return { K: K3, R: la.R, t: la.t, W: W3, H: H3 }; };
  function draw() { const c = cam(); const r = render3(cI.getContext('2d'), c, world); const m = groundMap(cM, -15, 30, 0, 70, world); const H = Hground(c).map(row => row.map(v => v * scale)); const Hi = G.inv3(H);
    let g, px; if (from === 'map') { g = hov; const q = G.mv(H, [g[0], g[1], 1]); px = q[2] > 0 ? [q[0] / q[2], q[1] / q[2]] : null; if (q[2] <= 0) px = null; } else { px = hov; const q = G.mv(Hi, [px[0], px[1], 1]); g = [q[0] / q[2], q[1] / q[2]]; if ((q[2] < 0) !== (scale < 0) && q[2] !== 0) g = null; }
    const xi = cI.getContext('2d'); if (px) { xi.fillStyle = '#e8590c'; xi.strokeStyle = '#fff'; xi.lineWidth = 2; xi.beginPath(); xi.arc(px[0] * r.s, px[1] * r.s, 6, 0, 7); xi.fill(); xi.stroke(); }
    if (g) { const p = m.P(g[0], g[1]); m.x.fillStyle = '#e8590c'; m.x.strokeStyle = '#fff'; m.x.lineWidth = 2; m.x.beginPath(); m.x.arc(p[0], p[1], 6, 0, 7); m.x.fill(); m.x.stroke(); }
    const cp = m.P(0, 0); m.x.fillStyle = '#212529'; m.x.beginPath(); m.x.arc(cp[0], Math.min(cp[1], 274), 5, 0, 7); m.x.fill();
    const Hn = normH(H); code.textContent = 'H = K @ np.c_[R[:, 0], R[:, 1], t]      # the third column of R is multiplied by Z = 0 and disappears\nH = ' + fmtM(H.map(r => r.map(v => +v.toPrecision(5)))) + '\nH / H[2, 2] = ' + fmtM(Hn.map(r => r.map(v => +v.toPrecision(5)))) + '\n' + (from === 'map' ? '(X, Y) = (' + F(hov[0], 1) + ', ' + F(hov[1], 1) + ')  ->  H @ (X, Y, 1)  ->  ' + (px ? 'pixel (' + F(px[0], 0) + ', ' + F(px[1], 0) + ')' : 'behind the camera') : 'pixel (' + F(hov[0], 0) + ', ' + F(hov[1], 0) + ')  ->  inv(H) @ (u, v, 1)  ->  ' + (g ? '(X, Y) = (' + F(g[0], 2) + ', ' + F(g[1], 2) + ')' : 'above the horizon: no ground point'));
    out.innerHTML = (scale !== 1 ? 'H הוכפלה ב־' + ltr(F(scale, 0)) + ' — וכל המיפוי זהה לגמרי: הקבוע מצטמצם בחלוקה ברכיב השלישי. לכן מתוך תשעה מספרים רק <b>שמונה</b> חופשיים, ומנרמלים כך ש־' + ltr('H[2, 2] = 1') + '. ' : '') + (from === 'img' && !g ? '<b>מעל האופק</b>: הקרן מהפיקסל לא פוגשת את הקרקע. ‏' + ltr('inv(H)') + ' עדיין מחזירה מספרים — נקודה "מאחורי" המצלמה (הרכיב השלישי שלילי). הבדיקה של הסימן היא חובה.' : 'לא השתמשנו בעומק בכלל: כל נקודה על הקרקע עוברת לפיקסל, ובחזרה, דרך אותה מטריצה. זה עובד רק כי ' + ltr('Z = 0') + ' לכל הנקודות — העמודה השלישית של R נעלמת. נקודה שלא על הקרקע (ראש של אדם, גג של רכב) תקבל תשובה שגויה — סעיף 6.4.'); }
  cM.addEventListener('mousemove', e => { const [mx, my] = mouse(cM, e); hov = [mx / 200 * 45 - 15, (280 - my) / 280 * 70]; from = 'map'; draw(); });
  cI.addEventListener('mousemove', e => { const [mx, my] = mouse(cI, e); hov = [mx / 400 * W3, my / 400 * W3]; from = 'img'; draw(); });
  draw();
};

/* ============================================================ 6.2 — DLT from scratch: drag four points, see the rectified ground */
W.w3_dlt = function (box) {
  V.say(box, 'החניון בצד הכביש הוא מלבן של 18 על 30 מטר. <b>גרור את ארבע הידיות</b> (1–4) בתמונה אל ארבע הפינות שלו — בסדר: 1 קרוב־שמאל, 2 קרוב־ימין, 3 רחוק־ימין, 4 רחוק־שמאל. בכל רגע DLT מחשבת H מארבעת הזוגות, ומימין — המבט מלמעלה שהיא נותנת. כשהידיות במקום, הקווים של החניון יוצאים מקבילים והריבועים ישרים. בלשונית השנייה — מה רואים בערכים הסינגולריים.');
  const world = world3(); const cam = cam62(); const truth = PARK4.map(p => { const q = G.project(K3, cam.R, cam.t, [p[0], p[1], 0]); return [q[0], q[1]]; });
  const OFF = [[-60, 50], [70, 40], [45, -35], [-55, -30]]; const mess = () => truth.map((p, i) => [p[0] + OFF[i][0], p[1] + OFF[i][1]]); let hand = mess(), drag = -1, tab = 0, norm = true, noise = 0;
  V.tabs(box, ['גרור את הפינות', 'ערכים סינגולריים ונרמול'], k => { tab = k; build(); draw(); });
  const ctl = el('div'); box.appendChild(ctl);
  const fx = flex(box); const cI = canvas(colm(fx, 'התמונה — גרור את הידיות'), 448, 252, 448); const cB = canvas(colm(fx, 'המבט מלמעלה דרך H'), 180, 300, 180); const code = mono(box); const out = V.say(box);
  const img = document.createElement('canvas'); img.width = 448; img.height = 252; render3(img.getContext('2d'), cam, world); const idata = img.getContext('2d').getImageData(0, 0, 448, 252).data; const s = 448 / W3;
  function build() { ctl.innerHTML = ''; const r1 = row(ctl); V.btns(r1, [['הצמד לפינות', () => { hand = truth.map(p => p.slice()); draw(); }], ['ערבב', () => { hand = mess(); draw(); }], ['🐞 שלוש על קו', () => { hand = [truth[0], [(truth[0][0] + truth[1][0]) / 2, (truth[0][1] + truth[1][1]) / 2], truth[1], truth[3]].map(p => p.slice()); draw(); }]]);
    if (tab === 1) { const c = el('label', { style: { margin: '0 8px' }, html: '<input type="checkbox"' + (norm ? ' checked' : '') + '> נרמול (normalize)' }); c.querySelector('input').onchange = e => { norm = e.target.checked; draw(); }; r1.appendChild(c); V.slider(ctl, 'רעש בסימון (פיקסלים)', 0, 3, 0.1, noise, v => { noise = v; draw(); }); } }
  function draw() { const x = cI.getContext('2d'); x.drawImage(img, 0, 0); const src = hand, dst = PARK4; const res = G.dlt(src, dst, !norm); const Hi = res.H; /* image → ground */
    const ok = Hi.every(r => r.every(isFinite)); let Hg = ok ? G.inv3(Hi) : null; /* ground → image */ if (Hg && G.mv(Hg, [17, 45, 1])[2] < 0) Hg = Hg.map(r => r.map(v => -v));
    x.strokeStyle = '#e8590c'; x.lineWidth = 2; x.beginPath(); src.forEach((p, i) => i ? x.lineTo(p[0] * s, p[1] * s) : x.moveTo(p[0] * s, p[1] * s)); x.closePath(); x.stroke();
    src.forEach((p, i) => { x.fillStyle = '#e8590c'; x.beginPath(); x.arc(p[0] * s, p[1] * s, 9, 0, 7); x.fill(); txt(x, String(i + 1), p[0] * s - 3, p[1] * s + 4, '#fff', 12); });
    /* rectified top view: X 4..30, Y 26..64 */
    const b = cB.getContext('2d'); const out0 = b.createImageData(180, 300); const X0 = 4, X1 = 30, Y0 = 26, Y1 = 64;
    if (Hg) for (let j = 0; j < 300; j++) for (let i = 0; i < 180; i++) { const X = X0 + (i + 0.5) / 180 * (X1 - X0), Y = Y1 - (j + 0.5) / 300 * (Y1 - Y0); const q = G.mv(Hg, [X, Y, 1]); const o = (j * 180 + i) * 4; if (q[2] <= 0) { out0.data[o] = 200; out0.data[o + 1] = 200; out0.data[o + 2] = 200; out0.data[o + 3] = 255; continue; } const u = Math.floor(q[0] / q[2] * s), v = Math.floor(q[1] / q[2] * s); if (u < 0 || v < 0 || u >= 448 || v >= 252) { out0.data[o] = 230; out0.data[o + 1] = 230; out0.data[o + 2] = 230; out0.data[o + 3] = 255; continue; } const k = (v * 448 + u) * 4; out0.data[o] = idata[k]; out0.data[o + 1] = idata[k + 1]; out0.data[o + 2] = idata[k + 2]; out0.data[o + 3] = 255; }
    b.putImageData(out0, 0, 0); b.strokeStyle = 'rgba(232,89,12,.9)'; b.lineWidth = 1.5; const mp = (X, Y) => [(X - X0) / (X1 - X0) * 180, (Y1 - Y) / (Y1 - Y0) * 300]; b.beginPath(); PARK4.forEach((p, i) => { const q = mp(p[0], p[1]); i ? b.lineTo(q[0], q[1]) : b.moveTo(q[0], q[1]); }); b.closePath(); b.stroke();
    const err = Math.max(...src.map((p, i) => Math.hypot(p[0] - truth[i][0], p[1] - truth[i][1]))); const sv = res.sv;
    code.textContent = 'H = homography_dlt(uv_handles, park_corners)      # image -> ground (metres)\nsingular values of A: [' + sv.map(v => v < 1e-9 ? '0' : v.toPrecision(3)).join(', ') + ']\nH = ' + fmtM(Hi.map(r => r.map(v => +(+v).toPrecision(4))));
    if (tab === 0) out.innerHTML = 'הידיות רחוקות מהפינות עד <b>' + F(err, 0) + ' פיקסלים</b>. ' + (err < 6 ? badge(true, 'במקום.') + ' המבט מלמעלה מראה את החניון כמלבן, והפסים מקבילים ובמרווחים שווים. אבל הרכבים "נמרחים" הרחק מהמצלמה, והעץ בשוליים נמתח: ההומוגרפיה מניחה שכל פיקסל על הקרקע (סעיף 6.4).' : 'כל עוד הן לא בפינות, המלבן הכתום במבט מלמעלה הוא הנחה שגויה — והחניון "מתעקם". גרור, או לחץ "הצמד".') + (sv[7] < 1e-6 * sv[0] ? ' <b style="color:#c92a2a">שלוש נקודות על קו:</b> הערך הסינגולרי השמיני אפס — יש אינסוף פתרונות, ומה שיצא שרירותי (תרגיל 6.3).' : '');
    else { let rms = 0; if (noise > 0) { const r = G.rng(3); let ss = 0, n = 0; for (let k = 0; k < 60; k++) { const nh = truth.map(p => [p[0] + noise * G.randn(r), p[1] + noise * G.randn(r)]); const Hk = G.dlt(nh, dst, !norm).H; [[17, 45], [5, 40], [0, 60]].forEach(gp => { const gq = G.ap(Hk, G.project(K3, cam.R, cam.t, [gp[0], gp[1], 0])); ss += (gq[0] - gp[0]) ** 2 + (gq[1] - gp[1]) ** 2; n++; }); } rms = Math.sqrt(ss / n); }
      out.innerHTML = 'שמונה משוואות (שתיים לכל זוג), תשעה נעלמים — ולכן תמיד יש וקטור שמאפס את A: הערך הסינגולרי התשיעי ' + ltr('≈ 0') + '. ההומוגרפיה היא הוקטור הזה. ' + (norm ? 'עם נרמול, הערכים הסינגולריים בסדר גודל דומה' : '<b>בלי נרמול</b> יש ב־A מספרים כמו 1 לצד ' + ltr('u·x') + ' של עשרות אלפים, והערכים הסינגולריים מתפרסים על פני סדרי גודל רבים') + '. ' + (noise > 0 ? 'עם רעש של ' + F(noise, 1) + ' פיקסלים בסימון, השגיאה הממוצעת על שלוש נקודות בדיקה (60 ניסויים): <b>' + F(rms, 2) + ' מטר</b>. כבה והדלק את הנרמול והשווה.' : 'הוסף רעש בסימון והשווה עם ובלי נרמול.'); }
  }
  const at = e => { const [mx, my] = mouse(cI, e); return [mx / s, my / s]; };
  cI.addEventListener('mousedown', e => { const p = at(e); let best = -1, bd = 30 / s; hand.forEach((q, i) => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; best = i; } }); drag = best; });
  cI.addEventListener('mousemove', e => { if (drag < 0) return; hand[drag] = at(e); draw(); }); window.addEventListener('mouseup', () => { drag = -1; });
  build(); draw();
};

/* ============================================================ 6.3 — from pixel to metres */
W.w3_ground_measure = function (box) {
  V.say(box, 'H כבר מחושבת מארבע פינות החניון (סעיף 6.2). מעכשיו כל פיקסל על הקרקע הוא נקודה במטרים. <b>לחץ פעמיים</b> בתמונה — שתי נקודות על הקרקע — ותקבל את המרחק ביניהן. <b>האתגר:</b> מדוד את הרוחב של חנייה אחת (3 מטר), את רוחב הכביש בין הקווים הלבנים (6.8 מטר), ואת האורך של הרכב הכתום על הכביש — <i>בין הנקודות שבהן הגלגלים נוגעים בקרקע</i>, קדימה ואחורה (בערך 4.5 מטר) — כל אחד בטווח של 5%.');
  const world = world3(); const cam = cam62(); const s = 512 / W3; const uv = PARK4.map(p => { const q = G.project(K3, cam.R, cam.t, [p[0], p[1], 0]); return [q[0], q[1]]; }); const H = G.dlt(uv, PARK4).H;
  let pts = [], got = {};
  const fx = flex(box); const cI = canvas(colm(fx, 'לחץ פעמיים: שתי נקודות על הקרקע'), 512, 288, 512); const cM = canvas(colm(fx, 'מלמעלה'), 160, 288, 160); const code = mono(box); const out = V.say(box);
  V.btns(box, [['נקה', () => { pts = []; draw(); }], ['איפוס האתגר', () => { got = {}; pts = []; draw(); }]]);
  function draw() { const x = cI.getContext('2d'); render3(x, cam, world); const m = groundMap(cM, -6, 28, 0, 70, world);
    pts.forEach(p => { x.fillStyle = '#e8590c'; x.beginPath(); x.arc(p[0] * s, p[1] * s, 5, 0, 7); x.fill(); const g = G.ap(H, p); const q = m.P(g[0], g[1]); m.x.fillStyle = '#e8590c'; m.x.beginPath(); m.x.arc(q[0], q[1], 4, 0, 7); m.x.fill(); });
    if (pts.length === 2) { x.strokeStyle = '#e8590c'; x.lineWidth = 2; x.beginPath(); x.moveTo(pts[0][0] * s, pts[0][1] * s); x.lineTo(pts[1][0] * s, pts[1][1] * s); x.stroke(); const a = G.ap(H, pts[0]), b = G.ap(H, pts[1]); const d = Math.hypot(a[0] - b[0], a[1] - b[1]); const qa = m.P(a[0], a[1]), qb = m.P(b[0], b[1]); m.x.strokeStyle = '#e8590c'; m.x.lineWidth = 2; m.x.beginPath(); m.x.moveTo(qa[0], qa[1]); m.x.lineTo(qb[0], qb[1]); m.x.stroke();
      [['bay', 3, 'חנייה'], ['road', 6.8, 'רוחב הכביש'], ['car', 4.5, 'אורך הרכב הכתום']].forEach(([k, L]) => { if (Math.abs(d - L) / L < 0.05) { const nearCar = Math.abs(a[0] - 1.75) < 1.6 && Math.abs(b[0] - 1.75) < 1.6 && Math.min(a[1], b[1]) > 34 && Math.max(a[1], b[1]) < 42; const nearRoad = Math.abs(Math.abs(a[0]) - 3.33) < 0.6 && Math.abs(Math.abs(b[0]) - 3.33) < 0.6 && a[0] * b[0] < 0; const inPark = a[0] > 7.5 && b[0] > 7.5; if ((k === 'car' && nearCar) || (k === 'road' && nearRoad) || (k === 'bay' && inPark)) got[k] = d; } });
      code.textContent = 'g = apply_h(H, np.array([[' + F(pts[0][0], 0) + ', ' + F(pts[0][1], 0) + '], [' + F(pts[1][0], 0) + ', ' + F(pts[1][1], 0) + ']]))\n# = [[' + F(a[0], 2) + ', ' + F(a[1], 2) + '], [' + F(b[0], 2) + ', ' + F(b[1], 2) + ']]   (metres on the ground)\nnp.linalg.norm(g[0] - g[1]) = ' + F(d, 2) + ' m'; }
    else code.textContent = 'H = homography_dlt(uv_park_corners, park_corners_m)      # image -> ground\n# click two points';
    const L = [['bay', 'חנייה (3 מ׳)'], ['road', 'כביש (6.8 מ׳)'], ['car', 'רכב כתום (4.5 מ׳)']].map(([k, n]) => (got[k] ? '✓ ' : '○ ') + n + (got[k] ? ' — ' + F(got[k], 2) : '')).join(' · ');
    out.innerHTML = 'אתגר: ' + L + '. ' + (Object.keys(got).length === 3 ? badge(true, 'שלושתם.') + ' שים לב: לא השתמשת בגובה המצלמה, בזווית או ב־K — רק בארבע נקודות ידועות. ולמה דווקא "הצל" של הרכב ולא הגג שלו? מדוד את הגג וראה — סעיף 6.4.' : 'לחץ על נקודות <b>על הקרקע</b>: קצוות של פסי החנייה, הקווים הלבנים בשולי הכביש, הנקודות שבהן הגלגלים של הרכב הכתום נוגעים בכביש (קדימה ואחורה).'); }
  cI.addEventListener('click', e => { const [mx, my] = mouse(cI, e); if (pts.length >= 2) pts = []; pts.push([mx / s, my / s]); draw(); });
  draw();
};

/* ============================================================ 6.4 — what the homography does not know */
W.w3_head_ground = function (box) {
  V.say(box, 'אדם (1.8 מטר) עומד על הכביש. ההומוגרפיה של הקרקע הופכת <b>כל</b> פיקסל לנקודה על הקרקע — גם פיקסל של הראש. <b>בחר איזה חלק של האדם</b> המזהה מדווח, והזז את האדם: במבט מהצד תראה את הקרן מהמצלמה עוברת דרך הנקודה וממשיכה עד שהיא פוגשת את הקרקע — שם ההומוגרפיה "שמה" אותו.');
  let dist = 25, part = 2, camH = 6;
  const r1 = row(box); V.slider(r1, 'מרחק האדם (מ׳)', 8, 60, 0.5, dist, v => { dist = v; draw(); }); V.slider(r1, 'גובה המצלמה (מ׳)', 2, 30, 0.5, camH, v => { camH = v; draw(); });
  V.tabs(box, ['הרגליים (0 מ׳)', 'מרכז המלבן (0.9 מ׳)', 'הראש (1.5 מ׳)'], k => { part = k; draw(); }, part);
  const fx = flex(box); const cI = canvas(colm(fx, 'התמונה'), 384, 216, 384); const cS = canvas(colm(fx, 'מהצד'), 330, 216, 330); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  function draw() { const world = world3(); const P = [0.8, dist]; world.faces.objects.push(...box3(P[0] - 0.25, P[0] + 0.25, P[1] - 0.15, P[1] + 0.15, 0, 1.5, '#7048e8', 'person'), ...box3(P[0] - 0.14, P[0] + 0.14, P[1] - 0.12, P[1] + 0.12, 1.5, 1.8, '#f3d9c4', 'person'));
    const la = G.lookAt([0, 0, camH], [0, 20, 0]); const cam = { K: K3, R: la.R, t: la.t, W: W3, H: H3 }; const r = render3(cI.getContext('2d'), cam, world); const Hg = Hground(cam); const Hi = G.inv3(Hg);
    const z = [0, 0.9, 1.5][part]; const px = G.project(K3, cam.R, cam.t, [P[0], P[1], z]); const g = G.ap(Hi, px); const err = Math.hypot(g[0] - P[0], g[1] - P[1]);
    const x = cI.getContext('2d'); x.strokeStyle = '#e8590c'; x.lineWidth = 2; x.beginPath(); x.arc(px[0] * r.s, px[1] * r.s, 6, 0, 7); x.stroke();
    const S = cS.getContext('2d'); S.clearRect(0, 0, 330, 216); const maxY = Math.max(70, g[1] + 5); const sx = Y => 15 + Y / maxY * 305, sy = Z => 196 - Z * 6; S.fillStyle = '#a9d18e'; S.fillRect(0, sy(0), 330, 20); S.fillStyle = '#212529'; S.fillRect(sx(0) - 2, sy(camH), 4, sy(0) - sy(camH)); S.beginPath(); S.arc(sx(0), sy(camH), 5, 0, 7); S.fill();
    S.fillStyle = '#7048e8'; S.fillRect(sx(P[1]) - 2, sy(1.8), 5, sy(0) - sy(1.8)); S.strokeStyle = '#e8590c'; S.lineWidth = 2; S.setLineDash([5, 3]); S.beginPath(); S.moveTo(sx(0), sy(camH)); S.lineTo(sx(g[1]), sy(0)); S.stroke(); S.setLineDash([]);
    S.fillStyle = '#e8590c'; S.beginPath(); S.arc(sx(P[1]), sy(z), 4, 0, 7); S.fill(); S.beginPath(); S.arc(sx(g[1]), sy(0), 5, 0, 7); S.fill(); txt(S, 'ההומוגרפיה: ' + F(g[1], 1) + ' מ׳', Math.min(sx(g[1]) - 40, 230), sy(0) + 14, '#e8590c', 11); txt(S, 'אמת: ' + F(P[1], 1), sx(P[1]) - 20, sy(1.8) - 6, '#7048e8', 11);
    const fac = camH / (camH - z); tb.innerHTML = table(['נקודה', 'גובה', 'מיקום לפי H', 'שגיאה'], [[['הרגליים', 'מרכז המלבן', 'הראש'][part], F(z, 1) + ' מ׳', F(g[1], 2) + ' מ׳', '<b>' + F(err, 2) + ' מ׳</b>']]);
    out.innerHTML = part === 0 ? 'הרגליים נוגעות בקרקע — ההומוגרפיה מדויקת. זו הסיבה שבמעקב לוקחים את <b>אמצע הצלע התחתונה</b> של המלבן החוסם.' : 'הקרן מהמצלמה דרך נקודה בגובה ' + F(z, 1) + ' מטר פוגשת את הקרקע <i>מאחורי</i> האדם. המיקום מוכפל ב־' + ltr('h / (h − z) = ' + F(camH, 1) + ' / ' + F(camH - z, 1) + ' = ' + F(fac, 3)) + ' — שגיאה <b>יחסית למרחק</b>: ' + F(err, 2) + ' מטר כאן. ' + (part === 2 && Math.abs(dist - 25) < 0.3 && Math.abs(camH - 6) < 0.01 ? 'זו הדוגמה של הסעיף: 25 הופך ל־33.3. ' : '') + 'הגבה את המצלמה — היחס קטן, והשגיאה יורדת. מרחפן בגובה 60 מטר, מרכז המלבן של אדם "זז" רק כ־1.5%.'; }
  draw();
};

/* ============================================================ 6.5 — noise, number of points, outliers */
W.w3_H_noise = function (box) {
  V.say(box, 'הניסוי של הסעיף, חי: מצלמה בגובה 6, נקודות ייחוס על הקרקע מסומנות ברעש, ו־200 חזרות. <b>שנה את הרעש, מספר הנקודות והאזור שהן מכסות</b>, ובמפה תראה את הפיזור של ההערכות לכל נקודת בדיקה (15, 25, 35 ו־60 מטר). בלשונית השנייה: חמש התאמות שגויות מתוך 20, DLT מול RANSAC — ומלכודת היחידות של הסף.');
  const cam = cam6(6); const TEST = [[0, 15], [3, 25], [-4, 35], [2, 60]]; let sig = 1, nref = 4, far = 40, tab = 0, dir = 0;
  V.tabs(box, ['רעש ומספר נקודות', 'חריגות ו־RANSAC'], k => { tab = k; build(); draw(); });
  const ctl = el('div'); box.appendChild(ctl);
  const fx = flex(box); const cM = canvas(colm(fx, 'מלמעלה: נקודות ייחוס (כחול) והערכות (כתום)'), 260, 330, 260); const tb = el('div', { style: { minWidth: '320px' } }); fx.appendChild(tb); const out = V.say(box);
  const P = g => { const q = G.project(K3, cam.R, cam.t, [g[0], g[1], 0]); return [q[0], q[1]]; };
  function build() { ctl.innerHTML = ''; const r1 = row(ctl); if (tab === 0) { V.slider(r1, 'רעש (פיקסלים)', 0, 3, 0.1, sig, v => { sig = v; draw(); }); V.slider(r1, 'נקודות ייחוס', 4, 30, 1, nref, v => { nref = v; draw(); }); V.slider(r1, 'מכסות עד Y =', 20, 70, 1, far, v => { far = v; draw(); }); }
    else V.tabs(ctl, ['RANSAC מקרקע לתמונה (סף בפיקסלים)', '🐞 RANSAC מתמונה לקרקע (סף "3" במטרים)'], k => { dir = k; draw(); }, dir); }
  function refPts(n, r) { if (n === 4) return [[-5, 10], [5, 10], [5, far], [-5, far]]; const o = []; for (let i = 0; i < n; i++) o.push([-6 + 12 * r(), 10 + (far - 10) * r()]); return o; }
  function ransac(src, dst, th, r) { let best = null, bi = -1; for (let it = 0; it < 400; it++) { const idx = []; while (idx.length < 4) { const k = Math.floor(r() * src.length); if (!idx.includes(k)) idx.push(k); } const H = G.dlt(idx.map(i => src[i]), idx.map(i => dst[i])).H; if (!H.every(rw => rw.every(isFinite))) continue; const inl = src.map((p, i) => { const q = G.ap(H, p); return Math.hypot(q[0] - dst[i][0], q[1] - dst[i][1]) < th; }); const n = inl.filter(Boolean).length; if (n > bi) { bi = n; best = inl; } } const ii = best.map((b, i) => b ? i : -1).filter(i => i >= 0); return { H: G.dlt(ii.map(i => src[i]), ii.map(i => dst[i])).H, mask: best }; }
  function draw() { const m = groundMap(cM, -12, 12, 0, 70); const r = G.rng(7);
    if (tab === 0) { const errs = TEST.map(() => []); let refShow = null; for (let k = 0; k < 200; k++) { const ref = refPts(nref, r); if (!refShow) refShow = ref; const uv = ref.map(g => { const q = P(g); return [q[0] + sig * G.randn(r), q[1] + sig * G.randn(r)]; }); const H = G.dlt(uv, ref).H; TEST.forEach((g, i) => { const e = G.ap(H, P(g)); errs[i].push(e); }); }
      refShow.forEach(g => { const q = m.P(g[0], g[1]); m.x.fillStyle = '#1c7ed6'; m.x.beginPath(); m.x.arc(q[0], q[1], 3, 0, 7); m.x.fill(); }); const yf = m.P(0, far)[1]; m.x.strokeStyle = 'rgba(28,126,214,.6)'; m.x.setLineDash([4, 3]); m.x.beginPath(); m.x.moveTo(0, yf); m.x.lineTo(260, yf); m.x.stroke(); m.x.setLineDash([]);
      errs.forEach((list, i) => { list.forEach(e => { const q = m.P(e[0], e[1]); m.x.fillStyle = 'rgba(232,89,12,.35)'; m.x.fillRect(q[0] - 1, q[1] - 1, 2, 2); }); const q = m.P(TEST[i][0], TEST[i][1]); m.x.strokeStyle = '#212529'; m.x.lineWidth = 1.5; m.x.beginPath(); m.x.arc(q[0], q[1], 4, 0, 7); m.x.stroke(); });
      const mean = errs.map((list, i) => list.reduce((a, e) => a + Math.hypot(e[0] - TEST[i][0], e[1] - TEST[i][1]), 0) / list.length);
      tb.innerHTML = table(['נקודת בדיקה', 'שגיאה ממוצעת'], TEST.map((g, i) => [F(g[1], 0) + ' מ׳' + (g[1] > far ? ' (מחוץ לאזור)' : ''), '<b>' + F(mean[i], 3) + '</b> מ׳']));
      out.innerHTML = (Math.abs(sig - 1) < 0.05 && nref === 4 && far === 40 ? 'זו ההגדרה של הסעיף — והמספרים קרובים לטבלה שם (0.04, 0.08, 0.16, 0.44). ' : '') + 'שלושה דברים לראות: <b>הענן גדל עם המרחק</b> — ככל שהמבט שטוח, פיקסל מכסה יותר קרקע, והוא נמתח לאורך כיוון המבט. <b>יותר נקודות מכווצות את הענן</b> בתוך האזור שהן מכסות. ו<b>מחוץ לאזור</b> (מעל הקו המקווקו) זו הסקה, ושם הענן נשאר גדול — פזר נקודות על כל האזור שבו תמדוד.'; return; }
    /* outliers */
    const g20 = []; for (let i = 0; i < 20; i++) g20.push([-6 + 12 * r(), 10 + 30 * r()]); const uv = g20.map(P); const bad = uv.map((p, i) => i < 5 ? [p[0] + (r() * 160 - 80), p[1] + (r() * 160 - 80)] : p.slice());
    const Hd = G.dlt(bad, g20).H; let Hr, mask; if (dir === 0) { const rr = ransac(g20, bad, 3.0, G.rng(4)); Hr = G.inv3(rr.H); mask = rr.mask; } else { const rr = ransac(bad, g20, 3.0, G.rng(4)); Hr = rr.H; mask = rr.mask; }
    g20.forEach((g, i) => { const q = m.P(g[0], g[1]); m.x.fillStyle = i < 5 ? '#c92a2a' : '#1c7ed6'; m.x.beginPath(); m.x.arc(q[0], q[1], 3.5, 0, 7); m.x.fill(); if (!mask[i]) { m.x.strokeStyle = '#212529'; m.x.lineWidth = 1.5; m.x.beginPath(); m.x.arc(q[0], q[1], 6.5, 0, 7); m.x.stroke(); } });
    const eD = TEST.map(g => { const e = G.ap(Hd, P(g)); return Math.hypot(e[0] - g[0], e[1] - g[1]); }), eR = TEST.map(g => { const e = G.ap(Hr, P(g)); return Math.hypot(e[0] - g[0], e[1] - g[1]); });
    TEST.forEach((g, i) => { const e = G.ap(Hd, P(g)); const q = m.P(e[0], e[1]); m.x.fillStyle = '#e8590c'; m.x.fillRect(q[0] - 3, q[1] - 3, 6, 6); const q2 = m.P(g[0], g[1]); m.x.strokeStyle = '#212529'; m.x.beginPath(); m.x.arc(q2[0], q2[1], 4, 0, 7); m.x.stroke(); });
    const caught = mask.slice(0, 5).filter(b => !b).length, falseOut = mask.slice(5).filter(b => !b).length;
    tb.innerHTML = table(['נקודת בדיקה', 'DLT על כולן', 'RANSAC'], TEST.map((g, i) => [F(g[1], 0) + ' מ׳', F(eD[i], 2), '<b>' + F(eR[i], 2) + '</b>'])) + '<div class="note-small" style="text-align:center">mask: ' + ltr('[' + mask.map(b => b ? 1 : 0).join(' ') + ']') + '</div>';
    out.innerHTML = 'אדום — חמש ההתאמות השגויות; עיגול שחור — מה ש־RANSAC סימן כחריגה (0 במסכה); ריבועים כתומים — איפה DLT על כל ה־20 שם את נקודות הבדיקה. DLT מנסה לרצות את כולן, והחריגות מושכות את הפתרון: ' + F(eD[3], 1) + ' מטר ב־60. ' + (dir === 0 ? 'RANSAC מקרקע לתמונה, עם סף של 3 <b>פיקסלים</b>, תפס ' + caught + ' מתוך 5 — והשגיאה כמעט אפס.' : '<b>הבאג:</b> RANSAC מתמונה לקרקע, והסף 3.0 נמדד ביחידות של <i>היעד</i> — מטרים. 3 מטר זה סף עצום: הוא תפס רק ' + caught + ' מתוך 5 חריגות, והשאר "תקינות". זה מה שקרה בבניית הסעיף. הפתרון: להעריך מקרקע לתמונה (סף בפיקסלים) ולהפוך.') + (falseOut ? ' (וגם ' + falseOut + ' תקינות נזרקו.)' : ''); }
  build(); draw();
};

/* ============================================================ 6.6 — when is a homography enough? */
W.w3_parallax = function (box) {
  V.say(box, 'שתי תמונות: הראשונה, ואחריה המצלמה <b>מסתובבת</b> או <b>זזה</b>. מתאימים הומוגרפיה אחת לנקודות של הקרקע, ומפעילים אותה על <i>כל</i> הנקודות — גם ראשי עצים, גגות בניינים וגגות רכבים. החיצים: כמה כל נקודה בתמונה השנייה רחוקה ממה שההומוגרפיה ניבאה. <b>הזז את המחוונים</b> ומצא מתי ההומוגרפיה מסבירה הכל.');
  const world = world3(); let rot = 8, move = 0;
  const r1 = row(box); V.slider(r1, 'סיבוב (°)', -20, 20, 0.5, rot, v => { rot = v; draw(); }); V.slider(r1, 'תזוזה הצידה (מ׳)', 0, 6, 0.1, move, v => { move = v; draw(); });
  const fx = flex(box); const cv = canvas(colm(fx, 'התמונה השנייה; החיצים: מה שההומוגרפיה של הקרקע לא מסבירה (מוגדלים פי 2)'), 560, 315, 560); const out = V.say(box);
  const C1 = [0, -5, 4], T1 = [0, 40, 0]; const ground = [], high = []; const r = G.rng(12); for (let i = 0; i < 40; i++) ground.push([-14 + 28 * r(), 8 + 60 * r(), 0]);
  [[-8, 8, 4.4], [-9, 30, 4.4], [-7.5, 70, 4.4], [7.5, 75, 4.4], [9, 12, 4.4], [-14, 40, 9], [-14, 56, 9], [-16, 90, 14], [30, 70, 7], [1.75, 10, 1.45], [-1.75, 24, 1.45], [1.75, 38, 1.45], [-4.35, 18, 2.4]].forEach(p => high.push(p));
  function draw() { const la1 = G.lookAt(C1, T1); const a = G.rad(rot); const C2 = [C1[0] + move, C1[1], C1[2]]; const fwd = G.sub(T1, C1); const T2 = G.add(C2, [fwd[0] * Math.cos(a) - fwd[1] * Math.sin(a), fwd[0] * Math.sin(a) + fwd[1] * Math.cos(a), fwd[2]]); const la2 = G.lookAt(C2, T2);
    const c2 = { K: K3, R: la2.R, t: la2.t, W: W3, H: H3 }; const x = cv.getContext('2d'); const rr = render3(x, c2, world); const s = rr.s;
    const p1 = q => G.project(K3, la1.R, la1.t, q), p2 = q => G.project(K3, la2.R, la2.t, q); const gp = ground.filter(q => p1(q) && p2(q)); const H = G.dlt(gp.map(q => p1(q).slice(0, 2)), gp.map(q => p2(q).slice(0, 2))).H;
    let maxG = 0, maxH = 0; const drawArr = (q, col) => { const a1 = p1(q), b2 = p2(q); if (!a1 || !b2) return 0; const pred = G.ap(H, [a1[0], a1[1]]); const d = Math.hypot(pred[0] - b2[0], pred[1] - b2[1]); if (b2[0] < 0 || b2[0] > W3 || b2[1] < 0 || b2[1] > H3) return 0; x.strokeStyle = col; x.fillStyle = col; x.lineWidth = 2; x.beginPath(); x.arc(b2[0] * s, b2[1] * s, 3, 0, 7); x.fill(); x.beginPath(); x.moveTo(b2[0] * s, b2[1] * s); x.lineTo((b2[0] + 2 * (pred[0] - b2[0])) * s, (b2[1] + 2 * (pred[1] - b2[1])) * s); x.stroke(); return d; };
    gp.forEach(q => { maxG = Math.max(maxG, drawArr(q, '#2f9e44')); }); high.forEach(q => { maxH = Math.max(maxH, drawArr(q, '#c92a2a')); });
    out.innerHTML = 'ירוק — נקודות על הקרקע (מהן הותאמה H): השגיאה הגדולה ' + F(maxG, 2) + ' פיקסלים. אדום — נקודות <i>מעל</i> הקרקע: עד <b>' + F(maxH, 1) + ' פיקסלים</b>. ' + (move < 0.05 ? 'כשהמצלמה רק מסתובבת סביב עצמה, ' + ltr('H = K·R·K⁻¹') + ' מסבירה <b>הכל</b> — כל נקודה, בכל עומק, כי סיבוב לא משנה את הכיוונים היחסיים בין נקודות. זה המקרה של פנורמה מחצובה.' : 'ברגע שהמצלמה <b>זזה</b>, עצמים קרובים וגבוהים זזים בתמונה אחרת מהקרקע שמתחתם — פרלקסה. הומוגרפיה אחת מסבירה מישור אחד בלבד; שאר הסצנה צריכה את הגאומטריה של שתי מצלמות (פרק 8). ' + (move < 0.6 ? 'כשהתזוזה קטנה לעומת המרחק לסצנה, השגיאה קטנה — זה מה שאפשר את הייצוב במודול 1.' : '')); }
  draw();
};

/* ============================================================ chapter 7 — PnP and markers */
const orthoR = R => { for (let k = 0; k < 30; k++) { const Ri = G.T(G.inv3(R)); R = R.map((r, i) => r.map((x, j) => (x + Ri[i][j]) / 2)); } return R; };
/* PnP like solvePnP: a closed-form first guess (DLT on P = K[R|t], or the plane homography when every point has Z = 0), then Levenberg–Marquardt on the reprojection error */
function pnp(K, P3, uv) { let R0, t0; const planar = P3.every(p => Math.abs(p[2]) < 1e-9);
  if (planar) { const H = G.dlt(P3.map(p => [p[0], p[1]]), uv).H; const ps = G.planarPose(K, H); R0 = ps.R; t0 = ps.t; }
  else { const A = []; P3.forEach((P, i) => { const [u, v] = uv[i]; const X = [P[0], P[1], P[2], 1]; A.push(X.map(x => -x).concat([0, 0, 0, 0], X.map(x => u * x))); A.push([0, 0, 0, 0].concat(X.map(x => -x), X.map(x => v * x))); });
    const p = G.nullvec(A).v; let M = G.mm(G.inv3(K), [p.slice(0, 4), p.slice(4, 8), p.slice(8, 12)]); let Rm = M.map(r => r.slice(0, 3)); let tm = M.map(r => r[3]); const sc = Math.cbrt(G.det3(Rm)); Rm = Rm.map(r => r.map(x => x / sc)); tm = tm.map(x => x / sc); R0 = orthoR(Rm); t0 = tm; }
  return G.refinePose(K, P3, uv, R0, t0, 25); }
const camC = (R, t) => G.mul(G.mv(G.T(R), t), -1);

/* ============================================================ 7.1 — the problem: where is the camera? */
W.w3_pnp = function (box) {
  V.say(box, 'נקודות שהמיקום שלהן בעולם ידוע — פינות של בניין, ראש של שלט, פינות החניון — והמיקום שלהן בתמונה, עם רעש של זיהוי. K ידועה. <b>איפה המצלמה?</b> <b>גרור את המצלמה במפה</b> (העיגול השחור): התמונה מתעדכנת, ו־PnP — ניחוש סגור ואחריו מזעור, כמו <code class="ltr">solvePnP</code> — מחפש אותה מחדש. <b>לחץ "100 ניסויים"</b> כדי לראות את הפיזור של התשובות, ו<b>החלף סט נקודות</b>.');
  const world = world3(); let C = [8, -12, 3], tab = 0, sig = 0.5, cloud = null, drag = false;
  const SETS = [{ name: 'שש נקודות כלליות', pts: [[-14, 40, 0], [-14, 40, 9], [-14, 56, 9], [-4.35, 18.05, 2.4], [8, 30, 0], [26, 60, 0]] },
    { name: 'ארבע על הקרקע (מישור)', pts: [[8, 30, 0], [26, 30, 0], [26, 60, 0], [8, 60, 0]] },
    { name: 'שש צפופות, רחוקות', pts: [[30, 70, 0], [30, 70, 7], [44, 70, 7], [30, 84, 7], [44, 70, 0], [30, 84, 0]] }];
  const T0 = [4, 35, 2];
  V.tabs(box, SETS.map(s => s.name), k => { tab = k; cloud = null; draw(); });
  const r1 = row(box); V.slider(r1, 'רעש בזיהוי (פיקסלים)', 0, 3, 0.1, sig, v => { sig = v; cloud = null; draw(); }); V.btns(box, [['🎲 100 ניסויים', () => { trials(); }, 'primary']]);
  const fx = flex(box); const cI = canvas(colm(fx, 'מה שהמצלמה רואה'), 384, 216, 384); const cM = canvas(colm(fx, 'מפה — גרור את המצלמה'), 220, 260, 220); const code = mono(box); const out = V.say(box);
  const X0 = -30, X1 = 50, Y0 = -30, Y1 = 90; const mp = (X, Y) => [(X - X0) / (X1 - X0) * 220, 260 - (Y - Y0) / (Y1 - Y0) * 260];
  const camOf = () => { const la = G.lookAt(C, T0); return { K: K3, R: la.R, t: la.t, W: W3, H: H3 }; };
  function trials() { const cam = camOf(); const P3 = SETS[tab].pts; const r = G.rng(17); cloud = []; for (let k = 0; k < 100; k++) { const uv = P3.map(P => { const q = G.project(K3, cam.R, cam.t, P); return [q[0] + sig * G.randn(r), q[1] + sig * G.randn(r)]; }); try { const e = pnp(K3, P3, uv); cloud.push(camC(e.R, e.t)); } catch (err) {} } draw(); }
  function draw() { const cam = camOf(); const x = cI.getContext('2d'); const rr = render3(x, cam, world); const P3 = SETS[tab].pts; const r = G.rng(5);
    const uv = P3.map(P => { const q = G.project(K3, cam.R, cam.t, P); return q ? [q[0] + sig * G.randn(r), q[1] + sig * G.randn(r)] : null; }); const vis = uv.every(q => q && q[0] >= 0 && q[0] <= W3 && q[1] >= 0 && q[1] <= H3);
    uv.forEach(q => { if (!q) return; x.fillStyle = '#e8590c'; x.strokeStyle = '#fff'; x.lineWidth = 1.5; x.beginPath(); x.arc(q[0] * rr.s, q[1] * rr.s, 5, 0, 7); x.fill(); x.stroke(); });
    const m = cM.getContext('2d'); m.fillStyle = '#a9d18e'; m.fillRect(0, 0, 220, 260); const rd = [mp(-3.5, Y1), mp(3.5, Y0)]; m.fillStyle = '#6c7177'; m.fillRect(rd[0][0], rd[0][1], rd[1][0] - rd[0][0], rd[1][1] - rd[0][1]);
    [[-28, -14, 40, 56], [-30, -16, 90, 110], [30, 44, 70, 84], [8, 26, 30, 60]].forEach(([a, b, c, d], i) => { const p = mp(a, d), q = mp(b, c); m.fillStyle = i === 3 ? '#adb5bd' : '#dee2e6'; m.fillRect(p[0], p[1], q[0] - p[0], q[1] - p[1]); });
    P3.forEach(P => { const q = mp(P[0], P[1]); m.fillStyle = '#e8590c'; m.beginPath(); m.arc(q[0], q[1], 3.5, 0, 7); m.fill(); });
    let est = null; if (vis) try { est = pnp(K3, P3, uv); } catch (e) {}
    if (cloud) cloud.forEach(c => { const q = mp(c[0], c[1]); m.fillStyle = 'rgba(28,126,214,.35)'; m.fillRect(q[0] - 1.5, q[1] - 1.5, 3, 3); });
    const cq = mp(C[0], C[1]); m.fillStyle = '#212529'; m.beginPath(); m.arc(cq[0], cq[1], 6, 0, 7); m.fill(); const tq = mp(T0[0], T0[1]); m.strokeStyle = '#212529'; m.setLineDash([3, 3]); m.beginPath(); m.moveTo(cq[0], cq[1]); m.lineTo(tq[0], tq[1]); m.stroke(); m.setLineDash([]);
    let errTxt = ''; if (est) { const Ce = camC(est.R, est.t); const q = mp(Ce[0], Ce[1]); m.strokeStyle = '#1c7ed6'; m.lineWidth = 2; m.beginPath(); m.arc(q[0], q[1], 9, 0, 7); m.stroke(); m.lineWidth = 1; const e = G.norm(G.sub(Ce, C));
      code.textContent = 'ok, rvec, tvec = cv2.solvePnP(Pw, uv_noisy, K, None)\nR_est, _ = cv2.Rodrigues(rvec)\nC_est = -R_est.T @ tvec.ravel()      # = [' + Ce.map(v => F(v, 3)).join(', ') + ']\n# truth C = [' + C.map(v => F(v, 2)).join(', ') + ']   error ' + F(e * 100, 1) + ' cm    (tvec = [' + est.t.map(v => F(v, 2)).join(', ') + '] — not the camera!)';
      errTxt = 'שגיאה בהרצה הזו: <b>' + F(e * 100, 1) + ' ס״מ</b>, במרחק של ' + F(G.norm(G.sub(C, P3[0])), 0) + ' מטר מהנקודות. '; } else code.textContent = '# not all the points are in the image — move the camera';
    let cl = ''; if (cloud && cloud.length) { const errs = cloud.map(c => G.norm(G.sub(c, C))); const med = G.median(errs); const wild = errs.filter(e => e > 2).length; cl = 'על 100 ניסויים (ענן כחול במפה): שגיאה חציונית <b>' + F(med * 100, 1) + ' ס״מ</b>' + (wild ? ', ו־<b>' + wild + '</b> ניסויים שבהם הפתרון ברח ביותר משני מטרים' : '') + '. '; }
    out.innerHTML = (vis ? errTxt + cl : badge(false, 'חלק מהנקודות מחוץ לתמונה.') + ' ') + [
      'שש נקודות שלא על מישור אחד, פרוסות על כל התמונה — הפתרון יציב: שגיאה של סנטימטרים בודדים בעשרות מטרים. שש דרגות חופש, שתי משוואות לנקודה: 12 משוואות ל־6 נעלמים.',
      'ארבע נקודות על מישור הקרקע — המינימום המעשי (תרגיל 7.1). הפתרון עובד, אבל רגיש יותר לרעש: הענן גדול יותר, ונמתח בעיקר <i>לאורך כיוון המבט</i> — קשה להבדיל בין "קרוב יותר" ל"מוטה יותר".',
      'שש נקודות על בניין אחד רחוק — קרובות זו לזו בתמונה. האזהרה של שאלת הראיון: כל הנקודות רואות את המצלמה כמעט מאותה זווית, וההבדל בין "קצת סיבוב" ל"קצת תזוזה" הוא שבר פיקסל. הענן ענק. בשביל PnP טוב צריך נקודות <b>מפוזרות</b> בתמונה, ולא רק הרבה נקודות.'][tab]; }
  const at = e => { const [mx, my] = mouse(cM, e); return [mx / 220 * (X1 - X0) + X0, (260 - my) / 260 * (Y1 - Y0) + Y0]; };
  cM.addEventListener('mousedown', e => { drag = true; const p = at(e); C = [p[0], Math.min(p[1], 20), C[2]]; cloud = null; draw(); }); cM.addEventListener('mousemove', e => { if (!drag) return; const p = at(e); C = [clamp(p[0], -28, 48), clamp(p[1], -28, 20), C[2]]; cloud = null; draw(); }); window.addEventListener('mouseup', () => { drag = false; });
  draw();
};

/* ============================================================ 7.2 — fiducial markers */
const MARK_BITS = [[1, 0, 1, 1], [0, 1, 0, 0], [0, 0, 1, 1], [1, 0, 0, 1]];   /* an example 4 × 4 code (not the real id 7 of DICT_4X4_50) */
function drawMarker(x, cam, s, sz) { /* marker of side sz (black square) centred at the origin, on Z = 0; 6 × 6 cells: black border + 4 × 4 code; white margin */
  const pr = (X, Y) => { const q = G.project(cam.K, cam.R, cam.t, [X, Y, 0]); return q ? [q[0] * s, q[1] * s] : null; }; const c = sz / 6;
  const quad = (x0, y0, x1, y1, col) => { const ps = [pr(x0, y0), pr(x1, y0), pr(x1, y1), pr(x0, y1)]; if (ps.some(p => !p)) return; x.fillStyle = col; x.beginPath(); ps.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fill(); };
  quad(-sz * 0.7, -sz * 0.7, sz * 0.7, sz * 0.7, '#fff'); quad(-sz / 2, -sz / 2, sz / 2, sz / 2, '#111');
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) if (MARK_BITS[j][i]) quad(-sz / 2 + (i + 1) * c, sz / 2 - (j + 2) * c, -sz / 2 + (i + 2) * c + 0.0004, sz / 2 - (j + 1) * c + 0.0004, '#fff'); }
W.w3_marker = function (box) {
  V.say(box, 'סמן ייחוס מודפס על הקרקע, והמצלמה מסתכלת עליו. הגלאי מוצא את ארבע הפינות — בסדר קבוע של הסמן עצמו, בזכות הדוגמה האסימטרית — עם רעש של שבר פיקסל, ו־PnP נותן את מיקום המצלמה. <b>הזז את המרחק ואת גודל הסמן</b>, ו<b>הרץ 100 ניסויים</b>: הטבלה בונה את הניסוי של הסעיף. בלשונית השנייה — מה קורה כשסדר הפינות שגוי.');
  let dist = 1, size = 0.15, sig = 0.15, ang = 35, tab = 0; const rows = {};
  V.tabs(box, ['מרחק וגודל', '🐞 סדר פינות שגוי'], k => { tab = k; draw(); });
  const r1 = row(box); V.slider(r1, 'מרחק (מ׳)', 0.4, 25, 0.1, dist, v => { dist = v; draw(); }); V.slider(r1, 'צלע הסמן (מ׳)', 0.05, 1.5, 0.01, size, v => { size = v; draw(); }); const r2 = row(box); V.slider(r2, 'זווית הסתכלות מהאנך (°)', 0, 70, 1, ang, v => { ang = v; draw(); }); V.slider(r2, 'רעש בפינות (פיקסלים)', 0, 1, 0.05, sig, v => { sig = v; draw(); });
  V.btns(box, [['🎲 100 ניסויים — הוסף לטבלה', () => { run(); }, 'primary'], ['נקה טבלה', () => { for (const k in rows) delete rows[k]; draw(); }]]);
  const fx = flex(box); const cI = canvas(colm(fx, 'התמונה (1280 × 720)'), 384, 216, 384); const cZ = canvas(colm(fx, 'זום על הסמן'), 150, 150, 150); const cM = canvas(colm(fx, 'מלמעלה: אמת ומשוער'), 180, 216, 180); const tb = el('div'); box.appendChild(tb); const code = mono(box); const out = V.say(box);
  const cam = () => { const a = G.rad(ang); const C = [0.3 * Math.sin(a) * dist / Math.max(1e-6, Math.sin(a)) * 0 + dist * Math.sin(a) * 0.35, -dist * Math.sin(a) * 0.94, dist * Math.cos(a)]; const la = G.lookAt(C, [0, 0, 0]); return { K: K3, R: la.R, t: la.t, W: W3, H: H3, C }; };
  const obj = () => { const h = size / 2; return [[-h, h, 0], [h, h, 0], [h, -h, 0], [-h, -h, 0]]; };
  function solve(c, r, wrong) { const O = obj(); const uv = O.map(P => { const q = G.project(K3, c.R, c.t, P); return [q[0] + sig * G.randn(r), q[1] + sig * G.randn(r)]; }); const Ou = wrong ? O.slice(1).concat([O[0]]) : O; const e = pnp(K3, Ou, uv); return { C: camC(e.R, e.t), uv, e }; }
  function run() { const c = cam(); const r = G.rng(23); let s = 0, n = 0; for (let k = 0; k < 100; k++) { try { const o = solve(c, r, false); s += G.norm(G.sub(o.C, c.C)); n++; } catch (e) {} } const q1 = G.project(K3, c.R, c.t, obj()[0]), q2 = G.project(K3, c.R, c.t, obj()[1]); rows[F(dist, 1) + '|' + F(size, 2) + '|' + ang] = [F(dist, 1) + ' מ׳', F(size * 100, 0) + ' ס״מ', ang + '°', F(Math.hypot(q1[0] - q2[0], q1[1] - q2[1]), 0), '<b>' + F(s / n * 100, 2) + ' ס״מ</b>']; draw(); }
  function draw() { const c = cam(); const x = cI.getContext('2d'); x.fillStyle = '#9a9a9a'; x.fillRect(0, 0, 384, 216); const s = 384 / W3; drawMarker(x, c, s, size);
    const r = G.rng(3); let o = null; try { o = solve(c, r, tab === 1); } catch (e) {}
    
    { const ctr = G.project(K3, c.R, c.t, [0, 0, 0]); const q1 = G.project(K3, c.R, c.t, obj()[0]), q3 = G.project(K3, c.R, c.t, obj()[2]); const w = Math.max(4, Math.hypot(q1[0] - q3[0], q1[1] - q3[1])); const z = 110 / w; const Kz = [[K3[0][0] * z, 0, z * (K3[0][2] - ctr[0]) + 75], [0, K3[1][1] * z, z * (K3[1][2] - ctr[1]) + 75], [0, 0, 1]]; const xz = cZ.getContext('2d'); xz.fillStyle = '#9a9a9a'; xz.fillRect(0, 0, 150, 150); drawMarker(xz, { K: Kz, R: c.R, t: c.t }, 1, size); if (o) o.uv.forEach((q, i) => { xz.fillStyle = ['#e03131', '#2f9e44', '#1c7ed6', '#f08c00'][i]; xz.beginPath(); xz.arc(z * (q[0] - ctr[0]) + 75, z * (q[1] - ctr[1]) + 75, 4, 0, 7); xz.fill(); txt(xz, String(i), z * (q[0] - ctr[0]) + 80, z * (q[1] - ctr[1]) + 71, '#212529', 11); }); }
    const m = cM.getContext('2d'); m.fillStyle = '#f1f3f5'; m.fillRect(0, 0, 180, 216); const sc = 70 / Math.max(0.5, Math.hypot(c.C[0], c.C[1])); const P = (X, Y) => [90 + X * sc, 120 - Y * sc]; const mk = [P(-size / 2, size / 2), P(size / 2, -size / 2)]; m.fillStyle = '#111'; m.fillRect(mk[0][0], mk[0][1], Math.max(2, mk[1][0] - mk[0][0]), Math.max(2, mk[1][1] - mk[0][1]));
    const cp = P(c.C[0], c.C[1]); m.fillStyle = '#212529'; m.beginPath(); m.arc(cp[0], cp[1], 6, 0, 7); m.fill(); txt(m, 'אמת', cp[0] + 8, cp[1] + 4, '#212529', 11);
    if (o) { const ep = P(o.C[0], o.C[1]); m.strokeStyle = tab ? '#c92a2a' : '#1c7ed6'; m.lineWidth = 2; m.beginPath(); m.arc(ep[0], ep[1], 9, 0, 7); m.stroke(); m.lineWidth = 1; txt(m, 'משוער', ep[0] + 11, ep[1] + 4, tab ? '#c92a2a' : '#1c7ed6', 11); }
    const keys = Object.keys(rows); tb.innerHTML = keys.length ? table(['מרחק', 'סמן', 'זווית', 'רוחב בתמונה (פיקסלים)', 'שגיאת מיקום ממוצעת'], keys.map(k => rows[k])) : '';
    const q1 = G.project(K3, c.R, c.t, obj()[0]), q2 = G.project(K3, c.R, c.t, obj()[1]); const wpx = Math.hypot(q1[0] - q2[0], q1[1] - q2[1]);
    code.textContent = 'corners, ids, _ = detector.detectMarkers(img)\nobj = np.array([[-s/2, s/2, 0], [s/2, s/2, 0], [s/2, -s/2, 0], [-s/2, -s/2, 0]], np.float32)' + (tab ? '\nobj = np.roll(obj, -1, axis=0)        # BUG: the order starts from the second corner' : '') + '\nok, rv, tv = cv2.solvePnP(obj, corners[0].reshape(-1, 2), K, None, flags=cv2.SOLVEPNP_IPPE_SQUARE)\n# estimated C = [' + (o ? o.C.map(v => F(v, 3)).join(', ') : '?') + ']   truth [' + c.C.map(v => F(v, 3)).join(', ') + ']';
    if (tab === 1) { const err = o ? G.norm(G.sub(o.C, c.C)) : NaN; let rep = 0; if (o) { const Ou = obj().slice(1).concat([obj()[0]]); Ou.forEach((P, i) => { const q = G.project(K3, o.e.R, o.e.t, P); rep = Math.max(rep, Math.hypot(q[0] - o.uv[i][0], q[1] - o.uv[i][1])); }); }
      out.innerHTML = '<b>הבאג של תרגיל 7.2:</b> אותן ארבע פינות, אבל הנקודות בעולם מתחילות מהפינה השנייה. PnP מוצא בשמחה פתרון — מצלמה <b>מסובבת ברבע סיבוב</b> סביב הסמן, באותו גובה ובאותו מרחק (העיגול האדום). שגיאה של ' + F(err * 100, 0) + ' ס״מ, בלי שום הודעה. ושגיאת ההטלה החוזרת? <b>' + F(rep, 2) + ' פיקסל</b> — כמו הרעש. <span class="note-small">(הערה של האתר: ריבוע מסובב ברבע סיבוב הוא <i>אותו ריבוע</i>, ולכן כאן שגיאת ההטלה לא חושפת את הטעות — בניגוד למה שכתוב בפתרון של התרגיל, שבדק פותר אחר. מה שמגן באמת הוא הדוגמה שבתוך הסמן: הגלאי קורא אותה ומחזיר את הפינות בסדר של הסמן עצמו. מה שנשאר עליך — ש־obj יהיה באותו סדר בדיוק.)</span>'; return; }
    out.innerHTML = 'הסמן ברוחב <b>' + F(wpx, 0) + ' פיקסלים</b> בתמונה. ' + (wpx < 25 ? 'קטן מאוד — הגלאי האמיתי כבר עלול לא למצוא אותו. ' : '') + 'הרץ ניסויים בכמה מרחקים: השגיאה גדלה <i>מהר יותר</i> מהמרחק. סמן קטן בתמונה נראה כמעט אותו דבר מזוויות שונות, וההבדל בין "קצת מסובב" ל"קצת מוזז" הוא שבר פיקסל. נסה סמן של מטר במרחק 20: אותו רוחב בתמונה כמו 15 ס״מ ב־3 מטר — ואותה שגיאה <i>יחסית</i>. ' + (keys.length ? '(המספרים בטבלה הם ממוצע על 100 ניסויים עם רעש של ' + F(sig, 2) + ' פיקסל, ולכן שונים מעט מהטבלה של הסעיף, שבה הרעש בא מהגלאי האמיתי.)' : ''); }
  draw();
};

/* ============================================================ chapter 8 — two-view geometry */
const P8 = (() => { const r = G.rng(41), o = []; for (let i = 0; i < 60; i++) o.push([-4 + 8 * r(), -2 + 8 * r(), 3 * r()]); return o; })();   /* 60 points in a volume, like the code of 8.3 */
const cams8 = (C2) => { const a = G.lookAt([-1, -10, 2], [0, 1, 1]), b = G.lookAt(C2 || [1.5, -9.5, 2.2], [0, 1, 1]); return [{ K: K3, R: a.R, t: a.t, W: W3, H: H3 }, { K: K3, R: b.R, t: b.t, W: W3, H: H3 }]; };
/* relative motion 1 → 2 and the fundamental matrix F = K⁻ᵀ [t]× R K⁻¹ */
const rel = (c1, c2) => { const R = G.mm(c2.R, G.T(c1.R)); const t = G.sub(c2.t, G.mv(R, c1.t)); return { R, t }; };
const Fof = (c1, c2) => { const { R, t } = rel(c1, c2); const E = G.mm(G.skew(t), R); const Ki = G.inv3(K3); return { E, F: G.mm(G.T(Ki), G.mm(E, Ki)) }; };
const lineOf = (F, u) => G.mv(F, [u[0], u[1], 1]);   /* a·u + b·v + c = 0 in image 2 */
function drawLine(x, l, s, col, w) { const [a, b, c] = l; const pts = []; [[0, null], [W3, null], [null, 0], [null, H3]].forEach(([u, v]) => { if (u !== null && Math.abs(b) > 1e-12) { const vv = -(a * u + c) / b; if (vv >= -1 && vv <= H3 + 1) pts.push([u, vv]); } if (v !== null && Math.abs(a) > 1e-12) { const uu = -(b * v + c) / a; if (uu >= -1 && uu <= W3 + 1) pts.push([uu, v]); } }); if (pts.length < 2) return; x.strokeStyle = col; x.lineWidth = w || 2; x.beginPath(); x.moveTo(pts[0][0] * s, pts[0][1] * s); x.lineTo(pts[1][0] * s, pts[1][1] * s); x.stroke(); }
const epiDist = (F, a, b) => { const l = lineOf(F, a); return Math.abs(l[0] * b[0] + l[1] * b[1] + l[2]) / Math.hypot(l[0], l[1]); };
/* first point hit by the ray of pixel uv of camera cam (marching through the world boxes and the ground) */
function rayHit(world, cam, uv) { const C = camC(cam.R, cam.t); const d = G.unit(G.mv(G.T(cam.R), G.mv(G.inv3(cam.K), [uv[0], uv[1], 1]))); for (let s = 0.3; s < 260; s += 0.05) { const P = G.add(C, G.mul(d, s)); if (P[2] <= 0) return P; for (const f of world.faces.objects) { const xs = f.pts.map(p => p[0]), ys = f.pts.map(p => p[1]), zs = f.pts.map(p => p[2]); if (P[0] >= Math.min(...xs) && P[0] <= Math.max(...xs) && P[1] >= Math.min(...ys) && P[1] <= Math.max(...ys) && P[2] >= Math.min(...zs) && P[2] <= Math.max(...zs)) return P; } } return null; }

/* ============================================================ 8.1 — the epipolar line */
W.w3_epipolar = function (box) {
  V.say(box, 'שתי מצלמות רואות את אותו כביש. <b>לחץ על נקודה בתמונה השמאלית</b> (מצלמה 1): בתמונה הימנית מופיע הקו שעליו הנקודה חייבת להיות — ההטלה של כל הקרן. הנקודות הקטנות על הקו הן אותה קרן בעומקים 3, 5, 10, 20 ו־60 מטר; העיגול הירוק הוא המקום האמיתי. <b>שנה את התנועה</b> של מצלמה 2 — הצידה או קדימה — וראה מה קורה לקווים.');
  const world = world3(); let move = 0, picks = [[760, 470], [400, 300], [1100, 560]];
  V.tabs(box, ['מצלמה 2 זזה הצידה', 'מצלמה 2 נוסעת קדימה'], k => { move = k; draw(); });
  const fx = flex(box); const c1 = canvas(colm(fx, 'מצלמה 1 — לחץ'), 360, 203, 360); const c2 = canvas(colm(fx, 'מצלמה 2 — הקווים האפיפולריים'), 360, 203, 360); const code = mono(box); const out = V.say(box);
  const COLS = ['#e8590c', '#1c7ed6', '#7048e8'];
  function cams() { const a = G.lookAt([0, -6, 2], [0, 30, 1]); const b = move === 0 ? G.lookAt([2.5, -6, 2], [2.5, 30, 1]) : G.lookAt([0, 2, 2], [0, 38, 1]); return [{ K: K3, R: a.R, t: a.t, W: W3, H: H3 }, { K: K3, R: b.R, t: b.t, W: W3, H: H3 }]; }
  function draw() { const [ca, cb] = cams(); const x1 = c1.getContext('2d'), x2 = c2.getContext('2d'); const r1 = render3(x1, ca, world), r2 = render3(x2, cb, world); const s = r1.s; const { F } = Fof(ca, cb);
    const C1 = camC(ca.R, ca.t), ep = G.project(K3, cb.R, cb.t, C1); let txtE = '';
    picks.forEach((u, i) => { x1.fillStyle = COLS[i]; x1.strokeStyle = '#fff'; x1.lineWidth = 2; x1.beginPath(); x1.arc(u[0] * s, u[1] * s, 6, 0, 7); x1.fill(); x1.stroke();
      const l = lineOf(F, u); drawLine(x2, l, s, COLS[i], 2); const d = G.unit(G.mv(G.T(ca.R), G.mv(G.inv3(K3), [u[0], u[1], 1])));
      [3, 5, 10, 20, 60].forEach(z => { const P = G.add(C1, G.mul(d, z)); const q = G.project(K3, cb.R, cb.t, P); if (!q) return; x2.fillStyle = COLS[i]; x2.beginPath(); x2.arc(q[0] * s, q[1] * s, 2.5, 0, 7); x2.fill(); });
      const hit = rayHit(world, ca, u); if (hit) { const q = G.project(K3, cb.R, cb.t, hit); if (q) { x2.strokeStyle = '#2f9e44'; x2.lineWidth = 2.5; x2.beginPath(); x2.arc(q[0] * s, q[1] * s, 7, 0, 7); x2.stroke(); } } });
    if (ep && ep[0] > -50 && ep[0] < W3 + 50 && ep[1] > -50 && ep[1] < H3 + 50) { x2.fillStyle = '#212529'; x2.beginPath(); x2.arc(ep[0] * s, ep[1] * s, 5, 0, 7); x2.fill(); pill(x2, 'אפיפול', ep[0] * s + 6, ep[1] * s - 4, '#212529'); }
    const l0 = lineOf(F, picks[0]); code.textContent = 'u1 = [' + F_(picks[0][0]) + ', ' + F_(picks[0][1]) + ', 1]\nl = F @ u1 = [' + l0.map(v => v.toExponential(3)).join(', ') + ']        # a*u + b*v + c = 0 in image 2\n# epipole in image 2 (camera 1 seen by camera 2): ' + (ep ? '(' + F(ep[0], 0) + ', ' + F(ep[1], 0) + ')' : 'behind camera 2');
    out.innerHTML = 'הקרן של פיקסל אחד במצלמה 1 היא קו ישר בעולם — ומצלמה 2 רואה אותו כקו ישר בתמונה שלה: <b>הקו האפיפולרי</b>. הנקודה המתאימה חייבת להיות עליו (העיגול הירוק תמיד עליו), ולכן החיפוש שלה הוא חד־ממדי. כל הקווים נפגשים בנקודה אחת — <b>האפיפול</b>, המקום שבו מצלמה 2 רואה את מצלמה 1. ' + (move === 0 ? 'כשהמצלמה זזה הצידה, האפיפול רחוק מאוד מחוץ לתמונה, והקווים כמעט מקבילים ואופקיים — זה המצב של סטריאו (פרק 10).' : 'כשהמצלמה נוסעת קדימה, האפיפול <b>בתוך</b> התמונה — בנקודה שאליה נוסעים — וכל הקווים יוצאים ממנו כמו קרני שמש (תרגיל 8.1).') + ' לחץ שוב בתמונה השמאלית כדי להחליף את הנקודה הכתומה.'; }
  const F_ = v => F(v, 0);
  c1.addEventListener('click', e => { const [mx, my] = mouse(c1, e); picks[0] = [mx / c1.width * W3, my / c1.width * W3]; draw(); });
  draw();
};

/* ============================================================ 8.2 — the essential and the fundamental matrix */
W.w3_essential = function (box) {
  V.say(box, 'שלושה וקטורים — הקרן ממצלמה 1 לנקודה, הקרן ממצלמה 2, וקו הבסיס בין המצלמות — תמיד באותו מישור (המשולש הכתום). זה כל התוכן של <code class="ltr">x₂ᵀ·E·x₁ = 0</code>. <b>הזז את הנקודה</b> ובדוק שהמספר נשאר אפס. בלשונית השנייה: <b>הכפל את כל העולם</b> — הסצנה וקו הבסיס — ותראה שהתמונות לא משתנות. E יודעת רק את הכיוון של t.');
  let px = 1, py = 4, pz = 1.5, k = 1, tab = 0;
  V.tabs(box, ['המישור האפיפולרי', 'קנה מידה'], i => { tab = i; build(); draw(); });
  const ctl = el('div'); box.appendChild(ctl);
  const fx = flex(box); const cO = canvas(colm(fx, 'מבחוץ'), 400, 250, 400); const col2 = colm(fx, 'מה ששתי המצלמות רואות'); const ci1 = canvas(col2, 240, 135, 240); const ci2 = canvas(col2, 240, 135, 240); const code = mono(box); const out = V.say(box);
  const obs = observer([-14, -24, 12], [0, -2, 1.5]); const world = world3();
  function build() { ctl.innerHTML = ''; const r = row(ctl); if (tab === 0) { V.slider(r, 'X', -4, 4, 0.1, px, v => { px = v; draw(); }); V.slider(r, 'Y', -2, 12, 0.1, py, v => { py = v; draw(); }); V.slider(r, 'Z', 0, 4, 0.1, pz, v => { pz = v; draw(); }); } else V.slider(r, 'קנה מידה של העולם', 0.5, 4, 0.1, k, v => { k = v; draw(); }); }
  function draw() { const P = [px * k, py * k, pz * k]; const C1 = G.mul([-1, -10, 2], k), C2 = G.mul([1.5, -9.5, 2.2], k), T = G.mul([0, 1, 1], k); const a = G.lookAt(C1, T), b = G.lookAt(C2, T); const ca = { K: K3, R: a.R, t: a.t, W: W3, H: H3 }, cb = { K: K3, R: b.R, t: b.t, W: W3, H: H3 };
    const xo = cO.getContext('2d'); const ro = render3(xo, Object.assign({}, obs, { t: G.mul(G.mv(obs.R, G.mul(camC(obs.R, obs.t), k)), -1) }), world, { alpha: 0.55 }); camGlyph(xo, ro, ca, { axes: false, depth: 1.2 * k }); camGlyph(xo, ro, cb, { axes: false, depth: 1.2 * k });
    const pc1 = ro.pr(C1), pc2 = ro.pr(C2), pp = ro.pr(P); if (pc1 && pc2 && pp) { xo.fillStyle = 'rgba(232,89,12,.25)'; xo.strokeStyle = '#e8590c'; xo.lineWidth = 2; xo.beginPath(); xo.moveTo(pc1[0], pc1[1]); xo.lineTo(pc2[0], pc2[1]); xo.lineTo(pp[0], pp[1]); xo.closePath(); xo.fill(); xo.stroke(); xo.fillStyle = '#e8590c'; xo.beginPath(); xo.arc(pp[0], pp[1], 5, 0, 7); xo.fill(); pill(xo, 'P', pp[0] + 6, pp[1] - 4, '#e8590c'); pill(xo, 'קו הבסיס t', (pc1[0] + pc2[0]) / 2 - 20, (pc1[1] + pc2[1]) / 2 + 18, '#212529'); }
    [[ci1, ca], [ci2, cb]].forEach(([cv, c]) => { const x = cv.getContext('2d'); const r = render3(x, Object.assign({}, c), world3()); });
    /* scale the world for the images: the scene itself is scaled by k — render a scaled copy */
    if (k !== 1) { [[ci1, ca], [ci2, cb]].forEach(([cv, c]) => { const x = cv.getContext('2d'); const wk = world3(); ['ground', 'marks', 'objects'].forEach(g => wk.faces[g].forEach(f => { f.pts = f.pts.map(p => G.mul(p, k)); })); render3(x, c, wk); }); }
    [[ci1, ca], [ci2, cb]].forEach(([cv, c]) => { const q = G.project(K3, c.R, c.t, P); const x = cv.getContext('2d'); if (q) { x.fillStyle = '#e8590c'; x.strokeStyle = '#fff'; x.lineWidth = 2; x.beginPath(); x.arc(q[0] * 240 / W3, q[1] * 240 / W3, 5, 0, 7); x.fill(); x.stroke(); } });
    const { R, t } = rel(ca, cb); const E = G.mm(G.skew(t), R); const q1 = G.project(K3, ca.R, ca.t, P), q2 = G.project(K3, cb.R, cb.t, P); const n1 = [(q1[0] - 640) / 1000, (q1[1] - 360) / 1000, 1], n2 = [(q2[0] - 640) / 1000, (q2[1] - 360) / 1000, 1]; const val = G.dot(n2, G.mv(E, n1)); const tn = G.norm(t);
    code.textContent = 'R = R2 @ R1.T ;  t = t2 - R @ t1 = [' + t.map(v => F(v, 3)).join(', ') + ']   |t| = ' + F(tn, 3) + ' m\nE = skew(t) @ R = ' + fmtM(E.map(r => r.map(v => +v.toFixed(3)))) + '\nE / |t| = ' + fmtM(E.map(r => r.map(v => +(v / tn).toFixed(4)))) + '\nx1 = (' + F(n1[0], 4) + ', ' + F(n1[1], 4) + ', 1)   x2 = (' + F(n2[0], 4) + ', ' + F(n2[1], 4) + ', 1)\nx2 @ E @ x1 = ' + val.toExponential(2);
    out.innerHTML = tab === 0 ? 'הנקודה P, ושתי המצלמות, מגדירות מישור אחד — <b>המישור האפיפולרי</b>. הקרן ממצלמה 1 (x₁), הקרן ממצלמה 2 (x₂) וקו הבסיס t כולם בו. "שלושה וקטורים באותו מישור" = המכפלה המעורבת שלהם אפס: <span class="ltr">x₂ · (t × R·x₁) = 0</span>, וזה בדיוק <span class="ltr">x₂ᵀ·E·x₁</span> עם <span class="ltr">E = [t]×·R</span>. הזז את P: המספר נשאר ' + ltr('~1e-16') + ' — שגיאת עיגול. זה נכון לכל נקודה בעולם, לא רק על מישור.' : 'הכפלת את כל העולם — הבניינים, הרכבים, המצלמות — פי ' + F(k, 1) + '. התמונות <b>זהות</b>: אי אפשר לדעת מהן אם זה עולם קטן או גדול. ‏t גדל פי ' + F(k, 1) + ' (|t| = ' + F(tn, 2) + '), אבל ' + ltr('E / |t|') + ' לא השתנה. לכן מתוך התמונות אפשר לשחזר רק את <b>כיוון</b> התנועה — 5 דרגות חופש ב־E (3 לסיבוב, 2 לכיוון), ולא 6. מצלמה אחת שזזה לא יודעת קנה מידה (פרק 11).'; }
  build(); draw();
};

/* ============================================================ 8.3 — the eight-point algorithm */
function eightPoint(p1, p2, opt) { opt = opt || {}; const I = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; const T1 = opt.noNorm ? I : G.normT(p1), T2 = opt.noNorm ? I : G.normT(p2);
  const A = p1.map((a, i) => { const [x1, y1] = G.ap(T1, a), [x2, y2] = G.ap(T2, p2[i]); return [x2 * x1, x2 * y1, x2, y2 * x1, y2 * y1, y2, x1, y1, 1]; });
  const nv = G.nullvec(A); let F0 = [nv.v.slice(0, 3), nv.v.slice(3, 6), nv.v.slice(6, 9)];
  if (!opt.noRank) { const e = G.eigSym(G.mm(G.T(F0), F0)); const vs = e.vecs.slice().reverse(), sv = e.vals.slice().reverse().map(v => Math.sqrt(Math.max(0, v))); let Fr = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; for (let k = 0; k < 2; k++) { const u = G.mul(G.mv(F0, vs[k]), 1 / sv[k]); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) Fr[i][j] += sv[k] * u[i] * vs[k][j]; } F0 = Fr; }
  let F = G.mm(G.T(T2), G.mm(F0, T1)); F = F.map(r => r.map(v => v / F[2][2])); return { F, sv: nv.sv }; }
W.w3_eight_point = function (box) {
  V.say(box, 'הנתונים של הקוד בסעיף: 60 נקודות בנפח מול הכביש, שתי מצלמות במרחק 2.6 מטר, ורעש בזיהוי. <b>שנה את הרעש</b>, ו<b>כבה</b> את הנרמול או את אכיפת הדרגה 2 — ובדוק את המרחק הממוצע מהקווים האפיפולריים. בתמונה הימנית: הקווים של 12 נקודות. בלשונית השנייה: כל הנקודות על מישור הקרקע.');
  let sig = 0.5, norm = true, rank = true, tab = 0;
  V.tabs(box, ['60 נקודות בנפח', '🐞 כל הנקודות על הקרקע'], k => { tab = k; draw(); });
  const r1 = row(box); V.slider(r1, 'רעש (פיקסלים)', 0, 3, 0.1, sig, v => { sig = v; draw(); });
  ['נרמול', 'אכיפת דרגה 2'].forEach((nm, i) => { const c = el('label', { style: { margin: '0 8px' }, html: '<input type="checkbox" checked> ' + nm }); c.querySelector('input').onchange = e => { if (i === 0) norm = e.target.checked; else rank = e.target.checked; draw(); }; r1.appendChild(c); });
  const fx = flex(box); const c1 = canvas(colm(fx, 'מצלמה 1'), 360, 203, 360); const c2 = canvas(colm(fx, 'מצלמה 2 — קווים אפיפולריים'), 360, 203, 360); const code = mono(box); const out = V.say(box);
  function draw() { const [ca, cb] = cams8(); const r = G.rng(1); const pts = tab ? (() => { const rr = G.rng(9), o = []; for (let i = 0; i < 60; i++) o.push([-4 + 8 * rr(), -2 + 8 * rr(), 0]); return o; })() : P8;
    const u1 = pts.map(P => G.project(K3, ca.R, ca.t, P).slice(0, 2)), u2 = pts.map(P => G.project(K3, cb.R, cb.t, P).slice(0, 2)); const n1 = u1.map(q => [q[0] + sig * G.randn(r), q[1] + sig * G.randn(r)]), n2 = u2.map(q => [q[0] + sig * G.randn(r), q[1] + sig * G.randn(r)]);
    const res = eightPoint(n1, n2, { noNorm: !norm, noRank: !rank }); const F8 = res.F; const d = u1.reduce((a, q, i) => a + epiDist(F8, q, u2[i]), 0) / u1.length;
    const x1 = c1.getContext('2d'), x2 = c2.getContext('2d'); const s = render3(x1, ca, world3()).s; render3(x2, cb, world3());
    n1.forEach(q => { x1.fillStyle = '#e8590c'; x1.fillRect(q[0] * s - 2, q[1] * s - 2, 4, 4); }); n2.forEach(q => { x2.fillStyle = '#e8590c'; x2.fillRect(q[0] * s - 2, q[1] * s - 2, 4, 4); });
    const cols = ['#1c7ed6', '#7048e8', '#2f9e44', '#c2255c']; for (let i = 0; i < 12; i++) drawLine(x2, lineOf(F8, n1[i * 5]), s, cols[i % 4], 1.2);
    /* do the lines meet in one point? the epipole is the null vector of F (smallest eigenvector of FᵀF) */
    const e = G.eigSym(G.mm(G.T(F8), F8)); const svs = e.vals.map(v => Math.sqrt(Math.max(0, v))).reverse();
    code.textContent = 'F8 = eight_point(n1, n2)' + (norm ? '' : '        # without normalize()') + (rank ? '' : '   # without S[2] = 0') + '\nsingular values of A (smallest 3): ' + res.sv.slice(-3).map(v => v.toExponential(2)).join(', ') + '\nsingular values of F: ' + svs.map(v => v.toExponential(2)).join(', ') + '\nepi_dist(F8, uv1, uv2).mean() = ' + F(d, 3) + ' px';
    out.innerHTML = tab === 1 ? '<b>כל הנקודות על מישור אחד:</b> שני הערכים הסינגולריים הקטנים של A כמעט אפס — המשוואות לא בלתי תלויות, ויש אינסוף מטריצות F שמסבירות את הנתונים. מה שיצא שרירותי: המרחק על הנקודות עצמן נראה טוב (' + F(d, 2) + ' פיקסלים), אבל הקווים לא מתארים את המצלמות האמיתיות. זה המקרה של רחפן מעל שטח שטוח — ובו משתמשים בהומוגרפיה (שאלת הראיון).' : 'מרחק ממוצע מהקווים: <b>' + F(d, 3) + ' פיקסלים</b>. ' + (!norm ? 'בלי נרמול — הרבה יותר גרוע (בקורס: 1.86 מול 0.19, פי 10): A מערבבת מספרים בסדר גודל 1 עם מיליון, והפתרון רגיש לרעש. ' : '') + (!rank ? 'בלי אכיפת דרגה 2, הערך הסינגולרי השלישי של F לא אפס — ' + ltr(svs[2].toExponential(1)) + ' — ולכן הקווים <b>לא נפגשים בנקודה אחת</b>: אין אפיפול אחד, וזה לא תיאור של שתי מצלמות. ' : 'עם אכיפת דרגה 2 הערך השלישי של F אפס, וכל הקווים עוברים דרך אפיפול אחד. ') + (sig === 0.5 && norm && rank ? 'זה הקוד של הסעיף — בקורס 0.187.' : ''); }
  draw();
};

/* ============================================================ 8.4 — from E to the motion: four solutions */
W.w3_four_solutions = function (box) {
  V.say(box, 'מפרקים את E ומקבלים <b>ארבעה</b> זוגות של סיבוב ותזוזה — כולם מקיימים את המשוואה בדיוק. ההבדל: איפה הנקודות נמצאות אחרי טריאנגולציה. <b>לחץ על כל אחד מהארבעה</b> ובדוק כמה מהנקודות נמצאות <i>לפני</i> שתי המצלמות. ‏<code class="ltr">recoverPose</code> עושה בדיוק את זה.');
  let sel = 0; const [ca, cb] = cams8(); const { R, t } = rel(ca, cb); const tn = G.unit(t); const Rt = G.mm([[2 * tn[0] * tn[0] - 1, 2 * tn[0] * tn[1], 2 * tn[0] * tn[2]], [2 * tn[1] * tn[0], 2 * tn[1] * tn[1] - 1, 2 * tn[1] * tn[2]], [2 * tn[2] * tn[0], 2 * tn[2] * tn[1], 2 * tn[2] * tn[2] - 1]], R);
  const CANDS = [[R, tn, 'R, t'], [R, G.mul(tn, -1), 'R, −t'], [Rt, tn, 'R′, t'], [Rt, G.mul(tn, -1), 'R′, −t']];
  const u1 = P8.slice(0, 30).map(P => G.project(K3, ca.R, ca.t, P).slice(0, 2)), u2 = P8.slice(0, 30).map(P => G.project(K3, cb.R, cb.t, P).slice(0, 2));
  const res = CANDS.map(([Rc, tc]) => { const P1 = G.Pmat(K3, [[1, 0, 0], [0, 1, 0], [0, 0, 1]], [0, 0, 0]), P2 = G.Pmat(K3, Rc, tc); const X = u1.map((q, i) => G.triangulate([P1, P2], [q, u2[i]])); const front = X.filter(p => p[2] > 0 && G.toCam(Rc, tc, p)[2] > 0).length; return { X, front, Rc, tc }; });
  const tb = V.tabs(box, CANDS.map((c, i) => c[2] + ' — ' + res[i].front + '/30'), k => { sel = k; draw(); });
  const fx = flex(box); const cv = canvas(colm(fx, 'מלמעלה: מצלמה 1 בראשית, מצלמה 2 לפי הפתרון, והנקודות המשוחזרות'), 560, 300, 560); const out = V.say(box);
  function draw() { const x = cv.getContext('2d'); x.clearRect(0, 0, 560, 300); const { X, front, Rc, tc } = res[sel]; const C2 = G.mul(G.mv(G.T(Rc), tc), -1);
    const P = p => [280 + p[0] * 22, 160 - p[2] * 22]; x.strokeStyle = '#dee2e6'; x.beginPath(); x.moveTo(0, 160); x.lineTo(560, 160); x.moveTo(280, 0); x.lineTo(280, 300); x.stroke(); txt(x, 'Z (קדימה, של מצלמה 1)', 286, 14, '#868e96', 10);
    const cam = (C, Rr, col, nm) => { const p = P(C); const f = Rr[2]; x.fillStyle = col; x.beginPath(); x.arc(p[0], p[1], 7, 0, 7); x.fill(); x.strokeStyle = col; x.lineWidth = 2.5; x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(p[0] + f[0] * 30, p[1] - f[2] * 30); x.stroke(); pill(x, nm, p[0] + 8, p[1] + 16, col); };
    X.forEach(p => { const ok = p[2] > 0 && G.toCam(Rc, tc, p)[2] > 0; const q = P(p); if (q[0] < -10 || q[0] > 570 || q[1] < -10 || q[1] > 310) return; x.fillStyle = ok ? '#2f9e44' : '#c92a2a'; x.beginPath(); x.arc(q[0], q[1], 3, 0, 7); x.fill(); });
    cam([0, 0, 0], [[1, 0, 0], [0, 1, 0], [0, 0, 1]], '#212529', 'מצלמה 1'); cam(C2, Rc, '#1c7ed6', 'מצלמה 2');
    out.innerHTML = '<b>' + CANDS[sel][2] + '</b>: ' + front + ' מתוך 30 נקודות לפני שתי המצלמות (ירוק). ' + (front === 30 ? badge(true, 'זה הפתרון הפיזיקלי') + ' — ' + ltr('recoverPose') + ' בוחרת אותו כי רק בו הסצנה <i>לפני</i> המצלמות. שים לב שאורך t כאן 1: היחידות לא ידועות (סעיף 8.2).' : 'הנקודות נמצאות מאחורי מצלמה אחת לפחות — מתמטית E מקיימת את המשוואה, אבל אף מצלמה לא רואה מאחוריה. ' + (sel % 2 ? 'כאן t הפוך: מצלמה 2 בצד השני.' : '') + (sel >= 2 ? ' כאן הסיבוב "מסובב" ב־180° סביב קו הבסיס (הזוג המעוות).' : '')); }
  draw();
};

/* ============================================================ chapter 9 — triangulation */
const triN = (Ps, uvs) => G.triangulate(Ps, uvs);
const stereoCams = B => { const a = G.lookAt([-B / 2, 0, 1.5], [-B / 2, 30, 1.5]), b = G.lookAt([B / 2, 0, 1.5], [B / 2, 30, 1.5]); return [{ K: K3, R: a.R, t: a.t, W: W3, H: H3 }, { K: K3, R: b.R, t: b.t, W: W3, H: H3 }]; };

/* ============================================================ 9.1 — two rays and one equation */
W.w3_two_rays = function (box) {
  V.say(box, 'מלמעלה: שתי מצלמות (הבסיס ביניהן — המחוון) ונקודה. כל מצלמה רואה את הנקודה בפיקסל, עם רעש — ולכן הקרן שלה היא בעצם <b>טריז</b> צר. הנקודה נמצאת איפשהו בחיתוך של שני הטריזים. <b>גרור את הנקודה</b> קרוב ורחוק, ו<b>לחץ "200 ניסויים"</b>: כל נקודה כתומה היא טריאנגולציה אחת עם רעש. שים לב לצורה של הענן.');
  let B = 1, P = [0.5, 12], sig = 0.5, cloud = null, drag = false;
  const r1 = row(box); V.slider(r1, 'בסיס (מ׳)', 0.1, 4, 0.05, B, v => { B = v; cloud = null; draw(); }); V.slider(r1, 'רעש (פיקסלים)', 0, 3, 0.1, sig, v => { sig = v; cloud = null; draw(); }); V.btns(box, [['🎲 200 ניסויים', () => { mc(); draw(); }, 'primary']]);
  const fx = flex(box); const cv = canvas(colm(fx, 'מלמעלה (גרור את הנקודה). רוחב הטריזים: ±2σ, מוגדל פי 15 כדי שיראו'), 560, 330, 560); const code = mono(box); const out = V.say(box);
  const X0 = -10, X1 = 10, Y0 = -1, Y1 = 40; const mp = (x, y) => [(x - X0) / (X1 - X0) * 560, 320 - (y - Y0) / (Y1 - Y0) * 310]; const um = (u, v) => [u / 560 * (X1 - X0) + X0, (320 - v) / 310 * (Y1 - Y0) + Y0];
  function obs(cams, r) { const Pw = [P[0], P[1], 1.5]; return cams.map(c => { const q = G.project(K3, c.R, c.t, Pw); return [q[0] + sig * G.randn(r), q[1] + sig * G.randn(r)]; }); }
  function mc() { const cams = stereoCams(B); const Ps = cams.map(c => G.Pmat(K3, c.R, c.t)); const r = G.rng(8); cloud = []; for (let k = 0; k < 200; k++) cloud.push(triN(Ps, obs(cams, r))); }
  function draw() { const x = cv.getContext('2d'); x.clearRect(0, 0, 560, 330); const cams = stereoCams(B); x.fillStyle = '#f8f9fa'; x.fillRect(0, 0, 560, 330); for (let y = 0; y <= 40; y += 5) { const p = mp(X0, y); x.strokeStyle = '#e9ecef'; x.beginPath(); x.moveTo(0, p[1]); x.lineTo(560, p[1]); x.stroke(); txt(x, y + ' מ׳', 4, p[1] - 2, '#adb5bd', 10); }
    const Cs = cams.map(c => camC(c.R, c.t)); const T = [P[0], P[1]];
    /* wedges: ±2σ in pixels = ±2σ/fx radians */
    Cs.forEach((C, i) => { const a = Math.atan2(T[0] - C[0], T[1] - C[1]); const w = 2 * Math.max(sig, 0.05) / 1000 * 15; const far = 45; const p0 = mp(C[0], C[1]); const pa = mp(C[0] + Math.sin(a - w) * far, C[1] + Math.cos(a - w) * far), pb = mp(C[0] + Math.sin(a + w) * far, C[1] + Math.cos(a + w) * far); x.fillStyle = i ? 'rgba(28,126,214,.15)' : 'rgba(112,72,232,.15)'; x.beginPath(); x.moveTo(p0[0], p0[1]); x.lineTo(pa[0], pa[1]); x.lineTo(pb[0], pb[1]); x.closePath(); x.fill(); const pt = mp(T[0], T[1]); x.strokeStyle = i ? '#1c7ed6' : '#7048e8'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(p0[0], p0[1]); x.lineTo(p0[0] + (pt[0] - p0[0]) * 1.4, p0[1] + (pt[1] - p0[1]) * 1.4); x.stroke(); x.fillStyle = '#212529'; x.beginPath(); x.arc(p0[0], p0[1], 5, 0, 7); x.fill(); });
    if (cloud) cloud.forEach(q => { const p = mp(q[0], q[1]); x.fillStyle = 'rgba(232,89,12,.5)'; x.fillRect(p[0] - 1.5, p[1] - 1.5, 3, 3); });
    const pt = mp(T[0], T[1]); x.strokeStyle = '#212529'; x.lineWidth = 2; x.beginPath(); x.arc(pt[0], pt[1], 6, 0, 7); x.stroke();
    const ang = G.deg(Math.abs(Math.atan2(T[0] - Cs[0][0], T[1] - Cs[0][1]) - Math.atan2(T[0] - Cs[1][0], T[1] - Cs[1][1])));
    let sd = '', sx = ''; if (cloud) { const dz = cloud.map(q => q[1] - T[1]), dx = cloud.map(q => q[0] - T[0]); const rms = a => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length); sd = F(rms(dz) * 100, 1); sx = F(rms(dx) * 100, 2); }
    const u = obs(cams, G.rng(1)); code.textContent = 'u1 = (' + F(u[0][0], 2) + ', ' + F(u[0][1], 2) + ')   u2 = (' + F(u[1][0], 2) + ', ' + F(u[1][1], 2) + ')   disparity = ' + F(u[0][0] - u[1][0], 2) + ' px\nangle between the rays = ' + F(ang, 2) + ' deg' + (cloud ? '\n# 200 trials: rms error  depth (along Y) ' + sd + ' cm   sideways (X) ' + sx + ' cm' : '');
    out.innerHTML = 'הזווית בין שתי הקרניים: <b>' + F(ang, 2) + '°</b>. ' + (cloud ? 'בניסויים: שגיאה בעומק ' + sd + ' ס״מ, ולצד ' + sx + ' ס״מ — ' + F(+sd / Math.max(+sx, 1e-6), 0) + ' פעמים יותר. ' : '') + 'הענן נמתח <b>לאורך כיוון המבט</b>: הכיוון אל הנקודה ידוע היטב מכל מצלמה לבד (טריז צר), אבל המקום <i>לאורך</i> הקרן נקבע רק מהחיתוך — וכשהזווית קטנה, הטריזים חותכים זה את זה לאורך מקטע ארוך. הרחק את הנקודה או הקטן את הבסיס: הזווית קטנה והענן מתארך.'; }
  const at = e => { const [mx, my] = mouse(cv, e); return um(mx, my); };
  cv.addEventListener('mousedown', e => { drag = true; const p = at(e); P = [clamp(p[0], -8, 8), clamp(p[1], 2, 39)]; cloud = null; draw(); }); cv.addEventListener('mousemove', e => { if (!drag) return; const p = at(e); P = [clamp(p[0], -8, 8), clamp(p[1], 2, 39)]; cloud = null; draw(); }); window.addEventListener('mouseup', () => { drag = false; });
  draw();
};

/* ============================================================ 9.2 — the implementation: the matrix A */
W.w3_ray_angle = function (box) {
  V.say(box, 'מה קורה בתוך <code class="ltr">triangulate</code>. לכל מצלמה — שתי שורות במטריצה A (ארבעה מקדמים כל אחת), והפתרון הוא הוקטור שמאפס אותה: השורה האחרונה של Vt. <b>הוסף מצלמות</b> (תרגיל 9.3), <b>הרחק את הנקודה</b> (ובקצה — תרגיל 9.2), ובדוק מה קורה לערכים הסינגולריים — הם מספרים כמה "יציב" הפתרון.');
  let nc = 2, sig = 0.5, py = 15, px = 0.5, bug = false;
  const r1 = row(box); V.slider(r1, 'מספר מצלמות', 2, 6, 1, nc, v => { nc = v; draw(); }); V.slider(r1, 'רעש (פיקסלים)', 0, 2, 0.1, sig, v => { sig = v; draw(); });
  const r2 = row(box); V.slider(r2, 'הנקודה: X', -6, 6, 0.1, px, v => { px = v; draw(); }); V.slider(r2, 'הנקודה: Y', -2, 30, 0.1, py, v => { py = v; draw(); });
  const c = el('label', { style: { margin: '0 8px' }, html: '<input type="checkbox"> 🐞 בלי החלוקה ב־W' }); c.querySelector('input').onchange = e => { bug = e.target.checked; draw(); }; r2.appendChild(c);
  const fx = flex(box); const cv = canvas(colm(fx, 'מלמעלה'), 300, 260, 300); const tb = el('div', { style: { minWidth: '330px' } }); fx.appendChild(tb); const code = mono(box); const out = V.say(box);
  const camsN = n => { const o = []; for (let i = 0; i < n; i++) { const C = i < 2 ? [i ? 0.5 : -0.5, 0, 1.5] : [[-6, 6, 1.5], [6, 6, 1.5], [-3, 28, 2], [5, 26, 2]][i - 2]; const la = G.lookAt(C, i < 2 ? [C[0], 30, 1.5] : [0, 15, 1]); o.push({ K: K3, R: la.R, t: la.t, C }); } return o; };
  function draw() { const cams = camsN(nc); const Pw = [px, py, 1.5]; const Ps = cams.map(c => G.Pmat(K3, c.R, c.t)); const r = G.rng(4);
    const vis = cams.map(c => G.project(K3, c.R, c.t, Pw)); const uv = vis.map(q => q ? [q[0] + sig * G.randn(r), q[1] + sig * G.randn(r)] : null);
    const ok = uv.every(Boolean); const A = []; if (ok) Ps.forEach((P, i) => { const [u, v] = uv[i]; A.push(P[2].map((x, k) => u * x - P[0][k])); A.push(P[2].map((x, k) => v * x - P[1][k])); });
    let Xh = null, sv = null; if (ok) { const nv = G.nullvec(A); Xh = nv.v; sv = nv.sv; } const X = Xh ? (bug ? Xh.slice(0, 3) : [Xh[0] / Xh[3], Xh[1] / Xh[3], Xh[2] / Xh[3]]) : null;
    /* error over 200 trials */ let rm = NaN; if (ok) { let ss = 0; const rr = G.rng(11); for (let k = 0; k < 200; k++) { const uu = vis.map(q => [q[0] + sig * G.randn(rr), q[1] + sig * G.randn(rr)]); const e = G.triangulate(Ps, uu); ss += G.norm(G.sub(e, Pw)) ** 2; } rm = Math.sqrt(ss / 200); }
    const x = cv.getContext('2d'); x.fillStyle = '#f8f9fa'; x.fillRect(0, 0, 300, 260); const mp = (a, b) => [150 + a * 20, 245 - b * 7.5]; x.strokeStyle = '#ced4da'; x.setLineDash([4, 3]); const b1 = mp(-12, 0), b2 = mp(12, 0); x.beginPath(); x.moveTo(b1[0], b1[1]); x.lineTo(b2[0], b2[1]); x.stroke(); x.setLineDash([]); txt(x, 'קו הבסיס', 8, b1[1] - 4, '#868e96', 10);
    cams.forEach(c => { const p = mp(c.C[0], c.C[1]); const q = mp(Pw[0], Pw[1]); x.strokeStyle = 'rgba(28,126,214,.6)'; x.lineWidth = 1; x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(q[0], q[1]); x.stroke(); x.fillStyle = '#212529'; x.beginPath(); x.arc(p[0], p[1], 5, 0, 7); x.fill(); });
    const q = mp(Pw[0], Pw[1]); x.strokeStyle = '#e8590c'; x.lineWidth = 2; x.beginPath(); x.arc(q[0], q[1], 6, 0, 7); x.stroke();
    tb.innerHTML = ok ? table(['', 'X', 'Y', 'Z', 'W'], A.slice(0, 6).map((rw, i) => ['שורה ' + (i + 1) + (i % 2 ? ' (v)' : ' (u)') + ', מצלמה ' + (Math.floor(i / 2) + 1)].concat(rw.map(v => ltr(v.toExponential(1))))).concat(A.length > 6 ? [['…', '', '', '', '']] : [])) : '';
    code.textContent = ok ? 'A: ' + A.length + ' x 4\nsingular values: ' + sv.map(v => v.toExponential(2)).join(', ') + '\nX_h = Vt[-1] = [' + Xh.map(v => v.toFixed(5)).join(', ') + ']\n' + (bug ? 'X = X_h[:3]            # BUG: forgot to divide by W  -> [' : 'X = X_h[:3] / X_h[3]   -> [') + X.map(v => F(v, 3)).join(', ') + ']   truth [' + Pw.map(v => F(v, 2)).join(', ') + ']\n# 200 trials, rms error ' + F(rm * 100, 1) + ' cm' : '# the point is behind one of the cameras';
    const svr = ok ? sv[2] / sv[0] : 0;
    out.innerHTML = !ok ? 'הנקודה מאחורי אחת המצלמות.' : bug ? '<b>הבאג:</b> לקחו את שלושת הרכיבים הראשונים של הוקטור ההומוגני בלי לחלק ב־W. הוקטור מנורמל לאורך 1 (כך SVD מחזירה), ולכן יוצאים מספרים קטנים מ־1 — "נקודה" ליד הראשית, בכל מקרה. זה בדיוק מה שמסתתר בשורה ' + ltr('X[:3] / X[3]') + '.' : (Math.abs(px) > 0.55 || py > 0.5 ? '' : '') + 'עם ' + nc + ' מצלמות: ' + A.length + ' משוואות לארבעה נעלמים (X, Y, Z, W), והשגיאה ' + F(rm * 100, 1) + ' ס״מ. ' + 'היחס בין הערך הסינגולרי השלישי לראשון (' + ltr(svr.toExponential(1)) + ') הוא מדד ליציבות: ככל שהוא קטן, יש כיוון שני "כמעט חופשי" — לאורך הקרן — והרעש מזיז את הפתרון לאורכו. הרחק את הנקודה (Y = 30): הזווית בין הקרניים קטנה, היחס צונח והשגיאה מזנקת. בקצה — כשהנקודה על קו הבסיס עצמו (תרגיל 9.2) — שתי הקרניים הן אותו קו, היחס אפס, והעומק לא מוגדר בכלל. ' + (nc > 2 ? 'מצלמות מזוויות שונות "סוגרות" את הכיוון החלש — השגיאה יורדת הרבה יותר מאשר רק בגלל עוד משוואות (בקורס: 0.92 ס״מ עם 2, 0.63 עם 4).' : 'הוסף מצלמות מהצדדים.'); }
  draw();
};

/* ============================================================ 9.3 — how accurate is it? */
W.w3_depth_curve = function (box) {
  V.say(box, 'שגיאת העומק מול המרחק. הקו — הנוסחה של הסעיף, <code class="ltr">ΔZ ≈ Z² / (f·B)</code> לכל פיקסל שגיאה בהפרש; הנקודות — סימולציה חיה (300 נקודות בכל מרחק, רעש בשתי התמונות). <b>שנה את הבסיס, את f ואת הרעש.</b> <b>האתגר:</b> לתכנן מערכת סטריאו לרכב שטועה פחות מ־20 ס״מ ב־20 מטר — עם בסיס של עד 60 ס״מ (רוחב של מראה) ושדה ראייה אופקי של לפחות 40° (על חיישן של 1280 פיקסלים).');
  let B = 1, f = 1000, sig = 0.5; const cmp = { 0.2: null };
  const r1 = row(box); V.slider(r1, 'בסיס B (מ׳)', 0.05, 2, 0.01, B, v => { B = v; draw(); }); V.slider(r1, 'f (פיקסלים)', 300, 4000, 10, f, v => { f = v; draw(); }); V.slider(r1, 'רעש (פיקסלים)', 0.1, 2, 0.05, sig, v => { sig = v; draw(); });
  const fx = flex(box); const cv = canvas(colm(fx, 'שגיאת עומק ממוצעת (מ׳) מול מרחק (מ׳) — סקאלה לוגריתמית'), 520, 280, 520); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  const mean = (B, f, sig, Z) => { const K = G.K(f, 640, 360); const ca = G.lookAt([-B / 2, 0, 1.5], [-B / 2, 30, 1.5]), cb = G.lookAt([B / 2, 0, 1.5], [B / 2, 30, 1.5]); const Ps = [G.Pmat(K, ca.R, ca.t), G.Pmat(K, cb.R, cb.t)]; const r = G.rng(Math.round(Z * 100 + B * 1000)); let s = 0; for (let k = 0; k < 300; k++) { const P = [-1 + 2 * r(), Z, 0.5 + 2 * r()]; const uv = [ca, cb].map(c => { const q = G.project(K, c.R, c.t, P); return [q[0] + sig * G.randn(r), q[1] + sig * G.randn(r)]; }); s += Math.abs(G.triangulate(Ps, uv)[1] - Z); } return s / 300; };
  function draw() { const x = cv.getContext('2d'); x.clearRect(0, 0, 520, 280); const Zs = [3, 5, 10, 20, 40, 60]; const LX = z => 40 + Math.log(z / 2) / Math.log(35) * 460, LY = e => 260 - (Math.log10(e) + 3) / 5 * 250;
    x.strokeStyle = '#e9ecef'; [0.001, 0.01, 0.1, 1, 10, 100].forEach(e => { x.beginPath(); x.moveTo(40, LY(e)); x.lineTo(510, LY(e)); x.stroke(); txt(x, e >= 1 ? e + ' מ׳' : e * 100 + ' ס״מ', 2, LY(e) + 4, '#868e96', 9); }); Zs.forEach(z => txt(x, String(z), LX(z) - 5, 275, '#868e96', 10));
    const formula = Z => Z * Z / (f * B) * sig * Math.SQRT2 * Math.sqrt(2 / Math.PI);
    const curve = (Bv, fv, col) => { x.strokeStyle = col; x.lineWidth = 2; x.beginPath(); for (let z = 2.5; z <= 68; z *= 1.05) { const e = z * z / (fv * Bv) * sig * Math.SQRT2 * Math.sqrt(2 / Math.PI); const yy = clamp(LY(e), 0, 270); z === 2.5 ? x.moveTo(LX(z), yy) : x.lineTo(LX(z), yy); } x.stroke(); };
    curve(0.2, 1000, '#ced4da'); txt(x, 'B = 20 ס״מ, f = 1000', LX(3), LY(Math.max(1e-3, 9 / 200 * sig)) - 6, '#adb5bd', 10); curve(B, f, '#1c7ed6');
    const sim = Zs.map(z => mean(B, f, sig, z)); Zs.forEach((z, i) => { x.fillStyle = '#e8590c'; x.beginPath(); x.arc(LX(z), clamp(LY(sim[i]), 0, 270), 4.5, 0, 7); x.fill(); });
    const tgt = [LX(20), LY(0.2)]; x.strokeStyle = '#2f9e44'; x.lineWidth = 2; x.strokeRect(tgt[0] - 7, tgt[1] - 7, 14, 14); txt(x, 'יעד', tgt[0] + 9, tgt[1] - 6, '#2f9e44', 10);
    tb.innerHTML = table(['מרחק'].concat(Zs.map(z => z + ' מ׳')), [['סימולציה'].concat(sim.map(e => e < 1 ? F(e * 100, 1) + ' ס״מ' : F(e, 2) + ' מ׳')), ['נוסחה'].concat(Zs.map(z => { const e = formula(z); return e < 1 ? F(e * 100, 1) + ' ס״מ' : F(e, 2) + ' מ׳'; }))]);
    const fov = 2 * G.deg(Math.atan(640 / f)); const e20 = sim[3]; const ok = e20 < 0.2 && B <= 0.6 + 1e-9 && fov >= 40 - 1e-9;
    out.innerHTML = 'ב־20 מטר: <b>' + (e20 < 1 ? F(e20 * 100, 1) + ' ס״מ' : F(e20, 2) + ' מטר') + '</b>; שדה ראייה ' + F(fov, 1) + '°. ' + (Math.abs(B - 1) < 0.005 && f === 1000 && sig === 0.5 ? 'זו ההגדרה של הסעיף — 0.015, 0.058, 0.22, 0.94 בטבלה שם. ' : '') + 'הקו הכחול עולה בשיפוע 2 בסקאלה הלוגריתמית: <b>פי 2 מרחק — פי 4 שגיאה</b>. הכפלת B או f מורידה אותו במקביל: פי 2 בבסיס — פי 2 דיוק. ' + (ok ? badge(true, 'עומד ביעד.') + ' בדרך כלל זה אומר: בסיס מקסימלי ועדשה ארוכה ככל שהשדה מרשה — f·B הוא מה שקובע.' : 'אתגר: פחות מ־20 ס״מ ב־20 מטר, ' + ltr('B ≤ 0.6') + ', שדה ≥ 40° (' + ltr('f ≤ 1758') + '). ' + (B > 0.6 ? 'הבסיס גדול מדי. ' : '') + (fov < 40 ? 'השדה צר מדי. ' : '') + (e20 >= 0.2 ? 'השגיאה עדיין גדולה — מה המכפלה f·B שצריך?' : '')); }
  draw();
};

/* ============================================================ chapter 10 — stereo depth, and depth from one camera */
const camStereo = (B, side, yawDeg) => { const cx = side * B / 2; const a = G.rad(yawDeg || 0); const la = G.lookAt([cx, 0, 1.5], [cx + 100 * Math.sin(a), 100 * Math.cos(a), 1.5]); return { K: K3, R: la.R, t: la.t, W: W3, H: H3 }; };

/* ============================================================ 10.1 — rectified stereo */
W.w3_disparity = function (box) {
  V.say(box, 'זוג סטריאו על רכב, מיושר: שתי מצלמות זהות, מקבילות, מוזזות הצידה במרחק B. <b>הזז את הסמן</b> על התמונה השמאלית: באותה שורה בימנית מסומנת הנקודה המתאימה, ההפרש d בפיקסלים, והעומק <code class="ltr">Z = fx·B/d</code>. <b>שנה את B ואת numDisparities</b> — ושים לב לרצועה העיוורת משמאל. בלשונית השנייה: מה קורה בלי יישור.');
  const world = world3(); let B = 0.5, nd = 64, hov = [760, 470], tab = 0;
  V.tabs(box, ['מיושר', '🐞 מצלמה ימנית מסובבת ב־2°'], k => { tab = k; draw(); });
  const r1 = row(box); V.slider(r1, 'בסיס B (מ׳)', 0.05, 1.5, 0.01, B, v => { B = v; draw(); }); V.slider(r1, 'numDisparities', 16, 256, 16, nd, v => { nd = v; draw(); });
  const fx = flex(box); const cL = canvas(colm(fx, 'שמאל'), 360, 203, 360); const cR = canvas(colm(fx, 'ימין'), 360, 203, 360); const code = mono(box); const out = V.say(box);
  function draw() { const L = camStereo(B, -1), R = camStereo(B, 1, tab ? 2 : 0); const xl = cL.getContext('2d'), xr = cR.getContext('2d'); const s = render3(xl, L, world).s; render3(xr, R, world);
    xl.fillStyle = 'rgba(33,37,41,.45)'; xl.fillRect(0, 0, nd * s, 203); txt(xl, 'אין עומק', 4, 14, '#fff', 10);
    const hit = rayHit(world, L, hov); xl.strokeStyle = '#e8590c'; xl.lineWidth = 2; xl.beginPath(); xl.arc(hov[0] * s, hov[1] * s, 6, 0, 7); xl.stroke();
    xr.strokeStyle = 'rgba(232,89,12,.8)'; xr.lineWidth = 1; xr.setLineDash([5, 4]); xr.beginPath(); xr.moveTo(0, hov[1] * s); xr.lineTo(360, hov[1] * s); xr.stroke(); xr.setLineDash([]);
    xr.fillStyle = 'rgba(28,126,214,.18)'; xr.fillRect(Math.max(0, hov[0] - nd) * s, hov[1] * s - 6, Math.min(nd, hov[0]) * s, 12);
    let m = null; if (hit) m = G.project(K3, R.R, R.t, hit); if (m) { xr.strokeStyle = '#2f9e44'; xr.lineWidth = 2.5; xr.beginPath(); xr.arc(m[0] * s, m[1] * s, 6, 0, 7); xr.stroke(); }
    const d = m ? hov[0] - m[0] : NaN; const Zt = hit ? G.toCam(L.R, L.t, hit)[2] : NaN; const Z = 1000 * B / d;
    code.textContent = 'u_left = ' + F(hov[0], 1) + '   u_right = ' + (m ? F(m[0], 1) : '?') + '   (rows: ' + F(hov[1], 1) + ' / ' + (m ? F(m[1], 1) : '?') + ')\nd = u_left - u_right = ' + F(d, 2) + ' px\nZ = fx * B / d = 1000 * ' + F(B, 2) + ' / ' + F(d, 2) + ' = ' + F(Z, 2) + ' m      (truth ' + F(Zt, 2) + ' m)\nnearest depth with numDisparities=' + nd + ':  fx*B/(nd-1) = ' + F(1000 * B / (nd - 1), 2) + ' m';
    if (tab === 1) { out.innerHTML = '<b>בלי יישור:</b> המצלמה הימנית מסובבת ב־2° בלבד — והנקודה המתאימה (ירוק) כבר <b>לא בשורה</b> של הנקודה השמאלית: ' + (m ? 'היא בשורה ' + F(m[1], 0) + ' במקום ' + F(hov[1], 0) + ', ו' : '') + 'גם ההפרש עצמו השתנה: ' + F(d, 1) + ' פיקסלים, ומכאן "עומק" של ' + F(Z, 1) + ' מטר במקום ' + F(Zt, 1) + '. חיפוש לאורך השורה לא ימצא אותה. לכן <code class="ltr">stereoRectify</code> + <code class="ltr">remap</code> הם חובה — אין זוג מצלמות אמיתי שמקביל עד 2°.'; return; }
    out.innerHTML = 'ההפרש: <b>' + F(d, 1) + ' פיקסלים</b>, ועומק <b>' + F(Z, 2) + ' מ׳</b> (האמת: ' + F(Zt, 2) + '). הנקודה המתאימה <b>באותה שורה בדיוק</b> — זו המשמעות של "מיושר": הקווים האפיפולריים הם שורות התמונה, והחיפוש הוא רק לאורך הרצועה הכחולה. ' + (d >= nd ? '<b style="color:#c92a2a">ההפרש גדול מ־numDisparities</b> — האלגוריתם לא יחפש כל כך רחוק, והנקודה הזו תקבל עומק שגוי או לא תקבל בכלל. ' : '') + 'העומק הקרוב ביותר שאפשר למדוד: ' + ltr('fx·B/(numDisparities − 1) = ' + F(1000 * B / (nd - 1), 2) + ' m') + '. ומשמאל — רצועה של ' + nd + ' עמודות שבה אין עומק בכלל: ההתאמה שלה הייתה מחוץ לתמונה הימנית. הגדלת הטווח: רואים קרוב יותר, הרצועה רחבה יותר, והחישוב איטי יותר (תרגיל 10.1).'; }
  cL.addEventListener('mousemove', e => { const [mx, my] = mouse(cL, e); hov = [mx / 360 * W3, my / 360 * W3]; draw(); });
  draw();
};

/* ============================================================ 10.2 — a depth map on a scene we know (block matching, in the browser) */
function scene10(texNear) { /* like the course: 640×480, f = 700, B = 0.1; boards at 4 and 7 m in front of a wall at 12 m; textured planes */
  const Wd = 320, Hd = 240, f = 350, cx = 160, cy = 120, B = 0.1; const tex = (X, Y, k) => { const h = (a, b) => { let n = Math.sin(a * 127.1 + b * 311.7 + k * 74.7) * 43758.5453; return n - Math.floor(n); }; const gx = Math.floor(X * 40), gy = Math.floor(Y * 40); return 60 + 150 * (0.6 * h(gx, gy) + 0.4 * h(Math.floor(X * 13), Math.floor(Y * 13))); };
  const planes = [{ Z: 4, x0: -0.9, x1: 0.1, y0: -0.4, y1: 0.6, k: 1 }, { Z: 7, x0: 0.2, x1: 1.6, y0: -0.6, y1: 0.5, k: 2 }, { Z: 12, x0: -99, x1: 99, y0: -99, y1: 99, k: 3 }];
  const render = (camX, seed) => { const im = new Float32Array(Wd * Hd), Zm = new Float32Array(Wd * Hd); const r = G.rng(seed); for (let v = 0; v < Hd; v++) for (let u = 0; u < Wd; u++) { const dx = (u - cx) / f, dy = (v - cy) / f; for (const p of planes) { const X = camX + p.Z * dx, Y = p.Z * dy; if (X >= p.x0 && X <= p.x1 && Y >= p.y0 && Y <= p.y1) { im[v * Wd + u] = (p.k === 1 && !texNear) ? 140 : tex(X, Y, p.k); Zm[v * Wd + u] = p.Z; break; } } im[v * Wd + u] += 3 * G.randn(r); } return { im, Zm }; };
  const L = render(0, 1), R = render(B, 2); return { Wd, Hd, f, B, L, R }; }
function blockMatch(S, nd, bs, uniq) { const { Wd, Hd } = S, L = S.L.im, R = S.R.im, h = (bs - 1) / 2; const best = new Float32Array(Wd * Hd).fill(1e9), second = new Float32Array(Wd * Hd).fill(1e9), disp = new Float32Array(Wd * Hd).fill(-1); const cost = new Float32Array(Wd * Hd), ii = new Float64Array((Wd + 1) * (Hd + 1));
  for (let d = 0; d < nd; d++) { for (let v = 0; v < Hd; v++) for (let u = 0; u < Wd; u++) cost[v * Wd + u] = u - d >= 0 ? Math.abs(L[v * Wd + u] - R[v * Wd + u - d]) : 255; for (let v = 0; v < Hd; v++) { let rs = 0; for (let u = 0; u < Wd; u++) { rs += cost[v * Wd + u]; ii[(v + 1) * (Wd + 1) + u + 1] = ii[v * (Wd + 1) + u + 1] + rs; } }
    for (let v = h; v < Hd - h; v++) for (let u = h + d; u < Wd - h; u++) { const a = (v - h) * (Wd + 1) + (u - h), b = (v + h + 1) * (Wd + 1) + (u + h + 1); const c = ii[b] - ii[(v - h) * (Wd + 1) + u + h + 1] - ii[(v + h + 1) * (Wd + 1) + u - h] + ii[a]; const k = v * Wd + u; if (c < best[k]) { if (Math.abs(disp[k] - d) > 1) second[k] = best[k]; best[k] = c; disp[k] = d; } else if (c < second[k] && Math.abs(disp[k] - d) > 1) second[k] = c; } }
  for (let k = 0; k < disp.length; k++) { if (disp[k] <= 0 || best[k] * (1 + uniq / 100) > second[k]) disp[k] = -1; } return disp; }
W.w3_scanline = function (box) {
  V.say(box, 'הסצנה של הסעיף: שני לוחות מרוקמים (4 ו־7 מטר) מול קיר (12 מטר), ‏fx = 700 ובסיס 10 ס״מ (כאן בחצי רזולוציה). <b>לחץ על פיקסל</b> בתמונה השמאלית: הגרף מראה את עלות ההתאמה (סכום הפרשים בחלון) לכל הפרש אפשרי — והמינימום הוא ההפרש. <b>לחץ "חשב מפת עומק"</b> כדי להריץ התאמת בלוקים על כל התמונה, כאן בדפדפן. ואז <b>כבה את המרקם</b> של הלוח הקרוב.');
  let tex = true, bs = 7, nd = 24, uniq = 10, pix = [120, 130], S = scene10(true), dmap = null;
  const r1 = row(box); V.slider(r1, 'blockSize', 3, 21, 2, bs, v => { bs = v; dmap = null; draw(); }); V.slider(r1, 'numDisparities', 8, 40, 1, nd, v => { nd = v; dmap = null; draw(); }); V.slider(r1, 'uniquenessRatio', 0, 40, 1, uniq, v => { uniq = v; dmap = null; draw(); });
  const c = el('label', { style: { margin: '0 8px' }, html: '<input type="checkbox" checked> מרקם על הלוח הקרוב' }); c.querySelector('input').onchange = e => { tex = e.target.checked; S = scene10(tex); dmap = null; draw(); }; r1.appendChild(c);
  V.btns(box, [['⚙ חשב מפת עומק', () => { dmap = blockMatch(S, nd, bs, uniq); draw(); }, 'primary']]);
  const fx = flex(box); const cL = canvas(colm(fx, 'שמאל — לחץ'), 320, 240, 320); const cD = canvas(colm(fx, 'מפת עומק'), 320, 240, 320); const cC = canvas(colm(flex(box), 'עלות ההתאמה מול ההפרש, לפיקסל שנבחר'), 520, 150, 520); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  const show = (cv, im) => { const x = cv.getContext('2d'); const d = x.createImageData(320, 240); for (let i = 0; i < im.length; i++) { const v = clamp(im[i], 0, 255); d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255; } x.putImageData(d, 0, 0); };
  const colZ = Z => { const t = clamp((Z - 3) / 11, 0, 1); return [Math.round(255 * (1 - t) * 0.95 + 20), Math.round(120 + 80 * Math.sin(t * 3)), Math.round(255 * t)]; };
  function draw() { show(cL, S.L.im); const x = cL.getContext('2d'); x.strokeStyle = '#e8590c'; x.lineWidth = 2; x.strokeRect(pix[0] - (bs - 1) / 2, pix[1] - (bs - 1) / 2, bs, bs); x.beginPath(); x.moveTo(0, pix[1]); x.lineTo(320, pix[1]); x.strokeStyle = 'rgba(232,89,12,.5)'; x.lineWidth = 1; x.stroke(); x.fillStyle = 'rgba(33,37,41,.35)'; x.fillRect(0, 0, nd, 240);
    /* cost curve */ const h = (bs - 1) / 2; const costs = []; for (let d = 0; d < nd; d++) { let c2 = 0; for (let dv = -h; dv <= h; dv++) for (let du = -h; du <= h; du++) { const u = pix[0] + du, v = pix[1] + dv; if (u - d < 0 || u >= 320 || v < 0 || v >= 240) { c2 += 255; continue; } c2 += Math.abs(S.L.im[v * 320 + u] - S.R.im[v * 320 + u - d]); } costs.push(c2 / (bs * bs)); }
    const g = cC.getContext('2d'); g.clearRect(0, 0, 520, 150); const mx = Math.max(...costs), mn = Math.min(...costs); const X = d => 30 + d / Math.max(1, nd - 1) * 480, Y = c3 => 135 - (c3 - 0) / Math.max(1, mx) * 120; g.strokeStyle = '#dee2e6'; g.beginPath(); g.moveTo(30, 135); g.lineTo(512, 135); g.stroke(); for (let d = 0; d < nd; d += 4) txt(g, String(d), X(d) - 4, 148, '#868e96', 10);
    g.strokeStyle = '#1c7ed6'; g.lineWidth = 2; g.beginPath(); costs.forEach((c3, d) => d ? g.lineTo(X(d), Y(c3)) : g.moveTo(X(d), Y(c3))); g.stroke(); const dBest = costs.indexOf(mn); g.fillStyle = '#e8590c'; g.beginPath(); g.arc(X(dBest), Y(mn), 5, 0, 7); g.fill();
    const Zt = S.L.Zm[pix[1] * 320 + pix[0]]; const dTrue = S.f * S.B / Zt; g.strokeStyle = '#2f9e44'; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(X(dTrue), 10); g.lineTo(X(dTrue), 135); g.stroke(); g.setLineDash([]); txt(g, 'אמת', X(dTrue) + 3, 18, '#2f9e44', 10);
    const sorted = costs.slice().sort((a, b) => a - b); const ratio = sorted[1] > 0 ? (sorted[1] - mn) / mn : 0; let sec = 1e9; costs.forEach((c3, d) => { if (Math.abs(d - dBest) > 1) sec = Math.min(sec, c3); });
    /* depth map */ const xd = cD.getContext('2d'); if (dmap) { const im = xd.createImageData(320, 240); let inv = 0; const errs = { 4: [], 7: [], 12: [] }; for (let k = 0; k < dmap.length; k++) { const o = k * 4; if (dmap[k] <= 0) { im.data[o] = im.data[o + 1] = im.data[o + 2] = 0; inv++; } else { const Z = S.f * S.B / dmap[k]; const c3 = colZ(Z); im.data[o] = c3[0]; im.data[o + 1] = c3[1]; im.data[o + 2] = c3[2]; const zt = S.L.Zm[k]; if (errs[zt]) errs[zt].push(Math.abs(Z - zt)); } im.data[o + 3] = 255; } xd.putImageData(im, 0, 0);
        tb.innerHTML = table(['משטח', 'הפרש אמיתי', 'שגיאה חציונית', 'פיקסלים עם עומק'], [4, 7, 12].map(z => { const n = (() => { let c4 = 0; for (let k = 0; k < dmap.length; k++) if (S.L.Zm[k] === z) c4++; return c4; })(); return [z + ' מ׳', F(S.f * S.B / z, 2), errs[z].length ? F(G.median(errs[z]) * 100, 0) + ' ס״מ' : '—', F(errs[z].length / n * 100, 1) + '%']; })) + '<div class="note-small" style="text-align:center">שחור: אין עומק (' + F(inv / dmap.length * 100, 1) + '% מהפיקסלים). התאמת בלוקים פשוטה (SAD), בלי ההחלקה של SGBM ובלי תת־פיקסל — לכן השגיאות גדולות מהטבלה של הסעיף.</div>'; }
    else { xd.fillStyle = '#f1f3f5'; xd.fillRect(0, 0, 320, 240); txt(xd, 'לחץ "חשב מפת עומק"', 90, 125, '#868e96', 13); tb.innerHTML = ''; }
    const flat = (sec - mn) / Math.max(mn, 1e-6) < uniq / 100;
    out.innerHTML = 'בפיקסל ' + ltr('(' + pix[0] + ', ' + pix[1] + ')') + ' המינימום בהפרש <b>' + dBest + '</b> (האמת: ' + F(dTrue, 2) + ' — משטח ב־' + Zt + ' מ׳). ' + (flat ? '<b style="color:#c92a2a">המינימום לא ברור</b>: ההפרש הכי טוב והשני (שאינו שכן שלו) כמעט שווים — ' + ltr('uniquenessRatio') + ' יזרוק את הפיקסל הזה. ' : 'המינימום ברור ועמוק. ') + (!tex ? 'בלי מרקם, כל חלון על הלוח נראה כמו כל חלון אחר — העקומה שטוחה, ואין דרך לדעת איפה ההתאמה. בדיוק "קיר לבן" של הסעיף. ' : '') + 'שים לב שההפרש האמיתי הוא שבר (' + F(dTrue, 2) + '), ושהתאמה בשלמים טועה עד חצי פיקסל — ' + F(Zt * Zt / (S.f * S.B) * 0.5 * 100, 0) + ' ס״מ ב־' + Zt + ' מטר. לכן SGBM מחזיר הפרש ביחידות של 1/16.'; }
  cL.addEventListener('click', e => { const [mx, my] = mouse(cL, e); pix = [Math.round(clamp(mx, 12, 307)), Math.round(clamp(my, 12, 227))]; draw(); });
  draw();
};

/* ============================================================ 10.3 — depth from one camera: from relative to metric */
W.w3_mono_scale = function (box) {
  V.say(box, 'מודל עומק "יחסי" מחזיר בערך <code class="ltr">rel ≈ s/Z + b</code> — עם s ו־b שהוא לא מגלה (ועם רעש, וקצת עיקום). כדי לקבל מטרים צריך כמה נקודות שהעומק שלהן ידוע. <b>לחץ על נקודות</b> בפס (לפי המרחק שלהן) כדי לבחור את נקודות הייחוס, ותראה את השגיאה בכל מרחק. <b>האתגר:</b> שתי נקודות בלבד, ושגיאה חציונית מתחת ל־5% בכל טווח המרחקים.');
  let refs = [10, 11], curve = 0.01; const r0 = G.rng(5); const N = 600; const Zs = [], rels = []; for (let i = 0; i < N; i++) { const Z = 3 + 27 * r0(); Zs.push(Z); rels.push(5 / Z + 0.2 + curve * Math.log(Z) / 3 + 0.003 * G.randn(r0)); }
  const strip = canvas(colm(flex(box), 'נקודות ייחוס — לחץ על מרחק (3 עד 30 מ׳) כדי להוסיף או להסיר'), 560, 50, 560); V.btns(box, [['נקה', () => { refs = []; draw(); }], ['הדוגמה של הקורס: 6 אקראיות', () => { const r = G.rng(1); refs = [...Array(6)].map(() => +(3 + 27 * r()).toFixed(1)); draw(); }], ['תרגיל 10.2: 10 ו־11', () => { refs = [10, 11]; draw(); }]]);
  const fx = flex(box); const cv = canvas(colm(fx, 'שגיאה יחסית בעומק (%) מול המרחק'), 560, 220, 560); const code = mono(box); const out = V.say(box);
  const relAt = Z => 5 / Z + 0.2 + curve * Math.log(Z) / 3;
  function draw() { const st = strip.getContext('2d'); st.clearRect(0, 0, 560, 50); const X = z => 20 + (z - 3) / 27 * 520; st.strokeStyle = '#adb5bd'; st.beginPath(); st.moveTo(20, 30); st.lineTo(540, 30); st.stroke(); [3, 5, 10, 15, 20, 25, 30].forEach(z => { st.beginPath(); st.moveTo(X(z), 26); st.lineTo(X(z), 34); st.stroke(); txt(st, String(z), X(z) - 5, 46, '#868e96', 10); }); refs.forEach(z => { st.fillStyle = '#e8590c'; st.beginPath(); st.arc(X(z), 30, 7, 0, 7); st.fill(); });
    const g = cv.getContext('2d'); g.clearRect(0, 0, 560, 220); if (refs.length < 2) { out.innerHTML = 'צריך לפחות שתי נקודות — שני נעלמים, s ו־b.'; code.textContent = ''; return; }
    const A = refs.map(z => [relAt(z) + 0.003 * G.randn(G.rng(Math.round(z * 100))), 1]), y = refs.map(z => 1 / z); const ata = [[0, 0], [0, 0]], aty = [0, 0]; A.forEach((r, i) => { for (let a = 0; a < 2; a++) { aty[a] += r[a] * y[i]; for (let b = 0; b < 2; b++) ata[a][b] += r[a] * r[b]; } }); const det = ata[0][0] * ata[1][1] - ata[0][1] * ata[1][0]; const s = (ata[1][1] * aty[0] - ata[0][1] * aty[1]) / det, b = (ata[0][0] * aty[1] - ata[1][0] * aty[0]) / det;
    const err = Zs.map((Z, i) => { const ze = 1 / (s * rels[i] + b); return ze > 0 ? Math.abs(ze - Z) / Z * 100 : 100; }); const Xe = z => 30 + (z - 3) / 27 * 520, Ye = e => 205 - Math.min(e, 40) / 40 * 190;
    g.strokeStyle = '#e9ecef'; [0, 5, 10, 20, 30, 40].forEach(e => { g.beginPath(); g.moveTo(30, Ye(e)); g.lineTo(552, Ye(e)); g.stroke(); txt(g, e + '%', 2, Ye(e) + 4, '#868e96', 10); }); g.strokeStyle = '#2f9e44'; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(30, Ye(5)); g.lineTo(552, Ye(5)); g.stroke(); g.setLineDash([]);
    Zs.forEach((Z, i) => { g.fillStyle = 'rgba(28,126,214,.45)'; g.fillRect(Xe(Z) - 1, Ye(err[i]) - 1, 2.5, 2.5); }); refs.forEach(z => { g.fillStyle = '#e8590c'; g.beginPath(); g.arc(Xe(z), 205, 5, 0, 7); g.fill(); });
    const bins = [[3, 10], [10, 20], [20, 30]].map(([a, c2]) => G.median(err.filter((e, i) => Zs[i] >= a && Zs[i] < c2))); const worst = Math.max(...bins); const ok = refs.length === 2 && worst < 5;
    code.textContent = 'A = np.c_[rel[idx], np.ones(' + refs.length + ')]\ns, b = np.linalg.lstsq(A, 1 / Z[idx], rcond=None)[0]       # s = ' + F(s, 3) + ', b = ' + F(b, 4) + '   (the model: 5 and 0.2, plus a slight curve)\nZ_est = 1 / (s * rel + b)\n# median relative error: 3-10 m ' + F(bins[0], 1) + '%,  10-20 m ' + F(bins[1], 1) + '%,  20-30 m ' + F(bins[2], 1) + '%';
    out.innerHTML = 'החציון בכל טווח: ' + bins.map((v, i) => ['3–10', '10–20', '20–30'][i] + ' מ׳: <b>' + F(v, 1) + '%</b>').join(', ') + '. ' + (refs.length === 2 && Math.abs(refs[0] - refs[1]) < 3 ? 'שתי נקודות קרובות זו לזו (כמו בתרגיל 10.2): ההתאמה רגישה לרעש שלהן, וההסקה הרחק מהן מתפוצצת. ' : '') + (ok ? badge(true, 'שתי נקודות, ופחות מ־5% בכל טווח.') + ' הסוד: נקודות ייחוס <b>בקצוות</b> של טווח המרחקים — אחת קרובה ואחת רחוקה. הקו מעוגן בשני הצדדים במקום "לנדנד" סביב נקודה אחת.' : 'אתגר: שתי נקודות בלבד, ופחות מ־5% חציון בכל טווח.') + ' (העיקום הקטן במודל המדומה הוא כמו במודל אמיתי: הפלט לא בדיוק לינארי בעומק ההפוך, ולכן גם עם הרבה נקודות נשארת שגיאה של כמה אחוזים.)'; }
  strip.addEventListener('click', e => { const [mx] = mouse(strip, e); const z = +clamp(3 + (mx - 20) / 520 * 27, 3, 30).toFixed(1); const k = refs.findIndex(r => Math.abs(r - z) < 0.8); if (k >= 0) refs.splice(k, 1); else refs.push(z); draw(); });
  draw();
};

/* ============================================================ chapter 11 — visual odometry and SLAM (simulated, like the course) */
const yardJS = (() => { const r = G.rng(77), o = []; for (let i = 0; i < 500; i++) { const side = Math.floor(r() * 4), s = -20 + 40 * r(), h = 4 * r(); o.push(side === 0 ? [s, 20, h] : side === 1 ? [s, -20, h] : side === 2 ? [20, s, h] : [-20, s, h]); } for (let i = 0; i < 400; i++) { const x = -19 + 38 * r(), y = -19 + 38 * r(), rr = Math.hypot(x, y); if (Math.abs(rr - 10) < 2.5) continue; o.push([x, y, 4 * r()]); } return o; })();   /* walls + posts and trees inside the yard (a single wall is a plane — degenerate for F) */
const circlePoses = n => { const out = []; for (let i = 0; i < n; i++) { const a = 2 * Math.PI * i / n; const C = [10 * Math.cos(a), 10 * Math.sin(a), 1.5]; const fwd = [-Math.sin(a), Math.cos(a), 0]; const la = G.lookAt(C, G.add(C, fwd)); out.push({ R: la.R, t: la.t, C }); } return out; };
/* SVD-based decomposition of E with the cheirality test (like recoverPose), on normalised coordinates */
function decomposeE(E, x1, x2) { const e = G.eigSym(G.mm(G.T(E), E)); const v1 = e.vecs[2], v2 = e.vecs[1]; let v3 = G.cross(v1, v2); const s1 = Math.sqrt(Math.max(e.vals[2], 1e-30)), s2 = Math.sqrt(Math.max(e.vals[1], 1e-30)); const u1 = G.mul(G.mv(E, v1), 1 / s1), u2 = G.mul(G.mv(E, v2), 1 / s2); const u3 = G.cross(u1, u2);
  const U = G.T([u1, u2, u3]), Vt = [v1, v2, v3]; const W = [[0, -1, 0], [1, 0, 0], [0, 0, 1]]; const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; let best = null;
  [G.mm(U, G.mm(W, Vt)), G.mm(U, G.mm(G.T(W), Vt))].forEach(Rc => { if (G.det3(Rc) < 0) Rc = Rc.map(r => r.map(v => -v)); [u3, G.mul(u3, -1)].forEach(tc => { const P1 = G.Pmat(I3, I3, [0, 0, 0]), P2 = G.Pmat(I3, Rc, tc); let front = 0; for (let i = 0; i < x1.length; i += 3) { const X = G.triangulate([P1, P2], [x1[i], x2[i]]); if (X[2] > 0 && G.toCam(Rc, tc, X)[2] > 0) front++; } if (!best || front > best.front) best = { R: Rc, t: tc, front }; }); }); return best; }
/* refine R, t (t of unit length) on the Sampson distance — what the five-point solvers + LMEDS achieve in OpenCV */
function refineRT(R0, t0, n1, n2) { const res = p => { const R = G.mm(G.rodrigues(p.slice(0, 3)), R0), t = G.unit(G.add(t0, p.slice(3))); const E = G.mm(G.skew(t), R); return n1.map((a, i) => { const x1 = [a[0], a[1], 1], x2 = [n2[i][0], n2[i][1], 1]; const Ex1 = G.mv(E, x1), Etx2 = G.mv(G.T(E), x2); const e = G.dot(x2, Ex1); return e / Math.sqrt(Ex1[0] ** 2 + Ex1[1] ** 2 + Etx2[0] ** 2 + Etx2[1] ** 2 + 1e-18); }); };
  let p = [0, 0, 0, 0, 0, 0], r = res(p), cost = r.reduce((s, v) => s + v * v, 0), lam = 1e-3;
  for (let it = 0; it < 15; it++) { const J = r.map(() => new Array(6)); for (let k = 0; k < 6; k++) { const q = p.slice(); q[k] += 1e-7; const r2 = res(q); r2.forEach((v, i) => { J[i][k] = (v - r[i]) / 1e-7; }); }
    const A = [...Array(6)].map((_, i) => [...Array(6)].map((_, j) => J.reduce((s, row) => s + row[i] * row[j], 0) + (i === j ? lam * (1 + J.reduce((s, row) => s + row[i] * row[i], 0)) : 0))); const g = [...Array(6)].map((_, i) => -J.reduce((s, row, k) => s + row[i] * r[k], 0)); const dx = V.solve(A, g); if (!dx) break; const q = p.map((v, i) => v + dx[i]); const rn = res(q); const cn = rn.reduce((s, v) => s + v * v, 0); if (cn < cost) { p = q; r = rn; const gain = cost - cn; cost = cn; lam /= 10; if (gain < 1e-14) break; } else lam *= 10; }
  return { R: G.mm(G.rodrigues(p.slice(0, 3)), R0), t: G.unit(G.add(t0, p.slice(3))) }; }
function runVO(opt) { const n = 120, P = circlePoses(n), r = G.rng(opt.seed || 1), Ki = G.inv3(K3); let Rw = P[0].R.map(x => x.slice()), C = P[0].C.slice(); const est = [C.slice()];
  for (let i = 0; i < n - 1; i++) { const a = P[i], b = P[(i + 1) % n]; const u1 = [], u2 = []; yardJS.forEach(X => { const p = G.project(K3, a.R, a.t, X), q = G.project(K3, b.R, b.t, X); if (!p || !q || p[0] < 0 || p[0] > W3 || p[1] < 0 || p[1] > H3 || q[0] < 0 || q[0] > W3 || q[1] < 0 || q[1] > H3) return; u1.push([p[0] + opt.noise * G.randn(r), p[1] + opt.noise * G.randn(r)]); u2.push([q[0] + opt.noise * G.randn(r), q[1] + opt.noise * G.randn(r)]); });
    const F = eightPoint(u1, u2).F; const E = G.mm(G.T(K3), G.mm(F, K3)); const n1 = u1.map(u => { const v = G.mv(Ki, [u[0], u[1], 1]); return [v[0], v[1]]; }), n2 = u2.map(u => { const v = G.mv(Ki, [u[0], u[1], 1]); return [v[0], v[1]]; }); let d = decomposeE(E, n1, n2); if (opt.noise > 0 && !opt.raw) d = refineRT(d.R, d.t, n1, n2);
    let scale = G.norm(G.sub(b.C, a.C)); if (opt.scale === 'none') scale = 1; else if (opt.scale === 'random') scale *= 1 + 0.02 * G.randn(r); else if (opt.scale === 'bias') scale *= 1.02;
    Rw = G.mm(d.R, Rw); C = G.sub(C, G.mv(G.T(Rw), G.mul(d.t, scale))); est.push(C.slice()); }
  return { est, truth: P.map(p => p.C).concat([P[0].C]) }; }

/* the trajectories were computed with OpenCV (findEssentialMat + LMEDS, recoverPose; solvePnP) exactly like the course code — content/m3_lab11data.js */
const voData = (noise, scale, seed) => { const D = window.M3LAB11; if (!D) return null; const e = D.vo[noise + '|' + scale + '|' + seed]; return e ? { est: e.map(p => [p[0], p[1], 0]), truth: D.truth.map(p => [p[0], p[1], 0]) } : null; };
/* ============================================================ 11.1 — visual odometry by hand */
W.w3_vo = function (box) {
  V.say(box, 'הסימולציה של הסעיף, כאן בדפדפן: מצלמה נוסעת במעגל ברדיוס 10 מטר בחצר מוקפת קירות עם 500 נקודות, 120 פריימים. בין כל שני פריימים — מטריצה חיונית מההתאמות (<code class="ltr">findEssentialMat</code> עם LMEDS, כמו בקוד של הסעיף; המסלולים חושבו מראש ב־OpenCV), פירוק לסיבוב ולכיוון תזוזה, ושרשור. <b>בחר רעש ומקור לקנה המידה</b> ו<b>לחץ "סע"</b>: המסלול המשוער (כתום) נבנה צעד אחר צעד מול האמיתי (אפור).');
  let noise = 0.5, scale = 'true', res = null, k = 0, timer = null;
  V.tabs(box, ['בלי רעש', 'רעש 0.5 פיקסל', 'רעש 1', 'רעש 2'], i => { noise = [0, 0.5, 1, 2][i]; res = null; draw(); }, 1);
  V.tabs(box, ['קנה מידה מחיישן מדויק', 'בלי קנה מידה (1 בכל צעד)', 'שגיאה אקראית של 2%', 'הטיה קבועה של 2%'], i => { scale = ['true', 'none', 'random', 'bias'][i]; res = null; draw(); });
  V.btns(box, [['▶ סע', () => { res = voData(noise, scale, 0); if (!res) { out.innerHTML = 'הנתונים של הסימולציה לא נטענו.'; return; } k = 0; clearInterval(timer); timer = setInterval(() => { if (!document.body.contains(box)) { clearInterval(timer); return; } k = Math.min(k + 3, 119); draw(); if (k >= 119) clearInterval(timer); }, 30); }, 'primary']]);
  const fx = flex(box); const cv = canvas(colm(fx, 'מלמעלה: החצר, המסלול האמיתי והמשוער'), 380, 380, 380); const tb = el('div', { style: { minWidth: '300px' } }); fx.appendChild(tb); const out = V.say(box); const rows = {};
  function draw() { const x = cv.getContext('2d'); x.fillStyle = '#f8f9fa'; x.fillRect(0, 0, 380, 380); const sc = scale === 'none' && res ? 380 / Math.max(60, 2.6 * Math.max(...res.est.map(p => Math.hypot(p[0], p[1])))) : 8.5; const P = p => [190 + p[0] * sc, 190 - p[1] * sc]; const yard = window.M3LAB11 ? window.M3LAB11.pts : [];
    if (scale !== 'none' || !res) { x.fillStyle = '#ced4da'; yard.forEach(p => { const q = P(p); x.fillRect(q[0] - 1, q[1] - 1, 2, 2); }); }
    x.strokeStyle = '#adb5bd'; x.lineWidth = 2; x.beginPath(); for (let a = 0; a <= 6.3; a += 0.05) { const q = P([10 * Math.cos(a), 10 * Math.sin(a)]); a ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]); } x.stroke();
    if (res) { x.strokeStyle = '#e8590c'; x.lineWidth = 2.5; x.beginPath(); res.est.slice(0, k + 1).forEach((p, i) => { const q = P(p); i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]); }); x.stroke(); const q = P(res.est[k]); x.fillStyle = '#e8590c'; x.beginPath(); x.arc(q[0], q[1], 5, 0, 7); x.fill(); const q0 = P(res.truth[0]); x.fillStyle = '#212529'; x.beginPath(); x.arc(q0[0], q0[1], 5, 0, 7); x.fill(); }
    if (!res) { out.innerHTML = 'לחץ "סע".'; tb.innerHTML = Object.keys(rows).length ? table(['רעש', 'קנה מידה', 'שגיאה בסוף', 'מקסימלית', 'מהמסלול'], Object.values(rows)) : ''; return; }
    const errs = res.est.map((p, i) => G.norm(G.sub(p, res.truth[i]))); const endE = G.norm(G.sub(res.est[119], res.truth[119])); const maxE = Math.max(...errs.slice(0, k + 1)); const L = 2 * Math.PI * 10 * 119 / 120;
    const len = res.est.reduce((a, p, i) => i ? a + G.norm(G.sub(p, res.est[i - 1])) : 0, 0);
    if (k >= 119) rows[noise + scale] = [F(noise, 1) + ' px', { true: 'מדויק', none: 'בלי', random: 'אקראי 2%', bias: 'הטיה 2%' }[scale], scale === 'none' ? '—' : F(endE, 2) + ' מ׳', scale === 'none' ? '—' : F(Math.max(...errs), 2) + ' מ׳', scale === 'none' ? '—' : F(endE / L * 100, 1) + '%'];
    tb.innerHTML = table(['רעש', 'קנה מידה', 'שגיאה בסוף', 'מקסימלית', 'מהמסלול'], Object.values(rows));
    out.innerHTML = 'פריים ' + (k + 1) + ' מתוך 120. ' + (scale === 'none' ? 'בלי קנה מידה, כל צעד באורך 1 "יחידה": המסלול באורך <b>' + F(len, 0) + ' יחידות</b> במקום ' + F(L, 0) + ' מטר. הצורה — מעגל — נכונה; הגודל חסר משמעות. זו עמימות קנה המידה של מצלמה אחת (פרק 8.2).' : 'שגיאה עכשיו: <b>' + F(errs[k], 2) + ' מ׳</b>, מקסימלית עד כאן ' + F(maxE, 2) + '. ' + (k >= 119 ? 'בסוף ההקפה: <b>' + F(endE, 2) + ' מ׳</b> מנקודת ההתחלה — ' + F(endE / L * 100, 1) + '% מהמסלול. ' + (scale === 'bias' ? 'שים לב: הטיה קבועה כמעט לא פוגעת בנקודת הסוף — מעגל מוגדל ב־2% חוזר לנקודת ההתחלה. השגיאה המקסימלית, באמצע, חושפת אותה (תרגיל 11.2).' : 'כל צעד מוסיף שגיאה קטנה בכיוון, והיא מסובבת את כל ההמשך — לכן הסטייה גדלה עם המסלול ולא נשארת קבועה.') : '')) + (noise === 0 ? ' בלי רעש — אפס, עד עיגול.' : ''); }
  draw();
};

/* ============================================================ 11.2 — what SLAM adds */
W.w3_loop_closure = function (box) {
  V.say(box, 'שלושה דברים שמערכת SLAM מוסיפה, על אותה סימולציה. <b>סגירת לולאה</b>: בסוף ההקפה המערכת מזהה שחזרה להתחלה, ומפזרת את הפער לאורך המסלול (תרגיל 11.3). <b>מעקב מול מפה</b>: במקום להשוות לפריים הקודם, כל פריים ממוקם מול נקודות ידועות של המפה עם PnP — ושגיאה לא עוברת הלאה. <b>החלף הרצה</b> כדי לראות שהתיקון הלינארי לא תמיד עוזר למקסימום.');
  let seed = 0, mode = 0, noise = 2;
  V.tabs(box, ['סגירת לולאה לינארית', 'מעקב מול מפה (PnP)'], i => { mode = i; draw(); });
  V.tabs(box, ['רעש 0.5 פיקסל', 'רעש 1', 'רעש 2'], i => { noise = [0.5, 1, 2][i]; draw(); }, 2); V.btns(box, [['🎲 הרצה אחרת (3 הרצות)', () => { seed++; draw(); }]]);
  const fx = flex(box); const cv = canvas(colm(fx, 'מלמעלה'), 380, 380, 380); const cE = canvas(colm(fx, 'שגיאה לאורך המסלול (מ׳)'), 320, 200, 320); const out = V.say(box);
  function draw() { const res = voData(noise, 'true', seed % 3); if (!res) { out.innerHTML = 'הנתונים של הסימולציה לא נטענו.'; return; } const T = res.est.length; const gap = G.sub(res.est[T - 1], res.truth[T - 1]); let alt;
    if (mode === 0) alt = res.est.map((p, i) => G.sub(p, G.mul(gap, i / (T - 1))));
    else alt = window.M3LAB11.pnp[noise + '|' + (seed % 3)];
    const x = cv.getContext('2d'); x.fillStyle = '#f8f9fa'; x.fillRect(0, 0, 380, 380); const P = p => [190 + p[0] * 8.5, 190 - p[1] * 8.5]; x.fillStyle = '#ced4da'; (window.M3LAB11 ? window.M3LAB11.pts : []).forEach(p => { const q = P(p); x.fillRect(q[0] - 1, q[1] - 1, 2, 2); });
    const line = (pts, col, w, dash) => { x.strokeStyle = col; x.lineWidth = w; x.setLineDash(dash || []); x.beginPath(); pts.forEach((p, i) => { const q = P(p); i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]); }); x.stroke(); x.setLineDash([]); };
    line(res.truth, '#adb5bd', 2); line(res.est, '#e8590c', 2, [5, 3]); line(alt, '#2f9e44', 2.5); const a = P(res.est[T - 1]), b = P(res.truth[T - 1]); x.strokeStyle = '#c92a2a'; x.lineWidth = 3; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke();
    const e1 = res.est.map((p, i) => G.norm(G.sub(p, res.truth[i]))), e2 = alt.map((p, i) => G.norm(G.sub(p, res.truth[i]))); const mean = a2 => a2.reduce((s, v) => s + v, 0) / a2.length;
    const g = cE.getContext('2d'); g.clearRect(0, 0, 320, 200); const mx = Math.max(...e1, ...e2, 0.5); const X = i => 25 + i / (T - 1) * 290, Y = v => 185 - v / mx * 170; g.strokeStyle = '#dee2e6'; g.beginPath(); g.moveTo(25, 185); g.lineTo(318, 185); g.stroke(); txt(g, F(mx, 1), 2, 20, '#868e96', 10);
    [[e1, '#e8590c'], [e2, '#2f9e44']].forEach(([arr, col]) => { g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); arr.forEach((v, i) => i ? g.lineTo(X(i), Y(v)) : g.moveTo(X(i), Y(v))); g.stroke(); });
    out.innerHTML = 'כתום מקווקו — ניווט חזותי; אדום — הפער בסוף ההקפה; ירוק — ' + (mode === 0 ? 'אחרי סגירת לולאה לינארית' : 'מעקב מול המפה') + '. שגיאה ממוצעת: <b>' + F(mean(e1), 2) + ' ← ' + F(mean(e2), 2) + '</b> מ׳; מקסימלית: <b>' + F(Math.max(...e1), 2) + ' ← ' + F(Math.max(...e2), 2) + '</b>. ' + (mode === 0 ? 'התיקון מאפס את הפער בסוף ומפזר אותו <i>שווה בשווה</i> — לא לפי המקום שבו השגיאה באמת נוצרה. לכן התוצאה תלויה בהרצה: בקורס הממוצע השתפר בשלוש ההרצות והמקסימום לא תמיד; כאן תמצא גם הרצה שבה התיקון <i>מקלקל</i> — כשהשגיאה נוצרה בעיקר בהתחלה, ולא התפזרה באופן שווה. מערכות אמיתיות משתמשות באופטימיזציה של גרף, שמשקללת כל קשר בין פריימים לפי הוודאות שלו.' : 'כשהמיקום של כל פריים נקבע מול נקודות ידועות, הרעש של פריים אחד לא עובר לבא אחריו: השגיאה <b>לא מצטברת</b> — היא קטנה ויציבה לכל אורך המסלול. (כאן המפה ידועה מראש עם רעש של 2 ס״מ, ו־40 נקודות בכל פריים; ב־SLAM אמיתי היא נבנית בטריאנגולציה תוך כדי, ומשופרת בהתאמת צרורות.)'); }
  draw();
};

/* ============================================================ chapter 12 — the project: from pixel to metres */
const KD = G.K(1400, 960, 540), WD = 1920, HD = 1080, DISTD = [-0.12, 0.05, 0, 0, 0];
const droneCam = (C, yaw, pitch, roll) => { const R = G.attitude(yaw, pitch, roll || 0); return { K: KD, R, t: G.mul(G.mv(R, C), -1), W: WD, H: HD, C, dist: DISTD }; };
/* pixel_to_ground of section 12.2: undistort, ray, rotate to the world, cut the plane Z = gz */
function px2g(cam, uv, gz, noUndist) { const n = noUndist ? toN(cam.K, uv) : G.undistortIter(toN(cam.K, uv), cam.dist, 30).pop(); const rw = G.mv(G.T(cam.R), [n[0], n[1], 1]); const s = ((gz || 0) - cam.C[2]) / rw[2]; if (!(s > 0)) return null; return G.add(cam.C, G.mul(rw, s)); }
const projD3 = (cam, P) => { const q = G.project(cam.K, cam.R, cam.t, P, cam.dist); return q ? [q[0], q[1]] : null; };
const CARS12 = [[1.75, 10], [-1.75, 24], [1.75, 38], [-1.75, 60], [1.75, 95], [12.5, 35], [18.5, 55]];

/* ============================================================ 12.1 — what we build: the pipeline step by step */
W.w3_pipeline = function (box) {
  V.say(box, 'כל הדרך מפיקסל למטרים, בשישה צעדים — כל אחד מפרק אחר במודול. רחפן בגובה 50 מטר (‏K, עיוות וזוויות כמו בסעיף 12.4). <b>לחץ על רכב</b> בתמונה (על הנקודה שנוגעת בכביש), ו<b>עבור על הצעדים</b>: בכל צעד המספרים האמיתיים של החישוב.');
  const world = world3(); const cam = droneCam([-12, -25, 50], 25, -55); let uv = null, step = 0;
  const fx = flex(box); const cv = canvas(colm(fx, 'התמונה מהרחפן (1920 × 1080) — לחץ על רכב'), 480, 270, 480); const cM = canvas(colm(fx, 'המפה'), 200, 270, 200);
  const st = row(box); const STEPS = ['1. פיקסל', '2. ביטול עיוות (פרק 4)', '3. ביטול K (פרק 2)', '4. קרן בעולם (פרק 3)', '5. חיתוך עם הקרקע (פרק 6)', '6. מטרים על המפה'];
  const tabs = V.tabs(st, STEPS, k => { step = k; draw(); }); const code = mono(box); const out = V.say(box);
  function draw() { const x = cv.getContext('2d'); const r = render3(x, cam, world); const m = groundMap(cM, -25, 40, -10, 100, world);
    const cp = m.P(cam.C[0], cam.C[1]); m.x.fillStyle = '#212529'; m.x.beginPath(); m.x.arc(cp[0], cp[1], 5, 0, 7); m.x.fill();
    if (!uv) { code.textContent = '# click on a car in the image (on the point where it touches the road)'; out.innerHTML = 'לחץ על רכב.'; return; }
    x.strokeStyle = '#e8590c'; x.lineWidth = 2.5; x.beginPath(); x.arc(uv[0] * r.s, uv[1] * r.s, 7, 0, 7); x.stroke();
    const nd = toN(KD, uv); const nu = G.undistortIter(nd, DISTD, 30).pop(); const pu = toP(KD, nu); const rc = [nu[0], nu[1], 1]; const rw = G.mv(G.T(cam.R), rc); const s = (0 - cam.C[2]) / rw[2]; const P = s > 0 ? G.add(cam.C, G.mul(rw, s)) : null;
    if (step >= 1) { x.fillStyle = '#2f9e44'; x.beginPath(); x.arc(pu[0] * r.s, pu[1] * r.s, 4, 0, 7); x.fill(); }
    if (P && step >= 3) { const q = m.P(P[0], P[1]); m.x.strokeStyle = '#e8590c'; m.x.lineWidth = 2; m.x.setLineDash(step >= 4 ? [] : [4, 3]); m.x.beginPath(); m.x.moveTo(cp[0], cp[1]); m.x.lineTo(q[0], q[1]); m.x.stroke(); m.x.setLineDash([]); if (step >= 4) { m.x.fillStyle = '#e8590c'; m.x.beginPath(); m.x.arc(q[0], q[1], 5, 0, 7); m.x.fill(); } }
    const near = P ? CARS12.reduce((b, c) => Math.hypot(c[0] - P[0], c[1] - P[1]) < Math.hypot(b[0] - P[0], b[1] - P[1]) ? c : b) : null;
    const lines = ['uv = (' + F(uv[0], 1) + ', ' + F(uv[1], 1) + ')                          # the pixel of the detection',
      'distorted normalised  (' + F(nd[0], 4) + ', ' + F(nd[1], 4) + ')  ->  undistorted (' + F(nu[0], 4) + ', ' + F(nu[1], 4) + ')   # pixel without distortion: (' + F(pu[0], 1) + ', ' + F(pu[1], 1) + ')',
      'ray_cam = (x, y, 1) = (' + F(nu[0], 4) + ', ' + F(nu[1], 4) + ', 1)',
      'ray_w = R.T @ ray_cam = (' + rw.map(v => F(v, 4)).join(', ') + ')      # down: z < 0',
      's = (0 - C_z) / ray_w_z = (0 - ' + F(cam.C[2], 1) + ') / ' + F(rw[2], 4) + ' = ' + F(s, 2),
      P ? 'P = C + s * ray_w = (' + P.map(v => F(v, 2)).join(', ') + ')' : 'no ground point (above the horizon)'];
    code.textContent = lines.slice(0, step + 1).join('\n');
    out.innerHTML = ['הפיקסל — מה שהמזהה מחזיר. עדיין רק "איפה בתמונה".', 'העדשה מעקמת: הפיקסל האמיתי (ירוק) זז ' + F(Math.hypot(pu[0] - uv[0], pu[1] - uv[1]), 1) + ' פיקסלים. בשוליים — עשרות.', 'מפיקסלים לכיוון: <span class="ltr">(x, y, 1)</span>. מכאן זה <b>קרן</b> — כל העומקים אפשריים.', 'הקרן בעולם: ‏‎Rᵀ‎ מסובבת אותה מהמערכת של המצלמה למזרח־צפון־למעלה. הרכיב האנכי שלילי — היא יורדת.', 'הקרן פוגשת את הקרקע אחרי ' + F(s, 1) + ' מטר לאורכה. <b>כאן, ורק כאן, העומק נקבע</b> — מההנחה שהנקודה על הקרקע.', P ? 'המיקום על המפה: ' + ltr('(' + F(P[0], 2) + ', ' + F(P[1], 2) + ')') + ' — ' + (near && Math.hypot(near[0] - P[0], near[1] - P[1]) < 3.5 ? 'בתוך המלבן של רכב שמרכזו ב־' + ltr('(' + near[0] + ', ' + near[1] + ')') + '. ' : '') + 'מכאן — מרחקים, מהירויות, מפה.' : 'הפיקסל מעל האופק — אין מיקום.'][step]; }
  cv.addEventListener('click', e => { const [mx, my] = mouse(cv, e); uv = [mx / 480 * WD, my / 480 * WD]; draw(); });
  uv = projD3(cam, [1.75, 35.75, 0]); draw();
};

/* ============================================================ 12.2 — the heart: pixel to ground */
W.w3_px2ground = function (box) {
  V.say(box, '<code class="ltr">pixel_to_ground</code> חי. <b>לחץ בכל מקום</b> בתמונה: הנקודה על הקרקע מסומנת במפה. ואז <b>לחץ על הגג</b> של רכב: ההטלה ל־Z = 0 שמה אותו רחוק מדי (פרק 6.4). <b>שנה את גובה המישור</b> ל־1.45 (גובה הגג) — והוא חוזר למקום (תרגיל 12.3: מטילים למישור שבו הנקודה באמת נמצאת). והאפשרות השלישית: לשכוח את העיוות.');
  const world = world3(); const cam = droneCam([-12, -25, 50], 25, -55); let uv = projD3(cam, [1.75, 36.25, 1.45]), gz = 0, noU = false;
  const r1 = row(box); V.slider(r1, 'גובה המישור ground_z (מ׳)', 0, 3, 0.05, gz, v => { gz = v; draw(); }); const c = el('label', { style: { margin: '0 8px' }, html: '<input type="checkbox"> 🐞 בלי ביטול עיוות' }); c.querySelector('input').onchange = e => { noU = e.target.checked; draw(); }; r1.appendChild(c);
  const fx = flex(box); const cv = canvas(colm(fx, 'לחץ'), 480, 270, 480); const cM = canvas(colm(fx, 'המפה'), 200, 270, 200); const code = mono(box); const out = V.say(box);
  function draw() { const x = cv.getContext('2d'); const r = render3(x, cam, world); const m = groundMap(cM, -25, 40, -10, 100, world); x.strokeStyle = '#e8590c'; x.lineWidth = 2.5; x.beginPath(); x.arc(uv[0] * r.s, uv[1] * r.s, 7, 0, 7); x.stroke();
    const P = px2g(cam, uv, gz, noU); const hit = rayHit(world, Object.assign({}, cam, { dist: null }), toP(KD, G.undistortIter(toN(KD, uv), DISTD, 30).pop()));
    if (P) { const q = m.P(P[0], P[1]); m.x.fillStyle = '#e8590c'; m.x.beginPath(); m.x.arc(q[0], q[1], 5, 0, 7); m.x.fill(); } if (hit) { const q = m.P(hit[0], hit[1]); m.x.strokeStyle = '#2f9e44'; m.x.lineWidth = 2; m.x.beginPath(); m.x.arc(q[0], q[1], 7, 0, 7); m.x.stroke(); }
    const err = P && hit ? Math.hypot(P[0] - hit[0], P[1] - hit[1]) : NaN;
    code.textContent = 'P = pixel_to_ground([[' + F(uv[0], 0) + ', ' + F(uv[1], 0) + ']], K, ' + (noU ? 'np.zeros(5)' : 'dist') + ', R, C, ground_z=' + F(gz, 2) + ')\n#   = ' + (P ? '(' + P.map(v => F(v, 2)).join(', ') + ')' : 'nan (above the horizon)') + '\n# what the pixel really shows: (' + (hit ? hit.map(v => F(v, 2)).join(', ') : '?') + ')   error ' + F(err, 2) + ' m';
    out.innerHTML = 'עיגול ירוק — מה שהפיקסל באמת מראה (הנקודה הראשונה שהקרן פוגעת בה); כתום — מה ש־' + ltr('pixel_to_ground') + ' מחזירה. שגיאה: <b>' + F(err, 2) + ' מ׳</b>. ' + (hit && hit[2] > 0.3 && Math.abs(gz - hit[2]) > 0.2 ? 'הפיקסל הוא של נקודה <b>בגובה ' + F(hit[2], 2) + ' מטר</b>, וההטלה לגובה ' + F(gz, 2) + ' שמה אותה במקום הלא נכון — לאורך הקרן. ' : '') + (hit && Math.abs(gz - hit[2]) <= 0.2 && !noU ? badge(true, 'המישור בגובה הנכון — ההטלה מדויקת.') + ' ' : '') + (noU ? 'בלי ביטול עיוות — במרכז כמעט כלום, בפינות מטרים (נסה לחוץ בפינה).' : ''); }
  cv.addEventListener('click', e => { const [mx, my] = mouse(cv, e); uv = [mx / 480 * WD, my / 480 * WD]; draw(); });
  draw();
};

/* ============================================================ 12.3 — drone angles and the footprint */
W.w3_footprint = function (box) {
  V.say(box, 'הרחפן מדווח גובה, כיוון (yaw) והטיה (pitch). מהם בונים R — ומהם יוצא <b>השטח שהמצלמה מכסה על הקרקע</b> (הטביעה). <b>שנה את הזוויות והגובה</b>: הטביעה במפה, התמונה, וגודל הפיקסל על הקרקע בתחתית ובחלק העליון של התמונה. הרם את המצלמה עד שהחלק העליון של התמונה עובר את האופק.');
  let h = 50, yaw = 30, pitch = -60, roll = 0;
  const r1 = row(box), r2 = row(box); V.slider(r1, 'גובה (מ׳)', 10, 150, 1, h, v => { h = v; draw(); }); V.slider(r1, 'yaw (°)', -180, 180, 1, yaw, v => { yaw = v; draw(); }); V.slider(r2, 'pitch (°)', -90, -5, 1, pitch, v => { pitch = v; draw(); }); V.slider(r2, 'roll (°)', -20, 20, 1, roll, v => { roll = v; draw(); });
  const fx = flex(box); const cv = canvas(colm(fx, 'מה שהמצלמה רואה'), 400, 225, 400); const cM = canvas(colm(fx, 'הטביעה על הקרקע (מלמעלה)'), 260, 260, 260); const code = mono(box); const out = V.say(box); const world = world3();
  function draw() { const cam = droneCam([0, -h * 0.3, h], yaw, pitch, roll); render3(cv.getContext('2d'), Object.assign({}, cam, { dist: null }), world);
    const m = cM.getContext('2d'); m.fillStyle = '#e9f5e1'; m.fillRect(0, 0, 260, 260); const span = Math.max(80, h * 3.5); const P = (X, Y) => [130 + (X - cam.C[0]) / span * 260, 200 - (Y - cam.C[1]) / span * 260];
    m.strokeStyle = '#ced4da'; for (let g = -1000; g <= 1000; g += 20) { const a = P(g, -1000), b = P(g, 1000), c2 = P(-1000, g), d = P(1000, g); m.beginPath(); m.moveTo(a[0], a[1]); m.lineTo(b[0], b[1]); m.moveTo(c2[0], c2[1]); m.lineTo(d[0], d[1]); m.stroke(); }
    const edge = []; let above = false; const ptsE = []; for (let k = 0; k <= 40; k++) { const t = k / 10; let uv; if (t <= 1) uv = [t * WD, HD]; else if (t <= 2) uv = [WD, HD - (t - 1) * HD]; else if (t <= 3) uv = [WD - (t - 2) * WD, 0]; else uv = [0, (t - 3) * HD]; const g = px2g(Object.assign({}, cam), uv, 0, true); if (!g || G.norm(G.sub(g, cam.C)) > 3000) { above = true; continue; } ptsE.push(g); }
    m.fillStyle = 'rgba(28,126,214,.25)'; m.strokeStyle = '#1c7ed6'; m.lineWidth = 2; m.beginPath(); ptsE.forEach((g, i) => { const q = P(g[0], g[1]); i ? m.lineTo(q[0], q[1]) : m.moveTo(q[0], q[1]); }); m.closePath(); m.fill(); m.stroke();
    const cp = P(cam.C[0], cam.C[1]); m.fillStyle = '#212529'; m.beginPath(); m.arc(cp[0], cp[1], 5, 0, 7); m.fill(); txt(m, 'רשת: 20 מ׳', 6, 254, '#868e96', 10);
    const gsd = v => { const a = px2g(cam, [WD / 2, v], 0, true), b = px2g(cam, [WD / 2 + 1, v], 0, true), c2 = px2g(cam, [WD / 2, v + 1], 0, true); return a && b && c2 ? [G.norm(G.sub(a, b)), G.norm(G.sub(a, c2)), G.norm(G.sub(a, cam.C))] : null; };
    const gb = gsd(HD - 1), gc = gsd(HD / 2), gt = gsd(1); const R = cam.R;
    code.textContent = 'R = R_from_attitude(' + yaw + ', ' + pitch + ', ' + roll + ') = ' + fmtM(R.map(r => r.map(v => +v.toFixed(3)))) + '\n# rows: right, down, forward (in east-north-up)\n# one pixel on the ground (across x along):  bottom ' + (gb ? F(gb[0] * 100, 1) + ' x ' + F(gb[1] * 100, 1) + ' cm' : '—') + '   centre ' + (gc ? F(gc[0] * 100, 1) + ' x ' + F(gc[1] * 100, 1) + ' cm' : '—') + '   top ' + (gt ? F(gt[0] * 100, 1) + ' x ' + F(gt[1] * 100, 1) + ' cm' : 'above the horizon');
    out.innerHTML = (above ? '<b style="color:#c92a2a">חלק מהתמונה מעל האופק</b> — שם אין קרקע, והטביעה "פתוחה" למעלה. ' : '') + (pitch === -90 ? 'מבט ישר למטה: הטביעה מלבן, וכל פיקסל מכסה כמעט אותו שטח — ' + (gc ? F(gc[0] * 100, 1) : '?') + ' ס״מ. (‏' + ltr('R_from_attitude') + ' עובדת גם כאן, בניגוד ל־' + ltr('look_at') + ' — תרגיל 3.3.) ' : 'מבט אלכסוני: הטביעה <b>טרפז</b> — צר קרוב, רחב רחוק. פיקסל בתחתית מכסה ' + (gb ? F(gb[1] * 100, 1) : '?') + ' ס״מ לאורך הקרקע, ובחלק העליון ' + (gt ? F(gt[1] * 100, 0) + ' ס״מ' : '—') + ' — וכל שגיאה בפיקסל או בזווית מתנפחת באותו יחס.') + ' <b>אזהרה מהסעיף:</b> לכל יצרן מוסכמה משלו (סדר הסיבובים, סימן ההטיה, ‏ENU מול NED). מצלמים נקודה ידועה ובודקים.'; }
  draw();
};

/* ============================================================ 12.4 — the error budget */
W.w3_budget = function (box) {
  V.say(box, 'הניסוי של הסעיף: רחפן בגובה 50 מטר, מצלמה 1920 על 1080, ‏yaw 30°, ‏pitch −60°, ונקודות קרקע אקראיות בשדה הראייה. מטילים אותן לתמונה ומחזירים לקרקע — עם <b>שגיאה אחת בכל פעם</b>. <b>הזז את המחוונים</b> כדי לבנות את התקציב של המערכת שלך, ובדוק איזו שגיאה שולטת — ואיפה בשדה.');
  let sPx = 1, sPitch = 1, sYaw = 1, sH = 1, noDist = true, tab = 0;
  V.tabs(box, ['תקציב', 'מרחק בין שני עצמים'], k => { tab = k; draw(); });
  const r1 = row(box), r2 = row(box); V.slider(r1, 'זיהוי (פיקסלים)', 0, 5, 0.5, sPx, v => { sPx = v; draw(); }); V.slider(r1, 'pitch (°)', 0, 3, 0.1, sPitch, v => { sPitch = v; draw(); }); V.slider(r2, 'yaw (°)', 0, 3, 0.1, sYaw, v => { sYaw = v; draw(); }); V.slider(r2, 'גובה (מ׳)', 0, 5, 0.1, sH, v => { sH = v; draw(); });
  const c = el('label', { style: { margin: '0 8px' }, html: '<input type="checkbox" checked> לכלול "שכחנו עיוות"' }); c.querySelector('input').onchange = e => { noDist = e.target.checked; draw(); }; r2.appendChild(c);
  const fx = flex(box); const cB = canvas(colm(fx, 'שגיאה חציונית על הקרקע (מ׳) לכל מקור'), 340, 230, 340); const cM = canvas(colm(fx, 'איפה בשדה: שגיאת pitch לכל נקודה'), 260, 230, 260); const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  const base = droneCam([0, 0, 50], 30, -60); const r = G.rng(0); const Gp = []; for (let i = 0; i < 500; i++) { const P = [-40 + 80 * r(), -10 + 100 * r(), 0]; const q = projD3(base, P); if (q && q[0] > 0 && q[0] < WD && q[1] > 0 && q[1] < HD) Gp.push({ P, uv: q }); }
  const med = arr => G.median(arr);
  function errs(kind, v) { const rr = G.rng(5); return Gp.map(g => { let cam = base, uv = g.uv, noU = false; if (kind === 'px') uv = [uv[0] + v * G.randn(rr), uv[1] + v * G.randn(rr)]; if (kind === 'pitch') cam = droneCam([0, 0, 50], 30, -60 + v); if (kind === 'yaw') cam = droneCam([0, 0, 50], 30 + v, -60); if (kind === 'h') cam = droneCam([0, 0, 50 + v], 30, -60); if (kind === 'dist') noU = true; const P = px2g(cam, uv, 0, noU); return P ? Math.hypot(P[0] - g.P[0], P[1] - g.P[1]) : NaN; }); }
  function draw() { const src = [['זיהוי', 'px', sPx, '#1c7ed6'], ['pitch', 'pitch', sPitch, '#e8590c'], ['yaw', 'yaw', sYaw, '#f08c00'], ['גובה', 'h', sH, '#7048e8']].concat(noDist ? [['עיוות', 'dist', 1, '#c2255c']] : []);
    const res = src.map(([n, k, v, col]) => { const e = errs(k, v); return { n, k, v, col, e, med: med(e), max: Math.max(...e.filter(isFinite)) }; });
    const x = cB.getContext('2d'); x.clearRect(0, 0, 340, 230); const mx = Math.max(0.5, ...res.map(q => q.med)); res.forEach((q, i) => { const w = q.med / mx * 190; x.fillStyle = q.col; x.fillRect(100, 18 + i * 40, w, 26); txt(x, q.n, 92, 36 + i * 40, '#495057', 12, 'right'); txt(x, F(q.med, 2), 104 + w, 36 + i * 40, '#212529', 11); });
    const pe = res.find(q => q.k === 'pitch'); const m = cM.getContext('2d'); m.fillStyle = '#f8f9fa'; m.fillRect(0, 0, 260, 230); const mp = (X, Y) => [130 + X * 2.4, 215 - (Y + 10) * 2.05]; const emax = Math.max(...pe.e.filter(isFinite), 0.01);
    Gp.forEach((g, i) => { const t = clamp(pe.e[i] / emax, 0, 1); const q = mp(g.P[0], g.P[1]); m.fillStyle = 'rgb(' + Math.round(255 * t) + ',' + Math.round(140 * (1 - t) + 60) + ',' + Math.round(220 * (1 - t)) + ')'; m.beginPath(); m.arc(q[0], q[1], 2.8, 0, 7); m.fill(); }); const cp = mp(0, 0); m.fillStyle = '#212529'; m.beginPath(); m.arc(cp[0], cp[1], 5, 0, 7); m.fill(); txt(m, 'רחפן', cp[0] + 7, cp[1] + 4, '#212529', 10);
    const byd = [[0, 30], [30, 60], [60, 200]].map(([a, b]) => G.median(pe.e.filter((e, i) => { const d = Math.hypot(Gp[i].P[0], Gp[i].P[1]); return d >= a && d < b; })));
    if (tab === 0) { tb.innerHTML = table(['מקור', 'גודל', 'חציון', 'מקסימום'], res.map(q => [q.n, q.k === 'dist' ? 'בלי תיקון' : F(q.v, 1), F(q.med, 2) + ' מ׳', F(q.max, 2) + ' מ׳'])); const top = res.reduce((a, b) => b.med > a.med ? b : a);
      out.innerHTML = 'השגיאה הגדולה: <b>' + top.n + '</b>. ' + (sPx === 1 && sPitch === 1 && sYaw === 1 && sH === 1 ? 'בקורס, עם אותן הגדרות: זיהוי 0.06, ‏pitch 1.43, ‏yaw 0.72, גובה 0.83, עיוות 0.41 — כאן הנקודות האקראיות אחרות, והמספרים קרובים מאוד. ' : '') + '<b>ברחפן הזווית שולטת</b>: מעלה אחת של pitch שווה בערך לעשרים פיקסלים של טעות זיהוי. מודל זיהוי טוב יותר כמעט לא ישנה כלום; חיישן זווית טוב יותר — או כיול שלו מול נקודות ידועות — כן. ובמפה: שגיאת ה־pitch גדלה עם המרחק — חציון ' + byd.map(v => F(v, 1)).join(', ') + ' מטר עד 30, ‏30–60 ומעבר ל־60 מטר מהרחפן.'; }
    else { const A = [-5, 25, 0], B = [10, 40, 0]; const D = Math.hypot(15, 15); const cam2 = droneCam([0, 0, 50], 30, -60 + sPitch); const pa = px2g(cam2, projD3(base, A), 0), pb = px2g(cam2, projD3(base, B), 0); const D2 = Math.hypot(pa[0] - pb[0], pa[1] - pb[1]);
      tb.innerHTML = table(['', 'עצם א', 'עצם ב', 'המרחק ביניהם'], [['אמת', '(−5, 25)', '(10, 40)', F(D, 2) + ' מ׳'], ['עם שגיאת pitch של ' + F(sPitch, 1) + '°', '(' + F(pa[0], 2) + ', ' + F(pa[1], 2) + ')', '(' + F(pb[0], 2) + ', ' + F(pb[1], 2) + ')', F(D2, 2) + ' מ׳'], ['שגיאה', F(Math.hypot(pa[0] - A[0], pa[1] - A[1]), 2) + ' מ׳', F(Math.hypot(pb[0] - B[0], pb[1] - B[1]), 2) + ' מ׳', F(Math.abs(D2 - D), 2) + ' מ׳ (' + F(Math.abs(D2 - D) / D * 100, 1) + '%)']]);
      out.innerHTML = 'שני עצמים, ' + F(D, 2) + ' מטר זה מזה (כמו בסעיף). כל אחד מהם זז במטר וחצי בערך — אבל <b>שניהם זזים כמעט יחד</b>, והמרחק ביניהם טועה רק ב־' + F(Math.abs(D2 - D) / D * 100, 1) + '%. שגיאות שיטתיות (זווית, גובה) מזיזות את כל התמונה; לכן מרחקים ומהירויות (מודול 5) מדויקים בהרבה ממיקום מוחלט.'; } }
  draw();
};

/* ============================================================ 12.5 — the desk version */
W.w3_desk = function (box) {
  V.say(box, 'גרסת השולחן, מדומה: מצלמה על מעמד, סמן של 10 ס״מ על השולחן (מרכזו הראשית), ורשת של 5 ס״מ. המערכת מוצאת את הסמן, מחשבת את מיקום המצלמה עם PnP (פרק 7) — עם רעש של זיהוי אמיתי בפינות — ומטילה כל לחיצה לשולחן. <b>לחץ פעמיים</b> כדי למדוד, ו<b>השווה לסרגל</b> (הרשת). <b>האתגר:</b> שלוש מדידות של 20 ס״מ — קרוב לסמן, באמצע ורחוק — וראה איך השגיאה גדלה. ספר בגובה 10 ס״מ — תרגיל 12.3.');
  let H = 0.6, sig = 0.3, clicks = [], seed = 1, plane = 0;
  const r1 = row(box); V.slider(r1, 'גובה המצלמה (מ׳)', 0.3, 1.2, 0.05, H, v => { H = v; clicks = []; draw(); }); V.slider(r1, 'רעש בפינות הסמן (פיקסלים)', 0, 1.5, 0.05, sig, v => { sig = v; draw(); });
  V.tabs(box, ['הטל ל־Z = 0 (השולחן)', 'הטל ל־Z = 0.10 (גובה הספר)'], k => { plane = k ? 0.10 : 0; draw(); }); V.btns(box, [['🎲 תמונה אחרת (רעש אחר)', () => { seed++; draw(); }], ['נקה', () => { clicks = []; draw(); }]]);
  const fx = flex(box); const cv = canvas(colm(fx, 'המצלמה (1280 × 720) — לחץ פעמיים'), 512, 288, 512); const tb = el('div'); box.appendChild(tb); const code = mono(box); const out = V.say(box); const rows = [];
  const cam = () => { const C = [0, -H * 0.45, H]; const la = G.lookAt(C, [0, 0.2, 0]); return { K: K3, R: la.R, t: la.t, W: W3, H: H3, C }; };
  function draw() { const c = cam(); const x = cv.getContext('2d'); x.fillStyle = '#d6c4a8'; x.fillRect(0, 0, 512, 288); const s = 512 / W3; const pr = P => { const q = G.project(K3, c.R, c.t, P); return q ? [q[0] * s, q[1] * s] : null; };
    x.strokeStyle = 'rgba(80,60,40,.35)'; x.lineWidth = 1; for (let g = -0.4; g <= 0.401; g += 0.05) { [[[g, -0.1, 0], [g, 0.8, 0]], [[-0.4, g + 0.3, 0], [0.4, g + 0.3, 0]]].forEach(([a, b]) => { const p = pr(a), q = pr(b); if (p && q) { x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(q[0], q[1]); x.stroke(); } }); }
    drawMarker(x, c, s, 0.10);
    /* a book, 10 cm high, at (0.05..0.20, 0.35..0.55) */ const bk = box3(0.05, 0.20, 0.35, 0.55, 0, 0.10, '#1c7ed6', 'book'); const Cc = c.C; bk.filter(f => G.dot(f.n, G.sub(Cc, f.pts[0])) > 0).forEach(f => { const ps = f.pts.map(pr); if (ps.some(p => !p)) return; x.fillStyle = f.col; x.beginPath(); ps.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fill(); });
    /* the system's estimate of the camera, from the noisy marker corners */ const r = G.rng(seed * 17 + 3); const h = 0.05, O = [[-h, h, 0], [h, h, 0], [h, -h, 0], [-h, -h, 0]]; const uvM = O.map(P => { const q = G.project(K3, c.R, c.t, P); return [q[0] + sig * G.randn(r), q[1] + sig * G.randn(r)]; }); const e = pnp(K3, O, uvM); const Ce = camC(e.R, e.t); const estCam = { K: K3, R: e.R, t: e.t, C: Ce, dist: null };
    clicks.forEach(q => { x.fillStyle = '#e8590c'; x.beginPath(); x.arc(q[0] * s, q[1] * s, 4, 0, 7); x.fill(); });
    const pairs = []; for (let i = 0; i + 1 < clicks.length; i += 2) { const a = px2g(estCam, clicks[i], plane, true), b = px2g(estCam, clicks[i + 1], plane, true); const at = px2g(c, clicks[i], plane, true), bt = px2g(c, clicks[i + 1], plane, true); if (!a || !b) continue; const d = Math.hypot(a[0] - b[0], a[1] - b[1]) * 100, dt = Math.hypot(at[0] - bt[0], at[1] - bt[1]) * 100; const far = Math.max(Math.hypot(a[0], a[1]), Math.hypot(b[0], b[1])) * 100; pairs.push([F(d, 1), F(dt, 1), F(d - dt, 2), F((d - dt) / dt * 100, 1) + '%', F(far, 0)]); const pa = clicks[i], pb = clicks[i + 1]; x.strokeStyle = '#2f9e44'; x.lineWidth = 2; x.beginPath(); x.moveTo(pa[0] * s, pa[1] * s); x.lineTo(pb[0] * s, pb[1] * s); x.stroke(); pill(x, F(d, 1) + ' cm', pb[0] * s + 6, pb[1] * s, '#2f9e44'); }
    tb.innerHTML = pairs.length ? table(['המערכת (ס״מ)', 'סרגל (ס״מ)', 'שגיאה (ס״מ)', 'שגיאה (%)', 'מרחק מהסמן (ס״מ)'], pairs) : '';
    code.textContent = 'ok, rvec, tvec = cv2.solvePnP(obj, corners, K, dist, flags=cv2.SOLVEPNP_IPPE_SQUARE)\nC = -R.T @ tvec.ravel()\nprint("camera height above table (cm):", ' + F(Ce[2] * 100, 1) + ')        # ruler: ' + F(H * 100, 1) + '\nP = pixel_to_ground(clicks, K, dist, R, C' + (plane ? ', ground_z=0.10' : '') + ')';
    out.innerHTML = 'גובה המצלמה לפי המערכת: <b>' + F(Ce[2] * 100, 1) + ' ס״מ</b>, בסרגל ' + F(H * 100, 1) + ' — בדיקת השפיות הראשונה של הסעיף. ' + (pairs.length ? 'המדידות בטבלה: השגיאה של המערכת נובעת מהרעש בארבע הפינות של הסמן — שהוא <i>קטן</i> — ולכן קרוב לסמן היא מילימטרים, ורחוק ממנו היא גדלה (פרק 7: סמן קטן = זווית לא מדויקת, וזווית לא מדויקת מתנפחת עם המרחק). החלף תמונה כדי לראות כמה זה משתנה בין פריימים. ' : 'לחץ פעמיים על שני קווים של הרשת (מרחק ידוע). ') + (plane ? 'עכשיו ההטלה היא למישור בגובה 10 ס״מ — מדוד את <b>הצד העליון</b> של הספר (15 על 20 ס״מ): עכשיו זה נכון, ועל השולחן — לא.' : 'ומה עם הצד העליון של הספר הכחול (15 על 20 ס״מ, בגובה 10 ס״מ)? מדוד אותו כאן — וגם בלשונית השנייה.'); }
  cv.addEventListener('click', e => { const [mx, my] = mouse(cv, e); clicks.push([mx / 512 * W3, my / 512 * W3]); draw(); });
  draw();
};

/* ============================================================ 12.6 — the report */
W.w3_report = function (box) {
  V.say(box, 'הדוח של הפרויקט — עמוד אחד, עם מספרים אמיתיים. <b>מלא את השדות</b> מהמדידות שלך (בגרסת השולחן במחשב, או בהדמיה של 12.5), והדוח נבנה למטה: טבלה עם שגיאות בס״מ ובאחוזים, ממוצע ומקסימום, ופסקה על השגיאה הגדולה ביותר. <b>העתק</b> אותו כטקסט.');
  const f = { rms: '0.38', hSys: '61.2', hRuler: '60.5', marker: '10.0', meas: '20.0, 20.1, 0.18\n20.0, 20.3, 0.32\n20.0, 20.9, 0.55\n10.0, 10.1, 0.25\n30.0, 30.6, 0.40' };
  const form = el('div', { style: { display: 'grid', gridTemplateColumns: '200px 1fr', gap: '6px 10px', alignItems: 'center', margin: '8px 0' } }); box.appendChild(form);
  const fld = (k, label, ta) => { form.appendChild(el('div', { html: label })); const i = el(ta ? 'textarea' : 'input', { style: { direction: 'ltr', fontFamily: 'monospace', width: '100%', minHeight: ta ? '90px' : '' } }); i.value = f[k]; i.oninput = () => { f[k] = i.value; draw(); }; form.appendChild(i); };
  fld('rms', 'שגיאת הכיול (RMS, פיקסלים)'); fld('hSys', 'גובה המצלמה לפי המערכת (ס״מ)'); fld('hRuler', 'גובה המצלמה בסרגל (ס״מ)'); fld('marker', 'צלע הסמן (ס״מ)'); fld('meas', 'מדידות — שורה לכל אחת:<br><span class="ltr">סרגל, מערכת, מרחק מהסמן (מ׳)</span>', true);
  const pre = mono(box); V.btns(box, [['📋 העתק את הדוח', () => { const t = pre.textContent; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => { out.innerHTML = badge(true, 'הועתק.'); }, () => { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); out.innerHTML = badge(true, 'הועתק.'); } catch (e) {} ta.remove(); }); }]]); const out = V.say(box);
  function draw() { const rows = f.meas.split('\n').map(l => l.split(',').map(v => parseFloat(v))).filter(r => r.length >= 2 && r.every(v => isFinite(v))); const errs = rows.map(r => r[1] - r[0]);
    let md = '# Desk measurement — report\n\nCalibration RMS: ' + f.rms + ' px' + (parseFloat(f.rms) > 0.5 ? '  (above 0.5 — recalibrate?)' : '') + '\nCamera height: system ' + f.hSys + ' cm, ruler ' + f.hRuler + ' cm (difference ' + F(parseFloat(f.hSys) - parseFloat(f.hRuler), 1) + ' cm)\nMarker side: ' + f.marker + ' cm\n\n| # | ruler (cm) | system (cm) | error (cm) | error (%) | distance from marker (m) |\n|---|---|---|---|---|---|\n';
    rows.forEach((r, i) => { md += '| ' + (i + 1) + ' | ' + r[0].toFixed(1) + ' | ' + r[1].toFixed(1) + ' | ' + (r[1] - r[0]).toFixed(1) + ' | ' + ((r[1] - r[0]) / r[0] * 100).toFixed(1) + ' | ' + (isFinite(r[2]) ? r[2].toFixed(2) : '-') + ' |\n'; });
    if (rows.length) { const ae = errs.map(Math.abs); const mean = ae.reduce((a, b) => a + b, 0) / ae.length; const wi = ae.indexOf(Math.max(...ae)); const corr = rows.length > 2 && rows.every(r => isFinite(r[2])) ? (() => { const xs = rows.map(r => r[2]), ys = ae; const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length; const cv2 = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0); const sx = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0)), sy = Math.sqrt(ys.reduce((s, y) => s + (y - my) ** 2, 0)); return cv2 / (sx * sy || 1); })() : NaN;
      md += '\nMean absolute error: ' + mean.toFixed(2) + ' cm; largest: ' + ae[wi].toFixed(2) + ' cm (measurement ' + (wi + 1) + ').\n\nLargest error — explanation: ' + (isFinite(corr) && corr > 0.5 ? 'the error grows with the distance from the marker (correlation ' + corr.toFixed(2) + '): a small marker gives an uncertain camera angle, and an angle error grows with distance (chapter 7). Fix: a larger marker, or several markers spread over the desk.' : 'the errors do not grow clearly with distance — look for a local cause: a click off the contact point, an object above the table plane (chapter 6.4), or lens distortion near the image corner.') + (errs.every(e => e > 0) || errs.every(e => e < 0) ? ' All errors have the same sign — a systematic scale error: check the marker side with a ruler, and that the marker is flat.' : '') + '\n'; }
    pre.textContent = md; out.innerHTML = rows.length ? 'הדוח נבנה מ־' + rows.length + ' מדידות. ההסבר של השגיאה הגדולה נבחר אוטומטית לפי התבנית במספרים (האם השגיאה גדלה עם המרחק? האם כולן באותו סימן?) — אבל בדוח האמיתי, הפסקה הזו שלך: זה החלק שמראה שהבנת את המערכת.' : 'הכנס מדידות בפורמט: סרגל, מערכת, מרחק.'; }
  draw();
};

window.LAB3 = Object.assign(window.LAB3 || {}, { world3, render3, camCar, carCam, box, car, observer, camGlyph, K3, CB, views5, calibrate5, zhangInit, drawBoard, cam6, Hground, groundMap, pnp, camC, eightPoint, Fof, rel, cams8, P8, runVO, decomposeE, droneCam, px2g });
})();
