/**
 * M09 copy presenter for M08 results.
 * Dev-only, data-driven, deterministic; no IO, network, time, analytics or PII.
 * Does not calculate a natal chart or diagnose personal traits.
 */
import { classifyAnswers, ALGORITHM_VERSION } from './m08-classifier-v0.1.mjs';
export const PRESENTER_VERSION = 'mochimochi-result-presenter-v0.1';
const THEMES=['MOCHI','KETSU','NUKI','NEBA','YURA','EN'];
const TYPE_IDS=Array.from({length:12},(_,i)=>'MT'+String(i+1).padStart(2,'0'));
const PHASE_IDS=Array.from({length:5},(_,i)=>'FP'+String(i+1).padStart(2,'0'));
const Q_IDS=['Q1','Q2','Q3','Q4','Q5'];
const VER=['question_set_id','question_version','tag_mapping_version','type_catalog_version','algorithm_version'];
const COMPLETE_FIELDS=[
  'status','type_status','type_reason','primary_theme','candidate_themes',
  'expression_mode','mochi_type_id','phase_id','phase_status',...VER
];
const INCOMPLETE_FIELDS=['status','reason','missing_questions',...VER];
function fail(code,message){const e=new TypeError(message);e.code=code;throw e;}
function record(x){return !!x && typeof x==='object' && !Array.isArray(x)
  && (Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);}
