// Deterministic fictional data for Workshop 1: "The numbers match. The money doesn't."
// Harbour Bank, value date 16 Oct 2026. Amounts are integer paise to avoid float drift.
// Double entry: every posting has a customer leg (CUST) and a settlement GL leg (GL).
const GL = { UPI: 'GL-UPI-STL', NEFT: 'GL-NEFT-STL', IMPS: 'GL-IMPS-STL', ATM: 'GL-ATM-STL', CASH: 'GL-CASH-VLT' };
const GL_NAMES = { 'GL-UPI-STL': 'UPI settlement with NPCI', 'GL-NEFT-STL': 'NEFT settlement with RBI', 'GL-IMPS-STL': 'IMPS settlement with NPCI', 'GL-ATM-STL': 'ATM network settlement', 'GL-CASH-VLT': 'Branch cash vault' };

function buildData() {
  let s = 20261016 >>> 0;
  const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const pad = (n, w) => String(n).padStart(w, '0');
  const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const amountPaise = () => { const r = Math.min(100000, Math.max(10, Math.round(Math.exp(6.6 + 1.25 * gauss())))); return r * 100 + (rnd() < 0.35 ? Math.floor(rnd() * 100) : 0); };
  const ts = (day, sec) => { const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, x = sec % 60; return `2026-10-${day} ${pad(h, 2)}:${pad(m, 2)}:${pad(x, 2)}`; };

  const branches = ['Pune Camp', 'Nashik Road', 'Surat Ring Road', 'Indore Vijay Nagar', 'Thane West', 'Vadodara Alkapuri'];
  const accounts = [];
  for (let i = 0; i < 240; i++) {
    accounts.push({ account_id: `HB${100001 + i}`, product: rnd() < 0.8 ? 'SA' : 'CA', branch: pick(branches), opened_on: `20${pad(15 + Math.floor(rnd() * 11), 2)}-${pad(1 + Math.floor(rnd() * 12), 2)}-${pad(1 + Math.floor(rnd() * 28), 2)}` });
  }
  const acct = () => pick(accounts).account_id;

  // NPCI raw file for 16 Oct (transaction level). RRN format YDDDHHnnnnnn (6 = 2026, 289 = 16 Oct).
  // dr_cr is from the Harbour customer's side: CR = inward credit to our customer, DR = outward debit.
  const raw = [];
  const seen = new Set();
  for (let i = 0; i < 1800; i++) {
    const sec = Math.floor(rnd() * 86400);
    let rrn; do { rrn = `6289${pad(Math.floor(sec / 3600), 2)}${pad(Math.floor(rnd() * 1e6), 6)}`; } while (seen.has(rrn));
    seen.add(rrn);
    raw.push({ rrn, account_id: acct(), dr_cr: rnd() < 0.45 ? 'CR' : 'DR', amount: amountPaise(), txn_date: '2026-10-16', settled_at: ts(16, sec), response_code: '00' });
  }
  raw.sort((a, b) => a.settled_at.localeCompare(b.settled_at));

  // The two planted breaks.
  const missing = raw[1137];
  missing.dr_cr = 'CR'; missing.amount = 4850000; // ₹48,500.00 inward credit the posting job never wrote
  const dup = raw[642];
  dup.dr_cr = 'DR'; dup.amount = 1275000; // ₹12,750.00 outward debit posted twice after a timeout retry

  const cust = [];
  const prior = [];
  for (let i = 0; i < 220; i++) {
    const sec = Math.floor(rnd() * 86400);
    const r = { txn_ref: `6288${pad(Math.floor(sec / 3600), 2)}${pad(Math.floor(rnd() * 1e6), 6)}`, account_id: acct(), value_date: '2026-10-15', dr_cr: rnd() < 0.45 ? 'CR' : 'DR', amount: amountPaise(), channel: 'UPI', narration: 'UPI', posted_at: ts(15, sec) };
    cust.push(r); prior.push(r);
  }
  const secOf = (t) => Number(t.slice(11, 13)) * 3600 + Number(t.slice(14, 16)) * 60 + Number(t.slice(17, 19));
  for (const r of raw) {
    if (r === missing) continue;
    const p = { txn_ref: r.rrn, account_id: r.account_id, value_date: '2026-10-16', dr_cr: r.dr_cr, amount: r.amount, channel: 'UPI', narration: r.dr_cr === 'CR' ? 'UPI inward credit' : 'UPI outward debit', posted_at: ts(16, Math.min(86399, secOf(r.settled_at) + 1)) };
    cust.push(p);
    if (r === dup) cust.push({ ...p, posted_at: ts(16, Math.min(86399, secOf(r.settled_at) + 4)) });
  }
  for (const [ch, n] of [['NEFT', 260], ['IMPS', 180], ['ATM', 140], ['CASH', 90]]) {
    for (let i = 0; i < n; i++) {
      const sec = 9 * 3600 + Math.floor(rnd() * 9 * 3600);
      const dr = ch === 'ATM' ? 'DR' : rnd() < 0.5 ? 'CR' : 'DR';
      cust.push({ txn_ref: `${ch[0]}26289${pad(Math.floor(rnd() * 1e7), 7)}`, account_id: acct(), value_date: '2026-10-16', dr_cr: dr, amount: ch === 'ATM' ? (1 + Math.floor(rnd() * 20)) * 50000 : amountPaise(), channel: ch, narration: `${ch} ${dr === 'CR' ? 'credit' : 'debit'}`, posted_at: ts(16, sec) });
    }
  }
  cust.sort((a, b) => a.posted_at.localeCompare(b.posted_at));
  const ledger = [];
  for (const c of cust) {
    ledger.push({ ...c, leg: 'CUST' });
    ledger.push({ ...c, leg: 'GL', account_id: GL[c.channel], dr_cr: c.dr_cr === 'CR' ? 'DR' : 'CR' });
  }
  ledger.forEach((r, i) => { r.posting_id = 900001 + i; r.correction_ref = null; });

  // A request from the previous day, rejected by the checker. The correction job must ignore it.
  const old = prior[37];
  const requests = [{ request_id: 'CR-20261016-007', break_type: 'DUPLICATE_DEBIT', txn_ref: old.txn_ref, posting_ref: `REV${old.txn_ref}`, account_id: old.account_id, dr_cr: 'CR', amount: old.amount, reason: 'Customer complaint, possible double debit', status: 'REJECTED', maker: 'ops.recon', checker: 'Finance Control', checker_note: 'Not a duplicate: one posting only. Customer was debited once.', raised_at: '2026-10-16 15:12:00', decided_at: '2026-10-16 16:40:00' }];

  const netCR = (rows) => rows.reduce((t, r) => t + (r.dr_cr === 'CR' ? r.amount : -r.amount), 0);
  const upi16 = ledger.filter((r) => r.channel === 'UPI' && r.value_date === '2026-10-16');
  const upiCust = upi16.filter((r) => r.leg === 'CUST');
  const upiGl = upi16.filter((r) => r.leg === 'GL');
  const inward = raw.filter((r) => r.dr_cr === 'CR').reduce((t, r) => t + r.amount, 0);
  const outward = raw.filter((r) => r.dr_cr === 'DR').reduce((t, r) => t + r.amount, 0);
  const net = { settlement_date: '2026-10-16', inward_amount: inward, outward_amount: outward, net_amount: inward - outward, position: inward - outward >= 0 ? 'RECEIVABLE' : 'PAYABLE' };
  const glNet = -netCR(upiGl); // DR minus CR on the settlement GL = inward minus outward per ledger
  const byAcct = {};
  for (const r of raw) byAcct[r.account_id] = (byAcct[r.account_id] || 0) + (r.dr_cr === 'CR' ? r.amount : -r.amount);
  return {
    accounts, raw, net, ledger, requests,
    answers: {
      upiRows: upiCust.length, upiDistinct: new Set(upiCust.map((r) => r.txn_ref)).size,
      drTotal: upi16.filter((r) => r.dr_cr === 'DR').reduce((t, r) => t + r.amount, 0),
      crTotal: upi16.filter((r) => r.dr_cr === 'CR').reduce((t, r) => t + r.amount, 0),
      npciNet: net.net_amount, glNet, gap: net.net_amount - glNet,
      missing: { rrn: missing.rrn, account_id: missing.account_id, amount: missing.amount, dr_cr: 'CR' },
      dup: { rrn: dup.rrn, account_id: dup.account_id, amount: dup.amount, dr_cr: 'DR' },
      rawByAccount: byAcct, seedRows: ledger.length, maxPostingId: 900000 + ledger.length, oldRequest: requests[0],
    },
  };
}

