/* Module 1 — hands-on labs for chapters 1–3 (they replace the first-generation visuals of these sections).
   Photo-like procedural scenes are painted on an off-screen canvas and converted to the course's B, G, R arrays. */
(function () {
const W = window.W, V = window.V, IM = window.IM, el = V.el;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const F = (x, d) => V.fmt(x, d === undefined ? 0 : d);
const ltr = s => '<span dir="ltr" style="display:inline-block;direction:ltr;unicode-bidi:isolate">\u202A' + s + '\u202C</span>';
const mono = (parent, txt) => { const d = el('div', { class: 'mono', style: { direction: 'ltr', textAlign: 'left', fontSize: '.86em', background: 'var(--code-bg)', padding: '8px 10px', borderRadius: '8px', whiteSpace: 'pre-wrap', margin: '6px 0' } }); d.textContent = txt || ''; parent.appendChild(d); return d; };
const flex = (box, gap) => { const d = el('div', { style: { display: 'flex', gap: (gap || 14) + 'px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', direction: 'ltr', margin: '8px 0' } }); box.appendChild(d); return d; };
const colm = (parent, title) => { const d = el('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' } }); if (title) d.appendChild(el('div', { class: 'note-small', html: title, style: { direction: 'rtl' } })); parent.appendChild(d); return d; };
const canvasPx = (parent, w, h, cssW) => { const c = document.createElement('canvas'); c.dir = 'ltr'; c.width = w; c.height = h; c.style.width = (cssW || w) + 'px'; c.style.maxWidth = '100%'; c.style.borderRadius = '8px'; c.style.border = '1px solid var(--line)'; parent.appendChild(c); return c; };
const badge = (ok, txt) => '<b style="color:' + (ok ? '#2b8a3e' : '#c92a2a') + '">' + (ok ? '✓ ' : '✗ ') + txt + '</b>';

/* paint with the 2D canvas API, then read back as a B, G, R float image */
function paint(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); fn(x, w, h); const d = x.getImageData(0, 0, w, h).data; const im = IM.color(w, h); for (let i = 0; i < w * h; i++) { im.d[3 * i] = d[4 * i + 2]; im.d[3 * i + 1] = d[4 * i + 1]; im.d[3 * i + 2] = d[4 * i]; } return im; }
const noisy = (im, sd, seed) => { const r = IM.rng(seed || 5); for (let i = 0; i < im.d.length; i++) im.d[i] = clamp(Math.round(im.d[i] + IM.randn(r) * sd), 0, 255); return im; };
const quant = im => { for (let i = 0; i < im.d.length; i++) im.d[i] = clamp(Math.round(im.d[i]), 0, 255); return im; };
const hsvOf = (im, i) => IM.bgr2hsv(im.d[3 * i], im.d[3 * i + 1], im.d[3 * i + 2]);

/* an aerial "drone" scene: grass, a road, cars, a cone, and the orange ball; an optional building shadow */
function droneScene(o) { o = Object.assign({ w: 200, h: 130, shadow: 0.4, tint: [1, 1, 1], seed: 3 }, o); const r = IM.rng(o.seed);
  const im = paint(o.w, o.h, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#5f8f3c'); g.addColorStop(1, '#4b7a33'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let k = 0; k < (o.texture === false ? 0 : 900); k++) { x.fillStyle = `rgba(${30 + r() * 60},${80 + r() * 70},${20 + r() * 30},0.35)`; x.fillRect(r() * w, r() * h, 2, 2); }
    x.fillStyle = o.road || '#6b6b6b'; x.beginPath(); x.moveTo(0, h * 0.18); x.lineTo(w, h * 0.02); x.lineTo(w, h * 0.22); x.lineTo(0, h * 0.38); x.fill();
    x.strokeStyle = '#e9e9e9'; x.setLineDash([6, 6]); x.lineWidth = 1.2; x.beginPath(); x.moveTo(0, h * 0.28); x.lineTo(w, h * 0.12); x.stroke(); x.setLineDash([]);
    const car = (cx, cy, col, ang) => { x.save(); x.translate(cx, cy); x.rotate(ang); x.fillStyle = col; x.fillRect(-11, -5, 22, 10); x.fillStyle = 'rgba(20,30,40,.75)'; x.fillRect(-4, -4, 8, 8); x.restore(); };
    car(40, h * 0.28, '#c62828', -0.27); car(120, h * 0.15, '#1e5bb8', -0.27); car(170, h * 0.1, '#f4f4f2', -0.27);
    x.fillStyle = '#f5c400'; x.fillRect(w * 0.82, h * 0.55, 10, 7); x.fillStyle = '#444'; x.fillRect(w * 0.82 + 4, h * 0.55 + 7, 2, 8);
    x.fillStyle = '#ff4a00'; x.beginPath(); x.moveTo(w * 0.2, h * 0.86); x.lineTo(w * 0.2 + 4, h * 0.72); x.lineTo(w * 0.2 + 8, h * 0.86); x.fill();
    if (o.ball !== false) { const bg = x.createRadialGradient(w * 0.55 - 4, h * 0.62 - 4, 2, w * 0.55, h * 0.62, 13); bg.addColorStop(0, '#ffb04a'); bg.addColorStop(1, '#ff8a00'); x.fillStyle = bg; x.beginPath(); x.arc(w * 0.55, h * 0.62, 13, 0, 7); x.fill(); }
  });
  const truth = IM.gray(o.w, o.h); IM.fillCircle(truth, o.w * 0.55, o.h * 0.62, 13, 255);
  const inShadow = (px, py) => px < o.w * 0.55 + (py - o.h * 0.4) * 0.25;  // a building's shadow edge cuts the ball in half
  const sh = IM.gray(o.w, o.h);
  for (let y = 0; y < o.h; y++) for (let xx = 0; xx < o.w; xx++) { const i = y * o.w + xx; const s = y > o.h * 0.4 && inShadow(xx, y) ? o.shadow : 1; sh.d[i] = s < 1 ? 255 : 0; for (let c = 0; c < 3; c++) im.d[3 * i + c] = im.d[3 * i + c] * s * o.tint[c]; }
  if (o.noise !== 0) noisy(im, o.noise || 2.2, o.seed + 7);
  return { img: im, truth, shadowMask: sh };
}
/* a scanned page: dark text on light paper, optional light falling off from a window */
function docImage(o) { o = Object.assign({ w: 220, h: 140, light: [200, 200], ratio: 0.3, noise: 8, seed: 2, lines: ['CV LAB', 'mask 255', 'otsu 0..1'] , size: 26 }, o);
  const c = document.createElement('canvas'); c.width = o.w; c.height = o.h; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, o.w, o.h); x.fillStyle = '#fff'; x.font = `bold ${o.size}px sans-serif`; x.textBaseline = 'top';
  o.lines.forEach((t, k) => x.fillText(t, 12, 10 + k * (o.size + 12)));
  const d = x.getImageData(0, 0, o.w, o.h).data; const g = IM.gray(o.w, o.h), truth = IM.gray(o.w, o.h); const r = IM.rng(o.seed);
  for (let y = 0; y < o.h; y++) for (let xx = 0; xx < o.w; xx++) { const i = y * o.w + xx; const L = o.light[0] + (o.light[1] - o.light[0]) * xx / (o.w - 1); const t = d[4 * i] / 255; truth.d[i] = t > 0.5 ? 255 : 0; g.d[i] = clamp(Math.round(L * (1 - t * (1 - o.ratio)) + IM.randn(r) * o.noise), 0, 255); }
  return { g, truth };
}
const hist = g => { const h = new Array(256).fill(0); for (const v of g.d) h[clamp(Math.round(v), 0, 255)]++; return h; };
/* a histogram on a canvas, with optional shaded classes and a threshold line */
function drawHist(cv, h, o) { o = o || {}; const x = cv.getContext('2d'), W2 = cv.width, H2 = cv.height; x.clearRect(0, 0, W2, H2); const mx = Math.max(...h) || 1; const sx = W2 / 256;
  for (let v = 0; v < 256; v++) { const hh = Math.sqrt(h[v] / mx) * (H2 - 18); x.fillStyle = o.t !== undefined ? (v < o.t ? '#364fc7' : '#adb5bd') : '#4c6ef5'; x.fillRect(v * sx, H2 - 14 - hh, Math.max(1, sx), hh); }
  x.fillStyle = '#868e96'; x.font = '10px sans-serif'; [0, 64, 128, 192, 255].forEach(v => x.fillText(String(v), Math.min(W2 - 18, v * sx), H2 - 2));
  if (o.t !== undefined) { x.strokeStyle = '#e03131'; x.lineWidth = 2; x.beginPath(); x.moveTo(o.t * sx, 0); x.lineTo(o.t * sx, H2 - 14); x.stroke(); x.fillStyle = '#e03131'; x.font = 'bold 11px sans-serif'; x.fillText('t = ' + Math.round(o.t), Math.min(W2 - 44, o.t * sx + 4), 12); }
  if (o.curve) { const c = o.curve, cm = Math.max(...c.filter(isFinite)); x.strokeStyle = '#f08c00'; x.lineWidth = 2; x.beginPath(); let st = false; c.forEach((v, i) => { if (!isFinite(v) || i > (o.upto === undefined ? 255 : o.upto)) return; const px = i * sx, py = (H2 - 16) - (v / cm) * (H2 - 30); if (!st) { x.moveTo(px, py); st = true; } else x.lineTo(px, py); }); x.stroke(); }
}

