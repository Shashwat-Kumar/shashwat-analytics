/* Physical AI Decision Lab — ReadSigil. Plain JS, no dependencies. */
(function(){
'use strict';
var $=function(id){return document.getElementById(id)};
var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function css(name,fb){var v=getComputedStyle(document.body).getPropertyValue(name).trim();return v||fb}
function fmt(n,d){return n.toLocaleString('en-IN',{maximumFractionDigits:d==null?0:d,minimumFractionDigits:d==null?0:d})}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* ================= 01 · arithmetic of nines ================= */
var PS=[90,95,97,98,99,99.5,99.7,99.9,99.95,99.99];
function nines(){
 var pi=+$('nP').value,p=PS[pi]/100,k=+$('nK').value,T=+$('nT').value,m=+$('nM').value,F=+$('nF').value;
 $('nPo').textContent=PS[pi]+'%';$('nKo').textContent=k;$('nTo').textContent=T;$('nMo').textContent=m+' min';$('nFo').textContent=F+(F===1?' robot':' robots');
 function calc(p){var job=Math.pow(p,k),fails=T*(1-job),mins=fails*m,ratio=mins>0?42/mins:Infinity,staff=F*mins/60/0.7;return{job:job,fails:fails,mins:mins,ratio:ratio,staff:staff,every:fails>0?60/fails:Infinity}}
 var r=calc(p);
 $('nJob').textContent=(r.job*100).toFixed(r.job>.999?2:1)+'%';
 $('nJobS').textContent=fmt(r.fails,1)+' failed jobs per robot-hour';
 $('nEvery').textContent=r.every===Infinity?'never':r.every<1?Math.round(r.every*60)+' sec':r.every<120?fmt(r.every,r.every<10?1:0)+' min':fmt(r.every/60,1)+' hrs';
 $('nRatio').textContent=r.ratio===Infinity?'∞':r.ratio>=200?'200+':r.ratio<1?'<1':fmt(r.ratio,r.ratio<10?1:0);
 $('nStaff').textContent=fmt(r.staff,r.staff<10?1:0);
 $('nStaffS').textContent='people on recovery duty at all times';
 $('kJob').className='kpi '+(r.job>=.99?'ok':r.job>=.9?'warn':'bad');
 $('kRatio').className='kpi '+(r.ratio>=20?'ok':r.ratio>=5?'warn':'bad');
 var perShift=r.fails*8,next=pi<PS.length-1?calc(PS[pi+1]/100):null;
 var v='At <strong>'+PS[pi]+'%</strong> per action, '+(100-r.job*100).toFixed(1)+'% of '+k+'-action jobs need a person: about <strong>'+fmt(perShift,0)+' rescues per robot per 8-hour shift</strong>. ';
 v+='Your '+F+'-robot fleet needs <strong>'+fmt(r.staff,1)+'</strong> people on recovery duty, one for every '+(r.ratio===Infinity?'∞':fmt(Math.min(r.ratio,999),1))+' robots. ';
 if(next)v+='Moving to '+PS[pi+1]+'% would cut that to '+fmt(next.staff,1)+'. Each extra nine matters more to your staffing plan than doubling robot speed.';
 else v+='This is the reliability at which recovery labour stops being the constraint.';
 $('nVerdict').innerHTML=v;
 var rows='',show=[4,5,7,9];if(show.indexOf(pi)<0){show.push(pi);show.sort(function(a,b){return a-b})}
 show.forEach(function(i){var c=calc(PS[i]/100);rows+='<tr'+(i===pi?' class="cur"':'')+'><td>'+PS[i]+'%</td><td class="n">'+(c.job*100).toFixed(c.job>.999?2:1)+'%</td><td class="n">'+fmt(c.fails,2)+'</td><td class="n">'+(c.ratio===Infinity?'∞':c.ratio>=200?'200+':fmt(c.ratio,c.ratio<10?1:0))+'</td></tr>'});
 $('nTable').innerHTML=rows;
}
['nP','nK','nT','nM','nF'].forEach(function(i){$(i).addEventListener('input',nines)});nines();

/* ================= 02 · the floor ================= */
var W=26,H=13,N=W*H,grid=new Uint8Array(N),DOCK=6*W+1;
(function(){var xs=[3,4,7,8,11,12,15,16,19,20,22,23];for(var y=0;y<H;y++)for(var x=0;x<W;x++){if(xs.indexOf(x)>=0&&((y>=1&&y<=4)||(y>=7&&y<=10)))grid[y*W+x]=1}})();
var FACES=[];for(var i=0;i<N;i++){if(grid[i])continue;var fx=i%W;if((fx>0&&grid[i-1])||(fx<W-1&&grid[i+1]))FACES.push(i)}
var FREE=[];for(i=0;i<N;i++)if(!grid[i])FREE.push(i);
var CORNER=new Uint8Array(N);for(i=0;i<N;i++){if(grid[i])continue;var ix=i%W,iy=(i/W)|0;[[1,1],[1,-1],[-1,1],[-1,-1]].forEach(function(d){var x=ix+d[0],y=iy+d[1];if(x<0||y<0||x>=W||y>=H)return;if(grid[y*W+x]&&!grid[iy*W+x]&&!grid[y*W+ix])CORNER[i]=1})}
function cx(i){return i%W}function cy(i){return(i/W)|0}
function man(a,b){return Math.abs(cx(a)-cx(b))+Math.abs(cy(a)-cy(b))}
function cheb(a,b){return Math.max(Math.abs(cx(a)-cx(b)),Math.abs(cy(a)-cy(b)))}
function nbrs(i){var x=cx(i),y=cy(i),o=[];if(x>0)o.push(i-1);if(x<W-1)o.push(i+1);if(y>0)o.push(i-W);if(y<H-1)o.push(i+W);return o}
var prev=new Int32Array(N);
function bfs(s,t,block){ // returns array of cells excluding s, or null
 if(s===t)return[];prev.fill(-1);prev[s]=s;var q=[s],h=0;
 while(h<q.length){var u=q[h++];if(u===t)break;var nb=nbrs(u);for(var j=0;j<nb.length;j++){var v=nb[j];if(prev[v]!==-1||grid[v])continue;if(block&&block[v]&&v!==t)continue;prev[v]=u;q.push(v)}}
 if(prev[t]===-1)return null;var p=[];for(var c=t;c!==s;c=prev[c])p.push(c);return p.reverse()}
function los(a,b){var x0=cx(a),y0=cy(a),x1=cx(b),y1=cy(b),dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,e=dx+dy;
 while(true){if(x0===x1&&y0===y1)return true;var e2=2*e;if(e2>=dy){e+=dy;x0+=sx}if(e2<=dx){e+=dx;y0+=sy}if(x0===x1&&y0===y1)return true;if(grid[y0*W+x0])return false}}

var POL={stop:{h:'Stops for anyone on its path, slows to walking pace near people and at blind corners, and reroutes after ten seconds of waiting.'},
 replan:{h:'Slows to walking pace within three metres of a person or a blind corner, and reroutes around people straight away.'},
 speed:{h:'Brakes only for a person on its path within stopping distance. No slowing at corners or near people. Fastest on an empty floor.'}};

function Shift(o,seed){
 this.o=o;this.rp=mulberry(seed*7919+11);this.rs=mulberry(seed*104729+3);this.rt=mulberry(seed*1299709+5);
 this.t=0;this.tasks=0;this.contacts=0;this.near=0;this.halt=0;this.stops=0;this.events=[];
 this.r={pos:DOCK,path:[],spd:0,phase:'dock',dwell:3,down:0,blocked:0,wasHalted:false};
 this.people=[];var used={};used[DOCK]=1;
 for(var k=0;k<o.n;k++){var c;do{c=FREE[(this.rp()*FREE.length)|0]}while(used[c]||cx(c)<5);used[c]=1;this.people.push({pos:c,prev:c,path:null,wait:(this.rp()*8)|0,adj:false,seen:false})}
 this.seen=[];
}
Shift.prototype.occ=function(c,skip){for(var k=0;k<this.people.length;k++){if(k!==skip&&this.people[k].pos===c)return k}return -1};
Shift.prototype.step=function(){
 var o=this.o,r=this.r,P=this.people,self=this;this.t++;r.prevPos=r.pos;
 // --- sense
 var det=[];for(var k=0;k<P.length;k++){var p=P[k];p.seen=false;var d=cheb(r.pos,p.pos);if(d<=o.R&&los(r.pos,p.pos)&&this.rs()>=o.d){p.seen=true;p.mem=[p.pos,p.pos,p.pos]}else if(p.mem){p.mem.shift();if(!p.mem.length)p.mem=null}if(p.mem)det.push(p.mem[p.mem.length-1])}
 // --- task logic
 if(r.down>0){r.down--;r.spd=0;this.halt++;this.movePeople();this.nearCheck(0);return}
 if(r.dwell>0){r.dwell--;r.spd=0;if(r.dwell===0){if(r.phase==='dock'){r.phase='pick';r.goal=FACES[(this.rt()*FACES.length)|0]}else{r.phase='dock';r.goal=DOCK}r.path=bfs(r.pos,r.goal,null)||[]}this.movePeople();this.nearCheck(0);return}
 // --- policy
 var cap=o.v,target=cap,cur=r.spd,stopDist=(cur+1)*(cur+2)/2; // cells needed to stop if it accelerates this second (decel 1 m/s²)
 function blockAt(margin,horizon){for(var j=0;j<Math.min(horizon,r.path.length);j++){for(var q=0;q<det.length;q++){if(cheb(r.path[j],det[q])<=margin)return j}}return -1}
 function nearCorner(h){for(var j=0;j<Math.min(h,r.path.length);j++)if(CORNER[r.path[j]])return true;return CORNER[r.pos]===1}
 function reroute(margin){var b=new Uint8Array(N);det.forEach(function(c){b[c]=1;if(margin)nbrs(c).forEach(function(n){b[n]=1})});var np=bfs(r.pos,r.goal,b);if(np&&np.length<=r.path.length+14){r.path=np;return true}return false}
 if(o.pol==='stop'){
  if(blockAt(1,stopDist+2)>=0||nearCorner(cur+1))cap=Math.min(cap,1);target=cap;var bl=function(){return blockAt(0,stopDist+3)>=0};if(bl()){r.blocked++;target=0;if(r.blocked>10&&reroute(0)){r.blocked=0;if(!bl())target=Math.min(cap,1)}}else r.blocked=0;
 }else if(o.pol==='replan'){
  var near=det.some(function(c){return cheb(c,r.pos)<=3});if(near||nearCorner(cur+1))cap=Math.min(cap,1);target=cap;
  if(blockAt(0,6)>=0){if(!reroute(1)){target=0;r.blocked++}else r.blocked=0;if(blockAt(0,stopDist+2)>=0||blockAt(1,1)>=0)target=0}else r.blocked=0;
 }else{
  if(blockAt(0,stopDist+1)>=0){target=0;r.blocked++;if(r.blocked>3&&reroute(0)){r.blocked=0;if(blockAt(0,stopDist+1)<0)target=cap}}else r.blocked=0;
 }
 var spd=Math.max(cur-1,Math.min(cur+1,target));spd=Math.max(0,Math.min(o.v,spd));
 // --- move
 var moved=0;
 for(var s=0;s<spd&&r.path.length;s++){var nx=r.path[0],hit=this.occ(nx,-1);
  if(hit>=0){this.contacts++;this.events.push({t:this.t,c:nx,k:'contact'});r.down=20;r.spd=0;spd=0;break}
  r.pos=r.path.shift();moved++}
 r.spd=spd;
 var halted=(moved===0&&r.path.length>0);if(halted){this.halt++;if(!r.wasHalted)this.stops++}r.wasHalted=halted;
 if(r.path.length===0&&r.down===0){if(r.phase==='pick'&&r.pos===r.goal){r.dwell=8;r.spd=0}else if(r.phase==='dock'&&r.pos===DOCK){this.tasks++;r.dwell=4;r.spd=0}else if(r.pos!==r.goal){r.path=bfs(r.pos,r.goal,null)||[]}}
 this.movePeople();this.nearCheck(moved);
};
Shift.prototype.movePeople=function(){
 var P=this.people,r=this.r,rp=this.rp;
 for(var k=0;k<P.length;k++){var p=P[k];p.prev=p.pos;
  if(p.wait>0){p.wait--;continue}
  if(!p.path||!p.path.length){if(p.path){p.wait=5+((rp()*12)|0);p.path=null;continue}var tg=FACES[(rp()*FACES.length)|0];p.path=bfs(p.pos,tg,null)||[];continue}
  if(rp()>0.85)continue;var nx=p.path[0];
  if(nx===r.pos){var b=new Uint8Array(N);b[r.pos]=1;var np=bfs(p.pos,p.path[p.path.length-1],b);if(np&&np.length)p.path=np;continue}
  if(this.occ(nx,k)>=0)continue;
  if(r.spd>0&&man(nx,r.pos)<=1&&los(p.pos,r.pos)&&rp()<0.9)continue;
  p.pos=p.path.shift()}
};
Shift.prototype.nearCheck=function(moved){
 var r=this.r;for(var k=0;k<this.people.length;k++){var p=this.people[k],adj=man(p.pos,r.pos)<=1;
  var front=r.path.length&&p.pos===r.path[0];if(adj&&!p.adj&&moved>0&&(front&&!p.seen||moved>=2)){this.near++;this.events.push({t:this.t,c:p.pos,k:'near'})}p.adj=adj}
 if(this.events.length>40)this.events.splice(0,this.events.length-40);
};

/* ---------- renderer ---------- */
function Renderer(cv){this.cv=cv;this.ctx=cv.getContext('2d');this.cs=cv.width/W;this.colors()}
Renderer.prototype.colors=function(){this.C={bg:css('--card','#fff'),rack:css('--mut','#6b6a66'),acc:css('--accent','#0b5d63'),acc2:css('--accent2','#b8692a'),bad:css('--pop-text','#b0401b'),fg:css('--h','#111'),rule:css('--rule','#e7e4dd')}};
Renderer.prototype.draw=function(sh,f,opt){
 var c=this.ctx,cs=this.cs,C=this.C,r=sh.r;f=f==null?1:f;opt=opt||{};
 c.fillStyle=C.bg;c.fillRect(0,0,this.cv.width,this.cv.height);
 // floor grid
 c.strokeStyle=C.rule;c.lineWidth=1;c.globalAlpha=.6;c.beginPath();for(var x=0;x<=W;x++){c.moveTo(x*cs+.5,0);c.lineTo(x*cs+.5,H*cs)}for(var y=0;y<=H;y++){c.moveTo(0,y*cs+.5);c.lineTo(W*cs,y*cs+.5)}c.stroke();c.globalAlpha=1;
 // racks
 c.fillStyle=C.rack;c.globalAlpha=.32;for(var i=0;i<N;i++)if(grid[i])c.fillRect(cx(i)*cs+1,cy(i)*cs+1,cs-2,cs-2);c.globalAlpha=1;
 // dock
 c.strokeStyle=C.acc;c.setLineDash([3,3]);c.strokeRect(cx(DOCK)*cs-cs+2,cy(DOCK)*cs-cs+2,cs*3-4,cs*3-4);c.setLineDash([]);
 c.fillStyle=C.acc;c.font='600 '+Math.round(cs*.36)+'px Inter,system-ui,sans-serif';c.fillText('DOCK',cx(DOCK)*cs-cs+5,cy(DOCK)*cs-cs+cs*.5);
 function pt(a,b){return[(cx(a)+(cx(b)-cx(a))*f+.5)*cs,(cy(a)+(cy(b)-cy(a))*f+.5)*cs]}
 var rp=pt(r.prevPos==null?r.pos:r.prevPos,r.pos);
 // sensor range
 c.fillStyle=C.acc;c.globalAlpha=.07;c.fillRect(rp[0]-(sh.o.R+.5)*cs,rp[1]-(sh.o.R+.5)*cs,(2*sh.o.R+1)*cs,(2*sh.o.R+1)*cs);c.globalAlpha=1;
 // path
 if(r.path.length){c.strokeStyle=C.acc;c.lineWidth=2;c.setLineDash([2,4]);c.beginPath();c.moveTo(rp[0],rp[1]);r.path.forEach(function(p){c.lineTo((cx(p)+.5)*cs,(cy(p)+.5)*cs)});c.stroke();c.setLineDash([]);
  var g=r.path[r.path.length-1];c.strokeStyle=C.acc;c.lineWidth=2;c.strokeRect(cx(g)*cs+5,cy(g)*cs+5,cs-10,cs-10)}
 // events
 sh.events.forEach(function(e){var age=sh.t-e.t;if(age>12)return;c.globalAlpha=1-age/12;c.strokeStyle=e.k==='contact'?C.bad:C.acc2;c.lineWidth=3;c.beginPath();c.arc((cx(e.c)+.5)*cs,(cy(e.c)+.5)*cs,cs*(.5+age*.12),0,7);c.stroke()});c.globalAlpha=1;
 // people
 sh.people.forEach(function(p){var q=pt(p.prev,p.pos);c.fillStyle=C.acc2;c.beginPath();c.arc(q[0],q[1],cs*.27,0,7);c.fill();if(p.seen){c.strokeStyle=C.acc;c.lineWidth=2;c.beginPath();c.arc(q[0],q[1],cs*.42,0,7);c.stroke()}});
 // robot
 c.fillStyle=r.down>0?C.bad:C.acc;var s=cs*.74;c.beginPath();if(c.roundRect)c.roundRect(rp[0]-s/2,rp[1]-s/2,s,s,5);else c.rect(rp[0]-s/2,rp[1]-s/2,s,s);c.fill();
 c.fillStyle=C.bg;c.beginPath();c.arc(rp[0],rp[1],cs*.12,0,7);c.fill();
 if(r.spd===0&&r.path.length&&r.dwell===0){c.fillStyle=C.fg;c.font='700 '+Math.round(cs*.42)+'px Inter,system-ui,sans-serif';c.fillText(r.down>0?'!':'⏸',rp[0]+s/2+1,rp[1]-s/2+2)}
};

/* ---------- hero ---------- */
var hero=$('heroCanvas'),heroR=new Renderer(hero),heroSh=new Shift({pol:'stop',v:2,R:5,d:.05,n:8},7),heroVis=true,heroLast=0,heroAcc=0;
function heroLoop(ts){if(!heroVis){heroLast=ts;requestAnimationFrame(heroLoop);return}var dt=Math.min(100,ts-(heroLast||ts));heroLast=ts;heroAcc+=dt;var TICK=260;
 while(heroAcc>=TICK){heroAcc-=TICK;heroSh.step();if(heroSh.t>2400)heroSh=new Shift(heroSh.o,(Math.random()*1e6)|0)}
 heroR.draw(heroSh,heroAcc/TICK);$('heroTasks').textContent=heroSh.tasks;$('heroStops').textContent=heroSh.stops;requestAnimationFrame(heroLoop)}
if(RM){for(var w=0;w<60;w++)heroSh.step();heroR.draw(heroSh,1)}else{
 if('IntersectionObserver' in window)new IntersectionObserver(function(es){heroVis=es[0].isIntersecting}).observe(hero);
 requestAnimationFrame(heroLoop)}

/* ---------- controls ---------- */
var S={pol:'stop',v:2,R:5,d:.05,n:8},SEG=40,TICKS=900,exps=[],watching=null;
var floorR=new Renderer($('floorCanvas'));
function syncUI(){
 $('sV').value=S.v;$('sR').value=S.R;$('sD').value=Math.round(S.d*100);$('sN').value=S.n;
 $('sVo').textContent=S.v+' m/s';$('sRo').textContent=S.R+' m';$('sDo').textContent=Math.round(S.d*100)+'%';$('sNo').textContent=S.n;
 [].forEach.call($('policy').querySelectorAll('button'),function(b){b.setAttribute('aria-pressed',b.dataset.v===S.pol)});
 $('polH').textContent=POL[S.pol].h;
 if(!watching){var sh=new Shift(S,1);floorR.draw(sh,1)}
}
[].forEach.call($('policy').querySelectorAll('button'),function(b){b.onclick=function(){S.pol=b.dataset.v;stopWatch();syncUI()}});
$('sV').oninput=function(){S.v=+this.value;syncUI()};$('sR').oninput=function(){S.R=+this.value;syncUI()};
$('sD').oninput=function(){S.d=+this.value/100;syncUI()};$('sN').oninput=function(){S.n=+this.value;stopWatch();syncUI()};
var PRE={night:{pol:'stop',v:2,R:5,d:.05,n:2},peak:{pol:'stop',v:2,R:5,d:.05,n:14},dirty:{pol:'stop',v:2,R:5,d:.3,n:8},push:{pol:'speed',v:3,R:7,d:0,n:0}};
[].forEach.call($('presets').querySelectorAll('button'),function(b){b.onclick=function(){var p=PRE[b.dataset.p];for(var k in p)S[k]=p[k];stopWatch();syncUI();runBatch(b.textContent)}});

function stopWatch(){if(watching){clearInterval(watching.iv);watching=null;$('watch').textContent='Watch one segment';$('floorCap').textContent='Press “Watch one segment” to see a single run.';$('floorClock').textContent=''}}
$('watch').onclick=function(){
 if(watching){stopWatch();return}
 var sh=new Shift(Object.assign({},S),1),last=performance.now();watching={sh:sh};$('watch').textContent='Stop watching';
 var TICK=RM?400:90;
 function frame(){if(!watching||watching.sh!==sh)return;var f=Math.min(1,(performance.now()-last)/TICK);floorR.draw(sh,f);requestAnimationFrame(frame)}
 watching.iv=setInterval(function(){sh.step();last=performance.now();var m=Math.floor(sh.t/60),s=sh.t%60;
  $('floorClock').textContent=m+':'+(s<10?'0':'')+s+' / 15:00';
  $('floorCap').textContent='jobs '+sh.tasks+' · contacts '+sh.contacts+' · near misses '+sh.near+' · stops '+sh.stops;
  $('prog').style.width=(sh.t/TICKS*100)+'%';if(sh.t>=TICKS){clearInterval(watching.iv);watching=null;$('watch').textContent='Watch again';floorR.draw(sh,1)}},TICK);
 requestAnimationFrame(frame);
};

var running=false;
function runBatch(label){
 if(running)return;running=true;stopWatch();var o=Object.assign({},S),seg=0,tot={tasks:0,contacts:0,near:0,halt:0,ticks:0};
 $('runBatch').disabled=true;$('runBatch').textContent='Running…';
 (function chunk(){var t0=performance.now();
  while(seg<SEG&&performance.now()-t0<30){var sh=new Shift(o,seg+1);for(var t=0;t<TICKS;t++)sh.step();tot.tasks+=sh.tasks;tot.contacts+=sh.contacts;tot.near+=sh.near;tot.halt+=sh.halt;tot.ticks+=TICKS;seg++;if(seg===1)floorR.draw(sh,1)}
  $('prog').style.width=(seg/SEG*100)+'%';
  if(seg<SEG){setTimeout(chunk,0);return}
  running=false;$('runBatch').disabled=false;$('runBatch').textContent='Run 40 segments';
  var hrs=tot.ticks/3600,res={o:o,label:label||null,jph:tot.tasks/hrs,contacts:tot.contacts,cph:tot.contacts/hrs,nph:tot.near/hrs,halt:tot.halt/tot.ticks};
  res.risk=res.cph*10+res.nph;exps.push(res);if(exps.length>14)exps.shift();showResult(res)})();
}
$('runBatch').onclick=function(){runBatch()};
$('clearExp').onclick=function(){exps=[];drawFrontier();$('fVerdict').textContent='Experiments cleared. Run a setting to start a new comparison.'};
var PN={stop:'Stop',replan:'Reroute',speed:'Keep moving'};
function tag(o){return PN[o.pol]+' · '+o.v+' m/s · '+o.n+'p'+(o.d>=.2?' · '+Math.round(o.d*100)+'% miss':'')}
function showResult(r){
 $('fT').textContent=fmt(r.jph,1);$('fTs').textContent=tag(r.o);
 $('fC').textContent=r.contacts;$('fCk').className='kpi '+(r.contacts?'bad':'ok');$('fCs').textContent='in 10 robot-hours';
 $('fN').textContent=fmt(r.nph,2);$('fNk').className='kpi '+(r.nph>1?'bad':r.nph>.3?'warn':'ok');
 $('fS').textContent=Math.round(r.halt*100)+'%';
 var v='';
 if(r.contacts>0)v='<strong>'+r.contacts+' contact'+(r.contacts>1?'s':'')+' with a person in 10 robot-hours.</strong> A 40-robot fleet runs 10 robot-hours every 15 minutes. No throughput gain survives that.';
 else if(r.nph>.5)v='No contacts, but <strong>'+fmt(r.nph,1)+' near misses an hour</strong>. Near misses are the leading indicator; contacts are what they become when the floor gets busier or the sensor gets dirtier.';
 else v='<strong>A clean run.</strong> It cost '+Math.round(r.halt*100)+'% of operating time halted for safety. That time is the price of the stop, and it is usually worth paying.';
 var same=exps.filter(function(e){return e.o.n===r.o.n&&e.o.d===r.o.d}),best=same.reduce(function(a,b){return b.jph>a.jph?b:a},same[0]);
 if(best&&best!==r&&same.length>1){var dj=(best.jph/r.jph-1)*100;v+=' Your fastest setting on this floor ('+esc(tag(best.o))+') delivered '+(dj>=0?'+':'')+fmt(dj,0)+'% jobs per hour '+(best.risk>r.risk*1.2?(r.risk>0?'for '+fmt(best.risk/r.risk,1)+'× the risk events.':'but at a risk this setting avoided entirely ('+best.contacts+' contacts).'):'at similar risk.')}
 if(r.o.pol==='speed'&&r.o.n<=1)v+=' Now add pickers: demo settings rarely include the people who will share the aisle.';
 $('fVerdict').innerHTML=v;drawFrontier();
}
function drawFrontier(){
 var svg=$('frontier'),Wd=Math.round(Math.max(320,Math.min(640,svg.clientWidth||640))),Hd=Wd<480?250:270,L=46,R=20,T=16,B=40,cw=Wd-L-R,ch=Hd-T-B,C={stop:css('--accent','#0b5d63'),replan:css('--accent2','#b8692a'),speed:css('--pop-text','#b0401b')};
 var mx=Math.max.apply(null,exps.map(function(e){return e.jph}).concat([10]))*1.12,my=Math.max.apply(null,exps.map(function(e){return e.risk}).concat([1]))*1.15;
 var h='<line class="axis" x1="'+L+'" y1="'+(T+ch)+'" x2="'+(L+cw)+'" y2="'+(T+ch)+'"/><line class="axis" x1="'+L+'" y1="'+T+'" x2="'+L+'" y2="'+(T+ch)+'"/>';
 for(var g=0;g<=4;g++){var yy=T+ch-ch*g/4,xx=L+cw*g/4;h+='<text x="'+(L-6)+'" y="'+(yy+3)+'" text-anchor="end">'+fmt(my*g/4,my<4?1:0)+'</text><text x="'+xx+'" y="'+(T+ch+14)+'" text-anchor="middle">'+fmt(mx*g/4,0)+'</text>'}
 h+='<text x="'+(L+cw/2)+'" y="'+(Hd-6)+'" text-anchor="middle">Jobs per robot-hour →</text><text transform="translate(12,'+(T+ch/2)+') rotate(-90)" text-anchor="middle">Risk events per robot-hour →</text>';
  if(!exps.length)h+='<text x="'+(L+cw/2)+'" y="'+(T+ch/2)+'" text-anchor="middle" class="lab">Run a setting to plot it here</text>';
 exps.forEach(function(e,i){var x=L+e.jph/mx*cw,y=T+ch-e.risk/my*ch,last=i===exps.length-1;
  h+='<g><title>'+esc(tag(e.o))+': '+fmt(e.jph,1)+' jobs/h, '+e.contacts+' contacts, '+fmt(e.nph,2)+' near misses/h</title><circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(last?8:5.5)+'" fill="'+C[e.o.pol]+'" fill-opacity="'+(last?1:.55)+'" stroke="'+css('--card','#fff')+'" stroke-width="2"/>'+(last?'<text class="lab" x="'+(x+(x>L+cw*.7?-12:12)).toFixed(1)+'" y="'+(y-10).toFixed(1)+'" text-anchor="'+(x>L+cw*.7?'end':'start')+'">'+esc(tag(e.o))+'</text>':'')+'</g>'});
 var ly=T+4;['stop','replan','speed'].forEach(function(k,i){h+='<circle cx="'+(L+12+i*88)+'" cy="'+ly+'" r="5" fill="'+C[k]+'"/><text x="'+(L+20+i*88)+'" y="'+(ly+3)+'">'+PN[k]+'</text>'});
 svg.setAttribute('viewBox','0 0 '+Wd+' '+Hd);svg.innerHTML=h;
}
syncUI();drawFrontier();
var rzT;addEventListener('resize',function(){clearTimeout(rzT);rzT=setTimeout(drawFrontier,150)});
document.addEventListener('themechange',function(){heroR.colors();floorR.colors();if(!watching)syncUI();drawFrontier()});
if(window.matchMedia)matchMedia('(prefers-color-scheme: dark)').addEventListener&&matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){heroR.colors();floorR.colors();syncUI();drawFrontier()});

/* ================= 03 · the vendor pitch ================= */
var REP=[
 {k:'A',t:'How the 99.5% was measured',q:'Is the headline the number your floor will see?',b:'Measured per pick attempt at the vendor’s demonstration site: 1,800 SKUs, all boxed, with retries inside 30 seconds counted as success. Full-order success was not reported. Site 2 carries 11,000 SKUs and 35% of them are polybags, where the vendor’s own trial line shows 97.8% per attempt. Blended for your mix, failed picks roughly double.'},
 {k:'B',t:'Intervention log from the reference customer',q:'How often does a person have to step in?',b:'One human intervention per robot every 2.1 operating hours, with a median of 6 minutes to clear. The vendor’s benefit case assumes no recovery labour and no robot idle time while waiting for help.'},
 {k:'C',t:'Fleet availability, first six months',q:'How many robots are working when you need them?',b:'Availability averaged 91% against the 98% used in the payback. The main causes were battery swaps and a five-week lead time on drive-unit spares, during which robots stood idle.'},
 {k:'D',t:'Layout at the reference site',q:'Was it proven in conditions like yours?',b:'The reference site runs the robots in segregated zones with no pickers. Site 2 has shared aisles with up to 60 pickers at peak. In the vendor’s single shared-aisle trial, the uplift fell from 2.6× to 1.7× because robots slowed and stopped around people.'},
 {k:'E',t:'Safety case and certification',q:'What exactly is “certified safe”?',b:'The robot conforms to ISO 3691-4 as a product. The site risk assessment, management of change, staff training and periodic review are the operator’s responsibility, which the new user part of the US mobile-robot standard, R15.08-3, now spells out. “Certified” describes the machine, not your site.'},
 {k:'F',t:'Contract terms',q:'Who carries the risk if it underperforms?',b:'No throughput guarantee. Vendor liability capped at 12 months of service fees (₹1.6 crore). A 36-month minimum term. Operating data generated at your site is owned by the vendor.'}
];
var opened=[],MAXR=3;
function renderReports(){
 $('reports').innerHTML=REP.map(function(r,i){var o=opened.indexOf(r.k)>=0,dis=!o&&opened.length>=MAXR;
  return '<button type="button" class="report'+(o?' open':'')+'" data-i="'+i+'"'+(dis?' disabled':'')+' aria-expanded="'+o+'"><span class="rk">REPORT '+r.k+(o?' · READ':'')+'</span><span class="rt">'+r.t+'</span><span class="rq">'+r.q+'</span><span class="rb">'+r.b+'</span></button>'}).join('');
 [].forEach.call($('reports').querySelectorAll('.report'),function(b){b.onclick=function(){var r=REP[+b.dataset.i];if(opened.indexOf(r.k)>=0||opened.length>=MAXR)return;opened.push(r.k);renderReports();checkRec();var nb=$('reports').querySelector('[data-i="'+b.dataset.i+'"]');if(nb)nb.focus()}});
 [].forEach.call($('dots').children,function(d,i){d.className=i<opened.length?'used':''});
}
function checkRec(){var c=document.querySelector('input[name=rec]:checked');$('submitRec').disabled=!(c&&opened.length);$('recNote').textContent=!opened.length?'Read at least one report, then choose.':!c?'Choose a recommendation.':'Recommendation ready.'}
[].forEach.call(document.querySelectorAll('input[name=rec]'),function(r){r.onchange=checkRec});
renderReports();

function econ(){ // returns stepwise payback in months
 var capex=14,svc=1.6,B=13.6,steps=[],hrsYr=40*16*360,wage=450;
 function pb(b,staff,keys,label){var net=b-svc-staff;steps.push({label:label,keys:keys,net:net,months:net>0?capex/net*12:Infinity})}
 pb(B,0,[],'Vendor case');
 var b=B*(0.7/1.6);pb(b,0,['D'],'Shared aisles: 2.6× becomes 1.7×');
 b=b*(0.91/0.98);pb(b,0,['C'],'Availability: 98% becomes 91%');
 var every=2.1,idle=6/60;var f1=every/(every+idle),staff1=hrsYr/every*idle*wage/1e7;b=b*f1;pb(b,staff1,['B'],'Interventions: recovery staff and idle robots');
 var every2=2.1/2.2,f2=(every2/(every2+idle))/f1,staff2=hrsYr/every2*idle*wage/1e7;b=b*f2;pb(b,staff2,['A'],'Your item mix: failed picks double');
 var need=capex/3+svc+staff2,base=need/((0.91/0.98)*(every2/(every2+idle))),uplift=1+base/B*1.6;
 return{steps:steps,final:steps[steps.length-1],uplift:uplift,staff:staff2,cum3:steps[steps.length-1].net*3-capex}
}
$('submitRec').onclick=function(){
 var c=document.querySelector('input[name=rec]:checked');if(!c||!opened.length)return;var e=econ(),f=e.final,a=$('analysis');
 var pm=function(m){return m===Infinity?'never':fmt(m,0)+' months'};
 var maxM=Math.min(120,Math.max.apply(null,e.steps.map(function(s){return s.months===Infinity?120:s.months})));
 var h='<p class="eyebrow">Recommendation recorded · the analysis</p><h3 style="margin-top:0">The 14-month payback becomes '+pm(f.months)+'.</h3>';
 var fb={buy:'You approved the fleet on a 14-month payback. With all six reports, the fleet pays back in about <strong>'+pm(f.months)+'</strong>, beyond the 36-month contract, and after three years the network is about <strong>₹'+fmt(-e.cum3,1)+' crore</strong> behind. The vendor’s liability is capped at ₹1.6 crore. The robots may be fine; the evidence behind the decision was rung two.',
  pilot:'This is the recommendation the analysis supports, <strong>provided the pilot answers the shared-aisle question</strong> rather than succeeding in an easy zone. On the full evidence the fleet pays back in about '+pm(f.months)+', so the pilot’s job is to find out whether that number can move.',
  decline:'Defensible on these numbers: the fleet pays back in about '+pm(f.months)+', beyond the contract. But declining leaves the decisive question unanswered, which is how these robots perform in your aisles. A small pilot costs a fraction of the fleet and either kills the idea with evidence or earns the right to scale.'};
 h+='<p class="verdict">'+fb[c.value]+'</p>';
 h+='<h4 style="margin:var(--s5) 0 6px">Payback, one adjustment at a time</h4><div class="bridge">';
 e.steps.forEach(function(s){var seen=s.keys.length?opened.indexOf(s.keys[0])>=0:true,w=Math.min(100,(s.months===Infinity?120:s.months)/maxM*100);
  h+='<div class="br'+(s.keys.length?' hit':'')+'"><span>'+s.label+(s.keys.length?'<span class="'+(seen?'seen':'miss')+'">'+(seen?'Report '+s.keys[0]+' read':'Report '+s.keys[0]+' unread')+'</span>':'')+'</span><i data-w="'+w.toFixed(1)+'" style="width:0"></i><b>'+(s.months===Infinity?'never':fmt(s.months,0)+' mo')+'</b></div>'});
 h+='</div><p class="note">Fleet ₹14 crore, service ₹1.6 crore a year, 40 robots × 16 hours × 360 days, recovery staff at ₹450 an hour. Reports E and F do not change the payback; they change who carries the loss if the payback is wrong.</p>';
 var unread=REP.filter(function(r){return opened.indexOf(r.k)<0});
 h+='<h4 style="margin:var(--s5) 0 6px">What you read, and what you missed</h4><p style="font:400 .95rem/1.6 var(--sans)">You read '+opened.map(function(k){return'<strong>'+k+'</strong>'}).join(', ')+'. ';
 h+=(opened.indexOf('D')>=0?'Report D was the single largest correction, and you found it.':'The single largest correction was <strong>Report D</strong>: the reference site never shared its aisles with people.')+' ';
 h+=(opened.indexOf('F')>=0||opened.indexOf('E')>=0?'You also checked who carries the loss if the numbers are wrong.':'Neither E nor F changes the arithmetic, but together they decide who pays when the arithmetic is wrong.')+'</p>';
 if(unread.length)h+='<details class="note"><summary>Open the reports you did not read</summary>'+unread.map(function(r){return'<p><strong>Report '+r.k+' · '+r.t+'.</strong> '+r.b+'</p>'}).join('')+'</details>';
 h+='<h4 style="margin:var(--s5) 0 6px">The pilot the board should approve</h4><p style="font:400 .95rem/1.6 var(--sans);margin:0">To pay back inside the 36-month contract with today’s failure and availability figures, the fleet must reach about <strong>'+fmt(e.uplift,1)+'× in shared aisles</strong>. That is the number the pilot must prove.</p><ol class="stops">';
 ['Six robots for twelve weeks, priced at cost: three in a segregated zone, three in shared aisles, with a comparable manual zone as the baseline.',
  'Stop at once after any contact with a person. Restart only after a written review.',
  'Scale only if shared-aisle uplift reaches '+fmt(Math.ceil(e.uplift*10)/10,1)+'× by week ten, measured against the baseline zone.',
  'Stop if interventions exceed one per robot every two operating hours after week six.',
  'Renegotiate before scaling if availability is below 95%.',
  'Before the fleet contract: pricing linked to delivered throughput, liability linked to incidents rather than fees, and your site data owned by you.'].forEach(function(t){h+='<li>'+t+'</li>'});
 h+='</ol><p class="note">The case and its figures are constructed for this exercise. <a href="../case-notes.html">How the examples are built</a>.</p>';
 a.innerHTML=h;a.hidden=false;a.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});
 setTimeout(function(){[].forEach.call(a.querySelectorAll('.bridge i'),function(i){i.style.width=i.dataset.w+'%'})},60);
 $('submitRec').textContent='Update recommendation';
};

