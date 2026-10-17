"""Start the workshop's in-browser engines repeatedly in fresh pages and count failures.
Used to measure engine reliability per browser; not part of the pass/fail suite."""
import os, sys, time
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE_URL", "https://localhost:8443").rstrip("/")
URL = BASE + "/build-lab/close-the-books/"
BROWSER = os.environ.get("BROWSER", "webkit")
N = int(os.environ.get("ROUNDS", "10"))
results = {"pg": [], "duck": []}
with sync_playwright() as p:
    b = getattr(p, BROWSER).launch()
    dev = dict(p.devices["iPhone 13"] if BROWSER == "webkit" else {"viewport": {"width": 390, "height": 844}}, ignore_https_errors=True)
    for eng, path, sql in [("pg", "a", "SELECT COUNT(*) FROM ledger_postings;"), ("duck", "b", "SELECT COUNT(*) FROM npci_raw;")]:
        for i in range(N):
            ctx = b.new_context(**dev); page = ctx.new_page()
            crashed = []
            page.on("crash", lambda *_: crashed.append(True))
            t0 = time.time(); status = "ok"
            try:
                page.goto(URL); page.locator(f"#path-{path}").click()
                t = page.locator(f"#inv-{path}"); t.locator("textarea").fill(sql); t.locator(".run").click()
                t.locator(".out table, .out .err").first.wait_for(timeout=150000)
                if t.locator(".out .err").count():
                    status = "error: " + t.locator(".out .err").inner_text()[:120]
                elif "restarted" in t.locator(".out").inner_text():
                    status = "ok after engine restart"
            except Exception as e:
                status = ("page crashed" if crashed else "failed: " + str(e).splitlines()[0][:120])
            results[eng].append((status, round(time.time() - t0, 1)))
            print(f"{eng} round {i + 1}: {status} in {results[eng][-1][1]}s", flush=True)
            try:
                ctx.close()
            except Exception:
                pass
    b.close()
for eng, rs in results.items():
    good = sum(1 for s, _ in rs if s.startswith("ok"))
    line = f"[{BROWSER}] {eng}: {good}/{len(rs)} started and answered; " + ", ".join(sorted({s for s, _ in rs if not s.startswith('ok')})) 
    print(line)
    if os.environ.get("GITHUB_ACTIONS") == "true":
        print(f"::notice title=engine stress {BROWSER} {eng}::{line} | times: {[t for _, t in rs]}")
