import test from 'node:test';
import assert from 'node:assert/strict';
import m02 from '../m02-core-symbols-v0.1.json' with {type:'json'};
import {B03_POLICY,B03_POLICY_VERSION,previewFixedCharacter}
  from '../b03-civil-date-character-candidate-v0.1.mjs';
const preview=civil_date=>previewFixedCharacter({civil_date,country:'JP',calendar:'Gregorian'},m02);

test('2026-10-26 civil JP date maps to 癸酉 / BC10 + WATER, not next date',()=>{
 const out=preview('2026-10-26');
 assert.equal(out.status,'candidate_preview_only');
 assert.equal(out.version,B03_POLICY_VERSION);
 assert.equal(out.day_symbol,'癸酉');
 assert.equal(out.character_slot,'BC10');
 assert.equal(out.character_branch,'酉');
 assert.equal(out.variant_element,'水');
 assert.equal(out.variant_id,'EL_WATER');
 assert.equal(out.date_boundary,'00:00_CIVIL_JP');
 assert.equal(out.fixed_character_certified,false);
 assert.equal(out.production_usable,false);
 assert.equal(out.retained_input,false);
});
test('midnight following civil date changes branch and element independently',()=>{
 const a=preview('2026-10-26');
 const b=preview('2026-10-27');
 assert.equal(b.day_symbol,'甲戌');
 assert.equal(b.character_slot,'BC11');
 assert.equal(b.variant_element,'木');
 assert.notEqual(a.character_slot,b.character_slot);
 assert.notEqual(a.variant_id,b.variant_id);
});
test('all 60 successive days map to exact 12 x 5 unique combinations',()=>{
 const seen=new Set(),slotCounts=new Map(),elemCounts=new Map();
 const start=Date.UTC(2026,9,17);
 for(let i=0;i<60;i++){
  const d=new Date(start+i*86400000).toISOString().slice(0,10);
  const x=preview(d),k=x.character_slot+'-'+x.variant_id;
  assert.equal(x.status,'candidate_preview_only');
  assert.ok(!seen.has(k),k);
  seen.add(k);
  slotCounts.set(x.character_slot,(slotCounts.get(x.character_slot)||0)+1);
  elemCounts.set(x.variant_id,(elemCounts.get(x.variant_id)||0)+1);
 }
 assert.equal(seen.size,60);
 assert.equal(slotCounts.size,12);
 assert.equal(elemCounts.size,5);
 assert.ok([...slotCounts.values()].every(v=>v===5));
 assert.ok([...elemCounts.values()].every(v=>v===12));
});
test('same date always same label and does not change with repeated reading',()=>{
 const r=preview('2000-01-01');
 assert.equal(r.day_symbol,'戊午');
 assert.equal(r.character_slot,'BC07');
 assert.equal(r.variant_id,'EL_EARTH');
 assert.deepEqual(r,preview('2000-01-01'));
});
test('time, timezone, answers and personal events cannot alter a character through this API',()=>{
 const base={civil_date:'2026-10-26',country:'JP',calendar:'Gregorian'};
 for(const extra of [
  {birth_time:'23:30'}, {birthTime:'00:20'}, {timezone:'Asia/Tokyo'},
  {questionnaire_answers:[1,2,3,4,5]}, {life_events:['moved']},
  {gender:'male'}, {location:'Tokyo'}, {name:'test'},
  {override_day_symbol:'甲戌'}
 ]){
  assert.throws(()=>previewFixedCharacter({...base,...extra},m02),{code:'B03_INVALID_INPUT'});
 }
});
test('unsupported country and calendar must be rejected; no silent timezone conversions',()=>{
 for(const extra of [
  {country:'US'}, {calendar:'Julian'}, {country:null},
  {calendar:null}, {civil_date:null}, {country:''}
 ]){
  const x={civil_date:'2026-10-26',country:'JP',calendar:'Gregorian',...extra};
  assert.throws(()=>previewFixedCharacter(x,m02),{code:'B03_INVALID_INPUT'});
 }
});
test('out of M06 range is unsupported; bad Gregorian calendar dates throw',()=>{
 for(const date of ['1899-12-31','2028-01-01','2099-12-31']){
  const r=preview(date);
  assert.equal(r.status,'unsupported');
  assert.equal(r.production_usable,false);
  assert.equal(Object.hasOwn(r,'character_slot'),false);
 }
 for(const d of ['1900-02-29','2026-02-29','2024-02-30','2024-13-01','2024/01/01']){
  assert.throws(()=>preview(d),{code:'B01_INVALID_INPUT'});
 }
});
test('1948-1951 date labels do not imply precise birth-clock correction for M06',()=>{
 const x=preview('1950-07-20');
 assert.equal(x.day_symbol,'丙辰');
 assert.equal(x.chart_m06_approved,false);
 assert.equal(x.status,'candidate_preview_only');
 assert.equal(x.external_requests,false);
});
test('rule remains explicitly proposed and not certified by any Sanmei school',()=>{
 assert.equal(B03_POLICY.standard_sanmei_day_boundary_claim,false);
 assert.equal(B03_POLICY.method_is_school_certified,false);
 assert.equal(B03_POLICY.production_usable,false);
 const x=preview('2026-10-26');
 assert.equal(x.original_method,true);
 assert.equal(x.retained_input,false);
 assert.equal(Object.hasOwn(x,'birth_date'),false);
 assert.equal(Object.hasOwn(x,'birth_time'),false);
});
