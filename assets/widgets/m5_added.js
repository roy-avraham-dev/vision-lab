/* Module 5 — demo for section 11.6 (an addition): the tracks reveal the road. Tab 1: thirty tracks on a four-lane road;
   the road direction (doubled-angle mean vs the naive mean), the lane width from the period of the lateral positions,
   and the scale. Tab 2: the drone descends; the scale is carried by the camera-motion scale, with or without RANSAC. */
(function () {
const W = window.W, V = window.V, el = V.el;
const F = (x, d) => (Math.round(x * 10 ** d) / 10 ** d).toFixed(d);
function rng(seed) { let s = seed % 2147483647 || 1; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; r.g = () => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r()); return r; }
const PXM = 9, ROAD = 35 * Math.PI / 180, U = [Math.cos(ROAD), Math.sin(ROAD)], N = [-Math.sin(ROAD), Math.cos(ROAD)], LANES = [-5.25, -1.75, 1.75, 5.25];
function makeTracks(n, wob, seed) { const r = rng(seed * 7919 + 13); const T = []; for (let i = 0; i < n; i++) { const lane = Math.floor(r() * 4), dir = lane >= 2 ? 1 : -1, s0 = -60 + 80 * r(), v = 15 + 10 * r(), off = r.g() * wob; const pts = []; for (let k = 0; k < 40; k++) { const t = k / 30, a = dir * (s0 + v * t), c = LANES[lane] + off + 0.1 * Math.sin(2 * t + i); pts.push([640 + (a * U[0] + c * N[0]) * PXM + r.g(), 360 + (a * U[1] + c * N[1]) * PXM + r.g()]); } T.push({ pts, dir }); } return T; }
function analyse(T, doubled) {
  let c = 0, s = 0; T.forEach(({ pts }) => { const d = [pts[39][0] - pts[0][0], pts[39][1] - pts[0][1]]; const a = Math.atan2(d[1], d[0]); if (doubled) { c += Math.cos(2 * a); s += Math.sin(2 * a); } else { c += a; } });
  const road = doubled ? 0.5 * Math.atan2(s, c) : c / T.length;   /* naive: the angles averaged as plain numbers */ const u = [Math.cos(road), Math.sin(road)], n = [-u[1], u[0]];
  const off = T.map(({ pts }) => { const v = pts.map(p => p[0] * n[0] + p[1] * n[1]).sort((a, b) => a - b); return v[20]; });
  const span = Math.max(...off) - Math.min(...off); const ws = [], R = [];
  for (let w = 5; w < Math.max(span, 6); w += 0.2) { let x = 0, y = 0; off.forEach(o => { x += Math.cos(2 * Math.PI * o / w); y += Math.sin(2 * Math.PI * o / w); }); ws.push(w); R.push(Math.hypot(x, y) / off.length); }
  const Rm = Math.max(...R); let pk = -1; for (let i = 1; i < R.length - 1; i++) if (R[i] >= R[i - 1] && R[i] >= R[i + 1] && R[i] > 0.7 * Rm) pk = i;
  return { road, u, n, off, ws, R, lane: pk >= 0 ? ws[pk] : NaN, fit: pk >= 0 ? R[pk] : 0, phase: pk >= 0 ? Math.atan2(...off.reduce((a, o) => [a[0] + Math.sin(2 * Math.PI * o / ws[pk]), a[1] + Math.cos(2 * Math.PI * o / ws[pk])], [0, 0])) : 0 };
}
W.w5_s116 = function (box) {
  V.say(box, '<b>הלשונית הראשונה</b>: מסלולים של רכבים מעל כביש בן ארבעה נתיבים — כל מה שהמערכת יודעת. היא מוצאת את <b>כיוון הכביש</b> (החץ), את <b>רוחב הנתיב</b> מהמחזור של המיקומים לרוחב (הגרף), ומשם <b>מטרים לפיקסל</b>. <b>שנה</b> את מספר הרכבים ואת הנדנוד בתוך הנתיב, ו<b>החלף</b> לממוצע רגיל של זוויות כדי לראות למה צריך את הזווית הכפולה. <b>הלשונית השנייה</b>: הרחפן יורד, וקנה המידה עובר דרך תנועת המצלמה.');
  let tab = 0; const tb = V.tabs(box, ['הכביש והנתיבים', 'זום: הרחפן יורד'], i => { tab = i; p1.style.display = i ? 'none' : ''; p2.style.display = i ? '' : 'none'; if (i) zoomReset(); else draw1(); });
  /* ---------- tab 1 ---------- */
  const p1 = el('div'); box.appendChild(p1);
  let n = 30, wob = 0.25, seed = 3, doubled = true, sand = false;
  const r1 = V.row(p1); V.slider(r1, 'מספר רכבים', 3, 40, 1, n, v => { n = v; draw1(); }, v => F(v, 0)); V.slider(r1, 'נדנוד בתוך הנתיב (מ׳)', 0, 1.2, 0.05, wob, v => { wob = v; draw1(); }, v => F(v, 2));
  const r2 = V.row(p1); V.tabs(r2, ['ממוצע של זוויות כפולות', 'ממוצע רגיל של הזוויות (כמספרים)'], i => { doubled = !i; draw1(); });
  r2.appendChild(V.button('סצנה חדשה', () => { seed++; draw1(); }));
  const sl = el('label', { class: 'ctl', html: '<input type="checkbox"> חול אחיד: תנועת המצלמה לא אמינה' }); r2.appendChild(sl); sl.querySelector('input').onchange = e => { sand = e.target.checked; draw1(); };
  const g1 = el('div', { style: 'display:flex;gap:12px;flex-wrap:wrap;justify-content:center;direction:rtl' }); p1.appendChild(g1);
  const ca = V.canvas(g1, 560, 360), cb = V.canvas(g1, 380, 360); [ca, cb].forEach(c => { c.dir = 'ltr'; c.style.border = '1px solid var(--line)'; c.style.borderRadius = '8px'; });
  const out1 = el('div'); p1.appendChild(out1);
  function draw1() {
    const T = makeTracks(n, wob, seed), A = analyse(T, doubled); const x = ca.getContext('2d'); x.fillStyle = '#c9c2ad'; x.fillRect(0, 0, 560, 360);
    const P = p => [(p[0] - 640) * 0.62 + 280, (p[1] - 360) * 0.62 + 180];
    x.save(); x.translate(280, 180); x.rotate(ROAD); x.fillStyle = '#5c5f63'; x.fillRect(-500, -7.6 * PXM * 0.62, 1000, 15.2 * PXM * 0.62); x.restore();
    T.forEach(({ pts, dir }) => { x.strokeStyle = dir > 0 ? '#ffa94d' : '#74c0fc'; x.lineWidth = 2; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(...P(p)) : x.moveTo(...P(p))); x.stroke(); const e = P(pts[39]); x.fillStyle = x.strokeStyle; x.beginPath(); x.arc(e[0], e[1], 3, 0, 7); x.fill(); });
    if (isFinite(A.lane)) { const ph = A.phase / (2 * Math.PI) * A.lane; x.strokeStyle = 'rgba(255,255,255,.7)'; x.setLineDash([6, 6]); x.lineWidth = 1; for (let k = -6; k <= 6; k++) { const o = ph + (k + 0.5) * A.lane; const c0 = [A.n[0] * o, A.n[1] * o]; const a = P([c0[0] - 900 * A.u[0], c0[1] - 900 * A.u[1]]), b = P([c0[0] + 900 * A.u[0], c0[1] + 900 * A.u[1]]); x.beginPath(); x.moveTo(...a); x.lineTo(...b); x.stroke(); } x.setLineDash([]); }
    x.strokeStyle = '#e03131'; x.fillStyle = '#e03131'; x.lineWidth = 3; const a0 = [280 - 90 * A.u[0], 180 - 90 * A.u[1]], a1 = [280 + 90 * A.u[0], 180 + 90 * A.u[1]]; x.beginPath(); x.moveTo(...a0); x.lineTo(...a1); x.stroke();
    x.font = '12px system-ui'; x.direction = 'rtl'; x.textAlign = 'right'; x.fillStyle = 'rgba(0,0,0,.65)'; x.fillText('כתום וכחול: שני כיווני נסיעה · אדום: הכביש שנמצא · מקווקו: גבולות הנתיבים שנמצאו', 552, 352); x.direction = 'ltr'; x.textAlign = 'left';
    const y = cb.getContext('2d'); y.clearRect(0, 0, 380, 360); y.fillStyle = '#868e96'; y.font = '11px system-ui'; y.direction = 'rtl'; y.textAlign = 'right'; y.fillText('כמה טוב המסלולים יושבים על רשת בצעד w', 372, 16); y.direction = 'ltr'; y.textAlign = 'left';
    const wmax = Math.max(...A.ws), X = w => 30 + (w - 5) / (wmax - 5 || 1) * 330, Y = r => 190 - r * 160; y.strokeStyle = '#dee2e6'; [0, 0.5, 1].forEach(r => { y.beginPath(); y.moveTo(30, Y(r)); y.lineTo(360, Y(r)); y.stroke(); y.fillText(String(r), 8, Y(r) + 4); });
    y.strokeStyle = '#1c7ed6'; y.lineWidth = 1.5; y.beginPath(); A.ws.forEach((w, i) => i ? y.lineTo(X(w), Y(A.R[i])) : y.moveTo(X(w), Y(A.R[i]))); y.stroke();
    if (isFinite(A.lane)) { y.strokeStyle = '#e03131'; y.setLineDash([4, 3]); y.beginPath(); y.moveTo(X(A.lane), 26); y.lineTo(X(A.lane), 192); y.stroke(); y.setLineDash([]); y.fillStyle = '#e03131'; y.fillText('w = ' + F(A.lane, 1) + ' px', Math.min(X(A.lane) + 4, 300), 40); }
    y.fillStyle = '#868e96'; y.fillText('w (px) →', 300, 206);
    /* lateral positions strip */
    y.fillStyle = '#495057'; y.direction = 'rtl'; y.textAlign = 'right'; y.fillText('המיקום של כל מסלול לרוחב הכביש', 372, 238); y.direction = 'ltr'; y.textAlign = 'left';
    const om = Math.min(...A.off), oM = Math.max(...A.off), Q = o => 30 + (o - om) / (oM - om || 1) * 330; A.off.forEach(o => { y.fillStyle = 'rgba(28,126,214,.6)'; y.fillRect(Q(o) - 1, 250, 3, 40); });
    if (isFinite(A.lane)) { const ph = A.phase / (2 * Math.PI) * A.lane; y.strokeStyle = '#e03131'; for (let k = -8; k <= 8; k++) { const o = ph + k * A.lane; if (o < om - 2 || o > oM + 2) continue; y.beginPath(); y.moveTo(Q(o), 246); y.lineTo(Q(o), 296); y.stroke(); } }
    const mpp = 3.5 / A.lane, err = Math.abs(mpp * PXM - 1), dirErr = Math.abs(((A.road * 180 / Math.PI - 35) % 180 + 270) % 180 - 90);
    const level = sand ? 3 : (!isFinite(A.lane) || A.fit < 0.6) ? 2 : 1;
    const rows = [['כיוון הכביש', F(((A.road * 180 / Math.PI) % 180 + 180) % 180, 1) + '°', 'אמיתי: 35°' + (dirErr > 20 ? ' — <b>שגוי</b>' : '')], ['רוחב נתיב', isFinite(A.lane) ? F(A.lane, 1) + ' px' : '—', 'אמיתי: 31.5 px'], ['התאמה לרשת', F(A.fit, 2), A.fit < 0.6 ? 'חלשה — לא סומכים' : 'טובה'], ['מטר לפיקסל', isFinite(mpp) ? F(mpp, 4) : '—', 'אמיתי: 0.1111' + (isFinite(err) ? ' · שגיאה ' + F(err * 100, 1) + '%' : '')], ['רמת התשובה', String(level), level === 1 ? 'מטרים עם טווח' : level === 2 ? 'יחסי בלבד: זז / עומד' : 'לא נמדד']];
    out1.innerHTML = window.D4.table(['', 'מה המערכת מצאה', ''], rows) + '<p class="say" style="margin-top:6px">' + (!doubled && dirErr > 20 ? '🐞 ממוצע של הזוויות כמספרים: רכבים ב־35° וב־145°− (הכיוון ההפוך) נותנים ממוצע באמצע — בערך ניצב לכביש. ואז ה"נתיבים" נמדדים לאורך הכביש, ואין להם שום מחזור. זווית כפולה מתקנת את זה: 35° ו־145°− הופכים ל־70° ול־290°−, שזו אותה זווית.' : level === 1 && err < 0.05 ? '✓ קנה מידה בשגיאה של ' + F(err * 100, 1) + '% — מתוך המסלולים בלבד.' : level === 3 ? 'רמה 3: בלי תנועת מצלמה אמינה אי אפשר להפריד בין רכב שזז לרחפן שזז. המערכת לא מודדת.' : level === 2 ? 'רמה 2: המסלולים לא יושבים על רשת ברורה (מעט רכבים, או נדנוד גדול). המערכת אומרת רק "זז" או "עומד".' : 'השגיאה ' + F(err * 100, 1) + '% — נסה יותר רכבים.') + '</p>';
  }
  /* ---------- tab 2 ---------- */
  const p2 = el('div', { style: 'display:none' }); box.appendChild(p2);
  let bad = 15, ransac = true, timer = null;
  const r3 = V.row(p2); V.slider(r3, 'התאמות גרועות (%)', 0, 40, 5, bad, v => { bad = v; zoomReset(); }, v => F(v, 0)); V.tabs(r3, ['עם רנסק', 'בלי רנסק (ריבועים פחותים על הכול)'], i => { ransac = !i; zoomReset(); });
  r3.appendChild(V.button('▶ הרחפן יורד', () => zoomRun(), 'primary'));
  const cz = V.canvas(p2, 640, 300); cz.dir = 'ltr'; cz.style.display = 'block'; cz.style.margin = '6px auto'; const out2 = el('div'); p2.appendChild(out2);
  function simFit(a, b) { const n = a.length; let ax = 0, ay = 0, bx = 0, by = 0; for (let i = 0; i < n; i++) { ax += a[i][0]; ay += a[i][1]; bx += b[i][0]; by += b[i][1]; } ax /= n; ay /= n; bx /= n; by /= n; let sxx = 0, sxy = 0, ss = 0; for (let i = 0; i < n; i++) { const px = a[i][0] - ax, py = a[i][1] - ay, qx = b[i][0] - bx, qy = b[i][1] - by; sxx += px * qx + py * qy; sxy += px * qy - py * qx; ss += px * px + py * py; } return Math.hypot(sxx, sxy) / ss; }
  function fitStep(a, b, r) { if (!ransac) return simFit(a, b); let best = null, bc = -1; for (let it = 0; it < 60; it++) { const i = Math.floor(r() * a.length), j = Math.floor(r() * a.length); if (i === j) continue; const sc = Math.hypot(b[i][0] - b[j][0], b[i][1] - b[j][1]) / Math.hypot(a[i][0] - a[j][0], a[i][1] - a[j][1]); const th = Math.atan2(b[i][1] - b[j][1], b[i][0] - b[j][0]) - Math.atan2(a[i][1] - a[j][1], a[i][0] - a[j][0]); const c = Math.cos(th) * sc, s = Math.sin(th) * sc; const tx = b[i][0] - (c * a[i][0] - s * a[i][1]), ty = b[i][1] - (s * a[i][0] + c * a[i][1]); const inl = []; for (let k = 0; k < a.length; k++) { const px = c * a[k][0] - s * a[k][1] + tx, py = s * a[k][0] + c * a[k][1] + ty; if (Math.hypot(px - b[k][0], py - b[k][1]) < 3) inl.push(k); } if (inl.length > bc) { bc = inl.length; best = inl; } } return simFit(best.map(k => a[k]), best.map(k => b[k])); }
  let st = null;
  function zoomReset() { if (timer) { clearInterval(timer); timer = null; } const r = rng(11); const G = Array.from({ length: 120 }, () => [r() * 1280, r() * 720]); st = { r, G, t: 0, scale: 1, prev: G.map(p => p.slice()), hist: [] }; drawZ(); }
  function zoomRun() { zoomReset(); timer = setInterval(() => { if (!document.body.contains(box) || st.t >= 150) { clearInterval(timer); timer = null; return; } st.t++; const z = Math.pow(1.004, st.t); const cur = st.G.map((p, i) => { const q = [640 + (p[0] - 640) * z + 0.5 * st.r.g(), 360 + (p[1] - 360) * z + 0.5 * st.r.g()]; if (i < st.G.length * bad / 100) { q[0] += 25 * st.r.g(); q[1] += 25 * st.r.g(); } return q; }); st.scale *= fitStep(st.prev, cur, st.r); st.prev = cur; st.hist.push([st.t, 0.1094 / st.scale, 0.1094 / z]); drawZ(); }, 25); }
  function drawZ() {
    const x = cz.getContext('2d'); x.clearRect(0, 0, 640, 300); const z = Math.pow(1.004, st.t);
    x.save(); x.beginPath(); x.rect(0, 0, 300, 300); x.clip(); x.fillStyle = '#c9c2ad'; x.fillRect(0, 0, 300, 300); x.translate(150, 150); x.scale(z * 0.6, z * 0.6); x.rotate(ROAD); x.fillStyle = '#5c5f63'; x.fillRect(-400, -7.6 * PXM * 0.5, 800, 15.2 * PXM * 0.5); x.strokeStyle = '#fff'; x.setLineDash([10, 10]); [-1, 0, 1].forEach(k => { x.beginPath(); x.moveTo(-400, k * 3.5 * PXM * 0.5); x.lineTo(400, k * 3.5 * PXM * 0.5); x.stroke(); }); x.restore(); x.setLineDash([]);
    x.fillStyle = 'rgba(0,0,0,.6)'; x.font = '12px system-ui'; x.fillText('frame ' + st.t + ' · image ×' + F(z, 3), 8, 292);
    const X = t => 340 + t / 150 * 280, Y = v => 270 - (v - 0.05) / 0.07 * 240; x.strokeStyle = '#dee2e6'; [0.06, 0.08, 0.1, 0.12].forEach(v => { x.beginPath(); x.moveTo(340, Y(v)); x.lineTo(620, Y(v)); x.stroke(); x.fillStyle = '#868e96'; x.fillText(F(v, 2), 306, Y(v) + 4); });
    const line = (k, col) => { x.strokeStyle = col; x.lineWidth = 2; x.beginPath(); st.hist.forEach((h, i) => i ? x.lineTo(X(h[0]), Y(h[k])) : x.moveTo(X(h[0]), Y(h[k]))); x.stroke(); };
    line(2, '#adb5bd'); line(1, '#1c7ed6'); x.direction = 'rtl'; x.textAlign = 'right'; x.fillStyle = '#1c7ed6'; x.fillText('מטר לפיקסל — מה שהמערכת מעריכה', 630, 16); x.fillStyle = '#868e96'; x.fillText('אפור: האמת', 630, 32); x.direction = 'ltr'; x.textAlign = 'left';
    const h = st.hist[st.hist.length - 1]; const e = h ? Math.abs(h[1] / h[2] - 1) : 0;
    out2.innerHTML = '<p class="say">' + (!h ? 'קנה המידה נמדד פעם אחת מהנתיבים: 0.1094 מטר לפיקסל. לחץ "הרחפן יורד".' : 'פריים ' + h[0] + ': המערכת מעריכה <b>' + F(h[1], 4) + '</b> מטר לפיקסל, האמת ' + F(h[2], 4) + ' — שגיאה של <b>' + F(e * 100, 2) + '%</b>. ' + (st.t >= 150 ? (e < 0.02 ? '✓ קנה המידה עבר דרך הירידה בלי למדוד שוב.' : '✗ בלי רנסק, ההתאמות הגרועות מושכות כל צעד קצת — והשגיאה מצטברת.') : '')) + '</p>';
  }
  draw1();
};
})();
