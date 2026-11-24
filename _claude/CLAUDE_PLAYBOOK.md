# מעבדת הראייה — Playbook for Claude (continuation instructions)

Written by Claude for Claude. Purpose: continue upgrading the remaining chapters (module 1 chapters 4–12, then
modules 2–7, then module 0) to the standard reached in **module 1, chapters 1–3**, without asking the user anything.
Read this whole file before touching the site. Last updated: 2026-11-16.

---

## 0. Standing rules from the user (never break these)

1. **Reply to the user in Hebrew.** Short progress reports; say what was verified and what was not.
2. **Never drop information from the course material.** Restructuring is allowed, images may be replaced by
   visuals. Everything I write is an *addition*, and additions are visibly marked as additions.
3. **No time division** (no weeks/days), everything free, simple explanations but not a childish design.
4. **Desktop only.** Never do phone/mobile work, never mention it.
5. **Explanation and context come first**; demos and practice come after. The user's complaint that started this
   work: "3 sentences, a demo and exercises — I don't understand the context, where I am relative to the project,
   topics are thrown one after another, each topic is not explained enough."
6. **No "בקצרה" and no "למה צריך את זה" boxes** in upgraded chapters (they hide automatically once a section has
   `deep`; do not re-introduce them, and do not mention them in texts).
7. **Demos must be advanced and cool, "not something generic with numbers".**
8. **Code examples:** well explained, must work when pasted into a new PyCharm file, and runnable code shows
   output **only when run** (no precomputed "expected output" in advance).
9. **Exercises:** cover all the material, mix of levels in every set, and every question well explained.
10. Do **not** request browser access to `cdn.jsdelivr.net` (the user rejected it). Pyodide in the user's browser is
    still unconfirmed — every feature must degrade gracefully when Python does not load.
11. Work autonomously: do not stop to ask for approval between chapters. Report after each module-1 chapter batch
    (or each whole module later).

Order of work: **module 1 chapters 4→12**, then modules **2, 3, 4, 5, 6, 7**, then module **0**. Finish all four
passes (section 3 below) for a chapter before moving on. Deploy after every chapter.

---

## 1. Where things are

- User's folder (Windows): `C:\Users\Roey\OneDrive\Desktop\קורס ראיה ממוחשבת -איתמר` — course PDFs.
  Site: subfolder `מעבדת הראייה` (`index.html`, `assets/`, `content/`). This file and a backup of the build
  tools live in `מעבדת הראייה\_claude\` (`CLAUDE_PLAYBOOK.md`, `build_tools.zip`).
- Cloud build dir: `/home/claude/build` (site in `/home/claude/build/site`). **It may not exist in a new session.**
  If it is missing: stage `_claude/build_tools.zip` and the deployed site from the device
  (`device_stage_files`), unzip the tools to `/home/claude/build`, and copy the deployed site folder to
  `/home/claude/build/site`. The deployed site is the source of truth for `site/`.
- Test scripts hard-code `file:///home/claude/build/site/index.html` and `/usr/bin/google-chrome` (playwright).

### Site architecture (vanilla JS, no build step)
- `content/<tag>.js` → `window.CONTENT[tag]` (the original material, verbatim; chapters → sections → blocks;
  chapters also have `exercises[{id, star, blocks, solution}]`).
- `content/<tag>_layer.js` → `window.LAYER[tag]` (`sections{id:{widgets,kid,why,deep}}`, `chapters{n:{kid,goal,story,recap}}`,
  `glossary, hints, interview, widgetTitles, decoders`), `<tag>_checks.js` (`checks`, `checks2`),
  `<tag>_practice.js` (`exSection`, `codeTests`, `missions`, `exWidgets`).
- Module-1-only files created by this upgrade (make the equivalents for every module):
  `m1_deep.js`, `m1_codefull.js`, `m1_exercises.js`, `assets/widgets/m1_labs.js` (ch 1–3, exports `window.LAB`
  helpers) and `assets/widgets/m1_labs2.js` (ch 4+, loaded after `m1_d.js`; exports `window.LAB2`: OpenCV-like
  `filt(g, f, k, sc)` for box/gauss/median/bilateral, `addNoise`, `grayScene()` = gray drone scene + 1-px power line
  + 2×2 lamp + edge/wire masks). Put chapter 5–12 labs in `m1_labs2.js` too (or `m1_labs3.js` after it).
- `assets/core.js` (router, rendering, Python runner), `assets/practice.js` (exercise cards, code checker),
  `assets/viz.js` (`V` helpers), `assets/app.css`, `assets/widgets/*.js` (`W.<id> = function (box) {…}`).
- Script order in `index.html` matters: widgets libs → `mN_a/b/c…` → labs file (overrides widget ids) ;
  `mN_layer` → `mN_checks` → `mN_practice` → `mN_deep` → `mN_codefull` → `mN_exercises`.

---

## 2. What "done" looks like for a chapter (the chapter 1–3 standard)

For every chapter: (A) deep explanations and context, (B) lab-grade demos, (C) stand-alone code examples,
(D) a levelled exercise set with full coverage. Details and data formats follow.

### A. Explanations and context — `content/<tag>_deep.js`

Engine support already exists in `core.js` for any module; it only needs data.

- `L.moduleStory` (html): what is built at the end of the module, the 2–3 questions the module answers, which
  chapters answer which. `L.roadmap = {lanes:[{title, chapters:[…], note}], join, joinNote, names:{n: short name}}`.
  (Module 1 already has both; write them for every other module.)
- Per chapter `Object.assign(L.chapters[n], {goal, story, recap})`:
  - `goal` — one sentence (shown in the "where am I" strip of every section).
  - `story` — "לפני שמתחילים את הפרק": the problem this chapter solves, what the previous chapter left open,
    the order of the sections and why ("the chapter answers four questions, in this order: … (1.1); … (1.2)"),
    and a `<div class="proj">` saying where this lands in the module's final project.
  - `recap` — "בסוף הפרק תדע": `<ul>` of the 4–6 things to remember, concrete (formulas, argument orders, numbers).
  Module 1 chapters 4–12 already have `goal` and `story`; they still need `recap`.
- Per section `D('<id>', html)` → `L.sections[id].deep`, shown as **"ההסבר המלא"** *before* the original text
  (which is then titled "מהחומר של הקורס"). Structure that worked:
  1. Open from the problem, in plain words, tied to the previous section ("in 2.1 we saw… now…").
  2. Build the idea from zero with `<h4>` sub-steps. Define every term the first time. Java analogies are welcome
     (the user knows Java).
  3. `<div class="ex">` — "דוגמה צעד אחר צעד" with real numbers that match the course's code and tables.
  4. `<div class="mistake">` — "טעות נפוצה" (the concrete bug and its symptom).
  5. `<div class="link">` — "איך זה מתחבר" (to previous/next sections).
  6. `<div class="proj">` — "איפה זה בפרויקט".
  Length: roughly 250–500 Hebrew words per section; more for the central sections. Code inline as
  `<code class="ltr">…</code>`. Never contradict the original; every number must be one I computed or one from
  the material. Do not use the words "בקצרה"/"למה צריך את זה".
