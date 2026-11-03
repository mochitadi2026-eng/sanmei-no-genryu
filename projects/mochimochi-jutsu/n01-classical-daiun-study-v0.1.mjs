/**
 * N01 classical da-yun study. SYNTHETIC NUMBERS ONLY:
 * NOT the user's calculated da-yun, nor a Japanese-sanmei adoption.
 *
 * Classical textual model:
 *   yang male / yin female => forward from month pillar;
 *   yin male / yang female => backward;
 *   3 days between synthetic birth and a relevant Jie => 1 year.
 *
 * Unknown: rounding, actual birth/term instants, legal clocks, age convention,
 * modern school's adopted formula. Never uses/returns actual birth dates.
 */
export const STUDY_VERSION='n01-classical-daiun-study-v0.1';
function fail(message){const e=new TypeError(message);e.code='CLASSICAL_STUDY_INVALID';throw e;}
function object(x){return x!==null&&typeof x==='object'&&!Array.isArray(x);}
function buildCycle(m02){
 if(!object(m02)||m02.version!=='0.1'||!Array.isArray(m02.stems)
  ||m02.stems.length!==10||!Array.isArray(m02.branches)||m02.branches.length!==12)
  fail('M02 core symbols version not supported');
 const stems=m02.stems.map(row=>row[0]),branches=m02.branches;
 if(new Set(stems).size!==10||new Set(branches).size!==12)fail('Duplicate stem or branch');
 return Array.from({length:60},(_,i)=>stems[i%10]+branches[i%12]);
}
export function studyClassicalDaYun(params={}){
 if(!object(params))fail('Synthetic study object required');
 const allowed=['source_mode','m02','year_stem','traditional_group','days_to_jie','month_pillar'];
 if(Object.keys(params).some(k=>!allowed.includes(k))
   ||allowed.some(k=>!Object.hasOwn(params,k)))fail('Unknown or missing fields');
 const {source_mode,m02,year_stem,traditional_group,days_to_jie,month_pillar}=params;
 if(source_mode!=='synthetic_study_only')fail('Real-world birth dates are never accepted');
 const c=buildCycle(m02);
 const stemRow=m02.stems.find(row=>row[0]===year_stem);
 if(!stemRow||!['陽','陰'].includes(stemRow[2]))fail('Unknown stem polarity');
 if(!['male','female','not_selected'].includes(traditional_group))
  fail('Classical historical grouping must be explicitly selected or omitted');
 if(!Number.isInteger(days_to_jie)||days_to_jie<0||days_to_jie>31)
  fail('days_to_jie must be synthetic whole days 0 to 31');
 const i=c.indexOf(month_pillar);
 if(i<0)fail('Invalid 60-cycle month pillar');
 if(traditional_group==='not_selected')return {
   version:STUDY_VERSION,status:'not_selected',
   production_usable:false,daiun_adopted:false,
   reason:'HISTORICAL_TWO_GROUP_RULE_NOT_SELECTED'
 };
 const forward=(stemRow[2]==='陽')===(traditional_group==='male');
 const direction=forward?'forward':'backward';
 const step=forward?1:-1;
 const pillars=Array.from({length:10},(_,n)=>{
  const index=(i+step*(n+1)+6000)%60;
  return {sequence:n+1,pillar:c[index],from_age_years_unrounded:days_to_jie/3+n*10};
 });
 return {
   version:STUDY_VERSION,status:'synthetic_arithmetic_only',
   production_usable:false,daiun_adopted:false,
   direction,start_age_years_unrounded:days_to_jie/3,
   days_to_jie,starting_month_pillar:month_pillar,pillars,
   source_layer:'F_textual_rule_for_study',
   source_refs:[
    'https://zh.wikisource.org/zh-hant/三命通會/卷二',
    'https://huamuchengxi.com/chapter/12802.html'
   ],
   note:'三日一年の算術モデルのみ。時刻精度、端数処理、男女分類の適用、実年齢、転機年は検証・採用していません。'
 };
}
