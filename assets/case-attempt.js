/* ReadSigil: commit to a decision before showing the post-case analysis. No network calls. */
(function(){
'use strict';
var form=document.getElementById('case-commit');
var panel=document.getElementById('case-debrief');
if(!form||!panel)return;
var key='rs-case-response:'+location.pathname.replace(/\/+/g,'/');
var box=document.getElementById('case-verdict');
var submit=document.getElementById('case-reveal');
var reset=document.getElementById('case-reset');
var status=document.getElementById('case-feedback');
function load(){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(e){return null}}
function paint(){
var r=load();var complete=r && typeof r.answer==='string' && r.answer.trim().length>=45;
panel.hidden=!complete;
box.readOnly=!!complete;
box.value=complete?r.answer:box.value;
submit.hidden=!!complete;reset.hidden=!complete;
status.textContent=complete?'Your decision is locked. The debrief is available below.':'Write a recommendation of at least 45 characters to unlock the debrief.';
return complete
}
submit.addEventListener('click',function(){
var v=box.value.trim();
if(v.length<45){status.textContent='Include your decision and why you chose it (at least 45 characters).';box.focus();return}
try{localStorage.setItem(key,JSON.stringify({answer:v,submitted:new Date().toISOString()}))}catch(e){status.textContent='Could not save your attempt in this browser. Please enable local storage.';return}
paint();panel.scrollIntoView({behavior:'smooth',block:'start'});
});
reset.addEventListener('click',function(){
if(!confirm('Clear your current attempt and hide the debrief?'))return;
try{localStorage.removeItem(key)}catch(e){}
box.value='';box.readOnly=false;paint();form.scrollIntoView({behavior:'smooth',block:'start'});
});
if(location.hash&&/^#tn-|^#case-debrief/.test(location.hash) && !load()){history.replaceState(null,'',location.pathname)}
paint();
})();