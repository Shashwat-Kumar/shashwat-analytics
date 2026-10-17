"""Serve the repo root over HTTPS, as GitHub Pages does, so the page's CSP
(upgrade-insecure-requests) behaves in tests exactly as it does in production.

  python tests/workshops/serve_https.py 8443 cert.pem key.pem
"""
import http.server, ssl, sys

port, cert, key = int(sys.argv[1]), sys.argv[2], sys.argv[3]
httpd = http.server.ThreadingHTTPServer(("127.0.0.1", port), http.server.SimpleHTTPRequestHandler)
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ctx.load_cert_chain(cert, key)
httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)
httpd.serve_forever()