/* ===================================================== 1.1 */
W.w1_imgrw = function (box) {
  V.say(box, 'צילום רחפן, כפי שהמחשב רואה אותו. <b>הזז את העכבר על התמונה</b>: הזכוכית המגדלת מראה את הפיקסלים עצמם — שלושה מספרים בכל אחד, בסדר <b>כחול, ירוק, אדום</b>. אחר כך פרק את התמונה לערוצים, ונסה את טעות ההצגה הכי נפוצה.');
  const S = droneScene({ shadow: 1 }); const im = S.img; let mode = 0, px = 110, py = 80;
  V.tabs(box, ['התמונה', 'ערוץ B (כחול)', 'ערוץ G (ירוק)', 'ערוץ R (אדום)', 'הצגה בסדר הלא נכון'], i => { mode = i; draw(); });
  const fx = flex(box); const c0 = IM.canvas(colm(fx, 'img — מערך בצורה (130, 200, 3)'), im.w, im.h, 2.2); const mg = canvasPx(colm(fx, 'זכוכית מגדלת: 7 על 7 פיקסלים סביב העכבר'), 252, 252, 252);
  const code = mono(box); const out = V.say(box);
  c0.addEventListener('mousemove', e => { [px, py] = IM.mouse(c0, e); draw(); });
  function view() { if (mode === 0) return im; if (mode === 4) { const o = IM.copy(im); for (let i = 0; i < o.w * o.h; i++) { const t = o.d[3 * i]; o.d[3 * i] = o.d[3 * i + 2]; o.d[3 * i + 2] = t; } return o; } const g = IM.gray(im.w, im.h); for (let i = 0; i < g.d.length; i++) g.d[i] = im.d[3 * i + mode - 1]; return g; }
  function draw() { const v = view(); const ctx = IM.show(c0, v); ctx.strokeStyle = '#ff00ff'; ctx.lineWidth = 1; ctx.strokeRect(px - 3.5, py - 3.5, 7, 7);
    const m = mg.getContext('2d'); m.clearRect(0, 0, 252, 252); m.font = '9px monospace'; m.textAlign = 'center';
    for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { const x = clamp(px + i, 0, im.w - 1), y = clamp(py + j, 0, im.h - 1); const [b, g, r] = IM.get3(im, x, y).map(Math.round); const cx = (i + 3) * 36, cy = (j + 3) * 36;
      let fill = `rgb(${r},${g},${b})`; if (mode >= 1 && mode <= 3) { const c = [b, g, r][mode - 1]; fill = `rgb(${c},${c},${c})`; } if (mode === 4) fill = `rgb(${b},${g},${r})`;
      m.fillStyle = fill; m.fillRect(cx, cy, 35, 35); const lum = 0.299 * r + 0.587 * g + 0.114 * b; m.fillStyle = (mode >= 1 && mode <= 3 ? [b, g, r][mode - 1] : lum) > 120 ? '#111' : '#fff';
      if (mode >= 1 && mode <= 3) m.fillText(String([b, g, r][mode - 1]), cx + 17, cy + 21); else { m.fillText(String(b), cx + 17, cy + 11); m.fillText(String(g), cx + 17, cy + 21); m.fillText(String(r), cx + 17, cy + 31); }
      if (!i && !j) { m.strokeStyle = '#ff00ff'; m.lineWidth = 2; m.strokeRect(cx + 1, cy + 1, 33, 33); } }
    const [b, g, r] = IM.get3(im, px, py).map(Math.round);
    code.textContent = 'img = cv2.imread("drone.png")\nprint(img.shape, img.dtype)   # (130, 200, 3) uint8\nprint(img[' + py + ', ' + px + '])               # [' + b + ' ' + g + ' ' + r + ']   ← B, G, R' + (mode >= 1 && mode <= 3 ? '\nchannel = img[:, :, ' + (mode - 1) + ']          # ' + ['blue', 'green', 'red'][mode - 1] + ' only: a 2-D array (130, 200)' : '') + (mode === 4 ? '\nplt.imshow(img)                 # matplotlib reads it as R, G, B  ✗\nplt.imshow(img[:, :, ::-1])     # flip the channels first   ✓' : '');
    out.innerHTML = ['הפיקסל תחת העכבר: כחול ' + b + ', ירוק ' + g + ', אדום ' + r + '. ' + (r > 200 && g > 100 && b < 120 ? 'הרבה אדום, קצת ירוק, כמעט בלי כחול — <b>כתום</b>.' : g > r && g > b ? 'הירוק הכי גבוה — דשא.' : Math.abs(r - g) < 20 && Math.abs(g - b) < 20 ? 'שלושה ערכים קרובים — <b>אפור</b> (הכביש).' : ''),
      'ערוץ אחד הוא מערך דו־ממדי של מספרים, ומציגים אותו באפור: בהיר = הרבה כחול. המכונית הכחולה בהירה כאן, הכדור הכתום כמעט שחור.', 'ערוץ הירוק: הדשא בהיר, וגם הכדור הכתום בינוני — כי לכתום יש קצת ירוק.', 'ערוץ האדום: המכונית האדומה והכדור הכי בהירים. הדשא כהה.',
      '<b>אותם מספרים בדיוק</b>, רק שספריית הציור קוראת אותם כ־R, G, B. הכדור הכתום נראה כחול, והמכונית הכחולה נראית אדומה. התיקון: <code>img[:, :, ::-1]</code>.'][mode]; }
  draw();
};

/* ===================================================== 1.2 */
W.w1_coords = function (box) {
  V.say(box, 'שתי כתובות לאותו פיקסל. <b>הזז את העכבר</b> וראה את שתיהן משתנות יחד. אחר כך <b>האתגר</b>: המשחק נותן כתובת באחת הכתיבות, ואתה לוחץ על הפיקסל הנכון. וכפתור "הבאג" מראה מה קורה כשמחליפים את הסדר.');
  const Wd = 20, Hd = 12, K = 26; const S = droneScene({ w: 200, h: 120, shadow: 1, seed: 9 }); const small = IM.color(Wd, Hd); for (let y = 0; y < Hd; y++) for (let x = 0; x < Wd; x++) IM.set(small, x, y, IM.get3(S.img, x * 10 + 5, y * 10 + 5));
  const cv = canvasPx(flex(box), (Wd + 1) * K + 4, (Hd + 1) * K + 4, Math.min(560, (Wd + 1) * K + 4)); const info = el('div'); box.appendChild(info); const code = mono(box); const out = V.say(box);
  let hx = 12, hy = 8, game = null, score = 0, tries = 0, bug = false;
  V.btns(box, [['🎯 אתגר חדש', () => { const x = Math.floor(Math.random() * Wd), y = Math.floor(Math.random() * Hd), kind = Math.random() < 0.5 ? 'arr' : 'pt'; game = { x, y, kind }; draw(); }, 'primary'], ['🐞 הבאג: לצייר ב־(y, x)', () => { bug = !bug; draw(); }]]);
  const pos = e => { const r = cv.getBoundingClientRect(); const sx = cv.width / r.width; return [Math.floor(((e.clientX - r.left) * sx - K) / K), Math.floor(((e.clientY - r.top) * sx - K) / K)]; };
  cv.addEventListener('mousemove', e => { const [x, y] = pos(e); if (x >= 0 && y >= 0 && x < Wd && y < Hd) { hx = x; hy = y; draw(); } });
  cv.addEventListener('click', e => { const [x, y] = pos(e); if (!game || x < 0 || y < 0 || x >= Wd || y >= Hd) return; tries++; const ok = x === game.x && y === game.y; if (ok) score++; const swapped = x === game.y && y === game.x;
    game.res = ok ? badge(true, 'נכון!') : badge(false, 'לא.') + (swapped ? ' <b>החלפת בין x ל־y</b> — בדיוק הבאג של הסעיף.' : ' לחצת על img[' + y + ', ' + x + '].'); draw(); });
  function draw() { const x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height); x.font = '11px sans-serif'; x.textAlign = 'center';
    for (let i = 0; i < Wd; i++) { x.fillStyle = i === hx ? '#e03131' : '#868e96'; x.fillText(String(i), K + i * K + K / 2, 16); }
    for (let j = 0; j < Hd; j++) { x.fillStyle = j === hy ? '#1971c2' : '#868e96'; x.fillText(String(j), 12, K + j * K + K / 2 + 4); }
    for (let j = 0; j < Hd; j++) for (let i = 0; i < Wd; i++) { const [b, g, r] = IM.get3(small, i, j).map(Math.round); x.fillStyle = `rgb(${r},${g},${b})`; x.fillRect(K + i * K, K + j * K, K - 1, K - 1); }
    x.fillStyle = 'rgba(25,113,194,.18)'; x.fillRect(K, K + hy * K, Wd * K, K); x.fillStyle = 'rgba(224,49,49,.18)'; x.fillRect(K + hx * K, K, K, Hd * K);
    x.strokeStyle = '#fff'; x.lineWidth = 3; x.strokeRect(K + hx * K, K + hy * K, K - 1, K - 1);
    if (bug) { x.strokeStyle = '#2f9e44'; x.lineWidth = 3; x.beginPath(); x.arc(K + hx * K + K / 2, K + hy * K + K / 2, K * 0.45, 0, 7); x.stroke(); if (hy < Wd && hx < Hd) { x.strokeStyle = '#ff00ff'; x.setLineDash([4, 3]); x.beginPath(); x.arc(K + hy * K + K / 2, K + hx * K + K / 2, K * 0.45, 0, 7); x.stroke(); x.setLineDash([]); } }
    info.innerHTML = '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;direction:ltr"><div class="mono" style="padding:6px 12px;border-radius:8px;background:rgba(25,113,194,.1)">img[<b style="color:#1971c2">' + hy + '</b>, <b style="color:#e03131">' + hx + '</b>]  ← row first</div><div class="mono" style="padding:6px 12px;border-radius:8px;background:rgba(224,49,49,.1)">cv2.circle(img, (<b style="color:#e03131">' + hx + '</b>, <b style="color:#1971c2">' + hy + '</b>), …)  ← x first</div></div>';
    code.textContent = 'img.shape   # (12, 20, 3)  ← (height, width, channels)\ncv2.resize(img, (40, 24))   # ← (width, height)!';
    out.innerHTML = (game ? '<b>אתגר:</b> לחץ על הפיקסל ' + ltr(game.kind === 'arr' ? 'img[' + game.y + ', ' + game.x + ']' : 'cv2.circle(img, (' + game.x + ', ' + game.y + '), …)') + '. ' + (game.res || '') + ' · ניקוד: ' + score + ' מתוך ' + tries + '<br>' : '') + (bug ? 'ירוק: העיגול במקום הנכון, ' + ltr('(x, y) = (' + hx + ', ' + hy + ')') + '. סגול מקווקו: מה שמצויר כשכותבים בטעות ' + ltr('(y, x) = (' + hy + ', ' + hx + ')') + ' — העיגול "קופץ" לשיקוף לאורך האלכסון.' : 'כחול: השורה (y), אדום: העמודה (x). שים לב ש־y יורד למטה.'); }
  draw();
};

