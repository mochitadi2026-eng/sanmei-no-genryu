import test from 'node:test';
import assert from 'node:assert/strict';
import m02 from '../m02-core-symbols-v0.1.json' with {type:'json'};
import catalog from '../b04-birth-mochi-catalog-v0.1.json' with {type:'json'};
import {readBirthMochi,B05_VERSION} from '../b05-birth-mochi-presenter-v0.1.mjs';
const at=civil_date=>readBirthMochi({calendar:'Gregorian',country:'JP',civil_date},{m02,catalog});
test('B04 has 12 distinct familiar mochi and five creative elements',()=>{
 assert.equal(catalog.characters.length,12);
 assert.equal(catalog.elements.length,5);
 assert.equal(new Set(catalog.characters.map(x=>x.name)).size,12);
 assert.deepEqual(catalog.characters.map(x=>x.branch),[...'子丑寅卯辰巳午未申酉戌亥']);
 assert.deepEqual(catalog.elements.map(x=>x.name),[...'木火土金水']);
 for(const c of catalog.characters){
  assert.ok(c.real_feature&&c.character_scene&&c.comic_weakness&&c.reflection_question);
 }
});
test('M06-audited B03 real civil-day symbols map to proposed mochi',()=>{
 const a=at('1987-04-25');
 assert.equal(a.day_ganzhi,'甲辰');
 assert.equal(a.character_id,'BC05');
 assert.equal(a.character.name,'草餅');
 assert.equal(a.element_id,'EL_WOOD');
 assert.equal(a.display_title,'木の草餅');
 const b=at('2026-10-17');
 assert.equal(b.day_ganzhi,'甲子');
 assert.equal(b.character.name,'いちご大福');
 assert.equal(b.element.name,'木');
});
test('all 60 days produce exactly 12 mochi times five elements',()=>{
 const combos=new Set(),counts={};
 for(let i=0;i<60;i++){
  const d=new Date(Date.UTC(2026,9,17)+i*86400000).toISOString().slice(0,10);
  const r=at(d);
  assert.equal(r.status,'development_preview');
  assert.equal(r.version,B05_VERSION);
  assert.equal(r.production_usable,false);
  assert.equal(r.birth_date_retained,false);
  assert.equal(r.external_requests,false);
  assert.equal(r.personality_test,false);
  assert.ok(r.story.includes(r.element.narrative));
  const k=r.character_id+'/'+r.element_id;
  assert.equal(combos.has(k),false);
  combos.add(k);
  counts[r.character_id]=(counts[r.character_id]||0)+1;
 }
 assert.equal(combos.size,60);
 assert.equal(Object.keys(counts).length,12);
 assert.ok(Object.values(counts).every(v=>v===5));
});
test('different years with equal day pillar give stable characters',()=>{
 const x=at('2026-10-17');
 const y=at('2026-12-16');
 assert.equal(x.day_ganzhi,y.day_ganzhi);
 assert.equal(x.character_id,y.character_id);
 assert.equal(x.element_id,y.element_id);
});
test('invalid, non-JP, birth time and names are not silently accepted',()=>{
 for(const input of [
  {calendar:'Gregorian',country:'US',civil_date:'2026-10-17'},
  {calendar:'Gregorian',country:'JP',civil_date:'2026-02-30'},
  {calendar:'Gregorian',country:'JP',civil_date:'2026-10-17',name:'private'},
  {calendar:'Gregorian',country:'JP',civil_date:'2026-10-17',birth_time:'23:30'}
 ])assert.throws(()=>readBirthMochi(input,{m02,catalog}));
});
test('unsupported years return a non-character status',()=>{
 for(const d of ['1899-12-31','2028-01-01']){
  const r=at(d);
  assert.equal(r.status,'unsupported');
  assert.equal(Object.hasOwn(r,'character'),false);
  assert.equal(r.production_usable,false);
 }
});
test('version mismatch does not silently create a type',()=>{
 const bad=structuredClone(catalog);bad.version='obsolete';
 assert.throws(()=>readBirthMochi({calendar:'Gregorian',country:'JP',civil_date:'1987-04-25'},{m02,catalog:bad}));
});
