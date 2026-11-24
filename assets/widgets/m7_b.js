/* Module 7 visuals — chapters 6–10: real models and archive search, open detection, VLMs, open vs closed, the project. */
(function () {
const W = window.W, V = window.V, el = V.el; const { f, ltr, mono, svgBox, txt, rect, iou, rng, randn } = window.BX; const { bar, hbars } = window.AC; const { COLS, HE, HELD, shape } = window.VL;
const SH = ['circle', 'square', 'triangle', 'cross'], CL = ['red', 'green', 'blue', 'yellow'];

/* 6.1 pretrained models */
W.w7_models_table = function (box) {
  V.say(box, 'המודלים מהטבלה. <b>בחר מודל</b>.');
  const M = [['CLIP (OpenAI, 2021)', 'ניגודי', 'המקור. אנגלית בלבד.'], ['OpenCLIP', 'ניגודי', 'מימוש פתוח עם מודלים שאומנו על נתונים פתוחים.'], ['SigLIP (Google, 2023)', 'סיגמואידי', 'מדויק יותר במודלים קטנים.'], ['SigLIP 2 (Google, 2025)', 'סיגמואידי ועוד', 'רב־לשוני — אפשר לשאול בעברית. רישיון Apache 2.0. משלב גם הפסד של כתיבת כיתוב ומיקום. מקרוב ל־90 מיליון פרמטרים ועד מיליארד. <b>הבחירה הטבעית למערכת הדגל.</b>']];
  const out = V.say(box); V.tabs(box, M.map(m => m[0]), i => { out.innerHTML = '<b>' + ltr(M[i][0]) + '</b> — הפסד ' + M[i][1] + '. ' + M[i][2]; }); out.innerHTML = 'בחר מודל.';
};

/* 6.2 from the model's numbers to a probability */
W.w7_real_usage = function (box) {
  V.say(box, 'SigLIP מחזיר ' + ltr('logits = s · cos + b') + ', וההסתברות היא סיגמואיד שלהם. בגלל הטיה שלילית חזקה, גם כיתוב נכון מקבל לעתים עשירית או מאית. <b>שנה את הקוסינוס</b>.');
  let c = 0.12, s = 112, b = -16.5; const sr = V.row(box); V.slider(sr, 'קוסינוס', -0.1, 0.3, 0.005, c, v => { c = v; draw(); }, x => f(x, 3)); V.slider(sr, 's', 10, 150, 1, s, v => { s = v; draw(); }); V.slider(sr, 'b', -20, 0, 0.5, b, v => { b = v; draw(); }); const out = mono(box);
  function draw() { const l = s * c + b; out.textContent = 'logit = ' + s + ' × ' + f(c, 3) + ' + (' + b + ') = ' + f(l, 2) + '\nprob  = sigmoid(logit) = ' + f(1 / (1 + Math.exp(-l)), 4) + '\n(s and b here are only illustrative — calibrate the threshold on your own data, section 6.4)'; }
  draw();
};

/* the shared synthetic archive (6.3, 6.4) */
function archive(n) { const r = rng(21); const A = []; for (let i = 0; i < n; i++) { const held = i < n / 5; let sh, c; if (held) { const h = HELD[Math.floor(r() * 4)].split(' '); c = h[0]; sh = h[1]; } else { do { sh = SH[Math.floor(r() * 4)]; c = CL[Math.floor(r() * 4)]; } while (HELD.includes(c + ' ' + sh)); } A.push({ sh, c, big: r() < 0.5, held, noise: randn(r) }); } return A; }
const parseQ = q => { const w = q.toLowerCase().split(/\s+/); return { sh: SH.find(s => w.includes(s)), c: CL.find(s => w.includes(s)), big: w.includes('large') ? true : w.includes('small') ? false : null }; };

/* 6.3 archive search */
W.w7_archive_search = function (box) {
  V.say(box, 'ארכיון מדומה של 5,000 פריימים, 1,000 מהם מצירופים שלא נראו. <b>כתוב שאילתה</b> (צורה, צבע, גודל באנגלית) וראה את עשרת הראשונים. הציון כאן מדומה; בסעיף: 10 מתוך 10 בכל ארבע השאילתות, וציון ראשון 0.23 עד 0.43.');
  const A = archive(5000); const inp = el('input', { value: 'a small blue triangle', style: { width: '240px', direction: 'ltr' } }); box.appendChild(inp); inp.oninput = draw;
  const svg = svgBox(box, 480, 120); const out = V.say(box);
  function draw() { const q = parseQ(inp.value); const sc = A.map(a => 0.05 + (q.sh && a.sh === q.sh ? 0.17 : 0) + (q.c && a.c === q.c ? 0.12 : 0) + (q.big !== null && a.big === q.big ? 0.05 : 0) + a.noise * 0.015); const top = sc.map((v, i) => [v, i]).sort((x, y) => y[0] - x[0]).slice(0, 10);
    svg.innerHTML = ''; let good = 0; top.forEach(([v, i], k) => { const a = A[i]; const ok = (!q.sh || a.sh === q.sh) && (!q.c || a.c === q.c) && (q.big === null || a.big === q.big); good += ok; const x = 8 + k * 47; V.s('rect', { x, y: 10, width: 42, height: 42, style: { fill: '#868e96', stroke: ok ? 'var(--c3)' : 'var(--c2)', strokeWidth: 3 } }, svg); shape(svg, a.sh, a.c, x + 21, 31, a.big ? 15 : 8); txt(svg, [x + 4, 68], f(v, 2), { fontSize: '10px' }); });
    out.innerHTML = 'דיוק בעשרה: <b>' + good + ' מתוך 10</b>. ' + (q.sh && q.c && HELD.includes(q.c + ' ' + q.sh) ? 'צירוף שהמודל לא ראה באימון — ובכל זאת נמצא.' : ''); }
  draw();
};

/* 6.4 threshold per query */
W.w7_threshold = function (box) {
  V.say(box, 'הסתברות סיגמואידית לכל פריים. <b>הזז את הסף</b> לכל שאילתה. בסעיף, סף 0.5: משולש כחול קטן — 95% כיסוי; צלב ירוק גדול — רק 57.6%.');
  let th = 0.5, qi = 0; V.tabs(box, ['a small blue triangle', 'a large green cross'], i => { qi = i; draw(); }); V.slider(box, 'סף', 0.02, 0.95, 0.01, th, v => { th = v; draw(); });
  const P = window.IM.plot(box, { w: 440, h: 170 }); const out = V.say(box);
  function draw() { const r = rng(5 + qi); const mu = qi ? 0.52 : 0.72, sd = qi ? 0.14 : 0.13, npos = qi ? 139 : 119, nneg = 4800; const pos = [...Array(npos)].map(() => Math.min(0.999, Math.max(0.001, mu + randn(r) * sd))); const neg = [...Array(nneg)].map(() => Math.min(0.999, Math.max(0.0005, Math.exp(-4.6 + randn(r) * 1.1))));
    const H = (a, k) => { const h = new Array(40).fill(0); a.forEach(v => h[Math.min(39, Math.floor(v * 40))]++); return h.map((c, i) => [i / 40 + 0.0125, Math.log10(1 + c)]); };
    P.draw([{ pts: H(neg), color: 'var(--c2)', width: 2 }, { pts: H(pos), color: 'var(--c3)', width: 2.5 }, { vline: th, color: 'var(--ink)', dash: '4 3' }], [0, 1], [0, 3.8]);
    const tp = pos.filter(v => v >= th).length, fp = neg.filter(v => v >= th).length; out.innerHTML = 'ירוק: הפריימים הנכונים. אדום: כל השאר (ציר לוגריתמי). נבחרו <b>' + (tp + fp) + '</b>, דיוק <b>' + f(tp / Math.max(1, tp + fp) * 100, 1) + '%</b>, כיסוי <b>' + f(tp / npos * 100, 1) + '%</b>. <b>סף לכל מטרה בנפרד.</b>'; }
  draw();
};

/* 6.5 frames to video: index size */
W.w7_video_index = function (box) {
  V.say(box, 'כמה זיכרון תופס אינדקס של וידאו. <b>שנה את הנתונים</b> (תרגיל 6.1: 10 שעות, פריים בשנייה, 768 ממדים).');
  let h = 10, fps = 1, d = 768, b16 = false; const sr = V.row(box); V.slider(sr, 'שעות', 1, 10000, 1, h, v => { h = v; draw(); }); V.slider(sr, 'פריימים בשנייה', 0.1, 5, 0.1, fps, v => { fps = v; draw(); }); V.slider(sr, 'ממד', 128, 1152, 64, d, v => { d = v; draw(); }); V.tabs(box, ['32 סיביות', '16 סיביות'], i => { b16 = i === 1; draw(); }); const out = mono(box);
  function draw() { const n = h * 3600 * fps, by = n * d * (b16 ? 2 : 4); out.textContent = 'vectors: ' + Math.round(n).toLocaleString('en') + '\nindex:   ' + (by > 1e9 ? f(by / 1e9, 2) + ' GB' : f(by / 1e6, 1) + ' MB') + '\n' + (n > 3e6 ? 'beyond a few million: approximate nearest-neighbour search (FAISS)' : 'one matrix–vector product: well under a second'); }
  draw();
};

/* 7.1 a two-stage open detector */
W.w7_two_stage_det = function (box) {
  V.say(box, 'סצנה של 128 על 128 עם כמה צורות. שלב 1: הצעות מסף רוויה ורכיבים קשורים (בלי לדעת מחלקות). שלב 2: כל חיתוך מושווה לשאילתה. <b>הגרל ובחר שאילתה</b>.');
  let seed = 1; const inp = el('input', { value: 'a blue triangle', style: { width: '200px', direction: 'ltr' } }); box.appendChild(inp); inp.oninput = draw; V.btns(box, [['סצנה חדשה', () => { seed++; draw(); }, 'primary']]); const svg = svgBox(box, 480, 270); const out = V.say(box);
  function draw() { const r = rng(seed * 7); const objs = []; const n = 3 + Math.floor(r() * 4); let tries = 0; while (objs.length < n && tries++ < 200) { const big = r() < 0.5, s = big ? 14 : 7, x = s + 2 + r() * (124 - 2 * s), y = s + 2 + r() * (124 - 2 * s); const b = [x - s, y - s, x + s, y + s]; if (objs.some(o => iou(o.b, b) > 0)) continue; objs.push({ sh: SH[Math.floor(r() * 4)], c: CL[Math.floor(r() * 4)], big, x, y, s, b }); }
    const q = parseQ(inp.value); const k = 2; svg.innerHTML = ''; V.s('rect', { x: 20, y: 5, width: 256, height: 256, style: { fill: '#868e96' } }, svg);
    let hits = 0; objs.forEach(o => { shape(svg, o.sh, o.c, 20 + o.x * k, 5 + o.y * k, o.s * k); const m = (!q.sh || o.sh === q.sh) && (!q.c || o.c === q.c) && (q.big === null || o.big === q.big); const p = m ? 0.55 + r() * 0.4 : 0.02 + r() * 0.15; hits += m; rect(svg, [20 + o.b[0] * k - 3, 5 + o.b[1] * k - 3, 20 + o.b[2] * k + 3, 5 + o.b[3] * k + 3], { stroke: m ? 'var(--c3)' : '#fff', strokeWidth: m ? 3 : 1, strokeDasharray: m ? '' : '3 2' }); txt(svg, [20 + o.b[0] * k, 2 + o.b[1] * k - 3], f(p, 2), { fontSize: '10px', fill: '#fff' }); });
    out.innerHTML = 'מקווקו לבן: כל ההצעות של שלב 1 (' + objs.length + '). ירוק: מעל הסף לשאילתה (' + hits + '). בסעיף: כיסוי ההצעות 100%, סיווג החיתוכים 91.4% — רוב הטעויות בצלבים קטנים.'; }
  draw();
};

/* 7.2 ranking vs threshold */
W.w7_rank_vs_thr = function (box) {
  V.say(box, 'הטבלה של הסעיף: הדירוג כמעט מושלם (AP), אבל ההסתברויות שונות מאוד בין שאילתות. <b>הזז סף אחד לכולן</b>.');
  const D = [['a red circle', 0.999, 0.334, 0.206], ['a large yellow square', 1.0, 0.184, 0.059], ['a blue triangle', 1.0, 0.831, 0.138], ['a small green cross', 0.976, 0.110, 0.099]]; let th = 0.5; V.slider(box, 'סף', 0.05, 0.95, 0.01, th, v => { th = v; draw(); }); const svg = svgBox(box, 480, 170); const out = V.say(box);
  function draw() { svg.innerHTML = ''; D.forEach(([q, ap, med, mx], i) => { const y = 15 + i * 38; txt(svg, [10, y + 14], q, { fontSize: '11px' }); V.s('line', { x1: 170, y1: y + 10, x2: 460, y2: y + 10, style: { stroke: 'var(--line2)' } }, svg); const X = v => 170 + v * 290; V.s('circle', { cx: X(med), cy: y + 10, r: 6, style: { fill: 'var(--c3)' } }, svg); V.s('circle', { cx: X(mx), cy: y + 10, r: 5, style: { fill: 'var(--c2)' } }, svg); });
    V.s('line', { x1: 170 + th * 290, y1: 5, x2: 170 + th * 290, y2: 165, style: { stroke: 'var(--ink)', strokeDasharray: '4 3' } }, svg); const found = D.filter(d => d[2] >= th).map(d => d[0]);
    out.innerHTML = 'ירוק: חציון ההסתברות על מטרות. אדום: המקסימום על אחרים. בסף ' + f(th, 2) + ' לפחות חצי מהמטרות נמצאות רק ב: ' + (found.length ? ltr(found.join(', ')) : '—') + '. <b>סף לכל תיאור.</b>'; }
  draw();
};

/* 7.3 YOLO-World: text encoded once */
W.w7_yoloworld = function (box) {
  V.say(box, 'YOLO-World: מקודדים את התיאורים <b>פעם אחת</b>, והם הופכים למטריצת הסיווג. <b>הוסף תיאור</b> וראה מה רץ שוב ומה לא.');
  const cls = ['white pickup truck', 'person with backpack']; const svg = svgBox(box, 480, 150); const out = V.say(box); const inp = el('input', { placeholder: 'תיאור חדש באנגלית', style: { width: '200px', direction: 'ltr' } }); box.appendChild(inp);
  V.btns(box, [['set_classes', () => { if (inp.value.trim()) { cls.push(inp.value.trim()); inp.value = ''; } draw(true); }, 'primary']]);
  function draw(enc) { svg.innerHTML = ''; bar(svg, 10, 20, 120, 40, enc ? 'var(--c5, #e8a33d)' : '#adb5bd'); txt(svg, [16, 45], 'מקודד הטקסט', { fill: '#fff' }); cls.forEach((c, i) => { bar(svg, 150, 10 + i * 22, 140, 18, 'var(--c3)'); txt(svg, [154, 23 + i * 22], c, { fontSize: '9.5px', fill: '#fff' }); }); bar(svg, 320, 80, 140, 40, 'var(--c1)'); txt(svg, [326, 105], 'YOLO על כל פריים', { fill: '#fff' });
    out.innerHTML = enc ? 'המקודד רץ עכשיו פעם אחת על ' + cls.length + ' תיאורים. מכאן, כל פריים רץ במהירות של YOLO רגיל.' : 'בזמן ריצה רק הכחול רץ. בתוצאות: ציונים נמוכים מהרגיל (0.1 עד 0.4), ותיאורים קצרים עובדים טוב יותר.'; }
  draw(false);
};

/* 7.4 Grounding DINO vs YOLO-World */
W.w7_gdino_vs_world = function (box) {
  V.say(box, 'שני מזהים פתוחים, שתי גישות. <b>בחר שימוש</b> וראה מי מתאים.');
  const U = [['מערכת חיה עם מטרה חדשה', 0, 'זמן אמת, והטקסט מקודד פעם אחת.'], ['תיוג אוטומטי של הארכיון', 1, 'איטי, אבל מבין תיאורים מורכבים — ואדם מתקן אחריו.'], ['"האדם השמאלי מהרכב"', 1, 'הטקסט מעורבב בכל הרשת, אז יחסים מורכבים עובדים טוב יותר.'], ['30 פריימים בשנייה על לוח קצה', 0, 'Grounding DINO: שניות לתמונה על מעבד.']];
  const out = V.say(box); V.tabs(box, U.map(u => u[0]), i => { out.innerHTML = '<b>' + (U[i][1] ? 'Grounding DINO' : 'YOLO-World') + '</b>: ' + U[i][2]; }); out.innerHTML = 'בחר שימוש.';
};

/* 8.1 visual tokens */
W.w7_vis_tokens = function (box) {
  V.say(box, 'מספר האסימונים החזותיים = (צד / טלאי)² חלקי האיחוד. <b>שנה את הערכים</b> (בסעיף: 196, 729, 256, 1,024; תרגיל 8.1: 2,000 אסימונים בשנייה).');
  let side = 224, p = 16, sh = 1, rate = 2000; const sr = V.row(box); V.slider(sr, 'צד התמונה', 112, 1024, 16, side, v => { side = v; draw(); }); V.slider(sr, 'טלאי', 8, 32, 1, p, v => { p = v; draw(); }); V.slider(sr, 'איחוד טלאים', 1, 16, 1, sh, v => { sh = v; draw(); }); V.slider(sr, 'אסימונים בשנייה', 200, 10000, 100, rate, v => { rate = v; draw(); });
  V.btns(box, [['224/16/1', () => set(224, 16, 1)], ['384/14/1', () => set(384, 14, 1)], ['512/16/4', () => set(512, 16, 4)], ['1024/16/4', () => set(1024, 16, 4)]]); const svg = svgBox(box, 480, 140); const out = mono(box);
  function set(a, b, c) { side = a; p = b; sh = c; draw(); }
  function draw() { const n = Math.floor(side / p) ** 2 / sh; svg.innerHTML = ''; const g = Math.min(40, Math.floor(side / p)), cs = 130 / g; for (let i = 0; i < g; i++) for (let j = 0; j < g; j++) V.s('rect', { x: 10 + j * cs, y: 5 + i * cs, width: cs - 0.5, height: cs - 0.5, style: { fill: 'var(--c1)', opacity: 0.25 + 0.5 * (((i / Math.sqrt(sh)) | 0) + ((j / Math.sqrt(sh)) | 0)) % 2 } }, svg);
    bar(svg, 170, 30, Math.min(300, n / 1100 * 300), 30, 'var(--c1)'); bar(svg, 170, 80, 10 / 1100 * 300 + 2, 30, 'var(--c3)'); txt(svg, [174, 50], 'תמונה: ' + Math.round(n), { fill: '#fff', fontSize: '11px' }); txt(svg, [180, 100], 'שאלה: ~10', { fontSize: '11px' });
    out.textContent = 'visual tokens = (' + side + '/' + p + ')² / ' + sh + ' = ' + Math.round(n) + '\nprefill time at ' + rate + ' tok/s ≈ ' + f(n / rate, 2) + ' s — before the first word of the answer'; }
  draw();
};

/* 8.2 small VLMs */
W.w7_vlm_models = function (box) {
  V.say(box, 'מודלי שפה־ראייה קטנים, לפי הטבלה (נכונה לסתיו 2026). <b>בחר צורך</b>.');
  const N = [['קריאת טקסט ומסמכים, וידאו, מיקום עצמים', 'Qwen3-VL (Alibaba) — 2, 4 ו־8 מיליארד. רישיון Apache 2.0.'], ['ריצה על מכשיר קצה, כולל מעבד', 'SmolVLM2 (Hugging Face) — מאות מיליונים עד כ־2 מיליארד.'], ['כיתוב, ספירה והצבעה על עצמים, טביעת רגל קטנה', 'Moondream — כ־2 מיליארד.'], ['כיוונון למשימה, תמיכה רחבה בכלים', 'Gemma 3 ו־PaliGemma 2 (Google) — 3 עד 4 מיליארד בגדלים הקטנים.']];
  const out = V.say(box); V.tabs(box, N.map(n => n[0]), i => { out.innerHTML = ltr(N[i][1]); }); out.innerHTML = 'התחום משתנה מהר — בודקים מה חדש לפני שבוחרים.';
};

/* 8.3 a closed question */
W.w7_closed_question = function (box) {
  V.say(box, 'שאלה מובילה מזמינה הזיה. <b>בחר שאלה</b> וראה גרסה סגורה שקל לפענח בקוד (תרגיל 8.2).');
  const Q = [['מה צבע הטנדר שחונה ליד השער?', 'Is there a tank near the gate? Answer yes or no.\n→ only if yes: What color is the tank? Answer with one word: white, green, black, sand, or other.', 'השאלה המקורית מניחה שיש טנדר.'], ['איזה נשק מחזיק האדם?', 'Is the person holding an object in their hands? Answer yes or no.', 'שאלה מובילה מקבלת תשובה בטוחה גם כשאין נשק.'], ['תאר את הסצנה', 'How many people are in the image? Answer with a number.', 'תשובה חופשית קשה לבדיקה ולפענוח.']];
  const out = mono(box); const say = V.say(box); V.tabs(box, Q.map(q => q[0]), i => { out.textContent = Q[i][1]; say.innerHTML = Q[i][2]; }); out.textContent = 'בחר שאלה.';
};

/* 8.4 where it fits: a second stage with a queue */
W.w7_vlm_pipeline = function (box) {
  V.say(box, 'מזהה ב־30 פריימים בשנייה, ומודל שפה־ראייה שלוקח 300 מילישניות לשאלה, בתהליך נפרד עם תור (תרגיל 8.3). <b>שנה את מספר המועמדים</b>.');
  let n = 10, ms = 300; const sr = V.row(box); V.slider(sr, 'מועמדים בבת אחת', 1, 30, 1, n, v => { n = v; draw(); }); V.slider(sr, 'זמן לשאלה (מ״ש)', 50, 2000, 50, ms, v => { ms = v; draw(); }); const svg = svgBox(box, 480, 90); const out = V.say(box);
  function draw() { svg.innerHTML = ''; const tot = n * ms; const sc = 440 / Math.max(tot, 3000); for (let i = 0; i < n; i++) bar(svg, 20 + i * ms * sc, 20, ms * sc - 1, 26, i % 2 ? 'var(--c1)' : 'var(--c3)'); txt(svg, [20, 70], '0', { fontSize: '10px' }); txt(svg, [20 + tot * sc - 30, 70], f(tot / 1000, 1) + ' s', { fontSize: '10px' });
    out.innerHTML = 'האחרון בתור מקבל תשובה אחרי <b>' + f(tot / 1000, 1) + '</b> שניות. לכן: שואלים רק על ההתראה הראשונה של כל מסלול, ומסדרים לפי עדיפות. המזהה לא נעצר.'; }
  draw();
};

/* 9.1 open vs closed on the same crops */
W.w7_open_vs_closed = function (box) {
  V.say(box, 'הטבלה של הסעיף על 1,325 החיתוכים. <b>בחר מדד</b>.');
  const tb = el('div'); box.appendChild(tb); const out = V.say(box);
  const show = i => { tb.innerHTML = ''; if (i === 0) hbars(tb, [['סגור, 20,000 תוויות', 100, 'var(--c1)'], ['סגור, 20 תוויות למחלקה', 99.8, 'var(--c1)'], ['פתוח, בלי תוויות', 92.4, 'var(--c3)']], { lw: 170, max: 105, fmt: v => v + '%' }); else hbars(tb, [['סגור, 20,000 תוויות', 0.4, 'var(--c1)'], ['סגור, 20 תוויות למחלקה', 0.4, 'var(--c1)'], ['פתוח, בלי תוויות', 88.6, 'var(--c3)']], { lw: 170, max: 105, fmt: v => (v < 1 ? 0 : v) + '%' });
    out.innerHTML = i ? 'הסגור עיוור לגמרי למה שלא הכיר — אין לו מחלקה כזו (תרגיל 9.1). ובתרגיל 9.4: הסגור בטוח בעצמו (חציון 0.998) גם כשהוא טועה תמיד.' : 'על מה שהוא מכיר, הסגור מנצח — ומספיקות לו 20 דוגמאות למחלקה. זמן סיווג: 0.019 מול 0.009 מילישניות — אותו סדר גודל.'; };
  V.tabs(box, ['מחלקות שנראו', 'צירופים שלא נראו'], show); show(0);
};

/* 9.2 decision table as a few questions */
W.w7_decision = function (box) {
  V.say(box, 'טבלת ההחלטה כשאלות. <b>ענה</b> וקבל המלצה.');
  const Q = [['המטרה קבועה ויש תוויות?', 'סגור — מדויק יותר, סף יציב, קל לאשר מבחינת בטיחות.'], ['צריך אותה היום, ואין זמן לתייג?', 'פתוח — ואם היא תהיה קבועה: פתוח עכשיו, סגור אחר כך (9.3).'], ['זה חיפוש חד־פעמי בארכיון?', 'פתוח — אדם מסנן את התוצאות בכל מקרה.'], ['מטרה נדירה שאי אפשר לאסוף עליה דוגמאות?', 'פתוח, עם בדיקה ידנית — אין ברירה אחרת.']];
  let i = 0; const q = V.say(box); const row = V.row(box); const out = V.say(box);
  function show() { q.innerHTML = '<b>' + Q[i][0] + '</b>'; row.innerHTML = ''; row.append(V.button('כן', () => { out.innerHTML = '→ ' + Q[i][1]; }, 'primary'), V.button('לא', () => { i = (i + 1) % Q.length; out.innerHTML = ''; show(); }), V.button('מההתחלה', () => { i = 0; out.innerHTML = ''; show(); }, 'ghost')); }
  show();
};

/* 9.3 the hybrid path */
W.w7_hybrid = function (box) {
  V.say(box, 'השיטה הנפוצה בתעשייה: פתוח מתייג, סגור מזהה. <b>עבור על השלבים</b>.');
  const S = [['מזהה פתוח איטי על הארכיון', 'Grounding DINO עם התיאור של המטרה החדשה.'], ['אדם עובר ומתקן', 'הרבה יותר מהיר מלתייג מאפס.'], ['מאמנים מזהה סגור', 'YOLO ממודול 4, מייצאים ומפריסים כמו במודול 6.'], ['בינתיים: YOLO-World', 'עם התיאור, בסף שכויל ידנית — המערכת מכסה את המטרה מהיום הראשון.']];
  const svg = svgBox(box, 480, 80); const out = V.say(box);
  V.stepper(box, S.length, s => { svg.innerHTML = ''; S.forEach((x, i) => { bar(svg, 10 + i * 117, 20, 110, 40, i === s ? 'var(--c1)' : i < s ? 'var(--c3)' : 'var(--line2)'); V.s('text', { x: 65 + i * 117, y: 45, 'font-size': 10, 'text-anchor': 'middle', text: (i + 1) + '. ' + x[0].split(' ').slice(0, 3).join(' '), style: { fill: i <= s ? '#fff' : 'var(--ink2)' } }, svg); }); out.innerHTML = '<b>' + S[s][0] + '</b>: ' + S[s][1]; });
};

/* 10.1 building the archive index */
W.w7_index_build = function (box) {
  V.say(box, 'חלק א: אינדקס לארכיון. <b>עבור על השלבים</b>, ובסוף — שורת מטא־מידע לדוגמה (תרגיל 10.1).');
  const S = [['פריים אחד בשנייה', 'בונוס: רק פריימים שהשתנו מספיק מהקודם.'], ['קידוד הפריים וגם חיתוכי העצמים', 'עצמים קטנים נבלעים בשיכון של פריים שלם.'], ['שמירה', 'מטריצת שיכונים, וטבלת מטא־מידע: קובץ, זמן, מלבן.'], ['חיפוש ואיחוד שכנים בזמן', 'כמו NMS על ציר הזמן (תרגיל 6.3).']];
  const out = mono(box); const say = V.say(box);
  V.stepper(box, S.length, s => { say.innerHTML = '<b>' + S[s][0] + '</b>: ' + S[s][1]; out.textContent = s < 2 ? 'embeddings: [N, 768] float32' : 'row | file          | camera | t (s)  | kind  | box              | det class\n 0  | gate_0412.mp4 | cam3   | 12.0   | frame |                  |\n 1  | gate_0412.mp4 | cam3   | 12.0   | crop  | 410,220,470,300  | car\nrow i in the table = row i in the embedding matrix'; });
};

/* 10.2 adding a target in words */
W.w7_add_target = function (box) {
  V.say(box, 'חלק ב: הפקודה ' + ltr('add-target "white pickup truck"') + '. <b>סמן מה עשית</b>; נשמר בדפדפן.');
  const items = ['הגדרה: YOLO-World עם set_classes, ושמירה של מודל עם התיאורים מקודדים (7.3).', 'כיול סף: 200 פריימים מהארכיון, תיוג מהיר נכון־לא נכון, סף לפי עקומת דיוק־כיסוי (תרגיל 7.2). סף נפרד לכל מטרה.', 'שילוב: עקיבה ולוגיקת התראה ממודול 6, עם תג "מטרה פתוחה — דורש אישור".', 'אימות אופציונלי: מודל שפה־ראייה עונה על שאלה סגורה על ההתראה הראשונה של כל מסלול (פרק 8).', 'מעבר לסגור: הזיהויים שאושרו נשמרים כתוויות; אחרי כמה מאות — מזהה סגור (9.3).'];
  const S = window.Store.map('notes'), key = 'm7_target'; let d = {}; try { d = JSON.parse(S[key] || '{}'); } catch (e) { d = {}; } const out = V.say(box);
  items.forEach((t, i) => { const cb = el('input', { type: 'checkbox' }); cb.checked = !!d[i]; cb.onchange = () => { d[i] = cb.checked; S[key] = JSON.stringify(d); window.Store.save(); upd(); }; box.insertBefore(el('label', { style: { display: 'flex', gap: '8px', margin: '6px 0' } }, cb, el('span', {}, (i + 1) + '. ' + t)), out); });
  function upd() { out.innerHTML = Object.values(d).filter(Boolean).length + ' מתוך 5.'; } upd();
};

/* 10.3 acceptance criteria */
W.w7_acceptance = function (box) {
  V.say(box, 'תנאי הקבלה. <b>רשום את מה שמדדת</b> וסמן אם עבר; נשמר בדפדפן, ואפשר להעתיק כ־Markdown.');
  const R = [['זמן שאילתה בארכיון של 10 שעות', 'פחות משנייה'], ['דיוק בעשרה, שאילתות פשוטות', 'לפחות 7 מתוך 10 בממוצע'], ['הוספת מטרה חדשה עד שהיא במערכת החיה', 'פחות משעה, כולל כיול'], ['קצב המערכת החיה עם המטרה החדשה', 'ללא ירידה מהותית לעומת מודול 6'], ['דוח', 'טבלה של סף, דיוק וכיסוי לכל מטרה, ושלוש דוגמאות כישלון מתועדות']];
  const S = window.Store.map('notes'), key = 'm7_accept'; let d = {}; try { d = JSON.parse(S[key] || '{}'); } catch (e) { d = {}; } const save = () => { S[key] = JSON.stringify(d); window.Store.save(); };
  const t = el('table', { class: 'mini', style: { margin: '8px auto' } }); t.appendChild(el('tr', {}, ...['תנאי', 'יעד', 'נמדד', 'עבר'].map(h => el('th', {}, h)))); box.appendChild(t);
  R.forEach(([c, g], i) => { const inp = el('input', { value: d['v' + i] || '', style: { width: '90px' } }); inp.oninput = () => { d['v' + i] = inp.value; save(); }; const cb = el('input', { type: 'checkbox' }); cb.checked = !!d['ok' + i]; cb.onchange = () => { d['ok' + i] = cb.checked; save(); }; t.appendChild(el('tr', {}, el('td', {}, c), el('td', { class: 'note-small' }, g), el('td', {}, inp), el('td', {}, cb))); });
  const out = V.say(box, 'ושתי דרישות שלא מוותרים עליהן: דוגמאות כישלון אמיתיות בדוח, וסימון ברור של מה זוהה על ידי מטרה פתוחה שלא עברה אימות.');
  V.btns(box, [['העתק כ־Markdown', () => { const md = '| תנאי | יעד | נמדד | עבר |\n|---|---|---|---|\n' + R.map(([c, g], i) => '| ' + c + ' | ' + g + ' | ' + (d['v' + i] || '') + ' | ' + (d['ok' + i] ? '✓' : '') + ' |').join('\n'); try { navigator.clipboard.writeText(md); out.textContent = 'הועתק.'; } catch (e) { out.textContent = md; } }]]);
};
})();