/* ===================================================== 1.3 */
W.w1_draw = function (box) {
  V.say(box, 'עורך ציור קטן. <b>בחר כלי וגרור על התמונה</b>, והקוד נכתב בשבילך. המשימה: צייר מלבן סביב הכדור הכתום, עיגול מלא במרכזו, ותווית "target" מעליו — בדיוק מה שהעוקב שלנו יעשה בכל פריים.');
  const S = droneScene({ shadow: 1, seed: 4 }); let tool = 0, col = 0, th = 2, shapes = [], drag = null;
  const COLS = [['ירוק', [0, 255, 0]], ['אדום', [0, 0, 255]], ['כחול', [255, 0, 0]], ['צהוב', [0, 255, 255]], ['לבן', [255, 255, 255]]];
  V.tabs(box, ['▭ מלבן', '◯ עיגול', '╱ קו', 'T טקסט'], i => { tool = i; }); V.tabs(box, COLS.map(c => c[0] + ' ' + ltr('(' + c[1].join(', ') + ')')), i => { col = i; });
  V.slider(box, 'עובי (‎−1 = מילוי)', -1, 6, 1, th, v => { th = v === 0 ? 1 : v; });
  const c0 = IM.canvas(flex(box), S.img.w, S.img.h, 2.6); const code = mono(box); const out = V.say(box);
  V.btns(box, [['↶ בטל', () => { shapes.pop(); draw(); }, 'ghost'], ['נקה', () => { shapes = []; draw(); }, 'ghost']]);
  c0.addEventListener('mousedown', e => { const p = IM.mouse(c0, e); if (tool === 3) { shapes.push({ t: 3, p, col, th: Math.max(1, th) }); draw(); return; } drag = { t: tool, p, q: p, col, th }; });
  c0.addEventListener('mousemove', e => { if (!drag) return; drag.q = IM.mouse(c0, e); draw(); });
  window.addEventListener('mouseup', () => { if (drag) { if (Math.hypot(drag.q[0] - drag.p[0], drag.q[1] - drag.p[1]) > 1) shapes.push(drag); drag = null; draw(); } });
  const pyCol = c => '(' + COLS[c][1].join(', ') + ')'; const cssCol = c => { const [b, g, r] = COLS[c][1]; return `rgb(${r},${g},${b})`; };
  function line(s) { const [a, b] = s.p, [c, d] = s.q || s.p; if (s.t === 0) return `cv2.rectangle(img, (${a}, ${b}), (${c}, ${d}), ${pyCol(s.col)}, ${s.th})`; if (s.t === 1) return `cv2.circle(img, (${a}, ${b}), ${Math.round(Math.hypot(c - a, d - b))}, ${pyCol(s.col)}, ${s.th})`; if (s.t === 2) return `cv2.line(img, (${a}, ${b}), (${c}, ${d}), ${pyCol(s.col)}, ${s.th})`; return `cv2.putText(img, "target", (${a}, ${b}), cv2.FONT_HERSHEY_SIMPLEX, 0.4, ${pyCol(s.col)}, ${s.th})`; }
  function draw() { const ctx = IM.show(c0, S.img); const all = shapes.concat(drag ? [drag] : []);
    all.forEach(s => { ctx.strokeStyle = ctx.fillStyle = cssCol(s.col); ctx.lineWidth = Math.max(1, s.th); const [a, b] = s.p, [c, d] = s.q || s.p;
      if (s.t === 0) { if (s.th < 0) ctx.fillRect(Math.min(a, c), Math.min(b, d), Math.abs(c - a), Math.abs(d - b)); else ctx.strokeRect(a, b, c - a, d - b); }
      if (s.t === 1) { ctx.beginPath(); ctx.arc(a, b, Math.hypot(c - a, d - b), 0, 7); s.th < 0 ? ctx.fill() : ctx.stroke(); }
      if (s.t === 2) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }
      if (s.t === 3) { ctx.font = 'bold 8px sans-serif'; ctx.fillText('target', a, b); } });
    code.textContent = 'img = cv2.imread("drone.png")\n' + (shapes.map(line).join('\n') || '# drag on the image to draw') ;
    const bx = S.img.w * 0.55, by = S.img.h * 0.62; const rect = shapes.find(s => s.t === 0 && s.th > 0 && Math.min(s.p[0], s.q[0]) <= bx - 11 && Math.max(s.p[0], s.q[0]) >= bx + 11 && Math.min(s.p[1], s.q[1]) <= by - 11 && Math.max(s.p[1], s.q[1]) >= by + 11 && Math.abs(s.q[0] - s.p[0]) < 50);
    const dot = shapes.find(s => s.t === 1 && s.th < 0 && Math.hypot(s.p[0] - bx, s.p[1] - by) < 5); const lab = shapes.find(s => s.t === 3 && Math.abs(s.p[0] - bx) < 25 && s.p[1] < by - 8 && s.p[1] > by - 40);
    out.innerHTML = 'משימה: ' + [rect ? badge(true, 'מלבן סביב הכדור') : '◻ מלבן סביב הכדור', dot ? badge(true, 'נקודה מלאה במרכז') : '◻ עיגול מלא (עובי ‎−1) במרכז', lab ? badge(true, 'תווית מעליו') : '◻ תווית מעליו'].join(' · ') + (rect && dot && lab ? '<br><b>זה בדיוק הפלט של העוקב בפרק 7.</b> שים לב: כל הנקודות בקוד הן ' + ltr('(x, y)') + ', והצבעים ב־B, G, R.' : ''); }
  draw();
};

/* ===================================================== 1.4 */
W.w1_videoloop = function (box) {
  V.say(box, 'סרטון הבדיקה של הסעיף (כדור שזז 6 פיקסלים בכל פריים) רץ בתוך הלולאה. <b>נגן</b>, ועקוב אחרי השורה המודגשת בקוד. אחר כך <b>הכנס באג</b> וראה מה הוא עושה.');
  let i = 0, step = 0, timer = null, bugW = false, bugOk = false, crashed = false;
  const fx = flex(box); const cv = canvasPx(colm(fx, 'חלון "live"'), 320, 240, 320); const codeBox = colm(fx); const code = el('div', { class: 'mono', style: { direction: 'ltr', textAlign: 'left', fontSize: '.82em', background: 'var(--code-bg)', padding: '8px', borderRadius: '8px', whiteSpace: 'pre', minWidth: '330px' } }); codeBox.appendChild(code);
  const strip = canvasPx(box, 640, 60, 640); const out = V.say(box);
  const L = ['cap = cv2.VideoCapture("ball.mp4")', 'while True:', '    ok, frame = cap.read()', '    if not ok:', '        break', '    # process: find the ball…', '    cv2.putText(frame, f"FPS…")', '    cv2.imshow("live", frame)', '    if cv2.waitKey(1) & 0xFF == ord("q"):', '        break', 'cap.release()'];
  const STEPS = [2, 3, 5, 6, 7, 8];
  V.btns(box, [['▶ נגן / עצור', () => { if (timer) { clearInterval(timer); timer = null; } else timer = setInterval(tick, 70); }, 'primary'], ['צעד אחד', () => tick()], ['↺ מההתחלה', () => { i = 0; step = 0; crashed = false; draw(); }, 'ghost']]);
  V.tabs(box, ['קוד תקין', '🐞 בלי waitKey', '🐞 בלי בדיקת ok'], k => { bugW = k === 1; bugOk = k === 2; i = 0; step = 0; crashed = false; draw(); });
  function tick() { if (crashed) return; step = (step + 1) % STEPS.length; if (step === 0) { i++; if (i >= 90) { if (bugOk) { crashed = true; i = 90; } else { i = 0; } } } draw(); if (!document.body.contains(box)) { clearInterval(timer); timer = null; } }
  function frame(k, ctx, sx, ox) { ctx.fillStyle = '#000'; ctx.fillRect(ox, 0, 640 * sx, 480 * sx); ctx.fillStyle = 'rgb(255,200,0)'; ctx.beginPath(); ctx.arc(ox + (50 + k * 6) * sx, 240 * sx, 20 * sx, 0, 7); ctx.fill(); }
  function draw() { const ctx = cv.getContext('2d');
    if (bugW && i > 0) { ctx.fillStyle = '#ced4da'; ctx.fillRect(0, 0, 320, 240); ctx.fillStyle = '#495057'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('(Not Responding)', 160, 120); ctx.textAlign = 'left'; }
    else if (crashed) { ctx.fillStyle = '#2b0b0b'; ctx.fillRect(0, 0, 320, 240); ctx.fillStyle = '#ff6b6b'; ctx.font = '11px monospace'; ctx.fillText('AttributeError:', 10, 100); ctx.fillText("'NoneType' object has no", 10, 118); ctx.fillText("attribute 'shape'", 10, 136); }
    else { frame(i, ctx, 0.5, 0); ctx.fillStyle = '#40c057'; ctx.font = 'bold 12px monospace'; ctx.fillText('FPS: 30.0   frame ' + i, 8, 16); if (STEPS[step] >= 5) { ctx.strokeStyle = '#ff00ff'; ctx.lineWidth = 2; ctx.strokeRect((50 + i * 6) * 0.5 - 12, 108, 24, 24); } }
    const cur = crashed ? -1 : STEPS[step]; code.innerHTML = L.filter((l, k) => !(bugOk && (k === 3 || k === 4)) && !(bugW && (k === 8 || k === 9))).map(l => { const k = L.indexOf(l); return '<div style="padding:1px 6px;border-radius:4px;' + (k === cur ? 'background:#ffe066;color:#111' : '') + '">' + l.replace(/</g, '&lt;') + '</div>'; }).join('');
    const sc = strip.getContext('2d'); sc.clearRect(0, 0, 640, 60); for (let k = 0; k < 8; k++) { const f = Math.max(0, i - 7 + k); const ox = k * 80; sc.save(); sc.beginPath(); sc.rect(ox + 2, 0, 76, 57); sc.clip(); frame(f, sc, 0.118, ox + 2); sc.restore(); sc.fillStyle = '#adb5bd'; sc.font = '9px monospace'; sc.fillText('#' + f, ox + 4, 56); }
    out.innerHTML = crashed ? badge(false, 'קריסה בסוף הסרטון.') + ' ' + ltr('cap.read()') + ' החזיר ' + ltr('ok = False, frame = None') + ', ובלי הבדיקה הקוד ממשיך לעבד ' + ltr('None') + '.'
      : bugW && i > 0 ? badge(false, 'החלון קפא.') + ' בלי ' + ltr('waitKey') + ' מערכת ההפעלה לא מקבלת זמן לצייר את החלון — הלולאה רצה, אבל לא רואים כלום.'
      : 'פריים ' + i + ' מתוך 90 · מרכז הכדור לפי הנוסחה: ' + ltr('(50 + 6·' + i + ', 240) = (' + (50 + 6 * i) + ', 240)') + '. הפס למטה: שמונת הפריימים האחרונים — "ספר תמונות שמדפדפים".'; }
  draw();
};

