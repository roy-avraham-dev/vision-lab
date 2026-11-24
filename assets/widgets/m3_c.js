/* Module 3 visuals — chapters 9–12: triangulation, stereo and depth, visual odometry, pixel → ground project */
(function () {
const W = window.W, V = window.V, G = window.G, el = V.el;
const { mono, ltr, render } = window.M3;
const click = (svg, w, h, fn) => svg.addEventListener('click', e => { const r = svg.getBoundingClientRect(); fn([(e.clientX - r.left) * w / r.width, (e.clientY - r.top) * h / r.height]); });
const path = (svg, pts, st) => V.s('path', { d: pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(''), style: Object.assign({ fill: 'none', stroke: 'var(--c1)', strokeWidth: 2 }, st || {}) }, svg);

/* 9.1 two rays with noise: where the reconstructed points land */
W.w3_two_rays = function (box) {
  V.say(box, 'מבט מלמעלה: שתי מצלמות, נקודה, ו־200 טריאנגולציות עם רעש בפיקסלים. <b>הרחק את הנקודה</b> וראה את ענן השחזורים נמתח לאורך הקרן ולא לרוחב.');
  let Z = 8, B = 0.5, noise = 0.5; const f = 1000;
  const sr = V.row(box); V.slider(sr, 'עומק Z (מ׳)', 2, 30, 0.5, Z, v => { Z = v; draw(); }); V.slider(sr, 'בסיס B (מ׳)', 0.1, 2, 0.1, B, v => { B = v; draw(); }); V.slider(sr, 'רעש (פיקסלים)', 0, 3, 0.1, noise, v => { noise = v; draw(); });
  const svg = G.svg(box, 520, 260); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const r = G.rng(2); const P = [0.3, Z]; const cams = [[-B / 2, 0], [B / 2, 0]]; const k = 220 / (Z * 1.3), o = [260, 240]; const S = p => [o[0] + p[0] * k * 3, o[1] - p[1] * k];
    cams.forEach(c => { G.dot2(svg, S(c), 6, 'var(--ink)'); G.line(svg, S(c), S(P), { stroke: 'var(--line2)' }); });
    const pts = []; for (let i = 0; i < 200; i++) { const u = cams.map(c => f * (P[0] - c[0]) / P[1] + G.randn(r) * noise); const d = u[0] - u[1]; if (d <= 0) continue; const z = f * B / d; const x = cams[0][0] + u[0] * z / f; pts.push([x, z]); }
    pts.forEach(p => G.dot2(svg, S(p), 1.8, 'var(--c2)')); G.dot2(svg, S(P), 5, 'var(--c3)');
    const sd = a => { const m = a.reduce((s, x) => s + x, 0) / a.length; return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length); };
    out.innerHTML = 'סטיית תקן בעומק <b>' + G.f(sd(pts.map(p => p[1])) * 100, 1) + ' ס״מ</b>, לרוחב <b>' + G.f(sd(pts.map(p => p[0])) * 100, 1) + ' ס״מ</b> (הציר האופקי מוגדל פי 3). הנוסחה, עם רעש בשתי התמונות (σ_d = √2·σ): ' + ltr('Z²·σ_d/(f·B) = ' + G.f(Z * Z * noise * Math.SQRT2 / (f * B) * 100, 1)) + ' ס״מ.'; }
  draw();
};

