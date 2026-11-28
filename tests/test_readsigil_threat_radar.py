"""Adversarial tests for ReadSigil threat-radar public-source collector."""
import importlib.util
import json
from datetime import datetime, timezone
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("readsigil_radar", ROOT/".github/scripts/readsigil_threat_radar.py")
radar = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(radar)
NOW = datetime(2026,10,22,5,tzinfo=timezone.utc)

class ThreatRadarTests(unittest.TestCase):
    def posts(self):
        return [
            {"group_name":"group A","post_title":"Example Company","discovered":"2026-10-21 04:00:00"},
            {"group_name":"group A","post_title":"Example Company","discovered":"2026-10-21 04:00:00"},
            {"group_name":"group B","post_title":"Test Corp","discovered":"2026-10-20 04:00:00"}
        ]

    def kev(self):
        items=[{"cveID":f"CVE-2026-{10000+i}","dateAdded":"2026-10-21","knownRansomwareCampaignUse":"Known" if i==0 else "Unknown"} for i in range(120)]
        return {"count":len(items),"catalogVersion":"2026.10.21","dateReleased":"2026-10-21T23:12:00Z","vulnerabilities":items}

    def test_deduplicate_claims(self):
        out=radar.ransomware(self.posts(),NOW)
        self.assertEqual(out["claims"],2)
        self.assertEqual(out["groups"],2)

    def test_no_victim_data_in_public_html(self):
        html=radar.render(radar.summarize({"ransomlook":self.posts(),"cisa":self.kev()},NOW))
        for forbidden in ("Example Company","Test Corp",".onion","magnet:","<script","group A"):
            self.assertNotIn(forbidden,html)
        self.assertIn("Unverified postings",html)

    def test_input_html_never_passes_through(self):
        p=[{"group_name":"<script>alert(1)</script>","post_title":"<img onerror=alert(1)>","discovered":"2026-10-21 04:00:00"}]
        html=radar.render(radar.summarize({"ransomlook":p},NOW))
        self.assertNotIn("onerror",html)
        self.assertNotIn("alert(",html)

    def test_cisa_counts(self):
        out=radar.kev(self.kev(),NOW)
        self.assertEqual(out["added30"],120)
        self.assertEqual(out["ransomware30"],1)
        self.assertEqual(len(out["latest"]),8)

    def test_cisa_rejects_changed_schema(self):
        p=self.kev();p["count"]=len(p["vulnerabilities"])+1
        with self.assertRaises(ValueError):radar.kev(p,NOW)

    def test_cisa_rejects_unicode_id(self):
        p=self.kev();p["vulnerabilities"][0]["cveID"]="CVE-2026-１２３４"
        o=radar.kev(p,NOW)
        self.assertNotIn("CVE-2026-１２３４",str(o))

    def test_cisa_rejects_repeated_id(self):
        p=self.kev();p["vulnerabilities"][1]["cveID"]=p["vulnerabilities"][0]["cveID"]
        with self.assertRaises(ValueError):radar.kev(p,NOW)

    def test_cisa_rejects_expired_catalog(self):
        p=self.kev();p["dateReleased"]="2026-08-01T00:00:00Z"
        with self.assertRaises(ValueError):radar.kev(p,NOW)

    def test_bad_ransomlook_timestamp_does_not_publish_false_zero(self):
        p=[{"group_name":"a","post_title":"b","discovered":"unparseable"}]
        with self.assertRaises(ValueError):radar.ransomware(p,NOW)

    def test_partial_failure_reported_as_unavailable(self):
        o=radar.summarize({"ransomlook":self.posts()},NOW)
        self.assertEqual(o["status"]["cisa"],"Unavailable")
        self.assertIn("Unavailable",radar.render(o))

    def test_total_feed_failure_blocks_publication(self):
        with self.assertRaises(ValueError):radar.summarize({},NOW)

    def test_only_pinned_https_hosts(self):
        with self.assertRaises(ValueError):radar.fetch("http://127.0.0.1:8080/")

if __name__ == "__main__":
    unittest.main()
