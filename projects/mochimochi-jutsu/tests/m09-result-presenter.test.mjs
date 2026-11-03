import test from 'node:test';
import assert from 'node:assert/strict';
import questionBank from '../m07-question-bank-v0.1.json' with {type:'json'};
import typeCatalog from '../m04-types-phases-v0.1.json' with {type:'json'};
import indicatorCatalog from '../m03-indicators-v0.1.json' with {type:'json'};
import copyCatalog from '../m09-result-copy-v0.2.json' with {type:'json'};
import {classifyAnswers,ALGORITHM_VERSION} from '../m08-classifier-v0.1.mjs';
import {PRESENTER_VERSION,validateResultCatalogs,presentClassification,presentAnswers} from '../m09-result-presenter-v0.1.mjs';

const catalogs={questionBank,typeCatalog,indicatorCatalog,copyCatalog};
const v={
  question_set_id:questionBank.question_set_id,
  question_version:questionBank.question_version,
  tag_mapping_version:questionBank.tag_mapping_version,
  type_catalog_version:typeCatalog.version,
  algorithm_version:ALGORITHM_VERSION
};
const answer=(Q1,Q2,Q3,Q4,Q5)=>({Q1,Q2,Q3,Q4,Q5});
const input=answers=>({...v,answers});
const present=answers=>presentAnswers(input(answers),catalogs);
const classify=answers=>classifyAnswers(input(answers),catalogs);

test('M09 copy catalog matches original M03/M04 source IDs and labels',()=>{
  assert.equal(validateResultCatalogs(copyCatalog,typeCatalog,indicatorCatalog),true);
  assert.equal(copyCatalog.types.length,12);
  assert.equal(copyCatalog.phases.length,5);
  assert.equal(copyCatalog.themes.length,6);
  assert.equal(copyCatalog.version,'m09-copy-v0.2');
  assert.equal(copyCatalog.editorial_version,'pk03-story-copy-v1.0');
  assert.equal(new Set(copyCatalog.types.map(x=>x.scene_title)).size,12);
  assert.equal(new Set(copyCatalog.phases.map(x=>x.scene_title)).size,5);
  assert.ok(copyCatalog.types.every(x=>x.reflection.length>=100));
  assert.ok(copyCatalog.phases.every(x=>x.reflection.length>=45));
  assert.equal(Object.hasOwn(copyCatalog.types[0],'label'),false);
});

test('classified result shows original type label, independent phase, optional question',()=>{
  const r=present(answer('a','x','c','a','a'));
  assert.equal(r.status,'ready');
  assert.equal(r.presenter_version,PRESENTER_VERSION);
  assert.deepEqual(r.sections.map(s=>s.id),['mochi_shitsu','mochi_guai','mochi_michi']);
  assert.equal(r.sections[0].status,'not_connected');
  assert.equal(r.sections[1].type.id,'MT01');
  assert.equal(r.sections[1].type.label,'のびのびもち');
  assert.equal(r.sections[1].type.scene_title,'曲がり角に、もう一本の道');
  assert.equal(r.sections[1].phase.scene_title,'小さな実験の午後');
  assert.equal(r.sections[2].optional_question,copyCatalog.types[0].optional_question);
  assert.equal(r.sections[1].phase.id,'FP03');
  assert.equal(r.sections[1].phase.label,'ふくらみ期');
  assert.equal(r.sections[1].selected_themes[0].label,'柔軟性');
  assert.equal(r.sections[2].status,'optional');
  assert.ok(r.sections[2].optional_question.includes('？'));
  assert.ok(r.sections[0].paragraphs[0].includes('つないでいません'));
});

test('12 provisional names are returned without rebuilding or duplicating M04 labels',()=>{
  for(let i=0;i<6;i++){
    const id=String.fromCharCode(97+i);
    for(const mode of ['a','b']){
      const r=present(answer(id,'x','a',id,mode));
      const expected=typeCatalog.types[i*2+(mode==='b'?1:0)];
      assert.equal(r.sections[1].type.id,expected.id);
      assert.equal(r.sections[1].type.label,expected.label);
      assert.ok(r.sections[1].type.reflection.length>100);
      assert.equal(r.sections[1].type.scene_title,copyCatalog.types[i*2+(mode==='b'?1:0)].scene_title);
    }
  }
});

