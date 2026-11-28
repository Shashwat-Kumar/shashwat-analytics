#!/usr/bin/env python3
"""Publish source-attributed, aggregated defensive threat observations.
No stolen data, victim names, onion URLs, or raw third-party text leave this job.
If both feeds fail validation, the published page is left unchanged.
"""
import argparse
import json
import re
import ssl
import sys
from collections import Counter
from datetime import datetime, timedelta, timezone
from html import escape
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import HTTPSHandler, HTTPRedirectHandler, Request, build_opener

RANSOMLOOK = "https://www.ransomlook.io/api/posts?days=7"
CISA = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
ALLOWED = {RANSOMLOOK, CISA}
CVE = re.compile(r"CVE-[0-9]{4}-[0-9]{4,12}", re.ASCII)
MAX_BYTES = 9_000_000

class RejectRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError("Upstream redirect blocked")

def fetch(url):
    if url not in ALLOWED:
        raise ValueError("Unapproved upstream host")
    req = Request(url, headers={"User-Agent":"ReadSigilThreatRadar/0.1 (public defensive research)","Accept":"application/json"})
    with build_opener(HTTPSHandler(context=ssl.create_default_context()),RejectRedirect()).open(req,timeout=20) as resp:
        length = resp.headers.get("Content-Length")
        if length is not None and int(length)>MAX_BYTES:
            raise ValueError("Oversized upstream response")
        if "json" not in (resp.headers.get("Content-Type") or "").lower():
            raise ValueError("Unexpected content type")
        raw = resp.read(MAX_BYTES+1)
        if len(raw)>MAX_BYTES:
            raise ValueError("Oversized upstream response")
    return json.loads(raw.decode("utf-8"))

def date_time(value):
    if not isinstance(value,str) or len(value)>55:
        raise ValueError("Invalid date")
    d=datetime.fromisoformat(value.strip().replace("Z","+00:00"))
    return d.replace(tzinfo=timezone.utc) if d.tzinfo is None else d.astimezone(timezone.utc)

def ransomware(posts, now):
    if isinstance(posts,dict):
        posts=posts.get("posts")
    if not isinstance(posts,list) or len(posts)>70000:
        raise ValueError("RansomLook schema changed")
    seen=set(); groups=set(); days=Counter();bad=0
    for p in posts:
        if not isinstance(p,dict):
            bad+=1;continue
        g,t=p.get("group_name"),p.get("post_title")
        if not isinstance(g,str) or not 1<=len(g)<=130 or not isinstance(t,str) or not 1<=len(t)<=500:
            bad+=1;continue
        try: d=date_time(p.get("discovered"))
        except (ValueError,TypeError):bad+=1;continue
        if d<now-timedelta(days=7):continue
        if d>now+timedelta(hours=3):
            bad+=1;continue
        key=(g.casefold(),t.casefold(),d.isoformat())
        if key in seen:continue
        seen.add(key);groups.add(g.casefold());days[d.date().isoformat()]+=1
    if posts and bad/len(posts)>0.05:
        raise ValueError("RansomLook high rejection ratio")
    return {"claims":sum(days.values()),"groups":len(groups),"daily":[((now.date()-timedelta(days=i)).isoformat(),days[(now.date()-timedelta(days=i)).isoformat()]) for i in range(6,-1,-1)]}

def kev(payload, now):
    if not isinstance(payload,dict):
        raise ValueError("CISA schema changed")
    rows=payload.get("vulnerabilities")
    if not isinstance(rows,list) or not 100<=len(rows)<=15000 or payload.get("count")!=len(rows):
        raise ValueError("CISA count/schema mismatch")
    version=payload.get("catalogVersion")
    if not isinstance(version,str) or len(version)>40:
        raise ValueError("CISA catalog version missing")
    release=date_time(payload.get("dateReleased"))
    if not now-timedelta(days=25)<=release<=now+timedelta(hours=3):
        raise ValueError("CISA catalog stale/invalid")
    seen=set(); recent=[];bad=0
    for row in rows:
        if not isinstance(row,dict):
            bad+=1;continue
        cve,day=row.get("cveID"),row.get("dateAdded")
        if not isinstance(cve,str) or not CVE.fullmatch(cve):
            bad+=1;continue
        try: dd=datetime.strptime(day,"%Y-%m-%d").date()
        except (TypeError,ValueError):bad+=1;continue
        if cve in seen:
            raise ValueError("CISA duplicate CVE")
        seen.add(cve)
        if now.date()-timedelta(days=30)<=dd<=now.date():
            recent.append((day,cve,row.get("knownRansomwareCampaignUse")=="Known"))
    if bad>max(1,len(rows)*0.01):
        raise ValueError("CISA schema rejection")
    recent.sort(reverse=True)
    return {"version":version,"total":len(rows),"added30":len(recent),"ransomware30":sum(row[2] for row in recent),"latest":recent[:8]}

def summarize(feeds,now):
    result={"when":now.strftime("%Y-%m-%d %H:%M UTC"),"ransomlook":None,"cisa":None,"status":{}}
    for key,parser in (("ransomlook",ransomware),("cisa",kev)):
        try:
            result[key]=parser(feeds[key],now)
            result["status"][key]="Updated"
        except (KeyError,ValueError,TypeError) as exc:
            result["status"][key]="Unavailable"
            print("WARNING",key,type(exc).__name__,file=sys.stderr)
    if all(x is None for x in (result["ransomlook"],result["cisa"])):
        raise ValueError("No validated feed; not publishing")
    return result

