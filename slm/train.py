#!/usr/bin/env python3
"""ReadSigil SLM Field Guide: LoRA fine-tuning with a real held-out comparison.

Use fictional examples only. Requires Python 3.10+ and the packages in requirements.txt.
"""
import argparse
import json
import random
from pathlib import Path

import torch
from peft import LoraConfig, TaskType, get_peft_model
from transformers import AutoModelForCausalLM, AutoTokenizer, Trainer, TrainingArguments

LABELS = {"cards", "payments", "account", "other", "unknown"}
SYSTEM = (
    "You route fictional bank service requests. Output exactly one lowercase label "
    "from: cards, payments, account, other, unknown. Use unknown when the request "
    "is too vague. Do not give instructions or take any account action."
)


def load_rows(path):
    with open(path, encoding="utf-8") as handle:
        rows = [json.loads(line) for line in handle if line.strip()]
    assert rows, f"Empty dataset: {path}"
    for row in rows:
        assert isinstance(row["message"], str) and row["message"].strip()
        assert row["label"] in LABELS, row
    return rows


def context(message):
    return [{"role": "system", "content": SYSTEM},
            {"role": "user", "content": message}]


class LabelDataset(torch.utils.data.Dataset):
    def __init__(self, rows, tokenizer):
        self.items = []
        for row in rows:
            prompt = tokenizer.apply_chat_template(
                context(row["message"]), tokenize=True, add_generation_prompt=True
            )
            full = tokenizer.apply_chat_template(
                context(row["message"]) + [{"role": "assistant", "content": row["label"]}],
                tokenize=True, add_generation_prompt=False
            )
            if full[:len(prompt)] != prompt:
                raise ValueError("Tokenizer template has inconsistent prefix")
            if len(full) > 256:
                raise ValueError("An example exceeds 256 tokens")
            self.items.append({
                "input_ids": full,
                "attention_mask": [1] * len(full),
                "labels": [-100] * len(prompt) + full[len(prompt):]
            })

    def __len__(self):
        return len(self.items)

    def __getitem__(self, idx):
        return self.items[idx]


def collate(features, pad_id):
    longest = max(len(item["input_ids"]) for item in features)
    return {
        "input_ids": torch.tensor([x["input_ids"] + [pad_id] *
                                   (longest - len(x["input_ids"])) for x in features]),
        "attention_mask": torch.tensor([x["attention_mask"] + [0] *
                                        (longest - len(x["input_ids"])) for x in features]),
        "labels": torch.tensor([x["labels"] + [-100] *
                                (longest - len(x["input_ids"])) for x in features])
    }


@torch.inference_mode()
def predict(model, tokenizer, message):
    model.eval()
    inputs = tokenizer.apply_chat_template(
        context(message), tokenize=True, add_generation_prompt=True,
        return_tensors="pt"
    ).to(next(model.parameters()).device)
    output = model.generate(
        input_ids=inputs, max_new_tokens=10, do_sample=False,
        pad_token_id=tokenizer.eos_token_id
    )
    text = tokenizer.decode(output[0, inputs.shape[-1]:], skip_special_tokens=True)
    label = text.strip().split(maxsplit=1)[0].strip(".,:;'\"\u0060").lower() if text.strip() else "invalid"
    return label if label in LABELS else "invalid"


def evaluate(model, tokenizer, rows, stage):
    result = []
    for row in rows:
        guess = predict(model, tokenizer, row["message"])
        result.append({
            "message": row["message"], "expected": row["label"],
            "predicted": guess, "correct": guess == row["label"]
        })
    accuracy = sum(r["correct"] for r in result) / len(result)
    invalid = sum(r["predicted"] == "invalid" for r in result)
    print(f"{stage}: {sum(r['correct'] for r in result)}/{len(result)} "
          f"correct ({accuracy:.1%}), invalid labels: {invalid}")
    return {"accuracy": accuracy, "invalid": invalid,
            "count": len(result), "predictions": result}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--train", default="data/train.jsonl")
    parser.add_argument("--eval", default="data/eval.jsonl")
    parser.add_argument("--model", default="Qwen/Qwen2.5-0.5B-Instruct")
    parser.add_argument("--epochs", type=int, default=3, choices=[1, 2, 3, 4, 5])
    parser.add_argument("--rank", type=int, default=8, choices=[4, 8, 16])
    parser.add_argument("--out", default="out")
    args = parser.parse_args()

    torch.manual_seed(42)
    random.seed(42)
    train_rows, eval_rows = load_rows(args.train), load_rows(args.eval)
    overlap = {r["message"] for r in train_rows} & {r["message"] for r in eval_rows}
    if overlap:
        raise ValueError(f"Train/eval contamination: {len(overlap)} duplicate messages")
    folder = Path(args.out)
    folder.mkdir(parents=True, exist_ok=True)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {device}; train rows: {len(train_rows)}; eval rows: {len(eval_rows)}")
    if device == "cpu":
        print("CPU mode works in principle but training and evaluation may be very slow.")
    tokenizer = AutoTokenizer.from_pretrained(args.model)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    model = AutoModelForCausalLM.from_pretrained(
        args.model, torch_dtype=torch.float16 if device == "cuda" else torch.float32
    ).to(device)
    model.config.use_cache = False

    baseline = evaluate(model, tokenizer, eval_rows, "Base (no fine-tuning)")
    config = LoraConfig(
        task_type=TaskType.CAUSAL_LM, r=args.rank, lora_alpha=2 * args.rank,
        lora_dropout=0.05, target_modules=["q_proj", "v_proj"]
    )
    model = get_peft_model(model, config)
    model.print_trainable_parameters()
    training = TrainingArguments(
        output_dir=str(folder / "checkpoints"),
        num_train_epochs=args.epochs, per_device_train_batch_size=2,
        gradient_accumulation_steps=4, learning_rate=2e-4,
        logging_steps=5, save_strategy="no", report_to="none",
        fp16=device == "cuda", seed=42, remove_unused_columns=False,
        dataloader_pin_memory=device == "cuda"
    )
    trainer = Trainer(
        model=model, args=training,
        train_dataset=LabelDataset(train_rows, tokenizer),
        data_collator=lambda examples: collate(examples, tokenizer.pad_token_id)
    )
    trainer.train()
    adapted = evaluate(model, tokenizer, eval_rows, "LoRA adapted")
    model.save_pretrained(folder / "adapter")
    tokenizer.save_pretrained(folder / "adapter")
    meta = {
        "model": args.model, "train_rows": len(train_rows),
        "eval_rows": len(eval_rows), "epochs": args.epochs,
        "rank": args.rank, "device": device, "base": {
            k: v for k, v in baseline.items() if k != "predictions"
        }, "adapted": {
            k: v for k, v in adapted.items() if k != "predictions"
        }
    }
    (folder / "metrics.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    (folder / "individual_predictions.json").write_text(
        json.dumps({"base": baseline["predictions"],
                    "adapted": adapted["predictions"]}, indent=2), encoding="utf-8"
    )
    print(f"Saved real metrics and errors to {folder.resolve()}")


if __name__ == "__main__":
    main()
