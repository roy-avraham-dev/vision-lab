/* Module 8 — the real drone clip (Route 505) shown exactly like the results screen of the app the learner builds:
   the video with a box and a label on every vehicle (left), a live table (right), and the zoom window — a small,
   draggable window that follows the selected vehicle (click a vehicle or a row; the same one again closes it; another
   one switches). Below: the speed chart and the per-vehicle summary. The tracks are a corrected reference, not a system run. */
(function () {
const W = window.W, V = window.V, el = V.el, D4 = window.D4;
const { F, table } = D4;
const STOP = 9, ZOOM = 3, SRC = 'רוחב רכבים';
const spd = s => s < STOP ? 'עומד' : F(s, 0) + ' קמ״ש';

W.w8_real = function (box) {
  const R = window.M8REAL; if (!R) { V.say(box, 'הנתונים של הסרטון לא נטענו.'); return; }
  const fps = R.fps, VEH = R.veh, NF = R.n, IW = R.w, IH = R.h;
  V.say(box, 'סרטון רחפן אמיתי — 33 שניות מעל כביש 505, בין צומת תפוח לאריאל — מוצג <b>בדיוק כמו מסך התוצאות של האפליקציה שתבנה</b>: משמאל הסרטון עם מלבן, מספר ומהירות על כל רכב; מימין טבלה שזזה יחד עם הסרטון. <b>לחץ על רכב</b> (בסרטון או בטבלה) כדי לפתוח חלון זום שעוקב אחריו; <b>גרור</b> את החלון לאן שנוח; לחיצה נוספת על אותו רכב סוגרת, ולחיצה על רכב אחר מחליפה.');
  const app = el('div', { style: 'background:#161618;color:#f2f2f4;border-radius:12px;padding:16px;direction:ltr' }); box.appendChild(app);
  const grid = el('div', { style: 'display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:16px;align-items:start' }); app.appendChild(grid);
  /* left: the video */
  const left = el('div', { style: 'direction:rtl' }); grid.appendChild(left);
  left.appendChild(el('div', { html: '<b style="font-size:14px">הסרטון הסרוק</b> <span style="color:#8e8e93;font-size:12px" class="cnt"></span>', style: 'margin-bottom:8px' }));
  const stage = el('div', { style: 'position:relative;width:100%;aspect-ratio:' + IW + '/' + IH + ';background:#000;border-radius:8px;overflow:hidden;direction:ltr' }); left.appendChild(stage);
  const vid = el('video', { preload: 'auto', playsinline: '', muted: '', style: 'position:absolute;inset:0;width:100%;height:100%;opacity:0' }); vid.src = 'assets/files/m8_real_in.mp4'; vid.muted = true; stage.appendChild(vid);
  const ov = el('canvas', { style: 'position:absolute;inset:0;width:100%;height:100%;cursor:pointer' }); stage.appendChild(ov);
  const pip = el('div', { style: 'position:absolute;width:250px;background:#1b1b1e;border:1px solid #3a3a3e;border-radius:9px;overflow:hidden;box-shadow:0 8px 22px rgba(0,0,0,.55);display:none;cursor:move;user-select:none' }); stage.appendChild(pip);
  const pipT = el('div', { style: 'height:26px;display:flex;align-items:center;justify-content:space-between;padding:0 9px;font-size:12px;direction:rtl' }); pip.appendChild(pipT);
  const pipC = el('canvas', { width: 500, height: 282, style: 'display:block;width:250px;height:141px' }); pip.appendChild(pipC);
  const ctl = el('div', { style: 'display:flex;align-items:center;gap:10px;margin-top:8px;direction:ltr;font-size:12px;color:#c7c7cc' }); left.appendChild(ctl);
  const pb = el('button', { html: '▶', style: 'width:32px;height:32px;border-radius:50%;border:none;background:#2c2c30;color:#fff;cursor:pointer' }); ctl.appendChild(pb);
  const tl = el('span', { style: 'min-width:92px' }); ctl.appendChild(tl);
  const bar = el('input', { type: 'range', min: 0, max: NF - 1, value: 0, style: 'flex:1;accent-color:#e5e5ea' }); ctl.appendChild(bar);
  /* right: the live table */
  const right = el('div', { style: 'direction:rtl' }); grid.appendChild(right);
  const rhead = el('div', { style: 'margin-bottom:8px' }); right.appendChild(rhead);
  const tbox = el('div'); right.appendChild(tbox);
  right.appendChild(el('div', { html: 'מתחת ל־9 קמ״ש הרכב מוצג "עומד". מקור קנה המידה כאן הוא רוחב הרכבים בלבד — המערכת שלך תשתמש גם בנתיבים (' + '<a class="ref" style="color:#64a8ff" href="#/m8/s/6.1">פרק 6</a>' + ').', style: 'color:#8e8e93;font-size:12px;margin-top:10px;line-height:1.6' }));

  let sel = null, cen = null, lastF = -1, drag = null, pipPlaced = false;
  const at = (v, f) => { let lo = 0, hi = v.f.length - 1; if (f < v.f[0] || f > v.f[hi]) return -1; while (lo < hi) { const m = (lo + hi) >> 1; if (v.f[m] < f) lo = m + 1; else hi = m; } return v.f[lo] === f ? lo : -1; };
  const inFrame = f => VEH.map(v => [v, at(v, f)]).filter(q => q[1] >= 0);
  const boxOf = (v, k) => [v.x[k] - v.w[k] / 2, v.y[k] - v.h[k], v.x[k] + v.w[k] / 2, v.y[k]];
  function select(id) { if (id == null) return; sel = sel === id ? null : id; cen = null; draw(true); }
  function draw(force) {
    const f = Math.max(0, Math.min(NF - 1, Math.round(vid.currentTime * fps))); if (f === lastF && !force) return; lastF = f;
    const cw = stage.clientWidth, ch = stage.clientHeight, dpr = window.devicePixelRatio || 1; if (ov.width !== Math.round(cw * dpr)) { ov.width = Math.round(cw * dpr); ov.height = Math.round(ch * dpr); }
    const x = ov.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.fillStyle = '#000'; x.fillRect(0, 0, cw, ch); try { if (vid.readyState >= 2) x.drawImage(vid, 0, 0, cw, ch); } catch (e) { } const s = cw / IW;
    const here = inFrame(f); x.font = '11px system-ui';
    here.forEach(([v, k]) => { const [x1, y1, x2, y2] = boxOf(v, k), st = v.s[k] < STOP, isSel = v.id === sel; const col = isSel ? '#0a84ff' : st ? 'rgba(174,174,178,.95)' : 'rgba(255,255,255,.95)';
      x.strokeStyle = col; x.lineWidth = 1.5; x.strokeRect(x1 * s, y1 * s, (x2 - x1) * s, (y2 - y1) * s);
      const t = '#' + v.id + ' · ' + spd(v.s[k]); x.direction = 'rtl'; const tw = x.measureText(t).width + 10; x.fillStyle = isSel ? '#0a84ff' : 'rgba(20,20,22,.85)'; x.fillRect(x1 * s, y1 * s - 17, tw, 15); x.fillStyle = '#fff'; x.textAlign = 'right'; x.fillText(t, x1 * s + tw - 5, y1 * s - 6); x.direction = 'ltr'; x.textAlign = 'left'; });
    left.querySelector('.cnt').textContent = '· ' + here.length + ' רכבים בתמונה';
    /* the table */
    const rows = here.slice().sort((a, b) => a[0].id - b[0].id);
    rhead.innerHTML = '<b style="font-size:14px">רכבים בפריים ' + f + '</b> <span style="color:#8e8e93;font-size:12px">· מתעדכן עם כל פריים</span>';
    tbox.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:12px;color:#f2f2f4"><thead><tr>' + ['מספר זיהוי', 'מהירות (קמ״ש)', 'פיקסל (נקודת מגע בקרקע)', 'מקור קנה המידה', 'סוג'].map(h => '<th style="text-align:right;font-weight:500;color:#8e8e93;font-size:11px;padding:6px 5px;border-bottom:1px solid #2a2a2e;background:transparent">' + h + '</th>').join('') + '</tr></thead><tbody>' +
      rows.map(([v, k]) => '<tr data-id="' + v.id + '" style="cursor:pointer;' + (v.id === sel ? 'background:rgba(10,132,255,.2)' : '') + '">' + [String(v.id), v.s[k] < STOP ? '<span style="color:#8e8e93">עומד</span>' : F(v.s[k], 0), '<span class="ltr">(' + F(v.x[k], 0) + ', ' + F(v.y[k], 0) + ')</span>', SRC, v.type].map((c, i) => '<td style="white-space:nowrap;padding:7px 5px;border-bottom:1px solid #232327;border-top:none;border-left:none;border-right:none;' + (i ? '' : 'font-weight:600') + '">' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
    tbox.querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => select(+tr.dataset.id));
    /* the zoom window */
    if (sel == null) { pip.style.display = 'none'; } else {
      pip.style.display = 'block'; const pw = Math.round(Math.max(160, Math.min(250, cw * 0.42))); if (pip.offsetWidth !== pw) { pip.style.width = pw + 'px'; pipC.style.width = pw + 'px'; pipC.style.height = Math.round(pw * 282 / 500) + 'px'; } if (!pipPlaced) { pip.style.left = (cw - pw - 8) + 'px'; pip.style.top = (ch - Math.round(pw * 282 / 500) - 26 - 8) + 'px'; pipPlaced = true; }
      const v = VEH.find(q => q.id === sel), k = at(v, f);
      if (k < 0) { pipT.innerHTML = '<span><b style="color:#0a84ff">רכב ' + sel + '</b> · מחוץ לתמונה</span><span style="color:#8e8e93">✕</span>'; }
      else { const [x1, y1, x2, y2] = boxOf(v, k), c = [(x1 + x2) / 2, (y1 + y2) / 2]; cen = cen ? [0.8 * cen[0] + 0.2 * c[0], 0.8 * cen[1] + 0.2 * c[1]] : c;
        let cwz = Math.max(500 / 2 / ZOOM, (x2 - x1) * 1.6), chz = Math.max(282 / 2 / ZOOM, (y2 - y1) * 1.6); cwz = Math.max(cwz, chz * 500 / 282); chz = cwz * 282 / 500;
        const sx = Math.max(0, Math.min(IW - cwz, cen[0] - cwz / 2)), sy = Math.max(0, Math.min(IH - chz, cen[1] - chz / 2)), z = 500 / cwz;
        const px = pipC.getContext('2d'); try { px.drawImage(vid, sx * vid.videoWidth / IW, sy * vid.videoHeight / IH, cwz * vid.videoWidth / IW, chz * vid.videoHeight / IH, 0, 0, 500, 282); } catch (e) { }
        px.strokeStyle = '#0a84ff'; px.lineWidth = 3; px.strokeRect((x1 - sx) * z, (y1 - sy) * z, (x2 - x1) * z, (y2 - y1) * z);
        pipT.innerHTML = '<span><b style="color:#0a84ff">רכב ' + sel + '</b> · ' + spd(v.s[k]) + ' · ×' + F(z * pip.offsetWidth / 500, 1) + '</span><span class="cls" style="color:#8e8e93;cursor:pointer">✕</span>'; const c2 = pipT.querySelector('.cls'); if (c2) c2.onclick = ev => { ev.stopPropagation(); sel = null; draw(true); }; }
    }
    const t = f / fps, T = (NF - 1) / fps; tl.textContent = Math.floor(t / 60) + ':' + (t % 60).toFixed(1).padStart(4, '0') + ' / ' + Math.floor(T / 60) + ':' + (T % 60).toFixed(1).padStart(4, '0'); bar.value = f;
    chart(f); if (force !== 'nosum') sumSel();
  }
  ov.addEventListener('click', e => { const r = ov.getBoundingClientRect(), s = r.width / IW; const X = (e.clientX - r.left) / s, Y = (e.clientY - r.top) / s; const hit = inFrame(lastF).find(([v, k]) => { const b = boxOf(v, k); return X >= b[0] - 6 && X <= b[2] + 6 && Y >= b[1] - 6 && Y <= b[3] + 6; }); if (hit) select(hit[0].id); });
  pip.addEventListener('pointerdown', e => { if (e.target.classList && e.target.classList.contains('cls')) return; drag = [e.clientX - pip.offsetLeft, e.clientY - pip.offsetTop]; pip.setPointerCapture(e.pointerId); });
  pip.addEventListener('pointermove', e => { if (!drag) return; const L = Math.max(0, Math.min(stage.clientWidth - pip.offsetWidth, e.clientX - drag[0])), T = Math.max(0, Math.min(stage.clientHeight - pip.offsetHeight, e.clientY - drag[1])); pip.style.left = L + 'px'; pip.style.top = T + 'px'; });
  pip.addEventListener('pointerup', () => { drag = null; });
  pb.onclick = () => { if (vid.paused) { if (vid.ended) vid.currentTime = 0; const pr = vid.play(); if (pr && pr.catch) pr.catch(() => { }); } else vid.pause(); };
  vid.addEventListener('play', () => pb.textContent = '❚❚'); vid.addEventListener('pause', () => pb.textContent = '▶');
  bar.addEventListener('input', () => { vid.currentTime = (+bar.value + 0.5) / fps; });
  vid.addEventListener('seeked', () => draw(true)); vid.addEventListener('loadeddata', () => draw(true));
  window.addEventListener('resize', () => { pipPlaced = false; draw(true); });

  /* below the app: the speed chart and the per-vehicle summary */
  const cap = el('div', { class: 'note-small', style: 'margin:14px 0 4px' }); box.appendChild(cap);
  const cv = V.canvas(box, 980, 230); cv.style.width = '100%'; cv.style.maxWidth = '980px';
  cv.addEventListener('click', e => { const r = cv.getBoundingClientRect(); const xx = (e.clientX - r.left) / r.width * 980; const t = (xx - 46) / (980 - 60) * (NF / fps); if (t >= 0) vid.currentTime = Math.min(NF / fps - 0.05, t); });
  const sumBox = el('div', { style: 'margin-top:10px' }); box.appendChild(sumBox);
  const col = id => 'hsl(' + ((id * 67) % 360) + ',70%,' + (id % 2 ? 42 : 52) + '%)';
  function chart(f) {
    const c = cv.getContext('2d'), Wc = 980, Hc = 230, x0 = 46, x1 = Wc - 14, y0 = Hc - 34, y1 = 12, vmax = 50; const show = sel != null ? sel : 7;
    const X = fr => x0 + fr / NF * (x1 - x0), Y = s => y0 - Math.min(s, vmax) / vmax * (y0 - y1);
    c.clearRect(0, 0, Wc, Hc); c.font = '13px system-ui'; c.fillStyle = '#868e96'; c.strokeStyle = '#e9ecef'; c.lineWidth = 1;
    for (let s = 0; s <= vmax; s += 10) { c.beginPath(); c.moveTo(x0, Y(s)); c.lineTo(x1, Y(s)); c.stroke(); c.textAlign = 'right'; c.fillText(String(s), x0 - 6, Y(s) + 4); }
    for (let t = 0; t <= 32; t += 4) { c.textAlign = 'center'; c.fillText(String(t), X(t * fps), y0 + 16); }
    c.fillStyle = 'rgba(134,142,150,.12)'; c.fillRect(x0, Y(STOP), x1 - x0, y0 - Y(STOP));
    VEH.forEach(v => { if (v.id === show) return; c.strokeStyle = 'rgba(134,142,150,.35)'; c.lineWidth = 1; c.beginPath(); v.f.forEach((fr, i) => i ? c.lineTo(X(fr), Y(v.s[i])) : c.moveTo(X(fr), Y(v.s[i]))); c.stroke(); });
    const v = VEH.find(q => q.id === show); c.strokeStyle = col(show); c.lineWidth = 2.6; c.beginPath(); v.f.forEach((fr, i) => i ? c.lineTo(X(fr), Y(v.s[i])) : c.moveTo(X(fr), Y(v.s[i]))); c.stroke();
    c.strokeStyle = '#212529'; c.lineWidth = 1.2; c.setLineDash([4, 3]); c.beginPath(); c.moveTo(X(f), y1); c.lineTo(X(f), y0); c.stroke(); c.setLineDash([]);
    cap.innerHTML = '<b>מהירות לאורך הסרטון</b> — רכב <b style="color:' + col(show) + '">#' + show + '</b> מודגש' + (sel == null ? ' (בחר רכב כדי להחליף)' : '') + '; האפור — כל השאר. לחיצה על הגרף קופצת לרגע הזה. מהירות בקמ״ש, הערכה.';
  }
  function sumSel() {
    const rows = VEH.map(v => ['<b style="color:' + col(v.id) + '">' + v.id + '</b>', v.type, F(v.t0, 1), F(v.t1, 1), F(v.dur, 1), F(v.dist, 0), v.avg < STOP ? 'עומד (' + F(v.avg, 0) + ')' : F(v.avg, 0), F(v.mx, 0)]);
    sumBox.innerHTML = '<p class="note-small" style="margin:0 0 4px"><b>סיכום לכל רכב</b> (לא חלק מהאפליקציה — לבדיקה שלך). מהירות ומרחק הם הערכה (±30%) מרמז אחד בלבד — רוחב הרכבים.</p><div style="max-height:300px;overflow:auto">' +
      table(['זהות', 'סוג', 'נכנס (ש׳)', 'יצא (ש׳)', 'במעקב (ש׳)', 'מרחק (מ׳)', 'ממוצע (קמ״ש)', 'מרבית (קמ״ש)'], rows) + '</div>';
    [...sumBox.querySelectorAll('tr')].filter(tr => tr.querySelector('td')).forEach((tr, i) => { tr.style.cursor = 'pointer'; if (VEH[i].id === sel) tr.style.background = 'rgba(10,132,255,.12)'; tr.onclick = () => { if (sel !== VEH[i].id) select(VEH[i].id); vid.currentTime = VEH[i].t0 + 0.05; }; });
  }
  const loop = () => { if (!box.isConnected) return; if (!vid.paused) draw(false); requestAnimationFrame(loop); }; requestAnimationFrame(loop);
  draw(true);
  V.say(box, '<span class="note-small">המסלולים כאן הם <b>אמת מידה מתוקנת</b> — מזהה מוכן, ואחריו תיקון ידני של כל מסלול — ולא הרצה של מערכת. זו המטרה: המערכת שלך תריץ על אותו סרטון, ותימדד מולה במדדים של <a class="ref" href="#/m8/s/1.4">סעיף 1.4</a>.</span>');
};
})();
