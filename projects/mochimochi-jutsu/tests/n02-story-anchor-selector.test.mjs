import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSyntheticStoryBlueprint,FIXTURE_RULES,SELECTOR_VERSION}
  from '../n02-story-anchor-selector-v0.1.mjs';
const signal=(rule_id, suffix='ref')=>({rule_id,source_ref:'fixture:'+suffix});
const year=(y,...rules)=>({year:y,signals:rules.map((rule,i)=>signal(rule,'signal-'+y+'-'+i))});
const demo=()=>({
 source_mode:'synthetic_fixture_only',as_of_year:2026,
 records:[
  year(2024,'FX_CONSOLIDATE'),
  year(2020,'FX_EXPERIMENT','FX_CONNECT'),
  year(2017,'FX_DECADE_BORDER'),
  year(2022,'FX_DECADE_BORDER')
 ]});
test('N02 selects two distinct well-spaced anchors with stable chronological order',()=>{
 const out=buildSyntheticStoryBlueprint(demo());
 assert.equal(out.version,SELECTOR_VERSION);
 assert.equal(out.status,'synthetic_preview_only');
 assert.equal(out.production_usable,false);
 assert.equal(out.calendar_audit,'not_performed');
 assert.deepEqual(out.anchors.map(x=>x.year),[2017,2022]);
 assert.equal(out.bridge,'repeated_theme');
 assert.ok(out.anchors.every(a=>a.evidence_refs.length&&a.rule_ids.length));
 assert.ok(out.anchors.every(a=>a.motif.example_scenes.length===2));
 assert.equal(out.anchors.every(a=>Number.isInteger(a.editorial_score)),true);
});
test('N02 preserves input; the same input gives the same blueprint',()=>{
 const input=demo();
 const before=JSON.stringify(input);
 assert.deepEqual(buildSyntheticStoryBlueprint(input),buildSyntheticStoryBlueprint(input));
 assert.equal(JSON.stringify(input),before);
});
test('N02 never fuses unrelated themes or equally-supported themes',()=>{
 const d={source_mode:'synthetic_fixture_only',as_of_year:2026,
 records:[year(2017,'FX_DECADE_BORDER'),year(2022,'FX_CONNECT','FX_REST'),year(2024,'FX_CONSOLIDATE')]};
 const x=buildSyntheticStoryBlueprint(d);
 assert.deepEqual(x.anchors.map(a=>a.year),[2017,2024]);
 assert.equal(x.bridge,'no_claimed_continuity');
 assert.equal(x.anchors.some(a=>a.year===2022),false);
});
test('N02 recognizes only preauthored editorial transitions, not arbitrary stories',()=>{
 const d={source_mode:'synthetic_fixture_only',as_of_year:2026,
 records:[year(2019,'FX_DECADE_BORDER'),year(2024,'FX_EXPERIMENT')]};
 const r=buildSyntheticStoryBlueprint(d);
 assert.deepEqual(r.anchors.map(a=>a.year),[2019,2024]);
 assert.equal(r.bridge,'defined_editorial_transition');
});
test('N02 refuses guessed calendar proof or arbitrary person-specific claims',()=>{
 for(const x of [
  {...demo(),source_mode:'independently_verified'},
  {...demo(),date_of_birth:'1990-04-25'},
  {...demo(),calendar_status:'approved'},
  {...demo(),records:[year(2020,'FX_UNKNOWN')]},
  {...demo(),records:[{year:2020,signals:[{rule_id:'FX_EXPERIMENT',source_ref:'https://example.com'}]}]},
  {...demo(),records:[year(2020,'FX_EXPERIMENT','FX_EXPERIMENT')]},
  {...demo(),records:[year(2020,'FX_DECADE_BORDER'),year(2020,'FX_REST')]},
  {...demo(),records:[year(2026,'FX_DECADE_BORDER')]},
  {...demo(),records:[year(2027,'FX_DECADE_BORDER')]},
  {...demo(),records:[year(2020,'FX_DECADE_BORDER'),{year:2021,signals:[]}]}
 ]){
   assert.throws(()=>buildSyntheticStoryBlueprint(x),{code:'FIXTURE_INVALID'});
 }
});
test('N02 never invents a year when there are no eligible signals',()=>{
 const x=buildSyntheticStoryBlueprint({source_mode:'synthetic_fixture_only',as_of_year:2026,records:[]});
 assert.equal(x.status,'insufficient_fixture_signals');
 assert.equal(x.anchors.length,0);
 assert.equal(x.bridge,'single_or_none');
});
test('N02 selection does not pretend to validate a horoscope or personal history',()=>{
 const x=buildSyntheticStoryBlueprint(demo());
 assert.equal(x.production_usable,false);
 assert.ok(x.premise.includes('架空'));
 assert.ok(x.disclaimer.includes('出来事'));
 for(const item of x.anchors){
   assert.equal(Object.hasOwn(item,'predicted_event'),false);
   assert.equal(Object.hasOwn(item,'mochi_type'),false);
   assert.equal(Object.hasOwn(item,'natal_pillar'),false);
 }
 assert.deepEqual(Object.keys(FIXTURE_RULES).length,6);
});
test('N02 enforces a three-year spacing even if two top scores are adjacent',()=>{
 const d={source_mode:'synthetic_fixture_only',as_of_year:2026,records:[
   year(2018,'FX_DECADE_BORDER'),year(2019,'FX_DECADE_BORDER'),
   year(2024,'FX_DECADE_BORDER'),year(2025,'FX_DECADE_BORDER')
 ]};
 const x=buildSyntheticStoryBlueprint(d);
 assert.equal(x.anchors.length,2);
 assert.ok(x.anchors[1].year-x.anchors[0].year>=3);
});