/* 9.2 the angle between the rays */
W.w3_ray_angle = function (box) {
  V.say(box, 'טריאנגולציה (DLT של הסעיף) של נקודה בעשרה מטרים, כשהיא זזה לכיוון הקו שמחבר את המצלמות (תרגיל 9.2). <b>הקטן את הזווית בין הקרניים</b> וראה את השגיאה מתפוצצת.');
  let ang = 90; V.slider(box, 'מיקום הנקודה: זווית מקו הבסיס (מעלות)', 1, 90, 1, ang, v => { ang = v; draw(); });
  const svg = G.svg(box, 460, 220); const out = V.say(box); const K = G.K(1000, 640, 360);
  function draw() { svg.innerHTML = ''; const r = G.rng(4); const c1 = [0, 0, 1.5], c2 = [1, 0, 1.5]; const a = G.rad(ang); const P = [0.5 + 10 * Math.cos(a), 10 * Math.sin(a), 1.5];
    const A = G.lookAt(c1, P), Bc = G.lookAt(c2, P); const P1 = G.Pmat(K, A.R, A.t), P2 = G.Pmat(K, Bc.R, Bc.t); const errs = [];
    for (let i = 0; i < 100; i++) { const u1 = G.project(K, A.R, A.t, P), u2 = G.project(K, Bc.R, Bc.t, P); const X = G.triangulate([P1, P2], [[u1[0] + G.randn(r) * 0.5, u1[1] + G.randn(r) * 0.5], [u2[0] + G.randn(r) * 0.5, u2[1] + G.randn(r) * 0.5]]); errs.push(G.norm(G.sub(X, P))); }
    const k = 9, o = [60, 200]; const S = p => [o[0] + p[0] * k * 3, o[1] - p[1] * k * 1.6]; [c1, c2].forEach(c => { G.dot2(svg, S(c), 6, 'var(--ink)'); G.line(svg, S(c), S(P), { stroke: 'var(--c5, #e8a33d)' }); }); G.dot2(svg, S(P), 6, 'var(--c2)'); G.line(svg, S([-1, 0]), S([13, 0]), { stroke: 'var(--line2)', strokeDasharray: '3 3' });
    const ra = G.deg(Math.acos(G.dot(G.unit(G.sub(P, c1)), G.unit(G.sub(P, c2))))); out.innerHTML = 'הזווית בין הקרניים: <b>' + G.f(ra, 2) + '°</b>. חציון השגיאה (רעש של חצי פיקסל): <b>' + G.f(G.median(errs), 3) + ' מ׳</b>. ' + (ra < 1 ? 'הקרניים כמעט מתלכדות: אין נקודת חיתוך מוגדרת.' : ''); }
  draw();
};

/* 9.3 depth error grows like Z² */
W.w3_depth_curve = function (box) {
  V.say(box, 'שגיאת העומק לפיקסל אחד של שגיאה בהפרש: Z²/(f·B). <b>שנה את f ואת הבסיס</b>. ערכי ברירת המחדל הם של תרגיל 9.1.');
  let f = 1000, B = 0.12, s = 1;
  const sr = V.row(box); V.slider(sr, 'f (פיקסלים)', 300, 3000, 50, f, v => { f = v; draw(); }); V.slider(sr, 'בסיס B (ס״מ)', 2, 100, 1, 12, v => { B = v / 100; draw(); }); V.slider(sr, 'שגיאת התאמה (פיקסלים)', 0.1, 2, 0.1, s, v => { s = v; draw(); });
  const P = window.IM.plot(box, { w: 440, h: 190 }); const out = V.say(box);
  function draw() { const e = Z => Z * Z * s / (f * B); const pts = []; for (let Z = 0.5; Z <= 20; Z += 0.25) pts.push([Z, e(Z)]); P.draw([{ pts, color: 'var(--c2)', width: 2.5 }, { pts: pts.map(([Z]) => [Z, Z * 0.05]), color: 'var(--ink3)', dash: '4 3' }], [0, 20], [0, Math.min(5, e(20))]);
    out.innerHTML = 'ב־3 מטר: <b>' + (e(3) < 1 ? G.f(e(3) * 100, 1) + ' ס״מ' : G.f(e(3), 2) + ' מ׳') + '</b>, ב־15 מטר: <b>' + (e(15) < 1 ? G.f(e(15) * 100, 1) + ' ס״מ' : G.f(e(15), 2) + ' מ׳') + '</b>. פי 5 במרחק, פי 25 בשגיאה. הקו המקווקו הוא 5% מהמרחק.'; }
  draw();
};

/* 10.1 rectified stereo and disparity */
W.w3_disparity = function (box) {
  V.say(box, 'מצלמות מיושרות: אותה שורה, הפרש בעמודות d = fx·B/Z. <b>הזז את הנקודה</b>, ושנה את numDisparities כדי לראות מה העומק הקרוב ביותר (תרגיל 10.1).');
  let Z = 4, nd = 48; const f = 700, B = 0.1;
  const sr = V.row(box); V.slider(sr, 'עומק Z (מ׳)', 0.5, 15, 0.1, Z, v => { Z = v; draw(); }); V.slider(sr, 'numDisparities', 16, 128, 16, nd, v => { nd = v; draw(); });
  const svg = G.svg(box, 540, 170); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const fl = G.frame(svg, 0, 18, 260, 640, 480, 'שמאל'), fr = G.frame(svg, 280, 18, 260, 640, 480, 'ימין'); const X = 0.2; const uL = 320 + f * (X + B / 2) / Z, uR = 320 + f * (X - B / 2) / Z; const v = 240;
    G.line(svg, fl.map([0, v]), fl.map([640, v]), { stroke: 'var(--line2)', strokeDasharray: '3 3' }); G.line(svg, fr.map([0, v]), fr.map([640, v]), { stroke: 'var(--line2)', strokeDasharray: '3 3' });
    V.s('rect', { x: fl.map([0, 0])[0], y: fl.map([0, 0])[1], width: nd * fl.s, height: 480 * fl.s, style: { fill: 'rgba(224,49,49,.12)' } }, svg);
    G.dot2(svg, fl.map([uL, v]), 6, 'var(--c2)'); G.dot2(svg, fr.map([uR, v]), 6, 'var(--c2)'); G.dot2(svg, fr.map([uL, v]), 4, 'var(--ink3)'); G.line(svg, fr.map([uL, v]), fr.map([uR, v]), { stroke: 'var(--c2)', strokeWidth: 2 });
    const d = f * B / Z; const zmin = f * B / (nd - 1);
    out.innerHTML = 'd = ' + ltr('700 · 0.1 / ' + Z) + ' = <b>' + G.f(d, 1) + '</b> פיקסלים. ' + (d > nd - 1 ? '<b class="bad">מחוץ לטווח החיפוש: אין עומק.</b> ' : '') + 'העומק הקרוב ביותר עם ' + nd + ': <b>' + G.f(zmin, 2) + ' מ׳</b>. הרצועה האדומה בשמאל (' + nd + ' עמודות) לא מקבלת עומק.'; }
  draw();
};

