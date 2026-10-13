(function(){
var d=document,root=d.documentElement,RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
// theme
var saved=localStorage.getItem('theme');if(saved)root.dataset.theme=saved;
d.addEventListener('DOMContentLoaded',function(){
 var nav=d.querySelector('header nav');
 if(nav){var b=d.createElement('button');b.className='theme';b.type='button';b.setAttribute('aria-label','Toggle dark mode');
  var dark=function(){return root.dataset.theme?root.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches};
  var lab=function(){b.textContent=dark()?'☀':'☾';b.setAttribute('aria-pressed',dark())};lab();
  b.onclick=function(){root.dataset.theme=dark()?'light':'dark';localStorage.setItem('theme',root.dataset.theme);lab();d.dispatchEvent(new Event('themechange'))};nav.appendChild(b);}
 // essay: read time + progress
 var es=d.querySelector('article.essay');
 if(es){var w=es.innerText.split(/\s+/).length,m=Math.max(1,Math.round(w/220));
  var k=es.querySelector('.kicker');if(k){var s=d.createElement('span');s.className='rt';s.textContent=' · '+m+' min read';k.appendChild(s)}
  var p=d.createElement('div');p.className='progress';p.setAttribute('aria-hidden','true');d.body.appendChild(p);
  var up=function(){var r=es.getBoundingClientRect(),t=Math.min(1,Math.max(0,-r.top/(r.height-innerHeight)));p.style.transform='scaleX('+t+')'};
  addEventListener('scroll',up,{passive:true});up();}
 // reveals
 var els=d.querySelectorAll('.list .item,.block,.plate,.pull,.explainer,.node-card');
 if(!RM&&'IntersectionObserver' in window){els.forEach(function(e){e.classList.add('rv')});
  var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{rootMargin:'0px 0px -8% 0px'});
  els.forEach(function(e){io.observe(e)});}
 // hero field
 var c=d.getElementById('field');if(c)field(c);
 d.querySelectorAll('[data-explainer]').forEach(function(e){var f=X[e.dataset.explainer];if(f)f(e)});
});
function css(v){return getComputedStyle(root).getPropertyValue(v).trim()}
function field(c){var x=c.getContext('2d'),W,H,DPR=Math.min(2,devicePixelRatio||1),pts=[],t=0;
 function size(){W=c.clientWidth;H=c.clientHeight;c.width=W*DPR;c.height=H*DPR;x.setTransform(DPR,0,0,DPR,0,0);
  pts=[];for(var i=0;i<Math.round(W*H/2600);i++)pts.push({x:Math.random()*W,y:Math.random()*H,a:Math.random()*6.28})}
 var mx=-1e4,my=-1e4;c.parentNode.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top});c.parentNode.addEventListener('pointerleave',function(){mx=my=-1e4});
 function n(px,py,tt){var a=Math.sin(px*.004+tt)*Math.cos(py*.005-tt*.7)*3.14+Math.sin((px+py)*.002+tt*.3),dx=px-mx,dy=py-my,q=dx*dx+dy*dy;if(q<32000){a=Math.atan2(dy,dx)+1.9}return a}
 function draw(){x.fillStyle=css('--bg');x.globalAlpha=.08;x.fillRect(0,0,W,H);x.globalAlpha=1;x.strokeStyle=css('--accent');x.lineWidth=.7;
  for(var i=0;i<pts.length;i++){var p=pts[i],a=n(p.x,p.y,t),nx=p.x+Math.cos(a)*1.2,ny=p.y+Math.sin(a)*1.2;
   var nr=(p.x-mx)*(p.x-mx)+(p.y-my)*(p.y-my)<32000;x.strokeStyle=nr?css('--accent2'):css('--accent');x.globalAlpha=nr?.9:.55;x.beginPath();x.moveTo(p.x,p.y);x.lineTo(nx,ny);x.stroke();p.x=nx;p.y=ny;
   if(p.x<0||p.x>W||p.y<0||p.y>H||Math.random()<.004){p.x=Math.random()*W;p.y=Math.random()*H}}
  x.globalAlpha=1;t+=.0025}
 size();addEventListener('resize',size);d.addEventListener('themechange',function(){x.clearRect(0,0,W,H)});
 if(RM){for(var k=0;k<260;k++)draw();return}
 var vis=true;new IntersectionObserver(function(e){vis=e[0].isIntersecting}).observe(c);
 (function loop(){if(vis&&!d.hidden)draw();requestAnimationFrame(loop)})();}
