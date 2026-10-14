'use strict';
(function () {
  const A = window.ATLAS, $ = id => document.getElementById(id);
  const SEV = { GO: 0, PILOT: 1, CONSTRAIN: 2, FIX: 3, STOP: 4 };
  const BANDS = ['Low', 'Medium', 'High'];
  const termMap = new Map(A.terms.map(t => [t.name, t]));

  function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function chip(call, small) { const c = el('span', 'call call-' + call.toLowerCase() + (small ? ' sm' : ''), call); c.title = A.calls[call]; return c; }
  function option(select, value, label) { const o = el('option', null, label); o.value = value; select.append(o); }
  function download(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = el('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function copy(text, statusEl) {
    try { await navigator.clipboard.writeText(text); statusEl.textContent = 'Copied.'; }
    catch (e) { statusEl.textContent = 'Copy is blocked here; use Download instead.'; }
  }

  /* ------------------------------------------------------------ the run */
  const state = { preset: A.presets[0].id, gate: 0, a: {} };
  const band = s => (s <= 1 ? 0 : s === 2 ? 1 : 2);

  function loadPreset(id) {
    state.preset = id;
    const p = A.presets.find(x => x.id === id);
    A.gates.forEach(g => { state.a[g.id] = p ? p.a[g.id].slice() : [null, null, null, null]; });
    renderRun();
  }

  function result(g) {
    const v = state.a[g.id];
    if (v.some(x => x == null)) return null;
    const bx = band(v[0] + v[1]), by = band(v[2] + v[3]), c = g.cells['' + bx + by];
    return { g, bx, by, call: c[0], label: c[1], action: c[2], ask: c[3], rung: c[4] };
  }

  function renderPresets() {
    const box = $('presets'); box.replaceChildren();
    A.presets.concat([{ id: 'blank', name: 'Your own decision' }]).forEach(p => {
      const b = el('button', 'preset', p.name); b.type = 'button';
      b.setAttribute('aria-pressed', String(state.preset === p.id));
      b.onclick = () => loadPreset(p.id);
      box.append(b);
    });
    const p = A.presets.find(x => x.id === state.preset);
    $('preset-blurb').textContent = p ? p.blurb + ' Change any answer to see the call move.' :
      'Name the decision in one sentence, then answer the 24 questions honestly. "Unknown" counts as the weakest answer.';
  }

  function renderStrip(results) {
    const box = $('gates'); box.replaceChildren();
    A.gates.forEach((g, i) => {
      const r = results[i], b = el('button', 'gate-tab'); b.type = 'button';
      b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(i === state.gate));
      b.append(el('span', 'gt-n', String(i + 1).padStart(2, '0')), el('span', 'gt-name', g.name));
      b.append(r ? chip(r.call, true) : el('span', 'call call-none sm', 'Open'));
      b.onclick = () => { state.gate = i; renderRun(); };
      box.append(b);
    });
  }

  function renderGate(r) {
    const g = A.gates[state.gate], v = state.a[g.id];
    $('gate-kicker').textContent = 'Gate ' + (state.gate + 1) + ' of 6 · ' + g.name + ' · owner: ' + g.owner;
    $('gate-q').textContent = g.q;
    $('gate-tools').textContent = 'Lenses at this gate: ' + g.tools.join(' · ');
    const box = $('axes'); box.replaceChildren();
    [g.x, g.y].forEach((ax, ai) => {
      const fs = el('fieldset', 'axis');
      const lg = el('legend'); lg.append(el('b', null, ax.name), el('span', 'small', ' · ' + ax.help)); fs.append(lg);
      ax.qs.forEach((q, qi) => {
        const k = ai * 2 + qi, name = g.id + '-' + k;
        const wrap = el('div', 'q'); wrap.append(el('p', 'q-text', q.q));
        const opts = el('div', 'opts'); opts.setAttribute('role', 'radiogroup'); opts.setAttribute('aria-label', q.q);
        q.o.forEach((txt, oi) => {
          const lab = el('label', 'opt'), inp = el('input'); inp.type = 'radio'; inp.name = name; inp.value = oi;
          inp.checked = v[k] === oi;
          inp.onchange = () => { state.a[g.id][k] = oi; renderRun(true); };
          lab.append(inp, el('span', null, txt)); opts.append(lab);
        });
        wrap.append(opts); fs.append(wrap);
      });
      const s = v.slice(ai * 2, ai * 2 + 2);
      fs.append(el('p', 'axis-band', s.some(x => x == null) ? 'Answer both to place this axis.' : ax.name + ': ' + BANDS[band(s[0] + s[1])]));
      box.append(fs);
    });

    // matrix
    const plot = $('run-plot'); plot.replaceChildren();
    for (let y = 2; y >= 0; y--) for (let x = 0; x < 3; x++) {
      const c = g.cells['' + x + y], cell = el('div', 'cell');
      cell.append(chip(c[0], true), el('span', 'cell-label', c[1]));
      if (r && r.bx === x && r.by === y) { cell.classList.add('active'); cell.setAttribute('aria-current', 'true'); }
      plot.append(cell);
    }
    $('run-axis-x').textContent = g.x.name + ' → higher';
    $('run-axis-y').textContent = g.y.name + ' → higher';

    const vd = $('gate-verdict'); vd.replaceChildren();
    if (!r) { vd.append(el('p', 'small', 'Answer all four questions to place this decision on the matrix.')); return; }
    const h = el('h3'); h.append(chip(r.call), el('span', null, ' ' + r.label)); vd.append(h);
    vd.append(el('p', 'move', r.action));
    if (r.rung) vd.append(el('p', 'small', 'Highest authority this gate allows: ' + r.rung + '.'));
    const ask = el('p', 'ask'); ask.append(el('b', null, 'Ask in the room: '), document.createTextNode(r.ask)); vd.append(ask);
  }

  function memo(results) {
    const done = results.filter(Boolean), open = results.length - done.length;
    if (!done.length) return null;
    const worst = Math.max(...done.map(r => SEV[r.call]));
    const call = Object.keys(SEV).find(k => SEV[k] === worst);
    const binding = done.filter(r => SEV[r.call] === worst);
    const bound = results[2], value = results[1], learn = results[5], commit = results[4];
    let authority = bound ? bound.rung : 'Not set: answer the Bound gate';
    if (bound && worst >= SEV.FIX) authority = 'None until the blocking gates clear; then at most ' + bound.rung;
    const ordered = done.slice().sort((a, b) => SEV[b.call] - SEV[a.call]);
    const actions = (worst === 0 ? ordered : ordered.filter(r => r.call !== 'GO')).map(r => ({ who: r.g.owner, gate: r.g.name, text: r.action }));
    const asks = ordered.slice(0, 3).map(r => r.ask);
    const kill = ['Any prohibited or out-of-authority action, even once.'];
    kill.push(learn && learn.bx === 2 ? 'No measurable lift against the holdout at the first review.' : 'No agreed baseline in place by go-live.');
    if (bound && bound.bx >= 1) kill.push('Override rate rises above the level agreed with Risk.');
    if (commit && commit.bx <= 1) kill.push('A critical data feed breaks and the automatic pause does not fire.');
    const review = !value ? 'Set once the Value gate is answered' : ['12 months, with a 90-day milestone check', '6 months', '90 days'][value.by];
    return { call, binding, authority, actions, asks, kill, review, open, bound };
  }

  function renderMemo(results) {
    const m = memo(results), box = $('memo-body'); box.replaceChildren();
    $('memo-actions').hidden = !m;
    if (!m) { box.append(el('p', 'small', 'Answer the questions in any gate to start building the call.')); return; }
    const head = el('div', 'memo-head');
    const big = el('div', 'memo-call'); big.append(el('span', 'kicker', m.open ? 'Provisional call · ' + m.open + ' gate' + (m.open > 1 ? 's' : '') + ' open' : 'The call'), chip(m.call));
    big.append(el('p', 'memo-def', A.calls[m.call]));
    head.append(big);
    const bind = el('div', 'memo-bind');
    bind.append(el('span', 'kicker', m.call === 'GO' ? 'Every gate clears' : 'Binding constraint'));
    m.binding.forEach(r => bind.append(el('p', null, r.g.name + ': ' + r.label)));
    bind.append(el('p', 'small', 'A decision is only as strong as its weakest gate. The strictest call wins.'));
    head.append(bind);
    box.append(head);

    // authority ladder
    const lad = el('div', 'ladder'); lad.append(el('span', 'kicker', 'Authority granted'));
    const ol = el('ol');
    const top = m.bound ? A.rungs.indexOf(m.bound.rung) : -1, blocked = SEV[m.call] >= SEV.FIX;
    A.rungs.forEach((name, i) => { const li = el('li', i <= top ? (blocked ? 'held' : 'on') : '', name); if (i === top) li.setAttribute('aria-current', 'step'); ol.append(li); });
    lad.append(ol, el('p', 'small', m.authority + '.'));
    box.append(lad);

    const cols = el('div', 'memo-cols');
    const a = el('div'); a.append(el('h4', null, 'Next actions'));
    const al = el('ol'); m.actions.forEach(x => { const li = el('li'); li.append(el('b', null, x.who + ' · '), document.createTextNode(x.text)); al.append(li); }); a.append(al);
    const q = el('div'); q.append(el('h4', null, 'Questions for the meeting'));
    const ql = el('ul'); m.asks.forEach(x => ql.append(el('li', null, x))); q.append(ql);
    q.append(el('h4', null, 'Stop if'));
    const kl = el('ul'); m.kill.forEach(x => kl.append(el('li', null, x))); q.append(kl);
    q.append(el('p', 'small', 'First value review: ' + m.review + '.'));
    cols.append(a, q); box.append(cols);
  }

  function memoText() {
    const results = A.gates.map(result), m = memo(results);
    if (!m) return '';
    const p = A.presets.find(x => x.id === state.preset);
    const L = ['DECISION MEMO · ReadSigil Decision Atlas', p ? 'Case: ' + p.name + ' (fictional). ' + p.blurb : 'Case: your own decision', '',
      'CALL: ' + m.call + (m.open ? ' (provisional, ' + m.open + ' gates open)' : '') + ' · ' + A.calls[m.call],
      'Binding: ' + m.binding.map(r => r.g.name + ', ' + r.label).join('; '),
      'Authority: ' + m.authority, '', 'GATES'];
    results.forEach((r, i) => L.push((i + 1) + '. ' + A.gates[i].name.padEnd(7) + (r ? r.call.padEnd(10) + r.label : 'open')));
    L.push('', 'NEXT ACTIONS'); m.actions.forEach((x, i) => L.push((i + 1) + '. ' + x.who + ': ' + x.text));
    L.push('', 'QUESTIONS FOR THE MEETING'); m.asks.forEach(x => L.push('- ' + x));
    L.push('', 'STOP IF'); m.kill.forEach(x => L.push('- ' + x));
    L.push('', 'First value review: ' + m.review, '', 'A judgment aid, not a validated scoring model. It makes the reasoning explicit; evidence, authority and a named owner still decide.');
    return L.join('\n');
  }

  function renderRun(keepFocus) {
    const results = A.gates.map(result);
    const active = keepFocus ? document.activeElement : null;
    const activeName = active && active.name, activeVal = active && active.value;
    renderPresets(); renderStrip(results); renderGate(results[state.gate]); renderMemo(results);
    if (activeName) { const n = document.querySelector('input[name="' + activeName + '"][value="' + activeVal + '"]'); if (n) n.focus(); }
  }

  $('next-gate').onclick = () => { state.gate = (state.gate + 1) % 6; renderRun(); $('run-panel').scrollIntoView({ block: 'start' }); };
  $('memo-download').onclick = () => download('decision-memo.txt', memoText());
  $('memo-copy').onclick = () => copy(memoText(), $('memo-status'));

  /* ------------------------------------------------------- combinations */
  A.combos.forEach((c, i) => option($('combo'), i, c.q + '  (' + c.x + ' × ' + c.y + ')'));
  function renderCombo() {
    const c = A.combos[+$('combo').value], x = +$('cx').value, y = +$('cy').value, bx = x >= 50 ? 1 : 0, by = y >= 50 ? 1 : 0;
    $('cx-label').textContent = c.x; $('cy-label').textContent = c.y; $('cx-val').textContent = x; $('cy-val').textContent = y;
    $('combo-axis-x').textContent = c.x + ' → higher'; $('combo-axis-y').textContent = c.y + ' → higher';
    const plot = $('combo-plot'); plot.replaceChildren();
    for (let row = 1; row >= 0; row--) for (let col = 0; col < 2; col++) {
      const qd = c.quads[row * 2 + col], cell = el('button', 'cell'); cell.type = 'button';
      cell.append(chip(qd[0], true), el('span', 'cell-label', qd[1]));
      cell.setAttribute('aria-label', qd[1] + ': ' + (col ? 'high ' : 'low ') + c.x + ', ' + (row ? 'high ' : 'low ') + c.y);
      if (row === by && col === bx) cell.classList.add('active');
      cell.onclick = () => { $('cx').value = col ? 75 : 25; $('cy').value = row ? 75 : 25; renderCombo(); };
      plot.append(cell);
    }
    const mk = el('span', 'marker'); mk.style.left = x + '%'; mk.style.bottom = y + '%'; mk.setAttribute('aria-hidden', 'true'); plot.append(mk);
    const qd = c.quads[by * 2 + bx], vd = $('combo-verdict'); vd.replaceChildren();
    const h = el('h3'); h.append(chip(qd[0]), el('span', null, ' ' + qd[1])); vd.append(h, el('p', 'move', qd[2]));
    const tx = termMap.get(c.x), ty = termMap.get(c.y);
    const ask = el('ul', 'asks');
    [tx, ty].forEach(t => { const li = el('li'); li.append(el('b', null, t.name + ': '), document.createTextNode(t.ask)); ask.append(li); });
    vd.append(el('p', 'kicker', 'To place it honestly, ask'), ask);
    $('combo-measure').textContent = tx.name + ': ' + tx.measure + ' ' + ty.name + ': ' + ty.measure;
  }
  ['combo', 'cx', 'cy'].forEach(id => $(id).addEventListener('input', renderCombo));

  /* ---------------------------------------------------------- vocabulary */
  [...new Set(A.terms.map(t => t.family))].sort().forEach(f => option($('family'), f, f));
  function renderTerms() {
    const q = $('search').value.toLowerCase().trim(), fam = $('family').value;
    const hits = A.terms.filter(t => (!fam || t.family === fam) && [t.name, t.definition, t.measure, t.ask].join(' ').toLowerCase().includes(q));
    $('term-count').textContent = hits.length + ' of ' + A.terms.length + ' terms';
    const box = $('terms'); box.replaceChildren();
    hits.forEach(t => {
      const a = el('article', 'term');
      a.append(el('div', 'kicker', t.family), el('h3', null, t.name), el('p', 'term-ask', t.ask), el('p', null, t.definition), el('p', 'small', 'Measure: ' + t.measure));
      box.append(a);
    });
    if (!hits.length) box.append(el('p', null, 'No matching terms. Try another word, or clear the family filter.'));
  }
  $('search').addEventListener('input', renderTerms); $('family').addEventListener('change', renderTerms);

  /* -------------------------------------------------------------- lenses */
  A.lenses.forEach(([name, desc, gate, link]) => {
    const a = el('article', 'term lens'), gi = A.gates.findIndex(g => g.id === gate);
    a.append(el('h3', null, name), el('p', null, desc));
    const row = el('p', 'lens-row');
    const b = el('button', 'linkish', 'Used at gate ' + (gi + 1) + ': ' + A.gates[gi].name + ' →'); b.type = 'button';
    b.onclick = () => { state.gate = gi; renderRun(); $('run-panel').scrollIntoView({ block: 'start' }); };
    row.append(b);
    if (link) { const l = el('a', null, 'Open the console'); l.href = link; row.append(document.createTextNode(' · '), l); }
    a.append(row); $('lens-list').append(a);
  });

  /* --------------------------------------------------------- nine answers */
  const nine = [
    ['Business problem', 'What friction or loss needs to change? Put a number on it.', [/\d/, 'Quantify it: cases, hours or ₹ lost per month.']],
    ['Decision', 'What choice will be made differently, and between which options?', [/\b(or|whether|approve|decline|route|choose|select|priorit|offer|send|hold|release)/i, 'Name the choice and its options.']],
    ['User', 'Who makes, receives or acts on the decision? Who owns the outcome?', [/\b(owner|owns|manager|head|team|officer|analyst|lead)\b/i, 'Name the accountable owner by role.']],
    ['Data', 'What evidence is required, and is it decision-grade?', [/(source|reconcil|quality|missing|fresh|record|feed)/i, 'Say where it comes from and how good it is.']],
    ['Intelligence', 'Rules, analytics, model, agent, or no AI at all?', [/(rule|baseline|heuristic|compare|no ai|simple)/i, 'Name the simple baseline the AI must beat.']],
    ['Action', 'What happens in the real workflow, through which channel?', [/(workflow|channel|queue|system|send|call|trigger|route|prepare)/i, 'Say where the action lands and what triggers it.']],
    ['Control', 'Who owns it, what is permitted, and when do we stop?', [/(stop|halt|escalat|override|limit|never|pause)/i, 'Add a stop rule or a hard limit.']],
    ['KPI', 'Baseline, comparison, success and stop criteria.', [/(?=.*\d)(?=.*(baseline|control|holdout|versus|vs|against|current))/i, 'Give a number and what it is compared against.']],
    ['₹', 'Incremental value after costs, error losses and displacement.', [/(?=.*\d)(?=.*(cost|net|loss|−|-))/i, 'Show the arithmetic, net of cost and error loss.']],
  ];
  nine.forEach(([title, hint], i) => {
    const wrap = el('div', 'nine-field'), label = el('label', null, String(i + 1).padStart(2, '0') + ' / ' + title); label.htmlFor = 'answer-' + i;
    const area = el('textarea'); area.id = 'answer-' + i; area.placeholder = hint; area.maxLength = 5000;
    area.addEventListener('input', briefStatus);
    wrap.append(label, area, el('p', 'check', '')); $('nine-fields').append(wrap);
  });
  function briefStatus() {
    let filled = 0, sharp = 0;
    nine.forEach(([, , [re, tip]], i) => {
      const v = $('answer-' + i).value.trim(), out = $('nine-fields').children[i].querySelector('.check');
      out.className = 'check';
      if (!v) { out.textContent = ''; return; }
      filled++;
      if (re.test(v)) { sharp++; out.textContent = 'Sharp'; out.classList.add('ok'); } else { out.textContent = 'Sharpen: ' + tip; out.classList.add('warn'); }
    });
    $('brief-status').textContent = filled + ' of 9 answered · ' + sharp + ' of 9 sharp' + (sharp === 9 ? '. Ready to take into the room.' : '.');
  }
  const sample = [
    'A fictional distributor spends about 1,200 staff-hours a month matching routine invoices by hand.',
    'Route each invoice to automatic matching or to a human reviewer.',
    'Accounts payable team acts on it; the finance manager owns the outcome.',
    'Synthetic invoice, purchase-order and receipt records from the ERP source, with known missing-field cases; quality checked weekly.',
    'Start with deterministic matching rules as the baseline; test whether a model adds incremental value.',
    'Prepare a match recommendation in the AP queue. Payment remains a separately approved action.',
    'Named finance owner; never release payment; escalate discrepancies over ₹50,000; keep an audit trail; pause on any unauthorised action.',
    'Review minutes per invoice versus the current baseline of 6 minutes; incorrect matches below 0.5% against a holdout; stop the pilot on any unauthorised action.',
    'Illustrative only: 1,000 cases × ₹20 realised benefit − ₹5,000 review and run cost − ₹2,000 error loss = ₹13,000 net per month.',
  ];
  $('example-brief').onclick = () => { sample.forEach((v, i) => { $('answer-' + i).value = v; }); briefStatus(); };
  $('clear-brief').onclick = () => { nine.forEach((_, i) => { $('answer-' + i).value = ''; }); briefStatus(); };
  $('download-brief').onclick = () => download('nine-answers.txt', 'THE NINE ANSWERS · ReadSigil Decision Atlas\nA working brief, not an approval\n\n' +
    nine.map(([name], i) => (i + 1) + '. ' + name + '\n' + ($('answer-' + i).value.trim() || '[Not answered]')).join('\n\n'));

  loadPreset(state.preset); renderCombo(); renderTerms(); briefStatus();
})();
