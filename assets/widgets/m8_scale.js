/* Module 8 — three more triggers, all about SCALE (metres from the video itself): a desert with no road, a sudden zoom,
   and a near-horizontal view. Each is a scripted depiction (naive vs required), like the nine triggers of 1.3 — no
   algorithm inside. Used in 1.3 (all three), 6.3 (desert, horizon) and 7.3 (zoom). */
(function () {
const W = window.W, V = window.V, el = V.el, D4 = window.D4; const { F, table } = D4;
const linkify = t => t.replace(/מודול (\d), (פרקים|פרק|סעיף) ([\d.]+)/g, (m, mo, kind, id) => '<a class="ref" href="#/m' + mo + '/' + (id.includes('.') ? 's' : 'c') + '/' + id + '">' + m + '</a>');
const lnk = (h, t) => '<a class="ref" href="#/' + h + '">' + t + '</a>';
const hsh = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const TR = {
  desert: { name: 'מדבר בלי כביש', what: 'הרחפן טס מעל שטח פתוח: רכב אחד חונה, רכב אחד נוסע על דרך עפר מתפתלת. אין קווי נתיב, ובחצי השני של הקטע — חול אחיד כמעט בלי פרטים.', naive: 'מטר־לפיקסל קבוע, ובלי לבדוק אם הערכת תנועת המצלמה אמינה: על החול היא "מוצאת" תזוזה של אפס, ותנועת הרחפן נרשמת כתנועה של הרכבים — הרכב החונה "נוסע" 29 קמ״ש.', req: 'בלי נתיבים — קנה המידה רק מרוחב רכב אחד, ולכן טווח רחב. כשנגמרים הפרטים על הקרקע, המערכת יורדת לרמה 3: "לא נמדד" — עדיף מספר חסר על מספר שגוי.', ch: 6, read: 'מודול 3, סעיף 12.7; מודול 5, סעיף 11.6; מודול 5, פרק 8' },
  zoom: { name: 'זום פתאומי', what: 'הרחפן מתקרב (או עושה זום) פי 2 בתוך שנייה. הרכבים ממשיכים לנסוע באותה מהירות — 72 קמ״ש.', naive: 'קנה המידה נמדד פעם אחת בהתחלה ולא מתעדכן: אחרי הזום כל פיקסל שווה חצי, אבל המערכת לא יודעת — וכל המהירויות קופצות פי 2.', req: 'קנה המידה עובר דרך הזום: הערכת תנועת המצלמה נותנת בכל צעד גם שינוי גודל, והמכפלה שלהם מתקנת את מטר־לפיקסל. מקור קנה המידה בפלט: "נשמר מקודם".', ch: 7, read: 'מודול 5, סעיף 11.6; מודול 5, פרק 8; מודול 1, פרק 9' },
  horizon: { name: 'מבט כמעט אופקי', what: 'המצלמה מוטה כמעט עד האופק. רכבים קרובים גדולים, ורחוקים — כמה פיקסלים בלבד, ופיקסל אחד שם שווה מטרים רבים.', naive: 'מודדת מהירות לכל רכב שזוהה, בכל מקום בתמונה. ליד האופק פיקסל אחד של רעד במלבן הוא עשרות מטרים — והמהירות קופצת בין 15 ל־200 קמ״ש.', req: 'לכל שורה בתמונה המערכת יודעת כמה מטרים שווה פיקסל. מעל סף — "מחוץ לטווח המדידה" (הפס האפור); קרוב לסף — טווח רחב; וקרוב למצלמה — מספר.', ch: 6, read: 'מודול 3, סעיף 12.4; מודול 3, סעיף 12.7; מודול 5, סעיף 11.1' } };
const MSN = { 6: 'אבן דרך 4: מפיקסל למטרים', 7: 'אבן דרך 5: עמידות' };
function card(k) { const T = TR[k]; return '<div class="deep" style="padding:8px 12px">' + table(['', ''], [['<b>מה קורה</b>', T.what], ['<b style="color:#e8590c">ניסיון ראשון נאיבי</b>', T.naive], ['<b style="color:#2f9e44">המערכת הנדרשת</b>', T.req], ['<b>איפה זה נבנה</b>', lnk('m8/c/' + T.ch, 'פרק ' + T.ch + ' — ' + MSN[T.ch])], ['<b>מה לחזור לקרוא</b>', linkify(T.read)]]) + '</div>'; }
function tag(x, px, py, txt, col) { x.font = 'bold 12px system-ui'; x.direction = 'rtl'; const w = x.measureText(txt).width + 10; x.fillStyle = col; x.fillRect(px - w / 2, py - 18, w, 17); x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText(txt, px, py - 5); x.direction = 'ltr'; x.textAlign = 'left'; }
function car(x, cx, cy, ang, L, Wd, col) { x.save(); x.translate(cx, cy); x.rotate(ang); x.fillStyle = col; x.fillRect(-L / 2, -Wd / 2, L, Wd); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(L * 0.05, -Wd / 2 + 1, L * 0.22, Wd - 2); x.restore(); }
function draw(k, x, t, mode) {
  const Wc = 640, Hc = 360; const req = mode === 'req'; const ORANGE = '#e8590c', GREEN = '#2f9e44', GREY = '#495057';
  if (k === 'desert') {
    const T = t % 10, pan = T * 8 / 0.1, rocky = T < 4.5; /* the drone flies east at 8 m/s; 0.1 m per pixel */
    x.fillStyle = '#e3cf9f'; x.fillRect(0, 0, Wc, Hc);
    for (let i = 0; i < 260; i++) { const gx = hsh(i, 1) * 1600 - 200, gy = hsh(i, 2) * Hc; const sx = ((gx - pan) % 1600 + 1600) % 1600 - 200; const dense = gx < 700; if (!dense && hsh(i, 3) > 0.12) continue; x.fillStyle = dense ? 'rgba(110,85,55,.55)' : 'rgba(150,120,80,.25)'; x.beginPath(); x.arc(sx, gy, 2 + 4 * hsh(i, 4), 0, 7); x.fill(); }
    x.strokeStyle = 'rgba(150,115,70,.7)'; x.lineWidth = 14; x.beginPath(); for (let gx = -200; gx < 1800; gx += 20) { const sx = gx - pan, sy = 220 + 50 * Math.sin(gx / 160); gx === -200 ? x.moveTo(sx, sy) : x.lineTo(sx, sy); } x.stroke();
    const parkedX = 520 - pan, carGX = 100 + T * (11.1 / 0.1), carSX = carGX - pan, carSY = 220 + 50 * Math.sin(carGX / 160), ang = Math.atan(50 / 160 * Math.cos(carGX / 160));
    car(x, parkedX, 120, 0.3, 45, 18, '#f8f9fa'); car(x, carSX, carSY, ang, 45, 18, '#1c7ed6');
    const feats = rocky ? 140 + Math.round(20 * Math.sin(T)) : 9 + Math.round(3 * Math.sin(T * 3));
    x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(0, 0, Wc, 22); x.fillStyle = '#fff'; x.font = '12px system-ui'; x.direction = 'rtl'; x.textAlign = 'right'; x.fillText('נקודות קרקע שהתאימו בין פריימים: ' + feats + (feats < 30 ? ' — מעט מדי' : '') + ' · זמן ' + F(T, 1) + ' ש׳', 632, 15); x.direction = 'ltr'; x.textAlign = 'left';
    if (!req) { if (parkedX > 10 && parkedX < Wc - 10) tag(x, parkedX, 105, (rocky ? 0 : 29) + ' קמ״ש', ORANGE); tag(x, carSX, carSY - 14, (rocky ? 40 : 11) + ' קמ״ש', ORANGE); }
    else { if (parkedX > 10 && parkedX < Wc - 10) tag(x, parkedX, 105, rocky ? 'עומד' : 'לא נמדד', rocky ? GREEN : GREY); tag(x, carSX, carSY - 14, rocky ? '34–46 קמ״ש · רמה 1' : 'לא נמדד · רמה 3', rocky ? GREEN : GREY); }
    return { info: req ? (rocky ? 'קנה מידה: רוחב רכב אחד (אין נתיבים) → טווח של ±15%. תנועת המצלמה אמינה.' : 'מעט מדי נקודות על הקרקע: אי אפשר להפריד בין רכב שזז לרחפן שזז. רמה 3 — לא נמדד.') : (rocky ? 'נראה תקין — עד שהקרקע נהיית אחידה.' : 'הרכב החונה "נוסע" 29 קמ״ש: זו תנועת הרחפן. והרכב הנוסע — 11 קמ״ש במקום 40.') };
  }
  if (k === 'zoom') {
    const T = t % 8, z = T < 3 ? 1 : T < 4 ? 1 + (T - 3) : 2; x.fillStyle = '#9aa58a'; x.fillRect(0, 0, Wc, Hc);
    x.save(); x.translate(320, 180); x.scale(z, z); x.rotate(-0.25); x.fillStyle = '#5c5f63'; x.fillRect(-900, -36, 1800, 72); x.strokeStyle = '#fff'; x.lineWidth = 1.5 / z; x.setLineDash([12, 12]); x.beginPath(); x.moveTo(-900, 0); x.lineTo(900, 0); x.stroke(); x.setLineDash([]);
    const cars = [[-1, -18, 0], [-1, -18, 260], [1, 18, 90], [1, 18, 420]]; const pos = []; cars.forEach(([d, y, o]) => { const gx = ((o + d * T * 100) % 1000 + 1500) % 1000 - 500; car(x, gx, y, 0, 45, 18, d > 0 ? '#f8f9fa' : '#ffd43b'); pos.push([gx, y]); }); x.restore();
    pos.forEach(([gx, y]) => { const c = Math.cos(-0.25), s = Math.sin(-0.25); const sx = 320 + z * (gx * c - y * s), sy = 180 + z * (gx * s + y * c); if (sx < 20 || sx > 620 || sy < 20 || sy > 350) return; const v = 72 + Math.round(4 * (hsh(Math.floor(t * 3), gx) - 0.5)); tag(x, sx, sy - 12 * z, req ? v + ' קמ״ש' : Math.round(v * z) + ' קמ״ש', req ? GREEN : ORANGE); });
    x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(0, 0, Wc, 22); x.fillStyle = '#fff'; x.font = '12px system-ui'; x.direction = 'rtl'; x.textAlign = 'right'; x.fillText('הגדלה מאז ההתחלה: ×' + F(z, 2) + ' · מטר לפיקסל ' + (req ? 'מעודכן: ' + F(0.1 / z, 3) : 'קבוע: 0.100') + ' · זמן ' + F(T, 1) + ' ש׳', 632, 15); x.direction = 'ltr'; x.textAlign = 'left';
    return { info: req ? 'מקור קנה המידה: "נשמר מקודם, ×' + F(z, 2) + '". הנתיבים נמדדו פעם אחת, בהתחלה.' : (z > 1.05 ? 'כל המהירויות קפצו פי ' + F(z, 1) + ' — אף רכב לא האיץ.' : 'לפני הזום הכול תקין.') };
  }
  /* horizon: a ground plane seen almost horizontally */
  const T = t % 10; const f = 520, hc = 6, pitch = 0.16, cx = 320, cy = 150;
  const P = (X, Y) => { /* camera at height hc looks along +Y, tilted down by pitch */ const depth = Y * Math.cos(pitch) + hc * Math.sin(pitch), up = -hc * Math.cos(pitch) + Y * Math.sin(pitch); return depth > 0.5 ? [cx + f * X / depth, cy - f * up / depth] : null; };
  const yh = cy - f * Math.tan(pitch); x.fillStyle = '#cfe3f2'; x.fillRect(0, 0, Wc, Math.max(0, yh)); x.fillStyle = '#a3b18a'; x.fillRect(0, yh, Wc, Hc - yh);
  const road = [P(-7, 3), P(7, 3), P(7, 3000), P(-7, 3000)]; x.fillStyle = '#5c5f63'; x.beginPath(); road.forEach((p, i) => i ? x.lineTo(...p) : x.moveTo(...p)); x.fill();
  const mpp = Y => { const a = P(0, Y), b = P(0, Y + 1); return a && b ? 1 / Math.max(1e-3, Math.abs(b[1] - a[1])) : 1e9; };
  let yLim = 3; while (mpp(yLim) < 1.0 && yLim < 3000) yLim *= 1.05; const lim = P(0, yLim);
  if (req && lim) { x.fillStyle = 'rgba(73,80,87,.45)'; x.fillRect(0, yh, Wc, lim[1] - yh); x.fillStyle = '#fff'; x.font = '12px system-ui'; x.direction = 'rtl'; x.textAlign = 'right'; x.fillText('מחוץ לטווח המדידה: פיקסל שווה יותר ממטר', 630, lim[1] - 6); x.direction = 'ltr'; x.textAlign = 'left'; }
  [[-3.5, 10, 6], [3.5, 30, -6], [-3.5, 55, 6], [3.5, 95, -6], [-3.5, 150, 6], [3.5, 230, -6]].forEach(([X, Y0, v], i) => { const Y = ((Y0 + v * T) % 260 + 260) % 260 + 9; const a = P(X - 0.9, Y), b = P(X + 0.9, Y), c = P(X, Y + 4.5); if (!a || !b || !c) return; const w = Math.max(2, b[0] - a[0]), h = Math.max(1.5, a[1] - c[1]); x.fillStyle = i % 2 ? '#f8f9fa' : '#ffd43b'; x.fillRect(a[0], c[1], w, h);
    const m = mpp(Y), jitter = (hsh(Math.floor(t * 4), i) - 0.5) * 2 * m * 1.0 * 30 * 3.6 / 6; const naiveV = Math.max(3, Math.round(72 + jitter)); let txt, col;
    if (!req) { txt = naiveV + ' קמ״ש'; col = ORANGE; } else if (m > 1.0) { txt = 'מחוץ לטווח'; col = GREY; } else if (m > 0.3) { txt = Math.round(72 * 0.75) + '–' + Math.round(72 * 1.25) + ' קמ״ש'; col = GREEN; } else { txt = '72 קמ״ש'; col = GREEN; }
    tag(x, a[0] + w / 2, c[1] - 2, txt, col); });
  return { info: req ? 'הסף: פיקסל ששווה יותר ממטר — לא מודדים. בין 0.3 למטר — טווח של ±25%. מתחת — מספר.' : 'רעד של פיקסל אחד במלבן של רכב רחוק הוא עשרות מטרים בשנייה. כל המספרים למעלה הם רעש.' };
}
function make(keys) {
  return function (box) {
    if (keys.length > 1) V.say(box, 'שלושה מצבים נוספים, כולם על <b>קנה המידה</b> — מאיפה המערכת יודעת כמה מטרים שווה פיקסל, כשאין לה נתוני טיסה. <b>בחר מצב</b>, וצפה בו פעם כ<b>ניסיון נאיבי</b> (כתום) ופעם כ<b>מערכת הנדרשת</b> (ירוק). אפור = המערכת אומרת שהיא לא יודעת — וזה חלק מההתנהגות הנדרשת.');
    else V.say(box, 'התקלה המתוכננת: <b>' + TR[keys[0]].name + '</b>. צפה בנאיבי ובנדרש, ואז שחזר את התקלה על המערכת שלך — עם סרטון אמיתי או סינתטי — ותקן.');
    let k = keys[0], mode = 'nv', t0 = performance.now();
    if (keys.length > 1) V.tabs(box, keys.map(q => TR[q].name), i => { k = keys[i]; t0 = performance.now(); cardEl.innerHTML = card(k); });
    V.tabs(box, ['ניסיון נאיבי', 'המערכת הנדרשת'], i => { mode = i ? 'req' : 'nv'; });
    const cv = V.canvas(box, 640, 360); cv.dir = 'ltr'; cv.style.display = 'block'; cv.style.margin = '6px auto'; cv.style.borderRadius = '8px';
    const info = el('p', { class: 'say' }); box.appendChild(info); const cardEl = el('div', { html: card(k) }); box.appendChild(cardEl);
    let last = ''; const loop = () => { if (!document.body.contains(box)) return; const r = draw(k, cv.getContext('2d'), (performance.now() - t0) / 1000, mode); const h = '<b style="color:' + (mode === 'req' ? '#2f9e44' : '#e8590c') + '">' + (mode === 'req' ? 'המערכת הנדרשת' : 'ניסיון נאיבי') + ':</b> ' + r.info; if (h !== last) { info.innerHTML = h; last = h; } requestAnimationFrame(loop); }; loop();
  };
}
W.w8_scale_trig = make(['desert', 'zoom', 'horizon']);
W.w8_fault_desert = make(['desert']); W.w8_fault_zoom = make(['zoom']); W.w8_fault_horizon = make(['horizon']);
})();
