/**
 * N02 prototype: deterministic selection of past-year story anchors.
 * Strictly for SYNTHETIC fixtures. NEVER accepts personal DOB, M06 claims,
 * actual year-pillar calculations, or audit/release certification.
 * The weighted score is an editorial ranking heuristic, not a fortune score.
 */
export const SELECTOR_VERSION = 'n02-story-anchor-selector-v0.1';
export const FIXTURE_RULES = Object.freeze({
  FX_DECADE_BORDER: Object.freeze({motif:'T_RECONSIDER',kind:'boundary'}),
  FX_RECONSIDER: Object.freeze({motif:'T_RECONSIDER',kind:'relation'}),
  FX_EXPERIMENT: Object.freeze({motif:'T_EXPERIMENT',kind:'relation'}),
  FX_CONNECT: Object.freeze({motif:'T_CONNECT',kind:'relation'}),
  FX_CONSOLIDATE: Object.freeze({motif:'T_CONSOLIDATE',kind:'relation'}),
  FX_REST: Object.freeze({motif:'T_REST',kind:'relation'})
});
export const MOTIF_SCENES = Object.freeze({
 T_RECONSIDER: Object.freeze({
   title:'当たり前を見直す',tension:'続けたい気持ちと、変えたい気持ち',
   examples:Object.freeze(['慣れた仕事の順番を変えようか迷う場面','同じ場所にいても、いつもの景色が違って感じられる場面'])
 }),
 T_EXPERIMENT: Object.freeze({
   title:'試してみる',tension:'動いてみたい気持ちと、うまくいくか分からない不安',
   examples:Object.freeze(['作りかけの企画を誰かに見せようとする場面','初めての連絡を送る前に手が止まる場面'])
 }),
 T_CONNECT: Object.freeze({
   title:'関わり方を選ぶ',tension:'一緒にいたい気持ちと、自分の時間も大切にしたい気持ち',
   examples:Object.freeze(['誘いへの返事を考える場面','やりとりを続ける距離感を探る場面'])
 }),
 T_CONSOLIDATE: Object.freeze({
   title:'育ててきたものを整える',tension:'新しく広げたい気持ちと、手元にあるものを守りたい気持ち',
   examples:Object.freeze(['続けてきた習慣を少し作り替える場面','予定帳を見て残したい仕事を選ぶ場面'])
 }),
 T_REST: Object.freeze({
   title:'余白を見つける',tension:'頑張りたい気持ちと、いったん休みたい気持ち',
   examples:Object.freeze(['休日に予定を詰めるか迷う場面','一人の時間を作るために予定を見直す場面'])
 })
});
const TRANSITIONS=new Set(['T_RECONSIDER>T_EXPERIMENT','T_EXPERIMENT>T_CONSOLIDATE']);
function fail(message){const e=new TypeError(message);e.code='FIXTURE_INVALID';throw e;}
function record(x){return x!==null&&typeof x==='object'&&!Array.isArray(x);}
function wholeYear(year){return Number.isInteger(year)&&year>=1900&&year<=2100;}
function inspect(input){
 if(!record(input)||Object.keys(input).sort().join(',')!=='as_of_year,records,source_mode'
   ||input.source_mode!=='synthetic_fixture_only'||!wholeYear(input.as_of_year)
   ||!Array.isArray(input.records)||input.records.length>100)fail('Expect synthetic fixture only');
 const seen=new Set();
 for(const rec of input.records){
   if(!record(rec)||Object.keys(rec).sort().join(',')!=='signals,year'
     ||!wholeYear(rec.year)||rec.year>=input.as_of_year||seen.has(rec.year)
     ||!Array.isArray(rec.signals)||rec.signals.length===0||rec.signals.length>5)
     fail('Invalid or repeated past-year fixture');
   seen.add(rec.year);
   const rules=new Set();
   for(const sig of rec.signals){
     if(!record(sig)||Object.keys(sig).sort().join(',')!=='rule_id,source_ref'
       ||!Object.hasOwn(FIXTURE_RULES,sig.rule_id)||rules.has(sig.rule_id)
       ||typeof sig.source_ref!=='string'
       ||!/^fixture:[a-z0-9-]+$/.test(sig.source_ref))fail('Unknown, repeated or unsupported mock signal');
     rules.add(sig.rule_id);
   }
 }
}
function decorate(rec,now,preceding){
 const source=rec.signals.map(s=>({...s,...FIXTURE_RULES[s.rule_id]}));
 const counts=new Map();
 for(const s of source)counts.set(s.motif,(counts.get(s.motif)||0)+1);
 const ranked=[...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
 // Never invent a single motif from two equally represented thematic signals.
 const motif=ranked.length<2||ranked[0][1]>ranked[1][1]?ranked[0][0]:null;
 let score=source.some(s=>s.kind==='boundary')?5:0;
 if(source.length>=2)score+=3;
 const prevMotif=preceding?preceding.motif:null;
 if(motif&&prevMotif&&prevMotif!==motif&&rec.year-preceding.year<=5)score+=2;
 if(now-rec.year<=5)score+=1;
 return {
   year:rec.year,score,theme_id:motif,
   rule_ids:source.map(s=>s.rule_id).sort(),
   evidence:source.map(s=>s.source_ref).sort(),
   eligible:motif!==null&&score>0
 };
}
function relation(a,b){
 if(!a||!b)return 'single_or_none';
 if(a.theme_id===b.theme_id)return 'repeated_theme';
 if(TRANSITIONS.has(a.theme_id+'>'+b.theme_id))return 'defined_editorial_transition';
 return 'no_claimed_continuity';
}
/**
 * Build a blueprint but NEVER mark an analysis as audited. The rest of the app
 * must not present this as a verified real person's calendar reading.
 */
export function buildSyntheticStoryBlueprint(input){
 inspect(input);
 const ordered=input.records.toSorted((a,b)=>a.year-b.year);
 const decorated=[];
 let preceding=null;
 for(const rec of ordered){
   const item=decorate(rec,input.as_of_year,preceding);
   decorated.push(item);
   preceding=item;
 }
 const sorted=decorated.filter(x=>x.eligible)
   .toSorted((a,b)=>b.score-a.score || a.year-b.year);
 const picked=[];
 for(const anchor of sorted){
   if(picked.every(x=>Math.abs(x.year-anchor.year)>=3)){
     picked.push(anchor);
     if(picked.length===2)break;
   }
 }
 picked.sort((a,b)=>a.year-b.year);
 const anchors=picked.map(a=>({
   year:a.year,theme_id:a.theme_id,editorial_score:a.score,
   rule_ids:a.rule_ids,evidence_refs:a.evidence,
   motif:{
     title:MOTIF_SCENES[a.theme_id].title,
     tension:MOTIF_SCENES[a.theme_id].tension,
     example_scenes:[...MOTIF_SCENES[a.theme_id].examples]
   }
 }));
 return {
   version:SELECTOR_VERSION,
   status:picked.length?'synthetic_preview_only':'insufficient_fixture_signals',
   production_usable:false,calendar_audit:'not_performed',
   premise:'架空の暦シグナルによる文章構成の試作。実際の生年月日から選ばれた年ではありません。',
   as_of_year:input.as_of_year,
   anchors,
   bridge:relation(picked[0],picked[1]),
   disclaimer:'この年月やテーマは人物の過去の出来事・暦の当たり外れを示しません。'
 };
}
