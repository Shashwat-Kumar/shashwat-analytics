"""Optional loopback-only server. No uploads persist and no external API is called."""
import base64
import json
import tempfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

import utilitykit as u

ROOT = Path(__file__).resolve().parent
MAX_BODY = 12 * 1024 * 1024


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass  # Don't log user documents or requests.

    def allowed(self):
        expected = f"127.0.0.1:{self.server.server_port}"
        if self.headers.get("Host") != expected:
            return False
        origin = self.headers.get("Origin")
        return origin is None or origin == "http://" + expected

    def send(self, body, status=200, mime="application/json; charset=utf-8"):
        payload = body if isinstance(body, bytes) else json.dumps(body, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        if not self.allowed():
            return self.send({"error": "Untrusted host or origin"}, 403)
        path = urlsplit(self.path).path
        if path in ("/", "/index.html"):
            return self.send((ROOT / "index.html").read_bytes(), mime="text/html; charset=utf-8")
        if path == "/api/health":
            return self.send({"version": u.VERSION, "local": True})
        self.send({"error": "Not found"}, 404)

    def do_POST(self):
        if not self.allowed() or self.headers.get("Content-Type", "").split(";")[0] != "application/json":
            return self.send({"error": "Same-origin JSON requests only"}, 403)
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if not 0 < size <= MAX_BODY:
                return self.send({"error": "Request must be between 1 byte and 12 MB"}, 413)
            data = json.loads(self.rfile.read(size))
            if self.path == "/api/translate":
                if len(data.get("rows", [])) > 1000:
                    raise ValueError("Maximum 1,000 translation rows per request")
                result = u.translate_rows(data["rows"], data.get("memory", []), data.get("source", "en"),
                                          data.get("target", "hi"), "text", "argos")
                return self.send({"rows": result})
            if self.path == "/api/ocr":
                raw = base64.b64decode(data["image"], validate=True)
                from PIL import Image
                import io
                image = Image.open(io.BytesIO(raw))
                if image.width * image.height > 20_000_000:
                    raise ValueError("Image must be below 20 megapixels")
                with tempfile.TemporaryDirectory() as tmp:
                    path = Path(tmp) / "input.png"
                    image.convert("RGB").save(path)
                    result = u.ocr_image(path, data.get("language", "eng"))
                return self.send(result)
            self.send({"error": "Not found"}, 404)
        except Exception as exc:
            self.send({"error": str(exc)}, 400)


def serve(port=8765):
    print(f"Open http://127.0.0.1:{port} — Ctrl+C to stop")
    with ThreadingHTTPServer(("127.0.0.1", port), Handler) as server:
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
    return 0
