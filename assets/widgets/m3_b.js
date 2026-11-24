/* Module 3 visuals — chapters 5–8: calibration, homography, PnP and markers, two-view geometry */
(function () {
const W = window.W, V = window.V, G = window.G, el = V.el;
const { mono, ltr, groundGrid, render } = window.M3;
const K0 = G.K(1000, 640, 360);
const click = (svg, w, h, fn) => svg.addEventListener('click', e => { const r = svg.getBoundingClientRect(); fn([(e.clientX - r.left) * w / r.width, (e.clientY - r.top) * h / r.height]); });
const path = (svg, pts, st) => V.s('path', { d: pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(''), style: Object.assign({ fill: 'none', stroke: 'var(--c1)', strokeWidth: 2 }, st || {}) }, svg);

/* 5.1 why a 9×6 board */
W.w3_chess_sym = function (box) {
  V.say(box, 'הגלאי מחזיר את הפינות בסדר קבוע, מהפינה "הראשונה" (באדום). <b>סובב את הלוח ב־90 מעלות</b> ובדוק: האם אפשר לדעת מהתמונה לבד איזו פינה היא הראשונה?');
  let rot = 0, kind = 0;
  V.tabs(box, ['9 על 6 פינות', '8 על 8 פינות'], i => { kind = i; draw(); });
  V.btns(box, [['סובב 90°', () => { rot = (rot + 90) % 360; draw(); }, 'primary']]);
  const svg = G.svg(box, 320, 260); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const [cc, rr] = kind ? [8, 8] : [9, 6]; const sq = 22, w = (cc + 1) * sq, h = (rr + 1) * sq; const g = V.s('g', { transform: `translate(160,130) rotate(${rot}) translate(${-w / 2},${-h / 2})` }, svg);
    for (let i = 0; i <= cc; i++) for (let j = 0; j <= rr; j++) if ((i + j) % 2 === 0) V.s('rect', { x: i * sq, y: j * sq, width: sq, height: sq, style: { fill: 'var(--ink)' } }, g);
    V.s('rect', { x: 0, y: 0, width: w, height: h, style: { fill: 'none', stroke: 'var(--ink3)' } }, g); V.s('circle', { cx: sq, cy: sq, r: 5, style: { fill: 'var(--c2)' } }, g);
    const sym = kind === 1; out.innerHTML = (cc * rr) + ' פינות. ' + (sym ? 'לוח ריבועי נראה <b>זהה</b> אחרי סיבוב ב־90: הגלאי לא יכול לדעת איזו פינה ראשונה, והסדר יתהפך בין תמונות.' : (rot % 180 ? 'עכשיו הלוח עומד: 6 על 9 במקום 9 על 6. הגלאי מזהה את הכיוון, והסדר נשמר.' : 'לוח לא ריבועי: אחרי סיבוב ב־90 הוא נראה אחרת, ולכן הסדר חד־משמעי.')); }
  draw();
};

/* 5.2 calibration and over-fitting of the radial model */
W.w3_calib_overfit = function (box) {
  V.say(box, 'העיוות האמיתי (k1 = −0.28, k2 = 0.09) מול מה שהכיול מצא, לפי כמה תמונות ואיפה הפינות נפלו. הציר האופקי הוא המרחק מהמרכז; הקו המקווקו הוא הפינה של תמונה 1280 על 720.');
  let mode = 0;
  V.tabs(box, ['15 תמונות, כל התמונה', '3 תמונות, רק במרכז', '3 תמונות + CALIB_FIX_K3'], i => { mode = i; draw(); });
  const P = window.IM.plot(box, { w: 440, h: 190 }); const out = V.say(box);
  const tru = r => r * (1 - 0.28 * r * r + 0.09 * r ** 4);
  function fit(rs, ds, nk) { const A = rs.map(r => [r ** 3, r ** 5, r ** 7].slice(0, nk)); const b = rs.map((r, i) => ds[i] - r); const AtA = A[0].map((_, i) => A[0].map((_, j) => A.reduce((s, a) => s + a[i] * a[j], 0))); const Atb = A[0].map((_, i) => A.reduce((s, a, k) => s + a[i] * b[k], 0)); return V.solve(AtA, Atb); }
  function draw() { const r = G.rng(3); const n = mode ? 3 : 15, rmax = mode ? 0.38 : 0.72; const rs = [], ds = []; for (let im = 0; im < n; im++) for (let k = 0; k < 54; k++) { const rr = Math.min(rmax, Math.abs(G.randn(r)) * rmax * 0.55 + r() * rmax * 0.45); rs.push(rr); ds.push(tru(rr) + G.randn(r) * 0.3 / 1100); }
    const kk = fit(rs, ds, mode === 2 ? 2 : 3); const k = [kk[0], kk[1], kk[2] || 0]; const est = x => x * (1 + k[0] * x * x + k[1] * x ** 4 + k[2] * x ** 6);
    const rc = Math.hypot(640, 360) / 1100; const pts = [], diff = []; for (let x = 0; x <= 0.8; x += 0.01) { pts.push([x, 1100 * (tru(x) - x)]); diff.push([x, 1100 * (est(x) - x)]); }
    P.draw([{ pts, color: 'var(--c3)', width: 3 }, { pts: diff, color: 'var(--c2)', width: 2, dash: '5 3' }, { vline: rc, color: 'var(--ink3)', dash: '3 3', label: 'פינה' }, { vline: rmax, color: 'var(--c1)', dash: '2 2', label: 'הנתונים עד כאן' }], [0, 0.8], [-160, 40]);
    const err = Math.abs(1100 * (est(rc) - tru(rc))); out.innerHTML = 'ירוק: אמת. אדום מקווקו: הכיול. ' + ltr('k1 = ' + G.f(k[0], 3) + ', k2 = ' + G.f(k[1], 3) + ', k3 = ' + G.f(k[2], 3)) + '. בפינת התמונה ההבדל: <b>' + G.f(err, 1) + '</b> פיקסלים. ' + (mode === 1 ? 'מעט נתונים במרכז: המקדמים "מסבירים" את מה שנראה, ומשתגעים בפינה.' : mode === 2 ? 'קיבוע k3 מוריד את חופש ההתאמה, והעקומה נרגעת.' : 'פינות מכל אזורי התמונה: הכיול מדויק גם בפינה, אף שהמקדמים עצמם לא זהים לאמת.'); }
  draw();
};

/* 5.3 per-image reprojection error */
W.w3_reproj = function (box) {
  V.say(box, 'שגיאת ההטלה החוזרת של כל אחת מ־15 התמונות. <b>הוסף תמונה בעייתית</b>, מצא אותה בגרף, והוצא אותה.');
  const base = [0.31, 0.36, 0.29, 0.42, 0.38, 0.33, 0.46, 0.28, 0.35, 0.37, 0.4, 0.3, 0.34, 0.39, 0.32]; let imgs = base.map((e, i) => ({ e, n: 'img' + (i + 1) }));
  V.btns(box, [['הוסף תמונה מטושטשת', () => { imgs.push({ e: 1.35, n: 'blur' }); draw(); }], ['הוסף תמונה עם פינות בסדר הפוך', () => { imgs.push({ e: 14.8, n: 'flipped' }); draw(); }], ['הוצא את הגרועה', () => { let m = 0; imgs.forEach((x, i) => { if (x.e > imgs[m].e) m = i; }); imgs.splice(m, 1); draw(); }], ['איפוס', () => { imgs = base.map((e, i) => ({ e, n: 'img' + (i + 1) })); draw(); }, 'ghost']]);
  const svg = G.svg(box, 480, 200); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const mx = Math.max(1, ...imgs.map(x => x.e)); const bw = 440 / imgs.length; imgs.forEach((x, i) => { const h = Math.min(160, x.e / mx * 160); V.s('rect', { x: 30 + i * bw + 2, y: 175 - h, width: bw - 4, height: h, style: { fill: x.e > 0.6 ? 'var(--c2)' : 'var(--c1)' } }, svg); });
    G.line(svg, [30, 175 - 0.5 / mx * 160], [470, 175 - 0.5 / mx * 160], { stroke: 'var(--c3)', strokeDasharray: '4 3' }); G.txt(svg, [2, 179 - 0.5 / mx * 160], '0.5', { fontSize: '10px' });
    const rms = Math.sqrt(imgs.reduce((s, x) => s + x.e * x.e, 0) / imgs.length); out.innerHTML = 'שגיאה כללית: <b>' + G.f(rms, 3) + '</b> פיקסלים, ' + imgs.length + ' תמונות. ' + (rms < 0.5 ? 'מתחת לחצי פיקסל.' : 'תמונה אחת גרועה מקלקלת את הכול: מוצאים אותה בגרף ומכיילים שוב.'); }
  draw();
};

