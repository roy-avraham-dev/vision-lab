/* מעבדת הראייה — app core: storage, routing, rendering of the original content, code runner, glossary, cards, search */
(function () {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
window.W = window.W || {};          // widgets registry: W[id] = (el, ctx) => {}
window.LAYER = window.LAYER || {};  // hand-written learning layer per module

/* ---------------- storage ---------------- */
const KEY = 'vision-lab-v1';
const Store = {
  d: (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })(),
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.d)); } catch (e) {} },
  get(k, def) { return this.d[k] === undefined ? def : this.d[k]; },
  set(k, v) { this.d[k] = v; this.save(); },
  map(k) { if (!this.d[k]) this.d[k] = {}; return this.d[k]; },
};
window.Store = Store;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 1800); }
window.toast = toast;

/* ---------------- settings ---------------- */
function applySettings() {
  const s = Store.get('settings', {});
  document.documentElement.dataset.theme = s.dark ? 'dark' : 'light';
  document.documentElement.style.setProperty('--fs', (s.fs || 17) + 'px');
}

/* ---------------- content index ---------------- */
const MODS = [
  { id: 'm0', n: 0, title: 'יסודות מתמטיים לראייה ממוחשבת', part: 'ארגז הכלים' },
  { id: 'm1', n: 1, title: 'עיבוד תמונה קלאסי', part: 'מצלמה מיוצבת' },
  { id: 'm2', n: 2, title: 'למידה עמוקה לראייה', part: 'המוח' },
  { id: 'm3', n: 3, title: 'גאומטריה תלת־ממדית ומודל מצלמה', part: 'מצפן ומפה' },
  { id: 'm4', n: 4, title: 'זיהוי עצמים ועבודה עם נתונים', part: 'עיניים חדות' },
  { id: 'm5', n: 5, title: 'מעקב רב־מטרות ואנליטיקה', part: 'זיכרון ומעקב' },
  { id: 'm6', n: 6, title: 'האצה וזמן אמת', part: 'מנוע טורבו' },
  { id: 'm7', n: 7, title: 'מודלי שפה־ראייה ועולם פתוח', part: 'אוזניים לשפה' },
  { id: 'm8', n: 8, title: 'פרויקט — מעקב ומדידת מהירות של רכבים מרחפן', part: 'המשימה' },
];
window.MODS = MODS;
function mod(id) { return (window.CONTENT || {})[id]; }
let CURMID = 'm0';
function loadedMods() { return MODS.filter(x => mod(x.id)).map(x => x.id); }
function layer(id) { return window.LAYER[id] || {}; }
function allSections(m) { const out = []; m.chapters.forEach(c => c.sections.forEach(s => out.push({ ch: c, s }))); return out; }
function secKey(mid, sid) { return mid + ':' + sid; }
function isDone(mid, sid) { return !!Store.map('done')[secKey(mid, sid)]; }
function chProgress(mid, ch) { const n = ch.sections.length; const d = ch.sections.filter(s => isDone(mid, s.id)).length; return n ? d / n : 0; }
function modProgress(mid) { const m = mod(mid); if (!m) return 0; const all = allSections(m); return all.length ? all.filter(x => isDone(mid, x.s.id)).length / all.length : 0; }

/* ---------------- inline markdown (bold, code, escapes) + glossary ---------------- */
let GLOSS = [];   // [{he, en, kid, re}]
function buildGlossary() {
  GLOSS = [];
  Object.entries(window.LAYER).forEach(([mid, L]) => (L.glossary || []).forEach(g => {
    const forms = [g.he].concat(g.forms || []);
    const pat = forms.map(f => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length).join('|');
    if (GLOSS.some(x => x.he === g.he)) return;
    GLOSS.push(Object.assign({ mid }, g, { re: new RegExp('(^|[\\s(\\"׳״־])(ה|ו|ב|ל|מ|ש|כ|וה|שה|וב|ול|במ|מה)?(' + pat + ')(?=$|[\\s,.:;)\\"?!־])', 'g') }));
  }));
}
function glossify(html) {
  // only touch text outside tags; each term once per block
  if (!GLOSS.length) return html;
  const used = new Set();
  return html.split(/(<[^>]+>)/).map((part, i, arr) => {
    if (part.startsWith('<')) return part;
    // don't glossify inside inline code
    const prev = arr.slice(0, i).join('');
    if ((prev.match(/<code/g) || []).length > (prev.match(/<\/code>/g) || []).length) return part;
    GLOSS.forEach((g, gi) => {
      if (used.has(gi)) return;
      part = part.replace(g.re, (m, a, pre, term) => { if (used.has(gi)) return m; used.add(gi); return a + (pre || '') + '<span class="gl" data-g="' + gi + '">' + term + '</span>'; });
    });
    return part;
  }).join('');
}
function md(s, opts = {}) {
  if (!s) return '';
  const toks = []; let out = '';
  // protect escapes
  s = s.replace(/\\(.)/g, (m, c) => { toks.push(esc(c)); return '\u0001' + (toks.length - 1) + '\u0002'; });
  s = esc(s);
  // a small whitelist of inline tags written by the site's own additions: <span class="ltr">, <i>, <b>, <sub>, <sup>
  s = s.replace(/&lt;(span|code) class=&quot;(ltr|note-small)&quot;&gt;/g, '<$1 class="$2">').replace(/&lt;\/code&gt;/g, '</code>').replace(/&lt;\/span&gt;/g, '</span>').replace(/&lt;(\/?)(i|b|sub|sup)&gt;/g, '<$1$2>');
  s = s.replace(/`([^`]+)`/g, (m, c) => '<code class="inline-code">' + c + '</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  s = s.replace(/\u0001(\d+)\u0002/g, (m, i) => toks[+i]);
  out = s;
  if (!opts.noGloss) out = glossify(out);
  out = out.replace(/\n/g, '<br>');
  if (!opts.noLinks) out = linkRefs(out);
  return out;
}
window.md = md;
function linkRefs(html) {
  const mid = CURMID; const m = mod(mid); if (!m) return html;
  const secs = new Set(); m.chapters.forEach(c => c.sections.forEach(x => secs.add(x.id)));
  return html.split(/(<[^>]+>)/).map((part, i, arr) => {
    if (part.startsWith('<')) return part;
    const before = arr.slice(0, i).join('');
    if ((before.match(/<a /g) || []).length > (before.match(/<\/a>/g) || []).length) return part;
    if ((before.match(/<code/g) || []).length > (before.match(/<\/code>/g) || []).length) return part;
    part = part.replace(/(^|[\s(])((?:ב|מ|ל|ו)?סעיף )(\d{1,2}\.\d{1,2})(?![\d.]\d)/g, (mm, a, w, id) => secs.has(id) && !/מודול \d+,\s*$/.test(before.slice(-30)) ? a + w + '<a class="ref" href="#/' + mid + '/s/' + id + '">' + id + '</a>' : mm);
    part = part.replace(/(^|[\s(])((?:ב|מ|ל|ו)?פרק )(\d{1,2})(?![\d.]\d)/g, (mm, a, w, n) => +n >= 1 && +n <= m.chapters.length && !/מודול \d+,\s*$/.test(before.slice(-30)) ? a + w + '<a class="ref" href="#/' + mid + '/c/' + n + '">' + n + '</a>' : mm);
    // "סעיף 0.6.5" means module 0, section 6.5
    part = part.replace(/((?:ב|מ|ל|ו)?סעיף )0\.(\d{1,2}\.\d{1,2})(?![\d.]\d)/g, (mm, w, id) => { const om = mod('m0'); return om && om.chapters.some(c => c.sections.some(x => x.id === id)) ? w + '<a class="ref" href="#/m0/s/' + id + '">0.' + id + '</a>' : mm; });
    // explicit references to another module: "מודול 0, פרק 9" / "מודול 0, סעיף 1.4"
    part = part.replace(/(מודול (\d), (?:ב|מ|ל)?)(פרק|סעיף)( )(\d{1,2}(?:\.\d{1,2})?)(?![\d.]\d)/g, (mm, pre, mn, kind, sp, id) => { const om = mod('m' + mn); if (!om) return mm; const ok = kind === 'פרק' ? om.chapters.some(c => String(c.n) === id) : om.chapters.some(c => c.sections.some(x => x.id === id)); return ok ? pre + kind + sp + '<a class="ref" href="#/m' + mn + '/' + (kind === 'פרק' ? 'c' : 's') + '/' + id + '">' + id + '</a>' : mm; });
    return part;
  }).join('');
}

/* ---------------- code highlighting ---------------- */
const KW = /\b(import|from|as|def|return|for|in|if|elif|else|while|print|lambda|class|True|False|None|and|or|not|with|assert|pass|break|continue|try|except|raise|int|float|public|static|void|new|System)\b/g;
function hl(line, lang) {
  if (lang === 'shell') return esc(line);
  let code = line, cm = '';
  const ci = (lang === 'java' || lang === 'cpp') ? line.indexOf('//') : findComment(line);
  if (ci >= 0) { code = line.slice(0, ci); cm = line.slice(ci); }
  const parts = []; let rest = esc(code);
  rest = rest.replace(/(&quot;[^&]*?&quot;|"[^"]*"|'[^']*')/g, m => { parts.push('<span class="tok-s">' + m + '</span>'); return '\u0003' + String.fromCharCode(0xE000 + parts.length - 1) + '\u0004'; });
  rest = rest.replace(KW, '<span class="tok-k">$1</span>').replace(/\b(\d+\.?\d*(e-?\d+)?)\b/g, '<span class="tok-n">$1</span>').replace(/\b([a-zA-Z_][\w]*)(?=\()/g, '<span class="tok-f">$1</span>');
  rest = rest.replace(/\u0003([\uE000-\uE0FF])\u0004/g, (m, c) => parts[c.charCodeAt(0) - 0xE000]);
  return rest + (cm ? '<span class="tok-c">' + esc(cm) + '</span>' : '');
}
function findComment(line) { let q = null; for (let i = 0; i < line.length; i++) { const c = line[i]; if (q) { if (c === q) q = null; } else if (c === '"' || c === "'") q = c; else if (c === '#') return i; } return -1; }

/* ---------------- Python runner (Pyodide, loaded on demand) ---------------- */
let pyReady = null, pyStatus = () => {};
const PY_VERSIONS = ['0.29.3', '0.27.2'];
const PY_HOSTS = ['https://cdn.jsdelivr.net', 'https://fastly.jsdelivr.net', 'https://gcore.jsdelivr.net'];
function addScript(src, ms) {
  return new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = src;
    const t = setTimeout(() => { s.remove(); rej(new Error('timeout ' + src)); }, ms);
    s.onload = () => { clearTimeout(t); res(); };
    s.onerror = () => { clearTimeout(t); s.remove(); rej(new Error('blocked ' + src)); };
    document.head.appendChild(s);
  });
}
const PY_SETUP = `
import sys, io, base64
import numpy as np
np.random.seed(0)
img = (np.random.rand(480, 640, 3) * 255).astype(np.uint8)
def __run(src):
    buf = io.StringIO(); old = sys.stdout; sys.stdout = buf
    err = ''; figs = []
    plt = sys.modules.get('matplotlib.pyplot')
    if plt: plt.close('all')
    try:
        exec(compile(src, '<cell>', 'exec'), globals())
    except Exception as e:
        import traceback; err = traceback.format_exc(limit=1)
    finally:
        sys.stdout = old
    cv = sys.modules.get('cv2')
    if cv is not None and globals().get('__shown'):
        for name, im in list(__shown.items())[:3]:
            ok, b = cv.imencode('.png', im)
            if ok: figs.append(base64.b64encode(b.tobytes()).decode())
        __shown.clear()
    plt = sys.modules.get('matplotlib.pyplot')
    if plt:
        for n in plt.get_fignums():
            b = io.BytesIO(); plt.figure(n).savefig(b, format='png', dpi=80, bbox_inches='tight'); figs.append(base64.b64encode(b.getvalue()).decode())
    return buf.getvalue(), err, figs