- Tone: direct, adult, second person singular, no hype. Explain *why* before *how*.

### B. Demos — `assets/widgets/<tag>_labs.js`

Keep widget ids (layer/missions/exWidgets reference them); a labs file loaded after the old widget files
overrides the old `W.<id>`. For each section's widget ask: *does it let the user do the thing the section is
about, on something that looks real, and see the consequence?* If it is a small canvas with sliders and a number
readout — rebuild it.

What made the chapter 1–3 labs good (reuse the patterns):
- **One recurring realistic scene** per module/part (module 1: aerial "drone" scene with road, cars, cone, sign
  and the orange ball half in shadow; a scanned page for thresholds). Scenes are painted procedurally on an
  off-screen 2D canvas and converted to B,G,R float images (`paint()`, `droneScene()`, `docImage()` in
  `m1_labs.js`) — copy these helpers.
- **Direct manipulation**: hover magnifier with per-pixel values, click/drag on the image, drag a threshold on a
  histogram, drag masks/ROI, draw shapes while the matching code line is written live.
- **Show the mechanism, not just the result**: pixel clouds in two colour spaces, live histograms, the highlighted
  code line during a loop, the neighbourhood window under the cursor with the decision formula, an animated search.
- **Break it on purpose**: a "🐞" tab per classic bug (wrong channel order, (y,x) swap, no `waitKey`, wrapped hue
  range, Otsu on a tiny object…) showing the symptom.
- **A goal**: challenge with an automatic check (✓/✗ + text, never colour alone), a score, a hint and "show solution".
- **Always the real code line** next to the picture, using the numbers from the course's code.
- **Tie to the project** in the intro or the result text.
- The intro (`V.say`) tells the user exactly what to do, in bold verbs.

Technical rules learned the hard way:
- Canvas text: set `canvas.dir = 'ltr'` (page is RTL; otherwise `fillText` anchors on the wrong side).
- LTR fragments inside Hebrew sentences: use the `ltr()` helper
  (`<span dir="ltr" style="display:inline-block;direction:ltr;unicode-bidi:isolate">` + U+202A…U+202C); for ranges
  prefer Hebrew wording ("מ־5 עד 25") over "5–25".
- Animations: stop when `!document.body.contains(box)`.
- A widget is mounted twice on some pages (section + exercise card) — no global state, no fixed element ids.
- Ground-truth masks must match what is drawn (antialiasing: ball radius 13 → truth radius 13, pass bar 85%).
- `IM.components(m)` returns `{lab, comps}`; `comps[i].pix/area`. `Object.assign` with `undefined` overrides defaults.
- Tables inside widgets instead of bar charts drawn with canvas text. Min font 10px on canvas.
- After changing interactions, **rewrite the missions** for those widgets (`L.missions[id] = {tasks:[{t}], insight}`)
  — put the overrides at the end of `<tag>_deep.js` — and check `widgetTitles`.
- If a trap in the scene forces different numbers than the course's code (e.g. hue 12–21 instead of 5–25), say so
  in the widget text.
- Other modules have their own helper libs: `window.BX` (m4), `window.TR` (m5), `window.AC` (m6), `window.VL` (m7),
  `window.IM` (m1). For non-image modules the same principles apply: a recurring concrete scenario, direct
  manipulation, visible mechanism, a deliberate failure mode, a goal.

### C. Code examples — `standalone_<tag>.py` → `content/<tag>_codefull.js`

Engine (already in `core.js`, works for every module):
- `LAYER[tag].codeFull[blockId] = {pre:[{code, say}], post:[{code, say}], local?:true, note?:md}`.
  Added lines render as green rows tagged "תוספת להרצה עצמאית" with their own explanation; the original code is
  untouched. **Copy, Run and Edit all use the full source** (`pre + original + post`).
- Runnable Python shows **no** precomputed output; it appears only after ▶. The precomputed output is kept only
  as a fallback (Pyodide failed, or the code errored unedited) and for `localOnly` blocks.
- `localOnly` (auto: torch/tensorrt/onnxruntime/pycuda imports, `cv2.VideoCapture/VideoWriter`; or `local:true`)
  → no run button, label "רץ רק במחשב", precomputed output titled "כך נראה הפלט כשמריצים במחשב", plus `note`.
- Copy has a legacy fallback (`copyText`).