/* 6.1 the plane-to-image homography */
const pole = G.lookAt([0, 0, 6], [0, 20, 0]);
W.w3_plane_H = function (box) {
  V.say(box, 'מצלמה על עמוד בגובה 6 מטר. לנקודות על הקרקע Z = 0, ולכן העמודה השלישית של R נעלמת ונשארת H = K·[r1 r2 t]. <b>לחץ על התמונה</b>: ההופכית מחזירה מטרים על הקרקע.');
  const H = G.mm(K0, pole.R.map((r, i) => [r[0], r[1], pole.t[i]])); const Hi = G.inv3(H); let uv = [700, 500];
  const svg = G.svg(box, 512, 300); const out = mono(box);
  click(svg, 512, 300, q => { uv = [(q[0]) / 0.4, (q[1] - 10) / 0.4]; draw(); });
  function draw() { svg.innerHTML = ''; const fr = G.frame(svg, 0, 10, 512, 1280, 720); render(svg, fr, K0, pole.R, pole.t, groundGrid(40, 5).map(([a, b]) => [[a[0], a[1] + 40, 0], [b[0], b[1] + 40, 0]]), { stroke: 'var(--line2)', strokeWidth: 0.8 });
    G.dot2(svg, fr.map(uv), 6, 'var(--c2)'); const g = G.mv(Hi, [uv[0], uv[1], 1]);
    const H9 = H.map(r => r.map(x => x / H[2][2]));
    out.textContent = 'H = K·[r1 r2 t] = [' + H9.map(r => '[' + r.map(x => G.f(x, 2)).join(', ') + ']').join(', ') + ']\npixel (' + uv.map(x => G.f(x, 0)).join(', ') + ')  →  ' + (g[2] * (H[2][2] > 0 ? 1 : -1) > 0 && uv[1] > 0 ? 'ground (X, Y) = (' + G.f(g[0] / g[2], 2) + ', ' + G.f(g[1] / g[2], 2) + ') m' : 'above the horizon: this ray never hits the ground'); }
  draw();
};

