/* Module 3 visuals — chapters 1–4: pinhole, K, extrinsics, lens distortion */
(function () {
const W = window.W, V = window.V, G = window.G, el = V.el;
const mono = (parent, txt) => { const d = el('div', { class: 'mono', style: { direction: 'ltr', textAlign: 'left', fontSize: '.85em', background: 'var(--code-bg)', padding: '8px 10px', borderRadius: '8px', whiteSpace: 'pre-wrap', marginTop: '6px' } }); d.textContent = txt || ''; parent.appendChild(d); return d; };
const ltr = s => '<span style="display:inline-block;direction:ltr">' + s + '</span>';

/* 1.1 the pinhole box, side view */
W.w3_pinhole = function (box) {
  V.say(box, 'מבט מהצד על מצלמת נקב. <b>הזז את העצם ואת מרחק המוקד</b>, ועקוב אחרי הקרן מראש העצם דרך החור אל החיישן. אחר כך הדלק את "החיישן המדומה".');
  let Z = 10, Y = 1.8, f = 4, virt = false;
  const sr = V.row(box); V.slider(sr, 'מרחק Z (מ׳)', 2, 20, 0.5, Z, v => { Z = v; draw(); }); V.slider(sr, 'גובה Y (מ׳)', 0.5, 3, 0.1, Y, v => { Y = v; draw(); }); V.slider(sr, 'f (מ״מ)', 2, 12, 0.5, f, v => { f = v; draw(); });
  V.tabs(box, ['חיישן אמיתי (מאחור)', 'חיישן מדומה (מלפנים)'], i => { virt = i === 1; draw(); });
  const svg = G.svg(box, 560, 230); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const ph = [170, 130], kz = 18, ky = 40, kf = 22; const Zd = Z * kz, Yd = Y * ky, fd = f * kf; const yd = fd * Yd / Zd;
    G.line(svg, [10, 130], [550, 130], { stroke: 'var(--line2)', strokeDasharray: '3 3' });
    V.s('rect', { x: ph[0] - fd - 6, y: 40, width: fd + 6, height: 180, style: { fill: 'rgba(0,0,0,.04)', stroke: 'var(--ink3)' } }, svg); V.s('rect', { x: ph[0] - 2, y: 124, width: 4, height: 12, style: { fill: 'var(--surface)' } }, svg);
    G.txt(svg, [ph[0] - fd - 4, 34], 'חיישן', { fontSize: '11px' }); G.txt(svg, [ph[0] - 10, 152], 'נקב', { fontSize: '11px' });
    const obj = [ph[0] + Zd, 130 - Yd]; G.line(svg, [obj[0], 130], obj, { stroke: 'var(--c2)', strokeWidth: 4 }); G.dot2(svg, obj, 5, 'var(--c2)');
    const img = [ph[0] - fd, 130 + yd]; G.line(svg, obj, img, { stroke: 'var(--c5, #e8a33d)', strokeWidth: 1.5 }); G.line(svg, [ph[0] - fd, 130], img, { stroke: 'var(--c1)', strokeWidth: 4 });
    if (virt) { G.line(svg, [ph[0] + fd, 130], [ph[0] + fd, 130 - yd], { stroke: 'var(--c3)', strokeWidth: 4 }); G.line(svg, [ph[0] + fd, 40], [ph[0] + fd, 220], { stroke: 'var(--c3)', strokeDasharray: '4 3' }); G.txt(svg, [ph[0] + fd + 4, 52], 'מדומה', { fill: 'var(--c3)', fontSize: '11px' }); }
    G.line(svg, [ph[0], 200], [obj[0], 200], { stroke: 'var(--line2)' }); G.txt(svg, [(ph[0] + obj[0]) / 2 - 10, 215], 'Z = ' + Z + ' m', { fontSize: '11px' });
    const y = f * Y / Z; out.innerHTML = ltr('y = f·Y/Z = ' + f + '·' + Y + '/' + Z + ' = <b>' + G.f(y, 3) + '</b>') + ' מ״מ על החיישן. ' + (virt ? 'בחיישן המדומה אותו גודל בדיוק, אבל התמונה לא הפוכה, ולכן בחישובים משתמשים בו.' : 'התמונה הפוכה: הראש למטה.'); }
  draw();
};

/* 1.2 projection of a person in code */
W.w3_project_person = function (box) {
  V.say(box, 'החיישן של הטלפון (6.4 על 4.8 מ״מ), ו־project_pinhole על הראש והרגליים של אדם. <b>הזז את האדם</b> וקרא את הגובה שלו על החיישן.');
  let Z = 10, H = 1.8, f = 4;
  const sr = V.row(box); V.slider(sr, 'מרחק (מ׳)', 2, 40, 0.5, Z, v => { Z = v; draw(); }); V.slider(sr, 'גובה האדם (מ׳)', 0.8, 2.1, 0.05, H, v => { H = v; draw(); }); V.slider(sr, 'f (מ״מ)', 2, 12, 0.5, f, v => { f = v; draw(); });
  const svg = G.svg(box, 400, 300); const out = mono(box);
  function draw() { svg.innerHTML = ''; const s = 60; const ox = 200, oy = 150; V.s('rect', { x: ox - 3.2 * s / 1, y: oy - 2.4 * s, width: 6.4 * s, height: 4.8 * s, style: { fill: 'var(--surface2, #f6f6f4)', stroke: 'var(--line2)' } }, svg);
    const P = [[0, 1.5 - H, Z], [0, 1.5, Z]]; const x = P.map(p => [f * p[0] / p[2], f * p[1] / p[2]]);
    const a = [ox + x[0][0] * s, oy + x[0][1] * s], b = [ox + x[1][0] * s, oy + x[1][1] * s]; G.line(svg, a, b, { stroke: 'var(--c2)', strokeWidth: 5 }); G.dot2(svg, a, 6, 'var(--c2)');
    G.line(svg, [ox - 8, oy], [ox + 8, oy], { stroke: 'var(--ink3)' }); G.line(svg, [ox, oy - 8], [ox, oy + 8], { stroke: 'var(--ink3)' });
    const h = Math.abs(x[1][1] - x[0][1]); out.textContent = 'person = [[0, ' + G.f(1.5 - H, 2) + ', ' + Z + '], [0, 1.5, ' + Z + ']]   # head, feet (camera 1.5 m above the ground)\nx = f * P[:, :2] / P[:, 2:3]\nheight on sensor = ' + G.f(h * 1000 / 1000, 3) + ' mm   (' + G.f(h / 0.003, 0) + ' pixels of 3 µm)';}
  draw();
};

/* 1.3 a pixel is a ray; parallel lines meet */
W.w3_ray_rails = function (box) {
  V.say(box, 'שני דברים הולכים לאיבוד בהטלה. בחר לשונית.');
  let mode = 0, s = 1, a = 0;
  V.tabs(box, ['פיקסל הוא קרן', 'מסילות נפגשות'], i => { mode = i; ctl(); draw(); });
  const cr = el('div'); box.appendChild(cr); const svg = G.svg(box, 560, 260); const out = V.say(box);
  function ctl() { cr.innerHTML = ''; if (mode === 0) V.slider(cr, 's (כמה רחוק לאורך הקרן)', 0.5, 3, 0.05, s, v => { s = v; draw(); }); else V.slider(cr, 'שיפוע המסילות a (תרגיל 1.3)', -0.6, 0.6, 0.05, a, v => { a = v; draw(); }); }
  function draw() { svg.innerHTML = '';
    if (mode === 0) { const cam = [40, 200]; const P = [1.8, 10]; const k = 22; const Q = [P[0] * s, P[1] * s]; const toS = p => [cam[0] + p[1] * k / 1.4, cam[1] - p[0] * k * 2.2];
      G.line(svg, cam, toS([P[0] * 3.2, P[1] * 3.2]), { stroke: 'var(--c5, #e8a33d)', strokeDasharray: '5 3' }); G.dot2(svg, cam, 6, 'var(--ink)'); G.txt(svg, [cam[0] - 10, cam[1] + 20], 'מצלמה');
      const ad = toS(Q); G.line(svg, [ad[0], cam[1]], ad, { stroke: 'var(--c2)', strokeWidth: 5 }); G.txt(svg, [ad[0] + 6, ad[1] + 4], G.f(1.8 * s, 2) + ' m at ' + G.f(10 * s, 1) + ' m', { fontSize: '11px' });
      G.line(svg, [10, cam[1]], [550, cam[1]], { stroke: 'var(--line2)' });
      out.innerHTML = 'הנקודה (X·s, Y·s, Z·s): על החיישן ' + ltr('f·Y/Z = 4·' + G.f(1.8 * s, 2) + '/' + G.f(10 * s, 1) + ' = <b>0.720</b>') + ' מ״מ לכל s. אדם של 1.8 במרחק 10 וילד של 0.9 במרחק 5 נראים אותו דבר.'; return; }
    const fpx = 300, cx = 280, cy = 110, fr = G.frame(svg, 0, 10, 560, 560, 240);
    G.line(svg, [0, cy + 10], [560, cy + 10], { stroke: 'var(--line2)', strokeDasharray: '3 3' });
    [-0.7, 0.7].forEach(X0 => { const pts = []; for (let Z = 2; Z <= 1000; Z *= 1.12) pts.push([cx + fpx * (X0 + a * Z) / Z, cy + 10 + fpx * 1.5 / Z]); V.s('path', { d: pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(''), style: { fill: 'none', stroke: 'var(--c1)', strokeWidth: 3 } }, svg); });
    for (let Z = 2; Z <= 60; Z += Z < 10 ? 1 : 5) { const y = cy + 10 + fpx * 1.5 / Z; G.line(svg, [cx + fpx * (-0.7 + a * Z) / Z, y], [cx + fpx * (0.7 + a * Z) / Z, y], { stroke: 'var(--ink3)', strokeWidth: 1 }); }
    const vp = [cx + fpx * a, cy + 10]; G.dot2(svg, vp, 6, 'var(--c2)'); G.txt(svg, [vp[0] + 8, vp[1] - 6], 'נקודת מגוז', { fill: 'var(--c2)', fontSize: '11px' }); void fr;
    out.innerHTML = 'X = ±0.7 + a·Z. ככל ש־Z גדל, x = f·(±0.7 + a·Z)/Z שואף ל־' + ltr('f·a = ' + G.f(a, 2) + '·f') + '. נקודת המגוז תלויה רק בכיוון המסילות, וההזזה ±0.7 נעלמת.'; }
  ctl(); draw();
};

/* 1.4 field of view */
W.w3_fov = function (box) {
  V.say(box, 'שדה הראייה האופקי: 2·arctan(w / 2f). <b>שנה את מרחק המוקד</b> וראה את הפשרה: שדה רחב מול כמה פיקסלים מקבל רכב במרחק 50 מטר (תמונה ברוחב 1920).');
  let w = 6.4, f = 4;
  const sr = V.row(box); V.slider(sr, 'רוחב חיישן w (מ״מ)', 3, 36, 0.2, w, v => { w = v; draw(); }); V.slider(sr, 'f (מ״מ)', 2, 50, 0.5, f, v => { f = v; draw(); });
  const svg = G.svg(box, 520, 230); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const fov = 2 * Math.atan(w / (2 * f)); const c = [40, 115], L = 460; const a = fov / 2;
    V.s('path', { d: `M${c[0]},${c[1]} L${c[0] + L},${c[1] - Math.min(115, L * Math.tan(a))} L${c[0] + L},${c[1] + Math.min(115, L * Math.tan(a))} Z`, style: { fill: 'rgba(66,99,235,.12)', stroke: 'var(--c1)' } }, svg);
    G.dot2(svg, c, 7, 'var(--ink)'); const car = [c[0] + 50 * 8, c[1]]; V.s('rect', { x: car[0] - 6, y: car[1] - 7, width: 12, height: 14, style: { fill: 'var(--c2)' } }, svg); G.txt(svg, [car[0] - 18, car[1] - 12], '50 m', { fontSize: '11px' });
    const fx = f * 1920 / w; const px = fx * 1.8 / 50; out.innerHTML = 'שדה ראייה <b>' + G.f(G.deg(fov), 1) + '°</b> · fx ≈ ' + G.f(fx, 0) + ' פיקסלים · רכב ברוחב 1.8 מטר במרחק 50 תופס <b>' + G.f(px, 1) + '</b> פיקסלים. ' + (px < 20 ? 'מעט מדי בשביל מזהה.' : ''); }
  draw();
};