Per chapter:
1. Dump every `code` block of the chapter (sections **and** exercise solutions) with its line-by-line table.
2. For each block decide what a fresh PyCharm file is missing: imports; variables that come from earlier code
   (build a small test image/array — reuse the course's own test data from a neighbouring section); and a visible
   result (`print` of the key numbers and/or `cv2.imshow` + `cv2.waitKey(0)` + `cv2.destroyAllWindows()`).
   Every added piece gets a `say` explaining it; the import row carries the `pip install …` hint.
3. Camera/video/GUI-loop/GPU code → `local:true` + a `note` about what to expect on a computer
   (e.g. "the 90-frame video flashes by in under a second; use waitKey(33)"; "no camera → exits silently"; "press q
   with the window focused, English keyboard").
4. Add the block ids to `standalone_<tag>.py` (copy `standalone_m1.py`; it is generic except for the `F` dict and
   the tag). It runs every full script in a **fresh process and an empty folder** with GUI stubs, refuses to write
   if any fails, refreshes `b.output` in `content/<tag>.js`, and writes `<tag>_codefull.js`.
   For modules with a shared execution environment (m2, m4–m7: later blocks depend on earlier ones), stand-alone
   means the `pre` must rebuild whatever the block needs — keep it short by importing nothing exotic; when that is
   unreasonable (long training runs, model files), mark the block with a `note` that says exactly which earlier
   blocks to run first, and make sure the fallback output is shown on error.
   Modules that need non-NumPy libs in the browser (torch etc.) → `localOnly`.
5. Explanations: every block must have a "הסבר שורה אחר שורה" table (annotated view). If a block has none, or
   leaves non-trivial lines unexplained, add explanations as additions (same `codeFull` mechanism: extend it with
   an `extraSay` map if needed — implement in `annotatedCode` when first required). Known unexplained lines in
   chapters 1–3 (left as is): `raise RuntimeError` in 1.4, `h, w = 300, 400` in 3.4.
6. Check Hebrew comments/odd characters in code (`\t`, NBSP, typographic quotes) — fix via `codefix_<tag>.json`
   and rebuild, never by editing the text in place.

⚠ `build_content.py <tag>` regenerates `content/<tag>.js`; after any rebuild re-run `standalone_<tag>.py`
(outputs) — and note that `<tag>_exercises.js` injects at runtime, so it is unaffected.

### D. Exercises — `exercises_<tag>.py` → `content/<tag>_exercises.js`

Engine (already generic): `LAYER[tag].exMeta[id] = {level:1|2|3, sec, explain?}`; exercises flagged `extra:true`
get the "תרגיל משלים" tag; when *every* exercise of a chapter has a level, the exercises page shows a coverage
map (section ← exercises) and three groups: **חימום / יישום / אתגר**.

Per chapter:
1. Map each original exercise to the section it really practises; list sections with no exercise.
2. Give every original exercise a level and an `explain` in the fixed pattern
   `**נתון:** … **מה לעשות:** … **איך תדע שהצלחת:** …` (also allowed labels: `**מה לחפש:**`, `**המכשול:**`,
   `**שים לב:**`, `**טיפ:**`; start with `**זו שאלת הבנה, בלי קוד.**` or `**זה תרגיל שמריצים במחשב…**` when relevant).
   The original text is never edited.
3. Add supplementary exercises until: every section is practised at least once; each set has ≥3 warm-up,
   ≥4 practice, ≥2 challenge (targets, not quotas — chapters 1–3 ended with 9, 10, 9). Ids continue the chapter
   numbering (1.6, 1.7, … 2.10). Good kinds: predict-then-run (a runnable block inside the question — its output is
   hidden until run), bug hunt, "diagnose the symptom", choose-the-method with a one-line justification,
   pen-and-paper numeric (latency/fps, pixel values), implement-it-yourself in NumPy with an automatic check.
4. Every new exercise: question split into lettered parts, 1–2 `hints`, a full `sol` (with *why*), `sec`.
   Automatic checks (`test`): NumPy-only when possible, starter must print FAIL with a helpful message, the
   `solved` source must PASS; error messages point at the specific mistake (e.g. swapped row/column).
   Solutions with code are complete stand-alone scripts.
5. Run `exercises_<tag>.py` (copy `exercises_m1.py`): it validates all checks and code blocks, then emits the JS.
   All numbers quoted in solutions come from running the code — never from memory. Note library subtleties
   honestly (e.g. `THRESH_BINARY_INV` includes equality; `adaptiveThreshold` differs by 15/120000 pixels).
6. Fix `exSection` when an original exercise was mapped to the wrong section.

---

## 3. Per-chapter procedure (do all of it, in this order)

1. Read the chapter's sections, code, tables and exercises from `content/<tag>.js`; read the existing layer
   (kid/why/widgets/checks/missions) and the current widgets' code; screenshot the current pages.
2. **Pass A** — write `recap` (and `goal`/`story` if missing) + `D()` for every section. Remove nothing.
3. **Pass B** — rebuild the widgets of the chapter in `<tag>_labs.js`; update missions.
4. **Pass C** — code examples (`standalone_<tag>.py`).
5. **Pass D** — exercises (`exercises_<tag>.py`).
6. **Verify** (section 4). Look at the screenshots of *every* changed widget and at least one code box and the
   exercises page of the chapter; exercise the main interactions with a playwright script (click tabs, drag,
   run the animated demos, press "show solution") and read the result texts.
7. **Deploy** (section 5).
8. Update the status table at the bottom of this file (both copies) and report to the user in Hebrew:
   what changed, what was verified, what was not (always: "not verified in your browser / Pyodide").

---

## 4. Verification commands (run from `/home/claude/build`)

```
node --check site/assets/core.js site/assets/practice.js            # and every changed .js
python3 shot.py "$(paste -sd, routes_mN.txt)"                       # must end with: ERRORS: none
python3 tools/interact.py routes_mN.txt                             # must end with: NO ERRORS
python3 tools/wshots1.py "4.1,4.2,…"                                # widget screenshots → /tmp/w1_<sec>.png (module 1)
python3 tools/codeshot.py "4.1,…"                                   # code boxes → /tmp/c_<sec>_<i>.png; prints "expected shown"
python3 tools/exshot.py                                             # exercises pages 1–3 (edit the chapter list)
python3 tools/runtest.py                                            # copy button + run fallback (CDN aborted)
python3 standalone_mN.py ; python3 exercises_mN.py                  # both must finish without "failed"
```
- After a `core.js`/`practice.js`/`app.css` change run `shot.py` for **all** modules (m1–m7; takes >2 min — run in
  background and wait).
- Pipeline for the original material (only if the material itself must be rebuilt):
  `extract.py <pdf> out <tag>` → `fixes_<tag>.json` → `apply_fixes.py <tag>` → (`merge_m6.py` / `post_m7.py`) →
  `coverage.py <pdf> out/<tag>.fixed.json` (must print `RESULT: PASS 100%`) → `build_content.py <tag>`.
- Test selectors: a page can contain the same widget twice — scope with `.tryit >> nth=0`; scroll canvases into
  view before mouse events; collapsed code boxes are not visible (filter with `is_visible()`).

## 5. Deploy

```
cd /home/claude/build/site && rm -f /mnt/user-data/outputs/site_update.zip && zip -qr /mnt/user-data/outputs/site_update.zip .
```
→ `device_commit_files` (force) to
`C:\Users\Roey\OneDrive\Desktop\קורס ראיה ממוחשבת -איתמר\מעבדת הראייה\_update.zip` →
`device_bash`:
```
cd "$HOME/mnt/קורס ראיה ממוחשבת -איתמר/מעבדת הראייה" && python3 -c "import zipfile;zipfile.ZipFile('_update.zip').extractall('.')" && mv -f _update.zip _update.zip.old
```
(The device tools' schemas may need `ToolSearch select:mcp__remote-devices__device_commit_files,mcp__remote-devices__device_bash`.)
After deploying, also refresh `_claude/CLAUDE_PLAYBOOK.md` and `_claude/build_tools.zip` on the device when this
file or the build scripts changed. Tell the user to press Ctrl+F5.

---

## 6. Report style (to the user, Hebrew)

- First line: what is done and that it is deployed. Then what was found, what changed, what was checked / not checked.
- Plain words, no internal names (no "labs file", "codeFull", "Pyodide fallback path" — say "פייתון בדפדפן").
- Always state honestly: screenshots reviewed vs. not, interactions run vs. not, and that nothing was verified in
  the user's own browser. Mention any place where my numbers differ from the course's code and why.
- No questions at the end unless truly blocked; just say what comes next.

---

## 7. Status

| Module / chapter | A explanations | B demos | C code | D exercises |
|---|---|---|---|---|
| m1 ch 1–12 | done | done | done | done |
| m2 ch 1–12 | done | done | done | done |
| m3 ch 1–12 | done | done | done | done |
| m4 ch 1–12 | done | done | done | done |
| m5 ch 1–12 | done | done | done | done |
| m6 ch 1–11 | done | done | done | done |
| m7 ch 1–10 | done | done | done | done |
| m0 ch 1–12 | done | done | done | done |
| m8 (project) ch 1–10 | done | done | none by design | none by design |

Module 6 notes (done, Nov 17):
- Files: `assets/widgets/m6_labs.js` (one IIFE per chapter; `window.SIM6` = {simPipe, pct, runPipe}; `window.ONNXJS`
  protobuf writer/reader; `window.Q6` quant helpers incl. a hand-made float16 rounding), `content/m6_deep.js`,
  `standalone_m6.py`, `exercises_m6.py`. No GPU here: ch 4 labs carry a yellow "מודל — לא מדידה" badge; shapes/bytes
  are computed from the real backbone, times are models. Real in-browser measurements: 1.2 (conv timing), 9.1
  (preprocessing order), 10.2 (float32 sum order); really trained in-browser: 6.2 (QAT with STE on two spirals).
- The backbone everywhere is (3,32,64,128,256,512) — 6.3 MB, equal MACs in layers 2–5 (course 8.3). P['BB'] in
  /tmp/t6/parts.json was the source; the code lives in F['m6-b30'].pre[0] (copied into b96/b110/b259).
- mlp.py's forward returns hs = [X, h1, ..., logits] (input of every layer first) — calibrate() and export_int8()
  of the course index it that way. WRITE pre = F['m6-b67'].pre[0] (uses sys.path.insert(0, os.getcwd())).
- C++/TensorRT/GStreamer/trtexec blocks: skiprun + local + note. quant.cpp was compiled and run here with g++ and the
  output is quoted in the note. Exercise items support {'code', 'lang': 'cpp', 'norun': True} (shown, not run).
- runPipe(o): time-stepped camera/file pipeline; reproduces the course table of 7.2 within 1–2%.

Module 0 notes (done, Nov 18):
- Files: `assets/widgets/m0_labs.js` (loaded LAST, after m7_labs — it uses D4 from m4_labs and LAB.droneScene from m1_labs;
  kit `window.K0`: img/show/cv/gray, plane (math y-up, drag), V2, M2, M3, warp (2×2 about center), warpH (3×3 in pixel coords,
  pull + bilinear), solve (Gauss), homog (4-point H), eigSym (Jacobi), fplot (1-D plots)), `content/m0_deep.js` (roadmap,
  moduleStory, C[n], D(), missions merged with Object.assign into the old m0_missions), `standalone_m0.py` (harness also
  captures matplotlib figures), `exercises_m0.py` (MPLBACKEND=Agg). Recurring image: the drone scene of module 1.
- interact.py reports "widget err" on m0 pages: false positive — the old m0_checks show "כתוב תשובה קודם" with class .err.
- Course typos flagged as additions: 2.2 "(v 4, −1)", 3.3 "(sin θ, cos θ−)", 8.2/8.4 "(2η − 1)" → (1 − 2η), (1 − 8η).
- Chapters 9–12 share helpers in the last IIFE: K0.ax (plot with chosen ticks: bars, curve, shade, vline), K0.hist, K0.erf,
  K0.Phi, K0.npdf; ch 11: G11 (gray drone), conv11 (valid / same with reflect), showS (signed display), gk (Gaussian kernel),
  KS (kernel catalogue); ch 12: P12 (world-coordinate plane with probability field, line, arrow), clouds12, fwd12, loss12.
- mono() in m0_labs replaces the typographic minus (−) of F() with '-' in every code block, and is installed as D4.mono so
  the later IIFEs (which destructure D4) get it too — code shown in a lab must paste into Python.
- New section widget: S['12.3'].widgets = ['w_grad12'] (chain rule per point). w_logreg has three tabs: the project with
  exercises 12.1–12.3 as switches, softmax 3 classes (12.4★), a hidden layer of 8 ReLU on two circles (12.5★★).
- standalone: LATER = {'PROJECT_LATER': 'm0-b601'} — the gradient check b608 runs after the whole project code.
- Exercises: every chapter ≥ 3/4/2 and every section covered (8.10 covers 8.1, 11.10 covers 11.2).

Module 7 notes (done, Nov 18):
- The course's `tinyclip.py` is MISSING from the course material. `build/tinyclip_m7.py` is my rewrite with the same
  API (make/classes/Vocab/TinyCLIP/train/zeroshot, prep and prep_chroma, softmax and sigmoid losses with hand-written
  gradients, Adam). `TC` in standalone_m7.py writes it next to the script if missing. Numbers differ from the course;
  every deep text / say says so and quotes both. Our data is a bit harder: the sklearn closed MLP needs 100 iterations
  (30 does not converge: 88.6% < open 89.6%), and 20 labels per class give only 60.5% (course 99.8%) — reported.
- `assets/widgets/m7_labs.js`: `window.VL7` kit (shapes, toy concept space) + `VL7.TC` = a JS tiny CLIP trained in the
  browser (6,000 samples, H 64, 15 epochs, ~30 s) shared through `VL7.ensure(key)` ('chroma', 'pixels', 'chroma|sig').
  ch7 adds `VL7.det` (128px scenes + saturation proposals) and `VL7.detSet(N)`; ch9 adds `VL7.Closed`/`trainClosed`
  (softmax MLP, Adam) and `ensureClosed`. Real in-browser experiments: 7.1/7.2 detector + AP table, 9.1 open vs closed,
  9.3 hybrid (open labels → review → closed with a 25th class), 10.1 eval set by query type, 10.2 add-target.
  Illustrations (badged in the say as "המחשה"): 7.3 cost model, 7.4 relation scores.
- skiprun blocks: b151, b172, b200, b206, b234, b287 (transformers/ultralytics/torch). The rest run (b188 and b252
  re-create the scenes in their pre; b252 pre = [TC, P6, F['m7-b188']['pre'][2], crops]).
- Course typo kept and flagged in deep 8.3: solution 8.2 says "tank" for a pickup truck.

Engine features that already apply to all modules: output-on-run only, copy fallback, `localOnly` label,
levels/coverage map on the exercises page (activates when a chapter's `exMeta` is complete), roadmap/story/recap/deep
rendering.

PyTorch runner (Nov 16): torch is installed on the USER'S WINDOWS python (3.13, torch 2.15 cpu, torchvision 0.29).
`_claude\START_TORCH.bat` (user double-clicks) starts `_claude\runner.py`, which runs every new `_claude\jobs\*.py`
in a temp folder and writes `<name>.out.json` {stdout, stderr, code, seconds}. From here: write the job with
device_bash into "$HOME/mnt/קורס ראיה ממוחשבת -איתמר/מעבדת הראייה/_claude/jobs/", poll for the .out.json.
Only works while the user's window is open. User asked: module 2 now (m3 paused after ch 1).
Module 2 setup: `assets/widgets/m2_labs.js` (window.LAB2M; fast typed-array MLP on the spiral), `content/m2_deep.js`,
`standalone_m2.py`, `exercises_m2.py` (COURSE_DEFS = course code of 1.2+1.3), `tools/wshots2.py`.

Remote runs from the build scripts: in standalone_m2.py, F[bid]['remote']=True → writes the job (HARNESS with the
source embedded) to /mnt/user-data/outputs/jobs/<bid>.py and prints PENDING; commit those to _claude\jobs, poll,
stage the .out.json files and copy them to /tmp/remote_out/<bid>.out.json, rerun. Same in exercises_m2.py for code
items with 'remote': True (key 'ex<id><part>'). A course note "(לא הורץ)" before a block that now ran is replaced
by a note saying it ran (PyTorch 2.15, CPU, Windows); the course's expected-output comments stay in the code.

Remote job details (learned in ch3): job = REMOTE_STUB + full source (NOT the harness — DataLoader workers on Windows
re-import the main module); job/out names carry a hash of the source (`<bid>.<sha8>`), because the runner skips a job
whose .out.json exists. F[bid]['main']=True runs the course block inside main() + `if __name__ == "__main__":`
(needed for num_workers on Windows; core.js bodyText() indents it on the site too). FIXES/FIXNOTE in standalone_m2.py
correct course typos (b123: two lines glued) with a visible note. FashionMNIST download ≈ 5 min on the user's line.

Lessons from m2 chapters 4–5 (real-data labs):
- Lab jobs (not course code) are written by hand to /mnt/user-data/outputs/jobs/ and committed; name them with a
  `z` prefix (`zlab5_*.py`) so the quick standalone jobs (sorted first by the runner) finish first. Data dir on
  Windows: `~/.course_data` (FashionMNIST cached there; course code itself still downloads to ./data).
- The runner keeps only the LAST 20,000 chars of stdout: keep lab output compact (record every 50 steps, 3 sig.
  digits) and print the JSON on one line with a tag (`LAB5D {...}`). A truncated line = rerun with less output.
- Real results go into data files loaded after m2_practice.js: `content/m2_lab4data.js` (window.M2LAB4: SmallCNN
  hist, learned kernels, activations, shuffle experiment) and `content/m2_lab5data.js` (window.M2LAB5: deep/res
  gradient norms per layer, small ResNet of ex 5.3). Widgets read them through L4()/L5() and say "not loaded" if
  missing.
- Extra widgets in a section: in m2_deep.js `S['5.1'].widgets = [...].concat([...])` and `L.widgetTitles.<id>`.
- Results so far: SmallCNN 90.3% (5 ep), MLP 87.0%; shuffle: MLP 86.0→86.5, CNN 88.5→86.2 (2 ep); 20-layer plain
  conv net (no norm) stuck at ln10 with SGD AND AdamW, residual 74.6%/75.8% after 1 epoch. torchvision counts
  verified: resnet18 11,689,512, convnext_tiny 28,589,128; BasicBlock(64,128,2) 230,144; ConvNeXtBlock(96) 79,200.
- Course typos fixed with FIXNOTE: b123 (glued lines), b173 and b212 (end-of-line comment broken onto a new line).
- Inside widget JS strings use ltr('…') — `<span class="ltr">` does not isolate in widget text (bidi reverses ^L).

Lessons from m2 chapters 6–12:
- Big lab results: the job writes JSON straight into the jobs folder with a hard-coded path
  (OUT = r"C:\Users\Roey\OneDrive\Desktop\קורס ראיה ממוחשבת -איתמר\מעבדת הראייה\_claude\jobs") and prints only a
  short summary (stdout is cut to its last 20,000 chars). lab6.json / lab9.json were made this way.
- standalone_m2.py job-only keys: 'files' {name: source} written next to the script before it runs (project files),
  'jobfix' [(old, new)] applied only to the job (e.g. epochs 30 -> 10 on CPU, data path -> ~/.course_data),
  'jobpost' extra code only in the job. The site shows the course code; the say/notes must state any job-only change.
- Data files (all loaded after m2_practice.js): m2_lab4data .. m2_lab12data (no lab11). m2_lab7data also holds the
  exact numpy data of section 7.2 (window.M2IMB), m2_lab8data the exact points of 8.1 (window.M2POLY) — widgets
  then reproduce the course numbers exactly.
- The project of ch 12 is downloadable: site/assets/files/m2_project.zip (metrics.py, trainer.py, run_fashion.py, README),
  built from METRICS_PY / TRAINER_PY / full('m2-b529') in standalone_m2.py — rebuild it if those change.
- Honest results that differ from the course and are stated on the site: ex 6.3 max weights, transfer learning on
  28px Fashion (SmallCNN from scratch ≈ fine-tuned ResNet-18), LR range test steepest at 5e-4, bf16 on CPU 50-160x slower,
  focal (gamma=0) equals CE only up to float32 rounding.
- V.tabs(parent, labels, fn, -1) = a row of bordered buttons with nothing selected (ghost buttons look like plain text).

Order change (Nov 2026): module 2 needs PyTorch, which cannot be installed here, so it is skipped for now and
module 3 is done first (numpy + cv2 only); then m4, m5 (no torch), m6, m7, m0, and m2 last (or when torch exists —
then do it fully; otherwise do A/B/D and flag every torch code block as "not run").

Module 3 setup (done): `site/assets/widgets/m3_labs.js` (loaded after m3_c.js; own small helpers; exports
`window.LAB3`), `content/m3_deep.js` (roadmap, moduleStory, C[n] goal/story/recap, D(), missions),
`content/m3_codefull.js` from `standalone_m3.py`, `content/m3_exercises.js` from `exercises_m3.py`
(both scripts are the m1 scripts with the data emptied — add F entries / META / X per chapter). index.html loads
them. Widget screenshots: `tools/wshots3.py "<secs>" <wait_ms>` → /tmp/w3_<sec>.png.

Lessons from chapter 12:
- `LAB2.project12(rad, zoom)` runs the whole project async (measure → stabilize → track both), cached; `world12` adds
  a big orange-yellow tarp (hue 22) so the wide-hue bug of 12.4 reproduces (ball hue 16–17, sign 24, cone 9).
- `frame11(S, i, r, {world, col, ballAt, occ})` is the general renderer; `measure11(..., ballR, fopt)`.
- Occlusion: measure velocity only from FULL detections (area > 0.9·median) — a half-hidden ball's centroid lags.
- Standalone for the project: STAB_PRE writes stab.py (b399 + b403) if missing; must `import importlib` itself.

Lessons from chapter 11:
- `LAB2` stabilizer kit: `world11` (280x190 drone world), `shakes11({sd, asd, pan})` (defaults 1.8 px / 0.6° — scaled
  so radius 15 + zoom 1.1 has no border and radius 40 just shows one, like the course), `camM` (= getRotationMatrix2D
  + shift), `frame11`, `sim4`/`ransacSim` (estimateAffinePartial2D), `frameMotion11`, `trueMotion11`, `smoothPath`
  (edge pad), `measure11` (async, chunked, cached per key — ~2.8 s for 120 frames), `borderFrac`, `corrM`, `zoomM`.
- Course code blocks that build on each other: standalone `pre` blocks are built from the earlier blocks' text at
  run time (SHAKY_PRE writes scene.py + shaky.mp4 if missing; FM_PRE; ST_PRE). All marked `local`.
- Zoom 1.1 hides h·(1−1/z)/2 = 21.8 px of 480 (course says 24) — noted in the deep text.

Lessons from chapter 10:
- `LAB2` flow kit: `bil` (BORDER_REFLECT bilinear), `shiftG`, `gblur`, `grad8` (Sobel/8), `pyrDown`, `pyr`, `shiTomasi`,
  `lkLevel`/`pyrLK` (iterative pyramidal LK, OpenCV-like; returns per-level trace), `base10()` = gray drone scene with a
  DARK road (#3a3a3a — the default road has the same gray level as the grass, so its edges vanish in gray), `frames10`.
- Verified in JS: shift 8, maxLevel 0 → 78 status-1 / 20 correct; maxLevel 3 → 71/71 (same story as the course table).
- Dense flow demo needed sensor noise + a min-eigen gate (ME=1) to make the threshold choice meaningful.
- Exercises with cv2 + scene.py: the solution code starts with `SCENE_MK` (writes scene.py if missing) so it runs in
  an empty folder; tests stay numpy-only.
- Course ex 10.4 says 1 px → 1.01; real run gives 1.04 (10 px → 1.01). The standalone run shows the true output.

Lessons from chapter 9:
- `LAB2.orb9` (Shi-Tomasi + centroid orientation + 256 rotated BRIEF tests), `knn9`, `ransac9`, `lsH`
  (normalised DLT), `pair9(kind)` test pairs with a known homography ('scene','flat','tiles','blur','tilt','twoplanes').
- standalone harness now puts the script folder on sys.path (like PyCharm); code that imports a course helper file
  (scene.py) gets a `pre` that writes the file if missing + `importlib.invalidate_caches()`.
- When a course number does not reproduce (LS corner error 148 vs my 183), say so in the deep text.

Lessons from chapter 8:
- `LAB2` geometry: `persp` (= getPerspectiveTransform), `affine3`, `inv3`, `apply3`, `warp` (inverse mapping,
  bilinear), `resize` (nearest/linear/area like OpenCV), `solveLin`. Verified against OpenCV numbers.
- Exercise items may include `{'table': [[header...], [row...]]}` (rendered as a table block) besides `{'code': ...}`.

Lessons from chapter 7:
- `LAB2.contours(mask)` traces outer borders exactly like cv2.findContours (verified: NONE/SIMPLE point counts,
  contourArea, arcLength, moments centroid, boundingRect, minEnclosingCircle all equal OpenCV on the 7.2 image).
  `frame7(t, opts)` renders the moving-ball drone video (ball in shadow, an orange kite entering) for tracker labs.
- droneScene accepts `ball: false`, `texture: false`, `road`, `noise: 0`.

Lessons from chapter 6:
- When a section's numbers come from a random mask, embed the exact Python mask as packed bits (base64) so the
  lab reproduces the course table exactly (`SEC6`, `unpack`). JS morphology `kern/ERO/DIL/OPN/CLS` matches OpenCV
  (elements and border handling verified).

Lessons from chapter 5:
- `LAB2.edgeScene()` = gray scene with a darker road (in gray the default road and grass have the same brightness);
  `edgeFlat()` = same without grass texture, used as ground truth of object edges. `cannyStages(g, blurK, lo, hi)`
  mimics cv2.Canny (L1 magnitude, NMS, hysteresis) and returns every stage.
- A challenge needs a default that FAILS and a calibrated pass band; check with a grid in the browser first.

Lessons from chapter 4:
- Verify every number of the course's tables by running them; when a table depends on a hidden definition
  (4.4 edge width used a tolerance of ~5 levels), explain it in the deep text and expose it in the lab.
- Measure library timings in the sandbox (state: colour 1920×1080, 2-core cloud machine) and use them in decision labs.
- Calibrate lab pass/fail thresholds by computing all options in the browser first (playwright evaluate on `window.LAB2`).
- Math like `k − 1` inside Hebrew must be wrapped (`<span class="ltr">`, backticks in md, `ltr()` in widgets).

Known open items:
- Pyodide loading in the user's browser is unconfirmed (jsdelivr may be blocked there).
- Accessibility pass (✓/✗ besides colour everywhere, min SVG text size) not done for old widgets — fold it into Pass B.
- `m1_practice.js` code tests for chapters 4–12 are few (6.4, 7.1, 7.4, 9.4) — Pass D adds more.

Nov 17 (night, user asleep — asked: finish m2, then m3, then m4, no questions):
- m2 project run (b529) finished: 4 epochs, num_workers=0 (with num_workers=2 on the user's Windows CPU it did not finish
  4 epochs in 30 min; with 0 → 7 min). Results in m2_lab12data.js (metrics, confusion, config, run_dir, report).
  LESSON: in remote jobs on the user's PC always jobfix num_workers → 0. 'jobpost' dumps are cut from the shown output
  at '\nRUN '. A _Tee to _claude/jobs/<name>_progress.txt shows progress of long jobs.
- core.js md(): whitelist of inline tags in exercise/material text: <span|code class="ltr|note-small">, </span>, </code>,
  <i>, <b>, <sub>, <sup>. (Before this, m2/m3 extra exercises showed raw HTML.)
- m3 chapters 2+: assets/widgets/m3_labs2.js (loaded after m3_labs.js). 3D kit on window.LAB3: world3() (road going
  north, cars, sign, cone, buildings, trees, car park 8..26 × 30..60), render3(ctx, {K,R,t,W,H,dist?}, world, opt)
  (painter + near clip; returns {s, pr}), camCar (camera on a car, 1.5 m, looking north), observer(), camGlyph(),
  K3 = course K of ch3 (1000, 640, 360; 1280×720). World: x east, y north, z up (as the course).
- tools/dumpch.py <tag> <n> dumps a chapter (sections, code, tables, exercises).
- m3 ch5: in-browser calibration (LAB3.calibrate5: Zhang init + LM), views5() synthetic boards, drawBoard(). pre5_boards.py renders the 15
  board images in numpy (standalone pre of b145/b155); ho5_code.py = hold-out exercise 5.8.
- m3 ch6–11 labs in m3_labs2.js. ch11 VO trajectories are precomputed with OpenCV (findEssentialMat LMEDS) into
  content/m3_lab11data.js (my JS eight-point VO drifted far more than the 5-point solver — honest data instead).
  Data generator: /tmp/vo_data.py + pnp_data.py (rewrite if lost). Standalone 'skiprun' key skips blocks needing missing libs.

- m3 ch12 labs: droneCam(C,yaw,pitch,roll) (K 1400/960/540, 1920x1080, dist [-.12,.05]) and px2g(cam,uv,gz,noUndist) in m3_labs2.js. Standalone: b491's course solution calls pixel_to_ground(foot,K,R,C) (no dist) -> a wrapper in 'pre'; b403 is local+skiprun and gets ground.py written from b376 (GROUND_MK). Course solution to ex 12.2 describes a different CSV -> noted in META, extra ex 12.11 answers the question as asked.
Module 4 setup (Nov 17): `assets/widgets/m4_labs.js` (loaded after m4_c.js). Kit on window.D4: the aerial scene
(makeScene(11): road y 232..298, vertical road x 600..660, car park 680..950 × 26..198 with 45° cars, 13 people
incl. a crowd of 3 and one under a tree, a truck, bait objects bin/shadow/roof/rock, trees on top), paintScene (cached
960×540 canvas), drawScene(cv), strokeBox, visible(o) (tree occlusion), detect(opt) = simulated one-stage detector
(raw candidates with duplicates, size-dependent misses, false alarms on bait; deterministic per seed), iou, giou,
nms (returns keep, by, steps), match (greedy by score, class-aware), ap101. content/m4_deep.js (roadmap, moduleStory,
C[n], D(), missions via Object.assign(L.missions, ...)), standalone_m4.py, exercises_m4.py (insert chapters at
#@@CH@@), tools/wshots4.py, /tmp/tabshot.py (click tabs '@x,y' clicks, '~x0,y0,x1,y1' drags, '=k:v' sliders).

Nov 17 (afternoon) — m4 chapter 12 done (A–D), plus ex 11.9 (warm-up for 11.3) so ch 11 meets the 3-warm-up target.
- Ch 12 labs (end of m4_labs.js, own IIFE): D.seg12 = simulated general segmentation (colour region growing from prompt
  points, negative points block, optional box limit, hole filling) + components (8-conn), maskBox, largest, morph/closeM.
  Truth boxes of rotated parked cars are the sharp-corner bbox, so mask boxes reach ~0.8: ch 12 uses the 0.75 threshold.
- D.runMethod / D.pDet now exported (ch 7) — the 12.4 report generator reuses them.
- copyText (core.js) is NOT global — widgets need their own copy helper (copy12).
- Course block m4-b336 uses np without importing it: standalone pre adds the import (say explains).

Module 5 setup (Nov 17): `assets/widgets/m5_labs.js` (after m5_c.js; window.TK kit: the module-4 aerial scene as a VIDEO —
movers() with cars on both roads, two pairs of people that pass each other, a group, parked cars, a big tree OCC=[455,250,36]
over the road; video(opt) = gts + detections per frame (misses, jitter, low score + shrunk box half under the tree, false
alarms on BAIT bin/shadow/rock); drawFrame(cv, Vd, t, view); runTracker (TR.makeTracker + per-frame internal states),
runNaive (nearest centre, optional memory), score (TR.score), switches(), player(), trails(); TK.KF1D = the course KF1D).
content/m5_deep.js has '/* @@NEXT@@ */' (insert chapters there) and '/* @@MISSIONS@@ */' (missions). standalone_m5.py and
exercises_m5.py are the m4 scripts emptied; insert at '#@@CH@@'. standalone_m5.py has a LATER dict for 'NAME_LATER' pre placeholders.

m5 ch3–4 (Nov 17): TK.KFB (JS KFBox, block-diagonal P, Sdiag()), TK.toZ/fromZ; video({crowd:true}) packs group pG.
Ch4 widgets use oracle per-object tracks (trackAt) for costs/association; w5_gate_table runs TK.runTracker with thr sweep.
Findings: relative noise does NOT change the filtered box (K depends on Q/R ratio) — it fixes P/S, i.e. the Mahalanobis gate
(person neighbour accepted 100% with fixed 2 px; truck 56 px rejects ~19% of true dets). Crowd toggle does not move the best
IoU threshold (Hungarian protects); text says so honestly. Exercise 4.8 sim: thr 0.7 passes only ~21% for a 9 px person.
m5-b80: course bug — predict/update/box unindented; standalone post attaches them (KFBox.predict = predict ...).
exWidgets override at the end of m5_deep.js ('4.1' → w5_gate_example).

m5 ch5–6 (Nov 17): TK.SORTJ = the course SORT line for line (+ options bug:'noPredict'|'missedAfter', idAtConfirm, firstFrames,
returnPred, reid/reidThr/alpha/replace); TK.runSORT(Vd,o) → {outs, snaps(tracks per frame + log), ms, sc, ids, maxId}.
noPredict makes NO difference at 30 fps in the video (slow motion) — 5.2 has a "every 4th frame" toggle: 1 vs 45 switches.
max_age: 50 still beats 30 here (tree hides > 30 frames, straight paths) — text says so. Appearance: TK.embed(Vd, noise) adds
16-d unit vectors from colour+class (separate RNG; video() unchanged; E0/S0 white cars 0.11 apart; pA/pF same pink).
video({turn:true}) adds person pT who turns under the tree (~65 frames hidden): base30 → 2 ids, base90 → 2, reid90 → 1;
noise 0.3 → reid stops helping, 0.5 → hurts (4 vs 1 switches) — mirrors course ex 6.4.

m5 ch7–8 (Nov 17): SORTJ two:true (ByteTrack; low 0.1, thr2 0.5, lowR for ex 7.2); video({spots:n}) adds n fixed FP spots
(score 0.15–0.4, 80% of frames). Finding: in our video two-stage cuts switches/misses but ADDS FPs (BAIT spots score 0.3–0.6:
once one opens a track, low dets continue it) — text says so; low threshold collapses with spots (MOTA −0.39 at 40).
TK.camVideo(v): 480x270 window panning +v (frames 100–130) and back (130–160); frames.shift / shiftEst (+0.5 px noise);
SORTJ cmc:true shifts track x before predict; runSORT snaps include pred. 8.2 widget does REAL block matching + voting on the
rendered frames, with a 'jam' (cars fill the frame → estimate fails) and a 'mask' fix.

m5 ch9–12 (Nov 17) — MODULE 5 DONE. TK.metrics(G,O,thr) = the course evaluate() + single-threshold HOTA (detA/assA);
TK.fromVid(Vd, outs). SORTJ gained newThr, fuse (for the YAML map in 10.1). Ch11 uses the course ground homography solved in JS
(TK.groundH / groundHi, perspective scene drawing); zone widget has a spatial exit margin (person ON the edge re-alerts otherwise).
Ch12: TK.engine(v, o) = camVideo + tracker + GroundMapper (pure shift, shiftEst noise, optional reanchor) + speed error + zone
alerts; GSD 0.05 m/px. Findings: tracker CMC barely changes speed error / zone alerts (the ground mapper compensates on its own) —
text says so. Week-4 check: small NEGATIVE speed bias (~−0.1 m/s) in a 1 s window — reported as is.
Next by order: module 6, then 7, then 0.



Module 8 notes (the final project, Nov 18):
- Built differently by the user's request: NO code anywhere (no snippets, skeletons or function names) — hints point to
  course sections only. Files: content/m8.js (structure, empty section blocks), content/m8_layer.js (deep briefs,
  window.M8HINTS {ch: [direction, where in course, skeleton in words]}, window.M8DEF defense Qs), assets/widgets/m8_labs.js
  (window.SIM8: synthetic drone world 400×260 m, pinhole camera with yaw/tilt, scripted detector/tracker/geo in two
  behaviours naive vs required, 10 scenarios; widgets w8_*). MODS in core.js has m8; index.html loads m8.js, m8_labs.js
  (after m0_labs — uses K0), m8_layer.js.
- Learner state in localStorage keys m8_* (acceptance ticks, results board, hint levels, logs, defense, portfolio).
- Chapter 1 = the brief (scenes/angles/triggers/metrics/pipeline); 2 = contract; 3–9 = milestones, each:
  brief / hints (3 levels, gated by "what I tried" ≥ 40 chars) / planned fault / engineer's log; 10 = defense + portfolio.

- Section 1.6 (real clip, Route 505): widget `w8_real` in `assets/widgets/m8_real.js`, data `content/m8_real.js` (window.M8REAL: per vehicle f/x/y/speed/distance + summary). Media in `assets/files/m8_real_in.mp4`, `m8_real_out.mp4`, CSVs `m8_real_reference.csv`, `m8_real_summary.csv`; image `img/m8_map_points.jpg`. Reference = YOLO + manual correction, NOT a system run. Speeds are ±30% estimates from vehicle width; lat/lon column shows "ממתין" until ground control points A–D are measured. A single stabilized ground view over the whole clip is not viable (homography chain diverges) — don't retry it.

### Scale from the video itself (Nov 19) — the user decided: the project must work with NO flight data and NO ground control points
- Engine: a section object with `added: "<why>"` is an ADDITION (not course material): badge under the title + "תוספת" tag in the side nav,
  the part title is "הדוגמה בקוד", and the page flow is one unit list (all code) followed by the widgets (core.js sectionPage).
  Paragraph headings that introduce code must END WITH A COLON (`**…:**`) or makeUnits will not attach the code to them.
- m3 section 12.7 (added): `add_m3_127.py` (idempotent, writes into content/m3.js; sources in `build/src_added/s127/b1-3.py`),
  F entries in standalone_m3.py (m3-x127c1..c3), deep+widget registration in `content/m3_added.js`, widget `w3_s127` in
  `assets/widgets/m3_added.js`, exercises 12.12–12.14 in exercises_m3.py. Method: vanishing point of lane lines → horizon row →
  pitch for each f; f from car shape (length/width = 2.5); height (scale) from lane width 3.5 m and car width 1.8 m; the gap is the
  uncertainty. Six scenes: speed error 1–5% although f is off by up to 35% (errors cancel near the cars).
- m5 section 11.6 (added): `add_m5_116.py` (sources `build/src_added/s116/c1-3.py`), standalone_m5.py F m5-x116c1..c3,
  `content/m5_added.js`, widget `w5_s116` in `assets/widgets/m5_added.js`, exercises 11.10–11.12. Road direction = doubled-angle mean;
  lane width = widest strong peak of R(w)=|mean exp(2πi·off/w)| (gap-splitting failed by up to 12%; the period method 0–2.2% on 14 seeds);
  scale carried through zoom by the camera-motion scale (estimateAffinePartial2D + RANSAC: 0.09%); three answer levels.
- m8: `build/patch_m8_scale.py` (already applied — do NOT re-run on the patched file). Contract ד1/ד2/ד2א, 1.1/1.2/1.3/1.4/1.6, milestone 4
  (6.1) rewritten (depth model first → measure → explicit cues only if needed), hints 6, ACCEPT row 6, defense questions, ch 6 title
  "מפיקסל למטרים". New widget file `assets/widgets/m8_scale.js`: w8_scale_trig (1.3), w8_fault_desert/horizon (6.3), w8_fault_zoom (7.3).
- Synthetic clips with ground truth: `assets/files/m8_syn/s1_nadir … s5_desert` (.mp4, _truth.csv, _camera.csv), generator
  `build/src_added/syn/render.py` + `scenes.py` (python3 scenes.py <outdir> [names]); presented in 3.1. Checked: boxes match the render,
  speed field = displacement within 0.02 km/h.

### The application spec (Nov 19, user-approved) — module 8 is built around it
- User's spec: run from the IDE; full-screen window; pick/drag a video; preview; "התחל סריקה"; scan in the background
  (window stays responsive, cancel works), as fast as possible without losing quality; results = left half the scanned video
  with an axis-aligned box per vehicle and "#id · N קמ״ש"/"עומד" above it (like the Route 505 reference), right half a live
  table: מספר זיהוי, מהירות (קמ״ש), פיקסל (נקודת מגע בקרקע), מקור קנה המידה, סוג (רכב/משאית only). Zoom window: click a
  vehicle (video or row) → small draggable window in the corner, ×3, follows it (smoothed); same vehicle again closes; another
  vehicle switches. NO map (removed completely), NO lat/lon, NO distance columns, NO two-wheelers. Input: the video only.
- The user granted a ONE-TIME exception to "no code in module 8": the ready-made window code. Source:
  `build/src_added/app/app.py` (PySide6; DemoEngine reads drone_tracking_reference.csv; engine contract
  scan(video_path, report, should_stop) -> {frame: [Vehicle]}). `build/add_m8_app.py` writes it as section 8.2 (six parts
  with line-by-line tables, section flag `single` = one flow). Downloads: assets/files/m8_app/. NOT run as a window here
  (no PySide6, no network) — non-Qt parts verified with a stub PySide6 (/tmp/qtstub).
- Chapter 8 = "אבן דרך 6 — האפליקציה וסריקה מהירה": 8.1 brief, 8.2 code, 8.3 hints, 8.4 faults (w8_fault_freeze,
  w8_fault_lag = "סימונים שלא מסונכרנים"), 8.5 log. `build/patch_m8_app.py` (applied once; do not re-run).
- Chapter 1: 1.1 gallery w8_app_screens (img/m8_app_1..5.jpg, the approved dark mockups); the SIM8 player has map:false by
  default and shows "#id · speed" labels (naive speed = nadir assumption over half a second); 1.2 = two views + the app
  table; 1.6 widget w8_real = the results screen (raw m8_real_in.mp4 drawn on a canvas, boxes from M8REAL incl. w/h, live table,
  draggable zoom window), plus speed chart and summary.
- m6 section 7.4 (added): `build/add_m6_74.py` (sources build/src_added/s74), standalone_m6 F m6-x74c1 (local, run),
  m6-x74c2 (local, skiprun), `content/m6_added.js`, widget w6_bg (in m8_app.js, shared freeze demo), exercises 7.10–7.11.
- Engine change: sections with `added` or `single` render as one flow (core.js sectionPage).