`;
function findBytes(u8, str, from) { const n = str.length; outer: for (let i = from || 0; i <= u8.length - n; i++) { for (let j = 0; j < n; j++) if (u8[i + j] !== str.charCodeAt(j)) continue outer; return i; } return -1; }
function checkZip(buf) {
  const u8 = new Uint8Array(buf);
  if (!(u8[0] === 0x50 && u8[1] === 0x4b)) return 'not a zip';
  if (findBytes(u8.subarray(Math.max(0, u8.length - 70000)), 'PK\x05\x06') < 0) return 'zip end record missing (file cut or changed)';
  if (findBytes(u8, 'encodings/__init__') < 0) return 'encodings package missing inside the zip';
  return '';
}
async function fetchStdlib(ver, diag) {
  for (const h of PY_HOSTS.concat(['https://unpkg.com'])) {
    const u = h === 'https://unpkg.com' ? h + '/pyodide@' + ver + '/python_stdlib.zip' : h + '/pyodide/v' + ver + '/full/python_stdlib.zip';
    try {
      const r = await fetch(u, { cache: 'no-store' }); const buf = await r.arrayBuffer();
      const bad = r.ok ? checkZip(buf) : 'HTTP ' + r.status;
      diag.push(ver + ' ' + u.replace('https://', '').split('/')[0] + ': ' + r.status + ', ' + (r.headers.get('content-type') || '?') + ', ' + buf.byteLength + ' bytes ' + (bad ? '✗ ' + bad : '✓'));
      if (!bad) return URL.createObjectURL(new Blob([buf], { type: 'application/zip' }));
    } catch (e) { diag.push(ver + ' ' + u.replace('https://', '') + ': ' + (e.message || e)); }
  }
  return null;
}
function loadPy() {
  if (pyReady) return pyReady;
  pyReady = (async () => {
    const report = [];
    for (const ver of PY_VERSIONS) {
      const diag = [];
      pyStatus('מוריד את הספרייה הסטנדרטית של פייתון (' + ver + ')…');
      const stdLibURL = await fetchStdlib(ver, diag);
      let host = null;
      try { window.loadPyodide = undefined; window._createPyodideModule = undefined; } catch (e) {}
      for (const h of PY_HOSTS) {
        try { pyStatus('מוריד את פייתון (' + ver + ')…'); await addScript(h + '/pyodide/v' + ver + '/full/pyodide.js', 30000); host = h; break; }
        catch (e) { diag.push(String(e.message || e)); }
      }
      if (!host) { report.push(diag.join('\n')); continue; }
      const log = [];
      try {
        pyStatus('מפעיל את פייתון (' + ver + ')…');
        const opts = { indexURL: host + '/pyodide/v' + ver + '/full/', stdout: t => log.push(t), stderr: t => log.push(t) };
        if (stdLibURL) opts.stdLibURL = stdLibURL;
        const py = await window.loadPyodide(opts);
        pyStatus('טוען את numpy…');
        await py.loadPackage(['numpy'], { messageCallback: () => {}, errorCallback: t => log.push(t) });
        await py.runPythonAsync(PY_SETUP);
        py.setStdout({ batched: () => {} }); py.setStderr({ batched: () => {} });
        py._host = host;
        return py;
      } catch (e) {
        report.push(['== ' + ver + ': ' + String(e && e.message || e)].concat(log.filter(l => /Error|error/.test(l)).slice(-4), diag).join('\n'));
      }
    }
    throw new Error(report.join('\n\n') + '\n[' + navigator.userAgent + ']');
  })();
  pyReady.catch(() => { pyReady = null; });
  return pyReady;
}
async function pyExec(src, status) {
  pyStatus = status || (() => {});
  const py = await loadPy();
  if (/\bcv2\b/.test(src) && !py._cv) {
    pyStatus('טוען את ספריית עיבוד התמונה (בפעם הראשונה בלבד)…');
    await py.loadPackage(['opencv-python']);
    await py.runPythonAsync(`
import cv2, numpy as np
__shown = {}
def __imshow(name, im):
    im = np.asarray(im)
    if im.dtype != np.uint8: im = np.clip(im, 0, 255).astype(np.uint8)
    __shown[str(name)] = im.copy()
cv2.imshow = __imshow
cv2.waitKey = lambda *a, **k: -1
cv2.destroyAllWindows = lambda *a, **k: None
cv2.namedWindow = lambda *a, **k: None
cv2.setMouseCallback = lambda *a, **k: None
cv2.createTrackbar = lambda *a, **k: None
cv2.getTrackbarPos = lambda *a, **k: 0
__imwrite = cv2.imwrite
def __imwrite2(path, im, *a):
    __imshow(path, im); return __imwrite(path, im, *a)
