// Copy buttons for command blocks. Falls back to selecting the text if the clipboard is refused.
document.querySelectorAll('[data-copy]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const pre = document.getElementById(btn.dataset.copy);
    try {
      await navigator.clipboard.writeText(pre.textContent);
      btn.textContent = 'Copied';
    } catch (e) {
      const r = document.createRange(); r.selectNodeContents(pre);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      btn.textContent = 'Selected';
    }
    setTimeout(() => (btn.textContent = 'Copy'), 2000);
  });
});
