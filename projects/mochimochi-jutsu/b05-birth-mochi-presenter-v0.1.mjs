import {B03_RULE_VERSION,resolveBirthCharacterForDevelopment} from './b03-adopted-birth-character-rule-v1.mjs';
export const B05_VERSION='b05-mochi-v0.1';
export function readBirthMochi(input,{m02,catalog}={}){
 if(catalog?.version!=='b04-birth-mochi-catalog-v0.1'||catalog.rule_version!==B03_RULE_VERSION
  ||catalog.characters?.length!==12||catalog.elements?.length!==5)
  throw new TypeError('B04 catalog mismatch');
 const fixed=resolveBirthCharacterForDevelopment(input,m02);
 if(fixed.status==='unsupported')return {status:'unsupported',reason:fixed.reason,production_usable:false};
 const character=catalog.characters.find(x=>x.id===fixed.character_id&&x.branch===fixed.character_branch);
 const element=catalog.elements.find(x=>x.id===fixed.element_id&&x.name===fixed.element);
 if(!character||!element)throw new TypeError('Birth calendar and character catalog mismatch');
 const manualKeys=['mochi_flavor','best_setting','handling_caution','handling_manual'];
 if(catalog.editorial_revision!=='b04-mochi-manual-v0.2'
   ||catalog.characters.some(x=>manualKeys.some(k=>typeof x[k]!=='string'||!x[k].trim())))
   throw new TypeError('Mochi manual is incomplete');
 return {status:'development_preview',version:B05_VERSION,rule_version:B03_RULE_VERSION,
  day_ganzhi:fixed.day_ganzhi,character_id:character.id,element_id:element.id,
  character,element,display_title:element.name+'の'+character.name,
  story:character.character_scene+'。'+element.narrative,question:character.reflection_question,
  birth_date_retained:false,external_requests:false,personality_test:false,production_usable:false,
  notice:'日本の暦日を使う独自の創作キャラ診断です。性格や将来の的中を保証しません。'};
}