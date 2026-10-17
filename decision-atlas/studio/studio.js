'use strict';
(function(){
const A=window.ATLAS;
const $=id=>document.getElementById(id);
if(!A||!Array.isArray(A.terms)||!Array.isArray(A.combos)){document.body.textContent='Metric library unavailable. Please reload the page.';return;}
const METRICS=new Map(A.terms.map(m=>[m.name,m]));
const RAW={
bank:[
['SA-only','Active','Digital',18000,.88,.84,.12,4800,22,180000],
['SA-only','Active','Branch',12000,.80,.73,.10,5200,35,150000],
['SA-only','Low activity','Digital',16000,.76,.47,.07,3400,18,210000],
['SA-only','Dormant','Branch',10000,.70,.19,.03,2700,30,150000],
['TD-only','Active','Branch',9000,.82,.77,.10,5700,40,140000],
['TD-only','Low activity','Digital',14000,.65,.59,.08,4100,22,175000],
['TD-only','Dormant','Partner',8000,.60,.27,.04,2200,36,140000],
['Multi-product','Active','Digital',12000,.85,.87,.13,6500,20,180000],
['Multi-product','Active','Partner',11000,.75,.61,.09,5900,34,180000],
['Multi-product','Low activity','Branch',12000,.68,.42,.07,4500,40,200000],
['Multi-product','Dormant','Partner',7000,.49,.25,.025,3100,55,150000],
['SA-only','Low activity','Partner',8000,.68,.31,.05,2600,44,165000]
],
service:[
['Routine','0–2 days','Digital',6000,.93,.94,.15,1.2,.025,35],
['Routine','3–7 days','Branch',4800,.90,.76,.13,1.15,.045,40],
['Routine','>7 days','Partner',3300,.70,.45,.11,1.4,.08,35],
['Disputes','0–2 days','Digital',4000,.70,.82,.16,2.7,.05,45],
['Disputes','3–7 days','Branch',3000,.83,.63,.23,3.1,.08,50],
['Disputes','>7 days','Partner',1800,.77,.30,.29,4.2,.13,65],
['Exceptions','0–2 days','Branch',5100,.85,.80,.08,1.7,.07,50],
['Exceptions','3–7 days','Digital',4200,.78,.74,.15,2.9,.08,65],
['Exceptions','>7 days','Partner',1900,.56,.33,.22,4.0,.13,40],
['Routine','0–2 days','Partner',2200,.83,.55,.09,1.15,.05,25],
['Disputes','3–7 days','Digital',2600,.91,.83,.19,3.1,.03,48],
['Exceptions','3–7 days','Partner',3700,.66,.51,.11,2.7,.09,45]
]};
const STORIES={
bank:{
name:'Existing-customer growth',tag:'Banking · customer economics',
objective:'Where should we target the first 90-day customer-growth intervention?',
context:'You are responsible for a customer base of 137,000. Growth is an outcome; AI is only one potential enabler. The immediate decision is what customer problem to solve first and how to verify incremental contribution.',
lenses:[
{id:'relationship',field:0,name:'Relationship type',explanation:'Separate product ownership cohorts. Different product gaps call for different actions and have different economics.'},
{id:'activity',field:1,name:'Engagement',explanation:'Separate people by activity. An active customer and a dormant customer do not have equal contactability or needs.'},
{id:'channel',field:2,name:'Service route',explanation:'Segment by contact route and execution owner. A great opportunity on paper may lack a workable route to action.'}
],
metricNames:['Incremental Value','Cannibalisation','Action Rate','Time-to-Value','Capacity','Data Trust','Execution Integration','Error Cost'].filter(x=>x!=='Data Trust'),
comboQuestions:['Is the model or the last mile the problem?','Does use mean action?','Is the data fit for this decision?','Is the upside worth the exposure?','Is authority matched to the cost of error?'],
formulaLabel:'Estimated incremental contribution',unit:'₹',valueLabel:'Net opportunity, ₹',
owner:'Customer Growth Head and Finance',success:'Holdout-adjusted net incremental contribution, contact-to-action conversion, and cannibalisation; not gross booked balances.',
stop:'Stop or redesign if control-adjusted contribution is non-positive or contact/consent safeguards fail.',
actions:{
'SA-only':['Test a product-fit offer only on eligible, reachable savings customers.','Check whether missing products reflect need, eligibility or unresolved service friction.','Product owner + approved outbound route'],
'TD-only':['Test maturity-timed relationship deepening without shifting balances internally.','Verify maturity timing, marginal funding cost and displacement from existing products.','Liability product owner + renewal channel'],
'Multi-product':['Investigate relationship profitability before adding another offer.','Separate genuine incremental contribution from TD-to-SA or product-to-product transfers.','Relationship manager + Finance'],
'Active':['Prioritise a reachable cohort with measurable product or service needs.','Ask whether the limiting factor is willingness, workflow friction or incentives.','Product owner + existing channel'],
'Low activity':['Diagnose why usage is low before assuming a cross-sell opportunity.','Check changing needs, servicing issues and reachable customer consent.','Customer analytics + service owner'],
'Dormant':['Audit contactability and suitability before spending on outreach.','Confirm account status, reachable permissions and whether revival creates net value.','Operations + customer contact owner'],
'Digital':['Run a consent-compliant digital holdout and measure completed actions.','Test delivery, reach, conversion and incremental contribution independently.','Digital growth + CRM owner'],
'Branch':['Pilot a branch-executable action with workload and incentive checks.','Check branch capacity, queue ownership and conversion leakage.','Distribution lead + branch operations'],
'Partner':['Audit partner eligibility, data permissions and execution leakage.','Verify that partner-originated activity translates into profitable bank-level value.','Partnerships lead + governance']
}},
service:{
name:'Customer-service backlog',tag:'Operations · workflow economics',
objective:'Which part of the service backlog should receive the first process intervention?',
context:'Your operations team faces 42,600 service cases. The objective is to reduce avoidable human handling hours without worsening resolution quality. A chatbot or model is not the starting hypothesis.',
lenses:[
{id:'issue',field:0,name:'Problem category',explanation:'Separate routine requests, disputes and exceptions; their causes and controls differ.'},
{id:'age',field:1,name:'Case ageing',explanation:'Isolate long-running cases from newly opened cases; ageing can expose missing approvals and handoffs.'},
{id:'route',field:2,name:'Owning route',explanation:'Distinguish digital, branch and partner queues. The same error has different execution owners.'}
],
metricNames:['Capacity','Alert Volume','Execution Integration','Action Rate','Trust','Error Cost','Observability','Time-to-Value'],
comboQuestions:['Can the team keep up?','Is the model or the last mile the problem?','Does use mean action?','Is the data fit for this decision?','Is the upside worth the exposure?'],
formulaLabel:'Estimated net handling hours saved',unit:'hours',valueLabel:'Net hours released',
owner:'Head of Service Operations',success:'Verified hours released with resolution quality, complaint recurrence, SLA and customer harm monitored.',
stop:'Pause if error/reopen rates rise or the intervention displaces work into another queue.',
actions:{
'Routine':['Repair repeat handling through better workflow routing before adding AI.','Identify which rework steps account for time and whether automation is even necessary.','Service process owner + queue supervisor'],
'Disputes':['Trace decision authority and evidence gaps before shortening review time.','Check reversals, complaints and the cost of incorrect closures.','Disputes head + Risk'],
'Exceptions':['Map exception triggers and approval loops at case level.','Is the bottleneck inaccurate data, capacity, or a decision no one owns?','Exceptions owner + IT'],
'0–2 days':['Address avoidable touchpoints early in the workflow.','Compare work that finishes first time with work that returns to the queue.','Intake owner'],
'3–7 days':['Examine transfer and rework at the first ageing inflection.','Identify what changed between intake and overdue status.','Workflow manager'],
'>7 days':['Map stuck decisions, approvals and rework to their owners.','Check whether ageing is caused by capacity, missing records or policy exceptions.','Escalation owner'],
'Digital':['Investigate digital exception handoffs to human teams.','Measure straight-through rate and downstream reversals, not just chatbot containment.','Digital service + Ops'],
'Branch':['Inspect end-to-end transfer to central processing and local work queues.','Track days and touches lost between branch and back office.','Branch operations + central service'],
'Partner':['Audit third-party data quality and responsibility for unresolved cases.','Check defects introduced before ingestion and exception ownership.','Partner service + procurement']
}}};
const n=(x,dec=0)=>new Intl.NumberFormat('en-IN',{maximumFractionDigits:dec,minimumFractionDigits:dec}).format(x);
let current='bank',lensId='relationship',criterion='net',scale=1,selected=null,metric=null,combination=null;
const scenarioRows=()=>RAW[current].map((r,i)=>({i,group:r[STORIES[current].lenses.find(l=>l.id===lensId).field],n:r[3],eligible:r[4],reach:r[5],uplift:r[6],unit:r[7],cost:r[8],fixed:r[9]}));
function calculate(r){const reached=r.n*r.eligible*r.reach;const actions=reached*Math.min(1,r.uplift*scale);return{n:r.n,reach:reached,actions,net:actions*r.unit-reached*r.cost-r.fixed,fixed:r.fixed};}
function rowsFor(){
 const by=new Map();
 for(const r of scenarioRows()){let z=by.get(r.group);if(!z){z={name:r.group,n:0,reach:0,actions:0,net:0,fixed:0,members:0};by.set(r.group,z)}const c=calculate(r);for(const k of ['n','reach','actions','net','fixed'])z[k]+=c[k];z.members++;}
 return Array.from(by.values()).sort((a,b)=>b[criterion]-a[criterion]||a.name.localeCompare(b.name));
}
function val(x){return current==='bank'? '₹'+n(x/100000,2)+' lakh':n(x,1)+' hours'}
const record=()=>rowsFor().find(x=>x.name===selected)||rowsFor()[0];
function el(tag,cls,txt){const x=document.createElement(tag);if(cls)x.className=cls;if(txt!=null)x.textContent=txt;return x}
function clear(x){x.replaceChildren()}
function renderScenarios(){
 const box=$('scenarios');clear(box);
 for(const id of Object.keys(STORIES)){const t=STORIES[id],b=el('button');b.type='button';b.setAttribute('aria-pressed',String(id===current));b.append(el('strong',null,t.name),el('small',null,t.tag));b.onclick=()=>{current=id;lensId=STORIES[id].lenses[0].id;criterion='net';scale=1;selected=null;metric=null;combination=null;render()};box.append(b)}
 const t=STORIES[current];$('objectiveTitle').textContent=t.objective;$('objectiveContext').textContent=t.context;
}
function renderLenses(){const box=$('lenses');clear(box);for(const l of STORIES[current].lenses){const b=el('button',null,l.name);b.type='button';b.setAttribute('aria-pressed',String(l.id===lensId));b.onclick=()=>{lensId=l.id;selected=null;render()};box.append(b)}
 const lens=STORIES[current].lenses.find(l=>l.id===lensId);$('lensTitle').textContent='A working partition: '+lens.name;$('lensExplanation').textContent=lens.explanation;
 const total=RAW[current].reduce((a,r)=>a+r[3],0),groupTotal=rowsFor().reduce((a,r)=>a+r.n,0);
 $('partitionCheck').textContent=(total===groupTotal?'100% accounted for · ':'Partition error · ')+n(groupTotal)+' of '+n(total);
}
function addKpi(parent,label,value,sub){const x=el('div','kpi');x.append(el('span',null,label),el('strong',null,value),el('small',null,sub));parent.append(x)}
function renderSegments(){
 const data=rowsFor();if(!data.some(d=>d.name===selected))selected=data[0].name;
 const all=data.reduce((p,r)=>({n:p.n+r.n,reach:p.reach+r.reach,actions:p.actions+r.actions,net:p.net+r.net}),{n:0,reach:0,actions:0,net:0});
 const top=data[0];const k=$('kpis');clear(k);
 addKpi(k,'Total problem population',n(all.n),'Same population, regardless of the segmentation lens');
 addKpi(k,'Estimated total net benefit',val(all.net),'Based on the current case assumptions');
 addKpi(k,'Highest under chosen objective',top.name,'Current criterion: '+$('criterion').selectedOptions[0].textContent);
 const tb=$('segmentRows');clear(tb);for(const d of data){const tr=el('tr',d.name===selected?'selected':null);const name=el('td','seg-name',d.name);name.append(el('small',null,n(d.members)+' underlying micro-cohorts'));tr.append(name);
  for(const v of [n(d.n),n(d.reach),n(d.actions,1),val(d.net)])tr.append(el('td','right',v));
  const cell=el('td','right'),b=el('button','choose',d.name===selected?'Investigating':'Investigate');b.type='button';b.setAttribute('aria-pressed',String(d.name===selected));b.onclick=()=>{selected=d.name;renderSegments();renderDiagnosis();renderContract()};cell.append(b);tr.append(cell);tb.append(tr)}
 return all;
}
function renderDiagnosis(){
 const d=record(),s=STORIES[current];$('focusName').textContent=d.name;$('focusReadout').textContent='A selected slice of '+n(d.n)+' cases or customers. Investigate this group before choosing an intervention.';
 const box=$('assumptions');clear(box);
 const pairs=[['Part of total population',n(d.n)],['Eligible & reachable',n(d.reach)],['Expected incremental actions',n(d.actions,1)],['Estimated net opportunity',val(d.net)],['Assigned setup cost',val(d.fixed)]];
 for(const [a,b] of pairs){const x=el('div','assumption');x.append(el('span',null,a),el('b',null,b));box.append(x)}
 if(!metric||!METRICS.has(metric))metric=s.metricNames[0];
 const opts=$('metric');clear(opts);
 const important=el('optgroup');important.label='Most relevant for this problem';for(const m of s.metricNames){const o=el('option',null,m);o.value=m;important.append(o)}opts.append(important);
 const rest=el('optgroup');rest.label='Explore all other defined measures';for(const m of A.terms.map(x=>x.name).filter(x=>!s.metricNames.includes(x)).sort()){const o=el('option',null,m);o.value=m;rest.append(o)}opts.append(rest);opts.value=metric;
 const def=METRICS.get(metric),out=$('metricExplainer');clear(out);
 if(def){out.append(el('h4',null,def.name),el('p',null,def.definition),el('p','test','Measure: '+def.measure),el('p',null,'Challenge: '+def.ask))}else out.append(el('p',null,'Metric definition not in library.'));
 if(!combination||!A.combos.some(x=>x.q===combination))combination=s.comboQuestions[0];
 const co=$('combination');clear(co);const recommended=el('optgroup');recommended.label='Most relevant pairings';for(const q of s.comboQuestions){const o=el('option',null,q);o.value=q;recommended.append(o)}co.append(recommended);const allOther=el('optgroup');allOther.label='All other original combinations';for(const q of A.combos.map(x=>x.q).filter(x=>!s.comboQuestions.includes(x))){const o=el('option',null,q);o.value=q;allOther.append(o)}co.append(allOther);co.value=combination;
 const combo=A.combos.find(o=>o.q===combination),cx=$('comboExplainer');clear(cx);
 if(combo)cx.append(el('h4',null,combo.q),el('p','test',combo.x+' × '+combo.y),el('p',null,'Use this relationship to ask why the selected segment is not delivering the outcome. The matrix is a diagnostic prompt, not an automatic verdict.'));
}
function contractData(){const s=STORIES[current],d=record(),act=s.actions[d.name]||['Investigate the binding constraint.','Verify unit economics and ownership.','Accountable operating owner'];return{
status:'Scenario-based intervention brief',objective:s.objective,partition:STORIES[current].lenses.find(l=>l.id===lensId).name,focus:d.name,criterion,assumption_multiplier:scale,base_population:d.n,reachable_eligible_estimate:Math.round(d.reach),expected_incremental_actions:Math.round(d.actions),estimated_net_benefit:d.net,unit:s.unit,intervention:act[0],segment_question:act[1],route_owner:act[2],accountable_owner:s.owner,diagnostic_metric:metric,paired_metric_question:combination,success_evidence:s.success,stop_rule:s.stop,caveat:'Values use scenario assumptions; verify economics, evidence and authority for real deployment.'};}
function renderContract(){const v=contractData(),box=$('contract');clear(box);for(const [name,text] of [
['To whom?',v.focus+' · '+n(v.base_population)+' in this segment'],
['To do what?',v.intervention],
['Through whom?',v.route_owner],
['Why this slice?',v.segment_question],
['Metric to validate',v.diagnostic_metric+' · '+v.paired_metric_question],
['Who owns the outcome?',v.accountable_owner],
['What proves it worked?',v.success_evidence],
['What stops or changes it?',v.stop_rule]
]){const cell=el('div');cell.append(el('b',null,name),el('p',null,text));box.append(cell)}}
function render(){renderScenarios();renderLenses();$('criterion').value=criterion;$('assumptionScale').value=String(scale);renderSegments();renderDiagnosis();renderContract();}
function copyText(){const c=contractData();return Object.entries(c).map(([k,v])=>k.replaceAll('_',' ').toUpperCase()+': '+v).join('\n')}
function download(){const payload=JSON.stringify({...contractData(),formula:'sum(eligible_reachable*action_uplift*unit_net_contribution - eligible_reachable*handling_cost - allocated_setup_cost)',original_metric_library:'/decision-atlas/',research_nav:'/decision-navigator/'},null,2);
 const u=URL.createObjectURL(new Blob([payload],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download='readsigil-decision-atlas-brief.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),500);}
function boot(){
$('criterion').onchange=()=>{criterion=$('criterion').value;renderSegments();renderDiagnosis();renderContract()};
$('assumptionScale').onchange=()=>{scale=Number($('assumptionScale').value);renderSegments();renderDiagnosis();renderContract()};
$('metric').onchange=()=>{metric=$('metric').value;renderDiagnosis();renderContract()};
$('combination').onchange=()=>{combination=$('combination').value;renderDiagnosis();renderContract()};
$('copyContract').onclick=()=>{const text=copyText(),el=$('copyStatus');if(!navigator.clipboard||!navigator.clipboard.writeText){el.textContent='Clipboard unavailable: use the JSON export';return;}navigator.clipboard.writeText(text).then(()=>{el.textContent='Brief copied'}).catch(()=>{el.textContent='Clipboard blocked: use JSON export'})};
$('downloadContract').onclick=download;
render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
