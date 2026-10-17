(function(){
'use strict';
const D=window.RS_CASES||[], KEY='rs_case_lab_v2', LABELS=['Framing','Investigation','Evidence & data','Commercial reasoning','Technology design','AI & controls','Execution'];
const target=85;
const coaching={
'Framing':'Frame the controllable management decision, target denominator, time horizon and constraints before prescribing work.',
'Investigation':'Check the facts that would distinguish the possible explanations before spending time or money on the wrong answer.',
'Evidence & data':'Test entity identity, timeframe, definitions, selection bias, data lineage and real-world decision usability.',
'Commercial reasoning':'Build fully-loaded unit economics and holdout-adjusted value; stress-test marginal economics as you scale.',
'Technology design':'Trace source-to-decision lineage, integration contracts, freshness, logging, latency and failure fallback.',
'AI & controls':'Compare model-driven proposals with process and rules baselines; set autonomy, escalation and model-risk boundaries.',
'Execution':'Specify decision rights, accountable owners, release gates, monitoring, counterfactuals and explicit rollback criteria.'
};
const $=s=>document.querySelector(s),esc=v=>String(v==null?'':v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const n=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e};
const button=(text,cls,fn)=>{const e=n('button',cls,text);e.type='button';e.addEventListener('click',fn);return e};
let data={};try{data=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){data={}}
let current=null,mode='challenge',localChoice=null,localRoute=null,routeLocked=false,answerLocked=false,hintUsed=false,reviewed=false;
function persist(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}}
function store(){if(!current)return null;const id=current.id;return data[id]||(data[id]={answers:[],memo:'',started:new Date().toISOString(),finished:false})}
function total(c,r){return Math.round(((r?.answers||[]).reduce((v,a)=>v+(a.routePoints||0)+(a.answerPoints||0),0))/(c.steps.length*10)*100)}
function normalize(a){return ({'Problem framing':'Framing','Evidence':'Evidence & data','Economics':'Commercial reasoning','Decision design':'AI & controls','Execution':'Execution'})[a]||a}
function home(){
 current=null;document.title='Case Lab · ReadSigil';const root=$('#app');root.replaceChildren();
 root.innerHTML='<section class="lab-hero"><p class="eyebrow">READSIGIL / CASE LAB</p><h1>Your next call.<br><em>Four high-stakes cases.</em></h1><p class="deck">You are responsible for the decision. Ask to see the reports you need, respond as new facts emerge, and recommend what management should do. Once you finish, review the reasoning and results.</p></section><section class="cases-grid" id="catalogue" aria-label="Choose a decision case"></section>';
 D.forEach(c=>{
 const p=data[c.id],a=n('article','case-card');a.tabIndex=0;a.setAttribute('role','button');a.setAttribute('aria-label','Open case '+c.name);
 a.innerHTML='<div class="case-meta">CASE FILE '+String(D.indexOf(c)+1).padStart(3,'0')+' · '+esc(c.sector)+'</div><h2>'+esc(c.name)+'</h2><p>'+esc(c.teaser||'A decision taken on incomplete information.')+'</p><div class="case-bottom"><span>'+c.steps.length+' decisions · 50–70 minutes</span><strong>'+(p?.finished?'Review your decisions':p?.answers?.length?'Resume investigation':'Open case file')+' →</strong></div>';
 a.addEventListener('click',()=>open(c.id));a.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(c.id)}});$('#catalogue').append(a);
 });
}
function open(id){current=D.find(x=>x.id===id);if(!current)return home();document.title=current.name+' · ReadSigil';const r=store();if(r.answers.length>=current.steps.length){if(r.finished)report();else conclusion();return}step();}
function step(){
 if(!current)return home();const r=store(),idx=r.answers.length;if(idx>=current.steps.length)return conclusion();
 const s=current.steps[idx];localChoice=null;localRoute=null;routeLocked=false;answerLocked=false;hintUsed=false;
 const root=$('#app');root.replaceChildren();
 const earned=r.answers.reduce((v,a)=>v+(a.routePoints||0)+(a.answerPoints||0),0);
 root.innerHTML='<div class="session-top"><a href="../cases.html">← Casebook</a><button id="leave" type="button">All cases</button></div><div class="scoreboard" role="group" aria-label="Live case scoreboard"><div><small>STEPS LEFT</small><strong>'+ (current.steps.length-idx)+'</strong></div><div><small>STEPS COMPLETED</small><strong>'+idx+' <span>/ '+current.steps.length+'</span></strong></div><div><small>ANALYSIS</small><strong>After your call</strong></div><div><small>BOARD REVIEW</small><strong>After your recommendation</strong></div></div><div class="session-meta"><span>'+esc(current.sector)+'</span><span>'+esc(s.phase||'Investigation')+' · '+(idx+1)+' / '+current.steps.length+'</span></div><div class="meter" aria-hidden="true"><i style="width:'+Math.round(idx/current.steps.length*100)+'%"></i></div><section class="case-body"><aside class="evidence"><p class="eyebrow">YOUR MANDATE</p><h2>'+esc(current.name)+'</h2><p>'+esc(current.mandate)+'</p><div class="roles"><strong>Role</strong><span>'+esc(current.role)+'</span></div><div class="notebook"><h3>Evidence inventory</h3><p>'+idx+' exhibit'+(idx===1?'':'s')+' reviewed. You can revisit earlier findings in the final review.</p><button class="ghost" id="notes">My working notes</button><textarea id="scratch" aria-label="Private working notes" rows="5" placeholder="Hypotheses, calculations, unanswered questions..."></textarea></div></aside><section class="work"><p class="eyebrow">DECISION '+String(idx+1).padStart(2,'0')+' / '+esc(s.phase||'DISCOVERY')+'</p><h1>'+esc(s.title)+'</h1><p class="lead">'+esc(s.prompt)+'</p><section id="activity"></section><section id="exhibit" hidden></section><section id="decision" hidden></section><section id="feedback" aria-live="polite"></section></section></section>';
 $('#leave').onclick=home;
 const scratch=$('#scratch');scratch.value=r.notes||'';scratch.oninput=()=>{r.notes=scratch.value;persist()};
 $('#notes').onclick=()=>{scratch.hidden=!scratch.hidden};scratch.hidden=true;
 const activity=$('#activity');activity.innerHTML='<h3>Where would you look first?</h3><p class="micro">You can only check one thing right now. What would you ask the team to show you?</p>';
 const opts=n('div','options');s.find.forEach((q,i)=>{const b=button(q,'option',()=>{localRoute=i;[...opts.children].forEach(o=>o.classList.remove('selected'));b.classList.add('selected')});opts.append(b)});activity.append(opts);
 activity.append(button('Get the information →','primary',()=>{if(localRoute===null||routeLocked)return;routeLocked=true;const routeGood=localRoute===s.best;
 activity.replaceChildren();const panel=n('div','decision-call');panel.innerHTML='<small>YOU ASKED TO SEE</small><p>'+(mode==='learn'?esc(s.why):'We will come back to whether this was the most useful place to start.')+'</p><p class="micro">See what you found, then decide what to do.</p>';activity.append(panel);
 const ex=$('#exhibit');ex.hidden=false;ex.innerHTML='<p class="eyebrow">REPORT / '+String(idx+1).padStart(2,'0')+'</p><h3>Here is what came back</h3><p>'+esc(s.exhibit)+'</p><p class="micro">Check what the figures actually measure before making the call.</p>';
 showQuestion(s,routeGood?4:0);
 }));
}
function showQuestion(s,routePoints){
 const d=$('#decision');d.hidden=false;d.innerHTML='<h3>What would you do?</h3><p class="question">'+esc(s.question)+'</p>';
 localChoice=null;
 const actions=n('div','controls');
 const send=button('Confirm and continue →','primary',submit);
 send.disabled=true;
 let numericInput=null;
 let errorBox=null;
 function valid(){
  if(s.type==='number')return numericInput!==null&&numericInput.value.trim()!==''&&numericInput.validity.valid&&Number.isFinite(Number(numericInput.value));
  return Number.isInteger(localChoice);
 }
 function refresh(){
  send.disabled=!valid()||answerLocked;
  if(errorBox){errorBox.hidden=true;errorBox.textContent='';}
  if(numericInput)numericInput.setAttribute('aria-invalid','false');
 }
 if(s.type==='number'){
  const row=n('div','number-answer'),label=n('label','answer-label','Your figure'),input=n('input','numeric');
  input.type='number';input.step='any';input.inputMode='decimal';input.autocomplete='off';
  input.placeholder='Enter a number';input.id='case-number-answer';
  label.setAttribute('for',input.id);
  input.setAttribute('aria-label','Your figure in '+(s.unit||'the stated units'));
  input.oninput=()=>{localChoice=input.value;refresh()};
  input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();submit()}};
  numericInput=input;
  row.append(label,input);
  if(s.unit)row.append(n('span','unit',s.unit));
  errorBox=n('p','input-error','');errorBox.id='case-number-error';errorBox.hidden=true;errorBox.setAttribute('role','alert');
  input.setAttribute('aria-describedby',errorBox.id);
  d.append(row,errorBox);
 } else {
  const opts=n('div','options');
  s.choices.forEach((x,i)=>{const b=button(x,'option',()=>{
   localChoice=i;
   [...opts.children].forEach(v=>{v.classList.remove('selected');v.setAttribute('aria-pressed','false')});
   b.classList.add('selected');b.setAttribute('aria-pressed','true');refresh();
  });
  b.setAttribute('aria-pressed','false');opts.append(b)});
  d.append(opts);
 }
 const hint=button('Need a hint? (−2 points)','ghost',()=>{
  if(hintUsed)return;
  hintUsed=true;hint.disabled=true;
  d.insertBefore(n('p','hint',s.hint||'Think about which facts would change the financial or operating decision.'),actions);
 });
 actions.append(send,hint);
 d.append(actions);
 function submit(){
  if(answerLocked)return;
  if(!valid()){
   if(numericInput){
    errorBox.hidden=false;errorBox.textContent='Enter a valid number'+(s.unit?' in '+s.unit:'')+'.';
    numericInput.setAttribute('aria-invalid','true');numericInput.focus();
   }
   return;
  }
  const v=s.type==='number'?Number(numericInput.value):localChoice;
  const correct=s.type==='number'?Math.abs(v-s.answer)<=s.tolerance:v===s.answer;
  const answerPoints=correct?(hintUsed?4:6):0;
  answerLocked=true;
  const r=store();
  r.answers.push({route:localRoute,routePoints,answer:v,answerPoints,correct,hintUsed,area:normalize(s.area),phase:s.phase||''});
  persist();
  d.querySelectorAll('button,input').forEach(e=>e.disabled=true);
  const f=$('#feedback');const fb=n('div','feedback');
  fb.innerHTML='<p class="eyebrow">'+(mode==='learn'?'ANALYST VIEW':'DECISION NOTED')+'</p><h3>'+ (mode==='learn'?'What the analysis shows':'Next') +'</h3>'+(mode==='learn'?'<p>'+esc(s.reason)+'</p>':'<p>We will review the reasoning once you finish the case.</p>')+'<div class="controls" id="continue"></div>';
  if(mode==='learn'&&s.optionNotes&&s.type!=='number'){const p=n('p','micro','On your choice: '+(s.optionNotes[v]||''));fb.insertBefore(p,fb.lastChild)}
  f.append(fb);
  $('#continue').append(button(r.answers.length===current.steps.length?'Present your recommendation →':'Next development →','primary',()=>{
   if(r.answers.length===current.steps.length)conclusion();else step();
   window.scrollTo(0,0);
  }));
 }
}

