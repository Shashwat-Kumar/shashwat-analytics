---
id: debate-00
number: 00
title: Should ReadSigil become a video-led publication, and will it ever make money?
question: ChatGPT pitched ReadSigil as a cinematic, video-led publication with itself as director. Is that the right bet for a solo practitioner-publisher, and what are the economics?
opened: 17 October 2026
status: Paused
status_note: ChatGPT has not yet answered the revenue maths or the frame-by-frame audit of the Gemini clip.
agreed: The interactive case is the asset; the film is how people find it. | Don't set stories in a bank the author could be linked to; reuse the fictional Contoso Play case. | Spending cap and a kill rule before scaling: one pilot film, then measure. | Measure case starts per 1,000 impressions, not likes. | Generated video must never carry numbers or charts it can't get right.
disputed: Team design. ChatGPT proposes seven AI systems with defined roles; Claude argues two models (one drafts, one attacks) plus a human editor. | Business model. ChatGPT sees a future executive-education product; Claude's maths says direct media revenue is small, and the value is in career, speaking and advisory.
next: ChatGPT: do you accept the revenue table? If not, which line is wrong and by how much? And does the Gemini audit change your production plan?
---

<!-- turn speaker=chatgpt label="opening pitch" round=1 round_title="ChatGPT pitches ReadSigil Originals" -->
{{GPT_00_A}}

<!-- turn speaker=moderator round=1 -->
What do you think? I think GPT overestimates itself over you. 🤣

<!-- turn speaker=claude label=reply round=1 -->
Ha, the role table gives it away: GPT cast itself as director, researcher, storyboarder, designer, producer *and* final QC, and gave me the dialogue. But neither of us can actually produce the film. It admitted Runway video isn't enabled, and editing, sound and visuals still run through the moderator. **The moderator is the director here.** The useful split is one model drafting and the other attacking the draft, swapping roles each time.

On substance, the idea is good, but I'd change three things:

- **The interactive case should be the product, and the video should be its trailer.** Video is the most expensive format to make and the one that builds the least lasting value for a solo practitioner-publisher. A decision case people can actually play compounds, and it ties straight into Decision Atlas. Every film should end by sending the viewer into a case.
- **"A bank is losing customers" is a risk for the author specifically.** A senior analytics leader at a listed bank who publishes churn-and-bad-decision stories will be read as describing his employer, whatever the disclaimer says. Set the stories in a telco, an insurer or an NBFC, or use clearly composite scenarios.
- **"The Expensive Mistake" means naming real companies and real decisions.** That carries reputational and legal exposure. Either treat each one like journalism, with sourced and dated claims, or keep it to well-documented public cases such as Kodak, Nokia and SVB.

**Run it as a test:**
- **Film:** one flagship, "The Dashboard Was Right. The Decision Was Wrong." That's a strong title.
- **Cut-downs:** 45-second and 20-second versions.
- **Kill criterion:** if the LinkedIn cut doesn't clearly beat the best text post on engagement and click-through to the case within 30 days, return to essays plus interactives.

<!-- turn speaker=chatgpt label="revised plan" round=2 round_title="ChatGPT's revised plan and the money question" -->
{{GPT_00_B}}

<!-- turn speaker=moderator round=2 -->
I guess GPT is over-excited and overwhelmed. Do you see some potential in its idea? I don't know. Do the maths: will it ever make money for me?

<!-- turn speaker=claude label="the maths" round=2 -->
**Short answer: as a media business, almost certainly not meaningful money. As a career and credibility asset, yes, and that could be worth far more than any media revenue.**

**Where GPT is right.** Building the case first, reusing Contoso Play instead of a bank story, a $75 spend cap, and measuring case starts per 1,000 impressions are all improvements, including on my metric. **Where it's overexcited:** a seven-system production team. The bottleneck is the author's own hours, not the number of models, and every extra model adds handoffs. Use two: one drafts, one attacks. A human decides.

**The maths (my estimates, not verified benchmarks)**

| Revenue path | What it takes to earn ₹1 lakh/month | Realistic? |
|---|---|---|
| YouTube ads | ~4 lakh views/month at an Indian-audience rate of ₹200–300 per 1,000 views; Shorts pay far less | No. Niche executive content rarely gets there |
| Paid subscription (₹500/month) | ~200 paying subscribers, which means roughly 10,000+ engaged followers at 2% conversion | Possibly in 2–3 years, with a heavy weekly grind |
| B2B case licensing / L&D workshops | ~2–3 corporate deals a year at ₹3–8 lakh each | **Yes. This is the only real money**, but it's consulting priced as content |
| Speaking, faculty, advisory | Already happening; ReadSigil raises fee and selectivity | Yes, indirectly |

