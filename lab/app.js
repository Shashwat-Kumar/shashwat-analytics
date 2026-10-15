// Prompt Lab: client-side prompt optimizer. Your key stays in this tab (optional sessionStorage, cleared when the tab closes) and is sent only to the provider you pick.
(()=>{
const $=s=>document.querySelector(s);
const PROV={groq:{url:"https://api.groq.com/openai/v1",target:"openai/gpt-oss-20b",opt:"openai/gpt-oss-120b"},
 openrouter:{url:"https://openrouter.ai/api/v1",target:"meta-llama/llama-3.1-8b-instruct",opt:"meta-llama/llama-3.3-70b-instruct"},
 gemini:{url:"https://generativelanguage.googleapis.com/v1beta/openai",target:"gemini-2.0-flash-lite",opt:"gemini-2.0-flash"},
 openai:{url:"https://api.openai.com/v1",target:"gpt-4o-mini",opt:"gpt-4o"}};
const PRESET={template:"Classify this customer message.\n\nMessage: {{message}}\n\n<protect>Never promise refunds or timelines.</protect>",
 samples:[["I was charged twice for my March invoice, please fix this today!!",'{"category": "billing", "priority": "high"}'],
 ["How do I export my reports to CSV?",'{"category": "how_to", "priority": "low"}'],
 ["The app crashes every time I open the dashboard on Android 14.",'{"category": "bug", "priority": "high"}'],
 ["Can you add dark mode? Would be nice.",'{"category": "feature_request", "priority": "low"}'],
 ["Someone logged into my account from another country, I didn't do that.",'{"category": "security", "priority": "urgent"}'],
 ["My card expired, where do I update payment details?",'{"category": "billing", "priority": "medium"}']].map(([m,e])=>JSON.stringify({inputs:{message:m},expected:e})).join("\n"),
 rubric:"Output must be ONLY a JSON object with keys category (one of billing, how_to, bug, feature_request, security) and priority (one of low, medium, high, urgent), matching EXPECTED. No prose, no markdown fences. Full marks only for exact category and priority with valid bare JSON; deduct heavily for extra text, wrong labels or invented label names."};
const esc=s=>String(s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
const VAR=/\{\{\s*(\w+)\s*\}\}/g, PROT=/<protect>([\s\S]*?)<\/protect>/g;
const render=(t,inp)=>t.replace(VAR,(m,k)=>k in inp?inp[k]:m).replace(PROT,"$1");
function restore(orig,neu){const regs=[...orig.matchAll(PROT)].map(m=>m[1]);let i=0;let out=neu.replace(PROT,(m,c)=>"<protect>"+(i<regs.length?regs[i++]:c)+"</protect>");
 for(;i<regs.length;i++)out+="\n<protect>"+regs[i]+"</protect>";const have=new Set([...out.matchAll(VAR)].map(m=>m[1]));
 for(const m of orig.matchAll(VAR))if(!have.has(m[1])){out+="\n{{"+m[1]+"}}";have.add(m[1]);}return out;}
function diff(a,b){a=a.split("\n");b=b.split("\n");const n=a.length,m=b.length,L=[...Array(n+1)].map(()=>Array(m+1).fill(0));
 for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)L[i][j]=a[i]===b[j]?L[i+1][j+1]+1:Math.max(L[i+1][j],L[i][j+1]);
 let i=0,j=0,o=[];while(i<n&&j<m){if(a[i]===b[j]){o.push("  "+esc(a[i]));i++;j++}else if(L[i+1][j]>=L[i][j+1])o.push('<span class="del">- '+esc(a[i++])+"</span>");else o.push('<span class="add">+ '+esc(b[j++])+"</span>")}
 while(i<n)o.push('<span class="del">- '+esc(a[i++])+"</span>");while(j<m)o.push('<span class="add">+ '+esc(b[j++])+"</span>");return o.join("\n");}
let stop=false;
async function chat(cfg,model,prompt,system,temperature=0){const msgs=(system?[{role:"system",content:system}]:[]).concat([{role:"user",content:prompt}]);
 for(let a=0;a<5;a++){const t0=performance.now();const r=await fetch(cfg.url+"/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+cfg.key},body:JSON.stringify({model,messages:msgs,temperature,max_tokens:4096})});
  if(r.status===429||r.status>=500){await new Promise(s=>setTimeout(s,3000*2**a));continue}
  if(!r.ok)throw new Error(model+": HTTP "+r.status+" "+(await r.text()).slice(0,200));
  const d=await r.json();const u=d.usage||{};return{text:d.choices[0].message.content||"",lat:(performance.now()-t0)/1000,tok:(u.prompt_tokens||0)+(u.completion_tokens||0)}}
 throw new Error("rate limited, try again in a minute");}
const JUDGE='You are a strict evaluator. Score the RESPONSE against the CRITERIA (and the EXPECTED answer if given). Reply with JSON only: {"score": <0-10 integer>, "reason": "<one sentence>"}';
const OPT=`You are a prompt engineer. You improve a prompt TEMPLATE so a model scores higher on an evaluation.
Rules:
- Keep every {{variable}} placeholder exactly as written.
- Text inside <protect>...</protect> must be copied verbatim, tags included. Never edit it.
- Fix the diagnosed failures with clear instructions, output format and constraints; don't overfit to one sample's content.
Reply in exactly this format:
DIAGNOSIS:
<2-4 bullet points on why samples failed>
PROMPT:
<the full new template>`;
async function evaluate(cfg,tpl,samples,rubric){const rows=[];let lat=0,tok=0;
 for(const s of samples){if(stop)throw new Error("stopped");const c=await chat(cfg,cfg.target,render(tpl,s.inputs));
  const jp="CRITERIA:\n"+rubric+"\n\nINPUT:\n"+JSON.stringify(s.inputs)+"\n\n"+(s.expected?"EXPECTED:\n"+s.expected+"\n\n":"")+"RESPONSE:\n"+c.text;
  const j=await chat(cfg,cfg.opt,jp,JUDGE);let sc=0,why=j.text;try{const d=JSON.parse(j.text.match(/\{[\s\S]*\}/)[0]);sc=Math.min(1,Math.max(0,d.score/10));why=d.reason||""}catch(e){}
  lat+=c.lat;tok+=c.tok;rows.push({inputs:s.inputs,expected:s.expected,output:c.text,score:sc,reason:why})}
 return{mean:rows.reduce((a,r)=>a+r.score,0)/rows.length,samples:rows,latency_s:lat/rows.length,tokens:tok};}
function showRound(r,best){const el=document.createElement("div");el.className="round"+(best?" best":"");
 el.innerHTML=`<b>Round ${r.round}</b> · mean score <b>${(r.score*100).toFixed(0)}%</b> · ${r.latency_s.toFixed(2)}s/sample · ${r.tokens} tokens`+
 (r.diagnosis?`<div class="note">${esc(r.diagnosis).replace(/\n/g,"<br>")}</div>`:"")+
 `<details><summary class="note">per-sample</summary>${r.samples.map(s=>`<div class="note">${(s.score*100).toFixed(0)}% · ${esc(JSON.stringify(s.inputs).slice(0,90))}<br>→ ${esc(s.output.slice(0,160))}<br><i>${esc(s.reason)}</i></div>`).join("<hr>")}</details>`;
 $("#rounds").appendChild(el);}
function showFinal(base,best,b0,b1,cmp){$("#final").hidden=false;
 $("#sb").textContent=(b0*100).toFixed(0)+"%";$("#sa").textContent=(b1*100).toFixed(0)+"%";$("#sa").className="score "+(b1>b0?"up":"");
 $("#pb").textContent=base;$("#pa").textContent=best;$("#diff").innerHTML=diff(base,best);
 $("#cmp").innerHTML=cmp&&cmp.length?"<tr><th>Model</th><th>Baseline</th><th>Optimized</th><th>Latency (s)</th><th>Est. cost (USD)</th></tr>"+cmp.map(c=>`<tr><td>${esc(c.model)}</td><td>${(c.baseline*100).toFixed(0)}%</td><td>${(c.optimized*100).toFixed(0)}%</td><td>${c.baseline_latency_s.toFixed(2)} → ${c.optimized_latency_s.toFixed(2)}</td><td>${c.baseline_cost_usd.toFixed(5)} → ${c.optimized_cost_usd.toFixed(5)}</td></tr>`).join(""):"";}
function parseSamples(t){return t.split("\n").map(l=>l.trim()).filter(Boolean).map(l=>{const o=JSON.parse(l);return{inputs:o.inputs||o,expected:o.expected||null}})}
async function run(){stop=false;$("#rounds").innerHTML="";$("#final").hidden=true;$("#status").textContent="";
 const p=$("#prov").value;const cfg={url:PROV[p].url,key:$("#key").value.trim(),target:$("#target").value.trim(),opt:$("#opt").value.trim()};
 if(!cfg.key){$("#status").textContent="Paste your API key first, or press “Try a demo”.";return}
 try{localStorage.removeItem("pl_key_"+p)}catch(e){}if($("#remember").checked)sessionStorage.setItem("pl_key_"+p,cfg.key);else sessionStorage.removeItem("pl_key_"+p);
 let samples;try{samples=parseSamples($("#samples").value)}catch(e){$("#status").textContent="Samples must be one JSON object per line.";return}
 const tpl=$("#tpl").value,rubric=$("#rubric").value,maxR=+$("#rounds-n").value;$("#go").disabled=true;
 try{$("#status").textContent="Round 0: scoring your original prompt…";let cur=await evaluate(cfg,tpl,samples,rubric);
  let best={...cur,template:tpl},stale=0;const r0={round:0,score:cur.mean,diagnosis:"",...cur};showRound(r0,true);const b0=cur.mean;
  for(let r=1;r<=maxR&&best.mean<0.999;r++){$("#status").textContent=`Round ${r}: diagnosing failures and rewriting…`;
   const worst=[...best.samples].sort((a,b)=>a.score-b.score).slice(0,4);
   const cases=worst.map(w=>`[score ${w.score.toFixed(2)}] INPUT: ${JSON.stringify(w.inputs)}\n${w.expected?"EXPECTED: "+w.expected+"\n":""}OUTPUT: ${w.output.slice(0,600)}\nJUDGE: ${w.reason}`).join("\n\n");
   const o=await chat(cfg,cfg.opt,`CRITERIA:\n${rubric}\n\nCURRENT TEMPLATE:\n${best.template}\n\nLOWEST-SCORING CASES:\n${cases}`,OPT,0.4);
   const idx=o.text.indexOf("PROMPT:");let nt=idx>=0?o.text.slice(idx+7).trim().replace(/^```\w*\n?|```$/g,"").trim():best.template;
   const diag=(idx>=0?o.text.slice(0,idx):"").replace("DIAGNOSIS:","").trim();nt=restore(best.template,nt);
   $("#status").textContent=`Round ${r}: scoring the rewritten prompt…`;cur=await evaluate(cfg,nt,samples,rubric);
   const better=cur.mean>=best.mean+0.01;showRound({round:r,score:cur.mean,diagnosis:diag,...cur},better);
   if(better){best={...cur,template:nt};stale=0}else if(++stale>=2)break;}
  $("#status").textContent="Done.";showFinal(tpl,best.template,b0,best.mean,null);
 }catch(e){$("#status").textContent="Error: "+e.message}finally{$("#go").disabled=false}}
async function demo(){$("#rounds").innerHTML="";$("#final").hidden=true;
 const d=await fetch("demo-run.json").then(r=>r.json());$("#status").textContent=`Replaying a real run (${d.target} target, ${d.optimizer} optimizer and judge, ${d.provider}, ${d.ran_at}).`;
 for(const r of d.rounds){showRound(r,r.template===d.best);await new Promise(s=>setTimeout(s,900))}showFinal(d.baseline,d.best,d.baseline_score,d.best_score,d.compare);}
function fill(){const p=$("#prov").value;$("#target").value=PROV[p].target;$("#opt").value=PROV[p].opt;try{localStorage.removeItem("pl_key_"+p)}catch(e){}$("#key").value=sessionStorage.getItem("pl_key_"+p)||"";}
$("#prov").onchange=fill;fill();$("#tpl").value=PRESET.template;$("#samples").value=PRESET.samples;$("#rubric").value=PRESET.rubric;
$("#go").onclick=run;$("#stop").onclick=()=>{stop=true};
fetch("demo-run.json",{method:"HEAD"}).then(r=>{if(r.ok){$("#demo").hidden=false;$("#demo").onclick=demo}});
})();