/* 6.2 DLT: the matrix A and its singular values */
W.w3_dlt = function (box) {
  V.say(box, 'ארבעה זוגות נותנים מטריצה A של 8 על 9. הפתרון הוא הווקטור שמתאים לערך הסינגולרי הקטן ביותר. <b>הזז נקודה אחת עד שהיא על קו אחד עם שתיים אחרות</b> (תרגיל 6.3), וראה מה קורה לערכים.');
  let off = 6; const base = [[-5, 10], [5, 10], [5, 40], [-5, 40]];
  V.slider(box, 'הפינה הרביעית: X', -8, 8, 0.5, -5, v => { off = v; draw(); }); off = -5;
  const svg = G.svg(box, 480, 170); const out = mono(box);
  function draw() { svg.innerHTML = ''; const gr = base.map((p, i) => i === 3 ? [off, 40] : p); gr[3] = [off, off === 5 ? 25 : 40]; const uv = gr.map(p => G.project(K0, pole.R, pole.t, [p[0], p[1], 0]));
    const { sv } = G.dlt(uv, gr, true); const lg = sv.map(s => Math.log10(Math.max(s, 1e-16)));
    const mx = Math.max(...lg), mn = -16; sv.forEach((s, i) => { const h = (lg[i] - mn) / (mx - mn) * 130; V.s('rect', { x: 30 + i * 48, y: 150 - h, width: 34, height: h, style: { fill: i >= 7 ? 'var(--c2)' : 'var(--c1)' } }, svg); G.txt(svg, [32 + i * 48, 164], 'σ' + (i + 1), { fontSize: '10px' }); });
    const col = Math.abs(off - 5) < 1e-9; out.textContent = 'points on the ground: ' + gr.map(p => '(' + p.join(', ') + ')').join(' ') + '\nsingular values (log scale): ' + sv.map(s => s.toExponential(1)).join('  ') + '\n' + (col ? 'three points on one line (x = 5): σ8 ≈ 0 too → rank 7, a 2-D null space, infinitely many H' : 'rank 8: one null vector = H (σ9 ≈ 0 only)'); }
  draw();
};

/* 6.3 measuring on the road */
W.w3_ground_measure = function (box) {
  V.say(box, 'סימנו ארבע פינות של מלבן ידוע על הכביש (בירוק) ובנינו H מהן. <b>לחץ על שתי נקודות בכביש</b>, וקרא את המרחק ביניהן במטרים.');
  const gr = [[-5, 10], [5, 10], [5, 40], [-5, 40]]; const uv = gr.map(p => G.project(K0, pole.R, pole.t, [p[0], p[1], 0])); const { H } = G.dlt(uv, gr); let pts = [];
  const svg = G.svg(box, 512, 300); const out = V.say(box);
  click(svg, 512, 300, q => { const p = [q[0] / 0.4, (q[1] - 10) / 0.4]; if (p[1] < 120) return; pts.push(p); if (pts.length > 2) pts = [p]; draw(); });
  function draw() { svg.innerHTML = ''; const fr = G.frame(svg, 0, 10, 512, 1280, 720); render(svg, fr, K0, pole.R, pole.t, [[[-6, 5, 0], [-6, 120, 0]], [[6, 5, 0], [6, 120, 0]], [[0, 5, 0], [0, 120, 0]]], { stroke: 'var(--ink3)', strokeWidth: 2 });
    G.poly(svg, uv.map(p => fr.map(p)), { stroke: 'var(--c3)', strokeWidth: 2 }); pts.forEach(p => G.dot2(svg, fr.map(p), 6, 'var(--c2)')); if (pts.length === 2) G.line(svg, fr.map(pts[0]), fr.map(pts[1]), { stroke: 'var(--c2)', strokeWidth: 2 });
    if (pts.length === 2) { const a = G.ap(H, pts[0]), b = G.ap(H, pts[1]); out.innerHTML = ltr('(' + G.f(a[0], 2) + ', ' + G.f(a[1], 2) + ') → (' + G.f(b[0], 2) + ', ' + G.f(b[1], 2) + ')') + ': מרחק <b>' + G.f(Math.hypot(a[0] - b[0], a[1] - b[1]), 2) + ' מטר</b>. הקווים על הכביש הם כל 6 מטר לרוחב.'; } else out.innerHTML = pts.length ? 'לחץ על נקודה שנייה.' : 'לחץ על נקודה ראשונה (מתחת לאופק).'; }
  draw();
};

