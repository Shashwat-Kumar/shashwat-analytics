# The Agent-Shopper Peak-Week Drill

*A free novelty item from The Signal (readsigil.com). Available until Thursday 19 November 2026, 11:59 PM IST.*

Black Friday falls on 27 November 2026 and Cyber Monday on 30 November. This is the first big shopping peak in which a noticeable share of checkouts may be started, filled in or completed by AI shopping agents rather than people tapping through a page. Payment gateways are shipping "agent-ready" checkouts, some banks are blocking outside agents from logging in, and card networks and wallets are piloting agent payments.

If you own fraud rules, a checkout or payment flow, a disputes queue, a customer-service bot or merchant risk, this drill helps you rehearse one question before the peak: **what happens in our systems when the "customer" is software acting for a customer?** It is a tabletop exercise with prompts and a checklist, not a policy. Your own change, fraud, risk and incident processes always come first, and many teams slow or freeze changes ahead of peak trading, so the useful window is before that, not during it.

## Ground rules

- Use only synthetic, redacted or already-public material. Never paste customer data, card numbers, credentials, keys or live fraud-rule thresholds into a public AI tool.
- Treat every output as a first draft. Do not let a model invent your rules, vendors, volumes or regulatory obligations; write "unknown" where you don't know.
- Nothing here is legal, regulatory, security or fraud advice, and it is not about any particular institution, merchant or vendor.

## Part 1: The one-page agent-shopper map

Fill this in with your team before running the prompts. Keep it to one screen.

1. **Where an agent could enter:** web checkout, app, hosted payment page, API, saved-card flows, wallets, UPI intents, chat commerce.
2. **How we would know it's an agent:** declared agent headers or tokens, network or wallet agent flags, behaviour signals, or "we wouldn't know".
3. **What our fraud rules assume about humans:** typing speed, mouse or touch patterns, session length, device consistency, time of day.
4. **Step-up and authentication:** where OTP, PIN, biometric or 3-D Secure challenges fire, and who (human or agent) is expected to answer them.
5. **Consent and mandate:** what proof we have that the account holder authorised this agent, this merchant and this amount.
6. **Velocity and limits:** what a burst of fast, perfectly formed agent orders would look like against our velocity rules.
7. **Disputes:** how a "my agent bought the wrong thing" or "I never told the agent to do that" claim would be coded and handled.
8. **Customer service:** what our bot and our human agents say when a customer asks about a purchase their AI assistant made.
9. **Blocking stance:** whether we allow, challenge or block outside agents, and who signed that off.
10. **Where the record is:** the ticket, risk log or decision note where today's drill outcomes go.

## Part 2: Prompts

### Prompt 1: Build the map from our notes
```
Below are redacted notes about our checkout, payment and fraud setup.
Turn them into a one-page "agent-shopper map" with these ten headings:
Entry points; How we'd detect an agent; Human assumptions in fraud rules;
Step-up and authentication; Consent and mandate; Velocity and limits;
Disputes; Customer service; Blocking stance; Where the record is.
Rules: keep my wording for any name, number or system; write "unknown"
where my notes don't say; do not add vendors or rules I haven't mentioned.
```

### Prompt 2: Find the human assumptions
```
Here is a plain-language summary of some of our fraud and risk rules
(synthetic thresholds only). For each rule, tell me what it assumes about
a human customer's behaviour, and how a legitimate AI shopping agent acting
for that customer might trip it (a false positive) or slip past it (a false
negative). Output a table: Rule | Human assumption | False-positive risk
with agents | False-negative risk with agents | Question for the rule owner.
```

### Prompt 3: Three peak-day scenarios
```
Write three short tabletop scenarios for a payments team during the
Black Friday to Cyber Monday peak, all involving AI shopping agents:
(a) a legitimate agent placing many fast orders for one customer,
(b) a compromised account where an attacker uses an agent to buy gift cards,
(c) a customer disputing a purchase their own agent made after misreading
their instruction. For each, list the first three signals we'd see, the
decision we'd have to make in the first hour, and who should own it.
Keep everything generic; no real merchants, banks or people.
```

### Prompt 4: The consent question
```
A customer says: "My AI assistant bought this, but I only asked it to
compare prices." Using only generic principles (no specific law or
regulator), list the evidence a payments team would want to see to work
out what the customer actually authorised, what is missing in a typical
agent checkout today, and five questions to put to our product and legal
teams before the peak. Mark anything that depends on jurisdiction as
"check with legal".
```

### Prompt 5: Customer-service holding lines
```
Draft three calm, short holding lines (under 60 words each) our service
team could use when a customer asks about (1) an order placed by their AI
assistant, (2) a payment we declined because it looked automated, and
(3) a refund for an agent's mistaken purchase. No promises about outcomes,
no blame, plain language, and a clear next step.
```

### Prompt 6: Red-team our own "agent policy" sentence
```
Here is the one or two sentences that describe how we treat AI agents at
checkout: [paste]. Attack it. List the ways it is ambiguous, the edge cases
it doesn't cover (partial automation, browser extensions, accessibility
tools, a family member using the customer's assistant), and rewrite it in
three versions: allow-by-default, challenge-by-default, block-by-default,
with the trade-off of each in one line.
```

### Prompt 7: Peak-week watch list
```
From the map and scenarios above, produce a short peak-week watch list:
the five metrics or queues most likely to show agent-related trouble first
(for example declines with a specific reason code, dispute reason codes,
velocity-rule hits, service contacts mentioning an "assistant"), what
"normal" would look like if I give you last year's synthetic baseline, and
who looks at each one daily.
```

### Prompt 8: The decision note
```
Summarise today's drill as a one-page decision note: what we learned, the
three gaps we are closing before the peak, the gaps we are consciously
accepting, who owns each, and the date we will review. Keep my wording for
owners and dates; write "unknown" where I haven't decided.
```

## Part 3: Forty-minute drill checklist

- [ ] Ten minutes: fill in the agent-shopper map together (Part 1).
- [ ] Ten minutes: run Prompt 2 on three of your most important fraud rules, using synthetic thresholds.
- [ ] Ten minutes: walk through one scenario from Prompt 3 out loud, with the people who would really be on call.
- [ ] Five minutes: agree the holding lines (Prompt 5) with the service lead.
- [ ] Five minutes: write the decision note (Prompt 8) and put it where the record lives.

## Why this expires

The drill is only useful before the late-November peak, while there is still time to change a rule, brief a service team or write down a stance. After Thursday 19 November 2026 the pack comes down from readsigil.com.
