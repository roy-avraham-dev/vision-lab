/* Module 6 visuals — chapters 5–7: quantization, calibration, the real-time pipeline. */
(function () {
const W = window.W, V = window.V, el = V.el; const { f, ltr, mono, svgBox, txt, rng, randn } = window.BX; const { bar, pct, C, hbars } = window.AC;
const qsym = (x, bits) => { const qm = 2 ** (bits - 1) - 1; const m = Math.max(1e-12, ...x.map(Math.abs)); const s = m / qm; const q = x.map(v => Math.max(-qm, Math.min(qm, Math.round(v / s)))); return { s, q, xh: q.map(v => v * s) }; };
const qasym = (x, bits, lo, hi) => { const qm = 2 ** bits - 1; lo = Math.min(lo, 0); hi = Math.max(hi, 0); const s = Math.max(hi - lo, 1e-12) / qm, z = Math.round(-lo / s); const q = x.map(v => Math.max(0, Math.min(qm, Math.round(v / s) + z))); return { s, z, q, xh: q.map(v => (v - z) * s) }; };

/* 5.1 quantize a vector by hand */
W.w6_quant_vec = function (box) {
  V.say(box, 'q = clip(round(x / s) + z), ושחזור x̂ = s · (q − z). <b>ערוך את הוקטור, הביטים והשיטה</b>, או טען את הדוגמה של הסעיף ואת תרגיל 5.1.');
  let bits = 8, asym = false; const inp = el('input', { value: '0.31, -1.27, 0.5, 0.004', style: { width: '260px', direction: 'ltr' } }); box.appendChild(el('label', {}, 'x = ', inp)); inp.oninput = draw;
  const sr = V.row(box); V.slider(sr, 'ביטים', 2, 8, 1, bits, v => { bits = v; draw(); }); V.tabs(sr, ['סימטרי', 'לא סימטרי'], i => { asym = i === 1; draw(); });
  V.btns(box, [['הדוגמה של 5.1', () => { inp.value = '0.31, -1.27, 0.5, 0.004'; draw(); }], ['תרגיל 5.1', () => { inp.value = '0.8, -0.2, 2.54, 0.011'; draw(); }], ['תרגיל 5.2 (0 עד 3.32)', () => { inp.value = '0, 0.7, 1.9, 3.32'; draw(); }]]);
  const out = mono(box);
  function draw() { const x = inp.value.split(/[,\s]+/).map(Number).filter(v => !isNaN(v)); if (!x.length) return; const r = asym ? qasym(x, bits, Math.min(...x), Math.max(...x)) : qsym(x, bits); const err = x.map((v, i) => Math.abs(v - r.xh[i]));
    out.textContent = 'scale s = ' + f(r.s, 5) + (asym ? '   zero point z = ' + r.z : '   (z = 0)') + '\nq  = [' + r.q.join(', ') + ']\nx̂  = [' + r.xh.map(v => f(v, 4)).join(', ') + ']\nmax error = ' + f(Math.max(...err), 5) + '   (≤ s/2 = ' + f(r.s / 2, 5) + ')'; }
  draw();
};

/* 5.2 how big is the error */
W.w6_quant_error = function (box) {
  V.say(box, 'משקלות בהתפלגות דמוית־רשת. <b>שנה את מספר הביטים</b>: השגיאה המקסימלית היא חצי סקאלה, ושורש ממוצע הריבועים s/√12. מתחת: הדיוק של הרשת מהסעיף.');
  let bits = 8; V.slider(box, 'ביטים', 2, 8, 1, bits, v => { bits = v; draw(); }); const out = mono(box); const tb = el('div'); box.appendChild(tb);
  const acc = { 8: ['97.4%', '97.6%'], 6: ['97.6%', '97.4%'], 4: ['97.4%', '97.0%'], 3: ['93.9%', '96.9%'], 2: ['22.4%', '54.3%'] };
  function draw() { const r = rng(2); const w = [...Array(4096)].map(() => randn(r) * 0.12); const q = qsym(w, bits); const e = w.map((v, i) => v - q.xh[i]); const rms = Math.sqrt(e.reduce((a, b) => a + b * b, 0) / e.length);
    out.textContent = 'scale ' + f(q.s, 5) + '   max error ' + f(Math.max(...e.map(Math.abs)), 5) + ' (s/2 = ' + f(q.s / 2, 5) + ')\nRMS ' + f(rms, 5) + '   s/√12 = ' + f(q.s / Math.sqrt(12), 5) + '   levels: ' + (2 ** bits - 1);
    tb.innerHTML = acc[bits] ? 'בטבלת הסעיף, ' + bits + ' ביטים: סקאלה אחת למטריצה <b>' + acc[bits][0] + '</b>, סקאלה לכל עמודה <b>' + acc[bits][1] + '</b> (מקור 97.6%).' : 'בטבלת הסעיף אין שורה ל־' + bits + ' ביטים.'; }
  draw();
};

/* 5.3 per-channel scales */
W.w6_per_channel = function (box) {
  V.say(box, '16 עמודות משקלות, ובאחת מהן ערכים גדולים פי k. <b>הגדל את k</b> והשווה סקאלה אחת לכל המטריצה מול סקאלה לכל עמודה (בסעיף: פי 40 → 24.2% מול 0.6%).');
  let k = 40; V.slider(box, 'פי כמה העמודה החריגה', 1, 80, 1, k, v => { k = v; draw(); }); const svg = svgBox(box, 480, 140); const out = V.say(box);
  function draw() { const r = rng(5); const cols = [...Array(16)].map((_, j) => [...Array(64)].map(() => randn(r) * 0.1 * (j === 3 ? k : 1))); const rel = (a, b) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0) / a.reduce((s, v) => s + v * v, 0));
    const all = qsym(cols.flat(), 8); const per = cols.map(c => qsym(c, 8)); const normal = cols.map((c, j) => j); let eT = 0, eC = 0, n = 0; cols.forEach((c, j) => { if (j === 3) return; eT += rel(c, all.xh.slice(j * 64, j * 64 + 64)); eC += rel(c, per[j].xh); n++; });
    svg.innerHTML = ''; const MX = Math.max(...cols.map(c => Math.max(...c.map(Math.abs)))); cols.forEach((c, j) => { const m = Math.max(...c.map(Math.abs)); bar(svg, 20 + j * 28, 70 - Math.max(2, m / MX * 60), 20, Math.max(2, m / MX * 60), j === 3 ? 'var(--c2)' : 'var(--c1)'); bar(svg, 20 + j * 28, 80, 20, Math.min(50, Math.max(1, m / all.s / 127 * 50)), 'var(--c5, #e8a33d)'); }); txt(svg, [20, 136], 'למעלה: גודל כל עמודה. למטה (כתום): כמה מדרגות היא מקבלת מסקאלה אחת.', { fontSize: '10px' });
    out.innerHTML = 'שגיאה יחסית בעמודות הרגילות: סקאלה אחת <b>' + f(eT / n * 100, 1) + '%</b>, סקאלה לכל עמודה <b>' + f(eC / n * 100, 1) + '%</b>.'; }
  draw();
};

