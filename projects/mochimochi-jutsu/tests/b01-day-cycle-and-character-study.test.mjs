import test from 'node:test';
import assert from 'node:assert/strict';
import m02 from '../m02-core-symbols-v0.1.json' with {type:'json'};
import {
 B01_VERSION,DAY_ANCHOR,getSixtyCycleTable,auditCivilDayGanzhi,
 proposeCharacterFromSymbol
} from '../b01-day-cycle-and-character-study-v0.1.mjs';
const propose=symbol=>proposeCharacterFromSymbol({mode:'anonymous_symbol_study',symbol},m02);
test('all 60 canonical ganzhi are unique; each branch has 5 and each element has 12',()=>{
 const entries=getSixtyCycleTable(m02);
 assert.equal(entries.length,60);
 assert.equal(new Set(entries.map(x=>x.ganzhi)).size,60);
 assert.equal(entries[0].ganzhi,'甲子');
 assert.equal(entries[59].ganzhi,'癸亥');
 for(const b of m02.branches)assert.equal(entries.filter(x=>x.branch===b).length,5);
 for(const el of m02.elements)assert.equal(entries.filter(x=>x.element===el).length,12);
 for(const x of entries){
   assert.equal(x.branch_index,x.cycle_index%12);
   assert.equal(x.stem_index,x.cycle_index%10);
   assert.equal((x.stem_index%2),(x.branch_index%2));
 }
});
test('independent public-date fixtures match calendar symbols, including leap day',()=>{
 const examples=[
   {date:'2000-01-01',expected:'戊午',source:'https://www.calend.jp/2000/01/01'},
   {date:'2024-02-29',expected:'癸亥',source:'https://www.calc-site.com/search_dates/2/29/2024'},
   {date:'2026-10-17',expected:'甲子',source:'https://www.calend.jp/2026/10/17'},
   {date:'2026-11-03',expected:'辛巳',source:'https://www.calc-site.com/search_dates/11/3/2026'}
 ];
 assert.equal(DAY_ANCHOR.ganzhi,'甲子');
 for(const x of examples){
  assert.ok(x.source.startsWith('https://'));
  const result=auditCivilDayGanzhi(x.date,m02);
  assert.equal(result.day_pillar,x.expected,x.date);
  assert.equal(result.not_a_verified_birth_character,true);
  assert.equal(result.status,'audit_reference_only');
  assert.equal(result.version,B01_VERSION);
 }
});
test('dates before and after the anchor, and a full 60-day loop',()=>{
 const base=auditCivilDayGanzhi('2026-10-17',m02);
 assert.equal(base.cycle_index,0);
 assert.equal(auditCivilDayGanzhi('2026-10-16',m02).day_pillar,'癸亥');
 assert.equal(auditCivilDayGanzhi('2026-10-18',m02).day_pillar,'乙丑');
 assert.equal(auditCivilDayGanzhi('2026-12-16',m02).day_pillar,'甲子');
 assert.equal(auditCivilDayGanzhi('2026-11-03',m02).cycle_index,17);
});
test('invalid Gregorian dates, unsupported eras and time data fail shut',()=>{
 for(const str of [
  '2024-02-30','2023-02-29','1900-02-29','2024-13-01',
  '2024-00-20','2024-01-00','2026-1-1','1899-12-31',
  '2100-01-01','2026-10-17T12:00:00+09:00','2026/10/17',''
 ])assert.throws(()=>auditCivilDayGanzhi(str,m02),{code:'B01_INVALID_INPUT'});
});
test('exact 12 identity slots x 5 variants, without collision with questionnaire MT or spirit catalog',()=>{
 const items=getSixtyCycleTable(m02).map(e=>propose(e.ganzhi));
 assert.equal(items.length,60);
 assert.equal(new Set(items.map(i=>i.proposed_character_id)).size,12);
 assert.equal(new Set(items.map(i=>i.proposed_variant_id)).size,5);
 assert.equal(new Set(items.map(i=>i.proposed_character_id+':'+i.proposed_variant_id)).size,60);
 for(let j=1;j<=12;j++){
  const id='BC'+String(j).padStart(2,'0');
  assert.equal(items.filter(i=>i.proposed_character_id===id).length,5);
 }
 for(const item of items){
  assert.equal(item.production_usable,false);
  assert.equal(item.fixed_character_rule_adopted,false);
  assert.equal(item.personal_traits_inferred,false);
  assert.equal(item.character_name,null);
  assert.equal(item.artwork,null);
  assert.ok(!item.proposed_character_id.startsWith('MT'));
 }
});
test('sample mappings are structural, not personal character judgments',()=>{
 assert.deepEqual(
  ['甲子','丙子','戊子','庚子','壬子'].map(s=>propose(s).proposed_character_id),
  ['BC01','BC01','BC01','BC01','BC01']
 );
 assert.deepEqual(
  ['甲子','丙子','戊子','庚子','壬子'].map(s=>propose(s).proposed_variant_element),
  ['木','火','土','金','水']
 );
 assert.equal(propose('乙丑').proposed_character_id,'BC02');
 assert.equal(propose('戊辰').proposed_character_id,'BC05');
 assert.equal(propose('辛巳').proposed_character_id,'BC06');
 assert.equal(propose('辛巳').proposed_variant_element,'金');
});
test('reject invalid combinations and DOB/actual natal records',()=>{
 for(const input of [
  {mode:'anonymous_symbol_study',symbol:'甲丑'},
  {mode:'anonymous_symbol_study',symbol:'丙寅',birthDate:'1999-05-01'},
  {mode:'verified_natal',symbol:'甲子'},
  {mode:'anonymous_symbol_study',symbol:'甲子',userAnswers:['x']},
  {mode:'anonymous_symbol_study',symbol:'MT01'},
  {mode:'anonymous_symbol_study',symbol:''},
  {mode:'anonymous_symbol_study'},
  {}
 ])assert.throws(()=>proposeCharacterFromSymbol(input,m02),{code:'B01_INVALID_INPUT'});
});
test('reject tampered M02 source dictionary and do not mutate inputs',()=>{
 const forged=structuredClone(m02);forged.branches[0]='狐';
 assert.throws(()=>getSixtyCycleTable(forged),{code:'B01_INVALID_INPUT'});
 const wrong=structuredClone(m02);wrong.stems[0][1]='火';
 assert.throws(()=>auditCivilDayGanzhi('2026-10-17',wrong),{code:'B01_INVALID_INPUT'});
 const before=JSON.stringify(m02);
 const a=propose('甲子'),b=propose('甲子');
 assert.deepEqual(a,b);
 assert.equal(JSON.stringify(m02),before);
});
