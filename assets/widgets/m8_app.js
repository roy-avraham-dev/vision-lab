/* Module 8 — the application: a gallery of its screens (chapter 1) and the planned fault of milestone 6, a window
   that freezes because the scan runs in the window's own thread (naive) vs in a background thread (required). */
(function () {
const W = window.W, V = window.V, el = V.el;
const SHOTS = [['בחירת סרטון', 'img/m8_app_1.jpg', 'החלון נפתח במסך מלא. גוררים קובץ, או לוחצים "בחירת קובץ…" ובוחרים מהמחשב. שום מידע מלבד הסרטון.'],
  ['תצוגה מקדימה', 'img/m8_app_2.jpg', 'הסרטון שנבחר מוצג עם נגן, ולמעלה שם הקובץ, האורך, הרזולוציה וקצב הפריימים. הכפתור הכחול מתחיל את הסריקה.'],
  ['סריקה', 'img/m8_app_3.jpg', 'פס התקדמות, מספר הפריים, הזמן שנותר והשלב הנוכחי. הסריקה רצה ברקע, ולכן החלון ממשיך להגיב — אפשר להזיז אותו או לבטל.'],
  ['תוצאות', 'img/m8_app_4.jpg', 'משמאל הסרטון הסרוק: מלבן, מספר ומהירות על כל רכב. מימין טבלה שמתעדכנת עם כל פריים: מספר זיהוי, מהירות, פיקסל (נקודת מגע בקרקע), מקור קנה המידה, וסוג.'],
  ['חלון זום', 'img/m8_app_5.jpg', 'לחיצה על רכב (בסרטון או בטבלה) פותחת בפינה חלון שבו הרכב מוגדל ונעקב. אפשר לגרור אותו. לחיצה נוספת על אותו רכב סוגרת אותו; לחיצה על רכב אחר מחליפה.']];
W.w8_app_screens = function (box) {
  V.say(box, 'כך תיראה <b>האפליקציה הגמורה</b> — חמישה מצבים של אותו חלון, על הסרטון האמיתי של כביש 505. <b>עבור בין הלשוניות.</b> את הקוד של החלון תקבל מוכן באבן דרך 6 (' + '<a class="ref" href="#/m8/s/8.2">סעיף 8.2</a>' + '); מה שאתה בונה הוא המנוע שמאחוריו.');
  const img = el('img', { style: 'width:100%;border-radius:10px;display:block;border:1px solid var(--line)' }); const cap = el('p', { class: 'say', style: 'margin-top:8px' });
  V.tabs(box, SHOTS.map(s => s[0]), i => { img.src = SHOTS[i][1]; link.href = SHOTS[i][1]; cap.innerHTML = SHOTS[i][2]; }, 3);
  let link;
  link = el('a', { target: '_blank', title: 'לחץ לגודל מלא' }); link.appendChild(img); img.style.cursor = 'zoom-in';
  box.appendChild(link); box.appendChild(cap); img.src = SHOTS[3][1]; link.href = SHOTS[3][1]; cap.innerHTML = SHOTS[3][2];
  V.say(box, '<span class="note-small">אלה תמונות הדמיה. המספרים בפס הסריקה מומצאים, ו"נתיבים + רכבים" בעמודת מקור קנה המידה מראה מה המערכת שלך תכתוב — בסרטון הזה קנה המידה של אמת המידה חושב מרוחב הרכבים בלבד.</span>');
};
/* 8.4 — the planned fault: the frozen window */
W.w8_fault_freeze = box => freeze(box, 'התקלה המתוכננת: <b>חלון שקופא</b>. אותה סריקה של 20 שניות, פעם בתוך התהליכון של החלון (נאיבי) ופעם בתהליכון נפרד (נדרש). <b>לחץ "התחל סריקה"</b>, ואז נסה <b>לגרור</b> את החלון ו<b>ללחוץ "ביטול"</b>.');
W.w6_bg = box => freeze(box, 'חלון קטן עם סריקה של 20 שניות. <b>בחר גרסה</b>, <b>לחץ "התחל סריקה"</b>, ואז נסה <b>לגרור</b> את החלון בשורת הכותרת ו<b>ללחוץ "ביטול"</b>. בגרסה הנאיבית הסריקה רצה בתוך הפונקציה שמגיבה ללחיצה; בנדרשת — בתהליכון נפרד, שמדווח לחלון דרך אותות.');
function freeze(box, intro) {
  V.say(box, intro);
  let mode = 'nv'; V.tabs(box, ['ניסיון נאיבי: הסריקה בתוך החלון', 'המערכת הנדרשת: סריקה ברקע'], i => { mode = i ? 'req' : 'nv'; reset(); });
  const area = el('div', { style: 'position:relative;height:300px;background:#e9ecef;border-radius:10px;overflow:hidden;direction:rtl' }); box.appendChild(area);
  const win = el('div', { style: 'position:absolute;left:120px;top:40px;width:420px;background:#161618;color:#f2f2f4;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.35);overflow:hidden' }); area.appendChild(win);
  const bar = el('div', { style: 'height:30px;background:#2a2a2e;display:flex;align-items:center;padding:0 12px;font-size:12px;cursor:move;user-select:none' }); win.appendChild(bar);
  const body = el('div', { style: 'padding:22px;display:flex;flex-direction:column;align-items:center;gap:12px' }); win.appendChild(body);
  const st = el('div', { style: 'font-size:16px;font-weight:600' }); const prog = el('div', { style: 'width:300px;height:6px;background:#3a3a3e;border-radius:3px;direction:ltr' }); const fill = el('div', { style: 'height:100%;width:0;background:#fff;border-radius:3px' }); prog.appendChild(fill);
  const det = el('div', { style: 'font-size:12px;color:#aeaeb2' }); const btns = el('div', { style: 'display:flex;gap:8px' });
  const go = el('button', { html: 'התחל סריקה', style: 'background:#0a84ff;color:#fff;border:none;border-radius:7px;padding:7px 16px;cursor:pointer' }); const cancel = el('button', { html: 'ביטול', style: 'background:#2a2a2e;color:#f2f2f4;border:1px solid #3a3a3e;border-radius:7px;padding:7px 16px;cursor:pointer' });
  btns.append(go, cancel); body.append(st, prog, det, btns);
  const out = el('p', { class: 'say', style: 'margin-top:8px' }); box.appendChild(out);
  let t0 = null, frozen = false, drag = null, pending = [], timer = null;
  function reset() { clearInterval(timer); t0 = null; frozen = false; pending = []; win.style.left = '120px'; win.style.top = '40px'; win.style.filter = ''; area.style.cursor = ''; bar.textContent = 'סריקת רכבים מרחפן'; st.textContent = 'מוכן'; fill.style.width = '0'; det.textContent = 'לחץ "התחל סריקה"'; out.innerHTML = mode === 'nv' ? 'נאיבי: כל העבודה קורית בתוך הפונקציה שמגיבה ללחיצה. כל עוד היא רצה, החלון לא מעבד שום אירוע — לא ציור, לא גרירה, לא לחיצות.' : 'נדרש: הלחיצה רק מפעילה תהליכון נפרד וחוזרת מיד. התהליכון שולח לחלון הודעות התקדמות, והחלון ממשיך לטפל בציור ובלחיצות.'; }
  go.onclick = () => { if (t0 !== null) return; t0 = performance.now(); frozen = mode === 'nv'; if (frozen) { bar.textContent = 'סריקת רכבים מרחפן (לא מגיב)'; win.style.filter = 'saturate(.4) brightness(.85)'; area.style.cursor = 'wait'; st.textContent = 'סורק…'; det.textContent = 'פריים 0 מתוך 979'; }
    timer = setInterval(() => { if (!box.isConnected) return clearInterval(timer); const p = Math.min(1, (performance.now() - t0) / 20000); if (!frozen) { fill.style.width = (p * 100) + '%'; st.textContent = p < 1 ? 'סורק…' : 'הסריקה הסתיימה'; det.textContent = 'פריים ' + Math.round(p * 979) + ' מתוך 979 · ' + Math.round(p * 100) + '%'; }
      if (p >= 1) { clearInterval(timer); if (frozen) { frozen = false; win.style.filter = ''; area.style.cursor = ''; bar.textContent = 'סריקת רכבים מרחפן'; fill.style.width = '100%'; st.textContent = 'הסריקה הסתיימה'; det.textContent = pending.length ? 'ועכשיו, בבת אחת, החלון מבצע את כל מה שנלחץ בזמן הקפיאה: ' + pending.join(', ') : 'פריים 979 מתוך 979 · 100%'; out.innerHTML = '20 שניות שבהן פס ההתקדמות לא זז, החלון לא זז, והביטול לא עבד. ב־Windows הכותרת הייתה מקבלת "(לא מגיב)", ואחרי כמה שניות המשתמש היה סוגר את התוכנה בכוח.'; } } }, 100); };
  cancel.onclick = () => { if (t0 === null) return; if (frozen) { pending.push('ביטול'); return; } clearInterval(timer); t0 = null; st.textContent = 'הסריקה בוטלה'; det.textContent = 'החלון הגיב מיד'; };
  bar.addEventListener('pointerdown', e => { if (frozen) { if (!pending.includes('גרירה')) pending.push('גרירה'); return; } drag = [e.clientX - win.offsetLeft, e.clientY - win.offsetTop]; bar.setPointerCapture(e.pointerId); });
  bar.addEventListener('pointermove', e => { if (!drag) return; win.style.left = Math.max(0, Math.min(area.clientWidth - win.offsetWidth, e.clientX - drag[0])) + 'px'; win.style.top = Math.max(0, Math.min(area.clientHeight - 60, e.clientY - drag[1])) + 'px'; });
  bar.addEventListener('pointerup', () => drag = null);
  reset();
};
})();
