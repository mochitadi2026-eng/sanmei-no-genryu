import test from 'node:test';
import assert from 'node:assert/strict';
import questionBank from '../m07-question-bank-v0.1.json' with { type: 'json' };
import typeCatalog from '../m04-types-phases-v0.1.json' with { type: 'json' };
import { ALGORITHM_VERSION, validateCatalogs, classifyAnswers } from '../m08-classifier-v0.1.mjs';

const versions = Object.freeze({
  question_set_id: questionBank.question_set_id,
  question_version: questionBank.question_version,
  tag_mapping_version: questionBank.tag_mapping_version,
  type_catalog_version: typeCatalog.version,
  algorithm_version: ALGORITHM_VERSION,
});
const catalogs = { questionBank, typeCatalog };
const data = answers => ({ ...versions, answers });
const run = answers => classifyAnswers(data(answers), catalogs);
const a = (Q1, Q2, Q3, Q4, Q5) => ({ Q1, Q2, Q3, Q4, Q5 });
const expectedIds = new Set(typeCatalog.types.map(t => t.id));
const has = (r, key) => Object.hasOwn(r, key);

test('versioned catalogs satisfy structural invariants', () => {
  assert.equal(validateCatalogs(questionBank, typeCatalog), true);
  assert.equal(questionBank.questions.length, 5);
  assert.deepEqual(questionBank.questions.map(q => q.choices.length), [7, 7, 6, 7, 3]);
  assert.equal(expectedIds.size, 12);
});

test('Q4 corroboration with Q1 or Q2 produces a type and independent phase', () => {
  const r = run(a('a', 'x', 'c', 'a', 'a'));
  assert.equal(r.status, 'resolved');
  assert.equal(r.type_status, 'classified');
  assert.equal(r.mochi_type_id, 'MT01');
  assert.equal(r.primary_theme, 'MOCHI');
  assert.equal(r.phase_id, 'FP03');
  assert.deepEqual(r.candidate_themes, ['MOCHI']);
  assert.equal(r.algorithm_version, ALGORITHM_VERSION);
  assert.equal(run(a('a', 'x', 'c', 'a', 'b')).mochi_type_id, 'MT02');
  assert.equal(run(a('x', 'e', 'a', 'e', 'a')).mochi_type_id, 'MT09');
  assert.equal(run(a('e', 'a', 'a', 'a', 'b')).mochi_type_id, 'MT02');
});

test('Q1 and Q2 alone cannot qualify, even when both agree', () => {
  const r = run(a('a', 'a', 'c', 'b', 'a'));
  assert.equal(r.type_status, 'undetermined');
  assert.equal(r.type_reason, 'NO_CORROBORATED_THEME');
  assert.equal(r.mochi_type_id, null);
  assert.equal(r.primary_theme, null);
  assert.deepEqual(r.candidate_themes, ['MOCHI', 'KETSU']);
  assert.equal(r.phase_id, 'FP03');
});

test('all x are valid answered choices rather than incomplete', () => {
  const r = run(a('x', 'x', 'x', 'x', 'x'));
  assert.equal(r.status, 'resolved');
  assert.equal(r.type_status, 'undetermined');
  assert.equal(r.mochi_type_id, null);
  assert.equal(r.phase_id, null);
  assert.equal(r.phase_status, 'unselected');
  assert.deepEqual(r.candidate_themes, []);
});

test('Q4 alone never labels a person; Q5 and Q3 are independent', () => {
  const alone = run(a('x', 'x', 'e', 'a', 'a'));
  assert.equal(alone.mochi_type_id, null);
  assert.equal(alone.phase_id, 'FP05');
  const modeUnknown = run(a('a', 'x', 'c', 'a', 'x'));
  assert.equal(modeUnknown.primary_theme, 'MOCHI');
  assert.equal(modeUnknown.mochi_type_id, null);
  assert.equal(modeUnknown.type_reason, 'MODE_NOT_SELECTED');
  const phaseUnknown = run(a('a', 'x', 'x', 'a', 'a'));
  assert.equal(phaseUnknown.mochi_type_id, 'MT01');
  assert.equal(phaseUnknown.phase_id, null);
});

test('missing question means incomplete with no partial type or phase results', () => {
  const r = run({ Q1: 'a', Q2: 'x', Q3: 'c', Q5: 'a' });
  assert.deepEqual(r.missing_questions, ['Q4']);
  assert.equal(r.status, 'incomplete');
  assert.equal(has(r, 'mochi_type_id'), false);
  assert.equal(has(r, 'phase_id'), false);
  const allMissing = run({});
  assert.deepEqual(allMissing.missing_questions, ['Q1','Q2','Q3','Q4','Q5']);
});