/* 6.4 what the homography does not know */
W.w3_head_ground = function (box) {
  V.say(box, 'ההומוגרפיה מניחה שכל פיקסל על הקרקע. מבט מהצד: מצלמה בגובה 6 מטר, אדם במרחק D. <b>בחר איזו נקודה של האדם מטילים</b>, וראה איפה היא "נוחתת".');
  let D = 25, z = 1.5;
  const sr = V.row(box); V.slider(sr, 'מרחק D (מ׳)', 5, 50, 1, D, v => { D = v; draw(); });
  V.tabs(box, ['הראש (1.5 מ׳)', 'מרכז המלבן (0.9 מ׳)', 'הרגליים (0)'], i => { z = [1.5, 0.9, 0][i]; draw(); });
  const svg = G.svg(box, 540, 170); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const k = 8, o = [20, 140]; const S = (x, y) => [o[0] + x * k, o[1] - y * 12]; G.line(svg, S(0, 0), S(64, 0), { stroke: 'var(--ink3)' });
    G.line(svg, S(0, 0), S(0, 6), { stroke: 'var(--ink3)', strokeWidth: 3 }); G.dot2(svg, S(0, 6), 5, 'var(--ink)'); G.line(svg, S(D, 0), S(D, 1.8), { stroke: 'var(--c1)', strokeWidth: 5 });
    const land = 6 * D / (6 - z); G.line(svg, S(0, 6), S(land, 0), { stroke: 'var(--c2)', strokeDasharray: '5 3' }); G.dot2(svg, S(D, z), 5, 'var(--c2)'); G.dot2(svg, S(land, 0), 6, 'var(--c2)');
    out.innerHTML = 'הנקודה בגובה ' + z + ' מוטלת ל־<b>' + G.f(land, 2) + ' מטר</b> במקום ' + D + ': שגיאה של <b>' + G.f(land - D, 2) + '</b> מטר, פי ' + G.f(6 / (6 - z), 2) + '. ' + (z === 0 ? 'הרגליים נוגעות בקרקע: אין שגיאה.' : 'השגיאה גדלה ביחס ישר למרחק.'); }
  draw();
};

/* 6.5 noise, number of points, outliers */
W.w3_H_noise = function (box) {
  V.say(box, 'סימון ידני מפספס בפיקסל. הרצנו 200 פעמים עם רעש, ומדדנו את השגיאה במטרים בארבעה מרחקים. <b>בחר מספר נקודות, ורעש</b>. ואז הוסף נקודות חריגות והשווה DLT רגיל ל־RANSAC.');
  let npts = 4, noise = 1, outl = false;
  V.tabs(box, ['4 נקודות', '20 נקודות'], i => { npts = i ? 20 : 4; run(); }); V.slider(box, 'רעש (פיקסלים)', 0, 4, 0.25, noise, v => { noise = v; run(); }); V.tabs(box, ['בלי חריגות', '5 חריגות (20 נקודות)'], i => { outl = i === 1; if (outl) npts = 20; run(); });
  const svg = G.svg(box, 460, 200); const out = V.say(box);
  const tests = [[0, 15], [3, 25], [-4, 40], [2, 60]];
  function ransac(uv, gr, r) { let best = null, bc = -1; for (let it = 0; it < 150; it++) { const idx = []; while (idx.length < 4) { const k = Math.floor(r() * uv.length); if (!idx.includes(k)) idx.push(k); } const { H } = G.dlt(idx.map(k => gr[k]), idx.map(k => uv[k])); const inl = uv.map((p, k) => G.norm(G.sub(G.ap(H, gr[k]), p)) < 3); const c = inl.filter(Boolean).length; if (c > bc) { bc = c; best = inl; } }
    const I = uv.map((_, k) => k).filter(k => best[k]); return G.dlt(I.map(k => uv[k]), I.map(k => gr[k])).H; }
  function run() { const r = G.rng(11); const res = tests.map(() => []), resR = tests.map(() => []); const runs = outl ? 40 : 200;
    for (let k = 0; k < runs; k++) { const gr = npts === 4 ? [[-5, 10], [5, 10], [5, 40], [-5, 40]] : [...Array(20)].map(() => [r() * 12 - 6, 10 + r() * 30]); const uv = gr.map(p => { const q = G.project(K0, pole.R, pole.t, [p[0], p[1], 0]); return [q[0] + G.randn(r) * noise, q[1] + G.randn(r) * noise]; });
      if (outl) for (let j = 0; j < 5; j++) { uv[j][0] += (r() - 0.5) * 160; uv[j][1] += (r() - 0.5) * 160; }
      const { H } = G.dlt(uv, gr); tests.forEach((t, i) => { const q = G.project(K0, pole.R, pole.t, [t[0], t[1], 0]); res[i].push(G.norm(G.sub(G.ap(H, q), t))); });
      if (outl) { const Hr = ransac(uv, gr, r); tests.forEach((t, i) => { const q = G.project(K0, pole.R, pole.t, [t[0], t[1], 0]); resR[i].push(G.norm(G.sub(G.ap(Hr, q), t))); }); } }
    const m = a => a.reduce((s, x) => s + x, 0) / a.length; const A = res.map(m), B = outl ? resR.map(m) : null; svg.innerHTML = ''; const mx = Math.max(0.2, ...A, ...(B || []));
    tests.forEach((t, i) => { const h = A[i] / mx * 150; V.s('rect', { x: 40 + i * 105, y: 175 - h, width: B ? 40 : 70, height: h, style: { fill: 'var(--c1)' } }, svg); if (B) { const h2 = B[i] / mx * 150; V.s('rect', { x: 84 + i * 105, y: 175 - h2, width: 40, height: h2, style: { fill: 'var(--c3)' } }, svg); }
      G.txt(svg, [50 + i * 105, 192], t[1] + ' m', { fontSize: '11px' }); G.txt(svg, [42 + i * 105, 170 - h], G.f(A[i], 2), { fontSize: '10px' }); });
    out.innerHTML = 'שגיאה ממוצעת במטרים: ' + ltr(A.map(x => G.f(x, 3)).join(', ')) + (B ? '. עם RANSAC (בירוק): ' + ltr(B.map(x => G.f(x, 3)).join(', ')) + '.' : '. השגיאה גדלה עם המרחק, ומחוץ לאזור הנקודות (10 עד 40) יותר נקודות לא עוזרות.'); }
  run();
};

