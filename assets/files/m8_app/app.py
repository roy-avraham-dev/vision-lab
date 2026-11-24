# Drone vehicle scanner — the application window (ready-made code for the final project).
# Install once:  pip install PySide6 opencv-python numpy
# Run:           python app.py
import sys, os, csv
from dataclasses import dataclass
from typing import Optional
import cv2
import numpy as np
from PySide6.QtCore import Qt, QThread, Signal, QTimer, QRectF, QPointF
from PySide6.QtGui import QImage, QPixmap, QPainter, QPen, QColor, QFont, QFontMetrics
from PySide6.QtWidgets import (QApplication, QMainWindow, QWidget, QStackedWidget, QVBoxLayout, QHBoxLayout,
                               QLabel, QPushButton, QFileDialog, QProgressBar, QSlider, QTableWidget,
                               QTableWidgetItem, QHeaderView, QFrame, QAbstractItemView)

STOP_KMH = 9.0                      # below this speed a vehicle is shown as "stopped"
ZOOM = 3.0                          # how much the small window enlarges the selected vehicle


# ======================= 1. what the engine returns, and a demo engine =======================
@dataclass
class Vehicle:
    vid: int                        # the vehicle's id (stays the same through the whole video)
    box: tuple                      # (x1, y1, x2, y2) in pixels of the original frame
    speed: Optional[float]          # km/h, or None when the system does not know (levels 2 and 3)
    foot: tuple                     # (x, y): the point where the vehicle touches the ground
    source: str                     # where the scale came from: "נתיבים + רכבים", "נשמר מקודם", ...
    kind: str                       # "רכב" or "משאית"


class DemoEngine:
    """Stands in for YOUR engine. It reads the reference results of the Route 505 clip
    (drone_tracking_reference.csv, next to this file) instead of scanning.
    Your engine must have the same method: scan(video_path, report, should_stop) -> {frame: [Vehicle, ...]}"""

    def scan(self, video_path, report, should_stop):
        here = os.path.dirname(os.path.abspath(__file__))
        results = {}
        with open(os.path.join(here, "drone_tracking_reference.csv"), encoding="utf-8") as f:
            for r in csv.DictReader(f):
                fx, fy = float(r["foot_x_px"]), float(r["foot_y_px"])
                w, h = float(r["box_w_px"]), float(r["box_h_px"])
                v = Vehicle(int(r["vehicle_id"]), (fx - w / 2, fy - h, fx + w / 2, fy),
                            float(r["speed_kmh_est"]), (fx, fy), "רוחב רכבים", r["type"])
                results.setdefault(int(r["frame"]), []).append(v)
        cap = cv2.VideoCapture(video_path)            # the demo still decodes every frame, so the progress is real
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        for i in range(total):
            if should_stop():
                break
            ok, _ = cap.read()
            if not ok:
                break
            if i % 10 == 0:
                report(i + 1, total, "קורא את הסרטון")
        report(total, total, "הסתיים")
        cap.release()
        return results


# ======================= 2. reading frames, and the scan in the background =======================
class VideoSource:
    def __init__(self, path):
        self.cap = cv2.VideoCapture(path)
        if not self.cap.isOpened():
            raise IOError("הקובץ לא נפתח כסרטון")
        self.count = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        self.fps = self.cap.get(cv2.CAP_PROP_FPS) or 30.0
        self.w = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.h = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.last = -1

    def frame(self, i):
        if i != self.last + 1:                         # jumping: seek; playing: just read the next one
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ok, img = self.cap.read()
        self.last = i if ok else -1
        return img if ok else None


def to_pixmap(bgr):
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    h, w = rgb.shape[:2]
    return QPixmap.fromImage(QImage(rgb.data, w, h, 3 * w, QImage.Format_RGB888).copy())


class ScanWorker(QThread):
    progress = Signal(int, int, str)                    # done, total, what is happening now
    done = Signal(object)                              # the results dictionary
    failed = Signal(str)

    def __init__(self, engine, path):
        super().__init__()
        self.engine, self.path, self.stop_requested = engine, path, False

    def run(self):                                      # runs in its own thread: the window stays responsive
        try:
            res = self.engine.scan(self.path, self.progress.emit, lambda: self.stop_requested)
            if not self.stop_requested:
                self.done.emit(res)
        except Exception as e:
            self.failed.emit(str(e))