/* 2.1 build K */
W.w3_K = function (box) {
  V.say(box, 'K מעבירה נקודה במערכת המצלמה לפיקסל. <b>שנה את הנקודה ואת הפרמטרים</b>, וקרא את שני השלבים: כפל, ואז חלוקה ברכיב האחרון.');
  const P = [1, 0.5, 10]; let fx = 1333, cx = 960, cy = 540;
  const r1 = V.row(box); ['X', 'Y', 'Z'].forEach((n, i) => V.slider(r1, n + ' (מ׳)', i === 2 ? 1 : -5, i === 2 ? 40 : 5, 0.1, P[i], v => { P[i] = v; draw(); }));
  const r2 = V.row(box); V.slider(r2, 'fx', 400, 2500, 10, fx, v => { fx = v; draw(); }); V.slider(r2, 'cx', 700, 1200, 5, cx, v => { cx = v; draw(); }); V.slider(r2, 'cy', 400, 700, 5, cy, v => { cy = v; draw(); });
  const svg = G.svg(box, 480, 280); const out = mono(box);
  function draw() { svg.innerHTML = ''; const fr = G.frame(svg, 0, 10, 480, 1920, 1080, '1920 × 1080'); const p = [fx * P[0] + cx * P[2], fx * P[1] + cy * P[2], P[2]]; const uv = [p[0] / p[2], p[1] / p[2]];
    G.dot2(svg, fr.map([cx, cy]), 4, 'var(--ink3)'); G.txt(svg, G.add(fr.map([cx, cy]), [6, -6]), '(cx, cy)', { fontSize: '10px' }); if (fr.inside(uv)) G.dot2(svg, fr.map(uv), 7, 'var(--c2)');
    out.textContent = 'K = [[' + fx + ', 0, ' + cx + '], [0, ' + fx + ', ' + cy + '], [0, 0, 1]]\nK @ (X, Y, Z) = (' + p.map(x => G.f(x, 1)).join(', ') + ')\n÷ Z        →  u = ' + G.f(uv[0], 1) + ', v = ' + G.f(uv[1], 1) + (fr.inside(uv) ? '' : '   (outside the image)'); }
  draw();
};

