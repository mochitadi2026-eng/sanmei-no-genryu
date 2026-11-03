import test from 'node:test';
import assert from 'node:assert/strict';
import {renderSyntheticReading,RENDERER_VERSION}
  from '../n04-synthetic-story-renderer-v0.1.mjs';
function mock(){
 return {
  source_mode:'synthetic_fixture_only',as_of_year:2026,
  records:[
   {year:2017,signals:[{rule_id:'FX_DECADE_BORDER',source_ref:'fixture:s1'}]},
   {year:2022,signals:[{rule_id:'FX_DECADE_BORDER',source_ref:'fixture:s2'}]}
  ]
 };
}
test('N04 builds prologue, past, bridge, present, future hold and ending',()=>{
 const r=renderSyntheticReading(mock());
 assert.equal(r.version,RENDERER_VERSION);
 assert.equal(r.status,'synthetic_preview_only');
 assert.equal(r.production_usable,false);
 assert.deepEqual(r.selected_years,[2017,2022]);
 assert.deepEqual(r.sections.map(s=>s.id),[
  'prologue','past_1','past_2','bridge','present','future','ending'
 ]);
 assert.ok(r.sections[1].body.includes('慣れた仕事の順番'));
 assert.ok(r.sections[1].body.includes('続けたい気持ち'));
 assert.ok(r.sections[3].body.includes('同じ'));
 assert.equal(r.calendar_sources.every(s=>s.startsWith('fixture:')),true);
});
test('N04 keeps time anchors in text aligned with selector output',()=>{
 const r=renderSyntheticReading(mock());
 const yearTokens=JSON.stringify(r.sections).match(/(?:19|20)\d{2}年/g)||[];
 const renderedYears=[...new Set(yearTokens.map(s=>Number(s.slice(0,4))))].sort((a,b)=>a-b);
 assert.deepEqual(renderedYears,r.selected_years);
 assert.ok(r.notice.includes('架空'));
 assert.ok(r.sections.every(s=>!s.body.includes('必ず転職')));
});
test('N04 fallback does not make up a historical year',()=>{
 const r=renderSyntheticReading({source_mode:'synthetic_fixture_only',as_of_year:2026,records:[]});
 assert.equal(r.status,'not_enough_mock_data');
 assert.equal(r.sections.length,1);
 assert.ok(r.sections[0].body.includes('生成しません'));
 assert.equal(r.production_usable,false);
});
test('N04 refuses a claimed real-world calendar or DOB input',()=>{
 const m=mock();
 assert.throws(()=>renderSyntheticReading({...m,source_mode:'verified_calendar'}),{code:'FIXTURE_INVALID'});
 assert.throws(()=>renderSyntheticReading({...m,birth_date:'1990-01-01'}),{code:'FIXTURE_INVALID'});
 assert.throws(()=>renderSyntheticReading({...m,records:[{year:2028,signals:m.records[0].signals}]}),{code:'FIXTURE_INVALID'});
});
test('N04 produces stable draft output without mutating inputs',()=>{
 const input=mock(),before=JSON.stringify(input);
 assert.deepEqual(renderSyntheticReading(input),renderSyntheticReading(input));
 assert.equal(JSON.stringify(input),before);
});
