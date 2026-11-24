/* Module 3 — demo for section 12.7 (an addition): scale from the scene itself. The same synthetic drone scene as the
   section's code (same parameters, different noise) (f 1100, tilt 40°, height 80 m, lanes 3.6 m, ten cars, one car at 72 km/h). The learner searches f by the
   cars' shape, sets the priors for lane and car width, and sees both cues, their disagreement and the measured speed. */
(function () {
const W = window.W, V = window.V, el = V.el;
const F = (x, d) => (Math.round(x * 10 ** d) / 10 ** d).toFixed(d);
const IW = 1280, IH = 720, SC = 0.5;
function camera(f, pd, yd) { const p = pd * Math.PI / 180, y = yd * Math.PI / 180; const fwd = [Math.sin(y) * Math.cos(p), Math.cos(y) * Math.cos(p), -Math.sin(p)], right = [Math.cos(y), -Math.sin(y), 0]; const down = [fwd[1] * right[2] - fwd[2] * right[1], fwd[2] * right[0] - fwd[0] * right[2], fwd[0] * right[1] - fwd[1] * right[0]]; return { f, R: [right, down, fwd] }; }
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
function project(cam, C, P) { const d = [P[0] - C[0], P[1] - C[1], P[2] - C[2]]; const x = dot(cam.R[0], d), y = dot(cam.R[1], d), z = dot(cam.R[2], d); return [cam.f * x / z + IW / 2, cam.f * y / z + IH / 2]; }
function ground(cam, uv) { const r0 = (uv[0] - IW / 2) / cam.f, r1 = (uv[1] - IH / 2) / cam.f; const R = cam.R; const d = [0, 1, 2].map(i => r0 * R[0][i] + r1 * R[1][i] + R[2][i]); return d[2] < 0 ? [-d[0] / d[2], -d[1] / d[2]] : null; }
/* the scene (seeded, like the code) */
let s = 7; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
const TRUE = camera(1100, 40, 25), C0 = [0, 0, 80];
const rd = 40 * Math.PI / 180, u = [Math.sin(rd), Math.cos(rd), 0], n = [Math.cos(rd), -Math.sin(rd), 0];
const by = 25 * Math.PI / 180, base = [95 * Math.sin(by), 95 * Math.cos(by), 0];
const at = (a, b) => [base[0] + a * u[0] + b * n[0], base[1] + a * u[1] + b * n[1], 0];
const noisy = p => [p[0] + 0.7 * gauss(), p[1] + 0.7 * gauss()];
const LINES = [-1, 0, 1].map(k => Array.from({ length: 40 }, (_, i) => noisy(project(TRUE, C0, at(-35 + 70 * i / 39, k * 3.6)))));
const CARS = Array.from({ length: 10 }, (_, i) => { const Ln = 4.5 + 0.2 * gauss(), Wd = 1.8 + 0.06 * gauss(); const a0 = -24 + 5.5 * i, b0 = (i % 2 - 0.5) * 3.6; return { tw: Wd, px: [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(([a, b]) => noisy(project(TRUE, C0, at(a0 + a * Ln / 2, b0 + b * Wd / 2)))) }; });
const TRACK = Array.from({ length: 91 }, (_, i) => noisy(project(TRUE, C0, at(-30 + 20 * i / 30, -1.8))));   /* 3 s at 72 km/h */
/* vanishing point */
function fitLine(P) { let mx = 0, my = 0; P.forEach(p => { mx += p[0]; my += p[1]; }); mx /= P.length; my /= P.length; let a = 0, b = 0, c = 0; P.forEach(p => { const x = p[0] - mx, y = p[1] - my; a += x * x; b += x * y; c += y * y; }); const th = 0.5 * Math.atan2(2 * b, a - c); const nx = -Math.sin(th), ny = Math.cos(th); return [nx, ny, nx * mx + ny * my]; }
const LL = LINES.map(fitLine); let A11 = 0, A12 = 0, A22 = 0, b1 = 0, b2 = 0; LL.forEach(([a, b, c]) => { A11 += a * a; A12 += a * b; A22 += b * b; b1 += a * c; b2 += b * c; }); const det = A11 * A22 - A12 * A12; const VP = [(A22 * b1 - A12 * b2) / det, (A11 * b2 - A12 * b1) / det];
const VW = (() => { const pts = LINES.flat().concat(TRACK); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; pts.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }); const m = 60; x0 -= m; x1 += m; y0 -= m; y1 += m; const s = Math.min(640 / (x1 - x0), 360 / (y1 - y0)); return { x0: (x0 + x1) / 2 - 320 / s, y0: (y0 + y1) / 2 - 180 / s, s }; })();
const setup = (f, nadir) => camera(f, nadir ? 90 : Math.atan2(IH / 2 - VP[1], f) * 180 / Math.PI, 0);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const med = a => { const b = a.slice().sort((x, y) => x - y); const m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
function measure(f, nadir, cars) {
  const cam = setup(f, nadir); const gc = cars.map(c => c.px.map(p => ground(cam, p)));
  const ratios = gc.map(g => (dist(g[0], g[3]) + dist(g[1], g[2])) / (dist(g[0], g[1]) + dist(g[3], g[2])));
  const widths = gc.map(g => 0.5 * (dist(g[0], g[1]) + dist(g[3], g[2])));
  const gl = LINES.map(L => L.map(p => ground(cam, p))); const d0 = gl[1][39], d1 = gl[1][0]; let dx = d0[0] - d1[0], dy = d0[1] - d1[1]; const nn = Math.hypot(dx, dy); dx /= nn; dy /= nn;
  const offs = gl.map(L => med(L.map(p => -dy * p[0] + dx * p[1]))).sort((a, b) => a - b); const lane = med([offs[1] - offs[0], offs[2] - offs[1]]);
  const gt = TRACK.map(p => ground(cam, p));
  return { cam, gc, gl, gt, ratio: med(ratios), width: med(widths), widths, lane, pitch: nadir ? 90 : Math.atan2(IH / 2 - VP[1], f) * 180 / Math.PI };
}
W.w3_s127 = function (box) {
  V.say(box, '<b>משמאל</b> — מה שהרחפן רואה: כביש, עשרה רכבים, ורכב אדום שנוסע 72 קמ״ש. <b>מימין</b> — המפה שהמערכת בונה מהתמונה בלבד. <b>הזז את f</b> עד שהרכבים במפה נראים כמו רכבים (אורך פי 2.5 מהרוחב), או <b>לחץ "מצא f"</b>. אחר כך <b>שנה את ההנחות</b> על רוחב נתיב ורוחב רכב, וראה איך שני הרמזים מסכימים — או לא — ומה קורה למהירות. המטרה: שגיאת מהירות מתחת ל־5%.');
  let mode = 0, f = 700, laneP = 3.5, carP = 1.8, t0 = performance.now();
  V.tabs(box, ['המצלמה מוטה', '🐞 הנחה: המצלמה ישר למטה', '🐞 רק רכב אחד'], i => { mode = i; draw(); });
  const r1 = V.row(box); const sf = V.slider(r1, 'f (פיקסלים)', 400, 3000, 10, f, v => { f = v; draw(); }, v => F(v, 0));
  r1.appendChild(V.button('מצא f', () => scan(), 'primary'));
  const r2 = V.row(box); V.slider(r2, 'רוחב נתיב מונח (מ׳)', 3.25, 3.75, 0.05, laneP, v => { laneP = v; draw(); }, v => F(v, 2)); V.slider(r2, 'רוחב רכב מונח (מ׳)', 1.7, 1.9, 0.01, carP, v => { carP = v; draw(); }, v => F(v, 2));
  const g = el('div', { style: 'display:flex;gap:12px;flex-wrap:wrap;justify-content:center;direction:rtl' }); box.appendChild(g);
  const c1 = V.canvas(g, 640, 360); const c2 = V.canvas(g, 380, 360); [c1, c2].forEach(c => { c.dir = 'ltr'; c.style.border = '1px solid var(--line)'; c.style.borderRadius = '8px'; });
  const c3 = V.canvas(box, 640, 120); c3.dir = 'ltr'; c3.style.display = 'block'; c3.style.margin = '8px auto 0';
  const out = el('div'); box.appendChild(out);
  const curve = []; for (let ff = 400; ff <= 3000; ff += 20) curve.push([ff, measure(ff, false, CARS).ratio]);
  function scan() { let i = 0; const go = () => { if (!document.body.contains(box)) return; if (i >= curve.length) { const best = curve.reduce((a, b) => Math.abs(b[1] - 2.5) < Math.abs(a[1] - 2.5) ? b : a); f = best[0]; sf.set(f); draw(); return; } f = curve[i][0]; sf.set(f); draw(); i += 2; requestAnimationFrame(go); }; go(); }
  function draw() {
    const nadir = mode === 1, cars = mode === 2 ? [CARS[4]] : CARS; const M = measure(f, nadir, cars);
    const hL = laneP / M.lane, hC = carP / M.width, h = mode === 2 ? hC : (hL + hC) / 2, gap = Math.abs(hL - hC) / h;
    const sp = (a, b) => dist(M.gt[a], M.gt[b]) * h * 3.6;   /* over one second (30 frames) */
    const vNear = sp(0, 30), vFar = sp(60, 90), v = sp(30, 60);
    let lo = v, hi = v; if (mode === 2) { const hs = [1.7, 1.9].map(w => w / M.width); lo = sp(30, 60) * hs[0] / h; hi = sp(30, 60) * hs[1] / h; }
    /* image */
    const x = c1.getContext('2d'); x.fillStyle = '#cdbf9f'; x.fillRect(0, 0, 640, 360);
    const P = q => [(q[0] - VW.x0) * VW.s, (q[1] - VW.y0) * VW.s];
    const edge = b => [-60, 60].map(a => P(project(TRUE, C0, at(a, b)))); const e1 = edge(-5), e2 = edge(5);
    x.fillStyle = '#5c5f63'; x.beginPath(); x.moveTo(...e1[0]); x.lineTo(...e1[1]); x.lineTo(...e2[1]); x.lineTo(...e2[0]); x.fill();
    LINES.forEach((L, k) => { x.strokeStyle = '#f8f9fa'; x.lineWidth = 1.6; x.setLineDash(k === 1 ? [8, 8] : []); x.beginPath(); L.forEach((p, i) => i ? x.lineTo(...P(p)) : x.moveTo(...P(p))); x.stroke(); });
    x.setLineDash([3, 4]); x.strokeStyle = 'rgba(255,212,59,.8)'; x.lineWidth = 1; LINES.forEach(L => { const a = P(L[0]); const b = P(VP); x.beginPath(); x.moveTo(...a); x.lineTo(...b); x.stroke(); }); x.setLineDash([]);
    CARS.forEach((c, i) => { const used = cars.includes(c); x.fillStyle = used ? '#e9ecef' : 'rgba(233,236,239,.45)'; x.strokeStyle = '#212529'; x.beginPath(); c.px.forEach((p, j) => j ? x.lineTo(...P(p)) : x.moveTo(...P(p))); x.closePath(); x.fill(); x.stroke(); });
    const k = Math.floor(((performance.now() - t0) / 1000 * 30) % 91); x.strokeStyle = '#e03131'; x.lineWidth = 2; x.beginPath(); TRACK.slice(0, k + 1).forEach((p, i) => i ? x.lineTo(...P(p)) : x.moveTo(...P(p))); x.stroke(); const q = P(TRACK[k]); x.fillStyle = '#e03131'; x.beginPath(); x.arc(q[0], q[1], 5, 0, 7); x.fill();
    x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(0, 0, 640, 22); x.fillStyle = '#ffd43b'; x.font = '12px system-ui'; x.direction = 'rtl'; x.textAlign = 'right'; x.fillText('נקודת המגוז: (' + F(VP[0], 0) + ', ' + F(VP[1], 0) + ') — מעל התמונה, בהמשך הקווים הצהובים', 632, 15); x.fillStyle = 'rgba(0,0,0,.55)'; x.fillText('חיתוך מתוך תמונה של 1280 על 720', 632, 352); x.direction = 'ltr'; x.textAlign = 'left';
    /* ground map */
    const y = c2.getContext('2d'); y.fillStyle = '#f1f3f5'; y.fillRect(0, 0, 380, 360);
    const all = M.gl.flat().concat(M.gc.flat()).map(p => [p[0] * h, p[1] * h]); let mx = 0, my = 0; all.forEach(p => { mx += p[0]; my += p[1]; }); mx /= all.length; my /= all.length;
    const s2 = 4.6, G = p => [190 + (p[0] * h - mx) * s2, 180 - (p[1] * h - my) * s2];
    y.strokeStyle = '#dee2e6'; y.lineWidth = 1; for (let i = -100; i <= 100; i += 10) { const a = G([(mx + i) / h, (my - 200) / h]), b = G([(mx + i) / h, (my + 200) / h]); y.beginPath(); y.moveTo(a[0], a[1]); y.lineTo(b[0], b[1]); y.stroke(); const c = G([(mx - 200) / h, (my + i) / h]), d = G([(mx + 200) / h, (my + i) / h]); y.beginPath(); y.moveTo(c[0], c[1]); y.lineTo(d[0], d[1]); y.stroke(); }
    M.gl.forEach((L, j) => { y.strokeStyle = '#495057'; y.lineWidth = 1.5; y.setLineDash(j === 1 ? [6, 6] : []); y.beginPath(); L.forEach((p, i) => i ? y.lineTo(...G(p)) : y.moveTo(...G(p))); y.stroke(); }); y.setLineDash([]);
    M.gc.forEach(gq => { const r = (dist(gq[0], gq[3]) + dist(gq[1], gq[2])) / (dist(gq[0], gq[1]) + dist(gq[3], gq[2])); const ok = Math.abs(r - 2.5) < 0.3; y.fillStyle = ok ? 'rgba(47,158,68,.55)' : 'rgba(232,89,12,.55)'; y.beginPath(); gq.forEach((p, i) => i ? y.lineTo(...G(p)) : y.moveTo(...G(p))); y.closePath(); y.fill(); });
    y.strokeStyle = '#e03131'; y.lineWidth = 2; y.beginPath(); M.gt.slice(0, k + 1).forEach((p, i) => i ? y.lineTo(...G(p)) : y.moveTo(...G(p))); y.stroke();
    y.fillStyle = '#495057'; y.font = '11px system-ui'; y.direction = 'rtl'; y.textAlign = 'right'; y.fillText('המפה במטרים — משבצת 10 מ׳ (לפי הגובה שנמצא)', 372, 352); y.direction = 'ltr'; y.textAlign = 'left';
    /* f curve */
    const z = c3.getContext('2d'); z.clearRect(0, 0, 640, 120); const X = ff => 40 + (ff - 400) / 2600 * 580, Y = r => 105 - Math.min(Math.max(r, 0), 5) / 5 * 95;
    z.strokeStyle = '#dee2e6'; z.beginPath(); z.moveTo(40, Y(2.5)); z.lineTo(620, Y(2.5)); z.stroke(); z.fillStyle = '#868e96'; z.font = '11px system-ui'; z.fillText('2.5', 14, Y(2.5) + 4); z.direction = 'rtl'; z.textAlign = 'right'; z.fillText('אורך חלקי רוחב של הרכבים במפה, לפי f', 620, 12); z.direction = 'ltr'; z.textAlign = 'left'; z.fillText('400', 32, 118); z.fillText('3000', 600, 118);
    z.strokeStyle = '#1c7ed6'; z.lineWidth = 2; z.beginPath(); curve.forEach(([ff, r], i) => i ? z.lineTo(X(ff), Y(r)) : z.moveTo(X(ff), Y(r))); z.stroke();
    z.strokeStyle = '#212529'; z.setLineDash([4, 3]); z.beginPath(); z.moveTo(X(f), 14); z.lineTo(X(f), 106); z.stroke(); z.setLineDash([]);
    /* readout */
    const err = Math.abs(v - 72) / 72; const pass = mode === 0 && err < 0.05;
    const rows = [['ההטיה שנמצאה מהאופק', F(M.pitch, 1) + '°', 'אמיתית: 40°'], ['אורך חלקי רוחב של הרכבים (חציון)', F(M.ratio, 2), 'רכב טיפוסי: 2.5'], ['הגובה לפי רוחב הנתיב', mode === 2 ? '—' : F(hL, 1) + ' מ׳', 'אמיתי: 80 מ׳'], ['הגובה לפי רוחב הרכבים', F(hC, 1) + ' מ׳', mode === 2 ? 'מרכב אחד בלבד' : ''], ['פער בין שני הרמזים', mode === 2 ? 'אין רמז שני' : F(gap * 100, 0) + '%', gap > 0.1 && mode !== 2 ? 'גדול — ההנחות לא מתאימות' : ''], ['מהירות הרכב האדום (השנייה האמצעית)', mode === 2 ? F(lo, 0) + ' עד ' + F(hi, 0) + ' קמ״ש' : F(v, 0) + ' קמ״ש', 'אמיתית: 72'], ['בשנייה הראשונה / בשנייה האחרונה', F(vNear, 0) + ' / ' + F(vFar, 0) + ' קמ״ש', 'צריכות להיות שוות']];
    out.innerHTML = window.D4.table(['', 'מה המערכת מצאה', ''], rows) + '<p class="say" style="margin-top:6px">' + (mode === 1 ? '🐞 בהנחה שהמצלמה ישר למטה יש קנה מידה אחד לכל התמונה. אבל במבט מוטה פיקסל רחוק שווה יותר מטרים מפיקסל קרוב — ולכן המהירות של אותו רכב משתנה לאורך הנסיעה. ושים לב: שני רמזי הרוחב דווקא מסכימים — הם לא יגלו את הטעות. מה שמגלה אותה הוא <b>הצורה</b>: הרכבים יוצאים ביחס של ' + F(M.ratio, 2) + ' במקום 2.5.' : mode === 2 ? '🐞 עם רכב אחד אין חציון ואין רמז שני: אם הרכב הזה רוחבו בין 1.7 ל־1.9 מטר, המהירות בטווח שלמעלה. כך מערכת טובה מדווחת — טווח, לא מספר אחד.' : pass ? '✓ שגיאת מהירות ' + F(err * 100, 1) + '% — מתחת ל־5%.' : '✗ שגיאת מהירות ' + F(err * 100, 1) + '%. ' + (Math.abs(M.ratio - 2.5) > 0.3 ? 'הרכבים במפה ' + (M.ratio > 2.5 ? 'ארוכים' : 'קצרים') + ' מדי — f לא נכון.' : 'f טוב; בדוק את ההנחות על הרוחב.')) + '</p>';
  }
  draw(); const tick = () => { if (!document.body.contains(box)) return; draw(); setTimeout(() => requestAnimationFrame(tick), 60); }; setTimeout(tick, 60);
};
})();