/* 10.2 matching along one row */
W.w3_scanline = function (box) {
  V.say(box, 'התאמה לאורך שורה אחת: לוחות ב־4 ו־7 מטר מול קיר ב־12 (fx = 700, בסיס 10 ס״מ). <b>בחר פיקסל בתמונה השמאלית</b>, וראה את עלות ההתאמה לכל הפרש. אחר כך כבה את המרקם של הלוח הקרוב.');
  let x = 200, win = 7, flat = false;
  const sr = V.row(box); V.slider(sr, 'פיקסל בשורה', 60, 600, 1, x, v => { x = v; draw(); }); V.slider(sr, 'חלון', 3, 21, 2, win, v => { win = v; draw(); });
  V.tabs(box, ['כל המשטחים מרוקמים', 'הלוח הקרוב בלי מרקם'], i => { flat = i === 1; draw(); });
  const P = window.IM.plot(box, { w: 440, h: 170 }); const out = V.say(box);
  const tex = (() => { const r = G.rng(8); return [...Array(2000)].map(() => r()); })();
  const depthAt = u => (u > 150 && u < 300) ? 4 : (u > 380 && u < 520) ? 7 : 12;
  function rowL(flatNear) { const L = []; for (let u = 0; u < 640; u++) { const Z = depthAt(u); const X = Math.floor((u - 320) * Z / 700 * 40 + 1000); L.push(flatNear && Z === 4 ? 0.5 : tex[(X + Z * 97) % 2000]); } return L; }
  function rowR(flatNear) { const L = rowL(flatNear), R = []; for (let u = 0; u < 640; u++) { let best = 0.5; for (const Z of [4, 7, 12]) { const d = Math.round(700 * 0.1 / Z); const ul = u + d; if (ul < 640 && depthAt(ul) === Z) { best = L[ul]; break; } } R.push(best); } return R; }
  function draw() { const L = rowL(flat), R = rowR(flat); const h = (win - 1) / 2; const costs = []; for (let d = 0; d < 48; d++) { let c = 0; for (let k = -h; k <= h; k++) { const a = L[x + k], b = R[x + k - d]; c += (a === undefined || b === undefined) ? 1 : Math.abs(a - b); } costs.push([d, c / win]); }
    let bd = 0; costs.forEach(c => { if (c[1] < costs[bd][1]) bd = c[0]; }); const sorted = costs.map(c => c[1]).sort((a, b) => a - b); const unique = sorted[1] > 0 && (sorted[0] / sorted[1]) < 0.9 || sorted[0] < 1e-9 && sorted[1] > 0.05;
    const Zt = depthAt(x); P.draw([{ pts: costs, color: 'var(--c1)', width: 2, dots: false }, { vline: 700 * 0.1 / Zt, color: 'var(--c3)', dash: '4 3', label: 'אמת' }, { vline: bd, color: 'var(--c2)', label: 'מינימום' }], [0, 47], [0, Math.max(0.5, ...costs.map(c => c[1]))]);
    out.innerHTML = 'עומק אמיתי ' + Zt + ' מ׳ (הפרש ' + G.f(70 / Zt, 1) + '). המינימום בהפרש <b>' + bd + '</b> → ' + (bd ? G.f(70 / bd, 2) + ' מ׳' : '∞') + '. ' + (flat && Zt === 4 ? 'בלי מרקם העלות שטוחה: כל הפרש נראה טוב באותה מידה, ו־uniquenessRatio יוותר על הפיקסל.' : unique ? 'מינימום ברור.' : 'מינימום לא ברור.'); }
  draw();
};

