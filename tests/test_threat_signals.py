import json
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from build_threat_signals import clean_record,build,safe_text,MAX_BYTES,SOURCE
ROOT=Path(__file__).resolve().parents[1]
GOOD={'cveID':'CVE-2026-12345','dateAdded':'2026-10-15','vendorProject':'Test Vendor','product':'Example','vulnerabilityName':'Sample','requiredAction':'Apply mitigations'}
def feed(rows):return {'catalogVersion':'test','dateReleased':'2026-10-15','count':len(rows),'vulnerabilities':rows}
class TestPipeline(unittest.TestCase):
 def test_valid(self):self.assertEqual(clean_record(GOOD)['id'],'CVE-2026-12345')
 def test_reject_bad_cve(self):self.assertIsNone(clean_record({**GOOD,'cveID':'<script>alert(1)</script>'}))
 def test_reject_bad_date(self):self.assertIsNone(clean_record({**GOOD,'dateAdded':'2026-02-31'}))
 def test_reject_future_date(self):self.assertIsNone(clean_record({**GOOD,'dateAdded':'2099-01-01'}))
 def test_reject_non_object(self):self.assertIsNone(clean_record('<script>'))
 def test_remove_control_bytes(self):self.assertNotIn('\x00',clean_record({**GOOD,'vulnerabilityName':'bad\x00thing'})['title'])
 def test_limit_long_text(self):self.assertEqual(len(clean_record({**GOOD,'product':'x'*10000})['product']),100)
 def test_never_accept_attacker_url(self):
  rec=clean_record({**GOOD,'sourceUrl':'https://evil.example/pwn','publicationState':'published'})
  self.assertEqual(rec['sourceUrl'],'https://www.cisa.gov/known-exploited-vulnerabilities-catalog')
  self.assertEqual(rec['publicationState'],'candidate-needs-editorial-review')
 def test_deduplicate_and_sort(self):
  rows=[GOOD,{**GOOD,'dateAdded':'2026-10-10'},{**GOOD,'cveID':'CVE-2026-12346','dateAdded':'2026-10-16'}]
  r=build(feed(rows));self.assertEqual(len(r['records']),2)
  self.assertEqual(r['records'][0]['id'],'CVE-2026-12346')
  self.assertEqual(r['duplicates'],1)
 def test_fail_closed_invalid_feed(self):
  with self.assertRaises(ValueError):build({'attacker':'modified schema'})
 def test_empty_feed_fails_closed(self):
  with self.assertRaises(ValueError):build(feed([]))
 def test_limit_records(self):
  rows=[{**GOOD,'cveID':f'CVE-2026-{10000+i}'} for i in range(12)]
  self.assertEqual(len(build(feed(rows),limit=4)['records']),4)
 def test_no_active_markup_sink(self):
  html=(ROOT/'threat-signals/index.html').read_text()
  self.assertNotIn('innerHTML',html);self.assertIn('textContent',html);self.assertNotIn('eval(',html)
 def test_no_external_scripts(self):
  html=(ROOT/'threat-signals/index.html').read_text()
  self.assertNotIn('<script src=',html);self.assertIn("connect-src 'none'",html)
 def test_no_autopublish(self):
  py=(ROOT/'scripts/build_threat_signals.py').read_text()
  self.assertIn('REVIEW_ONLY_NOT_PUBLISHED',py)
  self.assertNotIn('github.com/repos/',py)
 def test_no_claim_live_dark_web(self):
  html=(ROOT/'threat-signals/index.html').read_text().lower()
  self.assertIn('fictional',html);self.assertIn('not a penetration test',html)
 def test_unicode_spoof_ids(self):
  for payload in ['CVE-2026-１２３４５','CVE-2026-١٢٣٤٥','CVE-2026-1'*10000]:
   self.assertIsNone(clean_record({**GOOD,'cveID':payload}))
 def test_unicode_bidi_and_invisible(self):
  x=safe_text('safe\u202ehi\u200btext\x85',500)
  self.assertNotIn('\u202e',x);self.assertNotIn('\u200b',x);self.assertNotIn('\x85',x)
 def test_schema_drift_rejected(self):
  with self.assertRaises(ValueError):build(feed([{**GOOD,'cveID':None}]*500))
 def test_fixture_origin_provenance(self):
  r=build(feed([GOOD]),origin='local-fixture:test.json',raw_sha256='abc')
  self.assertIsNone(r['source']);self.assertTrue(r['fixture']);self.assertEqual(r['inputSha256'],'abc')
 def test_catalog_metadata_required(self):
  with self.assertRaises(ValueError):build({'vulnerabilities':[GOOD]})
 def test_count_mismatch(self):
  data=feed([GOOD]);data['count']=10
  with self.assertRaises(ValueError):build(data)
 def test_conflict_keeps_latest(self):
  d=build(feed([{**GOOD,'dateAdded':'2026-10-12','requiredAction':'old'},{**GOOD,'requiredAction':'new'}]))
  self.assertEqual(d['records'][0]['requiredAction'],'new');self.assertEqual(d['conflicts'],1)
 def test_html_kept_as_data(self):
  self.assertEqual(safe_text('<img src=x onerror=alert(1)>'),'<img src=x onerror=alert(1)>')
 def test_always_review_only(self):
  self.assertEqual(build(feed([GOOD]))['mode'],'REVIEW_ONLY_NOT_PUBLISHED')
if __name__=='__main__':unittest.main()
