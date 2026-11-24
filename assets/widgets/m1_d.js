/* Module 1 visuals — chapters 10–12: optical flow, video stabilization, the project */
(function () {
const W = window.W, V = window.V, IM = window.IM, el = V.el;
const row = box => { const r = V.row(box); r.style.direction = 'ltr'; r.style.justifyContent = 'center'; r.style.alignItems = 'flex-start'; return r; };
const col = (parent, title) => { const d = el('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' } }); if (title) d.appendChild(el('div', { class: 'note-small', html: title })); parent.appendChild(d); return d; };
const cleanup = (box, fn) => { const o = new MutationObserver(() => { if (!document.body.contains(box)) { fn(); o.disconnect(); } }); o.observe(document.body, { childList: true, subtree: true }); };
const sceneGray = (seed, w = 96, h = 72) => IM.blur(IM.toGray(IM.scene(w, h, seed, 22)), 3);
const arrow = (ctx, x, y, u, v, s, col) => { const X = x + u * s, Y = y + v * s; ctx.strokeStyle = col; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(X, Y); ctx.stroke(); const a = Math.atan2(Y - y, X - x); ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X - 1.6 * Math.cos(a - 0.5), Y - 1.6 * Math.sin(a - 0.5)); ctx.lineTo(X - 1.6 * Math.cos(a + 0.5), Y - 1.6 * Math.sin(a + 0.5)); ctx.fill(); };

/* 10.1 brightness constancy, in one dimension */
W.w1_brightness_const = function (box) {
  V.say(box, 'אות חד־ממדי (שורה של בהירויות) שזז ימינה ב־u פיקסלים. בנקודה המסומנת: <b>I<sub>x</sub>·u + I<sub>t</sub> ≈ 0</b>, ולכן u ≈ −I<sub>t</sub>/I<sub>x</sub>. הגדל את u וראה מתי הקירוב נשבר.');
  const f = x => 120 + 80 * Math.sin(x / 9) + 30 * Math.sin(x / 3.7); let u = 1.5, x0 = 30;
  const sr = V.row(box); V.slider(sr, 'התזוזה האמיתית u', 0, 12, 0.5, u, v => { u = v; draw(); }); V.slider(sr, 'הנקודה x', 5, 60, 1, x0, v => { x0 = v; draw(); });
  const P = IM.plot(box, { w: 460, h: 180 }); V.legend(box, [['var(--c1)', 'פריים 1'], ['var(--c2)', 'פריים 2']]); const out = V.say(box);
  function draw() { const g1 = x => f(x), g2 = x => f(x - u); const Ix = (g1(x0 + 1) - g1(x0 - 1)) / 2, It = g2(x0) - g1(x0); const est = -It / Ix;
    P.draw([{ pts: [...Array(70)].map((_, x) => [x, g1(x)]), color: 'var(--c1)' }, { pts: [...Array(70)].map((_, x) => [x, g2(x)]), color: 'var(--c2)' }, { vline: x0, color: 'var(--ink3)', dash: '3 3' }], [0, 69], [0, 255]);
    out.innerHTML = 'I<sub>x</sub> = ' + V.fmt(Ix, 1) + ', I<sub>t</sub> = ' + V.fmt(It, 1) + ' → u ≈ <b>' + V.fmt(est, 2) + '</b> (האמת: ' + u + '). ' + (Math.abs(est - u) > 1 ? '<span class="bad">הקירוב נשבר:</span> הנגזרת מתארת את האות רק בסביבה קטנה.' : 'קרוב מאוד.'); }
  draw();
};