const rupees = (p) => (p / 100).toFixed(2);
const q = (v) => (v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);

function requestValues(r) {
  return `(${q(r.request_id)},${q(r.break_type)},${q(r.txn_ref)},${q(r.posting_ref)},${q(r.account_id)},${q(r.dr_cr)},${rupees(r.amount)},${q(r.reason)},${q(r.status)},${q(r.maker)},${q(r.checker)},${q(r.checker_note)},${q(r.raised_at)},${q(r.decided_at)})`;
}

function sqlInserts(d, dialect) {
  const chunks = (rows, n) => { const out = []; for (let i = 0; i < rows.length; i += n) out.push(rows.slice(i, i + n)); return out; };
  const pg = dialect === 'pg';
  const tsType = pg ? 'TIMESTAMPTZ' : 'TIMESTAMP';
  const tz = pg ? '+05:30' : '';
  let sql = `CREATE TABLE accounts (account_id VARCHAR(10) PRIMARY KEY, product CHAR(2) NOT NULL, branch VARCHAR(40) NOT NULL, opened_on DATE NOT NULL);\n`;
  for (const c of chunks(d.accounts, 300)) sql += `INSERT INTO accounts VALUES ${c.map((a) => `(${q(a.account_id)},${q(a.product)},${q(a.branch)},${q(a.opened_on)})`).join(',')};\n`;
  sql += `CREATE TABLE gl_accounts (gl_code VARCHAR(12) PRIMARY KEY, name VARCHAR(40) NOT NULL);\nINSERT INTO gl_accounts VALUES ${Object.entries(GL_NAMES).map(([k, v]) => `(${q(k)},${q(v)})`).join(',')};\n`;
  const lt = pg ? 'ledger_postings' : 'ledger_extract';
  const idCol = pg ? 'posting_id BIGINT GENERATED BY DEFAULT AS IDENTITY (START WITH 990001) PRIMARY KEY' : 'posting_id BIGINT';
  sql += `CREATE TABLE ${lt} (${idCol}, txn_ref VARCHAR(20) NOT NULL, leg VARCHAR(4) NOT NULL, account_id VARCHAR(12) NOT NULL, value_date DATE NOT NULL, dr_cr CHAR(2) NOT NULL, amount DECIMAL(14,2) NOT NULL, channel VARCHAR(6) NOT NULL, narration VARCHAR(80), correction_ref VARCHAR(20), posted_at ${tsType} NOT NULL${pg ? ' DEFAULT now()' : ''});\n`;
  for (const c of chunks(d.ledger, 500)) sql += `INSERT INTO ${lt} (posting_id, txn_ref, leg, account_id, value_date, dr_cr, amount, channel, narration, correction_ref, posted_at) VALUES ${c.map((r) => `(${r.posting_id},${q(r.txn_ref)},${q(r.leg)},${q(r.account_id)},${q(r.value_date)},${q(r.dr_cr)},${rupees(r.amount)},${q(r.channel)},${q(r.narration)},NULL,${q(r.posted_at + tz)})`).join(',')};\n`;
  if (pg) {
    sql += `CREATE TABLE correction_requests (request_id VARCHAR(20) PRIMARY KEY, break_type VARCHAR(20) NOT NULL, txn_ref VARCHAR(20) NOT NULL, posting_ref VARCHAR(20) NOT NULL, account_id VARCHAR(12) NOT NULL, dr_cr CHAR(2) NOT NULL, amount DECIMAL(14,2) NOT NULL, reason VARCHAR(120) NOT NULL, status VARCHAR(10) NOT NULL, maker VARCHAR(40) NOT NULL, checker VARCHAR(40), checker_note VARCHAR(160), raised_at TIMESTAMP NOT NULL, decided_at TIMESTAMP);\n`;
  } else {
    sql += `CREATE TABLE npci_raw (rrn VARCHAR(12) NOT NULL, account_id VARCHAR(10) NOT NULL, dr_cr CHAR(2) NOT NULL, amount DECIMAL(14,2) NOT NULL, txn_date DATE NOT NULL, settled_at TIMESTAMP NOT NULL, response_code CHAR(2) NOT NULL);\n`;
    for (const c of chunks(d.raw, 500)) sql += `INSERT INTO npci_raw VALUES ${c.map((r) => `(${q(r.rrn)},${q(r.account_id)},${q(r.dr_cr)},${rupees(r.amount)},${q(r.txn_date)},${q(r.settled_at)},${q(r.response_code)})`).join(',')};\n`;
    const n = d.net;
    sql += `CREATE TABLE npci_net_settlement (settlement_date DATE NOT NULL, inward_amount DECIMAL(16,2) NOT NULL, outward_amount DECIMAL(16,2) NOT NULL, net_amount DECIMAL(16,2) NOT NULL, position VARCHAR(10) NOT NULL);\nINSERT INTO npci_net_settlement VALUES (${q(n.settlement_date)},${rupees(n.inward_amount)},${rupees(n.outward_amount)},${rupees(n.net_amount)},${q(n.position)});\n`;
  }
  return sql;
}

