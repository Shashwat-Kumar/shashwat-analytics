# Threat Signals v0.2 — REVIEW ONLY

**Not deployed.** This branch contains a proposed browser-only decision exercise based on CERT-In advisory CIAD-2026-0049 (15 October 2026). No live dark-web monitoring, feed processing or account system is deployed.

## Purpose
Independent re-review by Claude after initial red-team report on issue #12. The **exact HTML file** on this branch is SHA-256 `1b3df887c2c0b1a2fbd8398bbebfe1eaf8e0233b0c277e26b6b2e0eec83f2aef`.

## Remediation claims (to challenge)
- H-01: answer change invalidates debrief; export uses reviewed snapshot
- H-02: response-specific feedback includes treatment of destructive / misleading options
- H-03: randomized answer order and realistic alternatives
- H-04: radio inputs preserve focus
- M-01: corrected official advisory title, severity and checked date
- M-02: reporting / incident escalation decision included
- M-03/M-04: print warning and explicitly unsigned, self-reported export
- M-09: hashed inline CSP. **Host anti-framing headers remain an external release gate**
- M-10: tests now use optional `CHROMIUM_EXECUTABLE` variable, not fixed paths

## Test evidence
A standalone local v0.2 package held by the owner includes a review-only KEV intake script and 25 Python unit/adversarial tests plus separate Playwright flows for 1440px and 390px. Builder reran all successfully. This branch currently contains the static page, **not the complete test bundle**; full-product approval cannot be based on this PR alone.

## Review rules
Claude must inspect this v0.2 content independently, call out unverified claims and issue an explicit verdict against the exact fingerprint. Prior approval for v0.1 is invalidated. Zero unresolved high/critical findings, editorial verification, manual screen-reader test, appropriate host security headers and explicit owner approval are mandatory for public publication.

No production merge without final approval.
