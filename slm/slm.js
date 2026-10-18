"use strict";
const samples = {
  cards:"My debit card was declined at the supermarket.",
  payments:"My UPI transfer is pending and the amount was debited.",
  account:"Please help me download my savings account statement.",
  other:"Where can I find the nearest branch on a Sunday?",
  unknown:"Hello, can someone help?"
};
const sampleSelect=document.querySelector("#sampleCategory");
if(sampleSelect){
  sampleSelect.addEventListener("change",()=>{
    const label=sampleSelect.value;
    document.querySelector("#sampleText").textContent=samples[label];
    document.querySelector("#sampleLabel").textContent=label;
  });
}
const epochs=document.querySelector("#epochs");
const rank=document.querySelector("#rank");
const code=document.querySelector("#command");
const updateCommand=()=>{
  code.textContent="python -m pip install -r requirements.txt\n"+
    "python train.py --train data/train.jsonl --eval data/eval.jsonl --epochs "+
    epochs.value+" --rank "+rank.value;
};
if(epochs&&rank){epochs.addEventListener("change",updateCommand);rank.addEventListener("change",updateCommand);}
const copy=document.querySelector("#copyCommand");
if(copy)copy.addEventListener("click",async()=>{
  try{
    await navigator.clipboard.writeText(code.textContent);
    copy.textContent="Copied";
    copy.setAttribute("aria-label","Commands copied");
  }catch(error){
    copy.textContent="Select the commands above to copy";
  }
});
const base=document.querySelector("#baseCorrect");
const adapted=document.querySelector("#adaptedCorrect");
const result=document.querySelector("#scoreOutcome");
const updateResult=()=>{
  if(base.value===""||adapted.value===""){
    result.textContent="Run the code and enter the results. Nothing is assumed.";
    return;
  }
  const b=Number(base.value),a=Number(adapted.value);
  if(!Number.isInteger(b)||!Number.isInteger(a)||b<0||a<0||b>25||a>25){
    result.textContent="Enter whole numbers from 0 to 25 for each run.";
    return;
  }
  const delta=a-b;
  const phrase=delta>0?"improved":delta<0?"fell":"did not change";
  const diff=delta===0?"":` by ${Math.abs(delta)} of the 25 cases`;
  result.textContent=`Your measured exact-label accuracy: base ${(100*b/25).toFixed(0)}%; adapted ${(100*a/25).toFixed(0)}%. Performance ${phrase}${diff}. This small invented test is instructional; inspect errors and test on representative independent data before claiming a real-world gain.`;
};
if(base&&adapted){base.addEventListener("input",updateResult);adapted.addEventListener("input",updateResult);}