/* 10.2 the aperture problem */
W.w1_aperture = function (box) {
  V.say(box, 'דרך חלון קטן רואים קטע מתמונה שזזה. החץ הירוק הוא התנועה האמיתית, החץ הכתום הוא מה שאפשר <b>למדוד</b> מתוך החלון. בחר מה רואים בחלון וסובב את כיוון התנועה.');
  let kind = 1, ang = 30, t = 0, timer = null;
  V.tabs(box, ['משטח אחיד', 'קצה ישר', 'פינה'], i => { kind = i; draw(); }, 1);
  V.slider(box, 'כיוון התנועה', 0, 355, 5, ang, v => { ang = v; draw(); });
  const svg = V.s('svg', { viewBox: '-80 -80 160 160', width: 260 }); const rr = row(box); rr.appendChild(svg); const out = V.say(box);
  timer = setInterval(() => { t = (t + 1) % 40; draw(); }, 60); cleanup(box, () => clearInterval(timer));
  function draw() { svg.innerHTML = ''; const a = ang * Math.PI / 180, dx = Math.cos(a) * (t - 20) * 0.8, dy = -Math.sin(a) * (t - 20) * 0.8;
    V.s('clipPath', { id: 'ap' + box.dataset.w }, svg).appendChild(V.s('circle', { r: 50 }));
    const g = V.s('g', { 'clip-path': 'url(#ap' + box.dataset.w + ')' }, svg); V.s('rect', { x: -80, y: -80, width: 160, height: 160, style: { fill: 'var(--surface2)' } }, g);
    if (kind === 1) V.s('polygon', { points: `${-200 + dx},${-200 + dy} ${200 + dx},${200 + dy} ${200 + dx},${-200 + dy}`, style: { fill: 'var(--c4)' } }, g);
    if (kind === 2) V.s('rect', { x: -10 + dx, y: -10 + dy, width: 200, height: 200, style: { fill: 'var(--c4)' } }, g);
    V.s('circle', { r: 50, style: { fill: 'none', stroke: 'var(--ink)', strokeWidth: 3 } }, svg);
    const mv = [Math.cos(a) * 40, -Math.sin(a) * 40]; V.s('line', { x1: 0, y1: 0, x2: mv[0], y2: mv[1], style: { stroke: 'var(--c3)', strokeWidth: 3 } }, svg);
    let meas = null; if (kind === 1) { const n = [Math.SQRT1_2, -Math.SQRT1_2]; const p = mv[0] * n[0] + mv[1] * n[1]; meas = [n[0] * p, n[1] * p]; } if (kind === 2) meas = mv;
    if (meas) V.s('line', { x1: 0, y1: 0, x2: meas[0], y2: meas[1], style: { stroke: 'var(--c2)', strokeWidth: 3, strokeDasharray: kind === 2 ? '' : '5 3' } }, svg);
    out.innerHTML = ['משטח אחיד: שום דבר לא משתנה בחלון, ואין שום מידע על התנועה.', 'קצה: אפשר למדוד רק את הרכיב <b>הניצב לקצה</b>. תנועה לאורך הקצה בלתי נראית. זו בעיית הצמצם.', 'פינה: שינוי בשני כיוונים, ולכן התנועה המלאה נמדדת.'][kind]; }
  draw();
};

/* 10.3 Lucas–Kanade on corners */
W.w1_lk_points = function (box) {
  V.say(box, 'הזזת הסצנה ב־(dx, dy) ומעקב לוקס־קנדה על הפינות שנמצאו. כל חץ הוא תנועה של נקודה (מוגדל פי 3). שנה את ההזזה ואת גודל החלון.');
  const g = sceneGray(1); let dx = 2, dy = -1.5, r = 4;
  const sr = V.row(box); V.slider(sr, 'dx', -4, 4, 0.5, dx, v => { dx = v; draw(); }); V.slider(sr, 'dy', -4, 4, 0.5, dy, v => { dy = v; draw(); }); V.slider(sr, 'רדיוס החלון', 1, 6, 1, r, v => { r = v; draw(); });
  const rr = row(box); const cv = IM.canvas(rr, 96, 72, 4); const out = V.say(box); const cs = IM.corners(g, 30, 7, 0.06);
  function draw() { const g2 = IM.shift(g, dx, dy); const ctx = IM.show(cv, g); ctx.lineWidth = 0.5; const us = [], vs = [];
    cs.forEach(([x, y]) => { if (x < 6 || y < 6 || x > 89 || y > 65) return; let u = 0, v = 0; for (let it = 0; it < 4; it++) { const gw = IM.shift(g2, -u, -v); const s = IM.lk(g, gw, x, y, r); if (!s) break; u += s[0]; v += s[1]; } us.push(u); vs.push(v); arrow(ctx, x + 0.5, y + 0.5, u, v, 3, Math.hypot(u - dx, v - dy) < 0.5 ? '#40c057' : '#fa5252'); });
    const med = a => a.slice().sort((p, q) => p - q)[a.length >> 1];
    out.innerHTML = '<b>' + us.length + '</b> נקודות. התנועה החציונית: <b class="ltr" style="display:inline-block">(' + V.fmt(med(us), 2) + ', ' + V.fmt(med(vs), 2) + ')</b>. ירוק = קרוב לאמת, אדום = שגוי. החציון עמיד לאדומים.'; }
  draw();
};

