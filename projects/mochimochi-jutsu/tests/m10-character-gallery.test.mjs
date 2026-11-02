import test from 'node:test';
import assert from 'node:assert/strict';
import sourceM02 from '../m02-core-symbols-v0.1.json' with {type:'json'};
import catalog from '../m10-character-catalog-v0.1.json' with {type:'json'};
import {validateCharacterCatalog,buildCharacterGallery,GALLERY_VERSION}
 from '../m10-character-gallery-v0.1.mjs';

test('M10 catalog has 10+12 source-matched educational characters',()=>{
  assert.equal(validateCharacterCatalog(catalog,sourceM02),true);
  const result=buildCharacterGallery({catalog,sourceM02});
  assert.equal(result.version,GALLERY_VERSION);
  assert.equal(result.status,'educational_only');
  assert.equal(result.cards.length,22);
  assert.equal(new Set(result.cards.map(c=>c.id)).size,22);
  assert.equal(result.cards.filter(c=>c.family==='ten_main_star').length,10);
  assert.equal(result.cards.filter(c=>c.family==='twelve_follower_star').length,12);
  assert.equal(result.cards[0].name,'岩亀');
  assert.equal(result.cards[10].name,'ぽぽ');
  assert.equal(result.cards[21].name,'ひゅう');
});

test('all 22 cards have alt text; unknown images are never invented',()=>{
  const result=buildCharacterGallery({catalog,sourceM02});
  for(const card of result.cards){
    assert.equal(card.image,null);
    assert.equal(card.role,'learning_or_story_guide_only');
    assert.ok(card.alt_text.length>4);
    assert.equal(Object.hasOwn(card,'mochi_type_id'),false);
    assert.equal(Object.hasOwn(card,'birthDate'),false);
    assert.equal(Object.hasOwn(card,'recommended_for_user'),false);
  }
});

test('family filters are stable and do not assign characters',()=>{
  const ten=buildCharacterGallery({catalog,sourceM02,family:'ten_main_star'}).cards;
  const follower=buildCharacterGallery({catalog,sourceM02,family:'twelve_follower_star'}).cards;
  assert.equal(ten.length,10);
  assert.equal(follower.length,12);
  assert.equal(ten.every(x=>x.prop===null && x.stage_name===null),true);
  assert.equal(follower.every(x=>typeof x.prop==='string'&&x.prop.length>0),true);
  assert.deepEqual([...ten,...follower],buildCharacterGallery({catalog,sourceM02}).cards);
  assert.throws(()=>buildCharacterGallery({catalog,sourceM02,family:'MT01'}),{code:'M10_INPUT_INVALID'});
});

test('catalog refuses arbitrary relabeling, unknown graphics and personal mapping',()=>{
  for(const modify of [
    c=>{c.ten_main_star[0].character_name='別の名前'},
    c=>{c.twelve_follower_star[3].stage_name='改名'},
    c=>{c.twelve_follower_star[0].visual.asset_path='/images/fictional.png'},
    c=>{c.ten_main_star[0].assignable_from_m08=true},
    c=>{c.twelve_follower_star[0].assignable_from_birth_engine=true},
    c=>{c.adoption_rules.five_question_type_mapping='MT01'},
    c=>{c.presentation.show_personalized_cards=true},
    c=>{c.ten_main_star.push(c.ten_main_star[0])}
  ]){
    const bad=structuredClone(catalog);
    modify(bad);
    assert.throws(()=>validateCharacterCatalog(bad,sourceM02),{code:'M10_CATALOG_INVALID'});
  }
});

test('original M02 mappings and M10 presentation remain unchanged after render',()=>{
  const before=JSON.stringify({catalog,sourceM02});
  const first=buildCharacterGallery({catalog,sourceM02});
  assert.deepEqual(buildCharacterGallery({catalog,sourceM02}),first);
  assert.equal(JSON.stringify({catalog,sourceM02}),before);
});

test('M10 cannot silently reinterpret altered M02 correspondence',()=>{
  const changed=structuredClone(sourceM02);
  changed.ten_star_relations[0][4]='別の動物';
  assert.throws(()=>buildCharacterGallery({catalog,sourceM02:changed}),{code:'M10_CATALOG_INVALID'});
  changed.ten_star_relations[0][4]=sourceM02.ten_star_relations[0][4];
  changed.twelve_stages[0][2]='別の式神';
  assert.throws(()=>validateCharacterCatalog(catalog,changed),{code:'M10_CATALOG_INVALID'});
});

test('no 12 follower star is force-mapped to 12 Mochi types',()=>{
  for(const c of [...catalog.ten_main_star,...catalog.twelve_follower_star]){
    assert.equal(c.assignable_from_m08,false);
    assert.equal(c.assignable_from_birth_engine,false);
    assert.equal(Object.hasOwn(c,'mt_id'),false);
  }
  assert.equal(catalog.adoption_rules.five_question_type_mapping,'none_by_design');
});
