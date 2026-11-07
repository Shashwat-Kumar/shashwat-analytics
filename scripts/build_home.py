#!/usr/bin/env python3
"""Refresh the "New on ReadSigil" block on the homepage.

Reads the newest entries from feed.xml and the newest Agora debate from
agora/data/index.json, then rewrites the region of index.html between
<!--home-latest:start--> and <!--home-latest:end-->. The block is plain HTML,
so readers without JavaScript and search engines see the same content.

The "Latest" date shown is the date of the newest item, never the build time,
so the page does not claim freshness it does not have. Stdlib only.

Usage: python scripts/build_home.py [--check]
  --check  exit 1 if index.html would change (for CI), without writing.
"""
from __future__ import annotations

import html
import json
import re
import sys
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
INDEX = SITE / "index.html"
FEED = SITE / "feed.xml"
AGORA = SITE / "agora" / "data" / "index.json"
BASE = "https://readsigil.com/"
START, END = "<!--home-latest:start-->", "<!--home-latest:end-->"
NS = {"a": "http://www.w3.org/2005/Atom"}
N_FEED = 4

KIND_BY_PATH = [("essays/", "Essay"), ("magazine/", "The Signal"), ("insights/", "Field note"),
                ("cases/", "Case"), ("agora/", "Agora debate"), ("claude-x-chatgpt/", "Claude × ChatGPT")]


def rel(url: str) -> str:
    return url[len(BASE):] if url.startswith(BASE) else url


def kind_for(url: str, category: str | None) -> str:
    path = rel(url)
    for prefix, label in KIND_BY_PATH:
        if path.startswith(prefix):
            return f"{label} · {category}" if category else label
    return category or "Update"


def short_date(dt: datetime) -> str:
    return f"{dt.day} {dt.strftime('%b')}"


def feed_items() -> list[dict]:
    root = ET.parse(FEED).getroot()
    items = []
    for e in root.findall("a:entry", NS):
        link = e.find("a:link", NS)
        when = e.find("a:updated", NS)
        title = e.find("a:title", NS)
        if link is None or when is None or title is None:
            continue
        cat = e.find("a:category", NS)
        url = link.get("href", "")
        items.append({
            "title": (title.text or "").strip(),
            "url": url,
            "when": datetime.fromisoformat(when.text.strip()),
            "kind": kind_for(url, cat.get("term") if cat is not None else None),
        })
    items.sort(key=lambda i: i["when"], reverse=True)
    return items[:N_FEED]


def agora_item() -> dict | None:
    if not AGORA.exists():
        return None
    threads = json.loads(AGORA.read_text(encoding="utf-8"))
    for t in threads:
        if t.get("seed"):
            continue
        m = re.search(r"(\d{4}-\d{2}-\d{2})$", t.get("id", ""))
        return {"title": t["title"], "url": t["url"], "kind": f"Agora debate · {t.get('turns', 0)} turns",
                "when": datetime.fromisoformat(m.group(1)) if m else None}
    return None


def render() -> str:
    items = feed_items()
    latest = items[0]["when"] if items else None
    rows = []
    for i in items:
        rows.append(
            f'<li><time datetime="{i["when"].date().isoformat()}">{short_date(i["when"])}</time>'
            f'<div><span class="kind">{html.escape(i["kind"])}</span>'
            f'<a href="{html.escape(rel(i["url"]))}">{html.escape(i["title"])}</a></div></li>'
        )
    ag = agora_item()
    if ag:
        stamp = (f'<time datetime="{ag["when"].date().isoformat()}">{short_date(ag["when"])}</time>'
                 if ag["when"] else "<time>Ongoing</time>")
        rows.append(f'<li>{stamp}<div><span class="kind">{html.escape(ag["kind"])}</span>'
                    f'<a href="{html.escape(rel(ag["url"]))}">{html.escape(ag["title"])}</a></div></li>')
    head = "New on ReadSigil"
    if latest:
        head += f' · <time datetime="{latest.date().isoformat()}">Latest {latest.day} {latest.strftime("%B %Y")}</time>'
    return (f'<section class="wrap narrow rs-new" aria-label="New on ReadSigil">'
            f'<h2 class="sec">{head}</h2><ul class="rs-new-list">{"".join(rows)}</ul>'
            f'<p class="more"><a href="writing.html">All writing →</a> &nbsp; <a href="magazine.html">The Signal →</a>'
            f' &nbsp; <a href="agora/index.html">Agora →</a> &nbsp; <a href="feed.xml">RSS</a></p></section>')


def main() -> int:
    page = INDEX.read_text(encoding="utf-8")
    if START not in page or END not in page:
        print("Markers missing from index.html", file=sys.stderr)
        return 2
    a, b = page.index(START) + len(START), page.index(END)
    new = page[:a] + render() + page[b:]
    if new == page:
        print("Homepage already current.")
        return 0
    if "--check" in sys.argv:
        print("Homepage block is out of date.")
        return 1
    INDEX.write_text(new, encoding="utf-8")
    print("Homepage block refreshed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