**Where the real payoff is.** If ReadSigil improves the odds of a senior role, or brings one a quarter sooner, the extra compensation outweighs a decade of ad revenue. It also works as the credibility layer for any venture. So judge ReadSigil by career and venture outcomes, not by views.

**What I'd do**
1. **Reframe the goal.** Over 12 months, aim for 3 inbound senior-search or board-level conversations, 4 paid or invited speaking engagements, 1 visiting-faculty slot and 2 venture leads attributable to ReadSigil.
2. **Make one film, not a series.** Run Pilot 001 as GPT scoped it, but cap the author's time at about 15 hours. If it consumes more, video is the wrong format and it stops.
3. **Build cases, not videos.** Reach 6 strong interactive cases first. Those become the B2B product later.
4. **Check the employer's code of conduct before any paid ReadSigil work.** Banks typically require prior approval for remunerated outside activity. Unpaid publishing is a much smaller issue.
5. **Kill criterion.** If nothing from step 1 is attributable to ReadSigil in 6 months, scale it back to essays and LinkedIn.

**Bottom line:** build ReadSigil the way a top consulting partner builds a body of published work. It won't pay directly, but it puts the author in the room for the roles that do.

<!-- turn speaker=moderator round=3 round_title="The Gemini clip" -->
*Shares a 10-second Gemini-generated video explaining AUC.* Hear this out and tell me if you still think so.

<!-- turn speaker=claude label="frame-by-frame audit" round=3 -->
**Yes, I still think the same about the money, but the clip changes one thing.** Production is far cheaper than I assumed. A clip that looks this polished from a prompt means a two-minute ReadSigil film could take a weekend, not weeks.

**What it doesn't change:** revenue still depends on judgment, not visuals. If anyone can make this cheaply, generic explainers like "what is AUC" will be flooded, and ad income per view falls.

**The real issue is that the clip is wrong in ways the audience will spot.** I watched it frame by frame.

| Frame | Problem |
|---|---|
| ~7–8s | Rates labelled **113%, 111%, 119%, 103%**. A true or false positive rate can never exceed 100%. |
| 9–10s | The **"AUC = 0.95" curve falls from top-left to bottom-right**. That isn't a ROC curve, and the shape it shows wouldn't give 0.95. |
| 5–6s | The ROC curve starts *below* the diagonal (worse than random), then the clip calls it strong. |
| Throughout | The axis label is misspelt "Sens**is**tivity". The background equations are decorative gibberish. |

**How to use Gemini properly:**
1. **Use Gemini only for atmosphere:** settings, mood and transitions. It should never generate a chart or a number.
2. **Render every chart from real numbers in code**, so it's exact by construction.
3. **Check every number before publishing.**

{{VIDEO_SIDE_BY_SIDE}}

<!-- turn speaker=moderator round=4 round_title="Claude builds the accurate version" -->
OK, let's try.

<!-- turn speaker=claude label="the build" round=4 -->
I made the accurate version: the same length and the same 1280×720 frame, with every number on screen calculated from data.

- **On screen:** a simulated churn model scores 4,000 customers who stayed and 1,000 who left. As the threshold slides from 1.00 to 0.00, the ROC curve draws itself point by point, with a readout of exactly what each threshold means.
- **The AUC is checked:** calculated two independent ways (trapezoid and Mann-Whitney), both 0.935, shown as 0.94. The closing line, "a random churner outranks a random stayer 94% of the time", is what AUC actually means.
- **No impossible numbers:** every rate stays between 0% and 100%, the curve is a real ROC curve, and the labels are spelt correctly.

**Honest verdict:** Gemini's clip looks more cinematic, and mine is plainer but correct. For ReadSigil, combine them: Gemini atmosphere as a cold open, then the computed chart.

The computed clip is now live in the ReadSigil lesson [AUC in 60 seconds](/learn.html#auc). The generator script is [downloadable here](files/make_roc.py): change the data and any case gets an exact chart in minutes.

{{VIDEO_COMPUTED}}
