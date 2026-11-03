/**
 * Browser smoke tests for the non-public M09 local preview.
 * Run from repository root with: node projects/mochimochi-jutsu/tests/m09-preview.browser-test.mjs
 * Requires a local dev dependency: playwright + Chromium. No data collection.
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const servedRoot = path.resolve(root, 'projects/mochimochi-jutsu');
const calls=[];
const evidenceDir=path.join(root,'pk04-evidence');
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
const audits=[];
function check(x,message){assert.ok(x,message);assertions++}
async function accessibility(page,name){
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  const bad=result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target).slice(0,5)}));
  check(bad.length===0,'Accessibility audit for '+name+': '+JSON.stringify(bad));
  return {screen:name,rules:result.passes.length,violations:bad.length};
}
async function choose(page,id){
  await page.locator('#choices-list input[value="'+id+'"]').check();
  await page.getByRole('button',{name:/次の質問|結果を見る/}).click();
}
try{
  await mkdir(evidenceDir,{recursive:true});
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
  check((await page.locator('h1').textContent()).includes('今日の自分'),'product-style diagnosis hero appears');
  check((await page.locator('.prototype-label').textContent()).includes('非公開'),'no public-release claim');
  check((await page.locator('.hero-chips').textContent()).includes('登録不要'),'registration-free value shown');
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'390px viewport has no sideways overflow');
  audits.push(await accessibility(page,'consent-390'));
  check((await page.locator('.warning').textContent()).includes('制作候補'),'provisional illustration stated');
  check(await page.locator('#questions').isHidden(),'consent gate before questions');
  check(await page.locator('#start').isDisabled(),'cannot start without consent');
  await page.locator('#agree').check();
  await page.locator('#start').click();
  // The click handler awaits four JSON requests; don't assert before they complete.
  await page.locator('#questions').waitFor({state:'visible',timeout:15000});
  check(await page.locator('#questions').isVisible(),'question screen appears');
  check(await page.locator('fieldset legend').count()===1,'single question fieldset');
  check((await page.locator('#step-name').textContent()).includes('景色から浮かぶこと'),'question title accompanies step indicator');
  check(await page.getByRole('progressbar').count()===1,'native progress visible');
  check(await page.locator('#choices-list label').count()===7,'Q1 shows six choices and explicit x');
  await page.waitForFunction(()=>document.querySelector('#scene-image')?.naturalWidth===800);
  check(await page.locator('#scene-image').isVisible(),'Q1 image candidate is visible');
  check((await page.locator('#scene-image').getAttribute('src'))==='./scene_v01-candidate.svg','Q1 uses original local scene asset');
  check((await page.locator('#scene-image').getAttribute('alt')).includes('道しるべ'),'image has relevant text alternative');
  check((await page.locator('#scene-text').textContent()).includes('丸テーブル'),'details include accessible Q2 landmark');
  audits.push(await accessibility(page,'q1-390'));
  await page.screenshot({path:path.join(evidenceDir,'q1-390.png'),fullPage:true});
  const asset=await page.evaluate(async()=>{
    const source=await (await fetch('./scene_v01-candidate.svg')).text();
    const doc=new DOMParser().parseFromString(source,'image/svg+xml');
    return {parseError:doc.querySelectorAll('parsererror').length,
      cues:[...doc.querySelectorAll('g[data-cue]')].map(el=>el.getAttribute('data-cue')),
      viewBox:doc.documentElement.getAttribute('viewBox'),
      scripts:doc.querySelectorAll('script,foreignObject').length};
  });
  check(asset.parseError===0,'SVG parses as XML');
  check(asset.viewBox==='0 0 800 1000','scene has 4:5 aspect ratio');
  check(asset.scripts===0,'candidate SVG has no embedded scripts or foreignObject');
  check(asset.cues.length===6&&new Set(asset.cues).size===6
     &&['a','b','c','d','e','f'].every(id=>asset.cues.includes(id)),'all six Q2 cues are registered in SVG');

  // No answer => cannot advance; valid x must allow advance.
  await page.getByRole('button',{name:'次の質問'}).click();
  check((await page.locator('#message').textContent()).includes('選択肢を一つ'),'no silent unanswered question');
  await choose(page,'a'); // Q1: MOCHI
  check((await page.locator('#step-label').textContent()).includes('Q2'),'advance Q2');
  check(await page.locator('#scene-image').isVisible(),'Q2 shows the same shared scene');
  check((await page.locator('#scene-image').getAttribute('src'))==='./scene_v01-candidate.svg','Q2 scene asset is identical');
  check((await page.locator('#choices-list').textContent()).includes('木陰のベンチ'),'Q2 text choices come from existing bank');
  await page.screenshot({path:path.join(evidenceDir,'q2-390.png'),fullPage:true});
  await page.getByRole('button',{name:'ひとつ戻る'}).click();
  check(await page.locator('#choices-list input[value="a"]').isChecked(),'back navigation preserves choice');
  await page.getByRole('button',{name:'次の質問'}).click();
  await choose(page,'x'); // Q2 explicit no choice
  check(await page.locator('#scene').isHidden(),'scene only appears in Q1/Q2');
  await choose(page,'c'); // Q3 FP03
  await choose(page,'a'); // Q4 MOCHI
  await choose(page,'a'); // Q5 open
  check(await page.locator('#results').isVisible(),'result screen visible');
  check(await page.evaluate(()=>document.activeElement?.id==='result-heading'),'result heading receives focus after finishing');
  check(await page.locator('#results .section').count()===3,'M09 three result layers displayed as cards');
  check((await page.locator('#results .scene-description').textContent()).includes('この診断の読み方'),'optional interpretation is accessible');
  audits.push(await accessibility(page,'result-390'));
  await page.screenshot({path:path.join(evidenceDir,'result-390.png'),fullPage:true});
  check((await page.locator('#rendered').textContent()).includes('のびのびもち'),'type label from catalog');
  check((await page.locator('#rendered').textContent()).includes('曲がり角に、もう一本の道'),'PK03 type scene title from v0.2 catalog');
  check((await page.locator('#rendered').textContent()).includes('小さな実験の午後'),'PK03 phase scene title from v0.2 catalog');
  check((await page.locator('#rendered').textContent()).includes('いつものやり方に、小さな寄り道を一つ加えるなら？'),'type-specific closing question takes precedence');
  check((await page.locator('#rendered').textContent()).includes('ふくらみ期'),'phase from catalog');
  check((await page.locator('#rendered').textContent()).includes('もち道'),'three layers shown');
  check((await page.locator('#rendered').textContent()).includes('未検証の命式'),'natal calculation held');

  // Restart and all x: no forced classification or phase.
  await page.getByRole('button',{name:'もう一度、5問を選ぶ'}).click();
  check(await page.locator('#consent').isVisible(),'restart shows consent');
  check(await page.locator('#choices-list input').count()===0,'restart clears prior answer controls');
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
  await page.getByRole('button',{name:'もう一度、5問を選ぶ'}).click();
  await page.locator('#agree').check();
  await page.locator('#start').click();
  await page.locator('#questions').waitFor({state:'visible',timeout:15000});
  check(await page.locator('#choices-list input:checked').count()===0,'answers discarded');
  await page.getByRole('button',{name:'中断して回答を破棄'}).click();
  check(await page.locator('#consent').isVisible(),'stop returns to consent');
  check(await page.locator('#choices-list input:checked').count()===0,'stop discards selected choice');
  await page.setViewportSize({width:320,height:700});
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'320px viewport has no sideways overflow');
  audits.push(await accessibility(page,'consent-320'));
  check(await page.evaluate(()=>localStorage.length===0 && sessionStorage.length===0),
    'no browser storage of answers');
  check(await page.locator('#start').isDisabled(),'consent is required again after quit');
  // Asset failure: there is a meaningful textual alternative, and the answer path is not blocked.
  const fallback=await browser.newPage({viewport:{width:320,height:700}});
  await fallback.route('**/scene_v01-candidate.svg',route=>route.abort());
  await fallback.goto(origin+'/m09-preview.html',{waitUntil:'networkidle'});
  await fallback.locator('#agree').check();
  await fallback.locator('#start').click();
  await fallback.locator('#questions').waitFor({state:'visible',timeout:15000});
  check(await fallback.locator('#scene-image').isHidden(),'broken image is not shown as a blank box');
  check((await fallback.locator('#scene-state').textContent()).includes('読み込みに失敗'),'asset failure is explained');
  check((await fallback.locator('#scene-text').textContent()).includes('道しるべ'),'accessible text description remains');
  await fallback.locator('#choices-list input[value="x"]').check();
  await fallback.locator('#next').click();
  check((await fallback.locator('#step-label').textContent()).includes('Q2'),'no visual asset still permits choosing x');
  await fallback.close();
  check(pageErrors.length===0,'browser has no JS errors: '+pageErrors.join('|'));
  check(crossOrigin.length===0,'no remote request: '+crossOrigin.join('|'));
  check(calls.length>0&&calls.every(r=>r.method==='GET'),'HTTP server only saw static GET requests');
  console.log(JSON.stringify({status:'PASS',browser:'Chromium',assertions,audits,server_requests:calls.length,remote_requests:crossOrigin.length,js_errors:pageErrors.length,visual_review:'NOT_PERFORMED'},null,2));
}catch(error){
  console.error('FAIL M09 preview smoke test:',error.stack||error);
  process.exitCode=1;
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