/* 5.4 half precision */
W.w6_fp16 = function (box) {
  V.say(box, 'חצי דיוק: 16 ביטים, בערך שלוש ספרות משמעותיות, ומקסימום 65,504. <b>הקלד ערך</b> וראה את הערך הקרוב ביותר שאפשר לשמור.');
  const inp = el('input', { type: 'number', value: 0.1, step: 'any', style: { width: '160px', direction: 'ltr' } }); box.appendChild(el('label', {}, 'x = ', inp)); inp.oninput = draw; const out = mono(box);
  V.btns(box, [['0.1', () => set(0.1)], ['3000.7', () => set(3000.7)], ['70000 (גלישה)', () => set(70000)], ['0.00001', () => set(0.00001)]]);
  function set(v) { inp.value = v; draw(); }
  function h(x) { if (!isFinite(x)) return x; const a = Math.abs(x); if (a >= 65520) return Math.sign(x) * Infinity; if (a < 2 ** -24 / 2) return 0; const e = Math.max(-14, Math.floor(Math.log2(a))); const step = 2 ** (e - 10); return Math.sign(x) * Math.round(a / step) * step; }
  function draw() { const x = +inp.value; const y = h(x); out.textContent = 'float32 ≈ ' + Math.fround(x) + '\nfloat16 = ' + y + '\nrelative error = ' + (isFinite(y) && x ? f(Math.abs(y - x) / Math.abs(x) * 100, 4) + '%' : y === Infinity || y === -Infinity ? 'overflow → inf (sums and products can overflow!)' : '—'); }
  draw();
};