/* 2.2 forward and back: pixel → ray */
W.w3_backproject = function (box) {
  V.say(box, '<b>לחץ על התמונה</b>: הפיקסל חוזר לקרן K⁻¹·(u, v, 1). כל הנקודות למטה נמצאות על אותה קרן ונופלות באותו פיקסל. ולמטה: הנוסחה המעשית פיקסלים = fx · מטרים / מרחק.');
  const K = G.K(1333.3, 960, 540); let uv = [1093, 540], m = 1, Z = 10;
  const svg = G.svg(box, 480, 280); const out = mono(box);
  const sr = V.row(box); V.slider(sr, 'מטרים הצידה', 0.1, 5, 0.1, m, v => { m = v; calc(); }); V.slider(sr, 'מרחק (מ׳)', 2, 100, 1, Z, v => { Z = v; calc(); }); const o2 = V.say(box);
  let fr; svg.addEventListener('click', e => { const r = svg.getBoundingClientRect(); const q = [(e.clientX - r.left) * 480 / r.width, (e.clientY - r.top) * 280 / r.height]; const p = fr.unmap(q); if (fr.inside(p)) { uv = p; draw(); } });
  function draw() { svg.innerHTML = ''; fr = G.frame(svg, 0, 10, 480, 1920, 1080); G.dot2(svg, fr.map(uv), 7, 'var(--c2)'); const d = G.mv(G.inv3(K), [uv[0], uv[1], 1]); const u = G.unit(d);
    out.textContent = 'pixel (u, v) = (' + uv.map(x => G.f(x, 0)).join(', ') + ')\nray d = K⁻¹·(u, v, 1) = (' + d.map(x => G.f(x, 4)).join(', ') + ')\nunit = (' + u.map(x => G.f(x, 4)).join(', ') + ')\npoints on the ray: ' + [5, 10, 20].map(z => '(' + d.map(x => G.f(x * z, 2)).join(', ') + ')').join('  '); }
  function calc() { o2.innerHTML = ltr('1333 · ' + m + ' / ' + Z) + ' = <b>' + G.f(1333.3 * m / Z, 1) + '</b> פיקסלים.'; }
  draw(); calc();
};

