/* Module 6 visuals — chapters 8–11: profiling, preprocessing and copies, C++, the project. */
(function () {
const W = window.W, V = window.V, el = V.el; const { f, ltr, mono, svgBox, txt } = window.BX; const { bar, C, hbars } = window.AC;

/* 8.1 a clock per stage, and Amdahl */
W.w6_amdahl = function (box) {
  V.say(box, 'החציונים של הסעיף לכל שלב. <b>האץ את המודל</b> (תרגיל 8.1) או שלב אחר, וראה כמה הצינור כולו מואץ.');
  const S = [['פענוח', 2.99], ['עיבוד מקדים', 2.75], ['הסקה', 14.35], ['עיבוד מאוחר', 0.05]]; const k = [1, 1, 1, 1]; const sr = V.row(box); S.forEach(([n], i) => V.slider(sr, 'האצת ' + n, 1, 20, 0.5, 1, v => { k[i] = v; draw(); }, x => '×' + x));
  const svg = svgBox(box, 480, 80); const out = V.say(box);
  function draw() { const t0 = S.reduce((a, s) => a + s[1], 0), t = S.reduce((a, s, i) => a + s[1] / k[i], 0); svg.innerHTML = ''; const sc = 440 / t0; let x = 20; S.forEach(([n, v], i) => { const w = v / k[i] * sc; bar(svg, x, 15, w, 28, C[i]); if (w > 40) txt(svg, [x + 4, 33], n, { fill: '#fff', fontSize: '11px' }); x += w; }); txt(svg, [20, 66], 'לפני: ' + f(t0, 1) + ' מילישניות. אחרי: ' + f(t, 1) + '.', { fontSize: '11px' });
    out.innerHTML = 'קצב: ' + ltr(f(1000 / t0, 1) + ' → ' + f(1000 / t, 1)) + ' פריימים בשנייה, פי <b>' + f(t0 / t, 2) + '</b>. התקרה כשהמודל לא עולה כלום: פי ' + f(t0 / (t0 - S[2][1]), 1) + '. החלק שלא האצתם קובע את התקרה.'; }
  draw();
};

/* 8.2 the asynchronous GPU clock */
W.w6_async_clock = function (box) {
  V.say(box, 'פקודה לכרטיס חוזרת מיד. שעון בלי סנכרון מודד רק את השליחה, והזמן "קופץ" לשלב הבא (תרגיל 8.2: 0.3 ו־25). <b>הדלק סנכרון</b>.');
  let sync = false; V.tabs(box, ['בלי סנכרון', 'עם סנכרון'], i => { sync = i === 1; draw(); }); const svg = svgBox(box, 480, 130); const out = mono(box);
  function draw() { svg.innerHTML = ''; const sc = 16; const gpu = 24.7, launch = 0.3, post = 0.3; txt(svg, [10, 22], 'מעבד', { fontSize: '11px' }); txt(svg, [10, 72], 'כרטיס', { fontSize: '11px' });
    bar(svg, 60, 30, launch * sc + 2, 20, 'var(--c1)'); bar(svg, 60 + launch * sc, 80, gpu * sc * 0.65, 20, 'var(--c1)'); const wEnd = 60 + (launch + gpu * 0.65) * sc;
    const m1 = sync ? [60, wEnd] : [60, 60 + launch * sc + 2]; V.s('line', { x1: m1[0], y1: 115, x2: m1[1], y2: 115, style: { stroke: 'var(--c3)', strokeWidth: 3 } }, svg); txt(svg, [m1[0], 126], 'שעון "מודל"', { fill: 'var(--c3)', fontSize: '10px' });
    bar(svg, sync ? wEnd : 60 + launch * sc + 2, 30, sync ? post * sc : (wEnd - 60 - launch * sc) + post * sc, 20, 'var(--c2)'); txt(svg, [sync ? wEnd + 6 : 140, 45], 'עיבוד מאוחר' + (sync ? '' : ' מחכה לתוצאה'), { fill: sync ? 'var(--ink2)' : '#fff', fontSize: '10px' });
    out.textContent = sync ? 'model 25.0 ms   post 0.3 ms   (torch.cuda.synchronize() before stopping the clock)' : 'model  0.3 ms   post 25.0 ms   ← the GPU time was billed to the next stage'; }
  draw();
};

/* 9.1 preprocessing order */
W.w6_preproc_order = function (box) {
  V.say(box, 'כמה בתים עוברים בכל שלב של העיבוד המקדים. <b>בחר רזולוציה וסדר</b> (תרגילים 9.1 ו־9.2). למטה: הזמנים מהסעיף.');
  let Wd = 1920, Hd = 1080, first = 0; V.tabs(box, ['1080', '4K'], i => { [Wd, Hd] = i ? [3840, 2160] : [1920, 1080]; draw(); }); V.tabs(box, ['מקטינים ואז עשרוני', 'עשרוני ואז מקטינים'], i => { first = i; draw(); });
  const out = mono(box); const tb = el('div'); box.appendChild(tb);
  hbars(tb, [['ריפוד בלבד, 8 ביט', 0.42], ['ריפוד ואז נרמול ב־NumPy', 3.49], ['נרמול קודם ואז הקטנה', 8.37], ['ריפוד ופונקציה אחת של OpenCV', 1.89], ['בלי העתקה לזיכרון רציף', 2.35]], { lw: 210, fmt: v => f(v, 2) + ' ms' });
  function draw() { const raw = Wd * Hd * 3, small = 640 * 640 * 3; const steps = first ? [['frame uint8', raw], ['→ float32 (full size)', raw * 4], ['resize reads', raw * 4], ['→ 640x640 float32', small * 4]] : [['frame uint8', raw], ['resize reads', raw], ['→ 640x640 uint8', small], ['→ float32', small * 4]];
    out.textContent = steps.map(([n, b]) => n.padEnd(24) + f(b / 1e6, 1).padStart(7) + ' MB').join('\n') + '\nat 30 fps the camera alone: ' + f(raw * 30 / 1e6, 0) + ' MB/s' + (first ? ', in float32 before resize: ' + f(raw * 120 / 1e9, 1) + ' GB/s' : ''); }
  draw();
};

/* 9.2 video decoding budget */
W.w6_decode = function (box) {
  V.say(box, 'פענוח על המעבד לקח כאן בערך 3 מילישניות לפריים 1080, ופי ארבעה ב־4K. <b>בחר רזולוציה, קצב ומעבד</b>, וראה כמה מתקציב הפריים נשאר.');
  let res = 1, fps = 30, slow = 1, hw = false; const sr = V.row(box); V.slider(sr, 'קצב', 10, 60, 5, fps, v => { fps = v; draw(); }); V.slider(sr, 'מעבד קצה איטי פי', 1, 6, 0.5, slow, v => { slow = v; draw(); }); V.tabs(box, ['720', '1080', '4K'], i => { res = i; draw(); }, 1); V.tabs(box, ['פענוח במעבד', 'מפענח בחומרה (GStreamer)'], i => { hw = i === 1; draw(); });
  const svg = svgBox(box, 480, 60); const out = V.say(box);
  function draw() { const d = hw ? 0.3 : [1.35, 3, 12][res] * slow; const budget = 1000 / fps; svg.innerHTML = ''; bar(svg, 20, 15, 440, 28, 'var(--line2)'); bar(svg, 20, 15, Math.min(440, d / budget * 440), 28, d > budget ? 'var(--c2)' : 'var(--c5, #e8a33d)');
    out.innerHTML = 'פענוח ' + ltr(f(d, 1)) + ' מתוך ' + ltr(f(budget, 1)) + ' מילישניות לפריים: <b>' + f(d / budget * 100, 0) + '%</b>' + (d > budget ? ' — הפענוח לבדו לא עומד בקצב.' : '.') + (hw ? ' המעבד כמעט פנוי.' : ''); }
  draw();
};

/* 9.3 copies to the GPU */
W.w6_transfer = function (box) {
  V.say(box, 'כמה זמן לוקחת ההעתקה לכרטיס. <b>שנה את רוחב הפס, סוג הנתונים וזיכרון נעול</b>. ולמטה: מערך שאינו רציף.');
  let bw = 8, u8 = false, pin = false; const sr = V.row(box); V.slider(sr, 'רוחב פס (GB/s)', 1, 25, 0.5, bw, v => { bw = v; draw(); }); V.tabs(box, ['טנזור עשרוני 4.9 MB', 'ריפוד 8 ביט 1.2 MB'], i => { u8 = i === 1; draw(); }); V.tabs(box, ['זיכרון רגיל', 'זיכרון נעול (pinned)'], i => { pin = i === 1; draw(); });
  const out = mono(box); const out2 = mono(box);
  function draw() { const b = u8 ? 1.2288e6 : 4.9152e6; const t = b / (bw * 1e9 * (pin ? 1 : 0.55)) * 1000; out.textContent = 'copy ' + f(b / 1e6, 2) + ' MB at ' + f(bw * (pin ? 1 : 0.55), 1) + ' GB/s effective = ' + f(t, 3) + ' ms per frame' + (pin ? '  (and it can overlap with compute)' : '');
    out2.textContent = "a = img[:, ::-1]      # a view, reversed\na.flags['C_CONTIGUOUS'] → False\ncopying raw bytes from a's address → pixels in the wrong order, no error\nfix: a = np.ascontiguousarray(a)"; }
  draw();
};

/* 10.1 Java vs C++ */
W.w6_java_cpp = function (box) {
  V.say(box, 'אותו רעיון בשתי השפות. <b>בחר נושא</b>.');
  const T = [['שחרור זיכרון', 'Buffer b = new Buffer(n);\n// freed by the GC, some day', '{\n  DeviceBuffer b(n);   // constructor allocates\n}                      // destructor frees, right here (RAII)'], ['אובייקטים', 'Box b = new Box();   // always a reference', 'Box b;          // on the stack\nBox& r = b;     // reference\nBox* p = &b;    // pointer'], ['העברה לפונקציה', 'void f(List<Box> boxes)  // a reference', 'void f(std::vector<Box> v)         // a COPY\nvoid f(const std::vector<Box>& v)  // no copy, read-only'], ['רשימה דינמית', 'ArrayList<Integer> a;  // boxed objects', 'std::vector<int8_t> a;  // contiguous raw bytes'], ['הידור', 'javac → bytecode → JIT at run time', 'g++ -O3 -march=native → machine code for THIS CPU']];
  const out = el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' } }); box.appendChild(out);
  V.tabs(box, T.map(t => t[0]), i => show(i)); function show(i) { out.innerHTML = ''; [['Java', T[i][1]], ['C++', T[i][2]]].forEach(([n, c]) => { const d = el('div'); d.appendChild(el('b', {}, n)); const m = mono(d, c); m.style.marginTop = '4px'; out.appendChild(d); }); } show(0);
};

/* 10.2 why the float loop did not vectorize */
W.w6_assoc = function (box) {
  V.say(box, 'חיבור של מספרים עשרוניים לא קיבוצי: סדר אחר נותן תוצאה אחרת בספרות האחרונות, ולכן המהדר לא רשאי לפצל את הסכום (תרגיל 10.2). <b>שנה את מספר הסכומים החלקיים</b>.');
  let k = 1; V.slider(box, 'סכומים חלקיים במקביל', 1, 16, 1, k, v => { k = v; draw(); }); const out = mono(box); V.say(box, 'בסעיף: מכפלה מדויקת 3,034 → 2,905 מיקרושניות עם ‎-O3‎, שמונה ביטים 435 → 212. בתרגיל 10.4: עם ‎-ffast-math‎ העשרוני ירד ל־524.');
  const xs = [...Array(100000)].map((_, i) => Math.fround(Math.sin(i * 12.9898) * 437.5453 % 1)), ys = xs.map((x, i) => Math.fround(Math.cos(i * 4.1414) * 0.5));
  function draw() { const part = new Array(k).fill(0); xs.forEach((x, i) => { part[i % k] = Math.fround(part[i % k] + Math.fround(x * ys[i])); }); const s = part.reduce((a, b) => Math.fround(a + b), 0); let ex = 0; xs.forEach((x, i) => ex += x * ys[i]);
    let iq = 0; xs.forEach((x, i) => iq += Math.round(x * 127) * Math.round(ys[i] * 127)); out.textContent = 'float32, ' + k + ' partial sum' + (k > 1 ? 's' : '') + ':  ' + s.toPrecision(9) + '\nexact (float64):        ' + ex.toPrecision(9) + '\nint32 with any order:   ' + iq + '  (integer addition is associative → free to split)'; }
  draw();
};

/* 10.3 RAII and copies */
W.w6_raii = function (box) {
  V.say(box, 'DeviceBuffer מקצה בבנאי ומשחרר במפרק. <b>עבור על התוכנית</b>, ונסה את הגרסה שמאפשרת העתקה (תרגיל 10.3).');
  let allowCopy = false; V.tabs(box, ['העתקה אסורה (= delete)', 'העתקה ברירת מחדל'], i => { allowCopy = i === 1; st.go(0); }); const out = mono(box); const say = V.say(box);
  const st = V.stepper(box, 5, s => { const code = ['{', '  DeviceBuffer a(1 << 20);', '  DeviceBuffer b = a;', '  run(a);', '}']; out.textContent = code.map((l, i) => (i === s ? '▶ ' : '  ') + l).join('\n');
    say.innerHTML = [ 'נכנסים לתחום.', 'הבנאי קורא ל־cudaMalloc: a מחזיק מצביע ל־1 מגה בייט בכרטיס.', allowCopy ? 'העתקה של המצביע בלבד: a ו־b מצביעים על <b>אותו</b> זיכרון.' : '<b>שגיאת הידור</b>: העתקה מחוקה. אפשר רק להעביר בעלות (std::move).', 'משתמשים בזיכרון.', allowCopy ? 'יציאה מהתחום: המפרק של b משחרר, ואז המפרק של a משחרר <b>שוב</b> — שחרור כפול, קריסה.' : 'יציאה מהתחום: המפרק משחרר פעם אחת. גם אם נזרקה חריגה. שעות על רחפן בלי דליפה.'][s]; });
};

/* 11.1 deliverables */
W.w6_deliverables = function (box) {
  V.say(box, 'ארבעת התוצרים של הפרויקט. <b>סמן מה הגשת</b>; נשמר בדפדפן.');
  const items = ['צינור שרץ על סרטון רחפן: פענוח, עיבוד מקדים, מזהה מואץ, עוקב, ציור — בתהליכונים עם תורים (פרק 7).', 'שלושה מנועים: דיוק מלא, חצי דיוק ושמונה ביטים, מאותו קובץ ONNX.', 'טבלת השוואה לפי התבנית בסעיף 11.3, עם שורת חומרה מדויקת מעליה.', 'פסקה אחת שמסבירה איפה הצוואר עכשיו, אחרי ההאצה.'];
  const S = window.Store.map('notes'), key = 'm6_deliver'; let d = {}; try { d = JSON.parse(S[key] || '{}'); } catch (e) { d = {}; } const out = V.say(box);
  items.forEach((t, i) => { const cb = el('input', { type: 'checkbox' }); cb.checked = !!d[i]; cb.onchange = () => { d[i] = cb.checked; S[key] = JSON.stringify(d); window.Store.save(); upd(); }; box.insertBefore(el('label', { style: { display: 'flex', gap: '8px', margin: '6px 0' } }, cb, el('span', {}, (i + 1) + '. ' + t)), out); });
  function upd() { out.innerHTML = Object.values(d).filter(Boolean).length + ' מתוך 4.'; } upd();
};

/* 11.2 the plan, in stages */
W.w6_plan6 = function (box) {
  V.say(box, 'תוכנית העבודה כרשימת שלבים לפי סדר. <b>סמן מה עשית</b>; נשמר בדפדפן.');
  const rows = [['קו בסיס', 'ייצוא לפורמט פתוח, אימות, מדידת שלבים עם השעון מפרק 8', 'הפלט זהה למקור בסובלנות; טבלת שלבים ראשונה'], ['חצי דיוק', 'מנוע חצי דיוק, מדידת מהירות ומדד דיוק ממודול 4', 'ירידה של פחות מנקודה אחת במדד'], ['שמונה ביטים', 'סט כיול של מאות פריימים מהשטח, מנוע מכויל, ואם צריך — שכבות רגישות בחצי דיוק', 'האובדן מוגדר מראש ונמדד'], ['צינור', 'תהליכונים, תורים, עוקב, מעקב פריימים שנזרקו', 'אחוזון 95 של השהייה מקצה לקצה מתחת ליעד'], ['דו״ח', 'הטבלה, גרף השהייה לאורך הזמן, ורשימת מגבלות כנה', 'אדם אחר משחזר את המספרים מההוראות שלכם']];
  const S = window.Store.map('notes'), key = 'm6_plan'; let d = {}; try { d = JSON.parse(S[key] || '{}'); } catch (e) { d = {}; } const out = V.say(box);
  rows.forEach(([g, p, c], i) => { const cb = el('input', { type: 'checkbox' }); cb.checked = !!d[i]; cb.onchange = () => { d[i] = cb.checked; S[key] = JSON.stringify(d); window.Store.save(); upd(); }; box.insertBefore(el('label', { style: { display: 'block', margin: '6px 0', padding: '8px', border: '1px solid var(--line)', borderRadius: '8px' } }, cb, el('b', {}, ' ' + (i + 1) + '. ' + g), el('div', { class: 'note-small' }, 'תוצר: ' + p), el('div', { class: 'note-small' }, 'בדיקת הצלחה: ' + c)), out); });
  function upd() { out.innerHTML = Object.values(d).filter(Boolean).length + ' מתוך 5 שלבים. שלב רשות: להריץ את המנוע מתוך C++ (פרק 10).'; } upd();
};

/* 11.3 the comparison table */
W.w6_report6 = function (box) {
  V.say(box, 'תבנית הטבלה. <b>מלא שורת חומרה ומספרים</b>; נשמר בדפדפן, ואפשר להעתיק כ־Markdown.');
  const rows = ['הסקה בלבד: חציון ואחוזון 95 (מילישניות)', 'מקצה לקצה: פריימים בשנייה', 'מקצה לקצה: אחוזון 95 של השהייה', 'פריימים שנזרקו מכל מאה', 'זיכרון (כרטיס ותהליך)', 'גודל קובץ המנוע וזמן הבנייה', 'מדד זיהוי ממודול 4', 'החלפות זהות ומדד יציבות הזהות ממודול 5']; const cols = ['דיוק מלא', 'חצי דיוק', 'שמונה ביטים'];
  const S = window.Store.map('notes'), key = 'm6_report'; let d = {}; try { d = JSON.parse(S[key] || '{}'); } catch (e) { d = {}; } const save = () => { S[key] = JSON.stringify(d); window.Store.save(); };
  const hw = el('input', { value: d.hw || '', placeholder: 'חומרה, מצב הספק, גרסאות, רזולוציה, אצווה, סרטון', style: { width: '100%' } }); hw.oninput = () => { d.hw = hw.value; save(); }; box.appendChild(hw);
  const t = el('table', { class: 'mini', style: { margin: '8px auto' } }); t.appendChild(el('tr', {}, el('th', {}, 'מדד'), ...cols.map(c => el('th', {}, c)))); box.appendChild(t);
  rows.forEach((r, i) => t.appendChild(el('tr', {}, el('td', {}, r), ...cols.map((_, j) => { const inp = el('input', { value: d[i + '_' + j] || '', style: { width: '74px', direction: 'ltr' } }); inp.oninput = () => { d[i + '_' + j] = inp.value; save(); }; return el('td', {}, inp); }))));
  const out = V.say(box); V.btns(box, [['העתק כ־Markdown', () => { const md = (d.hw ? d.hw + '\n\n' : '') + '| מדד | ' + cols.join(' | ') + ' |\n|---|---|---|---|\n' + rows.map((r, i) => '| ' + r + ' | ' + cols.map((_, j) => d[i + '_' + j] || '').join(' | ') + ' |').join('\n'); try { navigator.clipboard.writeText(md); out.textContent = 'הועתק.'; } catch (e) { out.textContent = md; } }]]);
};

/* 11.4 the dry run */
W.w6_dryrun = function (box) {
  V.say(box, 'החזרה היבשה של הסעיף על הרשת מפרק 2. <b>בחר תמונה אחת או אצווה של 540</b> (תרגיל 11.4).');
  const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  V.tabs(box, ['תמונה אחת', 'אצווה של 540'], i => draw(i)); function draw(i) { tb.innerHTML = ''; const v = i ? [188.8, 133.3] : [5.2, 9.7]; hbars(tb, [['דיוק מלא', v[0], 'var(--c1)'], ['שמונה ביטים', v[1], 'var(--c2)']], { lw: 110, fmt: x => f(x, 1) + ' µs' });
    out.innerHTML = i ? 'עכשיו שמונה הביטים מהיר פי <b>1.4</b>: כשיש מספיק עבודה, המחיר הקבוע מתחלק.' : 'על תמונה אחת שמונה ביטים איטי כמעט פי שניים — אותו מחיר קבוע מפרק 6.3. הקובץ קטן פי 3.5 (69,201 מול 19,821 בתים) והדיוק נשאר 97.6%.'; }
  draw(0);
};
})();
