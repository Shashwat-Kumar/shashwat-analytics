# Validation evidence — 14 October 2026 (India)

## Verified in this build

- **21 Python tests passed**, zero skipped: CSV shapes/Unicode/quoting, formula-safe export, rule priority and numeric boundaries, missing/invalid records, audit-preserving dedupe, date validation, campaign controls, unmatched translations and lost-token detection, exact text changes, invoice fields, CLI invocation, real Tesseract OCR on a generated invoice, PDF merge/page extraction, local HTTP health and rejected cross-origin/malformed requests.
- **Browser smoke checks passed** in headless Chromium: module navigation, three matched and one unmatched translation sample, ordered rule outcomes, campaign flags, cleaning and downloaded CSV contents, custom upload with HTML-like content safely rendered as text, comparison and no-change handling, malformed CSV, formula escaping and invalid-date handling.
- **Local OCR integration passed**: the browser-generated synthetic invoice was processed by the local Python server and Tesseract, then invoice fields were extracted and verified.
- **No network requests from the core demo** before opting into a model engine.
- **Desktop and mobile rendered** at 1440px and 390px widths; no horizontal page overflow after the responsive fix. No browser JavaScript errors in the smoke run.

Run Python checks with `python -m unittest discover -s tests -v`. Optional browser checks: install Playwright plus Chromium and run `node tests/browser-smoke.cjs`; set `TEST_LOCAL_OCR=1` for the local OCR path. Browser checks require Node; end users do not.

- Browser CDN OCR was attempted but the environment blocked the library download. Its error message and local-engine fallback were verified; CDN-based recognition itself remains unverified here.

## Boundaries

Free-form Argos model inference has not been run in this environment; no model was installed. The wrapper is included, and translation-memory behaviour is verified. Human/native-speaker evaluation has not been performed on the sample translations. No production load, bank UAT, legal/compliance certification or measured efficiency gains are claimed. OCR was validated on clear synthetic printed text, not a representative document corpus. Browser and Python comparisons intentionally use different diff grouping.
