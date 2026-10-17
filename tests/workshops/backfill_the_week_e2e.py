"""Page test for Build Lab workshop 3 (the Airflow workshop runs in readsigil-data-stack;
this checks its ReadSigil page): layout at phone size, links, copy button, no errors."""
import os, sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE_URL", "https://localhost:8443").rstrip("/")
URL = BASE + "/build-lab/backfill-the-week/"
BROWSER = os.environ.get("BROWSER", "chromium")
SH = os.environ.get("SHOTS", "test-results"); os.makedirs(SH, exist_ok=True)
GHA = os.environ.get("GITHUB_ACTIONS") == "true"
res = []
def ok(c, m):
    print(("PASS " if c else "FAIL ") + m, flush=True); res.append(bool(c))
    if GHA and not c:
        print(f"::error title={BROWSER} workshop 3 page::{m}", flush=True)

with sync_playwright() as p:
    b = getattr(p, BROWSER).launch()
    dev = dict(p.devices["iPhone 13"] if BROWSER == "webkit" else {"viewport": {"width": 390, "height": 844}, "device_scale_factor": 2}, ignore_https_errors=True)
    ctx = b.new_context(**dev)
    if BROWSER == "chromium":
        ctx.grant_permissions(["clipboard-read", "clipboard-write"], origin=BASE)
    page = ctx.new_page()
    errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.on("console", lambda m: errs.append(m.text) if m.type == "error" and "badge.svg" not in m.text and "visitor-badge" not in m.text and "net::" not in m.text else None)
    page.goto(URL); page.wait_for_load_state("load")
    ok(page.locator("h1").inner_text().startswith("Backfill the week"), "headline")
    ok(not page.evaluate("document.documentElement.scrollWidth > innerWidth"), "no sideways scroll at phone width")
    ok(page.get_by_role("link", name="Open in GitHub Codespaces").get_attribute("href") == "https://codespaces.new/shashwat-kumar/readsigil-data-stack", "Codespaces link")
    ok(page.get_by_role("link", name="Read the workshop guide").get_attribute("href").endswith("/tree/main/workshops/03-airflow"), "guide link")
    ok(page.locator('a[href="/build-lab/close-the-books/"]').count() == 1 and page.locator('a[href="/build-lab/post-once/"]').count() == 1, "links back to workshops 1 and 2")
    page.click("[data-copy=cmd-local]")
    page.wait_for_timeout(300)
    label = page.locator("[data-copy=cmd-local]").inner_text()
    ok(label in ("Copied", "Selected"), f"copy button responds ({label})")
    if BROWSER == "chromium" and label == "Copied":
        ok(page.evaluate("navigator.clipboard.readText()").startswith("git clone https://github.com/shashwat-kumar/readsigil-data-stack"), "copied the clone command")
    page.screenshot(path=f"{SH}/{BROWSER}-ws3-top.png")
    d = b.new_context(**dev, color_scheme="dark").new_page(); d.goto(URL); d.screenshot(path=f"{SH}/{BROWSER}-ws3-dark.png", full_page=True)
    ok(not errs, "no page errors " + "; ".join(errs[:3]))
    b.close()
summary = f"[{BROWSER}] workshop 3 page: " + (f"ALL {len(res)} CHECKS PASS" if all(res) else f"{res.count(False)} of {len(res)} FAILED")
print(summary)
if GHA:
    print("::notice title=Workshop 3 page::" + summary)
sys.exit(0 if all(res) else 1)