def render(data):
    r,k=data["ransomlook"],data["cisa"]
    n=lambda value:str(value) if isinstance(value,int) else "Unavailable"
    claims=n(r["claims"] if r else None)
    groups=n(r["groups"] if r else None)
    added=n(k["added30"] if k else None)
    ransomware_kev=n(k["ransomware30"] if k else None)
    daily="".join("<tr><td>"+escape(day)+"</td><td>"+str(count)+"</td></tr>" for day,count in (r["daily"] if r else []))
    cves="".join('<tr><td><a href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog">'+escape(cve)+'</a></td><td>'+escape(day)+'</td><td>'+("Known" if flag else "Unknown")+"</td></tr>" for day,cve,flag in (k["latest"] if k else []))
    date=escape(data["when"])
    html='''<!doctype html><html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; connect-src 'none'"><title>Threat Radar | ReadSigil</title><meta name="description" content="Aggregated ransomware extortion-site claims and known exploited vulnerabilities, with timestamps and sources."><link rel="stylesheet" href="../assets/threat-radar.css"></head><body><header><div class="wrap top"><a href="../index.html" class="brand">ReadSigil</a><nav><a href="../threat-signals/">Decision Room</a><a href="../magazine.html">The Signal</a></nav></div></header><main class="wrap"><div class="eyebrow">ReadSigil / Threat Radar</div><h1>Watch the signals.<br><em>Check the evidence.</em></h1><p class="lead">A source-attributed, periodically refreshed view of public ransomware-extortion claims and exploited vulnerabilities. It is not a dark-web browser, a live breach detector, or a confirmation that anyone was compromised.</p>'''
    html+='<div class="stamp">Last validated snapshot: <strong>'+date+'</strong> · RansomLook: '+data["status"]["ransomlook"]+' · CISA: '+data["status"]["cisa"]+'</div>'
    blocks=[("Extortion-site claims observed · 7d",claims,"Unverified postings, not confirmed breaches"),("Posting groups seen · 7d",groups,"Observed by the source, coverage varies"),("New KEV entries · 30d",added,"CISA exploited-vulnerability catalogue"),("New KEVs with known ransomware use · 30d",ransomware_kev,"CISA catalogue flag, not a prediction")]
    html+='<section class="metrics" aria-label="Current observations">'+''.join('<article><span>'+t+'</span><strong>'+v+'</strong><small>'+note+'</small></article>' for t,v,note in blocks)+'</section>'
    html+='<div class="columns"><section><h2>Observed claims by day</h2><p>These are publications observed by RansomLook, not confirmed breaches, unique victims or a complete count of attacks.</p>'
    html+=('<table><thead><tr><th>Date (UTC)</th><th>Observed posts</th></tr></thead><tbody>'+daily+'</tbody></table>') if r else '<p>Source unavailable; no figure inferred.</p>'
    html+='</section><section><h2>Recent exploited vulnerabilities</h2><p>Check your own exposure against vendor advisories and asset inventory; exploit catalogue entries do not establish local compromise.</p>'
    html+=('<table><thead><tr><th>CVE</th><th>Date added</th><th>Ransomware use</th></tr></thead><tbody>'+cves+'</tbody></table>') if k else '<p>Source unavailable; no figure inferred.</p>'
    html+='</section></div><section class="method"><h2>What these numbers mean</h2><p>RansomLook collects claims published by ransomware extortion operators. Operators can fabricate, recycle or exaggerate those claims. Only aggregate counts reach this site; victim names, scraped descriptions, credentials, onion addresses and leaked material are never published. Counts may change because collection coverage changes. The separate CISA KEV feed lists vulnerabilities known to be exploited in the wild.</p><p>Data attribution: <a href="https://www.ransomlook.io/">RansomLook</a> (CC BY 4.0); <a href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog">CISA KEV</a> (CC0).</p><p>This page refreshes on a GitHub Actions schedule, subject to delay and upstream outages; check the snapshot timestamp. No incident or legal-regulatory conclusion is implied.</p><p><a href="../threat-signals/">Try ReadSigil’s threat-response decision exercise →</a></p></section></main><footer><div class="wrap">ReadSigil · Public-source threat intelligence · <a href="../contact.html">Corrections</a></div></footer></body></html>'
    return html+"\n"

def main():
    cli=argparse.ArgumentParser()
    cli.add_argument("--output",default="threat-radar/index.html")
    cli.add_argument("--check-only",action="store_true")
    args=cli.parse_args()
    now=datetime.now(timezone.utc)
    feeds={}
    for key,url in (("ransomlook",RANSOMLOOK),("cisa",CISA)):
        try: feeds[key]=fetch(url)
        except (HTTPError,URLError,TimeoutError,ValueError,OSError,json.JSONDecodeError) as exc:
            print("WARNING fetch",key,type(exc).__name__,file=sys.stderr)
    summary=summarize(feeds,now)
    if args.check_only:
        print(json.dumps(summary["status"]))
        return
    dst=Path(args.output);dst.parent.mkdir(parents=True,exist_ok=True)
    tmp=dst.with_suffix(".tmp")
    tmp.write_text(render(summary),encoding="utf-8")
    tmp.replace(dst)
    print(json.dumps({"output":str(dst),"status":summary["status"],"checked":summary["when"]}))

if __name__=="__main__":
    main()