/* 10.4 the pyramid */
W.w1_pyramid = function (box) {
  V.say(box, 'תזוזה גדולה של 12 פיקסלים. בכל רמה של הפירמידה התמונה קטנה פי 2, ולכן גם התזוזה. <b>עבור על השלבים</b>: מתחילים ברמה הגסה, ומעבירים את הניחוש לרמה הבאה (כפול 2) כדי לעדן.');
  const g0 = sceneGray(2); const T = 12; const lv = [g0, IM.down(g0), IM.down(IM.down(g0))]; const lv2 = lv.map((g, k) => IM.shift(g, T / 2 ** k, 0));
  const rr = row(box); const cs = lv.map((g, k) => IM.canvas(col(rr, 'רמה ' + k + ' (' + g.w + '×' + g.h + ')'), g.w, g.h, 4 / 2 ** k * 1.2)); const out = V.say(box);
  const cs0 = IM.corners(lv[2], 6, 4, 0.1);
  V.stepper(box, 4, s => { let est = 0; const log = [];
    for (let k = 2; k >= 0 && 2 - k < s; k--) { const g = lv[k], g2 = lv2[k]; let u = est; const pts = k === 2 ? cs0 : cs0.map(([x, y]) => [x * 2 ** (2 - k), y * 2 ** (2 - k)]);
      const ds = []; pts.forEach(([x, y]) => { let uu = u; for (let it = 0; it < 3; it++) { const sft = IM.lk(g, IM.shift(g2, -uu, 0), Math.round(x), Math.round(y), 3); if (!sft) break; uu += sft[0]; } ds.push(uu); });
      est = ds.sort((a, b) => a - b)[ds.length >> 1]; log.push('ברמה ' + k + ': תזוזה שנמדדה <b>' + V.fmt(est, 2) + '</b> (האמת ברמה הזו: ' + T / 2 ** k + ')'); if (k > 0) est *= 2; }
    lv.forEach((g, k) => { const ctx = IM.show(cs[k], g); cs[k].style.outline = (s && 2 - k === s - 1) ? '3px solid var(--accent)' : ''; });
    out.innerHTML = s === 0 ? 'בלי פירמידה, 12 פיקסלים גדולים מדי לחלון של לוקס־קנדה. ברמה 2 התזוזה היא רק 3.' : log.join('<br>');
  }, { speed: 1600 });
};

/* 10.5 dense flow, colored */
W.w1_dense_flow = function (box) {
  V.say(box, 'זרימה צפופה: תנועה לכל פיקסל, צבועה לפי הכיוון (גוון) והגודל (בהירות). כל התמונה זזה ימינה ולמעלה. שים לב לאזורים השחורים: <b>בתוך צורות אחידות אי אפשר למדוד תנועה</b>.');
  const g = sceneGray(1); let dx = 2, dy = -1;
  const sr = V.row(box); V.slider(sr, 'dx', -3, 3, 0.5, dx, v => { dx = v; draw(); }); V.slider(sr, 'dy', -3, 3, 0.5, dy, v => { dy = v; draw(); });
  const rr = row(box); const c0 = IM.canvas(col(rr, 'פריים 1'), 96, 72, 3); const c1 = IM.canvas(col(rr, 'הזרימה'), 48, 36, 6); IM.show(c0, g); const out = V.say(box);
  function draw() { const g2 = IM.shift(g, dx, dy); const im = IM.color(48, 36); let moving = 0;
    for (let y = 0; y < 36; y++) for (let x = 0; x < 48; x++) { const s = IM.lk(g, g2, 2 * x, 2 * y, 3); let u = 0, v = 0; if (s && s[3] > 2000 && s[2] > 0.08) { u = s[0]; v = s[1]; } const m = Math.hypot(u, v); if (m > 1) moving++; const hue = Math.round(((Math.atan2(v, u) * 180 / Math.PI + 360) % 360) / 2); IM.set(im, x, y, IM.hsv2bgr(hue, 255, Math.min(255, m * 80))); }
    IM.show(c1, im); out.innerHTML = 'רק <b>' + Math.round(moving / (48 * 36) * 100) + '%</b> מהפיקסלים קיבלו תנועה של יותר מפיקסל, למרות שכל התמונה זזה. זו בעיית הצמצם בגדול.'; }
  draw();
};

/* ===== chapter 11 ===== */
const shakyPath = (seed, n = 120, turn = 0) => { const r = IM.rng(seed); let p = [0, 0, 0]; const tr = []; for (let i = 0; i < n; i++) { const jit = [IM.randn(r) * 6 + turn * i * 0.15, IM.randn(r) * 6, IM.randn(r) * 0.02]; tr.push(jit); } return tr; };
const smooth = (P, rad) => P.map((_, i) => { const s = [0, 0, 0]; for (let k = -rad; k <= rad; k++) { const j = Math.min(P.length - 1, Math.max(0, i + k)); for (let c = 0; c < 3; c++) s[c] += P[j][c]; } return s.map(v => v / (2 * rad + 1)); });

