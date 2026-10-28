"""Verify v0.3 build reproducibility, release separation and headers."""
import json
import sys
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from build_release import build,digest,TPL,PAGE,MANIFEST,PUBLIC_HEADERS,STAGING_HEADERS
class TestReleaseBuild(unittest.TestCase):
    def test_byte_for_byte_reproducible(self):
        for p, expected in build().items():
            self.assertTrue(p.exists(),str(p))
            self.assertEqual(p.read_bytes(),expected,str(p))
    def test_digest_semantics(self):
        doc=json.loads(MANIFEST.read_text())
        html=PAGE.read_text()
        self.assertEqual(doc['sourceTemplateSha256'],digest(TPL.read_bytes()))
        self.assertEqual(doc['releasePageSha256'],digest(PAGE.read_bytes()))
        self.assertNotEqual(doc['sourceTemplateSha256'],doc['releasePageSha256'])
        self.assertIn("const BUILD_FINGERPRINT='"+doc['sourceTemplateSha256']+"'",html)
    def test_hosting_gates(self):
        self.assertNotIn('noindex',PAGE.read_text().lower())
        self.assertNotIn('X-Robots-Tag',PUBLIC_HEADERS.read_text())
        self.assertIn('X-Robots-Tag: noindex',STAGING_HEADERS.read_text())
        for p in (PUBLIC_HEADERS,STAGING_HEADERS):
            self.assertIn("frame-ancestors 'none'",p.read_text())
            self.assertIn('X-Content-Type-Options: nosniff',p.read_text())
    def test_live_feed_remains_disabled(self):
        self.assertEqual(json.loads(MANIFEST.read_text())['liveIngestion'],'DISABLED_REVIEW_ONLY')
    def test_approvals_pending(self):
        self.assertTrue(all(v!='APPROVED' for v in json.loads(MANIFEST.read_text())['releaseGates'].values()))
if __name__=='__main__': unittest.main()
