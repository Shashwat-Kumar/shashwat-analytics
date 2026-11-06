# Lights Out to Lights On: Post-Diwali AI Desk Reboot

*A free novelty item from The Signal (readsigil.com). Available until Friday 14 November 2026, 11:59 PM IST.*

Diwali 2026 falls on Sunday 8 November. Many BFSI desks thin out over Dhanteras, Diwali and the days around Bhai Dooj, then return roughly Monday to Wednesday of the following week. If you own a model, a chatbot, a scoring rule, an automated report or an AI-assisted workflow, this pack is for the morning you walk back in: a short reboot to see what ran unsupervised, what drifted, and what you need to reclaim before the first post-leave incident.

It is the twin of the Before-Diwali AI Handover Kit. That one helped you leave cleanly. This one helps you take the desk back. It is a set of prompts and a checklist, not an operating policy. Your own change, risk and incident processes always come first.

## Ground rules

- Use only synthetic, redacted or already-internal-approved material. Never paste customer data, credentials, keys or confidential configuration into a public AI tool.
- Treat every output as a first draft. You own the final reboot note; do not let a model invent causes, contacts or thresholds your logs do not show.
- If a prompt asks for something you don't know, write "unknown" rather than letting the model guess.
- Nothing here is legal, regulatory, security or operational-risk advice, and it is not about any particular institution.

## Part 1: The ten-line desk-reboot card

Fill this in from logs, tickets and your cover's notes before you change anything. It should fit on one screen.

1. **What ran while I was away:** batch jobs, scheduled scores, chatbot sessions, vendor releases, retrains or auto-reports that fired.
2. **What changed:** prompts, thresholds, model versions, feature flags, data feeds or fallbacks that differ from the pre-leave freeze.
3. **First anomaly:** the earliest alert, complaint, odd volume spike or silent miss that looks wrong, with time and source.
4. **Who touched what:** anyone who edited thresholds, prompts, configs or pause state, and under which ticket or approval.
5. **Open tickets:** incidents, change requests and vendor tickets still open from the leave window.
6. **Scheduled jobs that fired:** which ones succeeded, which failed or were skipped, and whether outputs were consumed.
7. **Pause / unpause state:** whether the system is live, paused or on fallback, and whether that matches what you left.
8. **Data freshness:** last successful feed, last score or embedding refresh, and anything still pointing at pre-leave data.
9. **Human cover notes:** what your stand-in wrote down, including "unknowns" and holding lines they used.
10. **Where the record is:** the log, ticket queue or dashboard where the reboot decisions will be written.

## Part 2: Prompts

### Prompt 1: Turn my return pile into a reboot card
```
I am back from festive leave. Below are redacted log lines, ticket titles,
alerts and cover notes from the days I was away. Turn them into a ten-line
desk-reboot card with these headings: What ran; What changed; First anomaly;
Who touched what; Open tickets; Scheduled jobs that fired; Pause/unpause state;
Data freshness; Human cover notes; Where the record is.
Rules: keep my wording for any number, name, timestamp or ticket id; write
"UNKNOWN - confirm before changing anything" for gaps; do not invent causes,
contacts or thresholds.
Return pile:
[paste redacted notes]
```

### Prompt 2: Separate festive noise from real drift
```
Festive weeks often change volumes, timing and request types. Using only the
reboot card and notes below, list (a) patterns that look unusual but are
probably seasonal for a Diwali week in financial services, and (b) patterns
that still deserve a call even in a festive week. Flag every assumption.
Do not invent baselines I did not give you.
Card and notes:
[paste]
```

### Prompt 3: First anomaly triage in under ten minutes
```
Here is the first anomaly from my reboot card [paste]. Write a numbered
ten-minute triage: what to check first, what to leave alone, when to stop and
escalate, and what evidence to capture. Each step must be something a returning
owner can do without redeploying. If the card lacks a fact needed for a step,
write "NOT IN CARD - confirm before acting" instead of guessing.
```

### Prompt 4: Diff the freeze against what actually changed
```
Pre-leave change freeze (redacted):
[paste]
Observed changes while I was away (redacted):
[paste]
Produce a plain table: Change | In freeze? | Who/what touched it | Risk if left |
Action today (keep / revert / ticket). Do not invent people or approvals.
Mark unknowns clearly.
```

### Prompt 5: Reclaim note for the team
```
Draft a short internal note (under 120 words) I can send on my first morning
back. It should say I have rebooted the desk, what is confirmed normal, what is
still under review, and that no one should change prompts, thresholds or pause
state until the reboot note is filed. Calm tone, no blame, no customer-facing
promises. Base it only on:
[paste reboot card summary]
```

### Prompt 6: Cover debrief questions
```
I need a 15-minute debrief with the person who covered my AI desk. From this
reboot card, write eight short questions that surface what they saw, what they
changed, what they almost changed, and what still worries them. Then write the
answer shape each question is checking for, taken only from the card.
Card:
[paste]
```

### Prompt 7: Silent-failure hunt
```
Using only these redacted metrics and log summaries from the leave window
[paste], list places where an AI-assisted system could have failed quietly:
outputs that looked fine but were stale, fallbacks that stayed on, scores that
ran on thin data, or tickets closed without a root cause. For each, say what
evidence would confirm or clear it. Do not invent metrics I did not provide.
```

### Prompt 8: One permanent fix from the week
```
From this reboot card and open tickets [paste], propose one permanent fix worth
doing this week (not ten). State the problem in one sentence, the fix in three
bullets, the owner role (not a name), and how we will know it worked. If the
notes do not support a clear fix, say so and stop.
```

## Part 3: First-morning checklist

- [ ] Reboot card filled from logs and cover notes before any change.
- [ ] Pause / unpause state matches what you intended to leave.
- [ ] Data freshness checked (feeds, scores, embeddings, reports).
- [ ] Scheduled jobs that fired during leave reviewed (success, skip, fail).
- [ ] Threshold, prompt and model-version diffs against the pre-leave freeze listed.
- [ ] Open tickets from the leave window owned or explicitly deferred.
- [ ] Cover debrief done (or scheduled the same morning).
- [ ] Reclaim note sent; change freeze held until the reboot note is filed.
- [ ] Reboot decisions written where the record lives.

## Why this expires

It is built for the return window after Diwali, when owners reclaim desks that ran without them. After Friday 14 November 2026 the download comes down from the Novelty shelf.

---
Made for The Signal at readsigil.com. Free to use and adapt. Nothing here is legal, regulatory, security or operational-risk advice, and it is not about any particular institution.
