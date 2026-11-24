/* Module 7 — exercise → section map, automatic code checks (NumPy only), and missions for every visual. */
(function () {
const L = window.LAYER.m7;
L.exSection = {
  '1.1': '1.2', '1.2': '1.2', '1.3': '1.1', '1.4': '1.2',
  '2.1': '2.2', '2.2': '2.2', '2.3': '2.2', '2.4': '2.2',
  '3.1': '3.3', '3.2': '3.2', '3.3': '3.2', '3.4': '3.5',
  '4.1': '4.2', '4.2': '4.3', '4.3': '4.2', '4.4': '4.4',
  '5.1': '5.1', '5.2': '5.1', '5.3': '5.1', '5.4': '5.3',
  '6.1': '6.5', '6.2': '6.3', '6.3': '6.3', '6.4': '6.4',
  '7.1': '7.1', '7.2': '7.2', '7.3': '7.4', '7.4': '7.1',
  '8.1': '8.1', '8.2': '8.4', '8.3': '8.4', '8.4': '8.4',
  '9.1': '9.1', '9.2': '9.1', '9.3': '9.2', '9.4': '9.1',
  '10.1': '10.1', '10.2': '10.2', '10.3': '10.1'
};
const T = (task, starter, body) => ({ task, starter, test: 'try:\n' + body.split('\n').map(l => '    ' + l).join('\n') + "\n    print('PASS')\nexcept Exception as e:\n    print('FAIL:', e)" });
L.codeTests = {
  '1.1': T('כתוב cosine(a, b).', 'import numpy as np\ndef cosine(a, b):\n    return float(np.dot(a, b))\n', "assert abs(cosine(np.array([0.9, 0.1, 0.4]), np.array([0.2, 0.1, 1.0])) - 0.582) < 1e-3, 'צריך לצאת 0.582'\nassert abs(cosine(np.array([3., 0.]), np.array([5., 0.])) - 1) < 1e-12, 'אותו כיוון: 1'"),
  '1.2': T('כתוב zero_shot(img, T): מנרמל את השיכון ואת שורות T ומחזיר את האינדקס של המשפט הקרוב.', 'import numpy as np\ndef zero_shot(img, T):\n    return int(np.argmax(T @ img))\n', "T = np.array([[10., 0, 0], [0.6, 0.8, 0]])\nimg = np.array([0.6, 0.8, 0.])\nassert zero_shot(img, T) == 1, 'בלי נרמול השורה הארוכה מנצחת — צריך קוסינוס'\nassert zero_shot(img * 10, T) == 1"),
  '2.1': T('כתוב clip_loss(I, Tx, s): ההפסד הניגודי הסימטרי (ממוצע של שורות ועמודות). I ו־Tx מנורמלים, בצורה (B, d).', 'import numpy as np\ndef clip_loss(I, Tx, s=10.0):\n    return 0.0\n', "B = 4\nE = np.eye(B)\nassert abs(clip_loss(E, E, 1.0) - 0.7437) < 1e-3, 'התאמה מושלמת עם וקטורים ניצבים, קנה מידה 1: ln(e + 3) − 1 ≈ 0.744 (בסעיף 0.736)'\nassert clip_loss(E, E, 10.0) < 0.002, 'קנה מידה 10: כמעט אפס'\nD = np.tile(E[:1], (4, 1))\nassert abs(clip_loss(D, D, 10.0) - np.log(4)) < 1e-6, 'ארבעה זהים: ln 4'"),
  '2.2': T('כתוב dup_floor(B, K): ההפסד הנמוך הצפוי כשיש K צירופים שונים במנה של B (ln של B/K).', 'import numpy as np\ndef dup_floor(B, K):\n    return 0.0\n', "assert abs(dup_floor(128, 24) - 1.674) < 1e-3, 'ln(128/24) ≈ 1.67'\nassert dup_floor(4, 4) == 0"),
  '3.1': T('כתוב tower_params(inp, hid, d) לשתי שכבות מלאות עם הטיות.', 'def tower_params(inp, hid, d):\n    return 0\n', "assert tower_params(24 * 24 * 3, 256, 32) == 450848, 'מגדל התמונה: 450,848'"),
  '3.3': T('כתוב bow(sentence, E, idx): ממוצע שיכוני המילים (0 למילה לא מוכרת), מנורמל.', 'import numpy as np\ndef bow(sentence, E, idx):\n    return E[0]\n', "rng = np.random.default_rng(0)\nidx = {w: i + 1 for i, w in enumerate('a red blue circle square and'.split())}\nE = rng.normal(size=(len(idx) + 1, 8))\nu = bow('a red circle and a blue square', E, idx); v = bow('a blue circle and a red square', E, idx)\nassert abs(np.linalg.norm(u) - 1) < 1e-9, 'מנורמל'\nassert np.allclose(u, v), 'אותן מילים → אותו וקטור (תרגיל 3.3)'\nassert not np.allclose(u, bow('a red circle', E, idx))"),
  '5.1': T('כתוב siglip_loss(I, Tx, s, b): לכל תא log(1 + exp(−z·(s·cos + b))) עם z = 1 באלכסון ו־−1 בשאר; סכום חלקי B.', 'import numpy as np\ndef siglip_loss(I, Tx, s=10.0, b=-10.0):\n    return 0.0\n', "E = np.eye(4)\nassert abs(siglip_loss(E, E, 10, -10) - np.log(2)) < 1e-3, 'מושלם עם b = −10: ln 2 ≈ 0.693'\nD = np.tile(E[:1], (4, 1))\nassert abs(siglip_loss(D, D, 10, -10) - 2.773) < 1e-2, 'ארבעה זהים: 2.773'"),
  '5.2': T('כתוב half_point(s, b): הקוסינוס שבו ההסתברות הסיגמואידית היא חצי.', 'def half_point(s, b):\n    return 0.0\n', "assert abs(half_point(15.6, -5.31) - 0.3404) < 1e-3, 'תרגיל 5.2: כ־0.34'"),
  '6.1': T('כתוב index_mb(hours, fps, dim, bytes_): גודל האינדקס במגהבייט (10⁶).', 'def index_mb(hours, fps, dim, bytes_=4):\n    return 0.0\n', "assert abs(index_mb(10, 1, 768) - 110.592) < 1e-6, 'תרגיל 6.1'\nassert abs(index_mb(10, 1, 768, 2) - 55.296) < 1e-6"),
  '6.2': T('כתוב search(index, q, times, t0, t1, k): הדירוג של k הראשונים רק בטווח הזמנים.', 'import numpy as np\ndef search(index, q, times, t0, t1, k=10):\n    return np.argsort(-(index @ q))[:k]\n', "rng = np.random.default_rng(0)\nidx = rng.normal(size=(100, 4)); q = idx[3].copy(); times = np.arange(100.)\ntop = search(idx, q, times, 50, 80, 5)\nassert all(50 <= times[i] <= 80 for i in top), 'רק בתוך הטווח'\nassert len(top) == 5"),
  '6.3': T('כתוב temporal_nms(order, times, gap): עובר על התוצאות לפי הסדר ומדלג על כל תוצאה בטווח gap שניות מתוצאה שנבחרה.', 'def temporal_nms(order, times, gap=5):\n    return list(order)\n', "order = [0, 1, 2, 3, 4]; times = [10, 11, 12, 40, 13]\nassert temporal_nms(order, times, 5) == [0, 3], 'אירועים שונים, לא פריימים רצופים'"),
  '7.2': T('כתוב best_threshold(prob, truth): הסף שממקסם F1 (בודקים כל ערך שמופיע).', 'import numpy as np\ndef best_threshold(prob, truth):\n    return 0.5\n', "prob = np.array([0.9, 0.8, 0.35, 0.3, 0.2, 0.1]); truth = np.array([1, 1, 1, 0, 0, 0], bool)\nassert abs(best_threshold(prob, truth) - 0.35) < 1e-9, 'הסף המיטבי כאן 0.35'"),
  '8.1': T('כתוב vis_tokens(side, patch, shuffle): מספר האסימונים החזותיים.', 'def vis_tokens(side, patch, shuffle=1):\n    return 0\n', "assert [vis_tokens(224, 16), vis_tokens(384, 14), vis_tokens(512, 16, 4), vis_tokens(1024, 16, 4)] == [196, 729, 256, 1024], 'כמו בסעיף 8.1'"),
  '8.4': T('כתוב hallucination_rate(answers, present): שיעור "yes" על עצמים שאינם בתמונה.', 'def hallucination_rate(answers, present):\n    return 0.0\n', "a = ['yes', 'no', 'yes', 'no', 'yes']; p = [True, False, False, False, True]\nassert abs(hallucination_rate(a, p) - 1 / 3) < 1e-9, 'אחד מתוך שלושה עצמים חסרים קיבל yes'")
};

const M = (tasks, insight) => ({ tasks: tasks.map(t => ({ t })), insight });
L.missions = {
  w7_closed_vs_open: M(['הוסף מחלקה בסגור.', 'הוסף מחלקה בפתוח.'], 'עמודה מטקסט, בלי אימון.'),
  w7_cosine3: M(['לחץ "תמונה × 10".', 'לחץ "משפט = התמונה".'], 'הנרמול מבטל אורך; הרשימה קובעת.'),
  w7_families: M(['בחר כל משפחה.', 'מה משותף לכולן?'], 'הראשונה היא הבסיס.'),
  w7_pairs: M(['עבור על ארבעת הזוגות.', 'איזה כיתוב הכי מועיל?'], 'רעש שמתמצע.'),
  w7_contrastive: M(['לחץ על ארבעת הכפתורים.', 'הגדל את קנה המידה במושלם.'], 'כפילויות = רצפה.'),
  w7_shapes_data: M(['הגרל כמה פעמים.', 'מצא צירוף שלא באימון.'], 'אף פעם לא משולש כחול.'),
  w7_text_tower: M(['החלף סדר מילים.', 'הוסף מילה לא מוכרת.'], 'ממוצע לא רואה סדר.'),
  w7_image_tower: M(['קבע 24, 256, 32.', 'הגדל את הקלט ל־48.'], 'השכבה הראשונה שולטת.'),
  w7_train_loop: M(['עבור על הצעדים.', 'איפה קנה המידה מתעדכן?'], 'נגזרות שנבדקו.'),
  w7_loss_floor: M(['קבע 24 צירופים.', 'קבע 128.'], 'פחות כפילויות, רצפה נמוכה.'),
  w7_zeroshot: M(['בחר משולש כחול.', 'בחר עיגול אדום.'], 'הקרוב ביותר מ־32 משפטים.'),
  w7_pixels_fail: M(['ראה את הדיוק.', 'ראה מה הוא חושב.'], 'צבע כן, צורה לא.'),
  w7_saturation: M(['החלף צבעים.', 'השווה את מפת הרוויה.'], 'צורה בלי צבע.'),
  w7_composition: M(['ממוצע מילים.', 'מקודד עם סדר.'], 'הרכבה צריכה סדר.'),
  w7_sigmoid_loss: M(['לחץ על הכפתורים.', 'טען את תרגיל 5.2.'], 'הסף ב־−b/s.'),
  w7_sig_vs_soft: M(['הזז את הקבוע.', 'מה משתנה?'], 'מוחלט מול יחסי.'),
  w7_batch_table: M(['רחף על 128.', 'רחף על 512.'], 'מעט צעדים.'),
  w7_models_table: M(['בחר SigLIP 2.', 'בחר CLIP.'], 'עברית וציון מוחלט.'),
  w7_real_usage: M(['הזז את הקוסינוס.', 'שנה את b.'], 'הסתברות קטנה זה רגיל.'),
  w7_archive_search: M(['נסה צירוף שלא נראה.', 'נסה רק צבע.'], 'דירוג מושלם, ציונים נמוכים.'),
  w7_threshold: M(['סף 0.5 לשתי השאילתות.', 'מצא סף טוב לכל אחת.'], 'סף לכל מטרה.'),
  w7_video_index: M(['10 שעות.', '10,000 שעות.'], 'מעבר למיליונים: FAISS.'),
  w7_two_stage_det: M(['נסה כמה סצנות.', 'חפש צלב קטן.'], 'הצעות, ואז סיווג.'),
  w7_rank_vs_thr: M(['סף 0.5.', 'סף 0.15.'], 'סף לכל תיאור.'),
  w7_yoloworld: M(['הוסף תיאור.', 'מה רץ בכל פריים?'], 'קידוד פעם אחת.'),
  w7_gdino_vs_world: M(['בחר כל שימוש.', 'מצא שימוש ל־Grounding DINO.'], 'מהירות מול הבנה.'),
  w7_vis_tokens: M(['לחץ על ארבע התצורות.', 'הכפל את הרזולוציה.'], 'פי ארבעה אסימונים.'),
  w7_vlm_models: M(['בחר כל צורך.', 'מה מתאים לקצה?'], 'בודקים מה חדש.'),
  w7_closed_question: M(['בחר כל שאלה.', 'מה משותף לגרסאות?'], 'סגורה ולא מובילה.'),
  w7_vlm_pipeline: M(['10 מועמדים.', '30 מועמדים.'], 'שואלים רק פעם למסלול.'),
  w7_open_vs_closed: M(['מחלקות שנראו.', 'צירופים שלא נראו.'], 'דיוק מול כיסוי.'),
  w7_decision: M(['ענה "כן" על הראשונה.', 'עבור על כולן.'], 'החלטה לפי מצב.'),
  w7_hybrid: M(['עבור על השלבים.', 'מה רץ בינתיים?'], 'פתוח מתייג, סגור מזהה.'),
  w7_index_build: M(['עבור עד השמירה.', 'קרא את שורת המטא־מידע.'], 'שורה i = שורה i.'),
  w7_add_target: M(['סמן שלב.', 'רענן את הדף.'], 'נשמר בדפדפן.'),
  w7_acceptance: M(['מלא נמדד.', 'העתק כ־Markdown.'], 'כולל דוגמאות כישלון.')
};
})();
