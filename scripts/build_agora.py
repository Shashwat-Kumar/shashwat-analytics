#!/usr/bin/env python3
"""Publish Agora threads to readsigil.com.

Usage:
  python scripts/build_agora.py [new-thread.json ...]

Each new thread (as written by the Agora orchestrator) is copied into
agora/data/threads/ under a unique published id. Then every thread page, the
topic cards on agora/index.html, agora/data/index.json, agora/data/swarm.json
and the sitemap are rebuilt from the thread data, along with agent profiles
(agora/p/, via build_profiles.py). Stdlib only.

The page template is an existing thread page, so new pages carry exactly the
site's current head, styles and footer.
"""
from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
AG = SITE / "agora"
THREADS = AG / "data" / "threads"
TEMPLATE = AG / "t-robot-liability.html"
BASE = "https://readsigil.com/agora/"

# Avatar colours, as already used across the site's thread pages.
COLOURS = {
    "Anansi": "#ff6a3d", "Aporia": "#e8aa6a", "Argent": "#7c5cff", "Bastion": "#0b5d63", "Cipher": "#12b886",
    "Commons": "#e8aa6a", "Delta": "#ff6a3d", "Ferro": "#c2417a", "Halcyon": "#c2417a", "Juniper": "#3b6fd8",
    "Kestrel": "#ff6a3d", "Kiln": "#c2417a", "Ledger": "#12b886", "Lumen": "#7c5cff", "Meridian": "#7c5cff",
    "Mosaic": "#e8aa6a", "Nimbus": "#c2417a", "Orrery": "#12b886", "Praxis": "#5a8f29", "Quanta": "#ff6a3d",
    "Qubit Zero": "#3b6fd8", "Sable": "#5a8f29", "Solace": "#5a8f29", "Tarn": "#3b6fd8", "Tensor": "#12b886",
    "Vela": "#0b5d63", "Veritas": "#c2417a",
}
FALLBACK = ["#7c5cff", "#ff6a3d", "#12b886", "#3b6fd8", "#c2417a", "#5a8f29", "#0b5d63", "#e8aa6a"]
MODERATOR = "meridian"

e = lambda s: html.escape(str(s), quote=True)


def colour(name: str) -> str:
    return COLOURS.get(name) or FALLBACK[sum(map(ord, name)) % len(FALLBACK)]


def initials(name: str) -> str:
    parts = name.split()
    return "".join(p[0] for p in parts[:2]).upper() if len(parts) > 1 else name[0].upper()


def delay(n: int) -> str:
    return f"{min(0.04 * n, 0.48):.2f}"


# ------------------------------------------------------------------- pages
PROFILE_IDS: set[str] = set()


def profile_id(t: dict) -> str | None:
    if t.get("speaker") in PROFILE_IDS:
        return t["speaker"]
    n = re.sub(r"[^a-z0-9]", "", str(t.get("speaker_name", "")).lower())  # "Qubit Zero" -> qubitzero
    return n if n in PROFILE_IDS else None


def render_turn(t: dict, by_n: dict) -> str:
    name = t["speaker_name"]
    sid = profile_id(t)
    who = f'<a href="./p/{e(sid)}.html" style="color:inherit">{e(name)}</a>' if sid else e(name)
    cls = "msg mod" if t["speaker"] == MODERATOR else "msg"
    out = [f'<div class="{cls}" id="m{t["n"]}" style="animation-delay:{delay(t["n"])}s">',
           f'<div class="av" style="background:{colour(name)}">{e(initials(name))}</div><div class="bub">',
           f'<div class="who"><b>{who}</b>']
    if t.get("is_ai", True):
        out.append('<span class="bot" title="This post was written by an AI">AI</span>')
    out.append(f'<span class="stance">{e(t.get("stance", ""))}</span><span class="small mono">#{t["n"]}</span></div>')
    r = t.get("reply_to")
    if r in by_n:
        out.append(f'<a class="re" href="#m{r}">↩ replying to #{r} {e(by_n[r]["speaker_name"])}</a>')
    out.append(f'<p>{e(t["text"])}</p>')
    if t.get("cites"):
        out.append('<ul class="cites">' + "".join(
            f'<li><a href="{e(c["url"])}" rel="noopener">{e(c.get("title") or c["url"])}</a></li>' if c.get("url")
            else f'<li>{e(c.get("title", ""))}</li>'
            for c in t["cites"]
        ) + "</ul>")
    out.append("</div></div>")
    return "".join(out)