/* 5.5 integer layer, accumulator */
W.w6_int_dot = function (box) {
  V.say(box, 'קרנל של שמונה ביטים: מכפלות של שלמים נצברות במספר שלם גדול, ורק בסוף מכפילים בסקאלות. <b>שנה את מספר הקלטים</b> (תרגיל 5.3: 64, ו־3·3·256).');
  let n = 64; V.slider(box, 'מכפלות בכל צבירה', 8, 4608, 8, n, v => { n = v; draw(); }); const out = mono(box); V.say(box, 'בסעיף, ערכי הצבר בפועל: מינוס 111,176 עד 103,547. שגיאה מקסימלית בפלט 0.023, ומשקלות קטנים פי ארבעה.');
  function draw() { const worst = n * 127 * 127; out.textContent = 'worst case |acc| = ' + n + ' × 127 × 127 = ' + worst.toLocaleString('en') + '\nint16 max 32,767     → ' + (worst > 32767 ? 'OVERFLOW' : 'ok') + '\nint32 max 2,147,483,647 → ' + (worst > 2147483647 ? 'OVERFLOW' : 'ok, margin ×' + f(2147483647 / worst, 0)); }
  draw();
};

/* 6.1 calibration */
W.w6_calib = function (box) {
  V.say(box, 'היסטוגרמה של קלט שכבה על סט הכיול. <b>הוסף פיקסלים "שרופים"</b> (פי 8 מהמקסימום), ובחר מינימום־מקסימום או אחוזון.');
  let burnt = true, pc = 99.9, bits = 4; const sr = V.row(box); V.tabs(sr, ['סט נקי', 'עם פיקסלים שרופים'], i => { burnt = i === 1; draw(); }, 1); V.slider(sr, 'אחוזון (100 = מינימום־מקסימום)', 90, 100, 0.01, pc, v => { pc = v; draw(); }); V.slider(sr, 'ביטים להפעלות', 2, 8, 1, bits, v => { bits = v; draw(); });
  const svg = svgBox(box, 480, 150); const out = V.say(box);
  function draw() { const r = rng(9); const a = [...Array(6400)].map(() => Math.max(0, Math.min(1, r() ** 1.5))); if (burnt) for (let i = 0; i < 4; i++) a.push(8); const hi = pc >= 100 ? Math.max(...a) : pct(a, pc); const q = qasym([0], bits, 0, hi);
    svg.innerHTML = ''; const H = new Array(60).fill(0), mx = Math.max(1.2, hi * 1.05); a.forEach(v => { if (v <= mx) H[Math.min(59, Math.floor(v / mx * 60))]++; }); const hm = Math.max(...H); H.forEach((c, i) => bar(svg, 20 + i * 7.3, 120 - Math.sqrt(c / hm) * 100, 6, Math.sqrt(c / hm) * 100, 'var(--c1)'));
    const levels = 2 ** bits - 1; for (let l = 0; l <= Math.min(levels, 60); l++) { const x = 20 + l * q.s / mx * 438; if (x < 460) V.s('line', { x1: x, y1: 125, x2: x, y2: 135, style: { stroke: 'var(--c2)' } }, svg); } V.s('line', { x1: 20 + hi / mx * 438, y1: 10, x2: 20 + hi / mx * 438, y2: 135, style: { stroke: 'var(--c2)', strokeDasharray: '4 3' } }, svg);
    const inRange = a.filter(v => v <= 1).length; out.innerHTML = 'טווח עד ' + ltr(f(hi, 3)) + ', סקאלה ' + ltr(f(q.s, 4)) + '. מדרגות (אדום) שנופלות בתוך הנתונים הרגילים (0 עד 1): <b>' + Math.min(levels, Math.floor(1 / q.s) + 1) + '</b> מתוך ' + (levels + 1) + '. ' + (burnt && pc >= 100 ? 'ארבעה פיקסלים (ב־8) בזבזו את רוב הטווח.' : burnt ? 'ארבעת הפיקסלים השרופים מחוץ לטווח: ייחתכו.' : ''); void inRange; }
  draw();
};

