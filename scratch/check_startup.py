import subprocess
import time
import urllib.request
import json
import sys

proc = subprocess.Popen([
    r"c:\AI_GOV\backend\.venv\Scripts\python.exe",
    "-m", "uvicorn", "backend.app.main:app",
    "--host", "127.0.0.1", "--port", "8000"
], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

try:
    time.sleep(3)
    req = urllib.request.Request("http://127.0.0.1:8000/api/health", headers={"User-Agent": "ProbeClient"})
    with urllib.request.urlopen(req, timeout=5) as resp:
        data = json.loads(resp.read().decode())
        print("PROBE_SUCCESS:", json.dumps(data))
except Exception as e:
    print("PROBE_ERROR:", e)
    stdout, stderr = proc.communicate(timeout=2)
    print("STDOUT:", stdout.decode(errors="ignore"))
    print("STDERR:", stderr.decode(errors="ignore"))
    sys.exit(1)
finally:
    proc.terminate()
    proc.kill()
