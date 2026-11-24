/* Read the actual published bulletin timestamp; do not substitute today's date. */
(() => {
  const target = document.getElementById('rs-live-date');
  if (!target) return;
  const section = document.querySelector('[aria-label="New on ReadSigil"] h2');
  if (section && section.firstChild && section.firstChild.nodeType === 3) {
    section.firstChild.textContent = 'New full articles and debates · ';
  }
  fetch('magazine.html', { cache: 'no-cache', credentials: 'same-origin' })
    .then(response => {
      if (!response.ok) throw new Error('Bulletin unavailable');
      return response.text();
    })
    .then(html => {
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      const stamp = parsed.querySelector('#tw-h span');
      const value = stamp && stamp.textContent.trim().replace(/^·\s*/, '');
      if (!value || !/^updated\s+\d{1,2}\s+[A-Za-z]+\s+\d{4}/i.test(value)) throw new Error('Publication date missing');
      target.textContent = value.charAt(0).toUpperCase() + value.slice(1);
    })
    .catch(() => { target.textContent = 'Latest bulletin timestamp unavailable — open The Signal to check'; });
})();