/* 6.2 straight-through estimator */
W.w6_ste = function (box) {
  V.say(box, 'העיגול הוא מדרגות: הנגזרת שלו אפס כמעט בכל מקום, ושיפוע שעובר דרכו נעלם (תרגיל 6.2). אומדן המעבר הישר מעביר את השיפוע כאילו זו פונקציית הזהות. <b>בחר מה להציג</b>.');
  let mode = 0; V.tabs(box, ['העיגול', 'הנגזרת האמיתית', 'אומדן המעבר הישר'], i => { mode = i; draw(); }); const P = window.IM.plot(box, { w: 440, h: 190 }); const out = V.say(box);
  function draw() { const X = [...Array(401)].map((_, i) => -2 + i / 100); let s; if (mode === 0) s = [{ pts: X.map(x => [x, Math.round(x * 2) / 2]), color: 'var(--c1)', width: 2.5 }, { pts: X.map(x => [x, x]), color: '#adb5bd', dash: '4 3' }]; else if (mode === 1) s = [{ pts: X.map(x => [x, 0]), color: 'var(--c2)', width: 3 }]; else s = [{ pts: X.map(x => [x, 1]), color: 'var(--c3)', width: 3 }];
    P.draw(s, [-2, 2], [-2.2, 2.2]); out.innerHTML = ['קדימה משתמשים בערך המעוגל (כימום מדומה).', 'אפס בכל מקום: אף משקל לא היה מתעדכן.', 'אחורה מעבירים את השיפוע כמו שהוא, ומעדכנים את המשקלות המקוריים בדיוק מלא. בסעיף: בשני ביטים 54.3% → 95.9%, בשלושה 96.9% → 98.0%.'][mode]; }
  draw();
};

/* 6.3 is int8 really faster */
W.w6_int8_speed = function (box) {
  V.say(box, 'הטבלה של הסעיף, ומודל פשוט שמסביר אותה: שמונה ביטים חוסכים חלק מהחישוב, אבל מוסיפים מחיר קבוע (כימום והחזרה בקצוות, שינויי סידור). <b>הזז את גודל העבודה</b>.');
  const D = [['16–256', 4.2, 4.9], ['32–512', 15.1, 11.0], ['64–1024', 52.3, 28.7]]; let w = 15; V.slider(box, 'זמן בדיוק מלא (מילישניות)', 0.5, 60, 0.5, w, v => { w = v; draw(); });
  const P = window.IM.plot(box, { w: 440, h: 180 }); const out = V.say(box);
  function draw() { const int8 = x => 1.9 + 0.51 * x; const X = [...Array(61)].map((_, i) => i); P.draw([{ pts: X.map(x => [x, x]), color: 'var(--c1)', width: 2 }, { pts: X.map(x => [x, int8(x)]), color: 'var(--c2)', width: 2 }, { pts: D.map(d => [d[1], d[2]]), color: 'var(--c2)', width: 0, dots: true }, { vline: w, color: 'var(--ink3)', dash: '3 3' }], [0, 60], [0, 60]);
    out.innerHTML = 'כחול: דיוק מלא. אדום: שמונה ביטים (נקודות: הטבלה). ב־' + ltr(f(w, 1)) + ' מילישניות: שמונה ביטים ' + ltr(f(int8(w), 1)) + ' — ' + (int8(w) > w ? '<b>איטי יותר</b>.' : 'מהיר פי <b>' + f(w / int8(w), 2) + '</b>.') + ' נקודת השוויון בערך ב־4 מילישניות.'; }
  draw();
};