test('invalid choice, malformed shapes and unexpected keys are rejected', () => {
  const good = a('a','x','c','a','a');
  for (const bad of [
    { ...good, Q2:'z' }, { ...good, Q2:null },
    { ...good, Q2:2 }, { ...good, EXTRA:'a' },
  ]) {
    assert.throws(() => run(bad), { code:'INVALID_INPUT' });
  }
  assert.throws(() => run(null), { code:'INVALID_INPUT' });
  assert.throws(() => run([]), { code:'INVALID_INPUT' });
  assert.throws(() => classifyAnswers({...data(good), extra:'not allowed'}, catalogs),
    { code:'INVALID_INPUT' });
  assert.throws(() => classifyAnswers({...data(good), answers:null}, catalogs),
    { code:'INVALID_INPUT' });
  assert.throws(() => run({Q1:'z'}), { code:'INVALID_INPUT' });
  assert.throws(() => classifyAnswers(undefined, catalogs), { code:'INVALID_INPUT' });
});

test('version mismatches never quietly reinterpret existing response IDs', () => {
  for (const key of Object.keys(versions)) {
    assert.throws(() => classifyAnswers(
      {...data(a('a','x','c','a','a')), [key]:'future-version'}, catalogs),
    { code:'VERSION_MISMATCH' });
  }
  assert.throws(() => classifyAnswers(data(a('a','x','c','a','a')), {
    questionBank:{...questionBank,question_version:'future'},typeCatalog,
  }), {code:'CATALOG_VERSION_UNSUPPORTED'});
});

test('invalid catalogs and changed tag identity cannot silently pass', () => {
  const bad = structuredClone(questionBank);
  bad.questions[0].choices[0].value = 'EN';
  assert.throws(() => validateCatalogs(bad,typeCatalog), {code:'CATALOG_INVALID'});
  const badType = structuredClone(typeCatalog);
  badType.types[1].mode='open';
  assert.throws(() => validateCatalogs(questionBank,badType),{code:'CATALOG_INVALID'});
  assert.throws(() => classifyAnswers(data(a('a','x','c','a','a')),{}),
    {code:'CATALOG_INVALID'});
});

test('same input and versions are deterministic and do not mutate data', () => {
  const answers=a('f','x','a','f','b');
  const originalInput=data(answers);
  const before=JSON.stringify([originalInput,questionBank,typeCatalog]);
  const first=classifyAnswers(originalInput,catalogs);
  for(let i=0;i<5;i++)assert.deepEqual(classifyAnswers(originalInput,catalogs),first);
  assert.equal(JSON.stringify([originalInput,questionBank,typeCatalog]),before);
  assert.equal(first.mochi_type_id,'MT12');
  assert.equal(run(a('f','x','a','a','b')).mochi_type_id,null);
  assert.equal(run(a('f','x','a','f','a')).mochi_type_id,'MT11');
});

test('all 6174 response combinations uphold the result contract', () => {
  const ids=questionBank.questions.map(q=>q.choices.map(c=>c.id));
  const counts=new Map();
  const phases=new Set();
  let total=0,typed=0,undetermined=0,reasonNoMatch=0,reasonMode=0;
  for(const q1 of ids[0]) for(const q2 of ids[1]) for(const q3 of ids[2])
  for(const q4 of ids[3]) for(const q5 of ids[4]) {
    const answers=a(q1,q2,q3,q4,q5);
    const result=run(answers);
    assert.deepEqual(result,run(answers),'deterministic');
    assert.equal(result.status,'resolved');
    assert.equal(has(result,'score'),false);
    assert.equal(has(result,'birthDate'),false);
    const q1Theme=questionBank.questions[0].choices.find(x=>x.id===q1).value;
    const q2Theme=questionBank.questions[1].choices.find(x=>x.id===q2).value;
    const q4Theme=questionBank.questions[3].choices.find(x=>x.id===q4).value;
    const q5Mode=questionBank.questions[4].choices.find(x=>x.id===q5).value;
    const corroborated=q4Theme!==null&&(q1Theme===q4Theme||q2Theme===q4Theme);
    assert.equal(result.primary_theme,corroborated?q4Theme:null);
    if(result.mochi_type_id) {
      typed++;
      assert.equal(corroborated,true);
      assert.notEqual(q5Mode,null);
      assert.equal(expectedIds.has(result.mochi_type_id),true);
      counts.set(result.mochi_type_id,(counts.get(result.mochi_type_id)||0)+1);
    } else {
      undetermined++;
      assert.equal(result.type_status,'undetermined');
      if(result.type_reason==='NO_CORROBORATED_THEME')reasonNoMatch++;
      else if(result.type_reason==='MODE_NOT_SELECTED')reasonMode++;
      else assert.fail('unexpected type reason');
    }
    if(result.phase_id)phases.add(result.phase_id);
    total++;
  }
  assert.equal(total,6174);
  assert.equal(typed,936);
  assert.equal(undetermined,5238);
  assert.equal(reasonNoMatch,4770);
  assert.equal(reasonMode,468);
  assert.equal(counts.size,12);
  for(const count of counts.values()) assert.equal(count,78);
  assert.deepEqual([...phases].sort(),['FP01','FP02','FP03','FP04','FP05']);
});
