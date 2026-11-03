import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const prefix='/projects/mochimochi-jutsu/';
const allowed=['birth-mochi-preview.html','b05-birth-mochi-presenter-v0.1.mjs','b03-adopted-birth-character-rule-v1.mjs','b03-civil-date-character-candidate-v0.1.mjs','b01-day-cycle-and-character-study-v0.1.mjs','b04-birth-mochi-catalog-v0.1.json','m02-core-symbols-v0.1.json'];
const mime=f=>f.endsWith('.html')?'text/html':f.endsWith('.json')?'application/json':'text/javascript';
const server=createServer(async(req,res)=>{
 const file=decodeURIComponent((req.url||'').split('?')[0]).slice(prefix.length);
 if(!(req.url||'').startsWith(prefix)||!allowed.includes(file)){res.writeHead(404).end();return;}
 try{const data=await readFile(path.join(root,prefix,file));res.writeHead(200,{'content-type':mime(file)}).end(data)}
 catch{res.writeHead(404).end();}
});
let browser,checks=0;
const check=(v,reason)=>{assert.ok(v,reason);checks++};
try{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true});
 for(const width of [320,390]){
  const page=await browser.newPage({viewport:{width,height:800}});
  const errors=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',request=>{if(!request.url().startsWith(origin))remote.push(request.url())});
  await page.goto(origin+prefix+'birth-mochi-preview.html',{waitUntil:'networkidle'});
  check((await page.locator('h1').textContent()).includes('もちキャラ取説'),'birthday-first instruction-manual heading');
  check(await page.locator('#go').isEnabled(),'date-only app catalogs load');
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no overflow '+width);
  await page.locator('#date').fill('1987-04-25');
  await page.locator('#go').click();
  check(await page.locator('#result').isVisible(),'birthdate yields result '+width);
  check((await page.locator('#name').textContent())==='草餅','1987-04-25 甲辰 -> BC05 grass mochi');
  check((await page.locator('#element').textContent()).includes('木'),'stem wood');
  check((await page.locator('#why').textContent()).includes('甲辰'),'day ganzhi explained');
  check((await page.locator('#flavor').textContent()).includes('よもぎ'),'mochi flavor reflects the real sweet');
  check((await page.locator('#setting').textContent()).includes('自分なりの工夫'),'setting matches mochi identity');
  check((await page.locator('#caution').textContent()).includes('慣れた味'),'risk reflects mochi metaphor');
  check((await page.locator('#manual').textContent()).includes('新しい材料'),'instructions are practical and distinctive');
  check((await page.locator('.section').count())===5,'five visible sections: flavor setting caution handling element');
  check((await page.locator('#result').textContent()).includes('この餅の取説'),'section heading shows actual manual');
  check(await page.locator('#date').inputValue()==='','birthdate removed from input after use');
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'manual has no sideways overflow '+width);
  check(!await page.evaluate(()=>localStorage.length||sessionStorage.length),'no client storage');
  check(errors.length===0,'no JS exception');
  check(remote.length===0,'no network to other origin');
  await page.locator('#again').click();
  check(await page.locator('#entry').isVisible(),'can retry without reloading');
  check(await page.locator('#result').isHidden(),'old result hidden on retry');
  await page.close();
 }
 // Negative case, including a calendar date outside the adopted range.
 const page=await browser.newPage();
 await page.goto(origin+prefix+'birth-mochi-preview.html',{waitUntil:'networkidle'});
 await page.locator('#date').fill('1900-01-01');
 await page.locator('#go').click();
 check(await page.locator('#result').isVisible(),'lower supported year works');
 await page.close();
 console.log(JSON.stringify({status:'PASS',checks,viewports:[320,390],privacy:'client-only'},null,2));
}catch(e){console.error('FAIL birth mochi preview',e);process.exitCode=1}
finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