/* 2.3 K belongs to a resolution */
W.w3_resize = function (box) {
  V.say(box, 'אותה נקודה בעולם, בשלוש גרסאות של התמונה. בחר גרסה וראה איך K צריכה להשתנות. ואז סמן "שכחתי לעדכן את K" וראה איפה הנקודה נופלת.');
  const K = [[1333.3, 0, 960], [0, 1333.3, 540], [0, 0, 1]]; const P = [1.5, 0.8, 10]; let mode = 0, forgot = false;
  V.tabs(box, ['מקור 1920×1080', 'הקטנה לחצי', 'חיתוך 300 משמאל ו־100 מלמעלה'], i => { mode = i; draw(); });
  V.tabs(box, ['K מעודכנת', 'שכחתי לעדכן את K'], i => { forgot = i === 1; draw(); });
  const svg = G.svg(box, 480, 290); const out = mono(box);
  function draw() { svg.innerHTML = ''; const dims = [[1920, 1080], [960, 540], [1620, 980]][mode]; const Ks = [K, G.mm([[0.5, 0, 0], [0, 0.5, 0], [0, 0, 1]], K), [[1333.3, 0, 660], [0, 1333.3, 440], [0, 0, 1]]][mode]; const Ku = forgot ? K : Ks;
    const fr = G.frame(svg, 0, 10, 480 * dims[0] / 1920, dims[0], dims[1], dims.join(' × ')); const prj = Kx => { const p = G.mv(Kx, P); return [p[0] / p[2], p[1] / p[2]]; };
    const truth = prj(Ks), used = prj(Ku); G.dot2(svg, fr.map(truth), 8, 'var(--c3)'); if (forgot && mode) { G.dot2(svg, fr.map(used), 7, 'var(--c2)'); G.line(svg, fr.map(truth), fr.map(used), { stroke: 'var(--c2)', strokeDasharray: '4 3' }); }
    const hf = 2 * G.deg(Math.atan(dims[0] / (2 * Ks[0][0])));
    out.textContent = 'K = [[' + G.f(Ku[0][0], 1) + ', 0, ' + G.f(Ku[0][2], 0) + '], [0, ' + G.f(Ku[1][1], 1) + ', ' + G.f(Ku[1][2], 0) + '], [0, 0, 1]]\npoint lands at (' + truth.map(x => G.f(x, 1)).join(', ') + ')' + (forgot && mode ? '   computed with the old K: (' + used.map(x => G.f(x, 1)).join(', ') + ')  ✗' : '') + '\nhorizontal field of view: ' + G.f(hf, 1) + '°'; }
  draw();
};

