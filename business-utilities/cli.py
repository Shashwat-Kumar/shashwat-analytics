"""Run `python cli.py --help`. All processing is local."""
import argparse
import csv
import json
import subprocess
import sys
from pathlib import Path

import utilitykit as u


def main(argv=None):
    p = argparse.ArgumentParser(description="Business Productivity Utilities — local processing")
    sub = p.add_subparsers(dest="tool", required=True)
    for name in ("clean", "rules", "translate"):
        s = sub.add_parser(name)
        s.add_argument("input")
        s.add_argument("output")
        if name == "clean":
            s.add_argument("--keys", default="")
            s.add_argument("--required", default="")
            s.add_argument("--dates", default="")
        elif name == "rules":
            s.add_argument("--rules", required=True)
            s.add_argument("--default", default="REVIEW")
        else:
            s.add_argument("--memory", default=str(Path(__file__).parent / "samples/translation_memory.csv"))
            s.add_argument("--source", default="en")
            s.add_argument("--target", default="hi")
            s.add_argument("--column", default="text")
            s.add_argument("--engine", choices=["memory", "argos"], default="memory")
    s = sub.add_parser("campaign")
    s.add_argument("brief")
    s.add_argument("output")
    s = sub.add_parser("compare")
    s.add_argument("before")
    s.add_argument("after")
    s.add_argument("output")
    s = sub.add_parser("ocr")
    s.add_argument("image")
    s.add_argument("output")
    s.add_argument("--language", default="eng")
    s = sub.add_parser("pdf-merge")
    s.add_argument("output")
    s.add_argument("inputs", nargs="+")
    s = sub.add_parser("pdf-extract")
    s.add_argument("input")
    s.add_argument("output")
    s.add_argument("--pages", required=True, help="1-based comma-separated pages, e.g. 1,3,5")
    s = sub.add_parser("serve")
    s.add_argument("--port", type=int, default=8765)
    a = p.parse_args(argv)
    split = lambda x: [v.strip() for v in x.split(",") if v.strip()]
    try:
        if a.tool == "serve":
            from server import serve
            return serve(a.port)
        if a.tool == "pdf-merge":
            u.pdf_merge(a.inputs, a.output)
            return 0
        if a.tool == "pdf-extract":
            u.pdf_extract(a.input, a.output, [int(v) for v in split(a.pages)])
            return 0
        if a.tool == "clean":
            rows = u.clean_rows(u.read_table(a.input), split(a.keys), split(a.required), split(a.dates))
        elif a.tool == "rules":
            rows = u.evaluate_rows(u.read_table(a.input), u.read_table(a.rules), a.default)
        elif a.tool == "translate":
            rows = u.translate_rows(u.read_table(a.input), u.read_table(a.memory), a.source, a.target, a.column, a.engine)
        elif a.tool == "campaign":
            rows = u.campaigns(json.loads(Path(a.brief).read_text(encoding="utf-8")))
        elif a.tool == "compare":
            rows = u.compare_text(Path(a.before).read_text(encoding="utf-8"), Path(a.after).read_text(encoding="utf-8"))
        else:
            result = u.ocr_image(a.image, a.language)
            Path(a.output).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
            print("OCR report written; verify extracted fields before use.")
            return 0
        Path(a.output).write_text(u.csv_text(rows), encoding="utf-8-sig")
        print(f"Wrote {len(rows)} result rows to {a.output}")
        return 0
    except (ValueError, OSError, ImportError, RuntimeError, csv.Error, subprocess.SubprocessError) as exc:
        print(f"Cannot complete: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