test('all five phases and phase x are independent of type',()=>{
  const ids=['a','b','c','d','e','x'];
  for(let i=0;i<ids.length;i++){
    const r=present(answer('a','x',ids[i],'a','a'));
    assert.equal(r.sections[1].type.id,'MT01');
    assert.equal(r.sections[1].phase?.id??null,typeCatalog.phases[i]?.id??null);
    if(ids[i]==='x')assert.ok(r.sections[1].phase_fallback);
    else assert.equal(r.sections[1].phase.scene_title,copyCatalog.phases[i].scene_title);
  }
});

test('Q1/Q2 alone never turn into a type, but selected themes remain readable',()=>{
  const r=present(answer('a','a','c','b','a'));
  const s=r.sections[1];
  assert.equal(s.status,'open_reflection');
  assert.equal(s.type,null);
  assert.deepEqual(s.selected_themes.map(x=>x.id),['MOCHI','KETSU']);
  assert.ok(s.paragraphs[0].includes('ひとつのテーマにしぼりませんでした'));
  assert.equal(s.phase.id,'FP03');
  assert.ok(r.sections[2].optional_question.length>0);
  assert.equal(r.sections[2].optional_question,copyCatalog.phases[2].optional_question);
});

test('unknown mode keeps corroborated themes without inventing a type',()=>{
  const r=present(answer('a','x','a','a','x'));
  assert.equal(r.sections[1].type,null);
  assert.ok(r.sections[1].paragraphs[0].includes('進め方をひとつには'));
  assert.deepEqual(r.sections[1].selected_themes.map(x=>x.id),['MOCHI']);
});

test('all x gives gentle open reflection and no fake phase or birth claims',()=>{
  const r=present(answer('x','x','x','x','x'));
  const s=r.sections[1];
  assert.equal(r.status,'ready');
  assert.equal(s.type,null);
  assert.equal(s.phase,null);
  assert.deepEqual(s.selected_themes,[]);
  assert.ok(s.paragraphs[0].includes('決めませんでした'));
  assert.ok(s.phase_fallback);
  assert.equal(r.sections[0].status,'not_connected');
  assert.equal(r.sections[2].optional_question,copyCatalog.fallbacks.generic_question);
});

test('missing answer stays incomplete and leaks no inferred sections',()=>{
  const r=present({Q1:'a',Q2:'x',Q3:'c',Q5:'a'});
  assert.equal(r.status,'incomplete');
  assert.deepEqual(r.screen.missing_questions,['Q4']);
  assert.equal(Object.hasOwn(r,'sections'),false);
  assert.equal(Object.hasOwn(r,'phase_id'),false);
});

test('invalid answer or old input version gives neutral error screen, no interpretation',()=>{
  for(const bad of [input(answer('z','x','c','a','a')),
    {...input(answer('a','x','c','a','a')),tag_mapping_version:'old'},
    input({...answer('a','x','c','a','a'),EXTRA:'anything'})]){
    const r=presentAnswers(bad,catalogs);
    assert.equal(r.status,'input_error');
    assert.equal(Object.hasOwn(r,'sections'),false);
    assert.ok(r.screen.body.includes('表示していません'));
  }
});