# ======================= 3. the video with boxes, and the small zoom window =======================
def zoom_crop(img, center, box_size, out_w, out_h):
    """The part of the frame around `center`, enlarged to out_w x out_h. Returns (crop, x0, y0, scale)."""
    H, W = img.shape[:2]
    cw = max(out_w / ZOOM, box_size[0] * 1.6)          # a big truck gets less zoom, so it still fits
    ch = max(out_h / ZOOM, box_size[1] * 1.6)
    cw, ch = max(cw, ch * out_w / out_h), max(ch, cw * out_h / out_w)
    cw, ch = min(cw, W), min(ch, H)
    x0 = int(np.clip(center[0] - cw / 2, 0, W - cw))
    y0 = int(np.clip(center[1] - ch / 2, 0, H - ch))
    crop = img[y0:y0 + int(ch), x0:x0 + int(cw)]
    return cv2.resize(crop, (out_w, out_h), interpolation=cv2.INTER_CUBIC), x0, y0, out_w / cw


class ZoomWindow(QFrame):
    """A small window over the video: the selected vehicle, enlarged and followed. It can be dragged."""
    W, H = 340, 191

    def __init__(self, parent):
        super().__init__(parent)
        self.setObjectName("zoom")
        self.setFixedSize(self.W, self.H + 30)
        self.title = QLabel(self)
        self.title.setGeometry(10, 0, self.W - 20, 30)
        self.pic = QLabel(self)
        self.pic.setGeometry(0, 30, self.W, self.H)
        self.center, self.drag_from = None, None
        self.hide()

    def show_vehicle(self, img, v):
        x1, y1, x2, y2 = v.box
        c = np.array([(x1 + x2) / 2, (y1 + y2) / 2])
        self.center = c if self.center is None else 0.8 * self.center + 0.2 * c     # smooth: no jitter
        crop, x0, y0, s = zoom_crop(img, self.center, (x2 - x1, y2 - y1), self.W, self.H)
        cv2.rectangle(crop, (int((x1 - x0) * s), int((y1 - y0) * s)), (int((x2 - x0) * s), int((y2 - y0) * s)), (255, 132, 10), 2)
        self.pic.setPixmap(to_pixmap(crop))
        speed = "עומד" if v.speed is not None and v.speed < STOP_KMH else ("לא ידוע" if v.speed is None else f"{v.speed:.0f} קמ״ש")
        self.title.setText(f"רכב {v.vid} · {speed} · ×{s:.1f}")

    def show_missing(self, vid):
        self.title.setText(f"רכב {vid} · מחוץ לתמונה")

    def mousePressEvent(self, e):                      # dragging: remember where the mouse grabbed the window
        self.drag_from = e.globalPosition() - QPointF(self.pos())

    def mouseMoveEvent(self, e):
        if self.drag_from is None:
            return
        p = (e.globalPosition() - self.drag_from).toPoint()
        par = self.parentWidget().rect()
        p.setX(max(0, min(p.x(), par.width() - self.width())))
        p.setY(max(0, min(p.y(), par.height() - self.height())))
        self.move(p)

    def mouseReleaseEvent(self, e):
        self.drag_from = None


