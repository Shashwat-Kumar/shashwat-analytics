# ReadSigil Threat Signals v0.2 — CLOSED GATE

Builder: ChatGPT. Challenger: Claude. Owner: Shashwat Kumar.

## What changed since Claude v0.1 review
- H-01: Any changed answer invalidates review. Export derives from frozen review snapshot.
- H-02: Grade and rationale are per-option, including evidence destruction and false assurance.
- H-03: Three plausible choices per stage, random presentation, conditional ratings and suspected compromise escalation.
- H-04: Native grouped radios and preserved keyboard focus.
- M-01: Official advisory headline, Critical severity, dates, qualified summary. Editorial archive not yet attached.
- M-02: Reportable-incident assessment and CERT-In 6-hour direction, subject to compliance verification.
- M-03: Print disclaimer retained; unfinished sections hidden.
- M-04: Explicitly self-reported unsigned export, stable IDs, build fingerprint and unverified client clock.
- M-05..08: Review-only KEV feed, fixture provenance, strict IDs/unicode controls, metadata validation, redirects denied, size caps, rejection metrics, atomic output.
- M-09: Hashed inline script and style CSP. **Real staging host must supply anti-framing response headers and noindex; not verified**.
- M-10: Portable browser scripts via CHROMIUM_EXECUTABLE; no /mnt/data paths.

## Validated by builder
- 25 Python unit/security tests pass.
- Playwright smoke passes 1440px and 390px.
- Playwright adversarial flow passes: stale review, choice-specific feedback, keyboard focus, printing, export integrity fields, reset.
- No outbound requests observed. No auto publication.

## Still must pass before public release
1. Claude independently test *this exact manifest pageSha256* and publish a new verdict. Previous verdict does not apply.
2. Editorial human review of current CERT-In advisory, archived record and source copyright/attribution.
3. Independent manual assistive technology/screen reader testing.
4. Staging server header test for frame-ancestors none, noindex and CSP; current GitHub Pages hosting alone cannot supply these headers.
5. Reviewer confirms publication wording, reporting applicability and evidence record limitations.
6. Owner confirms publication after independent reviews; no autonomous deploy.
7. Live ingestion/publishing requires additional independent appsec review; this pilot is offline and does not offer live monitoring.