var NS='http://www.w3.org/2000/svg';
function svg(w,h){var s=d.createElementNS(NS,'svg');s.setAttribute('viewBox','0 0 '+w+' '+h);s.setAttribute('role','img');return s}
function el(t,a,p){var e=d.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
function path(pts,sx,sy){return pts.map(function(p,i){return(i?'L':'M')+sx(p[0]).toFixed(1)+' '+sy(p[1]).toFixed(1)}).join('')}
var X={
 goodhart:function(e){var W=640,H=300,L=40,R=20,T=20,B=40,s=svg(W,H),inp=e.querySelector('input'),out=e.querySelector('output'),cm=e.querySelector('[name=cm]');
  s.setAttribute('aria-label','Toy chart: reported score versus real value as optimisation pressure rises');e.querySelector('.chart').appendChild(s);
  var sx=function(v){return L+v*(W-L-R)},sy=function(v){return H-B-v*(H-T-B)};
  el('line',{x1:L,y1:H-B,x2:W-R,y2:H-B,class:'ax'},s);el('line',{x1:L,y1:T,x2:L,y2:H-B,class:'ax'},s);
  var tx=function(t,a){var q=el('text',a,s);q.textContent=t};tx('optimisation pressure →',{x:W-R,y:H-10,'text-anchor':'end',class:'lbl'});
  var ps=el('path',{class:'l1'},s),pv=el('path',{class:'l2'},s),dot=el('line',{class:'cur',y1:T,y2:H-B},s);
  var ls=el('text',{class:'lbl a'},s),lv=el('text',{class:'lbl b'},s);
  function f(){var k=+inp.value/100,c=cm.checked,S=[],V=[];
   for(var i=0;i<=50;i++){var p=i/50,g=c?.15:1;S.push([p,Math.min(1,.15+.8*p)]);V.push([p,Math.max(0,.15+.9*p-g*1.25*p*p)])}
   ps.setAttribute('d',path(S,sx,sy));pv.setAttribute('d',path(V,sx,sy));dot.setAttribute('x1',sx(k));dot.setAttribute('x2',sx(k));
   ls.setAttribute('x',sx(1)-4);ls.setAttribute('y',sy(S[50][1])-8);ls.setAttribute('text-anchor','end');ls.textContent='reported score';
   lv.setAttribute('x',sx(1)-4);lv.setAttribute('y',sy(V[50][1])+(c?-8:16));lv.setAttribute('text-anchor','end');lv.textContent='real value';
   var si=Math.round(k*50);out.textContent='Score '+Math.round(S[si][1]*100)+' · real value '+Math.round(V[si][1]*100)+(c?' (counter-metrics on)':'')}
  inp.oninput=f;cm.onchange=f;f()},
 attention:function(e){var W=640,H=280,L=40,R=20,T=20,B=40,s=svg(W,H),inp=e.querySelector('input'),out=e.querySelector('output');
  s.setAttribute('aria-label','Toy chart: a fast-decaying attention curve against a slowly compounding value curve');e.querySelector('.chart').appendChild(s);
  var sx=function(v){return L+v/10*(W-L-R)},sy=function(v){return H-B-v*(H-T-B)};
  el('line',{x1:L,y1:H-B,x2:W-R,y2:H-B,class:'ax'},s);var q=el('text',{x:W-R,y:H-10,'text-anchor':'end',class:'lbl'},s);q.textContent='time →';
  var pa=el('path',{class:'l1'},s),pv=el('path',{class:'l2'},s),la=el('text',{class:'lbl a',x:sx(.4),y:T+12},s),lv=el('text',{class:'lbl b','text-anchor':'end'},s);la.textContent='attention';lv.textContent='compounding value';
  function f(){var h=+inp.value/10,A=[],V=[];for(var i=0;i<=100;i++){var t=i/10;A.push([t,Math.pow(.5,t/h)]);V.push([t,Math.min(1,.05*Math.pow(1.32,t))])}
   pa.setAttribute('d',path(A,sx,sy));pv.setAttribute('d',path(V,sx,sy));lv.setAttribute('x',sx(10)-4);lv.setAttribute('y',sy(V[100][1])-8);
   var cross=A.findIndex(function(a,i){return V[i][1]>a[1]});out.textContent='Attention half-life '+h.toFixed(1)+' units · lasting value overtakes it at t≈'+(cross/10).toFixed(1)}
  inp.oninput=f;f()},
 lift:function(e){var D=JSON.parse(e.querySelector('script').textContent),inp=e.querySelector('input'),out=e.querySelector('output'),W=640,H=280,L=40,R=20,T=20,B=40,s=svg(W,H);
  s.setAttribute('aria-label','Cumulative churners captured by targeting the top deciles of the synthetic churn model');e.querySelector('.chart').appendChild(s);
  var bw=(W-L-R)/10;el('line',{x1:L,y1:H-B,x2:W-R,y2:H-B,class:'ax'},s);var bars=[];
  D.forEach(function(r,i){var h=r.cum*(H-T-B);bars.push(el('rect',{x:L+i*bw+3,y:H-B-h,width:bw-6,height:h,class:'bar'},s));var t=el('text',{x:L+i*bw+bw/2,y:H-B+16,'text-anchor':'middle',class:'lbl'},s);t.textContent=(i+1)*10+'%'});
  el('line',{x1:L,y1:H-B,x2:W-R,y2:T,class:'rand'},s);
  function f(){var k=+inp.value;bars.forEach(function(b,i){b.classList.toggle('on',i<k)});var r=D[k-1];
   out.textContent='Contact the top '+k*10+'% by score → reach '+Math.round(r.cum*100)+'% of churners (random contact: '+k*10+'%). Lift in decile '+k+': '+r.lift.toFixed(1)+'×'}
  inp.oninput=f;f()}
};
})();
/* ticker */
(function(){var d=document;d.addEventListener('DOMContentLoaded',function(){var t=d.querySelector('.ticker');if(!t)return;var tr=t.querySelector('.tk-track');
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function fmt(n){return n>=10000?(n/1000).toFixed(0)+'k':n>=1000?(n/1000).toFixed(1)+'k':String(n)}
fetch(t.dataset.src,{cache:'no-cache'}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){
 if(!j.items||!j.items.length)throw 0;
 var h=j.items.map(function(i){var v='';
  if(i.kind==='repo')v='<span class="tk-v up" title="GitHub stars">▲ '+fmt(i.stars)+'</span>';
  else if(i.points)v='<span class="tk-v up" title="Hacker News points">▲ '+fmt(i.points)+'</span>';
  else v='<span class="tk-v src">'+esc(i.source)+'</span>';
  return '<li><a href="'+esc(i.url)+'" rel="noopener" target="_blank"><span class="tk-chip tk-'+esc(i.tag).toLowerCase()+'">'+esc(i.tag)+'</span><span class="tk-t">'+esc(i.title)+'</span>'+v+'</a></li>'}).join('');
 tr.innerHTML='<ul>'+h+'</ul><ul aria-hidden="true">'+h+'</ul>';tr.querySelectorAll('ul[aria-hidden] a').forEach(function(a){a.tabIndex=-1});
 var u=new Date(j.generated_at);t.querySelector('.tk-time').textContent=u.toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Kolkata'})+' IST';
 t.hidden=false;requestAnimationFrame(function(){var w=tr.querySelector('ul').getBoundingClientRect().width;tr.style.setProperty('--dur',Math.round(w/45)+'s')});
 var b=t.querySelector('.tk-pause');b.onclick=function(){var p=t.classList.toggle('paused');b.setAttribute('aria-pressed',p);b.setAttribute('aria-label',p?'Play ticker':'Pause ticker')};
}).catch(function(){t.remove()})})})();
/* mobile nav */
document.addEventListener('DOMContentLoaded',function(){var n=document.querySelector('header nav'),bar=document.querySelector('.top .bar');if(!n||!bar)return;
 var b=document.createElement('button');b.className='menu';b.type='button';b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','Menu');b.innerHTML='<span></span><span></span>';
 b.onclick=function(){var o=bar.classList.toggle('open');b.setAttribute('aria-expanded',o)};bar.insertBefore(b,n)});
