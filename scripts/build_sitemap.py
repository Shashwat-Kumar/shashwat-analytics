"""Rebuild sitemap.xml from the HTML pages in this repo. Stdlib only.

Includes every page that search engines should index and skips:
  - 404.html
  - pages with <meta name="robots" content="noindex...">
  - redirect stubs (<meta http-equiv="refresh">)

The URL comes from each page's <link rel="canonical">, and <lastmod> is the
date of the last commit that touched the file, so the sitemap reports real
change dates. Needs full git history: run it locally, not in a shallow CI
checkout (where every file would get the checkout date).

Usage: python3 scripts/build_sitemap.py
"""
import re
import subprocess
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
BASE = "https://readsigil.com/"


def git(*args: str) -> str:
    return subprocess.run(["git", "-C", str(SITE), *args], capture_output=True, text=True, check=True).stdout


def lastmod(rel: str) -> str | None:
    return git("log", "-1", "--format=%ad", "--date=short", "--", rel).strip() or None


def main() -> None:
    if git("rev-parse", "--is-shallow-repository").strip() == "true":
        raise SystemExit("Shallow clone: lastmod dates would be wrong. Run `git fetch --unshallow` first.")
    entries = []
    for rel in sorted(git("ls-files", "*.html").split()):
        if rel == "404.html":
            continue
        s = (SITE / rel).read_text(encoding="utf-8", errors="ignore")
        head = s[: s.find("</head>")] if "</head>" in s else s[:5000]
        if re.search(r'<meta\s+name="robots"\s+content="[^"]*noindex', head, re.I):
            continue
        if re.search(r'http-equiv="refresh"', head, re.I):
            continue
        m = re.search(r'<link rel="canonical" href="([^"]+)"', head)
        loc = m.group(1) if m else BASE + (rel[: -len("index.html")] if rel.endswith("index.html") else rel)
        if not loc.startswith(BASE):
            continue
        entries.append((loc, lastmod(rel)))

    # home first, then by path
    entries.sort(key=lambda e: (e[0] != BASE, e[0]))
    rows = "".join(
        f"<url><loc>{loc}</loc>" + (f"<lastmod>{lm}</lastmod>" if lm else "") + "</url>\n" for loc, lm in entries
    )
    (SITE / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + rows + "</urlset>\n",
        encoding="utf-8",
    )
    print(f"sitemap.xml: {len(entries)} URLs")


if __name__ == "__main__":
    main()
