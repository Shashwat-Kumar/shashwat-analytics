# The Envelope: backend setup

`/envelope/` is a live experiment: one sentence in, seven AI agents build a company around it. On readsigil.com the page calls a Supabase Edge Function (`supabase/functions/envelope`), which holds the model API key and applies the usage caps. GitHub Pages serves only the page.

## One-time setup (about 10 minutes)

Add these **before** merging, so the page is live when it appears on the homepage.

1. **Anthropic API key.** In the Anthropic Console create a key for ReadSigil and set a **monthly spend limit** on the workspace. The spend limit is the hard ceiling on cost.
2. **Supabase access token.** Supabase dashboard → Account → Access Tokens → generate one named `readsigil-envelope-deploy`.
3. **GitHub repository secrets** (Settings → Secrets and variables → Actions → New repository secret):
   - `ANTHROPIC_API_KEY`
   - `SUPABASE_ACCESS_TOKEN`
4. Merge the pull request. The workflow **Deploy The Envelope backend** then:
   - creates the rate-limit table and function in Postgres (idempotent SQL),
   - stores the API key and caps as function secrets,
   - deploys the edge function,
   - fails the run unless the endpoint reports `"live": true`.

To redeploy at any time: Actions → Deploy The Envelope backend → Run workflow.

## Usage caps

The function counts model calls over a rolling 24 hours. One mission uses seven calls.

| Setting (repository variable) | Default | Meaning |
| --- | --- | --- |
| `ENVELOPE_PER_IP_DAILY` | 30 | Calls per network per 24 hours (about four missions) |
| `ENVELOPE_GLOBAL_DAILY` | 700 | Calls across the whole site per 24 hours (about 100 missions) |

When a cap is reached the page says so plainly and makes no model call. If the limiter cannot be reached, the function refuses the call rather than running unmetered.

Models: Claude Haiku for brief, campaign and red team; Claude Sonnet for market model, website, product calculator and valuation. Override with function secrets `ENVELOPE_MODEL_QUICK` and `ENVELOPE_MODEL_DEFAULT`.

## What the endpoint will and will not do

- Builds prompts from fixed templates on the server. Callers cannot send their own prompts, so it cannot be used as a general model proxy.
- Accepts browser requests only from `readsigil.com`, `www.readsigil.com` and `shashwat-kumar.github.io` (override with secret `ENVELOPE_ORIGINS`). This filters casual misuse; the caps and the console spend limit are the real controls.
- Stores only a salted hash of the caller's IP and a timestamp, deleted after three days.

## Inside Claude

The same page also runs as a Claude artifact. There it uses the viewer's own Claude access and never calls this backend.

## Investor list

Investors are matched from `INVESTORS` in `envelope/index.html`, compiled from public reports in November 2026. Refresh it quarterly.
