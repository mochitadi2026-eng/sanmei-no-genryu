import test from 'node:test';
import assert from 'node:assert/strict';
import registry from '../n01-naoj-risshun-2024-2027-v0.1.json' with {type:'json'};
import {N01_VERSION,validateN01RisshunRegistry,resolveAnnualGanzhi}
 from '../n01-annual-ganzhi-v0.1.mjs';
const at=t=>resolveAnnualGanzhi({registry,timestamp_jst:t});
test('NAOJ 2024-2027 source minutes match independent official year fixtures',()=>{
 assert.equal(validateN01RisshunRegistry(registry),true);
 assert.deepEqual(registry.boundary_minutes.map(x=>[x.year,x.jst]),[
  [2024,'2024-02-04T17:27:00+09:00'],
  [2025,'2025-02-03T23:10:00+09:00'],
  [2026,'2026-02-04T05:02:00+09:00'],
  [2027,'2027-02-04T10:46:00+09:00']
 ]);
 for(const x of registry.boundary_minutes)assert.equal(new URL(x.source).hostname,'eco.mtk.nao.ac.jp');
});
test('year labels after Risshun are 2024甲辰 to 2027丁未',()=>{
 const cases=[
  ['2024-02-04T17:29:00+09:00',2024,'甲辰'],
  ['2025-02-04T01:00:00+09:00',2025,'乙巳'],
  ['2026-11-03T12:08:00+09:00',2026,'丙午'],
  ['2027-02-05T00:00:00+09:00',2027,'丁未']
 ];
 for(const [date,year,expected] of cases){
  const x=at(date);
  assert.equal(x.status,'symbol_only');
  assert.equal(x.effective_cycle_year,year);
  assert.equal(x.ganzhi,expected);
  assert.equal(x.rule_id,'SOLAR_YEAR_RISSHUN_1984_JIAZI');
  assert.equal(x.version,N01_VERSION);
  assert.equal(x.turning_point_computed,false);
 }
});
test('January pre-Lichun uses previous verified cycle year',()=>{
 const cases=[
  ['2025-02-01T00:00:00+09:00',2024,'甲辰'],
  ['2026-02-01T00:00:00+09:00',2025,'乙巳'],
  ['2027-02-01T00:00:00+09:00',2026,'丙午']
 ];
 for(const [date,y,label] of cases){
  const r=at(date);assert.equal(r.status,'symbol_only');
  assert.equal(r.effective_cycle_year,y);assert.equal(r.ganzhi,label);
  assert.equal(r.source_urls.length,2);
 }
});
test('published minute is not precise second: hold 60s both sides',()=>{
 for(const date of [
  '2026-02-04T05:01:00+09:00',
  '2026-02-04T05:01:59+09:00',
  '2026-02-04T05:02:00+09:00',
  '2026-02-04T05:02:59+09:00',
  '2026-02-04T05:03:00+09:00'
 ]){
  const r=at(date);
  assert.equal(r.status,'needs_review',date);
  assert.equal(r.reason,'RISSHUN_MINUTE_PRECISION');
  assert.equal(Object.hasOwn(r,'ganzhi'),false);
 }
 assert.equal(at('2026-02-04T05:00:59+09:00').ganzhi,'乙巳');
 assert.equal(at('2026-02-04T05:03:01+09:00').ganzhi,'丙午');
});
test('the beginning and end of supported source range are held safely',()=>{
 assert.equal(at('2024-01-01T00:00:00+09:00').status,'unsupported');
 assert.equal(at('2024-02-04T17:27:00+09:00').status,'needs_review');
 assert.equal(at('2027-12-31T23:59:59+09:00').ganzhi,'丁未');
 assert.equal(at('2028-01-01T00:00:00+09:00').status,'unsupported');
 assert.equal(at('2023-12-31T23:59:59+09:00').status,'unsupported');
});
test('reject invalid calendar days, other offsets, malformed times',()=>{
 for(const date of [
  '2026-02-30T00:00:00+09:00',
  '2026-13-01T00:00:00+09:00',
  '2026-02-04T25:02:00+09:00',
  '2026-02-04T05:02:00Z',
  '2026-02-04T05:02:00+00:00',
  '2026-02-04',
  '2026-02-04T05:02+09:00',
  '2026-02-04T05:02:00+09:01',
  '2026-02-04T05:02:60+09:00'
 ])assert.throws(()=>at(date),{code:'N01_INVALID_INPUT'});
});
test('registry rejects forged or incomplete sources',()=>{
 for(const mutate of [
  c=>{c.version='draft'},
  c=>{c.boundary_minutes.pop()},
  c=>{c.boundary_minutes[0].year=2023},
  c=>{c.boundary_minutes[1].source='https://example.com/fake'},
  c=>{c.boundary_minutes[2].published_precision='second'},
  c=>{c.boundary_minutes[0].jst='2024-02-30T17:27:00+09:00'}
 ]){
  const clone=structuredClone(registry);mutate(clone);
  assert.throws(()=>validateN01RisshunRegistry(clone),{code:'N01_INVALID_INPUT'});
 }
});
test('no natal chart or personal predictions and no input mutation',()=>{
 const before=JSON.stringify(registry);
 const r=at('2026-05-10T12:00:00+09:00');
 assert.equal(r.natal_chart_computed,false);
 assert.equal(r.da_yun_computed,false);
 assert.equal(r.turning_point_computed,false);
 assert.equal(r.personality_computed,false);
 assert.equal(Object.hasOwn(r,'theme_id'),false);
 assert.equal(Object.hasOwn(r,'predicted_event'),false);
 assert.equal(Object.hasOwn(r,'birth_date'),false);
 assert.equal(JSON.stringify(registry),before);
 assert.throws(()=>resolveAnnualGanzhi({registry,timestamp_jst:'2026-05-10T12:00:00+09:00',birth_date:'1988-01-01'}),{code:'N01_INVALID_INPUT'});
});
