# ReadSigil Threat Signals · pilot 001

This is a deliberately **non-deployed, editorially gated** pilot for ReadSigil. It combines a verified CERT-In advisory (CIAD-2026-0049, issued October 15, 2026) with a *fictional* three-decision tabletop exercise and a self-reported control-evidence checklist. The download is a JSON decision record, not a compliance or cyber-safety certificate.

## Run locally

Open `threat-signals/index.html` directly or run `python -m http.server 8000` and visit `/threat-signals/`. No API keys, third-party JavaScript, cookies, analytics or backend needed. Run `python -m unittest discover -s tests -v` from the extracted bundle.

The future full-stack pipeline is prototyped separately in `scripts/build_threat_signals.py`. It ingests only CISA's official KEV JSON, validates schema and dates, removes malformed records and duplicates, and writes a **review-only** artifact. Example: `python scripts/build_threat_signals.py --input tests/fixtures/cisa-small.json --output build/pending-cisa-kev.json`.

## Non-goals and security boundaries

- No Tor, scraping, stolen data, personal identifiers, victim lists, or raw malicious URLs.
- Source and exercise facts must not be conflated. Editorial sign-off is required before any signal becomes visible to visitors.
- No active attack detection, penetration testing, continuous monitoring or incident classification.
- No security guarantees from checkbox responses; no fabricated risk score.
- No unreviewed ingestion data ever auto-publishes, and no automated change to the live ReadSigil website.

## Release gates (unmet)

1. Security review of dependency inventory, CSP, hosting, link handling and DOM update patterns.
2. Independent accuracy review of advisory excerpts and editorial interpretation.
3. Accessibility and responsive browser tests (screen readers and mobile devices).
4. Staging deployment to a distinct, non-indexed host; then stakeholder UAT.
5. Operational telemetry, correction process, expiry handling, change approval and review owner.

## Commercial follow-on

Validate whether financial institutions would pay to turn new threat signals into actionable owner-assigned work, not generic intelligence dashboards. All enterprise features—including tenants, RBAC, authentication, audit log integrity, evidence attachment handling, secure storage, privacy impact and hosting—are **future work** and not implied by this prototype.
