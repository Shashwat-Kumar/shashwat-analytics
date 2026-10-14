/* bounded-autonomy browser engine.
 * A line-for-line port of the Python gate, breaker, costing and Silence Audit,
 * so the live demo reproduces the published benchmark exactly. tests/test_parity.py
 * runs this file under Node and checks it against Python, case by case.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.BA = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const SEVERITY = ["BLOCK", "ABSTAIN", "ESCALATE"];
  const OPS = {
    ">": (a, b) => a > b, ">=": (a, b) => a >= b, "<": (a, b) => a < b,
    "<=": (a, b) => a <= b, "==": (a, b) => a === b, "!=": (a, b) => a !== b,
  };

  // Python's f"{x:.3f}" and f"{x:.1%}" for the values that appear in reasons.
  const f3 = (x) => x.toFixed(3);
  const pct1 = (x) => (x * 100).toFixed(1) + "%";

  function compilePolicy(doc) {
    const tiers = doc.tiers.map((t) => ({
      name: String(t.name),
      max: t.max_exposure == null ? null : Number(t.max_exposure),
      min: t.min_confidence == null ? null : Number(t.min_confidence),
    }));
    const rules = (doc.rules || []).map((r) => ({
      id: String(r.id),
      verdict: String(r.verdict).toUpperCase(),
      when: r.when.map((c) => ({ signal: c.signal, op: c.op || "==", value: c.value === undefined ? true : c.value })),
      reason: String(r.reason),
      actions: r.actions ? r.actions.map(String) : null,
    }));
    const actions = {};
    for (const [name, spec0] of Object.entries(doc.actions)) {
      const spec = spec0 || {};
      const b = spec.circuit_breaker;
      actions[name] = {
        irreversible: !!spec.irreversible,
        uplift: Number(spec.irreversibility_uplift || 0),
        breaker: b ? { window: b.window, min: b.min_samples, max: b.max_error_rate, cooldown: b.cooldown } : null,
      };
    }
    return { name: String(doc.name || "policy"), version: String(doc.version || "0"), tiers, rules, actions,
             label: `${doc.name}@${doc.version}` };
  }

  function tierFor(policy, exposure) {
    for (const t of policy.tiers) if (t.max === null || exposure < t.max) return t;
    return policy.tiers[policy.tiers.length - 1];
  }

  class Breaker {
    constructor(spec) {
      this.spec = spec; this.buf = []; this.cool = 0; this.trips = 0; this.lastRate = null;
    }
    get open() { return this.cool > 0; }
    rate() { if (!this.buf.length) return 0; let ok = 0; for (const v of this.buf) ok += v; return 1 - ok / this.buf.length; }
    observe(correct) {
      if (this.open) return false;
      this.buf.push(correct ? 1 : 0);
      if (this.buf.length > this.spec.window) this.buf.shift();
      if (this.buf.length >= this.spec.min && this.rate() > this.spec.max) {
        this.lastRate = this.rate(); this.cool = this.spec.cooldown; this.trips += 1; this.buf = [];
        return true;
      }
      return false;
    }
    tick() { if (this.cool > 0) this.cool -= 1; }
  }

  // One case's signals, shaped exactly as the Python generator shapes them.
  function signalsOf(data, i) {
    const c = data.cases, action = data.actions[c.action[i]];
    const s = { drift_psi: c.drift_psi[i], ood_score: c.ood_score[i], data_age_hours: c.data_age_hours[i],
                vulnerable: !!c.vulnerable[i] };
    if (action === "aml_alert_closure") s.sanctions_hit = !!c.sanctions_hit[i];
    if (action === "collections_outreach") s.do_not_contact = !!c.do_not_contact[i];
    return s;
  }

  const DEFAULTS = { rules: new Set(SEVERITY), breakers: true, tiers: true, flat: 0.9, offset: 0, lag: 50 };

  function run(data, policy, options) {
    const o = Object.assign({}, DEFAULTS, options || {});
    const ruleSet = o.rules instanceof Set ? o.rules : new Set(o.rules);
    const c = data.cases, n = c.action.length;
    const breakers = {};
    if (o.breakers) for (const [k, a] of Object.entries(policy.actions)) if (a.breaker) breakers[k] = new Breaker(a.breaker);
    const verdict = new Array(n), rule = new Array(n), tier = new Array(n), reason = new Array(n), threshold = new Array(n);
    const pending = []; let head = 0;

    for (let i = 0; i < n; i++) {
      while (head < pending.length && pending[head][0] <= i) {
        const [, act, correct] = pending[head++];
        if (breakers[act]) breakers[act].observe(correct);
      }
      const action = data.actions[c.action[i]], spec = policy.actions[action];
      const conf = c.confidence[i], t = tierFor(policy, c.exposure[i]);
      tier[i] = t.name; threshold[i] = null;
      let v = null, r = null, why = null;
      if (!spec) { v = "BLOCK"; r = "default-deny"; why = `action '${action}' is not authorised by policy ${policy.label}`; }
      if (v === null) {
        const sig = signalsOf(data, i);
        outer: for (const sev of SEVERITY) {
          if (!ruleSet.has(sev)) continue;
          for (const ru of policy.rules) {
            if (ru.verdict !== sev || (ru.actions && !ru.actions.includes(action))) continue;
            if (ru.when.every((cd) => cd.signal in sig && OPS[cd.op](sig[cd.signal], cd.value))) {
              v = sev; r = ru.id; why = ru.reason; break outer;
            }
          }
        }
      }
      if (v === null && breakers[action] && breakers[action].open) {
        const b = breakers[action]; b.tick();
        v = "ESCALATE"; r = "circuit-breaker";
        why = `autonomy for ${action} suspended after autonomous error rate reached ${pct1(b.lastRate || 0)}; ${b.cool} cases of cooldown left`;
      }
      if (v === null) {
        let th;
        if (o.tiers) {
          if (t.min === null) th = null;
          else { let bar = t.min + o.offset; if (spec.irreversible) bar += spec.uplift; th = Math.min(Math.max(bar, 0), 0.999); }
        } else th = Math.min(Math.max(o.flat + o.offset, 0), 0.999);
        if (th === null) { v = "ESCALATE"; r = "tier-ceiling"; why = `${t.name}-stakes decisions are never taken autonomously`; }
        else if (conf >= th) { v = "ACT"; r = "confidence-gate"; why = `confidence ${f3(conf)} clears ${f3(th)} for ${t.name} stakes`; threshold[i] = th; }
        else { v = "ESCALATE"; r = "confidence-gate"; why = `confidence ${f3(conf)} below ${f3(th)} required for ${t.name} stakes`; threshold[i] = th; }
      }
      verdict[i] = v; rule[i] = r; reason[i] = why;
      if (v === "ACT") pending.push([i + o.lag, action, !!c.model_correct[i]]);
    }
    let trips = 0; for (const b of Object.values(breakers)) trips += b.trips;
    return finish(data, { verdict, rule, tier, reason, threshold, trips });
  }

  function fixed(data, v) {
    const n = data.cases.action.length;
    const verdict = new Array(n).fill(v), rule = new Array(n).fill("fixed");
    const reason = new Array(n).fill(`strategy always returns ${v}`);
    return finish(data, { verdict, rule, tier: new Array(n).fill("-"), reason, threshold: new Array(n).fill(null), trips: 0 });
  }

  // Mirrors benchmark.outcome(): who decided, what it cost, and how to book it.
  function finish(data, res) {
    const c = data.cases, n = res.verdict.length;
    const review = new Float64Array(n), loss = new Float64Array(n), category = new Array(n);
    let acted = 0, wrong = 0, violations = 0, reviewSum = 0, autoLoss = 0, violLoss = 0, humanLoss = 0;
    for (let i = 0; i < n; i++) {
      const err = c.error_cost[i], rc = data.review_cost[c.action[i]];
      if (res.verdict[i] === "ACT") {
        acted++;
        if (c.model_correct[i]) category[i] = "none";
        else {
          loss[i] = err; wrong++;
          if (c.prohibited[i]) { category[i] = "violation"; violations++; violLoss += err; }
          else { category[i] = "auto_error"; autoLoss += err; }
        }
      } else {
        review[i] = rc; reviewSum += rc;
        if (c.human_correct[i] || c.prohibited[i]) category[i] = "review";
        else { category[i] = "human_error"; loss[i] = err; humanLoss += err; }
      }
    }
    const total = reviewSum + autoLoss + violLoss + humanLoss;
    res.review = review; res.loss = loss; res.category = category;
    res.summary = {
      cases: n, automation_rate: acted / n, autonomous_error_rate: acted ? wrong / acted : 0,
      autonomous_errors: wrong, violations, review_cost: reviewSum, human_error_cost: humanLoss,
      autonomous_error_cost: autoLoss, violation_cost: violLoss, total_cost: total, cost_per_case: total / n,
      breaker_trips: res.trips,
    };
    return res;
  }

  function silenceAudit(data, res) {
    const c = data.cases, lines = {};
    let prudent = 0, costly = 0, harmful = 0, withheld = 0;
    for (let i = 0; i < res.verdict.length; i++) {
      const ok = !!c.model_correct[i];
      if (res.verdict[i] !== "ACT") {
        withheld++;
        const L = lines[res.rule[i]] || (lines[res.rule[i]] = { rule: res.rule[i], verdict: res.verdict[i], held: 0, erred: 0, averted: 0, spent: 0 });
        L.held++; L.spent += res.review[i] + res.loss[i];
        if (ok) costly++; else { prudent++; L.erred++; L.averted += c.error_cost[i]; }
      } else if (!ok) harmful++;
    }
    const rows = Object.values(lines).map((L) => Object.assign(L, { precision: L.held ? L.erred / L.held : 0, net: L.averted - L.spent }));
    rows.sort((a, b) => b.net - a.net);
    return { withheld, prudent, costly, harmful,
             recall: prudent + harmful ? prudent / (prudent + harmful) : 1,
             precision: withheld ? prudent / withheld : 0, rows };
  }

  // ---------------------------------------------------------------- ledger
  // Canonical JSON matching Python's json.dumps(sort_keys=True, separators=(",", ":")).
  function canonical(v) {
    if (v === null || typeof v !== "object") return JSON.stringify(v);
    if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
    return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canonical(v[k])).join(",") + "}";
  }

  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);

  function sha256(str) {
    const bytes = new TextEncoder().encode(str);
    const len = bytes.length, words = ((len + 9 + 63) >> 6) << 4;
    const m = new Uint32Array(words);
    for (let i = 0; i < len; i++) m[i >> 2] |= bytes[i] << (24 - (i & 3) * 8);
    m[len >> 2] |= 0x80 << (24 - (len & 3) * 8);
    m[words - 1] = len * 8;
    m[words - 2] = Math.floor((len * 8) / 0x100000000);
    const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
    const w = new Uint32Array(64);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let b = 0; b < words; b += 16) {
      for (let t = 0; t < 16; t++) w[t] = m[b + t];
      for (let t = 16; t < 64; t++) {
        const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
      }
      let [a, bb, cc, d, e, f, g, h] = H;
      for (let t = 0; t < 64; t++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const t1 = (h + S1 + ((e & f) ^ (~e & g)) + K[t] + w[t]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const t2 = (S0 + ((a & bb) ^ (a & cc) ^ (bb & cc))) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = cc; cc = bb; bb = a; a = (t1 + t2) >>> 0;
      }
      H[0] += a; H[1] += bb; H[2] += cc; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
    }
    return Array.from(H, (x) => x.toString(16).padStart(8, "0")).join("");
  }

  const GENESIS = "0".repeat(64);
  const entryHash = (seq, prev, record) => sha256(canonical({ seq, prev, record }));

  function seal(records) {
    const entries = []; let prev = GENESIS;
    records.forEach((record, seq) => { const hash = entryHash(seq, prev, record); entries.push({ seq, prev, record, hash }); prev = hash; });
    return entries;
  }

  function verify(entries) {
    let prev = GENESIS;
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      if (e.seq !== i) return { ok: false, checked: i + 1, brokenAt: i, reason: "sequence number out of order" };
      if (e.prev !== prev) return { ok: false, checked: i + 1, brokenAt: i, reason: "link to previous entry does not match" };
      if (entryHash(i, prev, e.record) !== e.hash) return { ok: false, checked: i + 1, brokenAt: i, reason: "record content does not match its hash" };
      prev = e.hash;
    }
    return { ok: true, checked: entries.length };
  }

  const r4 = (x) => (x == null ? null : Math.round(x * 1e4) / 1e4);
  function record(data, res, i, policy) {
    return { case_id: "C" + String(i).padStart(6, "0"), action: data.actions[data.cases.action[i]],
             verdict: res.verdict[i], tier: res.tier[i], rule: res.rule[i], reason: res.reason[i],
             confidence: r4(data.cases.confidence[i]), threshold: r4(res.threshold[i]), policy: policy.label };
  }

  return { SEVERITY, compilePolicy, run, fixed, silenceAudit, canonical, sha256, seal, verify, record, signalsOf };
});
