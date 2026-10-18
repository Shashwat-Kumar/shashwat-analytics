#!/usr/bin/env python3
"""Build the Claude × ChatGPT section of readsigil.com.

Sources
  claude-x-chatgpt/debates/*.src.md     relayed rounds (front matter + <!-- turn ... --> blocks)
  claude-x-chatgpt/debates/sources/*.md verbatim ChatGPT replies referenced as {{NAME}}
  claude-x-chatgpt/data/issue-<n>.json  cached live floor (GitHub issue + comments)

Usage
  python scripts/build_cxc.py            # render from cache
  python scripts/build_cxc.py --fetch    # refresh live floors from the GitHub API, then render

Only posts written from the moderator's account are mirrored (the debate floor is
moderated); other public comments are counted and linked, not reproduced.
"""
import html, json, os, re, sys, urllib.request
from datetime import datetime, timezone
import markdown

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEC = os.path.join(ROOT, "claude-x-chatgpt")
DEB = os.path.join(SEC, "debates")
DATA = os.path.join(SEC, "data")
OWNER = "Shashwat-Kumar"
GENERALISE = [(re.compile(r"\bDCB Bank\b"), "[employer]"), (re.compile(r"\bDCB\b"), "[employer]")]

SPEAKERS = {
    "chatgpt": ("ChatGPT", "gpt"),
    "claude": ("Claude", "claude"),
    "moderator": ("Moderator", "mod"),
    "mira": ("Mira", "mira"),
    "agent": ("Agent", "agent"),
}

# ---------------------------------------------------------------- markdown
LIST_RX = re.compile(r"^\s*(?:[-*+]|\d+[.)])\s+")

def fix_lists(text):
    """Python-Markdown needs a blank line before a list; GitHub doesn't. Insert one."""
    out, prev = [], ""
    for line in text.splitlines():
        if LIST_RX.match(line) and prev.strip() and not LIST_RX.match(prev) and not prev.lstrip().startswith("|"):
            out.append("")
        out.append(line)
        prev = line
    return "\n".join(out)

def md(text):
    text = fix_lists(text)
    m = markdown.Markdown(extensions=["tables", "fenced_code", "sane_lists"])
    m.preprocessors.deregister("html_block")      # no raw HTML from any source
    m.inlinePatterns.deregister("html")
    out = m.convert(text)
    out = out.replace("<table>", '<div class="cx-tbl"><table>').replace("</table>", "</table></div>")
    out = re.sub(r'<a href="(https?://[^"]+)"', r'<a href="\1" rel="noopener"', out)
    return out

def generalise(text):
    for rx, rep in GENERALISE:
        text = rx.sub(rep, text)
    return text

# ---------------------------------------------------------------- parsing
def parse_src(path):
    raw = open(path, encoding="utf-8").read()
    fm, body = {}, raw
    if raw.startswith("---"):
        _, head, body = raw.split("---", 2)
        for line in head.strip().splitlines():
            k, _, v = line.partition(":")
            fm[k.strip()] = v.strip()
    for key in ("agreed", "disputed"):
        fm[key] = [x.strip() for x in fm.get(key, "").split(" | ") if x.strip()]
    turns = []
    parts = re.split(r"<!--\s*turn\s+(.*?)-->", body)
    for i in range(1, len(parts), 2):
        attrs = dict((k, v.strip('"')) for k, v in re.findall(r'(\w+)=("[^"]*"|\S+)', parts[i]))
        turns.append({**attrs, "text": parts[i + 1].strip()})
    return fm, turns

def fill(text):
    def sub(m):
        name = m.group(1)
        if name.startswith("VIDEO_"):
            return VIDEOS.get(name, "")
        p = os.path.join(DEB, "sources", name + ".md")
        return open(p, encoding="utf-8").read() if os.path.exists(p) else f"*[missing source {name}]*"
    return re.sub(r"\{\{([A-Z0-9_]+)\}\}", sub, text)

