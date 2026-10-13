#!/usr/bin/env python3
"""Build data/ticker.json from real public sources: GitHub search API, Hacker News (Algolia) and RSS. Stdlib only."""
import json, os, re, datetime as dt, urllib.request, urllib.parse, xml.etree.ElementTree as ET
UA={"User-Agent":"shashwat-analytics-ticker","Accept":"application/vnd.github+json"}
TOK=os.environ.get("GITHUB_TOKEN")
def get(url,gh=False):
    h=dict(UA)
    if gh and TOK: h["Authorization"]="Bearer "+TOK
    with urllib.request.urlopen(urllib.request.Request(url,headers=h),timeout=25) as r: return r.read()
now=dt.datetime.now(dt.timezone.utc); since=(now-dt.timedelta(days=7)).date().isoformat()
MIN_STARS=200
def repos(q,n):
    u="https://api.github.com/search/repositories?"+urllib.parse.urlencode({"q":q+f" stars:>={MIN_STARS}","sort":"stars","order":"desc","per_page":n})
    out=[]
    for r in json.loads(get(u,True))["items"]:
        out.append({"kind":"repo","title":r["full_name"],"stars":r["stargazers_count"],"note":(r.get("language") or "")+(" · new this week"),"url":r["html_url"],"source":"GitHub"})
    return out
items=[];errors=[]
AIQ=re.compile(r"\b(AI|LLMs?|GPT|agents?|agentic|machine learning|ML|data|model|models|neural|OpenAI|Anthropic|Gemini|fintech|bank|banking|payments?|RBI|SEBI|privacy|analytics)\b",re.I)
try:
    ai=repos(f"created:>{since} topic:llm",6)+repos(f"created:>{since} topic:machine-learning",4)
    seen=set();ai=[x for x in ai if not (x["title"] in seen or seen.add(x["title"]))]
    for x in ai: x["tag"]="GH"; x["cat"]="AI/ML"
    allr=[x for x in repos(f"created:>{since}",6) if x["title"] not in seen]
    for x in allr: x["tag"]="GH"; x["cat"]="Trending"
    items+=ai[:8]+allr[:4]
except Exception as e: errors.append("github:"+str(e))
try:
    hn=json.loads(get("https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=60"))["hits"]
    hn=[h for h in hn if h.get("title") and AIQ.search(h["title"])][:8]
    items+=[{"kind":"news","tag":"HN","points":h.get("points",0),"title":h["title"],"source":"Hacker News","url":h.get("url") or f"https://news.ycombinator.com/item?id={h['objectID']}","discuss":f"https://news.ycombinator.com/item?id={h['objectID']}"} for h in hn]
except Exception as e: errors.append("hn:"+str(e))
for name,url,n in [("TechCrunch AI","https://techcrunch.com/category/artificial-intelligence/feed/",4),("MIT Technology Review","https://www.technologyreview.com/topic/artificial-intelligence/feed",3)]:
    try:
        root=ET.fromstring(get(url))
        for it in root.iter("item"):
            if n==0:break
            t=(it.findtext("title") or "").strip();l=(it.findtext("link") or "").strip()
            if t and l: items.append({"kind":"news","tag":"AI","title":t,"source":name,"url":l});n-=1
    except Exception as e: errors.append(name+":"+str(e))
out={"generated_at":now.strftime("%Y-%m-%dT%H:%M:%SZ"),"sources":["GitHub search API (repos created in the last 7 days with at least 200 stars, by stars)","Hacker News front page via Algolia API (AI/data/fintech keywords)","TechCrunch AI RSS","MIT Technology Review AI RSS"],"items":items,"errors":errors}
os.makedirs(os.path.join(os.path.dirname(__file__),"..","data"),exist_ok=True)
json.dump(out,open(os.path.join(os.path.dirname(__file__),"..","data","ticker.json"),"w"),ensure_ascii=False,indent=1)
print(len(items),"items",errors)
