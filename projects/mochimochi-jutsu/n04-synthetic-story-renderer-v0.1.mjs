/**
 * N04 preview: synthetic annual signals to short, authored prose.
 * No LLM, natal calculation, live birth information, or prognostic claims.
 */
import {buildSyntheticStoryBlueprint} from './n02-story-anchor-selector-v0.1.mjs';

export const RENDERER_VERSION='n04-synthetic-story-renderer-v0.1';
const PREVIEW_NOTICE='【文章試作】この年とテーマは架空の入力から選んだものです。実際の生年月日や過去の出来事を鑑定した結果ではありません。';
function sceneParagraph(anchor){
 const year=anchor.year,motif=anchor.motif;
 return [
  year+'年を、この試作の年表では「'+motif.title+'」というテーマの年として取り上げます。',
  'もし日々の暮らしに置き換えて考えるなら、'+motif.example_scenes[0]+'。あるいは、'+motif.example_scenes[1]+'。',
  'ここで扱いたいのは、「'+motif.tension+'」という二つの思いが同時に生まれることです。',
  'あなたにその出来事が起きたと決めるのではなく、この年を振り返るための一つの見方として読んでみてください。'
 ].join('\n\n');
}
function bridgeParagraph(bp){
 if(bp.anchors.length<2)return null;
 const a=bp.anchors[0],b=bp.anchors[1];
 if(bp.bridge==='repeated_theme')
  return a.year+'年と'+b.year+'年には、同じ「'+a.motif.title+'」が並びます。二度出てきたからといって、似た出来事が起きたという意味ではありません。同じ言葉が、違う年にはどう感じられるのか。そこに物語の手がかりがあるかもしれません。';
 if(bp.bridge==='defined_editorial_transition')
  return a.year+'年の「'+a.motif.title+'」から、'+b.year+'年の「'+b.motif.title+'」へ。今回の編集辞書ではこの順序を、一つのテーマが別の形へ移る流れとして扱っています。実際にそうした経験があったかどうかは、本人にしか分かりません。';
 return a.year+'年と'+b.year+'年は、暦の仮のシグナルが違う方向を向いています。無理に一本の因果関係にせず、それぞれの年に別の問いを置きます。';
}
export function renderSyntheticReading(input){
 const bp=buildSyntheticStoryBlueprint(input);
 if(bp.status==='insufficient_fixture_signals'){
  return {
   version:RENDERER_VERSION,status:'not_enough_mock_data',production_usable:false,
   notice:PREVIEW_NOTICE,calendar_sources:[],
   sections:[{id:'fallback',heading:'年の読み解きは保留しています',body:'根拠を持って注目する時期を選べないため、過去の出来事を推測する文章は生成しません。'}]
  };
 }
 const lead=bp.anchors.length===2 && bp.bridge==='repeated_theme'
   ?'何年か離れた二つの時期に、似た言葉が顔を出します。'
   :bp.anchors.length===2 && bp.bridge==='defined_editorial_transition'
   ?'人生には、ひとつのテーマが別の形に変わっていくように感じられる時期があります。'
   :'過去を振り返るとき、異なる時期を無理につなげないという読み方もあります。';
 const sections=[{
   id:'prologue',heading:'あの頃の自分に、いま聞いてみたいこと',
   body:lead+' 年表に置かれた年を手がかりに、身近な場面からゆっくり眺めてみましょう。'
 }];
 bp.anchors.forEach((anchor,i)=>{
   sections.push({
     id:'past_'+(i+1),
     heading:'第'+(i+1)+'章｜'+anchor.year+'年　'+anchor.motif.title,
     body:sceneParagraph(anchor),year:anchor.year,
     theme_id:anchor.theme_id,evidence_refs:[...anchor.evidence_refs]
   });
 });
 const bridge=bridgeParagraph(bp);
 if(bridge)sections.push({id:'bridge',heading:'ふたつの時期を並べてみると',body:bridge});
 sections.push({
   id:'present',heading:'今のあなた',
   body:'今の自分が何を選びたいかは、過去の年号だけでは決まりません。ここには、別の5問診断で選んだ現在の気持ちを、暦とは区別して置く予定です。'
 });
 sections.push({
   id:'future',heading:'これからの時間',
   body:'未来の暦はまだこの試作に接続していないため、特定年の予測は表示していません。'
 });
 sections.push({
   id:'ending',heading:'物語の続きを選ぶのは',
   body:'もしあの頃の自分と話せるなら、今の自分はどんなことを伝えたいでしょう。'
 });
 return {
   version:RENDERER_VERSION,status:'synthetic_preview_only',production_usable:false,
   notice:PREVIEW_NOTICE,
   selected_years:bp.anchors.map(a=>a.year),
   calendar_sources:bp.anchors.flatMap(a=>a.evidence_refs),
   bridge:bp.bridge,sections
 };
}
