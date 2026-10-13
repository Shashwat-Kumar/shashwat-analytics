/* Scrollytelling case studies on synthetic data (fictional companies). */
(function(){var d=document,NS='http://www.w3.org/2000/svg';function el(t,a,p){var e=d.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
function txt(s,x,y,t,c,anc){var e=el('text',{x:x,y:y,class:'lbl '+(c||''),'text-anchor':anc||'start'},s);e.textContent=t;return e}
var R={};
R.kpi=function(s,D,st){s.innerHTML='';var k=D.kpi,W=600,H=320,L=50,B=40,mx=Math.max.apply(0,k.map(function(r){return r.rev}));var bw=(W-L-20)/k.length;
 el('line',{x1:L,y1:H-B,x2:W-10,y2:H-B,class:'ax'},s);
 k.forEach(function(r,i){var h=(r.rev/mx)*(H-B-40)*(st>=1?1:.35);el('rect',{x:L+i*bw+4,y:H-B-h,width:bw-8,height:h,class:'bar'+(st>=1?' on':''),style:'transition-delay:'+(i*40)+'ms'},s);if(i%2==0)txt(s,L+i*bw+bw/2,H-B+16,r.m.slice(2),'',"middle")});
 if(st>=2){var p=k.map(function(r,i){return(i?'L':'M')+(L+i*bw+bw/2)+' '+(H-B-(r.rep/70)*(H-B-40))}).join('');el('path',{d:p,class:'l1 draw'},s);txt(s,W-12,40,'repeat rate % (right scale)','a','end')}
 if(st>=3){var a=k[0],z=k[k.length-1];txt(s,L,24,'CAC ₹'+a.cac+' → ₹'+z.cac+' while revenue grew. Same page, same definitions.','b')}
 txt(s,L,H-4,'Revenue, ₹ lakh, synthetic',"",'start')};
R.churn=function(s,D,st){s.innerHTML='';var W=600,H=320,L=40,B=40;
 if(st<=1){var a=D.auc;[['Logistic baseline',a[0]],['Gradient boosting',a[1]]].forEach(function(r,i){var w=(r[1]-.5)/.5*(W-220)*(st>=1?1:.0001);el('rect',{x:180,y:80+i*70,width:w,height:36,class:'bar on'},s);txt(s,170,103+i*70,r[0],'','end');txt(s,186+w,103+i*70,'AUC '+r[1].toFixed(3),'b')});txt(s,180,60,st>=1?'A gain of under one point of AUC':'Two models, one honest comparison','a')}
 else if(st==2){var dc=D.deciles,bw=(W-L-20)/10;el('line',{x1:L,y1:H-B,x2:W-10,y2:H-B,class:'ax'},s);dc.forEach(function(r,i){var h=r.lift/3.6*(H-B-50);el('rect',{x:L+i*bw+4,y:H-B-h,width:bw-8,height:h,class:'bar'+(i<3?' on':'')},s);txt(s,L+i*bw+bw/2,H-B+16,'D'+(i+1),'','middle');txt(s,L+i*bw+bw/2,H-B-h-6,r.lift.toFixed(1)+'×','','middle')});txt(s,L,30,'Lift by decile: the top 30% holds '+Math.round(dc[2].cum*100)+'% of churners','b')}
 else{var sh=D.shap,mx=sh[0].v;sh.forEach(function(r,i){var w=r.v/mx*300;el('rect',{x:250,y:20+i*35,width:w,height:22,class:'bar on '+(r.e.indexOf('raises')==0?'up':'')},s);txt(s,240,36+i*35,r.f,'','end')});txt(s,250,H-4,'Mean |SHAP|: what drives the score','a')}};
R.dpdp=function(s,D,st){s.innerHTML='';var W=600,H=320,P=D.dpdp;
 if(st==0){var cx=300,cy=190,r0=120,a=Math.PI*(1-P.overall/100);el('path',{d:'M'+(cx-r0)+' '+cy+' A'+r0+' '+r0+' 0 0 1 '+(cx+r0)+' '+cy,class:'gauge-bg'},s);el('path',{d:'M'+(cx-r0)+' '+cy+' A'+r0+' '+r0+' 0 0 1 '+(cx+r0*Math.cos(a))+' '+(cy-r0*Math.sin(a)),class:'gauge draw'},s);txt(s,cx,cy-10,P.overall+'%','big','middle');txt(s,cx,cy+20,'overall readiness (synthetic)','','middle')}
 else if(st==1){P.acts.forEach(function(r,i){var w=r.s/100*330;el('rect',{x:230,y:40+i*48,width:w,height:28,class:'bar on '+(r.s<50?'up':'')},s);txt(s,220,59+i*48,r.a,'','end');txt(s,236+w,59+i*48,r.s+'%','b')})}
 else{var g=P.gaps,cols=8;for(var i=0;i<g;i++){el('rect',{x:120+(i%cols)*46,y:60+Math.floor(i/cols)*56,width:38,height:44,rx:4,class:'cell '+(i<P.p1?'p1':'p2'),style:'transition-delay:'+(i*30)+'ms'},s)}txt(s,120,40,g+' gaps: '+P.p1+' priority-1, '+P.p2+' priority-2','b');if(st>=3)txt(s,120,H-10,'Roadmap: P1 first, then P2, then a breach drill','a')}};
d.addEventListener('DOMContentLoaded',function(){fetch(d.body.dataset.cases).then(function(r){return r.json()}).then(function(D){
 [].slice.call(d.querySelectorAll('.story')).forEach(function(sto){var s=el('svg',{viewBox:'0 0 600 320',role:'img','aria-label':sto.dataset.label});sto.querySelector('.stage').appendChild(s);var steps=[].slice.call(sto.querySelectorAll('.step')),cur=-1;
  function go(i){if(i===cur)return;cur=i;steps.forEach(function(x,j){x.classList.toggle('act',j===i)});R[sto.dataset.story](s,D,i)}
  go(0);if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)go(steps.indexOf(e.target))})},{rootMargin:'-45% 0px -45% 0px'});steps.forEach(function(x){io.observe(x)})}})})})})();