/* the queue simulator, shared by 7.1 and 7.2 */
function simulate(o) { const fps = o.fps, T = o.T || 6, s = o.stages; const cap = []; for (let k = 0; k < fps * T; k++) cap.push(k * 1000 / fps); const done = [], lat = []; let dropped = 0;
  if (o.mode === 'loop') { let t = 0; cap.forEach(c => { t = Math.max(t, c) + s.reduce((a, b) => a + b, 0); done.push(t); lat.push(t - c); }); }
  else { let avail = cap.map((c, k) => ({ k, t: c })); for (let i = 0; i < s.length; i++) { const out = []; let free = 0, last = -1;
      if (o.mode === 'unbounded' || i === 0) { avail.forEach(a => { free = Math.max(free, a.t) + s[i]; out.push({ k: a.k, t: free }); }); }
      else { let j = 0; while (j < avail.length) { let pick = j; for (let m = j; m < avail.length && avail[m].t <= free; m++) pick = m; if (avail[pick].t > free) free = avail[pick].t; dropped += pick - j; free += s[i]; out.push({ k: avail[pick].k, t: free }); j = pick + 1; last = pick; } }
      avail = out; void last; }
    avail.forEach(a => { done.push(a.t); lat.push(a.t - cap[a.k]); }); }
  const span = (Math.max(...done) - cap[0]) / 1000; return { thr: done.length / span, med: pct(lat, 50), max: Math.max(...lat), dropped, lat, n: done.length }; }
window.AC.simulate = simulate;

/* 7.1 what is broken in a simple loop (replaces the pipeline diagram) */
W.w6_loop_vs_threads = function (box) {
  V.say(box, 'ציר זמן של 12 פריימים מהמצלמה (30 בשנייה) ושלושה שלבים של 5, 40 ו־5 מילישניות. <b>החלף מבנה</b>: בלולאה אחת כל פריים מחכה לכולם; בצינור, שלבים עובדים במקביל ותור של החדש זורק פריימים ישנים.');
  let mode = 0; V.tabs(box, ['לולאה אחת', 'תהליכונים, תורים ללא גבול', 'תהליכונים, תור של החדש בלבד'], i => { mode = i; draw(); }); const svg = svgBox(box, 480, 230); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const s = [5, 40, 5], fps = 30, N = 12, sc = 480 / 700; const cap = [...Array(N)].map((_, k) => k * 1000 / fps);
    cap.forEach((c, k) => { V.s('circle', { cx: 10 + c * sc, cy: 14, r: 4, style: { fill: 'var(--ink3)' } }, svg); });
    txt(svg, [10, 34], 'מצלמה', { fontSize: '10px' }); const rows = mode === 0 ? [0] : [0, 1, 2]; let jobs = [];
    if (mode === 0) { let t = 0; cap.forEach((c, k) => { const st = Math.max(t, c); s.forEach((d, i) => { jobs.push([0, k, st + s.slice(0, i).reduce((a, b) => a + b, 0), d, i]); }); t = st + 50; }); }
    else { let avail = cap.map((c, k) => ({ k, t: c })); s.forEach((d, i) => { let free = 0; const out2 = []; if (mode === 1 || i === 0) avail.forEach(a => { const st = Math.max(free, a.t); jobs.push([i, a.k, st, d, i]); free = st + d; out2.push({ k: a.k, t: free }); });
        else { let j = 0; while (j < avail.length) { let pick = j; for (let m = j; m < avail.length && avail[m].t <= free; m++) pick = m; const st = Math.max(free, avail[pick].t); jobs.push([i, avail[pick].k, st, d, i]); free = st + d; out2.push({ k: avail[pick].k, t: free }); j = pick + 1; } } avail = out2; }); }
    rows.forEach(r => txt(svg, [10, 70 + r * 50], ['שלב 1 · 5', 'שלב 2 · 40', 'שלב 3 · 5'][r] + (mode === 0 ? '' : ''), { fontSize: '10px' }));
    jobs.forEach(([r, k, st, d, i]) => { if (st * sc > 470) return; bar(svg, 10 + st * sc, 76 + r * 50, Math.max(2, d * sc - 1), 18, ['var(--c5, #e8a33d)', 'var(--c1)', 'var(--c3)'][i]); if (d >= 40) txt(svg, [12 + st * sc, 89 + r * 50], '#' + (k + 1), { fill: '#fff', fontSize: '10px' }); });
    const r = simulate({ mode: ['loop', 'unbounded', 'latest'][mode], fps: 30, stages: s }); out.innerHTML = 'בשש שניות: תפוקה <b>' + f(r.thr, 1) + '</b>, השהייה חציונית <b>' + f(r.med, 0) + '</b> ומקסימלית ' + f(r.max, 0) + ' מילישניות, נזרקו ' + r.dropped + '.'; }
  draw();
};