/* ===================================================== 1.5 */
W.w1_fps_latency = function (box) {
  V.say(box, 'מפעל הפריימים: כל פריים עובר כמה תחנות. <b>שנה את מספר התחנות, הזמן שלהן, ואם הן עובדות במקביל</b>. למטה: מה זה אומר לרחפן שעוקב אחרי מכונית — המערכת תמיד "רואה" אותה במקום שבו הייתה לפני זמן ההשהייה.');
  let n = 4, ms = 16, par = true, speed = 20, t0 = performance.now(), timer;
  const sr = V.row(box); V.slider(sr, 'מספר תחנות', 1, 8, 1, n, v => { n = v; }); V.slider(sr, 'זמן לתחנה (אלפיות)', 4, 60, 1, ms, v => { ms = v; }); V.slider(sr, 'מהירות המטרה (מ׳/ש׳)', 0, 40, 1, speed, v => { speed = v; });
  V.tabs(box, ['תחנות במקביל (צינור)', 'פריים אחד בכל פעם'], i => { par = i === 0; t0 = performance.now(); });
  const cv = canvasPx(box, 640, 250, 640); const out = V.say(box);
  function draw() { if (!document.body.contains(box)) { cancelAnimationFrame(timer); return; } const now = performance.now() - t0; const slow = 12; const x = cv.getContext('2d'); x.clearRect(0, 0, 640, 250);
    const period = par ? ms : ms * n, lat = ms * n, fps = 1000 / period; const stW = 560 / n;
    for (let s = 0; s < n; s++) { x.fillStyle = s % 2 ? '#f1f3f5' : '#e9ecef'; x.fillRect(40 + s * stW, 30, stW - 4, 60); x.fillStyle = '#868e96'; x.font = '10px sans-serif'; x.fillText('תחנה ' + (s + 1), 44 + s * stW, 44); }
    const tt = now / slow; const first = Math.floor((tt - lat) / period) - 1;
    for (let k = Math.max(0, first); k <= Math.floor(tt / period); k++) { const age = tt - k * period; if (age < 0 || age > lat + period) continue; const pos = age / lat; const xx = 40 + pos * 560; const done = age >= lat;
      x.fillStyle = done ? '#2f9e44' : `hsl(${(k * 47) % 360},70%,55%)`; x.fillRect(done ? 600 + (age - lat) / period * 20 : xx - 10, 48, 20, 26); x.fillStyle = '#fff'; x.font = 'bold 9px sans-serif'; x.fillText(String(k % 100), (done ? 600 + (age - lat) / period * 20 : xx - 10) + 4, 65); }
    x.fillStyle = '#212529'; x.font = 'bold 13px sans-serif'; x.fillText('השהייה: ' + F(lat) + ' אלפיות שנייה', 40, 112); x.fillText('קצב: ' + F(fps, 1) + ' פריימים בשנייה', 380, 112);
    const roadY = 190; x.fillStyle = '#495057'; x.fillRect(0, roadY - 18, 640, 36); x.strokeStyle = '#fff'; x.setLineDash([10, 10]); x.beginPath(); x.moveTo(0, roadY); x.lineTo(640, roadY); x.stroke(); x.setLineDash([]);
    const pxPerM = 30, carX = (now / 1000 * (40 + speed * 6)) % 760 - 30, lagM = speed * lat / 1000, ghostX = carX - lagM * pxPerM;
    x.fillStyle = '#e03131'; x.fillRect(carX - 14, roadY - 9, 28, 18); x.strokeStyle = '#ffd43b'; x.lineWidth = 2; x.setLineDash([4, 3]); x.strokeRect(ghostX - 16, roadY - 11, 32, 22); x.setLineDash([]);
    x.fillStyle = '#212529'; x.font = '11px sans-serif'; if (lagM > 0.3) { x.strokeStyle = '#212529'; x.lineWidth = 1; x.beginPath(); x.moveTo(ghostX, roadY - 26); x.lineTo(carX, roadY - 26); x.stroke(); x.fillText(F(lagM, 2) + ' m', (ghostX + carX) / 2 - 14, roadY - 30); } x.fillText('אדום: איפה המכונית באמת · צהוב מקווקו: איפה המערכת רואה אותה (30 פיקסלים = מטר)', 40, 236);
    out.innerHTML = 'קצב ' + ltr(F(fps, 1)) + ' פריימים בשנייה, השהייה ' + ltr(F(lat)) + ' אלפיות. במהירות ' + speed + ' מ׳/ש׳ המערכת מפגרת אחרי המטרה ב־<b>' + F(lagM, 2) + ' מטר</b>. ' + (par ? 'הוסף תחנה: הקצב לא משתנה, ההשהייה גדלה.' : 'בלי צינור, כל תחנה מחכה לקודמת: הקצב יורד פי ' + n + '.');
    timer = requestAnimationFrame(draw); }
  timer = requestAnimationFrame(draw);
};

/* ============ shared: pixel clouds of the ball in two color spaces ============ */
function clouds(cvA, cvB, S, boxes) { const im = S.img; const A = cvA.getContext('2d'), B = cvB.getContext('2d'); const w = cvA.width, h = cvA.height;
  [A, B].forEach(x => { x.clearRect(0, 0, w, h); x.strokeStyle = '#ced4da'; x.strokeRect(30, 6, w - 36, h - 30); x.fillStyle = '#868e96'; x.font = '10px sans-serif'; });
  A.fillText('אדום (R) →', w - 70, h - 6); A.save(); A.translate(10, h / 2 + 30); A.rotate(-Math.PI / 2); A.fillText('ירוק (G) →', 0, 0); A.restore();
  B.fillText('גוון (H) →', w - 64, h - 6); B.save(); B.translate(10, h / 2 + 34); B.rotate(-Math.PI / 2); B.fillText('בהירות (V) →', 0, 0); B.restore();
  const PA = (r, g) => [30 + r / 255 * (w - 36), h - 24 - g / 255 * (h - 30)], PB = (hh, v) => [30 + hh / 60 * (w - 36), h - 24 - v / 255 * (h - 30)];
  if (boxes) { const bx = (x, P, u, v) => { const [x1, y1] = P(u[0], v[1]), [x2, y2] = P(u[1], v[0]); x.fillStyle = 'rgba(66,99,235,.12)'; x.strokeStyle = '#4263eb'; x.lineWidth = 1.5; x.fillRect(x1, y1, x2 - x1, y2 - y1); x.strokeRect(x1, y1, x2 - x1, y2 - y1); }; bx(A, PA, boxes.r, boxes.g); bx(B, PB, boxes.h, boxes.v); }
  for (let i = 0; i < S.truth.d.length; i += 1) { if (!S.truth.d[i]) continue; const b = im.d[3 * i], g = im.d[3 * i + 1], r = im.d[3 * i + 2]; const [hh, , v] = IM.bgr2hsv(b, g, r); const sh = S.shadowMask.d[i] > 0; const col = sh ? '#5f3dc4' : '#f08c00';
    A.fillStyle = col; let [x, y] = PA(r, g); A.fillRect(x - 1.5, y - 1.5, 3, 3); B.fillStyle = col; [x, y] = PB(Math.min(hh, 60), v); B.fillRect(x - 1.5, y - 1.5, 3, 3); }
}

/* ===================================================== 2.1 */
W.w1_shadow = function (box) {
  V.say(box, 'הכדור הכתום, חציו בצל של בניין. <b>הזז את עוצמת הצל</b> ו<b>רחף מעל הכדור</b>. בשני הגרפים: כל פיקסל של הכדור כנקודה — כתום בשמש, סגול בצל. בגרף כחול־ירוק־אדום שתי הקבוצות מתרחקות; בגרף גוון־בהירות הן נשארות על אותו קו אנכי.');
  let s = 0.4, px = 105, py = 80; const sr = V.row(box); V.slider(sr, 'כמה אור נשאר בצל', 0.1, 1, 0.05, s, v => { s = v; draw(); });
  const fx = flex(box); const c0 = IM.canvas(colm(fx, 'הסצנה'), 200, 130, 1.25); const cA = canvasPx(colm(fx, 'פיקסלי הכדור: אדום מול ירוק'), 200, 170); const cB = canvasPx(colm(fx, 'פיקסלי הכדור: גוון מול בהירות'), 200, 170);
  const tb = el('div', { style: { direction: 'ltr', display: 'flex', justifyContent: 'center' } }); box.appendChild(tb); const out = V.say(box); let S;
  c0.addEventListener('mousemove', e => { [px, py] = IM.mouse(c0, e); show(); });
  function draw() { S = droneScene({ shadow: s }); clouds(cA, cB, S); show(); }
  function show() { const ctx = IM.show(c0, S.img); ctx.strokeStyle = '#ff00ff'; ctx.strokeRect(px - 2.5, py - 2.5, 5, 5); const i = py * 200 + px; const [b, g, r] = IM.get3(S.img, px, py).map(Math.round); const [hh, ss, vv] = IM.bgr2hsv(b, g, r);
    const sun = IM.get3(S.img, 116, 80).map(Math.round), shd = IM.get3(S.img, 104, 82).map(Math.round); const hs = IM.bgr2hsv(...sun), hd = IM.bgr2hsv(...shd);
    tb.innerHTML = '<table class="mini" style="margin:6px auto"><tr><th></th><th>B, G, R</th><th>H, S, V</th></tr><tr><td>שמש</td><td>' + sun.join(', ') + '</td><td><b>' + hs[0] + '</b>, ' + hs[1] + ', ' + hs[2] + '</td></tr><tr><td>צל</td><td>' + shd.join(', ') + '</td><td><b>' + hd[0] + '</b>, ' + hd[1] + ', ' + hd[2] + '</td></tr><tr><td>מתחת לעכבר</td><td>' + [b, g, r].join(', ') + '</td><td>' + hh + ', ' + ss + ', ' + vv + '</td></tr></table>';
    out.innerHTML = 'בצל, כל אחד משלושת הערוצים ירד בערך ל־' + Math.round(s * 100) + '% — ולכן במספרים של כחול־ירוק־אדום הפיקסל נראה כמו צבע אחר. אבל הגוון: ' + hs[0] + ' בשמש, ' + hd[0] + ' בצל. ' + (Math.abs(hs[0] - hd[0]) <= 2 ? '<b>כמעט זהה.</b> רק הבהירות (V) ירדה.' : ''); void i; }
  draw();
};

