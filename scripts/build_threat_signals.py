"""CISA KEV review-only candidate builder. No public publishing action."""
import argparse
import datetime as dt
import hashlib
import json
import os
import re
import sys
import tempfile
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path

SOURCE='https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json'
CATALOG='https://www.cisa.gov/known-exploited-vulnerabilities-catalog'
CVE=re.compile(r'^CVE-[0-9]{4}-[0-9]{4,12}$',flags=re.ASCII)
DATE=re.compile(r'^[0-9]{4}-[0-9]{2}-[0-9]{2}$',flags=re.ASCII)
MAX_BYTES=10_000_000

def safe_text(value,limit=500):
    if not isinstance(value,str):return ''
    normalized=unicodedata.normalize('NFKC',value)
    return ''.join(' ' if unicodedata.category(ch).startswith('C') else ch for ch in normalized).strip()[:limit]

def clean_record(row):
    if not isinstance(row,dict):return None
    cve=row.get('cveID','')
    date=row.get('dateAdded','')
    if not isinstance(cve,str) or len(cve)>24 or not CVE.fullmatch(cve):return None
    if not isinstance(date,str) or not DATE.fullmatch(date):return None
    try:
        parsed=dt.date.fromisoformat(date)
        if parsed>dt.date.today()+dt.timedelta(days=1):return None
    except ValueError:return None
    return {'id':cve,'dateAdded':date,'vendor':safe_text(row.get('vendorProject'),100),
        'product':safe_text(row.get('product'),100),'title':safe_text(row.get('vulnerabilityName'),240),
        'requiredAction':safe_text(row.get('requiredAction'),450),
        'source':'CISA KEV','sourceUrl':CATALOG,
        'publicationState':'candidate-needs-editorial-review'}

def build(data,limit=100,origin='unknown',raw_sha256=None):
    if not isinstance(data,dict) or not isinstance(data.get('vulnerabilities'),list):
        raise ValueError('CISA feed shape invalid; review queue not updated')
    rows=data['vulnerabilities']
    if not rows: raise ValueError('CISA feed unexpectedly empty')
    for key in ('catalogVersion','dateReleased','count'):
        if key not in data: raise ValueError('Missing CISA catalog metadata: '+key)
    if not DATE.fullmatch(str(data['dateReleased'])):raise ValueError('Invalid CISA dateReleased')
    if not isinstance(data['count'],int) or data['count']!=len(rows):raise ValueError('Catalog count mismatch')
    if not isinstance(data['catalogVersion'],str) or not data['catalogVersion'].strip():raise ValueError('Invalid catalogVersion')
    accepted={};rejected=0;duplicates=0;conflicts=0
    for row in rows:
        rec=clean_record(row)
        if not rec:rejected+=1;continue
        existing=accepted.get(rec['id'])
        if existing:
            duplicates+=1
            if existing!=rec:
                conflicts+=1
                if rec['dateAdded']>existing['dateAdded']:accepted[rec['id']]=rec
        else:accepted[rec['id']]=rec
    if not accepted or rejected/len(rows)>.05:
        raise ValueError(f'Feed validation failed: {rejected} rejected / {len(rows)}; no output')
    records=sorted(accepted.values(),key=lambda x:(x['dateAdded'],x['id']),reverse=True)
    return {'mode':'REVIEW_ONLY_NOT_PUBLISHED','inputOrigin':origin,
            'source':SOURCE if origin=='official-live-feed' else None,
            'inputSha256':raw_sha256,'fixture':origin!='official-live-feed',
            'catalogVersion':data['catalogVersion'],'dateReleased':data['dateReleased'],
            'catalogCount':data['count'],'accepted':len(accepted),'rejected':rejected,
            'duplicates':duplicates,'conflicts':conflicts,'records':records[:limit],
            'extractedAt':dt.datetime.now(dt.timezone.utc).isoformat()}

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl):
        raise ValueError('Redirects are forbidden; no feed data accepted')

def download():
    request=urllib.request.Request(SOURCE,headers={'User-Agent':'ReadSigil-Research/0.2 (+https://readsigil.com)'})
    opener=urllib.request.build_opener(NoRedirect())
    with opener.open(request,timeout=20) as response:
        if response.geturl()!=SOURCE:raise ValueError('Source URL mismatch')
        length=response.headers.get('Content-Length')
        if length:
            try: size=int(length)
            except ValueError as ex:raise ValueError('Malformed Content-Length') from ex
            if size<0 or size>MAX_BYTES:raise ValueError('Feed size out of bounds')
        raw=response.read(MAX_BYTES+1)
        if len(raw)>MAX_BYTES:raise ValueError('Feed too large')
    return raw

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--input',help='Local fixture JSON; automatically marked as fixture')
    ap.add_argument('--output',default='build/threat-signals/pending-cisa-kev.json')
    args=ap.parse_args()
    try:
        if args.input:
            path=Path(args.input)
            if path.stat().st_size>MAX_BYTES:raise ValueError('Input file too large')
            raw=path.read_bytes();origin='local-fixture:'+path.name
        else:
            raw=download();origin='official-live-feed'
        data=json.loads(raw)
        result=build(data,origin=origin,raw_sha256=hashlib.sha256(raw).hexdigest())
        dest=Path(args.output);dest.parent.mkdir(parents=True,exist_ok=True)
        fd,tmp=tempfile.mkstemp(dir=str(dest.parent),prefix='.'+dest.name+'.',suffix='.tmp')
        try:
            with os.fdopen(fd,'w',encoding='utf-8') as f:
                json.dump(result,f,indent=2,ensure_ascii=False);f.write('\n');f.flush();os.fsync(f.fileno())
            os.replace(tmp,dest)
        finally:
            if os.path.exists(tmp):os.remove(tmp)
        print(f'Review candidates={len(result["records"])}; rejected={result["rejected"]}; duplicates={result["duplicates"]}; conflicts={result["conflicts"]}; NO PUBLICATION')
    except (OSError, ValueError, TypeError, RecursionError, UnicodeError, urllib.error.URLError) as exc:
        print(f'FEED REJECTED ({type(exc).__name__}): {exc}',file=sys.stderr)
        return 2
    return 0

if __name__=='__main__':sys.exit(main())