/* 10.3 relative depth → metres */
W.w3_mono_scale = function (box) {
  V.say(box, 'מודל עומק יחסי מחזיר בערך s/Z + b עם s ו־b לא ידועים. מוצאים אותם בריבועים פחותים מכמה נקודות שהעומק שלהן ידוע. <b>בחר את נקודות הייחוס</b> (תרגיל 10.2).');
  let mode = 0; V.tabs(box, ['6 נקודות, 3 עד 30 מטר', '2 נקודות, 10 ו־11 מטר'], i => { mode = i; draw(); });
  const P = window.IM.plot(box, { w: 440, h: 190 }); const out = V.say(box);
  function draw() { const r = G.rng(6); const rel = Z => 5 / Z + 0.2 + G.randn(r) * 0.004; const Zs = []; for (let Z = 2; Z <= 40; Z += 0.5) Zs.push(Z); const R = Zs.map(rel);
    const refs = mode ? [10, 11] : [3, 6, 10, 15, 22, 30]; const A = refs.map(Z => [rel(Z), 1]); const y = refs.map(Z => 1 / Z); const AtA = [[0, 0], [0, 0]], Atb = [0, 0]; A.forEach((a, i) => { for (let p = 0; p < 2; p++) { Atb[p] += a[p] * y[i]; for (let q = 0; q < 2; q++) AtA[p][q] += a[p] * a[q]; } }); const [s, b] = V.solve(AtA, Atb);
    const est = R.map(x => 1 / (s * x + b)); const pts = Zs.map((Z, i) => [Z, Math.max(0, Math.min(60, est[i]))]); P.draw([{ pts: Zs.map(Z => [Z, Z]), color: 'var(--c3)', width: 2 }, { pts, color: 'var(--c2)', width: 2, dots: true }].concat(refs.map(Z => ({ vline: Z, color: 'var(--c1)', dash: '2 2' }))), [0, 40], [0, 60]);
    const near30 = Zs.map((Z, i) => [Z, est[i]]).filter(([Z]) => Z >= 27 && Z <= 33).map(([Z, e]) => Math.abs(e - Z) / Z); out.innerHTML = 'ירוק: אמת. אדום: אחרי ההתאמה. שגיאה חציונית סביב 30 מטר: <b>' + G.f(G.median(near30) * 100, 1) + '%</b>. ' + (mode ? 'שתי נקודות קרובות לא מספיקות כדי להפריד בין s ל־b, וההחצנה רחוק מגדילה את הטעות.' : 'נקודות בפיזור רחב של מרחקים קובעות את s ו־b היטב.'); }
  draw();
};

/* 11.1 visual odometry on a circle */
function voPath(mode, noise, seed) { const r = G.rng(seed || 3); const n = 120, L = 2 * Math.PI * 10 / n, dth = 2 * Math.PI / n; const tru = [[10, 0]], est = [[10, 0]]; let a = Math.PI / 2, ae = a;
  for (let i = 0; i < n; i++) { a += dth; const p = tru[i]; tru.push([p[0] + L * Math.cos(a - dth / 2), p[1] + L * Math.sin(a - dth / 2)]);
    ae += dth + G.randn(r) * noise * 0.004; const sc = mode === 1 ? 1 / L : mode === 2 ? 1.02 : mode === 3 ? 1 + G.randn(r) * 0.02 : 1; const q = est[i]; est.push([q[0] + L * sc * Math.cos(ae - dth / 2), q[1] + L * sc * Math.sin(ae - dth / 2)]); }
  return { tru, est }; }
