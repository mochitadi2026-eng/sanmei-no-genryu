import test from 'node:test';
import assert from 'node:assert/strict';
import m02 from '../m02-core-symbols-v0.1.json' with {type:'json'};
import {studyClassicalDaYun,STUDY_VERSION} from '../n01-classical-daiun-study-v0.1.mjs';
const p=(props={})=>({
 source_mode:'synthetic_study_only',m02,year_stem:'甲',
 traditional_group:'male',days_to_jie:30,month_pillar:'丙寅',...props
});
test('Classical model: yang year male, forward 30 days => 10 years, 丁卯 first',()=>{
 const r=studyClassicalDaYun(p());
 assert.equal(r.version,STUDY_VERSION);
 assert.equal(r.direction,'forward');
 assert.equal(r.start_age_years_unrounded,10);
 assert.deepEqual(r.pillars.slice(0,3).map(x=>x.pillar),['丁卯','戊辰','己巳']);
 assert.equal(r.pillars[0].from_age_years_unrounded,10);
 assert.equal(r.pillars[1].from_age_years_unrounded,20);
 assert.equal(r.production_usable,false);
 assert.equal(r.daiun_adopted,false);
});
test('Classical model: yang year female, reverse 9 days => 3 years, 乙丑 first',()=>{
 const r=studyClassicalDaYun(p({traditional_group:'female',days_to_jie:9}));
 assert.equal(r.direction,'backward');
 assert.equal(r.start_age_years_unrounded,3);
 assert.deepEqual(r.pillars.slice(0,3).map(x=>x.pillar),['乙丑','甲子','癸亥']);
});
test('Classical model: yin year male reverse and female forward',()=>{
 assert.equal(studyClassicalDaYun(p({year_stem:'乙',traditional_group:'male'})).direction,'backward');
 assert.equal(studyClassicalDaYun(p({year_stem:'乙',traditional_group:'female'})).direction,'forward');
});
test('Not selecting a historical group never forces a category or a start age',()=>{
 const r=studyClassicalDaYun(p({traditional_group:'not_selected'}));
 assert.equal(r.status,'not_selected');
 assert.equal(Object.hasOwn(r,'pillars'),false);
 assert.equal(Object.hasOwn(r,'start_age_years_unrounded'),false);
});
test('Fractional ages remain unrounded because modern policy is not adopted',()=>{
 const r=studyClassicalDaYun(p({days_to_jie:10}));
 assert.equal(r.start_age_years_unrounded,10/3);
 assert.equal(r.pillars[0].from_age_years_unrounded,10/3);
});
test('Rejects real dates, unknown historical groups, unsupported year stems and invalid day counts',()=>{
 const cases=[
  {source_mode:'actual_user'},
  {birth_date:'2000-03-03'},
  {traditional_group:'other'},
  {year_stem:'異'},
  {days_to_jie:31.5},
  {days_to_jie:-1},
  {days_to_jie:40},
  {month_pillar:'甲丑'}
 ];
 for(const c of cases)assert.throws(()=>studyClassicalDaYun(p(c)),{code:'CLASSICAL_STUDY_INVALID'});
});
test('Does not mutate M02 or any parameters and uses exactly ten 10-year steps',()=>{
 const arg=p(),before=JSON.stringify(arg);
 const out=studyClassicalDaYun(arg);
 assert.equal(JSON.stringify(arg),before);
 assert.equal(out.pillars.length,10);
 assert.equal(out.pillars[9].from_age_years_unrounded,100);
 assert.ok(out.source_refs.length>0);
});