W.w1_smooth_path = function (box) {
  V.say(box, 'המיקום של המצלמה לאורך הזמן (ציר x): פנייה איטית ומכוונת, ועליה רעידות. <b>שנה את רדיוס ההחלקה</b>. הקו הירוק הוא המסלול המוחלק, והמרחק האנכי בינו לבין הגולמי הוא התיקון לכל פריים.');
  const r = IM.rng(4); const raw = [...Array(120)].map((_, i) => [i * 0.6 + IM.randn(r) * 5, 0, 0]); let rad = 15;
  V.slider(box, 'רדיוס (פריימים)', 0, 40, 1, rad, v => { rad = v; draw(); });
  const P = IM.plot(box, { w: 480, h: 200 }); V.legend(box, [['var(--ink3)', 'מסלול גולמי'], ['var(--c3)', 'מוחלק'], ['var(--c2)', 'התיקון']]); const out = V.say(box);
  function draw() { const sm = smooth(raw, rad); const cor = sm.map((s, i) => s[0] - raw[i][0]);
    P.draw([{ pts: raw.map((p, i) => [i, p[0]]), color: 'var(--ink3)', width: 1.5 }, { pts: sm.map((p, i) => [i, p[0]]), color: 'var(--c3)', width: 3 }, { pts: cor.map((c, i) => [i, c - 25]), color: 'var(--c2)', width: 1.2 }], [0, 119], [-50, 90]);
    out.innerHTML = 'התיקון המקסימלי: <b>' + V.fmt(Math.max(...cor.map(Math.abs)), 1) + '</b> פיקסלים. ' + (rad > 30 ? 'רדיוס גדול מאוד מתחיל "לחתוך" גם את הפנייה, והתיקון גדל.' : rad < 3 ? 'רדיוס קטן כמעט לא מחליק.' : ''); }
  draw();
};

W.w1_shaky = function (box) {
  V.say(box, 'כך נוצר הסרטון הרועד: "עולם" גדול, ומצלמה שרואה חלון ממנו. החלון זז באקראי בכל פריים, והכדור הכתום נע 4 פיקסלים בכל פריים בעולם.');
  const world = IM.scene(160, 120, 3, 40); let i = 0, timer = null; const path = shakyPath(7);
  const rr = row(box); const cw = IM.canvas(col(rr, 'העולם והחלון'), 160, 120, 2.2); const cf = IM.canvas(col(rr, 'מה שהמצלמה רואה'), 128, 96, 2.2);
  V.btns(box, [['▶ נגן / עצור', () => { if (timer) { clearInterval(timer); timer = null; } else timer = setInterval(() => { i = (i + 1) % 120; draw(); }, 80); }, 'primary']]); cleanup(box, () => clearInterval(timer)); const out = V.say(box);
  function draw() { const w = IM.copy(world); IM.fillCircle(w, 20 + i * 1.0, 60, 4, [0, 165, 255]); const [jx, jy] = path[i]; const ox = 16 + jx * 0.5, oy = 12 + jy * 0.5;
    const ctx = IM.show(cw, w); ctx.strokeStyle = '#ff0'; ctx.lineWidth = 0.8; ctx.strokeRect(ox, oy, 128, 96);
    const f = IM.color(128, 96); for (let y = 0; y < 96; y++) for (let x = 0; x < 128; x++) IM.set(f, x, y, IM.sample(w, x + ox, y + oy, 'nearest')); IM.show(cf, f);
    out.innerHTML = 'פריים ' + i + ' · הזזת המצלמה <span class="ltr" style="display:inline-block">(' + V.fmt(jx * 0.5, 1) + ', ' + V.fmt(jy * 0.5, 1) + ')</span>. מימין, הכדור "קופץ" יחד עם כל הרקע.'; }
  draw();
};

W.w1_frame_motion = function (box) {
  V.say(box, 'שלב 1: תנועת המצלמה בין שני פריימים. פינות, לוקס־קנדה, ורנסק. הכדור זז בעצמו, ולכן הנקודות עליו לא מסכימות עם תנועת הרקע ורנסק זורק אותן (באדום).');
  const world = IM.blur(IM.toGray(IM.scene(110, 80, 9, 30)), 3); let dx = 2, dy = 1;
  const sr = V.row(box); V.slider(sr, 'רעידה dx', -3, 3, 0.5, dx, v => { dx = v; draw(); }); V.slider(sr, 'רעידה dy', -3, 3, 0.5, dy, v => { dy = v; draw(); });
  const rr = row(box); const cv = IM.canvas(rr, 110, 80, 3.6); const out = V.say(box);
  function draw() {
    const f1 = IM.copy(world); IM.fillCircle(f1, 50, 40, 7, 250); IM.fillCircle(f1, 50, 40, 3, 30);
    const f2 = IM.shift(world, dx, dy); IM.fillCircle(f2, 54 + dx, 40 + dy, 7, 250); IM.fillCircle(f2, 54 + dx, 40 + dy, 3, 30);
    const cs = IM.corners(f1, 40, 6, 0.05).filter(([x, y]) => x > 5 && y > 5 && x < 104 && y < 74); const fl = cs.map(([x, y]) => { let u = 0, v = 0; for (let it = 0; it < 4; it++) { const s = IM.lk(f1, IM.shift(f2, -u, -v), x, y, 3); if (!s) break; u += s[0]; v += s[1]; } return [x, y, u, v]; });
    let best = null, bn = -1; fl.forEach(c => { const n = fl.filter(d => Math.hypot(d[2] - c[2], d[3] - c[3]) < 0.6).length; if (n > bn) { bn = n; best = c; } });
    const inl = fl.filter(d => Math.hypot(d[2] - best[2], d[3] - best[3]) < 0.6); const mu = inl.reduce((s, d) => s + d[2], 0) / inl.length, mv = inl.reduce((s, d) => s + d[3], 0) / inl.length;
    const ctx = IM.show(cv, f1); ctx.lineWidth = 0.5; fl.forEach(d => arrow(ctx, d[0] + 0.5, d[1] + 0.5, d[2], d[3], 3, inl.includes(d) ? '#40c057' : '#fa5252'));
    out.innerHTML = 'מסכימות: <b>' + inl.length + '</b> מתוך ' + fl.length + '. תנועת המצלמה שנמדדה: <b class="ltr" style="display:inline-block">(' + V.fmt(mu, 2) + ', ' + V.fmt(mv, 2) + ')</b>, האמת: (' + dx + ', ' + dy + ').'; }
  draw();
};