// Reference SQL for Workshop 1. The page shows the first entry of each group as the solution;
// the tests run every entry to prove that equivalent approaches are accepted.
function SOL(A) {
  const cols = `(txn_ref, leg, account_id, value_date, dr_cr, amount, channel, narration, correction_ref)`;
  const src = `SELECT r.posting_ref AS txn_ref,
       l.leg,
       CASE l.leg WHEN 'CUST' THEN r.account_id ELSE 'GL-UPI-STL' END AS account_id,
       DATE '2026-10-16' AS value_date,
       CASE WHEN l.leg = 'CUST' THEN r.dr_cr
            WHEN r.dr_cr = 'CR' THEN 'DR' ELSE 'CR' END AS dr_cr,
       r.amount,
       'UPI' AS channel,
       'Correction ' || r.request_id AS narration,
       r.request_id AS correction_ref
FROM correction_requests r
CROSS JOIN (VALUES ('CUST'), ('GL')) AS l(leg)
WHERE r.status = 'APPROVED'`;
  return {
    balance: `SELECT SUM(CASE WHEN dr_cr = 'DR' THEN amount ELSE 0 END) AS debits,
       SUM(CASE WHEN dr_cr = 'CR' THEN amount ELSE 0 END) AS credits
FROM ledger_postings
WHERE channel = 'UPI'
  AND value_date = DATE '2026-10-16';`,
    unmatched: {
      leftjoin: `SELECT n.rrn, n.account_id, n.dr_cr, n.amount, n.settled_at
FROM npci_raw n
LEFT JOIN ledger_extract l
  ON l.txn_ref = n.rrn AND l.leg = 'CUST'
WHERE l.txn_ref IS NULL;`,
      notexists: `SELECT * FROM npci_raw n WHERE NOT EXISTS (SELECT 1 FROM ledger_extract l WHERE l.txn_ref = n.rrn);`,
      anti: `SELECT n.* FROM npci_raw n ANTI JOIN ledger_extract l ON l.txn_ref = n.rrn;`,
      except: `SELECT rrn FROM npci_raw EXCEPT SELECT txn_ref FROM ledger_extract;`,
    },
    dups: {
      custleg: `SELECT txn_ref, account_id, COUNT(*) AS times_posted, SUM(amount) AS total
FROM ledger_postings
WHERE channel = 'UPI'
  AND value_date = DATE '2026-10-16'
  AND leg = 'CUST'
GROUP BY txn_ref, account_id
HAVING COUNT(*) > 1;`,
      byleg: `SELECT txn_ref, leg, COUNT(*) FROM ledger_postings WHERE channel='UPI' AND value_date='2026-10-16' GROUP BY txn_ref, leg HAVING COUNT(*) > 1;`,
      over2: `SELECT txn_ref FROM ledger_postings WHERE channel='UPI' AND value_date='2026-10-16' GROUP BY txn_ref HAVING COUNT(*) > 2;`,
    },
    job: {
      notexists: `INSERT INTO ledger_postings
  ${cols}
${src}
  AND NOT EXISTS (
    SELECT 1 FROM ledger_postings p
    WHERE p.correction_ref = r.request_id AND p.leg = l.leg
  );`,
      onconflict: `CREATE UNIQUE INDEX IF NOT EXISTS ux_correction_leg ON ledger_postings (correction_ref, leg) WHERE correction_ref IS NOT NULL;
INSERT INTO ledger_postings ${cols}
${src}
ON CONFLICT (correction_ref, leg) WHERE correction_ref IS NOT NULL DO NOTHING;`,
      merge: `MERGE INTO ledger_postings p
USING (${src}) s
ON p.correction_ref = s.correction_ref AND p.leg = s.leg
WHEN NOT MATCHED THEN INSERT ${cols}
VALUES (s.txn_ref, s.leg, s.account_id, s.value_date, s.dr_cr, s.amount, s.channel, s.narration, s.correction_ref);`,
    },
    jobStarter: `-- First draft of the correction job. Check it before it goes live.
INSERT INTO ledger_postings
  ${cols}
SELECT r.posting_ref, 'CUST', r.account_id, DATE '2026-10-16',
       r.dr_cr, r.amount, 'UPI', 'Correction ' || r.request_id, r.request_id
FROM correction_requests r;`,
  };
}

