/* Module 2 visuals — chapters 4–6: convolutional networks, skip connections, vision transformers */
(function () {
const W = window.W, V = window.V, NN = window.NN, el = V.el;
const row = box => { const r = V.row(box); r.style.direction = 'ltr'; r.style.justifyContent = 'center'; r.style.alignItems = 'flex-start'; return r; };
const col = (parent, title) => { const d = el('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' } }); if (title) d.appendChild(el('div', { class: 'note-small', html: title })); parent.appendChild(d); return d; };
const mono = (parent, txt) => { const d = el('div', { class: 'mono', style: { direction: 'ltr', textAlign: 'left', fontSize: '.85em', background: 'var(--code-bg)', padding: '8px 10px', borderRadius: '8px', whiteSpace: 'pre-wrap' } }); d.textContent = txt; parent.appendChild(d); return d; };
const grid = (parent, M, opts = {}) => { const svg = V.s('svg', { viewBox: `0 0 ${M[0].length * 30} ${M.length * 30}`, width: M[0].length * (opts.cell || 30), style: { maxWidth: '100%' } }); parent.appendChild(svg);
  const draw = (M2, hl) => { svg.innerHTML = ''; M2.forEach((r, i) => r.forEach((v, j) => { const h = hl && hl(i, j); const t = opts.heat ? Math.max(0, Math.min(1, (v - (opts.min || 0)) / ((opts.max || 1) - (opts.min || 0)))) : 0; V.s('rect', { x: j * 30 + 1, y: i * 30 + 1, width: 28, height: 28, rx: 4, style: { fill: opts.heat ? `rgba(66,99,235,${0.08 + 0.8 * t})` : 'var(--surface2)', stroke: h ? 'var(--c2)' : 'var(--line)', strokeWidth: h ? 3 : 1 } }, svg); V.s('text', { x: j * 30 + 15, y: i * 30 + 19, 'text-anchor': 'middle', 'font-size': 11, style: { fill: 'var(--ink)' }, text: typeof v === 'number' ? V.fmt(v, opts.d === undefined ? 1 : opts.d) : v }, svg); })); };
  draw(M); return { draw }; };

/* 4.1 an MLP does not know pixels are neighbors */
W.w2_shuffle_pixels = function (box) {
  V.say(box, 'משמאל תמונה, מימין אותה תמונה אחרי ערבוב קבוע של סדר הפיקסלים. לשכבה רגילה (שמשטיחה) אין שום הבדל ביניהן: היא תלמד את שתיהן באותה מידה. <b>לחץ ערבב</b>.');
  const n = 16; const img = [...Array(n)].map((_, y) => [...Array(n)].map((_, x) => (Math.abs(x - 8) < 5 && Math.abs(y - 8) < 5) ? (x < 8 ? 230 : 90) : 20));
  const rr = row(box); const c1 = el('canvas', { width: n, height: n, style: { width: '160px', imageRendering: 'pixelated', borderRadius: '8px' } }); rr.appendChild(c1); const c2 = el('canvas', { width: n, height: n, style: { width: '160px', imageRendering: 'pixelated', borderRadius: '8px' } }); rr.appendChild(c2);
  const out = V.say(box); let perm = [...Array(n * n)].map((_, i) => i);
  const paint = (cv, f) => { const c = cv.getContext('2d'); for (let i = 0; i < n * n; i++) { const v = f(i); c.fillStyle = `rgb(${v},${v},${v})`; c.fillRect(i % n, Math.floor(i / n), 1, 1); } };
  V.btns(box, [['ערבב', () => { const r = NN.rng(Date.now() % 1000); for (let i = n * n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; } draw(); }, 'primary']]);
  function draw() { paint(c1, i => img[Math.floor(i / n)][i % n]); paint(c2, i => { const k = perm[i]; return img[Math.floor(k / n)][k % n]; }); out.innerHTML = 'לעין התמונה הימנית חסרת משמעות. לשכבה מלאה זה <b>אותו וקטור באורך ' + n * n + '</b>, רק בסדר אחר, והיא תלמד אותו באותה הצלחה. קונבולוציה, לעומת זאת, מסתכלת על שכנים, ומשתמשת באותו גרעין בכל מקום.'; }
  draw();
};