/* 3D helpers for scenes */
const groundGrid = (n, step) => { const L = []; for (let i = -n; i <= n; i += step) { L.push([[i, -n, 0], [i, n, 0]]); L.push([[-n, i, 0], [n, i, 0]]); } return L; };
const cubeEdges = (c, s) => { const v = []; for (const x of [0, 1]) for (const y of [0, 1]) for (const z of [0, 1]) v.push([c[0] + (x - 0.5) * s, c[1] + (y - 0.5) * s, c[2] + z * s]); const E = []; for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) { const d = [0, 1, 2].filter(k => ((i >> (2 - k)) & 1) !== ((j >> (2 - k)) & 1)); if (d.length === 1) E.push([v[i], v[j]]); } return E; };
const render = (svg, fr, K, R, t, segs, st, dist) => segs.forEach(([A, B]) => { const s = G.segProj(K, R, t, A, B, dist); if (s) G.line(svg, fr.map(s[0]), fr.map(s[1]), st); });
window.M3 = { groundGrid, cubeEdges, render, mono, ltr };

/* 3.1 two frames */
W.w3_frames = function (box) {
  V.say(box, 'מבט מלמעלה על העולם (Z למעלה, לכן לא רואים אותו) ועל מצלמה. <b>הזז את המצלמה וסובב אותה</b>, וקרא איך אותה נקודה P נראית בשתי המערכות.');
  let cxp = -4, cyp = -6, h = 2, yaw = 30; const P = [1, 3, 0.5];
  const sr = V.row(box); V.slider(sr, 'מיקום X', -8, 8, 0.5, cxp, v => { cxp = v; draw(); }); V.slider(sr, 'מיקום Y', -8, 8, 0.5, cyp, v => { cyp = v; draw(); }); V.slider(sr, 'כיוון (מעלות)', -180, 180, 5, yaw, v => { yaw = v; draw(); });
  const svg = G.svg(box, 360, 300); const out = mono(box);
  function draw() { svg.innerHTML = ''; const k = 16, o = [180, 160]; const S = p => [o[0] + p[0] * k, o[1] - p[1] * k];
    for (let i = -10; i <= 10; i += 2) { G.line(svg, S([i, -9]), S([i, 9]), { stroke: 'var(--line2)', strokeWidth: 0.6 }); G.line(svg, S([-10, i]), S([10, i]), { stroke: 'var(--line2)', strokeWidth: 0.6 }); }
    G.line(svg, S([0, 0]), S([3, 0]), { stroke: 'var(--c1)', strokeWidth: 3 }); G.txt(svg, S([3.2, -0.3]), 'X', { fill: 'var(--c1)' }); G.line(svg, S([0, 0]), S([0, 3]), { stroke: 'var(--c3)', strokeWidth: 3 }); G.txt(svg, S([0.2, 3.2]), 'Y', { fill: 'var(--c3)' });
    const C = [cxp, cyp, h]; const R = G.attitude(yaw, -10); const t = G.mul(G.mv(R, C), -1);
    const fw = [R[2][0], R[2][1]], rt = [R[0][0], R[0][1]]; G.line(svg, S(C), S(G.add(C.slice(0, 2), G.mul(G.unit(fw), 2.5))), { stroke: 'var(--c2)', strokeWidth: 3 }); G.txt(svg, S(G.add(C.slice(0, 2), G.mul(G.unit(fw), 2.9))), 'Z cam', { fill: 'var(--c2)', fontSize: '10px' });
    G.line(svg, S(C), S(G.add(C.slice(0, 2), G.mul(G.unit(rt), 1.6))), { stroke: 'var(--c5, #e8a33d)', strokeWidth: 3 }); G.txt(svg, S(G.add(C.slice(0, 2), G.mul(G.unit(rt), 1.9))), 'X cam', { fill: 'var(--c5, #e8a33d)', fontSize: '10px' }); G.dot2(svg, S(C), 6, 'var(--ink)');
    G.dot2(svg, S(P), 6, 'var(--c4, #ae3ec9)'); G.txt(svg, G.add(S(P), [8, -6]), 'P');
    const Pc = G.toCam(R, t, P); const RtR = G.mm(G.T(R), R);
    out.textContent = 'P_world = (' + P.join(', ') + ')\nR = [' + R.map(r => '[' + r.map(x => G.f(x, 3)).join(', ') + ']').join(', ') + ']\nt = (' + t.map(x => G.f(x, 2)).join(', ') + ')\nP_cam = R·P_world + t = (' + Pc.map(x => G.f(x, 2)).join(', ') + ')   ← Z_cam is the depth\nRᵀ·R ≈ I: ' + (RtR.every((r, i) => r.every((x, j) => Math.abs(x - (i === j)) < 1e-9)) ? 'yes' : 'no') + '   det R = ' + G.f(G.det3(R), 3); }
  draw();
};