/* 6.6 when a homography is enough */
W.w3_parallax = function (box) {
  V.say(box, 'שתי תמונות. מחשבים H מנקודות הקרקע (כחול) ובודקים אותה גם על ראשי עמודים בגובה 3 מטר (כתום). <b>בחר סיבוב בלבד או תזוזה</b>.');
  let mode = 0, amt = 2;
  V.tabs(box, ['המצלמה רק מסתובבת', 'המצלמה זזה הצידה'], i => { mode = i; draw(); }); V.slider(box, 'כמה', 0, 4, 0.25, amt, v => { amt = v; draw(); });
  const svg = G.svg(box, 512, 300); const out = V.say(box);
  const gpts = [], tops = []; const r = G.rng(5); for (let i = 0; i < 12; i++) gpts.push([r() * 16 - 8, 10 + r() * 30, 0]); for (let i = 0; i < 6; i++) { const x = r() * 12 - 6, y = 12 + r() * 25; tops.push([x, y, 3]); }
  function draw() { svg.innerHTML = ''; const fr = G.frame(svg, 0, 10, 512, 1280, 720); const c1 = G.lookAt([0, 0, 6], [0, 20, 0]); const c2 = mode ? G.lookAt([amt, 0, 6], [amt, 20, 0]) : G.lookAt([0, 0, 6], [amt * 3, 20, 0]);
    const u1 = gpts.map(p => G.project(K0, c1.R, c1.t, p)), u2 = gpts.map(p => G.project(K0, c2.R, c2.t, p)); const { H } = G.dlt(u1, u2);
    u2.forEach(p => G.dot2(svg, fr.map(p), 4, 'var(--c1)')); let err = 0; tops.forEach(p => { const a = G.project(K0, c1.R, c1.t, p), b = G.project(K0, c2.R, c2.t, p); const pr = G.ap(H, a); err = Math.max(err, G.norm(G.sub(pr, b))); G.dot2(svg, fr.map(b), 5, 'var(--c5, #e8a33d)'); V.s('circle', { cx: fr.map(pr)[0], cy: fr.map(pr)[1], r: 7, style: { fill: 'none', stroke: 'var(--c2)', strokeWidth: 2 } }, svg); G.line(svg, fr.map(pr), fr.map(b), { stroke: 'var(--c2)' }); });
    out.innerHTML = 'עיגול אדום: איפה H חוזה את ראש העמוד. הפער הגדול ביותר: <b>' + G.f(err, 1) + '</b> פיקסלים. ' + (mode ? 'בתזוזה, נקודות מחוץ למישור זזות אחרת (פרלקסה), ושום H לא מסבירה את שתיהן.' : 'בסיבוב בלבד H = K·R·K⁻¹, והעומק לא משנה: גם הראשים מוסברים בדיוק.'); }
  draw();
};

/* 7.1 PnP = minimise reprojection error */
W.w3_pnp = function (box) {
  V.say(box, 'שש נקודות שמיקומן ידוע (ירוק: איפה הן באמת בתמונה). אדום: איפה הן היו נופלות אילו המצלמה הייתה בניחוש שלך. <b>הזז את הניחוש</b> כדי לאפס את השגיאה, או לחץ "פתור", שעושה בדיוק את זה במספרים.');
  const Pw = [[0, 0, 0], [2, 0, 0], [2, 0, 1], [0, 0, 1], [0, 2, 0], [2, 2, 1]]; const tru = G.lookAt([1.5, -8, 2.5], [1, 1, 0.5]); const obs = Pw.map(p => G.project(K0, tru.R, tru.t, p));
  const g = [-1, -9, 4]; const sl = []; const sr = V.row(box); ['X', 'Y', 'Z'].forEach((n, i) => sl.push(V.slider(sr, 'C.' + n.toLowerCase(), [-5, -14, 0.5][i], [5, -4, 8][i], 0.05, g[i], v => { g[i] = v; draw(); })));
  V.btns(box, [['פתור', () => { solve(); }, 'primary']]);
  const svg = G.svg(box, 512, 300); const out = V.say(box);
  const err = c => { const { R, t } = G.lookAt(c, [1, 1, 0.5]); let s = 0; Pw.forEach((p, i) => { const q = G.project(K0, R, t, p); s += q ? G.norm(G.sub(q, obs[i])) ** 2 : 1e6; }); return Math.sqrt(s / Pw.length); };
  function solve() { let step = 0.5; for (let it = 0; it < 400 && step > 1e-4; it++) { let imp = false; for (let k = 0; k < 3; k++) for (const sg of [1, -1]) { const c = g.slice(); c[k] += sg * step; if (err(c) < err(g)) { g[k] = c[k]; imp = true; } } if (!imp) step /= 2; } sl.forEach((s, i) => s.set(g[i])); draw(); }
  function draw() { svg.innerHTML = ''; const fr = G.frame(svg, 0, 10, 512, 1280, 720); const { R, t } = G.lookAt(g, [1, 1, 0.5]);
    obs.forEach(p => G.dot2(svg, fr.map(p), 6, 'var(--c3)')); Pw.forEach((p, i) => { const q = G.project(K0, R, t, p); if (q) { G.dot2(svg, fr.map(q), 4, 'var(--c2)'); G.line(svg, fr.map(q), fr.map(obs[i]), { stroke: 'var(--c2)', strokeWidth: 1 }); } });
    const e = err(g); out.innerHTML = 'שגיאת הטלה חוזרת: <b>' + G.f(e, 2) + '</b> פיקסלים. המצלמה האמיתית: ' + ltr('(1.5, −8, 2.5)') + '. ' + (e < 0.05 ? '<b class="good">מצאת אותה.</b>' : ''); }
  draw();
};