/* 4.2 a kernel is a cube over all channels */
W.w2_multichannel_conv = function (box) {
  V.say(box, 'קלט עם שלושה ערוצים (R, G, B) של 4 על 4, וגרעין אחד שהוא קוביה של 3 על 3 על 3. בכל מיקום מכפילים בכל הערוצים יחד <b>ומסכמים למספר אחד</b>. עבור על המיקומים.');
  const r = NN.rng(4); const X = [0, 1, 2].map(() => [...Array(4)].map(() => [...Array(4)].map(() => Math.floor(r() * 5)))); const K = [[[1, 0, -1], [1, 0, -1], [1, 0, -1]], [[0, 0, 0], [0, 1, 0], [0, 0, 0]], [[0, 1, 0], [1, -4, 1], [0, 1, 0]]];
  const rr = row(box); const gs = X.map((m, c) => grid(col(rr, ['R', 'G', 'B'][c]), m, { d: 0, cell: 24 })); const go = col(rr, 'פלט 2×2'); const G = grid(go, [['', ''], ['', '']], { d: 0 });
  const calc = el('div', { class: 'mono note-small', style: { direction: 'ltr', textAlign: 'center' } }); box.appendChild(calc);
  const out = [[0, 0], [0, 0]].map((rw, i) => rw.map((_, j) => { let s = 0; for (let c = 0; c < 3; c++) for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) s += X[c][i + a][j + b] * K[c][a][b]; return s; }));
  V.stepper(box, 4, k => { const i = Math.floor(k / 2), j = k % 2; X.forEach((m, c) => gs[c].draw(m, (a, b) => a >= i && a < i + 3 && b >= j && b < j + 3)); G.draw(out.map((rw, a) => rw.map((v, b) => a * 2 + b <= k ? v : '')), (a, b) => a === i && b === j);
    const parts = [0, 1, 2].map(c => { let s = 0; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) s += X[c][i + a][j + b] * K[c][a][b]; return s; }); calc.textContent = 'R: ' + parts[0] + '  +  G: ' + parts[1] + '  +  B: ' + parts[2] + '  =  ' + out[i][j] + '   (27 multiplications, one number)'; }, { speed: 1300 });
};

/* 4.3 output size */
W.w2_out_size = function (box) {
  V.say(box, 'הנוסחה ⌊(n + 2p − k) / s⌋ + 1, ומה היא אומרת על השכבה. <b>שנה את ארבעת המספרים</b>, או בחר שורה מהטבלה של הסעיף.');
  let n = 28, k = 3, s = 1, p = 1;
  const sr = V.row(box); const Sn = V.slider(sr, 'n', 4, 640, 1, n, v => { n = v; draw(); }); const Sk = V.slider(sr, 'k', 1, 7, 1, k, v => { k = v; draw(); }); const Ss = V.slider(sr, 's', 1, 4, 1, s, v => { s = v; draw(); }); const Sp = V.slider(sr, 'p', 0, 3, 1, p, v => { p = v; draw(); });
  V.tabs(box, ['28, 3, 1, 1', '28, 3, 2, 1', '224, 7, 2, 3', '32, 5, 1, 0', '640, 3, 2, 1'], i => { const c = [[28, 3, 1, 1], [28, 3, 2, 1], [224, 7, 2, 3], [32, 5, 1, 0], [640, 3, 2, 1]][i]; [Sn, Sk, Ss, Sp].forEach((S, j) => S.set(c[j], false)); [n, k, s, p] = c; draw(); });
  const out = V.say(box);
  function draw() { const o = Math.floor((n + 2 * p - k) / s) + 1; out.innerHTML = '<span class="ltr" style="display:inline-block">⌊(' + n + ' + ' + 2 * p + ' − ' + k + ') / ' + s + '⌋ + 1 = <b>' + o + '</b></span>. ' + (o === n ? 'הגודל נשמר.' : o * 2 === n || o * 2 === n + 1 ? 'הגודל חצי.' : o < n && s === 1 ? 'בלי מספיק ריפוד, השוליים נאכלים: ' + (n - o) + ' פיקסלים פחות.' : ''); }
  draw();
};

/* 4.4 max pooling */
W.w2_maxpool = function (box) {
  V.say(box, 'כינוס מקסימום 2 על 2 על מפה של 4 על 4: מכל ריבוע נשאר רק הגדול. בחר מקסימום או ממוצע, ולחץ "הזז ימינה בפיקסל" כדי לבדוק עמידות לתזוזה קטנה.');
  let M = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15]], avg = false;
  V.tabs(box, ['MaxPool', 'AvgPool'], i => { avg = i === 1; draw(); });
  V.btns(box, [['הזז ימינה בפיקסל', () => { M = M.map(r => [r[0]].concat(r.slice(0, 3))); draw(); }], ['איפוס', () => { M = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15]]; draw(); }, 'ghost']]);
  const rr = row(box); const A = grid(col(rr, 'קלט 4×4'), M, { d: 0 }); const B = grid(col(rr, 'פלט 2×2'), [[0, 0], [0, 0]], { d: 1 }); const out = V.say(box);
  function draw() { const O = [0, 1].map(i => [0, 1].map(j => { const v = [M[2 * i][2 * j], M[2 * i][2 * j + 1], M[2 * i + 1][2 * j], M[2 * i + 1][2 * j + 1]]; return avg ? v.reduce((a, b) => a + b) / 4 : Math.max(...v); }));
    A.draw(M, (i, j) => !avg && O[i >> 1][j >> 1] === M[i][j]); B.draw(O); out.innerHTML = avg ? 'ממוצע של כל ריבוע.' : 'הריבוע השמאלי העליון 0, 1, 4, 5: המקסימום 5. אחרי הזזה קטנה, רוב הערכים בפלט כמעט לא משתנים.'; }
  draw();
};