/* 3.2 look_at and a rendered scene */
W.w3_look_at = function (box) {
  V.say(box, 'look_at בונה R ו־t ממיקום ונקודת מבט, ו־project מצייר את הסצנה. <b>הזז את המצלמה</b>. נסה גם גובה 10 ממש מעל הראשית: שם look_at המקורית נשברת (תרגיל 3.3).');
  const C = [0, -10, 3], T = [0, 0, 0];
  const r1 = V.row(box); V.slider(r1, 'C.x', -12, 12, 0.5, C[0], v => { C[0] = v; draw(); }); V.slider(r1, 'C.y', -15, 15, 0.5, C[1], v => { C[1] = v; draw(); }); V.slider(r1, 'C.z (גובה)', 0.5, 12, 0.5, C[2], v => { C[2] = v; draw(); });
  const svg = G.svg(box, 512, 300); const out = mono(box);
  const K = G.K(1000, 640, 360); const grid = groundGrid(6, 1), cube = cubeEdges([0, 0, 0], 2);
  function draw() { svg.innerHTML = ''; const fr = G.frame(svg, 0, 10, 512, 1280, 720); const z = G.unit(G.sub(T, C)); const degenerate = G.norm(G.cross(z, [0, 0, 1])) < 1e-6;
    const { R, t } = G.lookAt(C, T); render(svg, fr, K, R, t, grid, { stroke: 'var(--line2)', strokeWidth: 0.8 }); render(svg, fr, K, R, t, cube, { stroke: 'var(--c1)', strokeWidth: 2 });
    render(svg, fr, K, R, t, [[[0, 0, 0], [2, 0, 0]]], { stroke: 'var(--c2)', strokeWidth: 3 }); render(svg, fr, K, R, t, [[[0, 0, 0], [0, 2, 0]]], { stroke: 'var(--c3)', strokeWidth: 3 });
    out.textContent = 'R, t = look_at(' + JSON.stringify(C) + ', [0, 0, 0])\nR rows (x, y, z of the camera in world): ' + R.map(r => '[' + r.map(x => G.f(x, 2)).join(', ') + ']').join(' ') + '\nt = (' + t.map(x => G.f(x, 2)).join(', ') + ')' + (degenerate ? '\n⚠ looking straight down: cross(z, up) = 0 → the original look_at returns nan. Here we fall back to up = (0, 1, 0).' : ''); }
  draw();
};

