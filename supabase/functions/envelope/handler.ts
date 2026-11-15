// The Envelope: live agent proxy (handler) for readsigil.com/envelope/
//
// GET  -> {"ok": true, "live": boolean}   health check used by the page
// POST -> {"agent": "...", "idea": "...", "brief"?: "...", "market"?: "..."}
//         streams the agent's answer back as plain UTF-8 text.
//
// Guard rails
// - Prompts are built here from fixed templates; callers cannot send free-form prompts.
// - Browser origin allow-list.
// - Per-network and global caps on calls per rolling 24 hours (Postgres function envelope_take).
//   If the limiter cannot be reached, the function refuses the call (fails closed).
// - Model and token limits are set per agent on the server.

import { AGENTS, AgentId, buildPrompt } from "./prompts.ts";

const env = (k: string, d = "") => Deno.env.get(k) ?? d;

const ORIGINS = env("ENVELOPE_ORIGINS", "https://readsigil.com,https://www.readsigil.com,https://shashwat-kumar.github.io")
  .split(",").map((s) => s.trim()).filter(Boolean);
const ANTHROPIC_KEY = env("ANTHROPIC_API_KEY");
const ANTHROPIC_URL = env("ANTHROPIC_BASE_URL", "https://api.anthropic.com") + "/v1/messages";
const SB_URL = env("SUPABASE_URL");
const SB_KEY = env("SUPABASE_SERVICE_ROLE_KEY");
const PER_IP = Number(env("ENVELOPE_PER_IP_DAILY", "30")); // about four missions of seven agents, with retries
const GLOBAL = Number(env("ENVELOPE_GLOBAL_DAILY", "700")); // about one hundred missions a day
const MODELS = {
  quick: env("ENVELOPE_MODEL_QUICK", "claude-haiku-5-5"),
  default: env("ENVELOPE_MODEL_DEFAULT", "claude-sonnet-5-5"),
};
const SALT = env("ENVELOPE_SALT", "readsigil-envelope");
const LIMITS = { idea: 220, brief: 4000, market: 2000 };

function cors(origin: string | null): Record<string, string> {
  const h: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
  if (origin && ORIGINS.includes(origin)) h["Access-Control-Allow-Origin"] = origin;
  return h;
}

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), "content-type": "application/json", "cache-control": "no-store" },
  });
}

function clean(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max) : "";
}

async function hashIp(req: Request): Promise<string> {
  const ip = (req.headers.get("x-forwarded-for") ?? req.headers.get("cf-connecting-ip") ?? "unknown").split(",")[0].trim();
  const data = new TextEncoder().encode(SALT + "|" + ip);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

// Returns "ok", "ip" (this network's cap reached), "global" (site cap reached) or "error".
async function takeSlot(ipHash: string): Promise<string> {
  if (!SB_URL || !SB_KEY) return "error";
  try {
    const r = await fetch(`${SB_URL}/rest/v1/rpc/envelope_take`, {
      method: "POST",
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ p_ip: ipHash, p_per_ip: PER_IP, p_global: GLOBAL }),
    });
    if (!r.ok) return "error";
    const v = await r.json();
    return typeof v === "string" ? v : "error";
  } catch {
    return "error";
  }
}

export async function handle(req: Request): Promise<Response> {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method === "GET") return json({ ok: true, live: Boolean(ANTHROPIC_KEY && SB_URL && SB_KEY) }, 200, origin);
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405, origin);
  if (!origin || !ORIGINS.includes(origin)) return json({ error: "This endpoint serves readsigil.com only.", code: "origin" }, 403, origin);
  if (!ANTHROPIC_KEY) return json({ error: "The live crew is not configured yet.", code: "offline" }, 503, origin);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Send a JSON body.", code: "bad_request" }, 400, origin);
  }
  const agent = String(body.agent ?? "") as AgentId;
  const def = AGENTS[agent];
  if (!def) return json({ error: "Unknown agent.", code: "bad_request" }, 400, origin);
  const vars = { idea: clean(body.idea, LIMITS.idea), brief: clean(body.brief, LIMITS.brief), market: clean(body.market, LIMITS.market) };
  if (vars.idea.length < 4) return json({ error: "Describe the idea in a sentence.", code: "bad_request" }, 400, origin);
  for (const k of def.needs) if (!vars[k]) return json({ error: `Missing ${k}.`, code: "bad_request" }, 400, origin);

  const slot = await takeSlot(await hashIp(req));
  if (slot === "ip") return json({ error: "This network has used today's live runs. Please come back tomorrow.", code: "quota_ip" }, 429, origin);
  if (slot === "global") return json({ error: "Today's live runs on ReadSigil are used up. Please come back tomorrow.", code: "quota_global" }, 429, origin);
  if (slot !== "ok") return json({ error: "The live crew is unavailable right now.", code: "offline" }, 503, origin);

  const upstream = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: { "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODELS[def.tier],
      max_tokens: def.maxTokens,
      stream: true,
      messages: [{ role: "user", content: buildPrompt(agent, vars) }],
    }),
    signal: req.signal,
  }).catch(() => null);

  if (!upstream || !upstream.ok || !upstream.body) {
    const status = upstream?.status ?? 0;
    const code = status === 429 || status === 529 ? "busy" : "upstream";
    return json({ error: code === "busy" ? "The model is busy. Retry in a minute." : "The model call failed. Retry.", code }, 502, origin);
  }

  // Convert Anthropic's server-sent events into a plain text stream.
  // A trailing "\u0000TRUNCATED" or "\u0000ERROR" marker tells the page how the stream ended.
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const reader = upstream.body.getReader();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buf = "";
      let stop = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let i;
          while ((i = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, i).trim();
            buf = buf.slice(i + 1);
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            let evt: Record<string, any>;
            try {
              evt = JSON.parse(payload);
            } catch {
              continue;
            }
            if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") controller.enqueue(enc.encode(evt.delta.text));
            else if (evt.type === "message_delta" && evt.delta?.stop_reason) stop = evt.delta.stop_reason;
            else if (evt.type === "error") stop = "error";
          }
        }
        if (stop === "max_tokens") controller.enqueue(enc.encode("\u0000TRUNCATED"));
        if (stop === "error") controller.enqueue(enc.encode("\u0000ERROR"));
      } catch {
        controller.enqueue(enc.encode("\u0000ERROR"));
      } finally {
        controller.close();
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { ...cors(origin), "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" },
  });
}