/* ===================================================== 2.2 */
W.w1_hsv = function (box) {
  V.say(box, 'גלגל הצבעים של מרחב הגוון: הזווית היא הגוון, המרחק מהמרכז הוא הרוויה, ופס ההזזה הוא הבהירות. <b>לחץ וגרור על הגלגל</b>, וראה את אותו צבע בשלוש כתיבות — כולל הגוון כפי שהספרייה כותבת אותו (המעלות חלקי 2). אחר כך <b>בחר טווח גוון</b> וראה אילו צבעים הוא תופס.');
  let H = 16, Sat = 255, Val = 255, lo = 5, hi = 25; const fx = flex(box); const cw = canvasPx(colm(fx, 'גוון ורוויה (גרור)'), 240, 240, 240); const side = colm(fx);
  const sw = el('div', { style: { width: '120px', height: '90px', borderRadius: '12px', border: '1px solid var(--line)' } }); side.appendChild(sw); const nums = el('div', { class: 'mono', style: { direction: 'ltr', fontSize: '.9em', lineHeight: '1.6' } }); side.appendChild(nums);
  V.slider(box, 'בהירות V', 0, 255, 1, Val, v => { Val = v; draw(); }); const sr = V.row(box); const sl = V.slider(sr, 'טווח: H low', 0, 179, 1, lo, v => { lo = v; draw(); }); V.slider(sr, 'H high', 0, 179, 1, hi, v => { hi = v; draw(); });
  const strip = canvasPx(box, 640, 60, 640); const out = V.say(box); void sl;
  const R = 110, C = 120; let down = false; const pick = e => { const r = cw.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * 240 - C, y = (e.clientY - r.top) / r.height * 240 - C; const d = Math.hypot(x, y); if (d > R + 6) return; let a = Math.atan2(-y, x) * 180 / Math.PI; if (a < 0) a += 360; H = Math.round(a / 2) % 180; Sat = Math.round(Math.min(1, d / R) * 255); draw(); };
  cw.addEventListener('mousedown', e => { down = true; pick(e); }); cw.addEventListener('mousemove', e => { if (down) pick(e); }); window.addEventListener('mouseup', () => { down = false; });
  const wheel = document.createElement('canvas'); wheel.width = wheel.height = 240; let wv = -1;
  function draw() { if (wv !== Val) { const x = wheel.getContext('2d'); const id = x.createImageData(240, 240); for (let y = 0; y < 240; y++) for (let xx = 0; xx < 240; xx++) { const dx = xx - C, dy = y - C, d = Math.hypot(dx, dy), k = 4 * (y * 240 + xx); if (d > R) { id.data[k + 3] = 0; continue; } let a = Math.atan2(-dy, dx) * 180 / Math.PI; if (a < 0) a += 360; const [b, g, r] = IM.hsv2bgr(Math.round(a / 2) % 180, d / R * 255, Val); id.data[k] = r; id.data[k + 1] = g; id.data[k + 2] = b; id.data[k + 3] = 255; } x.putImageData(id, 0, 0); wv = Val; }
    const x = cw.getContext('2d'); x.clearRect(0, 0, 240, 240); x.drawImage(wheel, 0, 0);
    const arc = (h1, h2) => { x.strokeStyle = '#111'; x.lineWidth = 6; x.beginPath(); x.arc(C, C, R + 5, -h2 * 2 * Math.PI / 180, -h1 * 2 * Math.PI / 180); x.stroke(); };
    if (lo <= hi) arc(lo, hi + 0.5); else { arc(lo, 180); arc(0, hi + 0.5); }
    const a = H * 2 * Math.PI / 180, d = Sat / 255 * R; x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.arc(C + Math.cos(a) * d, C - Math.sin(a) * d, 7, 0, 7); x.stroke(); x.strokeStyle = '#000'; x.lineWidth = 1; x.stroke();
    x.fillStyle = '#495057'; x.font = '10px sans-serif'; [[0, '0'], [30, '30'], [60, '60'], [90, '90'], [120, '120'], [150, '150']].forEach(([h, t]) => { const aa = h * 2 * Math.PI / 180; x.fillText(t, C + Math.cos(aa) * (R - 14) - 6, C - Math.sin(aa) * (R - 14) + 4); });
    const [b, g, r] = IM.hsv2bgr(H, Sat, Val); sw.style.background = `rgb(${r},${g},${b})`;
    nums.innerHTML = 'H = <b>' + H + '</b>  (' + H * 2 + '°)<br>S = ' + Sat + '<br>V = ' + Val + '<br>B, G, R = ' + b + ', ' + g + ', ' + r;
    const s = strip.getContext('2d'); s.clearRect(0, 0, 640, 60); s.textAlign = 'center'; const objs = [['תפוז', [0, 140, 255]], ['כדור בצל', [0, 56, 102]], ['קונוס', [0, 74, 255]], ['לימון', [0, 215, 245]], ['מכונית אדומה', [40, 40, 198]], ['עלה', [40, 150, 60]], ['שמיים', [235, 160, 80]], ['כביש', [107, 107, 107]], ['חולצה ורודה', [180, 105, 255]], ['ענבים', [140, 30, 110]]];
    objs.forEach(([nm, c], k) => { const [hh, ss, vv] = IM.bgr2hsv(...c); const inside = (lo <= hi ? hh >= lo && hh <= hi : hh >= lo || hh <= hi) && ss >= 60 && vv >= 30; const x0 = k * 64; s.fillStyle = `rgb(${c[2]},${c[1]},${c[0]})`; s.fillRect(x0 + 4, 4, 56, 24); s.strokeStyle = inside ? '#2f9e44' : 'transparent'; s.lineWidth = 3; s.strokeRect(x0 + 3, 3, 58, 26); s.fillStyle = '#495057'; s.font = '10px sans-serif'; s.fillText(nm, x0 + 32, 42); s.fillText('H = ' + hh, x0 + 32, 55); });
    out.innerHTML = 'טווח הגוון מ־' + lo + ' עד ' + hi + ' (במעלות: מ־' + lo * 2 + ' עד ' + hi * 2 + ') תופס את הדוגמאות המסומנות בירוק — כולל הכדור <i>בצל</i>, כי הגוון שלו זהה. נסה למצוא טווח שתופס רק את הירוקים, או רק את הכחולים.'; }
  draw();
};

/* ===================================================== 2.3 */
W.w1_isolate = function (box) {
  V.say(box, 'אותו כדור, שני ניסיונות — עם הטווחים <b>מהקוד של הסעיף</b>. בכל גרף, המלבן הכחול הוא הטווח של <code>inRange</code>: נקודה בתוכו נכנסת למסכה. <b>הגבר את הצל</b> וראה איך הנקודות הסגולות (בצל) בורחות מהמלבן בגרף השמאלי, ונשארות בתוכו בגרף הימני.');
  let s = 0.4; V.slider(box, 'כמה אור נשאר בצל', 0.1, 1, 0.05, s, v => { s = v; draw(); });
  const fx = flex(box); const cA = canvasPx(colm(fx, 'כחול־ירוק־אדום: B 0–60, G 100–180, R 200–255'), 240, 180); const cB = canvasPx(colm(fx, 'גוון־רוויה־בהירות: H 5–25, S 120–255, V 40–255'), 240, 180);
  const fx2 = flex(box); const m1 = IM.canvas(colm(fx2, 'mask_bgr'), 200, 130, 1.1), m0 = IM.canvas(colm(fx2, 'התמונה'), 200, 130, 1.1), m2 = IM.canvas(colm(fx2, 'mask_hsv'), 200, 130, 1.1); const out = V.say(box);
  function draw() { const S = droneScene({ shadow: s }); clouds(cA, cB, S, { r: [200, 255], g: [100, 180], h: [5, 25], v: [40, 255] });
    const mb = IM.inRange(S.img, [0, 100, 200], [60, 180, 255]), mh = IM.inRange(S.img, [5, 120, 40], [25, 255, 255], 'hsv'); IM.show(m0, S.img); IM.show(m1, mb, { tint: [255, 255, 255] }); IM.show(m2, mh, { tint: [255, 255, 255] });
    const inBall = m => { let n = 0; for (let i = 0; i < m.d.length; i++) if (m.d[i] && S.truth.d[i]) n++; return n; }; const tot = IM.count(S.truth);
    out.innerHTML = 'מתוך ' + tot + ' פיקסלי הכדור: כחול־ירוק־אדום תפס <b>' + inBall(mb) + '</b>, גוון־רוויה־בהירות תפס <b>' + inBall(mh) + '</b>. ' + (s < 0.9 ? 'הסוד הוא בטווח הבהירות הרחב (40 עד 255): הצל זז רק לאורך הציר האנכי בגרף הימני.' : 'בלי צל, שני המרחבים מצליחים.') + ' שים לב: מסכת הגוון תפסה גם את הקונוס ואת השלט הצהוב — צבעים קרובים. את זה מכוונים בסעיף הבא.'; }
  draw();
};

/* ===================================================== 2.4 */
W.w1_tuner = function (box) {
  V.say(box, '<b>אתגר הכיוונון.</b> בסצנה יש את הכדור (חציו בצל), וגם מלכודות: קונוס כתום, מכונית אדומה ושלט צהוב. כוון את ששת הגבולות עד ש<b>הכדור כולו</b> נשאר, עם כמה שפחות דברים אחרים. היסטוגרמת הגוון מראה איפה כל צבע יושב. מעל 85% התאמה — עברת. שים לב: הקונוס והשלט קרובים מאוד לכדור בגוון — צריך טווח צר.');
  const S = droneScene({ shadow: 0.4 }); const v = { hl: 0, hh: 179, sl: 0, sh: 255, vl: 0, vh: 255 };
  const fx = flex(box); const c0 = IM.canvas(colm(fx, 'frame'), 200, 130, 1.5), c1 = IM.canvas(colm(fx, 'result = bitwise_and(frame, frame, mask)'), 200, 130, 1.5);
  const hc = canvasPx(box, 540, 70, 540); const sr = V.row(box); const sl = {};
  [['hl', 'H low', 179], ['hh', 'H high', 179], ['sl', 'S low', 255], ['sh', 'S high', 255], ['vl', 'V low', 255], ['vh', 'V high', 255]].forEach(([k, n, m]) => { sl[k] = V.slider(sr, n, 0, m, 1, v[k], x => { v[k] = x; draw(); }); });
  const code = mono(box); const out = V.say(box); V.btns(box, [['רמז', () => { out.innerHTML += '<br>רמז: הכדור כתום — גוון סביב 16 (כ־32°). הקונוס אדמדם יותר (סביב 9) והשלט הצהוב סביב 24 — סגור את טווח הגוון ביניהם. הרוויה תפריד את האפור, והבהירות התחתונה צריכה להשאיר מקום לצל (בערך 40).'; }, 'ghost'], ['הצג פתרון', () => { Object.assign(v, { hl: 12, hh: 21, sl: 120, sh: 255, vl: 40, vh: 255 }); Object.keys(v).forEach(k => sl[k].set(v[k])); draw(); }, 'ghost']]);
  const H = new Array(180).fill(0), HC = new Array(180).fill(null); for (let i = 0; i < S.img.w * S.img.h; i++) { const [hh, ss, vv] = hsvOf(S.img, i); if (ss > 60 && vv > 30) { H[hh]++; if (!HC[hh]) HC[hh] = IM.hsv2bgr(hh, 255, 230); } }
  function draw() { const m = IM.inRange(S.img, [v.hl, v.sl, v.vl], [v.hh, v.sh, v.vh], 'hsv'); IM.show(c0, S.img); IM.show(c1, IM.applyMask(S.img, m));
    const x = hc.getContext('2d'); x.clearRect(0, 0, 540, 70); const mx = Math.max(...H); for (let h = 0; h < 180; h++) { const bh = Math.sqrt(H[h] / mx) * 50; const c = IM.hsv2bgr(h, 255, 230); x.fillStyle = `rgb(${c[2]},${c[1]},${c[0]})`; x.fillRect(h * 3, 54 - bh, 3, bh); }
    x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(0, 0, v.hl * 3, 56); x.fillRect((v.hh + 1) * 3, 0, 540, 56); x.strokeStyle = '#111'; x.lineWidth = 2; x.strokeRect(v.hl * 3, 1, (v.hh - v.hl + 1) * 3, 54); x.fillStyle = '#868e96'; x.font = '10px sans-serif'; [0, 30, 60, 90, 120, 150, 179].forEach(h => x.fillText(String(h), h * 3, 68));
    let tp = 0, fp = 0, fn = 0; for (let i = 0; i < m.d.length; i++) { const a = m.d[i] > 0, b = S.truth.d[i] > 0; if (a && b) tp++; else if (a) fp++; else if (b) fn++; } const iou = tp / Math.max(1, tp + fp + fn);
    code.textContent = 'lower: [' + v.hl + ' ' + v.sl + ' ' + v.vl + ']  upper: [' + v.hh + ' ' + v.sh + ' ' + v.vh + ']\nmask = cv2.inRange(hsv, np.array([' + v.hl + ', ' + v.sl + ', ' + v.vl + ']), np.array([' + v.hh + ', ' + v.sh + ', ' + v.vh + ']))';
    out.innerHTML = 'התאמה לכדור: <b>' + Math.round(iou * 100) + '%</b> · ' + (fn ? 'חסרים ' + fn + ' פיקסלים של הכדור' + (fn > 60 ? ' (החצי שבצל? בדוק את V low)' : '') : 'כל הכדור נתפס') + ' · ' + (fp ? fp + ' פיקסלים שאינם הכדור' : 'אין פיקסלים זרים') + '. ' + (iou >= 0.85 ? badge(true, 'עברת! אלה בדיוק המספרים שתעתיק לקוד.') : ''); }
  draw();
};

