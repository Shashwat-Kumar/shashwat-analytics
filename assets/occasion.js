/* ReadSigil occasion band.
   Reads data/occasions.json, picks the occasions active today in India Standard Time,
   and shows one restrained line under the header. Entries expire on their end date.
   Preview: ?occasion=<id> or ?date=YYYY-MM-DD. Dismissal is remembered per occasion. */
(function () {
  'use strict';
  var d = document;
  if (!window.fetch) return;

  function todayIST() {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    } catch (e) {
      var t = new Date(Date.now() + 330 * 60000);
      return t.toISOString().slice(0, 10);
    }
  }
  function param(k) {
    try { return new URLSearchParams(location.search).get(k); } catch (e) { return null; }
  }
  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; }
  }
  function el(tag, cls, text) {
    var n = d.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function render(active, preview) {
    var key = 'rs-occ-dismissed:' + active.map(function (o) { return o.id; }).join('+');
    if (!preview && store(key) === '1') return;

    var band = el('aside', 'occ');
    band.setAttribute('aria-label', 'Today');
    band.dataset.tone = active[0].tone || 'teal';
    var inner = el('div', 'wrap occ-in');
    var text = el('p', 'occ-t');
    active.forEach(function (o, i) {
      if (i) text.appendChild(el('span', 'occ-sep', ' · '));
      text.appendChild(el('strong', null, o.name));
      if (i === 0 && o.line) text.appendChild(el('span', 'occ-l', ' ' + o.line));
    });
    var x = el('button', 'occ-x', '×');
    x.type = 'button';
    x.setAttribute('aria-label', 'Dismiss greeting');
    x.onclick = function () {
      store(key, '1');
      band.remove();
      d.documentElement.removeAttribute('data-occasion');
    };
    inner.appendChild(text);
    inner.appendChild(x);
    band.appendChild(inner);

    var header = d.querySelector('header.top');
    if (header && header.parentNode) header.parentNode.insertBefore(band, header.nextSibling);
    else d.body.insertBefore(band, d.body.firstChild);
    d.documentElement.setAttribute('data-occasion', band.dataset.tone);
  }

  function start() {
    var forceId = param('occasion');
    var day = (param('date') || '').match(/^\d{4}-\d{2}-\d{2}$/) ? param('date') : todayIST();
    fetch('data/occasions.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) {
        var list = Array.isArray(j.occasions) ? j.occasions : [];
        var active = list.filter(function (o) {
          return forceId ? o.id === forceId : (o.start <= day && day <= o.end);
        });
        if (active.length) render(active, !!(forceId || param('date')));
      })
      .catch(function () { /* no band is the safe failure */ });
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start);
  else start();
})();
