/* Module 0 widgets — chapters 1–3: arrays, vectors, matrices */
(function () {
const W = window.W, V = window.V, el = V.el;

/* ===== chapter 1 ===== */

/* a picture is a table of numbers: zoom into pixels */
W.w_img_numbers = function (box) {
  const G = V.scene(48, 36);
  V.say(box, 'זו תמונה רגילה. <b>גרור את הריבוע</b> על התמונה, ותראה מה המחשב באמת "רואה" שם: טבלה של מספרים בין 0 (שחור) ל־255 (לבן).');
  const r = V.row(box); r.style.alignItems = 'flex-start'; r.style.direction = 'ltr'; r.style.justifyContent = 'center';
  const cv = V.canvas(r, 48, 36, 6); V.drawGray(cv, G); cv.style.cursor = 'crosshair';
  const ov = el('div', { style: { position: 'relative' } });
  const tbl = el('div'); r.appendChild(tbl);
  let px = 20, py = 14;
  const ctx = cv.getContext('2d');
  function draw() {
    V.drawGray(cv, G); ctx.strokeStyle = '#e8590c'; ctx.lineWidth = 0.6; ctx.strokeRect(px - 0.5, py - 0.5, 5, 5);
    let h = '<div class="grid" style="grid-template-columns:repeat(5,auto)">';
    for (let y = py; y < py + 5; y++) for (let x = px; x < px + 5; x++) { const v = Math.round(G[y][x]); h += `<div class="cell" style="background:rgb(${v},${v},${v});color:${v > 128 ? '#000' : '#fff'};min-width:44px">${v}</div>`; }
    tbl.innerHTML = h + '</div><div class="note-small" style="text-align:center;margin-top:4px">img[' + py + ':' + (py + 5) + ', ' + px + ':' + (px + 5) + ']</div>';
  }
  const pick = e => { const b = cv.getBoundingClientRect(); px = Math.max(0, Math.min(43, Math.floor((e.clientX - b.left) / b.width * 48) - 2)); py = Math.max(0, Math.min(31, Math.floor((e.clientY - b.top) / b.height * 36) - 2)); draw(); };
  let down = false; cv.onmousedown = e => { down = true; pick(e); }; cv.onmousemove = e => down && pick(e); window.addEventListener('mouseup', () => down = false);
  cv.addEventListener('touchmove', e => { e.preventDefault(); pick(e.touches[0]); }, { passive: false });
  draw();
};

/* 1.1: animated terminal */
W.w_install = function (box) {
  V.say(box, 'לחץ "הקלד" ותראה מה קורה כשמריצים את הפקודה בחלון שורת הפקודה (זו הדמיה, לא התקנה אמיתית).');
  const term = el('pre', { style: { background: '#111', color: '#d4f5d4', padding: '12px', borderRadius: '10px', direction: 'ltr', textAlign: 'left', minHeight: '150px', fontSize: '.85em' } });
  box.appendChild(term);
  const lines = ['$ pip install numpy matplotlib jupyter', 'Collecting numpy ...', 'Collecting matplotlib ...', 'Collecting jupyter ...', 'Successfully installed numpy matplotlib jupyter', '$ jupyter notebook', '[I] Jupyter Server is running at http://localhost:8888', '→ הדפדפן נפתח. לוחצים New → Python 3, כותבים קוד ולוחצים Shift+Enter'];
  let t;
  V.btns(box, [['הקלד', () => { clearInterval(t); term.textContent = ''; let i = 0; t = setInterval(() => { term.textContent += lines[i] + '\n'; if (++i >= lines.length) clearInterval(t); }, 550); }, 'primary']]);
};

/* 1.2: Java vs Python side by side, executed step by step */
W.w_java_py = function (box) {
  V.say(box, 'אותה תוכנית בשתי שפות. לחץ "הבא" ותראה את שתיהן רצות <b>יחד</b>, שורה אחר שורה, ואת הערכים של i ו־total משתנים.');
  const java = ['int total = 0;', 'for (int i = 0; i < 5; i++) {', '    if (i % 2 == 0) {', '        total += i;', '    }', '}', 'System.out.println(total);'];
  const py = ['total = 0', 'for i in range(5):', '    if i % 2 == 0:', '        total += i', 'print(total)'];
  const r = V.row(box); r.style.direction = 'ltr'; r.style.alignItems = 'stretch';
  const mk = (title, lines) => { const c = el('div', { style: { flex: 1, minWidth: '230px' } }); c.innerHTML = '<div class="note-small" style="text-align:center">' + title + '</div>'; const pre = el('pre', { style: { background: 'var(--code-bg)', padding: '10px', borderRadius: '10px', margin: 0, fontSize: '.85em' } }); lines.forEach(l => pre.appendChild(el('span', { class: 'ln', style: { display: 'block', borderRadius: '4px', padding: '0 4px' } }, l || ' '))); c.appendChild(pre); r.appendChild(c); return pre; };
  const jp = mk('ג׳אווה', java), pp = mk('פייתון', py);
  const vars = V.say(box); const out = el('div', { class: 'note-small' }); box.appendChild(out);
  // trace: [javaLine, pyLine, i, total, note]
  const tr = [[0, 0, '-', 0, 'יוצרים משתנה total = 0. בפייתון אין צורך לכתוב int.']];
  let total = 0;
  for (let i = 0; i < 5; i++) {
    tr.push([1, 1, i, total, `הלולאה: i מקבל ${i}. בפייתון range(5) מייצרת 0, 1, 2, 3, 4.`]);
    tr.push([2, 2, i, total, `${i} % 2 = ${i % 2} → ${i % 2 === 0 ? 'זוגי, נכנסים לתנאי' : 'אי־זוגי, מדלגים'}. שים לב: בפייתון ההזחה היא הבלוק.`]);
    if (i % 2 === 0) { total += i; tr.push([3, 3, i, total, `total += ${i} → total = ${total}`]); }
  }
  tr.push([6, 4, '-', total, 'מדפיסים: 6. השורה בלי הזחה, ולכן היא מחוץ ללולאה ורצה פעם אחת.']);
  V.stepper(box, tr.length, k => {
    const [j, p, i, t, note] = tr[k];
    [...jp.children].forEach((l, x) => l.className = 'ln' + (x === j ? ' hl' : ''));
    [...pp.children].forEach((l, x) => l.className = 'ln' + (x === p ? ' hl' : ''));
    vars.innerHTML = `<span class="chip mono">i = ${i}</span> <span class="chip mono">total = ${t}</span> &nbsp; ${note}`;
    out.textContent = k === tr.length - 1 ? 'פלט: 6' : '';
  }, { speed: 1300 });
};

/* 1.3: loop vs vectorized race */
W.w_vectorize = function (box) {
  V.say(box, 'שני "עובדים" צריכים להבהיר תמונה של 40×30 פיקסלים. <b>השמאלי</b> עובר פיקסל־פיקסל, כמו לולאת פייתון. <b>הימני</b> עושה פעולה אחת על כל המערך. לחץ "מרוץ!".');
  const r = V.row(box); r.style.justifyContent = 'center'; r.style.direction = 'ltr';
  const mk = t => { const c = el('div', { style: { textAlign: 'center' } }); const cv = V.canvas(c, 40, 30, 5); c.appendChild(el('div', { class: 'note-small' }, t)); r.appendChild(c); return cv; };
  const a = mk('לולאה על פיקסלים'), b = mk('פעולה על כל המערך');
  const G = V.scene(40, 30); V.drawGray(a, G); V.drawGray(b, G);
  const info = V.say(box);
  let timer;
  V.btns(box, [['מרוץ!', () => {
    clearInterval(timer); V.drawGray(a, G); V.drawGray(b, G);
    const B = G.map(r => r.map(v => Math.min(255, v + 70)));
    setTimeout(() => { V.drawGray(b, B); }, 120);
    let k = 0; const A = G.map(r => r.slice());
    timer = setInterval(() => { for (let s = 0; s < 6; s++) { const y = Math.floor(k / 40), x = k % 40; if (y >= 30) { clearInterval(timer); info.innerHTML = 'הימני סיים מזמן. בתמונה אמיתית של 6.2 מיליון מספרים, לולאת פייתון איטית <b>בערך פי 100</b> מג׳אווה, וספריית המערכים כמעט כמו C.'; return; } A[y][x] = Math.min(255, A[y][x] + 70); k++; } V.drawGray(a, A); info.innerHTML = 'פיקסל ' + k + ' מתוך 1200…'; }, 16);
  }, 'primary']]);
};

/* 1.4: shape builder */
W.w_shape = function (box) {
  V.say(box, 'בנה מערך בעצמך. שנה גובה, רוחב וערוצים, ותראה איך הצורה (shape) נכתבת: <b>תמיד שורות קודם</b>. אחר כך לחץ על פיקסל.');
  let H = 3, Wd = 4, C = 3;
  const r = V.row(box);
  V.slider(r, 'גובה (שורות)', 1, 6, 1, H, v => { H = v; draw(); });
  V.slider(r, 'רוחב (עמודות)', 1, 8, 1, Wd, v => { Wd = v; draw(); });
  V.slider(r, 'ערוצים', 1, 3, 1, C, v => { C = v; draw(); });
  const shape = el('div', { class: 'big mono', style: { textAlign: 'center' } }); box.appendChild(shape);
  const stage = el('div', { style: { position: 'relative', height: '240px', direction: 'ltr', margin: '6px auto', width: '360px', maxWidth: '100%' } }); box.appendChild(stage);
  const info = V.say(box, 'לחץ על משבצת.');
  const cols = [['#4c6ef5', 'כחול'], ['#2f9e44', 'ירוק'], ['#e03131', 'אדום']];
  function draw() {
    shape.textContent = 'img.shape = (' + H + ', ' + Wd + (C > 1 ? ', ' + C : '') + ')';
    stage.innerHTML = '';
    for (let c = C - 1; c >= 0; c--) {
      const g = el('div', { style: { position: 'absolute', left: (c * 26) + 'px', top: (c * 20) + 'px', display: 'grid', gridTemplateColumns: `repeat(${Wd}, 30px)`, gap: '2px', padding: '3px', borderRadius: '6px', background: C > 1 ? cols[c][0] + '33' : 'transparent', border: '1px solid ' + (C > 1 ? cols[c][0] : 'var(--line)') } });
      for (let y = 0; y < H; y++) for (let x = 0; x < Wd; x++) {
        const cell = el('div', { style: { width: '30px', height: '26px', borderRadius: '4px', background: 'var(--surface)', border: '1px solid var(--line)', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } }, c === 0 ? '' : '');
        cell.onclick = () => { [...stage.querySelectorAll('div div')].forEach(d => d.style.outline = ''); cell.style.outline = '3px solid var(--c2)'; info.innerHTML = `הפיקסל בשורה <b>y = ${y}</b> ובעמודה <b>x = ${x}</b>${C > 1 ? ', בערוץ ' + c + ' (' + cols[c][1] + ')' : ''}. כותבים: <span class="mono chip">img[${y}, ${x}${C > 1 ? ', ' + c : ''}]</span>. ולא img[${x}, ${y}]!`; };
        g.appendChild(cell);
      }
      stage.appendChild(g);
    }
  }
  draw();
};

/* 1.4: uint8 odometer */
W.w_uint8 = function (box) {
  V.say(box, 'טיפוס uint8 הוא כמו מד־מרחק של אופניים עם 256 מספרים בלבד: אחרי 255 הוא חוזר ל־0. הוסף ל־250 ותראה את ה"גלישה".');
  let v = 250, add = 10;
  const r = V.row(box);
  V.slider(r, 'ערך התחלתי', 0, 255, 1, v, x => { v = x; draw(); });
  V.slider(r, 'כמה להוסיף', 0, 100, 1, add, x => { add = x; draw(); });
  const svg = V.s('svg', { viewBox: '0 0 360 200', width: 360 }); const wrap = el('div', { style: { display: 'flex', justifyContent: 'center' } }); wrap.appendChild(svg); box.appendChild(wrap);
  const out = V.say(box);
  function draw() {
    svg.innerHTML = '';
    const cx = 100, cy = 100, R = 80;
    V.s('circle', { cx, cy, r: R, style: { fill: 'var(--surface2)', stroke: 'var(--line2)', strokeWidth: 2 } }, svg);
    for (let k = 0; k < 256; k += 32) { const a = k / 256 * 2 * Math.PI - Math.PI / 2; V.s('text', { x: cx + Math.cos(a) * (R - 14), y: cy + Math.sin(a) * (R - 14) + 4, 'text-anchor': 'middle', 'font-size': 10, style: { fill: 'var(--ink3)' }, text: k }, svg); }
    const real = v + add, wrapd = real % 256;
    const a0 = v / 256 * 2 * Math.PI - Math.PI / 2, a1 = wrapd / 256 * 2 * Math.PI - Math.PI / 2;
    const arcEnd = (v + add) / 256 * 2 * Math.PI - Math.PI / 2;
    const large = add / 256 > 0.5 ? 1 : 0;
    if (add > 0) V.s('path', { d: `M${cx + Math.cos(a0) * R},${cy + Math.sin(a0) * R} A${R},${R} 0 ${large} 1 ${cx + Math.cos(arcEnd) * R},${cy + Math.sin(arcEnd) * R}`, style: { fill: 'none', stroke: 'var(--c2)', strokeWidth: 6 } }, svg);
    V.s('line', { x1: cx, y1: cy, x2: cx + Math.cos(a1) * (R - 22), y2: cy + Math.sin(a1) * (R - 22), style: { stroke: real > 255 ? 'var(--warn-ink)' : 'var(--c1)', strokeWidth: 4 }, 'stroke-linecap': 'round' }, svg);
    V.s('text', { x: 260, y: 80, 'text-anchor': 'middle', 'font-size': 14, style: { fill: 'var(--ink2)' }, text: 'החשבון האמיתי' }, svg);
    V.s('text', { x: 260, y: 105, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 700, style: { fill: 'var(--ink)' }, text: v + ' + ' + add + ' = ' + real }, svg);
    V.s('text', { x: 260, y: 140, 'text-anchor': 'middle', 'font-size': 14, style: { fill: 'var(--ink2)' }, text: 'מה ש־uint8 שומר' }, svg);
    V.s('text', { x: 260, y: 166, 'text-anchor': 'middle', 'font-size': 26, 'font-weight': 700, style: { fill: real > 255 ? 'var(--warn-ink)' : 'var(--ok-ink)' }, text: wrapd }, svg);
    out.innerHTML = real > 255 ? `גלישה! ${real} לא נכנס, ולכן הוא "מתגלגל": ${real} − 256 = <b>${wrapd}</b>. אין שום אזהרה, וזה מה שהופך את הבאג למסוכן. הפתרון: <span class="mono chip">astype(np.float32)</span>, לחשב, ואז <span class="mono chip">np.clip(…, 0, 255)</span>. עם clip היית מקבל <b>255</b>.` : 'עדיין בטווח 0 עד 255, אין בעיה.';
  }
  draw();
};

/* 1.5: element-wise ops */
W.w_elem = function (box) {
  V.say(box, 'בחר פעולה. כל איבר נפגש רק עם השכן שלו באותו מקום, כמו זוגות בריקוד. אין כאן לולאה, יש סימן אחד.');
  const a = [1, 2, 3], b = [10, 20, 30];
  let op = '+';
  const ops = { '+': (x, y) => x + y, '*': (x, y) => x * y, '** 2': x => x * x, 'np.sqrt(b)': (x, y) => Math.sqrt(y) };
  V.tabs(box, Object.keys(ops), (i, l) => { op = l; play(); });
  const st = V.ltrRow(box);
  const A = V.matrix(st, [a]); const opE = V.op(st, '+'); const Bm = V.matrix(st, [b]); V.op(st, '='); const R = V.matrix(st, [['?', '?', '?']], { fmt: x => typeof x === 'number' ? V.fmt(x, 2) : x });
  const say = V.say(box);
  let t;
  function play() {
    clearTimeout(t); const f = ops[op];
    opE.textContent = op === '** 2' ? '**2' : op === 'np.sqrt(b)' ? '√' : op;
    A.el.style.opacity = op === 'np.sqrt(b)' ? .3 : 1; Bm.el.style.opacity = op === '** 2' ? .3 : 1;
    R.vals([['?', '?', '?']]); R.cls(() => 'dim');
    let k = 0;
    const step = () => {
      A.cls((r, c) => c === k ? 'on' : ''); Bm.cls((r, c) => c === k ? 'on' : '');
      R.set(0, k, f(a[k], b[k]), 'ok');
      say.innerHTML = op === 'np.sqrt(b)' ? `√${b[k]} = ${V.fmt(Math.sqrt(b[k]), 2)}` : op === '** 2' ? `${a[k]}² = ${a[k] ** 2}` : `${a[k]} ${op} ${b[k]} = ${f(a[k], b[k])}`;
      if (++k < 3) t = setTimeout(step, 800); else t = setTimeout(() => { A.cls(() => ''); Bm.cls(() => ''); say.innerHTML += op === '*' ? ' &nbsp;זה כפל איבר־איבר, <b>לא</b> כפל מטריצות (שנכתב <span class="mono">@</span>, פרק 3).' : ' &nbsp;✓ כל המערך בפעולה אחת.'; }, 700);
    };
    step();
  }
  play();
};

/* 1.6: slicing playground */
W.w_slice = function (box) {
  V.say(box, 'זו הטבלה <span class="mono chip">M = np.arange(20).reshape(4, 5)</span>. כתוב חיתוך, או לחץ על אחת הדוגמאות. זכור: <b>הסוף לא נכלל</b>.');
  const M = [...Array(4)].map((_, r) => [...Array(5)].map((_, c) => r * 5 + c));
  const r1 = V.row(box); r1.style.direction = 'ltr';
  const inp = el('input', { value: 'M[1:3, 1:4]', style: { width: '200px', fontFamily: 'Consolas,monospace' } }); r1.appendChild(inp);
  ['M[1, 2]', 'M[1]', 'M[:, 0]', 'M[1:3, 1:4]', 'M[::2, ::2]', 'M[-1]', 'M[:2, 3:]'].forEach(s => r1.appendChild(V.button(s, () => { inp.value = s; go(); }, 'sm')));
  const st = V.ltrRow(box); const T = V.matrix(st, M);
  const res = V.say(box);
  function rng(s, n) {
    s = s.trim(); if (s === ':' || s === '') return [...Array(n).keys()];
    if (!s.includes(':')) { let i = +s; if (isNaN(i)) throw 0; if (i < 0) i += n; if (i < 0 || i >= n) throw 1; return { single: i }; }
    let [a, b, c] = s.split(':').map(x => x.trim() === '' ? null : +x); c = c || 1;
    if (a === null) a = c > 0 ? 0 : n - 1; if (b === null) b = c > 0 ? n : -n - 1;
    if (a < 0) a += n; if (b < 0) b += n; const out = []; for (let i = a; c > 0 ? i < Math.min(b, n) : i > b; i += c) if (i >= 0 && i < n) out.push(i); return out;
  }
  function go() {
    const m = inp.value.match(/^M\[(.*)\]$/); if (!m) { res.innerHTML = '<span class="err">כתוב בצורה M[...]</span>'; return; }
    try {
      const parts = m[1].split(','); const rr = rng(parts[0], 4); const cc = parts.length > 1 ? rng(parts[1], 5) : [...Array(5).keys()];
      const rows = rr.single !== undefined ? [rr.single] : rr, cols = cc.single !== undefined ? [cc.single] : cc;
      T.cls((r, c) => rows.includes(r) && cols.includes(c) ? 'on' : 'dim');
      const vals = rows.map(r => cols.map(c => M[r][c]));
      const shape = rr.single !== undefined && cc.single !== undefined ? 'מספר בודד' : rr.single !== undefined || cc.single !== undefined ? '(' + (rr.single !== undefined ? cols.length : rows.length) + ',)' : '(' + rows.length + ', ' + cols.length + ')';
      res.innerHTML = 'התוצאה: <span class="mono chip">' + (rr.single !== undefined && cc.single !== undefined ? vals[0][0] : JSON.stringify(rr.single !== undefined ? vals[0] : cc.single !== undefined ? vals.map(v => v[0]) : vals).replace(/,/g, ' ')) + '</span> &nbsp; צורה: <span class="mono chip">' + shape + '</span>';
    } catch (e) { T.cls(() => ''); res.innerHTML = '<span class="err">האינדקס מחוץ לטבלה (4 שורות, 5 עמודות). נסה שוב.</span>'; }
  }
  inp.addEventListener('input', go); go();
};

/* 1.7: boolean mask */
W.w_mask = function (box) {
  V.say(box, 'השוואה על מערך מחזירה "מסכה" של אמת ושקר. הזז את הסף, ואז לחץ "אפס את מה שמסומן".');
  let a = [5, -2, 8, -7, 3]; let th = 0;
  const r = V.row(box); V.slider(r, 'התנאי: a <', -8, 9, 1, th, v => { th = v; draw(); });
  const st = el('div', { style: { direction: 'ltr', textAlign: 'center' } }); box.appendChild(st);
  const l1 = V.ltrRow(st); l1.prepend(el('span', { class: 'mono', style: { width: '60px' } }, 'a')); const A = V.matrix(l1, [a]);
  const l2 = V.ltrRow(st); l2.prepend(el('span', { class: 'mono', style: { width: '60px' } }, 'mask')); const Mk = V.matrix(l2, [a.map(() => '')], { fmt: x => x, w: 58 });
  const out = V.say(box);
  V.btns(box, [['a[mask] = 0', () => { a = a.map(v => v < th ? 0 : v); draw(); }, 'primary'], ['↺ מחדש', () => { a = [5, -2, 8, -7, 3]; draw(); }]]);
  function draw() {
    A.vals([a]); const m = a.map(v => v < th);
    A.cls((r, c) => m[c] ? 'on' : '');
    m.forEach((x, c) => Mk.set(0, c, x ? 'True' : 'False', x ? 'ok' : 'dim'));
    out.innerHTML = 'a[mask] = <span class="mono chip">[' + a.filter((v, i) => m[i]).join(' ') + ']</span> &nbsp; כמה מסומנים: ' + m.filter(Boolean).length + ' &nbsp;<span class="note-small">(בתמונה: <span class="mono">img[img > 200] = 255</span>)</span>';
  }
  draw();
};

/* 1.8: axis collapse */
W.w_axis = function (box) {
  V.say(box, '"הציר שנותנים הוא הציר שנעלם". לחץ על axis=0 או axis=1 ותראה את הטבלה מתקפלת.');
  const M = [[1, 2, 3], [4, 5, 6]];
  const st = V.ltrRow(box); const T = V.matrix(st, M); V.op(st, '→'); const R = el('span'); st.appendChild(R);
  const out = V.say(box);
  function run(ax) {
    R.innerHTML = '';
    if (ax === 0) { T.cls((r) => r === 1 ? 'soft' : 'on'); T.el.style.transition = 'transform .5s'; const res = [0, 1, 2].map(c => M[0][c] + M[1][c]); V.matrix(R, [res]).cls(() => 'ok'); out.innerHTML = 'axis=0: השורות "נופלות" אחת על השנייה ונעלמות. 1+4, 2+5, 3+6 → <span class="mono chip">[5 7 9]</span>, צורה <span class="mono">(3,)</span>.'; }
    else { T.cls((r, c) => c === 0 ? 'on' : 'soft'); const res = M.map(r => r.reduce((a, b) => a + b)); V.matrix(R, res.map(x => [x])).cls(() => 'ok'); out.innerHTML = 'axis=1: העמודות נדחסות לתוך כל שורה ונעלמות. 1+2+3, 4+5+6 → <span class="mono chip">[6 15]</span>, צורה <span class="mono">(2,)</span>.'; }
  }
  V.btns(box, [['M.sum(axis=0)', () => run(0), 'primary'], ['M.sum(axis=1)', () => run(1), 'primary']]);
  out.innerHTML = 'בחר ציר.';
};

/* 1.9: broadcasting visual + rule checker */
W.w_bcast = function (box) {
  V.say(box, 'כשמחברים מערכים בצורות שונות, הקטן "נמתח" לגודל של הגדול. צפה בשורה <span class="mono">[10 20 30]</span> משתכפלת.');
  const M = [[1, 2, 3], [4, 5, 6]], row = [10, 20, 30];
  const st = V.ltrRow(box); const A = V.matrix(st, M); V.op(st, '+'); const B = V.matrix(st, [row, ['', '', '']], { fmt: x => x }); V.op(st, '='); const C = V.matrix(st, [['', '', ''], ['', '', '']], { fmt: x => x });
  B.cls(r => r === 1 ? 'dim' : 'soft');
  V.btns(box, [['▶ מתח ושכפל', () => { B.cls(r => r === 1 ? 'soft' : 'soft'); B.vals([row, row]); setTimeout(() => { C.vals(M.map(r => r.map((v, c) => v + row[c]))); C.cls(() => 'ok'); }, 600); }, 'primary'], ['↺', () => { B.vals([row, ['', '', '']]); B.cls(r => r === 1 ? 'dim' : 'soft'); C.vals([['', '', ''], ['', '', '']]); C.cls(() => ''); }]]);
  box.appendChild(el('hr', { style: { border: 0, borderTop: '1px dashed var(--line2)' } }));
  V.say(box, '<b>בודק הצורות:</b> כתוב שתי צורות, ואני אראה לך איך הכלל עובד, ממד אחרי ממד מהסוף.');
  const r = V.row(box); r.style.direction = 'ltr';
  const s1 = el('input', { value: '(2, 3)', style: { width: '120px' } }), s2 = el('input', { value: '(3,)', style: { width: '120px' } });
  r.append(s1, el('span', {}, ' + '), s2);
  const res = el('div'); box.appendChild(res);
  function check() {
    const p = s => (s.match(/\d+/g) || []).map(Number);
    const a = p(s1.value), b = p(s2.value); const n = Math.max(a.length, b.length);
    const A2 = Array(n - a.length).fill(1).concat(a), B2 = Array(n - b.length).fill(1).concat(b);
    let ok = true; const out = [];
    let h = '<table class="t" style="margin:6px auto"><tr><th></th>' + A2.map((_, i) => '<th>ממד ' + (i + 1) + '</th>').join('') + '</tr><tr><td>א</td>' + A2.map((v, i) => '<td>' + (i < n - a.length ? '<i style="opacity:.5">1 (חסר)</i>' : v) + '</td>').join('') + '</tr><tr><td>ב</td>' + B2.map((v, i) => '<td>' + (i < n - b.length ? '<i style="opacity:.5">1 (חסר)</i>' : v) + '</td>').join('') + '</tr><tr><td></td>';
    for (let i = 0; i < n; i++) { const g = A2[i] === B2[i] || A2[i] === 1 || B2[i] === 1; if (!g) ok = false; out.push(Math.max(A2[i], B2[i])); h += '<td class="' + (g ? 'good' : 'bad') + '">' + (g ? '✓' : '✗') + '</td>'; }
    h += '</tr></table>';
    res.innerHTML = h + '<div class="say" style="text-align:center">' + (ok ? '<span class="good">תקין!</span> צורת התוצאה: <span class="mono chip">(' + out.join(', ') + ')</span>' : '<span class="bad">שגיאה:</span> בממד המסומן ב־✗ הגדלים שונים ואף אחד מהם אינו 1.') + '</div>';
  }
  s1.oninput = s2.oninput = check; check();
};

/* 1.10: function gallery + arange vs linspace on a number line */
W.w_funcs = function (box) {
  V.say(box, 'לחץ על פונקציה ותראה מה היא מייצרת. בסוף יש השוואה בין arange (אתה בוחר <b>צעד</b>) ל־linspace (אתה בוחר <b>כמה נקודות</b>).');
  const res = el('div', { style: { textAlign: 'center', minHeight: '120px' } });
  const items = {
    'np.zeros((2, 3))': [[0, 0, 0], [0, 0, 0]], 'np.ones(5)': [[1, 1, 1, 1, 1]], 'np.eye(3)': [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    'np.arange(0, 1, 0.25)': [[0, .25, .5, .75]], 'np.linspace(0, 1, 5)': [[0, .25, .5, .75, 1]], 'M.T': [[1, 4], [2, 5], [3, 6]], 'M.reshape(3, 2)': [[1, 2], [3, 4], [5, 6]],
  };
  const r = V.row(box); r.style.direction = 'ltr';
  Object.keys(items).forEach(k => r.appendChild(V.button(k, () => { res.innerHTML = ''; const s = el('div', { class: 'note-small mono' }, k); res.appendChild(s); const mm = V.matrix(res, items[k]); if (k === 'np.eye(3)') mm.cls((a, b) => a === b ? 'on' : ''); if (k.startsWith('M.')) res.appendChild(el('div', { class: 'note-small' }, 'כאשר M = [[1 2 3], [4 5 6]]')); }, 'sm')));
  box.appendChild(res);
  const P = V.plane(box, { w: 520, h: 110, x: [-0.1, 2.1], y: [-1, 1], grid: false, axes: false });
  let step = 0.25, num = 5, stop = 1;
  const r2 = V.row(box);
  V.slider(r2, 'סוף', 0.5, 2, 0.25, stop, v => { stop = v; draw(); });
  V.slider(r2, 'arange צעד', 0.1, 0.5, 0.05, step, v => { step = v; draw(); });
  V.slider(r2, 'linspace נקודות', 2, 12, 1, num, v => { num = v; draw(); });
  function draw() {
    P.clear(); P.line(0, 0.4, 2, 0.4, 'var(--line2)', 2); P.line(0, -0.4, 2, -0.4, 'var(--line2)', 2);
    for (let x = 0; x <= 2; x += 0.5) { P.text(x, 0.75, V.fmt(x), 'var(--ink3)', 10); }
    P.text(1.05, 0.95, '', 'var(--ink3)');
    const ar = []; for (let x = 0; x < stop - 1e-9; x += step) ar.push(x);
    ar.forEach(x => P.dot(x, 0.4, 6, 'var(--c1)'));
    for (let i = 0; i < num; i++) P.dot(stop * i / (num - 1), -0.4, 6, 'var(--c2)');
    P.dot(stop, 0.4, 7, 'none').setAttribute('style', 'fill:none;stroke:var(--c1);stroke-width:2');
    P.text(2.05, 0.35, 'arange', 'var(--c1)', 11, 'end'); P.text(2.05, -0.45, 'linspace', 'var(--c2)', 11, 'end');
  }
  V.legend(box, [['var(--c1)', 'arange(0, סוף, צעד): הסוף לא נכלל (העיגול הריק)'], ['var(--c2)', 'linspace(0, סוף, נקודות): כולל את שני הקצוות']]);
  draw();
};

/* exercise helpers chapter 1 */
W.x1_2 = function (box) {
  V.ask(box, 'מה יהיה <span class="mono">a * 2</span> כאשר <span class="mono">a = np.array([200, 100, 50], dtype=np.uint8)</span>? כתוב שלושה מספרים.', s => { const n = V.nums(s); return n.length === 3 && n[0] === 144 && n[1] === 200 && n[2] === 100; }, 'בדיוק! 400 גלש ל־400 − 256 = 144.', 'רמז: 200 · 2 = 400, וזה לא נכנס ב־uint8.');
};
W.x1_4 = function (box) {
  const qs = [['(4, 1) ו־(3,)', '(4, 3)'], ['(5, 3) ו־(5,)', 'שגיאה'], ['(2, 1, 3) ו־(4, 3)', '(2, 4, 3)']];
  qs.forEach(([q, a]) => V.quiz(box, 'מה התוצאה של שידור ' + q + '?', ['(4, 3)', '(2, 4, 3)', '(5, 3)', 'שגיאה'], ['(4, 3)', '(2, 4, 3)', '(5, 3)', 'שגיאה'].indexOf(a), 'השוואה מהסוף להתחלה.'));
};
W.x1_5 = function (box) {
  const sc = [72, 95, 60, 88, 81, 55, 99, 70];
  const mean = sc.reduce((a, b) => a + b) / sc.length;
  V.say(box, 'ציונים: <span class="mono">' + sc.join(', ') + '</span>. הממוצע הוא ' + mean + '. לחץ על הציונים שגדולים מהממוצע. זה בדיוק מה ש־<span class="mono">scores > scores.mean()</span> עושה.');
  const st = V.ltrRow(box); const M = V.matrix(st, [sc]);
  const fb = V.say(box);
  const picked = new Set();
  M.cells[0].forEach((c, i) => { c.style.cursor = 'pointer'; c.onclick = () => { picked.has(i) ? picked.delete(i) : picked.add(i); c.className = 'cell ' + (picked.has(i) ? 'on' : ''); const right = sc.map((v, k) => v > mean === picked.has(k)).every(Boolean); fb.innerHTML = right ? '<span class="good">✓ מושלם! .sum() על המסכה סופר True כ־1: התשובה ' + picked.size + '.</span>' : 'סימנת ' + picked.size + '.'; }; });
};

/* ===== chapter 2: vectors ===== */
W.w_vec_faces = function (box) {
  V.say(box, 'וקטור אחד, שני פרצופים. <b>גרור את קצה החץ</b>: הרשימה משתנה יחד איתו. ולמטה: פיקסל הוא גם וקטור, ושלושת המספרים שלו הם צבע.');
  const r = V.row(box); r.style.justifyContent = 'center'; r.style.alignItems = 'center';
  const P = V.plane(r, { w: 300, h: 300, x: [-1, 6], y: [-1, 6] });
  const list = el('div', { class: 'big mono', style: { minWidth: '160px', textAlign: 'center' } }); r.appendChild(list);
  let v = [3, 2];
  function draw() { P.clear(); P.line(0, 0, v[0], 0, 'var(--c2)', 2, '4 4'); P.line(v[0], 0, v[0], v[1], 'var(--c3)', 2, '4 4'); P.arrow(0, 0, v[0], v[1], 'var(--c1)', 3.5, 'v'); list.innerHTML = 'v = (<span style="color:var(--c2)">' + V.fmt(v[0]) + '</span>, <span style="color:var(--c3)">' + V.fmt(v[1]) + '</span>)<div class="note-small" style="direction:rtl">' + V.fmt(v[0]) + ' ימינה, ' + V.fmt(v[1]) + ' למעלה</div>'; }
  P.handle(v[0], v[1], 'var(--c1)', (x, y) => { v = [x, y]; draw(); }); draw();
  const r2 = V.row(box); let rgb = [40, 140, 255];
  const sw = el('div', { style: { width: '70px', height: '50px', borderRadius: '10px', border: '1px solid var(--line)' } });
  const lab = el('span', { class: 'mono big' });
  ['כחול', 'ירוק', 'אדום'].forEach((n, i) => V.slider(r2, n, 0, 255, 1, [rgb[0], rgb[1], rgb[2]][i], x => { rgb[i] = x; paint(); }));
  const r3 = V.row(box); r3.append(sw, lab);
  function paint() { sw.style.background = `rgb(${rgb[2]},${rgb[1]},${rgb[0]})`; lab.textContent = '(' + rgb.join(', ') + ')'; }
  paint();
};

W.w_vec_add = function (box) {
  V.say(box, 'גרור את a ואת b. החץ הסגול הוא a + b: "לך לפי a, ומשם לפי b". הסליידר מותח את b בסקלר. למטה יש דוגמת מעקב: ניבוי מיקום עם p + t·v.');
  const P = V.plane(box, { w: 420, h: 380, x: [-6, 8], y: [-5, 8] });
  let a = [3, 2], b = [1, 4], k = 1;
  const r = V.row(box); V.slider(r, 'סקלר על b', -2, 3, 0.5, k, x => { k = x; draw(); });
  const out = V.say(box);
  function draw() {
    P.clear(); const kb = [b[0] * k, b[1] * k]; const s = [a[0] + kb[0], a[1] + kb[1]];
    P.arrow(0, 0, a[0], a[1], 'var(--c1)', 3, 'a'); P.arrow(a[0], a[1], s[0], s[1], 'var(--c2)', 3, k === 1 ? 'b' : V.fmt(k) + 'b');
    P.arrow(0, 0, kb[0], kb[1], 'var(--c2)', 1.5); P.arrow(0, 0, s[0], s[1], 'var(--c4)', 3.5, 'a+' + (k === 1 ? '' : V.fmt(k)) + 'b');
    out.innerHTML = '<span class="mono">(' + a.map(V.fmt) + ') + ' + (k === 1 ? '' : V.fmt(k) + '·') + '(' + b.map(V.fmt) + ') = (' + s.map(V.fmt) + ')</span>' + (k < 0 ? ' &nbsp;← סקלר שלילי הופך את הכיוון!' : '');
  }
  P.handle(a[0], a[1], 'var(--c1)', (x, y) => { a = [x, y]; draw(); });
  P.handle(b[0], b[1], 'var(--c2)', (x, y) => { b = [x, y]; draw(); });
  draw();
  box.appendChild(el('hr', { style: { border: 0, borderTop: '1px dashed var(--line2)' } }));
  V.say(box, '<b>מעקב אחרי מטרה:</b> p = (100, 50), מהירות v = (4, −1) פיקסלים לפריים. גרור את הזמן.');
  const P2 = V.plane(box, { w: 420, h: 160, x: [95, 125], y: [44, 54], step: 5, labelStep: 5 });
  V.slider(V.row(box), 'פריים', 0, 6, 1, 3, t => trk(t)); const o2 = V.say(box);
  function trk(t) { P2.clear(); for (let i = 0; i <= 6; i++) P2.dot(100 + 4 * i, 50 - i, 3, 'var(--line2)'); P2.arrow(100, 50, 100 + 4 * t, 50 - t, 'var(--c3)', 3); P2.dot(100, 50, 6, 'var(--c1)'); P2.dot(100 + 4 * t, 50 - t, 7, 'var(--c2)'); o2.innerHTML = '<span class="mono">p + ' + t + 'v = (' + (100 + 4 * t) + ', ' + (50 - t) + ')</span>' + (t === 3 ? ' ← בדיוק הדוגמה מהטקסט. זה שלב החיזוי של מסנן קלמן (מודול 5).' : ''); }
  trk(3);
};

W.w_norm = function (box) {
  V.say(box, 'גרור את הווקטור. האורך שלו הוא היתר במשולש, לפי פיתגורס: הריבוע הגדול שווה לסכום שני הריבועים הקטנים. לחץ "נרמל" ותראה אותו מתכווץ לאורך 1 על מעגל היחידה.');
  const P = V.plane(box, { w: 420, h: 420, x: [-2, 7], y: [-2, 7] });
  let v = [3, 4], unit = false;
  const out = V.say(box);
  function draw() {
    P.clear(); const L = Math.hypot(v[0], v[1]);
    P.fn(() => NaN); const circ = []; for (let i = 0; i <= 64; i++) circ.push([Math.cos(i / 64 * 2 * Math.PI), Math.sin(i / 64 * 2 * Math.PI)]); P.path(circ, 'var(--line2)', 1.5, '4 4');
    if (!unit) { P.poly([[0, 0], [v[0], 0], [v[0], -v[0]], [0, -v[0]]], 'var(--c2)', 'var(--c2)', .15); P.poly([[v[0], 0], [v[0], v[1]], [v[0] + v[1], v[1]], [v[0] + v[1], 0]], 'var(--c3)', 'var(--c3)', .15); }
    const w = unit ? [v[0] / L, v[1] / L] : v;
    P.line(0, 0, w[0], 0, 'var(--c2)', 2); P.line(w[0], 0, w[0], w[1], 'var(--c3)', 2);
    P.arrow(0, 0, w[0], w[1], 'var(--c1)', 3.5, unit ? 'v/‖v‖' : 'v');
    out.innerHTML = unit ? 'וקטור יחידה: <span class="mono">(' + V.fmt(v[0] / L) + ', ' + V.fmt(v[1] / L) + ')</span>. אורך 1, אותו כיוון.' : '‖v‖ = √(<span style="color:var(--c2)">' + V.fmt(v[0]) + '²</span> + <span style="color:var(--c3)">' + V.fmt(v[1]) + '²</span>) = √' + V.fmt(v[0] ** 2 + v[1] ** 2) + ' = <b>' + V.fmt(L) + '</b>';
  }
  P.handle(v[0], v[1], 'var(--c1)', (x, y) => { v = [x, y]; unit = false; btn.textContent = 'נרמל'; draw(); });
  const btn = V.button('נרמל', () => { unit = !unit; btn.textContent = unit ? 'בטל נרמול' : 'נרמל'; draw(); }, 'primary'); V.row(box).appendChild(btn);
  draw();
};

W.w_dot = function (box) {
  V.say(box, 'גרור את a ואת b וצפה במכפלה הסקלרית: <b style="color:var(--c3)">חיובית</b> כשהם באותו כיוון, <b>אפס</b> כשהם מאונכים, <b style="color:var(--c2)">שלילית</b> כשהם הפוכים.');
  const r = V.row(box); r.style.alignItems = 'flex-start'; r.style.justifyContent = 'center';
  const P = V.plane(r, { w: 360, h: 360, x: [-5, 5], y: [-5, 5] });
  const side = el('div', { style: { minWidth: '220px' } }); r.appendChild(side);
  let a = [3, 1], b = [1, 3];
  function draw() {
    P.clear(); const d = a[0] * b[0] + a[1] * b[1]; const La = Math.hypot(...a), Lb = Math.hypot(...b);
    const cos = d / (La * Lb || 1), ang = Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI;
    const col = Math.abs(d) < 0.25 ? 'var(--ink3)' : d > 0 ? 'var(--c3)' : 'var(--c2)';
    const a0 = Math.atan2(a[1], a[0]), a1 = Math.atan2(b[1], b[0]);
    let da = a1 - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    const arc = []; for (let i = 0; i <= 30; i++) { const t = a0 + da * i / 30; arc.push([Math.cos(t) * 1.1, Math.sin(t) * 1.1]); } P.path(arc, col, 2);
    P.arrow(0, 0, a[0], a[1], 'var(--c1)', 3.5, 'a'); P.arrow(0, 0, b[0], b[1], 'var(--c4)', 3.5, 'b');
    side.innerHTML = `<div class="mono" style="direction:ltr">a·b = ${V.fmt(a[0])}·${V.fmt(b[0])} + ${V.fmt(a[1])}·${V.fmt(b[1])}</div><div class="big mono" style="color:${col};direction:ltr">= ${V.fmt(d)}</div>
      <div style="margin-top:8px">זווית: <b>${V.fmt(ang, 0)}°</b></div><div>cos θ = <b>${V.fmt(cos)}</b> <span class="note-small">(דמיון קוסינוס)</span></div>
      <div style="margin-top:6px;height:12px;background:var(--line);border-radius:6px;position:relative"><div style="position:absolute;top:0;bottom:0;${cos >= 0 ? 'right:50%' : 'left:50%'};width:${Math.abs(cos) * 50}%;background:${col};border-radius:6px"></div></div>
      <div class="note-small" style="display:flex;justify-content:space-between"><span>1</span><span>0</span><span>−1</span></div>
      <div style="margin-top:8px">${Math.abs(d) < 0.25 ? 'מאונכים: "לא קשורים" זה לזה.' : d > 0 ? 'מצביעים בערך לאותו כיוון.' : 'מצביעים לכיוונים הפוכים.'}</div>`;
  }
  P.handle(a[0], a[1], 'var(--c1)', (x, y) => { a = [x, y]; draw(); });
  P.handle(b[0], b[1], 'var(--c4)', (x, y) => { b = [x, y]; draw(); });
  draw();
  box.appendChild(el('hr', { style: { border: 0, borderTop: '1px dashed var(--line2)' } }));
  V.say(box, '<b>צעד אחר צעד:</b> (1, 2, 3) · (4, 5, 6): מכפילים זוג אחרי זוג, ומסכמים.');
  const st = V.ltrRow(box); const A = V.matrix(st, [[1, 2, 3]]); V.op(st, '·'); const B = V.matrix(st, [[4, 5, 6]]); V.op(st, '='); const S = el('span', { class: 'big mono' }); st.appendChild(S);
  V.stepper(box, 4, k => { A.cls((r, c) => c === k - 1 ? 'on' : c < k - 1 ? 'soft' : ''); B.cls((r, c) => c === k - 1 ? 'on' : c < k - 1 ? 'soft' : ''); const parts = [4, 10, 18].slice(0, k); S.textContent = k ? parts.join(' + ') + ' = ' + parts.reduce((x, y) => x + y, 0) : '?'; }, { speed: 900 });
};

W.w_proj = function (box) {
  V.say(box, 'דמיין פנס שמאיר ישר מלמעלה על הקו של u. ה"צל" של a על הקו הוא a · u. גרור את a, ושנה את כיוון u.');
  const P = V.plane(box, { w: 420, h: 360, x: [-2, 7], y: [-2, 6] });
  let a = [5, 2], ang = 0;
  V.slider(V.row(box), 'כיוון u (מעלות)', -60, 90, 5, ang, x => { ang = x; draw(); });
  const out = V.say(box);
  function draw() {
    P.clear(); const u = [Math.cos(ang * Math.PI / 180), Math.sin(ang * Math.PI / 180)]; const d = a[0] * u[0] + a[1] * u[1];
    P.line(-u[0] * 3, -u[1] * 3, u[0] * 9, u[1] * 9, 'var(--line2)', 1.5, '5 4');
    const pr = [u[0] * d, u[1] * d];
    P.line(a[0], a[1], pr[0], pr[1], 'var(--c5)', 2, '3 3');
    P.line(0, 0, pr[0], pr[1], 'var(--c5)', 7).style.opacity = .55;
    P.arrow(0, 0, a[0], a[1], 'var(--c1)', 3, 'a'); P.arrow(0, 0, u[0], u[1], 'var(--c4)', 3, 'u');
    out.innerHTML = 'אורך הצל: <span class="mono">a · u = ' + V.fmt(d) + '</span>' + (ang === 0 ? ' ← "כמה מהתנועה היא ימינה": (5, 2) · (1, 0) = 5' : '');
  }
  P.handle(a[0], a[1], 'var(--c1)', (x, y) => { a = [x, y]; draw(); }); draw();
};

W.w_lincomb = function (box) {
  V.say(box, '<b>משחק:</b> הגע לכוכב ★ רק בעזרת שני וקטורי הבסיס. הזז את c₁ ואת c₂. כל נקודה במישור היא c₁·(1, 0) + c₂·(0, 1).');
  const P = V.plane(box, { w: 400, h: 400, x: [-8, 8], y: [-8, 8], labelStep: 2 });
  let c1 = 2, c2 = 1; let target = [7, -2];
  const r = V.row(box);
  const s1 = V.slider(r, 'c₁', -8, 8, 1, c1, x => { c1 = x; draw(); }); const s2 = V.slider(r, 'c₂', -8, 8, 1, c2, x => { c2 = x; draw(); });
  const out = V.say(box);
  V.btns(box, [['★ כוכב חדש', () => { target = [Math.round(Math.random() * 14 - 7), Math.round(Math.random() * 14 - 7)]; draw(); }]]);
  function draw() {
    P.clear(); P.text(target[0], target[1] - 0.35, '★', 'var(--c5)', 26);
    P.arrow(0, 0, c1, 0, 'var(--c1)', 3, 'c₁e₁'); P.arrow(c1, 0, c1, c2, 'var(--c3)', 3, 'c₂e₂');
    P.dot(c1, c2, 6, 'var(--c4)');
    const hit = c1 === target[0] && c2 === target[1];
    out.innerHTML = '<span class="mono">' + c1 + '·(1, 0) + ' + c2 + '·(0, 1) = (' + c1 + ', ' + c2 + ')</span> ' + (hit ? '<span class="good"> פגעת בכוכב! בדיוק כמו (7, −2) = 7·(1, 0) + (−2)·(0, 1).</span>' : '');
  }
  draw();
};

W.w_gray = function (box) {
  V.say(box, 'המרה לאפור היא מכפלה סקלרית: (כחול, ירוק, אדום) · (0.114, 0.587, 0.299). הירוק מקבל הכי הרבה משקל כי העין רגישה אליו. שחק עם הצבע וראה את הבהירות שיוצאת.');
  let c = [50, 200, 80];
  const r = V.row(box);
  ['כחול', 'ירוק', 'אדום'].forEach((n, i) => V.slider(r, n, 0, 255, 1, c[i], x => { c[i] = x; draw(); }));
  const st = V.row(box); st.style.justifyContent = 'center';
  const a = el('div', { style: { width: '90px', height: '70px', borderRadius: '12px', border: '1px solid var(--line)' } }), b = el('div', { style: { width: '90px', height: '70px', borderRadius: '12px', border: '1px solid var(--line)' } });
  const eq = el('div', { class: 'mono', style: { direction: 'ltr' } });
  st.append(a, el('span', { class: 'big' }, '→'), b, eq);
  function draw() { const g = 0.114 * c[0] + 0.587 * c[1] + 0.299 * c[2]; a.style.background = `rgb(${c[2]},${c[1]},${c[0]})`; b.style.background = `rgb(${g},${g},${g})`; eq.innerHTML = `0.114·${c[0]} + 0.587·${c[1]} + 0.299·${c[2]}<br><b>= ${V.fmt(g, 1)}</b>`; }
  draw();
};

W.x2_1 = function (box) {
  V.ask(box, 'כתוב את התוצאה של (2, −1) + 3·(1, 4):', s => { const n = V.nums(s.replace(/−/g, '-')); return n[0] === 5 && n[1] === 11; }, 'נכון: (2, −1) + (3, 12) = (5, 11)');
  V.ask(box, 'ומה האורך של (6, 8)?', s => V.nums(s)[0] === 10, 'נכון: √(36 + 64) = 10');
};
W.x2_2 = function (box) { V.quiz(box, 'המכפלה של (1, 2) ו־(−2, 1) היא −2 + 2 = 0. מה זה אומר על הזווית?', ['0°', '45°', '90°', '180°'], 2, 'מכפלה סקלרית אפס פירושה מאונכים.'); W.w_dot && null; };
W.x2_3 = function (box) {
  V.ask(box, 'מטרה ב־(200, 120) עם מהירות (−3, 2). איפה היא אחרי 10 פריימים?', s => { const n = V.nums(s); return n[0] === 170 && n[1] === 140; }, 'נכון: (200, 120) + 10·(−3, 2) = (170, 140)');
};

/* ===== chapter 3: matrices ===== */
W.w_matidx = function (box) {
  V.say(box, 'מטריצה היא טבלה עם m שורות ו־n עמודות. לחץ על משבצת: היא תגיד לך את השם שלה, Aᵢⱼ (קודם שורה, אחר כך עמודה).');
  const A = [[2, 7, 1, 8], [3, 1, 4, 1], [5, 9, 2, 6]];
  const st = V.ltrRow(box); const M = V.matrix(st, A); const out = V.say(box, 'מטריצה מגודל 3 על 4.');
  M.cells.forEach((row, i) => row.forEach((c, j) => { c.style.cursor = 'pointer'; c.onclick = () => { M.cls((r, cc) => r === i && cc === j ? 'on' : r === i || cc === j ? 'soft' : ''); out.innerHTML = `שורה i = ${i + 1}, עמודה j = ${j + 1}: <b>A<sub>${i + 1}${j + 1}</sub> = ${A[i][j]}</b>. בג׳אווה: <span class="mono">A[${i}][${j}]</span>, ובספריית המערכים: <span class="mono">A[${i}, ${j}]</span> (סופרים מאפס).`; }; }));
};

W.w_matvec = function (box) {
  V.say(box, 'כפל מטריצה בווקטור, צעד אחר צעד. בחר דרך: <b>שורות</b> (כל שורה היא מכפלה סקלרית) או <b>עמודות</b> (צירוף של העמודות). התוצאה אותה תוצאה!');
  const A = [[2, 1], [0, 3]], v = [4, 5];
  let mode = 0;
  V.tabs(box, ['דרך א׳: שורות', 'דרך ב׳: עמודות'], i => { mode = i; sp.go(0); });
  const st = V.ltrRow(box); const M = V.matrix(st, A); V.op(st, '×'); const Vv = V.matrix(st, v.map(x => [x])); V.op(st, '='); const R = V.matrix(st, [['?'], ['?']], { fmt: x => x });
  const calc = el('div', { class: 'mono', style: { textAlign: 'center', minHeight: '28px', direction: 'ltr', fontSize: '1.05em' } }); box.appendChild(calc);
  const say = V.say(box);
  const P = V.plane(box, { w: 340, h: 300, x: [-1, 16], y: [-1, 16], step: 1, labelStep: 5 });
  const rowsSteps = [
    { s: 'כל רכיב בתוצאה בא משורה אחת של המטריצה. לחץ "הבא".' },
    { r: 0, k: 0, s: 'שורה ראשונה, איבר ראשון: 2 · 4' }, { r: 0, k: 1, s: 'ועוד 1 · 5. השורה הראשונה נותנת 13.' },
    { r: 1, k: 0, s: 'שורה שנייה: 0 · 4' }, { r: 1, k: 1, s: 'ועוד 3 · 5 = 15. התוצאה (13, 15).' }];
  const colSteps = [
    { s: 'עכשיו נסתכל על העמודות: העמודה הראשונה היא המקום שאליו נוחת (1, 0), והשנייה היא המקום של (0, 1).' },
    { c: 0, s: '4 פעמים העמודה הראשונה: 4 · (2, 0) = (8, 0)' }, { c: 1, s: 'ועוד 5 פעמים העמודה השנייה: 5 · (1, 3) = (5, 15)' },
    { c: 2, s: 'הסכום: (8, 0) + (5, 15) = (13, 15). אותה תוצאה, והפעם רואים אותה כחצים.' }];
  const sp = V.stepper(box, () => mode ? colSteps.length : rowsSteps.length, i => {
    P.clear();
    if (!mode) {
      const s = rowsSteps[i]; say.innerHTML = s.s; Vv.cls(() => ''); M.cls(() => '');
      R.vals([[i >= 2 ? (i >= 2 ? 13 : '?') : (i === 1 ? '8…' : '?')], [i === 4 ? 15 : i === 3 ? '0…' : '?']]);
      if (s.r !== undefined) { M.cls((r, c) => r === s.r ? (c === s.k ? 'on' : 'soft') : 'dim'); Vv.cls((r) => r === s.k ? 'on' : ''); }
      R.cls((r) => (i >= 2 && r === 0) || (i === 4 && r === 1) ? 'ok' : '');
      calc.textContent = s.r === undefined ? '' : s.r === 0 ? (s.k === 0 ? '2·4 = 8' : '2·4 + 1·5 = 13') : (s.k === 0 ? '0·4 = 0' : '0·4 + 3·5 = 15');
      P.arrow(0, 0, 4, 5, 'var(--ink3)', 2, 'v'); if (i === 4) P.arrow(0, 0, 13, 15, 'var(--c3)', 3.5, 'Av');
    } else {
      const s = colSteps[i]; say.innerHTML = s.s; R.vals([[i === 3 ? 13 : '?'], [i === 3 ? 15 : '?']]); R.cls(() => i === 3 ? 'ok' : '');
      M.cls((r, c) => s.c === 0 ? (c === 0 ? 'on' : 'dim') : s.c === 1 ? (c === 1 ? 'on' : 'dim') : ''); Vv.cls(r => s.c === r ? 'on' : '');
      calc.textContent = ['', '4·(2, 0) = (8, 0)', '5·(1, 3) = (5, 15)', '(8, 0) + (5, 15) = (13, 15)'][i];
      P.arrow(0, 0, 2, 0, 'var(--c1)', 2, 'col₁'); P.arrow(0, 0, 1, 3, 'var(--c2)', 2, 'col₂');
      if (i >= 1) P.arrow(0, 0, 8, 0, 'var(--c1)', 3.5, '4·col₁');
      if (i >= 2) P.arrow(8, 0, 13, 15, 'var(--c2)', 3.5, '5·col₂');
      if (i === 3) P.arrow(0, 0, 13, 15, 'var(--c3)', 4, 'Av');
    }
  });
};

W.w_transform = function (box) {
  V.say(box, 'כל מטריצה 2×2 היא "מכונה" שמעוותת את כל המישור. בחר טרנספורמציה, או שנה את ארבעת המספרים בעצמך. החץ <b style="color:var(--c2)">האדום</b> הוא העמודה הראשונה, לאן ש־(1, 0) נוחת. החץ <b style="color:var(--c3)">הירוק</b> הוא העמודה השנייה, לאן ש־(0, 1) נוחת.');
  let M = [[1, 0], [0, 1]], theta = 30;
  const presets = { 'יחידה I': () => [[1, 0], [0, 1]], 'הגדלה S': () => [[2, 0], [0, 0.5]], 'סיבוב R(θ)': () => V.rot(theta), 'גזירה H': () => [[1, 0.5], [0, 1]], 'שיקוף F': () => [[-1, 0], [0, 1]] };
  let cur = 'יחידה I';
  V.tabs(box, Object.keys(presets), (i, l) => { cur = l; anim(presets[l]()); });
  const thS = V.slider(V.row(box), 'θ לסיבוב', -180, 180, 5, theta, x => { theta = x; if (cur === 'סיבוב R(θ)') { M = V.rot(theta); sync(); draw(); } });
  const r = V.row(box); r.style.alignItems = 'flex-start'; r.style.justifyContent = 'center';
  const P = V.plane(r, { w: 380, h: 380, x: [-3.5, 3.5], y: [-3.5, 3.5] });
  const side = el('div', { style: { direction: 'ltr', textAlign: 'center' } }); r.appendChild(side);
  const ins = [[0, 0], [0, 0]].map((row, i) => row.map((_, j) => { const inp = el('input', { type: 'number', step: 0.1, style: { width: '64px', textAlign: 'center' } }); inp.oninput = () => { M[i][j] = +inp.value || 0; draw(); }; return inp; }));
  const g = el('div', { class: 'bracket' }, el('div', { style: { display: 'grid', gridTemplateColumns: 'auto auto', gap: '6px' } }, ins[0][0], ins[0][1], ins[1][0], ins[1][1]));
  side.append(el('div', { class: 'note-small' }, 'M ='), g); const info = el('div', { class: 'note-small', style: { marginTop: '8px', direction: 'rtl' } }); side.appendChild(info);
  function sync() { ins.forEach((row, i) => row.forEach((inp, j) => inp.value = V.fmt(M[i][j], 2).replace('−', '-'))); }
  function F(p) { return V.mul2(M, p); }
  function draw() {
    P.clear();
    for (let k = -4; k <= 4; k++) { const a = []; const b = []; for (let t = -4; t <= 4; t += 0.5) { a.push(F([k, t])); b.push(F([t, k])); } P.path(a, 'var(--c1)', k === 0 ? 1.6 : 0.8).style.opacity = .5; P.path(b, 'var(--c1)', k === 0 ? 1.6 : 0.8).style.opacity = .5; }
    // the letter F to show orientation
    const shape = [[0, 0], [0, 2], [1.2, 2], [1.2, 1.6], [0.4, 1.6], [0.4, 1.15], [1, 1.15], [1, 0.75], [0.4, 0.75], [0.4, 0]];
    P.poly(shape, 'var(--c4)', 'var(--c4)', .1).style.opacity = .5;
    P.poly(shape.map(F), 'var(--c4)', 'var(--c4)', .35);
    P.poly([[0, 0], [1, 0], [1, 1], [0, 1]].map(F), 'var(--c5)', 'var(--c5)', .25);
    const e1 = F([1, 0]), e2 = F([0, 1]);
    P.arrow(0, 0, e1[0], e1[1], 'var(--c2)', 3.5, '(1,0)→'); P.arrow(0, 0, e2[0], e2[1], 'var(--c3)', 3.5, '(0,1)→');
    const d = V.det2(M);
    info.innerHTML = 'עמודה ראשונה (' + V.fmt(M[0][0]) + ', ' + V.fmt(M[1][0]) + '), עמודה שנייה (' + V.fmt(M[0][1]) + ', ' + V.fmt(M[1][1]) + ').<br>השטח של הריבוע הצהוב גדל פי <b>' + V.fmt(d) + '</b> (הדטרמיננטה, סעיף 3.7)' + (d < 0 ? ', והאות F מתהפכת' : '') + '.';
  }
  let at;
  function anim(T) { cancelAnimationFrame(at); const A0 = M.map(r => r.slice()); let t = 0; const step = () => { t = Math.min(1, t + 0.05); M = A0.map((r, i) => r.map((v, j) => v + (T[i][j] - v) * (1 - Math.cos(t * Math.PI)) / 2)); sync(); draw(); if (t < 1) at = requestAnimationFrame(step); }; step(); }
  sync(); draw();
};

W.w_compose = function (box) {
  V.say(box, '<b>הסדר משנה!</b> בחר מה קודם: סיבוב ב־90° (R) או מתיחה אופקית פי 2 (S). קרא מימין לשמאל: בביטוי S·R·v, קודם R ואחר כך S.');
  const R = V.rot(90), S = [[2, 0], [0, 1]];
  const r = V.row(box); r.style.justifyContent = 'center';
  const mk = (title, A, B) => { const c = el('div', { style: { textAlign: 'center' } }); c.appendChild(el('div', { class: 'note-small', html: title })); const P = V.plane(c, { w: 260, h: 260, x: [-3, 3], y: [-3, 3] }); r.appendChild(c); return P; };
  const P1 = mk('קודם סיבוב, אחר כך מתיחה: <span class="mono">S @ R</span>'), P2 = mk('קודם מתיחה, אחר כך סיבוב: <span class="mono">R @ S</span>');
  const shape = [[0, 0], [0, 2], [1.2, 2], [1.2, 1.6], [0.4, 1.6], [0.4, 1.15], [1, 1.15], [1, 0.75], [0.4, 0.75], [0.4, 0]];
  let t = 0;
  V.slider(V.row(box), 'התקדמות', 0, 2, 0.05, 0, x => { t = x; draw(); });
  function lerp(A, k) { return [[1 + (A[0][0] - 1) * k, A[0][1] * k], [A[1][0] * k, 1 + (A[1][1] - 1) * k]]; }
  function stage(first, second, k) { const a = Math.min(1, k), b = Math.max(0, k - 1); const F1 = first === R ? V.rot(90 * a) : lerp(first, a); const F2 = second === R ? V.rot(90 * b) : lerp(second, b); return p => V.mul2(F2, V.mul2(F1, p)); }
  function draw() {
    [[P1, R, S], [P2, S, R]].forEach(([P, A, B]) => { P.clear(); P.poly(shape, 'var(--line2)', 'var(--line2)', .15); const f = stage(A, B, t); P.poly(shape.map(f), 'var(--c4)', 'var(--c4)', .4); });
  }
  draw();
  box.appendChild(el('hr', { style: { border: 0, borderTop: '1px dashed var(--line2)' } }));
  V.say(box, '<b>איך מחשבים AB:</b> כל משבצת בתוצאה היא מכפלה סקלרית של שורה מ־A עם עמודה מ־B. זה בדיוק ה־matmul האיטי עם שלוש הלולאות.');
  const A = [[1, 2], [3, 4]], B = [[5, 6], [7, 8]], C = V.mm(A, B);
  const st = V.ltrRow(box); const MA = V.matrix(st, A); V.op(st, '@'); const MB = V.matrix(st, B); V.op(st, '='); const MC = V.matrix(st, [['', ''], ['', '']], { fmt: x => x });
  const calc = el('div', { class: 'mono', style: { textAlign: 'center', direction: 'ltr' } }); box.appendChild(calc);
  V.stepper(box, 5, k => {
    MC.vals([[k > 0 ? C[0][0] : '', k > 1 ? C[0][1] : ''], [k > 2 ? C[1][0] : '', k > 3 ? C[1][1] : '']]);
    if (!k) { MA.cls(() => ''); MB.cls(() => ''); MC.cls(() => ''); calc.textContent = ''; return; }
    const i = Math.floor((k - 1) / 2), j = (k - 1) % 2;
    MA.cls((r) => r === i ? 'on' : 'dim'); MB.cls((r, c) => c === j ? 'on' : 'dim'); MC.cls((r, c) => r === i && c === j ? 'ok' : '');
    calc.textContent = `C[${i},${j}] = ${A[i][0]}·${B[0][j]} + ${A[i][1]}·${B[1][j]} = ${C[i][j]}`;
  }, { speed: 1300 });
};

W.w_transpose = function (box) {
  V.say(box, 'שחלוף מסובב את המטריצה סביב האלכסון: השורות הופכות לעמודות. לחץ "שחלף" וצפה בכל מספר עובר למקום החדש שלו.');
  const A = [[1, 2, 3], [4, 5, 6]];
  const stage = el('div', { style: { position: 'relative', height: '170px', width: '260px', margin: '0 auto', direction: 'ltr' } }); box.appendChild(stage);
  const cells = []; A.forEach((r, i) => r.forEach((v, j) => { const c = el('div', { class: 'cell', style: { position: 'absolute', width: '44px', transition: 'all .8s ease', left: (j * 52 + 40) + 'px', top: (i * 46 + 30) + 'px', background: i === j ? 'var(--accent-bg)' : '' } }, String(v)); c.dataset.i = i; c.dataset.j = j; stage.appendChild(c); cells.push(c); }));
  let tr = false; const out = V.say(box, 'A: צורה (2, 3)');
  V.btns(box, [['⤡ שחלף', () => { tr = !tr; cells.forEach(c => { const i = +c.dataset.i, j = +c.dataset.j; const [r, k] = tr ? [j, i] : [i, j]; c.style.left = (k * 52 + 40) + 'px'; c.style.top = (r * 46 + 30) + 'px'; }); out.innerHTML = tr ? 'Aᵀ: צורה (3, 2). שים לב: האלכסון (1, 5) נשאר במקום.' : 'A: צורה (2, 3)'; }, 'primary']]);
};

W.w_inverse = function (box) {
  V.say(box, 'מטריצה הפוכה "מבטלת את המכונה". הפעל את M ואז את M⁻¹, ותחזור לנקודת ההתחלה. נסה גם את המטריצה הסינגולרית: היא מועכת את המישור לקו, ואי אפשר לחזור.');
  const mats = { 'סיבוב 30°': V.rot(30), 'הגדלה פי 2': [[2, 0], [0, 2]], 'A = [[2,1],[1,3]]': [[2, 1], [1, 3]], 'סינגולרית (1,2),(2,4)': [[1, 2], [2, 4]] };
  let M = mats['סיבוב 30°'], k = 0;
  V.tabs(box, Object.keys(mats), (i, l) => { M = mats[l]; sl.set(0); k = 0; draw(); });
  const P = V.plane(box, { w: 380, h: 380, x: [-4, 4], y: [-4, 4] });
  const sl = V.slider(V.row(box), 'M ← → M⁻¹', 0, 2, 0.05, 0, x => { k = x; draw(); });
  const out = V.say(box);
  const shape = [[0, 0], [0, 2], [1.2, 2], [1.2, 1.6], [0.4, 1.6], [0.4, 1.15], [1, 1.15], [1, 0.75], [0.4, 0.75], [0.4, 0]];
  function draw() {
    P.clear(); P.poly(shape, 'var(--line2)', 'var(--line2)', .15);
    const d = V.det2(M); const a = Math.min(1, k), b = Math.max(0, k - 1);
    const Ma = [[1 + (M[0][0] - 1) * a, M[0][1] * a], [M[1][0] * a, 1 + (M[1][1] - 1) * a]];
    let pts = shape.map(p => V.mul2(Ma, p));
    if (b > 0) {
      if (Math.abs(d) < 1e-9) { out.innerHTML = '<span class="bad">הדטרמיננטה היא 0: כל הנקודות נמחצו לקו אחד, ומידע אבד. אין M⁻¹.</span>'; P.poly(pts, 'var(--c2)', 'var(--c2)', .4); return; }
      const inv = [[M[1][1] / d, -M[0][1] / d], [-M[1][0] / d, M[0][0] / d]];
      const Mi = [[1 + (inv[0][0] - 1) * b, inv[0][1] * b], [inv[1][0] * b, 1 + (inv[1][1] - 1) * b]];
      pts = shape.map(p => V.mul2(Mi, V.mul2(M, p)));
    }
    P.poly(pts, Math.abs(d) < 1e-9 ? 'var(--c2)' : 'var(--c4)', null, .4);
    out.innerHTML = k < 1 ? 'מפעילים את M…' : k < 2 ? 'מפעילים את M⁻¹ על התוצאה…' : (Math.abs(d) < 1e-9 ? '' : '✓ חזרנו בדיוק להתחלה: M⁻¹M = I.');
  }
  draw();
};

W.w_det = function (box) {
  V.say(box, 'גרור את שני החיצים (עמודות המטריצה). השטח של המקבילית הוא הדטרמיננטה, ad − bc. כשהחיצים על קו אחד השטח מתאפס, וכשהם מתחלפים בסדר הסימן נעשה שלילי.');
  const P = V.plane(box, { w: 400, h: 400, x: [-4, 4], y: [-4, 4] });
  let c1 = [2, 0], c2 = [0, 0.5];
  const out = V.say(box);
  function draw() {
    P.clear(); const d = c1[0] * c2[1] - c2[0] * c1[1];
    P.poly([[0, 0], [1, 0], [1, 1], [0, 1]], 'var(--line2)', 'var(--line2)', .2);
    P.poly([[0, 0], c1, [c1[0] + c2[0], c1[1] + c2[1]], c2], d < 0 ? 'var(--c2)' : d === 0 ? 'var(--ink3)' : 'var(--c3)', null, .35);
    P.arrow(0, 0, c1[0], c1[1], 'var(--c2)', 3.5, 'a,c'); P.arrow(0, 0, c2[0], c2[1], 'var(--c3)', 3.5, 'b,d');
    out.innerHTML = '<span class="mono" style="direction:ltr;display:inline-block">det = ' + V.fmt(c1[0]) + '·' + V.fmt(c2[1]) + ' − ' + V.fmt(c2[0]) + '·' + V.fmt(c1[1]) + ' = <b>' + V.fmt(d) + '</b></span> &nbsp; ' + (Math.abs(d) < 1e-9 ? '<span class="bad">אפס: המישור נמחץ לקו, אין הפוכה.</span>' : d < 0 ? 'שלילי: המרחב "התהפך" (כמו מראה).' : 'השטח גדל פי ' + V.fmt(d) + '.');
  }
  P.handle(c1[0], c1[1], 'var(--c2)', (x, y) => { c1 = [x, y]; draw(); }, { snap: 0.25 });
  P.handle(c2[0], c2[1], 'var(--c3)', (x, y) => { c2 = [x, y]; draw(); }, { snap: 0.25 });
  draw();
};

W.w_rot3d = function (box) {
  V.say(box, 'סיבוב בתלת־ממד הוא מטריצה 3×3. סובב את הקובייה סביב שלושת הצירים. במודול 3 בדיוק מטריצה כזו (R) מתארת לאן המצלמה מסתכלת.');
  let ax = 20, ay = 30, az = 0;
  const r = V.row(box);
  V.slider(r, 'סביב x', -180, 180, 5, ax, v => { ax = v; draw(); }); V.slider(r, 'סביב y', -180, 180, 5, ay, v => { ay = v; draw(); }); V.slider(r, 'סביב z', -180, 180, 5, az, v => { az = v; draw(); });
  const svg = V.s('svg', { viewBox: '-150 -150 300 300', width: 320 }); const w = el('div', { style: { display: 'flex', justifyContent: 'center', gap: '16px', alignItems: 'center', flexWrap: 'wrap' } }); w.appendChild(svg); box.appendChild(w);
  const mat = el('div', { class: 'mono', style: { direction: 'ltr' } }); w.appendChild(mat);
  const V8 = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
  const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  function Rm() {
    const [a, b, c] = [ax, ay, az].map(d => d * Math.PI / 180);
    const Rx = [[1, 0, 0], [0, Math.cos(a), -Math.sin(a)], [0, Math.sin(a), Math.cos(a)]];
    const Ry = [[Math.cos(b), 0, Math.sin(b)], [0, 1, 0], [-Math.sin(b), 0, Math.cos(b)]];
    const Rz = [[Math.cos(c), -Math.sin(c), 0], [Math.sin(c), Math.cos(c), 0], [0, 0, 1]];
    return V.mm(Rz, V.mm(Ry, Rx));
  }
  function draw() {
    const R = Rm(); svg.innerHTML = '';
    const P = V8.map(p => V.mv(R, p)); const pr = p => [p[0] * 60 / (1 + p[2] * 0.15), -p[1] * 60 / (1 + p[2] * 0.15)];
    E.forEach(([i, j]) => { const a = pr(P[i]), b = pr(P[j]); V.s('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], style: { stroke: 'var(--c1)', strokeWidth: 2.5 } }, svg); });
    [[1, 0, 0, 'var(--c2)', 'x'], [0, 1, 0, 'var(--c3)', 'y'], [0, 0, 1, 'var(--c4)', 'z']].forEach(([x, y, z, c, n]) => { const p = pr(V.mv(R, [x * 1.7, y * 1.7, z * 1.7])); V.s('line', { x1: 0, y1: 0, x2: p[0], y2: p[1], style: { stroke: c, strokeWidth: 3 } }, svg); V.s('text', { x: p[0] * 1.1, y: p[1] * 1.1, style: { fill: c }, 'font-weight': 700, text: n }, svg); });
    mat.innerHTML = 'R =<br>' + R.map(r => '[' + r.map(v => V.fmt(v, 2).padStart(6)).join(' ') + ' ]').join('<br>') + '<div class="note-small" style="direction:rtl">det R = ' + V.fmt(R[0][0] * (R[1][1] * R[2][2] - R[1][2] * R[2][1]) - R[0][1] * (R[1][0] * R[2][2] - R[1][2] * R[2][0]) + R[0][2] * (R[1][0] * R[2][1] - R[1][1] * R[2][0])) + ' (סיבוב לא משנה נפח)</div>';
    mat.style.whiteSpace = 'pre';
  }
  draw();
};

W.x3_1 = function (box) {
  V.ask(box, 'חשב את <span class="mono">[[1, 2], [3, 4]] · (1, −1)</span>. כתוב את שני רכיבי התוצאה:', s => { const n = V.nums(s.replace(/−/g, '-')); return n[0] === -1 && n[1] === -1; }, 'נכון: 1 − 2 = −1 ו־3 − 4 = −1');
};
W.x3_2 = function (box) {
  V.say(box, 'בנה את מטריצת הסיבוב ב־180° בעצמך: <b>גרור את שני החיצים</b> למקום שאליו הם צריכים לנחות אחרי סיבוב של חצי סיבוב.');
  const P = V.plane(box, { w: 320, h: 320, x: [-2, 2], y: [-2, 2] });
  let e1 = [1, 0], e2 = [0, 1]; const out = V.say(box);
  function draw() { P.clear(); P.arrow(0, 0, 1, 0, 'var(--line2)', 2); P.arrow(0, 0, 0, 1, 'var(--line2)', 2); P.arrow(0, 0, e1[0], e1[1], 'var(--c2)', 3.5, 'e₁→'); P.arrow(0, 0, e2[0], e2[1], 'var(--c3)', 3.5, 'e₂→'); const ok = e1[0] === -1 && e1[1] === 0 && e2[0] === 0 && e2[1] === -1; out.innerHTML = 'המטריצה שבנית: <span class="mono">[[' + V.fmt(e1[0]) + ', ' + V.fmt(e2[0]) + '], [' + V.fmt(e1[1]) + ', ' + V.fmt(e2[1]) + ']]</span> ' + (ok ? '<span class="good">✓ מושלם! זו מינוס מטריצת היחידה.</span>' : ''); }
  P.handle(1, 0, 'var(--c2)', (x, y) => { e1 = [x, y]; draw(); }, { snap: 1 }); P.handle(0, 1, 'var(--c3)', (x, y) => { e2 = [x, y]; draw(); }, { snap: 1 }); draw();
};
W.x3_3 = function (box) {
  [['(5, 3) @ (3, 7)', 0, ['(5, 7)', '(3, 3)', 'לא חוקי']], ['(64, 512) @ (512, 10)', 0, ['(64, 10)', '(512, 512)', 'לא חוקי']], ['(4, 2) @ (4, 2)', 2, ['(4, 2)', '(2, 2)', 'לא חוקי']]].forEach(([q, c, ch]) => V.quiz(box, 'מה הצורה של ' + q + '?', ch, c, 'הממדים הפנימיים חייבים להתאים ו"נמחקים".'));
};
W.x3_5 = function (box) { V.ask(box, 'מה הדטרמיננטה של הגזירה <span class="mono">H = [[1, 0.5], [0, 1]]</span>?', s => V.nums(s)[0] === 1, 'נכון: 1·1 − 0.5·0 = 1. הצורה מתעוותת, השטח נשמר.'); };
})();
