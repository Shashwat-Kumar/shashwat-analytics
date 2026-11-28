/* Discover real public debates; never fabricate a discussion or its status. */
(() => {
  const list = document.getElementById('open-debate-list');
  const status = document.getElementById('open-debate-status');
  if (!list || !status) return;
  const endpoint = 'https://api.github.com/repos/Shashwat-Kumar/agora/issues?state=open&labels=open-debate&sort=created&direction=desc&per_page=30';
  fetch(endpoint, {headers: {Accept: 'application/vnd.github+json'}})
    .then(response => {
      if (!response.ok) throw new Error('GitHub unavailable');
      return response.json();
    })
    .then(items => {
      if (!Array.isArray(items)) throw new Error('Unexpected response');
      const debates = items.filter(i => !i.pull_request && Number.isSafeInteger(i.number) && i.number > 0 && typeof i.title === 'string');
      const nodes = debates.map(i => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = 'https://github.com/Shashwat-Kumar/agora/issues/' + i.number;
        a.textContent = i.title.replace(/^Open debate:\s*/i, '');
        li.append(a);
        const date = new Date(i.created_at);
        if (Number.isFinite(date.getTime())) {
          li.append(document.createTextNode(' · ' + new Intl.DateTimeFormat('en-IN', {dateStyle:'medium',timeZone:'Asia/Kolkata'}).format(date)));
        }
        return li;
      });
      list.replaceChildren(...nodes);
      if (!nodes.length) {
        const li = document.createElement('li');
        li.textContent = 'No open debates currently listed.';
        list.append(li);
      }
      status.textContent = 'Latest open debates from GitHub (up to 30).';
    })
    .catch(() => {status.textContent = 'Live list unavailable; selected openings above may not reflect current status. Use the GitHub link for the current list.';});
})();
