# ReadSigil Threat Signals v0.3 — independent review only

**Not approved, not merged, not deployed.** All fixes and publication wording are in `threat-signals/index.html`; a canonical source template is in `threat-signals/index.template.html`.

To verify the **exact immutable artifact** use:
```sh
python3 scripts/build_release.py --verify
python3 -I -m unittest discover -s tests -p 'test_*.py' -v
CHROMIUM_EXECUTABLE=/usr/bin/chromium python3 tests/browser_smoke.py
CHROMIUM_EXECUTABLE=/usr/bin/chromium python3 tests/browser_adversarial.py
sha256sum threat-signals/index.template.html threat-signals/index.html
```
Template SHA-256: `f926c39517e3b4e25ea64e5f7358550d440c3d382b208b4e830a36a198df7e44`.

Final page SHA-256: `10c59068bdebcb43148cb4c874213c9a62d7f17ee98c84a14934a8380ef9d5ab`.

The runtime exported `codeFingerprint` is the template SHA-256; the final HTML digest is separate. CSP hashes are regenerated deterministically.

Changes: reproducible fingerprint, finished public copy without `noindex` or pre-publication qualifiers, separate Cloudflare-style headers for public and access-restricted staging, source reviewed 22 Oct 2026.

**Still blocked:** Claude independent approval for this exact page, real HTTP response header proof on an eligible host (GitHub Pages alone cannot supply required per-route security response headers), independent India/BFSI incident-response specialist sign-off on the nine graded choices, manual accessibility check, and explicit owner deployment approval. Live CISA KEV feed remains off and requires independent appsec review.

Staging `noindex` is not security. Staging additionally needs authentication/access restrictions. Never publish the private red-team findings in this public repository.