/* 7.2 marker size, distance and corner order */
W.w3_marker = function (box) {
  V.say(box, 'סמן ריבועי על הקרקע, ארבע פינות עם רעש של רבע פיקסל, ופתרון מיקום (ניחוש מהומוגרפיה כמו תרגיל 7.4, ואז מזעור שגיאת ההטלה). 100 הרצות. <b>שנה גודל ומרחק</b>, ונסה סדר פינות שגוי (תרגיל 7.2).');
  let side = 0.15, dist = 1, wrong = false;
  const sr = V.row(box); V.slider(sr, 'צלע הסמן (ס״מ)', 5, 100, 5, 15, v => { side = v / 100; run(); }); V.slider(sr, 'מרחק (מ׳)', 0.5, 25, 0.5, dist, v => { dist = v; run(); });
  V.tabs(box, ['סדר פינות נכון', 'סדר מתחיל מהפינה השנייה'], i => { wrong = i === 1; run(); });
  const svg = G.svg(box, 300, 220); const out = V.say(box);
  function run() { const r = G.rng(9); const C = G.mul(G.unit([0.3, -0.8, 0.6]), dist); const cam = G.lookAt(C, [0, 0, 0]); const s = side / 2; const obj = [[-s, s], [s, s], [s, -s], [-s, -s]];
    const errs = []; let lastC = null; for (let k = 0; k < 100; k++) { const uv = obj.map(p => { const q = G.project(K0, cam.R, cam.t, [p[0], p[1], 0]); return [q[0] + G.randn(r) * 0.25, q[1] + G.randn(r) * 0.25]; }); const o2 = wrong ? obj.slice(1).concat([obj[0]]) : obj;
      const { H } = G.dlt(o2, uv); const p0 = G.planarPose(K0, H); const pose = G.refinePose(K0, o2.map(p => [p[0], p[1], 0]), uv, p0.R, p0.t, 20); const Ce = G.mul(G.mv(G.T(pose.R), pose.t), -1); errs.push(G.norm(G.sub(Ce, C))); lastC = Ce; }
    const md = G.median(errs); svg.innerHTML = ''; const k = 90 / Math.max(1.5, G.norm(C)), o = [150, 140]; const S = p => [o[0] + p[0] * k, o[1] - p[1] * k];
    V.s('rect', { x: o[0] - s * k, y: o[1] - s * k, width: 2 * s * k, height: 2 * s * k, style: { fill: 'var(--ink)' } }, svg); G.dot2(svg, S(C), 7, 'var(--c3)'); G.txt(svg, G.add(S(C), [8, 4]), 'אמת', { fill: 'var(--c3)', fontSize: '11px' }); G.dot2(svg, S(lastC), 5, 'var(--c2)'); G.txt(svg, G.add(S(lastC), [8, 14]), 'משוער', { fill: 'var(--c2)', fontSize: '11px' });
    out.innerHTML = 'מרחק אמיתי ' + G.f(G.norm(C), 2) + ' מ׳. חציון שגיאת המיקום: <b>' + (md < 1 ? G.f(md * 100, 1) + ' ס״מ' : G.f(md, 2) + ' מ׳') + '</b>. ' + (wrong ? 'סדר שגוי: המצלמה "מסתובבת" ברבע סיבוב סביב הסמן, בלי הודעת שגיאה.' : 'סמן קטן ממרחק גדול: השגיאה עולה מהר יותר מהמרחק.'); }
  run();
};

/* two-camera setup of chapter 8 */
const c1 = G.lookAt([-1, -10, 2], [0, 1, 1]), c2 = G.lookAt([1.5, -9.5, 2.2], [0, 1, 1]);
const scene = (() => { const r = G.rng(1); return [...Array(60)].map(() => [r() * 8 - 4, r() * 8 - 2, r() * 3]); })();
const Rrel = G.mm(c2.R, G.T(c1.R)), trel = G.sub(c2.t, G.mv(Rrel, c1.t)); const E = G.mm(G.skew(trel), Rrel); const Ki = G.inv3(K0); const F = G.mm(G.T(Ki), G.mm(E, Ki));

