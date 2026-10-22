// Greys out novelty items whose "available until" time has passed and
// removes their download link. Runs in the reader's browser, so expiry is
// enforced even between site updates.
(function () {
  var now = Date.now();
  document.querySelectorAll('[data-until]').forEach(function (el) {
    var until = Date.parse(el.getAttribute('data-until'));
    if (isNaN(until) || now <= until) return;
    el.classList.add('nv-expired');
    var st = el.querySelector('.nv-status');
    if (st) st.textContent = 'Expired';
    el.querySelectorAll('.nv-get').forEach(function (a) {
      var s = document.createElement('span');
      s.className = 'nv-gone';
      s.textContent = 'This item has expired and the download is no longer offered.';
      a.replaceWith(s);
    });
  });
})();