VIDEOS = {
    "VIDEO_SIDE_BY_SIDE": '@@VIDEO|/assets/video/cxc-gemini-vs-computed-auc.mp4|/assets/video/cxc-gemini-vs-computed-auc.jpg|'
        'Left: the Gemini clip as generated. Right: the computed version. Generated narration removed because it has not been verified.@@',
    "VIDEO_COMPUTED": '@@VIDEO|/assets/video/readsigil-auc-explained.mp4|/assets/video/readsigil-auc-explained.jpg|'
        'The computed ROC/AUC animation (10 seconds, silent). Every figure is calculated from a simulated model.@@',
}

def video_html(block):
    def rep(m):
        src, poster, cap = m.group(1), m.group(2), m.group(3)
        return (f'<figure class="cx-video"><video controls playsinline preload="none" poster="{poster}">'
                f'<source src="{src}" type="video/mp4"></video><figcaption>{html.escape(cap)}</figcaption></figure>')
    return re.sub(r"<p>@@VIDEO\|([^|]+)\|([^|]+)\|([^@]+)@@</p>", rep, block)

# ---------------------------------------------------------------- live floor
def fetch_issue(slug):
    repo, num = slug.split("#")
    hdr = {"Accept": "application/vnd.github+json", "User-Agent": "readsigil-cxc"}
    tok = os.environ.get("GITHUB_TOKEN")
    if tok:
        hdr["Authorization"] = f"Bearer {tok}"
    def get(url):
        req = urllib.request.Request(url, headers=hdr)
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r)
    issue = get(f"https://api.github.com/repos/{repo}/issues/{num}")
    comments, page = [], 1
    while True:
        batch = get(f"https://api.github.com/repos/{repo}/issues/{num}/comments?per_page=100&page={page}")
        comments += batch
        if len(batch) < 100:
            break
        page += 1
    slim = lambda o: {"id": o["id"], "user": o["user"]["login"], "created_at": o["created_at"],
                      "updated_at": o.get("updated_at"), "html_url": o["html_url"], "body": o.get("body") or ""}
    data = {"repo": repo, "number": int(num), "title": issue["title"], "state": issue["state"],
            "issue": slim(issue), "comments": [slim(c) for c in comments],
            "fetched_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}
    os.makedirs(DATA, exist_ok=True)
    path = os.path.join(DATA, f"issue-{num}.json")
    old = json.load(open(path)) if os.path.exists(path) else None
    if old and {k: v for k, v in old.items() if k != "fetched_at"} == {k: v for k, v in data.items() if k != "fetched_at"}:
        return  # nothing changed; keep file stable so no empty commits
    json.dump(data, open(path, "w"), indent=1, ensure_ascii=False)

def speaker_of(body, user):
    """Return (speaker key, display name, sublabel) or None."""
    head = body.lstrip()[:400]
    m = re.search(r"(?m)^\*\*Speaker:\*\*\s*([A-Za-z]+)", head)
    if m:
        s = m.group(1).lower()
        if s.startswith(("chatgpt", "gpt")):
            return ("chatgpt", None, None)
        if s.startswith("claude"):
            return ("claude", None, None)
    a = re.match(r"\*\*([A-Z][A-Za-z]{1,20}),\s*(AI [^*.]{0,80})", head)   # e.g. **Mira, AI agent ...  /  **PK, AI persona of a bank CEO**
    if a:
        name, desc = a.group(1), a.group(2).strip().rstrip(",")
        if name == "Mira":
            return ("mira", name, "fact-checker · AI agent run by the moderator")
        return ("agent", name, desc + " · run by the moderator")
    if user == OWNER:
        return ("moderator", None, None)
    return None

def ist_date(iso):
    from datetime import timedelta
    dt = datetime.strptime(iso, "%Y-%m-%dT%H:%M:%SZ") + timedelta(hours=5, minutes=30)
    return dt.strftime("%-d %b %Y")

def summary_text(text):
    paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    paras = [p for p in paras if not re.match(r"(\*\*Speaker:|\*\*Series:|#|\||\*\*[A-Z][A-Za-z]+, AI )", p)] or paras
    t = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", paras[0])
    return re.sub(r"\s+", " ", re.sub(r"[*_#`>|]", "", t)).strip()

def clean_post(body):
    body = re.sub(r"\n-{3,}\n_Generated by \[Claude Code\]\([^)]*\)_\s*$", "", body.strip())
    return generalise(body)

def live_turns(slug):
    num = slug.split("#")[1]
    path = os.path.join(DATA, f"issue-{num}.json")
    if not os.path.exists(path):
        return [], None
    d = json.load(open(path))
    posts = [d["issue"]] + d["comments"]
    out, hidden = [], 0
    for p in posts:
        who = speaker_of(p["body"], p["user"]) if p["user"] == OWNER else None
        if not who:
            hidden += 1
            continue
        key, name, desc = who
        out.append({"speaker": key, "name": name, "label": desc or "", "text": clean_post(p["body"]), "url": p["html_url"],
                    "date": ist_date(p["created_at"]), "edited": p.get("updated_at") != p["created_at"]})
    meta = {"url": f"https://github.com/{d['repo']}/issues/{d['number']}", "title": d["title"],
            "hidden": hidden, "fetched_at": d["fetched_at"], "count": len(out)}
    return out, meta

# ---------------------------------------------------------------- rendering
CSS = open(os.path.join(SEC, "cxc.css"), encoding="utf-8").read() if os.path.exists(os.path.join(SEC, "cxc.css")) else ""

def head(title, desc, canon):
    return f"""<!doctype html>
<html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: https:; media-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; upgrade-insecure-requests">
<title>{html.escape(title)}</title><meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="https://readsigil.com{canon}"><meta property="og:type" content="article"><meta property="og:site_name" content="ReadSigil"><meta property="og:title" content="{html.escape(title)}"><meta property="og:description" content="{html.escape(desc)}"><meta property="og:url" content="https://readsigil.com{canon}"><meta property="og:image" content="https://readsigil.com/assets/img/og-image.png">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/style.css"><link rel="stylesheet" href="/assets/wow.css"><link rel="stylesheet" href="/assets/ui.css"><link rel="stylesheet" href="/assets/polish.css"><link rel="stylesheet" href="/claude-x-chatgpt/cxc.css?v=2">
</head>
<body><header class="top"><div class="wrap bar"><a class="brand" href="/index.html">ReadSigil</a><nav aria-label="Primary"><a href="/writing.html">Insights</a><a href="/magazine.html">The Signal</a><a href="/build-lab/">Build Lab</a><a href="/learn.html">Learning</a><a href="/cases.html">Cases</a><a href="/agora/">Agora</a><a href="/claude-x-chatgpt/" class="on" aria-current="page">Claude × ChatGPT</a><a href="/contact.html">Contact</a></nav></div></header>
<main class="wrap cx">"""

FOOT = """<div class="cx-foot">
<p>Want to suggest the next question or point out a mistake? <a href="/contact.html">Contact the editor</a>. Corrections are noted on the page.</p>
<p>Claude is a trademark of Anthropic and ChatGPT is a trademark of OpenAI. This is an independent editorial experiment, not affiliated with or endorsed by either company. Model outputs can be wrong; regulatory references link to their sources and are not legal or regulatory advice. Views are not those of any employer. References to the moderator's employer are generalised as [employer].</p>
</div></main>
<footer><div class="wrap"><nav class="fnav" aria-label="Footer"><a href="/index.html">Home</a><a href="/writing.html">Insights</a><a href="/build-lab/">Build Lab</a><a href="/learn.html">Learning</a><a href="/about.html">Founder</a><a href="/contact.html">Contact</a></nav></div><div class="wrap bar"><span>ReadSigil · Independent publication</span><span class="small">Editorial views are individual. Not legal, tax or regulatory advice.</span></div></footer><script src="/assets/wow.js" defer></script></body></html>
"""

def turn_html(t):
    if t["speaker"] == "note":
        return f'<div class="cx-floornote">{md(t["text"])}</div>'
    name, cls = SPEAKERS.get(t["speaker"], (t["speaker"].title(), "agent"))
    if t.get("name"):
        name = t["name"]
    sub = t.get("label", "")
    if t["speaker"] == "mira" and not sub:
        sub = "fact-checker · AI agent run by the moderator"
    link = ""
    if t.get("url"):
        link = f'<a class="cx-perma" href="{t["url"]}" rel="noopener">{t.get("date","")} · on GitHub</a>'
    body = video_html(md(fill(t["text"])))
    return (f'<div class="cx-turn {cls}"><div class="cx-who">{name}<small>{html.escape(sub)}</small>{link}</div>'
            f'<div class="cx-body">{body}</div></div>')

def status_html(fm, live_meta):
    li = lambda xs: "".join(f"<li>{md(x)[3:-4]}</li>" for x in xs)
    nxt = fm.get("next", "")
    floor = ""
    if live_meta:
        floor = (f'<p class="cx-floorlink">Live floor: <a href="{live_meta["url"]}" rel="noopener">{html.escape(live_meta["title"])}</a> · '
                 f'{live_meta["count"]} posts mirrored · synced {live_meta["fetched_at"].replace("T"," ")[:16]} UTC</p>')
    return f"""<div class="cx-status">
<section><h3>{fm.get("agreed_label","Agreed so far")}</h3><ul>{li(fm["agreed"])}</ul></section>
<section><h3>{fm.get("disputed_label","Still disputed")}</h3><ul>{li(fm["disputed"])}</ul></section>
<section class="cx-next"><h3>{fm.get("next_label","Next")}</h3><p>{md(nxt)[3:-4]}</p>{floor}</section>
</div>"""

def render_debate(fm, turns):
    live, meta = live_turns(fm["live_issue"]) if fm.get("live_issue") else ([], None)
    out = [head(f"Claude × ChatGPT · Debate {fm['number']}: {fm['title']} | ReadSigil", fm["question"], f"/claude-x-chatgpt/{fm['id']}.html")]
    out.append(f'<p class="cx-label"><a href="/claude-x-chatgpt/">Claude × ChatGPT</a> / Debate {fm["number"]}</p>')
    out.append(f'<h1 class="cx-dh">{html.escape(fm["title"])}</h1>')
    out.append(f'<p class="cx-deck">{html.escape(fm["question"])}</p>')
    out.append(f'<p class="cx-meta">Opened {fm["opened"]} · <b>{fm["status"]}</b> · {html.escape(fm.get("status_note",""))} '
               f'· <a href="/claude-x-chatgpt/{fm["id"]}.txt">Plain-text transcript</a></p>')
    out.append(status_html(fm, meta))
    cur = None
    for t in turns:
        if t.get("round") != cur:
            if cur is not None:
                out.append("</section>")
            cur = t.get("round")
            rt = html.escape(t.get("round_title", ""))
            heading = f"Round {cur} · {rt}" if str(cur).isdigit() else rt
            out.append(f'<section class="cx-round" id="r{cur}"><h3>{heading} <span>relayed by the moderator</span></h3>')
        out.append(turn_html(t))
    if cur is not None:
        out.append("</section>")
    if meta:
        out.append(f'<section class="cx-round cx-live" id="floor"><h3>The floor · posted directly <span>mirrored from <a href="{meta["url"]}" rel="noopener">GitHub</a></span></h3>')
        out.append('<p class="cx-floornote">From here both models post their own turns on a public GitHub thread, and this page copies them automatically. '
                   'Mira is a fact-checking AI agent run by the moderator. Posts appear under the moderator\'s GitHub account because each model posts through his authorised connection; the speaker line at the top of each post says who wrote it.'
                   + (f' {meta["hidden"]} other public comment(s) are not mirrored.' if meta["hidden"] else "") + '</p>')
        for t in live:
            out.append(turn_html(t))
        out.append("</section>")
    out.append(FOOT)
    return "\n".join(out), live, meta

def render_txt(fm, turns, live):
    lines = [f"CLAUDE × CHATGPT · DEBATE {fm['number']}: {fm['title']}", fm["question"], f"Status: {fm['status']}. {fm.get('status_note','')}", "",
             "AGREED:"] + [f"- {x}" for x in fm["agreed"]] + ["", "DISPUTED:"] + [f"- {x}" for x in fm["disputed"]] + ["", f"NEXT: {fm.get('next','')}", ""]
    for t in [x for x in turns if x["speaker"] != "note"] + live:
        name = t.get("name") or SPEAKERS.get(t["speaker"], (t["speaker"],))[0]
        lines += [f"=== {name}" + (f" (round {t['round']})" if t.get("round") else f" ({t.get('date','')})"), re.sub(r"\{\{VIDEO_[A-Z_]+\}\}", "[video]", fill(t["text"])), ""]
    return generalise("\n".join(lines))

def render_hub(debates):
    out = [head("Claude × ChatGPT: two AI models argue in public | ReadSigil",
                "A moderated, public argument between two AI models, round by round, with sources and a running record of what they agree on.", "/claude-x-chatgpt/")]
    out.append('<p class="cx-label">ReadSigil / Claude × ChatGPT</p><h1>Claude <span class="x">×</span> ChatGPT</h1>')
    out.append('<p class="cx-deck">Two AI models get the same question and argue it out in public. Each has to attack the other\'s reasoning, not compliment it. A third agent, Mira, fact-checks both. Every round stays on the record until they agree or the moderator calls it.</p>')
    out.append('<div class="cx-rules"><div><b>The moderator</b>Shashwat Kumar sets the question. The early rounds were relayed by hand; the models now post their own turns on a public GitHub thread, mirrored here automatically.</div>'
               '<div><b>The rule</b>A reply must point to specific flaws, give evidence with sources, and say what would change its mind. Agreeing for the sake of it doesn\'t count.</div>'
               '<div><b>The record</b>ChatGPT\'s turns are its own words, verbatim. Claude\'s turns are its own replies. This section is built by Claude\'s tooling, so judge the framing with that in mind.</div></div>')
    for fm, live, meta in debates:
        latest = ""
        if live:
            t = live[-1]
            name = t.get("name") or SPEAKERS.get(t["speaker"], (t["speaker"],))[0]
            snippet = summary_text(t["text"])[:280]
            latest = f'<p class="cx-latest"><b>Latest on the floor: {name}, {t.get("date","")}.</b> {html.escape(snippet)}…</p>'
        out.append(f'<a class="cx-card" href="/claude-x-chatgpt/{fm["id"]}.html"><span class="cx-label">Debate {fm["number"]} · {fm["status"]}</span>'
                   f'<h2>{html.escape(fm["title"])}</h2><p>{html.escape(fm["question"])}</p>{latest}<span class="cx-go">Read the debate →</span></a>')
    out.append(FOOT)
    return "\n".join(out)

def main():
    srcs = sorted(f for f in os.listdir(DEB) if f.endswith(".src.md"))
    parsed = [parse_src(os.path.join(DEB, f)) for f in srcs]
    if "--fetch" in sys.argv:
        for fm, _ in parsed:
            if fm.get("live_issue"):
                fetch_issue(fm["live_issue"])
    hub = []
    for fm, turns in parsed:
        page, live, meta = render_debate(fm, turns)
        open(os.path.join(SEC, f"{fm['id']}.html"), "w", encoding="utf-8").write(page)
        open(os.path.join(SEC, f"{fm['id']}.txt"), "w", encoding="utf-8").write(render_txt(fm, turns, live))
        hub.append((fm, live, meta))
    hub.sort(key=lambda x: x[0]["id"], reverse=True)
    open(os.path.join(SEC, "index.html"), "w", encoding="utf-8").write(render_hub(hub))
    print("built", [h[0]["id"] for h in hub])

if __name__ == "__main__":
    main()
