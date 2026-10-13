#!/usr/bin/env python3
"""Build data/ticker.json from public sources. Stdlib only.

Ticker items:  GitHub search API, Hacker News (Algolia), TechCrunch AI and MIT Technology Review RSS.
AI flash:      the hottest AI story right now (Hacker News points decayed by age). It stays up
               until a different story overtakes it; "since" records when it took the top spot.
Voices:        news reports of what prominent AI and tech leaders said in the last 24 hours,
               from Google News RSS. The newest becomes the voice flash.
"""
from __future__ import annotations

import datetime as dt
import email.utils
import json
import os
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "data" / "ticker.json"
UA = {"User-Agent": "readsigil-ticker/2", "Accept": "application/vnd.github+json"}
TOK = os.environ.get("GITHUB_TOKEN")
MIN_STARS = 200

AIQ = re.compile(r"\b(AI|LLMs?|GPT|agents?|agentic|machine learning|ML|data|model|models|neural|OpenAI|Anthropic|"
                 r"Gemini|Claude|fintech|bank|banking|payments?|RBI|SEBI|privacy|analytics)\b", re.I)
AI_STRICT = re.compile(r"\b(AI|A\.I\.|artificial intelligence|LLMs?|GPT|ChatGPT|agents?|agentic|OpenAI|Anthropic|"
                       r"Gemini|Claude|Grok|xAI|DeepMind|Copilot|superintelligence|AGI|chips?|GPUs?|robots?|robotics|"
                       r"neural|machine learning|model|models)\b", re.I)
SAID = re.compile(r"\b(says?|said|warns?|predicts?|claims?|calls?|urges?|believes?|thinks?|argues?|reveals?|admits?|"
                  r"tells?|told|slams?|blasts?|praises?|responds?|posts?|posted|tweets?|tweeted|writes?|wrote|"
                  r"announces?|unveils?|vows?|insists?|questions?|dismisses?|doubles down|hits back)\b", re.I)

# Leaders whose public statements on AI move the conversation. Match = surname in the headline.
LEADERS = [
    ("Elon Musk", "Musk"), ("Sam Altman", "Altman"), ("Jensen Huang", "Huang"), ("Dario Amodei", "Amodei"),
    ("Demis Hassabis", "Hassabis"), ("Satya Nadella", "Nadella"), ("Sundar Pichai", "Pichai"),
    ("Mark Zuckerberg", "Zuckerberg"), ("Mustafa Suleyman", "Suleyman"), ("Yann LeCun", "LeCun"),
]


def get(url: str, gh: bool = False) -> bytes:
    h = dict(UA)
    if gh and TOK:
        h["Authorization"] = "Bearer " + TOK
    with urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=25) as r:
        return r.read()


def iso(t: dt.datetime) -> str:
    return t.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ------------------------------------------------------------------ parsing
def parse_rss(xml: bytes) -> list[dict]:
    """Items as {title, url, published (datetime|None), source}. Google News puts ' - Publisher' on titles."""
    out = []
    root = ET.fromstring(xml)
    for it in root.iter("item"):
        title = (it.findtext("title") or "").strip()
        link = (it.findtext("link") or "").strip()
        if not title or not link:
            continue
        src_el = it.find("source")
        source = (src_el.text or "").strip() if src_el is not None and src_el.text else ""
        if source and title.endswith(" - " + source):
            title = title[: -len(" - " + source)].strip()
        pub = None
        raw = it.findtext("pubDate")
        if raw:
            try:
                pub = email.utils.parsedate_to_datetime(raw)
                if pub.tzinfo is None:
                    pub = pub.replace(tzinfo=dt.timezone.utc)
            except (TypeError, ValueError):
                pub = None
        out.append({"title": title, "url": link, "published": pub, "source": source})
    return out


def heat(points: int, created: dt.datetime, now: dt.datetime) -> float:
    """Hacker News-style gravity: points decay with age, so a fresh story can overtake an old giant."""
    age_h = max((now - created).total_seconds() / 3600, 0)
    return (max(points, 1)) / (age_h + 2) ** 1.6


def pick_flash(hn_hits: list[dict], prev: dict | None, now: dt.datetime) -> dict | None:
    """Top AI story by heat. Keep 'since' from the previous run while the same story holds the top spot."""
    best, best_heat = None, -1.0
    for h in hn_hits:
        title = h.get("title") or ""
        if not AI_STRICT.search(title) or not h.get("created_at_i"):
            continue
        created = dt.datetime.fromtimestamp(int(h["created_at_i"]), dt.timezone.utc)
        if now - created > dt.timedelta(hours=36):
            continue
        hv = heat(int(h.get("points") or 0), created, now)
        if hv > best_heat:
            best_heat, best = hv, h
    if best is None:
        return prev  # nothing qualifies: the last flash stays up
    url = best.get("url") or f"https://news.ycombinator.com/item?id={best['objectID']}"
    flash = {
        "title": best["title"], "url": url, "source": "Hacker News",
        "discuss": f"https://news.ycombinator.com/item?id={best['objectID']}",
        "points": int(best.get("points") or 0), "comments": int(best.get("num_comments") or 0),
        "published": iso(dt.datetime.fromtimestamp(int(best["created_at_i"]), dt.timezone.utc)),
        "since": iso(now),
    }
    if prev and prev.get("url") == url:
        flash["since"] = prev.get("since", flash["since"])
    return flash


