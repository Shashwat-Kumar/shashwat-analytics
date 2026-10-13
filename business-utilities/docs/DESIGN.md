# Design and operating boundaries

## Data flow

Input CSV / image / text → validation → deterministic utility (or installed OCR / translation engine) → reviewable output → local download.

The portable HTML executes browser logic. It does not run Python. When served by `python cli.py serve`, two same-origin JSON routes invoke local Python for OCR and free-form Argos translation. Other demo operations still execute locally in JavaScript. Python batch tools work independently of the demo.

## Decisions

- Offline defaults avoid credentials and external document processing.
- Translation memory uses whole-cell matches, so unknown language output cannot be mistaken for a successful translation.
- Campaign generation uses supplied facts and explicit templates. It does not invent rates, product eligibility, urgency or personalised financial claims.
- BRE data errors are resolved before first-match rules. `REVIEW` is the default outcome.
- No `eval`, shell-generated rules or user SQL is executed.
- DOM output uses text nodes; user document contents are not inserted as HTML.
- CSV exports neutralise formula-leading characters. The apostrophe is a deliberate export transformation, not lossless archival formatting.
- Local HTTP requests require loopback Host and a matching Origin if one is supplied; no CORS is enabled. JSON bodies are bounded. This is a local desktop helper, not a multiuser service.
- Browser OCR loads third-party execution code and model files only on explicit use. For a controlled deployment, vendor and review these assets or use local Python OCR. The CDN provider sees normal asset requests; documents are not intentionally uploaded by this application.

## Limits

No authentication, central audit store, background queue, message delivery, customer-system integration, legal review or production monitoring. Do not expose the local helper on a network. In-memory processing may be unsuitable for large workbooks. OCR field regexes are simple invoice helpers, not general document understanding. Campaign character limits do not estimate GSM/UCS-2 message segments or provider charges. Python and browser text-diff output grouping differs, though both preserve original changed lines. Translation quality and preservation of names need human review.

## Extending

Add a function in `utilitykit.py`, expose a CLI subcommand, supply synthetic fixtures, test at least one realistic success and failure path, then add a clearly bounded demo. For new BRE semantics, preserve ordered evaluation or version the rules format. For real unit deployment, obtain accepted input/output schemas and owner-approved rules, then validate against that unit's reconciled cases.
