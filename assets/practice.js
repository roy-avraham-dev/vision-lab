/* Guided missions for visuals, and the practice block at the end of each section:
   two self-check questions + the chapter exercises that belong to this section (with hints, solution,
   an in-page interactive version and, for code exercises, an automatic checker). */
(function () {
'use strict';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- missions ---------- */
window.Missions = function (card, w) {
  let M = null; Object.values(window.LAYER).forEach(Lr => { if (!M && Lr.missions && Lr.missions[w]) M = Lr.missions[w]; }); const box = card.querySelector('.mission');
  if (!M || !box) return;
  const key = 'm:' + w; const st = window.Store.map('missions'); st[key] = st[key] || {};
  box.innerHTML = '<div class="mhead">משימות</div><ol class="mlist"></ol><div class="minsight" hidden></div><button class="sm ghost mreveal">מה הייתי אמור לגלות?</button>';
  const ol = box.querySelector('.mlist'), ins = box.querySelector('.minsight'), rev = box.querySelector('.mreveal');
  const items = M.tasks.map((t, i) => {
    const li = document.createElement('li'); li.className = 'mtask';
    li.innerHTML = '<span class="mcheck"></span><span>' + window.md(t.t, { noGloss: true, noLinks: true }) + '</span>' + (t.auto ? '' : '<button class="sm ghost mdone">סמן שעשיתי</button>');
    ol.appendChild(li);
    const b = li.querySelector('.mdone'); if (b) b.onclick = () => { done(i); };
    return li;
  });
  function done(i) { if (st[key][i]) return; st[key][i] = 1; window.Store.save(); paint(); }
  function paint() {
    items.forEach((li, i) => { li.classList.toggle('ok', !!st[key][i]); const b = li.querySelector('.mdone'); if (b) b.hidden = !!st[key][i]; });
    if (M.tasks.every((_, i) => st[key][i])) show();
  }
  function show() { ins.hidden = false; rev.hidden = true; ins.innerHTML = '<b>מה גילית:</b> ' + window.md(M.insight, { noGloss: true, noLinks: true }); }
  rev.onclick = show;
  const slot = card.querySelector('.wslot');
  const test = () => { const txt = slot.textContent; M.tasks.forEach((t, i) => { if (t.auto && !st[key][i]) { try { if (new RegExp(t.auto).test(txt)) done(i); } catch (e) {} } }); };
  new MutationObserver(() => test()).observe(slot, { subtree: true, childList: true, characterData: true });
  slot.addEventListener('input', test); slot.addEventListener('click', () => setTimeout(test, 50));
  paint();
};

/* ---------- self-check questions ---------- */
function checkCard(C, key, mid, sid, n) {
  const el = document.createElement('div'); el.className = 'check';
  const prevAns = window.Store.map('checks')[key];
  el.innerHTML = '<div class="checkhead">בדוק את עצמך · שאלה ' + n + (C.kind ? ' · ' + esc(C.kind) : '') + '</div><div class="q">' + window.md(C.q, { noGloss: true, noLinks: true }) + '</div><div class="opts"></div><div class="fb"></div>';
  const opts = el.querySelector('.opts'), fb = el.querySelector('.fb');
  C.options.forEach((o, i) => {
    const b = document.createElement('button'); b.className = 'opt'; b.innerHTML = window.md(o, { noGloss: true, noLinks: true });
    b.onclick = () => {
      el.querySelectorAll('.opt').forEach((x, j) => { x.classList.remove('right', 'wrong'); if (j === C.answer) x.classList.add('right'); });
      if (i !== C.answer) b.classList.add('wrong');
      fb.innerHTML = (i === C.answer ? '<b class="good">נכון.</b> ' : '<b class="bad">לא בדיוק.</b> ') + window.md(C.why, { noGloss: true });
      window.Store.map('checks')[key] = i === C.answer ? 'ok' : 'miss'; window.Store.save();
    };
    opts.appendChild(b);
  });
  if (prevAns) fb.innerHTML = '<span class="note-small">' + (prevAns === 'ok' ? 'ענית נכון בפעם הקודמת.' : 'בפעם הקודמת לא ענית נכון. נסה שוב.') + '</span>';
  return el;
}

/* ---------- code checker (runs your code + a hidden test in the browser's Python) ---------- */
function codeChecker(T) {
  const box = document.createElement('div'); box.className = 'codecheck';
  box.innerHTML = '<div class="note-small">' + window.md(T.task, { noGloss: true, noLinks: true }) + '</div><textarea class="codeedit" spellcheck="false"></textarea><div class="row" style="display:flex;gap:8px;margin-top:6px"><button class="sm primary">בדוק את הקוד שלי</button><span class="res"></span></div>';
  const ta = box.querySelector('textarea'); ta.value = T.starter; const res = box.querySelector('.res');
  box.querySelector('button').onclick = async () => {
    res.innerHTML = '<span class="note-small">מריץ…</span>';
    try {
      const r = await window.pyExec(ta.value + '\n\n' + T.test, t => { res.innerHTML = '<span class="note-small">' + t + '</span>'; });
      const [out, err] = r;
      if (err) res.innerHTML = /NoneType/.test(err) ? '<span class="bad">עוד לא:</span> יש חלקים שעדיין None. השלם אותם.' : '<span class="bad">שגיאה:</span> <code class="inline-code">' + esc(err.trim().split('\n').pop()) + '</code>';
      else if (/PASS/.test(out)) res.innerHTML = '<b class="good">עבר את הבדיקה ✓</b>';
      else { const m = (out.match(/FAIL:(.*)/) || ['', 'התוצאה שונה מהצפוי'])[1]; res.innerHTML = '<span class="bad">עוד לא:</span> ' + esc(/NoneType|None/.test(m) ? 'יש חלקים שעדיין None. השלם אותם.' : m); }
    } catch (e) { res.innerHTML = window.pyFailHTML(e); }
  };
  return box;
}

/* ---------- one exercise card (used in the section and on the chapter exercises page) ---------- */
window.ExerciseCard = function (e, ch, mid) {
  const L = window.LAYER[mid] || {};
  const card = document.createElement('div'); card.className = 'ex'; card.id = 'ex-' + e.id;
  const st = (window.Store.map('exres')[mid + ':' + e.id]) || '';
  const hint = (L.hints || {})[e.id]; const xw = (L.exWidgets || {})[e.id]; const T = (L.codeTests || {})[e.id];
  const X = (L.exMeta || {})[e.id]; const LV = ['', 'חימום', 'יישום', 'אתגר'];
  const tags = (X && X.level ? '<span class="lvl lvl' + X.level + '">' + '●'.repeat(X.level) + '○'.repeat(3 - X.level) + ' ' + LV[X.level] + '</span>' : '') + (e.extra ? '<span class="extag" title="תרגיל שנוסף באתר, כדי לכסות את כל הסעיפים">תרגיל משלים</span>' : '') + (X && X.sec ? '<a class="exsec" href="#/' + mid + '/s/' + X.sec + '">מתרגל את סעיף ' + X.sec + '</a>' : '');
  card.innerHTML = `<div class="exhead"><b>תרגיל ${e.id}</b>${tags}${e.star ? '<span class="ex-star">' + (typeof e.star === 'string' ? e.star.replace(/ /g, '') : '★'.repeat(+e.star || 1)) + ' קשה יותר</span>' : ''}<span style="flex:1"></span><span class="pill ${st === 'ok' ? 'on' : ''}" ${st ? '' : 'hidden'}>${st === 'ok' ? 'פתרתי' : st === 'again' ? 'לחזור' : ''}</span></div>
    <div class="exbody"><div class="q lessonish"></div><div class="xslot"></div>
    <div class="row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">${hint ? '<button class="sm" data-a="hint">רמז</button>' : ''}<button class="sm" data-a="sol">הצג פתרון</button><button class="sm ghost" data-a="ok">פתרתי נכון</button><button class="sm ghost" data-a="again">צריך לחזור על זה</button></div>
    <div class="hintbox"></div><div class="sol lessonish" hidden></div></div>`;
  window.App.renderBlocks(e.blocks, card.querySelector('.q'));
  if (X && X.explain) card.querySelector('.q').insertAdjacentHTML('afterend', '<div class="exexplain"><div class="exexplain-h">מה בדיוק מבקשים</div>' + X.explain.replace(/ \*\*(מה לעשות|איך תדע שהצלחת|מה לחפש|המכשול|שים לב|טיפ):\*\*/g, '\u0001**$1:**').split('\u0001').map(t => '<div>' + window.md(t, { noGloss: true }) + '</div>').join('') + '</div>');
  if (!e.solution.length && e.solution_of) { const o = ch.exercises.find(x => x.id === e.solution_of); card.querySelector('.sol').insertAdjacentHTML('beforeend', '<p class="note-small">הפתרון של התרגיל הזה משותף עם תרגיל ' + e.solution_of + ':</p>'); if (o) window.App.renderBlocks(o.solution, card.querySelector('.sol')); }
  else window.App.renderBlocks(e.solution, card.querySelector('.sol'));
  const xs = card.querySelector('.xslot');
  if (xw) { const d = document.createElement('div'); d.className = 'tryit'; d.innerHTML = '<div class="tryhead"><span class="trytag">פתור כאן</span></div><div class="wslot"></div>'; xs.appendChild(d); window.App.mountWidgets(d.querySelector('.wslot'), [].concat(xw), { mid, ch, ex: e }); }
  if (T) { const d = document.createElement('div'); d.className = 'tryit'; d.innerHTML = '<div class="tryhead"><span class="trytag">קוד</span>כתוב את הפתרון ובדוק אותו</div>'; d.appendChild(codeChecker(T)); xs.appendChild(d); }
  let lvl = 0;
  card.addEventListener('click', ev => {
    const btn = ev.target.closest('button'); const a = btn && btn.dataset.a; if (!a) return;
    if (a === 'hint') { const hs = [].concat(hint); if (lvl < hs.length) { card.querySelector('.hintbox').insertAdjacentHTML('beforeend', '<div class="hint">' + window.md(hs[lvl], { noGloss: true }) + '</div>'); lvl++; } if (lvl >= hs.length) btn.disabled = true; }
    if (a === 'sol') { const s = card.querySelector('.sol'); s.hidden = !s.hidden; btn.textContent = s.hidden ? 'הצג פתרון' : 'הסתר פתרון'; }
    if (a === 'ok' || a === 'again') { window.Store.map('exres')[mid + ':' + e.id] = a; const srs = window.Store.map('srs'); srs['ex:' + mid + ':' + e.id] = { box: a === 'ok' ? 3 : 0, due: Date.now() + (a === 'ok' ? 3 : 0) * 864e5 }; window.Store.save(); const p = card.querySelector('.pill'); p.hidden = false; p.className = 'pill ' + (a === 'ok' ? 'on' : ''); p.textContent = a === 'ok' ? 'פתרתי' : 'לחזור'; window.toast(a === 'ok' ? 'כל הכבוד' : 'נכנס לכרטיסיות החזרה'); }
  });
  return card;
};

/* ---------- the practice block at the end of a section ---------- */
window.SectionPractice = function (el, mid, sid, ch) {
  const L = window.LAYER[mid] || {};
  el.innerHTML = '';
  const wrap = document.createElement('section'); wrap.className = 'practice';
  wrap.innerHTML = '<h3 class="parthead">תרגול</h3>';
  el.appendChild(wrap);
  const qs = [].concat((L.checks || {})[sid] || [], (L.checks2 || {})[sid] || []);
  qs.forEach((C, i) => wrap.appendChild(checkCard(C, mid + ':' + sid + ':' + i, mid, sid, i + 1)));
  const exMap = L.exSection || {};
  const exs = ch.exercises.filter(e => exMap[e.id] === sid);
  if (exs.length) {
    const h = document.createElement('div'); h.className = 'exsub'; h.textContent = exs.length === 1 ? 'תרגיל מהפרק שמתאים לסעיף הזה' : 'תרגילים מהפרק שמתאימים לסעיף הזה'; wrap.appendChild(h);
    exs.forEach(e => wrap.appendChild(window.ExerciseCard(e, ch, mid)));
  }
};
})();
