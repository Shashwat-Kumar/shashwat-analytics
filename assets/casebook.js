/* ReadSigil Casebook / synthetic scenario math; no network/API usage */
(function(){
'use strict';
var e=document.getElementById('churn-calculator');
if(!e)return;
var ids=['volume','reach','effect','margin','cost','incentive'];
var x={};
ids.forEach(function(id){x[id]=document.getElementById('ct-'+id)});
var out=document.getElementById('ct-result');
var fmt=function(n){return new Intl.NumberFormat('en-IN',{maximumFractionDigits:0}).format(n)};
var deciles=[.5133,.2733,.2,.1267,.11,.06,.0833,.0333,.0233,.0233];
function riskCount(n){
 var remaining=n,events=0;
 for(var i=0;i<deciles.length&&remaining>0;i++){
   var take=Math.min(300,remaining);
   events+=take*deciles[i];
   remaining-=take
 }
 return events
}
function paint(){
 var n=Number(x.volume.value),reach=Number(x.reach.value)/100,effect=Number(x.effect.value)/100,
 margin=Number(x.margin.value),cost=Number(x.cost.value),incentive=Number(x.incentive.value);
 var churn=riskCount(n),saved=churn*reach*effect;
 var gross=saved*margin,offer=saved*incentive,contact=n*cost,net=gross-offer-contact;
 document.getElementById('ct-volume-v').textContent=fmt(n);
 document.getElementById('ct-reach-v').textContent=fmt(reach*100)+'%';
 document.getElementById('ct-effect-v').textContent=fmt(effect*100)+'%';
 for(var k of ['margin','cost','incentive'])document.getElementById('ct-'+k+'-v').textContent='₹'+fmt(Number(x[k].value));
 var risk=n?churn/n*100:0;
 var breakEven=(churn*reach*(margin-incentive))>0?contact/(churn*reach*(margin-incentive))*100:null;
 out.textContent='Estimated net contribution: '+(net<0?'−':'')+'₹'+fmt(Math.abs(net))+' · Assumed saved customers: '+saved.toFixed(1)+' · Selected-group baseline churn: '+risk.toFixed(1)+'%'+(breakEven!==null?' · Break-even prevention: '+breakEven.toFixed(1)+'%':'');
 out.style.color=net<0?'#8c402f':'#183c32';
}
ids.forEach(function(id){x[id].addEventListener('input',paint)});
paint();
})();