/* ================= 04 · deployment gate ================= */
var GATES=[
 {t:'Perception',c:1,q:'Does it detect people, pallets and spills it was not trained on, including someone stepping out from behind a rack?',ask:'Detection results in your lighting, at your blind corners, with untrained objects.'},
 {t:'Action limits',c:1,q:'Are speed, force and keep-out zones enforced by safety-rated hardware, not only by the AI?',ask:'The safety-rated limits and how they are verified independently of the AI model.'},
 {t:'Recovery',c:1,q:'What happens when a sensor fails, the network drops or a battery dies mid-aisle?',ask:'Fault-injection tests: sensor loss, network loss, low battery, in a live aisle.'},
 {t:'Oversight',c:1,q:'Can anyone on the floor stop it, and can a supervisor see why it stopped?',ask:'Emergency-stop coverage and a stop log a supervisor can read.'},
 {t:'Mixed traffic',c:0,q:'Has it run in aisles shared with people at your peak density?',ask:'Shared-aisle results at peak density, with near misses counted.'},
 {t:'Economics',c:0,q:'Does the payback survive real availability, interventions and recovery labour?',ask:'Intervention logs and availability from a customer like you, priced into the payback.'},
 {t:'Accountability',c:0,q:'Who owns the site risk assessment, the incident log and the data, and what is the vendor liable for?',ask:'A named owner for the site risk assessment and liability linked to incidents.'}
];
var GV=GATES.map(function(){return 1}),GL=['Not shown','Claimed','Evidenced'];
function renderGates(){
 $('gates').innerHTML=GATES.map(function(g,i){return '<div class="gate"><div><h4>'+g.t+(g.c?'<em>critical</em>':'')+'</h4><p>'+g.q+'</p></div><div class="seg" role="group" aria-label="'+g.t+' evidence">'+GL.map(function(l,v){return'<button type="button" data-g="'+i+'" data-v="'+v+'" aria-pressed="'+(GV[i]===v)+'">'+l+'</button>'}).join('')+'</div></div>'}).join('');
 [].forEach.call($('gates').querySelectorAll('button'),function(b){b.onclick=function(){GV[+b.dataset.g]=+b.dataset.v;renderGates();var nb=$('gates').querySelector('[data-g="'+b.dataset.g+'"][data-v="'+b.dataset.v+'"]');if(nb)nb.focus()}});
 gateVerdict();
}
function gateVerdict(){
 var critMissing=GATES.filter(function(g,i){return g.c&&GV[i]===0}),all=GV.every(function(v){return v===2}),v,cls,why;
 if(critMissing.length){v='Do not deploy';cls='bad';why='Nothing has been shown for '+critMissing.map(function(g){return g.t.toLowerCase()}).join(', ')+'. No pilot near people until it is.'}
 else if(all){v='Ready to scale, with monitoring';cls='ok';why='Every gate has evidence from conditions like yours. Keep the incident log and the stop conditions running after go-live.'}
 else{var n=GV.filter(function(x){return x<2}).length;v='Bounded pilot only';cls='warn';why=n+' of 7 gates rest on claims. A pilot with written stop conditions is how claims become evidence.'}
 $('gVerdict').textContent=v;$('gVerdict').className='big '+cls;$('gWhy').textContent=why;
 $('gAsk').innerHTML=GATES.map(function(g,i){return GV[i]<2?'<li><strong>'+g.t+':</strong> '+g.ask+'</li>':''}).join('');
}
$('gCopy').onclick=function(){
 var txt='PHYSICAL AI DEPLOYMENT GATE (ReadSigil)\nVerdict: '+$('gVerdict').textContent+'\n'+$('gWhy').textContent+'\n\n'+GATES.map(function(g,i){return'- '+g.t+(g.c?' [critical]':'')+': '+GL[GV[i]]+(GV[i]<2?'\n    Ask for: '+g.ask:'')}).join('\n')+'\n\nhttps://readsigil.com/physical-ai/#gate';
 function done(ok){$('gCopied').textContent=ok?'Copied.':'Copy failed; select and copy manually.';setTimeout(function(){$('gCopied').textContent=''},2500)}
 if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(function(){done(true)},function(){fallback()});else fallback();
 function fallback(){var t=document.createElement('textarea');t.value=txt;t.setAttribute('readonly','');t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();var ok=false;try{ok=document.execCommand('copy')}catch(e){}document.body.removeChild(t);done(ok)}
};
renderGates();
})();