W.w1_stab_steps = function (box) {
  V.say(box, 'שלבים 2 עד 5 על ציר x בלבד, שלב אחר שלב: מהתנועות בין פריימים, למסלול, למסלול המוחלק, לתיקון, ולפריימים המוזזים.');
  const r = IM.rng(6); const mot = [0].concat([...Array(59)].map(() => 0.5 + IM.randn(r) * 3)); const traj = []; mot.reduce((s, m, i) => (traj[i] = s + m), 0); const sm = smooth(traj.map(v => [v, 0, 0]), 8).map(v => v[0]); const cor = sm.map((s, i) => s - traj[i]);
  const P = IM.plot(box, { w: 480, h: 200 }); const out = V.say(box);
  const S = ['1. התנועה בין כל שני פריימים (dx). קופצת סביב 0.5.', '2. סכום מצטבר: <code class="inline-code">np.cumsum</code>. זה המיקום של המצלמה.', '3. ממוצע נע על המסלול (רדיוס 8): מה שהמצלמה <b>הייתה אמורה</b> לעשות.', '4. התיקון = מוחלק פחות גולמי. כמה להזיז כל פריים.', '5. מזיזים כל פריים בתיקון שלו (warpAffine): המסלול החדש הוא בדיוק המוחלק.'];
  V.stepper(box, 5, s => { const ser = [];
    if (s === 0) ser.push({ bars: true, pts: mot.map((m, i) => [i, m]), color: 'var(--c1)', bw: 5 });
    if (s >= 1) ser.push({ pts: traj.map((v, i) => [i, v]), color: 'var(--ink3)', width: 1.5 });
    if (s >= 2) ser.push({ pts: sm.map((v, i) => [i, v]), color: 'var(--c3)', width: 3 });
    if (s === 3) ser.push({ bars: true, pts: cor.map((c, i) => [i, c]), color: 'var(--c2)', bw: 5 });
    if (s === 4) ser.push({ pts: traj.map((v, i) => [i, v + cor[i]]), color: 'var(--c2)', width: 2, dash: '4 3', dots: true });
    const lo = Math.min(-8, ...traj, ...cor), hi = Math.max(8, ...traj); P.draw(ser, [0, 59], [lo, hi]); out.innerHTML = S[s]; }, { speed: 1600 });
};

W.w1_jitter_metric = function (box) {
  V.say(box, 'המדד של הסעיף: סטיית התקן של התנועה בין פריימים, לפני ואחרי. ובצד המחיר: כמה גדול התיקון המקסימלי, ואם ההגדלה של 1.1 עדיין מסתירה את השוליים השחורים (כ־24 פיקסלים).');
  const r = IM.rng(8); const raw = [...Array(120)].map(() => IM.randn(r) * 10); const traj = []; raw.reduce((s, m, i) => (traj[i] = s + m), 0); let rad = 15;
  V.slider(box, 'רדיוס', 1, 40, 1, rad, v => { rad = v; draw(); });
  const P = IM.plot(box, { w: 420, h: 150 }); const out = V.say(box);
  const std = a => { const m = a.reduce((x, y) => x + y) / a.length; return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length); };
  function draw() { const sm = smooth(traj.map(v => [v, 0, 0]), rad).map(v => v[0]); const dm = sm.slice(1).map((v, i) => v - sm[i]); const cor = sm.map((s, i) => s - traj[i]); const mc = Math.max(...cor.map(Math.abs)) * 0.25;
    P.draw([{ bars: true, pts: [[0, std(raw)], [1, std(dm)], [2, mc]], color: 'var(--c1)', bw: 60 }, { vline: 2.4, color: 'transparent' }], [-0.6, 2.6], [0, Math.max(12, mc + 2)]);
    out.innerHTML = 'רעידה לפני: <b>' + V.fmt(std(raw), 1) + '</b> · אחרי: <b>' + V.fmt(std(dm), 2) + '</b> · התיקון המקסימלי (בקנה מידה של הסרטון): <b>' + V.fmt(mc, 1) + '</b> פיקסלים ' + (mc > 24 ? '<span class="bad">— גדול מהשוליים שההגדלה מסתירה, ויופיעו פסים שחורים.</span>' : '— ההגדלה מסתירה אותו.'); }
  draw();
};