class VideoView(QWidget):
    clicked = Signal(int)                               # the id of the vehicle that was clicked, or -1

    def __init__(self):
        super().__init__()
        self.setMinimumSize(640, 360)
        self.img, self.vehicles, self.selected = None, [], None
        self.zoom = ZoomWindow(self)
        self.zoom_placed = False

    def set_frame(self, img, vehicles, selected):
        self.img, self.vehicles, self.selected = img, vehicles, selected
        if selected is None:
            self.zoom.hide()
        else:
            if not self.zoom_placed:                   # first time: bottom-right corner of the video
                self.zoom.move(self.width() - self.zoom.width() - 14, self.height() - self.zoom.height() - 14)
                self.zoom_placed = True
            v = next((v for v in vehicles if v.vid == selected), None)
            self.zoom.show_vehicle(img, v) if v else self.zoom.show_missing(selected)
            self.zoom.show()
        self.update()                                  # ask Qt to repaint (paintEvent)

    def reset_zoom(self):
        self.zoom.center = None

    def image_rect(self):                              # where the frame is drawn: as big as possible, same shape
        h, w = self.img.shape[:2]
        s = min(self.width() / w, self.height() / h)
        return QRectF((self.width() - w * s) / 2, (self.height() - h * s) / 2, w * s, h * s), s

    def paintEvent(self, e):
        p = QPainter(self)
        p.fillRect(self.rect(), QColor("#000000"))
        if self.img is None:
            return
        r, s = self.image_rect()
        p.drawPixmap(r, to_pixmap(self.img), QRectF(0, 0, self.img.shape[1], self.img.shape[0]))
        p.setFont(QFont("Segoe UI", 9))
        fm = QFontMetrics(p.font())
        for v in self.vehicles:
            x1, y1, x2, y2 = v.box
            box = QRectF(r.x() + x1 * s, r.y() + y1 * s, (x2 - x1) * s, (y2 - y1) * s)
            stopped = v.speed is not None and v.speed < STOP_KMH
            col = QColor("#0a84ff") if v.vid == self.selected else QColor(174, 174, 178) if stopped else QColor(255, 255, 255)
            p.setPen(QPen(col, 1.6))
            p.drawRect(box)
            text = f"#{v.vid} · " + ("עומד" if stopped else "?" if v.speed is None else f"{v.speed:.0f} קמ״ש")
            tw = fm.horizontalAdvance(text) + 12
            tag = QRectF(box.x(), box.y() - 19, tw, 17)
            p.fillRect(tag, QColor("#0a84ff") if v.vid == self.selected else QColor(20, 20, 22, 210))
            p.setPen(QColor("white"))
            p.drawText(tag, Qt.AlignCenter, text)

    def mousePressEvent(self, e):
        if self.img is None:
            return
        r, s = self.image_rect()
        x = (e.position().x() - r.x()) / s
        y = (e.position().y() - r.y()) / s
        hit = [v for v in self.vehicles if v.box[0] - 6 <= x <= v.box[2] + 6 and v.box[1] - 6 <= y <= v.box[3] + 6]
        self.clicked.emit(hit[0].vid if hit else -1)

    def resizeEvent(self, e):
        self.zoom_placed = False


# ======================= 4. the screens =======================
def button(text, primary=False):
    b = QPushButton(text)
    b.setObjectName("primary" if primary else "secondary")
    b.setCursor(Qt.PointingHandCursor)
    return b


class StartPage(QWidget):
    chosen = Signal(str)

    def __init__(self):
        super().__init__()
        self.setAcceptDrops(True)
        box = QFrame(objectName="drop")
        box.setFixedSize(760, 420)
        lay = QVBoxLayout(box)
        lay.setAlignment(Qt.AlignCenter)
        for text, name in (("בחר סרטון רחפן לסריקה", "h1"), ("גרור קובץ לכאן, או בחר מהמחשב", "muted")):
            lab = QLabel(text, objectName=name)
            lab.setAlignment(Qt.AlignCenter)
            lay.addWidget(lab)
        pick = button("בחירת קובץ…", True)
        pick.clicked.connect(self.pick)
        lay.addWidget(pick, alignment=Qt.AlignCenter)
        outer = QVBoxLayout(self)
        outer.addWidget(box, alignment=Qt.AlignCenter)

    def pick(self):
        path, _ = QFileDialog.getOpenFileName(self, "בחירת סרטון", "", "סרטונים (*.mp4 *.mov *.avi *.mkv)")
        if path:
            self.chosen.emit(path)

    def dragEnterEvent(self, e):
        if e.mimeData().hasUrls():
            e.acceptProposedAction()

    def dropEvent(self, e):
        self.chosen.emit(e.mimeData().urls()[0].toLocalFile())


class Player(QWidget):
    """A video view with play / pause, a time bar and a time label. Used by the preview and the results."""
    frame_shown = Signal(int)

    def __init__(self):
        super().__init__()
        self.view = VideoView()
        self.play_btn = button("▶")
        self.play_btn.setFixedWidth(44)
        self.bar = QSlider(Qt.Horizontal)
        self.bar.setLayoutDirection(Qt.LeftToRight)    # time runs left to right, even in a Hebrew window
        self.time = QLabel("0:00.0 / 0:00.0", objectName="muted")
        row = QHBoxLayout()
        row.addWidget(self.play_btn)
        row.addWidget(self.time)
        row.addWidget(self.bar, 1)
        lay = QVBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.addWidget(self.view, 1)
        lay.addLayout(row)
        self.timer = QTimer(self)
        self.timer.timeout.connect(lambda: self.show(self.i + 1))
        self.play_btn.clicked.connect(self.toggle)
        self.bar.sliderMoved.connect(self.show)
        self.src, self.i, self.results, self.selected = None, 0, {}, None

    def load(self, src, results=None):
        self.src, self.results, self.selected = src, results or {}, None
        self.bar.setRange(0, src.count - 1)
        self.timer.setInterval(int(1000 / src.fps))
        self.show(0)

    def toggle(self):
        if self.timer.isActive():
            self.timer.stop()
        else:
            if self.i >= self.src.count - 1:
                self.i = -1
            self.timer.start()
        self.play_btn.setText("❚❚" if self.timer.isActive() else "▶")

    def show(self, i):
        if self.src is None or i >= self.src.count:
            self.timer.stop()
            self.play_btn.setText("▶")
            return
        img = self.src.frame(i)
        if img is None:
            return
        self.i = i
        self.view.set_frame(img, self.results.get(i, []), self.selected)
        self.bar.blockSignals(True)
        self.bar.setValue(i)
        self.bar.blockSignals(False)
        t, T = i / self.src.fps, (self.src.count - 1) / self.src.fps
        self.time.setText(f"{int(t // 60)}:{t % 60:04.1f} / {int(T // 60)}:{T % 60:04.1f}")
        self.frame_shown.emit(i)

    def stop(self):
        self.timer.stop()
        self.play_btn.setText("▶")