W.w3_vo = function (box) {
  V.say(box, 'מצלמה נוסעת במעגל ברדיוס 10 מטר, 120 פריימים. בכל צעד מוסיפים את הסיבוב והתזוזה שחושבו מהמטריצה החיונית. <b>בחר מאיפה בא קנה המידה</b> ושנה את הרעש.');
  let mode = 0, noise = 0.5; V.tabs(box, ['קנה מידה ידוע', 'בלי קנה מידה (1 בכל צעד)', 'הטיה קבועה של 2%', 'שגיאה אקראית של 2%'], i => { mode = i; draw(); }); V.slider(box, 'רעש (פיקסלים)', 0, 3, 0.1, noise, v => { noise = v; draw(); });
  const svg = G.svg(box, 340, 300); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const { tru, est } = voPath(mode, noise); const all = tru.concat(est); const m = Math.max(...all.map(p => Math.max(Math.abs(p[0]), Math.abs(p[1])))) * 1.1; const k = 140 / m, o = [170, 150]; const S = p => [o[0] + p[0] * k, o[1] - p[1] * k];
    path(svg, tru.map(S), { stroke: 'var(--c3)', strokeWidth: 2.5 }); path(svg, est.map(S), { stroke: 'var(--c2)', strokeWidth: 2, strokeDasharray: '5 3' }); G.dot2(svg, S(tru[0]), 5, 'var(--ink)');
    const errs = tru.map((p, i) => G.norm(G.sub(p, est[i]))); const len = est.slice(1).reduce((s, p, i) => s + G.norm(G.sub(p, est[i])), 0);
    out.innerHTML = 'אורך המסלול המשוער: <b>' + G.f(len, 1) + '</b> (אמת 62.8 מטר). שגיאה בסוף: <b>' + G.f(errs[errs.length - 1], 2) + '</b>, מקסימלית: <b>' + G.f(Math.max(...errs), 2) + '</b>. ' + (mode === 1 ? 'הצורה נכונה, הגודל חסר משמעות: עמימות קנה המידה.' : mode === 2 ? 'הטיה קבועה: הסוף כמעט חוזר להתחלה, אבל באמצע הלולאה השגיאה גדולה (תרגיל 11.2).' : ''); }
  draw();
};

/* 11.2 loop closure */
W.w3_loop_closure = function (box) {
  V.say(box, 'בסוף ההקפה ידוע שחזרנו לנקודת ההתחלה. <b>הפעל סגירת לולאה</b>: הפער מתפזר לינארית לאורך המסלול (תרגיל 11.3). שנה את ההרצה וראה שהמקסימום לא תמיד משתפר.');
  let on = false, seed = 1; V.tabs(box, ['בלי סגירת לולאה', 'עם סגירת לולאה'], i => { on = i === 1; draw(); }); V.slider(box, 'הרצה', 1, 6, 1, seed, v => { seed = v; draw(); });
  const svg = G.svg(box, 340, 300); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const { tru, est } = voPath(0, 2.5, seed * 17); const T = est.length; const gap = G.sub(est[T - 1], est[0]); const cor = est.map((p, i) => G.sub(p, G.mul(gap, i / (T - 1)))); const show = on ? cor : est;
    const k = 12, o = [170, 150]; const S = p => [o[0] + p[0] * k, o[1] - p[1] * k]; path(svg, tru.map(S), { stroke: 'var(--c3)', strokeWidth: 2.5 }); path(svg, show.map(S), { stroke: 'var(--c2)', strokeWidth: 2, strokeDasharray: '5 3' });
    if (!on) G.line(svg, S(est[T - 1]), S(est[0]), { stroke: 'var(--c2)', strokeWidth: 3 });
    const st = P => { const e = tru.map((p, i) => G.norm(G.sub(p, P[i]))); return [e.reduce((s, x) => s + x, 0) / e.length, Math.max(...e)]; }; const a = st(est), b = st(cor);
    out.innerHTML = 'ממוצע: ' + G.f(a[0], 2) + ' → <b>' + G.f(b[0], 2) + '</b> · מקסימום: ' + G.f(a[1], 2) + ' → <b>' + G.f(b[1], 2) + '</b>. ' + (b[1] > a[1] ? 'כאן המקסימום אפילו גדל: הפיזור השווה לא יודע איפה נוצרה הטעות. לכן מערכות אמיתיות ממזערות גרף.' : 'הפיזור עזר, אבל הוא שווה לכל הצעדים ולא לפי הוודאות של כל אחד.'); }
  draw();
};

/* ===== chapter 12 ===== */
const Kd = G.K(1400, 960, 540);
W.w3_pipeline = function (box) {
  V.say(box, 'הדרך של פיקסל אחד עד למטרים, צעד אחרי צעד, עם מספרים אמיתיים (רחפן בגובה 50 מטר, מבט 60 מעלות מטה).');
  const R = G.attitude(30, -60), C = [0, 0, 50]; const uv = [1200, 800]; const out = mono(box);
  const Ki = G.inv3(Kd); const xy = G.mv(Ki, [uv[0], uv[1], 1]); const rw = G.mv(G.T(R), xy); const s = (0 - C[2]) / rw[2]; const P = G.add(C, G.mul(rw, s));
  const steps = [['פיקסל מהמזהה', 'uv = (' + uv.join(', ') + ')'], ['undistortPoints: מבטל עיוות ואת K', '(x, y) = (' + G.f(xy[0], 4) + ', ' + G.f(xy[1], 4) + ')'], ['קרן במערכת המצלמה', 'ray_cam = (x, y, 1)'], ['סיבוב לעולם: כפל ב־Rᵀ', 'ray_w = (' + rw.map(x => G.f(x, 4)).join(', ') + ')'], ['כמה להתקדם עד הקרקע', 's = (0 − ' + C[2] + ') / ' + G.f(rw[2], 4) + ' = ' + G.f(s, 2)], ['נקודת החיתוך', 'P = C + s·ray_w = (' + P.map(x => G.f(x, 2)).join(', ') + ') m']];
  V.stepper(box, steps.length, i => { out.textContent = steps.slice(0, i + 1).map((st, k) => (k + 1) + '. ' + st[1]).join('\n'); box.querySelector('.stepcap').innerHTML = '<b>' + steps[i][0] + '</b>'; });
  box.insertBefore(el('div', { class: 'say stepcap' }), out);
};