/* 4.5 receptive field */
W.w2_receptive = function (box) {
  V.say(box, 'בנה רשת שכבה אחרי שכבה, וראה כמה פיקסלי קלט נוירון אחד "רואה" (rf) ומה המרווח בין נוירונים שכנים בפיקסלי קלט (jump).');
  const layers = [['conv3', 3, 1]];
  V.btns(box, [['+ conv3', () => { layers.push(['conv3', 3, 1]); draw(); }], ['+ pool2', () => { layers.push(['pool2', 2, 2]); draw(); }], ['+ conv3 s2', () => { layers.push(['conv3s2', 3, 2]); draw(); }], ['+ conv7 s2', () => { layers.push(['conv7s2', 7, 2]); draw(); }], ['הסר אחרונה', () => { if (layers.length > 1) layers.pop(); draw(); }, 'ghost'], ['תחילת ResNet', () => { layers.length = 0; layers.push(['conv7s2', 7, 2], ['pool3s2', 3, 2], ['conv3', 3, 1], ['conv3', 3, 1], ['conv3', 3, 1], ['conv3', 3, 1]); draw(); }]]);
  const code = mono(box, ''); const svg = V.s('svg', { viewBox: '0 0 300 300', width: 220 }); const rr = row(box); rr.appendChild(svg); const out = V.say(box);
  function draw() { let r = 1, j = 1; const lines = []; layers.forEach(([nm, k, s]) => { r += (k - 1) * j; j *= s; lines.push(nm.padEnd(8) + ' rf=' + String(r).padStart(3) + ' jump=' + j); }); code.textContent = lines.join('\n');
    svg.innerHTML = ''; const n = 50, c = 300 / n; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const inside = Math.abs(x - n / 2 + 0.5) < r / 2 && Math.abs(y - n / 2 + 0.5) < r / 2; V.s('rect', { x: x * c, y: y * c, width: c - 0.4, height: c - 0.4, style: { fill: inside ? 'var(--c1)' : 'var(--surface2)', opacity: inside ? 0.7 : 1 } }, svg); }
    out.innerHTML = 'הנוירון האחרון רואה <b>' + r + ' על ' + r + '</b> פיקסלים (מתוך משבצת של 50 על 50 כאן). ' + (r < 20 ? 'רכב של 100 פיקסלים בצילום רחפן? הוא לא יראה אותו כולו.' : ''); }
  draw();
};

/* 4.6 the shapes and parameters of SmallCNN */
W.w2_cnn_shapes = function (box) {
  V.say(box, 'SmallCNN של הסעיף, שכבה אחרי שכבה: הצורה של הפלט ומספר הפרמטרים. העמודה האחרונה מראה איפה באמת נמצאים הפרמטרים.');
  let ch1 = 32, ch2 = 64, hid = 128;
  const sr = V.row(box); V.slider(sr, 'ערוצים 1', 8, 64, 8, ch1, v => { ch1 = v; draw(); }); V.slider(sr, 'ערוצים 2', 16, 128, 16, ch2, v => { ch2 = v; draw(); }); V.slider(sr, 'נסתרת', 32, 256, 32, hid, v => { hid = v; draw(); });
  const out = el('div'); box.appendChild(out);
  function draw() { const L = [['Conv2d(1, ' + ch1 + ', 3, p=1)', '(' + ch1 + ', 28, 28)', ch1 * 9 + ch1], ['ReLU, MaxPool2d(2)', '(' + ch1 + ', 14, 14)', 0], ['Conv2d(' + ch1 + ', ' + ch2 + ', 3, p=1)', '(' + ch2 + ', 14, 14)', ch2 * ch1 * 9 + ch2], ['ReLU, MaxPool2d(2)', '(' + ch2 + ', 7, 7)', 0], ['Flatten', '(' + ch2 * 49 + ',)', 0], ['Linear(' + ch2 * 49 + ', ' + hid + ')', '(' + hid + ',)', ch2 * 49 * hid + hid], ['Linear(' + hid + ', 10)', '(10,)', hid * 10 + 10]]; const tot = L.reduce((s, l) => s + l[2], 0);
    out.innerHTML = '<table class="mini" style="margin:auto;direction:ltr"><tr><th>layer</th><th>output</th><th>params</th><th></th></tr>' + L.map(l => '<tr><td>' + l[0] + '</td><td>' + l[1] + '</td><td>' + l[2].toLocaleString() + '</td><td><div style="width:120px;background:var(--surface2)"><div style="height:8px;width:' + (l[2] / tot * 120) + 'px;background:var(--c2)"></div></div></td></tr>').join('') + '<tr><td><b>total</b></td><td></td><td><b>' + tot.toLocaleString() + '</b></td><td></td></tr></table><p class="note-small" style="text-align:center">השכבה המלאה הראשונה מחזיקה ' + Math.round(L[5][2] / tot * 100) + '% מהפרמטרים.</p>'; }
  draw();
};

