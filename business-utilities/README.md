# Business Productivity Utilities

Six practical utilities for repetitive business work: **translation, OCR, campaign drafting, small business rule engines, document comparison and file processing**.

Built by **Shashwat Kumar**. Personal reference implementations using fictional examples; these are not published bank systems or evidence of measured employer outcomes.

## Try the HTML demo

Download [`index.html`](index.html), then double-click it in a desktop browser. The file contains its own styling, logic and sample data. No installation or account is required for the core demo.

1. Select a utility in the left menu.
2. Click its main action to run the synthetic sample, or upload/edit your own inputs.
3. Inspect the decision reasons, changes or exceptions.
4. Download the results as CSV.

**Browser OCR** downloads Tesseract.js plus model assets when clicked; it needs internet access and WebAssembly/Web Worker support. Recognition runs in the browser. Translation memory, campaign templates, the BRE, comparison and CSV cleaning need no network. The demo has no analytics or telemetry and does not send messages.

The HTML is also served by the optional local Python server below. GitHub renders source; use Download raw file to obtain runnable HTML.

## What works where

| Utility | Portable HTML | Python |
|---|---|---|
| Translation | Exact phrase memory, English → Hindi / Marathi / Bengali samples; upload your own memory; unknown text flagged | CSV/XLSX column translation; same memory logic; optional installed Argos models for free-form text |
| OCR | PNG/JPG/WEBP via Tesseract.js; editable text; invoice number, date and total extraction | Local Tesseract CLI; word confidence and coordinates; field extraction; no hosted API |
| Campaigns | Four deterministic drafts: two SMS, WhatsApp and email; supplied facts, mandatory text, blocked phrases, character limit | Same drafts and checks from JSON brief → CSV |
| Mini BRE | CSV records + editable CSV rules; ordered first-match decisions with reason codes | Same semantics on CSV/XLSX inputs; suitable for batch jobs |
| Comparison | Exact text line additions/deletions; TXT upload; 1,000-line limit | Text diff using `difflib`; grouped replacements and line references |
| File processing | Trim values, dedupe, validate required fields, normalise dates; audit and clean CSV downloads | CSV/XLSX cleaning; PDF merge and page extraction |

Translation and campaign outputs are **drafts for review**. OCR confidence is an engine score, not an assurance that an extracted value is correct. BRE rules are illustrative and do not issue loans, send campaigns or update source systems.

## Python quickstart

Python 3.10+. Download or clone the repository, then enter this folder:

```bash
cd business-utilities
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
python cli.py --help
python -m unittest discover -s tests -v
```

Core CSV utilities use Python's standard library. Optional file support:

```bash
python -m pip install -r requirements.txt
```

Examples (result filenames are local; nothing is uploaded):

```bash
python cli.py rules samples/records.csv decisions.csv --rules samples/rules.csv
python cli.py clean samples/dirty_records.csv clean_audit.csv --keys id --required id,name,email --dates joined
python cli.py campaign samples/campaign_brief.json campaign_drafts.csv
python cli.py translate samples/messages.csv translated.csv --target hi
python cli.py compare samples/before.txt samples/after.txt changes.csv
python cli.py pdf-merge combined.pdf first.pdf second.pdf
python cli.py pdf-extract combined.pdf selected.pdf --pages 1,3
```

### Local OCR

Install [Tesseract](https://tesseract-ocr.github.io/tessdoc/Installation.html) and put `tesseract` on PATH. Install the required language data (e.g. `eng`, `hin`). The Python wrapper invokes the local executable without a shell.

```bash
tesseract --list-langs
python cli.py ocr invoice.png ocr_report.json --language eng
python cli.py serve
```

Open **http://127.0.0.1:8765** and use **Read image with local Python**. It accepts images up to 8 MB in the demo and 20 megapixels on the server. Temporary OCR images are removed after processing. Scanned PDFs need conversion to images first; automatic multipage PDF OCR is not included. Printed, well-lit documents are the intended input; handwriting/layout quality varies.

### Free-form offline translation

```bash
python -m pip install '.[translation]'
```

Obtain a compatible `.argosmodel` package from the [Argos model index](https://www.argosopentech.com/argospm/index/) and install it locally using the library or Argos package manager. For example, after downloading an approved model file:

```bash
python -c "import argostranslate.package; argostranslate.package.install_from_path('translate-en_hi.argosmodel')"
python cli.py translate samples/messages.csv translated.csv --engine argos --source en --target hi
```

The model filename above is illustrative; use your downloaded filename. Available language pairs depend on installed models. Marathi/Bengali phrase-memory samples do **not** imply that Argos has those model pairs. No model is downloaded automatically by this suite. Free-form model inference was not exercised in the build environment; the memory workflow was tested. Numbers, URLs and `{placeholders}` are retained verbatim by translating the intervening segments; segmentation may reduce fluency. Named entities need reviewer verification.

## Rules and audit behaviour

Rules contain `id,field,op,value,decision,reason`. Evaluation order is CSV order; first match wins. Supported operators: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `not_in`. Membership lists use `|`. Text comparison trims whitespace and ignores case. Numeric values must be finite. All referenced fields are required; invalid records return `REVIEW` before policy evaluation. The default is **REVIEW** unless the operator explicitly changes it.

Cleaning retains every input row in the audit result. `KEEP` = first valid occurrence, `DUPLICATE` = later valid occurrence, `REVIEW` = input errors. Invalid records do not consume dedupe keys. Dates use ISO or day/month/year only. No phone, PAN or email-validity rule is implied by a non-empty required-field check.

Export columns use the reserved `__utility_` prefix. Spreadsheet formula-like values are prefixed with an apostrophe on CSV export. Leading-zero identifiers are retained as text in processing, but Excel's direct CSV opening can still coerce them; import those columns as text. XLSX uses the first sheet and does not execute formulas. Python reads formulas as strings.

## Measurement

Use [`docs/efficiency_measurement.csv`](docs/efficiency_measurement.csv) to record comparable manual and assisted runs. Record reviewer time, rework, rows/documents processed and errors against independently reviewed truth. Report measured net minutes saved, throughput and correction rate. No efficiency uplift is claimed from synthetic samples.

## Structure

- `utilitykit.py`: reusable processing functions
- `cli.py`: batch commands
- `server.py`: optional loopback-only HTML and OCR/translation bridge
- `index.html`: portable demo, no build pipeline
- `samples/`: fictional inputs and draft translation memory
- `tests/`: Python unit/integration checks and browser smoke script
- `docs/`: validation evidence, limits and efficiency template

See [validation notes](docs/VALIDATION.md) and [design notes](docs/DESIGN.md). MIT licensed within this folder.