/* AI flash bar: the top AI story until another overtakes it, plus fresh statements on AI from tech leaders.
   Reads the same data/ticker.json as the ticker and re-checks it every 5 minutes. */
(function(){var d=document;d.addEventListener('DOMContentLoaded',function(){
 var t=d.querySelector('.ticker');if(!t||!window.fetch||!t.dataset.src)return;
 function store(s,k,v){try{if(v===undefined)return window[s].getItem(k);window[s].setItem(k,v)}catch(e){return null}}
 if(store('sessionStorage','fl-off'))return;
 var css=d.createElement('style');css.textContent=
  '.fl{background:var(--bg,#faf9f6);border-bottom:1px solid var(--rule,#e4e2dc);font:500 .82rem/1.35 var(--sans,system-ui,sans-serif)}'+
  '.fl-in{max-width:1200px;margin:0 auto;padding:6px 16px;display:flex;align-items:center;gap:12px;min-height:40px}'+
  '.fl-link{display:flex;align-items:center;gap:10px;min-width:0;flex:1;color:var(--h,#111110);text-decoration:none}'+
  '.fl-link:hover .fl-t,.fl-link:focus-visible .fl-t{text-decoration:underline}.fl-link:focus-visible{outline:2px solid #b0401b;outline-offset:2px;border-radius:4px}'+
  '.fl-pill{flex:none;font:700 .64rem/1 var(--mono,ui-monospace,monospace);letter-spacing:.08em;text-transform:uppercase;padding:5px 7px;border-radius:4px;background:#b0401b;color:#fff}'+
  '.fl.is-voice .fl-pill{background:#2b4aa8}.fl.fl-new .fl-pill::after{content:" \\00b7  just in"}'+
  '.fl-t{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600;min-width:0}'+
  '.fl-meta{flex:none;color:#5c5c58;font:500 .72rem/1 var(--mono,ui-monospace,monospace);white-space:nowrap}'+
  '.fl-x{flex:none;border:0;background:transparent;color:var(--h,#111110);font-size:1.15rem;line-height:1;width:32px;height:32px;cursor:pointer;border-radius:6px}'+
  '.fl-x:hover{background:rgba(0,0,0,.06)}.fl-x:focus-visible{outline:2px solid #b0401b;outline-offset:1px}'+
  '.fl.fl-new{box-shadow:inset 3px 0 0 #2b4aa8}.fl.fl-anim .fl-in{animation:flin .45s ease both}'+
  '@keyframes flin{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}'+
  ':root[data-theme=dark] .fl{background:#0f1211;border-color:#2a2e2c}:root[data-theme=dark] .fl-link,:root[data-theme=dark] .fl-x{color:#f3f2ee}'+
  ':root[data-theme=dark] .fl-meta{color:#b9b8b2}:root[data-theme=dark] .fl-x:hover{background:rgba(255,255,255,.08)}'+
  'html body .tk-chip.tk-voice{color:#2b4aa8!important}html:root[data-theme=dark] body .tk-chip.tk-voice{color:#9fb7ff!important}'+
  '@media(max-width:640px){.fl-meta{display:none}.fl-in{padding:6px 12px;gap:8px}}'+
  '@media(prefers-reduced-motion:reduce){.fl.fl-anim .fl-in{animation:none}}';
 d.head.appendChild(css);
 var bar=d.createElement('div');bar.className='fl';bar.setAttribute('role','region');bar.setAttribute('aria-label','AI news flash');bar.hidden=true;
 bar.innerHTML='<div class="fl-in" aria-live="polite"><a class="fl-link" target="_blank" rel="noopener"><span class="fl-pill"></span><span class="fl-t"></span></a><span class="fl-meta"></span><button class="fl-x" type="button" aria-label="Hide the AI flash">×</button></div>';
 t.insertAdjacentElement('afterend',bar);
 var data=null,mode='flash',timer=null;
 function ago(s){var m=Math.max(0,Math.round((Date.now()-new Date(s).getTime())/60000));return m<1?'just now':m<60?m+' min ago':m<1440?Math.round(m/60)+' h ago':Math.round(m/1440)+' d ago'}
 function show(which){var x=data&&data[which];if(!x)return;mode=which;
  bar.querySelector('.fl-link').href=x.url;
  bar.querySelector('.fl-pill').textContent=which==='voice'?'Voice':'AI flash';
  bar.querySelector('.fl-t').textContent=which==='voice'&&x.title.toLowerCase().indexOf(x.person.split(' ').pop().toLowerCase())<0?x.person+': '+x.title:x.title;
  bar.querySelector('.fl-t').title=bar.querySelector('.fl-t').textContent;
  var meta=[x.source,ago(x.published)];if(which==='flash'&&x.points)meta.push('▲ '+x.points);
  bar.querySelector('.fl-meta').textContent=meta.join(' · ');
  bar.classList.toggle('is-voice',which==='voice');
  bar.classList.remove('fl-anim');void bar.offsetWidth;bar.classList.add('fl-anim')}
 function cycle(){clearInterval(timer);if(data&&data.flash&&data.voice)timer=setInterval(function(){show(mode==='flash'?'voice':'flash')},12000)}
 function apply(j){var before=data;data=j;
  if(!j.flash&&!j.voice){bar.hidden=true;return}bar.hidden=false;
  var v=j.voice,fresh=v&&store('localStorage','fl-voice')!==v.url&&(Date.now()-new Date(v.published).getTime())<6*36e5;
  if(fresh){show('voice');bar.classList.add('fl-new');store('localStorage','fl-voice',v.url);setTimeout(function(){bar.classList.remove('fl-new')},20000)}
  else if(!before||!before[mode]||!j[mode]||before[mode].url!==j[mode].url)show(j.flash?'flash':'voice');
  cycle()}
 function load(){fetch(t.dataset.src+'?v='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(j){if(j)apply(j)}).catch(function(){})}
 bar.querySelector('.fl-x').onclick=function(){store('sessionStorage','fl-off','1');clearInterval(timer);bar.remove()};
 bar.addEventListener('mouseenter',function(){clearInterval(timer)});bar.addEventListener('mouseleave',cycle);
 load();setInterval(load,3e5);
})})();
