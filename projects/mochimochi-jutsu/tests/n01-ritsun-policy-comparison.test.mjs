import test from 'node:test';
import assert from 'node:assert/strict';
import {
  POLICY_STUDY_VERSION,POLICY_SOURCES,STUDY_POLICIES,
  compareReverseRitsuunStudy,compareSharedDayCountStudy
} from '../n01-ritsun-policy-comparison-v0.1.mjs';
const reverse=(gap_days)=>compareReverseRitsuunStudy({
  fixture_mode:'anonymous_reverse_gap_fixture',gap_days
});
const same=(counted_days)=>compareSharedDayCountStudy({
  fixture_mode:'anonymous_precounted_days_fixture',counted_days
});
test('public Saruyama reverse fixture: Feb 4→11, 7 days vs 8 days, 2 vs 3 years',()=>{
  const result=reverse(7);
  assert.equal(result.version,POLICY_STUDY_VERSION);
  assert.equal(result.direction,'reverse_example_only');
  assert.equal(result.standard.counted_days,7);
  assert.equal(result.standard.start_age_display,2);
  assert.equal(result.suzaku.counted_days,8);
  assert.equal(result.suzaku.start_age_display,3);
  assert.equal(result.age_difference,1);
  assert.equal(result.source,POLICY_SOURCES.reverse_example);
});
test('Sanmei Stock published 22 counted days: half-up 7 vs ceiling 8',()=>{
  const r=same(22);
  assert.equal(r.normal.counted_days,22);
  assert.equal(r.normal.start_age_display,7);
  assert.equal(r.ceil.counted_days,22);
  assert.equal(r.ceil.start_age_display,8);
  assert.equal(r.source,POLICY_SOURCES.shared_day_count);
});
test('correct integer arithmetic at multiples of 3 and remainder 1/2',()=>{
  assert.equal(same(3).normal.start_age_display,1);
  assert.equal(same(3).ceil.start_age_display,1);
  assert.equal(same(4).normal.start_age_display,1);
  assert.equal(same(4).ceil.start_age_display,2);
  assert.equal(same(5).normal.start_age_display,2);
  assert.equal(same(5).ceil.start_age_display,2);
  assert.equal(same(10).normal.start_age_display,3);
  assert.equal(same(10).ceil.start_age_display,4);
});
test('reverse inclusivity produces non-decreasing ages across 0..31 days',()=>{
  let usual=0,suzaku=0;
  for(let d=0;d<=31;d++){
    const r=reverse(d);
    assert.equal(r.standard.counted_days,d);
    assert.equal(r.suzaku.counted_days,d+1);
    assert.ok(r.standard.start_age_display>=usual);
    assert.ok(r.suzaku.start_age_display>=suzaku);
    assert.ok(r.standard.start_age_display>=1&&r.standard.start_age_display<=10);
    assert.ok(r.suzaku.start_age_display>=1&&r.suzaku.start_age_display<=10);
    usual=r.standard.start_age_display;suzaku=r.suzaku.start_age_display;
  }
});
test('one displayed start age produces ten-year age brackets, not exact dates',()=>{
  const r=reverse(7);
  assert.deepEqual(r.standard.hypothetical_age_bands,[
    {step:1,from_age:2,to_age:11},
    {step:2,from_age:12,to_age:21}
  ]);
  assert.deepEqual(r.suzaku.hypothetical_age_bands,[
    {step:1,from_age:3,to_age:12},
    {step:2,from_age:13,to_age:22}
  ]);
  assert.equal(r.standard.calculated_start_date,null);
  assert.equal(r.suzaku.calculated_start_date,null);
});
test('public comparison never claims certification or individual fate',()=>{
  for(const policy of Object.values(STUDY_POLICIES))
    assert.equal(policy.authorized_as_official_school_rule,false);
  for(const r of [reverse(7),same(22)]){
    assert.equal(r.production_usable,false);
    assert.equal(r.official_school_rules_certified,false);
    assert.equal(Object.hasOwn(r,'predicted_event'),false);
    assert.equal(Object.hasOwn(r,'birth_timestamp'),false);
  }
});
test('reject birth dates and all non-fixture fields, as well as false modes',()=>{
  const invalid=[
    {fixture_mode:'anonymous_reverse_gap_fixture',gap_days:7,birth_date:'1985-12-15'},
    {fixture_mode:'verified_natal',gap_days:7},
    {fixture_mode:'anonymous_reverse_gap_fixture',gap_days:'7'},
    {fixture_mode:'anonymous_reverse_gap_fixture',gap_days:7.5},
    {fixture_mode:'anonymous_reverse_gap_fixture',gap_days:-1},
    {fixture_mode:'anonymous_reverse_gap_fixture',gap_days:32},
    {fixture_mode:'anonymous_reverse_gap_fixture',gap_days:7,direction:'forward'},
    {fixture_mode:'anonymous_reverse_gap_fixture',gap_days:7,year_pillar:'乙丑'},
    {fixture_mode:'anonymous_reverse_gap_fixture',gap_days:7,gender:'male'}
  ];
  for(const o of invalid){
    assert.throws(()=>compareReverseRitsuunStudy(o),{code:'N01_RITSUN_STUDY_INVALID'});
  }
  for(const o of [
    {fixture_mode:'anonymous_precounted_days_fixture',counted_days:22,birth_date:'1985-12-15'},
    {fixture_mode:'anonymous_precounted_days_fixture',counted_days:40},
    {fixture_mode:'anonymous_precounted_days_fixture',counted_days:22,direction:'reverse'}
  ])assert.throws(()=>compareSharedDayCountStudy(o),{code:'N01_RITSUN_STUDY_INVALID'});
});
test('same synthetic input always yields same output',()=>{
  const input={fixture_mode:'anonymous_reverse_gap_fixture',gap_days:7};
  const before=JSON.stringify(input);
  assert.deepEqual(compareReverseRitsuunStudy(input),compareReverseRitsuunStudy(input));
  assert.equal(JSON.stringify(input),before);
});
test('conventions may disagree: never silently select one profile',()=>{
  const result=reverse(7);
  assert.notEqual(result.standard.start_age_display,result.suzaku.start_age_display);
  assert.equal(Object.hasOwn(result,'adopted_start_age'),false);
  assert.equal(Object.hasOwn(result,'selected_policy'),false);
  assert.equal(result.da_yun_start_year_computed,false);
});
