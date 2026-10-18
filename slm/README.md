# ReadSigil SLM Workshop — build a specialist, then check the evidence

An educational, reproducible fine-tuning exercise. You **adapt** a pre-trained small language model; you do not train a foundation model from random weights.

## Task
Route a *fictional* bank support message to exactly one of: `cards`, `payments`, `account`, `other`, `unknown`. No automated account actions, fraud judgements, credit decisions, or customer-facing responses.

- Base model: [Qwen2.5-0.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct), Apache-2.0.
- Adapter: LoRA via Hugging Face PEFT. The original model weights stay frozen.
- Data: 75 invented training messages, 25 separately authored test messages. The test messages are not used in training. Similar scenarios across splits are intentional for a first exercise; they are **not** representative of production traffic.
- Metrics: held-out exact-label accuracy and invalid-label count, reported for the original model and the fine-tuned model. No pre-filled scores or promised improvement.

## Run
A GPU-backed Python environment such as Colab is recommended. Download this folder or clone the ReadSigil repository.

```bash
cd slm
python -m pip install -r requirements.txt
python train.py --train data/train.jsonl --eval data/eval.jsonl --epochs 3 --rank 8
```

The script fetches the public model weights on first use (internet required), tests the unfine-tuned base, fine-tunes a LoRA adapter, and tests the adapted model on the same held-out examples. Inspect `out/metrics.json` and `out/individual_predictions.json`; the trained adapter is saved in `out/adapter/`.

To change the exercise, try `--epochs 1` vs `--epochs 3`, or `--rank 4` vs `--rank 16`, **then repeat the held-out test**. More parameters or epochs are not guaranteed to improve results.

## Do not confuse these
- **Prompting**: give a model instructions; weights unchanged.
- **Retrieval / RAG**: fetch current reference material; weights unchanged.
- **Fine-tuning / LoRA**: update trainable weights for a specific behaviour. It does not guarantee facts, truthfulness or compliance.
- **Quantization**: use lower precision to reduce model size or memory. Not training.
- **Training from scratch**: start from random weights; not what this workshop does.

## Before production
Create much larger, legally sourced and representative datasets; isolate true test data by customer, time and scenario, evaluate against prompting and non-generative classifiers, test uncommon language, class imbalance and adversarial cases, add confidence/abstention and policy controls outside the model, establish privacy controls, and measure latency, memory, throughput and infrastructure cost on **your** hardware. Treat any category emitted for a sensitive complaint as an assistive suggestion requiring human controls.

Sources: https://huggingface.co/docs/peft/quicktour ; https://huggingface.co/docs/transformers/training ; https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct
