#!/usr/bin/env python3
"""Reproducible ReadSigil public candidate build; never publishes.

Fingerprint semantics: sourceTemplateSha256 is SHA256 of the UTF-8 template,
BEFORE inserting its hash or the generated CSP hashes. This avoids self-hashing.
The final page's SHA256 is a separate release identity in REVIEW_MANIFEST.json.
Running --verify rebuilds in memory and checks every output byte-for-byte.
"""
import argparse
import base64
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TPL = ROOT / 'threat-signals/index.template.html'
PAGE = ROOT / 'threat-signals/index.html'
MANIFEST = ROOT / 'REVIEW_MANIFEST.json'
PUBLIC_HEADERS = ROOT / 'hosting/cloudflare-pages-public-headers.txt'
STAGING_HEADERS = ROOT / 'hosting/cloudflare-pages-private-staging-headers.txt'
TOKEN = '__SOURCE_TEMPLATE_SHA256__'
CSP_TOKEN = '__CSP_POLICY__'
VERSION = '0.3.0'

def digest(payload):
    return hashlib.sha256(payload).hexdigest()

def hash_for_csp(content):
    return "'sha256-" + base64.b64encode(hashlib.sha256(content.encode('utf-8')).digest()).decode('ascii') + "'"

def only_inline(html, tag):
    matches = re.findall(r'<'+tag+r'(?:\s[^>]*)?>(.*?)</'+tag+r'>', html, flags=re.S|re.I)
    if len(matches) != 1:
        raise ValueError(f'Expected exactly one inline {tag}, saw {len(matches)}')
    return matches[0]

def build():
    template_bytes = TPL.read_bytes()
    template = template_bytes.decode('utf-8')
    if template.count(TOKEN) != 1 or template.count(CSP_TOKEN) != 1:
        raise ValueError('Template tokens must each occur exactly once')
    if 'noindex' in template or 'Editorial verification pending' in template or 're-verification is required before publication' in template:
        raise ValueError('Staging-only text found in public template')
    template_sha = digest(template_bytes)
    partial = template.replace(TOKEN, template_sha)
    script_sha = hash_for_csp(only_inline(partial, 'script'))
    style_sha = hash_for_csp(only_inline(partial, 'style'))
    csp = ('default-src \'none\'; style-src '+style_sha+'; script-src '+script_sha+
           "; img-src 'self' data:; base-uri 'none'; form-action 'none'; "+
           "object-src 'none'; connect-src 'none'")
    final_html = partial.replace(CSP_TOKEN, csp)
    page_sha = digest(final_html.encode('utf-8'))
    public_policy = csp + "; frame-ancestors 'none'"
    base = '/threat-signals/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n'
    headers_public = base+'  Content-Security-Policy: '+public_policy+'\n'
    headers_staging = base+'  X-Robots-Tag: noindex, nofollow, noarchive\n'+'  Content-Security-Policy: '+public_policy+'\n'
    manifest = {
        'version': VERSION,
        'artifact': 'PUBLIC_CANDIDATE_NOT_APPROVED_NOT_DEPLOYED',
        'sourceTemplateSha256': template_sha,
        'releasePageSha256': page_sha,
        'inlineScriptCspSha256': script_sha,
        'inlineStyleCspSha256': style_sha,
        'buildMethod': 'python3 scripts/build_release.py --verify; hashes are over exact UTF-8 bytes',
        'fingerprintMeaning': 'SHA256 of threat-signals/index.template.html bytes; not the published page digest',
        'hostingGate': 'Use a host with per-path HTTP response headers; GitHub Pages alone is insufficient',
        'contentReview': 'CERT-In CIAD-2026-0049 checked 2026-10-22; expert scenario grading sign-off still required',
        'releaseGates': {'claude': 'PENDING', 'chatgpt': 'PENDING_FINAL_REVIEW', 'incidentResponseExpert': 'PENDING',
                         'productionHeaders': 'PENDING_RUNTIME_VERIFICATION', 'accessibilityHuman': 'PENDING',
                         'owner': 'PENDING'},
        'liveIngestion': 'DISABLED_REVIEW_ONLY'
    }
    return {
        PAGE: final_html.encode('utf-8'),
        MANIFEST: (json.dumps(manifest, indent=2, ensure_ascii=False)+'\n').encode('utf-8'),
        PUBLIC_HEADERS: headers_public.encode('utf-8'),
        STAGING_HEADERS: headers_staging.encode('utf-8'),
    }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--verify', action='store_true', help='Verify outputs without changing them')
    args = parser.parse_args()
    outputs = build()
    for path, content in outputs.items():
        if args.verify:
            if not path.exists() or path.read_bytes() != content:
                raise SystemExit('FAIL generated output mismatch: '+str(path.relative_to(ROOT)))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
        print(('VERIFIED ' if args.verify else 'BUILT ')+str(path.relative_to(ROOT)))
    print('SOURCE TEMPLATE SHA256:', json.loads(outputs[MANIFEST])['sourceTemplateSha256'])
    print('FINAL RELEASE PAGE SHA256:', json.loads(outputs[MANIFEST])['releasePageSha256'])
    print('No upload, commit, publish or deployment performed.')

if __name__ == '__main__':
    main()