/* 12.2 pixel → ground, side view, and the plane height */
W.w3_px2ground = function (box) {
  V.say(box, 'מבט מהצד על השולחן של תרגיל 12.3: מצלמה בגובה 0.6 מטר, נטויה 70 מעלות. <b>הזז את השורה בתמונה</b>, ובחר לאיזה מישור מטילים. הספר בגובה 10 ס״מ.');
  let v = 300, gz = 0; const K = G.K(900, 640, 360); const R = G.attitude(0, -70), C = [0, 0, 0.6];
  V.slider(box, 'שורה v בתמונה', 0, 720, 5, v, x => { v = x; draw(); }); V.tabs(box, ['הטלה ל־Z = 0', 'הטלה ל־Z = 0.10'], i => { gz = i ? 0.10 : 0; draw(); });
  const svg = G.svg(box, 520, 230); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const k = 300, o = [60, 210]; const S = p => [o[0] + p[1] * k, o[1] - p[2] * k]; G.line(svg, S([0, -0.1, 0]), S([0, 1.4, 0]), { stroke: 'var(--ink3)' });
    V.s('rect', { x: S([0, 0.35, 0.1])[0], y: S([0, 0.35, 0.1])[1], width: 0.15 * k, height: 0.1 * k, style: { fill: 'rgba(66,99,235,.15)', stroke: 'var(--c1)' } }, svg); G.txt(svg, G.add(S([0, 0.37, 0.1]), [0, -4]), 'ספר', { fontSize: '11px' });
    G.dot2(svg, S(C), 6, 'var(--ink)'); const P = G.pixelToGround(K, R, C, [640, v], gz); if (P) { G.line(svg, S(C), S(P), { stroke: 'var(--c2)' }); G.dot2(svg, S(P), 6, 'var(--c2)'); }
    if (gz) G.line(svg, S([0, -0.1, 0.1]), S([0, 0.9, 0.1]), { stroke: 'var(--c3)', strokeDasharray: '4 3' });
    out.innerHTML = P ? 'הקרן פוגעת במישור Z = ' + gz + ' במרחק אופקי <b>' + G.f(P[1], 3) + ' מ׳</b>. ' + (gz === 0 ? 'אם לחצת על ראש הספר, ההטלה ל־Z = 0 נותנת מיקום רחוק מדי (פי 0.6/0.5 = 1.2).' : 'הטלה למישור שבו הנקודה באמת נמצאת נותנת את המיקום הנכון.') : 'הקרן לא פוגעת במישור (מעל האופק).'; }
  draw();
};