const ENGINE_BASE = '/assets/engines/';
const D = buildData();
const A = D.answers;
const S = SOL(A);
const inr = (paise) => { const n = paise / 100; return (n < 0 ? '−₹' : '₹') + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const KEY = 'readsigil-ws1-v2';
const fresh = () => ({ opened: {}, done: {}, sql: {}, hint: {}, sol: {}, checks: {}, requests: [], seq: 0 });
let state = fresh();
try { state = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

$('#evNpci').textContent = inr(-A.npciNet);
$('#evGl').textContent = inr(-A.glNet);
$('#evGap').textContent = inr(A.gap);

/* ---------- Engines ---------- */
const base = new URL(ENGINE_BASE, document.baseURI);
// Engine files are served as-is or gzip-compressed (to fit host file limits); gzip is detected by its magic bytes.
async function load(name, type) {
  const r = await fetch(new URL(name, base));
  if (!r.ok) throw new Error(`Could not download ${name} (HTTP ${r.status}). Check your connection and run again.`);
  const buf = new Uint8Array(await r.arrayBuffer());
  if (buf[0] !== 0x1f || buf[1] !== 0x8b) return new Blob([buf], { type });
  return new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip')), { headers: { 'Content-Type': type } }).blob();
}
const SEED_PG = sqlInserts(D, 'pg');
const SEED_DUCK = sqlInserts(D, 'duck');
let pgP = null, duckP = null;
async function seedPg(db) {
  await db.exec(`SET TimeZone = 'Asia/Kolkata'; DROP TABLE IF EXISTS ledger_postings, accounts, gl_accounts, correction_requests;`);
  await db.exec(SEED_PG);
  await db.exec(`INSERT INTO correction_requests VALUES ${[...D.requests, ...state.requests].map(requestValues).join(',')};`);
}
function getPg() {
  return pgP ||= (async () => {
    const [mod, w, i, data] = await Promise.all([
      import(new URL('pglite/index.js', base).href),
      load('pglite.wasm', 'application/wasm'), load('initdb.wasm', 'application/wasm'), load('pglite.data.wasm', 'application/octet-stream'),
    ]);
    const [pm, im] = await Promise.all([WebAssembly.compile(await w.arrayBuffer()), WebAssembly.compile(await i.arrayBuffer())]);
    const keep = (v) => v;
    const db = await mod.PGlite.create({ pgliteWasmModule: pm, initdbWasmModule: im, fsBundle: data, parsers: { 20: (v) => Number(v), 1082: keep, 1114: keep, 1184: keep, 1700: keep } });
    await seedPg(db);
    return db;
  })().catch((e) => { pgP = null; throw e; });
}
async function seedDuck(conn) {
  await conn.query(`DROP TABLE IF EXISTS npci_raw; DROP TABLE IF EXISTS npci_net_settlement; DROP TABLE IF EXISTS ledger_extract; DROP TABLE IF EXISTS gl_accounts; DROP TABLE IF EXISTS accounts;`);
  await conn.query(SEED_DUCK);
}
function getDuck() {
  return duckP ||= (async () => {
    const [duck, wasm] = await Promise.all([import(new URL('duckdb.js', base).href), load('duckdb-eh.wasm', 'application/wasm')]);
    const worker = new Worker(new URL('duckdb-eh.worker.js', base));
    const failed = new Promise((_, rej) => worker.addEventListener('error', () => rej(new Error('DuckDB could not start in this browser. Reload the page and run again.'))));
    const db = new duck.AsyncDuckDB(new duck.VoidLogger(), worker);
    await Promise.race([db.instantiate(URL.createObjectURL(wasm)), failed]);
    const conn = await db.connect();
    await seedDuck(conn);
    return conn;
  })().catch((e) => { duckP = null; throw e; });
}
const NUMT = new Set([20, 21, 23, 700, 701, 1700]);
async function runPg(sql) {
  const db = await getPg();
  const res = await db.exec(sql);
  const last = [...res].reverse().find((r) => r.fields && r.fields.length) || null;
  const affected = res.reduce((t, r) => t + (r.affectedRows || 0), 0);
  if (!last) return { cols: [], rows: [], note: `${affected.toLocaleString('en-IN')} row${affected === 1 ? '' : 's'} changed` };
  const cols = last.fields.map((f) => ({ name: f.name, num: NUMT.has(f.dataTypeID), money: f.dataTypeID === 1700 }));
  return { cols, rows: last.rows.map((r) => cols.map((c) => r[c.name])) };
}
function arrowVal(v, t) {
  if (v === null || v === undefined) return null;
  const id = t.typeId;
  if (id === 7) { let s = String(v); const neg = s.startsWith('-'); if (neg) s = s.slice(1); const sc = t.scale || 0; if (sc) { s = s.padStart(sc + 1, '0'); s = s.slice(0, -sc) + '.' + s.slice(-sc); } return (neg ? '-' : '') + s; }
  if (id === 8) return new Date(Number(v)).toISOString().slice(0, 10);
  if (id === 10) return new Date(Number(v)).toISOString().slice(0, 19).replace('T', ' ');
  if (typeof v === 'bigint') return Number(v);
  return v;
}
async function runDuck(sql) {
  const conn = await getDuck();
  const t = await conn.query(sql);
  const fields = t.schema.fields;
  if (!fields.length) return { cols: [], rows: [], note: 'Statement run' };
  const cols = fields.map((f) => ({ name: f.name, num: [2, 3, 7].includes(f.type.typeId), money: f.type.typeId === 7 }));
  const vecs = fields.map((_, i) => t.getChildAt(i));
  const rows = [];
  for (let r = 0; r < t.numRows; r++) rows.push(fields.map((f, i) => arrowVal(vecs[i].get(r), f.type)));
  return { cols, rows };
}
const run = (eng, sql) => (eng === 'pg' ? runPg(sql) : runDuck(sql));
const num = (v) => (v === null || v === '' || typeof v === 'boolean' || isNaN(Number(v)) ? null : Math.round(Number(v) * 100));
const colWith = (res, val) => res.cols.findIndex((c, i) => res.rows.some((r) => String(r[i]) === val));
const distinctIn = (res, i) => new Set(res.rows.map((r) => String(r[i])));

/* ---------- Tables shown inside each console ---------- */
const TBL = {
  ledger_postings: ['Postgres · core ledger, system of record. Two legs per transaction: the customer leg (CUST) and the settlement GL leg (GL).', 'posting_id, txn_ref, leg, account_id, value_date, dr_cr, amount, channel, narration, correction_ref, posted_at'],
  ledger_extract: ['DuckDB · copy of ledger_postings taken by the 06:00 extract job.', 'posting_id, txn_ref, leg, account_id, value_date, dr_cr, amount, channel, narration, correction_ref, posted_at'],
  npci_raw: ["DuckDB · NPCI's raw file for 16 Oct: one row per settled UPI transaction. rrn matches txn_ref in the ledger. dr_cr is from our customer's side.", 'rrn, account_id, dr_cr, amount, txn_date, settled_at, response_code'],
  npci_net_settlement: ["DuckDB · NPCI's net settlement for 16 Oct: one row.", 'settlement_date, inward_amount, outward_amount, net_amount, position'],
  correction_requests: ['Postgres · corrections raised by Data Platform and decided by Finance Control.', 'request_id, break_type, txn_ref, posting_ref, account_id, dr_cr, amount, reason, status, maker, checker, checker_note, raised_at, decided_at'],
  accounts: ['Customer accounts.', 'account_id, product, branch, opened_on'],
  gl_accounts: ['General ledger accounts. GL-UPI-STL is the UPI settlement account with NPCI.', 'gl_code, name'],
};
const tblsHtml = (names) => `<details class="tbls"><summary>Tables</summary>${names.map((n) => `<div class="tbl"><h4>${n}</h4><p>${esc(TBL[n][0])}</p><code>${TBL[n][1]}</code></div>`).join('')}</details>`;

/* ---------- Investigations ---------- */
const INV = [
  {
    id: 'a', eng: 'pg', title: 'Check that the ledger balances', q: 'Do debits equal credits for UPI on 16 Oct?',
    body: '<p>Every posting has two legs: the customer account and the UPI settlement GL. If debits and credits for the day do not agree, the posting engine itself is broken and nothing downstream can be trusted.</p>',
    ask: 'Return total debits and total credits for UPI postings with value date 16 Oct, across both legs.',
    tables: ['ledger_postings', 'gl_accounts'],
    starter: `SELECT leg, dr_cr, COUNT(*) AS postings\nFROM ledger_postings\nWHERE channel = 'UPI'\nGROUP BY leg, dr_cr\nORDER BY leg, dr_cr;`,
    hint: `Sum each side separately in one query: <code class="i">SUM(CASE WHEN dr_cr = 'DR' THEN amount ELSE 0 END)</code>, and the same for 'CR'. Keep the filter on UPI and the value date.`,
    solution: S.balance,
    check(res) {
      const v = (res.rows[0] || []).map(num).filter((x) => x !== null);
      const t = A.drTotal;
      if (v.filter((x) => x === t).length >= 2) return { ok: true, html: `<p><strong>The ledger balances.</strong> Debits ${inr(t)}, credits ${inr(t)}. Every customer posting has its GL leg, so the posting engine is not creating or losing money.</p><p>The ${inr(A.gap)} is a difference between the ledger and NPCI. Look at what NPCI settled.</p>` };
      if (v.length >= 2 && v[0] === v[1]) return { ok: false, html: `<p><strong>Balanced, but for a wider set.</strong> Those totals include other channels or days. Filter to UPI with value date 16 Oct.</p>` };
      if (v.includes(t)) return { ok: false, html: `<p><strong>Halfway.</strong> One side is right. Return debits and credits side by side so they can be compared.</p>` };
      return { ok: false, html: `<p><strong>Not yet.</strong> Return one row with two numbers: total debits and total credits for UPI on 16 Oct.</p>` };
    },
    reg: () => ({ t: 'Ledger balances', d: `Debits = credits = ${inr(A.drTotal)}. The posting engine is not the cause.`, a: '' }),
    bridge: '<p>On a Cloudera estate this check runs against the lake copy through Impala or Hive, never against the live core banking database. The SQL is unchanged.</p>',
  },
  {
    id: 'b', eng: 'duck', title: "Match NPCI's raw file to the ledger", q: 'Is every settled transaction posted?',
    body: "<p>At 06:00 the extract job copied the ledger into the analytics store as <code class=\"i\">ledger_extract</code>. NPCI's raw file is loaded as <code class=\"i\">npci_raw</code>. The match key is the RRN: <code class=\"i\">rrn</code> in NPCI's file, <code class=\"i\">txn_ref</code> in the ledger.</p>",
    ask: "Return the NPCI transactions that have no posting in the ledger.",
    tables: ['npci_raw', 'ledger_extract', 'npci_net_settlement'],
    starter: `SELECT n.rrn, n.account_id, n.dr_cr, n.amount, l.posting_id\nFROM npci_raw n\nLEFT JOIN ledger_extract l\n  ON l.txn_ref = n.rrn AND l.leg = 'CUST'\nLIMIT 10;`,
    hint: 'A LEFT JOIN keeps every NPCI row. Where the ledger has no match, its columns come back NULL. Keep only those rows.',
    solution: S.unmatched.leftjoin,
    check(res) {
      const ci = colWith(res, A.missing.rrn);
      if (ci >= 0 && res.rows.length === 1) return { ok: true, html: `<p><strong>Found one.</strong> RRN ${A.missing.rrn}: an inward credit of ${inr(A.missing.amount)} to ${A.missing.account_id}. NPCI settled it, so the money is on its way to Harbour, but the customer was never credited.</p><p>That explains ${inr(A.missing.amount)} of the ${inr(A.gap)}.</p>` };
      if (ci >= 0) return { ok: false, html: `<p><strong>Nearly.</strong> The unposted transaction is in your result, with ${(res.rows.length - 1).toLocaleString('en-IN')} other rows. Keep only the NPCI rows without a ledger match.</p>` };
      if (res.rows.length >= 1800) return { ok: false, html: `<p><strong>Not yet.</strong> That returns every NPCI row. Filter to rows where the ledger side is NULL.</p>` };
      return { ok: false, html: '<p><strong>Not yet.</strong> Join the NPCI file to the ledger on the RRN and keep the NPCI rows without a match.</p>' };
    },
    reg: () => ({ t: 'Unposted inward credit', d: `RRN ${A.missing.rrn} · ${A.missing.account_id} · settled by NPCI, never credited`, a: inr(A.missing.amount) }),
    amt: A.missing.amount,
    bridge: '<p>On Cloudera, NiFi or a change-data-capture tool usually lands the extract and the NPCI files in HDFS or Ozone, and Impala or Hive does the matching. DuckDB also accepts <code class="i">ANTI JOIN</code>; Impala has <code class="i">LEFT ANTI JOIN</code>. The LEFT JOIN … IS NULL form works on every engine.</p>',
  },
  {
    id: 'c', eng: 'pg', title: 'Look for double postings', q: 'Did anything post more than once?',
    body: '<p>Posting jobs retry when a call to the core times out. If the first attempt had already succeeded, the transaction posts twice. A duplicate shows up as the same RRN on more postings than it should have.</p>',
    ask: 'Return the UPI references that were posted more than once on 16 Oct.',
    tables: ['ledger_postings'],
    starter: `SELECT txn_ref, COUNT(*) AS postings\nFROM ledger_postings\nWHERE channel = 'UPI'\n  AND value_date = DATE '2026-10-16'\nGROUP BY txn_ref\nORDER BY postings DESC\nLIMIT 5;`,
    hint: 'Each transaction has two legs, so every reference appears twice even when nothing is wrong. Count the customer leg only, or group by reference and leg.',
    solution: S.dups.custleg,
    check(res) {
      const ci = colWith(res, A.dup.rrn);
      if (ci >= 0 && distinctIn(res, ci).size === 1) return { ok: true, html: `<p><strong>Found it.</strong> RRN ${A.dup.rrn} posted twice, three seconds apart: the posting job timed out and retried after the first attempt had succeeded. ${A.dup.account_id} was debited ${inr(A.dup.amount)} twice.</p><p>This also explains the overnight check. It counted posting rows. Counting distinct RRNs gives ${A.upiDistinct.toLocaleString('en-IN')}, not 1,800.</p>` };
      if (res.rows.length >= 1700) return { ok: false, html: `<p><strong>Every transaction is in there.</strong> ${res.rows.length.toLocaleString('en-IN')} references appear more than once because each has a customer leg and a GL leg. Count one leg, or group by reference and leg.</p>` };
      if (ci >= 0) return { ok: false, html: '<p><strong>Nearly.</strong> The duplicate is in your result, with other references. Keep only references posted more often than they should be.</p>' };
      return { ok: false, html: '<p><strong>Not yet.</strong> Group UPI postings for 16 Oct by reference and keep the groups with too many rows.</p>' };
    },
    reg: () => ({ t: 'Duplicate outward debit', d: `RRN ${A.dup.rrn} · ${A.dup.account_id} · posted twice after a retry`, a: inr(A.dup.amount) }),
    amt: A.dup.amount,
    bridge: '<p>Postgres can stop this at the source with a unique index on (txn_ref, leg). Hive and Impala tables on HDFS do not enforce primary keys (Kudu tables are the exception), so on a lake this check has to run as a data-quality test after every load.</p>',
  },
];

/* ---------- Rendering helpers ---------- */
function renderResult(res, ms) {
  if (!res.cols.length) return `<p class="status">${esc(res.note || 'Done')} · ${ms} ms</p>`;
  const shown = res.rows.slice(0, 50);
  const fmt = (v, c) => (v === null ? '<span class="nul">NULL</span>' : c.money && !isNaN(Number(v)) ? Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : esc(v));
  return `<p class="status">${res.rows.length.toLocaleString('en-IN')} row${res.rows.length === 1 ? '' : 's'}${res.rows.length > 50 ? ', first 50 shown' : ''} · ${ms} ms</p><div class="grid"><table class="r"><thead><tr>${res.cols.map((c) => `<th${c.num ? ' class="n"' : ''}>${esc(c.name)}</th>`).join('')}</tr></thead><tbody>${shown.map((r) => `<tr>${r.map((v, i) => `<td${res.cols[i].num ? ' class="n"' : ''}>${fmt(v, res.cols[i])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
const engLabel = { pg: 'Postgres · core ledger', duck: 'DuckDB · analytics copy' };
const startMsg = { pg: 'Starting Postgres (about 8 MB, first time only)…', duck: 'Starting DuckDB (about 9 MB, first time only)…' };
const started = (eng) => (eng === 'pg' ? pgP : duckP);

function consoleBlock(c) {
  return `<div class="console"><div class="chead"><span>${engLabel[c.eng]}</span><span class="kbd">Ctrl/⌘ + Enter to run</span></div>
    <textarea id="sql-${c.id}" wrap="off" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" aria-label="SQL: ${esc(c.title)}"></textarea>${tblsHtml(c.tables)}</div>
    <div class="actions"><button class="b run" type="button">Run</button><button class="b alt chk" type="button">${c.checkLabel || 'Check'}</button><button class="b alt hnt" type="button" aria-expanded="false">Hint</button><button class="b alt solb" type="button" aria-expanded="false">Show solution</button></div>
    ${c.checkNote ? `<p class="status" style="margin:10px 0 0">${c.checkNote}</p>` : ''}
    <div class="hint" hidden>${c.hint}</div>
    <div class="sol" hidden><pre>${esc(c.solution)}</pre><button class="b alt use" type="button">Copy into editor</button></div>
    <div class="out" aria-live="polite"></div><div class="fbw" aria-live="polite"></div>
    <details class="bridge"><summary>On a Cloudera/Hadoop stack</summary>${c.bridge}</details>`;
}
function wireConsole(el, c, onCheck) {
  const ta = $('textarea', el), out = $('.out', el), fbw = $('.fbw', el);
  ta.value = state.sql[c.id] || c.starter;
  const fit = () => { ta.style.height = 'auto'; ta.style.height = Math.max(120, ta.scrollHeight + 2) + 'px'; };
  ta.addEventListener('input', () => { fit(); state.sql[c.id] = ta.value; save(); });
  requestAnimationFrame(fit);
  const btns = el.querySelectorAll('.run,.chk');
  const busy = (b) => btns.forEach((x) => (x.disabled = b));
  const doRun = async () => {
    busy(true); fbw.innerHTML = '';
    out.innerHTML = `<p class="status">${started(c.eng) ? 'Running…' : startMsg[c.eng]}</p>`;
    const t0 = performance.now();
    try { const res = await run(c.eng, ta.value); out.innerHTML = renderResult(res, Math.round(performance.now() - t0)); return res; }
    catch (e) { out.innerHTML = `<div class="err">${esc(e.message || e)}</div>`; return null; }
    finally { busy(false); }
  };
  const show = (r) => { fbw.innerHTML = `<div class="fb ${r.ok ? 'ok' : 'no'}">${r.html}</div>`; };
  $('.run', el).addEventListener('click', doRun);
  $('.chk', el).addEventListener('click', async () => {
    state.checks[c.id] = (state.checks[c.id] || 0) + 1; save();
    if (c.customCheck) {
      busy(true); fbw.innerHTML = ''; out.innerHTML = `<p class="status">${started(c.eng) ? c.busyMsg : startMsg[c.eng]}</p>`;
      try { const r = await c.customCheck(ta.value); out.innerHTML = r.out || ''; show(r); if (r.ok) onCheck(); }
      catch (e) { out.innerHTML = `<div class="err">${esc(e.message || e)}</div>`; }
      finally { busy(false); }
      return;
    }
    const res = await doRun();
    if (!res) return;
    const r = c.check(res); show(r); if (r.ok) onCheck();
  });
  ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); doRun(); } });
  const tog = (btn, box, on, off, flag) => btn.addEventListener('click', () => { box.hidden = !box.hidden; btn.setAttribute('aria-expanded', String(!box.hidden)); btn.textContent = box.hidden ? on : off; if (!box.hidden) { state[flag][c.id] = true; save(); } });
  tog($('.hnt', el), $('.hint', el), 'Hint', 'Hide hint', 'hint');
  tog($('.solb', el), $('.sol', el), 'Show solution', 'Hide solution', 'sol');
  $('.use', el).addEventListener('click', () => { ta.value = c.solution; fit(); state.sql[c.id] = ta.value; save(); ta.focus(); });
  return { ta, out, fbw, fit };
}

/* ---------- Build the investigations ---------- */
const pathsEl = $('#paths'), invsEl = $('#invs');
INV.forEach((c) => {
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'path'; btn.id = 'path-' + c.id; btn.setAttribute('aria-controls', 'inv-' + c.id); btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = `<strong>${c.title}</strong><span class="q">${c.q}</span><span class="st"></span>`;
  pathsEl.appendChild(btn);
  const el = document.createElement('section');
  el.className = 'inv'; el.id = 'inv-' + c.id; el.hidden = true; el.setAttribute('aria-labelledby', 'invh-' + c.id);
  el.innerHTML = `<p class="eye">${c.eng === 'pg' ? 'Postgres' : 'DuckDB'}</p><h3 id="invh-${c.id}">${c.title}</h3>${c.body}<p class="ask">${c.ask}</p>${consoleBlock(c)}`;
  invsEl.appendChild(el);
  wireConsole(el, c, () => { state.done[c.id] = true; save(); paint(); });
  btn.addEventListener('click', () => {
    const open = el.hidden;
    el.hidden = !open; state.opened[c.id] = open; save(); paint();
    if (open) el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });
});

/* ---------- Correction: request form (maker) and Finance Control (checker) ---------- */
const BREAKS = { [A.missing.rrn]: { type: 'UNPOSTED_CREDIT', ...A.missing }, [A.dup.rrn]: { type: 'DUPLICATE_DEBIT', ...A.dup } };
const RAW_RRNS = new Set(D.raw.map((r) => r.rrn));
const TYPE_LABEL = { UNPOSTED_CREDIT: 'Unposted inward credit', DUPLICATE_DEBIT: 'Duplicate outward debit' };
const approved = () => state.requests.filter((r) => r.status === 'APPROVED');
function review(f) {
  const rrn = f.rrn.trim(), acct = f.account.trim().toUpperCase();
  const amount = Math.round(Number(String(f.amount).replace(/[₹,\s]/g, '')) * 100);
  const prior = approved().find((r) => r.txn_ref === rrn);
  if (prior) return { dupe: true, note: `Already approved as ${prior.request_id}. Nothing new raised.` };
  const b = BREAKS[rrn];
  let note = null;
  if (!b) note = RAW_RRNS.has(rrn) ? 'This RRN is posted once and agrees with NPCI. There is nothing to correct.' : 'There is no NPCI or ledger record for this RRN.';
  else if (f.type !== b.type) note = `The break register shows this RRN as an ${TYPE_LABEL[b.type].toLowerCase()}.`;
  else if (acct !== b.account_id) note = 'The account does not match the NPCI record for this RRN.';
  else if (f.dir !== 'CR') note = b.type === 'UNPOSTED_CREDIT' ? 'The customer was never credited. The correction credits the customer.' : 'The customer was debited twice. The correction is a credit that reverses one debit.';
  else if (amount !== b.amount) note = 'The amount does not match the NPCI record for this RRN.';
  const n = ++state.seq;
  const hhmm = `${String(8 + Math.floor((40 + n * 3) / 60)).padStart(2, '0')}:${String((40 + n * 3) % 60).padStart(2, '0')}`;
  const req = {
    request_id: `CR-20261017-${String(n).padStart(3, '0')}`, break_type: f.type, txn_ref: rrn || '-', posting_ref: f.type === 'DUPLICATE_DEBIT' ? `REV${rrn}` : rrn || '-',
    account_id: acct || '-', dr_cr: f.dir, amount: isNaN(amount) ? 0 : amount, reason: f.reason.trim().slice(0, 120), status: note ? 'REJECTED' : 'APPROVED',
    maker: 'data.platform', checker: 'Finance Control', checker_note: note || (b.type === 'UNPOSTED_CREDIT' ? 'Agrees with NPCI raw file. Credit with value date 16 Oct.' : 'Duplicate confirmed: same RRN posted twice. Reverse one debit.'),
    raised_at: `2026-10-17 ${hhmm}:00`, decided_at: `2026-10-17 ${hhmm}:40`,
  };
  return { req };
}

const JOB = {
  id: 'e', eng: 'pg', title: 'The correction job', tables: ['correction_requests', 'ledger_postings', 'gl_accounts'],
  starter: S.jobStarter, solution: S.job.notexists, checkLabel: 'Run job, then retry',
  checkNote: 'Runs your job on the ledger as it stood at 06:00, checks every account and the settlement GL, then runs the job again as a retry would.',
  busyMsg: 'Running the job, then a retry…',
  hint: `Three things Finance will check: only <code class="i">APPROVED</code> requests post; each correction posts both legs, customer and <code class="i">GL-UPI-STL</code>, in opposite directions; and a second run adds nothing. A <code class="i">CROSS JOIN (VALUES ('CUST'), ('GL'))</code> gives you both legs, and <code class="i">NOT EXISTS</code> on (correction_ref, leg) makes the retry safe.`,
  bridge: '<p>On a Cloudera lake the same job is usually a <code class="i">MERGE</code>: Hive supports MERGE on transactional and Iceberg tables. On Kudu tables, Impala\'s <code class="i">UPSERT</code> does the job. Whatever the engine, the test is the same: run it twice, get one result.</p>',
};
async function integrity(db) {
  return (await db.query(`SELECT COUNT(*)::int AS n, md5(string_agg(posting_id || '|' || txn_ref || '|' || leg || '|' || account_id || '|' || value_date || '|' || dr_cr || '|' || amount || '|' || channel, ',' ORDER BY posting_id)) AS h FROM ledger_postings WHERE posting_id <= ${A.maxPostingId}`)).rows[0];
}
async function reconcile(db) {
  const rows = (await db.query(`SELECT account_id, SUM(CASE WHEN dr_cr = 'CR' THEN amount ELSE -amount END) AS net FROM ledger_postings WHERE leg = 'CUST' AND channel = 'UPI' AND value_date = DATE '2026-10-16' GROUP BY account_id`)).rows;
  const got = Object.fromEntries(rows.map((r) => [r.account_id, Math.round(Number(r.net) * 100)]));
  const keys = [...new Set([...Object.keys(got), ...Object.keys(A.rawByAccount)])].sort();
  const breaks = keys.map((k) => ({ k, l: got[k] || 0, s: A.rawByAccount[k] || 0 })).filter((x) => x.l !== x.s);
  const g = (await db.query(`SELECT COALESCE(SUM(CASE WHEN dr_cr = 'DR' THEN amount ELSE -amount END), 0) AS g FROM ledger_postings WHERE leg = 'GL' AND channel = 'UPI' AND value_date = DATE '2026-10-16'`)).rows[0].g;
  return { breaks, gl: Math.round(Number(g) * 100) };
}
const breakTable = (b) => `<div class="grid" style="margin-top:8px"><table class="r"><thead><tr><th>account_id</th><th class="n">ledger</th><th class="n">NPCI</th><th class="n">difference</th></tr></thead><tbody>${b.slice(0, 8).map((x) => `<tr><td>${x.k}</td><td class="n">${inr(x.l)}</td><td class="n">${inr(x.s)}</td><td class="n">${inr(x.l - x.s)}</td></tr>`).join('')}</tbody></table></div>`;
let baseline = null;
JOB.customCheck = async (sql) => {
  const db = await getPg();
  await seedPg(db);
  baseline ||= await integrity(db);
  const statuses = Object.fromEntries([...D.requests, ...state.requests].map((r) => [r.request_id, r.status]));
  const stage = async (label) => {
    try { await db.exec(sql); } catch (e) { return { err: `<p><strong>The job failed on the ${label}.</strong></p><div class="err">${esc(e.message)}</div>` }; }
    const now = await integrity(db);
    if (now.n < baseline.n) return { err: `<p><strong>Postings were deleted on the ${label}.</strong> The ledger is append-only. Corrections are new postings that reference the request.</p>` };
    if (now.h !== baseline.h) return { err: `<p><strong>An existing posting was changed on the ${label}.</strong> The ledger is append-only. Post a correcting entry instead.</p>` };
    const added = (await db.query(`SELECT correction_ref, leg, dr_cr, amount FROM ledger_postings WHERE posting_id > ${A.maxPostingId}`)).rows;
    if (added.some((r) => !r.correction_ref)) return { err: `<p><strong>The ${label} posted entries without a correction reference.</strong> Every posting the job makes must carry the request_id in correction_ref, so audit can trace it to an approval.</p>` };
    const bad = [...new Set(added.map((r) => r.correction_ref))].filter((id) => statuses[id] !== 'APPROVED');
    if (bad.length) return { err: `<p><strong>The job posted ${bad.join(', ')}, which ${bad.length === 1 ? 'is' : 'are'} ${bad.map((id) => (statuses[id] || 'not a request').toLowerCase()).join(', ')}.</strong> Only requests Finance Control approved may post.</p>` };
    const per = {};
    for (const r of added) { const p = (per[r.correction_ref] ||= { legs: new Set(), d: 0 }); p.legs.add(r.leg); p.d += (r.dr_cr === 'DR' ? 1 : -1) * Math.round(Number(r.amount) * 100); }
    const unbalanced = Object.entries(per).filter(([, p]) => p.d !== 0 || p.legs.size < 2).map(([k]) => k);
    if (unbalanced.length) return { err: `<p><strong>${unbalanced.join(', ')} posted only one side.</strong> Every correction needs both legs: the customer account and the UPI settlement GL (GL-UPI-STL), in opposite directions and for the same amount. Without the GL leg the books stop balancing.</p>` };
    return { rec: await reconcile(db), rows: now.n + added.length };
  };
  const s1 = await stage('first run');
  if (s1.err) return { ok: false, html: s1.err };
  if (s1.rec.breaks.length || s1.rec.gl !== A.npciNet) return { ok: false, html: `<p><strong>First run: ${s1.rec.breaks.length} account${s1.rec.breaks.length === 1 ? '' : 's'} still disagree${s1.rec.breaks.length === 1 ? 's' : ''} with NPCI.</strong> Check that both approved requests post, to the right account, with value date 16 Oct and channel 'UPI'.</p>${breakTable(s1.rec.breaks)}` };
  const s2 = await stage('retry');
  if (s2.err) return { ok: false, html: s2.err };
  if (s2.rows !== s1.rows) return { ok: false, html: `<p><strong>First run: books agree with NPCI. Retry: ${s2.rows - s1.rows} more posting${s2.rows - s1.rows === 1 ? '' : 's'}.</strong></p><p>The retry posted the corrections again. That is the same failure that created the duplicate this morning. Make the job skip any request whose legs are already in the ledger.</p>${breakTable(s2.rec.breaks)}` };
  return { ok: true, html: `<p><strong>Books agree with NPCI.</strong> The first run posted ${s1.rows - baseline.n} legs for ${approved().length} approved requests and the retry posted none. The rejected requests were left alone.</p><p>The settlement GL now shows ${inr(-A.npciNet)} payable, the same as NPCI. The duplicate debit is still in the ledger, with its reversal beside it: that is the trail audit expects.</p>` };
};

const stepsEl = $('#steps');
const stepD = document.createElement('section');
stepD.className = 'step'; stepD.id = 'step-d'; stepD.setAttribute('aria-labelledby', 'sdh');
stepD.innerHTML = `<p class="eye">Step 1 of 2</p><h3 id="sdh">Raise the corrections</h3>
  <p>Raise one request per break. Finance Control checks each against the NPCI file before approving.</p>
  <form class="req" id="reqForm" novalidate>
    <label class="full">Break<select id="fType" required><option value="">Choose…</option><option value="UNPOSTED_CREDIT">Unposted inward credit</option><option value="DUPLICATE_DEBIT">Duplicate outward debit</option></select></label>
    <label>NPCI RRN<input id="fRrn" inputmode="numeric" autocomplete="off" placeholder="12 digits" required></label>
    <label>Account<input id="fAcct" autocomplete="off" autocapitalize="characters" placeholder="HB…" required></label>
    <label>Correction<select id="fDir" required><option value="">Choose…</option><option value="CR">Credit the customer</option><option value="DR">Debit the customer</option></select></label>
    <label>Amount (₹)<input id="fAmt" inputmode="decimal" autocomplete="off" placeholder="0.00" required></label>
    <label class="full">Reason<input id="fReason" autocomplete="off" placeholder="What happened and how you confirmed it" required><span class="hintline">Finance files this with the correction.</span></label>
    <div class="full"><button class="b" type="submit" id="fSend">Send for approval</button></div>
  </form>
  <div class="fbw" id="reqFb" aria-live="polite"></div>
  <div id="reqList"></div>`;
stepsEl.appendChild(stepD);
const stepE = document.createElement('section');
stepE.className = 'step'; stepE.id = 'step-e'; stepE.setAttribute('aria-labelledby', 'seh');
stepE.innerHTML = `<p class="eye">Step 2 of 2</p><h3 id="seh">Run the correction job</h3>
  <p>The job reads approved requests and posts them to the ledger under its own service account. Jobs at Harbour retry on timeout, which is how the duplicate happened. Finance will not accept a job that can post twice.</p>
  <div id="jobLock" class="locked">Opens when both corrections are approved.</div><div id="jobBody" hidden>${consoleBlock(JOB)}</div>`;
stepsEl.appendChild(stepE);
wireConsole(stepE, JOB, () => { state.done.e = true; save(); paint(); $('#debrief').scrollIntoView({ block: 'start' }); });

function renderRequests() {
  const rows = [...D.requests, ...state.requests];
  $('#reqList').innerHTML = `<p class="status" style="margin:16px 0 6px">correction_requests</p><div class="grid"><table class="r"><thead><tr><th>request_id</th><th>break_type</th><th>txn_ref</th><th>account_id</th><th>dr_cr</th><th class="n">amount</th><th>status</th><th>checker_note</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${r.request_id}</td><td>${r.break_type}</td><td>${esc(r.txn_ref)}</td><td>${esc(r.account_id)}</td><td>${r.dr_cr}</td><td class="n">${(r.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td>${r.status}</td><td>${esc(r.checker_note)}</td></tr>`).join('')}</tbody></table></div>`;
}
$('#reqForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = { type: $('#fType').value, rrn: $('#fRrn').value, account: $('#fAcct').value, dir: $('#fDir').value, amount: $('#fAmt').value, reason: $('#fReason').value };
  const fb = $('#reqFb');
  const missingField = !f.type ? 'fType' : !f.rrn.trim() ? 'fRrn' : !f.account.trim() ? 'fAcct' : !f.dir ? 'fDir' : !f.amount.trim() || isNaN(Number(f.amount.replace(/[₹,\s]/g, ''))) ? 'fAmt' : f.reason.trim().length < 12 ? 'fReason' : null;
  if (missingField) { fb.innerHTML = `<div class="fb no"><p><strong>Finance can't review this yet.</strong> ${missingField === 'fReason' ? 'Add a reason Finance can file: what happened and how you confirmed it.' : missingField === 'fAmt' ? 'Enter the amount in rupees, for example 1250.00.' : 'Complete every field.'}</p></div>`; $('#' + missingField).focus(); return; }
  const r = review(f);
  if (r.dupe) { fb.innerHTML = `<div class="fb ok"><p>${r.note}</p></div>`; return; }
  const btn = $('#fSend'); btn.disabled = true; btn.textContent = 'With Finance Control…';
  try {
    const db = await getPg();
    await db.exec(`INSERT INTO correction_requests VALUES ${requestValues(r.req)};`);
    state.requests.push(r.req); save();
  } catch (err) { state.seq--; fb.innerHTML = `<div class="err">${esc(err.message || err)}</div>`; btn.disabled = false; btn.textContent = 'Send for approval'; return; }
  await new Promise((res) => setTimeout(res, 700));
  btn.disabled = false; btn.textContent = 'Send for approval';
  const ok = r.req.status === 'APPROVED';
  fb.innerHTML = `<div class="fb ${ok ? 'ok' : 'no'}"><p><strong>${r.req.request_id} ${ok ? 'approved' : 'rejected'} by Finance Control.</strong> ${esc(r.req.checker_note)}</p>${ok && approved().length < 2 ? '<p>One more break to raise.</p>' : ''}</div>`;
  if (ok) $('#reqForm').reset();
  renderRequests(); paint();
});

/* ---------- Progress, register, debrief ---------- */
const STEP_IDS = ['a', 'b', 'c', 'd', 'e'];
function paint() {
  state.done.d = approved().length >= 2;
  const found = INV.filter((c) => c.amt && state.done[c.id]);
  const explained = found.reduce((t, c) => t + c.amt, 0);
  const anyOpen = INV.some((c) => state.opened[c.id] || state.done[c.id]);
  INV.forEach((c) => {
    const b = $('#path-' + c.id), el = $('#inv-' + c.id);
    el.hidden = !state.opened[c.id];
    b.setAttribute('aria-expanded', String(!el.hidden));
    b.classList.toggle('done', !!state.done[c.id]);
    $('.st', b).textContent = state.done[c.id] ? 'Done' : el.hidden ? 'Open' : 'Close';
    el.classList.toggle('done', !!state.done[c.id]);
  });
  const reg = $('#register');
  reg.hidden = !anyOpen;
  const items = INV.filter((c) => state.done[c.id]).map((c) => c.reg());
  $('#regList').innerHTML = items.length ? items.map((i) => `<li><span>${i.t}</span><span class="d">${esc(i.d)}</span><span class="a">${i.a}</span></li>`).join('') : '<li class="empty">Findings appear here as you confirm them.</li>';
  const left = A.gap - explained;
  $('#regSum').textContent = left === 0 ? `${inr(A.gap)} explained` : `${inr(explained)} of ${inr(A.gap)} explained`;
  const complete = state.done.b && state.done.c;
  $('#correct').hidden = !complete;
  stepD.classList.toggle('done', !!state.done.d);
  $('#jobLock').hidden = !!state.done.d; $('#jobBody').hidden = !state.done.d;
  stepE.classList.toggle('done', !!state.done.e);
  const n = STEP_IDS.filter((k) => state.done[k]).length;
  const trk = $('#tracker');
  trk.hidden = !anyOpen || !!state.done.e;
  document.body.classList.toggle('tracking', !trk.hidden);
  $('#trkAmt').textContent = inr(left); $('#trkAmt').classList.toggle('zero', left === 0);
  $('#trkSteps').textContent = `${n} of 5 steps`;
  renderDebrief();
}
function help(id) { return state.sol[id] ? 'Solution' : state.hint[id] ? 'Hint' : 'None'; }
function renderDebrief() {
  const el = $('#debrief');
  el.hidden = !state.done.e;
  if (el.hidden) { el.innerHTML = ''; return; }
  const rej = state.requests.filter((r) => r.status === 'REJECTED').length;
  el.innerHTML = `<h2 id="dbH">Books closed</h2>
  <p>The settlement GL agrees with NPCI's net settlement for 16 Oct. Finance can sign off.</p>
  <div class="mtx"><table><thead><tr><th></th><th class="n">This morning</th><th class="n">Now</th></tr></thead><tbody>
    <tr><td class="k">NPCI net settlement, payable</td><td class="n">${inr(-A.npciNet)}</td><td class="n">${inr(-A.npciNet)}</td></tr>
    <tr><td class="k">UPI settlement GL, payable</td><td class="n">${inr(-A.glNet)}</td><td class="n">${inr(-A.npciNet)}</td></tr>
    <tr><td class="k">Difference</td><td class="n">${inr(A.gap)}</td><td class="n">${inr(0)}</td></tr>
  </tbody></table></div>
  <h3>What you did</h3>
  <div class="mtx"><table><thead><tr><th>Step</th><th>Result</th><th>Help</th></tr></thead><tbody>
    <tr><td class="k">Ledger balance check</td><td>${state.done.a ? 'Confirmed debits equal credits, ruling out a posting-engine fault' : 'Not done. It rules out a posting-engine fault before anyone raises corrections, and Finance would ask for it.'}</td><td>${state.done.a ? help('a') : '–'}</td></tr>
    <tr><td class="k">NPCI-to-ledger match</td><td>Found the unposted ${inr(A.missing.amount)} credit</td><td>${help('b')}</td></tr>
    <tr><td class="k">Duplicate check</td><td>Found the ${inr(A.dup.amount)} debit posted twice</td><td>${help('c')}</td></tr>
    <tr><td class="k">Correction requests</td><td>2 approved${rej ? `, ${rej} rejected by Finance Control first` : ', none rejected'}</td><td>–</td></tr>
    <tr><td class="k">Correction job</td><td>Posted 4 legs, retry posted none; ${state.checks.e || 1} check${(state.checks.e || 1) === 1 ? '' : 's'} to get there</td><td>${help('e')}</td></tr>
  </tbody></table></div>
  <h3>The customers</h3>
  <p>${A.missing.account_id} receives ${inr(A.missing.amount)} today with value date 16 Oct, inside the T+1 limit, so no compensation is due. ${A.dup.account_id} gets ${inr(A.dup.amount)} back. Both would have found out from their statements before Harbour did if the count check had been the only control.</p>
  <h3>Controls that would have caught this overnight</h3>
  <ul>
    <li>Reconcile amounts, not only counts, and count distinct RRNs: ${A.upiDistinct.toLocaleString('en-IN')} against NPCI's 1,800 would have flagged the duplicate at once.</li>
    <li>A unique index on (txn_ref, leg) for UPI postings, so a retry cannot post a transaction twice.</li>
    <li>An alert whenever the posting job retries, with a check that the first attempt did not succeed.</li>
  </ul>
  <h3>Other correct ways to write the job</h3>
  <details class="bridge"><summary>ON CONFLICT with a unique index</summary><pre class="code" style="margin-top:10px">${esc(S.job.onconflict)}</pre></details>
  <details class="bridge"><summary>MERGE (Postgres 15 and later)</summary><pre class="code" style="margin-top:10px">${esc(S.job.merge)}</pre></details>
  <p class="status" style="margin-top:18px">Source for the T+1 rule: <a href="https://rbi.org.in/commonman/English/Scripts/Notification.aspx?Id=3074" target="_blank" rel="noopener">RBI circular on turnaround time for failed transactions, 20 Sep 2019</a>.</p>`;
}
renderRequests();
paint();
try { document.querySelector('.top nav [aria-current]')?.scrollIntoView({ block: 'nearest', inline: 'center' }); window.scrollTo(0, 0); } catch (e) {}

const msg = (t) => { const m = $('#resetMsg'); m.textContent = t; setTimeout(() => (m.textContent = ''), 5000); };
$('#resetData').addEventListener('click', async () => {
  try {
    if (pgP) await seedPg(await pgP);
    if (duckP) await seedDuck(await duckP);
    state.done.e = false; save(); paint();
    msg('Ledger restored to 06:00. Findings and approved requests are kept.');
  } catch (e) { msg('Reset failed: ' + e.message); }
});
$('#resetAll').addEventListener('click', async () => {
  state = fresh(); save();
  document.querySelectorAll('textarea').forEach((ta) => { const c = [...INV, JOB].find((x) => 'sql-' + x.id === ta.id); ta.value = c.starter; ta.dispatchEvent(new Event('input')); });
  document.querySelectorAll('.out,.fbw').forEach((x) => (x.innerHTML = ''));
  document.querySelectorAll('.hint,.sol').forEach((x) => (x.hidden = true));
  document.querySelectorAll('.hnt').forEach((b) => { b.textContent = 'Hint'; b.setAttribute('aria-expanded', 'false'); });
  document.querySelectorAll('.solb').forEach((b) => { b.textContent = 'Show solution'; b.setAttribute('aria-expanded', 'false'); });
  $('#reqFb').innerHTML = ''; $('#reqForm').reset();
  try { if (pgP) await seedPg(await pgP); if (duckP) await seedDuck(await duckP); } catch (e) {}
  renderRequests(); paint(); window.scrollTo(0, 0);
  msg('Started over.');
});
window.__ws = { A, S, run, D, state: () => state };