class PreviewPage(QWidget):
    start = Signal()
    other = Signal()

    def __init__(self):
        super().__init__()
        self.player = Player()
        self.info = QLabel(objectName="muted")
        go, again = button("התחל סריקה", True), button("בחירת קובץ אחר")
        go.clicked.connect(self.start)
        again.clicked.connect(self.other)
        bottom = QHBoxLayout()
        bottom.addWidget(self.info)
        bottom.addStretch(1)
        bottom.addWidget(again)
        bottom.addWidget(go)
        lay = QVBoxLayout(self)
        lay.setContentsMargins(120, 40, 120, 40)
        lay.addWidget(self.player, 1)
        lay.addLayout(bottom)


class ScanPage(QWidget):
    cancel = Signal()

    def __init__(self):
        super().__init__()
        self.status = QLabel("סורק…", objectName="h1")
        self.detail = QLabel(objectName="muted")
        self.bar = QProgressBar()
        self.bar.setFixedWidth(520)
        self.bar.setTextVisible(False)
        self.bar.setLayoutDirection(Qt.LeftToRight)
        stop = button("ביטול")
        stop.clicked.connect(self.cancel)
        lay = QVBoxLayout(self)
        lay.setAlignment(Qt.AlignCenter)
        for w in (self.status, self.bar, self.detail, stop):
            lay.addWidget(w, alignment=Qt.AlignCenter)

    def set_progress(self, done, total, what):
        self.bar.setMaximum(max(total, 1))
        self.bar.setValue(done)
        self.detail.setText(f"פריים {done} מתוך {total} · {100 * done // max(total, 1)}% · {what}")


class ResultsPage(QWidget):
    COLS = ["מספר זיהוי", "מהירות (קמ״ש)", "פיקסל (נקודת מגע בקרקע)", "מקור קנה המידה", "סוג"]
    again = Signal()

    def __init__(self):
        super().__init__()
        self.player = Player()
        self.table = QTableWidget(0, len(self.COLS))
        self.table.setHorizontalHeaderLabels(self.COLS)
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.table.verticalHeader().setVisible(False)
        self.table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.table.setSelectionMode(QAbstractItemView.NoSelection)
        self.table.cellClicked.connect(lambda row, col: self.select(int(self.table.item(row, 0).text())))
        self.player.view.clicked.connect(self.select)
        self.player.frame_shown.connect(self.fill_table)
        new = button("סריקה חדשה")
        new.clicked.connect(self.again)
        right = QVBoxLayout()
        right.addWidget(QLabel("רכבים בפריים הנוכחי", objectName="h2"))
        right.addWidget(self.table, 1)
        right.addWidget(new, alignment=Qt.AlignLeft)
        lay = QHBoxLayout(self)                        # right to left: the table first (right), then the video (left)
        lay.setContentsMargins(30, 30, 30, 30)
        lay.setSpacing(30)
        lay.addLayout(right, 1)
        lay.addWidget(self.player, 1)

    def select(self, vid):
        p = self.player
        if vid == -1:
            return                                     # a click on empty ground changes nothing
        p.selected = None if vid == p.selected else vid  # the same vehicle again: close; another one: switch
        p.view.reset_zoom()
        p.show(p.i)

    def fill_table(self, i):
        vs = sorted(self.player.results.get(i, []), key=lambda v: v.vid)
        self.table.setRowCount(len(vs))
        for row, v in enumerate(vs):
            speed = "לא ידוע" if v.speed is None else "עומד" if v.speed < STOP_KMH else f"{v.speed:.0f}"
            cells = [str(v.vid), speed, f"({v.foot[0]:.0f}, {v.foot[1]:.0f})", v.source, v.kind]
            for col, text in enumerate(cells):
                item = QTableWidgetItem(text)
                item.setTextAlignment(Qt.AlignCenter)
                if v.vid == self.player.selected:
                    item.setBackground(QColor(10, 132, 255, 50))
                self.table.setItem(row, col, item)