cv2.imwrite = __imwrite2
`);
    py._cv = true;
  }
  if (/matplotlib|plt\./.test(src) && !py._mpl) {
    pyStatus('טוען את matplotlib (בפעם הראשונה בלבד)…');
    await py.loadPackage(['matplotlib']);
    await py.runPythonAsync("import matplotlib\nmatplotlib.use('Agg')\nimport matplotlib.pyplot as plt\nplt.show = lambda *a, **k: None");
    py._mpl = true;
  }
  return py.globals.get('__run')(src).toJs();
}
window.pyExec = pyExec;
function pyFailHTML(e) {
  const msg = String(e && e.message || e);
  return '<span class="lbl">לא הצלחתי לטעון את פייתון בדפדפן. אפשר ללחוץ שוב כדי לנסות מחדש. בינתיים, אם לקוד יש פלט שחושב מראש, הוא מופיע למטה.</span>' +
    '<details style="margin-top:6px"><summary class="lbl">פרטי השגיאה</summary><pre style="white-space:pre-wrap;direction:ltr;text-align:left">' + esc(msg) + '</pre>' +
    '<div class="lbl">אם כתוב blocked או timeout: הדפדפן או הרשת חוסמים את השרת cdn.jsdelivr.net (לפעמים זה סינון של ספק האינטרנט, חוסם פרסומות או רשת של עבודה). נסה לפתוח <a href="https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.js" target="_blank">את הקישור הזה</a> בדפדפן. אם הוא לא נפתח, זו הבעיה.</div></details>';
}
window.pyFailHTML = pyFailHTML;
function preOutHTML(b, title) {
  if (!(b && b.output && (b.output.stdout || b.output.figs))) return '';
  return '<div class="lbl">' + title + '</div>' + (b.output.stdout ? '<pre>' + esc(b.output.stdout) + '</pre>' : '') + (b.output.figs || []).map(f => '<img src="' + f + '">').join('');
}
/* fb = { b, edited }: the block's precomputed output is used only as a fallback, when the code cannot run in the browser */
async function runPython(src, outEl, fb) {
  const st = t => { outEl.innerHTML = '<span class="lbl">' + t + ' (בפעם הראשונה זה יכול לקחת חצי דקה)</span>'; };
  const saved = fb && !fb.edited ? preOutHTML(fb.b, 'הפלט של הקוד הזה, כפי שחושב מראש במחשב:') : '';
  st('טוען את פייתון בדפדפן…');
  try {
    if (/^\s*(import|from)\s+torch/m.test(src)) { outEl.innerHTML = '<span class="lbl">PyTorch לא זמין בפייתון שרץ בדפדפן, ולכן את הקוד הזה אפשר להריץ רק במחשב.</span>' + saved; return; }
    const [stdout, err, figs] = await pyExec(src, st);
    outEl.innerHTML = '<div class="lbl">פלט:</div>' + (stdout ? '<pre>' + esc(stdout) + '</pre>' : '') + (err ? '<pre class="bad" style="color:var(--warn-ink)">' + esc(err) + '</pre>' : '') + figs.map(f => '<img src="data:image/png;base64,' + f + '">').join('') + (!stdout && !err && !figs.length ? '<span class="lbl">(אין פלט מודפס)</span>' : '') +
      (err && saved ? '<div class="lbl" style="margin-top:8px">הקוד לא רץ כאן עד הסוף (ייתכן שהוא נשען על קוד קודם בפרק, או על משהו שאין בדפדפן).</div>' + saved : '');
  } catch (e) {
    outEl.innerHTML = pyFailHTML(e) + saved;
  }
}
function copyText(t) {
  const legacy = () => { const ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0'; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) {} ta.remove(); toast(ok ? 'הועתק' : 'ההעתקה נחסמה — סמן את הקוד והעתק ידנית'); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(() => toast('הועתק'), legacy); else legacy();
}
/* additions that make a code example run on its own (imports, test data, a window that shows the result) */
function codeFull(b) { const L = window.LAYER && window.LAYER[String(b.id).split('-')[0]]; return (L && L.codeFull && L.codeFull[b.id]) || null; }
function bodyText(b, f) { return f && f.main ? b.text.split('\n').map(l => l.trim() ? '    ' + l : '').join('\n') : b.text; }   /* 'main': the block runs inside main() (Windows + DataLoader workers) */
function fullSrc(b) { const f = codeFull(b); return f ? (f.pre || []).map(x => x.code + '\n').join('') + bodyText(b, f) + (f.post || []).map(x => '\n' + x.code).join('') : b.text; }
function localOnly(b) { const f = codeFull(b); return !!(f && f.local) || /^\s*(import|from)\s+(torch|tensorrt|onnxruntime|pycuda)/m.test(b.text) || /cv2\.VideoCapture|cv2\.VideoWriter/.test(b.text); }
function codeButtons(b) {
  if (b.lang !== 'python') return '';
  return localOnly(b) ? '<span class="localonly" title="צריך מצלמה, קובץ וידאו, חלון אמיתי או ספרייה שאין בדפדפן">רץ רק במחשב</span>' : '<button class="sm" data-a="run">▶ הרץ</button><button class="sm ghost" data-a="edit">ערוך ונסה</button>';
}
function codeOutHTML(b) {
  const f = codeFull(b); const note = f && f.note ? '<div class="codenote">' + md(f.note) + '</div>' : '';
  const shown = b.lang !== 'python' || localOnly(b) ? preOutHTML(b, b.lang === 'python' ? 'כך נראה הפלט כשמריצים במחשב (חושב מראש):' : 'פלט צפוי (חושב מראש):') : '';
  return note + (shown ? '<div class="codeout expected">' + shown + '</div>' : '') + '<div class="codeout live" hidden></div>';
}
/* ---------------- block rendering (the original material, verbatim) ---------------- */
function texHTML(src, display = true) {
  try { return '<span dir="ltr" style="unicode-bidi:isolate;display:' + (display ? 'block' : 'inline-block') + '">' + window.katex.renderToString(src.replace(/\n/g, ' '), { displayMode: display, throwOnError: false, trust: true, strict: false }) + '</span>'; }
  catch (e) { return '<pre>' + esc(src) + '</pre>'; }
}
window.texHTML = texHTML;
function codeBox(b, ctx) {
  const box = document.createElement('div'); box.className = 'codebox'; box.dataset.bid = b.id;
  const lang = b.lang; const f = codeFull(b);
  const label = { python: 'פייתון', java: 'ג׳אווה', cpp: 'C++', shell: 'שורת פקודה' }[lang] || 'קוד';
  const lnHTML = (txt, cls) => txt.split('\n').map(l => '<span class="ln' + (cls || '') + '">' + (hl(l, lang) || ' ') + '</span>').join('');
  const pre = '<pre>' + (f ? (f.pre || []).map(x => lnHTML(x.code, ' added')).join('') : '') + lnHTML(bodyText(b, f)) + (f ? (f.post || []).map(x => lnHTML(x.code, ' added')).join('') : '') + '</pre>' +
    (f && ((f.pre || []).length || (f.post || []).length) ? '<div class="codenote">השורות המסומנות נוספו כדי שהקוד ירוץ לבד: ' + (f.pre || []).concat(f.post || []).map(x => md(x.say)).join(' ') + '</div>' : '');
  box.innerHTML = '<div class="codebar"><span>' + label + '</span><span class="spacer"></span>' + codeButtons(b) +
    '<button class="sm ghost" data-a="copy">העתק</button></div>' + pre + codeOutHTML(b);
  const live = box.querySelector('.live');
  box.addEventListener('click', e => {
    const a = e.target.closest('button') && e.target.closest('button').dataset.a; if (!a) return;
    if (a === 'copy') copyText(currentSrc());
    if (a === 'run') { live.hidden = false; runPython(currentSrc(), live, { b, edited: currentSrc() !== fullSrc(b) }); }
    if (a === 'edit') {
      const ta = box.querySelector('textarea');
      if (ta) return;
      const t = document.createElement('textarea'); t.className = 'codeedit'; t.value = fullSrc(b); t.spellcheck = false;
      box.querySelector('pre').replaceWith(t); t.focus(); toast('שנה מספרים ולחץ "הרץ"');
    }
  });
  function currentSrc() { const ta = box.querySelector('textarea'); return ta ? ta.value : fullSrc(b); }
  return box;
}
function texBox(b) {
  const d = document.createElement('div'); d.className = 'tex'; d.dataset.bid = b.id;
  const L = ctxLayer && ctxLayer.decoders && ctxLayer.decoders[b.id];
  d.innerHTML = '<div class="texbar"><button class="sm ghost" data-a="src">הצג מקור LaTeX</button>' + (L ? '<button class="sm" data-a="dec">פענח את הנוסחה</button>' : '') + '</div>' + texHTML(b.text) + '<div class="texsrc">' + esc(b.text) + '</div>' + (L ? '<div class="decoder" hidden></div>' : '');
  d.addEventListener('click', e => {
    const bt = e.target.closest('button'); if (!bt) return;
    if (bt.dataset.a === 'src') { d.classList.toggle('showsrc'); bt.textContent = d.classList.contains('showsrc') ? 'הסתר מקור' : 'הצג מקור LaTeX'; }
    if (bt.dataset.a === 'dec') { const dec = d.querySelector('.decoder'); dec.hidden = !dec.hidden; if (!dec.dataset.done) { renderDecoder(dec, L); dec.dataset.done = 1; } }
  });
  return d;
}
function renderDecoder(el, L) {
  el.style.direction = 'rtl'; el.style.textAlign = 'right';
  el.innerHTML = '<div class="dec-formula" style="text-align:center;direction:ltr;font-size:1.25em;margin:8px 0">' + texHTML(L.tex) + '</div><div class="dec-list"></div><div class="note-small">רחף מעל הסבר כדי לראות איזה חלק בנוסחה הוא מתאר.</div>';
  const list = el.querySelector('.dec-list');
  L.parts.forEach((p, i) => {
    const r = document.createElement('div'); r.className = 'row'; r.style.cssText = 'display:flex;gap:10px;align-items:center;padding:4px 8px;border-radius:8px;cursor:default';
    r.innerHTML = '<span style="min-width:90px;direction:ltr;text-align:center">' + texHTML(p.tex, false) + '</span><span>' + md(p.say, { noGloss: true }) + '</span>';
    r.addEventListener('mouseenter', () => { r.style.background = 'var(--accent-bg)'; $$('.dp' + i, el).forEach(x => { x.style.background = 'color-mix(in srgb,var(--c5) 45%,transparent)'; x.style.borderRadius = '4px'; }); });
    r.addEventListener('mouseleave', () => { r.style.background = ''; $$('.dp' + i, el).forEach(x => x.style.background = ''); });
    list.appendChild(r);
  });
}
/* Code + its line-by-line explanation, merged: every code line sits next to its explanation. */
function isLineTable(t) {
  if (!t || t.type !== 'table' || !t.rows[0]) return false;
  const head = t.rows[0].map(c => c.map(x => x.text).join(' ')).join('|');
  return /מה היא עושה/.test(head) && /שורה/.test(head);
}
function annotatedCode(b, table) {
  const lang = b.lang;
  const norm = x => x.replace(/\s+/g, '').replace(/\.\.\.$/, '');
  const lines = b.text.split('\n');
  const head = table.rows[0];
  const codeCol = head.findIndex(c => c.map(x => x.text).join(' ').includes('שורה'));
  const txtCol = codeCol === 0 ? 1 : 0;
  const rows = table.rows.slice(1).map(r => ({ code: (r[codeCol] || []).map(x => x.text).join(' '), say: (r[txtCol] || []).map(x => x.type === 'code' ? '`' + x.text + '`' : x.text).join(' ') }));
  const anchors = []; let cur = 0; const orphans = [];
  rows.forEach(r => {
    const k = norm(r.code); let hit = -1;
    for (let i = cur; i < lines.length && hit < 0; i++) { const l = norm(lines[i]); if (!l) continue; if (l.startsWith(k.slice(0, 14)) || (k.length > 3 && k.startsWith(l.slice(0, Math.min(l.length, 14))))) hit = i; }
    if (hit < 0) { const tok = (r.code.match(/[A-Za-z_][\w.]*/) || [''])[0]; for (let i = cur; i < lines.length && hit < 0 && tok; i++) if (lines[i].includes(tok)) hit = i; }
    if (hit < 0) { orphans.push(r); return; }
    anchors.push({ at: hit, r }); cur = hit + 1;
  });
  const segs = [];
  if (!anchors.length || anchors[0].at > 0) segs.push({ from: 0, to: anchors.length ? anchors[0].at : lines.length, r: null });
  anchors.forEach((a, i) => segs.push({ from: a.at, to: i + 1 < anchors.length ? anchors[i + 1].at : lines.length, r: a.r }));
  const box = document.createElement('div'); box.className = 'codebox annot'; box.dataset.bid = b.id;
  const label = { python: 'פייתון', java: 'ג׳אווה', cpp: 'C++', shell: 'שורת פקודה' }[lang] || 'קוד';
  let html = '<div class="codebar"><span>' + label + ' · כל שורה עם ההסבר שלה</span><span class="spacer"></span>' +
    codeButtons(b) + '<button class="sm ghost" data-a="copy">העתק</button></div><div class="annrows">';
  const f = codeFull(b);
  const addRow = x => { html += '<div class="annrow added"><div class="annsay"><span class="addtag">תוספת להרצה עצמאית</span> ' + md(x.say) + '</div><pre class="anncode">' + x.code.split('\n').map(l => '<span class="ln">' + (hl(l, lang) || ' ') + '</span>').join('') + '</pre></div>'; };
  if (f) (f.pre || []).forEach(addRow);
  segs.forEach(sg => {
    let ls = lines.slice(sg.from, sg.to);
    // trailing blank lines become a spacer
    let tail = 0; while (ls.length > 1 && !ls[ls.length - 1].trim()) { ls.pop(); tail++; }
    html += '<div class="annrow' + (sg.r ? '' : ' plain') + '"><div class="annsay">' + (sg.r ? md(sg.r.say) : '') + '</div><pre class="anncode">' + ls.map(l => '<span class="ln">' + (hl(l, lang) || ' ') + '</span>').join('') + '</pre></div>';
    if (tail) html += '<div class="annrow gap"></div>';
  });
  orphans.forEach(r => { html += '<div class="annrow"><div class="annsay">' + md(r.say) + '</div><pre class="anncode"><span class="ln" style="opacity:.75">' + esc(r.code) + '</span></pre></div>'; });
  if (f) (f.post || []).forEach(addRow);
  html += '</div>' + codeOutHTML(b);
  box.innerHTML = html;
  const live = box.querySelector('.live');
  box.addEventListener('click', e => {
    const a = e.target.closest('button') && e.target.closest('button').dataset.a; if (!a) return;
    if (a === 'copy') copyText(src());
    if (a === 'run') { live.hidden = false; runPython(src(), live, { b, edited: src() !== fullSrc(b) }); }
    if (a === 'edit') { if (box.querySelector('textarea')) return; const t = document.createElement('textarea'); t.className = 'codeedit'; t.value = fullSrc(b); t.spellcheck = false; box.querySelector('.annrows').after(t); t.focus(); toast('שנה מספרים ולחץ "הרץ"'); }
  });
  const src = () => { const ta = box.querySelector('textarea'); return ta ? ta.value : fullSrc(b); };
  return box;
}
let ctxLayer = null;
function renderBlocks(blocks, container, opts = {}) {
  let list = null, listKind = null;
  const flush = () => { list = null; listKind = null; };
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    (window.__seen = window.__seen || []).push(b.id);
    if (b.type === 'li') {
      const kind = b.ordered ? 'ol' : 'ul';
      if (!list || listKind !== kind) { list = document.createElement(kind); if (b.dir === 'ltr') list.className = 'dir-ltr'; container.appendChild(list); listKind = kind; }
      const li = document.createElement('li'); li.dataset.bid = b.id; if (b.dir === 'ltr') li.className = 'dir-ltr';
      if (b.ordered) li.style.listStyle = 'none';
      li.innerHTML = md(b.text); if (b.level) li.style.marginRight = (b.level * 1.4) + 'em';
      list.appendChild(li); continue;
    }
    flush();
    let el;
    if (b.type === 'p') { el = document.createElement('p'); el.innerHTML = md(b.text); if (b.dir === 'ltr') el.className = 'dir-ltr'; if (b.indent) el.style.marginRight = (b.indent * 1.2) + 'em'; }
    else if (b.type === 'quote') { el = document.createElement('blockquote'); el.innerHTML = md(b.text); }
    else if (b.type === 'h2' || b.type === 'h3' || b.type === 'h1') { el = document.createElement('h4'); el.innerHTML = md(b.text); }
    else if (b.type === 'img') {
      el = document.createElement('figure');
      const cap = blocks[i + 1] && blocks[i + 1].type === 'caption' ? blocks[i + 1] : null;
      el.innerHTML = '<img loading="lazy" src="img/' + b.src + '" alt="' + esc(cap ? cap.text : '') + '">' + (cap ? '<figcaption>' + md(cap.text) + '</figcaption>' : '');
      if (cap) { i++; el.dataset.cap = cap.id; window.__seen.push(cap.id); }
    }
    else if (b.type === 'caption') { el = document.createElement('p'); el.className = 'note-small'; el.innerHTML = md(b.text); }
    else if (b.type === 'code') {
      const n1 = blocks[i + 1], n2 = blocks[i + 2];
      if (b.lang !== 'tex' && n1 && n1.type === 'p' && /^\*\*הסבר שורה אחר שורה:\*\*$/.test(n1.text) && isLineTable(n2)) { el = annotatedCode(b, n2); window.__seen.push(n1.id, n2.id); i += 2; }
      else if (b.lang !== 'tex' && isLineTable(n1)) { el = annotatedCode(b, n1); window.__seen.push(n1.id); i += 1; }
      else el = b.lang === 'tex' ? texBox(b) : codeBox(b);
    }
    else if (b.type === 'table') { el = tableEl(b, blocks, i, container); }
    if (el) { el.dataset.bid = el.dataset.bid || b.id; container.appendChild(el); }
  }
}
function cellHTML(cell) {
  return cell.map(s => s.type === 'code' ? (s.inline ? '<code class="cell">' + esc(s.text) + '</code>' : '<pre class="mono" style="direction:ltr;text-align:left;margin:0">' + esc(s.text) + '</pre>') : '<div>' + md(s.text) + '</div>').join('');
}
function tableEl(b, blocks, i, container) {
  const t = document.createElement('table');
  const rows = b.rows;
  const hasHead = b.header !== false;
  t.innerHTML = rows.map((r, ri) => '<tr>' + r.map(c => (ri === 0 && hasHead ? '<th>' : '<td>') + cellHTML(c) + (ri === 0 && hasHead ? '</th>' : '</td>')).join('') + '</tr>').join('');
  // line-by-line explanation tables: hover a row -> highlight that code line in the code block above
  const headTxt = rows[0] ? rows[0].map(c => c.map(s => s.text).join(' ')).join('|') : '';
  if (/מה היא עושה/.test(headTxt) && /שורה/.test(headTxt)) {
    const codeEls = $$('.codebox', container);
    const box = codeEls[codeEls.length - 1];
    if (box) {
      $$('tr', t).slice(1).forEach(tr => {
        const codeCell = tr.querySelector('code.cell, pre');
        if (!codeCell) return;
        const key = codeCell.textContent.replace(/\.\.\.$/, '').replace(/\s+/g, ' ').trim().slice(0, 28);
        tr.addEventListener('mouseenter', () => { tr.classList.add('hl'); $$('.ln', box).forEach(ln => { const lt = ln.textContent.replace(/\s+/g, ' ').trim(); if (key && (lt.startsWith(key.slice(0, Math.min(key.length, 18))) || (key.length > 6 && lt.includes(key.slice(0, 14))))) ln.classList.add('hl'); }); });
        tr.addEventListener('mouseleave', () => { tr.classList.remove('hl'); $$('.ln.hl', box).forEach(x => x.classList.remove('hl')); });
      });
      t.title = 'רחף מעל שורה בטבלה כדי לראות אותה מודגשת בקוד';
    }
  }
  return t;
}

/* ---------------- glossary tooltip ---------------- */
document.addEventListener('mouseover', e => {
  const g = e.target.closest && e.target.closest('.gl');
  const tip = $('#tip');
  if (!g) { if (!e.target.closest || !e.target.closest('#tip')) tip.style.display = 'none'; return; }
  const G = GLOSS[+g.dataset.g]; if (!G) return;
  tip.innerHTML = '<b>' + esc(G.he) + '</b>' + (G.en ? ' <span class="ltr" style="color:var(--ink3)">(' + esc(G.en) + ')</span>' : '') + '<div style="margin-top:4px">' + md(G.kid, { noGloss: true }) + '</div>' + (G.where ? '<div class="note-small" style="margin-top:6px">מופיע לראשונה בסעיף ' + esc(G.where) + '</div>' : '');
  const r = g.getBoundingClientRect();
  tip.style.display = 'block';
  tip.style.top = Math.min(window.innerHeight - tip.offsetHeight - 8, r.bottom + 6) + 'px';
  tip.style.left = Math.max(8, Math.min(window.innerWidth - tip.offsetWidth - 8, r.left)) + 'px';
});

/* ---------------- layout ---------------- */
const ICON = '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="var(--accent)"/><circle cx="16" cy="16" r="7" fill="#fff"/><circle cx="16" cy="16" r="3.5" fill="var(--ink)"/><circle cx="18" cy="14" r="1.2" fill="#fff"/></svg>';
function shell() {
  document.body.innerHTML = `
  <div id="top">
    <button class="ghost" id="menuBtn" aria-label="תפריט">☰</button>
    <a class="logo" href="#/">${ICON}<span>מעבדת הראייה</span></a>
    <span class="spacer"></span>
    <input id="search" type="search" placeholder="חיפוש בכל החומר…">
    <a href="#/glossary"><button class="ghost" title="מילון מונחים">מילון</button></a>
    <a href="#/cards"><button class="ghost" title="כרטיסיות חזרה">חזרה</button></a>
    <a href="#/interview"><button class="ghost" title="מצב ראיון">ראיון</button></a>
    <a href="#/mine"><button class="ghost" title="ההערות והסימונים שלי">שלי</button></a>
    <button class="ghost" id="themeBtn" title="מצב כהה/בהיר">◐</button>
    <button class="ghost" id="fsBtn" title="גודל טקסט">A±</button>
  </div>
  <div id="layout"><nav id="side"></nav><main id="main"></main></div>
  <div id="tip"></div><div id="toast" class="toast"></div>`;
  $('#menuBtn').onclick = () => $('#side').classList.toggle('open');
  $('#themeBtn').onclick = () => { const s = Store.get('settings', {}); s.dark = !s.dark; Store.set('settings', s); applySettings(); };
  $('#fsBtn').onclick = () => { const s = Store.get('settings', {}); s.fs = (s.fs || 17) >= 21 ? 15 : (s.fs || 17) + 2; Store.set('settings', s); applySettings(); toast('גודל טקסט: ' + s.fs); };
  $('#search').addEventListener('keydown', e => { if (e.key === 'Enter') location.hash = '#/search/' + encodeURIComponent(e.target.value); });
}
function renderSide(mid, curSid) {
  const m = mod(mid); const side = $('#side');
  if (!m) { side.innerHTML = navModules(); return; }
  let h = '<div style="padding:4px 8px 10px"><a href="#/' + mid + '" style="text-decoration:none;color:var(--ink);font-weight:700">מודול ' + mid.slice(1) + '</a><div class="note-small">' + esc(m.title.replace(/^מודול \d+:\s*/, '')) + '</div></div>';
  h += '<a class="navsec" href="#/' + mid + '/intro"><span class="dot"></span>איך להשתמש במסמך</a>';
  m.chapters.forEach(c => {
    const open = curSid && (curSid.startsWith(c.n + '.') || curSid === 'c' + c.n || curSid === 'ex' + c.n);
    h += '<details class="navch"' + (open ? ' open' : '') + '><summary><span class="dot ' + (chProgress(mid, c) === 1 ? 'done' : '') + '"></span>' + c.n + '. ' + esc(c.title) + '</summary>';
    h += '<a class="navsec' + (curSid === 'c' + c.n ? ' cur' : '') + '" href="#/' + mid + '/c/' + c.n + '"><span class="dot"></span>פתיחת הפרק</a>';
    c.sections.forEach(s => {
      const flag = Store.map('flags')[secKey(mid, s.id)];
      h += '<a class="navsec' + (curSid === s.id ? ' cur' : '') + '" href="#/' + mid + '/s/' + s.id + '"><span class="dot ' + (isDone(mid, s.id) ? 'done' : flag ? 'flag' : '') + '"></span>' + s.id + ' ' + esc(s.title) + (s.added ? ' <span class="addtag">תוספת</span>' : '') + '</a>';
    });
    if (c.exercises.length) h += '<a class="navsec' + (curSid === 'ex' + c.n ? ' cur' : '') + '" href="#/' + mid + '/ex/' + c.n + '"><span class="dot"></span>תרגילים (' + c.exercises.length + ')</a>';
    h += '</details>';
  });
  side.innerHTML = h;
}
function navModules() { return '<div style="padding:8px">' + MODS.map(x => '<a class="navsec" href="#/' + x.id + '"><span class="dot"></span>מודול ' + x.n + ': ' + esc(x.title) + '</a>').join('') + '</div>'; }

/* ---------------- pages ---------------- */
function page(html) { const m = $('#main'); m.innerHTML = html; window.scrollTo(0, 0); $('#side').classList.remove('open'); return m; }

function homePage() {
  renderSide(null);
  const mid = CURMID; const m = mod(mid); const all = m ? allSections(m) : [];
  const done = all.filter(x => isDone(mid, x.s.id)).length; const N = mid.slice(1);
  const flags = Object.values(Store.map('flags')).filter(Boolean).length;
  const srs = Store.map('srs'); const now = Date.now();
  const due = deck().filter(c => !srs[c.id] || srs[c.id].due <= now).length;
  const last = Store.get('last');
  const main = page(`
    <section class="hero">
      <div class="hero-text">
        <div class="eyebrow">קורס ראייה ממוחשבת · מהנדס ראייה לזמן אמת</div>
        <h1>מעבדת הראייה</h1>
        <p>החומר המלא של הקורס, מסודר כשיעורים: הסבר, הדמיה אינטראקטיבית שאפשר לשחק בה, קוד שרץ בדפדפן, ושאלה לבדיקה עצמית בסוף כל סעיף.</p>
        <div class="hero-cta">${last ? `<a href="${last.href}"><button class="primary">להמשיך: ${esc(last.title)}</button></a>` : '<a href="#/m0/c/1"><button class="primary">להתחיל ממודול 0</button></a>'}<a href="#/${mid}"><button>תוכן מודול ${N}</button></a></div>
      </div>
      <div class="stats">
        <div class="stat"><div class="v">${all.length ? Math.round(done / all.length * 100) : 0}%</div><div class="l">ממודול ${N}</div></div>
        <div class="stat"><div class="v">${done}<span>/${all.length}</span></div><div class="l">סעיפים הובנו</div></div>
        <div class="stat"><div class="v">${due}</div><div class="l">כרטיסים לחזרה</div></div>
        <div class="stat"><div class="v">${flags}</div><div class="l">סעיפים לחזור אליהם</div></div>
      </div>
    </section>
    <h2 class="sec-title">מודול ${N}, פרק אחרי פרק</h2>
    <div id="map"></div>
    <h2 class="sec-title">כל המודולים</h2>
    <div class="roadmap" id="modtiles"></div>`);
  drawMap($('#map'), mid);
  $('#modtiles').innerHTML = MODS.map(x => {
    const has = !!mod(x.id); const pr = Math.round(modProgress(x.id) * 100);
    return `<a class="road ${has ? '' : 'locked'}" ${has ? 'href="#/' + x.id + '"' : ''}><span class="num">${x.n}</span><span class="rt"><span class="t">${esc(x.title)}</span><span class="note-small">${has ? pr + '% הושלם' : 'בהכנה'}</span></span><span class="rbar"><i style="width:${pr}%"></i></span></a>`;
  }).join('');
}
function drawDrone(el) {
  const p = MODS.map(x => modProgress(x.id) >= 1 ? 1 : modProgress(x.id) > 0 ? 0.5 : 0);
  const op = i => (0.18 + 0.82 * p[i]).toFixed(2);
  el.innerHTML = `<svg viewBox="0 0 340 240">
    <title>הרחפן נבנה ככל שמתקדמים: כל מודול מוסיף לו חלק</title>
    <g opacity="${op(0)}"><rect x="40" y="200" width="260" height="14" rx="7" fill="var(--line2)"/><text x="170" y="232" text-anchor="middle" font-size="12" fill="var(--ink3)">0 · ארגז הכלים</text></g>
    <g opacity="${op(6)}"><line x1="90" y1="110" x2="40" y2="80" stroke="var(--ink2)" stroke-width="6"/><line x1="250" y1="110" x2="300" y2="80" stroke="var(--ink2)" stroke-width="6"/><line x1="90" y1="130" x2="40" y2="160" stroke="var(--ink2)" stroke-width="6"/><line x1="250" y1="130" x2="300" y2="160" stroke="var(--ink2)" stroke-width="6"/>
      ${[[40, 80], [300, 80], [40, 160], [300, 160]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="34" ry="7" fill="var(--c6)" opacity=".7"/>`).join('')}</g>
    <g opacity="${op(2)}"><rect x="100" y="95" width="140" height="50" rx="22" fill="var(--c4)"/><text x="170" y="125" text-anchor="middle" font-size="12" fill="#fff">2 · המוח</text></g>
    <g opacity="${op(1)}"><circle cx="170" cy="168" r="20" fill="var(--c1)"/><circle cx="170" cy="168" r="9" fill="#fff"/><circle cx="170" cy="168" r="4" fill="var(--ink)"/></g>
    <g opacity="${op(3)}"><path d="M170 60 l10 20 h-20z" fill="var(--c2)"/></g>
    <g opacity="${op(4)}"><circle cx="128" cy="168" r="6" fill="var(--c3)"/><circle cx="212" cy="168" r="6" fill="var(--c3)"/></g>
    <g opacity="${op(5)}"><path d="M150 190 q20 12 40 0" stroke="var(--c5)" stroke-width="4" fill="none"/></g>
    <g opacity="${op(7)}"><path d="M235 100 q18 -14 30 0 M240 108 q12 -9 20 0" stroke="var(--c5)" stroke-width="3" fill="none"/></g>
  </svg>`;
}
function drawMap(el, mid) {
  const m = mod(mid); if (!m) return;
  const n = m.chapters.length; const W = 980, H = 150;
  let path = '', nodes = '';
  const pts = m.chapters.map((c, i) => { const x = W - 50 - i * ((W - 100) / (n - 1)); const y = 70 + Math.sin(i * 1.1) * 38; return [x, y]; });
  path = 'M' + pts.map(p => p.join(',')).join(' L');
  m.chapters.forEach((c, i) => {
    const pr = chProgress(mid, c); const [x, y] = pts[i];
    nodes += `<a href="#/${mid}/c/${c.n}"><g style="cursor:pointer"><circle cx="${x}" cy="${y}" r="21" fill="var(--surface)" stroke="var(--line2)" stroke-width="2"/>
      <circle cx="${x}" cy="${y}" r="21" fill="none" stroke="var(--c3)" stroke-width="5" stroke-dasharray="${(2 * Math.PI * 21 * pr).toFixed(1)} 999" transform="rotate(-90 ${x} ${y})"/>
      <text x="${x}" y="${y + 5}" text-anchor="middle" font-size="15" font-weight="700" fill="var(--ink)">${c.n}</text>
      <text x="${x}" y="${y + 40}" text-anchor="middle" font-size="11" fill="var(--ink2)">${esc(shortTitle(c.title))}</text><title>פרק ${c.n}: ${esc(c.title)}</title></g></a>`;
  });
  el.innerHTML = `<div class="card" style="padding:8px;overflow-x:auto"><svg class="mapsvg" viewBox="0 0 ${W} ${H}" style="min-width:760px"><path d="${path}" fill="none" stroke="var(--line2)" stroke-width="4" stroke-dasharray="2 8" stroke-linecap="round"/>${nodes}</svg><div class="note-small" style="padding:0 8px 4px">מודול ${mid.slice(1)}, פרק אחרי פרק. העיגול מתמלא בירוק ככל שאתה מסמן סעיפים כ"הבנתי".</div></div>`;
}

/* a module roadmap (optional): lanes of chapters, the current one highlighted */
function roadmapHTML(mid, cur) {
  const R = (layer(mid) || {}).roadmap; if (!R) return '';
  const m = mod(mid); const title = n => { const c = m.chapters.find(x => x.n === n); return c ? shortTitle(c.title) : ''; };
  const chip = n => `<a class="rm-chip ${n === cur ? 'cur' : ''}" href="#/${mid}/c/${n}"><b>${n}</b> ${esc((R.names || {})[n] || title(n))}</a>`;
  return `<div class="roadmap">${R.lanes.map(l => `<div class="rm-lane"><div class="rm-title">${esc(l.title)}</div><div class="rm-row">${l.chapters.map(chip).join('<span class="rm-arrow">←</span>')}</div>${l.note ? '<div class="rm-note">' + l.note + '</div>' : ''}</div>`).join('')}${R.join ? `<div class="rm-join">${chip(R.join)}<span class="rm-note">${R.joinNote || ''}</span></div>` : ''}</div>`;
}
function shortTitle(t) { return t.split(/[,:—]/)[0].replace('ספריית המערכים למי שמגיע מג׳אווה', 'וספריית המערכים').slice(0, 22); }

function modulePage(mid) {
  const m = mod(mid); if (!m) return homePage();
  renderSide(mid);
  const L = layer(mid);
  const main = page(`<div class="crumb"><a href="#/">בית</a> › מודול ${mid.slice(1)}</div><h1 class="page">${md(m.title)}</h1>
    <article class="lesson"><section class="brief"><h2>על המודול, בקצרה</h2>${L.moduleKid || ''}</section>${L.moduleStory ? '<section class="deep"><h2>הסיפור של המודול</h2>' + L.moduleStory + '</section>' : ''}${L.roadmap ? '<section class="deep"><h2>מפת המודול</h2>' + roadmapHTML(mid, 0) + '</section>' : ''}</article>
    <div class="tiles" id="chtiles"></div>`);
  $('#chtiles').innerHTML = `<a class="tile" href="#/${mid}/intro"><div class="n">לפני הכול</div><div class="t">איך להשתמש במסמך</div></a>` + m.chapters.map(c => `<a class="tile" href="#/${mid}/c/${c.n}"><div class="n">פרק ${c.n} · ${c.sections.length} סעיפים · ${c.exercises.length} תרגילים</div><div class="t">${esc(c.title)}</div><div class="bar"><i style="width:${Math.round(chProgress(mid, c) * 100)}%"></i></div></a>`).join('');
}
function introPage(mid) {
  const m = mod(mid); renderSide(mid, 'intro'); ctxLayer = layer(mid);
  const main = page(`<div class="crumb"><a href="#/">בית</a> › <a href="#/${mid}">מודול ${mid.slice(1)}</a></div><h1 class="page">איך להשתמש במסמך</h1>
    <article class="lesson"><section class="brief"><h2>בקצרה</h2>${ctxLayer.introKid || ''}</section><section class="explain"><h2>ההסבר המלא</h2><div id="o"></div></section></article>
    <div class="actions"><span class="spacer"></span><a href="#/${mid}/c/1"><button class="primary">לפרק 1 ←</button></a></div>`);
  renderBlocks(m.intro.filter(b => b.type !== 'h2'), $('#o'));
  // the intro's own heading
  const h = m.intro.find(b => b.type === 'h2'); if (h) $('#o').insertAdjacentHTML('afterbegin', '<h4>' + md(h.text) + '</h4>');
}
function chapterPage(mid, n) {
  const m = mod(mid); const c = m.chapters.find(x => x.n === +n); if (!c) return modulePage(mid);
  renderSide(mid, 'c' + n); ctxLayer = layer(mid);
  const L = (ctxLayer.chapters || {})[n] || {};
  const main = page(`<div class="crumb"><a href="#/">בית</a> › <a href="#/${mid}">מודול ${mid.slice(1)}</a> › פרק ${n}</div>
    <h1 class="page">${md(c.heading.text, { noGloss: true })}</h1>
    <article class="lesson">
      ${ctxLayer.roadmap ? '<div class="whereami">' + roadmapHTML(mid, +n) + '</div>' : ''}
      ${L.kid && !L.recap ? '<section class="brief"><h2>על מה הפרק, בקצרה</h2>' + L.kid + '</section>' : ''}
      ${L.story ? '<section class="deep"><h2>לפני שמתחילים את הפרק</h2>' + L.story + '</section>' : ''}
      <div id="o"></div>
      ${L.recap ? '<section class="deep recap"><h2>בסוף הפרק תדע</h2>' + L.recap + '</section>' : ''}
    </article>
    <h3>הסעיפים בפרק</h3><div class="tiles">${c.sections.map(s => `<a class="tile" href="#/${mid}/s/${s.id}"><div class="n">${s.id} ${isDone(mid, s.id) ? '✓' : ''}</div><div class="t">${esc(s.title)}</div></a>`).join('')}
    ${c.exercises.length ? `<a class="tile" href="#/${mid}/ex/${n}"><div class="n">${c.exercises.length} תרגילים</div><div class="t">${esc(c.exercise_heading.text)}</div></a>` : ''}</div>
    <div class="actions"><span class="spacer"></span><a href="#/${mid}/s/${c.sections[0].id}"><button class="primary">מתחילים: ${c.sections[0].id} ←</button></a></div>`);
  renderLesson(lessonFlow(c.lead, L.widgets, ctxLayer.anchors), $('#o'), { mid, ch: c }, ctxLayer.widgetTitles);
  Store.set('last', { href: location.hash, title: 'פרק ' + n + ': ' + c.title });
}
function mountWidgets(slot, ids, ctx) {
  if (!slot || !ids) return;
  ids.forEach(id => {
    const box = document.createElement('div'); box.className = 'w'; box.dataset.w = id; slot.appendChild(box);
    if (window.W[id]) { try { window.W[id](box, ctx); } catch (e) { box.innerHTML = '<div class="err">שגיאה בהדמיה ' + esc(id) + ': ' + esc(e.message) + '</div>'; console.error(e); } }
    else box.innerHTML = '<div class="note-small">(הדמיה ' + esc(id) + ' בבנייה)</div>';
    if (ids.length > 1) { const hr = document.createElement('hr'); hr.style.cssText = 'border:0;border-top:1px dashed var(--play-line);margin:18px 0'; slot.appendChild(hr); }
  });
  if (ids.length > 1 && slot.lastChild && slot.lastChild.tagName === 'HR') slot.lastChild.remove();
}
/* ---------- the lesson skeleton ----------
   The original blocks are grouped into "units" (a paragraph that ends with ':' stays with the code/formula/list
   it introduces; commentary right after a code block stays with that code). Each unit gets a role, and the page
   is laid out in a fixed order: explanation -> visual -> examples & code -> watch out -> where it connects.
   Every original block appears exactly once. */
const RX = {
  example: /^\**(דוגמה|דוגמא|בתמונה:|בתמונות|למשל)/,
  trap: /^\**(אזהרה|המלכודת|שים לב|זהירות|הסדר משנה|לא לכל)|מלכודת/,
  link: /^\**(הקשר ל|השימוש החשוב לנו|שלושה שימושים|למה זה חשוב בראייה|זו בדיוק המטריצה|זה בדיוק מה ש)/,
};
function splitLong(blocks) {
  const out = [];
  blocks.forEach(b => {
    if (b.type !== 'p' || (b.text || '').length < 430 || b.dir === 'ltr') { out.push(b); return; }
    const t = b.text; const mid = t.length / 2; let best = -1;
    const re = /[.!?](\*\*)?\s(?=[^\d\s])/g; let mm;
    while ((mm = re.exec(t))) { const at = mm.index + mm[0].length; if (best < 0 || Math.abs(at - mid) < Math.abs(best - mid)) best = at; }
    if (best < 80 || best > t.length - 80 || (t.slice(0, best).match(/\*\*/g) || []).length % 2) { out.push(b); return; }
    out.push(Object.assign({}, b, { text: t.slice(0, best).trim() }), Object.assign({}, b, { text: t.slice(best).trim(), id: b.id + '-2' }));
  });
  return out;
}
function makeUnits(blocks) {
  const units = []; let cur = null;
  const isCode = b => b.type === 'code' && b.lang !== 'tex';
  const opensNext = b => b && b.type === 'p' && /:\**$/.test(b.text);
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i], prev = blocks[i - 1];
    let attach = false;
    if (cur) {
      if (opensNext(prev)) attach = true;                                       // "...:" + what it introduces
      else if (b.type === 'table' || b.type === 'caption') attach = true;        // tables / captions belong to what precedes
      else if (b.type === 'li' && prev && (prev.type === 'li' || opensNext(prev))) attach = true;
      else if (isCode(b) && prev && (isCode(prev) || prev.type === 'table')) attach = true;
      else if (b.type === 'p' && cur.hasCode && !/^\*\*/.test(b.text) && !RX.example.test(b.text) && !opensNext(b)) attach = true; // commentary on code
      else if (b.type === 'p' && /^\*\*הסבר שורה/.test(b.text)) attach = true;
    }
    if (!attach) { cur = { blocks: [], hasCode: false }; units.push(cur); }
    cur.blocks.push(b); if (isCode(b)) cur.hasCode = true;
  }
  units.forEach(u => {
    const f = u.blocks[0]; const t = f.text || '';
    if (f.type === 'img') u.role = 'figure';
    else if (RX.link.test(t)) u.role = 'link';
    else if (RX.trap.test(t.slice(0, 60)) || (/מלכודת/.test(t) && t.length < 400)) u.role = 'trap';
    else if (RX.example.test(t)) u.role = 'example';
    else if (u.hasCode) u.role = 'code';
    else u.role = 'concept';
  });
  units.forEach((u, i) => u._idx = i);
  return units;
}
function lessonFlow(blocks, widgets, anchors) {
  const units = makeUnits(splitLong(blocks));
  const ws = (widgets || []).slice();
  const by = r => units.filter(u => u.role === r);
  let concept = by('concept');
  let rest = units.filter(u => u.role === 'example' || u.role === 'code');
  if (!concept.length && rest.length) { concept = [rest[0]]; rest = rest.slice(1); }
  const figures = by('figure');
  const parts = [];
  if (concept.length) parts.push({ head: 'explain', units: concept.concat(ws.length ? [] : figures) });
  const placed = new Set();
  // widgets with an anchor go right after the unit that talks about them; the first free one goes after the explanation
  const anchorOf = w => anchors && anchors[w] ? new RegExp(anchors[w]) : null;
  const restOut = [];
  const after = {};
  ws.forEach((w, k) => {
    const rx = anchorOf(w);
    if (rx) { const u = rest.find(u => u.blocks.some(b => rx.test(b.text || ''))) || by('trap').find(u => u.blocks.some(b => rx.test(b.text || ''))); if (u) { (after[units.indexOf(u)] = after[units.indexOf(u)] || []).push(w); placed.add(w); } }
  });
  const free = ws.filter(w => !placed.has(w));
  if (free.length) parts.push({ widget: free[0] });
  rest.forEach(u => { restOut.push(u); });
  if (restOut.length) parts.push({ head: 'examples', units: restOut, after });
  free.slice(1).forEach(w => parts.push({ widget: w }));
  if (by('trap').length) parts.push({ head: 'trap', units: by('trap'), after });
  if (by('link').length) parts.push({ head: 'link', units: by('link') });
  if (!ws.length && figures.length && !concept.length) parts.push({ head: 'explain', units: figures });
  return parts;
}
const PART_TITLES = { explain: 'ההסבר', examples: 'דוגמאות והדגמה בקוד', trap: 'שים לב', link: 'איפה זה מתחבר בקורס' };
function renderLesson(parts, container, ctx, titles) {
  const mountW = (w, where) => {
    const card = document.createElement('div'); card.className = 'tryit';
    card.innerHTML = '<div class="tryhead"><span class="trytag">הדמיה</span>' + esc((titles || {})[w] || '') + '</div><div class="wslot"></div><div class="mission"></div>';
    where.appendChild(card); mountWidgets(card.querySelector('.wslot'), [w], ctx);
    if (window.Missions) window.Missions(card, w);
  };
  parts.forEach(p => {
    if (p.widget) { mountW(p.widget, container); return; }
    const sec = document.createElement('section'); sec.className = 'part part-' + p.head;
    sec.innerHTML = '<h3 class="parthead">' + (ctx && ctx.s && (ctx.s.added || ctx.s.single) ? (p.head === 'explain' ? (ctx.s.single || 'הדוגמה בקוד') : PART_TITLES[p.head]) : ctx && ctx.deep && p.head === 'explain' ? 'מהחומר של הקורס' : PART_TITLES[p.head]) + '</h3>';
    container.appendChild(sec);
    p.units.forEach(u => {
      const d = document.createElement('div'); d.className = 'unit'; renderBlocks(u.blocks, d); sec.appendChild(d);
      const idx = u._idx; const ws = p.after && p.after[idx];
      (ws || []).forEach(w => mountW(w, sec));
    });
  });
}
function sectionPage(mid, sid) {
  const m = mod(mid); const all = allSections(m); const idx = all.findIndex(x => x.s.id === sid);
  if (idx < 0) return modulePage(mid);
  const { ch, s } = all[idx]; ctxLayer = layer(mid); renderSide(mid, sid);
  const L = (ctxLayer.sections || {})[sid] || {};
  const prev = all[idx - 1], next = all[idx + 1];
  const k = secKey(mid, sid);
  const main = page(`<div class="crumb"><a href="#/">בית</a> › <a href="#/${mid}">מודול ${mid.slice(1)}</a> › <a href="#/${mid}/c/${ch.n}">פרק ${ch.n}: ${esc(ch.title)}</a></div>
    <h1 class="page">${esc(s.id)} ${md(s.title, { noGloss: true })}</h1>
    ${s.added ? '<div class="addedsec"><span class="addtag">תוספת</span> הסעיף הזה לא מופיע בחומר המקורי של הקורס. הוא נוסף כדי לסגור פער שהפרויקט הסופי צריך: ' + esc(s.added) + '</div>' : ''}
    <div class="progress-dots">${ch.sections.map(x => `<a href="#/${mid}/s/${x.id}" title="${esc(x.id + ' ' + x.title)}" class="${x.id === sid ? 'cur' : isDone(mid, x.id) ? 'done' : ''}"></a>`).join('')}</div>
    <article class="lesson">
      ${L.why && !L.deep ? '<div class="why"><span>למה צריך את זה</span>' + md(L.why, { noGloss: true }) + '</div>' : ''}
      ${(ctxLayer.chapters || {})[ch.n] && ctxLayer.chapters[ch.n].goal ? '<div class="where-strip"><span>פרק ' + ch.n + ' · סעיף ' + (ch.sections.indexOf(s) + 1) + ' מתוך ' + ch.sections.length + '</span>' + ctxLayer.chapters[ch.n].goal + '</div>' : ''}
      ${L.kid && !L.deep ? '<section class="brief"><h2>בקצרה</h2>' + L.kid + '</section>' : ''}
      ${L.deep ? '<section class="deep"><h2>ההסבר המלא</h2>' + L.deep + '</section>' : ''}
      <div id="o"></div>
      ${L.deep && !next ? '' : ''}${(next && next.ch !== ch || !next) && (ctxLayer.chapters || {})[ch.n] && ctxLayer.chapters[ch.n].recap ? '<section class="deep recap"><h2>סיכום הפרק</h2>' + ctxLayer.chapters[ch.n].recap + '</section>' : ''}
    </article>
    <div id="check"></div>
    ${next ? `<a class="nextcard" href="#/${mid}/s/${next.s.id}"><div class="note-small">הסעיף הבא</div><div class="t">${esc(next.s.id)} ${esc(next.s.title)}</div><div class="note-small">${esc(((ctxLayer.sections || {})[next.s.id] || {}).kid ? ((ctxLayer.sections[next.s.id].kid).replace(/<[^>]+>/g, '').split(/(?<=[.!?])\s/)[0]) : '')}</div></a>` : ''}
    <div class="actions">
      <span class="pill ${isDone(mid, sid) ? 'on' : ''}" id="doneBtn" role="button" style="cursor:pointer">✓ הבנתי</span>
      <span class="pill flag ${Store.map('flags')[k] ? 'on' : ''}" id="flagBtn" role="button" style="cursor:pointer">לא הבנתי, לחזור לזה</span>
      <span class="spacer"></span>
      ${prev ? `<a href="#/${mid}/s/${prev.s.id}"><button>→ ${prev.s.id}</button></a>` : ''}
      ${next ? (next.ch !== ch && ch.exercises.length ? `<a href="#/${mid}/ex/${ch.n}"><button class="primary">לתרגילים של פרק ${ch.n} ←</button></a>` : `<a href="#/${mid}/s/${next.s.id}"><button class="primary">${next.s.id} ←</button></a>`) : (ch.exercises.length ? `<a href="#/${mid}/ex/${ch.n}"><button class="primary">לתרגילים ←</button></a>` : '')}
    </div>
    <details class="card notes"><summary>ההערות שלי לסעיף הזה</summary><textarea id="note" placeholder="כתוב כאן מה הבנת, שאלות, תובנות…">${esc(Store.map('notes')[k] || '')}</textarea></details>`);
  renderLesson(s.added || s.single ? [{ head: 'explain', units: makeUnits(splitLong(s.blocks)).map((u, i) => Object.assign(u, { _idx: i })) }].concat((L.widgets || []).map(w => ({ widget: w }))) : lessonFlow(s.blocks, L.widgets, ctxLayer.anchors), $('#o'), { mid, ch, s, deep: !!L.deep }, ctxLayer.widgetTitles);
  if (window.SectionPractice) window.SectionPractice($('#check'), mid, sid, ch);
  else renderCheck($('#check'), mid, sid);
  window._nav = { prev: prev && ('#/' + mid + '/s/' + prev.s.id), next: next ? (next.ch !== ch && ch.exercises.length ? '#/' + mid + '/ex/' + ch.n : '#/' + mid + '/s/' + next.s.id) : null };
  $('#doneBtn').onclick = () => { const d = Store.map('done'); d[k] = !d[k]; if (d[k]) delete Store.map('flags')[k]; Store.save(); sectionPage(mid, sid); if (d[k]) toast('מעולה! סומן כהבנתי'); };
  $('#flagBtn').onclick = () => { const f = Store.map('flags'); f[k] = !f[k]; Store.save(); sectionPage(mid, sid); };
  $('#note').addEventListener('input', e => { Store.map('notes')[k] = e.target.value; Store.save(); });
  Store.set('last', { href: location.hash, title: s.id + ' ' + s.title });
}
function renderCheck(el, mid, sid) {
  const C = (ctxLayer.checks || {})[sid]; if (!C) { el.innerHTML = ''; return; }
  const key = mid + ':' + sid; const prevAns = Store.map('checks')[key];
  el.innerHTML = '<div class="check"><div class="checkhead">בדוק את עצמך</div><div class="q">' + md(C.q, { noGloss: true, noLinks: true }) + '</div><div class="opts"></div><div class="fb"></div></div>';
  const opts = el.querySelector('.opts'), fb = el.querySelector('.fb');
  C.options.forEach((o, i) => {
    const b = document.createElement('button'); b.className = 'opt'; b.innerHTML = md(o, { noGloss: true, noLinks: true });
    b.onclick = () => {
      el.querySelectorAll('.opt').forEach((x, j) => { x.classList.remove('right', 'wrong'); if (j === C.answer) x.classList.add('right'); });
      if (i !== C.answer) b.classList.add('wrong');
      fb.innerHTML = (i === C.answer ? '<b class="good">נכון.</b> ' : '<b class="bad">לא בדיוק.</b> ') + md(C.why, { noGloss: true });
      Store.map('checks')[key] = i === C.answer ? 'ok' : 'miss'; Store.save();
      if (i === C.answer && !isDone(mid, sid)) fb.innerHTML += ' <button class="sm" id="markdone">סמן את הסעיף כ"הבנתי"</button>';
      const md2 = el.querySelector('#markdone'); if (md2) md2.onclick = () => { Store.map('done')[secKey(mid, sid)] = true; Store.save(); sectionPage(mid, sid); toast('סומן כהבנתי'); };
    };
    opts.appendChild(b);
  });
  if (prevAns) fb.innerHTML = '<span class="note-small">' + (prevAns === 'ok' ? 'ענית נכון בפעם הקודמת.' : 'בפעם הקודמת לא ענית נכון. נסה שוב.') + '</span>';
}
document.addEventListener('keydown', e => {
  if (!window._nav || /INPUT|TEXTAREA|SELECT/.test((e.target.tagName || ''))) return;
  if (e.key === 'ArrowLeft' && window._nav.next) location.hash = window._nav.next;
  if (e.key === 'ArrowRight' && window._nav.prev) location.hash = window._nav.prev;
});
window.addEventListener('hashchange', () => { if (!/\/s\//.test(location.hash)) window._nav = null; });
function exercisesPage(mid, n) {
  const m = mod(mid); const c = m.chapters.find(x => x.n === +n); ctxLayer = layer(mid); renderSide(mid, 'ex' + n);
  const main = page(`<div class="crumb"><a href="#/">בית</a> › <a href="#/${mid}">מודול ${mid.slice(1)}</a> › <a href="#/${mid}/c/${n}">פרק ${n}</a></div>
    <h1 class="page">${md(c.exercise_heading.text, { noGloss: true })}</h1>
    <div class="card orig"><span class="tag">לפני שמתחילים</span><div id="si"></div></div>
    <div id="exs"></div>
    <div class="actions"><span class="spacer"></span>${m.chapters.find(x => x.n === +n + 1) ? `<a href="#/${mid}/c/${+n + 1}"><button class="primary">לפרק ${+n + 1} ←</button></a>` : ''}</div>`);
  renderBlocks(m.solutions_intro.filter(b => b.type !== 'h3'), $('#si'));
  const exs = $('#exs');
  const XM = (ctxLayer && ctxLayer.exMeta) || {};
  if (c.exercises.every(e => XM[e.id] && XM[e.id].level)) {
    const G = [[1, 'חימום', 'שאלות קצרות שבודקות שהרעיון הבסיסי ברור. התחל כאן.'], [2, 'יישום', 'כאן כותבים, מריצים ומשנים קוד. זה עיקר התרגול.'], [3, 'אתגר', 'שאלות ארוכות יותר, שמחברות כמה רעיונות. אפשר לחזור אליהן אחר כך.']];
    const cover = {}; c.exercises.forEach(e => { (cover[XM[e.id].sec] = cover[XM[e.id].sec] || []).push(e.id); });
    exs.insertAdjacentHTML('beforeend', '<div class="exmap"><b>' + c.exercises.length + ' תרגילים בשלוש רמות.</b> כל סעיף בפרק מתורגל לפחות פעם אחת: ' + c.sections.map(s => '<span class="exmap-s"><a href="#/' + mid + '/s/' + s.id + '">' + s.id + '</a> ← ' + (cover[s.id] || []).map(i => '<a href="#ex-' + i + '" data-ex="' + i + '">' + i + '</a>').join(', ') + '</span>').join(' ') + '</div>');
    G.forEach(([lv, name, say]) => { const list = c.exercises.filter(e => XM[e.id].level === lv); if (!list.length) return;
      exs.insertAdjacentHTML('beforeend', '<h2 class="exgroup"><span class="lvl lvl' + lv + '">' + '●'.repeat(lv) + '○'.repeat(3 - lv) + '</span> ' + name + ' <span class="note-small">' + list.length + ' תרגילים · ' + say + '</span></h2>');
      list.forEach(e => exs.appendChild(window.ExerciseCard(e, c, mid))); });
    exs.querySelector('.exmap').addEventListener('click', ev => { const a = ev.target.closest('a[data-ex]'); if (!a) return; ev.preventDefault(); const t = document.getElementById('ex-' + a.dataset.ex); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  } else c.exercises.forEach(e => exs.appendChild(window.ExerciseCard(e, c, mid)));
  Store.set('last', { href: location.hash, title: 'תרגילים לפרק ' + n });
}

/* ---------------- glossary page ---------------- */
function glossaryPage() {
  renderSide(CURMID);
  const items = GLOSS.slice().sort((a, b) => a.he.localeCompare(b.he, 'he'));
  page(`<h1 class="page">מילון מונחים</h1><p class="note-small">כל מונח עם התרגום לאנגלית (כך תשמע אותו בראיונות ובמאמרים) והסבר של משפט אחד. בכל הטקסט באתר, מונח מסומן בקו מקווקו סגול, ומעבר עכבר עליו מציג את ההסבר.</p>
    <input id="gq" placeholder="סינון…" style="width:260px;margin:8px 0">
    <div class="tiles" id="gl">${items.map(g => `<div class="tile" data-k="${esc((g.he + ' ' + g.en).toLowerCase())}"><div class="t">${esc(g.he)}</div><div class="n ltr">${esc(g.en || '')}</div><div style="font-size:.9em;margin-top:4px">${md(g.kid, { noGloss: true })}</div>${g.where ? `<div class="note-small" style="margin-top:6px"><a href="#/${g.mid || 'm0'}/s/${g.where}">${g.mid && g.mid !== 'm0' ? 'מודול ' + g.mid.slice(1) + ', ' : ''}סעיף ${g.where} ←</a></div>` : ''}</div>`).join('')}</div>`);
  $('#gq').addEventListener('input', e => { const q = e.target.value.toLowerCase(); $$('#gl .tile').forEach(t => t.style.display = t.dataset.k.includes(q) ? '' : 'none'); });
}

/* ---------------- flashcards (spaced repetition, Leitner boxes) ---------------- */
function deck() {
  const cards = [];
  GLOSS.forEach(g => cards.push({ id: 'gl:' + g.he, kind: 'מונח', front: '<div class="big" style="font-size:1.6em;font-weight:700">' + esc(g.he) + '</div><div class="note-small">מה זה? ומה השם באנגלית?</div>', back: '<b class="ltr">' + esc(g.en || '') + '</b><p>' + md(g.kid, { noGloss: true }) + '</p>' }));
  loadedMods().forEach(mid => { const m = mod(mid); m.chapters.forEach(c => {
    const q = c.lead.find(b => b.type === 'quote');
    if (q) cards.push({ id: mid === 'm0' ? 'idea:' + c.n : 'idea:' + mid + ':' + c.n, kind: 'הרעיון של הפרק', front: '<div class="note-small">מודול ' + mid.slice(1) + ' · פרק ' + c.n + '</div><div style="font-size:1.3em;font-weight:700">' + esc(c.title) + '</div><p>מה הרעיון בשורה אחת?</p>', back: md(q.text, { noGloss: true }) });
    c.exercises.forEach(e => cards.push({ id: 'ex:' + mid + ':' + e.id, kind: 'תרגיל', front: e.blocks.map(b => b.type === 'code' ? '<pre class="mono" style="direction:ltr;text-align:left;font-size:.8em">' + esc(b.text) + '</pre>' : '<p>' + md(b.text || '', { noGloss: true }) + '</p>').join(''), back: e.solution.map(b => b.type === 'code' ? '<pre class="mono" style="direction:ltr;text-align:left;font-size:.8em">' + esc(b.text) + '</pre>' : b.type === 'table' ? '' : '<p>' + md(b.text || '', { noGloss: true }) + '</p>').join('') }));
  }); });
  return cards;
}
function cardsPage() {
  renderSide(CURMID);
  const all = deck(); const srs = Store.map('srs'); const now = Date.now();
  const due = all.filter(c => !srs[c.id] || srs[c.id].due <= now);
  const kinds = ['הכול', 'מונח', 'הרעיון של הפרק', 'תרגיל'];
  let kind = 'הכול';
  const main = page(`<h1 class="page">כרטיסיות חזרה</h1><p class="note-small">חזרה מרווחת: כרטיס שידעת חוזר אחרי יותר ימים, כרטיס ששכחת חוזר מחר. ${due.length} כרטיסים מחכים לך עכשיו מתוך ${all.length}.</p>
    <div class="w"><div class="tabs" id="kinds">${kinds.map(k => `<button class="sm ${k === kind ? 'sel' : ''}">${k}</button>`).join('')}</div></div>
    <div id="fc"></div>`);
  let queue = [];
  function build() { queue = due.filter(c => kind === 'הכול' || c.kind === kind); show(); }
  function show() {
    const fc = $('#fc');
    if (!queue.length) { fc.innerHTML = '<div class="card" style="text-align:center">אין כרטיסים לחזרה כרגע בקטגוריה הזו. חזור מחר!</div>'; return; }
    const c = queue[0];
    fc.innerHTML = `<div class="flash"><div class="inner"><div class="face front"><span class="chip">${esc(c.kind)}</span>${c.front}<div class="note-small" style="margin-top:auto">לחץ על הכרטיס כדי להפוך</div></div><div class="face back">${c.back}</div></div></div>
      <div class="actions" style="justify-content:center"><button data-r="0">לא ידעתי</button><button data-r="1">בערך</button><button class="primary" data-r="2">ידעתי</button></div><p class="note-small" style="text-align:center">נשארו ${queue.length}</p>`;
    $('.flash', fc).onclick = () => $('.flash', fc).classList.toggle('flip');
    $$('[data-r]', fc).forEach(b => b.onclick = () => {
      const r = +b.dataset.r; const s = srs[c.id] || { box: 0 };
      s.box = r === 0 ? 0 : r === 1 ? Math.max(1, s.box) : s.box + 1;
      const days = [0, 1, 3, 7, 16, 35][Math.min(5, s.box)];
      s.due = Date.now() + days * 864e5; srs[c.id] = s; Store.save();
      queue.shift(); if (r === 0) queue.push(c); show();
    });
  }
  $$('#kinds button').forEach(b => b.onclick = () => { kind = b.textContent; $$('#kinds button').forEach(x => x.classList.toggle('sel', x === b)); build(); });
  build();
}

/* ---------------- interview mode ---------------- */
function interviewPage() {
  renderSide(CURMID);
  const pool = []; loadedMods().forEach(mid => (layer(mid).interview || []).forEach(q => pool.push(Object.assign({ mid }, q))));
  let cur = null, timer = null, t0 = 0, rec = null, chunks = [];
  const main = page(`<h1 class="page">מצב ראיון</h1><p class="note-small">שאלה אקראית, שתי דקות לענות בקול (אפשר להקליט את עצמך), ואז משווים לנקודות המפתח מתוך החומר.</p>
    <div class="card" id="iv"><button class="primary" id="go">תן לי שאלה</button></div>`);
  function ask() {
    cur = pool[Math.floor(Math.random() * pool.length)];
    $('#iv').innerHTML = `<div class="note-small">מתוך מודול ${cur.mid.slice(1)}, סעיף <a href="#/${cur.mid}/s/${cur.sec}">${cur.sec}</a></div><h2 style="margin:.3em 0">${md(cur.q, { noGloss: true })}</h2>
      <div class="w"><div class="row"><span class="big mono" id="clock">2:00</span><button id="rec">הקלט את עצמי</button><audio id="play" controls hidden></audio></div></div>
      <div class="actions"><button id="reveal">הצג נקודות מפתח</button><button id="next">שאלה אחרת</button></div><div id="keys" hidden class="hint"></div>`;
    t0 = Date.now(); clearInterval(timer);
    timer = setInterval(() => { const left = Math.max(0, 120 - Math.floor((Date.now() - t0) / 1000)); const c = $('#clock'); if (!c) return clearInterval(timer); c.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'); if (!left) { clearInterval(timer); c.style.color = 'var(--warn-ink)'; } }, 250);
    $('#reveal').onclick = () => { const k = $('#keys'); k.hidden = false; k.innerHTML = '<b>נקודות שכדאי שיופיעו בתשובה:</b><ul>' + cur.keys.map(x => '<li>' + md(x, { noGloss: true }) + '</li>').join('') + '</ul>'; };
    $('#next').onclick = ask;
    $('#rec').onclick = async () => {
      if (rec && rec.state === 'recording') { rec.stop(); return; }
      try {
        const st = await navigator.mediaDevices.getUserMedia({ audio: true });
        rec = new MediaRecorder(st); chunks = [];
        rec.ondataavailable = e => chunks.push(e.data);
        rec.onstop = () => { const a = $('#play'); a.src = URL.createObjectURL(new Blob(chunks)); a.hidden = false; $('#rec').textContent = 'הקלט שוב'; st.getTracks().forEach(t => t.stop()); };
        rec.start(); $('#rec').textContent = 'עצור הקלטה';
      } catch (e) { toast('אין גישה למיקרופון'); }
    };
  }
  $('#go').onclick = ask;
}

/* ---------------- my notes & flags ---------------- */
function minePage() {
  renderSide(CURMID);
  const flags = Store.map('flags'), notes = Store.map('notes');
  const all = []; loadedMods().forEach(mid => allSections(mod(mid)).forEach(x => all.push(Object.assign({ mid }, x))));
  const fl = all.filter(x => flags[secKey(x.mid, x.s.id)]);
  const nt = all.filter(x => (notes[secKey(x.mid, x.s.id)] || '').trim());
  page(`<h1 class="page">ההערות והסימונים שלי</h1>
    <div class="card"><h3 style="margin-top:0">סימנתי "לא הבנתי" (${fl.length})</h3>${fl.length ? fl.map(x => `<div><a href="#/${x.mid}/s/${x.s.id}">מודול ${x.mid.slice(1)} · ${x.s.id} ${esc(x.s.title)}</a></div>`).join('') : '<p class="note-small">אין כרגע. מעולה.</p>'}</div>
    <div class="card"><h3 style="margin-top:0">ההערות שלי (${nt.length})</h3>${nt.map(x => `<div style="margin:8px 0"><a href="#/${x.mid}/s/${x.s.id}">מודול ${x.mid.slice(1)} · ${x.s.id} ${esc(x.s.title)}</a><div class="hint" style="white-space:pre-wrap">${esc(notes[secKey(x.mid, x.s.id)])}</div></div>`).join('') || '<p class="note-small">עוד לא כתבת הערות.</p>'}</div>
    <div class="card"><h3 style="margin-top:0">גיבוי ההתקדמות</h3><p class="note-small">ההתקדמות נשמרת בדפדפן הזה. כדאי לשמור גיבוי מדי פעם, או כדי להעביר למחשב אחר.</p>
      <button id="exp">שמור קובץ גיבוי</button> <label><button id="impb">טען קובץ גיבוי</button><input type="file" id="imp" accept=".json" hidden></label> <button id="rst" class="ghost">איפוס הכול</button></div>`);
  $('#exp').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(Store.d, null, 1)], { type: 'application/json' })); a.download = 'vision-lab-backup.json'; a.click(); };
  $('#impb').onclick = () => $('#imp').click();
  $('#imp').onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { Store.d = JSON.parse(t); Store.save(); toast('הגיבוי נטען'); applySettings(); minePage(); }); };
  $('#rst').onclick = () => { if (confirm('למחוק את כל ההתקדמות, ההערות והסימונים?')) { Store.d = {}; Store.save(); minePage(); } };
}

/* ---------------- search ---------------- */
function searchPage(q) {
  renderSide(CURMID); q = (q || '').trim();
  const res = [];
  const norm = s => (s || '').replace(/\*\*|`|\\/g, '');
  const scan = (blocks, href, where) => blocks.forEach(b => {
    const ts = b.type === 'table' ? b.rows.flat(2).map(x => x.text) : [b.text];
    ts.forEach(t => { const tt = norm(t); const i = tt.toLowerCase().indexOf(q.toLowerCase()); if (q && i >= 0) res.push({ href, where, snip: tt.slice(Math.max(0, i - 60), i + q.length + 80), i: Math.min(60, i) }); });
  });
  loadedMods().forEach(mid => {
    const m = mod(mid); const M = 'מודול ' + mid.slice(1) + ' · ';
    scan(m.intro, '#/' + mid + '/intro', M + 'איך להשתמש במסמך');
    m.chapters.forEach(c => { scan(c.lead, '#/' + mid + '/c/' + c.n, M + 'פרק ' + c.n); c.sections.forEach(s => scan([s.heading].concat(s.blocks), '#/' + mid + '/s/' + s.id, M + s.id + ' ' + s.title)); c.exercises.forEach(e => scan(e.blocks.concat(e.solution), '#/' + mid + '/ex/' + c.n, M + 'תרגיל ' + e.id)); });
  });
  const hi = s => esc(s).replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), m => '<mark>' + m + '</mark>');
  page(`<h1 class="page">חיפוש: ${esc(q)}</h1><p class="note-small">${res.length} תוצאות</p>` + res.slice(0, 200).map(r => `<div class="card" style="padding:10px 16px;margin:8px 0"><a href="${r.href}"><b>${esc(r.where)}</b></a><div>…${hi(r.snip)}…</div></div>`).join(''));
  $('#search').value = q;
}

/* ---------------- router ---------------- */
function route() {
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/');
  const [a, b, c] = h;
  if (!a) return homePage();
  if (a === 'glossary') return glossaryPage();
  if (a === 'cards') return cardsPage();
  if (a === 'interview') return interviewPage();
  if (a === 'mine') return minePage();
  if (a === 'search') return searchPage(h.slice(1).join('/'));
  if (/^m\d$/.test(a)) {
    if (!mod(a)) return homePage();
    CURMID = a; Store.set('curmid', a);
    if (!b) return modulePage(a);
    if (b === 'intro') return introPage(a);
    if (b === 'c') return chapterPage(a, c);
    if (b === 's') return sectionPage(a, c);
    if (b === 'ex') return exercisesPage(a, c);
  }
  homePage();
}
window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', () => { CURMID = Store.get('curmid') || 'm0'; if (!mod(CURMID)) CURMID = 'm0'; applySettings(); shell(); buildGlossary(); route(); });
window.App = { route, renderBlocks, md, toast, loadPy, mountWidgets };
})();
