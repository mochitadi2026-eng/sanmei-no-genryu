import test from 'node:test';
import assert from 'node:assert/strict';
import m02 from '../m02-core-symbols-v0.1.json' with {type:'json'};
import {B03_RULE_VERSION,B03_ADOPTED_RULE,resolveBirthCharacterForDevelopment}
  from '../b03-adopted-birth-character-rule-v1.mjs';
const at=d=>resolveBirthCharacterForDevelopment({calendar:'Gregorian',country:'JP',civil_date:d},m02);

test('B03 midnight rule is adopted for original mochi identities, not as school doctrine',()=>{
 assert.equal(B03_ADOPTED_RULE.status,'adopted_original_character_convention');
 assert.equal(B03_ADOPTED_RULE.change_of_day,'00:00_civil_date');
 assert.equal(B03_ADOPTED_RULE.time_of_birth_used,false);
 assert.equal(B03_ADOPTED_RULE.endorsed_by_traditional_school,false);
 assert.equal(B03_ADOPTED_RULE.public_release_approved,false);
 assert.equal(B03_RULE_VERSION,B03_ADOPTED_RULE.version);
});
test('date 2026-10-26 uses 癸酉 all day; date 2026-10-27 uses 甲戌',()=>{
 const a=at('2026-10-26'),b=at('2026-10-27');
 assert.equal(a.day_ganzhi,'癸酉');
 assert.equal(a.character_id,'BC10');
 assert.equal(a.element,'水');
 assert.equal(b.day_ganzhi,'甲戌');
 assert.equal(b.character_id,'BC11');
 assert.equal(b.element,'木');
 assert.equal(a.day_boundary,'00:00_civil_JP');
});
test('adoption does not imply public release, personality inference or M06 approval',()=>{
 const r=at('2026-10-17');
 assert.equal(r.status,'development_preview');
 assert.equal(r.rule_status,'adopted_original_character_convention');
 assert.equal(r.production_usable,false);
 assert.equal(r.published_character_assigned,false);
 assert.equal(r.m06_natal_chart_approved,false);
 assert.equal(r.school_equivalence_claimed,false);
 assert.equal(r.personal_traits_inferred,false);
 assert.equal(r.input_retained,false);
 assert.equal(Object.hasOwn(r,'birth_date'),false);
});
test('anonymous 60-day full cycle has unique 12 x 5 correspondence',()=>{
 const combos=new Set(),counts={};
 for(let i=0;i<60;i++){
   const day=new Date(Date.UTC(2026,9,17)+i*86400000).toISOString().slice(0,10);
   const r=at(day);
   const k=r.character_id+':'+r.element_id;
   assert.ok(!combos.has(k),k);
   combos.add(k);
   counts[r.character_id]=(counts[r.character_id]||0)+1;
 }
 assert.equal(combos.size,60);
 assert.equal(Object.keys(counts).length,12);
 assert.ok(Object.values(counts).every(x=>x===5));
});
test('restricted input is not broadened; no birth time, gender, answers or forced override',()=>{
 const base={civil_date:'2026-10-26',country:'JP',calendar:'Gregorian'};
 for(const extra of [
   {birth_time:'23:30'},{gender:'female'},{timezone:'UTC'},
   {day_override:'甲戌'},{answers:[1,2,3]},{city:'Osaka'},
   {name:'a'}
 ]){
   assert.throws(()=>resolveBirthCharacterForDevelopment({...base,...extra},m02),{code:'B03_INVALID_INPUT'});
 }
});
test('external/non-Japan birth and out of range do not silently receive a fixed character',()=>{
 assert.throws(()=>resolveBirthCharacterForDevelopment({calendar:'Gregorian',country:'US',civil_date:'2026-10-26'},m02),{code:'B03_INVALID_INPUT'});
 const r=at('2028-01-01');
 assert.equal(r.status,'unsupported');
 assert.equal(Object.hasOwn(r,'character_id'),false);
 assert.equal(r.input_retained,false);
});
test('birth-character adoption does not alter year/month solar-term policy',()=>{
 assert.ok(B03_ADOPTED_RULE.excludes.includes('monthly_solar_term_boundaries'));
 assert.ok(B03_ADOPTED_RULE.excludes.includes('yearly_risshun_boundaries'));
 assert.equal(B03_ADOPTED_RULE.birth_chart_m06_integration,false);
});
