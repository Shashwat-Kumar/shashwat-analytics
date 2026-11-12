# The AI Builder 500 | ReadSigil

[Open the learning experience](https://readsigil.com/ai-builder-500/) · [ReadSigil Learn](https://readsigil.com/learn.html)

Five modules with 100 authored MCQs each, covering evaluation, code prototyping, model architecture, agent automation and the Model Context Protocol. This lesson is static HTML with inline CSS, questions and JavaScript so it runs without an API key or backend.

## Question standard (rebuilt 12 November 2026)

- Each question is built on something to reason about: code to debug, a trace to diagnose, numbers to size, or a scenario with a decision.
- Wrong options are plausible practitioner mistakes. Options are balanced so the correct answer cannot be found from length or wording. A test-wise guesser (longest, shortest, median-length, drop-absolutes, keyword-overlap strategies) scores 19–33%, close to the 25% chance rate. The previous bank scored 95% by picking the longest option.
- Each explanation states why the correct answer works and why each wrong option fails.
- The MCP track follows the 2026-07-28 specification (stateless core, Mcp-Method/Mcp-Name headers, multi round-trip requests, Tasks extension, CIMD, deprecations).
- Mix: 362 scenarios, 44 code-reading, 36 calculation, 9 trace and 49 concept questions; 30 Foundation, 40 Practitioner and 30 Architect per track.
- The question bank source and quality gate are in `tools/` (`python3 tools/build.py --write` prints the gate report and writes `tools/questions.json`; `python3 tools/testwise.py tools/questions.json` runs the guesser simulation).

## Experience

- Ten-, 25- and 100-question sessions, practice and assessment modes.
- Foundation → Practitioner → Architect progression.
- Explanation, ten-question checkpoints, missed-question review and a readiness scorecard.
- Browser-local progress and CSV export; no user registration.
- Illustrative and fictional banking use cases; no live customer data.
- MCQ scores are not a certification of independent coding or system deployment ability.

Developed as an original ReadSigil practical learning programme, November 2026. For technical depth, see the [Build Lab](https://readsigil.com/build-lab/).

Research anchors: [OpenAI evaluations](https://developers.openai.com/api/docs/guides/evaluation-best-practices), [OpenAI agent evaluations](https://developers.openai.com/api/docs/guides/agent-evals), [MCP specification](https://modelcontextprotocol.io/specification/2026-07-28), [NIST Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence).