# ======================= 5. the window that holds the screens =======================
STYLE = """
QWidget { background: #161618; color: #f2f2f4; font-family: "Segoe UI"; font-size: 14px; }
QLabel#h1 { font-size: 22px; font-weight: 600; }   QLabel#h2 { font-size: 15px; font-weight: 600; }
QLabel#muted { color: #8e8e93; font-size: 13px; }
QFrame#drop { border: 2px dashed #3a3a3e; border-radius: 18px; background: #1b1b1e; }
QFrame#zoom { background: #1b1b1e; border: 1px solid #3a3a3e; border-radius: 10px; }
QPushButton { border-radius: 8px; padding: 9px 18px; }
QPushButton#secondary { background: #2a2a2e; border: 1px solid #3a3a3e; }
QPushButton#primary { background: #0a84ff; border: 1px solid #0a84ff; color: white; font-weight: 600; }
QProgressBar { background: #3a3a3e; border: none; border-radius: 3px; height: 6px; }
QProgressBar::chunk { background: white; border-radius: 3px; }
QSlider::groove:horizontal { height: 4px; background: #3a3a3e; border-radius: 2px; }
QSlider::sub-page:horizontal { background: #e5e5ea; border-radius: 2px; }
QSlider::handle:horizontal { background: white; width: 14px; margin: -5px 0; border-radius: 7px; }
QTableWidget { background: #161618; border: none; gridline-color: #232327; }
QHeaderView::section { background: #161618; color: #8e8e93; border: none; border-bottom: 1px solid #2a2a2e; padding: 8px; }
"""


class MainWindow(QMainWindow):
    def __init__(self, engine):
        super().__init__()
        self.engine, self.path, self.worker = engine, None, None
        self.setWindowTitle("סריקת רכבים מרחפן")
        self.pages = QStackedWidget()
        self.setCentralWidget(self.pages)
        self.start_p, self.preview_p, self.scan_p, self.results_p = StartPage(), PreviewPage(), ScanPage(), ResultsPage()
        for p in (self.start_p, self.preview_p, self.scan_p, self.results_p):
            self.pages.addWidget(p)
        self.start_p.chosen.connect(self.open_video)
        self.preview_p.other.connect(lambda: self.pages.setCurrentWidget(self.start_p))
        self.preview_p.start.connect(self.start_scan)
        self.scan_p.cancel.connect(self.cancel_scan)
        self.results_p.again.connect(lambda: self.pages.setCurrentWidget(self.start_p))

    def open_video(self, path):
        try:
            src = VideoSource(path)
        except IOError as e:
            self.start_p.findChild(QLabel, "muted").setText(str(e))
            return
        self.path = path
        self.preview_p.player.load(src)
        self.preview_p.info.setText(f"{os.path.basename(path)} · {src.count / src.fps:.0f} שניות · {src.w}×{src.h} · {src.fps:.2f} פריימים בשנייה")
        self.pages.setCurrentWidget(self.preview_p)

    def start_scan(self):
        self.preview_p.player.stop()
        self.scan_p.set_progress(0, 1, "מתחיל")
        self.pages.setCurrentWidget(self.scan_p)
        self.worker = ScanWorker(self.engine, self.path)
        self.worker.progress.connect(self.scan_p.set_progress)
        self.worker.done.connect(self.show_results)
        self.worker.failed.connect(lambda msg: self.scan_p.detail.setText("הסריקה נכשלה: " + msg))
        self.worker.start()

    def cancel_scan(self):
        if self.worker:
            self.worker.stop_requested = True
            self.worker.wait()
        self.pages.setCurrentWidget(self.preview_p)

    def show_results(self, results):
        self.results_p.player.load(VideoSource(self.path), results)
        self.pages.setCurrentWidget(self.results_p)

    def keyPressEvent(self, e):
        if e.key() == Qt.Key_Escape:                    # Esc leaves full screen, F11 returns to it
            self.showMaximized()
        elif e.key() == Qt.Key_F11:
            self.showFullScreen()


if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setLayoutDirection(Qt.RightToLeft)
    app.setStyleSheet(STYLE)
    win = MainWindow(DemoEngine())                      # replace DemoEngine() with your engine
    win.showFullScreen()
    sys.exit(app.exec())
