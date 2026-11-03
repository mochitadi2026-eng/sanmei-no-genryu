/**
 * N01 study-only comparison of modern Japanese ritsuun-age conventions.
 *
 * Source A: Saruyama Saruko's own comparison of its normal edition and
 *            commissioned "Suzaku" edition, with a reverse example.
 * Source B: Sanmei Stock worked example with 22 counted days.
 *
 * This module deliberately DOES NOT calculate natal pillars, a real
 * individual's start age, or a switching YEAR. A school endorsement or
 * one universally correct convention is not claimed.
 */
export const POLICY_STUDY_VERSION='n01-ritsun-policy-comparison-v0.1';
export const POLICY_SOURCES=Object.freeze({
  reverse_example:'https://ameblo.jp/sarukoblog/entry-12404176287.html',
  shared_day_count:'https://sanmei-stock.com/output-propositions/calculation-method/'
});
export const STUDY_POLICIES=Object.freeze({
  NORMAL_EXAMPLE:Object.freeze({
    id:'saruyama_normal_2018_example',
    day_count_rule:'exclusive_elapsed_days_for_reverse_example',
    rounding_rule:'nearest_integer_half_up',
    source:POLICY_SOURCES.reverse_example,
    authorized_as_official_school_rule:false
  }),
  SUZAKU_EXAMPLE:Object.freeze({
    id:'saruyama_suzaku_2018_example',
    day_count_rule:'inclusive_endpoints_for_reverse_example',
    rounding_rule:'ceiling',
    source:POLICY_SOURCES.reverse_example,
    authorized_as_official_school_rule:false
  })
});
const allowedMode1=['fixture_mode','gap_days'];
const allowedMode2=['fixture_mode','counted_days'];
function invalid(message){
  const e=new TypeError(message);e.code='N01_RITSUN_STUDY_INVALID';throw e;
}
function validFields(input,expected,mode){
  if(!input||typeof input!=='object'||Array.isArray(input)
    ||Object.keys(input).length!==expected.length
    ||expected.some(k=>!Object.hasOwn(input,k))
    ||Object.keys(input).some(k=>!expected.includes(k))
    ||input.fixture_mode!==mode)
    invalid('This tool accepts only an anonymous integer day-count fixture');
}
function validDayCount(days){
  if(!Number.isInteger(days)||days<0||days>31)
    invalid('Day count must be whole 0..31, never a calendar date');
}
function boundedAge(raw){
  return Math.max(1,Math.min(10,raw));
}
function roundHalfUp(numerator){return Math.floor(numerator/3+0.5);}
function ceilThird(numerator){return Math.ceil(numerator/3);}
function studyResult(count,rounding,mode){
  const unbounded=rounding==='nearest_integer_half_up'
    ?roundHalfUp(count):ceilThird(count);
  const startAge=boundedAge(unbounded);
  return {
    counted_days:count,
    quotient_numerator:count,
    quotient_denominator:3,
    rounding_rule:rounding,
    start_age_display: startAge,
    hypothetical_age_bands:[
      {step:1,from_age:startAge,to_age:startAge+9},
      {step:2,from_age:startAge+10,to_age:startAge+19}
    ],
    calculated_start_date:null,
    inferred_personal_event:null,
    case_scope:mode
  };
}
/**
 * STRICTLY a synthetic reverse-direction gap, illustrated by a public
 * hypothetical 2/4→2/11 example. Forward day-inclusion was not verified
 * from this reverse example, so it is not extrapolated here.
 */
export function compareReverseRitsuunStudy(input){
  validFields(input,allowedMode1,'anonymous_reverse_gap_fixture');
  validDayCount(input.gap_days);
  const gap=input.gap_days;
  const usual=studyResult(gap,'nearest_integer_half_up','reverse_example_only');
  const suzaku=studyResult(gap+1,'ceiling','reverse_example_only');
  return {
    version:POLICY_STUDY_VERSION,
    status:'synthetic_comparison_only',
    direction:'reverse_example_only',
    production_usable:false,
    natal_chart_computed:false,
    da_yun_start_year_computed:false,
    official_school_rules_certified:false,
    source:POLICY_SOURCES.reverse_example,
    standard:usual,
    suzaku,
    age_difference:suzaku.start_age_display-usual.start_age_display,
    note:'公表された逆行計算例の差分を数値で比較したもの。実人物の起運年齢ではなく、両方式を学校が公式認証した証拠でもありません。'
  };
}
/**
 * Compare ONLY different rounding of the SAME already-counted integer.
 * Does not decide which days should be counted for any birth.
 */
export function compareSharedDayCountStudy(input){
  validFields(input,allowedMode2,'anonymous_precounted_days_fixture');
  validDayCount(input.counted_days);
  const days=input.counted_days;
  return {
    version:POLICY_STUDY_VERSION,
    status:'synthetic_rounding_only',
    production_usable:false,
    official_school_rules_certified:false,
    source:POLICY_SOURCES.shared_day_count,
    normal:studyResult(days,'nearest_integer_half_up','shared_count_only'),
    ceil:studyResult(days,'ceiling','shared_count_only'),
    note:'日数の数え方を固定したときの丸め比較だけ。朱雀版が同じ日数を用いるとの主張ではありません。'
  };
}
