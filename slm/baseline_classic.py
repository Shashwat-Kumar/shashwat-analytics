#!/usr/bin/env python3
"""ReadSigil SLM Field Guide: the baseline to beat before you fine-tune.

A classical text classifier (TF-IDF character n-grams + logistic regression),
trained on the same 75 messages and scored on the same 25 held-out messages
as train.py. Runs on a laptop CPU in seconds; no GPU, no model download.

The settings below were fixed before the test set was scored. Do not tune them
against data/eval.jsonl: that turns the held-out check into training data.

    python -m pip install scikit-learn
    python baseline_classic.py
"""
import argparse
import json
import time
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline

LABELS = {"cards", "payments", "account", "other", "unknown"}


def load_rows(path):
    with open(path, encoding="utf-8") as handle:
        rows = [json.loads(line) for line in handle if line.strip()]
    assert rows, f"Empty dataset: {path}"
    for row in rows:
        assert row["label"] in LABELS, row
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--train", default="data/train.jsonl")
    parser.add_argument("--eval", default="data/eval.jsonl")
    parser.add_argument("--out", default="out")
    args = parser.parse_args()

    train_rows, eval_rows = load_rows(args.train), load_rows(args.eval)
    overlap = {r["message"] for r in train_rows} & {r["message"] for r in eval_rows}
    if overlap:
        raise ValueError(f"Train/eval contamination: {len(overlap)} duplicate messages")
    print(f"Train rows: {len(train_rows)}; held-out rows: {len(eval_rows)}")

    model = make_pipeline(
        TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), sublinear_tf=True),
        LogisticRegression(max_iter=2000, C=10.0),
    )
    started = time.perf_counter()
    model.fit([r["message"] for r in train_rows], [r["label"] for r in train_rows])
    train_seconds = time.perf_counter() - started

    guesses = model.predict([r["message"] for r in eval_rows])
    predictions = [
        {"message": r["message"], "expected": r["label"],
         "predicted": g, "correct": g == r["label"]}
        for r, g in zip(eval_rows, guesses)
    ]
    correct = sum(p["correct"] for p in predictions)
    per_label = {}
    for label in sorted(LABELS):
        rows = [p for p in predictions if p["expected"] == label]
        per_label[label] = f"{sum(p['correct'] for p in rows)}/{len(rows)}"

    print(f"Trained in {train_seconds:.2f} s on CPU")
    print(f"Classical baseline: {correct}/{len(predictions)} correct "
          f"({correct / len(predictions):.0%}); invalid labels: 0 (fixed label set)")
    print("By label: " + ", ".join(f"{k} {v}" for k, v in per_label.items()))
    for p in predictions:
        if not p["correct"]:
            print(f"  MISS  expected {p['expected']:<8} got {p['predicted']:<8} | {p['message']}")

    folder = Path(args.out)
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "classic_metrics.json").write_text(json.dumps({
        "method": "TF-IDF char_wb 2-5 + logistic regression (C=10)",
        "train_rows": len(train_rows), "eval_rows": len(eval_rows),
        "correct": correct, "accuracy": correct / len(predictions),
        "train_seconds": round(train_seconds, 3), "by_label": per_label,
        "predictions": predictions,
    }, indent=2), encoding="utf-8")
    print(f"Saved results to {(folder / 'classic_metrics.json').resolve()}")


if __name__ == "__main__":
    main()