function checkKeys(x,fields,name){
  if(!record(x)||Object.keys(x).some(k=>!fields.includes(k))
    ||fields.some(k=>!Object.hasOwn(x,k)))fail('RESULT_INVALID',name+' does not match the M08 contract');
}
function unique(items){return new Set(items).size===items.length;}
function nonblank(x){return typeof x==='string'&&x.trim().length>0;}
function versionKeys(copy,typeCatalog,indicatorCatalog){
  return {
    question_set_id:copy.related.question_set_id,
    question_version:copy.related.question_version,
    tag_mapping_version:copy.related.tag_mapping_version,
    type_catalog_version:typeCatalog.version,
    algorithm_version:ALGORITHM_VERSION
  };
}
/** Validate all copy IDs against original M03/M04 catalogs; do not duplicate labels. */
export function validateResultCatalogs(copy,typeCatalog,indicatorCatalog){
  if(!record(copy)||!record(typeCatalog)||!record(indicatorCatalog)
    ||!record(copy.related)||copy.version!=='m09-copy-v0.1'
    ||copy.related.indicator_catalog_version!==indicatorCatalog.version
    ||copy.related.type_catalog_version!==typeCatalog.version
    ||copy.related.algorithm_version!==ALGORITHM_VERSION
    ||copy.related.question_set_id!=='mochimochi-five-v0.1'
    ||copy.related.question_version!=='m07-questions-v0.1'
    ||copy.related.tag_mapping_version!=='m07-tags-v0.1') {
    fail('COPY_CATALOG_INVALID','The presenter copy and source catalog versions must match');
  }
  const arrays=[
    [copy.themes,THEMES,indicatorCatalog.indicators,'theme','focus'],
    [copy.types,TYPE_IDS,typeCatalog.types,'type','reflection'],
    [copy.phases,PHASE_IDS,typeCatalog.phases,'phase','reflection']
  ];
  for(const [arr,ids,source,kind,bodyKey] of arrays){
    if(!Array.isArray(arr)||!Array.isArray(source)||arr.length!==ids.length
      ||source.length!==ids.length||!unique(arr.map(e=>e?.id))
      ||!unique(source.map(e=>e?.id))
      ||arr.some((e,i)=>!record(e)||e.id!==ids[i]||!nonblank(e[bodyKey]))
      ||source.some((e,i)=>!record(e)||e.id!==ids[i]||!nonblank(e.label))){
      fail('COPY_CATALOG_INVALID','Invalid '+kind+' data or changed identity/order');
    }
  }
  if(copy.types.some(e=>!nonblank(e.optional_question))
    ||copy.phases.some(e=>!nonblank(e.optional_question))
    ||!record(copy.header)||!record(copy.layers)||!record(copy.fallbacks)
    ||!record(copy.layers.shitsu)||!record(copy.layers.guai)||!record(copy.layers.michi)
    ||!nonblank(copy.header.title)||!nonblank(copy.header.intro)
    ||!nonblank(copy.footer)
    ||Object.entries(copy.fallbacks).some(([k,v])=>['incomplete','invalid'].includes(k)
      ?!record(v)||!nonblank(v.title)||!nonblank(v.body):!nonblank(v))
    ||!nonblank(copy.layers.shitsu.body)||!nonblank(copy.layers.shitsu.title)
    ||!nonblank(copy.layers.guai.title)||!nonblank(copy.layers.michi.title)
    ||!nonblank(copy.layers.michi.intro)){
    fail('COPY_CATALOG_INVALID','Missing result copy or optional question');
  }
  for(const t of typeCatalog.types){
    if(!THEMES.includes(t.theme)||!['open','settle'].includes(t.mode))
      fail('COPY_CATALOG_INVALID','Type mapping changed');
  }
  return true;
}
function outputError(copy,code){
  return {
    status:'input_error',
    presenter_version:PRESENTER_VERSION,
    reason:code,
    screen:{title:copy.fallbacks.invalid.title,body:copy.fallbacks.invalid.body}
  };
}
function checkM08(result,v,typeCatalog){
  if(!record(result))fail('RESULT_INVALID','Expected M08 result');
  if(result.status==='incomplete'){
    checkKeys(result,INCOMPLETE_FIELDS,'incomplete');
    if(result.reason!=='MISSING_ANSWER'
      ||!Array.isArray(result.missing_questions)
      ||!result.missing_questions.length
      ||!unique(result.missing_questions)
      ||result.missing_questions.some(id=>!Q_IDS.includes(id))
      ||result.missing_questions.map(id=>Q_IDS.indexOf(id)).some((n,i,a)=>i&&n<=a[i-1]))
      fail('RESULT_INVALID','Invalid missing question set');
  }else if(result.status==='resolved'){
    checkKeys(result,COMPLETE_FIELDS,'resolved');
    if(!['classified','undetermined'].includes(result.type_status)
      ||(result.primary_theme!==null&&!THEMES.includes(result.primary_theme))
      ||!Array.isArray(result.candidate_themes)
      ||!unique(result.candidate_themes)
      ||result.candidate_themes.some(id=>!THEMES.includes(id))
      ||result.candidate_themes.some((id,i,a)=>i&&THEMES.indexOf(id)<=THEMES.indexOf(a[i-1]))
      ||(result.expression_mode!==null&&!['open','settle'].includes(result.expression_mode))
      ||(result.phase_id!==null&&!PHASE_IDS.includes(result.phase_id))
      ||result.phase_status!==(result.phase_id===null?'unselected':'selected')){
      fail('RESULT_INVALID','Invalid M08 result values');
    }
    const validTheme=result.primary_theme!==null
      &&result.candidate_themes.includes(result.primary_theme);
    if(result.primary_theme!==null&&!validTheme)
      fail('RESULT_INVALID','Selected primary theme is absent from candidates');
    const match=validTheme&&result.expression_mode!==null
      ?typeCatalog.types.find(t=>t.theme===result.primary_theme && t.mode===result.expression_mode)
      :null;
    if(match){
      if(result.mochi_type_id!==match.id||result.type_status!=='classified'||result.type_reason!==null)
        fail('RESULT_INVALID','M08 classified type and result mismatch');
    }else{
      const reason=result.primary_theme===null?'NO_CORROBORATED_THEME':'MODE_NOT_SELECTED';
      if(result.mochi_type_id!==null||result.type_status!=='undetermined'||result.type_reason!==reason)
        fail('RESULT_INVALID','M08 undetermined reason mismatch');
    }
  }else fail('RESULT_INVALID','Unknown M08 result status');
  for(const [k,value] of Object.entries(v)){
    if(result[k]!==value)fail('RESULT_VERSION_MISMATCH','Result version mismatch: '+k);
  }
}
/**
 * Convert an already validated M08 result to display sections.
 * Returns no birth-derived content. Sections are suitable for M11 UI use.
 */