/* 8.1 the epipolar line */
W.w3_epipolar = function (box) {
  V.say(box, 'בחר נקודה בתמונה 1 (משמאל) והזז את העומק שלה לאורך הקרן. בתמונה 2 (מימין) כל העומקים נופלים על קו אחד: הקו האפיפולרי.');
  let pick = 5, depth = 10;
  const sr = V.row(box); V.slider(sr, 'איזו נקודה', 0, 19, 1, pick, v => { pick = v; draw(); }); V.slider(sr, 'עומק לאורך הקרן (מ׳)', 2, 40, 0.5, depth, v => { depth = v; draw(); });
  const svg = G.svg(box, 540, 170); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const f1 = G.frame(svg, 0, 18, 260, 1280, 720, 'תמונה 1'), f2 = G.frame(svg, 280, 18, 260, 1280, 720, 'תמונה 2');
    scene.slice(0, 20).forEach((p, i) => { const a = G.project(K0, c1.R, c1.t, p), b = G.project(K0, c2.R, c2.t, p); if (a) G.dot2(svg, f1.map(a), i === pick ? 5 : 2.5, i === pick ? 'var(--c2)' : 'var(--ink3)'); if (b) G.dot2(svg, f2.map(b), i === pick ? 5 : 2.5, i === pick ? 'var(--c3)' : 'var(--ink3)'); });
    const u1 = G.project(K0, c1.R, c1.t, scene[pick]); const ray = G.mv(G.T(c1.R), G.mv(Ki, [u1[0], u1[1], 1])); const C1 = c1.C;
    const l = G.mv(F, [u1[0], u1[1], 1]); const pts = [0, 1280].map(u => [u, -(l[0] * u + l[2]) / l[1]]); G.line(svg, f2.map(pts[0]), f2.map(pts[1]), { stroke: 'var(--c5, #e8a33d)', strokeWidth: 1.5 });
    const X = G.add(C1, G.mul(ray, depth / G.mv(c1.R, ray)[2])); const q = G.project(K0, c2.R, c2.t, X); if (q) G.dot2(svg, f2.map(q), 6, 'var(--c2)');
    const trueD = G.toCam(c1.R, c1.t, scene[pick])[2]; out.innerHTML = 'אדום: הנקודה בעומק ' + depth + ' מטר. ירוק: הנקודה האמיתית (עומק ' + G.f(trueD, 2) + '). כל העומקים על הקו הכתום ' + ltr('l = F·u₁') + ', ולכן מחפשים התאמה רק לאורכו.'; }
  draw();
};

/* 8.2 E and the scale ambiguity */
W.w3_essential = function (box) {
  V.say(box, 'E = [t]× · R של זוג המצלמות. בדיקה: x₂ᵀ·E·x₁ לחמש נקודות. ואז הגדל את כל הסצנה ואת התזוזה פי 2: התמונות לא משתנות בכלל.');
  let sc = 1; V.slider(box, 'קנה מידה של הסצנה והתזוזה', 0.5, 4, 0.5, 1, v => { sc = v; draw(); });
  const out = mono(box);
  function draw() { const C1 = G.mul(c1.C, sc), C2 = G.mul(c2.C, sc); const a = G.lookAt(C1, G.mul([0, 1, 1], sc)), b = G.lookAt(C2, G.mul([0, 1, 1], sc)); const R = G.mm(b.R, G.T(a.R)), t = G.sub(b.t, G.mv(R, a.t)); const Em = G.mm(G.skew(t), R); const En = Em.map(r => r.map(x => x / G.norm(t)));
    const lines = scene.slice(0, 5).map(p0 => { const p = G.mul(p0, sc); const x1 = G.toCam(a.R, a.t, p), x2 = G.toCam(b.R, b.t, p); const n1 = [x1[0] / x1[2], x1[1] / x1[2], 1], n2 = [x2[0] / x2[2], x2[1] / x2[2], 1]; const u = G.project(K0, a.R, a.t, p); return '(' + G.f(u[0], 1) + ', ' + G.f(u[1], 1) + ')  x₂ᵀEx₁ = ' + G.dot(n2, G.mv(Em, n1)).toExponential(1); });
    out.textContent = '|t| = ' + G.f(G.norm(t), 3) + ' m\nE / |t| = [' + En.map(r => '[' + r.map(x => G.f(x, 3)).join(', ') + ']').join(', ') + ']\npixel in image 1 and the constraint:\n' + lines.join('\n') + '\n→ the pixels and E/|t| are identical for every scale: only the direction of t is known.'; }
  draw();
};