/* ===== chapter 5 ===== */
W.w2_vanishing = function (box) {
  V.say(box, 'הניסוי של הסעיף: רשת עמוקה עם tanh, וגרדיאנט שמתחיל באורך 8 ביציאה. כמה ממנו מגיע לקלט, ברשת רגילה ובשאריתית? <b>שנה את העומק ואת scale</b> (תרגיל 5.1).');
  let depth = 20, scale = 0.5; const d = 32;
  const sr = V.row(box); V.slider(sr, 'עומק', 1, 60, 1, depth, v => { depth = v; draw(); }); V.slider(sr, 'scale', 0.25, 2, 0.25, scale, v => { scale = v; draw(); });
  const out = V.say(box); const svg = V.s('svg', { viewBox: '0 0 420 160', width: 420, style: { maxWidth: '100%', direction: 'ltr' } }); const rr = row(box); rr.appendChild(svg);
  const run = (L, res) => { const r = NN.rng(7); const Ws = [...Array(L)].map(() => [...Array(d)].map(() => [...Array(d)].map(() => NN.randn(r) * scale / Math.sqrt(d)))); let h = [...Array(d)].map(() => NN.randn(r)); const zs = [];
    Ws.forEach(Wm => { const z = Wm[0].map((_, j) => h.reduce((s, hi, i) => s + hi * Wm[i][j], 0)); zs.push(z); h = res ? h.map((v, i) => v + Math.tanh(z[i])) : z.map(Math.tanh); });
    let g = Array(d).fill(1); for (let l = L - 1; l >= 0; l--) { const dz = g.map((v, i) => v * (1 - Math.tanh(zs[l][i]) ** 2)); const back = [...Array(d)].map((_, i) => dz.reduce((s, v, j) => s + Ws[l][i][j] * v, 0)); g = res ? g.map((v, i) => v + back[i]) : back; } return Math.hypot(...g); };
  function draw() { const depths = [1, 5, 10, 20, 30, 40, 50, 60].filter(x => x <= Math.max(depth, 1)); if (!depths.includes(depth)) depths.push(depth); depths.sort((a, b) => a - b);
    const a = depths.map(L => [L, run(L, false)]), b = depths.map(L => [L, run(L, true)]); svg.innerHTML = ''; const X = L => 30 + L / 60 * 380, Y = v => 150 - (Math.log10(Math.max(v, 1e-20)) + 20) / 24 * 140;
    [-20, -10, 0, 4].forEach(e => { V.s('line', { x1: 30, x2: 410, y1: Y(10 ** e), y2: Y(10 ** e), style: { stroke: 'var(--line)' } }, svg); V.s('text', { x: 2, y: Y(10 ** e) + 4, 'font-size': 9, style: { fill: 'var(--ink3)' }, text: '1e' + e }, svg); });
    [[a, 'var(--c1)'], [b, 'var(--c3)']].forEach(([P, c]) => V.s('path', { d: 'M' + P.map(([L, v]) => X(L) + ',' + Y(v)).join(' L'), style: { fill: 'none', stroke: c, strokeWidth: 2.5 } }, svg));
    const ra = run(depth, false), rb = run(depth, true); out.innerHTML = 'בעומק ' + depth + ': רשת רגילה <b>' + ra.toExponential(1) + '</b>, שאריתית <b>' + rb.toExponential(1) + '</b> (כחול רגילה, ירוק שאריתית, סקאלה לוגריתמית).'; }
  draw();
};