def pick_voices(feeds: dict[str, list[dict]], now: dt.datetime, max_age_h: int = 24) -> list[dict]:
    """One freshest qualifying statement per leader, newest first."""
    out, seen = [], set()
    for (person, surname) in LEADERS:
        for it in sorted(feeds.get(person, []), key=lambda x: x["published"] or now, reverse=True):
            t, pub = it["title"], it["published"]
            if not pub or now - pub > dt.timedelta(hours=max_age_h) or pub > now + dt.timedelta(minutes=10):
                continue
            if surname.lower() not in t.lower() or not AI_STRICT.search(t) or not SAID.search(t):
                continue
            key = re.sub(r"\W+", " ", t.lower()).strip()
            if key in seen:
                continue
            seen.add(key)
            out.append({"kind": "voice", "tag": "VOICE", "person": person, "title": t, "url": it["url"],
                        "source": it["source"] or "Google News", "published": iso(pub)})
            break
    out.sort(key=lambda v: v["published"], reverse=True)
    return out


# ------------------------------------------------------------------ network
def gh_repos(q: str, n: int) -> list[dict]:
    u = "https://api.github.com/search/repositories?" + urllib.parse.urlencode(
        {"q": q + f" stars:>={MIN_STARS}", "sort": "stars", "order": "desc", "per_page": n})
    return [{"kind": "repo", "title": r["full_name"], "stars": r["stargazers_count"],
             "note": (r.get("language") or "") + " · new this week", "url": r["html_url"], "source": "GitHub"}
            for r in json.loads(get(u, True))["items"]]


def gnews(person: str) -> list[dict]:
    q = urllib.parse.quote(f'"{person}" AI when:1d')
    return parse_rss(get(f"https://news.google.com/rss/search?q={q}&hl=en-IN&gl=IN&ceid=IN:en"))


def main() -> None:
    now = dt.datetime.now(dt.timezone.utc)
    since = (now - dt.timedelta(days=7)).date().isoformat()
    prev = {}
    if OUT.exists():
        try:
            prev = json.loads(OUT.read_text(encoding="utf-8"))
        except ValueError:
            prev = {}
    items, errors = [], []

    try:
        ai = gh_repos(f"created:>{since} topic:llm", 6) + gh_repos(f"created:>{since} topic:machine-learning", 4)
        seen = set()
        ai = [x for x in ai if not (x["title"] in seen or seen.add(x["title"]))]
        for x in ai:
            x["tag"], x["cat"] = "GH", "AI/ML"
        allr = [x for x in gh_repos(f"created:>{since}", 6) if x["title"] not in seen]
        for x in allr:
            x["tag"], x["cat"] = "GH", "Trending"
        items += ai[:8] + allr[:4]
    except Exception as e:  # noqa: BLE001 - one failed source must not sink the ticker
        errors.append("github:" + str(e))

    hn_all = []
    try:
        hn_all = json.loads(get("https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=60"))["hits"]
        hn = [h for h in hn_all if h.get("title") and AIQ.search(h["title"])][:8]
        items += [{"kind": "news", "tag": "HN", "points": h.get("points", 0), "title": h["title"], "source": "Hacker News",
                   "url": h.get("url") or f"https://news.ycombinator.com/item?id={h['objectID']}",
                   "discuss": f"https://news.ycombinator.com/item?id={h['objectID']}"} for h in hn]
    except Exception as e:  # noqa: BLE001
        errors.append("hn:" + str(e))

    for name, url, n in [("TechCrunch AI", "https://techcrunch.com/category/artificial-intelligence/feed/", 4),
                         ("MIT Technology Review", "https://www.technologyreview.com/topic/artificial-intelligence/feed", 3)]:
        try:
            for it in parse_rss(get(url))[:n]:
                items.append({"kind": "news", "tag": "AI", "title": it["title"], "source": name, "url": it["url"]})
        except Exception as e:  # noqa: BLE001
            errors.append(name + ":" + str(e))

    feeds = {}
    for person, _ in LEADERS:
        try:
            feeds[person] = gnews(person)
        except Exception as e:  # noqa: BLE001
            errors.append(f"gnews {person}:" + str(e))
    voices = pick_voices(feeds, now)

    flash = pick_flash(hn_all, prev.get("flash"), now)
    voice = voices[0] if voices else None
    if voice and prev.get("voice") and prev["voice"].get("url") == voice["url"]:
        voice["since"] = prev["voice"].get("since", iso(now))
    elif voice:
        voice["since"] = iso(now)

    out = {
        "generated_at": iso(now),
        "sources": [
            "GitHub search API (repos created in the last 7 days with at least 200 stars, by stars)",
            "Hacker News front page via Algolia API (AI/data/fintech keywords)",
            "TechCrunch AI RSS", "MIT Technology Review AI RSS",
            "Google News RSS: reports of statements on AI by named tech leaders, last 24 hours",
        ],
        "flash": flash,
        "voice": voice,
        "voices": voices,
        "items": voices[:3] + items,
        "errors": errors,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print(len(items), "items;", len(voices), "voices; flash:", (flash or {}).get("title"), "; errors:", errors)


if __name__ == "__main__":
    main()
