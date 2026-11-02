# The Before-Diwali AI Handover Kit

*A free novelty item from The Signal (readsigil.com). Available until Saturday 7 November 2026, 11:59 PM IST.*

Diwali 2026 falls on Sunday 8 November, with Dhanteras on Friday 6 November and Bhai Dooj on Wednesday 11 November. Many teams thin out that week. If you own a model, a chatbot, a scoring rule, an automated report or an AI-assisted workflow, this kit helps you leave it in a state someone else can watch, and safely stop, while you are away.

It is a set of prompts and a checklist, not an operating policy. Your own change, risk and incident processes always come first.

## Ground rules

- Use only synthetic, redacted or already-internal-approved material. Never paste customer data, credentials, keys or confidential configuration into a public AI tool.
- Treat every output as a first draft. The person handing over owns the final note; the person receiving it should read it back to you before you leave.
- If a prompt asks for something you don't know, write "unknown" rather than letting the model guess.

## Part 1: The ten-line handover card

Fill this in by hand first. It should fit on one screen.

1. **What it is:** one sentence, in plain words.
2. **Who uses its output:** teams or customers, and what they do with it.
3. **What "normal" looks like:** two or three numbers or signs you check, with their usual range.
4. **What "wrong" looks like:** the first symptom someone would notice.
5. **How to pause it safely:** the exact switch, flag or fallback, and who is allowed to use it.
6. **What happens when it is paused:** the manual or fallback process, and its cost.
7. **Change freeze:** what must not be changed while you are away (prompts, thresholds, model versions, data feeds).
8. **Scheduled events while you're away:** batch runs, retraining, vendor releases, month-end jobs.
9. **Who to call, in order:** primary cover, backup, and the escalation owner, with the hours each is reachable.
10. **Where the record lives:** the log, ticket queue or dashboard where decisions and incidents get written down.

## Part 2: Prompts

### Prompt 1: Turn my notes into a handover card
```
I am handing over an AI-assisted system for about a week. Below are my rough notes
(synthetic/redacted). Turn them into a ten-line handover card with these headings:
What it is; Who uses its output; What normal looks like; What wrong looks like;
How to pause it safely; What happens when paused; Change freeze; Scheduled events;
Who to call; Where the record lives.
Rules: keep my wording for any number, threshold or name; write "UNKNOWN - ask owner"
for anything my notes don't cover; do not invent contacts, thresholds or steps.
Notes:
[paste notes]
```

### Prompt 2: Find the gaps a stand-in would trip over
```
Read this handover card as if you were a capable colleague who has never seen the
system. List the ten questions you would most likely need answered at 11 PM on a
holiday, ranked by how badly things could go if nobody could answer. For each,
say which line of the card should be expanded.
Card:
[paste card]
```

### Prompt 3: Write the "first hour" runbook for the most likely failure
```
Using only the information in this handover card, write a numbered first-hour
runbook for this symptom: [describe symptom]. Each step should be something a
non-specialist can do or check. Mark clearly the step where they should stop and
call the escalation owner. If the card doesn't say how to do a step, write
"NOT IN CARD - confirm with owner before leaving" instead of guessing.
Card:
[paste card]
```

### Prompt 4: Holiday-week drift check
```
Festive weeks often change the inputs to automated systems: volumes spike or
collapse, timing shifts, new kinds of requests appear. For the system described
below, list the input patterns that might look unusual during a festive week but
are probably seasonal, and the ones that would still deserve a call even in a
festive week. Keep it to the information given and flag assumptions.
System description:
[paste description]
```

### Prompt 5: Plain-language holding line
```
Draft a short, calm holding line that a service or operations colleague could
use if this system is paused while I'm away. It should say what is affected,
what the customer or colleague should do instead, and that we will update them.
No promises about timing, no technical jargon, under 60 words. Give two
versions: one for internal colleagues and one for customers.
What is affected when paused:
[describe]
```

### Prompt 6: Read-back test
```
Here is my handover card. Write five short questions I should ask my cover
person to answer from memory before I leave, so I know the handover actually
landed. Then write the answers each question is checking for, taken only from
the card.
Card:
[paste card]
```

### Prompt 7: Return-day note
```
I'm back from leave. Here are the log entries, alerts and messages from the week
(redacted). Summarise in under 150 words: what happened, what was changed and by
whom, anything still open, and anything that should become a permanent fix.
Do not infer causes the entries don't state.
Entries:
[paste entries]
```

## Part 3: Five-minute pre-leave checklist

- [ ] Handover card written and read back by your cover.
- [ ] Pause switch tested, or at least confirmed to exist and be documented.
- [ ] Change freeze agreed and written down.
- [ ] Scheduled jobs for the week listed, including vendor releases.
- [ ] Escalation contacts confirmed with the people themselves, including their availability.
- [ ] Out-of-office message points to your cover, not to the system.

## Why this expires

It is built for the days just before Diwali, when handovers actually happen. After Saturday 7 November 2026 the download comes down from the Novelty shelf.

---
Made for The Signal at readsigil.com. Free to use and adapt. Nothing here is legal, regulatory, security or operational-risk advice, and it is not about any particular institution.