W.w2_identity_path = function (box) {
  V.say(box, 'כשפותחים את המכפלה (I + F′₁)(I + F′₂)…(I + F′_L), מקבלים 2^L מסלולים. <b>שנה את L</b>: יש תמיד מסלול אחד שעובר רק דרך I, בלי שום כפל שמקטין.');
  let L = 4;
  V.slider(box, 'מספר בלוקים L', 1, 10, 1, L, v => { L = v; draw(); });
  const svg = V.s('svg', { viewBox: '0 0 420 170', width: 420, style: { maxWidth: '100%', direction: 'ltr' } }); const rr = row(box); rr.appendChild(svg); const out = V.say(box);
  const C = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - i + 1) / i; return r; };
  function draw() { svg.innerHTML = ''; const mx = C(L, Math.floor(L / 2)); for (let k = 0; k <= L; k++) { const c = C(L, k), x = 20 + k * 380 / L * (L ? 1 : 0), h = c / mx * 120; V.s('rect', { x: x - 12, y: 140 - h, width: 24, height: h, rx: 3, style: { fill: k === 0 ? 'var(--c3)' : 'var(--c1)' } }, svg); V.s('text', { x, y: 158, 'text-anchor': 'middle', 'font-size': 11, style: { fill: 'var(--ink3)' }, text: k }, svg); V.s('text', { x, y: 134 - h, 'text-anchor': 'middle', 'font-size': 10, style: { fill: 'var(--ink2)' }, text: c }, svg); }
    out.innerHTML = 'הציר: בכמה גורמי F′ המסלול עובר. ' + 2 ** L + ' מסלולים, ו<b>מסלול אחד</b> (בירוק) עובר רק דרך מטריצות יחידה: I·I·…·I. ברשת רגילה יש רק את העמודה הימנית ביותר: F′₁·F′₂·…·F′_L.'; }
  draw();
};

W.w2_basic_block = function (box) {
  V.say(box, 'BasicBlock: שתי קונבולוציות 3 על 3 עם נרמול, ועוד קו דילוג. <b>שנה צעד או מספר ערוצים</b>: אם הצורה משתנה, קו הדילוג הופך לקונבולוציה של 1 על 1.');
  let cin = 64, cout = 64, s = 1, hw = 56;
  const sr = V.row(box); V.slider(sr, 'c_in', 32, 256, 32, cin, v => { cin = v; draw(); }); V.slider(sr, 'c_out', 32, 256, 32, cout, v => { cout = v; draw(); }); V.slider(sr, 'stride', 1, 2, 1, s, v => { s = v; draw(); });
  const svg = V.s('svg', { viewBox: '0 0 440 170', width: 440, style: { maxWidth: '100%', direction: 'ltr' } }); const rr = row(box); rr.appendChild(svg); const out = V.say(box);
  const nd = (x, y, t, c) => { V.s('rect', { x: x - 55, y: y - 16, width: 110, height: 32, rx: 7, style: { fill: c || 'var(--surface)', stroke: 'var(--c1)' } }, svg); V.s('text', { x, y: y + 4, 'text-anchor': 'middle', 'font-size': 11, style: { fill: 'var(--ink)' }, text: t }, svg); };
  function draw() { svg.innerHTML = ''; const proj = s !== 1 || cin !== cout; const ho = Math.floor((hw + 2 - 3) / s) + 1;
    [[60, 110, 170, 110], [230, 110, 300, 110], [300, 110, 380, 110]].forEach(([a, b, c, d]) => V.s('line', { x1: a, y1: b, x2: c, y2: d, style: { stroke: 'var(--line2)', strokeWidth: 2 } }, svg));
    V.s('path', { d: 'M60,94 C60,30 380,30 380,94', style: { fill: 'none', stroke: proj ? 'var(--c2)' : 'var(--c3)', strokeWidth: 2.5 } }, svg);
    nd(40, 110, 'x (' + cin + ', ' + hw + ')'); nd(170, 110, 'conv3 s' + s + ' → BN → ReLU'); nd(300, 110, 'conv3 → BN'); nd(400, 110, '+ → ReLU', 'var(--accent-bg)'); nd(220, 36, proj ? 'conv1×1 s' + s + ' + BN' : 'Identity', proj ? 'rgba(232,89,12,.12)' : 'rgba(47,158,68,.12)');
    out.innerHTML = 'פלט: <b class="ltr" style="display:inline-block">(' + cout + ', ' + ho + ', ' + ho + ')</b>. ' + (proj ? 'הצורה השתנתה, ולכן x לא יכול להתחבר כמו שהוא: קונבולוציה של 1 על 1 מתאימה ערוצים וגודל.' : 'אותה צורה: הדילוג פשוט מחזיר את x.'); }
  draw();
};

