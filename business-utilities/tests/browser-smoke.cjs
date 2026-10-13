// Optional UI verification: npm install --no-save playwright; npx playwright install chromium
// Run: node tests/browser-smoke.cjs. Set CHROMIUM_EXECUTABLE for a preinstalled browser.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'..');

(async()=>{
 let browser,server;
 const errors=[];
 try {
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:1440,height:1050},acceptDownloads:true});
  page.on('pageerror',e=>errors.push(e.message));
  let network=0;page.on('request',r=>{if(/^https?:/.test(r.url()))network++});
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href);
  await page.locator('#run').click();
  assert.equal(await page.locator('#output tbody tr').count(),4);
  assert.match(await page.locator('#output').innerText(),/UNMATCHED/);
  await page.locator('[data-key="rules"]').click();await page.locator('#run').click();
  assert.equal(await page.locator('#output tbody tr').count(),6);
  assert.match(await page.locator('#output').innerText(),/INPUT_VALIDATION/);
  await page.locator('#default').selectOption('ELIGIBLE');await page.locator('#run').click();
  assert.equal(await page.locator('#output td').filter({hasText:/^ELIGIBLE$/}).count(),2);
  await page.locator('[data-key="clean"]').click();await page.locator('#run').click();
  assert.equal(await page.locator('#output td').filter({hasText:/^KEEP$/}).count(),2);
  const d=page.waitForEvent('download');await page.getByText('Download clean rows',{exact:true}).click();
  const downloaded=await d;const downloadedText=fs.readFileSync(await downloaded.path(),'utf8');
  assert.match(downloadedText,/SYN001/);assert.doesNotMatch(downloadedText,/SYN002/);
  await page.locator('#file').setInputFiles({name:'custom.csv',mimeType:'text/csv',buffer:Buffer.from('id,name,email,joined\nX,<img src=x onerror=alert(1)>,x@example.test,2026-10-14')});
  await page.locator('#run').click();assert.equal(await page.locator('#output img').count(),0);
  await page.locator('[data-key="campaign"]').click();await page.locator('#run').click();
  assert.equal(await page.locator('.campaign').count(),4);
  await page.locator('#benefit').fill('Guaranteed approval');await page.locator('#run').click();
  assert.match(await page.locator('#output').innerText(),/BLOCKED_PHRASE/);
  await page.locator('[data-key="compare"]').click();await page.locator('#run').click();
  assert.equal(await page.locator('#output tbody tr').count(),5);
  await page.locator('#after').fill(await page.locator('#before').inputValue());await page.locator('#run').click();
  assert.match(await page.locator('#output').innerText(),/No changes/);
  const pure=await page.evaluate(()=>{
   const u=window.UtilityDemo;
   let invalid=false;try{u.csvParse('a,a\n1,2')}catch{invalid=true}
   return {invalid,quoted:u.csvParse('a,b\n1,"x,y"')[0].b,escaped:u.csvEncode([{a:'=1+1'}]),date:u.cleanRun([{d:'31/02/2026'}],[],[],['d'])[0].__utility_status};
  });
  assert.ok(pure.invalid);assert.equal(pure.quoted,'x,y');assert.match(pure.escaped,/'=1\+1/);assert.equal(pure.date,'REVIEW');
  assert.equal(network,0,'Core demo must not make network requests');
  await page.locator('[data-key="rules"]').click();await page.locator('#run').click();
  if(process.env.SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,'utilities-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile horizontal overflow');
  if(process.env.SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,'utilities-mobile.png'),fullPage:true});
  console.log('PASS: six-tab navigation, translation, rules, campaign, cleaning/download, comparison, CSV edge cases, no-network core, mobile fit');

  // Local OCR is tested only when the operator has installed Python, Pillow and Tesseract.
  if(process.env.TEST_LOCAL_OCR==='1'){
   const port=18767;
   server=spawn(process.env.PYTHON||'python',['-u','cli.py','serve','--port',String(port)],{cwd:ROOT,stdio:['ignore','pipe','pipe']});
   let ready=false;
   for(let i=0;i<50;i++){try{await page.goto('http://127.0.0.1:'+port);ready=true;break}catch{await new Promise(r=>setTimeout(r,100))}}
   assert.ok(ready,'Local server must start');
   await page.locator('[data-key="ocr"]').click();
   assert.equal(await page.locator('#ocrtext').inputValue(),'');
   await page.locator('#localocr').click();
   await page.waitForFunction(()=>document.querySelector('#ocrtext').value.includes('DEMO-1042'),{},{timeout:30000});
   await page.locator('#run').click();assert.match(await page.locator('#output').innerText(),/12500.00/);
   console.log('PASS: browser → local Python → actual Tesseract → reviewed invoice fields');
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: no browser JavaScript errors');
 }finally{if(server)server.kill();if(browser)await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
