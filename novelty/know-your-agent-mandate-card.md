# The Know-Your-Agent Mandate Card

*A free novelty item from The Signal (readsigil.com). Available until Sunday 29 November 2026, 11:59 PM IST.*

On Thursday 19 November 2026, at the Singapore FinTech Festival, MAS managing director Chia Der Jiun said MAS would facilitate a "know your agent" protocol, so that a financial institution can learn four things about an AI agent acting for a customer: who the agent is and whom it represents, what authority it has been given, what mandate it operates under, and what assurance exists about its provenance and reliability. In the same speech he said he would not advise giving personal agents the login credentials to your financial accounts. ([MAS keynote, 19 Nov 2026](https://www.mas.gov.sg/news/speeches/2026/keynote-address-by-md-at-the-singapore-fintech-festival-2026))

The day before, AXS said it would open its bill-payment network of more than 800 billers in Singapore to AI agents, with Visa and Mastercard demonstrating integrations and a trial planned with Grab's AI assistant. AXS did not give a consumer launch date. The safeguards described include payment limits, permitted transactions, explicit customer approval with a biometric check, and device and per-transaction tokens instead of card details. ([The Straits Times, 19 Nov 2026](https://www.straitstimes.com/tech/axs-visa-and-mastercard-partner-to-let-ai-agents-pay-bills-without-multiple-app-log-ins))

The protocol itself has not been published yet. But the four questions are already clear, and they are useful **now**, from both sides of the counter:

1. **Part 1 (for you):** a one-page mandate card you write for any AI agent you might let near your money, before you give it anything.
2. **Part 2 (for a bank or fintech team):** a "would we accept this agent?" grid built on the same four questions.
3. **Part 3:** six prompts to help you draft and stress-test either card.
4. **Part 4:** a twenty-minute team exercise.

There is also a small interactive version of Part 1 on the novelty page itself (readsigil.com/novelty.html#know-your-agent-mandate-card). It runs entirely in your browser; nothing you type is sent or stored.

**Ground rules.** Use only synthetic or redacted material with any AI assistant. Do not paste real account numbers, card numbers, passwords, OTPs or customer data into any tool. This card is not legal, regulatory, security or financial advice, and it is not a description of the MAS protocol (which does not exist in published form yet). Your bank's terms, and your own institution's policies, come first.

---

## Part 1. Your mandate card (personal)

Write it before the agent gets access, not after. Keep it to one page.

| # | KYA question | What to write |
|---|---|---|
| 1 | **Who is the agent?** | The product and the company behind it (for example "the assistant inside my bank's app" or "a general chatbot app"). If you can't say who built it, stop here. |
| 2 | **Whom does it represent?** | Only you? You and a family member? Your small business? Write it down: an agent "for the household" is a different thing from an agent "for me". |
| 3 | **What authority does it have?** | Pick one level and write it: *look only* (read bills and balances), *prepare* (draft payments for you to approve), *pay within limits* (pay listed billers up to a cap). Start at the lowest level that is still useful. |
| 4 | **What is the mandate?** | The permitted actions in plain words: which billers or payees, a per-payment limit, a monthly cap, and conditions (for example "the amount must match the bill", "never add a new payee", "ask me for anything over the limit"). |
| 5 | **How does it connect?** | Through an official channel the bank or biller offers for agents (tokens, a connected-app permission you can revoke), or through your own login? **If the answer is "my password", the card ends here.** That gives the agent everything you can do, with no mandate at all. |
| 6 | **What assurance is there?** | What you know about how it behaves: does it show you the amount and payee before paying? Does it keep a log you can read? Who do you call if it pays the wrong thing? |
| 7 | **Stop rules** | The situations in which it must stop and ask you (for example: a bill that is higher than usual, a payee name that changed, any request to change your contact details). |
| 8 | **How to revoke** | Exactly where you switch it off, and a test that you can. Do the test once. |
| 9 | **Review date** | A date on which you reread the card. One month is a sensible start. |

A quick self-check before you sign your own card:

- Is there a number in the limit field, not "reasonable"?
- Can the agent add or change a payee without you? (It shouldn't.)
- Would you be comfortable reading the agent's log of last month aloud to a friend?
- Do you know who is responsible if it pays wrongly? If not, ask the provider before you start.

---

## Part 2. "Would we accept this agent?" (for a bank or fintech team)

The same four questions, from the institution's side. For each, write what information you would need, what you would do with it, and what you would do if it were missing.

| KYA question | Information we'd need | What it changes for us | If it's missing |
|---|---|---|---|
| **Who the agent is and whom it represents** | | | |
| **What authority it has been given** | | | |
| **What mandate it operates under** (actions, limits, conditions) | | | |
| **What assurance exists about provenance and reliability** | | | |

Then answer three follow-ups in one sentence each:

1. Today, with no protocol, how do we actually find out that a session is an agent using a customer's credentials? (Be honest if the answer is "we don't".)
2. If an agent transacts beyond its instruction, who bears the loss under our current terms? (MAS raised this exact question.)
3. Which one product of ours would be the safest first "agent channel", and what is the lowest authority level that would still be useful there?

---

## Part 3. Six prompts

Use these with any AI assistant, on synthetic material only.

1. **Draft my card.** "I want an AI assistant to help with household bills. Here is a synthetic list of my billers and typical amounts: [list]. Using these headings: who the agent is, whom it represents, authority level, mandate (actions, per-payment limit, monthly cap, conditions), how it connects, assurance, stop rules, how to revoke, review date, draft a one-page mandate card. Default to the lowest authority level that is still useful, and never allow new payees without my approval."
2. **Find the holes.** "Here is my agent mandate card: [paste]. Act as a careful fraud analyst. List every way an agent could stay technically inside this mandate and still cost me money, then suggest one line to close each gap."
3. **Stress the stop rules.** "Give me eight realistic bill-payment situations (higher bill, changed payee name, duplicate bill, bill from a new biller, payment due on a holiday, and so on). For each, say whether my card's stop rules would make the agent ask me first: [paste card]."
4. **The credential test.** "Explain, in five plain bullet points, the difference between giving an AI agent my bank login and giving it a revocable, limited permission through an official channel. Then tell me which questions to ask a provider to find out which one they use."
5. **Institution grid.** "We are a [bank/wallet/biller] team. Using the four questions (who the agent is and whom it represents, its authority, its mandate, assurance about provenance and reliability), fill a table with: information we'd need, what it changes for us, what we'd do if it's missing. Keep it to generic, non-confidential examples."
6. **Liability in plain words.** "Using only our own published customer terms, which I'll paste here [paste public terms], explain who appears to bear the loss if an agent acting for a customer pays the wrong amount. List what the terms don't say. Do not give legal advice; flag where a lawyer would be needed."

---

## Part 4. A twenty-minute team exercise

1. **(3 min)** Everyone fills Part 1 for an imaginary customer who wants an agent to pay utility bills and a loan instalment. Synthetic amounts only.
2. **(5 min)** Swap cards. Each person runs prompt 2 in their head (or with an assistant) and marks one gap.
3. **(7 min)** As a group, fill the Part 2 grid for your own product.
4. **(3 min)** Answer the three follow-ups in one sentence each.
5. **(2 min)** Write down one thing you would change in your customer guidance or terms before agents arrive, and who owns it.

---

## Why this card expires

It is built around one week of news (the Singapore FinTech Festival announcements of 18 and 19 November 2026), before the protocol is published and before any consumer agent bill-payment service has a launch date. The four questions will last; the snapshot of who said what will not. After Sunday 29 November 2026 the card comes down.

*The Signal · readsigil.com · Nothing here is legal, regulatory, security or financial advice.*
