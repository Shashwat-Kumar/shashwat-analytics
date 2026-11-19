# The Peak-Weekend Agent-Order Watch Card

*A free novelty item from The Signal (readsigil.com). Available until Saturday 28 November 2026, 11:59 PM IST.*

Black Friday falls on Friday 27 November 2026 and Cyber Monday on Monday 30 November. If your team prepared for AI shopping agents before the change freeze, the next question is what you do *during* the weekend, when an odd pattern shows up at 2 AM and the person who wrote the rule is asleep.

This card is a pre-commitment device. You fill it in **before** Friday, while everyone is calm and in the same room, so that the decisions made during the peak are ones the team already agreed to, not ones improvised by whoever happens to be on call. It is the in-the-moment companion to The Agent-Shopper Peak-Week Drill (which was about preparing before the freeze).

It has four parts:

1. A one-page watch card (fill in before Friday 27 November)
2. Seven prompts to help you fill it and use it
3. A thirty-minute pre-weekend huddle checklist
4. A Tuesday 1 December debrief template

**Ground rules.** Use only synthetic or redacted material with any AI assistant. Do not paste real customer data, card numbers, account numbers or live rule thresholds into a public tool. Your own fraud, risk, incident and change-management processes come first; this card only helps you write down what they already say.

---

## Part 1. The watch card

Print it, pin it in the incident channel, and keep it to one page.

| # | Line | What to write |
|---|---|---|
| 1 | **What we're watching** | The three to five signals that would tell you agent-initiated orders are behaving differently from people (for example: share of orders from known agent user-agents or tokens, step-up challenge failure rate, declines by reason code, refund/dispute requests citing "I didn't order this", service contacts mentioning an assistant). Name where each one is visible. |
| 2 | **What normal looks like** | For each signal, the range you'd call normal for a peak day. Use last year's peak or a recent sale day, not an ordinary Tuesday. If you don't have a baseline, write "no baseline" honestly. |
| 3 | **Tripwires** | The pre-agreed level at which someone must look, and the level at which someone must act. Two numbers per signal, agreed now. |
| 4 | **Who decides** | One named owner per decision, with a named backup, for each shift. "The fraud team" is not an owner. |
| 5 | **Allowed moves** | The actions the on-call person may take *without* waking anyone (for example: add a step-up for one segment, raise a velocity limit within a set band, switch a service bot to a holding line). |
| 6 | **Moves that need a second person** | Anything that blocks a whole channel, changes a model, touches customer communication, or reverses an earlier decision. |
| 7 | **Holding lines** | Two or three plain sentences for service teams if customers ask "why was my assistant's order declined?" or "my assistant bought the wrong thing". Approved by whoever normally approves customer wording. |
| 8 | **Stop-the-line condition** | The single situation in which you pause agent-initiated orders entirely, and who can call it. |
| 9 | **Log** | Where every decision is written down, with time (state the time zone), signal, decision and who made it. |
| 10 | **Debrief slot** | The date, time and owner of the Tuesday 1 December debrief (Part 4). Book it now. |

---

## Part 2. Seven prompts

Use these with any general-purpose AI assistant, on synthetic or redacted inputs only. Replace the bracketed parts.

**Prompt 1: Draft the signal list**
> I run [fraud / payments / checkout / service] for [type of business, region]. During a peak shopping weekend, some orders may be placed by AI shopping agents acting for customers. Suggest five signals we could watch that would show agent-initiated orders behaving differently from human ones. For each, say where it would usually be visible (logs, dashboards, dispute queue, service tickets) and one way it could mislead us. Do not invent statistics.

**Prompt 2: Turn vague worries into tripwires**
> Here are our signals and our rough normal ranges from a previous sale day: [synthetic or rounded figures]. For each signal, propose a "look" tripwire and an "act" tripwire, and explain the trade-off between catching problems early and paging people for noise. Flag any signal where we have no real baseline.

**Prompt 3: Stress-test who decides**
> Here is our draft "who decides" list for Friday 27 to Monday 30 November: [roles and shifts, no personal data]. Find the gaps: hours with no owner, decisions with two owners, decisions that need someone who is on leave, and any decision where the on-call person would have to guess. Answer as a short list.

**Prompt 4: Separate allowed moves from second-person moves**
> Here are actions our on-call team might take during the peak: [list]. Sort them into "on-call may do alone, within limits" and "needs a second person", and say why for each. Suggest the limit for each solo action.

**Prompt 5: Write holding lines**
> Write three plain-English holding lines (under 40 words each) a service agent could use when a customer says (a) their AI assistant's order was declined, (b) their assistant bought something they didn't want, (c) they don't know whether an assistant placed the order. Do not promise refunds or outcomes; point to our normal process. Avoid jargon.

**Prompt 6: The 2 AM rehearsal**
> Role-play the following as our on-call fraud analyst at 2 AM IST on Saturday 28 November, using only this watch card: [paste card]. Scenario: [one synthetic scenario, for example "declines on one agent-heavy segment have tripled in an hour and service contacts are rising"]. Walk through what the card tells you to do, step by step, and point out every place where the card is unclear or silent.

**Prompt 7: Prepare the debrief**
> Using this decision log from the peak weekend [redacted log], draft a one-page debrief for Tuesday 1 December: what we saw, which tripwires fired, which decisions worked, which were improvised because the card was silent, and three changes for the next peak. Keep it factual and do not speculate beyond the log.

---

## Part 3. Thirty-minute pre-weekend huddle (before Friday 27 November)

- [ ] 0–5 min: Read the card aloud. Anyone who will be on call confirms they have it.
- [ ] 5–10 min: Confirm one owner and one backup per decision, per shift, with time zones written down.
- [ ] 10–15 min: Agree the tripwires. If anyone thinks a number is a guess, write "guess" next to it.
- [ ] 15–20 min: Run one 2 AM scenario (Prompt 6) out loud with the person actually on call that night.
- [ ] 20–25 min: Read the holding lines to someone from service. Fix anything they would not say to a customer.
- [ ] 25–30 min: Confirm where the log lives and book the Tuesday 1 December debrief.

---

## Part 4. Tuesday 1 December debrief template

1. **What we saw** (facts from the log only)
2. **Tripwires that fired** (and whether they were set at the right level)
3. **Decisions that followed the card**
4. **Decisions the card did not cover** (these are the real lessons)
5. **What customers told service**
6. **Three changes before the next peak**, each with one owner and one date

Remember the peak-end rule: people remember a weekend by its worst moment and how it ended. Write the debrief from the log, not from memory.

---

*This is a free, general checklist from a personal magazine. It is not professional, legal or compliance advice, and it does not describe any particular organisation's systems. After Saturday 28 November 2026, 11:59 PM IST, the download comes down.*