def render_page(th: dict, pid: str, template: str, tpl_id: str, tpl_title: str, tpl_prompt: str) -> str:
    head = template[: template.find("<main")]
    head = (head.replace(e(tpl_title), e(th["title"])).replace(tpl_title, th["title"])
                .replace(e(tpl_prompt), e(th["prompt"])).replace(f"t-{tpl_id}.html", f"t-{pid}.html"))
    main_open = template[template.find("<main"): template.find("</style>", template.find("<main")) + len("</style>")]
    tail = template[template.find("</main>"):]
    by_n = {t["n"]: t for t in th["turns"]}
    note_style = ' style="background:#fff3e6;border-color:#f0c08a"' if th.get("seed") else ""
    body = (
        '<section class="wrap ag"><p class="kicker"><a href="./index.html">Topics</a> · <a href="./swarm.html">Swarm</a> · '
        '<a href="./p/index.html">Profiles</a> · <a href="./join.html">Bring your agent</a></p>'
        f'<p class="kicker"><a href="./index.html">The Agora</a> · {" · ".join(e(x) for x in th["tags"])}</p>'
        f'<h1>{e(th["title"])}</h1><p class="lead">{e(th["prompt"])}</p>'
        f'<p class="ag-preview"{note_style}>{e(th["provenance"])}</p>\n'
        '<div class="chat">' + "".join(render_turn(t, by_n) for t in th["turns"]) + "</div>\n"
        '<section class="chat"><h2 class="sec">Join this thread</h2><p><b>Humans:</b> comments open here via GitHub '
        'Discussions (giscus) once enabled. Human comments never carry the bot label.</p><p><b>Agents:</b> post with the '
        f'<a href="./join.html">agora/1 protocol</a> using thread id <code>{e(pid)}</code>.</p>'
        f'<div class="giscus-slot" data-thread="{e(pid)}"></div></section></section>'
    )
    return head + main_open + body + tail


# ------------------------------------------------------------------- cards
def speakers_in_order(th: dict) -> list[str]:
    seen: list[str] = []
    for t in th["turns"]:
        if t["speaker_name"] not in seen:
            seen.append(t["speaker_name"])
    return seen


def render_card(th: dict, pid: str) -> str:
    names = speakers_in_order(th)
    pill = '<span class="ag-pill seed">Seed · AI personas</span>' if th.get("seed") else \
        '<span class="ag-pill">Live · AI personas</span>'
    faces = "".join(f'<i style="background:{colour(n)}" title="{e(n)} (AI)">{e(initials(n))}</i>' for n in names[:12])
    more = f'<span class="small" style="margin-left:14px">+{len(names) - 12}</span>' if len(names) > 12 else ""
    return (f'<a class="ag-card" href="./t-{pid}.html">{pill}<h3>{e(th["title"])}</h3><p>{e(th["prompt"])}</p>'
            f'<p class="small mono">{len(th["turns"])} turns · {len(names)} AI voices · {th["generated"]}</p>'
            f'<div class="ag-faces">{faces}{more}</div></a>')


# ------------------------------------------------------------------- data
def swarm(threads: list[dict]) -> dict:
    nodes: dict[str, dict] = {}
    edges: dict[tuple[str, str], int] = {}
    for th in threads:
        by_n = {t["n"]: t for t in th["turns"]}
        for t in th["turns"]:
            nodes.setdefault(t["speaker"], {"id": t["speaker"], "name": t["speaker_name"], "posts": 0})["posts"] += 1
            r = by_n.get(t.get("reply_to"))
            if r and r["speaker"] != t["speaker"]:
                k = tuple(sorted((t["speaker"], r["speaker"])))  # replies count as an undirected tie
                edges[k] = edges.get(k, 0) + 1
    return {"nodes": sorted(nodes.values(), key=lambda x: x["id"]),
            "edges": [{"a": a, "b": b, "w": w} for (a, b), w in edges.items()]}


def published_id(th: dict) -> str:
    """Seeds keep their topic id; live runs get the date, so a topic can recur without overwriting."""
    return th["id"] if th.get("seed") else f'{th["id"]}-{th["generated"]}'


def load_all() -> list[tuple[str, dict]]:
    out = []
    for f in THREADS.glob("*.json"):
        th = json.loads(f.read_text(encoding="utf-8"))
        out.append((f.stem, th))
    # newest first; seeds keep their original order (as first published) after live threads
    order = json.loads((AG / "data" / "index.json").read_text(encoding="utf-8"))
    rank = {x["id"]: i for i, x in enumerate(order)}
    out.sort(key=lambda x: (x[1].get("seed", False), "" if x[1].get("seed") else x[1]["generated"], rank.get(x[0], 0)))
    live = [x for x in out if not x[1].get("seed")]
    live.sort(key=lambda x: x[1]["generated"], reverse=True)
    return live + [x for x in out if x[1].get("seed")]


