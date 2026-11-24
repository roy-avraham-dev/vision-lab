# Job runner for the course site build. Runs every *.py file that appears in the "jobs" folder next to this file,
# with this computer's Python (which has PyTorch), and writes the output next to it as <name>.out.json.
# Stop it by closing the window, or by creating a file named STOP in the jobs folder.
import json, os, subprocess, sys, time, tempfile, shutil, traceback
HERE = os.path.dirname(os.path.abspath(__file__))
JOBS = os.path.join(HERE, "jobs")
os.makedirs(JOBS, exist_ok=True)
print("runner: watching", JOBS, "with", sys.executable)
while not os.path.exists(os.path.join(JOBS, "STOP")):
    for name in sorted(os.listdir(JOBS)):
        if not name.endswith(".py"):
            continue
        src = os.path.join(JOBS, name); out = src[:-3] + ".out.json"
        if os.path.exists(out):
            continue
        print("running", name, flush=True)
        t0 = time.time(); work = tempfile.mkdtemp(prefix="job_")
        try:
            shutil.copy(src, os.path.join(work, "script.py"))
            r = subprocess.run([sys.executable, "script.py"], cwd=work, capture_output=True, text=True, timeout=1800,
                               env=dict(os.environ, MPLBACKEND="Agg", PYTHONIOENCODING="utf-8"))
            res = {"stdout": r.stdout[-20000:], "stderr": r.stderr[-8000:], "code": r.returncode}
        except Exception:
            res = {"stdout": "", "stderr": traceback.format_exc(), "code": -1}
        res["seconds"] = round(time.time() - t0, 1)
        with open(out + ".tmp", "w", encoding="utf-8") as f:
            json.dump(res, f, ensure_ascii=False)
        os.replace(out + ".tmp", out)
        shutil.rmtree(work, ignore_errors=True)
        print("done", name, res["code"], res["seconds"], "s", flush=True)
    time.sleep(1)
print("runner: stopped")
