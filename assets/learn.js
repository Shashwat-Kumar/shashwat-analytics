(function(){var d=document,K='sk-learn-v1';function load(){try{return JSON.parse(localStorage.getItem(K))||{}}catch(e){return{}}}function save(s){try{localStorage.setItem(K,JSON.stringify(s))}catch(e){}}
d.addEventListener('DOMContentLoaded',function(){var st=load();st.done=st.done||{};
 var today=new Date().toISOString().slice(0,10),y=new Date(Date.now()-864e5).toISOString().slice(0,10);
 if(st.last!==today){st.streak=st.last===y?(st.streak||0)+1:1;st.last=today;save(st)}
 var cards=[].slice.call(d.querySelectorAll('.lesson'));
 function hud(){var n=cards.filter(function(c){return st.done[c.id]}).length,h=d.querySelector('.learn-hud');if(!h)return;h.querySelector('.n').textContent=n+' / '+cards.length;h.querySelector('.lbar i').style.width=(n/cards.length*100)+'%';h.querySelector('.st').textContent=st.streak+'-day streak'}
 cards.forEach(function(c){var qs=[].slice.call(c.querySelectorAll('.quiz'));if(st.done[c.id])c.classList.add('done');
  qs.forEach(function(q){q.querySelectorAll('button').forEach(function(b){b.onclick=function(){var ok=b.hasAttribute('data-ok');q.querySelectorAll('button').forEach(function(x){x.disabled=true;if(x.hasAttribute('data-ok'))x.classList.add('right')});if(!ok)b.classList.add('wrong');q.classList.add(ok?'ok':'no');q.querySelector('.fb').hidden=false;
   if(qs.every(function(z){return z.classList.contains('ok')||z.classList.contains('no')})){st.done[c.id]=1;save(st);c.classList.add('done');hud()}}})})});
 var rs=d.querySelector('.learn-reset');if(rs)rs.onclick=function(){st.done={};save(st);location.reload()};hud()})})();