W.w2_resnet_stages = function (box) {
  V.say(box, 'ארבעת השלבים של ResNet-18: בכל שלב הגודל חצי והערוצים כפול. <b>שנה את גודל הקלט</b> ובדוק מה גודל המפה האחרונה.');
  let n = 224;
  V.slider(box, 'גודל קלט', 64, 640, 32, n, v => { n = v; draw(); });
  const svg = V.s('svg', { viewBox: '0 0 440 170', width: 440, style: { maxWidth: '100%', direction: 'ltr' } }); const rr = row(box); rr.appendChild(svg); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const st = [['input', n, 3], ['stem', Math.ceil(n / 4), 64], ['1', Math.ceil(n / 4), 64], ['2', Math.ceil(n / 8), 128], ['3', Math.ceil(n / 16), 256], ['4', Math.ceil(n / 32), 512]];
    st.forEach(([t, s, c], i) => { const x = 10 + i * 72, h = Math.max(6, s / n * 120), w = 14 + Math.log2(c) * 4; V.s('rect', { x, y: 130 - h, width: w, height: h, rx: 3, style: { fill: i ? 'var(--c1)' : 'var(--ink3)', opacity: 0.85 } }, svg); V.s('text', { x: x + w / 2, y: 146, 'text-anchor': 'middle', 'font-size': 10, style: { fill: 'var(--ink2)' }, text: t }, svg); V.s('text', { x: x + w / 2, y: 160, 'text-anchor': 'middle', 'font-size': 9, style: { fill: 'var(--ink3)' }, text: s + '×' + s + '×' + c }, svg); });
    out.innerHTML = 'המפה האחרונה: <b>' + Math.ceil(n / 32) + ' על ' + Math.ceil(n / 32) + '</b> עם 512 ערוצים, ואז כינוס ממוצע גלובלי לווקטור של 512 ושכבה מלאה. פסיעה כוללת של 32, כמו במזהים של מודול 4.'; }
  draw();
};

W.w2_depthwise = function (box) {
  V.say(box, 'קונבולוציה רגילה מול ערוץ־ערוץ (groups=dim). ברגילה כל גרעין רואה את כל הערוצים, בערוץ־ערוץ כל ערוץ מקבל גרעין משלו. <b>שנה את dim ואת k</b>.');
  let dim = 96, k = 7;
  const sr = V.row(box); V.slider(sr, 'dim', 8, 768, 8, dim, v => { dim = v; draw(); }); V.slider(sr, 'k', 1, 9, 2, k, v => { k = v; draw(); });
  const out = V.say(box);
  function draw() { const a = dim * dim * k * k, b = dim * k * k; out.innerHTML = 'רגילה: dim²·k² = <b>' + a.toLocaleString() + '</b> · ערוץ־ערוץ: dim·k² = <b>' + b.toLocaleString() + '</b> · פי <b>' + dim + '</b> פחות. ' + (dim === 96 && k === 7 ? 'זה בדיוק תרגיל 5.2: 451,584 מול 4,704.' : '') + ' את ערבוב הערוצים עושות אחר כך שתי שכבות של 1 על 1.'; }
  draw();
};

/* ===== chapter 6 ===== */
W.w2_patchify = function (box) {
  V.say(box, 'חותכים את התמונה לטלאים, וכל טלאי הוא "מילה". <b>שנה את גודל התמונה והטלאי</b>, ורחף על טלאי כדי לראות לאיזה מקום ברצף הוא הופך.');
  let n = 224, p = 16;
  const sr = V.row(box); V.slider(sr, 'תמונה', 32, 512, 32, n, v => { n = v; draw(); }); V.slider(sr, 'טלאי', 4, 32, 4, p, v => { p = v; draw(); });
  const svg = V.s('svg', { viewBox: '0 0 240 240', width: 240 }); const rr = row(box); rr.appendChild(svg); const out = V.say(box);
  function draw(hi) { svg.innerHTML = ''; const g = Math.floor(n / p), c = 240 / g; for (let i = 0; i < g; i++) for (let j = 0; j < g; j++) { const r = V.s('rect', { x: j * c, y: i * c, width: c - 0.6, height: c - 0.6, style: { fill: hi === i * g + j ? 'var(--c2)' : `hsl(${(i * 7 + j * 13) % 360},45%,${70 + ((i + j) % 2) * 8}%)` } }, svg); r.addEventListener('mouseenter', () => draw(i * g + j)); }
    out.innerHTML = '<b>' + g + ' על ' + g + ' = ' + g * g + '</b> טלאים, כל אחד וקטור של ' + p + '·' + p + '·3 = <b>' + p * p * 3 + '</b>. ועם CLS: ' + (g * g + 1) + ' מילים.' + (hi !== undefined ? ' הטלאי המודגש הוא מילה מספר <b>' + hi + '</b> (שורה ' + Math.floor(hi / g) + ', עמודה ' + hi % g + ').' : ''); }
  draw();
};