/* 8.3 eight-point algorithm with and without normalisation */
W.w3_eight_point = function (box) {
  V.say(box, 'אלגוריתם שמונה הנקודות על 60 ההתאמות של הסעיף. <b>שנה את הרעש וכבה את הנרמול</b> (תרגיל 8.2), וקרא את המרחק הממוצע של נקודה מהקו האפיפולרי שלה.');
  let noise = 0.5, norm = true;
  V.slider(box, 'רעש (פיקסלים)', 0, 3, 0.1, noise, v => { noise = v; run(); }); V.tabs(box, ['עם נרמול', 'בלי נרמול'], i => { norm = i === 0; run(); });
  const out = mono(box);
  function svd3(M) { const e = G.eigSym(G.mm(G.T(M), M)); const Vs = e.vecs.slice().reverse(); const s = e.vals.slice().reverse().map(x => Math.sqrt(Math.max(0, x))); const U = Vs.map((v, i) => G.mul(G.mv(M, v), 1 / (s[i] || 1))); return { U, s, Vs }; }
  function run() { const r = G.rng(1); const u1 = [], u2 = [], c1u = [], c2u = []; scene.forEach(p => { const a = G.project(K0, c1.R, c1.t, p), b = G.project(K0, c2.R, c2.t, p); c1u.push(a); c2u.push(b); u1.push([a[0] + G.randn(r) * noise, a[1] + G.randn(r) * noise]); u2.push([b[0] + G.randn(r) * noise, b[1] + G.randn(r) * noise]); });
    const I = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; const T1 = norm ? G.normT(u1) : I, T2 = norm ? G.normT(u2) : I; const n1 = u1.map(p => G.ap(T1, p)), n2 = u2.map(p => G.ap(T2, p));
    const A = n1.map((p, i) => { const [x1, y1] = p, [x2, y2] = n2[i]; return [x2 * x1, x2 * y1, x2, y2 * x1, y2 * y1, y2, x1, y1, 1]; }); const { v, sv } = G.nullvec(A); let Fm = [v.slice(0, 3), v.slice(3, 6), v.slice(6, 9)];
    const d = svd3(Fm); Fm = [0, 1, 2].map(i => [0, 1, 2].map(j => d.s[0] * d.U[0][i] * d.Vs[0][j] + d.s[1] * d.U[1][i] * d.Vs[1][j])); Fm = G.mm(G.T(T2), G.mm(Fm, T1));
    const ed = c1u.map((p, i) => { const l = G.mv(Fm, [p[0], p[1], 1]); return Math.abs(G.dot(l, [c2u[i][0], c2u[i][1], 1])) / Math.hypot(l[0], l[1]); }); const mean = ed.reduce((s, x) => s + x, 0) / ed.length;
    out.textContent = 'singular values of A (smallest 3): ' + sv.slice(-3).map(x => x.toExponential(2)).join(', ') + '\nafter forcing rank 2: σ3(F) = 0\nmean epipolar distance: ' + G.f(mean, 3) + ' px   ' + (norm ? '' : '← without normalisation A mixes numbers of size 1 with numbers of size ~10⁶'); }
  run();
};

/* 8.4 four decompositions, one valid */
W.w3_four_solutions = function (box) {
  V.say(box, 'פירוק של E נותן ארבע אפשרויות: שני סיבובים כפול שני סימנים של t. מבט מלמעלה. <b>עבור על הארבע</b>: רק באחת הנקודה נמצאת מלפני שתי המצלמות. זה מה ש־recoverPose בודקת.');
  let k = 0; V.tabs(box, ['R₁, +t', 'R₁, −t', 'R₂, +t', 'R₂, −t'], i => { k = i; draw(); });
  const svg = G.svg(box, 420, 260); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const o = [210, 170], s = 40; const S = p => [o[0] + p[0] * s, o[1] - p[1] * s]; const P = [0.6, 2.4];
    const c1p = [-1, 0], c2t = [1, 0]; const r1 = G.unit(G.sub(P, c1p)), d2 = G.unit(G.sub(P, c2t)); const sign = k % 2 ? -1 : 1, twist = k >= 2;
    const c2p = G.add(c1p, G.mul(G.sub(c2t, c1p), sign)); const r2 = twist ? [d2[0], -d2[1]] : d2;
    const den = r1[0] * r2[1] - r1[1] * r2[0]; const dd = G.sub(c2p, c1p); const s1 = (dd[0] * r2[1] - dd[1] * r2[0]) / den, s2 = (dd[0] * r1[1] - dd[1] * r1[0]) / den; const X = G.add(c1p, G.mul(r1, s1));
    const cam = (c, dir, col) => { G.dot2(svg, S(c), 7, col); G.line(svg, S(c), S(G.add(c, G.mul(dir, 0.9))), { stroke: col, strokeWidth: 3 }); };
    G.line(svg, S(G.add(c1p, G.mul(r1, -3))), S(G.add(c1p, G.mul(r1, 4))), { stroke: 'var(--ink3)', strokeDasharray: '4 3' }); G.line(svg, S(G.add(c2p, G.mul(r2, -4))), S(G.add(c2p, G.mul(r2, 4))), { stroke: 'var(--c1)', strokeDasharray: '4 3' });
    cam(c1p, r1, 'var(--ink)'); cam(c2p, r2, 'var(--c1)'); G.txt(svg, G.add(S(c1p), [-10, 20]), '1', { fontSize: '11px' }); G.txt(svg, G.add(S(c2p), [-4, 20]), '2', { fontSize: '11px', fill: 'var(--c1)' });
    const ok = s1 > 0 && s2 > 0; G.dot2(svg, S(X), 7, ok ? 'var(--c3)' : 'var(--c2)');
    out.innerHTML = 'מצלמה 1 רואה את הנקודה ' + (s1 > 0 ? 'מלפנים' : '<b>מאחור</b>') + ', מצלמה 2 ' + (s2 > 0 ? 'מלפנים' : '<b>מאחור</b>') + '. ' + (ok ? '<b class="good">זה הפתרון הפיזיקלי.</b>' : 'פתרון מתמטי בלבד: אותה E, מצב לא אפשרי.'); }
  draw();
};
})();
