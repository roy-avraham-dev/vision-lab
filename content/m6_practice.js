/* Module 6 — exercise → section map, automatic code checks (NumPy only), and missions for every visual. */
(function () {
const L = window.LAYER.m6;
L.exSection = {
  '1.1': '1.1', '1.2': '1.2', '1.3': '1.4', '1.4': '1.2',
  '2.1': '2.1', '2.2': '2.3', '2.3': '2.2', '2.4': '2.4',
  '3.1': '3.1', '3.2': '3.2', '3.3': '3.3', '3.4': '3.1',
  '4.1': '4.3', '4.2': '4.2', '4.3': '4.2', '4.4': '4.5',
  '5.1': '5.1', '5.2': '5.1', '5.3': '5.5', '5.4': '5.2',
  '6.1': '6.1', '6.2': '6.2', '6.3': '6.3', '6.4': '6.1',
  '7.1': '7.2', '7.2': '7.2', '7.3': '7.2', '7.4': '7.2',
  '8.1': '8.1', '8.2': '8.2', '8.3': '8.1', '8.4': '8.1',
  '9.1': '9.1', '9.2': '9.1', '9.3': '9.3', '9.4': '9.1',
  '10.1': '10.1', '10.2': '10.2', '10.3': '10.3', '10.4': '10.2',
  '11.1': '11.4', '11.2': '11.4', '11.3': '11.2', '11.4': '11.4'
};
const T = (task, starter, body) => ({ task, starter, test: 'try:\n' + body.split('\n').map(l => '    ' + l).join('\n') + "\n    print('PASS')\nexcept Exception as e:\n    print('FAIL:', e)" });
L.codeTests = {
  '1.1': T('כתוב pipeline(stages, threaded): מחזיר (תפוקה בפריימים לשנייה, השהייה מינימלית במילישניות).', 'def pipeline(stages, threaded):\n    return 0.0, 0.0\n', "thr, lat = pipeline([5, 40, 5], False)\nassert abs(thr - 20) < 1e-9 and lat == 50, 'בלולאה אחת: 20 ו־50'\nthr, lat = pipeline([5, 40, 5], True)\nassert abs(thr - 25) < 1e-9 and lat == 50, 'בתהליכונים: 25, וההשהייה נשארת 50'"),
  '1.2': T('כתוב report(times, warmup): משליך את הריצות הראשונות ומחזיר (חציון, אחוזון 95, אחוזון 99).', 'import numpy as np\ndef report(times, warmup=5):\n    t = np.array(times)\n    return t.mean(), t.max(), t.max()\n', "t = [16.0, 15.6, 14, 13, 13] + [12.0] * 90 + [13.5] * 5 + [14.6] * 5\nm, p95, p99 = report(t, 5)\nassert m == 12.0, 'החציון אחרי החימום הוא 12.0'\nassert p95 >= 13.5 and p99 >= p95, 'האחוזונים לפי np.percentile'"),
  '2.2': T('כתוב softmax(z) לאורך ציר 1 (ציר המחלקות), יציב נומרית.', 'import numpy as np\ndef softmax(z):\n    return z\n', "z = np.array([[1000., 1001., 1002.], [0., 0., 0.]])\np = softmax(z)\nassert np.allclose(p.sum(1), 1), 'כל שורה מסתכמת ל־1'\nassert np.all(np.isfinite(p)), 'בלי גלישה: מחסירים את המקסימום'\nassert (p.argmax(1) == z.argmax(1)).all(), 'הסדר לא משתנה'"),
  '2.3': T('כתוב varint(n): הקידוד של הכותב שלנו (שבעה ביטים לבית, ביט עליון "יש עוד", שלילי כמשלים לשתיים של 64 ביט).', 'def varint(n):\n    return bytes([n & 0xFF])\n', "assert varint(1) == b'\\x01' and varint(300) == b'\\xac\\x02', '300 → AC 02'\nassert len(varint(-1)) == 10, 'מספר שלילי: 10 בתים'"),
  '3.4': T('כתוב fold_bn(W, b, gamma, beta, mu, var, eps): מחזיר W ו־b חדשים. W בצורה (פלט, קלט, k, k).', 'import numpy as np\ndef fold_bn(W, b, gamma, beta, mu, var, eps=1e-5):\n    return W, b\n', "rng = np.random.default_rng(0)\nW = rng.normal(size=(8, 3, 3, 3)); b = rng.normal(size=8)\ng, be, mu, v = rng.random(8) + 0.5, rng.normal(size=8), rng.normal(size=8), rng.random(8) + 0.1\nW2, b2 = fold_bn(W, b, g, be, mu, v)\nk = g / np.sqrt(v + 1e-5)\nx = rng.normal(size=27)\ny1 = (W.reshape(8, -1) @ x + b - mu) * k + be\ny2 = W2.reshape(8, -1) @ x + b2\nassert np.allclose(y1, y2), 'הקונבולוציה המקופלת צריכה לתת אותו פלט'"),
  '4.2': T('כתוב copy_share(compute_ms, bytes_, gbps): חלק הזמן שהולך להעתקה לכרטיס.', 'def copy_share(compute_ms, bytes_, gbps):\n    return 0.0\n', "s32 = copy_share(3, 3 * 640 * 640 * 4, 2.5)\ns8 = copy_share(3, 3 * 640 * 640 * 1, 2.5)\nassert abs(s32 - 0.396) < 0.01, 'בעשרוני: בערך 40%'\nassert s8 < s32 / 2, 'בשמונה ביטים חלק ההעתקה קטן בהרבה'"),
  '5.1': T('כתוב quant_sym(x, bits) שמחזיר (q, s), כמו בקובץ quant.py.', 'import numpy as np\ndef quant_sym(x, bits=8):\n    return x, 1.0\n', "q, s = quant_sym(np.array([0.8, -0.2, 2.54, 0.011]))\nassert abs(s - 0.02) < 1e-12, 'הסקאלה 2.54 / 127'\nassert list(q) == [40, -10, 127, 1], 'הערכים השלמים מתרגיל 5.1'\nassert q.dtype == np.int8"),
  '5.2': T('כתוב qparams_asym(lo, hi, bits) שמחזיר (s, z).', 'def qparams_asym(lo, hi, bits=8):\n    return 1.0, 0\n', "s, z = qparams_asym(0.0, 3.32)\nassert abs(s - 3.32 / 255) < 1e-12 and z == 0, 'אחרי ReLU: סקאלה 3.32/255 ונקודת אפס 0'\ns, z = qparams_asym(-1.0, 1.0)\nassert z in (127, 128), 'טווח סימטרי: נקודת אפס באמצע'"),
  '5.3': T('כתוב acc_max(n): הערך המוחלט הגדול ביותר של הצבר ל־n מכפלות של שמונה ביטים (127 על 127), ו־fits(n, bits) אם הוא נכנס במספר עם סימן של bits ביטים.', 'def acc_max(n):\n    return 0\ndef fits(n, bits):\n    return True\n', "assert acc_max(64) == 1032256, '64 × 127 × 127'\nassert not fits(64, 16) and fits(9 * 256, 32), '16 לא מספיק, 32 כן'"),
  '5.4': T('כתוב rms_err(x, s): שורש ממוצע ריבועי השגיאה של עיגול x לכפולות של s. בדוק מול s/√12.', 'import numpy as np\ndef rms_err(x, s):\n    return 0.0\n', "x = np.random.default_rng(0).uniform(-1, 1, 200000)\nassert abs(rms_err(x, 0.01) - 0.01 / np.sqrt(12)) < 1e-4, 'צריך לצאת קרוב ל־s/√12'"),
  '6.4': T('כתוב calib_range(a, pct): הקצה העליון של טווח הכיול באחוזון pct (100 = מקסימום).', 'import numpy as np\ndef calib_range(a, pct=100):\n    return a.max()\n', "rng = np.random.default_rng(1)\na = np.r_[rng.random(10000), [8.0] * 4]\nassert calib_range(a, 100) == 8.0, '100: המקסימום'\nassert calib_range(a, 99.9) < 1.01, 'אחוזון 99.9 מתעלם מארבעת הפיקסלים השרופים'"),
  '7.1': T('כתוב backlog_latency(fps_in, fps_out, seconds): בכמה שניות גדלה ההשהייה אחרי seconds שניות עם תור ללא גבול.', 'def backlog_latency(fps_in, fps_out, seconds):\n    return 0.0\n', "v = backlog_latency(30, 24.7, 6)\nassert abs(v - 1.29) < 0.02, '5.3 פריימים בשנייה, כל אחד 1/24.7 שנייה: כ־1.29 אחרי שש שניות'"),
  '8.1': T('כתוב amdahl(stages, i, k): קצב הפריימים כשמאיצים את שלב i פי k.', 'def amdahl(stages, i, k):\n    return 0.0\n', "s = [2.99, 2.75, 14.35, 0.05]\nassert abs(amdahl(s, 2, 1) - 1000 / 20.14) < 1e-6\nr = amdahl(s, 2, 2) / amdahl(s, 2, 1)\nassert abs(r - 1.55) < 0.01, 'מודל מהיר פי שניים: הצינור פי 1.55'"),
  '8.3': T('כתוב conv_macs(h_out, w_out, c_out, c_in, k=3).', 'def conv_macs(h_out, w_out, c_out, c_in, k=3):\n    return 0\n', "assert conv_macs(320, 320, 32, 3) == 88473600, 'שכבה 0: כ־88 מיליון'\nassert conv_macs(160, 160, 64, 32) == 471859200, 'שכבה 1: כ־472 מיליון'"),
  '9.1': T('כתוב mb_per_sec(w, h, fps, bytes_per_value): כמה מגה בייט בשנייה (10⁶ בתים).', 'def mb_per_sec(w, h, fps, bytes_per_value=1):\n    return 0.0\n', "assert abs(mb_per_sec(3840, 2160, 30) - 746.5) < 0.1, '4K בשמונה ביט: כ־746'\nassert abs(mb_per_sec(3840, 2160, 30, 4) / mb_per_sec(3840, 2160, 30) - 4) < 1e-9"),
  '9.3': T('כתוב safe_bytes(a): מחזיר את הבתים של המערך בסדר הנכון גם כשהוא תצוגה שאינה רציפה.', 'import numpy as np\ndef safe_bytes(a):\n    return np.frombuffer(a.data if a.flags["C_CONTIGUOUS"] else a.base.data, dtype=a.dtype)[:a.size].tobytes()\n', "img = np.arange(24, dtype=np.uint8).reshape(2, 4, 3)\nv = img[:, ::-1]\nassert not v.flags['C_CONTIGUOUS']\nassert safe_bytes(v) == np.ascontiguousarray(v).tobytes(), 'השתמש ב־np.ascontiguousarray'"),
  '9.4': T('כתוב letterbox_pad(img, top, bottom, left, right, value=114) עם np.pad, והשווה לגרסה עם מערך מלא.', 'import numpy as np\ndef letterbox_pad(img, top, bottom, left, right, value=114):\n    return img\n', "img = np.random.default_rng(0).integers(0, 255, (4, 6, 3), dtype=np.uint8)\nout = letterbox_pad(img, 1, 2, 0, 0)\nref = np.full((7, 6, 3), 114, np.uint8); ref[1:5] = img\nassert out.shape == (7, 6, 3) and np.array_equal(out, ref), 'צריך להיות זהה ביט בביט'")
};

const M = (tasks, insight) => ({ tasks: tasks.map(t => ({ t })), insight });
L.missions = {
  w6_pipe_latency: M(['קבע 5, 40, 5 ו־0.', 'עבור ל"כל שלב בתהליכון".'], 'התפוקה עולה, ההשהייה לא.'),
  w6_warmup: M(['קבע 50 ריצות ובלי חימום.', 'קבע 2000 ריצות.'], 'אחוזון 99 צריך הרבה ריצות.'),
  w6_batch: M(['בחר אצווה 8.', 'הורד את קצב המצלמה ל־10.'], 'באצווה מחכים גם לפריימים.'),
  w6_target: M(['מלא את כל השדות.', 'השאר "מה נמדד" ריק.'], 'יעד בלי הקשר לא נבדק.'),
  w6_onnx_graph: M(['לחץ על pixels.', 'לחץ על opset.'], 'ארבעה חלקים בקובץ.'),
  w6_export_args: M(['הרץ 5 תמונות עם ממד קבוע.', 'קבע opset גבוה מהמנוע.'], 'שתי טעויות ייצוא נפוצות.'),
  w6_varint: M(['הקלד 127 ואז 128.', 'הקלד −1.'], 'מספר קטן — בית אחד.'),
  w6_verify: M(['עבור על ארבעת המצבים.', 'מצא באיזה מהם המחלקה משתנה.'], 'עיבוד מקדים שונה הוא החשוד הראשון.'),
  w6_simplify: M(['עבור על השלבים.', 'ספור כמה צמתים נשארו.'], 'ואחרי פישוט — אימות.'),
  w6_bn_fold: M(['שנה את γ ואת σ².', 'בדוק שהפלטים זהים.'], 'הנרמול נעלם לתוך המשקלות.'),
  w6_threads: M(['רחף על 2 ועל 8.', 'השווה את האחוזונים.'], 'לא יותר מהגרעינים.'),
  w6_providers: M(['סמן רק CUDA.', 'בטל את כולם.'], 'נפילה שקטה למעבד.'),
  w6_trt_build: M(['עבור לשלב 3.', 'מצא את הקרנל הנבחר.'], 'המנוע מודד ובוחר.'),
  w6_trtexec: M(['קבע חישוב 3 ורוחב פס 6.', 'עבור לקלט 8 ביט.'], 'העתקה יכולה להיות חצי מהזמן.'),
  w6_profile_shapes: M(['קבע מקסימום 32.', 'קבע min גדול מ־max.'], 'טווח רחב עולה בזיכרון.'),
  w6_trt_cache: M(['הפעל פעמיים.', 'מחק את המטמון.'], 'הבנייה רק פעם אחת.'),
  w6_int8_paths: M(['בחר כל דרך.', 'מצא את המומלצת.'], 'צמתי כימום נותנים שליטה.'),
  w6_quant_vec: M(['טען את תרגיל 5.1.', 'עבור ללא סימטרי בתרגיל 5.2.'], 'השגיאה עד חצי סקאלה.'),
  w6_quant_error: M(['קבע 8 ביטים.', 'קבע 2.'], 's/√12 מנבא את המדידה.'),
  w6_per_channel: M(['קבע k = 1.', 'קבע k = 40.'], 'סקאלה לכל ערוץ מצילה.'),
  w6_fp16: M(['נסה 0.1.', 'נסה 70000.'], 'גלישה מעל 65,504.'),
  w6_int_dot: M(['קבע 64.', 'קבע 2,304.'], '32 ביט מספיקים בהרבה.'),
  w6_calib: M(['מינימום־מקסימום עם פיקסלים שרופים.', 'אחוזון 99.9.'], 'ערך חריג אחד גונב את הטווח.'),
  w6_ste: M(['עבור על שלוש הלשוניות.', 'מה עובר אחורה?'], 'כאילו אין עיגול.'),
  w6_int8_speed: M(['קבע 4 מילישניות.', 'קבע 50.'], 'מחיר קבוע מול חיסכון יחסי.'),
  w6_loop_vs_threads: M(['עבור על שלושת המבנים.', 'השווה את ההשהייה.'], 'תור של החדש חוסם את ההשהייה.'),
  w6_queue_sim: M(['קבע הסקה 60.', 'קבע הסקה 30.'], 'בלי עומס התורים זהים.'),
  w6_file_vs_cam: M(['בחר מצלמה.', 'בחר קובץ.'], 'קובץ מחכה, מצלמה לא.'),
  w6_amdahl: M(['האץ את ההסקה פי 2.', 'פי 20.'], 'התקרה פי 3.5.'),
  w6_async_clock: M(['בלי סנכרון.', 'עם סנכרון.'], 'הזמן קופץ לשלב הבא.'),
  w6_preproc_order: M(['בחר 4K.', 'הפוך את הסדר.'], 'מקטינים קודם.'),
  w6_decode: M(['4K ב־30.', 'הפעל מפענח בחומרה.'], 'הפענוח יכול לבלוע את התקציב.'),
  w6_transfer: M(['עבור לשמונה ביטים.', 'הפעל זיכרון נעול.'], 'פחות בתים, העתקה מהירה.'),
  w6_java_cpp: M(['פתח "העברה לפונקציה".', 'פתח "שחרור זיכרון".'], 'הפניה קבועה ו־RAII.'),
  w6_assoc: M(['קבע 1 סכום.', 'קבע 8.'], 'עשרוני משתנה, שלם לא.'),
  w6_raii: M(['עבור על התוכנית.', 'אפשר העתקה וחזור.'], 'שחרור כפול.'),
  w6_deliverables: M(['סמן תוצר.', 'רענן את הדף.'], 'נשמר בדפדפן.'),
  w6_plan6: M(['קרא את בדיקות ההצלחה.', 'סמן את השלב הראשון.'], 'לפי סדר.'),
  w6_report6: M(['מלא שורת חומרה.', 'העתק כ־Markdown.'], 'בלי שורת חומרה המספרים חסרי משמעות.'),
  w6_dryrun: M(['תמונה אחת.', 'אצווה של 540.'], 'המחיר הקבוע מתחלק.')
};
})();