export function presentClassification(result,{copyCatalog,typeCatalog,indicatorCatalog}={}){
  validateResultCatalogs(copyCatalog,typeCatalog,indicatorCatalog);
  const v=versionKeys(copyCatalog,typeCatalog,indicatorCatalog);
  checkM08(result,v,typeCatalog);
  if(result.status==='incomplete'){
    return {status:'incomplete',presenter_version:PRESENTER_VERSION,
      screen:{...copyCatalog.fallbacks.incomplete,missing_questions:[...result.missing_questions]}};
  }
  const copy=copyCatalog;
  const type=result.mochi_type_id===null?null:typeCatalog.types.find(t=>t.id===result.mochi_type_id);
  const typeText=type?copy.types.find(t=>t.id===type.id):null;
  const phase=result.phase_id===null?null:typeCatalog.phases.find(p=>p.id===result.phase_id);
  const phaseText=phase?copy.phases.find(p=>p.id===phase.id):null;
  const selectedThemes=result.candidate_themes.map(id=>{
    const indicator=indicatorCatalog.indicators.find(i=>i.id===id);
    const brief=copy.themes.find(t=>t.id===id);
    return {id,label:indicator.label,focus:brief.focus};
  });
  const fallback=!type
    ?result.type_reason==='MODE_NOT_SELECTED'?copy.fallbacks.no_mode
      :selectedThemes.length?copy.fallbacks.no_theme:copy.fallbacks.no_candidates
    :null;
  // Give an accessible reflection even when no personality-like type is assigned.
  const question=phaseText?.optional_question
    ||typeText?.optional_question||copy.fallbacks.generic_question;
  return {
    status:'ready',
    presenter_version:PRESENTER_VERSION,
    source_versions:{...v},
    title:copy.header.title,
    intro:copy.header.intro,
    sections:[
      {id:'mochi_shitsu',title:copy.layers.shitsu.title,status:'not_connected',
        paragraphs:[copy.layers.shitsu.body]},
      {id:'mochi_guai',title:copy.layers.guai.title,status:type?'type_candidate':'open_reflection',
        type:type?{id:type.id,label:type.label,
          reflection:typeText.reflection,caution:copy.layers.guai.type_caution}:null,
        type_heading:type?copy.layers.guai.type_title:copy.layers.guai.type_unknown_title,
        paragraphs:fallback?[fallback]:[],
        selected_themes_heading:copy.layers.guai.theme_title,
        selected_themes:selectedThemes,
        phase_heading:copy.layers.guai.phase_title,
        phase:phase?{id:phase.id,label:phase.label,reflection:phaseText.reflection}:null,
        phase_fallback:phase?null:copy.fallbacks.no_phase},
      {id:'mochi_michi',title:copy.layers.michi.title,status:'optional',
        paragraphs:[copy.layers.michi.intro],
        optional_question:question}
    ],
    footer:copy.footer
  };
}
/**
 * User input convenience wrapper: call the real M08 engine first.
 * Unsupported catalogs remain developer errors; no fabricated result.
 */
export function presentAnswers(input,{questionBank,typeCatalog,indicatorCatalog,copyCatalog}={}){
  validateResultCatalogs(copyCatalog,typeCatalog,indicatorCatalog);
  let result;
  try{
    result=classifyAnswers(input,{questionBank,typeCatalog});
  }catch(e){
    if(e?.code==='INVALID_INPUT'||e?.code==='VERSION_MISMATCH'){
      return outputError(copyCatalog,e.code);
    }
    throw e;
  }
  return presentClassification(result,{copyCatalog,typeCatalog,indicatorCatalog});
}
