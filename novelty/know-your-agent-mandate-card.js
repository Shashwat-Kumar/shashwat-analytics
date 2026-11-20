// Know-Your-Agent Mandate Card: builds a one-page mandate card in the
// reader's browser from the form on novelty.html. Nothing is sent or stored.
// The tool switches itself off after the item's expiry time.
(function () {
  var root = document.getElementById('kya-tool');
  if (!root) return;
  var item = root.closest('[data-until]');
  var until = item ? Date.parse(item.getAttribute('data-until')) : NaN;
  if (!isNaN(until) && Date.now() > until) return; // novelty.js handles expiry display

  function v(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function checked(name) {
    return Array.prototype.slice.call(root.querySelectorAll('input[name="' + name + '"]:checked'))
      .map(function (el) { return el.value; });
  }

  var out = document.getElementById('kya-out');
  var flags = document.getElementById('kya-flags');
  var actions = document.getElementById('kya-actions');
  var dl = document.getElementById('kya-download');
  var cp = document.getElementById('kya-copy');
  var current = '';

  function build() {
    var agent = v('kya-agent') || '(not stated)';
    var who = v('kya-for') || '(not stated)';
    var level = v('kya-level');
    var acts = checked('kya-act');
    var per = v('kya-per');
    var cap = v('kya-cap');
    var cond = v('kya-cond');
    var conn = v('kya-conn');
    var stop = v('kya-stop');
    var revoke = v('kya-revoke');
    var review = v('kya-review');

    var problems = [];
    if (conn === 'password') problems.push('It connects with your own login. That gives the agent everything you can do, with no mandate. MAS\u2019s managing director said on 19 November 2026 he would not advise it. Stop here, or find an official channel.');
    if (conn === 'unknown') problems.push('You don\u2019t know how it connects. Find out before giving it anything.');
    if (v('kya-agent') === '') problems.push('You haven\u2019t said who the agent is or who built it.');
    if (level !== 'look' && !per) problems.push('No per-payment limit. Put a number in, not \u201creasonable\u201d.');
    if (level !== 'look' && !cap) problems.push('No monthly cap.');
    if (acts.indexOf('new-payee') !== -1) problems.push('It can add or change payees without you. That is the step most scams aim for; switch it off.');
    if (level === 'pay' && acts.indexOf('approve') === -1) problems.push('It can pay without asking you each time. Consider \u201cask me before every payment\u201d at least for the first month.');
    if (!stop) problems.push('No stop rules: say when it must stop and ask you.');
    if (!revoke) problems.push('You haven\u2019t written down how to switch it off. Find out, and test it once.');
    if (!review) problems.push('No review date.');

    var levelText = { look: 'Look only (read bills and balances)', prepare: 'Prepare (draft payments for me to approve)', pay: 'Pay within limits (listed billers, up to the caps below)' }[level] || level;
    var connText = { official: 'Official agent channel or revocable connected-app permission (tokens, not my password)', bankapp: 'Assistant built into my bank\u2019s or wallet\u2019s own app', password: 'My own login / password  \u2014  NOT ACCEPTABLE', unknown: 'Not known yet' }[conn] || conn;
    var actLabels = { bills: 'Read my bills', listed: 'Pay only billers on my list', approve: 'Ask me before every payment', match: 'Amount must match the bill exactly', 'new-payee': 'Add or change payees on its own' };

    var lines = [
      '# My agent mandate card',
      '',
      '_Made with the Know-Your-Agent Mandate Card from The Signal (readsigil.com). Not advice; your bank\u2019s terms come first._',
      '',
      '1. **Who the agent is:** ' + agent,
      '2. **Whom it represents:** ' + who,
      '3. **Authority:** ' + levelText,
      '4. **Mandate:**',
      '   - Permitted: ' + (acts.length ? acts.map(function (a) { return actLabels[a] || a; }).join('; ') : '(none ticked)'),
      '   - Per-payment limit: ' + (level === 'look' ? 'n/a (look only)' : (per || '(none set)')),
      '   - Monthly cap: ' + (level === 'look' ? 'n/a (look only)' : (cap || '(none set)')),
      '   - Other conditions: ' + (cond || '(none)'),
      '5. **How it connects:** ' + connText,
      '6. **Stop and ask me when:** ' + (stop || '(not set)'),
      '7. **How I switch it off:** ' + (revoke || '(not set)'),
      '8. **Review date:** ' + (review || '(not set)'),
      '',
      problems.length ? '## Gaps to fix before signing\n\n' + problems.map(function (p) { return '- ' + p; }).join('\n') : '## Gaps\n\nNone flagged by the checklist. Still read it once more before you sign.',
      ''
    ];
    current = lines.join('\n');
    out.textContent = current;
    flags.textContent = problems.length
      ? problems.length + (problems.length === 1 ? ' gap' : ' gaps') + ' flagged in your card (listed at the end).'
      : 'No gaps flagged by the checklist.';
    out.hidden = false;
    actions.hidden = false;
  }

  root.addEventListener('submit', function (e) { e.preventDefault(); build(); });
  document.getElementById('kya-build').addEventListener('click', build);
  cp.addEventListener('click', function () {
    if (!current) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(current).then(function () { cp.textContent = 'Copied'; setTimeout(function () { cp.textContent = 'Copy the card'; }, 1500); });
    }
  });
  dl.addEventListener('click', function () {
    if (!current) return;
    var url = URL.createObjectURL(new Blob([current], { type: 'text/markdown' }));
    var a = document.createElement('a');
    a.href = url; a.download = 'my-agent-mandate-card.md';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });
  root.hidden = false;
  var nojs = document.getElementById('kya-nojs');
  if (nojs) nojs.hidden = true;
})();
