/**
 * Browser smoke tests for the non-public M09 local preview.
 * Run from repository root with: node projects/mochimochi-jutsu/tests/m09-preview.browser-test.mjs
 * Requires a local dev dependency: playwright + Chromium. No data collection.
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const servedRoot = path.resolve(root, 'projects/mochimochi-jutsu');
const calls=[];
const server=createServer(async(req,res)=>{
  calls.push({method:req.method,url:req.url});
  if(req.method!=='GET' || typeof req.url!=='string'){
    res.writeHead(405);res.end('Only static GET supported');return;
  }
  const key=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/[\w.-]+$/.test(key)){
    res.writeHead(404);res.end('Not found');return;
  }
  const file=path.resolve(servedRoot,key.slice(1));
  if(!file.startsWith(servedRoot+path.sep)){
    res.writeHead(403);res.end('Forbidden');return;
  }
  try{
    const body=await readFile(file);
    const mime=file.endsWith('.json')?'application/json; charset=utf-8':
      file.endsWith('.mjs')?'text/javascript; charset=utf-8':
      file.endsWith('.html')?'text/html; charset=utf-8':
      file.endsWith('.svg')?'image/svg+xml':'text/plain';
    res.writeHead(200,{'content-type':mime,'cache-control':'no-store'});
    res.end(body);
  }catch{res.writeHead(404);res.end('Not found')}
});
let browser;
let assertions=0;
function check(x,message){assert.ok(x,message);assertions++}
async function choose(page,id){
  await page.locator('#choices-list input[value="'+id+'"]').check();
  await page.getByRole('button',{name:/次の質問|結果を見る/}).click();
}
try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address();
  const origin='http://127.0.0.1:'+address.port;
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
  const pageErrors=[],crossOrigin=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  page.on('request',req=>{if(!req.url().startsWith(origin))crossOrigin.push(req.url())});
  await page.goto(origin+'/m09-preview.html',{waitUntil:'networkidle'});
  check(await page.locator('h1').count()===1,'one accessible page title');
  check((await page.locator('.warning').textContent()).includes('制作候補'),'provisional illustration stated');
  check(await page.locator('#questions').isHidden(),'consent gate before questions');
  check(await page.locator('#start').isDisabled(),'cannot start without consent');
  await page.locator('#agree').check();
  await page.locator('#start').click();
  // The click handler awaits four JSON requests; don't assert before they complete.
  await page.locator('#questions').waitFor({state:'visible',timeout:15000});
  check(await page.locator('#questions').isVisible(),'question screen appears');
  check(await page.locator('fieldset legend').count()===1,'single question fieldset');
  await page.waitForFunction(()=>document.querySelector('#scene-image')?.naturalWidth===800);
  check(await page.locator('#scene-image').isVisible(),'Q1 image candidate is visible');
  check((await page.locator('#scene-image').getAttribute('src'))==='./scene_v01-candidate.svg','Q1 uses original local scene asset');
  check((await page.locator('#scene-image').getAttribute('alt')).includes('道しるべ'),'image has relevant text alternative');
  check((await page.locator('#scene-text').textContent()).includes('丸テーブル'),'details include accessible Q2 landmark');

  // No answer => cannot advance; valid x must allow advance.
  await page.getByRole('button',{name:'次の質問'}).click();
  check((await page.locator('#message').textContent()).includes('選択肢を一つ'),'no silent unanswered question');
  await choose(page,'a'); // Q1: MOCHI
  check((await page.locator('#step-label').textContent()).includes('Q2'),'advance Q2');
  check(await page.locator('#scene-image').isVisible(),'Q2 shows the same shared scene');
  check((await page.locator('#scene-image').getAttribute('src'))==='./scene_v01-candidate.svg','Q2 scene asset is identical');
  check((await page.locator('#choices-list').textContent()).includes('木陰のベンチ'),'Q2 text choices come from existing bank');
  await page.getByRole('button',{name:'ひとつ戻る'}).click();
  check(await page.locator('#choices-list input[value="a"]').isChecked(),'back navigation preserves choice');
  await page.getByRole('button',{name:'次の質問'}).click();
  await choose(page,'x'); // Q2 explicit no choice
  check(await page.locator('#scene').isHidden(),'scene only appears in Q1/Q2');
  await choose(page,'c'); // Q3 FP03
  await choose(page,'a'); // Q4 MOCHI
  await choose(page,'a'); // Q5 open
  check(await page.locator('#results').isVisible(),'result screen visible');
  check((await page.locator('#rendered').textContent()).includes('のびのびもち'),'type label from catalog');
  check((await page.locator('#rendered').textContent()).includes('ふくらみ期'),'phase from catalog');
  check((await page.locator('#rendered').textContent()).includes('もち道'),'three layers shown');
  check((await page.locator('#rendered').textContent()).includes('未検証の命式'),'natal calculation held');

  // Restart and all x: no forced classification or phase.
  await page.getByRole('button',{name:'最初からやり直す'}).click();
  check(await page.locator('#consent').isVisible(),'restart shows consent');
  check(await page.locator('#agree').isChecked()===false,'agreement reset');
  await page.locator('#agree').check();
  await page.locator('#start').click();
  await page.locator('#questions').waitFor({state:'visible',timeout:15000});
  for(let i=0;i<5;i++)await choose(page,'x');
  const allX=await page.locator('#rendered').textContent();
  check(allX.includes('ひとつに決めなくても大丈夫'),'no type fallback shown');
  check(!allX.includes('のびのびもち'),'not leaking previous classification');
  check(allX.includes('今の気分については選ばず'),'null phase shown');

  // Revisit then quit: discard previous responses.
  await page.getByRole('button',{name:'最初からやり直す'}).click();
  await page.locator('#agree').check();
  await page.locator('#start').click();
  await page.locator('#questions').waitFor({state:'visible',timeout:15000});
  check(await page.locator('#choices-list input:checked').count()===0,'answers discarded');
  await page.getByRole('button',{name:'中断して回答を破棄'}).click();
  check(await page.locator('#consent').isVisible(),'stop returns to consent');
  check(await page.locator('#choices-list input:checked').count()===0,'stop discards selected choice');
  check(pageErrors.length===0,'browser has no JS errors: '+pageErrors.join('|'));
  check(crossOrigin.length===0,'no remote request: '+crossOrigin.join('|'));
  check(calls.length>0&&calls.every(r=>r.method==='GET'),'HTTP server only saw static GET requests');
  console.log(JSON.stringify({status:'PASS',browser:'Chromium',assertions,server_requests:calls.length,remote_requests:crossOrigin.length,js_errors:pageErrors.length},null,2));
}catch(error){
  console.error('FAIL M09 preview smoke test:',error.stack||error);
  process.exitCode=1;
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