/* 7.2 the latest-only queue — the full experiment */
W.w6_queue_sim = function (box) {
  V.say(box, 'הניסוי של הסעיף: מצלמה, שלושה שלבים, שש שניות. <b>שנה את הקצבים ואת זמן ההסקה</b> (תרגיל 7.4: 60 ו־30) והשווה את שלושת המבנים.');
  const o = { fps: 30, s1: 5, s2: 40, s3: 5 }; const sr = V.row(box); V.slider(sr, 'קצב מצלמה', 10, 60, 1, o.fps, v => { o.fps = v; draw(); }); V.slider(sr, 'שלב 1', 1, 30, 1, o.s1, v => { o.s1 = v; draw(); }); V.slider(sr, 'הסקה', 5, 80, 1, o.s2, v => { o.s2 = v; draw(); }); V.slider(sr, 'שלב 3', 1, 30, 1, o.s3, v => { o.s3 = v; draw(); });
  const out = mono(box); V.say(box, 'בסעיף (30 לשנייה, 5/40/5): לולאה 19.8 · 1,578 · 3,103 · 0 | ללא גבול 24.7 · 662 · 1,275 · 0 | החדש בלבד 24.6 · 67 · 84 · 32.');
  function draw() { const st = [o.s1, o.s2, o.s3]; const rows = [['single loop', 'loop'], ['threads, unbounded', 'unbounded'], ['threads, latest only', 'latest']].map(([n, m]) => { const r = simulate({ mode: m, fps: o.fps, stages: st }); return n.padEnd(22) + f(r.thr, 1).padStart(6) + f(r.med, 0).padStart(9) + f(r.max, 0).padStart(9) + String(r.dropped).padStart(9); });
    out.textContent = 'structure'.padEnd(22) + '   fps   median      max  dropped\n' + rows.join('\n'); }
  draw();
};

/* 7.3 file vs camera */
W.w6_file_vs_cam = function (box) {
  V.say(box, 'מקור הפריימים קובע את סוג התור. <b>בחר מקור</b>.');
  const out = V.say(box); const tb = el('div'); box.appendChild(tb);
  V.tabs(box, ['מצלמה', 'קובץ וידאו'], i => { out.innerHTML = i ? '<b>קובץ מחכה.</b> אין סיבה לזרוק: תור רגיל בגודל 2 עד 4 שחוסם כשהוא מלא. המפענח עובד מעט קדימה, ואף פריים לא נופל.' : '<b>מצלמה לא מחכה.</b> תור בגודל אחד ששומר את החדש וזורק את הישן, וסופרים כמה נזרקו.'; });
  out.innerHTML = 'בחר מקור.'; window.AC.hbars(tb, [['לולאה אחת, תהליכון מודל 1', 33.7], ['פענוח בתהליכון נפרד, 1', 39.6], ['לולאה אחת, 2 תהליכוני מודל', 48.3], ['פענוח בתהליכון נפרד, 2', 51.0]], { lw: 200, fmt: v => f(v, 1) + ' fps' });
};
})();
