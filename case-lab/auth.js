(function(){
'use strict';
const c=window.RS_AUTH_CONFIG||{};if(!c.url||!c.anonKey)return;
const base=c.url.replace(/\/$/,'');let session=null;let currentUser=null;
const memo='rs-case-lab-auth';
try{const raw=localStorage.getItem(memo);if(raw)session=JSON.parse(raw)}catch(e){}
async function call(path,method,body,auth){
 const headers={'apikey':c.anonKey,'Content-Type':'application/json'};
 if(auth&&session?.access_token)headers.Authorization='Bearer '+session.access_token;
 const res=await fetch(base+path,{method,headers,body:body?JSON.stringify(body):undefined});
 let payload={};try{payload=await res.json()}catch(e){}
 if(!res.ok)throw Error(payload.msg||payload.error_description||payload.message||payload.error||'Account request failed');
 return payload;
}
function persist(s){session=s;try{if(s)localStorage.setItem(memo,JSON.stringify(s));else localStorage.removeItem(memo)}catch(e){}}
async function refresh(){
 if(!session?.refresh_token)return false;
 try{const s=await call('/auth/v1/token?grant_type=refresh_token','POST',{refresh_token:session.refresh_token},false);persist(s);return true}catch(e){persist(null);return false}
}
async function getUser(){
 if(!session)return null;
 try{const u=await call('/auth/v1/user','GET',null,true);currentUser=u;return u}catch(e){if(await refresh()){const u=await call('/auth/v1/user','GET',null,true);currentUser=u;return u}return null}
}
function alertMessage(text){const l=document.querySelector('#account-message');if(l)l.textContent=text}
function ui(){
 const root=document.querySelector('#account-area');if(!root)return;root.replaceChildren();
 const wrap=document.createElement('div');wrap.className='account-panel';
 if(currentUser){
 const info=document.createElement('p');info.textContent='Signed in as '+(currentUser.email||'member');wrap.append(info);
 const sync=document.createElement('button');sync.type='button';sync.textContent='Save completed scores to account';sync.onclick=async()=>{try{let count=0;const states=JSON.parse(localStorage.getItem('rs_case_lab_v1')||'{}');for(const id of ['growth','fraud','factory','public']){const x=states[id];if(!x?.finished||!x.attempts?.length)continue;const score=Math.round(x.attempts.reduce((s,a)=>s+(a.answerPoints||0)+(a.investPoints||0),0)/(x.attempts.length*10)*100);const payload={user_id:currentUser.id,case_id:id,attempt_id:x.attempt_id||(x.attempt_id=crypto.randomUUID()),score,breakdown:{local:true},answers:x.attempts};await call('/rest/v1/case_attempts','POST',payload,true);count++}localStorage.setItem('rs_case_lab_v1',JSON.stringify(states));alertMessage(count+' case score(s) saved to your account.')}catch(e){alertMessage(e.message)}};wrap.append(sync);
 const past=document.createElement('button');past.type='button';past.textContent='View score history';past.onclick=async()=>{try{const rows=await call('/rest/v1/case_attempts?select=case_id,score,submitted_at&order=submitted_at.desc&limit=30','GET',null,true);alertMessage(rows.length?rows.map(r=>r.case_id+': '+r.score+'/100 · '+new Date(r.submitted_at).toLocaleDateString()).join(' | '):'No saved scores yet.')}catch(e){alertMessage(e.message)}};wrap.append(past);
 const out=document.createElement('button');out.type='button';out.textContent='Sign out';out.onclick=async()=>{try{await call('/auth/v1/logout','POST',{},true)}catch(e){}persist(null);currentUser=null;ui()};wrap.append(out);
 }else{
 const email=document.createElement('input');email.type='email';email.placeholder='Email';email.autocomplete='email';email.setAttribute('aria-label','Email');wrap.append(email);
 const pass=document.createElement('input');pass.type='password';pass.placeholder='Password (12+ characters)';pass.autocomplete='current-password';pass.setAttribute('aria-label','Password');wrap.append(pass);
 for(const action of ['Create account','Sign in']){const b=document.createElement('button');b.type='button';b.textContent=action;b.onclick=async()=>{try{if(!email.value.includes('@')||pass.value.length<12)throw Error('Enter a valid email and a password of at least 12 characters.');if(action==='Create account'){await call('/auth/v1/signup','POST',{email:email.value,password:pass.value},false);alertMessage('Check your email to confirm registration, then sign in.')}else{const s=await call('/auth/v1/token?grant_type=password','POST',{email:email.value,password:pass.value},false);persist(s);await getUser();alertMessage('Signed in.');ui()}}catch(e){alertMessage(e.message)}};wrap.append(b)}
 }
 root.append(wrap);
}
async function init(){await getUser();ui()}
window.RS_ACCOUNT={init,ui};document.addEventListener('DOMContentLoaded',init);
})();