/* 3.3 t is not the camera position; rvec */
W.w3_t_trap = function (box) {
  V.say(box, 'המלכודת מספר 1: t הוא לא מיקום המצלמה. <b>הזז את המצלמה במעגל</b> והשווה את t (באדום, אם מציירים אותו כאילו הוא מיקום) ל־C = −Rᵀ·t (בירוק). ולמטה: וקטור הסיבוב rvec.');
  let ang = -90, h = 3;
  const sr = V.row(box); V.slider(sr, 'זווית סביב הסצנה', -180, 180, 5, ang, v => { ang = v; draw(); }); V.slider(sr, 'גובה', 0.5, 8, 0.5, h, v => { h = v; draw(); });
  const svg = G.svg(box, 340, 300); const out = mono(box);
  function draw() { svg.innerHTML = ''; const k = 11, o = [170, 150]; const S = p => [o[0] + p[0] * k, o[1] - p[1] * k];
    G.line(svg, S([-13, 0]), S([13, 0]), { stroke: 'var(--line2)' }); G.line(svg, S([0, -13]), S([0, 13]), { stroke: 'var(--line2)' }); G.dot2(svg, S([0, 0]), 4, 'var(--ink3)');
    const C = [10 * Math.cos(G.rad(ang)), 10 * Math.sin(G.rad(ang)), h]; const { R, t } = G.lookAt(C, [0, 0, 0]); const Cb = G.mul(G.mv(G.T(R), t), -1);
    G.dot2(svg, S(Cb), 8, 'var(--c3)'); G.txt(svg, G.add(S(Cb), [8, 4]), 'C', { fill: 'var(--c3)' }); G.dot2(svg, S(t), 7, 'var(--c2)'); G.txt(svg, G.add(S(t), [8, 4]), 't ✗', { fill: 'var(--c2)' });
    const tr = R[0][0] + R[1][1] + R[2][2]; const th = Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2))); const ax = [R[2][1] - R[1][2], R[0][2] - R[2][0], R[1][0] - R[0][1]]; const rv = G.mul(G.unit(ax), th);
    out.textContent = 't = (' + t.map(x => G.f(x, 2)).join(', ') + ')    ← world origin, seen from the camera\nC = −Rᵀ·t = (' + Cb.map(x => G.f(x, 2)).join(', ') + ')\nrvec = (' + rv.map(x => G.f(x, 4)).join(', ') + ')   |rvec| = ' + G.f(G.deg(th), 1) + '°  (axis = direction, angle = length)'; }
  draw();
};

/* 4.1 distortion on a grid */
W.w3_distort_grid = function (box) {
  V.say(box, 'רשת של קווים ישרים, אחרי עיוות עדשה (K של פרק 3, 1280 על 720). <b>שנה את המקדמים</b>: k1 שלילי הוא חבית, חיובי הוא כרית, p1 ו־p2 מטים.');
  const d = [-0.30, 0.10, 0, 0, 0]; const K = G.K(1000, 640, 360);
  const r1 = V.row(box); [['k1', -0.6, 0.4, 0.01], ['k2', -0.2, 0.3, 0.01], ['p1', -0.02, 0.02, 0.001], ['p2', -0.02, 0.02, 0.001]].forEach(([n, a, b, s], i) => V.slider(r1, n, a, b, s, d[i], v => { d[i] = v; draw(); }, x => G.f(x, s < 0.01 ? 3 : 2)));
  const svg = G.svg(box, 512, 300); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const fr = G.frame(svg, 0, 10, 512, 1280, 720); const pr = (u, v) => { const x = (u - 640) / 1000, y = (v - 360) / 1000; const [a, b] = G.distort([x, y], d); return fr.map([1000 * a + 640, 1000 * b + 360]); };
    for (let u = 0; u <= 1280; u += 80) { const pts = []; for (let v = 0; v <= 720; v += 20) pts.push(pr(u, v)); V.s('path', { d: pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(''), style: { fill: 'none', stroke: 'var(--c1)', strokeWidth: 1 } }, svg); }
    for (let v = 0; v <= 720; v += 80) { const pts = []; for (let u = 0; u <= 1280; u += 20) pts.push(pr(u, v)); V.s('path', { d: pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(''), style: { fill: 'none', stroke: 'var(--c1)', strokeWidth: 1 } }, svg); }
    const c = pr(1280, 720), c0 = fr.map([1280, 720]); G.dot2(svg, c, 5, 'var(--c2)'); const sh = [(c[0] - c0[0]) / fr.s, (c[1] - c0[1]) / fr.s];
    out.innerHTML = 'הפינה (1280, 720) זזה ב־' + ltr('(' + G.f(sh[0], 0) + ', ' + G.f(sh[1], 0) + ')') + ' פיקסלים. ' + (d[0] < -0.01 ? 'k1 שלילי: חבית, הפינות נמשכות פנימה.' : d[0] > 0.01 ? 'k1 חיובי: כרית, הפינות נדחפות החוצה.' : ''); }
  draw();
};

