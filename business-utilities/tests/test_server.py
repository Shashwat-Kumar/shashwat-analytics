import json
import sys
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from server import Handler


class LocalServerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.url = f'http://127.0.0.1:{cls.server.server_port}'
        cls.client = urllib.request.build_opener(urllib.request.ProxyHandler({}))

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def test_health_and_html(self):
        with self.client.open(self.url+'/api/health') as r:
            self.assertTrue(json.load(r)['local'])
        with self.client.open(self.url) as r:
            self.assertIn(b'Business Utilities', r.read())

    def test_untrusted_origin_blocked(self):
        request = urllib.request.Request(self.url+'/api/ocr', data=b'{}',
                    headers={'Content-Type':'application/json','Origin':'https://untrusted.example'})
        with self.assertRaises(urllib.error.HTTPError) as ctx:
            self.client.open(request)
        self.assertEqual(ctx.exception.code, 403)

    def test_source_files_not_served(self):
        with self.assertRaises(urllib.error.HTTPError) as ctx:
            self.client.open(self.url+'/utilitykit.py')
        self.assertEqual(ctx.exception.code, 404)

    def test_malformed_payload_returns_error(self):
        request = urllib.request.Request(self.url+'/api/ocr', data=b'bad', headers={'Content-Type':'application/json'})
        with self.assertRaises(urllib.error.HTTPError) as ctx:
            self.client.open(request)
        self.assertEqual(ctx.exception.code, 400)


if __name__ == '__main__':
    unittest.main()