test('tampered M08 outputs or catalogs cannot fabricate result or silently pass',()=>{
  const actual=classify(answer('a','x','c','a','a'));
  const invalid=[
    {...actual,mochi_type_id:'MT12'},
    {...actual,primary_theme:'EN'},
    {...actual,phase_id:'FP99'},
    {...actual,extra:'false'},
    {...actual,algorithm_version:'changed'}
  ];
  for(const r of invalid)assert.throws(()=>presentClassification(r,catalogs),
    e=>['RESULT_INVALID','RESULT_VERSION_MISMATCH'].includes(e.code));
  const copy=structuredClone(copyCatalog);
  copy.types[0].id='MT12';
  assert.throws(()=>presentClassification(actual,{...catalogs,copyCatalog:copy}),{code:'COPY_CATALOG_INVALID'});
  const badIndicator=structuredClone(indicatorCatalog);
  badIndicator.indicators[0].id='EN';
  assert.throws(()=>presentClassification(actual,{...catalogs,indicatorCatalog:badIndicator}),{code:'COPY_CATALOG_INVALID'});
});

test('PK03 editorial contract: optional metaphor, no fabricated history or fear-based commands',()=>{
  assert.equal(copyCatalog.types.length,12);
  assert.equal(copyCatalog.phases.length,5);
  const texts=[
    ...copyCatalog.types.flatMap(x=>[x.scene_title,x.reflection,x.optional_question]),
    ...copyCatalog.phases.flatMap(x=>[x.scene_title,x.reflection,x.optional_question]),
    ...Object.values(copyCatalog.fallbacks).filter(x=>typeof x==='string')
  ];
  assert.ok(texts.every(s=>typeof s==='string'&&s.trim().length));
  assert.ok(texts.every(s=>!/(あなたは昔から|あなたの過去に|必ず当たる|運気が上がる|絶対に|死期|病気が治る|金運が確実)/.test(s)));
  assert.ok(copyCatalog.footer.includes('創作'));
  const oldVersion=structuredClone(copyCatalog);oldVersion.version='m09-copy-v0.1';
  assert.throws(()=>validateResultCatalogs(oldVersion,typeCatalog,indicatorCatalog),{code:'COPY_CATALOG_INVALID'});
  for(const type of typeCatalog.types){
    const t=copyCatalog.types.find(x=>x.id===type.id);
    assert.ok(t&&t.scene_title&&!/第[0-9一二三]/.test(t.scene_title));
  }
});

test('M08 and M09 do not mutate input/copy/catalog data and results are deterministic',()=>{
  const example=answer('f','x','d','f','b');
  const before=JSON.stringify([example,questionBank,typeCatalog,indicatorCatalog,copyCatalog]);
  const first=present(example);
  for(let i=0;i<4;i++)assert.deepEqual(present(example),first);
  assert.equal(JSON.stringify([example,questionBank,typeCatalog,indicatorCatalog,copyCatalog]),before);
});

test('all 6174 valid response combinations give complete, safe renderable states',()=>{
  const choices=questionBank.questions.map(q=>q.choices.map(c=>c.id));
  let total=0,typed=0,untyped=0;
  const typeIds=new Set(),phaseIds=new Set();
  for(const q1 of choices[0])for(const q2 of choices[1])
  for(const q3 of choices[2])for(const q4 of choices[3])for(const q5 of choices[4]){
    const answers=answer(q1,q2,q3,q4,q5);
    const m08=classify(answers);
    const r=presentClassification(m08,catalogs);
    assert.equal(r.status,'ready');
    assert.equal(r.sections.length,3);
    assert.equal(r.sections[0].status,'not_connected');
    const s=r.sections[1];
    assert.equal(s.type?.id??null,m08.mochi_type_id);
    assert.equal(s.phase?.id??null,m08.phase_id);
    assert.deepEqual(s.selected_themes.map(x=>x.id),m08.candidate_themes);
    if(s.type){typed++;typeIds.add(s.type.id)}else{untyped++;assert.ok(s.paragraphs.length)}
    if(s.phase)phaseIds.add(s.phase.id);else assert.ok(s.phase_fallback);
    assert.ok(r.sections[2].optional_question.length>0);
    const dump=JSON.stringify(r);
    assert.ok(!/birthDate|birthTime|stars|score|percentile|diagnos/i.test(dump));
    total++;
  }
  assert.equal(total,6174);
  assert.equal(typed,936);
  assert.equal(untyped,5238);
  assert.equal(typeIds.size,12);
  assert.equal(phaseIds.size,5);
});