W.w2_attention = function (box) {
  V.say(box, 'חמש מילים, כל אחת עם שאילתה ומפתח. מטריצת הקשב softmax(QKᵀ/√d): שורה i היא כמה מילה i מקשיבה לכל מילה. <b>רחף על שורה</b>, וכבה את החלוקה ב־√d עם d גדול כדי לראות את תרגיל 6.3.');
  let d = 8, div = true, hov = 0;
  const sr = V.row(box); V.slider(sr, 'd', 2, 512, 2, d, v => { d = v; draw(); });
  V.tabs(box, ['עם חלוקה ב־√d', 'בלי חלוקה'], i => { div = i === 0; draw(); });
  const svg = V.s('svg', { viewBox: '0 0 260 200', width: 300, style: { maxWidth: '100%', direction: 'ltr' } }); const rr = row(box); rr.appendChild(svg); const out = V.say(box);
  const names = ['כלב', 'רץ', 'על', 'הדשא', 'הירוק'];
  function draw() { const r = NN.rng(11); const X = [...Array(5)].map(() => [...Array(d)].map(() => NN.randn(r))); const Wq = [...Array(d)].map(() => [...Array(d)].map(() => NN.randn(r) / Math.sqrt(d))), Wk = [...Array(d)].map(() => [...Array(d)].map(() => NN.randn(r) / Math.sqrt(d)));
    const mul = (A, B) => A.map(row => B[0].map((_, j) => row.reduce((s, a, k) => s + a * B[k][j], 0))); const Q = mul(X, Wq), K = mul(X, Wk);
    const A = Q.map(q => { const s = K.map(kv => q.reduce((t, a, i) => t + a * kv[i], 0) / (div ? Math.sqrt(d) : 1)); const m = Math.max(...s); const e = s.map(v => Math.exp(v - m)); const S = e.reduce((a, b) => a + b); return e.map(v => v / S); });
    svg.innerHTML = ''; A.forEach((rw, i) => { V.s('text', { x: 46, y: 46 + i * 30, 'text-anchor': 'end', 'font-size': 11, style: { fill: 'var(--ink2)' }, text: names[i] }, svg); rw.forEach((v, j) => { const c = V.s('rect', { x: 52 + j * 40, y: 30 + i * 30, width: 38, height: 28, rx: 4, style: { fill: `rgba(66,99,235,${0.08 + 0.9 * v})`, stroke: i === hov ? 'var(--c2)' : 'none', strokeWidth: 2 } }, svg); c.addEventListener('mouseenter', () => { hov = i; draw(); }); V.s('text', { x: 71 + j * 40, y: 48 + i * 30, 'text-anchor': 'middle', 'font-size': 10, style: { fill: v > 0.5 ? '#fff' : 'var(--ink)', pointerEvents: 'none' }, text: V.fmt(v, 2) }, svg); }); });
    names.forEach((t, j) => V.s('text', { x: 71 + j * 40, y: 22, 'text-anchor': 'middle', 'font-size': 11, style: { fill: 'var(--ink2)' }, text: t }, svg));
    const mx = A.map(rw => Math.max(...rw)); out.innerHTML = 'המשקל הגדול בכל שורה: <span class="ltr mono" style="display:inline-block">' + mx.map(v => V.fmt(v, 2)).join(', ') + '</span>. ' + (!div && d > 64 ? 'בלי החלוקה הציונים ענקיים, והסופטמקס בוחר כמעט מילה אחת. הגרדיאנט שם כמעט אפס.' : 'כל שורה סוכמת ל־1.'); }
  draw();
};

W.w2_position = function (box) {
  V.say(box, 'ערבב את סדר המילים. בלי וקטור מיקום, הפלט של הקשב פשוט מתערבב באותו אופן: השכבה לא יודעת מי איפה. הוסף מיקום, ועכשיו התוצאה באמת משתנה.');
  let pos = false, perm = [0, 1, 2, 3, 4];
  V.tabs(box, ['בלי מיקום', 'עם וקטור מיקום'], i => { pos = i === 1; draw(); });
  V.btns(box, [['ערבב את המילים', () => { perm = [4, 2, 0, 3, 1].map(i => perm[i]); draw(); }, 'primary'], ['סדר מקורי', () => { perm = [0, 1, 2, 3, 4]; draw(); }, 'ghost']]);
  const out = el('div'); box.appendChild(out); const say = V.say(box);
  const r = NN.rng(5), d = 4; const X = [...Array(5)].map(() => [...Array(d)].map(() => NN.randn(r))); const P = [...Array(5)].map(() => [...Array(d)].map(() => NN.randn(r)));
  const att = Z => Z.map(q => { const s = Z.map(k => q.reduce((t, a, i) => t + a * k[i], 0) / 2); const m = Math.max(...s); const e = s.map(v => Math.exp(v - m)); const S = e.reduce((a, b) => a + b); return Z[0].map((_, c) => e.reduce((t, w, j) => t + w / S * Z[j][c], 0)); });
  function draw() { const base = att(X.map((x, i) => pos ? x.map((v, c) => v + P[i][c]) : x)); const Xp = perm.map(i => X[i]); const o = att(Xp.map((x, i) => pos ? x.map((v, c) => v + P[i][c]) : x)); const same = o.every((rw, i) => rw.every((v, c) => Math.abs(v - base[perm[i]][c]) < 1e-9));
    out.innerHTML = '<table class="mini" style="margin:auto;direction:ltr"><tr><th>row</th><th>output[0] (shuffled input)</th><th>original output[perm]</th></tr>' + o.map((rw, i) => '<tr><td>' + i + ' ← ' + perm[i] + '</td><td>' + V.fmt(rw[0], 3) + '</td><td>' + V.fmt(base[perm[i]][0], 3) + '</td></tr>').join('') + '</table>';
    say.innerHTML = same ? '<b>אותם ערכים בדיוק</b>, רק בסדר אחר: np.allclose(out_p, out[perm]) = True.' : 'הערכים <b>שונים</b>: עם מיקום, אותה מילה במקום אחר נותנת פלט אחר. False.'; }
  draw();
};

