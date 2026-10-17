"""End-to-end test for Build Lab workshop 1, "The numbers match. The money doesn't."
Runs the whole workshop in a real browser against the static site: both engines, every
investigation, the maker-checker flow, the correction job and its retry, reset and failure states.

  python -m http.server 8000 &   (from the repo root)
  BASE_URL=http://localhost:8000 BROWSER=chromium python tests/workshops/close_the_books_e2e.py
"""
import os, sys, json, time, re
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE_URL", "http://localhost:8000").rstrip("/")
ART = SITE = BASE + "/build-lab/close-the-books/"
BROWSER = os.environ.get("BROWSER", "chromium")
SH = os.environ.get("SHOTS", "test-results")
os.makedirs(SH, exist_ok=True)
res = []
def ok(c, m):
    print(("PASS " if c else "FAIL ") + m, flush=True); res.append(bool(c))
one = lambda s: re.sub(r"\s+", " ", s)[:120]

def block_fonts(page):
    page.route("https://fonts.googleapis.com/**", lambda r: r.abort())
    page.route("https://fonts.gstatic.com/**", lambda r: r.abort())

with sync_playwright() as p:
    bt = getattr(p, BROWSER); b = bt.launch()
    MOBILE = p.devices["iPhone 13"] if BROWSER == "webkit" else {"viewport": {"width": 390, "height": 844}, "device_scale_factor": 2}
    ctx = b.new_context(**MOBILE)
    page = ctx.new_page(); block_fonts(page)
    errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.on("console", lambda m: errs.append(m.text) if m.type == "error" and "fonts" not in m.text and "ERR_FAILED" not in m.text and "net::" not in m.text else None)
    page.goto(ART); page.wait_for_load_state("domcontentloaded")
    page.screenshot(path=f"{SH}/{BROWSER}-top.png")
    ok(page.locator("#evGap").inner_text() == "₹61,250.00", "evidence shows ₹61,250.00 difference")
    ok(page.locator("#invs .inv:visible").count() == 0 and page.locator("#correct").is_hidden(), "no consoles or corrections shown before the reader chooses")
    ok(not page.evaluate("document.documentElement.scrollWidth > innerWidth"), "no sideways scroll at 390px")
    S = page.evaluate("window.__ws.S")

    def check(sel, sql, wait=120000):
        t = page.locator(sel)
        t.locator("textarea").first.fill(sql)
        t.locator(".fbw").first.evaluate("e => e.innerHTML = ''")
        t.locator(".chk").first.click()
        page.locator(f"{sel} .fbw .fb, {sel} .out .err").first.wait_for(timeout=wait)
        txt = t.locator(".fbw").first.inner_text().strip() or t.locator(".out").first.inner_text()
        return one(txt)

    # Start with C (order is free), including the two-leg trap
    page.locator("#path-c").click()
    t0 = time.time()
    r = check("#inv-c", "SELECT txn_ref FROM ledger_postings WHERE channel='UPI' AND value_date='2026-10-16' GROUP BY txn_ref HAVING COUNT(*) > 1;")
    print("  postgres cold start + query", round(time.time() - t0, 1), "s")
    ok(r.startswith("Every transaction"), "C two-leg trap explained: " + r)
    r = check("#inv-c", S["dups"]["byleg"]); ok(r.startswith("Found it"), "C accepts GROUP BY txn_ref, leg: " + r)
    r = check("#inv-c", S["dups"]["over2"]); ok(r.startswith("Found it"), "C accepts HAVING COUNT(*) > 2")
    ok("₹12,750.00 of ₹61,250.00" in page.locator("#regSum").inner_text(), "register: 12,750 of 61,250 explained")
    ok(page.locator("#tracker").is_visible() and "₹48,500.00" in page.locator("#trkAmt").inner_text(), "tracker shows ₹48,500.00 unexplained")

    page.locator("#path-b").click()
    t0 = time.time()
    r = check("#inv-b", "SELECT n.rrn FROM npci_raw n LEFT JOIN ledger_extract l ON l.txn_ref = n.rrn;")
    print("  duckdb cold start + query", round(time.time() - t0, 1), "s")
    ok(r.startswith("Not yet") or r.startswith("Nearly"), "B wrong join gets guidance: " + r)
    for k in ["notexists", "anti", "except", "leftjoin"]:
        r = check("#inv-b", S["unmatched"][k]); ok(r.startswith("Found one"), f"B accepts {k}")
    ok(page.locator("#correct").is_visible(), "corrections open once ₹61,250 is explained")

    page.locator("#path-a").click()
    r = check("#inv-a", "SELECT SUM(CASE WHEN dr_cr='DR' THEN amount ELSE 0 END), SUM(CASE WHEN dr_cr='CR' THEN amount ELSE 0 END) FROM ledger_postings;")
    ok(r.startswith("Balanced, but"), "A unfiltered totals flagged: " + r)
    r = check("#inv-a", S["balance"]); ok(r.startswith("The ledger balances"), "A solution: " + r)

    # Persistence across reload
    page.reload(); page.wait_for_load_state("domcontentloaded")
    ok(page.locator("#correct").is_visible() and page.locator("#path-b .st").inner_text() == "DONE", "progress survives reload")
    ok(page.locator("#sql-a").input_value().startswith("SELECT SUM(CASE WHEN dr_cr = 'DR'"), "SQL drafts survive reload")

    A = page.evaluate("window.__ws.A")
    def raise_(typ, rrn, acct, d, amt, reason="Confirmed against NPCI raw file and ledger"):
        page.select_option("#fType", typ); page.fill("#fRrn", rrn); page.fill("#fAcct", acct); page.select_option("#fDir", d); page.fill("#fAmt", amt); page.fill("#fReason", reason)
        page.evaluate("document.querySelector('#reqFb').innerHTML=''")
        page.click("#fSend"); page.locator("#reqFb .fb, #reqFb .err").first.wait_for(timeout=120000)
        return one(page.locator("#reqFb").inner_text())
    m, dp = A["missing"], A["dup"]
    r = raise_("UNPOSTED_CREDIT", m["rrn"], m["account_id"], "CR", "48,500", reason="short"); ok("reason" in r, "form asks for a fileable reason: " + r)
    r = raise_("UNPOSTED_CREDIT", m["rrn"], m["account_id"], "CR", "48,000"); ok("rejected" in r and "amount" in r, "checker rejects wrong amount: " + r)
    r = raise_("UNPOSTED_CREDIT", m["rrn"], m["account_id"], "CR", "48,500.00"); ok("approved" in r, "checker approves the unposted credit: " + r)
    r = raise_("UNPOSTED_CREDIT", m["rrn"], m["account_id"], "CR", "48500"); ok("Already approved" in r, "second request for same RRN not raised: " + r)
    r = raise_("DUPLICATE_DEBIT", dp["rrn"], dp["account_id"], "DR", "12750"); ok("rejected" in r and "reverses" in r, "checker rejects a debit as reversal: " + r)
    r = raise_("DUPLICATE_DEBIT", "628900479809", "HB100001", "CR", "854"); ok("nothing to correct" in r, "checker rejects a matched RRN: " + r)
    r = raise_("DUPLICATE_DEBIT", dp["rrn"], dp["account_id"].lower(), "CR", "₹12,750.00"); ok("approved" in r, "checker approves the reversal: " + r)
    ok(page.locator("#jobBody").is_visible(), "correction job opens after both approvals")

    J = "#step-e"
    r = check(J, S["jobStarter"]); ok("posted" in r and "REJECTED".lower() in r.lower(), "starter job posts rejected requests, caught: " + r)
    approved_only = S["jobStarter"] + "\nWHERE r.status = 'APPROVED';"
    approved_only = approved_only.replace("FROM correction_requests r;\nWHERE", "FROM correction_requests r\nWHERE")
    r = check(J, approved_only); ok("only one side" in r, "single-leg job caught: " + r)
    unguarded = re.sub(r"\n  AND NOT EXISTS \([\s\S]*?\);", ";", S["job"]["notexists"])
    r = check(J, unguarded); ok("Retry:" in r, "unguarded job fails on retry: " + r)
    r = check(J, "DELETE FROM ledger_postings WHERE txn_ref = '%s';" % dp["rrn"]); ok("deleted" in r, "deletes refused: " + r)
    r = check(J, "UPDATE ledger_postings SET amount = 0 WHERE txn_ref = '%s';" % dp["rrn"]); ok("changed" in r, "edits refused: " + r)
    for k in ["onconflict", "merge", "notexists"]:
        r = check(J, S["job"][k]); ok(r.startswith("Books agree"), f"job accepted via {k}: " + r)
    ok(page.locator("#debrief").is_visible() and "Books closed" in page.locator("#debrief").inner_text(), "debrief appears after the job passes")
    ok(page.locator("#tracker").is_hidden(), "tracker hidden after completion")
    dbt = page.locator("#debrief").inner_text()
    ok("2 approved, 3 rejected" in dbt, "debrief records rejections honestly")
    page.locator("#debrief").scroll_into_view_if_needed(); page.screenshot(path=f"{SH}/{BROWSER}-debrief.png")
    page.locator("#step-d").scroll_into_view_if_needed(); page.screenshot(path=f"{SH}/{BROWSER}-form.png")

    page.click("#resetData"); page.wait_for_timeout(1500)
    ok(page.locator("#debrief").is_hidden() and page.locator("#jobBody").is_visible(), "reset ledger: debrief cleared, approvals kept")
    page.click("#resetAll"); page.wait_for_timeout(1500)
    ok(page.locator("#correct").is_hidden() and page.locator("#register").is_hidden() and page.locator("#invs .inv:visible").count() == 0, "start over clears everything")
    ok(page.locator("#sql-c").input_value().startswith("SELECT txn_ref, COUNT(*)"), "start over restores starter SQL")
    ok(not errs, "no page errors " + json.dumps(errs[:3]))

    # Engine download failure, then recovery
    c2 = b.new_context(**MOBILE); p2 = c2.new_page(); block_fonts(p2)
    p2.route("**/assets/engines/duckdb-eh.wasm", lambda r: r.fulfill(status=503, body="down"))
    p2.goto(ART); p2.locator("#path-b").click(); p2.locator("#inv-b .run").click()
    p2.locator("#inv-b .out .err").wait_for(timeout=30000)
    ok("HTTP 503" in p2.locator("#inv-b .out").inner_text(), "download failure shows a clear error: " + one(p2.locator("#inv-b .out").inner_text()))
    p2.unroute("**/assets/engines/duckdb-eh.wasm"); p2.locator("#inv-b .run").click()
    p2.locator("#inv-b .out table").wait_for(timeout=60000)
    ok(True, "engine recovers on the next run")
    p2.screenshot(path=f"{SH}/{BROWSER}-paths.png")

    # Dark and desktop
    c3 = b.new_context(**MOBILE, color_scheme="dark"); p3 = c3.new_page(); block_fonts(p3)
    p3.goto(ART); p3.locator("#path-a").click(); p3.wait_for_timeout(300); p3.screenshot(path=f"{SH}/{BROWSER}-dark.png")
    c4 = b.new_context(viewport={"width": 1280, "height": 900}); p4 = c4.new_page(); block_fonts(p4)
    p4.goto(ART); p4.screenshot(path=f"{SH}/{BROWSER}-desktop.png", full_page=True)

    # ReadSigil build under its strict CSP
    c5 = b.new_context(**MOBILE); p5 = c5.new_page()
    csp = []
    p5.on("console", lambda m: csp.append(m.text) if m.type == "error" else None)
    p5.on("pageerror", lambda e: csp.append(str(e)))
    p5.goto(SITE); p5.locator("#path-a").click(); p5.locator("#inv-a .run").click(); p5.locator("#inv-a .out table").wait_for(timeout=120000)
    p5.locator("#path-b").click(); p5.locator("#inv-b .run").click(); p5.locator("#inv-b .out table").wait_for(timeout=120000)
    bad = [e for e in csp if "Content Security Policy" in e or "Refused" in e or "TypeError" in e]
    ok(not bad, "site build runs both engines under its CSP " + json.dumps(bad[:2]))
    p5.screenshot(path=f"{SH}/{BROWSER}-site.png", full_page=False)
    b.close()
print(f"[{BROWSER}] " + ("ALL PASS" if all(res) else f"{res.count(False)} FAILED"))
sys.exit(0 if all(res) else 1)