/* ===== chapter 12 ===== */
W.w1_project_flow = function (box) {
  V.say(box, 'מבנה הפרויקט: קלט אחד, שני מסלולים, פלט אחד. <b>לחץ על כל שלב</b> כדי לראות מאיזה פרק הוא בא.');
  const nodes = [['shaky.mp4', 'סעיף 11.2', 65, 105], ['ייצוב', 'פרק 11', 205, 45], ['עוקב צבע (מיוצב)', 'פרק 7', 345, 45], ['עוקב צבע (מקור)', 'פרק 7', 345, 165], ['סרטון כפול + שובל', 'סעיף 1.4', 485, 75], ['מדד jerk', 'סעיף 12.2', 485, 165]];
  const edges = [[0, 1], [1, 2], [0, 3], [2, 4], [3, 4], [2, 5], [3, 5]];
  const svg = V.s('svg', { viewBox: '0 0 560 210', width: 560, style: { maxWidth: '100%', direction: 'ltr' } }); const rr = row(box); rr.appendChild(svg); const out = V.say(box, 'בחר שלב.');
  V.s('defs', {}, svg).innerHTML = '<marker id="pfa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--ink3)"/></marker>';
  edges.forEach(([a, b]) => V.s('line', { x1: nodes[a][2] + 60, y1: nodes[a][3], x2: nodes[b][2] - 62, y2: nodes[b][3], 'marker-end': 'url(#pfa)', style: { stroke: 'var(--ink3)', strokeWidth: 1.5 } }, svg));
  nodes.forEach(([t, src, x, y], k) => { const g = V.s('g', { style: { cursor: 'pointer' } }, svg); V.s('rect', { x: x - 60, y: y - 18, width: 120, height: 36, rx: 8, style: { fill: k === 1 ? 'var(--accent-bg)' : 'var(--surface)', stroke: 'var(--c1)' } }, g); V.s('text', { x, y: y + 5, 'text-anchor': 'middle', 'font-size': 12, style: { fill: 'var(--ink)' }, text: t }, g);
    g.addEventListener('click', () => { out.innerHTML = '<b>' + t + '</b> — מגיע מ' + src + '. ' + ['סרטון שבו התשובה ידועה: הכדור נע 4 פיקסלים בפריים.', 'פינות, לוקס־קנדה, רנסק, החלקה והזזה.', 'על הסרטון המיוצב: צבע, ניקוי מורפולוגי, מתאר ומרכז.', 'על המקור, להשוואה.', 'שני הצדדים זה לצד זה, עם המסלול עד הפריים הנוכחי.', 'התאוצה הממוצעת של המסלול: קטן = חלק.'][k]; }); });
};

W.w1_jerk = function (box) {
  V.say(box, 'מהירות היא הפרש בין מיקומים עוקבים, ותאוצה היא הפרש בין מהירויות. במסלול חלק התאוצה כמעט אפס. <b>הגבר את הרעידה</b> וראה את המדד עולה.');
  let amp = 4;
  V.slider(box, 'עוצמת הרעידה', 0, 10, 0.5, amp, v => { amp = v; draw(); });
  const svg = V.s('svg', { viewBox: '0 0 440 140', width: 440, style: { maxWidth: '100%', direction: 'ltr' } }); const rr = row(box); rr.appendChild(svg); const out = V.say(box);
  function draw() { const r = IM.rng(5); const p = [...Array(20)].map((_, i) => [20 + i * 21 + IM.randn(r) * amp, 70 + IM.randn(r) * amp]); svg.innerHTML = '';
    V.s('path', { d: 'M' + p.map(q => q.join(',')).join(' L'), style: { fill: 'none', stroke: 'var(--c1)', strokeWidth: 2 } }, svg); p.forEach(q => V.s('circle', { cx: q[0], cy: q[1], r: 3, style: { fill: 'var(--c1)' } }, svg));
    const v = p.slice(1).map((q, i) => [q[0] - p[i][0], q[1] - p[i][1]]); const a = v.slice(1).map((q, i) => [q[0] - v[i][0], q[1] - v[i][1]]);
    a.forEach((q, i) => V.s('line', { x1: p[i + 1][0], y1: p[i + 1][1], x2: p[i + 1][0] + q[0] * 3, y2: p[i + 1][1] + q[1] * 3, style: { stroke: 'var(--c2)', strokeWidth: 2 } }, svg));
    const jerk = a.reduce((s, q) => s + Math.hypot(q[0], q[1]), 0) / a.length;
    out.innerHTML = 'jerk = הגודל הממוצע של התאוצה = <b>' + V.fmt(jerk, 2) + '</b> פיקסלים לפריים בריבוע (החצים הכתומים, מוגדלים פי 3). ' + (amp === 0 ? 'תנועה במהירות קבועה: אפס בדיוק.' : ''); }
  draw();
};