/* 12.3 drone attitude → footprint */
W.w3_footprint = function (box) {
  V.say(box, 'מבט מלמעלה על השטח שהמצלמה של הרחפן רואה (1920 על 1080, fx = 1400). <b>שנה כיוון, הטיה וגובה</b>. כשהחלק העליון של התמונה מעל האופק, השטח לא נסגר.');
  let yaw = 30, pitch = -60, h = 50;
  const sr = V.row(box); V.slider(sr, 'yaw (מעלות מצפון)', -180, 180, 5, yaw, v => { yaw = v; draw(); }); V.slider(sr, 'pitch', -90, -10, 1, pitch, v => { pitch = v; draw(); }); V.slider(sr, 'גובה (מ׳)', 10, 120, 5, h, v => { h = v; draw(); });
  const svg = G.svg(box, 340, 320); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const R = G.attitude(yaw, pitch), C = [0, 0, h]; const o = [170, 220], k = 1.2; const S = p => [o[0] + p[0] * k, o[1] - p[1] * k];
    for (let i = -140; i <= 140; i += 20) { G.line(svg, S([i, -100]), S([i, 200]), { stroke: 'var(--line2)', strokeWidth: 0.5 }); G.line(svg, S([-140, i]), S([140, i]), { stroke: 'var(--line2)', strokeWidth: 0.5 }); }
    G.txt(svg, [o[0] - 4, 14], 'N', { fontSize: '12px' }); const edge = []; const per = [[0, 0], [1920, 0], [1920, 1080], [0, 1080]]; for (let e = 0; e < 4; e++) for (let t = 0; t <= 1; t += 0.05) { const a = per[e], b = per[(e + 1) % 4]; const uv = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; const P = G.pixelToGround(Kd, R, C, uv, 0); if (P && G.norm(P) < 400) edge.push(S(P)); }
    if (edge.length > 2) G.poly(svg, edge, { fill: 'rgba(66,99,235,.15)', stroke: 'var(--c1)', strokeWidth: 2 }); G.dot2(svg, S([0, 0]), 6, 'var(--ink)');
    const ctr = G.pixelToGround(Kd, R, C, [960, 540], 0); if (ctr) G.dot2(svg, S(ctr), 5, 'var(--c2)');
    const top = G.pixelToGround(Kd, R, C, [960, 0], 0); out.innerHTML = 'מרכז התמונה פוגע ב־' + (ctr ? ltr('(' + G.f(ctr[0], 1) + ', ' + G.f(ctr[1], 1) + ')') + ' מ׳' : '—') + '. ' + (top ? 'הקצה העליון ב־' + G.f(G.norm(top), 0) + ' מטר.' : 'הקצה העליון של התמונה מעל האופק.'); }
  draw();
};

/* 12.4 error budget */
W.w3_budget = function (box) {
  V.say(box, 'רחפן בגובה 50 מטר, מבט 60 מעלות מטה, 271 נקודות קרקע. מחזירים אותן לקרקע עם שגיאה אחת בכל פעם. <b>שנה את גודל כל שגיאה</b> וראה מי שולט.');
  const e = { px: 1, pitch: 1, yaw: 1, h: 1 };
  const sr = V.row(box); V.slider(sr, 'זיהוי (פיקסלים)', 0, 5, 0.5, 1, v => { e.px = v; run(); }); V.slider(sr, 'הטיה (מעלות)', 0, 3, 0.1, 1, v => { e.pitch = v; run(); }); V.slider(sr, 'כיוון (מעלות)', 0, 3, 0.1, 1, v => { e.yaw = v; run(); }); V.slider(sr, 'גובה (מ׳)', 0, 5, 0.5, 1, v => { e.h = v; run(); });
  const svg = G.svg(box, 460, 210); const out = V.say(box);
  const R0 = G.attitude(30, -60), C0 = [0, 0, 50]; const r = G.rng(2); const G0 = []; while (G0.length < 271) { const p = [r() * 160 - 60, r() * 200 - 20, 0]; const q = G.project(Kd, R0, G.mul(G.mv(R0, C0), -1), p); if (q && q[0] > 0 && q[0] < 1920 && q[1] > 0 && q[1] < 1080) G0.push([p, q]); }
  function run() { const srcs = [['זיהוי', (p, q) => G.pixelToGround(Kd, R0, C0, [q[0] + e.px * 0.7071, q[1] + e.px * 0.7071], 0)], ['הטיה', (p, q) => G.pixelToGround(Kd, G.attitude(30, -60 + e.pitch), C0, q, 0)], ['כיוון', (p, q) => G.pixelToGround(Kd, G.attitude(30 + e.yaw, -60), C0, q, 0)], ['גובה', (p, q) => G.pixelToGround(Kd, R0, [0, 0, 50 + e.h], q, 0)]];
    const meds = srcs.map(([n, f]) => [n, G.median(G0.map(([p, q]) => { const P = f(p, q); return P ? G.norm(G.sub(P, p)) : NaN; }))]); svg.innerHTML = ''; const mx = Math.max(0.1, ...meds.map(m => m[1]));
    meds.forEach(([n, m], i) => { const h = m / mx * 150; V.s('rect', { x: 40 + i * 105, y: 180 - h, width: 70, height: h, style: { fill: i === 0 ? 'var(--c3)' : 'var(--c2)' } }, svg); G.txt(svg, [55 + i * 105, 200], n, { fontSize: '12px' }); G.txt(svg, [48 + i * 105, 174 - h], G.f(m, 2) + ' m', { fontSize: '11px' }); });
    const pitchBands = [[0, 30], [30, 60], [60, 1e9]].map(([a, b]) => G.median(G0.filter(([p]) => { const d = Math.hypot(p[0], p[1]); return d >= a && d < b; }).map(([p, q]) => { const P = G.pixelToGround(Kd, G.attitude(30, -60 + e.pitch), C0, q, 0); return P ? G.norm(G.sub(P, p)) : NaN; })));
    out.innerHTML = 'חציון השגיאה במטרים לכל מקור. השגיאה מהטיה לפי מרחק מהרחפן: עד 30 ' + G.f(pitchBands[0], 2) + ', 30 עד 60 ' + G.f(pitchBands[1], 2) + ', מעבר ל־60 ' + G.f(pitchBands[2], 2) + '.'; }
  run();
};

