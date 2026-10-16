(function(){var q=document.getElementById('pf-q'),cards=[].slice.call(document.querySelectorAll('.pf-card')),kind='all';
function run(){var s=(q.value||'').toLowerCase();cards.forEach(function(c){c.hidden=!((kind==='all'||c.dataset.kind===kind)&&c.textContent.toLowerCase().indexOf(s)>=0)})}
q.addEventListener('input',run);[].slice.call(document.querySelectorAll('.pf-tools button')).forEach(function(b){b.addEventListener('click',function(){kind=b.dataset.k;
document.querySelectorAll('.pf-tools button').forEach(function(x){x.setAttribute('aria-pressed',x===b)});run()})});})();