W.w1_project_run = function (box) {
  V.say(box, 'הפרויקט בפעולה, בהדמיה: משמאל הסרטון המקורי, מימין המיוצב, ועל שניהם המסלול של הכדור. המספרים מתעדכנים בזמן הנגינה.');
  const world = IM.scene(150, 110, 3, 36); const r = IM.rng(7); const jit = [...Array(120)].map(() => [IM.randn(r) * 4, IM.randn(r) * 4]); const traj = []; jit.reduce((s, j, i) => (traj[i] = [s[0] + j[0], s[1] + j[1]]), [0, 0]);
  const tx = traj.map(t => t[0]), ty = traj.map(t => t[1]); const sm = (a, R) => a.map((_, i) => { let s = 0; for (let k = -R; k <= R; k++) s += a[Math.min(a.length - 1, Math.max(0, i + k))]; return s / (2 * R + 1); });
  const sx = sm(tx, 15), sy = sm(ty, 15); let i = 0, timer = null; const rawP = [], stP = [];
  const rr = row(box); const c1 = IM.canvas(col(rr, 'raw'), 100, 75, 2.6); const c2 = IM.canvas(col(rr, 'stabilized'), 100, 75, 2.6); const out = V.say(box);
  V.btns(box, [['▶ נגן / עצור', () => { if (timer) { clearInterval(timer); timer = null; } else timer = setInterval(() => { i++; if (i >= 120) { i = 0; rawP.length = 0; stP.length = 0; } draw(); }, 70); }, 'primary']]); cleanup(box, () => clearInterval(timer));
  const frame = (ox, oy) => { const f = IM.color(100, 75); const w = IM.copy(world); IM.fillCircle(w, 25 + i * 0.8, 55, 3.5, [0, 165, 255]); for (let y = 0; y < 75; y++) for (let x = 0; x < 100; x++) IM.set(f, x, y, IM.sample(w, x + ox, y + oy, 'nearest')); return f; };
  const jerk = P => { const q = P.filter(Boolean); if (q.length < 3) return 0; let s = 0; for (let k = 2; k < q.length; k++) s += Math.hypot(q[k][0] - 2 * q[k - 1][0] + q[k - 2][0], q[k][1] - 2 * q[k - 1][1] + q[k - 2][1]); return s / (q.length - 2); };
  function draw() { const ox = 25 + traj[i][0] * 0.4, oy = 18 + traj[i][1] * 0.4, sox = 25 + sx[i] * 0.4, soy = 18 + sy[i] * 0.4;
    const bx = 25 + i * 0.8, by = 55; rawP.push([bx - ox, by - oy]); stP.push([bx - sox, by - soy]);
    [[c1, frame(ox, oy), rawP], [c2, frame(sox, soy), stP]].forEach(([cv, f, P]) => { const ctx = IM.show(cv, f); ctx.strokeStyle = '#40c057'; ctx.lineWidth = 0.7; ctx.beginPath(); P.slice(-40).forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); });
    out.innerHTML = 'פריים ' + i + ' · jerk מקורי <b>' + V.fmt(jerk(rawP), 2) + '</b> · jerk מיוצב <b>' + V.fmt(jerk(stP), 2) + '</b>'; }
  draw();
};