/* 12.5 the desk system, simulated */
W.w3_desk = function (box) {
  V.say(box, 'סימולציה של מערכת השולחן: מצלמה מכוילת, סמן במרכז, רשת של 5 ס״מ. <b>לחץ על שתי נקודות על השולחן</b> וקרא את המרחק. החץ הירוק הוא ציר X של הסמן.');
  const K = G.K(900, 640, 360); const cam = { C: [0.05, -0.45, 0.6] }; const la = G.lookAt(cam.C, [0, 0.05, 0]); let pts = [];
  const svg = G.svg(box, 512, 300); const out = V.say(box);
  click(svg, 512, 300, q => { pts.push([q[0] / 0.4, (q[1] - 10) / 0.4]); if (pts.length > 2) pts = [pts[2]]; draw(); });
  function draw() { svg.innerHTML = ''; const fr = G.frame(svg, 0, 10, 512, 1280, 720); const segs = []; for (let i = -30; i <= 30; i += 5) { segs.push([[i / 100, -0.3, 0], [i / 100, 0.4, 0]]); } for (let j = -30; j <= 40; j += 5) segs.push([[-0.3, j / 100, 0], [0.3, j / 100, 0]]);
    render(svg, fr, K, la.R, la.t, segs, { stroke: 'var(--line2)', strokeWidth: 0.8 }); const mk = [[-0.05, 0.05, 0], [0.05, 0.05, 0], [0.05, -0.05, 0], [-0.05, -0.05, 0]].map(p => fr.map(G.project(K, la.R, la.t, p))); G.poly(svg, mk, { fill: 'var(--ink)' });
    render(svg, fr, K, la.R, la.t, [[[0, 0, 0], [0.1, 0, 0]]], { stroke: 'var(--c3)', strokeWidth: 3 });
    pts.forEach(p => G.dot2(svg, fr.map(p), 5, 'var(--c2)')); if (pts.length === 2) { G.line(svg, fr.map(pts[0]), fr.map(pts[1]), { stroke: 'var(--c2)', strokeWidth: 2 }); const a = G.pixelToGround(K, la.R, cam.C, pts[0], 0), b = G.pixelToGround(K, la.R, cam.C, pts[1], 0);
      out.innerHTML = a && b ? 'מרחק על השולחן: <b>' + G.f(G.norm(G.sub(a, b)) * 100, 1) + ' ס״מ</b>. המרחק מהמצלמה לנקודה הראשונה: ' + G.f(G.norm(G.sub(a, cam.C)) * 100, 0) + ' ס״מ.' : 'אחת הנקודות מעל האופק.'; } else out.innerHTML = 'לחץ על נקודה ' + (pts.length + 1) + '.'; }
  draw();
};

/* 12.6 the one-page report */
W.w3_report = function (box) {
  V.say(box, 'מלא את הדוח של הפרויקט. הוא נשמר בדפדפן, ואפשר להעתיק אותו כ־Markdown.');
  const F = [['calib', 'שגיאת הכיול (פיקסלים)'], ['height', 'גובה המצלמה: מהמערכת מול סרגל'], ['table', 'עשר מדידות: מערכת, סרגל, שגיאה בס״מ ובאחוזים, מרחק מהמצלמה'], ['worst', 'השגיאה הגדולה ביותר, ומה מסביר אותה']];
  const st = window.Store.map('notes'); const key = 'm3-report'; const data = JSON.parse(st[key] || '{}');
  F.forEach(([k, l]) => { box.appendChild(el('div', { style: { fontWeight: 600, margin: '8px 0 4px' } }, l)); const ta = el('textarea', { rows: k === 'table' ? 6 : 2, style: { width: '100%' } }); ta.value = data[k] || ''; ta.oninput = () => { data[k] = ta.value; st[key] = JSON.stringify(data); window.Store.save(); }; box.appendChild(ta); });
  V.btns(box, [['העתק כ־Markdown', () => { const md = '# מפיקסל למיקום במטרים\n\n' + F.map(([k, l]) => '## ' + l + '\n\n' + (data[k] || '')).join('\n\n'); try { navigator.clipboard.writeText(md); } catch (e) { } window.toast && window.toast('הועתק'); }, 'primary']]);
};
})();
