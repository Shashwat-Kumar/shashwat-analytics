'use strict';
/* Small helpers shared by the ReadSigil Arcade games. */
window.Play = (function () {
  function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function shuffle(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  function best(key, score) {
    try { const k = 'readsigil-best-' + key, prev = +localStorage.getItem(k) || 0; if (score > prev) localStorage.setItem(k, String(score)); return Math.max(prev, score); }
    catch (e) { return score; }
  }
  function shareBox(text, url) {
    const box = el('div', 'share');
    box.append(el('p', null, text + ' ' + url));
    const row = el('div', 'row'), btn = el('button', 'btn', 'Copy and challenge a friend'), st = el('span', 'status');
    btn.type = 'button';
    btn.onclick = async () => {
      try { await navigator.clipboard.writeText(text + ' ' + url); st.textContent = 'Copied. Paste it anywhere.'; }
      catch (e) { st.textContent = 'Copy is blocked here. Select the text above instead.'; }
    };
    const li = el('a', 'btn ghost', 'Share on LinkedIn');
    li.href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url); li.target = '_blank'; li.rel = 'noopener';
    li.style.textDecoration = 'none';
    row.append(btn, li, st); box.append(row);
    return box;
  }
  function moreGames(current) {
    const games = [['counsellor', 'If AI Were Your Counsellor'], ['human-or-ai', 'Human or AI?'], ['scam-or-not', 'Scam or Not?']];
    const box = el('div', 'more-games'); box.append(el('span', null, 'Play next:'));
    games.filter(g => g[0] !== current).forEach(([slug, name]) => { const a = el('a', null, name + ' →'); a.href = '../' + slug + '/'; box.append(a); });
    const all = el('a', null, 'All games'); all.href = '../'; box.append(all);
    return box;
  }
  return { el, shuffle, best, shareBox, moreGames };
})();
