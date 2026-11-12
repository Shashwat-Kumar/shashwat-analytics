"""Compile the AI Builder 500 bank, balance answer positions and enforce the quality gate.
Usage: python3 build.py [--write]   (prints the gate report; --write emits questions.json)
"""
import importlib.util, json, random, re, sys, statistics as st, collections, pathlib

HERE = pathlib.Path(__file__).parent
TRACKS = [("evals", "E", ["evals_a", "evals_b"]), ("prototype", "P", ["proto_a", "proto_b"]),
          ("architecture", "A", ["arch_a", "arch_b"]), ("agents", "G", ["agents_a", "agents_b"]),
          ("mcp", "M", ["mcp_a", "mcp_b"])]
MODULES = {"evals": "Write & run evaluations", "prototype": "Prototype with code",
           "architecture": "Model & architecture tradeoffs", "agents": "Automate with agents", "mcp": "LLMs with MCP"}
LEVEL = {"F": "Foundation", "P": "Practitioner", "A": "Architect"}
KIND = {"C": "Concept", "S": "Scenario", "K": "Code", "N": "Calculation", "T": "Trace"}
ABSURD = re.compile(r"\b(forever|never affects|always obey|every user instruction|replacement for encryption)\b", re.I)


def load(name):
    p = HERE / f"{name}.py"
    if not p.exists():
        return []
    spec = importlib.util.spec_from_file_location(name, p)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m.QS


def build():
    out, problems = [], []
    for module, prefix, files in TRACKS:
        rows = [r for f in files for r in load(f)]
        if not rows:
            continue
        order = {"F": 0, "P": 1, "A": 2}
        rows = sorted(rows, key=lambda r: order[r[0]])  # stable within level
        # balanced positions: equal share of 0-3, shuffled deterministically per track
        pos = [i % 4 for i in range(len(rows))]
        random.Random(f"rs-{module}-v2").shuffle(pos)
        for n, (r, p) in enumerate(zip(rows, pos), 1):
            level, kind, stem, code, correct, wrong, expl = r
            if len(wrong) != 3:
                problems.append(f"{prefix}-{n:03d}: needs 3 wrong options"); continue
            opts = list(wrong); opts.insert(p, correct)
            q = {"id": f"{prefix}-{n:03d}", "module": module, "number": n, "level": LEVEL[level],
                 "kind": KIND[kind], "stem": stem, "options": opts, "correct": p, "explanation": expl}
            if code:
                q["code"] = code
            if len(set(o.strip().lower() for o in opts)) != 4:
                problems.append(f"{q['id']}: duplicate options")
            if any(ABSURD.search(o) for o in wrong):
                problems.append(f"{q['id']}: absurd distractor")
            if len(expl.split()) < 25:
                problems.append(f"{q['id']}: explanation too thin ({len(expl.split())} words)")
            if re.search(r"\b(option|answer) [A-D]\b|\b[A-D]\)", expl):
                problems.append(f"{q['id']}: explanation refers to a letter (positions are shuffled)")
            out.append(q)
    return out, problems


def report(qs, problems):
    print(f"questions: {len(qs)}")
    print("per module:", dict(collections.Counter(q['module'] for q in qs)))
    print("levels:", dict(collections.Counter((q['module'][:4], q['level'][0]) for q in qs)))
    print("kinds:", dict(collections.Counter(q['kind'] for q in qs)))
    print("answer positions:", dict(sorted(collections.Counter(q['correct'] for q in qs).items())))
    longest = [q for q in qs if max(range(4), key=lambda i: len(q['options'][i])) == q['correct']]
    share = len(longest) / max(len(qs), 1)
    print(f"longest option is correct: {len(longest)} ({share:.0%})  [gate <= 30%; random = 25%]")
    shortest = [q for q in qs if min(range(4), key=lambda i: len(q['options'][i])) == q['correct']]
    sshare = len(shortest) / max(len(qs), 1)
    print(f"shortest option is correct: {len(shortest)} ({sshare:.0%})  [gate <= 35%]")
    ratio = st.median(len(q['options'][q['correct']]) / (sum(len(o) for i, o in enumerate(q['options']) if i != q['correct']) / 3) for q in qs)
    print(f"median correct/distractor length ratio: {ratio:.2f}  [gate 0.85-1.15]")
    print("median explanation words:", st.median(len(q['explanation'].split()) for q in qs))
    stems = collections.Counter(q['stem'] for q in qs)
    dup = [s for s, c in stems.items() if c > 1]
    if dup: problems.append(f"duplicate stems: {dup[:3]}")
    with_artifact = sum(1 for q in qs if q.get('code') or re.search(r"\d", q['stem']))
    print(f"questions with code, trace or figures: {with_artifact}")
    # worst offenders for the length tell
    worst = sorted(longest, key=lambda q: -len(q['options'][q['correct']]) / max(len(o) for i, o in enumerate(q['options']) if i != q['correct']))[:12]
    for q in worst:
        r = len(q['options'][q['correct']]) / max(len(o) for i, o in enumerate(q['options']) if i != q['correct'])
        print(f"   tell {r:.2f} {q['id']}: {q['options'][q['correct']]}")
    permod = {}
    for mod in sorted(set(q['module'] for q in qs)):
        mq = [q for q in qs if q['module'] == mod]
        permod[mod] = sum(1 for q in mq if max(range(4), key=lambda i: len(q['options'][i])) == q['correct']) / len(mq)
    shortmod = {}
    for mod in sorted(set(q['module'] for q in qs)):
        mq = [q for q in qs if q['module'] == mod]
        shortmod[mod] = sum(1 for q in mq if min(range(4), key=lambda i: len(q['options'][i])) == q['correct']) / len(mq)
    print("shortest-correct by track:", {k: f"{v:.0%}" for k, v in shortmod.items()})
    if any(v > 0.35 for v in shortmod.values()): problems.append("a track exceeds the 35% shortest-correct gate")
    rankmod = {}
    for mod in sorted(set(q['module'] for q in qs)):
        mq = [q for q in qs if q['module'] == mod]
        ranks = collections.Counter(sorted(range(4), key=lambda i: (len(q['options'][i]), i)).index(q['correct']) for q in mq)
        rankmod[mod] = [round(ranks[r] / len(mq) * 100) for r in range(4)]
    print("correct-answer length rank % (shortest..longest) by track:", rankmod)
    if any(max(v) > 40 for v in rankmod.values()): problems.append("a track has a length-rank tell above 40%")
    print("longest-correct by track:", {k: f"{v:.0%}" for k, v in permod.items()})
    if any(v > 0.30 for v in permod.values()): problems.append("a track exceeds the 30% longest-correct gate")
    gate = share <= 0.30 and sshare <= 0.35 and 0.85 <= ratio <= 1.15 and not problems
    for p in problems: print("PROBLEM:", p)
    print("GATE:", "PASS" if gate else "FAIL")
    return gate


if __name__ == "__main__":
    qs, problems = build()
    ok = report(qs, problems)
    if "--write" in sys.argv:
        pack = {"version": "2026-11-12", "modules": MODULES, "questions": qs}
        (HERE / "questions.json").write_text(json.dumps(pack, ensure_ascii=False, separators=(",", ":")))
        print("wrote questions.json")
    sys.exit(0 if ok else 1)