/* ===================================================== 2.5 */
W.w1_red = function (box) {
  V.say(box, 'ארבעה עצמים אדומים: שניים נוטים לכתום (גוון 3 ו־8), שניים לסגול (גוון 172 ו־177). על המעגל הם שכנים — אבל במספרים הם בשני הקצוות. <b>הפעל כל מסכה</b>, ונסה גם את הטווח "הטבעי" שלא עובד.');
  let mode = 2; V.tabs(box, ['mask1: 0–10', 'mask2: 170–179', 'bitwise_or(mask1, mask2)', '🐞 inRange(170, 10)'], i => { mode = i; draw(); }, 2);
  const fx = flex(box); const ring = canvasPx(colm(fx, 'מעגל הגוון (0–179)'), 220, 220, 220); const c0 = IM.canvas(colm(fx, 'הסצנה'), 160, 100, 1.6), c1 = IM.canvas(colm(fx, 'המסכה'), 160, 100, 1.6); const out = V.say(box);
  const hues = [3, 8, 172, 177]; const im = paint(160, 100, (x, w, h) => { x.fillStyle = '#3c4a3c'; x.fillRect(0, 0, w, h); hues.forEach((hh, k) => { const [b, g, r] = IM.hsv2bgr(hh, 230, 220); x.fillStyle = `rgb(${r},${g},${b})`; x.beginPath(); x.arc(22 + k * 38, 50, 15, 0, 7); x.fill(); }); }); noisy(im, 1.5, 4);
  function draw() { const r = ring.getContext('2d'); r.clearRect(0, 0, 220, 220); for (let h = 0; h < 180; h++) { const [b, g, rr] = IM.hsv2bgr(h, 255, 235); r.strokeStyle = `rgb(${rr},${g},${b})`; r.lineWidth = 18; r.beginPath(); r.arc(110, 110, 80, -(h + 1) * 2 * Math.PI / 180, -h * 2 * Math.PI / 180); r.stroke(); }
    const arc = (a, b, col) => { r.strokeStyle = col; r.lineWidth = 6; r.beginPath(); r.arc(110, 110, 98, -(b + 1) * 2 * Math.PI / 180, -a * 2 * Math.PI / 180); r.stroke(); };
    if (mode === 0 || mode === 2) arc(0, 10, '#2f9e44'); if (mode === 1 || mode === 2) arc(170, 179, '#2f9e44');
    hues.forEach((hh, q) => { const a = hh * 2 * Math.PI / 180, rr = q % 2 ? 40 : 58; r.fillStyle = '#fff'; r.strokeStyle = '#212529'; r.lineWidth = 1; r.beginPath(); r.arc(110 + Math.cos(a) * 80, 110 - Math.sin(a) * 80, 4, 0, 7); r.fill(); r.stroke(); r.beginPath(); r.moveTo(110 + Math.cos(a) * 74, 110 - Math.sin(a) * 74); r.lineTo(110 + Math.cos(a) * (rr + 10), 110 - Math.sin(a) * (rr + 10)); r.stroke(); r.fillStyle = '#212529'; r.font = 'bold 11px sans-serif'; r.textAlign = 'center'; r.fillText(String(hh), 110 + Math.cos(a) * rr, 114 - Math.sin(a) * rr); });
    r.fillStyle = '#495057'; r.font = '10px sans-serif'; r.textAlign = 'center'; r.fillText('0 ו־179', 110, 150); r.fillText('נפגשים מימין', 110, 163);
    const m1 = IM.inRange(im, [0, 120, 70], [10, 255, 255], 'hsv'), m2 = IM.inRange(im, [170, 120, 70], [179, 255, 255], 'hsv'); let m;
    if (mode === 0) m = m1; else if (mode === 1) m = m2; else if (mode === 2) { m = IM.copy(m1); for (let i = 0; i < m.d.length; i++) m.d[i] = Math.max(m1.d[i], m2.d[i]); } else m = IM.gray(160, 100);
    IM.show(c0, im); IM.show(c1, m, { tint: [255, 255, 255] });
    out.innerHTML = ['רק שני האדומים שנוטים לכתום.', 'רק שני האדומים שנוטים לסגול.', badge(true, 'כל ארבעת האדומים') + ' — פיקסל נכנס אם הוא לבן באחת המסכות.', badge(false, 'מסכה ריקה.') + ' ' + ltr('inRange') + ' מחפש ערכים <i>בין</i> 170 ל־10 — ואין מספר כזה. הגוון לא "נכרך" אוטומטית.'][mode]; }
  draw();
};

/* ===================================================== 2.6 */
W.w1_hsvfail = function (box) {
  V.say(box, 'ארבע מלכודות של מרחב הגוון. בכל אחת: התמונה, המסכה של "כתום" (גוון 5–25), והיסטוגרמת הגוון של האזור הבעייתי. <b>עבור בין המקרים והשתמש בפס ההזזה</b> — הוא מראה את התיקון, או למה אין תיקון.');
  let k = 0, p = 0; const tabs = V.tabs(box, ['אפור ולבן', 'אזור כהה מאוד', 'אור צבעוני (שקיעה)', 'עצם נוסף באותו צבע'], i => { k = i; setP(); draw(); }); void tabs;
  const sr = V.row(box); const sl = V.slider(sr, 'S low', 0, 255, 1, 0, x => { p = x; draw(); }); const fx = flex(box); const c0 = IM.canvas(colm(fx, 'התמונה'), 160, 100, 1.6), c1 = IM.canvas(colm(fx, 'מסכת "כתום"'), 160, 100, 1.6); const hc = canvasPx(colm(fx, 'היסטוגרמת הגוון באזור המסומן'), 220, 100); const out = V.say(box);
  const label = sl.el.querySelector('span');
  function setP() { const cfg = [['S low', 0, 255, 0], ['V low', 0, 255, 0], ['עוצמת השקיעה', 0, 1, 0], ['שטח מינימלי (פרק 7)', 0, 400, 0]][k]; label.innerHTML = cfg[0]; sl.input.min = cfg[1]; sl.input.max = cfg[2]; sl.input.step = k === 2 ? 0.05 : 1; p = cfg[3]; sl.set(p); }
  function scene() { if (k === 0) return paint(160, 100, (x, w, h) => { x.fillStyle = '#7a7a7a'; x.fillRect(0, 0, w, h); x.fillStyle = '#f2f2f2'; x.fillRect(20, 20, 50, 30); x.fillStyle = '#ff8a00'; x.beginPath(); x.arc(115, 55, 16, 0, 7); x.fill(); });
    if (k === 1) return paint(160, 100, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#060606'); g.addColorStop(0.5, '#141414'); g.addColorStop(1, '#3a3a3a'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = '#ff8a00'; x.beginPath(); x.arc(115, 55, 16, 0, 7); x.fill(); });
    if (k === 2) { const im = paint(160, 100, (x, w, h) => { x.fillStyle = '#5f8f3c'; x.fillRect(0, 0, w, h); x.fillStyle = '#ff8a00'; x.beginPath(); x.arc(115, 55, 16, 0, 7); x.fill(); x.fillStyle = '#f2f2f2'; x.fillRect(20, 20, 40, 30); }); for (let i = 0; i < im.w * im.h; i++) { im.d[3 * i] *= 1 - 0.75 * p; im.d[3 * i + 1] *= 1 - 0.35 * p; } return im; }
    return paint(160, 100, (x, w, h) => { x.fillStyle = '#5f8f3c'; x.fillRect(0, 0, w, h); x.fillStyle = '#ff8a00'; x.beginPath(); x.arc(115, 55, 16, 0, 7); x.fill(); x.fillStyle = '#ff7f00'; x.beginPath(); x.moveTo(30, 70); x.lineTo(36, 54); x.lineTo(42, 70); x.fill(); x.fillRect(64, 20, 4, 3); x.fillRect(80, 80, 3, 3); }); }
  function draw() { const im = noisy(scene(), k === 1 ? 2.5 : 2, 9 + k); const lo = [5, k === 0 ? p : 60, k === 1 ? p : 30], hi = [25, 255, 255]; const m = IM.inRange(im, lo, hi, 'hsv');
    if (k === 3 && p > 0) IM.components(m).comps.forEach(c => { if (c.area < p) c.pix.forEach(q => { m.d[q] = 0; }); });
    const ctx = IM.show(c0, im); IM.show(c1, m, { tint: [255, 255, 255] }); const reg = [[20, 20, 70, 50], [0, 0, 70, 100], [0, 0, 160, 100], [20, 50, 50, 75]][k]; ctx.strokeStyle = '#ff00ff'; ctx.strokeRect(reg[0], reg[1], reg[2] - reg[0], reg[3] - reg[1]);
    const H = new Array(180).fill(0); for (let y = reg[1]; y < reg[3]; y++) for (let x = reg[0]; x < reg[2]; x++) H[hsvOf(im, y * 160 + x)[0]]++; const x = hc.getContext('2d'); x.clearRect(0, 0, 220, 100); const mx = Math.max(...H); for (let h = 0; h < 180; h++) { const c = IM.hsv2bgr(h, 255, 220); x.fillStyle = `rgb(${c[2]},${c[1]},${c[0]})`; const bh = H[h] / mx * 80; x.fillRect(h * 1.2, 86 - bh, 1.2, bh); } x.strokeStyle = '#111'; x.strokeRect(5 * 1.2, 2, 21 * 1.2, 84); x.fillStyle = '#868e96'; x.font = '9px sans-serif'; x.fillText('0', 0, 98); x.fillText('90', 104, 98); x.fillText('179', 200, 98);
    let stray = 0; for (let i = 0; i < m.d.length; i++) { const yy = Math.floor(i / 160), xx = i % 160; if (m.d[i] && Math.hypot(xx - 115, yy - 55) > 18) stray++; }
    out.innerHTML = ['במלבן הלבן: הרוויה כמעט אפס, והגוון של כל פיקסל הוא בעצם רעש — ההיסטוגרמה מפוזרת על כל המעגל. <b>העלה את S low</b>: ' + (stray ? stray + ' פיקסלים זרים עדיין נתפסים.' : badge(true, 'הלבן והאפור נעלמו מהמסכה.')),
      'בצד השמאלי הבהירות היא 6–20. הפרש של יחידה אחת בערוץ אחד מזיז את הגוון בעשרות מעלות — נקודות אקראיות "נצבעות" כתום. <b>העלה את V low</b>: ' + (stray ? stray + ' נקודות זרות.' : badge(true, 'האזור הכהה נוקה.')),
      'השקיעה מוסיפה אדום וגורעת כחול מכל הסצנה. ' + (p > 0.4 ? 'הדשא והקיר הלבן <b>הפכו לכתומים</b> בגוון — ' + stray + ' פיקסלים זרים. אין סף שמתקן את זה: מרחב הגוון חסין לעוצמת האור, לא לצבע שלו.' : 'הזז את עוצמת השקיעה ותראה את הגוון של כל הסצנה זז.'),
      'הקונוס והנקודות הקטנות באותו גוון בדיוק — צבע לבד לא יכול להפריד. <b>הגדל את השטח המינימלי</b>: ' + (p >= 200 ? badge(true, 'רק הכדור נשאר') + ' — זה בדיוק הסינון של פרק 7.' : stray + ' פיקסלים זרים.')][k]; }
  setP(); draw();
};

/* ===================================================== 3.1 */
W.w1_thresh = function (box) {
  V.say(box, 'עמוד סרוק. <b>לחץ על ההיסטוגרמה</b> (או גרור עליה) כדי לבחור סף, ו<b>רחף על התמונה</b>: 32 הפיקסלים שמתחת לעכבר מופיעים למטה, עם ההחלטה של כל פיקסל — "כהה מהסף? אז 255".');
  const D = docImage({ light: [210, 210], ratio: 0.25, noise: 12 }); let t = 127, inv = true, py = 22, px = 60, down = false; const h = hist(D.g);
  V.tabs(box, ['THRESH_BINARY_INV (כהה = 255)', 'THRESH_BINARY (בהיר = 255)'], i => { inv = i === 0; draw(); });
  const hc = canvasPx(box, 560, 110, 560); const fx = flex(box); const c0 = IM.canvas(colm(fx, 'gray'), D.g.w, D.g.h, 1.4), c1 = IM.canvas(colm(fx, 'mask'), D.g.w, D.g.h, 1.4); const rowc = canvasPx(box, 640, 54, 640); const code = mono(box); const out = V.say(box);
  const setT = e => { const r = hc.getBoundingClientRect(); t = clamp(Math.round((e.clientX - r.left) / r.width * 256), 0, 255); draw(); };
  hc.addEventListener('mousedown', e => { down = true; setT(e); }); hc.addEventListener('mousemove', e => { if (down) setT(e); }); window.addEventListener('mouseup', () => { down = false; });
  c0.addEventListener('mousemove', e => { [px, py] = IM.mouse(c0, e); draw(); });
  function draw() { drawHist(hc, h, { t }); const m = IM.map(D.g, v => (inv ? v < t : v >= t) ? 255 : 0); const ctx = IM.show(c0, D.g); const x0 = clamp(px - 16, 0, D.g.w - 32); ctx.strokeStyle = '#ff00ff'; ctx.strokeRect(x0 - 0.5, py - 0.5, 32, 2); IM.show(c1, m, { tint: [255, 255, 255] });
    const x = rowc.getContext('2d'); x.clearRect(0, 0, 640, 54); const N = 32; for (let k = 0; k < N; k++) { const v = Math.round(D.g.d[py * D.g.w + x0 + k]); const on = inv ? v < t : v >= t; x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(k * 20, 0, 19, 22); x.fillStyle = v > 128 ? '#111' : '#fff'; x.font = '9px monospace'; x.fillText(String(v), k * 20 + 2, 15); x.fillStyle = on ? '#fff' : '#000'; x.fillRect(k * 20, 26, 19, 22); x.strokeStyle = '#adb5bd'; x.strokeRect(k * 20, 26, 19, 22); x.fillStyle = on ? '#111' : '#fff'; x.fillText(on ? '255' : '0', k * 20 + 1, 41); }
    let tp = 0, fp = 0, n = 0; for (let i = 0; i < m.d.length; i++) { if (D.truth.d[i]) n++; if (m.d[i] && D.truth.d[i]) tp++; else if (m.d[i]) fp++; }
    code.textContent = '_, mask = cv2.threshold(gray, ' + t + ', 255, cv2.' + (inv ? 'THRESH_BINARY_INV' : 'THRESH_BINARY') + ')\nprint(cv2.countNonZero(mask))   # ' + IM.count(m);
    out.innerHTML = (inv ? 'פיקסלי טקסט שנתפסו: <b>' + tp + '</b> מתוך ' + n + ' · רקע שנתפס בטעות: <b>' + fp + '</b>. ' + (fp > 200 ? 'הסף גבוה מדי — הרקע הרועש נכנס.' : tp < n * 0.8 ? 'הסף נמוך מדי — חלק מהאותיות נעלם.' : badge(true, 'מסכה נקייה.')) : 'הפוך: עכשיו הרקע הבהיר הוא "כן" והאותיות "לא". זו אותה מסכה עם ' + ltr('bitwise_not') + '.'); }
  draw();
};

/* ===================================================== 3.2 */
W.w1_logic = function (box) {
  V.say(box, 'שתי מסכות: A (עיגול, קו כחול) ו־B (מלבן, קו כתום). <b>גרור אותן בחלון התוצאה</b> ולחץ על פעולה. אחר כך עבור ללשונית המעשית: מסכת הצבע של הסצנה <i>וגם</i> אזור עניין שאתה גורר — כך מגבילים חיפוש לחלק בתמונה.');
  let op = 0, tab = 0, A = [70, 60], B = [110, 50], drag = null, roi = [90, 55, 170, 120];
  V.tabs(box, ['מעבדה: A ו־B', 'מעשי: צבע וגם אזור עניין'], i => { tab = i; draw(); }); V.tabs(box, ['and (A, B)', 'or (A, B)', 'not (A)', 'xor (A, B)'], i => { op = i; draw(); });
  const fx = flex(box); const cA = IM.canvas(colm(fx, 'A'), 180, 120, 1.2), cB = IM.canvas(colm(fx, 'B'), 180, 120, 1.2), cR = IM.canvas(colm(fx, 'התוצאה — גרור כאן'), 180, 120, 2); const code = mono(box); const out = V.say(box);
  const S = droneScene({ w: 180, h: 120, shadow: 0.4, seed: 3 }); const color = IM.inRange(S.img, [3, 110, 35], [27, 255, 255], 'hsv');
  cR.addEventListener('mousedown', e => { const p = IM.mouse(cR, e); if (tab) drag = { roi: true, p, r0: roi.slice() }; else drag = Math.hypot(p[0] - A[0], p[1] - A[1]) < 35 ? 'A' : 'B'; });
  cR.addEventListener('mousemove', e => { if (!drag) return; const p = IM.mouse(cR, e); if (drag.roi) { const dx = p[0] - drag.p[0], dy = p[1] - drag.p[1]; roi = [drag.r0[0] + dx, drag.r0[1] + dy, drag.r0[2] + dx, drag.r0[3] + dy]; } else if (drag === 'A') A = p; else B = p; draw(); });
  window.addEventListener('mouseup', () => { drag = null; });
  function draw() { let a, b; if (!tab) { a = IM.gray(180, 120); IM.fillCircle(a, A[0], A[1], 34, 255); b = IM.gray(180, 120); IM.fillRect(b, B[0] - 30, B[1] - 40, B[0] + 30, B[1] + 40, 255); } else { a = color; b = IM.gray(180, 120); IM.fillRect(b, roi[0], roi[1], roi[2], roi[3], 255); }
    const r = IM.map(a, (v, i) => { const x = v > 0, y = b.d[i] > 0; return [x && y, x || y, !x, x !== y][op] ? 255 : 0; });
    IM.show(cA, tab ? S.img : a, tab ? {} : { tint: [255, 255, 255] }); IM.show(cB, b, { tint: [255, 255, 255] });
    const outl = ctx => { if (tab) return; ctx.lineWidth = 1; ctx.strokeStyle = '#4dabf7'; ctx.beginPath(); ctx.arc(A[0], A[1], 34, 0, 7); ctx.stroke(); ctx.strokeStyle = '#ffa94d'; ctx.strokeRect(B[0] - 30, B[1] - 40, 60, 80); };
    if (tab && op === 0) { const shown = IM.applyMask(S.img, r); const ctx = IM.show(cR, shown); ctx.strokeStyle = '#ffd43b'; ctx.setLineDash([3, 2]); ctx.strokeRect(roi[0], roi[1], roi[2] - roi[0], roi[3] - roi[1]); ctx.setLineDash([]); } else outl(IM.show(cR, r, { tint: [255, 255, 255] }));
    const name = ['bitwise_and(A, B)', 'bitwise_or(A, B)', 'bitwise_not(A)', 'bitwise_xor(A, B)'][op];
    code.textContent = tab ? 'color = cv2.inRange(hsv, lower, upper)\nroi = np.zeros(color.shape, np.uint8)\ncv2.rectangle(roi, (' + roi[0] + ', ' + roi[1] + '), (' + roi[2] + ', ' + roi[3] + '), 255, -1)\nresult = cv2.' + name.replace('A', 'color').replace('B', 'roi') + (op === 0 ? '\nshown = cv2.bitwise_and(frame, frame, mask=result)' : '') : 'result = cv2.' + name + '   # ' + IM.count(r) + ' white pixels';
    out.innerHTML = tab ? (op === 0 ? 'רק פיקסלים כתומים <i>וגם</i> בתוך המלבן הצהוב. גרור את המלבן מחוץ לכדור — הקונוס, שהוא באותו צבע, יכול להיתפס או להיעלם לפי מיקום החלון.' : 'בלשונית המעשית, "וגם" היא הפעולה השימושית. נסה גם את האחרות.') : ['לבן רק איפה ששתיהן לבנות — החיתוך.', 'לבן איפה שלפחות אחת לבנה — האיחוד. ככה חיברנו את שני האדומים.', 'הופך את A: הרקע הופך ל"כן".', 'לבן איפה שבדיוק אחת לבנה — מה שמשתנה בין שתי מסכות.'][op]; }
  draw();
};

/* ===================================================== 3.3 */
W.w1_otsu = function (box) {
  V.say(box, 'אוצו מנסה את כל 256 הספים. לכל סף הוא מחשב כמה שתי הקבוצות מפוזרות בפנים (הקו הכתום), ובוחר את המינימום. <b>לחץ "הרץ את אוצו"</b> וצפה בחיפוש. אחר כך קלקל את התמונה: הקטן את הטקסט עד שההר שלו נבלע, או הוסף תאורה לא אחידה.');
  let small = false, uneven = false, t = 127, upto = -1, timer = null;
  V.tabs(box, ['טקסט רגיל', 'טקסט זעיר'], i => { small = i === 1; reset(); }); V.tabs(box, ['תאורה אחידה', 'ליד חלון'], i => { uneven = i === 1; reset(); });
  const hc = canvasPx(box, 560, 130, 560); const fx = flex(box); const c0 = IM.canvas(colm(fx, 'gray'), 220, 140, 1.3), c1 = IM.canvas(colm(fx, 'mask'), 220, 140, 1.3); const out = V.say(box);
  V.btns(box, [['▶ הרץ את אוצו', () => { clearInterval(timer); upto = 0; timer = setInterval(() => { upto += 4; if (upto >= 255) { upto = 255; clearInterval(timer); t = best; } else t = upto; draw(); }, 30); }, 'primary']]);
  let D, h, curve, best;
  function reset() { clearInterval(timer); D = docImage({ light: uneven ? [70, 235] : [205, 205], ratio: uneven ? 0.35 : 0.25, noise: 12, size: small ? 9 : 26, lines: small ? ['tiny print'] : ['CV LAB', 'mask 255', 'otsu 0..1'] }); h = hist(D.g); const N = D.g.d.length;
    curve = new Array(256).fill(Infinity); let wB = 0, sB = 0, sB2 = 0; const tot = h.reduce((a, c, i) => a + c * i, 0), tot2 = h.reduce((a, c, i) => a + c * i * i, 0);
    for (let k = 0; k < 256; k++) { const wF = N - wB; if (wB > 0 && wF > 0) { const mB = sB / wB, mF = (tot - sB) / wF; const vB = sB2 / wB - mB * mB, vF = (tot2 - sB2) / wF - mF * mF; curve[k] = (wB * vB + wF * vF) / N; } wB += h[k]; sB += k * h[k]; sB2 += k * k * h[k]; }
    best = curve.indexOf(Math.min(...curve)); upto = -1; t = 127; draw(); }
  function draw() { drawHist(hc, h, { t, curve: upto >= 0 ? curve : null, upto }); IM.show(c0, D.g); const m = IM.map(D.g, v => v < t ? 255 : 0); IM.show(c1, m, { tint: [255, 255, 255] });
    let tp = 0, fp = 0, n = 0; for (let i = 0; i < m.d.length; i++) { if (D.truth.d[i]) n++; if (m.d[i] && D.truth.d[i]) tp++; else if (m.d[i]) fp++; }
    out.innerHTML = (upto < 0 ? 'ההיסטוגרמה: ' + (small ? 'ההר של הטקסט כמעט בלתי נראה — יש מעט מאוד פיקסלים כהים.' : uneven ? 'אין שני הרים ברורים: הרקע מרוח על כל הטווח.' : 'שני הרים — טקסט כהה משמאל, נייר בהיר מימין.') : upto < 255 ? 'בודק סף ' + upto + '…' : 'אוצו בחר <b>' + best + '</b>. ') + (upto === 255 ? ' טקסט שנתפס: ' + tp + ' מתוך ' + n + ', רקע בטעות: ' + fp + '. ' + (fp > n ? badge(false, 'אוצו נכשל') + ' — הוא תמיד בוחר סף, גם כשאין עמק אמיתי.' : badge(true, 'המינימום של הקו הכתום הוא בדיוק העמק.')) : ''); }
  reset();
};

/* ===================================================== 3.4 */
W.w1_adaptive = function (box) {
  V.say(box, 'העמוד מצולם ליד חלון. <b>רחף על התמונה</b>: הריבוע הסגול הוא השכונה של הפיקסל, וההחלטה היא "האם הפיקסל כהה מהממוצע של השכונה פחות C". שנה את גודל השכונה ואת C, והשווה לשלוש השיטות בבת אחת.');
  let blk = 31, Cc = 10, dark = 60, px = 60, py = 40; const sr = V.row(box); V.slider(sr, 'הצד הכהה (בהירות)', 20, 200, 5, dark, v => { dark = v; build(); }); V.slider(sr, 'גודל שכונה (אי־זוגי)', 3, 61, 2, blk, v => { blk = v; draw(); }); V.slider(sr, 'C', 0, 30, 1, Cc, v => { Cc = v; draw(); });
  const fx = flex(box); const c0 = IM.canvas(colm(fx, 'gray (רחף)'), 220, 140, 1.6); const zoom = canvasPx(colm(fx, 'השכונה'), 150, 150, 150);
  const fx2 = flex(box); const cG = IM.canvas(colm(fx2, 'סף קבוע 127'), 220, 140, 1.05), cO = IM.canvas(colm(fx2, 'אוצו'), 220, 140, 1.05), cA = IM.canvas(colm(fx2, 'סף מסתגל'), 220, 140, 1.05); const bars = el('div', { style: { display: 'flex', justifyContent: 'center' } }); box.appendChild(bars); const out = V.say(box);
  let D, I; c0.addEventListener('mousemove', e => { [px, py] = IM.mouse(c0, e); draw(true); });
  function build() { D = docImage({ light: [dark, 230], ratio: 0.35, noise: 6 }); I = new Float64Array((D.g.w + 1) * (D.g.h + 1)); for (let y = 0; y < D.g.h; y++) for (let x = 0; x < D.g.w; x++) I[(y + 1) * (D.g.w + 1) + x + 1] = D.g.d[y * D.g.w + x] + I[y * (D.g.w + 1) + x + 1] + I[(y + 1) * (D.g.w + 1) + x] - I[y * (D.g.w + 1) + x]; draw(); }
  const mean = (x, y, r) => { const W1 = D.g.w + 1, x0 = clamp(x - r, 0, D.g.w - 1), x1 = clamp(x + r, 0, D.g.w - 1), y0 = clamp(y - r, 0, D.g.h - 1), y1 = clamp(y + r, 0, D.g.h - 1); const s = I[(y1 + 1) * W1 + x1 + 1] - I[y0 * W1 + x1 + 1] - I[(y1 + 1) * W1 + x0] + I[y0 * W1 + x0]; return s / ((x1 - x0 + 1) * (y1 - y0 + 1)); };
  function score(m) { let tp = 0, fp = 0, n = 0; for (let i = 0; i < m.d.length; i++) { if (D.truth.d[i]) n++; if (m.d[i] && D.truth.d[i]) tp++; else if (m.d[i]) fp++; } return { tp, fp, n }; }
  let cache = null;
  function draw(hoverOnly) { const r = blk >> 1; const ctx = IM.show(c0, D.g); ctx.strokeStyle = '#ff00ff'; ctx.lineWidth = 1; ctx.strokeRect(px - r - 0.5, py - r - 0.5, blk, blk);
    const z = zoom.getContext('2d'); z.imageSmoothingEnabled = false; z.clearRect(0, 0, 150, 150); z.drawImage(c0, px - r, py - r, blk, blk, 0, 0, 150, 150); const v = D.g.d[py * D.g.w + px], mu = mean(px, py, r); const on = v < mu - Cc;
    z.strokeStyle = '#ff00ff'; z.lineWidth = 2; z.strokeRect(75 - 150 / blk / 2, 75 - 150 / blk / 2, 150 / blk, 150 / blk);
    if (!hoverOnly || !cache) { const g = IM.map(D.g, x => x < 127 ? 255 : 0); const h = hist(D.g); let best = 0, bv = Infinity, wB = 0, sB = 0, sB2 = 0; const N = D.g.d.length, tot = h.reduce((a, c, i) => a + c * i, 0), tot2 = h.reduce((a, c, i) => a + c * i * i, 0); for (let k = 0; k < 256; k++) { const wF = N - wB; if (wB > 0 && wF > 0) { const mB = sB / wB, mF = (tot - sB) / wF; const vv = (sB2 - wB * mB * mB) + (tot2 - sB2 - wF * mF * mF); if (vv < bv) { bv = vv; best = k; } } wB += h[k]; sB += k * h[k]; sB2 += k * k * h[k]; }
      const o = IM.map(D.g, x => x < best ? 255 : 0); const a = IM.gray(D.g.w, D.g.h); for (let y = 0; y < D.g.h; y++) for (let x = 0; x < D.g.w; x++) a.d[y * D.g.w + x] = D.g.d[y * D.g.w + x] < mean(x, y, r) - Cc ? 255 : 0;
      cache = { g, o, a, best, sg: score(g), so: score(o), sa: score(a) }; IM.show(cG, g, { tint: [255, 255, 255] }); IM.show(cO, o, { tint: [255, 255, 255] }); IM.show(cA, a, { tint: [255, 255, 255] }); }
    const rows = [['סף קבוע 127', cache.sg], ['אוצו (בחר ' + cache.best + ')', cache.so], ['סף מסתגל', cache.sa]];
    bars.innerHTML = '<table class="mini" style="margin:6px auto"><tr><th>שיטה</th><th>טקסט שנתפס</th><th>רקע שנתפס בטעות</th><th></th></tr>' + rows.map(([nm, sc]) => { const ok = sc.tp > sc.n * 0.85 && sc.fp < sc.n * 0.5; return '<tr><td>' + nm + '</td><td>' + sc.tp + ' מתוך ' + sc.n + '</td><td>' + sc.fp + '</td><td>' + badge(ok, ok ? 'קריא' : 'נכשל') + '</td></tr>'; }).join('') + '</table>';
    out.innerHTML = 'הפיקסל: ' + Math.round(v) + ' · ממוצע השכונה: ' + F(mu, 1) + ' · ' + ltr(Math.round(v) + ' < ' + F(mu, 1) + ' − ' + Cc + ' ?') + ' → <b>' + (on ? '255 (טקסט)' : '0 (רקע)') + '</b>. ' + (blk < 9 ? 'שכונה קטנה מעובי האות: באמצע אות עבה הכול כהה, והאות יוצאת חלולה.' : ''); }
  build();
};
window.LAB = { clamp, F, ltr, mono, flex, colm, canvasPx, badge, paint, noisy, quant, hsvOf, droneScene, docImage, hist, drawHist };
})();