W.w2_vit_flow = function (box) {
  V.say(box, 'המבנה המלא של ViT, שלב אחרי שלב, עם הצורות. בחר תמונה וטלאי ועבור על השלבים.');
  let n = 224, p = 16, dim = 768;
  const sr = V.row(box); V.slider(sr, 'תמונה', 32, 384, 32, n, v => { n = v; st.refresh(); }); V.slider(sr, 'טלאי', 4, 32, 4, p, v => { p = v; st.refresh(); });
  const code = mono(box, ''); const out = V.say(box);
  const steps = () => { const N = (n / p | 0) ** 2; return [['(1, 3, ' + n + ', ' + n + ')', 'התמונה.'], ['(1, ' + dim + ', ' + (n / p | 0) + ', ' + (n / p | 0) + ')', 'Conv2d(3, ' + dim + ', kernel=' + p + ', stride=' + p + '): חיתוך ושיכון בפעולה אחת.'], ['(1, ' + N + ', ' + dim + ')', 'flatten + transpose: רצף של ' + N + ' מילים.'], ['(1, ' + (N + 1) + ', ' + dim + ')', 'מוסיפים CLS בהתחלה, ועוד וקטור מיקום לכל מילה.'], ['(1, ' + (N + 1) + ', ' + dim + ')', '12 בלוקים: קשב + MLP, כל אחד עם דילוג. הצורה לא משתנה.'], ['(1, ' + dim + ')', 'לוקחים רק את CLS.'], ['(1, 1000)', 'ראש: שכבה מלאה למחלקות.']]; };
  const st = V.stepper(box, 7, i => { const s = steps()[i]; code.textContent = 'shape ' + s[0]; out.innerHTML = s[1]; }, { speed: 1400 });
};

W.w2_attn_cost = function (box) {
  V.say(box, 'כמה זוגות יש במטריצת הקשב לעומת כמה פיקסלים, כשמגדילים את הרזולוציה. <b>הזז את הרזולוציה</b> (טלאי 16).');
  let n = 224;
  V.slider(box, 'רזולוציה', 224, 1792, 224, n, v => { n = v; draw(); });
  const svg = V.s('svg', { viewBox: '0 0 420 150', width: 420, style: { maxWidth: '100%', direction: 'ltr' } }); const rr = row(box); rr.appendChild(svg); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const xs = [224, 448, 672, 896, 1120, 1344, 1568, 1792]; const mx = (1792 / 16) ** 4; const X = v => 30 + (v - 224) / (1792 - 224) * 380, Y = v => 140 - v / mx * 130;
    V.s('path', { d: 'M' + xs.map(v => X(v) + ',' + Y((v / 16) ** 4)).join(' L'), style: { fill: 'none', stroke: 'var(--c2)', strokeWidth: 2.5 } }, svg); V.s('path', { d: 'M' + xs.map(v => X(v) + ',' + Y((v / 16) ** 2 * (mx / (1792 / 16) ** 2) * 0.3)).join(' L'), style: { fill: 'none', stroke: 'var(--c1)', strokeWidth: 2.5 } }, svg);
    V.s('line', { x1: X(n), x2: X(n), y1: 10, y2: 140, style: { stroke: 'var(--ink3)', strokeDasharray: '3 3' } }, svg);
    const N = (n / 16) ** 2; out.innerHTML = N.toLocaleString() + ' מילים, <b>' + (N * N).toLocaleString() + '</b> זוגות בקשב (פי ' + Math.round(N * N / 38416) + ' מ־224). הקונבולוציה גדלה ביחס לפיקסלים (פי ' + Math.round((n / 224) ** 2) + '). כתום: קשב, כחול: קונבולוציה.'; }
  draw();
};
})();