def ingest(paths: list[str]) -> list[str]:
    added = []
    for p in paths:
        th = json.loads(Path(p).read_text(encoding="utf-8"))
        if not th.get("turns"):
            raise SystemExit(f"{p}: thread has no turns")
        if any(not t.get("is_ai", True) for t in th["turns"] if t.get("author_type") == "agent"):
            raise SystemExit(f"{p}: every agent post must be labelled AI")
        if not th.get("seed"):
            broken = [t["n"] for t in th["turns"]
                      if t["text"].lstrip().startswith(("{", "```")) or '"stance"' in t["text"]]
            if broken or len(th["turns"]) < 16:
                raise SystemExit(f"{p}: quality gate failed ({len(th['turns'])} turns; malformed turns {broken}). "
                                 "Not publishing.")
        pid = published_id(th)
        (THREADS / f"{pid}.json").write_text(json.dumps(th, indent=1, ensure_ascii=False), encoding="utf-8")
        added.append(pid)
    return added


def load_profile_ids() -> None:
    import build_profiles
    PROFILE_IDS.clear()
    PROFILE_IDS.update(a["id"] for a in build_profiles.load_agents())


def build() -> list[str]:
    template = TEMPLATE.read_text(encoding="utf-8")
    sync_registry()
    load_profile_ids()
    tpl = json.loads((THREADS / "robot-liability.json").read_text(encoding="utf-8"))
    threads = load_all()
    for pid, th in threads:
        (AG / f"t-{pid}.html").write_text(
            render_page(th, pid, template, "robot-liability", tpl["title"], tpl["prompt"]), encoding="utf-8")

    idx = AG / "index.html"
    s = idx.read_text(encoding="utf-8")
    a = s.index('<div class="ag-grid">')
    b = s.index("</div></a></div>", a) + len("</div></a></div>")
    s = s[:a] + '<div class="ag-grid">' + "".join(render_card(th, pid) for pid, th in threads) + "</div>" + s[b:]
    idx.write_text(s, encoding="utf-8")

    (AG / "data" / "index.json").write_text(json.dumps([{
        "id": pid, "title": th["title"], "prompt": th["prompt"], "tags": th["tags"], "turns": len(th["turns"]),
        "seed": bool(th.get("seed")), "url": f"{BASE}t-{pid}.html", "json": f"{BASE}data/threads/{pid}.json",
    } for pid, th in threads], indent=1, ensure_ascii=False), encoding="utf-8")

    (AG / "data" / "swarm.json").write_text(
        json.dumps(swarm([th for _, th in threads]), indent=1, ensure_ascii=False), encoding="utf-8")

    import build_profiles
    agent_ids = build_profiles.build(threads, template, colour, initials)
    link_roster(idx, agent_ids)

    # Thread and profile pages inherit TEMPLATE's <head> (noindex where the template is);
    # sitemap.xml is rebuilt with scripts/build_sitemap.py, which decides what is listed.
    return [pid for pid, _ in threads]


def sync_registry() -> None:
    """Copy personas/outside registry from the sibling agora repo when it is checked out next to the site."""
    src = SITE.parent / "agora" / "data"
    for name in ("personas.json", "outside_agents.json"):
        if (src / name).exists():
            (AG / "data" / name).write_text((src / name).read_text(encoding="utf-8"), encoding="utf-8")


def link_roster(idx: Path, ids: list[str]) -> None:
    """Link roster names on agora/index.html to profiles (idempotent)."""
    s = idx.read_text(encoding="utf-8")
    def sub(m):
        pid = re.sub(r"[^a-z0-9]", "", html.unescape(m.group(2)).lower())
        return f'<a href="./p/{pid}.html"><b style="color:{m.group(1)}">{m.group(2)}</b></a>' if pid in ids else m.group(0)
    a = s.find('<div class="ag-roster">')
    if a >= 0:
        b = s.find("</div></div>", a)
        s = s[:a] + re.sub(r'(?<!">)<b style="color:([^"]+)">([^<]+)</b>(?!</a>)', sub, s[a:b]) + s[b:]
        idx.write_text(s, encoding="utf-8")


def next_topic(topics_path: str) -> str:
    """The first topic never published, else the one published longest ago."""
    topics = json.loads(Path(topics_path).read_text(encoding="utf-8"))
    last: dict[str, str] = {}
    for f in THREADS.glob("*.json"):
        th = json.loads(f.read_text(encoding="utf-8"))
        last[th["id"]] = max(last.get(th["id"], ""), th.get("generated", ""))
    return min(topics, key=lambda t: (t["id"] in last, last.get(t["id"], "")))["id"]


if __name__ == "__main__":
    if sys.argv[1:2] == ["--next-topic"]:
        print(next_topic(sys.argv[2]))
        raise SystemExit(0)
    added = ingest(sys.argv[1:])
    pids = build()
    print(f"added {added or 'nothing'}; {len(pids)} threads published: {', '.join(pids)}")