/* 4.2 how much it matters */
W.w3_distort_amount = function (box) {
  V.say(box, 'ההזזה בפיקסלים כפונקציה של המרחק מהמרכז (fx = 1000, המקדמים של הפרק). ולמטה: איפה נופל קו שצריך להיות בשורה 660.');
  const d = [-0.30, 0.10, 0.001, -0.0005, 0];
  const r1 = V.row(box); V.slider(r1, 'k1', -0.6, 0.3, 0.01, d[0], v => { d[0] = v; draw(); }); V.slider(r1, 'k2', -0.2, 0.3, 0.01, d[1], v => { d[1] = v; draw(); });
  const P = window.IM.plot(box, { w: 440, h: 180 }); const out = V.say(box);
  function draw() { const pts = []; for (let r = 0; r <= 800; r += 10) { const [a] = G.distort([r / 1000, 0], d); pts.push([r, 1000 * a - r]); }
    const lo = Math.min(-100, ...pts.map(p => p[1])), hi = Math.max(10, ...pts.map(p => p[1])); P.draw([{ pts, color: 'var(--c2)', width: 2.5 }, { pts: [[0, 0], [800, 0]], color: 'var(--line2)', dash: '3 3' }], [0, 800], [lo, hi]);
    const rows = [40, 240, 440, 640, 840, 1040, 1240].map(u => { const [, b] = G.distort([(u - 640) / 1000, 300 / 1000], d); return Math.round(1000 * b + 360); });
    const at = r => { const [a] = G.distort([r / 1000, 0], d); return G.f(1000 * a - r, 1); };
    out.innerHTML = 'הזזה ב־100, 300, 500, 700: ' + ltr([100, 300, 500, 700].map(at).join(', ')) + ' פיקסלים. הקו של שורה 660 נופל בשורות ' + ltr(rows.join(', ')) + ': קשת.'; }
  draw();
};

/* 4.3 iterative undistortion */
W.w3_undistort = function (box) {
  V.say(box, 'ביטול עיוות בניחוש ותיקון: מעוותים את הניחוש, בודקים בכמה פספסנו, ומזיזים. <b>הגדל את מספר הצעדים</b>, ואז הקצן את k1 ל־−0.6 (תרגיל 4.2) וראה כמה צעדים צריך.');
  let k1 = -0.30, it = 10; const uvd = [1280, 720], K = G.K(1000, 640, 360);
  const r1 = V.row(box); V.slider(r1, 'k1', -0.6, 0, 0.01, k1, v => { k1 = v; draw(); }); V.slider(r1, 'צעדים', 1, 40, 1, it, v => { it = v; draw(); });
  const P = window.IM.plot(box, { w: 440, h: 170 }); const out = V.say(box);
  function draw() { const d = [k1, 0.10, 0.001, -0.0005, 0]; const xyd = [(uvd[0] - 640) / 1000, (uvd[1] - 360) / 1000]; const H = G.undistortIter(xyd, d, 40);
    const err = H.map(xy => { const e = G.sub(G.distort(xy, d), xyd); return 1000 * G.norm(e); }); const pts = err.slice(0, it + 1).map((e, i) => [i, Math.log10(Math.max(e, 1e-6))]);
    P.draw([{ pts, color: 'var(--c1)', width: 2.5, dots: true }, { pts: [[0, 0], [40, 0]], color: 'var(--line2)', dash: '3 3' }], [0, Math.max(10, it)], [-6, 3]);
    const xy = H[it]; out.innerHTML = 'אחרי ' + it + ' צעדים: שגיאה של <b>' + G.f(err[it], err[it] < 0.1 ? 4 : 1) + '</b> פיקסלים (ציר אנכי בלוג, הקו המקווקו הוא פיקסל אחד). הנקודה הישרה: ' + ltr('(' + G.f(1000 * xy[0] + 640, 1) + ', ' + G.f(1000 * xy[1] + 360, 1) + ')') + '.'; void K; }
  draw();
};
})();
