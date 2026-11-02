/**
 * M10: educational catalog projection, never personal character assignment.
 * No data collection, horoscope inference, scoring, time or network.
 */
export const GALLERY_VERSION = 'm10-gallery-v0.1';
const FAMILIES = Object.freeze(['ten_main_star','twelve_follower_star']);
const ids = Object.freeze({ten_main_star:'MS',twelve_follower_star:'FS'});
function error(code,detail){const e=new TypeError(detail);e.code=code;throw e;}
function plain(x){return x!==null&&typeof x==='object'&&!Array.isArray(x)}
function allUnique(a){return new Set(a).size===a.length;}
/** Structural checks against actual M02 source before presenting learned symbols. */
export function validateCharacterCatalog(catalog,sourceM02){
 if(!plain(catalog)||!plain(sourceM02)||catalog.catalog_version!=='m10-character-catalog-v0.1'
    ||sourceM02.version!=='0.1'||catalog.source_m02_version!==sourceM02.version)
    error('M10_CATALOG_INVALID','M10 or M02 version is unsupported');
 const collections=[
   ['ten_main_star',sourceM02.ten_star_relations,10,3,4],
   ['twelve_follower_star',sourceM02.twelve_stages,12,1,2]
 ];
 const names=new Set();
 for(const [family,source,expected,starIdx,charIdx] of collections){
   const entries=catalog[family];
   if(!Array.isArray(entries)||entries.length!==expected
     ||!Array.isArray(source)||source.length!==expected
     ||!allUnique(entries.map(e=>e?.id)))error('M10_CATALOG_INVALID','Wrong family sizes or duplicate IDs: '+family);
   entries.forEach((entry,i)=>{
     if(!plain(entry)||entry.category!==family||
       entry.id!==ids[family]+String(i+1).padStart(2,'0')||
       entry.star_name!==source[i][starIdx]||
       entry.character_name!==source[i][charIdx]||
       entry.source?.section!==(family==='ten_main_star'?'ten_star_relations':'twelve_stages')||
       entry.source?.index!==i||
       entry.visual?.asset_path!==null||
       entry.visual?.asset_status!=='unverified_no_asset_claim'||
       typeof entry.visual?.alt_text!=='string'||!entry.visual.alt_text.trim()||
       entry.role!=='learning_or_story_guide_only'||
       entry.assignable_from_m08!==false||
       entry.assignable_from_birth_engine!==false
     )error('M10_CATALOG_INVALID','Invalid or misassigned educational card: '+family+' '+i);
     if(names.has(entry.character_name))error('M10_CATALOG_INVALID','Character name reused in two roles');
     names.add(entry.character_name);
     if(family==='twelve_follower_star'){
       if(entry.stage_name!==source[i][0]||
         typeof entry.art_direction?.item!=='string'||
         !entry.art_direction.item.trim()||
         typeof entry.art_direction?.palette!=='string')
         error('M10_CATALOG_INVALID','Missing follower stage or original props');
     }
   });
 }
 if(catalog.adoption_rules?.five_question_type_mapping!=='none_by_design'
   ||catalog.presentation?.show_personalized_cards!==false
   ||catalog.presentation?.default_mode!=='manual_learning_gallery'
   ||typeof catalog.presentation?.message!=='string'
   ||!catalog.presentation.message.trim())
   error('M10_CATALOG_INVALID','Personalized mapping must stay disabled');
 return true;
}
/**
 * Build cards for a voluntary gallery visit. No scores, birth, diagnosis,
 * selected personal stars, or MTxx correspondence inputs.
 */
export function buildCharacterGallery({catalog,sourceM02,family='all'}={}){
 validateCharacterCatalog(catalog,sourceM02);
 if(!['all',...FAMILIES].includes(family))
   error('M10_INPUT_INVALID','Unknown family filter');
 const entries=family==='all'
   ?[...catalog.ten_main_star,...catalog.twelve_follower_star]
   :catalog[family];
 const cards=entries.map(e=>({
    id:e.id,family:e.category,
    name:e.character_name,star_name:e.star_name,
    stage_name:e.category==='twelve_follower_star'?e.stage_name:null,
    prop:e.category==='twelve_follower_star'?e.art_direction.item:null,
    image:null,alt_text:e.visual.alt_text,
    role:'learning_or_story_guide_only'
 }));
 return {
    version:GALLERY_VERSION,
    status:'educational_only',
    introductory_note:catalog.presentation.message,
    cards
 };
}