function conclusion(){
 const r=store(),root=$('#app');root.replaceChildren();
 root.innerHTML='<div class="session-top"><button id="back">← Case Lab</button><span>Executive defence</span></div><section class="work memo"><p class="eyebrow">BOARDROOM / FINAL RESPONSE</p><h1>Your recommendation</h1><p class="lead">You have seen the evidence. The board wants a decision. Write a short recommendation based on the facts available, stating your financial and risk assumptions.</p><label for="memo">Your executive memo</label><textarea id="memo" rows="12" placeholder="Decision requested; root cause and evidence; business, process, data and technology intervention; AI boundary (if relevant); fully loaded economics and counterfactual; accountable owners, staging, stop rules..."></textarea><p class="micro">Your written response is saved in this browser and is not scored.</p><div class="controls"><button class="primary" id="submit-memo">View complete assessment →</button></div></section>';
 $('#back').onclick=home;$('#memo').value=r.memo||'';$('#memo').oninput=e=>{r.memo=e.target.value;persist()};$('#submit-memo').onclick=()=>{r.memo=$('#memo').value;r.finished=true;r.completed=new Date().toISOString();persist();report()};
}
function byDomain(c,r){const by=Object.fromEntries(LABELS.map(x=>[x,{points:0,max:0,count:0}]));c.steps.forEach((s,i)=>{const a=r.answers[i];if(!a)return;by['Investigation'].points+=a.routePoints;by['Investigation'].max+=4;by['Investigation'].count++;const domain=normalize(s.area);if(!by[domain])return;by[domain].points+=a.answerPoints;by[domain].max+=6;by[domain].count++});return by}
function drawRadar(by,el){
 const root=el||$('#radar'),ns='http://www.w3.org/2000/svg',cx=320,cy=260,rad=160,N=LABELS.length;root.replaceChildren();
 const node=(tag,attrs,txt)=>{const el=document.createElementNS(ns,tag);Object.entries(attrs||{}).forEach(([k,v])=>el.setAttribute(k,v));if(txt!==undefined)el.textContent=txt;root.append(el);return el};
 const point=(i,v)=>{const a=-Math.PI/2+i*2*Math.PI/N,r=rad*v/100;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r]};
 const pts=arr=>arr.map((v,i)=>point(i,v).map(x=>x.toFixed(1)).join(',')).join(' ');
 for(const level of [20,40,60,80,100])node('polygon',{points:pts(LABELS.map(()=>level)),fill:'none',stroke:'#d9dcd7','stroke-width':'1'});
 const actual=LABELS.map(k=>by[k].max?Math.round(by[k].points/by[k].max*100):0);
 LABELS.forEach((k,i)=>{const q=point(i,100),t=point(i,132);node('line',{x1:cx,y1:cy,x2:q[0],y2:q[1],stroke:'#d9dcd7'});node('text',{x:t[0],y:t[1],'text-anchor':Math.abs(t[0]-cx)<8?'middle':t[0]>cx?'start':'end','font-size':k.length>15?'11':'12','font-weight':'600',fill:'#243b36'},k)});
 node('polygon',{points:pts(LABELS.map(()=>target)),fill:'none',stroke:'#af7a2e','stroke-dasharray':'7 5','stroke-width':'2.5'});
 node('polygon',{points:pts(actual),fill:'rgba(11,93,99,.19)',stroke:'#0b5d63','stroke-width':'3'});
 actual.forEach((v,i)=>{const p=point(i,v);node('circle',{cx:p[0],cy:p[1],r:'4.3',fill:'#0b5d63'})});
 const title=document.createElementNS(ns,'title');title.textContent='Your performance compared to 85 percent reference: '+LABELS.map((k,i)=>k+': '+actual[i]+' percent').join(', ');root.prepend(title);
}
function report(){
 if(!current)return home();const c=current,r=store(),root=$('#app'),score=total(c,r),by=byDomain(c,r);
 root.replaceChildren();
 root.innerHTML='<div class="session-top"><button id="all">← All cases</button><span>16-part investigation · Complete</span></div><section class="report-hero"><p class="eyebrow">READSIGIL / EXECUTIVE DECISION PROFILE</p><h1>Review of your decisions</h1><p>'+esc(c.name)+'</p><div class="total"><strong>'+score+'</strong><span>/ 100</span></div><p class="lead">'+(score>=85?'Strong performance against the case-design reference.':score>=65?'Several sound decisions; inspect the specific diagnostic gaps below.':'The case exposes important skills to develop before committing to an enterprise solution.')+'</p></section><section class="skills"><h2>Seven-axis decision profile</h2><p class="micro">Solid shape: your scored decisions. Dashed shape: the 85% reference level set by the case design. The reference is not a population norm or a psychometric standard.</p><div class="radar-layout"><svg id="radar" viewBox="0 0 640 570" role="img" aria-label="Candidate versus expert-target spider diagram"></svg><div class="radar-side"><h3>How to interpret</h3><p>A larger shape reflects stronger performance in this case only. Each axis rests on a small number of decisions.</p><p><span class="legend-self"></span> Candidate performance<br><span class="legend-ideal"></span> 85% aspirational target</p></div></div><div id="orientation"></div><h2>Evidence by competency</h2><div id="breakdown"></div><h2>What would improve the profile?</h2><div id="development"></div></section><section class="review"><h2>Review of your decisions</h2><div id="reviews"></div></section><section class="note"><h2>Executive memo & self-check</h2><p>Written judgement is not included in the numerical profile. Review your memo against the seven-domain rubric: a bounded recommendation with an evidence bridge, counterfactual, technology/AI decision boundary, owners and stop rules. Your written recommendation is not automatically graded.</p><blockquote id="memo-output"></blockquote><div class="controls" id="end-actions"></div></section>';
 $('#all').onclick=home;drawRadar(by);
 const pct=k=>by[k].max?by[k].points/by[k].max*100:0;
 const archetypes=[
 ['Investigative strategist',['Framing','Investigation','Evidence & data'],'Hypothesis discipline and selecting information that can change a decision.'],
 ['Commercial decision-maker',['Framing','Commercial reasoning','Execution'],'Financial logic, opportunity cost and turning a mandate into investable choices.'],
 ['Technology & AI designer',['Evidence & data','Technology design','AI & controls'],'Connecting governable data and technical capabilities to accountable decisions.'],
 ['Enterprise transformation operator',['Commercial reasoning','Technology design','Execution'],'Sequencing change across economics, systems and ownership.']
 ];
 const rankedProfiles=archetypes.map(([name,axes,description])=>({name,axes,description,score:axes.reduce((v,k)=>v+pct(k),0)/axes.length})).sort((a,b)=>b.score-a.score);
 const top=rankedProfiles[0],other=rankedProfiles[1],tight=top.score-other.score<6;
 const orient=$('#orientation');orient.className='orientation';
 orient.innerHTML='<p class="eyebrow">PROVISIONAL CASE-SOLVING ORIENTATION</p><h3>'+esc(tight?'Cross-functional judgement':top.name)+'</h3><p>'+esc(tight?'Your strongest composite areas are closely matched; the case does not reliably identify one dominant work style.':top.description)+'</p><p class="micro">The pattern reflects this case only and does not predict job performance. Some axes rest on few decisions.</p>';
 const breakdown=$('#breakdown');
 LABELS.forEach(label=>{const q=by[label],pct=q.max?Math.round(q.points/q.max*100):0;
 const row=n('div','skill');row.innerHTML='<span>'+esc(label)+'</span><strong>'+pct+'% <small>/ 85%</small></strong><div class="skillbar"><i style="width:'+pct+'%"></i></div><small>'+q.count+' scored decisions</small>';breakdown.append(row)});
 const weak=LABELS.filter(k=>by[k].count).sort((a,b)=>(by[a].points/by[a].max)-(by[b].points/by[b].max)).slice(0,3);
 weak.forEach(label=>{const q=by[label],pct=Math.round(q.points/q.max*100),card=n('article','priority');card.innerHTML='<h3>'+esc(label)+' · '+pct+'% compared with 85%</h3><p>'+esc(coaching[label])+'</p><small>Based on '+q.count+' observed scored decisions; interpret cautiously.</small>';$('#development').append(card)});
 c.steps.forEach((s,i)=>{const a=r.answers[i],d=n('details','review-item');if(!a)return;
 d.innerHTML='<summary><span>'+String(i+1).padStart(2,'0')+' · '+esc(s.title)+'</span><strong>'+(a.routePoints+a.answerPoints)+'/10</strong></summary><p><b>Information reviewed:</b> '+esc(s.find[a.route])+'</p><p><b>Why this information matters:</b> '+esc(s.why)+'</p><p><b>Evidence:</b> '+esc(s.exhibit)+'</p><p><b>Decision:</b> '+esc(s.question)+'</p><p><b>Your answer:</b> '+esc(s.type==='number'?a.answer+' '+s.unit:s.choices[a.answer])+'</p><p><b>Best-supported conclusion:</b> '+esc(s.type==='number'?s.answer+' '+s.unit:s.choices[s.answer])+'</p><p><b>Why:</b> '+esc(s.reason)+'</p>';$('#reviews').append(d)});
 $('#memo-output').textContent=r.memo||'No executive memo submitted.';
 $('#end-actions').append(button('Download assessment JSON','primary',()=>{const blob=new Blob([JSON.stringify({case:c.name,score,benchmark:target,competencies:by,answers:r.answers,memo:r.memo,completed:r.completed},null,2)],{type:'application/json'});const u=URL.createObjectURL(blob),a=n('a');a.href=u;a.download='readsigil-'+c.id+'-assessment.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1500)}));
 $('#end-actions').append(button('Print report','ghost',()=>window.print()));
 $('#end-actions').append(button('Restart this case','ghost',()=>{if(confirm('Delete local answers for this case and restart?')){delete data[c.id];persist();open(c.id)}}));
}
window.RS_CASE_LAB={labels:LABELS,drawRadar,completed(){return D.filter(c=>data[c.id]?.finished&&data[c.id].answers?.length).map(c=>{const r=data[c.id];if(!r.attempt_id){r.attempt_id=crypto.randomUUID();persist()}return {case_id:c.id,attempt_id:r.attempt_id,score:total(c,r),breakdown:byDomain(c,r),answers:r.answers}})}};
document.addEventListener('DOMContentLoaded',home);
})();