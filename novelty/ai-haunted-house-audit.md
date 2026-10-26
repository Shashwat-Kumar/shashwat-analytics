# The AI Haunted-House Audit: 13 failure modes that haunt AI in financial services

From the Novelty shelf at ReadSigil (https://readsigil.com/novelty.html)
Free. Available until Sunday 1 November 2026, 11:59 PM IST.

## What this is

A Halloween-week walk through the rooms of an AI system where things tend
to go bump: thirteen well-known failure modes for AI in lending, payments,
fraud and customer service. Each room has the symptom to listen for, one
question to ask your team, and one prompt you can run on synthetic or
redacted material to rehearse the check.

It is a conversation starter for a team review, not a model-risk policy.
It is not about any particular institution.

## Ground rules

1. Never paste real customer data, credentials or unpublished internal
   documents into a public AI tool. Use synthetic or redacted examples.
2. Every model output here is a first draft. Your model-risk, compliance
   and security teams own the real answer.
3. Nothing here is legal, regulatory or security advice.

---

## Room 1. The ghost in the training data (data leakage)
**Symptom:** validation scores that look too good to be true.
**Ask:** Could any feature only be known after the outcome happened?
**Prompt:** "Here is a list of feature names and descriptions for a
default-prediction model [paste synthetic list]. Flag any feature that
might be recorded after the loan outcome, or that is a disguised version
of the outcome. Explain each flag in one line."

## Room 2. The portrait that slowly changes (drift)
**Symptom:** performance sliding quietly while nobody is watching.
**Ask:** What is our alert threshold for input and outcome drift, and who
gets paged?
**Prompt:** "Draft a one-page drift-monitoring checklist for a credit
model: which input distributions to track, how often, which statistic,
and what should trigger a review versus a retrain."

## Room 3. The mirror that lies (proxy bias)
**Symptom:** a 'neutral' feature such as PIN code or device type standing
in for a protected characteristic.
**Ask:** Have we tested outcomes across groups, not just removed columns?
**Prompt:** "For these synthetic features [paste], list which could act as
proxies for protected characteristics in Indian lending, and suggest a
fairness test for each."

## Room 4. The confident apparition (hallucination)
**Symptom:** a chatbot stating a fee, rate or policy that does not exist.
**Ask:** Is every customer-facing answer grounded in an approved source,
and what happens when there isn't one?
**Prompt:** "Write ten tricky customer questions about a fictional
bank's savings account that a chatbot might answer wrongly. For each,
describe the correct 'I don't know, here's who can help' behaviour."

## Room 5. The voice in the walls (prompt injection)
**Symptom:** an AI assistant following instructions hidden in an email,
PDF or web page it was asked to read.
**Ask:** Which of our AI tools read outside content, and what are they
allowed to do afterwards?
**Prompt:** "Give five examples of prompt-injection text that could be
hidden in a customer-uploaded document, and the control that would stop
each from causing harm."

## Room 6. The doppelganger (deepfake voice and video)
**Symptom:** a 'senior executive' or 'customer' on a call asking for an
urgent transfer or a password reset.
**Ask:** Do our call-back and approval steps still hold if the voice is
perfect?
**Prompt:** "Draft a short staff drill script for a suspected deepfake
voice call requesting an urgent payment, including the exact verification
steps and the words to use to pause the call politely."

## Room 7. The locked room nobody can open (no explainability)
**Symptom:** a declined applicant asks why, and nobody can say.
**Ask:** Can we give a plain-language reason for every adverse decision?
**Prompt:** "Rewrite these synthetic model reason codes [paste] as
plain-language, respectful explanations a customer would understand, in
English and Hindi."

## Room 8. The forgotten attic (shadow AI)
**Symptom:** staff pasting work into personal AI accounts because the
approved tool is slow or missing.
**Ask:** What do people actually use, and have we given them a safe
alternative?
**Prompt:** "Draft a short, non-judgemental staff survey about which AI
tools people use at work and why, designed to surface shadow AI without
blame."

## Room 9. The endless corridor (automation loops)
**Symptom:** an agent or workflow retrying, re-sending or escalating
forever.
**Ask:** Does every automated workflow have a budget, a timeout and a
kill switch with a named owner?
**Prompt:** "List the failure modes of an AI agent that can send
customer emails, and the guardrail (rate limit, approval step, timeout)
that addresses each."

## Room 10. The cursed heirloom (vendor model you can't inspect)
**Symptom:** a third-party model changes behaviour after an update you
were never told about.
**Ask:** What does our contract say about model changes, logs and audit
access?
**Prompt:** "Draft twelve due-diligence questions for an AI vendor
serving a regulated lender, covering model updates, data retention,
audit rights, incident notice and exit."

## Room 11. The séance with the past (stale knowledge)
**Symptom:** an assistant citing last year's rates, rules or circulars.
**Ask:** How fresh is the source the AI answers from, and who updates it?
**Prompt:** "Design a simple content-freshness log for a knowledge base
behind a customer chatbot: fields, review cadence and owner."

## Room 12. The silent scream (no human escalation)
**Symptom:** a distressed customer stuck talking to a bot.
**Ask:** How fast can a customer reach a person, and does the bot
recognise distress or vulnerability?
**Prompt:** "Write a list of phrases and situations that should make a
banking chatbot hand over to a human immediately, with the handover
message it should use."

## Room 13. The unmarked grave (no record of what the model did)
**Symptom:** a complaint arrives and nobody can reconstruct the AI's
input, version or output.
**Ask:** Are inputs, model version and outputs logged and retained long
enough to answer a complaint or an audit?
**Prompt:** "Draft a minimal logging specification for an AI decision
system in lending: what to log per decision, retention period options
and access controls."

---

## Leaving the house

Pick the three rooms that scared your team most, give each an owner and
a date, and come back to the rest next quarter. The ghosts are not
seasonal, even if this pack is.