W.w1_bug = function (box) {
  V.say(box, 'הבאג של הסעיף, מחדש. בסצנה כדור כתום קטן ומלבן כתום־צהבהב גדול. העוקב בוחר את <b>המתאר הגדול ביותר</b>. עם הטווח הרחב (10 עד 35) הוא ננעל על המלבן, והמהירות הממוצעת יוצאת אפס. <b>צמצם את הטווח</b> סביב הגוון של הכדור (24) עד שהמהירות נכונה.');
  let lo = 10, hi = 35;
  const sr = V.row(box); V.slider(sr, 'H low', 0, 40, 1, lo, v => { lo = v; draw(); }); V.slider(sr, 'H high', 0, 40, 1, hi, v => { hi = v; draw(); });
  const rr = row(box); const cv = IM.canvas(rr, 120, 80, 3.4); const out = V.say(box);
  function draw() { const xs = []; let last = null; for (let f = 0; f < 20; f++) { const im = IM.color(120, 80, [70, 70, 70]); IM.fillRect(im, 70, 10, 110, 40, IM.hsv2bgr(30, 220, 230)); IM.fillCircle(im, 10 + f * 4.4, 60, 4, IM.hsv2bgr(24, 255, 255)); const m = IM.inRange(im, [lo, 120, 70], [hi, 255, 255], 'hsv'); const { comps } = IM.components(m); const c = comps.length ? comps.reduce((a, b) => a.area > b.area ? a : b) : null; xs.push(c ? c.cx : null); if (f === 19) last = { im, c }; }
    const ctx = IM.show(cv, last.im); if (last.c) { ctx.strokeStyle = '#ff0'; ctx.lineWidth = 0.8; ctx.strokeRect(last.c.x0 - 1, last.c.y0 - 1, last.c.x1 - last.c.x0 + 2, last.c.y1 - last.c.y0 + 2); }
    const v = xs.slice(1).map((x, i) => x !== null && xs[i] !== null ? x - xs[i] : null).filter(x => x !== null); const mv = v.length ? v.reduce((a, b) => a + b) / v.length : 0;
    out.innerHTML = 'מהירות ממוצעת שנמדדה: <b>' + V.fmt(mv, 2) + '</b> פיקסלים לפריים (האמת: 4.4). ' + (Math.abs(mv - 4.4) < 0.3 ? '<b class="good">תוקן ✓</b> עכשיו העוקב על הכדור.' : Math.abs(mv) < 0.3 ? 'אפס: העוקב ננעל על המלבן העומד.' : xs.includes(null) ? 'בחלק מהפריימים לא נמצא כלום.' : ''); }
  draw();
};

W.w1_occlusion = function (box) {
  V.say(box, 'הרחבה 3: מלבן מסתיר את הכדור לכמה פריימים. במקום None, <b>מנבאים</b> את המיקום מהמהירות האחרונה שנמדדה. הדלק את הניבוי והשווה.');
  let pred = false, i = 0, timer = null;
  V.tabs(box, ['בלי ניבוי (None)', 'ניבוי מהמהירות האחרונה'], k => { pred = k === 1; i = 0; draw(); });
  const rr = row(box); const cv = IM.canvas(rr, 120, 60, 3.4); const out = V.say(box);
  V.btns(box, [['▶ נגן / עצור', () => { if (timer) { clearInterval(timer); timer = null; } else timer = setInterval(() => { i = (i + 1) % 26; draw(); }, 150); }, 'primary']]); cleanup(box, () => clearInterval(timer));
  function draw() { const im = IM.color(120, 60, [40, 40, 40]); const path = []; let lastV = null, lastP = null;
    for (let f = 0; f <= i; f++) { const x = 8 + f * 4.2; const hidden = x > 55 && x < 85; let p = hidden ? null : [x, 30];
      if (!p && pred && lastP && lastV) p = [lastP[0] + lastV[0], lastP[1] + lastV[1]];
      if (p && lastP) lastV = hidden ? lastV : [p[0] - lastP[0], p[1] - lastP[1]]; if (p) lastP = p; path.push({ p, hidden }); }
    IM.fillCircle(im, 8 + i * 4.2, 30, 4, [0, 165, 255]); IM.fillRect(im, 55, 15, 85, 45, [160, 160, 160]);
    const ctx = IM.show(cv, im); path.forEach(({ p, hidden }) => { if (!p) return; ctx.fillStyle = hidden ? '#ff0' : '#40c057'; ctx.beginPath(); ctx.arc(p[0], p[1], 1.3, 0, 7); ctx.fill(); });
    const miss = path.filter(q => !q.p).length; out.innerHTML = 'פריימים בלי מיקום: <b>' + miss + '</b>. ' + (pred ? 'הנקודות הצהובות הן ניבוי: המסלול רציף. זה הצעד הראשון לעבר מסנן קלמן.' : 'כשהכדור מוסתר, המסלול נקטע.'); }
  draw();
};

W.w1_portfolio = function (box) {
  V.say(box, 'כתוב כאן את ארבע התשובות של דף הפרויקט שלך, בסדר של הסעיף. זה נשמר בדפדפן, ואפשר להעתיק משם לקובץ README.');
  const K = 'm1-portfolio'; const st = window.Store.map('notes'); const data = JSON.parse(st[K] || '{}');
  ['מה הבעיה', 'מה עשית', 'איך מדדת', 'איפה זה נכשל'].forEach(q => { const l = el('label', { style: { display: 'block', margin: '8px 0' } }); l.appendChild(el('b', {}, q)); const ta = el('textarea', { style: { width: '100%', minHeight: '54px', display: 'block', marginTop: '4px' } }); ta.value = data[q] || ''; ta.oninput = () => { data[q] = ta.value; st[K] = JSON.stringify(data); window.Store.save(); }; l.appendChild(ta); box.appendChild(l); });
  V.btns(box, [['העתק כ־Markdown', () => { const t = Object.entries(data).map(([k, v]) => '## ' + k + '\n' + v).join('\n\n'); navigator.clipboard && navigator.clipboard.writeText(t); window.App.toast('הועתק'); }]]);
};
})();
